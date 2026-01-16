// ---------- JSONBin Capacity Monitor ----------
import { BASE_URL, MASTER_KEY } from "./data.js";

async function checkBinUsage() {
  try {
    const res = await fetch(`${BASE_URL}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
    const json = await res.json();
    const size = new Blob([JSON.stringify(json.record)]).size;
    const limit = 204800; // 200 KB JSONBin free plan
    const usedPercent = Math.min(100, (size / limit) * 100);
    const remaining = limit - size;

    let bar = document.getElementById("bin-usage-bar");
    let text = document.getElementById("bin-usage-text");

    if (!bar) {
      const container = document.createElement("div");
      container.innerHTML = `
        <h4>🧠 JSONBin Storage Usage</h4>
        <div class="usage-container">
          <div id="bin-usage-bar"></div>
        </div>
        <p id="bin-usage-text" class="usage-text"></p>
      `;
      document.getElementById("settings").appendChild(container);
      bar = document.getElementById("bin-usage-bar");
      text = document.getElementById("bin-usage-text");
    }

    bar.style.width = usedPercent + "%";
    bar.style.background = usedPercent > 85 ? "#dc2626" : usedPercent > 65 ? "#facc15" : "#22c55e";
    text.innerHTML = `Used: <b>${(size / 1024).toFixed(1)} KB</b> / 200 KB (${(100 - usedPercent).toFixed(1)}% free)`;

  } catch (err) {
    console.warn("Cannot check JSONBin usage", err);
  }
}

// Run once after login or data load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(checkBinUsage, 3000);
  setInterval(checkBinUsage, 60000);
});
