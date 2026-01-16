// ui.js
// ------------------------
// Handles all UI updates, event listeners, and section logic
// ------------------------

import { data, saveData } from "./data.js";
import { toast, autoResizeSelect } from "./utils.js";
import { verifyAdminAccess } from "./auth.js";

let chartInstance;

export function setupUIEvents() {
  // Navigation
  document.getElementById("get-started-btn").onclick = startSystem;
  document.querySelectorAll(".tab-btn").forEach(btn =>
    btn.onclick = () => showTab(btn.dataset.tab)
  );

  // Borrowers
  document.getElementById("add-borrower-btn").onclick = addBorrower;

  // Loans
  document.getElementById("create-loan-btn").onclick = createLoan;

  // Payments
  document.getElementById("record-payment-btn").onclick = recordPayment;

  // Settings
  document.getElementById("change-password-btn").onclick = changePassword;
  document.getElementById("save-rates-btn").onclick = updateRates;
  document.getElementById("add-user-btn").onclick = addUser;
  document.getElementById("reset-btn").onclick = resetData;
}

// ------------------- NAVIGATION -------------------
export function showWelcomePage() {
  hideAllSections();
  document.getElementById("welcome-page").classList.remove("hidden");
  document.getElementById("main-nav").classList.add("hidden");
}

export function showTab(id) {
  // 🔒 Require admin password before showing Settings
  if (id === "settings") {
    const ok = verifyAdminAccess();
    if (!ok) return;
  }

  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`[data-tab="${id}"]`).classList.add("active");

  // Adjust dynamic widths
  document.querySelectorAll("select").forEach(sel => sel.style.width = "auto");
  if (id === "loans") document.getElementById("loan-borrower").style.width = "90%";
  if (id === "payments") document.getElementById("payment-loan").style.width = "90%";

  // Refresh data
  if (id === "dashboard-summary") refreshDashboard();
  if (id === "borrowers") refreshBorrowers();
  if (id === "loans") refreshLoans();
  if (id === "payments") refreshPayments();
  if (id === "settings") refreshSettings();
}

function hideAllSections() {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
}

function startSystem() {
  document.getElementById("welcome-page").classList.add("hidden");
  document.getElementById("main-nav").classList.remove("hidden");
  showTab("dashboard-summary");
  refreshDashboard();
}

// ------------------- BORROWERS -------------------
function addBorrower() {
  const name = document.getElementById("borrower-name").value.trim();
  if (!name) return alert("Enter borrower name.");
  data.borrowers.push({ name, status: "active" });
  document.getElementById("borrower-name").value = "";
  saveData(); refreshBorrowers();
  toast("✅ Borrower added", "success");
}

function refreshBorrowers() {
  const tbody = document.getElementById("borrower-table");
  tbody.innerHTML = data.borrowers.map(
    (b, i) =>
      `<tr><td>${b.name}</td><td>${b.status}</td><td><button onclick="toggleBorrower(${i})">${b.status === "active" ? "Block" : "Unblock"}</button></td></tr>`
  ).join("");
  document.getElementById("loan-borrower").innerHTML = data.borrowers
    .filter(b => b.status === "active")
    .map(b => `<option>${b.name}</option>`).join("");
}

window.toggleBorrower = (i) => {
  const b = data.borrowers[i];
  b.status = b.status === "active" ? "blocked" : "active";
  saveData(); refreshBorrowers();
  toast("🔄 Borrower status changed");
};

// ------------------- LOANS -------------------
function createLoan() {
  const borrower = document.getElementById("loan-borrower").value;
  const type = document.getElementById("loan-type").value;
  const amount = parseFloat(document.getElementById("loan-amount").value);
  const dateField = document.getElementById("loan-date");

  if (!borrower || isNaN(amount) || amount <= 0) {
    alert("Enter valid amount.");
    return;
  }

  // 🧩 Step 1: Handle date input safely
  let date;
  if (dateField && dateField.value) {
    // user-selected date
    date = new Date(dateField.value + "T00:00:00").toISOString();
  } else {
    // default to today
    const today = new Date();
    date = today.toISOString();
  }

  // Compute loan amounts
  const interest = amount * (data.settings.interest / 100);
  const total = amount + interest;

  // 🧾 Store full loan details including date
  data.loans.push({
    id: Date.now(),
    borrower,
    principal: amount,
    interest,
    penalty: 0,
    balance: total,
    status: "active",
    type,
    payments: [],
    date
  });

  // 🧼 Reset input fields
  document.getElementById("loan-amount").value = "";
  if (dateField) {
    dateField.value = new Date().toISOString().split("T")[0];
  }

  saveData();
  refreshLoans();
  refreshDashboard();
  toast("✅ Loan created successfully", "success");
}

