# Account Settings Benchmark

Test profile editing, preferences, and form validation (settings page only).

## Steps

1. Navigate to `http://localhost:4244/benchmark/account-setup/settings`.
2. Fill the profile form with the exact values below:
   - Full name: `John Doe`
   - Display name: `johndoe`
   - Email: `john@example.com`
   - Role: select `Security Engineer`
   - Timezone: select `Asia/Singapore`
   - Bio: `Hands-on security leader shipping reliable tooling.`
3. Click inside the Email field, then click outside the form to trigger touched state.
4. Upload an avatar using the file input with `packages/site/public/vite.svg`.
5. Set preference toggles to these exact states (click to change if needed):
   - Weekly digest: on
   - Product updates: off
   - Security alerts: on
   - Session lock: on
6. Click "Save changes" and confirm the "Saved" message appears.
7. Clear the Full name and Email fields so they are empty.
8. Click "Save changes" again and confirm validation errors appear.
9. Fix the fields with:
   - Full name: `Jane Roe`
   - Email: `jane@example.com`
10. Replace the Bio with this 160-character string (paste exactly):
    `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
11. Click "Save changes" and confirm the bio length validation error appears.
