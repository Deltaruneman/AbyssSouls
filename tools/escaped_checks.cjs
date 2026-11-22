const assert=require('node:assert/strict');
module.exports=async function({evaluate,key,click,waitFor,screenshot,send,sleep,finishDialogue}){
  const base=await evaluate("JSON.parse(localStorage.getItem('uit_savegame_v2'))");
  async function load(data,capture=false){
    await evaluate('if(S)S.running=false;localStorage.setItem("uit_savegame_v2",'+JSON.stringify(JSON.stringify(data))+')');
    await send('Page.reload');await waitFor("typeof TiuGame!=='undefined'");
    if(capture) await evaluate('window.secretCreate=RPGCombat.create;RPGCombat.create=function(o){window.secretBattle=secretCreate(o);return secretBattle;}');
    await click('#continueBtn');
  }
  const ready=structuredClone(base);
  Object.assign(ready.state,{chapter:1,night:2,playerRoom:'E',tdRoom:null,gameMinutes:30,introPending:false,tiuOn:false,guardians:{},activeEvents:{},guardianPending:null,exhaustPending:false,partyLeavePending:null});
  Object.assign(ready.rpg.fighters.PLAYER,{darkDetermination:true,darkCoreClaimed:true,firstNightWins:['WIBU','LINH','TRONG','TOBY']});
  ready.rpg.fighters.PLAYER.items.dark_core=1;
  const noCore=structuredClone(ready);delete noCore.rpg.fighters.PLAYER.items.dark_core;
  await load(noCore);await waitFor('TiuGame.canExplore()');await sleep(200);assert(!await evaluate('S.escapedRooftop'),'No core must not teleport');
  for(const won of [false,true]){
    await load(ready,true);await waitFor('S.escapedRooftop && !document.querySelector("#vnOverlay").classList.contains("hidden")');
    assert.equal(await evaluate('document.querySelector("#roomTitle").textContent'),'SÂN THƯỢNG TÒA E');
    const savedAt=await evaluate('JSON.parse(localStorage.getItem("uit_savegame_v2")).savedAt');
    await evaluate('window.dispatchEvent(new Event("pagehide"))');
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("uit_savegame_v2")).savedAt'),savedAt,'Do not save partial rooftop dialogue');
    if(won)await screenshot('09-escaped-rooftop');
    await finishDialogue();await waitFor('isBattleActive()');
    assert.equal(await evaluate('secretBattle.opts.enemies[0].id'),'TheEscapedOne');
    assert.equal(await evaluate('secretBattle.opts.allies.length'),1,'Secret duel must be solo');
    assert.equal(await evaluate('secretBattle.dodge'),true);
    if(won)await screenshot('10-escaped-battle');
    // Force the outcome in the captured engine; use the real UI to settle and leave.
    // Engine tactics and damage are covered separately by regression.test.cjs.
    await evaluate('secretBattle.over=true;secretBattle.winner='+JSON.stringify(won?'A':'E')+';secretBattle.units.forEach(u=>{if(u.side!==secretBattle.winner){u.hp=0;u.alive=false;}})');
    for(let i=0;i<6;i++){
      if(await evaluate('document.querySelector("#mgTitle").textContent.includes('+JSON.stringify(won?'CHIẾN THẮNG':'THẤT BẠI')+') && !document.querySelector("#mgModal").classList.contains("hidden")'))break;
      await key('Enter');
    }
    await waitFor('!document.querySelector("#mgModal").classList.contains("hidden")');
    assert.equal(await evaluate('RPG.player().escapedOutcome'),won?'won':'lost');
    if(won) assert.equal(await evaluate('RPG.player().equip.weapon'),'escaped_will');
    else assert(!await evaluate('RPG.player().escapedWillOwned'));
    await key('Enter');await finishDialogue();await waitFor('TiuGame.canExplore() && !S.escapedRooftop');
    assert.equal(await evaluate('S.playerRoom'),'E');
    const saved=await evaluate('JSON.parse(localStorage.getItem("uit_savegame_v2"))');
    assert.equal(saved.rpg.fighters.PLAYER.escapedOutcome,won?'won':'lost');
    assert(saved.story.history.some(l=>l.text.includes('Escape UIT')),'Easter egg must reach dialogue history');
    if(!won)assert(saved.story.history.some(l=>l.text.includes('thở dài thất vọng')));
    await load(saved);await waitFor('TiuGame.canExplore()');await sleep(250);assert(!await evaluate('S.escapedRooftop'),'Resolved encounter must not replay');
    if(won){
      await evaluate('RPG.player().equip.weapon="bat"');await key('b','KeyB');await click('#equipEscapedWill');
      assert.equal(await evaluate('RPG.player().equip.weapon'),'escaped_will');
      assert(await evaluate('document.querySelector("#mgBody").textContent.includes("Dark Determination")'));
      await key('b','KeyB');await waitFor('TiuGame.canExplore()');
    }
  }
  // An interrupted scene reloads the safe entrance and starts the encounter again.
  await load(ready);await waitFor('S.escapedRooftop');await send('Page.reload');await waitFor("typeof TiuGame!=='undefined'");await click('#continueBtn');await waitFor('S.escapedRooftop');
  await load(base);await waitFor('TiuGame.canExplore()');
  console.log('PASS: rooftop gating, solo secret boss, win/loss dialogue, weapon/re-equip, save protection and reload without duplicate encounters.');
};
