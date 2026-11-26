// Drini's house style, measured from Drin Ameti's own arrangements (DriniArranges):
// Carol of the Bells and Habanera (2 violins, viola, piano), Schindler's Theme (same),
// Himni i Kosovës and Tumankuqja (string orchestra), Yesterday (wind quartet),
// The Muse and The Lover (flute and piano) and a piano nocturne.
// Every number below comes from analysing those eight scores note by note
// (harmony per beat, voice motion on an eighth-note grid, ranges, roles per bar, markings).
// Short excerpts are only from traditional / public-domain melodies or Drin's own music.

export const DRINI_STYLE = `HOUSE STYLE: write like Drin Ameti (DriniArranges). These rules were measured from his own scores. Follow them unless the user asks for something else.

1. FORM AND PLAN
- Introduction: start with the accompaniment alone before the melody enters. Drin's intros are 1–4 bars of bass or ostinato (Habanera: the left-hand rhythm alone for 3 bars; Schindler's Theme: piano alone for 4 bars), up to 8 bars when the ostinato is the main idea (Carol of the Bells).
- Build in layers. Add one part every 4 bars, each with its own dynamic marking. Carol: piano bars 1–8, violin 1 enters bar 9, violin 2 bar 13, viola bar 17. Schindler: piano, viola bar 5, violin 1 bar 15, violin 2 bar 26.
- Pass the melody around in 4–8 bar units, never in the middle of a phrase. A typical path is piano, then viola (low and warm), then violin 1, then violin 2 for a contrast phrase, then violin 1 again for the climax.
- Climax at about 65–80% of the piece: the most parts play together, the melody is doubled in octaves, and the dynamic reaches f–ff (fff with sfz hits in dramatic pieces). Then drop back (mf or p) for the last phrase or two and close strongly or softly according to the piece.
- Vary the texture when material repeats instead of inventing new notes: on a repeat, change who has the melody, add a doubling or countermelody, or change the accompaniment figure.
- Ending: a clear final cadence, the last chord held with a fermata on every part, rit. in the bar or two before it. In slow pieces, soften the end with a suspension (4–3) or a held added-sixth or ninth.

2. HARMONY
- Functional and diatonic at heart (I/i, IV/iv, V/V7 carry the phrases), coloured with seventh chords. In piano and string arrangements, 50–70% of chords carry a seventh or added note: maj7 on III and VI in minor and on I and IV in major, m7 on i, ii and iv, V7, iiø7 in minor. In anthems, hymns and children's songs keep plain triads (Himni: 84% triads).
- Harmonic rhythm: 1–2 chords per bar in dances and lyrical songs (Habanera 1.8, Yesterday 1.7, The Muse 1.1), 2.5–3 in chorales, anthems and dense piano writing (Himni 2.9, Schindler 3.1). Change the chord on strong beats.
- Bass position, measured per beat: root position about half the time (40–68%), first inversion 15–34%, seventh in the bass (third inversion) 7–18%, and six-four chords about 10–20%, used almost only as passing or arpeggio six-fours and as the cadential six-four before V. Slow string writing uses first inversion as often as root position to make the bass line move by step (Tumankuqja: 31% root, 31% first inversion).
- Write the bass as a line: stepwise descents through inversions (i, VII6 or v6, VI, V), chromatic steps (B natural to B flat, F sharp to F), and pedal points under changing harmony (tonic pedal in Habanera, dominant pedal before returns).
- Colour chords he likes: secondary dominants (V/IV, V/VI, V/III, V/V; 4–9 per piece), add9 and sus4 chords at phrase ends and in ostinato sections, the raised sixth degree in minor (melodic minor), and a turn to the parallel major for a contrasting section or the ending (Habanera moves from D minor to D major).
- Cadences: on V (half cadence) at the end of 4-bar antecedent phrases, V–I or V7–i at 8 and 16 bars and at the end. Also use plagal (iv–i, IV–I) and VI–i or iv–i approaches as softer modern endings. Use a deceptive V–VI once in a longer piece before the final cadence.
- Chord voicing: double the root by preference, then the third in inner voices (anthem: root 36, third 23, fifth 17 times). Drop the fifth before the third. Keep sevenths and leading tones single.

3. VOICE LEADING AND COUNTERPOINT
- Outer voices (melody against bass): mostly oblique motion (40–60%, one voice holds while the other moves), contrary motion 15–37%, similar motion 20–33%, and true parallel motion at most 7%. Parallel fifths between melody and bass essentially never happen (0–3 in a whole piece). Parallel octaves only as a deliberate doubling of the melody, never between two independent lines.
- Melody against bass on strong beats: octaves or unisons 25–40%, thirds or tenths 15–30%, sixths 15–35%, fifths 10–29%. Dissonant intervals on the beat only as prepared suspensions or appoggiaturas that resolve by step.
- Melody notes: 81–100% are chord tones on the beat; decorate with passing notes (5–14%), neighbour notes and a few appoggiaturas, all resolving by step.
- Inner voices move mostly by step or repeated note (string orchestra: 57–73% steps, inner leaps rarely larger than a fourth). After a leap larger than a fourth, move back by step.
- Violin 2 below violin 1 in parallel thirds or sixths, in the same rhythm, is a signature sound (Schindler: 57% thirds; Carol: 46% thirds and sixths, 87% same rhythm). Violin 2 and viola together often move in sixths and thirds (Schindler: 54% sixths).
- Countermelodies move when the melody holds and rest or hold when the melody moves (complementary rhythm).
- No voice crossing between string or wind parts. The piano right hand may cross above or below the strings.
- Spacing: adjacent upper parts a third to a sixth apart (seldom more than an octave). The widest gap is between the bass and the part above it. Cello and double bass always an octave apart.

4. RANGES (sounding pitch) — Drin's measured ranges
- Violin 1: core Bb4–D6, whole range D4–A5 on the staff plus a little above. Violin 2: core G4–C6, range C4–E6. Viola (alto clef): core Bb3–D5, range D3–C5. Cello: core G2–C4, range D2–D4. Double bass: core G1–C3 sounding; write it at written pitch, an octave above the sound, so it usually shows the same notes as the cello line (bass clef E2–D4 on the page).
- Flute: core G4–A5, range D4–D6. Piccolo: core F5–E6 sounding; write it at written pitch, an octave below the sound (on the page F4–E5). Horn: core A3–F4 (concert pitch). Bassoon: core D3–Bb3, range C3–C4.
- Piano right hand: core D4–B5. Left hand: core Eb2–D4, lowest notes about A1 only for bass octaves at climaxes.
- Choir: soprano C4–G5, alto G3–D5, tenor C3–G4, bass E2–C4. Guitar E2–B5 written.
- Keep every part on its own staff (see the staff rule). If a melody climbs too high for violin 1, take it down an octave or give it to the piano right hand. Do not stretch the part.

5. TEXTURE AND ROLES BY ENSEMBLE (measured share of bars)
- Two violins, viola and piano (Carol, Habanera, Schindler): violin 1 has the melody 45–85% of the time. Violin 2 plays the melody in thirds or sixths (15–22%), a countermelody (14–20%), a repeated-note or off-beat pulse (4–27%) or short sustained harmony. The viola doubles the melody an octave lower (18–26%; with violin 1 an octave apart 43–63% in tutti sections), plays a countermelody (11–27%) or the inner pulse. The piano left hand is the bass line almost all the time (97%). The piano right hand doubles the melody (11–45%), plays block chords (15–30%) or broken-chord figuration under the strings (59% in Schindler). The strings rest during the piano introduction.
- String orchestra (Himni, Tumankuqja): violins 1 melody 100%. Violins 2 and violas mix sustained harmony (40–76%) with moving lines and short parallel-third passages. Cellos alternate between countermelody (35–44%) and harmony. Basses play the bass line, always the cello line an octave lower. Chorale texture, every part singable, all parts mostly in the same rhythm (58–88%).
- Flute and piano (The Muse): flute melody, piano right hand doubling it at the unison or octave (66%) or block chords spanning an octave, left hand flowing broken chords. The piano plays the melody alone in the introduction.
- Wind quartet (Yesterday: piccolo, flute, horn, bassoon): the top instrument has the melody. Flute and horn hold harmony in half and whole notes (about 1/3 of the time) with short moving lines (16–19%). The bassoon is the bass line in half notes. Breath marks at every phrase end.
- String quartet (no piano): violin 1 leads, sometimes handing a phrase to viola or cello. Violin 2 plays thirds and sixths under violin 1 or off-beat chords with the viola. The cello carries the bass in the piece's own rhythm (waltz: beat 1, often pizzicato).
- Solo piano (Nocturne): right hand melody 100%, left hand broken-chord figuration 86%.

6. ACCOMPANIMENT FIGURES (copy these shapes)
- Left-hand broken chord in eighths, open spacing from the bass: root, fifth, tenth, fifth (D2 A2 F3 A2), measured as the most common bar in Schindler (0-7-15-7), The Muse (0-7-12-7-16-7 in 3/4) and the Nocturne (0-7-16-19-24 rising over two octaves).
- Habanera and tango: the dance rhythm in the left hand (dotted eighth, sixteenth, two eighths) on root, fifth, tenth, fifth. Right hand with light off-beat dyads in thirds and sixths, strings with pizzicato off-beats.
- Waltz (3/4): bass on beat 1, chords on beats 2 and 3, or a flowing root–fifth–tenth broken chord in eighths.
- Ostinato pieces (Carol): left hand octave on the beat with the fifth in between (G1+G2, D2, G1+G2 in the rhythm dotted quarter, eighth, quarter). The right hand and violins repeat the ostinato with staccato.
- Right hand under a soloist: block chords on the main beats spanning an octave (the melody note doubled an octave lower with chord tones between). Or sixteenth-note broken-chord figuration in the middle register, under a string melody.
- Never sit on a held note for more than two bars in an accompanying part (pads only briefly, for colour). Keep a figure going and keep it consistent within a section. Change the figure at a new section.
- When arranging the user's own piece, keep its accompaniment pattern and character and carry it into the new instruments.
- Easy level keeps these shapes but simplifies them: single bass notes or root–fifth, one-octave span, no octave doubling in the right hand.

7. DYNAMICS AND ARTICULATION (how his scores are marked)
- Every part gets a dynamic at its first entry, and every new section gets new dynamics in all playing parts. Open mp or mf. Grow by sections (mp → mf → f → ff) toward the climax.
- Lyrical lines: crescendo and diminuendo hairpins over phrases (Schindler has 37, Habanera 18). Rhythmic pieces: sfz accents on structural hits.
- Slurs over every melodic phrase and legato figure (Habanera 151, Schindler 107). Staccato on ostinatos, off-beat chords and dance accompaniment (Carol 257, Habanera 405). Accents (!>!) on rhythmic hits and syncopations.
- Strings: pizz. and arco changes in dance pieces (Habanera alternates them about 10 times), "vib." on expressive long notes. Winds: breath marks (!breath!) at phrase ends. Piano: pedal for broken-chord accompaniment (write "^Ped." at the start of a section), arpeggiated chords (!arpeggio!) in lyrical pieces.
- Tempo at the start as a metronome mark (Q:1/4=72) or an Italian word (Adagio, Grave, Allegro), rit. before the end, a fermata on the final chord in all parts.

8. APPEARANCE OF THE SCORE (Drin's layout)
- Header: the title (T:), a second T: line as the subtitle naming the ensemble ("For Piano and Strings", "Wind Quartet", "for String Orchestra"; in Albanian, for example "Për 2 Violinë, Violë dhe Piano"), the original composer as C: when known, and a second C: line "arr. DriniArranges".
- Part names in full, in score order from high to low: woodwinds (piccolo, flute, oboe, clarinet, bassoon), horn, then strings (violin 1, violin 2, viola, cello, double bass), with piano at the bottom of chamber scores. Use names like "Violin 1", "Viola", "Violoncello", "Piano".
- Group parts with %%score: strings and winds in a bracket [ ], the two piano staves in a brace { }. Example: %%score [V1 V2 V3] {RH LH}.
- Clefs: violins, flute, piccolo, horn, piano right hand treble. Viola alto. Cello, bassoon, double bass and piano left hand bass.
- Clean pages: no multi-measure rests, no editorial text, beamed notes grouped by beat, rests written in every bar of a silent part, the same number of bars in every part.

9. THE STAFF RULE (Drin's explicit instruction): parts must not extend beyond their staff. At most one ledger line above or below (two for piano). In his own scores only violin 1 at a climax goes higher, and Drini does not do that.

Examples of the style, in ABC (4 bars each)

Strings, chorale texture with moving inner voices and a chromatic bass:
X:1
T:Tumankuqja
T:for String Orchestra
C:Drin Ameti
M:3/4
L:1/8
Q:1/4=35
K:Bb
%%score [V1 V2 V3 V4 V5]
V:V1 clef=treble name="Violins 1"
V:V2 clef=treble name="Violins 2"
V:V3 clef=alto name="Violas"
V:V4 clef=bass name="Violoncellos"
V:V5 clef=bass name="Contrabasses"
[V:V1] !mf! f2 g4 | d4 c2 | f2 f3 e | d4 c2 |
[V:V2] !mf! B4 G2 | F4 E2 | F A B3 A | B2 A G2 A |
[V:V3] !mf! D6 | D2 B,2 G,2 | A,2 B, C D F | F D C =B, _B,2 |
[V:V4] !mf! B,,6 | A,,4 B,,2 | C,2 D,3 C, | D,2 ^F, G, =E,2 |
[V:V5] !mf! B,,6 | A,,4 B,,2 | C,2 D,3 C, | D,2 ^F, G, =E,2 |

Flute and piano, block chords in the right hand and a wide left-hand arpeggio:
X:1
T:The Muse and The Lover
T:Flute and Piano
C:arr. DriniArranges
M:3/4
L:1/8
Q:"Adagio" 1/4=71
K:F
%%score V1 {V2 V3}
V:V1 clef=treble name="Flute"
V:V2 clef=treble name="Piano RH"
V:V3 clef=bass name="Piano LH"
[V:V1] !mp! (d2 f a2 g | g4 f g | a2 g b2 f | d4) A c |
[V:V2] !mp! [DFAd]3 [DFAd]3 | [CEGc]3 [CEGc]3 | [CEAc]3 [DFBd]3 | [DFBd]3 [CFAc]3 |
[V:V3] D,,A,, D,F, A,C | C,,G,, C,E, G,C | F,,C, F,G,, D,G, | B,,F, B,F, D,F, |

Piano and strings, ostinato with staccato, violins entering in layers:
X:1
T:Carol of the Bells
T:For Piano and Strings
C:Mykola Leontovych
C:arr. DriniArranges
M:3/4
L:1/8
Q:1/2=90
K:Gm
%%score [V1 V2 V3] {V4 V5}
V:V1 clef=treble name="Violin 1"
V:V2 clef=treble name="Violin 2"
V:V3 clef=alto name="Viola"
V:V4 clef=treble name="Piano RH"
V:V5 clef=bass name="Piano LH"
[V:V1] !mp! .B2 .AB .G2 | .B2 .AB .G2 | .B2 .AB .G2 | .B2 .AB .G2 |
[V:V2] z6 | z6 | !mp! .G2 .FG .D2 | .G2 .FG .D2 |
[V:V3] z6 | z6 | z6 | z6 |
[V:V4] .b2 .ab .g2 | .b2 .ab .g2 | .b2 .ab .g2 | .b2 .ab .g2 |
[V:V5] !mp! [G,,G,]3 D, [G,,G,]2 | [G,,G,]3 D, [G,,G,]2 | [F,,F,]3 D, [F,,F,]2 | [E,,E,]3 C, [E,,E,]2 |

Habanera, dance rhythm in the left hand, pizzicato off-beats, violin 1 melody:
X:1
T:Habanera
T:Për 2 Violinë, Violë dhe Piano
C:Georges Bizet
C:arr. DriniArranges
M:2/4
L:1/16
Q:1/4=72
K:Dm
%%score [V1 V2 V3] {V4 V5}
V:V1 clef=treble name="Violin 1"
V:V2 clef=treble name="Violin 2"
V:V3 clef=alto name="Viola"
V:V4 clef=treble name="Piano RH"
V:V5 clef=bass name="Piano LH"
[V:V1] !mp! (d'4 ^c'4 | =c'4 b4 | _b4 a4 | a2g2 f4) |
[V:V2] "^pizz." !mf! z4 .f4 | z4 .f4 | z4 .e4 | z4 .e4 |
[V:V3] "^pizz." !mf! z4 .A4 | z4 .A4 | z4 .G4 | z4 .^C4 |
[V:V4] !mf! z4 .[FA]2.[FA]2 | z4 .[FA]2.[FA]2 | z4 .[EG]2.[EG]2 | z4 .[^CE]2.[^CE]2 |
[V:V5] !mf! D,,3A,, F,2A,,2 | D,,3A,, F,2A,,2 | D,,3A,, G,2A,,2 | A,,3E, ^C2E,2 |`;
