const CACHE_NAME = 'recruit-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.html.txt',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Initial PWA caching skipped or failed:', err);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // 구글 Apps Script 서버 API 요청은 캐시하지 않고 항상 네트워크를 통하게 처리
  if (event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com')) {
    return event.respondWith(fetch(event.request));
  }

  // 그 외 정적 리소스는 네트워크가 실패할 때 캐시에서 조회(네트워크 우선 정책)하여 데이터의 최신화 유지
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공적인 응답일 때 캐시에 업데이트
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // 오프라인 상태일 때 캐시에서 조회
        return caches.match(event.request);
      })
  );
});
