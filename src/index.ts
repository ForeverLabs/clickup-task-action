import { readFileSync } from "node:fs";

import axios from "axios";

// --- Env & inputs -----------------------------------------------------------
const CU_TOKEN = process.env.CU_TOKEN;
if (!CU_TOKEN) throw new Error("CU_TOKEN env is required");

const listId = process.env.INPUT_LIST_ID; // from action input
const mode = (process.env.INPUT_MODE ?? "auto") as "auto" | "task" | "sub";
const explicitParent = process.env.INPUT_PARENT_TASK_ID;

const payloadPath = process.env.GITHUB_EVENT_PATH!;
const payload = JSON.parse(readFileSync(payloadPath, "utf8"));

// ---------------------------------------------------------------------------

// Simple axios wrapper
const cu = axios.create({
  baseURL: "https://api.clickup.com/api/v2",
  headers: { Authorization: CU_TOKEN, "Content-Type": "application/json" },
  timeout: 10_000,
});

interface Commit {
  message: string;
  url: string;
  id: string;
}

async function run() {
  const commits = payload.commits as Commit[];
  for (const commit of commits) {
    const action = decideAction(commit.message);
    if (!action) continue;

    if (action.kind === "task") {
      await createTask(action.title, commit.url);
    } else {
      const parentId = action.parentId ?? explicitParent;
      if (!parentId) {
        console.warn(`Skipping commit ${commit.id}: no parent task id`);
        continue;
      }
      await createSubTask(parentId, action.title, commit.url);
    }
  }
}

type Decision = { kind: "task"; title: string } | { kind: "sub"; parentId?: string; title: string } | null;

// TASK: Title      → new task
// SUB:CU-123 Title → sub‑task under CU‑123 (or --parent flag)
function decideAction(msg: string): Decision {
  const taskMatch = /^TASK:\s*(.+)/s.exec(msg);
  if (taskMatch && (mode === "auto" || mode === "task")) {
    return { kind: "task", title: taskMatch[1] };
  }

  const subMatch = /^SUB:(\S+)?\s*(.+)/s.exec(msg);
  if (subMatch && (mode === "auto" || mode === "sub")) {
    const [, parentCapture, title] = subMatch;
    return { kind: "sub", parentId: parentCapture, title };
  }

  return null;
}

async function createTask(title: string, commitUrl: string) {
  await cu.post(`/list/${listId}/task`, {
    name: title,
    description: `Created from commit ${commitUrl}`,
    tags: ["auto-gh"],
    priority: 2,
  });
  console.log(`✓ Task created: ${title}`);
}

async function createSubTask(parentId: string, title: string, commitUrl: string) {
  // ClickUp: `parent` refers to parent task id
  await cu.post(`/task`, {
    name: title,
    parent: parentId,
    description: `Sub‑task from commit ${commitUrl}`,
  });
  console.log(`✓ Sub‑task created under ${parentId}: ${title}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
