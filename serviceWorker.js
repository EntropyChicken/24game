const CACHE_NAME = "24game-cache-v71";
const CACHE_FILES = [
    "./", // root directory URL
    "./index.html",
    "./style.css",
    "./manifest.json",
    "./assets/icon.png",
    "./assets/icon-550.png",
    "./assets/favicon.png",

    // js (never cache serviceWorker.js itself)
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

    // libraries
    "./libraries/p5.min.js",
    "./libraries/p5.sound.min.js",

    // level sets
    "./levelData/classicLevelsVeryHard.json",
    "./levelData/classicLevelsEasy.json",
    "./levelData/classicLevelsHard.json",
    "./levelData/classicLevelsMedium.json",
    "./levelData/classicLevelsTricky.json",
    "./levelData/puzzleLevelsCrazyHard.json",
    "./levelData/puzzleLevelsInteresting.json",
    "./levelData/puzzleLevelsJavascript.json",
    "./levelData/puzzleLevelsSimple.json",
    "./levelData/scrapped.json",
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                CACHE_FILES.map(file =>
                    cache.add(file).catch(err => {
                        console.error("Failed to cache:", file, err);
                    })
                )
            );
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Serve from cache if found
            if (response) {
                return response;
            }

            // 2. CRITICAL: Fallback to index.html for directory navigation when offline
            if (event.request.mode === 'navigate') {
                return caches.match("./index.html");
            }

            // Otherwise, attempt network fetch
            return fetch(event.request).catch(() => {
                // Only return "Offline" string for page navigation
                if (event.request.mode === 'navigate') {
                    return new Response("Offline", { status: 503, statusText: "Offline" });
                }
                // 3. CRITICAL: Return an empty 404 for failed assets/scripts 
                // This prevents syntax errors from breaking the environment
                return new Response(null, { status: 404 });
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
        })
    );
});