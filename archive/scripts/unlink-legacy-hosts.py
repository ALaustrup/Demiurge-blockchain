#!/usr/bin/env python3
"""Replace retired OVH host IPs with localhost and disable remote deploy scripts."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_IPS = ("51.210.209.112", "51.210.209.112")
SKIP_DIRS = {
    "node_modules",
    "target",
    "dist",
    ".git",
    "pkg",
    ".next",
    ".turbo",
    "coverage",
}
SKIP_SUFFIX = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".wasm", ".exe", ".dll", ".so", ".bin"}
TEXT_SUFFIX = {
    ".md", ".json", ".toml", ".yml", ".yaml", ".ps1", ".sh", ".ts", ".tsx",
    ".js", ".jsx", ".rs", ".env", ".example", ".txt", ".conf", ".service",
    ".xml", ".html", ".css", ".sql", ".py",
}

RETIRE_PS1 = """# RETIRED: remote OVH deploy is disabled.
Write-Error "OVH Monad/Pleroma is unlinked. Use npm run studio:servers then npm run studio:start."
exit 1

"""

RETIRE_SH = """#!/usr/bin/env bash
# RETIRED: remote OVH deploy is disabled.
echo "OVH Monad/Pleroma is unlinked. Use npm run studio:servers then npm run studio:start." >&2
exit 1

"""

changed: list[str] = []


def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    if parts & SKIP_DIRS:
        return True
    if path.suffix.lower() in SKIP_SUFFIX:
        return True
    return False


def replace_ips(text: str) -> str:
    for ip in OLD_IPS:
        text = text.replace(ip, "127.0.0.1")
    return text


def empty_bootnodes(data):
    if isinstance(data, dict):
        for key, value in list(data.items()):
            if key in ("bootNodes", "bootnodes", "bootstrap_peers") and isinstance(value, list):
                data[key] = []
            else:
                empty_bootnodes(value)
    elif isinstance(data, list):
        for item in data:
            empty_bootnodes(item)


def process_json(path: Path) -> None:
    raw = path.read_text(encoding="utf-8")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        new = replace_ips(raw)
        if new != raw:
            path.write_text(new, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
        return
    empty_bootnodes(data)
    dumped = json.dumps(data, indent=2, ensure_ascii=False)
    dumped = replace_ips(dumped)
    if not dumped.endswith("\n"):
        dumped += "\n"
    path.write_text(dumped, encoding="utf-8")
    changed.append(str(path.relative_to(ROOT)))


def retire_script(path: Path) -> None:
    raw = path.read_text(encoding="utf-8", errors="replace")
    if "RETIRED: remote OVH deploy is disabled" in raw:
        return
    if path.suffix == ".ps1":
        path.write_text(RETIRE_PS1 + replace_ips(raw), encoding="utf-8")
    else:
        path.write_text(RETIRE_SH + replace_ips(raw), encoding="utf-8")
    changed.append(str(path.relative_to(ROOT)) + " (retired)")


def looks_like_remote_deploy(path: Path, raw: str) -> bool:
    name = path.name.lower()
    if not any(ip in raw for ip in OLD_IPS):
        return False
    needles = ("deploy", "ssh", "monad", "pleroma", "ovh")
    return any(n in name for n in needles) or "ssh " in raw.lower() or "scp " in raw.lower()


def main() -> None:
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = Path(dirpath) / name
            if should_skip(path):
                continue
            if path.name in {"unlink-legacy-hosts.py", "STUDIO_SERVERS.md", "endpoints.json"}:
                continue
            suffix = path.suffix.lower()
            if suffix not in TEXT_SUFFIX and name not in {".env.example", ".cursorrules"}:
                if not name.endswith(".example"):
                    continue
            try:
                raw = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, PermissionError, OSError):
                continue
            if "RETIRED: remote OVH deploy is disabled" in raw[:500]:
                continue
            if not any(ip in raw for ip in OLD_IPS):
                continue
            if looks_like_remote_deploy(path, raw) and suffix in {".ps1", ".sh"}:
                retire_script(path)
                continue
            if suffix == ".json":
                process_json(path)
                continue
            new = replace_ips(raw)
            if new != raw:
                path.write_text(new, encoding="utf-8")
                changed.append(str(path.relative_to(ROOT)))

    print(f"updated {len(changed)} files")
    for item in changed[:80]:
        print(f"  {item}")
    if len(changed) > 80:
        print(f"  ... {len(changed) - 80} more")


if __name__ == "__main__":
    main()
