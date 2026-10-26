const STORAGE_KEY = "daily-todo-list-v1";
const STATUSES = ["pending", "active", "completed"];
const FILTERS = ["all", "completed", "active", "pending"];
const STATUS_LABELS = {
  pending: "대기",
  active: "진행 중",
  completed: "완료",
};

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const createdDateInput = document.querySelector("#created-date");
const dateInput = document.querySelector("#todo-date");
const categorySelect = document.querySelector("#todo-category");
const categoryForm = document.querySelector("#category-form");
const categoryInput = document.querySelector("#category-input");
const categoryList = document.querySelector("#category-list");
const categoryMessage = document.querySelector("#category-message");
const formMessage = document.querySelector("#form-message");
const todoList = document.querySelector("#todo-list");
const filterTabs = document.querySelector("#filter-tabs");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const progressContainer = document.querySelector('[role="progressbar"]');
const remainingCount = document.querySelector("#remaining-count");
const dateSearchLabel = document.querySelector("#date-search-label");
const calendarClearButton = document.querySelector("#calendar-clear");
const calendarDrawer = document.querySelector("#calendar-drawer");
const calendarBackdrop = document.querySelector("#calendar-backdrop");
const largeCalendarMonthLabel = document.querySelector("#large-calendar-month");
const largeDateCalendar = document.querySelector("#large-date-calendar");
const confettiStage = document.querySelector("#confetti-stage");
const today = formatTimestampDate(Date.now());

let todos = [];
let categories = [];
let currentFilter = "all";
let selectedDate = null;
let calendarMonth = new Date(`${today}T12:00:00`);
calendarMonth.setDate(1);

function isTodo(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    (typeof value.id === "string" || typeof value.id === "number") &&
    typeof value.text === "string" &&
    STATUSES.includes(value.status) &&
    typeof value.createdAt === "number" &&
    (value.dueDate === undefined || value.dueDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(value.dueDate)) &&
    (value.category === undefined || value.category === null || typeof value.category === "string")
  );
}

function renderCategories() {
  const selectedCategory = categorySelect.value;
  const options = [new Option("카테고리 없음", ""), ...categories.map((category) => new Option(category, category))];
  categorySelect.replaceChildren(...options);
  categorySelect.value = categories.includes(selectedCategory) ? selectedCategory : "";

  const chips = categories.map((category) => {
    const chip = document.createElement("span");
    chip.className = "category-chip";

    const name = document.createElement("span");
    name.textContent = category;

    const deleteButton = createButton(
      "×",
      "category-delete",
      () => deleteCategory(category),
      `${category} 카테고리 삭제`
    );
    chip.append(name, deleteButton);
    return chip;
  });
  if (chips.length === 0) {
    const hint = document.createElement("span");
    hint.className = "text-xs text-slate-400";
    hint.textContent = "추가한 카테고리가 여기에 표시됩니다.";
    chips.push(hint);
  }
  categoryList.replaceChildren(...chips);
}

function addCategory(name) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    categoryMessage.textContent = "카테고리 이름을 입력해 주세요.";
    categoryMessage.classList.remove("hidden");
    categoryInput.focus();
    return;
  }
  if (categories.some((category) => category.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
    categoryMessage.textContent = "이미 등록된 카테고리입니다.";
    categoryMessage.classList.remove("hidden");
    categoryInput.focus();
    return;
  }

  categories.push(normalizedName);
  categoryInput.value = "";
  categoryMessage.textContent = "";
  categoryMessage.classList.add("hidden");
  categorySelect.value = normalizedName;
  renderCategories();
  saveState();
}

function deleteCategory(category) {
  const assignedCount = todos.filter((todo) => todo.category === category).length;
  const assignmentMessage =
    assignedCount > 0 ? `\n이 카테고리를 사용하는 할 일 ${assignedCount}개의 카테고리도 해제됩니다.` : "";
  if (!window.confirm(`"${category}" 카테고리를 삭제할까요?${assignmentMessage}`)) return;

  categories = categories.filter((item) => item !== category);
  todos.forEach((todo) => {
    if (todo.category === category) todo.category = null;
  });
  renderCategories();
  saveState();
  render();
}

