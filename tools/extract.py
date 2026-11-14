"""One-time: split legacy single-file HTML into index.html + js/app.js + data/*.js + audio/*.mp3.

Usage: python -I tools/extract.py legacy/12_13_14_15_7.html .
"""
import base64
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from datafile import save_data  # noqa: E402

src = Path(sys.argv[1])
out = Path(sys.argv[2])
html = src.read_text(encoding="utf-8")
lines = html.split("\n")

# --- main script block (the last <script> without src) ---
start = max(i for i, l in enumerate(lines) if l.strip() == "<script>")
end = max(i for i, l in enumerate(lines) if l.strip() == "</script>")
script_lines = lines[start + 1:end]

db = furi = None
audio = {}
kept = []
in_audio = False
for l in script_lines:
    s = l.strip()
    if s.startswith("const LESSONS_DB = "):
        db = json.loads(s[len("const LESSONS_DB = "):].rstrip(";"))
        kept.append("    const LESSONS_DB = window.LESSONS_DB;")
        continue
    if s.startswith("const FURIGANA_MAP = "):
        furi = json.loads(s[len("const FURIGANA_MAP = "):].rstrip(";"))
        kept.append("    const FURIGANA_MAP = window.FURIGANA_MAP;")
        continue
    if s.startswith("const AUDIO_SOURCES = {"):
        in_audio = True
        kept.append("    const AUDIO_SOURCES = window.AUDIO_SOURCES;")
        continue
    if in_audio:
        m = re.match(r'(\w+):\s*"data:audio/mp3;base64,([A-Za-z0-9+/=]+)"', s)
        if m:
            audio[m.group(1)] = base64.b64decode(m.group(2))
        if s.startswith("};"):
            in_audio = False
        continue
    kept.append(l)

assert db and furi and len(audio) == 4, (bool(db), bool(furi), list(audio))

(out / "js").mkdir(exist_ok=True)
(out / "audio").mkdir(exist_ok=True)
(out / "data" / "lessons").mkdir(parents=True, exist_ok=True)
(out / "data" / "special").mkdir(parents=True, exist_ok=True)

for k, b in audio.items():
    (out / "audio" / f"s{k}.mp3").write_bytes(b)

order = []
for key, val in db.items():
    if val.get("isSpecial"):
        rel = f"data/special/{key}.js"
    else:
        rel = f"data/lessons/s{key}.js"
    save_data(out / rel, "LESSONS_DB", key, val)
    order.append(rel)

save_data(out / "data" / "furigana.js", "FURIGANA_MAP", None, furi)

app_js = "\n".join(kept)
(out / "js" / "app.js").write_text(app_js.strip("\n") + "\n", encoding="utf-8")

tags = ["  <!-- Data (one file per lesson / special module) -->",
        '  <script src="data/manifest.js"></script>',
        '  <script src="data/furigana.js"></script>']
tags += [f'  <script src="{r}"></script>' for r in order]
tags.append('  <script src="js/app.js"></script>')
index = "\n".join(lines[:start] + tags + lines[end + 1:])
(out / "index.html").write_text(index, encoding="utf-8")

manifest = {"order": list(db.keys())}
print("lessons:", list(db.keys()))
print("app.js lines:", len(kept))
print("manifest order:", manifest)
