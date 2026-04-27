/**
 * Email Notifications — firebase-functions v7 (Gen 2) compatible.
 * Usage: registerEmailNotifications(functions, admin, exports)
 */

const { Resend } = require("resend");
const cors = require("cors")({ origin: true });

const FROM = "RELA Collab <notificaciones@relacollab.com>";
const BASE_URL = "https://relacollab.com";

function registerEmailNotifications(functions, admin, exportsObj) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { onDocumentCreated, onDocumentUpdated } = functions.firestore;

    async function getTemplate(templateId, vars) {
        const snap = await admin.firestore().doc(`emailTemplates/${templateId}`).get();
        if (!snap.exists) { console.warn(`[Email] Template ${templateId} not found`); return null; }
        const { subject, html } = snap.data();
        const replace = (str) => str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
        return { subject: replace(subject), html: replace(html) };
    }

    async function sendEmail(to, templateId, vars) {
        const tpl = await getTemplate(templateId, vars);
        if (!tpl) return;
        try {
            await resend.emails.send({ from: FROM, to, ...tpl });
            console.log(`[Email] ${templateId} → ${to}`);
        } catch (err) { console.error(`[Email] Error ${templateId}:`, err); }
    }

    /**
     * Check if a user has enabled the given notification category.
     * category: 'campaignMatches' | 'campaignUpdates' | 'deliverableReminders' | 'paymentNotifications'
     * Always succeeds for account/system emails (welcome, pending, activated).
     */
    async function canSendEmail(userId, category) {
        try {
            const snap = await admin.firestore().doc(`users/${userId}`).get();
            if (!snap.exists) return true; // default allow
            const ns = snap.data().notificationSettings || {};
            // Master toggle
            if (ns.emailNotifications === false) return false;
            // Category toggle
            if (category && ns[category] === false) return false;
            return true;
        } catch (e) {
            console.warn('[Email] canSendEmail check failed:', e.message);
            return true; // fail open
        }
    }

    // 1. Welcome on registration
    exportsObj.onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
        const user = event.data?.data();
        if (!user?.email) return;
        const templateId = user.role === "creator" ? "welcome_creator" : "welcome_brand";
        await sendEmail(user.email, templateId, {
            name: user.displayName || "Usuario",
            email: user.email,
            dashboardUrl: `${BASE_URL}/${user.role}`,
            loginUrl: `${BASE_URL}/login`
        });
    });

    // 1.5 Creator & Brand Status Changes (Pending / Activated)
    exportsObj.onUserStatusChanged = onDocumentUpdated("users/{userId}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after) return;
        if (!after.email) return;

        try {
            const role = after.role; // "creator" or "brand"
            const name = after.displayName || (role === "creator" ? "Creador" : "Marca");

            // Trigger 2: Finished onboarding and is pending review
            if (after.onboardingCompleted === true && before.onboardingCompleted !== true) {
                const template = role === "creator" ? "creator_pending" : "brand_pending";
                await sendEmail(after.email, template, {
                    name,
                    email: after.email
                });
            } 
            // Trigger 3: Admin activates account
            else if (after.status === "active" && before.status !== "active") {
                const template = role === "creator" ? "creator_activated" : "brand_activated";
                await sendEmail(after.email, template, {
                    name,
                    dashboardUrl: `${BASE_URL}/${role}`
                });
            }
        } catch (err) {
            console.error("[Email] onUserStatusChanged:", err);
        }
    });

    // 2. Brand: new application
    exportsObj.onApplicationCreated = onDocumentCreated("applications/{appId}", async (event) => {
        const app = event.data?.data();
        if (!app) return;
        try {
            const [campSnap, creatorSnap] = await Promise.all([
                admin.firestore().doc(`campaigns/${app.campaignId}`).get(),
                admin.firestore().doc(`users/${app.creatorId}`).get(),
            ]);
            const camp = campSnap.data();
            if (!camp) return;
            const brandSnap = await admin.firestore().doc(`users/${camp.brandId}`).get();
            const brand = brandSnap.data();
            if (!brand?.email) return;
            // Brand doesn't have campaignUpdates pref gate — it's their own platform activity (always send)
            const isAcceptedInvite = app.isInvitation === true || app.status === "approved";
            const templateId = isAcceptedInvite ? "invitation_accepted" : "application_received";

            await sendEmail(brand.email, templateId, {
                brandName: brand.displayName || "Brand",
                creatorName: creatorSnap.data()?.displayName || "Creator",
                campaignTitle: camp.name || "Campaign",
                matchesUrl: `${BASE_URL}/brand/matches`
            });
        } catch (err) { console.error("[Email] onApplicationCreated:", err); }
    });

    // 3. Creator: invitation received
    exportsObj.onInvitationCreated = onDocumentCreated("invitations/{invId}", async (event) => {
        const inv = event.data?.data();
        if (!inv) return;
        try {
            const [creatorSnap, campSnap] = await Promise.all([
                admin.firestore().doc(`users/${inv.creatorId}`).get(),
                admin.firestore().doc(`campaigns/${inv.campaignId}`).get(),
            ]);
            const creator = creatorSnap.data();
            const camp = campSnap.data();
            if (!creator?.email || !camp) return;

            // Respect creator notification settings
            if (!(await canSendEmail(inv.creatorId, 'campaignMatches'))) {
                console.log(`[Email] Creator ${inv.creatorId} has disabled campaignMatches notifications. Skipping invitation_received.`);
                return;
            }

            // Build compensation string based on compensationType
            let compensationStr = "";
            const ct = camp.compensationType || camp.rewardType || "";
            const amountVal = camp.maxReward || camp.budget || camp.totalBudgetPerCreator || camp.creatorPayment || 0;
            const money = amountVal ? `$${amountVal} USD` : "";

            if (ct === "monetary" || ct === "paid") {
                compensationStr = money || "Por acordar";
            } else if (ct === "exchange") {
                compensationStr = camp.exchangeDetails || "Intercambio de producto/servicio";
            } else if (ct === "hybrid") {
                const exch = camp.exchangeDetails || "";
                compensationStr = [money, exch].filter(Boolean).join(" + ") || "Por acordar";
            } else {
                compensationStr = money || "Por acordar";
            }

            await sendEmail(creator.email, "invitation_received", {
                creatorName: creator.displayName || "Creator",
                brandName: inv.campaignData?.brandName || camp.brandName || "Brand",
                campaignTitle: camp.name || "Campaign",
                compensation: compensationStr,
                opportunitiesUrl: `${BASE_URL}/creator/opportunities`,
            });
        } catch (err) { console.error("[Email] onInvitationCreated:", err); }
    });

    // 4. Creator: application approved/rejected
    exportsObj.onApplicationStatusChanged = onDocumentUpdated("applications/{appId}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after || before.status === after.status) return;
        try {
            const [creatorSnap, campSnap] = await Promise.all([
                admin.firestore().doc(`users/${after.creatorId}`).get(),
                admin.firestore().doc(`campaigns/${after.campaignId}`).get(),
            ]);
            const creator = creatorSnap.data();
            if (!creator?.email) return;
            const camp = campSnap.data();

            // Respect creator notification settings
            if (!(await canSendEmail(after.creatorId, 'campaignUpdates'))) {
                console.log(`[Email] Creator ${after.creatorId} has disabled campaignUpdates. Skipping.`);
                return;
            }

            if (after.status === "approved") {
                await sendEmail(creator.email, "application_approved", { creatorName: creator.displayName || "Creator", campaignTitle: camp?.name || "Campaign", brandName: camp?.brandName || "Brand", contentUrl: `${BASE_URL}/creator/content` });
            } else if (after.status === "rejected") {
                await sendEmail(creator.email, "application_rejected", { creatorName: creator.displayName || "Creator", campaignTitle: camp?.name || "Campaign", opportunitiesUrl: `${BASE_URL}/creator/opportunities` });
            }
        } catch (err) { console.error("[Email] onApplicationStatusChanged:", err); }
    });

    // 5. Brand: content submitted
    exportsObj.onContentSubmitted = onDocumentCreated("content_submissions/{subId}", async (event) => {
        const sub = event.data?.data();
        if (!sub) return;
        try {
            const [campSnap, creatorSnap] = await Promise.all([
                admin.firestore().doc(`campaigns/${sub.campaignId}`).get(),
                admin.firestore().doc(`users/${sub.userId}`).get(),
            ]);
            const camp = campSnap.data();
            if (!camp) return;
            const brandSnap = await admin.firestore().doc(`users/${camp.brandId}`).get();
            const brand = brandSnap.data();
            if (!brand?.email) return;
            await sendEmail(brand.email, "content_submitted", { brandName: brand.displayName || "Brand", creatorName: creatorSnap.data()?.displayName || "Creator", campaignTitle: camp.name || "Campaign", postUrl: sub.postUrl || "", reviewUrl: `${BASE_URL}/brand/content` });
        } catch (err) { console.error("[Email] onContentSubmitted:", err); }
    });

    // 6. Creator: revision requested
    exportsObj.onContentRevisionRequested = onDocumentUpdated("content_submissions/{subId}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after || before.status === after.status || after.status !== "revision_requested") return;
        try {
            const [creatorSnap, campSnap] = await Promise.all([
                admin.firestore().doc(`users/${after.userId}`).get(),
                admin.firestore().doc(`campaigns/${after.campaignId}`).get(),
            ]);
            const creator = creatorSnap.data();
            if (!creator?.email) return;
            if (!(await canSendEmail(after.userId, 'deliverableReminders'))) return;
            await sendEmail(creator.email, "content_revision", { creatorName: creator.displayName || "Creator", campaignTitle: campSnap.data()?.name || "Campaign", feedback: after.brandFeedback || "La marca ha solicitado cambios.", contentUrl: `${BASE_URL}/creator/content` });
        } catch (err) { console.error("[Email] onContentRevisionRequested:", err); }
    });

    // 7. Creator: content approved
    exportsObj.onContentApproved = onDocumentUpdated("content_submissions/{sub2Id}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after || before.status === after.status || after.status !== "approved") return;
        try {
            const [creatorSnap, campSnap] = await Promise.all([
                admin.firestore().doc(`users/${after.userId}`).get(),
                admin.firestore().doc(`campaigns/${after.campaignId}`).get(),
            ]);
            const creator = creatorSnap.data();
            const camp = campSnap.data();
            if (!creator?.email || !camp) return;
            if (!(await canSendEmail(after.userId, 'deliverableReminders'))) return;

            // Calculate pending deliverables logic
            let pendingItemsText = "";
            let totalRequired = 0;
            if (Array.isArray(camp.deliverables)) {
                totalRequired = camp.deliverables.reduce((acc, current) => {
                    return acc + (current.required ? Number(current.quantity) || 1 : 0);
                }, 0);
            } else {
                 totalRequired = 1; // Default
            }

            const approvedSubmissionsQuery = await admin.firestore().collection("content_submissions")
                                            .where("campaignId", "==", after.campaignId)
                                            .where("userId", "==", after.userId)
                                            .where("status", "==", "approved")
                                            .get();
            
            const approvedCount = approvedSubmissionsQuery.size;

            if (approvedCount < totalRequired) {
                const remaining = totalRequired - approvedCount;
                pendingItemsText = `Aún falta(n) ${remaining} entregable(s) por subir o ser aprobado(s) para completar tu participación en esta campaña.`;
            } else {
                pendingItemsText = "¡Todos los entregables requeridos para tu participación en esta campaña han sido aprobados!";
            }

            await sendEmail(creator.email, "content_approved", { 
                creatorName: creator.displayName || "Creator", 
                campaignTitle: camp.name || "Campaign", 
                earningsUrl: `${BASE_URL}/creator/earnings`,
                pendingItemsText: pendingItemsText 
            });
        } catch (err) { console.error("[Email] onContentApproved:", err); }
    });

    // 8. New message notification
    exportsObj.sendNewMessageEmail = onDocumentCreated("messages/{messageId}", async (event) => {
        const msg = event.data?.data();
        if (!msg || msg.type !== "text") return;
        try {
            const collabSnap = await admin.firestore().doc(`applications/${msg.collaborationId}`).get();
            const collab = collabSnap.data();
            if (!collab) return;
            const recipientId = msg.senderRole === "brand" ? collab.creatorId : collab.brandId;
            const [recipientSnap, campSnap] = await Promise.all([
                admin.firestore().doc(`users/${recipientId}`).get(),
                admin.firestore().doc(`campaigns/${collab.campaignId}`).get(),
            ]);
            const recipient = recipientSnap.data();
            if (!recipient?.email) return;
            await sendEmail(recipient.email, "new_message", { recipientName: recipient.displayName || "Usuario", senderName: msg.senderName || "Alguien", campaignTitle: campSnap.data()?.name || "Campaign", messagePreview: (msg.text || "").substring(0, 150), messagesUrl: `${BASE_URL}/messages` });
        } catch (err) { console.error("[Email] sendNewMessageEmail:", err); }
    });

    // 9. Visit scheduled
    exportsObj.sendVisitScheduledEmail = onDocumentCreated("visitSchedules/{scheduleId}", async (event) => {
        const visit = event.data?.data();
        if (!visit) return;
        try {
            const [creatorSnap, campSnap] = await Promise.all([
                admin.firestore().doc(`users/${visit.creatorId}`).get(),
                admin.firestore().doc(`campaigns/${visit.campaignId}`).get(),
            ]);
            const creator = creatorSnap.data();
            const camp = campSnap.data();
            if (!creator?.email || !camp) return;
            const brandSnap = await admin.firestore().doc(`users/${camp.brandId}`).get();
            const brand = brandSnap.data();
            await sendEmail(creator.email, "visit_scheduled", { creatorName: creator.displayName || "Creator", brandName: brand?.displayName || "Brand", campaignTitle: camp.name || "Campaign", visitDate: new Date(visit.scheduledDate).toLocaleDateString("es-DO"), visitTime: visit.scheduledTime, location: `${visit.location?.address || ""}, ${visit.location?.city || ""}`, duration: String(visit.duration), contentDeadline: new Date(visit.contentDeadline).toLocaleDateString("es-DO"), scheduleUrl: `${BASE_URL}/creator/schedule` });
        } catch (err) { console.error("[Email] sendVisitScheduledEmail:", err); }
    });

    // 10. Withdrawal Requested — Creator notified
    exportsObj.onPayoutRequested = onDocumentUpdated("payouts/{payoutId}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after || before.status === after.status) return;
        if (after.status !== "requested") return;
        try {
            const creatorSnap = await admin.firestore().doc(`users/${after.userId || after.creatorId}`).get();
            const creator = creatorSnap.data();
            if (!creator?.email) return;
            if (!(await canSendEmail(after.userId || after.creatorId, 'paymentNotifications'))) return;
            await sendEmail(creator.email, "withdrawal_requested", {
                creatorName: creator.displayName || "Creator",
                amount: after.netAmount ? `$${after.netAmount}` : (after.amount ? `$${after.amount}` : ""),
                earningsUrl: `${BASE_URL}/creator/earnings`,
            });
        } catch (err) { console.error("[Email] onPayoutRequested:", err); }
    });

    // 11. Withdrawal Approved/Sent — Creator notified
    exportsObj.onPayoutStatusChanged = onDocumentUpdated("payouts/{payoutId}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after || before.status === after.status) return;
        if (after.status !== "paid" && after.status !== "completed" && after.status !== "sent") return;
        try {
            const creatorSnap = await admin.firestore().doc(`users/${after.userId || after.creatorId}`).get();
            const creator = creatorSnap.data();
            if (!creator?.email) return;
            if (!(await canSendEmail(after.userId || after.creatorId, 'paymentNotifications'))) return;
            await sendEmail(creator.email, "withdrawal_approved", {
                creatorName: creator.displayName || "Creator",
                amount: after.amount ? `$${after.amount}` : "",
                earningsUrl: `${BASE_URL}/creator/earnings`,
            });
        } catch (err) { console.error("[Email] onPayoutStatusChanged:", err); }
    });

    // 12. Callable: send test email (used by admin frontend via httpsCallable)
    exportsObj.sendTestEmail = functions.https.onCall(async (request) => {
        const { templateId, toEmail, vars } = request.data || request;
        if (!templateId || !toEmail) {
            throw new functions.https.HttpsError("invalid-argument", "templateId and toEmail are required");
        }
        await sendEmail(toEmail, templateId, vars || {});
        return { success: true };
    });

    // 11. HTTP: seed templates
    exportsObj.seedEmailTemplates = functions.https.onRequest((req, res) => cors(req, res, async () => {
        const db = admin.firestore();
        const s = `body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f4f4f7}.container{max-width:600px;margin:0 auto}.header{background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0}.header h1{color:#fff;margin:0;font-size:26px}.header p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}.body{background:#fff;padding:40px 30px}.body p{color:#444;line-height:1.7;margin:0 0 16px}.hl{background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0}.hl .lb{font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.btn{display:inline-block;background:#7c3aed;color:#fff !important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;margin-top:24px}.footer{background:#f4f4f7;padding:20px;text-align:center;border-radius:0 0 12px 12px}.footer p{color:#999;font-size:12px;margin:4px 0}`;
        const w = (h, sh, b, bt, bu) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${s}</style></head><body><div class="container"><div class="header"><h1>${h}</h1><p>${sh}</p></div><div class="body">${b}<a href="${bu}" class="btn">${bt}</a></div><div class="footer"><p>© 2026 RELA Collab · relacollab.com</p></div></div></body></html>`;
        const tpls = {
            welcome_creator: { subject: "🎉 Bienvenido, {{name}}!", variables: ["name", "email", "loginUrl"], html: w("🎉 ¡Bienvenido!", "Completa tu perfil para empezar", "<p>Hola <strong>{{name}}</strong>, gracias por unirte a RELA Collab. Para poder conectar con las mejores marcas, es necesario que completes tu perfil y vincules tus redes sociales.</p>", "Completar mi Perfil", "{{loginUrl}}") },
            creator_pending: { subject: "⏳ Perfil en revisión", variables: ["name", "email"], html: w("⏳ Perfil Recibido", "Estamos revisando tus datos", "<p>Hola <strong>{{name}}</strong>, hemos recibido tu información. Nuestro equipo está revisando tu perfil para asegurarse de mantener el nivel de calidad de la comunidad.</p><p>Te avisaremos tan pronto tu cuenta sea activada.</p>", "Ver RELA Collab", "https://relacollab.com") },
            creator_activated: { subject: "🚀 ¡Cuenta Activada, {{name}}!", variables: ["name", "dashboardUrl"], html: w("🚀 ¡Cuenta Activada!", "Ya puedes participar en campañas", "<p>Hola <strong>{{name}}</strong>, ¡felicidades! Tu perfil ha sido aprobado y tu cuenta está activa. Ya puedes aplicar a campañas y recibir invitaciones de marcas.</p>", "Explorar Oportunidades", "{{dashboardUrl}}") },
            welcome_brand: { subject: "🚀 ¡Bienvenido a RELA Collab, {{name}}!", variables: ["name", "email", "loginUrl"], html: w("🚀 ¡Bienvenido!", "Completa el perfil de tu empresa", "<p>Hola <strong>{{name}}</strong>, gracias por registrarte en RELA Collab. Para empezar a crear campañas y conectar con creadores, por favor completa la información de tu empresa.</p>", "Completar mi Perfil", "{{loginUrl}}") },
            brand_pending: { subject: "⏳ Cuenta de Marca en revisión", variables: ["name", "email"], html: w("⏳ Perfil Recibido", "Estamos verificando los datos de tu empresa", "<p>Hola <strong>{{name}}</strong>, hemos recibido la información de tu marca. Nuestro equipo la está revisando para garantizar la seguridad de nuestra comunidad.</p><p>Te notificaremos en cuanto tu cuenta esté activa para crear campañas.</p>", "Ir a RELA Collab", "https://relacollab.com") },
            brand_activated: { subject: "✅ ¡Cuenta de Marca Activada!", variables: ["name", "dashboardUrl"], html: w("✅ ¡Cuenta Activada!", "Crea tu primera campaña hoy", "<p>Hola <strong>{{name}}</strong>, tu cuenta de empresa ha sido aprobada exitosamente. Ya puedes empezar a crear campañas y hacer match con los creadores ideales.</p>", "Crear Campaña", "{{dashboardUrl}}") },
            application_received: { subject: "📩 {{creatorName}} aplicó a {{campaignTitle}}", variables: ["brandName", "creatorName", "campaignTitle", "matchesUrl"], html: w("📩 Nueva Aplicación", "Un creador quiere colaborar", "<p>Hola <strong>{{brandName}}</strong>, <strong>{{creatorName}}</strong> aplicó a <strong>{{campaignTitle}}</strong>.</p>", "Revisar Aplicación", "{{matchesUrl}}") },
            invitation_received: { subject: "🎯 ¡Invitación a {{campaignTitle}}!", variables: ["creatorName", "brandName", "campaignTitle", "compensation", "opportunitiesUrl"], html: w("🎯 Nueva Invitación", "Una marca te seleccionó", "<p>Hola <strong>{{creatorName}}</strong>, <strong>{{brandName}}</strong> te invitó a <strong>{{campaignTitle}}</strong>.</p><div class='hl'><div class='lb'>Compensación</div>{{compensation}}</div>", "Ver Invitación", "{{opportunitiesUrl}}") },
            application_approved: { subject: "✅ ¡Aprobado en {{campaignTitle}}!", variables: ["creatorName", "brandName", "campaignTitle", "contentUrl"], html: w("✅ ¡Aprobado!", "Ya puedes empezar", "<p>Hola <strong>{{creatorName}}</strong>, <strong>{{brandName}}</strong> aprobó tu aplicación para <strong>{{campaignTitle}}</strong>.</p>", "Ver Campaña", "{{contentUrl}}") },
            application_rejected: { subject: "Actualización — {{campaignTitle}}", variables: ["creatorName", "campaignTitle", "opportunitiesUrl"], html: w("Actualización", "Sigue adelante", "<p>Hola <strong>{{creatorName}}</strong>, tu aplicación a <strong>{{campaignTitle}}</strong> no fue seleccionada esta vez. ¡Hay más oportunidades!</p>", "Ver Oportunidades", "{{opportunitiesUrl}}") },
            content_submitted: { subject: "📤 {{creatorName}} envió contenido — {{campaignTitle}}", variables: ["brandName", "creatorName", "campaignTitle", "postUrl", "reviewUrl"], html: w("📤 Contenido Enviado", "Listo para revisar", "<p>Hola <strong>{{brandName}}</strong>, <strong>{{creatorName}}</strong> envió contenido para <strong>{{campaignTitle}}</strong>.</p><div class='hl'><div class='lb'>Post URL</div>{{postUrl}}</div>", "Revisar Contenido", "{{reviewUrl}}") },
            content_revision: { subject: "✏️ Cambios solicitados — {{campaignTitle}}", variables: ["creatorName", "campaignTitle", "feedback", "contentUrl"], html: w("✏️ Revisión", "La marca tiene comentarios", "<p>Hola <strong>{{creatorName}}</strong>, la marca solicitó cambios en <strong>{{campaignTitle}}</strong>.</p><div class='hl'><div class='lb'>Feedback</div>{{feedback}}</div>", "Ver Contenido", "{{contentUrl}}") },
            content_approved: { subject: "🎉 ¡Contenido aprobado! — {{campaignTitle}}", variables: ["creatorName", "campaignTitle", "earningsUrl"], html: w("🎉 ¡Aprobado!", "Tu pago se procesará pronto", "<p>Hola <strong>{{creatorName}}</strong>, tu contenido para <strong>{{campaignTitle}}</strong> fue aprobado.</p>", "Ver Ganancias", "{{earningsUrl}}") },
            new_message: { subject: "💬 Mensaje de {{senderName}} — {{campaignTitle}}", variables: ["recipientName", "senderName", "campaignTitle", "messagePreview", "messagesUrl"], html: w("💬 Nuevo Mensaje", "", "<p>Hola <strong>{{recipientName}}</strong>, <strong>{{senderName}}</strong> te escribió sobre <strong>{{campaignTitle}}</strong>:</p><div class='hl'><em>{{messagePreview}}</em></div>", "Responder", "{{messagesUrl}}") },
            visit_scheduled: { subject: "📅 Visita — {{campaignTitle}}", variables: ["creatorName", "brandName", "campaignTitle", "visitDate", "visitTime", "location", "duration", "contentDeadline", "scheduleUrl"], html: w("📅 Visita Programada", "Revisa los detalles", "<p>Hola <strong>{{creatorName}}</strong>, tu visita con <strong>{{brandName}}</strong> para <strong>{{campaignTitle}}</strong> está confirmada.</p><div class='hl'><div class='lb'>Fecha y Hora</div>{{visitDate}} · {{visitTime}}</div><div class='hl'><div class='lb'>Ubicación</div>{{location}}</div><div class='hl'><div class='lb'>Duración</div>{{duration}} minutos</div><div class='hl'><div class='lb'>Fecha límite</div>{{contentDeadline}}</div>", "Ver Agenda", "{{scheduleUrl}}") },
            withdrawal_requested: { subject: "💸 Solicitud de retiro recibida — {{amount}}", variables: ["creatorName", "amount", "earningsUrl"], html: w("💸 Solicitud de Retiro", "Hemos recibido tu solicitud", "<p>Hola <strong>{{creatorName}}</strong>, recibimos tu solicitud de retiro por <strong>{{amount}}</strong>. La procesaremos en un plazo de 2–5 días hábiles.</p><div class='hl'><div class='lb'>Monto solicitado</div>{{amount}}</div>", "Ver mis Ganancias", "{{earningsUrl}}") },
            withdrawal_approved: { subject: "✅ Retiro enviado — {{amount}}", variables: ["creatorName", "amount", "earningsUrl"], html: w("✅ Retiro Procesado", "Tu pago fue enviado", "<p>Hola <strong>{{creatorName}}</strong>, tu retiro de <strong>{{amount}}</strong> fue aprobado y enviado a tu cuenta bancaria registrada. Puede tardar 1–3 días hábiles en reflejarse.</p><div class='hl'><div class='lb'>Monto enviado</div>{{amount}}</div>", "Ver mis Ganancias", "{{earningsUrl}}") },
            new_opportunity: { subject: "✨ ¡Nueva Oportunidad! {{matchScore}} Match con {{brandName}}", variables: ["creatorName", "brandName", "campaignTitle", "matchScore", "dashboardUrl"], html: w("✨ ¡Nueva Oportunidad!", "Descubrimos un match perfecto para ti", "<p>Hola <strong>{{creatorName}}</strong>, nuestra IA encontró una campaña de <strong>{{brandName}}</strong> que hace un <strong>{{matchScore}}</strong> de match con tu perfil y audiencia.</p><div class='hl'><div class='lb'>Campaña</div>{{campaignTitle}}</div><p>Revisa los detalles y aplica antes de que se agoten los cupos.</p>", "Ver Oportunidad", "{{dashboardUrl}}") },
            onboarding_reminder: { subject: "⌛ Termina de configurar tu perfil, {{name}}!", variables: ["name", "stepMessage", "dashboardUrl"], html: w("⌛ ¡Completa tu perfil!", "Te quedaste a un paso de terminar", "<p>Hola <strong>{{name}}</strong>, notamos que no has terminado de configurar tu perfil.</p><div class='hl'><div class='lb'>Paso Pendiente</div>{{stepMessage}}</div><p>Completar tu perfil es indispensable para empezar a recibir oportunidades de campañas con las mejores marcas.</p>", "Completar Onboarding", "{{dashboardUrl}}") },
            instagram_token_expired: { subject: "⚠️ Tu conexión de Instagram expiró — Reconecta para no perder oportunidades", variables: ["creatorName", "settingsUrl"], html: w("⚠️ Tu Instagram necesita reconexión", "Tu acceso expiró — reconéctalo en 2 minutos", "<p>Hola <strong>{{creatorName}}</strong>,</p><p>Notamos que tu conexión de Instagram ha expirado. Los tokens de acceso de Instagram duran <strong>60 días</strong> y se renuevan automáticamente si inicias sesión regularmente — pero el tuyo ha caducado.</p><div class='hl'><div class='lb'>¿Por qué importa?</div>Las marcas ven tus publicaciones recientes de Instagram cuando evalúan si trabajar contigo. Sin conexión activa, tu perfil pierde visibilidad y podrías perder oportunidades de colaboración.</div><p>Reconectar toma menos de 2 minutos. Solo ve a tu perfil y vuelve a conectar tu cuenta de Instagram.</p>", "Reconectar mi Instagram", "{{settingsUrl}}") },
            password_reset: { subject: "🔒 Restablece tu contraseña - RELA Collab", variables: ["name", "resetUrl"], html: w("🔒 Restablecer Contraseña", "Solicitud de cambio de contraseña", "<p>Hola <strong>{{name}}</strong>, hemos recibido una solicitud para cambiar tu contraseña.</p><p>Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.</p>", "Cambiar mi Contraseña", "{{resetUrl}}") },
        };
        const batch = db.batch();
        for (const [id, d] of Object.entries(tpls)) batch.set(db.doc(`emailTemplates/${id}`), { ...d, updatedAt: new Date().toISOString() }, { merge: true });
        await batch.commit();
        return res.json({ success: true, templatesSeeded: Object.keys(tpls).length });
    }));

    // 12. Creator receives new opportunity match
    exportsObj.onMatchCreated = onDocumentCreated("campaigns/{campaignId}/matches/{creatorId}", async (event) => {
        const match = event.data?.data();
        if (!match || !match.aiAnalysis || !match.aiAnalysis.matchPercentage) return;

        // Only notify if it's a strongly matched opportunity (>= 75%)
        if (match.aiAnalysis.matchPercentage < 75) return;

        try {
            const { campaignId, creatorId } = event.params;

            const [creatorDoc, campaignDoc] = await Promise.all([
                admin.firestore().doc(`users/${creatorId}`).get(),
                admin.firestore().doc(`campaigns/${campaignId}`).get(),
            ]);

            const creator = creatorDoc.data();
            const campaign = campaignDoc.data();
            if (!creator?.email || !campaign) return;

            const brandDoc = await admin.firestore().doc(`users/${campaign.brandId}`).get();
            const brand = brandDoc.data();

            // Ensure they haven't already applied to avoid duplicate confusion
            const applicationSnap = await admin.firestore().collection("applications")
                .where("creatorId", "==", creatorId)
                .where("campaignId", "==", campaignId)
                .get();

            if (!applicationSnap.empty) return;

            await sendEmail(creator.email, "new_opportunity", {
                creatorName: creator.displayName || "Creator",
                brandName: brand?.brandName || brand?.displayName || "Brand",
                campaignTitle: campaign.name || "Campaign",
                matchScore: `${match.aiAnalysis.matchPercentage}%`,
                dashboardUrl: `${BASE_URL}/creator/opportunities`,
            });
        } catch (err) {
            console.error("[Email] onMatchCreated error:", err);
        }
    });
    // 13. Instagram token expired — notify creator to reconnect
    exportsObj.onInstagramTokenExpired = onDocumentUpdated("users/{userId}", async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after) return;
        // Only trigger when the flag flips to true
        if (before.instagramTokenExpired === true || after.instagramTokenExpired !== true) return;
        // Anti-spam: only send once per 24h
        const notifiedAt = after.instagramTokenExpiredNotifiedAt;
        if (notifiedAt) {
            const hoursSince = (Date.now() - new Date(notifiedAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince < 24) return;
        }
        if (!after.email) return;
        try {
            await sendEmail(after.email, "instagram_token_expired", {
                creatorName: after.displayName || "Creator",
                settingsUrl: `${BASE_URL}/creator/profile`,
            });
            // Record that notification was sent
            await admin.firestore().doc(`users/${event.params.userId}`).update({
                instagramTokenExpiredNotifiedAt: new Date().toISOString(),
            });
            console.log(`[Email] instagram_token_expired → ${after.email}`);
        } catch (err) {
            console.error("[Email] onInstagramTokenExpired:", err);
        }
    });
    // 14. Custom Password Reset via Resend
    exportsObj.requestPasswordReset = functions.https.onCall(async (request) => {
        const { email } = request.data || request;
        if (!email) {
            throw new functions.https.HttpsError("invalid-argument", "El email es requerido");
        }

        try {
            // Generate the reset link using Firebase Admin SDK
            const resetUrl = await admin.auth().generatePasswordResetLink(email);

            // Get the user by email to get their display name
            const userRecord = await admin.auth().getUserByEmail(email);
            let displayName = userRecord.displayName;

            if (!displayName) {
                // Try to find the user in Firestore to get displayName
                const usersSnap = await admin.firestore().collection("users").where("email", "==", email).get();
                if (!usersSnap.empty) {
                    displayName = usersSnap.docs[0].data().displayName;
                }
            }
            
            // Send the custom email using Resend and our template
            await sendEmail(email, "password_reset", {
                name: displayName || "Usuario",
                resetUrl: resetUrl
            });

            return { success: true };
        } catch (error) {
            console.error("[Email] requestPasswordReset error:", error);
            // Return success to prevent email enumeration attacks, even if not found
            return { success: true };
        }
    });
}

module.exports = { registerEmailNotifications };
