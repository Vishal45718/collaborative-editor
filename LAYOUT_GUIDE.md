# CodeSync Layout Rebuild Guide

## Overview
The code editor layout has been completely restructured with:
- ✅ Responsive Flexbox/Grid-based layout
- ✅ Language selector dropdown
- ✅ Resizable panels with drag handles
- ✅ Dark theme (Slate/One Dark colors)
- ✅ Mobile-responsive design
- ✅ Proper spacing and alignment

---

## Architecture

### 1. **Component Hierarchy**
```
EditorPage (Main Container)
├── Navbar (Top Bar)
│   ├── Brand Section (Logo + Room ID)
│   ├── Center Controls (Language, Users, Config)
│   └── Run Button
├── Workspace (Main Area)
│   └── PanelGroup (react-resizable-panels)
│       ├── FileExplorer Panel (18%)
│       ├── Editor + Bottom Panels (56%)
│       │   ├── CodeEditor (70%)
│       │   └── Input/Output Tabs (30%)
│       └── Chat Panel (26%)
```

### 2. **Layout System**

#### **Navbar (.navbar)**
- **Display**: Flexbox (horizontal)
- **Height**: 55px (fixed)
- **Sections**:
  - Brand (logo + title + room info)
  - Center controls (language selector, users, execution settings)
  - Run button

```css
display: flex;
justify-content: space-between;
align-items: center;
padding: 0 20px;
height: 55px;
background: #0f172a;
border-bottom: 1px solid #1e293b;
```

#### **Workspace (.workspace)**
- **Display**: Flex (horizontal) with `overflow: hidden`
- **Child panels**: Resizable via `react-resizable-panels`
- **Proportions**: 18% (files) + 56% (editor) + 26% (chat)

#### **Bottom Panels (.bottom-panels)**
- **Display**: Flex (horizontal)
- **Two panels**:
  - STDIN Input: 34% width, fixed 180px min
  - Console Output: Flex 1 (remaining space)

---

## Key Components

### Language Selector
**Location**: Top navbar, center-left

**Features**:
- Dropdown with all available languages
- Click outside to close (useEffect hook)
- Shows current language with icon
- Active state highlighting
- Toast notification on language change

**Languages Available**:
- JavaScript (Node)
- TypeScript
- Python
- C++, C, Java, Rust, Go, Bash

```jsx
<div className="language-selector" ref={languageDropdownRef}>
  <button className="language-selector-button">
    <Code2 size={16} />
    {LANGUAGES[activeLanguage]?.name}
    <ChevronDown size={14} />
  </button>
  
  {showLanguageDropdown && (
    <div className="language-dropdown">
      {/* Options map */}
    </div>
  )}
</div>
```

### Resizable Panels
**Using**: `react-resizable-panels` library

**Resize Handles**:
- Vertical handles (between panels): `.resize-handle-vertical`
- Horizontal handles (between editor/output): `.resize-handle-horizontal`
- 8px wide/tall with 2px visual indicator
- Hover effect: changes from #1e293b to #3b82f6

**Panel Sizes** (defaults):
- Left (Files): 18% (min: 15%, max: 26%)
- Center (Editor): 56% (min: 45%)
- Right (Chat): 26% (min: 18%, max: 34%)
- Bottom (Output): 30% (min: 16%)

### Execution Controls
**Location**: Top navbar, center

**Config Options**:
- ⏱️ Timeout: Input field (100-10000 ms)
- 💾 Memory: Input field (10-1024 MB)
- ▶️ Run Button: Play icon, cyan color

### Input/Output Tabs
**Layout**: Horizontal split
- **Left Panel (STDIN)**: 34% fixed width
- **Right Panel (Console)**: Flex 1 remaining

**Header**:
- Panel name
- Execution time badge (right panel)

**Content**:
- Monospace font (JetBrains Mono)
- Scrollable overflow
- Color-coded output (red for errors, white for success)

---

## Styling System

### Color Palette (Dark Theme)
```
Primary Background:  #020617 (near-black)
Secondary BG:        #0f172a (dark slate)
Accent BG:           #1e293b (slate-700)
Borders:             #334155 (slate-600)
Text Primary:        #f8fafc (white)
Text Secondary:      #94a3b8 (slate-400)
Accent Color:        #3b82f6 (blue)
Success Color:       #4ade80 (green)
Error Color:         #ef4444 (red)
Info Color:          #22d3ee (cyan)
```

