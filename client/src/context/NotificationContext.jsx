import { createContext, useContext, useState, useEffect } from "react";
import api from "../../api/client.js";

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function checkAlerts() {
    try {
      const [{ data: budgets }, { data: recurring }] = await Promise.all([
        api.get("/budgets/progress"),
        api.get("/recurring")
      ]);

      const alerts = [];

      // Check Budgets
      if (budgets && budgets.length > 0) {
        budgets.forEach(b => {
          if (b.limit > 0) {
            const ratio = b.spent / b.limit;
            if (ratio >= 1) {
              alerts.push({
                id: `budget_danger_${b.id}`,
                type: "DANGER",
                title: "Budget Exceeded!",
                message: `You have exceeded your ${b.category.name} budget by ${(b.spent - b.limit).toFixed(2)} RON.`,
                timestamp: new Date().toISOString()
              });
            } else if (ratio >= 0.8) {
              alerts.push({
                id: `budget_warn_${b.id}`,
                type: "WARNING",
                title: "Approaching Limit",
                message: `You spent ${(ratio * 100).toFixed(0)}% of your ${b.category.name} budget.`,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      }

      // Check recurring
      if (recurring && recurring.length > 0) {
        const soon = recurring.filter(r => {
           if(!r.active) return false;
           const daysDiff = (new Date(r.nextDate) - new Date()) / (1000 * 3600 * 24);
           return daysDiff >= 0 && daysDiff <= 3;
        });
        soon.forEach(r => {
          alerts.push({
            id: `rec_warn_${r.id}`,
            type: "INFO",
            title: "Upcoming Bill",
            message: `${r.description} (${r.amount} RON) is due in a few days.`,
            timestamp: new Date().toISOString()
          });
        });
      }

      // Sort by type priority DANGER > WARNING > INFO
      const priority = { DANGER: 3, WARNING: 2, INFO: 1 };
      alerts.sort((a, b) => priority[b.type] - priority[a.type]);

      setNotifications(alerts);
      
      // Calculate unread (for simplicity, we assume all are unread until the dropdown opens, or we can store read state in localStorage)
      const readState = JSON.parse(localStorage.getItem("readAlerts") || "[]");
      const unread = alerts.filter(a => !readState.includes(a.id)).length;
      setUnreadCount(unread);

    } catch (err) {
      console.error("Failed to check alerts:", err);
    }
  }

  useEffect(() => {
    checkAlerts();
  }, []);

  function markAllAsRead() {
    const ids = notifications.map(a => a.id);
    localStorage.setItem("readAlerts", JSON.stringify(ids));
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, checkAlerts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
