@echo off
echo ===================================================
echo Starting Chronobid AI Backend Services...
echo ===================================================

echo Starting Smart Assistant (Port 8000)...
start "Smart Assistant (Port 8000)" cmd /k "cd Ai\smart-assistant && python chatbot_api.py"

echo Starting Item Verification Engine (Port 8001)...
start "Item Verification (Port 8001)" cmd /k "cd Ai\item-verification && python app.py"

echo Starting Recommender Engine (Port 8002)...
start "Recommender (Port 8002)" cmd /k "cd Ai\item-recommender-model && python app.py"

echo Starting Identity Verification Pipeline (Port 8003)...
start "Identity Verification (Port 8003)" cmd /k "cd Ai\identity-verification && python app.py"

echo Starting Jasper Bot API Gateway (Port 8004)...
start "Jasper API Gateway (Port 8004)" cmd /k "cd Ai\jasper-bot && python jasper_router.py"

echo ===================================================
echo All AI services are booting up in separate windows!
echo It may take a minute for all AI weights to load.
echo ===================================================
pause
