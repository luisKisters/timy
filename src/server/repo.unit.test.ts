import { describe, expect, test } from "vitest";
import type PocketBase from "pocketbase";
import { createMany } from "@/server/repo";

function fakePb(opts: { batchStatus?: number } = {}) {
  const batchRecords: Record<string, unknown>[] = [];
  const directRecords: Record<string, unknown>[] = [];
  const pb = {
    createBatch() {
      return {
        collection() {
          return {
            create(r: Record<string, unknown>) {
              batchRecords.push(r);
            },
          };
        },
        async send() {
          if (opts.batchStatus) {
            throw Object.assign(new Error("batch error"), { status: opts.batchStatus });
          }
          return batchRecords.map((_, i) => ({ status: 200, body: { id: `b${i}` } }));
        },
      };
    },
    collection() {
      return {
        async create(r: Record<string, unknown>) {
          directRecords.push(r);
          return { id: `d${directRecords.length - 1}` };
        },
      };
    },
  };
  return { pb: pb as unknown as PocketBase, batchRecords, directRecords };
}

describe("createMany", () => {
  test("uses one batch request when the batch API is available", async () => {
    const { pb, directRecords } = fakePb();
    const ids = await createMany(pb, "votes", [{ a: 1 }, { a: 2 }]);
    expect(ids).toEqual(["b0", "b1"]);
    expect(directRecords).toHaveLength(0); // never fell back
  });

  test("falls back to parallel creates when batch is disabled (403)", async () => {
    const { pb, directRecords } = fakePb({ batchStatus: 403 });
    const ids = await createMany(pb, "votes", [{ a: 1 }, { a: 2 }, { a: 3 }]);
    expect(ids).toEqual(["d0", "d1", "d2"]);
    expect(directRecords).toHaveLength(3);
  });

  test("falls back when the batch endpoint is missing (404)", async () => {
    const { pb } = fakePb({ batchStatus: 404 });
    expect(await createMany(pb, "time_slots", [{ a: 1 }])).toEqual(["d0"]);
  });

  test("rethrows real errors (e.g. 400 validation)", async () => {
    const { pb } = fakePb({ batchStatus: 400 });
    await expect(createMany(pb, "votes", [{ a: 1 }])).rejects.toThrow();
  });

  test("empty input → no requests", async () => {
    const { pb } = fakePb({ batchStatus: 403 });
    expect(await createMany(pb, "votes", [])).toEqual([]);
  });
});
