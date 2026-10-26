"use strict";

<<<<<<< HEAD
const STORAGE_KEY = "todo-list.tasks.v1";
const MAX_TASK_LENGTH = 200;

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const inputMessage = document.querySelector("#input-message");
const characterCount = document.querySelector("#character-count");
const storageMessage = document.querySelector("#storage-message");
const totalCount = document.querySelector("#total-count");
const completedCount = document.querySelector("#completed-count");
const progressLabel = document.querySelector("#progress-label");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const filterButtons = document.querySelectorAll(".filter-button");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");

let tasks = loadTasks();
let currentFilter = "all";
let fallbackIdCounter = 0;

function isTaskArray(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  const ids = new Set();
  return value.every((task) => {
    if (
      task === null ||
      typeof task !== "object" ||
      typeof task.id !== "string" ||
      task.id.length === 0 ||
      typeof task.text !== "string" ||
      task.text.trim().length === 0 ||
      task.text.length > MAX_TASK_LENGTH ||
      typeof task.completed !== "boolean" ||
      typeof task.createdAt !== "number" ||
      !Number.isFinite(task.createdAt) ||
      ids.has(task.id)
    ) {
      return false;
    }

    ids.add(task.id);
    return true;
  });
}

function loadTasks() {
  try {
    const storedTasks = window.localStorage.getItem(STORAGE_KEY);
    if (storedTasks === null) {
      return [];
    }

    const parsedTasks = JSON.parse(storedTasks);
    if (!isTaskArray(parsedTasks)) {
      showStorageMessage("저장된 할 일 데이터가 올바르지 않아 빈 목록으로 시작합니다.");
      return [];
    }

    return parsedTasks;
  } catch (error) {
    console.warn("Unable to load saved tasks.", error);
    showStorageMessage("저장된 할 일을 불러오지 못해 빈 목록으로 시작합니다.");
=======
const STORAGE_KEY = "todo-list-items";
const MAX_TEXT_LENGTH = 200;
const FILTERS = {
  all: "all",
  active: "active",
  completed: "completed"
};
const PRIORITIES = {
  low: "낮음",
  medium: "보통",
  high: "높음"
};

const form = document.querySelector("#todoForm");
const input = document.querySelector("#todoInput");
const dueAtInput = document.querySelector("#dueAtInput");
const priorityInput = document.querySelector("#priorityInput");
const inputMessage = document.querySelector("#inputMessage");
const characterCount = document.querySelector("#characterCount");
const todoList = document.querySelector("#todoList");
const emptyState = document.querySelector("#emptyState");
const totalCount = document.querySelector("#totalCount");
const completedCount = document.querySelector("#completedCount");
const progressLabel = document.querySelector("#progressLabel");
const progress = document.querySelector(".progress-track");
const progressBar = document.querySelector("#progressBar");
const storageNotice = document.querySelector("#storageNotice");
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = loadTodos();
let currentFilter = FILTERS.all;

function loadTodos() {
  let savedTodos;

  try {
    savedTodos = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("저장된 할 일을 불러오지 못했습니다.", error);
    showStorageNotice("저장된 할 일을 불러오지 못해 빈 목록으로 시작합니다.");
    return [];
  }

  if (savedTodos === null) {
    return [];
  }

  try {
    const parsedTodos = JSON.parse(savedTodos);
    if (
      !Array.isArray(parsedTodos) ||
      !parsedTodos.every(isValidTodo) ||
      new Set(parsedTodos.map((todo) => todo.id)).size !== parsedTodos.length
    ) {
      throw new TypeError("저장된 할 일 데이터 형식이 올바르지 않습니다.");
    }
    return parsedTodos.map((todo) => ({
      ...todo,
      dueAt: todo.dueAt ?? null,
      priority: todo.priority ?? "medium"
    }));
  } catch (error) {
    console.warn("저장된 할 일 데이터가 손상되어 빈 목록으로 시작합니다.", error);
    showStorageNotice("저장된 할 일 데이터를 읽을 수 없어 빈 목록으로 시작합니다.");
>>>>>>> bootstrap
    return [];
  }
}

<<<<<<< HEAD
function showStorageMessage(message) {
  storageMessage.textContent = message;
  storageMessage.classList.remove("hidden");
}

function clearStorageMessage() {
  storageMessage.textContent = "";
  storageMessage.classList.add("hidden");
}

function saveTasks() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    clearStorageMessage();
  } catch (error) {
    console.warn("Unable to save tasks.", error);
    showStorageMessage("브라우저 저장소에 저장하지 못했습니다. 브라우저 설정을 확인해 주세요.");
  }
}

