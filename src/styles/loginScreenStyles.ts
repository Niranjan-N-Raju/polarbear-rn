import { StyleSheet } from 'react-native';
import { theme } from '../config/theme';

const { colors, spacing, typography } = theme;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['5xl'],
    justifyContent: 'center',
  },
  containerWide: {
    backgroundColor: colors.sand,
    paddingHorizontal: spacing['8xl'],
    paddingVertical: spacing['10xl'],
    justifyContent: 'center',
  },
  webCompactContainer: {
    paddingVertical: spacing['5xl'],
    justifyContent: 'center',
  },
  webTabletContainer: {
    paddingHorizontal: spacing['8xl'],
    paddingVertical: spacing['5xl'],
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: theme.layout.loginMaxWidth,
    alignSelf: 'center',
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    ...theme.shadows.frame,
  },
  shellWide: {
    flexDirection: 'row',
    borderRadius: theme.radius.none,
  },
  shellCompact: {
    flex: 0,
    flexShrink: 1,
    maxHeight: '100%',
  },
  webCompactShell: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    maxHeight: '100%',
  },
  hero: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: theme.layout.loginHeroBasis,
    justifyContent: 'space-between',
    backgroundColor: colors.teal,
    paddingHorizontal: spacing['10xl'],
    paddingBottom: spacing['10xl'],
  },
  heroRingTop: {
    position: 'absolute',
    width: theme.layout.topHeroRingSize,
    height: theme.layout.topHeroRingSize,
    top: theme.layout.topHeroRingOffset,
    right: theme.layout.topHeroRingOffset,
    borderWidth: theme.layout.heroRingWidth,
    borderColor: colors.heroYellowRing,
  },
  heroRingBottom: {
    position: 'absolute',
    width: theme.layout.bottomHeroRingSize,
    height: theme.layout.bottomHeroRingSize,
    bottom: theme.layout.bottomHeroRingOffset,
    left: -spacing['10xl'] * 2,
    borderWidth: theme.layout.heroRingHeight,
    borderColor: colors.heroOrangeRing,
  },
  heroCopy: {
    maxWidth: theme.layout.heroCopyMaxWidth,
    marginTop: theme.layout.heroCopyTopMargin,
    marginBottom: theme.layout.heroCopyBottomMargin,
  },
  heroEyebrow: {
    color: colors.yellow,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: typography.letterSpacing.heroEyebrow,
  },
  heroHeading: {
    marginTop: spacing['2xl'],
    color: colors.white,
    fontSize: typography.hero,
    fontWeight: theme.fontWeight.medium,
    lineHeight: typography.heroLineHeight,
  },
  heroText: {
    marginTop: spacing['4xl'],
    color: colors.heroText,
    fontSize: typography.sm,
    lineHeight: spacing['7xl'],
  },
  heroFooter: {
    color: colors.heroMuted,
    fontSize: typography.xs,
  },
  formPanel: {
    flex: 1,
    backgroundColor: colors.white,
  },
  formPanelCompact: {
    flex: 0,
    flexShrink: 1,
  },
  webCompactFormPanel: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewCompact: {
    flex: 0,
    flexShrink: 1,
  },
  webCompactScrollView: {
    flex: 1,
    minHeight: 0,
  },
  mobileBrand: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing['5xl'],
    paddingBottom: spacing['3xl'],
  },
  mobileProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['6xl'],
    paddingBottom: spacing.lg,
  },
  mobileProgressOrange: {
    width: spacing['8xl'],
    height: spacing.xs,
    backgroundColor: colors.orange,
  },
  mobileProgressYellow: {
    width: spacing['5xl'] - spacing.xs,
    height: spacing.xs,
    backgroundColor: colors.yellow,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['6xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },
  scrollContentCompact: {
    flexGrow: 0,
  },
  webCompactScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: theme.layout.compactFormMaxWidth,
    alignSelf: 'center',
  },
  scrollContentWide: {
    justifyContent: 'center',
    paddingHorizontal: spacing['11xl'],
    paddingTop: spacing['8xl'],
  },
  successView: {
    flex: 1,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: theme.layout.brandMarkSize,
  },
  brandMark: {
    width: theme.layout.brandMarkSize,
    height: theme.layout.brandMarkSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.none,
    backgroundColor: colors.white,
    ...theme.shadows.brandMark,
  },
  brandMarkCompact: {
    width: theme.layout.compactBrandMarkSize,
    height: theme.layout.compactBrandMarkSize,
  },
  brandMarkText: {
    color: colors.teal,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.extraBold,
  },
  brand: {
    color: colors.white,
    fontSize: typography.xl,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: typography.letterSpacing.brand,
  },
  brandSubtitle: {
    marginTop: spacing.xxs,
    color: colors.ice,
    fontSize: typography.xs,
  },
  brandCompactName: {
    color: colors.yellow,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: typography.letterSpacing.compactBrand,
  },
  headingBlock: {
    marginBottom: spacing['3xl'],
  },
  eyebrowMobile: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.welcomeTint,
  },
  eyebrow: {
    color: colors.orange,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: typography.letterSpacing.eyebrow,
  },
  heading: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: theme.fontWeight.medium,
    lineHeight: typography.headingLineHeight,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.sm,
    lineHeight: typography.bodyLineHeight,
  },
  form: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
  input: {
    height: theme.layout.inputHeight,
    marginTop: spacing.md,
    paddingLeft: theme.layout.inputIconGutter,
    paddingRight: theme.layout.inputIconGutter,
    borderWidth: theme.border.width,
    borderColor: colors.inputBorder,
    borderRadius: theme.radius.none,
    backgroundColor: colors.inputBackground,
    color: colors.primaryText,
    fontSize: typography.sm,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    zIndex: 1,
    left: theme.layout.inputIconLeft,
    top: theme.layout.inputIconTop,
  },
  visibilityButton: {
    position: 'absolute',
    zIndex: 1,
    top: theme.layout.visibilityButtonTop,
    right: theme.layout.visibilityButtonRight,
    width: theme.layout.iconButtonSize,
    height: theme.layout.iconButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: colors.error,
    marginBottom: spacing.sm,
  },
  fieldError: {
    marginTop: -spacing.xxs,
    marginBottom: spacing['2xl'],
    color: colors.error,
    fontSize: typography.xs,
  },
  showPassword: {
    color: colors.muted,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  signInButton: {
    height: theme.layout.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.none,
    backgroundColor: colors.orange,
    shadowColor: colors.orange,
    ...theme.shadows.button,
  },
  signInButtonPressed: {
    opacity: theme.opacity.pressed,
  },
  signInText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
  signInArrow: {
    position: 'absolute',
    right: spacing['3xl'],
  },
  formError: {
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.errorBorder,
    borderRadius: theme.radius.none,
    backgroundColor: colors.errorBackground,
    color: colors.error,
    fontSize: typography.xsPlus,
    lineHeight: spacing['5xl'] - spacing.xs,
  },
  userSummary: {
    marginTop: spacing['7xl'],
    padding: spacing['3xl'],
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    borderRadius: theme.radius.none,
    backgroundColor: colors.paleBackground,
  },
  userEmail: {
    color: colors.ink,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.medium,
  },
  userRole: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.xsPlus,
    textTransform: 'capitalize',
  },
  secondaryButton: {
    minHeight: theme.layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['3xl'],
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    borderRadius: theme.radius.none,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    paddingTop: spacing.lg,
    color: colors.quiet,
    fontSize: typography.xs,
    textAlign: 'center',
  },
});

export function getLoginSafeAreaStyles(
  topInset: number,
  bottomInset: number,
  viewportHeight: number,
) {
  return {
    heroTop: {
      paddingTop: Math.max(topInset, theme.spacing['9xl']),
    },
    mobileBrandTop: {
      paddingTop:
        Math.max(topInset, theme.spacing['7xl']) + theme.spacing.lg,
    },
    scrollBottom: {
      paddingBottom: Math.max(
        bottomInset + theme.spacing['2xl'],
        theme.spacing['7xl'],
      ),
    },
    webCompactShell: {
      height: Math.max(
        Math.min(
          theme.layout.webCompactCardHeight,
          viewportHeight - theme.spacing['5xl'] * 2,
        ),
        0,
      ),
    },
  };
}

export function getSignInButtonStyle(isPending: boolean) {
  return ({ pressed }: { pressed: boolean }) => [
    styles.signInButton,
    (pressed || isPending) && styles.signInButtonPressed,
  ];
}