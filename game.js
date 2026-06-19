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
    7:{ id:7, name:"Lancer", icon:"🔱", hp:450, atk:48 }
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

let collectedServants = []; 
let selectedUids = [];      
let team = [];              

let currentTurn = 0;
let gameOver = false;
let bossTurnCount = 0;

let boss = {
    name: "The Nightmare Soul",
    classId: Math.floor(Math.random() * 7) + 1,
    revealed: false,
    maxHp: 2000, 
    hp: 2000,
    atk: 65,
    atkDebuff: 0,
    atkDebuffTurn: 0,
    npCounter: 0,
    defending: false // Trạng thái khiên của Boss
};

window.teamProtectionTurn = 0;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ==========================================================================
   PLATFORMER ENGINE
   ========================================================================== */
   /* ==========================================================================
   PLATFORMER ASSETS CHARGING (IMAGES)
   ========================================================================== */
const gameImages = {
    wall: new Image(),
    servant: new Image(),
    gate: new Image(),
    player: new Image()
};

// Định nghĩa đường dẫn nguồn từ thư mục assets/images
gameImages.wall.src = 'assets/images/wall.png';       
gameImages.servant.src = 'assets/images/soul.png'; 
gameImages.gate.src = 'assets/images/gate.png';      
gameImages.player.src = 'assets/images/player.png';   
const TILE_SIZE = 40;
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

