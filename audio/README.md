# ゲーム内の音声

## 再生方式

短い効果音と謎のメロディは `game-audio.js` の Web Audio で再生します。再生ごとに `AudioBufferSourceNode` を作り、終了時に切断します。HTMLの音声プレーヤーやOSのメディア再生ボタンには再生処理を割り当てません。

ユーザーのタップ・決定キーで音声を有効化します。非表示・ページ離脱・音声中断時は再生中と読み込み待ちの音を停止し、戻ってきても途中の効果音を自動で再開しません。タイトル・最初から・セーブ再開でも停止します。耳鳴りはオープニング本文表示までに停止します。

音量設定は共通の GainNode に適用します。基準音量は耳鳴り0.5、扉0.65、記憶のピアノ0.7。設定値を0にすると全音声が無音になります。

iPhoneでは対応している場合に `audioSession.type = "ambient"` を指定します。ゲームの効果音として扱うため、端末の消音モードでは鳴らない場合があります。音声が利用できない場合もゲームは進行します。

参考：[WebKitによるゲーム効果音の説明](https://bugs.webkit.org/show_bug.cgi?id=252746)、[W3C Audio Session](https://www.w3.org/TR/audio-session/)。実機でのコントロールセンター表示・メディアボタンの挙動は別途確認が必要です。

## 音源

### 扉を開く音 `se/door_open.wav`

- 作品：Door Open SFX
- 作者：Oiboo
- 配布元：https://opengameart.org/content/door-open-sfx
- 原本：https://opengameart.org/sites/default/files/door_open.wav
- ライセンス：CC0（配布ページ記載）
- 加工：前後の無音を整理、モノラル化、ピークを約−9 dBFSへ調整、先頭8ms・末尾40msのフェード。音程・再生速度は変更なし。
- 再加工用：`python scripts/prepare_door_audio.py source.wav audio/se/door_open.wav`

旧 `se/door_unlock.wav` は音程が大きく上下する仮の音源で、現在のゲームからは参照しません。部屋へ入るタイミングは従来の1.2秒後を維持し、新しい扉音の余韻は切らずに再生します。

### 耳鳴り `se/tinnitus.mp3`

既存の音源を変更せず使用しています。ID3の作者情報は Taira Komori、公式サイトは https://taira-komori.net/ です。`tinnitus5.mp3` は同じデータですが、ゲームでは参照しません。

### 記憶のピアノ `memory_melody_piano.wav`

音源・正解時に鳴らす条件は変更せず、再生方式のみ共通化しています。
