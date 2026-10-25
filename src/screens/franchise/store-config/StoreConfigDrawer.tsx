import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from '../../../icons';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';

export type StoreShift = { id: string; name: string; startTime: string; endTime: string };
export type StoreCycleType = 'calendar_month' | 'custom';
export type StoreConfigSection = 'branding' | 'cycle' | 'positions' | 'shifts';
export interface StoreConfigValues {
  name: string;
  hasLogo: boolean;
  configured: boolean;
  cycleType: StoreCycleType;
  startDay: number;
  endDay: number;
  positions: string[];
  shifts: StoreShift[];
}
export type StoreConfigPayload = { name?: string; cycleType?: StoreCycleType; startDay?: number; positions?: string[]; shifts?: StoreShift[] };

interface Props {
  visible: boolean;
  section: StoreConfigSection | null;
  value: StoreConfigValues;
  busy: boolean;
  onClose: () => void;
  onSave: (section: StoreConfigSection, payload: StoreConfigPayload) => void;
  onRemoveLogo: () => void;
}

const drawerStyles = StyleSheet.create({
  positionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm },
  shiftRow: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.beige },
  shiftActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xs },
});

const fieldStyle = {
  minHeight: 44,
  borderWidth: 1,
  borderColor: theme.colors.inputBorder,
  backgroundColor: theme.colors.inputBackground,
  color: theme.colors.primaryText,
  paddingHorizontal: theme.spacing.md,
  marginTop: theme.spacing.xs,
};

