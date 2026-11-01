# mb-dumpsters

Dumpster search for AI Core: players search dumpsters for cash and loot items, with a server-timed progress bar, per-dumpster cooldown, and an optional stash pickup mode. Admins configure everything in the in-game admin panel.

Part of [AI Core](https://aifivem.com): a TypeScript FiveM framework where every script is configured in one in-game admin panel, and ESX, QBCore and Qbox scripts run unchanged.

## Features

- **Target interaction** on common dumpster models (`prop_dumpster_01a/02a/02b/03a`) via ai-target (ox_target compatible).
- **Server-timed search** with a progress bar; the player is frozen and can cancel mid-search (no rewards on cancel).
- **Cash payout** with configurable min/max.
- **Item loot table** (admin-defined): each entry rolls a random count between min and max.
- **Find chance**: percent chance a search actually finds anything; otherwise the dumpster is empty.
- **Per-dumpster cooldown** (configurable minutes) — the same dumpster can't be re-searched until it cools down; different dumpsters are independent.
- **Stash mode** (admin toggle): loot goes into a per-dumpster stash the player picks from instead of straight to inventory.
- **Stash settings**: slots and weight configurable.
- **Multi-language**: English, Spanish, French, German, Portuguese.

## Install

1. Put this folder in `resources/[ai]/` (or `[mb]/`).
2. Add `ensure mb-dumpsters` to `server.cfg` after `ensure ai-core` and `ensure ai-target`.
3. Restart the server. Settings live in the in-game admin panel (`/aiadmin`), not in config files.

Needs `ai-core` and `ai-target`.

## Usage

- Walk up to a dumpster and press the interaction key (default E) to search it.
- `/aiadmin` → Dumpsters tab to configure search time, cooldown, cash range, find chance, stash mode, and the loot item list.

## Configuration (admin panel)

| Setting | Description |
| --- | --- |
| Search time | Seconds the search progress bar runs. |
| Cooldown | Minutes before the same dumpster can be searched again. |
| Min/Max cash | Cash range paid out on a successful find. |
| Find chance | Percent chance a search actually finds something. |
| Use stash | When on, loot goes into a stash the player picks from. |
| Stash slots / weight | Capacity of the dumpster stash. |
| Loot items | List of items (name, min count, max count) rolled on a find. |

## Development

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run build       # tsdown + aicore-client-errors
bun run dev         # watch mode
```

## License

GPL-3.0-only.