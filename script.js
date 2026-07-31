//==============================
// ゲーム画面
//==============================

const game = document.getElementById("game");


//==============================
// タイトル画面
//==============================

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


//==============================
// 名前入力画面
//==============================

function showNameInput(){

    game.innerHTML = `

    <div class="title-screen">

        <h2>あなたの名前を入力してください</h2>

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

}


//==============================
// ゲーム開始
//==============================

showTitle();