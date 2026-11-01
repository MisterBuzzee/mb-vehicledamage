import {
  AdminPanel,
  entityCoords,
  inventory,
  isNear,
  KeyedCooldowns,
  notify,
  onClientCallback,
  online,
  progressFor,
  resourceExport,
} from "@aicore-fivem/lib/server";
import {
  fail,
  oneArg,
  randomInt,
  readFinite,
  sleep,
} from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { EVENTS, readSettings } from "common/dumpsters";
import { dumpsterSchema } from "./schema";

const core = resourceExport("ai-core");
const panel = new AdminPanel(dumpsterSchema);
const settings = panel.view("settings", readSettings);

const charCooldowns = new KeyedCooldowns();
const dumpsterCooldown = new Map<string, number>();

function keyOf(x: number, y: number, z: number): string {
  return `${Math.round(x * 10)}_${Math.round(y * 10)}_${Math.round(z * 10)}`;
}

onClientCallback(
  EVENTS.search,
  {
    args: ([x, y, z]) => {
      const a = readFinite(x);
      const b = readFinite(y);
      const c = readFinite(z);
      return a === null || b === null || c === null ? null : [a, b, c];
    },
    lock: true,
  },
  (source, x, y, z) => {
    const point = { x, y, z };
    if (!isNear(source, point, 4)) return fail("DUMPSTER_ERR_FAR");

    const now = GetGameTimer();
    const key = keyOf(x, y, z);
    const last = dumpsterCooldown.get(key);
    const cdMs = settings.value.cooldownMinutes * 60_000;
    if (last !== undefined && cdMs > 0 && now - last < cdMs)
      return fail("DUMPSTER_COOLDOWN");

    void search(source, point, key);
    return { ok: true };
  },
);

async function search(
  source: number,
  point: { x: number; y: number; z: number },
  key: string,
): Promise<void> {
  const done = await progressFor(source, {
    label: Locale("DUMPSTER_SEARCHING"),
    duration: settings.value.searchSeconds * 1000,
    anim: { dict: "mini@repair", clip: "fixing_a_player" },
    face: point,
    canCancel: true,
    freeze: true,
    disable: { move: true, combat: true },
  });
  if (!done) return;

  if (!isNear(source, point, 4)) return;

  dumpsterCooldown.set(key, GetGameTimer());

  // Roll for whether this dumpster has anything at all.
  if (randomInt(0, 99) >= settings.value.findChance) {
    notify(source, Locale("DUMPSTER_EMPTY"), "info");
    return;
  }
  const amount = randomInt(
    settings.value.minCash,
    Math.max(settings.value.minCash, settings.value.maxCash),
  );
  if (amount > 0) core.AddMoney(source, "cash", amount, "dumpster");

  const stashName = `dumpster_${key}`;
  if (settings.value.useStash) {
    inventory.registerStash(
      stashName,
      "Dumpster",
      settings.value.stashSlots,
      settings.value.stashWeight,
    );
    for (const entry of settings.value.loot) {
      const count = randomInt(entry.min, Math.max(entry.min, entry.max));
      if (count > 0) inventory.addItem(stashName, entry.name, count);
    }
    // Give the inventory a tick to register the stash before opening it.
    await sleep(100);
    if (!inventory.openInventory(source, stashName)) {
      notify(source, "Could not open the dumpster", "error");
    }
  } else {
    const found: string[] = [];
    for (const entry of settings.value.loot) {
      const count = randomInt(entry.min, Math.max(entry.min, entry.max));
      if (count > 0) {
        inventory.addItem(source, entry.name, count);
        found.push(`${entry.name} x${count}`);
      }
    }
    const parts: string[] = [];
    if (amount > 0) parts.push(`$${amount}`);
    if (found.length > 0) parts.push(found.join(", "));
    notify(
      source,
      parts.length > 0 ? `Found ${parts.join(" and ")}` : Locale("DUMPSTER_EMPTY"),
      parts.length > 0 ? "success" : "info",
    );
  }
  if (amount > 0 && settings.value.useStash) {
    notify(source, `Found $${amount}`, "success");
  }
}