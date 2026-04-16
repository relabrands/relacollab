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

    // 1.5 Auto-Refresh Profile Picture and Name
    try {
        const userDetailsRes = await axios.get(
            `https://graph.facebook.com/v19.0/${igUserId}?fields=profile_picture_url,name,username&access_token=${accessToken}`
        );
        const { profile_picture_url, name, username } = userDetailsRes.data;
        if (profile_picture_url) {
            await db.collection("users").doc(userId).update({
                instagramProfilePicture: profile_picture_url,
                instagramName: name || username || userData.instagramName,
                socialHandles: {
                    ...userData.socialHandles,
                    instagram: username || userData.socialHandles?.instagram
                }
            });
        }
    } catch (err) {
        console.warn(`[getInstagramMedia] Failed to auto-refresh profile picture for ${userId}: ${err.message}`);
    }

    // 2. Obtener Lista Básica (+ video_view_count como campo directo del media)
    const response = await axios.get(
        `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,video_view_count&limit=18&access_token=${accessToken}`
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
            // Step 1: Always fetch reach/saved/shares (reliable for all media types)
            const baseInsightRes = await axios.get(
                `https://graph.facebook.com/v19.0/${item.id}/insights?metric=reach,saved,shares&access_token=${accessToken}`
            );
            const baseData = baseInsightRes.data.data;
            const getBaseVal = (name) => {
                const m = baseData.find(x => x.name === name);
                return m ? m.values[0].value : 0;
            };
            metrics.reach = getBaseVal('reach') || 0;
            metrics.saved = getBaseVal('saved') || 0;
            metrics.shares = getBaseVal('shares') || 0;

            const apiInteractions = getBaseVal('total_interactions');
            if (apiInteractions > 0) metrics.interactions = apiInteractions;

        } catch (err) {
            console.warn(`[getInstagramMedia] Insights failed for ${item.id}: ${err.message}`);
        }

        // Step 2: Try to get `views` separately for VIDEO/REEL (Instagram's current metric for play counts)
        const isVideo = item.media_type === 'VIDEO' || item.media_product_type === 'REELS';
        if (isVideo) {
            try {
                const videoRes = await axios.get(
                    `https://graph.facebook.com/v19.0/${item.id}/insights?metric=views&access_token=${accessToken}`
                );
                const vData = videoRes.data.data;
                const vViews = vData.find(x => x.name === 'views');
                if (vViews && vViews.values[0].value > 0) {
                    metrics.views = vViews.values[0].value;
                } else {
                    metrics.views = item.video_view_count || 0;
                }
            } catch (vErr) {
                // `views` insight not available — fall back to video_view_count media field
                metrics.views = item.video_view_count || 0;
            }
        } else {
            // Images don't have views
            metrics.views = 0;
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

            // 3. Fetch Insights (in two steps to prevent total failure)
            let detailedMetrics = {
                views: foundPost.video_view_count || 0,
                reach: 0,
                saved: 0,
                shares: 0,
                interactions: (foundPost.like_count || 0) + (foundPost.comments_count || 0)
            };

            // Step 1: fetch reach/saved/shares — works for all media types
            try {
                console.log(`Fetching base insights for ${foundPost.id}`);
                const insightsResponse = await axios.get(
                    `https://graph.facebook.com/v19.0/${foundPost.id}/insights?metric=reach,saved,shares&access_token=${accessToken}`
                );
                const data = insightsResponse.data.data;
                const getVal = (name) => {
                    const m = data.find(x => x.name === name);
                    return m ? m.values[0].value : 0;
                };
                detailedMetrics.reach = getVal('reach') || 0;
                detailedMetrics.saved = getVal('saved') || 0;
                detailedMetrics.shares = getVal('shares') || 0;
                const apiInteractions = getVal('total_interactions');
                if (apiInteractions > 0) detailedMetrics.interactions = apiInteractions;
            } catch (insightError) {
                console.warn("Base insights fetch failed:", insightError.message);
                if (insightError.response) {
                    console.error("❌ Instagram API Error Body:", JSON.stringify(insightError.response.data, null, 2));
                }
            }

            // Step 2: Try `views` insight for VIDEO/REEL only (current metric per docs, won't break reach/saves/shares if fails)
            const mediaType2 = foundPost.media_type;
            const mediaProductType2 = foundPost.media_product_type;
            if (mediaType2 === 'VIDEO' || mediaProductType2 === 'REELS') {
                try {
                    const videoRes = await axios.get(
                        `https://graph.facebook.com/v19.0/${foundPost.id}/insights?metric=views&access_token=${accessToken}`
                    );
                    const vData = videoRes.data.data;
                    const vViews = vData.find(x => x.name === 'views');
                    if (vViews && vViews.values[0].value > 0) {
                        detailedMetrics.views = vViews.values[0].value;
                        console.log(`✅ views from insights: ${detailedMetrics.views}`);
                    }
                } catch (vErr) {
                    console.warn('views insight unavailable, using video_view_count fallback:', vErr.message);
                }
            }

            // 4. Build final response
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
        console.error("Error refreshing TikTok token:", error.response?.data || error.message);
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

    // 1.5 Auto-Refresh Avatar and Name
    try {
        const userFields = "display_name,avatar_url";
        const userRes = await axios.get(`https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const ttUser = userRes.data.data?.user;
        if (ttUser && ttUser.avatar_url) {
            await db.collection("users").doc(userId).update({
                tiktokAvatar: ttUser.avatar_url,
                tiktokName: ttUser.display_name || userData.tiktokName,
                socialHandles: {
                    ...userData.socialHandles,
                    tiktok: ttUser.display_name || userData.socialHandles?.tiktok
                }
            });
        }
    } catch (err) {
        console.warn(`[getTikTokMedia] Failed to auto-refresh avatar for ${userId}: ${err.message}`);
    }

    const videoFields = "id,title,cover_image_url,share_url,video_description,view_count,like_count,comment_count,share_count,create_time";

    // Fetch Video List Helper
    const fetchVideos = async (token) => {
        return await axios.post("https://open.tiktokapis.com/v2/video/list/?fields=" + videoFields, {
            max_count: 20,
            cursor: cursor || 0
        }, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
    };

    let response;
    try {
        response = await fetchVideos(accessToken);
    } catch (fetchErr) {
        // If 401 Unauthorized, force refresh and retry once
        if (fetchErr.response && fetchErr.response.status === 401 && refreshToken) {
            console.warn("TikTok token rejected (401). Forcing refresh and retry...");
            try {
                accessToken = await refreshTikTokAccessToken(userId, refreshToken);
                response = await fetchVideos(accessToken);
            } catch (retryErr) {
                console.error("Retry with new token failed:", retryErr.response?.data || retryErr.message);
                throw new Error("TikTok token expired and retry failed");
            }
        } else {
            console.error("TikTok API fetch Error:", fetchErr.response?.data || fetchErr.message);
            throw fetchErr;
        }
    }

    const { data, error } = response.data;

    if (error && error.code !== "ok") {
        console.error("TikTok API Error response:", error);
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
        timestamp: new Date((v.create_time || 0) * 1000).toISOString(),
        like_count: v.like_count || 0,
        comments_count: v.comment_count || 0,
        view_count: v.view_count || 0,
        share_count: v.share_count || 0
    }));

    return {
        success: true,
        data: mappedVideos,
        cursor: data.has_more ? nextCursor : null
    };
}
const { VertexAI } = require('@google-cloud/vertexai');

// ==========================================

// ==========================================
// 8. AI CREATOR MATCH ANALYSIS (TRIGGER)
// ==========================================
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

exports.analyzeCreatorMatch = onDocumentWritten("campaigns/{campaignId}/matches/{creatorId}", async (event) => {
    // Check if document was deleted
    if (!event.data.after.exists) {
        console.log("Document deleted. Skipping.");
        return;
    }

    // Get the current data (after the write)
    const snap = event.data.after;
    const { campaignId, creatorId } = event.params;
    const matchData = snap.data();

    // If analysis already exists, skip unless explicitly requested
    if (matchData.aiAnalysis && !matchData.forceRetry) {
        return;
    }

    // Skip if already completed (unless retry forced)
    if (matchData.aiStatus === 'completed' && !matchData.forceRetry) {
        return;
    }

    console.log(`Starting Enhanced AI analysis for creator ${creatorId} in campaign ${campaignId}`);

    try {
        // 1. Fetch Full Context (Campaign & Creator)
        const [campaignDoc, creatorDoc] = await Promise.all([
            db.collection('campaigns').doc(campaignId).get(),
            db.collection('users').doc(creatorId).get()
        ]);

        if (!campaignDoc.exists || !creatorDoc.exists) {
            throw new Error("Campaign or Creator document not found");
        }

        const campaign = campaignDoc.data();
        const creator = creatorDoc.data();

        // 2. Fetch Media from both platforms
        const [igMedia, tiktokMedia] = await Promise.allSettled([
            getInstagramMediaInternal(creatorId).catch(e => []),
            getTikTokMediaInternal(creatorId).catch(e => ({ data: [] }))
        ]);

        const igPosts = igMedia.status === 'fulfilled' ? igMedia.value : [];
        const tiktokPosts = tiktokMedia.status === 'fulfilled' ? (tiktokMedia.value.data || []) : [];

        const hasIg = igPosts.length > 0;
        const hasTiktok = tiktokPosts.length > 0;

        const igPostsTagged = igPosts.map(p => ({ ...p, _platform: 'Instagram' }));
        const tiktokPostsTagged = tiktokPosts.map(p => ({ ...p, _platform: 'TikTok' }));

        // Combine and sort by date (newest first)
        const allPosts = [...igPostsTagged, ...tiktokPostsTagged]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 15); // Analyze last 15 posts total

        // 3. Prepare Data for AI
        const postsData = allPosts.map(p => {
            const isIg = p._platform === 'Instagram';
            const isVideo = p.media_type === 'VIDEO' || p.media_product_type === 'REELS';
            let platformLabel;
            if (isIg) {
                platformLabel = isVideo ? 'Instagram Reel' : 'Instagram Post';
            } else {
                platformLabel = 'TikTok';
            }
            // For Instagram: view_count comes from getInstagramMediaInternal (views insight or video_view_count)
            // For TikTok: view_count is the TikTok play count
            const views = p.view_count || p.views || 0;
            return {
                platform: platformLabel,
                caption: p.caption ? p.caption.substring(0, 200) : "",
                views,
                likes: p.like_count || 0,
                comments: p.comments_count || 0,
                date: p.timestamp
            };
        });

        // Compensation Logic
        const campaignCompType = campaign.compensationType || "monetary"; // 'exchange', 'monetary'
        const creatorPref = creator.collaborationPreference || "Ambos"; // 'Con remuneración', 'Intercambios', 'Ambos'

        let compensationMatch = true;
        let compensationNote = "El creador acepta este tipo de compensación.";

        if (campaignCompType === 'exchange' && creatorPref === 'Con remuneración') {
            compensationMatch = false;
            compensationNote = "El creador prefiere pago monetario y la marca ofrece intercambio.";
        } else if (campaignCompType === 'monetary' && creatorPref === 'Intercambios') {
            // Less likely to be a blocker, but worth noting
            compensationNote = "El creador prefiere intercambios, pero probablemente acepte pago.";
        }

        // 4. Call Vertex AI
        const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || 'rela-collab', location: 'us-central1' });
        const model = vertex_ai.preview.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                'maxOutputTokens': 8192,
                'temperature': 0.7,
            }
        });

        const prompt = `
Actúa como un experto en Marketing de Influencers. Tu tarea es analizar la compatibilidad entre un Creador y una Campaña de Marca.

DATOS DE LA CAMPAÑA:
- Nombre: ${campaign.name}
- Descripción: ${campaign.description}
- Objetivo: ${campaign.goal} (e.g., Awareness, Conversion)
- Vibe de Marca: ${campaign.vibes ? campaign.vibes.join(', ') : 'General'}
- Tipo de Compensación: ${campaignCompType === 'exchange' ? 'Intercambio (Producto)' : 'Pago Monetario'}
- Detalles Compensación: ${campaign.exchangeDetails || campaign.creatorPayment + ' USD'}

DATOS DEL CREADOR:
- Bio: ${creator.bio || "No disponible"}
- Vibe del Creador: ${creator.vibes ? creator.vibes.join(', ') : 'No especificado'}
- Preferencia Compensación: ${creatorPref}
- Nota de Compensación (Calculada): ${compensationNote}
- Es Deal Breaker la compensación: ${compensationMatch ? 'NO' : 'SÍ'}

CONTENIDO RECIENTE (Últimos 15 posts):
${JSON.stringify(postsData)}

TAREA:
1. Determina el % de Match (0-100%). Si la compensación es un Deal Breaker, el match debe ser bajo (<50%).
2. Predice las métricas PROMEDIO que este creador generaría **específicamente para esta campaña** (vistas, likes, comentarios). Basa esto en el promedio de sus posts recientes.
3. Redacta un análisis persuasivo siguiendo ESTRICTAMENTE este formato de plantilla:
   "Match del [X]% - [Perfil/Nicho]: [Nota sobre compensación]. Basado en sus últimos [N] videos de [temática detectada], se predice un impacto de [V] vistas, [L] likes y [C] comentarios para tu campaña. Su audiencia [describe audiencia inferida] y tono [describe tono] encajan [bien/mal] con el Brand Vibe de tu marca."

FORMATO EXCLUSIVO JSON:
Responde SOLO con este objeto JSON raw, sin markdown formatting si es posible:
{
  "matchPercentage": 92,
  "matchSummary": "Match del 92% - Perfil Fitness...",
  "predictedMetrics": {
      "avgViews": 12500,
      "avgLikes": 850,
      "avgComments": 45
  },
  "strengths": ["lista", "de", "puntos", "fuertes"],
  "weaknesses": ["lista", "de", "puntos", "debiles"]
}
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.candidates[0].content.parts[0].text;
        console.log("Raw AI Response:", text);

        // Robust JSON cleanup
        let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        // Sometimes Gemini adds comments or extra text, try to find the JSON object
        const jsonStartIndex = cleanText.indexOf('{');
        const jsonEndIndex = cleanText.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            cleanText = cleanText.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        let analysisJson;
        try {
            analysisJson = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error("Failed to parse JSON from AI response");
        }

        // 5. Update the match document
        await snap.ref.set({
            aiAnalysis: analysisJson,
            aiAnalysisDate: new Date(),
            aiStatus: 'completed',
            forceRetry: admin.firestore.FieldValue.delete()
        }, { merge: true });

        console.log(`Enhanced Analysis completed for ${creatorId}`);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        await snap.ref.set({
            aiStatus: 'error',
            aiError: error.message
        }, { merge: true });
    }
});

