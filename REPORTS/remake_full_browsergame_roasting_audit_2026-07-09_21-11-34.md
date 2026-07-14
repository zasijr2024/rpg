# REMAKE Full Browsergame Roasting Audit

Datum: 2026-07-09  
Audit-Ziel: `F:\ADR20\REMAKE`  
Branch: `remake/parity`  
Basis-Commit: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Arbeitsstand: `phase-3-room-start-1-g8b0938e-dirty`, inklusive der aktuellen uncommitted Phase-8-Aenderungen  
Audit-Profil: GPT-5.6 SOL ULTRA, vier unabhaengige Read-only-Subagents plus lokale Verifikation  

## Executive Verdict

**Urteil: HOLD**  
**Readiness: Prototype**  
**Confidence: hoch**

Das REMAKE ist kein Blender. Datenportierung, headless Engine, Testbreite, Quell-Pinning und die fruehe Room-Outside-Path-Enthuellung sind echte Substanz. Build, Typecheck, Lint, Formatierung, 364 Vitest-Tests und 231 ausgefuehrte Playwright-Faelle laufen sauber.

Aber der integrierte World-Loop ist aktuell nicht nur unvollstaendig, sondern regeltechnisch falsch:

- Ein normal gewonnener Zufallskampf beendet die Expedition und wirft den Spieler auf Path zurueck.
- World-Events pruefen und verbrauchen Ausruestung teilweise im Heimlager statt im getragenen Outfit.
- World und Combat fuehren getrennte HP-Wahrheiten.
- Tod verwirft die Expedition nicht sauber, laesst World aktiv und setzt den originalen Death-Cooldown nicht um.
- Worker-Einkommen tickt effektiv alle 1 statt alle 10 Sekunden.
- Globale Clear-Flags koennen weitere gleichartige Landmarks faelschlich als erledigt markieren.

Das sind keine Balance-Nuancen. Sie brechen Vorbereitung, Risiko, Expedition, Belohnung, Rueckkehr und Progression als zusammenhaengenden Spielkreislauf. Weitere Setpiece-/Executioner-Breite vor der Reparatur wuerde nur mehr Content an falsche Runtime-Vertraege haengen.

**Was zuerst bricht:** Der erste normale World-Encounter. Der Spieler gewinnt und wird statt in die laufende Expedition zurueck auf Path geschickt. Selbst wenn das repariert wird, koennen korrekt mitgenommene Gegenstaende an Event-Gates nicht zaehlen, Combat zeigt andere HP als World, und Tod committed bereits veraenderte World-Zustaende.

**Was am staerksten ist:** Die source-backed Datenbasis und die Testbarkeit. Der aktuelle Code ist reparierbar, ohne einen Rewrite zu rechtfertigen.

## Scorecard

| Bereich | Score | Confidence | Kurzurteil |
| --- | ---: | --- | --- |
| Game / Core Loop | 3/10 | hoch | Room bis World funktioniert, die Expedition als System nicht |
| Code / Runtime | 4/10 | hoch | Gute Grenzen, aber falsche Autoritaeten und teure Snapshots |
| UI / UX | 5/10 | hoch | Sparse Identitaet sitzt, World und Keyboard/A11y nicht |
| Balance / Economy | 3/10 | hoch | Originalwerte vorhanden, Live-Takt und Ressourcenfluss falsch |
| Progression | 4/10 | hoch | Fruehe Reveal-Kurve gut, World-Rueckkehr und Late Game gebrochen/offen |
| Features | 4/10 | hoch | Viele isolierte Slices, kein kompletter spielbarer Spine |
| Tests / Tooling | 7/10 | hoch | Viel echte Abdeckung, aber Cross-Runtime-Invarianten fehlen |
| Planung / Delivery | 4/10 | hoch | Klare Vision, aber narrative Gates und falsche Sequenzierung |

Die Scores werden nicht gemittelt. Ein gruenes Testpaket hebt keine Criticals im Core Loop auf.

## Scope und Methodik

Geprueft wurden:

- Game Loop, Session Loop, Expedition, Combat, Economy, Progression und Pacing
- Feature-Reife und Erreichbarkeit von Room, Outside, Path, World, Events, Combat und Late Game
- React-UI, responsive Desktop-Layouts, World-Darstellung, Fokus und Accessibility
- Engine-Grenzen, State-Ownership, Timer, RNG, Saves, Runtime-Performance und Bundle
- Unit-, Integrations-, E2E-, Visual-, Parity- und Architekturtests
- Plan, Status, Parity-Checkliste, Source-Baseline, Defer-Vertraege und Phase-Gates

Evidenzreihenfolge:

1. Reproduziertes Runtime-Verhalten und Benchmarks
2. Ausgefuehrte Build-/Test-Gates
3. Aktueller Source mit Datei- und Zeilenreferenzen
4. Projektplanung und Statusdokumente
5. Explizit markierte Risiken oder Unbekannte

Vier unabhaengige Audit-Linsen wurden verwendet:

- Systems und Balance
- Player und UI
- Code und Runtime
- Product und Scope

Der Hauptaudit hat Critical-/High-Befunde gegen den aktuellen Source und, wo relevant, gegen `ORIGINAL/` gegengeprueft und Dubletten nach Root Cause zusammengefuehrt.

## Findings nach Severity

### Critical C-01: Ein gewonnener Zufallskampf beendet die World-Expedition

**Typ:** Verified defect  
**Bereiche:** Core Loop, Combat, Progression

`EventRuntime.combatLeaveReturnsHome()` behandelt jede Combat-Scene ohne explizites `leave.nextScene` als Heimkehr (`REMAKE/src/engine/events/EventRuntime.ts:428`). `CombatRuntime` fuehrt daraufhin `resolveSafeReturn()` aus, gibt Outfit ins Lager zurueck und setzt den Rueckkehrort auf Path (`REMAKE/src/engine/combat/CombatRuntime.ts:209`, `REMAKE/src/engine/combat/CombatRuntime.ts:538`). Der bestehende Test schreibt dieses Verhalten sogar als Erwartung fest: Nach einem gewonnenen `snarling-beast`-Encounter sind Location `path` und World inaktiv (`REMAKE/src/tests/engine/game-session.test.ts:293`).

Im Original schliesst ein normaler Encounter lediglich das Event und laesst die Expedition weiterlaufen (`ORIGINAL/script/events.js:1420`).

**Impact:** Der World-Loop kann nicht wie vorgesehen funktionieren. Nach der dreizuegigen Grace-Phase hat jeder weitere Travel-Tile 20 Prozent Encounter-Chance (`REMAKE/src/content/original/world/worldData.ts:66`, `REMAKE/src/engine/world/WorldRuntime.ts:773`). Unter der vereinfachten Annahme eines geraden Weges liegen die Chancen, Radius 20 ohne einen solchen Abbruch zu erreichen, nur bei etwa `0.8^16 = 2.8%`; bei Radius 28 etwa `0.8^24 = 0.47%`.

