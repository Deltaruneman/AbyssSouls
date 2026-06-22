/* ==========================================================================
   AUDIO ASSETS & PRELOADING
   ========================================================================== */
const preloadedAudio = {};
const audioAssets = {
    jump: 'assets/sfx/jump.mp3',
    step: 'assets/sfx/step.mp3',
    boss_skill: 'assets/sfx/boss_skill.mp3',
    boss_attack: 'assets/sfx/boss_attack.mp3',
    boss_np: 'assets/sfx/boss_np.mp3',
    collect: 'assets/sfx/collect.mp3', 
    gate: 'assets/sfx/gate.mp3'
};

for (let i = 1; i <= 7; i++) {
    audioAssets[`attack_${i}`] = `assets/sfx/attack_${i}.mp3`;
    audioAssets[`skill_${i}`] = `assets/sfx/skill_${i}.mp3`;
    audioAssets[`np_${i}`] = `assets/sfx/np_${i}.mp3`;
}

async function preloadAllAudio() {
    const promises = [];
    for (const [key, src] of Object.entries(audioAssets)) {
        promises.push(new Promise((resolve) => {
            const audio = new Audio();
            audio.src = src;
            audio.preload = "auto";
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', resolve, { once: true }); 
            preloadedAudio[key] = audio;
        }));
    }
    await Promise.all(promises);
    console.log("[Hệ thống] Toàn bộ âm thanh đã tải xong!");
}

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
        startBtn.innerText = "ĐANG TẢI DỮ LIỆU...";
        startBtn.disabled = true;
        startBtn.style.opacity = "0.5";
        startBtn.style.cursor = "wait";

        preloadAllAudio().then(() => {
            startBtn.innerText = "BẮT ĐẦU KHÁM PHÁ";
            startBtn.disabled = false;
            startBtn.style.opacity = "1";
            startBtn.style.cursor = "pointer";
        });
    }
});

/* ==========================================================================
   GAME COMPATIBILITY & CONFIGURATION
   ========================================================================== */
const classData = {
    1:{ id:1, name:"Knight", icon:"🛡️", hp:550, atk:40 },
    2:{ id:2, name:"Archer", icon:"🏹", hp:250, atk:60 },
    3:{ id:3, name:"Mage", icon:"🔥", hp:320, atk:55 },
    4:{ id:4, name:"Assassin", icon:"🗡️", hp:280, atk:65 },
    5:{ id:5, name:"Healer", icon:"💚", hp:400, atk:20 },
    6:{ id:6, name:"Berserker", icon:"💀", hp:220, atk:85 },
    7:{ id:7, name:"Lancer", icon:"🔱", hp:450, atk:48 },
    8:{ id:8, name:"Summoner", icon:"🔮", hp:300, atk:50 } // ID 8 Boss/Summoner
};

const typeAdvantage = {
    "1-4":0.30, "4-3":0.30, "3-6":0.30, "6-2":0.30, "2-5":0.30, "5-1":0.30, "7-2":0.30,
    "4-1":-0.20, "3-4":-0.20, "6-3":-0.20, "2-6":-0.20, "5-2":-0.20, "1-5":-0.20, "2-7":-0.20
};

const bossHints = {
    1:"Một lớp giáp thép bao phủ cơ thể hắn...", 2:"Hắn liên tục giữ khoảng cách với đối thủ...",
    3:"Không khí quanh hắn nóng bất thường...", 4:"Bóng tối đang chuyển động quanh chiến trường...",
    5:"Một luồng ánh sáng kỳ lạ đang bảo vệ hắn...", 6:"Sát khí điên loạn lan khắp không gian...",
    7:"Một mũi giáo xuyên thấu bóng tối...", 8:"Kẻ thao túng linh hồn đang ẩn mình trong bóng tối..."
};

let selectedClasses = []; // Lưu classId người chơi chọn trong cửa hàng  
let team = [];              
let currentTurn = 0;
let gameOver = false;
let bossTurnCount = 0;
let soulEnergy = 0; // Năng lượng

let boss = {
    name: "The Nightmare Soul", classId: Math.floor(Math.random() * 8) + 1,
    revealed: false, maxHp: 1000, hp: 1000, atk: 65, atkDebuff: 0, atkDebuffTurn: 0, npCounter: 0, defending: false, energy: 100
};

let enemies = [];
let controlledServant = null;
window.teamProtectionTurn = 0;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ==========================================================================
   PLATFORMER ENGINE 
   ========================================================================== */
const gameImages = { wall: new Image(), servant: new Image(), gate: new Image(), player: new Image() };
gameImages.wall.src = 'assets/images/wall.png';       
gameImages.servant.src = 'assets/images/soul.png'; 
gameImages.gate.src = 'assets/images/gate.png';      
gameImages.player.src = 'assets/images/player.png';   

const TILE_SIZE = 40;
const map2D = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,9,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1],
    [1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,2,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let currentMap = map2D; 
let npcTalked = false; 

const roomMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,8,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const townMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,1,1,1],
    [1,0,0,4,0,0,0,0,5,0,0,0,0,6,0,0,0,8,0,1], 
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let playerObj = { stepTimer: 0, x: 100, y: 400, width: 30, height: 30, vx: 0, vy: 0, speed: 5, jumpPower: -11, grounded: false, maxJumps: 2, jumpsLeft: 2, canJump: true };
let camera = { x: 0, y: 0 };
let keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
let isExploring = false;
let isDialogueActive = false;
let dialogueQueue = [];

