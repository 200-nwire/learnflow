# Flow Simulator - Layout Modes

## 🔄 Two Layout Modes for Different Use Cases

The Flow Simulator supports **two layout modes** optimized for different workflows.

---

## 📊 **Flow Layout** (Default)

### Purpose: **Understanding Relationships & Branching**

Visualizes the complete learning path as an interactive graph showing all connections and branching logic.

### Features:
- ✅ **Graph visualization** - See all page connections
- ✅ **Conditional edges** - Rule labels on connections
- ✅ **Branching paths** - Multiple routes visually distinct
- ✅ **Hierarchical layout** - Auto-organized by levels
- ✅ **Smart positioning** - Branches spread horizontally

### Best For:
- Understanding how pages connect
- Seeing all possible paths at once
- Testing branching logic
- QA validation of rules
- Demonstrating adaptive learning concept

### Visual Structure:
```
      [P1: Intro]
           ↓
      [P2: Quiz]
      /    |    \
   P3a   P3b    P4
  (proj) (enrich) (skip)
      \    |    /
           ↓
      [P4: Final]
```

### Auto-Layout Logic:
1. Assigns each page to a hierarchical level
2. Spreads branches horizontally at same level
3. Centers single nodes
4. 220px vertical spacing between levels
5. 280px horizontal spacing for branches

---

## 📝 **Linear Layout** (Authoring Mode)

### Purpose: **Content Authoring & Sequential View**

Displays pages in a clean vertical list, perfect for creating and editing content without visual clutter.

### Features:
- ✅ **Vertical stacking** - Pages listed top to bottom
- ✅ **No edges shown** - Clean, distraction-free
- ✅ **Branch indicators** - Small tags above branched pages
- ✅ **Condition labels** - Shows why page is in the path
- ✅ **Indented branches** - Alternative paths indented horizontally

### Best For:
- Content creation and editing
- Focusing on individual pages
- Sequential workflow
- Page ordering and organization
- Clean presentation

### Visual Structure:
```
[P1: Intro]
    ↓
[P2: Quiz]
    ↓ (branches)
    ├─ [P3a: Project]       [track: project]
    ├─ [P3b: Enrichment]    [track: enrichment && engagement > 0.6]
    └─ [P4: Final]          [track: core && accuracy > 0.8]
        ↓
[P4: Final] (if not reached via skip)
```

### Layout Logic:
1. Topological sort for correct page order
2. Detects branching points (pages with multiple outgoing edges)
3. Main pages centered (x: 450)
4. Branch alternatives indented left/right (±320px)
5. Branch condition shown as tag above node
6. 190px vertical spacing for regular pages
7. 220px extra space after branch groups

---

## 🔄 Switching Between Modes

### Toggle Button:
Located in **top-right panel** of the canvas

- **Flow mode** → Shows **list icon** (click to switch to linear)
- **Linear mode** → Shows **sitemap icon** (click to switch to flow)

### Keyboard Shortcut (Future):
- `L` - Switch to Linear mode
- `F` - Switch to Flow mode

### What Happens on Switch:
1. Layout algorithm re-runs
2. Nodes reposition automatically
3. Edges show/hide (hidden in linear)
4. Branch info updates
5. Smooth transition

---

## 📐 Layout Comparison

| Aspect | Flow Mode | Linear Mode |
|--------|-----------|-------------|
| **Edges** | Visible with labels | Hidden |
| **Positioning** | Graph-based | Vertical list |
| **Branches** | Spread horizontally | Indented left/right |
| **Best For** | Understanding logic | Content authoring |
| **Visual** | Complex graph | Simple list |
| **Clutter** | More connections | Minimal |
| **Navigation** | Pan/zoom required | Scroll only |

---

## 🎯 Use Cases by Mode

### Flow Mode Use Cases:

1. **QA Testing**
   - Verify all branches work
   - Test edge case paths
   - Validate rule conditions

