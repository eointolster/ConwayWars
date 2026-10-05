

https://github.com/user-attachments/assets/8adfb4cb-0ecd-452a-b06d-4d15fc1877ae

# ConwayWars

**2D Conway's Game of Life, with time stored as the third dimension.**

A local desktop web experiment built with Vite, React, TypeScript, and Three.js. Each living cell becomes a solid voxel. Every generation is a horizontal slice; the growing sculpture records the computation's history. There is no backend, API, account, combat system, or runtime dependency on remote assets.

## Run

Use Node.js 22.12+ (tested with 22.17) and npm.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The server binds to loopback only. Stop it with Ctrl+C. Dependencies need an internet connection for the first install; the application runs locally afterwards.

```sh
npm test          # simulation and render-model tests
npm run build    # typecheck and production output in dist/
npm run preview  # serve the production build locally
```

## First exploration

1. Start with the R-pentomino, or select Acorn or Gosper Glider Gun.
2. Use **Top** to edit generation 0: click a grid square to toggle it. Dragging or right-clicking does not paint cells.
3. Press **Play**, wait for a history to grow, then **Pause** and **Fit structure**.
4. Orbit around the column. **Side** makes time visible; **Top** frames the current horizontal footprint. **Isometric** and **Reset view** frame the sculpture diagonally. Fit preserves your viewing direction.
5. Scrub the history slider to inspect an earlier generation. **Return to present** restores the complete retained history. Scrubbing pauses playback and does not mutate the timeline.

Drag to orbit, scroll to zoom, right-drag to pan. Space plays/pauses, N pauses and steps once, R resets (shortcuts are ignored while typing into controls). Hover over a cube for cell coordinates, generation, age, birth/survival, and neighbour count.

## Teams and arenas

Choose **Teams**, then choose **2–5 teams**: Red, Blue, Green, Gold, and Violet. Changing the team count starts a new **Colony ring**: equally sized R-pentomino colonies arranged around the centre. This works with every supported team count. Randomise assigns seeded live cells to equal-width vertical team bands. Neither feature changes binary Conway occupancy.

The original **Opposing gliders**, **Opposing glider guns**, and **R-pentomino vs Acorn** presets remain two-team scenarios. Selecting one switches the count to two; choose Colony ring or Randomise for a larger match. The gun preset requires at least a 96 grid and selects 500-layer retention. All other arenas require at least 48. The UI announces required size changes.

Occupancy remains binary; ownership is a separate byte per cell (`0 = dead`, `1–5 = team IDs`). **Survivors retain their team. Newborns inherit the majority of their three living parents.** If all three parents have different teams, a deterministic hash of cell coordinates and generation chooses one of the sorted parent teams. This avoids assigning every tie to a fixed colour or traversal direction. The same starting state always evolves identically. Team colours never change B3/S23 geometry.

**Faction + age** preserves each team's hue while older layers darken, with a brightness floor for readable history. The existing gold-to-violet Age palette and other colour modes remain available. Team presets select Faction + age; Classic restores the R-pentomino and Age view.

Paint generation 0 using any enabled team or **Erase**. Clicking the same team toggles it off; a different team repaints it. Classic patterns selected within Teams belong to the current paint team (Erase falls back to red). Reset and boundary changes preserve the saved initial ownership.

The statistics table, population traces, share bar, and hover inspector support every enabled team. Statistics follow the **inspected generation**. **Contested births** are births with parents from more than one team in that tick, not cumulative kills. The share bar measures living population, not geographical territory. An empty grid has zero share for every team.

## Victory conditions

Configure **Match rules** before the first generation. Scroll the left controls if needed. Match rules lock once play starts; **Reset** unlocks them and restores the exact edited seed.

| Condition | How it ends |
| --- | --- |
| Sandbox | No automatic ending; original exploration behaviour. |
| Last team alive | Ends when exactly one team still has living cells. |
| Most cells at deadline | At the chosen generation, the largest living population wins. |
| Most births by deadline | At the chosen generation, the highest cumulative births wins. Seed cells do not count. |

