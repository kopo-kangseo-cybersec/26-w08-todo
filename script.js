const STORAGE_KEY = "todos_data";
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const PRIORITY_LABELS = { HIGH: "높음", MEDIUM: "보통", LOW: "낮음" };

const form = document.querySelector("#todo-form");
const titleInput = document.querySelector("#todo-title");
const categoryInput = document.querySelector("#todo-category");
const priorityInput = document.querySelector("#todo-priority");
const descriptionInput = document.querySelector("#todo-description");
const startDateInput = document.querySelector("#todo-start-date");
const dueDateInput = document.querySelector("#todo-due-date");
const deleteDialog = document.querySelector("#delete-dialog");
const deleteTodoTitle = document.querySelector("#delete-todo-title");
const cancelDeleteButton = document.querySelector("#cancel-delete");
const confirmDeleteButton = document.querySelector("#confirm-delete");
const confettiLayer = document.querySelector("#confetti-layer");
const titleCount = document.querySelector("#title-count");
const descriptionCount = document.querySelector("#description-count");
const formHeading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");
const statusMessage = document.querySelector("#status-message");
const progress = document.querySelector(".progress");
const progressSection = document.querySelector("#progress-section");
const progressBar = document.querySelector("#progress-bar");
const progressLabel = document.querySelector("#progress-label");
const filterTabs = document.querySelector("#filter-tabs");
const listControls = document.querySelector("#list-controls");
const sortOrder = document.querySelector("#sort-order");
const listSummary = document.querySelector("#list-summary");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const countLabels = [...document.querySelectorAll("[data-count]")];

let todos = [];
let selectedFilter = "all";
let editingId = null;
let storageFailure = null;
let initialLoadFailed = false;
let pendingDeleteId = null;
let deleteTrigger = null;

function isTodoItem(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.id === "string" &&
      value.id.length > 0 &&
      typeof value.title === "string" &&
      value.title.trim().length > 0 &&
      value.title.length <= 100 &&
      typeof value.description === "string" &&
      value.description.length <= 500 &&
      (value.startDate === undefined ||
        (typeof value.startDate === "string" &&
          (value.startDate === "" || !Number.isNaN(Date.parse(value.startDate))))) &&
      typeof value.dueDate === "string" &&
      (value.dueDate === "" || !Number.isNaN(Date.parse(value.dueDate))) &&
      ["HIGH", "MEDIUM", "LOW"].includes(value.priority) &&
      typeof value.category === "string" &&
      typeof value.completed === "boolean" &&
      typeof value.createdAt === "string" &&
      !Number.isNaN(Date.parse(value.createdAt)) &&
      typeof value.updatedAt === "string" &&
      !Number.isNaN(Date.parse(value.updatedAt))
  );
}

function loadTodos() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue === null) return { ok: true, value: [] };

    const parsedValue = JSON.parse(storedValue);
    const ids = Array.isArray(parsedValue) ? parsedValue.map((todo) => todo?.id) : [];
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every(isTodoItem) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error("저장된 할 일 데이터의 형식이 올바르지 않습니다.");
    }

    return {
      ok: true,
      value: parsedValue.map((todo) => ({ startDate: "", ...todo })),
    };
  } catch (error) {
    return { ok: false, error };
  }
}

function persistTodos(nextTodos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos));
    return true;
  } catch (error) {
    storageFailure = error;
    showMessage(
      "브라우저 저장소에 변경 내용을 저장하지 못했습니다. 저장 공간과 브라우저의 저장 권한을 확인해 주세요.",
      "danger"
    );
    setFormDisabled(true);
    render();
    return false;
  }
}

function setFormDisabled(disabled) {
  for (const control of form.querySelectorAll("input, select, textarea, button")) {
    control.disabled = disabled;
  }
}

