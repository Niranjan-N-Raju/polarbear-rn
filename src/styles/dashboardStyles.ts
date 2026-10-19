import { Platform, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

const { colors, spacing, typography } = theme;
const isWeb = Platform.OS === 'web';

export const dashboardStyles = StyleSheet.create({
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isWeb ? 12 : spacing.md,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 96,
    justifyContent: 'space-between',
    padding: isWeb ? 16 : spacing.lg,
    borderWidth: theme.border.width,
    borderColor: isWeb ? colors.beige : '#E5E7EB',
    backgroundColor: colors.white,
    borderRadius: theme.radius.none,
    ...(isWeb ? {
      shadowColor: '#1F292B',
      shadowOffset: { width: 0, height: 2.5 },
      shadowOpacity: 0.045,
      shadowRadius: 8,
      elevation: 1,
    } : {}),
  },
  statCardWide: {
    width: isWeb ? '22%' : '22.5%',
    flexGrow: isWeb ? 1 : 0,
  },
  statCardTablet: {
    width: '31%',
    flexGrow: 1,
  },
  statCardTeal: {
    borderTopWidth: 3,
    borderTopColor: colors.teal,
  },
  statCardOrange: {
    borderTopWidth: 3,
    borderTopColor: colors.orange,
  },
  statIconTile: {
    position: 'absolute',
    top: isWeb ? 16 : spacing.md,
    right: isWeb ? 16 : spacing.md,
    width: isWeb ? 40 : 32,
    height: isWeb ? 40 : 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    backgroundColor: colors.sand,
  },
  statIconTeal: {
    borderTopColor: colors.teal,
  },
  statIconOrange: {
    borderTopColor: colors.orange,
  },
  statLabel: {
    maxWidth: isWeb ? '72%' : '78%',
    color: colors.muted,
    fontSize: isWeb ? 12 : 11,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: isWeb ? 1.2 : 1,
    textTransform: 'uppercase',
  },
  statValueTeal: {
    color: colors.teal,
  },
  statValueOrange: {
    color: colors.orange,
  },
  statValue: {
    marginTop: isWeb ? 12 : spacing.lg,
    fontSize: isWeb ? 24 : typography.xl,
    fontWeight: theme.fontWeight.bold,
  },
});