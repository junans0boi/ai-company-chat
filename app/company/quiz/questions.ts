export type ResultType = "pioneer" | "optimizer" | "connector" | "guardian";

export type Choice = {
  id: string;
  label: string;
  weight: Record<ResultType, number>;
};

export type Question = {
  id: string;
  situation: string;
  text: string;
  choices: Choice[];
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    situation: "📅 월요일 오전 9시",
    text: "팀장이 갑자기 긴급 회의를 소집했다. 나의 첫 반응은?",
    choices: [
      { id: "a", label: "일단 조용히 앉아 상황을 파악한다. 티 내지 말자.", weight: { guardian: 3, optimizer: 0, connector: 1, pioneer: 0 } },
      { id: "b", label: "메모장 열고 아젠다 정리 중. 나는 항상 준비됐다.", weight: { pioneer: 3, optimizer: 1, connector: 0, guardian: 0 } },
      { id: "c", label: "빠르게 주변 분위기를 읽고 어느 편에 서야 할지 계산한다.", weight: { connector: 3, guardian: 1, optimizer: 0, pioneer: 0 } },
      { id: "d", label: "속으론 한숨이지만 겉으론 씩씩하게. 어차피 내가 다 한다.", weight: { optimizer: 3, pioneer: 1, connector: 0, guardian: 0 } },
    ],
  },
  {
    id: "q2",
    situation: "⚔️ 내부 정치의 시간",
    text: "옆 팀 동료가 내 공을 슬쩍 가로채려 한다. 나는?",
    choices: [
      { id: "a", label: "조용히 기록을 남겨둔다. 시간이 증명해줄 거야.", weight: { guardian: 3, optimizer: 0, connector: 0, pioneer: 0 } },
      { id: "b", label: "즉시 사실관계를 정리해 팀장에게 보고한다.", weight: { pioneer: 3, optimizer: 1, connector: 0, guardian: 0 } },
      { id: "c", label: "겉으론 웃으며 내 포지션을 자연스럽게 재확인시킨다.", weight: { connector: 3, guardian: 1, optimizer: 0, pioneer: 0 } },
      { id: "d", label: "화가 나지만 지금은 그냥 넘어간다. 나중에 터지겠지.", weight: { optimizer: 2, guardian: 1, connector: 0, pioneer: 0 } },
    ],
  },
  {
    id: "q3",
    situation: "🌙 야근 공지 수신",
    text: "야근 지시가 내려왔다. 저녁 약속이 있는데…",
    choices: [
      { id: "a", label: "약속을 조용히 미룬다. 마찰은 피하는 게 상책.", weight: { guardian: 3, connector: 0, optimizer: 0, pioneer: 0 } },
      { id: "b", label: "업무 우선순위를 명확히 정리하고 효율적으로 끝낸다.", weight: { optimizer: 3, pioneer: 1, connector: 0, guardian: 0 } },
      { id: "c", label: "상황을 협상해서 양쪽을 반반 조율해본다.", weight: { connector: 3, pioneer: 0, optimizer: 1, guardian: 0 } },
      { id: "d", label: "한숨 한 번 쉬고 양쪽 다 해낸다. 내 체력은 내가 책임진다.", weight: { pioneer: 3, optimizer: 1, guardian: 0, connector: 0 } },
    ],
  },
  {
    id: "q4",
    situation: "🏕️ 워크숍 시즌",
    text: "팀빌딩 게임 조장을 맡게 됐다. 나는?",
    choices: [
      { id: "a", label: "맡긴 했지만 최대한 존재감 없이 진행한다.", weight: { guardian: 3, connector: 0, optimizer: 0, pioneer: 0 } },
      { id: "b", label: "철저한 기획서 작성 후 완벽하게 진행한다.", weight: { optimizer: 3, pioneer: 1, connector: 0, guardian: 0 } },
      { id: "c", label: "팀원 성향을 파악해 각자가 빛날 수 있는 판을 짠다.", weight: { connector: 3, pioneer: 0, optimizer: 0, guardian: 0 } },
      { id: "d", label: "열정 넘치게 이끌었지만 끝나면 방전 직전이다.", weight: { pioneer: 3, optimizer: 0, connector: 1, guardian: 0 } },
    ],
  },
  {
    id: "q5",
    situation: "📊 인사평가 시즌",
    text: "인사평가 시즌이 왔다. 나의 전략은?",
    choices: [
      { id: "a", label: "평소에 조용히 결과물을 쌓아뒀다. 알 사람은 안다.", weight: { guardian: 3, optimizer: 0, connector: 0, pioneer: 0 } },
      { id: "b", label: "성과를 데이터로 정리해서 명확하게 어필한다.", weight: { optimizer: 3, pioneer: 1, connector: 0, guardian: 0 } },
      { id: "c", label: "평가자 성향을 파악해 원하는 방식으로 어필한다.", weight: { connector: 3, pioneer: 0, optimizer: 1, guardian: 0 } },
      { id: "d", label: "이만큼 했는데 왜 모르지? 억울한데 말은 못 하겠다.", weight: { pioneer: 2, guardian: 1, optimizer: 0, connector: 0 } },
    ],
  },
  {
    id: "q6",
    situation: "😶 번아웃의 전조",
    text: "오늘 유독 아무것도 하기 싫다. 나는 어떻게 하나?",
    choices: [
      { id: "a", label: "최소한만 하고 조용히 버틴다. 이것도 생존 전략이다.", weight: { guardian: 3, connector: 0, optimizer: 0, pioneer: 0 } },
      { id: "b", label: "스케줄을 재정비하고 핵심 업무에만 집중한다.", weight: { optimizer: 3, pioneer: 0, connector: 0, guardian: 0 } },
      { id: "c", label: "동료나 환경을 바꿔 기분전환을 시도한다.", weight: { connector: 3, pioneer: 0, optimizer: 0, guardian: 0 } },
      { id: "d", label: "그래도 끝까지 한다. 쉬고 싶지만 못 쉬는 게 더 맞다.", weight: { pioneer: 3, optimizer: 0, guardian: 0, connector: 0 } },
    ],
  },
];

