"use strict";

const STORAGE_KEY = "todos";
const REMINDERS_KEY = "todoRemindersEnabled";
const MAX_TEXT_LENGTH = 100;
const EMPTY_LIST_MESSAGE = "등록된 할 일이 없습니다. 새로운 할 일을 추가해보세요!";
const EMPTY_FILTER_MESSAGE = "해당 조건에 맞는 할 일이 없습니다.";
const PRIORITY_LABELS = { high: "높음", normal: "보통", low: "낮음" };
const RECURRENCE_LABELS = { daily: "매일 반복", weekly: "매주 반복", monthly: "매월 반복" };

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const dueDateInput = document.querySelector("#todo-due-date");
const priorityInput = document.querySelector("#todo-priority");
const categoryInput = document.querySelector("#todo-category");
const recurrenceInput = document.querySelector("#todo-recurrence");
const remindInput = document.querySelector("#todo-remind");
const inputError = document.querySelector("#input-error");
const storageError = document.querySelector("#storage-error");
const reminderToggle = document.querySelector("#reminder-toggle");
const reminderStatus = document.querySelector("#reminder-status");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const clearCompletedButton = document.querySelector("#clear-completed");
const progressSummary = document.querySelector("#progress-summary");
const progressPercentage = document.querySelector("#progress-percentage");
const progressTrack = document.querySelector("#progress-track");
const progressBar = document.querySelector("#progress-bar");
const filterButtons = document.querySelectorAll("[data-filter]");
const searchInput = document.querySelector("#todo-search");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#todo-sort");
const calendarMonthLabel = document.querySelector("#calendar-month");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarSelection = document.querySelector("#calendar-selection");
const clearDateFilterButton = document.querySelector("#clear-date-filter");

let todos = [];
let currentFilter = "all";
let editingId = null;
let persistenceAvailable = true;
let remindersEnabled = false;
let selectedDate = "";
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const attemptedReminders = new Set();

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && formatDate(date) === value;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(value) {
  if (!value || !isValidDateString(value)) {
    return "";
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(
    new Date(year, month - 1, day),
  );
}

function isTodo(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.completed === "boolean" &&
    typeof value.createdAt === "string" &&
    (value.dueDate === undefined || value.dueDate === "" || isValidDateString(value.dueDate)) &&
    (value.priority === undefined || Object.hasOwn(PRIORITY_LABELS, value.priority)) &&
    (value.category === undefined || (typeof value.category === "string" && value.category.length <= 30)) &&
    (value.recurrence === undefined || ["none", ...Object.keys(RECURRENCE_LABELS)].includes(value.recurrence)) &&
    (value.remind === undefined || typeof value.remind === "boolean") &&
    (value.reminderSentOn === undefined || value.reminderSentOn === "" || isValidDateString(value.reminderSentOn)) &&
    (value.nextOccurrenceCreated === undefined || typeof value.nextOccurrenceCreated === "boolean")
  );
}

function normalizeTodo(todo) {
  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    createdAt: todo.createdAt,
    dueDate: todo.dueDate ?? "",
    priority: todo.priority ?? "normal",
    category: todo.category ?? "",
    recurrence: todo.recurrence ?? "none",
    remind: todo.remind ?? false,
    reminderSentOn: todo.reminderSentOn ?? "",
    nextOccurrenceCreated: todo.nextOccurrenceCreated ?? false,
  };
}

function showStorageError(message) {
  storageError.textContent = message;
  storageError.classList.remove("hidden");
}

function loadTodos() {
  let storedValue;
  try {
    storedValue = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    persistenceAvailable = false;
    showStorageError("브라우저 저장소를 읽을 수 없습니다. 변경 사항이 저장되지 않을 수 있습니다.");
    return [];
  }

  if (storedValue === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed) || !parsed.every(isTodo)) {
      throw new TypeError("저장된 할 일 데이터의 형식이 올바르지 않습니다.");
    }
    return parsed.map(normalizeTodo);
  } catch {
    persistenceAvailable = false;
    showStorageError("저장된 할 일 데이터를 읽을 수 없습니다. 기존 데이터는 변경하지 않았으며, 새 변경 사항은 저장되지 않습니다.");
    return [];
  }
}

