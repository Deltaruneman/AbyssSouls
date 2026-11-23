const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const RPG = require('../src/rpg_core.js');
const Combat = require('../src/rpg_combat.js');
const Saves = require('../src/save_store.js');

function fixture(cls='fighter', opts={}) {
  RPG.setRng(()=>0.5);
  RPG.init({playerName:'Tester', playerClass:cls});
  const me=RPG.player(), foe=RPG.get('WIBU');
  foe.statsOverride={hp:10000,atk:1,def:0,spd:1}; foe.maxHp=foe.hp=10000;
  const B=Combat.create({allies:[me], enemies:[foe], rng:()=>0.99, ...opts});
  return {B, me, foe, u:B.playerUnit, e:B.units.find(x=>x.side==='E')};
}
function act(B, action, enemyAction={type:'defend'}) {
  Combat.beginRound(B);
  B.units.filter(x=>x.side==='E').forEach(x=>{x.action=enemyAction;});
  assert.equal(Combat.submit(B,B.playerUnit.uid,action).ok,true);
  return Combat.runRound(B).events;
}
function damage(events, uid) {return events.filter(x=>x.type==='damage'&&x.src===uid).reduce((n,x)=>n+x.amount,0);}
function pledge(f, id='WIBU') {
  const {B,e}=f; e.id=id; e.f.id=id; B.round=2;
  assert.equal(Combat.chooseDialogue(B,e.uid,'promise').ok,true);
}
function end(B,winner='A') {B.over=true;B.winner=winner;return Combat.settle(B);}

