import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ThreatMap from './components/ThreatMap';

function App() {
  const [threatData, setThreatData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanText, setScanText] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/v1/threats')
      .then(response => {
        setThreatData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Map fetch error:", err);
        setLoading(false);
      });
  }, []);

  const handleNodeClick = (nodeInfo) => {
    setSelectedNode(nodeInfo);
    setScanResult(null); 
  };

  const runDeepScan = async () => {
    if (!scanText.trim()) return;
    
    setIsScanning(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/analyze', {
        content: scanText
      });
      setScanResult(response.data);
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Scan failed. Is your FastAPI server running?");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '20px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>AI Threat Intelligence Dashboard</h1>
      </header>
      
      <main style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px' }}>
        
        <div style={{ flex: 2, backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading live OSINT feeds...</p>
          ) : (
            <ThreatMap data={{ ...threatData, onNodeClick: handleNodeClick }} />
          )}
        </div>

        <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '8px', padding: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          <div>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Node Inspector</h2>
            {!selectedNode ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Click a node on the map to view details.</p>
            ) : (
              <div>
                <h3 style={{ color: selectedNode.risk >= 90 ? '#ef4444' : '#3b82f6', wordBreak: 'break-all', margin: '10px 0' }}>
                  {selectedNode.id}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '6px', flex: 1 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>TYPE</span>
                    <div style={{ fontWeight: 'bold' }}>{selectedNode.type}</div>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '6px', flex: 1 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>RISK</span>
                    <div style={{ fontWeight: 'bold', color: selectedNode.risk >= 90 ? '#ef4444' : '#eab308' }}>
                      {selectedNode.risk} / 100
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '20px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>AI Threat Analyzer</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px' }}>
              Paste a report or email to extract IOCs and evaluate risk.
            </p>
            
            <textarea 
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              placeholder="e.g., A phishing email hit our servers today distributing ransomware..."
              style={{ width: '100%', height: '100px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', borderRadius: '6px', padding: '10px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
            />
            
            <button 
              onClick={runDeepScan}
              disabled={isScanning || !scanText.trim()}
              style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: isScanning ? '#475569' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: isScanning ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
            >
              {isScanning ? 'Analyzing Context...' : 'Run Deep Scan'}
            </button>

            {scanResult && (
              <div style={{ marginTop: '20px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '6px', borderLeft: `4px solid ${scanResult.risk_score >= 80 ? '#ef4444' : '#eab308'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>Calculated Risk:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: scanResult.risk_score >= 80 ? '#ef4444' : '#eab308' }}>
                    {scanResult.risk_score}
                  </span>
                </div>
                
                {scanResult.threats_detected.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>KEYWORDS DETECTED:</span>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                      {scanResult.threats_detected.map((t, i) => (
                        <span key={i} style={{ backgroundColor: '#ef444440', color: '#fca5a5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {scanResult.entities.length > 0 && (
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>ENTITIES EXTRACTED:</span>
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '0.85rem' }}>
                      {scanResult.entities.map((ent, i) => (
                        <li key={i}><strong>{ent.word}</strong> <span style={{ color: '#94a3b8' }}>({ent.category})</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;