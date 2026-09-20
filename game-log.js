// Saved history keeps every display event; text is never used as an identity.
const GameLog=(()=>{
 const types=new Set(["dialogue","investigation","narration"]);
 const kinds=new Set(["player","heroine","character","narration","system"]);
 let entries=[];
 const kindOf=line=>line.speaker==="主人公"||line.thought?"player":line.speaker==="ハナ"?"heroine":line.speaker==="ト書き"?"narration":line.logType==="dialogue"?"character":"system";
 function entryFor(line){
  const entry={id:line.logId,text:line.text,type:types.has(line.logType)?line.logType:line.thought||["ト書き","システム"].includes(line.speaker)?"narration":"dialogue",speaker:line.speaker||"",thought:!!line.thought,kind:kinds.has(line.logKind)?line.logKind:kindOf(line)};
  if(typeof line.logColor==="string"&&/^#[0-9a-f]{6}$/i.test(line.logColor))entry.color=line.logColor;
  return entry;
 }
 function record(line){
  const entry=entryFor(line);
  if(typeof entry.id!=="string"||!entry.id||typeof entry.text!=="string"||!entry.text)return false;
  entries.push({...entry,order:entries.length});
  return true;
 }
 function restore(saved){
  entries=[];
  if(!Array.isArray(saved))return;
  // Array order is canonical. Preserve repeated IDs and normalize optional/malformed fields from older saves.
  for(const entry of saved){
   if(!entry||typeof entry!=="object")continue;
   record({logId:entry.id,text:entry.text,logType:entry.type,speaker:typeof entry.speaker==="string"?entry.speaker:"",thought:entry.thought===true,logKind:entry.kind,logColor:entry.color});
  }
 }
 return {record,restore,entryFor,list:()=>entries.map(entry=>({...entry}))};
})();
