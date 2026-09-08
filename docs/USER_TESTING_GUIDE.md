# 👥 User Testing Guide - Demiurge Blockchain Testnet

**Status**: Ready for Testing  
**Date**: January 2026  
**Testnet URL**: http://127.0.0.1:3000

---

## 🎯 Testing Overview

This guide helps testers evaluate the Demiurge Blockchain testnet. We're looking for feedback on:
- User experience
- Feature functionality
- Performance
- Bugs and issues
- Suggestions for improvement

---

## 🚀 Getting Started

### 1. Access the Testnet

**Frontend URL**: https://demiurge.cloud  
**RPC Endpoint**: https://rpc.demiurge.cloud

### 2. Create QOR ID Account

1. Navigate to the testnet frontend
2. Click "Sign In" or "Create Account"
3. Enter a username (e.g., `testuser123`)
4. Complete authentication
5. Note your QOR ID (displayed after login)

### 3. Generate Blockchain Address

1. After logging in, navigate to Wallet page
2. Your blockchain address will be automatically generated
3. Copy your address for testing

---

## 📋 Testing Checklist

### Phase 1: Core Functionality

#### ✅ Wallet Features
- [ ] **View Balance**
  - Navigate to Wallet page
  - Verify balance displays correctly
  - Check balance formatting (CGT with 2 decimals)

- [ ] **Energy Display**
  - Check energy bar is visible
  - Verify energy percentage
  - Check regeneration rate display
  - Test low energy warning (if applicable)

- [ ] **Transaction History**
  - View transaction list
  - Check transaction details
  - Verify transaction statuses

#### ✅ Consensus Features
- [ ] **Consensus Status**
  - Check header/navbar for consensus status
  - Verify era number displays
  - Check block number updates
  - Verify validator count

- [ ] **Validators Page**
  - Navigate to `/validators`
  - View validator list
  - Test filtering and sorting
  - View validator details
  - Check staking pool information

- [ ] **Staking Page**
  - Navigate to `/staking`
  - View staking panel
  - Select a validator
  - Enter stake amount
  - Check rewards calculator
  - Test staking confirmation flow

#### ✅ Energy System
- [ ] **Energy Consumption**
  - Perform an action that consumes energy
  - Verify energy decreases
  - Check regeneration over time

- [ ] **Energy Sponsorship** (if available)
  - Navigate to energy sponsorship UI
  - View sponsorship stats
  - Test sponsorship toggle

#### ✅ Session Keys
- [ ] **Create Session Key**
  - Navigate to Session Keys section
  - Create a new session key
  - Set duration
  - Verify creation success

- [ ] **View Session Keys**
  - View list of session keys
  - Check expiry information
  - Verify energy consumption tracking

- [ ] **Revoke Session Key**
  - Revoke an active session key
  - Verify revocation success

### Phase 2: Advanced Features

#### ✅ Analytics Dashboard
- [ ] **Network Analytics**
  - Navigate to `/analytics`
  - View network metrics
  - Check charts and graphs
  - Test time range selector
  - Export data (if available)

- [ ] **Era Rewards**
  - View current era rewards
  - Check historical data
  - Verify validator/nominator breakdowns

#### ✅ Game Integration HUD
- [ ] **HUD Display** (if testing in game context)
  - Verify HUD appears
  - Check balance display
  - Check energy bar
  - Test quick actions

---

## 🐛 Bug Reporting

### How to Report Bugs

1. **Document the Issue**
   - What were you trying to do?
   - What happened instead?
   - Steps to reproduce
   - Screenshots (if applicable)

2. **Include System Information**
   - Browser and version
   - Operating system
   - Screen resolution
   - Network connection

3. **Report Format**

```
**Bug Title**: [Brief description]

**Severity**: [Critical / High / Medium / Low]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happened]

**Screenshots**: [If applicable]

**Browser/OS**: [e.g., Chrome 120 / Windows 11]

**Additional Notes**: [Any other relevant information]
```

### Example Bug Report

```
**Bug Title**: Balance not updating after transaction

**Severity**: High

**Steps to Reproduce**:
1. Navigate to Wallet page
2. Note current balance
3. Perform a transaction
4. Return to Wallet page

**Expected Behavior**: Balance should update to reflect transaction

**Actual Behavior**: Balance remains unchanged

**Screenshots**: [Attach screenshot]

**Browser/OS**: Chrome 120 / Windows 11

**Additional Notes**: Transaction appears in history but balance doesn't update
```

