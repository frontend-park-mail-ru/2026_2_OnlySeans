const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
(async()=>{
 const source=fs.readFileSync('dist/service-worker.js','utf8');assert(!source.includes('__PRECACHE_URLS__'));
 const events={};const entries=new Map();const deleted=[];let offline=false;
 const cache={addAll:async urls=>{for(const u of urls){assert(fs.existsSync('dist'+u),u);entries.set(u,new Response(u));}},match:async k=>entries.get(k)};
 const context={URL,Response,Set,Promise,self:{location:{origin:'https://example.test'},addEventListener:(k,f)=>events[k]=f},caches:{open:async()=>cache,keys:async()=>['unrelated-cache','onlyseans-ui-old'],delete:async k=>deleted.push(k)},fetch:async()=>{if(offline)throw Error('offline');return new Response('network');}};
 vm.runInNewContext(source,context);let waiting;
 events.install({waitUntil:p=>waiting=p});await waiting;
 events.activate({waitUntil:p=>waiting=p});await waiting;assert.deepEqual(deleted,['onlyseans-ui-old']);
 async function request(path,method='GET',mode='cors'){let promise;events.fetch({request:{url:'https://example.test'+path,method,mode},respondWith:p=>promise=p});return promise;}
 assert.equal(await request('/api/me/library'),undefined);assert.equal(await request('/avatars/image.jpg'),undefined);assert.equal(await request('/api/films/1/rating','PUT'),undefined);
 const asset=[...entries.keys()].find(k=>k.endsWith('.js'));offline=true;assert.equal(await (await request(asset)).text(),asset);assert.equal(await (await request('/films','GET','navigate')).text(),'/offline.html');
 offline=false;assert.equal(await (await request('/profile','GET','navigate')).text(),'network');
 assert(!entries.has('/profile'));assert(!entries.has('/api/me/library'));
 console.log('Passed: precache files exist; offline fallback; cached assets; API/write exclusion; namespaced cleanup; navigation uses network.');
})().catch(e=>{console.error(e);process.exitCode=1});
