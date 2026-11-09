import { describe, expect, test } from "bun:test";
import { parse } from "csv-parse/sync";
import { collectFeedPages, feedDocumentsToCsv } from "../../../web/src/features/feed/model/feed-csv.ts";

describe("feed CSV export", () => {
  test("walks every continuation page, including an empty filtered page", async () => {
    const cursors: (string | null)[] = [];
    const progress: number[] = [];
    const documents = await collectFeedPages(
      (cursor) => {
        cursors.push(cursor);
        const page =
          cursor === null ? [{ _id: "first", description: "Page one" }] : cursor === "empty" ? [] : [{ _id: "last", description: "Page three" }];
        return Promise.resolve({ page, isDone: cursor === "last", continueCursor: cursor === null ? "empty" : "last" });
      },
      (count) => progress.push(count)
    );
    expect(cursors).toEqual([null, "empty", "last"]);
    expect(documents.map((document) => document._id)).toEqual(["first", "last"]);
    expect(progress).toEqual([1, 1, 2]);
  });

  test("keeps one raw document per ID if data shifts between pages", async () => {
    const documents = await collectFeedPages((cursor) =>
      Promise.resolve({
        page:
          cursor === null
            ? [{ _id: "one", value: "old" }]
            : [
                { _id: "one", value: "updated" },
                { _id: "two", value: "later page" },
              ],
        isDone: cursor !== null,
        continueCursor: "next",
      })
    );
    expect(documents).toEqual([
      { _id: "one", value: "updated" },
      { _id: "two", value: "later page" },
    ]);
  });

  test("rejects failed or stuck pagination instead of producing a partial export", async () => {
    await expect(collectFeedPages(() => Promise.reject(new Error("Network failed")))).rejects.toThrow("Network failed");
    await expect(collectFeedPages(() => Promise.resolve({ page: [], isDone: false, continueCursor: "stuck" }))).rejects.toThrow(
      "stopped advancing"
    );
  });

  test("round-trips raw system fields, nested values, unicode, quotes, commas, and newlines", () => {
    const issue = { description: 'Display says "No signal", again\r\nSecond line — café', urgent: true, sodId: "SOD-42" };
    const documents = [
      { _id: "one", _creationTime: 1234, issue },
      {
        _id: "two",
        _creationTime: 5678,
        issue: { description: "Other issue", urgent: false },
        resolution: { comment: "Fixed" },
        findings: ["NO SYSTEM FAULT"],
      },
    ];
    const records = parse(feedDocumentsToCsv(documents), { columns: true }) as Record<string, string>[];
    expect(records).toHaveLength(2);
    expect(records[0]?._id).toBe("one");
    expect(records[0]?._creationTime).toBe("1234");
    expect(JSON.parse(records[0]?.issue ?? "")).toEqual(issue);
    expect(records[0]?.resolution).toBe("");
    expect(JSON.parse(records[1]?.resolution ?? "")).toEqual({ comment: "Fixed" });
    expect(JSON.parse(records[1]?.findings ?? "")).toEqual(["NO SYSTEM FAULT"]);
  });
});
