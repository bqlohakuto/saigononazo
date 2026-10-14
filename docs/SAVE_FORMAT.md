# セーブデータ形式

保存先の localStorage キーは既存の `saigononazo-save-v1` を継続して使用します。キー名を変えず、保存データ内部に `saveVersion` を持たせて段階的に更新します。

## v2 の正規形式

```js
{
  saveVersion: 2,
  playerName: "白兎",
  currentScene: "room01",       // opening / room01 / 将来 room02 ...
  opening: {
    index: 12                    // OPで現在表示している文の位置
  },
  rooms: {
    room01: {
      doorInspected: true,
      doorUnlocked: false,
      questionSeen: true,
      hanaVisits: 2,
      mailHintGiven: false,
      pianoAttempted: false,
      melodySolved: false,
      phoneIntroductionSeen: true,
      viewedWall: "back",
      openedInbox: ["inbox-1"],
      openedSent: []
    }
    // room02: {...} を同じ階層へ追加できる
  },
  logs: [/* GameLog.list() */]
}
```

`currentScene` と `rooms` が今後の正本です。第二の部屋を追加するときは `rooms.room02` を追加し、再開処理に `room02` のローダーを1つ追加します。第一の部屋のデータを上書きしたり、トップレベルへ部屋固有の状態を増やしたりしません。

## v1 からの移行

従来形式は読み込み時にメモリ上で v2 へ正規化します。

- `scene: "opening"` + `openingIndex` → `currentScene: "opening"` + `opening.index`
- `scene: "firstRoom"` + `state` → `currentScene: "room01"` + `rooms.room01`
- `logs` は配列順を保ったまま移行します。同じ `logId` が複数あっても削除しません。
- 古いセーブに存在しない項目は各画面側の既定値で補います。

読み込んだだけでは localStorage を書き換えません。次にゲーム内で保存が発生した時点で v2 形式として保存されます。

## 一時的な互換フィールド

現在の第一の部屋実装と既存テストへの安全な移行のため、v2を書き込む際も当面は以下を併記します。

- OP中: `scene: "opening"`, `openingIndex`
- 第一の部屋: `scene: "firstRoom"`, `state`

これらは互換用の複製で、v2の読み込み処理は使用しません。正本は必ず `currentScene` / `opening` / `rooms` です。`room02` 以降では互換フィールドを作りません。

## 第二の部屋を追加するとき

1. `rooms.room02` に保存する状態を決める。
2. `currentScene = "room02"` に切り替えてから画面を表示する。
3. `saveGame()` が `roomStates.room02` を含めて保存できるよう、その部屋の状態を `roomStates` に反映する。
4. `resumeGame()` のローダーへ `room02` を追加する。
5. v1移行処理は変更しない。

今回は保存基盤だけを用意し、第二の部屋・第二の謎そのものは実装しません。
