import test from 'node:test';
import assert from 'node:assert/strict';
import {testOutput,pairedEnd,LIGHTS,emptyCircuit,net,occupied,checkCircuit,trace,stableStages,PREDICTION,ORIGINAL,BROKEN,write,predictionCorrect,timingCorrect,repairCorrect} from '../app/games/three-light-lab/game-data.mjs';
function wired(){const c=emptyCircuit();c.ground='f2';c.lights.forEach((l,i)=>l.holes={...LIGHTS[i].guide});return c;}
test('26 rows and central trench match worksheet orientation',()=>{assert.equal(net('a26'),net('e26'));assert.equal(net('j2'),net('f2'));assert.notEqual(net('e2'),net('f2'));for(const h of ['a27','a0','z2','a02'])assert.equal(net(h),null);});
test('each added light uses its own resistor and shared GND',()=>{const c=wired();for(let n=1;n<=3;n++)assert.equal(checkCircuit(c,n).ok,true);c.ground='f3';assert.equal(checkCircuit(c,3).ok,false);});
test('accepts other equivalent holes, reversed resistors and alternative ground bus',()=>{const c=wired();c.ground='f3';c.lights.forEach(l=>{l.holes.join=l.holes.join.replace('2','3');[l.holes.r1,l.holes.r2]=[l.holes.r2,l.holes.r1];l.holes.signal=l.holes.signal.replace('a','b');});assert.equal(checkCircuit(c,3).ok,true);});
test('open return, reversed LED, wrong pin and cross-channel shorts fail',()=>{for(const mutate of [c=>c.lights[1].holes.join='i3',c=>[c.lights[2].holes.anode,c.lights[2].holes.cathode]=[c.lights[2].holes.cathode,c.lights[2].holes.anode],c=>c.lights[1].pin=8,c=>c.lights[2].holes.signal='b4']){const c=wired();mutate(c);assert.equal(checkCircuit(c,3).ok,false);}});
test('short to GND and resistor bypass prevent power',()=>{let c=wired();c.lights[0].holes.signal='g2';assert.equal(checkCircuit(c,3).safe,false);c=wired();c.lights[0].holes.signal='b8';assert.equal(checkCircuit(c,3).safe,false);});
test('occupied holes include previous channels and shared ground',()=>{const c=wired();assert.equal(occupied(c,'a8',1,'anode'),true);assert.equal(occupied(c,'a8',0,'anode'),false);assert.equal(occupied(c,'f2',0,'anode'),true);assert.equal(occupied(c,'f2',0,'ground'),false);});
test('write changes only one pin; delay preserves state and tracks time',()=>{const f=trace(BROKEN);assert.deepEqual(f[5].state,[true,true,false]);assert.deepEqual(f[7].state,[true,true,false]);assert.equal(f[7].duration,3000);assert.deepEqual(stableStages(PREDICTION).map(f=>f.duration),[2000,1000,4000]);assert.equal(stableStages(PREDICTION)[2].elapsed,3000);});
test('prediction checks all lamps and seconds',()=>{const a=stableStages(PREDICTION).map(f=>({states:f.state.map(Number),seconds:String(f.duration/1000)}));assert.equal(predictionCorrect(a),true);a[1].states[0]=1;assert.equal(predictionCorrect(a),false);});
test('timing and repair checks require complete behavior, not matching a single line',()=>{const t=structuredClone(ORIGINAL);t[3].ms=5000;assert.equal(timingCorrect(t,'9'),true);assert.equal(timingCorrect(t,'7'),false);t[4]=write(8,'HIGH');assert.equal(timingCorrect(t,'9'),false);assert.equal(repairCorrect(BROKEN),false);const r=structuredClone(BROKEN);r[4]=write(8,'LOW');assert.equal(repairCorrect(r),true);r[4]=write(9,'LOW');assert.equal(repairCorrect(r),false);});
test('test upload controls valid branches despite incomplete neighbours',()=>{
 const c=wired();c.lights[1].holes.join='';
 assert.deepEqual(testOutput(c,2,{modePin:'8',writePin:'8',level:'HIGH'},[false,false,false]),[true,false,false]);
 assert.deepEqual(testOutput(c,2,{modePin:'8',writePin:'8',level:'LOW'},[true,false,false]),[false,false,false]);
 assert.deepEqual(testOutput(c,2,{modePin:'9',writePin:'8',level:'HIGH'},[false,false,false]),[false,false,false]);
 c.lights[1].holes.signal='g2';
 assert.deepEqual(testOutput(c,2,{modePin:'8',writePin:'8',level:'HIGH'},[true,false,false]),[false,false,false]);
});
test('two-ended components continue to the other leg but single-ended actions finish',()=>{
 assert.equal(pairedEnd('anode'),'cathode');assert.equal(pairedEnd('r1'),'r2');assert.equal(pairedEnd('back'),'join');
 for(const part of ['cathode','r2','join','signal','ground'])assert.equal(pairedEnd(part),null);
});
