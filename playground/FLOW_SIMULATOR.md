# Flow Simulator - Visual Learning Path Navigator

## 🎯 Overview

The **Flow Simulator** is a visual navigation graph that lets you design, simulate, and test adaptive learning paths with conditional branching based on student context and performance.

## ✨ Features

### 📊 Visual Flow Graph
- **Interactive canvas** with drag, zoom, and pan
- **Custom page nodes** showing:
  - Page ID and title
  - Learning track assignment
  - Content variants (with indicator)
  - Block count and types
  - Active/visited status
- **Conditional edges** displaying:
  - Rule conditions (track, accuracy, engagement)
  - Condition status (met/unmet)
  - Animated flow for active paths

### 🎮 Student Simulation Controls

**Left Sidebar** - Configure student context:
- **Learning Track** - Core, Project, or Enrichment
- **Performance Metrics**
  - Accuracy slider (0-100%)
  - Engagement slider (0-100%)
  - Streak counter
- **Enrichment Settings**
  - Enable/disable enrichment track
- **Path Control**
  - Start simulation
  - Step forward (follows rules)
  - Reset path

### 📍 Path Replay & Tracking

**Right Sidebar** shows:
- **Learning Path** - Complete journey visualization
  - Step-by-step progression
  - Decision reasons for each step
  - Current position indicator
- **Path Statistics**
  - Total steps taken
  - Unique pages visited
  - Branching points encountered
  - Track switches
- **Export/Share** functionality

### 🔍 Page Details Panel

Click any node to view:
- Page metadata (ID, title, track)
- **Content variants** with:
  - Difficulty levels
  - Theme and modality
  - Currently selected variant
- **Content blocks** with types:
  - Text, Video, Question
  - Multiple choice, File upload
  - Image, Interactive elements

## 🌲 Branching Logic

The flow uses **conditional rules** for branching:

### Example Rules:

```javascript
// Track-based branching
"track: project"          // Only project track students
"track: enrichment"       // Only enrichment track

// Performance-based branching  
"accuracy > 0.8"          // High performers only
"engagement > 0.6"        // Engaged students

// Combined conditions
"track: enrichment && engagement > 0.6"
"track: core && accuracy > 0.8"
"enrichment && engagement <= 0.6"
```

### How It Works:

1. **Student starts at P1** (Introduction)
2. **Adjust settings** in left sidebar
3. **Click "Start Simulation"**
4. **Rules evaluate** based on current context
5. **Valid paths highlight** in green
6. **Click "Step Forward"** to progress
7. **Path records** each decision
8. **Visualization updates** in real-time

## 🎨 Visual Indicators

### Node Colors:
- **Green tint** - Easy difficulty
- **Blue tint** - Standard difficulty  
- **Red tint** - Hard difficulty
- **Purple border** - Has multiple variants
- **Blue ring** - Currently active
- **Green border** - Previously visited

### Edge Colors:
- **Green stroke** - Condition met (valid path)
- **Gray stroke** - Condition not met
- **Animated** - Currently active path
- **Faded** - Inactive path

## 📐 Example Learning Path Structures

### Simple Linear Path:
```
P1 (Intro) 
  → P2 (Quiz)
    → P4 (Final)
```

### Project Track Branch:
```
P1 (Intro)
  → P2 (Quiz)
    → P3a (Project Work)  [if track: project]
      → P4 (Final)
```

### Enrichment Branch:
```
P1 (Intro)
  → P2 (Quiz)
    → P3b (Extended Practice)  [if track: enrichment && engagement > 0.6]
      → P4 (Final)
```

### Performance-Based Skip:
```
P1 (Intro)
  → P2 (Quiz)
    → P4 (Final)  [if track: core && accuracy > 0.8]
```

## 🎓 Use Cases

### 1. Test Different Student Profiles

**Struggling Learner:**
- Accuracy: 45%
- Engagement: 50%
- Track: Core
- **Expected Path:** P1 → P2 → P4 (skip optional content)

**High Performer:**
- Accuracy: 95%
- Engagement: 85%
- Track: Enrichment
- **Expected Path:** P1 → P2 → P3b → P4 (enrichment path)

**Project-Based Learner:**
- Accuracy: 75%
- Engagement: 70%
- Track: Project
- **Expected Path:** P1 → P2 → P3a → P4 (project path)

### 2. Validate Branching Rules

- Set specific conditions in sidebar
- Watch edge colors change (green = met)
- Step through to verify correct branching
- Review path decisions in right sidebar

### 3. Design Complex Paths

- Add new pages/nodes
- Define conditional rules
- Test different student scenarios
- Ensure all paths reach completion

