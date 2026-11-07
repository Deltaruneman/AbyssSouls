-- =====================================================================
-- THE TIU — PvP trực tiếp theo lượt
-- Chạy MỘT LẦN sau schema chính trong Supabase Dashboard -> SQL Editor.
-- Client chỉ gọi RPC bằng key người chơi; không cấp quyền đọc/ghi bảng.
-- =====================================================================

create table if not exists public.live_matches (
  id uuid primary key default gen_random_uuid(),
  challenger uuid not null references public.players(id) on delete cascade,
  opponent uuid not null references public.players(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','completed','rejected','expired','forfeit')),
  seed bigint not null,
  challenger_build jsonb not null,
  opponent_build jsonb not null,
  current_round int not null default 1,
  actions jsonb not null default '[]'::jsonb,
  winner uuid references public.players(id) on delete set null,
  is_draw boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (challenger <> opponent),
  check (jsonb_typeof(actions) = 'array')
);

create index if not exists live_matches_challenger_status_idx on public.live_matches (challenger, status, created_at desc);
create index if not exists live_matches_opponent_status_idx on public.live_matches (opponent, status, created_at desc);
alter table public.live_matches enable row level security;
revoke all on public.live_matches from anon, authenticated;

create or replace function public._live_match_json(p_match public.live_matches, p_viewer uuid) returns jsonb
language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'id', p_match.id, 'status', p_match.status, 'seed', p_match.seed,
    'challenger_id', p_match.challenger, 'opponent_id', p_match.opponent,
    'challenger_name', pc.display_name, 'opponent_name', po.display_name,
    'challenger_build', p_match.challenger_build, 'opponent_build', p_match.opponent_build,
    'current_round', p_match.current_round, 'actions', p_match.actions,
    'winner', p_match.winner, 'is_draw', p_match.is_draw,
    'created_at', p_match.created_at, 'updated_at', p_match.updated_at,
    'my_id', p_viewer
  )
  from public.players pc, public.players po
  where pc.id = p_match.challenger and po.id = p_match.opponent
$$;
revoke all on function public._live_match_json(public.live_matches, uuid) from public, anon, authenticated;

