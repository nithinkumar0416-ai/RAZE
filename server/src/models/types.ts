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

export interface EvidenceRecord {
  id: string;
  run_id: string;
  patch_hash: string;
  release_decision: ReleaseRecommendation;
  summary_markdown: string;
  full_json_artifact: string;
  verified_checks: string[];
  failed_checks: string[];
  remaining_risks: string[];
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

export interface SSEEvent {
  type: 
    | 'run.created'
    | 'agent.started'
    | 'agent.completed'
    | 'patch.generated'
    | 'test.started'
    | 'test.completed'
    | 'counterexample.discovered'
    | 'mutation.completed'
    | 'security.finding'
    | 'circuit_breaker.activated'
    | 'repair.retry'
    | 'verification.blocked'
    | 'verification.completed'
    | 'heartbeat';
  run_id: string;
  timestamp: string;
  data: any;
}
