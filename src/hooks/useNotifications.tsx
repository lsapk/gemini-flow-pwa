
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    } else {
      // Fallback to toast
      toast({
        title,
        description: options?.body,
      });
    }
  };

  const sendProductivityReminder = () => {
    sendNotification('DeepFlow - Rappel productivité', {
      body: 'N\'oubliez pas de mettre à jour vos tâches et habitudes !',
      tag: 'productivity-reminder'
    });
  };

  const sendFocusReminder = () => {
    sendNotification('DeepFlow - Session focus', {
      body: 'Il est temps de prendre une pause ! Vous travaillez depuis longtemps.',
      tag: 'focus-reminder'
    });
  };

  const sendHabitReminder = (habitName: string) => {
    sendNotification('DeepFlow - Rappel habitude', {
      body: `N'oubliez pas votre habitude : ${habitName}`,
      tag: 'habit-reminder'
    });
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    sendProductivityReminder,
    sendFocusReminder,
    sendHabitReminder
  };
};
