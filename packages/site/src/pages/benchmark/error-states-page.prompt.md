# Error States Benchmark

Test error handling and recovery flows.

## Steps

### Network Error

1. Navigate to `http://localhost:4244/benchmark/error-states`.
2. Click the "Network Error" scenario card.
3. Click "Fetch Data".
4. Click "Retry" once the error appears.

### 404 Not Found

6. Click "Back to scenarios".
7. Click the "404 Not Found" scenario card.
8. Click "Go Home".

### 500 Server Error

9. Click the "500 Server Error" scenario card.
10. Click "Try Again" to return to scenarios.

### Session Timeout

11. Click the "Session Timeout" scenario card.
12. In the password field, type `password123`.
13. Click "Continue Session" and confirm the session restores.

### Server Validation

15. Click "Back to scenarios".
16. Click the "Validation Errors" scenario card.
17. Fill the form with:
    - Username: `ad`
    - Email: `test@test.com`
    - Age: `15`
18. Click "Submit" and confirm validation errors appear.
19. Replace the fields with:
    - Username: `validuser`
    - Email: `user@example.com`
    - Age: `25`
20. Click "Submit".

### Rate Limiting

21. Click "Back to scenarios".
22. Click the "Rate Limited" scenario card.
23. Click "Make Request" three times in a row.
24. Click "Reset (simulate wait)".

### Confirmation Dialog

25. Click "Back to scenarios".
26. Click the "Confirmation Dialog" scenario card.
27. Click "Cancel".
28. Click the "Confirmation Dialog" card again.
29. Click "Delete".
