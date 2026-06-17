

const classData = {

    1:{
        id:1,
        name:"Knight",
        icon:"🛡",
        hp:550,
        atk:40
    },

    2:{
        id:2,
        name:"Archer",
        icon:"🏹",
        hp:250,
        atk:60
    },

    3:{
        id:3,
        name:"Mage",
        icon:"🔥",
        hp:320,
        atk:55
    },

    4:{
        id:4,
        name:"Assassin",
        icon:"🗡",
        hp:280,
        atk:65
    },

    5:{
        id:5,
        name:"Healer",
        icon:"💚",
        hp:400,
        atk:20
    },

    6:{
        id:6,
        name:"Berserker",
        icon:"💀",
        hp:220,
        atk:85
    }
};

/* =====================================
   CLASS ADVANTAGE
===================================== */

const typeAdvantage = {

    "1-4":0.30,
    "4-3":0.30,
    "3-6":0.30,
    "6-2":0.30,
    "2-5":0.30,
    "5-1":0.30,

    "4-1":-0.20,
    "3-4":-0.20,
    "6-3":-0.20,
    "2-6":-0.20,
    "5-2":-0.20,
    "1-5":-0.20
};

/* =====================================
   BOSS HINT
===================================== */

const bossHints = {

    1:"Một lớp giáp thép bao phủ cơ thể hắn...",

    2:"Hắn liên tục giữ khoảng cách với đối thủ...",

    3:"Không khí quanh hắn nóng bất thường...",

    4:"Bóng tối đang chuyển động quanh chiến trường...",

    5:"Một luồng ánh sáng kỳ lạ đang bảo vệ hắn...",

    6:"Sát khí điên loạn lan khắp không gian..."
};

/* =====================================
   GAME STATE
===================================== */

let team = [];

let currentTurn = 0;

let gameOver = false;

let bossTurnCount = 0;

/* =====================================
   BOSS
===================================== */

let boss = {

    name:"The Nightmare Soul",

    classId:
        Math.floor(Math.random()*6)+1,

    revealed:false,

    maxHp:1800,

    hp:1800,

    atk:55,

    atkDebuff:0,

    atkDebuffTurn:0,

    npCounter:0
};

/* =====================================
   SELECT CLASS
===================================== */

function selectClass(id){

    if(team.length >= 3)
        return;

    let exists =
        team.find(
            s => s.classId === id
        );

    if(exists)
        return;

    const base = classData[id];

    team.push({

        uid:Date.now()+Math.random(),

        classId:id,

        name:base.name,

        icon:base.icon,

        maxHp:base.hp,

        hp:base.hp,

        atk:base.atk,

        np:0,

        alive:true,

        defending:false,

        reflect:false,

        status:""

    });

    updateSelectedTeam();
}

/* =====================================
   UPDATE TEAM TEXT
===================================== */

function updateSelectedTeam(){

    const div =
        document.getElementById(
            "selected-team"
        );

    if(team.length === 0){

        div.innerHTML =
            "Chưa chọn Servant nào";

        return;
    }

    let html = "";

    team.forEach(servant=>{

        html +=
            `${servant.icon} ${servant.name} | `;
    });

    div.innerHTML = html;

    if(team.length === 3){

        document
        .getElementById("start-btn")
        .disabled = false;
    }
}

/* =====================================
   START BATTLE
===================================== */

function startBattle(){

    document
        .getElementById(
            "selection-screen"
        )
        .style.display = "none";

    document
        .getElementById(
            "battle-screen"
        )
        .style.display = "block";

    document
        .getElementById(
            "boss-hint"
        )
        .innerText =
            bossHints[boss.classId];

    renderBoss();

    renderTeam();

    logSystem(
        "Trận chiến bắt đầu!"
    );

    logSystem(
        "Class của Boss vẫn chưa được xác định..."
    );

    highlightTurn();
}

/* =====================================
   DAMAGE MODIFIER
===================================== */