// ─── analyzeCreatorProfile ──────────────────────────────────────────
exports.analyzeCreatorProfile = onDocumentWritten("users/{userId}/profileAnalysis/{platform}", async (event) => {
    if (!event.data.after.exists) return;

    const snapP = event.data.after;
    const { userId, platform } = event.params;
    const dataP = snapP.data();

    if (dataP.aiStatus === 'completed' && !dataP.forceRetry) return;

    console.log(`Starting profile AI analysis for creator ${userId} on ${platform}`);

    try {

        // 1. Fetch creator doc
        const creatorDoc = await db.collection('users').doc(userId).get();
        if (!creatorDoc.exists) throw new Error("Creator not found");
        const creator = creatorDoc.data();

        // 2. Fetch recent posts
        let posts = [];
        try {
            if (platform === 'instagram') {
                posts = await getInstagramMediaInternal(userId);
            } else {
                const result = await getTikTokMediaInternal(userId);
                posts = result.data || [];
            }
        } catch (e) {
            console.warn("Could not fetch posts:", e.message);
        }

        const postsData = posts.slice(0, 12).map(p => ({
            caption: p.caption ? p.caption.substring(0, 200) : "",
            views: p.view_count || p.views || 0,
            likes: p.like_count || 0,
            comments: p.comments_count || 0,
            date: p.timestamp
        }));

        const metrics = platform === 'instagram'
            ? creator.instagramMetrics || {}
            : creator.tiktokMetrics || {};

        // 3. Build prompt
        const platformLabel = platform === 'instagram' ? 'Instagram' : 'TikTok';
        const prompt = `
Actúa como un experto en Marketing de Influencers. Analiza el perfil de ${platformLabel} de este creador y genera un informe completo en español.

DATOS DEL CREADOR:
- Nombre: ${creator.displayName || creator.name || "Desconocido"}
- Bio: ${creator.bio || "No disponible"}
- Nicho/Vibes: ${creator.vibes ? creator.vibes.join(', ') : 'General'}
- Preferencia de colaboración: ${creator.collaborationPreference || "No especificada"}

MÉTRICAS DE ${platformLabel.toUpperCase()}:
- Seguidores: ${metrics.followers || 0}
- Engagement Rate: ${metrics.engagementRate || 0}%
- ${platform === 'instagram' ? `Avg Likes: ${metrics.avgLikes || 0}, Avg Comments: ${metrics.avgComments || 0}` : `Total Likes: ${metrics.likes || 0}, Videos: ${metrics.videoCount || posts.length}`}

CONTENIDO RECIENTE (${postsData.length} posts):
${JSON.stringify(postsData)}

TAREA:
1. Da un score al perfil del 0-100 (considera engagement, consistencia de contenido, calidad de bio, variedad).
2. Determina su tier: "Nano Creator" (<1K), "Micro Creator" (1K-10K), "Rising Creator" (10K-100K), "Power Creator" (100K-500K), "Top Creator" (>500K). Para TikTok: "Viral Creator" si su engagement supera el 20%.
3. Redacta un resumen de 2-3 frases sobre el perfil del creador basado en sus publicaciones reales.
4. Lista 3 puntos fuertes del perfil basados en datos reales.
5. Lista 3 áreas de mejora concretas y accionables.
6. Redacta 1-2 frases sobre su potencial con marcas (qué tipo de marcas encajarían y por qué).

RESPONDE SOLO con este JSON raw (sin markdown):
{
  "score": 72,
  "tier": "Rising Creator",
  "summary": "Resumen del perfil...",
  "strengths": ["punto 1", "punto 2", "punto 3"],
  "improvements": ["mejora 1", "mejora 2", "mejora 3"],
  "brandAppeal": "Este creador encaja bien con marcas de..."
}
`;

        // 4. Call Gemini
        const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || 'rela-collab', location: 'us-central1' });
        const model = vertex_ai.preview.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
        });

        const result = await model.generateContent(prompt);
        let text = result.response.candidates[0].content.parts[0].text;
        console.log("Raw AI Response:", text);

        // Clean JSON
        let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start !== -1 && end !== -1) cleanText = cleanText.substring(start, end + 1);

        const analysisJson = JSON.parse(cleanText);

        // 5. Write back
        await snapP.ref.set({
            aiAnalysis: analysisJson,
            aiStatus: 'completed',
            analyzedAt: new Date(),
            forceRetry: admin.firestore.FieldValue.delete()
        }, { merge: true });

        console.log(`Profile analysis completed for ${userId} on ${platform}`);
    } catch (error) {
        console.error("Profile AI Analysis Error:", error);
        await snapP.ref.set({ aiStatus: 'error', aiError: error.message }, { merge: true });
    }
});

