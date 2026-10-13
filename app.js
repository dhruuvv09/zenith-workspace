/**
 * Zenith Workspace
 * Core Application Logic & Modular Engine
 */

// ==========================================
// 1. Data Store & Persistent State
// ==========================================
const ZenithStore = {
  // Safe localStorage helper
  get(key, fallback) {
    try {
      const data = localStorage.getItem(`zenith_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn("Storage fetch failed", e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`zenith_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage save failed", e);
    }
  }
};

// ==========================================
// 2. Procedural Web Audio Engine
// ==========================================
const AmbientEngine = {
  ctx: null,
  channels: {
    rain: { gain: null, node: null, vol: 0 },
    waves: { gain: null, node: null, vol: 0 },
    fire: { gain: null, node: null, vol: 0 },
    gamma: { gain: null, node: null, vol: 0 }
  },

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Generates 5 seconds of procedural white/pink noise buffer
  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink filter algorithm
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }
    return buffer;
  },

  startSound(type) {
    this.initContext();
    const ch = this.channels[type];
    if (ch.node) return;

    ch.gain = this.ctx.createGain();
    ch.gain.gain.value = ch.vol / 100;
    ch.gain.connect(this.ctx.destination);

    if (type === 'rain') {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      noise.connect(filter);
      filter.connect(ch.gain);
      noise.start();
      ch.node = noise;

    } else if (type === 'waves') {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 450;
      filter.Q.value = 2.0;

      // Low frequency oscillator for wave swells
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.12; // 8-second wave period
      lfoGain.gain.value = 250;
      lfo.connect(filter.frequency);
      lfo.start();

      noise.connect(filter);
      filter.connect(ch.gain);
      noise.start();
      ch.node = noise;

    } else if (type === 'fire') {
      // Crackle generator via highpass-filtered buffer
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1200;

      noise.connect(hp);
      hp.connect(ch.gain);
      noise.start();
      ch.node = noise;

    } else if (type === 'gamma') {
      // 40Hz focus binaural generator
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 160; // 160Hz Carrier

      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 40; // 40Hz Modulator
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.5;

      lfo.connect(ch.gain.gain);
      osc.connect(ch.gain);

      osc.start();
      lfo.start();
      ch.node = osc;
    }
  },

  stopSound(type) {
    const ch = this.channels[type];
    if (ch.node) {
      ch.node.stop();
      ch.node.disconnect();
      ch.node = null;
    }
  },

  setVolume(type, volumeVal) {
    const ch = this.channels[type];
    ch.vol = volumeVal;
    if (ch.gain && this.ctx) {
      ch.gain.gain.setTargetAtTime(volumeVal / 100, this.ctx.currentTime, 0.05);
    }
    if (volumeVal > 0 && !ch.node) {
      this.startSound(type);
    } else if (volumeVal === 0 && ch.node) {
      this.stopSound(type);
    }
  },

  muteAll() {
    Object.keys(this.channels).forEach(type => {
      this.setVolume(type, 0);
    });
  }
};

