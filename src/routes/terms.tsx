import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/drini/TopBar";
import { CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/drini/Legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use · DriniArranges" },
      { name: "description", content: "How DriniArranges may be used, and who owns the arrangements." },
      { property: "og:title", content: "Terms of use · DriniArranges" },
      { property: "og:description", content: "How DriniArranges may be used, and who owns the arrangements." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Terms,
});

const en: LegalSection[] = [
  { h: "About these terms", p: ["DriniArranges is a web app where Drini, an AI assistant, writes music arrangements from a description, a recording or uploaded sheet music. By using it you agree to these terms. If you do not agree, please do not use the app."] },
  { h: "Your account and plans", p: ["The free plan includes 3 arrangements a month. Paid plans (Pro, €29.99 a month for 15 arrangements; Studio, €59.99 a month for 30) will be offered when payments open. Prices include the arrangements listed for each plan; unused arrangements do not carry over to the next month."] },
  { h: "Music you upload", p: ["You may only upload, describe or record music that you have the right to use: your own compositions, music in the public domain, or music you have permission to arrange. You are responsible for what you upload.", "Do not upload material you are not allowed to copy, share or adapt."] },
  { h: "Arrangements you create", p: ["Arrangements of your own music or of public-domain music are yours to use, print, perform and share. An arrangement of someone else's copyrighted work may need the permission of its rights holder before you perform it in public, record it, publish it or sell it.", "Scores made with DriniArranges carry the label \"© DriniArranges\" at the bottom of the page. Please keep it when you share or print them."] },
  { h: "AI results", p: ["Arrangements are written by an AI and checked automatically, but they can still contain mistakes in notes, ranges, harmony or notation. Check every arrangement before using it in lessons, rehearsals or performances."] },
  { h: "Fair use of the service", p: ["Do not misuse the app: no attempts to get around the free limit, to overload the service, or to use it for anything unlawful."] },
  { h: "No warranty, limited liability", p: ["The app is provided \"as is\", without warranties of any kind. To the extent the law allows, DriniArranges is not liable for indirect losses or for losses caused by using or not being able to use the app."] },
  { h: "Changes and contact", p: ["These terms may change as the app grows; the date at the top shows the latest version.", `Questions: ${CONTACT_EMAIL}`] },
];

const sq: LegalSection[] = [
  { h: "Për këto kushte", p: ["DriniArranges është një aplikacion ku Drini, një asistent me inteligjencë artificiale, shkruan aranzhime muzikore nga një përshkrim, një incizim ose partitura e ngarkuar. Duke e përdorur, pranon këto kushte. Nëse nuk i pranon, të lutem mos e përdor aplikacionin."] },
  { h: "Llogaria dhe paketat", p: ["Paketa falas përfshin 3 aranzhime në muaj. Paketat me pagesë (Pro, 29,99 € në muaj për 15 aranzhime; Studio, 59,99 € në muaj për 30) do të ofrohen kur të hapen pagesat. Aranzhimet e papërdorura nuk kalojnë në muajin tjetër."] },
  { h: "Muzika që ngarkon", p: ["Mund të ngarkosh, përshkruash ose incizosh vetëm muzikë që ke të drejtë ta përdorësh: kompozimet e tua, muzikë në domenin publik ose muzikë për të cilën ke leje ta aranzhosh. Ti je përgjegjës për atë që ngarkon.", "Mos ngarko material që nuk të lejohet ta kopjosh, ta shpërndash ose ta përpunosh."] },
  { h: "Aranzhimet që krijon", p: ["Aranzhimet e muzikës sate ose të muzikës në domenin publik janë të tuat për t'i përdorur, printuar, interpretuar dhe shpërndarë. Aranzhimi i një vepre të mbrojtur me të drejta autori mund të kërkojë lejen e mbajtësit të të drejtave para se ta interpretosh publikisht, ta incizosh, ta botosh ose ta shesësh.", "Partiturat e krijuara me DriniArranges kanë shënimin \"© DriniArranges\" në fund të faqes. Të lutem mbaje kur i shpërndan ose i printon."] },
  { h: "Rezultatet e inteligjencës artificiale", p: ["Aranzhimet i shkruan një AI dhe kontrollohen automatikisht, por mund të kenë gabime në nota, regjistra, harmoni ose notacion. Kontrollo çdo aranzhim para se ta përdorësh në mësim, prova ose koncert."] },
  { h: "Përdorimi i drejtë", p: ["Mos e keqpërdor aplikacionin: pa përpjekje për të anashkaluar kufirin falas, për ta mbingarkuar shërbimin ose për ta përdorur për diçka të paligjshme."] },
  { h: "Pa garanci, përgjegjësi e kufizuar", p: ["Aplikacioni ofrohet \"siç është\", pa asnjë garanci. Për aq sa e lejon ligji, DriniArranges nuk mban përgjegjësi për humbje të tërthorta ose për humbje nga përdorimi apo pamundësia e përdorimit të aplikacionit."] },
  { h: "Ndryshime dhe kontakt", p: ["Këto kushte mund të ndryshojnë ndërsa aplikacioni rritet; data lart tregon versionin e fundit.", `Pyetje: ${CONTACT_EMAIL}`] },
];

function Terms() {
  return (
    <PageShell>
      <LegalPage title={{ en: "Terms of use", sq: "Kushtet e përdorimit" }} en={en} sq={sq} />
    </PageShell>
  );
}
