/* Scoped, versioned offline cache. Updates wait for an explicit saved reload. */
const VERSION='interfacebench-1.4.3-rc.1',FILES=['./','./index.html','./CATALOG.html','./style.css','./icon.svg','./js/app.js','./js/interchange.js','./js/catalog.js','./js/component-library.js','./js/svg-import.js','./js/definition-editor.js','./js/model.js','./js/geometry.js','./js/validation.js','./js/checks.js','./js/storage.js','./js/canvas.js','./js/exports.js','./js/rehearsal.js','./vendor/opentype.min.js','./vendor/pdf-lib.min.js','./vendor/jszip.min.js','./fonts/DejaVuSans.ttf'];
const CACHE=VERSION+'-'+self.registration.scope;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('interfacebench-')&&k.endsWith('-'+self.registration.scope)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request,{ignoreSearch:true});if(cached)return cached;return fetch(e.request);}));});
