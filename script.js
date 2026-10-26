"use strict";

const STORAGE_KEY = "daily-todo-items";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const alertBox = document.querySelector("#app-alert");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const progressTrack = document.querySelector(".progress-track");
const remainingCount = document.querySelector("#remaining-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = [];
let currentFilter = "all";

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}

function clearAlert() {
  alertBox.textContent = "";
  alertBox.classList.add("d-none");
}

function loadTodos() {
  let savedTodos;

  try {
    savedTodos = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    showAlert("브라우저 저장소에 접근할 수 없어 기존 할 일을 불러오지 못했습니다.");
    console.error("할 일 저장소를 읽지 못했습니다.", error);
    return;
  }

  if (savedTodos === null) {
    return;
  }

  try {
    const parsedTodos = JSON.parse(savedTodos);
    if (!Array.isArray(parsedTodos)) {
      throw new TypeError("저장된 할 일 데이터가 배열이 아닙니다.");
    }

    todos = parsedTodos.filter((todo) =>
      todo !== null &&
      typeof todo === "object" &&
      (typeof todo.id === "string" || typeof todo.id === "number") &&
      typeof todo.text === "string" &&
      typeof todo.completed === "boolean" &&
      typeof todo.createdAt === "number"
    );

    if (todos.length !== parsedTodos.length) {
      showAlert("일부 저장된 할 일의 형식이 올바르지 않아 해당 항목을 불러오지 못했습니다.");
    }
  } catch (error) {
    showAlert("저장된 할 일을 읽지 못했습니다. 저장 데이터 형식을 확인해 주세요.");
    console.error("저장된 할 일 데이터가 올바르지 않습니다.", error);
  }
}

function saveTodos() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    clearAlert();
  } catch (error) {
    showAlert("할 일을 브라우저에 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
    console.error("할 일을 저장하지 못했습니다.", error);
  }
}

function getVisibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === "completed") {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = "list-group-item todo-item";
  item.classList.toggle("is-completed", todo.completed);

  const checkbox = document.createElement("input");
  checkbox.className = "form-check-input";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
  checkbox.addEventListener("change", () => {
    todo.completed = checkbox.checked;
    saveTodos();
    render();
  });

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-sm btn-link todo-delete text-decoration-none";
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  deleteButton.addEventListener("click", () => {
    todos = todos.filter((itemTodo) => itemTodo.id !== todo.id);
    saveTodos();
    render();
  });

  item.append(checkbox, text, deleteButton);
  return item;
}

function render() {
  const visibleTodos = getVisibleTodos();
  const completedCount = todos.filter((todo) => todo.completed).length;
  const remaining = todos.length - completedCount;
  const completionRate = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  list.replaceChildren(...visibleTodos.map(createTodoElement));
  progressLabel.textContent = `${todos.length}개 중 ${completedCount}개 완료`;
  progressBar.style.width = `${completionRate}%`;
  progressTrack.setAttribute("aria-valuenow", String(completionRate));
  remainingCount.textContent = `남은 할 일 ${remaining}개`;
  clearCompletedButton.disabled = completedCount === 0;

  if (todos.length === 0) {
    emptyState.textContent = "등록된 할 일이 없습니다. 새로운 할 일을 추가해보세요!";
  } else if (visibleTodos.length === 0) {
    emptyState.textContent = "해당하는 할 일이 없습니다.";
  } else {
    emptyState.textContent = "";
  }
  emptyState.classList.toggle("d-none", visibleTodos.length > 0);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (text.length === 0) {
    showAlert("할 일 내용을 입력해 주세요.");
    input.focus();
    return;
  }

  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  todos.unshift({
    id,
    text,
    completed: false,
    createdAt: Date.now()
  });
  input.value = "";
  currentFilter = "all";
  updateFilterButtons();
  saveTodos();
  render();
  input.focus();
});

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
});

loadTodos();
updateFilterButtons();
render();
