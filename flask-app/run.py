import threading
import time
import webview
import requests
from app import app, socketio

def start_flask():
    socketio.run(app, host='127.0.0.1', port=5000)

def wait_for_flask():
    while True:
        try:
            r = requests.get("http://127.0.0.1:5000")
            if r.status_code == 200:
                break
        except:
            pass
        time.sleep(0.5)

if __name__ == '__main__':
    # Start Flask in a thread
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()

    # Wait until Flask is ready
    print("Waiting for Flask to start...")
    wait_for_flask()

    # Open pywebview window
    print("Opening window...")
    webview.create_window("Test", "http://127.0.0.1:5000")

    webview.start()
