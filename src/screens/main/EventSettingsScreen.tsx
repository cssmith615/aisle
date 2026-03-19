import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { PALETTES, getPalette } from '../../theme/palettes';
import { MainStackParams } from '../../navigation';

type RouteProps = RouteProp<MainStackParams, 'EventSettings'>;

export default function EventSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { eventId } = route.params;
  const { events, updateEvent } = useEventStore();

  const event = events.find(e => e.id === eventId);

  const [eventName, setEventName] = useState(event?.event_name ?? '');
  const [eventDate, setEventDate] = useState(event?.event_date ?? '');
  const [venueName, setVenueName] = useState(event?.venue_name ?? '');
  const [budget, setBudget] = useState(event?.total_budget?.toString() ?? '');
  const [selectedPalette, setSelectedPalette] = useState((event as any)?.theme_palette ?? 'gold');
  const [saving, setSaving] = useState(false);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!eventName.trim()) {
      Alert.alert('Required', 'Please enter a wedding name.');
      return;
    }

    // Validate date format if provided
    if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      Alert.alert('Invalid Date', 'Please enter the date as YYYY-MM-DD (e.g. 2026-06-14).');
      return;
    }

    setSaving(true);
    const { error } = await updateEvent(eventId, {
      event_name: eventName.trim(),
      event_date: eventDate || null,
      venue_name: venueName.trim() || null,
      total_budget: budget ? parseFloat(budget) : null,
      theme_palette: selectedPalette,
    } as any);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Saved', 'Wedding details updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wedding Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event</Text>

          <View style={styles.fieldCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Wedding Name</Text>
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g. Emily & Charles's Wedding"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.label}>Wedding Date</Text>
              <TextInput
                style={styles.input}
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.label}>Venue</Text>
              <TextInput
                style={styles.input}
                value={venueName}
                onChangeText={setVenueName}
                placeholder="Venue name (optional)"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>

          <View style={styles.fieldCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Total Budget</Text>
              <View style={styles.budgetRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wedding Colors</Text>
          <Text style={styles.paletteHint}>Choose a color palette that matches your wedding theme</Text>
          <View style={styles.paletteGrid}>
            {PALETTES.map(p => {
              const isSelected = selectedPalette === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.paletteCard, isSelected && { borderColor: p.primary, borderWidth: 2 }]}
                  onPress={() => setSelectedPalette(p.id)}
                >
                  <View style={styles.swatchRow}>
                    {p.preview.map((color, i) => (
                      <View key={i} style={[styles.swatch, { backgroundColor: color }]} />
                    ))}
                  </View>
                  <Text style={[styles.paletteName, isSelected && { color: p.primary, fontWeight: Typography.weights.bold }]}>
                    {p.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.paletteCheck, { backgroundColor: p.primary }]}>
                      <Text style={styles.paletteCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} />
            : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )
          }
        </TouchableOpacity>

        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.archiveBtn}
            onPress={() => Alert.alert(
              'Archive Wedding',
              'This will hide the wedding from your dashboard. You can restore it later from your account settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Archive', style: 'destructive',
                  onPress: async () => {
                    await updateEvent(eventId, { is_archived: true });
                    navigation.goBack();
                  },
                },
              ]
            )}
          >
            <Ionicons name="archive-outline" size={18} color={Colors.error} />
            <Text style={styles.archiveBtnText}>Archive Wedding</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textMuted, fontSize: Typography.sizes.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  back: { fontSize: Typography.sizes.md, color: Colors.primary, width: 60 },
  headerTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl, paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  fieldCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: Typography.sizes.md, color: Colors.textMuted, marginRight: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  saveBtnText: { color: Colors.white, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  paletteHint: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  paletteCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  swatchRow: { flexDirection: 'row', gap: 4, marginBottom: Spacing.sm },
  swatch: { flex: 1, height: 20, borderRadius: 4 },
  paletteName: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  paletteCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteCheckText: { color: Colors.white, fontSize: 11, fontWeight: Typography.weights.bold },
  dangerSection: { marginBottom: Spacing.lg },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  archiveBtnText: { fontSize: Typography.sizes.md, color: Colors.error, fontWeight: Typography.weights.medium },
});
