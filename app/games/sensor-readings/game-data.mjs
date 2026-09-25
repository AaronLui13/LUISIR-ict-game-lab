export const PARTS=[['ldr1','LDR 第一腳','a4'],['ldr2','LDR 第二腳','a8'],['r1','10 kΩ 電阻第一腳','e8'],['r2','同一電阻第二腳','e14'],['vcc','5V 電源線','e4'],['ground','GND 接地線','a14'],['input','A0 輸入線','c8']];
export const CONDITIONS=[{id:'bright',name:'光線充足',light:90},{id:'shade',name:'稍微遮蓋',light:45},{id:'dark',name:'完全遮蓋',light:5}];
export function emptyWiring(){return Object.fromEntries(PARTS.map(([part])=>[part,'']));}
export function net(hole){const m=/^([a-j])([1-9]|1[0-6])$/.exec(hole);return m?`${m[1]<'f'?'L':'R'}${m[2]}`:null;}
export function pair(part){return ({ldr1:'ldr2',r1:'r2'})[part]||null;}
export function checkWiring(w,resistance=10000){
 const n=Object.fromEntries(Object.entries(w).map(([k,h])=>[k,net(h)]));
 if(n.vcc&&n.vcc===n.ground)return {safe:false,ready:false,kind:'short',text:'5V 與 GND 直接相通。先分開電源線，才可接 USB。'};
 if(Object.values(n).some(x=>!x))return {safe:true,ready:false,kind:'open',text:'電路尚有未接端點。A0 要接兩個元件的中間接點。'};
 if(new Set(Object.values(w)).size!==7)return {safe:false,ready:false,kind:'overlap',text:'每孔只插一個線頭。請分開重疊端點。'};
 if(n.ldr1===n.ldr2||n.r1===n.r2)return {safe:true,ready:false,kind:'bypass',text:'同一元件兩腳相通，元件被繞過。兩腳要在不同的相通孔組。'};
 const spans=(a,b,x,y)=>(a===x&&b===y)||(a===y&&b===x);
 const junction=[n.ldr1,n.ldr2].find(x=>x===n.r1||x===n.r2);
 let kind='open';
 if(junction&&spans(n.ldr1,n.ldr2,n.vcc,junction)&&spans(n.r1,n.r2,junction,n.ground))kind='normal';
 if(junction&&spans(n.r1,n.r2,n.vcc,junction)&&spans(n.ldr1,n.ldr2,junction,n.ground))kind='reversed';
 if(n.input===n.vcc)kind='high';else if(n.input===n.ground)kind='low';else if(n.input!==junction)kind='open';
 const texts={normal:resistance===10000?'分壓接線正確。接 USB，驗證並上傳讀數程式。':'接線已形成分壓，但本課需要 10 kΩ（10000 Ω），不是 LED 用的 220 Ω。',reversed:'LDR 和固定電阻位置交換了，光暗趨勢會相反。按本課接法把 LDR 接在 5V 一邊。',high:'A0 接到 5V，讀數會固定在 1023。斷電後改接中間接點。',low:'A0 接到 GND，讀數會固定在 0。斷電後改接中間接點。',open:'A0 未接到完整分壓電路的中間接點。檢查 LDR、固定電阻、5V 與 GND。'};
 return {safe:true,ready:kind==='normal'&&resistance===10000,kind,text:texts[kind]};
}
// Illustrative resistance curve, not a calibration to lux or a specific LDR model.
export function reading(light,kind='normal',resistance=10000,sample=0){
 if(kind==='high')return 1023;if(kind==='low')return 0;
 if(!['normal','reversed'].includes(kind))return null;
 const ldr=1000*Math.pow(100,1-Math.max(0,Math.min(100,light))/100);
 const ratio=kind==='normal'?resistance/(resistance+ldr):ldr/(resistance+ldr);
 return Math.max(0,Math.min(1023,Math.round(1023*ratio)+[-2,0,2,1,-1][sample%5]));
}
export function validateCode(code){
 if(code.pin!=='A0')return '本課訊號接 A0；請讓 analogRead() 讀取相同腳位。';
 if(!code.print)return 'sensorValue 已儲存讀數，但未傳到電腦。加入 Serial.println(sensorValue)。';
 if(code.baud!==9600)return '按工作紙把 Serial.begin() 設為 9600，再驗證。';
 if(code.delay!==500)return '按工作紙設定 delay(500)，每半秒取樣一次。';
 return '';
}
export function serialState({power,uploaded,port,monitor,baud,kind}){
 if(!power)return 'USB 尚未連接；沒有讀數。';
 if(!uploaded)return '尚未上傳程式；沒有讀數。';
 if(port!=='COM3')return '沒有收到資料。選擇這塊 Uno 的 COM3 連接埠。';
 if(!monitor)return '程式正在運行。開啟 Serial Monitor 查看讀數。';
 if(baud!==uploaded.baud)return '��� ?# ▒ 亂碼：監控視窗與 Serial.begin() 的通訊速率不同。';
 if(kind==='open'||kind==='bypass')return 'A0 沒有完整訊號。實物可能出現飄移讀數；本模擬不提供有效數值。';
 return '';
}
export function evidenceCorrect(records,bright,dark,trend,unit,factor){
 return CONDITIONS.every(c=>records[c.id]?.length===3)&&records.bright.includes(Number(bright))&&records.dark.includes(Number(dark))&&Number(bright)>Number(dark)&&trend==='higher'&&unit==='raw'&&['shadow','position','noise'].includes(factor);
}
