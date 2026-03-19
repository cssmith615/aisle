import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useEventStore } from '../../store/eventStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Guest, RsvpStatus, GuestGroup, CreateGuestInput } from '../../types';

const RSVP_CONFIG: Record<RsvpStatus, { label: string; color: string; bg: string; emoji: string }> = {
  attending:   { label: 'Attending',   color: Colors.success,  bg: '#EDF7EE', emoji: '✅' },
  declined:    { label: 'Declined',    color: Colors.error,    bg: '#FDECEA', emoji: '❌' },
  no_response: { label: 'No Response', color: Colors.textMuted, bg: Colors.cream, emoji: '⏳' },
  maybe:       { label: 'Maybe',       color: Colors.warning,  bg: '#FFF8E1', emoji: '🤔' },
};

const GROUP_OPTIONS: { key: GuestGroup; label: string }[] = [
  { key: 'family_bride',  label: "Bride's Family" },
  { key: 'family_groom',  label: "Groom's Family" },
  { key: 'friends_bride', label: "Bride's Friends" },
  { key: 'friends_groom', label: "Groom's Friends" },
  { key: 'work',          label: 'Work' },
  { key: 'other',         label: 'Other' },
];

export default function GuestListScreen() {
  const { guests, activeEventId, loadGuests, addGuest, updateGuest, deleteGuest } = useEventStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RsvpStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const onRefresh = async () => {
    if (!activeEventId) return;
    setRefreshing(true);
    await loadGuests(activeEventId);
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let list = guests;
    if (filterStatus !== 'all') list = list.filter(g => g.rsvp_status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g =>
        g.first_name.toLowerCase().includes(q) ||
        (g.last_name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [guests, filterStatus, search]);

  const counts = useMemo(() => ({
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    declined: guests.filter(g => g.rsvp_status === 'declined').length,
    no_response: guests.filter(g => g.rsvp_status === 'no_response').length,
    maybe: guests.filter(g => g.rsvp_status === 'maybe').length,
  }), [guests]);

  const plusOnes = guests.filter(g => g.plus_one && g.rsvp_status === 'attending').length;
  const totalAttending = counts.attending + plusOnes;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Guest List</Text>
          <Text style={styles.subtitle}>{guests.length} guests · {totalAttending} attending</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* RSVP summary strip */}
      <View style={styles.summaryRow}>
        {(['attending', 'maybe', 'no_response', 'declined'] as RsvpStatus[]).map(s => {
          const cfg = RSVP_CONFIG[s];
          return (
            <TouchableOpacity
              key={s}
              style={[styles.summaryCard, filterStatus === s && { borderColor: cfg.color, borderWidth: 2 }]}
              onPress={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            >
              <Text style={styles.summaryEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.summaryCount, { color: cfg.color }]}>{counts[s]}</Text>
              <Text style={styles.summaryLabel}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search guests..."
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={g => g.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <GuestRow
            guest={item}
            onPress={() => setSelectedGuest(item)}
            onRsvpChange={async (status) => {
              await updateGuest(item.id, { rsvp_status: status });
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>{search ? 'No results' : 'No guests yet'}</Text>
            <Text style={styles.emptyText}>
              {search ? 'Try a different name.' : 'Tap "+ Add" to add your first guest.'}
            </Text>
          </View>
        }
      />

      <AddGuestModal
        visible={showAddModal}
        eventId={activeEventId ?? ''}
        onClose={() => setShowAddModal(false)}
        onSave={async (data) => {
          await addGuest(data);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAddModal(false);
        }}
      />

      {selectedGuest && (
        <GuestDetailModal
          guest={selectedGuest}
          onClose={() => setSelectedGuest(null)}
          onUpdateRsvp={async (status) => {
            await updateGuest(selectedGuest.id, { rsvp_status: status });
            setSelectedGuest({ ...selectedGuest, rsvp_status: status });
          }}
          onDelete={async () => {
            Alert.alert('Remove Guest', `Remove ${selectedGuest.first_name}?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove', style: 'destructive',
                onPress: async () => {
                  await deleteGuest(selectedGuest.id);
                  setSelectedGuest(null);
                },
              },
            ]);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Guest Row ────────────────────────────────────────────────────────────────

function GuestRow({ guest, onPress, onRsvpChange }: {
  guest: Guest;
  onPress: () => void;
  onRsvpChange: (status: RsvpStatus) => void;
}) {
  const cfg = RSVP_CONFIG[guest.rsvp_status];
  const initials = `${guest.first_name[0]}${guest.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatar, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.avatarText, { color: cfg.color }]}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{guest.first_name} {guest.last_name ?? ''}</Text>
        <View style={styles.rowMeta}>
          <View style={[styles.rsvpBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.rsvpText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {guest.plus_one && <Text style={styles.plusOne}>+1</Text>}
          {guest.dietary_notes && <Text style={styles.dietary}>🍽️</Text>}
        </View>
      </View>
      {/* Quick RSVP toggle */}
      <TouchableOpacity
        style={[styles.quickRsvp, guest.rsvp_status === 'attending' && styles.quickRsvpActive]}
        onPress={() => onRsvpChange(guest.rsvp_status === 'attending' ? 'no_response' : 'attending')}
      >
        <Text style={styles.quickRsvpText}>{guest.rsvp_status === 'attending' ? '✓' : '+'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Guest Detail Modal ───────────────────────────────────────────────────────

function GuestDetailModal({ guest, onClose, onUpdateRsvp, onDelete }: {
  guest: Guest;
  onClose: () => void;
  onUpdateRsvp: (status: RsvpStatus) => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{guest.first_name} {guest.last_name ?? ''}</Text>
          <TouchableOpacity onPress={onDelete}>
            <Text style={[styles.modalCancel, { color: Colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <Text style={styles.modalLabel}>RSVP Status</Text>
          <View style={styles.typeRow}>
            {(['attending', 'maybe', 'no_response', 'declined'] as RsvpStatus[]).map(s => {
              const cfg = RSVP_CONFIG[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.typeChip, guest.rsvp_status === s && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                  onPress={() => onUpdateRsvp(s)}
                >
                  <Text style={[styles.typeChipText, guest.rsvp_status === s && { color: cfg.color, fontWeight: Typography.weights.semibold }]}>
                    {cfg.emoji} {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {guest.email && <DetailRow label="Email" value={guest.email} />}
          {guest.phone && <DetailRow label="Phone" value={guest.phone} />}
          {guest.group_tag && <DetailRow label="Group" value={GROUP_OPTIONS.find(g => g.key === guest.group_tag)?.label ?? guest.group_tag} />}
          {guest.dietary_notes && <DetailRow label="Dietary notes" value={guest.dietary_notes} />}
          {guest.table_number && <DetailRow label="Table" value={`Table ${guest.table_number}`} />}
          {guest.plus_one && <DetailRow label="Plus one" value={guest.plus_one_name ?? 'Yes'} />}
        </ScrollView>
      </SafeAreaView>
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

// ─── Add Guest Modal ──────────────────────────────────────────────────────────

function AddGuestModal({ visible, eventId, onClose, onSave }: {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onSave: (data: CreateGuestInput) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState<GuestGroup>('other');
  const [plusOne, setPlusOne] = useState(false);
  const [dietary, setDietary] = useState('');
  const [table, setTable] = useState('');

  const reset = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setGroup('other'); setPlusOne(false); setDietary(''); setTable('');
  };

  const handleSave = () => {
    if (!firstName || !eventId) return;
    onSave({
      event_id: eventId,
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      group_tag: group,
      plus_one: plusOne,
      dietary_notes: dietary.trim() || undefined,
      table_number: table ? parseInt(table) : undefined,
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
            <Text style={styles.modalTitle}>Add Guest</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, !firstName && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>First Name *</Text>
                <TextInput style={styles.modalInput} value={firstName} onChangeText={setFirstName}
                  placeholder="Emily" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Last Name</Text>
                <TextInput style={styles.modalInput} value={lastName} onChangeText={setLastName}
                  placeholder="Smith" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
              </View>
            </View>

            <Text style={styles.modalLabel}>Group</Text>
            <View style={styles.catGrid}>
              {GROUP_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.catChip, group === g.key && styles.catChipActive]}
                  onPress={() => setGroup(g.key)}
                >
                  <Text style={[styles.catChipText, group === g.key && styles.catChipTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput style={styles.modalInput} value={email} onChangeText={setEmail}
              placeholder="guest@example.com" placeholderTextColor={Colors.textMuted}
              autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.modalLabel}>Phone</Text>
            <TextInput style={styles.modalInput} value={phone} onChangeText={setPhone}
              placeholder="(555) 000-0000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

            <Text style={styles.modalLabel}>Dietary Notes</Text>
            <TextInput style={styles.modalInput} value={dietary} onChangeText={setDietary}
              placeholder="e.g. Vegetarian, nut allergy" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.modalLabel}>Table Number</Text>
            <TextInput style={styles.modalInput} value={table} onChangeText={setTable}
              placeholder="e.g. 5" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />

            <TouchableOpacity style={styles.toggleRow} onPress={() => setPlusOne(!plusOne)}>
              <View style={[styles.checkbox, plusOne && styles.checkboxActive]}>
                {plusOne && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.toggleText}>Has a plus one</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  addBtnText: { color: Colors.white, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.sm },
  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  summaryEmoji: { fontSize: 18, marginBottom: 2 },
  summaryCount: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  summaryLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, textAlign: 'center' },
  searchWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, fontSize: Typography.sizes.md, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  rowInfo: { flex: 1 },
  rowName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  rsvpBadge: { borderRadius: Radius.full, paddingVertical: 1, paddingHorizontal: Spacing.sm },
  rsvpText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
  plusOne: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  dietary: { fontSize: 12 },
  quickRsvp: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  quickRsvpActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickRsvpText: { fontSize: Typography.sizes.md, color: Colors.white, fontWeight: Typography.weights.bold },
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
  nameRow: { flexDirection: 'row', gap: Spacing.md },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  typeChipText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  catChipTextActive: { color: Colors.primaryDark, fontWeight: Typography.weights.semibold },
  detailRow: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: Typography.sizes.md, color: Colors.textPrimary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: Typography.weights.bold },
  toggleText: { fontSize: Typography.sizes.md, color: Colors.textSecondary },
});
