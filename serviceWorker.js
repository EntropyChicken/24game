const CACHE_NAME = "24game-cache-v87";
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
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Removing the individual .catch() forces Promise.all to reject 
            // if ANY file returns a 404. This ensures offline mode is complete.
            return cache.addAll(CACHE_FILES); 
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                if (response) {
                    return response;
                }
                if (event.request.mode === 'navigate') {
                    return cache.match("./index.html");
                }
                return fetch(event.request).catch(() => {
                    if (event.request.mode === 'navigate') {
                        return new Response("Offline", { status: 503, statusText: "Offline" });
                    }
                    return new Response(null, { status: 404 });
                });
            });
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            // Forces the new service worker to take control of the current tab immediately
            return self.clients.claim(); 
        })
    );
});