// The iPhone app's App Store listing. Leave APP_STORE_ID empty until Apple
// approves the app; then paste the numeric id from App Store Connect
// (App Information › Apple ID, e.g. '6741234567') and every "Download on
// the App Store" badge on the site switches on. Also add the Smart App
// Banner meta tag in index.html (see docs/app-store.md › Launch day).
export const APP_STORE_ID = ''

export const APP_STORE_URL = APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}` : ''