// Temporary cloud function to patch the content_approved template
exports.updateContentApprovedTemplate = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
        try {
            const docRef = db.collection("emailTemplates").doc("content_approved"); 
            const doc = await docRef.get();
            if (!doc.exists) { return res.send("No doc"); }
            const data = doc.data();
            let vars = data.variables || [];
            if (!vars.includes("pendingItemsText")) vars.push("pendingItemsText");
            let newHtml = data.html;
            if (!newHtml.includes("{{pendingItemsText}}")) {
                if (newHtml.includes("fue aprobado.</p>")) {
                     newHtml = newHtml.replace("fue aprobado.</p>", "fue aprobado.</p><p style='margin-bottom:15px; color:#555;'><strong>{{pendingItemsText}}</strong></p>");
                } else {
                     newHtml = newHtml.replace("</div><a href=", "</div><p><strong>{{pendingItemsText}}</strong></p><a href=");
                }
            }
            await docRef.update({ variables: vars, html: newHtml });
            res.send("Updated content_approved template safely.");
        } catch (e) {
            res.status(500).send(e.message);
        }
    });
});
// ─── Email Notifications (Resend) ─────────────────────────────────────────────
const { registerEmailNotifications } = require("./src/email/notifications");
registerEmailNotifications(functions, admin, exports);


