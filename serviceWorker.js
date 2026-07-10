const CACHE_NAME = "24game-cache-v95";
const CACHE_FILES = [
    "./", 
    "./index.html",
    "./style.css",
    "./manifest.json",
    "./assets/icon.png",
    "./assets/icon-550.png",
    "./assets/favicon.png",
    "./sketch.js",
    "./js/rational.js",
    "./js/complex.js",
    "./js/operation.js",
    "./js/bubble.js",
    "./js/bubbleBox.js",
    "./js/button.js",
    "./js/duel.js",
    "./js/level.js",
    "./js/titleScreen.js",
    "./js/sequence.js",
    "./js/database.js",
    "./js/levelUtils.js",
    "./js/battleSystem.js",
    "./js/translations.js",
    "./js/historyScreen.js",
    "./libraries/p5.min.js",
    "./libraries/p5.sound.min.js",
    "./levelData/classicLevelsVeryHard.json",
    "./levelData/classicLevelsEasy.json",
    "./levelData/classicLevelsHard.json",
    "./levelData/classicLevelsMedium.json",
    "./levelData/classicLevelsTricky.json",
    "./levelData/puzzleLevelsDiscovery.json",
    "./levelData/puzzleLevelsInsight.json",
    "./levelData/puzzleLevelsTheory.json",
    "./levelData/puzzleLevelsJavaScriptWeirdness.json",
    "./levelData/puzzleLevelsCrazyHard.json",
    "./levelData/scrapped.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            if (event.request.mode === 'navigate') {
                return caches.match("./index.html");
            }
            return fetch(event.request).catch(() => new Response(null, { status: 404 }));
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
            .then(() => self.clients.matchAll({ type: 'window' }))
            .then((clients) => {
                // tell every open tab a new version just took over
                clients.forEach((client) => client.postMessage({ type: 'NEW_VERSION_ACTIVATED' }));
            })
    );
});