function getModifier(
    attacker,
    defender
){

    let key =
        `${attacker}-${defender}`;

    return typeAdvantage[key] || 0;
}

/* =====================================
   RANDOM DAMAGE
===================================== */

function randomDamage(
    atk
){

    return Math.floor(

        atk +
        Math.random()*10

    );
}

/* =====================================
   LOG SYSTEM
===================================== */

function addLog(
    text,
    className
){

    const log =
        document.getElementById(
            "battle-log"
        );

    log.innerHTML +=
    `
    <div class="log ${className}">
        ${text}
    </div>
    `;

    log.scrollTop =
        log.scrollHeight;
}

function logPlayer(text){

    addLog(
        text,
        "log-player"
    );
}

function logBoss(text){

    addLog(
        text,
        "log-boss"
    );
}

function logSystem(text){

    addLog(
        text,
        "log-system"
    );
}

function logNP(text){

    addLog(
        text,
        "log-np"
    );
}

function logCrit(text){

    addLog(
        text,
        "log-crit"
    );
}

/* =====================================
   RENDER BOSS
===================================== */

function renderBoss(){

    const hpPercent =

        (boss.hp /
         boss.maxHp)
         *100;

    document
        .getElementById(
            "boss-hp-fill"
        )
        .style.width =
        hpPercent + "%";

    document
        .getElementById(
            "boss-hp-text"
        )
        .innerText =
        `${Math.max(
            0,
            Math.floor(boss.hp)
        )}/${boss.maxHp}`;

    if(
        boss.revealed
    ){

        document
        .getElementById(
            "boss-name"
        )
        .innerText =

        `${boss.name}
         (${classData[
            boss.classId
         ].name})`;
    }
}


/* =====================================
   RENDER TEAM
===================================== */

function renderTeam(){

    const container =
        document.getElementById(
            "player-team"
        );

    container.innerHTML = "";

    team.forEach(
        (servant,index)=>{
        
        const template =
            document
            .getElementById(
                "character-template"
            )
            .content
            .cloneNode(true);

        const card =
            template.querySelector(
                ".servant-card"
            );

        if(index === currentTurn){

            card.classList.add(
                "active"
            );
        }

        if(servant.hp <= 0){

            card.classList.add(
                "dead"
            );
        }

        template.querySelector(
            ".servant-name"
        ).innerText =
        `${servant.icon} ${servant.name}`;

        template.querySelector(
            ".servant-hp-text"
        ).innerText =
        `HP: ${Math.max(
            0,
            Math.floor(servant.hp)
        )}/${servant.maxHp}`;

        template.querySelector(
            ".servant-np-text"
        ).innerText =
        `NP: ${servant.np}/100`;

        template.querySelector(
            ".hp-fill"
        ).style.width =

        (servant.hp /
         servant.maxHp)
         *100 + "%";

        const npFill =
            template.querySelector(
                ".np-fill"
            );

        npFill.style.width =
            servant.np + "%";

        if(servant.np >= 100){

            npFill.classList.add(
                "np-ready"
            );
        }

        template.querySelector(
            ".servant-status"
        ).innerText =
            servant.status;

        container.appendChild(
            template
        );
    });
}

/* =====================================
   TURN UI
===================================== */

function highlightTurn(){

    if(gameOver)
        return;

    while(

        currentTurn <
        team.length &&

        team[currentTurn].hp <= 0

    ){

        currentTurn++;
    }

    if(
        currentTurn >=
        team.length
    ){

        setTimeout(
            bossAction,
            1000
        );

        return;
    }

    const servant =
        team[currentTurn];

    document
        .getElementById(
            "turn-info"
        )
        .innerText =

        `Lượt:
        ${servant.icon}
        ${servant.name}`;

    document
        .getElementById(
            "skill-btn"
        )
        .disabled =

        servant.np < 20;

    document
        .getElementById(
            "np-btn"
        )
        .disabled =

        servant.np < 100;

    renderTeam();
}