// ─── AI Campaign Generator ────────────────────────────────────────────────────
const { VertexAI: VertexAIForCampaign } = require("@google-cloud/vertexai");

exports.generateCampaign = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { prompt: userPrompt, brandName } = req.body;

        if (!userPrompt || userPrompt.trim().length < 5) {
            return res.status(400).json({ error: "Se necesita una descripción más detallada." });
        }

        const systemPrompt = `
Eres un experto en marketing de influencers y estrategia de contenido digital para marcas latinoamericanas.
Tu tarea es generar un plan de campaña de influencer marketing basado en la descripción de la marca.

MARCA: ${brandName || "la marca"}
DESCRIPCIÓN DE LA IDEA: ${userPrompt}

GENERA un JSON estructurado con la siguiente información:

1. "title": Un nombre de campaña creativo y atractivo (máx 8 palabras) que enganche al creador.
2. "description": Una descripción clara y motivadora (2-4 frases) de qué debe hacer el creador, qué contenido crear y qué se espera de él/ella.
3. "goal": El objetivo principal. DEBE ser exactamente uno de estos valores: "awareness", "conversion", "content".
4. "brandVibe": Un array de 1-3 etiquetas de estilo que representen el vibe de la campaña. DEBES elegir solo de esta lista exacta: ["romantic", "party", "family", "healthy", "premium", "adventure"].
5. "audience": Una descripción breve (1-2 frases) del público objetivo ideal para esta campaña.
6. "goals": Un array de exactamente 3 objetivos específicos y medibles para la campaña (ej: "Generar 10 posts en Instagram con el producto").

RESPONDE ÚNICAMENTE con el JSON raw (sin markdown, sin bloques de código, sin texto adicional). Ejemplo de formato:
{
  "title": "Verano Saludable con [Marca]",
  "description": "Crea contenido mostrando cómo integras nuestro producto en tu rutina de verano...",
  "goal": "awareness",
  "brandVibe": ["healthy", "adventure"],
  "audience": "Jóvenes de 18-35 años interesados en vida saludable y bienestar.",
  "goals": ["Generar 15 posts en Instagram", "Alcanzar 50,000 impresiones", "Obtener 500 menciones del hashtag"]
}
`;

        try {
            const vertexForCampaign = new VertexAIForCampaign({
                project: process.env.GCLOUD_PROJECT || "rela-collab",
                location: "us-central1",
            });

            const model = vertexForCampaign.preview.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    maxOutputTokens: 4096, // Increased to prevent truncation
                    temperature: 0.85,
                    responseMimeType: "application/json", // Force valid JSON
                },
            });

            const result = await model.generateContent(systemPrompt);
            let rawText = result.response.candidates[0].content.parts[0].text;
            console.log("Campaign AI raw:", rawText);

            // Strip markdown code fences if present
            let cleanText = rawText
                .replace(/```json\s*/gi, "")
                .replace(/```\s*/g, "")
                .trim();

            // Extract first JSON object
            const start = cleanText.indexOf("{");
            const end = cleanText.lastIndexOf("}");
            if (start !== -1 && end !== -1) {
                cleanText = cleanText.substring(start, end + 1);
            }

            const campaignData = JSON.parse(cleanText);

            // Validate & sanitize vibe values against allowed list
            const allowedVibes = ["romantic", "party", "family", "healthy", "premium", "adventure"];
            if (campaignData.brandVibe && Array.isArray(campaignData.brandVibe)) {
                campaignData.brandVibe = campaignData.brandVibe.filter(v => allowedVibes.includes(v));
            }

            // Validate goal value
            const allowedGoals = ["awareness", "conversion", "content"];
            if (!allowedGoals.includes(campaignData.goal)) {
                campaignData.goal = "awareness";
            }

            return res.status(200).json({ success: true, campaign: campaignData });

        } catch (error) {
            console.error("generateCampaign error:", error);
            return res.status(500).json({ error: "Error generando la campaña. Intenta de nuevo." });
        }
    });
});

