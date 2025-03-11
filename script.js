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

        // Generate a new fingerprint-based ID
        const deviceId = await generateDeviceFingerprint();
        await setIndexedDBValue(db, "deviceId", deviceId);
        console.log("Generated new Device ID:", deviceId);
        return deviceId;
    } catch (e) {
        console.warn("Failed to use IndexedDB, falling back to temporary ID", e);
        return await generateDeviceFingerprint(); // Fallback to non-persistent ID
    }
}

// Your WebGL Fingerprint Function
function getWebGLFingerprint() {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) return "No WebGL support";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown GPU";
}

// Your Canvas Fingerprint Function
function getCanvasFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Hello, fingerprinting!", 10, 10);

    return canvas.toDataURL();
}

// Modified Fingerprint Generation Function
async function generateDeviceFingerprint() {
    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
        deviceMemory: navigator.deviceMemory || "unknown",
        touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        webGLGPU: getWebGLFingerprint(),
        canvasHash: getCanvasFingerprint(),
        uniqueSeed: crypto.randomUUID() // Add randomness for uniqueness across identical devices
    };

    return await hashFingerprint(fingerprint);
}

// SHA-256 Hash Function (replacing your simple hash for better uniqueness)
async function hashFingerprint(fingerprint) {
    const jsonString = JSON.stringify(fingerprint);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
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
