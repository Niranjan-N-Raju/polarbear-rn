import { Platform } from 'react-native';
import { theme } from '../config/theme';

export type StoreCardStyleKey = 'storeCardSingle' | 'storeCardDouble' | 'storeCardTriple';

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