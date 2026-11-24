import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeReview, reviewEdits, writeField, PROFILE_FIELDS} from '../src/onboarding/profileRefresh.js';
import {generateCvProfile,getProfile,getReviewProfile,confirmProfile} from '../src/api/profile.js';
import {getDraft,setDraft,clearDraft} from '../src/onboarding/draftStore.js';
const old={personal:{name:'Old',email:'old@example.test',phone:'123',location:'Debrecen'},career:{targetRoles:'Engineer',workType:'Remote',seniority:'Senior'},skills:['sql'],experienceEducation:[],languages:[]};
const fresh={...structuredClone(old),personal:{...old.personal,name:'New',phone:''},skills:['python']};
const preview={previewId:'preview-id',cvId:'new-cv',generatedProfile:fresh,baseProfile:old};
test('replacement selection preserves values until selected; explicit empty values and edits survive',()=>{
  assert.deepEqual(mergeReview(preview,[]),old);
  const merged=mergeReview(preview,['skills','personal.phone']);
  assert.equal(merged.personal.name,'Old');assert.equal(merged.personal.phone,'');assert.deepEqual(merged.skills,['python']);
  writeField(merged,'personal.name','Corrected');
  assert.deepEqual(reviewEdits(preview,['skills','personal.phone'],merged),{'personal.name':'Corrected'});
  assert.equal(old.personal.name,'Old');
  assert.deepEqual(mergeReview({...preview,baseProfile:null},[]),fresh);
  assert.equal(PROFILE_FIELDS.length,10);
});
test('onboarding uses preview APIs, preserves corrections through goals and only confirms with explicit edits',async()=>{
  const original=globalThis.fetch, calls=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    return {ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>url==='/api/profile' && options.method==='PUT'?{success:true}:url==='/api/profile'?{profile:old,cvId:'old-cv'}:preview};
  };
  try {
    clearDraft();await generateCvProfile('new-cv');
    assert.equal(calls[0].url,'/api/cv/new-cv/profile/preview');
    assert.deepEqual(getDraft().refreshFields,[]);
    assert.equal((await getReviewProfile()).personal.name,'Old');
    assert.equal((await getProfile()).personal.name,'Old');
    const edited=mergeReview(preview,['skills']);edited.personal.name='Corrected';
    setDraft({refreshFields:['skills'],profile:edited});
    assert.equal((await getReviewProfile()).personal.name,'Corrected');
    await confirmProfile(edited);
    const put=calls.find(call=>call.options.method==='PUT');
    assert.deepEqual(JSON.parse(put.options.body),{previewId:'preview-id',refreshFields:['skills'],edits:{'personal.name':'Corrected'}});
    assert.equal(calls.filter(call=>call.options.method==='PUT').length,1);
  } finally {globalThis.fetch=original;clearDraft();}
});
test('expired review never falls back to the legacy save endpoint',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url)=>{calls.push(url);return {ok:false,status:410,headers:{get:()=> 'application/json'},json:async()=>({error:{code:'PROFILE_PREVIEW_EXPIRED',message:'Review expired'}})};};
  try {
    setDraft({previewId:'expired',refreshFields:[]});
    await assert.rejects(()=>confirmProfile(old),/Review expired/);
    assert.deepEqual(calls,['/api/profile/previews/expired']);
  } finally {globalThis.fetch=original;clearDraft();}
});
