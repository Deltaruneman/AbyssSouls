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
    gate: 'assets/sfx/gate.mp3',
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

function playSFX(key, id = null) {
    let sfxKey = key;
    if (id !== null && ['attack', 'skill', 'np'].includes(key)) {
        sfxKey = `${key}_${id}`;
    }
    if (preloadedAudio[sfxKey]) {
        preloadedAudio[sfxKey].currentTime = 0;
        preloadedAudio[sfxKey].play().catch(() => {});
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
        startBtn.innerText = "ĐANG TẢI DỮ LIỆU...";
        startBtn.disabled = true;
        startBtn.style.opacity = "0.5";
        startBtn.style.cursor = "wait";

        preloadAllAudio().then(() => {
            startBtn.innerText = "BẮT ĐẦU HÀNH TRÌNH";
            startBtn.disabled = false;
            startBtn.style.opacity = "1";
            startBtn.style.cursor = "pointer";
        });
    }
});

/* ==========================================================================
   GAME DATA & CONFIGURATION
   ========================================================================== */
const classData = {
    1:{ id:1, name:"Knight", icon:"🛡️", spd:60, hp:550, atk:40, npGain: 15 },      
    2:{ id:2, name:"Archer", icon:"🏹", spd:90, hp:250, atk:60, npGain: 25 },     
    3:{ id:3, name:"Mage", icon:"🔥", spd:70, hp:320, atk:55, npGain: 35 },       
    4:{ id:4, name:"Assassin", icon:"🗡️", spd:100, hp:280, atk:65, npGain: 30 },   
    5:{ id:5, name:"Healer", icon:"💚", spd:40, hp:400, atk:20, npGain: 25 },       
    7:{ id:7, name:"Lancer", icon:"🔱", spd:80, hp:450, atk:48, npGain: 20 },      
    8:{ id:8, name:"Summoner", icon:"🔮", spd:30, hp:300, atk:50, npGain: 30 }     
};

let battleQueue = [];
let queueIndex = 0;
let isMenuOpen = false;

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

let selectedClasses = []; 
let team = [];              
let currentTurn = 0;
let gameOver = false;
let bossTurnCount = 0;
let soulEnergy = 0; 

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
const gameImages = { wall: new Image(), servant: new Image(), gate: new Image(), player: new Image(), mapBG: new Image(), townBG: new Image() };
gameImages.wall.src = 'assets/images/wall.png';       
gameImages.servant.src = 'assets/images/soul.png'; 
gameImages.gate.src = 'assets/images/gate.png';      
gameImages.player.src = 'assets/images/player.png';   
gameImages.mapBG.src = 'assets/images/map_bg.png';   
gameImages.townBG.src = 'assets/images/town_bg.png';

const TILE_SIZE = 40;
const zoomLevel = 1;

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
    [1,0,0,0,7,0,0,0,0,0,3,0,0,0,0,0,0,8,0,1],
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
    [1,0,0,4,0,0,0,0,5,0,0,0,0,6,0,0,7,8,0,1], 
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
    document.getElementById("dialogue-name").innerText = name || "Hệ Thống";
    dialogueQueue = [...textArray];
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

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        toggleESCMenu();
    }
});

function toggleESCMenu() {
    const menu = document.getElementById("esc-menu");
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        menu.style.display = "flex";
        keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = false;
    } else {
        menu.style.display = "none";
        if (isExploring) requestAnimationFrame(updatePlatformer); 
    }
}
function openTutorial() { document.getElementById("tutorial-overlay").style.display = "flex"; }
function closeTutorial() { document.getElementById("tutorial-overlay").style.display = "none"; }
function openSettings() { document.getElementById("settings-overlay").style.display = "flex"; }
function closeSettings() { document.getElementById("settings-overlay").style.display = "none"; }

function updateVolume(val) {
    console.log(`[Cài đặt] Đã chỉnh âm lượng hiệu ứng thành: ${val}%`);
}

