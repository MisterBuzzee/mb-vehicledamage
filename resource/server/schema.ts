import type { PanelSchema } from "@aicore-fivem/shared";

export const vehicleDamageSchema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "car-burst",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        globalSeverity: { type: "number", min: 0, max: 2, optional: true },
        minorDeltaV: { type: "number", min: 0, max: 100 },
        moderateDeltaV: { type: "number", min: 0, max: 100 },
        severeDeltaV: { type: "number", min: 0, max: 100 },
        smokeAtEngineHP: { type: "number", min: 0, max: 1000 },
        fireAtEngineHP: { type: "number", min: 0, max: 1000 },
        tireItem: { type: "text", min: 2, max: 32 },
        tireRepairAll: { type: "bool" },
      },
    },
  },
  tabs: [
    {
      id: "settings",
      file: "settings",
      icon: "sliders",
      label: "ADMIN_TAB_SETTINGS",
      desc: "ADMIN_TAB_SETTINGS_DESC",
      cards: [
        {
          icon: "sliders",
          title: "ADMIN_C_SETTINGS",
          desc: "ADMIN_C_SETTINGS_DESC",
          fields: [
            { widget: "number", path: "globalSeverity", label: "ADMIN_F_SEVERITY", min: 0, max: 2, unit: "x" },
            { widget: "number", path: "minorDeltaV", label: "ADMIN_F_MINOR", min: 0, max: 100, unit: "m/s" },
            { widget: "number", path: "moderateDeltaV", label: "ADMIN_F_MODERATE", min: 0, max: 100, unit: "m/s" },
            { widget: "number", path: "severeDeltaV", label: "ADMIN_F_SEVERE", min: 0, max: 100, unit: "m/s" },
            { widget: "number", path: "smokeAtEngineHP", label: "ADMIN_F_SMOKE", min: 0, max: 1000 },
            { widget: "number", path: "fireAtEngineHP", label: "ADMIN_F_FIRE", min: 0, max: 1000 },
            { widget: "text", path: "tireItem", label: "ADMIN_F_TIRE_ITEM" },
            { widget: "switch", path: "tireRepairAll", label: "ADMIN_F_TIRE_REPAIR_ALL" },
          ],
        },
      ],
    },
  ],
};