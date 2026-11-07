-- THE TIU — email/password accounts with three independent PvP character slots.
-- Apply after 20261107000000_live_pvp.sql and the base THE TIU schema.

create table if not exists public.tiu_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tiu_account_slots (
  user_id uuid not null references public.tiu_accounts(user_id) on delete cascade,
  slot_no smallint not null check (slot_no between 1 and 3),
  player_id uuid not null unique references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, slot_no)
);

alter table public.tiu_accounts enable row level security;
alter table public.tiu_account_slots enable row level security;
revoke all on public.tiu_accounts, public.tiu_account_slots from anon, authenticated;

-- Creates the account row and exactly three player identities on first sign-in.
-- Each identity reuses the existing character, ranking, opponent, and match RPCs.
create or replace function public.tiu_account_init(p_display_name text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_user uuid := auth.uid();
  v_name text;
  v_email_name text;
  v_slot int;
  v_player uuid;
begin
  if v_user is null then raise exception 'auth_required'; end if;

  select coalesce(nullif(trim(p_display_name), ''), nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), 'Người chơi')
    into v_email_name from auth.users where id=v_user;
  v_name := left(regexp_replace(coalesce(v_email_name,'Người chơi'), '[[:cntrl:]<>"''`\\]', '', 'g'), 20);
  if v_name = '' then v_name := 'Người chơi'; end if;

  insert into public.tiu_accounts(user_id,display_name) values(v_user,v_name)
    on conflict(user_id) do nothing;
  select display_name into v_name from public.tiu_accounts where user_id=v_user;

  for v_slot in 1..3 loop
    select player_id into v_player from public.tiu_account_slots where user_id=v_user and slot_no=v_slot;
    if v_player is null then
      insert into public.players(key_hash,display_name)
      values(public._hash_key(encode(extensions.gen_random_bytes(32),'hex')),left(v_name||' #'||v_slot,20))
      returning id into v_player;
      insert into public.tiu_account_slots(user_id,slot_no,player_id) values(v_user,v_slot,v_player)
        on conflict(user_id,slot_no) do nothing;
      if not found then delete from public.players where id=v_player; end if;
      v_player := null;
    end if;
  end loop;

  return jsonb_build_object('ok',true,'display_name',v_name);
end $$;

create or replace function public.tiu_account_slots()
returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid(); v_result jsonb;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  select jsonb_build_object(
      'display_name',a.display_name,
      'slots',coalesce(jsonb_agg(jsonb_build_object(
        'slot_no',s.slot_no,
        'player_id',s.player_id,
        'has_character',c.player_id is not null,
        'class_id',c.class_id,
        'level',c.level,
        'rating',coalesce(c.rating,1000),
        'wins',coalesce(c.wins,0),
        'losses',coalesce(c.losses,0),
        'has_build',c.build is not null,
        'updated_at',c.updated_at
      ) order by s.slot_no),'[]'::jsonb))
    into v_result
    from public.tiu_accounts a
    join public.tiu_account_slots s on s.user_id=a.user_id
    left join public.characters c on c.player_id=s.player_id
    where a.user_id=v_user
    group by a.display_name;
  if v_result is null then raise exception 'account_not_initialized'; end if;
  return v_result;
end $$;

-- The legacy game RPCs authenticate through a high-entropy player key. Rotate and
-- return a fresh key only to the signed-in owner when they activate one slot.
create or replace function public.tiu_activate_character_slot(p_slot int)
returns jsonb
language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_user uuid := auth.uid();
  v_player uuid;
  v_hex text;
  v_key text;
  v_name text;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if p_slot < 1 or p_slot > 3 then raise exception 'invalid_slot'; end if;
  select s.player_id,a.display_name into v_player,v_name
    from public.tiu_account_slots s join public.tiu_accounts a on a.user_id=s.user_id
    where s.user_id=v_user and s.slot_no=p_slot;
  if v_player is null then raise exception 'slot_not_found'; end if;

  v_hex := upper(encode(extensions.gen_random_bytes(10),'hex'));
  v_key := 'TIU-'||substr(v_hex,1,5)||'-'||substr(v_hex,6,5)||'-'||substr(v_hex,11,5)||'-'||substr(v_hex,16,5);
  update public.players set key_hash=public._hash_key(v_key),display_name=left(v_name||' #'||p_slot,20),last_seen=now()
    where id=v_player;
  return jsonb_build_object('ok',true,'slot_no',p_slot,'key',v_key);
end $$;

-- Preserve class/level in private slots too; only a non-null build is listed publicly.
create or replace function public.save_character(p_key text, p_data jsonb, p_build jsonb)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := public._player_of(p_key);
begin
  if v_player is null then raise exception 'invalid_key'; end if;
  if p_data is null or octet_length(p_data::text) > 60000 then raise exception 'data_too_large'; end if;
  if p_build is not null and octet_length(p_build::text) > 4000 then raise exception 'build_too_large'; end if;
  insert into public.characters(player_id,data,build,class_id,level,updated_at)
  values(v_player,p_data,p_build,left(coalesce(p_build->>'classId',p_data->>'classId'),20),nullif(coalesce(p_build->>'level',p_data->>'level'),'')::int,now())
  on conflict(player_id) do update set data=excluded.data,build=excluded.build,class_id=excluded.class_id,level=excluded.level,updated_at=now();
  return jsonb_build_object('ok',true,'published',p_build is not null);
end $$;

revoke all on function public.tiu_account_init(text) from public, anon;
revoke all on function public.tiu_account_slots() from public, anon;
revoke all on function public.tiu_activate_character_slot(int) from public, anon;
grant execute on function public.tiu_account_init(text), public.tiu_account_slots(), public.tiu_activate_character_slot(int) to authenticated;
revoke all on function public.save_character(text,jsonb,jsonb) from public;
grant execute on function public.save_character(text,jsonb,jsonb) to anon, authenticated;
