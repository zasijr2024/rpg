from __future__ import annotations

from pathlib import Path
import json


ROOT = Path(r"F:\CH70")
TEXT_ASSETS = ROOT / "ORIGINAL" / "DATEN" / "clickerheroes_webbuild_6112" / "extracted" / "text_assets"
OUT = ROOT / "prototypen" / "CH_REFERENZDATEN_MVP_EXTRAKT.json"


def strip_trailing_commas(text: str) -> str:
    out: list[str] = []
    in_string = False
    escaped = False
    i = 0
    while i < len(text):
        char = text[i]
        if in_string:
            out.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            i += 1
            continue
        if char == '"':
            in_string = True
            out.append(char)
            i += 1
            continue
        if char == ",":
            j = i + 1
            while j < len(text) and text[j].isspace():
                j += 1
            if j < len(text) and text[j] in "}]":
                i += 1
                continue
        out.append(char)
        i += 1
    return "".join(out)


def load_json(name: str):
    text = (TEXT_ASSETS / name).read_text(encoding="utf-8-sig")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return json.loads(strip_trailing_commas(text))


def keep_fields(row: dict, fields: list[str]) -> dict:
    return {field: row[field] for field in fields if field in row}


def main() -> None:
    heroes = load_json("heroes.json")
    upgrades = load_json("upgrades.json")
    monsters = load_json("monsters.json")
    zones = load_json("zones.json")
    achievements = load_json("achievements.json")
    ancients = load_json("ancients.json")
    outsiders = load_json("outsiders.json")
    item_bonus_types = load_json("itemBonusTypes.json")
    validation = json.loads(
        (ROOT / "ORIGINAL" / "DATEN" / "clickerheroes_webbuild_6112" / "validation_report.json").read_text(
            encoding="utf-8"
        )
    )
    content_validation = json.loads(
        (ROOT / "ORIGINAL" / "DATEN" / "clickerheroes_webbuild_6112" / "content_validation.json").read_text(
            encoding="utf-8"
        )
    )

    hero_by_id = {row["id"]: row for row in heroes}
    monster_by_id = {row["id"]: row for row in monsters}

    hero_fields = [
        "id",
        "name",
        "baseCost",
        "baseAttack",
        "baseClickDamage",
        "baseGoldPerSecond",
        "attackFormula",
        "costFormula",
        "clickDamageFormula",
        "goldPerSecondFormula",
        "specialSkill",
        "assetId",
        "_live",
    ]
    upgrade_fields = [
        "id",
        "heroId",
        "heroLevelRequired",
        "name",
        "upgradeFunction",
        "upgradeParams",
        "amount",
        "attribute",
        "isPercentage",
        "displayOrder",
        "upgradeRequired",
        "_live",
    ]

    skill_unlocks = [row for row in upgrades if row.get("upgradeFunction") == "upgradeGetSkill"]
    core_upgrade_rows = [
        row
        for row in upgrades
        if row.get("heroId", 9999) <= 12 or row.get("heroId") == 20 or row.get("upgradeFunction") == "upgradeGetSkill"
    ]

    zone_rows = []
    referenced_monster_ids: set[int] = set()
    for zone in zones:
        monster_ids = [int(value) for value in zone.get("monsterIds", "").split(",") if value]
        referenced_monster_ids.update(monster_ids)
        referenced_monster_ids.add(zone["bossId"])
        referenced_monster_ids.add(zone["subBossId"])
        zone_rows.append(
            {
                **keep_fields(
                    zone,
                    [
                        "id",
                        "name",
                        "background",
                        "mobileBackground",
                        "tile",
                        "framesTotal",
                        "bossTileId",
                        "bossTileChance",
                        "subBossTileId",
                        "subBossTileChance",
                    ],
                ),
                "monsterIds": monster_ids,
                "bossId": zone["bossId"],
                "bossName": monster_by_id.get(zone["bossId"], {}).get("name"),
                "subBossId": zone["subBossId"],
                "subBossName": monster_by_id.get(zone["subBossId"], {}).get("name"),
            }
        )

    extract = {
        "source": {
            "build": validation["live_source"].get("build"),
            "text_assets_dir": str(TEXT_ASSETS),
            "validation_report": str(ROOT / "ORIGINAL" / "DATEN" / "clickerheroes_webbuild_6112" / "validation_report.md"),
            "note": (
                "This file is generated from original extracted Unity TextAssets. Formula IDs are original data; "
                "compiled formula bodies remain in IL2CPP/WASM unless separately decompiled."
            ),
        },
        "prototype_scope": {
            "core_hero_ids": list(range(1, 13)),
            "ascension_gate_hero_id": 20,
            "zone_type_ids": [row["id"] for row in zones],
        },
        "formula_references": content_validation["formula_references"],
        "function_references": content_validation["function_references"],
        "heroes_core_1_12": [keep_fields(hero_by_id[i], hero_fields) for i in range(1, 13)],
        "heroes_to_amenhotep_1_20": [keep_fields(hero_by_id[i], hero_fields) for i in range(1, 21)],
        "upgrades_core_heroes_1_12_plus_ascension_and_skills": [
            keep_fields(row, upgrade_fields) for row in core_upgrade_rows
        ],
        "skill_unlocks": [
            {
                **keep_fields(row, upgrade_fields),
                "heroName": hero_by_id.get(row["heroId"], {}).get("name"),
            }
            for row in skill_unlocks
        ],
        "zones": zone_rows,
        "monsters_referenced_by_zones": [
            keep_fields(
                monster_by_id[i],
                [
                    "id",
                    "name",
                    "baseLife",
                    "lifeFormula",
                    "baseGold",
                    "goldFormula",
                    "baseSize",
                    "platform",
                    "event",
                    "assetId",
                ],
            )
            for i in sorted(referenced_monster_ids)
            if i in monster_by_id
        ],
        "achievements_mvp_hooks": [
            keep_fields(
                row,
                [
                    "id",
                    "name",
                    "description",
                    "checkFunction",
                    "checkParams",
                    "rewardFunction",
                    "rewardParams",
                    "rewardText",
                    "premiumCurrency",
                ],
            )
            for row in achievements
            if row.get("checkFunction") in {"highestFinishedZone", "numWorldResets"}
            and int(row.get("checkParams", "999999")) <= 160
        ],
        "ancients_formula_inventory": [
            keep_fields(
                row,
                [
                    "id",
                    "name",
                    "levelCostFormula",
                    "levelCostParams",
                    "levelAmountFormula",
                    "levelAmountParams",
                    "maxLevel",
                    "effectDescription",
                    "nonTranscendent",
                ],
            )
            for row in ancients
        ],
        "outsiders_formula_inventory": [
            keep_fields(
                row,
                ["id", "name", "levelCostFormula", "levelAmountFormula", "maxLevel", "effectDescription"],
            )
            for row in outsiders
        ],
        "item_bonus_type_formula_inventory": [
            keep_fields(
                row,
                ["id", "name", "levelAmountFormula", "scaling", "effectDescription", "ancientId"],
            )
            for row in item_bonus_types
        ],
        "known_missing_from_textassets": [
            "Explicit upgrade purchase cost values are not present as a standalone field in upgrades.json.",
            "Skill base durations/cooldowns are not present as standalone TextAsset data.",
            "Formula bodies for heroCostFormula1, monsterLifeFormula1, monsterGoldFormula1 etc. are compiled code.",
        ],
    }

    OUT.write_text(json.dumps(extract, indent=2, ensure_ascii=False), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
