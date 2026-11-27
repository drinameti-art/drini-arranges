# Account and cloud library scope
- [x] Email/password, Google, login and password recovery with EN/SQ text.
- [x] Profiles and saved scores with owner-only policies and signup trigger.
- [x] Preserve the synchronous library API; add account cache, migration and deletion.
- [x] Verify authenticated migration, new saves, reload, opening, confirmed deletion, sign-out, signed-out access denial, and unchanged protected files; 15 targeted tests cover account and cache rules.

Verification limitations: Google browser authorization, delivered signup/reset emails, and a real password recovery session were not exercised. Account and recovery calls were tested with mocked responses; storage was exercised with a real temporary account.

# Paddle payments
- [x] Run the built-in payment eligibility check using the requested software subscriptions and declared seller country Kosovo (XK).
- [ ] Enable Lovable Payments with Paddle. Blocker: the eligibility check returned NO BUILT-IN PAYMENTS, reporting this project ineligible for Paddle and built-in Stripe unavailable for XK; it explicitly prohibited enabling a built-in provider.
- [ ] After enablement, create EUR subscriptions: Pro €29.99 weekly and Studio €59.99 monthly; Free has no product. Blocker: payment eligibility prevents enablement.
- [ ] Wire pricing and landing checkout, sign-in return to /pricing, and purchase-to-user matching. Blocker: payment eligibility prevents enablement; no payment code may be implemented before enablement.
- [ ] Add signature-verified subscription updates and customer portal with EN/SQ text, preserving existing plan protection and limits. Blocker: payment eligibility prevents enablement.
- [ ] Test preview checkout with Paddle test cards and confirm plan/renewal readback; guide verification, domain approval, and publishing. Blocker: no enabled payment provider or checkout to test; app not published in this payments task.