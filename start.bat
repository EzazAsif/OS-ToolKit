@echo off
setlocal

echo Installing Node.js dependencies...
call npm install

echo Installing Python dependencies...
pip install -r requirements.txt

echo Starting Flask backend...
cd flask-app
start "Flask App" python app.py

cd ..
echo Starting Electron frontend...
cd electron-app
npm start

endlocal
