// Final authoring pipeline. Legacy SEO scripts are historical import tools.
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
process.chdir(require('node:path').resolve(__dirname,'..'));
const run=(cmd,args)=>execFileSync(cmd,args,{stdio:'inherit'});
run('node',['scripts/render-plan-examples.cjs']);
for(const file of ['render-place-editorial.py','build-guide-usefulness.py','render-reader-entry.py','apply-editorial-policy.py'])run('python3',['scripts/'+file]);
for(const file of fs.globSync('**/index.html')){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/(\/assets\/(?:seo\.css|byf\.css|query-guides\.css|usefulness\.css|planner-core\.js|plan-context\.js|planner\.js|analytics\.js|visit-context\.js)\?v=)[^"&]+/g,(_,prefix)=>prefix+'20261117-1');
 fs.writeFileSync(file,html);
}
const sitemap=fs.readFileSync('sitemap.xml','utf8').replace(/<lastmod>[^<]*<\/lastmod>/g,'<lastmod>2026-11-17</lastmod>');
fs.writeFileSync('sitemap.xml',sitemap);
console.log('Unified editorial pipeline complete.');