2. **Path Design**
   - Design complex branching
   - See full picture
   - Understand flow logic

3. **Demonstration**
   - Show adaptive learning
   - Explain personalization
   - Present to stakeholders

4. **Student Journey Analysis**
   - Visualize actual paths taken
   - Identify common routes
   - Find bottlenecks

### Linear Mode Use Cases:

1. **Content Authoring**
   - Write page content
   - Edit blocks
   - Add variants
   - Focus on individual pages

2. **Sequential Planning**
   - Order pages logically
   - See full sequence
   - Plan progression

3. **Review & Editing**
   - Clean view of all pages
   - No distraction from edges
   - Quick scanning

4. **Export for Print**
   - Clean layout
   - Easy to screenshot
   - Document structure

---

## 🎨 Visual Indicators in Each Mode

### Flow Mode Indicators:

**Nodes:**
- 🔵 Blue ring - Currently active page
- ✅ Green border - Previously visited
- 🟣 Purple border - Has multiple variants
- 🎨 Color tint - Difficulty level

**Edges:**
- 🟢 Green thick line - Condition met
- ⚫ Gray line - Condition not met
- ⚡ Animated - Currently active path
- 🏷️ Tag label - Condition text

### Linear Mode Indicators:

**Nodes:**
- Same as flow mode (active, visited, variants, difficulty)
- 🏷️ Tag above - Branch condition (when applicable)
- ↔️ Horizontal indent - Shows alternatives

**No Edges:**
- Connections implied by position
- Conditions shown on nodes instead
- Cleaner visual

---

## 🔧 Implementation Details

### Auto-Layout Algorithm

**Flow Mode (Graph Layout):**
```typescript
1. Assign hierarchical levels (BFS from start)
2. Group nodes by level
3. Calculate horizontal distribution
4. Center each level
5. Spread branches evenly
6. Apply positions
```

**Linear Mode (List Layout):**
```typescript
1. Topological sort for order
2. Detect branching points
3. Position main path vertically
4. Indent branch alternatives horizontally
5. Add branch info to node data
6. Extra spacing after branches
```

### Smart Branch Detection:
- Counts outgoing edges per node
- Nodes with >1 outgoing edge = branching point
- Branch targets indented to show alternatives
- Condition labels attached to branch nodes

---

## 🎯 Best Practices

### When to Use Flow Mode:
- ✅ Testing complete learning paths
- ✅ Validating branching logic
- ✅ Understanding flow relationships
- ✅ Presenting adaptive concepts
- ✅ QA testing all routes

### When to Use Linear Mode:
- ✅ Creating new content
- ✅ Editing existing pages
- ✅ Reviewing page sequence
- ✅ Focused authoring work
- ✅ Clean screenshots/docs

### Switching Strategy:
1. **Start in Flow** - Design overall structure
2. **Switch to Linear** - Author content for each page
3. **Back to Flow** - Test and validate
4. **Iterate** - Refine based on testing

---

## 🎨 Customization

### Adjust Spacing (Flow Mode):
```typescript
const levelHeight = 220;      // Vertical spacing
const nodeSpacing = 280;      // Horizontal spacing
```

### Adjust Spacing (Linear Mode):
```typescript
const regularSpacing = 190;   // Between pages
const branchSpacing = 220;    // After branches
const branchIndent = 320;     // Horizontal offset
```

### Change Initial Mode:
```typescript
const layoutMode = ref<'flow' | 'linear'>('linear');  // Start in linear
```

---

## ✅ Summary

**Two modes, one purpose: Make adaptive learning path design easy!**

- **Flow Mode** - Understand relationships, test logic
- **Linear Mode** - Author content, focus on pages

Toggle freely between them as needed. Both modes:
- Share same data
- Update in real-time
- Support simulation
- Show active rules

---

**Toggle Button:** Top-right panel in canvas
**Shortcut:** Click the sitemap/list icon
**Transition:** Automatic and smooth

