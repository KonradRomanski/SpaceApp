import { describe, expect, it } from "vitest";
import { formatDuration } from "../lib/format";

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(30)).toBe("30.00 seconds");
  });

  it("formats minutes", () => {
    expect(formatDuration(120)).toBe("2.00 minutes");
  });

  it("formats hours", () => {
    expect(formatDuration(3600)).toBe("1.00 hours");
  });

  it("formats days", () => {
    expect(formatDuration(86400)).toBe("1.00 days");
  });

  it("formats years", () => {
    expect(formatDuration(31557600)).toBe("1.00 years");
  });
});
