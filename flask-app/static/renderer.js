const socket = io("http://127.0.0.1:5000");

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), duration);
}

socket.on("connect", () => {
  console.log("Connected to Flask WebSocket");
});

// Create a process list item with Kill button
function createProcessItem(proc) {
  const li = document.createElement("li");
  li.className =
    "flex justify-between items-center px-4 py-2 bg-gray-50 rounded-md hover:bg-blue-50 transition";

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

  // Kill button event listener
  li.querySelector(".kill-btn").addEventListener("click", () => {
    const confirmed = confirm(
      `Are you sure you want to kill process PID ${proc.pid} (${proc.name})?`
    );
    if (!confirmed) return;

    // Emit kill request to server
    socket.emit("kill_process", { pid: proc.pid });

    showToast(`Sent kill request for PID ${proc.pid}`);
  });

  return li;
}

function categorizeProcesses(processes) {
  const categories = {
    "System Processes": [],
    "User Applications": [],
    "Other Processes": [],
  };

  processes.forEach((proc) => {
    const name = proc.name.toLowerCase();

    if (
      name.includes("system") ||
      name.includes("svchost") ||
      name.includes("services")
    ) {
      categories["System Processes"].push(proc);
    } else if (
      name.includes("chrome") ||
      name.includes("firefox") ||
      name.includes("code") ||
      name.includes("electron")
    ) {
      categories["User Applications"].push(proc);
    } else {
      categories["Other Processes"].push(proc);
    }
  });

  return categories;
}

socket.on("process_data", (data) => {
  const container = document.getElementById("process-container");
  container.innerHTML = "";

  const categories = categorizeProcesses(data);

  Object.entries(categories).forEach(([categoryName, procs]) => {
    if (procs.length === 0) return;

    const section = document.createElement("section");

    const header = document.createElement("h2");
    header.className =
      "text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1";
    header.textContent = `${categoryName} (${procs.length})`;
    section.appendChild(header);

    const ul = document.createElement("ul");
    ul.className = "space-y-2";

    procs.forEach((proc) => {
      ul.appendChild(createProcessItem(proc));
    });

    section.appendChild(ul);
    container.appendChild(section);
  });
});

socket.on("disconnect", () => {
  console.log("Disconnected from Flask WebSocket");
});

// Optional: handle server response for kill success/failure
socket.on("kill_response", (msg) => {
  showToast(msg);
});
