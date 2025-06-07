const socket = io("http://127.0.0.1:5000");

socket.on("connect", () => {
  console.log("Connected to Flask WebSocket");
});

socket.on("process_data", (data) => {
  const list = document.getElementById("process-list");
  list.innerHTML = ""; // clear previous

  data.forEach((proc) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="pid">PID ${proc.pid} — ${proc.name}</span>
      <span class="cpu">CPU: ${proc.cpu_percent.toFixed(1)}%</span>
    `;
    list.appendChild(li);
  });
});

socket.on("disconnect", () => {
  console.log("Disconnected from Flask WebSocket");
});
