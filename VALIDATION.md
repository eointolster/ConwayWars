# First milestone validation

Validated locally on 16 September 2026. Nothing was deployed externally.

## Automated checks

- `npm test`: **20 passed** across simulation and render-model suites, using Vitest 4.1.11.
- `npm run build`: **passed**, including strict TypeScript checking. Vite reports its standard >500 kB chunk advisory for the bundled Three.js application (about 761 kB minified / 207 kB gzip JavaScript).
- Final npm installation audit: **0 vulnerabilities**. Updated the test runner to its patched release; a regular subsequent npm install completed successfully.
- Renderer tests run without WebGL and independently assert exact Y positions, visual interpolation, non-destructive scrubbing, and a hard 350,000-cube limit with newest-first priority.

## Browser checks

Used the available Playwright browser connector after the CLI wrapper could not reach npm from its sandbox. Inspected actual rendered screenshots at 1440 × 1000, not just DOM output.

- Initial scene: clear grid, centred R-pentomino, dark full-scene layout and compact controls.
- Canvas editing in top view: clear → click gave population 1 → same click gave 0.
- Seed 428719, 48 × 48, density 28%: random population 646 on repeated starts; reset after stepping restored 646.
- Play/pause/step: advancing generation and retained layers visible in the scene. Production build confirmed step pauses playback.
- R-pentomino: generation 84, 85 layers and 3,276 cubes; inspected the actual time column, age shading, voxel separation and guides.
- Timeline: generation 84 → inspect 25 → return to 84. Play disabled during inspection; later history retained.
- 64 × 64 toroidal seeded random: reached generation 143, **144 retained layers and 65,744 stored/rendered living cubes**, population 281.
- Hover returned actual historical metadata: cell 47,48; generation 88; age 55; newborn; three neighbours in its parent grid.
- All five colour modes switched successfully. Current plane, grid, axes, guides and smooth-motion toggles exercised.
- History trimmed from 144 layers to 25: retained range became 119–143, stored cubes 6,990. Scrubbing to 119 worked.
- Glider gun on a 32 grid automatically selected 48 and displayed the explanatory notice.
- Production build served via `npm run preview`: keyboard N advanced 1 → 2 with a button focused; R restored 0. Play and step tested again.
- Orbit, zoom, and right-drag pan each changed the rendered image. All camera presets and fit exercised.
- Final production browser console: **0 errors, 0 warnings**. Initial development favicon 404 was fixed by adding a local SVG icon.

## Performance boundary

The automated browser reports **ANGLE / Vulkan SwiftShader (Subzero)**, a software renderer. A 30-frame sample while the 65,744-cube scene was continuously rendering measured about 580 ms/frame (maximum 620 ms). This is a software-rendering limitation and **not evidence of hardware-GPU frame rate**. The subsequent renderer change avoids redrawing settled paused scenes unless the camera, scene, or animation changes. Dense moving-history performance on the user's physical GPU is still unmeasured. The fixed-timestep catch-up cap deliberately slows wall-clock evolution when overloaded.

## Visual artifacts

Local, ignored validation output:

- `output/playwright/initial.png`
- `output/playwright/history.png`
- `output/playwright/side.png`
- `output/playwright/64-grid-history.png`
- `output/playwright/production.png`

Browser automation and temporary development/preview servers were closed after validation. Restart with `npm run dev`.

## Age-colour update — 17 September 2026

Age mode now uses neutral instance colours and an age-dependent layer palette: gold present, mint recent history, then cyan, blue, violet, and slate. This removes the previous mint multiplication that obscured the age gradient. Updated the on-screen legend and README. Existing 20 tests and production build pass. Inspected the production build at generation 72, including switching Solid → Age and scrubbing backwards/returning. No browser console errors. Screenshot: `output/playwright/age-colours.png`. The temporary preview server and browser were closed afterwards.

## Two-faction milestone — 17 September 2026