let playerObj = { x: 100, y: 400, width: 30, height: 30, vx: 0, vy: 0, speed: 5, jumpPower: -11, grounded: false, maxJumps: 2, jumpsLeft: 2, canJump: true };
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
        document.getElementById("dialogue-text").innerHTML = dialogueQueue.shift();
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
    collectedServants = [];
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
        "Không quan trọng, mình phải phong ấn Abyss Gate trước khi nó bùng phát thêm 1 lần nữa.",
         "... The Abyss One đã tạo ra Abyss Expand vẫn còn ở đây. Nó vẫn chưa bị tiêu diệt hoàn toàn ư."
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
            playerObj.grounded = false; playerObj.canJump = false;          
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

        let centerX = Math.floor((playerObj.x + playerObj.width / 2) / TILE_SIZE);
        let centerY = Math.floor((playerObj.y + playerObj.height / 2) / TILE_SIZE);
        
        if (map2D[centerY] !== undefined && map2D[centerY][centerX] !== undefined) {
            let currentTile = map2D[centerY][centerX];
            if (currentTile >= 2 && currentTile <= 8) {
                let classId = currentTile - 1; 
                if (!collectedServants.find(s => s.classId === classId)) {
                    let base = classData[classId];
                    collectedServants.push({
                        uid: Date.now() + Math.random(), classId: classId, name: base.name, icon: base.icon,
                        maxHp: base.hp, hp: base.hp, atk: base.atk, np: 0, alive: true, defending: false, reflect: false, status: ""
                    });
                    map2D[centerY][centerX] = 0;
                    showDialogue(base.name, [` ${base.name} ${base.icon}. ký kết khế ước với bạn!`, `(Đã thu thập: ${collectedServants.length} Servant)`]);
                }
            }

            if (currentTile === 9) {
                if (collectedServants.length < 3) {
                    showDialogue("Hệ Thống", ["⚠️ Bạn phải có ít nhất 3 Servant để lập đội hình chiến đấu."]);
                    playerObj.x -= 30; 
                } else {
                    isExploring = false;
                    openSelectionScreen();
                    return;
                }
            }
        }
        
    }


    const zoomLevel = 2.2; 
    const viewWidth = canvas.width / zoomLevel;
    const viewHeight = canvas.height / zoomLevel;
    camera.x = Math.max(0, Math.min(playerObj.x + (playerObj.width / 2) - (viewWidth / 2), (map2D[0].length * TILE_SIZE) - viewWidth));
    camera.y = Math.max(0, Math.min(playerObj.y + (playerObj.height / 2) - (viewHeight / 2), (map2D.length * TILE_SIZE) - viewHeight));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); 
    ctx.scale(zoomLevel, zoomLevel);
    for (let r = 0; r < map2D.length; r++) {
        for (let c = 0; c < map2D[r].length; c++) {
            let tileX = c * TILE_SIZE - camera.x;
            let tileY = r * TILE_SIZE - camera.y;
            
            if (tileX > -TILE_SIZE && tileX < viewWidth && tileY > -TILE_SIZE && tileY < viewHeight) {
                if (map2D[r][c] === 1) {
                    ctx.drawImage(gameImages.wall, tileX, tileY, TILE_SIZE, TILE_SIZE);
                } 
                else if (map2D[r][c] >= 2 && map2D[r][c] <= 8) {
                    ctx.drawImage(gameImages.servant, tileX, tileY, TILE_SIZE, TILE_SIZE);
                } 
                else if (map2D[r][c] === 9) {
                    ctx.drawImage(gameImages.gate, tileX, tileY, TILE_SIZE, TILE_SIZE);
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
    
    ctx.restore(); 
    ctx.restore(); 

    if (isExploring) requestAnimationFrame(updatePlatformer);


}

/* ==========================================================================
   TEAM SELECTION SYSTEM
   ========================================================================== */
function openSelectionScreen() {
    document.getElementById("platformer-screen").style.display = "none";
    document.getElementById("team-selection-screen").style.display = "block";
    document.body.style.overflow = "auto";
    
    const roster = document.getElementById("selection-roster");
    roster.innerHTML = "";
    selectedUids = [];

    collectedServants.forEach(s => {
        const card = document.createElement("div");
        card.className = "roster-card";
        card.innerHTML = `<div style="font-size: 35px;">${s.icon}</div><div style="margin-top: 10px; font-weight: bold; font-size: 16px;">${s.name}</div>`;
        card.onclick = () => {
            if (selectedUids.includes(s.uid)) {
                selectedUids = selectedUids.filter(id => id !== s.uid);
                card.classList.remove("selected");
            } else {
                if (selectedUids.length < 3) {
                    selectedUids.push(s.uid);
                    card.classList.add("selected");
                }
            }
            document.getElementById("selection-count").innerText = `Đã chọn: ${selectedUids.length}/3`;
            document.getElementById("confirm-team-btn").disabled = selectedUids.length !== 3;
        };
        roster.appendChild(card);
    });
}

function confirmTeamAndBattle() {
    team = collectedServants.filter(s => selectedUids.includes(s.uid));
    document.getElementById("team-selection-screen").style.display = "none";
    startBattle();
}

/* ==========================================================================
   BATTLE ENGINE & SFX SYSTEM
   ========================================================================== */

// HỆ THỐNG ÂM THANH THEO CLASS
function playSFX(action, classId) {
    try {
        // Tạo đường dẫn file: ví dụ assets/sfx/attack_1.mp3, skill_3.mp3, np_7.mp3
        let sound = new Audio(`assets/sfx/${action}_${classId}.mp3`);
        sound.volume = 0.8; // Cài đặt âm lượng
        sound.play().catch(e => console.log(`[SFX] Chưa có file ${action}_${classId}.mp3 hoặc trình duyệt chặn:`));
    } catch (e) {
        console.log("Lỗi hệ thống âm thanh:", e);
    }
}

function popDamageText(parentElement, damageValue, isCrit = false, isHeal = false) {
    const pop = document.createElement("div");
    let className = 'dmg-player-pop';
    if (isCrit) className = 'dmg-crit-pop';
    if (isHeal) className = 'dmg-boss-pop'; // Màu xanh hồi máu
    
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

// Hàm trừ máu Boss (Xử lý khiên của Boss)
function hitBoss(amount) {
    let finalDmg = Math.floor(amount);
    if (boss.defending) {
        finalDmg = Math.floor(finalDmg * 0.25); // Giảm 75%
        logSystem("🛡️ Khiên Hắc Ám của Boss đã cản 75% sát thương!");
    }
    boss.hp -= finalDmg;
    return finalDmg;
}

function startBattle() {
    document.getElementById("battle-screen").style.display = "block";
    document.getElementById("boss-hint").innerText = bossHints[boss.classId];
    logSystem("⚔️ Trận chiến bắt đầu!");
    renderBoss();
    renderTeam();
    highlightTurn();

    showDialogue("Cốt Truyện", [
        "<b>The Nightmare Soul:</b> Chết tiệt, thế quái nào sức mạnh của cả UIT lại mạnh đến như vậy?",
        "<b>The Nightmare Soul:</b> Không sao, Abyss Gate sẽ được mở ra một lần nữa, và bóng tối sẽ bao trùm tất cả sinh linh!",
        "<b>???:</b> Không có cơ hội đó đâu!.",
        "<b>???:</b> Kiến tạo ma lực!",
        "<b>???:</b> Thiêu đốt linh hồn .",
        "<b>???:</b> Triệu hồi Anh Linh!!!.",
        "<b>The Nightmare Soul:</b> Chết tiệt, ta sẽ biến nơi đây thành mồ chôn của ngươi."
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
        template.querySelector(".servant-hp-text").innerText = `HP: ${Math.max(0, Math.floor(servant.hp))}/${servant.maxHp}`;
        template.querySelector(".servant-np-text").innerText = `NP: ${servant.np}/100`;
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

    if (currentTurn >= team.length) { 
        document.getElementById("action-panel").style.pointerEvents = "none";
        setTimeout(bossAction, 1000); 
        return; 
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
    if (servant.hp <= 0) return;

    document.getElementById("action-panel").style.pointerEvents = "none";
    
    let damage = 0;
    if (action === "attack") {
        playSFX("attack", servant.classId); // PHÁT ÂM THANH ĐÁNH THƯỜNG THEO CLASS

        damage = Math.floor(randomDamage(servant.atk) * (1 + getModifier(servant.classId, boss.classId)));
        damage = hitBoss(damage);
        gainNP(servant);
        logPlayer(`${servant.name} tấn công Boss gây ${damage} sát thương.`);
        popDamageText(document.getElementById("boss-zone"), damage, false);
    } 
    else if (action === "skill") useSkill(servant);
    else if (action === "np") useNP(servant);

    revealBossCheck(); 
    renderBoss(); 
    renderTeam();

    if (boss.hp <= 0) { victory(); return; }

    await sleep(600); 
    document.getElementById("action-panel").style.pointerEvents = "auto";
    currentTurn++;
    highlightTurn();
}

function useSkill(servant) {
    if (servant.np < 20) return;
    servant.np -= 20;
    
    playSFX("skill", servant.classId); // PHÁT ÂM THANH SKILL THEO CLASS

    let dmg = 0;
    switch(servant.classId) {
        case 1: servant.defending = true; servant.status = "🛡️ Phản đòn"; logPlayer("Knight bật khiên phòng thủ."); break;
        case 2: dmg = hitBoss(servant.atk * 1.5); logPlayer(`Archer bắn liên hoàn gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 3: dmg = hitBoss(servant.atk * 2); boss.atkDebuff = 0.20; boss.atkDebuffTurn = 2; logPlayer(`Mage dùng phép thuật gây ${dmg} sát thương. Boss giảm ATK.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 4: dmg = hitBoss(servant.atk * (Math.random() < 0.4 ? 3 : 1)); logPlayer(`Assassin đâm lén gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 5: team.forEach(a => { if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + 80); }); logPlayer("Healer hồi 80 HP cho toàn đội."); break;
        case 6: dmg = hitBoss(servant.atk * 2.5); servant.hp -= 30; logPlayer(`Berserker hi sinh 30 HP chém mạnh gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
        case 7: dmg = hitBoss(Math.floor(servant.atk * 1.8 * (1 + getModifier(servant.classId, boss.classId)))); logPlayer(`Lancer đâm xuyên giáp gây ${dmg} sát thương.`); popDamageText(document.getElementById("boss-zone"), dmg, false); break;
    }
}

function useNP(servant) {
    if (servant.np < 100) return;
    servant.np = 0;

    playSFX("np", servant.classId); // PHÁT ÂM THANH TUYỆT KỸ THEO CLASS

    logPlayer(`🔥 ${servant.name} PHÁT ĐỘNG TUYỆT KỸ!`);
    switch(servant.classId) {
        case 1: team.forEach(a => { if(a.hp > 0) { a.defending = true; a.status = "🏰 Avalon"; }}); window.teamProtectionTurn = 2; break;
        case 2: hitBoss(350); popDamageText(document.getElementById("boss-zone"), 350, true); break;
        case 3: hitBoss(350); boss.atkDebuff = 0.30; boss.atkDebuffTurn = 3; popDamageText(document.getElementById("boss-zone"), 350, true); break;
        case 4: let d = hitBoss(Math.random() < 0.5 ? 600 : 250); popDamageText(document.getElementById("boss-zone"), d, true); break;
        case 5: team.forEach(a => { if(a.hp > 0) { a.hp = a.maxHp; a.np = 50; }}); break;
        case 6: hitBoss(700); servant.hp = 1; popDamageText(document.getElementById("boss-zone"), 700, true); break;
        case 7: hitBoss(500); popDamageText(document.getElementById("boss-zone"), 500, true); break;
    }
}

async function bossAction() {
    if (gameOver) return;
    bossTurnCount++; 
    boss.npCounter++; 
    boss.defending = false; // Xóa khiên từ lượt trước của Boss (nếu có)
    renderBoss();

    let aliveTargets = team.filter(s => s.hp > 0);
    if (aliveTargets.length === 0) { checkLose(); return; }

    logBoss(`👹 Boss đang tích tụ năng lượng (${boss.npCounter}/3).`);
    await sleep(800);

    // KÍCH HOẠT TUYỆT KỸ NẾU ĐẦY THANH NP
    if (boss.npCounter >= 3) {
        boss.npCounter = 0; 
        bossNP();
        team.forEach(s => { s.defending = false; s.status = ""; });
        renderTeam(); 
        renderBoss();
        if (checkLose()) return;

        currentTurn = 0; 
        document.getElementById("action-panel").style.pointerEvents = "auto";
        highlightTurn(); 
        return;
    }

    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    let targetIndex = team.findIndex(s => s.uid === target.uid);
    let effectiveAtk = boss.atk * (boss.atkDebuffTurn > 0 ? (1 - boss.atkDebuff) : 1);
    if (boss.atkDebuffTurn > 0) boss.atkDebuffTurn--;

    const cards = document.querySelectorAll(".servant-card");
    let modifier = 1 + getModifier(boss.classId, target.classId);

    // XÁC SUẤT 35% BOSS DÙNG KỸ NĂNG CLASS (GẤP ĐÔI SỨC MẠNH SERVANT)
    let isUsingSkill = Math.random() < 0.35;

    if (isUsingSkill) {
        let dmg = 0;
        switch(boss.classId) {
            case 1:
                boss.defending = true;
                logBoss("🛡️ KỸ NĂNG: Boss kích hoạt Khiên Hắc Ám, giảm 75% sát thương nhận vào ở hiệp tới!");
                break;
            case 2:
                dmg = Math.floor(effectiveAtk * 3 * modifier); // x1.5 * 2 = 3
                if (target.defending) dmg = Math.floor(dmg * 0.5);
                target.hp -= dmg;
                logBoss(`🏹 KỸ NĂNG: Boss xả Mưa Tên Hắc Ám vào ${target.name} gây ${dmg} sát thương!`);
                popDamageText(cards[targetIndex], dmg, true);
                break;
            case 3:
                dmg = Math.floor(effectiveAtk * 4 * modifier); // x2 * 2 = 4
                if (target.defending) dmg = Math.floor(dmg * 0.5);
                target.hp -= dmg;
                logBoss(`🔥 KỸ NĂNG: Boss giáng Lửa Hỏa Ngục thiêu đốt ${target.name} gây ${dmg} sát thương!`);
                popDamageText(cards[targetIndex], dmg, true);
                break;
            case 4:
                dmg = Math.floor(effectiveAtk * (Math.random() < 0.4 ? 6 : 2) * modifier); // x3 hoặc x1 nhân đôi
                if (target.defending) dmg = Math.floor(dmg * 0.5);
                target.hp -= dmg;
                logBoss(`🗡️ KỸ NĂNG: Boss xuất quỷ nhập thần, đâm trúng ${target.name} gây ${dmg} sát thương!`);
                popDamageText(cards[targetIndex], dmg, true);
                break;
            case 5:
                let heal = 400; // x5 lần 80 máu của Healer thường
                boss.hp = Math.min(boss.maxHp, boss.hp + heal);
                logBoss(`💚 KỸ NĂNG: Boss hấp thụ năng lượng vực thẳm, tự hồi phục ${heal} HP!`);
                popDamageText(document.getElementById("boss-zone"), `+${heal}`, false, true); // Màu xanh
                break;
            case 6:
                dmg = Math.floor(effectiveAtk * 5 * modifier); // x2.5 * 2 = 5
                if (target.defending) dmg = Math.floor(dmg * 0.5);
                boss.hp -= 60; // Mất 30*2 HP
                target.hp -= dmg;
                logBoss(`💀 KỸ NĂNG: Boss hiến tế 60 HP, trảm Huyết Lệ trúng ${target.name} gây ${dmg} sát thương!`);
                popDamageText(document.getElementById("boss-zone"), "60", false); // Boss bị trừ máu
                popDamageText(cards[targetIndex], dmg, true);
                break;
            case 7:
                dmg = Math.floor(effectiveAtk * 3.6 * modifier); // x1.8 * 2 = 3.6
                if (target.defending) dmg = Math.floor(dmg * 0.5);
                target.hp -= dmg;
                logBoss(`🔱 KỸ NĂNG: Boss phóng Ngọn Giáo Tuyệt Vọng xuyên thủng ${target.name} gây ${dmg} sát thương!`);
                popDamageText(cards[targetIndex], dmg, true);
                break;
        }
    } else {
        // TẤN CÔNG THƯỜNG CỦA BOSS (65% TỶ LỆ)
        let damage = Math.floor(effectiveAtk * modifier);
        if (target.defending) damage = Math.floor(damage * 0.5);

        target.hp -= damage;
        logBoss(`👹 Boss đánh thường ${target.name} gây ${damage} sát thương.`);
        popDamageText(cards[targetIndex], damage, false);
    }

    team.forEach(s => { s.defending = false; s.status = ""; });
    renderBoss(); 
    renderTeam();

    if (checkLose()) return;

    currentTurn = 0; 
    document.getElementById("action-panel").style.pointerEvents = "auto";
    highlightTurn();
}

function bossNP() {
    let aoe = Math.random() < 0.5;
    const cards = document.querySelectorAll(".servant-card");
    logBoss("💥 TUYỆT KỸ BOSS PHÁT ĐỘNG!");
    
    if (aoe) {
        team.forEach((s, idx) => {
            if (s.hp > 0) { 
                let d = s.defending ? 80 : 150; 
                s.hp -= d; 
                popDamageText(cards[idx], d, true); 
            }
        });
    } else {
        let aliveTargets = team.filter(s => s.hp > 0);
        let target = aliveTargets[0];
        let targetIndex = team.findIndex(s => s.uid === target.uid);
        let d = target.defending ? 150 : 300; 
        target.hp -= d; 
        popDamageText(cards[targetIndex], d, true);
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

        showDialogue("Cốt Truyện", [
            "<b>The Nightmare Soul:</b> Khục... Không thể nào... Vực thẳm... sẽ không bao giờ... lụi tàn...",
            "<b>The Nightmare Soul:</b> Cơ thể này... đang tan biến... Ngươi sẽ phải hối hận...",
            "<b>???:</b> ...( phong ấn Abyss Gate )...",
            "<b>The Nightmare Soul:</b> Ha ha ha ha, ta đã cảm nhận được thứ ma lực trong người ngươi.",
            "<b>The Nightmare Soul:</b> Nó đến từ Abyss, thứ ma thuật lấy linh hồn kẻ khác làm sức mạnh của ngươi.",
            "<b>The Nightmare Soul:</b> Ha ha ha, rồi thì chính tâm trí ngươi sẽ dần bị tha hóa không khác gì chúng ta.",
             "<b>???:</b> Ta hiểu nhưng...",
            "<b>Hệ Thống:</b> 🎉 CHIẾN THẮNG! Bạn đã bảo vệ thành công thế giới khỏi The Abyss!"
        ]);

        let checkDialog = setInterval(() => {
            if (!isDialogueActive) {
                clearInterval(checkDialog);
                alert("🎉 CHIẾN THẮNG! BOSS ĐÃ BỊ TIÊU DIỆT!");
            }
        }, 500);
    } 
}
function checkLose() {
    if (!team.some(s => s.hp > 0)) { endGame("THẤT BẠI... TOÀN ĐỘI ĐÃ BỊ TIÊU DIỆT. Tâm trí của bạn bị Abyss và rồi trở thành một Abyss One"); return true; }
    return false;
}