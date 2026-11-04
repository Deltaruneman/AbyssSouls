/* Gộp rpg_core.js + rpg_combat.js + arena_core.js thành 1 module ESM cho Edge Function.
   Chạy:  node tools/build_engine.js   (mỗi khi bạn đổi engine, chạy lại rồi deploy lại function) */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n");
const out = [
  "/* FILE TỰ SINH bởi tools/build_engine.js — KHÔNG sửa tay. */",
  read("rpg_core.js"), read("rpg_combat.js"), read("arena_core.js"),
  "export const RPG = globalThis.RPG;", "export const RPGCombat = globalThis.RPGCombat;", "export const TiuArena = globalThis.TiuArena;", ""
].join("\n");
const dest = path.join(root, "supabase", "functions", "arena-match", "engine.mjs");
fs.writeFileSync(dest, out);
console.log("OK ->", dest, (out.length / 1024).toFixed(0) + " KB");
