# Testing Guide - AbyssID Registration Flow

## Complete End-to-End Testing

This guide walks through testing the full AbyssID registration flow from start to finish.

---

## 🚀 **Prerequisites**

### **1. Start Backend Services**

#### **AbyssID Backend**
```bash
cd apps/abyssid-backend
npm install  # If not already done
node src/db-init.js  # Initialize database (if first time)
node src/server.js
```

**Expected Output:**
```
AbyssID Backend running on port 3001
Database: ./data/abyssid.db
```

**Verify:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","service":"abyssid-backend"}
```

#### **Portal Web**
```bash
cd apps/portal-web
pnpm install  # If not already done
pnpm dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

---

## 🧪 **Test Scenarios**

### **Test 1: Successful Registration Flow**

#### **Steps:**
1. Open browser to `http://localhost:3000`
2. Navigate to any Fracture route (e.g., `/haven`)
3. Click "AbyssID" button in navigation
4. **Verify:** AbyssIDDialog opens with "THE ABYSS DOES NOT ASK" message
5. Enter username: `testuser123`
6. Click "Engage"
7. **Verify:** 
   - State changes to "checking"
   - Shader effects animate (turbulence, pulse)
   - Loading indicator appears
8. **Verify:** 
   - State changes to "accept"
   - Message: "The Abyss remembers you"
   - Shader shows bloom effect
9. Click "Begin Binding"
10. **Verify:**
    - State changes to "binding"
    - Seed phrase is generated and displayed
    - Shader shows vignette effect
11. Click "I Have Secured My Key"
12. **Verify:**
    - State changes to "confirm"
    - Message: "THE VOID OPENS"
    - Shader shows bloom effect
13. Click "Enter Haven"
14. **Verify:**
    - Dialog closes
    - Navigates to `/haven`
    - Identity is displayed on Haven page
    - Username, address, public key shown
    - Created date shown

#### **Expected Results:**
- ✅ All state transitions work smoothly
- ✅ Shader effects react to state changes
- ✅ Identity persists in localStorage
- ✅ Identity displays on Haven page
- ✅ Backend database contains registration

#### **Verify Backend:**
```bash
# Check registered identity
curl http://localhost:3001/api/abyssid/testuser123

# Expected response:
# {
#   "username": "testuser123",
#   "address": "0x...",
#   "createdAt": 1234567890
# }
```

---

### **Test 2: Username Already Taken**

#### **Steps:**
1. Register `testuser123` (from Test 1)
2. Open AbyssIDDialog again
3. Enter username: `testuser123`
4. Click "Engage"
5. **Verify:**
   - State changes to "checking"
   - Then changes to "reject"
   - Error message: "Username already taken"
   - Shader shows glitch effect
   - Input field has red border

#### **Expected Results:**
- ✅ Backend correctly rejects duplicate username
- ✅ Error message is user-friendly
- ✅ User can try again with different username

---

### **Test 3: Username Too Short**

#### **Steps:**
1. Open AbyssIDDialog
2. Enter username: `ab` (2 characters)
3. Click "Engage"
4. **Verify:**
   - State immediately changes to "reject"
   - Error message: "Username must be at least 3 characters"
   - No API call is made (client-side validation)

#### **Expected Results:**
- ✅ Client-side validation works
- ✅ No unnecessary API calls
- ✅ Error message is clear

---

### **Test 4: Backend Unavailable**

#### **Steps:**
1. Stop AbyssID backend (`Ctrl+C` or kill process)
2. Open AbyssIDDialog
3. Enter username: `testuser456`
4. Click "Engage"
5. **Verify:**
   - State changes to "checking"
   - Then changes to "reject"
   - Error message: "Failed to check username availability. Is the backend running?"

#### **Expected Results:**
- ✅ Graceful error handling
- ✅ User-friendly error message
- ✅ No app crash

---

### **Test 5: Identity Persistence**

#### **Steps:**
1. Complete registration (from Test 1)
2. Refresh page (`F5` or `Cmd+R`)
3. Navigate to `/haven`
4. **Verify:**
   - Identity is still displayed
   - Username, address, public key shown
   - No need to re-register

#### **Expected Results:**
- ✅ Identity loads from localStorage
- ✅ Persists across page reloads
- ✅ Available throughout app