// ==========================================
// AUTO-UPDATE CREATOR METRICS (WEEKLY CRON)
// ==========================================

async function refreshInstagramMetricsForUser(userId, igUserId, longLivedAccessToken) {
    try {
        const userDetailsResponse = await axios.get(
            `https://graph.facebook.com/v19.0/${igUserId}?fields=followers_count,username,name,profile_picture_url&access_token=${longLivedAccessToken}`
        );
        const userData = userDetailsResponse.data;

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
        
        const followers = parseInt(userData.followers_count || "1");
        const avgEngagement = mediaItems.length > 0 ? totalEngagement / mediaItems.length : 0;
        const avgLikes = mediaItems.length > 0 ? Math.round(totalLikes / mediaItems.length) : 0;
        const avgComments = mediaItems.length > 0 ? Math.round(totalComments / mediaItems.length) : 0;
        const engagementRate = ((avgEngagement / followers) * 100).toFixed(2);

        const updateData = {
            instagramUsername: userData.username,
            instagramName: userData.name || userData.username,
            instagramProfilePicture: userData.profile_picture_url,
            "socialHandles.instagram": userData.username,
            instagramMetrics: {
                followers: parseInt(userData.followers_count || "0"),
                engagementRate: parseFloat(engagementRate || "0"),
                avgLikes: avgLikes,
                avgComments: avgComments,
                lastUpdated: new Date().toISOString()
            }
        };

        await db.collection("users").doc(userId).set(updateData, { merge: true });
        console.log(`[MetricsUpdate] Successfully updated Instagram for ${userId}`);
    } catch (error) {
        console.warn(`[MetricsUpdate] Failed to update Instagram for ${userId}:`, error.message);
    }
}

