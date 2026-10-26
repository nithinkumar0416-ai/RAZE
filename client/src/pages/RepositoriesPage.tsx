import React, { useEffect, useState } from 'react';
import { GitBranch, Folder, File, ShieldCheck, RefreshCw, FileCode, Check } from 'lucide-react';
import { api } from '../services/api';
import { Repository } from '../types';
import { Badge } from '../components/common/Badge';

export const RepositoriesPage: React.FC = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepos() {
      try {
        const data = await api.getRepositories();
        setRepos(data);
        if (data.length > 0) {
          setSelectedRepo(data[0]);
        }
      } catch (err) {
        console.error('Failed to load repositories:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRepos();
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;
    async function loadFiles() {
      try {
        const fileList = await api.getRepositoryFiles(selectedRepo!.id);
        setFiles(fileList);
        const defaultFile = fileList.find(f => !f.isDir && f.name.endsWith('.ts')) || fileList.find(f => !f.isDir);
        if (defaultFile) {
          handleSelectFile(defaultFile.path);
        }
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    }
    loadFiles();
  }, [selectedRepo]);

  const handleSelectFile = async (filePath: string) => {
    if (!selectedRepo) return;
    setSelectedFile(filePath);
    try {
      const content = await api.getFileContent(selectedRepo.id, filePath);
      setFileContent(content);
    } catch (err) {
      setFileContent(`Error loading file: ${err}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Repository Inspection</h2>
        <p className="text-xs text-og-muted mt-1">
          Explore registered repositories, clean source snapshots, and verified modules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Repository selector and file tree */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-og-border space-y-3">
            <span className="text-xs uppercase font-semibold text-og-muted block">
              Active Repository
            </span>
            {repos.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRepo(r)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedRepo?.id === r.id
                    ? 'border-og-primary bg-og-primary/10 shadow-glow-primary'
                    : 'border-white/5 bg-og-panel/30 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-og-cyan" />
                    <span className="text-xs font-semibold text-white">{r.name}</span>
                  </div>
                  {r.is_demo && <Badge variant="violet" size="sm">DEMO</Badge>}
                </div>
                <p className="text-[11px] text-og-muted mt-1 leading-relaxed">{r.description}</p>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-og-muted font-mono">
                  <span>Branch: {r.branch}</span>
                  <span>SHA: {r.snapshot_hash.substring(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>

          {/* File Tree */}
          <div className="glass-panel p-4 rounded-2xl border border-og-border space-y-2">
            <span className="text-xs uppercase font-semibold text-og-muted block mb-2">
              Source Tree
            </span>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {files.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => !f.isDir && handleSelectFile(f.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors text-left ${
                    selectedFile === f.path
                      ? 'bg-og-cyan/15 text-og-cyan border border-og-cyan/30'
                      : f.isDir
                      ? 'text-og-muted cursor-default'
                      : 'text-og-text hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {f.isDir ? (
                      <Folder className="w-3.5 h-3.5 text-og-muted" />
                    ) : (
                      <File className="w-3.5 h-3.5 text-og-primary" />
                    )}
                    <span className="truncate">{f.path}</span>
                  </div>
                  {!f.isDir && (
                    <span className="text-[10px] text-og-muted/60 ml-2">
                      {f.size} B
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-5 rounded-2xl border border-og-border flex flex-col h-[650px] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-og-border mb-3">
              <div className="flex items-center gap-2 font-mono text-xs">
                <FileCode className="w-4 h-4 text-og-cyan" />
                <span className="text-white font-semibold">{selectedFile || 'Select a file'}</span>
              </div>
              <span className="text-[11px] text-og-muted font-mono">
                Read-only snapshot
              </span>
            </div>

            <div className="flex-1 bg-[#070A11] border border-og-border rounded-xl p-4 overflow-auto font-mono text-xs text-og-text leading-relaxed">
              <pre className="whitespace-pre">
                {fileContent.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-white/[0.03]">
                    <span className="w-10 text-right pr-4 text-og-muted/40 select-none text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{line || ' '}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
