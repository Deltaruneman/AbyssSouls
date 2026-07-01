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
for (let i = 1; i <= 8; i++) {
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
            startBtn.innerText = "BẮT ĐẦU";
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
    // def = giáp chống vật lí, res = giáp chống phép. dmgType = loại sát thương class này gây ra.
    1:{ id:1, name:"Knight", icon:"🛡️", spd:60, hp:550, atk:40, npGain: 15, def:35, res:15, dmgType:"physical" },
    2:{ id:2, name:"Archer", icon:"🏹", spd:90, hp:250, atk:60, npGain: 25, def:10, res:10, dmgType:"physical" },
    3:{ id:3, name:"Mage", icon:"🔥", spd:70, hp:320, atk:55, npGain: 35, def:8,  res:30, dmgType:"magic" },
    4:{ id:4, name:"Assassin", icon:"🗡️", spd:100, hp:280, atk:65, npGain: 30, def:12, res:8,  dmgType:"physical" },
    5:{ id:5, name:"Healer", icon:"💚", spd:40, hp:400, atk:20, npGain: 25, def:18, res:28, dmgType:"magic" },
    6:{ id:6, name:"Berserker", icon:"🛡️", spd:50, hp:300, atk:35, npGain: 15, def:10, res:10, dmgType:"physical" },
    7:{ id:7, name:"Lancer", icon:"🔱", spd:80, hp:450, atk:48, npGain: 20, def:25, res:12, dmgType:"physical" },
    8:{ id:8, name:"Summoner", icon:"🔮", spd:30, hp:300, atk:50, npGain: 30, def:12, res:25, dmgType:"magic" }
};
// Lấy loại sát thương (vật lí / phép) dựa theo classId. Mage, Healer, Summoner => phép, còn lại => vật lí.
function getDmgType(classId) {
    return (classData[classId] && classData[classId].dmgType) || "physical";
}
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

let selectedClasses = []; // Lưu classId người chơi chọn trong cửa hàng  
let team = [];              
let currentTurn = 0;
let gameOver = false;
let bossTurnCount = 0;
let soulEnergy = 0; // Năng lượng

let bossClassId = Math.floor(Math.random() * 8) + 1;
let boss = {
    name: "The Nightmare Soul", classId: bossClassId,
    revealed: false, maxHp: 1000, hp: 1000, atk: 65, atkDebuff: 0, atkDebuffTurn: 0, npCounter: 0, defending: false, energy: 100,
    def: classData[bossClassId].def, res: classData[bossClassId].res,
    effects: { slow: 0, burn: 0 }
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

// ====== PHASE 2: SƠN (SUMMONER) BỊ THƯƠNG, CHỈ TRIỆU HỒI THÊM ĐƯỢC 1 SERVANT ======
let secondPhaseUnlocked = false;   // true sau khi xem hội thoại mới ở tile 8 (Thị Trấn -> Room)
let secondGateLockedMsgShown = false; // chỉ hiện gợi ý "cổng đang đóng" 1 lần
let isSecondPhase = false;         // true khi đang ở giai đoạn chiêu mộ/chiến đấu lần 2
function getMaxRecruit() { return isSecondPhase ? 1 : 3; }

// ====== TRỌNG (ASSASSIN CỐ ĐỊNH - TEAM UP TẠI TILE 8 CỦA ROOM) ======
let trongJoined = false;           // true sau khi Trọng chất vấn Sơn và quyết định team up
let permanentAllies = [];          // danh sách đồng đội cố định (hiển thị trong Menu Team [L])
let isTeamMenuOpen = false;

// Tạo 1 bản thể chiến đấu mới của Trọng cho mỗi trận (hồi đầy HP/NP mỗi khi vào trận).
// Trọng luôn giữ class Assassin và KHÔNG THỂ đổi/gỡ bỏ khỏi đội hình.
function createTrong() {
    let base = classData[4]; // Assassin
    return {
        uid: 'trong-fixed-' + Date.now() + Math.random(),
        classId: 4,
        name: "Trọng",
        icon: "🗡️",
        maxHp: base.hp + 60,
        hp: base.hp + 60,
        atk: base.atk + 5,
        def: base.def,
        res: base.res,
        np: 0,
        alive: true,
        defending: false,
        reflect: false,
        status: "",
        controlled: false,
        effects: { slow: 0, burn: 0 },
        isTrong: true,     // đánh dấu để dùng kỹ năng độc quyền (sát thương + hút máu)
        fixedClass: true   // không thể đổi class hay gỡ khỏi đội
    };
}

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
    [1,0,0,0,7,0,0,0,0,0,3,0,0,10,0,0,0,8,0,1],
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

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (isTeamMenuOpen) { closeTeamMenu(); return; }
        toggleESCMenu();
    }
    if (e.key === 'l' || e.key === 'L') {
        toggleTeamMenu();
    }
});

/* ==========================================================================
   TEAM MENU (Phím [L]) - Xem đội hình hiện tại + đồng đội cố định (vd: Trọng)
   ========================================================================== */
function toggleTeamMenu() {
    if (isTeamMenuOpen) { closeTeamMenu(); return; }
    // Chỉ cho mở khi đang khám phá, không trong hội thoại/ESC menu/chiến đấu
    if (!isExploring || isDialogueActive || isMenuOpen) return;
    openTeamMenu();
}

