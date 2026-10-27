export type AgentId = 
  | 'investigator'
  | 'repair'
  | 'counterexample'
  | 'security'
  | 'test_integrity'
  | 'evidence_judge';

export type AgentStatus = 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export type RunStatus = 'PENDING' | 'RUNNING' | 'COLLAPSED' | 'COMPLETED' | 'BLOCKED' | 'ABORTED';

export type RunStage = 
  | 'BASELINE'
  | 'REPAIR'
  | 'CHALLENGE'
  | 'COLLATERAL_SEARCH'
  | 'TRUST_COLLAPSE'
  | 'REPAIR_RETRY'
  | 'RELEASE_GATE'
  | 'DONE';

export type ReleaseRecommendation = 'BLOCKED' | 'NEEDS_REVIEW' | 'READY_FOR_HUMAN_REVIEW' | 'PENDING';

export type PatchStatus = 'GENERATED' | 'APPLIED' | 'CHALLENGED' | 'TRUST_COLLAPSED' | 'PASSED_VERIFICATION';

export type TestType = 'BASELINE' | 'REGRESSION' | 'ADVERSARIAL_EDGE' | 'SECURITY_CHECK';

export type TestStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'TIMED_OUT';

export type MutantStatus = 'KILLED' | 'SURVIVED' | 'TIMED_OUT';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Repository {
  id: string;
  name: string;
  path: string;
  description: string;
  is_demo: boolean;
  branch: string;
  snapshot_hash: string;
  created_at: string;
}

export interface VerificationRun {
  id: string;
  repository_id: string;
  status: RunStatus;
  defect_title: string;
  defect_description: string;
  target_file: string;
  stage: RunStage;
  current_attempt: number;
  max_retries: number;
  active_patch_hash?: string;
  release_recommendation: ReleaseRecommendation;
  circuit_breaker_tripped: boolean;
  circuit_breaker_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AgentExecution {
  id: string;
  run_id: string;
  agent_id: AgentId;
  agent_name: string;
  status: AgentStatus;
  task_description: string;
  output_summary?: string;
  structured_data?: any;
  duration_ms: number;
  created_at: string;
  completed_at?: string;
}

export interface PatchAttempt {
  id: string;
  run_id: string;
  attempt_number: number;
  unified_diff: string;
  target_file: string;
  patch_hash: string;
  changed_files: string[];
  expected_behavior: string;
  known_risks: string;
  explanation?: string;
  status: PatchStatus;
  failure_reason?: string;
  created_at: string;
}

export interface TestResult {
  id: string;
  run_id: string;
  attempt_number: number;
  suite_name: string;
  test_name: string;
  test_type: TestType;
  status: TestStatus;
  duration_ms: number;
  expected_output?: string;
  actual_output?: string;
  failure_message?: string;
  reproduction_command?: string;
  stdout?: string;
  stderr?: string;
  created_at: string;
}

export interface Counterexample {
  id: string;
  run_id: string;
  attempt_number: number;
  title: string;
  input_payload: string;
  expected_behavior: string;
  actual_behavior: string;
  code_location?: string;
  reproduction_command: string;
  confirmed: boolean;
  evidence_artifact?: string;
  created_at: string;
}

export interface MutationResult {
  id: string;
  run_id: string;
  attempt_number: number;
  mutant_id: string;
  file_path: string;
  line_number: number;
  mutator_name: string;
  original_code: string;
  mutated_code: string;
  status: MutantStatus;
  killer_test?: string;
  explanation?: string;
  suggested_test?: string;
  created_at: string;
}

export interface SecurityFinding {
  id: string;
  run_id: string;
  attempt_number: number;
  rule_id: string;
  severity: FindingSeverity;
  title: string;
  file_path: string;
  line_number?: number;
  code_snippet?: string;
  detection_method: string;
  mitigation: string;
  confirmed: boolean;
  status: 'OPEN' | 'RESOLVED' | 'BLOCKED';
  created_at: string;
}

export interface VerificationMemoryItem {
  id: string;
  repository_id: string;
  bug_title: string;
  bug_description: string;
  defect_pattern: string;
  patch_hash?: string;
  patch_diff?: string;
  confirmed_counterexamples: any[];
  successful_regression_tests: any[];
  mutation_score?: number;
  security_findings_summary?: string;
  final_decision: ReleaseRecommendation;
  tags: string[];
  created_at: string;
}

export interface HumanDecision {
  id: string;
  run_id: string;
  decision: 'APPROVED' | 'REJECTED' | 'REQUEST_REPAIR';
  reviewed_patch_hash: string;
  verified_hash_matched: boolean;
  reviewer_name: string;
  notes?: string;
  created_at: string;
}

export interface FullRunDetails extends VerificationRun {
  agents: AgentExecution[];
  patches: PatchAttempt[];
  tests: TestResult[];
  counterexamples: Counterexample[];
  mutations: MutationResult[];
  security: SecurityFinding[];
  decisions: HumanDecision[];
}

// ==========================================
// RAZE PLATFORM TYPES
// ==========================================
export type RazeAgentMode = 'think' | 'research' | 'build' | 'create' | 'analyze';

export interface RazeTask {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  result?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface RazeConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface RazeMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: RazeAgentMode;
  metadata?: any;
  created_at: string;
}

export interface RazeActivityLog {
  id: string;
  user_id: string;
  task_id?: string;
  event_type: string;
  message: string;
  metadata?: string;
  created_at: string;
}

export interface RazeProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  taskStats?: {
    total: number;
    completed: number;
    running: number;
  };
}

export interface RazeMemoryNote {
  id: string;
  user_id: string;
  project_id?: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface RazeResearchSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  verified: boolean;
}

export interface RazeResearchResult {
  query: string;
  summary: string;
  sources: RazeResearchSource[];
  timestamp: string;
  insights: string[];
}

// ==========================================
// COPILOT VERIFICATION PIPELINE TYPES
// ==========================================
export interface CopilotPipelineStageInfo {
  id: string;
  stageNumber: string;
  name: string;
  category: 'AUDIT' | 'SANDBOX' | 'REPAIR' | 'HUNT' | 'COLLAPSE' | 'MUTATION' | 'GATE' | 'SIGN';
  bullets: string[];
  status: 'PENDING' | 'ACTIVE' | 'PASSED' | 'FAILED' | 'BLOCKED';
  activeAttempt?: number;
  data?: any;
}

export interface CopilotOverview {
  activeRunId?: string;
  defectTitle: string;
  defectDescription: string;
  targetFile: string;
  status: string;
  currentStage: string;
  currentAttempt: number;
  maxRetries: number;
  activePatchHash?: string;
  releaseRecommendation: string;
  counterexamplesCount: number;
  mutationScore?: number;
  stages: CopilotPipelineStageInfo[];
  readyForHumanSign: boolean;
}

export interface CopilotActionItem {
  label: string;
  action: string;
  payload?: any;
}

export interface CopilotChatResponse {
  answer: string;
  stageReference?: string;
  actions?: CopilotActionItem[];
  dataSnippet?: any;
}

