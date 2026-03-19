import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView,
  Platform, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEventStore } from '../../store/eventStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Vendor, VendorStatus, ChecklistCategory, CreateVendorInput, PaymentMilestone } from '../../types';

const CATEGORIES: { key: ChecklistCategory; label: string; emoji: string }[] = [
  { key: 'venue',        label: 'Venue',         emoji: '🏛️' },
  { key: 'catering',     label: 'Catering',      emoji: '🍽️' },
  { key: 'photography',  label: 'Photography',   emoji: '📷' },
  { key: 'videography',  label: 'Videography',   emoji: '🎥' },
  { key: 'florals',      label: 'Florals',       emoji: '💐' },
  { key: 'music',        label: 'Music',         emoji: '🎵' },
  { key: 'attire',       label: 'Attire',        emoji: '👗' },
  { key: 'hair_makeup',  label: 'Hair & Makeup', emoji: '💄' },
  { key: 'cake',         label: 'Cake',          emoji: '🎂' },
  { key: 'invitations',  label: 'Invitations',   emoji: '✉️' },
  { key: 'transport',    label: 'Transport',     emoji: '🚗' },
  { key: 'officiant',    label: 'Officiant',     emoji: '📖' },
  { key: 'other',        label: 'Other',         emoji: '📌' },
];

const STATUS_CONFIG: Record<VendorStatus, { label: string; color: string; bg: string }> = {
  shortlisted: { label: 'Shortlisted', color: Colors.textMuted,    bg: Colors.cream },
  contacted:   { label: 'Contacted',   color: Colors.warning,      bg: '#FFF8E1' },
  booked:      { label: 'Booked',      color: Colors.success,      bg: '#EDF7EE' },
  cancelled:   { label: 'Cancelled',   color: Colors.error,        bg: '#FDECEA' },
};