function createTaskId() {
  let id;
  do {
    if (typeof window.crypto?.randomUUID === "function") {
      id = window.crypto.randomUUID();
    } else {
      fallbackIdCounter += 1;
      id = `todo-${Date.now()}-${fallbackIdCounter}-${Math.random().toString(36).slice(2)}`;
    }
  } while (tasks.some((task) => task.id === id));

  return id;
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }
  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }
  return tasks;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className =
    "flex min-w-0 items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:items-center";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox mt-1 h-5 w-5 shrink-0 cursor-pointer accent-cyan-400 sm:mt-0";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `${task.text} 완료 여부`);
  checkbox.dataset.action = "toggle";
  checkbox.dataset.taskId = task.id;

  const text = document.createElement("span");
  text.className = `task-text min-w-0 flex-1 leading-relaxed ${
    task.completed ? "text-slate-500 line-through" : "text-slate-200"
  }`;
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "task-delete min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300";
  deleteButton.textContent = "삭제";
  deleteButton.setAttribute("aria-label", `삭제: ${task.text}`);
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.taskId = task.id;

  item.append(checkbox, text, deleteButton);
=======
function isValidTodo(todo) {
  return (
    todo !== null &&
    typeof todo === "object" &&
    typeof todo.id === "string" &&
    todo.id.length > 0 &&
    typeof todo.text === "string" &&
    todo.text.trim().length > 0 &&
    getCharacterLength(todo.text) > 0 &&
    getCharacterLength(todo.text) <= MAX_TEXT_LENGTH &&
    typeof todo.completed === "boolean" &&
    typeof todo.createdAt === "number" &&
    Number.isFinite(todo.createdAt) &&
    (todo.dueAt === undefined || todo.dueAt === null || isValidLocalDateTime(todo.dueAt)) &&
    (todo.priority === undefined || Object.hasOwn(PRIORITIES, todo.priority))
  );
}

function isValidLocalDateTime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(value);
  return (
    Number.isFinite(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10)) &&
    date.getHours() === Number(value.slice(11, 13)) &&
    date.getMinutes() === Number(value.slice(14, 16))
  );
}

function getCharacterLength(value) {
  return Array.from(value).length;
}

function showStorageNotice(message) {
  storageNotice.textContent = message;
  storageNotice.classList.remove("d-none");
}

function clearStorageNotice() {
  storageNotice.textContent = "";
  storageNotice.classList.add("d-none");
}

function saveTodos() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    clearStorageNotice();
  } catch (error) {
    console.error("할 일 목록을 저장하지 못했습니다.", error);
    showStorageNotice("저장하지 못했습니다. 새로고침하면 변경 사항이 사라질 수 있습니다.");
  }
}

