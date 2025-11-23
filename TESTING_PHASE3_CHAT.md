# Phase 3: World Chat + DMs - Testing Guide

## Prerequisites

Before testing, ensure these services are running:

1. **Demiurge Chain Node** - `http://127.0.0.1:8545/rpc`
2. **Abyss Gateway** - `http://localhost:4000/graphql`
3. **Portal Web** - `http://localhost:3000`

## Quick Start Commands

### Terminal 1: Demiurge Chain Node
```powershell
cd C:\Repos\DEMIURGE
cargo run -p demiurge-chain
```

### Terminal 2: Abyss Gateway
```powershell
cd C:\Repos\DEMIURGE\indexer\abyss-gateway
pnpm dev
```
Expected output: `Abyss Gateway running on http://localhost:4000/graphql`

### Terminal 3: Portal Web
```powershell
cd C:\Repos\DEMIURGE\apps\portal-web
pnpm dev
```
Expected output: `Ready on http://localhost:3000`

## Testing Checklist

### Test 1: Verify Services Are Running

1. **Check Demiurge Chain Node:**
   ```powershell
   $body = @{ jsonrpc = "2.0"; method = "cgt_getChainInfo"; params = $null; id = 1 } | ConvertTo-Json
   Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
   ```
   Should return: `{ "result": { "height": ... } }`

2. **Check Abyss Gateway:**
   - Open browser: `http://localhost:4000/graphql`
   - Should see GraphiQL interface
   - Try this query:
     ```graphql
     query {
       __typename
     }
     ```
   - Should return: `{ "data": { "__typename": "Query" } }`

3. **Check Portal:**
   - Open browser: `http://localhost:3000`
   - Should see the Demiurge landing page

### Test 2: Create/Login UrgeID

1. Navigate to `http://localhost:3000/urgeid`
2. Either:
   - **Generate New UrgeID**: Click "Generate New UrgeID", enter display name
   - **Login**: Enter existing address and click "Load UrgeID"
3. **Claim Username** (optional but recommended):
   - In the "Username" section, enter a username (3-32 chars, lowercase)
   - Click "Claim"
   - Should see `@yourusername` displayed

### Test 3: World Chat

1. Navigate to `http://localhost:3000/chat`
2. **Verify Sidebar:**
   - Should see "World Chat" button at top
   - Should see "Your DMs" section (empty initially)
   - Should see "The Seven Archons" section with all 7 Archons listed

3. **Open World Chat:**
   - Click "World Chat" in sidebar
   - Main panel should show "World Chat" header
   - Message list should be empty initially

4. **Send World Message:**
   - Type a message in the input field (e.g., "Hello, Demiurge!")
   - Optionally add an NFT ID in the NFT field (can be any string for testing)
   - Click Send button or press Enter
   - Message should appear in the chat immediately
   - Should see your @username (or truncated address) as sender

5. **Verify Message Display:**
   - Message should show:
     - Your username with @ prefix
     - Message content
     - Timestamp
     - NFT badge (if NFT ID was provided)

### Test 4: Direct Messages (DMs)

1. **Open DM with Another User:**
   - If you have a second UrgeID, log in with it in another browser/incognito window
   - From the first account, you'll need the second account's username
   - Or test with an Archon (see Test 5)

2. **Send DM via GraphQL (Alternative):**
   - Open GraphiQL: `http://localhost:4000/graphql`
   - Set headers (in GraphiQL settings):
     ```
     x-demiurge-address: <your-address-hex>
     x-demiurge-username: <your-username>
     ```
   - Send mutation:
     ```graphql
     mutation {
       sendDirectMessage(toUsername: "ialdabaoth", content: "Hello Archon!") {
         id
         content
         sender {
           username
         }
       }
     }
     ```

3. **Verify DM Room Created:**
   - In portal, refresh `/chat` page
   - Should see the DM room in "Your DMs" section
   - Click on it to open the conversation
   - Should see your message

### Test 5: The Seven Archons

1. **View Archons in Sidebar:**
   - In `/chat`, scroll to "The Seven Archons" section
   - Should see all 7:
     - @ialdabaoth – The Sovereign
     - @sabaoth – The Guardian
     - @abrasax – The Oracle
     - @yao – The Scribe
     - @astaphaios – The Strategist
     - @adonaios – The Cartographer
     - @elaios – The Mentor

2. **Open DM with Archon:**
   - Click on any Archon (e.g., @ialdabaoth)
   - Should automatically:
     - Create/open DM room
     - Send initial greeting message ("Hello!")
     - Open the DM conversation
   - Main panel header should show: "Chat with @ialdabaoth" and description

