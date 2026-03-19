import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEventStore } from '../../store/eventStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { ChecklistItem, ChecklistCategory } from '../../types';
import { MainStackParams } from '../../navigation';

const PHASES: { months: number; label: string; sublabel: string }[] = [
  { months: 12, label: '12+ Months Out', sublabel: 'The big decisions' },
  { months: 9,  label: '9 Months Out',   sublabel: 'Lock in your team' },
  { months: 6,  label: '6 Months Out',   sublabel: 'Details & deposits' },
  { months: 4,  label: '4 Months Out',   sublabel: 'Invitations & fun stuff' },
  { months: 2,  label: '2 Months Out',   sublabel: 'Finalize everything' },
  { months: 1,  label: '1 Month Out',    sublabel: 'Almost there!' },
];

const CATEGORIES: { key: ChecklistCategory; label: string }[] = [
  { key: 'venue',         label: 'Venue' },
  { key: 'catering',      label: 'Catering' },
  { key: 'photography',   label: 'Photography' },
  { key: 'videography',   label: 'Videography' },
  { key: 'florals',       label: 'Florals' },
  { key: 'music',         label: 'Music' },
  { key: 'attire',        label: 'Attire' },
  { key: 'hair_makeup',   label: 'Hair & Makeup' },
  { key: 'cake',          label: 'Cake' },
  { key: 'invitations',   label: 'Invitations' },
  { key: 'transport',     label: 'Transport' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'honeymoon',     label: 'Honeymoon' },
  { key: 'favors',        label: 'Favors' },
  { key: 'officiant',     label: 'Officiant' },
  { key: 'legal',         label: 'Legal' },
  { key: 'other',         label: 'Other' },
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
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const { checklistItems, toggleChecklistItem, deleteChecklistItem, addChecklistItem, activeEventId, loadChecklist } = useEventStore();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = 60 + bottom;
  const palette = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleDelete = (item: ChecklistItem) => {
    Alert.alert(
      'Delete Task',
      `Remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteChecklistItem(item.id);
          },
        },
      ]
    );
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !activeEventId) return;
    if (newDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) {
      Alert.alert('Invalid Date', 'Use format YYYY-MM-DD');
      return;
    }
    setSaving(true);
    await addChecklistItem({
      event_id: activeEventId,
      title: newTitle.trim(),
      category: newCategory ?? undefined,
      due_date: newDueDate || undefined,
    });
    setSaving(false);
    setNewTitle('');
    setNewCategory(null);
    setNewDueDate('');
    setShowAddModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewTitle('');
    setNewCategory(null);
    setNewDueDate('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Checklist</Text>
          <Text style={styles.subtitle}>{completed} of {total} complete</Text>
        </View>
        <View style={[styles.pctBadge, { backgroundColor: palette.primary }]}>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: palette.primary }]} />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'todo', 'done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { borderColor: palette.primary, backgroundColor: palette.primary + '15' }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: palette.primary, fontWeight: Typography.weights.semibold }]}>
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
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
          <ChecklistRow
            item={item}
            palette={palette}
            onToggle={() => handleToggle(item.id)}
            onDelete={() => handleDelete(item)}
            onPress={() => navigation.navigate('ChecklistItemDetail', { itemId: item.id })}
          />
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: palette.primary, bottom: tabBarHeight - Spacing.md }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add task modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!newTitle.trim() || saving}
              style={{ opacity: !newTitle.trim() || saving ? 0.4 : 1 }}
            >
              {saving
                ? <ActivityIndicator color={palette.primary} />
                : <Text style={[styles.modalDone, { color: palette.primary }]}>Add</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.titleInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Task title"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                returnKeyType="done"
              />
            </View>

            <Text style={styles.fieldLabel}>Category (optional)</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(c => {
                const active = newCategory === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, active && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                    onPress={() => setNewCategory(active ? null : c.key)}
                  >
                    <Text style={[styles.chipText, active && { color: Colors.white }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Due Date (optional)</Text>
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.dateInput}
                value={newDueDate}
                onChangeText={setNewDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ChecklistRow({
  item, palette, onToggle, onDelete, onPress,
}: {
  item: ChecklistItem;
  palette: { primary: string };
  onToggle: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onDelete} activeOpacity={0.7}>
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation(); onToggle(); }}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, item.is_completed && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
          {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
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
      {item.is_custom && (
        <Ionicons name="pencil-outline" size={14} color={Colors.textMuted} style={{ marginLeft: 4 }} />
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
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  pctBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pctText: { color: Colors.white, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  progressWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: Radius.full },
  progressFill: { height: 6, borderRadius: Radius.full },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterTab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  list: { paddingHorizontal: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  sectionLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1 },
  sectionSub: { fontSize: Typography.sizes.xs, color: Colors.textMuted, flex: 1, textAlign: 'center' },
  sectionCount: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
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
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: Typography.weights.bold },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: Typography.sizes.md, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  rowTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  rowDue: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  categoryChip: {
    backgroundColor: Colors.cream,
    borderRadius: Radius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  categoryText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  modalWrap: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalCancel: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  modalTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  modalDone: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  modalScroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  fieldCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  titleInput: { fontSize: Typography.sizes.lg, color: Colors.textPrimary },
  dateInput: { fontSize: Typography.sizes.md, color: Colors.textPrimary },
  fieldLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
});