function renderCategoryBadge(category) {
  const badge = document.createElement("span");
  badge.className = "rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600";
  badge.textContent = category;
  return badge;
}

function celebrateCompletion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#818cf8", "#e879f9"];
  const pieces = [];
  for (let index = 0; index < 140; index += 1) {
    const piece = document.createElement("span");
    const isRound = Math.random() < 0.2;
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--piece-width", `${5 + Math.random() * 7}px`);
    piece.style.setProperty("--piece-height", `${8 + Math.random() * 10}px`);
    piece.style.setProperty("--piece-radius", isRound ? "50%" : "2px");
    piece.style.setProperty("--piece-color", colors[Math.floor(Math.random() * colors.length)]);
    piece.style.setProperty("--fall-duration", `${2.8 + Math.random() * 1.8}s`);
    piece.style.setProperty("--fall-delay", `${Math.random() * 0.35}s`);
    piece.style.setProperty("--fall-drift", `${Math.random() * 240 - 120}px`);
    piece.style.setProperty("--fall-rotation", `${Math.random() * 1440 - 720}deg`);
    pieces.push(piece);
  }

  confettiStage.replaceChildren(...pieces);
  let finishedPieces = 0;
  pieces.forEach((piece) => {
    piece.addEventListener("animationend", () => {
      finishedPieces += 1;
      if (finishedPieces === pieces.length) confettiStage.replaceChildren();
    });
  });
}

function loadState() {
  const storedValue = localStorage.getItem(STORAGE_KEY);
  if (storedValue === null) return;

  const state = JSON.parse(storedValue);
  if (
    state === null ||
    typeof state !== "object" ||
    !Array.isArray(state.todos) ||
    !state.todos.every(isTodo) ||
    (state.categories !== undefined &&
      (!Array.isArray(state.categories) ||
        !state.categories.every((category) => typeof category === "string" && category.trim() === category))) ||
    !FILTERS.includes(state.filter) ||
    (state.calendarDate !== undefined &&
      state.calendarDate !== null &&
      !isDateString(state.calendarDate))
  ) {
    throw new Error("저장된 할 일 데이터의 형식이 올바르지 않습니다.");
  }

  todos = state.todos;
  categories = state.categories || [];
  todos.forEach((todo) => {
    if (todo.category && !categories.includes(todo.category)) todo.category = null;
  });
  currentFilter = state.filter;
  selectedDate = state.calendarDate || null;
  if (selectedDate) {
    calendarMonth = new Date(`${selectedDate}T12:00:00`);
    calendarMonth.setDate(1);
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ todos, categories, filter: currentFilter, calendarDate: selectedDate })
    );
  } catch (error) {
    console.error("할 일 목록을 저장하지 못했습니다.", error);
    formMessage.textContent = "저장 공간에 접근할 수 없어 변경 사항을 저장하지 못했습니다.";
    formMessage.classList.remove("hidden");
  }
}

function createButton(label, className, onClick, title = label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.addEventListener("click", onClick);
  return button;
}

function getFilteredTodos() {
  return todos.filter((todo) => {
    const matchesStatus =
      currentFilter === "all" ||
      (currentFilter === "active" ? todo.status !== "completed" : todo.status === currentFilter);
    const matchesDate =
      selectedDate === null ||
      formatTimestampDate(todo.createdAt) === selectedDate ||
      todo.dueDate === selectedDate;
    return matchesStatus && matchesDate;
  });
}

function updateProgress() {
  const completedCount = todos.filter((todo) => todo.status === "completed").length;
  const percentage = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  progressLabel.textContent = `${completedCount}/${todos.length} 완료`;
  progressBar.style.width = `${percentage}%`;
  progressContainer.setAttribute("aria-valuenow", String(percentage));
  remainingCount.textContent = `남은 할 일 ${todos.length - completedCount}개`;
}

