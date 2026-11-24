export const PROFILE_FIELDS = [
  ['personal.name','Name'],['personal.email','Email'],['personal.phone','Phone'],['personal.location','Location'],
  ['career.targetRoles','Target roles'],['career.workType','Work type'],['career.seniority','Seniority'],
  ['experienceEducation','Experience and education'],['skills','Skills'],['languages','Languages'],
];
export const readField = (profile,path) => path.split('.').reduce((value,key)=>value?.[key],profile);
export function writeField(profile,path,value) {
  const [section,key]=path.split('.');
  if(key) profile[section]={...profile[section],[key]:structuredClone(value)};
  else profile[section]=structuredClone(value);
  return profile;
}
export function mergeReview(preview,fields=[]) {
  const merged=structuredClone(preview.baseProfile || preview.generatedProfile);
  for(const field of fields) writeField(merged,field,readField(preview.generatedProfile,field));
  return merged;
}
export function reviewEdits(preview,fields,profile) {
  const baseline=mergeReview(preview,fields), edits={};
  for(const [field] of PROFILE_FIELDS) {
    const value=readField(profile,field);
    if(JSON.stringify(value)!==JSON.stringify(readField(baseline,field))) edits[field]=value;
  }
  return edits;
}
