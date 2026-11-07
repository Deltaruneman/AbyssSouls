# Supabase setup

Supabase is optional for the single-player game. Cloud saves, arena matchmaking,
and live PvP require a configured project.

## Client configuration

Set `url` and the public anon/publishable key in `config/supabase_config.js`.
This file must be included in the deployed site so the browser can configure
Supabase. The publishable key is intended for client use; never put a
`service_role` key in a browser file.

## Database

Create the base schema first. The base schema is not included in this checkout;
it must provide the `players` and `characters` tables, the existing profile RPCs,
and the `_player_of(text)` helper.

After the base schema is installed, apply
`supabase/migrations/20261107000000_live_pvp.sql` once in the Supabase SQL Editor.
It adds the live match table and its RPC functions. The migration is also
compatible with running through the Supabase CLI migration workflow.

Then apply `supabase/migrations/20261107010000_account_auth_3_character_slots.sql`
to enable email/password registration and three character slots per account.
Enable the Email provider under Supabase Auth. To let new accounts sign in
without verifying an email, turn off **Confirm Email** under
**Authentication → Sign In / Providers → Email** in the Supabase Dashboard.
With this setting off, Supabase returns a session on successful signup and the
game signs the new account in automatically. Each slot uses its own
`players`/`characters` identity, so build, rating, and match history stay
separate. The old key-based login remains available for existing players.

## Ranked arena Edge Function

The `arena-match` function lives in `supabase/functions/arena-match/`. If RPG
combat rules change, regenerate the bundled engine and deploy the function:

```powershell
node tools/build_engine.cjs
supabase functions deploy arena-match
```

The function receives `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the
Supabase Edge Runtime. Keep these server-side values out of client configuration.
