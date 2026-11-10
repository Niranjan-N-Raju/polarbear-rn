import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../config/theme';
import { Check, ChevronDown, Search } from '../icons';
import { t } from '../i18n';

export interface SelectOption { value: string; label: string }
export function SearchableSelect({ label, value, options, onChange, disabled = false, placeholder, allowClear = false }: {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void;
  disabled?: boolean; placeholder?: string; allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const visible = options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()));
  function choose(next: string) { onChange(next); setOpen(false); setQuery(''); }
  return (
    <View style={local.root}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={() => { setOpen(current => !current); setQuery(''); }} style={[local.trigger, disabled && local.disabled]}>
        <Text style={local.value}>{options.find(option => option.value === value)?.label ?? placeholder ?? label}</Text>
        <ChevronDown size={16} color={theme.colors.muted} />
      </Pressable>
      {open && !disabled ? <View style={local.popup}>
        <View style={local.search}><Search size={16} color={theme.colors.muted} /><TextInput autoFocus accessibilityLabel={`${t('billingSearch')} ${label}`} value={query} onChangeText={setQuery} placeholder={t('billingSearch')} style={local.input} /></View>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={local.options}>
          {allowClear ? <Pressable accessibilityRole="button" onPress={() => choose('')} style={local.option}><Text style={local.value}>{placeholder ?? t('billingAll')}</Text></Pressable> : null}
          {visible.map(option => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: option.value === value }} onPress={() => choose(option.value)} style={[local.option, option.value === value && local.selected]}><Text style={local.value}>{option.label}</Text>{option.value === value ? <Check size={16} color={theme.colors.orange} /> : null}</Pressable>)}
          {!visible.length ? <Text style={local.empty}>{t('billingNoMatches')}</Text> : null}
        </ScrollView>
      </View> : null}
    </View>
  );
}
const local = StyleSheet.create({
  root: { minWidth: 140, flexGrow: 1 },
  trigger: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.colors.beige, backgroundColor: theme.colors.white, paddingHorizontal: 12, paddingVertical: 10 },
  value: { flex: 1, color: theme.colors.ink, fontSize: 14 }, disabled: { opacity: 0.5 },
  popup: { borderWidth: 1, borderColor: theme.colors.beige, backgroundColor: theme.colors.white },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: theme.colors.beige },
  input: { flex: 1, minHeight: 44, color: theme.colors.ink }, options: { maxHeight: 180 },
  option: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selected: { backgroundColor: theme.colors.sand }, empty: { padding: 12, color: theme.colors.muted },
});