function showDialogue(name, textArray) {
    document.getElementById("dialogue-name").innerText = name;
    dialogueQueue = textArray;
    isDialogueActive = true;
    document.getElementById("dialogue-box").style.display = "block";
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = false; 
    nextDialogue();
}

function nextDialogue() {
    if (dialogueQueue.length > 0) {
        let current = dialogueQueue.shift();
        if (typeof current === 'object' && current !== null) {
            document.getElementById("dialogue-name").innerText = current.name;
            document.getElementById("dialogue-text").innerHTML = current.text;
        } else {
            document.getElementById("dialogue-text").innerHTML = current;
        }
    } else {
        isDialogueActive = false;
        document.getElementById("dialogue-box").style.display = "none";
    }
}
document.getElementById("dialogue-box").addEventListener("click", () => { if (isDialogueActive) nextDialogue(); });

function checkWall(x, y, width, height) {
    let left = Math.floor(x / TILE_SIZE), right = Math.floor((x + width - 1) / TILE_SIZE);
    let top = Math.floor(y / TILE_SIZE), bottom = Math.floor((y + height - 1) / TILE_SIZE);
    for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
            if (currentMap[r] !== undefined && currentMap[r][c] === 1) return true; 
        }
    }
    return false;
}

function resizeCanvas() {
    const canvas = document.getElementById("gameCanvas");
    if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
}
window.addEventListener('resize', resizeCanvas);

function startExploration() {
    document.getElementById("main-header").style.display = "none";
    document.getElementById("selection-screen").style.display = "none";
    document.getElementById("platformer-screen").style.display = "block";
    resizeCanvas();
    
    currentMap = map2D; // Đảm bảo bắt đầu với map chính
    soulEnergy = 0;
    selectedClasses = [];
    isExploring = true;
    
    window.addEventListener("keydown", (e) => { 
        if (e.key === 'x' || e.key === 'X') { if (isDialogueActive) nextDialogue(); } 
        else { if (!isDialogueActive && keys.hasOwnProperty(e.code)) keys[e.code] = true; }
    });
    window.addEventListener("keyup", (e) => { 
        if(keys.hasOwnProperty(e.code)) keys[e.code] = false; 
        if(e.code === "ArrowUp") playerObj.canJump = true; 
    });

    showDialogue("???", [
        "Mình cảm nhận được Abyss đã ở đây.",
        "May mà Abyss Expand đã bị ngăn chặn... Dù không biết là kẻ nào.",
        "Phải thu thập đủ Năng Lượng Linh Hồn để triệu hồi các Anh Linh.",
        "Cần ít nhất 6 Năng Lượng để chuẩn bị đủ đội hình chiến đấu..."
    ]);
    requestAnimationFrame(updatePlatformer);
}

