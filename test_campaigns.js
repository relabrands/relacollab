const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAdcqTsle-75xm6Y701uxAAp0ZP4PCIl2s",
  authDomain: "rella-collab.firebaseapp.com",
  projectId: "rella-collab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "campaigns"), where("status", "==", "active"));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} active campaigns.`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, '->', data.title || data.name, '| deadline:', data.endDate, '| brandName:', data.brandName);
  });
  process.exit(0);
}
run().catch(console.error);
