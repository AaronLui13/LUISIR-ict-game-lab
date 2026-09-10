'use client';
import { useEffect,useState,useRef } from 'react';
import { instructionText,LIGHTS,trace } from './game-data.mjs';
import type { Instruction } from './game-data.mjs';
export function Lamps({state}:{state:boolean[]}){return <div className="tl-lamps">{LIGHTS.map((l,i)=><div key={l.pin}><span className={`tl-bulb ${state[i]?'on':''}`} style={{'--lamp':l.color} as React.CSSProperties}/><b>{l.name}</b><small>{state[i]?'亮 HIGH':'滅 LOW'}</small></div>)}</div>;}
export function ProgramPlayer({program,onComplete,autoStart=false}:{program:Instruction[];onComplete?:()=>void;autoStart?:boolean}){
 const [index,setIndex]=useState(-1),[playing,setPlaying]=useState(autoStart),[complete,setComplete]=useState(false);
 const done=useRef(onComplete);useEffect(()=>{done.current=onComplete;},[onComplete]);
 const container=useRef<HTMLDivElement>(null);
 const frames=trace(program),frame=frames[index];
 useEffect(()=>{if(autoStart){container.current?.scrollIntoView({block:'start'});container.current?.focus({preventScroll:true});}},[autoStart]);
 useEffect(()=>{
  if(!playing)return;
  const timer=setTimeout(()=>{if(index>=program.length-1){setPlaying(false);setComplete(true);done.current?.();}else setIndex(index+1);},frame?.duration||650);
  return ()=>clearTimeout(timer);
 },[playing,index,program.length,frame?.duration]);
 function next(){setPlaying(false);const nextIndex=Math.min(index+1,program.length-1);setIndex(nextIndex);if(nextIndex===program.length-1){setComplete(true);done.current?.();}}
 function reset(){setPlaying(false);setIndex(-1);setComplete(false);}
 return <div className="tl-player" ref={container} tabIndex={-1} aria-label="程式觀察播放器"><div className="tl-player-live"><strong>教學慢播 · 並非實時秒錶</strong><Lamps state={frame?.state||[false,false,false]}/><p role="status">{complete?'這次觀察已完成，可核對答案或繼續任務。':index<0?'準備從第一行開始。所有燈初始為 LOW。':frame.duration?`delay(${frame.duration})：等待 ${frame.duration/1000} 秒，燈號保持。`:`第 ${index+1} 行已執行。只有被寫入的腳位改變，其他燈保持。`}</p><p>程式等待總計：<b>{frames.reduce((sum,f)=>sum+f.duration,0)/1000} 秒</b>。逐行講解額外放慢，不計入循環秒數。</p><div className="tl-controls"><button onClick={()=>{if(complete){setIndex(-1);setComplete(false);}setPlaying(!playing);}}>{playing?'暫停':complete?'再次播放':'自動播放'}</button><button disabled={complete} onClick={next}>下一行</button><button onClick={reset}>從頭重播</button></div><small>自動模式：指令展示約 0.65 秒，delay 按指定秒數等待。手動「下一行」會略過等待；到最後一行即完成觀察。</small></div><ol className="tl-code">{program.map((i,n)=><li key={n} className={index===n?'current':''}><span>{n+1}</span><code>{instructionText(i)}</code></li>)}</ol></div>;
}
