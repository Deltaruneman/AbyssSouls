/* ==========================================================================
   GAME COMPATIBILITY & CONFIGURATION
   ========================================================================== */
const classData = {
    1:{ id:1, name:"Knight", icon:"🛡️", hp:550, atk:40 },
    2:{ id:2, name:"Archer", icon:"🏹", hp:250, atk:60 },
    3:{ id:3, name:"Mage", icon:"🔥", hp:320, atk:55 },
    4:{ id:4, name:"Assassin", icon:"🗡️", hp:280, atk:65 },
    5:{ id:5, name:"Healer", icon:"💚", hp:400, atk:20 },
    6:{ id:6, name:"Berserker", icon:"💀", hp:220, atk:85 }
};

const typeAdvantage = {
    "1-4":0.30, "4-3":0.30, "3-6":0.30, "6-2":0.30, "2-5":0.30, "5-1":0.30,
    "4-1":-0.20, "3-4":-0.20, "6-3":-0.20, "2-6":-0.20, "5-2":-0.20, "1-5":-0.20
};

const bossHints = {
    1:"Một lớp giáp thép bao phủ cơ thể hắn...",
    2:"Hắn liên tục giữ khoảng cách với đối thủ...",
    3:"Không khí quanh hắn nóng bất thường...",
    4:"Bóng tối đang chuyển động quanh chiến trường...",
    5:"Một luồng ánh sáng kỳ lạ đang bảo vệ hắn...",
    6:"Sát khí điên loạn lan khắp không gian..."
};

let team = [];
let currentTurn = 0;
let gameOver = false;
let bossTurnCount = 0;

let boss = {
    name: "The Nightmare Soul",
    classId: Math.floor(Math.random() * 6) + 1,
    revealed: false,
    maxHp: 1800,
    hp: 1800,
    atk: 55,
    atkDebuff: 0,
    atkDebuffTurn: 0,
    npCounter: 0
};

window.teamProtectionTurn = 0;

// Bộ tạo trễ thời gian (Engine chính điều khiển Pacing game)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ==========================================================================
   UI CINEMATIC EFFECTS (Hiệu ứng hình ảnh chuyên nghiệp)
   ========================================================================== */
