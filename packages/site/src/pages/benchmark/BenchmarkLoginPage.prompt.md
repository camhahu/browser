# Account Setup Benchmark

Test a complete login and account settings flow.

## Steps

1. Navigate to the login page
2. Fill in the email field with "user@example.com"
3. Fill in the password field with "password123"
4. Check the "Remember this device" checkbox if not already checked
5. Click the "Sign in" button
6. Wait for the 2FA modal to appear
7. Enter "123456" in the verification code field
8. Click "Verify" button
9. Wait for redirect to settings page
10. On settings page, fill in profile fields:
    - Full name: "Test User"
    - Display name: "testuser"
    - Email: "test@example.com"
    - Select a role from dropdown
    - Select a timezone from dropdown
    - Enter a bio (max 140 chars)
11. Toggle some preferences on/off
12. Click "Save changes" button
13. Verify the "Saved" confirmation appears

## Success Criteria

- Login form submits successfully
- 2FA modal captures focus
- 2FA code validates and redirects
- Profile form saves with validation
- Preferences toggle correctly
- Save operation shows confirmation

## Edge Cases to Test

- Submit login with empty fields (should show validation)
- Submit invalid 2FA code (should show error)
- Try to save with invalid email format
- Exceed bio character limit