**Remediation:** Encounter-Szenen muessen Combat beenden und an derselben World-Position mit unveraendertem Outfit, Wasser, HP und Fight-Counter fortsetzen. Eine echte Safe-Return-Transition darf nur bei Village-Rueckkehr oder expliziten Originalpfaden laufen.

**Verification:** Seeded Encounter auf Distanz 6 gewinnen, Loot nehmen, verlassen und danach `location=world`, `game.world.active=true`, identische Koordinaten und einen weiteren erfolgreichen Move beweisen.

### Critical C-02: Die Expedition hat keine eindeutige Ressourcen- und HP-Autoritaet

**Typ:** Verified defect  
**Bereiche:** Game, Balance, Combat, Events, State Architecture

Beim Embark werden getragene Supplies korrekt aus den Heim-Stores abgezogen (`REMAKE/src/engine/path/PathRuntime.ts:148`). World-Events pruefen normale Kosten danach aber weiterhin gegen `stores[...]` (`REMAKE/src/engine/events/EventRuntime.ts:460`, `REMAKE/src/engine/events/EventRuntime.ts:486`). Wasser wird gegen ein nicht kanonisches `outfit["water"]` oder `stores["water"]` geprueft, obwohl die aktive Expedition `game.world.water` verwendet (`REMAKE/src/engine/events/EventRuntime.ts:473`, `REMAKE/src/engine/world/WorldRuntime.ts:288`).

Reproduzierter Cave-Fall:

- Torch korrekt getragen, im Heimlager 0: Button disabled.
- Torch nur im Heimlager, nicht getragen: Button enabled.

Parallel zeigt World `game.world.health` (`REMAKE/src/engine/world/WorldRuntime.ts:286`), Combat liest und schreibt `character.health` (`REMAKE/src/engine/combat/CombatRuntime.ts:128`, `REMAKE/src/engine/combat/CombatRuntime.ts:1065`). Ein Runtime-Probe zeigte gleichzeitig World-HP 15 und Combat-HP 2.

**Impact:** Die Vorbereitungslast des Path-Systems wird ausgehebelt. Spieler koennen korrekt vorbereitet soft-locken oder unvorbereitet Heimvorrat aus der Ferne verbrauchen. Heilung, Damage und Status koennen zwischen World und Combat widersprechen. Balancewerte sind unter diesen Vertraegen nicht sinnvoll bewertbar.

**Remediation:** Eine typed `ExpeditionState` als einzige Autoritaet fuer HP, Wasser, Outfit, Position, Fight-Cadence, temporare Landmark-Zustaende und Rueckkehr einfuehren. Event-Kosten ueber explizite Expedition-Capabilities abbuchen; Room-Events duerfen weiterhin Stores verwenden.

**Verification:** Matrix fuer Torch, Charm, Grenade, Medicine, Wasser und HP mit `carried-only`, `home-only`, `exact`, `insufficient`; danach Damage -> World -> Food-Heal -> zweiter Fight -> Safe Return -> Re-Embark mit durchgehend identischer HP-Wahrheit.

### Critical C-03: Tod verwirft die Expedition nicht und laesst World weiterleben

**Typ:** Verified defect  
**Bereiche:** Risk/Reward, State Integrity, Progression

Combat-Tod setzt Rueckkehr auf Room und entfernt Outfit, schliesst aber `game.world.active` nicht (`REMAKE/src/engine/combat/CombatRuntime.ts:521`). `GameSession.consumeWorldReturnLocation()` schliesst World nur beim Path-Rueckweg (`REMAKE/src/engine/GameSession.ts:477`). Gleichzeitig mutieren Landmark-, Mask- und Road-Effekte direkt den persistenten `game.world`-State (`REMAKE/src/engine/world/WorldRuntime.ts:469`).

Reproduziert wurden:

- `location=room` bei weiterhin `world.active=true` nach Combat-Tod.
- Vor dem Tod gesetzte `boreholeVisited`-/`B!`-Aenderungen blieben committed.
- `WORLD_DEATH_COOLDOWN = 120` existiert nur als Datenkonstante und Testwert, nicht in der Embark-Runtime (`REMAKE/src/content/original/world/worldData.ts:65`).

Das Original haelt Expeditionaenderungen in `World.state`, verwirft sie beim Tod und committed sie erst bei `goHome()` (`ORIGINAL/script/world.js:918`, `ORIGINAL/script/world.js:948`).

**Impact:** Suicide-Scouting, konservierte Landmark-Fortschritte trotz Tod, reaktivierbare tote Expedition und fehlende Risikokosten. Das ist State-Korruption relativ zum Zielverhalten.

**Remediation:** Expedition als Draft/Snapshot starten. Nur Village-Safe-Return committed Map, Roads, Flags, Blueprints und Loot. Tod verwirft den Draft, deaktiviert World atomar, leert Outfit und startet den 120-Sekunden-Embark-Cooldown.

**Verification:** Map aufdecken und Landmark veraendern, vor Rueckkehr sterben, danach Rollback, inaktive World, verlorenes Outfit und 120 Sekunden gesperrtes Embark pruefen.

### Critical C-04: Worker-Einkommen laeuft effektiv zehnmal zu schnell

**Typ:** Verified defect  
**Bereiche:** Economy, Balance, Pacing, Timer

Worker sind mit Delay 10 definiert (`REMAKE/src/content/original/outside/outsideData.ts:35`). `syncVillageIncome()` ersetzt bei jedem Lauf jedoch das komplette Income-Objekt ohne `timeLeft` (`REMAKE/src/engine/outside/OutsideRuntime.ts:318`). `collectWorkerIncome()` ruft genau diese Funktion vor dem Countdown auf; fehlendes `timeLeft` wird als faellig behandelt (`REMAKE/src/engine/outside/OutsideRuntime.ts:372`).

Zwei unabhaengige Runtime-Probes reproduzierten mit einem Gatherer:

- Holz nach 1 Sekunde: 1
- Holz nach 2 Sekunden: 2
- Holz nach 10 Sekunden: 10

Soll: 1 Auszahlung pro 10 Sekunden. Mit 20 Gatherern entstehen aktuell 1.200 statt 120 Holz pro Minute. Ein 3.000-Holz-Tail schrumpft grob von 25 auf 2,5 Minuten. Der Debug-Multiplikator `income x 10` wird dadurch praktisch zu `x 100` gegenueber dem dokumentierten Originaltakt.

**Impact:** Der gesamte Early-/Midgame-Rhythmus, Gebaeudekosten, Worker-Entscheidungen und der Compass-Zeitpunkt sind verfremdet. Alle Balance-Aussagen auf Live-Session-Basis sind bis zur Reparatur ungueltig.

