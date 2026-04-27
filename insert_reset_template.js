import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("./functions/serviceAccountKey.json");

import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

async function update() {
    const docRef = db.collection("emailTemplates").doc("password_reset");
    const doc = await docRef.get();
    if (!doc.exists) {
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

        const makeHtml = (header, subheader, bodyContent, btnText, btnUrl) => `
          <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
          <body><div class="container">
            <div class="header"><h1>${header}</h1><p>${subheader}</p></div>
            <div class="body">${bodyContent}<a href="${btnUrl}" class="btn">${btnText}</a></div>
            <div class="footer"><p>© 2026 RELA Collab. Todos los derechos reservados.</p><p>relacollab.com</p></div>
          </div></body></html>
        `;

        await docRef.set({
            subject: "🔒 Restablece tu contraseña - RELA Collab",
            html: makeHtml(
              "🔒 Restablecer Contraseña",
              "Solicitud de cambio de contraseña",
              `<p>Hola <strong>{{name}}</strong>,</p>
               <p>Hemos recibido una solicitud para cambiar tu contraseña.</p>
               <p>Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.</p>`,
              "Cambiar mi Contraseña",
              "{{resetUrl}}"
            ),
            variables: ["name", "resetUrl"],
            updatedAt: new Date().toISOString()
        });
        console.log("Successfully inserted 'password_reset' template.");
    } else {
        console.log("Template 'password_reset' already exists.");
    }
}

update().catch(console.error).finally(() => process.exit(0));
