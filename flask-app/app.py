import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template
from flask_socketio import SocketIO
from process_api import get_processes
import psutil

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html')

def send_processes():
    while True:
        processes = get_processes()
        socketio.emit('process_data', processes)
        eventlet.sleep(0.5)

@socketio.on('connect')
def on_connect():
    print("Client connected")
    socketio.start_background_task(send_processes)

@socketio.on('disconnect')
def on_disconnect():
    print("Client disconnected")

@socketio.on('kill_process')
def handle_kill_process(data):
    pid = data.get('pid')
    if pid is None:
        socketio.emit('kill_response', "Error: No PID provided.")
        return

    try:
        proc = psutil.Process(pid)
        proc_name = proc.name()
        proc.terminate()
        proc.wait(timeout=3)
        socketio.emit('kill_response', f"Process {proc_name} (PID {pid}) terminated successfully.")
    except psutil.NoSuchProcess:
        socketio.emit('kill_response', f"No such process with PID {pid}.")
    except psutil.TimeoutExpired:
        try:
            proc.kill()
            socketio.emit('kill_response', f"Process PID {pid} killed forcefully.")
        except Exception as e:
            socketio.emit('kill_response', f"Failed to kill process PID {pid}: {e}")
    except Exception as e:
        socketio.emit('kill_response', f"Error killing process PID {pid}: {e}")

if __name__ == "__main__":
    print("Starting Flask SocketIO server on http://127.0.0.1:5000")
    socketio.run(app, host='127.0.0.1', port=5000)
