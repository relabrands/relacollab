const admin = require('./functions/node_modules/firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function list() {
  const snapshot = await db.collection('campaigns').where('status', '==', 'active').get();
  console.log(`Found ${snapshot.size} active campaigns.`);
  snapshot.forEach(doc => {
    console.log(doc.id, '->', doc.data().name || doc.data().title);
  });
  process.exit(0);
}

list();
