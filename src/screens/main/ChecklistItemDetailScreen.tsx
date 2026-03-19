import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useEventStore } from '../../store/eventStore';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { supabase } from '../../lib/supabase';
import { MainStackParams } from '../../navigation';

const CAT_CONFIG: Record<string, { label: string; emoji: string }> = {
  venue:          { label: 'Venue',          emoji: '🏛️' },
  catering:       { label: 'Catering',       emoji: '🍽️' },
  photography:    { label: 'Photography',    emoji: '📷' },
  videography:    { label: 'Videography',    emoji: '🎥' },
  florals:        { label: 'Florals',        emoji: '💐' },
  music:          { label: 'Music',          emoji: '🎵' },
  attire:         { label: 'Attire',         emoji: '👗' },
  hair_makeup:    { label: 'Hair & Makeup',  emoji: '💄' },
  cake:           { label: 'Cake',           emoji: '🎂' },
  invitations:    { label: 'Invitations',    emoji: '✉️' },
  transport:      { label: 'Transport',      emoji: '🚗' },
  accommodation:  { label: 'Accommodation',  emoji: '🏨' },
  honeymoon:      { label: 'Honeymoon',      emoji: '✈️' },
  favors:         { label: 'Favors',         emoji: '🎁' },
  officiant:      { label: 'Officiant',      emoji: '📖' },
  legal:          { label: 'Legal',          emoji: '⚖️' },
  rentals:        { label: 'Rentals',        emoji: '🪑' },
  other:          { label: 'Other',          emoji: '📌' },
};

type RouteType = RouteProp<MainStackParams, 'ChecklistItemDetail'>;

export default function ChecklistItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { itemId } = route.params;

  const { checklistItems, weddingParty, toggleChecklistItem, deleteChecklistItem, activeEventId, loadChecklist } = useEventStore();
  const palette = useTheme();
  const insets = useSafeAreaInsets();

  const item = useMemo(() => checklistItems.find(i => i.id === itemId), [checklistItems, itemId]);

  const [dueDateInput, setDueDateInput] = useState(item?.due_date ?? '');
  const [savingDate, setSavingDate] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Task not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backTextBtn}>
            <Text style={[styles.backTextBtnLabel, { color: palette.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const catCfg = item.category ? CAT_CONFIG[item.category] : null;
  const assignee = item.assigned_to_id ? weddingParty.find(m => m.id === item.assigned_to_id) : null;

  const formattedDueDate = item.due_date
    ? new Date(item.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Remove "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteChecklistItem(item.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSaveDueDate = async () => {
    if (dueDateInput && !/^\d{4}-\d{2}-\d{2}$/.test(dueDateInput)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD');
      return;
    }
    setSavingDate(true);
    await supabase
      .from('checklist_items')
      .update({ due_date: dueDateInput || null, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (activeEventId) await loadChecklist(activeEventId);
    setSavingDate(false);
  };

  const handleAssign = async (memberId: string | null) => {
    setSavingAssign(true);
    await supabase
      .from('checklist_items')
      .update({ assigned_to_id: memberId, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (activeEventId) await loadChecklist(activeEventId);
    setSavingAssign(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Detail</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderBtn}>
          <Text style={styles.deleteHeaderText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.taskTitle}>{item.title}</Text>

        {/* Status row */}
        <TouchableOpacity
          style={styles.statusRow}
          onPress={() => toggleChecklistItem(item.id)}
          activeOpacity={0.75}
        >
          <View style={[styles.bigCheckbox, item.is_completed && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
            {item.is_completed && <Ionicons name="checkmark" size={20} color={Colors.white} />}
          </View>
          <Text style={[styles.statusText, item.is_completed && { color: Colors.success }]}>
            {item.is_completed ? 'Completed' : 'Mark complete'}
          </Text>
        </TouchableOpacity>

        {/* Info cards */}
        <View style={styles.infoSection}>
          {/* Category */}
          {catCfg && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <View style={[styles.catChip, { borderColor: palette.primary, backgroundColor: palette.primary + '18' }]}>
                <Text style={styles.catEmoji}>{catCfg.emoji}</Text>
                <Text style={[styles.catChipText, { color: palette.primary }]}>{catCfg.label}</Text>
              </View>
            </View>
          )}

          {/* Due date */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due date</Text>
            <Text style={styles.infoValue}>
              {formattedDueDate ?? 'No due date'}
            </Text>
          </View>

          {/* Phase */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phase</Text>
            <Text style={styles.infoValue}>
              {item.months_before != null ? `${item.months_before} months before` : 'Custom task'}
            </Text>
          </View>

          {/* Assigned to */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned to</Text>
            <Text style={styles.infoValue}>
              {assignee ? assignee.name : 'Unassigned'}
            </Text>
          </View>

          {/* Custom badge */}
          {item.is_custom && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <View style={styles.customBadge}>
                <Ionicons name="pencil-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.customBadgeText}>Custom task</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description/notes */}
        {item.description ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{item.description}</Text>
          </View>
        ) : null}

        {/* Edit due date */}
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Edit Due Date</Text>
          <View style={styles.editRow}>
            <TextInput
              style={[styles.editInput, { flex: 1 }]}
              value={dueDateInput}
              onChangeText={setDueDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.editSaveBtn, { backgroundColor: palette.primary }]}
              onPress={handleSaveDueDate}
              disabled={savingDate}
            >
              {savingDate
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.editSaveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Assign to */}
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Assign To</Text>
          {savingAssign && <ActivityIndicator color={palette.primary} style={{ marginBottom: Spacing.sm }} />}
          <View style={styles.assignChips}>
            <TouchableOpacity
              style={[
                styles.assignChip,
                !item.assigned_to_id && { borderColor: palette.primary, backgroundColor: palette.primary + '18' },
              ]}
              onPress={() => handleAssign(null)}
            >
              <Text style={[styles.assignChipText, !item.assigned_to_id && { color: palette.primary, fontWeight: Typography.weights.semibold }]}>
                Unassigned
              </Text>
            </TouchableOpacity>
            {weddingParty.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.assignChip,
                  item.assigned_to_id === member.id && { borderColor: palette.primary, backgroundColor: palette.primary + '18' },
                ]}
                onPress={() => handleAssign(member.id)}
              >
                <Text style={[
                  styles.assignChipText,
                  item.assigned_to_id === member.id && { color: palette.primary, fontWeight: Typography.weights.semibold },
                ]}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {weddingParty.length === 0 && (
            <Text style={styles.noPartyText}>Add wedding party members to assign tasks.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  backTextBtn: { marginTop: Spacing.md },
  backTextBtnLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  deleteHeaderBtn: { padding: 4 },
  deleteHeaderText: { fontSize: Typography.sizes.md, color: Colors.error, fontWeight: Typography.weights.semibold },

  scroll: { padding: Spacing.lg },

  // Task title
  taskTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    lineHeight: Typography.sizes.xxl * 1.3,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  bigCheckbox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },

  // Info section
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  infoValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
    maxWidth: '60%',
    textAlign: 'right',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  catEmoji: { fontSize: 13 },
  catChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cream,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  customBadgeText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  // Notes
  notesCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  notesLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  notesText: { fontSize: Typography.sizes.md, color: Colors.textPrimary, lineHeight: Typography.sizes.md * 1.5 },

  // Edit sections
  editSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  editSectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  editRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  editInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  editSaveBtn: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  editSaveBtnText: { color: Colors.white, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.sm },

  // Assign chips
  assignChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  assignChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
  assignChipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  noPartyText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontStyle: 'italic' },
});
