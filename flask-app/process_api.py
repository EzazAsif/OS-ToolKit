import psutil

def get_processes(limit=50):
    processes = []
    for proc in list(psutil.process_iter(['pid', 'name']))[:limit]:
        if proc.info['name'].lower() == 'system idle process':
            continue
        try:
            cpu = proc.cpu_percent(interval=None)
            processes.append({
                'pid': proc.info['pid'],
                'name': proc.info['name'],
                'cpu_percent': cpu
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return processes
