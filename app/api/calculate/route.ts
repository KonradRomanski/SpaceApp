import { NextResponse } from "next/server";
import { create, all, MathJsStatic } from "mathjs";
import { formatDuration } from "../../../lib/format";
import { computeTimes, solveAcceleration } from "../../../lib/relativity";

const math = create(all, { number: "BigNumber", precision: 64 }) as MathJsStatic;

const C = math.bignumber("299792458");

const DISTANCE_FACTORS: Record<string, number> = {
  ly: 9.4607304725808e15,
  au: 1.495978707e11,
  pc: 3.08567758149137e16,
  km: 1000
};

const ACC_FACTORS: Record<string, number> = {
  g: 9.80665,
  mps2: 1
};

const MASS_FACTORS: Record<string, number> = {
  kg: 1,
  t: 1000,
  lb: 0.45359237
};

const TIME_FACTORS: Record<string, number> = {
  hours: 3600,
  days: 86400,
  years: 31557600
};

const ENERGY_COMPARISONS = {
  tsarBomba: 2.1e17,
  globalYear: 5.8e20,
  sunPerSecond: 3.8e26,
  lhcBeam: 3.62e8,
  hiroshima: 15 * 4.184e12
};

function formatSci(value: unknown, precision = 4) {
  return math.format(value, { notation: "exponential", precision });
}

function toNumberSafe(value: unknown) {
  const num = Number(math.format(value, { notation: "auto" }));
  return Number.isFinite(num) ? num : null;
}

