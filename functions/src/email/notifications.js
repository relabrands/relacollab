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

    // 1. Welcome on registration
    exportsObj.onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
        const user = event.data?.data();
        if (!user?.email) return;
        const templateId = user.role === "creator" ? "welcome_creator" : "welcome_brand";
        await sendEmail(user.email, templateId, { name: user.displayName || "Usuario", email: user.email, dashboardUrl: `${BASE_URL}/${user.role}` });
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
            await sendEmail(brand.email, "application_received", { brandName: brand.displayName || "Brand", creatorName: creatorSnap.data()?.displayName || "Creator", campaignTitle: camp.name || "Campaign", matchesUrl: `${BASE_URL}/brand/matches` });
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
            await sendEmail(creator.email, "invitation_received", { creatorName: creator.displayName || "Creator", brandName: inv.campaignData?.brandName || camp.brandName || "Brand", campaignTitle: camp.name || "Campaign", budget: camp.budget ? `$${camp.budget}` : "Por acordar", opportunitiesUrl: `${BASE_URL}/creator/opportunities` });
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
            if (!creator?.email) return;
            await sendEmail(creator.email, "content_approved", { creatorName: creator.displayName || "Creator", campaignTitle: campSnap.data()?.name || "Campaign", earningsUrl: `${BASE_URL}/creator/earnings` });
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

    // 10. HTTP: test email
    exportsObj.sendTestEmail = functions.https.onRequest((req, res) => cors(req, res, async () => {
        const { templateId, toEmail, vars } = req.body;
        if (!templateId || !toEmail) return res.status(400).json({ error: "templateId and toEmail required" });
        await sendEmail(toEmail, templateId, vars || {});
        return res.json({ success: true });
    }));

    // 11. HTTP: seed templates
    exportsObj.seedEmailTemplates = functions.https.onRequest((req, res) => cors(req, res, async () => {
        const db = admin.firestore();
        const s = `body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f4f4f7}.container{max-width:600px;margin:0 auto}.header{background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0}.header h1{color:#fff;margin:0;font-size:26px}.header p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}.body{background:#fff;padding:40px 30px}.body p{color:#444;line-height:1.7;margin:0 0 16px}.hl{background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0}.hl .lb{font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.btn{display:inline-block;background:#7c3aed;color:#fff !important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;margin-top:24px}.footer{background:#f4f4f7;padding:20px;text-align:center;border-radius:0 0 12px 12px}.footer p{color:#999;font-size:12px;margin:4px 0}`;
        const w = (h, sh, b, bt, bu) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${s}</style></head><body><div class="container"><div class="header"><h1>${h}</h1><p>${sh}</p></div><div class="body">${b}<a href="${bu}" class="btn">${bt}</a></div><div class="footer"><p>© 2026 RELA Collab · relacollab.com</p></div></div></body></html>`;
        const tpls = {
            welcome_creator: { subject: "🎉 Bienvenido, {{name}}!", variables: ["name", "email", "dashboardUrl"], html: w("🎉 ¡Bienvenido!", "Tu cuenta de creador está activa", "<p>Hola <strong>{{name}}</strong>, ya puedes explorar campañas y conectar tus redes sociales.</p>", "Ver Oportunidades", "{{dashboardUrl}}") },
            welcome_brand: { subject: "🚀 ¡Cuenta de Marca lista, {{name}}!", variables: ["name", "email", "dashboardUrl"], html: w("🚀 ¡Bienvenido!", "Conecta con los mejores creadores", "<p>Hola <strong>{{name}}</strong>, crea tu primera campaña y la IA encontrará tus matches perfectos.</p>", "Crear Campaña", "{{dashboardUrl}}") },
            application_received: { subject: "📩 {{creatorName}} aplicó a {{campaignTitle}}", variables: ["brandName", "creatorName", "campaignTitle", "matchesUrl"], html: w("📩 Nueva Aplicación", "Un creador quiere colaborar", "<p>Hola <strong>{{brandName}}</strong>, <strong>{{creatorName}}</strong> aplicó a <strong>{{campaignTitle}}</strong>.</p>", "Revisar Aplicación", "{{matchesUrl}}") },
            invitation_received: { subject: "🎯 ¡Invitación a {{campaignTitle}}!", variables: ["creatorName", "brandName", "campaignTitle", "budget", "opportunitiesUrl"], html: w("🎯 Nueva Invitación", "Una marca te seleccionó", "<p>Hola <strong>{{creatorName}}</strong>, <strong>{{brandName}}</strong> te invitó a <strong>{{campaignTitle}}</strong>.</p><div class='hl'><div class='lb'>Presupuesto</div>{{budget}}</div>", "Ver Invitación", "{{opportunitiesUrl}}") },
            application_approved: { subject: "✅ ¡Aprobado en {{campaignTitle}}!", variables: ["creatorName", "brandName", "campaignTitle", "contentUrl"], html: w("✅ ¡Aprobado!", "Ya puedes empezar", "<p>Hola <strong>{{creatorName}}</strong>, <strong>{{brandName}}</strong> aprobó tu aplicación para <strong>{{campaignTitle}}</strong>.</p>", "Ver Campaña", "{{contentUrl}}") },
            application_rejected: { subject: "Actualización — {{campaignTitle}}", variables: ["creatorName", "campaignTitle", "opportunitiesUrl"], html: w("Actualización", "Sigue adelante", "<p>Hola <strong>{{creatorName}}</strong>, tu aplicación a <strong>{{campaignTitle}}</strong> no fue seleccionada esta vez. ¡Hay más oportunidades!</p>", "Ver Oportunidades", "{{opportunitiesUrl}}") },
            content_submitted: { subject: "📤 {{creatorName}} envió contenido — {{campaignTitle}}", variables: ["brandName", "creatorName", "campaignTitle", "postUrl", "reviewUrl"], html: w("📤 Contenido Enviado", "Listo para revisar", "<p>Hola <strong>{{brandName}}</strong>, <strong>{{creatorName}}</strong> envió contenido para <strong>{{campaignTitle}}</strong>.</p><div class='hl'><div class='lb'>Post URL</div>{{postUrl}}</div>", "Revisar Contenido", "{{reviewUrl}}") },
            content_revision: { subject: "✏️ Cambios solicitados — {{campaignTitle}}", variables: ["creatorName", "campaignTitle", "feedback", "contentUrl"], html: w("✏️ Revisión", "La marca tiene comentarios", "<p>Hola <strong>{{creatorName}}</strong>, la marca solicitó cambios en <strong>{{campaignTitle}}</strong>.</p><div class='hl'><div class='lb'>Feedback</div>{{feedback}}</div>", "Ver Contenido", "{{contentUrl}}") },
            content_approved: { subject: "🎉 ¡Contenido aprobado! — {{campaignTitle}}", variables: ["creatorName", "campaignTitle", "earningsUrl"], html: w("🎉 ¡Aprobado!", "Tu pago se procesará pronto", "<p>Hola <strong>{{creatorName}}</strong>, tu contenido para <strong>{{campaignTitle}}</strong> fue aprobado.</p>", "Ver Ganancias", "{{earningsUrl}}") },
            new_message: { subject: "💬 Mensaje de {{senderName}} — {{campaignTitle}}", variables: ["recipientName", "senderName", "campaignTitle", "messagePreview", "messagesUrl"], html: w("💬 Nuevo Mensaje", "", "<p>Hola <strong>{{recipientName}}</strong>, <strong>{{senderName}}</strong> te escribió sobre <strong>{{campaignTitle}}</strong>:</p><div class='hl'><em>{{messagePreview}}</em></div>", "Responder", "{{messagesUrl}}") },
            visit_scheduled: { subject: "📅 Visita — {{campaignTitle}}", variables: ["creatorName", "brandName", "campaignTitle", "visitDate", "visitTime", "location", "duration", "contentDeadline", "scheduleUrl"], html: w("📅 Visita Programada", "Revisa los detalles", "<p>Hola <strong>{{creatorName}}</strong>, tu visita con <strong>{{brandName}}</strong> para <strong>{{campaignTitle}}</strong> está confirmada.</p><div class='hl'><div class='lb'>Fecha y Hora</div>{{visitDate}} · {{visitTime}}</div><div class='hl'><div class='lb'>Ubicación</div>{{location}}</div><div class='hl'><div class='lb'>Duración</div>{{duration}} minutos</div><div class='hl'><div class='lb'>Fecha límite</div>{{contentDeadline}}</div>", "Ver Agenda", "{{scheduleUrl}}") },
        };
        const batch = db.batch();
        for (const [id, d] of Object.entries(tpls)) batch.set(db.doc(`emailTemplates/${id}`), { ...d, updatedAt: new Date().toISOString() }, { merge: true });
        await batch.commit();
        return res.json({ success: true, templatesSeeded: Object.keys(tpls).length });
    }));
}

module.exports = { registerEmailNotifications };
