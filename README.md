# ClickUp Task Action

GitHub Action that scans commits on a push and creates a ClickUp **task** or **sub‑task**.

```yaml
- uses: ForeverLabs/clickup-task-action@v1
  with:
    list_id: ${{ vars.CU_LIST_ID }}
    mode: auto # auto | task | sub
    parent_task_id: CU-123 # only for sub mode
  env:
    CU_TOKEN: ${{ secrets.CLICKUP_TOKEN }}
```

## Commit message conventions

**TASK: \<title\>** → new task in list_id

**SUB:\<parentID\> \<title\>** → sub‑task under \<parentID\>
(omit \<parentID\> and supply parent_task_id via input if you prefer)

See src/index.ts for full logic.

## Setup

### 1. Configure Secrets in Your Repository

In the repository where you want to use this action:

**Repository Secrets:**

- `CLICKUP_TOKEN` = Your ClickUp API token (get from [ClickUp Apps](https://app.clickup.com/settings/apps))

**Repository Variables:**

- `CU_LIST_ID` = Your ClickUp list ID (from the list URL)

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
