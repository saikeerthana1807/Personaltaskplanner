const authPanel = document.querySelector("#authPanel");
const appShell = document.querySelector("#appShell");
const authForm = document.querySelector("#authForm");
const authName = document.querySelector("#authName");
const authPassword = document.querySelector("#authPassword");
const passwordToggle = document.querySelector("#passwordToggle");
const passwordToggleIcon = document.querySelector("#passwordToggleIcon");
const authMessage = document.querySelector("#authMessage");
const authSubmit = document.querySelector("#authSubmit");
const loginTab = document.querySelector("#loginTab");
const signupTab = document.querySelector("#signupTab");
const resetTab = document.querySelector("#resetTab");
const signupFields = document.querySelector("#signupFields");
const fullName = document.querySelector("#fullName");
const gender = document.querySelector("#gender");
const phone = document.querySelector("#phone");
const passwordLabel = document.querySelector("#passwordLabel");
const logoutButton = document.querySelector("#logoutButton");
const profileIconButton = document.querySelector("#profileIconButton");
const profileInitial = document.querySelector("#profileInitial");
const profileDrawer = document.querySelector("#profileDrawer");
const profileDrawerBackdrop = document.querySelector("#profileDrawerBackdrop");
const profileDrawerClose = document.querySelector("#profileDrawerClose");
const drawerProfileName = document.querySelector("#drawerProfileName");
const drawerProfileEmail = document.querySelector("#drawerProfileEmail");
const drawerAvatar = document.querySelector("#drawerAvatar");
const currentUserName = document.querySelector("#currentUserName");
const profileMeta = document.querySelector("#profileMeta");
const profileForm = document.querySelector("#profileForm");
const profileFullName = document.querySelector("#profileFullName");
const profileGender = document.querySelector("#profileGender");
const profilePhone = document.querySelector("#profilePhone");
const profileEmail = document.querySelector("#profileEmail");
const taskForm = document.querySelector("#taskForm");
const taskTemplate = document.querySelector("#taskTemplate");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#searchInput");
const notifyButton = document.querySelector("#notifyButton");
const connectionStatus = document.querySelector("#connectionStatus");
const toast = document.querySelector("#toast");

const lists = {
  Pending: document.querySelector("#pendingList"),
  "In Progress": document.querySelector("#progressList"),
  Completed: document.querySelector("#completedList")
};

const counters = {
  total: document.querySelector("#totalCount"),
  pending: document.querySelector("#pendingCount"),
  progress: document.querySelector("#progressCount"),
  done: document.querySelector("#doneCount"),
  today: document.querySelector("#todayCount"),
  high: document.querySelector("#highCount"),
  pendingBadge: document.querySelector("#pendingBadge"),
  progressBadge: document.querySelector("#progressBadge"),
  doneBadge: document.querySelector("#doneBadge")
};

const usersKey = "my-task-planner-private-users-v2";
const sessionKey = "my-task-planner-private-session-v2";
const apiBaseUrl = (window.TASK_API_BASE_URL || "").replace(/\/$/, "");

let authMode = "login";
let currentUser = null;
let tasks = [];
let toastTimer;
let useLocalStorage = false;

