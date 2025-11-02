# Setup & Getting Started

## 📦 Installation

```bash
# Install all dependencies
pnpm install

# Build the core adaptivity package
pnpm -C packages/adaptivity build
```

## 🎮 Running the Playground

The playground is a fully-featured Vue 3 simulator with:
- Settings drawer for session configuration
- Event dispatcher for simulating user actions
- Visual block variant representation
- Page navigation with sticky behavior
- Real-time signal monitoring
- Web Worker integration with IndexedDB

```bash
# Start the playground
pnpm dev:play
```

Open [http://localhost:5173](http://localhost:5173)

## 📚 Running Storybook

Interactive documentation with comprehensive scenarios:

```bash
# Start Storybook
pnpm dev:storybook
```

Open [http://localhost:6006](http://localhost:6006)

## 🧪 Running Tests

```bash
# Run tests with coverage
pnpm test
```

## 🏗️ What Was Built

### 1. **Core Adaptivity Engine** (`packages/adaptivity/`)

#### Type System (`src/types.ts`)
- `SessionSnapshot` - Complete learner context
- `Variant` - Content version definition
- `Slot` - Container for variants
- `SelectionResult` - Selection with explanation
- `Signal` types - Event tracking

#### Selection Logic (`src/select.ts`)
- Multi-stage selection pipeline
- Guard evaluation
- Scoring system
- Sticky behavior
- Override support
- Full traceability

#### CEL Guards (`src/cel-guard.ts`)
- CEL expression compilation
- Pre-built templates for common scenarios
- Expression validation
- Safe evaluation with error handling

#### Scoring (`src/score.ts`)
- Performance-based scoring
- Theme preference matching
- Modality preference
- Device suitability bonus

#### Session Management (`src/session.ts`)
- Session creation with defaults
- Accuracy EWMA updates
- Latency tracking
- Preference management

#### Signal System (`src/signals.ts`)
- Signal factory for all event types
- Signal buffer with size limits
- Sync status tracking
- Summary statistics

#### Worker Infrastructure (`src/worker/`)
- **signal-outbox.ts** - IndexedDB persistence
- **session-worker.ts** - Background processing
- Automatic sync with retry logic
- Session state management

### 2. **Vue 3 Playground** (`playground/`)

#### Main App (`src/App.vue`)
- Comprehensive simulator orchestration
- Real-time session updates
- Multi-page navigation
- Signal logging
- Export functionality

#### Components

**SettingsDrawer.vue**
- User information editor
- Performance metrics sliders
- Device & environment settings
- Accessibility toggles
- Real-time session updates

**EventDispatcher.vue**
- Quick action buttons (correct/wrong answer, theme switch, fatigue)
- Custom event builder with JSON payload
- Event history viewer
- Visual feedback

**BlockVariant.vue**
- Visual variant representation
- Selection explanation with reasoning
- Guard evaluation results
- Variant scoring display
- All variants accordion
- Re-evaluation trigger

**PageNavigation.vue**
- Multi-page lesson structure
- Next/previous navigation
- Progress tracking
- Time on page tracking
- Visited page indicators
- Page dot navigation

**SignalMonitor.vue**
- Real-time signal statistics
- Sync status display
- Signal type breakdown
- Current session info
- Manual sync trigger
- Clear old signals

#### Composables

**useSessionWorker.ts**
- Worker initialization
- Session updates
- Signal logging
- Sync operations
- Stats retrieval
- Type-safe worker communication

#### Services

**mockApi.ts**
- Simulated backend API
- Configurable latency
- Failure rate simulation
- Signal collection
- Statistics tracking

### 3. **Storybook Documentation** (`storybook/`)

#### AdaptiveSelection.stories.ts
- **BasicSelection** - How the engine works
- **StrugglingLearner** - Low performance adaptation
- **HighPerformer** - Challenge mode activation
- **ThemePersonalization** - Preference matching
- **DeviceAdaptation** - Mobile/desktop optimization

#### CELGuards.stories.ts
- **GuardTemplates** - All pre-built templates
- **LowAccuracyGuard** - Performance-based gating
- **StreakGuard** - Bonus content unlock
- **ComplexGuard** - Multi-condition logic
- **GuardFailure** - Fallback scenarios

### 4. **Comprehensive Tests** (`packages/adaptivity/tests/`)

#### selection.test.ts
- Basic selection scenarios
- Scoring system validation
- Device filtering
- Language filtering
- Sticky behavior
- Override handling
- CEL guard templates
- Session updates
- Edge cases
- Complex multi-criteria scenarios

#### signals.test.ts
- Signal factory creation
- Signal buffer operations
- Sync status tracking
- Summary statistics
- Signal workflow integration

### 5. **Configuration Files**

- **Tailwind CSS** - Utility-first styling
- **PostCSS** - CSS processing
- **TypeScript** - Type configurations
- **Vite** - Build tool setup
- **Package manifests** - Dependency management

## 🎯 Key Features Implemented

### ✅ Runtime Personalization Engine
- [x] Context-aware selection
- [x] Sub-millisecond decisions
- [x] Full TypeScript support
- [x] Comprehensive type safety

### ✅ Block Variants (Slots)
- [x] Multiple variant support
- [x] Rich metadata (difficulty, theme, modality, etc.)
- [x] Fallback mechanisms
- [x] Device compatibility filtering

### ✅ Explainable Decisions
- [x] Detailed selection reasoning
- [x] Guard evaluation results
- [x] Variant scoring breakdown
- [x] Override and sticky indicators

### ✅ Learning Signals
- [x] Comprehensive event types
- [x] Signal factory with type safety
- [x] Buffer with size limits
- [x] Sync status tracking

### ✅ CEL-Based Rules
- [x] Safe expression evaluation
- [x] Pre-built templates
- [x] Expression validation
- [x] Error handling

### ✅ Edge-First Architecture
- [x] Web Worker implementation
- [x] IndexedDB persistence
- [x] Background sync with retry
- [x] Session state in worker

### ✅ Polished Simulator
- [x] Settings drawer
- [x] Event dispatcher
- [x] Visual variant display
- [x] Page navigation
- [x] Signal monitoring
- [x] Real-time updates

### ✅ Documentation
- [x] Comprehensive README
- [x] API documentation
- [x] Interactive Storybook
- [x] Code examples
- [x] Usage scenarios

### ✅ Testing
- [x] Unit tests
- [x] Integration tests
- [x] Edge case coverage
- [x] Type safety validation

## 🎨 Design Highlights

### Visual Design
- Clean, modern UI with PrimeVue components
- Tailwind CSS for consistent styling
- Color-coded difficulty levels
- Visual feedback for all actions
- Responsive layout (mobile-friendly)

### UX Features
- Real-time session updates
- Instant re-evaluation on changes
- Detailed explanations for all decisions
- Visual progress indicators
- Toast notifications for feedback
- Expandable sections for details

### Developer Experience
- Full TypeScript with strict mode
- Comprehensive type definitions
- JSDoc comments throughout
- Clear file organization
- Consistent naming conventions
- Zero `any` types in production code

## 🚀 Next Steps

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Build Core Package**
   ```bash
   pnpm -C packages/adaptivity build
   ```

3. **Start Playground**
   ```bash
   pnpm dev:play
   ```

4. **Explore Features**
   - Adjust session settings
   - Dispatch events
   - Navigate pages
   - Watch signals sync

5. **View Storybook**
   ```bash
   pnpm dev:storybook
   ```

6. **Run Tests**
   ```bash
   pnpm test
   ```

## 📝 Configuration Notes

### Vite Configuration
The playground uses Vite with Vue plugin. Worker loading is configured for development.

### TypeScript Configuration
Strict mode enabled with comprehensive type checking. ES2020 target for modern browser support.

### PrimeVue Theme
Using Lara Light Blue theme. Can be customized in `main.ts`.

### Tailwind Configuration
Standard setup with content paths configured for Vue components.

## 🎯 Usage Examples

See the comprehensive examples in:
- `playground/src/App.vue` - Full implementation
- `packages/adaptivity/README.md` - API documentation
- `storybook/stories/*.stories.ts` - Interactive examples

## 🐛 Troubleshooting

### Worker Not Initializing
- Check browser console for errors
- Ensure Web Workers are supported
- Verify worker file path in Vite config

### Signals Not Syncing
- Open DevTools > Application > IndexedDB
- Check "adaptivity-signals" database
- Verify mock API is responding

### Variants Not Updating
- Check session context values
- Verify guard expressions
- Review selection result explanation

---

**Everything is ready to run!** 🎉

