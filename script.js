const STORAGE_KEY = "mongle-todo-items";
const FILTER_LABELS = {
  all: "등록된 할 일이 없습니다",
  active: "진행 중인 할 일이 없습니다",
  completed: "완료된 항목이 없습니다",
};
const PETAL_COLORS = ["#f4a9c8", "#d9d0f4", "#c8eadb", "#fff0b8", "#f7c8d8", "#c9b8eb"];
const PETAL_DIRECTIONS = [
  [-38, -48], [-18, -62], [8, -58], [32, -46],
  [48, -22], [52, 5], [38, 30], [16, 46],
  [-12, 50], [-36, 34], [-50, 10], [-52, -18],
];

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const formMessage = document.querySelector("#form-message");
const list = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const emptyMessage = document.querySelector("#empty-message");
const progressText = document.querySelector("#progress-text");
const progressBar = document.querySelector("#progress-bar");
const progressTrack = document.querySelector('[role="progressbar"]');
const taskCount = document.querySelector("#task-count");
const filterButtons = document.querySelector(".filter-list");

let todos = loadTodos();
let activeFilter = "all";

function isTodo(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.isCompleted === "boolean" &&
    typeof value.createdAt === "number" &&
    Number.isFinite(value.createdAt)
  );
}

function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isTodo)) {
      throw new Error("저장된 할 일 데이터의 형식이 올바르지 않습니다.");
    }
    return parsed.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    showMessage(
      error instanceof SyntaxError
        ? "저장된 데이터를 읽을 수 없습니다. 새 할 일을 추가하면 새 목록으로 저장됩니다."
        : `저장된 할 일을 불러오지 못했습니다. ${error.message}`,
    );
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch (error) {
    showMessage(`변경 사항을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요. (${error.message})`);
    return false;
  }
}

function showMessage(message = "") {
  formMessage.textContent = message;
}

function createPetalBurst(origin) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = origin.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "petal-burst";
  burst.setAttribute("aria-hidden", "true");

  let petalsRemaining = PETAL_DIRECTIONS.length;
  PETAL_DIRECTIONS.forEach(([x, y], index) => {
    const petal = document.createElement("span");
    petal.className = "flower-petal";
    petal.style.setProperty("--origin-x", `${rect.left + rect.width / 2}px`);
    petal.style.setProperty("--origin-y", `${rect.top + rect.height / 2}px`);
    petal.style.setProperty("--petal-x", `${x}px`);
    petal.style.setProperty("--petal-y", `${y}px`);
    petal.style.setProperty("--petal-rotation", `${index * 55}deg`);
    petal.style.setProperty("--petal-color", PETAL_COLORS[index % PETAL_COLORS.length]);
    petal.style.setProperty("--petal-delay", `${index * 18}ms`);
    petal.addEventListener("animationend", () => {
      petalsRemaining -= 1;
      if (petalsRemaining === 0) burst.remove();
    }, { once: true });
    burst.append(petal);
  });

  document.body.append(burst);
}

function getVisibleTodos() {
  if (activeFilter === "active") return todos.filter((todo) => !todo.isCompleted);
  if (activeFilter === "completed") return todos.filter((todo) => todo.isCompleted);
  return todos;
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = "todo-item flex min-w-0 items-center gap-3 rounded-2xl border border-[#f1eaf0] bg-white px-3.5 py-3 shadow-sm shadow-[#845c7d]/5";
  item.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.className = "h-5 w-5 shrink-0 cursor-pointer accent-[#78b99a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500";
  checkbox.type = "checkbox";
  checkbox.checked = todo.isCompleted;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
  checkbox.dataset.action = "toggle";

  const text = document.createElement("span");
  text.className = `min-w-0 flex-1 whitespace-pre-wrap break-words font-semibold leading-relaxed${todo.isCompleted ? " text-[#aaa1ad] line-through decoration-1" : ""}`;
  text.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff1f3] text-lg text-[#c4778c] transition hover:bg-[#f8dce3] hover:text-[#a74762] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  const deleteIcon = document.createElement("span");
  deleteIcon.setAttribute("aria-hidden", "true");
  deleteIcon.textContent = "×";

  deleteButton.append(deleteIcon);
  item.append(checkbox, text, deleteButton);
  return item;
}

function render() {
  const visibleTodos = getVisibleTodos();
  const completedCount = todos.filter((todo) => todo.isCompleted).length;
  const progress = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  list.replaceChildren(...visibleTodos.map(createTodoElement));
  emptyState.hidden = visibleTodos.length > 0;
  emptyMessage.textContent = FILTER_LABELS[activeFilter];
  progressText.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", String(progress));
  taskCount.textContent = `완료 ${completedCount}개 · 전체 ${todos.length}개`;

  filterButtons.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === activeFilter;
    button.classList.toggle("bg-white", selected);
    button.classList.toggle("text-[#d86b9a]", selected);
    button.classList.toggle("shadow-sm", selected);
    button.classList.toggle("text-[#918494]", !selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    showMessage("할 일을 입력해주세요");
    input.focus();
    return;
  }

  showMessage();
  const createdAt = Date.now();
  todos.push({
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    text,
    isCompleted: false,
    createdAt,
  });
  saveTodos();
  activeFilter = "all";
  input.value = "";
  render();
  input.focus();
});

filterButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button || !filterButtons.contains(button)) return;
  activeFilter = button.dataset.filter;
  render();
});

list.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  const item = action?.closest(".todo-item");
  if (!action || !item) return;

  const todo = todos.find((entry) => entry.id === item.dataset.id);
  if (!todo) return;

  if (action.dataset.action === "delete") {
    todos = todos.filter((entry) => entry.id !== todo.id);
  } else if (action.dataset.action === "toggle" && action instanceof HTMLInputElement) {
    if (action.checked && !todo.isCompleted) createPetalBurst(action);
    todo.isCompleted = action.checked;
  } else {
    return;
  }

  saveTodos();
  render();
});

render();
