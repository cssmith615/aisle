import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import {
  purchasePlan, restorePurchases, isPurchasesAvailable, PurchasableTier,
} from '../../utils/purchases';

const PLANS = [
  {
    id: 'premium' as PurchasableTier,
    name: 'Premium',
    price: '$7.99',
    period: '/month',
    color: Colors.primary,
    gradient: ['#C9A96E', '#A07840'] as [string, string],
    features: [
      'Unlimited checklist tasks',
      'Wedding party & task assignment',
      'Assignee portal for bridal party',
      'AI wedding assistant (unlimited)',
      'Advanced budget tracking',
      'Guest table assignments',
    ],
  },
  {
    id: 'pro' as PurchasableTier,
    name: 'Pro',
    price: '$19.99',
    period: '/month',
    color: '#9B59B6',
    gradient: ['#9B59B6', '#6C3483'] as [string, string],
    features: [
      'Everything in Premium',
      'Manage multiple client events',
      'Client management dashboard',
      'Client progress sharing',
      'Priority support',
      'Early access to new features',
    ],
  },
];

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const { profile, updateTier } = useAuthStore();
  const [selected, setSelected] = useState<PurchasableTier>('premium');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const currentTier = profile?.tier ?? 'free';
  const plan = PLANS.find(p => p.id === selected)!;
  const purchasesAvailable = isPurchasesAvailable();

  const handlePurchase = async () => {
    if (!purchasesAvailable) {
      Alert.alert(
        'Not Available in Expo Go',
        'In-app purchases require the full app build. Coming April 2026.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    const result = await purchasePlan(selected);
    setLoading(false);

    if (result.cancelled) return;

    if (result.success && result.tier) {
      await updateTier(result.tier);
      Alert.alert(
        '🎉 Welcome to ' + plan.name + '!',
        'Your plan has been activated. Enjoy all the features.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    if (!purchasesAvailable) {
      Alert.alert('Not Available', 'Purchase restore requires the full app build.');
      return;
    }

    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);

    if (result.success && result.tier && result.tier !== 'free') {
      await updateTier(result.tier);
      Alert.alert('Purchases Restored', `Your ${result.tier} plan has been restored.`);
    } else if (result.success) {
      Alert.alert('No Purchases Found', 'No active subscriptions were found for this account.');
    } else {
      Alert.alert('Restore Failed', result.error ?? 'Could not restore purchases.');
    }
  };

  const isCurrentPlan = currentTier === plan.id;
  // Pro includes premium — treat pro users as having premium too
  const alreadyHasAccess =
    isCurrentPlan ||
    (plan.id === 'premium' && currentTier === 'pro');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Aisle</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={plan.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>💍</Text>
          <Text style={styles.heroTitle}>Plan your perfect day</Text>
          <Text style={styles.heroSub}>Unlock every feature Aisle has to offer</Text>
        </LinearGradient>

        {/* Plan toggles */}
        <View style={styles.toggleRow}>
          {PLANS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.toggleBtn, selected === p.id && { backgroundColor: plan.color }]}
              onPress={() => setSelected(p.id)}
            >
              <Text style={[styles.toggleText, selected === p.id && { color: Colors.white }]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <Text style={[styles.price, { color: plan.color }]}>{plan.price}</Text>
          <Text style={styles.period}>{plan.period}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {plan.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={plan.color} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {alreadyHasAccess ? (
          <View style={[styles.ctaBtn, { backgroundColor: Colors.textMuted }]}>
            <Text style={styles.ctaText}>Current Plan</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: plan.color }]}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.ctaText}>Upgrade to {plan.name}</Text>
            }
          </TouchableOpacity>
        )}

        {/* Restore */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
          {restoring
            ? <ActivityIndicator size="small" color={Colors.textMuted} />
            : <Text style={styles.restoreText}>Restore Purchases</Text>
          }
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscriptions renew automatically. Cancel anytime in your App Store or Play Store settings.
          {'\n'}By subscribing you agree to our{' '}
          <Text style={{ color: Colors.primary }}>Terms of Service</Text>.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.md },
  heroTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.black, color: Colors.white, marginBottom: Spacing.sm },
  heroSub: { fontSize: Typography.sizes.md, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  toggleText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textMuted },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: 4,
  },
  price: { fontSize: 48, fontWeight: Typography.weights.black },
  period: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  featuresCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureText: { fontSize: Typography.sizes.md, color: Colors.textPrimary, flex: 1 },
  ctaBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaText: { color: Colors.white, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
  },
  restoreText: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  legalText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.sizes.xs * 1.6,
  },
});
