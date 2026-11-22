// Browser regression smoke test with no npm dependencies. Requires Chromium/Edge.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const http=require('node:http'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const output=fs.mkdtempSync(path.join(os.tmpdir(),'tiu-smoke-'));
let browser,server,ws,seq=0; const pending=new Map(),errors=[],requests=[];
function send(method,params={}){
  return new Promise((resolve,reject)=>{const id=++seq; const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression,timeout=10000){const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await sleep(60);}throw new Error('Timed out: '+expression);}
async function key(key,code=key){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:({Enter:13,Escape:27,Tab:9,ArrowDown:40,ArrowUp:38,ArrowLeft:37,ArrowRight:39,Control:17,' ':32}[key]||0)});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});await sleep(100);}
async function click(selector){assert(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`),'Missing '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(100);}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));}
async function finishDialogue(){for(let i=0;i<120;i++) {if(await evaluate(`document.querySelector('#vnOverlay').classList.contains('hidden')`))return;await key('Control','ControlLeft');if(await evaluate(`!document.querySelector('#vnChoices').classList.contains('hidden')`))await key('1','Digit1');}throw new Error('Dialogue did not finish');}
async function run(){
  server=http.createServer((req,res)=>{
    let relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(data);});
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}`;
  const executable=process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  browser=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-allow-origins=*',`--user-data-dir=${path.join(output,'profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
  browser.on('error',e=>{console.error(e);process.exitCode=1;});
  const portfile=path.join(output,'profile','DevToolsActivePort');
  for(let i=0;i<100&&!fs.existsSync(portfile);i++)await sleep(100);
  assert(fs.existsSync(portfile),'Browser failed to start');
  const port=fs.readFileSync(portfile,'utf8').split('\n')[0];
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
  await new Promise((r,j)=>{ws.addEventListener('open',r);ws.addEventListener('error',j);});
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});
  await waitFor(`typeof TiuGame!=='undefined'`);
  await evaluate(`localStorage.setItem('tiu_tut_done',JSON.stringify({basic:true,battle:true,talent:true,events:true,social:true,gear:true}));`);
  assert(await evaluate(`!document.querySelector('#titleScreen').classList.contains('hidden')`));
  assert(await evaluate(`document.querySelectorAll('#accessGate,#arenaBtn').length===0`));
  await screenshot('01-title');
  // Start entirely from keyboard, including the name field and class quiz.
  await key('Enter');await waitFor(`document.activeElement.id==='playerNameInput'`);
  await send('Input.insertText',{text:'Người Lữ Hành'});await key('Enter');
  await waitFor(`document.querySelector('#mgTitle').textContent.includes('TRẮC NGHIỆM')`);
  for(let i=0;i<15;i++){
    if(await evaluate(`document.querySelector('#mgTitle').textContent.includes('CLASS CỦA BẠN')`))break;
    await key('1','Digit1');
  }
  await key('Enter');await waitFor(`!document.querySelector('#vnOverlay').classList.contains('hidden')`);
  // Enter/Space must actually reveal/advance the IIFE-owned dialogue controller.
  const initial=await evaluate(`document.querySelector('#vnText').textContent`);
  await key('Enter');await key(' ' ,'Space');
  assert.notEqual(await evaluate(`document.querySelector('#vnText').textContent`),initial,'Dialogue Enter/Space did not advance');
  await finishDialogue();await waitFor(`TiuGame.canExplore()`);
  await screenshot('02-exploration');
  const storyCount=await evaluate(`JSON.parse(localStorage.getItem('uit_savegame_v2')).story.history?.length||0`);
  await key('q','KeyQ');assert(await evaluate(`document.querySelector('#mgTitle').textContent.includes('NHẬT KÝ HÀNH TRÌNH')`));
  assert(await evaluate(`document.querySelectorAll('.journalLine').length>0`));
  await screenshot('03-journal');await key('q','KeyQ');await waitFor(`TiuGame.canExplore()`);
  await evaluate(`S.guardians={};S.tiuOn=false`);
  await key('m','KeyM');assert(await evaluate(`S.paused && !document.querySelector('#mapModal').classList.contains('hidden')`));
  const mapTime=await evaluate(`S.gameMinutes`);await sleep(300);assert.equal(await evaluate('S.gameMinutes'),mapTime,'Map must pause time');
  const oldRoom=await evaluate('S.playerRoom');await key('Enter');await waitFor(`S.playerRoom!==${JSON.stringify(oldRoom)}`,12000);
  await waitFor(`TiuGame.canExplore()`,12000);
  await key('Escape');assert(await evaluate(`!document.querySelector('#pauseMenu').classList.contains('hidden') && S.paused`));
  await click('#pauseSaveBtn');assert(await evaluate(`document.querySelector('#pauseSaveStatus').textContent.includes('Đã lưu')`));
  const savedRoom=await evaluate('S.playerRoom');
  await click('#pauseSettingsBtn');await screenshot('04-settings');
  await click('#exportSaveBtn');
  await click('#deleteSaveBtn');await key('Escape');
  assert(await evaluate(`!!localStorage.getItem('uit_savegame_v2') && document.querySelector('#mgModal').classList.contains('hidden') && S.paused`),'Cancel delete must preserve paused game');
  await key('Escape');await key('Escape');await waitFor(`TiuGame.canExplore()`);
  await evaluate(`window.dispatchEvent(new Event('blur'))`);
  assert(await evaluate(`S.paused && !document.querySelector('#pauseMenu').classList.contains('hidden')`),'Blur must pause');
  await key('Escape');
  await send('Page.reload');await waitFor(`typeof TiuGame!=='undefined' && !document.querySelector('#titleScreen').classList.contains('hidden')`);
  assert(await evaluate(`!document.querySelector('#continueBtn').classList.contains('hidden')`),'Continue must survive reload');
  await key('Enter');await waitFor(`TiuGame.canExplore()`);
  assert.equal(await evaluate('S.playerRoom'),savedRoom,'Reload restores room');
  // Tutorial keyboard context must not advance menus underneath.
  await evaluate(`TiuTutorial.start('basic',true)`);await sleep(750);await key('Enter');
  assert(await evaluate(`TiuTutorial.isActive()`));await key('Escape');await waitFor(`!TiuTutorial.isActive()`);
  await require('./campaign_checks.cjs')({evaluate,key,click,waitFor,screenshot,send,sleep,finishDialogue,output});
  await require('./escaped_checks.cjs')({evaluate,key,click,waitFor,screenshot,send,sleep,finishDialogue});
  // Narrow and short viewport captures for layout review.
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await key('Escape');await click('#pauseMainMenuBtn');await screenshot('05-mobile-title');
  assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),'Horizontal overflow on small screen');
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:640,deviceScaleFactor:1,mobile:false});
  await click('#continueBtn');await key('Escape');await click('#pauseSettingsBtn');await screenshot('06-short-settings');
  assert.equal(errors.length,0,errors.join('\n'));
  assert(!requests.some(u=>/supabase|arena-match/i.test(u)),'Unexpected retired service request');
  console.log('PASS: keyboard onboarding, dialogue, journal, map pause/travel, manual save, export, delete cancel, settings, blur pause, reload, tutorial, responsive layouts.');
  console.log('Screenshots: '+output);
}
run().catch(async e=>{console.error(e.stack);console.error('Runtime errors:',errors);if(ws?.readyState===1){try{await screenshot('failure');console.error(await evaluate(`({title:document.querySelector('#mgTitle')?.textContent,body:document.body.innerText.slice(-3000),state:typeof S==='undefined'?null:S})`));}catch{}}console.error('Artifacts: '+output);process.exitCode=1;}).finally(async()=>{if(ws?.readyState===1){try{await send('Browser.close');}catch{}ws.close();}if(browser&&!browser.killed)browser.kill();server?.close();});