function buildTeamMenuCardHTML(unit, isFixed) {
    let hpPct = unit.maxHp ? Math.max(0, (unit.hp / unit.maxHp) * 100) : 100;
    let npPct = typeof unit.np === 'number' ? unit.np : 0;
    let roleLabel = unit.role || (classData[unit.classId] ? classData[unit.classId].name : "");
    return `
        <div class="roster-card" style="cursor:default; width: 160px;">
            <div style="font-size: 32px;">${unit.icon || "❔"}</div>
            <div style="margin-top: 8px; font-weight: bold; font-size: 15px;">${unit.name}${isFixed ? " 🔒" : ""}</div>
            <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">${roleLabel}</div>
            ${unit.maxHp ? `
            <div class="bar-container hp" style="margin-top:10px;"><div class="bar-fill" style="width:${hpPct}%"></div><span class="bar-text">${Math.max(0, Math.floor(unit.hp))}/${unit.maxHp}</span></div>
            <div class="bar-container np"><div class="bar-fill" style="width:${npPct}%"></div><span class="bar-text">NP ${npPct}/100</span></div>
            ` : `<div style="margin-top:10px; font-size:11px; color:#f1c40f;">Đồng đội cố định</div>`}
            ${isFixed ? `<div style="margin-top:6px; font-size:10px; color:#a855f7;">Class cố định - không thể thay đổi</div>` : ""}
        </div>`;
}

