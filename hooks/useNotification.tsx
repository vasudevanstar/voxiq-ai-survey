import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const NotificationIcon: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-green-400" />,
  error: <XCircle size={20} className="text-red-400" />,
  info: <Info size={20} className="text-blue-400" />,
  warning: <AlertCircle size={20} className="text-yellow-400" />,
};

const NotificationStyles: Record<NotificationType, string> = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (
      message: string,
      type: NotificationType = 'info',
      duration: number = 5000
    ) => {
      const id = Date.now().toString();
      const notification: Notification = { id, message, type, duration };
      setNotifications(prev => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, addNotification, removeNotification };
};

export const NotificationContainer: React.FC<{
  notifications: Notification[];
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`glass p-4 rounded-xl border flex items-start gap-3 animate-slide-in-right ${
            NotificationStyles[notification.type]
          }`}
        >
          {NotificationIcon[notification.type]}
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => onRemove(notification.id)}
            className="text-xs hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
