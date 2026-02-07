export interface MatchScoreResult {
    score: number;
    reasons: string[];
    breakdown: {
        location: number; // Max 30
        vibe: number;     // Max 40
        engagement: number; // Max 20
        bonus: number;    // Max 10
    };
}

export const calculateMatchScore = (campaign: any, creator: any): MatchScoreResult => {
    let score = 0;
    const reasons: string[] = [];
    const breakdown = {
        location: 0,
        vibe: 0,
        engagement: 0,
        bonus: 0
    };

    if (!campaign || !creator) {
        return { score: 0, reasons: [], breakdown };
    }

    const creatorCategories = creator.categories || creator.tags || [];
    const campaignVibes = campaign.vibes || [];

    // 1. Location (Max 30)
    // Strict check if location is specified
    if (campaign.location) {
        const campaignLoc = campaign.location.toLowerCase();
        const creatorLoc = (creator.location || "").toLowerCase();

        if (creatorLoc.includes(campaignLoc) || campaignLoc === "global" || campaignLoc === "any") {
            breakdown.location = 30;
            reasons.push("Perfect Location Match");
        } else {
            // Partial/Region match logic could go here, for now 0 if mismatch
            breakdown.location = 0;
        }
    } else {
        // If no location required, give full points to be neutral
        breakdown.location = 30;
    }
    score += breakdown.location;

    // 2. Vibe/Niche (Max 40)
    // Calculate overlap
    const matchedVibes = campaignVibes.filter((v: string) =>
        creatorCategories.some((c: string) =>
            c.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(c.toLowerCase())
        )
    );

    if (matchedVibes.length > 0) {
        // 20 points for at least one match, +10 for each additional (cap at 40)
        breakdown.vibe = Math.min(40, 20 + ((matchedVibes.length - 1) * 10));
        reasons.push(`Matches vibes: ${matchedVibes.slice(0, 2).join(", ")}`);
    } else if (creatorCategories.length > 0) {
        // Soft match check against title/description
        const allTags = creatorCategories.join(" ").toLowerCase();
        const campaignContext = (campaign.name + " " + (campaign.description || "")).toLowerCase();

        if (creatorCategories.some((c: string) => campaignContext.includes(c.toLowerCase()))) {
            breakdown.vibe = 15;
            reasons.push("Content relevant to campaign");
        }
    }
    score += breakdown.vibe;

    // 3. Engagement (Max 20)
    const er = creator.instagramMetrics?.engagementRate || 0;
    if (er >= 5) {
        breakdown.engagement = 20;
        reasons.push("Exceptional Engagement");
    } else if (er >= 3) {
        breakdown.engagement = 15;
        reasons.push("High Engagement");
    } else if (er >= 1.5) {
        breakdown.engagement = 10;
    } else {
        breakdown.engagement = 5; // Base points for having metrics
    }
    score += breakdown.engagement;

    // 4. Bonus / Follower Fit (Max 10)
    // Ensure they aren't too small or too big if constraints existed (mocking logic)
    const followers = creator.instagramMetrics?.followers || 0;
    if (followers > 1000) {
        breakdown.bonus = 10;
    }
    score += breakdown.bonus;

    // Final Cap
    score = Math.min(99, score);

    return { score, reasons, breakdown };
};
