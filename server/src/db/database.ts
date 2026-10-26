import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const isVercel = !!process.env.VERCEL;
const DB_DIR = isVercel ? '/tmp' : path.resolve(process.cwd(), 'data');

let databaseInstance: DatabaseSync;

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const DB_PATH = path.join(DB_DIR, 'openguard.sqlite');
  databaseInstance = new DatabaseSync(DB_PATH);
  try {
    databaseInstance.exec('PRAGMA journal_mode = WAL;');
  } catch {
    databaseInstance.exec('PRAGMA journal_mode = MEMORY;');
  }
  databaseInstance.exec('PRAGMA foreign_keys = ON;');
} catch (err) {
  console.warn('⚠️ File SQLite failed, falling back to in-memory SQLite database:', err);
  databaseInstance = new DatabaseSync(':memory:');
}

export const db = databaseInstance;

export function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      is_demo INTEGER DEFAULT 0,
      branch TEXT DEFAULT 'main',
      snapshot_hash TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_runs (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      status TEXT NOT NULL,
      defect_title TEXT NOT NULL,
      defect_description TEXT NOT NULL,
      target_file TEXT NOT NULL,
      stage TEXT NOT NULL,
      current_attempt INTEGER DEFAULT 1,
      max_retries INTEGER DEFAULT 3,
      active_patch_hash TEXT,
      release_recommendation TEXT DEFAULT 'PENDING',
      circuit_breaker_tripped INTEGER DEFAULT 0,
      circuit_breaker_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS agent_executions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      status TEXT NOT NULL,
      task_description TEXT NOT NULL,
      output_summary TEXT,
      structured_data TEXT,
      duration_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS patch_attempts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      unified_diff TEXT NOT NULL,
      target_file TEXT NOT NULL,
      patch_hash TEXT NOT NULL,
      changed_files TEXT NOT NULL,
      expected_behavior TEXT,
      known_risks TEXT,
      status TEXT NOT NULL,
      failure_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      suite_name TEXT NOT NULL,
      test_name TEXT NOT NULL,
      test_type TEXT NOT NULL,
      status TEXT NOT NULL,
      duration_ms INTEGER DEFAULT 0,
      expected_output TEXT,
      actual_output TEXT,
      failure_message TEXT,
      reproduction_command TEXT,
      stdout TEXT,
      stderr TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS counterexamples (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      input_payload TEXT NOT NULL,
      expected_behavior TEXT NOT NULL,
      actual_behavior TEXT NOT NULL,
      code_location TEXT,
      reproduction_command TEXT NOT NULL,
      confirmed INTEGER DEFAULT 0,
      evidence_artifact TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS mutation_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      mutant_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      line_number INTEGER NOT NULL,
      mutator_name TEXT NOT NULL,
      original_code TEXT NOT NULL,
      mutated_code TEXT NOT NULL,
      status TEXT NOT NULL,
      killer_test TEXT,
      explanation TEXT,
      suggested_test TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS security_findings (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      rule_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      line_number INTEGER,
      code_snippet TEXT,
      detection_method TEXT NOT NULL,
      mitigation TEXT NOT NULL,
      confirmed INTEGER DEFAULT 1,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS evidence_records (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      patch_hash TEXT NOT NULL,
      release_decision TEXT NOT NULL,
      summary_markdown TEXT NOT NULL,
      full_json_artifact TEXT NOT NULL,
      verified_checks TEXT NOT NULL,
      failed_checks TEXT NOT NULL,
      remaining_risks TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    CREATE TABLE IF NOT EXISTS verification_memory (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      bug_title TEXT NOT NULL,
      bug_description TEXT NOT NULL,
      defect_pattern TEXT NOT NULL,
      patch_hash TEXT,
      patch_diff TEXT,
      confirmed_counterexamples TEXT,
      successful_regression_tests TEXT,
      mutation_score REAL,
      security_findings_summary TEXT,
      final_decision TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS human_decisions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      reviewed_patch_hash TEXT NOT NULL,
      verified_hash_matched INTEGER DEFAULT 1,
      reviewer_name TEXT DEFAULT 'Lead Engineer',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES verification_runs(id)
    );

    /* RAZE Futuristic AI Platform Tables */
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      mode TEXT DEFAULT 'think',
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      priority TEXT DEFAULT 'medium',
      result TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      content TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_runs_repo ON verification_runs(repository_id);
    CREATE INDEX IF NOT EXISTS idx_agents_run ON agent_executions(run_id);
    CREATE INDEX IF NOT EXISTS idx_tests_run ON test_results(run_id);
    CREATE INDEX IF NOT EXISTS idx_memory_repo ON verification_memory(repository_id);
    CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
  `;

  db.exec(schema);
  initRazeDefaults();
  console.log('✓ SQLite database initialized successfully at', DB_PATH);
}

function initRazeDefaults() {
  const defaultUser = 'user-default-raze';
  const existingProfile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(defaultUser);
  if (!existingProfile) {
    db.prepare('INSERT INTO profiles (id, display_name, created_at) VALUES (?, ?, ?)')
      .run(defaultUser, 'Neural Operative', new Date().toISOString());

    // Default Project
    const projId = 'proj-hackathon-2026';
    db.prepare('INSERT INTO projects (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(projId, defaultUser, 'Autonomous AI Hackathon Demo', 'Building RAZE: The next-generation self-challenging agent platform with real-time particle intelligence.', new Date().toISOString(), new Date().toISOString());

    // Seed Initial Tasks
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, user_id, project_id, title, description, status, priority, result, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertTask.run(
      'task-1', defaultUser, projId, 'Initialize Neural Core & Parallax Interface',
      'Mount 60fps cosmic particle silhouette with volumetric light rays and cursor gravity field.',
      'completed', 'high', 'Visual system synthesized with 1500+ particles and responsive palm illumination.',
      now, now, now
    );
    insertTask.run(
      'task-2', defaultUser, projId, 'Synthesize 5 Specialized Agent Modes',
      'Implement Think, Research, Build, Create, and Analyze real execution workflows.',
      'completed', 'high', 'Agent modes connected to deterministic inference engine and live search aggregator.',
      now, now, now
    );
    insertTask.run(
      'task-3', defaultUser, projId, 'Execute Multi-Step Autonomous Project Plan',
      'Convert natural language intent into decomposed dependencies, verification gates, and executable subtasks.',
      'running', 'high', null, now, now, null
    );

    // Seed Initial Activity Logs
    const insertLog = db.prepare('INSERT INTO activity_logs (id, user_id, task_id, event_type, message, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertLog.run('log-1', defaultUser, 'task-1', 'system_init', 'RAZE Neural Architecture initialized', JSON.stringify({ version: '2.4.0', status: 'ONLINE' }), now);
    insertLog.run('log-2', defaultUser, 'task-2', 'agent_awoken', 'Agent modes calibrated for Hackathon Demonstration', JSON.stringify({ modes: ['think', 'research', 'build', 'create', 'analyze'] }), now);
    insertLog.run('log-3', defaultUser, 'task-3', 'task_executing', 'Autonomous execution plan in progress', JSON.stringify({ progress: 68 }), now);

    // Seed Notes
    const insertNote = db.prepare('INSERT INTO memory_notes (id, user_id, project_id, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertNote.run('note-1', defaultUser, projId, 'Core philosophical axiom: An AI agent must not merely claim safety—it must challenge its own assumptions and present reproducible proof.', JSON.stringify(['philosophy', 'verification', 'ai']), now, now);
    insertNote.run('note-2', defaultUser, projId, 'Color token specifications: Background #030407, Electric Ice-Blue #00E5FF / #60A5FA, Hand Red-Orange Accents #FF5722, Volumetric Light #E0F2FE.', JSON.stringify(['design', 'ui', 'cinema']), now, now);
  }
}
