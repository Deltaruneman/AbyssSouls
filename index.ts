// Supabase Edge Function: arena-match — mô phỏng trận đấu trường TRÊN MÁY CHỦ (chống gian lận).
// Deploy:  supabase functions deploy arena-match
// (SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY được Supabase tự cấp cho Edge Function, KHÔNG đưa vào game.)
import { handleMatch } from "./handler.mjs";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const H = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`rest ${path} -> ${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function sha256hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const db = {
  async playerByKeyHash(hash: string) {
    const rows = await rest(`players?select=id&key_hash=eq.${hash}&limit=1`);
    return rows && rows[0] ? rows[0] : null;
  },
  async character(id: string) {
    const rows = await rest(`characters?select=build,rating&player_id=eq.${id}&limit=1`);
    return rows && rows[0] ? rows[0] : null;
  },
  async lastMatchAt(id: string) {
    const rows = await rest(`matches?select=created_at&attacker=eq.${id}&order=created_at.desc&limit=1`);
    return rows && rows[0] ? rows[0].created_at : null;
  },
  async countSince(id: string, since: string, o: { ranked: boolean; vs?: string }) {
    let q = `matches?select=id&attacker=eq.${id}&ranked=eq.${o.ranked}&created_at=gte.${encodeURIComponent(since)}`;
    if (o.vs) q += `&defender=eq.${o.vs}`;
    const r = await fetch(`${URL_}/rest/v1/${q}`, { headers: { ...H, Prefer: "count=exact", Range: "0-0" } });
    const cr = r.headers.get("content-range") || "*/0";
    return parseInt(cr.split("/")[1] || "0", 10) || 0;
  },
  async applyMatch(a: any) {
    return await rest("rpc/apply_match", {
      method: "POST",
      body: JSON.stringify({
        p_att: a.att, p_def: a.def, p_ranked: a.ranked, p_seed: a.seed, p_winner: a.winner, p_rounds: a.rounds,
        p_att_before: a.attBefore, p_att_after: a.attAfter, p_def_before: a.defBefore, p_def_after: a.defAfter, p_log: a.log,
      }),
    });
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => null);
    const out = await handleMatch(body, db, sha256hex);
    return new Response(JSON.stringify(out.json), { status: out.status, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "server_error", message: "Lỗi máy chủ, thử lại sau." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
