# mb-dumpsters

Dumpster search: target option on common dumpster models, server-timed search with cancel/freeze, cash + item loot, per-dumpster cooldown, empty chance, optional stash pickup. Depends on ai-core (money, prompts, progress, inventory) and ai-target (model option).

## Contracts

- Callbacks: `resource/common/dumpsters.ts` (`EVENTS.search`).
- Settings: `searchSeconds`, `cooldownMinutes`, `minCash`, `maxCash`, `findChance`, `useStash`, `stashSlots`, `stashWeight`, `loot`.

## Entry points

- Client interaction point `resource/client/index.ts`; search and rewards `resource/server/index.ts`.