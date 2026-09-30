"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Archive, Bell, Camera, ChevronDown, CircleDot, FileText, Folder, FolderOpen, GitBranch, Globe, Image, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Paperclip, Pin, Plus, Search, Send, Settings, Sparkles, Upload, Wrench } from "lucide-react";
import styles from "./CompanyConsole.module.css";
import liveStyles from "./LiveConsole.module.css";

const pipeline = ["ceo", "architect", "developer", "reviewer"] as const;
type GatewayAgent = { id?: string; name?: string; model?: { primary?: string } };
type GatewaySession = { key?: string; displayName?: string; projectId?: string | null; lastMessagePreview?: string; agentId?: string; updatedAt?: number | null; status?: string; hasActiveRun?: boolean };
type Artifact = { path: string; size: number; updatedAt: number };
type MessageItem = { id: string; role: "user" | "assistant"; name: string; text: string };
type Usage = { input: number; output: number; cost: number };
type ModelOption = { id: string; name: string; provider: string; contextWindow: number; available: boolean; reasoning: boolean; input?: unknown };
type ContextStats = { usedTokens: number; maxTokens: number; remainingTokens: number; percent: number };
type Attachment = { name: string; path: string };
type Skill = { name: string; source: string; description: string; descriptionKo: string };
const commands = [
  ["/stop", "현재 실행 중인 작업 중지"], ["/reset", "현재 세션 초기화"], ["/new", "새 세션 시작"], ["/compact", "세션 컨텍스트 압축"], ["/name", "현재 세션 이름 변경"], ["/clear", "채팅 기록 지우기"], ["/session", "세션 설정과 수명주기 관리"], ["/think", "추론 수준 설정"], ["/model", "모델 확인 또는 변경"], ["/verbose", "빠른 모드 전환"], ["/reasoning", "추론 표시 전환"], ["/models", "사용 가능한 모델 목록"], ["/trace", "플러그인 trace 표시 전환"], ["/elevated", "권한 수준 설정"], ["/exec", "실행 기본값 설정"], ["/queue", "메시지 큐 설정"], ["/help", "사용 가능한 명령어 보기"], ["/status", "현재 상태 보기"], ["/openclaw", "OpenClaw 설정 및 복구 도우미"], ["/export-session", "현재 세션을 HTML로 내보내기"], ["/export-trajectory", "현재 세션 trajectory 내보내기"], ["/tools", "실행 도구 목록"], ["/skill", "스킬 실행"],
] as const;

