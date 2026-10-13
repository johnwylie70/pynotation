"""Scenes in a real (headless) Chromium, run by `pyctures run`: the music is written and drawn in the page, and Python hears.

Needs Playwright:  pip install playwright && playwright install chromium
Nothing is heard: Chromium is started muted. Screenshots land in tests/screenshots/ (or the folder SHOTS names).
"""
import time

import pytest

from conftest import EXAMPLES, ROOT, SHOTS

playwright = pytest.importorskip("playwright.sync_api")

SCENES = sorted(p.name for p in EXAMPLES.glob("*.py"))

# The scene's pages of music, as the browser keeps them (the stage its canvas holds).
STAGE = "document.querySelector('[data-pyctures-src] canvas')[Symbol.for('staves.stage')]"
PAGE = STAGE + ".pages[0]"


@pytest.fixture(scope="module")
def browser():
    with playwright.sync_playwright() as p:
        b = p.chromium.launch(args=["--mute-audio"])       # the examples make sound: none of it is heard
        yield b
        b.close()


class Watched:
    """A browser page showing one scene, with its errors collected."""

    def __init__(self, browser, url, size=(900, 700)):
        self.page = browser.new_page(viewport={"width": size[0], "height": size[1]})
        self.errors = []
        self.said = []
        self.page.on("console", lambda m: self.errors.append(m.text) if m.type == "error" else self.said.append(m.text))
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        self.page.goto(url)

    def wait(self, what, timeout=20):
        """Wait until the JavaScript expression `what` is true in the page; say what the scene reported if it never is."""
        end = time.time() + timeout
        while time.time() < end:
            if self.page.evaluate("(() => { try { return !!(%s) } catch (e) { return false } })()" % what):
                return
            self.page.wait_for_timeout(50)
        scene = self.page.query_selector("[data-pyctures-src]")
        raise AssertionError("never true: %s (status %s, error %s, page errors %s)" % (
            what, scene and scene.get_attribute("data-pyctures-status"), scene and scene.get_attribute("data-pyctures-error"), self.errors))

    def ready(self):
        """The music is written out and laid out."""
        self.wait("%s.plan && %s.plan.hits.length > 0" % (PAGE, PAGE))

    def output(self):
        return self.page.evaluate("document.querySelector('[data-pyctures-src]').parentElement.innerText") + "\n".join(self.said)

    def clean(self):
        scene = self.page.query_selector("[data-pyctures-src]")
        assert scene.get_attribute("data-pyctures-error") is None
        assert not self.errors, self.errors


def scene_file(tmp_path, source):
    path = tmp_path / "scene.py"
    path.write_text(source)
    return path


@pytest.mark.parametrize("scene", SCENES)
def test_each_example_runs_and_shows_its_music(browser, pyctures_run, scene):
    run = pyctures_run(EXAMPLES / scene)
    w = Watched(browser, run.url)
    w.ready()
    got = w.page.evaluate("""() => {
      const page = %s, box = page.wrap.getBoundingClientRect()
      return { notes: page.plan.hits.length, bars: page.score.bars, staves: page.score.staves.length, inside: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight }
    }""" % PAGE)
    assert got["inside"] and got["notes"] >= 13
    assert got["staves"] == (2 if scene == "song.py" else 1)
    w.page.wait_for_timeout(400)
    SHOTS.mkdir(parents=True, exist_ok=True)
    w.page.screenshot(path=str(SHOTS / scene.replace(".py", ".png")))
    w.clean()
    w.page.close()


