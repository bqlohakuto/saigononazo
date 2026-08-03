//==================================
// ゲーム画面
//==================================

const game = document.getElementById("game");


//==================================
// 効果音
//==================================

const tinnitus = new Audio("audio/se/tinnitus.mp3");

// Ver0.6では仮ファイル名です。
// 後で好きな文字送り音に差し替えてOKです。
//const heroineSe = new Audio("audio/se/text_heroine.mp3");
//const playerSe   = new Audio("audio/se/text_player.mp3");

tinnitus.volume = 0.5;
//heroineSe.volume = 0.4;
//playerSe.volume = 0.4;


//==================================
// プレイヤー情報
//==================================

let playerName = "";


//==================================
// 会話システム
//==================================

let currentScenario = [];
let currentLine = 0;


//==================================
// 演出時間
//==================================

const FLASH_TIME = 1000;
const BLACK_TIME = 1000;
const FADE_TIME  = 3000;
const TEXT_DELAY = 2000;


//==================================
// タイトル画面
//==================================

function showTitle(){

    game.innerHTML = `

    <div class="title-screen">

        <h1>最後の謎が解けるまで</h1>

        <button id="startButton">
            はじめる
        </button>

    </div>

    `;

    document
        .getElementById("startButton")
        .addEventListener("click",showNameInput);

}


//==================================
// 名前入力
//==================================

function showNameInput(){

    game.innerHTML = `

    <div class="title-screen">

        <h2>あなたの名前を入力してください</h2>

        <input
            id="playerName"
            type="text"
            maxlength="8"
            placeholder="名前">

        <br><br>

        <button id="decideButton">

            決定

        </button>

    </div>

    `;

    document
        .getElementById("decideButton")
        .addEventListener("click",flashRed);

}


//==================================
// 赤フラッシュ
//==================================

function flashRed(){

    playerName = document
        .getElementById("playerName")
        .value
        .trim();

    if(playerName===""){

        playerName="主人公";

    }

    game.innerHTML=`

        <div class="flash"></div>

    `;

    tinnitus.currentTime=0;
    tinnitus.play();

    setTimeout(showBlack,FLASH_TIME);

}


//==================================
// 暗転
//==================================

function showBlack(){

    game.innerHTML=`

        <div class="black"></div>

    `;

    setTimeout(showFade,BLACK_TIME);

}


//==================================
// フェード
//==================================

function showFade(){

    showOpening();

    document
        .querySelector(".opening")
        .classList
        .add("fade-in");

}


//==================================
// オープニング
//==================================

function showOpening(){

    game.innerHTML=`

    <div class="opening">

        <div id="character-area"></div>

        <div
            class="dialog"
            id="dialog"
            style="display:none;">

            <div id="messageArea"></div>

            <button id="nextButton">

                ▶

            </button>

        </div>

    </div>

    `;

    setTimeout(() => {

    document.getElementById("dialog").style.display = "block";

    startScenario(openingScenario);

}, FLASH_TIME + BLACK_TIME + FADE_TIME + TEXT_DELAY);

}


//==================================
// シナリオ開始
//==================================

function startScenario(scenario){

    currentScenario=scenario;

    currentLine=0;

    showLine();

    document
        .getElementById("nextButton")
        .addEventListener("click",nextLine);

}
//==================================
// セリフ表示
//==================================

function showLine(){

    const line = currentScenario[currentLine];

    const messageArea = document.getElementById("messageArea");

    let messageClass = "heroine";

    if(line.speaker === "主人公"){

        messageClass = "player";

        //playerSe.currentTime = 0;
        //playerSe.play();

    }else{

        //heroineSe.currentTime = 0;
        //heroineSe.play();

    }

    messageArea.innerHTML = `

        <div class="message ${messageClass}">

            ${line.text}

        </div>

    `;

}


//==================================
// 次のセリフ
//==================================

function nextLine(){

    currentLine++;

    if(currentLine >= currentScenario.length){

        endOpening();

        return;

    }

    showLine();

}


//==================================
// オープニング終了
//==================================

function endOpening(){

    alert("ここから第一部屋へ");

}


//==================================
// ゲーム開始
//==================================

showTitle();


//==================================
// ダブルタップ防止
//==================================

let lastTouchEnd = 0;

document.addEventListener("touchend",(event)=>{

    const now = Date.now();

    if(now - lastTouchEnd <= 300){

        event.preventDefault();

    }

    lastTouchEnd = now;

},{passive:false});


//==================================
// Safari ピンチ対策
//==================================

document.addEventListener("gesturestart",(e)=>{

    e.preventDefault();

});

document.addEventListener("gesturechange",(e)=>{

    e.preventDefault();

});

document.addEventListener("gestureend",(e)=>{

    e.preventDefault();

});