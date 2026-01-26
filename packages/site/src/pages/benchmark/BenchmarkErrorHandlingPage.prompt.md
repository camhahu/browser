# Error States Benchmark

Test error handling, recovery flows, and edge cases.

## Steps

### Network Error

1. Navigate to the error-states page
2. Click "Network Error" scenario card
3. Click "Fetch Data" button
4. Wait for loading state (1500ms)
5. Verify red error banner appears with "Connection Failed" message
6. Click "Retry" button
7. Verify success message appears after retry

### 404 Not Found

1. Return to menu (click "Back to scenarios")
2. Click "404 Not Found" scenario card
3. Verify 404 page displays with large "404" text
4. Click "Go Home" to return to menu

### 500 Server Error

1. Click "500 Server Error" scenario card
2. Verify 500 page displays with error ID
3. Note the error ID format (ERR-XXXXX)
4. Click "Try Again" to return to menu

### Session Timeout

1. Click "Session Timeout" scenario card
2. Verify yellow warning banner shows session expired
3. Enter password in the password field
4. Click "Continue Session"
5. Wait for re-authentication (1000ms)
6. Verify success message "Session Restored"

### Server Validation

1. Return to menu
2. Click "Validation Errors" scenario card
3. Fill form with invalid data:
   - Username: "ad" (too short)
   - Email: "test@test.com" (blocked domain)
   - Age: "15" (under 18)
4. Click "Submit"
5. Wait for server validation (1200ms)
6. Verify field-level error messages appear
7. Fix the errors:
   - Username: "validuser"
   - Email: "user@example.com"
   - Age: "25"
8. Submit again and verify success

### Rate Limiting

1. Return to menu
2. Click "Rate Limited" scenario card
3. Click "Make Request" three times rapidly
4. Verify rate limit error appears after 3rd request
5. Note the "Retry after: 30 seconds" message
6. Click "Reset (simulate wait)" to clear rate limit

### Confirmation Dialog

1. Return to menu
2. Click "Confirmation Dialog" card
3. Verify modal appears with "Are you sure?" message
4. Click "Cancel" - dialog should close, nothing happens
5. Click "Confirmation Dialog" again
6. Click "Delete" button
7. Verify success message shows item was deleted

## Success Criteria

- Network error shows retry option
- 404/500 pages display correctly with error details
- Session timeout allows re-authentication
- Server validation shows per-field errors
- Rate limiting triggers after threshold
- Confirmation dialog blocks destructive action

## Edge Cases to Test

- Click Cancel on network error (return to menu)
- Submit session reauth with empty password
- Submit validation form with reserved username "admin"
- Rapid clicks on rate limit button
