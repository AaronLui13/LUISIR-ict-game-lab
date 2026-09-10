export const LIGHTS = [
  {name:'紅燈',pin:8,color:'#e2574c',guide:{anode:'a8',cathode:'a10',r1:'e4',r2:'e8',signal:'a4',back:'e10',join:'j2'}},
  {name:'綠燈',pin:9,color:'#319b76',guide:{anode:'a16',cathode:'a18',r1:'e12',r2:'e16',signal:'a12',back:'e18',join:'i2'}},
  {name:'黃燈',pin:10,color:'#d69a23',guide:{anode:'a24',cathode:'a26',r1:'e20',r2:'e24',signal:'a20',back:'e26',join:'h2'}},
];
export const PARTS = [['anode','LED 長腳 ＋'],['cathode','LED 短腳 −'],['r1','電阻第 1 端'],['r2','電阻第 2 端'],['signal','訊號線'],['back','回路線：LED 端'],['join','回路線：共同接地端']];
export function emptyCircuit(){return {ground:'',lights:LIGHTS.map(x=>({holes:Object.fromEntries(PARTS.map(([k])=>[k,''])),pin:x.pin}))};}
export function net(hole){const m=/^([a-j])([1-9]|1[0-9]|2[0-6])$/.exec(hole);return m?`${m[1]<'f'?'L':'R'}${m[2]}`:null;}
export function occupied(wiring,hole,channel,key){
 if(wiring.ground===hole && key!=='ground')return true;
 return wiring.lights.some((light,i)=>Object.entries(light.holes).some(([k,v])=>v===hole && !(i===channel&&k===key)));
}
export function checkCircuit(wiring,count){
 const parent=new Map();
 function root(x){if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,root(parent.get(x)));return parent.get(x);}
 function union(a,b){if(a&&b)parent.set(root(a),root(b));}
 const ground=net(wiring.ground);
 for(const light of wiring.lights.slice(0,count))union(net(light.holes.back),net(light.holes.join));
 const n=h=>{const a=net(h);return a?root(a):null;};
 const g=ground?root(ground):null;
 const lights=wiring.lights.slice(0,count).map(light=>({pin:light.pin,...Object.fromEntries(Object.entries(light.holes).map(([k,v])=>[k,n(v)]))}));
 const safety=[];
 lights.forEach((h,i)=>{
  if(h.signal&&g&&h.signal===g)safety.push(`${LIGHTS[i].name}的輸出直接接到 GND，不能通電。`);
  if(h.signal&&h.anode&&h.signal===h.anode&&g&&h.cathode===g)safety.push(`${LIGHTS[i].name}的 LED 沒有串聯限流電阻，不能通電。`);
  for(let j=0;j<i;j++)if(h.signal&&h.signal===lights[j].signal)safety.push('兩個數位輸出腳位互相短接，請分開訊號線。');
 });
 const results=lights.map((h,i)=>{
  if(!g||Object.values(wiring.lights[i].holes).some(x=>!net(x)))return {ok:false,text:`${LIGHTS[i].name}仍有未接端點，或 Uno GND 尚未接好。`};
  if(h.pin!==LIGHTS[i].pin)return {ok:false,text:`${LIGHTS[i].name}應使用 D${LIGHTS[i].pin}，目前使用 D${h.pin}。`};
  if(h.anode===h.cathode)return {ok:false,text:`${LIGHTS[i].name}長短腳相通，兩端沒有電位差。`};
  if(h.r1===h.r2)return {ok:false,text:`${LIGHTS[i].name}電阻兩端相通，電阻被繞過。`};
  if(h.cathode!==g)return {ok:false,text:`${LIGHTS[i].name}短腳未經回路線接回 Uno GND。`};
  const series=(h.signal===h.r1&&h.r2===h.anode)||(h.signal===h.r2&&h.r1===h.anode);
  if(!series||h.anode===g||h.signal===g)return {ok:false,text:`${LIGHTS[i].name}未形成 D${LIGHTS[i].pin} → 電阻 → LED 長腳／短腳 → GND。`};
  return {ok:true,text:`${LIGHTS[i].name}電路正確。`};
 });
 return {safe:safety.length===0,ok:safety.length===0&&results.every(x=>x.ok),safety,results};
}
export const write=(pin,level)=>({type:'write',pin,level});
export const delay=ms=>({type:'delay',ms});
export function stage(pin,ms){return [...[8,9,10].map(p=>write(p,p===pin?'HIGH':'LOW')),delay(ms)];}
export const PREDICTION=[...stage(8,2000),...stage(10,1000),...stage(9,4000)];
export const ORIGINAL=[...stage(8,3000),...stage(9,3000),...stage(10,1000)];
export const BROKEN=[...stage(8,3000),{type:'missing'},write(9,'HIGH'),write(10,'LOW'),delay(3000),...stage(10,1000)];
export function trace(program,initial=[false,false,false]){
 let state=[...initial],elapsed=0;
 return program.map((instruction,index)=>{
  if(instruction.type==='write'&&[8,9,10].includes(instruction.pin))state[instruction.pin-8]=instruction.level==='HIGH';
  const duration=instruction.type==='delay'?instruction.ms:0;
  const frame={index,state:[...state],elapsed,duration};elapsed+=duration;return frame;
 });
}
export function stableStages(program){return trace(program).filter(x=>x.duration>0);}
export function predictionCorrect(answers,program=PREDICTION){const stages=stableStages(program);return answers.length===stages.length&&answers.every((a,i)=>a.states.every((v,j)=>v===Number(stages[i].state[j]))&&Number(a.seconds)===stages[i].duration/1000);}
export function timingCorrect(program,seconds){const s=stableStages(program);return s.length===3&&s.every((f,i)=>f.duration===[5000,3000,1000][i]&&f.state.every((v,j)=>v===(j===i)))&&Number(seconds)===9;}
export function repairCorrect(program){const s=stableStages(program);return s.length===3&&s.every((f,i)=>f.state.every((v,j)=>v===(j===i))&&f.duration===[3000,3000,1000][i]);}
export function instructionText(i){return i.type==='write'?`digitalWrite(${i.pin}, ${i.level});`:i.type==='delay'?`delay(${i.ms});`:'// 缺少指令：這一行沒有改變任何燈';}
// An incomplete neighbouring branch does not prevent a valid LED from responding.
export function testOutput(wiring,count,code,previous){
 const checks=checkCircuit(wiring,count);
 if(!checks.safe)return previous.map(()=>false);
 return previous.map((value,i)=>{
  if(i>=count||!checks.results[i]?.ok)return false;
  return wiring.lights[i].pin===Number(code.writePin)&&Number(code.modePin)===Number(code.writePin)?code.level==='HIGH':value;
 });
}
export function pairedEnd(part){return ({anode:'cathode',r1:'r2',back:'join'})[part]||null;}
