import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTS,emptyWiring,pair,net,checkWiring,reading,validateCode,serialState,evidenceCorrect} from '../app/games/sensor-readings/game-data.mjs';
const wired=()=>Object.fromEntries(PARTS.map(([p,,h])=>[p,h]));
const code={pin:'A0',baud:9600,delay:500,print:true};
test('LDR worksheet midpoint and alternative same-net holes work with nonpolar components',()=>{
 const w=wired();assert.equal(checkWiring(w).ready,true);assert.equal(net('a8'),net('e8'));assert.notEqual(net('e8'),net('f8'));
 w.input='d8';[w.ldr1,w.ldr2]=[w.ldr2,w.ldr1];[w.r1,w.r2]=[w.r2,w.r1];assert.equal(checkWiring(w).ready,true);
 assert.equal(pair('ldr1'),'ldr2');assert.equal(pair('r1'),'r2');assert.equal(pair('input'),null);
});
test('shorts block power; missing leads, bypass and wrong resistance cannot pass',()=>{
 assert.equal(checkWiring(emptyWiring()).ready,false);
 const short=wired();short.ground='b4';assert.equal(checkWiring(short).safe,false);
 const missing=wired();missing.input='';assert.equal(checkWiring(missing).kind,'open');
 const bypass=wired();bypass.ldr2='b4';assert.equal(checkWiring(bypass).kind,'bypass');
 assert.equal(checkWiring(wired(),220).ready,false);
});
test('rail readings and reversed divider have visible, different consequences',()=>{
 const w=wired();w.input='b4';assert.equal(checkWiring(w).kind,'high');assert.equal(reading(5,'high'),1023);
 w.input='b14';assert.equal(checkWiring(w).kind,'low');assert.equal(reading(90,'low'),0);
 const reversed=wired();[reversed.vcc,reversed.ground]=['b14','b4'];assert.equal(checkWiring(reversed).kind,'reversed');assert.ok(reading(90,'reversed')<reading(5,'reversed'));
 assert.equal(reading(50,'open'),null);
});
test('normal raw values rise with light, vary slightly and stay in ADC range',()=>{
 assert.ok(reading(90)>reading(45));assert.ok(reading(45)>reading(5));assert.notEqual(reading(90,'normal',10000,0),reading(90,'normal',10000,1));
 for(let light=-10;light<=110;light++)for(let sample=0;sample<5;sample++){const v=reading(light,'normal',10000,sample);assert.ok(Number.isInteger(v)&&v>=0&&v<=1023);}
});
test('program checks and serial connection failures distinguish no data from baud mismatch',()=>{
 assert.equal(validateCode(code),'');for(const c of [{...code,pin:'A1'},{...code,print:false},{...code,delay:1000},{...code,baud:115200}])assert.notEqual(validateCode(c),'');
 const s={power:true,uploaded:code,port:'COM3',monitor:true,baud:9600,kind:'normal'};assert.equal(serialState(s),'');
 assert.match(serialState({...s,power:false}),/USB/);assert.match(serialState({...s,uploaded:null}),/上傳/);assert.match(serialState({...s,port:'COM1'}),/COM3/);assert.match(serialState({...s,baud:115200}),/亂碼/);
});
test('evidence must cite collected values, correct trend and raw units',()=>{
 const records={bright:[880,882,881],shade:[430,432,431],dark:[110,112,111]};
 assert.equal(evidenceCorrect(records,'880','110','higher','raw','shadow'),true);
 assert.equal(evidenceCorrect(records,'999','110','higher','raw','shadow'),false);
 assert.equal(evidenceCorrect(records,'880','110','lower','raw','shadow'),false);
 assert.equal(evidenceCorrect(records,'880','110','higher','lux','shadow'),false);
 assert.equal(evidenceCorrect({...records,shade:[]},'880','110','higher','raw','shadow'),false);
});
