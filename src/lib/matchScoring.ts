export interface MatchScoreResult {
    score: number;
    reasons: string[];
    breakdown: {
        compensation: boolean;  // NEW: Must match (eliminatory)
        contentType: number;    // NEW: Max 25
        niche: number;          // Was "vibe" - Max 20
        experience: number;     // NEW: Max 15
        socialMetrics: number;  // Was "engagement" - Max 15
        composition: number;    // NEW: Max 10
        demographics: number;   // Was "location" - Max 10
        availability: number;   // NEW: Max 5
    };
}

export const calculateMatchScore = (campaign: any, creator: any): MatchScoreResult => {
    let score = 0;
    const reasons: string[] = [];
    const breakdown = {
        compensation: false,
        contentType: 0,
        niche: 0,
        experience: 0,
        socialMetrics: 0,
        composition: 0,
        demographics: 0,
        availability: 0
    };

    if (!campaign || !creator) {
        return { score: 0, reasons: [], breakdown };
    }

    // ========================================
    // 1. COMPENSATION (CRITICAL - Eliminatory)
    // ========================================
    const campaignComp = campaign.compensationType || ""; // "exchange" | "monetary"
    const creatorPref = creator.collaborationPreference || ""; // "Con remuneración" | "Intercambios" | "Ambos"

    if (campaignComp === "exchange") {
        // Brand offers exchange → Creator must accept "Intercambios" or "Ambos"
        if (creatorPref === "Intercambios" || creatorPref === "Ambos") {
            breakdown.compensation = true;
        }
    } else if (campaignComp === "monetary") {
        // Brand offers payment → Creator must accept "Con remuneración" or "Ambos"
        if (creatorPref === "Con remuneración" || creatorPref === "Ambos") {
            breakdown.compensation = true;
        }
    } else {
        // No compensation type specified - neutral match
        breakdown.compensation = true;
    }

    // If compensation doesn't match, return 0 immediately
    if (!breakdown.compensation) {
        return { score: 0, reasons: ["Compensation type incompatible"], breakdown };
    }

    reasons.push("✓ Compensation compatible");

    // ========================================
    // 2. CONTENT TYPE (Max 25 points)
    // ========================================
    const campaignContentTypes = campaign.contentTypes || [];
    const creatorContentFormats = creator.contentFormats || creator.contentTypes || []; // Use new field with fallback

    if (campaignContentTypes.length > 0 && creatorContentFormats.length > 0) {
        const matchedTypes = campaignContentTypes.filter((type: string) =>
            creatorContentFormats.includes(type)
        );

        if (matchedTypes.length > 0) {
            // Calculate percentage match
            const matchRatio = matchedTypes.length / campaignContentTypes.length;
            breakdown.contentType = Math.round(matchRatio * 25);

            if (matchRatio === 1) {
                reasons.push(`✓ Creates all required content types`);
            } else {
                reasons.push(`✓ Matches ${matchedTypes.length}/${campaignContentTypes.length} content types`);
            }
        }
    } else {
        // No content types specified, give neutral score
        breakdown.contentType = 15;
    }
    score += breakdown.contentType;

    // ========================================
    // 3. NICHE AND SECONDARY CATEGORIES / VIBES (Max 20 points)
    // ========================================
    const campaignNiche = campaign.niche || "";
    const creatorNiche = creator.niche || "";
    
    // Creator categories can come from vibes (the new field), categories, contentTypes, tags
    const creatorCategories = creator.vibes || creator.categories || creator.contentTypes || creator.tags || []; 
    const campaignVibes = campaign.vibes || [];

    let nicheScore = 0;
    
    // 1. Direct niche match (highly prioritized)
    if (campaignNiche && creatorNiche && campaignNiche === creatorNiche) {
        nicheScore += 15;
        reasons.push(`✓ Niche match exacto: ${campaignNiche}`);
    } else if (campaignNiche && creatorCategories.some((c: string) => c.toLowerCase().includes(campaignNiche.toLowerCase()) || campaignNiche.toLowerCase().includes(c.toLowerCase()))) {
        // Soft match: Creator's secondary category matches the campaign's main niche
        nicheScore += 10;
        reasons.push(`✓ Match con categoría secundaria: ${campaignNiche}`);
    } else if (creatorNiche && campaignVibes.some((v: string) => v.toLowerCase().includes(creatorNiche.toLowerCase()) || creatorNiche.toLowerCase().includes(v.toLowerCase()))) {
        // Soft match: Campaign's vibe matches creator's main niche
        nicheScore += 10;
        reasons.push(`✓ Match de vibe con nicho principal: ${creatorNiche}`);
    }

    // 2. Vibes / Secondary Categories match
    const matchedVibes = campaignVibes.filter((v: string) =>
        creatorCategories.some((c: string) =>
            c.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(c.toLowerCase())
        )
    );

    if (matchedVibes.length > 0) {
        // Up to 10 points for secondary vibes if no main niche match, 
        // or just pad to 20 if main niche matched
        const vibesPoints = matchedVibes.length * 5;
        nicheScore += vibesPoints;
        reasons.push(`✓ Matches vibes secundarias: ${matchedVibes.slice(0, 2).join(", ")}`);
    } else if (nicheScore === 0 && creatorCategories.length > 0) {
        // Soft match check against campaign description if no strong matches found
        const campaignContext = (campaign.name + " " + (campaign.description || "")).toLowerCase();
        if (creatorCategories.some((c: string) => campaignContext.includes(c.toLowerCase()))) {
            nicheScore += 5;
            reasons.push("Contenido relevante a la descripción de la campaña");
        }
    }

    breakdown.niche = Math.min(20, nicheScore);
    score += breakdown.niche;

    // ========================================
    // 4. CREATOR EXPERIENCE (Max 15 points)
    // ========================================
    const experienceTime = creator.experienceTime || "";
    const hasBrandExperience = creator.hasBrandExperience || false;

    // Base score from time creating content
    if (experienceTime.includes("3+ años") || experienceTime.includes("3+")) {
        breakdown.experience = 10;
        reasons.push("Highly experienced creator");
    } else if (experienceTime.includes("1-2 años") || experienceTime.includes("1-2")) {
        breakdown.experience = 7;
    } else if (experienceTime.includes("6-12 meses") || experienceTime.includes("6-12")) {
        breakdown.experience = 5;
    } else if (experienceTime.includes("Menos") || experienceTime.includes("menos")) {
        breakdown.experience = 3;
    }

    // Bonus for brand experience
    if (hasBrandExperience) {
        breakdown.experience = Math.min(15, breakdown.experience + 5);
        reasons.push("Has brand collaboration experience");
    }
    score += breakdown.experience;

    // ========================================
    // 5. SOCIAL METRICS (Max 15 points)
    // ========================================
    const igEr = creator.instagramMetrics?.engagementRate || 0;
    const igFollowers = creator.instagramMetrics?.followers || 0;
    const tkEr = creator.tiktokMetrics?.engagementRate || 0;
    const tkFollowers = creator.tiktokMetrics?.followers || 0;

    const er = Math.max(igEr, tkEr);
    const followers = Math.max(igFollowers, tkFollowers);

    // Engagement rate (10 points max)
    if (er >= 5) {
        breakdown.socialMetrics = 10;
        reasons.push("Exceptional engagement rate");
    } else if (er >= 3) {
        breakdown.socialMetrics = 8;
        reasons.push("High engagement rate");
    } else if (er >= 1.5) {
        breakdown.socialMetrics = 5;
    } else {
        breakdown.socialMetrics = 3;
    }

    // Follower count bonus (5 points max)
    if (followers >= 100000) {
        breakdown.socialMetrics += 5;
    } else if (followers >= 10000) {
        breakdown.socialMetrics += 4;
    } else if (followers >= 5000) {
        breakdown.socialMetrics += 3;
    } else if (followers >= 1000) {
        breakdown.socialMetrics += 2;
    }

    breakdown.socialMetrics = Math.min(15, breakdown.socialMetrics);
    score += breakdown.socialMetrics;

    // ========================================
    // 6. COMPOSITION (Max 10 points)
    // ========================================
    const whoAppearsInContent = creator.whoAppearsInContent || [];
    const campaignVibesList = (campaign.vibes || []).map((v: string) => v.toLowerCase());

    if (campaignVibesList.includes("maternidad") && whoAppearsInContent.includes("Mis hijos")) {
        breakdown.composition = 10;
        reasons.push("Match perfecto para campaña de maternidad (con hijos)");
    } else if (campaignVibesList.includes("familia") && (whoAppearsInContent.includes("Mis hijos") || whoAppearsInContent.includes("Mi familia"))) {
        breakdown.composition = 10;
        reasons.push("Ideal para campañas familiares");
    } else if (campaignVibesList.includes("mascotas") && whoAppearsInContent.includes("Mascotas")) {
        breakdown.composition = 10;
        reasons.push("Perfecto para contenido con mascotas");
    } else if (campaignVibesList.includes("romantic") && whoAppearsInContent.includes("Mi pareja")) {
        breakdown.composition = 10;
        reasons.push("Perfect fit for romantic campaign");
    } else if (whoAppearsInContent.includes("Solo yo")) {
        breakdown.composition = 5; // Neutral - works for most campaigns
    } else if (whoAppearsInContent.length > 0) {
        breakdown.composition = 5;
    }
    score += breakdown.composition;

    // ========================================
    // 7. DEMOGRAPHICS (Max 10 points)
    // ========================================
    if (campaign.location) {
        const campaignLoc = campaign.location.toLowerCase();
        const creatorLoc = (creator.location || "").toLowerCase();

        if (creatorLoc.includes(campaignLoc) || campaignLoc === "global" || campaignLoc === "any") {
            breakdown.demographics = 10;
            reasons.push("Perfect location match");
        } else if (creatorLoc && campaignLoc) {
            // Check if same country or region
            const sameRegion = creatorLoc.split(",")[0] === campaignLoc.split(",")[0];
            if (sameRegion) {
                breakdown.demographics = 5;
                reasons.push("Same region");
            }
        }
    } else {
        breakdown.demographics = 10; // No location requirement
    }
    score += breakdown.demographics;

    // ========================================
    // 8. AVAILABILITY (Max 5 points)
    // ========================================
    const creatorStatus = creator.status || "pending";

    if (creatorStatus === "active") {
        breakdown.availability = 5;
    } else if (creatorStatus === "pending") {
        breakdown.availability = 2; // Partial points - may become active
    }
    score += breakdown.availability;

    // Cap at 100
    score = Math.min(100, score);

    return { score, reasons, breakdown };
};
