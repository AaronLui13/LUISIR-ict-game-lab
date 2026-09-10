'use client';
import { useState } from 'react';
import { Breadboard } from './Breadboard';
import type { Selection } from './Breadboard';
import { Teaching } from './Teaching';
import { Lamps,ProgramPlayer } from './ProgramPlayer';
import { BROKEN,testOutput,pairedEnd,checkCircuit,emptyCircuit,instructionText,LIGHTS,occupied,ORIGINAL,PARTS,PREDICTION,predictionCorrect,repairCorrect,stableStages,timingCorrect,write } from './game-data.mjs';
import type { Answer,Instruction } from './game-data.mjs';
const BASE=process.env.NEXT_PUBLIC_BASE_PATH??'';
type Phase='teaching'|'mode'|'wiring'|'predict'|'timing'|'repair'|'done';
const blankAnswers=():Answer[]=>Array.from({length:3},()=>({states:[-1,-1,-1],seconds:''}));
export function ThreeLightLab(){
 const [phase,setPhase]=useState<Phase>('teaching');
 const [mode,setMode]=useState<'practice'|'challenge'>('practice');
 const [reviewTeaching,setReviewTeaching]=useState(false);
 const [guide,setGuide]=useState(false),[hintCount,setHintCount]=useState(0);
 const [message,setMessage]=useState('先看兩段短教學，了解共同接地和程式次序；也可以跳過。');
 const [wiring,setWiring]=useState(emptyCircuit),[count,setCount]=useState(1),[channel,setChannel]=useState(0);
 const [selection,setSelection]=useState<Selection>(null),[power,setPower]=useState(false);
 const [highSeen,setHighSeen]=useState([false,false,false]),[tested,setTested]=useState([false,false,false]);
 const [testCode,setTestCode]=useState({modePin:'8',writePin:'8',level:'HIGH'}),[output,setOutput]=useState([false,false,false]);
 const [answers,setAnswers]=useState(blankAnswers),[originalAnswers,setOriginalAnswers]=useState<Answer[]|null>(null),[observed,setObserved]=useState(false),[predictionPassed,setPredictionPassed]=useState(false);
 const [timingVersion,setTimingVersion]=useState(0),[repairVersion,setRepairVersion]=useState(0);
 const [timing,setTiming]=useState<Instruction[]>(()=>structuredClone(ORIGINAL)),[cycle,setCycle]=useState(''),[timingRun,setTimingRun]=useState<Instruction[]|null>(null),[timingPassed,setTimingPassed]=useState(false);
 const [repair,setRepair]=useState<Instruction[]>(()=>structuredClone(BROKEN)),[repairRun,setRepairRun]=useState<Instruction[]|null>(null),[repairPassed,setRepairPassed]=useState(false);
 const checks=checkCircuit(wiring,count);
 function hint(){
  if(mode==='challenge')setMode('practice');
  setGuide(true);setHintCount(hintCount+1);
  const help={wiring:'已開啟逐步指定孔位。每次只突出目前要接的一孔，按「下一步」完成接線。',predict:'逐行記住三顆燈的最後狀態。在 delay 那一行記錄燈號，毫秒除以 1000 就是秒。',timing:'紅燈階段的 delay 改為 5000，另兩段保持 3000 和 1000。完整循環把三段秒數相加。',repair:'第二階段沒有把紅燈 D8 關掉。在空白行補上 digitalWrite(8, LOW);。'};
  setMessage(`已使用練習模式，進度保留。${help[phase as keyof typeof help]||'可重看教學。'}`);
 }
 function choose(s:Selection){if(s&&s.part!=='ground')setChannel(s.channel);setSelection(s);setMessage(s?.part==='ground'?'已選 Uno GND。點麵包板共同接地組的一個空孔。':`已選${LIGHTS[s?.channel??0].name}的${PARTS.find(([k])=>k===s?.part)?.[1]}。現在點麵包板孔位。`);}
 function place(hole:string){
  if(power){setMessage('先拔 USB，才能改線。');return;}
  if(!selection){setMessage('先選元件的一腳，或點 Uno 腳位，再點麵包板孔位。');return;}
  const {channel:c,part}=selection;
  if(occupied(wiring,hole,c,part)){setMessage(`${hole} 已有線頭。每孔只插一個線頭，請選另一個空孔。`);return;}
  const next=structuredClone(wiring);
  if(part==='ground')next.ground=hole;else next.lights[c].holes[part]=hole;
  if(JSON.stringify(next)===JSON.stringify(wiring)){setSelection(null);setMessage('接線位置沒有改變，已完成的測試保留。');return;}
  const nextChecks=checkCircuit(next,count);
  setWiring(next);const nextEnd=pairedEnd(part);setSelection(nextEnd?{channel:c,part:nextEnd}:null);
  setHighSeen(highSeen.map((x,i)=>x&&part!=='ground'&&i!==c&&!!nextChecks.results[i]?.ok));
  setTested(tested.map((x,i)=>x&&part!=='ground'&&i!==c&&!!nextChecks.results[i]?.ok));
  const detail=nextChecks.results[channel];
  setMessage(!nextChecks.safe?`⚠ ${nextChecks.safety[0]}`:detail?.ok?'電路已接通。接上 USB，測試這顆燈的 HIGH 及 LOW。':mode==='practice'&&Object.values(next.lights[c].holes).every(Boolean)?detail.text:`已接到 ${hole}。${nextEnd?`同一件元件尚有另一端，請按下方步驟接好。`:`請按下方「下一步」繼續。`}`);
 }
 function pin(p:number){
  const next=structuredClone(wiring);next.lights[channel].pin=p;setWiring(next);setSelection({channel,part:'signal'});
  setTested(tested.map((v,i)=>i===channel?false:v));setHighSeen(highSeen.map((v,i)=>i===channel?false:v));
  setMessage(`已從 Uno D${p} 選取訊號線。點麵包板孔位。${p!==LIGHTS[channel].pin&&mode==='practice'?` 本課${LIGHTS[channel].name}使用 D${LIGHTS[channel].pin}。`:''}`);
 }
 function togglePower(){if(!power&&!checks.safe){setMessage(`通電已攔截：${checks.safety[0]}`);return;}setPower(!power);if(power)setOutput([false,false,false]);setMessage(power?'USB 已拔除。可以改線；接回後請重新上傳測試。':'USB 已連接。測試程式已設 OUTPUT，請核對兩個腳位並上傳 HIGH，再上傳 LOW。');}
 function testUpload(){
  if(!power){setMessage('上傳失敗：請先連接 USB。');return;}
  const uploadedOutput=testOutput(wiring,count,testCode,output);setOutput(uploadedOutput);
  if(!checks.safe||!checks.results[channel]?.ok){setMessage(mode==='practice'?`程式已上傳；${checks.safety[0]||checks.results[channel]?.text||'電路未接好。'} LED 未能亮起，拔 USB 後修正再試。`:'程式已上傳，但這顆 LED 電路未通過測試。拔 USB 後檢查並重試。');return;}
  const pin=LIGHTS[channel].pin;
  if(Number(testCode.modePin)!==pin||Number(testCode.writePin)!==pin){setMessage(`程式已上傳；這次沒有正確控制${LIGHTS[channel].name}。核對 pinMode 與 digitalWrite 兩個腳位。`);return;}
  const isHigh=uploadedOutput[channel];
  if(isHigh){setHighSeen(highSeen.map((v,i)=>i===channel?true:v));setMessage(`${LIGHTS[channel].name}亮起。把 HIGH 改成 LOW，再上傳測試熄滅。`);}
  else if(highSeen[channel]){setTested(tested.map((v,i)=>i===channel?true:v));setMessage(`${LIGHTS[channel].name}亮滅測試通過！${count<3?'拔除 USB 後，加入下一顆燈。':'三顆都測試後，前往程式預測。'}`);}
  else setMessage('LED 熄滅。先上傳 HIGH 確認它真的能亮，再測 LOW。');
 }
 function start(m:'practice'|'challenge'){setMode(m);setGuide(m==='practice');setPhase('wiring');setMessage('從紅燈開始。先點元件的一腳，再點麵包板；接好後測試亮滅。需要時可開指定孔位。');}
 function submitPrediction(){
  if(answers.some(a=>a.states.includes(-1)||a.seconds==='')){setMessage('請先填妥三個階段的三顆燈狀態及維持秒數。');return;}
  if(!originalAnswers){setOriginalAnswers(structuredClone(answers));setMessage('預測已保留。播放或逐行執行，對照你的答案，再修正。');return;}
  if(!observed){setMessage('先完成逐行觀察，或播放到最後，再核對修正答案。');return;}
  const ok=predictionCorrect(answers);setPredictionPassed(ok);setMessage(ok?'預測與實際結果一致！前往修改時間。':'仍有差異。對照每一段 delay 的燈號與時間，再修正答案。');
 }
 function updateInstruction(target:'timing'|'repair',index:number,next:Instruction){if(target==='timing'){setTiming(timing.map((x,i)=>i===index?next:x));setTimingPassed(false);}else{setRepair(repair.map((x,i)=>i===index?next:x));setRepairPassed(false);}}
 function editor(program:Instruction[],target:'timing'|'repair'){
  return <ol className="tl-code tl-editor">{program.map((instruction,i)=><li key={i}><span>{i+1}</span>{instruction.type==='missing'?<label>補回指令 <select aria-label={`第 ${i+1} 行補回指令`} value="" onChange={e=>{if(e.target.value)updateInstruction(target,i,write(Number(e.target.value),'HIGH'));}}><option value="">尚未加入</option>{[8,9,10].map(p=><option key={p} value={p}>digitalWrite({p}, …)</option>)}</select></label>:instruction.type==='delay'?<label><code>delay(</code><select aria-label={`第 ${i+1} 行等待毫秒`} value={instruction.ms} onChange={e=>updateInstruction(target,i,{type:'delay',ms:Number(e.target.value)})}>{[500,1000,2000,3000,4000,5000].map(v=><option key={v} value={v}>{v}</option>)}</select><code>);</code></label>:<label><code>digitalWrite(</code><select aria-label={`第 ${i+1} 行腳位`} value={instruction.pin} onChange={e=>updateInstruction(target,i,{...instruction,pin:Number(e.target.value)})}>{[8,9,10].map(p=><option key={p}>{p}</option>)}</select><code>, </code><select aria-label={`第 ${i+1} 行電平`} value={instruction.level} onChange={e=>updateInstruction(target,i,{...instruction,level:e.target.value})}><option>HIGH</option><option>LOW</option></select><code>);</code></label>}</li>)}</ol>;
 }
 function resultTable(program:Instruction[]){return <div className="tl-results">{stableStages(program).map((f,i)=><div key={i}><b>階段 {i+1}</b><span>{LIGHTS.filter((_,j)=>f.state[j]).map(l=>l.name).join('＋')||'全部熄滅'}</span><strong>{f.duration/1000} 秒</strong></div>)}</div>;}
 return <main className="tl-lab"><nav><a href={`${BASE}/`}>← LUI SIR’S ICT GAME LAB</a><span>UNIT 02 · SEQUENCE & TIMING</span></nav><header><div><p className="tl-eyebrow">接線 → 觀察 → 改程式</p><h1>三色燈<span>實驗室</span></h1></div><div className="tl-progress">{({teaching:'先學方法',mode:'選擇模式',wiring:'01 接線測試',predict:'02 預測燈號',timing:'03 修改時間',repair:'04 修復程式',done:'任務完成'})[phase]}{!['teaching','mode'].includes(phase)&&<small>{mode==='practice'?'練習模式':'自我挑戰'} · 無倒數</small>}</div></header>
 <section className="tl-feedback"><div><b>現在這樣做</b><p role="status" aria-live="polite">{message}</p></div>{!['teaching','mode','done'].includes(phase)&&<div className="tl-feedback-actions"><button onClick={hint}>{mode==='challenge'?'我需要提示':'開啟提示'}</button><button className="tl-text-button" onClick={()=>setReviewTeaching(!reviewTeaching)}>重看教學</button></div>}</section>
 {reviewTeaching&&<Teaching review finish={()=>setReviewTeaching(false)}/>}
 {phase==='teaching'&&<Teaching finish={()=>{setPhase('mode');setMessage('現在選擇適合你的模式。挑戰中途也可轉練習，接線及答案會保留。');}}/>}
 {phase==='mode'&&<section className="tl-modes"><button onClick={()=>start('practice')}><span>01 / 跟自己的步伐</span><h2>我要練習</h2><p>需要時開啟指定孔位、操作提示。完成全部任務便過關。</p><b>開始練習 →</b></button><button onClick={()=>start('challenge')}><span>02 / 檢查自己是否懂</span><h2>我要挑戰</h2><p>自行接線、預測及修復程式。卡住可隨時轉到練習模式。</p><b>開始挑戰 →</b></button></section>}
 {phase==='wiring'&&<section className="tl-card"><div className="tl-section-title"><h2>逐顆加入，每顆都先測試。</h2><span>{count} / 3 顆燈</span></div><div className="tl-channels">{LIGHTS.slice(0,count).map((l,i)=><button key={l.pin} aria-pressed={channel===i} onClick={()=>{setChannel(i);setSelection(null);setMessage(`正在編輯${l.name}。${tested[i]?'已完成亮滅測試。':checks.results[i]?.ok?'電路已接通，請測試 HIGH → LOW。':'請按下方接線步驟繼續。'}`);}}>{l.name} D{l.pin} {tested[i]?'✓':''}</button>)}{guide&&<button className="tl-text-button" onClick={()=>setGuide(false)}>隱藏指定孔位</button>}</div>
 <Breadboard wiring={wiring} count={count} channel={channel} selection={selection} hints={guide} powered={power} output={output} choose={choose} pin={pin} place={place}/>
 <div className="tl-test-panel"><div><h3>測試{LIGHTS[channel].name}：先亮，再滅</h3><p>本課已準備 Uno 上傳環境；兩個腳位都要對應這顆燈。</p><button onClick={togglePower}>{power?'拔除 USB':'連接 USB：電腦 ↔ Uno'}</button></div><div className="tl-test-code"><code>pinMode(</code><select aria-label="測試 pinMode 腳位" value={testCode.modePin} onChange={e=>setTestCode({...testCode,modePin:e.target.value})}>{[8,9,10].map(p=><option key={p}>{p}</option>)}</select><code>, OUTPUT);</code><br/><code>digitalWrite(</code><select aria-label="測試 digitalWrite 腳位" value={testCode.writePin} onChange={e=>setTestCode({...testCode,writePin:e.target.value})}>{[8,9,10].map(p=><option key={p}>{p}</option>)}</select><code>, </code><select aria-label="測試電平" value={testCode.level} onChange={e=>setTestCode({...testCode,level:e.target.value})}><option>HIGH</option><option>LOW</option></select><code>);</code><button onClick={testUpload}>→ 上傳測試程式</button></div><Lamps state={output}/></div>
 <div className="tl-next">{tested.slice(0,count).every(Boolean)?count<3?<button className="tl-primary" disabled={power} onClick={()=>{setCount(count+1);setChannel(count);setSelection(null);setMessage(`現在加入${LIGHTS[count].name}。每顆有自己的電阻，回路接到同一組共同接地孔。`);}}>加入{LIGHTS[count].name} →</button>:<button className="tl-primary" onClick={()=>{setPower(false);setOutput([false,false,false]);setPhase('predict');setMessage('三顆燈都能亮滅。先閱讀這段未示範過的程式，預測每個 delay 期間的燈號和時間。');}}>三顆測試完成，預測燈號 →</button>:<span>完成已加入各燈的 HIGH → LOW 測試，便可繼續。</span>}{power&&count<3&&tested.slice(0,count).every(Boolean)&&<span>先拔 USB，再加入下一顆。</span>}</div></section>}
 {phase==='predict'&&<section className="tl-card"><div className="tl-section-title"><h2>先預測，再看程式實際做了甚麼。</h2><span>setup 已設三腳 OUTPUT · 初始全滅 · 以下為 loop 內容</span></div>{!originalAnswers?<ol className="tl-code">{PREDICTION.map((i,n)=><li key={n}><span>{n+1}</span><code>{instructionText(i)}</code></li>)}</ol>:<ProgramPlayer program={PREDICTION} onComplete={()=>setObserved(true)}/>}
 <div className="tl-answer-scroll"><table><caption>{originalAnswers?'保留第一次預測；下方可修正答案':'在每個 delay 期間，哪些燈亮著？'}</caption><thead><tr><th>階段</th>{LIGHTS.map(l=><th key={l.pin}>{l.name}</th>)}<th>維持秒數</th></tr></thead><tbody>{answers.map((a,i)=><tr key={i}><th>{i+1}</th>{a.states.map((v,j)=><td key={j}><select aria-label={`階段 ${i+1} ${LIGHTS[j].name}預測`} value={v} onChange={e=>{setAnswers(answers.map((x,k)=>k===i?{...x,states:x.states.map((y,l)=>l===j?Number(e.target.value):y)}:x));setPredictionPassed(false);}}><option value={-1}>選擇</option><option value={1}>亮</option><option value={0}>滅</option></select>{originalAnswers&&<small>原估：{originalAnswers[i].states[j]===1?'亮':'滅'}</small>}</td>)}<td><input aria-label={`階段 ${i+1} 預測秒數`} inputMode="decimal" value={a.seconds} onChange={e=>{setAnswers(answers.map((x,k)=>k===i?{...x,seconds:e.target.value}:x));setPredictionPassed(false);}}/>{originalAnswers&&<small>原估：{originalAnswers[i].seconds} 秒</small>}</td></tr>)}</tbody></table></div>{observed&&<><h3>這次觀察到的穩定階段</h3>{resultTable(PREDICTION)}</>}
 <div className="tl-next"><button onClick={submitPrediction}>{originalAnswers?'核對修正答案':'保留預測，開始觀察'}</button>{predictionPassed&&<button className="tl-primary" onClick={()=>{setPhase('timing');setMessage('改回工作紙紅 → 綠 → 黃次序。只把紅燈改成 5 秒，綠 3 秒、黃 1 秒；每段只亮一顆。');}}>前往修改時間 →</button>}</div></section>}
 {phase==='timing'&&<section className="tl-card"><h2>紅燈 5 秒 · 綠燈 3 秒 · 黃燈 1 秒</h2><p>只改紅燈等待時間，保持紅 → 綠 → 黃次序。原程式為 3、3、1 秒。</p>{editor(timing,'timing')}<label className="tl-cycle">一個完整循環 = <input aria-label="完整循環秒數" value={cycle} inputMode="decimal" onChange={e=>{setCycle(e.target.value);setTimingPassed(false);}}/> 秒</label><div className="tl-next"><button onClick={()=>{setTimingVersion(timingVersion+1);setTimingRun(structuredClone(timing));setTimingPassed(false);setMessage('已上傳這一版程式。觀察到最後，核對燈號與等待時間。');}}>上傳並觀察</button>{timingPassed&&<button className="tl-primary" onClick={()=>{setPhase('repair');setMessage('這段程式漏了一行。先運行看看兩燈同亮，再補回或修改指令。');}}>時間正確，前往排錯 →</button>}</div>{timingRun&&<><ProgramPlayer autoStart key={timingVersion} program={timingRun} onComplete={()=>{const ok=timingCorrect(timingRun,cycle)&&JSON.stringify(timingRun)===JSON.stringify(timing);setTimingPassed(ok);setMessage(ok?'時間與燈號都正確：5 + 3 + 1 = 9 秒。':'這次結果未符合目標，或修改後尚未重新上傳。檢查每段燈號、等待時間及循環秒數，再試。');}}/>{resultTable(timingRun)}</>}</section>}
 {phase==='repair'&&<section className="tl-card"><h2>找出程式中的燈號問題。</h2><p>目標：紅 3 秒 → 綠 3 秒 → 黃 1 秒，每段只亮一顆。空白行不會改變任何腳位；上一個狀態會保留。</p>{editor(repair,'repair')}<div className="tl-next"><button onClick={()=>{setRepairVersion(repairVersion+1);setRepairRun(structuredClone(repair));setRepairPassed(false);setMessage('已上傳這一版修復程式。逐行追蹤，看看上一顆燈何時熄滅。');}}>上傳並驗證修復</button>{repairPassed&&<button className="tl-primary" onClick={()=>{setPhase('done');setMessage('任務完成！你已從接線一路做到讀程式及排錯。');}}>完成任務 →</button>}</div>{repairRun&&<><ProgramPlayer autoStart key={repairVersion} program={repairRun} onComplete={()=>{const ok=repairCorrect(repairRun)&&JSON.stringify(repairRun)===JSON.stringify(repair);setRepairPassed(ok);setMessage(ok?'修復成功！切換燈號時有明確關掉上一顆。':mode==='practice'?'仍未修復。觀察第二階段，紅燈的最後一次指令是 HIGH 還是 LOW？修改後再上傳。':'結果未符合目標。比較各階段燈號與目標，修改後重新上傳。');}}/>{resultTable(repairRun)}</>}</section>}
 {phase==='done'&&<section className="tl-card tl-finish"><span>UNIT 02 COMPLETE</span><h2>{mode==='challenge'?'獨立完成！':'練習完成！'}</h2><p>你已完成三色燈接線與亮滅測試、逐行預測、9 秒循環及漏寫 LOW 排錯。</p><p>{hintCount>0?`使用提示 ${hintCount} 次。需要協助時願意回頭檢查，也是學習的一部分。`:'完成全部操作。下一步：把方法帶到實物 Uno 上。'}</p><a href={`${BASE}/`}>返回遊戲庫 →</a><button onClick={()=>location.reload()}>重新開始</button></section>}
 <footer className="tl-footer"><span>單元二 · 不收集學生資料 · 無聲音 · 進度留在本次頁面</span><a href={`${BASE}/games/uno-wiring`}>複習單元一 ↗</a></footer></main>;
}
