"use client";

import { useEffect, useMemo, useState } from "react";
import bodies from "../app/data/bodies.json";
import ships from "../app/data/ships.json";
import {
  accelerationUnits,
  distanceUnits,
  massUnits
} from "../lib/units";
import { dictionaries, type Locale } from "../lib/i18n";
import { useLocale } from "./LocaleProvider";
import { InfoTooltip } from "./InfoTooltip";
import { VelocityChart } from "./VelocityChart";
import { GammaChart } from "./GammaChart";
import { ChartsPanel } from "./ChartsPanel";
import { BodyBrowser } from "./BodyBrowser";
import { ShipBrowser } from "./ShipBrowser";
import { ScenarioBrowser } from "./ScenarioBrowser";
import type { Body } from "./TargetMap";

const massUnitMap = Object.fromEntries(
  massUnits.map((unit) => [unit.value, unit.toKg])
) as Record<string, number>;

type CalculationResponse = {
  inputs: {
    distanceMeters: string;
    accelerationMs2: number;
    shipMassKg: number;
  };
  results: {
    rapidity: string;
    properTimeSeconds: string;
    earthTimeSeconds: string;
    vmaxMs: string;
    energyJ: string;
    energyKwh: string | null;
    massEquivalentKg: string | null;
    properTimeHuman: string;
    earthTimeHuman: string;
    vmaxFractionC: string | null;
    fuelMassKg: string | null;
    fuelRatio: string | null;
  };
  comparisons: {
    tsarBomba: string | null;
    globalYear: string | null;
    sunPerSecond: string | null;
  };
  chart: { unitLabel: string; data: { t: number; v: number }[] } | null;
  rangeResults?: {
    minDistanceMeters: string;
    maxDistanceMeters: string;
    earthTimeMin: string;
    earthTimeMax: string;
    shipTimeMin: string;
    shipTimeMax: string;
  } | null;
};

const distanceModes = [
  { value: "straight", labelKey: "distanceModeStraight" },
  { value: "minmax", labelKey: "distanceModeMinMax" },
  { value: "hohmann", labelKey: "distanceModeHohmann" },
  { value: "ephemeris", labelKey: "distanceModeEphemeris" }
] as const;

const propulsionOptions = [
  { value: 1, label: "Ideal (100%)" },
  { value: 0.5, label: "Antimatter (50%)" },
  { value: 0.1, label: "Fusion (10%)" },
  { value: 0.05, label: "Fission (5%)" },
  { value: 0.001, label: "Chemical (0.1%)" }
];