**Remediation:** Bestehenden Countdown erhalten oder absolute `nextPaymentAt`-Zeitpunkte pro Income-Quelle speichern. Income-Definitionen nur bei Worker-Aenderung neu berechnen.

**Verification:** Ein Gatherer muss bei 1, 2 und 9 Sekunden 0, bei 10 Sekunden 1 und bei 11 Sekunden weiterhin 1 Holz erzeugt haben. Dasselbe fuer konsumierende Jobs und Debug x10 testen.

### High H-01: Globale Clear-Flags konsumieren weitere gleichartige Landmarks

**Typ:** Verified defect  
**Bereiche:** World, Content, Progression

Cave-, Town- und City-Clear-Flags sind global nach Tile-Typ gruppiert (`REMAKE/src/engine/world/WorldRuntime.ts:206`). `applyClearedLandmarkConsequences()` fragt nur, ob irgendein Flag fuer den aktuellen Tile-Typ gesetzt ist; dann wird der aktuelle Tile zum Outpost (`REMAKE/src/engine/world/WorldRuntime.ts:484`). Gleiches Prinzip gilt fuer wiederholte One-off-Typen ueber Visit-Flags.

Reproduziert: Ein bereits gesetztes Cave-Clear-Flag konvertiert eine neu betretene, noch in `scene=start` befindliche Cave zu `P`. Nach einem Clear koennen damit die restlichen Caves, Towns und Cities vorzeitig verschwinden.

**Remediation:** Clear-/Visited-State an Koordinaten oder an die aktive Landmark-Instanz binden. Globale Story-Flags duerfen nicht als Beweis fuer den Clear einer anderen Instanz dienen.

**Verification:** Zwei gleiche Landmarks erzeugen, nur die erste clearen und bestaetigen, dass die zweite unveraendert betretbar bleibt.

### High H-02: Der World-Snapshot blockiert schon vor React laenger als ein Frame

**Typ:** Verified performance defect  
**Bereiche:** Runtime, UI, Performance

Jeder React-Render nimmt einen kompletten Session-Snapshot (`REMAKE/src/ui/App.tsx:47`, `REMAKE/src/engine/GameSession.ts:101`). Der Realtime-Driver erzwingt unabhaengig von sichtbaren Aenderungen alle 250 ms einen Full-App-Refresh (`REMAKE/src/engine/GameSession.ts:92`, `REMAKE/src/engine/clock.ts:144`). `WorldRuntime.snapshot()` baut immer 3.721 Zellen (`REMAKE/src/engine/world/WorldRuntime.ts:276`, `REMAKE/src/engine/world/WorldRuntime.ts:649`); jede Zelle validiert ueber `visible()` wiederholt die komplette 61x61-Maskenstruktur (`REMAKE/src/engine/world/WorldRuntime.ts:600`).

20 warme Snapshot-Messungen auf dem Audit-Host:

- Median: 37,87 ms
- p95: 41,76 ms

Das ist vor React-Reconciliation und sogar dann, wenn World nicht aktiv angezeigt wird. Es widerspricht den eigenen Phase-0.5- und Performance-Gates (`REMAKE/docs/plan.md:447`, `REMAKE/docs/plan.md:1017`).

**Remediation:** Mask/Map einmal validieren, abgeleitete Rows cachen, Domain-Versionen/Dirty-Flags verwenden und nur aktive bzw. geaenderte UI-Regionen snapshotten. Der 250-ms-Poll darf nicht den gesamten App-Baum invalidieren.

**Verification:** Warmer Headless-Snapshot unter 2 ms, Browser-Long-Task-Profil ohne periodische >16-ms-Spikes und Render-Counter fuer inaktive Domains.

### High H-03: Die World-Karte passt nur, weil sie unleserlich komprimiert wird

**Typ:** Verified UX defect  
**Bereiche:** UI, Game Readability, Browser Fit

Die 61x61-Karte wird mit 12px Schrift und 7px Zeilenhoehe in 502x429px gepresst (`REMAKE/src/ui/styles/global.css:510`). In der frischen 1366-Ansicht sind nur wenige Glyphen in der Mitte sichtbar, umgeben von einer grossen leeren Box. Bei Vollaufdeckung werden alle 3.721 Glyphen in dieselbe Flaeche komprimiert. Das Projekt fordert selbst vor voller World-Parity ein dediziertes Wide-Map-Layout (`REMAKE/docs/ui-spec.md:57`).

**Impact:** Die primaere Spieloberflaeche ist anfangs visuell leer und spaeter extrem dicht. Landmark-Suche, Terrain-Lesen und Wegplanung werden anstrengend, obwohl gerade diese Entscheidungen den World-Loop tragen sollen.

**Remediation:** World als eigenen Layout-Modus behandeln: lesbare stabile Zellen, Status und Controls daneben, sinnvoller sichtbarer Ausschnitt oder Zoom/Pan ohne die Originalinformation zu veraendern.

**Verification:** Human-reviewed Screens fuer frische, teilweise und voll aufgedeckte Map bei 1366, 1920 und 100/125/150/200 Prozent Browserzoom.

### High H-04: Die Accessibility-Map ist ein 3.781-Knoten-Punktuationsteppich

**Typ:** Verified accessibility defect  
**Bereiche:** UI, Accessibility

`WorldView` legt die komplette visuelle Grid-Struktur unter ein generisches `aria-label="world map"` (`REMAKE/src/ui/WorldView.tsx:65`). Chromium meldete im Subagent-Probe 3.781 Accessibility-Kinder; `@` war unbenannter Static Text, Landmarks sind nicht fokussierbare Spans (`REMAKE/src/ui/WorldView.tsx:95`). Ein eigener `ariaSnapshot()` des Audits bestand im Kern nur aus Punktuation wie `", .H. ;;@;; ,;; ;"`.

**Impact:** Screenreader-Nutzer erhalten keine brauchbare Position, Richtung oder Landmark-Struktur. Keyboard-Nutzer koennen Landmark-Labels nicht gezielt inspizieren.

**Remediation:** Visuelles Grid fuer Assistive Technology verbergen und eine kompakte parallele Repraesentation anbieten: Position, Terrain, Ressourcen, sichtbare nahe Landmarks, Distanz/Richtung und moegliche Moves.

**Verification:** Begrenzter AX-Tree, benannte Spielerposition, keine Hidden-Tile-Leaks und per Keyboard lesbare Landmark-Liste.

### High H-05: Fokusbesitz bricht bei Combat, Event-Ende und Embark

**Typ:** Verified defect  
**Bereiche:** Keyboard UX, Modal Lifecycle