async function refreshTikTokMetricsForUser(userId, openId, accessToken, refreshToken, tokenExpiresAt, userDocData) {
    try {
        let validAccessToken = accessToken;
        
        // Refresh token if expired or expiring in next 5 minutes
        if (tokenExpiresAt && Date.now() + 300000 > tokenExpiresAt) {
            if (refreshToken) {
                try {
                    console.log(`[MetricsUpdate] Refreshing TikTok token for ${userId}...`);
                    validAccessToken = await refreshTikTokAccessToken(userId, refreshToken);
                } catch (rErr) {
                    console.error(`[MetricsUpdate] TikTok token refresh failed for ${userId}:`, rErr.message);
                    return; // Can't fetch without valid token
                }
            } else {
                console.warn(`[MetricsUpdate] No refresh token for ${userId}, skipping TikTok metrics update.`);
                return;
            }
        }

        const userFields = "display_name,avatar_url,follower_count,following_count,likes_count";
        const userResponse = await axios.get(`https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`, {
            headers: { "Authorization": `Bearer ${validAccessToken}` }
        });

        const userData = userResponse.data.data?.user || {};

        let engagementRate = userDocData?.tiktokMetrics?.engagementRate || 0;
        try {
            const videoFields = "id,view_count,like_count,comment_count,share_count";
            const videoResponse = await axios.post("https://open.tiktokapis.com/v2/video/list/?fields=" + videoFields, {
                max_count: 20
            }, {
                headers: {
                    "Authorization": `Bearer ${validAccessToken}`,
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
            console.warn(`[MetricsUpdate] Error fetching TikTok videos for ${userId}:`, vidErr.message);
        }

        const updateData = {
            tiktokName: userData.display_name,
            tiktokAvatar: userData.avatar_url,
            "socialHandles.tiktok": userData.display_name,
            tiktokMetrics: {
                followers: userData.follower_count || 0,
                likes: userData.likes_count || 0,
                engagementRate: parseFloat(engagementRate),
                lastUpdated: new Date().toISOString()
            }
        };

        await db.collection("users").doc(userId).set(updateData, { merge: true });
        console.log(`[MetricsUpdate] Successfully updated TikTok for ${userId}`);
    } catch (error) {
        console.warn(`[MetricsUpdate] Failed to update TikTok for ${userId}:`, error.message);
    }
}

exports.updateCreatorMetricsDaily = require('firebase-functions/v1')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 0 * * *') // Runs every day at midnight 
    .timeZone('America/New_York')
    .onRun(async (context) => {
        console.log("[MetricsUpdate] Starting weekly creator metrics update...");
        try {
            const snapshot = await db.collection("users").where("role", "==", "creator").get();
            console.log(`[MetricsUpdate] Found ${snapshot.size} creators to process.`);
            
            let processed = 0;
            for (const doc of snapshot.docs) {
                const user = doc.data();
                const userId = doc.id;
                let metricsUpdated = false;

                if (user.instagramConnected && user.instagramId && user.instagramAccessToken) {
                    await refreshInstagramMetricsForUser(userId, user.instagramId, user.instagramAccessToken);
                    metricsUpdated = true;
                }

                if (user.tiktokConnected && user.tiktokOpenId && user.tiktokAccessToken) {
                    await refreshTikTokMetricsForUser(
                        userId, 
                        user.tiktokOpenId, 
                        user.tiktokAccessToken, 
                        user.tiktokRefreshToken, 
                        user.tiktokTokenExpiresAt,
                        user
                    );
                    metricsUpdated = true;
                }

                if (metricsUpdated) {
                    processed++;
                    // Delay to prevent rate limiting issues
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            console.log(`[MetricsUpdate] Completed! Processed metrics for ${processed} creators.`);
        } catch (error) {
            console.error("[MetricsUpdate] General error in scheduled update:", error);
        }
    });

// ==========================================
// AUTO-UPDATE CONTENT SUBMISSION METRICS (DAILY CRON)
// Refreshes Instagram metrics for every content_submission that has a postUrl.
// Runs at 3:00 AM EST every day to avoid prime-time API rate limits.
// ==========================================

/**
 * Internal helper: fetches fresh metrics for a single Instagram post
 * and updates the content_submissions document in Firestore.
 */
async function refreshSingleSubmissionMetrics(submissionId, postUrl, accessToken, igUserId) {
    try {
        // 1. Extract shortcode / post ID from URL
        const match = postUrl.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        const postId = match ? match[2] : null;
        if (!postId) {
            console.warn(`[ContentMetrics] Cannot parse postId from URL: ${postUrl}`);
            return;
        }

        // 2. Fetch recent media list and find the matching post
        const mediaRes = await axios.get(
            `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,like_count,comments_count,media_type,media_product_type,thumbnail_url,media_url,shortcode,video_view_count,permalink&limit=50&access_token=${accessToken}`
        );
        const mediaItems = mediaRes.data.data || [];

        const foundPost = mediaItems.find(item =>
            (item.permalink && item.permalink.includes(postId)) ||
            (item.shortcode && item.shortcode === postId)
        );

        if (!foundPost) {
            console.warn(`[ContentMetrics] Post ${postId} not found in recent media for submission ${submissionId}`);
            return;
        }

        // 3. Build base metrics from media fields
        let metrics = {
            likes:        foundPost.like_count || 0,
            comments:     foundPost.comments_count || 0,
            views:        foundPost.video_view_count || 0,
            reach:        0,
            saved:        0,
            shares:       0,
            interactions: (foundPost.like_count || 0) + (foundPost.comments_count || 0),
            updatedAt:    new Date().toISOString()
        };

        // 4. Fetch base insights: reach, saved, shares
        try {
            const insRes = await axios.get(
                `https://graph.facebook.com/v19.0/${foundPost.id}/insights?metric=reach,saved,shares&access_token=${accessToken}`
            );
            const insData = insRes.data.data;
            const getVal = (name) => {
                const m = insData.find(x => x.name === name);
                return m ? m.values[0].value : 0;
            };
            metrics.reach  = getVal('reach')  || 0;
            metrics.saved  = getVal('saved')  || 0;
            metrics.shares = getVal('shares') || 0;
            const apiInter = getVal('total_interactions');
            if (apiInter > 0) metrics.interactions = apiInter;
        } catch (insErr) {
            console.warn(`[ContentMetrics] Insights failed for ${foundPost.id}: ${insErr.message}`);
        }

        // 5. Try views insight for VIDEO / REEL
        const isVideo = foundPost.media_type === 'VIDEO' || foundPost.media_product_type === 'REELS';
        if (isVideo) {
            try {
                const vRes = await axios.get(
                    `https://graph.facebook.com/v19.0/${foundPost.id}/insights?metric=views&access_token=${accessToken}`
                );
                const vData = vRes.data.data;
                const vViews = vData.find(x => x.name === 'views');
                if (vViews && vViews.values[0].value > 0) {
                    metrics.views = vViews.values[0].value;
                }
            } catch (vErr) {
                // silence — video_view_count fallback already set above
            }
        }

        // 6. Write back to Firestore using dot-notation for nested metrics field
        const updatePayload = {
            'metrics.likes':        metrics.likes,
            'metrics.comments':     metrics.comments,
            'metrics.views':        metrics.views,
            'metrics.reach':        metrics.reach,
            'metrics.saved':        metrics.saved,
            'metrics.shares':       metrics.shares,
            'metrics.interactions': metrics.interactions,
            'metrics.updatedAt':    metrics.updatedAt,
            metricsLastFetched:     metrics.updatedAt
        };

        // Also refresh the thumbnail URL so it doesn't expire (IG CDN URLs are short-lived)
        const freshThumbnail = foundPost.media_type === 'VIDEO'
            ? (foundPost.thumbnail_url || foundPost.media_url || null)
            : (foundPost.media_url || null);
        if (freshThumbnail) {
            updatePayload.thumbnailUrl = freshThumbnail;
        }
        await db.collection('content_submissions').doc(submissionId).update(updatePayload);

        console.log(`[ContentMetrics] ✅ Updated submission ${submissionId} — reach:${metrics.reach} views:${metrics.views}`);
    } catch (err) {
        console.warn(`[ContentMetrics] ⚠️ Failed for submission ${submissionId}: ${err.message}`);
    }
}

exports.updateContentSubmissionMetrics = require('firebase-functions/v1')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 3 * * *')  // Every day at 3:00 AM EST
    .timeZone('America/New_York')
    .onRun(async () => {
        console.log('[ContentMetrics] Starting daily content submission metrics refresh...');

        try {
            // 1. Fetch all submissions that have a postUrl or contentUrl
            //    Run two queries because Firestore does not support OR conditions across different fields.
            const [byPostUrl, byContentUrl] = await Promise.all([
                db.collection('content_submissions').where('postUrl',    '!=', null).get(),
                db.collection('content_submissions').where('contentUrl', '!=', null).get()
            ]);

            // Merge and de-duplicate by document ID
            const docsMap = new Map();
            [...byPostUrl.docs, ...byContentUrl.docs].forEach(d => docsMap.set(d.id, d));
            const submissions = Array.from(docsMap.values());

            console.log(`[ContentMetrics] Found ${submissions.length} submissions with a post URL.`);

            // 2. Group by creator so we only fetch their media list ONCE per creator
            const byCreator = new Map(); // creatorId -> [{ id, postUrl }]
            for (const doc of submissions) {
                const data      = doc.data();
                const postUrl   = data.postUrl || data.contentUrl;
                const creatorId = data.creatorId || data.userId;
                if (!postUrl || !creatorId) continue;

                if (!byCreator.has(creatorId)) byCreator.set(creatorId, []);
                byCreator.get(creatorId).push({ id: doc.id, postUrl });
            }

            console.log(`[ContentMetrics] Processing ${byCreator.size} unique creators.`);

            let updatedCount = 0;
            let skippedCount = 0;

            for (const [creatorId, subs] of byCreator.entries()) {
                // 3. Fetch this creator's token
                let userData;
                try {
                    const userDoc = await db.collection('users').doc(creatorId).get();
                    if (!userDoc.exists) { skippedCount += subs.length; continue; }
                    userData = userDoc.data();
                } catch (uErr) {
                    console.warn(`[ContentMetrics] Could not fetch user ${creatorId}: ${uErr.message}`);
                    skippedCount += subs.length;
                    continue;
                }

                const accessToken = userData.instagramAccessToken;
                const igUserId    = userData.instagramId;

                if (!accessToken || !igUserId) {
                    console.warn(`[ContentMetrics] Creator ${creatorId} has no Instagram token — skipping ${subs.length} submissions.`);
                    skippedCount += subs.length;
                    continue;
                }

                // 4. Update each submission for this creator sequentially (avoid rate-limiting)
                for (const sub of subs) {
                    await refreshSingleSubmissionMetrics(sub.id, sub.postUrl, accessToken, igUserId);
                    updatedCount++;
                    // Small delay between posts to respect IG rate limits
                    await new Promise(r => setTimeout(r, 300));
                }

                // Pause between creators to respect global rate limits
                await new Promise(r => setTimeout(r, 1000));
            }

            console.log(`[ContentMetrics] Done. Updated: ${updatedCount}, Skipped: ${skippedCount}.`);
        } catch (error) {
            console.error('[ContentMetrics] Fatal error in scheduled job:', error);
        }
    });
