# Ember Tail — 픽셀 서바이버 웹게임

유령불(Ember)이 되어 끝없이 몰려오는 괴물을 버티는 브라우저 게임입니다.
이펙트와 캐릭터는 모두 [pixelfx](https://github.com/patch-gg/pixelfx)의 코드 기반 픽셀 아트로 그립니다.

- 소스: [`application/`](application) (Next.js 16 App Router)
- 배포: Vercel

## 벤치마킹한 2026 인기 웹게임 5종

| 게임 | 가져온 것 |
|---|---|
| **Slither.io** | 포인터를 따라가는 한 손 조작, 레벨업할수록 길어지는 꼬리 (꼬리에 닿은 적은 불탐) |
| **Vampire Survivors류 서바이버** | 자동 공격, 몰려오는 적 무리, 레벨업 시 카드 3장 중 1장 선택 |
| **2048** | 같은 주문 카드를 고르면 타일이 합쳐짐: 2 → 4 → 8 → 16 → 32 → 64 (타일 색도 2048) |
| **Cookie Clicker** | 판마다 모은 골드로 영구 강화 (가격이 레벨마다 1.15배), 접속하지 않아도 골드를 버는 대장간 |
| **Space Waves / Chrome Dino** | 원버튼 대시(무적), 시간이 갈수록 빨라지는 난이도, R 한 번에 즉시 재시작 |

## 조작

| 동작 | PC | 모바일 |
|---|---|---|
| 이동 | 마우스 포인터를 따라감 · WASD/방향키 | 화면을 누른 채 끌기 |
| 대시 | Space · Shift · 우클릭 | 대시 버튼 |
| 카드 선택 | 클릭 · 1 / 2 / 3 | 탭 |
| 일시정지 | Esc · P | II 버튼 |
| 재시작 | R | 다시 하기 |

## 게임 구성

- **주문 5종**: 불씨 화살, 서리 폭발(감속), 연쇄 번개, 비전 궤도, 메테오
- **패시브 4종**: 긴 꼬리, 순풍, 자석, 장작
- **적 5종**: 슬라임 → 박쥐(25초) → 유령(60초) → 눈알(120초), 2분마다 보스 해골
- **영구 강화 5종**: 위력, 활력, 신속, 탐욕, 불씨 대장간(오프라인 골드, 최대 8시간)
- 진행 상황은 브라우저 localStorage에 저장됩니다 (DB 없음)

## 개발

```bash
cd application
npm install
npm run dev      # http://localhost:3000
npm test         # 합성 규칙·강화 가격·오프라인 골드 단위 테스트
npm run build
```

### 구조

```
application/src
├── app/              Next.js 레이아웃·페이지·전역 CSS·Galmuri 폰트
├── components/       EmberTail.tsx: 게임 마크업 + 클라이언트에서 게임 부팅
└── game/
    ├── main.js       화면 흐름(타이틀→플레이→레벨업/일시정지→게임오버)과 메인 루프
    ├── sprites.js    pixelfx 루프 이펙트를 시작 시 캔버스 프레임으로 굽기
    ├── fxlayer.js    라이브 pixelfx 이펙트(서리 폭발·메테오·타격 등)와 데미지 숫자
    ├── world.js      런 상태, 플레이어, 꼬리, 아이템, 공간 그리드
    ├── enemies.js    스폰·추적·밀어내기·접촉 피해
    ├── spells.js     주문 5종
    ├── runes.js      2048식 카드 합성 규칙
    ├── progress.js   저장·영구 강화·오프라인 골드
    ├── render.js     월드 그리기
    ├── input.js      포인터/키보드/대시 입력
    ├── ui.js         HUD·카드·상점·결과 DOM
    └── config.js     밸런스 수치
```

## 라이선스

- pixelfx: MIT (Patch)
- Galmuri11 폰트: SIL Open Font License 1.1 (`application/src/app/fonts/OFL.md`)