async function apiRequest(path, options = {}) {
  const url = apiBaseUrl ? `${apiBaseUrl}${path}` : path;
  const headers = {
    "Content-Type": "application/json",
    ...(currentUser ? { "X-User-Id": currentUser.id } : {})
  };
  const response = await fetch(url, { headers, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    const requestError = new Error(error.error);
    requestError.status = response.status;
    throw requestError;
  }

  return response.json();
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function showAuthMessage(message, isSuccess = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("success", isSuccess);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(usersKey) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

function getPublicUser(user) {
  return {
    id: user.id,
    name: user.name || user.email,
    fullName: user.fullName || "",
    gender: user.gender || "",
    phone: user.phone || "",
    email: user.email || "",
    mode: user.mode || "local"
  };
}

function userTasksKey(userId) {
  return `my-task-planner-tasks-${userId}`;
}

function getSavedTasks() {
  if (!currentUser) {
    return [];
  }

  const saved = localStorage.getItem(userTasksKey(currentUser.id));
  return saved ? JSON.parse(saved) : [];
}

function saveLocalTasks() {
  localStorage.setItem(userTasksKey(currentUser.id), JSON.stringify(tasks));
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setConnectionStatus(label, mode) {
  connectionStatus.textContent = label;
  connectionStatus.className = `status-pill ${mode}`;
}

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  loginTab.classList.toggle("active", isLogin);
  signupTab.classList.toggle("active", isSignup);
  resetTab.classList.toggle("active", isReset);
  signupFields.hidden = !isSignup;
  fullName.closest("label").hidden = !isSignup;
  gender.closest("label").hidden = !isSignup;
  phone.closest("label").hidden = !isSignup;
  fullName.required = isSignup;
  phone.required = isSignup;
  authSubmit.textContent = isLogin ? "Login" : isSignup ? "Create Account" : "Reset Password";
  passwordLabel.textContent = isReset ? "New password" : "Password";
  authPassword.placeholder = isReset ? "Enter new password" : "Enter your password";
  authPassword.autocomplete = isLogin ? "current-password" : "new-password";
  showAuthMessage("");
}

function saveSession(user) {
  currentUser = user;
  localStorage.setItem(sessionKey, JSON.stringify(user));
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem(sessionKey);
}

function showApp() {
  document.body.classList.add("is-authenticated");
  authPanel.hidden = true;
  appShell.hidden = false;
  logoutButton.hidden = false;
  profileIconButton.hidden = false;
  renderProfile();
}

function showAuth() {
  document.body.classList.remove("is-authenticated");
  authPanel.hidden = false;
  appShell.hidden = true;
  logoutButton.hidden = true;
  profileIconButton.hidden = true;
  closeProfileDrawer();
  setConnectionStatus("Login required", "local");
}

function updateCounters() {
  const pending = tasks.filter((task) => task.status === "Pending").length;
  const progress = tasks.filter((task) => task.status === "In Progress").length;
  const done = tasks.filter((task) => task.status === "Completed").length;
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = tasks.filter((task) => task.status !== "Completed" && task.dueDate === today).length;
  const high = tasks.filter((task) => task.status !== "Completed" && task.priority === "High").length;

  counters.total.textContent = tasks.length;
  counters.pending.textContent = pending;
  counters.progress.textContent = progress;
  counters.done.textContent = done;
  counters.today.textContent = dueToday;
  counters.high.textContent = high;
  counters.pendingBadge.textContent = pending;
  counters.progressBadge.textContent = progress;
  counters.doneBadge.textContent = done;
}

function createEmptyState(status) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = status === "Completed"
    ? "Completed tasks will appear here."
    : `No ${status.toLowerCase()} tasks yet.`;
  return empty;
}

function renderTasks() {
  const selectedStatus = statusFilter.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  Object.entries(lists).forEach(([status, list]) => {
    const visibleTasks = tasks.filter((task) => {
      const matchesStatus = task.status === status;
      const searchableText = `${task.title} ${task.course} ${task.priority}`.toLowerCase();
      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
    const shouldShowColumn = selectedStatus === "All" || selectedStatus === status;

    list.closest(".task-column").hidden = !shouldShowColumn;
    list.replaceChildren();

    if (!visibleTasks.length) {
      list.append(createEmptyState(status));
      return;
    }

    visibleTasks.forEach((task) => {
      const node = taskTemplate.content.firstElementChild.cloneNode(true);
      const title = node.querySelector("h3");
      const priority = node.querySelector(".priority");
      const meta = node.querySelector(".meta");
      const created = node.querySelector(".created");
      const statusSelect = node.querySelector(".status-select");
      const deleteButton = node.querySelector(".delete-button");

      title.textContent = task.title;
      priority.textContent = task.priority;
      priority.classList.toggle("high", task.priority === "High");
      priority.classList.toggle("low", task.priority === "Low");
      meta.textContent = `${task.course} | Due ${formatDate(task.dueDate)}`;
      created.textContent = `Added ${formatDateTime(task.createdAt)} in ${task.status}`;
      statusSelect.value = task.status;

      statusSelect.addEventListener("change", async () => {
        await updateTask(task.id, statusSelect.value);
      });

      deleteButton.addEventListener("click", async () => {
        await deleteTask(task.id);
      });

      list.append(node);
    });
  });
}

function localSignup(emailAddress, password) {
  const users = getUsers();
  const normalizedEmail = emailAddress.toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("This email already exists.");
  }

  const user = {
    id: createId(),
    name: fullName.value.trim() || emailAddress,
    password,
    fullName: fullName.value.trim(),
    gender: gender.value,
    phone: phone.value.trim(),
    email: emailAddress,
    mode: "local"
  };
  users.push(user);
  saveUsers(users);
  return getPublicUser(user);
}

function localLogin(emailAddress, password) {
  const user = getUsers().find((item) => item.email.toLowerCase() === emailAddress.toLowerCase() && item.password === password);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  return getPublicUser(user);
}

function localResetPassword(emailAddress, phoneNumber, newPassword) {
  const users = getUsers();
  const user = users.find((item) => item.email.toLowerCase() === emailAddress.toLowerCase() && item.phone === phoneNumber);

  if (!user) {
    throw new Error("Email and phone number did not match.");
  }

  user.password = newPassword;
  saveUsers(users);
  return getPublicUser(user);
}

function localUpdateProfile(profile) {
  const users = getUsers();
  const user = users.find((item) => item.id === currentUser.id);

  if (!user) {
    throw new Error("Profile not found.");
  }

  Object.assign(user, profile);
  saveUsers(users);
  return getPublicUser(user);
}

async function authenticate(emailAddress, password) {
  try {
    const endpoint = authMode === "login" ? "/api/login" : authMode === "signup" ? "/api/signup" : "/api/reset-password";
    const payload = authMode === "signup"
      ? {
          email: emailAddress,
          password,
          fullName: fullName.value.trim(),
          gender: gender.value,
          phone: phone.value.trim(),
        }
      : authMode === "reset"
        ? { email: emailAddress, phone: phone.value.trim(), password }
        : { email: emailAddress, password };
    const user = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return { ...user, mode: "api" };
  } catch (error) {
    if (error.status && error.status !== 404) {
      throw error;
    }

    useLocalStorage = true;
    if (authMode === "login") {
      return localLogin(emailAddress, password);
    }

    if (authMode === "signup") {
      return localSignup(emailAddress, password);
    }

    return localResetPassword(emailAddress, phone.value.trim(), password);
  }
}

function renderProfile() {
  currentUserName.textContent = currentUser.fullName || currentUser.name;
  const initial = (currentUser.fullName || currentUser.name || currentUser.email || "P").trim().charAt(0).toUpperCase();
  profileInitial.textContent = initial;
  drawerAvatar.textContent = initial;
  drawerProfileName.textContent = currentUser.fullName || currentUser.name || "My Profile";
  drawerProfileEmail.textContent = currentUser.email || "";
  profileMeta.replaceChildren();

  [
    currentUser.email ? `Email: ${currentUser.email}` : "",
    currentUser.gender ? `Gender: ${currentUser.gender}` : "",
    currentUser.phone ? `Phone: ${currentUser.phone}` : "",
  ].filter(Boolean).forEach((item) => {
    const line = document.createElement("span");
    line.textContent = item;
    profileMeta.append(line);
  });

  profileFullName.value = currentUser.fullName || "";
  profileGender.value = currentUser.gender || "";
  profilePhone.value = currentUser.phone || "";
  profileEmail.value = currentUser.email || "";
}

function openProfileDrawer() {
  renderProfile();
  profileDrawer.hidden = false;
}

function closeProfileDrawer() {
  if (profileDrawer.hidden) {
    return;
  }
  profileDrawer.hidden = true;
}

async function saveProfile(event) {
  event.preventDefault();
  const profile = {
    fullName: profileFullName.value.trim(),
    gender: profileGender.value,
    phone: profilePhone.value.trim(),
    email: profileEmail.value.trim()
  };

  if (useLocalStorage) {
    currentUser = { ...currentUser, ...localUpdateProfile(profile) };
  } else {
    const user = await apiRequest("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(profile)
    });
    currentUser = { ...user, mode: "api" };
  }

  saveSession(currentUser);
  renderProfile();
  showToast("Profile updated.");
}

function sendPendingNotification() {
  const pendingTasks = tasks.filter((task) => task.status === "Pending");

  if (!pendingTasks.length) {
    showToast("No pending tasks right now.");
    return;
  }

  const body = pendingTasks.slice(0, 3).map((task) => `${task.title} - due ${formatDate(task.dueDate)}`).join("\n");

  if (!("Notification" in window)) {
    showToast(`${pendingTasks.length} pending task(s).`);
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(`You have ${pendingTasks.length} pending task(s)`, { body });
    return;
  }

  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(`You have ${pendingTasks.length} pending task(s)`, { body });
      } else {
        showToast(`${pendingTasks.length} pending task(s).`);
      }
    });
  } else {
    showToast(`${pendingTasks.length} pending task(s).`);
  }
}

