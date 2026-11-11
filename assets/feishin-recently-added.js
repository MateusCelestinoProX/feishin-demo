// ==========================================================================
// FEISHIN ULTRA-PREMIUM APPLE GLASS — RECENTLY ADDED (HIERARQUIA CRONOLÓGICA)
// Alocação Hierárquica Estrita por Samsung Music / MediaStore Android (date_modified DESC)
// Suporte Nativo Responsivo para Desktop macOS e Dispositivos Mobile Android
// ==========================================================================

(function() {
  console.log('[Recently Added Engine] Inicializando Adicionadas Recentemente (Samsung Music MediaStore Chronology)...');

  const STORAGE_CACHE_KEY = 'feishin_recently_added_cache_v8_samsung_authentic';

  let cachedSongs = [];
  let totalRecordCount = 0;
  let isFetching = false;
  let searchQuery = '';
  let isMounting = false;
  let mountDebounceTimer = null;
  let lastCheckedHash = '';

  // 1. Credentials & Auth Helper (Zero-Scan Cached)
  let cachedAuthInfo = null;
  function getAuthInfo() {
    if (cachedAuthInfo && cachedAuthInfo.url && cachedAuthInfo.cred) {
      return cachedAuthInfo;
    }
    let url = null;
    let cred = null;
    let serverId = null;
    let serverType = 'subsonic';
    let token = null;

    try {
      const auth = JSON.parse(localStorage.getItem('store_authentication') || '{}');
      const s = auth?.state?.currentServer;
      url = s?.url;
      serverId = s?.id;
      cred = s?.credential;
      serverType = s?.type || 'subsonic';
      token = s?.ndCredential || s?.token;
    } catch (e) {}

    if (!cred || !serverId || !url) {
      const root = document.querySelector('#root');
      if (root) {
        function scan(f, d = 0) {
          if (!f || d > 60 || cred) return;
          if (f.memoizedState) {
            let st = f.memoizedState;
            while (st) {
              if (st.memoizedState?.credential) {
                cred = st.memoizedState.credential;
                break;
              }
              st = st.next;
            }
          }
          if (f.child) scan(f.child, d + 1);
          if (f.sibling) scan(f.sibling, d + 1);
        }
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
        if (fiberKey) scan(root[fiberKey]);
      }
    }

    // Fallback para servidor ativo Feishin Cloud Demo se não encontrado
    if (!url) url = '.';
    if (!cred) cred = 'u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json';
    if (!serverId) serverId = 'FsiBb_mTdwLVTb1o_94bm';

    cachedAuthInfo = { url, cred, serverId, serverType, token };
    return cachedAuthInfo;
  }

  function getCoverUrl(imageId) {
    if (!imageId) return '';
    const { url, cred } = getAuthInfo();
    if (url && cred) {
      const cleanId = imageId.startsWith('mf-') ? imageId : (imageId.length === 22 ? ('mf-' + imageId) : imageId);
      return `${url}/rest/getCoverArt.view?id=${encodeURIComponent(cleanId)}&${cred}&v=1.13.0&c=Feishin&size=300`;
    }
    return '';
  }

  // Baseline de corte: 31 de Outubro de 2026 às 22:00:00 (após as 11 novas faixas do SnapTube)
  const SAMSUNG_BASELINE_CUTOFF_MS = 1793494800000;

  function cleanKey(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\ufeff/g, '')
      .replace(/\(.*?\)|\[.*?\]|_|-|"|\ufeff/g, ' ')
      .replace(/feat\..*?|ft\..*?|official.*?|video|audio|lyrics|slowed|reverb|remastered|mp3.*|m4a.*|opus.*/g, ' ')
      .replace(/[^a-z0-9]/g, ' ')
      .trim().replace(/\s+/g, ' ');
  }

  function getChronoEntry(s) {
    if (!s) return null;
    if (window.__SAMSUNG_MUSIC_CHRONOLOGY__?.[s.id]) {
      return window.__SAMSUNG_MUSIC_CHRONOLOGY__[s.id];
    }
    const byTitle = window.__SAMSUNG_MUSIC_BY_TITLE__;
    if (!byTitle) return null;

    const kTitle = cleanKey(s.title || s.name);
    if (kTitle && byTitle[kTitle]) return byTitle[kTitle];

    const kFull1 = cleanKey((s.artist || s.artistName || '') + ' ' + (s.title || s.name || ''));
    if (kFull1 && byTitle[kFull1]) return byTitle[kFull1];

    const kFull2 = cleanKey((s.title || s.name || '') + ' ' + (s.artist || s.artistName || ''));
    if (kFull2 && byTitle[kFull2]) return byTitle[kFull2];

    return null;
  }

  function normalizeSong(s, serverId, serverType = 'subsonic') {
    const durSec = s.duration || 0;
    const durMs = durSec > 10000 ? durSec : Math.round(durSec * 1000);
    const chrono = getChronoEntry(s);

    let rank = 999999;
    let creationTime = s.created || s.birthTime || s.createdAt || s.updatedAt || '1970-01-01T00:00:00Z';
    let formattedDate = null;
    let isSamsungOrder = false;
    let isNewArrival = false;
    let sortTimestamp = 0;

    const rawTime = new Date(creationTime).getTime();
    const validTime = isNaN(rawTime) ? 0 : rawTime;

    if (chrono && typeof chrono.rank === 'number' && chrono.rank < 999999) {
      rank = chrono.rank;
      if (chrono.isoDate) creationTime = chrono.isoDate;
      if (chrono.formatted) formattedDate = chrono.formatted;
      else if (chrono.date_modified) {
        const cd = new Date(chrono.date_modified * 1000);
        const day = String(cd.getDate()).padStart(2, '0');
        const mo = String(cd.getMonth() + 1).padStart(2, '0');
        const yr = cd.getFullYear();
        const hr = String(cd.getHours()).padStart(2, '0');
        const min = String(cd.getMinutes()).padStart(2, '0');
        formattedDate = `${day}/${mo}/${yr} às ${hr}:${min}`;
      }
      isSamsungOrder = true;
      isNewArrival = false;
      sortTimestamp = (chrono.date_modified ? chrono.date_modified * 1000 : validTime) || 0;
    } else if (validTime >= SAMSUNG_BASELINE_CUTOFF_MS) {
      // Faixa adicionada após o baseline cronológico do Samsung Music (Nova Adição no Topo)
      isSamsungOrder = false;
      isNewArrival = true;
      rank = -1;
      formattedDate = formatCreationDate(creationTime, null);
      sortTimestamp = validTime;
    } else {
      isSamsungOrder = false;
      isNewArrival = false;
      rank = 999999;
      formattedDate = formatCreationDate(creationTime, null);
      sortTimestamp = validTime;
    }

    const coverId = s.coverArt || s.imageId || (s.id ? ('mf-' + s.id) : s.id);
    const cleanTitle = (s.title || s.name || 'Faixa').replace(/^\uFEFF+/, '').trim();
    const cleanArtist = (s.artist || s.artistName || (s.artists?.[0]?.name) || '[Unknown Artist]').replace(/^\uFEFF+/, '').trim();
    const cleanAlbum = (s.album || s.albumName || '').replace(/^\uFEFF+/, '').trim();

    return {
      id: s.id,
      name: cleanTitle,
      title: cleanTitle,
      artistName: cleanArtist,
      album: cleanAlbum,
      albumId: s.albumId || s.parent || s.id,
      duration: durMs,
      imageId: coverId,
      thumbHash: s.thumbHash || null,
      birthTime: s.birthTime || s.created || null,
      createdAt: s.createdAt || s.created || null,
      creationTime: creationTime,
      sortTimestamp: sortTimestamp,
      rank: rank,
      formattedDate: formattedDate,
      isSamsungOrder: isSamsungOrder,
      isNewArrival: isNewArrival,
      year: s.year || (s.releaseDate ? new Date(s.releaseDate).getFullYear() : null),
      _serverId: s._serverId || serverId,
      _serverType: s._serverType || serverType || 'subsonic',
      _itemType: 'song',
      _uniqueId: 'ra_' + s.id + '_' + Date.now()
    };
  }

  // Função unificada de ordenação: preserva novas adições no topo absoluto e o histórico ordinal Samsung Music (MediaStore)
  function sortChronologically(songs) {
    songs.sort((a, b) => {
      // 1. Novas faixas adicionadas após o baseline (isNewArrival) têm prioridade absoluta no topo
      if (a.isNewArrival && b.isNewArrival) {
        return b.sortTimestamp - a.sortTimestamp;
      }
      if (a.isNewArrival && !b.isNewArrival) return -1;
      if (!a.isNewArrival && b.isNewArrival) return 1;

      // 2. Ordem autêntica da cronologia Samsung Music (MediaStore) por rank ordinal crescente (0, 1, 2...)
      const aRank = (a.isSamsungOrder && typeof a.rank === 'number') ? a.rank : 999999;
      const bRank = (b.isSamsungOrder && typeof b.rank === 'number') ? b.rank : 999999;

      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return b.sortTimestamp - a.sortTimestamp;
    });
  }

  // 2. High-Performance Full Library Ingestion Sorted by Samsung Music MediaStore Order
  async function loadInitialSongs(force = false) {
    if (isFetching) return;
    isFetching = true;

    // Purge legacy caches to eliminate corrupted state
    const LEGACY_CACHE_KEYS = [
      'feishin_recently_added_cache_v1',
      'feishin_recently_added_cache_v2',
      'feishin_recently_added_cache_v3',
      'feishin_recently_added_cache_v5_samsung',
      'feishin_recently_added_cache_v6_mobile_samsung',
      'feishin_recently_added_cache_v7_mobile_samsung'
    ];
    LEGACY_CACHE_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    const { url, cred, serverId, serverType } = getAuthInfo();

    // 1. Carregamento imediato via cache local / memória (0ms delay)
    if (cachedSongs.length === 0 && !force) {
      try {
        const saved = localStorage.getItem(STORAGE_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedSongs = parsed.map(s => normalizeSong(s, serverId, serverType));
            sortChronologically(cachedSongs);
            totalRecordCount = cachedSongs.length;
            renderViewContent();
            // Stale-While-Revalidate: exibe instantâneo e continua para buscar novidades do servidor
          }
        }
      } catch (e) {}
    }

    // 2. Ingestão e enriquecimento de metadados completos via Subsonic API
    try {
      if (url && cred) {
        const r = await fetch(`${url}/rest/search3.view?query=&songCount=5000&songOffset=0&${cred}&v=1.13.0&c=Feishin&f=json`, {
          signal: AbortSignal.timeout(8000)
        });
        const data = await r.json();
        const rawSongs = data?.['subsonic-response']?.searchResult3?.song || [];

        if (Array.isArray(rawSongs) && rawSongs.length > 0) {
          const freshSongs = rawSongs.map(s => normalizeSong(s, serverId, serverType));
          sortChronologically(freshSongs);

          const isCountDifferent = freshSongs.length !== cachedSongs.length;
          const isTopDifferent = freshSongs[0]?.id !== cachedSongs[0]?.id;

          cachedSongs = freshSongs;
          totalRecordCount = cachedSongs.length;

          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cachedSongs.slice(0, 2000)));
          } catch (e) {}

          if (isCountDifferent || isTopDifferent || force || !document.getElementById('feishin-recently-added-view')) {
            renderViewContent();
          }
          isFetching = false;
          return;
        }
      }
    } catch (e) {
      console.warn('[Recently Added] Busca remota Subsonic falhou ou timeout, usando fallback local:', e);
    }

    // 3. Fallback imediato se cache vazio e offline: cronologia empacotada localmente
    if (cachedSongs.length === 0 && window.__SAMSUNG_MUSIC_CHRONOLOGY__) {
      try {
        const chrono = window.__SAMSUNG_MUSIC_CHRONOLOGY__;
        const chronoSongs = Object.keys(chrono).map(id => {
          const item = chrono[id];
          return {
            id: id,
            title: item.filename ? item.filename.replace(/\.mp3$/i, '').replace(/\(MP3_320K\)/i, '') : 'Faixa',
            duration: 0,
            date_modified: item.date_modified,
            rank: item.rank,
            formattedDate: item.formatted
          };
        });
        if (chronoSongs.length > 0) {
          cachedSongs = chronoSongs.map(s => normalizeSong(s, serverId, serverType));
          sortChronologically(cachedSongs);
          totalRecordCount = cachedSongs.length;
          renderViewContent();
        }
      } catch (e) {}
    }

    if (cachedSongs.length > 0) {
      renderViewContent();
    }

    isFetching = false;
  }

  // 3. Playback Helpers & Track Context Dialog
  let lastContextMenuCallTime = 0;

  function cleanItem(s) {
    const { serverId, serverType } = getAuthInfo();
    return {
      ...s,
      id: s.id,
      name: s.name || s.title || 'Faixa',
      title: s.name || s.title || 'Faixa',
      artistName: s.artistName || (s.artists?.[0]?.name) || '[Unknown Artist]',
      album: s.album || s.albumName || '',
      albumId: s.albumId || s.parent || s.id,
      duration: s.duration,
      imageId: s.imageId || (s.id ? ('mf-' + s.id) : s.id),
      thumbHash: s.thumbHash || null,
      _serverId: s._serverId || serverId,
      _serverType: s._serverType || serverType || 'subsonic',
      _itemType: 'song',
      _uniqueId: 'ra_' + s.id + '_' + Math.random().toString(36).slice(2, 9)
    };
  }

  function openTrackContextMenu(song, event, row) {
    if (!song) return;

    // Guard contra disparos multiplos ou concorrentes em janela curta (< 650ms)
    const now = Date.now();
    if (now - lastContextMenuCallTime < 650) {
      return;
    }
    lastContextMenuCallTime = now;

    const targetSong = cleanItem(song);

    // 1. Atualizar lastTargetRow para rastreamento nos motores auxiliares (Delete, TrackEditor, Tags)
    if (row) {
      if (window.FeishinDeleteEngine) window.FeishinDeleteEngine.lastTargetRow = row;
      if (window.FeishinTrackEditor) window.FeishinTrackEditor.lastTargetRow = row;
      if (window.TagsEngine) window.TagsEngine.lastTargetRow = row;
    }

    const clientX = (event && typeof event.clientX === 'number') ? event.clientX : (window.innerWidth / 2);
    const clientY = (event && typeof event.clientY === 'number') ? event.clientY : (window.innerHeight / 2);

    // Limpar preventivamente qualquer menu Radix fantasma ou backdrop anterior
    document.querySelectorAll('[role="menu"], [data-radix-menu-content], [data-radix-popper-content-wrapper], #feishin-context-backdrop, #ra-glass-context-dialog-backdrop').forEach(el => {
      try { el.remove(); } catch (e) {}
    });

    // 2. Invocar o Modal Oficial Radix do Feishin (o mesmo exibido na página de Faixas)
    const contextModal = window.__FEISHIN_CONTEXT_MODAL__;
    if (contextModal && typeof contextModal.call === 'function') {
      try {
        contextModal.call({
          cmd: {
            items: [targetSong],
            type: 'song'
          },
          event: {
            clientX,
            clientY,
            preventDefault: () => {
              if (event?.preventDefault) event.preventDefault();
            }
          }
        });
        return;
      } catch (err) {
        console.warn('[Recently Added] Nota ao acionar ContextModal oficial do Feishin:', err);
      }
    }

    // 3. Fallback profissional e nativo com Liquid Glass caso o core do React ainda esteja instanciando
    showFallbackGlassDialog(targetSong, row);
  }

  function showFallbackGlassDialog(song, row) {
    const existing = document.getElementById('ra-glass-context-dialog-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'ra-glass-context-dialog-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.62);
      backdrop-filter: blur(14px) saturate(180%);
      -webkit-backdrop-filter: blur(14px) saturate(180%);
      z-index: 100002;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const coverUrl = getCoverUrl(song.imageId || song.id);
    const title = song.name || song.title || 'Faixa';
    const artist = song.artistName || '[Unknown Artist]';
    const album = song.album || '—';

    const card = document.createElement('div');
    card.id = 'ra-glass-context-dialog-card';
    card.style.cssText = `
      width: min(22rem, 90vw);
      max-height: 85vh;
      background: rgba(18, 14, 28, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 24px;
      box-shadow: 0 28px 64px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(167, 139, 250, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.92);
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    `;

    card.innerHTML = `
      <!-- Track Header Preview -->
      <div style="padding: 18px 18px 14px 18px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03);">
        <div style="width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: rgba(255, 255, 255, 0.06); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);">
          ${coverUrl ? `<img src="${coverUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:20px;">🎵</div>`}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px;">${escapeHtml(title)}</div>
          <div style="font-size: 12.5px; color: rgba(255, 255, 255, 0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${escapeHtml(artist)}</div>
        </div>
      </div>

      <!-- Action Items List -->
      <div style="padding: 8px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
        <button type="button" class="ra-ctx-btn" data-action="play-now" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 14px; border: none; background: transparent; color: #fff; font-size: 13.5px; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="color: #A78BFA; flex-shrink: 0;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Reproduzir Agora</span>
        </button>

        <button type="button" class="ra-ctx-btn" data-action="play-next" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 14px; border: none; background: transparent; color: #fff; font-size: 13.5px; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #A78BFA; flex-shrink: 0;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          <span>Reproduzir a Seguir</span>
        </button>

        <button type="button" class="ra-ctx-btn" data-action="add-queue" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 14px; border: none; background: transparent; color: #fff; font-size: 13.5px; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #A78BFA; flex-shrink: 0;"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <span>Adicionar ao Fim da Fila</span>
        </button>

        <div style="height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 6px;"></div>

        <button type="button" class="ra-ctx-btn" data-action="tags" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 14px; border: none; background: transparent; color: #fff; font-size: 13.5px; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          <span>Gerenciar Tags</span>
        </button>

        <button type="button" class="ra-ctx-btn" data-action="edit" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 14px; border: none; background: transparent; color: #fff; font-size: 13.5px; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Editar Faixa</span>
        </button>

        <div style="height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 6px;"></div>

        <button type="button" class="ra-ctx-btn" data-action="delete" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 14px; border: none; background: transparent; color: #FF4D4F; font-size: 13.5px; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FF4D4F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          <span>Excluir Faixa</span>
        </button>
      </div>

      <!-- Footer Cancel -->
      <div style="padding: 10px 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.2); text-align: center;">
        <button type="button" id="ra-ctx-btn-cancel" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7); font-size: 13px; font-weight: 600; cursor: pointer;">Cancelar</button>
      </div>
    `;

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    requestAnimationFrame(() => {
      backdrop.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });

    const closeDialog = () => {
      backdrop.style.opacity = '0';
      card.style.transform = 'scale(0.92)';
      setTimeout(() => backdrop.remove(), 220);
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDialog();
    });

    card.querySelector('#ra-ctx-btn-cancel')?.addEventListener('click', closeDialog);

    // Hover / active styling
    card.querySelectorAll('.ra-ctx-btn').forEach(btn => {
      btn.addEventListener('touchstart', () => { btn.style.background = 'rgba(255, 255, 255, 0.08)'; }, { passive: true });
      btn.addEventListener('touchend', () => { btn.style.background = 'transparent'; }, { passive: true });
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255, 255, 255, 0.08)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
    });

    // Ações
    card.querySelector('[data-action="play-now"]')?.addEventListener('click', () => {
      closeDialog();
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      playTrack(song, getDisplayedSongs());
    });

    card.querySelector('[data-action="play-next"]')?.addEventListener('click', () => {
      closeDialog();
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
      if (store) store.addToQueueByType([song], 'next');
    });

    card.querySelector('[data-action="add-queue"]')?.addEventListener('click', () => {
      closeDialog();
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
      if (store) store.addToQueueByType([song], 'last');
    });

    card.querySelector('[data-action="tags"]')?.addEventListener('click', () => {
      closeDialog();
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      if (window.TagsEngine) {
        window.TagsEngine.lastTargetRow = row;
        window.TagsEngine.openEditTagsModal(song);
      }
    });

    card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      closeDialog();
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      if (window.FeishinTrackEditor) {
        window.FeishinTrackEditor.lastTargetRow = row;
        window.FeishinTrackEditor.open(song);
      }
    });

    card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      closeDialog();
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      if (window.FeishinDeleteEngine) {
        window.FeishinDeleteEngine.lastTargetRow = row;
        window.FeishinDeleteEngine.openConfirmModal({
          id: song.id,
          title: song.name || song.title,
          artist: song.artistName,
          path: song.path
        }, async () => {
          await window.FeishinDeleteEngine.executeDelete(song);
        });
      }
    });
  }

  function playTrack(song, playlist = null, startIndex = -1) {
    if (window.FeishinLocalMode?.active && !window.FeishinLocalMode.isLocal(song.id)) {
      if (window.AndroidBridge && typeof window.AndroidBridge.showToast === 'function') {
        window.AndroidBridge.showToast('⚠️ Faixa indisponível localmente nesta máquina (Local Mode ativo)');
      }
      return;
    }

    const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
    if (!store) {
      console.warn('[Recently Added] Player Store indisponível');
      return;
    }

    const targetSongItem = cleanItem(song);

    if (playlist && playlist.length > 0) {
      let targetIndex = (typeof startIndex === 'number' && startIndex >= 0 && playlist[startIndex]?.id === song.id)
        ? startIndex
        : playlist.findIndex(s => s.id === song.id);

      let targetList = playlist;
      if (targetIndex === -1) {
        targetList = [song, ...playlist];
        targetIndex = 0;
      }

      const queueItems = targetList.map(cleanItem);
      // Fix cirúrgico: Assegura correspondência exata do item clicado no índice da fila
      queueItems[targetIndex] = targetSongItem;
      store.setQueue(queueItems, targetIndex);
    } else {
      store.addToQueueByType([targetSongItem], 'now', targetSongItem.id);
    }

    setTimeout(renderActiveTrackIndicator, 150);
  }

  function playAll(shuffle = false) {
    const list = getDisplayedSongs();
    if (list.length === 0) return;
    
    let songsToPlay = [...list];
    if (shuffle) {
      for (let i = songsToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songsToPlay[i], songsToPlay[j]] = [songsToPlay[j], songsToPlay[i]];
      }
    }
    playTrack(songsToPlay[0], songsToPlay, 0);
  }

  function playGroup(groupKey) {
    const groups = groupSongsByCreationHierarchy(getFilteredSongs());
    const group = groups.find(g => g.key === groupKey);
    if (group && group.songs.length > 0) {
      playTrack(group.songs[0], group.songs, 0);
    }
  }

  // 4. Date Utilities & Hierarchical Clustering (Samsung Music Authentic Hierarchy)
  function formatCreationDate(dateStr, song = null) {
    if (song?.formattedDate) {
      return song.formattedDate;
    }
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    if (isToday) return `Hoje às ${hours}:${mins}`;
    if (isYesterday) return `Ontem às ${hours}:${mins}`;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year} às ${hours}:${mins}`;
  }

  function formatDuration(durMs) {
    if (!durMs) return '0:00';
    let totalSec = Math.round(durMs > 10000 ? durMs / 1000 : durMs);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function isMobileLayout() {
    return window.innerWidth <= 768 || !!document.getElementById('mobile-layout') || !!window.AndroidBridge;
  }

  function groupSongsByCreationHierarchy(songs) {
    const groups = new Map();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dayNames = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    const now = new Date();

    songs.forEach(song => {
      let key = '';
      let title = '';
      let subtitle = '';
      let icon = '📁';

      const d = new Date(song.creationTime);
      const isInvalid = isNaN(d.getTime());
      const songDate = isInvalid ? new Date() : d;
      const year = songDate.getFullYear();
      const month = songDate.getMonth();
      const day = songDate.getDate();

      if (isInvalid || (!song.isSamsungOrder && !song.isNewArrival) || song.rank >= 999999) {
        key = 'group-other';
        title = 'Outras Faixas';
        subtitle = 'Sem data registrada no catálogo histórico';
        icon = '📁';
      } else if (year >= 2026 && (year > 2026 || month >= 9)) {
        // Faixas recentes (Outubro de 2026 em diante e todas as novas adições futuras)
        key = `group-day-${year}-${month + 1}-${day}`;
        title = `${day} de ${monthNames[month]} de ${year}`;
        const dow = dayNames[songDate.getDay()];

        const isToday = songDate.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = songDate.toDateString() === yesterday.toDateString();

        if (isToday) {
          title = `Hoje (${day} de ${monthNames[month]})`;
          subtitle = `${dow} • Adicionadas recentemente no dispositivo`;
          icon = '⚡';
        } else if (isYesterday) {
          title = `Ontem (${day} de ${monthNames[month]})`;
          subtitle = `${dow} • Adicionadas recentemente no dispositivo`;
          icon = '⚡';
        } else {
          subtitle = `${dow} • Linha temporal contínua Samsung Music`;
          icon = (day >= 20) ? '⚡' : (day >= 10 ? '✨' : '🔥');
        }
      } else if (year === 2025) {
        key = 'group-year-2025';
        title = 'Ano de 2025';
        subtitle = 'Arquivos criados em 2025';
        icon = '📁';
      } else {
        key = `group-month-${year}-${month + 1}`;
        title = `${monthNames[month]} de ${year}`;
        subtitle = `Arquivos de ${monthNames[month]}`;
        icon = (year === 2026 && month === 8) ? '🗓️' : '📁';
      }

      if (!groups.has(key)) {
        groups.set(key, { key, title, subtitle, icon, songs: [] });
      }
      groups.get(key).songs.push(song);
    });

    return Array.from(groups.values());
  }

  function getFilteredSongs() {
    let songs = cachedSongs;
    if (window.FeishinLocalMode?.active) {
      songs = songs.filter(s => window.FeishinLocalMode.isLocal(s.id));
    }
    if (!searchQuery || !searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase().trim();
    return songs.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.artistName || '').toLowerCase().includes(q) ||
      (s.album || '').toLowerCase().includes(q)
    );
  }

  function getDisplayedSongs() {
    const groups = groupSongsByCreationHierarchy(getFilteredSongs());
    return groups.flatMap(g => g.songs);
  }

  function getCurrentPlayingSongId() {
    try {
      const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
      return (store?.getCurrentSong?.() || store?.player?.currentSong)?.id || null;
    } catch (e) {
      return null;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 5. Renderers: Hero Header + Hierarchical Tracklist (Clean, Responsive & Fast)
  function renderHeroHeaderHtml(total, filteredCount) {
    const isLocal = Boolean(window.FeishinLocalMode?.active);
    const isFiltering = searchQuery && searchQuery.trim().length > 0;
    let badgeText = isFiltering
      ? `${filteredCount} de ${total.toLocaleString('pt-BR')} faixas`
      : `${total.toLocaleString('pt-BR')} faixas`;
    if (isLocal) {
      badgeText = isFiltering
        ? `📱 Local Mode • ${filteredCount} de ${total.toLocaleString('pt-BR')} faixas locais`
        : `📱 Local Mode • ${filteredCount.toLocaleString('pt-BR')} faixas desta máquina`;
    }

    return `
      <div class="ra-hero-header">
        <div class="ra-header-main-row">
          <div class="ra-header-left">
            <div class="ra-header-icon-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="ra-header-titles">
              <div class="ra-header-title-row">
                <h1 class="ra-header-title">Adicionadas recentemente</h1>
                <span class="ra-badge-count" id="ra-header-badge">${badgeText}</span>
              </div>
              <p class="ra-header-subtitle">
                <span class="pulse-dot-cyan"></span>
                Ordem cronológica Samsung Music • Mais recentes primeiro
              </p>
            </div>
          </div>
        </div>

        <div class="ra-header-actions">
          <div class="ra-search-wrap">
            <svg class="ra-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" class="ra-search-input" id="ra-search-field" placeholder="Buscar faixas..." value="${escapeHtml(searchQuery)}" autocomplete="off" autocorrect="off" spellcheck="false" />
            <button type="button" class="ra-search-clear-btn ${isFiltering ? 'is-visible' : ''}" id="ra-search-clear" title="Limpar busca" aria-label="Limpar busca">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="ra-action-buttons-row">
            <button type="button" class="ra-glass-btn ra-glass-btn-primary ra-glass-btn-icon-only" id="ra-btn-play-all" title="Tocar todas as faixas" aria-label="Tocar todas as faixas">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4"/>
              </svg>
            </button>

            <button type="button" class="ra-glass-btn ra-glass-btn-icon-only" id="ra-btn-shuffle-all" title="Modo aleatório" aria-label="Modo aleatório">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 3 21 3 21 8"/>
                <line x1="4" y1="20" x2="21" y2="3"/>
                <polyline points="21 16 21 21 16 21"/>
                <line x1="15" y1="15" x2="21" y2="21"/>
                <line x1="4" y1="4" x2="9" y2="9"/>
              </svg>
            </button>

            <button type="button" class="ra-glass-btn ra-glass-btn-icon-only ${window.TagsEngine?.isMultiSelectActive ? 'ra-glass-btn-active' : ''}" id="ra-btn-select-mode" title="${window.TagsEngine?.isMultiSelectActive ? 'Cancelar seleção' : 'Selecionar faixas em lote'}" aria-label="Selecionar faixas">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </button>

            <button type="button" class="ra-glass-btn ra-glass-btn-icon-only" id="ra-btn-refresh-library" title="Atualizar músicas" aria-label="Atualizar músicas">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderHierarchicalTracklistHtml(songs) {
    if (songs.length === 0) {
      return `
        <div class="ra-empty-state">
          <div class="ra-empty-icon">🔍</div>
          <h3 class="ra-empty-title">Nenhuma música encontrada</h3>
          <p class="ra-empty-desc">Tente ajustar a sua busca ou verifique se as músicas foram sincronizadas no servidor.</p>
        </div>
      `;
    }

    const currentId = getCurrentPlayingSongId();
    const groups = groupSongsByCreationHierarchy(songs);
    let globalIndex = 0;
    const isMobile = isMobileLayout();

    return `
      <div class="ra-hierarchical-sections-container ${isMobile ? 'ra-is-mobile-container' : ''}">
        ${groups.map(group => {
          return `
            <div class="ra-hierarchy-section" id="${group.key}">
              <!-- Glass Hierarchy Section Header -->
              <div class="ra-hierarchy-header">
                <div class="ra-hierarchy-header-left">
                  <span class="ra-hierarchy-icon">${group.icon}</span>
                  <div class="ra-hierarchy-header-texts">
                    <span class="ra-hierarchy-title">${escapeHtml(group.title)}</span>
                    <span class="ra-hierarchy-subtitle">${escapeHtml(group.subtitle)}</span>
                  </div>
                  <span class="ra-hierarchy-count-pill">${group.songs.length} ${group.songs.length === 1 ? 'faixa' : 'faixas'}</span>
                </div>
                <div class="ra-hierarchy-header-right">
                  <button type="button" class="ra-section-play-btn" data-group-key="${group.key}" title="Tocar todas desta seção">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <span>Tocar</span>
                  </button>
                </div>
              </div>

              <!-- Section Tracks Content (Mobile Rows or Desktop Table) -->
              <div class="ra-tracklist-container ${isMobile ? 'ra-mobile-track-container' : ''}">
                ${isMobile ? `
                  <div class="ra-mobile-track-list">
                    ${group.songs.map(song => {
                      const idx = globalIndex++;
                      const isPlaying = song.id === currentId;
                      const coverUrl = getCoverUrl(song.imageId || song.id);
                      const dur = formatDuration(song.duration);
                      const creationStr = formatCreationDate(song.creationTime, song);

                      return `
                        <div class="ra-tracklist-row ra-mobile-track-row fs-item-table-list-column-module-data-row ${isPlaying ? 'is-playing' : ''}" role="row" data-id="${song.id}" data-song-id="${song.id}" data-index="${idx}">
                          <div class="ra-col-idx ra-mobile-col-idx">
                            ${isPlaying ? `
                              <div class="ra-mini-equalizer">
                                <span></span><span></span><span></span><span></span>
                              </div>
                            ` : `
                              <span class="ra-idx-num">${idx + 1}</span>
                              <button type="button" class="ra-row-play-btn" data-play-id="${song.id}">▶</button>
                            `}
                          </div>

                          <div class="ra-track-cover-cell ra-mobile-cover-cell">
                            <div class="ra-track-thumb-box">
                              ${coverUrl ? `<img class="ra-track-thumb-img" src="${coverUrl}" loading="lazy" alt="" />` : `<span>🎵</span>`}
                            </div>
                          </div>

                          <div class="ra-mobile-track-info">
                            <div class="ra-track-title ra-row-title fs-title-column-module-title">
                              ${escapeHtml(song.name || song.title || 'Faixa')}
                              ${window.FeishinLocalMode?.isLocal(song.id) ? '<span class="ra-local-tag" title="Local nesta máquina">📱</span>' : ''}
                              ${window.TagsEngine?.renderTagBadgesHtml ? window.TagsEngine.renderTagBadgesHtml(song) : ''}
                            </div>
                            <div class="ra-mobile-meta-line">
                              <span class="ra-track-artist ra-row-artist fs-artist-column-module-artist">${escapeHtml(song.artistName || (song.artists?.[0]?.name) || '[Unknown Artist]')}</span>
                              <span class="ra-meta-dot">•</span>
                              <span class="ra-track-creation-date">
                                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 15 14"/>
                                </svg>
                                ${creationStr}
                              </span>
                            </div>
                          </div>

                          <div class="ra-mobile-track-right">
                            <span class="ra-track-duration">${dur}</span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : `
                  <table class="ra-tracklist-table">
                    <thead>
                      <tr>
                        <th style="width: 44px; text-align: center;">#</th>
                        <th style="width: 48px;"></th>
                        <th>TÍTULO</th>
                        <th>ÁLBUM</th>
                        <th>DATA DE CRIAÇÃO DO ARQUIVO</th>
                        <th style="width: 60px;">ANO</th>
                        <th style="width: 70px; text-align: right;">DURAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${group.songs.map(song => {
                        const idx = globalIndex++;
                        const isPlaying = song.id === currentId;
                        const coverUrl = getCoverUrl(song.imageId || song.id);
                        const dur = formatDuration(song.duration);
                        const creationStr = formatCreationDate(song.creationTime, song);

                        return `
                          <tr class="ra-tracklist-row fs-item-table-list-column-module-data-row ${isPlaying ? 'is-playing' : ''}" role="row" data-id="${song.id}" data-song-id="${song.id}" data-index="${idx}">
                            <td class="ra-col-idx">
                              ${isPlaying ? `
                                <div class="ra-mini-equalizer">
                                  <span></span><span></span><span></span><span></span>
                                </div>
                              ` : `
                                <span class="ra-idx-num">${idx + 1}</span>
                                <button type="button" class="ra-row-play-btn" data-play-id="${song.id}">▶</button>
                              `}
                            </td>
                            <td class="ra-track-cover-cell">
                              <div class="ra-track-thumb-box">
                                ${coverUrl ? `<img class="ra-track-thumb-img" src="${coverUrl}" loading="lazy" alt="" />` : `<span>🎵</span>`}
                              </div>
                            </td>
                            <td class="ra-track-title-cell">
                              <div class="ra-track-title ra-row-title fs-title-column-module-title">
                                ${escapeHtml(song.name || song.title || 'Faixa')}
                                ${window.FeishinLocalMode?.isLocal(song.id) ? '<span class="ra-local-tag" title="Local nesta máquina">📱</span>' : ''}
                                ${window.TagsEngine?.renderTagBadgesHtml ? window.TagsEngine.renderTagBadgesHtml(song) : ''}
                              </div>
                              <div class="ra-track-artist ra-row-artist fs-artist-column-module-artist">${escapeHtml(song.artistName || (song.artists?.[0]?.name) || '[Unknown Artist]')}</div>
                            </td>
                            <td>
                              <div class="ra-track-album">${escapeHtml(song.album || song.albumName || '—')}</div>
                            </td>
                            <td>
                              <span class="ra-track-creation-date">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.6; vertical-align: -1px; margin-right: 4px;">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 15 14"/>
                                </svg>
                                ${creationStr}
                              </span>
                            </td>
                            <td style="color: rgba(255,255,255,0.45); font-size: 12.5px;">
                              ${song.year || '—'}
                            </td>
                            <td class="ra-track-duration">
                              ${dur}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 6. Bind Events
  function bindViewEvents(container) {
    container.querySelector('#ra-btn-play-all')?.addEventListener('click', () => {
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      playAll(false);
    });
    
    container.querySelector('#ra-btn-shuffle-all')?.addEventListener('click', () => {
      if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
      playAll(true);
    });

    const searchField = container.querySelector('#ra-search-field');
    const clearBtn = container.querySelector('#ra-search-clear');
    const headerActions = container.querySelector('.ra-header-actions');

    if (searchField) {
      searchField.addEventListener('focus', () => {
        headerActions?.classList.add('is-search-focused');
      });

      searchField.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement !== searchField) {
            headerActions?.classList.remove('is-search-focused');
          }
        }, 180);
      });

      searchField.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.classList.toggle('is-visible', searchQuery.trim().length > 0);
        }
        renderViewContentOnly();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(12);
        searchQuery = '';
        if (searchField) {
          searchField.value = '';
          searchField.focus();
        }
        clearBtn.classList.remove('is-visible');
        renderViewContentOnly();
      });
    }

    // Select Mode Button
    const selectBtn = container.querySelector('#ra-btn-select-mode');
    if (selectBtn) {
      selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
        if (window.TagsEngine) {
          const isNowActive = !window.TagsEngine.isMultiSelectActive;
          window.TagsEngine.setMultiSelectActive(isNowActive);
          selectBtn.classList.toggle('ra-glass-btn-active', isNowActive);
          selectBtn.title = isNowActive ? 'Cancelar seleção' : 'Selecionar faixas em lote';
          const span = selectBtn.querySelector('span');
          if (span) span.innerText = isNowActive ? 'Cancelar' : 'Selecionar';
        }
      });
    }

    // Refresh Library Button
    const refreshBtn = container.querySelector('#ra-btn-refresh-library');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
        const svg = refreshBtn.querySelector('svg');
        if (svg) svg.style.animation = 'raDotPulse 0.8s infinite linear';
        loadInitialSongs(true).finally(() => {
          if (svg) svg.style.animation = '';
        });
      });
    }

    // Play Section Button
    container.querySelectorAll('.ra-section-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
        const groupKey = btn.getAttribute('data-group-key');
        if (groupKey) playGroup(groupKey);
      });
    });

    // Track Rows Single-Tap Playback & Long-Press / ContextMenu Dialog
    container.querySelectorAll('.ra-tracklist-row').forEach(row => {
      let preventNextClick = false;

      const triggerContextMenu = (clientX, clientY, sourceEvt) => {
        preventNextClick = true;
        setTimeout(() => { preventNextClick = false; }, 600);

        if (window.AndroidBridge?.hapticFeedback) {
          window.AndroidBridge.hapticFeedback(0);
        } else if (window.AndroidBridge?.vibrate) {
          window.AndroidBridge.vibrate(35);
        }

        const id = row.getAttribute('data-id') || row.getAttribute('data-song-id');
        const song = cachedSongs.find(s => s.id === id);
        if (song) {
          openTrackContextMenu(song, { clientX, clientY, preventDefault: () => sourceEvt?.preventDefault?.() }, row);
        }
      };

      // Evento de contextmenu — despachado exclusivamente pelo feishin-mobile-enhancer no Android ou clique direito no Desktop
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenu(e.clientX || (window.innerWidth / 2), e.clientY || (window.innerHeight / 2), e);
      });

      // 3. Toque rápido para tocar a faixa
      const handlePlay = (e) => {
        if (preventNextClick) {
          preventNextClick = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.target.closest('#ra-search-clear, .ra-section-play-btn, .fs-track-tag-badge, .fs-multiselect-indicator')) return;
        const id = row.getAttribute('data-id');
        const song = cachedSongs.find(s => s.id === id);
        if (song) {
          if (window.TagsEngine?.isMultiSelectActive) {
            window.TagsEngine.toggleSongSelection(song);
            return;
          }
          if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(12);
          playTrack(song, getDisplayedSongs());
        }
      };

      // Single click for instant touch/tap play
      row.addEventListener('click', handlePlay);

      // Dedicated play button handler
      row.querySelector('.ra-row-play-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePlay(e);
      });
    });

    // Vincular controle dinâmico da barra de ferramentas na rolagem
    bindScrollHandler(container);
  }

  // 6b. Scroll Direction Handler (Sticky Toolbar: Slide Up to Hide, Slide Down to Reveal)
  let lastScrollTop = 0;
  let isHeaderHidden = false;

  function bindScrollHandler(container) {
    if (!container || container.dataset.scrollBound === 'true') return;
    container.dataset.scrollBound = 'true';

    let ticking = false;

    container.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const header = container.querySelector('.ra-hero-header');
        if (!header) {
          ticking = false;
          return;
        }

        const currentScrollTop = container.scrollTop;
        const delta = currentScrollTop - lastScrollTop;
        const maxScroll = container.scrollHeight - container.clientHeight;

        // Se estiver no topo (<= 20px), restaura estado normal
        if (currentScrollTop <= 20) {
          if (isHeaderHidden) {
            header.classList.remove('ra-header-hidden');
            isHeaderHidden = false;
          }
          header.classList.remove('ra-header-floating');
          lastScrollTop = Math.max(0, currentScrollTop);
          ticking = false;
          return;
        }

        header.classList.add('ra-header-floating');

        // Se o campo de busca estiver focado, manter visível
        const searchInput = header.querySelector('#ra-search-field');
        if (searchInput && document.activeElement === searchInput) {
          if (isHeaderHidden) {
            header.classList.remove('ra-header-hidden');
            isHeaderHidden = false;
          }
          lastScrollTop = currentScrollTop;
          ticking = false;
          return;
        }

        // Evitar triggers falsos por elastic bounce no final da lista
        if (maxScroll > 0 && currentScrollTop >= maxScroll - 15) {
          lastScrollTop = currentScrollTop;
          ticking = false;
          return;
        }

        // Rolagem para baixo (descendo a lista): esconde a barra
        if (delta > 8 && currentScrollTop > 60) {
          if (!isHeaderHidden) {
            header.classList.add('ra-header-hidden');
            isHeaderHidden = true;
          }
        }
        // Rolagem para cima (subindo a lista): revela a barra imediatamente
        else if (delta < -8) {
          if (isHeaderHidden) {
            header.classList.remove('ra-header-hidden');
            isHeaderHidden = false;
          }
        }

        lastScrollTop = currentScrollTop;
        ticking = false;
      });
    }, { passive: true });
  }

  function renderViewContentOnly() {
    const body = document.getElementById('ra-content-body-wrap');
    if (!body) return;
    const songs = getFilteredSongs();
    const prevScroll = document.getElementById('feishin-recently-added-view')?.scrollTop || 0;

    const badge = document.getElementById('ra-header-badge');
    if (badge) {
      const isFiltering = searchQuery && searchQuery.trim().length > 0;
      badge.textContent = isFiltering
        ? `${songs.length} de ${(totalRecordCount || cachedSongs.length).toLocaleString('pt-BR')} faixas`
        : `${(totalRecordCount || cachedSongs.length).toLocaleString('pt-BR')} faixas`;
    }

    body.innerHTML = renderHierarchicalTracklistHtml(songs);

    const container = document.getElementById('feishin-recently-added-view');
    if (container) {
      bindViewEvents(container);
      if (prevScroll > 0) container.scrollTop = prevScroll;
    }
  }

  function renderViewContent() {
    const container = document.getElementById('feishin-recently-added-view');
    if (!container) return;

    const songs = getFilteredSongs();
    const prevScroll = container.scrollTop;

    container.innerHTML = `
      ${renderHeroHeaderHtml(totalRecordCount || cachedSongs.length, songs.length)}
      <div id="ra-content-body-wrap" style="width: 100%;">
        ${renderHierarchicalTracklistHtml(songs)}
      </div>
    `;

    bindViewEvents(container);
    if (prevScroll > 0) container.scrollTop = prevScroll;
  }

  function renderActiveTrackIndicator() {
    const currentId = getCurrentPlayingSongId();
    document.querySelectorAll('.ra-tracklist-row').forEach(row => {
      const isCur = row.getAttribute('data-id') === currentId;
      row.classList.toggle('is-playing', isCur);
      const idxCell = row.querySelector('.ra-col-idx');
      if (idxCell) {
        if (isCur) {
          idxCell.innerHTML = `
            <div class="ra-mini-equalizer">
              <span></span><span></span><span></span><span></span>
            </div>
          `;
        } else {
          const originalIdx = Number(row.getAttribute('data-index') || 0) + 1;
          idxCell.innerHTML = `
            <span class="ra-idx-num">${originalIdx}</span>
            <button type="button" class="ra-row-play-btn" data-play-id="${row.getAttribute('data-id')}">▶</button>
          `;
        }
      }
    });
  }

  // 7. Mount & Navigation Management (Conflict-Free Architecture)
  function getMountContainer() {
    return document.querySelector('.fs-mobile-layout-module-main-content') ||
           document.querySelector('.fs-main-content-module-main-content-body-scroll') ||
           document.querySelector('.fs-main-content-module-main-content-body') ||
           document.querySelector('#main-content') ||
           document.querySelector('main');
  }

  let routeObserver = null;
  function ensureRouteObserver() {
    if (routeObserver) return;
    try {
      routeObserver = new MutationObserver(() => {
        if (window.location.hash.includes('recently-added')) {
          const mainContainer = getMountContainer();
          const viewContainer = document.getElementById('feishin-recently-added-view');
          if (mainContainer && (!viewContainer || viewContainer.parentElement !== mainContainer)) {
            scheduleMount();
          }
        }
      });
      routeObserver.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  function isOtherCustomPageActive(hash) {
    return hash.includes('analytics') || hash.startsWith('#/library/genres') || hash.startsWith('#/library/tags');
  }

  function ensureSidebarRecentlyAddedItem() {
    const parent = document.querySelector('.fs-sidebar-module-accordion-content');
    if (!parent) return;

    let item = document.getElementById('personal-os-sidebar-recently-added-item');
    if (!item) {
      item = document.createElement('a');
      item.id = 'personal-os-sidebar-recently-added-item';
      item.className = 'mantine-focus-never mantine-active fs-button-module-root fs-sidebar-item-module-link fs-sidebar-item-module-root m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root';
      item.setAttribute('data-variant', 'subtle');
      item.setAttribute('data-size', 'sm');
      item.setAttribute('draggable', 'false');
      item.setAttribute('title', 'Músicas Adicionadas Recentemente');
      item.style.cssText = '--button-height: var(--button-height-sm); --button-padding-x: var(--button-padding-x-sm); --button-fz: 11px; --button-bg: transparent; --button-hover: var(--mantine-color-primary-light-hover); --button-color: var(--mantine-color-primary-light-color); --button-bd: calc(0.0625rem * var(--mantine-scale)) solid transparent; cursor: pointer; user-select: none; -webkit-app-region: no-drag;';

      item.innerHTML = `
        <span class="fs-sidebar-item-module-inner m_80f1301b mantine-Button-inner">
          <span class="fs-sidebar-item-module-label m_811560b9 mantine-Button-label" style="width: 100%;">
            <div class="m_4081bf90 mantine-Group-root" style="--group-gap: var(--mantine-spacing-md); --group-align: center; --group-justify: flex-start; --group-wrap: nowrap; width: 100%;">
              <span class="fs-sidebar-icon-module-wrapper">
                <svg stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" height="1.15em" width="1.15em" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </span>
              <span style="font-size: 11.5px; font-weight: 600; letter-spacing: -0.2px; white-space: nowrap;">ADICIONADAS RECENTEMENTE</span>
            </div>
          </span>
        </span>
      `;

      item.addEventListener('pointerdown', (e) => e.stopPropagation());
      item.addEventListener('mousedown', (e) => e.stopPropagation());
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.hash = '#/library/recently-added';
        scheduleMount();
      });

      const faixasItem = parent.querySelector('a[href*="/library/songs"]');
      if (faixasItem && faixasItem.nextSibling) {
        parent.insertBefore(item, faixasItem.nextSibling);
      } else if (faixasItem) {
        parent.appendChild(item);
      } else {
        const firstNav = parent.querySelector('a');
        if (firstNav) parent.insertBefore(item, firstNav);
        else parent.appendChild(item);
      }
    }

    const currentHash = window.location.hash || '';
    if (currentHash.includes('recently-added')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  }

  async function mountRecentlyAddedUI() {
    if (isMounting) return;
    isMounting = true;
    try {
      ensureRouteObserver();
      ensureSidebarRecentlyAddedItem();

      const mainContainer = getMountContainer();
      if (!mainContainer) return;

      const hash = window.location.hash || '';
      const isTargetRoute = hash.includes('recently-added');
      let viewContainer = document.getElementById('feishin-recently-added-view');

      if (isTargetRoute) {
        document.body.classList.add('feishin-route-recently-added');

        if (!viewContainer) {
          viewContainer = document.createElement('div');
          viewContainer.id = 'feishin-recently-added-view';
          mainContainer.appendChild(viewContainer);
        } else if (viewContainer.parentElement !== mainContainer) {
          mainContainer.appendChild(viewContainer);
        }

        viewContainer.style.setProperty('display', 'flex', 'important');

        const sidebarItem = document.getElementById('personal-os-sidebar-recently-added-item');
        if (sidebarItem) sidebarItem.classList.add('active');

        if (cachedSongs.length === 0) {
          viewContainer.innerHTML = `
            <div class="ra-empty-state" style="padding: 100px 20px;">
              <div class="ra-empty-icon" style="animation: raDotPulse 1.5s infinite ease-in-out;">⚡</div>
              <h3 class="ra-empty-title">Carregando Músicas Adicionadas Recentemente...</h3>
              <p class="ra-empty-desc">Conectando ao catálogo local e organizando por cronologia Samsung Music.</p>
            </div>
          `;
          loadInitialSongs();
        } else {
          if (!viewContainer.querySelector('.ra-hierarchical-sections-container')) {
            renderViewContent();
          }
          // Revalidação em background para detectar faixas recém-sincronizadas
          loadInitialSongs();
        }
      } else {
        document.body.classList.remove('feishin-route-recently-added');

        if (viewContainer) {
          viewContainer.style.setProperty('display', 'none', 'important');
        }

        const sidebarItem = document.getElementById('personal-os-sidebar-recently-added-item');
        if (sidebarItem) sidebarItem.classList.remove('active');
      }
    } finally {
      isMounting = false;
    }
  }

  function scheduleMount() {
    if (mountDebounceTimer) return;
    mountDebounceTimer = setTimeout(() => {
      mountDebounceTimer = null;
      mountRecentlyAddedUI();
    }, 16);
  }

  // Navigation listeners
  window.addEventListener('hashchange', scheduleMount);
  window.addEventListener('popstate', scheduleMount);

  // Window resize handler to switch smoothly between desktop table and mobile list
  let lastResizeWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if ((lastResizeWidth > 768 && w <= 768) || (lastResizeWidth <= 768 && w > 768)) {
      lastResizeWidth = w;
      if (window.location.hash.includes('recently-added')) {
        renderViewContent();
      }
    }
  });

  // Initial schedule
  scheduleMount();

  // SSE Realtime auto-update from VPS Music Engine com reconexão resiliente
  let sseInstance = null;
  let sseReconnectTimer = null;
  function connectSSE() {
    if (sseInstance) {
      try { sseInstance.close(); } catch (e) {}
      sseInstance = null;
    }
    const auth = getAuthInfo();
    if (!auth || !auth.url) {
      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = setTimeout(connectSSE, 2000);
      return;
    }
    const cleanUrl = auth.url.replace(/\/$/, '');
    const sseUrl = `${cleanUrl}/api/engine/events`;
    try {
      sseInstance = new EventSource(sseUrl);

      const onTrackChange = (ev) => {
        console.log(`[Recently Added] Evento SSE (${ev.type}) recebido. Revalidando faixas...`);
        loadInitialSongs(true);
        if (typeof window.feishinRefreshLibrary === 'function') {
          window.feishinRefreshLibrary(ev.type);
        }
        setTimeout(() => loadInitialSongs(true), 1200);
        setTimeout(() => loadInitialSongs(true), 3200);
      };

      sseInstance.addEventListener('track_uploaded', onTrackChange);
      sseInstance.addEventListener('scan_finished', onTrackChange);
      sseInstance.addEventListener('library_updated', onTrackChange);
      sseInstance.addEventListener('track_updated', onTrackChange);
      sseInstance.addEventListener('track_deleted', onTrackChange);

      sseInstance.onerror = () => {
        if (sseInstance) {
          try { sseInstance.close(); } catch (e) {}
          sseInstance = null;
        }
        clearTimeout(sseReconnectTimer);
        sseReconnectTimer = setTimeout(connectSSE, 6000);
      };
    } catch (e) {
      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = setTimeout(connectSSE, 8000);
    }
  }
  connectSSE();

  // Escuta evento customizado de refresh emitido pelo Personal OS ou core Feishin
  window.addEventListener('feishin:refresh-library', () => {
    loadInitialSongs(true);
  });

  // Periodic polling fallback a cada 45 segundos
  setInterval(() => {
    if (window.location.hash.includes('recently-added')) {
      loadInitialSongs();
    }
  }, 45000);

  // Sincronização em tempo real do indicador de reprodução ativa com a Player Store
  try {
    if (window.__FEISHIN_PLAYER_STORE__?.subscribe) {
      window.__FEISHIN_PLAYER_STORE__.subscribe(() => {
        if (window.location.hash.includes('recently-added')) {
          renderActiveTrackIndicator();
        }
      });
    }
  } catch (e) {}

  // Expose API
  window.__FEISHIN_RECENTLY_ADDED__ = {
    playAll,
    playGroup,
    getSongs: () => cachedSongs,
    getCachedSongs: () => cachedSongs,
    reload: loadInitialSongs,
    refreshView: () => renderRecentlyAddedView(true),
    openContextMenu: openTrackContextMenu,
    removeSong: (songId, songTitle) => {
      const initialLen = cachedSongs.length;
      cachedSongs = cachedSongs.filter(s => s.id !== songId && (s.name || s.title) !== songTitle);
      if (cachedSongs.length !== initialLen) {
        if (totalRecordCount > 0) totalRecordCount--;
        const badge = document.getElementById('ra-header-badge');
        if (badge) {
          badge.textContent = `${(totalRecordCount || cachedSongs.length).toLocaleString('pt-BR')} faixas`;
        }
      }
    }
  };
  window.FeishinRecentlyAdded = window.__FEISHIN_RECENTLY_ADDED__;

  window.addEventListener('feishin:local-mode-change', () => {
    const view = document.getElementById('feishin-recently-added-view');
    if (view) {
      renderRecentlyAddedView(true);
    }
  });

})();