function openTeamMenu() {
    isTeamMenuOpen = true;
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = false;

    let cardsHTML = "";

    if (team.length > 0) {
        team.forEach(s => { cardsHTML += buildTeamMenuCardHTML(s, !!s.fixedClass); });
    } else {
        permanentAllies.forEach(a => { cardsHTML += buildTeamMenuCardHTML(a, true); });
        if (permanentAllies.length === 0) {
            cardsHTML = `<div style="color:#94a3b8; padding: 20px; text-align:center;">Chưa có đồng đội nào. Hãy chiêu mộ Anh Linh tại Cổng Linh Hồn!</div>`;
        }
    }

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "team-menu-overlay";
    overlay.innerHTML = `
        <div class="esc-menu-content" style="width: 640px; max-width: 90vw;">
            <h2>📋 ĐỘI HÌNH HIỆN TẠI</h2>
            <div class="roster-grid" style="margin-bottom: 20px;">${cardsHTML}</div>
            <button class="menu-btn" id="close-team-menu-btn">Đóng [L]</button>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById("close-team-menu-btn").onclick = closeTeamMenu;
}

function closeTeamMenu() {
    isTeamMenuOpen = false;
    const overlay = document.getElementById("team-menu-overlay");
    if (overlay) overlay.remove();
}

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

const originalUpdatePlatformer = updatePlatformer;
updatePlatformer = function() {
    if (isMenuOpen) return; 
    originalUpdatePlatformer();
};
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
        else if (e.key === 'e' || e.key === 'E') {
        interactNPC();
        }
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
            showDialogue("Cơm chiên Vũ Sigma", ["Em đến ăn cơm à?", "Tiếc quá, anh lại đống cửa rồi."]);

        } else if (currentTile === 6) {
            playerObj.vx = 0;
             showDialogue("", [
            { name: "Chủ tiệm tạp hóa", text: "Lô iem, lại mua mì tôm à" },
            { name: "Sơn", text: "Dạ cho em 2 gối mì 1 xúc xích và 5k nước đá ạ." },
            { name: "Chủ tiệm tạp hóa", text: "Ok, đây em." },
            { name: "Sơn", text: "(chuyển khoản)." }
          
        ]);
        }
    }
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
            { name: "Trọng", text: "... (nghi ngờ )" }
        ]);
            }

           if (currentTile === 8) {
    if (currentMap === roomMap) {
        currentMap = townMap;
        playerObj.x = 80; 
        playerObj.y = 400;
        showDialogue("Hệ Thống", ["Bạn đã được dịch chuyển đến Thị Trấn.", "Hãy lại gần các NPC và nhấn phím [E] để trò chuyện."]);
    } else if ( currentMap === townMap) {
        currentMap = roomMap;
        playerObj.x = 600; 
        playerObj.y = 400;

        if (!secondPhaseUnlocked) {
            secondPhaseUnlocked = true;
            trongJoined = true;
            permanentAllies.push({ name: "Trọng", icon: "🗡️", role: "Assassin (Cố định) - Sát Thương & Hút Máu" });

            showDialogue("", [
                { name: "Trọng", text: "Sơn! Đứng lại đã, tao có chuyện muốn hỏi mày." },
                { name: "Sơn", text: "...Trọng? Mày theo tao về tận đây làm gì?" },
                { name: "Trọng", text: "Lúc nãy tay mày phát sáng một luồng năng lượng kỳ lạ. Đó không phải ánh sáng bình thường đâu, Sơn." },
                { name: "Trọng", text: "Đó là mana. Tao cảm nhận được." },
                { name: "Sơn", text: "(im lặng một lúc) ... Mày cũng có khả năng nhận ra mana sao?" },
                { name: "Trọng", text: "Tao có lý do của tao. Giờ tới lượt mày, nói thật đi." },
                { name: "Sơn", text: "(thở dài) Được rồi... Abyss đã lan đến đây. Tao đang cố ngăn nó lại bằng cách triệu hồi Anh Linh." },
                { name: "Trọng", text: "Vậy nên mày cứ lén lút đi một mình à? Từ giờ có tao rồi." },
                { name: "Sơn", text: "Nguy hiểm lắm đó Trọng, mày chắc chắn muốn dính vào không?" },
                { name: "Trọng", text: "Càng nguy hiểm càng cần có tao bên cạnh. Team up thôi, đừng hỏi nhiều." },
                { name: "Trọng", text: "Cánh cổng linh hồn trong phòng này... để tao mở nó ra." },
                { name: "Trọng", text: "Nếu may mắn, nó sẽ giúp bọn mình lần ra được nguồn phát tán của Abyss Gate." },
                { name: "Hệ Thống", text: "🗡️ Trọng đã gia nhập đội hình vĩnh viễn! (Assassin cố định - Kỹ năng độc quyền: Sát Thương & Hút Máu)" },
                { name: "Hệ Thống", text: "💡 Nhấn phím [L] để mở Menu Team bất cứ lúc nào trong lúc khám phá." }
            ]);
        }
        return;
    }
}

            // XỬ LÝ CỔNG TRIỆU HỒI LẦN 2 (Tile 10) - chỉ hoạt động sau hội thoại mở khóa ở Thị Trấn
            if (currentTile === 10 && currentMap === roomMap) {
                if (!secondPhaseUnlocked) {
                    if (!secondGateLockedMsgShown) {
                        secondGateLockedMsgShown = true;
                        playerObj.vx = 0;
                        showDialogue("Sơn", ["Cánh cổng này... cảm giác kỳ lạ thật. Có lẽ mình cần biết thêm điều gì đó trước khi mở nó ra."]);
                    }
                } else if (!isSecondPhase) {
                    isExploring = false;
                    isSecondPhase = true;
                    soulEnergy = Math.max(soulEnergy, 3);
                    playSFX('gate');
                    showDialogue("Sơn", [
                        "Vết thương vẫn còn đau, mana trong người cũng đã cạn gần hết...",
                        "Nhưng mình vẫn còn đủ sức triệu hồi thêm 1 Anh Linh nữa.",
                        "Lần này phải cẩn trọng hơn."
                    ]);
                    let waitClose = setInterval(() => {
                        if (!isDialogueActive) {
                            clearInterval(waitClose);
                            openSelectionScreen();
                        }
                    }, 500);
                    return;
                }
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
                else if (currentMap[r][c] === 4) {
                    ctx.fillStyle = "#dbcd34"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
                else if (currentMap[r][c] === 5) {
                    ctx.fillStyle = "#344ddb"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
                else if (currentMap[r][c] === 6) {
                    ctx.fillStyle = "#db3490"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
                // Vẽ Cửa ra
                else if (currentMap[r][c] === 8) {
                    ctx.fillStyle = "#f1c40f"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
                // Vẽ Cổng Triệu Hồi Lần 2 (chỉ có trong roomMap)
                else if (currentMap[r][c] === 10) {
                    ctx.fillStyle = secondPhaseUnlocked ? "#9b59b6" : "#3b2540";
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = "#e0aaff";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(tileX + 2, tileY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
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

    const titleEl = document.getElementById("team-select-title");
    const descEl = document.getElementById("team-select-desc");
    if (isSecondPhase) {
        if (titleEl) titleEl.innerText = "Triệu Hồi Anh Linh Cuối Cùng";
        if (descEl) descEl.innerText = "Sơn (Summoner) đã bị thương và sẽ luôn tham chiến cùng đội. Vết thương khiến mana cạn kiệt, giờ chỉ còn đủ sức triệu hồi thêm 1 Anh Linh duy nhất.";
    } else {
        if (titleEl) titleEl.innerText = "Chiêu Mộ Đội Hình";
        if (descEl) descEl.innerText = "Sử dụng Năng Lượng Linh Hồn để chiêu mộ Anh Linh. Click để chọn (mua) hoặc bỏ chọn (hoàn năng lượng).";
    }

    renderShop(); 
}

function renderShop() {
    document.getElementById("energy-display").innerText = soulEnergy;
    const roster = document.getElementById("selection-roster");
    roster.innerHTML = "";
    const maxRecruit = getMaxRecruit();

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
            <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">${base.dmgType === "magic" ? "✨ Sát thương Phép" : "⚔️ Sát thương Vật lí"}</div>
            <div style="margin-top: 4px; font-size: 12px; color: #94a3b8;">🛡️DEF ${base.def} | 🔮RES ${base.res}</div>
            <div style="margin-top: 8px; color: #00d2ff; font-size: 14px; font-weight: bold;">💎 ${cost} NL</div>
        `;

        card.onclick = () => {
            if (selectedClasses.includes(classId)) {
                selectedClasses = selectedClasses.filter(id => id !== classId);
                soulEnergy += cost;
            } else {
                if (selectedClasses.length >= maxRecruit) {
                    alert(`Chỉ được chọn tối đa ${maxRecruit} Servant để xuất chiến!`);
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

    document.getElementById("selection-count").innerText = `Đã chọn: ${selectedClasses.length}/${maxRecruit}`;
    document.getElementById("confirm-team-btn").disabled = selectedClasses.length !== maxRecruit;
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
            def: base.def,
            res: base.res,
            np: 0, 
            alive: true, 
            defending: false, 
            reflect: false, 
            status: "", 
            controlled: false,
            effects: { slow: 0, burn: 0 }
        };
    });

    if (isSecondPhase) {
        // Sơn (Summoner) bị thương nhưng vẫn luôn ra trận cùng đội, đứng đầu hàng ngũ
        let sonBase = classData[8];
        team.unshift({
            uid: Date.now() + Math.random(),
            classId: 8,
            name: "Sơn",
            icon: sonBase.icon,
            maxHp: sonBase.hp,
            hp: sonBase.hp,
            atk: sonBase.atk,
            def: sonBase.def,
            res: sonBase.res,
            np: 0,
            alive: true,
            defending: false,
            reflect: false,
            status: "",
            controlled: false,
            effects: { slow: 0, burn: 0 }
        });

        // Trọng luôn ra trận cùng Sơn kể từ khi team up ở Room. Class của Trọng cố định
        // (Assassin) và không thể thay đổi hay gỡ khỏi đội hình trong màn chiêu mộ.
        if (trongJoined) {
            team.push(createTrong());
        }

        spawnNewBoss();
    }

    document.getElementById("team-selection-screen").style.display = "none";
    startBattle();
}

