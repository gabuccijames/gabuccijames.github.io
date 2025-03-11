function getWebGLFingerprint() {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "No WebGL support";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown GPU";
  }
  
  function getCanvasFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Hello, fingerprinting!", 10, 10);
    return canvas.toDataURL();
  }
  
  function generateDeviceFingerprint() {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory || "unknown",
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      webGLGPU: getWebGLFingerprint(),
      canvasHash: getCanvasFingerprint(),
    };
    return hashFingerprint(fingerprint);
  }
  
  function hashFingerprint(fingerprint) {
    const jsonString = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      hash = (hash << 5) - hash + jsonString.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(); // Ensure positive value
  }
  
  // Fetch IP address using a free API
  async function getIpAddress() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error fetching IP:", error);
      return "Unknown IP";
    }
  }
  
  // Handle verification button click
  document.getElementById("verify-btn").addEventListener("click", async () => {
    const deviceId = generateDeviceFingerprint();
    const ipAddress = await getIpAddress();
  
    const verificationData = {
      device_id: deviceId,
      ip_address: ipAddress,
    };
  
    // Send data back to Telegram and close the Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(verificationData));
      window.Telegram.WebApp.close();
    } else {
      console.error("Telegram WebApp API not available");
    }
  });
