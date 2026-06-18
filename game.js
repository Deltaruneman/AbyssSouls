/* ==========================================================================
   GAME COMPATIBILITY & CONFIGURATION (Thêm class Lancer để đủ 7)
   ========================================================================== */
const classData = {
    1:{ id:1, name:"Knight", icon:"🛡️", hp:550, atk:40 },
    2:{ id:2, name:"Archer", icon:"🏹", hp:250, atk:60 },
    3:{ id:3, name:"Mage", icon:"🔥", hp:320, atk:55 },
    4:{ id:4, name:"Assassin", icon:"🗡️", hp:280, atk:65 },
    5:{ id:5, name:"Healer", icon:"💚", hp:400, atk:20 },
    6:{ id:6, name:"Berserker", icon:"💀", hp:220, atk:85 },
    7:{ id:7, name:"Lancer", icon:"🔱", hp:450, atk:48 } // Servant thứ 7
};

const typeAdvantage = {
    "1-4":0.30, "4-3":0.30, "3-6":0.30, "6-2":0.30, "2-5":0.30, "5-1":0.30, "7-2":0.30,
    "4-1":-0.20, "3-4":-0.20, "6-3":-0.20, "2-6":-0.20, "5-2":-0.20, "1-5":-0.20, "2-7":-0.20
};

const bossHints = {
    1:"Một lớp giáp thép bao phủ cơ thể hắn...", 2:"Hắn liên tục giữ khoảng cách với đối thủ...",
    3:"Không khí quanh hắn nóng bất thường...", 4:"Bóng tối đang chuyển động quanh chiến trường...",
    5:"Một luồng ánh sáng kỳ lạ đang bảo vệ hắn...", 6:"Sát khí điên loạn lan khắp không gian...",
    7:"Một mũi giáo xuyên thấu bóng tối..."
};

let team = []; // Tối đa 7 người
let currentTurn = 0;
let gameOver = false;
let bossTurnCount = 0;

let boss = {
    name: "The Nightmare Soul",
    classId: Math.floor(Math.random() * 7) + 1,
    revealed: false,
    maxHp: 3000, // Tăng HP boss vì team 7 người
    hp: 3000,
    atk: 65,
    atkDebuff: 0,
    atkDebuffTurn: 0,
    npCounter: 0
};

window.teamProtectionTurn = 0;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ==========================================================================
   PLATFORMER ENGINE (CAMERA TOÀN MÀN HÌNH + DIALOGUE + MAP LỚN)
   ========================================================================== */
const TILE_SIZE = 40;

// Bản đồ lớn hơn (40 cột x 15 hàng) - Rải rác 7 Servant (ID 2 đến 8) và Boss (9)
const map2D = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1],
    [1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let playerObj = {
    x: 100, y: 400, width: 30, height: 30,
    vx: 0, vy: 0, speed: 5, jumpPower: -11,
    grounded: false, maxJumps: 2, jumpsLeft: 2, canJump: true
};

let camera = { x: 0, y: 0 };

let keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
let isExploring = false;

/* --- HỆ THỐNG HỘI THOẠI --- */
let dialogueQueue = [];
let isDialogueActive = false;

function showDialogue(name, textArray) {
    document.getElementById("dialogue-name").innerText = name;
    dialogueQueue = textArray;
    isDialogueActive = true;
    document.getElementById("dialogue-box").style.display = "block";
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = false; // Dừng di chuyển
    nextDialogue();
}

function nextDialogue() {
    if (dialogueQueue.length > 0) {
        document.getElementById("dialogue-text").innerHTML = dialogueQueue.shift();
    } else {
        isDialogueActive = false;
        document.getElementById("dialogue-box").style.display = "none";
    }
}

// Bắt sự kiện Click cho Hội thoại
document.getElementById("dialogue-box").addEventListener("click", () => {
    if (isDialogueActive) nextDialogue();
});

/* --- LOGIC VẬT LÝ --- */
function checkWall(x, y, width, height) {
    let left = Math.floor(x / TILE_SIZE), right = Math.floor((x + width - 1) / TILE_SIZE);
    let top = Math.floor(y / TILE_SIZE), bottom = Math.floor((y + height - 1) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
            if (map2D[r] !== undefined && map2D[r][c] === 1) return true; 
        }
    }
    return false;
}

