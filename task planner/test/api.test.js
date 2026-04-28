const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const path = require("path");

const dbFile = path.join(__dirname, "..", "data", "tasks.json");

test("task database stores an array and can start empty for privacy", async () => {
  const raw = await fs.readFile(dbFile, "utf8");
  const tasks = JSON.parse(raw);

  assert.ok(Array.isArray(tasks));
});
