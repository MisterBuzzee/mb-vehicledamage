export interface VehicleDamageSettings {
  globalSeverity: number;
  minorDeltaV: number;
  moderateDeltaV: number;
  severeDeltaV: number;
  powerLossMinor: number;
  powerLossModerate: number;
  powerLossSevere: number;
  engineHitMinor: number;
  engineHitModerate: number;
  engineHitSevere: number;
  bodyHitMinor: number;
  bodyHitModerate: number;
  bodyHitSevere: number;
  smokeAtEngineHP: number;
  fireAtEngineHP: number;
  screenShakeMinor: number;
  screenShakeModerate: number;
  screenShakeSevere: number;
}

export function readSettings(value: unknown): VehicleDamageSettings {
  const v = (value ?? {}) as Record<string, unknown>;
  const n = (k: string, d: number) => (typeof v[k] === "number" ? (v[k] as number) : d);
  return {
    globalSeverity: n("globalSeverity", 1.1),
    minorDeltaV: n("minorDeltaV", 3.5),
    moderateDeltaV: n("moderateDeltaV", 7.0),
    severeDeltaV: n("severeDeltaV", 12.0),
    powerLossMinor: n("powerLossMinor", 0.12),
    powerLossModerate: n("powerLossModerate", 0.3),
    powerLossSevere: n("powerLossSevere", 0.6),
    engineHitMinor: n("engineHitMinor", 60),
    engineHitModerate: n("engineHitModerate", 200),
    engineHitSevere: n("engineHitSevere", 450),
    bodyHitMinor: n("bodyHitMinor", 80),
    bodyHitModerate: n("bodyHitModerate", 220),
    bodyHitSevere: n("bodyHitSevere", 450),
    smokeAtEngineHP: n("smokeAtEngineHP", 450),
    fireAtEngineHP: n("fireAtEngineHP", 220),
    screenShakeMinor: n("screenShakeMinor", 0.25),
    screenShakeModerate: n("screenShakeModerate", 0.55),
    screenShakeSevere: n("screenShakeSevere", 0.95),
  };
}
