'use client';
import { useEffect,useState } from 'react';
import { ProgramPlayer } from './ProgramPlayer';
import { Breadboard } from './Breadboard';
import { delay,write,emptyCircuit,LIGHTS } from './game-data.mjs';
const DEMO=[write(8,'HIGH'),delay(2000),write(8,'LOW'),delay(1000)];
export function Teaching({finish,review=false}:{finish:()=>void;review?:boolean}){
 const [page,setPage]=useState(0),[step,setStep]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{if(!playing)return;const t=setTimeout(()=>{if(step===3)setPlaying(false);else setStep(step+1);},1300);return()=>clearTimeout(t);},[playing,step]);
 const circuit=emptyCircuit();
 circuit.lights.forEach((light,i)=>{light.holes.anode=LIGHTS[i].guide.anode;light.holes.cathode=LIGHTS[i].guide.cathode;if(step>=i){light.holes.back=LIGHTS[i].guide.back;light.holes.join=LIGHTS[i].guide.join;}});if(step===3)circuit.ground='f2';
 return <section className="tl-card tl-teaching"><div className="tl-section-title"><span>共同教學 · {page+1} / 2</span><button className="tl-text-button" onClick={finish}>{review?'返回任務 →':'跳過教學，選擇模式 →'}</button></div>
 {page===0?<><h2>三顆燈，一個共同接地點。</h2><p>每顆燈有自己的電阻及輸出腳位；三條回路可以經相通孔，接回同一個 Uno GND。</p><Breadboard demo wiring={circuit} count={3} channel={0} selection={null} hints powered choose={()=>{}} pin={()=>{}} place={()=>{}}/><p className="tl-demo-caption" role="status">{['紅燈短腳回路：e10 → j2。綠框是麵包板內部 f2–j2 相通孔，不是新元件。','綠燈短腳回路：e18 → i2。i2 與 j2 在麵包板內部相通。','黃燈短腳回路：e26 → h2。每孔只插一個線頭。','f2 → Uno GND。整組 f2–j2 連回 Uno GND。三條回路共用這一條接地幹線。'][step]}</p><div className="tl-controls"><button onClick={()=>{setStep(0);setPlaying(true);}}>播放／重播動畫</button><button onClick={()=>{setPlaying(false);setStep(Math.min(3,step+1));}}>下一步</button><button className="tl-primary" onClick={()=>{setPlaying(false);setPage(1);}}>看看程式怎樣控制燈 →</button></div></>:<><h2>只看一顆燈，學會逐行讀程式。</h2><p>digitalWrite() 改變指定腳位；delay() 等待時，燈號維持。這不是稍後三色燈題目的答案。</p><ProgramPlayer program={DEMO}/><div className="tl-controls"><button onClick={()=>setPage(0)}>← 共同接地</button><button className="tl-primary" onClick={finish}>{review?'教學看完，返回任務 →':'教學完成，選擇模式 →'}</button></div></>}
 </section>;
}
