#  CodeSync - Real-Time Collaborative IDE

A futuristic, real-time code editor that allows multiple developers to write, edit, and run code simultaneously. Built with cutting-edge technologies for seamless collaboration.

![CodeSync Preview](https://via.placeholder.com/800x400/0f172a/22d3ee?text=CodeSync+Preview)

---

##  Features

###  Real-Time Synchronization
- **Sub-millisecond latency** updates using WebSockets
- **CRDT-based** conflict resolution (Yjs)
- **Operational Transformation** for seamless editing

###  Multi-Language Support
- **C++** (GCC 10.2.0)
- **Python** (3.10.0)
- **Java** (OpenJDK 15)
- **JavaScript** (Node 18)

###  Integrated Development Environment
- **VS Code-like interface** with OneDark theme
- **File explorer** with project structure
- **Real-time chat** for team communication
- **Code execution** via Piston API
- **Standard input/output** handling

###  Security & Performance
- **Sandboxed code execution**
- **Room-based isolation**
- **In-memory data storage** with presence indicators
- **User awareness** and presence indicators

---

##  Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Yjs WebSocket  │
│                 │    │   (CRDT Sync)   │
│ - CodeMirror 6  │    │                 │
│ - Real-time UI  │    │ - setupWSConn   │
│ - File Explorer │    │ - Awareness     │
└─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │  Piston API     │
                    │ (Code Execution)│
                    └─────────────────┘
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 19 + Vite | Modern UI framework |
| **Editor** | CodeMirror 6 | Advanced code editing |
| **Real-time** | Yjs + y-websocket | CRDT synchronization |
| **Backend** | Node.js + Express | REST API & WebSocket server |
| **Storage** | In-memory + Yjs | Real-time document sync |
| **Execution** | Piston API | Secure code execution |
| **Styling** | CSS-in-JS | Modern responsive design |

---

##  Quick Start

### Prerequisites
- **Node.js** 18+ and npm

### 1. Clone & Install
```bash
git clone <repository-url>
cd codesync
npm install
npm run install-client
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=1234
```

### 3. Start Development Server
```bash
# Start both server and client
npm run dev

# Or run separately:
npm run server    # Backend on :1234
npm run client    # Frontend on :5173
```

### 4. Open in Browser
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:1234/api

---

##  Project Structure

```
codesync/
├── server.js              # Express + Yjs WebSocket server
├── package.json           # Backend dependencies
├── .env                   # Environment variables
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx          # Main app router
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── EditorPage.jsx   # Main editor
│   │   │   ├── FileExplorer.jsx # File tree
│   │   │   └── Chat.jsx         # Real-time chat
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🔧 API Endpoints

### WebSocket
- `ws://localhost:1234/[roomId]` - Yjs synchronization

### REST API
- `GET /api/health` - Server health check
- `GET /api/rooms/:roomId` - Get room information
- `PUT /api/rooms/:roomId` - Update room data
- `POST /api/rooms/:roomId/participants` - Add participant
- `DELETE /api/rooms/:roomId/participants/:username` - Remove participant
- `GET /api/rooms` - List active rooms

---

##  Customization

### Themes
The editor supports multiple themes. To add a new theme:
1. Install the theme package from `@codemirror/theme-*`
2. Import and add to the theme selection in `EditorPage.jsx`

### Languages
To add a new programming language:
1. Install the language package from `@codemirror/lang-*`
2. Add language configuration to `LANGUAGES` object
3. Update Piston API runtime configuration

---

##  Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=1234
```

### Build Commands
```bash
npm run build    # Build frontend
npm run start    # Start production server
```

### Docker Support (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 1234
CMD ["npm", "start"]
```

---

##  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Acknowledgments

- **Yjs** - For revolutionary CRDT technology
- **CodeMirror** - For the world's best code editor
- **Piston API** - For secure code execution
- **React** - For modern web development

---

*Built with ❤️ for developers, by developers*
