# Play along: the music waits for you. Play each note on the keys (a finger, the mouse, or the computer's
# keys A S D F G H J): the key to press next is lit. A right note turns green, a wrong one shows in red.
# Try changing: "wait" to "time" (the line keeps going, at the tempo, after a bar counted in); the tune;
# tempo=80; hint=False (no lit key).
#
# Run it:   pyctures run play_along.py

from pyctures import *
from synths import *
from pydials import *
from staves import *

lead = make_synth("keys")
page = show_notes("E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2", "quarter", title="Mary had a little lamb", tempo=80)
page.play_along("wait", synth=lead)        # lead is heard when a key goes down
keyboard(page, octave=4, octaves=1)        # the keys play the page


def draw():
    background("#12261e")
    r = page.result
    if r.done:
        words = "Done! %d right, %d wrong: %d%%. Click here to go again." % (r.right, r.wrong, r.percent)
    else:
        words = "%d of %d played, %d wrong" % (r.right, r.total, r.wrong)
    text(words, width / 2, height * 0.5, "white", 20, "centre")


def on_mouse_down(x, y):
    if page.result.done:
        page.play_along("wait", synth=lead)
