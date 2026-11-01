import { AdminPanel, inventory, onClientEvent, resourceExport } from "@aicore-fivem/lib/server";
import { createLogger } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { readSettings } from "common/vehicleDamage";
import { vehicleDamageSchema } from "./schema";

const log = createLogger("mb-vehicledamage");
const core = resourceExport("ai-core");
const panel = new AdminPanel(vehicleDamageSchema);
const settings = panel.view("settings", readSettings);

// Register the tire item as usable: repairs the player's vehicle tires.
panel.onChange("settings", () => {
  const item = settings.value.tireItem;
  inventory.registerUsableItem(item, (source) => {
    emitNet("mb-vehicledamage:repairTires", source);
    return true;
  });
});

// Register on start too.
const initItem = settings.value.tireItem;
inventory.registerUsableItem(initItem, (source) => {
  emitNet("mb-vehicledamage:repairTires", source);
  return true;
});

log.info("mb-vehicledamage ready");