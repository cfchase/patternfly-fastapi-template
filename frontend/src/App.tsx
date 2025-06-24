import { useState } from 'react'
import axios from 'axios'
import {
  Page,
  PageSection,
  PageSectionVariants,
  Title,
  Button,
  Card,
  CardTitle,
  CardBody,
  Alert,
  Spinner
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
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
    <Page>
      <PageSection variant={PageSectionVariants.default}>
        <Title headingLevel="h1" size="2xl">
          PatternFly FastAPI Template
        </Title>
      </PageSection>
      
      <PageSection>
        <Card>
          <CardTitle>
            <Title headingLevel="h2" size="xl">
              Backend Health Check
            </Title>
          </CardTitle>
          <CardBody>
            <Button
              variant="primary"
              onClick={checkHealth}
              isDisabled={loading}
              icon={loading ? <Spinner size="sm" /> : undefined}
            >
              {loading ? 'Checking...' : 'Check Backend Health'}
            </Button>
            
            {healthStatus && (
              <Alert
                variant="success"
                title={`Status: ${healthStatus.status}`}
                customIcon={<CheckCircleIcon />}
                style={{ marginTop: '16px' }}
              >
                {healthStatus.message}
              </Alert>
            )}
            
            {error && (
              <Alert
                variant="danger"
                title="Error"
                customIcon={<ExclamationTriangleIcon />}
                style={{ marginTop: '16px' }}
              >
                {error}
              </Alert>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  )
}

export default App