function formatFriendly(value: unknown) {
  const num = toNumberSafe(value);
  if (num === null) return formatSci(value);
  const abs = Math.abs(num);
  if (abs >= 1e9 || (abs > 0 && abs < 1e-3)) {
    return num.toExponential(3);
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function compute(distanceMeters: number, accelerationMs2: number, shipMassKg: number) {
  const d = math.bignumber(distanceMeters.toString());
  const a = math.bignumber(accelerationMs2.toString());
  const m = math.bignumber(shipMassKg.toString());

  const term = math.divide(
    math.multiply(a, d),
    math.multiply(2, math.pow(C, 2))
  );
  const phi = math.acosh(math.add(1, term));

  const tau = math.multiply(math.divide(math.multiply(2, C), a), phi);
  const T = math.multiply(math.divide(math.multiply(2, C), a), math.sinh(phi));
  const vmax = math.multiply(C, math.tanh(phi));

  const energy = math.multiply(
    m,
    math.pow(C, 2),
    math.subtract(math.exp(math.multiply(2, phi)), 1)
  );

  return { phi, tau, T, vmax, energy };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const distanceValue = Number(body.distanceValue);
    const distanceUnit = String(body.distanceUnit || "ly");
    const accelerationValue = Number(body.accelerationValue);
    const accelerationUnit = String(body.accelerationUnit || "g");
    const shipMassValue = Number(body.shipMassValue);
    const shipMassUnit = String(body.shipMassUnit || "kg");
    const propulsionEfficiency = Number(body.propulsionEfficiency ?? 1);
    const solveMode = String(body.solveMode ?? "distance");
    const targetTimeValue = Number(body.targetTimeValue ?? 0);
    const targetTimeUnit = String(body.targetTimeUnit ?? "hours");
    const targetTimeFrame = String(body.targetTimeFrame ?? "earth") as "earth" | "ship";

    if (!Number.isFinite(distanceValue) || distanceValue < 0) {
      return NextResponse.json({ error: "Invalid distance" }, { status: 400 });
    }
    if (!Number.isFinite(accelerationValue) || accelerationValue <= 0) {
      return NextResponse.json({ error: "Invalid acceleration" }, { status: 400 });
    }
    if (!Number.isFinite(shipMassValue) || shipMassValue <= 0) {
      return NextResponse.json({ error: "Invalid ship mass" }, { status: 400 });
    }

    const distanceMeters = distanceValue * (DISTANCE_FACTORS[distanceUnit] ?? 1);
    let accelerationMs2 =
      accelerationValue * (ACC_FACTORS[accelerationUnit] ?? 1);
    const shipMassKg = shipMassValue * (MASS_FACTORS[shipMassUnit] ?? 1);

    let derivedAccelerationMs2: number | null = null;
    if (solveMode === "time" && targetTimeValue > 0) {
      const seconds = targetTimeValue * (TIME_FACTORS[targetTimeUnit] ?? 3600);
      const solved = solveAcceleration(distanceMeters, seconds, targetTimeFrame);
      if (!solved) {
        return NextResponse.json(
          { error: "Unable to solve acceleration for the target time." },
          { status: 400 }
        );
      }
      derivedAccelerationMs2 = solved;
      accelerationMs2 = solved;
    }

    const { phi, tau, T, vmax, energy } = compute(
      distanceMeters,
      accelerationMs2,
      shipMassKg
    );

    const tauSeconds = toNumberSafe(tau);
    const earthSeconds = toNumberSafe(T);
    const vmaxMs = toNumberSafe(vmax);
    const energyJ = toNumberSafe(energy);

    const energyKwh = energyJ ? energyJ / 3.6e6 : null;
    const massEquivalent = energyJ ? energyJ / 8.987551787e16 : null;
    const fuelMassKg =
      energyJ && propulsionEfficiency > 0
        ? energyJ / (propulsionEfficiency * 8.987551787e16)
        : null;
    const fuelRatio = fuelMassKg ? fuelMassKg / shipMassKg : null;

    const chart = earthSeconds && Number.isFinite(earthSeconds)
      ? buildChart(earthSeconds, accelerationMs2)
      : null;

    const range = body.distanceRange as
      | { minValue: number; maxValue: number; unit: string }
      | undefined;

    const rangeResults = range
      ? buildRangeResults(range, accelerationMs2, shipMassKg)
      : null;

    return NextResponse.json({
      inputs: {
        distanceMeters: formatFriendly(distanceMeters),
        accelerationMs2,
        shipMassKg,
        derivedAccelerationMs2
      },
      results: {
        rapidity: formatFriendly(phi),
        properTimeSeconds: formatFriendly(tau),
        earthTimeSeconds: formatFriendly(T),
        vmaxMs: formatFriendly(vmax),
        energyJ: formatFriendly(energy),
        energyKwh: energyKwh ? formatFriendly(energyKwh) : null,
        massEquivalentKg: massEquivalent ? formatFriendly(massEquivalent) : null,
        properTimeHuman: formatDuration(tauSeconds),
        earthTimeHuman: formatDuration(earthSeconds),
        vmaxFractionC: vmaxMs ? (vmaxMs / 299792458).toFixed(4) : null,
        fuelMassKg: fuelMassKg ? formatFriendly(fuelMassKg) : null,
        fuelRatio: fuelRatio ? fuelRatio.toFixed(3) : null,
        derivedAccelerationG: derivedAccelerationMs2
          ? (derivedAccelerationMs2 / 9.80665).toFixed(3)
          : null
      },
      comparisons: {
        tsarBomba: energyJ
          ? formatFriendly(energyJ / ENERGY_COMPARISONS.tsarBomba)
          : null,
        globalYear: energyJ
          ? formatFriendly(energyJ / ENERGY_COMPARISONS.globalYear)
          : null,
        sunPerSecond: energyJ
          ? formatFriendly(energyJ / ENERGY_COMPARISONS.sunPerSecond)
          : null,
        lhcBeam: energyJ
          ? formatFriendly(energyJ / ENERGY_COMPARISONS.lhcBeam)
          : null,
        hiroshima: energyJ
          ? formatFriendly(energyJ / ENERGY_COMPARISONS.hiroshima)
          : null
      },
      chart,
      rangeResults
    });
  } catch (error) {
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}

function buildChart(totalTime: number, accelerationMs2: number) {
  const points = 80;
  if (!Number.isFinite(totalTime) || totalTime <= 0) return null;

  const unit = selectTimeUnit(totalTime);
  const half = totalTime / 2;
  const c = 299792458;
  const data: { t: number; v: number }[] = [];

  for (let i = 0; i <= points; i += 1) {
    const t = (half * i) / points;
    const ratio = (accelerationMs2 * t) / c;
    const v = (c * ratio) / Math.sqrt(1 + ratio * ratio);
    data.push({ t, v });
  }

  const mirrored = data
    .slice(0, data.length - 1)
    .reverse()
    .map((point, index) => ({
      t: half + (half * (index + 1)) / points,
      v: point.v
    }));

  const series = [...data, ...mirrored];
  const scaled = series.map((point) => ({
    t: Number((point.t / unit.seconds).toFixed(2)),
    v: Number((point.v / c).toFixed(4))
  }));

  return {
    unitLabel: unit.label,
    data: scaled
  };
}

function selectTimeUnit(totalTime: number) {
  const minute = 60;
  const hour = 3600;
  const day = 86400;
  const year = 31557600;

  if (totalTime >= year * 2) return { label: "years", seconds: year };
  if (totalTime >= day * 2) return { label: "days", seconds: day };
  if (totalTime >= hour * 2) return { label: "hours", seconds: hour };
  return { label: "minutes", seconds: minute };
}

function buildRangeResults(
  range: { minValue: number; maxValue: number; unit: string },
  accelerationMs2: number,
  shipMassKg: number
) {
  const factor = DISTANCE_FACTORS[range.unit] ?? 1;
  const minMeters = range.minValue * factor;
  const maxMeters = range.maxValue * factor;

  const min = compute(minMeters, accelerationMs2, shipMassKg);
  const max = compute(maxMeters, accelerationMs2, shipMassKg);

  const minEarth = toNumberSafe(min.T);
  const maxEarth = toNumberSafe(max.T);
  const minShip = toNumberSafe(min.tau);
  const maxShip = toNumberSafe(max.tau);

  return {
    minDistanceMeters: formatFriendly(minMeters),
    maxDistanceMeters: formatFriendly(maxMeters),
    earthTimeMin: formatDuration(minEarth),
    earthTimeMax: formatDuration(maxEarth),
    shipTimeMin: formatDuration(minShip),
    shipTimeMax: formatDuration(maxShip)
  };
}
