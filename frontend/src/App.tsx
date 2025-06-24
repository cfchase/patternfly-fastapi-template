import { useState } from 'react'
import axios from 'axios'
import './App.css'

interface HealthResponse {
  status: string
  message: string
}

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get<HealthResponse>('/api/v1/utils/health-check')
      setHealthStatus(response.data)
    } catch (err) {
      setError('Failed to connect to backend')
      console.error('Error checking health:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <h1>React FastAPI Template</h1>
      
      <div className="container">
        <div className="health-section">
          <h2>Backend Health Check</h2>
          <button onClick={checkHealth} disabled={loading}>
            {loading ? 'Checking...' : 'Check Backend Health'}
          </button>
          
          {healthStatus && (
            <div className="health-result success">
              <h3>Status: {healthStatus.status}</h3>
              <p>{healthStatus.message}</p>
            </div>
          )}
          
          {error && (
            <div className="health-result error">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App