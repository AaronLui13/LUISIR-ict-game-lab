'use client';
import { useRef,useState } from 'react';
export function LightCover({value,onChange,onMoving}:{value:number;onChange:(value:number)=>void;onMoving?:(moving:boolean)=>void}){
 const drag=useRef<{id:number;y:number;value:number}|null>(null);
 const [moving,setMoving]=useState(false);
 const clamp=(v:number)=>Math.max(0,Math.min(100,v));
 function finish(e:React.PointerEvent<HTMLDivElement>){if(!drag.current)return;drag.current=null;setMoving(false);onChange(Math.round(value/50)*50);onMoving?.(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
 return <div className="sr-cover-control"><div className={`sr-cover-stage ${moving?'dragging':''}`}><svg viewBox="0 0 280 270" aria-hidden="true"><rect x="12" y="8" width="256" height="252" rx="18" fill="#e8eedf"/><text x="25" y="36" fill="#a77a28" fontSize="23">☀</text><g stroke="#d2ad51" strokeWidth="3" opacity={1-value/110}><path d="M70 50l28 82M210 50l-28 82M140 50v77" strokeDasharray="7 7"/></g><path d="M105 238l20-35m30 0 20 35" stroke="#7b8c81" strokeWidth="5"/><circle cx="140" cy="180" r="32" fill="#e4c28c" stroke="#a47c3e" strokeWidth="3"/><path d="M121 160h38v10h-38v10h38v10h-38v10h38" stroke="#8b592f" strokeWidth="3" fill="none"/><circle cx="140" cy="180" r="34" fill="#153732" opacity={value/180}/><text x="140" y="257" textAnchor="middle" fill="#315e4e" fontSize="12">LDR 光敏電阻</text></svg>
 <div className="sr-cover-panel" role="slider" tabIndex={0} aria-label="上下拖動遮光板" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`遮蓋 ${Math.round(value)}%，${value<25?'光線充足':value>75?'完全遮蓋':'稍微遮蓋'}`} style={{transform:`translateY(${-20+value*.8}px)`}}
 onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,y:e.clientY,value};setMoving(true);onMoving?.(true);}}
 onPointerMove={e=>{const start=drag.current;if(start&&start.id===e.pointerId)onChange(clamp(start.value+(e.clientY-start.y)/.8));}}
 onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={()=>{if(drag.current){drag.current=null;setMoving(false);onChange(Math.round(value/50)*50);onMoving?.(false);}}}
 onKeyDown={e=>{const next=e.key==='ArrowUp'?value-50:e.key==='ArrowDown'?value+50:e.key==='Home'?0:e.key==='End'?100:null;if(next!==null){e.preventDefault();onChange(clamp(next));}}}><span>遮光板</span><b>↕ 拉高／拉低</b><i/></div></div><p>拉高 → 光線照入 · 拉低 → 遮住 LDR<br/><small>可用滑鼠、手指，或聚焦後按 ↑ ↓。放手會停在三個實驗位置。</small></p></div>;
}
