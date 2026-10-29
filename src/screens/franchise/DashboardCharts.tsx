import { getLocale } from '../../i18n';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { theme } from '../../config/theme';
import { franchiseStyles as styles } from './franchiseStyles';

export function formatMoney(amount: number, compact = false): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency', currency: 'INR', maximumFractionDigits: compact ? 1 : 0,
    ...(compact ? { notation: 'compact' as const } : {}),
  }).format(amount);
}

interface ChartItem {
  label: string;
  values: number[];
  description: string;
}

export function DashboardBars({ items, colors = [theme.colors.teal], compact: compactOverride, unit = 'currency' }: { items: ChartItem[]; colors?: string[]; compact?: boolean; unit?: 'currency' | 'percent' }) {
  const { width } = useWindowDimensions();
  const compact = compactOverride ?? (Platform.OS !== 'web' || width < theme.layout.tabletBreakpoint);
  const maximum = Math.max(compact && unit === 'percent' ? 100 : 1, ...items.flatMap((item) => item.values));
  const dateLabels = items.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.label));
  return (
    <View style={compact && chartStyles.mobileChart}>
      {compact ? (
        <View style={chartStyles.amountAxis}>
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
            <Text key={fraction} style={[chartStyles.amountTick, { top: (1 - fraction) * 128 }]} numberOfLines={1} adjustsFontSizeToFit>
              {unit === 'percent' ? `${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(maximum * fraction)}%` : formatMoney(maximum * fraction, true)}
            </Text>
          ))}
        </View>
      ) : null}
    <ScrollView horizontal style={compact && chartStyles.mobileScroll} contentContainerStyle={[styles.chartContent, compact && { gap: 2 }]}>
      {items.map((item) => (
        <View key={item.label} style={[styles.chartColumn, compact && { width: Math.max(1, item.values.length) * 14 + Math.max(0, item.values.length - 1) * 2 }]} accessible accessibilityLabel={`${item.label}: ${item.description}`}>
          <View style={[styles.chartBars, compact && { width: '100%', gap: 2 }]}>
            {item.values.map((value, index) => (
              <View key={index} style={[styles.bar, compact && { flex: 1 }, {
                height: Math.max(2, (value / maximum) * 128),
                backgroundColor: value === 0 ? theme.colors.beige : colors[index % colors.length],
              }]} />
            ))}
          </View>
          {!compact ? <Text style={styles.chartValue}>{item.description}</Text> : null}
          {compact && !dateLabels ? (
            <View style={chartStyles.categoryLabelSlot}>
              <Text style={chartStyles.categoryLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          ) : (
            <Text style={styles.chartLabel}>{compact ? item.label.slice(8) : item.label}</Text>
          )}
        </View>
      ))}
    </ScrollView>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  mobileChart: { flexDirection: 'row', alignItems: 'flex-start' },
  mobileScroll: { flex: 1, minWidth: 0 },
  amountAxis: { width: 56, height: 128, marginTop: theme.spacing.md, marginRight: 8, borderRightWidth: 1, borderColor: theme.colors.beige },
  amountTick: { position: 'absolute', left: 0, right: 6, transform: [{ translateY: -6 }], lineHeight: 12, fontSize: 10, textAlign: 'right', color: theme.colors.muted },
  categoryLabelSlot: { width: '100%', height: 80 },
  categoryLabel: { position: 'absolute', left: '50%', marginLeft: -40, top: 34, width: 80, height: 12, lineHeight: 12, fontSize: 10, color: theme.colors.muted, textAlign: 'right', transform: [{ rotate: '-90deg' }] },
});

