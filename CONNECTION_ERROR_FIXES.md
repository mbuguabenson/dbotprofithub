# WebSocket Connection Error Fixes

## Root Cause Identified
The error "WebSocket is not connected" occurred due to a race condition between the WebSocket connection becoming OPEN and the deriv-api.ts trying to send authorization immediately.

## Errors Fixed

### 1. Race Condition in deriv-api.ts:278
**Problem**: The `send()` method was rejecting messages if `readyState !== WebSocket.OPEN`, but the connection was still initializing.

**Solution**: 
- Added intelligent retry logic that waits up to 1 second for the WebSocket to stabilize
- Retries every 100ms instead of immediately rejecting
- Maximum 10 retry attempts before failure

### 2. Connection Stabilization Delay
**Problem**: After `onopen` fires, the WebSocket may not be fully ready to send messages immediately.

**Solution**:
- Added 500ms stabilization delay in deriv-api-context.tsx after connect() completes
- Ensures the WebSocket is fully initialized before sending authorization

### 3. Authorization Timeout
**Problem**: Authorization requests could hang if the WebSocket became unresponsive.

**Solution**:
- Added 10-second timeout on authorization requests
- Properly rejects with clear error message if authorization takes too long

## Files Modified

1. **/lib/deriv-api.ts** (lines 263-298)
   - Enhanced send() method with retry logic
   - Added authorization timeout wrapper (325-342)

2. **/lib/deriv-api-context.tsx** (lines 56-61)
   - Added 500ms stabilization delay after connection
   - Better logging for debugging

## Expected Behavior
- WebSocket connects successfully
- Connection stabilizes for 500ms
- Authorization is sent with proper timeout handling
- No more "WebSocket is not connected" errors during normal operation
- Graceful error handling with exponential backoff reconnection

## Testing
The connection should now:
1. Connect to wss://ws.derivws.com/websockets/v3
2. Authorize within 10 seconds
3. Load active symbols within 5 seconds (with fallback)
4. Maintain connection with auto-reconnection on failure
