import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/health/route'

describe('/api/health', () => {
  it('should return health status', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('database')
  })

  it('should handle database connection errors gracefully', async () => {
    // Mock database connection failure
    const originalEnv = process.env.DATABASE_URL
    process.env.DATABASE_URL = 'mysql://invalid:invalid@localhost:3306/invalid'

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(503)
    
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('status', 'error')
    expect(data).toHaveProperty('database')
    expect(data.database).toHaveProperty('error')

    // Restore original environment
    process.env.DATABASE_URL = originalEnv
  })
})
