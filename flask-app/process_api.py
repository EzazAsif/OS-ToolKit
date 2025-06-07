import psutil
import time

def get_processes():
    # Initialize CPU measurement
    for proc in psutil.process_iter():
        try:
            proc.cpu_percent(None)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    time.sleep(1)  # wait to measure CPU percent

    processes = []
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            pid = proc.info.get('pid')
            name = proc.info.get('name')
            if name is None:
                name = "(unknown)"
            # Skip the "System Idle Process" (Windows) or similar
            if name.lower() == "system idle process":
                continue

            cpu = proc.cpu_percent(None)

            processes.append({
                'pid': pid,
                'name': name,
                'cpu_percent': cpu
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    return processes

if __name__ == "__main__":
    procs = get_processes()
    print(f"Found {len(procs)} processes:")
    for p in procs:
        print(f"PID {p['pid']}, Name: {p['name']}, CPU: {p['cpu_percent']:.1f}%")