export const RESULTS: Record<ResultType, { title: string; sub: string; desc: string; emoji: string; traits: string[] }> = {
  pioneer: {
    emoji: "⚡",
    title: "번아웃 직전 전사",
    sub: "한계까지 달리는 당신, 쉬어도 돼",
    desc: "당신의 에너지와 책임감은 누구보다 강합니다. 힘들어도 끝까지 해내고, 불합리해도 묵묵히 버팁니다. 하지만 그 열정이 스스로를 갉아먹고 있지는 않나요? 지금 당신에게 가장 필요한 것은 의도적인 휴식일 수 있어요.",
    traits: ["압도적인 책임감과 실행력", "자기 감정을 뒤로 미루는 경향", "의도적 회복과 쉼이 필요"],
  },
  optimizer: {
    emoji: "🌀",
    title: "폭풍 속의 눈",
    sub: "혼란 속에서도 중심을 잡는다",
    desc: "혼돈이 몰아쳐도 당신은 흔들리지 않습니다. 명확한 기준과 구조적 사고로 복잡한 상황을 정리하고, 팀이 방향을 잃을 때 나침반 역할을 합니다. 논리와 원칙이 당신의 무기예요.",
    traits: ["구조적 사고와 명확한 의사결정", "데이터 기반으로 움직이는 합리주의", "위기 상황에서 오히려 실력이 빛남"],
  },
  connector: {
    emoji: "🦎",
    title: "적응형 카멜레온",
    sub: "상황에 따라 변신하는 생존 전문가",
    desc: "환경이 바뀌어도 당신은 언제나 최적의 형태로 변신합니다. 사람을 빠르게 파악하고, 필요할 때 필요한 모습을 보여주는 고도의 사회적 지능을 갖고 있어요. 생존은 당신에게 예술입니다.",
    traits: ["탁월한 상황 적응력과 눈치", "관계 네트워크를 능숙하게 활용", "유연한 사고로 변화에 강함"],
  },
  guardian: {
    emoji: "🐢",
    title: "조용한 생존자",
    sub: "티 안 나게, 하지만 끝까지",
    desc: "당신은 화려하지 않지만 가장 오래 남는 유형입니다. 소음 없이 결과를 만들고, 불필요한 충돌을 피하며, 조직의 흐름을 정확히 읽습니다. 폭풍이 지나가면 항상 자리를 지키고 있는 건 결국 당신이에요.",
    traits: ["뛰어난 관찰력과 상황 판단력", "말보다 행동으로 신뢰를 쌓는 스타일", "갈등 회피로 에너지를 보존"],
  },
};
