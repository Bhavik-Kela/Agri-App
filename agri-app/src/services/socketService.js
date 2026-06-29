import { io } from "socket.io-client";

const SOCKET_URL = "http://10.121.163.109:5000"; // same host, no /api prefix

let socket = null;

/**
 * Call this once after the user logs in.
 * Passing the JWT lets the server's auth middleware verify the connection.
 */
export function connectSocket(token) {
  if (socket && socket.connected) return socket; // already connected

  socket = io(SOCKET_URL, {
    auth: { token },          // received as socket.handshake.auth.token on server
    transports: ["websocket"], // skip long-polling — React Native works fine with WS
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("[Socket] Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    // socket.io auto-reconnects unless reason === "io server disconnect"
    // (which means the server explicitly kicked the client, e.g. bad token)
  });

  return socket;
}

/** Returns the active socket instance, or null if not connected yet. */
export function getSocket() {
  return socket;
}

/** Call this on logout to cleanly close the connection. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}