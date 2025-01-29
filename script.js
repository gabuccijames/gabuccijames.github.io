document.getElementById("verify-btn").addEventListener("click", async function () {
    const tg = window.Telegram.WebApp;
    const userData = tg.initDataUnsafe.user;
    const userId = userData?.id;

    // Get Device Info
    const device = navigator.userAgent || "Unknown Device";
   // Generate Device Fingerprint
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

// Function to Generate Device Fingerprint
async function generateDeviceFingerprint(deviceInfo) {
    const encoder = new TextEncoder();
    const data = encoder.encode(deviceInfo);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

    return hashHex;  // A short, unique SHA-256 hash
}