test('fighter guard follow-up, delayed heavy strike and stamina validation',()=>{
  const {B,u,e}=fixture();
  const base=damage(act(B,{type:'attack',target:e.uid}),u.uid);
  act(B,{type:'defend'});
  assert(damage(act(B,{type:'attack',target:e.uid}),u.uid)>base);
  u.base.spd=10;e.base.spd=5;
  const events=act(B,{type:'attack',style:'heavy',target:e.uid},{type:'attack',target:u.uid});
  assert.equal(events.find(x=>x.type==='attack').src,e.uid,'heavy attack is slower');
  u.sp=0;
  assert.equal(Combat.submit(B,u.uid,{type:'attack',style:'heavy'}).ok,false);
  assert.equal(Combat.submit(B,u.uid,{type:'attack',style:'unknown'}).ok,false);
});
test('assassin chains grow on the same target and flurry consumes the chain',()=>{
  const {B,u,e}=fixture('assassin');
  const a=damage(act(B,{type:'attack',target:e.uid}),u.uid);
  const b=damage(act(B,{type:'attack',target:e.uid}),u.uid);
  assert(b>a);
  const events=act(B,{type:'attack',style:'flurry',target:e.uid});
  assert.equal(events.filter(x=>x.type==='damage'&&x.src===u.uid).length,2);
  assert.equal(u.chain,0);
  act(B,{type:'attack',target:e.uid});act(B,{type:'defend'});assert.equal(u.chain,0);
});
test('mage runes are target-specific, capped, and consumed by detonation',()=>{
  const {B,u,e}=fixture('mage');
  const base=damage(act(B,{type:'attack',target:e.uid}),u.uid);
  for(let i=0;i<4;i++)act(B,{type:'attack',target:e.uid});
  assert.equal(u.runes,3);
  assert(damage(act(B,{type:'attack',style:'detonate',target:e.uid}),u.uid)>base*2);
  assert.equal(u.runes,0);
});
test('healer restores health only on damaging siphon; summoner needs an attacker',()=>{
  let {B,u,e}=fixture('healer');u.hp=Math.floor(u.maxHp/2);const hp=u.hp;
  act(B,{type:'attack',style:'siphon',target:e.uid});assert(u.hp>hp);
  e.st.immune={turns:2,fresh:false};const healed=u.hp;
  act(B,{type:'attack',style:'siphon',target:e.uid});assert.equal(u.hp,healed);
  ({B,u,e}=fixture('summoner'));
  assert.equal(Combat.attackChoices(B,u)[0].ready,false);
  act(B,{type:'skill',id:'summonSword'});
  assert.equal(Combat.attackChoices(B,u)[0].ready,true);
  const events=act(B,{type:'attack',style:'command',target:e.uid});
  assert(events.some(x=>x.type==='damage'&&x.src!==u.uid));
});
test('dialogue choices buff/debuff once and expire after exactly two actions',()=>{
  let {B,e}=fixture();assert.equal(Combat.dialogue(B),null);B.round=2;
  assert.equal(Combat.chooseDialogue(B,e.uid,'read').ok,true);
  assert(Combat.eff(e,'atk')>e.base.atk);
  assert.equal(Combat.chooseDialogue(B,e.uid,'provoke').ok,false);
  act(B,{type:'defend'});act(B,{type:'defend'});
  assert.equal(Combat.eff(e,'atk'),e.base.atk);
  ({B,e}=fixture());B.round=2;B.known[e.id]=true;e.base.atk=100;
  Combat.chooseDialogue(B,e.uid,'read');assert.equal(Combat.eff(e,'atk'),85);
  ({B,e}=fixture());B.round=2;e.base.atk=100;e.base.def=100;
  Combat.chooseDialogue(B,e.uid,'provoke');assert.equal(Combat.eff(e,'atk'),120);assert.equal(Combat.eff(e,'def'),85);
});
test('all regular encounter types use new rules; secret and final battles retain legacy behavior',()=>{
  for(const enemies of [()=>[RPG.get('WIBU')],()=>[RPG.makeTiu(3)],()=>RPG.makeMobGroup('guard',3)]){
    fixture();const B=Combat.create({allies:[RPG.player()],enemies:enemies()});
    assert.equal(B.distinct,true);
    B.round=2;assert(Combat.dialogue(B));
  }
  for(const opts of [{final:true},{chapter:2,night:2},{escapedOne:true},{distinctCombat:false}]){
    const {B,u}=fixture('mage',opts);B.round=2;
    assert.equal(B.distinct,false);assert.equal(Combat.dialogue(B),null);assert.equal(Combat.attackChoices(B,u).length,0);
  }
  fixture();const B=Combat.create({allies:[RPG.player()],enemies:[RPG.makeEscapedOne(3)]});assert.equal(B.distinct,false);
});
test('secret and final simulations produce identical combat logs to explicitly disabled new mechanics',()=>{
  function simulate(secret,disabled){
    RPG.setRng(()=>0.5);RPG.init({playerName:'Tester',playerClass:'mage'});
    const me=RPG.player();RPG.forceLevel(me,8);me.hp=me.maxHp;
    let seed=12;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    const B=Combat.create({allies:[me],enemies:[secret?RPG.makeEscapedOne(8):RPG.makeTiu(8)],final:!secret,dodge:true,autoPlayer:true,rng,...(disabled?{distinctCombat:false}:{})});
    Combat.autoBattle(B);return JSON.stringify({winner:B.winner,log:B.log,hp:B.units.map(u=>u.hp)});
  }
  for(const secret of [false,true])assert.equal(simulate(secret,false),simulate(secret,true));
});
test('promise rewards require victory and conditions; no repeat rewards after save/load',()=>{
  let f=fixture();pledge(f);act(f.B,{type:'defend'});end(f.B);assert.equal(f.foe.trust,0);
  f=fixture();pledge(f);act(f.B,{type:'defend'});act(f.B,{type:'defend'});
  const result=end(f.B);assert.equal(f.foe.trust,1);assert(result.relationships[0].includes('+1'));
  assert.equal(Combat.settle(f.B),null);
  RPG.load(RPG.serialize());const foe=RPG.get('WIBU');assert.equal(foe.trustRewards.battlePromise,true);
  const B=Combat.create({allies:[RPG.player()],enemies:[foe],rng:()=>0.99});B.round=2;Combat.chooseDialogue(B,B.units[1].uid,'promise');
  act(B,{type:'defend'});act(B,{type:'defend'});end(B);assert.equal(foe.trust,1);
  f=fixture();pledge(f);act(f.B,{type:'defend'});act(f.B,{type:'defend'});end(f.B,'E');assert.equal(f.foe.trust,0);
});
test('broken promises penalize once; mastery needs low HP and no skip after pledge',()=>{
  let f=fixture();f.foe.trust=2;pledge(f);
  const id=Object.keys(RPG.ITEMS).find(k=>RPG.ITEMS[k].usable.includes('combat'));
  RPG.addItem(f.me,id,2);act(f.B,{type:'item',id});act(f.B,{type:'item',id});end(f.B);assert.equal(f.foe.trust,1);
  for(const skipped of [false,true]){
    f=fixture();pledge(f);act(f.B,{type:'defend',skipped});act(f.B,{type:'defend'});f.u.hp=Math.floor(f.u.maxHp*0.3);
    end(f.B);assert.equal(f.foe.trust,skipped?1:2);
  }
});
test('Trọng promise forbids ultimates and Linh requires two subsequent rounds',()=>{
  let f=fixture();pledge(f,'TRONG');RPG.forceLevel(f.me,8);f.u.rage=RPG.CFG.RAGE_MAX;
  act(f.B,{type:'ultimate',quality:1});end(f.B);assert.equal(f.foe.trust||0,0);assert.equal(f.B.promises[0].broken,true);
  f=fixture();pledge(f,'LINH');act(f.B,{type:'attack',target:f.e.uid});end(f.B);assert.equal(f.foe.trust,0);
  f=fixture();pledge(f,'LINH');act(f.B,{type:'attack',target:f.e.uid});act(f.B,{type:'attack',target:f.e.uid});end(f.B);assert.equal(f.foe.trust,1);
});
test('small talk and repeated dialogue cannot farm trust; old progress remains intact',()=>{
  const {foe}=fixture();for(let i=0;i<10;i++)RPG.talk(foe);assert.equal(foe.trust,0);
  assert.equal(RPG.dialogueTrust(foe,{trust:1},3),0);
  assert.equal(RPG.dialogueTrust(foe,{trust:1,flag:'heard'},1),0);
  assert.equal(RPG.dialogueTrust(foe,{trust:1,set:{promised_WIBU:true}},4),0);
  assert.equal(RPG.dialogueTrust(foe,{trust:1,flag:'heard'},2),1);
  assert.equal(RPG.dialogueTrust(foe,{trust:1,flag:'heard_again'},3),0);
  foe.trust=3;RPG.load(RPG.serialize());assert.equal(RPG.get('WIBU').trust,3);
});