// ==========================================
// 3. Focus Timer Engine
// ==========================================
const FocusTimer = {
  modes: {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  },
  currentMode: 'pomodoro',
  timeLeft: 25 * 60,
  isRunning: false,
  timerInterval: null,
  totalFocusedToday: ZenithStore.get('focused_today', 0), // in seconds

  init() {
    this.timeLeft = this.modes[this.currentMode];
    this.updateUI();
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });

    document.getElementById('playPauseTimerBtn').addEventListener('click', () => {
      this.toggle();
    });

    document.getElementById('resetTimerBtn').addEventListener('click', () => {
      this.reset();
    });

    document.getElementById('skipTimerBtn').addEventListener('click', () => {
      this.skip();
    });
  },

  switchMode(mode) {
    this.pause();
    this.currentMode = mode;
    this.timeLeft = this.modes[mode];

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const labels = {
      pomodoro: 'Deep Focus',
      shortBreak: 'Short Rest',
      longBreak: 'Long Recharge'
    };
    document.getElementById('timerModeLabel').textContent = labels[mode];
    this.updateUI();
  },

  toggle() {
    this.isRunning ? this.pause() : this.start();
  },

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    AmbientEngine.initContext();

    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        if (this.currentMode === 'pomodoro') {
          this.totalFocusedToday++;
          if (this.totalFocusedToday % 30 === 0) {
            ZenithStore.set('focused_today', this.totalFocusedToday);
          }
        }
        this.updateUI();
      } else {
        this.completeCycle();
      }
    }, 1000);

    this.updatePlayPauseUI();
  },

  pause() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.updatePlayPauseUI();
  },

  reset() {
    this.pause();
    this.timeLeft = this.modes[this.currentMode];
    this.updateUI();
  },

  skip() {
    this.pause();
    if (this.currentMode === 'pomodoro') {
      this.switchMode('shortBreak');
    } else {
      this.switchMode('pomodoro');
    }
  },

  completeCycle() {
    this.pause();
    // Notification chime synthesized on the fly
    this.playChime();
    alert(this.currentMode === 'pomodoro' ? 'Focus session completed! Take a break.' : 'Break completed! Ready to focus?');
    this.skip();
  },

  playChime() {
    try {
      const ctx = AmbientEngine.ctx || new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn(e);
    }
  },

  updateUI() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    document.getElementById('timerTime').textContent = formatted;
    document.title = `${formatted} — Zenith`;

    // Progress circle stroke animation
    const circle = document.getElementById('timerProgress');
    const total = this.modes[this.currentMode];
    const fraction = this.timeLeft / total;
    const circumference = 2 * Math.PI * 105; // r=105 -> ~659.73
    circle.style.strokeDashoffset = circumference * (1 - fraction);

    // Update Focused Today Text
    const focusMins = Math.floor(this.totalFocusedToday / 60);
    document.getElementById('todayFocusStat').innerHTML = `Focused today: <strong>${focusMins} mins</strong>`;
  },

  updatePlayPauseUI() {
    const textSpan = document.getElementById('playPauseText');
    const icon = document.getElementById('playPauseIcon');

    if (this.isRunning) {
      textSpan.textContent = 'Pause';
      icon.setAttribute('data-lucide', 'pause');
    } else {
      textSpan.textContent = 'Start Focus';
      icon.setAttribute('data-lucide', 'play');
    }
    lucide.createIcons();
  }
};

