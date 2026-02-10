require('dotenv').config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.auth = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // API Endpoint: /api/auth/instagram/exchange
        if (req.method === 'POST') {
            const { code, userId } = req.body;

            if (!code) {
                return res.status(400).json({ error: "No code provided" });
            }

            try {
                // 1. Exchange Code for Facebook User Access Token
                const tokenResponse = await axios.get(
                    "https://graph.facebook.com/v19.0/oauth/access_token",
                    {
                        params: {
                            client_id: "1253246110020541",
                            client_secret: "04f86c0efe01c2017f0452bed26212f1",
                            redirect_uri: "https://relacollab.com/auth/facebook/callback",
                            code: code.toString(),
                        }
                    }
                );

                const { access_token } = tokenResponse.data;

                // 1.5 Fetch Permissions to debug
                const permissionsResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/me/permissions?access_token=${access_token}`
                );
                const permissions = permissionsResponse.data.data;
                const grantedPermissions = permissions.filter(p => p.status === 'granted').map(p => p.permission);
                console.log("Granted Permissions:", grantedPermissions);

                // 2. Fetch Pages to find connected Instagram Business Account
                const pagesResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url,followers_count}&limit=100&access_token=${access_token}`
                );

                const pages = pagesResponse.data.data;
                const connectedPage = pages.find(page => page.instagram_business_account);

                // DEBUG LOGGING
                console.log(`Found ${pages.length} pages.`);
                const pagesDebug = pages.map(p => ({
                    name: p.name,
                    hasIg: !!p.instagram_business_account,
                    igId: p.instagram_business_account?.id
                }));
                console.log("Pages debug info:", JSON.stringify(pagesDebug));

                if (!connectedPage) {
                    return res.status(400).json({
                        error: "No Instagram Business Account found",
                        details: `We found ${pages.length} pages. Granted Permissions: [${grantedPermissions.join(', ')}]. Pages found: [${pages.map(p => p.name).join(", ")}]. None of them seem to have an Instagram Business Account linked. Please check that you granted 'pages_show_list' and 'instagram_basic' permissions.`
                    });
                }

                const igAccount = connectedPage.instagram_business_account;
                const igUserId = igAccount.id;

                // 3. Fetch User Info & Metrics from IG Graph API
                // We use the Page token or User token? 
                // We can use the User token (access_token) if permissions are granted.
                // Or we can use the Page Access Token?
                // Usually User Token with page manage permissions works.
                // Let's use the User Access Token we just got. It's long-lived?
                // Facebook User tokens are usually short-lived (1-2 hours) unless we exchange them.
                // But for server-side flow, the initial exchange usually gives a long-lived one? 
                // Actually, standard OAuth gives short-lived. We should exchange for long-lived URL.
                // GET /oauth/access_token?grant_type=fb_exchange_token...

                // Let's do the exchange for long-lived token mostly for reliability
                const longLivedTokenResponse = await axios.get(
                    "https://graph.facebook.com/v19.0/oauth/access_token",
                    {
                        params: {
                            grant_type: "fb_exchange_token",
                            client_id: "1253246110020541",
                            client_secret: "04f86c0efe01c2017f0452bed26212f1",
                            fb_exchange_token: access_token
                        }
                    }
                );
                const longLivedAccessToken = longLivedTokenResponse.data.access_token;

                // Fetch extra details if needed (followers, media count) from the IG User node
                const userDetailsResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/${igUserId}?fields=biography,followers_count,media_count,profile_picture_url,username&access_token=${longLivedAccessToken}`
                );
                const userData = userDetailsResponse.data;

                // Calculate Engagement Rate (fetch recent media)
                // Note: Insights API limit is strict. We just get basic media for calculation.
                const mediaResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/${igUserId}/media?fields=like_count,comments_count&limit=10&access_token=${longLivedAccessToken}`
                );
                const mediaItems = mediaResponse.data.data || [];
                let totalEngagement = 0;
                mediaItems.forEach(item => {
                    totalEngagement += (item.like_count || 0) + (item.comments_count || 0);
                });
                const followers = userData.followers_count || 1;
                const avgEngagement = mediaItems.length > 0 ? totalEngagement / mediaItems.length : 0;
                const engagementRate = ((avgEngagement / followers) * 100).toFixed(2);

                const expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000); // approx 60 days

                // Save to Firestore if userId provided
                if (userId) {
                    await db.collection("users").doc(userId).set({
                        socialHandles: { instagram: userData.username },
                        instagramConnected: true,
                        instagramId: igUserId,
                        instagramUsername: userData.username,
                        instagramAccessToken: longLivedAccessToken,
                        instagramTokenExpiresAt: expiresAt,
                        instagramMetrics: {
                            followers: parseInt(userData.followers_count || "0"),
                            engagementRate: parseFloat(engagementRate || "0"),
                            lastUpdated: new Date().toISOString()
                        }
                    }, { merge: true });
                }

                return res.json({
                    success: true,
                    data: {
                        id: userData.id,
                        username: userData.username,
                        engagementRate: engagementRate,
                        access_token: longLivedAccessToken
                    }
                });

            } catch (error) {
                console.error("Instagram Auth Error:", error.response?.data || error.message);
                return res.status(500).json({
                    error: "Authentication Failed",
                    details: error.response?.data?.error?.message || error.message
                });
            }
        }

        // Fallback or other routes
        res.status(404).json({ error: "Not Found" });
    });
});

