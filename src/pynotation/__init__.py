"""pynotation: music written as notes on a staff, for a Pyctures scene, that lights up as it plays.

    from pyctures import *
    from synths import *
    from pynotation import *

    page = show_notes("C4 E4 G4 - C5:2", "quarter")     # a tune in the words of play_notes, as sheet music
    page.play()                                         # play it, and each note lights as it sounds
    page.on_note = lambda note: print(note.name)        # a note has just begun

    song = play_song("night_drive.json")
    show_notes("night_drive.json", channels=[3, 1], follow=song)    # a tracker song, a staff a channel

    sheet = make_sheet(key="G", time="3/4")             # written a note at a time
    sheet.add("G4", "quarter"); sheet.add(["B4", "D5"], "half")
    show_notes(sheet)

    page.play_along("wait", synth=lead)                 # the learner plays; right is green, wrong is red
    keyboard(page)                                      # pydials: its keys play the page

THE PAGE WRITES THE MUSIC OUT AND DRAWS IT. Python never touches the page (it may
be in a worker, or on another computer). Each function here sends ONE command that
makes the page of music in the browser, from ``web/notation.js`` (the very file that
is the JavaScript library; a Pyctures that has it built in says so with
``H_NOTATION``), and Python keeps a small object that stands for it. What happens
there (a note begins, a bar is tapped, a learner plays a right note) comes back
with the next frame: ``on_note`` is called, ``page.result`` is up to date.

WHO KEEPS TIME. The sound library does. ``page.play()`` asks the page for the notes
as ``play_notes`` takes them (it answers when the sound is on, not before), plays them
through ``synths`` at a moment on the sound clock, and tells the page that moment: the
page then moves by itself, every frame, with no more commands. A song is followed in
the page, from the place its own sound says the song is at; where a page cannot say,
Python hands ``song.position`` on as it changes.

MIT licence. The outlines of the music symbols are from the Leland font, under the
SIL Open Font Licence 1.1 (see LICENSE-GLYPHS).
"""
import base64
import json
import os
import sys

__version__ = "0.0.0"

__all__ = ["show_notes", "make_sheet", "theme"]

_HERE = os.path.dirname(os.path.abspath(__file__))
_source = [None]

# How long after the time it was asked for the sound library plays a note (its `latency`): the line keeps to what is heard.
LATENCY = 0.04
# How far ahead of now a tune is begun, so that its first note is on time however long the frame takes.
AHEAD = 0.15

_NAMES = ("C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B")


