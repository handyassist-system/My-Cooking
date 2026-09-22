// 食在料理 Service Worker（智在生活 Standard：與智能行事曆同一套）
// 每次改這支 sw.js 本身時，把版本號 +1，舊快取才會被清掉
const CACHE_NAME = 'cook-cache-v1';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝：預快取核心檔案
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){ return c.addAll(CORE).catch(function(){}); })
  );
});

// 啟用：清掉舊快取
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// 抓取策略：
// - Firebase / Google 服務 → 一律走網路（不攔截，確保登入與資料即時）
// - App 靜態檔 → 網路優先，失敗時回快取（有網路永遠是最新版）
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.indexOf('firebaseio.com') >= 0 || url.indexOf('googleapis.com') >= 0 || url.indexOf('gstatic.com') >= 0 || url.indexOf('firebaseapp.com') >= 0) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(c){ c.put(e.request, copy).catch(function(){}); });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); });
    })
  );
});

// 收到頁面指令 → 立即接管（「立即更新」按鈕用）
self.addEventListener('message', function(e){
  if(e.data === 'SKIP_WAITING') self.skipWaiting();
});
