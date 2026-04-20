import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "RELA Collab <notificaciones@relacollab.com>";
const BASE_URL = "https://relacollab.com";

// ─── Helper: fetch template from Firestore & substitute vars ──────────────────
async function getTemplate(templateId: string, vars: Record<string, string>): Promise<{ subject: string; html: string } | null> {
  const snap = await admin.firestore().doc(`emailTemplates/${templateId}`).get();
  if (!snap.exists) {
    console.warn(`Template ${templateId} not found in Firestore`);
    return null;
  }
  const { subject, html } = snap.data() as { subject: string; html: string };
  const replace = (str: string) => str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
  return { subject: replace(subject), html: replace(html) };
}

// ─── Helper: send email ────────────────────────────────────────────────────────
async function sendEmail(to: string, templateId: string, vars: Record<string, string>) {
  const template = await getTemplate(templateId, vars);
  if (!template) return;
  try {
    await resend.emails.send({ from: FROM, to, ...template });
    console.log(`[Email] ${templateId} → ${to}`);
  } catch (err) {
    console.error(`[Email] Error sending ${templateId} to ${to}:`, err);
  }
}

// ─── 1. Welcome Email on User Registration ────────────────────────────────────
export const onUserCreated = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap) => {
    const user = snap.data();
    if (!user?.email) return;

    const templateId = user.role === "creator" ? "welcome_creator" : "welcome_brand";
    await sendEmail(user.email, templateId, {
      name: user.displayName || "Usuario",
      email: user.email,
      dashboardUrl: `${BASE_URL}/${user.role}`,
    });
  });

// ─── 2. Brand receives new application from creator ───────────────────────────
export const onApplicationCreated = functions.firestore
  .document("applications/{appId}")
  .onCreate(async (snap) => {
    const app = snap.data();
    try {
      const [campaignDoc, creatorDoc] = await Promise.all([
        admin.firestore().doc(`campaigns/${app.campaignId}`).get(),
        admin.firestore().doc(`users/${app.creatorId}`).get(),
      ]);
      const campaign = campaignDoc.data();
      if (!campaign) return;
      const brandDoc = await admin.firestore().doc(`users/${campaign.brandId}`).get();
      const brand = brandDoc.data();
      const creator = creatorDoc.data();
      if (!brand?.email) return;

      await sendEmail(brand.email, "application_received", {
        brandName: brand.displayName || "Brand",
        creatorName: creator?.displayName || "Creator",
        campaignTitle: campaign.name || "Campaign",
        matchesUrl: `${BASE_URL}/brand/matches`,
      });
    } catch (err) {
      console.error("[Email] onApplicationCreated error:", err);
    }
  });

// ─── 3. Creator receives invitation from brand ────────────────────────────────
export const onInvitationCreated = functions.firestore
  .document("invitations/{invId}")
  .onCreate(async (snap) => {
    const inv = snap.data();
    try {
      const [creatorDoc, campaignDoc] = await Promise.all([
        admin.firestore().doc(`users/${inv.creatorId}`).get(),
        admin.firestore().doc(`campaigns/${inv.campaignId}`).get(),
      ]);
      const creator = creatorDoc.data();
      const campaign = campaignDoc.data();
      if (!creator?.email || !campaign) return;

      await sendEmail(creator.email, "invitation_received", {
        creatorName: creator.displayName || "Creator",
        brandName: inv.campaignData?.brandName || campaign.brandName || "Brand",
        campaignTitle: campaign.name || "Campaign",
        budget: campaign.budget ? `$${campaign.budget}` : "Por acordar",
        opportunitiesUrl: `${BASE_URL}/creator/opportunities`,
      });
    } catch (err) {
      console.error("[Email] onInvitationCreated error:", err);
    }
  });

// ─── 4. Creator gets approved / application status update ────────────────────
export const onApplicationStatusChanged = functions.firestore
  .document("applications/{appId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) return;

    try {
      const [creatorDoc, campaignDoc] = await Promise.all([
        admin.firestore().doc(`users/${after.creatorId}`).get(),
        admin.firestore().doc(`campaigns/${after.campaignId}`).get(),
      ]);
      const creator = creatorDoc.data();
      const campaign = campaignDoc.data();
      if (!creator?.email) return;

      if (after.status === "approved") {
        await sendEmail(creator.email, "application_approved", {
          creatorName: creator.displayName || "Creator",
          campaignTitle: campaign?.name || "Campaign",
          brandName: campaign?.brandName || "Brand",
          contentUrl: `${BASE_URL}/creator/content`,
        });
      } else if (after.status === "rejected") {
        await sendEmail(creator.email, "application_rejected", {
          creatorName: creator.displayName || "Creator",
          campaignTitle: campaign?.name || "Campaign",
          opportunitiesUrl: `${BASE_URL}/creator/opportunities`,
        });
      }
    } catch (err) {
      console.error("[Email] onApplicationStatusChanged error:", err);
    }
  });

