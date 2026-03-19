import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ChecklistItem } from '../types';

// Keys
const KEY_TASK_REMINDERS = 'notif_task_reminders';
const KEY_TASK_DAYS_BEFORE = 'notif_task_days_before';
const KEY_COUNTDOWN = 'notif_countdown';
const KEY_MILESTONES = 'notif_milestones';
const KEY_RSVP_NUDGE = 'notif_rsvp_nudge';

export interface NotifPrefs {
  taskReminders: boolean;
  taskDaysBefore: number; // 1 | 3 | 7
  countdown: boolean;
  milestones: boolean;
  rsvpNudge: boolean;
}

export const DEFAULT_PREFS: NotifPrefs = {
  taskReminders: true,
  taskDaysBefore: 3,
  countdown: true,
  milestones: true,
  rsvpNudge: false,
};

// Dynamic require — static import crashes Expo Go on Android SDK 53+
// expo-notifications remote push is also unavailable in Expo Go — skip entirely
function isExpoGo(): boolean {
  try {
    const Constants = require('expo-constants').default;
    return Constants.appOwnership === 'expo';
  } catch { return false; }
}

function getNotifications(): (typeof import('expo-notifications')) | null {
  if (isExpoGo()) return null;
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch { return null; }
}

export async function loadPrefs(): Promise<NotifPrefs> {
  try {
    const [tr, td, cd, ms, rsvp] = await Promise.all([
      AsyncStorage.getItem(KEY_TASK_REMINDERS),
      AsyncStorage.getItem(KEY_TASK_DAYS_BEFORE),
      AsyncStorage.getItem(KEY_COUNTDOWN),
      AsyncStorage.getItem(KEY_MILESTONES),
      AsyncStorage.getItem(KEY_RSVP_NUDGE),
    ]);
    return {
      taskReminders: tr !== null ? tr === 'true' : DEFAULT_PREFS.taskReminders,
      taskDaysBefore: td !== null ? parseInt(td, 10) : DEFAULT_PREFS.taskDaysBefore,
      countdown: cd !== null ? cd === 'true' : DEFAULT_PREFS.countdown,
      milestones: ms !== null ? ms === 'true' : DEFAULT_PREFS.milestones,
      rsvpNudge: rsvp !== null ? rsvp === 'true' : DEFAULT_PREFS.rsvpNudge,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: NotifPrefs): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_TASK_REMINDERS, String(prefs.taskReminders)),
    AsyncStorage.setItem(KEY_TASK_DAYS_BEFORE, String(prefs.taskDaysBefore)),
    AsyncStorage.setItem(KEY_COUNTDOWN, String(prefs.countdown)),
    AsyncStorage.setItem(KEY_MILESTONES, String(prefs.milestones)),
    AsyncStorage.setItem(KEY_RSVP_NUDGE, String(prefs.rsvpNudge)),
  ]);
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  try {
    const Notifications = getNotifications();
    if (!Notifications) return 'undetermined';
    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export async function scheduleAll(
  prefs: NotifPrefs,
  checklistItems: ChecklistItem[],
  eventDate: string | null,
  eventName: string,
): Promise<number> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return 0;
    await Notifications.cancelAllScheduledNotificationsAsync();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    let scheduled = 0;
    const now = Date.now();

    // ── Task reminders ──────────────────────────────────────────────────────
    if (prefs.taskReminders) {
      const upcoming = checklistItems.filter(
        i => !i.is_completed && i.due_date
      );

      for (const item of upcoming) {
        const dueMs = new Date(item.due_date!).getTime();
        const triggerMs = dueMs - prefs.taskDaysBefore * 24 * 60 * 60 * 1000;

        if (triggerMs > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '📋 Wedding task due soon',
              body: `"${item.title}" is due in ${prefs.taskDaysBefore} day${prefs.taskDaysBefore !== 1 ? 's' : ''}`,
              data: { type: 'task', taskId: item.id },
            },
            trigger: { type: 'date', date: new Date(triggerMs) } as any,
          });
          scheduled++;
        }
      }
    }

    // ── Weekly countdown ─────────────────────────────────────────────────────
    if (prefs.countdown && eventDate) {
      const weddingMs = new Date(eventDate).getTime();
      const weeksOut = Math.floor((weddingMs - now) / (7 * 24 * 60 * 60 * 1000));

      // Schedule one notification per remaining week (cap at 52)
      const weeks = Math.min(weeksOut, 52);
      for (let w = 1; w <= weeks; w++) {
        const triggerMs = weddingMs - w * 7 * 24 * 60 * 60 * 1000;
        if (triggerMs > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `💍 ${w} week${w !== 1 ? 's' : ''} to go!`,
              body: `${eventName} is ${w} week${w !== 1 ? 's' : ''} away. Keep planning!`,
              data: { type: 'countdown' },
            },
            trigger: { type: 'date', date: new Date(triggerMs) } as any,
          });
          scheduled++;
        }
      }
    }

    // ── Milestone alerts ─────────────────────────────────────────────────────
    if (prefs.milestones && eventDate) {
      const weddingMs = new Date(eventDate).getTime();
      const milestones: { offset: number; title: string; body: string }[] = [
        {
          offset: 6 * 30 * 24 * 60 * 60 * 1000,
          title: '📅 6 months to go!',
          body: `${eventName} is 6 months away. Great time to book your photographer and venue.`,
        },
        {
          offset: 3 * 30 * 24 * 60 * 60 * 1000,
          title: '💌 3 months out!',
          body: 'Time to finalize your guest list and send invitations.',
        },
        {
          offset: 30 * 24 * 60 * 60 * 1000,
          title: '⏰ 1 month to go!',
          body: 'Confirm all vendors and get those final RSVPs in.',
        },
        {
          offset: 14 * 24 * 60 * 60 * 1000,
          title: '🌸 2 weeks!',
          body: 'Finalize your seating chart and confirm your day-of timeline.',
        },
        {
          offset: 7 * 24 * 60 * 60 * 1000,
          title: '🎊 1 week to go!',
          body: `${eventName} is almost here! Check your timeline and relax.`,
        },
        {
          offset: 24 * 60 * 60 * 1000,
          title: '💍 Tomorrow is the big day!',
          body: `${eventName} is tomorrow. Everything is ready — breathe and enjoy it. ✨`,
        },
      ];

      for (const m of milestones) {
        const triggerMs = weddingMs - m.offset;
        if (triggerMs > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: m.title,
              body: m.body,
              data: { type: 'milestone' },
            },
            trigger: { type: 'date', date: new Date(triggerMs) } as any,
          });
          scheduled++;
        }
      }
    }

    // ── RSVP nudge ───────────────────────────────────────────────────────────
    if (prefs.rsvpNudge && eventDate) {
      const weddingMs = new Date(eventDate).getTime();
      // Remind at 6 months, 3 months, 6 weeks before
      const nudgeOffsets = [
        6 * 30 * 24 * 60 * 60 * 1000,
        3 * 30 * 24 * 60 * 60 * 1000,
        6 * 7 * 24 * 60 * 60 * 1000,
      ];
      for (const offset of nudgeOffsets) {
        const triggerMs = weddingMs - offset;
        if (triggerMs > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '📬 RSVP check-in',
              body: 'Some guests haven\'t responded yet. Now\'s a good time to follow up!',
              data: { type: 'rsvp' },
            },
            trigger: { type: 'date', date: new Date(triggerMs) } as any,
          });
          scheduled++;
        }
      }
    }

    return scheduled;
  } catch {
    return 0;
  }
}
