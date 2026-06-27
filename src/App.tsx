import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, View } from './types';
import { storage, newProject } from './storage';
import { initLLM, loadLLMConfig, Provider, PROVIDER_LABELS } from './llm';
import WorldPanel from './components/WorldPanel';
import CharacterPanel from './components/CharacterPanel';
import PlotPanel from './components/PlotPanel';
import WritingPanel from './components/WritingPanel';
import RevisionPanel from './components/RevisionPanel';
import CreativeWorkshop from './components/CreativeWorkshop';

// ─── Icons (inline SVG to avoid library issues) ───────────────

const Icon = {
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  pen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  key: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  save: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  back: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  x: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  book2: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

const NAV: { key: View; label: string; icon: React.ReactNode; sub?: string }[] = [
  { key: 'workshop',   label: 'AI 创作引导', icon: Icon.zap,    sub: '一键生成全稿' },
  { key: 'world',      label: '世界观',      icon: Icon.globe  },
  { key: 'characters', label: '角色',        icon: Icon.users  },
  { key: 'plot',       label: '情节',        icon: Icon.book   },
  { key: 'write',      label: '写作台',      icon: Icon.pen    },
  { key: 'revise',     label: '推敲',        icon: Icon.shield },
];

// ─── 提供商配置面板 ────────────────────────────────────────────

const PROVIDER_HINTS: Record<Provider, { placeholder: string; hint: string }> = {
  gemini: { placeholder: 'AIza...', hint: 'aistudio.google.com/apikey 免费获取' },
  claude: { placeholder: 'sk-ant-...', hint: 'console.anthropic.com 获取' },
  openai: { placeholder: 'sk-...', hint: 'platform.openai.com 获取' },
  custom: { placeholder: 'sk-...', hint: 'DeepSeek: deepseek-v4-flash / deepseek-v4-pro　Grok: grok-4.3　Qwen / Ollama 等均可' },
};

const PROVIDER_MODELS: Record<Provider, string[]> = {
  gemini: ['gemini-3.5-flash', 'gemini-3.5-pro', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
  claude: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'o3', 'o3-pro', 'o4-mini'],
  custom: [],
};

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const saved = loadLLMConfig();
  const [provider, setProvider] = useState<Provider>(saved?.provider || 'gemini');
  const [apiKey, setApiKey] = useState(saved?.apiKey || '');
  const [model, setModel] = useState(saved?.model || 'gemini-3.5-flash');
  const [baseUrl, setBaseUrl] = useState(saved?.baseUrl || '');
  const [customModel, setCustomModel] = useState(saved?.provider === 'custom' ? saved.model : '');

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0] || '');
    setApiKey('');
  };

  const handleSave = () => {
    const finalModel = provider === 'custom' ? customModel : model;
    initLLM({ provider, apiKey, model: finalModel, baseUrl: provider === 'custom' ? baseUrl : undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] animate-fade-in overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-medium text-stone-800 flex items-center gap-2 text-[15px]">
            {Icon.key} AI 接口配置
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">{Icon.x}</button>
        </div>
        <div className="p-6">
          <div className="mb-5">
            <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">提供商</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_LABELS) as Provider[]).map(p => (
                <button key={p} onClick={() => handleProviderChange(p)}
                  className={`py-2.5 px-3 rounded-xl text-sm text-left transition-all border ${
                    provider === p
                      ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}>
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {provider === 'custom' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-stone-500 mb-1">Base URL</label>
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://api.deepseek.com/v1" className="field-input" />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-stone-500 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder={PROVIDER_HINTS[provider].placeholder} className="field-input" />
            <p className="text-xs text-stone-400 mt-1.5">{PROVIDER_HINTS[provider].hint}</p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-stone-500 mb-1">模型</label>
            {provider === 'custom' ? (
              <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)}
                placeholder="deepseek-v4-flash" className="field-input" />
            ) : (
              <select value={model} onChange={e => setModel(e.target.value)}
                className="field-input appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716c\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                {PROVIDER_MODELS[provider].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>

          <button onClick={handleSave} disabled={!apiKey.trim()} className="btn-primary w-full justify-center text-[14px] py-2.5">
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 项目卡片 ─────────────────────────────────────────────────

// 类型对应的颜色条
const GENRE_COLORS: Record<string, string> = {
  '言情': '#e11d5a', '玄幻': '#7c3aed', '悬疑': '#1d4ed8', '科幻': '#0891b2',
  '历史': '#92400e', '都市': '#065f46', '武侠': '#b45309', '奇幻': '#6d28d9',
  'ラブコメ': '#e11d5a', '異世界転生': '#7c3aed', '魔法学園': '#0891b2',
  '能力バトル': '#b45309', '悪役令嬢': '#be185d', 'チート無双': '#6d28d9',
};

function ProjectCard({ project, onOpen, onDelete, featured = false }: {
  project: Project; onOpen: () => void; onDelete: () => void; featured?: boolean;
}) {
  const totalWords = project.chapters.reduce((s, c) => s + c.wordCount, 0);
  const accentColor = GENRE_COLORS[project.genre] || '#e11d5a';
  const isComplete = project.chapters.length > 0 && project.chapters.every(c => c.wordCount > 0);

  return (
    <div onClick={onOpen} style={{ transition: 'all 0.15s ease', borderTop: `3px solid ${accentColor}` }}
      className="bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-panel cursor-pointer group overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 style={{ fontSize: featured ? 18 : 15 }} className="font-semibold text-stone-900 group-hover:text-rose-700 transition-colors truncate">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-stone-400">{project.genre}</span>
              {project.lang === 'ja' && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">日本語</span>}
              {isComplete && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">完稿</span>}
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-stone-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg flex-shrink-0">
            {Icon.trash}
          </button>
        </div>
        {project.summary && (
          <p className="text-sm text-stone-500 mb-3 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: featured ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.summary}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-stone-400 pt-2 border-t border-stone-100">
          <span>{project.characters.length} 角色</span>
          <span>{project.chapters.length} 章节</span>
          <span style={{ color: totalWords > 0 ? '#78716c' : undefined, fontWeight: totalWords > 0 ? 500 : undefined }}>
            {totalWords.toLocaleString()} 字
          </span>
          <span className="ml-auto">{new Date(project.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 主应用 ───────────────────────────────────────────────────

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [view, setView] = useState<View>('workshop');
  const [showApiModal, setShowApiModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProjects(storage.getAll());
    const cfg = loadLLMConfig();
    if (cfg) initLLM(cfg);
    const activeId = storage.getActiveId();
    if (activeId) {
      const p = storage.getAll().find(p => p.id === activeId);
      if (p) setActiveProject(p);
    }
  }, []);

  const saveProject = useCallback((project: Project) => {
    setSaveStatus('saving');
    storage.save(project);
    setProjects(storage.getAll());
    setTimeout(() => setSaveStatus('saved'), 600);
  }, []);

  const handleChange = useCallback((updated: Project) => {
    setActiveProject(updated);
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProject(updated), 800);
  }, [saveProject]);

  const openProject = (p: Project) => {
    setActiveProject(p);
    storage.setActiveId(p.id);
    setView('workshop');
  };

  const createProject = () => {
    const p = newProject();
    storage.save(p);
    setProjects(storage.getAll());
    openProject(p);
  };

  const deleteProject = (id: string) => {
    if (!window.confirm('确定删除这部作品？所有内容将无法恢复。')) return;
    storage.delete(id);
    setProjects(storage.getAll());
  };

  const closeProject = () => {
    if (activeProject) saveProject(activeProject);
    setActiveProject(null);
    storage.setActiveId(null);
  };

  // ===== 导出小说正文为MD =====
  const exportNovelMD = () => {
    if (!activeProject) return;
    const lines: string[] = [];
    
    // 标题
    lines.push(`# ${activeProject.title}\n`);
    
    // 正文
    const sorted = [...activeProject.chapters].sort((a, b) => a.number - b.number);
    sorted.forEach(ch => {
      lines.push(`## 第${ch.number}章：${ch.title}`);
      lines.push(`> 字数：${ch.wordCount}\n`);
      lines.push(ch.content || '（此章节暂无内容）');
      lines.push('\n---\n');
    });
    
    // 下载
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeProject.title}_小说正文.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // ===== 导出完整项目为MD（含设定） =====
  const exportFullMD = () => {
    if (!activeProject) return;
    const lines: string[] = [];
    
    // 标题
    lines.push(`# ${activeProject.title}\n`);
    lines.push(`- 类型：${activeProject.genre || '未设置'}`);
    lines.push(`- 语言：${activeProject.lang || 'zh'}`);
    const totalWords = activeProject.chapters.reduce((s, c) => s + c.wordCount, 0);
    lines.push(`- 总字数：${totalWords.toLocaleString()}\n`);
    lines.push('---\n');
    
    // 世界观
    if (activeProject.world?.overview) {
      lines.push('## 世界观\n');
      lines.push(activeProject.world.overview);
      lines.push('\n---\n');
    }
    
    // 角色
    if (activeProject.characters.length > 0) {
      lines.push('## 角色\n');
      activeProject.characters.forEach(c => {
        lines.push(`### ${c.name}（${c.role}）`);
        if (c.age) lines.push(`- 年龄：${c.age}`);
        if (c.personalityKeywords) lines.push(`- 性格：${c.personalityKeywords}`);
        if (c.motivation) lines.push(`- 动机：${c.motivation}`);
        lines.push('');
      });
      lines.push('---\n');
    }
    
    // 正文
    lines.push('## 正文\n');
    const sorted = [...activeProject.chapters].sort((a, b) => a.number - b.number);
    sorted.forEach(ch => {
      lines.push(`## 第${ch.number}章：${ch.title}`);
      lines.push(`> 字数：${ch.wordCount}\n`);
      lines.push(ch.content || '（此章节暂无内容）');
      lines.push('\n---\n');
    });
    
    // 下载
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeProject.title}_完整项目.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // ── 首页：书架 ──────────────────────────────────────────────

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-paper-100" style={{ background: 'linear-gradient(160deg, #f9f7f4 0%, #f3ede5 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-14">
          {/* 页头 */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #e11d5a, #be1249)' }}>
                {Icon.book2}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-stone-900 leading-none">轻小说创作台</h1>
                <p className="text-xs text-stone-400 mt-0.5 font-mono tracking-wide">Light Novel Studio</p>
              </div>
            </div>
            <button onClick={() => setShowApiModal(true)}
              className="btn-ghost text-[13px] gap-2">
              {Icon.key} AI 接口配置
            </button>
          </div>

          {/* 书架 */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-stone-500">我的作品</h2>
            <button onClick={createProject} className="btn-primary text-[13px]">
              {Icon.plus} 新建作品
            </button>
          </div>

          {/* 字数统计 */}
          {projects.length > 0 && (
            <div className="flex items-center gap-6 mb-5 text-sm text-stone-400 font-mono">
              <span>{projects.length} 部作品</span>
              <span>{projects.reduce((s, p) => s + p.chapters.reduce((cs, c) => cs + c.wordCount, 0), 0).toLocaleString()} 字</span>
              <span>{projects.filter(p => p.chapters.length > 0 && p.chapters.every(c => c.wordCount > 0)).length} 部完稿</span>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-24 text-stone-300">
              <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-stone-200 flex items-center justify-center mx-auto mb-4">
                {Icon.pen}
              </div>
              <p className="text-sm text-stone-400 mb-4">还没有作品，从这里开始你的创作</p>
              <button onClick={createProject} className="btn-ghost text-sm">新建第一部作品</button>
            </div>
          ) : (
            <div>
              {/* 首部作品：大卡 */}
              {projects[0] && (
                <div className="mb-4">
                  <ProjectCard project={projects[0]} onOpen={() => openProject(projects[0])} onDelete={() => deleteProject(projects[0].id)} featured={true} />
                </div>
              )}
              {/* 其余：3列小卡 */}
              {projects.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {projects.slice(1).map(p => (
                    <ProjectCard key={p.id} project={p} onOpen={() => openProject(p)} onDelete={() => deleteProject(p.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}
      </div>
    );
  }

  // ── 编辑器 ──────────────────────────────────────────────────

  const totalWords = activeProject.chapters.reduce((s, c) => s + c.wordCount, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f9f7f4' }}>

      {/* 浅色侧边栏 */}
      <aside style={{ width: 220, background: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ede9e3' }}>

        {/* 作品名 */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f0ece6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#e11d5a,#be1249)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <input
                value={activeProject.title}
                onChange={e => handleChange({ ...activeProject, title: e.target.value })}
                style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', background: 'transparent', border: 'none', outline: 'none', width: '100%', lineHeight: 1.2 }}
                title="点击编辑作品名"
              />
              <p style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>{activeProject.genre}</p>
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav style={{ flex: 1, padding: '8px 8px', overflow: 'hidden auto' }}>
          {NAV.map(n => {
            const active = view === n.key;
            return (
              <button key={n.key} onClick={() => setView(n.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10, marginBottom: 2,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: active ? 'rgba(225,29,90,0.08)' : 'transparent',
                  boxShadow: active ? 'inset 3px 0 0 #e11d5a' : 'none',
                  color: active ? '#be1249' : '#78716c',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f5f5f4'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ flexShrink: 0, opacity: active ? 1 : 0.55 }}>{n.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: active ? 500 : 400, lineHeight: 1.2 }}>{n.label}</p>
                  {n.sub && <p style={{ fontSize: 11, opacity: 0.5, marginTop: 1 }}>{n.sub}</p>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* 底部操作区 */}
        <div style={{ padding: '8px', borderTop: '1px solid #f0ece6' }}>
          {/* 字数统计 */}
          <div style={{ padding: '8px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 11, color: '#a8a29e' }}>
              {activeProject.chapters.length} 章 · {totalWords.toLocaleString()} 字
            </p>
          </div>

          {/* 保存状态 */}
          <button onClick={() => saveProject(activeProject)}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f4'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: saveStatus === 'unsaved' ? '#d97706' : '#78716c',
              fontSize: 13, textAlign: 'left', transition: 'all 0.12s',
            }}>
            {Icon.save}
            {saveStatus === 'unsaved' ? '未保存' : saveStatus === 'saving' ? '保存中…' : '已保存'}
          </button>

          <button onClick={() => setShowApiModal(true)}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f4'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#78716c', fontSize: 13, textAlign: 'left', transition: 'all 0.12s' }}>
            {Icon.key} AI 接口
          </button>

          <button onClick={closeProject}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f4'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#78716c', fontSize: 13, textAlign: 'left', transition: 'all 0.12s' }}>
            {Icon.back} 返回书架
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f9f7f4' }}>

        {/* 顶部面包屑 */}
        <div style={{ height: 48, padding: '0 24px', borderBottom: '1px solid #ede9e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#e11d5a', flexShrink: 0 }}>{NAV.find(n => n.key === view)?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1c1917' }}>{NAV.find(n => n.key === view)?.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#a8a29e' }}>
            <span>{activeProject.characters.length} 角色</span>
            <span>{activeProject.chapters.length} 章节</span>
            <span style={{ color: '#78716c', fontWeight: 500 }}>{totalWords.toLocaleString()} 字</span>
            
            {/* 导出按钮组 */}
            <div style={{ display: 'flex', gap: 6, borderLeft: '1px solid #ede9e3', paddingLeft: 12 }}>
              <button
                onClick={exportNovelMD}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid #e11d5a',
                  background: 'transparent',
                  color: '#e11d5a',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fdf2f4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {Icon.download} 导出正文
              </button>
              <button
                onClick={exportFullMD}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid #a8a29e',
                  background: 'transparent',
                  color: '#78716c',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {Icon.download} 导出完整
              </button>
            </div>
          </div>
        </div>

        {/* API 未配置提示 */}
        {!loadLLMConfig() && (
          <div style={{ padding: '10px 24px', background: '#fef3c7', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: '#92400e' }}>AI 功能尚未配置，点击右侧按钮填入 API Key 才能使用生成功能</span>
            <button onClick={() => setShowApiModal(true)}
              style={{ padding: '4px 14px', borderRadius: 8, border: 'none', background: '#d97706', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
              立即配置
            </button>
          </div>
        )}

        {/* 面板内容 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'workshop'   && <CreativeWorkshop project={activeProject} onChange={handleChange} onNavigate={v => setView(v as View)} />}
          {view === 'world'      && <WorldPanel       project={activeProject} onChange={handleChange} />}
          {view === 'characters' && <CharacterPanel   project={activeProject} onChange={handleChange} />}
          {view === 'plot'       && <PlotPanel        project={activeProject} onChange={handleChange} />}
          {view === 'write'      && <WritingPanel     project={activeProject} onChange={handleChange} />}
          {view === 'revise'     && <RevisionPanel    project={activeProject} />}
        </div>
      </main>

      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}
    </div>
  );
}