"use client";

// The game's static markup. The canvas game (src/game) takes over these elements by id once mounted.

import { useEffect } from "react";

export default function EmberTail() {
  useEffect(() => {
    import("@/game/main.js").then((m) => m.startGame());
  }, []);

  return (
    <main id="stage">
      <canvas id="game" aria-label="게임 화면" />

      <div id="hud" hidden>
        <div className="hud-top">
          <div className="bars">
            <div className="bar hp">
              <i id="hp-fill" />
              <span id="hp-text" />
            </div>
            <div className="bar xp">
              <i id="xp-fill" />
              <span id="lv-text" />
            </div>
          </div>
          <div id="timer">0:00</div>
          <div className="counts">
            <span id="kills">0</span>
            <span id="coins">0</span>
          </div>
        </div>
        <div id="tiles" className="tiles" />
        <button id="dash" className="dash" aria-label="대시">
          <span>대시</span>
        </button>
        <button id="pause-btn" className="icon-btn" aria-label="일시정지">
          II
        </button>
      </div>

      <section id="title" className="screen">
        <div className="panel title-panel">
          <h1 className="logo" aria-label="Ember Tail 엠버 테일">
            EMBER
            <br />
            TAIL
          </h1>
          <p className="tagline">유령불이 되어 밤을 버티는 픽셀 서바이버</p>
          <div className="stats-row">
            <span>
              최고 <b id="best">0:00</b>
            </span>
            <span className="gold">
              골드 <b id="gold">0</b>
            </span>
          </div>
          <p id="offline" className="toast" hidden />
          <button id="play" className="btn primary">
            시작하기
          </button>
          <button id="open-shop" className="btn">
            불씨 대장간
          </button>
          <ul className="howto">
            <li>
              <b>이동</b> 마우스/터치를 따라가요 · WASD도 OK
            </li>
            <li>
              <b>대시</b> 스페이스 · 우클릭 · 대시 버튼 (무적)
            </li>
            <li>
              <b>합성</b> 같은 주문 카드 = 2 → 4 → 8 … 64
            </li>
            <li>
              <b>꼬리</b> 꼬리에 닿은 적은 불탑니다
            </li>
          </ul>
          <p className="about">
            설치 없이 브라우저에서 바로 하는 무료 픽셀 아트 서바이버 게임입니다. 자동으로 발사되는 주문으로 슬라임·박쥐·유령·보스
            해골을 물리치고, 같은 주문을 합쳐 2048처럼 강화하세요. 모은 골드로 영구 강화를 하면 다음 판은 더 오래 버틸 수
            있어요. PC와 모바일 모두 지원합니다.
          </p>
        </div>
      </section>

      <section id="shop" className="screen" hidden>
        <div className="panel">
          <h2>불씨 대장간</h2>
          <p className="sub">판에서 모은 골드로 영구 강화 · 가격은 레벨마다 15%씩 올라요</p>
          <p className="gold big">
            골드 <b id="shop-gold">0</b>
          </p>
          <ul id="shop-list" className="shop-list" />
          <button id="close-shop" className="btn">
            돌아가기
          </button>
        </div>
      </section>

      <section id="levelup" className="screen dim" hidden>
        <div className="panel wide">
          <h2 id="levelup-title">레벨 업!</h2>
          <p className="sub">카드를 고르세요 · 1 2 3</p>
          <div id="cards" className="cards" />
        </div>
      </section>

      <section id="paused" className="screen dim" hidden>
        <div className="panel">
          <h2>일시정지</h2>
          <button id="resume" className="btn primary">
            계속하기
          </button>
          <button id="quit" className="btn">
            포기하고 나가기
          </button>
        </div>
      </section>

      <section id="over" className="screen dim" hidden>
        <div className="panel">
          <h2>불씨가 꺼졌습니다</h2>
          <p id="new-best" className="toast" hidden>
            새 최고 기록!
          </p>
          <dl className="result">
            <dt>버틴 시간</dt>
            <dd id="r-time">0:00</dd>
            <dt>처치</dt>
            <dd id="r-kills">0</dd>
            <dt>레벨</dt>
            <dd id="r-level">1</dd>
            <dt>획득 골드</dt>
            <dd id="r-gold" className="gold">
              0
            </dd>
          </dl>
          <button id="retry" className="btn primary">
            다시 하기 <small>R</small>
          </button>
          <button id="over-shop" className="btn">
            불씨 대장간
          </button>
          <button id="over-title" className="btn ghost">
            타이틀로
          </button>
        </div>
      </section>
    </main>
  );
}
