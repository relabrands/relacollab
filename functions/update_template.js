const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function update() {
    const docRef = db.collection("email_templates").doc("content_approved");
    const doc = await docRef.get();
    if (!doc.exists) {
        console.log("Template info not found.");
        return;
    }
    const data = doc.data();
    
    // Add pendingItemsText to variables if it's not there
    let vars = data.variables || [];
    if (!vars.includes("pendingItemsText")) {
        vars.push("pendingItemsText");
    }

    // Safely append to html body
    let newHtml = data.html;
    if (!newHtml.includes("{{pendingItemsText}}")) {
        // Find closing p tag or insert before button
        if (newHtml.includes("fue aprobado.</p>")) {
             newHtml = newHtml.replace(
                "fue aprobado.</p>", 
                "fue aprobado.</p><p style='margin-bottom:15px; color:#555;'><strong>{{pendingItemsText}}</strong></p>"
             );
        } else {
             newHtml = newHtml.replace("</div><a href=", "</div><p><strong>{{pendingItemsText}}</strong></p><a href=");
        }
    }

    await docRef.update({
        variables: vars,
        html: newHtml
    });
    console.log("Successfully updated 'content_approved' template in DB.");
}

update().catch(console.error);
