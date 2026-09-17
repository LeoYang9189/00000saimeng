export interface ApiClientConfig {
  baseUrl: string
}

export function createApiClient(config: ApiClientConfig) {
  return {
    async getHealth() {
      const response = await fetch(`${config.baseUrl}/api/health`)
      return response.json()
    },
  }
}