function popDamageText(parentElement, damageValue, isCrit = false) {
    const pop = document.createElement("div");
    pop.className = `dmg-pop ${isCrit ? 'dmg-crit-pop' : 'dmg-player-pop'}`;
    pop.innerText = damageValue;
    parentElement.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function triggerScreenShake() {
    const container = document.getElementById("game-container");
    container.classList.add("shake-anim");
    setTimeout(() => container.classList.remove("shake-anim"), 400);
}

/* ==========================================================================
   CORE LOGIC & RENDERING
   ========================================================================== */
function selectClass(id) {
    if (team.length >= 3) return;
    if (team.find(s => s.classId === id)) return;

    const base = classData[id];
    team.push({
        uid: Date.now() + Math.random(),
        classId: id, name: base.name, icon: base.icon,
        maxHp: base.hp, hp: base.hp, atk: base.atk,
        np: 0, alive: true, defending: false, reflect: false, status: ""
    });

    // Thêm class đánh dấu đã chọn trên UI
    event.currentTarget.classList.add("selected");
    updateSelectedTeam();
}

function updateSelectedTeam() {
    const div = document.getElementById("selected-team");
    if (team.length === 0) {
        div.innerHTML = "Chưa chọn Servant nào";
        return;
    }
    div.innerHTML = team.map(s => `${s.icon} <b>${s.name}</b>`).join(" &nbsp; | &nbsp; ");
    if (team.length === 3) {
        document.getElementById("start-btn").disabled = false;
    }
}

function startBattle() {
    document.getElementById("selection-screen").style.display = "none";
    document.getElementById("battle-screen").style.display = "block";
    document.getElementById("boss-hint").innerText = bossHints[boss.classId];

    renderBoss();
    renderTeam();
    logSystem("⚔️ Trận chiến tử thủ bắt đầu!");
    logSystem("❓ Vết tích class của Boss chưa rõ ràng...");
    highlightTurn();
}

function getModifier(attacker, defender) {
    return typeAdvantage[`${attacker}-${defender}`] || 0;
}

function randomDamage(atk) {
    return Math.floor(atk + Math.random() * 10);
}

function addLog(text, className) {
    const log = document.getElementById("battle-log");
    log.innerHTML += `<div class="log ${className}">${text}</div>`;
    log.scrollTop = log.scrollHeight;
}
function logPlayer(text) { addLog(text, "log-player"); }
function logBoss(text) { addLog(text, "log-boss"); }
function logSystem(text) { addLog(text, "log-system"); }
function logNP(text) { addLog(text, "log-np"); }
function logCrit(text) { addLog(text, "log-crit"); }

function renderBoss() {
    const hpPercent = (boss.hp / boss.maxHp) * 100;
    document.getElementById("boss-hp-fill").style.width = Math.max(0, hpPercent) + "%";
    document.getElementById("boss-hp-text").innerText = `${Math.max(0, Math.floor(boss.hp))}/${boss.maxHp}`;
    
    if (boss.revealed) {
        document.getElementById("boss-name").innerText = `${boss.name} (${classData[boss.classId].name})`;
    }

    // Cập nhật ngọc nạp chiêu của Boss
    const dots = document.querySelectorAll("#boss-charge-dots .dot");
    dots.forEach((dot, idx) => {
        if (idx < boss.npCounter) dot.classList.add("filled");
        else dot.classList.remove("filled");
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

    while (currentTurn < team.length && team[currentTurn].hp <= 0) {
        currentTurn++;
    }

    if (currentTurn >= team.length) {
        setTimeout(bossAction, 1200);
        return;
    }

    const servant = team[currentTurn];
    document.getElementById("turn-info").innerText = `LƯỢT: ${servant.icon} ${servant.name}`;
    document.getElementById("skill-btn").disabled = servant.np < 20;
    document.getElementById("np-btn").disabled = servant.np < 100;
    renderTeam();
}

function gainNP(servant) {
    let amount = 20;
    switch(servant.classId){
        case 1: amount = 20; break;
        case 2: amount = 30; break;
        case 3: amount = 25; break;
        case 4: amount = 25; break;
        case 5: amount = 20; break;
        case 6: amount = 15; break;
    }
    servant.np = Math.min(100, servant.np + amount);
}

function revealBossCheck() {
    if (boss.revealed) return;
    if (boss.hp <= boss.maxHp * 0.5) {
        boss.revealed = true;
        logSystem(`⚠️ CẢNH BÁO: Đã giải mã thành công hệ thức Boss: [${classData[boss.classId].name}]`);
        renderBoss();
    }
}

/* ==========================================================================
   TURN ACTION PROCESSOR (Bất đồng bộ kiểm soát Animation nhịp độ)
   ========================================================================== */
async function playerAction(action) {
    if (gameOver) return;
    let servant = team[currentTurn];
    if (servant.hp <= 0) return;

    // Khóa điều khiển tạm thời để chạy hiệu ứng
    document.getElementById("action-panel").style.pointerEvents = "none";

    // Phóng thẻ nhân vật lên báo hiệu tấn công
    const cards = document.querySelectorAll(".servant-card");
    cards[currentTurn].classList.add("attack-dash");
    await sleep(250);

    let damage = 0;
    let isCrit = false;

    if (action === "attack") {
        damage = randomDamage(servant.atk);
        damage *= (1 + getModifier(servant.classId, boss.classId));
        damage = Math.floor(damage);
        boss.hp -= damage;
        gainNP(servant);
        logPlayer(`${servant.icon} ${servant.name} vung vũ khí đánh thẳng vào Boss gây ${damage} sát thương.`);
        popDamageText(document.getElementById("boss-zone"), damage, false);
    } 
    else if (action === "skill") {
        useSkill(servant);
    } 
    else if (action === "np") {
        useNP(servant);
        triggerScreenShake();
    }

    cards[currentTurn].classList.remove("attack-dash");
    revealBossCheck();
    renderBoss();
    renderTeam();

    if (boss.hp <= 0) {
        victory();
        return;
    }

    await sleep(600); // Khoảng lặng nghỉ giữa các nhân vật hành động
    document.getElementById("action-panel").style.pointerEvents = "auto";
    currentTurn++;
    highlightTurn();
}

/* ==========================================================================
   SKILLS & ULTIMATE ATTACKS
   ========================================================================== */
function useSkill(servant) {
    if (servant.np < 20) return;
    servant.np -= 20;

    switch(servant.classId) {
        case 1:
            servant.defending = true; servant.reflect = true; servant.status = "🛡️ Phản đòn";
            logPlayer("🛡️ Knight bật lá chắn cổ đại phòng ngự kiên cố.");
            break;
        case 2:
            let h1 = Math.floor(servant.atk * 0.8 * (1 + getModifier(servant.classId, boss.classId)));
            let h2 = Math.floor(servant.atk * 0.8 * (1 + getModifier(servant.classId, boss.classId)));
            boss.hp -= (h1 + h2);
            servant.np = Math.min(100, servant.np + 30);
            logPlayer(`🏹 Archer xả liên hoàn kích tiễn trận gây ${h1 + h2} sát thương.`);
            popDamageText(document.getElementById("boss-zone"), h1 + h2, false);
            break;
        case 3:
            let mDmg = Math.floor(servant.atk * 1.5 * (1 + getModifier(servant.classId, boss.classId)));
            boss.hp -= mDmg; boss.atkDebuff = 0.20; boss.atkDebuffTurn = 2;
            logPlayer(`🔥 Mage thi triển chú thuật bộc phá gây ${mDmg} sát thương.`);
            logSystem("⬇️ Boss bị áp chế giảm 20% ATK trong 2 lượt.");
            popDamageText(document.getElementById("boss-zone"), mDmg, false);
            break;
        case 4:
            let crit = Math.random() < 0.30;
            let aDmg = servant.atk;
            if (crit) { aDmg *= 3; logCrit("💥 CRITICAL HIT! Ám sát chí mạng!"); }
            aDmg = Math.floor(aDmg * (1 + getModifier(servant.classId, boss.classId)));
            boss.hp -= aDmg;
            logPlayer(`🗡️ Assassin thoát ẩn thoát hiện đâm chí mạng gây ${aDmg} sát thương.`);
            popDamageText(document.getElementById("boss-zone"), aDmg, crit);
            break;
        case 5:
            team.forEach(ally => {
                if (ally.hp <= 0) return;
                ally.hp = Math.min(ally.maxHp, ally.hp + 80);
                ally.np = Math.min(100, ally.np + 15);
            });
            logPlayer("💚 Healer niệm phép hồi phục 80 HP & +15 NP cho toàn đội.");
            break;
        case 6:
            let cost = Math.floor(servant.hp * 0.1); servant.hp -= cost;
            let bDmg = Math.floor(servant.atk * 1.5 * (1 + getModifier(servant.classId, boss.classId)));
            boss.hp -= bDmg;
            let heal = Math.floor(bDmg * 0.4);
            servant.hp = Math.min(servant.maxHp, servant.hp + heal);
            logPlayer(`💀 Berserker điên cuồng chém quật gây ${bDmg} sát thương, hút ${heal} HP.`);
            popDamageText(document.getElementById("boss-zone"), bDmg, true);
            break;
    }
}

function useNP(servant) {
    if (servant.np < 100) return;
    servant.np = 0;
    logNP(`🔮 CHÂN DANH GIẢI PHÓNG! ${servant.name} phát động Noble Phantasm!`);

    switch(servant.classId) {
        case 1:
            team.forEach(a => { if(a.hp > 0) { a.defending = true; a.reflect = true; a.status = "🏰 Avalon"; }});
            window.teamProtectionTurn = 2;
            logNP("🏰 Thành Trì Di Sản: Bảo hộ tuyệt đối toàn đội trong 2 lượt Boss.");
            break;
        case 2:
            boss.hp -= 350; servant.np = 20;
            logNP("🏹 Vạn Tiễn Khai Hoa phóng tủa hỏa lực cực đại quét sạch 350 HP.");
            popDamageText(document.getElementById("boss-zone"), 350, true);
            break;
        case 3:
            boss.hp -= 350; boss.atkDebuff = 0.30; boss.atkDebuffTurn = 3;
            logNP("☄️ Tinh Thạch Vụn Vỡ gọi thiên thạch giáng lâm tước đoạt 350 HP.");
            logSystem("⬇️ Hậu quả ma pháp khiến Boss bị giảm 30% sát thương trong 3 lượt.");
            popDamageText(document.getElementById("boss-zone"), 350, true);
            break;
        case 4:
            let d = Math.random() < 0.5 ? 550 : 250;
            if(d === 550) logCrit("💀 Dấu Ấn Tử Vong kích nổ!");
            boss.hp -= d;
            logNP(`🗡️ Lưỡi Dao Bóng Đêm kết liễu xuất thần gây ${d} sát thương.`);
            popDamageText(document.getElementById("boss-zone"), d, true);
            break;
        case 5:
            team.forEach(a => { if(a.hp > 0) { a.hp = Math.min(a.maxHp, a.hp + (a.maxHp * 0.4)); a.np = Math.min(100, a.np + 50); }});
            logNP("💚 Phép Màu Phục Sinh đại hồi phục 40% HP tối đa & nạp mạnh 50 NP toàn tổ đội.");
            break;
        case 6:
            boss.hp -= 600; servant.hp -= Math.floor(servant.hp * 0.25);
            logNP("💀 Hoàng Hôn Thần Thoại nện vũ khí hủy diệt nghiền nát 600 HP của Boss.");
            popDamageText(document.getElementById("boss-zone"), 600, true);
            break;
    }
}

function clearStatus() {
    team.forEach(s => { if (s.defending) { s.defending = false; s.reflect = false; s.status = ""; } });
}

function updateTeamProtection() {
    if (window.teamProtectionTurn <= 0) return;
    window.teamProtectionTurn--;
    if (window.teamProtectionTurn <= 0) {
        team.forEach(s => { s.defending = false; s.reflect = false; s.status = ""; });
        logSystem("🏰 Thánh địa bảo hộ Avalon đã tan biến.");
    }
}

/* ==========================================================================
   BOSS AI BRAIN (Hành động phản kích bất đồng bộ của Boss)
   ========================================================================== */
async function bossAction() {
    if (gameOver) return;

    bossTurnCount++;
    boss.npCounter++;
    renderBoss();

    let aliveTargets = team.filter(s => s.hp > 0);
    if (aliveTargets.length === 0) { checkLose(); return; }

    logBoss(`👹 Vòng nạp Tuyệt kỹ Boss tăng tiến (${boss.npCounter}/3).`);
    await sleep(600);

    // KIỂM TRA BOSS TUNG ULTIMATE (NP COUNTER = 3)
    if (boss.npCounter >= 3) {
        boss.npCounter = 0;
        triggerScreenShake();
        bossNP();
        renderTeam();
        renderBoss();
        if (checkLose()) return;
        currentTurn = 0;
        highlightTurn();
        return;
    }

    // TẤN CÔNG THƯỜNG
    let target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    let targetIndex = team.findIndex(s => s.uid === target.uid);
    let effectiveAtk = boss.atk;

    if (boss.atkDebuffTurn > 0) {
        effectiveAtk *= (1 - boss.atkDebuff);
        boss.atkDebuffTurn--;
        if (boss.atkDebuffTurn <= 0) { boss.atkDebuff = 0; logSystem("✨ Hiệu ứng suy yếu biến mất, lực tay của Boss hồi phục."); }
    }

    let damage = Math.floor(effectiveAtk + Math.random() * 15);
    damage = Math.floor(damage * (1 + getModifier(boss.classId, target.classId)));

    // Hiệu ứng rung nhẹ nhân vật khi bị đánh trúng
    const targetCard = document.querySelectorAll(".servant-card")[targetIndex];

    if (target.defending) {
        damage = Math.floor(damage * 0.5);
        if (target.reflect) {
            let ref = Math.floor(damage * 0.3); boss.hp -= ref;
            logPlayer(`⚡ Hào quang phản đòn của ${target.name} dội lại ${ref} sát thương lên Boss.`);
            popDamageText(document.getElementById("boss-zone"), ref, false);
        }
    }

    target.hp -= damage;
    triggerScreenShake();
    logBoss(`👹 Boss rít lên, tung đòn đập mạnh vào vị trí ${target.name} gây ${damage} sát thương.`);
    popDamageText(targetCard, damage, false);

    if (target.hp <= 0) { target.hp = 0; logSystem(`☠️ Đau đớn thay! Chiến binh ${target.name} đã ngã xuống chiến trường.`); }

    revealBossCheck();
    clearStatus();
    updateTeamProtection();
    renderBoss();
    renderTeam();

    if (boss.hp <= 0) { victory(); return; }
    if (checkLose()) return;

    currentTurn = 0;
    highlightTurn();
}

function bossNP() {
    let aoe = Math.random() < 0.5;
    const cards = document.querySelectorAll(".servant-card");

    if (aoe) {
        logBoss("💥 TUYỆT KỸ PHÁT ĐỘNG: SOUL BURST (Chấn Động Linh Hồn)!");
        team.forEach((servant, idx) => {
            if (servant.hp <= 0) return;
            let d = servant.defending ? 60 : 120;
            servant.hp -= d;
            popDamageText(cards[idx], d, true);
            if (servant.hp <= 0) { servant.hp = 0; logSystem(`☠️ ${servant.name} không chịu nổi sóng xung kích dữ dội từ tuyệt kỹ.`); }
        });
    } else {
        let aliveTargets = team.filter(s => s.hp > 0);
        if (aliveTargets.length === 0) return;
        let target = aliveTargets.reduce((lowest, curr) => curr.hp < lowest.hp ? curr : lowest);
        let targetIndex = team.findIndex(s => s.uid === target.uid);
        
        let d = Math.floor(boss.atk * 1.5);
        if (target.defending) d = Math.floor(d * 0.5);
        
        target.hp -= d;
        logBoss(`💀 TUYỆT KỸ KẾT LIỄU: SOUL EXECUTION nhắm vào tử điểm của ${target.name}! Gây ${d} sát thương.`);
        popDamageText(cards[targetIndex], d, true);
        
        if (target.hp <= 0) { target.hp = 0; logSystem(`☠️ Khắc nghiệt! ${target.name} dính trọng thương mất mạng.`); }
    }
}

/* ==========================================================================
   ENDGAME SYSTEM (Kết thúc kịch tính)
   ========================================================================== */
function endGame(message) {
    gameOver = true;
    document.getElementById("action-panel").style.display = "none";
    logSystem(message);

    setTimeout(() => {
        const btn = document.createElement("button");
        btn.innerText = "🔄 TÁI SINH TRẬN ĐẤU";
        btn.onclick = () => location.reload();
        btn.style.cssText = "width:100%; margin-top:20px; padding:15px; background:#ffd700; color:black; font-weight:bold; font-size:18px; border:none; border-radius:10px; cursor:pointer;";
        document.getElementById("battle-log").appendChild(btn);
    }, 800);
}

function victory() { if (!gameOver) endGame("🎉 CHIẾN THẮNG! THE NIGHTMARE SOUL ĐÃ BỊ PHONG ẤN HOÀN TOÀN!"); }
function checkLose() {
    if (!team.some(s => s.hp > 0)) { endGame("💀 THẤT BẠI... TOÀN ĐỘI ĐÃ BỊ NUỐT CHỬNG BỞI VỰC THẲM!"); return true; }
    return false;
}

console.log("Abyss Souls Battle Engine Remastered Loaded Successfully.");