function parseNumber(value: string | null) {
  if (!value) return null;
  const num = Number(value.replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

export function Calculator() {
  const { locale, setLocale } = useLocale();
  const t = dictionaries[locale as Locale];

  const [distanceValue, setDistanceValue] = useState(4.25);
  const [distanceUnit, setDistanceUnit] = useState("ly");
  const [accelerationValue, setAccelerationValue] = useState(1);
  const [accelerationUnit, setAccelerationUnit] = useState("g");
  const [shipMassValue, setShipMassValue] = useState(1000);
  const [shipMassUnit, setShipMassUnit] = useState("kg");
  const [shipCostPerKgUsd, setShipCostPerKgUsd] = useState(2000);
  const [fuelCostPerKgUsd, setFuelCostPerKgUsd] = useState(1000);
  const [currency, setCurrency] = useState("USD");
  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [selectedShip, setSelectedShip] = useState("custom");
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(
    "proxima-centauri"
  );
  const [distanceMode, setDistanceMode] = useState("straight");
  const [propulsionEfficiency, setPropulsionEfficiency] = useState(1);
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"ships" | "scenarios">("ships");
  const [distanceWarning, setDistanceWarning] = useState<string | null>(null);

  const allBodies = useMemo(() => bodies as Body[], []);

  const selectedBody = selectedBodyId
    ? allBodies.find((item) => item.id === selectedBodyId)
    : null;

  const selectedShipData = ships.find((ship) => ship.id === selectedShip) ?? null;

  useEffect(() => {
    if (!selectedBody) return;
    const selection = deriveDistance(selectedBody, distanceMode, t);
    setDistanceWarning(selection.warning);
    if (selection.value !== null) {
      setDistanceValue(selection.value);
      setDistanceUnit(selection.unit);
    }
  }, [selectedBody, distanceMode, t]);

  function handleShipChange(value: string) {
    setSelectedShip(value);
    if (value === "custom") return;
    const ship = ships.find((item) => item.id === value);
    if (!ship) return;
    setShipMassValue(ship.massKg);
    setShipMassUnit("kg");
    setAccelerationUnit("g");
    setAccelerationValue(ship.maxAccelG);
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    const range = buildDistanceRange(selectedBody, distanceMode);

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distanceValue,
          distanceUnit,
          accelerationValue,
          accelerationUnit,
          shipMassValue,
          shipMassUnit,
          propulsionEfficiency,
          distanceRange: range
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Calculation failed");
      }

      const data = (await response.json()) as CalculationResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleSubmit();
  }, []);

  useEffect(() => {
    fetch(`/api/fx?base=USD&symbols=EUR,PLN,GBP,JPY`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.rates) return;
        setFxRates(data.rates);
      });
  }, []);

  const accelWarning =
    selectedShipData && accelerationUnit === "g"
      ? accelerationValue > selectedShipData.maxAccelG
        ? `Exceeds ${selectedShipData.maxAccelG} g max for ${selectedShipData.name}.`
        : null
      : null;

  const earthSeconds = result
    ? Number(String(result.results.earthTimeSeconds).replace(/,/g, ""))
    : null;
  const shipSeconds = result
    ? Number(String(result.results.properTimeSeconds).replace(/,/g, ""))
    : null;
  const earthYears = earthSeconds && Number.isFinite(earthSeconds) ? earthSeconds / 31557600 : null;
  const shipYears = shipSeconds && Number.isFinite(shipSeconds) ? shipSeconds / 31557600 : null;

  const shipMassKg = shipMassValue * (massUnitMap[shipMassUnit] ?? 1);
  const fuelMassKg = result ? parseNumber(result.results.fuelMassKg) : null;
  const shipCostUsd = shipMassKg * shipCostPerKgUsd;
  const fuelCostUsd = fuelMassKg ? fuelMassKg * fuelCostPerKgUsd : null;
  const totalCostUsd = fuelCostUsd ? shipCostUsd + fuelCostUsd : shipCostUsd;
  const rate = currency === "USD" ? 1 : fxRates[currency] ?? 1;
  const shipCostDisplay = shipCostUsd * rate;
  const fuelCostDisplay = fuelCostUsd ? fuelCostUsd * rate : null;
  const totalCostDisplay = totalCostUsd * rate;

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              {t.appTitle}
            </p>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span>{t.language}</span>
              <button
                onClick={() => setLocale(locale === "en" ? "pl" : "en")}
                className="rounded-full border border-white/20 px-3 py-1"
              >
                {locale.toUpperCase()}
              </button>
            </div>
          </div>
          <h1 className="text-4xl font-display text-gradient md:text-6xl">
            {t.subtitle}
          </h1>
          <p className="max-w-2xl text-lg text-white/70">{t.description}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <form
            onSubmit={handleSubmit}
            className="glass card flex flex-col gap-6 bg-cosmic-radial"
          >
            <BodyBrowser
              bodies={allBodies}
              selectedId={selectedBodyId}
              onSelect={(body) => setSelectedBodyId(body.id)}
              title={t.bodyBrowserTitle}
              detailsLabel={t.details}
              searchPlaceholder={t.searchBody}
            />

            <div className="flex flex-col gap-2">
              <InfoTooltip label={t.distanceMode} description={t.distanceModeDesc} />
              <select
                value={distanceMode}
                onChange={(event) => setDistanceMode(event.target.value)}
              >
                {distanceModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {t[mode.labelKey]}
                  </option>
                ))}
              </select>
              {distanceWarning ? (
                <p className="text-xs text-star-400">{distanceWarning}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col gap-2">
                <InfoTooltip label={t.distance} description={t.distanceDesc} />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={distanceValue}
                  onChange={(event) => setDistanceValue(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label>Unit</label>
                <select
                  value={distanceUnit}
                  onChange={(event) => setDistanceUnit(event.target.value)}
                >
                  {distanceUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col gap-2">
                <InfoTooltip label={t.acceleration} description={t.accelerationDesc} />
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={accelerationValue}
                  onChange={(event) =>
                    setAccelerationValue(Number(event.target.value))
                  }
                />
                {accelerationUnit === "g" && accelerationValue > 1.5 ? (
                  <p className="text-xs text-star-400">
                    Sustained acceleration above 1.5 g is likely unsafe for humans.
                  </p>
                ) : null}
                {accelWarning ? (
                  <p className="text-xs text-star-400">{accelWarning}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <label>Unit</label>
                <select
                  value={accelerationUnit}
                  onChange={(event) => setAccelerationUnit(event.target.value)}
                >
                  {accelerationUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <InfoTooltip label={t.shipMass} description={t.shipMassDesc} />
              <div className="grid gap-3 md:grid-cols-[1fr_0.6fr]">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={shipMassValue}
                  onChange={(event) => setShipMassValue(Number(event.target.value))}
                />
                <select
                  value={shipMassUnit}
                  onChange={(event) => setShipMassUnit(event.target.value)}
                >
                  {massUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label>{t.shipCostPerKg} (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={shipCostPerKgUsd}
                  onChange={(event) => setShipCostPerKgUsd(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label>{t.fuelCostPerKg} (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={fuelCostPerKgUsd}
                  onChange={(event) => setFuelCostPerKgUsd(Number(event.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label>{t.currency}</label>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="PLN">PLN</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <InfoTooltip label={t.shipPresets} description={t.shipPresetsDesc} />
              <select
                value={selectedShip}
                onChange={(event) => handleShipChange(event.target.value)}
              >
                <option value="custom">Custom</option>
                {ships.map((ship) => (
                  <option key={ship.id} value={ship.id}>
                    {ship.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                {ships.map((ship) => (
                  <button
                    key={ship.id}
                    type="button"
                    onClick={() => handleShipChange(ship.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      selectedShip === ship.id
                        ? "border-star-500 bg-star-500/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={ship.image ?? "/ships/rocket.svg"} alt="ship" className="h-8 w-8" />
                    <div>
                      <p className="text-xs font-semibold text-white">{ship.name}</p>
                      <p className="text-[11px] text-white/60">{ship.maxAccelG} g</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <InfoTooltip label={t.fuelModel} description={t.fuelModelDesc} />
              <select
                value={propulsionEfficiency}
                onChange={(event) => setPropulsionEfficiency(Number(event.target.value))}
              >
                {propulsionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-star-500 px-6 py-3 font-semibold text-space-900 shadow-star transition hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? t.calculating : t.runSimulation}
            </button>
            {error ? <p className="text-sm text-star-400">{error}</p> : null}
          </form>

          <div className="flex flex-col gap-6">
            <section className="glass card bg-nebula">
              <h2 className="text-xl font-display text-star-500">
                {t.timeSpeedSummary}
              </h2>
              {result ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoTooltip label={t.shipTime} description={t.shipTimeDesc} />
                    <p className="text-2xl font-semibold">
                      {result.results.properTimeHuman}
                    </p>
                    <p className="text-xs text-white/50">
                      {result.results.properTimeSeconds} s
                    </p>
                  </div>
                  <div>
                    <InfoTooltip label={t.earthTime} description={t.earthTimeDesc} />
                    <p className="text-2xl font-semibold">
                      {result.results.earthTimeHuman}
                    </p>
                    <p className="text-xs text-white/50">
                      {result.results.earthTimeSeconds} s
                    </p>
                  </div>
                  <div>
                    <InfoTooltip label={t.peakVelocity} description={t.peakVelocityDesc} />
                    <p className="text-2xl font-semibold">
                      {result.results.vmaxFractionC ?? "n/a"} c
                    </p>
                    <p className="text-xs text-white/50">
                      {result.results.vmaxMs} m/s
                    </p>
                  </div>
                  <div>
                    <InfoTooltip label={t.rapidity} description={t.rapidityDesc} />
                    <p className="text-2xl font-semibold">
                      {result.results.rapidity}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-white/60">Run a simulation to see the results.</p>
              )}
              {result?.rangeResults ? (
                <div className="mt-4 rounded-2xl border border-white/10 p-3 text-xs text-white/60">
                  <p>Min distance: {result.rangeResults.minDistanceMeters} m</p>
                  <p>Max distance: {result.rangeResults.maxDistanceMeters} m</p>
                  <p>Earth time: {result.rangeResults.earthTimeMin} - {result.rangeResults.earthTimeMax}</p>
                  <p>Ship time: {result.rangeResults.shipTimeMin} - {result.rangeResults.shipTimeMax}</p>
                </div>
              ) : null}
            </section>

            <section className="glass card">
              <h2 className="text-xl font-display text-star-500">{t.energyDemand}</h2>
              {result ? (
                <div className="mt-4 grid gap-4">
                  <div>
                    <InfoTooltip label={t.totalEnergy} description={t.totalEnergyDesc} />
                    <p className="text-2xl font-semibold">
                      {result.results.energyJ} J
                    </p>
                    <p className="text-xs text-white/50">
                      {result.results.energyKwh ?? "n/a"} kWh
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">Tsar Bomba</p>
                      <p className="text-lg font-semibold">
                        {result.comparisons.tsarBomba ?? "n/a"}x
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">Global year</p>
                      <p className="text-lg font-semibold">
                        {result.comparisons.globalYear ?? "n/a"}x
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">Sun (1 sec)</p>
                      <p className="text-lg font-semibold">
                        {result.comparisons.sunPerSecond ?? "n/a"}x
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">Ship cost (USD)</p>
                      <p className="text-lg font-semibold">
                        {shipCostDisplay.toLocaleString("en-US", {
                          style: "currency",
                          currency
                        })}
                      </p>
                      {currency !== "USD" ? (
                        <p className="text-xs text-white/50">
                          ${shipCostUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">Fuel cost ({currency})</p>
                      <p className="text-lg font-semibold">
                        {fuelCostDisplay
                          ? fuelCostDisplay.toLocaleString("en-US", {
                              style: "currency",
                              currency
                            })
                          : "n/a"}
                      </p>
                      {currency !== "USD" && fuelCostUsd ? (
                        <p className="text-xs text-white/50">
                          ${fuelCostUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">Total cost ({currency})</p>
                      <p className="text-lg font-semibold">
                        {totalCostDisplay.toLocaleString("en-US", {
                          style: "currency",
                          currency
                        })}
                      </p>
                      {currency !== "USD" ? (
                        <p className="text-xs text-white/50">
                          ${totalCostUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 p-4">
                      <InfoTooltip label={t.fuelMass} description={t.fuelMassDesc} />
                      <p className="text-lg font-semibold">
                        {result.results.fuelMassKg ?? "n/a"} kg
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 p-4">
                      <p className="text-xs text-white/60">{t.ratioShipFuel}</p>
                      <p className="text-lg font-semibold">
                        {result.results.fuelRatio ?? "n/a"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    Mass-equivalent fuel: {result.results.massEquivalentKg ?? "n/a"} kg
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-white/60">Energy stats will appear here.</p>
              )}
            </section>
          </div>
        </div>

        <section className="glass card">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display text-star-500">
                  {t.velocityProfile}
                </h2>
                <p className="text-sm text-white/60">{t.accelerationDecel}</p>
              </div>
              <div className="mt-4 h-[280px]">
                {result?.chart ? (
                  <VelocityChart chart={result.chart} />
                ) : (
                  <p className="text-white/60">
                    Chart available for finite travel times. Try smaller distances or
                    higher acceleration.
                  </p>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display text-star-500">Lorentz factor</h2>
                <p className="text-sm text-white/60">γ vs time</p>
              </div>
              <div className="mt-4 h-[280px]">
                {result?.chart ? (
                  <GammaChart chart={result.chart} />
                ) : (
                  <p className="text-white/60">Run a simulation to see the chart.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <ChartsPanel
          earthTimeYears={earthYears}
          shipTimeYears={shipYears}
          energyComparisons={result?.comparisons ?? { tsarBomba: null, globalYear: null, sunPerSecond: null }}
          labels={{
            chartTimeSplit: t.chartTimeSplit,
            chartTimeSplitDesc: t.chartTimeSplitDesc,
            chartEnergyComparisons: t.chartEnergyComparisons,
            chartEnergySplitDesc: t.chartEnergySplitDesc
          }}
        />

        <section className="glass card">
          <div className="flex items-center gap-3">
            <button
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition ${
                libraryTab === "ships"
                  ? "border-star-500 text-star-500"
                  : "border-white/15 text-white/60"
              }`}
              onClick={() => setLibraryTab("ships")}
            >
              {t.ships}
            </button>
            <button
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition ${
                libraryTab === "scenarios"
                  ? "border-star-500 text-star-500"
                  : "border-white/15 text-white/60"
              }`}
              onClick={() => setLibraryTab("scenarios")}
            >
              {t.scenarios}
            </button>
          </div>
          <div className="mt-6">
            {libraryTab === "ships" ? (
              <ShipBrowser
                ships={ships}
                selectedId={selectedShip}
                onSelect={(id) => handleShipChange(id)}
                title={t.shipBrowserTitle}
              />
            ) : null}
            {libraryTab === "scenarios" ? (
              <ScenarioBrowser
                current={{
                  distanceValue,
                  distanceUnit,
                  accelerationValue,
                  accelerationUnit,
                  shipMassValue,
                  shipMassUnit,
                  propulsionEfficiency
                }}
                onApply={(scenario) => {
                  setDistanceValue(scenario.distanceValue);
                  setDistanceUnit(scenario.distanceUnit);
                  setAccelerationValue(scenario.accelerationValue);
                  setAccelerationUnit(scenario.accelerationUnit);
                  setShipMassValue(scenario.shipMassValue);
                  setShipMassUnit(scenario.shipMassUnit);
                  setPropulsionEfficiency(scenario.propulsionEfficiency);
                }}
                title={t.scenarioBrowserTitle}
                saveLabel={t.scenarioSave}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function deriveDistance(body: Body, mode: string, t: Record<string, string>) {
  if (body.distanceLy !== undefined) {
    const warning = mode !== "straight" ? t.distanceModeStarWarning : null;
    return { value: body.distanceLy, unit: "ly", warning };
  }

  const semiMajor = body.semiMajorAxisAu ?? null;
  if (!semiMajor) {
    return { value: body.distanceAuFromEarthAvg ?? 0, unit: "au", warning: null };
  }

  if (mode === "straight") {
    return {
      value: body.distanceAuFromEarthAvg ?? Math.abs(semiMajor - 1),
      unit: "au",
      warning: null
    };
  }

  if (mode === "minmax") {
    const min = Math.abs(semiMajor - 1);
    const max = semiMajor + 1;
    return { value: (min + max) / 2, unit: "au", warning: t.distanceModeRangeWarning };
  }

  if (mode === "hohmann") {
    const r1 = 1;
    const r2 = semiMajor;
    const a = (r1 + r2) / 2;
    const b = Math.sqrt(r1 * r2);
    const perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    return { value: perimeter / 2, unit: "au", warning: t.distanceModeHohmannWarning };
  }

  if (mode === "ephemeris") {
    return { value: body.distanceAuFromEarthAvg ?? Math.abs(semiMajor - 1), unit: "au", warning: t.distanceModeEphemerisWarning };
  }

  return { value: body.distanceAuFromEarthAvg ?? Math.abs(semiMajor - 1), unit: "au", warning: null };
}

function buildDistanceRange(body: Body | null, mode: string) {
  if (!body || mode !== "minmax") return null;
  const semiMajor = body.semiMajorAxisAu;
  if (!semiMajor) return null;
  const min = Math.abs(semiMajor - 1);
  const max = semiMajor + 1;
  return { minValue: min, maxValue: max, unit: "au" };
}
