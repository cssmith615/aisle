import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useEventStore } from '../../store/eventStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { MainStackParams } from '../../navigation';

export default function DashboardScreen() {
  const { profile } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const { events, checklistItems, expenses, guests, activeEventId, loadEvents, setActiveEvent } = useEventStore();

  const activeEvent = events.find(e => e.id === activeEventId);

  useEffect(() => {
    if (profile?.id) {
      loadEvents(profile.id).then(() => {
        const store = useEventStore.getState();
        if (store.events.length > 0 && !store.activeEventId) {
          setActiveEvent(store.events[0].id);
        }
      });
    }
  }, [profile?.id]);

  // Derived values
  const daysUntil = activeEvent?.event_date
    ? Math.ceil((new Date(activeEvent.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const totalTasks = checklistItems.length;
  const completedTasks = checklistItems.filter(i => i.is_completed).length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const budgetSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetTotal = activeEvent?.total_budget ?? 0;
  const budgetPct = budgetTotal > 0 ? Math.min(Math.round((budgetSpent / budgetTotal) * 100), 100) : 0;

  const attendingCount = guests.filter(g => g.rsvp_status === 'attending').length;
  const noResponseCount = guests.filter(g => g.rsvp_status === 'no_response').length;

  const urgentTasks = checklistItems
    .filter(i => !i.is_completed && i.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {profile?.display_name?.split(' ')[0]?.replace(/@.*/, '') ?? 'there'} 👋</Text>
          <Text style={styles.wordmark}>Aisle</Text>
        </View>

        {/* Hero countdown card */}
        <LinearGradient
          colors={['#C9A96E', '#A07840']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEventName}>{activeEvent?.event_name ?? 'Your Wedding'}</Text>
          {daysUntil !== null ? (
            <>
              <Text style={styles.heroDays}>{daysUntil}</Text>
              <Text style={styles.heroDaysLabel}>days to go</Text>
            </>
          ) : (
            <Text style={styles.heroNoDate}>Set your wedding date to start the countdown</Text>
          )}
          <View style={styles.heroProgressBar}>
            <View style={[styles.heroProgressFill, { width: `${completionPct}%` }]} />
          </View>
          <Text style={styles.heroProgressLabel}>{completionPct}% planned</Text>
        </LinearGradient>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
            <Text style={styles.statLabel}>Tasks done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {budgetTotal > 0 ? `$${Math.round(budgetSpent / 1000)}k` : '—'}
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendingCount}</Text>
            <Text style={styles.statLabel}>Attending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{noResponseCount}</Text>
            <Text style={styles.statLabel}>Awaiting RSVP</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('GuestList')}>
            <Text style={styles.quickEmoji}>👥</Text>
            <Text style={styles.quickLabel}>Guests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('AIAssistant')}>
            <Text style={styles.quickEmoji}>🤖</Text>
            <Text style={styles.quickLabel}>AI Assistant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.quickEmoji}>⚙️</Text>
            <Text style={styles.quickLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Urgent tasks */}
        {urgentTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Up next</Text>
            {urgentTasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskDot} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.due_date && (
                    <Text style={styles.taskDue}>
                      Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Budget bar */}
        {budgetTotal > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <View style={styles.budgetCard}>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetSpent}>${budgetSpent.toLocaleString()} spent</Text>
                <Text style={styles.budgetTotal}>of ${budgetTotal.toLocaleString()}</Text>
              </View>
              <View style={styles.budgetBar}>
                <View
                  style={[
                    styles.budgetFill,
                    { width: `${budgetPct}%` },
                    budgetPct > 90 && { backgroundColor: Colors.error },
                  ]}
                />
              </View>
              <Text style={styles.budgetRemaining}>
                ${(budgetTotal - budgetSpent).toLocaleString()} remaining
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  wordmark: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.black,
    color: Colors.primary,
    letterSpacing: 1,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  heroEventName: {
    fontSize: Typography.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  heroDays: {
    fontSize: 72,
    fontWeight: Typography.weights.black,
    color: Colors.white,
    lineHeight: 76,
  },
  heroDaysLabel: {
    fontSize: Typography.sizes.lg,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xl,
  },
  heroNoDate: {
    fontSize: Typography.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xl,
    lineHeight: Typography.sizes.md * 1.5,
  },
  heroProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  heroProgressFill: {
    height: 6,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
  },
  heroProgressLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  taskDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  taskDue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  budgetCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  budgetSpent: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  budgetTotal: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  budgetBar: {
    height: 8,
    backgroundColor: Colors.cream,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  budgetFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  quickEmoji: { fontSize: 24, marginBottom: 4 },
  quickLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  budgetRemaining: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});