// ─── 5. Brand receives content submission ────────────────────────────────────
export const onContentSubmitted = functions.firestore
  .document("content_submissions/{subId}")
  .onCreate(async (snap) => {
    const sub = snap.data();
    try {
      const [campaignDoc, creatorDoc] = await Promise.all([
        admin.firestore().doc(`campaigns/${sub.campaignId}`).get(),
        admin.firestore().doc(`users/${sub.userId}`).get(),
      ]);
      const campaign = campaignDoc.data();
      if (!campaign) return;
      const brandDoc = await admin.firestore().doc(`users/${campaign.brandId}`).get();
      const brand = brandDoc.data();
      const creator = creatorDoc.data();
      if (!brand?.email) return;

      await sendEmail(brand.email, "content_submitted", {
        brandName: brand.displayName || "Brand",
        creatorName: creator?.displayName || "Creator",
        campaignTitle: campaign.name || "Campaign",
        postUrl: sub.postUrl || "",
        reviewUrl: `${BASE_URL}/brand/content`,
      });
    } catch (err) {
      console.error("[Email] onContentSubmitted error:", err);
    }
  });

// ─── 6. Creator receives a revision request from brand ───────────────────────
export const onContentRevisionRequested = functions.firestore
  .document("content_submissions/{subId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status || after.status !== "revision_requested") return;

    try {
      const [creatorDoc, campaignDoc] = await Promise.all([
        admin.firestore().doc(`users/${after.userId}`).get(),
        admin.firestore().doc(`campaigns/${after.campaignId}`).get(),
      ]);
      const creator = creatorDoc.data();
      const campaign = campaignDoc.data();
      if (!creator?.email) return;

      await sendEmail(creator.email, "content_revision", {
        creatorName: creator.displayName || "Creator",
        campaignTitle: campaign?.name || "Campaign",
        feedback: after.brandFeedback || "The brand has requested changes to your submission.",
        contentUrl: `${BASE_URL}/creator/content`,
      });
    } catch (err) {
      console.error("[Email] onContentRevisionRequested error:", err);
    }
  });

// ─── 7. Creator receives content approval ────────────────────────────────────
export const onContentApproved = functions.firestore
  .document("content_submissions/{subId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status || after.status !== "approved") return;

    try {
      const [creatorDoc, campaignDoc] = await Promise.all([
        admin.firestore().doc(`users/${after.userId}`).get(),
        admin.firestore().doc(`campaigns/${after.campaignId}`).get(),
      ]);
      const creator = creatorDoc.data();
      const campaign = campaignDoc.data();
      if (!creator?.email) return;

      await sendEmail(creator.email, "content_approved", {
        creatorName: creator.displayName || "Creator",
        campaignTitle: campaign?.name || "Campaign",
        earningsUrl: `${BASE_URL}/creator/earnings`,
      });
    } catch (err) {
      console.error("[Email] onContentApproved error:", err);
    }
  });

// ─── 8. New message notification ─────────────────────────────────────────────
export const sendNewMessageEmail = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snap) => {
    const msg = snap.data();
    if (msg.type !== "text") return;

    try {
      const collabDoc = await admin.firestore().doc(`applications/${msg.collaborationId}`).get();
      const collab = collabDoc.data();
      if (!collab) return;

      const recipientId = msg.senderRole === "brand" ? collab.creatorId : collab.brandId;
      const recipientDoc = await admin.firestore().doc(`users/${recipientId}`).get();
      const recipient = recipientDoc.data();
      if (!recipient?.email) return;

      const campaignDoc = await admin.firestore().doc(`campaigns/${collab.campaignId}`).get();
      const campaign = campaignDoc.data();

      await sendEmail(recipient.email, "new_message", {
        recipientName: recipient.displayName || "Usuario",
        senderName: msg.senderName || "Alguien",
        campaignTitle: campaign?.name || "Campaign",
        messagePreview: (msg.text || "").substring(0, 150),
        messagesUrl: `${BASE_URL}/messages`,
      });
    } catch (err) {
      console.error("[Email] sendNewMessageEmail error:", err);
    }
  });

