/**
 * notation.js: music written as notes on a staff, that lights up as it plays.
 *
 *   const { showNotes, makeSheet } = await use("notation.js")            (a pictures.js scene)
 *   import { showNotes, makeSheet, useSound } from "./notation.js"       (any page)
 *
 *   showNotes("C4 E4 G4 - C5:2", "quarter")        a tune in the words of playNotes, drawn as sheet music
 *   showNotes(song, { channels: [0, 1] })          a tracker song (our JSON, or a packed MOD or XM), a staff a channel
 *   showNotes([{ note: "C4", start: 0, length: 1 }])    plain data, in beats
 *   const sheet = makeSheet({ clef: "treble", key: "G", time: "3/4" })
 *   sheet.add("G4", "quarter"); sheet.add(["B4", "D5"], "half"); showNotes(sheet)
 *
 *   const page = showNotes(...)        what you get back: the page of music
 *   page.play()                        play it (through the sound it was given) and follow it
 *   page.follow(song)                  follow a song that is playing: its notes light, a line moves, the page turns
 *   page.onNote = (note) => { ... }    a note has just begun
 *   page.playAlong("wait")             the learner plays: page.noteOn(60) from any keyboard; right is green, wrong is red
 *
 * THE MUSIC IS LAID OUT ONCE and drawn on a canvas of its own, over the scene's or filling an
 * element. While it follows, only the bars whose notes changed colour are drawn again; the line
 * that moves is an element of its own. So following costs the scene nothing it would notice.
 *
 * TIME IS NEVER KEPT HERE. Where the music has got to is read every frame from whatever is being
 * followed: a song's `position`, the sound library's clock (`soundTime()`), or a function of your
 * own that gives beats. So the notes that light are the notes that are heard.
 *
 * NO SOUND LIBRARY IS NAMED HERE. A sound is known by what it can do, all of it optional:
 * `soundTime()`, `playNote(note, seconds)`, `makeSynth(name)` and a synth's `playNotes(text, step, { at })`.
 * Hand one over with `useSound(sound)` and the page can play what it shows.
 *
 * The Python spellings (`show_notes`, `on_note`, `play_along`) are understood wherever a name is looked for.
 *
 * MIT licence. The outlines of the music symbols are from the Leland font, under the SIL Open Font
 * Licence 1.1 (see LICENSE-GLYPHS).
 */

const version = '0.0.0'

/* GLYPHS:BEGIN */
// Leland 0.80. Written by scripts/make-glyphs.py; do not edit by hand.
const GLYPHS = {
  gClef: [0, -1112, 640, 666, 'm420 206c-20 4-39 6-58 6c-143 0-265-100-265-251c0-122 86-231 174-307c17-15 33-29 48-44c9 54 16 101 23 142c-91 27-153 123-153 217c0 70 55 166 135 166c8 0 17-4 17-13c0-9-10-14-22-22c-39-24-61-50-61-99c0-61 45-110 104-124zm-88-1028c9-40 55-145 107-145c15 0 39 49 39 118c0 104-77 182-146 250c-6-40-11-79-11-121c0-37 3-71 11-102zm230 843c0 71-29 144-100 173c-21-120-48-279-55-323c90 0 155 61 155 150zm-440 492c0 66 51 153 186 153c47 0 88-12 124-34c54-38 68-104 68-167c0-39-6-84-16-141c-3-20-9-50-15-89c98-32 171-134 171-237c0-151-107-253-253-253c-10-60-20-119-29-175c106-111 179-236 179-395c0-91-28-165-44-201c-24-51-53-86-71-86c-7 0-38 12-71 51c-64 76-82 204-82 288c0 54 5 103 22 215c-1 1-53 54-74 71c-91 85-217 206-217 406c0 187 163 334 349 334c29 0 56-3 79-7c19 96 30 166 30 219c0 104-53 159-154 159c-24 0-45-5-47-5c-1-1-3-2-3-3c0-2 2-3 5-4c47-7 94-47 94-111c0-54-41-111-116-111c-70 0-115 57-115 123z'],
  fClef: [0, -251, 664, 617, 'm568-124c0 28 22 50 48 50c26 0 48-22 48-50c0-28-22-51-48-51c-26 0-48 23-48 51zm-314-127c-76 0-137 44-138 44c-59 43-97 109-97 182c0 73 42 127 116 127c64 0 114-43 114-109c0-57-50-104-106-104c-12 0-23 2-32 5c-10 4-27 14-35 21c7-44 37-88 76-109c25-14 57-20 92-20c102 0 152 82 152 250c0 130-83 317-181 405c-104 95-202 140-203 140c0 0-12 7-12 19c0 2 1 3 1 5c3 10 12 12 18 12c1 0 4-1 5-1c1 0 115-47 206-118c140-101 298-279 298-463c0-174-94-286-274-286zm314 374c0 28 22 51 48 51c26 0 48-23 48-51c0-28-22-51-48-51c-26 0-48 23-48 51z'],
  unpitchedPercussionClef1: [0, -252, 352, 252, 'm13-252c-7 0-13 6-13 13l0 478c0 7 6 13 13 13l110 0c7 0 13-6 13-13l0-478c0-7-6-13-13-13zm216 0c-7 0-13 6-13 13l0 478c0 7 6 13 13 13l110 0c7 0 13-6 13-13l0-478c0-7-6-13-13-13z'],
  noteheadBlack: [0, -132, 325, 133, 'm0 42c0 43 31 91 112 91c104 0 213-85 213-173c0-59-50-92-112-92c-97 0-213 82-213 174z'],
  noteheadHalf: [0, -132, 325, 133, 'm75 86c-33 0-40-27-40-36c0-49 168-135 215-135c24 0 40 14 40 36c0 50-169 135-215 135zm138-218c-97 0-213 81-213 174c0 43 31 91 112 91c104 0 213-85 213-173c0-59-50-92-112-92z'],
  noteheadWhole: [0, -136, 373, 134, 'm195 102c-28 0-47-8-60-33c-13-25-31-89-32-116c-2-27 8-43 32-51c12-4 28-6 43-6c28 0 46 6 60 33c14 27 32 91 32 116c0 49-34 57-75 57zm-8-238c-138 0-187 70-187 135c0 65 49 135 187 135c138 0 186-70 186-135c0-65-48-135-186-135z'],
  noteheadXBlack: [0, -132, 325, 132, 'm320-96c3-2 5-6 5-10l0-1c0-4-2-7-4-9l-12-12c-3-2-6-4-10-4c-3 0-7 1-9 3l-127 101l-128-101c-2-2-6-3-9-3c-4 0-6 2-9 4l-13 12c-2 2-4 6-4 10c0 4 2 8 5 10l122 96l-122 96c-3 2-5 6-5 10c0 3 2 7 4 9l12 13c2 3 6 4 10 4c3 0 7-1 9-3l128-101l127 101c2 2 6 3 9 3c4 0 8-1 10-4l12-13c2-2 4-6 4-9c0-4-2-8-5-10l-122-96z'],
  flag8thUp: [0, -12, 289, 817, 'm0 227c0 3 1 8 8 11c43 14 129 68 194 179c18 31 47 74 47 157c0 72-19 146-45 218c-2 6-4 11-3 15c0 6 4 10 10 10c7 0 12-4 16-11c45-80 62-173 62-264c-5-129-79-224-79-224c3 0-92-123-119-165c-37-57-54-114-56-118c-1-3-10-39-10-39c-1-4-6-8-12-8c-7 0-13 6-13 13z'],
  flag8thDown: [0, -817, 309, 12, 'm0-1c0 7 6 13 13 13c5 0 11-4 12-8c0-1 9-36 10-39c1-4 10-42 46-101c39-65 99-112 149-182c49-70 79-136 79-224c0-91-21-167-74-264c-3-7-9-11-15-11c-2 0-4 0-5 1c-5 2-7 6-7 12c0 3 1 8 3 12c40 93 56 146 56 218c0 83-29 126-47 157c-65 111-170 165-212 179c-7 3-8 8-8 11z'],
  flag16thUp: [0, -12, 279, 820, 'm209 473c-27-35-57-67-106-116c-39-39-57-73-64-99c-1-5-2-12-3-20c51 0 116 69 152 116c39 51 48 91 48 129c0 10-1 20-2 30c-8-16-17-29-25-40zm-209-92c0 3 8 7 15 10c26 9 104 59 164 148c34 51 42 87 42 121c0 6 0 11-1 17c0 24-7 75-22 115c-1 5-4 11-4 16c0 4 2 8 7 11c2 1 3 1 5 1c7 0 11-8 15-14c18-28 44-82 44-138c0-29-2-53-5-74c10-37 19-74 19-123c0-52-14-99-48-144c-47-62-98-114-136-169c-38-55-66-158-66-158c-2-7-3-12-14-12c-12 0-15 5-15 12z'],
  flag16thDown: [0, -803, 309, 26, 'm37-240c1-5 2-9 2-12c7-25 15-62 74-107c58-45 127-101 154-149c-4 154-84 229-230 268zm-37 250c0 8 7 16 15 16c8 0 13-8 15-16c15-103 46-133 86-171c53-51 193-128 193-313c0-33-3-70-9-107c4-13 6-31 6-57c0-79-46-134-79-160c-4-3-10-5-16-5c-4 0-17 3-17 8c0 3 6 7 10 11c35 37 61 71 61 138c0 13-1 26-5 38l-1 3c-21 84-167 173-244 190c-7 3-15 25-15 27z'],
  flag32ndUp: [0, -186, 279, 821, 'm188 180c39 51 48 92 48 130c0 6-1 11-1 16c-1-2-3-4-4-6c-47-62-130-132-168-187c-15-22-23-47-28-69c51 0 117 69 153 116zm21 294c-27-35-57-66-106-116c-39-39-57-73-64-99c-1-5-2-13-4-21c52 0 117 62 153 109c39 52 48 92 48 130c0 12-1 24-2 36c-8-16-17-28-25-39zm-209-92c0 3 8 7 15 10c26 9 104 59 164 148c34 51 42 87 42 121c0 6 0 11-1 17c0 24-7 75-22 115c-1 5-4 11-4 16c0 4 2 8 7 11c2 1 3 1 5 1c7 0 11-8 15-14c18-28 44-82 44-138c0-29-2-53-5-74c10-38 19-81 19-131c0-25-4-50-11-73c7-31 11-62 11-94c0-52-14-99-48-144c-47-62-98-114-136-169c-38-55-66-158-66-158c-2-7-3-12-14-12c-12 0-15 5-15 12z'],
  flag32ndDown: [0, -804, 309, 216, 'm113-359c59-50 114-87 141-122c4-5 8-11 11-16c1 5 1 11 1 16c0 134-119 201-229 243c1-6 2-11 2-14c7-26 17-60 74-107zm-78 308c5-22 14-47 28-68c38-55 126-101 178-160c10-11 19-23 26-36c0 74-16 116-42 149c-62 76-140 101-190 115zm-35 251c0 7 7 16 15 16c8 0 13-8 15-16c15-104 46-134 86-172c53-50 193-127 193-312c0-37-4-77-10-117c3-17 6-34 7-51c0-5 0-11 0-17c0-31-4-61-11-92c7-22 11-47 11-77c0-79-46-134-79-160c-4-3-9-5-15-5c-4 0-18 3-18 8c0 3 6 6 10 11c35 37 61 71 61 138c0 37-12 68-38 98c-70 81-167 123-212 133c-7 3-15 25-15 27z'],
  restWhole: [0, -5, 325, 131, 'm14-5c-8 0-14 6-14 14l0 108c0 8 6 14 14 14l297 0c8 0 14-6 14-14l0-108c0-8-6-14-14-14z'],
  restHalf: [0, -132, 325, 4, 'm0-10c0 14 0 14 14 14l297 0c14 0 14 0 14-14l0-108c0-14 0-14-14-14l-297 0c-14 0-14 0-14 14z'],
  restQuarter: [0, -401, 235, 331, 'm230 166c-1-1-3-3-6-7l-115-142c-1-1-2-4-2-6c0-3 1-7 2-9l102-154c1-2 2-5 2-7l0-9c0-3-1-6-3-8l-162-219c0 0-4-6-10-6c-3 0-5 1-8 3c-4 3-5 7-5 10c0 6 3 11 3 11l76 104c2 3 3 7 3 12c0 4-1 9-3 12l-101 154c-1 2-2 6-2 8l0 9c0 3 1 6 3 8l112 139c-4-1-13-3-25-3c-51 0-91 42-91 93c0 14 3 28 11 39c21 32 96 127 96 127c0 0 5 6 12 6c2 0 4 0 6-2c5-4 7-8 7-12c0-4-2-7-3-9c-3-5-35-63-35-63c0 0-7-14-7-32c0-32 24-58 56-58c13 0 24 4 32 9l39 25c0 0 4 2 8 2c4 0 7-1 10-5c2-4 3-6 3-9c0-3-1-5-3-8z'],
  rest8th: [0, -204, 276, 256, 'm267-203c-1 0-3-1-4-1c-6 0-11 3-13 8c-4 6-35 65-80 98c-13 10-29 17-45 20c11-13 18-29 18-48c0-39-32-71-71-71c-40 0-72 32-72 71c0 54 53 79 100 79c53 0 88-25 122-62l-114 356l27 8l140-441c1-1 1-3 1-5c0-5-3-9-9-12z'],
  rest16th: [1, -204, 344, 507, 'm343-186c1-2 1-3 1-5c0-5-3-10-9-12c-2-1-4-1-5-1c-6 0-10 3-13 8c-24 48-64 102-119 116c12-14 17-30 17-48c0-39-35-69-74-69c-40 2-69 35-69 74c2 56 56 75 103 75c50-2 89-27 119-66l-45 159c-14 47-71 112-122 125c11-14 17-31 17-48c0-40-34-69-73-69c-40 0-70 34-70 74c0 30 21 55 47 64c19 8 36 10 56 10c50-2 89-27 119-66l-102 365l27 7z'],
  rest32nd: [0, -460, 391, 507, 'm151-49c91 0 128-63 132-70l-37 151c-22 52-60 119-118 135c11-14 14-30 14-48c0-40-32-66-71-66c-39 0-71 30-71 70c0 52 44 77 97 77c53 0 95-29 125-71l-91 372l27 6l232-950c1-1 1-3 1-4c0-6-4-10-10-12c-1-1-3-1-4-1c-6 0-10 4-13 9c-19 42-65 101-113 113c12-15 15-30 15-48c0-38-31-67-70-67c-39 0-72 30-72 72c0 53 47 73 92 76c4 0 8 0 13-1c49-3 89-31 117-70l-39 161c-20 50-63 120-119 134c12-15 15-30 15-48c0-40-33-67-72-67c-39 0-70 31-70 71c0 47 45 76 90 76z'],
  brace: [0, -995, 62, -5, 'm9-500c18-19 53-58 53-130c0-91-39-183-39-240c0-61 35-118 37-120c0-1 0-1 0-2c0-1 0-2-1-3c-1 0-3 0-4 2c-1 1-55 55-55 137c0 88 35 150 35 265c0 22-9 57-34 88c-1 0-1 2-1 3c-1 1 0 2 1 3c25 31 34 66 34 88c0 115-35 177-35 265c0 81 54 136 55 137c1 2 3 3 4 2c1-1 2-2 1-3c0 0 0-1 0-2c-2-2-37-59-37-120c0-57 39-149 39-240c0-73-35-111-53-130z'],
  accidentalSharp: [0, -334, 244, 333, 'm78-74l89-18l0 165l-89 19zm155-31c6-1 11-8 11-14l0-59c0-8-6-14-14-14l-2 0l-33 7l0-149l-28 0l0 155l-89 18l0-141l-28 0l0 147l-39 8c-6 1-11 8-11 14l0 58c0 8 6 14 14 14l3 0l33-7l0 165l-39 8c-6 1-11 8-11 14l0 58c0 8 6 14 14 14l3 0l33-7l0 149l28 0l0-155l89-18l0 141l28 0l0-147l38-7c6-1 11-8 11-14l0-59c0-8-6-14-14-14l-2 0l-33 7l0-165z'],
  accidentalFlat: [0, -453, 203, 176, 'm132-40c0 79-41 121-99 167l3-195c2-9 17-38 57-38c36 0 39 34 39 55zm-12-115c-50 0-79 31-84 37l4-321c0-8-6-14-14-14l-12 0c-8 0-14 6-14 14l5 601c0 8 6 14 14 14c2 0 6-1 8-2c86-43 176-125 176-228c0-52-24-101-83-101z'],
  accidentalNatural: [0, -325, 171, 323, 'm28 97l0-164l116-33l0 165zm138-280c-2-2-5-3-8-3c-1 0-3 1-4 1l-126 35l0-175l-28 0l0 495c0 8 6 13 14 13l4 0l126-35l0 175l27 0l0-495c0-4-2-9-5-11z'],
  timeSig0: [15, -255, 389, 254, 'm202-255c-106 0-187 110-187 255c0 145 81 254 187 254c106 0 187-109 187-254c0-145-81-255-187-255zm59 394c0 36-16 75-59 75c-43 0-59-39-59-75l0-278c0-36 16-75 59-75c43 0 59 39 59 75z'],
  timeSig1: [15, -245, 336, 243, 'm249 197l0-430c0-7-5-12-12-12l-99 0c-2 0-4 1-6 2l-4 4l-112 194c-1 2-1 4-1 6c0 4 3 8 6 10l19 11c2 1 4 2 6 2c4 0 8-3 10-6l71-122l0 341l-76 0c-7 0-12 5-12 12l0 22c0 7 5 12 12 12l274 0c7 0 11-5 11-12l0-22c0-7-4-12-11-12z'],
  timeSig2: [15, -245, 377, 243, 'm342 39c-8 22-28 94-77 94c-65 0-79-40-133-40c-8 0-16 1-26 3c0 0 25-38 131-71c106-33 133-85 133-145c0-42-19-125-170-125c-151 0-179 91-179 137c0 41 34 74 75 74c41 0 74-33 74-74c0-28-20-59-46-69c-3-1-7-6-7-11c0-6 5-13 23-18c5-2 19-5 34-5c57 0 68 35 68 86c0 117-139 142-197 229c0 0-30 42-30 89c0 47 24 50 36 50c16 0 33-13 33-31c0-4-1-8-3-13c-6-14-8-25-8-33c0-3 0-6 1-9c1-6 9-16 33-16c29 0 40 34 58 60c18 26 46 42 78 42c32 0 75-23 93-60c18-37 41-112 41-139c0-13-8-19-17-19c-7 0-14 4-18 14z'],
  timeSig3: [15, -244, 364, 244, 'm272-16c80-31 85-83 85-101l0-5c0-9-3-122-175-122c-172 0-167 122-167 122l1 0l-1 2c0 36 29 64 65 64c36 0 64-28 64-64c0-29-22-57-50-63l3-3c14-10 33-15 52-15c42 0 87 25 87 79c0 63-47 72-59 74c-12 2-68 6-80 6c-12 0-13 14-13 14l0 20c0 0 2 11 13 12c17 1 40 1 72 6c44 6 67 36 67 106c0 67-45 85-87 85c-28 0-54-8-65-16c33-2 60-31 60-64c0-36-28-65-64-65c-36 0-65 29-65 65c0 82 75 123 149 123c96 0 200-33 200-142c0-73-50-104-94-118z'],
  timeSig4: [14, -249, 442, 248, 'm208 127l0 74l-83 0c-7 0-14 6-14 14l0 19c0 8 7 14 14 14l303 0c8 0 14-6 14-14l0-19c0-8-6-14-14-14l-90 0l0-74l90 0c8 0 14-7 14-15l0-19c0-7-6-14-14-14l-90 0l0-159c0-6-3-11-7-13l-12-6c-2-1-3-1-5-1c-4 0-8 0-11 3l-91 83c-3 3-4 7-4 11l0 82l-116 0c0 0 112-120 230-278c4-5 5-10 5-14c0-5-2-9-3-10l-22-22c-3-2-6-4-10-4c-6 0-141 0-149 0c-7 0-12 6-13 12c0 0-5 74-31 155c-26 81-56 131-82 168c0 0-3 5-3 11c0 2 0 4 1 6c3 7 10 18 10 18c0 0 2 6 11 6z'],
  timeSig5: [15, -246, 362, 244, 'm27-218c0 0 5 48 5 100l0 13c-1 56-5 122-5 122c0 5 0 15 7 16c9 2 30 7 35 8c2 0 3 0 5 0c4 0 8-1 10-7c5-13 16-65 79-65c71 0 84 61 84 109c0 50-16 122-82 125l-8 0c-23 0-36-3-42-7c-3-1-5-4-5-6c0-3 1-5 4-7c9-6 40-17 40-66c0-49-34-68-73-68c-39 0-66 36-66 70c0 88 83 125 160 125c102 0 187-61 187-168c0-106-74-162-174-162c-33 0-68 8-97 28c-1 1-3 1-4 1c-4 0-7-3-7-7l0-63c0-6 5-11 11-11l1 0c15 1 48 5 83 5c72 0 126-15 154-89c1-3 2-7 2-10c0-8-5-14-18-14c-4 0-8 1-14 2c-49 12-87 16-124 16c-36 0-71-4-114-10c0 0-5-1-12-1c-15 0-22 5-22 21z'],
  timeSig6: [15, -245, 387, 244, 'm210 202c-33 0-60-45-60-101c0-56 27-102 60-102c33 0 61 46 61 102c0 56-28 101-61 101zm37-250c-61 0-83 18-97 33c-3-21-5-37-5-53c0-57 20-131 90-131c25 0 40 8 50 19c-21 9-38 36-38 59c0 36 28 64 64 64c36 0 65-28 65-64l0-3c0-9-2-24-6-32c-13-36-55-89-155-89c-90 0-155 86-175 132c-10 24-25 73-25 129c0 61 17 130 76 182c58 44 95 46 130 46c35 0 166-41 166-157c0-98-77-135-140-135z'],
  timeSig7: [14, -251, 366, 250, 'm162 123c-22 33-51 73-51 110c0 11 3 17 14 17c16 0 26-4 58-6c3 0 7-1 10-1c29 0 56 7 63 7c9 0 26-11 25-20c0-1 0-2 0-3c0-2-6-33-6-70c0-21 2-45 8-67c12-47 44-132 66-195c11-31 17-86 17-109c0-9 0-13-1-23c-1-10-5-14-11-14l-18 0c-5 0-12 4-12 14c0 10-2 79-42 79c-42 0-54-86-119-86c-62 0-100 63-103 69l0-48c0-6-5-11-11-11l-23 0c-6 0-11 5-11 11l0 185c0 6 5 11 11 11l23 0c6 0 11-5 11-11l0-32c0-23 15-54 50-54c35 0 38 38 118 38c20 0 57-3 67-13c-8 16-110 189-133 222z'],
  timeSig8: [15, -246, 393, 248, 'm268-45c-68-22-143-55-143-100c0-39 36-55 79-55c62 0 104 29 104 75c0 48-22 71-40 80zm-64 237c-64 0-119-35-119-91c0-67 52-83 52-83c68 23 165 57 165 112c0 27-35 62-98 62zm120-210c33-25 56-57 56-97c0-72-79-131-176-131c-97 0-176 59-176 131c0 40 10 76 57 106c-45 26-70 63-70 111c0 81 85 146 189 146c104 0 189-65 189-146c0-48-17-93-69-120z'],
  timeSig9: [15, -245, 387, 244, 'm192-204c33 0 60 46 60 102c0 56-27 101-60 101c-33 0-61-45-61-101c0-56 28-102 61-102zm-37 251c61 0 83-18 97-33c3 21 5 37 5 53c0 57-20 131-90 131c-25 0-40-8-50-19c21-9 38-36 38-59c0-36-28-64-64-64c-36 0-65 28-65 64l0 3c0 9 2 24 6 32c13 36 55 89 155 89c90 0 155-86 175-132c10-24 25-73 25-129c0-61-17-130-76-182c-58-44-95-46-130-46c-35 0-166 41-166 157c0 98 77 135 140 135z'],
  wiggleArpeggiatoUp: [-22, -164, 242, 0, 'm238-85c0 0-6-7-14-14c-3-3-7-4-10-4c-3 0-5 1-7 3l-11 11c-2 2-4 3-6 3c-4 0-6-3-6-3c0 0-64-55-74-64c-11-8-22-11-32-11c-21 0-40 12-48 21l-48 48c-3 3-4 5-4 8c0 5 4 9 4 9c0 0 6 7 14 14c3 3 6 4 9 4c3 0 5-1 7-3l11-11c2-2 4-3 6-3c4 0 7 3 7 3c0 0 64 54 74 63c11 8 22 11 32 11c21 0 40-12 48-21l48-48c3-3 4-6 4-8c0-5-4-8-4-8z'],
}
// Where a stem meets its note head: up-stem x, y, down-stem x, y (font units).
const STEM_AT = {noteheadBlack: [325, -40, 0, 42], noteheadHalf: [325, -40, 0, 42], noteheadXBlack: [325, -106, 0, 106]}
// The font's own thicknesses, in staff spaces.
const ENGRAVING = {staffLineThickness: 0.11, stemThickness: 0.1, beamThickness: 0.5, beamSpacing: 0.25, legerLineThickness: 0.16, legerLineExtension: 0.33, thinBarlineThickness: 0.18, thickBarlineThickness: 0.55, barlineSeparation: 0.37, tieEndpointThickness: 0.05, tieMidpointThickness: 0.21}
/* GLYPHS:END */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
const isList = (v) => Array.isArray(v) || ArrayBuffer.isView(v)
const isBytes = (v) => v instanceof ArrayBuffer || ArrayBuffer.isView(v)
const shown = (v) => { try { const s = typeof v === 'string' ? JSON.stringify(v) : typeof v === 'function' ? 'a function' : JSON.stringify(v) ?? String(v); return s.length > 60 ? s.slice(0, 57) + '…' : s } catch (e) { return String(v) } }
/** The first of these the thing has: a method ready to call, or a plain value as a function that gives it. */
const method = (thing, ...names) => {
  for (const name of names) if (thing != null && typeof thing[name] === 'function') return thing[name].bind(thing)
  return null
}
const SPELLING = { color: 'colour', colors: 'colours', on_note: 'onNote', on_bar: 'onBar', on_tap: 'onTap', on_done: 'onDone', on_right: 'onRight', on_wrong: 'onWrong', play_along: 'playAlong', rows_per_beat: 'rowsPerBeat', bar_numbers: 'barNumbers', any_octave: 'anyOctave', count_in: 'countIn' }
const spelled = (spec) => {
  const out = {}
  for (const key in spec) out[SPELLING[key] || key] = spec[key]
  return out
}