function loadReminderSetting() {
  try {
    remindersEnabled = window.localStorage.getItem(REMINDERS_KEY) === "true";
  } catch {
    persistenceAvailable = false;
    showStorageError("브라우저 저장소를 읽을 수 없습니다. 할 일 및 알림 설정이 저장되지 않을 수 있습니다.");
  }
}

function saveTodos() {
  if (!persistenceAvailable) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    persistenceAvailable = false;
    showStorageError("할 일 목록을 브라우저에 저장하지 못했습니다. 변경 사항이 현재 화면에만 유지됩니다.");
  }
}

function saveReminderSetting(enabled) {
  if (!persistenceAvailable) {
    reminderStatus.textContent = "저장소에 접근할 수 없어 알림 설정을 저장하지 못했습니다.";
    return false;
  }
  try {
    window.localStorage.setItem(REMINDERS_KEY, String(enabled));
    remindersEnabled = enabled;
    updateReminderControls();
    return true;
  } catch {
    persistenceAvailable = false;
    showStorageError("알림 설정을 브라우저에 저장하지 못했습니다.");
    reminderStatus.textContent = "알림 설정을 저장하지 못했습니다.";
    return false;
  }
}

function updateReminderControls() {
  reminderToggle.textContent = remindersEnabled ? "알림 끄기" : "알림 켜기";
  if (!("Notification" in window)) {
    reminderStatus.textContent = "이 브라우저는 알림 기능을 지원하지 않습니다.";
  } else if (window.Notification.permission === "denied") {
    reminderStatus.textContent = "브라우저 설정에서 알림 권한을 허용한 뒤 알림을 켜주세요.";
  } else if (remindersEnabled) {
    reminderStatus.textContent = "앱이 열려 있으면 마감일 오전 9시에 알림을 표시합니다.";
  } else {
    reminderStatus.textContent = "알림을 받으려면 알림 켜기를 누르고 브라우저 권한을 허용해주세요.";
  }
}

function getVisibleTodos() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase("ko");
  let visibleTodos = todos.filter((todo) => {
    if (currentFilter === "active" && todo.completed) return false;
    if (currentFilter === "completed" && !todo.completed) return false;
    if (selectedDate && todo.dueDate !== selectedDate) return false;
    if (categoryFilter.value && todo.category !== categoryFilter.value) return false;
    if (searchTerm && !`${todo.text} ${todo.category}`.toLocaleLowerCase("ko").includes(searchTerm)) return false;
    return true;
  });

  if (sortSelect.value === "priority") {
    const rank = { high: 0, normal: 1, low: 2 };
    visibleTodos.sort((a, b) => rank[a.priority] - rank[b.priority] || a.createdAt.localeCompare(b.createdAt));
  } else if (sortSelect.value === "completion") {
    visibleTodos.sort((a, b) => Number(a.completed) - Number(b.completed) || a.createdAt.localeCompare(b.createdAt));
  } else {
    visibleTodos.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return a.createdAt.localeCompare(b.createdAt);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt);
    });
  }
  return visibleTodos;
}

function updateProgress() {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressSummary.textContent = `총 ${total}개 중 ${completed}개 완료 (${percentage}%)`;
  progressPercentage.textContent = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
  progressBar.style.width = `${percentage}%`;
}

function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function getEditInput(todoId) {
  return Array.from(todoList.querySelectorAll("[data-edit-input]")).find(
    (element) => element.dataset.editInput === todoId,
  );
}

function beginEditing(todo) {
  editingId = todo.id;
  render();
  const editInput = getEditInput(todo.id);
  editInput?.focus();
  editInput?.select();
}

function finishEditing(todo, fields) {
  const text = fields.text.value.trim();
  if (!text) {
    fields.text.setCustomValidity("할 일 내용을 입력해주세요.");
    fields.text.reportValidity();
    fields.text.focus();
    return;
  }

  const category = fields.category.value.trim();
  const dueDate = fields.dueDate.value;
  if (fields.remind.checked && !dueDate) {
    fields.dueDate.setCustomValidity("알림을 설정하려면 마감일을 선택해주세요.");
    fields.dueDate.reportValidity();
    fields.dueDate.focus();
    return;
  }

  todos = todos.map((item) =>
    item.id === todo.id
      ? {
          ...item,
          text,
          dueDate,
          priority: fields.priority.value,
          category,
          recurrence: fields.recurrence.value,
          remind: fields.remind.checked,
          reminderSentOn: dueDate === item.dueDate ? item.reminderSentOn : "",
        }
      : item,
  );
  editingId = null;
  saveTodos();
  render();
}