function createTodoId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setInputMessage(message) {
  inputMessage.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function updateCharacterCount() {
  const length = getCharacterLength(input.value);
  characterCount.textContent = `${length}/${MAX_TEXT_LENGTH}`;
  characterCount.classList.toggle("is-over-limit", length > MAX_TEXT_LENGTH);
  if (length <= MAX_TEXT_LENGTH) {
    setInputMessage("");
  }
}

function getVisibleTodos() {
  if (currentFilter === FILTERS.active) {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === FILTERS.completed) {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = "list-group-item todo-item";
  item.classList.toggle("is-completed", todo.completed);

  const checkbox = document.createElement("input");
  checkbox.className = "form-check-input todo-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
  checkbox.addEventListener("change", () => {
    todos = todos.map((currentTodo) =>
      currentTodo.id === todo.id
        ? { ...currentTodo, completed: checkbox.checked }
        : currentTodo
    );
    saveTodos();
    render();
  });

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;

  const details = document.createElement("div");
  details.className = "todo-details";

  const priority = document.createElement("span");
  priority.className = `priority-badge priority-${todo.priority}`;
  priority.textContent = `우선순위 ${PRIORITIES[todo.priority]}`;
  details.append(priority);

  if (todo.dueAt) {
    const dueAt = new Date(todo.dueAt);
    const dueDate = document.createElement("time");
    dueDate.className = "due-date";
    dueDate.dateTime = todo.dueAt;
    dueDate.textContent = `마감 ${new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(dueAt)}`;

    if (!todo.completed && dueAt.getTime() < Date.now()) {
      dueDate.classList.add("is-overdue");
      dueDate.textContent = `기한 지남 · ${dueDate.textContent}`;
    }
    details.append(dueDate);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-outline-danger btn-sm delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  deleteButton.addEventListener("click", () => {
    todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
    saveTodos();
    render();
  });

  const content = document.createElement("div");
  content.className = "todo-content";
  content.append(text, details);

  item.append(checkbox, content, deleteButton);
>>>>>>> bootstrap
  return item;
}

function render() {
<<<<<<< HEAD
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  totalCount.textContent = String(tasks.length);
  completedCount.textContent = String(completed);
  progressLabel.textContent = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
  progressFill.style.width = `${percentage}%`;

  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.setAttribute("aria-pressed", String(selected));
  });

  const visibleTasks = getVisibleTasks();
  todoList.replaceChildren(...visibleTasks.map(createTaskElement));

  if (tasks.length === 0) {
    emptyState.textContent = "할 일을 추가해 보세요!";
    emptyState.classList.remove("hidden");
  } else if (visibleTasks.length === 0) {
    emptyState.textContent = "표시할 할 일이 없습니다.";
    emptyState.classList.remove("hidden");
  } else {
    emptyState.textContent = "";
    emptyState.classList.add("hidden");
  }
}

function updateCharacterCount() {
  const length = input.value.length;
  characterCount.textContent = `${length} / ${MAX_TASK_LENGTH}`;
  characterCount.classList.toggle("text-rose-300", length > MAX_TASK_LENGTH);
  characterCount.classList.toggle("text-slate-500", length <= MAX_TASK_LENGTH);
}

function showInputMessage(message) {
  inputMessage.textContent = message;
  inputMessage.classList.remove("hidden");
  input.setAttribute("aria-invalid", "true");
}

function clearInputMessage() {
  inputMessage.textContent = "";
  inputMessage.classList.add("hidden");
  input.removeAttribute("aria-invalid");
=======
  const visibleTodos = getVisibleTodos();
  const doneCount = todos.filter((todo) => todo.completed).length;
  const percentage = todos.length === 0 ? 0 : (doneCount / todos.length) * 100;
  const percentageText = Number.isInteger(percentage)
    ? String(percentage)
    : percentage.toFixed(1);

  totalCount.textContent = String(todos.length);
  completedCount.textContent = String(doneCount);
  progressLabel.textContent = `${percentageText}%`;
  progress.setAttribute("aria-valuenow", percentageText);
  progressBar.style.width = `${percentage}%`;

  todoList.replaceChildren(...visibleTodos.map(createTodoElement));
  emptyState.classList.toggle("d-none", visibleTodos.length > 0);
  emptyState.textContent =
    todos.length === 0 ? "할 일을 추가해 보세요!" : "표시할 할 일이 없습니다.";

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
>>>>>>> bootstrap
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
<<<<<<< HEAD

  if (text.length === 0) {
    showInputMessage("할 일 내용을 입력해 주세요.");
    input.focus();
    return;
  }
  if (input.value.length > MAX_TASK_LENGTH) {
    showInputMessage("할 일은 200자 이하로 입력해 주세요.");
=======
  const characterLength = getCharacterLength(input.value);

  if (text.length === 0) {
    setInputMessage("할 일 내용을 입력해 주세요.");
>>>>>>> bootstrap
    input.focus();
    return;
  }

<<<<<<< HEAD
  tasks = [
    ...tasks,
    {
      id: createTaskId(),
      text,
      completed: false,
      createdAt: Date.now(),
    },
  ];
  saveTasks();
  clearInputMessage();
  input.value = "";
=======
  if (characterLength > MAX_TEXT_LENGTH) {
    setInputMessage(`할 일은 ${MAX_TEXT_LENGTH}자 이내로 입력해 주세요.`);
    input.focus();
    return;
  }

  if (dueAtInput.value && !isValidLocalDateTime(dueAtInput.value)) {
    setInputMessage("마감 날짜와 시간을 확인해 주세요.");
    dueAtInput.setAttribute("aria-invalid", "true");
    dueAtInput.focus();
    return;
  }

  dueAtInput.setAttribute("aria-invalid", "false");
  todos = [
    ...todos,
    {
      id: createTodoId(),
      text,
      completed: false,
      createdAt: Date.now(),
      dueAt: dueAtInput.value || null,
      priority: priorityInput.value
    }
  ];
  saveTodos();
  form.reset();
  priorityInput.value = "medium";
>>>>>>> bootstrap
  updateCharacterCount();
  render();
  input.focus();
});

<<<<<<< HEAD
input.addEventListener("input", () => {
  clearInputMessage();
  updateCharacterCount();
=======
input.addEventListener("input", updateCharacterCount);

dueAtInput.addEventListener("input", () => {
  dueAtInput.setAttribute("aria-invalid", "false");
  if (inputMessage.textContent === "마감 날짜와 시간을 확인해 주세요.") {
    setInputMessage("");
  }
>>>>>>> bootstrap
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

<<<<<<< HEAD
todoList.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.action !== "toggle") {
    return;
  }

  const task = tasks.find((item) => item.id === target.dataset.taskId);
  if (!task) {
    render();
    return;
  }

  tasks = tasks.map((item) =>
    item.id === task.id ? { ...item, completed: target.checked } : item,
  );
  saveTasks();
  render();
});

todoList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest('button[data-action="delete"]');
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const nextTasks = tasks.filter((task) => task.id !== button.dataset.taskId);
  if (nextTasks.length === tasks.length) {
    render();
    return;
  }

  tasks = nextTasks;
  saveTasks();
  render();
});

=======
>>>>>>> bootstrap
updateCharacterCount();
render();
