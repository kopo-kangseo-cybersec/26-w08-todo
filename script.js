const STORAGE_KEY = 'todos';

// DOM 요소 선택
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const currentDateEl = document.getElementById('current-date');

// 앱 상태 관리
let todos = loadTodos();
let currentFilter = 'all';

function loadTodos() {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (savedTodos === null) {
        return [];
    }

    try {
        const parsedTodos = JSON.parse(savedTodos);
        if (!Array.isArray(parsedTodos) || !parsedTodos.every(isTodo)) {
            throw new Error('저장된 할 일 데이터 형식이 올바르지 않습니다.');
        }
        return parsedTodos;
    } catch (error) {
        console.error('저장된 할 일을 불러오지 못했습니다.', error);
        alert('저장된 할 일 데이터를 불러오지 못했습니다.');
        return [];
    }
}

function isTodo(value) {
    return value !== null
        && typeof value === 'object'
        && Number.isFinite(value.id)
        && typeof value.text === 'string'
        && typeof value.completed === 'boolean';
}

// 오늘 날짜 표시
function displayDate() {
    const today = new Date();
    currentDateEl.textContent = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    }).format(today);
}

// 로컬 스토리지에 저장
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
        console.error('할 일을 저장하지 못했습니다.', error);
        alert('할 일을 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.');
    }
}

// 할 일 추가 함수
function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
        alert('할 일을 입력해주세요!');
        return;
    }

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };

    while (todos.some(todo => todo.id === newTodo.id)) {
        newTodo.id += 1;
    }

    todos.push(newTodo);
    saveTodos();
    renderTodos(newTodo.id);
    todoInput.value = '';
    todoInput.focus();
}

// 할 일 완료 상태 토글
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    saveTodos();
    renderTodos();
}

// 개별 할 일 삭제
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// 완료된 항목 전체 삭제
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
}

// 화면에 렌더링
function renderTodos(animateTodoId = null) {
    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') {
            return !todo.completed;
        }
        if (currentFilter === 'completed') {
            return todo.completed;
        }
        return true;
    });
    todoList.replaceChildren();

    if (filteredTodos.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'empty-state py-5 text-center text-slate-400';
        emptyState.textContent = '할 일이 없습니다.';
        todoList.appendChild(emptyState);
    } else {
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item mb-2.5 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 transition hover:border-slate-300 ${todo.id === animateTodoId ? 'todo-item--entering' : ''}`;

            const todoLeft = document.createElement('div');
            todoLeft.className = 'flex min-w-0 flex-1 items-center gap-3';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.className = 'h-[18px] w-[18px] shrink-0 cursor-pointer accent-indigo-600';
            checkbox.setAttribute('aria-label', `완료: ${todo.text}`);
            checkbox.addEventListener('change', () => toggleTodo(todo.id));

            const todoText = document.createElement('span');
            todoText.className = `todo-text min-w-0 break-all text-[15px] ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`;
            todoText.innerHTML = escapeHtml(todo.text);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn shrink-0 rounded p-1 text-slate-400 transition hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-200';
            deleteButton.type = 'button';
            deleteButton.setAttribute('aria-label', `삭제: ${todo.text}`);
            deleteButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
            deleteButton.addEventListener('click', () => deleteTodo(todo.id));

            todoLeft.append(checkbox, todoText);
            li.append(todoLeft, deleteButton);
            todoList.appendChild(li);
        });
    }

    // 남은 할 일 개수 업데이트
    const activeCount = todos.filter(todo => !todo.completed).length;
    itemsLeft.textContent = `남은 할 일: ${activeCount}개`;
}

// XSS 방지용 HTML Escape 유틸리티
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// 이벤트 리스너 등록
todoForm.addEventListener('submit', event => {
    event.preventDefault();
    addTodo();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// 필터 버튼 이벤트
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(filterBtn => {
            filterBtn.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
            filterBtn.classList.add('text-slate-500', 'hover:text-slate-800');
            filterBtn.setAttribute('aria-pressed', 'false');
        });
        btn.classList.remove('text-slate-500', 'hover:text-slate-800');
        btn.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
        btn.setAttribute('aria-pressed', 'true');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

// 초기 실행
displayDate();
renderTodos();