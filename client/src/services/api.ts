import { 
  Repository, VerificationRun, FullRunDetails, VerificationMemoryItem,
  RazeTask, RazeConversation, RazeMessage, RazeActivityLog, RazeProject, 
  RazeMemoryNote, RazeResearchResult, RazeAgentMode 
} from '../types';

const API_BASE = '/api';

export const api = {
  // Repositories
  async getRepositories(): Promise<Repository[]> {
    const res = await fetch(`${API_BASE}/repositories`);
    const json = await res.json();
    return json.data || [];
  },

  async getRepositoryFiles(repoId: string, subPath: string = ''): Promise<any[]> {
    const res = await fetch(`${API_BASE}/repositories/${repoId}/files?path=${encodeURIComponent(subPath)}`);
    const json = await res.json();
    return json.data || [];
  },

  async getFileContent(repoId: string, filePath: string): Promise<string> {
    const res = await fetch(`${API_BASE}/repositories/${repoId}/file-content?path=${encodeURIComponent(filePath)}`);
    const json = await res.json();
    return json.data?.content || '';
  },

  // Verification Runs
  async getRuns(): Promise<VerificationRun[]> {
    const res = await fetch(`${API_BASE}/runs`);
    const json = await res.json();
    return json.data || [];
  },

  async getRun(id: string): Promise<FullRunDetails> {
    const res = await fetch(`${API_BASE}/runs/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch run');
    return json.data;
  },

  async createRun(payload: {
    repository_id: string;
    defect_title: string;
    defect_description: string;
    target_file?: string;
    max_retries?: number;
  }): Promise<{ run_id: string }> {
    const res = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create run');
    return json.data;
  },

  async retryRun(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/runs/${id}/retry`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to retry run');
  },

  async submitDecision(
    runId: string,
    decision: 'APPROVED' | 'REJECTED' | 'REQUEST_REPAIR',
    reviewedPatchHash: string,
    notes?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/runs/${runId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        reviewed_patch_hash: reviewedPatchHash,
        notes
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record decision');
    return json.data;
  },

  getEvidenceMarkdownUrl(runId: string): string {
    return `${API_BASE}/runs/${runId}/evidence?format=markdown`;
  },

  getEvidenceJsonUrl(runId: string): string {
    return `${API_BASE}/runs/${runId}/evidence?format=json`;
  },

  // Memory
  async getMemory(): Promise<VerificationMemoryItem[]> {
    const res = await fetch(`${API_BASE}/memory`);
    const json = await res.json();
    return json.data || [];
  },

  async searchMemory(q: string): Promise<VerificationMemoryItem[]> {
    const res = await fetch(`${API_BASE}/memory/search?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    return json.data || [];
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/memory/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete memory item');
  },

  // Contextual Assistant
  async askAssistant(runId: string | undefined, question: string): Promise<{
    answer: string;
    evidenceReferences: string[];
    operatingMode: string;
    confidenceScore: number;
  }> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id: runId || undefined, question })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to query assistant');
    return json.data;
  },

  // Settings
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings/status`);
    const json = await res.json();
    return json.data || {};
  },

  async updateSettings(settings: any): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    return json.data || {};
  },

  // ==========================================
  // RAZE PLATFORM API METHODS
  // ==========================================
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  },

  // Agent Chat & Modes
  async chatAgent(payload: {
    message: string;
    conversation_id?: string;
    mode?: RazeAgentMode;
    user_id?: string;
  }): Promise<{
    conversation_id: string;
    message_id: string;
    role: 'assistant';
    content: string;
    mode: RazeAgentMode;
    metadata?: any;
    created_at: string;
  }> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Agent chat failed');
    return json.data;
  },

  // Agent Intent to Multi-Step Plan
  async generatePlan(payload: {
    intent: string;
    project_id?: string;
    user_id?: string;
  }): Promise<{
    plan_title: string;
    summary: string;
    mode: RazeAgentMode;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimated_duration: string;
    }>;
    created_at: string;
  }> {
    const res = await fetch(`${API_BASE}/agent/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to generate plan');
    return json.data;
  },

  async getConversations(userId?: string): Promise<RazeConversation[]> {
    try {
      const url = userId ? `${API_BASE}/agent/conversations?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/agent/conversations`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async getConversationMessages(conversationId: string): Promise<RazeMessage[]> {
    try {
      const res = await fetch(`${API_BASE}/agent/conversations/${conversationId}/messages`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  // Tasks Management
  async getTasks(status?: string): Promise<RazeTask[]> {
    const url = status && status !== 'all' ? `${API_BASE}/tasks?status=${encodeURIComponent(status)}` : `${API_BASE}/tasks`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  async getTask(id: string): Promise<RazeTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch task');
    return json.data;
  },

  async createTask(payload: {
    title: string;
    description: string;
    project_id?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<RazeTask> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create task');
    return json.data;
  },

  async updateTask(id: string, updates: Partial<RazeTask>): Promise<RazeTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update task');
    return json.data;
  },

  async cancelTask(id: string): Promise<RazeTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}/cancel`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to cancel task');
    return json.data;
  },

  async executeTask(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/tasks/${id}/execute`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to execute task');
    return json;
  },

  // Research Aggregator
  async performResearch(query: string): Promise<RazeResearchResult> {
    const res = await fetch(`${API_BASE}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Research query failed');
    return json.data;
  },

  // Activity Logs
  async getActivityLogs(limit?: number): Promise<RazeActivityLog[]> {
    const url = limit ? `${API_BASE}/activity?limit=${limit}` : `${API_BASE}/activity`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  // Projects
  async getProjects(): Promise<RazeProject[]> {
    const res = await fetch(`${API_BASE}/projects`);
    const json = await res.json();
    return json.data || [];
  },

  async createProject(payload: { name: string; description?: string }): Promise<RazeProject> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create project');
    return json.data;
  },

  // Memory Notes
  async getNotes(): Promise<RazeMemoryNote[]> {
    const res = await fetch(`${API_BASE}/notes`);
    const json = await res.json();
    return json.data || [];
  },

  async createNote(payload: { content: string; project_id?: string; tags?: string[] }): Promise<RazeMemoryNote> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to save note');
    return json.data;
  },

  async deleteNote(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete note');
  }
};