/* =====================================
   NP GAIN
===================================== */

function gainNP(servant){

    let amount = 20;

    switch(
        servant.classId
    ){

        case 1:
            amount = 20;
            break;

        case 2:
            amount = 30;
            break;

        case 3:
            amount = 25;
            break;

        case 4:
            amount = 25;
            break;

        case 5:
            amount = 20;
            break;

        case 6:
            amount = 15;
            break;
    }

    servant.np =
        Math.min(
            100,
            servant.np + amount
        );
}

/* =====================================
   BASIC ATTACK
===================================== */

function basicAttack(
    servant
){

    let damage =

        randomDamage(
            servant.atk
        );

    damage *=

        (
            1 +
            getModifier(
                servant.classId,
                boss.classId
            )
        );

    damage =
        Math.floor(
            damage
        );

    boss.hp -= damage;

    gainNP(servant);

    logPlayer(

        `${servant.icon}
        ${servant.name}
        gây
        ${damage}
        sát thương`
    );
}

/* =====================================
   PLAYER ACTION
===================================== */

function playerAction(
    action
){

    if(gameOver)
        return;

    let servant =
        team[currentTurn];

    if(
        servant.hp <= 0
    )
        return;

    switch(action){

        case "attack":

            basicAttack(
                servant
            );

            break;

        case "skill":

            useSkill(
                servant
            );

            break;

        case "np":

            useNP(
                servant
            );

            break;
    }

    revealBossCheck();

    renderBoss();

    renderTeam();

    if(
        boss.hp <= 0
    ){

        victory();

        return;
    }

    currentTurn++;

    highlightTurn();
}

/* =====================================
   BOSS REVEAL
===================================== */

function revealBossCheck(){

    if(
        boss.revealed
    )
        return;

    if(

        boss.hp <=

        boss.maxHp * 0.5

    ){

        boss.revealed = true;

        logSystem(

            `⚠ Đã xác định
            Class Boss:
            ${
                classData[
                    boss.classId
                ].name
            }`
        );

        renderBoss();
    }
}

/* =====================================
   CHECK LOSE
===================================== */

function checkLose(){

    const alive =

        team.some(
            s => s.hp > 0
        );

    if(alive)
        return false;

    gameOver = true;

    document
        .getElementById(
            "action-panel"
        )
        .style.display =
        "none";

    logSystem(
        "💀 GAME OVER"
    );

    return true;
}

/* =====================================
   VICTORY
===================================== */

function victory(){

    gameOver = true;

    document
        .getElementById(
            "action-panel"
        )
        .style.display =
        "none";

    logSystem(
        "🎉 CHIẾN THẮNG!"
    );
}

/* =====================================
   SKILL SYSTEM
===================================== */