function renderFilters() {
  filterTabs.querySelectorAll("[data-filter]").forEach((tab) => {
    const selected = tab.dataset.filter === currentFilter;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

function isDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return formatTimestampDate(date.getTime()) === value;
}

function formatDateParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(calendarMonth);
  largeCalendarMonthLabel.textContent = monthLabel;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  renderLargeCalendar(year, month, firstWeekday, daysInMonth, weekdays);
}

function renderDateSearchLabel() {
  dateSearchLabel.textContent = selectedDate
    ? `${formatDate(selectedDate)} 날짜의 등록·마감 일정`
    : "날짜를 선택해 등록일 또는 마감일로 검색하세요.";
  calendarClearButton.classList.toggle("hidden", selectedDate === null);
}

function renderLargeCalendar(year, month, firstWeekday, daysInMonth, weekdays) {
  const cells = weekdays.map((weekday) => {
    const label = document.createElement("div");
    label.className = "large-calendar-weekday";
    label.textContent = weekday;
    return label;
  });

  for (let index = 0; index < firstWeekday; index += 1) {
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    cells.push(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = formatDateParts(year, month + 1, day);
    const dayEvents = [];
    todos.forEach((todo) => {
      if (formatTimestampDate(todo.createdAt) === dateValue) {
        dayEvents.push({ todo, type: "created" });
      }
      if (todo.dueDate === dateValue) {
        dayEvents.push({ todo, type: "due" });
      }
    });
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `large-calendar-day ${dateValue === selectedDate ? "is-selected" : ""} ${dateValue === today ? "is-today" : ""}`;
    cell.dataset.largeCalendarDate = dateValue;
    cell.setAttribute("aria-label", `${formatDate(dateValue)}, 일정 ${dayEvents.length}개`);

    const dayNumber = document.createElement("span");
    dayNumber.className = "large-calendar-day-number text-xs font-semibold text-slate-700";
    dayNumber.textContent = String(day);
    cell.append(dayNumber);

    dayEvents.slice(0, 3).forEach(({ todo, type }) => {
      const event = document.createElement("span");
      event.className = `calendar-event ${type === "due" ? "calendar-event-due" : "calendar-event-created"}`;
      event.textContent = `${type === "due" ? "마감" : "등록"} · ${todo.text}`;
      cell.append(event);
    });
    if (dayEvents.length > 3) {
      const more = document.createElement("span");
      more.className = "mt-1 block text-[9px] text-slate-400";
      more.textContent = `+${dayEvents.length - 3}개 더`;
      cell.append(more);
    }
    cells.push(cell);
  }
  largeDateCalendar.replaceChildren(...cells);
}

function setCalendarDrawerOpen(isOpen) {
  calendarDrawer.classList.toggle("is-open", isOpen);
  calendarBackdrop.classList.toggle("is-open", isOpen);
  calendarDrawer.setAttribute("aria-hidden", String(!isOpen));
  document.querySelector("#calendar-expand").setAttribute("aria-expanded", String(isOpen));
  if (isOpen) document.querySelector("#calendar-close").focus();
}

function selectCalendarDate(dateValue) {
  selectedDate = dateValue;
  createdDateInput.value = dateValue;
  calendarMonth = new Date(`${dateValue}T12:00:00`);
  calendarMonth.setDate(1);
  saveState();
  render();
  setCalendarDrawerOpen(false);
}

function showAllDates() {
  selectedDate = null;
  saveState();
  render();
  setCalendarDrawerOpen(false);
}

function renderEmptyState(message) {
  const emptyState = document.createElement("div");
  emptyState.className = "flex min-h-72 flex-col items-center justify-center px-4 text-center";

  const icon = document.createElement("div");
  icon.className = "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-500";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✓";

  const text = document.createElement("p");
  text.className = "text-sm leading-6 text-slate-500";
  text.textContent = message;
  emptyState.append(icon, text);
  todoList.replaceChildren(emptyState);
}

function renderTodo(todo) {
  const item = document.createElement("article");
  item.className = "flex min-h-[4.5rem] items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 sm:gap-4";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.status === "completed";
  checkbox.className = "h-5 w-5 shrink-0 cursor-pointer accent-indigo-600";
  checkbox.setAttribute("aria-label", `${todo.text} 완료`);
  checkbox.addEventListener("change", () => {
    todo.status = checkbox.checked ? "completed" : "pending";
    if (checkbox.checked) celebrateCompletion();
    saveState();
    render();
  });

  const content = document.createElement("div");
  content.className = "flex min-w-0 flex-1 flex-col items-start gap-1";

  const text = document.createElement("p");
  text.className = `todo-text min-w-0 flex-1 text-sm leading-6 ${todo.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`;
  text.textContent = todo.text;
  content.append(text);

  const dates = document.createElement("div");
  dates.className = "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400";

  const createdDate = document.createElement("time");
  const createdDateValue = formatTimestampDate(todo.createdAt);
  createdDate.dateTime = createdDateValue;
  createdDate.textContent = `등록일 ${formatDate(createdDateValue)}`;
  dates.append(createdDate);

  if (todo.dueDate) {
    const dueDate = document.createElement("time");
    dueDate.dateTime = todo.dueDate;
    dueDate.textContent = `마감일 ${formatDate(todo.dueDate)}`;
    dates.append(dueDate);
  } else {
    const noDueDate = document.createElement("span");
    noDueDate.textContent = "마감일 미정";
    dates.append(noDueDate);
  }
  content.append(dates);
  if (todo.category) content.append(renderCategoryBadge(todo.category));

  const statusButton = createButton(
    STATUS_LABELS[todo.status],
    `min-h-10 shrink-0 rounded-lg px-2.5 text-xs font-semibold transition sm:px-3 ${
      todo.status === "completed"
        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        : todo.status === "active"
          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`,
    () => {
      const nextStatus = STATUSES[(STATUSES.indexOf(todo.status) + 1) % STATUSES.length];
      todo.status = nextStatus;
      if (nextStatus === "completed") celebrateCompletion();
      saveState();
      render();
    },
    `상태 변경: ${STATUS_LABELS[todo.status]}`
  );
  statusButton.classList.add("status-button");

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-1";
  actions.append(
    createButton("수정", "min-h-10 rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:px-3", () => beginEditing(todo), `${todo.text} 수정`),
    createButton("삭제", "min-h-10 rounded-lg px-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 sm:px-3", () => deleteTodo(todo), `${todo.text} 삭제`)
  );

  item.append(checkbox, content, statusButton, actions);
  return item;
}

function beginEditing(todo) {
  const item = [...todoList.children].find((element) => element.dataset.todoId === String(todo.id));
  if (!item) return;

  const editor = document.createElement("form");
  editor.className = "flex min-w-0 flex-1 flex-wrap items-center gap-2";

  const editInput = document.createElement("input");
  editInput.className = "edit-input text-sm";
  editInput.type = "text";
  editInput.maxLength = 1000;
  editInput.value = todo.text;
  editInput.setAttribute("aria-label", "할 일 내용 수정");

  const editDate = document.createElement("input");
  editDate.className = "edit-date min-h-10 rounded-lg border border-slate-200 px-2 text-xs text-slate-600";
  editDate.type = "date";
  editDate.value = todo.dueDate || "";
  editDate.setAttribute("aria-label", "마감 날짜 수정");

  const editCategory = document.createElement("select");
  editCategory.className = "min-h-10 max-w-full rounded-lg border border-slate-200 px-2 text-xs text-slate-600";
  editCategory.setAttribute("aria-label", "카테고리 수정");
  editCategory.append(new Option("카테고리 없음", ""));
  categories.forEach((category) => editCategory.append(new Option(category, category)));
  editCategory.value = todo.category || "";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "min-h-10 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700";
  saveButton.textContent = "저장";

  const cancelButton = createButton(
    "취소",
    "min-h-10 shrink-0 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 sm:px-3",
    render
  );
  editor.append(editInput, editDate, editCategory, saveButton, cancelButton);
  item.replaceChild(editor, item.children[1]);

  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    const updatedText = editInput.value.trim();
    if (!updatedText) {
      editInput.setCustomValidity("할 일 내용을 입력해 주세요.");
      editInput.reportValidity();
      return;
    }
    todo.text = updatedText;
    todo.dueDate = editDate.value;
    todo.category = editCategory.value || null;
    saveState();
    render();
  });

  editInput.addEventListener("input", () => editInput.setCustomValidity(""));
  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") render();
  });
  editInput.focus();
  editInput.select();
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-");
  return `${year}.${month}.${day}`;
}

function formatTimestampDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function deleteTodo(todo) {
  if (!window.confirm(`"${todo.text}" 할 일을 삭제할까요?`)) return;
  todos = todos.filter((item) => item.id !== todo.id);
  saveState();
  render();
}

function render() {
  updateProgress();
  renderFilters();
  renderCalendar();
  renderDateSearchLabel();
  renderCategories();

  if (todos.length === 0 && selectedDate === null) {
    renderEmptyState("등록된 할 일이 없습니다. 오늘 할 일을 추가해 보세요!");
    return;
  }

  const visibleTodos = getFilteredTodos();
  if (visibleTodos.length === 0) {
    renderEmptyState(selectedDate ? "해당 날짜에 기록이 없습니다." : "해당하는 할 일이 없습니다.");
    return;
  }

  const items = visibleTodos.map((todo) => {
    const item = renderTodo(todo);
    item.dataset.todoId = String(todo.id);
    return item;
  });
  todoList.replaceChildren(...items);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    formMessage.textContent = "할 일 내용을 입력해 주세요.";
    formMessage.classList.remove("hidden");
    input.focus();
    return;
  }

  formMessage.textContent = "";
  formMessage.classList.add("hidden");
  todos.push({
    id: crypto.randomUUID(),
    text,
    status: "pending",
    createdAt: new Date(`${createdDateInput.value}T${new Date().toTimeString().slice(0, 8)}`).getTime(),
    dueDate: dateInput.value,
    category: categorySelect.value || null,
  });
  input.value = "";
  dateInput.value = "";
  categorySelect.value = "";
  selectedDate = createdDateInput.value;
  saveState();
  render();
  input.focus();
});

