import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { summaryCardStyles as styles } from '../styles/summaryCardStyles';

export interface SummaryCardItem {
  key?: string;
  label: string;
  value: string | number;
  color: string;
  Icon: ComponentType<{ color?: string; size?: number }>;
  selected?: boolean;
  onPress?: () => void;
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
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].key ?? row[0].label} style={styles.row}>
          {row.map((card) => <SummaryCard key={card.key ?? card.label} card={card} isWeb={isWeb} />)}
          {/* Keep cards in a short final row the same width as the rows above. */}
          {rows.length > 1
            ? Array.from({ length: perRow - row.length }, (_, index) => <View key={`placeholder-${index}`} style={styles.placeholder} />)
            : null}
        </View>
      ))}
    </View>
  );
}

function SummaryCard({ card, isWeb }: { card: SummaryCardItem; isWeb: boolean }) {
  const { label, value, color, Icon, selected, onPress } = card;
  const style = [styles.card, { borderTopColor: color }, isWeb && styles.cardWeb, selected && styles.cardSelected, selected && { borderTopColor: color }];
  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        <View style={styles.icon}>
          <Icon color={color} size={16} />
        </View>
      </View>
      <Text style={[styles.value, isWeb && styles.valueWeb, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: Boolean(selected) }}
        accessibilityLabel={`${label}: ${value}`}
        onPress={onPress}
        style={style}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={style}>
      {content}
    </View>
  );
}