// --------------------------------------------------------------------------------------------
// NOTES, LENGTHS AND CHORDS, in the sound library's words (synths.js: synths-names.json).

/** Time is counted in ticks, 8 to a beat (a tick is a thirty-second note), so it is always whole numbers. */
const TICKS = 8
const LENGTHS = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25, thirtysecond: 0.125 }
const LENGTH_LETTERS = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 0.125 }
const NOT_A_LENGTH = 'a number of beats, or a note length by name: "whole", "half", "quarter", "eighth", "sixteenth" (also "1/4", "q", and "quarter." for a dotted one)'

/** A note length by name as a number of beats: "quarter" is 1, "eighth." is 0.75, "1/16" is 0.25. Not a length: null. */
function lengthBeats(name) {
  if (typeof name !== 'string') return null
  let text = name.toLowerCase().replace(/[\s_-]/g, '')
  let times = 1
  if (text.startsWith('dotted')) { times *= 1.5; text = text.slice(6) }
  if (text.endsWith('triplet')) { times *= 2 / 3; text = text.slice(0, -7) }
  if (text.endsWith('.')) { times *= 1.5; text = text.slice(0, -1) }
  if (text.endsWith('note')) text = text.slice(0, -4)
  if (text.length > 1 && /[a-z]3$/.test(text)) { times *= 2 / 3; text = text.slice(0, -1) }
  const fraction = /^(\d+)\/(\d+)$/.exec(text)
  if (fraction && +fraction[2] > 0) return 4 * fraction[1] / fraction[2] * times
  const beats = Object.hasOwn(LENGTHS, text) ? LENGTHS[text] : Object.hasOwn(LENGTH_LETTERS, text) ? LENGTH_LETTERS[text] : null
  return beats === null ? null : beats * times
}
const beatsLong = (value, said) => {
  if (value === undefined || value === null) return 1
  const beats = typeof value === 'string' ? lengthBeats(value) : value
  if (typeof beats !== 'number' || !(beats > 0)) throw new Error(`${said} needs ${NOT_A_LENGTH}, not ${shown(value)}`)
  return beats
}

