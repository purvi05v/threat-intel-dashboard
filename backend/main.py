import spacy
from pydantic import BaseModel

nlp = spacy.load("en_core_web_sm")
class ThreatText(BaseModel):
    content: str

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx 

app = FastAPI(title="Threat Intel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "message": "Threat Intel Engine Running"}

@app.get("/api/v1/threats")
async def get_threat_graph():
    url = "https://threatfox-api.abuse.ch/api/v1/"
    payload = {"query": "get_iocs", "days": 1}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Content-Type": "application/json"
            }
            response = await client.post(url, json=payload, headers=headers)
        
            print("--- API RAW RESPONSE ---")
            print(f"Status Code: {response.status_code}")
            print(f"Content: {response.text[:200]}...") 
            print("------------------------")
            response.raise_for_status() 
            
            data = response.json()
            
            if data.get("query_status") != "ok":
                raise Exception("API returned non-ok status")
                
            recent_threats = data.get("data", [])[:20]
            nodes, links = [], []
            seen_nodes = set()
            
            for threat in recent_threats:
                malware_family = threat.get("malware_printable", "Unknown_Malware")
                indicator = threat.get("ioc_value")
                confidence = threat.get("confidence_level", 50)
                
                if malware_family not in seen_nodes:
                    nodes.append({"id": malware_family, "type": "Actor", "risk": 95})
                    seen_nodes.add(malware_family)
                    
                if indicator not in seen_nodes:
                    nodes.append({"id": indicator, "type": "Indicator", "risk": int(confidence)})
                    seen_nodes.add(indicator)
                    
                links.append({
                    "source": malware_family,
                    "target": indicator,
                    "relation": "hosted_at"
                })
                
            return {"nodes": nodes, "links": links}

    except Exception as e:
        print(f"Scraping failed: {str(e)}. Falling back to sample data.")
        return {
            "nodes": [
                {"id": "Lazarus_Group", "type": "Actor", "risk": 100},
                {"id": "192.168.1.50", "type": "Indicator", "risk": 85},
                {"id": "malware_payload.exe", "type": "Indicator", "risk": 90}
            ],
            "links": [
                {"source": "Lazarus_Group", "target": "192.168.1.50", "relation": "uses_infra"},
                {"source": "192.168.1.50", "target": "malware_payload.exe", "relation": "downloads"}
            ]
        }
        
    return {"nodes": nodes, "links": links}

@app.post("/api/v1/analyze")
async def analyze_text(threat: ThreatText):
    doc = nlp(threat.content)
    extracted_entities = []
    for ent in doc.ents:
        extracted_entities.append({"word": ent.text, "category": ent.label_})
    base_score = 10
    high_risk_keywords = ["ransomware", "malware", "breach", "exploit", "cve", "phishing", "apt"]
    
    text_lower = threat.content.lower()
    found_threats = []
    
    for word in high_risk_keywords:
        if word in text_lower:
            base_score += 25
            found_threats.append(word)
    final_score = min(base_score, 100)
    
    return {
        "risk_score": final_score,
        "threats_detected": found_threats,
        "entities": extracted_entities
    }