- `npm test`: **30 tests passed**. Added both majority outcomes, minority-colour survival, same-faction versus contested births, wrapped inheritance, per-faction population conservation, unchanged binary evolution over 100 ticks under both boundaries, deterministic faction history, paint/erase/reset, arena populations, real mixed-parent arena interactions, and a 500-generation gun comparison against isolated colonies.
- `npm run build`: passed. Standard Three.js large-chunk advisory remains; final bundle approximately 769 kB / 209 kB gzip.
- Ran the web-game skill's actual Playwright client twice. Inspected screenshots and JSON state. Final glider run reached generation 30, 31 layers, 268 cubes, and a stable block with two red/two blue cells. No error artifact was produced.
- Production browser: opposing gliders first recorded **2 contested births at generation 22**, population red 4 / blue 4, births 2 each, deaths 3 each. The DOM faction table matched `render_game_to_text`.
- Gun arena at generation **500**: grid 96, retained generations 1–500, **92,726 cubes**, red 115 / blue 115. Side-view sculpture inspected. Contested births are per tick (zero at tick 500); the engine test proves mixed births occurred earlier and combined geometry diverged from isolated streams.
- R-pentomino vs Acorn at generation 90: red 67 / blue 20. Scrubbing to 25 changed the statistics to red 39 / blue 40, disabled playback, and preserved future layers on returning.
- Canvas editing: painted one blue cell, recoloured it red, then erased it. Seeded 48-grid random start gave red 317 / blue 329. Reset after stepping restored the sampled cells and full population counts; boundary change preserved initial ownership. Unit tests compare full arrays.
- Production mode round trip: Classic restored R-pentomino / Age / 5 cells, normal step reached 1; Two factions restored the glider arena; wall-clock play/pause advanced normally and reset restored 5 cells per faction. Age/Faction colour switching checked.
- Fixed short-window statistics overlap and equal-population chart traces (blue is dashed).
- Final production console: **0 errors, 0 warnings**. Automated GPU remains SwiftShader; no physical-GPU performance claim.
- New artifacts: `output/playwright/opposing-guns-500.png`, `chaotic-arena.png`, `glider-collision.png`, and `faction-client-final/{shot-0.png,state-0.json}`.
- Temporary servers on 5176 and 4176 and the test browser were closed after validation. No user-owned server was stopped.

## Five teams and match endings — 17 September 2026

- **40 tests passed**, including new three-parent tie handling, 2–5-team arena placement, five-team deterministic evolution under both boundaries, unchanged Conway geometry, exact match deadlines, score persistence after history eviction, replay, last-team victory, extinction draws, tied results, and exclusion of unseeded teams from zero-score ties.
- Production build passed. Standard bundled-Three.js size advisory remains (~774 kB minified / 211 kB gzip JavaScript).
- Browser five-team Colony ring, population deadline 60: stopped exactly at generation 60. Green won with 66 cells; final populations Red 57, Blue 41, Green 66, Gold 62, Violet 18. Screenshot inspected: `output/playwright/five-team-victory.png`.
- Scrubbing the finished match to generation 20 preserved its final result. Replay restored generation 0 and cleared scores/result.
- Browser most-births match at requested 60 ticks/s stopped exactly at generation 10, paused automatically, and reported a five-way draw at 40 births each.
- Gold and Violet cells painted successfully. A single-team seed blocked competitive Play. Two isolated teams died simultaneously and produced a generation-1 extinction draw; Step was disabled afterwards.
- Production browser: switching 3 → 4 → 5 teams created 15 → 20 → 25 seed cells with the correct enabled owners. A red R-pentomino and an isolated violet cell produced Red's last-team-alive victory at generation 1, with a matching result banner.
- Actual web-game skill Playwright client completed a 15-generation arena run; screenshot and text state inspected, no error file produced. Final production console: 0 errors / 0 warnings.
- Software rendering only; physical-GPU performance remains unmeasured.
- Test browser and temporary servers on 5177 and 4177 closed after validation.