async function loadTasks() {
  if (!currentUser) {
    showAuth();
    return;
  }

  showApp();
  useLocalStorage = currentUser.mode === "local";

  if (useLocalStorage) {
    tasks = getSavedTasks();
    setConnectionStatus("Private browser account", "local");
    updateCounters();
    renderTasks();
    return;
  }

  try {
    tasks = await apiRequest("/api/tasks");
    setConnectionStatus("Private account online", "online");
  } catch {
    useLocalStorage = true;
    currentUser = { ...currentUser, mode: "local" };
    saveSession(currentUser);
    tasks = getSavedTasks();
    setConnectionStatus("Private browser account", "local");
  }

  updateCounters();
  renderTasks();
}

async function createTask(event) {
  event.preventDefault();

  const formData = new FormData(taskForm);
  const task = Object.fromEntries(formData.entries());

  if (useLocalStorage) {
    tasks.unshift({
      id: createId(),
      title: task.title.trim(),
      course: task.course.trim(),
      dueDate: task.dueDate,
      priority: task.priority,
      status: "Pending",
      createdAt: new Date().toISOString()
    });
    saveLocalTasks();
  } else {
    await apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task)
    });
  }

  taskForm.reset();
  document.querySelector("#priority").value = "Medium";
  await loadTasks();
  showToast("Task added to your private planner.");
}

