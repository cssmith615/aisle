import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, SectionList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../store/eventStore';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { SongMoment, CreateSongInput } from '../../types';

// ─── Moment config ────────────────────────────────────────────────────────────

const MOMENTS: { value: SongMoment; label: string; emoji: string }[] = [
  { value: 'processional',   label: 'Processional',     emoji: '🚶' },
  { value: 'first_dance',    label: 'First Dance',       emoji: '💃' },
  { value: 'father_daughter',label: "Father / Daughter", emoji: '👨‍👧' },
  { value: 'mother_son',     label: 'Mother / Son',      emoji: '👩‍👦' },
  { value: 'cocktail_hour',  label: 'Cocktail Hour',     emoji: '🥂' },
  { value: 'reception',      label: 'Reception',         emoji: '🎉' },
  { value: 'last_dance',     label: 'Last Dance',        emoji: '🌙' },
  { value: 'recessional',    label: 'Recessional',       emoji: '🎊' },
  { value: 'other',          label: 'Other',             emoji: '🎵' },
];

const momentLabel = (m: SongMoment) => MOMENTS.find(x => x.value === m)?.label ?? m;
const momentEmoji = (m: SongMoment) => MOMENTS.find(x => x.value === m)?.emoji ?? '🎵';

const MOMENT_ORDER: SongMoment[] = [
  'processional', 'first_dance', 'father_daughter', 'mother_son',
  'cocktail_hour', 'reception', 'last_dance', 'recessional', 'other',
];

// ─── Add modal ────────────────────────────────────────────────────────────────

interface AddModalProps {
  eventId: string;
  visible: boolean;
  onClose: () => void;
  defaultMoment?: SongMoment;
}

function AddModal({ eventId, visible, onClose, defaultMoment = 'reception' }: AddModalProps) {
  const { addSong } = useEventStore();
  const palette = useTheme();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [moment, setMoment] = useState<SongMoment>(defaultMoment);
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setArtist(''); setMoment(defaultMoment); };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Song title required'); return; }
    setSaving(true);
    const input: CreateSongInput = {
      event_id: eventId,
      title: title.trim(),
      artist: artist.trim() || undefined,
      moment,
    };
    const { error } = await addSong(input);
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
            <Text style={modal.title}>Add Song</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[modal.save, { color: palette.primary }]}>{saving ? 'Saving…' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            <Text style={modal.label}>Song Title</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Can't Help Falling in Love"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <Text style={modal.label}>Artist (optional)</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Elvis Presley"
              placeholderTextColor={Colors.textMuted}
              value={artist}
              onChangeText={setArtist}
            />

            <Text style={modal.label}>Moment</Text>
            <View style={modal.chips}>
              {MOMENTS.map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[modal.chip, moment === m.value && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                  onPress={() => setMoment(m.value)}
                >
                  <Text style={[modal.chipText, moment === m.value && { color: Colors.white }]}>
                    {m.emoji} {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SongWishlistScreen() {
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const palette = useTheme();
  const { activeEventId, songs, deleteSong } = useEventStore();
  const [showAdd, setShowAdd] = useState(false);
  const [addMoment, setAddMoment] = useState<SongMoment>('reception');

  const sections = useMemo(() => {
    return MOMENT_ORDER
      .map(m => ({ title: m, data: songs.filter(s => s.moment === m) }))
      .filter(s => s.data.length > 0);
  }, [songs]);

  const totalSongs = songs.length;

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Remove Song', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteSong(id) },
    ]);
  };

  const handleAddForMoment = (m: SongMoment) => {
    setAddMoment(m);
    setShowAdd(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Song Wishlist</Text>
          {totalSongs > 0 && (
            <Text style={styles.subtitle}>{totalSongs} song{totalSongs !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={{ width: 32 }} />
      </View>

      {songs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyTitle}>No songs yet</Text>
          <Text style={styles.emptySubtitle}>Build your wishlist by moment — from the processional to the last dance.</Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: palette.primary }]}
            onPress={() => { setAddMoment('reception'); setShowAdd(true); }}
          >
            <Text style={styles.emptyBtnText}>Add First Song</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottom + 100 }]}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{momentEmoji(section.title as SongMoment)}</Text>
              <Text style={styles.sectionTitle}>{momentLabel(section.title as SongMoment)}</Text>
              <TouchableOpacity
                style={[styles.sectionAddBtn, { borderColor: palette.primary }]}
                onPress={() => handleAddForMoment(section.title as SongMoment)}
              >
                <Ionicons name="add" size={16} color={palette.primary} />
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.songRow}
              onLongPress={() => handleDelete(item.id, item.title)}
              activeOpacity={0.75}
            >
              <View style={[styles.musicIcon, { backgroundColor: palette.primary + '18' }]}>
                <Ionicons name="musical-note" size={16} color={palette.primary} />
              </View>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle}>{item.title}</Text>
                {item.artist ? <Text style={styles.songArtist}>{item.artist}</Text> : null}
              </View>
              <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* FAB */}
      {songs.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: palette.primary, bottom: bottom + 24 }]}
          onPress={() => { setAddMoment('reception'); setShowAdd(true); }}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}

      {activeEventId && (
        <AddModal
          eventId={activeEventId}
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          defaultMoment={addMoment}
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
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 1,
  },
  listContent: { padding: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  musicIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: { flex: 1 },
  songTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  songArtist: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  separator: { height: Spacing.sm },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
});
