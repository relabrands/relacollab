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
                    `https://graph.facebook.com/v19.0/${igUserId}?fields=biography,followers_count,media_count,profile_picture_url,username,name&access_token=${longLivedAccessToken}`
                );
                const userData = userDetailsResponse.data;

                // Calculate Engagement Rate (fetch recent media)
                // Note: Insights API limit is strict. We just get basic media for calculation.
                const mediaResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/${igUserId}/media?fields=like_count,comments_count&limit=10&access_token=${longLivedAccessToken}`
                );
                const mediaItems = mediaResponse.data.data || [];
                let totalEngagement = 0;
                let totalLikes = 0;
                let totalComments = 0;
                mediaItems.forEach(item => {
                    totalEngagement += (item.like_count || 0) + (item.comments_count || 0);
                    totalLikes += (item.like_count || 0);
                    totalComments += (item.comments_count || 0);
                });
                const followers = userData.followers_count || 1;
                const avgEngagement = mediaItems.length > 0 ? totalEngagement / mediaItems.length : 0;
                const avgLikes = mediaItems.length > 0 ? Math.round(totalLikes / mediaItems.length) : 0;
                const avgComments = mediaItems.length > 0 ? Math.round(totalComments / mediaItems.length) : 0;
                const engagementRate = ((avgEngagement / followers) * 100).toFixed(2);

                const expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000); // approx 60 days

                // Save to Firestore if userId provided
                if (userId) {
                    await db.collection("users").doc(userId).set({
                        socialHandles: { instagram: userData.username },
                        instagramConnected: true,
                        instagramId: igUserId,
                        instagramUsername: userData.username,
                        instagramName: userData.name || userData.username, // New
                        instagramProfilePicture: userData.profile_picture_url, // New
                        instagramAccessToken: longLivedAccessToken,
                        instagramTokenExpiresAt: expiresAt,
                        instagramMetrics: {
                            followers: parseInt(userData.followers_count || "0"),
                            engagementRate: parseFloat(engagementRate || "0"),
                            avgLikes: avgLikes,
                            avgComments: avgComments,
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

// ==========================================
// 2. GET MEDIA (CON MÉTRICAS COMPLETAS: Saved, Shares, Reach)
// ==========================================
exports.getInstagramMedia = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: "Method Not Allowed" });

        const userId = req.body.userId || req.query.userId;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        try {
            const mediaData = await getInstagramMediaInternal(userId);
            return res.json({ success: true, data: mediaData });
        } catch (error) {
            console.error("Error fetching media:", error.message);
            return res.status(500).json({ error: "System Error", details: error.message });
        }
    });
});

async function getInstagramMediaInternal(userId) {
    // 1. Obtener Token
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");

    const userData = userDoc.data();
    const accessToken = userData.instagramAccessToken;
    const igUserId = userData.instagramId;

    if (!accessToken || !igUserId) throw new Error("Instagram not connected");

    // 2. Obtener Lista Básica
    const response = await axios.get(
        `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=18&access_token=${accessToken}`
    );

    const rawPosts = response.data.data || [];

    // 3. ENRIQUECER CON INSIGHTS (EN PARALELO)
    const postsWithMetrics = await Promise.all(rawPosts.map(async (item) => {
        // Métricas Base
        let metrics = {
            views: 0,
            reach: 0,
            saved: 0,
            shares: 0,
            interactions: (item.like_count || 0) + (item.comments_count || 0)
        };

        try {
            let metricParam = "";
            if (item.media_type === 'VIDEO' || item.media_product_type === 'REELS') {
                metricParam = "plays,reach,saved,shares";
            } else {
                metricParam = "reach,saved,shares";
            }

            const insightRes = await axios.get(
                `https://graph.facebook.com/v19.0/${item.id}/insights?metric=${metricParam}&access_token=${accessToken}`
            );

            const data = insightRes.data.data;
            const getVal = (name) => {
                const m = data.find(x => x.name === name);
                return m ? m.values[0].value : 0;
            };

            metrics.views = getVal('plays') || getVal('impressions') || 0;
            metrics.reach = getVal('reach') || 0;
            metrics.saved = getVal('saved') || 0;
            metrics.shares = getVal('shares') || 0;

            const apiInteractions = getVal('total_interactions');
            if (apiInteractions > 0) metrics.interactions = apiInteractions;

        } catch (err) {
            // Ignore insight errors
        }

        return {
            id: item.id,
            caption: item.caption || "",
            media_type: item.media_type,
            media_product_type: item.media_product_type,
            thumbnail_url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
            permalink: item.permalink,
            timestamp: item.timestamp,
            like_count: item.like_count || 0,
            comments_count: item.comments_count || 0,
            view_count: metrics.views,
            reach: metrics.reach,
            saved: metrics.saved,
            shares: metrics.shares,
            total_interactions: metrics.interactions
        };
    }));

    return postsWithMetrics;
}

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
// ==========================================
// 4. GET SINGLE POST METRICS (PARA SUBMIT CONTENT)
// ==========================================
exports.getPostMetrics = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

        const { userId, postId } = req.body;
        if (!userId || !postId) return res.status(400).json({ error: "Missing userId or postId" });

        try {
            // 1. Obtener Token
            const userDoc = await db.collection("users").doc(userId).get();
            if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

            const userData = userDoc.data();
            const accessToken = userData.instagramAccessToken;
            const igUserId = userData.instagramId;

            if (!accessToken) return res.status(400).json({ error: "Instagram not connected" });

            // 2. Buscar el post en la lista reciente (API Graph no busca por shortcode directo)
            // Pedimos 'media_product_type' para saber si es Reel con seguridad
            let mediaItems = [];
            try {
                const response = await axios.get(
                    `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,like_count,comments_count,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,shortcode,video_view_count&limit=50&access_token=${accessToken}`
                );
                mediaItems = response.data.data || [];
            } catch (e) {
                console.error("Error searching media:", e.message);
                throw e;
            }

            // Buscamos el post que coincida con el ID o Permalink
            const foundPost = mediaItems.find(item =>
                (item.permalink && item.permalink.includes(postId)) ||
                (item.shortcode && item.shortcode === postId)
            );

            if (!foundPost) {
                return res.status(404).json({ error: "Post not found in recent media" });
            }

            // 3. Obtener Insights (LÓGICA SEGURA v19.0)
            let detailedMetrics = {};
            try {
                const mediaType = foundPost.media_type;
                const mediaProductType = foundPost.media_product_type;
                let metricsParams = "";

                // REGLA DE ORO:
                // VIDEO/REEL -> plays, reach, saved, total_interactions
                // IMAGE -> impressions, reach, saved, total_interactions
                // (Quitamos 'shares' para evitar errores, ya que total_interactions lo incluye)

                if (mediaType === 'VIDEO' || mediaProductType === 'REELS') {
                    // REELS/VIDEO: reach, saved, shares
                    // Removed: plays (Deprecated/Error in v22+), total_interactions (Invalid)
                    metricsParams = "reach,saved,shares";
                } else {
                    // IMAGE: reach, saved, shares
                    // Removed: impressions (Deprecated/Invalid for new), total_interactions (Invalid)
                    metricsParams = "reach,saved,shares";
                }

                console.log(`Fetching insights for ${foundPost.id} with: ${metricsParams}`);

                const insightsResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/${foundPost.id}/insights?metric=${metricsParams}&access_token=${accessToken}`
                );

                const data = insightsResponse.data.data;
                const getVal = (name) => {
                    const m = data.find(x => x.name === name);
                    return m ? m.values[0].value : 0;
                };

                detailedMetrics = {
                    // Plays metric is deprecated/erroring. Use media fields for views.
                    views: foundPost.video_view_count || foundPost.play_count || foundPost.view_count || 0,
                    reach: getVal('reach') || 0,
                    saved: getVal('saved') || 0,
                    shares: getVal('shares') || 0,
                    // Si total_interactions viene de la API, úsalo. Si no, calcúlalo.
                    interactions: getVal('total_interactions') ||
                        ((foundPost.like_count || 0) + (foundPost.comments_count || 0))
                };

            } catch (insightError) {
                console.warn("Insights fetch failed (using basic stats):", insightError.message);
                if (insightError.response) {
                    console.error("❌ Instagram API Error Body:", JSON.stringify(insightError.response.data, null, 2));
                }
                // Fallback seguro: Si falla la API de insights, al menos devolvemos likes/comments
                detailedMetrics = {
                    views: 0,
                    reach: 0,
                    saved: 0,
                    interactions: (foundPost.like_count || 0) + (foundPost.comments_count || 0)
                };
            }

            // 4. Armar respuesta final
            const metrics = {
                likes: foundPost.like_count || 0,
                comments: foundPost.comments_count || 0,
                type: foundPost.media_type?.toLowerCase(),
                thumbnail: foundPost.thumbnail_url || foundPost.media_url,
                fetchedAt: new Date().toISOString(),
                ...detailedMetrics
            };

            return res.json({ success: true, metrics: metrics });

        } catch (error) {
            console.error("System Error getPostMetrics:", error.message);
            return res.status(500).json({ error: error.message });
        }
    });
});

// Helper to refresh TikTok Access Token
async function refreshTikTokAccessToken(userId, refreshToken) {
    const CLIENT_KEY = "awq1es91fwbixh6h";
    const CLIENT_SECRET = "3nsZQM3umPGn4AQkmrQoQeviFzMv5SNh";

    try {
        const params = new URLSearchParams();
        params.append("client_key", CLIENT_KEY);
        params.append("client_secret", CLIENT_SECRET);
        params.append("grant_type", "refresh_token");
        params.append("refresh_token", refreshToken);

        const response = await axios.post("https://open.tiktokapis.com/v2/oauth/token/", params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const { access_token, expires_in, refresh_token: new_refresh_token, refresh_expires_in } = response.data;

        if (!access_token) {
            throw new Error("Failed to refresh token: " + JSON.stringify(response.data));
        }

        // Update Firestore
        const updateData = {
            tiktokAccessToken: access_token,
            tiktokTokenExpiresAt: Date.now() + (expires_in * 1000),
            // Update refresh token if a new one is returned (it usually rotates)
            ...(new_refresh_token && {
                tiktokRefreshToken: new_refresh_token,
                tiktokRefreshTokenExpiresAt: Date.now() + (refresh_expires_in * 1000)
            })
        };

        await db.collection("users").doc(userId).set(updateData, { merge: true });

        return access_token;
    } catch (error) {
        console.error("Error refreshing TikTok token:", error.message);
        throw error;
    }
}

// ==========================================
// 5. TIKTOK AUTHENTICATION (LIVE)
// ==========================================
exports.authTikTok = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

        const { code, userId } = req.body;
        if (!code) return res.status(400).json({ error: "Missing code" });

        const CLIENT_KEY = "awq1es91fwbixh6h";
        const CLIENT_SECRET = "3nsZQM3umPGn4AQkmrQoQeviFzMv5SNh";
        const REDIRECT_URI = "https://www.relacollab.com/auth/tiktok/callback";

        try {
            // 1. Get Access Token
            const tokenParams = new URLSearchParams();
            tokenParams.append("client_key", CLIENT_KEY);
            tokenParams.append("client_secret", CLIENT_SECRET);
            tokenParams.append("code", code);
            tokenParams.append("grant_type", "authorization_code");
            tokenParams.append("redirect_uri", REDIRECT_URI);

            const tokenResponse = await axios.post("https://open.tiktokapis.com/v2/oauth/token/", tokenParams, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            const { access_token, open_id, expires_in, refresh_token, refresh_expires_in } = tokenResponse.data;

            if (!access_token) {
                console.error("TikTok Token Error:", tokenResponse.data);
                return res.status(400).json({ error: "Failed to obtain access token", details: tokenResponse.data });
            }

            // 2. Get User Info
            // Scopes required: user.info.basic, user.info.stats
            const userFields = "display_name,avatar_url,follower_count,following_count,likes_count";
            const userResponse = await axios.get(`https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`, {
                headers: { "Authorization": `Bearer ${access_token}` }
            });

            const userData = userResponse.data.data?.user || {};

            // 3. Get Recent Videos (for Engagement Rate)
            // Scope required: video.list
            // Sandbox Note: functionality might be limited
            let engagementRate = 0;
            try {
                const videoFields = "id,title,view_count,like_count,comment_count,share_count";
                const videoResponse = await axios.post("https://open.tiktokapis.com/v2/video/list/?fields=" + videoFields, {
                    max_count: 20
                }, {
                    headers: {
                        "Authorization": `Bearer ${access_token}`,
                        "Content-Type": "application/json"
                    }
                });

                const videos = videoResponse.data.data?.videos || [];

                if (videos.length > 0) {
                    let totalEngagement = 0;
                    videos.forEach(v => {
                        totalEngagement += (v.like_count || 0) + (v.comment_count || 0) + (v.share_count || 0);
                    });
                    const avgEngagement = totalEngagement / videos.length;
                    const followers = userData.follower_count || 1;
                    engagementRate = ((avgEngagement / followers) * 100).toFixed(2);
                }
            } catch (vidErr) {
                console.warn("Error fetching TikTok videos:", vidErr.message);
            }

            // 4. Save to Firestore
            if (userId) {
                await db.collection("users").doc(userId).set({
                    tiktokConnected: true,
                    tiktokAccessToken: access_token,
                    tiktokRefreshToken: refresh_token,
                    tiktokOpenId: open_id,
                    tiktokTokenExpiresAt: Date.now() + (expires_in * 1000),
                    tiktokRefreshTokenExpiresAt: Date.now() + (refresh_expires_in * 1000),
                    socialHandles: { tiktok: userData.display_name }, // Update handle
                    tiktokName: userData.display_name, // New
                    tiktokAvatar: userData.avatar_url, // New
                    tiktokMetrics: {
                        followers: userData.follower_count || 0,
                        likes: userData.likes_count || 0,
                        engagementRate: parseFloat(engagementRate),
                        lastUpdated: new Date().toISOString()
                    }
                }, { merge: true });
            }

            return res.json({
                success: true,
                data: {
                    displayName: userData.display_name,
                    followers: userData.follower_count,
                    engagementRate
                }
            });

        } catch (error) {
            console.error("TikTok Auth Error:", error.response?.data || error.message);
            return res.status(500).json({ error: "TikTok Authentication Failed", details: error.message });
        }
    });
});

// ==========================================
// 6. TIKTOK WEBHOOK (VERIFICATION)
// ==========================================
exports.tiktokWebhook = functions.https.onRequest((req, res) => {
    // Log verification requests
    console.log("TikTok Webhook Event:", JSON.stringify(req.body));

    // Always return 200 OK for challenge/verification
    res.status(200).send("OK");
});

// ==========================================
// 7. GET TIKTOK MEDIA
// ==========================================
exports.getTikTokMedia = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

        const { userId, cursor } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        try {
            const result = await getTikTokMediaInternal(userId, cursor);
            return res.json(result);
        } catch (error) {
            console.error("Get TikTok Media Error:", error.message);
            return res.status(500).json({ error: "Failed to fetch TikTok media", details: error.message });
        }
    });
});

async function getTikTokMediaInternal(userId, cursor) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const userData = userDoc.data();
    let accessToken = userData.tiktokAccessToken;

    if (!accessToken) {
        throw new Error("TikTok not connected");
    }

    // Check token expiration (refresh if < 5 mins left)
    const refreshToken = userData.tiktokRefreshToken;
    const tokenExpiresAt = userData.tiktokTokenExpiresAt || 0;

    if (Date.now() > tokenExpiresAt - (5 * 60 * 1000)) {
        console.log("TikTok token expired or expiring soon, refreshing...");
        try {
            if (refreshToken) {
                // This helper updates Firestore too
                accessToken = await refreshTikTokAccessToken(userId, refreshToken);
            } else {
                console.warn("No refresh token found for user", userId);
                // If really expired, block
                if (Date.now() > tokenExpiresAt) {
                    throw new Error("TikTok token expired");
                }
            }
        } catch (refreshErr) {
            console.error("Failed to refresh token:", refreshErr.message);
            throw new Error("TikTok token expired and refresh failed");
        }
    }

    // Fetch Video List
    // https://developers.tiktok.com/doc/tiktok-api-v2-video-list
    const videoFields = "id,title,cover_image_url,share_url,video_description,view_count,like_count,comment_count,share_count,create_time";

    const response = await axios.post("https://open.tiktokapis.com/v2/video/list/?fields=" + videoFields, {
        max_count: 20,
        cursor: cursor || 0
    }, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });

    const { data, error } = response.data;

    if (error && error.code !== "ok") {
        console.error("TikTok API Error:", error);
        throw new Error(error.message);
    }

    const videos = data.videos || [];
    const nextCursor = data.cursor; // Timestamp for next page

    // Map to a standard format
    const mappedVideos = videos.map(v => ({
        id: v.id,
        caption: v.title || v.video_description || "",
        media_type: "VIDEO",
        media_url: v.share_url, // TikTok API v2 might not give direct video file URL for privacy/hotlinking, check docs. usually share_url or embed_html
        thumbnail_url: v.cover_image_url,
        permalink: v.share_url,
        timestamp: new Date(v.create_time * 1000).toISOString(),
        like_count: v.like_count,
        comments_count: v.comment_count,
        view_count: v.view_count,
        share_count: v.share_count
    }));

    return {
        success: true,
        data: mappedVideos,
        cursor: data.has_more ? nextCursor : null
    };
}
const { VertexAI } = require('@google-cloud/vertexai');

// ==========================================
// 8. AI CREATOR MATCH ANALYSIS
// ==========================================
exports.analyzeCreatorMatch = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

        const { creatorId, brandCategory, campaignGoal } = req.body;
        if (!creatorId || !brandCategory) return res.status(400).json({ error: "Missing required fields" });

        try {
            // 1. Fetch Media from both platforms
            const [igMedia, tiktokMedia] = await Promise.allSettled([
                getInstagramMediaInternal(creatorId).catch(e => []),
                getTikTokMediaInternal(creatorId).catch(e => ({ data: [] }))
            ]);

            const igPosts = igMedia.status === 'fulfilled' ? igMedia.value : [];
            const tiktokPosts = tiktokMedia.status === 'fulfilled' ? (tiktokMedia.value.data || []) : [];

            // Combine and sort by date (newest first)
            const allPosts = [...igPosts, ...tiktokPosts]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 15); // Analyze last 15 posts total

            // 2. Format for AI
            const postsData = allPosts.map(p => ({
                platform: p.media_type === 'VIDEO' ? (p.view_count ? 'TikTok' : 'Instagram Reel') : 'Instagram Post',
                caption: p.caption,
                views: p.view_count || p.views || 0,
                likes: p.like_count || 0,
                comments: p.comments_count || 0,
                date: p.timestamp
            }));

            // 3. Call Vertex AI
            // Initialize Vertex with project and location
            const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || 'rela-collab', location: 'us-central1' });
            const model = vertex_ai.preview.getGenerativeModel({
                model: 'gemini-2.5-pro',
                generationConfig: {
                    'maxOutputTokens': 256,
                    'temperature': 0.7,
                }
            });

            const prompt = `
Analiza los siguientes posts del creador para determinar su idoneidad.
Posts recientes: ${JSON.stringify(postsData)}

Campaña de la Marca:
- Categoría: ${brandCategory}
- Objetivo: ${campaignGoal || 'General'}

Tarea:
1. Separa mentalmente los posts por plataforma (Instagram vs TikTok).
2. Para CADA plataforma con datos, calcula la probabilidad de éxito y genera una frase de venta.

Formato de Respuesta (JSON ESTRICTO):
Debes responder ÚNICAMENTE con un objeto JSON válido. No incluyas markdown (backticks) ni texto extra.
Estructura:
{
  "instagram": "Frase para Instagram (si hay datos, si no null)",
  "tiktok": "Frase para TikTok (si hay datos, si no null)"
}

Plantilla de Frase:
"Para esta campaña de [Categoría], el creador [Nombre] tiene un [Probabilidad]% de probabilidad de superar las [Promedio de vistas] vistas en Instagram, basado en sus últimos [N] posts de contenido similar."
(Ajusta "Instagram" a "TikTok" según corresponda).

Contexto adicional:
- Si no hay posts de una plataforma, devuelve null para esa clave.
- Sé realista pero optimista con el ROI.
`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            let text = response.candidates[0].content.parts[0].text;

            // Clean up markdown if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysisJson = JSON.parse(text);

            return res.json({ success: true, analysis: analysisJson, postsAnalyzed: postsData.length });

        } catch (error) {
            console.error("AI Analysis Error:", error);
            return res.status(500).json({ error: "AI Analysis Failed", details: error.message });
        }
    });
});
