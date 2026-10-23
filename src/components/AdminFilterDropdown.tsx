import { Pressable, Text, View } from 'react-native';
import { ChevronDown } from '../icons';
import { theme } from '../config/theme';
import { adminStyles as styles } from '../styles/adminStyles';
import type { AdminFilterDropdownProps } from './types';

export function AdminFilterDropdown<Value extends string>({
  label,
  value,
  expanded,
  options,
  onToggle,
  onSelect,
  optionsPlacement = 'below',
  containerStyle,
}: AdminFilterDropdownProps<Value>) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  return (
    <View style={[
      styles.storeFilterDropdown,
      expanded && styles.storeFilterDropdownOpen,
      containerStyle,
    ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={[styles.storeFilterDropdownButton, expanded && styles.storeFilterDropdownButtonOpen]}
      >
        <View style={styles.storeFilterDropdownCopy}>
          <Text style={styles.storeFilterDropdownLabel}>{label}</Text>
          <Text numberOfLines={1} style={styles.storeFilterDropdownValue}>{selectedLabel}</Text>
        </View>
        <ChevronDown color={theme.colors.muted} size={14} />
      </Pressable>
      {expanded ? (
        <View style={[
          styles.storeFilterDropdownOptions,
          optionsPlacement === 'above' && styles.storeFilterDropdownOptionsAbove,
        ]}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(option.value)}
                style={[styles.storeFilterDropdownOption, selected && styles.storeFilterDropdownOptionActive]}
              >
                <Text style={[
                  styles.storeFilterDropdownOptionText,
                  selected && styles.storeFilterDropdownOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
