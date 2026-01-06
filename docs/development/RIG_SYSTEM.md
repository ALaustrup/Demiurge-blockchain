# Rig System - On-Chain Development State Management

**Last Updated**: January 5, 2026  
**Status**: Design & Implementation

---

## Overview

**Rig** (short for "Rigging") is an innovative on-chain development state management system designed exclusively for Demiurge Blockchain and AbyssOS. It replicates Git's save-state branching concept but automatically handles all Git processes based on the amount of changes made, logging rigs directly to the user's on-chain ledger.

---

## Core Concept

### Traditional Git Flow
```
Developer makes changes → git add → git commit → git push
```

### Rig Flow
```
Developer makes changes → "rig it" → System automatically:
  1. Analyzes changes
  2. Creates commit message
  3. Logs to on-chain ledger
  4. Stores rig hash
```

---

## How It Works

### Automatic Change Detection

When a developer calls `rig it`, the system:

1. **Calculates Changes**
   - Counts modified files
   - Measures code changes (lines added/removed)
   - Tracks file additions/deletions
   - Calculates change magnitude

2. **Generates Rig Entry**
   - Creates unique rig ID
   - Generates descriptive message based on changes
   - Timestamps the rig
   - Prepares on-chain submission

3. **Submits to Chain**
   - Uses `work_claim` module (or dedicated `rig` module)
   - Stores rig hash on-chain
   - Links rig to developer's account
   - Updates project rig history

4. **Updates Local State**
   - Saves rig entry to project
   - Updates rig history
   - Marks files as "rigged"

### Change Magnitude Calculation

```typescript
function calculateChanges(project: Project): number {
  let changes = 0;
  const lastRigTime = project.rigHistory.length > 0 
    ? project.rigHistory[project.rigHistory.length - 1].timestamp 
    : project.createdAt;
  
  // Count files modified since last rig
  for (const file of project.files) {
    if (file.type === 'file' && file.content) {
      changes += file.content.length;
    }
  }
  
  return Math.floor(changes / 100); // Normalize
}
```

---

## Rig Entry Structure

```typescript
interface RigEntry {
  id: string;              // Unique rig ID
  timestamp: number;        // Unix timestamp
  message: string;         // Auto-generated or custom message
  changes: number;         // Change magnitude
  filesChanged: string[];  // List of modified files
  onChainHash?: string;    // On-chain transaction hash
}
```

---

## On-Chain Storage

### Option 1: Work Claim Module (Current)

Rigs are submitted via the existing `work_claim` module:

```rust
// In work_claim module
pub fn submit_rig(
    state: &mut State,
    caller: Address,
    project_id: String,
    rig_id: String,
    changes: u64,
    files_changed: u64,
) -> Result<String, String> {
    // Store rig entry
    // Return rig hash
}
```

### Option 2: Dedicated Rig Module (Future)

A dedicated `rig_registry` module could be created:

```rust
pub struct RigEntry {
    pub id: String,
    pub project_id: String,
    pub developer: Address,
    pub timestamp: u64,
    pub message: String,
    pub changes: u64,
    pub files_changed: Vec<String>,
    pub on_chain_hash: String,
}
```

---

## Integration with CRAFT

### CLI Command

```bash
demiurge craft rig [--message "Custom message"]
```

### CRAFT UI

- **Rig Button**: Prominent "⚒️ Rig It" button in toolbar
- **Rig History**: View all rigs for a project
- **Auto-Rig**: Option to auto-rig on save
- **Rig Status**: Visual indicator of unrigged changes

### Automatic Message Generation

Based on change analysis:

- **Small changes** (< 100 lines): "Minor updates"
- **Medium changes** (100-500 lines): "Feature updates"
- **Large changes** (> 500 lines): "Major refactoring"
- **New files**: "Added [file count] files"
- **Deleted files**: "Removed [file count] files"

---

## Benefits

### For Developers

1. **Simplicity**: One command instead of multiple Git commands
2. **Automatic**: No need to think about commit messages
3. **On-Chain**: Permanent record of development history
4. **Transparent**: All rigs visible on-chain
5. **Integrated**: Works seamlessly with CRAFT IDE

