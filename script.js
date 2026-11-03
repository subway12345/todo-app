// ---------- 1. Page elements ----------
const greetingEl = document.getElementById("greeting");
const taskCountEl = document.getElementById("task-count");
const onHoldListEl = document.getElementById("on-hold-list");
const completedListEl = document.getElementById("completed-list");
const onHoldCountEl = document.getElementById("on-hold-count");
const completedCountEl = document.getElementById("completed-count");
const totalCountEl = document.getElementById("total-count");
const sidebarCompletedEl = document.getElementById("sidebar-completed");
const pendingCountEl = document.getElementById("pending-count");
const completionRateEl = document.getElementById("completion-rate");
const completionBarEl = document.getElementById("completion-bar");

// ---------- 2. State ----------
const STORAGE_KEY = "todoTasks";
let tasks = [];
let editingId = null;   // null means "adding", otherwise the id of the task being edited
let searchTerm = "";    // the current search text, in lowercase

// Labels and colors for status and priority
const STATUS_STYLES = {
  pending:   { label: "Pending",     cls: "bg-yellow-100 text-yellow-700" },
  progress:  { label: "In Progress", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed",   cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled",   cls: "bg-red-100 text-red-700" }
};

const PRIORITY_STYLES = {
  minor:    { label: "Minor",    cls: "text-green-600" },
  normal:   { label: "Normal",   cls: "text-yellow-600" },
  critical: { label: "Critical", cls: "text-red-600" }
};

// ---------- 3. Starter tasks (used only on the first visit) ----------
function starterTasks() {
  return [
    { id: 1, title: "Cooking stew", status: "progress", priority: "normal", completed: false },
    { id: 2, title: "Reply to emails", status: "pending", priority: "minor", completed: false },
    { id: 3, title: "Submit project", status: "completed", priority: "critical", completed: true }
  ];
}

// ---------- 4. Load and save ----------
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    tasks = saved ? JSON.parse(saved) : starterTasks();
  } catch (error) {
    tasks = starterTasks();   // corrupt data: start fresh
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ---------- 5. Greeting that changes with the time ----------
function updateGreeting() {
  const hour = new Date().getHours();
  let greet = "Good morning";

  if (hour >= 12 && hour < 18) {
    greet = "Good afternoon";
  } else if (hour >= 18) {
    greet = "Good evening";
  }

  greetingEl.textContent = `${greet}, Kazeem`;
}

// ---------- 6. Build one task card ----------
function createBadge(text, cls) {
  const span = document.createElement("span");
  span.className = `px-3 py-1 text-xs font-semibold rounded-full ${cls}`;
  span.textContent = text;
  return span;
}

function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = "flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm";

  // Checkbox (click handler added in the next step)
  const checkbox = document.createElement("button");
  checkbox.className = task.completed
    ? "w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 text-white flex-shrink-0 flex items-center justify-center"
    : "w-6 h-6 rounded-full border-2 border-pink-500 flex-shrink-0";
  if (task.completed) {
    checkbox.innerHTML = '<i class="fa-solid fa-check text-xs"></i>';
  }
  checkbox.dataset.id = task.id;

  // Title and badges
  const body = document.createElement("div");
  body.className = "flex-1 min-w-0";

  const title = document.createElement("p");
  title.className = task.completed
    ? "font-semibold text-gray-400 line-through truncate"
    : "font-semibold text-gray-800 truncate";
  title.textContent = task.title;    // textContent keeps user input safe

  const meta = document.createElement("div");
  meta.className = "flex flex-wrap items-center gap-2 mt-2";

  const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal;

  meta.appendChild(createBadge(statusStyle.label, statusStyle.cls));
  const priorityText = document.createElement("span");
  priorityText.className = `text-xs font-semibold ${priorityStyle.cls}`;
  priorityText.textContent = priorityStyle.label;
  meta.appendChild(priorityText);

  body.appendChild(title);
  body.appendChild(meta);

  // Edit and delete buttons (click handlers added in the next step)
  const actions = document.createElement("div");
  actions.className = "flex items-center gap-2";

  const editBtn = document.createElement("button");
  editBtn.className = "w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition";
  editBtn.innerHTML = '<i class="fa-solid fa-pen text-sm"></i>';
  editBtn.dataset.id = task.id;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition";
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash text-sm"></i>';
  deleteBtn.dataset.id = task.id;

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(checkbox);
  card.appendChild(body);
  card.appendChild(actions);

  return card;
}

function createEmptyMessage(text) {
  const p = document.createElement("p");
  p.className = "text-gray-400 text-center py-6 bg-gray-50 rounded-2xl";
  p.textContent = text;
  return p;
}

// ---------- 7. Update the header and sidebar numbers ----------
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  taskCountEl.textContent = total;
  onHoldCountEl.textContent = pending;
  completedCountEl.textContent = completed;
  totalCountEl.textContent = total;
  sidebarCompletedEl.textContent = completed;
  pendingCountEl.textContent = pending;
  completionRateEl.textContent = `${rate}%`;
  completionBarEl.style.width = `${rate}%`;
}