exports.getInstagramMedia = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Allow GET for testing if needed, but primarily POST
        if (req.method !== 'POST' && req.method !== 'GET') {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const userId = req.body.userId || req.query.userId;
        if (!userId) {
            console.error("getInstagramMedia: Missing userId");
            return res.status(400).json({ error: "Missing userId" });
        }

        try {
            console.log(`Fetching media for user: ${userId}`);
            const userDoc = await db.collection("users").doc(userId).get();
            if (!userDoc.exists) {
                console.error(`User ${userId} not found`);
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            const accessToken = userData.instagramAccessToken;

            if (!accessToken) {
                console.warn(`User ${userId} has no Instagram access token`);
                return res.status(400).json({ error: "Instagram not connected" });
            }

            // Fetch Media from Instagram Graph API (Business)
            try {
                // Requires the IG User ID (which we saved as instagramId)
                const igUserId = userData.instagramId;

                // Note: v19.0 endpoint
                const response = await axios.get(
                    `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=18&access_token=${accessToken}`
                );

                const mediaItems = response.data.data.map(item => ({
                    id: item.id,
                    caption: item.caption || "",
                    media_type: item.media_type,
                    // For VIDEO, check thumbnail_url. If missing, leave undefined so frontend uses video tag. For IMAGE, use media_url.
                    thumbnail_url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
                    permalink: item.permalink,
                    timestamp: item.timestamp,
                    like_count: item.like_count || 0,
                    comments_count: item.comments_count || 0
                }));

                return res.json({ success: true, data: mediaItems });
            } catch (apiError) {
                console.error("Instagram API Error:", apiError.response?.data || apiError.message);
                // Return a 200 with success: false so client doesn't throw generic 500
                return res.json({
                    success: false,
                    error: "Instagram API Error",
                    details: apiError.response?.data?.error?.message || apiError.message
                });
            }

        } catch (error) {
            console.error("System Error fetching media:", error.message);
            return res.status(500).json({
                error: "System Error",
                details: error.message
            });
        }
    });
});

// Initialized lazily inside functions or using process.env
const stripe = require('stripe');

