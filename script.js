const STORAGE_KEY = "little-todo-list";
const importanceLabels = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};
const importanceClasses = {
  high: "bg-rose-100 text-rose-600",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-sky-100 text-sky-700",
};
const confettiFlowers = ["🌸", "🌼", "🌷", "✿"];

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const deadlineInput = document.querySelector("#deadline-input");
const importanceInput = document.querySelector("#importance-input");
const list = document.querySelector("#todo-list");
const count = document.querySelector("#todo-count");
const progressLabel = document.querySelector("#progress-label");
const progressDetail = document.querySelector("#progress-detail");
const progressTrack = document.querySelector("#progress-track");
const progressBar = document.querySelector("#progress-bar");
const dateElement = document.querySelector("#today-date");
const formMessage = document.querySelector("#form-message");
const storageMessage = document.querySelector("#storage-message");
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = loadTodos();
let activeFilter = "all";

dateElement.textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    showFormMessage("할 일 내용을 입력해 주세요.");
    input.focus();
    return;
  }

  const deadline = deadlineInput.value || null;
  if (deadline && !isValidDeadline(deadline)) {
    showFormMessage("올바른 마감일을 선택해 주세요.");
    return;
  }

  todos.push({
    id: createId(),
    text: text.slice(0, 50),
    completed: false,
    importance: importanceInput.value,
    deadline,
  });
  input.value = "";
  deadlineInput.value = "";
  clearFormMessage();
  saveTodos();
  render();
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      filterButton.setAttribute("aria-pressed", String(filterButton === button));
    });
    renderList();
  });
});

function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (savedTodos === null) return [];

    const parsedTodos = JSON.parse(savedTodos);
    if (
      !Array.isArray(parsedTodos) ||
      !parsedTodos.every(
        (todo) =>
          todo &&
          (typeof todo.id === "string" || typeof todo.id === "number") &&
          typeof todo.text === "string" &&
          typeof todo.completed === "boolean" &&
          Object.hasOwn(importanceLabels, todo.importance) &&
          (todo.deadline === undefined || todo.deadline === null || isValidDeadline(todo.deadline)),
      )
    ) {
      throw new TypeError("저장된 할 일 데이터의 형식이 올바르지 않습니다.");
    }

    return parsedTodos;
  } catch (error) {
    showStorageMessage(`저장된 목록을 불러오지 못했어요. (${error.message})`);
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    storageMessage.classList.add("hidden");
    storageMessage.textContent = "";
  } catch (error) {
    showStorageMessage(`목록을 브라우저에 저장하지 못했어요. (${error.message})`);
  }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isValidDeadline(deadline) {
  if (typeof deadline !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  if (year < 1 || month < 1 || month > 12) return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}

function render() {
  renderProgress();
  renderList();
}

function renderProgress() {
  const completedCount = todos.filter((todo) => todo.completed).length;
  const percentage = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  count.textContent = `(${todos.length})`;
  progressLabel.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
  progressDetail.textContent =
    todos.length === 0
      ? "아직 등록된 할 일이 없어요"
      : `${completedCount}개 완료 · 총 ${todos.length}개`;
}

function renderList() {
  list.replaceChildren();

  if (todos.length === 0) {
    list.append(createEmptyState("오늘의 할 일을 추가해 보세요! ✨", "작은 시작이 멋진 하루를 만들어요 🌷"));
    return;
  }

  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === "active") return !todo.completed;
    if (activeFilter === "completed") return todo.completed;
    return true;
  });

  if (visibleTodos.length === 0) {
    list.append(createEmptyState("해당하는 할 일이 없어요."));
    return;
  }

  if (activeFilter !== "completed") {
    const activeTodos = visibleTodos.filter((todo) => !todo.completed);
    if (activeTodos.length > 0) {
      list.append(createTodoGroup("진행 중", activeTodos));
    }
  }

  if (activeFilter !== "active") {
    const completedTodos = visibleTodos.filter((todo) => todo.completed);
    if (completedTodos.length > 0) {
      list.append(createTodoGroup("완료했어요", completedTodos));
    }
  }
}