// ─── 9. Visit Scheduled ───────────────────────────────────────────────────────
export const sendVisitScheduledEmail = functions.firestore
  .document("visitSchedules/{scheduleId}")
  .onCreate(async (snap) => {
    const visit = snap.data();
    try {
      const [creatorDoc, campaignDoc] = await Promise.all([
        admin.firestore().doc(`users/${visit.creatorId}`).get(),
        admin.firestore().doc(`campaigns/${visit.campaignId}`).get(),
      ]);
      const creator = creatorDoc.data();
      const campaign = campaignDoc.data();
      if (!creator?.email || !campaign) return;

      const brandDoc = await admin.firestore().doc(`users/${campaign.brandId}`).get();
      const brand = brandDoc.data();

      await sendEmail(creator.email, "visit_scheduled", {
        creatorName: creator.displayName || "Creator",
        brandName: brand?.displayName || "Brand",
        campaignTitle: campaign.name || "Campaign",
        visitDate: new Date(visit.scheduledDate).toLocaleDateString("es-DO"),
        visitTime: visit.scheduledTime,
        location: `${visit.location?.address}, ${visit.location?.city}`,
        duration: String(visit.duration),
        contentDeadline: new Date(visit.contentDeadline).toLocaleDateString("es-DO"),
        scheduleUrl: `${BASE_URL}/creator/schedule`,
      });
    } catch (err) {
      console.error("[Email] sendVisitScheduledEmail error:", err);
    }
  });

// ─── 10. HTTP function: send test email ───────────────────────────────────────
export const sendTestEmail = functions.https.onRequest((req, res) => {
  const corsHandler = require("cors")({ origin: true });
  return corsHandler(req, res, async () => {
    const { templateId, toEmail, vars } = req.body;
    if (!templateId || !toEmail) {
      return res.status(400).json({ error: "templateId and toEmail are required" });
    }
    await sendEmail(toEmail, templateId, vars || {});
    return res.json({ success: true });
  });
});

