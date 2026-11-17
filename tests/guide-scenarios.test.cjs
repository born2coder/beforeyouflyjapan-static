const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');const {JSDOM}=createRequire(path.resolve(process.env.BYF_TEST_DEPS,'package.json'))('jsdom');
const root=path.resolve(__dirname,'..'),evidence=JSON.parse(fs.readFileSync(path.join(root,'audit/guide-usefulness-evidence.json'),'utf8'));
const jst=s=>new Date(s+':00+09:00');
assert.equal(evidence.scenarios.length,13);
for(const s of evidence.scenarios){const sum=s.stages.reduce((n,x)=>n+x.minutes,0);assert.equal(sum,s.totalBeforeAirportReadyMinutes,s.label+' stages');assert.equal(+jst(s.flightJST)-s.bufferMinutes*60000,+jst(s.airportReadyJST),s.label+' target');assert.equal(+jst(s.airportReadyJST)-sum*60000,+jst(s.endSightseeingJST),s.label+' finish');}
for(const row of evidence.pages){const d=new JSDOM(fs.readFileSync(path.join(root,row.path.slice(1),'index.html'),'utf8')).window.document;
 for(const source of row.sources)assert.ok([...d.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===source.url),row.path+' source missing');
 assert.ok(row.sources.length>=2,row.path+' context sources');
}
console.log('Verified13 published worked-scenario sums, airport targets and sightseeing end dates; source links present on all13 guides.');
