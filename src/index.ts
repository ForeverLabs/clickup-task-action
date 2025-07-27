import { readFileSync } from "node:fs";

import axios from "axios";

// --- Env & inputs -----------------------------------------------------------
const CU_TOKEN = process.env.CU_TOKEN;
if (!CU_TOKEN) throw new Error("CU_TOKEN env is required");

const listId = process.env.INPUT_LIST_ID; // from action input
const mode = (process.env.INPUT_MODE ?? "auto") as "auto" | "task" | "sub";
const explicitParent = process.env.INPUT_PARENT_TASK_ID;
const assigneeId = process.env.INPUT_ASSIGNEE_ID;

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
  console.log(`🔧 Environment check:`);
  console.log(`- CU_TOKEN: ${CU_TOKEN ? "✅ Set" : "❌ Missing"}`);
  console.log(`- List ID: ${listId || "❌ Missing"}`);
  console.log(`- Mode: ${mode}`);
  console.log(`- Parent Task ID: ${explicitParent || "Not set"}`);
  console.log(`- Assignee ID: ${assigneeId || "Not set"}`);

  console.log(`\nProcessing ${payload.commits?.length || 0} commits...`);

  const commits = payload.commits as Commit[];
  let processed = 0;

  for (const commit of commits) {
    console.log(`\nProcessing commit: ${commit.id}`);
    console.log(`Message: "${commit.message}"`);

    const action = decideAction(commit.message);
    if (!action) {
      console.log(`❌ Skipping: No TASK: or SUB: prefix found`);
      continue;
    }

    console.log(`✅ Action detected: ${action.kind} - "${action.title}"`);
    processed++;

    if (action.kind === "task") {
      await createTask(action.title, commit.url);
    } else {
      const parentId = action.parentId ?? explicitParent;
      if (!parentId) {
        console.warn(`❌ Skipping commit ${commit.id}: no parent task id`);
        continue;
      }
      await createSubTask(parentId, action.title, commit.url);
    }
  }

  console.log(`\n🎯 Summary: Processed ${processed} commits that matched patterns`);
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
  try {
    console.log(`🚀 Creating task in list ${listId}...`);

    const taskData: any = {
      name: title,
      description: `Created from commit ${commitUrl}`,
      tags: ["auto-gh"],
    };

    // Add assignee if specified
    if (assigneeId) {
      taskData.assignees = [parseInt(assigneeId)];
      console.log(`👤 Assigning to user ID: ${assigneeId}`);
    }

    const response = await cu.post(`/list/${listId}/task`, taskData);
    console.log(`✓ Task created: ${title} (ID: ${response.data.id})`);
  } catch (error: any) {
    console.error(`❌ Failed to create task "${title}":`, error.response?.data || error.message);
    throw error;
  }
}

async function createSubTask(parentId: string, title: string, commitUrl: string) {
  try {
    console.log(`🚀 Creating sub-task under parent ${parentId}...`);

    const subtaskData: any = {
      name: title,
      parent: parentId,
      description: `Sub‑task from commit ${commitUrl}`,
      tags: ["auto-gh"],
    };

    // Add assignee if specified
    if (assigneeId) {
      subtaskData.assignees = [parseInt(assigneeId)];
      console.log(`👤 Assigning subtask to user ID: ${assigneeId}`);
    }

    const response = await cu.post(`/task`, subtaskData);
    console.log(`✓ Sub‑task created under ${parentId}: ${title} (ID: ${response.data.id})`);
  } catch (error: any) {
    console.error(`❌ Failed to create sub-task "${title}":`, error.response?.data || error.message);
    throw error;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