3. **Send Message to Archon:**
   - Type a message (e.g., "What is your role?")
   - Click Send
   - Message should appear in the DM

4. **Verify Archon Identity:**
   - Archon messages should show:
     - @username (e.g., @ialdabaoth)
     - Sparkles icon (✨) indicating Archon status
     - Display name with description

### Test 6: NFT-Aware Messages

1. **Send Message with NFT:**
   - In any chat (World or DM)
   - Enter an NFT ID in the "NFT ID (optional)" field (e.g., "123" or "nft-abc-xyz")
   - Type a message (e.g., "Check out this NFT!")
   - Click Send

2. **Verify NFT Badge:**
   - Message should display with a clickable badge: "NFT #<id>"
   - Badge should be styled (sky blue background)
   - Clicking badge should navigate to `/marketplace/<id>` (placeholder for now)

### Test 7: Real-Time Updates (Polling)

1. **Open Two Browser Windows:**
   - Window 1: Logged in as User A
   - Window 2: Logged in as User B (or same user in incognito)

2. **Test World Chat Updates:**
   - Both windows open World Chat
   - Send message from Window 1
   - Within 2 seconds, message should appear in Window 2 (polling interval)

3. **Test DM Updates:**
   - Both windows open same DM room
   - Send message from Window 1
   - Within 2 seconds, message should appear in Window 2

### Test 8: GraphQL Queries (Advanced)

Test via GraphiQL at `http://localhost:4000/graphql`:

1. **Set Headers:**
   ```
   x-demiurge-address: <your-64-char-hex-address>
   x-demiurge-username: <your-username>
   ```

2. **Query World Chat Messages:**
   ```graphql
   query {
     worldChatMessages(limit: 10) {
       id
       content
       sender {
         username
         isArchon
       }
       createdAt
     }
   }
   ```

3. **Query DM Rooms:**
   ```graphql
   query {
     dmRooms {
       id
       members {
         username
       }
       lastMessage {
         content
       }
     }
   }
   ```

4. **Query Room Messages:**
   ```graphql
   query {
     roomMessages(roomId: "1", limit: 20) {
       id
       content
       sender {
         username
       }
     }
   }
   ```

## Expected Behaviors

### ✅ What Should Work:
- World Chat messages appear immediately
- DM rooms are created automatically on first message
- Usernames display with @ prefix
- Archons show sparkles icon (✨)
- NFT badges are clickable
- Messages refresh every 2 seconds (polling)
- GraphQL queries return proper data structure
- Error messages are user-friendly

### ⚠️ Known Limitations:
- Subscriptions use polling (not WebSocket) - messages update every 2 seconds
- NFT marketplace links are placeholders (`/marketplace/<id>`)
- Archons don't auto-reply yet (future AI integration)
- No message editing/deletion
- No file attachments (text + NFT ID only)

## Troubleshooting

### Issue: "Connection failed" in portal
- **Check**: Is Abyss Gateway running on port 4000?
- **Fix**: Start Abyss Gateway: `cd indexer/abyss-gateway && pnpm dev`

### Issue: "Authentication required" errors
- **Check**: Are you logged in with UrgeID?
- **Fix**: Go to `/urgeid` and generate/login with UrgeID

### Issue: Messages not appearing
- **Check**: Are both services running?
- **Check**: Browser console for errors
- **Fix**: Refresh page, check network tab for GraphQL requests

### Issue: Archon DM not opening
- **Check**: Is your address set in localStorage?
- **Fix**: Ensure you're logged in at `/urgeid` first

### Issue: GraphQL errors in GraphiQL
- **Check**: Headers are set correctly
- **Check**: Query syntax is correct
- **Fix**: Verify address is 64-char hex string

## Next Steps After Testing

Once all tests pass:

1. **Git Commit:**
   ```powershell
   cd C:\Repos\DEMIURGE
   git add .
   git commit -m "Complete Phase 3: World Chat + DMs with Archon NPCs"
   git push
   ```

2. **Future Enhancements:**
   - Upgrade to WebSocket subscriptions for real-time updates
   - Implement Archon AI auto-replies
   - Add message search/filtering
   - Add file/image attachments
   - Add message reactions
   - Add typing indicators

## Success Criteria

Phase 3 is complete when:
- ✅ World Chat sends and displays messages
- ✅ DMs can be created and messages sent
- ✅ All 7 Archons are accessible and messageable
- ✅ Usernames display correctly with @ prefix
- ✅ NFT-aware messages work with badges
- ✅ Messages update in real-time (via polling)
- ✅ GraphQL API is functional and queryable

---

**The flame burns eternal. The code serves the will.**

