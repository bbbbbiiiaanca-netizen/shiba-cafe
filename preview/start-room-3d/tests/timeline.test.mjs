import assert from 'node:assert/strict';
import {visitAt} from '../timeline.js';
assert.equal(visitAt(0).hearts,false);
assert.equal(visitAt(2.5).phase,'climb');
assert.equal(visitAt(4).y,.45);
assert.equal(visitAt(4).hearts,true);
assert.equal(visitAt(7.5).phase,'descend');
assert.equal(visitAt(10).y,0);
assert.equal(visitAt(10).hearts,false);
for(let t=0;t<10;t+=.01){const a=visitAt(t),b=visitAt(t+.01);assert.ok(Math.abs(a.y-b.y)<.025);assert.ok(Math.abs(a.z-b.z)<.025);}
console.log('One-visit timeline: climb/contact/hearts/descent/continuity passed');