Der Dialog fokussiert nur bei Event-/Scene-Key-Aenderung (`REMAKE/src/ui/EventPanel.tsx:30`). Der Trap greift nur, wenn Fokus noch auf dem ersten/letzten Button liegt (`REMAKE/src/ui/EventPanel.tsx:348`). Wird der aktive Combat-Button disabled oder entfernt, faellt Fokus auf `body`; Tab kann dann aus dem `aria-modal`-Dialog entkommen. Nach Embark wird World nicht fokussiert; die bestehende E2E muss den World-Container manuell fokussieren, bevor ArrowRight funktioniert (`REMAKE/src/tests/e2e/app.spec.ts:1193`).

Eigener Browser-Probe: Vor dem Event-Ende lag Fokus auf `give 50`; danach auf `BODY` ohne Label.

**Remediation:** Fokus-Lifecycle zentralisieren, Background waehrend Dialogen inert machen, nach dynamischen Action-Aenderungen innerhalb des Modals refokussieren und nach Embark/Return einen semantisch sinnvollen Zielpunkt setzen.

**Verification:** Reine Keyboard-Szenarien fuer Embark -> Move, wiederholte Attack/Cooldown-Zyklen, Victory/Loot/Leave, Event-Ende, Tod und World-Rueckkehr mit Assertion des aktiven Elements.

### High H-06: Produktions-RNG ist eine feste Kassette und Saves speichern ihren Zustand nicht

**Typ:** Verified defect  
**Bereiche:** RNG, Replay, Saves, Content Variation

`createDefaultRng()` verwendet immer den festen Seed `0x1fada462` (`REMAKE/src/engine/rng.ts:34`). Die Produktions-App erstellt `new GameSession()` ohne Laufzeitseed (`REMAKE/src/ui/App.tsx:30`, `REMAKE/src/engine/GameEngine.ts:87`). Zwei unabhaengige frische Browser-Sessions erzeugten im Audit byte-identische 61x61-Weltkarten.

Der Save-Snapshot enthaelt ausserdem keinen RNG-Typ oder RNG-State (`REMAKE/src/engine/GameEngine.ts:36`). Ein Subagent-Probe zeigte nach Reload wieder den ersten statt des naechsten erwarteten RNG-Werts.

**Impact:** Alle Spieler erhalten dieselbe Welt und dieselbe initiale Zufallsfolge. Reload/Save-Load kann Zufall zurueckspulen oder von derselben Save-Datei je nach Prozesszustand unterschiedlich fortsetzen.

**Remediation:** Produktionsseed aus `crypto.getRandomValues()` oder explizitem Run-Seed erzeugen, Seed und aktuellen RNG-State serialisieren und vor Timern/Events wiederherstellen. Tests injizieren weiterhin feste Seeds.

**Verification:** Zwei neue Runs muessen unterschiedliche Maps erzeugen; derselbe explizite Seed muss identisch bleiben; Save/Restore muss die naechsten 100 Draws exakt reproduzieren.

### High H-07: Es gibt viel Late-Game-Breite, aber keinen kompletten spielbaren Spine

**Typ:** Structural product risk  
**Bereiche:** Features, Progression, Roadmap

Phase 6/8 enthaelt bereits grosse fokussierte Setpiece- und Executioner-Kataloge. Gleichzeitig existieren keine player-facing Engine-/UI-Module fuer Ship, Fabricator oder Space; `GameLocationKey` endet bei World/Settings (`REMAKE/src/engine/GameSession.ts:29`). World setzt lediglich Discovery-Flags (`REMAKE/src/engine/world/WorldRuntime.ts:905`). Die README nennt Ship, Fabricator, Space und Ending korrekt als nicht player-reachable (`REMAKE/README.md:9`).

Die einzige frische Browserroute endet nach Compass, einem East/West-Schritt und Rueckkehr (`REMAKE/src/tests/e2e/app.spec.ts:1021`). Sie aktiviert `income x 10` und simuliert bis zu 170 Minuten (`REMAKE/src/tests/e2e/app.spec.ts:1030`, `REMAKE/src/tests/e2e/app.spec.ts:2431`). Tiefere Browserfaelle injizieren Map, Ressourcen, Flags oder Events. Der Full-Playthrough-Smoke ist offen (`REMAKE/docs/parity-checklist.md:297`).

**Impact:** Isolierte Content-Slices koennen gruen sein, waehrend der eigentliche Spielerweg unmoeglich bleibt. Spaete Ship-/Space-Integration kann Annahmen in tausenden Zeilen Content invalidieren.

**Remediation:** Vor weiterer Phase-9/12-Breite einen duennen, representativen Fresh-Save-Spine bis Ship -> Fabricator -> Space -> Ending implementieren. Vorhandenen Content erhalten, aber nicht weiter verbreitern, bis die vertikale Kette steht.

**Verification:** Deterministischer Browserlauf ohne `setState`/forced events bis zum Ending; kontrollierte Zeit und RNG sind erlaubt, direkte Zustandsinjektion nicht.

### High H-08: Die Parity-Autoritaet kann die verbleibende Parity nicht messen

**Typ:** Verified tooling/planning defect  
**Bereiche:** Source Fidelity, Phase Gates

Der Manifest-Extractor scannt `ORIGINAL/script` rekursiv und danach `ORIGINAL/script/events` erneut (`TOOLS/extract_adr_canonical_manifests.ps1:32`). Das aktuelle Manifest enthaelt 130 File-Records, aber nur 123 eindeutige Pfade. Bei Events extrahiert es nur Titel per Regex (`TOOLS/extract_adr_canonical_manifests.ps1:83`), keine Scene-, Button-, Transition-, Effect- oder Reward-IDs. Der Drift-Test prueft nur sechs Originaldateien (`REMAKE/src/tests/content/source-baseline-drift.test.ts:15`).

Damit haben Aussagen wie "all event scene keys represented" keinen maschinenlesbaren Nenner. Gleichzeitig wird Phase 8 als finalized bezeichnet (`REMAKE/docs/plan.md:703`), obwohl ihre Kernzeilen fuer Roads, Landmarks, Outposts und Mines noch `[~]` sind (`REMAKE/docs/parity-checklist.md:208`, `:219`, `:220`, `:221`).

**Impact:** Fehlende Originalzweige koennen mit komplett gruener Suite bestehen. "Finalized" ist kein reproduzierbares Gate, sondern eine narrative Scope-Definition.

**Remediation:** Parser-basierten, deduplizierten Source-Graph fuer Event/Scene/Button/Transition/Effect/Reward erzeugen. Checklisten in atomare Requirement-IDs zerlegen und Phase-Abschluss nur bei null offenen phase-owned IDs auf einem Tag erlauben.

**Verification:** Entfernen oder Aendern einer Originalscene in einer temporaeren Source-Kopie muss Generation/Parity-Test brechen; ein Gate-Command muss Revision, offene IDs und Checks ausgeben.

### Medium M-01: Normaler Village-Return redeemed keine Blueprints

