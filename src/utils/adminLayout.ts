import { Platform } from 'react-native';
import { theme } from '../config/theme';

export type StoreCardStyleKey = 'storeCardSingle' | 'storeCardDouble' | 'storeCardTriple';
export type DashboardCardColor = 'teal' | 'orange';

export function getDashboardCardColor(index: number, nativeColor: DashboardCardColor, isWeb: boolean): DashboardCardColor {
  if (!isWeb) return nativeColor;
  return index % 2 === 0 ? 'teal' : 'orange';
}

export function getAdminLayout(width: number) {
  const isWeb = Platform.OS === 'web';
  const hasSidebar = isWeb && width >= theme.layout.adminSidebarBreakpoint;
  const desktopWeb = hasSidebar;

  let storeCardStyle: StoreCardStyleKey | null = null;
  if (isWeb) {
    storeCardStyle = width >= 1280 ? 'storeCardTriple' : width >= 640 ? 'storeCardDouble' : 'storeCardSingle';
  }

  return {
    isWeb,
    hasSidebar,
    compactWeb: isWeb && !hasSidebar,
    desktopWeb,
    storeFiltersInline: isWeb && width >= 768,
    dashboardCardsTablet: width >= 768 && width < theme.layout.adminSidebarBreakpoint,
    dashboardCardsWide: hasSidebar,
    dashboardEyebrow: !isWeb || desktopWeb,
    dashboardIconSize: isWeb ? 16 : theme.layout.iconSize,
    sidebarIconSize: isWeb ? 20 : theme.layout.iconSize,
    storeCardStyle,
    usersTable: hasSidebar,
    profileTwoColumn: hasSidebar,
  } as const;
}

export function getResponsiveDrawerLayout(width: number, height: number, presentation: 'drawer' | 'dialog' = 'drawer') {
  const layout = getAdminLayout(width);
  if (presentation === 'dialog') return { isWeb: layout.isWeb, position: 'dialog' as const, hiddenOffset: 0 };
  if (layout.hasSidebar) return { isWeb: true, position: 'right' as const, hiddenOffset: width * 0.3 };
  return { isWeb: layout.isWeb, position: 'bottom' as const, hiddenOffset: height * 0.7 };
}