function resizeCanvas() {
    const canvas = document.getElementById("gameCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function startExploration() {
    document.getElementById("main-header").style.display = "none";
    document.getElementById("selection-screen").style.display = "none";
    document.getElementById("platformer-screen").style.display = "block";
    resizeCanvas();
    team = [];
    isExploring = true;
    
    window.addEventListener("keydown", (e) => { 
        if (e.key === 'x' || e.key === 'X') {
            if (isDialogueActive) nextDialogue();
        } else {
            if (!isDialogueActive && keys.hasOwnProperty(e.code)) keys[e.code] = true; 
        }
    });
    window.addEventListener("keyup", (e) => { 
        if(keys.hasOwnProperty(e.code)) keys[e.code] = false; 
        if(e.code === "ArrowUp") playerObj.canJump = true; 
    });

    // Hiện Hội thoại khởi đầu
    showDialogue("Hệ Thống", [
        "Chào mừng bạn đến với Vực Thẳm (The Abyss).",
        "Có 7 Servant mang sức mạnh cổ đại đang bị thất lạc trong khu di tích này.",
        "Nhiệm vụ của bạn là <b>di chuyển</b>, <b>nhảy đúp qua các vực sâu</b> để thu thập toàn bộ bọn họ.",
        "Sau khi đội hình đã sẵn sàng, hãy chạm vào <b>Cổng Đỏ</b> ở cuối con đường để khiêu chiến Hư Ảnh."
    ]);
    
    requestAnimationFrame(updatePlatformer);
}

function updatePlatformer() {
    if (!isExploring) return;

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Chỉ cho phép di chuyển nếu KHÔNG có hội thoại
    if (!isDialogueActive) {
        if (keys.ArrowUp && playerObj.canJump && playerObj.jumpsLeft > 0) {
            playerObj.vy = playerObj.jumpPower; playerObj.jumpsLeft--;              
            playerObj.grounded = false; playerObj.canJump = false;          
        }
        playerObj.vy += 0.6; // Trọng lực

        if (keys.ArrowLeft) playerObj.vx = -playerObj.speed;
        else if (keys.ArrowRight) playerObj.vx = playerObj.speed;
        else playerObj.vx = 0;

        // Trục X
        playerObj.x += playerObj.vx;
        if (checkWall(playerObj.x, playerObj.y, playerObj.width, playerObj.height)) {
            if (playerObj.vx > 0) playerObj.x = Math.floor((playerObj.x + playerObj.width) / TILE_SIZE) * TILE_SIZE - playerObj.width;
            else if (playerObj.vx < 0) playerObj.x = Math.floor(playerObj.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
            playerObj.vx = 0;
        }

        // Chặn mép trái map
        if (playerObj.x < 0) playerObj.x = 0;

        // Trục Y
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

        // Tương tác vật phẩm
        let centerX = Math.floor((playerObj.x + playerObj.width / 2) / TILE_SIZE);
        let centerY = Math.floor((playerObj.y + playerObj.height / 2) / TILE_SIZE);
        
        if (map2D[centerY] !== undefined && map2D[centerY][centerX] !== undefined) {
            let currentTile = map2D[centerY][centerX];

            // Nhặt Servant (2 đến 8)
            if (currentTile >= 2 && currentTile <= 8) {
                let classId = currentTile - 1; 
                if (!team.find(s => s.classId === classId) && team.length < 7) {
                    let base = classData[classId];
                    team.push({
                        uid: Date.now() + Math.random(), classId: classId, name: base.name, icon: base.icon,
                        maxHp: base.hp, hp: base.hp, atk: base.atk, np: 0, alive: true, defending: false, reflect: false, status: ""
                    });
                    map2D[centerY][centerX] = 0;
                    
                    showDialogue(base.name, [
                        `Ta là ${base.name} ${base.icon}. Sức mạnh của ta giờ sẽ thuộc về ngươi!`,
                        `<i>(Đội hình hiện tại: ${team.length}/7 Servant)</i>`
                    ]);
                }
            }

            // Gặp Boss (Cổng 9)
            if (currentTile === 9) {
                if (team.length < 3) {
                    showDialogue("Hệ Thống", ["⚠️ Vực thẳm tỏa ra sát khí quá lớn. Bạn cần thu thập ít nhất 3 Servant để có thể sống sót."]);
                    playerObj.x -= 30; // Bật ra xa
                } else {
                    isExploring = false;
                    startBattle(); 
                    return;
                }
            }
        }
    }

    // --- CẬP NHẬT CAMERA ---
    camera.x = playerObj.x - canvas.width / 2;
    camera.y = playerObj.y - canvas.height / 2;
    
    // Giới hạn camera không bị trôi ra ngoài mép bản đồ
    let maxCamX = (map2D[0].length * TILE_SIZE) - canvas.width;
    let maxCamY = (map2D.length * TILE_SIZE) - canvas.height;
    camera.x = Math.max(0, Math.min(camera.x, maxCamX));
    camera.y = Math.max(0, Math.min(camera.y, maxCamY));

    // --- RENDER MÀN HÌNH ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ Map với offset của Camera
    for (let r = 0; r < map2D.length; r++) {
        for (let c = 0; c < map2D[r].length; c++) {
            let tileX = c * TILE_SIZE - camera.x;
            let tileY = r * TILE_SIZE - camera.y;
            
            // Chỉ vẽ những ô nằm trong màn hình để tối ưu
            if (tileX > -TILE_SIZE && tileX < canvas.width && tileY > -TILE_SIZE && tileY < canvas.height) {
                if (map2D[r][c] === 1) {
                    ctx.fillStyle = "#24345e"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                } else if (map2D[r][c] >= 2 && map2D[r][c] <= 8) {
                    ctx.fillStyle = "#ffd700"; 
                    ctx.beginPath();
                    ctx.arc(tileX + TILE_SIZE/2, tileY + TILE_SIZE/2, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#000";
                    ctx.font = "14px Arial";
                    ctx.fillText("?", tileX + 16, tileY + 25);
                } else if (map2D[r][c] === 9) {
                    ctx.fillStyle = "#ff4757"; 
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // Vẽ Player với offset của Camera
    ctx.fillStyle = "#00d2ff";
    ctx.fillRect(playerObj.x - camera.x, playerObj.y - camera.y, playerObj.width, playerObj.height);

    if (isExploring) requestAnimationFrame(updatePlatformer);
}

/* ==========================================================================
   BATTLE ENGINE (ĐÁNH THEO LƯỢT CHO ĐỘI HÌNH LÊN TỚI 7 NGƯỜI)
   ========================================================================== */
function popDamageText(parentElement, damageValue, isCrit = false) {
    const pop = document.createElement("div");
    pop.className = `dmg-pop ${isCrit ? 'dmg-crit-pop' : 'dmg-player-pop'}`;
    pop.innerText = damageValue;
    parentElement.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function startBattle() {
    document.getElementById("platformer-screen").style.display = "none";
    document.getElementById("battle-screen").style.display = "block";
    document.getElementById("boss-hint").innerText = bossHints[boss.classId];
    document.body.style.overflow = "auto"; // Mở lại cuộn chuột nếu cần

    renderBoss();
    renderTeam();
    highlightTurn();
}

// Lấy hệ số khắc hệ (Giữ nguyên logic cũ, thêm Lancer)
function getModifier(attacker, defender) { return typeAdvantage[`${attacker}-${defender}`] || 0; }
function randomDamage(atk) { return Math.floor(atk + Math.random() * 10); }

function renderBoss() {
    const hpPercent = (boss.hp / boss.maxHp) * 100;
    document.getElementById("boss-hp-fill").style.width = Math.max(0, hpPercent) + "%";
    document.getElementById("boss-hp-text").innerText = `${Math.max(0, Math.floor(boss.hp))}/${boss.maxHp}`;
    if (boss.revealed) document.getElementById("boss-name").innerText = `${boss.name} (${classData[boss.classId].name})`;
    const dots = document.querySelectorAll("#boss-charge-dots .dot");
    dots.forEach((dot, idx) => {
        if (idx < boss.npCounter) dot.classList.add("filled"); else dot.classList.remove("filled");
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

        template.querySelector(".servant-name").innerHTML = `${servant.icon} ${servant.name}`;
        template.querySelector(".hp-fill").style.width = (servant.hp / servant.maxHp) * 100 + "%";
        
        const npFill = template.querySelector(".np-fill");
        npFill.style.width = servant.np + "%";
        if (servant.np >= 100) npFill.classList.add("np-ready");

        template.querySelector(".servant-status").innerText = servant.status;
        container.appendChild(card);
    });
}

function highlightTurn() {
    if (gameOver) return;
    while (currentTurn < team.length && team[currentTurn].hp <= 0) currentTurn++;

    if (currentTurn >= team.length) { setTimeout(bossAction, 1000); return; }

    const servant = team[currentTurn];
    document.getElementById("turn-info").innerText = `LƯỢT: ${servant.icon} ${servant.name}`;
    document.getElementById("skill-btn").disabled = servant.np < 20;
    document.getElementById("np-btn").disabled = servant.np < 100;
    renderTeam();
}

function gainNP(servant) { servant.np = Math.min(100, servant.np + 25); } // Buff nạp NP để chơi vui hơn

function revealBossCheck() {
    if (!boss.revealed && boss.hp <= boss.maxHp * 0.7) {
        boss.revealed = true;
        renderBoss();
    }
}

async function playerAction(action) {
    if (gameOver) return;
    let servant = team[currentTurn];
    if (servant.hp <= 0) return;

    document.getElementById("action-panel").style.pointerEvents = "none";
    
    let damage = 0;
    if (action === "attack") {
        damage = Math.floor(randomDamage(servant.atk) * (1 + getModifier(servant.classId, boss.classId)));
        boss.hp -= damage;
        gainNP(servant);
        popDamageText(document.getElementById("boss-zone"), damage, false);
    } 
    else if (action === "skill") useSkill(servant);
    else if (action === "np") useNP(servant);

    revealBossCheck(); renderBoss(); renderTeam();

    if (boss.hp <= 0) { victory(); return; }

    await sleep(500); 
    document.getElementById("action-panel").style.pointerEvents = "auto";
    currentTurn++;
    highlightTurn();
}

function useSkill(servant) {
    if (servant.np < 20) return;
    servant.np -= 20;
    
    // Thêm Skill cho Lancer (Class 7)
    if (servant.classId === 7) {
        let dmg = Math.floor(servant.atk * 1.8 * (1 + getModifier(servant.classId, boss.classId)));
        boss.hp -= dmg;
        popDamageText(document.getElementById("boss-zone"), dmg, false);
        return;
    }

    // Logic cũ của bạn cho 6 class còn lại
    switch(servant.classId) {
        case 1: servant.defending = true; break;
        case 2: let h1 = servant.atk * 1.5; boss.hp -= h1; popDamageText(document.getElementById("boss-zone"), h1, false); break;
        case 3: boss.hp -= servant.atk * 2; boss.atkDebuff = 0.20; boss.atkDebuffTurn = 2; break;
        case 4: boss.hp -= servant.atk * (Math.random() < 0.4 ? 3 : 1); break;
        case 5: team.forEach(a => { if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + 80); }); break;
        case 6: boss.hp -= servant.atk * 2.5; servant.hp -= 30; break;
    }
}

function useNP(servant) {
    if (servant.np < 100) return;
    servant.np = 0;

    // Thêm NP cho Lancer (Class 7)
    if (servant.classId === 7) {
        boss.hp -= 500;
        popDamageText(document.getElementById("boss-zone"), 500, true);
        return;
    }

    // NP Cũ
    switch(servant.classId) {
        case 1: team.forEach(a => { if(a.hp > 0) a.defending = true; }); window.teamProtectionTurn = 2; break;
        case 2: boss.hp -= 350; break;
        case 3: boss.hp -= 350; boss.atkDebuff = 0.30; boss.atkDebuffTurn = 3; break;
        case 4: boss.hp -= (Math.random() < 0.5 ? 600 : 250); break;
        case 5: team.forEach(a => { if(a.hp > 0) { a.hp = a.maxHp; a.np = 50; }}); break;
        case 6: boss.hp -= 700; servant.hp = 1; break;
    }
}

async function bossAction() {
    if (gameOver) return;
    bossTurnCount++; boss.npCounter++; renderBoss();

    let aliveTargets = team.filter(s => s.hp > 0);
    if (aliveTargets.length === 0) { endGame("THẤT BẠI..."); return; }

    await sleep(600);

    if (boss.npCounter >= 3) {
        boss.npCounter = 0; bossNP();
        renderTeam(); renderBoss();
        if (!team.some(s => s.hp > 0)) { endGame("THẤT BẠI..."); return; }
        currentTurn = 0; highlightTurn(); return;
    }

    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    let targetIndex = team.findIndex(s => s.uid === target.uid);
    let effectiveAtk = boss.atk * (boss.atkDebuffTurn > 0 ? (1 - boss.atkDebuff) : 1);
    
    let damage = Math.floor(effectiveAtk * (1 + getModifier(boss.classId, target.classId)));
    if (target.defending) damage = Math.floor(damage * 0.5);

    target.hp -= damage;
    const cards = document.querySelectorAll(".servant-card");
    popDamageText(cards[targetIndex], damage, false);

    team.forEach(s => s.defending = false);
    renderBoss(); renderTeam();

    if (!team.some(s => s.hp > 0)) { endGame("THẤT BẠI..."); return; }

    currentTurn = 0; highlightTurn();
}

function bossNP() {
    let aoe = Math.random() < 0.5;
    const cards = document.querySelectorAll(".servant-card");
    if (aoe) {
        team.forEach((s, idx) => {
            if (s.hp > 0) { let d = s.defending ? 40 : 100; s.hp -= d; popDamageText(cards[idx], d, true); }
        });
    } else {
        let target = team.filter(s => s.hp > 0)[0]; // Chọn ngẫu nhiên hoặc thấp HP
        let targetIndex = team.findIndex(s => s.uid === target.uid);
        let d = 250; target.hp -= d; popDamageText(cards[targetIndex], d, true);
    }
}

function endGame(msg) { gameOver = true; alert(msg); }
function victory() { if (!gameOver) endGame("🎉 CHIẾN THẮNG!"); }

console.log("Game Vực Thẳm - Fullscreen & Camera Active");