// ─── 11. HTTP function: seed default templates into Firestore ─────────────────
export const seedEmailTemplates = functions.https.onRequest((req, res) => {
  const corsHandler = require("cors")({ origin: true });
  return corsHandler(req, res, async () => {
    const baseStyle = `
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f7; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
      .header h1 { color: #fff; margin: 0; font-size: 26px; }
      .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
      .body { background: #fff; padding: 40px 30px; }
      .body p { color: #444; line-height: 1.7; margin: 0 0 16px; }
      .highlight { background: #f3f0ff; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
      .highlight .label { font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
      .btn { display: inline-block; background: #7c3aed; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin-top: 24px; font-size: 15px; }
      .footer { background: #f4f4f7; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px; }
      .footer p { color: #999; font-size: 12px; margin: 4px 0; }
    `;

    const makeHtml = (header: string, subheader: string, bodyContent: string, btnText: string, btnUrl: string) => `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
      <body><div class="container">
        <div class="header"><h1>${header}</h1><p>${subheader}</p></div>
        <div class="body">${bodyContent}<a href="${btnUrl}" class="btn">${btnText}</a></div>
        <div class="footer"><p>© 2026 RELA Collab. Todos los derechos reservados.</p><p>relacollab.com</p></div>
      </div></body></html>
    `;

    const templates: Record<string, { subject: string; html: string; variables: string[] }> = {
      welcome_creator: {
        subject: "🎉 Bienvenido a RELA Collab, {{name}}!",
        html: makeHtml(
          "🎉 ¡Bienvenido a RELA Collab!",
          "Tu nueva plataforma de colaboraciones UGC",
          `<p>Hola <strong>{{name}}</strong>,</p>
           <p>¡Estamos emocionados de tenerte! Tu perfil de creador ha sido activado y ya puedes explorar oportunidades de marcas que se alineen con tu contenido y audiencia.</p>
           <div class="highlight"><div class="label">Próximos Pasos</div>Conecta tu Instagram o TikTok, completa tu perfil y empieza a aplicar a campañas que te interesen.</div>
           <p>Nuestro AI analizará tu perfil y te mostrará las campañas con mayor probabilidad de match.</p>`,
          "Ver mis Oportunidades",
          "{{dashboardUrl}}"
        ),
        variables: ["name", "email", "dashboardUrl"],
      },
      welcome_brand: {
        subject: "🚀 ¡Bienvenido a RELA Collab, {{name}}!",
        html: makeHtml(
          "🚀 ¡Tu cuenta de Marca está lista!",
          "Conecta con los mejores creadores de contenido",
          `<p>Hola <strong>{{name}}</strong>,</p>
           <p>Tu cuenta ha sido configurada exitosamente. Ahora puedes crear tu primera campaña y dejar que nuestra IA encuentre a los creadores perfectos para tu marca.</p>
           <div class="highlight"><div class="label">Próximos Pasos</div>Crea tu primera campaña, define tu audiencia objetivo y el tipo de contenido. En minutos tendrás matches listos para revisar.</div>
           <p>Más de 2,500 creadores verificados esperan colaborar contigo.</p>`,
          "Crear mi primera campaña",
          "{{dashboardUrl}}"
        ),
        variables: ["name", "email", "dashboardUrl"],
      },
      application_received: {
        subject: "📩 Nueva Aplicación — {{creatorName}} quiere colaborar en {{campaignTitle}}",
        html: makeHtml(
          "📩 Nueva Aplicación Recibida",
          "Un creador quiere trabajar contigo",
          `<p>Hola <strong>{{brandName}}</strong>,</p>
           <p><strong>{{creatorName}}</strong> ha aplicado a tu campaña <strong>{{campaignTitle}}</strong>.</p>
           <div class="highlight"><div class="label">Qué hacer</div>Revisa su perfil, estadísticas de audiencia y historial de contenido. Aprueba para iniciar la colaboración o declina si no es el fit correcto.</div>
           <p>Recuerda que los creadores más activos esperan respuesta en 48 horas.</p>`,
          "Revisar Aplicación",
          "{{matchesUrl}}"
        ),
        variables: ["brandName", "creatorName", "campaignTitle", "matchesUrl"],
      },
      invitation_received: {
        subject: "🎯 ¡Te han invitado a colaborar en {{campaignTitle}}!",
        html: makeHtml(
          "🎯 Nueva Invitación de Colaboración",
          "Una marca te ha seleccionado",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p><strong>{{brandName}}</strong> te ha seleccionado específicamente para colaborar en su campaña <strong>{{campaignTitle}}</strong>.</p>
           <div class="highlight"><div class="label">Detalles</div>Presupuesto estimado: <strong>{{budget}}</strong></div>
           <p>Esta es una invitación directa — la marca ya revisó tu perfil y quiere trabajar contigo. ¡Acepta antes de que expire!</p>`,
          "Ver Invitación",
          "{{opportunitiesUrl}}"
        ),
        variables: ["creatorName", "brandName", "campaignTitle", "budget", "opportunitiesUrl"],
      },
      application_approved: {
        subject: "✅ ¡Tu aplicación fue aprobada! — {{campaignTitle}}",
        html: makeHtml(
          "✅ ¡Aplicación Aprobada!",
          "Ya puedes empezar a crear",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>¡Excelentes noticias! <strong>{{brandName}}</strong> ha aprobado tu aplicación para la campaña <strong>{{campaignTitle}}</strong>.</p>
           <div class="highlight"><div class="label">Qué sigue</div>Revisa los entregables de la campaña, coordina los detalles con la marca y comienza a crear tu contenido según el brief proporcionado.</div>
           <p>Recuerda subir tu contenido dentro del plazo establecido para asegurar tu pago.</p>`,
          "Ver Campaña Activa",
          "{{contentUrl}}"
        ),
        variables: ["creatorName", "brandName", "campaignTitle", "contentUrl"],
      },
      application_rejected: {
        subject: "Actualización sobre tu aplicación — {{campaignTitle}}",
        html: makeHtml(
          "Actualización de Aplicación",
          "No te desanimes, hay más oportunidades",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>Lamentablemente, tu aplicación para la campaña <strong>{{campaignTitle}}</strong> no fue seleccionada en esta ocasión.</p>
           <p>Esto no refleja la calidad de tu contenido — muchas veces se trata simplemente del fit específico de esa campaña. ¡Hay muchas más oportunidades esperando por ti!</p>`,
          "Ver más Oportunidades",
          "{{opportunitiesUrl}}"
        ),
        variables: ["creatorName", "campaignTitle", "opportunitiesUrl"],
      },
      content_submitted: {
        subject: "📤 {{creatorName}} envió contenido para {{campaignTitle}}",
        html: makeHtml(
          "📤 Nuevo Contenido Enviado",
          "Un creador ha enviado su entregable",
          `<p>Hola <strong>{{brandName}}</strong>,</p>
           <p><strong>{{creatorName}}</strong> ha enviado su contenido para la campaña <strong>{{campaignTitle}}</strong>.</p>
           <div class="highlight"><div class="label">Post URL</div>{{postUrl}}</div>
           <p>Revisa el contenido y apruébalo o solicita cambios desde tu panel de administración.</p>`,
          "Revisar Contenido",
          "{{reviewUrl}}"
        ),
        variables: ["brandName", "creatorName", "campaignTitle", "postUrl", "reviewUrl"],
      },
      content_revision: {
        subject: "✏️ Se solicitaron cambios en tu contenido — {{campaignTitle}}",
        html: makeHtml(
          "✏️ Revisión Solicitada",
          "La marca tiene algunos comentarios",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>La marca ha revisado tu contenido para <strong>{{campaignTitle}}</strong> y tiene algunas sugerencias:</p>
           <div class="highlight"><div class="label">Feedback de la Marca</div>{{feedback}}</div>
           <p>Por favor revisa el feedback y sube una nueva versión de tu contenido lo antes posible.</p>`,
          "Ver mi Contenido",
          "{{contentUrl}}"
        ),
        variables: ["creatorName", "campaignTitle", "feedback", "contentUrl"],
      },
      content_approved: {
        subject: "🎉 ¡Tu contenido fue aprobado! — {{campaignTitle}}",
        html: makeHtml(
          "🎉 ¡Contenido Aprobado!",
          "Tu pago será procesado próximamente",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>¡Excelente trabajo! La marca ha aprobado tu contenido para la campaña <strong>{{campaignTitle}}</strong>.</p>
           <p>Tu pago será liberado según los términos acordados. Puedes hacer seguimiento de tus ganancias desde tu panel.</p>`,
          "Ver mis Ganancias",
          "{{earningsUrl}}"
        ),
        variables: ["creatorName", "campaignTitle", "earningsUrl"],
      },
      new_message: {
        subject: "💬 Nuevo mensaje de {{senderName}} — {{campaignTitle}}",
        html: makeHtml(
          "💬 Tienes un Nuevo Mensaje",
          "Alguien quiere comunicarse contigo",
          `<p>Hola <strong>{{recipientName}}</strong>,</p>
           <p><strong>{{senderName}}</strong> te envió un mensaje sobre la campaña <strong>{{campaignTitle}}</strong>:</p>
           <div class="highlight"><div class="label">Mensaje</div><em>{{messagePreview}}</em></div>`,
          "Responder Ahora",
          "{{messagesUrl}}"
        ),
        variables: ["recipientName", "senderName", "campaignTitle", "messagePreview", "messagesUrl"],
      },
      visit_scheduled: {
        subject: "📅 Visita programada — {{campaignTitle}}",
        html: makeHtml(
          "📅 Visita Programada",
          "Revisa los detalles de tu visita",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>Tu visita para la campaña <strong>{{campaignTitle}}</strong> con <strong>{{brandName}}</strong> ha sido programada.</p>
           <div class="highlight"><div class="label">📅 Fecha y Hora</div>{{visitDate}} a las {{visitTime}}</div>
           <div class="highlight"><div class="label">📍 Ubicación</div>{{location}}</div>
           <div class="highlight"><div class="label">⏱ Duración</div>{{duration}} minutos</div>
           <div class="highlight"><div class="label">📝 Fecha límite de contenido</div>{{contentDeadline}}</div>`,
          "Ver mi Agenda",
          "{{scheduleUrl}}"
        ),
        variables: ["creatorName", "brandName", "campaignTitle", "visitDate", "visitTime", "location", "duration", "contentDeadline", "scheduleUrl"],
      },
      new_opportunity: {
        subject: "✨ ¡Nueva Oportunidad! {{matchScore}} Match con {{brandName}}",
        html: makeHtml(
          "✨ ¡Nueva Oportunidad!",
          "Descubrimos un match perfecto para ti",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>Nuestra IA encontró una campaña de <strong>{{brandName}}</strong> que hace un <strong>{{matchScore}}</strong> de match con tu perfil y audiencia.</p>
           <div class="highlight"><div class="label">Campaña</div>{{campaignTitle}}</div>
           <p>Revisa los detalles y aplica antes de que se agoten los cupos.</p>`,
          "Ver Oportunidad",
          "{{dashboardUrl}}"
        ),
        variables: ["creatorName", "brandName", "campaignTitle", "matchScore", "dashboardUrl"],
      },
      onboarding_reminder: {
        subject: "⏳ Termina de configurar tu perfil, {{name}}!",
        html: makeHtml(
          "⏳ ¡Completa tu perfil!",
          "Te quedaste a un paso de terminar",
          `<p>Hola <strong>{{name}}</strong>,</p>
           <p>Notamos que no has terminado de configurar tu perfil para empezar a colaborar.</p>
           <div class="highlight"><div class="label">Paso Pendiente</div>{{stepMessage}}</div>
           <p>Completar tu perfil es indispensable para empezar a aplicar a campañas con marcas que buscan creadores como tú.</p>`,
          "Completar Onboarding",
          "{{dashboardUrl}}"
        ),
        variables: ["name", "stepMessage", "dashboardUrl"],
      },
      instagram_token_expired: {
        subject: "⚠️ Tu conexión de Instagram expiró — Reconecta para no perder oportunidades",
        html: makeHtml(
          "⚠️ Tu Instagram necesita reconexión",
          "Tu acceso expiró — reconéctalo en 2 minutos",
          `<p>Hola <strong>{{creatorName}}</strong>,</p>
           <p>Notamos que tu conexión de Instagram ha expirado. Los tokens de acceso de Instagram duran <strong>60 días</strong> y se renuevan automáticamente si inicias sesión regularmente — pero el tuyo ha caducado.</p>
           <div class="highlight"><div class="label">¿Por qué importa?</div>Las marcas ven tus publicaciones recientes de Instagram cuando evalúan si trabajar contigo. Sin conexión activa, tu perfil pierde visibilidad y podrías perder oportunidades de colaboración.</div>
           <p>Reconectar toma menos de 2 minutos. Solo ve a tu perfil y vuelve a conectar tu cuenta de Instagram.</p>`,
          "Reconectar mi Instagram",
          "{{settingsUrl}}"
        ),
        variables: ["creatorName", "settingsUrl"],
      },
    };

    const batch = admin.firestore().batch();
    for (const [id, data] of Object.entries(templates)) {
      const ref = admin.firestore().doc(`emailTemplates/${id}`);
      batch.set(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    return res.json({ success: true, templatesSeeded: Object.keys(templates).length });
  });
});

// ─── 12. Creator receives new opportunity match ───────────────────────────────
export const onMatchCreated = functions.firestore
  .document("campaigns/{campaignId}/matches/{creatorId}")
  .onCreate(async (snap, context) => {
    const match = snap.data();
    if (!match.aiAnalysis || !match.aiAnalysis.matchPercentage) return;

    // Only notify if it's a strongly matched opportunity (>= 75%)
    // This prevents spamming creators with low-match opportunities
    if (match.aiAnalysis.matchPercentage < 75) return;

    try {
      const { campaignId, creatorId } = context.params;

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
      const applicationRef = admin.firestore().collection("applications")
        .where("creatorId", "==", creatorId)
        .where("campaignId", "==", campaignId);
      const applicationSnap = await applicationRef.get();
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
// ─── 13. Instagram Token Expired — notify creator to reconnect ───────────────
export const onInstagramTokenExpired = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when the flag flips to true
    if (before.instagramTokenExpired === true || after.instagramTokenExpired !== true) return;
    // Don't spam: only send once per day
    const notifiedAt = after.instagramTokenExpiredNotifiedAt;
    if (notifiedAt) {
      const lastNotified = new Date(notifiedAt).getTime();
      const hoursSince = (Date.now() - lastNotified) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }

    const creator = after;
    if (!creator.email) return;

    try {
      await sendEmail(creator.email, "instagram_token_expired", {
        creatorName: creator.displayName || "Creator",
        settingsUrl: `${BASE_URL}/creator/profile`,
      });
      // Record that we sent the notification
      await admin.firestore().doc(`users/${context.params.userId}`).update({
        instagramTokenExpiredNotifiedAt: new Date().toISOString(),
      });
      console.log(`[Email] instagram_token_expired → ${creator.email}`);
    } catch (err) {
      console.error("[Email] onInstagramTokenExpired error:", err);
    }
  });