const SEMITONES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
/** A note as a number: "C4" is 60, "A4" is 69, "F#3", "Bb5" and a tracker's "C-4" work, and a number is itself. */
function noteNumber(note) {
  if (typeof note === 'number' && Number.isFinite(note)) return note
  if (typeof note === 'string') {
    const m = /^\s*([a-gA-G])([#b♯♭]*)-?(\d+)?\s*$/.exec(note)
    if (m) {
      let n = SEMITONES[m[1].toLowerCase()]
      for (const c of m[2]) n += c === '#' || c === '♯' ? 1 : -1
      return 12 * ((m[3] === undefined ? 4 : +m[3]) + 1) + n
    }
    if (note.trim() !== '' && Number.isFinite(+note)) return +note
  }
  throw new Error(`${shown(note)} is not a note. Write a note as a name like "C4", "F#3" or "Bb5", or as a number, where 60 is middle C`)
}
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
/** A note's name: 60 is "C4". */
const noteName = (n) => NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1)

const CHORDS = { 5: [0, 7], 6: [0, 4, 7, 9], 7: [0, 4, 7, 10], 9: [0, 4, 7, 10, 14], major: [0, 4, 7], maj: [0, 4, 7], minor: [0, 3, 7], min: [0, 3, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], sus: [0, 5, 7], power: [0, 7], octave: [0, 12], oct: [0, 12], m6: [0, 3, 7, 9], dom7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], min7: [0, 3, 7, 10], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], mmaj7: [0, 3, 7, 11], add9: [0, 4, 7, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14] }
function chordKind(kind) {
  let k = String(kind).trim()
  if (/^M(?!aj|in|AJ|IN)/.test(k)) k = 'maj' + k.slice(1)
  k = k.toLowerCase().replace(/[\s_-]/g, '')
  if (k === '') k = 'major'
  return Object.hasOwn(CHORDS, k) ? CHORDS[k] : null
}
/** What a tune names -> a list of note numbers: a note, a list of notes, or a chord by name ("Cm7"). */
function notesOf(what) {
  if (isList(what)) return Array.from(what, noteNumber)
  if (typeof what === 'string' && !Number.isFinite(+what)) {
    const m = /^\s*([a-gA-G][#b♯♭]*(?:-?\d+)?)\s*(.*?)\s*$/.exec(what)
    if (m && m[2] !== '') {
      const steps = chordKind(m[2])
      if (!steps) throw new Error(`${shown(what)} is not a note or a chord. A note is written "C4" or "F#3", and a chord "Cm", "Cmaj7" or "Csus4"`)
      const base = noteNumber(m[1])
      return steps.map((s) => base + s)
    }
  }
  return [noteNumber(what)]
}

/** "3/4" or [3, 4] -> [3, 4]. */
function timeOf(time) {
  if (time === undefined || time === null) return [4, 4]
  const m = typeof time === 'string' ? /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(time) : null
  const [n, d] = m ? [+m[1], +m[2]] : isList(time) ? time : []
  if (!(n >= 1 && n <= 32) || ![1, 2, 4, 8, 16].includes(d)) throw new Error(`${shown(time)} is not a time signature. Write one as "4/4", "3/4" or "6/8"`)
  return [n, d]
}
const FIFTHS = { f: -1, c: 0, g: 1, d: 2, a: 3, e: 4, b: 5 }
/** A key by name as sharps (a positive number) or flats (a negative one): "G" is 1, "F" is -1, "Am" is 0, "Eb" is -3. */
function keyOf(key) {
  if (typeof key === 'number' && Number.isInteger(key) && key >= -7 && key <= 7) return key
  const m = typeof key === 'string' ? /^\s*([a-gA-G])([#b♯♭]?)\s*(m|min|minor|maj|major)?\s*$/.exec(key) : null
  if (!m) throw new Error(`${shown(key)} is not a key. Write one as "C", "G", "Bb" or "Am", or as a number of sharps (3) or flats (-2)`)
  const fifths = FIFTHS[m[1].toLowerCase()] + (m[2] === '' ? 0 : m[2] === '#' || m[2] === '♯' ? 7 : -7) - (m[3] && m[3][0] === 'm' && m[3] !== 'maj' && m[3] !== 'major' ? 3 : 0)
  if (fifths < -7 || fifths > 7) throw new Error(`${shown(key)} would need more than seven sharps or flats. Try the same key by its other name`)
  return fifths
}

// --------------------------------------------------------------------------------------------
// WHAT IS GIVEN -> MUSIC: { tempo, time, key, title, parts: [{ name, clef, percussion, notes: [{ start, length, notes }] }] }
// `start` and `length` are in beats (a quarter note is one), `notes` are numbers (60 is middle C).

/**
 * A tune as playNotes takes it -> its notes. "C4 E4:q G4 - C5:2", or a list of notes, chords (lists) and rests
 * (null). `step` is how long a step is: a note length by name, or beats as a number; nothing said is an eighth.
 */
function readTune(tune, step) {
  const items = typeof tune === 'string' ? tune.trim().split(/[\s,|]+/).filter(Boolean) : tune
  if (!isList(items) || !items.length) throw new Error(`showNotes needs notes to show, as in showNotes("C4 E4 G4 - C5"), not ${shown(tune)}`)
  const one = step === undefined || step === null ? 0.5 : beatsLong(step, 'showNotes: the length of a step')
  const notes = []
  let at = 0
  for (const item of items) {
    let what = item, long = one
    if (typeof item === 'string') {
      const m = /^(.*?)(?::([^:]+))?$/.exec(item)
      what = m[1]
      if (m[2] && /^\d*\.?\d+$/.test(m[2])) long = +m[2] * one
      else if (m[2]) {
        long = lengthBeats(m[2])
        if (long === null) throw new Error(`In ${shown(item)}, ${shown(m[2])} is not a length. After the colon write how many steps (":2") or a note length (":q", ":h", ":eighth", ":1/4")`)
      }
      if (/^[-._~]*$/.test(what)) what = null
      else if (what.includes('+')) what = what.split('+')
    }
    if (what !== null && what !== undefined) notes.push({ start: at, length: long, notes: notesOf(what) })
    at += long
  }
  return { notes, length: at }
}

/** A sheet of music written a note at a time: sheet.add("G4", "quarter"), sheet.add(["B4", "D5"], "half"), sheet.rest("quarter"). */
class Sheet {
  constructor(options = {}) {
    Object.assign(this, spelled(options))
    this.notes = []
    this.length = 0
    this.pages = new Set()
  }
  /** A note, a chord (a list, or a name like "Cm") or a rest (null or "-"), each beginning where the last ended. */
  add(what, length) {
    const long = beatsLong(length, 'add: the length')
    if (what !== null && what !== undefined && what !== '-') this.notes.push({ start: this.length, length: long, notes: notesOf(what) })
    this.length += long
    for (const page of this.pages) page.changed()
    return this
  }
  note(what, length) { return this.add(what, length) }
  chord(what, length) { return this.add(what, length) }
  rest(length) { return this.add(null, length) }
  /** Start again with nothing written. */
  clear() { this.notes.length = 0; this.length = 0; for (const page of this.pages) page.changed(); return this }
}

/** Plain data: [{ note: "C4", start: 0, length: 1 }], with `notes` for a chord; start and length in beats. */
function readData(list) {
  return list.map((n, i) => {
    const what = n.notes ?? n.note ?? n.pitch
    if (what === undefined || typeof n.start !== 'number' || !(n.start >= 0)) throw new Error(`Note ${i + 1} of the list needs a note and when it starts, as in { note: "C4", start: 0, length: 1 }, not ${shown(n)}`)
    return { start: n.start, length: n.length === undefined ? 1 : beatsLong(n.length, `Note ${i + 1}: the length`), notes: notesOf(what) }
  })
}

const isSong = (v) => v && typeof v === 'object' && !isList(v) && (v.format === 'synths-song' || (Array.isArray(v.patterns) && v.patterns.length > 0))
const isData = (v) => Array.isArray(v) && v.length > 0 && v.every((n) => n && typeof n === 'object' && !Array.isArray(n))

/** Anything showNotes takes -> music. Options are the caller's: tempo, time, key, clef, title, and a song's own. */
function readMusic(what, step, o = {}) {
  let parts, more = {}
  if (what instanceof Sheet) {
    parts = [{ notes: what.notes, length: what.length }]
    more = { tempo: what.tempo, time: what.time, key: what.key, clef: what.clef, title: what.title }
  } else if (what && Array.isArray(what.sheet)) {
    // A sheet as a host elsewhere sends it: [[what, length], …] and its own key, time, tempo and title.
    const sheet = new Sheet(what)
    for (const [note, length] of what.sheet) sheet.add(note, length ?? undefined)
    return readMusic(sheet, step, o)
  } else if (what && typeof what.packed === 'string') return readSong(unpackSong(Uint8Array.from(atob(what.packed), (c) => c.charCodeAt(0))), o)
  else if (typeof what === 'string' && what.trim()[0] === '{') return readSong(JSON.parse(what), o)
  else if (isBytes(what)) return readSong(unpackSong(what), o)
  else if (isSong(what)) return readSong(what, o)
  else if (what && Array.isArray(what.parts)) { parts = what.parts; more = what } else if (isData(what)) parts = [{ notes: readData(what) }]
  else if (what && typeof what === 'object' && !isList(what) && Array.isArray(what.steps)) {
    // A tune as the sound library sends it: steps of [when, notes, how long, loudness], in beats or in seconds.
    const per = what.beats ? 1 : (o.tempo || 120) / 60
    parts = [{ notes: what.steps.map(([at, notes, long]) => ({ start: at * per, length: Math.max(0.125, long * per), notes: notesOf(notes) })), length: what.length * per, tidy: true }]
  } else if (typeof what === 'string' || isList(what)) parts = [readTune(what, step)]
  else throw new Error(`showNotes needs music to show: notes as text ("C4 E4 G4"), a list, a sheet from makeSheet(), or a song. It was given ${shown(what)}`)
  const pick = (name) => (o[name] !== undefined ? o[name] : more[name])
  return {
    tempo: pick('tempo') || 120, time: timeOf(pick('time')), key: pick('key') === undefined || pick('key') === null ? null : keyOf(pick('key')), title: pick('title') || '',
    parts: parts.map((p) => ({ name: p.name || '', clef: p.clef || pick('clef') || null, percussion: !!p.percussion, notes: p.notes, length: p.length, tidy: p.tidy })),
  }
}

// --------------------------------------------------------------------------------------------
// A TRACKER SONG -> MUSIC. A tracker's grid is rows and ticks; written music is beats and bars.

/** The packed form of a song (synths-core/docs/song-format.md), which is also what packSong makes of a MOD or XM -> the song as the JSON has it. */
function unpackSong(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes.buffer || bytes, bytes.byteOffset || 0, bytes.byteLength)
  const magic = String.fromCharCode(b[0], b[1], b[2], b[3])
  if (magic !== 'SYSG') {
    const kind = String.fromCharCode(...b.subarray(0, 17)) === 'Extended Module: ' ? 'an XM file' : b.length > 1084 && /^[\x20-\x7e]{4}$/.test(String.fromCharCode(...b.subarray(1080, 1084))) ? 'a MOD file' : 'not a song this can read'
    throw new Error(`These bytes are ${kind}. Turn a MOD or XM into our own kind of song first with the sound library: showNotes(await packSong(bytes))`)
  }
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let p = 4
  const u8 = () => (p < b.length ? b[p++] : (p++, 0))
  const u16 = () => { const n = p + 2 <= b.length ? v.getUint16(p, true) : 0; p += 2; return n }
  const u32 = () => { const n = p + 4 <= b.length ? v.getUint32(p, true) : 0; p += 4; return n }
  const text = () => { const n = u16(); if (n === 0xffff) return null; const s = new TextDecoder().decode(b.subarray(p, p + n)); p += n; return s }
  const version = u16()
  if (version > 2) throw new Error(`This song is in a newer form (version ${version}) than this copy of notation.js reads (2)`)
  const extras = []
  const flags = u16()
  const song = { format: 'synths-song', version: 2, rules: flags & 1 ? 'protracker' : 'ft2', speed: u8(), tempo: u8() }
  song.restart = u16()
  song.channels = u16()
  const counts = [u16(), u16(), u16(), u16()]
  song.title = text() || ''
  p += song.channels
  song.order = Array.from({ length: counts[0] }, u16)
  song.patterns = []
  for (let i = 0; i < counts[1] && p < b.length; i++) {
    const pattern = { rows: u16(), events: [] }
    for (let n = u32(); n > 0 && p < b.length; n--) {
      const e = { row: u16(), ch: u8() }
      const more = u8(), chord = more & 3
      const note = u8(), ins = u8(), vol = u8(), fx = u8(), param = u8()
      // (Version 2: the number of the event's entry in the list of extras, where a glide over a time is kept.)
      if (more & 4) { e.extra = u16(); extras.push(e) }
      if (note) e.note = note
      if (ins) e.ins = ins
      if (vol >= 0x10 && vol <= 0x50) e.vol = vol - 0x10
      else if (vol >= 0xf0) e.glide = true
      if (fx || param) e.fx = [fx, param]
      if (chord === 1) {
        // An arpeggio as version 1 packed it: one voice whose pitch jumps.
        const used = u8()
        p += 7
        const offsets = Array.from({ length: 8 }, () => (u8() << 24) >> 24)
        e.arp = used ? { chord: offsets.slice(0, used) } : 'off'
      } else if (chord === 2) {
        // A chord or an arpeggio in full: its notes together, or one at a time.
        const used = u8(), arp = u8(), order = u8()
        p += 21
        const offsets = Array.from({ length: 8 }, () => (u8() << 24) >> 24).slice(0, used)
        if (arp) e.arp = { chord: offsets, order: order === 6 ? 'together' : 'up' }
        else e.chord = offsets
      }
      pattern.events.push(e)
    }
    song.patterns.push(pattern)
  }
  song.instruments = []
  for (let i = 0; i < counts[2] && p < b.length; i++) {
    const ins = { name: text() || '' }
    const patch = text()
    if (patch !== null) ins.patch = patch
    const kind = u8()
    if (kind === 1) ins.sample = u16()
    else if (kind === 2) { const keys = Array.from({ length: 96 }, u16); ins.sample = keys.find((k) => k !== 0xffff) }
    for (let e = 0; e < 2; e++) { const flag = u8(), points = u8(); p += 3 + points * 4; if (e === 0 && flag & 1) ins.envelope = true }
    p += 6
    song.instruments.push(ins)
  }
  song.samples = []
  for (let i = 0; i < counts[3] && p < b.length; i++) {
    const sample = { name: text() || '' }
    const flag = u8()
    p += 7
    sample.frames = u32()
    p += 8
    if (flag & 6) sample.loop = true
    p += sample.frames * (flag & 1 ? 2 : 1)
    song.samples.push(sample)
  }
  // What version 2 added comes last. Only a glide matters to what is written: a note glided to is not a new note.
  const letters = () => String.fromCharCode(b[p] || 0, b[p + 1] || 0, b[p + 2] || 0, b[p + 3] || 0)
  if (letters() === 'SYNT') { p += 4; for (let i = 0; i < song.instruments.length; i++) p += u32() }
  if (letters() === 'ARPP') { p += 4; for (let n = u16(); n > 0 && p < b.length; n--) p += u8() * 4 }
  if (letters() === 'XTRA') {
    p += 4
    const glides = new Set()
    const count = u16()
    for (let i = 1; i <= count && p < b.length; i++) {
      const has = u8()
      if (has & 1) { glides.add(i); p += 8 }
      if (has & 2) p += 16
      if (has & 4) p += 16
      if (has & 8 && u8() === 2) { const levels = u8(); p += 15 + levels * 4 }
    }
    for (const e of extras) if (glides.has(e.extra)) e.glide = true
  }
  return song
}

/** A tracker's note -> a note number, "off", or null: "C-4" (60), "C#4", 49 (a tracker's own number for C-4), "off". */
function trackerNote(note) {
  if (note === undefined || note === null) return null
  if (typeof note === 'number') return note >= 97 ? 'off' : note >= 1 ? note + 11 : null
  if (/^\s*(off|===?|\^\^\^?)\s*$/i.test(note)) return 'off'
  return noteNumber(note)
}
/** An effect as a tracker shows it ("A04", or [10, 4]) -> its letter and its number. */
function effectOf(fx) {
  if (typeof fx === 'string' && fx.length === 3) return [fx[0].toUpperCase(), parseInt(fx.slice(1), 16) || 0]
  if (isList(fx)) return [(+fx[0]).toString(36).toUpperCase(), +fx[1] || 0]
  return ['', 0]
}
const DRUM_NAME = /kick|snare|hat|drum|tom|clap|cymbal|crash|ride|perc|rim|shaker|cowbell|conga|\bbd\b|\bsd\b|\bhh\b/i
/** Where a drum is written on a percussion staff, as the note a treble clef would have there, and whether its head is a cross. */
function drumPlace(name, n) {
  const s = String(name).toLowerCase()
  if (/kick|\bbd\b|bass ?drum/.test(s)) return [65, false]
  if (/snare|\bsd\b|clap|rim/.test(s)) return [72, false]
  if (/crash|ride|cymbal/.test(s)) return [81, true]
  if (/hat|\bhh\b|shaker/.test(s)) return [79, true]
  if (/tom|conga/.test(s)) return [/lo|floor/.test(s) ? 69 : 76, false]
  return [[74, 71, 67][n % 3], false]
}

/**
 * A song in our JSON form -> music, with a map from the song's place (order, row, tick) to beats.
 *
 * HOW ROWS BECOME RHYTHM. A row is always the same written length: a beat has `rowsPerBeat` rows (4, so a row is a
 * sixteenth note, unless the song's speed says 2 or 8, or you say). A note lasts until the next note on its channel,
 * a note-off, a volume of nothing, or the end of a sample that does not loop; never more than two bars. A note with a
 * `chord` is written as that chord, with a wavy line. Slides and vibrato are not written.
 */
function readSong(song, o = {}) {
  if (!isSong(song)) throw new Error(`This is not a song that can be shown. A song has "patterns" and an "order", as synths.js's examples/songs/night_drive.json does`)
  const patterns = song.patterns.map((p) => {
    const rows = p.rows || 64, cells = Array.from({ length: rows }, () => null)
    for (const e of p.events || []) if (e.row >= 0 && e.row < rows) (cells[e.row] ||= []).push(e)
    return { rows, cells }
  })
  const order = (song.order && song.order.length ? song.order : [0]).filter((n) => patterns[n])
  const instruments = song.instruments || [], samples = song.samples || []
  let speed = song.speed || 6, tempo = song.tempo || 125
  const firstSpeed = speed, firstTempo = tempo
  const rpb = o.rowsPerBeat || [1, 2, 4, 8].reduce((a, b) => (Math.abs(Math.log(b * speed / 24)) < Math.abs(Math.log(a * speed / 24)) ? b : a))
  const time = timeOf(o.time)
  const barRows = time[0] * 4 / time[1] * rpb

  // Which instruments are drums: told ({ drums: [3, "snare"] }), or by their names.
  const insName = (n) => { const ins = instruments[n - 1]; return ins ? ins.name || ins.patch || '' : '' }
  const told = o.drums
  const isDrum = (n) => {
    const ins = instruments[n - 1]
    if (told !== undefined && told !== true) return told === false ? false : [].concat(told).some((d) => d === n || (typeof d === 'string' && insName(n).toLowerCase() === d.toLowerCase()))
    return !!ins && (DRUM_NAME.test(ins.name || '') || DRUM_NAME.test(typeof ins.patch === 'string' ? ins.patch : ''))
  }
  const wanted = o.instruments === undefined ? null : [].concat(o.instruments).map((d) => (typeof d === 'string' ? d.toLowerCase() : d))
  const wants = (n) => !wanted || wanted.includes(n) || wanted.includes(insName(n).toLowerCase())
  /** How many rows a note of this instrument sounds for by itself: a sample that does not loop ends. */
  const rings = (n, note) => {
    const ins = instruments[n - 1]
    const sample = ins && ins.patch === undefined ? samples[ins.sample] : null
    const frames = sample ? sample.frames ?? (isList(sample.wave) ? sample.wave.length : 0) : 0
    if (!sample || sample.loop || !frames) return Infinity
    return frames / (8363 * 2 ** ((note - 60) / 12)) / (speed * 2.5 / tempo)
  }

  const channels = Array.from({ length: song.channels || 4 }, () => ({ notes: [], open: null, ins: 0 }))
  const close = (ch, row) => {
    const n = ch.open
    if (!n) return
    ch.open = null
    n.rows = Math.max(1, Math.min(row - n.row, n.rings, 2 * barRows))
    ch.notes.push(n)
  }
  // The order list, a pattern at a time; `spans` is the map from a place in the song to rows from the start.
  const spans = []
  let total = 0, at = 0, row = 0
  const been = new Set()
  while (at < order.length && !been.has(at + ':' + row) && total < 400000) {
    been.add(at + ':' + row)
    const pattern = patterns[order[at]]
    const span = { order: at, pattern: order[at], from: row, start: total, rows: 0 }
    spans.push(span)
    let jump = -1, next = -1
    for (; row < pattern.rows && jump < 0 && next < 0; row++, total++, span.rows++) {
      for (const e of pattern.cells[row] || []) {
        const ch = channels[e.ch]
        if (!ch) continue
        const [fx, param] = effectOf(e.fx)
        if (fx === 'F' && param) { if (param < 0x20) speed = param; else tempo = param }
        if (fx === 'B') jump = param
        if (fx === 'D') next = (param >> 4) * 10 + (param & 15)
        if (e.ins) ch.ins = e.ins
        const note = trackerNote(e.note)
        // A note that is glided to is not struck: the note before slides to it, and nothing new is written.
        const glide = (e.glide !== undefined && e.glide !== false) || fx === '3' || fx === '5' || (typeof e.vol === 'string' && /^m/i.test(e.vol))
        // CHORDS AND ARPEGGIOS. In a version 2 song `chord` is notes together and `arp` the notes one at a time; in a
        // version 1 song (and beside its three old keys) `chord` was always the fast arpeggio. Both are written as the chord,
        // an arpeggio with a wavy line beside it.
        const old = e.chord !== undefined && (!(song.version >= 2) || e.chordSpeed !== undefined || e.chordHz !== undefined || e.chordOrder !== undefined)
        const arp = e.arp && typeof e.arp === 'object' ? e.arp : null
        const said = arp ? arp.chord : e.chord
        const chord = said === undefined || said === 'off' || said === null ? null : typeof said === 'string' ? (chordKind(said) || chordOffsets(said)) : said.map((c) => (typeof c === 'string' ? noteNumber(c) - (typeof note === 'number' ? note : 0) : c))
        const broken = !!chord && (arp ? arp.order !== 'together' : old)
        if (note === 'off' || e.vol === 0 || (fx === 'C' && param === 0)) close(ch, total)
        else if ((typeof note === 'number' && !glide) || (chord && (note === null ? ch.open || typeof said === 'string' : true))) {
          // A chord named with its root ("G7") and no note is on that root; a kind alone ("min") is on the note that is sounding.
          const named = typeof said === 'string' && !chordKind(said) ? chordRoot(said) : null
          const root = typeof note === 'number' ? note : named !== null ? named : ch.open ? ch.open.root : null
          if (root === null) continue
          close(ch, total)
          const pitches = chord ? [...new Set(chord.map((c) => root + c))].sort((a, b) => a - b) : [root]
          ch.open = { row: total, root, notes: pitches, arp: broken && pitches.length > 1, ins: ch.ins, rings: Math.ceil(rings(ch.ins, root)) }
          if (fx === 'E' && (param >> 4) === 0xc) ch.open.rings = Math.min(ch.open.rings, 1)
        }
      }
    }
    if (jump >= 0) {
      // A jump back is where the song goes round: what is written ends there.
      if (jump <= at) break
      at = jump; row = 0
    } else { at++; row = next >= 0 ? next : 0 }
    if (next >= 0 && jump < 0 && at < order.length && row >= patterns[order[at]].rows) row = 0
  }
  for (const ch of channels) close(ch, total)

  // A staff for each channel that was asked for and has notes; or all the tuned ones together on a grand staff.
  const chosen = (o.channels === undefined || o.channels === null ? channels.map((c, i) => i) : [].concat(o.channels))
  const parts = []
  let drums = 0
  for (const i of chosen) {
    const ch = channels[i]
    if (!ch) throw new Error(`The song has channels 0 to ${channels.length - 1}, and there is no channel ${shown(i)}`)
    const mine = ch.notes.filter((n) => wants(n.ins))
    if (!mine.length) continue
    const beaten = mine.filter((n) => isDrum(n.ins))
    const percussion = told === true || beaten.length * 2 > mine.length
    const counts = new Map()
    for (const n of mine) counts.set(n.ins, (counts.get(n.ins) || 0) + 1)
    const kinds = [...counts.keys()]
    const name = percussion && kinds.length > 1 ? 'drums' : insName([...counts].sort((a, b) => b[1] - a[1])[0][0])
    parts.push({
      name, channel: i, percussion, clef: percussion ? 'percussion' : null,
      notes: mine.map((n) => {
        const place = percussion ? drumPlace(insName(n.ins), drums + kinds.indexOf(n.ins)) : null
        // A drum is written as short as its place allows: it is a hit, not a held note.
        return { start: n.row / rpb, length: (percussion ? Math.min(n.rows, rpb) : n.rows) / rpb, notes: percussion ? [place[0]] : n.notes, cross: percussion && place[1], arp: n.arp, sounds: n.notes, ins: n.ins }
      }),
    })
    if (percussion) drums += kinds.length
  }
  if (o.grand) {
    const tuned = parts.filter((p) => !p.percussion)
    if (tuned.length > 1) {
      const merged = { name: '', clef: 'grand', percussion: false, notes: tuned.flatMap((p) => p.notes).sort((a, b) => a.start - b.start) }
      parts.splice(0, parts.length, merged, ...parts.filter((p) => p.percussion))
    } else if (tuned.length) tuned[0].clef = 'grand'
  }
  if (!parts.length) throw new Error('None of the channels asked for has a note in it, so there is nothing to show')
  const length = total / rpb
  for (const p of parts) p.length = length
  return {
    tempo: o.tempo || Math.round(firstTempo * 24 / (firstSpeed * rpb)), time, key: o.key === undefined || o.key === null ? null : keyOf(o.key), title: o.title ?? song.title ?? '', parts,
    song: {
      rowsPerBeat: rpb, rows: total, spans,
      /** A place in the song, as song.position gives it -> beats from the start. */
      beat(position) {
        if (!position || position.order === undefined) return 0
        let span = null
        for (const s of spans) if (s.order === position.order && (position.row ?? 0) >= s.from) span = s
        if (!span) return position.order >= order.length ? length : 0
        const tick = position.speed ? clamp((position.tick || 0) / position.speed, 0, 1) : 0
        return (span.start + Math.min((position.row ?? 0) - span.from, span.rows) + tick) / rpb
      },
      /** Beats from the start -> the place in the song, for seek(order, row). */
      place(beat) {
        const row = clamp(Math.round(beat * rpb), 0, Math.max(0, total - 1))
        let span = spans[0]
        for (const s of spans) if (s.start <= row) span = s
        return { order: span.order, row: span.from + row - span.start }
      },
    },
  }
}
const chordRoot = (name) => { const m = typeof name === 'string' ? /^([A-G][#b]?)/.exec(name) : null; return m ? noteNumber(m[1] + '4') : null }
const chordOffsets = (name) => { const m = /^([A-G][#b]?)(.*)$/.exec(name); return (m && chordKind(m[2])) || null }

// --------------------------------------------------------------------------------------------
// MUSIC -> WRITTEN MUSIC: which key, which clef, how each note is spelt, and how its length is written in bars.

/** The key with the fewest accidentals for these notes: `weights` is how much of each of the twelve notes there is. */
function guessKey(weights) {
  let best = 0, least = Infinity
  for (const f of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
    let cost = 0
    const inKey = new Set()
    for (let p = f - 1; p <= f + 5; p++) inKey.add(((p * 7) % 12 + 12) % 12)
    for (let pc = 0; pc < 12; pc++) if (!inKey.has(pc)) cost += weights[pc]
    // Of keys that fit as well as each other, the one whose home note (or its minor's) is heard most, then the plainest.
    const home = ((f * 7) % 12 + 12) % 12
    cost += 0.0001 * Math.abs(f) - 0.00004 * weights[home] / (1 + weights.reduce((a, b) => a + b, 0))
    if (cost < least - 1e-9) { least = cost; best = f }
  }
  return best
}
const LETTER_OF_FIFTH = [3, 0, 4, 1, 5, 2, 6] // F C G D A E B, as letters counted from C
/**
 * How a note is written in a key: its letter (0 is C), whether it is sharpened or flattened (1, -1, 2…), and how
 * many steps of the staff it is above the C of octave 0. A note outside the key takes the name nearest the key
 * (in C: F#, C#, G# and Bb, Eb).
 */
function spell(note, fifths) {
  let p = ((note % 12) * 7) % 12
  while (p > fifths + 8) p -= 12
  while (p < fifths - 3) p += 12
  const letter = LETTER_OF_FIFTH[((p + 1) % 7 + 7) % 7], alter = Math.floor((p + 1) / 7)
  return { letter, alter, step: (Math.floor((note - alter) / 12) - 1) * 7 + letter }
}
/** How many steps of the staff the bottom line of each clef is above the C of octave 0: E4, G2, and E4 for drums. */
const BOTTOM_LINE = { treble: 30, bass: 18, percussion: 30 }

/** The clef a line of notes sits best in, and how many octaves lower it is written than it sounds (-1: an octave higher). */
function chooseClef(notes) {
  let sum = 0, weight = 0, low = Infinity, high = -Infinity, below = 0
  for (const n of notes) for (const p of n.notes) {
    sum += p * n.length; weight += n.length
    low = Math.min(low, p); high = Math.max(high, p)
    if (p < 60) below += n.length
  }
  if (!weight) return { clef: 'treble', octave: 0 }
  const mean = sum / weight
  if (low <= 47 && high >= 72 && below > weight * 0.15 && below < weight * 0.85) return { clef: 'grand', octave: 0 }
  if (mean >= 58) return { clef: 'treble', octave: mean > 86 ? 1 : 0 }
  return { clef: 'bass', octave: mean < 36 ? -1 : 0 }
}

/** The note lengths there are, in ticks: [how long, the plain length it is a dotted or plain form of]. Longest first. */
const VALUES = [[48, 32], [32, 32], [24, 16], [16, 16], [12, 8], [8, 8], [6, 4], [4, 4], [3, 2], [2, 2], [1, 1]]
/**
 * How a sound from `from` to `to` (ticks from the start of its bar) is written: one length if one will do, else
 * several tied together, so that the beats can still be seen. A rest is written more plainly than a note.
 */
function writeLength(from, to, rest, bar, beat, compound) {
  const out = []
  if (rest && from === 0 && to === bar) return [[0, bar, 0, true]]
  const half = bar % (2 * beat) === 0 && bar >= 4 * beat ? bar / 2 : 0
  let at = from
  while (at < to) {
    let took = null
    for (const [long, plain] of VALUES) {
      if (at + long > to) continue
      const dotted = long !== plain
      const crosses = Math.floor((at + long - 1) / beat) > Math.floor(at / beat)
      // A length begins where its own kind of beat falls: a quarter note on a quarter, counted from the beat it is in.
      const within = at % beat
      // (A quarter note off the beat, between two eighths' worth of beat, is the one syncopation written as it is.)
      const offbeat = !rest && !compound && long === beat && within === beat / 2 && at === from && at + long === to && !(half && at < half && at + long > half)
      if (!offbeat && (plain <= beat ? within % plain !== 0 : within !== 0)) continue
      if (rest) {
        if (dotted ? !(compound && long % beat === 0 && at % long === 0) : (compound ? within : at) % long !== 0) continue
        if (crosses && (compound ? long % beat !== 0 : bar === 3 * beat)) continue
      } else {
        if (dotted && !(compound ? (long % beat === 0 ? within === 0 : within % (2 * plain) === 0) : at % (2 * plain) === 0 || (within === 0 && at + long === bar))) continue
        if (crosses && !offbeat && (at % beat !== 0 || (compound && long % beat !== 0))) continue
        if (half && at < half && at + long > half && !(at === 0 || at + long === bar || (at === beat && long === 2 * beat))) continue
      }
      took = [at, long, dotted ? 1 : 0, false]
      break
    }
    if (!took) took = [at, 1, 0, false]
    out.push(took)
    at += took[1]
  }
  return out
}

/**
 * One line of notes -> what is written on one staff, bar by bar. Notes that begin together are a chord; a note
 * ends where the next begins (one line has one rhythm); what is left empty is rests.
 */
function writeStaff(notes, m) {
  const { bar, beat, compound, grid, bars } = m
  const snap = (beats) => Math.round(beats * TICKS / grid) * grid
  const events = []
  for (const n of [...notes].sort((a, b) => a.start - b.start)) {
    const start = snap(n.start)
    const last = events[events.length - 1]
    const end = Math.max(start + grid, snap(n.start + n.length))
    if (last && last.start === start) {
      for (const p of n.notes) if (!last.notes.includes(p)) { last.notes.push(p); last.sounds.push(...(n.sounds || [p]).slice(0, 1)) }
      last.end = Math.max(last.end, end)
      last.arp ||= !!n.arp
    } else events.push({ start, end, notes: [...n.notes], sounds: [...(n.sounds || n.notes)], arp: !!n.arp, cross: !!n.cross, items: [], marks: null, state: 0 })
  }
  events.forEach((e, i) => {
    e.notes.sort((a, b) => a - b)
    const next = events[i + 1]
    if (next && e.end > next.start) e.end = next.start
    // A small gap before the next note or the next beat is the player lifting a finger, not a rest worth writing.
    // (A tracker lets a note go a row before the next, or before the beat: that too.)
    const edge = Math.min(next ? next.start : Infinity, Math.ceil(e.end / beat) * beat)
    if (m.tidy && edge > e.end && edge - e.end <= 2 && e.end - e.start >= 4 * (edge - e.end)) e.end = edge
    e.written = e.end
  })
  const out = Array.from({ length: bars }, () => [])
  const put = (from, to, e) => {
    let before = null
    for (let b = Math.floor(from / bar); b < bars && b * bar < to; b++) {
      const lo = Math.max(from, b * bar) - b * bar, hi = Math.min(to, (b + 1) * bar) - b * bar
      for (const [at, long, dots, whole] of writeLength(lo, hi, !e, bar, beat, compound)) {
        const item = { rest: !e, bar: b, at, start: b * bar + at, long, dots, whole, plain: dots ? long * 2 / 3 : long, event: e, tied: false, tie: false, beam: null }
        if (e) { e.items.push(item); if (before) { before.tie = true; item.tied = true } before = item }
        out[b].push(item)
      }
    }
  }
  let at = 0
  for (const e of events) {
    if (e.start >= bars * bar) break
    if (e.start > at) put(at, e.start, null)
    put(e.start, e.end, e)
    at = e.end
  }
  if (at < bars * bar) put(at, bars * bar, null)
  for (const items of out) beamBar(items, m)
  return { bars: out, events }
}

/** Join the short notes of a bar with beams, a beat at a time (and four eighth notes together where a bar has two halves). */
function beamBar(items, m) {
  const { bar, beat } = m
  const groups = new Map()
  const wide = bar % (2 * beat) === 0 && beat === 8 ? 2 * beat : 0
  const plainEighths = (from) => { const inside = items.filter((i) => i.at >= from && i.at < from + wide); return inside.length === 4 && inside.every((i) => !i.rest && i.long === 4) }
  let run = []
  const end = () => { if (run.length > 1) { const beam = { items: run }; for (const i of run) i.beam = beam } run = [] }
  let window = -1
  for (const item of items) {
    const w = wide && plainEighths(Math.floor(item.at / wide) * wide) ? 'w' + Math.floor(item.at / wide) : Math.floor(item.at / beat)
    if (w !== window) { end(); window = w }
    if (item.rest || item.plain > 4) end()
    else run.push(item)
  }
  end()
  return groups
}

/**
 * Music -> the written score: staves of bars of notes and rests, each with its length, ties, beams, spelling and
 * accidentals. Everything a drawing needs but where on the page.
 */
function write(music, o = {}) {
  const time = music.time || [4, 4]
  const bar = time[0] * 4 / time[1] * TICKS
  const compound = time[1] === 8 && time[0] % 3 === 0 && time[0] > 3
  const beat = compound ? 12 : Math.max(1, 32 / time[1])
  let end = 0, fine = 0, count = 0
  const weights = new Array(12).fill(0)
  for (const part of music.parts) {
    end = Math.max(end, part.length || 0)
    for (const n of part.notes) {
      end = Math.max(end, n.start + n.length)
      count++
      if (Math.abs(n.start * 4 - Math.round(n.start * 4)) > 0.2 || n.length < 0.2) fine++
      if (!part.percussion) for (const p of n.notes) weights[((p % 12) + 12) % 12] += Math.min(n.length, 2)
    }
  }
  // A sixteenth note is the finest thing written, unless a good many notes fall between sixteenths.
  const grid = o.grid ? Math.max(1, Math.round(o.grid * TICKS)) : fine > count * 0.1 ? 1 : 2
  const bars = Math.max(1, Math.ceil(Math.round(end * TICKS / grid) * grid / bar))
  const key = music.key ?? guessKey(weights)
  const m = { bar, beat, compound, grid, bars }
  const staves = []
  music.parts.forEach((part, index) => {
    const auto = chooseClef(part.notes)
    const clef = part.percussion ? 'percussion' : part.clef || auto.clef
    if (!['treble', 'bass', 'grand', 'percussion'].includes(clef)) throw new Error(`${shown(clef)} is not a clef. The clefs are "treble", "bass", "grand" (both, joined) and "percussion"`)
    const lines = clef === 'grand' ? [['treble', part.notes.map((n) => ({ ...n, notes: n.notes.filter((p) => p >= 60) })).filter((n) => n.notes.length)], ['bass', part.notes.map((n) => ({ ...n, notes: n.notes.filter((p) => p < 60) })).filter((n) => n.notes.length)]] : [[clef, part.notes]]
    lines.forEach(([c, notes], i) => {
      const octave = clef === 'grand' || part.percussion ? 0 : part.clef && part.clef !== auto.clef ? 0 : auto.octave
      const staff = { clef: c, octave, percussion: !!part.percussion, name: part.name || '', part: index, brace: lines.length > 1 ? i + 1 : 0, ...writeStaff(notes, { ...m, tidy: part.tidy !== false }) }
      for (const e of staff.events) { e.staff = staves.length; e.part = index }
      spellStaff(staff, key)
      staves.push(staff)
    })
  })
  const events = staves.flatMap((s) => s.events).sort((a, b) => a.start - b.start || a.staff - b.staff)
  return { tempo: music.tempo || 120, time, key, bar, beat, compound, grid, bars, staves, events, title: music.title || '', length: bars * bar, song: music.song || null }
}

/** Where each note of a staff sits, which way its stem goes, and which notes need a sharp, flat or natural written. */
function spellStaff(staff, key) {
  const bottom = BOTTOM_LINE[staff.clef] + staff.octave * 7
  const inKey = (letter) => { const p = [1, 3, 5, 0, 2, 4, 6][letter]; return key > 0 ? (p < key ? 1 : 0) : key < 0 ? (p >= 7 + key ? -1 : 0) : 0 } // the order the sharps come in: F C G D A E B
  for (const items of staff.bars) {
    const now = new Map() // what each line and space has been changed to so far in this bar
    for (const item of items) {
      if (item.rest) continue
      item.heads = item.event.notes.map((note, i) => {
        if (staff.percussion) return { note, sounds: item.event.sounds[i] ?? note, pos: spell(note, 0).step - bottom, alter: 0, sign: null }
        const s = spell(note, key)
        const had = now.has(s.step) ? now.get(s.step) : inKey(s.letter)
        const sign = !item.tied && had !== s.alter ? (s.alter > 0 ? 'accidentalSharp' : s.alter < 0 ? 'accidentalFlat' : 'accidentalNatural') : null
        if (!item.tied) now.set(s.step, s.alter)
        return { note, sounds: note, pos: s.step - bottom, alter: s.alter, sign }
      })
    }
    // A stem goes away from the middle line: up for low notes, down for high ones. Beamed notes go together, by the one furthest out.
    const far = (list) => list.reduce((a, i) => { for (const h of i.heads) if (Math.abs(h.pos - 4) > Math.abs(a - 4) || (Math.abs(h.pos - 4) === Math.abs(a - 4) && h.pos > a)) a = h.pos; return a }, 4)
    for (const item of items) {
      if (item.rest) continue
      item.up = staff.percussion ? true : far(item.beam ? item.beam.items : [item]) < 4
    }
  }
}

// --------------------------------------------------------------------------------------------
// WRITTEN MUSIC -> A PAGE: where everything goes, for a width. Nothing here needs a screen.

const PREFIX = {
  clef: { treble: ['gClef', 3], bass: ['fClef', 1], percussion: ['unpitchedPercussionClef1', 2] }, // the symbol, and how far below the top line it hangs (in spaces)
  sharps: [8, 5, 9, 6, 3, 7, 4], flats: [4, 7, 3, 6, 2, 5, 1], // where a treble clef has each sharp and flat of a key, in steps above the bottom line
}
const FLAGS = { 4: 'flag8th', 2: 'flag16th', 1: 'flag32nd' }
const RESTS = { 32: 'restWhole', 16: 'restHalf', 8: 'restQuarter', 4: 'rest8th', 2: 'rest16th', 1: 'rest32nd' }
/** How much room a length of time is given, in spaces: a quarter note 3.4, and about 1.4 times as much each time it doubles. */
const room = (ticks) => 3.4 * 1.42 ** Math.log2(ticks / 8)

/** What a note or rest needs to its left and right, and where its heads, sharps and flats sit about its own x. S is the space between two staff lines. */
function shape(item, S) {
  if (item.rest) {
    const name = item.whole ? 'restWhole' : RESTS[item.plain]
    item.glyph = name
    item.left = 0
    item.right = GLYPHS[name][2] * S / 250 + (item.dots ? 0.9 * S : 0)
    return
  }
  const stemmed = item.plain < 32
  const name = item.plain >= 32 ? 'noteheadWhole' : item.plain >= 16 ? 'noteheadHalf' : item.event.cross ? 'noteheadXBlack' : 'noteheadBlack'
  const wide = GLYPHS[name][2] * S / 250
  item.glyph = name
  item.wide = wide
  const heads = item.heads
  // Two notes a step apart cannot sit on the same side of the stem: the second goes across it.
  let before = null, out = false, over = 0, under = 0
  for (const h of item.up || !stemmed ? heads : [...heads].reverse()) {
    out = before !== null && Math.abs(h.pos - before) === 1 && !out
    h.dx = out ? (item.up || !stemmed ? wide - 0.1 * S : -(wide - 0.1 * S)) : 0
    if (h.dx > 0) over = h.dx
    if (h.dx < 0) under = -h.dx
    before = h.pos
  }
  // Sharps and flats stand to the left, in columns where they would touch.
  const columns = []
  let most = 0
  for (const h of [...heads].reverse()) {
    if (!h.sign) continue
    let c = 0
    while (columns[c] !== undefined && columns[c] - h.pos < 6) c++
    columns[c] = h.pos
    h.signX = -under - 0.25 * S - c * 1.05 * S - GLYPHS[h.sign][2] * S / 250
    most = Math.max(most, c + 1)
  }
  item.left = under + (most ? 0.3 * S + most * 1.05 * S : 0) + (item.event.arp && !item.tied ? 1.1 * S : 0)
  const flag = stemmed && !item.beam && item.plain <= 4 && item.up ? 1.05 * S : 0
  item.right = wide + Math.max(over, flag) + (item.dots ? 0.95 * S : 0)
}

/**
 * Lay the written music out for a page `width` wide: systems (lines of music) of bars, each bar's notes spaced by
 * how long they last, every line filled to the right edge but a short last one. `{ across: true }` is one endless line.
 * What comes back is everything to draw, as plain shapes, and where each note and bar is.
 */
function layout(score, o = {}) {
  const S = o.space || 10
  const width = Math.max(120, o.width || 800)
  const staves = score.staves
  const several = staves.length > 1
  const braced = staves.some((s) => s.brace)
  const margin = { left: (braced ? 1.7 : 0.6) * S, right: 0.6 * S }
  const keyRoom = Math.abs(score.key) * (score.key > 0 ? 1.0 : 0.85) * S + (score.key ? 0.5 * S : 0)
  const timeDigits = [String(score.time[0]), String(score.time[1])]
  const digitsWide = (text) => [...text].reduce((w, d) => w + (GLYPHS['timeSig' + d][2] + 20) * S / 250, 0)
  const timeRoom = Math.max(digitsWide(timeDigits[0]), digitsWide(timeDigits[1])) + 0.7 * S
  const prefix = (first) => margin.left + 0.5 * S + 2.7 * S + 0.5 * S + keyRoom + (first ? timeRoom : 0) + 0.4 * S

  // Every bar: its columns (the moments at which something begins, on any staff), and the room each needs.
  for (const staff of staves) for (const items of staff.bars) for (const item of items) shape(item, S)
  const bars = []
  for (let b = 0; b < score.bars; b++) {
    const at = new Map()
    staves.forEach((staff) => { for (const item of staff.bars[b]) { let col = at.get(item.at); if (!col) at.set(item.at, col = { at: item.at, items: [], left: 0, right: 0 }); col.items.push(item); item.col = col; col.left = Math.max(col.left, item.left); col.right = Math.max(col.right, item.whole ? 0 : item.right) } })
    const cols = [...at.values()].sort((a, c) => a.at - c.at)
    cols.forEach((col, i) => {
      const next = cols[i + 1]
      col.ticks = (next ? next.at : score.bar) - col.at
      col.ideal = room(col.ticks) * S + (!next && b === score.bars - 1 ? 0.8 * S : 0)
      col.least = col.right + (next ? next.left + 0.45 * S : (b === score.bars - 1 ? 1.5 : 0.7) * S)
    })
    const lead = 0.9 * S + (cols[0] ? cols[0].left : 0)
    bars.push({ n: b, cols, lead, natural: lead + cols.reduce((w, c) => w + Math.max(c.least, c.ideal), 0), prims: [] })
  }
  const stretched = (bar, k) => bar.lead + bar.cols.reduce((w, c) => w + Math.max(c.least, c.ideal * k), 0)

  // Break into systems: as many bars as fit, at least one.
  const systems = []
  for (let b = 0; b < bars.length;) {
    const first = systems.length === 0
    const avail = width - margin.right - prefix(first)
    let to = b + 1, used = bars[b].natural
    if (o.across) { to = bars.length; used = bars.reduce((w, bar) => w + bar.natural, 0) } else while (to < bars.length && used + bars[to].natural <= avail) used += bars[to++].natural
    const mine = bars.slice(b, to)
    // Fill the line: every length of time is given more room by the same factor, until the bars reach the edge.
    let k = 1
    if (!o.across && (to < bars.length || used > avail * 0.62 || used > avail)) {
      let lo = 0.3, hi = 6
      for (let i = 0; i < 30; i++) { k = (lo + hi) / 2; if (mine.reduce((w, bar) => w + stretched(bar, k), 0) > avail) hi = k; else lo = k }
    }
    let x = prefix(first)
    const sys = { index: systems.length, first: b, last: to - 1, bars: mine, fixed: [], x0: x, x1: 0, times: [], staffY: [], y: 0, h: 0, stretch: k }
    for (const bar of mine) {
      bar.sys = sys
      bar.x = x
      let cx = x + bar.lead
      for (const col of bar.cols) {
        col.x = cx
        sys.times.push([bar.n * score.bar + col.at, cx + 0.65 * S])
        cx += Math.max(col.least, col.ideal * k)
      }
      bar.w = cx - x
      x = cx
      sys.times.push([(bar.n + 1) * score.bar, x])
    }
    sys.x1 = x
    systems.push(sys)
    b = to
  }

  // --- the shapes. y is measured from the top line of a note's own staff until the staves are stacked, below.
  const ext = systems.map(() => staves.map(() => [-0.5 * S, 4.5 * S]))
  const reach = (sys, st, y1, y2) => { const e = ext[sys.index][st]; if (y1 < e[0]) e[0] = y1; if (y2 > e[1]) e[1] = y2 }
  const yOf = (pos) => 4 * S - pos * S / 2
  const U = S / 250
  const stemW = ENGRAVING.stemThickness * S
  const glyph = (list, sys, st, name, x, y, e, more) => {
    const p = { k: 'g', n: name, x, y, st, e: e || null, ...more }
    const s = (more && more.s) || 1
    reach(sys, st, y + GLYPHS[name][1] * U * s, y + GLYPHS[name][3] * U * s)
    list.push(p)
    return p
  }
  const line = (list, sys, st, x1, y1, x2, y2, w, e, more) => { list.push({ k: 'l', x1, y1, x2, y2, w, st, e: e || null, ...more }); reach(sys, st, Math.min(y1, y2), Math.max(y1, y2)) }
  const hits = []

  staves.forEach((staff, st) => {
    const shift = staff.clef === 'bass' ? -2 : 0
    for (const sys of systems) {
      // The start of every line: clef and key; the time signature on the first.
      const [clef, hang] = PREFIX.clef[staff.clef]
      let x = margin.left + 0.5 * S
      glyph(sys.fixed, sys, st, clef, x, hang * S)
      if (staff.octave) glyph(sys.fixed, sys, st, 'timeSig8', x + 0.75 * S, staff.octave > 0 ? -2.6 * S : 6.9 * S, null, { s: 0.42 })
      x += 3.2 * S
      if (!staff.percussion) for (let i = 0; i < Math.abs(score.key); i++) {
        glyph(sys.fixed, sys, st, score.key > 0 ? 'accidentalSharp' : 'accidentalFlat', x, yOf((score.key > 0 ? PREFIX.sharps : PREFIX.flats)[i] + shift))
        x += (score.key > 0 ? 1.0 : 0.85) * S
      }
      if (sys.index === 0) {
        x = margin.left + 3.7 * S + keyRoom
        timeDigits.forEach((text, row) => { let dx = x + (timeRoom - 0.7 * S - digitsWide(text)) / 2; for (const d of text) { glyph(sys.fixed, sys, st, 'timeSig' + d, dx, (1 + 2 * row) * S); dx += (GLYPHS['timeSig' + d][2] + 20) * U } })
      }
      for (const bar of sys.bars) {
        const list = bar.prims
        for (const item of staff.bars[bar.n]) {
          const e = item.event
          let x = item.col.x
          item.sys = sys
          if (item.rest) {
            if (item.whole) x = bar.x + (bar.w - GLYPHS.restWhole[2] * U) / 2 + 0.2 * S
            item.x = x
            glyph(list, sys, st, item.glyph, x, item.glyph === 'restWhole' ? S : 2 * S)
            if (item.dots) list.push({ k: 'd', x: x + GLYPHS[item.glyph][2] * U + 0.45 * S, y: 1.5 * S, r: 0.22 * S, st, e: null })
            continue
          }
          item.x = x
          item.st = st
          const heads = item.heads, wide = item.wide
          const low = heads[0], high = heads[heads.length - 1]
          // Short lines for notes above and below the staff, and the heads over them.
          const from = x + Math.min(0, ...heads.map((h) => h.dx)) - 0.33 * S, to = x + wide + Math.max(0, ...heads.map((h) => h.dx)) + 0.33 * S
          for (let pos = -2; pos >= low.pos; pos -= 2) line(list, sys, st, from, yOf(pos), to, yOf(pos), ENGRAVING.legerLineThickness * S, null)
          for (let pos = 10; pos <= high.pos; pos += 2) line(list, sys, st, from, yOf(pos), to, yOf(pos), ENGRAVING.legerLineThickness * S, null)
          for (const h of heads) {
            h.x = x + h.dx
            h.y = yOf(h.pos)
            glyph(list, sys, st, item.glyph, h.x, h.y, e, { h: h.note })
            if (h.sign) glyph(list, sys, st, h.sign, x + h.signX, h.y, e, { h: h.note })
          }
          if (item.dots) {
            const done = new Set()
            for (const h of heads) {
              const pos = h.pos % 2 === 0 ? h.pos + 1 : h.pos
              if (done.has(pos)) continue
              done.add(pos)
              list.push({ k: 'd', x: x + wide + Math.max(0, ...heads.map((d) => d.dx)) + 0.5 * S, y: yOf(pos), r: 0.22 * S, st, e, h: h.note })
            }
          }
          if (e.arp && !item.tied) { list.push({ k: 'w', x: x - item.left + 0.15 * S, y1: high.y - 0.7 * S, y2: low.y + 0.7 * S, st, e }); reach(sys, st, high.y - 0.7 * S, low.y + 0.7 * S) }
          // The stem, as long as an octave, and at least to the middle line; a beam decides its length later.
          if (item.plain < 32) {
            const at = STEM_AT[item.glyph] || STEM_AT.noteheadBlack
            item.stemX = item.up ? x + wide - stemW / 2 : x + stemW / 2
            item.stemFrom = item.up ? low.y + at[1] * U : high.y + at[3] * U
            const more = item.beam ? 0 : item.plain === 1 ? 0.75 * S : 0
            item.tip = item.up ? Math.min(high.y - 3.5 * S - more, 2 * S) : Math.max(low.y + 3.5 * S + more, 2 * S)
            item.end = item.up ? high.y : low.y
            if (!item.beam) {
              line(list, sys, st, item.stemX, item.stemFrom, item.stemX, item.tip, stemW, e)
              if (FLAGS[item.plain]) glyph(list, sys, st, FLAGS[item.plain] + (item.up ? 'Up' : 'Down'), item.stemX - stemW / 2, item.tip, e)
            }
          }
          hits.push({ item, sys, st, x: x + Math.min(0, ...heads.map((h) => h.dx)) - 0.2 * S, w: wide + 0.4 * S + Math.max(0, ...heads.map((h) => Math.abs(h.dx))), y1: high.y - 0.6 * S, y2: low.y + 0.6 * S })
        }
        // Beams: a straight bar through the stems' ends, leaning the way the notes go but never steeply.
        const beams = new Set(staff.bars[bar.n].map((i) => i.beam).filter(Boolean))
        for (const beam of beams) {
          const items = beam.items, a = items[0], z = items[items.length - 1], up = a.up
          const span = z.stemX - a.stemX || 1
          let slope = clamp((z.end - a.end) / span, -0.22, 0.22)
          if (Math.abs((z.end - a.end)) > 1.25 * S) slope = Math.sign(slope) * Math.min(Math.abs(slope), 1.25 * S / span)
          // Notes in the middle that stick out past the ends make a level beam.
          const inner = items.slice(1, -1).map((i) => i.end)
          if (inner.length && (up ? Math.min(...inner) < Math.min(a.end, z.end) : Math.max(...inner) > Math.max(a.end, z.end))) slope = 0
          const short = (items.some((i) => i.plain <= 2) ? 3.25 : 2.9) * S
          let base = up ? Infinity : -Infinity
          for (const i of items) {
            const need = (up ? i.end - short : i.end + short) - slope * (i.stemX - a.stemX)
            base = up ? Math.min(base, need) : Math.max(base, need)
          }
          // (Notes far outside the staff have stems that come back to its middle line.)
          base = up ? Math.min(base, 2 * S - Math.max(0, slope * span)) : Math.max(base, 2 * S - Math.min(0, slope * span))
          const yAt = (sx) => base + slope * (sx - a.stemX)
          const thick = ENGRAVING.beamThickness * S, step = (ENGRAVING.beamThickness + ENGRAVING.beamSpacing) * S * (up ? 1 : -1)
          const ev = items.length && items.every((i) => i.event === a.event) ? a.event : null
          for (const i of items) { i.tip = yAt(i.stemX); line(bar.prims, sys, st, i.stemX, i.stemFrom, i.stemX, i.tip, stemW, i.event) }
          const strip = (x1, x2, level, e) => { bar.prims.push({ k: 'b', x1, y1: yAt(x1) + level * step, x2, y2: yAt(x2) + level * step, t: up ? thick : -thick, st, e: e || null, of: items }); reach(sys, st, Math.min(yAt(x1), yAt(x2)) - thick, Math.max(yAt(x1), yAt(x2)) + thick) }
          strip(a.stemX - stemW / 2, z.stemX + stemW / 2, 0, ev)
          // A second beam (and a third) joins the shorter notes; one alone gets a stub towards its neighbour.
          for (const [level, most] of [[1, 2], [2, 1]]) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].plain > most) continue
              let j = i
              while (j + 1 < items.length && items[j + 1].plain <= most) j++
              if (j > i) strip(items[i].stemX - stemW / 2, items[j].stemX + stemW / 2, level)
              else if (i === 0 || (i < items.length - 1 && items[i].at % (2 * most * 2) === 0)) strip(items[i].stemX - stemW / 2, items[i].stemX + 1.1 * S, level)
              else strip(items[i].stemX - 1.1 * S, items[i].stemX + stemW / 2, level)
              i = j
            }
          }
        }
      }
    }
    // Ties: a curve from each note to the same note it carries on as, across a bar line or onto the next line.
    for (const items of staff.bars) for (const item of items) {
      if (item.rest || !item.tie) continue
      const next = item.event.items[item.event.items.indexOf(item) + 1]
      if (!next) continue
      item.heads.forEach((h, i) => {
        const down = item.heads.length === 1 ? item.up : i < item.heads.length / 2
        const y = h.y + (down ? 0.6 : -0.6) * S
        const from = h.x + item.wide + 0.1 * S, to = next.heads[i] ? next.heads[i].x - 0.1 * S : next.x
        const bar = bars[item.bar], nextBar = bars[next.bar]
        if (item.sys === next.sys) {
          const tie = { k: 't', x1: from, x2: to, y, down, S, st, e: item.event, h: h.note }
          bar.prims.push(tie)
          if (nextBar !== bar) nextBar.prims.push(tie)
        } else {
          bar.prims.push({ k: 't', x1: from, x2: item.sys.x1 + 0.3 * S, y, down, S, st, e: item.event, h: h.note, open: 'end' })
          nextBar.prims.push({ k: 't', x1: nextBar.x - 0.2 * S, x2: to, y, down, S, st, e: item.event, h: h.note, open: 'start' })
        }
        reach(item.sys, st, y - 0.9 * S, y + 0.9 * S)
        if (next.sys !== item.sys) reach(next.sys, st, y - 0.9 * S, y + 0.9 * S)
      })
    }
  })

  // --- stack the staves of each system, and the systems down the page, so nothing of one touches the next.
  const title = o.title === false ? '' : score.title
  const text = (list, words, x, y, size, more) => list.push({ k: 's', text: words, x, y, size, ...more })
  let y = (title ? 3.2 * S : 0) + 0.8 * S
  const head = []
  if (title) text(head, title, width / 2, 2.1 * S, 1.7 * S, { align: 'center', bold: true })
  systems.forEach((sys, n) => {
    const e = ext[n]
    const over = n === 0 ? 2.6 * S : 1.5 * S // room above for the tempo, the bar number and the names
    let sy = y + over - e[0][0]
    sys.y = y
    staves.forEach((staff, st) => {
      if (st > 0) sy += Math.max((staff.brace === 2 ? 8.5 : 9.5) * S, e[st - 1][1] - e[st][0] + (n === 0 && staff.name && staff.brace !== 2 ? 3 : 1) * S)
      sys.staffY[st] = sy
    })
    sys.h = sy + e[staves.length - 1][1] + 0.6 * S - y
    y += sys.h + 1.6 * S
    const top = sys.staffY[0], bottom = sys.staffY[staves.length - 1] + 4 * S
    // Staff lines, bar lines (through the two staves of a grand staff), the line down the left of several staves, braces.
    const thin = 0.16 * S
    staves.forEach((staff, st) => {
      const lines = o.lines === false ? [] : staff.percussion && o.lines !== true && o.lines === 'one' ? [2] : [0, 1, 2, 3, 4]
      for (const i of lines) sys.fixed.push({ k: 'l', x1: margin.left, y1: i * S, x2: sys.x1, y2: i * S, w: ENGRAVING.staffLineThickness * S, st, staff: true, e: null })
      if (staff.brace === 1) sys.fixed.push({ k: 'r', x: margin.left - 0.3 * S, y1: 0, y2: sys.staffY[st + 1] - sys.staffY[st] + 4 * S, S, st })
      const to = staff.brace === 1 ? sys.staffY[st + 1] - sys.staffY[st] + 4 * S : 4 * S
      if (staff.brace !== 2) for (const bar of sys.bars) {
        const last = bar.n === score.bars - 1
        const list = bar.prims
        if (last) {
          list.push({ k: 'l', x1: bar.x + bar.w - 0.75 * S, y1: 0, x2: bar.x + bar.w - 0.75 * S, y2: to, w: thin, st, e: null })
          list.push({ k: 'l', x1: bar.x + bar.w - 0.275 * S, y1: 0, x2: bar.x + bar.w - 0.275 * S, y2: to, w: ENGRAVING.thickBarlineThickness * S, st, e: null })
        } else list.push({ k: 'l', x1: bar.x + bar.w, y1: 0, x2: bar.x + bar.w, y2: to, w: thin, st, e: null })
      }
      if (n === 0 && staff.name && several && staff.brace !== 2) text(sys.fixed, staff.name, margin.left + (st === 0 ? 7.5 * S : 0.2 * S), Math.min(e[st][0], -1.2 * S) - 0.6 * S, 1.05 * S, { st, italic: true, dim: true, name: true })
    })
    if (several) sys.fixed.push({ k: 'l', x1: margin.left, y1: 0, x2: margin.left, y2: bottom - top, w: thin, st: 0, e: null })
    // The tempo over the first line; over every other, the number of its first bar.
    if (n === 0 && o.tempo !== false) {
      const tx = margin.left + 0.3 * S, ty = Math.min(e[0][0], -1.2 * S) - 0.9 * S
      sys.fixed.push({ k: 'g', n: 'noteheadBlack', x: tx, y: ty, s: 0.7, st: 0, e: null })
      sys.fixed.push({ k: 'l', x1: tx + 0.87 * S, y1: ty - 0.1 * S, x2: tx + 0.87 * S, y2: ty - 2.1 * S, w: stemW, st: 0, e: null })
      text(sys.fixed, '= ' + score.tempo, tx + 1.5 * S, ty - 0.5 * S, 1.2 * S, { st: 0 })
      for (const p of sys.fixed) if (p.name && p.st === 0) p.y = ty - 0.5 * S
    } else if (o.barNumbers !== false && n > 0) text(sys.fixed, String(sys.first + 1), margin.left + 0.2 * S, Math.min(e[0][0], -1.4 * S) - 0.3 * S, 0.95 * S, { st: 0, dim: true })
    // Now that each staff has its place, everything measured from a staff's top line is measured from the page's.
    const settle = (p) => {
      if (p.settled) return
      p.settled = true
      const off = sys.staffY[p.st]
      if (p.y !== undefined) p.y += off
      if (p.y1 !== undefined) { p.y1 += off; p.y2 += off }
    }
    for (const p of sys.fixed) settle(p)
    for (const bar of sys.bars) {
      for (const p of bar.prims) settle(p)
      bar.y = sys.y
      bar.h = sys.h
    }
  })
  for (const hit of hits) { hit.y1 += hit.sys.staffY[hit.st]; hit.y2 += hit.sys.staffY[hit.st]; for (const h of hit.item.heads) h.py = h.y + hit.sys.staffY[hit.st] }
  return { S, width: o.across ? Math.max(width, systems[0].x1 + margin.right) : width, height: y - 1.6 * S + 0.8 * S, systems, bars, hits, head, margin }
}

// --------------------------------------------------------------------------------------------
// DRAWING. A page's shapes are painted on a canvas: all of them, or only those of the bars that changed.

/** Colours for paper and ink. `theme({ now: "deepskyblue" })` changes them for every page; a page's own `colours` change only its own. */
const THEMES = {
  light: { paper: '#fbf8f1', edge: '#d9d3c4', ink: '#1b1d23', line: '#4b4f58', dim: '#6b7280', now: '#e8590c', right: '#2b9a3f', wrong: '#e03131', cursor: '#e8590c' },
  dark: { paper: '#15171c', edge: '#313744', ink: '#eef0f4', line: '#aab1bf', dim: '#9aa2b1', now: '#ffb224', right: '#3ddc84', wrong: '#ff5c5c', cursor: '#ffb224' },
  clear: { paper: null, edge: null, ink: '#ffffff', line: '#ffffffcc', dim: '#ffffffaa', now: '#ffb224', right: '#3ddc84', wrong: '#ff5c5c', cursor: '#ffb224' },
}
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'
const NOW = 1, RIGHT = 2, WRONG = 3
const paths = {}
const pathOf = (name) => paths[name] || (paths[name] = new Path2D(GLYPHS[name][4]))

/** The box a symbol's ink fills about its own point, in the font's units (250 to a staff space): [left, top, right, bottom]. */
const glyphBox = (name) => GLYPHS[name].slice(0, 4)

/** Paint shapes. `t` is the transform that takes the page's points to the canvas's pixels: [scale, x, y]. */
function paint(g, prims, c, t) {
  const [k, ox, oy] = t
  const colour = (p) => {
    const e = p.e
    if (!e) return p.staff ? c.line : p.dim ? c.dim : c.ink
    const state = e.marks && p.h !== undefined && e.marks[p.h] !== undefined ? e.marks[p.h] : e.state
    return state === NOW ? c.now : state === RIGHT ? c.right : state === WRONG ? c.wrong : c.ink
  }
  for (const p of prims) {
    const ink = p.k === 'b' && !p.e ? (p.of.every((i) => i.event.state === p.of[0].event.state && !i.event.marks) ? colour({ e: p.of[0].event }) : c.ink) : colour(p)
    switch (p.k) {
      case 'g': {
        const s = (p.s || 1) * k * (p.S || t[3]) / 250
        g.setTransform(s, 0, 0, s, ox + p.x * k, oy + p.y * k)
        g.fillStyle = ink
        g.fill(pathOf(p.n))
        break
      }
      case 'l':
        g.setTransform(k, 0, 0, k, ox, oy)
        g.fillStyle = ink
        // A line is a thin box on whole pixels, so staff lines are all as dark as each other.
        if (p.y1 === p.y2) { const w = Math.max(1 / k, p.w); g.fillRect(p.x1, Math.round((p.y1 - w / 2) * k) / k, p.x2 - p.x1, Math.max(1, Math.round(w * k)) / k) } else if (p.x1 === p.x2) { const w = Math.max(1 / k, p.w); g.fillRect(Math.round((p.x1 - w / 2) * k) / k, Math.min(p.y1, p.y2), Math.max(1, Math.round(w * k)) / k, Math.abs(p.y2 - p.y1)) }
        break
      case 'b':
        g.setTransform(k, 0, 0, k, ox, oy)
        g.fillStyle = ink
        g.beginPath(); g.moveTo(p.x1, p.y1); g.lineTo(p.x2, p.y2); g.lineTo(p.x2, p.y2 + p.t); g.lineTo(p.x1, p.y1 + p.t); g.closePath(); g.fill()
        break
      case 'd':
        g.setTransform(k, 0, 0, k, ox, oy)
        g.fillStyle = ink
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill()
        break
      case 't': {
        g.setTransform(k, 0, 0, k, ox, oy)
        g.fillStyle = ink
        const S = p.S, dir = p.down ? 1 : -1, long = p.x2 - p.x1
        const rise = clamp(long * 0.14, 0.4 * S, 0.85 * S) * dir, fat = 0.2 * S * dir
        const a = p.open === 'start' ? 0 : long * 0.25, b = p.open === 'end' ? long : long * 0.75
        g.beginPath()
        g.moveTo(p.x1, p.y)
        g.bezierCurveTo(p.x1 + a, p.y + rise, p.x1 + b, p.y + rise, p.x2, p.y)
        g.bezierCurveTo(p.x1 + b, p.y + rise + fat, p.x1 + a, p.y + rise + fat, p.x1, p.y)
        g.fill()
        break
      }
      case 'w': {
        // A wavy line up the side of a chord: its notes are played one after another, quickly.
        const s = k * t[3] / 250, piece = 220 * t[3] / 250
        g.fillStyle = ink
        for (let y = p.y2; y > p.y1 + piece * 0.3; y -= piece) { g.setTransform(0, -s, s, 0, ox + (p.x + 0.75 * t[3]) * k, oy + y * k); g.fill(pathOf('wiggleArpeggiatoUp')) }
        break
      }
      case 'r': {
        // The brace that joins the two staves of a grand staff.
        // The font's brace is as tall as one staff: it is stretched to reach over both.
        const box = GLYPHS.brace, h = p.y2 - p.y1, sy = h / (box[3] - box[1]), sx = p.S / 250 * 2.2
        g.setTransform(sx * k, 0, 0, sy * k, ox + (p.x - box[2] * sx) * k, oy + (p.y2 - box[3] * sy) * k)
        g.fillStyle = ink
        g.fill(pathOf('brace'))
        break
      }
      case 's':
        g.setTransform(k, 0, 0, k, ox, oy)
        g.fillStyle = p.dim ? c.dim : c.ink
        g.font = `${p.italic ? 'italic ' : ''}${p.bold ? '600 ' : ''}${p.size}px ${FONT}`
        g.textAlign = p.align || 'left'
        g.textBaseline = 'alphabetic'
        g.fillText(p.text, p.x, p.y)
        break
    }
  }
}

// --------------------------------------------------------------------------------------------
// A PAGE OF MUSIC on the screen: it lays itself out for its width, follows what plays, and listens to a learner.

let theSound = null
const STAGE = Symbol.for('notation.stage')
const nowSeconds = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000

class Page {
  constructor(stage, what, step, options) {
    this.stage = stage
    this.id = options.id ?? stage.nextId++
    this.options = { at: 'top', scroll: 'down', paper: 'light', zoom: 1, margin: 10, hear: true, ...options }
    this.what = what
    this.step = step
    this.score = null
    this.plan = null
    this.error = null
    this.onNote = options.onNote || null
    this.onBar = options.onBar || null
    this.onTap = options.onTap || null
    this.onDone = options.onDone || null
    this.onRight = options.onRight || null
    this.onWrong = options.onWrong || null
    this.source = null // what is followed: a function that gives beats, or null
    this.tick = -1 // where the music has got to, in ticks; -1 before anything has played
    this.cursorAt = null
    this.active = []
    this.next = 0
    this.barNow = -1
    this.dirty = new Set()
    this.all = true
    this.scrollX = this.scrollY = 0
    this.goX = this.goY = 0
    this.hand = 0 // until when a hand's scrolling is left alone
    this.tunes = []
    this.voices = []
    this.playing = false
    this.along = null
    this.result = null
    this.held = new Set()
    this.ghosts = []
    this.W = this.H = 0
    this.box = { x: 0, y: 0, w: 0, h: 0 }

    const wrap = this.wrap = document.createElement('div')
    wrap.dataset.notationLayer = ''
    wrap.style.cssText = 'position:absolute;overflow:hidden;margin:0;padding:0;border:0;touch-action:none;user-select:none;-webkit-user-select:none'
    const layer = this.layer = document.createElement('canvas')
    layer.dataset.notationLayer = ''
    layer.style.cssText = 'position:absolute;left:0;top:0;margin:0;padding:0;border:0;display:block'
    // (The line that moves is a canvas too, of one pixel: a recorder that copies a page's canvases has it in the film.)
    const cursor = this.cursor = document.createElement('canvas')
    cursor.width = cursor.height = 1
    cursor.dataset.notationLayer = 'line'
    cursor.style.cssText = 'position:absolute;left:0;top:0;width:3px;height:10px;pointer-events:none;display:none;will-change:transform'
    wrap.append(layer, cursor)
    stage.mount(wrap)
    this.g = layer.getContext('2d')
    this.listen()
    if (what instanceof Sheet) what.pages.add(this)
    this.read()
    if (this.options.follow && this.options.follow !== true) this.follow(this.options.follow)
    if (this.options.playAlong) this.playAlong(this.options.playAlong === true ? {} : this.options.playAlong)
  }

  get sound() { return this.options.sound || this.stage.sound || theSound }
  get colours() { return { ...THEMES[this.options.paper] || THEMES.light, ...this.stage.colours, ...this.options.colours } }

  /** Read what was given again: it is written out afresh, and laid out on the next frame. */
  read() {
    const o = this.options, what = this.what
    this.error = null
    try {
      if (typeof what === 'string' && /\.(json|mod|xm|song)(\?.*)?$/i.test(what.trim())) {
        // The name of a song file: it is fetched, and shown when it has come.
        this.score = null
        this.ready = this.fetch(what.trim()).then((music) => { this.music = music; this.rewrite() }).catch((e) => this.fail(e))
        return
      }
      this.music = readMusic(what, this.step, o)
      this.rewrite()
      this.ready = Promise.resolve(this)
    } catch (e) { this.wrap.remove(); throw e }
  }
  async fetch(file) {
    // A file is looked for where the host says ({ resolve }), else beside the page.
    const resolve = this.options.resolve || this.stage.resolve
    const answer = await fetch(resolve ? resolve(file) : new URL(file, document.baseURI)).catch(() => null)
    if (!answer || !answer.ok) throw new Error(`The song "${file}" could not be loaded (${answer ? answer.status : 'no answer'}), so there is nothing to show`)
    const bytes = new Uint8Array(await answer.arrayBuffer())
    if (bytes[bytes.findIndex((b) => b > 32)] === 123) return readSong(JSON.parse(new TextDecoder().decode(bytes)), this.options)
    if (String.fromCharCode(...bytes.subarray(0, 4)) === 'SYSG') return readSong(unpackSong(bytes), this.options)
    const pack = method(this.sound, 'packSong', 'pack_song')
    if (!pack) throw new Error(`"${file}" is a MOD or XM file, which the sound library must turn into one of our songs first: showNotes(await packSong(bytes))`)
    return readSong(unpackSong(await pack(bytes)), this.options)
  }
  fail(e) {
    this.error = (e && e.message) || String(e)
    this.score = null
    this.plan = null
    this.all = true
    console.error('notation.js: ' + this.error)
  }
  rewrite() {
    this.score = write(this.music, this.options)
    this.plan = null
    this.all = true
    this.active = []
    this.next = 0
    this.barNow = -1
    if (this.along) this.playAlong(this.along.options)
  }
  /** What was given has changed (a sheet was added to): show it as it is now. */
  changed() { try { this.music = readMusic(this.what, this.step, this.options); this.rewrite() } catch (e) { this.fail(e) } }
  /** Show other music in this page's place: page.show("C4 D4 E4", "quarter"). */
  show(what, step, options) {
    if (step && typeof step === 'object' && !isList(step)) { options = step; step = undefined }
    this.stop()
    if (this.what instanceof Sheet) this.what.pages.delete(this)
    if (what instanceof Sheet) what.pages.add(this)
    this.what = what
    this.step = step
    if (options) Object.assign(this.options, spelled(options))
    this.tick = -1
    this.read()
    return this
  }

  // --- where it is, and how big
  fit() {
    const stage = this.stage, o = this.options
    const [W, H] = stage.size()
    const ratio = window.devicePixelRatio || 1
    const m = o.margin
    const given = o.x !== undefined || o.y !== undefined || typeof o.at === 'object'
    const rect = typeof o.at === 'object' && o.at ? o.at : o
    const w = Math.max(60, Math.min(given && rect.width ? rect.width : o.width || W - 2 * m, W))
    const S = (o.space || clamp(w / 62, 7, 11)) * (o.zoom || o.scale || 1)
    const pad = 0.8 * S
    const key = [w, S, o.scroll, o.lines, o.barNumbers, o.title].join()
    if (this.score && (!this.plan || this.planKey !== key)) {
      this.planKey = key
      this.plan = layout(this.score, { width: w - 2 * pad, space: S, across: o.scroll === 'across', lines: o.lines, barNumbers: o.barNumbers, title: o.title, tempo: o.tempoMark })
      this.all = true
      this.times = null
    }
    let natural = (this.plan ? this.plan.height : 8 * S) + 2 * pad
    const fill = o.at === 'fill'
    // Left to itself it takes the room its music needs, up to about half the picture, and then as many whole lines of music as fit.
    const most = Math.max(H * (o.share || 0.46), 14 * S)
    if (this.plan && natural > most) {
      const fits = this.plan.systems.filter((sys) => sys.y + sys.h + 2 * pad <= most).pop() || this.plan.systems[0]
      natural = fits.y + fits.h + 2 * pad
    }
    const h = Math.max(40, Math.min(fill ? H - 2 * m : given && rect.height ? rect.height : o.height || natural, H))
    const x = given ? rect.x ?? m : o.at === 'right' ? W - w - m : o.at === 'left' ? m : (W - w) / 2
    const y = given ? rect.y ?? m : o.at === 'bottom' ? H - h - m : o.at === 'middle' || o.at === 'center' || o.at === 'centre' ? (H - h) / 2 : m
    const [left, top] = stage.origin()
    const box = this.box
    if (box.x !== x || box.y !== y || box.w !== w || box.h !== h || this.ratio !== ratio || this.left !== left || this.top !== top) {
      Object.assign(box, { x, y, w, h })
      this.ratio = ratio; this.left = left; this.top = top
      const s = this.wrap.style
      s.left = left + x + 'px'; s.top = top + y + 'px'; s.width = w + 'px'; s.height = h + 'px'
      this.layer.style.width = w + 'px'; this.layer.style.height = h + 'px'
      this.layer.width = Math.max(1, Math.round(w * ratio)); this.layer.height = Math.max(1, Math.round(h * ratio))
      this.all = true
    }
    this.pad = pad
    this.S = S
  }
  get x() { return this.box.x }
  get y() { return this.box.y }
  get w() { return this.box.w }
  get h() { return this.box.h }
  get width() { return this.box.w }
  get height() { return this.box.h }
  /** Move it and size it: page.place({ at: "bottom" }), page.place({ x: 20, y: 20, width: 400, height: 200 }). */
  place(where) { Object.assign(this.options, typeof where === 'string' ? { at: where, x: undefined, y: undefined } : spelled(where)); return this }
  get zoom() { return this.options.zoom }
  set zoom(z) { this.options.zoom = clamp(+z || 1, 0.4, 4) }
  /** Take the page away. */
  remove() {
    this.stop()
    if (this.what instanceof Sheet) this.what.pages.delete(this)
    for (const undo of this.undo.splice(0)) undo()
    this.wrap.remove()
    const i = this.stage.pages.indexOf(this)
    if (i >= 0) this.stage.pages.splice(i, 1)
  }

  // --- following
  /** How far through the music it is, in beats. Setting it moves the line there. */
  get beat() { return Math.max(0, this.tick) / TICKS }
  set beat(b) { this.source = null; this.tick = Math.max(0, b) * TICKS }
  /** The bar it is in, counting from 1. */
  get bar() { return this.score ? Math.floor(Math.max(0, this.tick) / this.score.bar) + 1 : 1 }
  /** The notes sounding now, as numbers. */
  get sounding() { return this.active.flatMap((e) => e.sounds) }
  /**
   * Follow something that plays: a song (anything with a `position`, as playSong gives), a function that gives beats
   * (`beat`, from the sound library, or your own), or true to follow what this page itself plays.
   */
  follow(what) {
    this.following = what
    if (what === true || what === undefined) return this
    if (typeof what === 'function') this.source = () => what()
    else if (what && ('position' in what || method(what, 'songPosition', 'song_position'))) {
      const ask = method(what, 'songPosition', 'song_position')
      let last = -1, at = 0, shownBeat = 0
      this.seekable = what
      this.source = () => {
        const p = ask ? ask() : what.position
        const map = this.score && this.score.song
        if (!p || !map || p.state === 'none' || p.state === 'stopped' || p.order === undefined) return null
        // A song says where it is a tick at a time. Between two ticks the line keeps moving at the song's own
        // pace, and never further than the tick it is waiting for: so it is smooth, and cannot drift.
        const raw = map.beat(p), now = nowSeconds()
        if (raw !== last) { last = raw; at = now }
        const tick = 1 / ((p.speed || 6) * map.rowsPerBeat)
        const ahead = p.state === 'playing' ? Math.min(tick, (now - at) * (p.tempo || 125) / 2.5 * tick) : 0
        shownBeat = raw + ahead
        return shownBeat
      }
    } else if (what && typeof what.beat === 'number') this.source = () => what.beat
    else throw new Error(`follow needs something that plays: a song from playSong, or a function that gives how many beats have gone by. It was given ${shown(what)}`)
    return this
  }
  unfollow() { this.source = null; this.following = null; return this }

  /**
   * Is the sound on? A browser keeps a page silent until it has been touched, and the sound library loads its engine
   * first: its clock runs all the while, so the clock alone cannot say. A sound says with its player's `state`
   * ("loading" and "waiting" are not yet), or a `state` of its own; a sound that says nothing is taken to be on.
   */
  soundOn() {
    const sound = this.sound
    if (!sound) return true
    const player = sound.player || (method(sound, 'soundPlayer', 'sound_player') || (() => null))()
    const state = player && player.state !== undefined ? player.state : typeof sound.state === 'function' ? sound.state() : sound.state
    return state !== 'loading' && state !== 'waiting'
  }
  /** The time on the sound's clock, or the page's own when no sound was given. */
  clock() { const ask = method(this.sound, 'soundTime', 'sound_time'); return ask ? ask() : nowSeconds() }
  /**
   * How long after the time it was asked for a note is heard: the sound library plays everything 0.04 seconds
   * late, so that it can place it exactly. The line keeps to what is heard. A sound may say its own (`latency`).
   */
  get latency() { const sound = this.sound; return this.options.latency ?? (sound && typeof sound.latency === 'number' ? sound.latency : method(sound, 'soundTime', 'sound_time') ? 0.04 : 0) }
  /**
   * Play the music through the sound that was given (useSound), and follow it: page.play(), page.play({ from: 8 })
   * to start eight beats in, { tempo: 90 } to play it slower, { repeat: true }. With no sound, the line moves in silence.
   */
  play(o = {}) {
    if (typeof o === 'number') o = { from: o }
    this.stop()
    const score = this.score
    if (!score) { this.ready && this.ready.then(() => this.score && this.play(o)); return this }
    // Begun when the sound is on: until then the line would move through notes nobody could hear.
    if (!this.soundOn()) { this.playing = true; this.pending = () => this.play(o); return this }
    const sound = this.sound
    const bpm = o.tempo || this.options.tempo || score.tempo
    const from = Math.round(clamp(o.from || 0, 0, score.length / TICKS) * TICKS)
    const step = score.grid
    const t0 = this.clock() + 0.12
    const make = method(sound, 'makeSynth', 'make_synth')
    const main = method(sound, 'playNotes', 'play_notes')
    if (!sound && !Page.said) { Page.said = true; console.info('notation.js: the music is followed in silence, because no sound was given to play it with. Give one: useSound({ playNotes, makeSynth, soundTime })') }
    this.words(from).forEach((text, i) => {
      if (!text || !sound) return
      // Each staff plays on a synth of its own (made once, and kept), unless the page was given one; or on the sound's main synth.
      const synth = this.options.synth || (make && (i > 0 || this.options.voice || !main) ? (this.voices[i] ||= make(this.options.voice || 'keys')) : null)
      const play = method(synth, 'playNotes', 'play_notes') || main
      if (play) this.tunes.push(play(text, step / TICKS * 60 / bpm, { at: t0, hold: 0.94 }))
    })
    this.playing = true
    this.repeat = !!o.repeat
    this.playFrom = from
    const late = this.latency
    this.source = () => {
      const t = (this.clock() - late - t0) * bpm / 60 + from / TICKS
      if (t * TICKS >= score.length) {
        if (this.repeat) { this.play({ ...o, from: 0 }); return null }
        this.finish()
        return null
      }
      // (Nothing lights in the moment before the first note is heard.)
      return t * TICKS < from ? null : t
    }
    return this
  }
  /** Each tuned staff's notes from a tick on, as playNotes takes them, a step being the finest length written: "C4:2 -:2 E4+G4:4". */
  words(from = 0) {
    const step = this.score.grid
    return this.score.staves.map((staff) => {
      if (staff.percussion) return ''
      const words = []
      let at = from
      for (const e of staff.events) {
        if (e.end <= from) continue
        const start = Math.max(e.start, from)
        if (start > at) words.push('-:' + (start - at) / step)
        words.push(e.sounds.map(noteName).join('+') + ':' + (e.end - start) / step)
        at = e.end
      }
      return words.join(' ')
    })
  }
  /**
   * For a host that plays the music itself, somewhere else: follow from a moment on its clock. `now` is its clock
   * as it sent this, `at` when the music begins on that clock, `from` the beat it begins at.
   */
  run(o) {
    this.stop()
    const score = this.score
    if (!score) return
    this.stage.sync(o.now)
    const theirs = method(this.sound, 'soundTime', 'sound_time')
    const bpm = o.bpm || score.tempo, from = (o.from || 0) * TICKS, late = o.latency ?? 0.04
    this.playing = true
    this.source = () => {
      // (The host's clock as the page's sound reckons it, when it does; else as this page has, from what the host has sent.)
      const now = theirs ? theirs() : null
      const t = ((typeof now === 'number' ? now : nowSeconds() - this.stage.offset) - late - o.at) * bpm / 60 + from / TICKS
      if (t * TICKS >= score.length) { this.finish(); return null }
      return t * TICKS < from ? null : t
    }
  }
  /**
   * For a host whose song plays in this page: follow the page's own sound, where it can say the song's place
   * (`songPosition()`), and tell the host so ("direct"), which then need hand nothing on. A tapped bar is told to the host.
   */
  followSound() {
    const ask = method(this.sound, 'songPosition', 'song_position')
    if (!ask) return
    this.feeding = true
    this.direct = true
    this.follow({ get position() { return ask() } })
    this.stage.tell(this.id, 'direct', 1)
  }
  /** For a host that reads the song's place itself: where the song is now, as song.position gives it. */
  feed(position) {
    if (this.direct) return
    this.fed = position
    if (!this.feeding) { this.feeding = true; this.follow({ get position() { return this.page.fed }, page: this }) }
  }
  finish() {
    this.playing = false
    this.source = null
    this.rest()
    if (this.onDone && !this.along) this.onDone(this)
    this.stage.tell(this.id, 'done', null)
  }
  /** Stop what the page is playing, and put the line back at the start. */
  stop() {
    for (const tune of this.tunes.splice(0)) { const stop = method(tune, 'stop'); if (stop) stop() }
    this.pending = null
    if (this.playing) { this.playing = false; this.source = null }
    this.rest()
    return this
  }
  /** Nothing is sounding: every note goes back to plain ink. */
  rest() {
    for (const e of this.active) this.mark(e, 0)
    this.active = []
    this.next = 0
    this.tick = -1
    this.barNow = -1
  }
  mark(e, state) {
    if (e.state === state) return
    e.state = state
    for (const item of e.items) this.dirty.add(item.bar)
  }
  /** Where the music has got to: light what sounds, and say what has just begun. */
  advance(tick) {
    const score = this.score, events = score.events
    if (tick < this.tick - 0.01 || this.next > events.length) {
      for (const e of this.active) this.mark(e, 0)
      this.active = []
      this.next = 0
      while (this.next < events.length && events[this.next].end <= tick) this.next++
    }
    this.tick = tick
    const along = this.along
    if (this.active.length) this.active = this.active.filter((e) => { if (e.end > tick) return true; if (!along) this.mark(e, 0); return false })
    while (this.next < events.length && events[this.next].start <= tick) {
      const e = events[this.next++]
      if (e.end <= tick) continue
      this.active.push(e)
      if (!along) this.mark(e, NOW)
      const note = this.noteOf(e)
      if (this.onNote) this.onNote(note)
      this.stage.tell(this.id, 'note', [e.sounds, e.start / TICKS, (e.end - e.start) / TICKS, e.staff])
    }
    const bar = Math.floor(tick / score.bar)
    if (bar !== this.barNow) {
      this.barNow = bar
      if (this.onBar) this.onBar(bar + 1)
      this.stage.tell(this.id, 'bar', bar + 1)
    }
  }
  noteOf(e) { return { note: e.sounds[0], notes: [...e.sounds], name: noteName(e.sounds[0]), start: e.start / TICKS, length: (e.end - e.start) / TICKS, staff: e.staff, part: e.part, bar: Math.floor(e.start / this.score.bar) + 1 } }

  /** Where on the page a moment is: the system it is in, and how far across. */
  spot(tick) {
    const plan = this.plan, bar = clamp(Math.floor(tick / this.score.bar), 0, this.score.bars - 1)
    const sys = plan.bars[bar].sys, times = sys.times
    let i = 0
    while (i < times.length - 2 && times[i + 1][0] <= tick) i++
    const [t1, x1] = times[i], [t2, x2] = times[i + 1] || times[i]
    return { sys, x: tick <= t1 ? x1 : t2 > t1 ? x1 + (x2 - x1) * clamp((tick - t1) / (t2 - t1), 0, 1) : x1 }
  }

  // --- a frame: read where the music is, draw what changed, move the line
  frame(now) {
    this.fit()
    if (this.pending && this.soundOn()) { const begin = this.pending; this.pending = null; begin() }
    const g = this.g, k = this.ratio, box = this.box, c = this.colours
    if (!this.plan) {
      if (this.all) { this.all = false; this.blank(g, c); if (this.error) this.say(g, c, this.error) }
      this.cursor.style.display = 'none'
      return
    }
    if (this.source) { const beat = this.source(); if (beat !== null && beat !== undefined && Number.isFinite(beat)) this.advance(beat * TICKS) } else if (this.tick >= 0 && !this.along) this.advance(this.tick)
    if (this.along) this.alongFrame()
    const plan = this.plan, pad = this.pad
    // Keep the line of music that is playing in view: the page turns to it.
    const dt = Math.min(0.1, (now - (this.last || now)) / 1000)
    this.last = now
    const viewW = box.w - 2 * pad, viewH = box.h - 2 * pad
    const maxY = Math.max(0, plan.height - viewH), maxX = Math.max(0, plan.width - viewW)
    let where = null
    if (this.tick >= 0) {
      where = this.spot(this.tick)
      if (now > this.hand) {
        const sys = where.sys
        if (sys.y - 0.5 * this.S < this.goY || sys.y + sys.h > this.goY + viewH) this.goY = sys.index === 0 ? 0 : sys.y - 0.5 * this.S
        if (this.options.scroll === 'across') this.goX = where.x - viewW * 0.3
      }
    }
    this.goY = clamp(this.goY, 0, maxY); this.goX = clamp(this.goX, 0, maxX)
    const ease = (from, to) => (Math.abs(to - from) < 0.5 ? to : from + (to - from) * Math.min(1, dt * (this.options.scroll === 'across' && this.tick >= 0 ? 14 : 9)))
    const sx = ease(this.scrollX, this.goX), sy = ease(this.scrollY, this.goY)
    if (sx !== this.scrollX || sy !== this.scrollY) { this.scrollX = sx; this.scrollY = sy; this.all = true }
    const t = [k, (pad - this.scrollX) * k, (pad - this.scrollY) * k, plan.S]
    const ghosts = this.ghosts
    if (ghosts.length && ghosts.some((gh) => gh.until < now)) { for (const gh of ghosts) this.dirty.add(gh.bar); this.ghosts = ghosts.filter((gh) => gh.until >= now) }
    if (this.all) {
      this.all = false
      this.dirty.clear()
      this.blank(g, c)
      g.save()
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.beginPath(); g.rect(pad * k * 0.4, pad * k * 0.4, (box.w - pad * 0.8) * k, (box.h - pad * 0.8) * k); g.clip()
      paint(g, plan.head, c, t)
      for (const sys of plan.systems) {
        if (sys.y + sys.h < this.scrollY - pad || sys.y > this.scrollY + box.h) continue
        paint(g, sys.fixed, c, t)
        for (const bar of sys.bars) if (bar.x + bar.w >= this.scrollX - pad && bar.x <= this.scrollX + box.w) paint(g, bar.prims, c, t)
      }
      this.drawGhosts(g, c, t)
      g.restore()
    } else if (this.dirty.size) {
      // Only the bars whose notes changed colour: each is wiped and drawn again inside its own box.
      for (const n of this.dirty) {
        const bar = plan.bars[n]
        if (!bar) continue
        const sys = bar.sys
        if (sys.y + sys.h < this.scrollY - pad || sys.y > this.scrollY + box.h) continue
        // (Between its bar lines: the one on its left belongs to the bar before, and neither changes colour.)
        const edge = 0.1 * this.S
        const x1 = Math.max(pad * 0.4, bar.x - this.scrollX + pad + edge), x2 = Math.min(box.w - pad * 0.4, bar.x + bar.w - this.scrollX + pad - edge)
        const y1 = Math.max(pad * 0.4, sys.y - this.scrollY + pad), y2 = Math.min(box.h - pad * 0.4, sys.y + sys.h - this.scrollY + pad)
        if (x2 <= x1 || y2 <= y1) continue
        g.save()
        g.setTransform(1, 0, 0, 1, 0, 0)
        g.beginPath(); g.rect(Math.round(x1 * k), Math.round(y1 * k), Math.round(x2 * k) - Math.round(x1 * k), Math.round(y2 * k) - Math.round(y1 * k)); g.clip()
        this.blank(g, c, true)
        paint(g, sys.fixed, c, t)
        paint(g, bar.prims, c, t)
        this.drawGhosts(g, c, t)
        g.restore()
      }
      this.dirty.clear()
    }
    // The line that moves is an element of its own: moving it draws nothing again.
    const line = this.cursor.style
    if (where && this.options.line !== false) {
      const sys = where.sys
      const x = where.x - this.scrollX + pad - 1.5, y = sys.staffY[0] - this.S - this.scrollY + pad, h = sys.staffY[sys.staffY.length - 1] + 5 * this.S - sys.staffY[0] + this.S
      const key = `${Math.round(x * 4)},${Math.round(y)},${Math.round(h)},${c.cursor}`
      if (key !== this.cursorAt) {
        this.cursorAt = key
        line.display = y + h < 0 || y > box.h ? 'none' : 'block'
        line.height = h + 'px'
        if (this.cursorInk !== c.cursor) {
          this.cursorInk = c.cursor
          const g = this.cursor.getContext('2d')
          g.clearRect(0, 0, 1, 1); g.globalAlpha = 0.6; g.fillStyle = c.cursor; g.fillRect(0, 0, 1, 1)
        }
        line.transform = `translate(${x}px, ${y}px)`
      }
    } else if (this.cursorAt !== null) { this.cursorAt = null; line.display = 'none' }
  }
  blank(g, c, inside) {
    const k = this.ratio, box = this.box
    g.setTransform(k, 0, 0, k, 0, 0)
    g.clearRect(0, 0, box.w, box.h)
    if (!c.paper) return
    g.fillStyle = c.paper
    const r = Math.min(10, box.h / 4)
    g.beginPath()
    if (g.roundRect) g.roundRect(0.5, 0.5, box.w - 1, box.h - 1, r); else g.rect(0.5, 0.5, box.w - 1, box.h - 1)
    g.fill()
    if (c.edge && !inside) { g.strokeStyle = c.edge; g.lineWidth = 1; g.stroke() }
  }
  say(g, c, words) {
    g.setTransform(this.ratio, 0, 0, this.ratio, 0, 0)
    g.fillStyle = c.wrong
    g.font = `14px ${FONT}`
    g.textBaseline = 'top'
    let line = '', y = 12
    for (const word of words.split(' ')) {
      if (g.measureText(line + word).width > this.box.w - 24 && line) { g.fillText(line, 12, y); y += 18; line = '' }
      line += word + ' '
    }
    g.fillText(line, 12, y)
  }

  // --- hands: tap a note to hear it, tap a bar to play from there, drag to turn the page
  listen() {
    const wrap = this.wrap
    this.undo = []
    const on = (target, type, fn, how) => { target.addEventListener(type, fn, how); this.undo.push(() => target.removeEventListener(type, fn, how)) }
    let down = null
    const point = (e) => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    // (The scene's canvas keeps the keyboard: a press here must not take it away.)
    on(wrap, 'mousedown', (e) => e.preventDefault())
    on(wrap, 'pointerdown', (e) => {
      const [x, y] = point(e)
      down = { id: e.pointerId, x, y, sx: this.goX, sy: this.goY, moved: false }
      try { wrap.setPointerCapture(e.pointerId) } catch (err) { /* a pointer that is already gone */ }
    })
    on(wrap, 'pointermove', (e) => {
      if (!down || e.pointerId !== down.id) return
      const [x, y] = point(e)
      if (!down.moved && Math.hypot(x - down.x, y - down.y) < 8) return
      down.moved = true
      this.hand = performance.now() + 2500
      this.scrollX = this.goX = down.sx - (x - down.x)
      this.scrollY = this.goY = down.sy - (y - down.y)
      this.all = true
    })
    const up = (e) => {
      if (!down || e.pointerId !== down.id) return
      const was = down
      down = null
      if (!was.moved && e.type === 'pointerup') this.tap(was.x, was.y)
    }
    on(wrap, 'pointerup', up)
    on(wrap, 'pointercancel', up)
    on(wrap, 'wheel', (e) => {
      if (!this.plan) return
      const across = this.options.scroll === 'across'
      const room = across ? this.plan.width - (this.box.w - 2 * this.pad) : this.plan.height - (this.box.h - 2 * this.pad)
      if (room <= 0) return
      e.preventDefault()
      this.hand = performance.now() + 2500
      if (across) this.scrollX = this.goX = this.goX + (e.deltaX || e.deltaY); else this.scrollY = this.goY = this.goY + e.deltaY
      this.all = true
    }, { passive: false })
  }
  /** What is at a point of the page's box: { note, … } for a note, { bar } for anywhere else in a bar, or null. */
  under(x, y) {
    if (!this.plan) return null
    const px = x - this.pad + this.scrollX, py = y - this.pad + this.scrollY
    for (const hit of this.plan.hits) if (px >= hit.x && px <= hit.x + hit.w && py >= hit.y1 && py <= hit.y2 && hit.sys.y <= py && py <= hit.sys.y + hit.sys.h) {
      const head = hit.item.heads.reduce((a, h) => (Math.abs(h.py - py) < Math.abs(a.py - py) ? h : a))
      return { ...this.noteOf(hit.item.event), note: head.sounds, name: noteName(head.sounds), event: hit.item.event }
    }
    for (const bar of this.plan.bars) if (px >= bar.x && px <= bar.x + bar.w && py >= bar.sys.y && py <= bar.sys.y + bar.sys.h) return { bar: bar.n + 1 }
    return null
  }
  tap(x, y) {
    const at = this.under(x, y)
    if (!at) return
    if (at.event) {
      const { event, ...note } = at
      if (this.options.hear !== false) this.hear(event.staff !== undefined && this.score.staves[event.staff].percussion ? [] : [note.note])
      if (this.onTap) this.onTap(note)
      this.stage.tell(this.id, 'tap', [note.note, note.start, note.bar])
    } else {
      if (this.onTap) this.onTap(at)
      this.stage.tell(this.id, 'tap', [null, null, at.bar])
      if (this.options.seek !== false && !this.along) this.seek(at.bar)
    }
  }
  /** Sound some notes for a moment, through the sound that was given. */
  hear(notes, seconds = 0.45) {
    const play = method(this.options.synth, 'play') || method(this.sound, 'playNote', 'play_note')
    if (play) for (const n of notes) play(n, seconds)
  }
  /** Go to a bar (counting from 1): a song that is followed is sent there, a tune this page plays starts again from there. */
  seek(bar) {
    const score = this.score
    if (!score) return this
    const beat = clamp(bar - 1, 0, score.bars - 1) * score.bar / TICKS
    const song = this.seekable, go = method(song, 'seek')
    if (score.song && this.feeding) this.stage.tell(this.id, 'seek', score.song.place(beat))
    else if (go && score.song && this.following === song) { const place = score.song.place(beat); go(place.order, place.row) } else if (this.playing && this.tunes.length === 0 && this.stage.listener) this.stage.tell(this.id, 'again', beat)
    else if (this.playing) this.play({ from: beat, repeat: this.repeat })
    else if (!this.source) this.tick = beat * TICKS
    return this
  }

  // --- playing along: the learner plays, and the page says how it went
  /**
   * The learner plays the music: page.playAlong("wait") waits at each note until it is played; page.playAlong("time")
   * keeps time, at the music's tempo or { tempo: 60 }, after a bar counted in. Notes come from anywhere, through
   * page.noteOn(note) and page.noteOff(note): so the page can be what a keyboard plays (dials.js: keyboard(page)).
   * Right notes turn green and wrong ones red; page.result is how it went, and onDone is called with it at the end.
   */
  playAlong(o = {}) {
    if (o === false) { this.along = null; return this }
    if (typeof o === 'string') o = { mode: o }
    o = spelled(o)
    const mode = /time|tempo|keep/i.test(o.mode || '') ? 'time' : 'wait'
    this.stop()
    this.along = { options: o, mode, groups: [], at: 0, pending: new Set(), done: false, t0: 0, errors: [] }
    this.result = { right: 0, wrong: 0, missed: 0, total: 0, timing: null, percent: 0, done: false }
    if (o.synth) this.options.synth = o.synth
    if (!this.score) return this
    // (Keeping time begins when the sound is on, as playing does.)
    if (mode === 'time' && !this.soundOn()) { this.pending = () => this.playAlong(o); return this }
    const along = this.along, score = this.score
    const staffs = o.staff === undefined ? null : [].concat(o.staff)
    // What is to be played, a moment at a time: the notes that begin together, on the staves chosen.
    const groups = new Map()
    for (const e of score.events) {
      e.marks = null; e.state = 0
      if (score.staves[e.staff].percussion || (staffs && !staffs.includes(e.staff))) continue
      let group = groups.get(e.start)
      if (!group) groups.set(e.start, group = { start: e.start, events: [], notes: [], hit: new Set() })
      group.events.push(e)
      for (const n of e.sounds) if (!group.notes.includes(n)) group.notes.push(n)
    }
    along.groups = [...groups.values()].sort((a, b) => a.start - b.start)
    this.result.total = along.groups.reduce((n, group) => n + group.notes.length, 0)
    this.all = true
    if (mode === 'wait') {
      this.tick = along.groups.length ? along.groups[0].start : 0
      this.source = null
    } else {
      const bpm = along.bpm = o.tempo || this.options.tempo || score.tempo
      const lead = o.countIn === undefined ? score.bar / TICKS : o.countIn
      along.t0 = this.clock() + lead * 60 / bpm
      along.window = Math.max(0.3, 0.16 * bpm / 60) // how far from its moment a note may be played, in beats
      // A song that is being followed keeps the time; else the sound's clock does.
      const late = this.latency
      if (!this.source) this.source = () => (this.clock() - late - along.t0) * bpm / 60
      along.mine = !this.following
      this.tick = 0
    }
    return this
  }
  play_along(o) { return this.playAlong(o) }
  /** A key went down: 60 is middle C. With { synth } given, it is heard too. */
  noteOn(note, velocity = 0.8) {
    note = noteNumber(note)
    this.held.add(note)
    const sing = method(this.options.synth, 'noteOn', 'note_on')
    if (sing) sing(note, velocity)
    const along = this.along
    if (!along || along.done || !this.score) return this
    const same = (a) => (along.options.anyOctave ? (a - note) % 12 === 0 : a === note)
    let group = null, found
    if (along.mode === 'wait') {
      group = along.groups[along.at]
      found = group && group.notes.find((n) => same(n) && !group.hit.has(n))
    } else {
      const beat = this.source ? this.tick / TICKS : 0
      let best = along.window
      for (let i = along.at; i < along.groups.length && along.groups[i].start / TICKS <= beat + along.window; i++) {
        const far = Math.abs(along.groups[i].start / TICKS - beat)
        const n = along.groups[i].notes.find((p) => same(p) && !along.groups[i].hit.has(p))
        if (n !== undefined && far <= best) { best = far; group = along.groups[i]; found = n }
      }
      if (found !== undefined) along.errors.push(best * 60 / along.bpm)
    }
    if (found !== undefined) {
      group.hit.add(found)
      for (const e of group.events) if (e.sounds.includes(found)) { (e.marks ||= {})[e.notes[e.sounds.indexOf(found)]] = RIGHT; for (const item of e.items) this.dirty.add(item.bar) }
      this.result.right++
      if (this.onRight) this.onRight(note)
      this.stage.tell(this.id, 'right', note)
      if (along.mode === 'wait' && group.hit.size === group.notes.length) {
        along.at++
        if (along.at >= along.groups.length) this.alongDone()
        else this.tick = along.groups[along.at].start
      }
    } else {
      this.result.wrong++
      this.ghost(note, group || along.groups[Math.min(along.at, along.groups.length - 1)])
      if (this.onWrong) this.onWrong(note)
      this.stage.tell(this.id, 'wrong', note)
    }
    this.tally()
    return this
  }
  note_on(note, velocity) { return this.noteOn(note, velocity) }
  noteOff(note) {
    note = noteNumber(note)
    this.held.delete(note)
    const hush = method(this.options.synth, 'noteOff', 'note_off')
    if (hush) hush(note)
    return this
  }
  note_off(note) { return this.noteOff(note) }
  /** The keys to light on a keyboard this page is tied to: those held, and (waiting for the learner) the next to play. */
  notes() {
    const along = this.along
    if (along && !along.done && along.mode === 'wait' && along.options.hint !== false && along.groups[along.at]) return [...new Set([...this.held, ...along.groups[along.at].notes.filter((n) => !along.groups[along.at].hit.has(n))])]
    return [...this.held]
  }
  /** A wrong note is shown for a moment where it would be written, in red. */
  ghost(note, group) {
    if (!group || !this.plan) return
    const e = group.events[0], item = e.items[0], staff = this.score.staves[e.staff]
    const pos = spell(note, this.score.key).step - (BOTTOM_LINE[staff.clef] + staff.octave * 7)
    if (item.x === undefined) return
    this.ghosts.push({ x: item.x, y: item.sys.staffY[e.staff] + 4 * this.plan.S - pos * this.plan.S / 2, bar: item.bar, until: performance.now() + 700 })
    this.dirty.add(item.bar)
  }
  drawGhosts(g, c, t) {
    if (!this.ghosts.length) return
    paint(g, this.ghosts.map((gh) => ({ k: 'g', n: 'noteheadBlack', x: gh.x, y: gh.y, e: { state: WRONG } })), c, t)
  }
  alongFrame() {
    const along = this.along
    if (along.done || along.mode !== 'time') return
    const beat = this.tick / TICKS
    // A note whose moment has gone by unplayed is missed, and turns red.
    while (along.at < along.groups.length && along.groups[along.at].start / TICKS < beat - along.window) {
      const group = along.groups[along.at++]
      for (const n of group.notes) if (!group.hit.has(n)) {
        this.result.missed++
        for (const e of group.events) if (e.sounds.includes(n)) { (e.marks ||= {})[e.notes[e.sounds.indexOf(n)]] = WRONG; for (const item of e.items) this.dirty.add(item.bar) }
      }
      this.tally()
    }
    if (along.at >= along.groups.length && beat * TICKS >= this.score.length) this.alongDone()
  }
  tally() {
    const r = this.result, along = this.along
    r.percent = r.total ? Math.round(100 * Math.max(0, r.right - r.wrong * 0.5) / r.total) : 0
    if (along.errors.length) r.timing = along.errors.reduce((a, b) => a + b, 0) / along.errors.length
    this.stage.tell(this.id, 'result', { ...r })
  }
  alongDone() {
    const along = this.along
    along.done = true
    this.tally()
    this.result.done = true
    if (along.mode === 'time' && along.mine) this.source = null
    if (this.onDone) this.onDone(this.result)
    this.stage.tell(this.id, 'done', { ...this.result })
  }
}
for (const [snake, camel] of Object.entries(SPELLING)) if (/^on_/.test(snake)) Object.defineProperty(Page.prototype, snake, { get() { return this[camel] }, set(fn) { this[camel] = fn } })

/** The pages of one canvas or element: where they are put, the frames that draw them, and what they are told. */
class Stage {
  constructor(host) {
    this.host = host
    this.canvas = typeof host.getContext === 'function'
    this.pages = []
    this.nextId = 1
    this.sound = null
    this.colours = {}
    this.listener = null
    this.told = []
    this.beats = false // the listener is called every frame it has answered the last (`ack`)
    this.armed = true
    this.offset = Infinity // how far a host's clock is behind this page's: the shortest journey seen
    if (!this.canvas && getComputedStyle(host).position === 'static') host.style.position = 'relative'
    const tick = (now) => {
      if (!host.isConnected) return this.close()
      this.raf = requestAnimationFrame(tick)
      for (const page of [...this.pages]) {
        if (!page.wrap.isConnected) { page.remove(); continue }
        try { page.frame(now) } catch (e) { page.fail(e); page.all = true }
      }
      const beat = this.beats && this.armed
      if (this.listener && (this.told.length || beat)) {
        const told = this.told
        this.told = []
        if (beat) this.armed = false
        // (As JSON text: a host that carries this elsewhere need know nothing of its shape.)
        this.listener({ t: told.length ? JSON.stringify(told) : '', b: beat ? 1 : 0 })
      }
    }
    this.raf = requestAnimationFrame(tick)
  }
  /** Over the scene's canvas and whatever other libraries have laid on it (effects, a change of scene), and under the on-screen controls. */
  mount(wrap) {
    if (!this.canvas) { this.host.append(wrap); return }
    let after = this.host
    for (let next = after.nextElementSibling; next && next.dataset && next.dataset.dialsLayer === undefined; next = next.nextElementSibling) {
      if (next.tagName !== 'CANVAS' && next.dataset.notationLayer === undefined) break
      after = next
    }
    after.after(wrap)
  }
  size() { return [this.host.clientWidth, this.host.clientHeight] }
  origin() { return this.canvas ? [this.host.offsetLeft, this.host.offsetTop] : [0, 0] }
  tell(id, what, more) { if (this.listener) this.told.push(id, what, more) }
  sync(now) { if (typeof now === 'number') this.offset = Math.min(this.offset, nowSeconds() - now) }
  close() {
    cancelAnimationFrame(this.raf)
    for (const page of [...this.pages]) page.remove()
    if (this.host[STAGE] === this) delete this.host[STAGE]
  }
}

function api(stage) {
  /** showNotes(music), showNotes("C4 E4 G4", "quarter"), showNotes(music, { at: "bottom" }). */
  const showNotes = (what, step, options) => {
    if (step && typeof step === 'object' && !isList(step)) { options = step; step = undefined }
    const page = new Page(stage, what, step, spelled(options || {}))
    stage.pages.push(page)
    return page
  }
  return {
    showNotes, show_notes: showNotes,
    makeSheet, make_sheet: makeSheet,
    /** The sound these pages play through and keep time by: anything with soundTime(), playNote(), makeSynth() or playNotes(). */
    useSound: (sound) => { stage.sound = sound || null },
    theme: (colours) => { Object.assign(stage.colours, colours); for (const page of stage.pages) page.all = true },
    /** Is a page of music at this point of the scene? A game asks before it treats a click as its own. */
    over: (x, y) => { if (typeof x === 'object') ({ x, y } = x); return stage.pages.some((p) => x >= p.box.x && x <= p.box.x + p.box.w && y >= p.box.y && y <= p.box.y + p.box.h) },
    clear: () => { for (const page of [...stage.pages]) page.remove() },
    get all() { return [...stage.pages] },
    stage,

    // --- for a host that keeps the program somewhere else (Python): pages by number
    make: (id, what, step, options) => { showNotes(what, step ?? undefined, { ...options, id }) },
    set: (id, name, value) => { const page = stage.pages.find((p) => p.id === id); if (page) { if (name in page && !(name in page.options)) page[name] = value; else { page.options[SPELLING[name] || name] = value; page.planKey = null } } },
    call: (id, name, ...args) => { const page = stage.pages.find((p) => p.id === id); if (page && typeof page[name] === 'function') page[name](...args) },
    drop: (id) => { const page = stage.pages.find((p) => p.id === id); if (page) page.remove() },
    /** The page itself, by its number: what a keyboard in the page is tied to. */
    page: (id) => stage.pages.find((p) => p.id === id) || null,
    /** The words a page would play, for a host that does the playing: told back as "words". */
    words: (id, from) => {
      const page = stage.pages.find((p) => p.id === id)
      if (!page) return
      // (Told when the music is written and the sound is on: the host plays the moment it hears.)
      const say = () => { if (page.score) stage.tell(id, 'words', { staves: page.words(Math.round((from || 0) * TICKS)), step: page.score.grid / TICKS, tempo: page.score.tempo, from: from || 0 }) }
      if (page.score && page.soundOn()) say(); else page.pending = () => (page.score ? say() : (page.pending = say))
    },
    /**
     * What happened is handed over once a frame: { t: JSON text of a flat list of page id, what, details… }. `what` is "note",
     * "bar", "tap", "right", "wrong", "result", "done", "words", "seek", "again" or "direct".
     */
    listen: (fn) => { stage.listener = fn },
    /** A host that must look at something every frame is called every frame instead, once it has answered the last call with ack(). */
    beat: (on) => { stage.beats = on !== false; stage.armed = true },
    ack: () => { stage.armed = true },
  }
}

/** The pages of one canvas or element: `const { showNotes } = notation(canvas)`. With nothing named, the page's only canvas. */
function notation(host, options) {
  if (host && typeof host.getBoundingClientRect !== 'function') { options = host; host = null }
  host ||= onlyCanvas()
  let stage = host[STAGE]
  // `fresh`: a new run of the scene on a canvas that was kept starts with no pages.
  if (stage && options && options.fresh) { stage.close(); stage = null }
  if (!stage) {
    stage = host[STAGE] = new Stage(host)
    stage.api = api(stage)
  }
  if (options && options.sound !== undefined) stage.sound = options.sound
  if (options && options.resolve !== undefined) stage.resolve = options.resolve
  return stage.api
}
function onlyCanvas() {
  const found = [...document.querySelectorAll('canvas')].filter((c) => !Object.keys(c.dataset).some((key) => /Layer$/.test(key)))
  if (found.length === 1) return found[0]
  throw new Error(found.length
    ? 'There is more than one canvas on this page, so say which one the music is for: const { showNotes } = notation(canvas)'
    : 'There is no canvas on this page to show music on. Name an element to fill instead: const { showNotes } = notation(document.body)')
}

/** A sheet to write music on a note at a time: makeSheet({ clef: "treble", key: "G", time: "3/4", tempo: 90 }). */
function makeSheet(options) { return new Sheet(options) }
/** The sound every page plays through and keeps time by, unless a page or a canvas is given its own. */
function useSound(sound) { theSound = sound || null }
/** Change the colours of every page: theme({ now: "deepskyblue" }, "light"). The names are those of THEMES. */
function theme(colours, which) {
  for (const name of which ? [which] : Object.keys(THEMES)) Object.assign(THEMES[name], colours)
  if (typeof document !== 'undefined') for (const c of document.querySelectorAll('canvas')) if (c[STAGE]) for (const page of c[STAGE].pages) page.all = true
  return THEMES
}

// The same function with no canvas named: for a page (and a pictures.js scene) with one canvas.
const showNotes = (...args) => notation().showNotes(...args)

const show_notes = showNotes, make_sheet = makeSheet, use_sound = useSound
/** The functions a scene is given by a library that has this one built in (pictures.js), in the spelling of JavaScript. */
const sceneNames = ['showNotes', 'makeSheet']

export {
  notation, showNotes, makeSheet, useSound, theme, version, show_notes, make_sheet, use_sound, sceneNames,
  // The parts that need no screen, for a program that wants the written music itself (and for the tests).
  readMusic, readTune, readSong, unpackSong, write, writeLength, layout, guessKey, chooseClef, spell, keyOf, timeOf, noteNumber, noteName, lengthBeats, glyphBox, Sheet,
}
