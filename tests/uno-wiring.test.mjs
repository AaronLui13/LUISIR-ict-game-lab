import test from 'node:test';
import assert from 'node:assert/strict';
import {net,circuit,GUIDE,EMPTY,upload,verify,lit} from '../app/games/uno-wiring/game-data.mjs';
const high={mode:'OUTPUT',pin:'8',level:'HIGH'};
test('breadboard splits rows and central trench',()=>{
 assert.equal(net('a4'),net('e4'));assert.notEqual(net('a4'),net('a8'));assert.notEqual(net('e4'),net('f4'));assert.equal(net('f12'),net('j12'));
 for(const hole of ['', 'a0','a13','k4','a04']) assert.equal(net(hole),null);
});
test('worksheet and alternate valid layouts work, including resistor reversal',()=>{
 assert.equal(circuit(GUIDE).kind,'ready');
 const other={anode:'f6',cathode:'f9',r1:'j6',r2:'j2',signal:'f2',ground:'j9'};
 assert.equal(circuit(other).kind,'ready');assert.equal(circuit({...other,r1:other.r2,r2:other.r1}).kind,'ready');
});
test('open circuits, reverse polarity and bridged LED cannot light',()=>{
 assert.equal(circuit(EMPTY).kind,'incomplete');
 for(const holes of [{...GUIDE,cathode:'b8'},{...GUIDE,anode:'a10',cathode:'a8'},{...GUIDE,r2:'f8'},{...GUIDE,ground:'e11'}]) assert.equal(lit(holes,'D8','GND',true,high),false);
 assert.equal(circuit(GUIDE,'5V').kind,'dark');
});
test('unsafe direct shorts and bypassed resistor are intercepted',()=>{
 assert.equal(circuit({...GUIDE,ground:'b4'},'5V').kind,'unsafe');
 assert.equal(circuit({...GUIDE,ground:'b4'},'D8').kind,'unsafe');
 assert.equal(circuit({...GUIDE,signal:'b8'}).kind,'unsafe');
});
test('verification does not require USB; upload checks connection, model and port',()=>{
 assert.equal(verify(high),null);assert.ok(verify({...high,mode:''}));
 for(const args of [[false,'uno','COM3'],[true,'mega','COM3'],[true,'uno','COM1']]) assert.ok(upload(high,...args).error);
 assert.deepEqual(upload(high,true,'uno','COM3').program,high);
});
test('board receives a copy; editing or verifying does not alter uploaded output',()=>{
 const draft={...high};const program=upload(draft,true,'uno','COM3').program;
 draft.level='LOW';verify(draft);
 assert.equal(lit(GUIDE,'D8','GND',true,program),true);
 assert.equal(lit(GUIDE,'D8','GND',true,upload(draft,true,'uno','COM3').program),false);
 assert.equal(lit(GUIDE,'D8','GND',false,program),false);
 assert.equal(lit(GUIDE,'D8','GND',true,{...high,pin:'7'}),false);
 assert.equal(lit(GUIDE,'D8','GND',true,{...high,mode:'INPUT'}),false);
});

import { wiringFeedback } from '../app/games/uno-wiring/game-data.mjs';
test('immediate feedback detects wrong guide rows and accepts equivalent holes',()=>{
 assert.equal(wiringFeedback({...EMPTY,anode:'a7'},1).error,true);
 assert.equal(wiringFeedback({...EMPTY,anode:'e8'},1).error,false);
 assert.equal(wiringFeedback({...EMPTY,anode:'f8'},1).error,true);
});
test('free wiring feedback accepts partial valid layouts in every placement order',()=>{
 const layout={anode:'f6',cathode:'f9',r1:'j6',r2:'j2',signal:'f2',ground:'j9'};
 const keys=Object.keys(layout);
 for(let mask=0;mask<64;mask++) {
  const partial={...EMPTY};keys.forEach((k,i)=>{if(mask&(1<<i))partial[k]=layout[k];});
  assert.equal(wiringFeedback(partial,2).error,false,JSON.stringify(partial));
 }
 assert.equal(wiringFeedback({...EMPTY,anode:'a8',cathode:'e8'},2).error,true);
 assert.equal(wiringFeedback({...EMPTY,cathode:'a10',ground:'f10'},2).error,true);
 assert.equal(wiringFeedback({...GUIDE,r2:'f8'},2).error,true);
 assert.equal(wiringFeedback(GUIDE,2).error,false);
});
