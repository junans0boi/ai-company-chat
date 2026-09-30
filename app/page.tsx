"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CircleDot, FileText, FolderOpen, GitBranch, Paperclip, Send, Settings, Sparkles } from "lucide-react";
import styles from "./CompanyConsole.module.css";
import liveStyles from "./LiveConsole.module.css";

const pipeline = ["ceo", "architect", "developer", "reviewer"] as const;
type GatewayAgent = { id?: string; name?: string; model?: { primary?: string } };
type GatewaySession = { key?: string; displayName?: string; derivedTitle?: string; lastMessagePreview?: string; agentId?: string; updatedAt?: number | null; unread?: boolean; status?: string; hasActiveRun?: boolean; isBackground?: boolean };
type Artifact = { path: string; size: number; updatedAt: number };
type MessageItem = { id: string; role: "user" | "assistant"; name: string; text: string };

export default function CompanyPage() {
  const socketRef = useRef<WebSocket | null>(null);
  const sessionKeyRef = useRef("agent:ceo:company-survival-test");
  const refreshSessionsRef = useRef<() => void>(() => undefined);
  const [connected, setConnected] = useState(false);
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sessionKey, setSessionKey] = useState(sessionKeyRef.current);
  const [gatewayAgents, setGatewayAgents] = useState<GatewayAgent[]>([]);
  const [sessions, setSessions] = useState<GatewaySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactView, setArtifactView] = useState<{ path: string; content: string } | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/gateway/ws`);
    socketRef.current = socket;
    const requestSessions = () => {
      if (socket.readyState === WebSocket.OPEN) send(socket, `sessions-${newId()}`, "sessions.list", { limit: 40, includeLastMessage: true, configuredAgentsOnly: true, sortBy: "activity" });
    };
    refreshSessionsRef.current = requestSessions;
    socket.onopen = () => socket.send(JSON.stringify({ type: "req", id: "connect", method: "connect", params: { minProtocol: 3, maxProtocol: 4, client: { id: "openclaw-control-ui", version: "ai-company-chat", mode: "webchat", platform: "web" }, role: "operator", scopes: ["operator.read"] } }));
    socket.onmessage = (event) => {
      const frame = JSON.parse(String(event.data));
      if (frame.type === "event" && frame.event === "connect.challenge") return;
      if (frame.type === "res" && frame.id === "connect") {
        if (!frame.ok) return setError(frame.error?.message || "Gateway 연결 실패");
        setConnected(true);
        send(socket, "agents", "agents.list", {});
        send(socket, "history", "chat.history", { sessionKey: sessionKeyRef.current, limit: 80 });
        requestSessions();
      }
      if (frame.type === "res" && frame.id === "agents" && frame.ok) {
        const listedAgents = Array.isArray(frame.payload?.agents) ? frame.payload.agents : [];
        setGatewayAgents(listedAgents);
        const ceo = listedAgents.find((agent: GatewayAgent) => agent.id === "ceo")?.id || "ceo";
        const nextKey = `agent:${ceo}:company-survival-test`;
        sessionKeyRef.current = nextKey;
        setSessionKey(nextKey);
        send(socket, "history", "chat.history", { sessionKey: nextKey, limit: 80 });
      }
      if (frame.type === "res" && typeof frame.id === "string" && frame.id.startsWith("sessions-") && frame.ok) {
        setSessions(Array.isArray(frame.payload?.sessions) ? frame.payload.sessions : []);
        setSessionsLoading(false);
      }
      if (frame.type === "res" && frame.id === "history" && frame.ok) {
        const agentName = displayName(sessionKeyRef.current.split(":")[1] || "agent");
        const history = (frame.payload?.messages || []).map((item: { role?: string; content?: unknown }, index: number) => {
          const role = item.role === "user" ? "user" : item.role === "assistant" ? "assistant" : null;
          const text = extractText(item.content);
          return role && text ? { id: `history-${index}`, role, name: role === "user" ? "You" : agentName, text } : null;
        }).filter(Boolean) as MessageItem[];
        setMessages(history);
      }
      if (frame.type === "event" && frame.event === "chat" && frame.payload?.sessionKey === sessionKeyRef.current && frame.payload?.state === "final") {
        const text = extractText(frame.payload.message);
        if (text) setMessages((current) => [...current, { id: newId(), role: "assistant", name: displayName(sessionKeyRef.current.split(":")[1] || "agent"), text }]);
        window.setTimeout(() => refreshSessionsRef.current(), 500);
      }
    };
    socket.onerror = () => setError("Gateway 연결 오류");
    socket.onclose = () => setConnected(false);
<<<<<<< HEAD
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
=======
    const interval = window.setInterval(requestSessions, 10_000);
    void loadArtifacts().then(setArtifacts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "아티팩트를 불러오지 못했습니다."));
    return () => { window.clearInterval(interval); refreshSessionsRef.current = () => undefined; socket.close(); };
>>>>>>> 288d254 (feat: connect console panels to live gateway data)
  }, []);

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const approve = () => {
    void fetch("/api/company/approve", { method: "POST" }).then(async (response) => {
      if (!response.ok) return setError((await response.json().catch(() => null))?.error || "팀 가동에 실패했습니다.");
      setApproved(true); notify("승인 완료 · CEO 작업 재개 지시 전송"); refreshSessionsRef.current();
    });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !connected) return;
    setMessages((current) => [...current, { id: newId(), role: "user", name: "You", text }]);
    void fetch("/api/company/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, sessionKey }) }).then(async (response) => { if (!response.ok) setError((await response.json().catch(() => null))?.error || "CEO에게 메시지를 전달하지 못했습니다."); });
    setMessage("");
  };

  return <div className={styles.app}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><span className={styles.brandMark}><Sparkles size={14} /></span>AI Company</div>
      <button className={styles.workspace}><span><small>WORKSPACE</small><br />/backup/workspace/ai-company-chat</span><ChevronDown size={15} /></button>
      <NavSection label="Projects"><NavItem active href="/company/quiz"><span className={styles.projectDot} />오늘의 회사 생존 테스트</NavItem><NavItem active={connected}><span className={styles.projectDotMuted} />AI Company Console</NavItem><NavItem><span className={styles.projectDotMuted} />Claw3D</NavItem></NavSection>
      <NavSection label="Recent sessions">{sessions.filter((item) => !item.isBackground).slice(0, 5).map((item) => <NavItem key={item.key}>{item.derivedTitle || item.displayName || item.key || "이름 없는 세션"}</NavItem>)}{!sessionsLoading && sessions.filter((item) => !item.isBackground).length === 0 && <div className={liveStyles.emptyState}>최근 세션 없음</div>}</NavSection>
      <NavSection label="Agents">{gatewayAgents.map((agent) => <NavItem key={agent.id}><span className={styles.agentGlyph}>{initialOf(agent.id || agent.name || "?")}</span>{agent.name || agent.id}</NavItem>)}{!sessionsLoading && gatewayAgents.length === 0 && <div className={liveStyles.emptyState}>Gateway 에이전트 없음</div>}</NavSection>
      <div className={styles.profile}><span className={styles.avatar}>J</span><span><strong>junzzang</strong><br /><small>M1 local gateway</small></span></div>
    </aside>
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.crumb}><strong>AI Company</strong><span>/</span>오늘의 회사 생존 테스트</div><div className={styles.topActions}><span className={styles.connection}><i />{connected ? "Gateway online" : "Gateway offline"}</span><button className={styles.iconButton} aria-label="설정"><Settings size={15} /></button></div></header>
      <section className={styles.conversation}>
        <div className={styles.sessionHead}><div><div className={styles.kicker}>CEO SESSION</div><h1>오늘의 회사 생존 테스트</h1><p>{connected ? `${gatewayAgents.length} agents · ${sessions.length} live sessions` : "Gateway 연결 대기 중"}</p></div><span className={approved ? styles.runChipActive : styles.runChip}>{approved ? "Running" : "Awaiting approval"}</span></div>
        {messages.length === 0 && connected && <Message initial="C" name="CEO" time="now">Gateway에 연결되었습니다. 아래 입력창에서 실제 CEO 에이전트에게 요구사항을 보내세요.</Message>}
        {messages.map((item) => <Message key={item.id} initial={item.role === "user" ? "J" : "C"} name={item.name} time="live" user={item.role === "user"}>{item.text}</Message>)}
        {connected && <Message initial="C" name="CEO" time="live">CEO 승인 후 Architect가 구조를 잡고 Developer가 구현한 뒤 Reviewer가 검증합니다.<div className={styles.brief}><div className={styles.briefHead}><strong>Approval brief</strong><span>company-brain</span></div><div className={styles.briefGrid}><BriefCell label="GOAL">30초 안에 끝나는 회사 생존 유형 테스트</BriefCell><BriefCell label="DELIVERABLE">모바일 랜딩 · 6문항 · 4개 결과 · 공유</BriefCell><BriefCell label="OUT OF SCOPE">로그인, DB, 광고, 관리자 통계</BriefCell><BriefCell label="HANDOFF">Architect → Developer → Reviewer</BriefCell></div><div className={styles.briefFooter}><button className={styles.secondary} onClick={() => notify("수정 요청을 CEO 세션에 전달하려면 메시지를 보내세요.")}>수정 요청</button><button className={styles.approve} onClick={approve} disabled={approved}>{approved ? <><Check size={14} /> Approved</> : "승인하고 진행"}</button></div></div></Message>}
        {error && <div className={styles.toast} role="alert">{error}</div>}
        <form className={styles.composer} onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event as unknown as FormEvent); } }} placeholder={connected ? "CEO에게 다음 작업을 요청하세요…" : "Gateway 연결을 기다리는 중…"} rows={2} disabled={!connected} /><div className={styles.composerFooter}><span>Enter to send · Shift + Enter for new line</span><div><button type="button" className={styles.attach} aria-label="첨부"><Paperclip size={14} /></button><button className={styles.send} disabled={!connected || !message.trim()}>Send <Send size={13} /></button></div></div></form>
      </section>
    </main>
    <aside className={styles.inspector}><h2>Run overview</h2><Panel title="Agent pipeline">{pipeline.map((id) => <AgentRow key={id} id={id} agent={gatewayAgents.find((item) => item.id === id)} sessions={sessions} />)}</Panel><Panel title="Activity"><Timeline sessions={sessions} /></Panel><Panel title="Artifacts">{artifacts.map((artifact) => <button className={styles.report} key={artifact.path} onClick={() => void openArtifact(artifact.path)}><FileText size={13} />{artifact.path}</button>)}{artifacts.length === 0 && <div className={liveStyles.emptyState}>파일 없음</div>}</Panel></aside>
    <nav className={styles.mobileNav}><button className={styles.mobileActive}><CircleDot size={17} />Chat</button><button><GitBranch size={17} />Run</button><button><FolderOpen size={17} />Files</button></nav>
    {toast && <div className={styles.toast} role="status">{toast}</div>}
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
function NavItem({ children, active = false, href }: { children: React.ReactNode; active?: boolean; href?: string }) { return href ? <a href={href} className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</a> : <button className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</button>; }
function Message({ initial, name, time, user = false, children }: { initial: string; name: string; time: string; user?: boolean; children: React.ReactNode }) { return <article className={`${styles.message} ${user ? styles.messageUser : ""}`}><div className={styles.messageAvatar}>{initial}</div><div><div className={styles.messageName}>{name}<span>{time}</span></div><div className={styles.messageBody}>{children}</div></div></article>; }
function BriefCell({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.briefCell}><label>{label}</label><p>{children}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.panel}><div className={styles.panelTitle}>{title}</div>{children}</section>; }
function AgentRow({ id, agent, sessions }: { id: string; agent?: GatewayAgent; sessions: GatewaySession[] }) { const latest = sessions.find((item) => item.agentId === id); const running = sessions.some((item) => item.agentId === id && item.hasActiveRun); const status = running ? "Running" : latest?.status === "failed" ? "Needs attention" : latest ? "Ready" : "No session"; return <div className={styles.agent}><span className={styles.agentIcon}>{initialOf(id)}</span><div><div>{agent?.name || id}</div><small>{status} · {agent?.model?.primary || "configured"}</small></div><span className={running ? styles.statusWorking : latest?.status === "failed" ? liveStyles.statusFailed : styles.status} /></div>; }
function Timeline({ sessions }: { sessions: GatewaySession[] }) { const recent = sessions.filter((item) => !item.isBackground).slice(0, 3); return <div className={styles.timeline}>{recent.map((item) => <div className={`${styles.event} ${item.hasActiveRun ? styles.eventWorking : styles.eventDone}`} key={item.key}><i /><span>{item.displayName || item.derivedTitle || item.agentId || "Session"}<small>{item.hasActiveRun ? "running" : item.lastMessagePreview || item.status || "updated"}</small></span></div>)}{recent.length === 0 && <div className={liveStyles.emptyState}>활동 기록 없음</div>}</div>; }