exports.createCheckoutSession = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { priceId, successUrl, cancelUrl, userId, mode } = req.body;

        if (!priceId || !successUrl || !cancelUrl || !userId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        try {
            const stripeClient = stripe(process.env.STRIPE_SECRET || 'sk_test_placeholder');
            const session = await stripeClient.checkout.sessions.create({
                mode: mode || 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                success_url: successUrl,
                cancel_url: cancelUrl,
                client_reference_id: userId,
                metadata: {
                    userId: userId
                }
            });

            res.json({ sessionId: session.id, url: session.url });
        } catch (error) {
            console.error("Stripe Checkout Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

    let event;

    try {
        const stripeClient = stripe(process.env.STRIPE_SECRET || 'sk_test_placeholder');
        event = stripeClient.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (userId) {
            console.log(`Payment successful for user ${userId}`);

            const updateData = {
                subscriptionStatus: 'active',
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                updatedAt: new Date().toISOString()
            };

            await db.collection("users").doc(userId).set(updateData, { merge: true });

            await db.collection("users").doc(userId).collection("payments").add({
                amount: session.amount_total / 100,
                currency: session.currency,
                status: session.payment_status,
                created: new Date().toISOString(),
                stripeSessionId: session.id,
                invoiceId: session.invoice || null
            });
        }
    }

    res.json({ received: true });
});

// Get Instagram Post Metrics
exports.getPostMetrics = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { userId, postId } = req.body;

        if (!userId || !postId) {
            return res.status(400).json({ error: "Missing userId or postId" });
        }

        try {
            // Get user's access token
            const userDoc = await db.collection("users").doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            const accessToken = userData.instagramAccessToken;

            if (!accessToken) {
                return res.status(400).json({ error: "Instagram not connected" });
            }

            // Fetch recent media to find the post by shortcode/permalink
            // We cannot fetch by shortcode directly in Basic Display API
            console.log(`Searching for post with shortcode ${postId} in user media...`);

            try {
                // Fetch recent media (limit 50 to be safe)
                // Try to get view counts first (video_view_count, play_count, view_count)
                // Reduced limit to 25 to avoid timeouts and large payloads
                // Fetch recent media (limit 25)
                const igUserId = userData.instagramId;
                let mediaItems = [];

                try {
                    const response = await axios.get(
                        `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,like_count,comments_count,media_type,media_url,thumbnail_url,permalink,timestamp,shortcode&limit=25&access_token=${accessToken}`
                    );
                    mediaItems = response.data.data || [];
                } catch (e) {
                    console.error("Error fetching user media:", e.message);
                    throw e;
                }

                // Find the post that contains the shortcode in its permalink
                const foundPost = mediaItems.find(item => item.permalink && item.permalink.includes(postId));

                if (!foundPost) {
                    console.warn(`Post with shortcode ${postId} not found in last 50 posts`);
                    return res.status(404).json({
                        error: "Post not found or too old",
                        details: "Could not find this post in your recent media. Please ensure it's on the connected account."
                    });
                }

                console.log("Found post:", foundPost.id);
                const mediaId = foundPost.id;
                let detailedMetrics = {};

                // TAREA 1: Detailed Metrics via Graph API
                // Try to fetch insights, but fallback to basic if token is not valid for Graph API (Basic Display vs Graph API)
                try {
                    // Step 2: Get Media Type & Basic Interactions from Graph API
                    // Note: accessing graph.facebook.com requires Graph API token. Basic Display uses graph.instagram.com.
                    // We attempt this, if it fails, we fall back.
                    // Actually, since we found the post via Basic Display API (graph.instagram.com), the ID is a Basic Display ID.
                    // For Graph API, IDs might differ? Usually they are compatible if the user is the same.
                    // Let's assume we use the same token.

                    // Check media_type from foundPost to skip extra call if possible, but user asked for explicit flow.
                    // We will use foundPost.media_type which is reliable.


                    const mediaType = foundPost.media_type;
                    let metricsParams = "";

                    // Safe metrics based on API documentation
                    if (mediaType === 'VIDEO' || mediaType === 'REELS') {
                        // Reel/Video: plays, reach, saved, shares
                        // Note: 'shares' is available for Reels. standard Video might fail if it's not a Reel.
                        // To be safe, try 'plays,reach,saved' combined with 'shares,total_interactions' if Reel.
                        // But since we can't easily distinguish "Reel vs Video" perfectly (media_type is just VIDEO for both sometimes, though fields might differ),
                        // let's try the Reel set. If it fails, catch and try safe set? 
                        // Simplified: 'plays,reach,saved'. 'shares' often causes 400 on non-reels.
                        // BUT user wants shares.
                        // Let's try: 'plays,reach,saved,shares,total_interactions'
                        // If it fails, we will catch and fallback to basic.
                        // Actually, let's refine: 
                        // v19.0: Reels support 'shares' and 'total_interactions'.
                        metricsParams = "plays,reach,saved,shares,total_interactions";
                    } else {
                        // Image/Carousel
                        // 'total_interactions' is NOT a valid metric for Image/Carousel insights in v19.0.
                        // 'shares' is also NOT valid.
                        // Valid: 'impressions,reach,saved,engagement'
                        metricsParams = "impressions,reach,saved,engagement";
                    }

                    // Attempt fetching insights
                    let insightsResponse;
                    try {
                        insightsResponse = await axios.get(
                            `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${metricsParams}&access_token=${accessToken}`
                        );
                    } catch (e1) {
                        // If failed, maybe due to invalid metric (e.g. shares on standard video). Try safer set.
                        console.warn("First attempt detailed insights failed, trying fallback details:", e1.message);
                        if (mediaType === 'VIDEO' || mediaType === 'REELS') {
                            metricsParams = "plays,reach,saved";
                        } else {
                            metricsParams = "impressions,reach,saved";
                        }
                        insightsResponse = await axios.get(
                            `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${metricsParams}&access_token=${accessToken}`
                        );
                    }

                    const insights = insightsResponse.data.data;
                    const insightsMap = {};
                    insights.forEach(i => insightsMap[i.name] = i.values[0].value);

                    // Mapping
                    if (mediaType === 'VIDEO' || mediaType === 'REELS') {
                        detailedMetrics = {
                            views: insightsMap['plays'] || foundPost.video_view_count || 0,
                            reach: insightsMap['reach'] || 0,
                            saved: insightsMap['saved'] || 0,
                            shares: insightsMap['shares'] || 0,
                            interactions: insightsMap['total_interactions'] ||
                                ((foundPost.like_count || 0) + (foundPost.comments_count || 0) + (insightsMap['saved'] || 0))
                        };
                    } else {
                        detailedMetrics = {
                            views: insightsMap['impressions'] || 0, // impressions as views
                            reach: insightsMap['reach'] || 0,
                            saved: insightsMap['saved'] || 0,
                            shares: 0, // Not available for image
                            interactions: insightsMap['engagement'] ||
                                ((foundPost.like_count || 0) + (foundPost.comments_count || 0) + (insightsMap['saved'] || 0))
                        };
                    }

                    console.log("Fetched detailed insights successfully");

                } catch (insightError) {
                    console.warn("Could not fetch detailed insights (likely Basic Display token):", insightError.message);
                    // Fallback to basic metrics we already have
                    detailedMetrics = {
                        views: foundPost.video_view_count || foundPost.play_count || foundPost.view_count || 0,
                        // No reach/saved/shares in Basic Display
                    };
                }

                // Combine with basic counts
                const metrics = {
                    likes: foundPost.like_count || 0,
                    comments: foundPost.comments_count || 0,
                    type: foundPost.media_type?.toLowerCase() || 'image',
                    thumbnail: foundPost.thumbnail_url || foundPost.media_url || '',
                    fetchedAt: new Date().toISOString(),
                    ...detailedMetrics
                };

                return res.json({
                    success: true,
                    metrics: metrics
                });

            } catch (apiError) {
                console.error("Instagram API Error Details:", apiError.response?.data || apiError.message);
                return res.status(500).json({
                    error: "Failed to fetch media list from Instagram",
                    details: apiError.response?.data?.error?.message || apiError.message
                });
            }

        } catch (error) {
            console.error("Error in getPostMetrics:", error.message);
            return res.status(500).json({
                error: "System Error",
                details: error.message
            });
        }
    });
});