export default function VendorsScreen() {
  const { vendors, activeEventId, loadVendors, addVendor, updateVendor, deleteVendor } = useEventStore();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = 60 + bottom;
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [filterStatus, setFilterStatus] = useState<VendorStatus | 'all'>('all');

  const onRefresh = async () => {
    if (!activeEventId) return;
    setRefreshing(true);
    await loadVendors(activeEventId);
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return vendors;
    return vendors.filter(v => v.status === filterStatus);
  }, [vendors, filterStatus]);

  const grouped = useMemo(() => {
    const map: Record<string, Vendor[]> = {};
    filtered.forEach(v => {
      if (!map[v.category]) map[v.category] = [];
      map[v.category].push(v);
    });
    return map;
  }, [filtered]);

  const bookedCount = vendors.filter(v => v.status === 'booked').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Vendors</Text>
            <Text style={styles.subtitle}>{bookedCount} booked · {vendors.length} total</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Status filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {(['all', 'shortlisted', 'contacted', 'booked', 'cancelled'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
                {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grouped vendor list */}
        {Object.keys(grouped).length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={styles.emptyTitle}>No vendors yet</Text>
            <Text style={styles.emptyText}>Tap "+ Add" to add your first vendor.</Text>
          </View>
        ) : (
          CATEGORIES.filter(c => grouped[c.key]?.length > 0).map(cat => (
            <View key={cat.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{cat.emoji} {cat.label}</Text>
              {grouped[cat.key].map(vendor => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onPress={() => setSelectedVendor(vendor)}
                  onStatusChange={async (status) => {
                    await updateVendor(vendor.id, { status });
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <AddVendorModal
        visible={showAddModal}
        eventId={activeEventId ?? ''}
        onClose={() => setShowAddModal(false)}
        onSave={async (data) => {
          await addVendor(data);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAddModal(false);
        }}
      />

      {/* Detail Modal */}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onDelete={() => {
            Alert.alert('Delete Vendor', `Remove ${selectedVendor.business_name}?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                  await deleteVendor(selectedVendor.id);
                  setSelectedVendor(null);
                },
              },
            ]);
          }}
          onUpdate={async (updates) => {
            await updateVendor(selectedVendor.id, updates);
            setSelectedVendor({ ...selectedVendor, ...updates });
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Vendor Card ─────────────────────────────────────────────────────────────

function VendorCard({ vendor, onPress, onStatusChange }: {
  vendor: Vendor;
  onPress: () => void;
  onStatusChange: (status: VendorStatus) => void;
}) {
  const cfg = STATUS_CONFIG[vendor.status];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>{vendor.business_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      {vendor.contact_name && (
        <Text style={styles.cardContact}>{vendor.contact_name}</Text>
      )}
      {vendor.total_cost && (
        <Text style={styles.cardCost}>${Number(vendor.total_cost).toLocaleString()}</Text>
      )}
      {vendor.contract_signed && (
        <Text style={styles.contractBadge}>✓ Contract signed</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Vendor Detail Modal ──────────────────────────────────────────────────────

function genId() {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
}

function VendorDetailModal({ vendor, onClose, onDelete, onUpdate }: {
  vendor: Vendor;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Vendor>) => Promise<void>;
}) {
  const [contractNotes, setContractNotes] = useState(vendor.contract_notes ?? '');
  const [payments, setPayments] = useState<PaymentMilestone[]>(vendor.payment_schedule ?? []);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payLabel, setPayLabel] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');

  const saveContractNotes = async () => {
    await onUpdate({ contract_notes: contractNotes });
  };

  const togglePaid = async (id: string) => {
    const updated = payments.map(m =>
      m.id === id
        ? { ...m, paid: !m.paid, paid_date: !m.paid ? new Date().toISOString().split('T')[0] : undefined }
        : m
    );
    setPayments(updated);
    await onUpdate({ payment_schedule: updated });
  };

  const addPayment = async () => {
    if (!payLabel.trim() || !payAmount) return;
    const milestone: PaymentMilestone = {
      id: genId(),
      label: payLabel.trim(),
      amount: parseFloat(payAmount),
      due_date: payDate,
      paid: false,
    };
    const updated = [...payments, milestone];
    setPayments(updated);
    await onUpdate({ payment_schedule: updated });
    setPayLabel(''); setPayAmount(''); setPayDate('');
    setShowAddPayment(false);
  };

  const deletePayment = (id: string) => {
    Alert.alert('Remove payment', 'Remove this payment milestone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = payments.filter(m => m.id !== id);
          setPayments(updated);
          await onUpdate({ payment_schedule: updated });
        },
      },
    ]);
  };

  const totalPaid = payments.filter(m => m.paid).reduce((s, m) => s + m.amount, 0);
  const totalDue = payments.reduce((s, m) => s + m.amount, 0);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{vendor.business_name}</Text>
            <TouchableOpacity onPress={onDelete}>
              <Text style={[styles.modalCancel, { color: Colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">

            {/* Status */}
            <Text style={styles.modalLabel}>Status</Text>
            <View style={styles.typeRow}>
              {(['shortlisted', 'contacted', 'booked', 'cancelled'] as VendorStatus[]).map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.typeChip, vendor.status === s && { borderColor: c.color, backgroundColor: c.bg }]}
                    onPress={() => onUpdate({ status: s })}
                  >
                    <Text style={[styles.typeChipText, vendor.status === s && { color: c.color, fontWeight: Typography.weights.semibold }]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Contact info */}
            {(vendor.contact_name || vendor.total_cost || vendor.notes) && (
              <>
                {vendor.contact_name && <DetailRow label="Contact" value={vendor.contact_name} />}
                {vendor.total_cost != null && <DetailRow label="Total quoted" value={`$${Number(vendor.total_cost).toLocaleString()}`} />}
                {vendor.notes && <DetailRow label="Notes" value={vendor.notes} />}
              </>
            )}

            {/* Actions */}
            {(vendor.phone || vendor.email || vendor.website) && (
              <>
                <Text style={styles.modalLabel}>Contact</Text>
                <View style={styles.actionRow}>
                  {vendor.phone && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${vendor.phone}`)}>
                      <Text style={styles.actionEmoji}>📞</Text>
                      <Text style={styles.actionText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.email && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${vendor.email}`)}>
                      <Text style={styles.actionEmoji}>✉️</Text>
                      <Text style={styles.actionText}>Email</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.website && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(vendor.website!)}>
                      <Text style={styles.actionEmoji}>🌐</Text>
                      <Text style={styles.actionText}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* ── Contract ── */}
            <Text style={styles.modalLabel}>Contract</Text>

            <TouchableOpacity
              style={[styles.contractToggle, vendor.contract_signed && styles.contractToggleSigned]}
              onPress={() => onUpdate({ contract_signed: !vendor.contract_signed })}
            >
              <Text style={styles.contractToggleText}>
                {vendor.contract_signed ? '✅ Contract signed' : '☐ Mark contract as signed'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.modalLabel, { marginTop: Spacing.lg }]}>Contract Notes</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              value={contractNotes}
              onChangeText={setContractNotes}
              onBlur={saveContractNotes}
              placeholder="Payment terms, cancellation policy, special clauses…"
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            {/* ── Payment Schedule ── */}
            <View style={styles.payHeader}>
              <Text style={styles.modalLabel}>Payment Schedule</Text>
              {totalDue > 0 && (
                <Text style={styles.payTally}>${totalPaid.toLocaleString()} / ${totalDue.toLocaleString()} paid</Text>
              )}
            </View>

            {payments.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.payRow, m.paid && styles.payRowPaid]}
                onPress={() => togglePaid(m.id)}
                onLongPress={() => deletePayment(m.id)}
              >
                <View style={[styles.payCheck, m.paid && styles.payCheckDone]}>
                  {m.paid && <Text style={styles.payCheckMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payLabel, m.paid && styles.payLabelDone]}>{m.label}</Text>
                  {m.due_date ? (
                    <Text style={styles.payDate}>
                      Due {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {m.paid && m.paid_date ? ` · Paid ${new Date(m.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.payAmount, m.paid && styles.payAmountDone]}>${m.amount.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}

            {showAddPayment ? (
              <View style={styles.addPayForm}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Label (e.g. Deposit)"
                  placeholderTextColor={Colors.textMuted}
                  value={payLabel}
                  onChangeText={setPayLabel}
                />
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1 }]}
                    placeholder="Amount"
                    placeholderTextColor={Colors.textMuted}
                    value={payAmount}
                    onChangeText={setPayAmount}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.modalInput, { flex: 1 }]}
                    placeholder="Due date (YYYY-MM-DD)"
                    placeholderTextColor={Colors.textMuted}
                    value={payDate}
                    onChangeText={setPayDate}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                  <TouchableOpacity style={[styles.addPayBtn, { backgroundColor: Colors.primary, flex: 1 }]} onPress={addPayment}>
                    <Text style={{ color: Colors.white, fontWeight: Typography.weights.semibold }}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.addPayBtn, { backgroundColor: Colors.cream, flex: 1 }]} onPress={() => setShowAddPayment(false)}>
                    <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPayTrigger} onPress={() => setShowAddPayment(true)}>
                <Text style={styles.addPayTriggerText}>+ Add Payment</Text>
              </TouchableOpacity>
            )}

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

function AddVendorModal({ visible, eventId, onClose, onSave }: {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onSave: (data: CreateVendorInput) => void;
}) {
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<ChecklistCategory>('venue');

  const reset = () => {
    setBusinessName(''); setContactName(''); setPhone('');
    setEmail(''); setWebsite(''); setTotalCost(''); setNotes('');
    setCategory('venue');
  };

  const handleSave = () => {
    if (!businessName || !eventId) return;
    onSave({
      event_id: eventId,
      category,
      business_name: businessName,
      contact_name: contactName || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      notes: notes || undefined,
      total_cost: totalCost ? parseFloat(totalCost) : undefined,
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Vendor</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, !businessName && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLabel}>Business Name *</Text>
            <TextInput style={styles.modalInput} value={businessName} onChangeText={setBusinessName}
              placeholder="e.g. The Grand Ballroom" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, category === c.key && styles.catChipActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catChipText, category === c.key && styles.catChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Contact Name</Text>
            <TextInput style={styles.modalInput} value={contactName} onChangeText={setContactName}
              placeholder="e.g. Sarah Johnson" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />

            <Text style={styles.modalLabel}>Phone</Text>
            <TextInput style={styles.modalInput} value={phone} onChangeText={setPhone}
              placeholder="(555) 000-0000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput style={styles.modalInput} value={email} onChangeText={setEmail}
              placeholder="contact@vendor.com" placeholderTextColor={Colors.textMuted}
              autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.modalLabel}>Website</Text>
            <TextInput style={styles.modalInput} value={website} onChangeText={setWebsite}
              placeholder="https://..." placeholderTextColor={Colors.textMuted}
              autoCapitalize="none" keyboardType="url" />

            <Text style={styles.modalLabel}>Total Cost ($)</Text>
            <TextInput style={styles.modalInput} value={totalCost} onChangeText={setTotalCost}
              placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder="Any notes..." placeholderTextColor={Colors.textMuted}
              multiline numberOfLines={3} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  addBtnText: { color: Colors.white, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.sm },
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  filterChip: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  filterText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  filterTextActive: { color: Colors.primaryDark, fontWeight: Typography.weights.semibold },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, flex: 1 },
  statusBadge: { borderRadius: Radius.full, paddingVertical: 2, paddingHorizontal: Spacing.sm, marginLeft: Spacing.sm },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  cardContact: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  cardCost: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  contractBadge: { fontSize: Typography.sizes.xs, color: Colors.success, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  modalCancel: { fontSize: Typography.sizes.md, color: Colors.textSecondary },
  modalTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  modalSave: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.primary },
  modalScroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  modalLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  modalInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: Typography.sizes.md, color: Colors.textPrimary },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  typeChipText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  catChipTextActive: { color: Colors.primaryDark, fontWeight: Typography.weights.semibold },
  detailRow: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: Typography.sizes.md, color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionBtn: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  actionEmoji: { fontSize: 24, marginBottom: 4 },
  actionText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  contractToggle: { backgroundColor: Colors.cream, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
  contractToggleSigned: { backgroundColor: '#EDF7EE' },
  contractToggleText: { fontSize: Typography.sizes.md, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payTally: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  payRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  payRowPaid: { borderColor: Colors.success + '44', backgroundColor: '#F6FBF6' },
  payCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  payCheckDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  payCheckMark: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  payLabel: { fontSize: Typography.sizes.md, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  payLabelDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  payDate: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  payAmount: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  payAmountDone: { color: Colors.textMuted },
  addPayForm: {
    backgroundColor: Colors.cream, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  addPayBtn: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  addPayTrigger: { paddingVertical: Spacing.md, alignItems: 'center' },
  addPayTriggerText: { fontSize: Typography.sizes.md, color: Colors.primary, fontWeight: Typography.weights.semibold },
});
