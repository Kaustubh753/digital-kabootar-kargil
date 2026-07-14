import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header and rows", () => {
    const csv = toCsv(["a", "b"], [[1, 2], [3, 4]]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4");
  });

  it("quotes cells containing commas, quotes, and newlines", () => {
    const csv = toCsv(["x"], [['he said "hi", ok\nnext']]);
    expect(csv).toBe('x\r\n"he said ""hi"", ok\nnext"');
  });

  it("neutralises spreadsheet formula injection", () => {
    const csv = toCsv(["f"], [["=SUM(A1:A2)"]]);
    // Leading ' added, then quoted because... no comma; just prefixed.
    expect(csv).toBe("f\r\n'=SUM(A1:A2)");
  });

  it("renders null/undefined as empty", () => {
    expect(toCsv(["a"], [[null], [undefined]])).toBe("a\r\n\r\n");
  });
});