// Execute the production QTE with a deterministic clock and minimal DOM, covering
// actual keyboard/button callbacks, timing scores and the feint animation loop.
function qteHarness(opts={}){
  let now=0,next=1,frame=null,pickIndex=0,result=null;
  const timers=new Map(),listeners={},els=new Map();
  function el(id){if(!els.has(id))els.set(id,{style:{},textContent:'',innerHTML:'',appendChild(){}});return els.get(id);}
  const buttons=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].map(dir=>({dataset:{dir}}));
  const host={innerHTML:'',querySelector:s=>el(s),querySelectorAll:()=>buttons};
  const ctx={QTE:null,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),pick:keys=>keys[(pickIndex++)%keys.length],
    ARROW_KEYS:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'],ARROW_GLYPHS:{ArrowUp:'↑',ArrowRight:'→',ArrowDown:'↓',ArrowLeft:'←'},
    QTE_KEYMAP:{ArrowUp:'ArrowUp',ArrowRight:'ArrowRight',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',w:'ArrowUp',q:undefined},
    qteEnsureHost:()=>host,qteReleaseHost(){},performance:{now:()=>now},
    Math:Object.assign(Object.create(Math),{random:()=>0}),
    document:{getElementById:id=>el(id),createElement:()=>el('dot'+next++),addEventListener:(k,fn)=>listeners[k]=fn,removeEventListener:k=>delete listeners[k]},
    setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame:()=>{frame=null;}};
  vm.createContext(ctx);
  const source=fs.readFileSync(require.resolve('../src/script.js'),'utf8');
  vm.runInContext(source.slice(source.indexOf('function runArrowQte(opts){'),source.indexOf('/* ---- PHÒNG THỦ: độ phức tạp')),ctx);
  ctx.runArrowQte({mode:'attack',count:1,windowMs:1000,parryWidth:0.4,fixedZone:true,weightedTiming:true,allowSkip:true,onDone:r=>result=r,...opts});
  function timer(ms){const entry=[...timers].find(([,v])=>v.ms===ms);assert(entry,'timer '+ms);timers.delete(entry[0]);entry[1].fn();}
  return {ctx,buttons,els,timer,get result(){return result;},time:n=>{now=n;},frame:n=>{now=n;const fn=frame;assert(fn);fn(n);},
    key:key=>listeners.keydown?.({key,preventDefault(){},stopPropagation(){}})};
}
test('QTE skip keyboard and button both return deterministic 70% quality threshold exactly once',()=>{
  for(const button of [false,true]){
    const h=qteHarness();if(button)h.els.get('#qteSkipBtn').onclick();else h.key('q');
    h.timer(420);assert.equal(h.result.accuracy,0.4);assert.equal(h.result.skipped,true);assert.equal(h.ctx.QTE,null);
  }
});
test('QTE timing distinguishes perfect from early direction and follows the class sequence',()=>{
  for(const [ms,expected] of [[500,1],[100,0.5]]){
    const h=qteHarness({sequence:['ArrowUp']});h.timer(650);h.time(ms);h.key('w');h.timer(380);h.timer(420);
    assert.equal(h.result.accuracy,expected);assert.equal(h.result.skipped,false);
  }
});
test('ordinary feints warn before changing direction and restart the response window',()=>{
  const h=qteHarness({feintChance:1,fairFeint:true});h.timer(650);h.frame(200);
  assert.match(h.els.get('#qteFeedback').textContent,/SẮP ĐỔI/);
  h.frame(380);assert.equal(h.ctx.QTE.feinted,true);assert.equal(h.ctx.QTE.shownAt,380);
  h.time(880);h.key('ArrowRight');h.timer(380);h.timer(420);assert.equal(h.result.accuracy,1);
});

