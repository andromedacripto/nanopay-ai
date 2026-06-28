"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationState } from "@/types";

interface NotificationListProps {
  notifications: NotificationState[];
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: "border-success/20 bg-success/10 text-success",
  error: "border-error/20 bg-error-bg text-error-light",
  info: "border-brand-blue/20 bg-brand-blue/10 text-brand-blue",
  warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: NotificationState;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 shadow-card",
        STYLES[notification.type]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{notification.message}</p>
      <button
        onClick={() => onDismiss(notification.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export default function NotificationList({
  notifications,
  onDismiss,
}: NotificationListProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
