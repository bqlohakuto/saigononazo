"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const game=read("late-game.js");
const manuscript=read("SCENARIO.md");

test("B01: Room 6 first narration matches its visible multi-door room",()=>{
  assert.match(game,/line\("r6_intro_entry_02","ト書き","小さな部屋だった。床も壁も明るい色で、正面と右側に扉がある。"/);
  assert.match(game,/line\("r6_intro_01","ト書き","足元の床は白い。並んだ扉は、どれもよく似た形をしている。"/);
  assert.match(game,/r6-door r6-door-/,"The room draws actual doors");
  assert.doesNotMatch(game,/ずいぶん何もないですね|家具らしいものは何もない/);
});

test("B01: manuscript no longer contradicts the room or repeats the wall inscription",()=>{
  const start=manuscript.indexOf("## 第6の部屋");
  assert(start>=0);
  const introStart=manuscript.indexOf("### 導入",start);
  assert(introStart>start);
  const nextHeading=manuscript.indexOf("### ",introStart+5);
  const tail=manuscript.slice(introStart,nextHeading<0?undefined:nextHeading);
  assert.match(tail,/小さな部屋だった。床も壁も明るい色で、正面と右側に扉がある。/);
  assert.doesNotMatch(tail,/ずいぶん何もないですね|家具らしいものは何もない/);
  assert.equal((tail.match(/壁の一角に、短い言葉が刻まれていた。/g)||[]).length,1);
});

test("F01: unseen rooms are not described until the player enters another room",()=>{
  const introStart=game.indexOf('window.showSixthRoom=function');
  const introEnd=game.indexOf('function r6MapMarkup()',introStart);
  const intro=game.slice(introStart,introEnd);
  assert(introStart>=0&&introEnd>introStart);
  assert.doesNotMatch(intro,/どの扉の先にも、同じような空間が続いているようだ/);
  assert.match(intro,/line\("r6_intro_01","ト書き","足元の床は白い。並んだ扉は、どれもよく似た形をしている。"/);

  const arrivalStart=game.indexOf('const arrived=()=>',game.indexOf('function r6Visit('));
  const arrivalEnd=game.indexOf('const direction=',arrivalStart);
  const arrival=game.slice(arrivalStart,arrivalEnd);
  assert(arrivalStart>=0&&arrivalEnd>arrivalStart);
  assert.match(game,/const firstAdditionalWhite=fresh&&arrivalColor==='W'/,'white comparison is tied to a new white room');
  assert.match(game,/const firstBlack=fresh&&arrivalColor==='G'/,'black observation is tied to first black room');
  assert.match(game,/const firstGreen=fresh&&arrivalColor==='E'/,'green observation is tied to first green room');
  assert.match(arrival,/line\('r6_a7','主人公','……最初に入った部屋と、似た造りですね。'\)/);
  assert.match(arrival,/line\('r6_a7_h','ハナ','うん。壁も扉も、ほとんど同じみたい。'\)/);

  const start=manuscript.indexOf('## 第6の部屋');
  const section=manuscript.slice(start,manuscript.indexOf('### 盤面・移動の前提',start));
  assert(section.includes('足元の床は白い。並んだ扉は、どれもよく似た形をしている。'));
  assert(section.includes('……最初に入った部屋と、似た造りですね。'));
});

test("F02: pre-discovery objective and Hana's hint stay exploratory until evidence is found",()=>{
  const goal=game.match(/const r6Objective=\(\)=>[^;]+;/)?.[0];
  assert(goal,'room objective is defined');
  assert(goal.includes('"扉をたどって、部屋の手がかりを探す"'));
  assert(!goal.includes('構造と床の色を確かめる'),'objective must not reveal the intended observations');
  assert(goal.includes('room6State.othelloKnown?"9手で最後の黒を消す"'),'post-discovery goal remains unchanged');
  const before=game.slice(game.indexOf('const choices=room6State.othelloKnown?'),game.indexOf('choices.push({id:\'cancel\''));
  assert(before.includes("text:'まだ通っていない扉を進んでみよう。部屋の様子をよく確かめてみて。'"));
  assert(!before.includes('端まで行けるところや、床の色が違う部屋'),'no early structural or color clue');
  assert(game.includes('if(extremes&&colors&&!room6State.othelloKnown)'),'both board and color discoveries remain required');
});

test("F03: the fourth-room question concerns the remembered woman, not Hana's stated preference",()=>{
  const exact='line("r6_food_03","主人公","前に思い出した、あの人の好物って……アジの南蛮漬けでしたっけ？")';
  assert(game.includes(exact),'approved question is present at the unchanged log ID');
  assert(!game.includes('line("r6_food_03","主人公","ハナさんが好きなのって'),'the question is no longer about Hana herself');
  const expected=[
    ['r6_food_01','そういえば、ハナさん'],
    ['r6_food_02','ん？'],
    ['r6_food_03','前に思い出した、あの人の好物って……アジの南蛮漬けでしたっけ？'],
    ['r6_food_04','レンコンだよ'],
    ['r6_food_05','……'],
    ['r6_food_06','……あ'],
    ['r6_food_07','一瞬、沈黙する。'],
    ['r6_food_08','……レンコンでしたか'],
    ['r6_food_09','…………うん']
  ];
  const section=game.slice(game.indexOf('function r6Interview4()'),game.indexOf('function r6MapEvent()'));
  let prev=-1;
  for(const [id,words] of expected){
    const at=section.indexOf('line("'+id+'"',prev+1);
    assert(at>prev,'conversation retains original order for '+id);
    assert(section.slice(at,at+240).includes(words),'dialogue text remains intact for '+id);
    prev=at;
  }
  const doc=read('scenario/06_room6.md');
  assert(doc.includes('> 主人公「前に思い出した、あの人の好物って……アジの南蛮漬けでしたっけ？」'),'scenario matches the game');
  assert(manuscript.includes('れんこんの南蛮漬けが好きなんだよね！'),'the earlier memory already establishes the correct food');
});

test("F04/F06: white, black, green reactions are based on visited colors, not hardcoded coordinates",()=>{
  assert.match(game,/const firstAdditionalWhite=fresh&&arrivalColor==='W'&&!room6State\.visited\.some/);
  assert.match(game,/const firstBlack=fresh&&arrivalColor==='G'&&!room6State\.seenColors\.includes\('G'\)/);
  assert.match(game,/const firstGreen=fresh&&arrivalColor==='E'&&!room6State\.seenColors\.includes\('E'\)/);
  assert.match(game,/if\(firstAdditionalWhite\)lines\.push\(line\('r6_a7','主人公','……最初に入った部屋と、似た造りですね。'\)/);
  assert.match(game,/if\(firstBlack\)lines\.push\(line\('r6_b8','主人公','……ここは、床が黒いんですね。'\)/);
  assert.match(game,/if\(firstGreen\)lines\.push\(line\('r6_first_green','主人公','……この部屋は、床が緑色なんですね。'\)/);
  const prose=manuscript.slice(manuscript.indexOf('### 床色の初発見'),manuscript.indexOf('### 盤面・移動の前提'));
  assert.match(prose,/再訪・セーブ再開では繰り返さない/);
  assert.match(prose,/……最初に入った部屋と、似た造りですね。/);
  assert.match(prose,/……ここは、床が黒いんですね。/);
  assert.match(prose,/……この部屋は、床が緑色なんですね。/);
});

test("F05: Hana deflects the question about the puzzle author without a procedural instruction",()=>{
  const section=game.slice(game.indexOf('function r6MapEvent()'),game.indexOf('function r6CheckDiscovery()'));
  const ordered=[
    ["r6_map_14","この謎、ハナさんが作ったんですか？"],
    ["r6_map_15","…………"],
    ["r6_map_16","……その地図は、わたしが作ったよ"],
    ["r6_map_17","地図は？"],
    ["r6_map_18","うん"],
    ["r6_map_19","……"],
    ["r6_map_20","……ほら、まだ行ってない部屋もあるし。もう少し見てみよ？"],
    ["r6_map_21","……そうですね"]
  ];
  let last=-1;
  for(const [id,part] of ordered){
    const at=section.indexOf('line("'+id+'"',last+1);
    assert(at>last,'F05 keeps dialogue event order: '+id);
    assert(section.slice(at,at+200).includes(part),'F05 text intact: '+id);
    last=at;
  }
  assert(!section.includes('地図を使って、探索を進めよう'),'old mechanical instruction was removed');
  assert(read("scenario/06_room6.md").includes('> ハナ「……ほら、まだ行ってない部屋もあるし。もう少し見てみよ？」'),'scene manuscript matches approved line');
});

test("F07: coordinate axes and compass only appear after the player discovers Othello",()=>{
  const start=game.indexOf('function r6MapMarkup()');
  const end=game.indexOf('function renderR6()',start);
  assert(start>0&&end>start);
  const map=game.slice(start,end);
  assert(map.includes('const coordinates=room6State.othelloKnown?'),'axes are gated by discovery');
  assert(map.includes('const compass=room6State.othelloKnown?'),'compass is gated by discovery');
  assert(map.includes('r6-coordinate-columns')&&map.includes('r6-coordinate-rows'),'axes exist in grid');
  assert(map.includes('65+minX+i')&&map.includes('minY+i+1'),'labels follow cropped map origin');
  for(const direction of ['↑ 正面','→ 右','↓ 手前','← 左'])assert(map.includes(direction),'direction shown: '+direction);
  assert(map.includes('room6State.othelloKnown?id'),'the existing hidden-coordinate rule remains intact');
  const render=game.slice(game.indexOf('function renderR6()'),game.indexOf('function r6Neighbor('));
  assert(render.includes('if(room6State.othelloKnown&&room6State.mapExpanded)'),'tracking is only enabled for known expanded maps');
  assert(render.includes("scroll.querySelector")||render.includes("scroll?.querySelector"),'tracking finds the current map cell');
  assert(render.includes('scroll.scrollTop=')&&render.includes('scroll.scrollLeft='),'tracking keeps the current cell in view');
  assert(game.includes('if(extremes&&colors&&!room6State.othelloKnown)'),'puzzle discovery still uses the same three corners and colors');
});
