"""Copy the page's half from the JavaScript library, which is where it is written.

    python scripts/sync_js.py [path/to/notation.js]

The Python package carries ``notation.js`` whole, as ``src/pynotation/web/notation.js``, and the
examples carry the song they show. Both are copies: change them in the JavaScript repository
(by default the folder ``notation.js`` beside this one) and run this. The tests fail while the
copies differ from it.
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COPIES = (
    ("notation.js", ROOT / "src" / "pynotation" / "web" / "notation.js"),
    ("examples/songs/night_drive.json", ROOT / "examples" / "songs" / "night_drive.json"),
    ("LICENSE-GLYPHS", ROOT / "LICENSE-GLYPHS"),
)


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "notation.js"
    for name, to in COPIES:
        to.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / name, to)
        print("copied %s" % to.relative_to(ROOT))


if __name__ == "__main__":
    main()
