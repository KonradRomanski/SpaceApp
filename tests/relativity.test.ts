import { describe, expect, it } from "vitest";
import { computeTimes, solveAcceleration } from "../lib/relativity";

const distance = 1e11;

function close(a: number, b: number, tol = 1e-2) {
  return Math.abs(a - b) <= tol;
}

describe("solveAcceleration", () => {
  it("solves for earth time", () => {
    const accel = 1.5;
    const { T } = computeTimes(distance, accel);
    if (T === null) throw new Error("Invalid time");
    const solved = solveAcceleration(distance, T, "earth");
    expect(solved).not.toBeNull();
    expect(close(solved as number, accel, 1e-2)).toBe(true);
  });

  it("solves for ship time", () => {
    const accel = 2.2;
    const { tau } = computeTimes(distance, accel);
    if (tau === null) throw new Error("Invalid time");
    const solved = solveAcceleration(distance, tau, "ship");
    expect(solved).not.toBeNull();
    expect(close(solved as number, accel, 1e-2)).toBe(true);
  });
});
