const C = 299792458;

function toNumberSafe(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function computeTimes(distanceMeters: number, accelerationMs2: number) {
  const term = (accelerationMs2 * distanceMeters) / (2 * C * C);
  const phi = Math.acosh(1 + term);
  const tau = ((2 * C) / accelerationMs2) * phi;
  const T = ((2 * C) / accelerationMs2) * Math.sinh(phi);
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
