import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Play, Loader2, Search } from 'lucide-react';
import './index.css';

function App() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setScanning(true);
    setResults([]);

    try {
      // 1. Trigger the scan
      await axios.post('http://localhost:5000/api/scan', { targetUrl: url });
      
      // 2. Poll for results (for MVP, just wait and fetch once after the mock delay)
      setTimeout(async () => {
        const res = await axios.get('http://localhost:5000/api/reports');
        setResults(res.data);
        setScanning(false);
      }, 6000); // 5 seconds is our mock engine delay

    } catch (error) {
      console.error("Scan failed", error);
      setScanning(false);
      alert("Error connecting to scanner engine.");
    }
  };

  const playEvidence = (evidence) => {
    // In a full implementation, this would open a modal with a <video src={evidence.videoPath} />
    // For MVP, we'll just log or show a placeholder alert since we don't have static serving yet
    alert(`Visual Simulation recorded!\nVideo ID: ${evidence.videoId}\nStatus: ${evidence.status}\n\n(Video playback modal coming soon!)`);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1><Shield className="inline-block mb-1" size={36} /> Aevus Scanner</h1>
        <p>OWASP Top 10 detection with visual exploit simulation.</p>
      </header>

      <main>
        <section className="card">
          <form onSubmit={handleScan}>
            <div className="input-group">
              <input 
                type="url" 
                placeholder="Enter target URL (e.g., https://example.com)" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" className="btn" disabled={scanning}>
                {scanning ? <Loader2 className="animate-spin" /> : <Search />}
                {scanning ? 'Scanning...' : 'Start Scan'}
              </button>
            </div>
          </form>
          {scanning && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The engine is crawling and injecting payloads. If a vulnerability is found, the Visual Simulator will record the exploit in a headless browser...</p>}
        </section>

        {results.length > 0 && (
          <section>
            <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Scan Results</h2>
            <div className="results-grid">
              {results.map((report, index) => (
                <div key={index} className="vulnerability-card">
                  <span className="badge">{report.severity}</span>
                  <h3>{report.vulnerability}</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Found at: <br/>
                    <span style={{ color: 'var(--text-main)', wordBreak: 'break-all' }}>{report.url}</span>
                  </p>
                  
                  {report.evidence && (
                    <button 
                      className="play-btn"
                      onClick={() => playEvidence(report.evidence)}
                    >
                      <Play size={16} /> Play Visual Evidence
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
