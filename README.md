f# 🗳️ Poll Application

A simple poll voting app with a **React + Vite frontend** and an **Express backend** that persists data to a JSON file.

---

## ⚙️ Tech Stack

### 🖥️ Client (`pollClient`)
- **React** — UI framework (`react`, `react-dom`)  
- **Vite** — Development server and build tool  
- **ESLint** — Code linting  
- **Language:** JavaScript (ESM)

### 🧩 Server (`Server`)
- **Node.js + Express** — REST API backend  
- **CORS** — Cross-origin resource sharing  
- **bcryptjs** — Password hashing  
- **jsonwebtoken** — JWT-based authentication  
- **Persistence:** Simple JSON file (`Server/data.json`)

### 🧰 Tooling
- **Package manager:** npm  
- **Recommended Node.js version:** v18+ (latest LTS)

---

## 🚀 How to Run (Windows PowerShell)

### 1. Install Node.js
Make sure Node.js (v18 or newer) and `npm` are installed and available in your PATH.

### 2. Start the Backend Server

```powershell
cd Server
npm install
npm start

