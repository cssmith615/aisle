import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../store/eventStore';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { CreateRegistryInput } from '../../types';

// ─── Popular store presets ────────────────────────────────────────────────────

const STORE_PRESETS = [
  { name: 'Zola',              emoji: '💍' },
  { name: 'The Knot',         emoji: '🎀' },
  { name: 'Amazon',           emoji: '📦' },
  { name: 'Target',           emoji: '🎯' },
  { name: 'Crate & Barrel',   emoji: '🏺' },
  { name: 'Williams-Sonoma',  emoji: '🍳' },
  { name: 'Pottery Barn',     emoji: '🏡' },
  { name: "Bed Bath & Beyond",emoji: '🛁' },
  { name: "Macy's",           emoji: '🛍️' },
];

function storeEmoji(name: string): string {
  return STORE_PRESETS.find(p => p.name === name)?.emoji ?? '🔗';
}

// ─── Add modal ────────────────────────────────────────────────────────────────

interface AddModalProps {
  eventId: string;
  visible: boolean;
  onClose: () => void;
}

function AddModal({ eventId, visible, onClose }: AddModalProps) {
  const { addRegistry } = useEventStore();
  const palette = useTheme();

  const [storeName, setStoreName] = useState('');
  const [customName, setCustomName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const reset = () => {
    setStoreName(''); setCustomName(''); setUrl(''); setNotes(''); setUseCustom(false);
  };

  const handleSave = async () => {
    const finalName = useCustom ? customName.trim() : storeName;
    if (!finalName) { Alert.alert('Store name required'); return; }
    if (!url.trim()) { Alert.alert('URL required'); return; }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setSaving(true);
    const input: CreateRegistryInput = {
      event_id: eventId,
      store_name: finalName,
      url: finalUrl,
      notes: notes.trim() || undefined,
    };
    const { error } = await addRegistry(input);
    setSaving(false);
    if (error) { Alert.alert('Error', error); return; }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={modal.safe} edges={['top', 'bottom']}>
          <View style={modal.header}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={modal.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={modal.title}>Add Registry</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[modal.save, { color: palette.primary }]}>{saving ? 'Saving…' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            <Text style={modal.label}>Store</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={modal.presetRow}
            >
              {STORE_PRESETS.map(p => (
                <TouchableOpacity
                  key={p.name}
                  style={[
                    modal.presetChip,
                    !useCustom && storeName === p.name && { backgroundColor: palette.primary, borderColor: palette.primary },
                  ]}
                  onPress={() => { setStoreName(p.name); setUseCustom(false); }}
                >
                  <Text style={[
                    modal.presetChipText,
                    !useCustom && storeName === p.name && { color: Colors.white },
                  ]}>
                    {p.emoji} {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  modal.presetChip,
                  useCustom && { backgroundColor: palette.primary, borderColor: palette.primary },
                ]}
                onPress={() => setUseCustom(true)}
              >
                <Text style={[modal.presetChipText, useCustom && { color: Colors.white }]}>Other</Text>
              </TouchableOpacity>
            </ScrollView>

            {useCustom && (
              <>
                <Text style={modal.label}>Store name</Text>
                <TextInput
                  style={modal.input}
                  placeholder="e.g. Pottery Barn Kids"
                  placeholderTextColor={Colors.textMuted}
                  value={customName}
                  onChangeText={setCustomName}
                />
              </>
            )}

            <Text style={modal.label}>Registry URL</Text>
            <TextInput
              style={modal.input}
              placeholder="https://www.zola.com/registry/yourname"
              placeholderTextColor={Colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={modal.label}>Notes (optional)</Text>
            <TextInput
              style={[modal.input, { height: 72, textAlignVertical: 'top' }]}
              placeholder="e.g. Prefer kitchen items"
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RegistriesScreen() {
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const palette = useTheme();
  const { activeEventId, registries, deleteRegistry } = useEventStore();
  const [showAdd, setShowAdd] = useState(false);

  const handleOpen = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Registry', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteRegistry(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Gift Registries</Text>
        <View style={{ width: 32 }} />
      </View>

      {registries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyTitle}>No registries yet</Text>
          <Text style={styles.emptySubtitle}>Add links to all your gift registries so your guests can find them easily.</Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: palette.primary }]}
            onPress={() => setShowAdd(true)}
          >
            <Text style={styles.emptyBtnText}>Add Registry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {registries.map(reg => (
            <TouchableOpacity
              key={reg.id}
              style={styles.card}
              onPress={() => handleOpen(reg.url)}
              onLongPress={() => handleDelete(reg.id, reg.store_name)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: palette.primary + '18' }]}>
                <Text style={styles.emoji}>{storeEmoji(reg.store_name)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.storeName}>{reg.store_name}</Text>
                <Text style={styles.urlText} numberOfLines={1}>{reg.url}</Text>
                {reg.notes ? <Text style={styles.noteText}>{reg.notes}</Text> : null}
              </View>
              <Ionicons name="open-outline" size={20} color={palette.primary} />
            </TouchableOpacity>
          ))}
          <Text style={styles.hint}>Long-press a registry to remove it</Text>
        </ScrollView>
      )}

      {/* FAB */}
      {registries.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: palette.primary, bottom: bottom + 24 }]}
          onPress={() => setShowAdd(true)}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}

      {activeEventId && (
        <AddModal
          eventId={activeEventId}
          visible={showAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  title: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  cardBody: { flex: 1 },
  storeName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  urlText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  noteText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  emptyBtnText: { color: Colors.white, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.md },
});

const modal = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  cancel: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  save: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  body: { padding: Spacing.lg, gap: Spacing.sm },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  presetChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});
