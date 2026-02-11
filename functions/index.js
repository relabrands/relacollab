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

// ==========================================
// 2. GET MEDIA (CON MÉTRICAS COMPLETAS: Saved, Shares, Reach)
// ==========================================
exports.getInstagramMedia = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Permitir POST y GET
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

            // 2. Obtener Lista Básica
            // Pedimos media_product_type para saber si es Reel
            const response = await axios.get(
                `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=18&access_token=${accessToken}`
            );

            const rawPosts = response.data.data || [];

            // 3. ENRIQUECER CON INSIGHTS (EN PARALELO)
            const postsWithMetrics = await Promise.all(rawPosts.map(async (item) => {
                // Métricas Base (vienen directo del post)
                let metrics = {
                    views: 0,
                    reach: 0,
                    saved: 0,
                    shares: 0,
                    interactions: (item.like_count || 0) + (item.comments_count || 0)
                };

                try {
                    let metricParam = "";

                    // LÓGICA CONDICIONAL EXACTA v19.0
                    if (item.media_type === 'VIDEO' || item.media_product_type === 'REELS') {
                        // VIDEO/REEL: Valid: plays, reach, saved, shares
                        // total_interactions does NOT exist for media insights
                        metricParam = "plays,reach,saved,shares";
                    } else {
                        // IMAGEN/CAROUSEL: Valid: reach, saved, shares
                        // impressions: deprecated for new posts (will fail or return 0, better to omit if possible, or keep if we accept partial failure?)
                        // shares: valid for images
                        // total_interactions: invalid
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

                    // Asignar valores
                    metrics.views = getVal('plays') || getVal('impressions') || 0;
                    metrics.reach = getVal('reach') || 0;
                    metrics.saved = getVal('saved') || 0;
                    metrics.shares = getVal('shares') || 0; // Será 0 en imágenes

                    // Total Interactions (API vs Cálculo manual)
                    // A veces la API da un número más exacto que sumar likes+comments
                    const apiInteractions = getVal('total_interactions');
                    if (apiInteractions > 0) metrics.interactions = apiInteractions;

                } catch (err) {
                    // Si falla (post muy viejo o error de API), nos quedamos con likes/comments básicos
                    // console.warn(`Error getting insights for ${item.id}: ${err.message}`);
                }

                return {
                    id: item.id,
                    caption: item.caption || "",
                    media_type: item.media_type,
                    media_product_type: item.media_product_type, // Útil para frontend
                    thumbnail_url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
                    permalink: item.permalink,
                    timestamp: item.timestamp,
                    like_count: item.like_count || 0,
                    comments_count: item.comments_count || 0,

                    // TUS MÉTRICAS NUEVAS
                    views: metrics.views,
                    reach: metrics.reach,
                    saved: metrics.saved,
                    shares: metrics.shares,
                    total_interactions: metrics.interactions
                };
            }));

            return res.json({ success: true, data: postsWithMetrics });

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
                    `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,like_count,comments_count,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,shortcode&limit=50&access_token=${accessToken}`
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
                    // REELS/VIDEO: plays, reach, saved, shares
                    // Removed: total_interactions (Invalid)
                    metricsParams = "plays,reach,saved,shares";
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
                    views: getVal('plays') || getVal('impressions') || 0,
                    reach: getVal('reach') || 0,
                    saved: getVal('saved') || 0,
                    shares: getVal('shares') || 0,
                    // Si total_interactions viene de la API, úsalo. Si no, calcúlalo.
                    interactions: getVal('total_interactions') ||
                        ((foundPost.like_count || 0) + (foundPost.comments_count || 0))
                };

            } catch (insightError) {
                console.warn("Insights fetch failed (using basic stats):", insightError.message);
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
