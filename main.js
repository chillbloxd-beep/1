import { CLOSE_ROBLOX_CONFIG as CFG } from "./config.js";

const statusEl = document.getElementById("status");

let ws = null;
let confirmed = false;

function setStatus(text) {
  statusEl.textContent = text;
}

function wsUrl() {
  const base = CFG.WORKER_BASE_URL.trim()
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:")
    .replace(/\/$/, "");

  const qs = new URLSearchParams({
    key: CFG.API_KEY,
    role: "dashboard",
    deviceId: "close-roblox-auto-" + Math.random().toString(36).slice(2),
    deviceName: "Close Roblox Auto Page"
  });

  return `${base}/ws/${encodeURIComponent(CFG.ROOM_ID)}?${qs.toString()}`;
}

function send(obj) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(obj));
  return true;
}

function closeRoblox() {
  setStatus("Checking apps, redirecting...");

  send({ type: "presence" });

  for (const name of CFG.PROCESS_NAMES) {
    const msg = {
      type: "command",
      id: "close-roblox-" + crypto.randomUUID(),
      command: {
        type: "WINDOWS_CLOSE_PROCESS",
        payload: { name }
      }
    };

    if (CFG.TARGET_DEVICE_ID) {
      msg.targetDeviceId = CFG.TARGET_DEVICE_ID;
    }

    send(msg);
  }

  setTimeout(redirect, CFG.MAX_WAIT_BEFORE_REDIRECT_MS || 20);
}

function redirect() {
  window.location.href = CFG.REDIRECT_URL || "https://www.google.com/";
}

function connect() {
  setStatus("Checking apps, redirecting...");

  try {
    if (ws) ws.close();
  } catch {}

  ws = new WebSocket(wsUrl());

  ws.onopen = () => {
    setTimeout(closeRoblox, 100);
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "command-result" && !confirmed) {
        confirmed = true;
        setTimeout(redirect, 100);
      }
    } catch {}
  };

  ws.onerror = () => {
    setTimeout(redirect, 100);
  };

  ws.onclose = () => {
    setTimeout(redirect, 100);
  };
}

connect();
