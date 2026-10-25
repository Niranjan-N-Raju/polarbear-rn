import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { salesStyles } from '../sales/salesStyles';

export interface SummaryCardItem {
  label: string;
  value: string;
  color: string;
  Icon: ComponentType<{ color?: string; size?: number }>;
}

interface SummaryCardsProps {
  cards: SummaryCardItem[];
  isWeb: boolean;
  perRow: number;
}

export function SummaryCards({ cards, isWeb, perRow }: SummaryCardsProps) {
  const rows: SummaryCardItem[][] = [];
  for (let index = 0; index < cards.length; index += perRow) rows.push(cards.slice(index, index + perRow));
  return (
    <View style={salesStyles.summaryGrid}>
      {rows.map((row) => (
        <View key={row[0].label} style={salesStyles.summaryRow}>
          {row.map(({ label, value, color, Icon }) => (
            <View
              key={label}
              accessible
              accessibilityLabel={`${label}: ${value}`}
              style={[salesStyles.summaryCard, { borderTopColor: color }, isWeb && salesStyles.summaryCardWeb]}
            >
              <View style={salesStyles.summaryHeader}>
                <Text style={salesStyles.summaryLabel} numberOfLines={2}>{label}</Text>
                <View style={salesStyles.summaryIcon}>
                  <Icon color={color} size={16} />
                </View>
              </View>
              <Text
                style={[salesStyles.summaryValue, isWeb && salesStyles.summaryValueWeb, { color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
