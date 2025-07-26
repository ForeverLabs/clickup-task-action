import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";

import { afterEach, beforeEach, expect, test } from "vitest";
import nock from "nock";

// Fake minimal push payload
const payloadPath = join(tmpdir(), "gh_payload.json");
const payload = {
  commits: [
    { message: "TASK: Build new feature", url: "http://commit/1", id: "1" },
    { message: "SUB:CU-123 Fix bug", url: "http://commit/2", id: "2" },
  ],
};
writeFileSync(payloadPath, JSON.stringify(payload));

beforeEach(() => {
  process.env.CU_TOKEN = "tok";
  process.env.INPUT_LIST_ID = "999";
  process.env.GITHUB_EVENT_PATH = payloadPath;
  process.env.INPUT_MODE = "auto";
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
});

test("creates task and sub‑task", async () => {
  const scope = nock("https://api.clickup.com").post("/api/v2/list/999/task").reply(200, {}).post("/api/v2/task").reply(200, {});

  // @ts-ignore
  await import("../lib/src/index.js");

  // Give a small delay for async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(scope.isDone()).toBe(true);
});
