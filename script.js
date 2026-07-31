//==================================
// ゲーム画面
//==================================

const game = document.getElementById("game");

//==================================
// 効果音
//==================================

const tinnitus = new Audio("audio/se/tinnitus.mp3");

tinnitus.volume = 1.0;

let playerName = "";

//==================================
// 演出時間
//==================================

const FLASH_TIME = 150;

const BLACK_TIME = 1000;

const FADE_TIME = 2000;


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
        .addEventListener("click", showNameInput);

}


//==================================
// 名前入力
//==================================

function showNameInput(){

    game.innerHTML = `

    <div class="title-screen">

        <h2>あなたの名前を入力してください</h2>

        <br>

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
        .addEventListener("click", flashRed);

}


//==================================
// 赤いフラッシュ
//==================================

function flashRed(){

    playerName =
        document.getElementById("playerName").value;

    game.innerHTML = `

    <div class="flash"></div>

    `;

    // 耳鳴り
    tinnitus.currentTime = 0;
tinnitus.play();

    setTimeout(showBlack, FLASH_TIME);

}

//==================================
// 暗転
//==================================

function showBlack(){

    game.innerHTML = `

    <div class="black"></div>

    `;

    setTimeout(showFade, BLACK_TIME);

}


//==================================
// フェードイン
//==================================

function showFade(){

    game.innerHTML = `

    <div class="fade"></div>

    `;

    setTimeout(showOpening, FADE_TIME);

}

//==================================
// オープニング
//==================================

function showOpening(){

    game.innerHTML = `

    <div class="opening">

        <div id="character-area"></div>

        <div class="dialog">

            <p id="speaker"></p>

            <p id="text">……よかった。</p>

            <button id="nextButton">▶</button>

        </div>

    </div>

    `;

}


//==================================
// ゲーム開始
//==================================

showTitle();
