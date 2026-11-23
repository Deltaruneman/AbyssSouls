/* Local campaign saves. Keep the v2 keys so existing journeys remain playable. */
(function(global){
  'use strict';
  const SAVE = 'uit_savegame_v2', CHECKPOINT = 'uit_checkpoint_v2', BACKUP = SAVE + '_backup';
  const rooms = ['A','B','C','D','E','LIB','CANTEEN','PARK','FIELD'];
  const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
  function valid(data){
    if(!object(data) || data.v !== 2 || !object(data.state) || !object(data.rpg)) return false;
    if(!Number.isFinite(data.savedAt))return false;
    const s = data.state, r = data.rpg;
    if(![1,2].includes(s.chapter) || !Number.isInteger(s.night) || s.night < 1 || s.night > (s.chapter===1?3:2)) return false;
    if(!rooms.includes(s.playerRoom) || !Number.isFinite(s.gameMinutes) || s.gameMinutes < 0) return false;
    if(!Array.isArray(s.log) || !s.log.every(l=>object(l) && typeof l.msg==='string' && typeof l.t==='string')) return false;
    if(!object(r.fighters) || !Array.isArray(r.order) || !r.order.includes('PLAYER')) return false;
    const ids = ['PLAYER', ...global.RPG.NPC_ROSTER.map(n=>n.id)];
    if(!ids.every(id=>object(r.fighters[id])) || !r.order.every(id=>ids.includes(id))) return false;
    if(!Object.values(r.fighters).every(f=>object(f) && ids.includes(f.id) && global.RPG.CLASSES[f.classId] &&
      typeof f.name==='string' && Number.isFinite(f.hp) && Number.isFinite(f.drl) && Number.isFinite(f.exp) &&
      Number.isInteger(f.level) && f.level>=1 && f.level<=global.RPG.CFG.MAX_LEVEL &&
      object(f.items) && object(f.components) &&
      [f.items,f.components].every(b=>Object.values(b).every(n=>Number.isInteger(n)&&n>=0)))) return false;
    if(!r.fighters.PLAYER.isPlayer) return false;
    const RPG=global.RPG;
    for(const f of Object.values(r.fighters)){
      if(!Number.isFinite(f.maxHp)||f.maxHp<=0||f.hp<0||f.hp>f.maxHp) return false;
      if(!Object.keys(f.items).every(k=>Object.hasOwn(RPG.ITEMS,k)||Object.hasOwn(RPG.RELICS,k)))return false;
      if(!Object.keys(f.components).every(k=>Object.hasOwn(RPG.COMPONENTS,k)))return false;
      if(f.pieces && (!Array.isArray(f.pieces)||!f.pieces.every(k=>RPG.LAPEACE_ORDER.includes(k))))return false;
      if(f.firstNightWins !== undefined && (!Array.isArray(f.firstNightWins) || f.firstNightWins.length > RPG.NPC_ROSTER.length || new Set(f.firstNightWins).size !== f.firstNightWins.length || !f.firstNightWins.every(id=>RPG.NPC_ROSTER.some(n=>n.id===id))))return false;
      for(const key of ['darkDetermination','darkCoreClaimed','escapedWillOwned']) if(f[key] !== undefined && typeof f[key] !== 'boolean')return false;
      if(f.escapedOutcome !== undefined && !['won','lost'].includes(f.escapedOutcome))return false;
      if(f.trustRewards !== undefined && (!object(f.trustRewards) ||
        !Object.entries(f.trustRewards).every(([k,v])=>['understanding','battlePromise','battleMastery'].includes(k) && v===true)))return false;
      if(f.talents && !object(f.talents))return false;
      if(f.equip && (!object(f.equip)||!Object.values(f.equip).every(k=>!k||Object.hasOwn(RPG.EQUIPMENT,k))))return false;
      if(f.quests && (!object(f.quests)||!Object.values(f.quests).every(q=>object(q)&&Number.isInteger(q.step)&&q.step>=0)))return false;
    }
    for(const key of ['activeEvents','scavenge','npcRoom','talked','duelDone','scouted','traps','npcDebuff']) if(!object(s[key])) return false;
    if(!Object.keys(s.activeEvents).every(k=>rooms.includes(k) && object(s.activeEvents[k]) && Number.isFinite(s.activeEvents[k].deadline))) return false;
    if(!Object.values(s.npcRoom).every(k=>rooms.includes(k))) return false;
    if(!Object.entries(s.scavenge).every(([room,k])=>rooms.includes(room)&&typeof k==='string'&&(Object.hasOwn(RPG.ITEMS,k)||Object.hasOwn(RPG.COMPONENTS,k)||(k.startsWith('lapeace:')&&RPG.LAPEACE_ORDER.includes(k.slice(8))))))return false;
    if(s.monsterRoom && !rooms.includes(s.monsterRoom)) return false;
    if(s.lastSeenRoom && !rooms.includes(s.lastSeenRoom)) return false;
    if(s.mod && !['blackout','midterm','fog','bloodmoon'].includes(s.mod)) return false;
    if(s.guardians && (!object(s.guardians) || !Object.entries(s.guardians).every(([k,g])=>rooms.includes(k)&&object(g)&&global.RPG.MOB_KINDS[g.kind]))) return false;
    if(data.story && (!object(data.story) || !object(data.story.flags) || !object(data.story.stage))) return false;
    if(data.story?.history && (!Array.isArray(data.story.history)||!data.story.history.every(l=>object(l)&&typeof l.speaker==='string'&&typeof l.text==='string'&&Number.isInteger(l.chapter)&&Number.isInteger(l.night))))return false;
    return true;
  }
  function parse(raw){
    try {
      const data=JSON.parse(raw, (key,value)=>['__proto__','prototype','constructor'].includes(key)?undefined:value);
      return valid(data)?data:null;
    } catch { return null; }
  }
  function create(storage){
    function read(key=SAVE){
      try { return parse(storage.getItem(key)) || (key===SAVE ? parse(storage.getItem(BACKUP)) : null); }
      catch { return null; }
    }
    function write(data,key=SAVE){
      if(!valid(data)) return false;
      try {
        const raw=JSON.stringify(data), previous=storage.getItem(key);
        if(key===SAVE && parse(previous)) {
          try { storage.setItem(BACKUP,previous); } catch { /* A full quota must not prevent replacing the main save. */ }
        }
        storage.setItem(key,raw);
        return true;
      } catch { return false; }
    }
    function clear(){
      try { [SAVE,CHECKPOINT,BACKUP].forEach(k=>storage.removeItem(k)); return true; } catch { return false; }
    }
    function migrate(session){
      try {
        if(storage.getItem('tiu_solo_migrated_v1'))return;
        for(const key of [SAVE,CHECKPOINT]) {
          const old=parse(session.getItem(key)), current=read(key);
          if(old && (!current || old.savedAt>current.savedAt) && !write(old,key))return;
        }
        for(const key of ['tiu_endings','tiu_bad_endings','tiu_tut_done']) {
          const old=JSON.parse(session.getItem(key)||'null');
          if(!old) continue;
          const current=JSON.parse(storage.getItem(key)||'null');
          const merged=Array.isArray(old)?[...new Set([...(Array.isArray(current)?current:[]),...old])]:Object.assign({},current||{},old);
          storage.setItem(key,JSON.stringify(merged));
        }
        storage.setItem('tiu_solo_migrated_v1','1');
      } catch { /* Keep legacy data untouched if storage is unavailable. */ }
    }
    return {read,write,clear,migrate};
  }
  global.TiuSaveStore={SAVE,CHECKPOINT,BACKUP,valid,parse,create};
  if(typeof module!=='undefined') module.exports=global.TiuSaveStore;
})(typeof window!=='undefined'?window:globalThis);
