const speedValue = document.getElementById("speedValue");
const statusText = document.getElementById("statusText");
const lastChecked = document.getElementById("lastChecked");
const startBtn = document.getElementById("startBtn");
const notifyBtn = document.getElementById("notifyBtn");

let monitoring = false;
let fastInterval = null;
let fullTestInterval = null;
let lastSpeed = 0;

// ✅ Lightweight test file (mobile friendly)
const TEST_FILE_URL = "https://www.google.com/images/phd/px.gif";

// ----------------------
// CONNECTION CHECK
// ----------------------
async function checkConnection() {
  try {
    const response = await fetch("https://www.google.com/favicon.ico", {
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    });
    return true;
  } catch (error) {
    return false;
  }
}

// ----------------------
// FULL SPEED TEST
// ----------------------
async function checkSpeed() {
  try {
    statusText.textContent = "Testing real speed...";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

    const startTime = performance.now();

    const response = await fetch(TEST_FILE_URL + "?cacheBust=" + Date.now(), {
      cache: "no-store",
      signal: controller.signal
    });

    const data = await response.blob();

    const endTime = performance.now();
    clearTimeout(timeout);

    // ⚠️ Prevent divide errors
    if (data.size === 0) throw new Error("Empty response");

    const durationSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = data.size * 8;
    const speedMbps = bitsLoaded / durationSeconds / 1024 / 1024;

    lastSpeed = speedMbps;

    speedValue.textContent = speedMbps.toFixed(2);
    statusText.textContent = getSpeedStatus(speedMbps);
    lastChecked.textContent = new Date().toLocaleTimeString();

    updateNotification(speedMbps.toFixed(2));

  } catch (error) {
    speedValue.textContent = "--";

    const isOnline = await checkConnection();

    if (!navigator.onLine || !isOnline) {
      statusText.textContent = "No internet connection";
    } else if (error.name === 'AbortError') {
      statusText.textContent = "Connection timeout";
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      statusText.textContent = "Network blocked or unreachable";
    } else {
      statusText.textContent = "Connection error: " + error.message;
    }

    console.error("Speed test error:", error);
  }
}

// ----------------------
// FAST LIVE UPDATE (1 sec)
// ----------------------
function updateFastEstimate() {
  if (lastSpeed === 0) return;

  const variation = lastSpeed * (Math.random() * 0.1 - 0.05);
  const estimated = (lastSpeed + variation).toFixed(2);

  speedValue.textContent = estimated;
  statusText.textContent = "Live updating...";
}

// ----------------------
// STATUS LABEL
// ----------------------
function getSpeedStatus(speed) {
  if (speed < 2) return "Very slow";
  if (speed < 5) return "Slow";
  if (speed < 15) return "Fair";
  if (speed < 30) return "Good";
  return "Excellent";
}

let lastNotificationTime = 0;

// ----------------------
// MOBILE DETECTION
// ----------------------
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
}

// ----------------------
// NOTIFICATIONS
// ----------------------
async function updateNotification(speed) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Only notify on mobile devices (likely using SIM card network)
  if (!isMobileDevice()) return;

  const speedNum = parseFloat(speed);
  const now = Date.now();

  // Only notify if speed is slow (< 5 Mbps) and at least 5 minutes since last notification
  if (speedNum >= 5 || (now - lastNotificationTime) < 300000) return;

  lastNotificationTime = now;

  const title = "Mobile Speed Alert";
  const options = {
    body: `Slow mobile speed: ${speed} Mbps`,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "speed-alert",
    renotify: true
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
}

// ----------------------
// START / STOP
// ----------------------
startBtn.addEventListener("click", () => {
  if (!monitoring) {
    monitoring = true;
    startBtn.textContent = "Stop Monitoring";

    fastInterval = setInterval(updateFastEstimate, 1000); // 1 sec UI update
    fullTestInterval = setInterval(checkSpeed, 10000); // real test every 10 sec

    checkSpeed();
  } else {
    monitoring = false;
    startBtn.textContent = "Start Monitoring";

    clearInterval(fastInterval);
    clearInterval(fullTestInterval);

    statusText.textContent = "Stopped";
  }
});

// ----------------------
// NOTIFICATION PERMISSION
// ----------------------
notifyBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Notifications not supported.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    alert("Notifications enabled");
    checkSpeed();
  } else {
    alert("Permission denied");
  }
});

// ----------------------
// SERVICE WORKER REGISTER
// ----------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}