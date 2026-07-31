//==================================
// ゲーム画面
//==================================

const game = document.getElementById("game");

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
            placeholder="主人公の名前">

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

    <div style="
        width:100vw;
        height:100vh;
        background:red;
    "></div>

    `;

    setTimeout(showOpening,300);

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
