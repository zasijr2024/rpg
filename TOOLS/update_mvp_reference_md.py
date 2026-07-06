from __future__ import annotations

from pathlib import Path
import json


ROOT = Path(r"F:\CH70")
EXTRACT = ROOT / "prototypen" / "CH_REFERENZDATEN_MVP_EXTRAKT.json"
OUT = ROOT / "prototypen" / "CH_REFERENZDATEN_MVP.md"


def esc(value) -> str:
    if value is None:
        return ""
    text = str(value)
    return text.replace("|", "\\|").replace("\n", " ")


def table(headers: list[str], rows: list[list[object]]) -> list[str]:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(esc(value) for value in row) + " |")
    return lines


def upgrade_effect(row: dict) -> str:
    fn = row.get("upgradeFunction", "")
    params = row.get("upgradeParams", "")
    if fn == "upgradeHeroPercent":
        hero_id, pct = params.split(",", 1)
        return f"Hero {hero_id} DPS +{pct}%"
    if fn == "upgradeEveryonePercent":
        return f"Global DPS +{params}%"
    if fn == "upgradeClickDpsPercent":
        return f"Click damage +{params}% total DPS"
    if fn == "upgradeClickPercent":
        return f"Cid click damage +{params}%"
    if fn == "upgradeCriticalChance":
        return f"Critical chance +{params}%"
    if fn == "upgradeCriticalDamage":
        return f"Critical damage multiplier +{params}"
    if fn == "upgradeGoldFoundPercent":
        return f"Gold found +{params}%"
    if fn == "upgradeGetSkill":
        return f"Unlock skill id {params}"
    if fn == "finalUpgrade":
        return "Final upgrade / Ascension"
    return f"{fn} {params}".strip()