export function StoreConfigDrawer({ visible, section, value, busy, onClose, onSave, onRemoveLogo }: Props) {
  const [name, setName] = useState(value.name);
  const [cycleType, setCycleType] = useState<StoreCycleType>(value.cycleType);
  const [startDay, setStartDay] = useState(String(value.startDay));
  const [positions, setPositions] = useState(value.positions);
  const [positionDraft, setPositionDraft] = useState('');
  const [shifts, setShifts] = useState(value.shifts);
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(value.name);
    setCycleType(value.cycleType);
    setStartDay(String(value.startDay));
    setPositions(value.positions);
    setPositionDraft('');
    setShifts(value.shifts);
    setShiftName('');
    setShiftStart('09:00');
    setShiftEnd('17:00');
    setEditingId(null);
  }, [visible, value]);

  const title = section === 'branding' ? t('franchiseStoreConfigBranding')
    : section === 'cycle' ? t('franchiseStoreConfigCycle')
      : section === 'positions' ? t('franchiseStoreConfigPositions') : t('franchiseStoreConfigShifts');

  function addPosition() {
    const next = positionDraft.trim();
    if (!next || next.length > 60 || positions.some((item) => item.toLowerCase() === next.toLowerCase()) || positions.length >= 30) return;
    setPositions((current) => [...current, next]);
    setPositionDraft('');
  }

  function addShift() {
    const nextName = shiftName.trim();
    if (!nextName || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd)) return;
    if (shifts.some((item) => item.id !== editingId && item.name.toLowerCase() === nextName.toLowerCase())) return;
    if (editingId) {
      setShifts((current) => current.map((item) => item.id === editingId ? { ...item, name: nextName, startTime: shiftStart, endTime: shiftEnd } : item));
    } else if (shifts.length < 20) {
      setShifts((current) => [...current, { id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: nextName, startTime: shiftStart, endTime: shiftEnd }]);
    }
    setEditingId(null);
    setShiftName('');
    setShiftStart('09:00');
    setShiftEnd('17:00');
  }

  function submit() {
    if (!section) return;
    if (section === 'branding') onSave(section, { name: name.trim() });
    else if (section === 'cycle') onSave(section, { cycleType, startDay: Number(startDay) });
    else if (section === 'positions') onSave(section, { positions });
    else onSave(section, { shifts });
  }

  return (
    <ResponsiveDrawerModal visible={visible} closeLabel={t('adminCloseMenu')} onClose={onClose}>
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={{ paddingBottom: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
          {section === 'branding' ? <>
            <Text style={styles.fieldLabel}>{t('franchiseStoreConfigName')}</Text>
            <TextInput accessibilityLabel={t('franchiseStoreConfigName')} value={name} onChangeText={setName} maxLength={100} style={fieldStyle} />
            <Text style={{ color: theme.colors.muted, marginTop: theme.spacing.lg }}>{t('franchiseStoreConfigLogoHelp')}</Text>
            {value.hasLogo ? <Pressable accessibilityRole="button" onPress={onRemoveLogo} disabled={busy} style={[styles.secondaryButton, { marginTop: theme.spacing.md }]}><Text style={styles.secondaryButtonText}>{t('franchiseStoreConfigRemoveLogo')}</Text></Pressable> : null}
          </> : null}
          {section === 'cycle' ? <>
            <Text style={styles.fieldLabel}>{t('franchiseStoreConfigCycleType')}</Text>
            {(['calendar_month', 'custom'] as const).map((type) => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: cycleType === type }} onPress={() => setCycleType(type)} style={[styles.secondaryButton, { marginTop: theme.spacing.sm, borderColor: cycleType === type ? theme.colors.orange : theme.colors.inputBorder }]}><Text style={styles.secondaryButtonText}>{type === 'calendar_month' ? t('franchiseStoreConfigCalendar') : t('franchiseStoreConfigCustom')}</Text></Pressable>)}
            {cycleType === 'custom' ? <><Text style={[styles.fieldLabel, { marginTop: theme.spacing.lg }]}>{t('franchiseStoreConfigStartDay')}</Text><TextInput accessibilityLabel={t('franchiseStoreConfigStartDay')} keyboardType="number-pad" value={startDay} onChangeText={setStartDay} maxLength={2} style={fieldStyle} /><Text style={{ color: theme.colors.muted, marginTop: theme.spacing.sm }}>{t('franchiseStoreConfigCycleHint')}</Text></> : null}
          </> : null}
          {section === 'positions' ? <>
            {positions.map((position) => <View key={position} style={drawerStyles.positionRow}><Text style={{ color: theme.colors.primaryText }}>{position}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('franchiseStoreConfigRemoveItem', { item: position })} onPress={() => setPositions((current) => current.filter((item) => item !== position))}><Text style={{ color: theme.colors.error }}>{t('franchiseStoreConfigRemove')}</Text></Pressable></View>)}
            <TextInput accessibilityLabel={t('franchiseStoreConfigNewPosition')} placeholder={t('franchiseStoreConfigNewPosition')} value={positionDraft} onChangeText={setPositionDraft} maxLength={60} style={fieldStyle} />
            <Pressable accessibilityRole="button" onPress={addPosition} style={[styles.secondaryButton, { marginTop: theme.spacing.sm }]}><Text style={styles.secondaryButtonText}>{t('franchiseStoreConfigAdd')}</Text></Pressable>
          </> : null}
          {section === 'shifts' ? <>
            {shifts.map((shift) => <View key={shift.id} style={drawerStyles.shiftRow}>
              <Text style={{ color: theme.colors.primaryText }}>{shift.name} · {shift.startTime}–{shift.endTime}</Text>
              <View style={drawerStyles.shiftActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseStoreConfigEditItem', { item: shift.name })} onPress={() => { setEditingId(shift.id); setShiftName(shift.name); setShiftStart(shift.startTime); setShiftEnd(shift.endTime); }}><Text style={{ color: theme.colors.teal }}>{t('franchiseStoreConfigEdit')}</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseStoreConfigRemoveItem', { item: shift.name })} onPress={() => setShifts((current) => current.filter((item) => item.id !== shift.id))}><Text style={{ color: theme.colors.error }}>{t('franchiseStoreConfigRemove')}</Text></Pressable>
              </View>
            </View>)}
            <Text style={styles.fieldLabel}>{t('franchiseStoreConfigShiftName')}</Text><TextInput accessibilityLabel={t('franchiseStoreConfigShiftName')} value={shiftName} onChangeText={setShiftName} maxLength={40} style={fieldStyle} />
            <Text style={[styles.fieldLabel, { marginTop: theme.spacing.md }]}>{t('franchiseStoreConfigShiftStart')}</Text><TextInput accessibilityLabel={t('franchiseStoreConfigShiftStart')} value={shiftStart} onChangeText={setShiftStart} placeholder="09:00" style={fieldStyle} />
            <Text style={[styles.fieldLabel, { marginTop: theme.spacing.md }]}>{t('franchiseStoreConfigShiftEnd')}</Text><TextInput accessibilityLabel={t('franchiseStoreConfigShiftEnd')} value={shiftEnd} onChangeText={setShiftEnd} placeholder="17:00" style={fieldStyle} />
            <Pressable accessibilityRole="button" onPress={addShift} style={[styles.secondaryButton, { marginTop: theme.spacing.md }]}><Text style={styles.secondaryButtonText}>{editingId ? t('franchiseStoreConfigUpdateShift') : t('franchiseStoreConfigAdd')}</Text></Pressable>
          </> : null}
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable></View>
          <View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={[styles.primaryButton, styles.drawerActionButton]}><Text style={styles.primaryButtonText}>{busy ? t('franchiseStoreConfigSaving') : t('franchiseStoreConfigSave')}</Text></Pressable></View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
