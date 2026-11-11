// ==========================================================================
// FEISHIN ALPHABET SCRUBBER (ENXUTO, ULTRA-RÁPIDO & DETERMINÍSTICO)
// Navegação A-Z Instantânea a 120Hz para Samsung Galaxy S22 Ultra
// ==========================================================================

(function() {
  if (typeof window === 'undefined') return;

  const ROW_HEIGHT = 66; // Altura exata de cada linha na tabela virtualizada do Feishin
  const ALPHABET = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '🌐'];

  // Índices reais da biblioteca de 1.865 músicas ordenadas alfabeticamente
  const SECTION_INDEX = {
    '#': 0,    'A': 36,   'B': 136,  'C': 235,  'D': 331,  'E': 430,
    'F': 513,  'G': 573,  'H': 627,  'I': 695,  'J': 786,  'K': 807,
    'L': 833,  'M': 932,  'N': 1060, 'O': 1114, 'P': 1159, 'Q': 1241,
    'R': 1250, 'S': 1310, 'T': 1524, 'U': 1655, 'V': 1685, 'W': 1726,
    'X': 1790, 'Y': 1796, 'Z': 1820, '🌐': 1827
  };

  class AlphabetScrubber {
    constructor() {
      this.currentLetter = null;
      this.hideTimer = null;
      this.init();
    }

    init() {
      const checkRoute = () => {
        const hash = window.location.hash || '';
        const isSongs = hash.includes('/library/songs');
        const tp = document.getElementById('feishin-track-page');
        const isTpOpen = Boolean(
          tp &&
          !tp.classList.contains('feishin-tp-hidden') &&
          tp.style.display !== 'none' &&
          tp.style.opacity !== '0'
        );
        const isFsOpen = Boolean(document.querySelector('.fs-full-screen-player-module-container')?.offsetParent);

        if (isSongs && !isTpOpen && !isFsOpen) {
          this.mount();
        } else {
          this.unmount();
        }
      };

      window.addEventListener('hashchange', checkRoute);
      setInterval(checkRoute, 500);
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        checkRoute();
      } else {
        window.addEventListener('DOMContentLoaded', checkRoute);
      }
    }

    mount() {
      let bar = document.getElementById('feishin-alphabet-scrubber');
      let hud = document.getElementById('feishin-alphabet-hud');

      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'feishin-alphabet-scrubber';
        bar.className = 'fs-az-scrubber';
        bar.innerHTML = ALPHABET.map(l => `<div class="fs-az-item" data-letter="${l}">${l}</div>`).join('');
        document.body.appendChild(bar);

        hud = document.createElement('div');
        hud.id = 'feishin-alphabet-hud';
        hud.className = 'fs-az-hud';
        hud.innerHTML = '<div class="fs-az-hud-badge">#</div>';
        document.body.appendChild(hud);

        this.bindEvents(bar, hud);
      }
      bar.style.display = 'flex';
    }

    unmount() {
      const bar = document.getElementById('feishin-alphabet-scrubber');
      const hud = document.getElementById('feishin-alphabet-hud');
      if (bar) bar.style.display = 'none';
      if (hud) hud.classList.remove('visible');
    }

    bindEvents(bar, hud) {
      const handleTouch = (e) => {
        if (e.cancelable) e.preventDefault();
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        if (clientY === null) return;

        const rect = bar.getBoundingClientRect();
        const progress = Math.max(0, Math.min(0.999, (clientY - rect.top) / rect.height));
        const idx = Math.floor(progress * ALPHABET.length);
        const letter = ALPHABET[idx];

        if (letter && letter !== this.currentLetter) {
          this.currentLetter = letter;

          // Feedback tátil
          try {
            if (navigator.vibrate) navigator.vibrate(8);
            else if (window.FeishinNative?.hapticFeedback) window.FeishinNative.hapticFeedback();
          } catch (_) {}

          // Atualizar barra e HUD
          bar.querySelectorAll('.fs-az-item').forEach(el => {
            el.classList.toggle('active', el.dataset.letter === letter);
          });
          const badge = hud.querySelector('.fs-az-hud-badge');
          if (badge) badge.textContent = letter;
          hud.classList.add('visible');

          // Rolar tabela virtualizada do Feishin
          const scroller = document.querySelector('.fs-item-table-list-module-height-100');
          const targetIndex = SECTION_INDEX[letter] !== undefined ? SECTION_INDEX[letter] : Math.floor(progress * 1865);
          if (scroller) {
            scroller.scrollTop = targetIndex * ROW_HEIGHT;
            scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
          }
        }
      };

      const handleEnd = () => {
        this.currentLetter = null;
        bar.classList.remove('dragging');
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
          hud.classList.remove('visible');
        }, 400);
      };

      bar.addEventListener('touchstart', (e) => { bar.classList.add('dragging'); handleTouch(e); }, { passive: false });
      bar.addEventListener('touchmove', handleTouch, { passive: false });
      bar.addEventListener('touchend', handleEnd);
      bar.addEventListener('touchcancel', handleEnd);

      bar.addEventListener('pointerdown', (e) => {
        bar.classList.add('dragging');
        handleTouch(e);
      });
      window.addEventListener('pointermove', (e) => {
        if (bar.classList.contains('dragging')) handleTouch(e);
      });
      window.addEventListener('pointerup', () => {
        if (bar.classList.contains('dragging')) handleEnd();
      });
    }
  }

  window.__FEISHIN_ALPHABET_SCRUBBER__ = new AlphabetScrubber();
})();
