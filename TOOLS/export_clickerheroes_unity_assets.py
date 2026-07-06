from __future__ import annotations

from pathlib import Path
import hashlib
import json
import re

import UnityPy


BASE = Path(r"F:\CH70\ORIGINAL\DATEN\clickerheroes_webbuild_6112")
DATA_UNITY3D = BASE / "extracted" / "unity_webdata" / "data.unity3d"
OUT = BASE / "extracted" / "unitypy_export"


def safe_name(value: str, fallback: str) -> str:
    value = value or fallback
    value = re.sub(r'[<>:"/\\|?*\x00-\x1F]', "_", value).strip(" .")
    return value or fallback


def unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    index = 1
    while True:
        candidate = parent / f"{stem}_{index}{suffix}"
        if not candidate.exists():
            return candidate
        index += 1


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    env = UnityPy.load(str(DATA_UNITY3D))
    records: list[dict] = []
    failures: list[dict] = []

    for obj in env.objects:
        record = {"path_id": obj.path_id, "type": obj.type.name}
        try:
            data = obj.read()
            name = getattr(data, "m_Name", "") or getattr(data, "name", "") or ""
            record["name"] = name

            if obj.type.name == "TextAsset":
                raw = getattr(data, "m_Script", None)
                if raw is None:
                    raw = getattr(data, "script", b"")
                raw_bytes = raw.encode("utf-8") if isinstance(raw, str) else bytes(raw)
                ext = ".json" if raw_bytes.lstrip().startswith((b"{", b"[")) else ".txt"
                target = unique_path(OUT / "TextAsset" / (safe_name(name, f"textasset_{obj.path_id}") + ext))
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(raw_bytes)
                record.update({"exported": str(target.relative_to(BASE)), "size": len(raw_bytes), "sha256": hashlib.sha256(raw_bytes).hexdigest()})

            elif obj.type.name == "Texture2D":
                target = unique_path(OUT / "Texture2D" / (safe_name(name, f"texture_{obj.path_id}") + ".png"))
                target.parent.mkdir(parents=True, exist_ok=True)
                image = data.image
                image.save(target)
                record.update({"exported": str(target.relative_to(BASE)), "size": target.stat().st_size, "sha256": sha256(target)})

            elif obj.type.name == "Sprite":
                target = unique_path(OUT / "Sprite" / (safe_name(name, f"sprite_{obj.path_id}") + ".png"))
                target.parent.mkdir(parents=True, exist_ok=True)
                image = data.image
                image.save(target)
                record.update({"exported": str(target.relative_to(BASE)), "size": target.stat().st_size, "sha256": sha256(target)})

            elif obj.type.name in {"MonoScript", "Shader"}:
                tree = obj.read_typetree()
                target = unique_path(OUT / obj.type.name / (safe_name(name, f"{obj.type.name}_{obj.path_id}") + ".json"))
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps(tree, indent=2, ensure_ascii=False), encoding="utf-8")
                record.update({"exported": str(target.relative_to(BASE)), "size": target.stat().st_size, "sha256": sha256(target)})

        except Exception as exc:
            record["error"] = f"{type(exc).__name__}: {exc}"
            failures.append(record)
        records.append(record)

    manifest = {
        "source": str(DATA_UNITY3D),
        "record_count": len(records),
        "exported_count": sum(1 for row in records if "exported" in row),
        "failure_count": len(failures),
        "records": records,
        "failures": failures[:500],
    }
    (BASE / "unitypy_export_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({k: manifest[k] for k in ["record_count", "exported_count", "failure_count"]}, indent=2))
    print(BASE / "unitypy_export_manifest.json")


if __name__ == "__main__":
    main()
