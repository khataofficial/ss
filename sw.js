const SHELL='safar-shell-v3', TILES='safar-tiles-v1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png',
'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL).then(c=>Promise.all(ASSETS.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname==='tile.openstreetmap.org'){
    e.respondWith(caches.open(TILES).then(async c=>{
      const hit=await c.match(r.url); if(hit)return hit;
      try{const res=await fetch(r);if(res.ok)c.put(r.url,res.clone());return res}
      catch(err){return new Response('',{status:404})}
    }));
    return;
  }
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(SHELL).then(c=>c.put('./index.html',cp));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{
    if(res.ok){const cp=res.clone();caches.open(SHELL).then(c=>c.put(r,cp))}
    return res;
  }).catch(()=>r.mode==='navigate'?caches.match('./index.html'):undefined)));
});
