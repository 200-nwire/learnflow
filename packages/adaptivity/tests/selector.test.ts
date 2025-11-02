import { describe, it, expect } from "vitest";
import { createSnapshot } from "../src/session.js";
import { selectVariant } from "../src/select.js";
import type { Slot, Policy } from "../src/types.js";

const policy: Policy = { version: "test" };

describe("selectVariant", () => {
  it("respects sticky", () => {
    const ctx = createSnapshot({
      ids: { userId: "u", courseId: "c", lessonId: "L", pageId: "P" },
      user: { lang: "he" },
      sticky: { slot1: { variantId: "v2", at: Date.now(), scope: "lesson", strength: "weak", reason: "first_pick" } }
    });
    const slot: Slot = {
      id: "slot1",
      variants: [{ id:"v1", meta:{} }, { id:"v2", meta:{} }]
    };
    const res = selectVariant(slot, ctx, policy);
    expect(res.variantId).toBe("v2");
    expect(res.why.stickyUsed).toBeTruthy();
  });

  it("filters by deviceFit and guard", () => {
    const ctx = createSnapshot({
      ids: { userId: "u", courseId: "c", lessonId: "L", pageId: "P" },
      env: { device: "mobile", online: true }
    });
    const slot: Slot = {
      id: "slot2",
      variants: [
        { id:"a", meta:{ deviceFit:["desktop"] } },
        { id:"b", meta:{ deviceFit:["mobile"] }, guard:"ctx.metrics.accEWMA <= 1.0" }
      ]
    };
    const res = selectVariant(slot, ctx, policy, { trace: true });
    expect(res.variantId).toBe("b");
    expect(res.why.guards["b"]).toBe(true);
  });
});
