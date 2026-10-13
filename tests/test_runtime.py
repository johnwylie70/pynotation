"""The Python half with no browser: the commands it sends the page, and what it does with what the page reports."""
import json
import textwrap

import pytest

from conftest import JS_REPO, ROOT

import pyctures

INFO = json.dumps({"width": 400, "height": 300, "pixel_ratio": 2})


def start(src):
    return json.loads(pyctures.start(textwrap.dedent(src), INFO))


def tick(told=None, beat=0):
    """One frame; `told` is what the page tells the library (it listens with the first callback made)."""
    events = [{"k": "cb", "id": 1, "e": {"t": json.dumps(told) if told else "", "b": beat}}] if told is not None or beat else []
    return json.loads(pyctures.tick(json.dumps({"dt": 1 / 60, "events": events})))


def sent(reply, name):
    return [c[5] for c in reply["cmds"] if c[0] == "call" and c[4] == name]


def plain(value):
    """A command's argument as plain Python: {"$d": {...}} is a dictionary."""
    if isinstance(value, dict) and "$d" in value:
        return {k: plain(v) for k, v in value["$d"].items()}
    if isinstance(value, list):
        return [plain(v) for v in value]
    return value


def out(reply):
    return reply["out"].split()


@pytest.fixture(autouse=True)
def stopped():
    yield
    pyctures.stop()


def test_the_page_is_given_the_library_once_and_one_command_for_each_page_of_music():
    r = start("""
        from staves import *
        a = show_notes("C4 E4 G4 - C5:2", "quarter", title="Up", tempo=90, bar_numbers=False)
        b = show_notes(["C4", None, ["C4", "E4"]], at="bottom", paper="dark", colors={"now": "red"})
    """)
    assert r["error"] is None, r["error"]
    library = [c for c in r["cmds"] if c[0] == "new"]
    assert len(library) == 1 and library[0][4] == "Function" and "return {\n  staves, showNotes" in library[0][5][0]
    assert "export {" not in library[0][5][0] and "import.meta" not in library[0][5][0]
    made = [plain(c) for c in sent(r, "make")]
    assert made == [[1, "C4 E4 G4 - C5:2", "quarter", {"tempo": 90, "title": "Up", "barNumbers": False}],
                    [2, ["C4", None, ["C4", "E4"]], None, {"at": "bottom", "paper": "dark", "colours": {"now": "red"}}]]
    assert len(sent(r, "listen")) == 1


def test_a_sheet_is_sent_as_its_notes_and_sent_again_when_it_is_added_to():
    r = start("""
        from staves import *
        sheet = make_sheet(key="G", time="3/4")
        sheet.add("G4", "quarter").add(["B4", "D5"], "half").rest("quarter")
        page = show_notes(sheet)
        def update(dt):
            if frame_no() == 2: sheet.add("A4", 1.5)
        def frame_no():
            frame_no.n = getattr(frame_no, "n", 0) + 1
            return frame_no.n
    """)
    assert r["error"] is None, r["error"]
    assert plain(sent(r, "make")[0][1]) == {"key": "G", "time": "3/4", "sheet": [["G4", "quarter"], [["B4", "D5"], "half"], [None, "quarter"]]}
    again = []
    for _ in range(3):
        again += sent(tick(), "call")
    assert len(again) == 1 and again[0][1] == "show" and plain(again[0][2])["sheet"][-1] == ["A4", 1.5]


def test_a_song_file_is_read_by_python_and_packed_bytes_are_sent_as_text(tmp_path, monkeypatch):
    (tmp_path / "tiny.json").write_text(json.dumps({"format": "synths-song", "patterns": [{"rows": 4, "events": [{"row": 0, "ch": 0, "note": "C-4", "ins": 1}]}]}))
    monkeypatch.chdir(tmp_path)
    r = start("""
        from staves import *
        show_notes("tiny.json", channels=[0], rows_per_beat=4)
        show_notes(b"SYSG\\x01\\x00")
        try:
            show_notes("nothing.json")
        except FileNotFoundError as e:
            print("missing")
        try:
            show_notes("tune.mod")
        except ValueError as e:
            print("mod")
    """)
    assert r["error"] is None, r["error"]
    made = [plain(c) for c in sent(r, "make")]
    assert made[0][1]["patterns"][0]["rows"] == 4 and made[0][3] == {"channels": [0], "rowsPerBeat": 4}
    assert made[1][1] == {"packed": "U1lTRwEA"}
    assert out(r) == ["missing", "mod"]


def test_what_the_page_reports_reaches_the_handlers_and_the_page_object():
    r = start("""
        from staves import *
        page = show_notes("C4 E4", "quarter")
        page.on_note = lambda note: print("note", note.name, note.note, note.start, note.notes)
        page.on_bar = lambda bar: print("bar", bar)
        page.on_tap = lambda what: print("tap", what.name, what.bar)
        page.on_right = lambda note: print("right", note)
        page.on_wrong = lambda note: print("wrong", note)
        page.on_done = lambda result: print("done", result.right, result.percent, page.result.done)
        def update(dt):
            if page.result.right: print("so-far", page.result.right, page.result.wrong, page.beat, page.bar, page.sounding)
    """)
    assert r["error"] is None, r["error"]
    r = tick([1, "bar", 1, 1, "note", [[64, 67], 1, 0.5, 0], 1, "tap", [60, 0, 1], 1, "tap", [None, None, 2], 9, "note", [[1], 0, 1, 0]])
    assert out(r) == ["bar", "1", "note", "E4", "64", "1", "[64,", "67]", "tap", "C4", "1", "tap", "None", "2"]
    r = tick([1, "right", 60, 1, "result", {"right": 1, "wrong": 0, "total": 2}, 1, "wrong", 61])
    assert out(r) == ["right", "60", "wrong", "61", "so-far", "1", "0", "1", "1", "[64,", "67]"]
    r = tick([1, "done", {"right": 2, "wrong": 1, "percent": 75, "done": True}])
    assert out(r)[:4] == ["done", "2", "75", "True"]


