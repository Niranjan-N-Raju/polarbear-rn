import { getLanguage, getLocale, setLanguage, t, translateRole } from '../src/i18n';

describe('i18n', () => {
  afterEach(() => setLanguage('en'));

  it('translates interpolation values, missing values, and roles', () => {
      expect(t('adminStoreCount', { count: 3 })).toContain('3');
      expect(t('adminStoreCount')).toContain('');
      expect(translateRole('admin')).toBe(t('roleAdmin'));
      expect(translateRole('unrecognized')).toBe(t('unknownRole'));
    })
});

describe('Kannada localization', () => {
  afterEach(() => setLanguage('en'));

  it('uses Kannada strings for the admin users and profile screens', () => {
    setLanguage('kn');
    expect(getLanguage()).toBe('kn');
    expect(t('adminDashboard')).toBe('ಡ್ಯಾಶ್‌ಬೋರ್ಡ್');
    expect(t('adminStores')).toBe('ಮಳಿಗೆಗಳು');
    expect(t('adminUsers')).toBe('ಬಳಕೆದಾರರು');
    expect(t('adminPreferredLanguage')).toBe('ಆದ್ಯತೆಯ ಭಾಷೆ');
    expect(translateRole('franchise_admin')).toBe('ಮಳಿಗೆ ನಿರ್ವಾಹಕರು');
  });

  it('translates franchise navigation items and menu actions', () => {
    setLanguage('kn');
    expect(t('franchiseSales')).toBe('ಮಾರಾಟ');
    expect(t('franchiseInventory')).toBe('ದಾಸ್ತಾನು');
    expect(t('franchiseStoreGroup')).toBe('ಮಳಿಗೆ');
    expect(t('franchiseStaffGroup')).toBe('ಸಿಬ್ಬಂದಿ');
    expect(t('signOut')).toBe('ಸೈನ್ ಔಟ್');
  });

  it('falls back to English for strings not yet translated', () => {
    setLanguage('kn');
    expect(t('signIn')).toBe('Sign in');
  });

  it('exposes the formatting locale and translates newly added strings', () => {
    expect(getLocale()).toBe('en-IN');
    setLanguage('kn');
    expect(getLocale()).toBe('kn-IN');
    const kannada = [t('franchiseAttendanceRemoveConfirm', { name: 'Asha', date: '5' }), t('franchiseEmployeesSalaryInvalid')];
    setLanguage('en');
    const english = [t('franchiseAttendanceRemoveConfirm', { name: 'Asha', date: '5' }), t('franchiseEmployeesSalaryInvalid')];
    expect(kannada[0]).toContain('Asha');
    expect(kannada[0]).not.toBe(english[0]);
    expect(kannada[1]).not.toBe(english[1]);
  });
});
