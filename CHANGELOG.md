# Changes

## Unreleased

- `show_notes("C4 E4 G4 - C5:2", "quarter")` writes a tune out as sheet music in a Pyctures scene; `make_sheet(key="G", time="3/4")` is written a note at a time; a list of `{"note", "start", "length"}` is plain data; a tracker song (a JSON file beside the scene, a dictionary, or packed bytes) is written out a staff a channel.
- `page.play()` plays the music through `synths` and the page follows it; `page.follow(song)` follows a song from `play_song`, and a tapped bar sends the song there; `on_note`, `on_bar`, `on_tap` and `on_done` are called as things happen.
- `page.play_along("wait")` or `"time"`: the learner plays through `note_on`, or on a pydials `keyboard(page)`; `page.result` counts right, wrong and missed notes.
- The page's half is `notation.js` itself, carried in the package; Python sends one command for each page of music.
- Three examples: a nursery tune written as code, a song with two staves following, and a play-along trainer with a keyboard.