function createTodoGroup(title, groupTodos) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  heading.className = "mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-slate-400";
  heading.textContent = title;

  const items = document.createElement("ul");
  items.className = "space-y-2";
  groupTodos.forEach((todo) => items.append(createTodoItem(todo)));
  section.append(heading, items);
  return section;
}

function createTodoItem(todo) {
  const item = document.createElement("li");
  item.className =
    "group flex items-center gap-3 rounded-2xl border border-rose-50 bg-white px-3 py-3 transition hover:border-rose-100 hover:bg-rose-50/30 sm:px-4";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
  checkbox.className = "h-5 w-5 shrink-0 cursor-pointer accent-rose-400";
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      celebrateCompletion(checkbox);
    }
    todo.completed = checkbox.checked;
    saveTodos();
    render();
  });

  const text = document.createElement("span");
  text.className = `min-w-0 break-words text-sm ${
    todo.completed ? "text-slate-400 line-through" : "text-slate-700"
  }`;
  text.textContent = todo.text;

  const badge = document.createElement("span");
  badge.className = `shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${importanceClasses[todo.importance]}`;
  badge.textContent = importanceLabels[todo.importance];

  const details = document.createElement("div");
  details.className = "flex min-w-0 flex-1 flex-col gap-1";
  details.append(text);
  if (todo.deadline) {
    const deadline = document.createElement("span");
    const [, year, month, day] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todo.deadline);
    deadline.className = "text-xs text-slate-400";
    deadline.textContent = `마감 ${Number(year)}년 ${Number(month)}월 ${Number(day)}일`;
    details.append(deadline);
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-100 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => {
    todos = todos.filter((item) => item.id !== todo.id);
    saveTodos();
    render();
  });

  item.append(checkbox, details, badge, deleteButton);
  return item;
}

function celebrateCompletion(checkbox) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const confetti = document.querySelector("#flower-confetti");
  const bounds = checkbox.getBoundingClientRect();
  const originX = bounds.left + bounds.width / 2;
  const originY = bounds.top + bounds.height / 2;

  for (let index = 0; index < 18; index += 1) {
    const flower = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 18 + Math.random() * 0.25;
    const distance = 45 + Math.random() * 90;
    flower.className = "flower-particle";
    flower.textContent = confettiFlowers[index % confettiFlowers.length];
    flower.style.left = `${originX}px`;
    flower.style.top = `${originY}px`;
    flower.style.setProperty("--flower-x", `${Math.cos(angle) * distance}px`);
    flower.style.setProperty("--flower-y", `${Math.sin(angle) * distance - 20}px`);
    flower.style.setProperty("--flower-rotation", `${Math.random() * 300 - 150}deg`);
    flower.addEventListener("animationend", () => flower.remove(), { once: true });
    confetti.append(flower);
  }
}

function createEmptyState(title, subtitle) {
  const empty = document.createElement("div");
  empty.className = "rounded-2xl bg-rose-50/60 px-5 py-10 text-center";

  const illustration = document.createElement("p");
  illustration.className = "mb-3 text-3xl";
  illustration.setAttribute("aria-hidden", "true");
  illustration.textContent = "☁️  🌱  ☁️";

  const message = document.createElement("p");
  message.className = "text-sm font-semibold text-slate-600";
  message.textContent = title;
  empty.append(illustration, message);

  if (subtitle) {
    const detail = document.createElement("p");
    detail.className = "mt-2 text-xs text-slate-400";
    detail.textContent = subtitle;
    empty.append(detail);
  }

  return empty;
}

function showFormMessage(message) {
  formMessage.textContent = message;
  formMessage.classList.remove("hidden");
}

function clearFormMessage() {
  formMessage.textContent = "";
  formMessage.classList.add("hidden");
}

function showStorageMessage(message) {
  storageMessage.textContent = message;
  storageMessage.classList.remove("hidden");
}

render();