function useSkill(servant){

    if(servant.np < 20)
        return;

    servant.np -= 20;

    switch(servant.classId){

        /* =========================
           KNIGHT
        ========================= */

        case 1:

            servant.defending = true;

            servant.reflect = true;

            servant.status =
                "🛡 Defending";

            logPlayer(
                "🛡 Knight sử dụng Thủ Chắc"
            );

            break;

        /* =========================
           ARCHER
        ========================= */

        case 2:

            let hit1 = Math.floor(
                servant.atk * 0.8
            );

            let hit2 = Math.floor(
                servant.atk * 0.8
            );

            hit1 *=
                (
                    1 +
                    getModifier(
                        servant.classId,
                        boss.classId
                    )
                );

            hit2 *=
                (
                    1 +
                    getModifier(
                        servant.classId,
                        boss.classId
                    )
                );

            hit1 =
                Math.floor(hit1);

            hit2 =
                Math.floor(hit2);

            boss.hp -=
                hit1 + hit2;

            servant.np =
                Math.min(
                    100,
                    servant.np + 30
                );

            logPlayer(
                `🏹 Archer bắn 2 lần gây ${hit1 + hit2} sát thương`
            );

            break;

        /* =========================
           MAGE
        ========================= */

        case 3:

            let mageDamage =

                Math.floor(

                    servant.atk *
                    1.5 *

                    (
                        1 +
                        getModifier(
                            servant.classId,
                            boss.classId
                        )
                    )

                );

            boss.hp -=
                mageDamage;

            boss.atkDebuff = 0.20;

            boss.atkDebuffTurn = 2;

            logPlayer(
                `🔥 Mage gây ${mageDamage} sát thương`
            );

            logSystem(
                "Boss bị giảm 20% ATK trong 2 lượt"
            );

            break;

        /* =========================
           ASSASSIN
        ========================= */

        case 4:

            let crit =
                Math.random() < 0.30;

            let assassinDamage =

                servant.atk;

            if(crit){

                assassinDamage *= 3;

                logCrit(
                    "💥 CRITICAL HIT!"
                );
            }

            assassinDamage *=

                (
                    1 +
                    getModifier(
                        servant.classId,
                        boss.classId
                    )
                );

            assassinDamage =
                Math.floor(
                    assassinDamage
                );

            boss.hp -=
                assassinDamage;

            logPlayer(
                `🗡 Assassin gây ${assassinDamage} sát thương`
            );

            break;

        /* =========================
           HEALER
        ========================= */

        case 5:

            team.forEach(
                ally => {

                if(
                    ally.hp <= 0
                )
                    return;

                ally.hp =
                    Math.min(
                        ally.maxHp,
                        ally.hp + 80
                    );

                ally.np =
                    Math.min(
                        100,
                        ally.np + 15
                    );
            });

            logPlayer(
                "💚 Healer hồi 80 HP và +15 NP cho toàn đội"
            );

            break;

        /* =========================
           BERSERKER
        ========================= */

        case 6:

            let hpCost =

                Math.floor(
                    servant.hp * 0.1
                );

            servant.hp -=
                hpCost;

            let berserkDamage =

                Math.floor(

                    servant.atk *
                    1.5 *

                    (
                        1 +
                        getModifier(
                            servant.classId,
                            boss.classId
                        )
                    )

                );

            boss.hp -=
                berserkDamage;

            let heal =

                Math.floor(
                    berserkDamage *
                    0.4
                );

            servant.hp =
                Math.min(
                    servant.maxHp,
                    servant.hp + heal
                );

            logPlayer(
                `💀 Berserker gây ${berserkDamage} sát thương`
            );

            logPlayer(
                `💚 Hút máu ${heal} HP`
            );

            break;
    }

    renderBoss();
    renderTeam();
}

/* =====================================
   CLEAR EXPIRED STATUS
===================================== */

function clearStatus(){

    team.forEach(
        servant => {

        if(
            servant.defending
        ){

            servant.defending =
                false;

            servant.reflect =
                false;

            servant.status = "";
        }
    });
}


/* =====================================
   NOBLE PHANTASM SYSTEM
===================================== */