### Spacing System
- **Navbar padding**: 0 20px
- **Workspace padding**: 12px 20px
- **Panel gaps**: 12px
- **Navbar gaps**: 16px (sections), 12px (controls)
- **Component padding**: 6-14px

### Typography
- **Main font**: System default
- **Code font**: 'JetBrains Mono', 'Courier New', monospace
- **Font sizes**: 
  - Title: 1.2rem
  - Labels: 0.9rem, 0.85rem, 0.8rem
  - Code: 13px

---

## Responsive Breakpoints

### Tablet (≤1024px)
```css
@media (max-width: 1024px) {
  - Navbar wraps to 2 rows
  - Center controls move to bottom
  - Reduced padding: 12px
}
```

### Mobile (≤768px)
```css
@media (max-width: 768px) {
  - Further padding reduction: 8px
  - Button font smaller: 0.85rem
  - Language selector font: 0.85rem
  - Input widths reduced
}
```

---

## Usage Examples

### Change Language Programmatically
```jsx
const { setActiveLanguage } = useIdeStore();
setActiveLanguage('python');
```

### Run Code
```jsx
const runCode = async () => {
  const sourceCode = filesMap.get(activeFile).toString();
  const runtime = LANGUAGES[activeLanguage].pistonRuntime;
  
  // API call to compile & execute
};
```

### Update Execution Settings
```jsx
const { setTimeout, setMemoryLimit } = useIdeStore();
setTimeout(3000);      // 3 second timeout
setMemoryLimit(256);   // 256 MB memory
```

---

## File Structure

### CSS Files
- **`App.css`**: Main layout styles (~300 lines)
  - Layout classes (containers, panels, navbars)
  - Component styles (buttons, inputs, badges)
  - Responsive breakpoints

### Component Files
- **`EditorPage.jsx`**: Main editor container
  - Navbar with language selector
  - Resizable panel layout
  - Execution controls
  - State management (hooks)

### Configuration
- **`config/languages.js`**: Supported languages & settings
- **`store/useIdeStore.js`**: Global state (Zustand)

---

## Common Issues & Solutions

### Issue: Language dropdown not closing
**Solution**: Check that `languageDropdownRef` is attached and click-outside listener is active

### Issue: Panels not resizing
**Solution**: Ensure `overflow: hidden` on parent and `minHeight: 0` on flex children

### Issue: Bottom panels overlapping
**Solution**: Use vertical PanelGroup with proper Panel sizing inside horizontal Panel

### Issue: Unresponsive on mobile
**Solution**: Check media query breakpoints and ensure padding reduces appropriately

---

## Future Enhancements

1. **Persistent Layout State**: Save panel sizes to localStorage
2. **Theme Toggle**: Add light/dark theme switcher
3. **Custom Key Bindings**: Ctrl+Enter to run code
4. **Code Formatting**: Add prettier/format button
5. **Terminal Integration**: Interactive stdin/stdout handling
6. **File Tabs**: Multiple open files with tabs
7. **Search & Replace**: In editor
8. **Debugger Integration**: Breakpoints and step-through

---

## Performance Notes

- **CSS-in-JS**: Converted to class-based CSS for better performance
- **Resize Handlers**: Use `react-resizable-panels` optimized rendering
- **Memoization**: Consider wrapping components with `React.memo()`
- **CodeMirror**: Destroyed and recreated on language change (by design)

---

## Testing Checklist

- [ ] Language selector opens/closes
- [ ] Language changes update editor syntax highlighting
- [ ] Panels resize smoothly
- [ ] Run button executes code
- [ ] Input/output tabs display correctly
- [ ] Responsive on mobile (768px)
- [ ] Responsive on tablet (1024px)
- [ ] Room ID copy works
- [ ] User avatars display
- [ ] Timeout/memory inputs accept numbers
- [ ] Console output color-codes errors/success
- [ ] Execution time displays

---

*Last Updated: April 2026*
*Tech Stack: React + CodeMirror + react-resizable-panels + Lucide Icons*