`WorldRuntime.returnHome()` committed Folgen und gibt Outfit zurueck, ruft aber kein Blueprint-Redemption auf (`REMAKE/src/engine/world/WorldRuntime.ts:430`). Redemption existiert nur im faelschlichen Combat-Safe-Return (`REMAKE/src/engine/combat/CombatRuntime.ts:538`). Das Original redeemed vor dem Outfit-Return (`ORIGINAL/script/world.js:974`).

**Impact:** Sechs spaetere Fabricator-Gates koennen als totes Inventar im Store enden.

**Fix/Test:** Redemption in den erfolgreichen Village-Commit verschieben; alle Blueprint-Typen bei Safe Return unlocken, bei Tod nie.

### Medium M-02: Stim-Boost endet nicht nach drei Sekunden

`stim()` setzt `playerBoosted=true`, aber plant kein Ende (`REMAKE/src/engine/combat/CombatRuntime.ts:634`). Cooldown-Berechnung halbiert danach dauerhaft die Waffenzeit (`REMAKE/src/engine/combat/CombatRuntime.ts:1141`). Das Original definiert drei Sekunden. Ein Probe zeigte den Boost nach 3.001 ms weiterhin aktiv.

**Impact:** Sobald Stim erreichbar ist, verdoppelt es die Angriffscadence fuer den Rest des Fights.

**Fix/Test:** `boostExpiresAt` plus Timer und Save-Lifecycle; Assertions bei 2.999, 3.000 und Restore nach 2.000 ms.

### Medium M-03: Background-Zeit wird nicht begrenzt verarbeitet, sondern geloescht

Der Realtime-Driver kappt jeden Sprung auf fuenf Minuten und setzt anschliessend `lastNow` auf die aktuelle reale Zeit (`REMAKE/src/engine/clock.ts:132`, `:149`). Nach einer Stunde suspendiertem Tab verschwinden 55 Minuten dauerhaft.

**Impact:** Fire, Income, Population und Events haengen vom Browser-Throttling ab. Fuer ein idle-nahes Browsergame ist das ein sichtbarer Progressionsunterschied.

**Fix/Test:** Catch-up-Debt in begrenzten Batches abarbeiten oder explizit einfrieren; ein einstundiger Fake-Jump muss eventual exakt dieselben Timerfolgen liefern.

### Medium M-04: Strict TypeScript endet an der wichtigsten Stelle

`GameState` besteht aus `Record<string, unknown>` (`REMAKE/src/engine/state/types.ts:1`). `StateStore` akzeptiert beliebige String-Pfade und `unknown` (`REMAKE/src/engine/state/StateStore.ts:23`); `setPath` erzeugt fehlende Zwischenobjekte still (`REMAKE/src/engine/state/path.ts:27`). Im Engine-Code gibt es rund 217 direkte String-Path-Zugriffe.

**Impact:** Der Compiler konnte weder die HP-/Wasser-Splits noch falsche Pfade verhindern. Mit Phase 9-13 steigt das Risiko ueberproportional.

**Fix/Test:** Schrittweise typed Domain-Facades fuer Expedition, Economy, World und Combat; readonly Reads, Commands fuer Transaktionen und negative Compile-Fixtures fuer ungueltige Pfade.

### Medium M-05: Dev-Saves sind weder robust noch ein Release-Save

`JSON.parse` ist ungefangen (`REMAKE/src/engine/save/devSave.ts:12`), Validierung ist flach (`REMAKE/src/engine/GameEngine.ts:198`) und Restore mutiert State/Clock vor allen nachgelagerten Restore-Schritten (`REMAKE/src/engine/GameEngine.ts:116`). Gleichzeitig sind produktive Saves, Migration und Recovery bewusst bis nach Parity verschoben (`REMAKE/docs/deferred.md:48`).

**Impact:** Korruptes JSON kann Load crashen; Teil-Restore ist moeglich. Noch gravierender fuer die Planung: "Parity Complete" kann laut Definition vor einem belastbaren Save erreicht werden, obwohl das Spiel Stundenprogression besitzt.

**Fix/Test:** `Parity Complete`, `Production Beta` und `Release Candidate` trennen. Schon vor Late Game mindestens atomaren validierten Autosave mit Reset/Quarantine und RNG-State bauen; volle Migrationsgarantie darf post-parity bleiben.

### Medium M-06: Debug-, Test- und Future-Code steckt im Produktionsbundle

Der Build erzeugt einen einzigen JS-Chunk mit 531,23 kB minified / 127,04 kB gzip. `App.tsx` importiert `SpikeLab` statisch (`REMAKE/src/ui/App.tsx:12`); der gebaute Chunk enthaelt `Canvas space prototype`, `testHarness`, `__adrTest`, Penrose und den kompletten Late-Game-Katalog. Vite meldet die >500-kB-Warnung.

**Impact:** Nicht erreichbare Systeme, arbitrary state test hooks und Prototypen belasten Start und Cache. Fuer den aktuellen Parity-Prototyp akzeptiert, aber Phase 8 ist bereits abgeschlossen und der gemessene Snapshot-Pfad ist ebenfalls teuer.

**Fix/Test:** Dev/Test-Harness compile-time ausschliessen; Spike/Late-Game-Module bewusst lazy laden; Bundle-Budget und Startup-Messung als Release-Gate.

### Medium M-07: Kompakte UI-Kontrollen sind zu klein und semantisch unvollstaendig

Path-Steppers sind visuell 14x12px, Worker-Steppers 18x14px (`REMAKE/src/ui/styles/global.css:370`, `:577`). Ein voller Inventar-Probe erzeugte 84 Buttons und 42 initiale Tab-Stops. Weight/Damage und Worker-Income liegen in `title` auf nicht fokussierbaren Rows (`REMAKE/src/ui/PathView.tsx:38`, `REMAKE/src/ui/OutsideView.tsx:97`). Die Location-Navigation benutzt `role=tab`, aber ohne roving tabindex, Arrow/Home/End oder Tabpanel-Beziehungen (`REMAKE/src/ui/App.tsx:129`). Notifications sind kein Live-Log (`REMAKE/src/ui/NotificationLog.tsx:21`).

**Impact:** Sighted-Mouse funktioniert, Keyboard und Assistive Technology zahlen aber hohe Interaktionskosten.

**Fix/Test:** Mindestens 24x24 Hit-Areas bei kompakter Grafik, gruppierte Stepper-Tastatur, fokussierbare Details mit `aria-describedby`, korrektes Tab-Pattern und gezielte Live-Announcements.

### Medium M-08: Die Testmenge ist stark, die integrierte Beweisqualitaet nicht

Positive Seite: 364 Unit-/Integrationschecks und 231 ausgefuehrte Browserfaelle finden viel echte Regression. Negative Seite:

