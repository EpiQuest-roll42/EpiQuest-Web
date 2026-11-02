import { expect, it } from "vitest";

it("loads the rules-engine entry point", async () => {
  await expect(import("./index.js")).resolves.toBeDefined();
});
