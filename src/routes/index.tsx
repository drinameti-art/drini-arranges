import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, AtSign, FileMusic, Mic, Pause, PenLine, Play, Check } from "lucide-react";
import { PageShell } from "@/components/drini/TopBar";
import { LogoMark, Spark } from "@/components/drini/Logo";
import { ScoreSheet, type ScoreSheetHandle } from "@/components/drini/ScoreSheet";
import { DEMOS } from "@/components/drini/demo";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DriniArranges — your music, arranged" },
      { name: "description", content: "Describe a piece, hum a melody or upload sheet music, and Drini writes a real, playable score for your ensemble, in the style of arranger Drin Ameti." },
      { property: "og:title", content: "DriniArranges — your music, arranged" },
      { property: "og:description", content: "Describe a piece, hum a melody or upload sheet music, and Drini writes a real, playable score for your ensemble." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

// Before/after example: the "Ode to Joy" melody alone, and Drini's string quartet of it (public-domain melody).
const MELODY = DEMOS["lead"]!.abc.replace(/"[^"]*"/g, "").replace(/^T:.*$/m, "T:Ode to Joy — melody");
const QUARTET = DEMOS["quartet"]!.abc;
const HERO = DEMOS["pianostrings"]!.abc;

/** A score with its own Play button (only one plays at a time on the page). */
function ExamplePlayer({ abc, label, dark = false }: { abc: string; label: string; dark?: boolean }) {
  const sheet = useRef<ScoreSheetHandle>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const { t } = useLang();
  const toggle = async () => {
    if (playing) { sheet.current?.stop(); setPlaying(false); setProgress(0); return; }
    setPlaying(true);
    await sheet.current?.play();
  };
  return (
    <div className={`overflow-hidden rounded-[20px] border ${dark ? "border-primary/30" : "border-border"} bg-paper shadow-sm`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="font-display text-base font-semibold text-ink">{label}</p>
        <button onClick={toggle} className="btn btn-primary min-h-9 px-3 text-xs" aria-pressed={playing}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{playing ? t("score.pause") : t("score.play")}
        </button>
      </div>
      <div className="h-1 bg-beige"><div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress * 100}%` }} /></div>
      <div className="score-scroll max-h-[360px] overflow-auto px-2 py-3">
        <div className="min-w-[560px]">
          <ScoreSheet ref={sheet} abc={abc.replace(/^T:.*\n/gm, "")} onProgress={setProgress} follow={false} onEnded={() => { setPlaying(false); setProgress(0); }} />
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { lang } = useLang();
  const L = (en: string, sq: string) => (lang === "sq" ? sq : en);

  const ways = [
    { icon: PenLine, title: L("Describe it", "Përshkruaje"), text: L("“Waltz for string quartet in D minor” — Drini writes it.", "“Vals për kuartet harqesh në D mol” — Drini e shkruan.") },
    { icon: Mic, title: L("Hum it", "Këndoje"), text: L("Sing or play a melody into your phone; Drini turns it into notes.", "Këndo ose luaj një melodi në telefon; Drini e kthen në nota.") },
    { icon: FileMusic, title: L("Upload it", "Ngarkoje"), text: L("A photo, a PDF or a MuseScore file of your music.", "Një foto, PDF ose skedar MuseScore të muzikës sate.") },
  ];
  const ensembles = [
    L("String quartet", "Kuartet harqesh"), L("Piano + strings", "Piano + harqe"), L("String orchestra", "Orkestër harqesh"), L("SATB choir", "Kor SATB"),
    L("SA choir + piano", "Kor SA + piano"), L("Solo piano", "Piano solo"), L("Piano 4 hands", "Piano me 4 duar"), L("Flute + piano", "Flaut + piano"),
    L("Wind quartet", "Kuartet frymorësh"), L("Guitar", "Kitarë"), L("Lead sheet", "Lead sheet"),
  ];
  const plans = [
    { name: L("Free", "Falas"), price: "€0", n: 3 },
    { name: "Pro", price: "€29.99", n: 15, best: true },
    { name: "Studio", price: "€59.99", n: 30 },
  ];

  return (
    <PageShell>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-border">
        <svg className="pointer-events-none absolute inset-x-0 top-24 h-24 w-full text-primary/10" preserveAspectRatio="none" viewBox="0 0 100 24" aria-hidden>
          {[2, 7, 12, 17, 22].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" strokeWidth="0.25" />)}
        </svg>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="label-caps text-primary">DriniArranges</p>
            <h1 className="mt-4 text-5xl leading-[1.04] text-ink md:text-6xl">
              {L("Your music,", "Muzika jote,")}<br /><em className="font-normal text-primary">{L("arranged.", "e aranzhuar.")}</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-graphite">
              {L(
                "Describe a piece, hum a melody or upload sheet music. Drini, your AI arranger, writes a real score for your ensemble that you can play, change and download.",
                "Përshkruaj një pjesë, këndo një melodi ose ngarko partiturën. Drini, aranzhuesi yt me AI, shkruan një partiturë të vërtetë për ansamblin tënd që mund ta luash, ndryshosh dhe shkarkosh.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/studio" className="btn btn-primary h-12 px-6 text-base"><Spark />{L("Arrange your first piece", "Aranzho pjesën e parë")}</Link>
              <a href="#example" className="btn btn-ghost h-12 px-6 text-base">{L("Hear an example", "Dëgjo një shembull")}</a>
            </div>
            <p className="mt-4 text-sm text-graphite">{L("Free: 3 arrangements a month. No card needed.", "Falas: 3 aranzhime në muaj. Pa kartelë.")}</p>
          </div>
          <div className="lg:pl-4">
            <ExamplePlayer abc={HERO} label={L("Ode to Joy — piano + strings", "Oda e Gëzimit — piano + harqe")} />
          </div>
        </div>
      </section>

      {/* three ways */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="text-center text-4xl text-ink">{L("Start from anything", "Fillo nga çdo gjë")}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ways.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card-paper p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-2xl text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-graphite">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* before / after */}
      <section id="example" className="scroll-mt-6 border-y border-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="text-center text-4xl text-ink">{L("From a melody to a full score", "Nga një melodi te partitura e plotë")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-graphite">
            {L("Press play on both: the tune on its own, then Drini's arrangement for string quartet.", "Shtyp Luaj te të dyja: melodia vetëm, pastaj aranzhimi i Drinit për kuartet harqesh.")}
          </p>
          <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="label-caps mb-2">{L("Before", "Para")}</p>
              <ExamplePlayer abc={MELODY} label={L("The melody", "Melodia")} />
            </div>
            <div>
              <p className="label-caps mb-2 text-primary">{L("After", "Pas")}</p>
              <ExamplePlayer abc={QUARTET} label={L("Drini's string quartet", "Kuarteti i Drinit")} dark />
            </div>
          </div>
        </div>
      </section>

      {/* ensembles and what you get */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-4xl text-ink">{L("For every ensemble", "Për çdo ansambël")}</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {ensembles.map((e, i) => (
              <span key={e} className={`pill min-h-10 px-4 text-sm ${i % 4 === 0 ? "bg-primary text-primary-foreground" : "bg-beige text-ink"}`}>{e}</span>
            ))}
          </div>
        </div>
        <ul className="space-y-4 self-center">
          {[
            L("Real notation: correct ranges, voice leading and beaming, checked automatically", "Notacion i vërtetë: regjistra, lidhje zërash dhe grupim notash të sakta, të kontrolluara automatikisht"),
            L("Play it with real instrument sounds, practise with tempo, loop and mute", "Luaje me tinguj të vërtetë instrumentesh, ushtro me tempo, përsëritje dhe heshtje zërash"),
            L("Ask Drini for changes in plain words, and go back to any draft", "Kërkoji Drinit ndryshime me fjalë të thjeshta dhe kthehu te çdo draft"),
            L("Download the score and a part for every player: PDF, MIDI, MusicXML", "Shkarko partiturën dhe pjesën e çdo instrumentisti: PDF, MIDI, MusicXML"),
          ].map((f) => (
            <li key={f} className="flex gap-3 text-ink">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/90 text-ink"><Check className="h-3.5 w-3.5" /></span>
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* about Drin */}
      <section className="border-y border-border bg-ink text-cream dark:bg-paper dark:text-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[auto_1fr]">
          <div className="flex h-36 w-36 items-center justify-center rounded-[32px] bg-primary shadow-lg">
            <LogoMark className="h-20 w-20" />
          </div>
          <div>
            <p className="label-caps text-gold">{L("The arranger behind Drini", "Aranzhuesi pas Drinit")}</p>
            <h2 className="mt-3 text-4xl">Drin Ameti</h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed opacity-80">
              {L(
                "Music teacher, pianist and arranger from Kosovo. Drin studied musicology at AAB College, is completing a master's in music pedagogy at the University of Prishtina, and has arranged for the music school in Ferizaj. Drini follows rules measured note by note from more than 20 of his own arrangements: his harmony, his voice leading, his textures and the way his scores look.",
                "Mësues muzike, pianist dhe aranzhues nga Kosova. Drini ka studiuar muzikologji në Kolegjin AAB, po përfundon masterin në pedagogji muzikore në Universitetin e Prishtinës dhe ka aranzhuar për shkollën e muzikës në Ferizaj. Drini ndjek rregulla të matura notë për notë nga më shumë se 20 aranzhime të tij: harmoninë, lidhjen e zërave, teksturat dhe pamjen e partiturave të tij.",
              )}
            </p>
            <a href="https://instagram.com/driniarranges" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-sm font-medium opacity-90 hover:opacity-100">
              <AtSign className="h-4 w-4" />driniarranges on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* prices */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="text-center text-4xl text-ink">{L("Simple prices", "Çmime të thjeshta")}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`card-paper p-6 ${p.best ? "border-primary/50 shadow-md" : ""}`}>
              <p className="font-display text-xl font-semibold text-ink">{p.name}</p>
              <p className="mt-3 text-4xl font-semibold text-ink">{p.price}<span className="text-base font-normal text-graphite">{L(" / month", " / muaj")}</span></p>
              <p className="mt-2 text-graphite">{L(`${p.n} arrangements a month`, `${p.n} aranzhime në muaj`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/pricing" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">{L("See what each plan includes", "Shih çfarë përfshin çdo paketë")}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* final call */}
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div className="rounded-[28px] bg-primary px-6 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="text-4xl md:text-5xl">{L("What will you arrange first?", "Çfarë do të aranzhosh i pari?")}</h2>
          <Link to="/studio" className="btn mt-8 h-12 bg-cream px-6 text-base text-primary hover:bg-paper"><Spark />{L("Open the Studio", "Hap Studion")}</Link>
        </div>
      </section>
    </PageShell>
  );
}
