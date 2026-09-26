const fs=require('fs');
const js=fs.readFileSync('script.js','utf8');
const sql=fs.readFileSync('supabase_patch_stop_lagman_fish.sql','utf8');
const ids=[...js.matchAll(/\{id:\"(sushi-(?:set-)?[^\"]+)\"/g)].map(m=>m[1]);
const uniq=[...new Set(ids)];
const missing=uniq.filter(id=>!sql.includes(`('${id}'`) && !sql.includes(`when '${id}'`));
if(missing.length){console.error('Missing sushi STOP/server products:',missing);process.exit(1)}
for(const id of uniq){if(!sql.includes(`('${id}'`)){console.error('Missing availability seed:',id);process.exit(1)}}
console.log(`PASS: ${uniq.length} sushi/sushi-set products are registered in STOP catalog`);
