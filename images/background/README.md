# 第一の部屋：背景と手描き素材

2026-09-10：現在のゲームは `room01/` 配下の採用済み11枚を使用しています。4方向背景は解錠前後とも同じ画像・色調です。詳細は [画像作成リスト・実装記録](../../docs/IMAGE_ASSET_LIST.md) を参照してください。以下は保持している旧 `room1-*.png` の制作記録です。

## 作成済みの背景

4枚とも 1536 × 1024 px（横長 3:2）のPNGです。水彩・鉛筆風の明るい部屋として、Codex内蔵の画像生成で作成しました。CLIの代替生成は使っていません。

| ファイル | 向き | 別レイヤーで置くもの |
| --- | --- | --- |
| room1-front.png | 正面 | 扉・問題文・ハナ |
| room1-right.png | 右の壁 | 演奏会のポスター |
| room1-back.png | 背面 | 机の上の携帯電話（手描き画像を組み込み済み） |
| room1-left.png | 左の壁 | ピアノ |

背景に謎の答えやキーアイテムは描き込んでいません。机・窓・空の棚は背景の一部です。携帯電話以外は仮表示で、手描き素材が届いたら置き換えられます。携帯電話の原画・透過素材については [手描きキーアイテム](../items/README.md) を参照してください。

## 手描き素材の準備

- 携帯電話・ポスター・ピアノなど、1つの物につき1枚の画像にしてください。
- デジタルなら背景透過PNGがおすすめです。紙に描いた絵の写真やスキャンでも、取り込み方法を相談できます。
- 部屋に配置する絵は、なるべく正面から見た形がなじみます。サイズは受け取り後に調整するので厳密な指定はありません。
- カラーで描いて構いません。現在は背景だけに淡色処理をかけており、手描き素材の色は保たれます。
- ポスター内の文字など、謎に関わる内容は既存のシナリオと照合してから組み込みます。

正解前は同じ背景画像を淡い白黒で表示し、記憶の会話が終わって扉が解錠されると約2.8秒でカラーになります。端末の「動きを減らす」設定では切り替え演出を省略します。

解錠後に追加で調べられる品と任意の記憶は、内容を決めてから実装します。現時点では追加していません。

## 最終生成プロンプト

各画像は、以下の共通プロンプトと該当する方向別プロンプトを組み合わせ、別々に生成しました。参考画像は使用していません。生成後、背景のまま使用し、ゲーム側で淡色表示とクリック対象を重ねています。

### 共通

```text
Use case: stylized-concept.
Asset type: final production background plate for a Japanese browser escape game, first memory room, 1536x1024 landscape 3:2.
A quiet square room with ivory plaster walls, slim light honey-oak baseboards and natural oak plank floor. Facing one wall square-on from the exact center of the room, eye level, symmetric single-point perspective. Full wall from ceiling boundary at y=12% to floor boundary y=76%, narrow adjoining walls at left/right edges. Same compact room architecture throughout. Warm full-color version: creamy white walls, clear gentle golden light, natural honey wood, softly detailed pencil outlines and hand-painted watercolor/gouache textures on paper, elegant restrained Japanese illustrated adventure-game background. Bright, tender, nostalgic, calm, not ominous. Color should feel present when CSS grayscale is removed. Large clean wall regions are intentional game spaces for separately drawn interactive props.
Only architecture and explicitly specified EMPTY furniture. No people, no characters, no doors, no piano, no phone, no posters, no papers, no instruments, no photographs, no toys, no symbols, no readable text, no letters, no logos, no watermark, no UI, no border, no collage. No tiny clutter, no puzzle hints painted into background. Flat level camera, straight verticals, clean playable composition.
```

### room1-front.png

```text
FRONT WALL. Almost empty uninterrupted ivory plaster wall. Center x40%-60% y25%-76% is completely blank for a door to be overlaid in the game. A modest ceiling fluorescent fixture at the very top, gentle warm diffuse ceiling lighting. Floor entirely empty.
```

### room1-right.png

```text
RIGHT WALL. Uninterrupted ivory wall, softly visible plaster texture. Center-upper region x35%-70% y22%-63% completely blank for a concert poster to be overlaid. A single very thin EMPTY oak display ledge at far left x10%-28% y60%, no objects at all. Floor empty. Gentle warm diffuse ceiling lighting.
```

### room1-back.png

```text
BACK WALL. One plain EMPTY low oak writing desk against the back wall, x35%-70% with tabletop near y65%, legs ending at y82%, no chairs and absolutely nothing on top. This desk is for a separate hand-drawn phone overlay. Wall blank. Gentle warm diffuse ceiling lighting. No doors.
```

### room1-left.png

```text
LEFT WALL. Uninterrupted ivory plaster wall. Center x25%-75% y30%-84% and its floor space completely empty for an upright piano to be overlaid later. Single modest high window at far upper right x78%-92% y15%-33% with translucent warm ivory curtain, diffused light, no view outside. No other furniture or props.
```
