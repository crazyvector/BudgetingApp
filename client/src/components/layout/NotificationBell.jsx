import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext.jsx";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2.5 rounded-xl bg-surface-800 text-text-muted hover:text-text-primary hover:bg-surface-700 transition-colors border border-border-light shadow-sm"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface-800"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-800 border border-border-light rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light flex justify-between items-center bg-surface-900/50">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm">
                No alerts at this time.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border-light">
                {notifications.map((alert) => (
                  <div key={alert.id} className="p-4 flex gap-3 hover:bg-surface-700/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {alert.type === "DANGER" && <AlertTriangle size={18} className="text-danger" />}
                      {alert.type === "WARNING" && <AlertCircle size={18} className="text-warning" />}
                      {alert.type === "INFO" && <Info size={18} className="text-brand-400" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold mb-0.5 ${
                        alert.type === 'DANGER' ? 'text-danger' : 
                        alert.type === 'WARNING' ? 'text-warning' : 'text-text-primary'
                      }`}>{alert.title}</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