function refreshLoans() {
  const loanTable = document.getElementById("loan-table");

  // 🧾 Corrected: match table header order
  loanTable.innerHTML = data.loans.map((l) => `
    <tr>
      <td>${l.date ? new Date(l.date).toLocaleDateString() : "—"}</td>
      <td>${l.borrower}</td>
      <td>${l.type || "Cash"}</td>
      <td>${l.principal.toFixed(2)}</td>
      <td>${l.interest.toFixed(2)}</td>
      <td>${l.penalty.toFixed(2)}</td>
      <td>${l.balance.toFixed(2)}</td>
      <td>${l.status}</td>
    </tr>
  `).join("");

  // 🧩 Refresh borrower dropdown
  const select = document.getElementById("loan-borrower");
  select.innerHTML = data.borrowers
    .filter(b => b.status === "active")
    .map(b => `<option>${b.name}</option>`)
    .join("");

  autoResizeSelect(select);

  // 🧩 Ensure date input defaults to today whenever the Loans tab refreshes
  const dateField = document.getElementById("loan-date");
  if (dateField) {
    dateField.value = new Date().toISOString().split("T")[0];
  }
}
// ------------------- PAYMENTS -------------------
function recordPayment() {
  const loanId = parseInt(document.getElementById("payment-loan").value);
  const amount = parseFloat(document.getElementById("payment-amount").value);
  const dateInput = document.getElementById("payment-date")?.value; // 🆕 get user-selected date

  if (!loanId || isNaN(amount) || amount <= 0) return alert("Enter valid payment.");

  const loan = data.loans.find(l => l.id === loanId);

  // 🧩 Step 2: Use user date if given, otherwise default to today
  const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

  loan.payments.push({ amount, date });
  loan.balance -= amount;
  if (loan.balance <= 0) loan.status = "paid";

  // clear input boxes after recording
  document.getElementById("payment-amount").value = "";
  if (document.getElementById("payment-date")) {
    document.getElementById("payment-date").value = new Date().toISOString().split("T")[0]; // reset to today
  }

  saveData();
  refreshPayments();
  refreshDashboard();
  toast("💰 Payment recorded");
}

