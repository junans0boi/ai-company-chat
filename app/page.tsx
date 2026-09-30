"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, CircleDot, FileText, FolderOpen, GitBranch, PanelLeftClose, PanelLeftOpen, Paperclip, Plus, Search, Send, Settings, Sparkles } from "lucide-react";
import styles from "./CompanyConsole.module.css";
import liveStyles from "./LiveConsole.module.css";

const pipeline = ["ceo", "architect", "developer", "reviewer"] as const;
type GatewayAgent = { id?: string; name?: string; model?: { primary?: string } };
type GatewaySession = { key?: string; displayName?: string; projectId?: string | null; lastMessagePreview?: string; agentId?: string; updatedAt?: number | null; status?: string; hasActiveRun?: boolean };
type Artifact = { path: string; size: number; updatedAt: number };
type MessageItem = { id: string; role: "user" | "assistant"; name: string; text: string };
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

  useEffect(() => {
    const requestSessions = () => { void fetch("/api/openclaw/sessions").then(async (response) => { if (!response.ok) throw new Error("OpenClaw 세션을 불러오지 못했습니다."); const body = await response.json(); const listed = (body.sessions || []) as GatewaySession[]; setSessions(listed); setGatewayAgents(Array.from(new Map(listed.filter((item) => item.agentId).map((item) => [item.agentId as string, { id: item.agentId, name: item.agentId } as GatewayAgent])).values())); setConnected(true); setSessionsLoading(false); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "OpenClaw 연결 오류")); };
    refreshSessionsRef.current = requestSessions;
    requestSessions();
    void fetch("/api/openclaw/skills").then((response) => response.json()).then((body) => setSkills(body.skills || [])).catch(() => undefined);
    void loadHistory(sessionKeyRef.current).then(setMessages).catch(() => undefined);
    const interval = window.setInterval(requestSessions, 10_000);
    void loadArtifacts().then(setArtifacts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "아티팩트를 불러오지 못했습니다."));
    return () => { window.clearInterval(interval); refreshSessionsRef.current = () => undefined; };
  }, []);

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const openSession = (key: string) => {
    sessionKeyRef.current = key;
    setSessionKey(key);
    void loadHistory(key).then(setMessages).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "대화를 불러오지 못했습니다."));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !connected) return;
    setMessages((current) => [...current, { id: newId(), role: "user", name: "You", text }]);
    void fetch("/api/company/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, sessionKey }) }).then(async (response) => { if (!response.ok) setError((await response.json().catch(() => null))?.error || "메시지를 전달하지 못했습니다."); window.setTimeout(() => { void loadHistory(sessionKey).then(setMessages); refreshSessionsRef.current(); }, 1200); });
    setMessage("");
  };
  const slashQuery = message.startsWith("/") ? message.split(/\s/, 1)[0].toLowerCase() : "";
  const commandMatches = slashQuery ? commands.filter(([name]) => name.startsWith(slashQuery)) : [];
  const skillPrefix = slashQuery === "/skill" ? "" : slashQuery.slice(1);
  const skillMatches = slashQuery.startsWith("/") && (slashQuery.length > 1) ? skills.filter((skill) => skill.name.startsWith(skillPrefix) || `/${skill.name}`.startsWith(slashQuery)).slice(0, 8) : [];
  const selectSlash = (value: string) => setMessage(`${value} `);

  return <div className={`${styles.app} ${sidebarOpen ? "" : styles.appSidebarCollapsed}`} style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><span className={styles.brandMark}><Sparkles size={14} /></span><span className={styles.brandText}>AI Company</span></div>
      <button className={styles.newChat} onClick={() => { const key = `agent:${selectedAgent}:web:${crypto.randomUUID()}`; openSession(key); setMessages([]); }}><Plus size={14} />New chat</button>
      <label className={styles.search}><Search size={13} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" /></label>
      <button className={styles.workspace} onClick={() => setSettingsOpen(true)}><span><small>WORKSPACE</small><br />/backup/workspace/ai-company-chat</span><ChevronDown size={15} /></button>
      <NavSection label="Projects"><NavItem active={sessionKey.includes("company-survival-test")} onClick={() => openSession("agent:ceo:company-survival-test")}><span className={styles.projectDot} />오늘의 회사 생존 테스트</NavItem></NavSection>
      <NavSection label="Chats">{sessions.filter((item) => !item.projectId && `${item.displayName} ${item.key}`.toLowerCase().includes(search.toLowerCase())).slice(0, 20).map((item) => <NavItem key={item.key} active={item.key === sessionKey} onClick={() => item.key && openSession(item.key)}>{item.displayName || item.key}</NavItem>)}{!sessionsLoading && sessions.filter((item) => !item.projectId).length === 0 && <div className={liveStyles.emptyState}>대화 없음</div>}</NavSection>
      <NavSection label="Skills">{skills.slice(0, 8).map((skill) => <NavItem key={skill.name} onClick={() => selectSlash(`/skill ${skill.name}`)}><span className={styles.agentGlyph}>/</span>{skill.name}</NavItem>)}</NavSection>
      <div className={styles.profile}><span className={styles.avatar}>J</span><span><strong>junzzang</strong><br /><small>M1 local gateway</small></span></div>
    </aside><div className={styles.sidebarResizeHandle} role="separator" aria-label="사이드바 너비 조절" onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (event.buttons === 1 && sidebarOpen) setSidebarWidth(Math.max(200, Math.min(420, event.clientX))); }} />
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.topbarLeft}><button className={styles.iconButton} aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</button><div className={styles.crumb}><strong>AI Company</strong><span>/</span>{sessionTitle(sessionKey)}</div></div><div className={styles.topActions}><span className={styles.connection}><i />{connected ? "OpenClaw online" : "OpenClaw offline"}</span><button className={styles.iconButton} aria-label="설정" onClick={() => setSettingsOpen(true)}><Settings size={15} /></button></div></header>
      <section className={styles.conversation}>
        <div className={styles.sessionHead}><div><div className={styles.kicker}>{sessionKey.split(":")[1]?.toUpperCase() || "OPENCLAW"} SESSION</div><h1>{sessionTitle(sessionKey)}</h1><p>{connected ? `${gatewayAgents.length} agents · ${sessions.length} sessions` : "OpenClaw 연결 대기 중"}</p></div><span className={styles.runChip}>Ready</span></div>
        {messages.length === 0 && connected && <Message initial="C" name="CEO" time="now">Gateway에 연결되었습니다. 아래 입력창에서 실제 CEO 에이전트에게 요구사항을 보내세요.</Message>}
        {messages.map((item) => <Message key={item.id} initial={item.role === "user" ? "J" : "C"} name={item.name} time="live" user={item.role === "user"}>{item.text}</Message>)}
        {error && <div className={styles.toast} role="alert">{error}</div>}
        <form className={styles.composer} onSubmit={submit}>{slashQuery && (commandMatches.length > 0 || skillMatches.length > 0) && <div className={styles.commandPalette}><div className={styles.paletteTitle}>{skillMatches.length > 0 ? "Skills · 스킬" : "Commands · 명령어"}</div>{skillMatches.length > 0 ? skillMatches.map((skill) => <button type="button" className={styles.paletteItem} key={skill.name} onClick={() => selectSlash(`/skill ${skill.name}`)}><strong>/{skill.name}</strong><span>{skill.source} · {skill.descriptionKo}</span><small>{skill.description}</small></button>) : commandMatches.map(([name, description]) => <button type="button" className={styles.paletteItem} key={name} onClick={() => selectSlash(name)}><strong>{name}</strong><span>{description}</span></button>)}</div>}<textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event as unknown as FormEvent); } }} placeholder={connected ? "CEO에게 다음 작업을 요청하세요… / 명령어 또는 /skill 입력" : "OpenClaw 연결을 기다리는 중…"} rows={2} disabled={!connected} /><div className={styles.composerFooter}><span>Enter 전송 · Shift + Enter 줄바꿈</span><div><button type="button" className={styles.attach} aria-label="첨부"><Paperclip size={14} /></button><button className={styles.send} disabled={!connected || !message.trim()}>Send <Send size={13} /></button></div></div></form>
      </section>
    </main>
    <aside className={styles.inspector}><h2>Run overview</h2><Panel title="Agent pipeline">{pipeline.map((id) => <AgentRow key={id} id={id} agent={gatewayAgents.find((item) => item.id === id)} sessions={sessions} />)}</Panel><Panel title="Activity"><Timeline sessions={sessions} /></Panel><Panel title="Artifacts">{artifacts.map((artifact) => <button className={styles.report} key={artifact.path} onClick={() => void openArtifact(artifact.path)}><FileText size={13} />{artifact.path}</button>)}{artifacts.length === 0 && <div className={liveStyles.emptyState}>파일 없음</div>}</Panel></aside>
    <nav className={styles.mobileNav}><button className={styles.mobileActive} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><CircleDot size={17} />Chat</button><button onClick={() => notify(`${sessions.filter((item) => item.hasActiveRun).length}개 세션이 실행 중입니다.`)}><GitBranch size={17} />Run</button><button onClick={() => artifacts[0] && void openArtifact(artifacts[0].path)}><FolderOpen size={17} />Files</button></nav>
    {toast && <div className={styles.toast} role="status">{toast}</div>}
    {settingsOpen && <div className={liveStyles.modalBackdrop} role="presentation" onClick={() => setSettingsOpen(false)}><section className={liveStyles.settingsModal} role="dialog" aria-modal="true" aria-label="Gateway 설정" onClick={(event) => event.stopPropagation()}><header><strong>Live connection</strong><button className={styles.iconButton} onClick={() => setSettingsOpen(false)} aria-label="닫기">×</button></header><dl><dt>Status</dt><dd>{connected ? "Gateway online" : "Gateway offline"}</dd><dt>WebSocket</dt><dd>/api/gateway/ws</dd><dt>Session</dt><dd>{sessionKey}</dd><dt>Repository</dt><dd>/Users/junzzang/backup/workspace/ai-company-chat</dd></dl></section></div>}
    {artifactView && <div className={liveStyles.modalBackdrop} role="presentation" onClick={() => setArtifactView(null)}><section className={liveStyles.artifactModal} role="dialog" aria-modal="true" aria-label={artifactView.path} onClick={(event) => event.stopPropagation()}><header><strong>{artifactView.path}</strong><button className={styles.iconButton} onClick={() => setArtifactView(null)} aria-label="닫기">×</button></header><pre>{artifactView.content}</pre></section></div>}
  </div>;

  async function openArtifact(path: string) { const response = await fetch(`/api/company/artifacts?path=${encodeURIComponent(path)}`); const body = await response.json().catch(() => null); if (!response.ok) return setError(body?.error || "파일을 열지 못했습니다."); setArtifactView({ path, content: body.content || "" }); }
}

