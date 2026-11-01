export const DUMPSTER_MODELS = [
  "prop_dumpster_01a",
  "prop_dumpster_02a",
  "prop_dumpster_02b",
  "prop_dumpster_03a",
] as const;

export const EVENTS = {
  search: "dumpster:search",
} as const;

export interface DumpstersLoot {
  name: string;
  min: number;
  max: number;
}

export interface DumpstersSettings {
  searchSeconds: number;
  cooldownMinutes: number;
  minCash: number;
  maxCash: number;
  /** Percent chance (0-100) that a search actually finds something. */
  findChance: number;
  /** When true, loot goes into a stash the player picks from; otherwise straight to inventory. */
  useStash: boolean;
  stashSlots: number;
  stashWeight: number;
  loot: DumpstersLoot[];
}

function readLoot(value: unknown): DumpstersLoot[] {
  if (!Array.isArray(value)) return [];
  const out: DumpstersLoot[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const v = item as Record<string, unknown>;
    const name = typeof v.name === "string" && v.name.length > 0 ? v.name : null;
    if (!name) continue;
    out.push({
      name,
      min:
        typeof v.min === "number" && v.min >= 0 ? Math.floor(v.min) : 0,
      max:
        typeof v.max === "number" && v.max >= 0 ? Math.floor(v.max) : 1,
    });
  }
  return out;
}

export function readSettings(value: unknown): DumpstersSettings {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    searchSeconds:
      typeof v.searchSeconds === "number" && v.searchSeconds > 0
        ? Math.floor(v.searchSeconds)
        : 8,
    cooldownMinutes:
      typeof v.cooldownMinutes === "number" && v.cooldownMinutes >= 0
        ? Math.floor(v.cooldownMinutes)
        : 10,
    minCash:
      typeof v.minCash === "number" && v.minCash >= 0
        ? Math.floor(v.minCash)
        : 10,
    maxCash:
      typeof v.maxCash === "number" && v.maxCash >= 0
        ? Math.floor(v.maxCash)
        : 75,
    findChance:
      typeof v.findChance === "number" && v.findChance >= 0 && v.findChance <= 100
        ? Math.floor(v.findChance)
        : 70,
    useStash: v.mode === "stash" || v.useStash === true,
    stashSlots:
      typeof v.stashSlots === "number" && v.stashSlots > 0
        ? Math.floor(v.stashSlots)
        : 20,
    stashWeight:
      typeof v.stashWeight === "number" && v.stashWeight > 0
        ? Math.floor(v.stashWeight)
        : 50000,
    loot: readLoot(v.loot),
  };
}