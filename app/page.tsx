"use client";

import { useState } from "react";
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
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

  const approve = () => {
    setApproved(true);
    notify("승인 완료 · 팀을 가동했습니다");
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
          <div className={styles.topActions}><span className={styles.connection}><i />Gateway online</span><button className={styles.iconButton} aria-label="설정"><Settings size={15} /></button></div>
        </header>
        <section className={styles.conversation}>
          <div className={styles.sessionHead}><div><div className={styles.kicker}>CEO SESSION</div><h1>오늘의 회사 생존 테스트</h1><p>Updated just now · 4 agents available</p></div><span className={approved ? styles.runChipActive : styles.runChip}>{approved ? "Running" : "Awaiting approval"}</span></div>
          <Message initial="J" name="You" time="16:42" user>회사 생존 유형 테스트를 만들어보고 싶어. <strong>모바일에서 공유하기 좋은 양산형 웹사이트</strong>로 만들어줘.</Message>
          <Message initial="C" name="CEO" time="16:43">요구사항을 정리했습니다. 승인하면 Architect가 구조를 잡고 Developer가 구현한 뒤 Reviewer가 검증합니다.
            <div className={styles.brief}>
              <div className={styles.briefHead}><strong>Approval brief</strong><span>company-brain</span></div>
              <div className={styles.briefGrid}><BriefCell label="GOAL">30초 안에 끝나는 회사 생존 유형 테스트</BriefCell><BriefCell label="DELIVERABLE">모바일 랜딩 · 6문항 · 4개 결과 · 공유</BriefCell><BriefCell label="OUT OF SCOPE">로그인, DB, 광고, 관리자 통계</BriefCell><BriefCell label="HANDOFF">Architect → Developer → Reviewer</BriefCell></div>
              <div className={styles.briefFooter}><button className={styles.secondary} onClick={() => notify("CEO에게 수정 요청을 보냈습니다")}>수정 요청</button><button className={styles.approve} onClick={approve} disabled={approved}>{approved ? <><Check size={14} /> Approved</> : "승인하고 진행"}</button></div>
            </div>
          </Message>
          {approved && <Message initial="C" name="CEO" time="now">승인 확인했습니다. 팀을 가동합니다. 오른쪽 패널에서 진행 상황을 확인하세요.</Message>}
          <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); if (message.trim()) { notify("메시지를 CEO 세션에 추가했습니다"); setMessage(""); } }}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="CEO에게 다음 작업을 요청하세요…" rows={2} /><div className={styles.composerFooter}><span>Enter to send · Shift + Enter for new line</span><div><button type="button" className={styles.attach} aria-label="첨부"><Paperclip size={14} /></button><button className={styles.send}>Send <Send size={13} /></button></div></div></form>
        </section>
      </main>

      <aside className={styles.inspector}><h2>Run overview</h2><Panel title="Agent pipeline">{agents.map(([initial, name, role], index) => <div className={styles.agent} key={name}><span className={styles.agentIcon}>{initial}</span><div><div>{name}</div><small>{approved && index === 1 ? "Designing system" : approved && index > 1 ? "Queued" : role}</small></div><span className={index === 0 || approved ? styles.statusWorking : styles.status} /></div>)}</Panel><Panel title="Activity"><Timeline approved={approved} /></Panel><Panel title="Artifacts"><button className={styles.report} onClick={() => notify("session.md를 열었습니다")}><FileText size={13} />session.md</button><button className={styles.report} onClick={() => notify("checkpoint.md를 열었습니다")}><TerminalSquare size={13} />checkpoint.md</button></Panel></aside>
      <nav className={styles.mobileNav}><button className={styles.mobileActive}><CircleDot size={17} />Chat</button><button><GitBranch size={17} />Run</button><button><FolderOpen size={17} />Files</button></nav>
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) { return <section><div className={styles.navLabel}>{label}</div><div className={styles.navList}>{children}</div></section>; }
function NavItem({ children, active = false }: { children: React.ReactNode; active?: boolean }) { return <button className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>{children}</button>; }
function Message({ initial, name, time, user = false, children }: { initial: string; name: string; time: string; user?: boolean; children: React.ReactNode }) { return <article className={`${styles.message} ${user ? styles.messageUser : ""}`}><div className={styles.messageAvatar}>{initial}</div><div><div className={styles.messageName}>{name}<span>{time}</span></div><div className={styles.messageBody}>{children}</div></div></article>; }
function BriefCell({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.briefCell}><label>{label}</label><p>{children}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.panel}><div className={styles.panelTitle}>{title}</div>{children}</section>; }
function Timeline({ approved }: { approved: boolean }) { return <div className={styles.timeline}><div className={`${styles.event} ${styles.eventDone}`}><i /><span>CEO brief created<small>just now</small></span></div><div className={`${styles.event} ${approved ? styles.eventDone : ""}`}><i /><span>{approved ? "Approval confirmed" : "Approval required"}<small>{approved ? "now" : "next step"}</small></span></div><div className={`${styles.event} ${approved ? styles.eventWorking : ""}`}><i /><span>Specialists will start<small>{approved ? "running" : "after approval"}</small></span></div></div>; }
