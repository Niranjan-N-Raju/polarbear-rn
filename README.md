This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

## Launch splash screen

Android, iOS, and web display the artwork from `public/splash-screen.svg`
centered horizontally and vertically on a white background. The native
launch resources are generated from that SVG; web displays the SVG directly.
The splash fades out after the React app mounts, without a fixed delay.
The 128dp logo width fits Android's system splash safe area without cropping.

After changing the SVG, regenerate the native assets:

```sh
npx react-native-bootsplash generate public/splash-screen.svg --platforms=android,ios --background=FFFFFF --logo-width=128
```

Run `bundle exec pod install` from `ios/` after installing the splash dependency,
then rebuild the mobile apps. Reloading JavaScript does not update native
launch resources.

## Android release signing

Release builds never fall back to the repository's debug keystore. Supply
`ANDROID_RELEASE_STORE_FILE`, `ANDROID_RELEASE_STORE_PASSWORD`,
`ANDROID_RELEASE_KEY_ALIAS`, and `ANDROID_RELEASE_KEY_PASSWORD` through your
local shell or CI secret store. Keep the production keystore outside the repository.
Missing signing configuration fails the release build; debug builds are unchanged.
If a distributed release previously used the debug key, arrange signing-key
rotation through your distribution provider before publishing an update.

## Development login defaults

Copy `.env.example` to `.env`. For native development clients, set `TEST_LOGIN_EMAIL` and `TEST_LOGIN_PASSWORD` to prefill the login form; for the web dev server, use `VITE_TEST_LOGIN_EMAIL` and `VITE_TEST_LOGIN_PASSWORD` (the `TEST_*` keys are accepted as a dev-server fallback). The local `.env` is ignored by Git. Never put real production credentials in these keys.

### Local backend connectivity

Development defaults to `https://polarbear-be.vercel.app/api` on native and web.
Devices need internet access; a shared local network is not required.
`https://polarbear-be.vercel.app/api/greet` is the public greeting endpoint.
Check `https://polarbear-be.vercel.app/api/health` before troubleshooting sign-in;
it should return HTTP 200 with a connected database.

If the backend address or port changes, explicitly set `API_BASE_URL`
(native) and `VITE_API_BASE_URL` (web) in your ignored `.env`. These overrides
take precedence over the development default. Restart Vite after changing
environment variables; native environment changes require a rebuild.
Production must continue to use an explicitly configured HTTPS endpoint.

## Release environment and transport security

Release builds read `.env.production` (copy `.env.production.example`). Every `TEST_*` key must be empty and `API_BASE_URL` must be an `https://` URL; the Android `preReleaseBuild` task and the iOS Release bundle phase (`scripts/check-release-env.sh`) fail the build otherwise. Build iOS Release with `ENVFILE=.env.production`. Web production builds (`vite build`) require an `https://` `VITE_API_BASE_URL`, inject a Content-Security-Policy, never include test credentials, and emit no source maps. Development builds may use `http://` only for localhost, the Android emulator host, and private LAN addresses.

Release Android builds set `FLAG_SECURE` to block screenshots and the recents preview; iOS covers the app with a blank view before the app-switcher snapshot. The session token lives only in memory, and API requests time out after 30 seconds.

## Franchise-admin workspace

The product catalog is read-only for franchise admins; platform administrators
manage shared products through the authenticated backend API. Store stock,
consumption, and disposal workflows remain available to franchise admins.

Administrator and franchise-admin accounts can sign in. Franchise admins must have a store association. One accessible store is selected automatically; multiple stores require a selection before any dashboard data is requested. Use **Switch store** in the sidebar/mobile menu to recheck accessible stores and select another. Selection is cleared on sign-out, and all dashboard requests are scoped to that selected store.

Both administrator and franchise sign-out actions request server-side session
revocation before clearing local state, including sign-out from the initial
store picker and no-store screen. A successful revocation invalidates all
sessions for that account. If the server is unreachable or rejects the
revocation, the app logs a warning and still clears its local session; copied
tokens are not guaranteed to be revoked in that fallback. The API's strict
issuer/audience token contract requires existing sessions to sign in again
after rollout.

The dashboard migrates the Next.js summary cards, sales trend (date range, This Week, This Month), employee attrition, weekday sales, top expenses, and payment mix. Dates use `YYYY-MM-DD`; apply the filters after editing. Attendance summary is explicitly marked as not calculated yet, matching Next.js. Loading, empty-data, and request-error states are separate; Refresh retries dashboard requests.

### Dashboard module boundaries

- `FranchiseDashboardScreen` composes the screen and summary cards; keep request
  effects out of the screen component.
- `src/screens/franchise/dashboard/useFranchiseDashboard.ts` owns scoped requests,
  cancellation, refresh, draft date filters, and validation.
- `SalesTrendCard` renders trend controls and sales; `DashboardInsights` renders
  the remaining insight sections using the existing shared chart helpers.
- `src/components/FilterDrawer.tsx` provides the shared responsive filter shell,
  heading, close control, and Clear/Apply actions. Both dashboard date filters
  and the sales list reuse it. `DateRangeFilterDrawer` supplies reusable date
  fields; callers own validation and what Clear means.

The Sales Trend filter icon opens the date drawer. Closing without applying
discards edits on the next open; Apply validates before updating the graph,
and Clear restores the current month. Week/month shortcuts remain in the heading.

### Date pickers

Date fields use Android system date dialogs, the iOS native date spinner with
Done/Cancel controls, and browser-native date inputs on web. Month navigation
also offers a date picker; selecting a day selects its month. Roster selection
normalizes the selected day to the start of its week. API values remain local
calendar dates (`YYYY-MM-DD`), without UTC day shifts. Existing form validation
still applies. After installing dependencies, run `bundle exec pod install`
from `ios/` and rebuild both native apps to link
`@react-native-community/datetimepicker`; a Metro reload alone is insufficient.

The full source menu is present: Dashboard; Store (Sales, Inventory, P&L, Withdrawals); Staff (Employees, Attendance, Salary); Profile; and Store Config. Dashboard and the existing shared Profile screen work in this phase. Remaining screens are labeled **Not yet migrated**, rather than displaying fictitious operational data.

The mobile menu respects device safe areas and scrolls when space is limited, including its store-switch and sign-out actions. Every route and group has its own relevant icon. Store and Staff groups animate their height, opacity, and chevron rotation when expanded or collapsed; the mobile drawer fades in and out. The collapsed desktop sidebar uses icon-only actions.

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