async function loadArtifacts(): Promise<Artifact[]> { const response = await fetch("/api/company/artifacts"); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error || "아티팩트를 불러오지 못했습니다."); return body.artifacts || []; }
function newId() { return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2); }
function initialOf(value: string) { return value.slice(0, 1).toUpperCase(); }
function displayName(value: string) { return value.replace(/^./, (char) => char.toUpperCase()); }
function send(socket: WebSocket, id: string, method: string, params: unknown) { socket.send(JSON.stringify({ type: "req", id, method, params })); }
function extractText(value: unknown): string { if (typeof value === "string") return value; if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join("\n"); if (value && typeof value === "object") { const item = value as Record<string, unknown>; return extractText(item.text ?? item.content ?? item.message ?? item.value); } return ""; }
function NavSection({ label, children }: { label: string; children: React.ReactNode }) { return <section><div className={styles.navLabel}>{label}</div><div className={styles.navList}>{children}</div></section>; }
function NavItem({ children, active = false, href, onClick }: { children: React.ReactNode; active?: boolean; href?: string; onClick?: () => void }) { return href ? <a href={href} className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</a> : <button className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} onClick={onClick}>{children}</button>; }
function Message({ initial, name, time, user = false, children }: { initial: string; name: string; time: string; user?: boolean; children: React.ReactNode }) { return <article className={`${styles.message} ${user ? styles.messageUser : ""}`}><div className={styles.messageAvatar}>{initial}</div><div><div className={styles.messageName}>{name}<span>{time}</span></div><div className={styles.messageBody}>{children}</div></div></article>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.panel}><div className={styles.panelTitle}>{title}</div>{children}</section>; }
function AgentRow({ id, agent, sessions }: { id: string; agent?: GatewayAgent; sessions: GatewaySession[] }) { const latest = sessions.find((item) => item.agentId === id); const running = sessions.some((item) => item.agentId === id && item.hasActiveRun); const status = running ? "Running" : latest?.status === "failed" ? "Needs attention" : latest ? "Ready" : "No session"; return <div className={styles.agent}><span className={styles.agentIcon}>{initialOf(id)}</span><div><div>{agent?.name || id}</div><small>{status} · {agent?.model?.primary || "configured"}</small></div><span className={running ? styles.statusWorking : latest?.status === "failed" ? liveStyles.statusFailed : styles.status} /></div>; }
function Timeline({ sessions }: { sessions: GatewaySession[] }) { const recent = sessions.slice(0, 3); return <div className={styles.timeline}>{recent.map((item) => <div className={`${styles.event} ${item.hasActiveRun ? styles.eventWorking : styles.eventDone}`} key={item.key}><i /><span>{item.displayName || item.agentId || "Session"}<small>{item.hasActiveRun ? "running" : item.status || "updated"}</small></span></div>)}{recent.length === 0 && <div className={liveStyles.emptyState}>활동 기록 없음</div>}</div>; }

function sessionTitle(key: string) { return key.includes("company-survival-test") ? "오늘의 회사 생존 테스트" : key.split(":").slice(2).join(":") || "새 대화"; }
async function loadHistory(key: string): Promise<MessageItem[]> { const response = await fetch(`/api/openclaw/sessions?sessionKey=${encodeURIComponent(key)}`); if (!response.ok) throw new Error("대화를 불러오지 못했습니다."); const body = await response.json(); const agent = displayName(key.split(":")[1] || "openclaw"); return (body.messages || []).map((item: { role?: string; content?: string }, index: number) => ({ id: `history-${index}`, role: item.role === "user" ? "user" : "assistant", name: item.role === "user" ? "You" : agent, text: item.content || "" })).filter((item: MessageItem) => item.text); }