The deadline is **1–10,000 generations**, not real seconds: speed, pauses, rendering performance, and history depth cannot alter the outcome. Timed matches continue to their deadline even if only one team remains. Every competitive mode ends in a draw if all teams go extinct. Equal highest scores draw among those teams that actually had cells in generation 0; empty team slots cannot win. Start with at least two populated teams; otherwise Play/Step remain disabled with an explanation. Last-team-alive has no automatic deadline, so a stable multi-team pattern can continue indefinitely.

The engine stops exactly on the deciding generation and displays the winner/draw and final scores. **Replay from seed** restores the same starting cells and clears the result and cumulative scores. History remains inspectable after a match; scrubbing never changes the final result. Starting another preset, changing team count, clearing, inverting, or randomising creates a fresh match. Cumulative births are tracked independently from retained layers, so trimming history does not lose scores. Classic mode ignores match rules.

Lineage tracing, mutation, and different species rules remain outside this milestone.

## Controls and semantics

- **Reset** restores the exact initial state, including your edits; it does not produce a different random seed.
- **Clear**, **Randomise**, **Invert**, pattern selection, grid changes, and boundary changes start a new history. Invert uses the present grid, even while inspecting the past; newly alive cells use the selected paint faction (or red when Erase is selected). Boundary changes reuse the saved initial grid. Grid changes recenter the selected preset, or generate the custom/random grid again using the seed and density. Arena minimum sizes are enforced with a notice.
- Random seed and density changes take effect when you press **Randomise**. Seed is a 32-bit unsigned integer. Mulberry32 produces repeatable starts.
- Presets: Glider, R-pentomino, Acorn, Diehard, Pulsar, Gosper Glider Gun. Selecting the gun on a 32 grid expands the grid to 48 and displays a notice.
- Grid sizes: 32, 48, 64, 96, 128. Boundaries: finite/dead outside, or toroidal wrap on both axes.
- Fixed simulation rate: 1–60 ticks/sec. Rendering uses a separate animation loop. A bounded catch-up policy performs at most four ticks per timer callback, then slows wall-clock progress under load instead of freezing input. Hidden tabs do not accumulate simulation time. The displayed rate is the requested target, not a measured throughput claim.
- Smooth movement is optional, with a 50–300 ms duration. New cells appear at Y=0 immediately. Existing layer transforms ease towards their new age positions. At high tick rates, transitions retarget from the currently displayed position. Large scrub jumps snap.
- Colour modes: faction + age, age (gold present, mint recent layers, then cyan, blue, violet, and slate as layers age), solid, periodic generation hue, neighbour count, birth/survival (mint/violet). Older layers remain opaque. The latest layer receives slight emissive highlighting. Age colours update each tick: gold at age 0, mint at 1, cyan at 5, blue at 12, violet at 25, muted violet at 60, and slate at 150+. Intermediate ages interpolate between these stops; scrubbing recalculates ages relative to the inspected generation.
- Toggle current plane, grid, axes, and generation guides. Generation labels are drawn along the side.
- Statistics show the inspected generation's population/births/deaths, the all-time population peak, stored layer/cube totals, and target rate. The graph covers the retained history, including later stored generations during inspection.
- History inspection is **read-only**. Playback and stepping are disabled until you return to the present. Editing past states and branching are intentionally not included.

## The central invariant

The engine applies only B3/S23 to the previous **2D** grid. It never counts historical cubes as neighbours.

```text
Y = -(selectedGeneration - layerGeneration)

selected generation       Y =  0
one generation earlier    Y = -1
two generations earlier   Y = -2
```

Cube centres are one unit apart vertically; cube side length is 0.89, leaving subtle voxel separation. At rest every layer is exactly at its age-derived Y coordinate. During a visual transition only the display transform interpolates. Simulation state stays discrete.

