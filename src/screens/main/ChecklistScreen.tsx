import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useEventStore } from '../../store/eventStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { ChecklistItem } from '../../types';

const PHASES: { months: number; label: string; sublabel: string }[] = [
  { months: 12, label: '12+ Months Out', sublabel: 'The big decisions' },
  { months: 9,  label: '9 Months Out',   sublabel: 'Lock in your team' },
  { months: 6,  label: '6 Months Out',   sublabel: 'Details & deposits' },
  { months: 4,  label: '4 Months Out',   sublabel: 'Invitations & fun stuff' },
  { months: 2,  label: '2 Months Out',   sublabel: 'Finalize everything' },
  { months: 1,  label: '1 Month Out',    sublabel: 'Almost there!' },
];

function getPhaseIndex(months_before: number | null): number {
  if (!months_before) return PHASES.length - 1;
  if (months_before >= 12) return 0;
  if (months_before >= 9)  return 1;
  if (months_before >= 6)  return 2;
  if (months_before >= 4)  return 3;
  if (months_before >= 2)  return 4;
  return 5;
}

export default function ChecklistScreen() {
  const { checklistItems, toggleChecklistItem, activeEventId, loadChecklist } = useEventStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  const onRefresh = async () => {
    if (!activeEventId) return;
    setRefreshing(true);
    await loadChecklist(activeEventId);
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'todo') return checklistItems.filter(i => !i.is_completed);
    if (filter === 'done') return checklistItems.filter(i => i.is_completed);
    return checklistItems;
  }, [checklistItems, filter]);

  const sections = useMemo(() => {
    const buckets: ChecklistItem[][] = PHASES.map(() => []);
    filtered.forEach(item => {
      const idx = getPhaseIndex(item.months_before);
      buckets[idx].push(item);
    });
    return PHASES.map((phase, i) => ({
      ...phase,
      data: buckets[i],
    })).filter(s => s.data.length > 0);
  }, [filtered]);

  const total = checklistItems.length;
  const completed = checklistItems.filter(i => i.is_completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleToggle = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleChecklistItem(id);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Checklist</Text>
          <Text style={styles.subtitle}>{completed} of {total} complete</Text>
        </View>
        <View style={styles.pctBadge}>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'todo', 'done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <Text style={styles.sectionSub}>{section.sublabel}</Text>
            <Text style={styles.sectionCount}>
              {section.data.filter(i => i.is_completed).length}/{section.data.length}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ChecklistRow item={item} onToggle={() => handleToggle(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>
              {filter === 'done' ? 'Nothing completed yet.' : 'All done!'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, item.is_completed && styles.checkboxDone]}>
        {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, item.is_completed && styles.rowTitleDone]}>
          {item.title}
        </Text>
        {item.due_date && !item.is_completed && (
          <Text style={styles.rowDue}>
            {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        )}
      </View>
      {item.category && (
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{item.category.replace(/_/g, ' ')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pctBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pctText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  progressWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  filterText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  filterTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  sectionCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },
  rowContent: { flex: 1 },
  rowTitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  rowTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  rowDue: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  categoryChip: {
    backgroundColor: Colors.cream,
    borderRadius: Radius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  categoryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
});