---

### **Test 6: Logout**

#### **Steps:**
1. Navigate to `/haven` with identity loaded
2. Click logout button (red icon in top-right of identity card)
3. **Verify:**
   - Identity card disappears
   - "No AbyssID Found" message appears
   - "Create AbyssID" button shown
   - localStorage cleared

#### **Expected Results:**
- ✅ Identity is cleared from context
- ✅ localStorage is cleared
- ✅ User can create new identity

---

### **Test 7: Audio-Reactive Shader Effects**

#### **Prerequisites:**
- Microphone access or background music available

#### **Steps:**
1. Open AbyssIDDialog
2. Grant microphone access (if prompted)
3. **Verify:**
   - Shader effects react to audio input
   - Turbulence increases with low frequencies
   - Chroma shift increases with mid frequencies
   - Bloom pulses with high frequencies

#### **Expected Results:**
- ✅ Audio reactivity works (if audio source available)
- ✅ Shader effects are enhanced by audio
- ✅ Effects fade when audio stops (silence decay)

---

## 🔍 **Debugging**

### **Check Browser Console**

Open DevTools (`F12`) and check for:
- ✅ No errors in console
- ✅ API calls succeed (Network tab)
- ✅ localStorage contains identity

### **Check Backend Logs**

```bash
# If using PM2
pm2 logs abyssid-backend

# If running directly
# Check terminal output for errors
```

### **Check Database**

```bash
cd apps/abyssid-backend
sqlite3 data/abyssid.db "SELECT * FROM abyssid_identities;"
```

### **Common Issues**

#### **"Failed to check username availability"**
- **Cause:** Backend not running or wrong URL
- **Fix:** Start backend, check `NEXT_PUBLIC_ABYSSID_API_URL`

#### **"Username already taken" (but it's new)**
- **Cause:** Database not cleared, or previous test data
- **Fix:** Clear database or use different username

#### **Identity not persisting**
- **Cause:** localStorage disabled or cleared
- **Fix:** Check browser settings, verify localStorage works

#### **Shader not animating**
- **Cause:** Audio not connected or no audio source
- **Fix:** Grant microphone access or connect background music

---

## ✅ **Test Checklist**

### **Core Functionality**
- [ ] Username availability check works
- [ ] Registration saves to backend
- [ ] Identity persists in localStorage
- [ ] Identity displays on Haven page
- [ ] Logout clears identity
- [ ] Error handling works gracefully

### **UI/UX**
- [ ] All state transitions are smooth
- [ ] Shader effects react to states
- [ ] Audio-reactive effects work (if audio available)
- [ ] Error messages are clear
- [ ] Loading states are visible

### **Backend Integration**
- [ ] API calls succeed
- [ ] Database stores registrations
- [ ] Duplicate usernames are rejected
- [ ] Error responses are handled

### **Edge Cases**
- [ ] Short usernames rejected
- [ ] Backend unavailable handled
- [ ] Network errors handled
- [ ] Page refresh preserves identity

---

## 📊 **Test Results Template**

```
Test Date: __________
Tester: __________
Environment: Local / Production

Test 1: Successful Registration
[ ] Pass [ ] Fail
Notes: __________

Test 2: Username Already Taken
[ ] Pass [ ] Fail
Notes: __________

Test 3: Username Too Short
[ ] Pass [ ] Fail
Notes: __________

Test 4: Backend Unavailable
[ ] Pass [ ] Fail
Notes: __________

Test 5: Identity Persistence
[ ] Pass [ ] Fail
Notes: __________

Test 6: Logout
[ ] Pass [ ] Fail
Notes: __________

Test 7: Audio-Reactive Shader
[ ] Pass [ ] Fail
Notes: __________

Overall Status: [ ] All Pass [ ] Some Fail
Issues Found: __________
```

---

## 🎯 **Next Steps After Testing**

1. **If all tests pass:**
   - ✅ Ready for production
   - Document any known limitations
   - Proceed with deployment

2. **If tests fail:**
   - Document issues
   - Fix bugs
   - Re-test affected scenarios

3. **Enhancements:**
   - Add more test scenarios
   - Improve error messages
   - Enhance shader effects
   - Add loading indicators

---

**The flame burns eternal. The code serves the will.**

