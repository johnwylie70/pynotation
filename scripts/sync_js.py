"""Copy the page's half from the JavaScript library, which is where it is written.

    python scripts/sync_js.py [path/to/staves.js]

The Python package carries ``staves.js`` whole, as ``src/staves/web/staves.js``, and the
examples carry the song they show. Both are copies: change them in the JavaScript repository
(by default the folder ``staves.js`` beside this one) and run this. The tests fail while the
copies differ from it.
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COPIES = (
    ("staves.js", ROOT / "src" / "staves" / "web" / "staves.js"),
    ("examples/songs/night_drive.json", ROOT / "examples" / "songs" / "night_drive.json"),
    ("LICENSE-GLYPHS", ROOT / "LICENSE-GLYPHS"),
)


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "staves.js"
    for name, to in COPIES:
        to.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / name, to)
        print("copied %s" % to.relative_to(ROOT))


if __name__ == "__main__":
    main()
