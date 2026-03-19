import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  Image, TextInput, Alert, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../store/eventStore';
import { MoodboardCategory, MoodboardItem, CreateMoodboardItemInput } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { value: MoodboardCategory; label: string; emoji: string }[] = [
  { value: 'dress',      label: 'Dress',       emoji: '👗' },
  { value: 'venue',      label: 'Venue',        emoji: '🏛️' },
  { value: 'florals',    label: 'Florals',      emoji: '🌸' },
  { value: 'colors',     label: 'Colors',       emoji: '🎨' },
  { value: 'cake',       label: 'Cake',         emoji: '🎂' },
  { value: 'hair_makeup',label: 'Hair & Makeup',emoji: '💄' },
  { value: 'decor',      label: 'Decor',        emoji: '✨' },
  { value: 'other',      label: 'Other',        emoji: '⭐' },
];

const catLabel = (cat: MoodboardCategory) =>
  CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];

const { width } = Dimensions.get('window');
const COLS = 2;
const TILE = (width - Spacing.lg * 2 - Spacing.sm) / COLS;

// ─── Add modal ────────────────────────────────────────────────────────────────

interface AddModalProps {
  eventId: string;
  visible: boolean;
  onClose: () => void;
}

function AddModal({ eventId, visible, onClose }: AddModalProps) {
  const { addMoodboardItem } = useEventStore();
  const palette = useTheme();

  const [urlInput, setUrlInput] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<MoodboardCategory>('other');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');

  const reset = () => {
    setUrlInput(''); setCaption(''); setCategory('other'); setPreview('');
  };

  const handlePreview = () => {
    const trimmed = urlInput.trim();
    if (trimmed.startsWith('http')) setPreview(trimmed);
  };

  const handlePickPhoto = async () => {
    try {
      const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access in Settings to pick photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPreview(result.assets[0].uri);
        setUrlInput(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleSave = async () => {
    const imageUrl = urlInput.trim();
    if (!imageUrl) { Alert.alert('Add a photo URL or pick from your library'); return; }

    setSaving(true);
    const input: CreateMoodboardItemInput = {
      event_id: eventId,
      image_url: imageUrl,
      category,
      caption: caption.trim() || undefined,
    };
    const { error } = await addMoodboardItem(input);
    setSaving(false);
    if (error) { Alert.alert('Error', error); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            <Text style={modal.title}>Add Inspiration</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[modal.save, { color: palette.primary }]}>{saving ? 'Saving…' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            {/* Image source */}
            <Text style={modal.label}>Photo</Text>
            <TouchableOpacity style={[modal.pickBtn, { borderColor: palette.primary }]} onPress={handlePickPhoto}>
              <Ionicons name="image-outline" size={20} color={palette.primary} />
              <Text style={[modal.pickBtnText, { color: palette.primary }]}>Pick from Camera Roll</Text>
            </TouchableOpacity>

            <Text style={[modal.label, { marginTop: Spacing.md }]}>Or paste an image URL</Text>
            <View style={modal.urlRow}>
              <TextInput
                style={[modal.input, { flex: 1 }]}
                placeholder="https://..."
                placeholderTextColor={Colors.textMuted}
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity style={[modal.previewBtn, { backgroundColor: palette.primary }]} onPress={handlePreview}>
                <Text style={modal.previewBtnText}>Preview</Text>
              </TouchableOpacity>
            </View>

            {preview ? (
              <Image source={{ uri: preview }} style={modal.previewImage} resizeMode="cover" />
            ) : null}

            <Text style={[modal.label, { marginTop: Spacing.md }]}>Category</Text>
            <View style={modal.chips}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[modal.chip, category === c.value && { backgroundColor: palette.primary }]}
                  onPress={() => setCategory(c.value)}
                >
                  <Text style={[modal.chipText, category === c.value && { color: Colors.white }]}>
                    {c.emoji} {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[modal.label, { marginTop: Spacing.md }]}>Caption (optional)</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Love this bouquet style"
              placeholderTextColor={Colors.textMuted}
              value={caption}
              onChangeText={setCaption}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  item: MoodboardItem | null;
  onClose: () => void;
  onDelete: (item: MoodboardItem) => void;
}

function DetailModal({ item, onClose, onDelete }: DetailModalProps) {
  if (!item) return null;
  const cat = catLabel(item.category);
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={detail.overlay}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={detail.topBar}>
            <TouchableOpacity onPress={onClose} style={detail.closeBtn}>
              <Ionicons name="close" size={26} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onDelete(item); onClose(); }} style={detail.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Image source={{ uri: item.image_url }} style={detail.image} resizeMode="contain" />
          <View style={detail.info}>
            <View style={detail.catRow}>
              <Text style={detail.catEmoji}>{cat.emoji}</Text>
              <Text style={detail.catName}>{cat.label}</Text>
            </View>
            {item.caption ? <Text style={detail.caption}>{item.caption}</Text> : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MoodboardScreen() {
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const palette = useTheme();
  const { activeEventId, moodboardItems, deleteMoodboardItem } = useEventStore();

  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<MoodboardItem | null>(null);
  const [filterCat, setFilterCat] = useState<MoodboardCategory | 'all'>('all');

  const filtered = filterCat === 'all'
    ? moodboardItems
    : moodboardItems.filter(m => m.category === filterCat);

  const handleDelete = (item: MoodboardItem) => {
    Alert.alert('Remove photo', 'Remove this from your moodboard?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMoodboardItem(item.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Inspiration Board</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: palette.primary }]}
          onPress={() => setShowAdd(true)}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Category filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {[{ value: 'all' as const, label: 'All', emoji: '🗂️' }, ...CATEGORIES].map(c => (
          <TouchableOpacity
            key={c.value}
            style={[styles.filterChip, filterCat === c.value && { backgroundColor: palette.primary }]}
            onPress={() => setFilterCat(c.value as any)}
          >
            <Text style={[styles.filterText, filterCat === c.value && { color: Colors.white }]}>
              {c.emoji} {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyTitle}>No inspiration yet</Text>
          <Text style={styles.emptySubtitle}>
            Save photos from the web or your camera roll to build your vision.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: palette.primary }]}
            onPress={() => setShowAdd(true)}
          >
            <Text style={styles.emptyBtnText}>Add First Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          numColumns={COLS}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.grid, { paddingBottom: bottom + 24 }]}
          renderItem={({ item }) => {
            const cat = catLabel(item.category);
            return (
              <TouchableOpacity
                style={styles.tile}
                onPress={() => setSelected(item)}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.image_url }} style={styles.tileImage} resizeMode="cover" />
                <View style={styles.tileBadge}>
                  <Text style={styles.tileBadgeText}>{cat.emoji} {cat.label}</Text>
                </View>
                {item.caption ? (
                  <View style={styles.tileCaption}>
                    <Text style={styles.tileCaptionText} numberOfLines={2}>{item.caption}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {activeEventId && (
        <AddModal
          eventId={activeEventId}
          visible={showAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 2 },
  screenTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  filterScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  grid: { padding: Spacing.lg, gap: Spacing.sm },
  columnWrapper: { gap: Spacing.sm, marginBottom: Spacing.sm },
  tile: {
    width: TILE,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  tileImage: { width: TILE, height: TILE },
  tileBadge: {
    position: 'absolute',
    top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  tileBadgeText: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  tileCaption: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
  },
  tileCaptionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.xl,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg,
  },
  emptyBtnText: { color: Colors.white, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.md },
});

const modal = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  cancel: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  save: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  body: { padding: Spacing.lg },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: 6 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.lg, borderStyle: 'dashed',
    padding: Spacing.md, justifyContent: 'center',
  },
  pickBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium },
  urlRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md, color: Colors.textPrimary,
  },
  previewBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  previewBtnText: { color: Colors.white, fontWeight: Typography.weights.medium, fontSize: Typography.sizes.sm },
  previewImage: {
    width: '100%', height: 180, borderRadius: Radius.lg,
    marginTop: Spacing.md, backgroundColor: Colors.cream,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
});

const detail = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  closeBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  image: { flex: 1, width: '100%' },
  info: {
    padding: Spacing.lg, paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  catEmoji: { fontSize: 20 },
  catName: { fontSize: Typography.sizes.md, color: Colors.white, fontWeight: Typography.weights.semibold },
  caption: { fontSize: Typography.sizes.md, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
});
