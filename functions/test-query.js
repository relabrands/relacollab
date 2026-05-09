const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

async function check() {
  const snap = await db.collection("users").where("role", "==", "creator").get();
  let missingCount = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (!data.instagramConnected && !data.tiktokConnected) {
      missingCount++;
    }
  });
  console.log(`Found ${missingCount} creators missing social connections.`);
}
check().catch(console.error);
