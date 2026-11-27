<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep the score library API synchronous; perform cloud synchronization behind account-scoped caches so existing arranging callers remain unchanged.
- Own session state and the single auth subscriber in a root-mounted provider; keep public pages accessible and enforce score ownership with database RLS.
- Link saved-score ownership to public profiles, which cascade from auth users, to follow managed schema boundaries.
- Plan limits are enforced in server functions (src/lib/plan-limits.ts rules, usage.server.ts DB access); usage rows are inserted only with the service role after a successful AI result, so the browser cannot reset or inflate counts.
- Plan and billing-reference columns on profiles are writable only by the service role (column grants + triggers); Paddle webhooks atomically apply verified subscription changes.
- Custom Paddle Billing uses authenticated server-created transactions and customer ownership matching, never browser checkout success as proof of entitlement; raw signed webhooks are the only payment-to-plan authority.
- Keep Paddle catalogs and subscription event ordering durable and environment-scoped; catalog leases avoid concurrent setup and atomic event processing ignores duplicates/stale events without canceling another active subscription.
- Load Paddle.js dynamically on a checkout gesture and initialize it once per page; retain past-due access during Paddle payment recovery until the subscription is effectively paused or canceled.
