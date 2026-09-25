'use client';
import { useEffect,useRef,useState } from 'react';
import { SensorBoard } from './SensorBoard';
import { PARTS } from './game-data.mjs';
import type { Wiring } from './game-data.mjs';
const STEPS=[
 '① 由 Uno 5V 出發，經電源線到 e4，再經第 4 列內部相通孔到 a4。',
 '② 電流經過 LDR，由 a4 到 a8。LDR 會隨光度改變電阻值。',
 '③ 經第 8 列共用接點，由 a8 到 e8，再穿過 10 kΩ 電阻到 e14。',
 '④ 經第 14 列相通孔到 a14，再沿接地線回 Uno GND，形成供電回路。',
 '⑤ 留意藍線：A0 量度第 8 列接點相對 GND 的電壓。它是高阻抗輸入，不是主要電流回路；不能把 A0 當成 GND。',
];
export function CurrentFlow({onComplete}:{onComplete:()=>void}){
 const [step,setStep]=useState(-1),[playing,setPlaying]=useState(false),[complete,setComplete]=useState(false);
 const panel=useRef<HTMLDivElement>(null);
 const done=useRef(onComplete);useEffect(()=>{done.current=onComplete;},[onComplete]);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(step===4){setPlaying(false);setComplete(true);done.current();}else setStep(step+1);},2400);return()=>clearTimeout(timer);},[playing,step]);
 function next(){setPlaying(false);if(step<4)setStep(step+1);else{setComplete(true);done.current();}}
 return <div className="sr-current-lesson" ref={panel}><div className="sr-note"><strong>先看一次：電流走哪條路？</strong><p>跟着金色箭嘴看 5V → LDR → 固定電阻 → GND，再留意 A0 的不同角色。</p><div className="sr-actions"><button className="sr-primary" onClick={()=>{panel.current?.scrollIntoView({block:'start'});if(step<0||complete){setStep(0);setComplete(false);}setPlaying(!playing);}}>{playing?'暫停示範':complete?'重播電流示範':step<0?'播放電流示範（約 12 秒）':'繼續播放示範'}</button><button onClick={next} disabled={complete}>{step===4?'完成觀察':'逐步觀看 →'}</button></div><p role="status">{step<0?'按播放，或用「逐步觀看」慢慢看。':STEPS[step]}</p>{complete&&<strong>✓ 已看完。主要回路回到 GND；A0 負責量度接點電壓。</strong>}</div><SensorBoard demo wiring={Object.fromEntries(PARTS.map(([p,,h])=>[p,h])) as Wiring} selected={null} hint power={step>=0} onSelect={()=>{}} onPlace={()=>{}} flowStep={step} flowPlaying={playing}/><p className="sr-board-note">金色表示傳統電流方向，並非電子移動方向。分段播放只為方便追蹤；通電後整個回路持續有電流，並不是依次才接通。動畫速度不代表真實電流速度。A0 藍線只標示量度連接。</p></div>;
}
