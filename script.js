const CATEGORIES = [
  "Продукти та товари",
  "Побачення",
  "Гроші Чоловіка",
  "Гроші Дружини",
  "Машина",
  "Квартира",
  "Десятина",
];

// 💰 Ліміти для кожної категорії
const LIMITS = {
  "Десятина": 4000,
  "Квартира": 10000,
  "Продукти та товари": 12000,
  "Гроші Дружини": 5000,
  "Гроші Чоловіка": 5000,
  "Машина": 5000,
  "Побачення": 3000,
};

const STORAGE_KEY = "kislenko_budget_v2";

// ===== ІНІЦІАЛІЗАЦІЯ =====
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const init = {
      totals: CATEGORIES.reduce((acc, c) => {
        acc[c] = 0;
        return acc;
      }, {}),
      history: [],
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(e);
    return null;
  }
}

function saveState(state) {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

// ===== UI ЕЛЕМЕНТИ =====
const categoriesGrid = document.getElementById("categoriesGrid");
const categorySelect = document.getElementById("categorySelect");
const amountInput = document.getElementById("amountInput");
const noteInput = document.getElementById("noteInput");
const expenseForm = document.getElementById("expenseForm");
const historyList = document.getElementById("historyList");
const lastSync = document.getElementById("last-sync");
const resetBtn = document.getElementById("resetBtn");

// === створимо новий елемент для відображення загальної суми ===
let totalDisplay = document.getElementById("total-display");
if (!totalDisplay) {
  totalDisplay = document.createElement("div");
  totalDisplay.className = "card";
  totalDisplay.style.marginBottom = "12px";
  totalDisplay.style.fontWeight = "600";
  totalDisplay.style.textAlign = "center";
  totalDisplay.style.fontSize = "1.1rem";
  categoriesGrid.parentElement.prepend(totalDisplay);
}

// ===== РЕНДЕР =====
function renderCategories(totals) {
  categoriesGrid.innerHTML = "";
  categorySelect.innerHTML = '<option value="">Оберіть категорію</option>';

  let totalSpent = 0;

  CATEGORIES.forEach((cat) => {
    const spent = Number(totals[cat] || 0);
    const limit = LIMITS[cat] || 0;
    const percent = limit ? Math.min((spent / limit) * 100, 100) : 0;
    totalSpent += spent;

    // Колір прогресу
    let color = "#48bb78"; // зелений
    if (percent > 90) color = "#f56565"; // червоний
    else if (percent > 60) color = "#ecc94b"; // жовтий

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="category-name">${cat}</div>
      <div class="amount">${spent.toFixed(2)} ₴</div>
      <div class="small">Ліміт: ${limit.toFixed(2)} ₴</div>
      <div class="progress-bar">
        <div class="progress" style="width:${percent}%; background:${color}"></div>
      </div>
    `;
    categoriesGrid.appendChild(card);

    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  // Показати загальну витрату
  totalDisplay.textContent = `Загальні витрати: ${totalSpent.toFixed(2)} ₴`;
}

function renderHistory(history) {
  historyList.innerHTML = "";
  const items = history.slice().reverse().slice(0, 10);
  if (items.length === 0)
    historyList.innerHTML = '<div class="small">Порожньо</div>';

  items.forEach((h) => {
    const d = new Date(h.at);
    const div = document.createElement("div");
    div.className = "hist-item";
    div.textContent = `${d.toLocaleString()} — ${h.category} : ${Number(
      h.amount
    ).toFixed(2)} ₴ ${h.note ? " — " + h.note : ""}`;
    historyList.appendChild(div);
  });
}

function render() {
  const state = loadState();
  renderCategories(state.totals);
  renderHistory(state.history);
  lastSync.textContent = new Date(state.updatedAt).toLocaleString();
}

// ===== ОБРОБКА ФОРМИ =====
expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const cat = categorySelect.value;
  const amt = parseFloat(amountInput.value);
  if (!cat || isNaN(amt) || amt <= 0)
    return alert("Оберіть категорію і введіть позитивну суму.");

  const state = loadState();
  state.totals[cat] = Number(
    (Number(state.totals[cat] || 0) + amt).toFixed(2)
  );
  state.history.push({
    category: cat,
    amount: amt,
    note: noteInput.value || "",
    at: new Date().toISOString(),
  });
  saveState(state);

  amountInput.value = "";
  noteInput.value = "";
});

resetBtn.addEventListener("click", () => {
  if (!confirm("Скинути всі локальні дані?")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

// ===== ПЕРШИЙ РЕНДЕР =====
render();
