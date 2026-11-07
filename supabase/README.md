# Supabase setup

Supabase is optional for the single-player game. Cloud saves, arena matchmaking,
and live PvP require a configured project.

## Client configuration

Copy `config/supabase_config.example.js` to `config/supabase_config.js` and set
the project URL and public anon/publishable key. The local config is ignored by
Git. Never put a `service_role` key in a browser file.

## Database

Create the base schema first. The base schema is not included in this checkout;
it must provide the `players` and `characters` tables, the existing profile RPCs,
and the `_player_of(text)` helper.

After the base schema is installed, apply
`supabase/migrations/20261107000000_live_pvp.sql` once in the Supabase SQL Editor.
It adds the live match table and its RPC functions. The migration is also
compatible with running through the Supabase CLI migration workflow.

## Ranked arena Edge Function

The `arena-match` function lives in `supabase/functions/arena-match/`. If RPG
combat rules change, regenerate the bundled engine and deploy the function:

```powershell
node tools/build_engine.cjs
supabase functions deploy arena-match
```

The function receives `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the
Supabase Edge Runtime. Keep these server-side values out of client configuration.