- Worker-Test prueft die erste Auszahlung, nicht die verbotene zweite Sekunde.
- Wasser-Tests erfinden `outfit["water"]` statt den echten World-State zu verwenden.
- Combat-Death-Test startet ausserhalb einer aktiven Expedition.
- Die "organic" Fresh-Route nutzt `income x 10`, Clock-Jumps und endet nach zwei World-Moves.
- Viele tiefe E2E-Routen injizieren Map/Flags/Ressourcen.
- `event-runtime.test.ts` hat 10.972 Zeilen, `event-data-coverage.test.ts` 4.260, `game-session.test.ts` 3.064 und `app.spec.ts` 2.586.

**Impact:** 364 gruene Tests zertifizieren lokale Slices, waehrend Cross-Runtime-Invarianten rot sind. Test-Monolithen erschweren Review und gezielte Ownership.

**Fix/Test:** Tests nach Vertragen schneiden: `ExpeditionTransaction`, `EconomyCadence`, `ResourceAuthority`, `DeathRollback`, `RngResume`, `FreshSpine`. E2E-Evidenz als `fresh-run`, `scenario-seeded`, `headless` oder `visual` labeln.

### Medium M-09: Desktop-Browser bedeutet derzeit nur Chromium und ein schmaler Zoom-Fall

Playwright konfiguriert ausschliesslich Desktop Chrome bei vier Breiten (`REMAKE/playwright.config.ts:15`). Der einzige Zoom-Test setzt CSS `zoom:150%` fuer einen Event-Text (`REMAKE/src/tests/e2e/app.spec.ts:734`), obwohl die UI-Spec 100/125/150/200 Prozent nennt (`REMAKE/docs/ui-spec.md:20`). Visual-Baselines fotografieren meist Component-Locators und beweisen daher nicht die Gesamtkomposition im Viewport (`REMAKE/src/tests/e2e/room-visual.spec.ts:33`).

**Fix/Test:** Vor Release Fresh Spine, Save/Background, Modal/Focus und World in Chromium, Firefox und WebKit; echte Zoom-Matrix und Full-Viewport-Artefakte. Mobile bleibt gemaess Scope deferred.

### Medium M-10: Die Dokumentation ist ehrlich, aber operativ zu monolithisch

`context.md` hat 44.815 Bytes und Zeilen bis 6.303 Zeichen; `plan.md` 52.447 Bytes und Zeilen bis 5.682 Zeichen; `parity-checklist.md` 42.166 Bytes und Zeilen bis 3.517 Zeichen; `changelog.md` 118.145 Bytes. Der aktuelle Phase-8-Abschluss liegt in einem Dirty-Worktree statt auf einem reproduzierbaren Tag.

**Impact:** Statuswahrheit, Historie und Requirement verschmelzen. Reviews und Merge-Konflikte werden unnoetig schwer; "finalized" ist nicht auf eine Revision zurueckfuehrbar.

**Fix/Test:** Kurze phase-owned Requirement-IDs, generierter Status, ein Closure-Tag mit Checkmatrix und Changelog nur als Historie. Ein Command muss Phase, Revision, offene IDs und letzte Gate-Ergebnisse zeigen.

## Game Evaluation

### Core Loop

Die Reveal-Kurve ist die beste Game-Seite des REMAKE:

1. Ein kalter Room und genau eine sinnvolle Aktion.
2. Fire/Builder oeffnen Stores und Outside.
3. Worker und Gebaeude erzeugen die Economy-Schicht.
4. Compass oeffnet Path und Outfitting.
5. Embark oeffnet World, Movement, Survival und Encounters.

Diese Staffelung bewahrt Mystery und vermeidet Dashboard-Spam. Das ist designseitig richtig.

Der Loop bricht aber genau dort, wo die Systeme erstmals zusammenarbeiten muessen. Path-Vorbereitung, World-Ressourcen, Combat, Loot, Tod und Safe Return teilen keine atomare Expedition. Deshalb ist das aktuelle Spiel kein belastbarer Vertical Slice, sondern mehrere gute Slices mit falschen Naehten.

### Motivation und Game Feel

Staerken:

- Sparse Textpraesentation passt zur Originalvision.
- Unlocks aendern den Charakter des Spiels statt nur Zahlen zu vergroessern.
- World fuehrt Risiko, Navigation, Ressourcen und Combat sichtbar zusammen.
- Notifications, Inline-Kosten und klare disabled States geben gutes lokales Feedback.

Schwaechen:

- Der erste normale Encounter kann jede tiefere Expedition beenden.
- Der Worker-Bug beschleunigt Aufbau so stark, dass Kosten und Waiting-Pacing ihre Bedeutung verlieren.
- Der World-Map-Fit macht Exploration visuell schlechter, je mehr Map sichtbar wird.
- Es gibt noch keinen payoff-faehigen Late-Game-Loop und kein Ending.

### Game Verdict

**Aktuell spielbar:** Room -> Outside -> Path -> erster World-Slice.  
**Aktuell nicht glaubwuerdig spielbar:** wiederholte Expeditionen mit korrektem Risk/Reward und tiefem World-Fortschritt.  
**Aktuell nicht completable:** Ship, Fabricator, Space, Ending.

## Balance und Economy

Die Datenwerte sind stark source-backed:

- Compass: 400 Fur, 20 Scales, 10 Teeth (`REMAKE/src/content/original/room/roomData.ts:366`).
- Worker-Definitionen, Inputs und Outputs sind explizit (`REMAKE/src/content/original/outside/outsideData.ts:35`).
- Carry Capacity und Gewichte sind nachvollziehbar (`REMAKE/src/content/original/path/pathWeights.ts:19`).
- World Survival: 1 Wasser pro Move, 1 Food pro 2 Moves, 20 Prozent Fight-Chance nach drei Grace-Moves (`REMAKE/src/content/original/world/worldData.ts:62`).

Die Live-Balance ist trotzdem nicht bewertbar, solange C-01 bis C-04 offen sind. Originalkonstanten plus falscher Takt ergeben keine Originalbalance.

Dominante aktuelle Strategien/Exploits:

- Worker so schnell wie moeglich maximieren, weil alle Produktionsraten effektiv 10x laufen.
- Event-Gates aus dem Heimlager bezahlen statt Carry Capacity zu respektieren.
- Tod zum Aufdecken/Committen von World-Fortschritt missbrauchen.
- Feste RNG-Folge per Neustart/Save-Wissen ausnutzen.

Balance-Score bleibt deshalb 3/10, obwohl die Datenfidelity deutlich hoeher ist.

## Progression Evaluation

### Early Game

Gut: Reveal-Reihenfolge, Kosten, Builder/Outside/Compass-Funnel und Path-Outfit sind klar. Der einzige frische Browserlauf beweist grundsaetzliche Erreichbarkeit.

