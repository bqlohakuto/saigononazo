# 第2回想・第1実装素材に合わせた制服差分

2026-10-19

## 確認した実物

- 公開ゲームをCloud Browserで開き、動作を確認。
- 第1の原画 `images/characters/memories/room01/girl-approved.png` と `images/background/memories/room01/music-room.png` を取得して目視。
- 実装画面 `docs/previews/memory01-music.webp` と `memory-visuals.js`、`design-ui.css` の表示条件を照合。
- 前回作成された「回想キャラ比較・修正版ドット絵シート.png」「高校制服キャラのドット絵スプライトシート.png」を取得して目視。シート内の「第1」は実装原画ではなく、背景・髪型・色・描画様式が異なっていたため、画風の基準として使用しない。
- 資料を取得した後は、ユーザーの指示に従い手動でゲームを進める操作を停止。

## 比較と修正

| 項目 | 実装済みの第1 | 前回の第2シート | 今回の第2 |
| --- | --- | --- | --- |
| 髪 | 暗い茶色、低い位置でまとめた髪 | 明るい灰褐色、長い髪と編み込み | 第1原画の茶髪・まとめ髪を維持 |
| 顔 | 目・鼻を薄い影で伏せ、口だけ表示 | 前髪で大きく覆う別の輪郭 | 第1の輪郭・口元・薄い影を維持 |
| 頭身・姿勢 | 約6頭身、腕を自然に下ろす | シート内で縮尺・姿勢が異なる | 第1と同じ比率・立ち姿 |
| 描画 | 背景は細密なドット調、人物は滑らかな線のイラスト | 人物も粗い粒状のドット調 | 実装済み人物の線と陰影を基準に統一 |
| 制服 | 白と紺のセーラー服 | 紺ブレザー、えんじリボン | 承認済みの紺ブレザー、えんじリボン、控えめなチェックのスカート |
| 背景 | 夕焼けの窓、左にピアノの音楽室 | 黒板中心の異なる音楽室 | 第1のPNGをそのまま参照 |

第1立ち絵は931×1689px、今回の第2は931×1690px、どちらも透過RGBA。第1背景は1672×941px。固定の低解像度ピクセルグリッドではないため、ファイル寸法だけを「ドット解像度」とは扱わない。表示CSSは第1と共通のまま、人物の位置・大きさ・会話枠の色を継承する。

## 実装

- 新規素材：`images/characters/memories/room02/girl-blazer.png`。
- 第2の地の文・心の声・部員の台詞では音楽室のみ表示。
- 先輩と主人公の台詞では制服差分を表示。
- 回想内の特別なLOG ID `room2_final_hanamaru` も回想として扱い、この一行で現在の部屋へ背景が戻らないよう修正。
- 元の台詞・謎・第1の原画は変更しない。
- 既存の回想単体試験に第2の全原稿との対応を追加。CIでは第2回想を直接開き、PC Chromiumと横向きWebKitで背景・人物・会話非表示・本編復帰を検証して撮影する。

## 画像制作

組み込みimagegenのidentity-preserve編集。入力1は実装済み第1立ち絵、入力2は前回第2シート（制服だけの参考）。透過背景で1体だけ生成し、出力原画をそのまま実装。

使用プロンプト：

```text
Use case: identity-preserve. Asset type: ONE transparent full-body character sprite for the Japanese visual novel 最後の謎が解けるまで, second recollection. Image 1 is the ACTUAL IMPLEMENTED APPROVED FIRST-RECOLLECTION SPRITE and the edit target, absolute authority for character identity, hair, face, proportions, pose, linework, shading and rendering. Image 2 is ONLY a clothing reference sheet for the approved navy blazer and burgundy ribbon; its character/hair/style are wrong and must NOT be copied. Edit image 1 by changing ONLY the school uniform to the approved outfit: dark navy single-breasted school blazer with lapels and small gold buttons, white collared blouse, burgundy/maroon bow ribbon, subtle navy-gray plaid knee-length pleated skirt, dark plain socks and dark brown loafers. Preserve image 1's exact dark brown hair, low loose bundled updo with side strands, the same head contour and bangs, gentle small closed-mouth smile, missing eyes/eyebrows/nose under a LIGHT soft memory shadow (not a dark black mask). Preserve the existing circa-six-head body proportion, shoulder width, short natural limb proportions, natural relaxed arms at sides, both hands, frontal slight three-quarter pose, feet and full-body composition. Keep the same refined thin line anime illustration rendering as image 1, the same level of detail and smooth restrained cel shading; DO NOT convert to the coarse stippled pixel texture of image 2. The actual first sprite is not on a rigid low-resolution pixel grid, so matching image 1 takes priority. Full head to shoes, comfortable transparent margins, centered, vertical canvas with similar 931:1689 aspect and occupancy to image 1. Draw exactly one character, no background, no checkerboard painted into the image, no ground shadow, no frame, labels, letters, expression grid, additional poses or extra objects. Background must be truly transparent alpha. No identity redesign, no long loose gray hair, no braided half-up hairstyle, no chibi, no elongated legs, no visible eyes or nose. This is a uniform-only continuity edit of image 1.
```
