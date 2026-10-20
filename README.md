# appledhd

A hand-drawn personal planner — calendar, tasks, hour-tracked goals, menstrual
cycle, budget and a notepad — over your own artwork. Everything lives on the
user's own device; there is no account, no server and no network call.

Built as a web app that ships to iOS and Android via a Capacitor shell.

## Running it

```bash
npm run dev     # http://localhost:3000
npm run build   # static export into ./out
npm run lint
```

## How it is put together

The app is a single static page driving its own navigation stack — not Next.js
file routes. That keeps screen transitions under our control, lets Android's
hardware back button map onto stack pops, preserves state across screens, and
avoids static-export path problems inside a webview.

```
src/
  app/          Next shell: layout, the one page, global CSS, icon, manifest
  lib/
    types.ts      domain records + the persisted/session split
    persist.ts    versioned storage envelope and migrations
    storage.ts    persistence adapter (localStorage now, native driver later)
    actions.ts    pure mutations over PersistedData
    logic.ts      derived values: goal stats, cycle prediction, budget maths
    routes.ts     screens, sheets and the tab/section mapping
  hooks/
    useStore.ts   loads, saves and undoes
    useNav.ts     the navigation stack, synced to browser/OS history
    useNow.ts     live date and clock
  components/
    icons/        the house icon set + the artwork swap point
    screens/      one component per destination
    sheets/       bottom sheets
    ui/           screen chrome and shared primitives
```

### Data

State is split in two. `PersistedData` is written to storage; the current date,
open sheets, scroll position and in-flight drafts deliberately are not — keeping
them out is what stops the app thinking it is still yesterday when reopened.

Anything previously stored is migrated on load by `migrate()` in
[src/lib/persist.ts](src/lib/persist.ts), which parses defensively: a bad field
drops that one record rather than discarding the planner.

### Swapping in the illustrated icons

Every section and brand icon renders through `SECTION_ART` in
[src/components/icons/SectionIcon.tsx](src/components/icons/SectionIcon.tsx).
Change a slot from `{ kind: 'builtin', ... }` to `{ kind: 'asset', src: '/icons/goals.svg' }`,
drop the file into `public/icons/`, and nothing else needs touching. The artwork
spec to hand an illustrator is documented at the top of that file.