create or replace function public.invite_live_match(p_key text, p_opponent uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_me uuid := public._player_of(p_key);
  v_a jsonb;
  v_b jsonb;
  v_seed_bytes bytea;
  v_seed bigint;
  v_match public.live_matches;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  if p_opponent is null or p_opponent = v_me then raise exception 'self_match'; end if;
  perform pg_advisory_xact_lock(hashtext(least(v_me::text,p_opponent::text)));
  perform pg_advisory_xact_lock(hashtext(greatest(v_me::text,p_opponent::text)));
  select build into v_a from public.characters where player_id = v_me;
  select build into v_b from public.characters where player_id = p_opponent;
  if v_a is null then raise exception 'no_own_build'; end if;
  if v_b is null then raise exception 'no_opponent'; end if;
  if exists(select 1 from public.live_matches where status in ('pending','active') and (challenger in (v_me,p_opponent) or opponent in (v_me,p_opponent))) then
    raise exception 'live_match_exists';
  end if;
  v_seed_bytes := extensions.gen_random_bytes(4);
  v_seed := get_byte(v_seed_bytes,0)::bigint * 16777216 + get_byte(v_seed_bytes,1)::bigint * 65536 + get_byte(v_seed_bytes,2)::bigint * 256 + get_byte(v_seed_bytes,3)::bigint;
  insert into public.live_matches(challenger, opponent, seed, challenger_build, opponent_build)
  values(v_me, p_opponent, v_seed, v_a, v_b) returning * into v_match;
  return public._live_match_json(v_match, v_me);
end $$;

create or replace function public.list_live_matches(p_key text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_me uuid := public._player_of(p_key); v_result jsonb;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  update public.live_matches set status='expired', updated_at=now()
    where status='pending' and created_at < now()-interval '5 minutes' and (challenger=v_me or opponent=v_me);
  select coalesce(jsonb_agg(public._live_match_json(m, v_me) order by m.created_at desc), '[]'::jsonb)
    into v_result from public.live_matches m
    where (m.challenger=v_me or m.opponent=v_me) and m.status in ('pending','active');
  return v_result;
end $$;

create or replace function public.list_live_opponents(p_key text, p_limit int default 10)
returns table (id uuid, name text, class_id text, level int, rating int, wins int, losses int, online boolean)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare v_me uuid := public._player_of(p_key); v_rating int;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  select coalesce(c.rating,1000) into v_rating from public.characters c where c.player_id=v_me;
  v_rating:=coalesce(v_rating,1000);
  return query
    select p.id,p.display_name,c.class_id,c.level,c.rating,c.wins,c.losses,(p.last_seen>now()-interval '8 seconds')
    from public.characters c join public.players p on p.id=c.player_id
    where c.build is not null and c.player_id<>v_me
    order by (p.last_seen>now()-interval '8 seconds') desc,abs(c.rating-v_rating),random()
    limit least(greatest(coalesce(p_limit,10),1),20);
end $$;

create or replace function public.respond_live_match(p_key text, p_match uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_me uuid := public._player_of(p_key); v_match public.live_matches;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  select * into v_match from public.live_matches where id=p_match for update;
  if not found or v_me <> v_match.opponent then raise exception 'live_match_not_found'; end if;
  if v_match.status <> 'pending' then raise exception 'live_match_not_pending'; end if;
  if v_match.created_at < now()-interval '5 minutes' then
    update public.live_matches set status='expired', updated_at=now() where id=p_match returning * into v_match;
    return public._live_match_json(v_match,v_me);
  end if;
  update public.live_matches set status=case when p_accept then 'active' else 'rejected' end, updated_at=now()
    where id=p_match returning * into v_match;
  return public._live_match_json(v_match, v_me);
end $$;

create or replace function public.get_live_match(p_key text, p_match uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_me uuid := public._player_of(p_key); v_match public.live_matches;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  select * into v_match from public.live_matches where id=p_match and (challenger=v_me or opponent=v_me);
  if not found then raise exception 'live_match_not_found'; end if;
  return public._live_match_json(v_match, v_me);
end $$;

create or replace function public.submit_live_action(p_key text, p_match uuid, p_action jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_me uuid := public._player_of(p_key);
  v_match public.live_matches;
  v_count int;
  v_action jsonb;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  if p_action is null or jsonb_typeof(p_action) <> 'object' then raise exception 'bad_action'; end if;
  if octet_length(p_action::text)>512 then raise exception 'bad_action'; end if;
  if coalesce(p_action->>'type','') not in ('attack','defend','skill','ultimate','skip') then raise exception 'bad_action'; end if;
  if length(coalesce(p_action->>'id','')) > 40 or length(coalesce(p_action->>'target','')) > 20 then raise exception 'bad_action'; end if;
  if coalesce((p_action->>'quality')::numeric, 1) < 0 or coalesce((p_action->>'quality')::numeric, 1) > 1 then raise exception 'bad_action'; end if;
  select * into v_match from public.live_matches where id=p_match for update;
  if not found or v_match.status <> 'active' then raise exception 'live_match_not_active'; end if;
  if v_me not in (v_match.challenger,v_match.opponent) then raise exception 'live_match_not_found'; end if;
  if exists(select 1 from jsonb_array_elements(v_match.actions) as a(entry) where (entry->>'round')::int=v_match.current_round and entry->>'player_id'=v_me::text) then
    raise exception 'action_already_submitted';
  end if;
  v_action := jsonb_build_object('round',v_match.current_round,'player_id',v_me,'action',p_action);
  v_match.actions := v_match.actions || jsonb_build_array(v_action);
  select count(distinct entry->>'player_id') into v_count from jsonb_array_elements(v_match.actions) as a(entry) where (entry->>'round')::int=v_match.current_round;
  if v_count >= 2 then v_match.current_round := v_match.current_round + 1; end if;
  update public.live_matches set actions=v_match.actions,current_round=v_match.current_round,updated_at=now() where id=p_match returning * into v_match;
  return public._live_match_json(v_match,v_me);
end $$;

create or replace function public.finish_live_match(p_key text, p_match uuid, p_winner uuid, p_is_draw boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_me uuid := public._player_of(p_key); v_match public.live_matches;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  select * into v_match from public.live_matches where id=p_match for update;
  if not found or v_me not in (v_match.challenger,v_match.opponent) then raise exception 'live_match_not_found'; end if;
  if v_match.status='completed' then return public._live_match_json(v_match,v_me); end if;
  if v_match.status <> 'active' then raise exception 'live_match_not_active'; end if;
  if p_is_draw then p_winner := null;
  elsif p_winner is null or p_winner not in (v_match.challenger,v_match.opponent) then raise exception 'bad_winner'; end if;
  update public.live_matches set status='completed',winner=p_winner,is_draw=p_is_draw,updated_at=now() where id=p_match returning * into v_match;
  return public._live_match_json(v_match,v_me);
end $$;

create or replace function public.forfeit_live_match(p_key text, p_match uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_me uuid := public._player_of(p_key); v_match public.live_matches;
begin
  if v_me is null then raise exception 'invalid_key'; end if;
  select * into v_match from public.live_matches where id=p_match for update;
  if not found or v_me not in (v_match.challenger,v_match.opponent) then raise exception 'live_match_not_found'; end if;
  if v_match.status not in ('pending','active') then return public._live_match_json(v_match,v_me); end if;
  update public.live_matches set status='forfeit',winner=case when challenger=v_me then opponent else challenger end,updated_at=now()
    where id=p_match returning * into v_match;
  return public._live_match_json(v_match,v_me);
end $$;

revoke all on function public.invite_live_match(text,uuid), public.list_live_matches(text), public.list_live_opponents(text,int),
  public.respond_live_match(text,uuid,boolean), public.get_live_match(text,uuid),
  public.submit_live_action(text,uuid,jsonb), public.finish_live_match(text,uuid,uuid,boolean),
  public.forfeit_live_match(text,uuid) from public, authenticated;
grant execute on function public.invite_live_match(text,uuid), public.list_live_matches(text), public.list_live_opponents(text,int),
  public.respond_live_match(text,uuid,boolean), public.get_live_match(text,uuid),
  public.submit_live_action(text,uuid,jsonb), public.finish_live_match(text,uuid,uuid,boolean),
  public.forfeit_live_match(text,uuid) to anon, authenticated;
