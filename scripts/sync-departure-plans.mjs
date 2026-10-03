import fs from 'node:fs';
import vm from 'node:vm';
// Keep the authored route definitions and the browser's static dataset in sync.
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/planner-data.js','utf8'),context);
const routes=JSON.parse(fs.readFileSync('content/departure-plans.json','utf8'));
const ids=new Set(routes.map(route=>route.id));
const data=context.window.BYF_STATIC_DATA;
data.plans=data.plans.filter(route=>!ids.has(route.id)).concat(routes);
fs.writeFileSync('assets/planner-data.js',`window.BYF_STATIC_DATA=${JSON.stringify(data)};\n`);