Nicht bewiesen: Produktions-Pacing bei 1x. Der Test aktiviert `income x 10`; wegen C-04 entspricht das aktuell nicht einmal dokumentiertem x10. Es gibt keine source-vergleichende Milestone-Zeitmatrix fuer Builder, Outside, Compass, erste Expedition, Ship und Ending.

### Midgame / World

Gebrochen durch Encounter-Ejection, Split-HP/-Ressourcen, Landmark-Flag-Kontamination und fehlenden Death-Rollback. Blueprints koennen beim korrekten Return ihr Ziel verfehlen.

### Late Game

Data und fokussierte Harness-Routen existieren, aber keine player-facing Ship-/Fabricator-/Space-Kette. Progression endet faktisch in Flags statt in neuen spielbaren Modulen.

### Progression Verdict

Die Progressionsidee ist stark; die integrierte Progressionswahrheit ist es nicht. Vor Content-Breite braucht das Projekt einen echten Fresh-Spine und eine atomare Expedition.

## Feature-State Matrix

| Feature | Runtime-Status | Design-Wert | Audit |
| --- | --- | --- | --- |
| Room | Working | Load-bearing | Gute fruehe Reveal-/Action-Schicht |
| Outside / Village | Partial | Load-bearing | UI/Worker vorhanden, Income-Takt Critical |
| Path / Outfitting | Working lokal | Load-bearing | Gute UI, aber Event-Ressourcen ignorieren Outfit |
| World Movement / Map | Partial | Load-bearing | Generiert und bewegt, UX/State/Performance defekt |
| Random Encounters | Broken integriert | Load-bearing | Sieg beendet Expedition |
| Combat | Partial | Load-bearing | Breite Mechanik, getrennte HP und Stim-Timerfehler |
| Setpieces / Dungeons | Partial / fragmentiert | Accelerant | Viel Katalog, globale Flags und Fragment-Roulette |
| Executioner | Partial / harness-heavy | Accelerant | Grosse isolierte Breite, kein kompletter Spine |
| Ship | Scaffold / Discovery-Flag | Load-bearing | Keine player-facing Runtime/UI |
| Fabricator | Scaffold / Data | Load-bearing | Keine player-facing Runtime/UI; Blueprint-Return falsch |
| Space | Spike only | Load-bearing | Nicht im Game Loop |
| Ending / Prestige | Data/helper only | Load-bearing | Nicht player-reachable |
| Saves | Dev-only | Release load-bearing | Disposable, kein Autosave/Migration/Recovery |
| Audio | Manifest only / deferred | Accelerant | Scope-konform offen |
| Localization | Inventory only / deferred | Accelerant | Scope-konform offen |
| Mobile / Touch | Deferred | Accelerant | Nicht gegen aktuellen Desktop-Score gewertet |
| Expansion Framework | Contract only | Later | Vor Parity bewusst nicht aktiv |

Ungewichtete Parity-Checkboxen: 199 `done`, 52 `partial`, 21 `open`. Das ist **keine** 73-Prozent-Fertigstellung: Die offenen Punkte enthalten Ship, Fabricator, Space, Ending und Full Playthrough und sind damit wesentlich schwerer als viele erledigte Einzelkonstanten.

## UI / UX Evaluation

### Was funktioniert

- Die erste Ansicht zeigt genau den noetigen Status und eine Aktion.
- Future-Systeme werden nicht vorzeitig geleakt.
- Originalnahe Typografie und sparse Komposition sind konsistent.
- Inline-Kosten sind klarer als reine Hover-Abhaengigkeit.
- Event-Modal, Stores-Separation, disabled States und Desktop-Overflow sind breit getestet.
- 1366 bis 3840 laufen ohne die bisher getesteten visuellen Regressionen.

### Was nicht funktioniert

- World ist visuell zu klein und semantisch zu gross.
- Modal-Fokus kann bei dynamischen Combat-Zustaenden und beim Schliessen auf `body` fallen.
- Embark fokussiert World nicht; Keyboard-Movement startet nicht automatisch.
- Map-Landmarks sind fuer Screenreader/Keyboard nicht sinnvoll inspizierbar.
- Stepper sind pointerseitig winzig und keyboardseitig zu zahlreich.
- Tab-Semantik, Hover-Details und Notification-Live-Feedback sind unvollstaendig.
- Cross-Browser und echte Zoom-Matrix fehlen.

UI-Score 5/10: Das visuelle Konzept ist klarer als der Score vermuten laesst. Der Abzug kommt von der zentralen World-Oberflaeche und nicht von fehlendem Glanz.

## Code / Runtime Evaluation

### Staerken

- React ist vom Engine-Code getrennt; Architekturtest besteht.
- Clock und RNG sind injizierbar und gut testbar.
- Domain-Runtimes existieren fuer Room, Outside, Path, World, Events und Combat.
- Exakte Dependency-Pins, TypeScript strict, Lint, Prettier und produktiver Build sind vorhanden.
- Keine `npm audit`-Vulnerabilities im aktuellen Lockfile.
- Source-derived Content ist deutlich besser strukturiert als ein jQuery-Port.

### Schwaechen

- Die Domain-Grenzen definieren nicht dieselbe Expedition.
- String-Path-State macht Runtime-Vertraege zur Konvention statt zum Typ.
- Full-App-Polling plus 61x61-Neuberechnung verletzt eigene Performance-Gates.
- Save/RNG-Lifecycle ist nicht deterministisch wiederherstellbar.
- Event- und Testkataloge sind monolithisch und verdecken Cross-Domain-Luecken.
- Production Bundle enthaelt Dev-/Spike-/Harness-Code.

Ein Rewrite waere die falsche Reaktion. Die Headless-Grenzen und Tests sind wertvoll. Repariert werden muessen Autoritaeten, Transaktionen und Beweis-Gates.

## Tests / Tooling Evaluation

### Ausgefuehrte Gates

| Check | Ergebnis |
| --- | --- |
| `npm test` | 29 Files, 364 Tests, alle bestanden |
| `npm run build` | bestanden; 531,23 kB JS minified, 127,04 kB gzip; Chunk-Warnung |
| `npm run lint` | bestanden |
| `npm run format:check` | bestanden |
| `npm run test:e2e` | 231 bestanden, 77 projektbedingt uebersprungen, 0 Fehler |
| `npm audit --omit=dev` | 0 Vulnerabilities |
| `npm audit` | 0 Vulnerabilities |
| Globaler `roasting-audit` Validator | bestanden |
| Repo-lokaler `roast` Validator | bestanden |

### Urteil

Die Tests sind ein echter Asset, aber derzeit staerker in Breite als in Vertragsbeweis. Die wichtigsten neuen Regressionstests muessen nicht mehr Content abdecken, sondern die sechs Kerninvarianten:

