// data.js
// ------------------------
// Handles data storage and API synchronization
// ------------------------

export let data = { 
  borrowers: [], 
  loans: [], 
  logs: [], // 🧾 stores login history
  settings: { 
    password: "1234", 
    users: [], 
    interest: 10, 
    penalty: 0
  } 
};

// ⚙️ JSONBin Setup
const BIN_ID = "6968a615ae596e708fddbedc";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const MASTER_KEY = "$2a$10$CvK4w8DTXZ1//5H1cpGQIerIT8Kzvk0FQHosdNm.XS0Q9n6sMmaf6";

// 🧩 Load Data from JSONBin or Local Storage
export async function loadData() {
  try {
    const res = await fetch(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
    const json = await res.json();
    if (json?.record) data = json.record;
  } catch (err) {
    console.warn("⚠️ JSONBin fetch failed. Using local data only.");
    const local = localStorage.getItem("lendingData");
    if (local) data = JSON.parse(local);
  }
  localStorage.setItem("lendingData", JSON.stringify(data));
}

// 💾 Save Data to JSONBin and Local Storage
export async function saveData() {
  localStorage.setItem("lendingData", JSON.stringify(data));
  try {
    await fetch(BASE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
      body: JSON.stringify(data)
    });
  } catch {
    console.warn("⚠️ Offline mode: local save only");
  }
}

export { BASE_URL, MASTER_KEY };