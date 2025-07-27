# ClickUp Task Action

GitHub Action that scans commits on a push and creates a ClickUp **task** or **sub‑task**.

```yaml
- uses: ForeverLabs/clickup-task-action@v1
  with:
    list_id: ${{ vars.CU_LIST_ID }}
    mode: auto # auto | task | sub
    parent_task_id: CU-123 # only for sub mode
    assignee_id: ${{ vars.CU_ASSIGNEE_ID }} # optional: assign tasks to user
  env:
    CU_TOKEN: ${{ secrets.CLICKUP_TOKEN }}
```

## Commit message conventions

**TASK: \<title\>** → new task in list_id (assigned to user if assignee_id is set)

**SUB:\<parentID\> \<title\>** → sub‑task under \<parentID\> (assigned to user if assignee_id is set)
(omit \<parentID\> and supply parent_task_id via input if you prefer)

**Features:**

- ✅ **Auto-tagging** with `auto-gh` tag
- ✅ **User assignment** if `assignee_id` is provided
- ✅ **No priority flags** (cleaner task creation)
- ✅ **Commit URL** in task description for traceability

See src/index.ts for full logic.

## Setup

### 1. Configure Secrets in Your Repository

In the repository where you want to use this action:

**Repository Secrets:**

- `CLICKUP_TOKEN` = Your ClickUp API token (get from [ClickUp Apps](https://app.clickup.com/settings/apps))

**Repository Variables:**

- `CU_LIST_ID` = Your ClickUp list ID (from the list URL)
- `CU_ASSIGNEE_ID` = Your ClickUp user ID (optional, for task assignment)

**Getting ClickUp IDs:**

📋 **List ID**: From the list URL `https://app.clickup.com/123456/v/l/789123`, the list ID is `789123`

👤 **User ID**: Go to [ClickUp API](https://app.clickup.com/api) → Try "Get authorized user" → Copy the `id` field

### 2. Add Workflow

```yaml
# .github/workflows/clickup.yml
name: ClickUp Integration

on:
  push:
    branches: [main]

jobs:
  create-tasks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ForeverLabs/clickup-task-action@v1
        with:
          list_id: ${{ vars.CU_LIST_ID }}
          assignee_id: ${{ vars.CU_ASSIGNEE_ID }} # optional
        env:
          CU_TOKEN: ${{ secrets.CLICKUP_TOKEN }}
```

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

## Need tweaks?

- **New input** → add to action.yml, update src/index.ts, publish v1.1.0
- **Breaking change** → bump to v2.0.0, create lightweight branch/tag v2 for consumers
- **Shared wrapper** – create org/shared-workflows and point it at this action