def note_name(note):
    """A note's name: 60 is "C4"."""
    return "%s%d" % (_NAMES[int(note) % 12], int(note) // 12 - 1)


def _library():
    """The page's half as text that can be made into a function: a page is given no file to load."""
    if _source[0] is None:
        with open(os.path.join(_HERE, "web", "notation.js"), encoding="utf-8") as f:
            _source[0] = f.read().replace("export {", "return {")
    return _source[0]


class _Run:
    """One run of a scene: its page, and the pages of music made in it."""

    def __init__(self, js=None):
        self.js = js
        self.lib = None
        self.api = None
        self.items = {}
        self.next_id = 1
        self.beating = False


_run = _Run()


def _pyctures():
    # Looked up each time: in a browser every scene has its own copy of the module.
    module = sys.modules.get("pyctures")
    if module is None:
        import pyctures as module
    return module


_no_synths = [False]


def _synths():
    """The sound library, if it is there: music is played through it, and it keeps the time."""
    module = sys.modules.get("synths")
    if module is None and not _no_synths[0]:
        try:
            import synths as module
        except ImportError:
            _no_synths[0] = True     # not looked for again: the page then plays in silence
    return module


def _page():
    """The page's music for the scene that is running, made the first time it is wanted."""
    global _run
    p = _pyctures()
    # A new run has a new `js`: what was made for the last run is gone with its page.
    if _run.js is not p.js:
        _run = _Run(p.js)
        handle = getattr(p, "H_NOTATION", None)
        if handle is not None:
            _run.api = p.JsRef(handle)      # a Pyctures that has the library built in
        else:
            _run.lib = p.js.Function(_library())()
            _run.api = _run.lib.notation(p.canvas, {"fresh": True})
        _run.api.listen(_heard)
    return _run.api


def _beat():
    """Ask the page to call back every frame: something here must be looked at each frame."""
    api = _page()
    if not _run.beating:
        _run.beating = True
        api.beat()


def _heard(e):
    """What the page reports, with a frame: page number, what happened, its details, and so on."""
    told = json.loads(e.get("t") or "[]")
    for i in range(0, len(told) - 2, 3):
        page = _run.items.get(told[i])
        if page is not None:
            page._told(told[i + 1], told[i + 2])
    if e.get("b"):
        for page in list(_run.items.values()):
            page._frame()
        _run.api.ack()


class Note(dict):
    """A note of the music: note.name ("C4"), note.note (60), note.notes (a chord's), note.start and note.length in beats."""
    __getattr__ = dict.get


class Result(dict):
    """How playing along went: result.right, .wrong, .missed, .total, .percent, .timing (seconds from the beat) and .done."""
    __getattr__ = dict.get


class Sheet:
    """A sheet of music written a note at a time: sheet.add("G4", "quarter"), sheet.add(["B4", "D5"], "half"), sheet.rest("quarter")."""

    def __init__(self, **options):
        self.options = {k: v for k, v in options.items() if v is not None}
        self.notes = []
        self._pages = set()

    def add(self, what, length="quarter"):
        """A note, a chord (a list, or a name like "Cm") or a rest (None or "-"), each beginning where the last ended."""
        self.notes.append([list(what) if isinstance(what, (list, tuple)) else what, length])
        for page in self._pages:
            page._changed()
        return self

    note = add
    chord = add

    def rest(self, length="quarter"):
        return self.add(None, length)

    def clear(self):
        """Start again with nothing written."""
        del self.notes[:]
        for page in self._pages:
            page._changed()
        return self

    def _data(self):
        return dict(self.options, sheet=[list(n) for n in self.notes])


def _music(what):
    """What show_notes was given, as the page takes it."""
    if isinstance(what, Sheet):
        return what._data()
    if isinstance(what, (bytes, bytearray)):
        return {"packed": base64.b64encode(bytes(what)).decode("ascii")}
    if isinstance(what, str) and what.strip().lower().endswith((".json", ".song")):
        # A song file beside the scene: Python reads it, since it is Python that knows where the scene's files are.
        song = _pyctures().load_json(what.strip())
        if song is None:
            raise FileNotFoundError('show_notes("%s"): there is no such song file beside the scene' % what)
        return song
    if isinstance(what, str) and what.strip().lower().endswith((".mod", ".xm")):
        raise ValueError('show_notes("%s"): a MOD or XM file is shown once the sound library has turned it into one of '
                         "our songs. Give show_notes the bytes that makes" % what)
    if isinstance(what, tuple):
        return list(what)
    return what


def _in_page(thing):
    """The thing as an object in the page, when that is where it lives (a synth does); else None."""
    if thing is None:
        return None
    if hasattr(type(thing), "_enc"):
        return thing
    page = getattr(thing, "page", None)
    return page if hasattr(type(page), "_enc") else None


class Page:
    """What Python keeps of a page of music that lives in the browser."""

    def __init__(self, what, step, options):
        api = _page()
        self._id = _run.next_id
        _run.next_id += 1
        _run.items[self._id] = self
        self.on_note = options.pop("on_note", None)
        self.on_bar = options.pop("on_bar", None)
        self.on_tap = options.pop("on_tap", None)
        self.on_done = options.pop("on_done", None)
        self.on_right = options.pop("on_right", None)
        self.on_wrong = options.pop("on_wrong", None)
        follow = options.pop("follow", None)
        along = options.pop("play_along", None)
        self._voice = options.get("voice")
        self._synth = options.pop("synth", None)
        self._tempo = options.get("tempo")
        self._hear = options.get("hear") is not False
        self._what = what
        self._step = step
        self._song = None
        self._direct = False
        self._beats = None
        self._place = None
        self._wants = None
        self._tunes = []
        self._voices = {}
        self.playing = False
        self.beat = 0.0
        self.bar = 1
        self.sounding = []
        self.result = Result(right=0, wrong=0, missed=0, total=0, percent=0, timing=None, done=False)
        if isinstance(what, Sheet):
            what._pages.add(self)
        synth = _in_page(self._synth)
        if synth is not None:
            options["synth"] = synth
        api.make(self._id, _music(what), step, {k: v for k, v in options.items() if v is not None})
        if follow is not None and follow is not True:
            self.follow(follow)
        if along:
            self.play_along(along if isinstance(along, str) else "wait")

    def _call(self, name, *args):
        _page().call(self._id, name, *args)

    def _set(self, name, value):
        _page().set(self._id, name, value)

    @property
    def page(self):
        """The page of music as an object in the browser: what a pydials keyboard is tied to, so its keys play it at once."""
        return _page().page(self._id)

    # --- what the page reports
    def _told(self, what, more):
        if what == "note":
            sounds, start, length, staff = more
            self.beat = start
            self.sounding = list(sounds)
            if self.on_note:
                self.on_note(Note(note=sounds[0], notes=list(sounds), name=note_name(sounds[0]), start=start, length=length, staff=staff))
        elif what == "bar":
            self.bar = more
            if self.on_bar:
                self.on_bar(more)
        elif what == "tap":
            note, start, bar = more
            synths = _synths()
            if note is not None and self._hear and synths is not None:
                synths.play_note(note, 0.45)
            if self.on_tap:
                self.on_tap(Note(bar=bar) if note is None else Note(note=note, name=note_name(note), start=start, bar=bar))
        elif what == "right":
            if self.on_right:
                self.on_right(more)
        elif what == "wrong":
            if self.on_wrong:
                self.on_wrong(more)
        elif what == "result":
            self.result.update(more)
        elif what == "done":
            self.playing = False
            self.sounding = []
            if more:
                self.result.update(more)
            if self.on_done:
                self.on_done(self.result if more else self)
        elif what == "words":
            self._play_words(more)
        elif what == "direct":
            self._direct = True      # the page reads the song's place from its own sound: nothing need be handed on
        elif what == "seek":
            if self._song is not None:
                self._song.seek(more["order"], more["row"])
        elif what == "again":
            self.play(start=more)

    def _frame(self):
        """Every frame while something is followed: the page is told where it has got to, when that has changed."""
        if self._song is not None and not self._direct:
            place = dict(self._song.position)
            if place != self._place:
                self._place = place
                self._call("feed", place)
        elif self._beats is not None:
            beat = self._beats()
            if beat is not None and beat != self._place:
                self._place = beat
                self._set("beat", beat)

    def _changed(self):
        self._call("show", _music(self._what), self._step)

    # --- playing and following
    def play(self, start=0, tempo=None, repeat=False):
        """Play the music through the sound library and follow it: page.play(), page.play(start=8) to begin eight
        beats in, tempo=90 to play it slower. With no sound library in the scene, the line moves in silence."""
        self.stop()
        self.playing = True
        if _synths() is None:
            self._call("play", {"from": start, "tempo": tempo, "repeat": bool(repeat)})
            return self
        # The page says what the notes are, as play_notes takes them; they are played when it has (see _play_words).
        self._wants = {"tempo": tempo or self._tempo, "repeat": bool(repeat)}
        _page().words(self._id, start)
        return self

    def _play_words(self, words):
        wants, self._wants = self._wants, None
        synths = _synths()
        if wants is None or synths is None:
            return
        bpm = wants["tempo"] or words["tempo"]
        at = synths.sound_time() + AHEAD
        for i, text in enumerate(words["staves"]):
            if not text:
                continue
            synth = self._synth
            if synth is None:
                synth = self._voices.get(i)
                if synth is None:
                    synth = self._voices[i] = synths.make_synth(self._voice or "keys")
            self._tunes.append(synth.play_notes(text, words["step"] * 60.0 / bpm, at=at, hold=0.94))
        self._call("run", {"now": synths.sound_time(), "at": at, "bpm": bpm, "from": words["from"], "latency": LATENCY})

    def stop(self):
        """Stop what the page is playing, and put every note back to plain ink."""
        for tune in self._tunes:
            tune.stop()
        del self._tunes[:]
        self._wants = None
        self.playing = False
        self.sounding = []
        self._call("stop")
        return self

    def follow(self, what):
        """Follow something that plays: a song from play_song, or a function that gives how many beats have gone by."""
        self._song = self._beats = self._place = None
        self._direct = False
        if hasattr(what, "position") and hasattr(what, "seek"):
            self._song = what
            self._call("followSound")
        elif callable(what):
            self._beats = what
        else:
            raise TypeError("follow needs something that plays: a song from play_song, or a function that gives how "
                            "many beats have gone by, not %r" % (what,))
        _beat()
        return self

    def unfollow(self):
        self._song = self._beats = None
        self._call("unfollow")
        return self

    def seek(self, bar):
        """Go to a bar (counting from 1)."""
        self._call("seek", bar)
        return self

    def show(self, what, step=None, **options):
        """Show other music in this page's place: page.show("C4 D4 E4", "quarter")."""
        if isinstance(self._what, Sheet):
            self._what._pages.discard(self)
        if isinstance(what, Sheet):
            what._pages.add(self)
        self._what, self._step = what, step
        self._call("show", _music(what), step, {k: v for k, v in options.items() if v is not None})
        return self

    # --- playing along
    def play_along(self, mode="wait", *, synth=None, staff=None, tempo=None, hint=None, any_octave=None, count_in=None):
        """The learner plays the music. "wait": the line waits at each note until it is played. "time": it keeps
        time, after a bar counted in. Notes come through note_on and note_off, or from a pydials keyboard tied to
        the page: keyboard(page). synth=lead makes the played notes heard. page.result says how it is going."""
        self.result = Result(right=0, wrong=0, missed=0, total=0, percent=0, timing=None, done=False)
        options = {"mode": mode, "synth": _in_page(synth if synth is not None else self._synth), "staff": staff, "tempo": tempo,
                   "hint": hint, "anyOctave": any_octave, "countIn": count_in}
        self._call("playAlong", {k: v for k, v in options.items() if v is not None})
        return self

    def note_on(self, note, velocity=0.8):
        """A key went down: 60 is middle C, or "C4"."""
        self._call("noteOn", note, velocity)
        return self

    def note_off(self, note):
        self._call("noteOff", note)
        return self

    # --- where it is
    def place(self, at=None, *, x=None, y=None, width=None, height=None):
        """Move it and size it: page.place("bottom"), page.place(x=20, y=20, width=400, height=200)."""
        where = {"at": at, "x": x, "y": y, "width": width, "height": height}
        self._call("place", {k: v for k, v in where.items() if v is not None})
        return self

    @property
    def zoom(self):
        return getattr(self, "_zoom", 1)

    @zoom.setter
    def zoom(self, z):
        self._zoom = z
        self._set("zoom", z)

    def remove(self):
        """Take the page away."""
        if isinstance(self._what, Sheet):
            self._what._pages.discard(self)
        for tune in self._tunes:
            tune.stop()
        _run.items.pop(self._id, None)
        _page().drop(self._id)

    def __repr__(self):
        return "<a page of music, at bar %d>" % self.bar


def show_notes(music, step=None, *, key=None, time=None, clef=None, tempo=None, title=None, at=None, x=None, y=None,
               width=None, height=None, zoom=None, paper=None, colours=None, colors=None, scroll=None, lines=None,
               bar_numbers=None, follow=None, hear=None, seek=None, line=None, voice=None, synth=None, channels=None,
               instruments=None, drums=None, grand=None, rows_per_beat=None, play_along=None, on_note=None,
               on_bar=None, on_tap=None, on_done=None, on_right=None, on_wrong=None):
    """Show music as notes on a staff, and get its page back.

    show_notes("C4 E4 G4 - C5:2", "quarter")            a tune as play_notes takes it; the second thing is a step's length
    show_notes(["C4", None, ["C4", "E4"]], "quarter")   the same as a list
    show_notes(sheet)                                   a sheet from make_sheet()
    show_notes("song.json", channels=[0, 1])            a tracker song beside the scene (or the song as a dictionary)
    show_notes([{"note": "C4", "start": 0, "length": 1}])    plain data, in beats
    """
    options = dict(key=key, time=time, clef=clef, tempo=tempo, title=title, at=at, x=x, y=y, width=width, height=height,
                   zoom=zoom, paper=paper, colours=colours if colours is not None else colors, scroll=scroll, lines=lines,
                   barNumbers=bar_numbers, follow=follow, hear=hear, seek=seek, line=line, voice=voice, synth=synth,
                   channels=channels, instruments=instruments, drums=drums, grand=grand, rowsPerBeat=rows_per_beat,
                   play_along=play_along, on_note=on_note, on_bar=on_bar, on_tap=on_tap, on_done=on_done,
                   on_right=on_right, on_wrong=on_wrong)
    return Page(music, step, options)


def make_sheet(*, key=None, time=None, tempo=None, title=None, clef=None):
    """A sheet to write music on a note at a time: make_sheet(key="G", time="3/4", tempo=90)."""
    return Sheet(key=key, time=time, tempo=tempo, title=title, clef=clef)


def theme(**colours):
    """Change the colours of every page: theme(now="deepskyblue"). The names are paper, ink, line, now, right, wrong and cursor."""
    _page().theme(colours)
