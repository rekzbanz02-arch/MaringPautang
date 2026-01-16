// auth.js
// ------------------------
// Handles login, logout, and admin verification
// ------------------------

import { data } from "./data.js";
import { showWelcomePage, logLogin } from "./ui.js"; // 🧾 import login log function

// 🧠 Login Handler
export function login() {
  const pw = document.getElementById("login-pass").value.trim();
  const valid = pw === data.settings.password || data.settings.users.some(u => u.password === pw);

  if (!valid) return alert("❌ Incorrect password!");

  // Show main dashboard
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("main-dashboard").classList.remove("hidden");
  document.getElementById("logout-btn").classList.remove("hidden");
  
  // Go to welcome page
  showWelcomePage();

  // 🧾 Record login activity
  logLogin(pw);
}

// 🚪 Logout Handler
export function logout() {
  if (!confirm("Are you sure you want to logout?")) return;
  document.getElementById("main-dashboard").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("logout-btn").classList.add("hidden");
  document.getElementById("login-pass").value = "";
}

// 🔒 Verify Admin Access before opening Settings
export function verifyAdminAccess() {
  const entered = prompt("Enter admin password to access Settings:");
  if (!entered) return false;
  const isValid =
    entered === data.settings.password ||
    data.settings.users.some(u => u.isAdmin && u.password === entered);
  if (!isValid) {
    alert("❌ Incorrect admin password!");
    return false;
  }
  return true;
}