1. Worker-Cadence
2. Eine HP-/Ressourcen-Autoritaet
3. Encounter resumes World
4. Tod rollt Expedition zurueck
5. Landmark-Instanzen bleiben unabhaengig
6. RNG/Save setzt exakt fort

## Planung / Delivery Evaluation

### Gut

- Source-Baseline ist gepinnt.
- Original, Deviation und Deferred Scope sind getrennt.
- Die Top-Level-README uebertreibt die allgemeine Readiness nicht.
- Phasen und spaetere Module sind sichtbar geplant.
- Desktop-first und Minimalismus sind konsistent.

### Schlecht

- "Finalized for scoped foundation" ist mit `[~]`-Kernanforderungen nicht maschinell gatebar.
- Content-Breite kam vor dem completable Spine.
- Parity-Manifest hat keine Scene-/Transition-Autoritaet.
- Produktionssave und Release Hardening liegen hinter einer Definition von "First Remake finished".
- Closure ist nicht an saubere Tags/Revisionsartefakte gebunden.
- Statusdokumente sind zu gross und zu narrativ, um langfristig Autoritaet zu bleiben.

### Planungsurteil

Phase 9 sollte nicht einfach als "mehr Setpieces" starten. Die naechste Phase muss eine Remediation-/Integration-Phase sein. Danach sollte ein duenner End-to-End-Spine vor weiterer Content-Breite kommen.

## Priorisierter Action Plan

### P0 Now: Core Loop wieder wahr machen

1. **ExpeditionTransaction einfuehren.**
   - Ein State fuer HP, Wasser, Outfit, Position, Mask-Draft, Landmark-Draft, Fight-Cadence.
   - Village committed; Tod verwirft.
   - Exit-Kriterium: kein direkter cross-domain String-Path-Zugriff fuer Expedition-Ressourcen.

2. **Encounter-Return reparieren.**
   - Normaler Sieg resumed World an derselben Position.
   - Nur echte Original-Safe-Return-Pfade verlassen World.
   - Exit-Kriterium: seeded Encounter -> Loot -> Leave -> weiterer Move.

3. **Worker-Takt reparieren.**
   - Countdown/absolute Due-Time erhalten.
   - Exit-Kriterium: 1 Worker = exakt 1 Output pro 10 Sekunden, einschliesslich consuming jobs und Debug-Multiplikator.

4. **Tod atomar machen.**
   - World inactive, Draft verworfen, Outfit verloren, Room aktiv, 120s Embark-Cooldown.
   - Exit-Kriterium: kein World-/Landmark-Commit nach Tod.

5. **Landmark-State instanzieren.**
   - Clear/Visited per Koordinate.
   - Exit-Kriterium: zwei gleiche Landmarks unabhaengig.

6. **P0 Regression Suite.**
   - Keine direkten Test-State-Injections in diesen Vertragsfaellen.
   - Alle sechs Invarianten muessen vor Phase-9-Content gruen sein.

### P1 Next: Vertikalen Spine und Nutzbarkeit beweisen

1. Produktionsseed plus serialisierbarer RNG-State.
2. World-Snapshot cachen und Full-App-250-ms-Render entfernen.
3. Dedicated World Layout plus paralleles accessibles Map-Modell.
4. Fokusbesitz fuer Modal, Combat, Embark, Death und Return.
5. Blueprint-Redemption und Stim-Dauer korrigieren.
6. Duenner Fresh-Save-Spine bis Ship, Fabricator, Space und Ending.
7. Milestone-Pacing Original vs Remake messen: Builder, Outside, Compass, erste Expedition, Ship, Ending.
8. Parser-basierten Parity-Graph und atomare Requirement-IDs einfuehren.

### P2 Later: Production Readiness statt Parity-Fiktion

1. `Parity Complete`, `Production Beta` und `Release Candidate` als getrennte Gates.
2. Atomarer Save, Corruption Recovery, Backup, Migrationstests und RNG-Resume.
3. Chromium/Firefox/WebKit-Matrix und echte Zoom-Gates.
4. Accessibility-Smokes plus realer Screenreader-Test.
5. Test-Monolithen nach Domain-Vertraegen schneiden.
6. Dev-/Harness-/Spike-Code aus Production entfernen und Late Game lazy laden.
7. Bundle-, Startup-, Long-Task- und Long-Idle-Budgets.
8. Phase-Closure auf sauberem Tag mit reproduzierbarer Checkmatrix.

## Staerken, die erhalten bleiben muessen

- Gepinnte Originalquelle und source-backed Konstanten
- Headless Engine statt jQuery-Klon
- Deterministische Test-Clock und injizierbares RNG
- Sparse Reveal- und UI-Philosophie
- Saubere Trennung von Original, Deviation und Deferred Scope
- Breite Unit-/E2E-/Visual-Basis
- Exakte Dependency-Pins und saubere Tooling-Gates
- Ehrlicher Top-Level-Hinweis, dass Late Game nicht player-reachable ist

Die richtige Reparatur ist keine Modernisierungsorgie. Sie ist eine strengere Umsetzung der bereits gewaehlten Architektur: klare Autoritaeten, atomare Transaktionen, messbare Gates.

## Residual Risks und nicht verifizierte Flaechen

- Kein mehrstuendiger echter 1x-Playthrough durch einen Menschen
- Kein kompletter Fresh-Save-Lauf bis Ending
- Kein Firefox-/WebKit-/Safari-Lauf
- Kein realer NVDA-/JAWS-/VoiceOver-Test
- Keine produktive Save-Migration, Quota- oder Corruption-Recovery
- Keine Multi-Seed-Verteilungsanalyse fuer Maps, Encounters und Setpiece-Pfade
- Keine vollstaendige Scene-/Transition-Parity-Autoritaet
- Kein realer Long-Background-/Long-Idle-Browserprofil-Lauf
- Ship, Fabricator, Space und Ending sind noch nicht auditierbar als Player Experience
- Mobile/Touch, Audio und Localization sind gemaess aktuellem Scope deferred und wurden nicht als aktuelle Defekte gewertet

## Final Roast

Das Projekt hat mehr Tests als Spielvertrag. Es hat die Originalzahlen sauber portiert, aber die Systeme, die diese Zahlen sinnvoll machen sollen, sprechen derzeit verschiedene Dialekte: Path glaubt ans Outfit, Events ans Heimlager, World an `game.world.health`, Combat an `character.health`, Tod an persistente World-Aenderungen und die Economy an eine Sekunde, obwohl das Datenblatt zehn sagt.

Die gute Nachricht ist technisch, nicht motivational: Der Code ist testbar genug, um das gezielt zu reparieren. Der falsche naechste Schritt waere mehr Content. Der richtige naechste Schritt ist, die Expedition zu einer einzigen atomaren Wahrheit zu machen und erst danach wieder Breite aufzubauen.
