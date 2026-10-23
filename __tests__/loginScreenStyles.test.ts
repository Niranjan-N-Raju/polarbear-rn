import { getLoginSafeAreaStyles, getSignInButtonStyle, styles as loginStyles } from '../src/styles/loginScreenStyles';

describe('loginScreenStyles', () => {
  it('returns safe-area and pressed button styles', () => {
      expect(getLoginSafeAreaStyles(0, 0, 200).webCompactShell.height).toBe(152);
      expect(getLoginSafeAreaStyles(100, 80, 900).heroTop.paddingTop).toBe(100);
      const buttonStyle = getSignInButtonStyle(false);
      expect(buttonStyle({ pressed: false })).toEqual([loginStyles.signInButton, false]);
      expect(buttonStyle({ pressed: true })).toEqual([loginStyles.signInButton, loginStyles.signInButtonPressed]);
      expect(getSignInButtonStyle(true)({ pressed: false })).toEqual([loginStyles.signInButton, loginStyles.signInButtonPressed]);
    })
});