// ---------- 8. Draw both sections ----------
function renderTasks() {
    const visible = getVisibleTasks();
  const onHold = visible.filter(t => !t.completed);
  const done = visible.filter(t => t.completed);

  onHoldListEl.innerHTML = "";
  completedListEl.innerHTML = "";

  if (onHold.length === 0) {
    onHoldListEl.appendChild(createEmptyMessage("No tasks on hold. Nice work!"));
  } else {
    onHold.forEach(task => onHoldListEl.appendChild(createTaskCard(task)));
  }

  if (done.length === 0) {
    completedListEl.appendChild(createEmptyMessage("No completed tasks yet."));
  } else {
    done.forEach(task => completedListEl.appendChild(createTaskCard(task)));
  }

  updateStats();
}

// ---------- 9. Start the app ----------
loadTasks();
updateGreeting();
renderTasks();
// ---------- 10. Toggle complete ----------
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  task.status = task.completed ? "completed" : "pending";

  saveTasks();
  renderTasks();
}

// ---------- 11. Delete with confirmation ----------
function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  tasks = tasks.filter(t => t.id !== id);

  saveTasks();
  renderTasks();
}

// ---------- 12. Open and close the modal ----------
const modal = document.getElementById("task-modal");
const modalTitle = document.getElementById("modal-title");
const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const statusInput = document.getElementById("task-status");
const priorityInput = document.getElementById("task-priority");
const titleError = document.getElementById("title-error");

function openModal(id = null) {
    titleError.classList.add("hidden");   // clear any old error message
  editingId = id;

  if (id === null) {
    modalTitle.textContent = "Add Task";
    taskForm.reset();
  } else {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    modalTitle.textContent = "Edit Task";
    titleInput.value = task.title;
    statusInput.value = task.status;
    priorityInput.value = task.priority;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  titleInput.focus();
}

function closeModal() {
    titleError.classList.add("hidden");   // clear any old error message
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  taskForm.reset();
  editingId = null;
}

// ---------- 13. Save from the form (add or edit) ----------
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
    if (title === "") {
    titleError.textContent = "Please enter a task title. Spaces alone are not enough.";
    titleError.classList.remove("hidden");
    titleInput.focus();
    return;
  }

  if (editingId === null) {
    // Adding: create a new task with a unique id
    tasks.push({
      id: Date.now(),
      title: title,
      status: statusInput.value,
      priority: priorityInput.value,
      completed: statusInput.value === "completed"
    });
  } else {
    // Editing: update the existing task
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.title = title;
      task.status = statusInput.value;
      task.priority = priorityInput.value;
      task.completed = statusInput.value === "completed";
    }
  }

  saveTasks();
  renderTasks();
  closeModal();
});

// ---------- 14. Button wiring ----------
document.getElementById("add-task-btn").addEventListener("click", () => openModal(null));
document.getElementById("cancel-btn").addEventListener("click", closeModal);

// Event delegation: one listener handles every task button, including new ones
document.addEventListener("click", function (event) {
  const checkbox = event.target.closest("button[data-id]");
  if (!checkbox) return;

  const id = Number(checkbox.dataset.id);
  const isEdit = checkbox.querySelector(".fa-pen");
  const isDelete = checkbox.querySelector(".fa-trash");

  if (isEdit) {
    openModal(id);
  } else if (isDelete) {
    deleteTask(id);
  } else {
    toggleTask(id);
  }
});
// ---------- 16. Close the modal with Escape or a click outside it ----------
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

modal.addEventListener("click", function (event) {
  if (event.target === modal) closeModal();
});
// ---------- 17. Search ----------
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchError = document.getElementById("search-error");

// Returns the tasks that match the search, or all tasks if the search is empty
function getVisibleTasks() {
  if (searchTerm === "") return tasks;
  return tasks.filter(t => t.title.toLowerCase().includes(searchTerm));
}

function showSearchError(message) {
  searchError.textContent = message;
  searchError.classList.remove("hidden");
}

function clearSearchError() {
  searchError.classList.add("hidden");
}

// As the user types, filter the list live
searchInput.addEventListener("input", function () {
  const typed = searchInput.value.trim();
  searchTerm = typed.toLowerCase();
  clearSearchError();

  if (searchTerm !== "" && getVisibleTasks().length === 0) {
    showSearchError(`No task matches "${typed}".`);
  }

  renderTasks();
});

// When the user presses Enter, check that the box is filled and a match exists
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const typed = searchInput.value.trim();

  if (typed === "") {
    searchTerm = "";
    showSearchError("Please type a task name to search.");
    searchInput.focus();
    renderTasks();
    return;
  }

  searchTerm = typed.toLowerCase();

  if (getVisibleTasks().length === 0) {
    showSearchError(`No task matches "${typed}".`);
  } else {
    clearSearchError();
  }

  renderTasks();
});