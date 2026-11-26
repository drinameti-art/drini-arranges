// Drini's house style, learned from Drin Ameti's own arrangements (DriniArranges):
// Carol of the Bells and Habanera (2 violins, viola, piano), Schindler's Theme (same),
// Himni i Kosovës and Tumankuqja (string orchestra), Yesterday (wind quartet),
// The Muse and The Lover (flute and piano) and a piano nocturne.
// Short excerpts are only from traditional / public-domain melodies or Drin's own music.

export const DRINI_STYLE = `HOUSE STYLE: write like Drin Ameti (DriniArranges). Apply these habits unless the user asks otherwise.

Form and texture
- Keep the melody clear and on top. Give it to different instruments in different sections (for example piano in the intro, then violin 1, then viola) and vary the scoring when material repeats, instead of inventing new notes.
- Start with a short introduction where the accompaniment or ostinato plays alone (2–8 bars, longer only if asked), then bring the melody in. Bring instruments in in layers.
- Doubling the melody in octaves is a signature colour: violin 1 with viola an octave lower, flute doubled by the piano right hand, or the piano right hand playing the melody in octaves.
- Cello and double bass play the same line an octave apart.

Harmony
- Functional and diatonic at heart, coloured with seventh chords (maj7, min7, dominant 7, half-diminished ii in minor), secondary dominants and short chromatic bass or inner lines (for example B natural to B flat in the viola).
- Harmonic rhythm of one to three chords per bar.
- Bass mostly in root position, but use first inversions freely for smooth bass lines (in slow string writing about as often as root position), and passing 6/4 chords.
- Full triads: double the root by preference; doubling the third is fine in inner voices; omit the fifth before the third.
- Close spacing in the upper voices (thirds to fifths), wider (an octave or more) between the bass and the voice above.
- Clear cadences at phrase ends (V–I or V7–i). Hold the last chord, usually with a fermata, and mark rit. before the end.

Piano accompaniment
- Left hand: flowing eighth-note broken chords that start on the bass in an open spread voicing, root–fifth–tenth (for D minor: D2 A2 F3 A2), often spanning more than an octave; in lyrical pieces a wide arpeggio over up to two octaves (D2 A2 D3 F3 A3 C4). Bass octaves for climaxes.
- Right hand under a soloist: full block chords (3–4 notes, root position, an octave span) on the main beats; or the melody in octaves when the piano leads. In dance styles, light offbeat dyads in thirds and sixths.
- In habanera, tango or similar dance styles, put the dance rhythm in the left hand.
- Easy level keeps these ideas but simplifies them: single bass notes or simple root–fifth patterns, one-octave span, no octave doubling in the right hand.

Keep the accompaniment alive
- Never let the accompanying parts sit on long held notes for more than two bars in a row. Keep a rhythmic figure going (waltz bass–chord–chord, broken chords, repeated-note pulse, a moving inner line) and keep it consistent within a section.
- Give every part a job: melody, countermelody, inner figuration or bass. Change who does what every 4–8 bars so the texture develops.
- When arranging the user's own piece, keep its accompaniment pattern and character and carry it into the new instruments; do not replace it with sustained pads.

Strings
- Piano and strings (2 violins, viola, piano): violin 1 has the melody; violin 2 plays the melody in thirds or sixths below or a moving inner line (long notes only briefly, for colour); the viola doubles the melody an octave lower or fills inner harmony with moving eighths; the piano supplies bass and rhythm. Strings can rest during the piano introduction.
- String orchestra (violins 1, violins 2, violas, cellos, double basses): chorale-like, every part singable, inner voices moving by step with passing notes; cellos and basses in octaves.
- String quartet: the cello carries the bass line with the piece's own rhythm (for a waltz: bass on beat 1, often pizzicato); violin 2 and viola share the off-beat chords or a flowing inner figure; violin 1 leads, handing the melody to viola or cello for a phrase now and then.

Winds (for example piccolo or flute, flute, horn, bassoon)
- The top instrument has the melody; the others hold harmony in half and whole notes with occasional moving lines; mark breaths at phrase ends.

Notation habits (always include them)
- A tempo or character marking at the start (Adagio, Grave, Allegro, or Q:1/4=72).
- Dynamics at the start of each part and at every new section (!mp! !mf! !f! !ff!), crescendo and diminuendo hairpins in lyrical lines (!<(! !<)! and !>(! !>)!).
- Slurs over melodic phrases, staccato dots on ostinato and dance accompaniment, accents (!>!) on rhythmic hits, a fermata (!fermata!) on the final chord, "^rit." above the bar where the music slows down.

Examples of the style, in ABC (4 bars each)

Strings, chorale texture with moving inner voices and a chromatic bass:
X:1
T:Tumankuqja — string orchestra
M:3/4
L:1/8
K:Bb
%%score V1 V2 V3 V4 V5
V:V1 clef=treble name="Violins 1"
V:V2 clef=treble name="Violins 2"
V:V3 clef=alto name="Violas"
V:V4 clef=bass name="Violoncellos"
V:V5 clef=bass name="Contrabasses"
[V:V1] f2 g4 | d4 c2 | f2 f3 e | d4 c2 |
[V:V2] B4 G2 | F4 E2 | F A B3 A | B2 A G2 A |
[V:V3] D6 | D2 B,2 G,2 | A,2 B, C D F | F D C =B, _B,2 |
[V:V4] B,,6 | A,,4 B,,2 | C,2 D,3 C, | D,2 ^F, G, =E,2 |
[V:V5] B,,,6 | A,,,4 B,,,2 | C,,2 D,,3 C,, | D,,2 ^F,, G,, =E,,2 |

Flute and piano, block chords in the right hand and a wide left-hand arpeggio:
X:1
T:The Muse and The Lover — flute and piano
M:3/4
L:1/8
K:F
%%score V1 V2 V3
V:V1 clef=treble name="Flute"
V:V2 clef=treble name="Piano RH"
V:V3 clef=bass name="Piano LH"
[V:V1] d2 f d'2 c' | g4 f g | a2 g b2 f | d4 A c |
[V:V2] [DFAd]3 [DFAd]3 | [G,CEG]3 [G,CEG]3 | [A,CEA]3 [B,DFB]3 | [DFBd]3 [A,DFA]3 |
[V:V3] D,, A,, D, F, A, C | C,, G,, C, E, G, C | F,, C, F, G,, D, G, | B,, F, B, F, D, F, |

Piano and strings, ostinato doubled by violin 1 with sustained, descending inner strings:
X:1
T:Carol of the Bells — piano and strings
M:3/4
L:1/8
K:Gm
%%score V1 V2 V3 V4 V5
V:V1 clef=treble name="Violin 1"
V:V2 clef=treble name="Violin 2"
V:V3 clef=alto name="Viola"
V:V4 clef=treble name="Piano RH"
V:V5 clef=treble name="Piano LH"
[V:V1] b2 a b g2 | b2 a b g2 | b2 a b g2 | b2 a b g2 |
[V:V2] c6 | B6 | A6 | G6 |
[V:V3] G6 | F6 | E6 | D6 |
[V:V4] b2 a b g2 | b2 a b g2 | b2 a b g2 | b2 a b g2 |
[V:V5] z2 d2 c d | B2 d2 c d | B2 d2 c d | B2 d2 c d |`;
