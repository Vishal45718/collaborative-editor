# 🚀 Real-Time Collaborative IDE (CodeSync)

A distributed, real-time code editor that allows multiple users to write, edit, and run code simultaneously in the same room. Think of it as **"Google Docs for Developers."**

> **Live Demo:** [Insert your deployed link here later]

![Demo Screenshot](https://via.placeholder.com/800x400?text=Add+Your+Screenshot+Here)
*(Tip: Replace the link above with a GIF of your editor in action!)*

---

## ✨ Key Features

* **⚡ Real-Time Synchronization:** Sub-millisecond latency updates using **WebSockets**.
* **🔗 Conflict-Free Editing:** Uses **CRDTs (Yjs)** to handle merge conflicts automatically (no overwriting!).
* **🛠 Multi-Language Support:**
    * C++ (GCC 10.2.0)
    * Python (3.10.0)
    * Java (OpenJDK 15)
    * JavaScript (Node 18)
* **🏃‍♂️ Integrated Compiler:** Execute code securely in the cloud via the **Piston API**.
* **💻 Standard Input (stdin):** Interactive terminal for handling user inputs (essential for LeetCode/CP problems).
* **🔒 Room Isolation:** Dynamic rooms via URL parameters ensure privacy between different groups.
* **🎨 Professional UI:** VS Code-like experience with OneDark theme and syntax highlighting.

---

## 🏗️ System Architecture

This project uses a **Client-Server** architecture powered by a customized **WebSocket Relay**.

### **Tech Stack**

| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Frontend** | React.js + Vite | Fast rendering and component-based UI. |
| **Editor Core** | CodeMirror 6 | Modular, accessible, and highly extensible text editor. |
| **State Sync** | **Yjs (CRDT)** | The gold standard for decentralized shared data. |
| **Networking** | WebSockets (ws) | Full-duplex communication for real-time updates. |
| **Backend** | Node.js | Custom relay server with in-memory history retention. |
| **Compiler** | Piston API | Sandboxed remote code execution. |

### **Data Flow Diagram**

1.  **User A** types a character.
2.  **Yjs** converts the update into a tiny binary binary blob.
3.  **Client** sends blob via WebSocket to the **Node.js Server**.
4.  **Server** broadcasts the blob to all other users in the same `roomId`.
5.  **User B** receives the blob and merges it into their local state.
6.  *Result:* eventual consistency without race conditions.

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### **Prerequisites**
* Node.js (v18 or higher)
* npm

### **1. Clone the Repository**
```bash
git clone [https://github.com/YOUR_USERNAME/realtime-code-editor.git](https://github.com/YOUR_USERNAME/realtime-code-editor.git)
cd realtime-code-editor
