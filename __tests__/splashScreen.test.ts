import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

describe('launch splash configuration', () => {
  it('uses the original SVG centered on both axes before web JavaScript loads', () => {
    const html = read('index.html');
    expect(html).toContain('src="/splash-screen.svg"');
    expect(html).toContain('align-items: center');
    expect(html).toContain('justify-content: center');
    expect(html.indexOf('id="bootsplash"')).toBeLessThan(html.indexOf('src="/src/web.tsx"'));
  });

  it('centers iOS artwork against the screen rather than the safe area', () => {
    const storyboard = read('ios/reactnative/BootSplash.storyboard');
    expect(storyboard).toMatch(/firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX"/);
    expect(storyboard).toMatch(/firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY"/);
    expect(read('ios/reactnative/Info.plist')).toMatch(/UILaunchStoryboardName<\/key>\s*<string>BootSplash<\/string>/);
    expect(read('ios/reactnative/SceneDelegate.swift')).toContain('RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)');
  });

  it('uses the Android system splash theme and initializes it before the activity starts', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain('android:theme="@style/BootTheme"');
    expect(read('android/app/src/main/res/values/styles.xml')).toContain('<item name="postBootSplashTheme">@style/AppTheme</item>');
    const activity = read('android/app/src/main/java/com/reactnative/MainActivity.kt');
    expect(activity.indexOf('RNBootSplash.init')).toBeLessThan(activity.indexOf('super.onCreate'));
    const manifest = JSON.parse(read('assets/bootsplash/manifest.json'));
    expect(manifest.background).toBe('#ffffff');
    expect(manifest.logo.width).toBe(128);
  });
});
