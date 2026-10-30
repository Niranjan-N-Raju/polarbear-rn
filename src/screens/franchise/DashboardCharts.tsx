import { getLocale } from '../../i18n';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  axisLabel?: string;
}

export function DashboardTrendBars({ items, colors = [theme.colors.teal], minimumColumnWidth = 48 }: { items: ChartItem[]; colors?: string[]; minimumColumnWidth?: number }) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const maximum = Math.max(1, ...items.flatMap((item) => item.values));
  const columnWidth = Math.max(minimumColumnWidth, ...items.map((item) => item.values.length * 10 + Math.max(0, item.values.length - 1) * 4));
  const chartWidth = Math.max(viewportWidth, items.length * (columnWidth + 4) - 4, 0);
  const selectedIndex = items.findIndex((item) => item.label === selectedLabel);
  const selected = items[selectedIndex];
  const tooltipWidth = Math.min(240, chartWidth);
  const selectedCenter = items.length ? (selectedIndex + 0.5) * (chartWidth + 4) / items.length - 2 : 0;

  return (
    <ScrollView horizontal style={trendStyles.scroll} onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)} onScrollBeginDrag={() => setSelectedLabel(null)} contentContainerStyle={[trendStyles.content, { width: chartWidth }]}>
      {selected ? <View pointerEvents="none" style={[trendStyles.tooltip, { width: tooltipWidth, left: Math.max(0, Math.min(chartWidth - tooltipWidth, selectedCenter - tooltipWidth / 2)) }]}>
        <Text style={trendStyles.tooltipText} numberOfLines={1} adjustsFontSizeToFit>{selected.label}: {selected.description}</Text>
      </View> : null}
      {items.map((item) => (
        <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`${item.label}: ${item.description}`} accessibilityState={{ selected: selectedLabel === item.label }} onPress={() => setSelectedLabel((current) => current === item.label ? null : item.label)} onHoverIn={() => setSelectedLabel(item.label)} onHoverOut={() => setSelectedLabel(null)} onFocus={() => setSelectedLabel(item.label)} onBlur={() => setSelectedLabel(null)} style={[trendStyles.column, { minWidth: columnWidth }]}>
          <View style={trendStyles.track}>
            {item.values.map((value, index) => <View key={index} style={[trendStyles.bar, { height: Math.max(2.56, value / maximum * 128), backgroundColor: value > 0 ? colors[index % colors.length] : theme.colors.paleBackground }]} />)}
          </View>
          <Text style={trendStyles.label} numberOfLines={1}>{item.axisLabel ?? item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function DashboardBars({ items, colors = [theme.colors.teal], compact: compactOverride, unit = 'currency' }: { items: ChartItem[]; colors?: string[]; compact?: boolean; unit?: 'currency' | 'percent' }) {
  if (Platform.OS === 'web') return <DashboardTrendBars items={items} colors={colors} />;
  const compact = compactOverride ?? true;
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

const trendStyles = StyleSheet.create({
  scroll: { marginTop: 24 },
  content: { position: 'relative', flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 36, paddingBottom: 4 },
  column: { flex: 1, alignItems: 'center', gap: 4 },
  track: { height: 128, width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bar: { flex: 1 },
  label: { height: 12, lineHeight: 12, fontSize: 10, color: theme.colors.muted, textAlign: 'center', maxWidth: '100%' },
  tooltip: { position: 'absolute', top: 0, zIndex: 1, borderRadius: 4, backgroundColor: theme.colors.ink, paddingHorizontal: 8, paddingVertical: 6 },
  tooltipText: { color: theme.colors.white, fontSize: 10, lineHeight: 14, fontWeight: '600' },
});

