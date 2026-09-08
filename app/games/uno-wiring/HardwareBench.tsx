'use client';
import type { Endpoint, Holes } from './game-data.mjs';

const columns = 'abcdefghij';
export function holePoint(hole: string) {
  const col = columns.indexOf(hole[0]);
  return { x: 425 + col * 44 + (col >= 5 ? 24 : 0), y: 79 + (Number(hole.slice(1)) - 1) * 36 };
}
type Props = {
  holes: Holes; selected: Endpoint | null; on: boolean; usb: boolean; locked: boolean;
  source: string; step: number; round: number;
  choose: (key: Endpoint) => void; pin: (name: string) => void; place: (hole: string) => void;
};
export function HardwareBench({holes,selected,on,usb,locked,source,step,round,choose,pin,place}:Props) {
  const free = round === 2;
  const ledVisible = true;
  const resistorVisible = free || step >= 2;
  const pinsAvailable = !locked && !usb && (free || step >= 4);
  const endpointLabel = {anode:'＋',cathode:'−',r1:'1',r2:'2',signal:'S',ground:'G'};
  function component(a:Endpoint,b:Endpoint,kind:'led'|'resistor') {
    if(!holes[a] || !holes[b]) return null;
    const p=holePoint(holes[a]),q=holePoint(holes[b]);
    const x=(p.x+q.x)/2,y=(p.y+q.y)/2;
    return <g key={`${a}${holes[a]}${holes[b]}`} className="hw-component">
      <path d={`M ${p.x} ${p.y} L ${x-9} ${y} M ${q.x} ${q.y} L ${x+9} ${y}`} stroke="#747f86" strokeWidth="4" fill="none"/>
      {kind==='led'?<g><path d={`M ${x-15} ${y+7} V ${y-7} A 15 15 0 0 1 ${x+15} ${y-7} V ${y+7} Z`} fill={on?'#ffe370':'#df5449'} stroke="#932e30" strokeWidth="2"/><path d={`M ${x-8} ${y-7} v-5`} stroke="#ffffff99" strokeWidth="4"/><text x={x+22} y={y} fontSize="12" fill="#71362d">LED</text></g>:<g><rect x={x-21} y={y-9} width="42" height="18" rx="6" fill="#e4c48e" stroke="#8e713e"/>{['#ba3135','#ba3135','#855225','#caa543'].map((c,i)=><rect key={i} x={x-13+i*8} y={y-9} width="4" height="18" fill={c}/>)}<text x={x+27} y={y+4} fontSize="12" fill="#71572d">220 Ω</text></g>}
    </g>;
  }
  return <div className="hw-workspace">
    <div className="hw-tray">
      <div className="hw-tray-intro"><b>元件盤</b><span>先選元件的腳，再點右邊孔位</span></div>
      {ledVisible && <div className="hw-item"><svg viewBox="0 0 90 75" aria-hidden="true"><path d="M 34 40 V 72 M 55 40 V 60" stroke="#6a7378" strokeWidth="4"/><path d="M 24 40 V 23 A 20 20 0 0 1 64 23 V 40Z" fill="#e45648" stroke="#a23b36" strokeWidth="2"/><path d="M 33 24 V 17" stroke="#ffffffaa" strokeWidth="5"/></svg><div><b>LED 發光二極管</b><div className="hw-item-actions">{(['anode','cathode'] as Endpoint[]).map((key,i)=><button key={key} aria-pressed={selected===key} disabled={locked||usb||(!free&&i>step)} onClick={()=>choose(key)}>{i===0?'長腳 ＋':'短腳 −'}{holes[key]?' ✓':''}</button>)}</div></div></div>}
      {resistorVisible && <div className="hw-item"><svg viewBox="0 0 100 65" aria-hidden="true"><path d="M 2 33 H 98" stroke="#748087" strokeWidth="4"/><rect x="24" y="22" width="52" height="22" rx="7" fill="#e4c48e" stroke="#8e713e"/>{['#ba3135','#ba3135','#855225','#caa543'].map((c,i)=><rect key={i} x={32+i*10} y="22" width="5" height="22" fill={c}/>)}</svg><div><b>220 Ω 電阻</b><div className="hw-item-actions">{(['r1','r2'] as Endpoint[]).map((key,i)=><button key={key} aria-pressed={selected===key} disabled={locked||usb||(!free&&i+2>step)} onClick={()=>choose(key)}>第 {i+1} 端{holes[key]?' ✓':''}</button>)}</div></div></div>}
      {!free && step>=4 && <p className="hw-pin-help">接線在 Uno 上開始：<br/><b>點 D8 或 GND → 點麵包板孔位</b></p>}
    </div>
    <div className="hw-scroll" role="region" aria-label="Arduino Uno 與麵包板接線圖，可橫向捲動">
      <div className="hw-canvas">
        <svg viewBox="0 0 940 560" className="hw-art" aria-hidden="true">
          <defs><pattern id="hw-grain" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d7dfd8"/></pattern></defs>
          <rect width="940" height="560" rx="12" fill="url(#hw-grain)"/>
          <text x="28" y="50" fontSize="21" fill="#234c50" fontWeight="bold">Arduino Uno R3</text><text x="28" y="76" fontSize="13" fill="#60736f">直接點選板上的腳位</text>
          <path d="M 30 122 H 306 L 328 146 V 365 L 308 385 H 30 Z" fill="#087f88" stroke="#075966" strokeWidth="4"/>
          {[ [43,137],[308,152],[43,368],[305,368] ].map(([x,y])=><circle key={`${x}${y}`} cx={x} cy={y} r="7" fill="#e1e6d8" stroke="#7caf9b" strokeWidth="3"/>)}
          <rect x="13" y="175" width="65" height="58" rx="4" fill="#b8c3c7" stroke="#667b84" strokeWidth="3"/><rect x="12" y="185" width="15" height="37" fill="#3d4c55"/><text x="28" y="165" fill="white" fontSize="13">USB-B</text>
          <rect x="16" y="305" width="61" height="40" rx="4" fill="#23373d"/><circle cx="31" cy="325" r="11" fill="#111f28" stroke="#7f8b8c" strokeWidth="3"/>
          <text x="112" y="231" fill="white" fontSize="35" fontWeight="bold">UNO</text><text x="111" y="252" fill="#c7eddd" fontSize="12">DIGITAL OUTPUT</text>
          <rect x="133" y="276" width="146" height="43" rx="3" fill="#192f38"/>{Array.from({length:14},(_,i)=><g key={i}><rect x={136+i*10} y="269" width="4" height="7" fill="#bac1bb"/><rect x={136+i*10} y="319" width="4" height="7" fill="#bac1bb"/></g>)}<text x="159" y="302" fill="#b1c2b9" fontSize="11">ATmega328P</text>
          <circle cx="95" cy="295" r="11" fill="#dae0d8" stroke="#7f8b8c" strokeWidth="3"/><circle cx="95" cy="327" r="11" fill="#dae0d8" stroke="#7f8b8c" strokeWidth="3"/>
          <rect x="109" y="143" width="184" height="26" rx="3" fill="#1a3037"/><rect x="112" y="342" width="172" height="25" rx="3" fill="#1a3037"/>
          <circle cx="94" cy="265" r="4" fill={usb?'#95f580':'#4b7874'}/><text x="79" y="282" fill="white" fontSize="9">ON</text>
          <text x="391" y="27" fill="#234c50" fontSize="21" fontWeight="bold">麵包板 Breadboard</text>
          <rect x="380" y="43" width="534" height="471" rx="13" fill="#fcfcf4" stroke="#bdc7b9" strokeWidth="2"/>
          <rect x="625" y="66" width="19" height="422" rx="5" fill="#d9dfd2"/>
          {columns.split('').map((l,i)=><text key={l} x={425+i*44+(i>=5?24:0)} y="61" textAnchor="middle" fontSize="12" fill="#52665c">{l}</text>)}
          {Array.from({length:12},(_,i)=><text key={i} x="395" y={84+i*36} textAnchor="middle" fontSize="12" fill="#52665c">{i+1}</text>)}
          <text x="391" y="540" fontSize="12" fill="#536b60">a–e 同列相通 │ 中央凹槽不相通 │ f–j 同列相通</text>
          <text x="28" y="421" fill="#536b60" fontSize="13">示意圖：只顯示本課相關腳位</text>
          {(['signal','ground'] as Endpoint[]).map((key,i)=>{if(!holes[key])return null;const p=holePoint(holes[key]);const sx=i?210:source==='5V'?148:source==='D7'?267:214,sy=i?355:source==='5V'?355:156;return <path key={`${key}${holes[key]}${source}`} className="wl-wire-draw" pathLength="1" d={`M ${sx} ${sy} C 370 ${sy},340 ${p.y},${p.x} ${p.y}`} fill="none" stroke={i?'#375d8e':'#e68031'} strokeWidth="5"/>;})}
          {component('anode','cathode','led')}{component('r1','r2','resistor')}
        </svg>
        {([['D8',214,156],['D7',267,156],['5V',148,355],['GND',210,355]] as const).map(([name,x,y])=><button key={name} className={`hw-pin ${selected===(name==='GND'?'ground':'signal')&&(name==='GND'||source===name)?'chosen':''}`} style={{left:`${x/9.4}%`,top:`${y/5.6}%`}} disabled={!pinsAvailable} onClick={()=>pin(name)} aria-label={`Uno ${name}`}><i/>{name}</button>)}
        {Array.from({length:12},(_,i)=>columns.split('').map(l=>{const hole=`${l}${i+1}`,p=holePoint(hole);const item=(Object.keys(holes) as Endpoint[]).find(k=>holes[k]===hole);return <button key={hole} className={`hw-hole ${item?'filled':''}`} style={{left:`${p.x/9.4}%`,top:`${p.y/5.6}%`}} disabled={locked||usb} aria-label={`孔 ${hole}${item?`，${endpointLabel[item]}`:''}`} title={hole} onClick={()=>place(hole)}>{item?endpointLabel[item]:<i/>}</button>;}))}
      </div>
    </div>
    <p className="hw-footnote">線只在端點接通，跨過其他孔不代表接通。改線前先拔 USB。<span>窄畫面可左右捲動接線圖。</span></p>
  </div>;
}
