# Twinkle: a tune written as code, one line a note, shown as sheet music. Click below the music and it
# plays: each note lights as it sounds, and a star goes up for it.
# Try changing: the notes; "quarter" to "eighth"; tempo=100 to 160; key="C" to "G" (and the notes to match).
#
# Run it:   pyctures run twinkle.py

import random

from pyctures import *
from synths import *
from pynotation import *

sheet = make_sheet(title="Twinkle, twinkle, little star", tempo=100, key="C")
for name in ["C4", "C4", "G4", "G4", "A4", "A4"]:
    sheet.add(name, "quarter")
sheet.add("G4", "half")
for name in ["F4", "F4", "E4", "E4", "D4", "D4"]:
    sheet.add(name, "quarter")
sheet.add("C4", "half")

page = show_notes(sheet, voice="bell")
stars = []


def on_note(note):
    stars.append({"x": random.uniform(40, width - 40), "y": height - 30, "size": 8 + (note.note - 55), "age": 0})


page.on_note = on_note


def on_mouse_down(x, y):
    if page.playing:
        page.stop()
    else:
        page.play()


def update(dt):
    for s in stars:
        s["y"] -= 90 * dt
        s["age"] += dt
    while stars and stars[0]["age"] > 4:
        stars.pop(0)


def draw():
    background("midnightblue")
    for s in stars:
        circle(s["x"], s["y"], s["size"], "gold")
    text("Click to stop" if page.playing else "Click here to play", width / 2, height - 24, "white", 18, "centre")
