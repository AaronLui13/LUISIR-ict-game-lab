'use client';
import { useState } from 'react';
import { circuit, EMPTY, ENDPOINTS, GUIDE, lit, upload, verify, wiringFeedback, net } from './game-data.mjs';
import { HardwareBench } from './HardwareBench';
import type { Code, Endpoint, Holes } from './game-data.mjs';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export function WiringLab() {
  const [round,setRound] = useState(1);
  const [holes,setHoles] = useState<Holes>({...EMPTY});
  const [selected,setSelected] = useState<Endpoint|null>('anode');
  const [scene,setScene] = useState<'hardware'|'computer'>('hardware');
  const [source,setSource] = useState('D8');
  const [returnPin,setReturn] = useState('GND');
  const [usb,setUsb] = useState(false);
  const [board,setBoard] = useState('');
  const [port,setPort] = useState('');
  const [toolsOpen,setToolsOpen] = useState(false);
  const [code,setCode] = useState<Code>({mode:'',pin:'',level:''});
  const [program,setProgram] = useState<Code|null>(null);
  const [message,setMessage] = useState('先接 LED 長腳：在麵包板上點 a8。');
  const [hints,setHints] = useState(0);
  const [seenHigh,setSeenHigh] = useState(false);
  const [done,setDone] = useState(false);
  const feedback = wiringFeedback(holes,round,source,returnPin);
  const on = lit(holes,source,returnPin,usb,program);
  const result = circuit(holes,source,returnPin);
  const dirty = JSON.stringify(code) !== JSON.stringify(program);
  const order = ENDPOINTS.map(([key])=>key);
  const missing = order.findIndex(key=>!holes[key] || net(holes[key])!==net(GUIDE[key]));
  const step = missing < 0 ? (source!=='D8'?4:6) : missing;
  const stepNames = ['LED 長腳','LED 短腳','電阻第 1 端','電阻第 2 端','Uno D8 接線','Uno GND 接線'];
  function choose(key:Endpoint) {
    setSelected(key);
    setMessage(`已選 ${ENDPOINTS.find(([k])=>k===key)?.[1]}。點麵包板${round===1?` ${GUIDE[key]}`:'的目標孔位'}。`);
  }
  function selectPin(name:string) {
    const key = name==='GND'?'ground':'signal';
    if(key==='signal') setSource(name);
    setSelected(key);
    setMessage(name==='5V'||name==='D7'?'⚠ 本課程式控制 D8，請點 Uno 上的 D8。':`已從 Uno ${name} 拉出接線。現在點麵包板${round===1?` ${GUIDE[key]}`:'的目標孔位'}。`);
  }
  function reset(next:number) {
    setRound(next); setScene('hardware'); setHoles({...EMPTY}); setSelected(next===1?'anode':null); setSource('D8'); setReturn('GND'); setUsb(false); setBoard(''); setPort(''); setToolsOpen(false); setCode({mode:'',pin:'',level:''}); setProgram(null); setHints(0); setSeenHigh(false); setDone(false); setMessage(next===1?'先接 LED 長腳：在麵包板上點 a8。':'自行接好 D8 → 電阻 → LED → GND。點元件的腳或 Uno 腳位，再點麵包板孔位。');
  }
  function place(hole:string) {
    if (done) return;
    if (usb) { setMessage('先拔除 USB，才可以改線。'); return; }
    if (!selected) { setMessage('先點元件的腳，或直接點 Uno 上的 D8／GND，再點麵包板孔位。'); return; }
    if (Object.entries(holes).some(([k,v])=>k!==selected && v===hole)) { setMessage(`${hole} 已有端點。請選同組其他空孔。`); return; }
    const nextHoles = {...holes,[selected]:hole};
    setHoles(nextHoles); setSeenHigh(false);
    const check=wiringFeedback(nextHoles,round,source,returnPin);
    if(check.error) { setMessage(`⚠ ${check.text}`); return; }
    const nextIndex=order.findIndex(key=>!nextHoles[key] || net(nextHoles[key])!==net(GUIDE[key]));
    if(round===1 && nextIndex>=0) {
      setSelected(nextIndex<4?order[nextIndex]:null);
      setMessage(`✓ 接好了。下一步：${nextIndex<4?`接${stepNames[nextIndex]}，點麵包板 ${GUIDE[order[nextIndex]]}`:`點 Uno 上的 ${nextIndex===4?'D8':'GND'}，再點麵包板 ${GUIDE[order[nextIndex]]}`}。`);
    } else { setSelected(null); setMessage(check.text); }
  }
  function power() {
    if (!usb && result.kind==='unsafe') { setMessage(`通電已攔截：${result.detail}`); return; }
    setUsb(!usb); setMessage(usb ? 'USB 已拔除，可以改線。COM3 已離線。' : 'Windows 已偵測 USB 裝置，COM3 出現。請在 IDE 選擇開發板及連接埠。');
  }
  function send() {
    const response = upload(code,usb,board,port);
    if (response.error) { setMessage(response.error); return; }
    const next = response.program!; setProgram(next);
    if (lit(holes,source,returnPin,usb,next)) { setSeenHigh(true); setMessage('上傳完成。LED 亮起！下一步：把 HIGH 改成 LOW，再驗證及上傳。'); }
    else if (seenHigh && result.kind==='ready' && next.mode==='OUTPUT' && next.pin==='8' && next.level==='LOW') { setDone(true); setMessage('上傳完成。LED 已熄滅，你完成了本輪的亮起與熄滅任務。'); }
    else setMessage('上傳完成，LED 沒有亮起。觀察電路與程式；有需要可按「給我線索」。');
  }
  function hint() {
    setHints(hints+1);
    if (hints===0) setMessage('線索 1：沿 D8 → 電阻 → LED 長腳／短腳 → GND 追蹤一次。再分清「驗證」與「上傳」的用途。');
    else if (result.kind!=='ready') setMessage(`接線線索：${result.detail}${hints>1 ? ' 可試：LED a8/a10、電阻 e4/e8、D8→a4、GND→e10。' : ''}`);
    else if (!usb || board!=='uno' || port!=='COM3') setMessage('操作線索：連接 USB，打開「工具」，選 Arduino Uno 及插入 USB 後出現的 COM3，再按 → 上傳。');
    else setMessage(`程式線索：pinMode(8, OUTPUT) 設定輸出；digitalWrite(8, ${seenHigh?'LOW':'HIGH'}) 控制電平。✓ 只檢查程式；→ 才把程式送到 Uno。`);
  }
  function field(key:keyof Code,options:string[]) {
    return <select aria-label={{mode:'pinMode 模式',pin:'digitalWrite 腳位',level:'digitalWrite 電平'}[key]} value={code[key]} disabled={done} onChange={e=>{setCode({...code,[key]:e.target.value});setMessage('程式已修改。填妥三個選項後，按 ✓ 驗證，再按 → 上傳。');}}><option value="">選擇…</option>{options.map(x=><option key={x}>{x}</option>)}</select>;
  }
  return <main className="wire-lab">
    <nav className="wl-nav"><a href={`${BASE}/`}>← LUI SIR’S ICT GAME LAB</a><span>UNIT 01 / DIGITAL OUTPUT</span></nav>
    <header className="wl-heading"><div><p className="wl-kicker">ARDUINO UNO · 實物課前練習</p><h1>接好電路，<em>點亮 LED。</em></h1><p>第一輪跟著做 · 第二輪自己接</p></div><div className="wl-round"><b>0{round}<small> / 02</small></b><span>{round===1?'跟圖練習':'獨立挑戰'} · 不限時</span></div></header>

    <section className={`wl-feedback ${feedback.error?"wl-feedback-error":""}`} aria-label="操作回饋"><div><span className="wl-kicker">{done?'MISSION COMPLETE':'現在這樣做'}</span><p role="status" aria-live="polite">{message}</p></div><button onClick={hint} disabled={done}>給我線索 <span>{hints>0?`已用 ${hints} 次`:'需要時才打開'}</span></button></section>
    <div className="wl-scene-tabs"><button aria-pressed={scene==='hardware'} onClick={()=>setScene('hardware')}>1 接線工作枱</button><button aria-pressed={scene==='computer'} disabled={round===1 && (result.kind!=='ready'||feedback.error)} onClick={()=>setScene('computer')}>2 電腦與程式</button><span>{usb?'● 已通電，先拔 USB 才能改線':'○ 未通電，可以接線'}</span></div>
    {scene==='hardware' && <section className="wl-panel wl-new-bench">
      <div className="wl-task-title"><span>{round===1?`${Math.min(step+1,6)} / 6`:'自由接線'}</span><h2>{round===1?(step===6?'電路完成！':`現在接：${stepNames[step]}`):'D8 → 220 Ω 電阻 → LED → GND'}</h2></div>
      <HardwareBench holes={holes} selected={selected} on={on} usb={usb} locked={done} source={source} step={step} round={round} choose={choose} pin={selectPin} place={place}/>
      {feedback.error && <p className="wl-inline-error">⚠ {feedback.text}</p>}
      <div className="wl-bench-next"><span>LED {on?'亮起':'熄滅'} · {usb?'Uno 已接電':'Uno 未接電'}</span>{usb&&<button onClick={power} disabled={done}>拔除 USB</button>}{result.kind==='ready'&&!feedback.error&&<button onClick={()=>{setScene('computer');setMessage('接線完成。下一步：點 USB 線，連接電腦與 Uno。');}}>接線完成，去連接電腦 →</button>}</div>
    </section>}
    {scene==='computer' && <div className="wl-computer-scene"><aside className="wl-live-board"><h2>你的電路</h2><div className={`wl-led ${on?'lit':''}`} aria-hidden="true"/><strong>LED {on?'亮起':'熄滅'}</strong><p>{program?`Uno 內的程式：D${program.pin} / ${program.level}`:'Uno 尚未收到程式'}</p><p>只有上傳，才會改變板上的程式。</p><button onClick={()=>setScene('hardware')}>查看／修改接線</button></aside>
    <section className="wl-panel wl-computer" aria-labelledby="computer-title"><div className="wl-panel-title"><h2 id="computer-title">02 / 電腦與程式</h2><span>WINDOWS</span></div><div className={`wl-usb-picture ${usb?'plugged':''}`} aria-hidden="true"><svg viewBox="0 0 480 105"><rect x="18" y="8" width="110" height="65" rx="6" fill="#24424b"/><rect x="26" y="16" width="94" height="48" fill="#c1e4df"/><path d="M 8 77 H 138 L 125 87 H 20Z" fill="#738e93"/><path className="wl-wire-draw" pathLength="1" d="M 140 58 C 195 58,210 80,280 58" fill="none" stroke="#617988" strokeWidth="7"/><rect x="274" y="46" width="27" height="23" rx="3" fill="#b4c3c7"/><rect x="310" y="17" width="136" height="65" rx="7" fill="#087f88"/><text x="348" y="57" fill="white" fontSize="24">UNO</text><rect x="303" y="43" width="18" height="30" fill="#8ca6ac"/><text x="37" y="103" fill="#47625f" fontSize="12">Windows 電腦</text></svg></div><button className={`wl-usb ${usb?'connected':''}`} onClick={power} disabled={done}>{usb?'拔除 USB':'連接 USB：電腦 ↔ Uno'}<span>{usb?'USB 已連接 · COM3 在線':'點一下接好 USB 兩端'}</span></button>
    <div className="wl-ide"><div className="wl-titlebar">sketch_led | Arduino 1.8.18</div><div className="wl-menu"><span>檔案</span><span>編輯</span><span>草稿碼</span><button aria-expanded={toolsOpen} onClick={()=>setToolsOpen(!toolsOpen)}>工具 ▾</button><span>說明</span></div>{toolsOpen&&<div className="wl-tools"><label>開發板 Board<select aria-label="開發板" value={board} disabled={done} onChange={e=>{setBoard(e.target.value);setMessage(e.target.value==='uno'?'已選 Arduino Uno。下一步：選擇插入 USB 後出現的 COM3 連接埠。':'⚠ 實物是 Uno，請選 Arduino Uno。');}}><option value="">尚未選擇</option><option value="uno">Arduino Uno</option><option value="mega">Arduino Mega 2560</option></select></label><label>連接埠 Port<select aria-label="連接埠" value={port} disabled={done} onChange={e=>{setPort(e.target.value);setMessage(e.target.value==='COM3'?'連接埠已選好。下一步：補上程式中的模式、腳位及電平，再按 ✓ 驗證。':'⚠ 此連接埠不是 Uno。檢查連接 USB 後出現的選項。');}}><option value="">尚未選擇</option><option value="COM1">COM1</option>{(usb||port==='COM3')&&<option value="COM3">COM3{!usb?'（離線）':''}</option>}</select></label></div>}
    <div className="wl-toolbar"><button aria-label="驗證程式" disabled={done} onClick={()=>setMessage(verify(code)||'編譯完成。✓ 只檢查程式，Uno 上的程式及 LED 狀態不變。')}>✓ <span>驗證</span></button><button aria-label="上傳程式" disabled={done} onClick={send}>→ <span>上傳</span></button></div><div className="wl-tab">sketch_led §</div>
    <div className="wl-code"><div><span>1</span><code>void setup() {'{'}</code></div><div><span>2</span><code>  pinMode(8, {field('mode',['OUTPUT','INPUT'])});</code></div><div><span>3</span><code>  digitalWrite({field('pin',['8','7'])},</code></div><div><span>4</span><code>    {field('level',['HIGH','LOW'])});</code></div><div><span>5</span><code>{'}'}</code></div><div><span>6</span><code>void loop() {'{'}</code></div><div><span>7</span><code>{'}'}</code></div></div>
    <div className="wl-console"><b>{dirty?'編輯內容尚未上傳':'編輯內容與板上程式一致'}</b><p>修改電腦中的程式，不會立即改變 Uno。<br/>驗證 Verify → 上傳 Upload → 觀察 LED</p></div><div className="wl-ide-status">{board==='uno'?'Arduino Uno':board==='mega'?'Arduino Mega 2560':'未選開發板'} · {port||'未選連接埠'}</div></div><p className="wl-note">教學模擬介面，保留 IDE 1.8.18 的主要操作。此處 COM3 代表 Uno；實物電腦的編號可能不同。</p></section></div>}

    {done&&<section className="wl-finish"><h2>{round===1?'第一輪完成，準備自己來。':hints===0?'獨立完成！':'已在提示協助下完成。'}</h2><p>{round===1?'下一輪會清空接線、電腦設定及程式。你可以自行選擇孔位。':hints===0?'你已自行完成接線、連接電腦，以及上傳 HIGH / LOW。下一步：在實物 Uno 上重現。':'再挑戰一次，不使用提示完成全流程，即可獲得「獨立完成」。'}</p><button onClick={()=>reset(2)}>{round===1?'開始第二輪 →':'再挑戰第二輪 →'}</button></section>}
    <div className="wl-bottom"><span>無倒數 · 無帳戶 · 成績不會上傳 · 無聲音</span><button onClick={()=>reset(round)}>重新開始本輪</button></div>
  </main>;
}
