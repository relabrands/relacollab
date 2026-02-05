const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.auth = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // 1. Handle Callback Route
        if (req.path === "/facebook/callback") {
            const { code } = req.query;

            if (!code) {
                return res.status(400).send("No code provided");
            }

            try {
                // 2. Exchange Code for Access Token
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

                // 3. Fetch User Info & Insights
                const userResponse = await axios.get(
                    `https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=${access_token}`
                );

                const userData = userResponse.data;

                // Fetch Recent Media for Engagement Calculation
                const mediaResponse = await axios.get(
                    `https://graph.instagram.com/me/media?fields=id,like_count,comments_count,timestamp&limit=10&access_token=${access_token}`
                );

                const mediaItems = mediaResponse.data.data || [];

                let totalEngagement = 0;
                mediaItems.forEach(item => {
                    totalEngagement += (item.like_count || 0) + (item.comments_count || 0);
                });

                // Calculate average engagement per post
                const avgEngagement = mediaItems.length > 0 ? totalEngagement / mediaItems.length : 0;

                // Calculate Engagement Rate (Avg Engagement / Followers) * 100
                const followers = userData.followers_count || 1; // Prevent division by zero
                const engagementRate = ((avgEngagement / followers) * 100).toFixed(2);

                // 4. Save to Firestore
                // Note: In a real flow, we need to know WHICH user this is. 
                // Typically, we'd pass a 'state' param with the userId in the auth URL.
                // For this streamlined request, we might update a specific document or create a new one to be claimed.
                // HOWEVER, since we can't easily pass state in this specific simplified request flow description without changing the frontend URL,
                // and cloud functions run server side, we have a challenge connecting this back to the currently logged in Firebase user 
                // unless we used the 'state' parameter.

                // START WORKAROUND: For this specific task, we will try to pass 'state' if possible or save it 
                // to a temporary collection keyed by instagram_id that the frontend handles?
                // NO, better approach: The user provided URL doesn't have 'state'. 
                // But we can add it safely to the frontend generic instructions if we want.
                // Given the constraints, I will save this to a 'connected_accounts' collection keyed by the instagram user_id
                // The frontend can then claim it or we rely on the client keeping the window open?
                // Actually, the most robust way without changing the User's exact URL request too much is to just save it.
                // BUT, let's look at the Redirect URI: https://relacollab.com/auth/facebook/callback
                // This suggests it hits the Hosting layer first.

                // Let's assume we can identify the user. BUT since we can't contextually, 
                // I will return a script that posts the message back to the opener or redirects to a specific page
                // passing the data in query params so the FRONTEND (authenticated) can save it to Firestore.
                // This avoids auth issues in the function.

                const redirectUrl = `https://relacollab.com/creator/profile?connected=true&ig_id=${userData.id}&username=${userData.username}&followers=${userData.followers_count}&er=${engagementRate}&token=${access_token}`;

                return res.redirect(redirectUrl);

            } catch (error) {
                console.error("Instagram Auth Error:", error.response?.data || error.message);
                return res.status(500).send(`Authentication Failed: ${error.response?.data?.error_message || error.message}`);
            }
        } else {
            res.status(404).send("Not Found");
        }
    });
});
