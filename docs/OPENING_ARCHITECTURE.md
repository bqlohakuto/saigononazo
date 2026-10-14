# オープニング実装の責務

オープニングの表示・進行は `opening-sequence.js` を唯一の実装元とします。

- `script.js`
  - タイトル、セーブ、設定、第一の部屋など共通ゲーム処理を担当する。
  - 「はじめから」決定時は `flashRed()` を呼び、OP再開時は `showOpening(saved.openingIndex)` を呼ぶ。
  - OP終了後に第一の部屋へ渡す `endOpening()` は共通遷移として保持する。
- `opening-sequence.js`
  - `flashRed()`、`showOpening()`、背景色の赤→黒→白の同期、OP会話開始を担当する。
  - OPの表示進行を別ファイルへ重複実装しない。
- `tests/opening-source.test.cjs`
  - OP実装が二重化していないことと読み込み順を確認する。
- `tests/opening-sequence.test.cjs`
  - 赤・黒・白の表示状態と、セーブ再開時にフェードを再実行しないことを確認する。

OP仕様を変更する場合は、まず `opening-sequence.js` と対応テストを更新します。
