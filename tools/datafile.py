"""Read/write the data/*.js files.

Each lesson file looks like:
    window.LESSONS_DB = window.LESSONS_DB || {};
    window.LESSONS_DB["12"] = { ...JSON... };
The JSON body is the single source of truth; tools load it, change it, and save it back.
"""
import json
from pathlib import Path

HEADER = "// Auto-formatted data file. The part after '=' is plain JSON.\n"


def save_data(path, glob, key, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(value, ensure_ascii=False, indent=1)
    if key is None:
        text = f"{HEADER}window.{glob} = {body};\n"
    else:
        text = (f"{HEADER}window.{glob} = window.{glob} || {{}};\n"
                f"window.{glob}[{json.dumps(key)}] = {body};\n")
    path.write_text(text, encoding="utf-8")


def load_data(path):
    text = Path(path).read_text(encoding="utf-8")
    pos = 0
    for line in text.splitlines(keepends=True):
        if line.startswith("window.") and " || " not in line:
            pos += line.index(" = ") + 3
            break
        pos += len(line)
    return json.loads(text[pos:].rstrip().rstrip(";"))
