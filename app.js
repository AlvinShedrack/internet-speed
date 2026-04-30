const speedValue = document.getElementById("speedValue");
const statusText = document.getElementById("statusText");
const lastChecked = document.getElementById("lastChecked");
const startBtn = document.getElementById("startBtn");
const notifyBtn = document.getElementById("notifyBtn");

let monitoring = false;
let intervalId = null;

// Test file from Cloudflare speed endpoint
const TEST_FILE_URL = "https://speed.cloudflare.com/__down?bytes=1000000";

async function checkSpeed() {
  try {
    statusText.textContent = "Testing speed...";

    const startTime = performance.now();

    const response = await fetch(`${TEST_FILE_URL}&cacheBust=${Date.now()}`, {
      cache: "no-store"
    });

    const data = await response.blob();

    const endTime = performance.now();

    const durationSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = data.size * 8;
    const speedMbps = bitsLoaded / durationSeconds / 1024 / 1024;

    const finalSpeed = speedMbps.toFixed(2);

    speedValue.textContent = finalSpeed;
    statusText.textContent = getSpeedStatus(speedMbps);
    lastChecked.textContent = new Date().toLocaleTimeString();

    updateNotification(finalSpeed);

  } catch (error) {
    statusText.textContent = "Unable to test speed";
    speedValue.textContent = "--";
    console.error(error);
  }
}

function getSpeedStatus(speed) {
  if (speed < 2) return "Very slow";
  if (speed < 5) return "Slow";
  if (speed < 15) return "Fair";
  if (speed < 30) return "Good";
  return "Excellent";
}

async function updateNotification(speed) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = "Internet Speed Monitor";
  const options = {
    body: `Current speed: ${speed} Mbps`,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "speed-monitor",
    renotify: true
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
}

startBtn.addEventListener("click", () => {
  if (!monitoring) {
    monitoring = true;
    startBtn.textContent = "Stop Monitoring";

    checkSpeed();
    intervalId = setInterval(checkSpeed, 30000);
  } else {
    monitoring = false;
    startBtn.textContent = "Start Monitoring";

    clearInterval(intervalId);
    statusText.textContent = "Stopped";
  }
});

notifyBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Notifications are not supported on this browser.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    alert("Notifications enabled.");
    checkSpeed();
  } else {
    alert("Notification permission was not granted.");
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}