input.addEventListener("input", () => {
  formMessage.textContent = "";
  formMessage.classList.add("hidden");
});

categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addCategory(categoryInput.value);
});

categoryInput.addEventListener("input", () => {
  categoryMessage.textContent = "";
  categoryMessage.classList.add("hidden");
});

createdDateInput.addEventListener("change", () => {
  if (!isDateString(createdDateInput.value)) return;
  calendarMonth = new Date(`${createdDateInput.value}T12:00:00`);
  calendarMonth.setDate(1);
  selectCalendarDate(createdDateInput.value);
});

document.querySelector("#large-calendar-previous").addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
});

document.querySelector("#large-calendar-next").addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
});

document.querySelector("#large-calendar-today").addEventListener("click", () => {
  calendarMonth = new Date(`${today}T12:00:00`);
  calendarMonth.setDate(1);
  selectCalendarDate(today);
});

document.querySelector("#calendar-expand").addEventListener("click", () => setCalendarDrawerOpen(true));
document.querySelector("#calendar-close").addEventListener("click", () => setCalendarDrawerOpen(false));
calendarBackdrop.addEventListener("click", () => setCalendarDrawerOpen(false));
calendarClearButton.addEventListener("click", showAllDates);
document.querySelector("#large-calendar-all").addEventListener("click", showAllDates);
largeDateCalendar.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-large-calendar-date]");
  if (!dayButton) return;
  selectCalendarDate(dayButton.dataset.largeCalendarDate);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && calendarDrawer.classList.contains("is-open")) {
    setCalendarDrawerOpen(false);
  }
});

filterTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-filter]");
  if (!tab || !FILTERS.includes(tab.dataset.filter)) return;
  currentFilter = tab.dataset.filter;
  saveState();
  render();
  createdDateInput.value = selectedDate || today;
});

filterTabs.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const tabs = [...filterTabs.querySelectorAll("[data-filter]")];
  const currentIndex = tabs.findIndex((tab) => tab.dataset.filter === currentFilter);
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
  nextTab.focus();
  nextTab.click();
  event.preventDefault();
});

try {
  loadState();
} catch (error) {
  console.error("저장된 할 일 목록을 불러오지 못했습니다.", error);
  formMessage.textContent = "저장된 데이터를 불러오지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.";
  formMessage.classList.remove("hidden");
}

render();
