    const CACHE_NAME = "24game-cache-v7";
    const CACHE_FILES = [
        "./index.html",
        "./style.css",
        "./manifest.json",
        "./assets/icon.png",
        "./assets/icon-550.png",
        "./assets/favicon.png",

        // js
        "./sketch.js",
        "./complex.js",
        "./operation.js",
        "./bubble.js",
        "./bubbleBox.js",
        "./button.js",
        "./duel.js",
        "./level.js",
        "./titleScreen.js",
        // "./serviceWorker.js", // sus? unless you want to ctrl shift r every time you make a change

        // libraries
        "./libraries/p5.min.js",
        "./libraries/p5.sound.min.js",

        // level sets
        "./levelData/classicLevelsCooked.json",
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
                return response || fetch(event.request).catch(() => {
                    // Optional: return fallback page or blank response
                    return new Response("Offline", { status: 503, statusText: "Offline" });
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