function returnToMain() {
    if (confirm("Bạn có chắc muốn thoát ra Màn hình chính? Mọi tiến trình hiện tại sẽ mất.")) {
        location.reload();
    }
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
    
    currentMap = map2D; 
    soulEnergy = 0;
    selectedClasses = [];
    isExploring = true;
    
    window.addEventListener("keydown", (e) => { 
        if (e.key === 'x' || e.key === 'X') { if (isDialogueActive) nextDialogue(); } 
        else if (e.key === 'e' || e.key === 'E') { interactNPC(); }
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

function interactNPC() {
    if (!isExploring || isDialogueActive) return;
    let centerX = Math.floor((playerObj.x + playerObj.width / 2) / TILE_SIZE);
    let centerY = Math.floor((playerObj.y + playerObj.height / 2) / TILE_SIZE);
    
    if (currentMap[centerY] !== undefined && currentMap[centerY][centerX] !== undefined) {
        let currentTile = currentMap[centerY][centerX];

        if (currentTile === 4) {
            playerObj.vx = 0;
            showDialogue("Cô bán bánh mì", ["Con mua bánh mì đi con, con không mua cô với chú chặng đường đấy!", "Đùa thôi nha con."]);
        } else if (currentTile === 5) {
            playerObj.vx = 0;
            showDialogue("Cơm chiên Vũ Sigma", ["Em đến ăn cơm à?", "Tiếc quá, anh lại đóng cửa rồi."]);
        } else if (currentTile === 6) {
            playerObj.vx = 0;
            showDialogue("", [
                { name: "Chủ tiệm tạp hóa", text: "Lô iem, lại mua mì tôm à" },
                { name: "Sơn", text: "Dạ cho em 2 gói mì 1 xúc xích và 5k nước đá ạ." },
                { name: "Chủ tiệm tạp hóa", text: "Ok, đây em." },
                { name: "Sơn", text: "(chuyển khoản)." }
            ]);
        }
    }
}

function updatePlatformer() {
    if (!isExploring || isMenuOpen) return;
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
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
        let currentTile = currentMap[centerY] ? currentMap[centerY][centerX] : 0;

        // XỬ LÝ NHẶT NĂNG LƯỢNG (Tile 2)
        if (currentTile === 2) {
            soulEnergy++;
            currentMap[centerY][centerX] = 0;
            playSFX('collect');
            showDialogue("Hệ Thống", [`Nhặt được tinh thể năng lượng!`, `(Năng lượng hiện có: ${soulEnergy})`]);
        }

        // XỬ LÝ CỔNG BOSS (Tile 9)
        if (currentTile === 9) {
            if (soulEnergy < 6) {
                showDialogue("Hệ Thống", ["⚠️ Bạn phải có ít nhất 6 Năng Lượng để đủ chiêu mộ 3 Servant! Hãy quay lại tìm thêm."]);
                playerObj.x -= 30;
            } else {
                isExploring = false;
                playSFX('gate');
                openSelectionScreen();
                return;
            }
        }

        // XỬ LÝ NPC TRONG PHÒNG MỚI (Tile 3)
        if (currentTile === 3 && !npcTalked) {
            npcTalked = true;
            playerObj.vx = 0;
            showDialogue("", [
                { name: "Hàng xóm", text: "Oi Sơn, tối qua mày đi đâu à?" },
                { name: "Sơn", text: "À tối qua tao có đi giải quyết chút chuyện, có chuyện gì sao Trọng?" },
                { name: "Trọng", text: "Ờ thì tao có nghe nói bên trường tối qua có gì đó quỷ dị, tao cũng không tin lắm đâu nhưng mà..." }
            ]);
        }

        // XỬ LÝ CHUYỂN MÁP QUA LẠI GIỮA ROOMMAP VÀ TOWNMAP (Tile 8)
        if (currentTile === 8) {
            if (currentMap === roomMap) {
                currentMap = townMap;
                playerObj.x = 80; 
                playerObj.y = 400;
                showDialogue("Hệ Thống", ["Bạn đã được dịch chuyển đến Thị Trấn.", "Hãy lại gần các NPC và nhấn phím [E] để trò chuyện."]);
            } else if (currentMap === townMap) {
                currentMap = roomMap;
                playerObj.x = 600; 
                playerObj.y = 400;
                showDialogue("Hệ Thống", ["Bạn đã quay trở lại căn phòng ban đầu."]);
                // ĐÃ FIX: Xoá bỏ lệnh return; làm đóng băng luồng vẽ Canvas ở đây
            }
        }
    }

    let viewWidth = canvas.width / zoomLevel;
    let viewHeight = canvas.height / zoomLevel;
    camera.x = Math.max(0, Math.min(playerObj.x + (playerObj.width / 2) - (viewWidth / 2), (currentMap[0].length * TILE_SIZE) - viewWidth));
    camera.y = Math.max(0, Math.min(playerObj.y + (playerObj.height / 2) - (viewHeight / 2), (currentMap.length * TILE_SIZE) - viewHeight));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ĐÃ FIX: Bổ sung vẽ background cho roomMap để không bị lỗi màn hình đen
    if (currentMap === map2D) {
        ctx.drawImage(gameImages.mapBG, 0, 0, canvas.width, canvas.height);
    } else if (currentMap === townMap) {
        ctx.drawImage(gameImages.townBG, 0, 0, canvas.width, canvas.height);
    } else if (currentMap === roomMap) {
        ctx.drawImage(gameImages.townBG, 0, 0, canvas.width, canvas.height); 
    }

    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    for (let r = 0; r < currentMap.length; r++) {
        for (let c = 0; c < currentMap[r].length; c++) {
            let tileX = c * TILE_SIZE - camera.x;
            let tileY = r * TILE_SIZE - camera.y;
            if (tileX > -TILE_SIZE && tileX < viewWidth && tileY > -TILE_SIZE && tileY < viewHeight) {
                if (currentMap[r][c] === 1) ctx.drawImage(gameImages.wall, tileX, tileY, TILE_SIZE, TILE_SIZE);
                else if (currentMap[r][c] === 2) ctx.drawImage(gameImages.servant, tileX, tileY, TILE_SIZE, TILE_SIZE);
                else if (currentMap[r][c] === 9) ctx.drawImage(gameImages.gate, tileX, tileY, TILE_SIZE, TILE_SIZE);
                else if ([3,4,5,6].includes(currentMap[r][c])) {
                    ctx.fillStyle = "#38bdf8";
                    ctx.fillRect(tileX + 8, tileY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                } else if (currentMap[r][c] === 8) {
                    ctx.fillStyle = "#eab308";
                    ctx.fillRect(tileX + 4, tileY, TILE_SIZE - 8, TILE_SIZE);
                }
            }
        }
    }

    let playerTileX = playerObj.x - camera.x;
    let playerTileY = playerObj.y - camera.y;
    ctx.drawImage(gameImages.player, playerTileX, playerTileY, playerObj.width, playerObj.height);
    ctx.restore();

    if (isExploring) requestAnimationFrame(updatePlatformer);
}

/* ==========================================================================
   SHOP & TEAM SELECTION SYSTEM
   ========================================================================== */
function openSelectionScreen() {
    document.getElementById("platformer-screen").style.display = "none";
    document.getElementById("team-selection-screen").style.display = "block";
    renderShop();
}

function renderShop() {
    const roster = document.getElementById("selection-roster");
    roster.innerHTML = "";
    document.getElementById("energy-display").innerText = soulEnergy;

    const availableClasses = [1, 2, 3, 4, 5, 7];
    availableClasses.forEach(classId => {
        let base = classData[classId];
        let cost = 2; 
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

/* ==========================================================================
   TURN-BASED BATTLE ENGINE
   ========================================================================== */
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
            defending: false,
            controlled: false,
            status: ""
        };
    });

    document.getElementById("team-selection-screen").style.display = "none";
    document.getElementById("battle-screen").style.display = "block";

    boss.hp = boss.maxHp;
    boss.npCounter = 0;
    boss.revealed = false;
    enemies = [boss];

    if (boss.classId === 8) {
        enemies.push({ name: "Binh Lính", hp: 150, maxHp: 150, atk: 25, spd: 35 });
        enemies.push({ name: "Binh Lính", hp: 150, maxHp: 150, atk: 25, spd: 35 });
    }

    gameOver = false;
    document.getElementById("battle-log").innerHTML = "";
    logSystem("⚔️ Trận chiến bắt đầu! Vòng tuần hoàn tốc độ đã thiết lập.");
    
    renderBoss();
    renderTeam();
    generateBattleQueue();

    showDialogue("", [
        { name: "The Nightmare Soul", text: "Chết tiệt, thế quái nào sức mạnh của cả UIT lại mạnh đến như vậy?" },
        { name: "The Nightmare Soul", text: "Không sao, Abyss Gate sẽ được mở ra một lần nữa!" },
        { name: "???", text: "Triệu hồi Anh Linh!!! Hãy tiến lên theo thứ tự tốc độ!" }
    ]);
    nextTurnInQueue();
}

function generateBattleQueue() {
    battleQueue = [];
    queueIndex = 0;
    team.forEach(s => {
        if (s.hp > 0) battleQueue.push({ type: 'player', ref: s, spd: classData[s.classId].spd });
    });
    enemies.forEach(e => {
        if (e.hp > 0) battleQueue.push({ type: 'enemy', ref: e, spd: e.spd || classData[boss.classId].spd });
    });
    battleQueue.sort((a, b) => b.spd - a.spd);
    let orderStr = battleQueue.map(item => `${item.ref.name} (${item.spd})`).join(" ➔ ");
    logSystem(`⏳ <b>Vòng đấu mới bắt đầu! Thứ tự:</b> ${orderStr}`);
}

async function nextTurnInQueue() {
    if (gameOver) return;
    if (queueIndex >= battleQueue.length) {
        generateBattleQueue();
    }
    let currentUnit = battleQueue[queueIndex];
    if (currentUnit.ref.hp <= 0) {
        queueIndex++;
        nextTurnInQueue();
        return;
    }

    if (currentUnit.type === 'player') {
        let servantIndex = team.findIndex(s => s.uid === currentUnit.ref.uid);
        currentTurn = servantIndex;
        renderTeam();
        
        if (currentUnit.ref.controlled) {
            logSystem(`🔮 ${currentUnit.ref.name} bị thao túng và bỏ lượt!`);
            await sleep(1000);
            queueIndex++;
            nextTurnInQueue();
            return;
        }

        document.getElementById("turn-info").innerText = `Lượt hành động: ${currentUnit.ref.name}`;
        document.getElementById("skill-btn").disabled = currentUnit.ref.np < 20;
        document.getElementById("np-btn").disabled = currentUnit.ref.np < 100;
        setActionsEnabled(true);
    } else {
        setActionsEnabled(false);
        document.getElementById("turn-info").innerText = `Lượt của: ${currentUnit.ref.name}`;
        await sleep(1200);
        if (currentUnit.ref.name === "The Nightmare Soul") {
            await executeBossTurn();
        } else {
            await executeMinionTurn(currentUnit.ref);
        }
    }
}

function setActionsEnabled(enabled) {
    const btns = document.querySelectorAll("#action-panel .btn-action");
    btns.forEach(btn => btn.disabled = !enabled);
}

function logPlayer(msg) { document.getElementById("battle-log").innerHTML += `<div class="log log-player">${msg}</div>`; scrollLog(); }
function logBoss(msg) { document.getElementById("battle-log").innerHTML += `<div class="log log-boss">${msg}</div>`; scrollLog(); }
function logSystem(msg) { document.getElementById("battle-log").innerHTML += `<div class="log log-system">${msg}</div>`; scrollLog(); }
function scrollLog() { const el = document.getElementById("battle-log"); el.scrollTop = el.scrollHeight; }

async function playerAction(type) {
    setActionsEnabled(false);
    let servant = team[currentTurn];
    let aliveEnemies = enemies.filter(e => e.hp > 0);
    let target = aliveEnemies[0]; 

    let dmg = 0;
    const cards = document.querySelectorAll(".servant-card");
    const bossCard = document.querySelector(".boss-ui");

    if (type === 'attack') {
        playSFX("attack", servant.classId);
        dmg = Math.floor(servant.atk * (1 + (typeAdvantage[`${servant.classId}-${boss.classId}`] || 0)));
        target.hp -= dmg;
        servant.np = Math.min(100, servant.np + classData[servant.classId].npGain);
        logPlayer(`⚔️ ${servant.name} tấn công gây ${dmg} sát thương. Hồi NP.`);
        popDamageText(bossCard, dmg, false, true, false);
    } else if (type === 'skill') {
        if (servant.np < 20) return;
        servant.np -= 20;
        playSFX("skill", servant.classId);
        switch(servant.classId) {
            case 1:
                servant.defending = true;
                servant.status = "🛡️ Khiên Thép";
                logPlayer("Knight bật khiên phòng thủ giảm 50% sát thương nhận vào.");
                break;
            case 2:
                let hits = Math.floor(Math.random() * 3) + 2;
                dmg = Math.floor(servant.atk * 0.5 * hits);
                target.hp -= dmg;
                logPlayer(`🏹 Archer xả liên hoàn tiễn bắn trúng ${hits} phát gây ${dmg} sát thương.`);
                popDamageText(bossCard, dmg, false, true, false);
                break;
            case 3:
                dmg = Math.floor(servant.atk * 1.8);
                target.hp -= dmg;
                logPlayer(`🔥 Mage niệm đại hỏa cầu thiêu rụi mục tiêu gây ${dmg} sát thương.`);
                popDamageText(bossCard, dmg, false, true, false);
                break;
            case 4:
                dmg = Math.floor(servant.atk * 2.2);
                target.hp -= dmg;
                logPlayer(`🗡️ Assassin xuất quỷ nhập thần băm nát nhược điểm gây ${dmg} sát thương.`);
                popDamageText(bossCard, dmg, false, true, false);
                break;
            case 5:
                team.forEach(s => { if(s.hp > 0) s.hp = Math.min(s.maxHp, s.hp + 120); });
                logPlayer(`💚 Healer kích hoạt Vòng Tròn Thanh Tẩy hồi 120 HP cho toàn đội.`);
                renderTeam();
                break;
            case 7:
                dmg = Math.floor(servant.atk * 1.5);
                target.hp -= dmg;
                boss.atkDebuff = 15;
                boss.atkDebuffTurn = 2;
                logPlayer(`🔱 Lancer phóng thương gây ${dmg} sát thương và làm giảm 15 sức tấn công của Boss trong 2 lượt.`);
                popDamageText(bossCard, dmg, false, true, false);
                break;
        }
    } else if (type === 'np') {
        if (servant.np < 100) return;
        servant.np = 0;
        playSFX("np", servant.classId);
        dmg = Math.floor(servant.atk * 4.0 * (1 + (typeAdvantage[`${servant.classId}-${boss.classId}`] || 0)));
        target.hp -= dmg;
        logPlayer(`🔥 <b>[NOBLE PHANTASM]</b> ${servant.name} khai mở Tuyệt Kỹ Tối Thượng giáng xuống đầu Boss ${dmg} sát thương cực đại!`);
        popDamageText(bossCard, dmg, true, true, false);
    }

    renderBoss();
    renderTeam();
    if (checkWin()) return;

    await sleep(1000);
    queueIndex++;
    nextTurnInQueue();
}

async function executeBossTurn() {
    if (!boss.revealed) {
        boss.revealed = true;
        document.getElementById("boss-name").innerText = `${boss.name} (${classData[boss.classId].name})`;
        document.getElementById("boss-hint").innerText = bossHints[boss.classId];
    }

    let aliveTargets = team.filter(s => s.hp > 0);
    if (aliveTargets.length === 0) return;
    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    let targetIndex = team.findIndex(s => s.uid === target.uid);
    const cards = document.querySelectorAll(".servant-card");

    boss.npCounter++;
    let effectiveAtk = boss.atk;
    if (boss.atkDebuffTurn > 0) {
        effectiveAtk = Math.max(10, boss.atk - boss.atkDebuff);
        boss.atkDebuffTurn--;
    }

    if (boss.npCounter >= 3) {
        boss.npCounter = 0;
        playSFX("boss_np");
        logBoss(`🔥 <b>[BOSS TUYỆT KỸ]</b> Vực Thẳm Phá Diệt càn quét đội hình!`);
        team.forEach((s, idx) => {
            if (s.hp > 0) {
                let nDmg = Math.floor(effectiveAtk * 2.0);
                if (s.defending) nDmg = Math.floor(nDmg * 0.5);
                s.hp -= nDmg;
                popDamageText(cards[idx], nDmg, true, false, true);
            }
        });
        logBoss(`💥 Tuyệt kỹ gây sát thương diện rộng lên toàn bộ Anh Linh.`);
    } else {
        let roll = Math.random();
        if (roll < 0.4) {
            playSFX("boss_skill");
            let dmg = 0;
            switch(boss.classId) {
                case 1:
                    boss.defending = true;
                    logBoss(`🛡️ KỸ NĂNG: Boss bật Hộ Thể Ma Giáp tăng phòng thủ cực đại!`);
                    break;
                case 2:
                    dmg = Math.floor(effectiveAtk * 1.5);
                    target.hp -= dmg;
                    logBoss(`🏹 KỸ NĂNG: Ma Tiễn Vực Thẳm bắn tỉa ${target.name} gây ${dmg} ST!`);
                    popDamageText(cards[targetIndex], dmg, true, false, true);
                    break;
                case 3:
                    dmg = Math.floor(effectiveAtk * 1.2);
                    team.forEach((s, idx) => { if(s.hp > 0) { s.hp -= dmg; popDamageText(cards[idx], dmg, false, false, true); } });
                    logBoss(`🔥 KỸ NĂNG: Hỏa Ngục Ma Bùng Nổ thiêu cháy cả đội hình gây ${dmg} ST mỗi người!`);
                    break;
                case 4:
                    target.controlled = true;
                    logBoss(`🔮 KỸ NĂNG: Ám Ảnh Tâm Trí khống chế thành công ${target.name}!`);
                    break;
                case 5:
                    boss.hp = Math.min(boss.maxHp, boss.hp + 200);
                    logBoss(`💚 KỸ NĂNG: Hồi Huyết Linh Hồn ma thuật hồi phục 200 HP cho Boss!`);
                    break;
                case 7:
                    dmg = Math.floor(effectiveAtk * 1.8);
                    if (target.defending) dmg = Math.floor(dmg * 0.5);
                    target.hp -= dmg;
                    logBoss(`🔱 KỸ NĂNG: Giáo Tuyệt Vọng xuyên thấu ${target.name} gây ${dmg} ST!`);
                    popDamageText(cards[targetIndex], dmg, true, false, true);
                    break;
                default:
                    dmg = Math.floor(effectiveAtk * 1.3);
                    target.hp -= dmg;
                    logBoss(`👹 KỸ NĂNG: Ám Khí Tung Hoành quất mạnh vào ${target.name} gây ${dmg} ST!`);
                    popDamageText(cards[targetIndex], dmg, true, false, true);
                    break;
            }
        } else {
            playSFX("boss_attack");
            let damage = Math.floor(effectiveAtk);
            if (target.defending) damage = Math.floor(damage * 0.5);
            target.hp -= damage;
            logBoss(`👹 Boss đánh thường ${target.name} gây ${damage} sát thương.`);
            popDamageText(cards[targetIndex], damage, false, false, true); 
        }
    }

    team.forEach(s => { s.defending = false; });
    renderBoss(); 
    renderTeam();
    if (checkLose()) return;

    await sleep(1000);
    queueIndex++;
    nextTurnInQueue();
}

async function executeMinionTurn(minion) {
    let aliveTargets = team.filter(s => s.hp > 0 && !s.controlled);
    if (aliveTargets.length > 0) {
        let t = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        let tIdx = team.findIndex(s => s.uid === t.uid);
        const cards = document.querySelectorAll(".servant-card");
        
        let mDmg = Math.floor(minion.atk);
        if (t.defending) mDmg = Math.floor(mDmg * 0.5);
        t.hp -= mDmg;
        logBoss(`🗡️ Binh Lính vung kiếm chém ${t.name} gây ${mDmg} sát thương.`);
        popDamageText(cards[tIdx], mDmg, false, false, true);
    }
    renderTeam();
    if (checkLose()) return;

    await sleep(1000);
    queueIndex++;
    nextTurnInQueue();
}

function renderBoss() {
    document.getElementById("boss-hp-fill").style.width = (Math.max(0, boss.hp) / boss.maxHp) * 100 + "%";
    document.getElementById("boss-hp-text").innerText = `${Math.max(0, Math.floor(boss.hp))}/${boss.maxHp}`;
    
    const dots = document.querySelectorAll("#boss-charge-dots .dot");
    dots.forEach((dot, idx) => {
        if (idx < boss.npCounter) dot.classList.add("filled");
        else dot.classList.remove("filled");
    });

    const mZone = document.getElementById("minions-zone");
    mZone.innerHTML = "";
    enemies.forEach((e, idx) => {
        if (idx > 0 && e.hp > 0) {
            mZone.innerHTML += `
                <div class="minion-card">
                    <div>💀 ${e.name}</div>
                    <div class="bar-container hp">
                        <div class="bar-fill hp-fill" style="width:${(e.hp/e.maxHp)*100}%"></div>
                        <span class="bar-text">${Math.floor(e.hp)}/${e.maxHp}</span>
                    </div>
                </div>
            `;
        }
    });
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
        
        if (servant.status) {
            template.querySelector(".servant-status").innerText = servant.status;
        }
        container.appendChild(template);
    });
}

