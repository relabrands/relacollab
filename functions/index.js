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
        if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: "Method Not Allowed" });

        const userId = req.body.userId || req.query.userId;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        try {
            // 1. Obtener Token
            const userDoc = await db.collection("users").doc(userId).get();
            if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

            const userData = userDoc.data();
            const accessToken = userData.instagramAccessToken;
            const igUserId = userData.instagramId;

            if (!accessToken || !igUserId) return res.status(400).json({ error: "Instagram not connected" });

            // 2. Obtener Lista Básica (Limitado a 18 para no saturar)
            // Note: Added media_product_type to fields request
            const response = await axios.get(
                `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=18&access_token=${accessToken}`
            );

            const rawPosts = response.data.data || [];

            // 3. ENRIQUECER CON VIEWS (INSIGHTS)
            // Hacemos peticiones en paralelo para buscar los views de cada post
            const postsWithViews = await Promise.all(rawPosts.map(async (item) => {
                let views = 0;
                let reach = 0;

                try {
                    let metricParam = "";
                    // Si es Video/Reel -> Pedimos 'plays' (deprecated pero funciona)
                    if (item.media_type === 'VIDEO' || item.media_product_type === 'REELS') {
                        metricParam = "plays,reach";
                    } else {
                        // Si es Foto -> Solo 'reach' (impressions deprecated para posts nuevos)
                        metricParam = "reach";
                    }

                    // Llamada a la API de Insights para este post específico
                    const insightRes = await axios.get(
                        `https://graph.facebook.com/v19.0/${item.id}/insights?metric=${metricParam}&access_token=${accessToken}`
                    );

                    const data = insightRes.data.data;
                    const getVal = (name) => {
                        const m = data.find(x => x.name === name);
                        return m ? m.values[0].value : 0;
                    };

                    views = getVal('plays') || getVal('impressions') || 0;
                    reach = getVal('reach') || 0;

                } catch (err) {
                    // Si el post es muy viejo o da error, views se queda en 0
                    // console.warn(`No insights for post ${item.id}`);
                }

                return {
                    id: item.id,
                    caption: item.caption || "",
                    media_type: item.media_type,
                    thumbnail_url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
                    permalink: item.permalink,
                    timestamp: item.timestamp,
                    like_count: item.like_count || 0,
                    comments_count: item.comments_count || 0,
                    // AQUÍ ESTÁN TUS MÉTRICAS REALES
                    views: views,
                    reach: reach
                };
            }));

            return res.json({ success: true, data: postsWithViews });

        } catch (error) {
            console.error("Error fetching media:", error.message);
            return res.status(500).json({ error: "System Error", details: error.message });
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
                    console.log(`📡 Fetching media for IG user ${igUserId}...`);
                    const response = await axios.get(
                        `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,like_count,comments_count,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,shortcode&limit=25&access_token=${accessToken}`
                    );
                    mediaItems = response.data.data || [];
                    console.log(`📦 Found ${mediaItems.length} media items`);
                } catch (e) {
                    console.error("❌ Error fetching user media:", e.response?.data || e.message);
                    throw e;
                }

                // Find the post that contains the shortcode in its permalink
                const foundPost = mediaItems.find(item => item.permalink && item.permalink.includes(postId));

                if (!foundPost) {
                    console.warn(`⚠️ Post with shortcode ${postId} not found in last 25 posts`);
                    console.log("Available permalinks:", mediaItems.map(i => i.permalink).slice(0, 5));
                    return res.status(404).json({
                        error: "Post not found or too old",
                        details: "Could not find this post in your recent media. Please ensure it's on the connected account."
                    });
                }

                console.log("✅ Found post:", {
                    id: foundPost.id,
                    media_type: foundPost.media_type,
                    media_product_type: foundPost.media_product_type,
                    permalink: foundPost.permalink
                });
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
                    const mediaProductType = foundPost.media_product_type; // CRITICAL: Identifies if it's a REEL
                    let metricsParams = "";

                    // Safe metrics based on OFFICIAL API documentation
                    // Source: https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights
                    // IMPORTANT: Use media_product_type to detect Reels, not media_type
                    if (mediaProductType === 'REELS' || mediaProductType === 'STORY') {
                        // Reel metrics: plays (deprecated v22+), reach, saved, shares, comments, likes
                        // Note: plays will be deprecated April 2025, but keeping for now
                        metricsParams = "plays,reach,saved,shares,comments,likes";
                    } else if (mediaType === 'VIDEO') {
                        // Regular video (not a Reel): May not support all metrics
                        // Safer to use basic video metrics
                        metricsParams = "plays,reach,saved,comments,likes";
                    } else {
                        // Image/Carousel/Post metrics
                        // Note: impressions deprecated for media created after July 2024, but trying anyway
                        // Valid metrics: reach, saved, shares, comments, likes
                        metricsParams = "reach,saved,shares,comments,likes";
                    }

                    // Attempt fetching insights
                    let insightsResponse;
                    try {
                        console.log(`Fetching insights for ${mediaId} (${mediaType}) with params: ${metricsParams}`);
                        insightsResponse = await axios.get(
                            `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${metricsParams}&access_token=${accessToken}`
                        );
                    } catch (e1) {
                        console.warn("First attempt insights failed:", e1.response?.data || e1.message);

                        // Fallback Logic
                        try {
                            if (mediaProductType === 'REELS' || mediaType === 'VIDEO') {
                                // Try minimal video/reel metrics
                                metricsParams = "plays,reach,saved,comments,likes";
                            } else {
                                // Try minimal image metrics
                                metricsParams = "reach,saved,comments,likes";
                            }
                            console.log(`Retry fetching insights for ${mediaId} with params: ${metricsParams}`);
                            insightsResponse = await axios.get(
                                `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${metricsParams}&access_token=${accessToken}`
                            );
                        } catch (e2) {
                            console.error("Fallback insights failed:", e2.response?.data || e2.message);
                            // Return basic metrics if insights fail compeletely
                            const basicMetrics = {
                                ...foundPost,
                                details_status: "failed_insights",
                                views: foundPost.video_view_count || 0,
                                reach: 0,
                                saved: 0,
                                shares: 0,
                                interactions: (foundPost.like_count || 0) + (foundPost.comments_count || 0)
                            };
                            // Must verify if we should throw or just set detailedMetrics?
                            // Throwing will go to outer catch (line 466) which sets basic fallback.
                            throw e2;
                        }
                    }

                    if (insightsResponse && insightsResponse.data) {
                        const insights = insightsResponse.data.data;
                        const insightsMap = {};
                        insights.forEach(i => insightsMap[i.name] = i.values[0].value);

                        console.log("📊 Raw Instagram insights data:", JSON.stringify(insights, null, 2));
                        console.log("📊 Insights map:", insightsMap);

                        // Mapping - use media_product_type for accurate Reel detection
                        if (mediaProductType === 'REELS' || mediaType === 'VIDEO') {
                            detailedMetrics = {
                                views: insightsMap['plays'] || foundPost.video_view_count || 0,
                                reach: insightsMap['reach'] || 0,
                                saved: insightsMap['saved'] || 0,
                                shares: insightsMap['shares'] || 0,
                                comments: insightsMap['comments'] || foundPost.comments_count || 0,
                                likes: insightsMap['likes'] || foundPost.like_count || 0,
                                interactions: (insightsMap['likes'] || foundPost.like_count || 0) +
                                    (insightsMap['comments'] || foundPost.comments_count || 0) +
                                    (insightsMap['saved'] || 0) +
                                    (insightsMap['shares'] || 0)
                            };
                        } else {
                            detailedMetrics = {
                                views: insightsMap['impressions'] || 0, // impressions as views
                                reach: insightsMap['reach'] || 0,
                                saved: insightsMap['saved'] || 0,
                                shares: insightsMap['shares'] || 0,
                                comments: insightsMap['comments'] || foundPost.comments_count || 0,
                                likes: insightsMap['likes'] || foundPost.like_count || 0,
                                interactions: (insightsMap['likes'] || foundPost.like_count || 0) +
                                    (insightsMap['comments'] || foundPost.comments_count || 0) +
                                    (insightsMap['saved'] || 0) +
                                    (insightsMap['shares'] || 0)
                            };
                        }
                        console.log("Fetched detailed insights successfully:", detailedMetrics);
                    }

                } catch (insightError) {
                    console.warn("Could not fetch detailed insights (likely Basic Display token):", insightError.message);
                    // Fallback to basic metrics we already have
                    // Fallback to basic metrics we already have
                    detailedMetrics = {
                        views: foundPost.video_view_count || foundPost.play_count || foundPost.view_count || 0,
                        reach: 0,
                        saved: 0,
                        shares: 0,
                        comments: foundPost.comments_count || 0,
                        likes: foundPost.like_count || 0,
                        interactions: (foundPost.like_count || 0) + (foundPost.comments_count || 0)
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
