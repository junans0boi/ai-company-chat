export type ResultType = "pioneer" | "optimizer" | "connector" | "guardian";

export type Choice = {
  id: string;
  label: string;
  weight: Record<ResultType, number>;
};

export type Question = {
  id: string;
  text: string;
  choices: Choice[];
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "아침 출근길, 회사에 도착했을 때 가장 먼저 하는 일은?",
    choices: [
      { id: "c1", label: "새로운 프로젝트 아이디어 구상하기", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "오늘의 일과표와 To-Do 리스트 점검하기", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "동료들에게 인사하며 커피 타임 가지기", weight: { pioneer: 1, optimizer: 0, connector: 3, guardian: 0 } },
      { id: "c4", label: "어제 놓친 리스크나 문제점 확인하기", weight: { pioneer: 0, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q2",
    text: "팀 회의 중 새로운 의견이 나왔을 때 당신의 반응은?",
    choices: [
      { id: "c1", label: "흥미롭다! 당장 시도해보자고 추진한다", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "좋은 아이디어지만 효율적인 실행 방안을 고민한다", weight: { pioneer: 1, optimizer: 3, connector: 0, guardian: 0 } },
      { id: "c3", label: "다른 팀원들의 생각은 어떤지 의견을 먼저 묻는다", weight: { pioneer: 0, optimizer: 0, connector: 3, guardian: 1 } },
      { id: "c4", label: "혹시 발생할 수 있는 부작용은 없는지 보수적으로 접근한다", weight: { pioneer: 0, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q3",
    text: "업무 메신저에 예상치 못한 긴급 이슈가 올라왔다. 당신은?",
    choices: [
      { id: "c1", label: "일단 내가 직접 나서서 해결책을 찾고 빠르게 조치한다", weight: { pioneer: 3, optimizer: 1, connector: 0, guardian: 0 } },
      { id: "c2", label: "관련 담당자를 즉시 파악하고 프로세스대로 분배한다", weight: { pioneer: 0, optimizer: 3, connector: 1, guardian: 0 } },
      { id: "c3", label: "다들 당황하지 않게 팀 분위기를 다독이며 모은다", weight: { pioneer: 0, optimizer: 0, connector: 3, guardian: 1 } },
      { id: "c4", label: "이전에도 비슷한 문제가 있었는지 기록을 먼저 살펴본다", weight: { pioneer: 1, optimizer: 0, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q4",
    text: "회식 메뉴를 정해야 한다. 어떤 방식을 선호하는가?",
    choices: [
      { id: "c1", label: "요즘 유행하는 핫플레이스나 새로운 메뉴에 도전한다", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "예산과 동선을 꼼꼼히 따져서 가성비 좋은 곳을 골라서 투표한다", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "팀원들의 피드백을 모조리 취합해 모두가 만족할 곳을 찾는다", weight: { pioneer: 0, optimizer: 1, connector: 3, guardian: 0 } },
      { id: "c4", label: "항상 가던 검증되고 실패없는 단골집으로 밀어붙인다", weight: { pioneer: 1, optimizer: 0, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q5",
    text: "내게 주어지면 가장 스트레스 받는 업무 상황은?",
    choices: [
      { id: "c1", label: "하루 종일 반복되는 단순 서류 작업", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "목표나 기한이 불분명하고 두루뭉술한 업무 지시", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "서로 의견 충돌이 잦아 매번 중재해야 하는 분위기", weight: { pioneer: 0, optimizer: 1, connector: 3, guardian: 0 } },
      { id: "c4", label: "안정성 검증도 안 된 상태에서 무작정 런칭해야 하는 상황", weight: { pioneer: 1, optimizer: 0, connector: 0, guardian: 3 } },
    ],
  },
  {
    id: "q6",
    text: "금요일 오후, 이번 주 나의 퍼포먼스를 평가해본다면?",
    choices: [
      { id: "c1", label: "위험을 감수하더라도 새로운 시도를 하나 뚫어냈다", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
      { id: "c2", label: "내가 계획한 타임라인대로 오차 없이 일을 마무리지었다", weight: { pioneer: 0, optimizer: 3, connector: 0, guardian: 1 } },
      { id: "c3", label: "다른 팀과의 협업을 매끄럽게 조율해서 성과를 이끌었다", weight: { pioneer: 0, optimizer: 0, connector: 3, guardian: 1 } },
      { id: "c4", label: "치명적인 실수가 나갈 뻔한 걸 내가 미리 발견하고 막았다", weight: { pioneer: 1, optimizer: 1, connector: 0, guardian: 3 } },
    ],
  },
];

export const RESULTS: Record<ResultType, { title: string; desc: string; emoji: string }> = {
  pioneer: {
    title: "불도저 혁신가 (Pioneer)",
    desc: "도전을 두려워하지 않으며 늘 새로운 길을 개척하는 스타일입니다. 아이디어를 빠르게 실행에 옮기며 조직에 활기를 불어넣습니다.",
    emoji: "🚀",
  },
  optimizer: {
    title: "극강의 효율주의자 (Optimizer)",
    desc: "모든 프로세스를 깔끔하게 정돈하고 낭비를 최소화하는 데 탁월한 능력을 발휘합니다. 일 잘한다는 소리를 가장 많이 듣는 유형입니다.",
    emoji: "⚙️",
  },
  connector: {
    title: "팀워크 마에스트로 (Connector)",
    desc: "뛰어난 공감 능력과 커뮤니케이션으로 팀의 결속력을 다집니다. 조직의 윤활유 역할을 완벽하게 수행합니다.",
    emoji: "🤝",
  },
  guardian: {
    title: "신뢰의 철벽 방패 (Guardian)",
    desc: "리스크를 한 발 앞서 예측하고 철저하게 관리하는 신중파입니다. 회사 안의 큰 위기를 막아내는 숨은 영웅입니다.",
    emoji: "🛡️",
  },
};
