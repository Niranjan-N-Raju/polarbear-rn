import { Platform } from 'react-native';
import { theme } from '../config/theme';

export type StoreCardStyleKey = 'storeCardSingle' | 'storeCardDouble' | 'storeCardTriple';

export function getAdminLayout(width: number) {
  const isWeb = Platform.OS === 'web';
  const hasSidebar = isWeb && width >= theme.layout.adminSidebarBreakpoint;
  const desktopWeb = isWeb && width >= 640;

  let storeCardStyle: StoreCardStyleKey | null = null;
  if (isWeb) {
    storeCardStyle = width >= 1280 ? 'storeCardTriple' : width >= 640 ? 'storeCardDouble' : 'storeCardSingle';
  }

  return {
    isWeb,
    hasSidebar,
    compactWeb: isWeb && !hasSidebar,
    desktopWeb,
    dashboardCardsWide: width >= (isWeb ? 640 : theme.layout.tabletBreakpoint),
    dashboardEyebrow: !isWeb || desktopWeb,
    dashboardIconSize: isWeb ? 16 : theme.layout.iconSize,
    sidebarIconSize: isWeb ? 20 : theme.layout.iconSize,
    storeCardStyle,
    usersTable: hasSidebar,
    profileTwoColumn: hasSidebar,
  } as const;
}