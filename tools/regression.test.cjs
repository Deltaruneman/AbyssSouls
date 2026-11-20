const assert=require('node:assert/strict');
const {test}=require('node:test');
const RPG=require('../src/rpg_core.js');
const Combat=require('../src/rpg_combat.js');
const Saves=require('../src/save_store.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
function fixture(){
  RPG.init({playerName:'Hành trình',playerClass:'fighter'});
  return {v:2,savedAt:1,rpg:RPG.serialize(),story:{flags:{},stage:{}},state:{chapter:1,night:1,playerRoom:'A',gameMinutes:20,log:[],activeEvents:{},scavenge:{},npcRoom:{},talked:{},duelDone:{},scouted:{},traps:{},npcDebuff:{}}};
}
test('old v2 saves remain readable; a damaged primary recovers the last valid save',()=>{
  const storage=memory(),store=Saves.create(storage),first=fixture(),second=clone(first);second.savedAt=2;
  assert(store.write(first));assert(store.write(second));storage.setItem(Saves.SAVE,'{broken');assert.deepEqual(store.read(),first);
});
test('invalid saves never overwrite a working journey',()=>{
  const storage=memory(),store=Saves.create(storage),good=fixture();store.write(good);
  for(const mutate of [x=>x.state.playerRoom='nowhere',x=>x.rpg.fighters.PLAYER.classId='missing',x=>x.rpg.fighters.PLAYER.hp=null,x=>x.rpg.fighters.PLAYER.items.water=-1,x=>delete x.rpg.fighters.WIBU,x=>x.state.log=[null],x=>x.state.guardians={A:{kind:'unknown'}},x=>x.story.history=[null],x=>x.rpg.fighters.PLAYER.items.unknown=1,x=>x.state.scavenge={A:{}} ]){
    const bad=clone(good);mutate(bad);assert.equal(store.write(bad),false);assert.deepEqual(store.read(),good);
  }
  assert.equal(Saves.parse('not-json'),null);
});
test('storage errors are reported and backup quota failure still permits primary replacement',()=>{
  const blocked=Saves.create({getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}});
  assert.equal(blocked.write(fixture()),false);assert.equal(blocked.read(),null);assert.equal(blocked.clear(),false);
  const storage=memory(),store=Saves.create(storage);store.write(fixture());const set=storage.setItem;
  storage.setItem=(k,v)=>{if(k===Saves.BACKUP)throw Error('quota');set(k,v);};
  const next=fixture();next.savedAt=20;assert(store.write(next));assert.equal(store.read().savedAt,20);
});
test('legacy tab progress migrates without deleting it or replacing newer local progress',()=>{
  const local=memory(),session=memory(),store=Saves.create(local),old=fixture(),newer=fixture();newer.savedAt=100;
  local.setItem('tiu_endings','["normal"]');session.setItem('tiu_endings','["alone"]');
  session.setItem(Saves.SAVE,JSON.stringify(old));store.migrate(session);assert.deepEqual(store.read(),old);assert(session.getItem(Saves.SAVE));
  store.write(newer);store.migrate(session);assert.deepEqual(store.read(),newer);
  assert.deepEqual(JSON.parse(local.getItem('tiu_endings')),['normal','alone']);
  store.clear();store.migrate(session);assert.equal(store.read(),null,'Deleted saves must not be reimported');
});
test('deleting a journey also removes fallback and checkpoint, preserving ending unlocks',()=>{
  const storage=memory(),store=Saves.create(storage),data=fixture();store.write(data);store.write(data);store.write(data,Saves.CHECKPOINT);
  storage.setItem('tiu_endings','["normal"]');assert(store.clear());assert.equal(store.read(),null);assert.equal(store.read(Saves.CHECKPOINT),null);assert.equal(storage.getItem('tiu_endings'),'["normal"]');
});
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('all five classes complete NPC and boss combats at four progression levels',()=>{
  let battles=0;
  for(const classId of RPG.CLASS_IDS)for(const level of [1,3,5,8])for(const boss of [false,true])for(let trial=0;trial<3;trial++){
    const rng=seeded(++battles);RPG.init({playerClass:classId,rng});const me=RPG.player();RPG.forceLevel(me,level);RPG.autoTalents(me,3);
    const foe=boss?RPG.makeTiu(level,Math.min(3,trial)):RPG.get('WIBU');if(!boss)RPG.forceLevel(foe,level);
    const B=Combat.create({allies:[me],enemies:[foe],autoPlayer:true,rng});Combat.autoBattle(B);
    assert(B.over);assert(['A','E'].includes(B.winner));assert(B.round<=Combat.CC.MAX_ROUNDS+1);
    for(const u of B.units){assert(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp,`${classId} invalid HP`);assert(Number.isFinite(u.sp)&&u.sp>=0);}
    Combat.settle(B);assert(me.hp>=1&&me.hp<=me.maxHp);const after=RPG.serialize();Combat.settle(B);assert.deepEqual(RPG.serialize(),after,'Double settlement must not duplicate rewards');
  }
  assert.equal(battles,120);
});
