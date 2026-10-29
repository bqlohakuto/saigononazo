const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadSaveData() {
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const startMarker = "// SAVE_DATA_START";
  const endMarker = "// SAVE_DATA_END";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, "SAVE_DATA_START marker must exist");
  assert.notEqual(end, -1, "SAVE_DATA_END marker must exist");
  const block = source.slice(start + startMarker.length, end);
  return vm.runInNewContext(`${block}\nSaveData;`);
}

test("new room01 saves use v2 canonical fields while keeping temporary legacy aliases", () => {
  const SaveData = loadSaveData();
  const saved = SaveData.create({
    playerName: "白兎",
    currentScene: "room01",
    openingIndex: 12,
    rooms: { room01: { doorInspected: true, openedInbox: ["inbox-1"] } },
    logs: [{ id: "a", text: "A" }]
  });

  assert.equal(saved.saveVersion, 2);
  assert.equal(saved.currentScene, "room01");
  assert.equal(saved.opening.index, 12);
  assert.equal(saved.rooms.room01.doorInspected, true);
  assert.deepEqual(saved.rooms.room01.openedInbox, ["inbox-1"]);
  assert.equal(saved.scene, "firstRoom");
  assert.deepEqual(saved.state, saved.rooms.room01);
});

test("legacy firstRoom saves migrate into rooms.room01 without losing logs or state", () => {
  const SaveData = loadSaveData();
  const legacy = {
    playerName: "テスト",
    scene: "firstRoom",
    state: { viewedWall: "left", openedInbox: ["inbox-1"], doorUnlocked: true },
    logs: [{ id: "same" }, { id: "same" }]
  };
  const saved = SaveData.normalize(legacy);

  assert.equal(saved.saveVersion, 2);
  assert.equal(saved.currentScene, "room01");
  assert.equal(saved.rooms.room01.viewedWall, "left");
  assert.deepEqual(saved.rooms.room01.openedInbox, ["inbox-1"]);
  assert.equal(saved.rooms.room01.doorUnlocked, true);
  assert.equal(saved.logs.length, 2);
});

test("legacy opening saves migrate their opening index and keep an empty room map", () => {
  const SaveData = loadSaveData();
  const saved = SaveData.normalize({
    playerName: "テスト",
    scene: "opening",
    openingIndex: 9,
    logs: [{ id: "opening-1" }]
  });

  assert.equal(saved.currentScene, "opening");
  assert.equal(saved.opening.index, 9);
  assert.deepEqual(Object.keys(saved.rooms), []);
  assert.equal(saved.logs.length, 1);
});

test("v2 normalization preserves room states and compatible legacy aliases", () => {
  const SaveData = loadSaveData();
  const saved = SaveData.normalize({
    saveVersion: 2,
    playerName: "白兎",
    currentScene: "room02",
    opening: { index: 4 },
    rooms: {
      room01: { doorUnlocked: true },
      room02: { puzzleStep: 3 }
    },
    logs: []
  });

  assert.equal(saved.currentScene, "room02");
  assert.equal(saved.rooms.room01.doorUnlocked, true);
  assert.equal(saved.rooms.room02.puzzleStep, 3);

  const rewritten = SaveData.create(saved);
  assert.equal(rewritten.currentScene, "room02");
  assert.equal(rewritten.rooms.room02.puzzleStep, 3);
  assert.equal(rewritten.scene, "room2");
  assert.equal(rewritten.state.puzzleStep, 3);
});

test("malformed or unknown legacy saves are rejected safely", () => {
  const SaveData = loadSaveData();
  assert.equal(SaveData.normalize(null), null);
  assert.equal(SaveData.normalize([]), null);
  assert.equal(SaveData.normalize({ scene: "missing" }), null);
  assert.equal(SaveData.normalize({ saveVersion: 2, currentScene: "" }), null);
});


test("H01: slot loading clears all stale live room states before restored scene autosaves", () => {
  // Use the real resumeGame() rather than a duplicate of its clearing rules.
  const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const start = script.indexOf("function resumeGame(){");
  const end = script.indexOf("function showSettings(){", start);
  assert.ok(start>=0 && end>start, "The live resume entry point exists");
  const resumeSource = script.slice(start,end);
  const roomIds = Array.from({length:8}, (_,i)=>"room"+String(i+1).padStart(2,"0"));
  const sceneNames = ["opening", ...roomIds];
  for (const scene of sceneNames) {
    const targetRooms = {room01:{checkpoint:"slot B room 1"},[scene]:{checkpoint:"slot B target"}};
    const target = {
      playerName:"別のセーブ",currentScene:scene,opening:{index:7},rooms:targetRooms,
      logs:[{id:"slot-b-log",text:"Restored log"}]
    };
    const staleState = Object.fromEntries(roomIds.map(id=>[id,{checkpoint:"slot A "+id}]));
    const context = {
      firstRoomState:staleState.room01,room2State:staleState.room02,
      room3State:staleState.room03,room4State:staleState.room04,
      room5State:staleState.room05,room6State:staleState.room06,
      room7State:staleState.room07,room8State:staleState.room08,
      roomStates:{...staleState},playerName:"前のセーブ",openingIndex:100,currentScene:"room08",
      readSavedGame:()=>target,GameAudio:{stopAll(){}},
      GameLog:{restore(value){context.restoredLogs=value}},
      showTitle(){throw Error("The slot should load")},
      loaded:null
    };
    function render(room,state){
      context.loaded={room,state};
      // Every room saves a checkpoint during its entry or first dialogue;
      // still-live states from the prior slot must not overwrite it.
      for(const [id,key] of roomIds.map((id,i)=>[id,i===0?"firstRoomState":"room"+(i+1)+"State"])){
        if(context[key]!==undefined)context.roomStates[id]=context[key];
      }
    }
    for (const id of roomIds) {
      const n=Number(id.slice(-2));
      const words=["","First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth"];
      context["show"+words[n]+"Room"]=state=>render(id,state);
    }
    context.showOpening=index=>render("opening",index);
    vm.runInNewContext(resumeSource+"\nresumeGame();",context);
    assert.equal(context.playerName,target.playerName,scene+": the selected player's name loads");
    assert.equal(context.currentScene,scene,scene+": the selected scene loads");
    assert.equal(context.openingIndex,7,scene+": the title progress loads");
    assert.equal(context.loaded.room,scene,scene+": the correct scene renderer is invoked");
    assert.equal(context.loaded.state===targetRooms[scene] || (scene==="opening"&&context.loaded.state===7),true,scene+": the checkpoint is supplied");
    assert.deepEqual(JSON.parse(JSON.stringify(context.roomStates)),targetRooms,scene+": stale room progress is never mixed into another slot");
    assert.deepEqual(context.restoredLogs,target.logs,scene+": log history comes from the selected slot");
  }
});
