# Account and cloud library scope
- [x] Email/password, Google, login and password recovery with EN/SQ text.
- [x] Profiles and saved scores with owner-only policies and signup trigger.
- [x] Preserve the synchronous library API; add account cache, migration and deletion.
- [x] Verify authenticated migration, new saves, reload, opening, confirmed deletion, sign-out, signed-out access denial, and unchanged protected files; 15 targeted tests cover account and cache rules.

Verification limitations: Google browser authorization, delivered signup/reset emails, and a real password recovery session were not exercised. Account and recovery calls were tested with mocked responses; storage was exercised with a real temporary account.

# Paddle payments
- [ ] Enable Lovable Payments with Paddle in the interactive Lovable editor. Blocker: payment setup is unavailable in this session; the owner must complete the setup form there.
- [ ] After enablement, create EUR subscriptions: Pro €29.99 weekly and Studio €59.99 monthly; Free has no product.
- [ ] Wire pricing and landing checkout, sign-in return to /pricing, and purchase-to-user matching. Blocker: Paddle setup must be enabled first.
- [ ] Add signature-verified subscription updates and customer portal with EN/SQ text, preserving existing plan protection and limits. Blocker: Paddle setup must be enabled first.
- [ ] Test preview checkout with Paddle test cards and confirm plan/renewal readback; guide verification, domain approval, and publishing. Blocker: enabled payment setup and successful preview testing are required first.