## Architecture

```text
src/
  simulation/
    ConwayGrid.ts       deterministic engine; initial-state editing/reset
    rules.ts            2D B3/S23 and boundary handling
    history.ts          retained snapshots and depth limits
    patterns.ts         centred standard presets
    arenas.ts           opposing colonies with aligned trajectories
    factions.ts         majority inheritance, three-way ties, team bands
    teams.ts            shared names and palette for up to five teams
    match.ts            victory evaluation and history-independent scoring
    seededRandom.ts     reproducible initial grids
  rendering/
    ConwayScene.tsx     Three.js lifecycle, helpers, hover/edit interaction
    CubeHistory.ts      instanced voxel layers, age transforms, safety cap
    camera.ts           perspective camera framing and presets
    materials.ts        metadata colours and age shading
  components/
    Controls.tsx        initial state, timing, history, appearance
    Statistics.tsx      population and compact SVG history chart
    Timeline.tsx        read-only retained-history exploration
  types/index.ts        snapshot and view contracts
  App.tsx               orchestration and independent fixed-step timer
```

Snapshots hold `Uint8Array` state, neighbour counts, birth flags, and faction ownership, plus `Uint16Array` living-cell indexes. Only living cells are rendered. For generation 1 onward, neighbour metadata describes the **parent grid** used to calculate the cell. Generation 0 is labelled as an initial seed, with neighbours counted within that initial grid.

One `InstancedMesh` per non-empty layer shares cube geometry. Existing instance matrices stay fixed in X/Z; changing time updates the layer transform, not thousands of individual cube matrices. Instance buffers are built only for newly visible/changed layers, and colours only when needed. Bounding volumes skip entire layers during raycasting. Hover is throttled. Paused, settled scenes render only when the view or scene changes. Geometry, materials, textures, controls, and animation callbacks are cleaned up on unmount.

The simulation does not import React or Three.js. Future properties such as lineage or species can be added as compact snapshot channels and separate rule engines, without changing the age-based renderer. Those systems are not implemented.

## Limits

- Retention choices: **25, 50, 100, 200, 500** layers (including the present and empty generations). Oldest snapshots are discarded when the limit is reached or lowered. There is no unlimited option; raising the limit cannot recover discarded layers.
- **350,000 rendered cubes** maximum. Newest layers get priority; the oldest included layer can be partial. A visible warning reports hidden cubes. Stored simulation snapshots are unaffected, and stored-cube statistics still count all retained cells. Lower history depth to render the entire retained structure.
- At the largest grid, the 500-snapshot typed-array payload is at most about 47 MiB, plus the saved seed, object overhead, and renderer buffers. Instanced transforms/colours are about 25 MiB at the rendering cap before driver overhead. Limits bound allocation, not a universal frame-rate guarantee.
- WebGL2 and browser hardware acceleration are recommended. Software rendering can be slow with dense history. Browser inspection here used SwiftShader, not the user's physical GPU; see `VALIDATION.md` for measured limits.
- No persistence/export yet: refreshing the page restores the default R-pentomino and settings.

## Validation

`npm test` covers the required rules, stable block, blinker, glider displacement, finite/toroidal edges, seeded determinism, deterministic history, reset after eviction, presets, and rendering invariants. `VALIDATION.md` records browser checks and screenshots. The production build includes Three.js and can emit Vite's large-chunk advisory; it is a successful build, not an error.

### Automation hooks

`window.render_game_to_text()` reports current/inspected generation, faction counts, history range, mode, and up to 200 current cell coordinates/owners. `await window.advanceTime(ms)` switches to deterministic manual stepping at the selected tick rate (maximum 500 ticks per call). It can step a paused simulation, stops at match endings, refuses to mutate a scrubbed past, and is intended for local browser tests. Play or reset returns to the normal wall-clock scheduler.
