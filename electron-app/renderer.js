const socket = io("http://127.0.0.1:5000");

const categoryKeywords = {
  "System Processes": [
    "system",
    "svchost",
    "services",
    "wininit",
    "lsass",
    "csrss",
    "smss",
    "dwm",
    "taskhost",
    "explorer",
    "winlogon",
    "kernel",
    "init",
    "systemd",
    "launchd",
  ],
  "User Applications": [
    "chrome",
    "firefox",
    "code",
    "electron",
    "spotify",
    "discord",
    "slack",
    "zoom",
    "teams",
    "notepad",
    "word",
    "excel",
    "outlook",
    "safari",
    "opera",
    "edge",
    "photoshop",
    "vlc",
    "skype",
    "steam",
    "dropbox",
    "epicgameslauncher",
    "origin",
    "battle.net",
    "uplay",
    "gog",
    "minecraft",
    "fortnite",
    "leagueoflegends",
    "valorant",
    "overwatch",
    "dota2",
    "csgo",
    "callofduty",
    "amongus",
    "apex",
    "roblox",
    "witcher",
    "skyrim",
    "gta",
  ],
  "Background Services": [
    "antivirus",
    "backup",
    "update",
    "sync",
    "cloud",
    "agent",
    "daemon",
    "service",
    "monitor",
    "scheduler",
    "updater",
  ],
};

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), duration);
}

socket.on("connect", () => {
  console.log("Connected to Flask WebSocket");
});

function createProcessItem(proc) {
  const li = document.createElement("li");
  li.className =
    "flex justify-between items-center px-4 py-2 bg-gray-50 rounded-md hover:bg-blue-50 transition";
  li.dataset.pid = proc.pid; // Use data attribute to track PID

  li.innerHTML = `
    <div>
      <span class="font-semibold text-gray-700">PID ${proc.pid} — ${
    proc.name
  }</span>
      <span class="ml-3 text-green-600 font-mono">${proc.cpu_percent.toFixed(
        1
      )}%</span>
    </div>
    <button class="kill-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition">
      Kill
    </button>
  `;

  li.querySelector(".kill-btn").addEventListener("click", () => {
    const confirmed = confirm(
      `Are you sure you want to kill process PID ${proc.pid} (${proc.name})?`
    );
    if (!confirmed) return;

    socket.emit("kill_process", { pid: proc.pid });
    showToast(`Sent kill request for PID ${proc.pid}`);
  });

  return li;
}

function categorizeProcesses(processes) {
  const categories = {};
  Object.keys(categoryKeywords).forEach((cat) => (categories[cat] = []));
  categories["Other Processes"] = [];

  for (const proc of processes) {
    const name = proc.name.toLowerCase();
    let categorized = false;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => name.includes(kw))) {
        categories[category].push(proc);
        categorized = true;
        break;
      }
    }
    if (!categorized) categories["Other Processes"].push(proc);
  }
  return categories;
}

// Update or create section header
function getOrCreateCategorySection(container, categoryName) {
  let section = container.querySelector(
    `section[data-category="${categoryName}"]`
  );
  if (!section) {
    section = document.createElement("section");
    section.dataset.category = categoryName;

    const header = document.createElement("h2");
    header.className =
      "text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1";
    section.appendChild(header);

    const ul = document.createElement("ul");
    ul.className = "space-y-2";
    section.appendChild(ul);

    container.appendChild(section);
  }
  return section;
}

// Update processes within a category section
function updateCategoryProcesses(section, processes) {
  const ul = section.querySelector("ul");
  const existingLis = new Map();

  // Map current LIs by pid
  ul.querySelectorAll("li").forEach((li) => {
    existingLis.set(parseInt(li.dataset.pid), li);
  });

  const newPids = new Set();

  processes.forEach((proc) => {
    newPids.add(proc.pid);

    if (existingLis.has(proc.pid)) {
      // Update existing process item if needed
      const li = existingLis.get(proc.pid);
      const nameSpan = li.querySelector("span.font-semibold");
      const cpuSpan = li.querySelector("span.text-green-600");

      // Check if name or cpu_percent changed, update accordingly
      const newNameText = `PID ${proc.pid} — ${proc.name}`;
      const newCpuText = `${proc.cpu_percent.toFixed(1)}%`;

      if (nameSpan.textContent !== newNameText) {
        nameSpan.textContent = newNameText;
      }
      if (cpuSpan.textContent !== newCpuText) {
        cpuSpan.textContent = newCpuText;
      }

      // Remove from map since processed
      existingLis.delete(proc.pid);
    } else {
      // Create new LI for this process
      const newLi = createProcessItem(proc);
      ul.appendChild(newLi);
    }
  });

  // Remove any LIs not in the new process list
  existingLis.forEach((li, pid) => {
    li.remove();
  });

  // Update header count
  const header = section.querySelector("h2");
  header.textContent = `${section.dataset.category} (${processes.length})`;
}

socket.on("process_data", (data) => {
  const container = document.getElementById("process-container");
  const categories = categorizeProcesses(data);

  // Keep track of existing categories in DOM
  const existingSections = new Map();
  container.querySelectorAll("section").forEach((section) => {
    existingSections.set(section.dataset.category, section);
  });

  // Update or create sections for categories with processes
  for (const [categoryName, procs] of Object.entries(categories)) {
    if (procs.length === 0) {
      // Remove category section if exists but now empty
      if (existingSections.has(categoryName)) {
        existingSections.get(categoryName).remove();
        existingSections.delete(categoryName);
      }
      continue;
    }

    let section = existingSections.get(categoryName);
    if (!section) {
      section = getOrCreateCategorySection(container, categoryName);
      existingSections.set(categoryName, section);
    }
    updateCategoryProcesses(section, procs);
  }

  // Remove any category sections no longer in data
  existingSections.forEach((section, categoryName) => {
    if (!(categoryName in categories)) {
      section.remove();
    }
  });
});

socket.on("disconnect", () => {
  console.log("Disconnected from Flask WebSocket");
});

socket.on("kill_response", (msg) => {
  showToast(msg);
});
