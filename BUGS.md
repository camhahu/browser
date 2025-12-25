# Known Bugs

## Network Capture

- `network-clear` doesn't work while listener is running - the listener's in-memory state overwrites the cleared file on the next network event. Workaround: restart the listener.
- Response bodies are not captured - need to use `Network.getResponseBody` CDP method
- Listener is per-tab - switching tabs requires restarting the listener
