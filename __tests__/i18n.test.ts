import { t, translateRole } from '../src/i18n';

describe('i18n', () => {
  it('translates interpolation values, missing values, and roles', () => {
      expect(t('adminStoreCount', { count: 3 })).toContain('3');
      expect(t('adminStoreCount')).toContain('');
      expect(translateRole('admin')).toBe(t('roleAdmin'));
      expect(translateRole('unrecognized')).toBe(t('unknownRole'));
    })
});
