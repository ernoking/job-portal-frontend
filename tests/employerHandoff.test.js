import test from 'node:test';
import assert from 'node:assert/strict';
import {handoffToEmployer} from '../src/utils/employerHandoff.js';
function fixture() {
  const calls=[];
  const tab={opener:'parent',closed:false,location:{replace:url=>calls.push(['navigate',url])},close:()=>{tab.closed=true;calls.push(['close']);}};
  return {calls,tab,openWindow:()=>{calls.push(['open']);return tab;}};
}
test('opens a detached tab during the click, before waiting for recording',async()=>{
  const f=fixture();let finish;
  const pending=handoffToEmployer({openWindow:f.openWindow,record:()=>{f.calls.push(['record']);return new Promise(resolve=>{finish=resolve;});}});
  assert.deepEqual(f.calls,[['open'],['record']]);assert.equal(f.tab.opener,null);
  finish({applyUrl:'https://employer.example/apply'});
  assert.deepEqual(await pending,{url:'https://employer.example/apply',opened:true});
  assert.deepEqual(f.calls.at(-1),['navigate','https://employer.example/apply']);
});
test('already recorded applications can reopen the employer form',async()=>{
  const f=fixture();
  const result=await handoffToEmployer({...f,fallbackUrl:'https://employer.example/job',record:async()=>{throw {data:{error:{code:'ALREADY_APPLIED'}}};}});
  assert.equal(result.opened,true);
});
test('failed or closed-job requests close the reserved tab and do not navigate',async()=>{
  for(const code of ['JOB_CLOSED','PROFILE_UNAVAILABLE']) {
    const f=fixture(), error={data:{error:{code}}};
    await assert.rejects(()=>handoffToEmployer({...f,record:async()=>{throw error;}}),e=>e===error);
    assert.equal(f.tab.closed,true);assert.ok(!f.calls.some(c=>c[0]==='navigate'));
  }
});
test('blocked/closed tabs retain a usable link and unsafe URLs are not opened',async()=>{
  assert.deepEqual(await handoffToEmployer({openWindow:()=>null,record:async()=>({applyUrl:'https://employer.example/'})}),{url:'https://employer.example/',opened:false});
  const f=fixture();f.tab.closed=true;
  assert.equal((await handoffToEmployer({...f,record:async()=>({applyUrl:'https://employer.example/'})})).opened,false);
  for(const url of ['javascript:alert(1)','data:text/html,bad','not a URL']) {
    const bad=fixture();const result=await handoffToEmployer({...bad,record:async()=>({applyUrl:url})});
    assert.equal(result.url,null);assert.equal(bad.tab.closed,true);
  }
});
