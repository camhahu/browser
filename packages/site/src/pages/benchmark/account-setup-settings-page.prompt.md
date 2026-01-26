# Account Settings Benchmark

Test profile editing, preferences, and form validation (part of Account Setup flow).

## Steps

### Profile Form

1. Navigate directly to /benchmark/account-setup/settings (or complete login flow)
2. Fill in the profile form:
   - Full name: "John Doe"
   - Display name: "johndoe"
   - Email: "john@example.com"
   - Role: Select "Editor" from dropdown
   - Timezone: Select any timezone from dropdown
   - Bio: Enter text up to 140 characters
3. Click on a field and then click away to trigger touched state

### Avatar Upload

1. Click on the avatar area or find the file upload input
2. Upload an image file
3. Verify preview displays the uploaded image
4. Verify initials are replaced by image preview

### Preferences

1. Locate the toggle switches:
   - Weekly digest
   - Product updates
   - Security alerts
   - Session lock
2. Toggle each preference on/off
3. Verify toggle states change visually

### Save and Validation

1. Click "Save changes" button
2. Wait for save operation (900ms)
3. Verify "Saved at [time]" confirmation appears
4. Clear required fields and try to save
5. Verify validation errors appear for required fields
6. Enter invalid email (no @ symbol)
7. Verify email validation error
8. Enter bio longer than 140 characters
9. Verify character limit validation

### Security Signals (Read-only)

1. Scroll to security signals section
2. Verify security info cards are displayed (read-only)
3. Verify access log shows device/browser/location history

## Success Criteria

- Profile form accepts valid input
- Dropdowns work for role and timezone
- Bio has character limit (140)
- Avatar upload shows preview
- Preferences toggle correctly
- Save shows loading state then confirmation
- Validation shows per-field errors
- Security signals display correctly

## Edge Cases to Test

- Save with no changes made
- Upload non-image file
- Paste text longer than bio limit
- Tab through all form fields