function incrementDate(dateString, recurrence) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (recurrence === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (recurrence === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (recurrence === "monthly") {
    const nextMonth = new Date(year, month, 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    nextMonth.setDate(Math.min(day, lastDay));
    return formatDate(nextMonth);
  }
  return formatDate(date);
}

function createNextOccurrence(todo) {
  if (todo.recurrence === "none" || todo.nextOccurrenceCreated) {
    return;
  }
  const baseDate = todo.dueDate || formatDate(new Date());
  todos.push({
    id: typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: todo.text,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: incrementDate(baseDate, todo.recurrence),
    priority: todo.priority,
    category: todo.category,
    recurrence: todo.recurrence,
    remind: todo.remind,
    reminderSentOn: "",
    nextOccurrenceCreated: false,
  });
  todo.nextOccurrenceCreated = true;
}

function toggleTodo(todo, completed) {
  todos = todos.map((item) => (item.id === todo.id ? { ...item, completed } : item));
  const updated = todos.find((item) => item.id === todo.id);
  if (completed) {
    createNextOccurrence(updated);
  }
  saveTodos();
  render();
}

function createMetadataEditor(todo) {
  const container = document.createElement("div");
  container.className = "grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2";
  const fields = {};

  const addField = (key, label, tagName, value, options = []) => {
    const wrapper = document.createElement("label");
    wrapper.className = "min-w-0 space-y-1 text-xs font-semibold text-slate-500";
    wrapper.append(document.createTextNode(label));
    const control = document.createElement(tagName);
    control.className = "min-h-11 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700";
    if (tagName === "select") {
      options.forEach(([optionValue, optionLabel]) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionLabel;
        control.append(option);
      });
      control.value = value;
    } else {
      control.type = key === "dueDate" ? "date" : "text";
      if (key === "text") control.maxLength = MAX_TEXT_LENGTH;
      if (key === "category") control.maxLength = 30;
      if (key === "text") control.dataset.editInput = todo.id;
      control.value = value;
    }
    control.addEventListener("input", () => control.setCustomValidity(""));
    wrapper.append(control);
    container.append(wrapper);
    fields[key] = control;
  };

  addField("dueDate", "마감일", "input", todo.dueDate);
  addField("priority", "우선순위", "select", todo.priority, [
    ["high", "높음"], ["normal", "보통"], ["low", "낮음"],
  ]);
  addField("category", "카테고리", "input", todo.category);
  addField("recurrence", "반복", "select", todo.recurrence, [
    ["none", "반복 없음"], ["daily", "매일"], ["weekly", "매주"], ["monthly", "매월"],
  ]);
  addField("text", "할 일 내용", "input", todo.text);

  const reminderLabel = document.createElement("label");
  reminderLabel.className = "flex min-h-11 items-center gap-2 text-sm text-slate-600";
  const reminderCheckbox = document.createElement("input");
  reminderCheckbox.type = "checkbox";
  reminderCheckbox.checked = todo.remind;
  reminderCheckbox.className = "h-4 w-4 accent-indigo-600";
  reminderLabel.append(reminderCheckbox, document.createTextNode("마감일 알림"));
  container.append(reminderLabel);
  fields.remind = reminderCheckbox;
  fields.dueDate.addEventListener("input", () => fields.dueDate.setCustomValidity(""));
  return { container, fields };
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = "flex min-h-16 flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-100 sm:gap-4 sm:p-4";

  const checkboxLabel = document.createElement("label");
  checkboxLabel.className = "flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-indigo-50";
  checkboxLabel.setAttribute("aria-label", todo.completed ? "완료 상태 해제" : "할 일 완료");
  const checkbox = document.createElement("input");
  checkbox.className = "todo-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료`);
  checkbox.addEventListener("change", () => toggleTodo(todo, checkbox.checked));
  checkboxLabel.append(checkbox);
  item.append(checkboxLabel);

  if (editingId === todo.id) {
    const { container, fields } = createMetadataEditor(todo);
    item.append(container);
    item.append(
      createActionButton(
        "저장",
        "min-h-11 min-w-11 rounded-lg px-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50",
        () => finishEditing(todo, fields),
      ),
      createActionButton(
        "취소",
        "min-h-11 min-w-11 rounded-lg px-2 text-sm font-semibold text-slate-500 hover:bg-slate-100",
        () => {
          editingId = null;
          render();
        },
      ),
    );
    return item;
  }

  const content = document.createElement("div");
  content.className = "min-w-0 flex-1";
  const text = document.createElement("p");
  text.className = `todo-text text-base leading-6 ${todo.completed ? "text-slate-400 line-through" : "text-slate-700"}`;
  text.textContent = todo.text;
  content.append(text);

  const metadata = document.createElement("div");
  metadata.className = "mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500";
  if (todo.dueDate) {
    const due = document.createElement("span");
    due.textContent = `마감 ${formatReadableDate(todo.dueDate)}`;
    due.className = isValidDateString(todo.dueDate) && todo.dueDate < formatDate(new Date()) && !todo.completed
      ? "font-semibold text-rose-600"
      : "";
    metadata.append(due);
  }
  const priority = document.createElement("span");
  priority.textContent = `우선순위 ${PRIORITY_LABELS[todo.priority]}`;
  metadata.append(priority);
  if (todo.category) {
    const category = document.createElement("span");
    category.textContent = `· ${todo.category}`;
    metadata.append(category);
  }
  if (todo.recurrence !== "none") {
    const recurrence = document.createElement("span");
    recurrence.textContent = `· ${RECURRENCE_LABELS[todo.recurrence]}`;
    metadata.append(recurrence);
  }
  if (metadata.childElementCount > 0) content.append(metadata);
  item.append(content);

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center";
  actions.append(
    createActionButton(
      "수정",
      "min-h-11 min-w-11 rounded-lg px-2 text-sm font-semibold text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700",
      () => beginEditing(todo),
    ),
    createActionButton(
      "삭제",
      "min-h-11 min-w-11 rounded-lg px-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700",
      () => {
        todos = todos.filter((item) => item.id !== todo.id);
        saveTodos();
        render();
      },
    ),
  );
  item.append(actions);
  return item;
}

function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  calendarMonthLabel.textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(displayedMonth);
  calendarGrid.replaceChildren();

  const firstWeekday = new Date(year, month, 1).getDay();
  const start = new Date(year, month, 1 - firstWeekday);
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const dateValue = formatDate(date);
    const dayTodos = todos.filter((todo) => todo.dueDate === dateValue);
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-pressed", String(selectedDate === dateValue));
    button.setAttribute("aria-label", `${year}년 ${date.getMonth() + 1}월 ${date.getDate()}일, 할 일 ${dayTodos.length}개`);
    button.className = "calendar-day min-h-12 rounded-lg border border-transparent px-1 py-1 text-sm transition hover:border-indigo-200 hover:bg-white";
    if (date.getMonth() !== month) button.classList.add("text-slate-300");
    else button.classList.add("text-slate-700");
    if (dateValue === formatDate(new Date())) button.classList.add("font-bold", "text-indigo-700");
    if (selectedDate === dateValue) button.classList.add("border-indigo-400", "bg-indigo-50");
    const dayNumber = document.createElement("span");
    dayNumber.textContent = String(date.getDate());
    button.append(dayNumber);
    if (dayTodos.length > 0) {
      const count = document.createElement("span");
      count.className = "block text-[10px] leading-3 text-indigo-600";
      count.textContent = `${dayTodos.filter((todo) => !todo.completed).length}/${dayTodos.length}`;
      button.append(count);
    }
    button.addEventListener("click", () => {
      selectedDate = selectedDate === dateValue ? "" : dateValue;
      displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      render();
    });
    calendarGrid.append(button);
  }

  calendarSelection.textContent = selectedDate ? `${formatReadableDate(selectedDate)} 마감 할 일만 표시 중` : "날짜를 선택하면 해당 날짜의 할 일만 표시합니다.";
  clearDateFilterButton.disabled = !selectedDate;
  clearDateFilterButton.classList.toggle("opacity-50", clearDateFilterButton.disabled);
}

