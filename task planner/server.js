const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { createHash, randomUUID } = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "tasks.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-User-Id"
};

async function ensureDatabase() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
  }
}

async function readTasks() {
  await ensureDatabase();
  const file = await fs.readFile(DB_FILE, "utf8");
  return JSON.parse(file);
}

async function writeTasks(tasks) {
  await fs.writeFile(DB_FILE, JSON.stringify(tasks, null, 2));
}

async function readUsers() {
  await ensureDatabase();
  const file = await fs.readFile(USERS_FILE, "utf8");
  return JSON.parse(file);
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function parseBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
  response.end(JSON.stringify(data));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

function isValidTask(task) {
  return task.title && task.course && task.dueDate && task.priority;
}

function hashPassword(password, salt) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name || user.email,
    fullName: user.fullName || "",
    gender: user.gender || "",
    phone: user.phone || "",
    email: user.email || ""
  };
}

function getUserId(request) {
  return request.headers["x-user-id"];
}

function requireUser(request, response) {
  const userId = getUserId(request);

  if (!userId) {
    sendError(response, 401, "Login required.");
    return null;
  }

  return userId;
}

async function handleApi(request, response, url) {
  const idMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);

  if (url.pathname === "/api/signup" && request.method === "POST") {
    const payload = await parseBody(request);
    const email = (payload.email || "").trim().toLowerCase();
    const name = (payload.fullName || "").trim() || email;
    const password = payload.password || "";
    const phone = (payload.phone || "").trim();

    if (!email.includes("@") || password.length < 4 || phone.length < 6) {
      sendError(response, 400, "Valid email, password, and phone number are required.");
      return;
    }

    const users = await readUsers();

    if (users.some((user) => user.email.toLowerCase() === email)) {
      sendError(response, 409, "This email already exists.");
      return;
    }

    const salt = randomUUID();
    const user = {
      id: randomUUID(),
      name,
      fullName: (payload.fullName || "").trim(),
      gender: payload.gender || "",
      phone,
      email,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await writeUsers(users);

    sendJson(response, 201, publicUser(user));
    return;
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    const payload = await parseBody(request);
    const email = (payload.email || "").trim().toLowerCase();
    const password = payload.password || "";
    const users = await readUsers();
    const user = users.find((item) => item.email.toLowerCase() === email);

    if (!user || user.passwordHash !== hashPassword(password, user.salt)) {
      sendError(response, 401, "Invalid email or password.");
      return;
    }

    sendJson(response, 200, publicUser(user));
    return;
  }

  if (url.pathname === "/api/reset-password" && request.method === "POST") {
    const payload = await parseBody(request);
    const email = (payload.email || "").trim().toLowerCase();
    const phone = (payload.phone || "").trim();
    const password = payload.password || "";
    const users = await readUsers();
    const user = users.find((item) => item.email.toLowerCase() === email && item.phone === phone);

    if (!user) {
      sendError(response, 404, "Email and phone number did not match.");
      return;
    }

    if (password.length < 4) {
      sendError(response, 400, "New password needs 4 characters.");
      return;
    }

    user.salt = randomUUID();
    user.passwordHash = hashPassword(password, user.salt);
    await writeUsers(users);
    sendJson(response, 200, publicUser(user));
    return;
  }

  if (url.pathname === "/api/profile" && request.method === "PATCH") {
    const userId = requireUser(request, response);

    if (!userId) {
      return;
    }

    const payload = await parseBody(request);
    const users = await readUsers();
    const user = users.find((item) => item.id === userId);

    if (!user) {
      sendError(response, 404, "Profile not found.");
      return;
    }

    user.fullName = (payload.fullName || "").trim();
    user.gender = payload.gender || "";
    user.phone = (payload.phone || "").trim();
    user.email = (payload.email || "").trim();
    await writeUsers(users);
    sendJson(response, 200, publicUser(user));
    return;
  }

  if (url.pathname === "/api/tasks" && request.method === "GET") {
    const userId = requireUser(request, response);

    if (!userId) {
      return;
    }

    const tasks = await readTasks();
    sendJson(response, 200, tasks.filter((task) => task.userId === userId));
    return;
  }

  if (url.pathname === "/api/tasks" && request.method === "POST") {
    const userId = requireUser(request, response);

    if (!userId) {
      return;
    }

    const payload = await parseBody(request);

    if (!isValidTask(payload)) {
      sendError(response, 400, "Title, course, due date, and priority are required.");
      return;
    }

    const tasks = await readTasks();
    const task = {
      id: randomUUID(),
      userId,
      title: payload.title.trim(),
      course: payload.course.trim(),
      dueDate: payload.dueDate,
      priority: payload.priority,
      status: payload.status || "Pending",
      createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    await writeTasks(tasks);
    sendJson(response, 201, task);
    return;
  }

  if (idMatch && request.method === "PATCH") {
    const userId = requireUser(request, response);

    if (!userId) {
      return;
    }

    const payload = await parseBody(request);
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === idMatch[1] && item.userId === userId);

    if (!task) {
      sendError(response, 404, "Task not found.");
      return;
    }

    if (payload.status) {
      task.status = payload.status;
    }

    await writeTasks(tasks);
    sendJson(response, 200, task);
    return;
  }

  if (idMatch && request.method === "DELETE") {
    const userId = requireUser(request, response);

    if (!userId) {
      return;
    }

    const tasks = await readTasks();
    const nextTasks = tasks.filter((item) => !(item.id === idMatch[1] && item.userId === userId));

    if (nextTasks.length === tasks.length) {
      sendError(response, 404, "Task not found.");
      return;
    }

    await writeTasks(nextTasks);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendError(response, 404, "API endpoint not found.");
}

async function serveStatic(request, response, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendError(response, 403, "Forbidden.");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream", ...corsHeaders });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8", ...corsHeaders });
    response.end("<h1>404 - Page not found</h1>");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(request, response, url);
  } catch (error) {
    sendError(response, 500, error.message || "Internal server error.");
  }
});

ensureDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`My Task Planner running at http://localhost:${PORT}`);
  });
});
