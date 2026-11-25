# Drini Arranges

Build the first version (front end with sample data) of **DriniArranges**, an AI sheet-music arranging app. "Drini" is the AI assistant: users describe a piece in text, or hum/upload a melody, and Drini writes a real score they can play and download. In this first version, use realistic sample data and placeholder actions. No real AI or backend yet. Make it look finished and polished.

## Brand (follow exactly)
- Look: classical, elegant "manuscript" feel. Warm and calm, not techy. No gradients, no emoji, no glassmorphism.
- Colours:
  - Burgundy (primary) #7B1F3A, hover #5A1529
  - Ink (text, dark panels) #17162B
  - Note gold (accent only, never for body text) #E2B04A
  - Manuscript (app background) #F6F1E7
  - Paper (cards) #FFFDF8
  - Soft beige (active nav, tab track) #F1E8D8
  - Borders #E4DCCB / input borders #D9CFBC
  - Graphite (secondary text) #5C5868
- Fonts (Google Fonts): **Fraunces** (600/400) for headings, the logo and score titles; **Inter** for all UI text.
- Radii: cards 20px, inputs and buttons 10–12px, pills 999px. Touch targets at least 44px.
- Logo (use this exact inline SVG, viewBox 0 0 64 64). It shows a D drawn as manuscript paper: staff lines inside, a gold note and a small spark.
```
<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#7B1F3A"/><path d="M19 14h11a18 18 0 0 1 0 36H19z" fill="none" stroke="#F6F1E7" stroke-width="3.5" stroke-linejoin="round"/><path d="M23 26h18M23 32h21M23 38h18" stroke="#F6F1E7" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/><ellipse cx="32" cy="35" rx="4.6" ry="3.4" transform="rotate(-22 32 35)" fill="#E2B04A"/><path d="M36.2 33.6V20" stroke="#E2B04A" stroke-width="1.8" stroke-linecap="round"/><path d="M50 12l1.4 3.6L55 17l-3.6 1.4L50 22l-1.4-3.6L45 17l3.6-1.4z" fill="#E2B04A"/></svg>
```
  The wordmark sits next to it: "Drini" in Fraunces 600 ink, followed directly by "Arranges" in Fraunces 400 burgundy. Use the same SVG as the favicon.

## Main page: Studio (desktop, three columns that stack on mobile)
**Top bar** (paper background, bottom border): logo + wordmark; nav links Studio (active, beige pill), My scores, Templates, Pricing; on the right "7 arrangements left" in graphite, an outlined burgundy "Upgrade" button, and an ink avatar circle with "DA".

**Left sidebar** (~240px): an ink "New arrangement" button with a plus icon; a "RECENT" label; a list of arrangement cards, each with a title and a meta line:
- Folk melody, piano 4 hands (Today · G major · Easy), selected
- Hummed theme, string quartet (Yesterday · D minor)
- Children's choir, SA + piano (Mon · F major)
- Pop ballad, solo guitar (Nov 20 · E major)

**Centre column, card 1 "What should Drini arrange?"** (Fraunces heading):
- A segmented control with two tabs: "Describe in text" and "Upload or hum audio".
- Text tab: a labelled textarea ("Describe the piece, the instruments and the feel"), prefilled with: "Turn my folk melody into an easy piano duet, 4 hands, for two sisters. Keep the secondo simple, gentle and flowing, about 2 minutes."
- Audio tab: a dashed drop zone with a round burgundy mic "Record" button, an animated waveform made of thin burgundy bars, and the text "melody_hum.m4a · 0:42 — Drop a file or press record. A single melody works best."
- Four labelled selects in a row:
  - Ensemble: Piano 4 hands, Solo piano, String quartet, SATB choir, Guitar
  - Level: Easy, Intermediate, Advanced
  - Key: G major, Keep original, C major, D minor
  - Style: Lyrical, Classical, Pop, Jazz, Folk
- Footer row: "Output: score + parts · PDF · MusicXML · MIDI" on the left, and on the right a burgundy primary button "Arrange with Drini" with a small gold four-point spark icon. Clicking it shows a short "Drini is arranging…" loading state, then reveals or refreshes the score card.

**Centre column, card 2, the score:**
- Title "Folk melody — Piano 4 hands", meta "Arranged by Drini · G major · 4/4 · 32 bars · Draft 2".
- Buttons: Play/Pause toggle, Transpose, MusicXML, and an ink "Export PDF".
- A real rendered score using **abcjs**: a sample 8-bar piano duet in G major with two staves (Primo treble, Secondo bass). Primo plays a simple flowing folk melody in quarter notes; Secondo plays half notes on G and D (tonic and dominant). Wire the Play button to abcjs synth playback if it's easy.
- A faint burgundy highlight on bar 3 labelled "Bar 3 · Drini's note".
- Status pills under the score: green "Ranges checked", green "No parallel 5ths / 8ves", amber "Bar 3: wide leap in primo".

**Right column: Drini chat panel** (ink #17162B background, cream text, 20px radius):
- Header: a burgundy square with a gold spark, "Drini" and "Your arranging assistant".
- User bubble: "Make it easy for the younger sister on secondo."
- Drini bubble: "Done. The secondo now plays half notes on the tonic (I) and dominant (V) bass notes, with no hand position changes in the first 8 bars. The primo has an upward leap of a sixth in bar 3. Should I smooth it with a passing note?"
- Quick-reply pills: "Yes, smooth it", "Keep the leap", "Add fingering".
- Input at the bottom: "Ask Drini to change something…" with a burgundy send button. Sent messages appear in the chat, followed by a canned Drini reply.

## Mobile (below 768px)
The studio stacks. Also add a dedicated route **/record**, a phone-first "Hum your melody" screen:
- A back button; a big Fraunces title "Hum your melody"; the subtitle "Sing, hum or play one line. Drini turns it into notes."
- A large round burgundy record button inside two soft concentric burgundy rings. It toggles between recording (stop square, "0:18", "Listening…") and done (mic icon, "0:42", "Recording saved · tap to redo").
- A waveform made of thin bars.
- A "NOTES HEARD" card with note chips G A B D C B A G and "Likely key: G major · about 96 BPM".
- "ARRANGE FOR" pills: Piano (selected, ink), Choir, Strings, Guitar.
- A full-width burgundy "Arrange with Drini" button at the bottom.

## Other pages
Make My scores (a grid of score cards), Templates (cards like "Piano duet for students", "SATB hymn", "String quartet wedding") and Pricing (Free / Pro / Studio tiers with [PRICE] placeholders) as simple, polished pages in the same style.

Keep the code clean, with components for Logo, ScoreCard, DriniChat, ArrangeForm and Waveform, so the real AI can be plugged in later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c59350f-ac4f-434e-8868-bde652ff4126).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
