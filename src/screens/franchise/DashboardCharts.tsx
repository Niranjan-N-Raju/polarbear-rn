import { getLocale } from '../../i18n';
import { ScrollView, Text, View } from 'react-native';
import { theme } from '../../config/theme';
import { franchiseStyles as styles } from './franchiseStyles';

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

interface ChartItem {
  label: string;
  values: number[];
  description: string;
}

export function DashboardBars({ items, colors = [theme.colors.teal] }: { items: ChartItem[]; colors?: string[] }) {
  const maximum = Math.max(1, ...items.flatMap((item) => item.values));
  return (
    <ScrollView horizontal contentContainerStyle={styles.chartContent}>
      {items.map((item) => (
        <View key={item.label} style={styles.chartColumn} accessible accessibilityLabel={`${item.label}: ${item.description}`}>
          <View style={styles.chartBars}>
            {item.values.map((value, index) => (
              <View key={index} style={[styles.bar, {
                height: Math.max(2, (value / maximum) * 128),
                backgroundColor: value === 0 ? theme.colors.beige : colors[index % colors.length],
              }]} />
            ))}
          </View>
          <Text style={styles.chartValue}>{item.description}</Text>
          <Text style={styles.chartLabel}>{item.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

