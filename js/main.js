import { loadData } from "./data.js";
import { login, logout } from "./auth.js";
import { setupUIEvents } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  setupUIEvents();
  document.getElementById("login-status").innerText = "✅ Data loaded. Please log in.";
  document.getElementById("login-btn").disabled = false;

  document.getElementById("login-btn").onclick = login;
  document.getElementById("logout-btn").onclick = logout;
});
