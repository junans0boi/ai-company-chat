"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Archive, Bell, Camera, ChevronDown, CircleDot, FileText, Folder, FolderOpen, GitBranch, Globe, Image, Moon, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Paperclip, Pin, Plus, Search, Send, Settings, Sparkles, Sun, Upload, Wrench, X } from "lucide-react";
import styles from "./CompanyConsole.module.css";
import mobileStyles from "./CompanyConsoleMobile.module.css";
import liveStyles from "./LiveConsole.module.css";

const pipeline = ["ceo", "architect", "developer", "reviewer"] as const;
type GatewayAgent = { id?: string; name?: string; model?: { primary?: string } };
type GatewaySession = { key?: string; displayName?: string; projectId?: string | null; lastMessagePreview?: string; agentId?: string; updatedAt?: number | null; status?: string; hasActiveRun?: boolean; pinned?: boolean };
type Project = { id: string; name: string; directory: string; pinned: boolean; section: string; sessionKeys: string[] };
type Artifact = { path: string; size: number; updatedAt: number };
type MessageItem = { id: string; role: "user" | "assistant"; name: string; text: string };
type Usage = { input: number; output: number; cost: number };
type ModelOption = { id: string; name: string; provider: string; contextWindow: number; available: boolean; reasoning: boolean; input?: unknown };
type ContextStats = { usedTokens: number; maxTokens: number; remainingTokens: number; percent: number };
type Attachment = { name: string; path: string };
type DirectoryEntry = { name: string; path: string };
type Skill = { name: string; source: string; description: string; descriptionKo: string };
const commands = [
  ["/stop", "현재 실행 중인 작업 중지"], ["/reset", "현재 세션 초기화"], ["/new", "새 세션 시작"], ["/compact", "세션 컨텍스트 압축"], ["/name", "현재 세션 이름 변경"], ["/clear", "채팅 기록 지우기"], ["/session", "세션 설정과 수명주기 관리"], ["/think", "추론 수준 설정"], ["/model", "모델 확인 또는 변경"], ["/verbose", "빠른 모드 전환"], ["/reasoning", "추론 표시 전환"], ["/models", "사용 가능한 모델 목록"], ["/trace", "플러그인 trace 표시 전환"], ["/elevated", "권한 수준 설정"], ["/exec", "실행 기본값 설정"], ["/queue", "메시지 큐 설정"], ["/help", "사용 가능한 명령어 보기"], ["/status", "현재 상태 보기"], ["/openclaw", "OpenClaw 설정 및 복구 도우미"], ["/export-session", "현재 세션을 HTML로 내보내기"], ["/export-trajectory", "현재 세션 trajectory 내보내기"], ["/tools", "실행 도구 목록"], ["/skill", "스킬 실행"],
] as const;