async function updateTask(id, status) {
  if (useLocalStorage) {
    tasks = tasks.map((task) => task.id === id ? { ...task, status } : task);
    saveLocalTasks();
  } else {
    await apiRequest(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }

  await loadTasks();
  showToast(`Task moved to ${status}.`);
}

async function deleteTask(id) {
  if (useLocalStorage) {
    tasks = tasks.filter((task) => task.id !== id);
    saveLocalTasks();
  } else {
    await apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
  }

  await loadTasks();
  showToast("Task deleted.");
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const emailAddress = authName.value.trim().toLowerCase();
  const password = authPassword.value;

  if (!authName.validity.valid || password.length < 4) {
    showAuthMessage("Enter a valid email and a password with 4 characters.");
    return;
  }

  if ((authMode === "signup" || authMode === "reset") && phone.value.trim().length < 6) {
    showAuthMessage("Enter a valid phone number for signup/reset.");
    return;
  }

  try {
    const user = await authenticate(emailAddress, password);
    saveSession({ ...user, mode: user.mode || (useLocalStorage ? "local" : "api") });
    authForm.reset();
    showAuthMessage(authMode === "login" ? "Logged in." : authMode === "signup" ? "Account created." : "Password reset.", true);
    await loadTasks();
    showToast(`Welcome, ${user.name}.`);
  } catch (error) {
    showAuthMessage(error.message || "Authentication failed.");
  }
});

loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));
resetTab.addEventListener("click", () => setAuthMode("reset"));
logoutButton.addEventListener("click", () => {
  clearSession();
  tasks = [];
  updateCounters();
  Object.values(lists).forEach((list) => list.replaceChildren());
  closeProfileDrawer();
  showAuth();
  showToast("Logged out.");
});
profileIconButton.addEventListener("click", openProfileDrawer);
profileDrawerClose.addEventListener("click", closeProfileDrawer);
profileDrawerBackdrop.addEventListener("click", closeProfileDrawer);
profileForm.addEventListener("submit", saveProfile);
taskForm.addEventListener("submit", createTask);
statusFilter.addEventListener("change", renderTasks);
searchInput.addEventListener("input", renderTasks);
notifyButton.addEventListener("click", sendPendingNotification);
passwordToggle.addEventListener("click", () => {
  const shouldShow = authPassword.type === "password";
  authPassword.type = shouldShow ? "text" : "password";
  passwordToggleIcon.textContent = shouldShow ? "Hide" : "Show";
  passwordToggle.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
  passwordToggle.title = shouldShow ? "Hide password" : "Show password";
});

clearSession();
setAuthMode("login");
showAuth();
