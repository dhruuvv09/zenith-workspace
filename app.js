const ROWS = 20;
const COLS = 40;
let START_NODE = { r: 10, c: 5 };
let TARGET_NODE = { r: 10, c: 35 };

let isMouseDown = false;
let isVisualizing = false;
const gridContainer = document.getElementById("grid-container");

// Initialize Matrix Data
let grid = [];

function initGrid() {
  gridContainer.innerHTML = "";
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const isStart = r === START_NODE.r && c === START_NODE.c;
      const isTarget = r === TARGET_NODE.r && c === TARGET_NODE.c;

      const nodeElem = document.createElement("div");
      nodeElem.classList.add("node");
      nodeElem.dataset.row = r;
      nodeElem.dataset.col = c;

      if (isStart) nodeElem.classList.add("node-start");
      if (isTarget) nodeElem.classList.add("node-target");

      nodeElem.addEventListener("mousedown", () => handleNodeClick(r, c));
      nodeElem.addEventListener("mouseenter", () => {
        if (isMouseDown) handleNodeClick(r, c);
      });

      gridContainer.appendChild(nodeElem);
      row.push({
        r,
        c,
        isStart,
        isTarget,
        isWall: false,
        element: nodeElem,
        distance: Infinity,
        visited: false,
        previousNode: null,
      });
    }
    grid.push(row);
  }
}

window.addEventListener("mousedown", () => (isMouseDown = true));
window.addEventListener("mouseup", () => (isMouseDown = false));

function handleNodeClick(r, c) {
  if (isVisualizing) return;
  const node = grid[r][c];
  if (node.isStart || node.isTarget) return;

  node.isWall = !node.isWall;
  node.element.classList.toggle("node-wall", node.isWall);
}

// Visualizer Logic
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBFS() {
  const queue = [grid[START_NODE.r][START_NODE.c]];
  const visitedInOrder = [];
  grid[START_NODE.r][START_NODE.c].visited = true;

  while (queue.length > 0) {
    const current = queue.shift();
    visitedInOrder.push(current);

    if (current.isTarget) break;

    const neighbors = getUnvisitedNeighbors(current);
    for (const neighbor of neighbors) {
      if (!neighbor.visited && !neighbor.isWall) {
        neighbor.visited = true;
        neighbor.previousNode = current;
        queue.push(neighbor);
      }
    }
  }
  return visitedInOrder;
}

function getUnvisitedNeighbors(node) {
  const neighbors = [];
  const { r, c } = node;
  if (r > 0) neighbors.push(grid[r - 1][c]);
  if (r < ROWS - 1) neighbors.push(grid[r + 1][c]);
  if (c > 0) neighbors.push(grid[r][c - 1]);
  if (c < COLS - 1) neighbors.push(grid[r][c + 1]);
  return neighbors.filter((n) => !n.visited);
}

async function animateSearch(visitedNodes) {
  const delay = 51 - document.getElementById("speed-slider").value;

  for (const node of visitedNodes) {
    if (!node.isStart && !node.isTarget) {
      node.element.classList.add("node-visited");
      await sleep(delay);
    }
    if (node.isTarget) break;
  }

  // Backtrack for Shortest Path
  let current = grid[TARGET_NODE.r][TARGET_NODE.c];
  const path = [];
  while (current !== null) {
    path.unshift(current);
    current = current.previousNode;
  }

  if (path.length > 1 && path[0].isStart) {
    for (const node of path) {
      if (!node.isStart && !node.isTarget) {
        node.element.classList.add("node-path");
        await sleep(delay * 1.5);
      }
    }
  }
}

// Controls
document.getElementById("btn-visualize").addEventListener("click", async () => {
  if (isVisualizing) return;
  isVisualizing = true;
  const visited = await runBFS();
  await animateSearch(visited);
  isVisualizing = false;
});

document.getElementById("btn-clear").addEventListener("click", () => {
  if (isVisualizing) return;
  initGrid();
});

document.getElementById("btn-maze").addEventListener("click", () => {
  if (isVisualizing) return;
  initGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const node = grid[r][c];
      if (!node.isStart && !node.isTarget && Math.random() < 0.28) {
        node.isWall = true;
        node.element.classList.add("node-wall");
      }
    }
  }
});

initGrid();