export default function CompanyPage() {
  const socketRef = useRef<WebSocket | null>(null);
  const sessionKeyRef = useRef("");
  const historyRequestRef = useRef(0);
  const modelRequestRef = useRef(0);
  const refreshSessionsRef = useRef<() => void>(() => undefined);
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sessionKey, setSessionKey] = useState("");
  const [gatewayAgents, setGatewayAgents] = useState<GatewayAgent[]>([]);
  const [sessions, setSessions] = useState<GatewaySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactView, setArtifactView] = useState<{ path: string; content: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("ceo");
  const [newChatSetup, setNewChatSetup] = useState(true);
  const [plusOpen, setPlusOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [permissionMode, setPermissionMode] = useState("standard");
  const [model, setModel] = useState("company-brain");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [oauth, setOauth] = useState<{ provider: string; type: string; status: string; label?: string }[]>([]);
  const [context, setContext] = useState<ContextStats>({ usedTokens: 0, maxTokens: 0, remainingTokens: 0, percent: 0 });
  const [thinking, setThinking] = useState("medium");
  const [fastMode, setFastMode] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [usage, setUsage] = useState<Usage>({ input: 0, output: 0, cost: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceDirectory, setWorkspaceDirectory] = useState("");
  const [projectDialog, setProjectDialog] = useState<{ id?: string; name: string; directory: string } | null>(null);
  const [directoryBrowserPath, setDirectoryBrowserPath] = useState("");
  const [directoryParent, setDirectoryParent] = useState<string | null>(null);
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [projectMenuId, setProjectMenuId] = useState("");
  const [sortPinned, setSortPinned] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState("");
  const directoryDialogKey = projectDialog ? projectDialog.id || "new" : "";
  useEffect(() => {
    const saved = localStorage.getItem("ai-company-chat.theme");
    const preferred = saved === "light" || saved === "dark" ? saved : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    if (preferred === "light") window.setTimeout(() => setTheme("light"), 0);
  }, []);
  const toggleTheme = () => setTheme((current) => { const next = current === "dark" ? "light" : "dark"; localStorage.setItem("ai-company-chat.theme", next); return next; });
  const openSession = useCallback((key: string) => {
    if (!key) return;
    const request = ++historyRequestRef.current;
    sessionKeyRef.current = key;
    setSessionKey(key);
    localStorage.setItem("ai-company-chat.session", key);
    history.replaceState(null, "", `/?session=${encodeURIComponent(key)}`);
    setMessages([]); setUsage({ input: 0, output: 0, cost: 0 }); setError(""); setMobileMenuOpen(false);
    setNewChatSetup(false);
    void refreshModelData(key);
    void loadHistory(key).then((result) => { if (request === historyRequestRef.current && key === sessionKeyRef.current) { setMessages(result.messages); setUsage(result.usage); } }).catch((reason: unknown) => { if (request === historyRequestRef.current) setError(reason instanceof Error ? reason.message : "대화를 불러오지 못했습니다."); });
  }, []);

  useEffect(() => {
    let stopped = false;
    let reconnectTimer = 0;
    let retry = 0;
    const requestSessions = async () => {
      const response = await fetch("/api/openclaw/sessions");
      if (!response.ok) throw new Error("OpenClaw 세션을 불러오지 못했습니다.");
      const body = await response.json();
      const listed = (body.sessions || []) as GatewaySession[];
      setSessions(listed);
      setGatewayAgents(Array.from(new Map(listed.filter((item) => item.agentId).map((item) => [item.agentId as string, { id: item.agentId, name: item.agentId } as GatewayAgent])).values()));
      setSessionsLoading(false);
      return listed;
    };
    refreshSessionsRef.current = requestSessions;
    void requestSessions().then((listed) => {
      const requested = new URLSearchParams(location.search).get("session") || localStorage.getItem("ai-company-chat.session");
      const key = listed.some((item) => item.key === requested) ? requested! : listed[0]?.key || "";
      if (key) openSession(key);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "세션 목록을 불러오지 못했습니다."));
    void fetch("/api/openclaw/skills").then((response) => response.json()).then((body) => setSkills(body.skills || [])).catch(() => undefined);
    void fetch("/api/openclaw/projects").then((response) => response.json()).then((body) => { setProjects(body.projects || []); setWorkspaceDirectory(body.workspace || ""); }).catch(() => undefined);
    void loadArtifacts().then(setArtifacts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "아티팩트를 불러오지 못했습니다."));
    const connect = () => {
      const socket = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/gateway/ws`);
      socketRef.current = socket;
      socket.onopen = () => send(socket, "ai-company-connect", "connect", { minProtocol: 4, maxProtocol: 4, client: { id: "webchat-ui", displayName: "AI Company", version: "1.0.0", platform: navigator.platform, mode: "webchat" }, role: "operator", scopes: ["operator.read"], caps: [], locale: navigator.language, userAgent: navigator.userAgent, auth: {} });
      socket.onmessage = (event) => {
        let frame: { type?: string; id?: string; ok?: boolean; event?: string; error?: { message?: string } };
        try { frame = JSON.parse(String(event.data)); } catch { return; }
        if (frame.type === "res" && frame.id === "ai-company-connect") {
          setConnected(frame.ok === true);
          if (frame.ok) { retry = 0; setError(""); void requestSessions().catch(() => undefined); }
          else setError(frame.error?.message || "OpenClaw Gateway 연결을 거부했습니다.");
        } else if (frame.type === "event" && /session|agent|chat/i.test(frame.event || "")) void requestSessions().catch(() => undefined);
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        setConnected(false);
        if (!stopped) reconnectTimer = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++));
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => { stopped = true; window.clearTimeout(reconnectTimer); socketRef.current?.close(); refreshSessionsRef.current = () => undefined; };
  }, [openSession]);

  useEffect(() => {
    if (!projectMenuId) return;
    const dismiss = (event: PointerEvent) => { if (!(event.target as Element).closest("[data-project-menu], [aria-label$='프로젝트 메뉴']")) setProjectMenuId(""); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [projectMenuId]);

  useEffect(() => {
    if (!directoryDialogKey) return;
    let cancelled = false;
    const query = directoryBrowserPath ? `?path=${encodeURIComponent(directoryBrowserPath)}` : "";
    void fetch(`/api/openclaw/directories${query}`).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "폴더를 읽지 못했습니다.");
      if (cancelled) return;
      setDirectoryError("");
      setDirectoryBrowserPath(body.path || "");
      setDirectoryParent(body.parent || null);
      setDirectoryEntries(body.entries || []);
    }).catch((reason: unknown) => { if (!cancelled) setDirectoryError(reason instanceof Error ? reason.message : "폴더를 읽지 못했습니다."); }).finally(() => { if (!cancelled) setDirectoryLoading(false); });
    return () => { cancelled = true; };
  }, [directoryDialogKey, directoryBrowserPath]);

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !connected) return;
    setMessages((current) => [...current, { id: newId(), role: "user", name: "You", text }]);
    const key = sessionKey;
    const historyVersion = historyRequestRef.current;
    void (async () => {
      if (activeProjectId) await fetch("/api/openclaw/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "linkSession", id: activeProjectId, sessionKey: key }) });
      const response = await fetch("/api/company/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, sessionKey: key, model, thinking: fastMode ? "low" : thinking, attachments }) });
      if (!response.ok) { setError((await response.json().catch(() => null))?.error || "메시지를 전달하지 못했습니다."); return; }
      const before = messages.length;
      for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        if (historyVersion !== historyRequestRef.current || key !== sessionKeyRef.current) return;
        const result = await loadHistory(key);
        setMessages(result.messages); setUsage(result.usage);
        if (result.messages.length > before && result.messages.at(-1)?.role === "assistant") break;
      }
      if (historyVersion === historyRequestRef.current) { void refreshModelData(key); void refreshSessionsRef.current(); }
    })().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "메시지를 전달하지 못했습니다."));
    setMessage("");
    setAttachments([]);
    setNewChatSetup(false);
  };
  const slashQuery = message.startsWith("/") ? message.split(/\s/, 1)[0].toLowerCase() : "";
  const commandMatches = slashQuery ? commands.filter(([name]) => name.startsWith(slashQuery)) : [];
  const skillPrefix = slashQuery === "/skill" ? "" : slashQuery.slice(1);
  const skillMatches = slashQuery.startsWith("/") && (slashQuery.length > 1) ? skills.filter((skill) => skill.name.startsWith(skillPrefix) || `/${skill.name}`.startsWith(slashQuery)).slice(0, 8) : [];
  const selectSlash = (value: string) => setMessage(`${value} `);
  const projectGroups = projects.map((project) => ({ id: project.id, title: project.name, sessions: sessions.filter((item) => item.projectId === project.id), project })).sort((a, b) => sortPinned ? Number(Boolean(b.project.pinned)) - Number(Boolean(a.project.pinned)) : 0);
  const recentSessions = sessions.filter((item) => !projects.some((project) => project.id === item.projectId)).sort((a, b) => sortPinned ? Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) : 0).slice(0, 12);
  const archivedProjectGroups = projectGroups.filter((group) => group.project?.section === "보관된 프로젝트");
  const createDraft = () => { const key = `agent:${selectedAgent}:web:${crypto.randomUUID()}`; sessionKeyRef.current = key; historyRequestRef.current++; setSessionKey(key); setMessages([]); setUsage({ input: 0, output: 0, cost: 0 }); setNewChatSetup(true); setMobileMenuOpen(false); setActiveProjectId(""); localStorage.setItem("ai-company-chat.session", key); history.replaceState(null, "", `/?session=${encodeURIComponent(key)}`); };
  const archiveSession = async (key: string) => { const response = await fetch("/api/openclaw/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "archive", sessionKey: key }) }); if (!response.ok) return notify("세션을 보관하지 못했습니다."); refreshSessionsRef.current(); if (key === sessionKey) setError("현재 세션이 보관되었습니다."); };
  const pinSession = async (key: string, pinned: boolean) => { const response = await fetch("/api/openclaw/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "pin", sessionKey: key, pinned }) }); if (!response.ok) return notify("세션 고정 상태를 바꾸지 못했습니다."); void refreshSessionsRef.current(); };
  const projectAction = async (action: string, project: Project | undefined) => {
    if (!project) return;
    setProjectMenuId("");
    if (action === "edit") { setDirectoryLoading(true); setDirectoryError(""); setDirectoryBrowserPath(project.directory); setProjectDialog({ id: project.id, name: project.name, directory: project.directory }); return; }
    if (action === "remove" && !window.confirm(`“${project.name}” 프로젝트 항목만 제거합니다. 폴더와 대화 기록은 삭제되지 않습니다. 계속할까요?`)) return;
    const response = await fetch("/api/openclaw/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id: project.id, pinned: action === "pin" ? !project.pinned : undefined, section: action === "section" ? project.section === "보관된 프로젝트" ? "프로젝트" : "보관된 프로젝트" : undefined }) });
    const body = await response.json().catch(() => null);
    if (!response.ok) return notify(body?.error || "프로젝트 작업을 완료하지 못했습니다.");
    setProjects(body.projects || []);
    if (action === "archive") void refreshSessionsRef.current();
    if (action === "reveal") notify("M1 Mac Finder에서 프로젝트 폴더를 열었습니다.");
  };
  const saveProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectDialog) return;
    const response = await fetch("/api/openclaw/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: projectDialog.id ? "update" : "create", ...projectDialog }) });
    const body = await response.json().catch(() => null);
    if (!response.ok) return setError(body?.error || "프로젝트를 저장하지 못했습니다.");
    setProjects(body.projects || []); setProjectDialog(null);
    if (!projectDialog.id && body.projects?.[0]) { createDraft(); setActiveProjectId(body.projects[0].id); }
  };

  return <div className={`${styles.app} ${mobileStyles.mobileLayout} ${theme === "light" ? styles.themeLight : ""} ${sidebarOpen ? "" : styles.appSidebarCollapsed} ${mobileMenuOpen ? mobileStyles.mobileSidebarOpen : ""}`} style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
    <aside className={styles.sidebar} data-mobile-sidebar>
      <div className={styles.brand}><span className={styles.brandMark}><Sparkles size={14} /></span><span className={styles.brandText}>AI Company</span><span className={styles.sidebarActions}><button aria-label="알림" onClick={() => notify("새 알림이 없습니다.")}><Bell size={14} /></button><button aria-label="검색" onClick={() => document.querySelector<HTMLInputElement>('[placeholder="Search chats"]')?.focus()}><Search size={14} /></button></span></div>
      <button className={styles.newChat} onClick={createDraft}><Plus size={14} />New chat</button>
      <label className={styles.search}><Search size={13} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" /></label>
      <button className={styles.workspace} onClick={() => setSettingsOpen(true)}><span><small>WORKSPACE</small><br />{workspaceDirectory || "M1 Gateway"}</span><ChevronDown size={15} /></button>
      <NavSection label="프로젝트"><div className={styles.sidebarSectionHeader}><span>프로젝트</span><span><button aria-label="프로젝트 정렬" title="고정 우선 정렬" onClick={() => setSortPinned((value) => !value)}><MoreHorizontal size={14} /></button><button aria-label="프로젝트 추가" onClick={() => { setDirectoryLoading(true); setDirectoryError(""); setDirectoryBrowserPath(workspaceDirectory); setProjectDialog({ name: "", directory: workspaceDirectory }); }}><Plus size={13} /></button></span></div><div className={styles.projectList}>{projectGroups.length ? projectGroups.filter((group) => group.project?.section !== "보관된 프로젝트").sort((a,b)=>sortPinned ? Number(Boolean(b.project?.pinned))-Number(Boolean(a.project?.pinned)) : 0).map((group) => <ProjectGroup key={group.id} id={group.id} title={group.title} sessions={group.sessions.filter((item) => `${group.title} ${item.displayName} ${item.key}`.toLowerCase().includes(search.toLowerCase()))} project={group.project} current={sessionKey} pinned={Boolean(group.project?.pinned)} menuOpen={projectMenuId === group.id} onOpen={openSession} onPin={pinSession} onArchive={archiveSession} onMenu={() => setProjectMenuId(projectMenuId === group.id ? "" : group.id)} onAction={projectAction} />) : <div className={liveStyles.emptyState}>프로젝트 없음</div>}</div></NavSection>
      {archivedProjectGroups.length > 0 && <NavSection label="보관된 프로젝트">{archivedProjectGroups.map((group) => <ProjectGroup key={group.id} id={group.id} title={group.title} sessions={group.sessions.filter((item) => `${group.title} ${item.displayName} ${item.key}`.toLowerCase().includes(search.toLowerCase()))} project={group.project} current={sessionKey} pinned={Boolean(group.project?.pinned)} menuOpen={projectMenuId === group.id} onOpen={openSession} onPin={pinSession} onArchive={archiveSession} onMenu={() => setProjectMenuId(projectMenuId === group.id ? "" : group.id)} onAction={projectAction} />)}</NavSection>}
      <NavSection label="최근"><div className={styles.sidebarSectionHeader}><span>최근</span><span><button aria-label="최근 정렬" onClick={() => setSortPinned((value) => !value)}><MoreHorizontal size={14} /></button><button aria-label="일반 세션 추가" onClick={createDraft}><Plus size={13} /></button></span></div><div className={styles.recentList}>{recentSessions.filter((item) => `${item.displayName} ${item.key}`.toLowerCase().includes(search.toLowerCase())).map((item) => <SessionNavItem key={item.key} item={item} active={item.key === sessionKey} onOpen={openSession} onPin={pinSession} onArchive={archiveSession} />)}{!sessionsLoading && recentSessions.length === 0 && <div className={liveStyles.emptyState}>대화 없음</div>}</div></NavSection>
      <NavSection label="Skills">{skills.slice(0, 8).map((skill) => <NavItem key={skill.name} onClick={() => selectSlash(`/skill ${skill.name}`)}><span className={styles.agentGlyph}>/</span>{skill.name}</NavItem>)}</NavSection>
      <div className={styles.profile}><span className={styles.avatar}>J</span><span><strong>junzzang</strong><br /><small>M1 local gateway</small></span></div>
    </aside>{mobileMenuOpen && <button className={mobileStyles.sidebarBackdrop} aria-label="사이드바 닫기" onClick={() => setMobileMenuOpen(false)} />}<div className={styles.sidebarResizeHandle} role="separator" aria-label="사이드바 너비 조절" onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (event.buttons === 1 && sidebarOpen) setSidebarWidth(Math.max(200, Math.min(420, event.clientX))); }} />
    <main className={styles.main}>
      <header className={styles.topbar} data-topbar><div className={styles.topbarLeft} data-topbar-left><button className={styles.iconButton} aria-label="사이드바" onClick={() => { if (matchMedia("(max-width: 640px)").matches) setMobileMenuOpen((open) => !open); else setSidebarOpen((open) => !open); }}>{mobileMenuOpen ? <X size={15} /> : sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</button><div className={styles.crumb} data-crumb><strong>AI Company</strong><span>/</span>{sessionTitle(sessionKey)}</div></div><div className={styles.topActions} data-top-actions><span className={styles.connection}><i className={connected ? mobileStyles.connected : mobileStyles.disconnected} />{connected ? "OpenClaw online" : "OpenClaw offline"}</span><button className={styles.iconButton} aria-label={theme === "light" ? "다크 모드" : "라이트 모드"} title={theme === "light" ? "다크 모드" : "라이트 모드"} onClick={toggleTheme}>{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</button><button className={styles.iconButton} aria-label="설정" onClick={() => setSettingsOpen(true)}><Settings size={15} /></button></div></header>
      <section className={styles.conversation} data-conversation>
        {newChatSetup && messages.length === 0 && <div className={styles.newChatSetup}><label>프로젝트<select value={activeProjectId} onChange={(event) => setActiveProjectId(event.target.value)}><option value="">프로젝트 없이 시작</option>{projects.filter((project) => project.section !== "보관된 프로젝트").map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>실행 위치<select><option>현재 M1 Gateway</option></select></label><label>설정 디렉터리<input value={projects.find((project) => project.id === activeProjectId)?.directory || workspaceDirectory} readOnly /></label></div>}
        <div className={styles.sessionHead} data-session-head><div><div className={styles.kicker}>{sessionKey.split(":")[1]?.toUpperCase() || "OPENCLAW"} SESSION</div><h1>{sessionTitle(sessionKey)}</h1><p>{connected ? `${gatewayAgents.length} agents · ${sessions.length} sessions` : "OpenClaw 연결 대기 중"}</p></div><span className={styles.runChip}>Ready</span></div>
        {messages.map((item) => <Message key={item.id} initial={item.role === "user" ? "J" : "C"} name={item.name} time="live" user={item.role === "user"}><MarkdownText text={item.text} /></Message>)}
        {error && <div className={styles.toast} role="alert" data-toast>{error}</div>}
        <Composer message={message} setMessage={setMessage} submit={submit} connected={connected} slashQuery={slashQuery} commandMatches={commandMatches} skillMatches={skillMatches} selectSlash={selectSlash} plusOpen={plusOpen} setPlusOpen={setPlusOpen} contextOpen={contextOpen} setContextOpen={setContextOpen} permissionOpen={permissionOpen} setPermissionOpen={setPermissionOpen} modelOpen={modelOpen} setModelOpen={setModelOpen} thinkingOpen={thinkingOpen} setThinkingOpen={setThinkingOpen} permissionMode={permissionMode} setPermissionMode={setPermissionMode} model={model} setModel={setModel} models={models} oauth={oauth} thinking={thinking} setThinking={setThinking} fastMode={fastMode} setFastMode={setFastMode} usage={usage} context={context} attachments={attachments} setAttachments={setAttachments} notify={notify} />
      </section>
    </main>
    <aside className={styles.inspector}><h2>Run overview</h2><Panel title="Agent pipeline">{pipeline.map((id) => <AgentRow key={id} id={id} agent={gatewayAgents.find((item) => item.id === id)} sessions={sessions} />)}</Panel><Panel title="Activity"><Timeline sessions={sessions} /></Panel><Panel title="Artifacts">{artifacts.map((artifact) => <button className={styles.report} key={artifact.path} onClick={() => void openArtifact(artifact.path)}><FileText size={13} />{artifact.path}</button>)}{artifacts.length === 0 && <div className={liveStyles.emptyState}>파일 없음</div>}</Panel></aside>
    <nav className={styles.mobileNav}><button className={styles.mobileActive} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><CircleDot size={17} />Chat</button><button onClick={() => notify(`${sessions.filter((item) => item.hasActiveRun).length}개 세션이 실행 중입니다.`)}><GitBranch size={17} />Run</button><button onClick={() => artifacts[0] && void openArtifact(artifacts[0].path)}><FolderOpen size={17} />Files</button></nav>
    {toast && <div className={styles.toast} role="status" data-toast>{toast}</div>}
    {projectDialog && <div className={mobileStyles.projectDialogBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setProjectDialog(null); }}><form className={mobileStyles.projectDialog} role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" onSubmit={saveProject}><header><div><small>PROJECT</small><h2 id="project-dialog-title">{projectDialog.id ? "프로젝트 편집" : "새 프로젝트"}</h2></div><button type="button" aria-label="닫기" onClick={() => setProjectDialog(null)}><X size={18} /></button></header><label>프로젝트 이름<input autoFocus required maxLength={80} value={projectDialog.name} onChange={(event) => setProjectDialog({ ...projectDialog, name: event.target.value })} placeholder="예: 회사 생존 테스트" /></label><label>설정 디렉터리 <small>현재 M1 Mac의 경로</small><input required value={projectDialog.directory} onChange={(event) => setProjectDialog({ ...projectDialog, directory: event.target.value })} placeholder="/Users/…/project" /><span className={mobileStyles.directoryHint}>Finder에서 복사한 절대 경로를 입력하거나 아래에서 폴더를 선택하세요.</span><div className={mobileStyles.directoryPicker}><div className={mobileStyles.directoryPickerBar}><button type="button" aria-label="상위 폴더" disabled={!directoryParent || directoryLoading} onClick={() => directoryParent && setDirectoryBrowserPath(directoryParent)}>↑</button><code>{directoryBrowserPath || "폴더를 불러오는 중…"}</code></div><div className={mobileStyles.directoryList} role="listbox" aria-label="폴더 목록">{directoryLoading ? <span className={mobileStyles.directoryState}>폴더를 읽는 중…</span> : directoryError ? <span className={mobileStyles.directoryState}>{directoryError}</span> : directoryEntries.length ? directoryEntries.map((entry) => <button type="button" role="option" aria-selected={entry.path === directoryBrowserPath} key={entry.path} onDoubleClick={() => setDirectoryBrowserPath(entry.path)} onClick={() => setDirectoryBrowserPath(entry.path)}>📁 <span>{entry.name}</span></button>) : <span className={mobileStyles.directoryState}>하위 폴더가 없습니다.</span>}</div><button type="button" className={mobileStyles.directorySelect} disabled={!directoryBrowserPath || directoryLoading || Boolean(directoryError)} onClick={() => setProjectDialog({ ...projectDialog, directory: directoryBrowserPath })}>이 폴더 선택</button></div></label><footer><button type="button" onClick={() => setProjectDialog(null)}>취소</button><button type="submit">{projectDialog.id ? "저장" : "프로젝트 만들기"}</button></footer></form></div>}
    {settingsOpen && <div className={liveStyles.modalBackdrop} role="presentation" onClick={() => setSettingsOpen(false)}><section className={liveStyles.settingsModal} role="dialog" aria-modal="true" aria-label="Gateway 설정" onClick={(event) => event.stopPropagation()}><header><strong>Live connection</strong><button className={styles.iconButton} onClick={() => setSettingsOpen(false)} aria-label="닫기">×</button></header><dl><dt>Status</dt><dd>{connected ? "Gateway online" : "Gateway offline"}</dd><dt>WebSocket</dt><dd>/api/gateway/ws</dd><dt>Session</dt><dd>{sessionKey || "새 대화"}</dd><dt>Repository</dt><dd>{workspaceDirectory}</dd></dl></section></div>}
    {artifactView && <div className={liveStyles.modalBackdrop} role="presentation" onClick={() => setArtifactView(null)}><section className={liveStyles.artifactModal} role="dialog" aria-modal="true" aria-label={artifactView.path} onClick={(event) => event.stopPropagation()}><header><strong>{artifactView.path}</strong><button className={styles.iconButton} onClick={() => setArtifactView(null)} aria-label="닫기">×</button></header><pre>{artifactView.content}</pre></section></div>}
  </div>;

  async function openArtifact(path: string) { const response = await fetch(`/api/company/artifacts?path=${encodeURIComponent(path)}`); const body = await response.json().catch(() => null); if (!response.ok) return setError(body?.error || "파일을 열지 못했습니다."); setArtifactView({ path, content: body.content || "" }); }
  async function refreshModelData(key: string) { const request = ++modelRequestRef.current; const response = await fetch(`/api/openclaw/models?sessionKey=${encodeURIComponent(key)}`); if (!response.ok || request !== modelRequestRef.current || key !== sessionKeyRef.current) return; const body = await response.json(); if (request !== modelRequestRef.current || key !== sessionKeyRef.current) return; setModels(body.models || []); setOauth(body.oauth || []); setContext(body.context || { usedTokens: 0, maxTokens: 0, remainingTokens: 0, percent: 0 }); if (body.selectedModel) setModel(String(body.selectedModel).replace(/^omniroute\//, "")); if (body.usage) setUsage(body.usage); }
}

async function loadArtifacts(): Promise<Artifact[]> { const response = await fetch("/api/company/artifacts"); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error || "아티팩트를 불러오지 못했습니다."); return body.artifacts || []; }
function newId() { return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2); }
function initialOf(value: string) { return value.slice(0, 1).toUpperCase(); }
function displayName(value: string) { return value.replace(/^./, (char) => char.toUpperCase()); }
function send(socket: WebSocket, id: string, method: string, params: unknown) { socket.send(JSON.stringify({ type: "req", id, method, params })); }
function extractText(value: unknown): string { if (typeof value === "string") return value; if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join("\n"); if (value && typeof value === "object") { const item = value as Record<string, unknown>; return extractText(item.text ?? item.content ?? item.message ?? item.value); } return ""; }
function NavSection({ label, children }: { label: string; children: React.ReactNode }) { return <section><div className={styles.navLabel}>{label}</div><div className={styles.navList}>{children}</div></section>; }
function NavItem({ children, active = false, href, onClick }: { children: React.ReactNode; active?: boolean; href?: string; onClick?: () => void }) { return href ? <a href={href} className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</a> : <button className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} onClick={onClick}>{children}</button>; }
function SessionNavItem({ item, active, onOpen, onPin, onArchive }: { item: GatewaySession; active: boolean; onOpen: (key: string) => void; onPin: (key: string, pinned: boolean) => void; onArchive: (key: string) => void }) { const key = item.key || ""; return <div className={`${styles.sessionRow} ${active ? styles.navItemActive : ""}`}><button className={styles.sessionOpen} onClick={() => onOpen(key)}><span className={styles.sessionAgent}>{item.agentId || "agent"}{item.pinned ? " · 고정" : ""}</span><span>{item.displayName || key}</span></button><span className={styles.sessionHoverActions}><button aria-label={item.pinned ? "채팅 고정 해제" : "채팅 고정"} onClick={(event) => { event.stopPropagation(); onPin(key, !item.pinned); }}><Pin size={12} /></button><button aria-label="채팅 보관" onClick={(event) => { event.stopPropagation(); onArchive(key); }}><Archive size={12} /></button></span></div>; }
function ProjectGroup({ title, sessions, project, current, pinned, menuOpen, onOpen, onPin, onArchive, onMenu, onAction }: { id: string; title: string; sessions: GatewaySession[]; project?: Project; current: string; pinned: boolean; menuOpen: boolean; onOpen: (key: string) => void; onPin: (key: string, pinned: boolean) => void; onArchive: (key: string) => void; onMenu: () => void; onAction: (action: string, project: Project | undefined) => void }) {
  const [sectionOpen, setSectionOpen] = useState(false);
  return <div className={styles.projectGroup}><div className={styles.projectHeading} data-project-heading><Folder size={14} /><span>{title}{pinned ? " · 고정" : ""}</span>{project && <button aria-label={`${title} 프로젝트 메뉴`} onClick={onMenu}><MoreHorizontal size={15} /></button>}</div>{menuOpen && project && <div className={mobileStyles.projectMenu} data-project-menu role="menu"><button role="menuitem" onClick={() => onAction("pin", project)}><Pin size={14} />{pinned ? "고정 해제" : "고정"}</button><button role="menuitem" onClick={() => onAction("edit", project)}>⚙ 편집</button><button role="menuitem" aria-expanded={sectionOpen} onClick={() => setSectionOpen((open) => !open)}>☷ 섹션 <span>›</span></button>{sectionOpen && <div className={mobileStyles.projectSubmenu}><button onClick={() => onAction("section", project)}>{project.section === "보관된 프로젝트" ? "프로젝트로 이동" : "보관된 프로젝트로 이동"}</button></div>}<button role="menuitem" onClick={() => onAction("reveal", project)}><FolderOpen size={14} />Finder에서 보기</button><hr /><button role="menuitem" onClick={() => onAction("archive", project)}><Archive size={14} />채팅 보관</button><button role="menuitem" onClick={() => onAction("remove", project)}><X size={14} />프로젝트 제거</button></div>}{sessions.slice(0, 12).map((item) => <SessionNavItem key={item.key} item={item} active={item.key === current} onOpen={onOpen} onPin={onPin} onArchive={onArchive} />)}{sessions.length === 0 && <div className={mobileStyles.projectEmpty}>대화가 없습니다</div>}</div>;
}
function Message({ initial, name, time, user = false, children }: { initial: string; name: string; time: string; user?: boolean; children: React.ReactNode }) { return <article className={`${styles.message} ${user ? styles.messageUser : ""}`}><div className={styles.messageAvatar}>{initial}</div><div className={styles.messageContent}><div className={styles.messageName}>{name}<span>{time}</span></div><div className={styles.messageBody} data-message-body>{children}</div></div></article>; }
type ComposerProps = { message: string; setMessage: (value: string) => void; submit: (event: FormEvent) => void; connected: boolean; slashQuery: string; commandMatches: readonly (readonly [string, string])[]; skillMatches: Skill[]; selectSlash: (value: string) => void; plusOpen: boolean; setPlusOpen: React.Dispatch<React.SetStateAction<boolean>>; contextOpen: boolean; setContextOpen: React.Dispatch<React.SetStateAction<boolean>>; permissionOpen: boolean; setPermissionOpen: React.Dispatch<React.SetStateAction<boolean>>; modelOpen: boolean; setModelOpen: React.Dispatch<React.SetStateAction<boolean>>; thinkingOpen: boolean; setThinkingOpen: React.Dispatch<React.SetStateAction<boolean>>; permissionMode: string; setPermissionMode: (value: string) => void; model: string; setModel: (value: string) => void; models: ModelOption[]; oauth: { provider: string; type: string; status: string; label?: string }[]; thinking: string; setThinking: (value: string) => void; fastMode: boolean; setFastMode: (value: boolean) => void; usage: Usage; context: ContextStats; attachments: Attachment[]; setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>; notify: (value: string) => void };
function Composer(props: ComposerProps) {
  const { message, setMessage, submit, connected, slashQuery, commandMatches, skillMatches, selectSlash, plusOpen, setPlusOpen, contextOpen, setContextOpen, permissionOpen, setPermissionOpen, modelOpen, setModelOpen, thinkingOpen, setThinkingOpen, permissionMode, setPermissionMode, model, setModel, models, oauth, thinking, setThinking, fastMode, setFastMode, usage, context, attachments, setAttachments, notify } = props;
  const [modelSearch, setModelSearch] = useState("");
  const closeMenus = () => { setPlusOpen(false); setContextOpen(false); setPermissionOpen(false); setModelOpen(false); setThinkingOpen(false); };
  useEffect(() => { if (!plusOpen && !contextOpen && !permissionOpen && !modelOpen && !thinkingOpen) return; const handleOutside = (event: MouseEvent) => { const target = event.target as Element; if (!target.closest('[class*="popover"]')) closeMenus(); }; document.addEventListener("mousedown", handleOutside); return () => document.removeEventListener("mousedown", handleOutside); }, [plusOpen, contextOpen, permissionOpen, modelOpen, thinkingOpen]);
  const formatTokens = (value: number) => value ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : "—";
  const oauthFor = (provider: string) => oauth.find((item) => item.provider === provider);
  const visibleModels = models.filter((item) => `${item.name} ${item.id} ${item.provider}`.toLowerCase().includes(modelSearch.toLowerCase()));
  const upload = async (file: File) => { const form = new FormData(); form.set("file", file); const response = await fetch("/api/company/upload", { method: "POST", body: form }); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error || "파일을 첨부하지 못했습니다."); setAttachments((current) => [...current, { name: file.name, path: body.path }]); };
  const chooseFiles = (accept: string, capture = false) => { const input = document.createElement("input"); input.type = "file"; input.accept = accept; input.multiple = !capture; if (capture) input.setAttribute("capture", "environment"); input.onchange = () => { void Promise.all(Array.from(input.files || []).map(upload)).catch((reason: unknown) => notify(reason instanceof Error ? reason.message : "파일을 첨부하지 못했습니다.")); }; input.click(); };
  return <form className={styles.composer} data-composer onSubmit={submit}>
    {slashQuery && (commandMatches.length > 0 || skillMatches.length > 0) && <div className={styles.commandPalette}><div className={styles.paletteTitle}>{skillMatches.length > 0 ? "Skills · 스킬" : "Commands · 명령어"}</div>{skillMatches.length > 0 ? skillMatches.map((skill) => <button type="button" className={styles.paletteItem} key={skill.name} onClick={() => selectSlash(`/skill ${skill.name}`)}><strong>/{skill.name}</strong><span>{skill.source} · {skill.descriptionKo}</span><small>{skill.description}</small></button>) : commandMatches.map(([name, description]) => <button type="button" className={styles.paletteItem} key={name} onClick={() => selectSlash(name)}><strong>{name}</strong><span>{description}</span></button>)}</div>}
    {permissionOpen && <div className={`${styles.popover} ${styles.permissionPopover}`}><header><strong>실행 권한</strong><span>자세히 알아보기</span></header>{[["standard", "기본값 (전체 액세스)", "에이전트에 설정된 실행 권한을 따릅니다.", "✓"], ["readonly", "읽기 전용", "세션 루트 내에서 읽을 수 있지만, 쓰거나 명령을 실행할 수 없습니다.", "2"], ["protected", "보호 모드", "세션 루트 범위를 벗어나는 요청은 사람이 검토합니다.", "3"], ["workspace", "작업 공간", "세션 루트 범위를 벗어나는 요청은 AI 검토자가 확인합니다.", "4"], ["full", "전체 액세스", "검토자 없이 파일 접근과 명령 실행을 제한 없이 허용합니다.", "5"]].map(([value, title, description, mark]) => <button type="button" className={`${styles.permissionItem} ${permissionMode === value ? styles.permissionSelected : ""}`} key={value} onClick={() => { setPermissionMode(value); setPermissionOpen(false); }}><span className={styles.permissionIcon}>◉</span><span><b>{title}</b><small>{description}</small></span><em>{permissionMode === value ? "✓" : mark}</em></button>)}</div>}
    {modelOpen && <div className={`${styles.popover} ${styles.modelPopover}`}><div className={styles.modelSearch}>⌕ <input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder="모델 검색" /></div>{visibleModels.length ? visibleModels.map((item) => <button type="button" className={`${styles.modelItem} ${model === item.id.replace(/^omniroute\//, "") ? styles.modelSelected : ""}`} key={item.id} onClick={() => { setModel(item.id.replace(/^omniroute\//, "")); setModelOpen(false); }}><b>{item.name}</b><span>{item.contextWindow ? formatTokens(item.contextWindow) : "한도 확인 중"} · {oauthFor(item.provider)?.status === "ok" ? "OAuth 연결됨" : item.provider === "omniroute" ? "API 연결됨" : "설정됨"}</span>{model === item.id.replace(/^omniroute\//, "") && <em>✓</em>}</button>) : <div className={styles.modelEmpty}>검색 결과가 없습니다.</div>}</div>}
    {thinkingOpen && <div className={`${styles.popover} ${styles.thinkingPopover}`}><header><strong>추론 수준</strong><b>{fastMode ? "Fast" : thinking === "low" ? "Low" : thinking === "high" ? "High" : "Medium"}</b></header><input type="range" min="0" max="2" value={thinking === "low" ? 0 : thinking === "high" ? 2 : 1} disabled={fastMode} onChange={(event) => setThinking(["low", "medium", "high"][Number(event.target.value)])} /><div className={styles.rangeLabels}><span>더 빠르게</span><span>더 똑똑하게</span></div><label className={styles.fastRow}><strong>⚡ 빠른 모드</strong><span>낮은 추론 수준으로 빠르게 실행합니다.</span><input type="checkbox" checked={fastMode} onChange={(event) => setFastMode(event.target.checked)} /></label></div>}
    {contextOpen && <div className={`${styles.popover} ${styles.contextPopover}`}><div className={styles.contextHeader}><strong>컨텍스트 창</strong><b>{formatTokens(context.usedTokens)} / {formatTokens(context.maxTokens)} · {context.maxTokens ? `${context.percent}% 사용` : "확인 중"}</b></div><div className={styles.contextBar}><i style={{ width: `${context.percent}%` }} /></div><div className={styles.contextRemaining} title="API 잔액이 아닌 현재 세션 컨텍스트 창의 잔여량입니다."><span>남은 컨텍스트</span><b>{context.maxTokens ? formatTokens(context.remainingTokens) : "세션을 선택하면 표시됩니다"}</b></div><hr /><div className={styles.contextRun}><strong>최근 실행 토큰</strong><span>입력 <b>{formatTokens(usage.input)}</b> · 출력 <b>{formatTokens(usage.output)}</b> · 예상 비용 <b>${usage.cost.toFixed(2)}</b></span></div></div>}
    {plusOpen && <div className={`${styles.popover} ${styles.plusMenu}`}><button type="button" onClick={() => { setPlusOpen(false); chooseFiles("image/*", true); }}><Camera size={17} />사진 촬영</button><button type="button" onClick={() => { setPlusOpen(false); chooseFiles("image/*"); }}><Image size={17} />사진</button><button type="button" onClick={() => { setPlusOpen(false); chooseFiles("*/*"); }}><Upload size={17} />파일</button><hr /><button type="button" onClick={() => { setPlusOpen(false); setMessage("/skill "); }}><Wrench size={17} />Skills <span>›</span></button><button type="button" onClick={() => notify("현재 연결된 커넥터가 없습니다.")}><Paperclip size={17} />커넥터 <small>0</small><span>›</span></button><button type="button" onClick={() => { setPlusOpen(false); setMessage("웹 검색을 사용해서 "); }}><Globe size={17} />웹검색</button><hr /><button type="button" onClick={() => { setPlusOpen(false); setMessage("/plugins "); }}><Wrench size={17} />플러그인 관리</button></div>}
    {attachments.length > 0 && <div className={styles.attachments}>{attachments.map((file) => <span key={file.path}>{file.name}<button type="button" aria-label={`${file.name} 첨부 제거`} onClick={() => setAttachments((current) => current.filter((item) => item.path !== file.path))}>×</button></span>)}</div>}
    <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event as unknown as FormEvent); } }} placeholder={connected ? "메시지를 입력하세요… / 명령어 또는 /skill 입력" : "OpenClaw 연결을 기다리는 중…"} rows={2} disabled={!connected} />
    <div className={styles.composerFooter}><span>Enter 전송 · Shift + Enter 줄바꿈</span><div className={styles.composerControls} data-composer-controls><button type="button" className={styles.attach} data-attach aria-label="추가 메뉴" onClick={() => { closeMenus(); setPlusOpen(true); }}>＋</button><button type="button" className={styles.permissionButton} onClick={() => { closeMenus(); setPermissionOpen(true); }}>◉ {permissionMode === "full" ? "전체 액세스" : permissionMode === "readonly" ? "읽기 전용" : "기본값 (전체 액세스)"}</button><button type="button" className={styles.toolbarButton} onClick={() => { closeMenus(); setModelOpen(true); }}>{model || "모델"}⌄</button><button type="button" className={styles.toolbarButton} onClick={() => { closeMenus(); setThinkingOpen(true); }}>{thinking === "low" ? "Low" : thinking === "high" ? "High" : "Medium"}⌄</button><button type="button" className={styles.contextButton} aria-label={`컨텍스트 ${context.percent}% 사용`} title={context.maxTokens ? `${formatTokens(context.usedTokens)} / ${formatTokens(context.maxTokens)} · ${context.percent}%` : "컨텍스트 정보 없음"} onClick={() => { closeMenus(); setContextOpen(true); }}><i style={{ "--context-progress": `${context.percent * 3.6}deg` } as React.CSSProperties} /></button><button className={styles.send} data-send disabled={!connected || !message.trim()}><Send size={15} /></button></div></div>
  </form>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.panel}><div className={styles.panelTitle}>{title}</div>{children}</section>; }
function AgentRow({ id, agent, sessions }: { id: string; agent?: GatewayAgent; sessions: GatewaySession[] }) { const latest = sessions.find((item) => item.agentId === id); const running = sessions.some((item) => item.agentId === id && item.hasActiveRun); const status = running ? "Running" : latest?.status === "failed" ? "Needs attention" : latest ? "Ready" : "No session"; return <div className={styles.agent}><span className={styles.agentIcon}>{initialOf(id)}</span><div><div>{agent?.name || id}</div><small>{status} · {agent?.model?.primary || "configured"}</small></div><span className={running ? styles.statusWorking : latest?.status === "failed" ? liveStyles.statusFailed : styles.status} /></div>; }
function Timeline({ sessions }: { sessions: GatewaySession[] }) { const recent = sessions.slice(0, 3); return <div className={styles.timeline}>{recent.map((item) => <div className={`${styles.event} ${item.hasActiveRun ? styles.eventWorking : styles.eventDone}`} key={item.key}><i /><span>{item.displayName || item.agentId || "Session"}<small>{item.hasActiveRun ? "running" : item.status || "updated"}</small></span></div>)}{recent.length === 0 && <div className={liveStyles.emptyState}>활동 기록 없음</div>}</div>; }

function sessionTitle(key: string) { return key.includes("company-survival-test") ? "오늘의 회사 생존 테스트" : key.split(":").slice(2).join(":") || "새 대화"; }
async function loadHistory(key: string): Promise<{ messages: MessageItem[]; usage: Usage }> { const response = await fetch(`/api/openclaw/sessions?sessionKey=${encodeURIComponent(key)}`); if (!response.ok) throw new Error("대화를 불러오지 못했습니다."); const body = await response.json(); const agent = displayName(key.split(":")[1] || "openclaw"); const messages = (body.messages || []).map((item: { role?: string; content?: string }, index: number) => ({ id: `history-${index}`, role: item.role === "user" ? "user" : "assistant", name: item.role === "user" ? "You" : agent, text: item.content || "" })).filter((item: MessageItem) => item.text).reduce((merged: MessageItem[], item: MessageItem) => { const previous = merged.at(-1); if (previous?.role === item.role) previous.text += `\n\n${item.text}`; else merged.push({ ...item }); return merged; }, []); return { messages, usage: body.usage || { input: 0, output: 0, cost: 0 } }; }

function MarkdownText({ text }: { text: string }) {
  const lines = text.replaceAll("\r", "").split("\n");
  const blocks: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index++;
      blocks.push(<pre className={styles.markdownCode} key={`code-${index}`}><code data-language={language || undefined}>{code.join("\n")}</code></pre>);
      continue;
    }
    if (index + 1 < lines.length && line.includes("|") && isTableSeparator(lines[index + 1])) {
      const header = parseTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) rows.push(parseTableRow(lines[index++]));
      blocks.push(<div className={styles.markdownTableWrap} key={`table-${index}`}><table className={styles.markdownTable}><thead><tr>{header.map((cell, cellIndex) => <th key={cellIndex}>{inlineMarkdown(cell, `table-head-${index}-${cellIndex}`)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{header.map((_, cellIndex) => <td key={cellIndex}>{inlineMarkdown(row[cellIndex] || "", `table-cell-${index}-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) { blocks.push(<h3 className={styles.markdownHeading} key={`heading-${index}`}>{inlineMarkdown(heading[2], `heading-${index}`)}</h3>); index++; continue; }
    if (/^([-*])\s+/.test(line)) { const items: string[] = []; while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(lines[index++].replace(/^[-*]\s+/, "")); blocks.push(<ul className={styles.markdownList} key={`ul-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `ul-${index}-${itemIndex}`)}</li>)}</ul>); continue; }
    if (/^\d+\.\s+/.test(line)) { const items: string[] = []; while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\d+\.\s+/, "")); blocks.push(<ol className={styles.markdownList} key={`ol-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `ol-${index}-${itemIndex}`)}</li>)}</ol>); continue; }
    if (/^>\s?/.test(line)) { const quote: string[] = []; while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, "")); blocks.push(<blockquote className={styles.markdownQuote} key={`quote-${index}`}>{quote.map((item, itemIndex) => <div key={itemIndex}>{inlineMarkdown(item, `quote-${index}-${itemIndex}`)}</div>)}</blockquote>); continue; }
    if (/^---+$/.test(line.trim())) { blocks.push(<hr className={styles.markdownRule} key={`rule-${index}`} />); index++; continue; }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^```|^#{1,6}\s+|^[-*]\s+|^\d+\.\s+|^>\s?|^---+$/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={`paragraph-${index}`}>{inlineMarkdown(paragraph.join(" "), `paragraph-${index}`)}</p>);
  }
  return <div className={styles.markdown}>{blocks}</div>;
}

function parseTableRow(line: string) { return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()); }
function isTableSeparator(line: string) { const cells = parseTableRow(line); return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell)); }
function inlineMarkdown(value: string, keyPrefix: string) { const parts = value.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).filter(Boolean); return parts.map((part, index) => { const key = `${keyPrefix}-${index}`; if (/^\*\*.+\*\*$|^__.+__$/.test(part)) return <strong key={key}>{part.slice(2, -2)}</strong>; if (/^\*.+\*$|^_.+_$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>; if (/^`.+`$/.test(part)) return <code className={styles.markdownInlineCode} key={key}>{part.slice(1, -1)}</code>; const link = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part); if (link) return <a href={link[2]} target="_blank" rel="noreferrer" key={key}>{link[1]}</a>; return <span key={key}>{part}</span>; }); }
