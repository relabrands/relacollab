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
                // Exchange Code for Access Token
                const tokenResponse = await axios.post(
                    "https://api.instagram.com/oauth/access_token",
                    new URLSearchParams({
                        client_id: "1284439146828000",
                        client_secret: "33bfa485ae62aecb167c499c89f53311",
                        grant_type: "authorization_code",
                        redirect_uri: "https://relacollab.com/auth/facebook/callback",
                        code: code.toString(),
                    })
                );

                const { access_token, user_id } = tokenResponse.data;

                // 2. Exchange for Long-Lived Token
                console.log("Exchanging for long-lived token...");
                const longLivedTokenResponse = await axios.get(
                    "https://graph.instagram.com/access_token",
                    {
                        params: {
                            grant_type: "ig_exchange_token",
                            client_secret: "33bfa485ae62aecb167c499c89f53311",
                            access_token: access_token
                        }
                    }
                );

                const longLivedAccessToken = longLivedTokenResponse.data.access_token;
                const expiresInSeconds = longLivedTokenResponse.data.expires_in; // usually 60 days (5184000)
                const expiresAt = Date.now() + (expiresInSeconds * 1000);

                console.log(`Long-lived token obtained. Expires in ${expiresInSeconds} seconds.`);

                // Fetch User Info using Long-Lived Token
                const userResponse = await axios.get(
                    `https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=${longLivedAccessToken}`
                );
                const userData = userResponse.data;

                // Fetch Insights (Simple Engagement)
                const mediaResponse = await axios.get(
                    `https://graph.instagram.com/me/media?fields=id,like_count,comments_count,timestamp&limit=10&access_token=${longLivedAccessToken}`
                );
                const mediaItems = mediaResponse.data.data || [];
                let totalEngagement = 0;
                mediaItems.forEach(item => {
                    totalEngagement += (item.like_count || 0) + (item.comments_count || 0);
                });
                const avgEngagement = mediaItems.length > 0 ? totalEngagement / mediaItems.length : 0;
                const followers = userData.followers_count || 1;
                const engagementRate = ((avgEngagement / followers) * 100).toFixed(2);

                // Save to Firestore if userId provided
                if (userId) {
                    await db.collection("users").doc(userId).set({
                        socialHandles: { instagram: userData.username },
                        instagramConnected: true,
                        instagramId: userData.id,
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
                        access_token
                    }
                });

            } catch (error) {
                console.error("Instagram Auth Error:", error.response?.data || error.message);
                return res.status(500).json({
                    error: "Authentication Failed",
                    details: error.response?.data?.error_message || error.message
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

            // Fetch Media from Instagram Graph API
            try {
                const response = await axios.get(
                    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=18&access_token=${accessToken}`
                );

                const mediaItems = response.data.data.map(item => ({
                    id: item.id,
                    caption: item.caption || "",
                    media_type: item.media_type,
                    // For VIDEO, use thumbnail_url. For IMAGE/CAROUSEL, use media_url
                    thumbnail: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
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

const stripe = require('stripe')(functions.config().stripe ? functions.config().stripe.secret : 'sk_test_placeholder');

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
            const session = await stripe.checkout.sessions.create({
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
    const endpointSecret = functions.config().stripe ? functions.config().stripe.webhook_secret : 'whsec_placeholder';

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
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

    res.json({received: true});
});
