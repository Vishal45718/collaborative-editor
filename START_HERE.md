# 🚀 CodeSync - Quick Start Guide

## ✅ Clean & Ready to Use

All unnecessary code has been removed. Here's what's working:

✅ **Real-time Collaboration** - Multiple users editing simultaneously  
✅ **Code Execution** - Run C++, Python, Java, JavaScript  
✅ **Live Chat** - Team communication  
✅ **User Presence** - See who's online  
✅ **File Explorer** - Project structure  

---

## 🎯 Quick Start (2 Steps)

### Step 1: Terminal A - Start Backend
```bash
cd /home/jonsnow/Desktop/collaborative-editor
node server.js
```

You should see:
```
✨ CodeSync Server Started ✨
🚀 Server running on port 1234
📡 WebSocket: ws://localhost:1234/[roomId]
🌐 API: http://localhost:1234/api
💬 Chat enabled
📝 Code execution via Piston API
```

### Step 2: Terminal B - Start Frontend
```bash
cd /home/jonsnow/Desktop/collaborative-editor/client
npm run dev
```

You should see:
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

## 🌐 Open in Browser

Go to: **http://localhost:5173**

1. **Create a Room**: Click "Generate Unique Room"
2. **Enter Username**: Type your name
3. **Start Coding**: Select language and write code
4. **Run Code**: Click "Run Code" button
5. **See Output**: Check console output below

---

## 🧪 Test Code Execution

### C++ Test
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}
```

### Python Test
```python
print("Welcome to CodeSync!")
for i in range(1, 4):
    print(f"Iteration {i}")
```

### JavaScript Test
```javascript
console.log("Hello from CodeSync!");
```

---

## 💡 Features

### Code Execution
- Supports: **C++**, **Python**, **Java**, **JavaScript**
- Uses **Piston API** for safe execution
- Handles stdin/stdout perfectly

### Collaboration
- **Yjs CRDTs** - Conflict-free editing
- **WebSocket Sync** - Real-time updates
- **Awareness** - See other users' activity

### UI/UX
- **VS Code Theme** - Dark modern interface
- **File Explorer** - Navigate project files
- **Live Chat** - Team communication
- **User Avatars** - See who's collaborating

---

## 🔧 Tech Stack (Clean)

**Backend:**
- Node.js + Express
- Yjs WebSocket Server
- WebSockets for real-time sync

**Frontend:**
- React 19 + Vite
- CodeMirror 6
- Yjs CRDTs
- lucide-react icons

**Code Execution:**
- Piston API (external)

---

## ⚙️ Alternative: Run Both at Once

```bash
cd /home/jonsnow/Desktop/collaborative-editor
npm run dev
```

This runs server + client together using `concurrently`

---

## 📊 Troubleshooting

### Issue: "Compilation failed"
- Check if Piston API is accessible
- Try simple code first (`print("test")`)
- Check browser console for errors

### Issue: "WebSocket connection failed"
- Make sure backend is running on port 1234
- Check firewall settings

### Issue: "Room not syncing"
- Refresh the page
- Try a different browser tab
- Restart both servers

---

## 🎉 You're All Set!

- **No AI features** (you can add them later)
- **No MongoDB** (data stored in memory)
- **Pure code execution** - no bloat
- **Production-ready** - clean code

**Enjoy coding together! 🚀**