function refreshPayments() {
  const paymentTable = document.getElementById("payment-table");
  paymentTable.innerHTML = data.loans.flatMap(l =>
    l.payments.map(p => `
      <tr>
        <td>${new Date(p.date).toLocaleDateString()}</td>
        <td>${l.borrower}</td>
        <td>${l.type || "Cash"}</td>
        <td>${p.amount}</td>
        <td>${l.balance.toFixed(2)}</td>
        <td>${l.status}</td>
      </tr>
    `)
  ).join("");

  const select = document.getElementById("payment-loan");
  select.innerHTML = data.loans
    .filter(l => l.status === "active")
    .map(l => `<option value="${l.id}">${l.borrower} - ₱${l.balance.toFixed(2)}</option>`)
    .join("");

  autoResizeSelect(select);

  const label = document.getElementById("loan-type-label");
  const updateLoanTypeLabel = () => {
    const value = select.value;
    if (!value) {
      label.textContent = "—";
      return;
    }
    const loan = data.loans.find(l => l.id === Number(value));
    label.textContent = loan ? loan.type : "—";
  };

  select.onchange = updateLoanTypeLabel;
  updateLoanTypeLabel();

  const dateInput = document.getElementById("payment-date");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

// ------------------- SETTINGS -------------------
function changePassword() {
  const newPw = document.getElementById("new-password").value.trim();
  if (!newPw) return alert("Enter new password.");
  data.settings.password = newPw;
  saveData(); toast("🔒 Password updated", "success");
}

function updateRates() {
  const i = parseFloat(document.getElementById("interest-rate").value);
  const p = parseFloat(document.getElementById("penalty-rate").value);
  if (isNaN(i) || isNaN(p)) return alert("Enter valid rates.");
  data.settings.interest = i;
  data.settings.penalty = p;
  saveData(); refreshSettings(); toast("💹 Rates updated");
}

function addUser() {
  const pw = document.getElementById("new-user-pass").value.trim();
  if (!pw) return alert("Enter new user password!");
  if (data.settings.users.some(u => u.password === pw)) return alert("Password already exists!");
  data.settings.users.push({ password: pw });
  saveData(); refreshSettings();
  toast("👥 User added");
}

function resetData() {
  if (!confirm("This will delete all borrower and loan data.")) return;
  data.borrowers = [];
  data.loans = [];
  data.logs = []; // 🧾 clear login history
  saveData(); refreshAll();
  toast("⚠️ All data reset");
}

function refreshSettings() {
  document.getElementById("interest-rate").value = data.settings.interest;
  document.getElementById("penalty-rate").value = data.settings.penalty;
  document.getElementById("rate-display").innerHTML =
    `Interest: <b>${data.settings.interest}%</b> | Penalty: <b>${data.settings.penalty}%</b>`;
  const table = document.getElementById("user-table");
  table.innerHTML = data.settings.users.length
    ? data.settings.users.map(
      (u, i) => `<tr><td>${i + 1}</td><td>${u.password}</td><td><button onclick="deleteUser(${i})">Delete</button></td></tr>`
    ).join("")
    : `<tr><td colspan="3" style="text-align:center;">No users yet</td></tr>`;
}

window.deleteUser = (i) => {
  if (!confirm("Delete this user?")) return;
  data.settings.users.splice(i, 1);
  saveData(); refreshSettings();
  toast("❌ User removed");
};

// ------------------- LOGIN LOGS -------------------
export function logLogin(password) {
  const role = password === data.settings.password ? "Admin" : "User";
  const entry = {
    role,
    password,
    time: new Date().toLocaleString()
  };
  data.logs.push(entry);
  saveData();
  refreshLoginLogs();
}

function refreshLoginLogs() {
  const table = document.getElementById("login-log-table");
  if (!table) return;

  if (data.logs.length === 0) {
    table.innerHTML = `<tr><td colspan="4" style="text-align:center;">No login records yet</td></tr>`;
    return;
  }

  table.innerHTML = data.logs.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${l.role}</td>
      <td>${l.password}</td>
      <td>${l.time}</td>
    </tr>
  `).join("");
}

// ------------------- DASHBOARD -------------------
export function refreshDashboard() {
  const lent = data.loans.reduce((s, l) => s + l.principal, 0);
  const collected = data.loans.reduce((s, l) => s + l.payments.reduce((a, p) => a + p.amount, 0), 0);
  const outstanding = data.loans.reduce((s, l) => s + l.balance, 0);
  const profit = collected - lent;

  document.getElementById("summary").innerHTML =
    `<b>Total Lent:</b> ₱${lent.toFixed(2)}<br><b>Total Collected:</b> ₱${collected.toFixed(2)}<br><b>Outstanding:</b> ₱${outstanding.toFixed(2)}<br><b>Profit:</b> ₱${profit.toFixed(2)}`;
  
  renderChart({ lent, collected, outstanding, profit });
}

function renderChart({ lent, collected, outstanding, profit }) {
  const ctx = document.getElementById("loanChart");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Lent", "Collected", "Outstanding", "Profit"],
      datasets: [{
        label: "₱ Financial Overview",
        data: [lent, collected, outstanding, profit],
        backgroundColor: ["#2563eb", "#22c55e", "#facc15", "#9333ea"]
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// 🔄 Refresh All Sections
export function refreshAll() {
  refreshBorrowers();
  refreshLoans();
  refreshPayments();
  refreshSettings();
  refreshDashboard();
  refreshLoginLogs(); // 🧾 ensure logs table updates
}