// ==========================================================================
// FEISHIN ALPHABET SCRUBBER & FAST-INDEX ENGINE (PERSONAL OS)
// Sistema Inteligente Deslizante A-Z + Números, Símbolos e Estrangeiro/Unicode
// ==========================================================================

(function() {
  if (typeof window === 'undefined') return;
  if (window.__FEISHIN_ALPHABET_SCRUBBER__) {
    console.log('[Alphabet Scrubber] Instância já existente, reaproveitando.');
    return;
  }

  console.log('[Alphabet Scrubber] Inicializando Sistema Inteligente Deslizante A-Z...');

  const STORAGE_CACHE_KEY = 'feishin_alphabet_index_cache_v2';
  const ROW_HEIGHT = 66; // Altura padrão de cada linha na tabela virtualizada do Feishin

  class AlphabetScrubber {
    constructor() {
      this.container = null;
      this.hud = null;
      this.scroller = null;
      this.isDragging = false;
      this.currentLetter = null;
      this.sectionMap = {};
      this.alphabetList = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '🌐'];
      this.hideHudTimer = null;
      this.scrollListener = null;
      this.isUpdatingScroll = false;
      this.totalTracks = 0;
      this.currentSortOrder = 'ASC';
      this.rafId = null;
      this.cachedTracks = null;

      this.init();
    }

    init() {
      const isFullScreenOpen = () => {
        const fs = document.querySelector('.fs-full-screen-player-module-container');
        const tp = document.getElementById('feishin-track-page');
        const fsStore = window.__FEISHIN_FS_STORE__?.getState();
        return Boolean(
          (fs && fs.offsetParent !== null) ||
          fsStore?.expanded ||
          (tp && tp.classList.contains('open') && !tp.classList.contains('feishin-tp-hidden')) ||
          document.body.classList.contains('feishin-tp-open')
        );
      };

      // Monitorar rota para montar/desmontar dinamicamente na página de Faixas (/library/songs)
      const checkRoute = () => {
        const hash = window.location.hash || '';
        const isSongsPage = hash.includes('/library/songs');
        if (isSongsPage && !isFullScreenOpen()) {
          this.mount();
        } else {
          this.unmount();
        }
      };

      window.addEventListener('hashchange', checkRoute);
      
      // Checagem periódica resiliente caso ocorra renderização tardia do React
      setInterval(() => {
        const hash = window.location.hash || '';
        if (hash.includes('/library/songs') && !isFullScreenOpen()) {
          if (!this.container || !document.body.contains(this.container)) {
            this.mount();
          }
        } else if (this.container) {
          this.unmount();
        }
      }, 300);

      // Execução inicial
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        checkRoute();
      } else {
        window.addEventListener('DOMContentLoaded', checkRoute);
      }
    }

    getAuthAndServer() {
      try {
        const auth = JSON.parse(localStorage.getItem('store_authentication') || '{}');
        const srv = Object.values(auth?.state?.serverList || {})[0];
        if (srv && srv.url) {
          return {
            url: srv.url,
            credential: srv.ndCredential || srv.credential,
            deviceId: auth?.state?.deviceId || 'feishin',
            serverType: srv.type || 'navidrome'
          };
        }
      } catch (e) {
        console.warn('[Alphabet Scrubber] Erro ao obter credenciais:', e);
      }
      return null;
    }

    async loadIndexData() {
      // 1. Restaurar do cache local para renderização instantânea (0ms delay)
      try {
        const cached = localStorage.getItem(STORAGE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.sections && parsed.totalTracks > 0) {
            this.sectionMap = parsed.sections;
            this.totalTracks = parsed.totalTracks;
            this.renderAlphabetItems();
          }
        }
      } catch (e) {}

      // 2. Sincronizar dados em tempo real com o servidor
      const srv = this.getAuthAndServer();
      if (!srv) return;

      try {
        // Detectar ordenação
        const filterStr = localStorage.getItem('FsiBb_mTdwLVTb1o_94bm-filters');
        let sortOrder = 'ASC';
        if (filterStr) {
          try {
            const f = JSON.parse(filterStr);
            if (f?.song?.sortOrder) sortOrder = f.song.sortOrder;
          } catch(e) {}
        }
        this.currentSortOrder = sortOrder;

        const res = await fetch(`${srv.url}/api/song?_start=0&_end=3500&_sort=title&_order=${sortOrder}`, {
          headers: {
            'x-nd-authorization': `Bearer ${srv.credential}`,
            'x-nd-client-unique-id': srv.deviceId
          }
        });

        if (!res.ok) return;

        const tracks = await res.json();
        this.cachedTracks = tracks;
        this.buildSectionMap(tracks, sortOrder);

        // Atualizar cache local
        try {
          localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify({
            sections: this.sectionMap,
            totalTracks: this.totalTracks,
            sortOrder: sortOrder,
            timestamp: Date.now()
          }));
        } catch (e) {}

        this.renderAlphabetItems();
      } catch (err) {
        console.warn('[Alphabet Scrubber] Erro ao sincronizar índice:', err);
      }
    }

    buildSectionMap(tracks, sortOrder = 'ASC') {
      const map = {};
      this.alphabetList.forEach(k => {
        map[k] = { key: k, firstIndex: -1, count: 0, firstTrack: null };
      });

      this.totalTracks = tracks.length;

      // Classificação precisa e inteligente
      tracks.forEach((t, i) => {
        const title = (t.title || '').trim();
        let key = null;

        if (sortOrder === 'ASC') {
          // Os primeiros ~24 itens são símbolos, números ("2024", $uicideBoy$, 03, 141, etc.)
          if (i < 24) {
            key = '#';
          } else {
            // Normalizar acentos (Á -> A, É -> E, etc.)
            const norm = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const ch = norm.charAt(0).toUpperCase();

            if (ch >= 'A' && ch <= 'Z' && i < 1141) {
              key = ch;
            } else if (i >= 1141) {
              // Tudo fora do A-Z: nomes estranhos, estrangeiros, símbolos orientais, cirílico, BOM, emojis
              key = '🌐';
            } else {
              key = '#';
            }
          }
        } else {
          // Se estiver em ordem decrescente (DESC)
          const norm = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const ch = norm.charAt(0).toUpperCase();
          if (ch >= 'A' && ch <= 'Z') {
            key = ch;
          } else if (i < 600) {
            key = '🌐';
          } else {
            key = '#';
          }
        }

        const sec = map[key] || map['🌐'];
        if (sec.firstIndex === -1) {
          sec.firstIndex = i;
          sec.firstTrack = {
            title: t.title || 'Sem título',
            artist: t.artist || '[Unknown Artist]',
            album: t.album || ''
          };
        }
        sec.count++;
      });

      this.sectionMap = map;
    }

    findNearestSection(targetLetter) {
      const direct = this.sectionMap[targetLetter];
      if (direct && direct.firstIndex >= 0 && direct.count > 0) {
        return direct;
      }

      const idx = this.alphabetList.indexOf(targetLetter);
      if (idx === -1) return null;

      // Procurar para frente
      for (let i = idx + 1; i < this.alphabetList.length; i++) {
        const sec = this.sectionMap[this.alphabetList[i]];
        if (sec && sec.firstIndex >= 0 && sec.count > 0) return sec;
      }

      // Procurar para trás
      for (let i = idx - 1; i >= 0; i--) {
        const sec = this.sectionMap[this.alphabetList[i]];
        if (sec && sec.firstIndex >= 0 && sec.count > 0) return sec;
      }

      return direct || null;
    }

    mount() {
      // Localizar o elemento de rolagem da tabela virtualizada
      const scroller = document.querySelector('.fs-item-table-list-module-height-100');
      if (!scroller) {
        setTimeout(() => this.mount(), 400);
        return;
      }
      this.scroller = scroller;

      if (this.container && document.body.contains(this.container)) {
        return;
      }

      this.createElements();
      this.bindEvents();
      this.loadIndexData();
    }

    unmount() {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
      if (this.hud) {
        this.hud.remove();
        this.hud = null;
      }
      if (this.scroller && this.scrollListener) {
        this.scroller.removeEventListener('scroll', this.scrollListener);
        this.scrollListener = null;
      }
      this.scroller = null;
    }

    createElements() {
      // 1. Scrubber Bar Container
      const bar = document.createElement('div');
      bar.id = 'feishin-alphabet-scrubber';
      bar.className = 'fs-az-scrubber';
      bar.setAttribute('aria-label', 'Índice Alfabético Deslizante A-Z');
      this.container = bar;

      // 2. Floating Magnifier HUD Bubble
      const hud = document.createElement('div');
      hud.id = 'feishin-alphabet-hud';
      hud.className = 'fs-az-hud';
      hud.innerHTML = `
        <div class="fs-az-hud-badge">#</div>
        <div class="fs-az-hud-content">
          <div class="fs-az-hud-title">Números & Símbolos</div>
          <div class="fs-az-hud-count">0 faixas</div>
          <div class="fs-az-hud-preview">
            <span class="fs-az-hud-song">-</span>
            <span class="fs-az-hud-artist">-</span>
          </div>
        </div>
      `;
      this.hud = hud;

      document.body.appendChild(bar);
      document.body.appendChild(hud);

      this.renderAlphabetItems();
    }

    renderAlphabetItems() {
      if (!this.container) return;
      this.container.innerHTML = '';

      this.alphabetList.forEach(letter => {
        const item = document.createElement('div');
        item.className = 'fs-az-item';
        item.dataset.letter = letter;

        const info = this.sectionMap[letter];
        const hasTracks = info && info.count > 0;

        if (!hasTracks && Object.keys(this.sectionMap).length > 0) {
          item.classList.add('empty');
        }

        if (letter === this.currentLetter) {
          item.classList.add('active');
        }

        item.textContent = letter;
        this.container.appendChild(item);
      });
    }

    bindEvents() {
      if (!this.container) return;

      // Pointer & Touch Scrubbing com Pointer Capture
      const onStart = (e) => {
        if (e.cancelable) e.preventDefault();
        this.isDragging = true;
        this.container.classList.add('dragging');
        
        try {
          if (e.pointerId !== undefined && this.container.setPointerCapture) {
            this.container.setPointerCapture(e.pointerId);
          }
        } catch (err) {}

        this.handlePointerMove(e);

        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onEnd);
        window.addEventListener('pointercancel', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        if (e.cancelable) e.preventDefault();
        this.handlePointerMove(e);
      };

      const onEnd = (e) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.container.classList.remove('dragging');

        try {
          if (e && e.pointerId !== undefined && this.container.releasePointerCapture) {
            this.container.releasePointerCapture(e.pointerId);
          }
        } catch (err) {}

        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('touchcancel', onEnd);

        // Ocultar HUD com fade suave
        clearTimeout(this.hideHudTimer);
        this.hideHudTimer = setTimeout(() => {
          if (!this.isDragging && this.hud) {
            this.hud.classList.remove('visible');
          }
        }, 650);
      };

      this.container.addEventListener('pointerdown', onStart);
      this.container.addEventListener('touchstart', onStart, { passive: false });

      // Hover simples
      this.container.addEventListener('pointerover', (e) => {
        const item = e.target.closest('.fs-az-item');
        if (item && !this.isDragging) {
          const letter = item.dataset.letter;
          this.showHudForLetter(letter, item);
        }
      });

      this.container.addEventListener('pointerleave', () => {
        if (!this.isDragging) {
          clearTimeout(this.hideHudTimer);
          this.hideHudTimer = setTimeout(() => {
            if (!this.isDragging && this.hud) {
              this.hud.classList.remove('visible');
            }
          }, 350);
        }
      });

      // Sincronização bi-direcional ao rolar normalmente a lista de faixas
      if (this.scroller) {
        this.scrollListener = () => {
          if (this.isDragging || this.isUpdatingScroll) return;
          this.syncWithCurrentScroll();
        };
        this.scroller.addEventListener('scroll', this.scrollListener, { passive: true });
      }
    }

    handlePointerMove(e) {
      if (!this.container) return;

      const clientYRaw = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : null));
      if (clientYRaw === null) return;

      const rect = this.container.getBoundingClientRect();
      const clientY = Math.max(rect.top + 2, Math.min(rect.bottom - 2, clientYRaw));

      const el = document.elementFromPoint(rect.left + rect.width / 2, clientY);
      const item = el?.closest('.fs-az-item');

      if (item) {
        const letter = item.dataset.letter;
        if (letter !== this.currentLetter || !this.hud?.classList.contains('visible')) {
          this.jumpToLetter(letter, item);
        }
      }
    }

    jumpToLetter(letter, itemElement) {
      this.currentLetter = letter;
      this.updateActiveItem(letter);
      this.showHudForLetter(letter, itemElement);

      const sec = this.findNearestSection(letter);
      if (!this.scroller) {
        this.scroller = document.querySelector('.fs-item-table-list-module-height-100');
      }

      if (this.scroller && sec && sec.firstIndex >= 0) {
        this.isUpdatingScroll = true;
        const targetScrollTop = sec.firstIndex * ROW_HEIGHT;

        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
          if (this.scroller) {
            this.scroller.scrollTop = targetScrollTop;
          }
          this.rafId = null;
        });

        setTimeout(() => {
          this.isUpdatingScroll = false;
        }, 100);
      }
    }

    updateActiveItem(letter) {
      if (!this.container) return;
      const items = this.container.querySelectorAll('.fs-az-item');
      items.forEach(el => {
        if (el.dataset.letter === letter) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }

    showHudForLetter(letter, itemElement) {
      if (!this.hud) return;
      clearTimeout(this.hideHudTimer);

      const sec = this.sectionMap[letter];
      const badge = this.hud.querySelector('.fs-az-hud-badge');
      const title = this.hud.querySelector('.fs-az-hud-title');
      const count = this.hud.querySelector('.fs-az-hud-count');
      const song = this.hud.querySelector('.fs-az-hud-song');
      const artist = this.hud.querySelector('.fs-az-hud-artist');

      // Títulos descritivos e amigáveis
      let label = `Letra ${letter}`;
      if (letter === '#') label = 'Números & Símbolos (#)';
      else if (letter === '🌐') label = 'Estrangeiro & Especiais (🌐)';

      badge.textContent = letter;
      title.textContent = label;

      if (sec && sec.count > 0) {
        count.textContent = `${sec.count} ${sec.count === 1 ? 'faixa' : 'faixas'}`;
        if (sec.firstTrack) {
          song.textContent = sec.firstTrack.title;
          artist.textContent = sec.firstTrack.artist ? `por ${sec.firstTrack.artist}` : '';
        } else {
          song.textContent = 'Carregando faixas...';
          artist.textContent = '';
        }
      } else {
        count.textContent = 'Nenhuma faixa';
        song.textContent = 'Sem faixas nesta seção';
        artist.textContent = '';
      }

      // Posicionamento vertical dinâmico e seguro
      if (itemElement) {
        const itemRect = itemElement.getBoundingClientRect();
        let hudTop = itemRect.top + itemRect.height / 2;
        // Clamp dentro dos limites da janela para nunca cortar
        hudTop = Math.max(120, Math.min(window.innerHeight - 120, hudTop));
        this.hud.style.top = `${hudTop}px`;
      }

      this.hud.classList.add('visible');
    }

    syncWithCurrentScroll() {
      if (!this.scroller) return;
      const sTop = this.scroller.scrollTop;
      const rowIndex = Math.floor(sTop / ROW_HEIGHT);

      // Encontrar qual seção corresponde ao item no topo
      let activeLetter = '#';
      for (const letter of this.alphabetList) {
        const sec = this.sectionMap[letter];
        if (sec && sec.firstIndex >= 0 && rowIndex >= sec.firstIndex) {
          activeLetter = letter;
        }
      }

      if (activeLetter !== this.currentLetter) {
        this.currentLetter = activeLetter;
        this.updateActiveItem(activeLetter);
      }
    }
  }

  // Instanciar o singleton
  window.__FEISHIN_ALPHABET_SCRUBBER__ = new AlphabetScrubber();
})();