// ==========================================
// 4. Kanban Task Board & Drag-Drop
// ==========================================
const KanbanBoard = {
  tasks: ZenithStore.get('tasks', [
    {
      id: 'task-1',
      title: 'Review System Architecture Specs',
      desc: 'Verify endpoint contracts and payload shapes.',
      priority: 'high',
      category: 'Engineering',
      status: 'todo'
    },
    {
      id: 'task-2',
      title: 'Implement Dark Mode tokens',
      desc: 'Harmonize slate-900 with accent purples.',
      priority: 'medium',
      category: 'Design',
      status: 'progress'
    },
    {
      id: 'task-3',
      title: 'Initial Project Scaffold',
      desc: 'Set up HTML, modular CSS and JS logic.',
      priority: 'low',
      category: 'DevOps',
      status: 'done'
    }
  ]),

  activeDragId: null,

  init() {
    this.render();
    this.bindEvents();
  },

  bindEvents() {
    // Open Modal
    document.getElementById('openTaskModalBtn').addEventListener('click', () => {
      document.getElementById('taskForm').reset();
      document.getElementById('taskModal').classList.add('active');
    });

    // Close Modal
    document.getElementById('closeTaskModalBtn').addEventListener('click', () => {
      document.getElementById('taskModal').classList.remove('active');
    });

    document.getElementById('cancelTaskBtn').addEventListener('click', () => {
      document.getElementById('taskModal').classList.remove('active');
    });

    // Form Submit
    document.getElementById('taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newTask = {
        id: 'task-' + Date.now(),
        title: document.getElementById('taskTitle').value.trim(),
        desc: document.getElementById('taskDesc').value.trim(),
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value.trim() || 'General',
        status: 'todo'
      };
      this.tasks.push(newTask);
      this.saveAndRender();
      document.getElementById('taskModal').classList.remove('active');
    });

    // Search filter
    document.getElementById('taskSearchInput').addEventListener('input', (e) => {
      this.render(e.target.value.toLowerCase().trim());
    });

    // Dropzone listeners
    document.querySelectorAll('.kanban-dropzone').forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const targetStatus = zone.dataset.status;
        if (this.activeDragId && targetStatus) {
          const task = this.tasks.find(t => t.id === this.activeDragId);
          if (task) {
            task.status = targetStatus;
            this.saveAndRender();
          }
        }
      });
    });
  },

  saveAndRender() {
    ZenithStore.set('tasks', this.tasks);
    this.render();
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveAndRender();
  },

  render(filterQuery = '') {
    const columns = {
      todo: document.getElementById('list-todo'),
      progress: document.getElementById('list-progress'),
      done: document.getElementById('list-done')
    };

    // Reset columns
    Object.values(columns).forEach(col => col.innerHTML = '');

    const counts = { todo: 0, progress: 0, done: 0 };

    this.tasks
      .filter(t => {
        if (!filterQuery) return true;
        return t.title.toLowerCase().includes(filterQuery) || 
               t.category.toLowerCase().includes(filterQuery) ||
               t.desc.toLowerCase().includes(filterQuery);
      })
      .forEach(task => {
        counts[task.status]++;
        const taskCard = document.createElement('div');
        taskCard.className = 'task-item';
        taskCard.setAttribute('draggable', 'true');
        taskCard.dataset.id = task.id;

        taskCard.innerHTML = `
          <div class="task-top">
            <span class="task-priority-tag ${task.priority}">${task.priority}</span>
            <button class="task-del-btn" title="Delete Task">&times;</button>
          </div>
          <div class="task-title">${escapeHTML(task.title)}</div>
          ${task.desc ? `<p class="task-desc">${escapeHTML(task.desc)}</p>` : ''}
          <span class="task-category-tag">${escapeHTML(task.category)}</span>
        `;

        // Delete button
        taskCard.querySelector('.task-del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteTask(task.id);
        });

        // Drag events
        taskCard.addEventListener('dragstart', () => {
          this.activeDragId = task.id;
          taskCard.classList.add('dragging');
        });

        taskCard.addEventListener('dragend', () => {
          this.activeDragId = null;
          taskCard.classList.remove('dragging');
        });

        if (columns[task.status]) {
          columns[task.status].appendChild(taskCard);
        }
      });

    // Update column counters
    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-progress').textContent = counts.progress;
    document.getElementById('count-done').textContent = counts.done;
  }
};

// ==========================================
// 5. Daily Disciplines (Habit Tracker)
// ==========================================
const HabitsModule = {
  habits: ZenithStore.get('habits', [
    { id: 'h1', title: 'Deep Work (2 Hours)', history: [true, true, true, false, true] },
    { id: 'h2', title: 'Review Code Pull Requests', history: [true, false, true, true, true] },
    { id: 'h3', title: 'Hydration (2L Water)', history: [true, true, true, true, false] }
  ]),

  init() {
    this.render();
    document.getElementById('addHabitBtn').addEventListener('click', () => {
      const name = prompt('Enter a daily discipline / habit:');
      if (name && name.trim()) {
        this.habits.push({
          id: 'h-' + Date.now(),
          title: name.trim(),
          history: [false, false, false, false, false]
        });
        this.save();
      }
    });
  },

  toggleDay(habitId, dayIndex) {
    const habit = this.habits.find(h => h.id === habitId);
    if (habit) {
      habit.history[dayIndex] = !habit.history[dayIndex];
      this.save();
    }
  },

  save() {
    ZenithStore.set('habits', this.habits);
    this.render();
  },

  render() {
    const container = document.getElementById('habitsContainer');
    container.innerHTML = '';
    const dayLabels = ['M', 'T', 'W', 'T', 'F'];

    this.habits.forEach(h => {
      const row = document.createElement('div');
      row.className = 'habit-row';

      const streakCount = h.history.filter(Boolean).length;

      row.innerHTML = `
        <div class="habit-info">
          <h4>${escapeHTML(h.title)}</h4>
          <span class="habit-streak">${streakCount}/5 days active</span>
        </div>
        <div class="habit-days">
          ${h.history.map((done, idx) => `
            <button class="habit-check-day ${done ? 'completed' : ''}" data-idx="${idx}">
              ${dayLabels[idx]}
            </button>
          `).join('')}
        </div>
      `;

      row.querySelectorAll('.habit-check-day').forEach(btn => {
        btn.addEventListener('click', () => {
          this.toggleDay(h.id, parseInt(btn.dataset.idx, 10));
        });
      });

      container.appendChild(row);
    });
  }
};

