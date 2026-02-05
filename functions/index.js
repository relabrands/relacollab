const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.auth = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // API Endpoint: /api/auth/instagram/exchange
        // Note: The rewrite in firebase.json strips the prefix usually or we check req.path
        // req.path will be /api/auth/instagram/exchange if mapped directly

        // We can just check if it contains the keywords
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
                        redirect_uri: "https://relacollab.com/auth/facebook/callback", // Must match exactly what was in the button
                        code: code.toString(),
                    })
                );

                const { access_token, user_id } = tokenResponse.data;

                // Fetch User Info
                const userResponse = await axios.get(
                    `https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=${access_token}`
                );
                const userData = userResponse.data;

                // Fetch Insights (Simple Engagement)
                const mediaResponse = await axios.get(
                    `https://graph.instagram.com/me/media?fields=id,like_count,comments_count,timestamp&limit=10&access_token=${access_token}`
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
                    await db.collection("users").doc(userId).update({
                        instagramConnected: true,
                        instagramId: userData.id,
                        instagramUsername: userData.username,
                        instagramAccessToken: access_token,
                        instagramMetrics: {
                            followers: parseInt(userData.followers_count || "0"),
                            engagementRate: parseFloat(engagementRate || "0"),
                            lastUpdated: new Date().toISOString()
                        }
                    });
                }

                return res.json({
                    success: true,
                    data: {
                        id: userData.id,
                        username: userData.username,
                        engagementRate: engagementRate,
                        access_token // Return token just in case frontend needs it immediately
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
