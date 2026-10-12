# Zenith Workspace

> A lightweight, zero-dependency digital sanctuary for deep work and cognitive clarity. Built entirely with vanilla web standards.

[![GitHub Pages](https://img.shields.io/badge/Live-Demo-22c55e?style=flat-square)](https://your-username.github.io/zenith-workspace/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Zero-Dependencies-f59e0b?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## Overview

Zenith Workspace is an integrated productivity dashboard designed around low friction, local-first privacy, and minimal cognitive overhead. 

Rather than relying on modern heavy front-end frameworks, Zenith is engineered with **standard browser APIs** (DOM, HTML5 Drag & Drop, Web Storage, and Web Audio). The result is instantaneous load times, zero build steps, and an offline-first execution environment.

---

## Key Modules

### 1. Pomodoro Focus Engine
* Configurable sprint intervals (Focus, Short Break, Long Break).
* Dynamic browser title updates and SVG radial progress indication.
* Audio cues synthesized on completion without external audio assets.

### 2. Native Kanban Pipeline
* Three-stage task flow (`Backlog`, `In Flight`, `Completed`).
* Powered by the native HTML5 Drag and Drop API with visual drop zones.
* Real-time state preservation using `localStorage`.

### 3. Habit & Consistency Tracker
* Daily completion toggles with persistent streak counters.
* Date-stamped status checking to ensure consistency across days.

### 4. Distraction-Free Scratchpad
* Local-first quick-capture notepad.
* Debounced auto-save listener that captures state changes without unnecessary writes.

### 5. Algorithmic Ambient Soundscapes
* Generates real-time ambient audio (White Noise, Rain, and Pink Noise) using the native **Web Audio API**.
* Pure math-driven audio synthesis—no external `.mp3` files, third-party streams, or broken asset links.

---

## Technical Design & Architecture

Zenith maintains clean separation of concerns across three core files without requiring bundle tools (Vite, Webpack) or external runtimes:

```text
zenith-workspace/
├── index.html       # Semantic layout, ARIA accessibility, micro-templates
├── style.css        # Custom CSS properties (tokens), Flexbox & Grid layouts
└── app.js           # Module-pattern JavaScript state management & DOM bindings
