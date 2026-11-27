// generic runner: node run.js script.js  -> evaluates the exported async function main() in the page
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});const p=await b.newPage();p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>{const t=m.text();if(!/TGA loader|GL Driver/.test(t))console.log(t.slice(0,3000));});
await p.goto('file://'+__dirname+'/pipe.html');await p.waitForFunction(()=>window.ready);const code=fs.readFileSync(process.argv[2],'utf8');
const out=await p.evaluate(`(async()=>{${code}\nreturn await main(${JSON.stringify(process.argv.slice(3))});})()`);
if(out&&out.files)for(const [n,b64] of Object.entries(out.files))fs.writeFileSync(__dirname+'/'+n,Buffer.from(b64,'base64'));if(out&&out.log)console.log(out.log);await b.close();})();
