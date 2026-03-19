import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { OnboardingStackParams } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParams, 'OnboardingEventDate'>;
  route: RouteProp<OnboardingStackParams, 'OnboardingEventDate'>;
};

export default function OnboardingEventDateScreen({ navigation, route }: Props) {
  const [eventName, setEventName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [skipDate, setSkipDate] = useState(false);

  const getEventDate = (): string | undefined => {
    if (skipDate) return undefined;
    if (month && day && year && year.length === 4) {
      const m = month.padStart(2, '0');
      const d = day.padStart(2, '0');
      return `${year}-${m}-${d}`;
    }
    return undefined;
  };

  const canContinue = eventName.trim().length > 0 && (skipDate || getEventDate());

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Tell us about{'\n'}your big day</Text>
        <Text style={styles.subtitle}>We'll use this to build your planning timeline.</Text>

        {/* Event name */}
        <View style={styles.field}>
          <Text style={styles.label}>What's the name for your event?</Text>
          <TextInput
            style={styles.input}
            value={eventName}
            onChangeText={setEventName}
            placeholder="e.g. Emily & Charles's Wedding"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        {/* Date */}
        {!skipDate && (
          <View style={styles.field}>
            <Text style={styles.label}>Wedding date</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={month}
                onChangeText={t => setMonth(t.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="MM"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.dateSep}>/</Text>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={day}
                onChangeText={t => setDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.dateSep}>/</Text>
              <TextInput
                style={[styles.input, styles.yearInput]}
                value={year}
                onChangeText={t => setYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="YYYY"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.skipRow}
          onPress={() => setSkipDate(!skipDate)}
        >
          <View style={[styles.checkbox, skipDate && styles.checkboxActive]}>
            {skipDate && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.skipText}>I don't have a date yet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={() => {
            if (!canContinue) return;
            navigation.navigate('OnboardingEventScale', {
              eventType: route.params.eventType,
              eventDate: getEventDate(),
              eventName: eventName.trim(),
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sizes.xxxl * 1.2,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  field: { marginBottom: Spacing.xl },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateInput: { flex: 1, textAlign: 'center', paddingHorizontal: Spacing.sm },
  yearInput: { flex: 1.5, textAlign: 'center' },
  dateSep: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: Radius.sm,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: Typography.weights.bold },
  skipText: { fontSize: Typography.sizes.md, color: Colors.textSecondary },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: 'auto' as any,
  },
  buttonDisabled: { backgroundColor: Colors.primaryLight },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
});
