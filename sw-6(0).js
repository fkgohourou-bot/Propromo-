
const CACHE='propromo-v3';
const ASSETS=['/'];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE;})
            .map(function(k){return caches.delete(k);})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var url=e.request.url;

  /* Firebase → toujours réseau */
  if(url.indexOf('googleapis.com')>=0||url.indexOf('gstatic.com')>=0){
    return;
  }

  /* HTML principal → réseau d'abord, cache en fallback */
  if(e.request.mode==='navigate'||url.indexOf('.html')>=0||url.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(function(resp){
        if(resp&&resp.status===200){
          var clone=resp.clone();
          caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});
        }
        return resp;
      }).catch(function(){
        return caches.match(e.request)||caches.match('/');
      })
    );
    return;
  }

  /* Autres assets → cache d'abord */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached)return cached;
      return fetch(e.request).then(function(resp){
        if(!resp||resp.status!==200||resp.type==='opaque')return resp;
        var clone=resp.clone();
        caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});
        return resp;
      }).catch(function(){
        return caches.match('/');
      });
    })
  );
});
