document.getElementById("verify-btn").addEventListener("click", async function () {
    const tg = window.Telegram.WebApp;
    const userData = tg.initDataUnsafe.user;
    const userId = userData?.id;

    // Get Device Info
    const device = navigator.userAgent || "Unknown Device";

    // Get IP Address
    let ip;
    try {
        const res = await fetch("https://api64.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
    } catch (err) {
        ip = "Unknown IP";
    }

    // Send Data to Bot
    tg.sendData(JSON.stringify({
        telegram_id: userId,
        device_id: device,
        ip_address: ip
    }));

    tg.close();
});
