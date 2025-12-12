
// This mock service is deprecated in favor of direct Firestore integration.
// Keeping a minimal stub to satisfy import dependencies if any remain.
class MockBackendService {
  async handleRequest(method: string, endpoint: string, body?: any, user?: any): Promise<any> {
      console.warn("MockBackend called but deprecated. Requests should route to Firestore.");
      return {};
  }
}
export const mockBackend = new MockBackendService();