def main() -> None:
    data = json.loads(EXTRACT.read_text(encoding="utf-8"))
    formula_refs = data["formula_references"]
    core_heroes = data["heroes_core_1_12"]
    heroes_to_amenhotep = data["heroes_to_amenhotep_1_20"]
    upgrades = data["upgrades_core_heroes_1_12_plus_ascension_and_skills"]
    zones = data["zones"]
    skill_unlocks = data["skill_unlocks"]
    achievements = data["achievements_mvp_hooks"]
    ancients = data["ancients_formula_inventory"]

    upgrades_by_hero: dict[int, list[dict]] = {}
    for row in upgrades:
        upgrades_by_hero.setdefault(row["heroId"], []).append(row)
    for rows in upgrades_by_hero.values():
        rows.sort(key=lambda row: (row.get("heroLevelRequired", 0), row.get("id", 0)))

    lines: list[str] = [
        "# CH-Referenzdaten fuer den MVP-Scope",
        "",
        "Stand: 2026-06-29.",
        "",
        "Dieses Dokument sammelt die fuer den CH70-MVP relevanten Clicker-Heroes-Referenzdaten aus dem validierten Webbuild `v1.0e12-6112`. Es ist die technische Nachbaugrundlage fuer die First-Ascension-Baseline aus `PLANUNG.md`.",
        "",
        "Wichtig: Die Unity-`TextAsset`-Tabellen wurden inzwischen aus dem Original-Webbuild extrahiert und bytegenau validiert. Die Tabellenwerte unten stammen aus diesen Originaldaten. Nicht im TextAsset enthalten sind die kompilierten Funktionskoerper der Formel-IDs und einige Laufzeitwerte wie Skill-Cooldowns oder explizite Upgrade-Kaufpreise.",
        "",
        "## Quellenlage",
        "",
        "### Primaere lokale Originaldaten",
        "",
        "- `ORIGINAL/DATEN/clickerheroes_webbuild_6112/extracted/text_assets/`",
        "- `ORIGINAL/DATEN/clickerheroes_webbuild_6112/validation_report.md`",
        "- `ORIGINAL/DATEN/clickerheroes_webbuild_6112/content_validation.json`",
        "- `prototypen/CH_REFERENZDATEN_MVP_EXTRAKT.json`",
        "- Generatoren: `TOOLS/extract_mvp_reference_data.py`, `TOOLS/update_mvp_reference_md.py`",
        "",
        "### Ergaenzende lokale Analyse",
        "",
        "- `ORIGINAL/ANALYSE/03_formeln_und_balancing.md`",
        "- `ORIGINAL/ANALYSE/04_datenmodell.md`",
        "",
        "Community-/Wiki-Quellen sind nur noch Fallback fuer Formel-Bodies oder Laufzeitwerte, die nicht als TextAsset im Build liegen.",
        "",
        "## Ziel-Scope fuer diese Referenz",
        "",
        "Enthalten:",
        "",
        "- Zonen `1-100`, optional bis `1-140`.",
        "- Erste `8-12` Helden als Kern; Helden `13-20` als Referenz bis Amenhotep/Ascension.",
        "- Normale Zonen, Boss-Zonen, Boss-Timer als MVP-Regel.",
        "- Treasure Chests als Gold-Spike.",
        "- Hero Souls und erste Ascension.",
        "- Zweiter Run mit messbar schnellerer Progression.",
        "- Datengetriebene Formel-IDs fuer Kosten, DPS, Monster-HP, Gold, Upgrades und Ascension-Hooks.",
        "",
        "Nicht enthalten:",
        "",
        "- Outsiders, Transcendence, Mercenaries, Missions, Raids, Items, Rubies/Shop.",
        "- Multiplayer und Monetarisierung.",
        "- Originalassets, Originaltexte als Produktinhalt, dekompilierter Code.",
        "",
        "## Webversion-Metadaten",
        "",
    ]

    lines += table(
        ["Feld", "Wert"],
        [
            ["Offizielle Play-URL", "`https://clickerheroes.com/play`"],
            ["Game-Iframe", "`https://cdn.clickerheroes.com/gamebuild/index.php`"],
            ["Build", "`v1.0e12-6112`"],
            ["Engine", "Unity WebGL"],
            ["Canvas", "`1280 x 720`"],
            ["TextAssets", "65/65 bytegenau extrahiert"],
            ["MVP-Extrakt", "`CH_REFERENZDATEN_MVP_EXTRAKT.json`"],
        ],
    )

    lines += [
        "",
        "## Originaldaten-Abdeckung",
        "",
    ]
    lines += table(
        ["Bereich", "Originaldatenstatus", "Konsequenz fuer Prototyp"],
        [
            ["Heldenwerte", "`heroes.json`, 54 Helden", "Kernwerte direkt verwenden."],
            ["Upgrade-Effekte", "`upgrades.json`, 245 Upgrades", "Effekte/Unlock-Level direkt verwenden."],
            ["Upgrade-Kaufpreise", "kein eigenes `cost`-Feld im TextAsset", "Preisformel/Code separat validieren; alte Kosten nicht als original markieren."],
            ["Monster", "`monsters.json`, 137 Monster", "`baseLife`, `baseGold`, Formel-IDs direkt verwenden."],
            ["Zonentypen", "`zones.json`, 13 Zonentypen", "Biome-/Monster-/Boss-Referenzen direkt verwenden."],
            ["Achievements", "`achievements.json`, 170 Achievements", "Zone-/Ascension-Hooks direkt verwenden."],
            ["Formel-Bodies", "kompilierter IL2CPP/WASM-Code", "IDs sind original, mathematische Bodies separat dekompilieren oder bewusst nachbauen."],
            ["Skill-Dauer/Cooldown", "nicht als TextAsset gefunden", "Community-/Analysewerte als temporaere Implementation markieren."],
        ],
    )

    lines += [
        "",
        "## Core Loop",
        "",
        "1. Spieler verursacht Schaden per Klick und Helden-DPS.",
        "2. Monster verlieren HP.",
        "3. Getoetete Monster droppen Gold.",
        "4. Gold kauft Heldenlevel und Upgrades.",
        "5. Heldenlevel und Upgrades erhoehen DPS, Klickschaden, Goldboni oder schalten Skills frei.",
        "6. Nach genug Kills wird die naechste Zone freigeschaltet.",
        "7. Jede 5. Zone ist im MVP eine Boss-Zone mit Timer.",
        "8. Ab Zone 100 koennen Hero-Soul-Ereignisse relevant werden.",
        "9. Amenhoteps Final-Upgrade `ASCENSION` setzt den Lauf zurueck und vergibt pending Hero Souls.",
        "10. Hero Souls machen den naechsten Run schneller.",
        "",
        "## Formel-IDs aus Originaldaten",
        "",
        "Die folgenden Bezeichner sind Originalwerte aus den extrahierten Tabellen. `global-metadata` bedeutet: Der Name kommt als Symbol/String im IL2CPP-Metadatenblock vor. Das ist keine Decompilation des Funktionskoerpers.",
        "",
    ]

    lines += table(
        ["Formula-ID", "Vorkommen", "Dateien", "global-metadata"],
        [
            [
                row["name"],
                row["count"],
                ", ".join(row["files"].keys()),
                "ja" if row["in_global_metadata"] else "nein/DSL-ID",
            ]
            for row in formula_refs
        ],
    )

    lines += [
        "",
        "### MVP-Implementationsformeln",
        "",
        "Diese Formeln bleiben die Implementationsbasis, sind aber nicht als mathematischer Body aus den TextAssets extrahiert. Die Originaldaten validieren die zu verwendenden Formel-IDs und Parameter.",
        "",
        "```text",
        "hero_level_cost(current_level) = floor(floor(baseCost * 1.07 ^ current_level) * cost_reduction)",
        "hero_dps = baseAttack * level * self_upgrade_multiplier * milestone_multiplier * global_dps_multiplier * hero_soul_multiplier",
        "click_damage = cid_click_damage + total_dps * click_damage_from_dps_percent",
        "monster_hp = monsterLifeFormula1(baseLife=10, zone, kind)",
        "monster_gold = monsterGoldFormula1(baseGold, zone, kind) * gold_found_multiplier",
        "hero_souls_from_levels = floor(total_purchased_hero_levels / 2000)",
        "hero_soul_damage_multiplier = 1 + 0.10 * current_unspent_hero_souls",
        "```",
        "",
        "Validierungsbedarf: `monsterLifeFormula1`, `monsterGoldFormula1`, `heroCostFormula1` und Level-Meilensteine muessen gegen Gameplay/Save oder per IL2CPP/WASM-Decompile exakt gemacht werden.",
        "",
        "## Heldenwerte aus `heroes.json`",
        "",
        "### MVP-Kernhelden 1-12",
        "",
    ]

    lines += table(
        ["ID", "Hero", "baseCost", "baseAttack", "baseClickDamage", "costFormula", "attackFormula"],
        [
            [
                h["id"],
                h["name"],
                h["baseCost"],
                h["baseAttack"],
                h["baseClickDamage"],
                h["costFormula"],
                h["attackFormula"],
            ]
            for h in core_heroes
        ],
    )

    lines += [
        "",
        "### Erweiterung bis Amenhotep 13-20",
        "",
    ]
    lines += table(
        ["ID", "Hero", "baseCost", "baseAttack", "Relevanz"],
        [
            [
                h["id"],
                h["name"],
                h["baseCost"],
                h["baseAttack"],
                "Ascension-Gate" if h["id"] == 20 else "Spaeterer First-Ascension-Pfad",
            ]
            for h in heroes_to_amenhotep
            if h["id"] >= 13
        ],
    )

    lines += [
        "",
        "## Upgrade-Daten aus `upgrades.json`",
        "",
        "Originalfelder: `heroLevelRequired`, `upgradeFunction`, `upgradeParams`, `amount`, `attribute`, `upgradeRequired`. Ein explizites Kaufpreisfeld ist im TextAsset nicht vorhanden.",
        "",
    ]

    hero_names = {h["id"]: h["name"] for h in heroes_to_amenhotep}
    for hero_id in list(range(1, 13)) + [20]:
        rows = upgrades_by_hero.get(hero_id, [])
        if not rows:
            continue
        lines += [f"### {hero_names.get(hero_id, 'Hero ' + str(hero_id))}", ""]
        lines += table(
            ["ID", "Level", "Name", "Effekt aus Originalfunktion", "amount", "attribute"],
            [
                [
                    row["id"],
                    row["heroLevelRequired"],
                    row["name"],
                    upgrade_effect(row),
                    row.get("amount", ""),
                    row.get("attribute", ""),
                ]
                for row in rows
            ],
        )
        lines.append("")

    lines += [
        "## Skill-Unlocks",
        "",
        "Skill-Basiswerte fuer Dauer/Cooldown sind nicht als eigenstaendige TextAsset-Tabelle gefunden worden. Die Unlocks sind Originaldaten; Dauer/Cooldown bleiben Implementation-/Wiki-Fallback.",
        "",
    ]
    lines += table(
        ["Skill-ID", "Skill", "Hero", "Unlock Level", "Upgrade-ID"],
        [
            [row["upgradeParams"], row["name"], row["heroName"], row["heroLevelRequired"], row["id"]]
            for row in skill_unlocks
        ],
    )
    lines += [
        "",
        "Temporare MVP-Basiswerte aus bestehender Analyse:",
        "",
    ]
    lines += table(
        ["Skill", "Effekt", "Dauer", "Cooldown", "Status"],
        [
            ["Clickstorm", "10 Klicks/s", "30s", "10min", "nicht TextAsset-validiert"],
            ["Powersurge", "+100% DPS", "30s", "10min", "nicht TextAsset-validiert"],
            ["Lucky Strikes", "+50% Critical Click Chance", "30s", "30min", "nicht TextAsset-validiert"],
            ["Metal Detector", "+100% Gold", "30s", "30min", "nicht TextAsset-validiert"],
        ],
    )

    lines += [
        "",
        "## Zonentypen aus `zones.json`",
        "",
        "Die Datei enthaelt 13 Zonentypen. Fuer den MVP wird der Zyklus `1-11` verwendet; `12` und `13` sind Spezialzonen.",
        "",
    ]
    lines += table(
        ["ID", "Name", "Monster-IDs", "Boss", "SubBoss", "Frames", "Tile"],
        [
            [
                z["id"],
                z["name"],
                " ".join(str(x) for x in z["monsterIds"]),
                f"{z['bossId']} {z['bossName']}",
                f"{z['subBossId']} {z['subBossName']}",
                z.get("framesTotal", ""),
                z.get("tile", ""),
            ]
            for z in zones
        ],
    )

    lines += [
        "",
        "## Gegnerdaten aus `monsters.json`",
        "",
        "- 137 Monster insgesamt.",
        "- Alle Monster im Build verwenden `baseLife = 1.0e1` und `lifeFormula = monsterLifeFormula1`.",
        "- Alle Monster verwenden `goldFormula = monsterGoldFormula1`.",
        "- `baseGold` reicht von `1` bis `50`; viele Boss-/spaetere Gegner haben `50`.",
        "- Fuer den MVP sind individuelle Gegnerstats optional; wichtig sind `baseGold`, `monsterLifeFormula1`, `monsterGoldFormula1` und die Zonenreferenzen oben.",
        "",
        "## Achievement-/Ascension-Hooks",
        "",
    ]
    lines += table(
        ["ID", "Name", "Check", "Params", "Reward", "RewardParams", "RewardText"],
        [
            [
                row["id"],
                row["name"],
                row.get("checkFunction", ""),
                row.get("checkParams", ""),
                row.get("rewardFunction", ""),
                row.get("rewardParams", ""),
                row.get("rewardText", ""),
            ]
            for row in achievements
        ],
    )

    lines += [
        "",
        "Wichtige direkte Original-Hooks:",
        "",
        "- Amenhotep Level 150 Upgrade `ASCENSION`: `finalUpgrade`.",
        "- Achievement `Bounty: Omeet`: `highestFinishedZone = 100`, `addSouls 1`.",
        "- Text aus `en_US.json`: `You will receive 1 Hero Soul for every 2000 hero levels through a World Ascension...`",
        "",
        "## Ancients-Formelinventar",
        "",
        "Ancients sind nicht Teil des MVP, aber die Formel- und Effekt-IDs sind fuer spaetere Erweiterung extrahiert.",
        "",
    ]
    lines += table(
        ["ID", "Ancient", "CostFormula", "CostParams", "AmountFormula", "AmountParams", "Max", "Effect"],
        [
            [
                row["id"],
                row["name"],
                row.get("levelCostFormula", ""),
                row.get("levelCostParams", ""),
                row.get("levelAmountFormula", ""),
                row.get("levelAmountParams", ""),
                row.get("maxLevel", ""),
                row.get("effectDescription", ""),
            ]
            for row in ancients
        ],
    )

    lines += [
        "",
        "## Datenmodell fuer Implementierung",
        "",
        "```ts",
        "type HeroDefinition = {",
        "  id: number;",
        "  chReferenceName: string;",
        "  baseCost: string;",
        "  baseAttack: string;",
        "  baseClickDamage: string;",
        "  costFormula: 'heroCostFormula1';",
        "  attackFormula: 'heroAttackFormula1';",
        "  upgrades: HeroUpgradeDefinition[];",
        "};",
        "",
        "type HeroUpgradeDefinition = {",
        "  id: number;",
        "  heroId: number;",
        "  unlockLevel: number;",
        "  upgradeFunction: string;",
        "  upgradeParams: string;",
        "  amount: string | number;",
        "  attribute: number;",
        "  purchaseCostStatus: 'not_extracted_from_textasset';",
        "};",
        "",
        "type ZoneTypeDefinition = {",
        "  id: number;",
        "  name: string;",
        "  monsterIds: number[];",
        "  bossId: number;",
        "  subBossId: number;",
        "};",
        "",
        "type MonsterDefinition = {",
        "  id: number;",
        "  baseLife: '1.0e1';",
        "  lifeFormula: 'monsterLifeFormula1';",
        "  baseGold: string | number;",
        "  goldFormula: 'monsterGoldFormula1';",
        "};",
        "```",
        "",
        "## Exaktheitsstatus",
        "",
    ]
    lines += table(
        ["Bereich", "Status nach Extraktion", "Konsequenz"],
        [
            ["Webversion/Build", "Live und lokal validiert", "Referenzversion `v1.0e12-6112`."],
            ["TextAsset-Spieltabellen", "65/65 bytegenau exportiert", "Direkt nutzbar."],
            ["Helden 1-20", "Originalwerte vorhanden", "Direkt implementierbar."],
            ["Upgrade-Effekte", "Originalwerte vorhanden", "Direkt implementierbar."],
            ["Upgrade-Kaufpreise", "nicht explizit im TextAsset", "Preisformel separat validieren."],
            ["Zonentypen/Bosse", "Originalwerte vorhanden", "Direkt fuer Biome/Boss-Pool nutzen."],
            ["Monster baseLife/baseGold", "Originalwerte vorhanden", "Direkt nutzbar; Formel-Body fehlt."],
            ["Monster-HP/Gold-Formelbody", "nur Formel-ID im TextAsset", "Decompile/Gameplay-Snapshots fuer Exaktheit."],
            ["Hero Souls", "Achievement/Text-Hooks vorhanden", "Basisregel 1/2000 Heldenlevel aus `en_US.json`; Formelpfad testen."],
            ["Skills", "Unlocks vorhanden, Laufzeitwerte fehlen", "Dauer/Cooldown temporaer aus Analyse."],
        ],
    )
    lines += [
        "",
        "## Validierungsaufgaben vor 'exakt wie CH'",
        "",
        "1. `heroCostFormula1` gegen echte Level-Kosten testen, besonders Upgrade- und Multi-Buy-Rundung.",
        "2. Upgrade-Kaufpreislogik aus Code/Gameplay bestimmen; `upgrades.json` enthaelt keinen expliziten Preis.",
        "3. `monsterLifeFormula1(zone)` fuer Zonen `1-140` per Save/Gameplay oder Decompile validieren.",
        "4. `monsterGoldFormula1(zone, baseGold)` fuer Zonen `1-140` validieren.",
        "5. Boss-HP/Boss-Gold fuer Zonen `5, 10, 25, 50, 100, 140` erfassen.",
        "6. Skill-Dauer/Cooldown aus Code oder Gameplay bestaetigen.",
        "7. Ascension-Gewinn bei `total_purchased_hero_levels = 1999, 2000, 3999, 4000` testen.",
        "8. Zweiten Run mit gleicher Kaufstrategie gegen erwartete Hero-Soul-Beschleunigung messen.",
        "",
        "## Implementationsreihenfolge aus den Daten",
        "",
        "1. `CH_REFERENZDATEN_MVP_EXTRAKT.json` als Datenquelle laden oder in TS-Konstanten ueberfuehren.",
        "2. Decimal/BigNumber einrichten.",
        "3. Helden 1-8 mit `heroCostFormula1` und `heroAttackFormula1` implementieren.",
        "4. Upgrade-Effekte fuer Helden 1-8 implementieren.",
        "5. Zonenzyklus 1-11 und generische Gegner aus `monsterLifeFormula1`/`monsterGoldFormula1` implementieren.",
        "6. Boss-Zonen alle 5 Zonen mit Timer implementieren.",
        "7. Treasure Chests als `1%` Spawn in normalen Zonen implementieren.",
        "8. Helden 9-12 und Skill-Unlocks ergaenzen.",
        "9. Helden bis Amenhotep und `ASCENSION` implementieren.",
        "10. Balancing-Harness mit Snapshot- und Simulationswerten ergaenzen.",
        "",
    ]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
