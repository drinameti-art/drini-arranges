import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/drini/TopBar";
import { CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/drini/Legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · DriniArranges" },
      { name: "description", content: "What DriniArranges stores and what is sent to create your arrangements." },
      { property: "og:title", content: "Privacy · DriniArranges" },
      { property: "og:description", content: "What DriniArranges stores and what is sent to create your arrangements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const en: LegalSection[] = [
  { h: "What we keep", p: ["DriniArranges does not have user accounts yet. Your arrangements, settings, language choice and free-arrangement count are saved only in your own browser (local storage). Clearing your browser data deletes them."] },
  { h: "What is sent to process your request", p: ["When you ask Drini for an arrangement, your description, your chosen settings, and any uploaded file (sheet music, photo or PDF) or recorded melody are sent to our AI provider through Lovable's AI gateway to create the arrangement. Recordings are turned into notes in your browser; the audio itself is not uploaded.", "We do not sell your data, and we do not use your uploads for anything other than creating and revising your arrangements."] },
  { h: "Hosting", p: ["The app is hosted by Lovable. Like most websites, the hosting service may keep technical logs (such as IP address and browser type) for security and to keep the service running."] },
  { h: "Playback sounds", p: ["Playback sounds are served with the app. If they cannot load, the app may fetch backup sounds from a public sound library on GitHub Pages."] },
  { h: "Your choices", p: ["You can delete saved arrangements in My scores, or clear all data by clearing this site's data in your browser. For any privacy question or request, write to " + CONTACT_EMAIL + "."] },
  { h: "Changes", p: ["When accounts and payments arrive, this policy will be updated to explain what is stored and why."] },
];

const sq: LegalSection[] = [
  { h: "Çfarë ruajmë", p: ["DriniArranges ende nuk ka llogari përdoruesish. Aranzhimet, cilësimet, gjuha dhe numri i aranzhimeve falas ruhen vetëm në shfletuesin tënd (local storage). Nëse i fshin të dhënat e shfletuesit, ato fshihen."] },
  { h: "Çfarë dërgohet për kërkesën tënde", p: ["Kur i kërkon Drinit një aranzhim, përshkrimi, cilësimet dhe çdo skedar i ngarkuar (partiturë, foto ose PDF) apo melodia e incizuar dërgohen te ofruesi ynë i AI-së përmes portës së AI-së të Lovable për të krijuar aranzhimin. Incizimet kthehen në nota brenda shfletuesit; vetë audio nuk ngarkohet.", "Nuk i shesim të dhënat e tua dhe nuk i përdorim skedarët e ngarkuar për asgjë tjetër përveç krijimit dhe ndryshimit të aranzhimeve të tua."] },
  { h: "Hostimi", p: ["Aplikacioni hostohet nga Lovable. Si shumica e faqeve, shërbimi i hostimit mund të mbajë regjistra teknikë (si adresa IP dhe lloji i shfletuesit) për siguri dhe funksionim."] },
  { h: "Tingujt e riprodhimit", p: ["Tingujt e riprodhimit shërbehen bashkë me aplikacionin. Nëse nuk ngarkohen, aplikacioni mund të marrë tinguj rezervë nga një bibliotekë publike tingujsh në GitHub Pages."] },
  { h: "Zgjedhjet e tua", p: ["Mund t'i fshish aranzhimet e ruajtura te Partiturat e mia, ose të gjitha të dhënat duke i fshirë të dhënat e kësaj faqeje në shfletues. Për çdo pyetje apo kërkesë për privatësinë, shkruaj në " + CONTACT_EMAIL + "."] },
  { h: "Ndryshime", p: ["Kur të vijnë llogaritë dhe pagesat, kjo politikë do të përditësohet për të shpjeguar çfarë ruhet dhe pse."] },
];

function Privacy() {
  return (
    <PageShell>
      <LegalPage title={{ en: "Privacy", sq: "Privatësia" }} en={en} sq={sq} />
    </PageShell>
  );
}
