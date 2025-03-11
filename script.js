document.getElementById("verify-btn").addEventListener("click", async function () {
    const tg = window.Telegram.WebApp;
    const userData = tg.initDataUnsafe.user;
    const userId = userData?.id;

    // Generate or retrieve a persistent, unique Device ID
    const deviceId = await getPersistentDeviceId();

    // Get IP Address
    let ip;
    try {
        const res = await fetch("https://api64.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
        console.log("IP Address:", ip);
    } catch (err) {
        ip = "Unknown IP";
    }

    // Send Data to Bot
    tg.sendData(
        JSON.stringify({
            telegram_id: userId,
            device_id: deviceId,
            ip_address: ip
        })
    );

    tg.close();
});

// Function to get or generate a persistent, unique Device ID
async function getPersistentDeviceId() {
    try {
        const db = await openIndexedDB();
        const storedId = await getIndexedDBValue(db, "deviceId");

        if (storedId) {
            console.log("Using existing Device ID:", storedId);
            return storedId; // Return the stored ID if it exists
        }

        // Generate a new unique ID if none exists
        const baseData = [
            navigator.userAgent, // Stable browser/OS info
            navigator.language,  // Language setting
            screen.width + "x" + screen.height, // Screen resolution
            new Date().getTimezoneOffset().toString(), // Timezone offset
            crypto.randomUUID()  // Random UUID for uniqueness
        ].join("|");

        const newDeviceId = await hashData(baseData);
        await setIndexedDBValue(db, "deviceId", newDeviceId);
        console.log("Generated new Device ID:", newDeviceId);
        return newDeviceId;
    } catch (e) {
        console.warn("Failed to use IndexedDB, falling back to temporary ID", e);
        // Fallback: Generate a temporary ID if IndexedDB fails
        const fallbackData = [
            navigator.userAgent,
            crypto.randomUUID()
        ].join("|");
        return await hashData(fallbackData);
    }
}

// Async Function to Open IndexedDB
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("unique_device_db", 1);
        
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            db.createObjectStore("fingerprint", { keyPath: "id" });
        };
        
        request.onsuccess = function (event) {
            resolve(event.target.result);
        };
        
        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// Async Function to Get Value from IndexedDB
function getIndexedDBValue(db, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("fingerprint", "readonly");
        const store = transaction.objectStore("fingerprint");
        const request = store.get(key);
        
        request.onsuccess = function () {
            resolve(request.result ? request.result.value : null);
        };
        
        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// Async Function to Set Value in IndexedDB
function setIndexedDBValue(db, key, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("fingerprint", "readwrite");
        const store = transaction.objectStore("fingerprint");
        const request = store.put({ id: key, value: value });
        
        request.onsuccess = function () {
            resolve();
        };
        
        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// Function to Hash Data using SHA-256
async function hashData(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}
