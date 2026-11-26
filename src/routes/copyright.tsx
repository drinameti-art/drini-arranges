import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/drini/TopBar";
import { CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/drini/Legal";

export const Route = createFileRoute("/copyright")({
  head: () => ({
    meta: [
      { title: "Copyright · DriniArranges" },
      { name: "description", content: "The DriniArranges label, rights in original works, and how to report a problem." },
      { property: "og:title", content: "Copyright · DriniArranges" },
      { property: "og:description", content: "The DriniArranges label, rights in original works, and how to report a problem." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Copyright,
});

const en: LegalSection[] = [
  { h: "The DriniArranges label", p: ["Every score made with DriniArranges shows \"© DriniArranges\" at the bottom of the page. The label marks the arrangement as made with DriniArranges; it does not claim ownership of the original melody or song."] },
  { h: "Original works", p: ["Melodies, songs and compositions belong to their composers and rights holders. Arranging, performing, recording or selling an arrangement of a copyrighted work can require their permission, even when the arrangement itself is new. Works in the public domain (for example most music by composers who died more than 70 years ago) can be arranged freely."] },
  { h: "Your responsibility", p: ["Only upload or describe music you are allowed to use, and check the rights before performing an arrangement in public, recording it, publishing it or selling it."] },
  { h: "Sounds used for playback", p: ["Playback uses sounds rendered from the MuseScore_General sound font by Frank Wen, Michael Cowgill and S. Christian Collins, released under the MIT license. The license is included with the sound files."] },
  { h: "Reporting a problem", p: ["If you believe something on DriniArranges infringes your rights, write to " + CONTACT_EMAIL + " with a description of the work, where it appears and your contact details. We will look at every report and remove material that infringes rights."] },
];

const sq: LegalSection[] = [
  { h: "Shënimi DriniArranges", p: ["Çdo partiturë e krijuar me DriniArranges ka \"© DriniArranges\" në fund të faqes. Shënimi tregon se aranzhimi u bë me DriniArranges; nuk pretendon pronësi mbi melodinë apo këngën origjinale."] },
  { h: "Veprat origjinale", p: ["Melodiat, këngët dhe kompozimet u përkasin kompozitorëve dhe mbajtësve të të drejtave. Aranzhimi, interpretimi, incizimi ose shitja e aranzhimit të një vepre të mbrojtur mund të kërkojë lejen e tyre, edhe kur vetë aranzhimi është i ri. Veprat në domenin publik (për shembull shumica e muzikës së kompozitorëve që kanë vdekur para më shumë se 70 vjetësh) mund të aranzhohen lirisht."] },
  { h: "Përgjegjësia jote", p: ["Ngarko ose përshkruaj vetëm muzikë që të lejohet ta përdorësh dhe kontrollo të drejtat para se ta interpretosh publikisht, ta incizosh, ta botosh ose ta shesësh një aranzhim."] },
  { h: "Tingujt e riprodhimit", p: ["Riprodhimi përdor tinguj të krijuar nga fonti i tingujve MuseScore_General nga Frank Wen, Michael Cowgill dhe S. Christian Collins, i publikuar me licencën MIT. Licenca përfshihet bashkë me skedarët e tingujve."] },
  { h: "Raportimi i një problemi", p: ["Nëse mendon se diçka në DriniArranges cenon të drejtat e tua, shkruaj në " + CONTACT_EMAIL + " me përshkrimin e veprës, ku shfaqet dhe kontaktin tënd. Do ta shqyrtojmë çdo raportim dhe do ta heqim materialin që cenon të drejta."] },
];

function Copyright() {
  return (
    <PageShell>
      <LegalPage title={{ en: "Copyright", sq: "Të drejtat e autorit" }} en={en} sq={sq} />
    </PageShell>
  );
}
