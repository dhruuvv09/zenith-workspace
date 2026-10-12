# ⚡ Zenith Workspace

> A lightweight, modular productivity and deep-work workstation built entirely with vanilla web technologies. Zero dependencies. Zero external build tools.

[![Status](https://img.shields.io/badge/Status-Active-emerald)](#)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS%20(ES6+)-blue)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#)

---

## 🎯 Overview

**Zenith Workspace** is an all-in-one focus and productivity dashboard created to eliminate distraction and tab-switching during deep work sessions. Rather than relying on heavy front-end frameworks or third-party audio CDNs, Zenith leverages native browser APIs—providing instantaneous load times, full offline capability, and persistence via `localStorage`.

---

## ✨ Features

- **⏱️ Focus Engine (Pomodoro Timer):**
  - Customizable work, short break, and long break intervals.
  - Visual circular SVG progress indicator updated via CSS variables.
  - Native browser audio chime alerting phase transitions.

- **📋 Kanban Workflow Board:**
  - Three-stage task pipeline (*To Do*, *In Progress*, *Done*).
  - Built with the native HTML5 Drag and Drop API (no heavy UI libraries).
  - Priority badges and task counter per column.

- **🔥 Habit & Streak Tracker:**
  - Daily habit check-off grid with automated streak calculation.
  - Tracks consecutive daily completions with visual status pips.

- **📝 Markdown Quick-Notes Scratchpad:**
  - Real-time autosave to `localStorage` on every keystroke with debouncing.
  - Character and word counters.

- **🎧 Synthesized Ambient Soundscapes:**
  - Procedural sound generation (White Noise, Rain, Deep Drone) powered by the native **Web Audio API**.
  - Runs completely offline without external audio assets or network requests.

- **🎨 Theme Engine & Design System:**
  - Native dark and light modes with seamless transitions.
  - CSS Custom Properties (`--tokens`) driving typography, spacing, and layout.

---

## 🛠️ Architecture & Tech Stack

This project was built deliberately without frameworks to demonstrate core web platform mastery:

| Layer | Technologies & APIs Used |
| :--- | :--- |
| **Structure** | Semantic HTML5 (`<main>`, `<section>`, `<header>`, `aria-*` tags) |
| **Styling** | Modern CSS3 (CSS Grid, Flexbox, Custom Properties, Responsive Media Queries) |
| **State & Logic** | Vanilla JavaScript (ES6+), Modular Object Pattern, Event Delegation |
| **Storage** | Web Storage API (`localStorage`) with JSON serialization |
| **Audio** | Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`) |
| **Interaction** | Native HTML5 Drag and Drop Events (`dragstart`, `dragover`, `drop`) |

---

## 📂 Project Structure

```text
zenith-workspace/
├── index.html       # Semantic layout and module containers
├── style.css        # Design tokens, layout grids, and component styles
├── app.js           # Core state management, event orchestration, and modules
└── README.md        # Documentation and project showcase
```

---

## 🚀 Getting Started

No `npm install`, dependencies, or build tools required.

### Run Locally

1. Clone or download the repository:
   ```bash
   git clone https://github.com/your-username/zenith-workspace.git
   ```
2. Navigate into the folder:
   ```bash
   cd zenith-workspace
   ```
3. Open `index.html` in any modern web browser:
   - On Windows: Double-click `index.html` or run `start index.html`
   - On Mac: Run `open index.html`
   - Or use VS Code's **Live Server** extension.

---

## 🌐 Live Demo

You can try out the live deployment on GitHub Pages:  
👉 **[View Live Demo](https://your-username.github.io/zenith-workspace/)** *(Replace with your link)*

---

## 🤝 Contributing & License

Contributions, feedback, and issue submissions are welcome!

Distributed under the **MIT License**. See `LICENSE` for more information.