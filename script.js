"use strict";

const STORAGE_KEY = "daily-todo-items";
const MAX_TASK_LENGTH = 100;
const appContent = document.querySelector("main");
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const dateInput = document.querySelector("#todo-date");
const message = document.querySelector("#form-message");
const list = document.querySelector("#todo-list");
const emptyMessage = document.querySelector("#empty-message");
const progressBar = document.querySelector("#progress-bar");
const progressFill = document.querySelector("#progress-fill");
const progressLabel = document.querySelector("#progress-label");
const progressCount = document.querySelector("#progress-count");
const completionMessage = document.querySelector("#completion-message");
const deleteDialog = document.querySelector("#delete-dialog");
const deleteDialogDescription = document.querySelector("#delete-dialog-description");
const cancelDeleteButton = document.querySelector("#cancel-delete");
const confirmDeleteButton = document.querySelector("#confirm-delete");
const filterButtons = document.querySelectorAll("[data-filter]");

let currentFilter = "all";
let tasks = loadTasks();
let pendingDeleteTaskId = null;
let deleteTrigger = null;

function isValidDate(value) {
  if (value === "") {
    return true;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(value);
}

function isTaskList(value) {
  return Array.isArray(value) && value.every((task) =>
    task !== null
    && typeof task === "object"
    && typeof task.id === "string"
    && typeof task.text === "string"
    && typeof task.completed === "boolean"
    && (task.dueDate === undefined || isValidDate(task.dueDate))
  );
}

function normalizeTasks(taskList) {
  return taskList.map((task) => ({ ...task, dueDate: task.dueDate ?? "" }));
}

function showMessage(text) {
  message.textContent = text;
}

function loadTasks() {
  let storedValue;
  try {
    storedValue = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    if (error instanceof DOMException) {
      showMessage("브라우저 저장 공간에 접근할 수 없어 저장된 할 일을 불러오지 못했습니다.");
      return [];
    }
    throw error;
  }

  if (storedValue === null) {
    return [];
  }

  let parsedValue;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    if (error instanceof SyntaxError) {
      showMessage("저장된 할 일 데이터가 손상되어 불러오지 못했습니다.");
      return [];
    }
    throw error;
  }

  if (!isTaskList(parsedValue)) {
    showMessage("저장된 할 일 데이터 형식이 올바르지 않습니다.");
    return [];
  }

  return normalizeTasks(parsedValue);
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    showMessage("");
  } catch (error) {
    if (error instanceof DOMException) {
      showMessage("브라우저 저장 공간에 접근할 수 없어 변경사항을 저장하지 못했습니다.");
      return;
    }
    throw error;
  }
}

function celebrateCompletion() {
  completionMessage.textContent = "해냈어요! 오늘의 할 일을 완료했습니다.";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const confetti = document.createElement("div");
  confetti.className = "completion-confetti";
  confetti.setAttribute("aria-hidden", "true");
  const colors = ["#536dfe", "#f4bd50", "#e87878", "#69b99a", "#a783d4"];

  for (let index = 0; index < 36; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
    piece.style.setProperty("--delay", `${Math.random() * 350}ms`);
    piece.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
    piece.style.backgroundColor = colors[index % colors.length];
    confetti.append(piece);
  }

  document.body.append(confetti);
  window.setTimeout(() => confetti.remove(), 2400);
}

function openDeleteDialog(taskId, trigger) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  pendingDeleteTaskId = taskId;
  deleteTrigger = trigger;
  deleteDialogDescription.textContent = `“${task.text}” 항목을 삭제할까요? 삭제하면 목록에서 사라집니다.`;
  appContent.inert = true;
  deleteDialog.hidden = false;
  cancelDeleteButton.focus();
}

function closeDeleteDialog() {
  deleteDialog.hidden = true;
  appContent.inert = false;
  pendingDeleteTaskId = null;
  if (deleteTrigger?.isConnected) {
    deleteTrigger.focus();
  } else {
    input.focus();
  }
  deleteTrigger = null;
}

function deletePendingTask() {
  if (pendingDeleteTaskId === null) {
    return;
  }

  tasks = tasks.filter((task) => task.id !== pendingDeleteTaskId);
  saveTasks();
  renderTasks();
  closeDeleteDialog();
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

function renderTasks() {
  list.replaceChildren();

  for (const task of getVisibleTasks()) {
    const item = document.createElement("li");
    item.className = "todo-item";

    const checkbox = document.createElement("input");
    checkbox.className = "todo-check";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.text} 완료 여부`);
    checkbox.addEventListener("change", () => {
      const wasCompleted = task.completed;
      task.completed = checkbox.checked;
      saveTasks();
      if (!wasCompleted && task.completed) {
        celebrateCompletion();
      }
      renderTasks();
    });

    const content = document.createElement("div");
    content.className = "todo-item-content";
    const label = document.createElement("span");
    label.className = "todo-item-label";
    label.textContent = task.text;
    if (task.completed) {
      label.classList.add("is-completed");
    }
    content.append(label);

    if (task.dueDate) {
      const [year, month, day] = task.dueDate.split("-").map(Number);
      const dueDate = document.createElement("time");
      dueDate.className = "todo-due-date";
      dueDate.dateTime = task.dueDate;
      dueDate.textContent = `마감일: ${year}년 ${month}월 ${day}일`;
      content.append(dueDate);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "todo-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.setAttribute("aria-label", `${task.text} 삭제`);
    deleteButton.addEventListener("click", () => openDeleteDialog(task.id, deleteButton));

    item.append(checkbox, content, deleteButton);
    list.append(item);
  }

  const visibleTasks = getVisibleTasks();
  emptyMessage.hidden = visibleTasks.length > 0;
  if (tasks.length === 0) {
    emptyMessage.textContent = "할 일을 추가하세요.";
  } else if (visibleTasks.length === 0) {
    emptyMessage.textContent = "해당하는 할 일이 없습니다.";
  }

  for (const button of filterButtons) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("filter-button-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const percent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  progressLabel.textContent = `${percent}%`;
  progressCount.textContent = `${tasks.length}개 중 ${completedCount}개 완료`;
  progressFill.style.width = `${percent}%`;
  progressBar.setAttribute("aria-valuenow", String(percent));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (text.length === 0) {
    showMessage("할 일을 입력하세요.");
    input.focus();
    return;
  }

  if (text.length > MAX_TASK_LENGTH) {
    showMessage("100자 이내로 입력하세요.");
    input.focus();
    return;
  }

  tasks.push({
    id: crypto.randomUUID(),
    text,
    completed: false,
    dueDate: dateInput.value,
  });
  saveTasks();
  input.value = "";
  dateInput.value = "";
  currentFilter = "all";
  renderTasks();
  input.focus();
});

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
}

cancelDeleteButton.addEventListener("click", closeDeleteDialog);
confirmDeleteButton.addEventListener("click", deletePendingTask);
deleteDialog.addEventListener("click", (event) => {
  if (event.target === deleteDialog) {
    closeDeleteDialog();
  }
});
deleteDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeDeleteDialog();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    const focusableButtons = [cancelDeleteButton, confirmDeleteButton];
    const currentIndex = focusableButtons.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = currentIndex === -1
      ? (event.shiftKey ? focusableButtons.length - 1 : 0)
      : (currentIndex + direction + focusableButtons.length) % focusableButtons.length;
    focusableButtons[nextIndex].focus();
  }
});

renderTasks();
