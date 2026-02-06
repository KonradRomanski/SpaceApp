export const distanceUnits = [
  { value: "ly", label: "Light-year (ly)", toMeters: 9.4607304725808e15 },
  { value: "au", label: "Astronomical Unit (AU)", toMeters: 1.495978707e11 },
  { value: "pc", label: "Parsec (pc)", toMeters: 3.08567758149137e16 },
  { value: "km", label: "Kilometer (km)", toMeters: 1000 }
] as const;

export const accelerationUnits = [
  { value: "g", label: "g (9.80665 m/s²)", toMetersPerSec2: 9.80665 },
  { value: "mps2", label: "m/s²", toMetersPerSec2: 1 }
] as const;

export const massUnits = [
  { value: "kg", label: "Kilogram (kg)", toKg: 1 },
  { value: "t", label: "Metric ton (t)", toKg: 1000 },
  { value: "lb", label: "Pound (lb)", toKg: 0.45359237 }
] as const;

export type DistanceUnit = (typeof distanceUnits)[number]["value"];
export type AccelerationUnit = (typeof accelerationUnits)[number]["value"];
export type MassUnit = (typeof massUnits)[number]["value"];
