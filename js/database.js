// Global Database State
let firebaseReady = null;
let gameCount; 
let gameCountDrawScale = 1;

document.addEventListener('firebase_initialized', () => {
    firebaseReady = window.firebaseAppReady;
    isOnlineSession = (firebaseReady && firebaseReady.isOnlineMode);
    getGameCount().then(val => {
        gameCount = val;
    });
});

async function incrementGameCounter(change) {
    const incrementValue = typeof change === 'number' && !isNaN(change) ? change : 1; 

    if (!firebaseReady || !firebaseReady.isReady || !firebaseReady.increment) {
        return;
    }

    try {
        const { db, collection, doc, setDoc, increment } = firebaseReady; 
        const gameCounterRef = doc(collection(db, 'gameStats'), 'globalCounter');

        await setDoc(gameCounterRef, {
            plays: increment(incrementValue) 
        }, { merge: true });

        gameCount += incrementValue;
    } catch (error) {
        console.error('Error incrementing counter:', error);
    }
    
    broadcastWin();
}

async function getGameCount() {
    if (!firebaseReady || !firebaseReady.isReady) {
        return 0; 
    }
    try {
        const { db, collection, doc, getDoc } = firebaseReady; 
        const gameCounterRef = doc(collection(db, 'gameStats'), 'globalCounter');
        const docSnap = await getDoc(gameCounterRef);
        if (docSnap.exists()) { 
            return docSnap.data().plays;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error getting game count:', error);
        return 0;
    }
}