### 4. Quality Assurance

- Verify no dead ends (pages with no exit)
- Ensure all tracks have valid paths
- Test edge cases (high/low metrics)
- Validate rule logic

## 🔧 Components

### PageNode.vue
Custom VueFlow node displaying:
- Page information
- Variant slider (if multiple variants)
- Block count
- Status indicators

### ConditionalEdge.vue
Custom VueFlow edge showing:
- Smooth path animation
- Condition label as tag
- Visual feedback for met/unmet

### FlowSidebar.vue
Control panel for:
- Student context settings
- Simulation controls
- Active rules preview

### PathReplay.vue
Journey visualization with:
- Step-by-step path
- Decision explanations
- Statistics
- Export functionality

## 🚀 Getting Started

### 1. Navigate to Flow Simulator
Click **"Flow Simulator"** in the top navigation

### 2. Configure Student
Use left sidebar to set:
- Track (Core/Project/Enrichment)
- Accuracy and Engagement
- Enrichment enabled

### 3. Run Simulation
1. Click "Start Simulation"
2. Watch rules evaluate
3. Click "Step Forward" to progress
4. Observe path in right sidebar

### 4. Explore Scenarios
- Change track → see different paths
- Adjust accuracy → see branching change
- Click nodes → view details

## 🎨 Customization

### Add New Pages

```typescript
nodes.value.push({
  id: 'P5',
  type: 'page',
  position: { x: 450, y: 850 },
  data: {
    id: 'P5',
    code: 'P5',
    title: 'Bonus Content',
    track: 'enrichment',
    variants: [...],
    blocks: [...],
  },
});
```

### Add New Conditional Rules

```typescript
edges.value.push({
  id: 'e4-5',
  source: 'P4',
  target: 'P5',
  type: 'conditional',
  data: {
    condition: 'accuracy > 0.9 && streak >= 5',
    conditionMet: false,
  },
});
```

### Supported Condition Syntax

```javascript
// Track matching
"track: core"
"track: project" 
"track: enrichment"

// Performance thresholds
"accuracy > 0.8"
"engagement > 0.6"
"engagement <= 0.6"

// Completion
"completed"

// Combined (AND)
"track: enrichment && engagement > 0.6"
"track: core && accuracy > 0.8"

// Boolean flags
"enrichment"  // Same as enrichmentEnabled === true
```

## 📊 Layout Tips

### Optimal Spacing:
- **Vertical gap**: 200px between levels
- **Horizontal gap**: 200-400px for branches
- **Canvas center**: x: 450 for main path

### Node Positioning:
- **Start** (P1): Top center
- **Main path**: Vertical center line
- **Branches**: Left/right of main path
- **Converge**: Back to center for final

### Best Practices:
1. Keep main path vertical
2. Branch left/right for alternatives
3. Use clear, short condition labels
4. Group related content vertically
5. Leave space for future additions

## 🎯 Advanced Features

### Multi-Path Branching
One page can branch to multiple destinations based on different conditions:
```
P2 → P3a  [if track: project]
P2 → P3b  [if track: enrichment && engagement > 0.6]
P2 → P4   [if track: core && accuracy > 0.8]
```

### Convergent Paths
Multiple branches can converge to same destination:
```
P3a → P4  [completed]
P3b → P4  [completed]
P2  → P4  [high accuracy skip]
```

### Loops and Remediation
Pages can loop back for remediation:
```
P3a → P3b  [if engagement low, need more practice]
P3b → P3a  [if ready for project work]
```

## 🐛 Troubleshooting

### Issue: Edges not connecting
**Solution:** Verify source and target IDs match node IDs exactly

### Issue: Conditions always false
**Solution:** Check sidebar values match condition syntax

### Issue: Can't step forward
**Solution:** Ensure at least one outgoing edge has conditionMet = true

### Issue: Nodes overlap
**Solution:** Adjust position values in node definitions

## 📚 Related Components

- **SessionSimulator** - Test individual page adaptations
- **SettingsDrawer** - Configure full session context
- **BlockVariant** - View variant selection details

## 🎉 Summary

The Flow Simulator provides:
- ✅ Visual learning path design
- ✅ Conditional branching based on rules
- ✅ Student simulation with configurable context
- ✅ Path replay and tracking
- ✅ Real-time rule evaluation
- ✅ Export and analysis tools

Perfect for:
- 🎓 Course designers planning adaptive paths
- 🧪 QA teams testing branching logic
- 📊 Analytics teams visualizing student journeys
- 👨‍🏫 Educators understanding personalization

---

**Built with:** VueFlow + PrimeVue + Tailwind CSS