// ==========================================
// 6. Autosaved Scratchpad
// ==========================================
const Scratchpad = {
  textarea: document.getElementById('scratchpadInput'),
  counter: document.getElementById('charCount'),
  statusIndicator: document.getElementById('scratchpadStatus'),
  saveTimer: null,

  init() {
    this.textarea.value = ZenithStore.get('scratchpad_note', '');
    this.updateStats();

    this.textarea.addEventListener('input', () => {
      this.statusIndicator.textContent = 'Saving...';
      this.statusIndicator.style.color = 'var(--text-dim)';
      this.updateStats();

      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        ZenithStore.set('scratchpad_note', this.textarea.value);
        this.statusIndicator.textContent = 'Saved';
        this.statusIndicator.style.color = 'var(--success)';
      }, 500);
    });

    document.getElementById('clearScratchpadBtn').addEventListener('click', () => {
      if (confirm('Clear scratchpad content?')) {
        this.textarea.value = '';
        ZenithStore.set('scratchpad_note', '');
        this.updateStats();
      }
    });
  },

  updateStats() {
    const text = this.textarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = this.textarea.value.length;
    this.counter.textContent = `${words} words • ${chars} characters`;
  }
};

// ==========================================
// 7. General Application Controls & Utilities
// ==========================================
function initTheme() {
  const savedTheme = ZenithStore.get('theme', 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    ZenithStore.set('theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
  lucide.createIcons();
}

function initClock() {
  const clock = document.getElementById('clockDisplay');
  function tick() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

function initAmbientMixer() {
  document.querySelectorAll('.ambient-row').forEach(row => {
    const soundType = row.dataset.sound;
    const toggleBtn = row.querySelector('.ambient-toggle');
    const slider = row.querySelector('.slider');
    const volIndicator = row.querySelector('.vol-indicator');

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      volIndicator.textContent = `${val}%`;
      AmbientEngine.setVolume(soundType, val);
      toggleBtn.classList.toggle('active', val > 0);
    });

    toggleBtn.addEventListener('click', () => {
      const current = parseInt(slider.value, 10);
      const target = current > 0 ? 0 : 50;
      slider.value = target;
      volIndicator.textContent = `${target}%`;
      AmbientEngine.setVolume(soundType, target);
      toggleBtn.classList.toggle('active', target > 0);
    });
  });

  document.getElementById('muteAllAudioBtn').addEventListener('click', () => {
    AmbientEngine.muteAll();
    document.querySelectorAll('.ambient-row').forEach(row => {
      row.querySelector('.slider').value = 0;
      row.querySelector('.vol-indicator').textContent = '0%';
      row.querySelector('.ambient-toggle').classList.remove('active');
    });
  });
}

function initDataExport() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      tasks: KanbanBoard.tasks,
      habits: HabitsModule.habits,
      scratchpad: Scratchpad.textarea.value,
      totalFocusSeconds: FocusTimer.totalFocusedToday
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenith-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function initKeyboardShortcuts() {
  const modal = document.getElementById('shortcutsModal');
  const openBtn = document.getElementById('shortcutsBtn');
  const closeBtn = document.getElementById('closeShortcutsModalBtn');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  window.addEventListener('keydown', (e) => {
    // Ignore key triggers if typing into input or textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      FocusTimer.toggle();
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      document.getElementById('taskForm').reset();
      document.getElementById('taskModal').classList.add('active');
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      FocusTimer.reset();
    } else if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      document.getElementById('themeToggleBtn').click();
    } else if (e.key === '?' || e.key === '/') {
      modal.classList.toggle('active');
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==========================================
// 8. Bootstrap Initializer
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initAmbientMixer();
  initDataExport();
  initKeyboardShortcuts();

  FocusTimer.init();
  KanbanBoard.init();
  HabitsModule.init();
  Scratchpad.init();

  lucide.createIcons();
});
