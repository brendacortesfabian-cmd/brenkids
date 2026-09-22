/* Brenkids — Landing */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1 · Video de bienvenida ---------- */
  // El video aparece solo si el archivo existe y puede reproducirse;
  // mientras tanto se ve el fondo animado de respaldo.
  const video = document.querySelector('.hero__video');
  if (video) {
    const show = () => video.classList.add('is-ready');
    video.addEventListener('playing', show, { once: true });
    video.muted = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }

  /* ---------- Reveal al hacer scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 3 · Cifras que suben ---------- */
  const fmt = new Intl.NumberFormat('es-MX');
  const counters = document.querySelectorAll('[data-count]');

  const runCount = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    if (reduceMotion) { el.textContent = prefix + fmt.format(target); return; }
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + fmt.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- 4 · Mini-reto ---------- */
  const quiz = document.getElementById('quiz');
  const done = document.getElementById('quizDone');
  const reset = document.getElementById('quizReset');
  const opts = quiz ? quiz.querySelectorAll('.opt') : [];
  const feedbacks = done ? done.querySelectorAll('[data-fb]') : [];

  const burst = (from) => {
    if (reduceMotion) return;
    const r = from.getBoundingClientRect();
    const ox = r.left + 34;
    const oy = r.top + r.height / 2;
    const colors = ['#c9e530', '#ff880e', '#ff1560'];
    for (let i = 0; i < 12; i++) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.classList.add('spark');
      svg.style.left = ox + 'px';
      svg.style.top = oy + 'px';
      svg.style.setProperty('--coin', colors[i % colors.length]);
      svg.style.setProperty('--x', (Math.random() * 360 - 100) + 'px');
      svg.style.setProperty('--y', (Math.random() * -240 - 30) + 'px');
      svg.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', '#coin');
      svg.appendChild(use);
      document.body.appendChild(svg);
      svg.addEventListener('animationend', () => svg.remove());
    }
  };

  opts.forEach((btn) => {
    btn.addEventListener('click', () => {
      quiz.classList.add('is-answered');
      btn.classList.add('is-picked');
      opts.forEach((o) => o.setAttribute('aria-pressed', String(o === btn)));
      feedbacks.forEach((f) => { f.hidden = f.dataset.fb !== btn.dataset.opt; });
      done.hidden = false;
      burst(btn);
      // Lleva la respuesta a la vista sin brincos bruscos
      setTimeout(() => done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }), 120);
    });
  });

  if (reset) {
    reset.addEventListener('click', () => {
      quiz.classList.remove('is-answered');
      opts.forEach((o) => { o.classList.remove('is-picked'); o.removeAttribute('aria-pressed'); });
      done.hidden = true;
      opts[0].focus({ preventScroll: true });
    });
  }


  /* ---------- 4b · Memorama ---------- */
  const memoGrid = document.getElementById('memoGrid');
  if (memoGrid) {
    const CARDS = [
      { key: 'coin',   name: 'Moneda',      icon: 'coin' },
      { key: 'bill',   name: 'Billete',     icon: 'i-bill' },
      { key: 'piggy',  name: 'Alcancía',    icon: 'i-piggy' },
      { key: 'wallet', name: 'Cartera',     icon: 'i-wallet' },
      { key: 'goal',   name: 'Meta',        icon: 'i-goal' },
      { key: 'chart',  name: 'Crecimiento', icon: 'i-chart' },
    ];
    const movesEl = document.getElementById('memoMoves');
    const pairsEl = document.getElementById('memoPairs');
    const winEl = document.getElementById('memoWin');
    const memoReset = document.getElementById('memoReset');
    let first = null, locked = false, moves = 0, pairs = 0;

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[k]] = [arr[k], arr[i]];
      }
      return arr;
    };
    const closedLabel = (i) => 'Carta ' + (i + 1) + ', boca abajo';

    const build = () => {
      first = null; locked = false; moves = 0; pairs = 0;
      movesEl.textContent = '0';
      pairsEl.textContent = '0';
      winEl.hidden = true;
      memoGrid.innerHTML = '';
      shuffle([...CARDS, ...CARDS]).forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mcard';
        b.dataset.key = c.key;
        b.dataset.name = c.name;
        b.setAttribute('aria-label', closedLabel(i));
        b.innerHTML =
          '<span class="mcard__in">' +
            '<span class="mcard__face mcard__back"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#coin"/></svg></span>' +
            '<span class="mcard__face mcard__front"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#' + c.icon + '"/></svg></span>' +
          '</span>';
        b.addEventListener('click', () => flip(b));
        memoGrid.appendChild(b);
      });
    };

    const flip = (card) => {
      if (locked || card.classList.contains('is-open') || card.classList.contains('is-matched')) return;
      card.classList.add('is-open');
      card.setAttribute('aria-label', card.dataset.name);
      if (!first) { first = card; return; }

      moves++;
      movesEl.textContent = String(moves);
      const a = first;
      first = null;

      if (a.dataset.key === card.dataset.key) {
        [a, card].forEach((c) => { c.classList.remove('is-open'); c.classList.add('is-matched'); });
        pairs++;
        pairsEl.textContent = String(pairs);
        if (pairs === CARDS.length) {
          winEl.hidden = false;
          burst(memoReset);
        }
      } else {
        locked = true;
        setTimeout(() => {
          [a, card].forEach((c) => {
            c.classList.remove('is-open');
            c.setAttribute('aria-label', closedLabel([...memoGrid.children].indexOf(c)));
          });
          locked = false;
        }, 850);
      }
    };

    memoReset.addEventListener('click', build);
    build();
  }
})();