test('feint response window also survives a delayed animation frame',()=>{
  const h=qteHarness({feintChance:1,fairFeint:true});h.timer(650);h.frame(1500);
  assert.equal(h.ctx.QTE.locked,false);assert.equal(h.ctx.QTE.shownAt,1500);
  h.time(2000);h.key('ArrowRight');h.timer(380);h.timer(420);assert.equal(h.result.accuracy,1);
});
test('skip executes damaging ultimate at deterministic 70% instead of failing quality',()=>{
  function cast(skipped,quality){
    const f=fixture('mage');RPG.forceLevel(f.me,8);f.u.rage=RPG.CFG.RAGE_MAX;
    return damage(act(f.B,{type:'ultimate',skipped,quality,target:f.e.uid}),f.u.uid);
  }
  assert.equal(cast(false,0),0);
  assert(cast(true,0)>0);
  assert.equal(cast(true,0),cast(true,1));
  assert(Math.abs(cast(true,0)/cast(false,1)-0.7)<0.02);
});
function uiHarness(f,names){
  const source=fs.readFileSync(require.resolve('../src/script.js'),'utf8');
  const ctx={RPG,RPGCombat:Combat,BATTLE:{B:f.B,closed:false},QTE_COUNT:{},ARROW_GLYPHS:{ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'},
    TARGET_LABEL:{},pkPrompt(){},pkActive(){},renderBattle(){},battlePromptNext(){ctx.advanced=true;},
    pkMenuSet:(mode,items)=>{ctx.mode=mode;ctx.items=items;},
    pickTarget:(u,kind,cb)=>cb(f.e.uid),commit:(uid,action)=>{ctx.action=action;},
    runArrowQte:opts=>{ctx.qte=opts;},$:()=>({innerHTML:''})};
  vm.createContext(ctx);
  names.forEach(name=>{
    const start=source.indexOf('function '+name+'('),next=source.indexOf('\nfunction ',start+1);
    vm.runInContext(source.slice(start,next),ctx);
  });
  return ctx;
}
test('production UI exposes attack style and applies dialogue before returning to commands',()=>{
  const f=fixture();const ctx=uiHarness(f,['showFightMenu','battleDialogue']);
  ctx.showFightMenu(f.u.uid);assert.equal(ctx.mode,'fight');
  ctx.items.find(i=>i.label==='Trọng kích').onClick();assert.equal(ctx.action.style,'heavy');
  f.B.round=2;ctx.battleDialogue();assert.equal(ctx.mode,'dialogue');
  ctx.items.find(i=>i.label==='Cam kết đấu công bằng').onClick();assert.equal(ctx.advanced,true);assert.equal(f.B.promises.length,1);
});
test('production ultimate UI selects class rhythm only outside excluded bosses',()=>{
  for(const excluded of [false,true]){
    const f=fixture('mage',{final:excluded}),ctx=uiHarness(f,['castWithQte']);
    ctx.castWithQte(f.u.uid,'ultimate',RPG.getUltimate(f.me));
    assert.equal(ctx.qte.count,excluded?5:4);assert.equal(ctx.qte.weightedTiming,!excluded);
    ctx.qte.onDone({accuracy:0.4,skipped:true});assert.equal(ctx.action.skipped,true);
  }
});