// Sinh Boss mới cho trận chiến lần 2 (boss cũ đã bị tiêu diệt nên không thể tái sử dụng)
function spawnNewBoss() {
    bossClassId = Math.floor(Math.random() * 8) + 1;
    boss = {
        name: "The Nightmare Soul", classId: bossClassId,
        revealed: false, maxHp: 1000, hp: 1000, atk: 65, atkDebuff: 0, atkDebuffTurn: 0, npCounter: 0, defending: false, energy: 100,
        def: classData[bossClassId].def, res: classData[bossClassId].res,
        effects: { slow: 0, burn: 0 }
    };
    gameOver = false;
    bossTurnCount = 0;
    queueIndex = 0;
    battleQueue = [];
    controlledServant = null;
    enemies = [];
    window.teamProtectionTurn = 0;
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

// Công thức giảm sát thương: giáp 100 sẽ giảm 50% sát thương loại tương ứng. Pierce sẽ bỏ qua bước này.
function mitigateDamage(rawDmg, target, dmgType) {
    let stat = (dmgType === "magic") ? (target.res || 0) : (target.def || 0);
    let factor = 100 / (100 + stat);
    return Math.max(1, Math.floor(rawDmg * factor));
}

// Tốc độ thực tế dùng để xếp hàng lượt đánh, có tính Slow (-30%)
function getEffectiveSpd(unit, baseSpd) {
    if (unit.effects && unit.effects.slow > 0) return Math.floor(baseSpd * 0.7);
    return baseSpd;
}

// Xử lí sát thương Thiêu Đốt (Burn) khi vào lượt của 1 đơn vị. Trả về số dmg đã gây ra (0 nếu không bị Burn).
function tickBurn(unit) {
    if (unit.effects && unit.effects.burn > 0 && unit.hp > 0) {
        let burnDmg = Math.max(1, Math.floor(unit.maxHp * 0.10));
        unit.hp -= burnDmg;
        unit.effects.burn--;
        logSystem(`🔥 ${unit.icon ? unit.icon + " " : ""}${unit.name} chịu ${burnDmg} sát thương từ Thiêu Đốt (Burn)!`);
        return burnDmg;
    }
    return 0;
}

// Chuỗi icon hiệu ứng đang tồn tại trên 1 đơn vị, dùng để hiển thị UI
function effectIcons(unit) {
    if (!unit.effects) return "";
    let parts = [];
    if (unit.effects.slow > 0) parts.push(`🐌Slow(${unit.effects.slow})`);
    if (unit.effects.burn > 0) parts.push(`🔥Burn(${unit.effects.burn})`);
    return parts.join(" ");
}

// Sát thương từ Player -> Enemy (Boss/Minion). pierce = true sẽ bỏ qua def/res của mục tiêu.
function hitEnemy(target, amount, dmgType = "physical", pierce = false) {
    let finalDmg = Math.floor(amount);
    if (!pierce) finalDmg = mitigateDamage(finalDmg, target, dmgType);
    if (target.defending) finalDmg = Math.floor(finalDmg * 0.25); 
    target.hp -= finalDmg;
    return finalDmg;
}

// Sát thương từ Enemy (Boss/Minion) -> Player. pierce = true sẽ bỏ qua def/res của mục tiêu.
function hitPlayer(target, amount, dmgType = "physical", pierce = false) {
    let finalDmg = Math.floor(amount);
    if (!pierce) finalDmg = mitigateDamage(finalDmg, target, dmgType);
    if (target.defending) finalDmg = Math.floor(finalDmg * 0.5);
    target.hp -= finalDmg;
    return finalDmg;
}

function startBattle() {
    document.getElementById("battle-screen").style.display = "block";
    document.getElementById("boss-hint").innerText = bossHints[boss.classId];
    boss.spd = classData[boss.classId].spd;

    if (boss.classId === 8) {
        boss.maxHp = 300; boss.hp = 300; boss.atk = 50; boss.energy = 100;
    }
    enemies = [boss]; 
    controlledServant = null;

    logSystem("⚔️ Trận chiến bắt đầu! Vòng tuần hoàn tốc độ đã thiết lập.");
    renderBoss(); renderTeam();
    generateBattleQueue();
    if (isSecondPhase) {
        showDialogue("", [
            { name: "The Nightmare Soul", text: "Một linh hồn khác đã thức tỉnh... Lần này ngươi sẽ không thoát được nữa!" },
            { name: "Sơn", text: "Lần này chỉ còn lại tôi và một Anh Linh duy nhất... nhưng tôi sẽ không lùi bước!" }
        ]);
    } else {
        showDialogue("", [
            { name: "The Nightmare Soul", text: "Chết tiệt, thế quái nào sức mạnh của cả UIT lại mạnh đến như vậy?" },
            { name: "The Nightmare Soul", text: "Không sao, Abyss Gate sẽ được mở ra một lần nữa!" },
            { name: "???", text: "Triệu hồi Anh Linh!!! Hãy tiến lên theo thứ tự tốc độ!" }
        ]);
    }
    nextTurnInQueue();
}

function generateBattleQueue() {
    battleQueue = [];
    queueIndex = 0;
    team.forEach(s => { if (s.hp > 0) battleQueue.push({ type: 'player', ref: s, spd: getEffectiveSpd(s, classData[s.classId].spd) }); });
    enemies.forEach(e => { if (e.hp > 0) battleQueue.push({ type: 'enemy', ref: e, spd: getEffectiveSpd(e, e.spd || 30) }); });
    battleQueue.sort((a, b) => b.spd - a.spd);
    let orderStr = battleQueue.map(item => `${item.ref.name} (${item.spd})`).join(" ➔ ");
    logSystem(`⏳ <b>Vòng đấu mới bắt đầu! Thứ tự:</b> ${orderStr}`);
    // Giảm thời gian Slow còn lại sau khi đã dùng nó để tính thứ tự lượt của vòng này
    [...team, ...enemies].forEach(u => { if (u.effects && u.effects.slow > 0) u.effects.slow--; });
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

    // Hiệu ứng Thiêu Đốt (Burn) kích hoạt vào đầu lượt của đơn vị
    let burnedUnit = currentUnit.ref;
    let burnDmgDealt = tickBurn(burnedUnit);
    if (burnDmgDealt > 0) {
        if (currentUnit.type === 'player') renderTeam(); else renderBoss();
        if (burnedUnit.hp <= 0) {
            if (currentUnit.type === 'player') {
                if (checkLose()) return;
            } else if (burnedUnit === boss) {
                victory(); return;
            }
            queueIndex++;
            nextTurnInQueue();
            return;
        }
    }

    if (currentUnit.type === 'player') {
        let servant = currentUnit.ref;
        if (servant.controlled) {
            logSystem(`🧠 ${servant.name} đang bị thao túng và không thể nhận lệnh!`);
            queueIndex++;
            setTimeout(nextTurnInQueue, 800);
            return;
        }

        let servantIndex = team.findIndex(s => s.uid === servant.uid);
        currentTurn = servantIndex; 
        document.getElementById("turn-info").innerText = `LƯỢT: ${servant.icon} ${servant.name} (Tốc: ${classData[servant.classId].spd})`;
        document.getElementById("skill-btn").disabled = servant.np < 20;
        document.getElementById("np-btn").disabled = servant.np < 100;
        
        renderTeam();
        document.getElementById("action-panel").style.pointerEvents = "auto"; 
    } 
    else {
        document.getElementById("action-panel").style.pointerEvents = "none"; 
        document.getElementById("turn-info").innerText = `LƯỢT CỦA ĐỊCH: ${currentUnit.ref.name}`;
        
        await sleep(1000);
        if (currentUnit.ref === boss) {
            await executeBossTurn(); 
        } else {
            await executeMinionTurn(currentUnit.ref); 
        }
    }
}


function getModifier(attacker, defender) { return typeAdvantage[`${attacker}-${defender}`] || 0; }
function randomDamage(atk) { return Math.floor(atk + Math.random() * 10); }

function renderBoss() {
    const hpPercent = (boss.hp / boss.maxHp) * 100;
    document.getElementById("boss-hp-fill").style.width = Math.max(0, hpPercent) + "%";
    document.getElementById("boss-hp-text").innerText = `${Math.max(0, Math.floor(boss.hp))}/${boss.maxHp}`;
    if (boss.revealed) {
        document.getElementById("boss-name").innerText = `${boss.name} (${classData[boss.classId].name})`;
        const bossStatsEl = document.getElementById("boss-stats");
        if (bossStatsEl) {
            let dmgLabel = getDmgType(boss.classId) === "magic" ? "✨ Sát thương Phép" : "⚔️ Sát thương Vật lí";
            bossStatsEl.innerText = `${dmgLabel} | 🛡️DEF ${boss.def} | 🔮RES ${boss.res}`;
        }
    }
    const statusEl = document.getElementById("boss-status-effects");
    if (statusEl) statusEl.innerText = effectIcons(boss);
    const dots = document.querySelectorAll("#boss-charge-dots .dot");
    dots.forEach((dot, idx) => { if (idx < boss.npCounter) dot.classList.add("filled"); else dot.classList.remove("filled"); });

    const minionZone = document.getElementById("minions-zone");
    if (minionZone) {
        minionZone.innerHTML = "";
        enemies.forEach(e => {
            if (e !== boss && e.hp > 0) {
                let mHp = Math.max(0, Math.floor(e.hp));
                let mEffects = effectIcons(e);
                minionZone.innerHTML += `
                    <div class="minion-card">
                        <div>⚔️ ${e.name}</div>
                        <div class="bar-container hp"><div class="bar-fill hp-fill" style="width:${(e.hp/e.maxHp)*100}%"></div><span class="bar-text">${mHp}/${Math.floor(e.maxHp)}</span></div>
                        ${mEffects ? `<div class="minion-effects">${mEffects}</div>` : ""}
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
        let dmgLabel = getDmgType(servant.classId) === "magic" ? "✨ Phép" : "⚔️ Vật lí";
        template.querySelector(".servant-stats").innerText = `${dmgLabel} | 🛡️DEF ${servant.def} | 🔮RES ${servant.res}`;
        template.querySelector(".servant-hp-text").innerText = `HP: ${Math.max(0, Math.floor(servant.hp))}/${servant.maxHp}`;
        template.querySelector(".servant-np-text").innerText = `NP: ${servant.np}/100`;
        template.querySelector(".hp-fill").style.width = (Math.max(0, servant.hp) / servant.maxHp) * 100 + "%";
        const npFill = template.querySelector(".np-fill");
        npFill.style.width = servant.np + "%";
        if (servant.np >= 100) npFill.classList.add("np-ready");
        let statusParts = [servant.status, effectIcons(servant)].filter(Boolean);
        template.querySelector(".servant-status").innerText = statusParts.join(" ");
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

function gainNP(servant) {
    let gainAmount = classData[servant.classId]?.npGain || 25;
    servant.np = Math.min(100, servant.np + gainAmount);
    logSystem(`✨ ${servant.icon} ${servant.name} tích lũy thêm +${gainAmount} NP.`);
}

function revealBossCheck() {
    if (!boss.revealed && boss.hp <= boss.maxHp * 0.7) {
        boss.revealed = true;
        logSystem(`⚠️ CẢNH BÁO: Đã nhận diện class Boss [${classData[boss.classId].name}]`);
        renderBoss();
    }
}

async function playerAction(action) {
    if (gameOver) return;
    let currentUnit = battleQueue[queueIndex];
    if (!currentUnit || currentUnit.type !== 'player') return;
    let servant = currentUnit.ref;
    document.getElementById("action-panel").style.pointerEvents = "none";
    let aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) return;
    if (action === "attack") {
        playSFX("attack", servant.classId); 
        let dmgType = getDmgType(servant.classId);
        if (servant.classId === 3) { 
            aliveEnemies.forEach(e => {
                let raw = randomDamage(servant.atk) * (1 + getModifier(servant.classId, e.classId || 0));
                let dmg = hitEnemy(e, raw, dmgType);
                popDamageText(document.getElementById("boss-zone"), dmg, false);
            });
            logPlayer(`🔥 ${servant.name} dùng ma thuật đánh thường toàn bộ kẻ địch.`);
        } else {
            let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            let raw = randomDamage(servant.atk) * (1 + getModifier(servant.classId, target.classId || 0));
            let dmg = hitEnemy(target, raw, dmgType);
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
    queueIndex++;
    nextTurnInQueue();
}

function useSkill(servant) {
    if (servant.np < 20) return;
    servant.np -= 20;
    playSFX("skill", servant.classId); 

    let aliveEnemies = enemies.filter(e => e.hp > 0);
    let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    let dmg = 0;

    // Kỹ năng độc quyền của Trọng: gây sát thương và hút máu (chỉ Trọng làm được)
    if (servant.isTrong) {
        dmg = hitEnemy(target, servant.atk * 2.2 * (1 + getModifier(servant.classId, target.classId || 0)), "physical");
        let lifesteal = Math.floor(dmg * 0.5);
        servant.hp = Math.min(servant.maxHp, servant.hp + lifesteal);
        logPlayer(`🩸 Trọng dùng Huyết Kiếm đâm ${target.name} gây ${dmg} sát thương và hút lại ${lifesteal} HP!`);
        popDamageText(document.getElementById("boss-zone"), dmg, false);
        popDamageText(document.getElementById("player-team"), `+${lifesteal}`, false, true);
        return;
    }

    switch(servant.classId) {
        case 1: servant.defending = true; servant.status = "🛡️ Phản đòn"; logPlayer("Knight bật khiên phòng thủ."); break;
        case 2: 
            let hits = Math.floor(Math.random() * 5) + 1;
            let archerSkillPierce = Math.random() < 0.2;
            logPlayer(`🏹 Archer giương cung, xả ${hits} mũi tên liên hoàn!${archerSkillPierce ? " (Xuyên Giáp!)" : ""}`);
            for (let i = 0; i < hits; i++) {
                let curAlive = enemies.filter(e => e.hp > 0);
                if (curAlive.length > 0) {
                    let t = curAlive[Math.floor(Math.random() * curAlive.length)];
                    let d = hitEnemy(t, servant.atk * 1.5 * (1 + getModifier(servant.classId, t.classId || 0)), "physical", archerSkillPierce);
                    popDamageText(document.getElementById("boss-zone"), d, false);
                }
            }
            break;
        case 3: 
            logPlayer(`🔥 Mage giải phóng ma thuật, thiêu đốt toàn bộ chiến trường (AOE)!`);
            aliveEnemies.forEach(e => {
                let d = hitEnemy(e, servant.atk * 2 * (1 + getModifier(servant.classId, e.classId || 0)), "magic");
                if (e === boss) { boss.atkDebuff = 0.20; boss.atkDebuffTurn = 2; }
                popDamageText(document.getElementById("boss-zone"), d, false);
                if (e.hp > 0 && Math.random() < 0.3) {
                    e.effects.burn = 2;
                    logSystem(`🔥 ${e.name} bị Thiêu Đốt (Burn) bởi ma thuật của Mage!`);
                }
            });
            break;
        case 4: dmg = hitEnemy(target, servant.atk * (Math.random() < 0.4 ? 3 : 1), "physical"); logPlayer(`Assassin đâm lén ${target.name} gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 5: team.forEach(a => { if (a.hp > 0 && !a.controlled) a.hp = Math.min(a.maxHp, a.hp + 80); }); logPlayer("Healer hồi 80 HP cho toàn đội."); popDamageText(document.getElementById("player-team"), "+80", false, true); break;
        case 6: 
            dmg = hitEnemy(target, servant.atk * 2.5, "physical"); servant.hp -= 30; 
            logPlayer(`Berserker hi sinh 30 HP chém mạnh ${target.name} gây ${dmg} sát thương.`); 
            popDamageText(document.getElementById("boss-zone"), dmg, false); 
            if (target.hp > 0 && Math.random() < 0.2) {
                target.effects.slow = 2;
                logSystem(`🐌 ${target.name} bị Làm Chậm (Slow) bởi cú chém của Berserker!`);
            }
            break;
        case 7: 
            let lancerSkillPierce = Math.random() < 0.5;
            dmg = hitEnemy(target, Math.floor(servant.atk * 1.8 * (1 + getModifier(servant.classId, target.classId || 0))), "physical", lancerSkillPierce); 
            logPlayer(`Lancer đâm xuyên giáp ${target.name} gây ${dmg} sát thương.${lancerSkillPierce ? " (Xuyên Giáp hoàn toàn!)" : ""}`); 
            popDamageText(document.getElementById("boss-zone"), dmg, false); 
            break;
        case 8: 
            dmg = hitEnemy(target, servant.atk * 2 * (1 + getModifier(servant.classId, target.classId || 0)), "magic"); 
            if (target === boss) { boss.atkDebuff = 0.20; boss.atkDebuffTurn = 2; }
            logPlayer(`🔮 Sơn dùng Linh Hồn Áp Chế lên ${target.name}, gây ${dmg} sát thương và giảm 20% ATK của hắn trong 2 lượt!`); 
            popDamageText(document.getElementById("boss-zone"), dmg, false); 
            break;
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
        case 2: 
            let archerNpPierce = Math.random() < 0.2;
            let d2 = hitEnemy(target, 350, "physical", archerNpPierce); 
            popDamageText(document.getElementById("boss-zone"), d2, true); 
            if (archerNpPierce) logSystem("🏹 Mũi tên Tuyệt Kỹ xuyên giáp hoàn toàn!");
            break;
        case 3: 
            aliveEnemies.forEach(e => { let d = hitEnemy(e, 350, "magic"); popDamageText(document.getElementById("boss-zone"), d, true); });
            boss.atkDebuff = 0.30; boss.atkDebuffTurn = 3; break;
        case 4: let d = hitEnemy(target, Math.random() < 0.5 ? 600 : 250, "physical"); popDamageText(document.getElementById("boss-zone"), d, true); break;
        case 5: team.forEach(a => { if(a.hp > 0 && !a.controlled) { a.hp = a.maxHp; a.np = 50; }}); break;
        case 6: hitEnemy(target, 700, "physical"); servant.hp = 1; popDamageText(document.getElementById("boss-zone"), 700, true); break;
        case 7: hitEnemy(target, 500, "physical"); popDamageText(document.getElementById("boss-zone"), 500, true); break;
        case 8: 
            logPlayer(`🔮 Sơn triệu hồi Đại Quân Vong Hồn, gây sát thương diện rộng và tiếp thêm năng lượng cho đồng đội!`);
            aliveEnemies.forEach(e => { let d = hitEnemy(e, 400, "magic"); popDamageText(document.getElementById("boss-zone"), d, true); });
            boss.atkDebuff = 0.25; boss.atkDebuffTurn = 2;
            team.forEach(a => { if (a.hp > 0 && !a.controlled) a.np = Math.min(100, a.np + 20); });
            break;
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

    let isUsingSkill = Math.random() < 0.35;
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
            if (target.defending) damage = Math.floor(damage * 0.5);
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
    let bossDmgType = getDmgType(boss.classId);
    
    if (aoe) {
        team.forEach((s, idx) => {
            if (s.hp > 0 && !s.controlled) { 
                let d = hitPlayer(s, 150, bossDmgType);
                popDamageText(cards[idx], d, true, false, true); 
            }
        });
    } else {
        let aliveTargets = team.filter(s => s.hp > 0 && !s.controlled);
        if (aliveTargets.length > 0) {
            let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
            let targetIndex = team.findIndex(s => s.uid === target.uid);
            let d = hitPlayer(target, 300, bossDmgType); 
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

        if (isSecondPhase) {
            showDialogue("", [
                { name: "The Nightmare Soul", text: "Không... không thể nào... Cánh cổng Abyss... đang khép lại..." },
                { name: "Sơn", text: "(thở dốc) ...Xong rồi. Lần này thật sự đã xong rồi." },
                { name: "Hệ Thống", text: "🎉 ABYSS GATE ĐÃ BỊ PHONG ẤN HOÀN TOÀN! HÀNH TRÌNH CỦA SƠN ĐẾN ĐÂY LÀ KẾT THÚC." }
            ]);
            let checkEnd = setInterval(() => {
                if (!isDialogueActive) {
                    clearInterval(checkEnd);
                    setTimeout(() => alert("🎉 KẾT THÚC: Sơn đã phong ấn hoàn toàn Abyss Gate. Cảm ơn bạn đã chơi Abyss Souls!"), 300);
                }
            }, 500);
            return;
        }

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

function enterPostBossRoom() {
    // Ẩn màn hình chiến đấu, hiện lại màn hình platformer
    document.getElementById("battle-screen").style.display = "none";
    document.getElementById("platformer-screen").style.display = "block";
    
    currentMap = roomMap;
    playerObj.x = 80; 
    playerObj.y = 400;
    playerObj.vx = 0; 
    playerObj.vy = 0;
    
    isExploring = true;
    npcTalked = false; 

    showDialogue("???", [
        "Mình kiệt sức rồi...",
        "Phải về ngay thôi!"
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

async function executeBossTurn() {
    if (gameOver) return;
    bossTurnCount++; boss.npCounter++; boss.defending = false; 

    let aliveTargets = team.filter(s => s.hp > 0 && !s.controlled);
    if (aliveTargets.length === 0) { checkLose(); return; }

    if (boss.classId === 8) boss.energy = Math.min(100, (boss.energy || 0) + 25);

    renderBoss();
    logBoss(`👹 ${boss.name} đang tích tụ năng lượng (${boss.npCounter}/3).`);
    await sleep(800);

    if (boss.npCounter >= 3) {
        boss.npCounter = 0; bossNP();
        team.forEach(s => { s.defending = false; if(!s.controlled) s.status = ""; });
        renderTeam(); renderBoss();
        checkLose();
        queueIndex++;
        nextTurnInQueue();
        return;
    }

    let isUsingSkill = Math.random() < 0.35;
    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    let targetIndex = team.findIndex(s => s.uid === target.uid);
    let effectiveAtk = boss.atk * (boss.atkDebuffTurn > 0 ? (1 - boss.atkDebuff) : 1);
    if (boss.atkDebuffTurn > 0) boss.atkDebuffTurn--;
    const cards = document.querySelectorAll(".servant-card");
    let modifier = 1 + getModifier(boss.classId, target.classId);
    let bossDmgType = getDmgType(boss.classId); // Mage/Healer/Summoner -> magic, còn lại -> vật lí

    if (boss.classId === 8) {
        let activeMinions = enemies.filter(e => e.name === "Binh Lính" && e.hp > 0).length;

        if (isUsingSkill && boss.energy >= 50) {
            boss.energy -= 50;
            if (activeMinions < 2) {
                logBoss("🔮 KỸ NĂNG: Summoner triệu hồi thêm Binh Lính bảo vệ!");
                let toSummon = 2 - activeMinions;
                for (let i=0; i<toSummon; i++) {
                    enemies.push({ name: "Binh Lính", maxHp: boss.maxHp/3, hp: boss.maxHp/3, atk: boss.atk/3, classId: 0, spd: 45, defending: false, def: 8, res: 5, effects: { slow: 0, burn: 0 } });
                }
                if (!controlledServant && aliveTargets.length > 0) {
                    let mindControlTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                    mindControlTarget.controlled = true;
                    controlledServant = mindControlTarget;
                    mindControlTarget.status = "🧠 Bị Thao Túng";
                    logSystem(`⚠️ CẢNH BÁO: ${mindControlTarget.name} đã bị thao túng tâm trí!`);
                }
            } else {
                logBoss("🔮 KỸ NĂNG: Summoner tung ma thuật Hắc Ám diện rộng (AOE)!");
                aliveTargets.forEach(t => {
                    let tIdx = team.findIndex(s => s.uid === t.uid);
                    let aoeDmg = hitPlayer(t, effectiveAtk * 1.5, bossDmgType);
                    popDamageText(cards[tIdx], aoeDmg, false, false, true);
                });
            }
        } else {
            logBoss("👹 Summoner ra lệnh tấn công đơn mục tiêu!");
            let bDmg = hitPlayer(target, effectiveAtk, bossDmgType);
            popDamageText(cards[targetIndex], bDmg, false, false, true);
        }
    } 
    else {
        if (isUsingSkill) {
            playSFX("boss_skill");
            let dmg = 0;
            switch(boss.classId) {
                case 1: boss.defending = true; logBoss("🛡️ KỸ NĂNG: Boss bật Khiên Hắc Ám!"); break;
                case 2: {
                    let bossArcherPierce = Math.random() < 0.2;
                    dmg = hitPlayer(target, effectiveAtk * 3 * modifier, bossDmgType, bossArcherPierce);
                    logBoss(`🏹 KỸ NĂNG: Boss xả Mưa Tên vào ${target.name} gây ${dmg} ST!${bossArcherPierce ? " (Xuyên Giáp!)" : ""}`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                }
                case 3: {
                    dmg = hitPlayer(target, effectiveAtk * 4 * modifier, bossDmgType);
                    logBoss(`🔥 KỸ NĂNG: Boss Lửa Hỏa Ngục thiêu đốt ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true);
                    if (target.hp > 0 && Math.random() < 0.3) {
                        target.effects.burn = 2;
                        logSystem(`🔥 ${target.name} bị Thiêu Đốt (Burn) bởi lửa của Boss!`);
                    }
                    break;
                }
                case 4:
                    dmg = hitPlayer(target, effectiveAtk * (Math.random() < 0.4 ? 6 : 2) * modifier, bossDmgType);
                    logBoss(`🗡️ KỸ NĂNG: Boss đâm lén trúng ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                case 5:
                    let heal = 400; boss.hp = Math.min(boss.maxHp, boss.hp + heal);
                    logBoss(`💚 KỸ NĂNG: Boss hồi phục ${heal} HP!`); popDamageText(document.getElementById("boss-zone"), `+${heal}`, false, true); break;
                case 6: {
                    dmg = hitPlayer(target, effectiveAtk * 5 * modifier, bossDmgType);
                    boss.hp -= 60;
                    logBoss(`💀 KỸ NĂNG: Boss hiến tế HP chém Huyết Lệ vào ${target.name} gây ${dmg} ST!`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true);
                    if (target.hp > 0 && Math.random() < 0.2) {
                        target.effects.slow = 2;
                        logSystem(`🐌 ${target.name} bị Làm Chậm (Slow) bởi cú chém của Boss!`);
                    }
                    break;
                }
                case 7: {
                    let bossLancerPierce = Math.random() < 0.5;
                    dmg = hitPlayer(target, effectiveAtk * 3.6 * modifier, bossDmgType, bossLancerPierce);
                    logBoss(`🔱 KỸ NĂNG: Giáo Tuyệt Vọng xuyên thủng ${target.name} gây ${dmg} ST!${bossLancerPierce ? " (Xuyên Giáp hoàn toàn!)" : ""}`); 
                    popDamageText(cards[targetIndex], dmg, true, false, true); break;
                }
            }
        } else {
            playSFX("boss_attack");
            let damage = hitPlayer(target, effectiveAtk * modifier, bossDmgType);
            logBoss(`👹 Boss đánh thường ${target.name} gây ${damage} sát thương.`);
            popDamageText(cards[targetIndex], damage, false, false, true); 
        }
    }
    team.forEach(s => { s.defending = false; if(!s.controlled) s.status = ""; });
    renderBoss(); renderTeam();
    checkLose();
    queueIndex++;
    nextTurnInQueue();
}

async function executeMinionTurn(minion) {
    let aliveTargets = team.filter(s => s.hp > 0 && !s.controlled);
    if (aliveTargets.length > 0) {
        let t = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        let tIdx = team.findIndex(s => s.uid === t.uid);
        const cards = document.querySelectorAll(".servant-card");
        
        let mDmg = hitPlayer(t, minion.atk, "physical");
        
        logBoss(`🗡️ Binh Lính hành động! Vung kiếm chém ${t.name} gây ${mDmg} ST.`);
        popDamageText(cards[tIdx], mDmg, false, false, true);
        renderTeam();
        checkLose();
    }
    queueIndex++;
    nextTurnInQueue();
}