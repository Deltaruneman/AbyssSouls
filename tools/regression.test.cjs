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

function settledFight(me,foes,winner,context={chapter:1,night:1}){
  const B=Combat.create({allies:[me],enemies:foes,...context});
  B.over=true;B.winner=winner;
  for(const u of B.units)if(u.side!==winner){u.hp=0;u.alive=false;}
  return {B,result:Combat.settle(B)};
}
test('Dark Determination requires four distinct first-night NPC victories, never losses or simulations',()=>{
  fixture();let me=RPG.player();
  settledFight(me,[RPG.get('WIBU')],'E');assert(!me.darkDetermination);assert(!me.firstNightWins);
  settledFight(me,[RPG.get('WIBU')],'A');settledFight(me,[RPG.get('WIBU')],'A');
  assert.deepEqual(me.firstNightWins,['WIBU']);
  settledFight(me,[RPG.get('LINH')],'A',{chapter:1,night:2});
  settledFight(me,[RPG.get('LINH')],'A',{chapter:2,night:1});
  assert.deepEqual(me.firstNightWins,['WIBU']);
  settledFight(me,[RPG.makeTiu(1)],'A');assert.deepEqual(me.firstNightWins,['WIBU']);assert(!me.items.dark_core);
  settledFight(me,[RPG.get('LINH'),RPG.get('TRONG')],'A');assert(!me.darkDetermination);
  const data=fixture();data.rpg.fighters.PLAYER.firstNightWins=['WIBU','LINH','TRONG'];
  assert(Saves.valid(data));RPG.load(data.rpg);me=RPG.player();
  RPG.simulateNpcNight();assert(!me.darkDetermination);
  const {B,result}=settledFight(me,[RPG.get('TOBY')],'A');assert.equal(result.darkDetermination,true);assert.equal(me.darkDetermination,true);
  const saved=RPG.serialize();assert.equal(Combat.settle(B),null);assert.deepEqual(RPG.serialize(),saved);
});
test('Dark Determination multiplies damage exactly once and survives serialization',()=>{
  fixture();let me=RPG.player();
  const B=Combat.create({allies:[me],enemies:[RPG.get('WIBU')],rng:()=>0.5}),src=B.units[0],dst=B.units[1];
  const normal=Combat.calcDamage(src,dst,1,{basic:true});me.darkDetermination=true;
  assert.equal(Combat.calcDamage(src,dst,1,{basic:true}),normal*1.25);
  const summon={isSummon:true,owner:src,atkPct:0.5,dmgMult:1};
  const buffed=Combat.calcDamage(summon,dst,1);me.darkDetermination=false;
  assert.equal(buffed,Combat.calcDamage(summon,dst,1)*1.25);
  me.darkDetermination=true;RPG.load(RPG.serialize());assert.equal(RPG.player().darkDetermination,true);
});
test('Dark Core requires a patrol TIU victory with the buff and can only be awarded once',()=>{
  fixture();const me=RPG.player();
  settledFight(me,[RPG.makeTiu(1)],'A');assert(!me.items.dark_core);
  me.darkDetermination=true;
  settledFight(me,[RPG.makeTiu(1)],'E');assert(!me.items.dark_core);
  settledFight(me,[RPG.makeTiu(1)],'A',{chapter:2,night:2,final:true});assert(!me.items.dark_core);
  assert.equal(settledFight(me,[RPG.makeTiu(1)],'A').result.darkCore,true);
  assert.equal(me.items.dark_core,1);assert.equal(me.darkCoreClaimed,true);
  settledFight(me,[RPG.makeTiu(1)],'A');assert.equal(me.items.dark_core,1);
});
test('secret duel resolves once; loss grants nothing and victory equips a non-craftable weapon',()=>{
  for(const won of [false,true]){
    const data=fixture(),me=RPG.player();me.darkDetermination=true;RPG.awardDarkCore(me);
    const before=me.drl, {B,result}=settledFight(me,[RPG.makeEscapedOne(me.level)],won?'A':'E');
    assert(result.duels[0].escapedOne);assert.equal(me.escapedOutcome,won?'won':'lost');assert.equal(me.drl,before);
    assert.equal(me.equip?.weapon,won?'escaped_will':undefined);assert.equal(RPG.canMeetEscapedOne(me),false);
    assert.equal(RPG.resolveEscapedOne(me,!won),false);assert.equal(Combat.settle(B),null);
    assert.equal(RPG.canCraftEquip(me,'escaped_will'),false);
    if(won){me.equip.weapon='bat';assert(RPG.equipEscapedWill(me));assert.equal(RPG.equipBonus(me,'atk'),24);delete me.escapedOutcome;assert(RPG.equipEscapedWill(me),'NG+ ownership permits re-equipping');}
    data.rpg=RPG.serialize();assert(Saves.valid(data));RPG.load(data.rpg);assert.equal(RPG.player().items.dark_core,1);
  }
  fixture();assert.equal(RPG.equipEscapedWill(RPG.player()),false);assert.equal(RPG.resolveEscapedOne(RPG.player(),true),false);
});
test('secret quest save fields reject malformed values without breaking legacy saves',()=>{
  const good=fixture();assert(Saves.valid(good));
  for(const [key,value] of [['firstNightWins',{}],['firstNightWins',['WIBU','WIBU']],['firstNightWins',['TIU']],['darkDetermination','true'],['darkCoreClaimed',1],['escapedOutcome','pending'],['escapedWillOwned',{}]]){
    const bad=clone(good);bad.rpg.fighters.PLAYER[key]=value;assert.equal(Saves.valid(bad),false,key);
  }
});
test('all classes can complete secret boss combat without invalid state',()=>{
  for(const classId of RPG.CLASS_IDS)for(const level of [1,5,8]){
    const rng=seeded(level+classId.length);RPG.init({playerClass:classId,rng});const me=RPG.player();RPG.forceLevel(me,level);
    me.darkDetermination=true;RPG.awardDarkCore(me);
    const B=Combat.create({allies:[me],enemies:[RPG.makeEscapedOne(level)],autoPlayer:true,rng});Combat.autoBattle(B);
    assert(B.over);for(const u of B.units)assert(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp);
    Combat.settle(B);assert(['won','lost'].includes(me.escapedOutcome));
  }
});
