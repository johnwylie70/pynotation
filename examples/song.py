# Song: a tracker song plays, and two of its channels are written out as it goes: the tune and the bass.
# The notes that are sounding are lit, a line moves through the bar, and the page turns by itself.
# Tap a bar to play from there; tap a note to hear it.
# Try changing: channels=[3, 1] to [0, 3] or [3, 1, 2] (2 is the drums); grand=True; paper="dark".
#
# Run it:   pyctures run song.py     (songs/night_drive.json sits beside this file)

from pyctures import *
from synths import *
from staves import *

song = play_song("songs/night_drive.json", patches={"tune": {"preset": "bell", "echo": 0.3}})
page = show_notes("songs/night_drive.json", channels=[3, 1], follow=song)

rings = []


def on_note(note):
    rings.append({"x": width * (0.15 + 0.7 * ((note.note - 33) % 36) / 36), "hue": note.note * 30, "age": 0})


page.on_note = on_note


def update(dt):
    for r in rings:
        r["age"] += dt
    while rings and rings[0]["age"] > 1.2:
        rings.pop(0)


def draw():
    background("#0b1020")
    for r in rings:
        circle(r["x"], height * 0.78, 12 + 70 * r["age"], outline="hsla(%d, 90%%, 65%%, %.2f)" % (r["hue"], 1 - r["age"] / 1.2), thickness=4)
    # A browser keeps a page silent until it has been touched: say so until the song is going.
    if song.position["state"] != "playing":
        text("Tap anywhere to start the song", width / 2, height - 24, "white", 18, "centre")
    else:
        text("bar %d" % page.bar, width / 2, height - 24, "#8fd3ff", 16, "centre")