function renderCategoryOptions() {
  const previousValue = categoryFilter.value;
  const categories = [...new Set(todos.map((todo) => todo.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  categoryFilter.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "모든 카테고리";
  categoryFilter.append(allOption);
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });
  categoryFilter.value = categories.includes(previousValue) ? previousValue : "";
}

function render() {
  updateProgress();
  renderCalendar();
  renderCategoryOptions();
  todoList.replaceChildren();

  const visibleTodos = getVisibleTodos();
  visibleTodos.forEach((todo) => todoList.append(createTodoElement(todo)));
  emptyState.textContent = "";
  if (todos.length === 0) {
    emptyState.textContent = EMPTY_LIST_MESSAGE;
    emptyState.classList.remove("hidden");
  } else if (visibleTodos.length === 0) {
    emptyState.textContent = EMPTY_FILTER_MESSAGE;
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });
  clearCompletedButton.disabled = !todos.some((todo) => todo.completed);
  clearCompletedButton.classList.toggle("cursor-not-allowed", clearCompletedButton.disabled);
  clearCompletedButton.classList.toggle("opacity-50", clearCompletedButton.disabled);
  updateReminderControls();
}

function checkReminders() {
  if (!remindersEnabled || !("Notification" in window) || window.Notification.permission !== "granted") {
    return;
  }
  const now = new Date();
  const today = formatDate(now);
  if (now.getHours() < 9) return;

  todos.forEach((todo) => {
    const key = `${todo.id}:${today}`;
    if (todo.completed || !todo.remind || todo.dueDate !== today || todo.reminderSentOn === today || attemptedReminders.has(key)) {
      return;
    }
    attemptedReminders.add(key);
    try {
      new window.Notification("오늘 마감 할 일", { body: todo.text });
      todo.reminderSentOn = today;
      saveTodos();
    } catch {
      reminderStatus.textContent = "브라우저 알림을 표시하지 못했습니다. 알림 권한과 브라우저 설정을 확인해주세요.";
    }
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    inputError.textContent = "할 일 내용을 입력해주세요.";
    input.focus();
    return;
  }
  const dueDate = dueDateInput.value;
  if (remindInput.checked && !dueDate) {
    inputError.textContent = "알림을 설정하려면 마감일을 선택해주세요.";
    dueDateInput.focus();
    return;
  }

  inputError.textContent = "";
  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  todos = [
    ...todos,
    {
      id,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate,
      priority: priorityInput.value,
      category: categoryInput.value.trim(),
      recurrence: recurrenceInput.value,
      remind: remindInput.checked,
      reminderSentOn: "",
      nextOccurrenceCreated: false,
    },
  ];
  saveTodos();
  input.value = "";
  dueDateInput.value = "";
  priorityInput.value = "normal";
  categoryInput.value = "";
  recurrenceInput.value = "none";
  remindInput.checked = false;
  render();
  input.focus();
});

