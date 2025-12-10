
// This file is disabled for the frontend-only deployment.
export const db = {
    query: async (text: string, params?: any[]) => ({ rows: [] as any[] }),
    getClient: async () => ({ release: () => {}, query: async (text: string, params?: any[]) => ({ rows: [] as any[] }) })
};
