import { describe, it, expect } from "vitest";
import { extractJson } from "@/lib/llm";

describe("extractJson", () => {
  it("passes through clean JSON", () => {
    expect(JSON.parse(extractJson('{"a":1}'))).toEqual({ a: 1 });
  });

  it("strips ```json fences", () => {
    const s = '```json\n{"a": 1, "b": [2,3]}\n```';
    expect(JSON.parse(extractJson(s))).toEqual({ a: 1, b: [2, 3] });
  });

  it("pulls the object out of surrounding prose", () => {
    const s = 'Sure! Here you go:\n{"verdict":"stale"}\nHope that helps.';
    expect(JSON.parse(extractJson(s))).toEqual({ verdict: "stale" });
  });

  it("handles braces inside strings without truncating early", () => {
    const s = '{"text":"a } b","n":1}';
    expect(JSON.parse(extractJson(s))).toEqual({ text: "a } b", n: 1 });
  });

  it("extracts a top-level array", () => {
    const s = "noise [ {\"id\":1} ] trailing";
    expect(JSON.parse(extractJson(s))).toEqual([{ id: 1 }]);
  });
});
