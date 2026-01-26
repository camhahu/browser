# Account Setup Benchmark

Test a complete login and account settings flow.

## Steps

1. Navigate to `http://localhost:4244/benchmark/account-setup`.
2. Sign in with email `user@example.com` and password `password123` (ensure "Remember this device" is checked).
3. Complete 2FA with code `123456` and continue to settings.
4. Fill the profile form with the exact values below:
    - Full name: `Test User`
    - Display name: `testuser`
    - Email: `test@example.com`
    - Role: select `Platform Engineer`
    - Timezone: select `America/New_York`
    - Bio: `Building onboarding flows for browser CLI tests.`
5. Set preference toggles to these exact states (click to change if needed):
    - Weekly digest: off
    - Product updates: on
    - Security alerts: on
    - Session lock: off
6. Click "Save changes" and confirm the "Saved" message appears.