def test_with_no_sound_library_the_page_plays_in_silence_and_the_rest_are_single_commands():
    r = start("""
        from staves import *
        page = show_notes("C4 E4", "quarter")
        page.play(start=1, tempo=90)
        page.seek(2)
        page.place("bottom")
        page.zoom = 1.5
        page.play_along("time", tempo=60, any_octave=True, count_in=0)
        page.note_on(60); page.note_off(60)
        page.show("C2 D2", "eighth", clef="bass")
        page.remove()
    """)
    assert r["error"] is None, r["error"]
    calls = [[c[1]] + [plain(a) for a in c[2:]] for c in sent(r, "call")]
    assert calls == [["stop"], ["play", {"from": 1, "tempo": 90, "repeat": False}], ["seek", 2], ["place", {"at": "bottom"}],
                     ["playAlong", {"mode": "time", "tempo": 60, "anyOctave": True, "countIn": 0}], ["noteOn", 60, 0.8], ["noteOff", 60],
                     ["show", "C2 D2", "eighth", {"clef": "bass"}]]
    assert [plain(c) for c in sent(r, "set")] == [[1, "zoom", 1.5]]
    assert sent(r, "drop") == [[1]]


class Synths:
    """A stand-in for the sound library, as a module: it writes down what it is asked to play."""

    SOURCE = '''
import sys, types
played = []
class Tune:
    def __init__(self, n): self.n = n
    def stop(self): played.append(("stop", self.n))
class Synth:
    def __init__(self, name): self.name = name
    def play_notes(self, notes, step=None, **more):
        played.append((self.name, notes, round(step, 4), sorted(more), round(more["at"] - clock[0], 3)))
        return Tune(len(played))
class Song:
    position = {"state": "playing", "order": 0, "row": 0, "tick": 0, "speed": 6, "tempo": 125}
    def seek(self, order, row=0): played.append(("seek", order, row))
clock = [100.0]
m = types.ModuleType("synths")
m.played, m.clock, m.Song = played, clock, Song
m.make_synth = lambda name=None, **k: Synth(name)
m.sound_time = lambda: clock[0]
m.play_note = lambda note, length=0.5: played.append(("note", note, length))
sys.modules["synths"] = m
'''


def test_with_the_sound_library_the_page_says_the_words_python_plays_them_and_the_page_is_told_when():
    r = start(Synths.SOURCE + """
from staves import *
import synths
page = show_notes("C4 E4", "quarter", tempo=120, voice="bell")
page.play()
def update(dt):
    if synths.played: print(synths.played); del synths.played[:]
""")
    assert r["error"] is None, r["error"]
    assert sent(r, "words") == [[1, 0]] and [c for c in sent(r, "call") if c[1] in ("play", "run")] == []
    r = tick([1, "words", {"staves": ["C4:2 E4:2", ""], "step": 0.5, "tempo": 100, "from": 0}])
    # A step of half a beat at the page's own tempo of 120 is a quarter of a second, begun a little ahead of now.
    assert "('bell', 'C4:2 E4:2', 0.25, ['at', 'hold'], 0.15)" in r["out"]
    run = [plain(c[2]) for c in sent(r, "call") if c[1] == "run"]
    assert run == [{"now": 100.0, "at": 100.15, "bpm": 120, "from": 0, "latency": 0.04}]
    # A bar tapped while it plays: the page asks for it again from there, and the tune that was playing is stopped.
    r = tick([1, "again", 4])
    assert sent(r, "words") == [[1, 4]] and "('stop', 1)" in r["out"]
    # And a tapped note is heard through the sound library.
    said = tick([1, "tap", [67, 2, 1]])["out"] + tick()["out"]
    assert "('note', 67, 0.45)" in said


def test_a_song_is_followed_by_handing_on_its_place_when_it_changes_and_a_tapped_bar_seeks_it():
    r = start(Synths.SOURCE + """
from staves import *
import synths
song = synths.Song()
page = show_notes([{"note": "C4", "start": 0, "length": 1}], follow=song)
def update(dt):
    if synths.played: print(synths.played); del synths.played[:]
""")
    assert r["error"] is None, r["error"]
    assert len(sent(r, "beat")) == 1
    r = tick(beat=1)
    fed = [plain(c[2]) for c in sent(r, "call") if c[1] == "feed"]
    assert fed == [{"state": "playing", "order": 0, "row": 0, "tick": 0, "speed": 6, "tempo": 125}] and len(sent(r, "ack")) == 1
    r = tick(beat=1)
    assert [c for c in sent(r, "call") if c[1] == "feed"] == [] and len(sent(r, "ack")) == 1     # it has not moved: nothing is sent
    r = tick([1, "seek", {"order": 2, "row": 16}])
    assert "('seek', 2, 16)" in r["out"]


def test_the_copies_of_the_javascript_library_and_its_song_are_the_library_itself():
    if not JS_REPO.exists():
        pytest.skip("the JavaScript repository is not beside this one")
    for name, copy in (("staves.js", ROOT / "src" / "staves" / "web" / "staves.js"), ("examples/songs/night_drive.json", ROOT / "examples" / "songs" / "night_drive.json"), ("LICENSE-GLYPHS", ROOT / "LICENSE-GLYPHS")):
        assert (JS_REPO / name).read_bytes() == copy.read_bytes(), "%s differs: run python scripts/sync_js.py" % name
