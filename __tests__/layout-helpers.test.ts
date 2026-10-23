import { Platform } from 'react-native';
import { getAdminLayout, getResponsiveDrawerLayout } from '../src/utils/adminLayout';
import { dashboardStatCards, getDashboardCardColor, getDashboardLayout } from '../src/utils/dashboardConfig';

const originalPlatform = Platform.OS;
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform }));

describe('layout-helpers', () => {
  it('selects native and web layouts and responsive drawer positions', () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
      expect(getAdminLayout(390)).toMatchObject({ isWeb: false, storeCardStyle: null, usersTable: false });
      expect(getResponsiveDrawerLayout(390, 800)).toMatchObject({ position: 'bottom', hiddenOffset: 560 });
      expect(getResponsiveDrawerLayout(390, 800, 'dialog')).toMatchObject({ position: 'dialog', hiddenOffset: 0 });
  
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      expect(getAdminLayout(700).storeCardStyle).toBe('storeCardDouble');
      expect(getAdminLayout(1100).storeCardStyle).toBe('storeCardTriple');
      expect(getAdminLayout(1300)).toMatchObject({ hasSidebar: true, storeCardStyle: 'storeCardTriple' });
      expect(getResponsiveDrawerLayout(1300, 800)).toMatchObject({ position: 'right', hiddenOffset: 390 });
      expect(getDashboardLayout(900).dashboardCardsTablet).toBe(true);
      expect(getDashboardLayout(1300).dashboardCardsWide).toBe(true);
      expect(getDashboardCardColor(0, 'orange', true)).toBe('teal');
      expect(getDashboardCardColor(1, 'teal', true)).toBe('orange');
      expect(getDashboardCardColor(1, 'teal', false)).toBe('teal');
      expect(dashboardStatCards).toHaveLength(8);
    })
});