function updatePlatformer() {
    if (!isExploring) return;
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    if (!isDialogueActive) {
        if (keys.ArrowUp && playerObj.canJump && playerObj.jumpsLeft > 0) {
            playerObj.vy = playerObj.jumpPower; playerObj.jumpsLeft--;              
            playerObj.grounded = false; playerObj.canJump = false; playSFX("jump");          
        }
        playerObj.vy += 0.6; 
        if (keys.ArrowLeft) playerObj.vx = -playerObj.speed;
        else if (keys.ArrowRight) playerObj.vx = playerObj.speed;
        else playerObj.vx = 0;

        playerObj.x += playerObj.vx;
        if (checkWall(playerObj.x, playerObj.y, playerObj.width, playerObj.height)) {
            if (playerObj.vx > 0) playerObj.x = Math.floor((playerObj.x + playerObj.width) / TILE_SIZE) * TILE_SIZE - playerObj.width;
            else if (playerObj.vx < 0) playerObj.x = Math.floor(playerObj.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
            playerObj.vx = 0;
        }
        if (playerObj.x < 0) playerObj.x = 0;

        playerObj.y += playerObj.vy;
        playerObj.grounded = false;
        if (checkWall(playerObj.x, playerObj.y, playerObj.width, playerObj.height)) {
            if (playerObj.vy > 0) { 
                playerObj.y = Math.floor((playerObj.y + playerObj.height) / TILE_SIZE) * TILE_SIZE - playerObj.height;
                playerObj.grounded = true; playerObj.jumpsLeft = playerObj.maxJumps; 
            } else if (playerObj.vy < 0) { 
                playerObj.y = Math.floor(playerObj.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
            }
            playerObj.vy = 0;
        }

        if (playerObj.vx !== 0 && playerObj.grounded) {
            playerObj.stepTimer++;
            if (playerObj.stepTimer >= 15) { playSFX('step'); playerObj.stepTimer = 0; }
        } else {
            playerObj.stepTimer = 14;
        }

        let centerX = Math.floor((playerObj.x + playerObj.width / 2) / TILE_SIZE);
        let centerY = Math.floor((playerObj.y + playerObj.height / 2) / TILE_SIZE);
        
        if (currentMap[centerY] !== undefined && currentMap[centerY][centerX] !== undefined) {
            let currentTile = currentMap[centerY][centerX];
            
            // XỬ LÝ NHẶT NĂNG LƯỢNG (Tile 2)
            if (currentTile === 2) {
                soulEnergy++;
                currentMap[centerY][centerX] = 0; 
                playSFX('collect');
                showDialogue("", [` Nhặt được tinh thể năng lượng!`, `(Năng lượng hiện có: ${soulEnergy})`]);
            }

            // XỬ LÝ CỔNG BOSS (Tile 9)
            if (currentTile === 9) {
                if (soulEnergy < 6) {
                    showDialogue("Hệ Thống", ["⚠️ Bạn phải có ít nhất 6 Năng Lượng để đủ chiêu mộ 3 Servant! Hãy quay lại tìm thêm."]);
                    playerObj.x -= 30; 
                } else {
                    isExploring = false; playSFX('gate'); openSelectionScreen(); return;
                }
            }
            
            // XỬ LÝ NPC TRONG PHÒNG MỚI (Tile 3)
            if (currentTile === 3 && !npcTalked) {
                npcTalked = true;
                playerObj.vx = 0; 
                showDialogue("", [
            { name: " Hàng sớm", text: "Oi Sơn, tối qua mày đi đâu à?" },
            { name: "Sơn", text: "À ở tối qua tao có đi giải quyết chút chuyện, có chuyện gì sao Trọng ?" },
            { name: "Trọng", text: "Ờ thì tao có nghe nói bên trường tối qua có gì đó quỷ dị, tao cũng không tin lắm đâu nhưng mà phòng thì vẫn hơn." },
            { name: "Trọng", text: "Mà chắc chẳng sao đâu, nhớ chú ý buổi tối là được." },
            { name: "Sơn", text: "Ờ, tao sẽ chú ý. Mà đi ăn sáng không." },
            { name: "Trọng", text: "Nah tao có mì tôm rồi" },
            { name: "Sơn", text: "Ờ vậy tao đi trước đây" },
            { name: "Trọng", text: "... nghi ngờ vcl" }
        ]);
            }

            if (currentTile === 8) {
                isExploring = false;
                alert("Bạn đã thoát ra ngoài ánh sáng thành công. HẾT GAME!");
                return;
            }
        }
    }

    const zoomLevel = 2.2; 
    const viewWidth = canvas.width / zoomLevel;
    const viewHeight = canvas.height / zoomLevel;
    camera.x = Math.max(0, Math.min(playerObj.x + (playerObj.width / 2) - (viewWidth / 2), (currentMap[0].length * TILE_SIZE) - viewWidth));
    camera.y = Math.max(0, Math.min(playerObj.y + (playerObj.height / 2) - (viewHeight / 2), (currentMap.length * TILE_SIZE) - viewHeight));
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(zoomLevel, zoomLevel);
    
    for (let r = 0; r < currentMap.length; r++) {
        for (let c = 0; c < currentMap[r].length; c++) {
            let tileX = c * TILE_SIZE - camera.x;
            let tileY = r * TILE_SIZE - camera.y;
            
            if (tileX > -TILE_SIZE && tileX < viewWidth && tileY > -TILE_SIZE && tileY < viewHeight) {
                if (currentMap[r][c] === 1) ctx.drawImage(gameImages.wall, tileX, tileY, TILE_SIZE, TILE_SIZE);
                else if (currentMap[r][c] === 2) ctx.drawImage(gameImages.servant, tileX, tileY, TILE_SIZE, TILE_SIZE); 
                else if (currentMap[r][c] === 9) ctx.drawImage(gameImages.gate, tileX, tileY, TILE_SIZE, TILE_SIZE);
                // Vẽ NPC
                else if (currentMap[r][c] === 3) {
                    ctx.fillStyle = "#6edb34"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
                // Vẽ Cửa ra
                else if (currentMap[r][c] === 8) {
                    ctx.fillStyle = "#f1c40f"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    if (playerObj.vx < 0) playerObj.facingRight = false;
    else if (playerObj.vx > 0) playerObj.facingRight = true;
    if (typeof playerObj.facingRight === 'undefined') playerObj.facingRight = true;
    
    ctx.save(); 
    let drawX = playerObj.x - camera.x;
    let drawY = playerObj.y - camera.y;

    if (!playerObj.facingRight) {
        ctx.translate(drawX + playerObj.width, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(gameImages.player, 0, 0, playerObj.width, playerObj.height);
    } else {
        ctx.drawImage(gameImages.player, drawX, drawY, playerObj.width, playerObj.height);
    }
    
    ctx.restore(); ctx.restore(); 
    if (isExploring) requestAnimationFrame(updatePlatformer);
}

/* ==========================================================================
   SHOP / SELECTION SYSTEM
   ========================================================================== */
function openSelectionScreen() {
    document.getElementById("platformer-screen").style.display = "none";
    document.getElementById("team-selection-screen").style.display = "block";
    document.body.style.overflow = "auto";
    
    renderShop(); 
}

function renderShop() {
    document.getElementById("energy-display").innerText = soulEnergy;
    const roster = document.getElementById("selection-roster");
    roster.innerHTML = "";

    const shopClasses = [1, 2, 3, 4, 5, 6, 7];

    shopClasses.forEach(classId => {
        let base = classData[classId];
        let cost = (classId === 3 || classId === 4 || classId === 6) ? 3 : 2;

        const card = document.createElement("div");
        card.className = "roster-card";
        if (selectedClasses.includes(classId)) card.classList.add("selected");

        card.innerHTML = `
            <div style="font-size: 35px;">${base.icon}</div>
            <div style="margin-top: 10px; font-weight: bold; font-size: 16px;">${base.name}</div>
            <div style="margin-top: 8px; color: #00d2ff; font-size: 14px; font-weight: bold;">💎 ${cost} NL</div>
        `;

        card.onclick = () => {
            if (selectedClasses.includes(classId)) {
                selectedClasses = selectedClasses.filter(id => id !== classId);
                soulEnergy += cost;
            } else {
                if (selectedClasses.length >= 3) {
                    alert("Chỉ được chọn tối đa 3 Servant để xuất chiến!");
                    return;
                }
                if (soulEnergy < cost) {
                    alert("Không đủ Năng lượng! Hãy chọn Servant khác hoặc quay lại màn chơi.");
                    return;
                }
                selectedClasses.push(classId);
                soulEnergy -= cost;
                playSFX('collect'); 
            }
            renderShop(); 
        };
        roster.appendChild(card);
    });

    document.getElementById("selection-count").innerText = `Đã chọn: ${selectedClasses.length}/3`;
    document.getElementById("confirm-team-btn").disabled = selectedClasses.length !== 3;
}

function confirmTeamAndBattle() {
    team = selectedClasses.map(classId => {
        let base = classData[classId];
        return {
            uid: Date.now() + Math.random(), 
            classId: classId, 
            name: base.name, 
            icon: base.icon,
            maxHp: base.hp, 
            hp: base.hp, 
            atk: base.atk, 
            np: 0, 
            alive: true, 
            defending: false, 
            reflect: false, 
            status: "", 
            controlled: false
        };
    });
    document.getElementById("team-selection-screen").style.display = "none";
    startBattle();
}

/* ==========================================================================
   BATTLE SYSTEM CORE
   ========================================================================== */
function playSFX(action, id = null) {
    try {
        let key = id ? `${action}_${id}` : action;
        if (preloadedAudio[key]) {
            let soundClone = preloadedAudio[key].cloneNode();
            soundClone.volume = 0.8;
            soundClone.play().catch(e => console.log(`[SFX] Trình duyệt chặn:`, e));
        }
    } catch (e) { console.log("Lỗi hệ thống âm thanh:", e); }
}

function popDamageText(parentElement, damageValue, isCrit = false, isHeal = false, isPlayerTaken = false) {
    const pop = document.createElement("div");
    let className = 'dmg-boss-taken'; 
    if (isPlayerTaken) className = 'dmg-servant-taken'; 
    if (isHeal) className = 'dmg-heal'; 
    if (isCrit) className += ' crit';
    
    pop.className = `dmg-pop ${className}`;
    pop.innerText = damageValue;
    parentElement.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function addLog(text, className) {
    const log = document.getElementById("battle-log");
    log.innerHTML += `<div class="log ${className}">${text}</div>`;
    log.scrollTop = log.scrollHeight;
}
function logPlayer(text) { addLog(text, "log-player"); }
function logBoss(text) { addLog(text, "log-boss"); }
function logSystem(text) { addLog(text, "log-system"); }

function hitEnemy(target, amount) {
    let finalDmg = Math.floor(amount);
    if (target.defending) finalDmg = Math.floor(finalDmg * 0.25); 
    target.hp -= finalDmg;
    return finalDmg;
}

function startBattle() {
    document.getElementById("battle-screen").style.display = "block";
    document.getElementById("boss-hint").innerText = bossHints[boss.classId];
    
    if (boss.classId === 8) {
        boss.maxHp = 300; boss.hp = 300; boss.atk = 50; boss.energy = 100;
    }
    enemies = [boss]; 
    controlledServant = null;

    logSystem("⚔️ Trận chiến bắt đầu!");
    renderBoss(); renderTeam(); highlightTurn();

    showDialogue("", [
        { name: "The Nightmare Soul", text: "Chết tiệt, thế quái nào sức mạnh của cả UIT lại mạnh đến như vậy?" },
        { name: "The Nightmare Soul", text: "Không sao, Abyss Gate sẽ được mở ra một lần nữa, và bóng tối sẽ bao trùm tất cả sinh linh!" },
        { name: "???", text: "Không có cơ hội đó đâu!" },
        { name: "???", text: "Kiến tạo ma lực!" },
        { name: "???", text: "Thiêu đốt linh hồn." },
        { name: "???", text: "Triệu hồi Anh Linh!!!" },
        { name: "The Nightmare Soul", text: "Chết tiệt, ta sẽ biến nơi đây thành mồ chôn của ngươi." }
    ]);
}

function getModifier(attacker, defender) { return typeAdvantage[`${attacker}-${defender}`] || 0; }
function randomDamage(atk) { return Math.floor(atk + Math.random() * 10); }

function renderBoss() {
    const hpPercent = (boss.hp / boss.maxHp) * 100;
    document.getElementById("boss-hp-fill").style.width = Math.max(0, hpPercent) + "%";
    document.getElementById("boss-hp-text").innerText = `${Math.max(0, Math.floor(boss.hp))}/${boss.maxHp}`;
    if (boss.revealed) document.getElementById("boss-name").innerText = `${boss.name} (${classData[boss.classId].name})`;
    const dots = document.querySelectorAll("#boss-charge-dots .dot");
    dots.forEach((dot, idx) => { if (idx < boss.npCounter) dot.classList.add("filled"); else dot.classList.remove("filled"); });

    const minionZone = document.getElementById("minions-zone");
    if (minionZone) {
        minionZone.innerHTML = "";
        enemies.forEach(e => {
            if (e !== boss && e.hp > 0) {
                let mHp = Math.max(0, Math.floor(e.hp));
                minionZone.innerHTML += `
                    <div class="minion-card">
                        <div>⚔️ ${e.name}</div>
                        <div class="bar-container hp"><div class="bar-fill hp-fill" style="width:${(e.hp/e.maxHp)*100}%"></div><span class="bar-text">${mHp}/${Math.floor(e.maxHp)}</span></div>
                    </div>`;
            }
        });
    }
}

function renderTeam() {
    const container = document.getElementById("player-team");
    container.innerHTML = "";
    team.forEach((servant, index) => {
        const template = document.getElementById("character-template").content.cloneNode(true);
        const card = template.querySelector(".servant-card");
        if (index === currentTurn && !gameOver) card.classList.add("active");
        if (servant.hp <= 0) card.classList.add("dead");
        if (servant.controlled) card.classList.add("controlled"); 

        template.querySelector(".servant-name").innerHTML = `${servant.icon} ${servant.name}`;
        template.querySelector(".servant-hp-text").innerText = `HP: ${Math.max(0, Math.floor(servant.hp))}/${servant.maxHp}`;
        template.querySelector(".servant-np-text").innerText = `NP: ${servant.np}/100`;
        template.querySelector(".hp-fill").style.width = (Math.max(0, servant.hp) / servant.maxHp) * 100 + "%";
        const npFill = template.querySelector(".np-fill");
        npFill.style.width = servant.np + "%";
        if (servant.np >= 100) npFill.classList.add("np-ready");
        template.querySelector(".servant-status").innerText = servant.status;
        container.appendChild(card);
    });
}

function highlightTurn() {
    if (gameOver) return;
    while (currentTurn < team.length && (team[currentTurn].hp <= 0 || team[currentTurn].controlled)) currentTurn++;

    if (currentTurn >= team.length) { 
        document.getElementById("action-panel").style.pointerEvents = "none";
        setTimeout(bossAction, 1000); return; 
    }

    const servant = team[currentTurn];
    document.getElementById("turn-info").innerText = `LƯỢT: ${servant.icon} ${servant.name}`;
    document.getElementById("skill-btn").disabled = servant.np < 20;
    document.getElementById("np-btn").disabled = servant.np < 100;
    renderTeam();
}

function gainNP(servant) { servant.np = Math.min(100, servant.np + 25); }

function revealBossCheck() {
    if (!boss.revealed && boss.hp <= boss.maxHp * 0.7) {
        boss.revealed = true;
        logSystem(`⚠️ CẢNH BÁO: Đã nhận diện class Boss [${classData[boss.classId].name}]`);
        renderBoss();
    }
}

async function playerAction(action) {
    if (gameOver) return;
    let servant = team[currentTurn];
    if (servant.hp <= 0 || servant.controlled) return;

    document.getElementById("action-panel").style.pointerEvents = "none";
    let aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) return;

    if (action === "attack") {
        playSFX("attack", servant.classId); 
        if (servant.classId === 3) {
            aliveEnemies.forEach(e => {
                let raw = randomDamage(servant.atk) * (1 + getModifier(servant.classId, e.classId || 0));
                let dmg = hitEnemy(e, raw);
                popDamageText(document.getElementById("boss-zone"), dmg, false);
            });
            logPlayer(`🔥 ${servant.name} dùng ma thuật đánh thường toàn bộ kẻ địch (AOE).`);
        } else {
            let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            let raw = randomDamage(servant.atk) * (1 + getModifier(servant.classId, target.classId || 0));
            let dmg = hitEnemy(target, raw);
            logPlayer(`⚔️ ${servant.name} tấn công ${target.name} gây ${dmg} sát thương.`);
            popDamageText(document.getElementById("boss-zone"), dmg, false);
        }
        gainNP(servant);
    } 
    else if (action === "skill") useSkill(servant);
    else if (action === "np") useNP(servant);

    enemies = enemies.filter(e => e.hp > 0 || e === boss);

    revealBossCheck(); renderBoss(); renderTeam();
    if (boss.hp <= 0) { victory(); return; }

    await sleep(600); 
    document.getElementById("action-panel").style.pointerEvents = "auto";
    currentTurn++;
    highlightTurn();
}

function useSkill(servant) {
    if (servant.np < 20) return;
    servant.np -= 20;
    playSFX("skill", servant.classId); 

    let aliveEnemies = enemies.filter(e => e.hp > 0);
    let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    let dmg = 0;

    switch(servant.classId) {
        case 1: servant.defending = true; servant.status = "🛡️ Phản đòn"; logPlayer("Knight bật khiên phòng thủ."); break;
        case 2: 
            let hits = Math.floor(Math.random() * 5) + 1;
            logPlayer(`🏹 Archer giương cung, xả ${hits} mũi tên liên hoàn!`);
            for (let i = 0; i < hits; i++) {
                let curAlive = enemies.filter(e => e.hp > 0);
                if (curAlive.length > 0) {
                    let t = curAlive[Math.floor(Math.random() * curAlive.length)];
                    let d = hitEnemy(t, servant.atk * 1.5 * (1 + getModifier(servant.classId, t.classId || 0)));
                    popDamageText(document.getElementById("boss-zone"), d, false);
                }
            }
            break;
        case 3: 
            logPlayer(`🔥 Mage giải phóng ma thuật, thiêu đốt toàn bộ chiến trường (AOE)!`);
            aliveEnemies.forEach(e => {
                let d = hitEnemy(e, servant.atk * 2 * (1 + getModifier(servant.classId, e.classId || 0)));
                if (e === boss) { boss.atkDebuff = 0.20; boss.atkDebuffTurn = 2; }
                popDamageText(document.getElementById("boss-zone"), d, false);
            });
            break;
        case 4: dmg = hitEnemy(target, servant.atk * (Math.random() < 0.4 ? 3 : 1)); logPlayer(`Assassin đâm lén ${target.name} gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 5: team.forEach(a => { if (a.hp > 0 && !a.controlled) a.hp = Math.min(a.maxHp, a.hp + 80); }); logPlayer("Healer hồi 80 HP cho toàn đội."); popDamageText(document.getElementById("player-team"), "+80", false, true); break;
        case 6: dmg = hitEnemy(target, servant.atk * 2.5); servant.hp -= 30; logPlayer(`Berserker hi sinh 30 HP chém mạnh ${target.name} gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 7: dmg = hitEnemy(target, Math.floor(servant.atk * 1.8 * (1 + getModifier(servant.classId, target.classId || 0)))); logPlayer(`Lancer đâm xuyên giáp ${target.name} gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
    }
}

function useNP(servant) {
    if (servant.np < 100) return;
    servant.np = 0;
    playSFX("np", servant.classId); 
    logPlayer(`🔥 ${servant.name} PHÁT ĐỘNG TUYỆT KỸ!`);

    let aliveEnemies = enemies.filter(e => e.hp > 0);
    let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

    switch(servant.classId) {
        case 1: team.forEach(a => { if(a.hp > 0 && !a.controlled) { a.defending = true; a.status = "🏰 Avalon"; }}); window.teamProtectionTurn = 2; break;
        case 2: hitEnemy(target, 350); popDamageText(document.getElementById("boss-zone"), 350, true); break;
        case 3: 
            aliveEnemies.forEach(e => { hitEnemy(e, 350); popDamageText(document.getElementById("boss-zone"), 350, true); });
            boss.atkDebuff = 0.30; boss.atkDebuffTurn = 3; break;
        case 4: let d = hitEnemy(target, Math.random() < 0.5 ? 600 : 250); popDamageText(document.getElementById("boss-zone"), d, true); break;
        case 5: team.forEach(a => { if(a.hp > 0 && !a.controlled) { a.hp = a.maxHp; a.np = 50; }}); break;
        case 6: hitEnemy(target, 700); servant.hp = 1; popDamageText(document.getElementById("boss-zone"), 700, true); break;
        case 7: hitEnemy(target, 500); popDamageText(document.getElementById("boss-zone"), 500, true); break;
    }
}

async function bossAction() {
    if (gameOver) return;
    bossTurnCount++; boss.npCounter++; boss.defending = false; 

    let aliveTargets = team.filter(s => s.hp > 0 && !s.controlled);
    if (aliveTargets.length === 0) { checkLose(); return; }

    if (boss.classId === 8) boss.energy = Math.min(100, (boss.energy || 0) + 25);

    renderBoss();
    logBoss(`👹 Boss đang tích tụ năng lượng (${boss.npCounter}/3).`);
    await sleep(800);

    if (boss.npCounter >= 3) {
        boss.npCounter = 0; bossNP();
        team.forEach(s => { s.defending = false; if(!s.controlled) s.status = ""; });
        renderTeam(); renderBoss();
        if (checkLose()) return;
        currentTurn = 0; document.getElementById("action-panel").style.pointerEvents = "auto"; highlightTurn(); return;
    }

    let isUsingSkill = Math.random() < 0.25;
    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    let targetIndex = team.findIndex(s => s.uid === target.uid);
    let effectiveAtk = boss.atk * (boss.atkDebuffTurn > 0 ? (1 - boss.atkDebuff) : 1);
    if (boss.atkDebuffTurn > 0) boss.atkDebuffTurn--;
    const cards = document.querySelectorAll(".servant-card");
    let modifier = 1 + getModifier(boss.classId, target.classId);

    // ==========================================
    // LOGIC CHO SUMMONER BOSS
    // ==========================================
    if (boss.classId === 8) {
        let activeMinions = enemies.filter(e => e.name === "Binh Lính" && e.hp > 0).length;

        if (isUsingSkill && boss.energy >= 50) {
            boss.energy -= 50;
            
            if (activeMinions < 2) {
                logBoss("🔮 KỸ NĂNG: Summoner dùng 50 năng lượng triệu hồi Binh Lính và thao túng linh hồn!");
                let toSummon = 2 - activeMinions;
                for (let i=0; i<toSummon; i++) {
                    enemies.push({ name: "Binh Lính", maxHp: boss.maxHp/3, hp: boss.maxHp/3, atk: boss.atk/3, classId: 0, defending: false });
                }
                
                if (!controlledServant && aliveTargets.length > 0) {
                    let mindControlTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                    mindControlTarget.controlled = true;
                    controlledServant = mindControlTarget;
                    mindControlTarget.status = "🧠 Bị Thao Túng";
                    logSystem(`⚠️ CẢNH BÁO: ${mindControlTarget.name} đã bị Summoner thao túng và phản bội đội!`);
                }
            } 
            else {
                logBoss("🔮 KỸ NĂNG: Summoner giải phóng ma thuật Hắc Ám diện rộng (AOE)!");
                aliveTargets.forEach(t => {
                    let tIdx = team.findIndex(s => s.uid === t.uid);
                    let aoeDmg = Math.floor(effectiveAtk * 1.5);
                    if (t.defending) aoeDmg = Math.floor(aoeDmg * 0.5);
                    t.hp -= aoeDmg;
                    popDamageText(cards[tIdx], aoeDmg, false, false, true);
                });
            }
        } 
        else {
            logBoss("👹 Summoner ra lệnh tổng tấn công!");
            
            let bDmg = Math.floor(effectiveAtk); if(target.defending) bDmg = Math.floor(bDmg*0.5);
            target.hp -= bDmg; 
            popDamageText(cards[targetIndex], bDmg, false, false, true);

            enemies.forEach(e => {
                if (e.name === "Binh Lính" && e.hp > 0) {
                    let alive = team.filter(s => s.hp > 0 && !s.controlled);
                    if(alive.length > 0) {
                        let t2 = alive[Math.floor(Math.random() * alive.length)];
                        let t2Idx = team.findIndex(s => s.uid === t2.uid);
                        let mDmg = Math.floor(e.atk); if(t2.defending) mDmg = Math.floor(mDmg*0.5);
                        t2.hp -= mDmg; 
                        logBoss(`🗡️ Binh Lính vung kiếm chém ${t2.name} gây ${mDmg} ST.`);
                        popDamageText(cards[t2Idx], mDmg, false, false, true); 
                    }
                }
            });

            if (controlledServant && controlledServant.hp > 0) {
                let alive = team.filter(s => s.hp > 0 && !s.controlled);
                if (alive.length > 0) {
                    let t3 = alive[Math.floor(Math.random() * alive.length)];
                    let t3Idx = team.findIndex(s => s.uid === t3.uid);
                    let cDmg = Math.floor(controlledServant.atk); if(t3.defending) cDmg = Math.floor(cDmg*0.5);
                    t3.hp -= cDmg;
                    logBoss(`🔥 Kẻ thao túng ${controlledServant.name} đả thương đồng đội gây ${cDmg} ST!`);
                    popDamageText(cards[t3Idx], cDmg, false, false, true); 
                }
            }
        }
    } 
    // ==========================================
    // LOGIC CHO CÁC CLASS BOSS KHÁC
    // ==========================================
    else {
        if (isUsingSkill) {
            playSFX("boss_skill");
            let dmg = 0;
            switch(boss.classId) {
                case 1: boss.defending = true; logBoss("🛡️ KỸ NĂNG: Boss bật Khiên Hắc Ám!"); break;
                case 2:
                    dmg = Math.floor(effectiveAtk * 3 * modifier); if (target.defending) dmg = Math.floor(dmg * 0.5);
                    target.hp -= dmg; logBoss(`🏹 KỸ NĂNG: Boss xả Mưa Tên vào ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                case 3:
                    dmg = Math.floor(effectiveAtk * 4 * modifier); if (target.defending) dmg = Math.floor(dmg * 0.5);
                    target.hp -= dmg; logBoss(`🔥 KỸ NĂNG: Boss Lửa Hỏa Ngục thiêu đốt ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                case 4:
                    dmg = Math.floor(effectiveAtk * (Math.random() < 0.4 ? 6 : 2) * modifier); if (target.defending) dmg = Math.floor(dmg * 0.5);
                    target.hp -= dmg; logBoss(`🗡️ KỸ NĂNG: Boss xuất quỷ nhập thần trúng ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                case 5:
                    let heal = 400; boss.hp = Math.min(boss.maxHp, boss.hp + heal);
                    logBoss(`💚 KỸ NĂNG: Boss hồi phục ${heal} HP!`); popDamageText(document.getElementById("boss-zone"), `+${heal}`, false, true); break;
                case 6:
                    dmg = Math.floor(effectiveAtk * 5 * modifier); if (target.defending) dmg = Math.floor(dmg * 0.5);
                    boss.hp -= 60; target.hp -= dmg;
                    logBoss(`💀 KỸ NĂNG: Boss hiến tế 60 HP trảm Huyết Lệ trúng ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                case 7:
                    dmg = Math.floor(effectiveAtk * 3.6 * modifier); if (target.defending) dmg = Math.floor(dmg * 0.5);
                    target.hp -= dmg; logBoss(`🔱 KỸ NĂNG: Ngọn Giáo Tuyệt Vọng xuyên thủng ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
            }
        } else {
            playSFX("boss_attack");
            let damage = Math.floor(effectiveAtk * modifier);
            if (target.defending) damage = Math.floor(damage * 0.3);
            target.hp -= damage;
            logBoss(`👹 Boss đánh thường ${target.name} gây ${damage} sát thương.`);
            popDamageText(cards[targetIndex], damage, false, false, true); 
        }
    }

    team.forEach(s => { s.defending = false; if(!s.controlled) s.status = ""; });
    renderBoss(); renderTeam();

    if (checkLose()) return;
    currentTurn = 0; document.getElementById("action-panel").style.pointerEvents = "auto"; highlightTurn();
}

function bossNP() {
    playSFX("boss_np");
    logBoss("💥 TUYỆT KỸ BOSS PHÁT ĐỘNG!");
    let aoe = Math.random() < 0.5;
    const cards = document.querySelectorAll(".servant-card");
    
    if (aoe) {
        team.forEach((s, idx) => {
            if (s.hp > 0 && !s.controlled) { 
                let d = s.defending ? 80 : 150; s.hp -= d; 
                popDamageText(cards[idx], d, true, false, true); 
            }
        });
    } else {
        let aliveTargets = team.filter(s => s.hp > 0 && !s.controlled);
        if (aliveTargets.length > 0) {
            let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
            let targetIndex = team.findIndex(s => s.uid === target.uid);
            let d = target.defending ? 150 : 300; 
            target.hp -= d; 
            popDamageText(cards[targetIndex], d, true, false, true); 
        }
    }
}

function endGame(msg) { 
    gameOver = true; 
    document.getElementById("action-panel").style.display = "none";
    logSystem(`💀 ${msg}`);
    setTimeout(() => alert(msg), 500);
}

function victory() { 
    if (!gameOver) {
        gameOver = true; 
        document.getElementById("action-panel").style.display = "none";
        logSystem(`🎉 CHIẾN THẮNG! BOSS ĐÃ BỊ TIÊU DIỆT!`);

       showDialogue("", [
            { name: "The Nightmare Soul", text: "Khục... Không thể nào... Vực thẳm... sẽ không bao giờ... lụi tàn..." },
            { name: "The Nightmare Soul", text: "Cơ thể này... đang tan biến... Ngươi sẽ phải hối hận..." },
            { name: "???", text: "...( phong ấn Abyss Gate )..." },
            { name: "The Nightmare Soul", text: "Ha ha ha ha, ta đã cảm nhận được thứ ma lực trong người ngươi." },
            { name: "The Nightmare Soul", text: "Nó đến từ Abyss, thứ ma thuật lấy linh hồn kẻ khác làm sức mạnh của ngươi." },
            { name: "The Nightmare Soul", text: "Ha ha ha, rồi thì chính tâm trí ngươi sẽ dần bị tha hóa không khác gì chúng ta." },
            { name: "???", text: "Ta hiểu nhưng..." },
            { name: "Hệ Thống", text: "🎉 BOSS ĐÃ BỊ TIÊU DIỆT! Không gian xung quanh đang thay đổi..." }
        ]);

        let checkDialog = setInterval(() => {
            if (!isDialogueActive) {
                clearInterval(checkDialog);
                enterPostBossRoom(); // CHUYỂN ĐẾN HÀM CHUYỂN CẢNH
            }
        }, 500);
    } 
}

// --- HÀM MỚI: CHUYỂN CẢNH SAU KHI ĐÁNH BOSS ---
function enterPostBossRoom() {
    // Ẩn màn hình chiến đấu, hiện lại màn hình platformer
    document.getElementById("battle-screen").style.display = "none";
    document.getElementById("platformer-screen").style.display = "block";
    
    // Đổi sang Map căn phòng
    currentMap = roomMap;
    
    // Reset lại vị trí người chơi sang góc trái map mới
    playerObj.x = 80; 
    playerObj.y = 400;
    playerObj.vx = 0; 
    playerObj.vy = 0;
    
    isExploring = true;
    npcTalked = false; // Đặt lại trạng thái chưa nói chuyện NPC

    showDialogue("Hệ Thống", [
        "Bạn đã được dịch chuyển đến một hầm mộ bằng đá...",
        "Có một người đang đứng gần đó. Hãy thử đi lại gần để xem."
    ]);
    
    requestAnimationFrame(updatePlatformer);
}

function checkLose() {
    let alive = team.filter(s => s.hp > 0 && !s.controlled);
    if (alive.length === 0) { 
        endGame("THẤT BẠI... TOÀN ĐỘI ĐÃ BỊ TIÊU DIỆT. Tâm trí của bạn bị Abyss thao túng và trở thành một Abyss One"); 
        return true; 
    }
    return false;
}