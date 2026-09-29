"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleDot,
  FileText,
  FolderOpen,
  GitBranch,
  Paperclip,
  Send,
  Settings,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import styles from "./CompanyConsole.module.css";

const agents = [
  ["C", "CEO", "Planning & approval"],
  ["A", "Architect", "System design"],
  ["D", "Developer", "Implementation"],
  ["R", "Reviewer", "Quality gate"],
] as const;

export default function CompanyPage() {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; name: string; text: string }>>([]);
  const [sessionKey, setSessionKey] = useState("agent:ceo:company-survival-test");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/gateway/ws`);
    socketRef.current = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: "req", id: "connect", method: "connect", params: { minProtocol: 3, maxProtocol: 4, client: { id: "openclaw-control-ui", version: "ai-company-chat", mode: "webchat", platform: "web" }, role: "operator", scopes: ["operator.read", "operator.write", "operator.admin", "operator.approvals", "operator.pairing"] } }));
    socket.onmessage = (event) => {
      const frame = JSON.parse(String(event.data));
      if (frame.type === "event" && frame.event === "connect.challenge") return;
      if (frame.type === "res" && frame.id === "connect") {
        if (!frame.ok) return setError(frame.error?.message || "Gateway 연결 실패");
        setConnected(true);
        send(socket, "agents", "agents.list", {});
        send(socket, "history", "chat.history", { sessionKey: "agent:ceo:company-survival-test", limit: 80 });
      }
      if (frame.type === "res" && frame.id === "agents" && frame.ok) {
        const ceo = frame.payload?.agents?.find((agent: { id?: string }) => agent.id === "ceo")?.id || "ceo";
        const nextKey = `agent:${ceo}:company-survival-test`;
        setSessionKey(nextKey);
        send(socket, "history", "chat.history", { sessionKey: nextKey, limit: 80 });
      }
      if (frame.type === "res" && frame.id === "history" && frame.ok) {
        const history = (frame.payload?.messages || []).map((item: { role?: string; content?: unknown }, index: number) => {
          const role = item.role === "user" ? "user" : item.role === "assistant" ? "assistant" : null;
          const text = extractText(item.content);
          return role && text ? { id: `history-${index}`, role, name: role === "user" ? "You" : "CEO", text } : null;
        }).filter(Boolean);
        setMessages(history);
      }
      if (frame.type === "event" && frame.event === "chat" && frame.payload?.sessionKey === sessionKey && frame.payload?.state === "final") {
        const text = extractText(frame.payload.message);
        if (text) setMessages((current) => [...current, { id: newId(), role: "assistant", name: "CEO", text }]);
      }
    };
    socket.onerror = () => setError("Gateway 연결 오류");
    socket.onclose = () => setConnected(false);
    return () => socket.close();
  }, [sessionKey]);

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

  const approve = () => {
    if (!socketRef.current || !connected) return;
    void fetch("/api/company/approve", { method: "POST" }).then(async (response) => {
      if (!response.ok) return setError((await response.json().catch(() => null))?.error || "팀 가동에 실패했습니다.");
      setApproved(true);
      notify("승인 완료 · CEO 작업 재개 지시 전송");
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !socketRef.current || !connected) return;
    setMessages((current) => [...current, { id: newId(), role: "user", name: "You", text }]);
    void fetch("/api/company/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, sessionKey }) }).then(async (response) => {
      if (!response.ok) setError((await response.json().catch(() => null))?.error || "CEO에게 메시지를 전달하지 못했습니다.");
    });
    setMessage("");
  };

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}><Sparkles size={14} /></span>AI Company</div>
        <button className={styles.workspace}><span><small>WORKSPACE</small><br />junzzang / studio</span><ChevronDown size={15} /></button>
        <NavSection label="Projects">
          <NavItem active><span className={styles.projectDot} />오늘의 회사 생존 테스트</NavItem>
          <NavItem><span className={styles.projectDotMuted} />AI Company Console</NavItem>
          <NavItem><span className={styles.projectDotMuted} />Claw3D</NavItem>
        </NavSection>
        <NavSection label="Recent sessions">
          <NavItem>CEO 요구사항 정리</NavItem>
          <NavItem>결과 페이지 리뷰</NavItem>
          <NavItem>토큰 재개 흐름 설계</NavItem>
        </NavSection>
        <NavSection label="Agents">
          {agents.map(([initial, name]) => <NavItem key={name}><span className={styles.agentGlyph}>{initial}</span>{name}</NavItem>)}
        </NavSection>
        <div className={styles.profile}><span className={styles.avatar}>J</span><span><strong>junzzang</strong><br /><small>local gateway</small></span></div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumb}><strong>AI Company</strong><span>/</span>오늘의 회사 생존 테스트</div>
          <div className={styles.topActions}><span className={styles.connection}><i />{connected ? "Gateway online" : "Gateway offline"}</span><button className={styles.iconButton} aria-label="설정"><Settings size={15} /></button></div>
        </header>
        <section className={styles.conversation}>
          <div className={styles.sessionHead}><div><div className={styles.kicker}>CEO SESSION</div><h1>오늘의 회사 생존 테스트</h1><p>Updated just now · 4 agents available</p></div><span className={approved ? styles.runChipActive : styles.runChip}>{approved ? "Running" : "Awaiting approval"}</span></div>
          {messages.length === 0 && connected && <Message initial="C" name="CEO" time="now">Gateway에 연결되었습니다. 아래 입력창에서 실제 CEO 에이전트에게 요구사항을 보내세요.</Message>}
          {messages.map((item) => <Message key={item.id} initial={item.role === "user" ? "J" : "C"} name={item.name} time="now" user={item.role === "user"}>{item.text}</Message>)}
          {connected && <Message initial="C" name="CEO" time="now">CEO 승인 후 Architect가 구조를 잡고 Developer가 구현한 뒤 Reviewer가 검증합니다.
            <div className={styles.brief}>
              <div className={styles.briefHead}><strong>Approval brief</strong><span>company-brain</span></div>
              <div className={styles.briefGrid}><BriefCell label="GOAL">30초 안에 끝나는 회사 생존 유형 테스트</BriefCell><BriefCell label="DELIVERABLE">모바일 랜딩 · 6문항 · 4개 결과 · 공유</BriefCell><BriefCell label="OUT OF SCOPE">로그인, DB, 광고, 관리자 통계</BriefCell><BriefCell label="HANDOFF">Architect → Developer → Reviewer</BriefCell></div>
              <div className={styles.briefFooter}><button className={styles.secondary} onClick={() => notify("CEO에게 수정 요청을 보냈습니다")}>수정 요청</button><button className={styles.approve} onClick={approve} disabled={approved}>{approved ? <><Check size={14} /> Approved</> : "승인하고 진행"}</button></div>
            </div>
          </Message>}
          {error && <div className={styles.toast} role="alert">{error}</div>}
          <form className={styles.composer} onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={connected ? "CEO에게 다음 작업을 요청하세요…" : "Gateway 연결을 기다리는 중…"} rows={2} disabled={!connected} /><div className={styles.composerFooter}><span>Enter to send · Shift + Enter for new line</span><div><button type="button" className={styles.attach} aria-label="첨부"><Paperclip size={14} /></button><button className={styles.send} disabled={!connected || !message.trim()}>Send <Send size={13} /></button></div></div></form>
        </section>
      </main>

      <aside className={styles.inspector}><h2>Run overview</h2><Panel title="Agent pipeline">{agents.map(([initial, name, role], index) => <div className={styles.agent} key={name}><span className={styles.agentIcon}>{initial}</span><div><div>{name}</div><small>{approved && index === 1 ? "Designing system" : approved && index > 1 ? "Queued" : role}</small></div><span className={index === 0 || approved ? styles.statusWorking : styles.status} /></div>)}</Panel><Panel title="Activity"><Timeline approved={approved} /></Panel><Panel title="Artifacts"><button className={styles.report} onClick={() => notify("session.md를 열었습니다")}><FileText size={13} />session.md</button><button className={styles.report} onClick={() => notify("checkpoint.md를 열었습니다")}><TerminalSquare size={13} />checkpoint.md</button></Panel></aside>
      <nav className={styles.mobileNav}><button className={styles.mobileActive}><CircleDot size={17} />Chat</button><button><GitBranch size={17} />Run</button><button><FolderOpen size={17} />Files</button></nav>
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}

function newId() { return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2); }
function send(socket: WebSocket, id: string, method: string, params: unknown) { socket.send(JSON.stringify({ type: "req", id, method, params })); }
function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return extractText(item.text ?? item.content ?? item.message ?? item.value);
  }
  return "";
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) { return <section><div className={styles.navLabel}>{label}</div><div className={styles.navList}>{children}</div></section>; }
function NavItem({ children, active = false }: { children: React.ReactNode; active?: boolean }) { return <button className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</button>; }
function Message({ initial, name, time, user = false, children }: { initial: string; name: string; time: string; user?: boolean; children: React.ReactNode }) { return <article className={`${styles.message} ${user ? styles.messageUser : ""}`}><div className={styles.messageAvatar}>{initial}</div><div><div className={styles.messageName}>{name}<span>{time}</span></div><div className={styles.messageBody}>{children}</div></div></article>; }
function BriefCell({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.briefCell}><label>{label}</label><p>{children}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.panel}><div className={styles.panelTitle}>{title}</div>{children}</section>; }
function Timeline({ approved }: { approved: boolean }) { return <div className={styles.timeline}><div className={`${styles.event} ${styles.eventDone}`}><i /><span>CEO brief created<small>just now</small></span></div><div className={`${styles.event} ${approved ? styles.eventDone : ""}`}><i /><span>{approved ? "Approval confirmed" : "Approval required"}<small>{approved ? "now" : "next step"}</small></span></div><div className={`${styles.event} ${approved ? styles.eventWorking : ""}`}><i /><span>Specialists will start<small>{approved ? "running" : "after approval"}</small></span></div></div>; }