### For the Ecosystem

1. **Developer Reputation**: On-chain proof of development activity
2. **Project History**: Complete development timeline
3. **Contribution Tracking**: Measure developer contributions
4. **Audit Trail**: Immutable record of all changes
5. **Rewards**: Potential CGT rewards for active development

---

## Comparison with Git

| Feature | Git | Rig |
|---------|-----|-----|
| **State Management** | ✅ | ✅ |
| **History Tracking** | ✅ | ✅ |
| **Branching** | ✅ | ⚠️ (Future) |
| **Merging** | ✅ | ⚠️ (Future) |
| **On-Chain** | ❌ | ✅ |
| **Automatic** | ❌ | ✅ |
| **Developer Reputation** | ❌ | ✅ |
| **CGT Integration** | ❌ | ✅ |

---

## Future Enhancements

### Phase 1: Basic Rigging (Current)
- ✅ Change detection
- ✅ On-chain storage
- ✅ Rig history
- ✅ Auto-message generation

### Phase 2: Advanced Features
- [ ] Rig branching (like Git branches)
- [ ] Rig merging
- [ ] Rig collaboration (team rigs)
- [ ] Rig rewards (CGT for active development)

### Phase 3: Enterprise Features
- [ ] Rig analytics dashboard
- [ ] Developer contribution graphs
- [ ] Project health metrics
- [ ] Automated testing on rig

---

## Security Considerations

### On-Chain Storage

- **Cost**: Each rig requires a transaction (CGT fee)
- **Spam Prevention**: Minimum change threshold
- **Rate Limiting**: Max rigs per time period
- **Validation**: Verify rig data integrity

### Privacy

- **File Contents**: Not stored on-chain (only metadata)
- **Hashes**: Store file hashes, not full content
- **Selective Rigging**: Option to exclude sensitive files

---

## Implementation Status

### ✅ Completed

- Rig entry structure
- Change calculation
- On-chain submission (via work_claim)
- CRAFT UI integration
- Rig history tracking

### ⏳ In Progress

- Dedicated rig module
- Advanced branching
- Collaboration features

### 📋 Planned

- Rig analytics
- Developer reputation system
- Automated rewards

---

## Usage Examples

### Basic Rigging

```typescript
// In CRAFT IDE
// Developer makes changes to files
// Clicks "⚒️ Rig It" button
// System automatically:
//   1. Calculates changes: 250 lines
//   2. Generates message: "Feature updates"
//   3. Submits to chain
//   4. Returns rig hash: "0xabc123..."
```

### CLI Rigging

```bash
# Rig current project
demiurge craft rig

# Rig with custom message
demiurge craft rig --message "Fixed critical bug"

# View rig history
demiurge craft rigs --project my-project
```

---

## Technical Details

### Change Detection Algorithm

1. **File Comparison**: Compare current state with last rig
2. **Content Analysis**: Measure content changes (characters, lines)
3. **Structure Analysis**: Track file additions/deletions
4. **Normalization**: Convert to standardized change metric

### On-Chain Submission

```typescript
const rigData = {
  project_id: currentProject.id,
  rig_id: rigEntry.id,
  changes: changes,
  files_changed: rigEntry.filesChanged.length,
  timestamp: rigEntry.timestamp,
};

const result = await demiurgeRpc.submitWorkClaim({
  game_id: 'craft',
  session_id: `rig-${currentProject.id}`,
  depth_metric: changes,
  active_ms: Date.now() - currentProject.updatedAt,
  extra: JSON.stringify(rigData),
});
```

---

## Best Practices

1. **Rig Frequently**: Rig after completing logical units of work
2. **Meaningful Changes**: Don't rig trivial changes (use threshold)
3. **Review Before Rigging**: Check changes before rigging
4. **Use Custom Messages**: Override auto-messages when needed
5. **Track Rig History**: Review rig history regularly

---

## Conclusion

The Rig system provides a revolutionary approach to development state management, combining the best of Git with on-chain transparency and automatic processing. It simplifies the developer experience while creating a permanent, verifiable record of development activity.

---

*The flame burns eternal. The code serves the will.*
