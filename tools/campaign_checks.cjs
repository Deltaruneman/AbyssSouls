const assert=require('node:assert/strict');
module.exports=async function({evaluate,key,click,waitFor,screenshot,send,sleep,finishDialogue,output}){
  const base=await evaluate(`JSON.parse(localStorage.getItem('uit_savegame_v2'))`);
  async function loadFixture(data){
    await evaluate(`if(S)S.running=false;localStorage.setItem('uit_savegame_v2',${JSON.stringify(JSON.stringify(data))})`);
    await send('Page.reload');await waitFor(`typeof TiuGame!=='undefined'`);await click('#continueBtn');
  }
  // Exercise actual file inputs, including rejection and explicit replacement.
  await key('Escape');await click('#pauseSettingsBtn');
  const fs=require('node:fs'),path=require('node:path');
  const bad=path.join(output,'invalid.json'),good=path.join(output,'journey.json');
  fs.writeFileSync(bad,'{"v":2,"state":{}}');fs.writeFileSync(good,JSON.stringify(base));
  const doc=await send('DOM.getDocument');
  const input=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#importSaveFile'});
  await send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[bad]});
  await waitFor("document.querySelector('#saveStatusText').textContent.includes('không hợp lệ')");
  assert.equal(await evaluate('S.playerRoom'),base.state.playerRoom);
  await send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[good]});
  await waitFor("document.querySelector('#mgTitle').textContent==='KHÔI PHỤC HÀNH TRÌNH?'");
  await key('2','Digit2');await waitFor('TiuGame.canExplore()');
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('uit_checkpoint_v2')).state.playerRoom"),base.state.playerRoom);
  // Pending chapter introductions replay on continue; the final checkpoint starts the finale.
  const intro=structuredClone(base);intro.state.introPending=true;
  await loadFixture(intro);await waitFor(`!document.querySelector('#vnOverlay').classList.contains('hidden')`);await finishDialogue();await waitFor(`TiuGame.canExplore()`);
  for(const room of ['A','B','C','D','E','LIB']){
    const data=structuredClone(base);Object.assign(data.state,{playerRoom:room,tdRoom:room,introPending:false,tiuOn:false,guardians:{},guardianPending:null,activeEvents:{[room]:{deadline:500}},npcRoom:{WIBU:'FIELD',LINH:'FIELD',TRONG:'FIELD',TOBY:'FIELD'},scavenge:{},gameMinutes:20});
    // Place the fixture on a real walkable square adjacent to the event terminal.
    const pos=await evaluate(`(()=>{const m=TD_MAPS[${JSON.stringify(room)}];const free=[];let target;for(let y=0;y<m.tiles.length;y++)for(let x=0;x<m.tiles[y].length;x++){if(m.tiles[y][x]===3&&!target)target=[x,y];if(m.tiles[y][x]===0)free.push([x,y]);}free.sort((a,b)=>Math.hypot(a[0]-m.tiles[0].length/2,a[1]-m.tiles.length/2)-Math.hypot(b[0]-m.tiles[0].length/2,b[1]-m.tiles.length/2));target=target||free[7%free.length];const spot=free.find(([x,y])=>Math.hypot(x-target[0],y-target[1])<=1.4);return spot&&spot.map(v=>v+.5);})()`);
    assert(pos,'Missing reachable event square '+room);[data.state.tdX,data.state.tdY]=pos;
    await loadFixture(data);await waitFor(`TiuGame.canExplore()`);await sleep(120);await key('e','KeyE');
    await waitFor(`document.querySelector('#mgModal').dataset.minigame==='1'`);
    const time=await evaluate('S.gameMinutes');await sleep(100);assert.equal(await evaluate('S.gameMinutes'),time,'World time runs in puzzle');
    if(room==='A'){
      for(let round=0;round<3;round++){
        const at=await evaluate(`Array.from(document.querySelectorAll('.stageCell')).findIndex(b=>b.classList.contains('odd'))`);
        for(let i=0;i<at;i++)await key('ArrowRight');await key('Enter');
      }
    }else if(room==='B'){
      const mismatches=await evaluate(`Array.from(document.querySelectorAll('.floorRow')).map((r,i)=>Array.from(r.querySelectorAll('.floorLamp')).map(l=>l.classList.contains('on'))).map((v,i)=>v[0]!==v[1]?i:-1).filter(i=>i>=0)`);
      for(const i of mismatches)await key(String(i+1),'Digit'+(i+1));
      await key('8','Digit8');
    }else if(room==='C'){
      const colors=await evaluate(`Array.from(document.querySelectorAll('#wireLeftCol button')).map(b=>b.title)`);
      for(const color of colors){
        for(const side of ['wireLeftCol','wireRightCol']){
          // Focus is the same DOM focus used by Tab; Enter exercises the game handler.
          await evaluate(`Array.from(document.querySelectorAll('#${side} button')).find(b=>b.title===${JSON.stringify(color)}).focus()`);await key('Enter');
        }
      }
    }else if(room==='D'){
      await key('Escape'); // Explicitly abandon, then ensure another Escape opens pause (listener cleaned up).
      await key('Escape');assert(await evaluate(`!document.querySelector('#pauseMenu').classList.contains('hidden')`));await key('Escape');
    }else if(room==='E'){
      const pattern=await evaluate(`Array.from(document.querySelector('#arrowSeq').children).map(n=>n.textContent)`);
      for(const sym of pattern)await key({'↑':'w','↓':'s','←':'a','→':'d'}[sym]);
    }else if(room==='LIB'){
      for(let n=1;n<=6;n++){await evaluate(`Array.from(document.querySelectorAll('.bookTile')).find(b=>b.textContent===${JSON.stringify(String(n))}).focus()`);await key('Enter');}
    }
    await waitFor(`document.querySelector('#mgModal').classList.contains('hidden') && !S.paused`);
    assert(await evaluate(`!S.activeEvents[${JSON.stringify(room)}]`));
    assert.equal(await evaluate('RPG.player().drl'),base.rpg.fighters.PLAYER.drl+(room==='D'?0:6),'Puzzle reward '+room);
  }
  // Lose a night and verify retry really restores the checkpoint and its intro.
  const losing=structuredClone(base);Object.assign(losing.state,{gameMinutes:449.9,introPending:false,tiuOn:false,guardians:{},activeEvents:{}});
  losing.rpg.fighters.PLAYER.drl=0;
  for(const f of Object.values(losing.rpg.fighters))if(!f.isPlayer)f.drl=100;
  const checkpoint=structuredClone(base);checkpoint.state.introPending=true;checkpoint.state.gameMinutes=0;
  await evaluate('localStorage.setItem("uit_checkpoint_v2",'+JSON.stringify(JSON.stringify(checkpoint))+')');
  await loadFixture(losing);await waitFor("!document.querySelector('#gameOverScreen').classList.contains('hidden')");
  await key('Enter');await waitFor("!document.querySelector('#vnOverlay').classList.contains('hidden')");
  assert.equal(await evaluate('RPG.player().drl'),base.rpg.fighters.PLAYER.drl);
  await finishDialogue();await waitFor('TiuGame.canExplore()');
  // Read real input handling in combat, including the shared QTE host.
  const final=structuredClone(base);Object.assign(final.state,{chapter:2,night:2,introPending:false,final:false,tiuOn:false,activeEvents:{},guardians:{}});
  await loadFixture(final);await finishDialogue();await waitFor(`isBattleActive()`);await screenshot('07-battle');
  const savedAt=await evaluate(`JSON.parse(localStorage.getItem('uit_savegame_v2')).savedAt`);
  await key('f','KeyF');
  for(let i=0;i<18;i++){
    if(await evaluate(`document.querySelector('#pkMenu').querySelectorAll('button').length>0`))break;
    await key('Enter');
  }
  assert(await evaluate(`document.querySelector('#pkMenu').querySelectorAll('button').length>0`),'Combat menu did not open');
  await key('1','Digit1'); // Basic attack, then target if required.
  for(let i=0;i<30;i++){
    if(await evaluate(`!document.querySelector('#dodgeOverlay').classList.contains('hidden')`))break;
    await key('Enter');
  }
  assert(await evaluate(`!document.querySelector('#dodgeOverlay').classList.contains('hidden')`),'Final battle QTE did not appear');
  await screenshot('08-qte');await key('ArrowUp');
  await evaluate(`window.dispatchEvent(new Event('pagehide'))`);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('uit_savegame_v2')).savedAt`),savedAt,'Partial battle overwrote safe save');
  // Reset to the ordinary journey for responsive layout checks.
  await loadFixture(base);await waitFor(`TiuGame.canExplore()`);
  console.log('PASS: import validation/restore, night failure/retry, chapter replay, six puzzle types with keyboard, puzzle rewards/cancel cleanup, final checkpoint, combat input, QTE and battle save protection.');
};
