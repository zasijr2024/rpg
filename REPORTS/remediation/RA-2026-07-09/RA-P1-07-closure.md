# RA-P1-07 Closure: Dedicated World Layout

Date: 2026-07-10  
Authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`

World no longer inherits the Room/Path play-column constraint. The dedicated World shell expands to a desktop-wide 1180px cap, makes the full 61x61 ASCII map the primary surface, and keeps World status, landmark interaction, directional movement, return, and notifications in an adjacent stable sidebar. Constrained layouts stack those same regions without compressing the map.

The map retains original glyphs, visibility masking, and click/swipe/keyboard interaction, while its cell geometry is now readable at 15px monospace with 11px line height. Scenario-seeded browser tests perform actual World movement at Chromium 1366 and 1920 under 100/125/150/200% zoom. Visual World baselines were regenerated at 1366, 1920, 2560, and 3840.

Verification: 410 unit tests passed; 269 Playwright tests passed with 115 intentional project skips; build, lint, and format passed.
