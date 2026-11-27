# Account and cloud library scope
- [x] Email/password, Google, login and password recovery with EN/SQ text.
- [x] Profiles and saved scores with owner-only policies and signup trigger.
- [x] Preserve the synchronous library API; add account cache, migration and deletion.
- [x] Verify authenticated migration, new saves, reload, opening, confirmed deletion, sign-out, signed-out access denial, and unchanged protected files; 15 targeted tests cover account and cache rules.

Verification limitations: Google browser authorization, delivered signup/reset emails, and a real password recovery session were not exercised. Account and recovery calls were tested with mocked responses; storage was exercised with a real temporary account.

# Custom Paddle Billing
- [x] Implement custom credential configuration without Lovable Payments; environment configured for live use. Secure entry instructions are in PADDLE_SETUP.md (no secret-request form offered here).
- [x] Implement idempotent EUR catalog setup: Pro €29.99 weekly, Studio €59.99 monthly, no Free product; persisted environment-scoped IDs and setup leases.
- [x] Wire signed-in overlay checkout on pricing and landing cards, login return, success notification and plan refresh.
- [x] Add signed webhook, account/subscription mapping and customer portal with EN/SQ text; preserve plan protection and limits.
- [x] Verify signature/status/catalog rules, rollback-only database mapping and access rules, and signed-in/out browser flows; provide exact webhook URL and domain-approval instructions in PADDLE_SETUP.md.
- [ ] Owner adds PADDLE_API_KEY, PADDLE_CLIENT_TOKEN and PADDLE_WEBHOOK_SECRET through Project Settings → Secrets. Blocker: owner credentials; never request them in chat.
- [ ] Exercise real Paddle catalog creation, notification delivery, an approved-domain purchase, and a real portal session. Blockers: owner credentials, publishing, and Paddle domain approval. No real checkout, product creation, or publication was performed in this task.