import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import API from "../../services/api";
import { getSocket } from "../services/socketService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Holds whatever the UI wants to show as a transient toast for the
  // most recent live notification. Null when there's nothing to show.
  // A screen-level <Toast/> component reads this and clears it after
  // its own animation/timeout — this context only ever SETS it.
  const [toast, setToast] = useState(null);

  // Tracks whether we've already done the initial unread-count fetch
  // for this login session, so re-renders don't refetch unnecessarily.
  const hasFetchedInitialCount = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await API.get("/notifications/unread-count");
      setUnreadCount(res.data?.count ?? 0);
    } catch (err) {
      console.log("fetchUnreadCount error:", err?.response?.data || err.message);
    }
  }, []);

  // page=1 always replaces the list (pull-to-refresh / first open).
  // page>1 appends (infinite scroll). Mirrors the hasMore/page shape
  // returned by GET /api/notifications.
  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get("/notifications", { params: { page } });
      const fetched = res.data?.notifications || [];
      setNotifications((prev) => (page === 1 ? fetched : [...prev, ...fetched]));
      return res.data; // { notifications, page, hasMore, total }
    } catch (err) {
      console.log("fetchNotifications error:", err?.response?.data || err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.log("markAsRead error:", err?.response?.data || err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await API.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log("markAllAsRead error:", err?.response?.data || err.message);
    }
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  // ── Reset on logout ──────────────────────────────────────────────────
  // AuthContext.logout() already calls disconnectSocket() itself — we
  // never touch the socket connection here, only our own local state.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      setToast(null);
      hasFetchedInitialCount.current = false;
    }
  }, [isAuthenticated]);

  // ── Fetch initial count once per login session ──────────────────────
  useEffect(() => {
    if (isAuthenticated && !hasFetchedInitialCount.current) {
      hasFetchedInitialCount.current = true;
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // ── Attach the live socket listener ──────────────────────────────────
  // connectSocket() is called inside AuthContext (on login AND on
  // bootstrap restore), both of which happen async relative to when
  // this provider mounts. getSocket() can legitimately return null for
  // a moment. Keying this effect on `isAuthenticated` means it re-runs
  // right after AuthContext flips that flag, by which point connectSocket
  // has already been called — so the socket reliably exists by then.
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const onNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setToast(notification); // latest one wins; toast UI shows + auto-dismisses
    };

    socket.on("new_notification", onNewNotification);

    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      loading,
      toast,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      clearToast,
    }),
    [
      unreadCount,
      notifications,
      loading,
      toast,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      clearToast,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}