function showMessage(message, type = "success") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type === "danger" ? "status-error" : "status-success"}`;
}

function hideMessage() {
  statusMessage.textContent = "";
  statusMessage.className = "status-message hidden";
}

function syncCharacterCounts() {
  titleCount.textContent = `${titleInput.value.length} / 100`;
  descriptionCount.textContent = `${descriptionInput.value.length} / 500`;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isScheduledToday(todo, today = getLocalDateString()) {
  if (!todo.startDate && !todo.dueDate) return true;
  const startsToday = !todo.startDate || todo.startDate.slice(0, 10) <= today;
  const endsToday = !todo.dueDate || todo.dueDate.slice(0, 10) >= today;
  return startsToday && endsToday;
}

function getVisibleTodos() {
  let visibleTodos = todos.filter((todo) => {
    if (selectedFilter === "today") return isScheduledToday(todo);
    if (selectedFilter === "completed") return todo.completed;
    return true;
  });

  visibleTodos = [...visibleTodos];
  if (sortOrder.value === "dueDate") {
    visibleTodos.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.createdAt.localeCompare(a.createdAt);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) || b.createdAt.localeCompare(a.createdAt);
    });
  } else if (sortOrder.value === "priority") {
    visibleTodos.sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        b.createdAt.localeCompare(a.createdAt)
    );
  } else {
    visibleTodos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return visibleTodos;
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSchedule(todo) {
  if (!todo.startDate && !todo.dueDate) return "일정 미지정";
  const start = todo.startDate ? `시작: ${formatDateTime(todo.startDate)}` : "";
  const end = todo.dueDate ? `마감: ${formatDateTime(todo.dueDate)}` : "";
  return [start, end].filter(Boolean).join(" · ");
}

function createTodoCard(todo) {
  const card = createElement(
    "article",
    `todo-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${
      todo.completed ? "todo-completed" : ""
    }`.trim()
  );
  const row = createElement("div", "flex min-w-0 flex-1 items-start gap-3");
  const checkbox = createElement("input", "todo-checkbox");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.disabled = Boolean(storageFailure);
  checkbox.setAttribute("aria-label", `${todo.title} 완료 여부`);
  checkbox.addEventListener("change", () => {
    const shouldCelebrate = checkbox.checked;
    const checkboxBounds = shouldCelebrate ? checkbox.getBoundingClientRect() : null;
    const nextTodos = todos.map((item) =>
      item.id === todo.id
        ? { ...item, completed: checkbox.checked, updatedAt: new Date().toISOString() }
        : item
    );
    if (persistTodos(nextTodos)) {
      todos = nextTodos;
      hideMessage();
      render();
      if (shouldCelebrate && checkboxBounds) {
        celebrateCompletion(
          checkboxBounds.left + checkboxBounds.width / 2,
          checkboxBounds.top + checkboxBounds.height / 2
        );
      }
    }
  });

  const content = createElement("div", "min-w-0 flex-1");
  const headingRow = createElement("div", "mb-2 flex flex-wrap items-center gap-2");
  const title = createElement("h3", "todo-title text-base font-semibold text-slate-900", todo.title);
  const category = createElement(
    "span",
    "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600",
    todo.category || "일반"
  );
  const priority = createElement(
    "span",
    `priority-badge priority-${todo.priority.toLowerCase()}`,
    PRIORITY_LABELS[todo.priority]
  );
  headingRow.append(title, category, priority);
  content.append(headingRow);

  if (todo.description) {
    content.append(createElement("p", "todo-description mb-2 text-sm text-slate-500", todo.description));
  }

  content.append(createElement("p", "text-xs text-slate-500", formatSchedule(todo)));
  row.append(checkbox, content);

  const cardBody = createElement("div", "flex flex-col gap-3 sm:flex-row sm:items-start");
  const actions = createElement("div", "ml-9 flex shrink-0 gap-2 sm:ml-auto");
  const editButton = createElement("button", "todo-action", "수정");
  editButton.type = "button";
  editButton.disabled = Boolean(storageFailure);
  editButton.setAttribute("aria-label", `${todo.title} 수정`);
  editButton.addEventListener("click", () => startEditing(todo));

  const deleteButton = createElement("button", "todo-action todo-action-danger", "삭제");
  deleteButton.type = "button";
  deleteButton.disabled = Boolean(storageFailure);
  deleteButton.setAttribute("aria-label", `${todo.title} 삭제`);
  deleteButton.addEventListener("click", () => openDeleteDialog(todo, deleteButton));

  actions.append(editButton, deleteButton);
  cardBody.append(row, actions);
  card.append(cardBody);
  return card;
}

function openDeleteDialog(todo, trigger) {
  pendingDeleteId = todo.id;
  deleteTrigger = trigger;
  deleteTodoTitle.textContent = `“${todo.title}”`;
  deleteDialog.showModal();
  cancelDeleteButton.focus();
}

function closeDeleteDialog() {
  if (deleteDialog.open) deleteDialog.close();
  pendingDeleteId = null;
}

function deletePendingTodo() {
  const todoToDelete = todos.find((todo) => todo.id === pendingDeleteId);
  if (!todoToDelete) {
    closeDeleteDialog();
    return;
  }

  const nextTodos = todos.filter((todo) => todo.id !== todoToDelete.id);
  if (!persistTodos(nextTodos)) return;

  todos = nextTodos;
  closeDeleteDialog();
  if (editingId === todoToDelete.id) resetForm();
  showMessage("할 일을 삭제했습니다.");
  render();
}

function celebrateCompletion(x, y) {
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const colors = ["gold", "rose", "indigo", "mint", "sky"];
  const particleCount = 24;

  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.18;
    const distance = 28 + Math.random() * 58;
    const particle = createElement(
      "span",
      `confetti-piece confetti-${colors[index % colors.length]}`
    );
    particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--y", `${Math.sin(angle) * distance - 22}px`);
    particle.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    confettiLayer.append(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
}

function renderCounts() {
  const counts = {
    all: todos.length,
    today: todos.filter((todo) => isScheduledToday(todo)).length,
    completed: todos.filter((todo) => todo.completed).length,
  };

  for (const label of countLabels) {
    label.textContent = String(counts[label.dataset.count]);
  }
}

function renderProgress() {
  const completedCount = todos.filter((todo) => todo.completed).length;
  const percentage = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);
  progress.setAttribute("aria-valuenow", String(percentage));
  progressBar.style.width = `${percentage}%`;
  progressLabel.textContent = `${percentage}% (${completedCount}/${todos.length} 완료)`;
}

function renderEmptyState(visibleCount) {
  if (visibleCount > 0 || initialLoadFailed) {
    emptyState.classList.add("hidden");
    emptyState.textContent = "";
    return;
  }

  emptyState.textContent =
    todos.length === 0 && selectedFilter === "all"
      ? "등록된 할 일이 없습니다. 새로운 할 일을 추가해 보세요!"
      : "해당 탭에 조건에 맞는 할 일이 없습니다.";
  emptyState.classList.remove("hidden");
}

function render() {
  progressSection.classList.toggle("hidden", initialLoadFailed);
  listControls.classList.toggle("hidden", initialLoadFailed);
  if (!initialLoadFailed) {
    renderCounts();
    renderProgress();
  }

  for (const tab of filterTabs.querySelectorAll("[data-filter]")) {
    const isSelected = tab.dataset.filter === selectedFilter;
    tab.classList.toggle("active", isSelected);
    tab.setAttribute("aria-pressed", String(isSelected));
  }

  if (initialLoadFailed) {
    todoList.replaceChildren();
    listSummary.textContent = "저장된 할 일 목록을 불러올 수 없습니다.";
    renderEmptyState(0);
    return;
  }

  const visibleTodos = getVisibleTodos();
  todoList.replaceChildren(...visibleTodos.map(createTodoCard));
  listSummary.textContent = `${visibleTodos.length}개의 할 일`;
  renderEmptyState(visibleTodos.length);
}

function resetForm() {
  form.reset();
  editingId = null;
  formHeading.textContent = "새 할 일";
  submitButton.textContent = "할 일 추가";
  cancelEditButton.classList.add("hidden");
  categoryInput.value = "일반";
  startDateInput.value = "";
  document.querySelector(".todo-details").open = false;
  titleInput.removeAttribute("aria-invalid");
  syncCharacterCounts();
}

function startEditing(todo) {
  editingId = todo.id;
  titleInput.value = todo.title;
  categoryInput.value = todo.category;
  priorityInput.value = todo.priority;
  descriptionInput.value = todo.description;
  startDateInput.value = todo.startDate;
  dueDateInput.value = todo.dueDate;
  document.querySelector(".todo-details").open = true;
  formHeading.textContent = "할 일 수정";
  submitButton.textContent = "수정 내용 저장";
  cancelEditButton.classList.remove("hidden");
  syncCharacterCounts();
  hideMessage();
  titleInput.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function validateForm() {
  const title = titleInput.value.trim();
  const description = descriptionInput.value;
  const startDate = startDateInput.value;
  const dueDate = dueDateInput.value;

  if (!title) {
    showMessage("할 일 제목을 입력해 주세요.", "danger");
    titleInput.setAttribute("aria-invalid", "true");
    titleInput.focus();
    return false;
  }
  if (titleInput.value.length > 100) {
    showMessage("제목은 100자 이하로 입력해 주세요.", "danger");
    titleInput.setAttribute("aria-invalid", "true");
    titleInput.focus();
    return false;
  }
  if (description.length > 500) {
    showMessage("상세 설명은 500자 이하로 입력해 주세요.", "danger");
    descriptionInput.focus();
    return false;
  }
  if (startDate && dueDate && startDate > dueDate) {
    showMessage("시작 일시는 마감 일시보다 늦을 수 없습니다.", "danger");
    dueDateInput.focus();
    return false;
  }

  titleInput.removeAttribute("aria-invalid");
  return true;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (storageFailure || !validateForm()) return;

  const now = new Date().toISOString();
  const existingTodo = todos.find((todo) => todo.id === editingId);
  const todo = {
    id: editingId ?? createId(),
    title: titleInput.value.trim(),
    description: descriptionInput.value,
    startDate: startDateInput.value,
    dueDate: dueDateInput.value,
    priority: priorityInput.value,
    category: categoryInput.value.trim() || "일반",
    completed: existingTodo?.completed ?? false,
    createdAt: existingTodo?.createdAt ?? now,
    updatedAt: now,
  };
  const nextTodos = existingTodo
    ? todos.map((item) => (item.id === editingId ? todo : item))
    : [...todos, todo];

  if (!persistTodos(nextTodos)) return;
  todos = nextTodos;
  resetForm();
  showMessage(existingTodo ? "할 일을 수정했습니다." : "새 할 일을 추가했습니다.");
  render();
});

titleInput.addEventListener("input", syncCharacterCounts);
descriptionInput.addEventListener("input", syncCharacterCounts);
cancelEditButton.addEventListener("click", () => {
  resetForm();
  hideMessage();
});

filterTabs.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const tab = event.target.closest("[data-filter]");
  if (!tab) return;
  selectedFilter = tab.dataset.filter;
  render();
});

sortOrder.addEventListener("change", render);
cancelDeleteButton.addEventListener("click", closeDeleteDialog);
confirmDeleteButton.addEventListener("click", deletePendingTodo);
deleteDialog.addEventListener("close", () => {
  pendingDeleteId = null;
  if (deleteTrigger?.isConnected) deleteTrigger.focus();
  deleteTrigger = null;
});
deleteDialog.addEventListener("click", (event) => {
  if (event.target === deleteDialog) closeDeleteDialog();
});

const loadResult = loadTodos();
if (loadResult.ok) {
  todos = loadResult.value;
} else {
  storageFailure = loadResult.error;
  initialLoadFailed = true;
  showMessage(
    "저장된 할 일 목록을 불러오지 못했습니다. 브라우저 저장소가 차단되었거나 데이터 형식이 손상되었을 수 있습니다.",
    "danger"
  );
  setFormDisabled(true);
}

syncCharacterCounts();
render();