input.addEventListener("input", () => {
  inputError.textContent = "";
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
});

document.querySelector("#calendar-prev").addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#calendar-next").addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});

document.querySelector("#calendar-today").addEventListener("click", () => {
  const today = new Date();
  displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedDate = "";
  render();
});

clearDateFilterButton.addEventListener("click", () => {
  selectedDate = "";
  render();
});

reminderToggle.addEventListener("click", async () => {
  if (remindersEnabled) {
    saveReminderSetting(false);
    return;
  }
  if (!("Notification" in window)) {
    reminderStatus.textContent = "이 브라우저는 알림 기능을 지원하지 않습니다.";
    return;
  }
  try {
    const permission = window.Notification.permission === "default"
      ? await window.Notification.requestPermission()
      : window.Notification.permission;
    if (permission !== "granted") {
      reminderStatus.textContent = "알림 권한이 허용되지 않았습니다. 브라우저 설정에서 권한을 변경해주세요.";
      return;
    }
    if (saveReminderSetting(true)) {
      checkReminders();
    }
  } catch {
    reminderStatus.textContent = "알림 권한을 요청하지 못했습니다. 브라우저 설정을 확인해주세요.";
  }
});

todos = loadTodos();
loadReminderSetting();
render();
checkReminders();
window.setInterval(checkReminders, 30_000);
