```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NAVBAR (55px, Fixed)                             │
├──────────────────┬──────────────────────────────────────┬──────────────────┤
│  Brand Section   │      CENTER CONTROLS                │   Run Button     │
├──────────────────┼──────────────────────────────────────┼──────────────────┤
│  [C] CodeSync    │  [Language▼] [👥Users] [⏱ms][💾MB]  │   ▶ Run          │
│  Room: witb48    │  [JavaScript ▼]                      │                  │
│  [Copy]          │  (Optional: User List, Language List)│                  │
└──────────────────┴──────────────────────────────────────┴──────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MAIN WORKSPACE (Flex, Flex: 1)                         │
├──────────────────┬──────────────────────────────────────┬──────────────────┤
│                  │                                      │                  │
│  FILE EXPLORER   │  EDITOR PANEL & OUTPUT              │  CHAT PANEL      │
│                  │                                      │                  │
│  (18%)           │  ┌─────────────────────────────────┐ │  (26%)           │
│                  │  │   CODE EDITOR (CODEMIRROR)      │ │                  │
│  • main.js       │  │   with language highlighting    │ │  Messages/       │
│  • utils.js      │  │   and real-time collab cursors  │ │  Collaboration   │
│  • test.js       │  │                                 │ │  Info            │
│                  │  ├─────────────────────────────────┤ │                  │
│  (Resizable: ▼)  │  │  STDIN (Input) │ CONSOLE OUTPUT │ │                  │
│                  │  ├────────────────┼────────────────┤ │                  │
│                  │  │                │                │ │                  │
│                  │  │ Input data...  │ Hello World!   │ │                  │
│                  │  │ [Press Enter]  │ [Exit: 0]      │ │                  │
│                  │  │                │ ⏱ 125ms        │ │                  │
│                  │  └────────────────┴────────────────┘ │                  │
│                  │               (56%)                  │                  │
│                  │         └─────────────────┘          │                  │
│                  │         (34% | Flex: 1)             │                  │
│                  │         (30% height min)            │                  │
└──────────────────┴──────────────────────────────────────┴──────────────────┘

SIZE BREAKDOWN:
• Navbar: 55px fixed
• Workspace: Remaining height
  ├─ Left Panel: 18% (min: 15%, max: 26%)
  ├─ Center Panel: 56% (min: 45%)
  │  ├─ Editor: 70% height
  │  └─ Output: 30% height (min: 16%)
  └─ Right Panel: 26% (min: 18%, max: 34%)

RESIZABLE DIVIDERS:
• Vertical divider 1: Between Files ↔ Editor (8px, blue on hover)
• Horizontal divider: Between Editor ↔ Output (8px, blue on hover)
• Vertical divider 2: Between Editor ↔ Chat (8px, blue on hover)
```

## Key CSS Classes

### Main Containers
```
.editor-container       → Full viewport (flex column, full height)
.navbar                → Top bar (flex row, 55px)
.workspace            → Main content (flex row, flex:1)
```

### Navbar Sections
```
.navbar-brand         → Logo + title + room (flex, gap:10px)
.navbar-section       → Logical grouping (flex, gap:12px)
.center-controls      → Language, users, execution (flex, gap:12px)
```

### Language Selector
```
.language-selector            → Container (position: relative)
.language-selector-button     → Toggle button
.language-dropdown            → Menu (position: absolute, z:1000)
.language-option              → Menu items
.language-option.active       → Currently selected
```

### Panels
```
.editor-panel                 → Flex column, full height
.panel-tab                    → Input/output section
.panel-tab-header             → Tab label area
.panel-tab-content            → Scrollable content
.resize-handle-vertical       → Vertical divider
.resize-handle-horizontal     → Horizontal divider
```

### Interactive Elements
```
.badge                → Info display (flex, padding, background)
.badge-button         → Icon button inside badge
.run-button          → Execution button (cyan, hover effect)
.exec-config         → Timeout/memory inputs (flex, gap:12px)
```

## Color System (Tailwind Slate + Cyan/Green)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Background (Dark) | Slate-950 | #020617 | Main container |
| Background (Panel) | Slate-900 | #0f172a | Secondary areas |
| Background (Input) | Slate-800 | #1e293b | Inputs, badges |
| Border | Slate-700 | #334155 | Dividers, borders |
| Text (Primary) | Slate-50 | #f8fafc | Main text |
| Text (Secondary) | Slate-400 | #94a3b8 | Labels, hints |
| Accent (Primary) | Cyan-400 | #22d3ee | Run button, hover |
| Accent (Success) | Green-500 | #4ade80 | Success messages |
| Accent (Error) | Red-500 | #ef4444 | Errors |
| Accent (Interactive) | Blue-500 | #3b82f6 | Hover states |

## Responsive Behavior

### Large Desktop (1200px+)
- All panels fully visible
- Optimal spacing maintained
- Full feature set available

### Tablet (768px - 1024px)
```css
/* Navbar wraps content */
display: flex;
flex-wrap: wrap;
padding: 0 12px;
height: auto;
min-height: 55px;

/* Center controls move down */
order: 3;
width: 100%;
```

### Mobile (< 768px)
```css
/* Compact spacing */
padding: 8px 12px;

/* Smaller buttons */
font-size: 0.85rem;

/* Narrower inputs */
width: 40px;

/* Single column (hidden panels) */
/* May require additional changes for true mobile */
```

## State Management (Zustand Store)

```javascript
{
  // File & Language
  activeFile: string | null,
  activeLanguage: 'javascript' | 'python' | ...,
  
  // Execution
  executionOutput: string,
  executionError: boolean,
  isRunning: boolean,
  stdin: string,
  
  // Config
  timeout: number (ms),
  memoryLimit: number (MB),
  
  // Setters for all above
  setActiveLanguage(lang),
  setExecutionOutput(output, isError),
  setIsRunning(bool),
  setStdin(input),
  etc...
}
```

## Event Handlers

| Event | Handler | Action |
|-------|---------|--------|
| Language Dropdown Open | `setShowLanguageDropdown(true)` | Shows menu |
| Language Select | `setActiveLanguage(lang)` | Changes language |
| Click Outside | `useEffect + mousedown listener` | Closes dropdown |
| Copy Room ID | `navigator.clipboard.writeText()` | Shows toast |
| Run Code | `fetch(/api/execute)` | Executes & updates output |
| Timeout Change | `parseInt(e.target.value)` | Updates config |
| Memory Change | `parseInt(e.target.value)` | Updates config |
| STDIN Change | `setStdin(e.target.value)` | Updates input |

## Performance Optimizations

1. **CSS Classes**: Avoid inline styles for faster rendering
2. **Resize Handlers**: react-resizable-panels handles efficiently
3. **Lazy Loading**: Chat & FileExplorer only render when visible
4. **Event Delegation**: Click-outside uses single listener
5. **State Optimization**: Zustand only re-renders affected components

---

*Layout Version: 2.0*
*Last Updated: April 2026*
*Status: Production Ready ✅*
