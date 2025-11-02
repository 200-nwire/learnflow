# 🚀 Quick Start Guide

Get the simulator running in 3 steps:

## Step 1: Install Dependencies

```bash
cd /Users/alexg/Downloads/amit-adaptivity
pnpm install
```

## Step 2: Build Core Package

```bash
pnpm build
```

## Step 3: Launch Playground

```bash
pnpm dev:play
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🎮 First Actions in the Simulator

### Test Struggling Learner Scenario

1. Click "Settings" button (top right)
2. Adjust sliders:
   - Accuracy: 45%
   - Attempts: 8
   - Streak: 0
3. Click "Apply Changes"
4. Watch variants automatically switch to easier content

### Test Theme Personalization

1. Open Settings
2. Set "Preferred Theme" to "soccer"
3. Apply Changes
4. Observe soccer-themed variants selected

### Simulate Learning Events

1. Find "Event Dispatcher" panel (right side)
2. Click "Correct Answer" or "Wrong Answer"
3. Watch session metrics update
4. See variants re-evaluate automatically

### Navigate Pages

1. Click "Next" in Page Navigation
2. Watch sticky behavior retain selections
3. Click "Previous" to go back
4. Verify same variants shown (sticky)

### Monitor Signals

1. Check "Signal Monitor" panel
2. See unsynced signal count
3. Click sync button (🔄)
4. Watch signals sync to mock API

---

## 🎨 Key UI Elements

### Top Bar
- App title and description
- Settings button (⚙️)
- Worker status indicator

### Main Content Area
- **Page Navigation**: Multi-page lesson with progress
- **Block Variants**: Visual representation of selected content
- **Session Overview**: Live metrics dashboard

### Right Sidebar
- **Event Dispatcher**: Simulate user actions
- **Signal Monitor**: Track event logging
- **Quick Actions**: Shortcuts for common tasks

---

## 📚 Also Try

### Storybook (Interactive Docs)

```bash
pnpm dev:storybook
```

Open [http://localhost:6006](http://localhost:6006)

Browse:
- Adaptive Selection scenarios
- CEL Guard demonstrations
- Device adaptation examples
- Theme personalization

### Run Tests

```bash
pnpm test
```

See comprehensive test coverage for:
- Selection logic
- Guard evaluation
- Signal system
- Edge cases

---

## 🎯 What You'll See

### The Simulator Demonstrates:

1. **Real-time Adaptation**
   - Change settings → instant re-evaluation
   - Performance-based difficulty adjustment
   - Preference-driven personalization

2. **Explainable AI**
   - Every selection shows reasoning
   - Guard results visible
   - Variant scores displayed

3. **Signal Tracking**
   - All events logged
   - IndexedDB persistence
   - Background sync to API

4. **Sticky Behavior**
   - Choices retained across pages
   - Consistent experience in scope
   - Weak vs. strong persistence

5. **Device Awareness**
   - Mobile vs. desktop variants
   - Network-aware content
   - Accessibility support

---

## 🔥 Pro Tips

- **Use Settings Drawer** to simulate different student profiles
- **Dispatch Events** to see how performance affects selection
- **Navigate Pages** to test sticky behavior
- **Check Signal Monitor** to verify event tracking
- **Export Session** to save configurations
- **Open DevTools** to inspect IndexedDB

---

## 📖 Learn More

- `README.md` - Full project overview
- `packages/adaptivity/README.md` - API documentation
- `SETUP.md` - Detailed setup guide
- Storybook - Interactive examples

---

**Enjoy exploring the simulator!** 🎉

