export const ENDPOINTS = [
  ['anode', 'LED 長腳 ＋'], ['cathode', 'LED 短腳 −'],
  ['r1', '220 Ω 電阻端 1'], ['r2', '220 Ω 電阻端 2'],
  ['signal', '訊號線末端'], ['ground', '接地線末端'],
];
export const GUIDE = { anode: 'a8', cathode: 'a10', r1: 'e4', r2: 'e8', signal: 'a4', ground: 'e10' };
export const EMPTY = { anode: '', cathode: '', r1: '', r2: '', signal: '', ground: '' };
export function net(hole) {
  const m = /^([a-j])([1-9]|1[0-2])$/.exec(hole);
  return m ? `${m[1] < 'f' ? 'L' : 'R'}${m[2]}` : null;
}
export function circuit(holes, source = 'D8', returnPin = 'GND') {
  const n = Object.fromEntries(Object.entries(holes).map(([k,v]) => [k, net(v)]));
  const same = (a,b) => n[a] !== null && n[a] === n[b];
  if ((source === '5V' || source === 'D8' || source === 'D7') && returnPin === 'GND' && same('signal','ground')) return { kind:'unsafe', detail:'供電／輸出端直接接到 GND。先拔 USB，再把兩條線分開到正確的相通孔組。' };
  const forward = same('signal','anode') && same('ground','cathode');
  const backward = same('signal','cathode') && same('ground','anode');
  if ((forward || backward) && source !== 'GND' && returnPin === 'GND') return { kind:'unsafe', detail:'LED 支路沒有串聯限流電阻。先拔 USB，把 220 Ω 電阻串入電流路徑。' };
  if (Object.values(n).some(v => v === null)) return { kind:'incomplete', detail:'仍有元件端點未插入麵包板。檢查六個端點。' };
  if (new Set(Object.values(holes)).size !== 6) return { kind:'incomplete', detail:'一個孔只插一個端點；可利用同組其他相通孔。' };
  if (same('anode','cathode')) return { kind:'dark', detail:'LED 兩腳在同一組相通孔，兩端沒有電位差。' };
  if (source !== 'D8' || returnPin !== 'GND') return { kind:'dark', detail:'本任務程式控制 D8，回路接 GND；5V 不是 D8 的替代位置。' };
  const series = (a,b) => !same('r1','r2') && ((same('signal','r1') && same('r2',a)) || (same('signal','r2') && same('r1',a))) && same(b,'ground') && !same('signal','ground') && !same(a,b);
  if (series('anode','cathode')) return { kind:'ready', detail:'電流路徑完整：D8 → 220 Ω 電阻 → LED → GND。' };
  if (series('cathode','anode')) return { kind:'dark', detail:'LED 極性反了。長腳接向電阻與 D8，短腳接向 GND。' };
  return { kind:'dark', detail:'電流路徑未接通。相同數字的 a–e 相通，f–j 相通；中央凹槽兩邊不相通。' };
}
export function verify(code) {
  return code.mode && code.pin && code.level ? null : '程式尚未完成：請填妥 pinMode 的模式、digitalWrite 的腳位與電平。';
}
export function upload(code, usb, board, port) {
  const error = verify(code);
  if (error) return { error };
  if (!usb) return { error:'上傳失敗：找不到 Uno。檢查 USB 是否連接電腦及 Uno。' };
  if (board !== 'uno') return { error:'上傳失敗：開發板型號不符。請在「工具」選擇 Arduino Uno。' };
  if (port !== 'COM3') return { error:'上傳失敗：無法與此連接埠的 Uno 通訊。比較插拔 USB 前後出現的連接埠。' };
  return { program: { ...code } };
}
export function lit(holes, source, returnPin, usb, program) {
  return usb && circuit(holes,source,returnPin).kind === 'ready' && program?.mode === 'OUTPUT' && program?.pin === '8' && program?.level === 'HIGH';
}

// Diagnose only established connections; an unfinished but extendable circuit is not wrong.
export function wiringFeedback(holes, round = 2, source = 'D8', returnPin = 'GND') {
  const full = circuit(holes, source, returnPin);
  if (full.kind === 'unsafe') return { error: true, text: full.detail };
  if (source !== 'D8' || returnPin !== 'GND') return { error: true, text: '接錯 Uno 腳位：訊號線要接 D8，回路要接 GND。請更改起點。' };
  const n = Object.fromEntries(Object.entries(holes).map(([k,v]) => [k, net(v)]));
  if (round === 1) {
    const wrong = ENDPOINTS.find(([key]) => n[key] && n[key] !== net(GUIDE[key]));
    if (wrong) return { error: true, text: `${wrong[1]} 接在 ${holes[wrong[0]]}，未接到本輪指定的相通孔組。請重新點選此端點，再接到 ${GUIDE[wrong[0]]} 或同組空孔。` };
  }
  const equal = (a,b) => !n[a] || !n[b] || n[a] === n[b];
  const distinct = (a,b) => !n[a] || !n[b] || n[a] !== n[b];
  if (!distinct('anode','cathode')) return { error:true, text:'LED 長短腳插在相通孔，不能形成電位差。重新點選其中一腳，移到另一列。' };
  if (!distinct('r1','r2')) return { error:true, text:'電阻兩端插在同一組相通孔，電阻被繞過了。請把其中一端移到另一組。' };
  if (!equal('cathode','ground')) return { error:true, text:'GND 接地線與 LED 短腳未相通。請把它們接在同列、同側的不同孔。' };
  const orientation = (a,b) => equal('signal',a) && equal(b,'anode') && distinct('signal','anode') && distinct(a,'ground') && distinct(b,'ground');
  if (!orientation('r1','r2') && !orientation('r2','r1')) return { error:true, text:'目前接法未能串成 D8 → 電阻 → LED 長腳。檢查電阻兩端的相通孔組；中央凹槽兩側不相通。' };
  if (full.kind === 'ready') return { error:false, text:'✓ 電路接好了！下一步：連接 USB，再到「工具」選 Arduino Uno 及連接埠。' };
  return { error:false, text:'✓ 此端點已接好。繼續選擇下一個未接端點，再點麵包板孔位。' };
}
