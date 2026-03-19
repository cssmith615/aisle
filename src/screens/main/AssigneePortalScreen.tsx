import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { WeddingPartyMember, ChecklistItem } from '../../types';
import { useEventStore } from '../../store/eventStore';

export default function AssigneePortalScreen() {
  const navigation = useNavigation();
  const { getAssigneeTasks } = useEventStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [member, setMember] = useState<WeddingPartyMember | null>(null);
  const [tasks, setTasks] = useState<ChecklistItem[]>([]);
  const [eventName, setEventName] = useState('');

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    const result = await getAssigneeTasks(code.trim().toUpperCase());
    if (result.error) {
      setError(result.error);
    } else {
      setMember(result.member!);
      setTasks(result.tasks!);
      setEventName(result.eventName ?? '');
    }
    setLoading(false);
  };

  const handleToggle = async (task: ChecklistItem) => {
    const newVal = !task.is_completed;
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null } : t
    ));
    await supabase
      .from('checklist_items')
      .update({ is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null })
      .eq('id', task.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const done = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  if (member) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setMember(null); setTasks([]); setCode(''); }}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{member.name}'s Tasks</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressEventName}>{eventName}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{done} of {tasks.length} complete</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.taskRow} onPress={() => handleToggle(item)} activeOpacity={0.7}>
              <View style={[styles.checkbox, item.is_completed && styles.checkboxDone]}>
                {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, item.is_completed && styles.taskTitleDone]}>
                  {item.title}
                </Text>
                {item.due_date && !item.is_completed && (
                  <Text style={styles.taskDue}>
                    Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>No tasks assigned yet</Text>
              <Text style={styles.emptyText}>Check back later — the couple will assign tasks soon.</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.lookupContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.lookupEmoji}>💍</Text>
        <Text style={styles.lookupTitle}>Enter your code</Text>
        <Text style={styles.lookupText}>
          Your wedding couple sent you a unique code. Enter it here to view and complete your assigned tasks.
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={t => setCode(t.toUpperCase())}
          placeholder="e.g. A1B2C3D4"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.lookupBtn, (!code.trim() || loading) && { opacity: 0.4 }]}
          onPress={handleLookup}
          disabled={!code.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.lookupBtnText}>View My Tasks</Text>
          }
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  back: { fontSize: Typography.sizes.md, color: Colors.primary, width: 60 },
  headerTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  lookupContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  lookupEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  lookupTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  lookupText: { fontSize: Typography.sizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.sizes.md * 1.6, marginBottom: Spacing.xl },
  codeInput: { width: '100%', backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, fontSize: Typography.sizes.xxl, color: Colors.textPrimary, textAlign: 'center', letterSpacing: 4, fontWeight: Typography.weights.bold, marginBottom: Spacing.md },
  errorText: { color: Colors.error, fontSize: Typography.sizes.sm, marginBottom: Spacing.md },
  lookupBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxxl, width: '100%', alignItems: 'center' },
  lookupBtnText: { color: Colors.white, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  progressCard: { backgroundColor: Colors.white, margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.md },
  progressEventName: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressText: { fontSize: Typography.sizes.md, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  progressPct: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.primary },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: Radius.full },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: Radius.full },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: Typography.weights.bold },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: Typography.sizes.md, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  taskTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  taskDue: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center' },
});
