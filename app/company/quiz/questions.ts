export type ResultType = "pioneer" | "optimizer" | "connector" | "guardian";
export type Choice = { id: string; label: string; weight: Record<ResultType, number> };
export type Question = { id: string; text: string; choices: Choice[] };

export const RESULTS: Record<ResultType, { title: string; desc: string; emoji: string }> = {
  pioneer: {
    title: "선구자 (Pioneer)",
    desc: "변화를 두려워하지 않고 항상 새로운 기회를 탐색합니다. 불확실성 속에서도 길을 개척하는 능력이 뛰어납니다.",
    emoji: "🚀",
  },
  optimizer: {
    title: "최적화 전문가 (Optimizer)",
    desc: "주어진 자원을 가장 효율적으로 활용하는 데 능합니다. 프로세스 개선과 안정을 추구하며 회사의 내실을 다집니다.",
    emoji: "⚙️",
  },
  connector: {
    title: "연결자 (Connector)",
    desc: "사람과 사람, 부서와 부서를 잇는 가교 역할을 합니다. 탁월한 공감 능력으로 팀워크와 시너지를 창출합니다.",
    emoji: "🤝",
  },
  guardian: {
    title: "수호자 (Guardian)",
    desc: "회사의 핵심 가치와 원칙을 수호합니다. 리스크를 관리하고 신뢰를 바탕으로 회사의 근간을 튼튼히 합니다.",
    emoji: "🛡️",
  },
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "프로젝트 진행 중 예상치 못한 문제가 발생했습니다. 당신의 첫 반응은?",
    choices: [
      { id: "c1", label: "새로운 접근 방식을 시도해볼 기회라고 생각한다.", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "문제의 근본 원인을 분석하고 효율적인 해결책을 찾는다.", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "팀원들과 즉각적으로 소통하여 공동의 대안을 모색한다.", weight: { pioneer: 1, optimizer: 0, connector: 3, guardian: 0 } },
      { id: "c4", label: "기존의 매뉴얼과 절차를 검토하여 리스크를 최소화한다.", weight: { pioneer: 0, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q2",
    text: "새로운 기술이나 트렌드가 등장했을 때 당신은?",
    choices: [
      { id: "c1", label: "가장 먼저 도입해보고 회사에 적용할 방법을 찾는다.", weight: { pioneer: 3, optimizer: 0, connector: 0, guardian: 1 } },
      { id: "c2", label: "기존 시스템 대비 비용과 효율성을 철저히 계산해본다.", weight: { pioneer: 0, optimizer: 3, connector: 1, guardian: 0 } },
      { id: "c3", label: "다른 사람들이 이를 어떻게 받아들이는지 파악한다.", weight: { pioneer: 0, optimizer: 0, connector: 3, guardian: 1 } },
      { id: "c4", label: "장단점을 신중히 분석하고 안정성이 입증될 때까지 기다린다.", weight: { pioneer: 1, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q3",
    text: "팀 회의에서 의견 충돌이 발생했습니다. 당신의 역할은?",
    choices: [
      { id: "c1", label: "전혀 새로운 돌파구가 될 아이디어를 제시한다.", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "각 의견의 논리적 타당성을 분석하여 우선순위를 정한다.", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "양측의 입장을 조율하고 합의점을 이끌어낸다.", weight: { pioneer: 0, optimizer: 1, connector: 3, guardian: 0 } },
      { id: "c4", label: "회사의 핵심 목표에 가장 부합하는 기준을 상기시킨다.", weight: { pioneer: 1, optimizer: 0, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q4",
    text: "성공적인 하루로 기억되는 날은 어떤 날인가요?",
    choices: [
      { id: "c1", label: "아무도 생각하지 못한 기발한 아이디어를 제안한 날.", weight: { pioneer: 3, optimizer: 0, connector: 0, guardian: 1 } },
      { id: "c2", label: "오래된 비효율적인 프로세스를 완벽하게 개선한 날.", weight: { pioneer: 0, optimizer: 3, connector: 1, guardian: 0 } },
      { id: "c3", label: "팀 전체가 하나 되어 훌륭한 팀워크를 발휘한 날.", weight: { pioneer: 1, optimizer: 0, connector: 3, guardian: 0 } },
      { id: "c4", label: "치명적인 실수를 사전에 발견하고 방지한 날.", weight: { pioneer: 0, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q5",
    text: "업무 스트레스가 쌓일 때 해소하는 방법은?",
    choices: [
      { id: "c1", label: "새로운 장소로 훌쩍 떠나 영감을 얻는다.", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "일정을 체계적으로 다시 정리하며 마음을 다잡는다.", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "친한 동료나 사람들과 대화하며 에너지를 충전한다.", weight: { pioneer: 0, optimizer: 1, connector: 3, guardian: 0 } },
      { id: "c4", label: "조용히 자신만의 시간을 가지며 원칙을 다시 생각한다.", weight: { pioneer: 1, optimizer: 0, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q6",
    text: "당신이 회사에서 가장 중요하게 생각하는 가치는?",
    choices: [
      { id: "c1", label: "혁신 (Innovation)", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "효율 (Efficiency)", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "협력 (Collaboration)", weight: { pioneer: 1, optimizer: 0, connector: 3, guardian: 0 } },
      { id: "c4", label: "신뢰 (Trust)", weight: { pioneer: 0, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
];