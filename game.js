

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