function useNP(servant){

    if(servant.np < 100)
        return;

    servant.np = 0;

    logNP(
        `🔥 ${servant.name}
         kích hoạt Noble Phantasm!`
    );

    switch(servant.classId){

        /* =========================
           KNIGHT NP
        ========================= */

        case 1:

            team.forEach(
                ally => {

                if(ally.hp <= 0)
                    return;

                ally.defending = true;

                ally.reflect = true;

                ally.status =
                    "🛡 Avalon";
            });

            window.teamProtectionTurn = 2;

            logNP(
                "🏰 Fortress of Avalon bảo vệ toàn đội trong 2 lượt Boss"
            );

            break;

        /* =========================
           ARCHER NP
        ========================= */

        case 2:

            boss.hp -= 350;

            servant.np = 20;

            logNP(
                "🏹 Thousand Arrows gây 350 sát thương"
            );

            break;

        /* =========================
           MAGE NP
        ========================= */

        case 3:

            boss.hp -= 350;

            boss.atkDebuff = 0.30;

            boss.atkDebuffTurn = 3;

            logNP(
                "☄️ Meteor Fall gây 350 sát thương"
            );

            logSystem(
                "Boss bị giảm 30% ATK trong 3 lượt"
            );

            break;

        /* =========================
           ASSASSIN NP
        ========================= */

        case 4:

            let damage = 250;

            if(Math.random() < 0.5){

                damage += 300;

                logCrit(
                    "💀 Death Mark kích hoạt!"
                );
            }

            boss.hp -= damage;

            logNP(
                `🗡 Death Mark gây ${damage} sát thương`
            );

            break;

        /* =========================
           HEALER NP
        ========================= */

        case 5:

            team.forEach(
                ally => {

                if(ally.hp <= 0)
                    return;

                ally.hp +=
                    ally.maxHp * 0.4;

                if(
                    ally.hp >
                    ally.maxHp
                ){
                    ally.hp =
                        ally.maxHp;
                }

                ally.np =
                    Math.min(
                        100,
                        ally.np + 50
                    );
            });

            logNP(
                "💚 Miracle hồi máu và NP cho toàn đội"
            );

            break;

        /* =========================
           BERSERKER NP
        ========================= */

        case 6:

            boss.hp -= 600;

            servant.hp -=
                Math.floor(
                    servant.hp * 0.25
                );

            logNP(
                "💀 Ragnarok gây 600 sát thương"
            );

            break;
    }

    renderBoss();

    renderTeam();

    if(boss.hp <= 0){

        victory();

        return;
    }
}

/* =====================================
   TEAM PROTECTION
===================================== */

window.teamProtectionTurn = 0;

/* =====================================
   REMOVE PROTECTION
===================================== */

function updateTeamProtection(){

    if(
        window.teamProtectionTurn <= 0
    )
        return;

    window.teamProtectionTurn--;

    if(
        window.teamProtectionTurn <= 0
    ){

        team.forEach(
            servant => {

            servant.defending =
                false;

            servant.reflect =
                false;

            servant.status = "";
        });

        logSystem(
            "🏰 Fortress of Avalon đã biến mất"
        );
    }
}


/* =====================================
   BOSS ACTION
===================================== */

function bossAction(){

    if(gameOver)
        return;

    bossTurnCount++;

    boss.npCounter++;

    let aliveTargets =

        team.filter(
            servant =>
                servant.hp > 0
        );

    if(
        aliveTargets.length === 0
    ){

        checkLose();

        return;
    }

    /* =========================
       BOSS NP
    ========================= */

    if(
        boss.npCounter >= 3
    ){

        boss.npCounter = 0;

        bossNP();

        renderTeam();

        if(checkLose())
            return;

        currentTurn = 0;

        highlightTurn();

        return;
    }

    /* =========================
       NORMAL ATTACK
    ========================= */

    let target =

        aliveTargets[
            Math.floor(
                Math.random() *
                aliveTargets.length
            )
        ];

    let effectiveAtk =
        boss.atk;

    if(
        boss.atkDebuffTurn > 0
    ){

        effectiveAtk *=
            (
                1 -
                boss.atkDebuff
            );

        boss.atkDebuffTurn--;

        if(
            boss.atkDebuffTurn <= 0
        ){

            boss.atkDebuff = 0;

            logSystem(
                "Boss đã hồi phục sức mạnh."
            );
        }
    }

    let damage =

        Math.floor(

            effectiveAtk +
            Math.random()*15

        );

    damage *=

        (
            1 +
            getModifier(
                boss.classId,
                target.classId
            )
        );

    damage =
        Math.floor(
            damage
        );

    /* =========================
       DEFENSE
    ========================= */

    if(
        target.defending
    ){

        damage =
            Math.floor(
                damage * 0.5
            );

        if(
            target.reflect
        ){

            let reflectDamage =

                Math.floor(
                    damage * 0.3
                );

            boss.hp -=
                reflectDamage;

            logPlayer(

                `🛡 ${target.name}
                 phản lại
                 ${reflectDamage}
                 sát thương`
            );
        }
    }

    target.hp -= damage;

    logBoss(

        `👹 Boss tấn công
         ${target.name}
         gây
         ${damage}
         sát thương`
    );

    if(
        target.hp <= 0
    ){

        target.hp = 0;

        logSystem(

            `☠ ${target.name}
             đã ngã xuống`
        );
    }

    /* =========================
       REVEAL CLASS
    ========================= */

    revealBossCheck();

    renderBoss();

    renderTeam();

    clearStatus();

    updateTeamProtection();

    if(
        boss.hp <= 0
    ){

        victory();

        return;
    }

    if(
        checkLose()
    )
        return;

    currentTurn = 0;

    highlightTurn();
}