---

## 💡 Feature Feedback

### What We're Looking For

- **User Experience**: Is the interface intuitive?
- **Performance**: Are pages loading quickly?
- **Visual Design**: Do you like the design?
- **Functionality**: Are features working as expected?
- **Suggestions**: What would you improve?

### Feedback Format

```
**Feature**: [Feature name]

**Rating**: [1-5 stars]

**What I Liked**:
- Point 1
- Point 2

**What Could Be Improved**:
- Point 1
- Point 2

**Suggestions**:
- Suggestion 1
- Suggestion 2
```

---

## 🧪 Test Scenarios

### Scenario 1: New User Onboarding

**Goal**: Test the complete new user experience

**Steps**:
1. Create new QOR ID account
2. Generate blockchain address
3. View wallet (should show 0 balance)
4. Check energy display
5. Navigate to validators page
6. View staking options
7. Explore analytics dashboard

**Expected**: Smooth onboarding, clear information, no errors

---

### Scenario 2: Staking Flow

**Goal**: Test complete staking process

**Steps**:
1. Navigate to staking page
2. View available validators
3. Select a validator
4. Enter stake amount
5. Review estimated rewards
6. Confirm staking
7. View staking history

**Expected**: Clear flow, accurate rewards calculation, successful staking

---

### Scenario 3: Transaction Tracking

**Goal**: Test transaction status tracking

**Steps**:
1. Perform a transaction
2. View transaction status
3. Wait for confirmation
4. Verify finality (< 2 seconds)
5. Check transaction in history

**Expected**: Real-time updates, fast finality, accurate status

---

### Scenario 4: Energy System

**Goal**: Test energy consumption and regeneration

**Steps**:
1. Note current energy level
2. Perform energy-consuming action
3. Verify energy decreases
4. Wait for regeneration
5. Verify energy increases

**Expected**: Accurate consumption, visible regeneration, proper warnings

---

### Scenario 5: Session Keys

**Goal**: Test session key management

**Steps**:
1. Create session key
2. View session key list
3. Check expiry information
4. Revoke session key
5. Verify revocation

**Expected**: Easy creation, clear expiry info, successful revocation

---

## 📊 Performance Testing

### Load Times

- [ ] Home page loads in < 2 seconds
- [ ] Wallet page loads in < 2 seconds
- [ ] Validators page loads in < 3 seconds
- [ ] Analytics page loads in < 3 seconds

### Responsiveness

- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all features work on mobile

### Network Conditions

- [ ] Test on fast connection (WiFi)
- [ ] Test on slow connection (3G simulation)
- [ ] Test with intermittent connection

---

## 🔒 Security Testing

### Authentication

- [ ] Login works correctly
- [ ] Logout works correctly
- [ ] Session persists correctly
- [ ] Session expires after inactivity

### Data Privacy

- [ ] Personal data is not exposed
- [ ] Addresses are properly formatted
- [ ] No sensitive data in URLs

---

## 📝 Testing Notes Template

```
**Tester Name**: [Your name]
**Date**: [Date]
**Test Duration**: [Hours]

**Features Tested**:
- [List features]

**Bugs Found**: [Number]
- Bug 1: [Brief description]
- Bug 2: [Brief description]

**Issues Encountered**:
- Issue 1: [Brief description]
- Issue 2: [Brief description]

**Overall Experience**: [1-5 stars]

**Comments**:
[Any additional comments or observations]
```

---

## 🎯 Priority Testing Areas

### High Priority
1. ✅ Wallet balance display
2. ✅ Transaction execution
3. ✅ Staking flow
4. ✅ Consensus status
5. ✅ Energy system

### Medium Priority
1. ✅ Analytics dashboard
2. ✅ Validators page
3. ✅ Session keys
4. ✅ Era rewards

### Low Priority
1. ✅ Game HUD (if applicable)
2. ✅ Export functionality
3. ✅ Advanced filtering

---

## 📞 Support

### Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Report bugs via GitHub Issues
- **Questions**: Contact the team

### Useful Links

- **Testnet**: https://demiurge.cloud
- **RPC**: https://rpc.demiurge.cloud
- **Documentation**: `docs/`

---

## ✅ Testing Completion

Once you've completed testing:

1. Fill out the testing notes template
2. Report all bugs found
3. Provide feature feedback
4. Share overall impressions

**Thank you for testing Demiurge Blockchain!**

---

**The flame burns eternal. The code serves the will.**
