document.getElementById("verify-btn").addEventListener("click", async function () {
    const tg = window.Telegram.WebApp;
    const userData = tg.initDataUnsafe.user;
    const userId = userData?.id;

    // Generate a stronger Device Fingerprint
    const fingerprint = await generateDeviceFingerprint();

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
            device_id: fingerprint,
            ip_address: ip
        })
    );

    tg.close();
});

// ✅ Fixed Function to Generate a More Unique Device Fingerprint
async function generateDeviceFingerprint() {
    let components = [];

    // 1️⃣ ✅ Fix IndexedDB Unique ID (Wait for it properly)
    try {
        const db = await openIndexedDB();
        const uniqueId = await getIndexedDBValue(db, "deviceId");
        
        if (uniqueId) {
            components.push(uniqueId);
        } else {
            const newId = crypto.randomUUID();
            await setIndexedDBValue(db, "deviceId", newId);
            components.push(newId);
        }
    } catch (e) {
        console.warn("IndexedDB not available", e);
    }

    // 2️⃣ Canvas Fingerprinting
    try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText(navigator.userAgent, 2, 2);
        components.push(canvas.toDataURL());
    } catch (e) {
        console.warn("Canvas not available", e);
    }

    // 3️⃣ AudioContext Fingerprinting
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const buffer = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(buffer);
        components.push(buffer.join(","));
    } catch (e) {
        console.warn("AudioContext not available", e);
    }

    // 4️⃣ WebGL Fingerprinting
    try {
        const gl = document.createElement("canvas").getContext("webgl");
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
            components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        }
    } catch (e) {
        console.warn("WebGL not available", e);
    }

    // Hash all collected data into a unique fingerprint
    return hashData(components.join("|"));
}

// ✅ Async Function to Open IndexedDB
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

// ✅ Async Function to Get Value from IndexedDB
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

// ✅ Async Function to Set Value in IndexedDB
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

// ✅ Function to Hash Data using SHA-256
async function hashData(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}
