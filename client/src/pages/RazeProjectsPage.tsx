import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RazeProject, RazeMemoryNote } from '../types';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  Tag, 
  Layers, 
  ShieldCheck,
  FileText
} from 'lucide-react';

export const RazeProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<RazeProject[]>([]);
  const [notes, setNotes] = useState<RazeMemoryNote[]>([]);
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pData, nData] = await Promise.all([
        api.getProjects(),
        api.getNotes()
      ]);
      setProjects(pData);
      setNotes(nData);
    } catch (err) {
      console.error('Failed to load projects/notes:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    try {
      await api.createProject({
        name: newProjName.trim(),
        description: newProjDesc.trim() || undefined
      });
      setNewProjName('');
      setNewProjDesc('');
      setShowNewProjModal(false);
      loadData();
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const tags = newNoteTag ? newNoteTag.split(',').map(t => t.trim()).filter(Boolean) : ['axiom'];
      await api.createNote({
        content: newNoteContent.trim(),
        tags
      });
      setNewNoteContent('');
      setNewNoteTag('');
      loadData();
    } catch (err: any) {
      alert(`Failed to save memory note: ${err.message}`);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await api.deleteNote(id);
      loadData();
    } catch (err: any) {
      alert(`Failed to delete note: ${err.message}`);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-raze-void text-raze-silver px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raze-blueGlow/10 border border-raze-blueGlow/30 text-raze-blueGlow text-xs font-mono uppercase mb-2">
            <FolderGit2 className="w-3.5 h-3.5" />
            ORGANIZER & REPOSITORY STATE
          </div>
          <h1 className="font-raze text-3xl font-extrabold text-white text-glow-ice">
            PROJECTS & MEMORY REPOSITORY
          </h1>
          <p className="text-sm text-raze-silverMuted mt-1">
            Persist high-level scopes, verified task batches, and long-term agent memory notes.
          </p>
        </div>

        <button
          onClick={() => setShowNewProjModal(true)}
          className="px-5 py-2.5 rounded-xl bg-raze-blue/20 border border-raze-blue/40 text-raze-ice font-mono text-xs hover:bg-raze-blue/30 transition-all flex items-center gap-2 self-start shadow-glow-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => {
          const stats = p.taskStats || { total: 0, completed: 0, running: 0 };
          const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

          return (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-raze-card border border-white/10 hover:border-raze-blue/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raze-blue/15 text-raze-cyan border border-raze-blue/30 uppercase">
                    ACTIVE PROJECT
                  </span>
                  <span className="text-[10px] font-mono text-raze-silverMuted">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-raze text-lg font-bold text-white mb-2">{p.name}</h3>
                <p className="text-xs text-raze-silverMuted leading-relaxed">{p.description || 'No description provided.'}</p>
              </div>

              {/* Progress Bar & Stats */}
              <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-raze-silverMuted">Tasks Completed</span>
                  <span className="text-raze-ice font-bold">{stats.completed} / {stats.total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-raze-blue to-raze-cyan rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================
          PERSISTENT MEMORY NOTES SECTION
      ============================================================ */}
      <div className="p-6 md:p-8 rounded-2xl bg-raze-card border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-raze-orange uppercase mb-1">
              <Bookmark className="w-4 h-4" />
              <span>Isolated Agent Memory</span>
            </div>
            <h2 className="font-raze text-xl font-bold text-white">USER-APPROVED MEMORY NOTES</h2>
            <p className="text-xs text-raze-silverMuted mt-1">
              Long-term preferences and foundational rules saved to persistent SQLite memory. Delete anytime to purge context.
            </p>
          </div>
        </div>

        {/* Add New Memory Note Form */}
        <form onSubmit={handleCreateNote} className="mb-8 p-4 rounded-xl bg-raze-void/70 border border-white/10 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            placeholder="Record persistent axiom or preference (e.g. Always generate TypeScript definitions for API payloads)..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-raze-silverMuted/50 outline-none font-sans"
          />
          <input
            type="text"
            value={newNoteTag}
            onChange={e => setNewNoteTag(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full md:w-48 bg-white/5 rounded-lg px-3 py-2 text-xs text-raze-ice placeholder-raze-silverMuted/50 outline-none font-mono"
          />
          <button
            type="submit"
            disabled={!newNoteContent.trim()}
            className="px-4 py-2 rounded-lg bg-raze-orange/20 border border-raze-orange/40 text-raze-orange text-xs font-mono hover:bg-raze-orange/30 disabled:opacity-40 transition-colors"
          >
            Persist Note
          </button>
        </form>

        {/* Memory Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-raze-silverMuted">
              No saved memory notes yet.
            </div>
          ) : (
            notes.map(n => (
              <div
                key={n.id}
                className="p-4 rounded-xl bg-raze-void/50 border border-white/5 hover:border-white/15 transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <p className="text-xs text-raze-silver leading-relaxed font-sans">{n.content}</p>
                  <div className="flex items-center gap-2">
                    {n.tags?.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-raze-silverMuted">
                        #{t}
                      </span>
                    ))}
                    <span className="text-[10px] font-mono text-white/30">
                      Saved {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNote(n.id)}
                  className="p-2 rounded-lg text-raze-silverMuted/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Purge Memory Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-raze-card border border-white/15 p-6 shadow-2xl">
            <h3 className="font-raze text-lg font-bold text-white mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-raze-silverMuted mb-1">PROJECT NAME</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="e.g. Autonomous Payment Gateway"
                  className="w-full bg-raze-void border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-raze-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-raze-silverMuted mb-1">DESCRIPTION</label>
                <textarea
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  placeholder="Goals, boundaries, and scope constraints..."
                  rows={3}
                  className="w-full bg-raze-void border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-raze-blue resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-raze-silverMuted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-raze-blue text-raze-void font-raze text-xs font-bold tracking-wider hover:bg-raze-cyan transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
