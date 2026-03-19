import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../theme';
import { OnboardingStackParams } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import { useEventStore } from '../../store/eventStore';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParams, 'OnboardingGenerating'>;
  route: RouteProp<OnboardingStackParams, 'OnboardingGenerating'>;
};

const STEPS = [
  'Building your timeline...',
  'Adding checklist items...',
  'Setting up your budget...',
  'Almost ready...',
];

export default function OnboardingGeneratingScreen({ navigation, route }: Props) {
  const { eventType, eventDate, guestCount, budget } = route.params;
  const eventName = (route.params as any).eventName ?? 'Our Wedding';
  const { user, profile, updateProfile } = useAuthStore();
  const { createEvent, seedChecklistFromTemplate, setActiveEvent } = useEventStore();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const stepIndex = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Run the setup
    setup();
  }, []);

  const setup = async () => {
    if (!user || !profile) return;

    const result = await createEvent(
      {
        event_type: eventType as any,
        event_name: eventName,
        event_date: eventDate,
        guest_count_estimate: guestCount,
        total_budget: budget,
      },
      user.id,
      profile.tier
    );

    if (result.id) {
      await seedChecklistFromTemplate(result.id, eventDate ?? null);
      await setActiveEvent(result.id);
      await updateProfile({ onboarding_done: true });
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />
        <View style={styles.center}>
          <Text style={styles.emoji}>💍</Text>
        </View>

        <Text style={styles.title}>Building your{'\n'}planning timeline</Text>
        <Text style={styles.subtitle}>
          We're creating a personalized checklist{'\n'}for {eventName}.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepDot}>•</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    borderTopColor: Colors.primary,
    marginBottom: Spacing.xl,
  },
  center: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  emoji: { fontSize: 48 },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: Typography.sizes.xxxl * 1.2,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: Typography.sizes.md * 1.6,
  },
  steps: { gap: Spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepDot: { color: Colors.primary, fontSize: Typography.sizes.lg },
  stepText: { color: Colors.textSecondary, fontSize: Typography.sizes.md },
});
