# AI Threat Intelligence Dashboard 

A platform designed to visualize real-time threat indicators and analyze raw intelligence reports using Natural Language Processing. 

Instead of reading static logs, this dashboard acts as a virtual pinboard for security analysts to track malware families, C2 infrastructure, and malicious actors.

##  Key Features
* **Live OSINT Ingestion:** Automatically polls the ThreatFox API to pull the latest global indicators of compromise (IoCs).
* **Interactive Threat Mapping:** Uses a D3.js force-directed physics engine to map relationships between threat actors, IP addresses, domains, and malware payloads.
* **AI-Powered Deep Scan:** Includes a built-in NLP engine (powered by spaCy) that reads raw security reports, extracts key entities (Organizations, Locations, Dates), flags high-risk keywords, and calculates a dynamic risk score.

##  Tech Stack
* **Frontend:** React, Vite, D3.js, Axios
* **Backend:** Python, FastAPI, httpx (Async API calls)
* **Machine Learning:** spaCy (en_core_web_sm model) for Named Entity Recognition (NER)

##  Quick Start
To run this project locally, you will need two terminal windows.

**1. Start the Backend (FastAPI)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload
