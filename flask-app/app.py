import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO
from process_api import get_processes

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")


def send_processes():
    while True:
        processes = get_processes()
        socketio.emit('process_data', processes)
        eventlet.sleep(2)

@socketio.on('connect')
def on_connect():
    print("Client connected")
    socketio.start_background_task(send_processes)

@socketio.on('disconnect')
def on_disconnect():
    print("Client disconnected")

if __name__ == "__main__":
    print("Starting Flask SocketIO server on http://127.0.0.1:5000")
    socketio.run(app, host='127.0.0.1', port=5000)
