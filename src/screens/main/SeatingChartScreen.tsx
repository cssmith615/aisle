import React, { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../store/eventStore';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Guest, TableShape, SeatingConfig } from '../../types';

const TABLE_SHAPES: { value: TableShape; label: string; icon: string }[] = [
  { value: 'round',        label: 'Round',       icon: '⭕' },
  { value: 'rectangular',  label: 'Rectangle',   icon: '▭' },
  { value: 'sweetheart',   label: 'Sweetheart',  icon: '❤️' },
  { value: 'head',         label: 'Head Table',  icon: '👑' },
];

export default function SeatingChartScreen() {
  const navigation = useNavigation();
  const { guests, updateGuest } = useEventStore();
  const palette = useTheme();
  const insets = useSafeAreaInsets();

  const maxTableNumber = useMemo(() => {
    const nums = guests.map(g => g.table_number).filter((n): n is number => n != null);
    return nums.length > 0 ? Math.max(...nums) : 10;
  }, [guests]);

  const [totalTables, setTotalTables] = useState(maxTableNumber);
  const [capacity, setCapacity] = useState(8);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTables, setSettingsTables] = useState(String(maxTableNumber));
  const [settingsCapacity, setSettingsCapacity] = useState('8');
  const [assigningGuest, setAssigningGuest] = useState<Guest | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showUnassignedPicker, setShowUnassignedPicker] = useState(false);
  const [seatingConfig, setSeatingConfig] = useState<SeatingConfig>({});
  const [showShapePicker, setShowShapePicker] = useState<number | null>(null);

  const getShape = (tableNum: number): TableShape =>
    seatingConfig[String(tableNum)]?.shape ?? 'round';

  const setShape = (tableNum: number, shape: TableShape) => {
    setSeatingConfig(prev => ({
      ...prev,
      [String(tableNum)]: { ...prev[String(tableNum)], shape },
    }));
  };

  const shapeIcon = (tableNum: number) =>
    TABLE_SHAPES.find(s => s.value === getShape(tableNum))?.icon ?? '⭕';

  const seatedGuests = useMemo(() => guests.filter(g => g.table_number != null), [guests]);
  const unseatedGuests = useMemo(() => guests.filter(g => g.table_number == null), [guests]);
  const guestsAtTable = (n: number) => guests.filter(g => g.table_number === n);
  const tables = Array.from({ length: totalTables }, (_, i) => i + 1);

  const handleSaveSettings = () => {
    const t = parseInt(settingsTables);
    const c = parseInt(settingsCapacity);
    if (!isNaN(t) && t > 0) setTotalTables(t);
    if (!isNaN(c) && c > 0) setCapacity(c);
    setShowSettings(false);
  };

  const handleAssignGuest = async (guest: Guest, tableNum: number) => {
    await updateGuest(guest.id, { table_number: tableNum });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAssigningGuest(null);
  };

  const handleRemoveFromTable = async (guest: Guest) => {
    await updateGuest(guest.id, { table_number: null });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddGuestToTable = async (guest: Guest, tableNum: number) => {
    await updateGuest(guest.id, { table_number: tableNum });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowUnassignedPicker(false);
  };

  const tableGuestsForSelected = selectedTable ? guestsAtTable(selectedTable) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Seating Chart</Text>
        <TouchableOpacity onPress={() => {
          setSettingsTables(String(totalTables));
          setSettingsCapacity(String(capacity));
          setShowSettings(true);
        }} style={styles.gearBtn}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: palette.primary }]}>{seatedGuests.length}</Text>
          <Text style={styles.statLabel}>seated</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.warning }]}>{unseatedGuests.length}</Text>
          <Text style={styles.statLabel}>unassigned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.textSecondary }]}>{totalTables}</Text>
          <Text style={styles.statLabel}>tables</Text>
        </View>
      </View>

      {/* Unassigned guests */}
      {unseatedGuests.length > 0 && (
        <View style={styles.unassignedSection}>
          <Text style={styles.sectionLabel}>Unassigned</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {unseatedGuests.map(guest => (
              <TouchableOpacity
                key={guest.id}
                style={styles.guestChip}
                onPress={() => setAssigningGuest(guest)}
              >
                <Text style={styles.guestChipText}>
                  {guest.first_name}{guest.last_name ? ` ${guest.last_name}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Table grid */}
      <FlatList
        data={tables}
        keyExtractor={n => String(n)}
        numColumns={3}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + Spacing.xl }]}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item: tableNum }) => {
          const tableGuests = guestsAtTable(tableNum);
          const hasGuests = tableGuests.length > 0;
          const preview = tableGuests.slice(0, 2);
          return (
            <TouchableOpacity
              style={[
                styles.tableCard,
                hasGuests
                  ? { backgroundColor: palette.primary + '18', borderColor: palette.primary, borderWidth: 1.5 }
                  : { backgroundColor: Colors.cream, borderColor: Colors.border, borderWidth: 1 },
              ]}
              onPress={() => setSelectedTable(tableNum)}
              onLongPress={() => setShowShapePicker(tableNum)}
              activeOpacity={0.75}
            >
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableNum, { color: hasGuests ? palette.primary : Colors.textMuted }]}>
                  T{tableNum}
                </Text>
                <Text style={styles.tableShapeIcon}>{shapeIcon(tableNum)}</Text>
              </View>
              <Text style={[styles.tableCount, { color: hasGuests ? palette.primary : Colors.textMuted }]}>
                {tableGuests.length}/{capacity}
              </Text>
              {hasGuests ? (
                preview.map(g => (
                  <Text key={g.id} style={styles.tableGuestName} numberOfLines={1}>
                    {g.first_name} {g.last_name ?? ''}
                  </Text>
                ))
              ) : (
                <Text style={styles.tableEmpty}>Empty</Text>
              )}
              {tableGuests.length > 2 && (
                <Text style={styles.tableMore}>+{tableGuests.length - 2} more</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Chart Settings</Text>

            <Text style={styles.settingsLabel}>Number of tables</Text>
            <TextInput
              style={styles.settingsInput}
              value={settingsTables}
              onChangeText={setSettingsTables}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.settingsLabel}>Capacity per table</Text>
            <TextInput
              style={styles.settingsInput}
              value={settingsCapacity}
              onChangeText={setSettingsCapacity}
              keyboardType="number-pad"
              placeholder="8"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.settingsSaveBtn, { backgroundColor: palette.primary }]}
              onPress={handleSaveSettings}
            >
              <Text style={styles.settingsSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Assign Guest Modal (tap unassigned chip → pick table) */}
      <Modal
        visible={assigningGuest != null}
        transparent
        animationType="slide"
        onRequestClose={() => setAssigningGuest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.assignPanel}>
            <View style={styles.assignHeader}>
              <Text style={styles.assignTitle}>
                Assign {assigningGuest?.first_name} {assigningGuest?.last_name ?? ''}
              </Text>
              <TouchableOpacity onPress={() => setAssigningGuest(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.assignSub}>Select a table</Text>
            <ScrollView contentContainerStyle={styles.tablePickerGrid}>
              {tables.map(n => {
                const count = guestsAtTable(n).length;
                const full = count >= capacity;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.tablePickerBtn,
                      { borderColor: full ? Colors.border : palette.primary },
                      full && { opacity: 0.4 },
                    ]}
                    onPress={() => assigningGuest && !full && handleAssignGuest(assigningGuest, n)}
                    disabled={full}
                  >
                    <Text style={[styles.tablePickerBtnText, { color: palette.primary }]}>T{n}</Text>
                    <Text style={styles.tablePickerCount}>{count}/{capacity}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Table Detail Modal */}
      <Modal
        visible={selectedTable != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTable(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailPanel}>
            <View style={styles.assignHeader}>
              <Text style={styles.assignTitle}>
                Table {selectedTable} · {tableGuestsForSelected.length}/{capacity}
              </Text>
              <TouchableOpacity onPress={() => setSelectedTable(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScroll}>
              {tableGuestsForSelected.length === 0 && (
                <Text style={styles.detailEmpty}>No guests assigned yet.</Text>
              )}
              {tableGuestsForSelected.map(guest => (
                <View key={guest.id} style={styles.detailGuestRow}>
                  <Text style={styles.detailGuestName}>
                    {guest.first_name} {guest.last_name ?? ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Remove Guest',
                        `Remove ${guest.first_name} from Table ${selectedTable}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove', style: 'destructive',
                            onPress: () => handleRemoveFromTable(guest),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {unseatedGuests.length > 0 && tableGuestsForSelected.length < capacity && (
              <TouchableOpacity
                style={[styles.addGuestBtn, { borderColor: palette.primary }]}
                onPress={() => setShowUnassignedPicker(true)}
              >
                <Ionicons name="person-add-outline" size={16} color={palette.primary} />
                <Text style={[styles.addGuestBtnText, { color: palette.primary }]}>Add Guest</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Shape picker modal */}
      <Modal
        visible={showShapePicker != null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShapePicker(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowShapePicker(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Table {showShapePicker} Shape</Text>
            {TABLE_SHAPES.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.shapeRow,
                  showShapePicker != null && getShape(showShapePicker) === s.value && { backgroundColor: palette.primary + '18' },
                ]}
                onPress={() => {
                  if (showShapePicker != null) setShape(showShapePicker, s.value);
                  setShowShapePicker(null);
                }}
              >
                <Text style={styles.shapeRowIcon}>{s.icon}</Text>
                <Text style={[
                  styles.shapeRowLabel,
                  showShapePicker != null && getShape(showShapePicker) === s.value && { color: palette.primary, fontWeight: Typography.weights.bold },
                ]}>
                  {s.label}
                </Text>
                {showShapePicker != null && getShape(showShapePicker) === s.value && (
                  <Ionicons name="checkmark" size={18} color={palette.primary} />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Unassigned picker (shown inside table detail flow) */}
      <Modal
        visible={showUnassignedPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnassignedPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.assignPanel}>
            <View style={styles.assignHeader}>
              <Text style={styles.assignTitle}>Add to Table {selectedTable}</Text>
              <TouchableOpacity onPress={() => setShowUnassignedPicker(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.assignSub}>Pick an unassigned guest</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
              {unseatedGuests.map(guest => (
                <TouchableOpacity
                  key={guest.id}
                  style={styles.pickerGuestRow}
                  onPress={() => selectedTable != null && handleAddGuestToTable(guest, selectedTable)}
                >
                  <Text style={styles.pickerGuestName}>
                    {guest.first_name} {guest.last_name ?? ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
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
  gearBtn: { padding: 4, marginLeft: Spacing.sm },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  statLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  // Unassigned
  unassignedSection: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  chipRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, flexDirection: 'row' },
  guestChip: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  guestChipText: { fontSize: Typography.sizes.sm, color: Colors.textPrimary, fontWeight: Typography.weights.medium },

  // Grid
  grid: { padding: Spacing.md },
  gridRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
  tableCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 100,
    ...Shadow.sm,
  },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 2 },
  tableNum: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  tableShapeIcon: { fontSize: 14 },
  tableCount: { fontSize: Typography.sizes.xs, marginBottom: Spacing.xs },
  tableGuestName: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textAlign: 'center' },
  tableEmpty: { fontSize: Typography.sizes.xs, color: Colors.textMuted, fontStyle: 'italic' },
  tableMore: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },

  // Modals shared
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },

  // Settings panel (centered sheet)
  settingsPanel: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    margin: Spacing.xl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  settingsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  settingsLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  settingsInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  settingsSaveBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  settingsSaveBtnText: {
    color: Colors.white,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  },

  shapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  shapeRowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  shapeRowLabel: { flex: 1, fontSize: Typography.sizes.md, color: Colors.textPrimary },

  // Assign / detail panels
  assignPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '75%',
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  detailPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '70%',
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  assignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  assignTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, flex: 1 },
  assignSub: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginBottom: Spacing.lg },

  // Table picker grid
  tablePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  tablePickerBtn: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.white,
    minWidth: 60,
  },
  tablePickerBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  tablePickerCount: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },

  // Detail guest list
  detailScroll: { flexGrow: 0, maxHeight: 300, marginBottom: Spacing.md },
  detailEmpty: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  detailGuestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailGuestName: { fontSize: Typography.sizes.md, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  addGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
  },
  addGuestBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },

  // Unassigned picker rows
  pickerGuestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerGuestName: { fontSize: Typography.sizes.md, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
});
