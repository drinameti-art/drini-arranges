# Account and cloud library scope
- [x] Email/password, Google, login and password recovery with EN/SQ text.
- [x] Profiles and saved scores with owner-only policies and signup trigger.
- [x] Preserve the synchronous library API; add account cache, migration and deletion.
- [x] Verify authenticated migration, new saves, reload, opening, confirmed deletion, sign-out, signed-out access denial, and unchanged protected files; 15 targeted tests cover account and cache rules.

Verification limitations: Google browser authorization, delivered signup/reset emails, and a real password recovery session were not exercised. Account and recovery calls were tested with mocked responses; storage was exercised with a real temporary account.