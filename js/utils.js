// 🔧 Utility Functions
export function toast(message, type = "info") {
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerText = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

export function debounce(fn, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function validateInput(value, message) {
  if (!value || value.trim() === "") {
    alert(message);
    return false;
  }
  return true;
}

//  Auto-resize select box to fit its widest option
export function autoResizeSelect(select) {
  if (!select || !select.options.length) return;

  const temp = document.createElement("span");
  temp.style.visibility = "hidden";
  temp.style.position = "absolute";
  temp.style.whiteSpace = "pre";
  temp.style.font = window.getComputedStyle(select).font;
  document.body.appendChild(temp);

  let maxWidth = 0;
  for (const option of select.options) {
    temp.textContent = option.textContent;
    maxWidth = Math.max(maxWidth, temp.offsetWidth);
  }

  const finalWidth = Math.min(maxWidth + 60, 600); // cap for layout
  select.style.width = `${finalWidth}px`;

  temp.remove();
}