export default function CompanyPage() {
  const socketRef = useRef<WebSocket | null>(null);
  const sessionKeyRef = useRef("agent:ceo:company-survival-test");
  const refreshSessionsRef = useRef<() => void>(() => undefined);
  const [connected, setConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sessionKey, setSessionKey] = useState(sessionKeyRef.current);
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

  useEffect(() => {
    const requestSessions = () => { void fetch("/api/openclaw/sessions").then(async (response) => { if (!response.ok) throw new Error("OpenClaw 세션을 불러오지 못했습니다."); const body = await response.json(); const listed = (body.sessions || []) as GatewaySession[]; setSessions(listed); setGatewayAgents(Array.from(new Map(listed.filter((item) => item.agentId).map((item) => [item.agentId as string, { id: item.agentId, name: item.agentId } as GatewayAgent])).values())); setConnected(true); setSessionsLoading(false); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "OpenClaw 연결 오류")); };
    refreshSessionsRef.current = requestSessions;
    requestSessions();
    void fetch("/api/openclaw/skills").then((response) => response.json()).then((body) => setSkills(body.skills || [])).catch(() => undefined);
    void refreshModelData(sessionKeyRef.current);
    void loadHistory(sessionKeyRef.current).then((result) => { setMessages(result.messages); setUsage(result.usage); }).catch(() => undefined);
    const interval = window.setInterval(requestSessions, 10_000);
    void loadArtifacts().then(setArtifacts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "아티팩트를 불러오지 못했습니다."));
    return () => { window.clearInterval(interval); refreshSessionsRef.current = () => undefined; };
  }, []);

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const openSession = (key: string) => {
    sessionKeyRef.current = key;
    setSessionKey(key);
    setNewChatSetup(false);
    void refreshModelData(key);
    void loadHistory(key).then((result) => { setMessages(result.messages); setUsage(result.usage); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "대화를 불러오지 못했습니다."));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !connected) return;
    setMessages((current) => [...current, { id: newId(), role: "user", name: "You", text }]);
    void fetch("/api/company/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, sessionKey, model, thinking: fastMode ? "low" : thinking, attachments }) }).then(async (response) => { if (!response.ok) setError((await response.json().catch(() => null))?.error || "메시지를 전달하지 못했습니다."); window.setTimeout(() => { void loadHistory(sessionKey).then((result) => { setMessages(result.messages); setUsage(result.usage); }); void refreshModelData(sessionKey); refreshSessionsRef.current(); }, 1200); });
    setMessage("");
    setAttachments([]);
    setNewChatSetup(false);
  };
  const slashQuery = message.startsWith("/") ? message.split(/\s/, 1)[0].toLowerCase() : "";
  const commandMatches = slashQuery ? commands.filter(([name]) => name.startsWith(slashQuery)) : [];
  const skillPrefix = slashQuery === "/skill" ? "" : slashQuery.slice(1);
  const skillMatches = slashQuery.startsWith("/") && (slashQuery.length > 1) ? skills.filter((skill) => skill.name.startsWith(skillPrefix) || `/${skill.name}`.startsWith(slashQuery)).slice(0, 8) : [];
  const selectSlash = (value: string) => setMessage(`${value} `);
  const projectSessions = sessions.filter((item) => item.projectId || item.key?.includes("company-survival-test"));
  const recentSessions = sessions.filter((item) => !projectSessions.includes(item)).slice(0, 12);
  const archiveSession = async (key: string) => { const response = await fetch("/api/openclaw/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "archive", sessionKey: key }) }); if (!response.ok) return notify("세션을 보관하지 못했습니다."); refreshSessionsRef.current(); if (key === sessionKey) setError("현재 세션이 보관되었습니다."); };
  const pinSession = async (key: string, pinned: boolean) => { const response = await fetch("/api/openclaw/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "pin", sessionKey: key, pinned }) }); if (!response.ok) return notify("세션 고정 상태를 바꾸지 못했습니다."); refreshSessionsRef.current(); };

  return <div className={`${styles.app} ${sidebarOpen ? "" : styles.appSidebarCollapsed}`} style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><span className={styles.brandMark}><Sparkles size={14} /></span><span className={styles.brandText}>AI Company</span><span className={styles.sidebarActions}><button aria-label="알림" onClick={() => notify("새 알림이 없습니다.")}><Bell size={14} /></button><button aria-label="검색" onClick={() => document.querySelector<HTMLInputElement>(".search input")?.focus()}><Search size={14} /></button></span></div>
      <button className={styles.newChat} onClick={() => { const key = `agent:${selectedAgent}:web:${crypto.randomUUID()}`; sessionKeyRef.current = key; setSessionKey(key); setMessages([]); setNewChatSetup(true); }}><Plus size={14} />New chat</button>
      <label className={styles.search}><Search size={13} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" /></label>
      <button className={styles.workspace} onClick={() => setSettingsOpen(true)}><span><small>WORKSPACE</small><br />/backup/workspace/ai-company-chat</span><ChevronDown size={15} /></button>
      <NavSection label="프로젝트"><div className={styles.sidebarSectionHeader}><span>프로젝트</span><span><button aria-label="프로젝트 메뉴" onClick={() => notify("프로젝트 메뉴: 고정 · 편집 · 섹션 · Finder에서 보기 · 보관")}>•••</button><button aria-label="프로젝트 추가" onClick={() => notify("새 프로젝트는 New chat에서 생성할 수 있습니다.")}><Plus size={13} /></button></span></div><div className={styles.projectList}>{projectSessions.length ? <ProjectGroup title="오늘의 회사 생존 테스트" sessions={projectSessions} current={sessionKey} onOpen={openSession} onPin={pinSession} onArchive={archiveSession} /> : <div className={liveStyles.emptyState}>프로젝트 없음</div>}</div></NavSection>
      <NavSection label="최근"><div className={styles.sidebarSectionHeader}><span>최근</span><span><button aria-label="최근 메뉴" onClick={() => notify("최근 세션 메뉴")}>•••</button><button aria-label="일반 세션 추가" onClick={() => { const key = `agent:${selectedAgent}:web:${crypto.randomUUID()}`; openSession(key); setMessages([]); setNewChatSetup(true); }}><Plus size={13} /></button></span></div><div className={styles.recentList}>{recentSessions.filter((item) => `${item.displayName} ${item.key}`.toLowerCase().includes(search.toLowerCase())).map((item) => <SessionNavItem key={item.key} item={item} active={item.key === sessionKey} onOpen={openSession} onPin={pinSession} onArchive={archiveSession} />)}{!sessionsLoading && recentSessions.length === 0 && <div className={liveStyles.emptyState}>대화 없음</div>}</div></NavSection>
      <NavSection label="Skills">{skills.slice(0, 8).map((skill) => <NavItem key={skill.name} onClick={() => selectSlash(`/skill ${skill.name}`)}><span className={styles.agentGlyph}>/</span>{skill.name}</NavItem>)}</NavSection>
      <div className={styles.profile}><span className={styles.avatar}>J</span><span><strong>junzzang</strong><br /><small>M1 local gateway</small></span></div>
    </aside><div className={styles.sidebarResizeHandle} role="separator" aria-label="사이드바 너비 조절" onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (event.buttons === 1 && sidebarOpen) setSidebarWidth(Math.max(200, Math.min(420, event.clientX))); }} />
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.topbarLeft}><button className={styles.iconButton} aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</button><div className={styles.crumb}><strong>AI Company</strong><span>/</span>{sessionTitle(sessionKey)}</div></div><div className={styles.topActions}><span className={styles.connection}><i />{connected ? "OpenClaw online" : "OpenClaw offline"}</span><button className={styles.iconButton} aria-label="설정" onClick={() => setSettingsOpen(true)}><Settings size={15} /></button></div></header>
      <section className={styles.conversation}>
        {newChatSetup && messages.length === 0 && <div className={styles.newChatSetup}><label>프로젝트<select><option>AI Company</option><option>오늘의 회사 생존 테스트</option></select></label><label>실행 위치<select><option>로컬</option><option>원격 Gateway</option></select></label><label>Git branch<select><option>main</option></select></label></div>}
        <div className={styles.sessionHead}><div><div className={styles.kicker}>{sessionKey.split(":")[1]?.toUpperCase() || "OPENCLAW"} SESSION</div><h1>{sessionTitle(sessionKey)}</h1><p>{connected ? `${gatewayAgents.length} agents · ${sessions.length} sessions` : "OpenClaw 연결 대기 중"}</p></div><span className={styles.runChip}>Ready</span></div>
        {messages.length === 0 && connected && <Message initial="C" name="CEO" time="now">Gateway에 연결되었습니다. 아래 입력창에서 실제 CEO 에이전트에게 요구사항을 보내세요.</Message>}
        {messages.map((item) => <Message key={item.id} initial={item.role === "user" ? "J" : "C"} name={item.name} time="live" user={item.role === "user"}>{item.text}</Message>)}
        {error && <div className={styles.toast} role="alert">{error}</div>}
        <Composer message={message} setMessage={setMessage} submit={submit} connected={connected} slashQuery={slashQuery} commandMatches={commandMatches} skillMatches={skillMatches} selectSlash={selectSlash} plusOpen={plusOpen} setPlusOpen={setPlusOpen} contextOpen={contextOpen} setContextOpen={setContextOpen} permissionOpen={permissionOpen} setPermissionOpen={setPermissionOpen} modelOpen={modelOpen} setModelOpen={setModelOpen} thinkingOpen={thinkingOpen} setThinkingOpen={setThinkingOpen} permissionMode={permissionMode} setPermissionMode={setPermissionMode} model={model} setModel={setModel} models={models} oauth={oauth} thinking={thinking} setThinking={setThinking} fastMode={fastMode} setFastMode={setFastMode} usage={usage} context={context} attachments={attachments} setAttachments={setAttachments} notify={notify} />
      </section>
    </main>
    <aside className={styles.inspector}><h2>Run overview</h2><Panel title="Agent pipeline">{pipeline.map((id) => <AgentRow key={id} id={id} agent={gatewayAgents.find((item) => item.id === id)} sessions={sessions} />)}</Panel><Panel title="Activity"><Timeline sessions={sessions} /></Panel><Panel title="Artifacts">{artifacts.map((artifact) => <button className={styles.report} key={artifact.path} onClick={() => void openArtifact(artifact.path)}><FileText size={13} />{artifact.path}</button>)}{artifacts.length === 0 && <div className={liveStyles.emptyState}>파일 없음</div>}</Panel></aside>
    <nav className={styles.mobileNav}><button className={styles.mobileActive} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><CircleDot size={17} />Chat</button><button onClick={() => notify(`${sessions.filter((item) => item.hasActiveRun).length}개 세션이 실행 중입니다.`)}><GitBranch size={17} />Run</button><button onClick={() => artifacts[0] && void openArtifact(artifacts[0].path)}><FolderOpen size={17} />Files</button></nav>
    {toast && <div className={styles.toast} role="status">{toast}</div>}
    {settingsOpen && <div className={liveStyles.modalBackdrop} role="presentation" onClick={() => setSettingsOpen(false)}><section className={liveStyles.settingsModal} role="dialog" aria-modal="true" aria-label="Gateway 설정" onClick={(event) => event.stopPropagation()}><header><strong>Live connection</strong><button className={styles.iconButton} onClick={() => setSettingsOpen(false)} aria-label="닫기">×</button></header><dl><dt>Status</dt><dd>{connected ? "Gateway online" : "Gateway offline"}</dd><dt>WebSocket</dt><dd>/api/gateway/ws</dd><dt>Session</dt><dd>{sessionKey}</dd><dt>Repository</dt><dd>/Users/junzzang/backup/workspace/ai-company-chat</dd></dl></section></div>}
    {artifactView && <div className={liveStyles.modalBackdrop} role="presentation" onClick={() => setArtifactView(null)}><section className={liveStyles.artifactModal} role="dialog" aria-modal="true" aria-label={artifactView.path} onClick={(event) => event.stopPropagation()}><header><strong>{artifactView.path}</strong><button className={styles.iconButton} onClick={() => setArtifactView(null)} aria-label="닫기">×</button></header><pre>{artifactView.content}</pre></section></div>}
  </div>;

  async function openArtifact(path: string) { const response = await fetch(`/api/company/artifacts?path=${encodeURIComponent(path)}`); const body = await response.json().catch(() => null); if (!response.ok) return setError(body?.error || "파일을 열지 못했습니다."); setArtifactView({ path, content: body.content || "" }); }
  async function refreshModelData(key: string) { const response = await fetch(`/api/openclaw/models?sessionKey=${encodeURIComponent(key)}`); if (!response.ok) return; const body = await response.json(); setModels(body.models || []); setOauth(body.oauth || []); setContext(body.context || { usedTokens: 0, maxTokens: 0, remainingTokens: 0, percent: 0 }); if (body.selectedModel) setModel(String(body.selectedModel).replace(/^omniroute\//, "")); if (body.usage) setUsage(body.usage); }
}

async function loadArtifacts(): Promise<Artifact[]> { const response = await fetch("/api/company/artifacts"); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error || "아티팩트를 불러오지 못했습니다."); return body.artifacts || []; }
function newId() { return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2); }
function initialOf(value: string) { return value.slice(0, 1).toUpperCase(); }
function displayName(value: string) { return value.replace(/^./, (char) => char.toUpperCase()); }
function send(socket: WebSocket, id: string, method: string, params: unknown) { socket.send(JSON.stringify({ type: "req", id, method, params })); }
function extractText(value: unknown): string { if (typeof value === "string") return value; if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join("\n"); if (value && typeof value === "object") { const item = value as Record<string, unknown>; return extractText(item.text ?? item.content ?? item.message ?? item.value); } return ""; }
function NavSection({ label, children }: { label: string; children: React.ReactNode }) { return <section><div className={styles.navLabel}>{label}</div><div className={styles.navList}>{children}</div></section>; }
function NavItem({ children, active = false, href, onClick }: { children: React.ReactNode; active?: boolean; href?: string; onClick?: () => void }) { return href ? <a href={href} className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</a> : <button className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} onClick={onClick}>{children}</button>; }
function SessionNavItem({ item, active, onOpen, onPin, onArchive }: { item: GatewaySession; active: boolean; onOpen: (key: string) => void; onPin: (key: string, pinned: boolean) => void; onArchive: (key: string) => void }) { const key = item.key || ""; return <div className={`${styles.sessionRow} ${active ? styles.navItemActive : ""}`}><button className={styles.sessionOpen} onClick={() => onOpen(key)}><span className={styles.sessionAgent}>{item.agentId || "agent"}</span><span>{item.displayName || key}</span></button><span className={styles.sessionHoverActions}><button aria-label="채팅 고정" onClick={(event) => { event.stopPropagation(); onPin(key, true); }}><Pin size={12} /></button><button aria-label="채팅 보관" onClick={(event) => { event.stopPropagation(); onArchive(key); }}><Archive size={12} /></button></span></div>; }
function ProjectGroup({ title, sessions, current, onOpen, onPin, onArchive }: { title: string; sessions: GatewaySession[]; current: string; onOpen: (key: string) => void; onPin: (key: string, pinned: boolean) => void; onArchive: (key: string) => void }) { return <div className={styles.projectGroup}><div className={styles.projectHeading}><Folder size={14} /><span>{title}</span></div>{sessions.slice(0, 12).map((item) => <SessionNavItem key={item.key} item={item} active={item.key === current} onOpen={onOpen} onPin={onPin} onArchive={onArchive} />)}</div>; }
function Message({ initial, name, time, user = false, children }: { initial: string; name: string; time: string; user?: boolean; children: React.ReactNode }) { return <article className={`${styles.message} ${user ? styles.messageUser : ""}`}><div className={styles.messageAvatar}>{initial}</div><div><div className={styles.messageName}>{name}<span>{time}</span></div><div className={styles.messageBody}>{children}</div></div></article>; }
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
  return <form className={styles.composer} onSubmit={submit}>
    {slashQuery && (commandMatches.length > 0 || skillMatches.length > 0) && <div className={styles.commandPalette}><div className={styles.paletteTitle}>{skillMatches.length > 0 ? "Skills · 스킬" : "Commands · 명령어"}</div>{skillMatches.length > 0 ? skillMatches.map((skill) => <button type="button" className={styles.paletteItem} key={skill.name} onClick={() => selectSlash(`/skill ${skill.name}`)}><strong>/{skill.name}</strong><span>{skill.source} · {skill.descriptionKo}</span><small>{skill.description}</small></button>) : commandMatches.map(([name, description]) => <button type="button" className={styles.paletteItem} key={name} onClick={() => selectSlash(name)}><strong>{name}</strong><span>{description}</span></button>)}</div>}
    {permissionOpen && <div className={`${styles.popover} ${styles.permissionPopover}`}><header><strong>실행 권한</strong><span>자세히 알아보기</span></header>{[["standard", "기본값 (전체 액세스)", "에이전트에 설정된 실행 권한을 따릅니다.", "✓"], ["readonly", "읽기 전용", "세션 루트 내에서 읽을 수 있지만, 쓰거나 명령을 실행할 수 없습니다.", "2"], ["protected", "보호 모드", "세션 루트 범위를 벗어나는 요청은 사람이 검토합니다.", "3"], ["workspace", "작업 공간", "세션 루트 범위를 벗어나는 요청은 AI 검토자가 확인합니다.", "4"], ["full", "전체 액세스", "검토자 없이 파일 접근과 명령 실행을 제한 없이 허용합니다.", "5"]].map(([value, title, description, mark]) => <button type="button" className={`${styles.permissionItem} ${permissionMode === value ? styles.permissionSelected : ""}`} key={value} onClick={() => { setPermissionMode(value); setPermissionOpen(false); }}><span className={styles.permissionIcon}>◉</span><span><b>{title}</b><small>{description}</small></span><em>{permissionMode === value ? "✓" : mark}</em></button>)}</div>}
    {modelOpen && <div className={`${styles.popover} ${styles.modelPopover}`}><div className={styles.modelSearch}>⌕ <input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder="모델 검색" /></div>{visibleModels.length ? visibleModels.map((item) => <button type="button" className={`${styles.modelItem} ${model === item.id.replace(/^omniroute\//, "") ? styles.modelSelected : ""}`} key={item.id} onClick={() => { setModel(item.id.replace(/^omniroute\//, "")); setModelOpen(false); }}><b>{item.name}</b><span>{item.contextWindow ? formatTokens(item.contextWindow) : "한도 확인 중"} · {oauthFor(item.provider)?.status === "ok" ? "OAuth 연결됨" : item.provider === "omniroute" ? "API 연결됨" : "설정됨"}</span>{model === item.id.replace(/^omniroute\//, "") && <em>✓</em>}</button>) : <div className={styles.modelEmpty}>검색 결과가 없습니다.</div>}</div>}
    {thinkingOpen && <div className={`${styles.popover} ${styles.thinkingPopover}`}><header><strong>추론 수준</strong><b>{fastMode ? "Fast" : thinking === "low" ? "Low" : thinking === "high" ? "High" : "Medium"}</b></header><input type="range" min="0" max="2" value={thinking === "low" ? 0 : thinking === "high" ? 2 : 1} disabled={fastMode} onChange={(event) => setThinking(["low", "medium", "high"][Number(event.target.value)])} /><div className={styles.rangeLabels}><span>더 빠르게</span><span>더 똑똑하게</span></div><label className={styles.fastRow}><strong>⚡ 빠른 모드</strong><span>낮은 추론 수준으로 빠르게 실행합니다.</span><input type="checkbox" checked={fastMode} onChange={(event) => setFastMode(event.target.checked)} /></label></div>}
    {contextOpen && <div className={`${styles.popover} ${styles.contextPopover}`}><div className={styles.contextHeader}><strong>컨텍스트 창</strong><b>{formatTokens(context.usedTokens)} / {formatTokens(context.maxTokens)} · {context.maxTokens ? `${context.percent}%` : "—"}</b></div><div className={styles.contextBar}><i style={{ width: `${context.percent}%` }} /></div><hr /><div className={styles.contextRun}><strong>남은 컨텍스트</strong><span><b>{formatTokens(context.remainingTokens)}</b></span><strong>최근 실행 토큰</strong><span>입력 <b>{formatTokens(usage.input)}</b> · 출력 <b>{formatTokens(usage.output)}</b> · 예상 비용 <b>${usage.cost.toFixed(2)}</b></span></div></div>}
    {plusOpen && <div className={`${styles.popover} ${styles.plusMenu}`}><button type="button" onClick={() => { setPlusOpen(false); chooseFiles("image/*", true); }}><Camera size={17} />사진 촬영</button><button type="button" onClick={() => { setPlusOpen(false); chooseFiles("image/*"); }}><Image size={17} />사진</button><button type="button" onClick={() => { setPlusOpen(false); chooseFiles("*/*"); }}><Upload size={17} />파일</button><hr /><button type="button" onClick={() => { setPlusOpen(false); setMessage("/skill "); }}><Wrench size={17} />Skills <span>›</span></button><button type="button" onClick={() => notify("현재 연결된 커넥터가 없습니다.")}><Paperclip size={17} />커넥터 <small>0</small><span>›</span></button><button type="button" onClick={() => { setPlusOpen(false); setMessage("웹 검색을 사용해서 "); }}><Globe size={17} />웹검색</button><hr /><button type="button" onClick={() => { setPlusOpen(false); setMessage("/plugins "); }}><Wrench size={17} />플러그인 관리</button></div>}
    {attachments.length > 0 && <div className={styles.attachments}>{attachments.map((file) => <span key={file.path}>{file.name}<button type="button" aria-label={`${file.name} 첨부 제거`} onClick={() => setAttachments((current) => current.filter((item) => item.path !== file.path))}>×</button></span>)}</div>}
    <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event as unknown as FormEvent); } }} placeholder={connected ? "메시지를 입력하세요… / 명령어 또는 /skill 입력" : "OpenClaw 연결을 기다리는 중…"} rows={2} disabled={!connected} />
    <div className={styles.composerFooter}><span>Enter 전송 · Shift + Enter 줄바꿈</span><div className={styles.composerControls}><button type="button" className={styles.attach} aria-label="추가 메뉴" onClick={() => { closeMenus(); setPlusOpen(true); }}>＋</button><button type="button" className={styles.permissionButton} onClick={() => { closeMenus(); setPermissionOpen(true); }}>◉ {permissionMode === "full" ? "전체 액세스" : permissionMode === "readonly" ? "읽기 전용" : "기본값 (전체 액세스)"}</button><button type="button" className={styles.toolbarButton} onClick={() => { closeMenus(); setModelOpen(true); }}>{model || "모델"}⌄</button><button type="button" className={styles.toolbarButton} onClick={() => { closeMenus(); setThinkingOpen(true); }}>{thinking === "low" ? "Low" : thinking === "high" ? "High" : "Medium"}⌄</button><button type="button" className={styles.contextButton} aria-label={`컨텍스트 ${context.percent}% 사용`} title={context.maxTokens ? `${formatTokens(context.usedTokens)} / ${formatTokens(context.maxTokens)} · ${context.percent}%` : "컨텍스트 정보 없음"} onClick={() => { closeMenus(); setContextOpen(true); }}><i style={{ "--context-progress": `${context.percent * 3.6}deg` } as React.CSSProperties} /></button><button className={styles.send} disabled={!connected || !message.trim()}><Send size={15} /></button></div></div>
  </form>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.panel}><div className={styles.panelTitle}>{title}</div>{children}</section>; }
function AgentRow({ id, agent, sessions }: { id: string; agent?: GatewayAgent; sessions: GatewaySession[] }) { const latest = sessions.find((item) => item.agentId === id); const running = sessions.some((item) => item.agentId === id && item.hasActiveRun); const status = running ? "Running" : latest?.status === "failed" ? "Needs attention" : latest ? "Ready" : "No session"; return <div className={styles.agent}><span className={styles.agentIcon}>{initialOf(id)}</span><div><div>{agent?.name || id}</div><small>{status} · {agent?.model?.primary || "configured"}</small></div><span className={running ? styles.statusWorking : latest?.status === "failed" ? liveStyles.statusFailed : styles.status} /></div>; }
function Timeline({ sessions }: { sessions: GatewaySession[] }) { const recent = sessions.slice(0, 3); return <div className={styles.timeline}>{recent.map((item) => <div className={`${styles.event} ${item.hasActiveRun ? styles.eventWorking : styles.eventDone}`} key={item.key}><i /><span>{item.displayName || item.agentId || "Session"}<small>{item.hasActiveRun ? "running" : item.status || "updated"}</small></span></div>)}{recent.length === 0 && <div className={liveStyles.emptyState}>활동 기록 없음</div>}</div>; }

function sessionTitle(key: string) { return key.includes("company-survival-test") ? "오늘의 회사 생존 테스트" : key.split(":").slice(2).join(":") || "새 대화"; }
async function loadHistory(key: string): Promise<{ messages: MessageItem[]; usage: Usage }> { const response = await fetch(`/api/openclaw/sessions?sessionKey=${encodeURIComponent(key)}`); if (!response.ok) throw new Error("대화를 불러오지 못했습니다."); const body = await response.json(); const agent = displayName(key.split(":")[1] || "openclaw"); return { messages: (body.messages || []).map((item: { role?: string; content?: string }, index: number) => ({ id: `history-${index}`, role: item.role === "user" ? "user" : "assistant", name: item.role === "user" ? "You" : agent, text: item.content || "" })).filter((item: MessageItem) => item.text), usage: body.usage || { input: 0, output: 0, cost: 0 } }; }
