import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { OnboardingStackParams } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParams, 'OnboardingEventScale'>;
  route: RouteProp<OnboardingStackParams, 'OnboardingEventScale'>;
};

const GUEST_OPTIONS = ['Under 50', '50–100', '100–150', '150–200', '200+'];
const GUEST_VALUES = [30, 75, 125, 175, 250];

const BUDGET_OPTIONS = ['Under $10k', '$10–20k', '$20–35k', '$35–50k', '$50k+'];
const BUDGET_VALUES = [8000, 15000, 27500, 42500, 60000];

export default function OnboardingEventScaleScreen({ navigation, route }: Props) {
  const [guestIndex, setGuestIndex] = useState<number | null>(null);
  const [budgetIndex, setBudgetIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Guest count{'\n'}& budget</Text>
        <Text style={styles.subtitle}>Just estimates — you can update these anytime.</Text>

        {/* Guest count */}
        <View style={styles.section}>
          <Text style={styles.label}>Approximate guests</Text>
          <View style={styles.grid}>
            {GUEST_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, guestIndex === i && styles.chipActive]}
                onPress={() => setGuestIndex(i)}
              >
                <Text style={[styles.chipText, guestIndex === i && styles.chipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.label}>Approximate budget</Text>
          <View style={styles.grid}>
            {BUDGET_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, budgetIndex === i && styles.chipActive]}
                onPress={() => setBudgetIndex(i)}
              >
                <Text style={[styles.chipText, budgetIndex === i && styles.chipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            navigation.navigate('OnboardingGenerating', {
              eventType: route.params.eventType,
              eventDate: route.params.eventDate,
              eventName: (route.params as any).eventName,
              guestCount: guestIndex !== null ? GUEST_VALUES[guestIndex] : undefined,
              budget: budgetIndex !== null ? BUDGET_VALUES[budgetIndex] : undefined,
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Build My Checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('OnboardingGenerating', {
            eventType: route.params.eventType,
            eventDate: route.params.eventDate,
            eventName: (route.params as any).eventName,
          })}
        >
          <Text style={styles.skipText}>Skip for now</Text>
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
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
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
  section: { marginBottom: Spacing.xl },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  chipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  skipButton: { alignItems: 'center', marginTop: Spacing.lg },
  skipText: { color: Colors.textMuted, fontSize: Typography.sizes.md },
});