/* =====================================
   BOSS NP
===================================== */

function bossNP(){

    let aoe =
        Math.random() < 0.5;

    if(aoe){

        logBoss(
            "💥 SOUL BURST!"
        );

        team.forEach(
            servant => {

            if(
                servant.hp <= 0
            )
                return;

            let damage = 120;

            if(
                servant.defending
            ){

                damage =
                    Math.floor(
                        damage * 0.5
                    );
            }

            servant.hp -=
                damage;

            if(
                servant.hp <= 0
            ){

                servant.hp = 0;

                logSystem(
                    `☠ ${servant.name}
                     bị hạ gục`
                );
            }
        });

    }else{

        let aliveTargets =

            team.filter(
                s => s.hp > 0
            );

        if(
            aliveTargets.length === 0
        )
            return;

        let target =

            aliveTargets.reduce(
                (lowest,current)=>{

                return current.hp <
                       lowest.hp
                       ? current
                       : lowest;

            });

        let damage =

            Math.floor(
                boss.atk * 1.5
            );

        if(
            target.defending
        ){

            damage =
                Math.floor(
                    damage * 0.5
                );
        }

        target.hp -=
            damage;

        logBoss(

            `💀 SOUL EXECUTION
             đánh vào
             ${target.name}
             gây
             ${damage}
             sát thương`
        );

        if(
            target.hp <= 0
        ){

            target.hp = 0;

            logSystem(
                `☠ ${target.name}
                 bị kết liễu`
            );
        }
    }
}

/* =====================================
   RESTART GAME
===================================== */

function restartGame(){

    location.reload();
}

/* =====================================
   AUTO SCROLL
===================================== */

function scrollLogBottom(){

    const log =

        document.getElementById(
            "battle-log"
        );

    log.scrollTop =
        log.scrollHeight;
}

/* =====================================
   END GAME
===================================== */

function endGame(
    message
){

    gameOver = true;

    document
        .getElementById(
            "action-panel"
        )
        .style.display =
        "none";

    logSystem(
        message
    );

    setTimeout(()=>{

        const restartBtn =
        document.createElement(
            "button"
        );

        restartBtn.innerText =
            "🔄 Chơi Lại";

        restartBtn.onclick =
            restartGame;

        restartBtn.style.marginTop =
            "20px";

        restartBtn.style.padding =
            "12px 20px";

        restartBtn.style.fontSize =
            "18px";

        document
            .getElementById(
                "battle-log"
            )
            .appendChild(
                restartBtn
            );

    },500);
}

/* =====================================
   OVERRIDE WIN / LOSE
===================================== */

function victory(){

    if(gameOver)
        return;

    endGame(
        "🎉 THE NIGHTMARE SOUL ĐÃ BỊ TIÊU DIỆT!"
    );
}

function checkLose(){

    let alive =

        team.some(
            servant =>
                servant.hp > 0
        );

    if(alive)
        return false;

    endGame(
        "💀 TOÀN ĐỘI ĐÃ BỊ TIÊU DIỆT!"
    );

    return true;
}

/* =====================================
   GAME READY
===================================== */

console.log(
    " Loaded"
);
