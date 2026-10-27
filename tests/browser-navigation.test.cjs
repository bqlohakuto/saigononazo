"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"..","browser-navigation.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");

function makePage({title=false,alreadyProtected=false}={}) {
  const listeners=new Map();
  const pushed=[];
  const previousState=alreadyProtected?{__saigononazoBackGuard:true,other:"original"}:{other:"original"};
  let currentState=previousState,backs=0,saves=0,overlay=null;
  let activeElement={isConnected:true,focus(){}};

  function makeButton() {
    const events=new Map();
    return {
      isConnected:true,
      focus(){activeElement=this;},
      addEventListener(type,listener){events.set(type,listener)},
      click(){events.get("click")?.()}
    };
  }
  const continueButton=makeButton(),leaveButton=makeButton();
  const game={
    children:[],
    appendChild(node){this.children.push(node);node.isConnected=true;overlay=node},
    querySelector(query){return query===".title-screen"&&title?{}:null}
  };
  const document={
    get activeElement(){return activeElement;},
    getElementById(id){return id==="game"?game:null;},
    createElement(name) {
      assert.equal(name,"div");
      return {
        className:"",innerHTML:"",isConnected:false,
        remove(){this.isConnected=false;overlay=null},
        querySelector(selector){
          if(selector==='[data-back-action="continue"]')return continueButton;
          if(selector==='[data-back-action="leave"]')return leaveButton;
          return null;
        },
        querySelectorAll(selector){return selector==="button"?[continueButton,leaveButton]:[]}
      };
    }
  };
  const history={
    get state(){return currentState;},
    pushState(state,_title,url){currentState=state;pushed.push({state,url})},
    back(){backs++}
  };
  const window={
    history,location:{href:"https://example.com/saigononazo/?preview=1"},
    addEventListener(type,listener){listeners.set(type,listener)},
    removeEventListener(type,listener){if(listeners.get(type)===listener)listeners.delete(type)},
    saveGame(){saves++}
  };
  vm.runInNewContext(source,{window,document});
  const popstate=state=>{currentState=state;listeners.get("popstate")?.({state})};
  const keyboard=key=>{
    let prevented=0,stopped=0;
    listeners.get("keydown")?.({
      key,shiftKey:false,
      preventDefault(){prevented++},
      stopImmediatePropagation(){stopped++}
    });
    return {prevented,stopped};
  };
  return {
    game,history,pushed,window,document,continueButton,leaveButton,popstate,keyboard,
    get overlay(){return overlay;},
    get saves(){return saves;},
    get backs(){return backs;}
  };
}

test("A02: installs one history guard without changing the URL or existing history data",()=>{
  const page=makePage();
  assert.equal(page.pushed.length,1);
  assert.equal(page.pushed[0].url,"https://example.com/saigononazo/?preview=1");
  assert.equal(page.history.state.other,"original");
  assert.equal(page.history.state.__saigononazoBackGuard,true);
  assert.match(html,/browser-navigation[.]js[?]v=\\d{8}-[a-z0-9-]+/);
  assert.match(html,/browser-navigation[.]css[?]v=\\d{8}-[a-z0-9-]+/);
});

test("A02: reloading the already-protected history entry adds no extra Back step",()=>{
  assert.equal(makePage({alreadyProtected:true}).pushed.length,0);
});

test("A02: accidental Back during gameplay preserves game UI and offers an explicit choice",()=>{
  const page=makePage();
  page.popstate({other:"original"});
  assert.equal(page.saves,1,"Back requests a save before showing a choice");
  assert.equal(page.pushed.length,1,"Back does not immediately create another history entry");
  assert.equal(page.game.children.length,1);
  assert.match(page.overlay.innerHTML,/ゲームを続ける/);
  assert.match(page.overlay.innerHTML,/前のページへ戻る/);
  page.continueButton.click();
  assert.equal(page.pushed.length,2,"Continue restores one guard entry");
  assert.equal(page.backs,0);
  assert.equal(page.overlay,null);
  assert.equal(page.game.children.length,1,"The game scene was not cleared or reloaded");
});

test("A02: selecting Leave navigates back deliberately without trapping the user",()=>{
  const page=makePage();
  page.popstate(null);
  page.leaveButton.click();
  assert.equal(page.backs,1);
  assert.equal(page.pushed.length,1,"Leave must not silently reinsert protection");
  assert.equal(page.overlay,null);
});

test("A02: browser Back on the title screen leaves normally",()=>{
  const page=makePage({title:true});
  page.popstate(null);
  assert.equal(page.backs,1);
  assert.equal(page.saves,0);
  assert.equal(page.overlay,null);
});

test("A02: Escape continues playing; browser Forward dismisses a stale Back prompt",()=>{
  const page=makePage();
  page.popstate(null);
  const result=page.keyboard("Escape");
  assert.equal(result.prevented,1);
  assert.equal(result.stopped,1);
  assert.equal(page.pushed.length,2);
  assert.equal(page.overlay,null);

  page.popstate(null);
  assert(page.overlay);
  page.popstate({__saigononazoBackGuard:true});
  assert.equal(page.overlay,null,"Forward clears a stale confirmation");
  assert.equal(page.pushed.length,2,"Forward must not add another entry");
});