function popDamageText(parentEl, amount, isCritical, isPlayerDealer, isBossDealer) {
    if (!parentEl) return;
    const pop = document.createElement("div");
    pop.className = `dmg-pop ${isPlayerDealer ? 'dmg-boss-pop' : 'dmg-player-pop'}`;
    pop.innerText = amount + (isCritical ? "!" : "");
    parentEl.style.position = "relative";
    parentEl.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function checkWin() {
    if (boss.hp <= 0) {
        gameOver = true;
        isExploring = false;
        showDialogue("Hệ Thống", [
            "🎉 CHÚC MỪNG! Boss tối thượng Vực Thẳm đã bị tiêu diệt!",
            "UIT đã tạm thời an toàn trước thế lực bóng tối.",
            "Không gian xung quanh đang sụp đổ và dịch chuyển bạn về khu vực an toàn..."
        ]);
        let checkDialog = setInterval(() => {
            if (!isDialogueActive) {
                clearInterval(checkDialog);
                enterPostBossRoom();
            }
        }, 500);
        return true;
    }
    return false;
}

function checkLose() {
    let alive = team.filter(s => s.hp > 0);
    if (alive.length === 0) {
        gameOver = true;
        alert("💥 Toàn bộ tổ đội đã tử trận! Trận chiến thất bại.");
        location.reload();
        return true;
    }
    return false;
}

function enterPostBossRoom() {
    document.getElementById("battle-screen").style.display = "none";
    document.getElementById("platformer-screen").style.display = "block";
    currentMap = roomMap;
    playerObj.x = 80;
    playerObj.y = 400;
    playerObj.vx = 0;
    playerObj.vy = 0;
    isExploring = true;
    npcTalked = false;
    showDialogue("Sơn", [
        "Mình kiệt sức rồi...",
        "Trận chiến căng thẳng quá, phải về phòng nghỉ ngơi thôi!"
    ]);
    requestAnimationFrame(updatePlatformer);
}