def test_a_tune_python_plays_is_followed_in_the_page_and_python_is_told_each_note(browser, pyctures_run, tmp_path):
    run = pyctures_run(scene_file(tmp_path, """
from pyctures import *
from synths import *
from staves import *

page = show_notes("C4 E4 G4 C5", "quarter", tempo=240)
began = []
page.on_note = lambda note: began.append((note.name, round(sound_time(), 3)))
page.on_done = lambda p: began.append("done")
state = {"clicked": False, "said": False}

def on_mouse_down(x, y):
    state["clicked"] = True
    page.play()

def draw():
    background("navy")
    if "done" in began and not state["said"]:
        state["said"] = True
        names = [b[0] for b in began[:-1]]
        gaps = [round(began[i + 1][1] - began[i][1], 2) for i in range(len(names) - 1)]
        print("RESULT", names, gaps, page.playing)
"""))
    w = Watched(browser, run.url)
    w.ready()
    w.page.mouse.click(450, 600)
    # While it plays, the page lights the notes by itself: Python sends it nothing more.
    w.wait("%s.playing && %s.active.length > 0" % (PAGE, PAGE), timeout=10)
    lit = w.page.evaluate("%s.sounding" % PAGE)
    assert lit and lit[0] in (60, 64, 67, 72)
    end = time.time() + 10
    while time.time() < end and "RESULT" not in run_output(w):
        w.page.wait_for_timeout(100)
    out = run_output(w)
    assert "RESULT ['C4', 'E4', 'G4', 'C5']" in out, out
    gaps = eval(out.split("RESULT ['C4', 'E4', 'G4', 'C5'] ")[1].split("]")[0] + "]")
    # A quarter note at 240 beats a minute is a quarter of a second: each note is told to Python that long after the last, to a few frames.
    assert all(abs(g - 0.25) < 0.08 for g in gaps), gaps
    assert w.page.evaluate("%s.playing" % PAGE) is False
    w.clean()
    w.page.close()


def run_output(w):
    """What the scene printed: Pyctures shows it on the page and in the console."""
    return w.page.evaluate("document.body.innerText") + "\\n" + "\\n".join(w.said)


def test_a_learner_plays_along_on_a_pydials_keyboard_tied_to_the_page(browser, pyctures_run, tmp_path):
    run = pyctures_run(scene_file(tmp_path, """
from pyctures import *
from synths import *
from pydials import *
from staves import *

lead = make_synth("keys")
page = show_notes("C4 E4 G4", "quarter", play_along="wait", synth=lead)
piano = keyboard(page, octave=4, octaves=1)
said = []

def draw():
    background("navy")
    r = page.result
    if r.done and not said:         # (said once, at the end: what a scene prints is shown under the picture, and moves the keys)
        said.append(1)
        print("TALLY %d %d %s" % (r.right, r.wrong, r.done))
"""))
    w = Watched(browser, run.url)
    w.ready()
    w.wait("%s.along && %s.along.groups.length === 3" % (PAGE, PAGE))
    w.wait("document.querySelector('[data-pyctures-src] canvas')[Symbol.for('dials.panel')].items.some((c) => c.kind === 'keyboard' && c.w > 0)")
    for key in (0, 2, 1, 4):           # C, E, then D (wrong), then G
        x, y = w.page.evaluate("""(i) => {
          const canvas = document.querySelector('[data-pyctures-src] canvas'), k = canvas[Symbol.for('dials.panel')].items.find((c) => c.kind === 'keyboard'), b = canvas.getBoundingClientRect()
          return [b.left + k.x + k.w / 8 * (i + 0.5), b.top + k.y + k.h * 0.85]
        }""", key)
        w.page.mouse.move(x, y)
        w.page.mouse.down()
        w.page.wait_for_timeout(100)
        w.page.mouse.up()
        w.page.wait_for_timeout(200)
    assert w.page.evaluate("[%s.result.right, %s.result.wrong, %s.result.done]" % (PAGE, PAGE, PAGE)) == [3, 1, True]
    end = time.time() + 5
    while time.time() < end and "TALLY 3 1 True" not in run_output(w):
        w.page.wait_for_timeout(100)
    assert "TALLY 3 1 True" in run_output(w), run_output(w)
    w.clean()
    w.page.close()
