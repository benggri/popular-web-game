"use client";

// The game's static markup. The canvas game (src/game) takes over these elements by id once mounted.

import { useEffect } from "react";
import { LANGS, dict, pathOf } from "@/i18n/index.js";

export default function EmberTail({ lang }: { lang: string }) {
  useEffect(() => {
    import("@/game/main.js").then((m) => m.startGame(lang));
  }, [lang]);

  const t = dict(lang).page;

  return (
    <main id="stage">
      <canvas id="game" aria-label={t.canvas} />

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
        <p id="alert" className="alert" role="status" hidden />
        <button id="dash" className="dash" aria-label={t.dash}>
          <span>{t.dash}</span>
        </button>
        <button id="pause-btn" className="icon-btn" aria-label={t.pause}>
          II
        </button>
      </div>

      <section id="title" className="screen">
        <div className="panel title-panel">
          <nav className="langs" aria-label="Language">
            {LANGS.map((code) => (
              // a full page load: the game boots once per page, in that page's language
              <a key={code} href={pathOf(code)} hrefLang={dict(code).htmlLang} aria-current={code === lang ? "page" : undefined}>
                {dict(code).label}
              </a>
            ))}
          </nav>
          <h1 className="logo" aria-label={t.logo}>
            EMBER
            <br />
            TAIL
          </h1>
          <p className="tagline">{t.tagline}</p>
          <div className="stats-row">
            <span>
              {t.best} <b id="best">0:00</b>
            </span>
            <span className="gold">
              {t.gold} <b id="gold">0</b>
            </span>
          </div>
          <p id="offline" className="toast" hidden />
          <button id="play" className="btn primary">
            {t.play}
          </button>
          <button id="open-shop" className="btn">
            {t.shop}
          </button>
          <ul className="howto">
            {t.howto.map(([k, v]: string[]) => (
              <li key={k}>
                <b>{k}</b> {v}
              </li>
            ))}
          </ul>
          <p className="about">{t.about}</p>
        </div>
      </section>

      <section id="shop" className="screen" hidden>
        <div className="panel">
          <h2>{t.shop}</h2>
          <p className="sub">{t.shopSub}</p>
          <p className="gold big">
            {t.gold} <b id="shop-gold">0</b>
          </p>
          <p id="shop-free" className="toast" hidden />
          <ul id="shop-list" className="shop-list" />
          <button id="close-shop" className="btn">
            {t.back}
          </button>
        </div>
      </section>

      <section id="levelup" className="screen dim" hidden>
        <div className="panel wide">
          <h2 id="levelup-title">{t.levelUp}</h2>
          <p className="sub">{t.pickHint}</p>
          <div id="cards" className="cards" />
        </div>
      </section>

      <section id="paused" className="screen dim" hidden>
        <div className="panel">
          <h2>{t.paused}</h2>
          <button id="resume" className="btn primary">
            {t.resume}
          </button>
          <button id="quit" className="btn">
            {t.quit}
          </button>
        </div>
      </section>

      <section id="over" className="screen dim" hidden>
        <div className="panel">
          <h2>{t.over}</h2>
          <p id="new-best" className="toast" hidden>
            {t.newBest}
          </p>
          <p id="r-free" className="toast" hidden />
          <dl className="result">
            <dt>{t.time}</dt>
            <dd id="r-time">0:00</dd>
            <dt>{t.kills}</dt>
            <dd id="r-kills">0</dd>
            <dt>{t.level}</dt>
            <dd id="r-level">1</dd>
            <dt>{t.earned}</dt>
            <dd id="r-gold" className="gold">
              0
            </dd>
          </dl>
          <button id="retry" className="btn primary">
            {t.retry} <small>R</small>
          </button>
          <button id="over-shop" className="btn">
            {t.shop}
          </button>
          <button id="over-title" className="btn ghost">
            {t.toTitle}
          </button>
        </div>
      </section>
    </main>
  );
}
