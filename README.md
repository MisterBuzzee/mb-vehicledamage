# mb-vehicledamage

Ultra realistic vehicle damage simulation for AI Core. Replaces GTA V's vanilla damage with Delta-V based collisions, progressive mechanical degradation, tire bursts, glass/door/light failures, suspension damage on hard landings, and tire repair via a usable item.

Part of [AI Core](https://aifivem.com): a TypeScript FiveM framework where every script is configured in one in-game admin panel.

## Features

- **Delta-V based collisions**: damage scales with speed change on impact, with angle multipliers (front/rear/side).
- **Mechanical degradation**: progressive engine and body health loss, power/torque reduction.
- **Tire bursts**: side impacts can burst tires; vehicle slows down and max speed is capped temporarily.
- **Glass, doors, lights**: windows shatter, doors break, lights fail on severe impacts.
- **Smoke and fire**: engine smokes at low HP, catches fire at critical HP.
- **Screen shake** per impact severity.
- **Auto-reset on repair**: when a vehicle is repaired (HP jumps), damage state resets.
- **Tire repair item**: usable tire item repairs all tires with a 25s crouching repair animation + progress bar (cancellable).
- **Admin configurable**: all thresholds and chances tunable in the admin panel.

## Install

1. Put this folder in `resources/[ai]/`.
2. Add `ensure mb-vehicledamage` to `server.cfg` after `ensure ai-core`.
3. Make sure the `tire` item exists in your inventory (or change the item name in the admin panel).
4. Restart the server. Settings live in `/aiadmin`.

Needs `ai-core` (and `ai-inventory` for the tire item).

## Configuration (admin panel)

| Setting | Description |
| --- | --- |
| Global severity | Overall damage multiplier (0–2). |
| Minor/Moderate/Severe delta-V | Speed-change thresholds (m/s) for each severity. |
| Smoke at HP | Engine HP below which smoke appears. |
| Fire at HP | Engine HP below which the engine catches fire. |
| Tire item name | Inventory item used to repair tires (default `tire`). |
| Repair all tires | Whether the tire item repairs all tires at once. |

## Development

```bash
bun install
bun run typecheck
bun run build
bun run dev
```

## License

GPL-3.0-only.