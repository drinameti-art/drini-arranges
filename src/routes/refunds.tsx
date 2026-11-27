import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/drini/TopBar";
import { CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/drini/Legal";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund policy · DriniArranges" },
      { name: "description", content: "How cancelling and refunds work for DriniArranges Pro and Studio." },
      { property: "og:title", content: "Refund policy · DriniArranges" },
      { property: "og:description", content: "How cancelling and refunds work for DriniArranges Pro and Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Refunds,
});

const en: LegalSection[] = [
  { h: "Who handles payments", p: ["Payments for Pro and Studio are processed by our reseller, Paddle.com, who is the merchant of record for these orders. Paddle handles billing, receipts, taxes and refunds."] },
  { h: "Cancel any time", p: ["You can cancel your plan at any time from the link in your Paddle receipt or your account. Your plan stays active until the end of the period you have paid for, then it switches back to the free plan. You will not be charged again."] },
  { h: "14-day refund on your first payment", p: ["If DriniArranges is not right for you, ask for a refund within 14 days of your first payment for a plan and you get your money back in full, whatever the reason."] },
  { h: "Renewals", p: ["For a monthly renewal, you can ask for a refund within 14 days of the renewal if you have not made any arrangements since it. Otherwise renewals are not refunded, but you can cancel so the next month is not charged."] },
  { h: "Problems with the service", p: ["If the app did not work for you (for example arrangements failed or could not be downloaded), write to us and we will put it right or refund you."] },
  { h: "How to ask for a refund", p: [`Reply to your Paddle receipt, use paddle.net to find your order, or write to ${CONTACT_EMAIL} with the email address you paid with. Refunds go back to the original payment method, usually within 5–10 working days.`] },
  { h: "Your legal rights", p: ["This policy does not limit any rights you have under the consumer law of your country."] },
];

const sq: LegalSection[] = [
  { h: "Kush i trajton pagesat", p: ["Pagesat për Pro dhe Studio përpunohen nga rishitësi ynë, Paddle.com, i cili është shitësi zyrtar (merchant of record) për këto porosi. Paddle merret me faturimin, faturat, taksat dhe rimbursimet."] },
  { h: "Anulo kurdo", p: ["Mund ta anulosh paketën kurdo nga lidhja në faturën e Paddle ose nga llogaria jote. Paketa mbetet aktive deri në fund të periudhës së paguar, pastaj kthehet në paketën falas. Nuk do të tarifohesh më."] },
  { h: "Rimbursim brenda 14 ditëve për pagesën e parë", p: ["Nëse DriniArranges nuk është për ty, kërko rimbursim brenda 14 ditëve nga pagesa e parë për një paketë dhe i merr paratë plotësisht, pavarësisht arsyes."] },
  { h: "Rinovimet", p: ["Për një rinovim mujor, mund të kërkosh rimbursim brenda 14 ditëve nga rinovimi nëse nuk ke bërë asnjë aranzhim që atëherë. Përndryshe rinovimet nuk rimbursohen, por mund ta anulosh që muaji tjetër të mos tarifohet."] },
  { h: "Probleme me shërbimin", p: ["Nëse aplikacioni nuk funksionoi për ty (për shembull aranzhimet dështuan ose nuk u shkarkuan), na shkruaj dhe do ta rregullojmë ose do të të rimbursojmë."] },
  { h: "Si të kërkosh rimbursim", p: [`Përgjigju faturës së Paddle, përdor paddle.net për të gjetur porosinë, ose shkruaj në ${CONTACT_EMAIL} me adresën e email-it me të cilën ke paguar. Rimbursimet kthehen te mënyra e pagesës, zakonisht brenda 5–10 ditëve të punës.`] },
  { h: "Të drejtat e tua ligjore", p: ["Kjo politikë nuk i kufizon të drejtat që ke sipas ligjit për mbrojtjen e konsumatorit në vendin tënd."] },
];

function Refunds() {
  return (
    <PageShell>
      <LegalPage title={{ en: "Refund policy", sq: "Politika e rimbursimit" }} en={en} sq={sq} />
    </PageShell>
  );
}
