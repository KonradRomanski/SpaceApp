import { create, all, MathJsStatic } from "mathjs";

const math = create(all, { number: "BigNumber", precision: 64 }) as MathJsStatic;
const C = math.bignumber("299792458");

function toNumberSafe(value: unknown) {
  const num = Number(math.format(value, { notation: "auto" }));
  return Number.isFinite(num) ? num : null;
}

export function computeTimes(distanceMeters: number, accelerationMs2: number) {
  const d = math.bignumber(distanceMeters.toString());
  const a = math.bignumber(accelerationMs2.toString());
  const term = math.divide(
    math.multiply(a, d),
    math.multiply(2, math.pow(C, 2))
  );
  const phi = math.acosh(math.add(1, term));
  const tau = math.multiply(math.divide(math.multiply(2, C), a), phi);
  const T = math.multiply(math.divide(math.multiply(2, C), a), math.sinh(phi));
  return { tau: toNumberSafe(tau), T: toNumberSafe(T) };
}

export function solveAcceleration(
  distanceMeters: number,
  targetSeconds: number,
  frame: "earth" | "ship"
) {
  const minA = 1e-6;
  let maxA = 1e4;
  let low = minA;
  let high = maxA;
  const target = targetSeconds;

  const timeAt = (a: number) => {
    const { tau, T } = computeTimes(distanceMeters, a);
    return frame === "ship" ? tau ?? Infinity : T ?? Infinity;
  };

  let highTime = timeAt(high);
  let iter = 0;
  while (highTime > target && iter < 12) {
    high *= 2;
    highTime = timeAt(high);
    iter += 1;
  }

  const lowTime = timeAt(low);
  if (!Number.isFinite(lowTime) || !Number.isFinite(highTime)) return null;
  if (target > lowTime) return null;
  if (target < highTime) return null;

  for (let i = 0; i < 64; i += 1) {
    const mid = (low + high) / 2;
    const t = timeAt(mid);
    if (!Number.isFinite(t)) return null;
    if (t > target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}
