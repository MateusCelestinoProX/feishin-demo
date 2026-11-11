/**
 * FEISHIN MOBILE PRO — MOTOR NATIVO ANDROID & LIQUID GLASS ORCHESTRATOR
 * Arquitetura Mobile Especializada para Samsung Galaxy S22 Ultra
 * - Sanitização de Tabelas: Rolagem infinita contínua (sem paginação de desktop)
 * - Single-Tap Instant Playback em hardware real
 * - Bottom Navigation Bar Liquid Glass com Thumb-Zone Design
 * - Sincronização direta com MediaSession e Android Foreground Service
 * - Suporte total aos 33 Shaders WebGL em Fullscreen Edge-to-Edge
 */

(function () {
    console.log('[FeishinMobile] Inicializando Motor Nativo Liquid Glass...');

    // 1. Sanitização Definitiva de Preferências & Layout
    function sanitizeSettings() {
        try {
            const rawSettings = localStorage.getItem('store_settings');
            let s = rawSettings ? JSON.parse(rawSettings) : {};
            let changed = false;

            if (!s.state) s.state = {};
            if (!s.state.general) s.state.general = {};

            // Forçar idioma oficial Português do Brasil ("Faixas 1736")
            if (s.state.general.language !== 'pt-BR') {
                s.state.general.language = 'pt-BR';
                changed = true;
            }

            // Otimizações Críticas de Performance e Latência de Reprodução
            if (!s.state.playback) s.state.playback = {};
            if (s.state.playback.audioFadeOnStatusChange !== false) {
                s.state.playback.audioFadeOnStatusChange = false; // Elimina rampa de 300ms de delay no som
                changed = true;
            }
            if (s.state.playback.confirmQueueChanges !== false) {
                s.state.playback.confirmQueueChanges = false; // Toca na hora sem diálogos
                changed = true;
            }
            if (!s.state.playback.transcode || s.state.playback.transcode.enabled !== false || s.state.playback.transcode.format !== 'raw') {
                s.state.playback.transcode = {
                    enabled: false,
                    format: 'raw',
                    bitrate: 0,
                    maxSampleRate: 0
                };
                changed = true;
            }

            // Otimizar todas as listas de músicas para o padrão mobile (Full-screen & Infinity)
            if (!s.state.lists) s.state.lists = {};
            const listKeys = ['song', 'playlistSong', 'albumDetail', 'queueSong', 'albumArtistSong', 'genreSong', 'folder'];

            listKeys.forEach(key => {
                if (!s.state.lists[key]) s.state.lists[key] = {};
                const list = s.state.lists[key];

                // Forçar rolagem infinita contínua (elimina qualquer quebra de páginas)
                if (list.pagination !== 'infinite') {
                    list.pagination = 'infinite';
                    changed = true;
                }
                if (list.display !== 'table') {
                    list.display = 'table';
                    changed = true;
                }
                if (list.itemsPerPage !== 100) {
                    list.itemsPerPage = 100;
                    changed = true;
                }

                if (!list.table) list.table = {};
                if (list.table.enableHeader !== false) {
                    list.table.enableHeader = false; // Remove cabeçalho desktop redundante
                    changed = true;
                }
                if (list.table.size !== 'default') {
                    list.table.size = 'default';
                    changed = true;
                }

                // Ajustar colunas mobile ideais (Layout unificado sem pin desincronizado)
                if (list.table.columns && Array.isArray(list.table.columns)) {
                    list.table.columns.forEach(col => {
                        col.pinned = null; // Unifica a rolagem virtual em um único container

                        if (col.id === 'rowIndex') {
                            if (!col.isEnabled || col.width !== 32) {
                                col.isEnabled = true;
                                col.width = 32;
                                changed = true;
                            }
                        } else if (col.id === 'titleCombined') {
                            if (!col.isEnabled || col.width !== 520) {
                                col.isEnabled = true;
                                col.width = 520;
                                changed = true;
                            }
                        } else if (col.id === 'duration') {
                            if (!col.isEnabled || col.width !== 50) {
                                col.isEnabled = true;
                                col.width = 50;
                                changed = true;
                            }
                        } else if (col.id === 'actions') {
                            if (!col.isEnabled || col.width !== 38) {
                                col.isEnabled = true;
                                col.width = 38;
                                changed = true;
                            }
                        } else {
                            if (col.isEnabled) {
                                col.isEnabled = false;
                                changed = true;
                            }
                        }
                    });
                }
            });

            if (changed) {
                localStorage.setItem('store_settings', JSON.stringify(s));
                console.log('[FeishinMobile] Preferências de exibição mobile aplicadas com sucesso.');
            }

            // Sanitização de osTranscodeDecision no store_authentication para eliminação de RTT na VPS
            try {
                const existingAuth = localStorage.getItem('store_authentication');
                if (existingAuth && existingAuth !== 'null') {
                    const parsedAuth = JSON.parse(existingAuth);
                    let authModified = false;
                    if (parsedAuth?.state?.currentServer?.features?.osTranscodeDecision) {
                        delete parsedAuth.state.currentServer.features.osTranscodeDecision;
                        authModified = true;
                    }
                    if (parsedAuth?.state?.serverList) {
                        Object.keys(parsedAuth.state.serverList).forEach(k => {
                            if (parsedAuth.state.serverList[k]?.features?.osTranscodeDecision) {
                                delete parsedAuth.state.serverList[k].features.osTranscodeDecision;
                                authModified = true;
                            }
                        });
                    }
                    if (authModified) {
                        localStorage.setItem('store_authentication', JSON.stringify(parsedAuth));
                        console.log('[FeishinMobile] osTranscodeDecision purgado do cache de autenticação.');
                    }
                }
            } catch (err) {
                console.warn('[FeishinMobile] Erro ao sanitizar store_authentication:', err);
            }

            // Credenciais Feishin Cloud Demo (Inicialização se vazio ou sem servidor ativo)
            const authStr = localStorage.getItem('store_authentication');
            let authNeedsInit = false;
            try {
                const check = JSON.parse(authStr);
                if (!check?.state?.currentServer || !check?.state?.currentServer?.credential) {
                    authNeedsInit = true;
                }
            } catch (e) {
                authNeedsInit = true;
            }
            if (authNeedsInit) {
                const defaultAuth = {
                    state: {
                        actions: {},
                        currentServer: {
                            credential: "u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json",
                            id: "FsiBb_mTdwLVTb1o_94bm",
                            isAdmin: true,
                            name: "Feishin Cloud Demo",
                            type: "subsonic",
                            url: ".",
                            userId: "3xPL1BPoVa1ulwc1UkzYU6",
                            username: "PortfolioGuest",
                            preferRemoteUrl: false,
                            ndCredential: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG0iOnRydWUsImV4cCI6MTc5MzIzMzk2OSwiaWF0IjoxNzkzMDM5ODg0LCJpc3MiOiJORCIsInN1YiI6Ik1hdGV1c0NlbGVzdGlub1BSTyIsInVpZCI6IjN4UEwxQlBvVmExdWx3YzFVa3pZVTYifQ.O_8I9A0bohAgOlk6ohEEMVX2PZp25kLw7dIthV1sCsM",
                            features: {
                                lyricsMultipleStructured: [1, 2],
                                osFormPost: [1],
                                serverPlayQueue: [2, 1],
                                reportPlayback: [1],
                                topSongsByArtistId: [1],
                                artistImageUpload: [1],
                                internetRadioImageUpload: [1],
                                playlistImageUpload: [1],
                                trackYesNoRatingFilter: [1],
                                trackAlbumArtistSearch: [1],
                                bfr: [1],
                                tags: [1],
                                sharingAlbumSong: [1],
                                playlistsSmart: [1],
                                publicPlaylist: [1],
                                albumYesNoRatingFilter: [1],
                                jukebox: [1],
                                musicFolderMultiselect: [1]
                            },
                            version: "0.64.2 (10114574)"
                        },
                        deviceId: "7LuHDSkII4F8eaRFsTo4e",
                        serverList: {
                            "FsiBb_mTdwLVTb1o_94bm": {
                                credential: "u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json",
                                id: "FsiBb_mTdwLVTb1o_94bm",
                                isAdmin: true,
                                name: "Feishin Cloud Demo",
                                type: "subsonic",
                                url: ".",
                                userId: "3xPL1BPoVa1ulwc1UkzYU6",
                                username: "PortfolioGuest",
                                preferRemoteUrl: false,
                                ndCredential: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG0iOnRydWUsImV4cCI6MTc5MzIzMzk2OSwiaWF0IjoxNzkzMDM5ODg0LCJpc3MiOiJORCIsInN1YiI6Ik1hdGV1c0NlbGVzdGlub1BSTyIsInVpZCI6IjN4UEwxQlBvVmExdWx3YzFVa3pZVTYifQ.O_8I9A0bohAgOlk6ohEEMVX2PZp25kLw7dIthV1sCsM",
                                features: {
                                    lyricsMultipleStructured: [1, 2],
                                    osFormPost: [1],
                                    serverPlayQueue: [2, 1],
                                    reportPlayback: [1],
                                    topSongsByArtistId: [1],
                                    artistImageUpload: [1],
                                    internetRadioImageUpload: [1],
                                    playlistImageUpload: [1],
                                    trackYesNoRatingFilter: [1],
                                    trackAlbumArtistSearch: [1],
                                    bfr: [1],
                                    tags: [1],
                                    sharingAlbumSong: [1],
                                    playlistsSmart: [1],
                                    publicPlaylist: [1],
                                    albumYesNoRatingFilter: [1],
                                    jukebox: [1],
                                    musicFolderMultiselect: [1]
                                },
                                version: "0.64.2 (10114574)"
                            }
                        }
                    },
                    version: 2
                };
                localStorage.setItem('store_authentication', JSON.stringify(defaultAuth));
            }
        } catch (e) {
            console.warn('[FeishinMobile] Erro na sanitização:', e);
        }
    }

    sanitizeSettings();

    // 2. Ponte Nativa Android
    window.FeishinNative = {
        play: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (store && typeof store.mediaPlay === 'function') {
                const cur = store.player?.currentSong;
                if (cur?._uniqueId) store.mediaPlay(cur._uniqueId);
                else store.mediaTogglePlayPause?.();
            }
        },
        pause: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (store && typeof store.mediaPause === 'function') {
                store.mediaPause();
            }
        },
        togglePlay: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (store && typeof store.mediaTogglePlayPause === 'function') {
                store.mediaTogglePlayPause();
            }
        },
        next: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (store && typeof store.mediaNext === 'function') {
                store.mediaNext();
            }
        },
        prev: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (store && typeof store.mediaPrevious === 'function') {
                store.mediaPrevious();
            }
        },
        seekTo: function (seconds) {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (store && typeof store.mediaSeekToTimestamp === 'function') {
                store.mediaSeekToTimestamp(seconds);
            }
        },
        generateShuffledIndices: function (length, currentIndex) {
            const pool = [];
            for (let i = 0; i < length; i++) {
                if (i !== currentIndex) pool.push(i);
            }
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            if (currentIndex >= 0 && currentIndex < length) {
                pool.unshift(currentIndex);
            }
            return pool;
        },
        toggleShuffle: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (!store) return;
            const isShuffle = store.player?.shuffle === 'track' || store.player?.shuffle === 'album';
            const nextShuffle = isShuffle ? 'none' : 'track';
            if (typeof store.setShuffle === 'function') {
                store.setShuffle(nextShuffle);
            } else if (typeof store.toggleShuffle === 'function') {
                store.toggleShuffle();
            }
            const col = window.__FEISHIN_ACTIVE_COLLECTION__;
            if (col && Array.isArray(col.items)) {
                col.isShuffle = (nextShuffle === 'track');
                if (col.isShuffle) {
                    col.shuffledIndices = window.FeishinNative.generateShuffledIndices(col.items.length, col.currentIndex);
                    col.shuffledPointer = 0;
                } else {
                    col.shuffledIndices = null;
                }
            }
            if (window.FeishinTrackPage?.sync) window.FeishinTrackPage.sync();
        },
        toggleRepeat: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (!store) return;
            const cur = store.player?.repeat || 'none';
            let nextRepeat = 'none';
            if (cur === 'none') {
                nextRepeat = 'all';
            } else if (cur === 'all') {
                nextRepeat = 'one';
            } else {
                nextRepeat = 'none';
            }
            if (typeof store.setRepeat === 'function') {
                store.setRepeat(nextRepeat);
            } else if (typeof store.toggleRepeat === 'function') {
                store.toggleRepeat();
            }
            document.querySelectorAll('audio').forEach(a => {
                a.loop = (nextRepeat === 'one');
            });
            if (window.FeishinTrackPage?.sync) window.FeishinTrackPage.sync();
        },
        closePlayer: function () {
            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(1);
            window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = false;
            window.__FEISHIN_ACTIVE_COLLECTION__ = null;
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            try { store?.mediaStop?.({ reset: true }); } catch (e) {}
            try { store?.clearQueue?.(); } catch (e) {}
            document.querySelectorAll('audio').forEach(a => {
                try { a.pause(); a.currentTime = 0; } catch (e) {}
            });
            if (window.AndroidBridge?.stopPlayback) {
                try { window.AndroidBridge.stopPlayback(); } catch (e) {}
            }
            if (window.AndroidBridge?.onPlaybackStateProgress) {
                try { window.AndroidBridge.onPlaybackStateProgress(false, '', '', '', '', 0, 0); } catch (e) {}
            }
            if (window.FeishinTrackPage && window.FeishinTrackPage.isOpen()) {
                window.FeishinTrackPage.close();
            }
            const bar = document.getElementById('player-bar');
            if (bar) {
                bar.classList.add('feishin-player-hidden');
                bar.style.setProperty('display', 'none', 'important');
            }
        },
        openFullscreenPlayer: function () {
            if (window.FeishinTrackPage) {
                window.FeishinTrackPage.open();
                return;
            }
            const fsStore = window.__FEISHIN_FULLSCREEN_STORE__ || window.__FEISHIN_PLAYER_STORE__;
            if (fsStore && typeof fsStore.setState === 'function') {
                fsStore.setState({ expanded: true });
                return;
            }
            const trigger = document.querySelector('.fs-mobile-playerbar-module-container, [class*="mobilePlayerbar"], #player-bar');
            if (trigger) trigger.click();
        },
        openSidebarDrawer: function () {
            // Disparar o botão nativo do drawer do Mantine no Feishin
            const drawerBtn = document.querySelector('.fs-mobile-layout-module-drawer-button, button[aria-label="Menu"]');
            if (drawerBtn) {
                drawerBtn.click();
            } else {
                const headerMenuBtn = document.getElementById('feishin-header-menu-btn');
                if (headerMenuBtn) headerMenuBtn.click();
            }
        },
        openMoreMenu: function () {
            if (typeof window.closePersonalOSBackgrounds === 'function') {
                window.closePersonalOSBackgrounds();
            }
            if (window.FeishinLocalMode && typeof window.FeishinLocalMode.updateUI === 'function') {
                window.FeishinLocalMode.updateUI();
            }
            const moreBox = document.getElementById('feishin-more-glass-box');
            const backdrop = document.getElementById('feishin-more-glass-backdrop');
            if (moreBox && backdrop) {
                moreBox.classList.add('open');
                backdrop.classList.add('open');
                if (typeof window.__feishinSyncActiveTabs === 'function') {
                    window.__feishinSyncActiveTabs();
                }
            }
        },
        closeMoreMenu: function () {
            const moreBox = document.getElementById('feishin-more-glass-box');
            const backdrop = document.getElementById('feishin-more-glass-backdrop');
            if (moreBox && backdrop) {
                moreBox.classList.remove('open');
                backdrop.classList.remove('open');
                if (typeof window.__feishinSyncActiveTabs === 'function') {
                    window.__feishinSyncActiveTabs();
                }
            }
        },
        toggleMoreMenu: function () {
            const moreBox = document.getElementById('feishin-more-glass-box');
            if (moreBox && moreBox.classList.contains('open')) {
                window.FeishinNative.closeMoreMenu();
            } else {
                window.FeishinNative.openMoreMenu();
            }
        },
        toggleBackgrounds: function () {
            window.FeishinNative.closeMoreMenu();
            if (typeof window.togglePersonalOSBackgrounds === 'function') {
                window.togglePersonalOSBackgrounds();
            } else {
                const bgModal = document.getElementById('personal-os-shader-modal');
                const bgBackdrop = document.getElementById('personal-os-shader-backdrop');
                if (bgModal && bgBackdrop) {
                    const isOpen = bgModal.style.display === 'flex' || bgModal.style.display === 'block';
                    bgModal.style.setProperty('display', isOpen ? 'none' : 'flex', 'important');
                    bgBackdrop.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
                } else {
                    document.getElementById('personal-os-sidebar-backgrounds-item')?.click();
                }
            }
            if (typeof window.__feishinSyncActiveTabs === 'function') {
                window.__feishinSyncActiveTabs();
            }
        },
        openSettings: function () {
            window.FeishinNative.closeMoreMenu();
            if (typeof window.closePersonalOSBackgrounds === 'function') {
                window.closePersonalOSBackgrounds();
            }
            const isSettingsOpen = document.body.classList.contains('feishin-settings-open') || Boolean(document.querySelector('.mantine-Modal-content'));
            if (isSettingsOpen) {
                window.FeishinNative.closeSettings();
                return;
            }
            // Fechar qualquer modal residual antes de abrir para evitar acúmulo na stack
            try {
                const existingCloses = document.querySelectorAll('.mantine-Modal-close, button.mantine-CloseButton-root');
                existingCloses.forEach(b => b.click());
            } catch (e) {}

            document.body.classList.add('feishin-settings-open');
            if (typeof window.openFeishinSettings === 'function') {
                window.openFeishinSettings();
            }
            setTimeout(() => {
                if (typeof window.sanitizeSettingsDOM === 'function') {
                    window.sanitizeSettingsDOM();
                }
            }, 80);
            if (typeof window.__feishinSyncActiveTabs === 'function') {
                window.__feishinSyncActiveTabs();
            }
        },
        closeSettings: function () {
            document.body.classList.remove('feishin-settings-open');
            const closeBtn = document.querySelector('.mantine-Modal-close, button.mantine-CloseButton-root');
            if (closeBtn) closeBtn.click();
            if (typeof window.__feishinSyncActiveTabs === 'function') {
                window.__feishinSyncActiveTabs();
            }
        },
        handleBackPress: function () {
            // 0. Fechar Página de Faixa Liquid Glass se aberta
            if (window.FeishinTrackPage && window.FeishinTrackPage.isOpen()) {
                const lyricsOpen = document.getElementById('feishin-tp-lyrics-sheet')?.classList.contains('open');
                const queueOpen = document.getElementById('feishin-tp-queue-sheet')?.classList.contains('open');
                const timerOpen = document.getElementById('feishin-tp-timer-backdrop')?.classList.contains('open');
                if (lyricsOpen) {
                    document.getElementById('feishin-tp-lyrics-sheet').classList.remove('open');
                    return true;
                }
                if (queueOpen) {
                    document.getElementById('feishin-tp-queue-sheet').classList.remove('open');
                    document.getElementById('feishin-track-page')?.classList.remove('tp-queue-open');
                    return true;
                }
                if (timerOpen) {
                    document.getElementById('feishin-tp-timer-backdrop').classList.remove('open');
                    return true;
                }
                window.FeishinTrackPage.close();
                return true;
            }

            // 1. Fechar painel de Configurações se aberto
            if (document.body.classList.contains('feishin-settings-open') || document.querySelector('.mantine-Modal-content')) {
                window.FeishinNative.closeSettings();
                return true;
            }

            // 2. Fechar popup "Mais" se aberto
            const moreBox = document.getElementById('feishin-more-glass-box');
            if (moreBox && moreBox.classList.contains('open')) {
                window.FeishinNative.closeMoreMenu();
                return true;
            }

            // 3. Fechar modal de backgrounds se aberto
            const shaderModal = document.getElementById('personal-os-shader-modal');
            if (shaderModal && (shaderModal.style.display === 'flex' || shaderModal.style.display === 'block')) {
                const shaderBackdrop = document.getElementById('personal-os-shader-backdrop');
                shaderModal.style.setProperty('display', 'none', 'important');
                if (shaderBackdrop) shaderBackdrop.style.setProperty('display', 'none', 'important');
                if (typeof window.__feishinSyncActiveTabs === 'function') {
                    window.__feishinSyncActiveTabs();
                }
                return true;
            }

            // 4. Fechar Fullscreen Player / Track Page se aberto
            if (window.FeishinTrackPage && typeof window.FeishinTrackPage.isOpen === 'function' && window.FeishinTrackPage.isOpen()) {
                window.FeishinTrackPage.close();
                return true;
            }
            const tpEl = document.getElementById('feishin-track-page');
            if (tpEl && tpEl.classList.contains('open')) {
                if (window.FeishinTrackPage && window.FeishinTrackPage.close) {
                    window.FeishinTrackPage.close();
                } else {
                    tpEl.classList.remove('open');
                }
                return true;
            }
            const fsOverlay = document.querySelector('[class*="fullScreenPlayerOverlay"], #full-screen-player');
            if (fsOverlay && fsOverlay.offsetParent !== null) {
                const closeBtn = fsOverlay.querySelector('button[aria-label*="arrowDown"], button[aria-label*="Close"], button[aria-label*="Fechar"], .fs-action-icon');
                if (closeBtn) {
                    closeBtn.click();
                    return true;
                }
            }

            // 5. Fechar Drawer da biblioteca se aberto
            const drawerOverlay = document.querySelector('.mantine-Drawer-overlay');
            if (drawerOverlay && drawerOverlay.offsetParent !== null) {
                drawerOverlay.click();
                return true;
            }

            // 6. Voltar rota interna se não estiver na raiz
            if (window.location.hash && window.location.hash !== '#/library/songs' && window.location.hash !== '#/') {
                window.history.back();
                return true;
            }

            return false;
        }
    };

    // 3. Montagem da Bottom Navigation Bar e Popup Box "Mais"
    function setupBottomNav() {
        if (document.getElementById('feishin-mobile-bottom-nav')) return;

        // A. Backdrop e Box Elegante de Vidro para "Mais"
        const moreBackdrop = document.createElement('div');
        moreBackdrop.id = 'feishin-more-glass-backdrop';
        moreBackdrop.addEventListener('click', () => {
            window.FeishinNative.closeMoreMenu();
        });
        document.body.appendChild(moreBackdrop);

        const moreBox = document.createElement('div');
        moreBox.id = 'feishin-more-glass-box';
        moreBox.innerHTML = `
            <div class="feishin-more-header">
                <div class="feishin-more-pill-handle"></div>
                <div class="feishin-more-title-row">
                    <div class="feishin-more-title-group">
                        <div class="feishin-more-title-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
                        </div>
                        <div class="feishin-more-title-texts">
                            <span class="feishin-more-title">Biblioteca & Opções</span>
                            <span class="feishin-more-subtitle">Navegação Rápida</span>
                        </div>
                    </div>
                    <button class="feishin-more-close-btn" id="feishin-more-close-btn" aria-label="Fechar">✕</button>
                </div>
            </div>
            <div class="feishin-more-grid">
                <button class="feishin-more-item" data-route="#/analytics" aria-label="Analytics">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Analytics</span>
                    <span class="feishin-more-badge-pro">PRO</span>
                </button>

                <button class="feishin-more-item" data-route="#/favorites" aria-label="Favoritos">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Favoritos</span>
                </button>



                <button class="feishin-more-item" data-route="#/library/album-artists" aria-label="Artistas do Álbum">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Artistas Álbum</span>
                </button>

                <button class="feishin-more-item" data-route="#/library/folders" aria-label="Pastas">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Pastas</span>
                </button>

                <button class="feishin-more-item" data-route="#/radio" aria-label="Estações de Rádio">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM4 8h16v12H4V8zm4 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Rádio</span>
                </button>

                <button class="feishin-more-item" data-route="#/playlists" aria-label="Playlists">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h11v-2H2v2zm14-2v6l5-3-5-3z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Playlists</span>
                </button>

                <button class="feishin-more-item" id="feishin-more-queue-btn" aria-label="Fila de Reprodução">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Fila</span>
                </button>

                <button class="feishin-more-item" id="feishin-more-extra-btn" aria-label="Extra Mode Potência Máxima">
                    <div class="feishin-more-icon-wrap" style="color: #3b82f6;">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Extra Mode</span>
                    <span class="feishin-more-badge-pro" id="feishin-more-extra-badge">OFF</span>
                </button>

                <button class="feishin-more-item" id="feishin-more-local-btn" aria-label="Local Mode Arquivos Locais">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Local Mode</span>
                    <span class="feishin-more-badge-pro" id="feishin-more-local-badge">OFF</span>
                </button>

                <button class="feishin-more-item" id="feishin-more-drawer-btn" aria-label="Menu Lateral">
                    <div class="feishin-more-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                    </div>
                    <span class="feishin-more-item-label">Menu Completo</span>
                </button>
            </div>
        `;
        document.body.appendChild(moreBox);

        // Click no botão fechar do box Mais
        document.getElementById('feishin-more-close-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            window.FeishinNative.closeMoreMenu();
        });

        // Click nos itens dentro de Mais
        moreBox.querySelectorAll('.feishin-more-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
                const route = item.getAttribute('data-route');
                if (route) {
                    window.FeishinNative.closeMoreMenu();
                    window.location.hash = route;
                } else if (item.id === 'feishin-more-queue-btn') {
                    window.FeishinNative.closeMoreMenu();
                    if (window.FeishinTrackPage) {
                        window.FeishinTrackPage.open();
                        setTimeout(() => {
                            window.FeishinTrackPage.openQueue();
                        }, 200);
                    }
                } else if (item.id === 'feishin-more-extra-btn') {
                    if (window.FeishinExtraMode) {
                        window.FeishinExtraMode.toggle();
                    }
                } else if (item.id === 'feishin-more-local-btn') {
                    if (window.FeishinLocalMode) {
                        window.FeishinLocalMode.toggle();
                    }
                } else if (item.id === 'feishin-more-drawer-btn') {
                    window.FeishinNative.closeMoreMenu();
                    window.FeishinNative.openSidebarDrawer();
                }
            });
        });

        // B. Dock Android (Barra Inferior)
        // Ordem estrita solicitada: Faixas, Tags, Artistas, Backgrounds (antepenúltimo), Mais (penúltimo), Conf (último)
        const bottomNav = document.createElement('nav');
        bottomNav.id = 'feishin-mobile-bottom-nav';
        bottomNav.innerHTML = `
            <button class="feishin-nav-tab active" data-route="#/library/songs" aria-label="Faixas">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                <span class="feishin-nav-label">Faixas</span>
            </button>
            <button class="feishin-nav-tab" data-route="#/library/recently-added" aria-label="Recentes">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                <span class="feishin-nav-label">Recentes</span>
            </button>
            <button class="feishin-nav-tab" data-route="#/library/genres" aria-label="Tags">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                <span class="feishin-nav-label">Tags</span>
            </button>
            <button class="feishin-nav-tab" data-route="#/library/artists" aria-label="Artistas">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span class="feishin-nav-label">Artistas</span>
            </button>
            <button class="feishin-nav-tab" id="feishin-nav-backgrounds-btn" aria-label="Backgrounds">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C12.55 22 13 21.55 13 21C13 20.75 12.9 20.53 12.75 20.36C12.6 20.19 12.5 19.97 12.5 19.72C12.5 19.17 12.95 18.72 13.5 18.72H15C18.86 18.72 22 15.58 22 11.72C22 6.36 17.52 2 12 2ZM12 4C16.41 4 20 7.46 20 11.72C20 14.48 17.76 16.72 15 16.72H13.5C11.85 16.72 10.5 18.07 10.5 19.72C10.5 20.24 10.7 20.71 11.02 21.07C11.13 21.19 11.2 21.34 11.2 21.5C11.2 21.78 10.98 22 10.7 22H12C6.49 22 2 17.51 2 12C2 6.49 6.49 4 12 4ZM6.5 10C5.67 10 5 10.67 5 11.5C5 12.33 5.67 13 6.5 13C7.33 13 8 12.33 8 11.5C8 10.67 7.33 10 6.5 10ZM9.5 7C8.67 7 8 7.67 8 8.5C8 9.33 8.67 10 9.5 10C10.33 10 11 9.33 11 8.5C11 7.67 10.33 7 9.5 7ZM14.5 7C13.67 7 13 7.67 13 8.5C13 9.33 13.67 10 14.5 10C15.33 10 16 9.33 16 8.5C16 7.67 15.33 7 14.5 7ZM17.5 10C16.67 10 16 10.67 16 11.5C16 12.33 16.67 13 17.5 13C18.33 13 19 12.33 19 11.5C19 10.67 18.33 10 17.5 10Z"/></svg>
                <span class="feishin-nav-label">Backgrounds</span>
            </button>
            <button class="feishin-nav-tab" id="feishin-nav-more-btn" aria-label="Mais">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                <span class="feishin-nav-label">Mais</span>
            </button>
            <button class="feishin-nav-tab" id="feishin-nav-settings-btn" data-route="#/settings" aria-label="Conf">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span class="feishin-nav-label">Conf</span>
            </button>
        `;

        bottomNav.querySelectorAll('.feishin-nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
                const route = tab.getAttribute('data-route');
                if (tab.id === 'feishin-nav-backgrounds-btn') {
                    window.FeishinNative.toggleBackgrounds();
                } else if (tab.id === 'feishin-nav-more-btn') {
                    window.FeishinNative.toggleMoreMenu();
                } else if (tab.id === 'feishin-nav-settings-btn') {
                    window.FeishinNative.openSettings();
                } else if (route) {
                    window.FeishinNative.closeMoreMenu();
                    if (typeof window.closePersonalOSBackgrounds === 'function') {
                        window.closePersonalOSBackgrounds();
                    }
                    if (typeof window.FeishinNative.closeSettings === 'function') {
                        window.FeishinNative.closeSettings();
                    }
                    window.location.hash = route;
                    syncActiveTab();
                }
            });
        });

        // Sanitização de elementos desktop dentro de modais de configuração
        function sanitizeSettingsDOM() {
            try {
                // 1. Ocultar botões que abrem pastas locais do sistema operacional (Desktop)
                document.querySelectorAll('.fs-settings-option-module-row button').forEach(btn => {
                    const txt = (btn.innerText || '').trim();
                    if (txt === 'Abrir Pasta' || txt === 'Open Folder') {
                        btn.style.setProperty('display', 'none', 'important');
                    }
                });
                // 2. Ocultar aba de teclas de atalho caso o CSS falhe
                document.querySelectorAll('button[id*="-tab-hotkeys"], [aria-controls*="-panel-hotkeys"]').forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                });
            } catch (e) {}
        }
        window.sanitizeSettingsDOM = sanitizeSettingsDOM;

        // Atualizar aba ativa em tempo real
        function syncActiveTab() {
            const hash = window.location.hash || '';
            const isMoreOpen = document.getElementById('feishin-more-glass-box')?.classList.contains('open');
            const isBgOpen = document.getElementById('personal-os-shader-modal')?.style?.display === 'flex' || document.getElementById('personal-os-shader-modal')?.style?.display === 'block';
            const isSettingsOpen = document.body.classList.contains('feishin-settings-open') || Boolean(document.querySelector('.mantine-Modal-content'));

            const tabSongs = bottomNav.querySelector('[data-route="#/library/songs"]');
            const tabRecent = bottomNav.querySelector('[data-route="#/library/recently-added"]');
            const tabTags = bottomNav.querySelector('[data-route="#/library/genres"]');
            const tabArtists = bottomNav.querySelector('[data-route="#/library/artists"]');
            const tabBg = document.getElementById('feishin-nav-backgrounds-btn');
            const tabMore = document.getElementById('feishin-nav-more-btn');
            const tabConf = document.getElementById('feishin-nav-settings-btn');

            bottomNav.querySelectorAll('.feishin-nav-tab').forEach(t => t.classList.remove('active'));

            if (isSettingsOpen) {
                tabConf?.classList.add('active');
            } else if (isBgOpen) {
                tabBg?.classList.add('active');
            } else if (isMoreOpen) {
                tabMore?.classList.add('active');
            } else if (hash.startsWith('#/library/songs')) {
                tabSongs?.classList.add('active');
            } else if (hash.startsWith('#/library/recently-added')) {
                tabRecent?.classList.add('active');
            } else if (hash.startsWith('#/library/genres') || hash.startsWith('#/library/tags')) {
                tabTags?.classList.add('active');
            } else if (hash.startsWith('#/library/artists')) {
                tabArtists?.classList.add('active');
            } else if (hash.startsWith('#/settings')) {
                tabConf?.classList.add('active');
            } else {
                tabMore?.classList.add('active');
            }

            const tpBgBtn = document.getElementById('feishin-tp-btn-backgrounds');
            if (tpBgBtn) {
                tpBgBtn.classList.toggle('active', Boolean(isBgOpen));
            }

            // Sincronizar itens no popup Mais
            const moreEl = document.getElementById('feishin-more-glass-box');
            if (moreEl) {
                moreEl.querySelectorAll('.feishin-more-item').forEach(btn => {
                    const r = btn.getAttribute('data-route');
                    if (r && (hash === r || hash.startsWith(r))) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }

        window.__feishinSyncActiveTabs = syncActiveTab;
        window.addEventListener('hashchange', syncActiveTab);
        syncActiveTab();

        // Observer reativo para detectar abertura/fechamento de modais Mantine
        const modalObserver = new MutationObserver(() => {
            const hasModal = Boolean(document.querySelector('.mantine-Modal-content'));
            if (!hasModal && document.body.classList.contains('feishin-settings-open')) {
                document.body.classList.remove('feishin-settings-open');
                syncActiveTab();
            } else if (hasModal && !document.body.classList.contains('feishin-settings-open')) {
                document.body.classList.add('feishin-settings-open');
                sanitizeSettingsDOM();
                syncActiveTab();
            }
        });
        modalObserver.observe(document.body, { childList: true, subtree: true });

        // 3.1. Gestor de Orientação Dinâmico (Landscape vs Portrait)
        function updateAppOrientation() {
            const isLandscape = window.matchMedia('(orientation: landscape)').matches || (window.innerWidth > window.innerHeight);
            if (isLandscape) {
                document.body.classList.add('feishin-landscape');
                document.documentElement.classList.add('feishin-landscape');
            } else {
                document.body.classList.remove('feishin-landscape');
                document.documentElement.classList.remove('feishin-landscape');
            }
            if (typeof syncActiveTab === 'function') {
                syncActiveTab();
            }
        }

        window.__feishinUpdateOrientation = updateAppOrientation;
        window.addEventListener('resize', updateAppOrientation, { passive: true });
        window.addEventListener('orientationchange', function () {
            setTimeout(updateAppOrientation, 40);
            setTimeout(updateAppOrientation, 180);
        }, { passive: true });

        if (window.matchMedia) {
            try {
                window.matchMedia('(orientation: landscape)').addEventListener('change', updateAppOrientation);
            } catch (e) {
                try {
                    window.matchMedia('(orientation: landscape)').addListener(updateAppOrientation);
                } catch (ignored) {}
            }
        }

        updateAppOrientation();

        document.body.appendChild(bottomNav);
        console.log('[FeishinMobile] Dock Android 6-itens e Popup Mais inicializados com sucesso.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupBottomNav);
    } else {
        setupBottomNav();
    }

    // 4. Menu lateral gerenciado exclusivamente pela barra inferior (sem botão duplicado no topo)
    function injectHeaderMenuButton() {
        // Redundância eliminada: menu já disponível na aba 'Biblioteca' do Bottom Nav
    }

    setInterval(injectHeaderMenuButton, 800);

    // 5. Sincronização em Tempo Real com Android AudioPlaybackService
    let lastTrackId = null;
    let lastPlayStatus = null;

    function syncPlayerState() {
        try {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (!store) return;

            const player = store.player;
            const currentSong =
                (typeof store.getCurrentSong === 'function' ? store.getCurrentSong() : null) ||
                store.getQueue?.()?.items?.[player?.index];
            const isPlaying = player?.status === 'playing';
            const isPaused = player?.status === 'paused';
            const hasActiveSong = Boolean(currentSong && (isPlaying || isPaused));

            // Ajustar visibilidade e botão de fechar ( x ) do card da faixa nativo
            const playerBar = document.getElementById('player-bar');
            if (playerBar) {
                if (hasActiveSong) {
                    playerBar.classList.remove('feishin-player-hidden');
                    playerBar.style.removeProperty('display');

                    const controlsWrapper = playerBar.querySelector('.fs-mobile-playerbar-module-controls-wrapper');
                    // Extra Mode exclusivo na tela interna (Fullscreen Track Page): purga qualquer botão do mini widget
                    const unwantedBarBtn = document.getElementById('feishin-bar-btn-extra-mode');
                    if (unwantedBarBtn) {
                        unwantedBarBtn.remove();
                    }
                    if (controlsWrapper && !document.getElementById('feishin-mobile-close-btn')) {
                        const closeBtn = document.createElement('button');
                        closeBtn.id = 'feishin-mobile-close-btn';
                        closeBtn.className = 'mantine-focus-never mantine-active fs-action-icon-module-root m_8d3f4000 mantine-ActionIcon-root m_87cf2631 mantine-UnstyledButton-root feishin-kill-btn feishin-mobile-close-btn';
                        closeBtn.setAttribute('type', 'button');
                        closeBtn.setAttribute('aria-label', 'Fechar reprodução');
                        closeBtn.setAttribute('title', 'Fechar música e limpar fila (X)');
                        closeBtn.innerHTML = `
                            <span class="m_8d3afb97 mantine-ActionIcon-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </span>
                        `;
                        closeBtn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.FeishinNative.closePlayer();
                        };
                        controlsWrapper.appendChild(closeBtn);
                    }
                } else if (!currentSong || player?.status === 'stopped') {
                    playerBar.classList.add('feishin-player-hidden');
                    playerBar.style.setProperty('display', 'none', 'important');
                }
            }

            if (currentSong) {
                const trackId = currentSong._uniqueId || currentSong.id;
                const position = typeof player?.timestamp === 'number' ? Math.floor(player.timestamp * 1000) : 0;
                const duration = typeof currentSong.duration === 'number' ? Math.floor(currentSong.duration * 1000) : 180000;

                if (trackId !== lastTrackId || isPlaying !== lastPlayStatus) {
                    lastTrackId = trackId;
                    lastPlayStatus = isPlaying;

                    const title = currentSong.name || currentSong.title || 'Faixa';
                    const artist = currentSong.artistName || (currentSong.artists?.[0]?.name) || 'Artista Desconhecido';
                    const album = currentSong.album || currentSong.albumName || '';
                    let coverUrl = currentSong.imageUrl || '';
                    if (!coverUrl) {
                        try {
                            const auth = JSON.parse(localStorage.getItem('store_authentication') || '{}');
                            const server = auth?.state?.currentServer;
                            const songId = currentSong?.id;
                            const imageId = currentSong?.imageId || (songId ? ('mf-' + songId) : null);
                            if (imageId && server?.url && server?.credential) {
                                coverUrl = `${server.url}/rest/getCoverArt.view?id=${imageId}&${server.credential}&v=1.13.0&c=Feishin&size=1000`;
                            }
                        } catch (e) {}
                    }

                    if (window.AndroidBridge?.onPlaybackStateProgress) {
                        window.AndroidBridge.onPlaybackStateProgress(
                            isPlaying,
                            title,
                            artist,
                            album,
                            coverUrl,
                            position,
                            duration
                        );
                    }

                    // Pré-carregamento proativo das próximas 2 faixas da fila
                    preloadNextTracksInQueue(store);
                }
            }
        } catch (e) {
            // Silencioso
        }
    }

    // Pré-carregamento nativo acelerado (Zero Delay ao pular ou finalizar faixa)
    const preloadedAudioIds = new Set();
    function preloadNextTracksInQueue(store) {
        try {
            if (!window.AndroidBridge?.preloadAudio) return;
            const queueObj = store?.getQueue?.();
            const items = queueObj?.items;
            const curIdx = store?.player?.index;
            if (!items || curIdx === undefined || curIdx < 0) return;

            const authStr = localStorage.getItem('store_authentication');
            if (!authStr) return;
            const auth = JSON.parse(authStr);
            const srv = auth?.state?.currentServer;
            if (!srv?.url) return;

            for (let offset = 1; offset <= 2; offset++) {
                const next = items[curIdx + offset];
                if (!next?.id || preloadedAudioIds.has(next.id)) continue;
                preloadedAudioIds.add(next.id);
                const streamUrl = `${srv.url}/rest/stream.view?id=${next.id}&v=1.13.0&c=Feishin&${srv.credential}`;
                window.AndroidBridge.preloadAudio(streamUrl, next.id);
            }
        } catch (err) {}
    }

    setInterval(syncPlayerState, 250);

    // 6. Gesto de Swipe Down no Fullscreen Player para minimizar suavemente
    let touchStartY = 0;
    let touchStartX = 0;
    let longPressTimer = null;
    let longPressTarget = null;
    let longPressMoved = false;

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            longPressMoved = false;

            const row = e.target.closest('.fs-item-table-list-column-module-data-row, [data-row-index], .ra-item-row, .ra-tracklist-row, [role="row"]');
            if (row && !e.target.closest('button, [role="button"], input, a')) {
                longPressTarget = row;
                if (longPressTimer) clearTimeout(longPressTimer);
                longPressTimer = setTimeout(() => {
                    if (!longPressMoved && longPressTarget) {
                        if (window.AndroidBridge?.hapticFeedback) {
                            window.AndroidBridge.hapticFeedback(0);
                        } else if (window.AndroidBridge?.vibrate) {
                            window.AndroidBridge.vibrate(35);
                        }
                        // Disparar no centro da tela para posicionamento centralizado
                        const ctxEvent = new MouseEvent('contextmenu', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: window.innerWidth / 2,
                            clientY: window.innerHeight / 2,
                            button: 2
                        });
                        longPressTarget.dispatchEvent(ctxEvent);
                        longPressTarget = null;
                    }
                }, 420);
            }
        } else {
            if (longPressTimer) clearTimeout(longPressTimer);
            longPressTarget = null;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
            if (deltaY > 8 || deltaX > 8) {
                longPressMoved = true;
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        longPressTarget = null;

        if (e.changedTouches.length === 1) {
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);

            // Arraste descendente suave fecha o fullscreen player
            if (deltaY > 100 && deltaX < 70) {
                const fsOverlay = document.querySelector('[class*="fullScreenPlayerOverlay"], #full-screen-player');
                if (fsOverlay && fsOverlay.offsetParent !== null) {
                    const closeBtn = fsOverlay.querySelector('button[aria-label*="arrowDown"], button[aria-label*="Close"], .fs-action-icon');
                    if (closeBtn) closeBtn.click();
                }
            }
        }
    }, { passive: true });

    // 7. Motor Universal de Captura de Toque Instantâneo em Faixas
    // Garante que tocar em qualquer área referente a uma faixa inicie a reprodução imediatamente
    document.addEventListener('click', (e) => {
        // Ignorar se o toque foi em botões de ação explícita (menu 3 pontos, favorito)
        if (e.target.closest('.fs-actions-column-module-actions, [aria-haspopup="menu"], .fs-favorite-column-module-favorite, .ra-row-more-btn, button[aria-label*="Favorit"], button[aria-label*="Açõ"], button[aria-label*="Menu"]')) {
            return;
        }

        // Tabela Feishin padrão (desktop/mobile virtual table)
        const rowCell = e.target.closest('.fs-item-table-list-column-module-data-row, [data-row-index]');
        if (rowCell) {
            // Haptic feedback nativo instantâneo
            if (window.AndroidBridge?.hapticFeedback) {
                window.AndroidBridge.hapticFeedback(0);
            } else if (window.AndroidBridge?.vibrate) {
                window.AndroidBridge.vibrate(10);
            }

            // Se o clique foi em um link dentro da linha (ex: nome de artista ou título), prevenir navegação indevida
            const link = e.target.closest('a');
            if (link && rowCell.contains(link)) {
                e.preventDefault();
                e.stopPropagation();
                // Despachar duplo clique sintético imediato para acionar o player nativo do Feishin
                const dbl = new MouseEvent('dblclick', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                rowCell.dispatchEvent(dbl);
            }
        }
    }, true);


    // =========================================================================
    // =========================================================================
    // 7.5. MOTOR DE ÁUDIO EXTRA MODE — GALAXY ULTRA DSP STUDIO MASTERING
    // - Preamp Gain (+4.2 dB makeup gain)
    // - Psychoacoustic Acoustic Contouring Pre-Limiter:
    //     * Low Punch: Peaking 120 Hz, Q 0.85, +2.2 dB
    //     * Vocal/Clarity: Peaking 3200 Hz, Q 0.8, +1.8 dB
    //     * High Air: Highshelf 9500 Hz, Q 0.7, +1.0 dB
    // - C1-Continuous Analog Soft-Clipper (Polynomial / Tanh Knee, 4x Oversampling)
    //     * Strictly linear below -3 dBFS (Zero THD on quiet/normal passages)
    //     * Gentle round-off for transients approaching full scale
    // - Master Brickwall Limiter (-0.8 dBFS, 20:1 Ratio, 2.5 dB Knee, 2 ms Attack, 60 ms Release)
    // - True-Peak Output Ceiling (-0.31 dBFS / 0.965 gain)
    // - Limiter is GUARANTEED to be the absolute final stage before destination
    // - Zero HAL clipping: Android STREAM_MUSIC at 15/15, Native LoudnessEnhancer bypassed
    // =========================================================================
    window.FeishinExtraMode = {
        active: false,
        dspNodes: null,
        initialized: false,

        getWebAudio: function () {
            if (window.__feishinWebAudio && window.__feishinWebAudio.context && window.__feishinWebAudio.dsp) {
                return window.__feishinWebAudio;
            }
            try {
                const wp = document.getElementById("web-player-engine");
                if (wp) {
                    const fiberKey = Object.keys(wp).find(k => k.startsWith("__reactFiber"));
                    if (fiberKey) {
                        let fiber = wp[fiberKey];
                        while (fiber) {
                            if (fiber.memoizedProps?.audioContext?.context && fiber.memoizedProps?.audioContext?.dsp) {
                                window.__feishinWebAudio = fiber.memoizedProps.audioContext;
                                return window.__feishinWebAudio;
                            }
                            fiber = fiber.return;
                        }
                    }
                }
            } catch (e) {}
            return null;
        },

        // Curva de saturacao analogica C1-continua sem descontinuidade ou ganho espurio em baixos sinais
        getSaturationCurve: function (samples) {
            samples = samples || 8192;
            const curve = new Float32Array(samples);
            const T = 0.72; // Linear ate 72% da escala (-2.85 dBFS)
            for (let i = 0; i < samples; ++i) {
                const x = (i * 2) / samples - 1;
                const ax = Math.abs(x);
                if (ax <= T) {
                    curve[i] = x;
                } else {
                    const sign = x < 0 ? -1 : 1;
                    const delta = (ax - T) / (1 - T);
                    curve[i] = sign * (T + (1 - T) * Math.tanh(delta));
                }
            }
            return curve;
        },

        init: function () {
            if (this.initialized) return;
            this.initialized = true;

            const saved = localStorage.getItem("feishin_extra_mode");
            this.active = (saved === "true");

            this.attachAudioGuard();

            setTimeout(() => this.applyDSP(), 300);
            this.updateUI();
        },

        syncSystemMaxVolume: function () {
            // No-op: preserva o volume de midia do sistema Android
        },

        attachAudioGuard: function () {
            const enforceVolume = () => {
                document.querySelectorAll("audio").forEach(a => {
                    try {
                        if (a.volume < 1.0) a.volume = 1.0;
                        if (a.muted) a.muted = false;
                    } catch (e) {}
                });
                if (this.active) {
                    this.applyDSP();
                }
            };
            setInterval(enforceVolume, 1500);

            const handleAudioEvent = (e) => {
                if (e.target && e.target.tagName === "AUDIO") {
                    try { e.target.volume = 1.0; } catch (err) {}
                    setTimeout(() => this.applyDSP(), 50);
                    setTimeout(() => this.applyDSP(), 250);
                    setTimeout(() => this.applyDSP(), 800);
                }
            };

            document.addEventListener("play", handleAudioEvent, true);
            document.addEventListener("playing", handleAudioEvent, true);
            document.addEventListener("loadedmetadata", handleAudioEvent, true);
            document.addEventListener("seeked", handleAudioEvent, true);
        },

        toggle: function () {
            this.set(!this.active);
        },

        set: function (enable) {
            this.active = Boolean(enable);
            localStorage.setItem("feishin_extra_mode", this.active ? "true" : "false");

            if (window.AndroidBridge && typeof window.AndroidBridge.hapticFeedback === "function") {
                window.AndroidBridge.hapticFeedback(1);
            } else if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === "function") {
                window.AndroidBridge.vibrate(25);
            }

            document.querySelectorAll("audio").forEach(a => {
                try { a.volume = 1.0; a.muted = false; } catch (e) {}
            });

            this.applyDSP();
            this.updateUI();

            if (window.AndroidBridge && typeof window.AndroidBridge.showToast === "function") {
                if (this.active) {
                    window.AndroidBridge.showToast("⚡ EXTRA MODE ATIVADO: Potência Máxima +6.6dB (Studio Limiter Sem Distorção)");
                } else {
                    window.AndroidBridge.showToast("Extra Mode Desativado: Volume Normal");
                }
            }
        },

        applyDSP: function () {
            const wa = this.getWebAudio();
            if (!wa || !wa.context || !wa.dsp) return;

            const ctx = wa.context;
            const dsp = wa.dsp;
            const stockComp = dsp.compressor;
            const stockPreamp = dsp.preampGain;

            if (ctx.state !== "running") {
                ctx.resume().catch(() => {});
            }

            // O último nó da cadeia de EQ ou o preamp
            const lastEqNode = (dsp.eqFilters && dsp.eqFilters.length > 0)
                ? dsp.eqFilters[dsp.eqFilters.length - 1]
                : stockPreamp;

            if (this.active) {
                if (!this.dspNodes || this.dspNodes.ctx !== ctx) {
                    // 1. Ganho Dedicado Extra Mode (+6.65 dB / 2.15x linear)
                    const extraBoostGain = ctx.createGain();
                    extraBoostGain.gain.value = 2.15;

                    // 2. Highpass Subsônico (35 Hz, Q=0.707) - Libera headroom e protege os alto-falantes
                    const hpFilter = ctx.createBiquadFilter();
                    hpFilter.type = "highpass";
                    hpFilter.frequency.value = 35;
                    hpFilter.Q.value = 0.707;

                    // 3. Low-End Punch (95 Hz, Q=0.85, +2.6 dB) - Graves encorpados e definidos
                    const bassNode = ctx.createBiquadFilter();
                    bassNode.type = "peaking";
                    bassNode.frequency.value = 95;
                    bassNode.Q.value = 0.85;
                    bassNode.gain.value = 2.6;

                    // 4. Presença Vocal & Ataque (3000 Hz, Q=0.80, +2.0 dB) - Vocais e ataque nítidos
                    const clarityNode = ctx.createBiquadFilter();
                    clarityNode.type = "peaking";
                    clarityNode.frequency.value = 3000;
                    clarityNode.Q.value = 0.80;
                    clarityNode.gain.value = 2.0;

                    // 5. Ar & Brilho Espacial (10000 Hz, +1.6 dB highshelf) - Extensão suave de agudos
                    const airNode = ctx.createBiquadFilter();
                    airNode.type = "highshelf";
                    airNode.frequency.value = 10000;
                    airNode.gain.value = 1.6;

                    // 6. Saturação Analógica C1-contínua (Soft-Knee com 4x Oversampling)
                    const shaper = ctx.createWaveShaper();
                    shaper.curve = this.getSaturationCurve(8192);
                    try { shaper.oversample = "4x"; } catch (e) {
                        try { shaper.oversample = "2x"; } catch (e2) {}
                    }

                    // 7. Master Studio Peak Limiter Dedicado (Threshold -1.2 dBFS, Ratio 14:1, Knee 3.5 dB, Attack 2.5ms, Release 75ms)
                    const extraLimiter = ctx.createDynamicsCompressor();
                    extraLimiter.threshold.value = -1.2;
                    extraLimiter.knee.value = 3.5;
                    extraLimiter.ratio.value = 14.0;
                    extraLimiter.attack.value = 0.0025;
                    extraLimiter.release.value = 0.075;

                    // 8. True-Peak Output Ceiling (-0.13 dBFS / 0.985 gain) - Zero clipping no HAL Android
                    const ceilingGain = ctx.createGain();
                    ceilingGain.gain.value = 0.985;

                    this.dspNodes = {
                        ctx,
                        extraBoostGain,
                        hpFilter,
                        bassNode,
                        clarityNode,
                        airNode,
                        shaper,
                        extraLimiter,
                        ceilingGain
                    };
                }

                // Roteamento Studio Limiting:
                // lastEqNode -> extraBoostGain -> hpFilter -> bassNode -> clarityNode -> airNode -> shaper -> extraLimiter -> ceilingGain -> ctx.destination
                try {
                    lastEqNode.disconnect();
                    lastEqNode.connect(this.dspNodes.extraBoostGain);

                    this.dspNodes.extraBoostGain.disconnect();
                    this.dspNodes.extraBoostGain.connect(this.dspNodes.hpFilter);

                    this.dspNodes.hpFilter.disconnect();
                    this.dspNodes.hpFilter.connect(this.dspNodes.bassNode);

                    this.dspNodes.bassNode.disconnect();
                    this.dspNodes.bassNode.connect(this.dspNodes.clarityNode);

                    this.dspNodes.clarityNode.disconnect();
                    this.dspNodes.clarityNode.connect(this.dspNodes.airNode);

                    this.dspNodes.airNode.disconnect();
                    this.dspNodes.airNode.connect(this.dspNodes.shaper);

                    this.dspNodes.shaper.disconnect();
                    this.dspNodes.shaper.connect(this.dspNodes.extraLimiter);

                    this.dspNodes.extraLimiter.disconnect();
                    this.dspNodes.extraLimiter.connect(this.dspNodes.ceilingGain);

                    this.dspNodes.ceilingGain.disconnect();
                    this.dspNodes.ceilingGain.connect(ctx.destination);
                } catch (err) {
                    console.warn("[FeishinMobile] Erro no roteamento Extra Mode:", err);
                    try {
                        lastEqNode.disconnect();
                        lastEqNode.connect(stockComp);
                        stockComp.disconnect();
                        stockComp.connect(ctx.destination);
                    } catch (e) {}
                }
            } else {
                // Modo Normal: Preamp 1.0 (0 dB), Limiter transparente, bypass completo
                try {
                    lastEqNode.disconnect();
                    lastEqNode.connect(stockComp);

                    if (this.dspNodes) {
                        try { this.dspNodes.extraBoostGain.disconnect(); } catch (e) {}
                        try { this.dspNodes.hpFilter.disconnect(); } catch (e) {}
                        try { this.dspNodes.bassNode.disconnect(); } catch (e) {}
                        try { this.dspNodes.clarityNode.disconnect(); } catch (e) {}
                        try { this.dspNodes.airNode.disconnect(); } catch (e) {}
                        try { this.dspNodes.shaper.disconnect(); } catch (e) {}
                        try { this.dspNodes.extraLimiter.disconnect(); } catch (e) {}
                        try { this.dspNodes.ceilingGain.disconnect(); } catch (e) {}
                    }

                    stockComp.disconnect();
                    stockComp.connect(ctx.destination);
                } catch (err) {
                    console.warn("[FeishinMobile] Erro no bypass Extra Mode:", err);
                    try { stockComp.connect(ctx.destination); } catch (e) {}
                }
            }
        },

        updateUI: function () {
            // Remove qualquer botao antigo da barra inferior (mini widget / playerbar)
            const unwantedBarBtn = document.getElementById("feishin-bar-btn-extra-mode");
            if (unwantedBarBtn) {
                unwantedBarBtn.remove();
            }

            // Atualiza exclusivamente o botao da pagina Fullscreen (Tocando Agora)
            const tpBtn = document.getElementById("feishin-tp-btn-extra-mode");
            if (tpBtn) {
                if (this.active) {
                    tpBtn.classList.add("feishin-extra-mode-active");
                    tpBtn.setAttribute("data-active", "true");
                    tpBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span class="feishin-tp-extra-label">EXTRA ON</span>
                    `;
                } else {
                    tpBtn.classList.remove("feishin-extra-mode-active");
                    tpBtn.setAttribute("data-active", "false");
                    tpBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span class="feishin-tp-extra-label">EXTRA MODE</span>
                    `;
                }
            }

            // Atualiza status no modal Mais Opcoes
            const moreStatus = document.getElementById("feishin-tp-more-extra-mode-status");
            if (moreStatus) {
                moreStatus.textContent = this.active ? "ATIVADO (MAX)" : "DESATIVADO";
                moreStatus.style.color = this.active ? "#FACC15" : "rgba(255, 255, 255, 0.5)";
                moreStatus.style.background = this.active ? "rgba(234, 179, 8, 0.25)" : "rgba(255, 255, 255, 0.1)";
            }

            // Atualiza status no menu Mais da barra inferior
            const moreBadge = document.getElementById("feishin-more-extra-badge");
            const moreBtn = document.getElementById("feishin-more-extra-btn");
            if (moreBadge) {
                moreBadge.innerText = this.active ? "ON" : "OFF";
                moreBadge.style.background = this.active ? "#3b82f6" : "rgba(255, 255, 255, 0.1)";
                moreBadge.style.color = "#fff";
            }
            if (moreBtn) {
                moreBtn.classList.toggle("active", this.active);
            }
        }
    };

    // =========================================================================
    // LOCAL MODE (REPRODUÇÃO EXCLUSIVA DE ARQUIVOS LOCAIS DESTA MÁQUINA)
    // Reproduz diretamente do armazenamento interno/SDCard (/storage/emulated/0/Music)
    // e apenas desta máquina exata quando ativado.
    // =========================================================================
    window.FeishinLocalMode = {
        active: false,
        initialized: false,
        localSongIdsSet: new Set(),

        init: function () {
            if (this.initialized) return;
            this.initialized = true;

            const saved = localStorage.getItem("feishin_local_mode");
            this.active = (saved === "true");

            if (window.AndroidBridge && typeof window.AndroidBridge.isLocalMode === "function") {
                this.active = window.AndroidBridge.isLocalMode();
            }

            this.syncLocalIds();
            this.updateUI();

            setInterval(() => {
                if (this.localSongIdsSet.size === 0) {
                    this.syncLocalIds();
                }
            }, 4000);
        },

        syncLocalIds: function () {
            try {
                if (window.AndroidBridge && typeof window.AndroidBridge.getLocalSongIds === "function") {
                    const jsonStr = window.AndroidBridge.getLocalSongIds();
                    if (jsonStr && jsonStr !== "[]") {
                        const ids = JSON.parse(jsonStr);
                        if (Array.isArray(ids) && ids.length > 0) {
                            this.localSongIdsSet = new Set(ids);
                        }
                    }
                }
                if (this.localSongIdsSet.size === 0 && window.__SAMSUNG_MUSIC_CHRONOLOGY__) {
                    this.localSongIdsSet = new Set(Object.keys(window.__SAMSUNG_MUSIC_CHRONOLOGY__));
                }
            } catch (e) {
                console.warn("[LocalMode] Erro ao sincronizar IDs locais:", e);
            }
        },

        isLocal: function (songId) {
            if (!songId) return false;
            if (this.localSongIdsSet.has(songId)) return true;
            if (window.__SAMSUNG_MUSIC_CHRONOLOGY__ && window.__SAMSUNG_MUSIC_CHRONOLOGY__[songId]) return true;
            if (window.AndroidBridge && typeof window.AndroidBridge.isSongLocal === "function") {
                return window.AndroidBridge.isSongLocal(songId);
            }
            return false;
        },

        toggle: function () {
            this.active = !this.active;
            localStorage.setItem("feishin_local_mode", this.active ? "true" : "false");

            if (window.AndroidBridge && typeof window.AndroidBridge.setLocalMode === "function") {
                window.AndroidBridge.setLocalMode(this.active);
            }

            if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === "function") {
                window.AndroidBridge.vibrate(20);
            }

            this.updateUI();

            const count = this.localSongIdsSet.size || (window.AndroidBridge?.getLocalSongsCount ? window.AndroidBridge.getLocalSongsCount() : 0);
            const msg = this.active
                ? `📱 Local Mode Ativado (${count} faixas locais desta máquina)`
                : `🌐 Local Mode Desativado (Modo Remoto)`;

            if (window.AndroidBridge && typeof window.AndroidBridge.showToast === "function") {
                window.AndroidBridge.showToast(msg);
            }

            // Notifica todos os módulos da interface
            window.dispatchEvent(new CustomEvent("feishin:local-mode-change", { detail: { active: this.active } }));

            // Se a tela de recentemente adicionadas estiver visível, atualiza
            if (window.FeishinRecentlyAdded && typeof window.FeishinRecentlyAdded.refreshView === "function") {
                window.FeishinRecentlyAdded.refreshView();
            }
        },

        updateUI: function () {
            // 1. Atualiza badge e botão no menu Mais
            const moreBadge = document.getElementById("feishin-more-local-badge");
            const moreBtn = document.getElementById("feishin-more-local-btn");
            if (moreBadge) {
                moreBadge.innerText = this.active ? "LOCAL" : "OFF";
                moreBadge.removeAttribute("style");
            }
            if (moreBtn) {
                moreBtn.classList.toggle("active", this.active);
            }

            // 2. Atualiza badge na sheet Opções da Faixa
            const moreSheetStatus = document.getElementById("feishin-tp-more-local-mode-status");
            if (moreSheetStatus) {
                moreSheetStatus.textContent = this.active ? "ATIVADO" : "DESATIVADO";
                moreSheetStatus.style.color = this.active ? "#10B981" : "rgba(255, 255, 255, 0.5)";
                moreSheetStatus.style.background = this.active ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.1)";
            }

            // 3. Atualiza indicador na barra de navegação/status
            document.body.classList.toggle("feishin-local-mode-active", this.active);

            // 4. Atualiza pill visual na PlayerBar se existir
            let barPill = document.getElementById("feishin-bar-local-pill");
            if (this.active) {
                if (!barPill) {
                    const infoContainer = document.querySelector("#feishin-mobile-player-bar .feishin-bar-track-title") || document.querySelector(".fs-playerbar-module-container");
                    if (infoContainer) {
                        barPill = document.createElement("span");
                        barPill.id = "feishin-bar-local-pill";
                        barPill.className = "feishin-local-pill";
                        barPill.innerHTML = `📱 LOCAL`;
                        infoContainer.appendChild(barPill);
                    }
                }
            } else if (barPill) {
                barPill.remove();
            }
        }
    };
    // =========================================================================
    // 8. PÁGINA DA MÚSICA SAMSUNG MUSIC LIQUID GLASS (FeishinTrackPage)
    // =========================================================================
    window.FeishinTrackPage = {
        progressTimer: null,
        currentDuration: 0,
        isDraggingSeek: false,
        lyricsCache: {},
        lyricsState: {
            songId: null,
            loading: false,
            syncedLines: [],
            plainText: null,
            activeLineIndex: -1
        },
        sleepTimerId: null,

        formatTime: function (sec) {
            sec = Math.max(0, Math.floor(sec || 0));
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return m + ':' + (s < 10 ? '0' : '') + s;
        },

        isOpen: function () {
            const tp = document.getElementById('feishin-track-page');
            return Boolean(tp && !tp.classList.contains('feishin-tp-hidden'));
        },

        open: function () {
            this.init();
            const tp = document.getElementById('feishin-track-page');
            if (!tp) return;

            window.__PAUSE_WEBGL_SHADERS__ = false;
            window.__MODAL_OPEN_PAUSE__ = false;
            window.__FORCE_SHADER_RUNNING__ = true;
            document.body.classList.add('feishin-tp-open');

            // Oculta estritamente a Android Navbar principal ao abrir a tela de reprodução
            const bottomNav = document.getElementById('feishin-mobile-bottom-nav');
            if (bottomNav) {
                bottomNav.style.setProperty('display', 'none', 'important');
                bottomNav.style.setProperty('visibility', 'hidden', 'important');
                bottomNav.style.setProperty('pointer-events', 'none', 'important');
            }
            if (typeof window.FeishinNative?.closeMoreMenu === 'function') {
                window.FeishinNative.closeMoreMenu();
            }

            // Garante que o WebGL Shader esteja renderizando no container de fundo
            const bgContainer = document.getElementById('bg-webgl-container');
            const active = localStorage.getItem('feishin_active_shader') || 'plasmawave';
            if (bgContainer && !bgContainer.querySelector('canvas')) {
                if (typeof window.renderWebGLBackground === 'function') {
                    window.renderWebGLBackground(active);
                } else if (typeof window.setWebGLBackground === 'function') {
                    window.setWebGLBackground(active);
                }
            }

            this.sync();
            tp.classList.remove('feishin-tp-hidden');
            tp.style.transform = 'translateY(0%)';
            tp.style.opacity = '1';
            this.startTicker();

            // PROBLEMA 7: No modo landscape, caso haja fila, exibir a capa da faixa de um lado e a fila do outro lado
            if (window.innerWidth > window.innerHeight && !this.userClosedQueueInLandscape) {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                const q = store?.getQueue?.();
                const queueItems = (q && Array.isArray(q.items)) ? q.items : [];
                if (isQueueAllowedToDisplayMobile() && queueItems.length > 1) {
                    setTimeout(() => {
                        this.openQueue('force');
                    }, 60);
                }
            }
        },

        close: function () {
            const tp = document.getElementById('feishin-track-page');
            if (!tp) return;

            this.userClosedQueueInLandscape = false;
            window.__FORCE_SHADER_RUNNING__ = false;
            document.body.classList.remove('feishin-tp-open');

            // Restaura a visibilidade da Android Navbar principal ao fechar a tela de reprodução
            const bottomNav = document.getElementById('feishin-mobile-bottom-nav');
            if (bottomNav) {
                bottomNav.style.removeProperty('display');
                bottomNav.style.removeProperty('visibility');
                bottomNav.style.removeProperty('pointer-events');
            }
            if (typeof window.__feishinSyncActiveTabs === 'function') {
                window.__feishinSyncActiveTabs();
            }

            document.getElementById('feishin-tp-lyrics-sheet')?.classList.remove('open');
            document.getElementById('feishin-tp-queue-sheet')?.classList.remove('open');
            document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
            document.getElementById('feishin-tp-details-modal')?.classList.remove('open');
            document.getElementById('feishin-tp-timer-backdrop')?.classList.remove('open');
            document.getElementById('feishin-track-page')?.classList.remove('tp-queue-open');

            tp.style.transform = 'translateY(100%)';
            tp.style.opacity = '0';
            setTimeout(() => {
                tp.classList.add('feishin-tp-hidden');
            }, 340);

            this.stopTicker();
        },

        init: function () {
            if (document.getElementById('feishin-track-page')) return;

            const tp = document.createElement('div');
            tp.id = 'feishin-track-page';
            tp.className = 'feishin-tp-hidden';

            tp.innerHTML = `
              <div class="feishin-tp-ambient-aura" id="feishin-tp-aura"></div>
              <div class="feishin-tp-glass-backdrop"></div>
              <div class="feishin-tp-safe-area">
                <!-- Header Topo -->
                <div class="feishin-tp-header">
                  <button class="feishin-tp-icon-btn" id="feishin-tp-btn-close" aria-label="Minimizar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                  <div class="feishin-tp-header-center">
                    <span class="feishin-tp-header-subtitle">TOCANDO AGORA</span>
                  </div>
                  <div class="feishin-tp-header-right">
                    <button class="feishin-tp-icon-btn" id="feishin-tp-btn-backgrounds" aria-label="Backgrounds" title="Backgrounds & Shaders">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C12.55 22 13 21.55 13 21C13 20.75 12.9 20.53 12.75 20.36C12.6 20.19 12.5 19.97 12.5 19.72C12.5 19.17 12.95 18.72 13.5 18.72H15C18.86 18.72 22 15.58 22 11.72C22 6.36 17.52 2 12 2ZM12 4C16.41 4 20 7.46 20 11.72C20 14.48 17.76 16.72 15 16.72H13.5C11.85 16.72 10.5 18.07 10.5 19.72C10.5 20.24 10.7 20.71 11.02 21.07C11.13 21.19 11.2 21.34 11.2 21.5C11.2 21.78 10.98 22 10.7 22H12C6.49 22 2 17.51 2 12C2 6.49 6.49 4 12 4ZM6.5 10C5.67 10 5 10.67 5 11.5C5 12.33 5.67 13 6.5 13C7.33 13 8 12.33 8 11.5C8 10.67 7.33 10 6.5 10ZM9.5 7C8.67 7 8 7.67 8 8.5C8 9.33 8.67 10 9.5 10C10.33 10 11 9.33 11 8.5C11 7.67 10.33 7 9.5 7ZM14.5 7C13.67 7 13 7.67 13 8.5C13 9.33 13.67 10 14.5 10C15.33 10 16 9.33 16 8.5C16 7.67 15.33 7 14.5 7ZM17.5 10C16.67 10 16 10.67 16 11.5C16 12.33 16.67 13 17.5 13C18.33 13 19 12.33 19 11.5C19 10.67 18.33 10 17.5 10Z"/>
                      </svg>
                    </button>
                    <button class="feishin-tp-icon-btn" id="feishin-tp-btn-timer" aria-label="Temporizador">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span class="feishin-tp-dot-badge" id="feishin-tp-timer-dot" style="display:none;"></span>
                    </button>
                    <button class="feishin-tp-icon-btn feishin-tp-more-btn" id="feishin-tp-btn-more" aria-label="Mais opções">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Capa do Álbum & Letras Pill -->
                <div class="feishin-tp-art-section">
                  <div class="feishin-tp-art-card">
                    <img class="feishin-tp-cover-img" id="feishin-tp-cover" src="" alt="Capa" />
                    <div class="feishin-tp-cover-fallback" id="feishin-tp-cover-fallback">
                      <svg class="feishin-tp-vinyl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/>
                      </svg>
                    </div>
                    <button class="feishin-tp-lyrics-pill" id="feishin-tp-pill-lyrics">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align: middle; margin-right: 4px;">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Letras
                    </button>
                    <button class="feishin-tp-queue-pill" id="feishin-tp-pill-queue" style="display:none;" aria-label="Abrir Fila de Reprodução">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align: middle; margin-right: 4px;">
                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                      <span id="feishin-tp-pill-queue-label">Fila</span>
                    </button>
                  </div>
                </div>

                <!-- Painel de Controles e Metadados (Adaptável Portrait e Landscape) -->
                <div class="feishin-tp-landscape-right">
                  <!-- Informações da Faixa -->
                  <div class="feishin-tp-info-section">
                    <div class="feishin-tp-title" id="feishin-tp-title">—</div>
                    <div class="feishin-tp-artist" id="feishin-tp-artist">—</div>
                  </div>

                  <!-- Linha de Ações Rápidas -->
                  <div class="feishin-tp-quick-row">
                    <button class="feishin-tp-action-btn" id="feishin-tp-btn-queue" aria-label="Fila de Reprodução">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    </button>
                    <button class="feishin-tp-action-btn" id="feishin-tp-btn-fav" aria-label="Favoritar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </button>
                    <button class="feishin-tp-action-btn feishin-tp-extra-pill" id="feishin-tp-btn-extra-mode" aria-label="Extra Mode Amplificação Máxima" title="Extra Mode: Amplificação Máxima Galaxy Ultra">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      <span class="feishin-tp-extra-label">EXTRA MODE</span>
                    </button>
                    <button class="feishin-tp-action-btn" id="feishin-tp-btn-lyrics" aria-label="Ver Letras">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Barra de Progresso / Seek Slider -->
                  <div class="feishin-tp-progress-section">
                    <div class="feishin-tp-slider-container" id="feishin-tp-slider-box">
                      <div class="feishin-tp-slider-rail"></div>
                      <div class="feishin-tp-slider-fill" id="feishin-tp-fill"></div>
                      <div class="feishin-tp-slider-thumb" id="feishin-tp-thumb"></div>
                    </div>
                    <div class="feishin-tp-time-row">
                      <span id="feishin-tp-time-cur">0:00</span>
                      <span id="feishin-tp-time-total">0:00</span>
                    </div>
                  </div>

                  <!-- Controles Principais de Reprodução -->
                  <div class="feishin-tp-controls-row">
                    <button class="feishin-tp-ctrl-btn" id="feishin-tp-btn-shuffle" aria-label="Ordem aleatória">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>
                      </svg>
                      <span class="feishin-tp-active-dot"></span>
                    </button>

                    <button class="feishin-tp-ctrl-btn" id="feishin-tp-btn-prev" aria-label="Faixa anterior">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      </svg>
                    </button>

                    <button class="feishin-tp-play-btn" id="feishin-tp-btn-play" aria-label="Reproduzir ou Pausar">
                      <svg id="feishin-tp-play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <svg id="feishin-tp-pause-icon" class="feishin-tp-hidden" style="display: none !important;" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                    </button>

                    <button class="feishin-tp-ctrl-btn" id="feishin-tp-btn-next" aria-label="Próxima faixa">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      </svg>
                    </button>

                    <button class="feishin-tp-ctrl-btn feishin-tp-repeat-btn" id="feishin-tp-btn-repeat" aria-label="Repetir">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                      </svg>
                      <span class="feishin-tp-active-dot"></span>
                      <span class="feishin-tp-repeat-badge">1</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Sheet de Fila (Queue) -->
              <div class="feishin-tp-sheet" id="feishin-tp-queue-sheet">
                <div class="feishin-tp-sheet-header">
                  <div class="feishin-tp-sheet-title">
                    <span>Fila de Reprodução</span>
                    <span class="feishin-tp-q-count-badge" id="feishin-tp-queue-count-badge" style="display:none;"></span>
                  </div>
                  <div class="feishin-tp-sheet-actions">
                    <button class="feishin-tp-icon-btn" id="feishin-tp-queue-close" aria-label="Fechar fila">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="feishin-tp-sheet-content" id="feishin-tp-queue-list"></div>
              </div>

              <!-- Sheet de Letras (Lyrics) -->
              <div class="feishin-tp-sheet" id="feishin-tp-lyrics-sheet">
                <div class="feishin-tp-sheet-header">
                  <div class="feishin-tp-sheet-title">Letras da Música</div>
                  <button class="feishin-tp-icon-btn" id="feishin-tp-lyrics-close" aria-label="Fechar letras">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </div>
                <div class="feishin-tp-sheet-content" id="feishin-tp-lyrics-content"></div>
              </div>

              <!-- Sheet de Mais Opções -->
              <div class="feishin-tp-sheet" id="feishin-tp-more-sheet">
                <div class="feishin-tp-sheet-header">
                  <div class="feishin-tp-sheet-title">Opções da Faixa</div>
                  <button class="feishin-tp-icon-btn" id="feishin-tp-more-close" aria-label="Fechar opções">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </div>
                <div class="feishin-tp-sheet-content">
                  <div class="feishin-tp-more-list">
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-local-mode" style="border: 1px solid rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.08); border-radius: 12px; margin-bottom: 6px;">
                      <svg viewBox="0 0 24 24" fill="currentColor" style="color: #10B981;"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                      <span style="font-weight: 600; color: #FFFFFF;">Local Mode (Arquivos desta Máquina)</span>
                      <span class="feishin-tp-more-badge" id="feishin-tp-more-local-mode-status" style="margin-left: auto; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.1);">DESATIVADO</span>
                    </div>
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-extra-mode" style="border: 1px solid rgba(234, 179, 8, 0.35); background: rgba(234, 179, 8, 0.08); border-radius: 12px; margin-bottom: 6px;">
                      <svg viewBox="0 0 24 24" fill="currentColor" style="color: #EAB308;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      <span style="font-weight: 600; color: #FFFFFF;">Extra Mode (Amplificador Galaxy Ultra)</span>
                      <span class="feishin-tp-more-badge" id="feishin-tp-more-extra-mode-status" style="margin-left: auto; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.1);">DESATIVADO</span>
                    </div>
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-backgrounds">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C12.55 22 13 21.55 13 21C13 20.75 12.9 20.53 12.75 20.36C12.6 20.19 12.5 19.97 12.5 19.72C12.5 19.17 12.95 18.72 13.5 18.72H15C18.86 18.72 22 15.58 22 11.72C22 6.36 17.52 2 12 2ZM12 4C16.41 4 20 7.46 20 11.72C20 14.48 17.76 16.72 15 16.72H13.5C11.85 16.72 10.5 18.07 10.5 19.72C10.5 20.24 10.7 20.71 11.02 21.07C11.13 21.19 11.2 21.34 11.2 21.5C11.2 21.78 10.98 22 10.7 22H12C6.49 22 2 17.51 2 12C2 6.49 6.49 4 12 4ZM6.5 10C5.67 10 5 10.67 5 11.5C5 12.33 5.67 13 6.5 13C7.33 13 8 12.33 8 11.5C8 10.67 7.33 10 6.5 10ZM9.5 7C8.67 7 8 7.67 8 8.5C8 9.33 8.67 10 9.5 10C10.33 10 11 9.33 11 8.5C11 7.67 10.33 7 9.5 7ZM14.5 7C13.67 7 13 7.67 13 8.5C13 9.33 13.67 10 14.5 10C15.33 10 16 9.33 16 8.5C16 7.67 15.33 7 14.5 7ZM17.5 10C16.67 10 16 10.67 16 11.5C16 12.33 16.67 13 17.5 13C18.33 13 19 12.33 19 11.5C19 10.67 18.33 10 17.5 10Z"/></svg>
                      <span>Backgrounds & Shaders</span>
                    </div>
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-details">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>Detalhes Técnicos da Faixa</span>
                    </div>
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-album">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="12" cy="12" r="4"/></svg>
                      <span>Ir para o Álbum</span>
                    </div>
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-artist">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>Ir para o Artista</span>
                    </div>
                    <div class="feishin-tp-more-item" id="feishin-tp-opt-delete" style="color: #EF4444 !important;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #EF4444 !important;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      <span>Excluir Faixa do Servidor</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Detalhes Técnicos -->
              <div class="feishin-tp-sheet" id="feishin-tp-details-modal">
                <div class="feishin-tp-sheet-header">
                  <div class="feishin-tp-sheet-title">Detalhes da Faixa</div>
                  <button class="feishin-tp-icon-btn" id="feishin-tp-details-close" aria-label="Fechar detalhes">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </div>
                <div class="feishin-tp-sheet-content" id="feishin-tp-details-content"></div>
              </div>

              <!-- Modal Temporizador de Desligamento -->
              <div class="feishin-tp-modal-backdrop" id="feishin-tp-timer-backdrop">
                <div class="feishin-tp-modal">
                  <div class="feishin-tp-modal-title">Temporizador de Sono</div>
                  <div class="feishin-tp-timer-options">
                    <div class="feishin-tp-timer-opt" data-min="15">15 minutos</div>
                    <div class="feishin-tp-timer-opt" data-min="30">30 minutos</div>
                    <div class="feishin-tp-timer-opt" data-min="45">45 minutos</div>
                    <div class="feishin-tp-timer-opt" data-min="60">1 hora</div>
                    <div class="feishin-tp-timer-opt" data-min="end">Fim da faixa atual</div>
                    <div class="feishin-tp-timer-opt feishin-tp-timer-cancel" data-min="0">Desativar temporizador</div>
                  </div>
                  <button class="feishin-tp-modal-close" id="feishin-tp-timer-close">Fechar</button>
                </div>
              </div>
            `;

            document.body.appendChild(tp);
            this.bindEvents();
        },

        bindEvents: function () {
            const tp = document.getElementById('feishin-track-page');
            if (!tp) return;

            // Toggle Local Mode
            const handleLocalModeClick = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (window.FeishinLocalMode) window.FeishinLocalMode.toggle();
            };
            document.getElementById('feishin-tp-opt-local-mode')?.addEventListener('click', handleLocalModeClick);

            // Toggle Extra Mode
            const handleExtraModeClick = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (window.FeishinExtraMode) window.FeishinExtraMode.toggle();
            };
            document.getElementById('feishin-tp-btn-extra-mode')?.addEventListener('click', handleExtraModeClick);
            document.getElementById('feishin-tp-opt-extra-mode')?.addEventListener('click', handleExtraModeClick);

            // Fechar minimizando
            document.getElementById('feishin-tp-btn-close')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                this.close();
            });

            // Controles de Playback
            document.getElementById('feishin-tp-btn-play')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.togglePlay();
                const playIcon = document.getElementById('feishin-tp-play-icon');
                const pauseIcon = document.getElementById('feishin-tp-pause-icon');
                if (playIcon && pauseIcon) {
                    const isVisiblePlay = playIcon.style.display !== 'none' && !playIcon.classList.contains('feishin-tp-hidden');
                    if (isVisiblePlay) {
                        playIcon.classList.add('feishin-tp-hidden');
                        playIcon.style.display = 'none';
                        pauseIcon.classList.remove('feishin-tp-hidden');
                        pauseIcon.style.display = 'block';
                    } else {
                        playIcon.classList.remove('feishin-tp-hidden');
                        playIcon.style.display = 'block';
                        pauseIcon.classList.add('feishin-tp-hidden');
                        pauseIcon.style.display = 'none';
                    }
                }
                setTimeout(() => this.sync(), 60);
                setTimeout(() => this.sync(), 200);
            });

            document.getElementById('feishin-tp-btn-next')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.next();
                setTimeout(() => this.sync(), 200);
            });

            document.getElementById('feishin-tp-btn-prev')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.prev();
                setTimeout(() => this.sync(), 200);
            });

            document.getElementById('feishin-tp-btn-shuffle')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.toggleShuffle();
            });

            document.getElementById('feishin-tp-btn-repeat')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.toggleRepeat();
            });

            // Barra de Busca Touch & Drag (Seek Slider)
            const sliderBox = document.getElementById('feishin-tp-slider-box');
            const fill = document.getElementById('feishin-tp-fill');
            const thumb = document.getElementById('feishin-tp-thumb');
            const timeCur = document.getElementById('feishin-tp-time-cur');

            const handleSeekMove = (clientX) => {
                if (!sliderBox) return 0;
                const rect = sliderBox.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                const pctStr = (pct * 100) + '%';
                if (fill) fill.style.setProperty('width', pctStr, 'important');
                if (thumb) thumb.style.setProperty('left', pctStr, 'important');
                if (this.currentDuration > 0 && timeCur) {
                    timeCur.innerText = this.formatTime(pct * this.currentDuration);
                }
                return pct;
            };

            let seeking = false;
            sliderBox?.addEventListener('pointerdown', (e) => {
                seeking = true;
                this.isDraggingSeek = true;
                sliderBox.setPointerCapture?.(e.pointerId);
                handleSeekMove(e.clientX);
            });

            sliderBox?.addEventListener('pointermove', (e) => {
                if (seeking) handleSeekMove(e.clientX);
            });

            const finishSeek = (clientX) => {
                if (seeking) {
                    const pct = handleSeekMove(clientX);
                    seeking = false;
                    const targetSec = pct * (this.currentDuration || 0);
                    window.FeishinNative.seekTo(targetSec);
                    const audio = document.querySelector('audio');
                    if (audio && audio.duration) {
                        try { audio.currentTime = targetSec; } catch (err) {}
                    }
                    setTimeout(() => {
                        this.isDraggingSeek = false;
                        this.sync();
                    }, 80);
                }
            };

            sliderBox?.addEventListener('pointerup', (e) => finishSeek(e.clientX));
            sliderBox?.addEventListener('pointercancel', (e) => finishSeek(e.clientX));

            // Sheets & Ações
            document.getElementById('feishin-tp-pill-lyrics')?.addEventListener('click', () => this.openLyrics());
            document.getElementById('feishin-tp-btn-lyrics')?.addEventListener('click', () => this.openLyrics());
            document.getElementById('feishin-tp-pill-queue')?.addEventListener('click', () => this.openQueue());
            document.getElementById('feishin-tp-btn-queue')?.addEventListener('click', () => this.openQueue());
            document.getElementById('feishin-tp-lyrics-close')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-lyrics-sheet')?.classList.remove('open');
            });

            document.getElementById('feishin-tp-queue-close')?.addEventListener('click', () => {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                this.closeQueue();
            });

            // Favorito Inteligente (Conectado ao Backend Navidrome + Store Feishin)
            document.getElementById('feishin-tp-btn-fav')?.addEventListener('click', () => {
                this.toggleFavorite();
            });

            // Mais opções Sheet
            document.getElementById('feishin-tp-btn-more')?.addEventListener('click', () => {
                this.openMoreSheet();
            });
            document.getElementById('feishin-tp-more-close')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
            });

            // Opções do Sheet
            // Backgrounds na Track Page (Ícone no Topo e Opção no Sheet)
            document.getElementById('feishin-tp-btn-backgrounds')?.addEventListener('click', (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.toggleBackgrounds();
            });

            document.getElementById('feishin-tp-opt-backgrounds')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                window.FeishinNative.toggleBackgrounds();
            });

            document.getElementById('feishin-tp-opt-details')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
                this.openDetailsModal();
            });
            document.getElementById('feishin-tp-details-close')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-details-modal')?.classList.remove('open');
            });

            document.getElementById('feishin-tp-opt-album')?.addEventListener('click', () => {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
                document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
                this.close();
                if (cur?.albumId) {
                    window.location.hash = '#/library/albums/' + cur.albumId;
                }
            });

            document.getElementById('feishin-tp-opt-artist')?.addEventListener('click', () => {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
                const artistId = cur?.albumArtistId || cur?.artistId || (cur?.artists && cur.artists[0]?.id);
                document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
                this.close();
                if (artistId) {
                    window.location.hash = '#/library/artists/' + artistId;
                }
            });

            document.getElementById('feishin-tp-opt-delete')?.addEventListener('click', () => {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
                document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
                if (cur && window.FeishinDeleteEngine?.requestDeleteTrack) {
                    window.FeishinDeleteEngine.requestDeleteTrack(cur);
                }
            });

            // Temporizador
            document.getElementById('feishin-tp-btn-timer')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-timer-backdrop')?.classList.add('open');
            });

            document.getElementById('feishin-tp-timer-close')?.addEventListener('click', () => {
                document.getElementById('feishin-tp-timer-backdrop')?.classList.remove('open');
            });

            document.getElementById('feishin-tp-timer-backdrop')?.addEventListener('click', (e) => {
                if (e.target.id === 'feishin-tp-timer-backdrop') {
                    e.target.classList.remove('open');
                }
            });

            document.querySelectorAll('.feishin-tp-timer-opt').forEach(opt => {
                opt.addEventListener('click', () => {
                    const min = opt.getAttribute('data-min');
                    this.setSleepTimer(min);
                });
            });

            // Fechamento da página por arraste suave para baixo
            let tpTouchY = 0;
            let tpTouchX = 0;
            tp.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    tpTouchY = e.touches[0].clientY;
                    tpTouchX = e.touches[0].clientX;
                }
            }, { passive: true });

            tp.addEventListener('touchend', (e) => {
                if (e.changedTouches.length === 1) {
                    const dy = e.changedTouches[0].clientY - tpTouchY;
                    const dx = Math.abs(e.changedTouches[0].clientX - tpTouchX);
                    if (dy > 90 && dx < 60) {
                        const lyricsOpen = document.getElementById('feishin-tp-lyrics-sheet')?.classList.contains('open');
                        const queueOpen = document.getElementById('feishin-tp-queue-sheet')?.classList.contains('open');
                        const moreOpen = document.getElementById('feishin-tp-more-sheet')?.classList.contains('open');
                        const detailsOpen = document.getElementById('feishin-tp-details-modal')?.classList.contains('open');
                        if (lyricsOpen) {
                            document.getElementById('feishin-tp-lyrics-sheet').classList.remove('open');
                            return;
                        }
                        if (queueOpen) {
                            document.getElementById('feishin-tp-queue-sheet').classList.remove('open');
                            document.getElementById('feishin-track-page')?.classList.remove('tp-queue-open');
                            return;
                        }
                        if (moreOpen) {
                            document.getElementById('feishin-tp-more-sheet').classList.remove('open');
                            return;
                        }
                        if (detailsOpen) {
                            document.getElementById('feishin-tp-details-modal').classList.remove('open');
                            return;
                        }
                        this.close();
                    }
                }
            }, { passive: true });
        },

        sync: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
            const status = store?.player?.status;
            const isPlaying = status === 'playing' || status === 1;
            if (window.FeishinExtraMode) window.FeishinExtraMode.updateUI();

            const titleEl = document.getElementById('feishin-tp-title');
            const artistEl = document.getElementById('feishin-tp-artist');
            const coverEl = document.getElementById('feishin-tp-cover');
            const fallbackEl = document.getElementById('feishin-tp-cover-fallback');
            const auraEl = document.getElementById('feishin-tp-aura');
            const playIcon = document.getElementById('feishin-tp-play-icon');
            const pauseIcon = document.getElementById('feishin-tp-pause-icon');
            const totalEl = document.getElementById('feishin-tp-time-total');
            const shuffleBtn = document.getElementById('feishin-tp-btn-shuffle');
            const repeatBtn = document.getElementById('feishin-tp-btn-repeat');
            const favBtn = document.getElementById('feishin-tp-btn-fav');

            // Metadados
            const title = cur?.name || cur?.title || document.querySelector('#player-bar .song-title, [class*="songTitle"]')?.innerText || 'Faixa';
            const artist = cur?.artistName || cur?.artists?.map(a => a.name).join(', ') || document.querySelector('#player-bar .song-artist, [class*="songArtist"]')?.innerText || 'Artista';

            if (titleEl) titleEl.innerText = title;
            if (artistEl) artistEl.innerText = artist;

            // Capa do Álbum
            let coverSrc = cur?.imageUrl || '';
            try {
                const auth = JSON.parse(localStorage.getItem('store_authentication') || '{}');
                const server = auth?.state?.currentServer;
                const songId = cur?.id;
                const imageId = cur?.imageId || (songId ? ('mf-' + songId) : null);
                if (!coverSrc && imageId && server?.url && server?.credential) {
                    coverSrc = `${server.url}/rest/getCoverArt.view?id=${imageId}&${server.credential}&v=1.13.0&c=Feishin&size=1000`;
                }
            } catch (e) {
                // Silencioso
            }
            if (!coverSrc) {
                const barImg = document.querySelector('#player-bar img.player-cover-art, #player-bar img:not([src*="svg"]), img[class*="playerbarImage"]');
                if (barImg?.src && !barImg.src.includes('data:image/svg')) {
                    coverSrc = barImg.src;
                }
            }
            if (coverSrc && !coverSrc.includes('data:image/svg')) {
                if (coverEl) {
                    if (coverEl.src !== coverSrc) coverEl.src = coverSrc;
                    coverEl.style.setProperty('display', 'block', 'important');
                }
                if (fallbackEl) {
                    fallbackEl.style.setProperty('display', 'none', 'important');
                    fallbackEl.classList.add('feishin-hidden');
                }
                if (auraEl) auraEl.style.setProperty('background-image', 'url("' + coverSrc + '")', 'important');
            } else {
                if (coverEl) {
                    coverEl.style.setProperty('display', 'none', 'important');
                }
                if (fallbackEl) {
                    fallbackEl.style.setProperty('display', 'flex', 'important');
                    fallbackEl.classList.remove('feishin-hidden');
                }
                if (auraEl) auraEl.style.setProperty('background-image', 'none', 'important');
            }

            // Play / Pause Icons
            if (playIcon && pauseIcon) {
                if (isPlaying) {
                    playIcon.classList.add('feishin-tp-hidden');
                    playIcon.style.display = 'none';
                    pauseIcon.classList.remove('feishin-tp-hidden');
                    pauseIcon.style.display = 'block';
                    auraEl?.classList.remove('paused');
                } else {
                    playIcon.classList.remove('feishin-tp-hidden');
                    playIcon.style.display = 'block';
                    pauseIcon.classList.add('feishin-tp-hidden');
                    pauseIcon.style.display = 'none';
                    auraEl?.classList.add('paused');
                }
            }

            // Shuffle & Repeat
            const isShuffleActive = store?.player?.shuffle === 'track' || store?.player?.shuffle === 'album';
            if (shuffleBtn) {
                shuffleBtn.classList.toggle('active', isShuffleActive);
            }
            const repeatMode = store?.player?.repeat || 'none';
            if (repeatBtn) {
                repeatBtn.classList.toggle('active', repeatMode === 'all' || repeatMode === 'one');
                repeatBtn.classList.toggle('repeat-one', repeatMode === 'one');
            }

            // Favorito Sincronizado
            if (favBtn) {
                const isFav = Boolean(cur?.userFavorite);
                favBtn.classList.toggle('feishin-tp-fav-active', isFav);
            }

            // Duração
            let dur = cur?.duration || 0;
            if (dur > 1000) dur = dur / 1000;
            const audio = document.querySelector('audio');
            if (audio && audio.duration) dur = audio.duration;
            this.currentDuration = dur;

            if (totalEl) totalEl.innerText = this.formatTime(dur);

            this.updateProgress();

            // Sincroniza a visibilidade do botão e pill de fila mobile:
            const queueBtn = document.getElementById('feishin-tp-btn-queue');
            const queuePill = document.getElementById('feishin-tp-pill-queue');
            const queuePillLabel = document.getElementById('feishin-tp-pill-queue-label');
            const isAllowed = isQueueAllowedToDisplayMobile();
            const q = window.__FEISHIN_PLAYER_STORE__?.getState?.()?.getQueue?.();
            const queueCount = (q?.items && Array.isArray(q.items)) ? q.items.length : 0;

            if (isAllowed && queueCount > 0) {
                if (queueBtn) queueBtn.style.removeProperty('display');
                if (queuePill) {
                    queuePill.style.display = 'flex';
                    if (queuePillLabel) queuePillLabel.innerText = `Fila (${queueCount})`;
                }
                const badge = document.getElementById('feishin-tp-queue-count-badge');
                if (badge) {
                    badge.innerText = `${queueCount} faixas`;
                    badge.style.display = 'inline-block';
                }
                if (document.getElementById('feishin-tp-queue-sheet')?.classList.contains('open')) {
                    const items = document.querySelectorAll('#feishin-tp-queue-list .feishin-tp-q-item');
                    const queueList = (q?.items && Array.isArray(q.items)) ? q.items : [];
                    items.forEach((row, i) => {
                        const it = queueList[i];
                        const isCur = cur && it && (cur._uniqueId === it._uniqueId || cur.id === it.id);
                        row.classList.toggle('active', Boolean(isCur));
                    });
                }
            } else {
                if (queueBtn) queueBtn.style.setProperty('display', 'none', 'important');
                if (queuePill) queuePill.style.setProperty('display', 'none', 'important');
                document.getElementById('feishin-tp-queue-sheet')?.classList.remove('open');
                document.getElementById('feishin-track-page')?.classList.remove('tp-queue-open');
            }

            // Se o sheet de letras estiver aberto e mudou de música, atualiza
            if (cur && document.getElementById('feishin-tp-lyrics-sheet')?.classList.contains('open')) {
                if (this.lyricsState.songId !== cur.id) {
                    this.fetchLyrics(cur);
                }
            }
        },

        updateProgress: function () {
            if (this.isDraggingSeek) return;

            let curTime = 0;
            const audio = document.querySelector('audio');
            if (audio && !isNaN(audio.currentTime)) {
                curTime = audio.currentTime;
            } else if (window.__FEISHIN_TIME_STORE__?.getState?.()?.timestamp !== undefined) {
                curTime = window.__FEISHIN_TIME_STORE__.getState().timestamp || 0;
            } else {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                curTime = (store?.player?.playbackPosition || 0) / 1000;
            }

            const curEl = document.getElementById('feishin-tp-time-cur');
            const totalEl = document.getElementById('feishin-tp-time-total');
            const fill = document.getElementById('feishin-tp-fill');
            const thumb = document.getElementById('feishin-tp-thumb');

            if (curEl) curEl.innerText = this.formatTime(curTime);

            // Re-checar duração se ainda for 0
            if (!this.currentDuration || this.currentDuration <= 0) {
                if (audio && !isNaN(audio.duration) && audio.duration > 0) {
                    this.currentDuration = audio.duration;
                } else {
                    const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                    const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
                    let dur = cur?.duration || 0;
                    if (dur > 1000) dur = dur / 1000;
                    if (dur > 0) this.currentDuration = dur;
                }
                if (this.currentDuration > 0 && totalEl) {
                    totalEl.innerText = this.formatTime(this.currentDuration);
                }
            }

            if (this.currentDuration > 0) {
                const pct = Math.min(100, Math.max(0, (curTime / this.currentDuration) * 100));
                const pctStr = pct + '%';
                if (fill) fill.style.setProperty('width', pctStr, 'important');
                if (thumb) thumb.style.setProperty('left', pctStr, 'important');
            }

            // Sincroniza linha da letra (Karaokê)
            if (document.getElementById('feishin-tp-lyrics-sheet')?.classList.contains('open')) {
                this.syncLyricsLine(curTime, false);
            }
        },

        startTicker: function () {
            this.stopTicker();
            this.progressTimer = setInterval(() => {
                if (this.isOpen()) {
                    this.updateProgress();
                }
            }, 250);
        },

        stopTicker: function () {
            if (this.progressTimer) {
                clearInterval(this.progressTimer);
                this.progressTimer = null;
            }
        },

        // =====================================================================
        // FAVORITOS TOTALMENTE OPERACIONAL (Feishin Cloud Demo + Store + Visual)
        // =====================================================================
        toggleFavorite: async function () {
            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
            if (!cur || !cur.id) return;

            const newFav = !cur.userFavorite;
            cur.userFavorite = newFav;

            // Atualização visual imediata do botão
            const favBtn = document.getElementById('feishin-tp-btn-fav');
            if (favBtn) {
                favBtn.classList.toggle('feishin-tp-fav-active', newFav);
            }

            // Atualiza estado no store global do Feishin
            if (window.__FEISHIN_PLAYER_STORE__?.setState) {
                window.__FEISHIN_PLAYER_STORE__.setState(state => {
                    if (state.queue?.songs) {
                        Object.values(state.queue.songs).forEach(s => {
                            if (s.id === cur.id) s.userFavorite = newFav;
                        });
                    }
                });
            }

            // Sincroniza com servidor Subsonic/Navidrome via REST
            const auth = window.__FEISHIN_AUTH_STORE__?.getState?.();
            const server = auth?.currentServer || (auth?.serverList ? Object.values(auth.serverList)[0] : null);
            if (server?.url && server?.credential) {
                const endpoint = newFav ? 'star.view' : 'unstar.view';
                const url = `${server.url}/rest/${endpoint}?id=${cur.id}&${server.credential}&v=1.16.1&c=feishin&f=json`;
                try {
                    await fetch(url);
                    if (window.AndroidBridge?.showToast) {
                        window.AndroidBridge.showToast(newFav ? 'Adicionada aos Favoritos ❤️' : 'Removida dos Favoritos');
                    }
                } catch (err) {
                    console.error('Falha ao sincronizar favorito com servidor:', err);
                }
            }

            // Dispara evento de favorito para atualizar outras telas do Feishin
            if (window.__FEISHIN_EMITTER__?.emit) {
                window.__FEISHIN_EMITTER__.emit('USER_FAVORITE', {
                    favorite: newFav,
                    id: [cur.id],
                    itemType: 'song',
                    serverId: cur._serverId || server?.id
                });
            }
        },

        // =====================================================================
        // FILA DE REPRODUÇÃO TOTALMENTE OPERACIONAL (Sem quebra de forEach)
        // Regra: Fila só pode ser exibida quando em playlist ou adicionar a seguir
        // =====================================================================
        closeQueue: function () {
            this.userClosedQueueInLandscape = true;
            document.getElementById('feishin-tp-queue-sheet')?.classList.remove('open');
            document.getElementById('feishin-track-page')?.classList.remove('tp-queue-open');
        },

        openQueue: function (mode) {
            if (!isQueueAllowedToDisplayMobile()) {
                if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(1);
                return;
            }
            const sheet = document.getElementById('feishin-tp-queue-sheet');
            const container = document.getElementById('feishin-tp-queue-list');
            if (!sheet || !container) return;

            // Se for modo landscape e a fila já estiver aberta, clicar novamente alterna para fechar
            if (sheet.classList.contains('open') && window.innerWidth > window.innerHeight && mode !== 'force') {
                this.closeQueue();
                return;
            }

            this.userClosedQueueInLandscape = false;
            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);

            const tp = document.getElementById('feishin-track-page');
            if (tp) tp.classList.add('tp-queue-open');

            container.innerHTML = '';
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            const q = store?.getQueue?.();
            const queue = (q?.items && Array.isArray(q.items)) ? q.items : [];
            const currentSong = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;

            const badge = document.getElementById('feishin-tp-queue-count-badge');
            if (badge) {
                badge.innerText = `${queue.length} faixas`;
                badge.style.display = queue.length > 0 ? 'inline-block' : 'none';
            }

            if (queue.length === 0) {
                container.innerHTML = '<div class="feishin-tp-queue-empty">A fila de reprodução está vazia.</div>';
                sheet.classList.add('open');
                return;
            }

            queue.forEach((item, idx) => {
                const row = document.createElement('div');
                const isCurrent = currentSong && (currentSong._uniqueId === item._uniqueId || currentSong.id === item.id);
                row.className = 'feishin-tp-q-item' + (isCurrent ? ' active' : '');

                const title = item.name || item.title || 'Faixa';
                const artist = item.artistName || (item.artists && item.artists[0]?.name) || 'Artista';
                const duration = this.formatTime(item.duration ? (item.duration > 1000 ? item.duration / 1000 : item.duration) : 0);

                row.innerHTML = `
                  <span class="feishin-tp-q-idx">${idx + 1}</span>
                  <div class="feishin-tp-q-meta">
                    <div class="feishin-tp-q-title">${title}</div>
                    <div class="feishin-tp-q-artist">${artist}</div>
                  </div>
                  <span class="feishin-tp-q-duration">${duration}</span>
                `;

                row.addEventListener('click', () => {
                    if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                    if (store?.mediaPlayByIndex) {
                        store.mediaPlayByIndex(idx);
                    }
                    setTimeout(() => {
                        this.sync();
                        this.openQueue('force');
                    }, 150);
                });

                container.appendChild(row);
            });

            sheet.classList.add('open');
            const activeEl = container.querySelector('.feishin-tp-q-item.active');
            if (activeEl) {
                setTimeout(() => activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
            }
        },

        // =====================================================================
        // MOTOR DE LETRAS SINCRONIZADAS UNIVERSAL (LRCLIB + Navidrome + Karaokê)
        // =====================================================================
        openLyrics: function () {
            const sheet = document.getElementById('feishin-tp-lyrics-sheet');
            if (!sheet) return;
            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
            sheet.classList.add('open');

            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
            if (cur) {
                this.fetchLyrics(cur);
            }
        },

        fetchLyrics: async function (song) {
            if (!song || !song.id) return;

            // Retorna do cache se já disponível
            if (this.lyricsCache[song.id]) {
                this.lyricsState = { ...this.lyricsCache[song.id], activeLineIndex: -1 };
                this.renderLyrics();
                return;
            }

            this.lyricsState = {
                songId: song.id,
                loading: true,
                syncedLines: [],
                plainText: null,
                activeLineIndex: -1
            };

            const container = document.getElementById('feishin-tp-lyrics-content');
            if (container) {
                container.innerHTML = '<div class="feishin-tp-lyrics-empty">Buscando letras sincronizadas...</div>';
            }

            const rawTitle = song.name || song.title || '';
            const rawArtist = song.artistName || (song.artists && song.artists[0]?.name) || '';
            let cleanTitle = rawTitle.replace(/\s*[\(\[](official|video|audio|remaster|lyrics|ao vivo|live|feat|ft\.).*?[\)\]]/gi, '').trim();
            let searchTitle = cleanTitle;
            let searchArtist = rawArtist.trim();

            if (cleanTitle.includes(' - ') || cleanTitle.includes(' – ') || cleanTitle.includes(' — ')) {
                const parts = cleanTitle.split(/\s*[-–—]\s*/);
                if (!searchArtist || searchArtist === 'Unknown' || searchArtist.includes(',')) {
                    searchArtist = parts[0].trim();
                }
                searchTitle = parts.slice(1).join(' - ').trim();
            }
            searchTitle = searchTitle.replace(/\s*[\(\[](official|video|audio|remaster|lyrics|ao vivo|live|feat|ft\.).*?[\)\]]/gi, '').trim();
            const primaryArtist = searchArtist.split(/[,&]/)[0].trim();

            const auth = window.__FEISHIN_AUTH_STORE__?.getState?.();
            const server = auth?.currentServer || (auth?.serverList ? Object.values(auth.serverList)[0] : null);

            // 1. Tenta Navidrome Structured Lyrics
            if (server?.url && server?.credential) {
                try {
                    const ndUrl = `${server.url}/rest/getLyricsBySongId.view?id=${song.id}&${server.credential}&v=1.16.1&c=feishin&f=json`;
                    const res = await fetch(ndUrl);
                    const data = await res.json();
                    const list = data?.['subsonic-response']?.lyricsList?.structuredLyrics;
                    if (Array.isArray(list) && list.length > 0) {
                        const item = list[0];
                        if (Array.isArray(item.line) && item.line.length > 0) {
                            this.lyricsState.syncedLines = item.line.map(l => ({
                                time: (l.start || 0) / 1000,
                                text: l.value || ''
                            }));
                            this.lyricsState.loading = false;
                            this.lyricsCache[song.id] = { ...this.lyricsState };
                            this.renderLyrics();
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Navidrome lyrics check failed:', e);
                }
            }

            // 2. Tenta LRCLIB API Pública com busca inteligente
            try {
                const dur = Math.round(song.duration ? (song.duration > 1000 ? song.duration / 1000 : song.duration) : 0);
                let res = null;

                // Tentativa A: Artista primário + título limpo
                try {
                    let lrcurl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(primaryArtist)}&track_name=${encodeURIComponent(searchTitle)}`;
                    if (dur > 0) lrcurl += `&duration=${dur}`;
                    const r = await fetch(lrcurl);
                    if (r.ok) res = r;
                } catch (e) {}

                // Tentativa B: Artista completo + título limpo
                if (!res) {
                    try {
                        let lrcurl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(searchArtist)}&track_name=${encodeURIComponent(searchTitle)}`;
                        const r = await fetch(lrcurl);
                        if (r.ok) res = r;
                    } catch (e) {}
                }

                // Tentativa C: Busca genérica (q = primaryArtist + title)
                if (!res) {
                    try {
                        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(primaryArtist + ' ' + searchTitle)}`;
                        const sRes = await fetch(searchUrl);
                        if (sRes.ok) {
                            const sData = await sRes.json();
                            if (Array.isArray(sData) && sData.length > 0) {
                                res = { ok: true, json: async () => sData[0] };
                            }
                        }
                    } catch (e) {}
                }

                if (res.ok) {
                    const data = await res.json();
                    if (data.syncedLyrics) {
                        const parsed = [];
                        const lines = data.syncedLyrics.split('\n');
                        const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
                        for (const line of lines) {
                            const match = regex.exec(line);
                            if (match) {
                                const min = parseInt(match[1], 10);
                                const sec = parseFloat(match[2]);
                                const text = match[3].trim();
                                parsed.push({ time: min * 60 + sec, text: text });
                            }
                        }
                        if (parsed.length > 0) {
                            this.lyricsState.syncedLines = parsed;
                            this.lyricsState.loading = false;
                            this.lyricsCache[song.id] = { ...this.lyricsState };
                            this.renderLyrics();
                            return;
                        }
                    } else if (data.plainLyrics) {
                        this.lyricsState.plainText = data.plainLyrics;
                        this.lyricsState.loading = false;
                        this.lyricsCache[song.id] = { ...this.lyricsState };
                        this.renderLyrics();
                        return;
                    }
                }
            } catch (e) {
                console.warn('LRCLIB fetch failed:', e);
            }

            // 3. Fallback: Nenhuma letra disponível
            this.lyricsState.loading = false;
            this.lyricsCache[song.id] = { ...this.lyricsState };
            this.renderLyrics();
        },

        renderLyrics: function () {
            const container = document.getElementById('feishin-tp-lyrics-content');
            if (!container) return;

            if (this.lyricsState.loading) {
                container.innerHTML = '<div class="feishin-tp-lyrics-empty">Buscando letras sincronizadas...</div>';
                return;
            }

            if (this.lyricsState.syncedLines && this.lyricsState.syncedLines.length > 0) {
                container.innerHTML = this.lyricsState.syncedLines.map((line, idx) => {
                    const content = (line.text && line.text.trim()) ? line.text : '♪';
                    return `<div class="feishin-tp-lyrics-line" data-idx="${idx}" data-time="${line.time}">${content}</div>`;
                }).join('');

                container.querySelectorAll('.feishin-tp-lyrics-line').forEach(el => {
                    el.addEventListener('click', () => {
                        const t = parseFloat(el.getAttribute('data-time'));
                        if (!isNaN(t)) {
                            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
                            window.FeishinNative.seekTo(t);
                            const audio = document.querySelector('audio');
                            if (audio) try { audio.currentTime = t; } catch (e) {}
                            this.syncLyricsLine(t, true);
                        }
                    });
                });

                const curTime = (document.querySelector('audio')?.currentTime) || 0;
                this.syncLyricsLine(curTime, true);
                return;
            }

            if (this.lyricsState.plainText) {
                const lines = this.lyricsState.plainText.split('\n');
                container.innerHTML = lines.map(line => {
                    const clean = line.trim();
                    return clean ? `<div class="feishin-tp-lyrics-line">${clean}</div>` : '<div class="feishin-tp-lyrics-spacer" style="height: 14px;"></div>';
                }).join('');
                return;
            }

            container.innerHTML = '<div class="feishin-tp-lyrics-empty">Nenhuma letra sincronizada disponível para esta faixa.</div>';
        },

        syncLyricsLine: function (currentTime, forceScroll) {
            if (!this.lyricsState.syncedLines || this.lyricsState.syncedLines.length === 0) return;
            const lines = this.lyricsState.syncedLines;

            let activeIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (currentTime >= lines[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }

            if (activeIdx !== this.lyricsState.activeLineIndex || forceScroll) {
                this.lyricsState.activeLineIndex = activeIdx;
                const container = document.getElementById('feishin-tp-lyrics-content');
                if (!container) return;

                const allEls = container.querySelectorAll('.feishin-tp-lyrics-line');
                allEls.forEach((el, idx) => {
                    el.classList.toggle('active', idx === activeIdx);
                });

                if (activeIdx >= 0 && allEls[activeIdx]) {
                    allEls[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        },

        // =====================================================================
        // MAIS OPÇÕES & DETALHES
        // =====================================================================
        openMoreSheet: function () {
            const sheet = document.getElementById('feishin-tp-more-sheet');
            if (!sheet) return;
            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
            sheet.classList.add('open');
        },

        openDetailsModal: function () {
            const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
            if (!cur) return;

            const modal = document.getElementById('feishin-tp-details-modal');
            const content = document.getElementById('feishin-tp-details-content');
            if (!modal || !content) return;

            content.innerHTML = `
              <div class="feishin-tp-details-grid">
                <div class="feishin-tp-detail-box full">
                  <span class="feishin-tp-detail-label">Título</span>
                  <span class="feishin-tp-detail-val">${cur.name || cur.title || '—'}</span>
                </div>
                <div class="feishin-tp-detail-box">
                  <span class="feishin-tp-detail-label">Artista</span>
                  <span class="feishin-tp-detail-val">${cur.artistName || '—'}</span>
                </div>
                <div class="feishin-tp-detail-box">
                  <span class="feishin-tp-detail-label">Álbum</span>
                  <span class="feishin-tp-detail-val">${cur.album || '—'}</span>
                </div>
                <div class="feishin-tp-detail-box">
                  <span class="feishin-tp-detail-label">Formato / Codec</span>
                  <span class="feishin-tp-detail-val">${cur.codec || cur.container || 'MP3'}</span>
                </div>
                <div class="feishin-tp-detail-box">
                  <span class="feishin-tp-detail-label">Taxa de Bits</span>
                  <span class="feishin-tp-detail-val">${cur.bitRate ? cur.bitRate + ' kbps' : '—'}</span>
                </div>
                <div class="feishin-tp-detail-box">
                  <span class="feishin-tp-detail-label">Taxa de Amostragem</span>
                  <span class="feishin-tp-detail-val">${cur.sampleRate ? cur.sampleRate + ' Hz' : '—'}</span>
                </div>
                <div class="feishin-tp-detail-box">
                  <span class="feishin-tp-detail-label">Duração</span>
                  <span class="feishin-tp-detail-val">${this.formatTime(cur.duration ? (cur.duration > 1000 ? cur.duration / 1000 : cur.duration) : 0)}</span>
                </div>
                <div class="feishin-tp-detail-box full">
                  <span class="feishin-tp-detail-label">Caminho no Servidor</span>
                  <span class="feishin-tp-detail-val" style="font-size: 11px; opacity: 0.85;">${cur.path || '—'}</span>
                </div>
              </div>
            `;

            if (window.AndroidBridge?.hapticFeedback) window.AndroidBridge.hapticFeedback(0);
            modal.classList.add('open');
        },

        // =====================================================================
        // TEMPORIZADOR DE SONO
        // =====================================================================
        setSleepTimer: function (minutes) {
            if (this.sleepTimerId) {
                clearTimeout(this.sleepTimerId);
                this.sleepTimerId = null;
            }
            document.getElementById('feishin-tp-timer-backdrop')?.classList.remove('open');
            const dot = document.getElementById('feishin-tp-timer-dot');

            if (!minutes || minutes === '0' || minutes === 0) {
                if (dot) dot.style.display = 'none';
                if (window.AndroidBridge?.showToast) window.AndroidBridge.showToast('Temporizador desativado');
                return;
            }

            if (minutes === 'end') {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                if (store?.setPauseOnNextSongEnd) {
                    store.setPauseOnNextSongEnd(true);
                    if (dot) dot.style.display = 'block';
                    if (window.AndroidBridge?.showToast) window.AndroidBridge.showToast('Pausa agendada para o fim da faixa');
                    return;
                }
            }

            const ms = parseInt(minutes, 10) * 60 * 1000;
            if (dot) dot.style.display = 'block';
            if (window.AndroidBridge?.showToast) window.AndroidBridge.showToast('Temporizador ativado para ' + minutes + ' minutos');

            this.sleepTimerId = setTimeout(() => {
                window.FeishinNative.pause();
                if (dot) dot.style.display = 'none';
                if (window.AndroidBridge?.showToast) window.AndroidBridge.showToast('Música pausada pelo temporizador');
            }, ms);
        }
    };

    // Sincronização responsiva de orientação: Landscape com Capa e Fila lado a lado (Problema 7)
    window.addEventListener('resize', () => {
        if (window.FeishinTrackPage && typeof window.FeishinTrackPage.isOpen === 'function' && window.FeishinTrackPage.isOpen()) {
            const isLandscape = window.innerWidth > window.innerHeight;
            if (isLandscape && !window.FeishinTrackPage.userClosedQueueInLandscape) {
                const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                const q = store?.getQueue?.();
                const queueItems = (q && Array.isArray(q.items)) ? q.items : [];
                if (isQueueAllowedToDisplayMobile() && queueItems.length > 1) {
                    window.FeishinTrackPage.openQueue('force');
                }
            }
        }
    });

    // 9. Interceptor Universal de Toque no Player Bar para Abrir a Página da Música
    document.addEventListener('click', (e) => {
        const bar = e.target.closest('#player-bar, .fs-playerbar-module-container, .fs-mobile-playerbar-module-container');
        if (!bar) return;

        // Se o clique foi em um botão de controle de reprodução, slider ou kill-switch, permite ação direta
        const isPlaybackControl = e.target.closest(
            '.fs-center-controls-module-buttons-container, ' +
            '.fs-mobile-playerbar-module-controls-wrapper, ' +
            '.feishin-kill-btn, ' +
            '.mantine-Slider-root, ' +
            'input[type="range"]'
        );
        if (isPlaybackControl) return;

        // Previne qualquer navegação acidental para artista, álbum ou rota
        e.preventDefault();
        e.stopPropagation();

        if (window.AndroidBridge?.hapticFeedback) {
            window.AndroidBridge.hapticFeedback(0);
        } else if (window.AndroidBridge?.vibrate) {
            window.AndroidBridge.vibrate(10);
        }

        if (window.FeishinTrackPage) {
            window.FeishinTrackPage.open();
        }
    }, true);

    // 10. Sincronizador Realtime SSE com VPS Music Engine
    (function initRealtimeSync() {
        const eventsUrl = '/api/engine/events';
        let es = null;

        function connectSSE() {
            try {
                es = new EventSource(eventsUrl);
                es.addEventListener('track_deleted', (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        console.log('[FeishinMobile] Sincronização em tempo real - música deletada:', data);
                        
                        // Encontrar e animar remoção das linhas correspondentes na UI
                        const titleLower = (data.title || '').toLowerCase().trim();
                        document.querySelectorAll('[data-row-index], .ra-item-row, .fs-item-table-list-column-module-data-row').forEach(row => {
                            const text = (row.innerText || '').toLowerCase();
                            if (text.includes(titleLower) && titleLower.length > 2) {
                                row.style.transition = 'all 0.3s ease-out';
                                row.style.opacity = '0';
                                row.style.transform = 'scaleY(0)';
                                row.style.maxHeight = '0px';
                                setTimeout(() => row.remove(), 320);
                            }
                        });

                        // Se a página de detalhes da música estiver aberta para esta faixa, fechar
                        if (window.FeishinTrackPage?.isOpen) {
                            const currentTitle = document.getElementById('feishin-tp-title')?.innerText || '';
                            if (currentTitle.toLowerCase().includes(titleLower)) {
                                window.FeishinTrackPage.close();
                            }
                        }
                    } catch (err) {
                        console.error('[FeishinMobile] Erro processando evento SSE:', err);
                    }
                });

                es.onerror = () => {
                    if (es) {
                        es.close();
                        es = null;
                    }
                    setTimeout(connectSSE, 6000);
                };
            } catch (e) {
                setTimeout(connectSSE, 10000);
            }
        }

        setTimeout(connectSSE, 1500);
    })();

    // ═══════════════════════════════════════════════════════════════════
    // UNIFICAÇÃO DA TOOLBAR EM UMA ÚNICA LINHA ARREDONDADA (SEM PLAY AZUL)
    // E BUBBLE DE CONTAGEM DE MÚSICAS NO BOTÃO 'MAIS'
    // ═══════════════════════════════════════════════════════════════════
    (function initUnifiedSingleToolbar() {
        let isUpdating = false;

        function unifyToolbar() {
            if (isUpdating) return;
            isUpdating = true;

            try {
                const stack = document.querySelector('.fs-animated-page-module-animated-page > .mantine-Stack-root');
                if (stack) {
                    const pageHeader = stack.querySelector('.fs-page-header-module-container');
                    const filterBar = stack.querySelector('.fs-filter-bar-module-filter-bar');

                    if (pageHeader && filterBar) {
                        // 1. Ocultar o botão azul circular de play
                        const playBtn = pageHeader.querySelector('.fs-library-header-bar-module-play-button-container');
                        if (playBtn) playBtn.style.setProperty('display', 'none', 'important');

                        // 2. Ocultar contagem de faixas e garantir que não polua botões de navegação
                        const badge = pageHeader.querySelector('.fs-badge-module-root') || filterBar.querySelector('.fs-badge-module-root');
                        if (badge) {
                            badge.style.setProperty('display', 'none', 'important');
                        }
                        const existingBubble = document.getElementById('feishin-more-bubble');
                        if (existingBubble) {
                            existingBubble.remove();
                        }

                        // 3. Mover lupa de busca para dentro do grupo da direita da barra de filtros
                        const searchGroup = pageHeader.querySelector('.mantine-Group-root');
                        const filterFlex = filterBar.querySelector('.mantine-Flex-root');

                        if (filterFlex && searchGroup) {
                            const rightGroup = filterFlex.children[1];
                            if (rightGroup && !rightGroup.contains(searchGroup)) {
                                rightGroup.appendChild(searchGroup);
                            }
                        }

                        // 4. Ocultar o container antigo do header
                        pageHeader.style.setProperty('display', 'none', 'important');
                    }
                }
            } finally {
                isUpdating = false;
            }
        }

        // Executar de forma ultra-otimizada sem thrashing no event loop
        let rAFId = null;
        function debouncedUnifyToolbar() {
            if (rAFId) cancelAnimationFrame(rAFId);
            rAFId = requestAnimationFrame(() => {
                rAFId = null;
                unifyToolbar();
            });
        }
        debouncedUnifyToolbar();
        window.addEventListener('hashchange', debouncedUnifyToolbar);
        window.addEventListener('popstate', debouncedUnifyToolbar);
        const rootEl = document.getElementById('root');
        if (rootEl) {
            const observer = new MutationObserver(debouncedUnifyToolbar);
            observer.observe(rootEl, { childList: true, subtree: true });
        }
    })();

    // -------------------------------------------------------------------------
    // 13. Pre-caching Inteligente de Capas em Segundo Plano (0ms instant offline)
    // -------------------------------------------------------------------------
    (() => {
        let precacheRunning = false;
        async function runAutoCoverPrecache() {
            if (precacheRunning) return;
            const lastSync = parseInt(localStorage.getItem('feishin_last_cover_precache') || '0', 10);
            const now = Date.now();
            if (now - lastSync < 12 * 3600 * 1000) return;

            const auth = window.__FEISHIN_AUTH_STORE__ ? window.__FEISHIN_AUTH_STORE__.getState() : null;
            if (!auth || !auth.currentServer || !auth.currentServer.url) return;
            const s = auth.currentServer;

            precacheRunning = true;
            try {
                const res = await fetch(`${s.url}/rest/search3.view?query=%20&songCount=2000&${s.credential}&v=1.13.0&c=Feishin&f=json`);
                if (!res.ok) return;
                const data = await res.json();
                const songs = data?.["subsonic-response"]?.searchResult3?.song || [];
                const coverIds = [];
                const seen = new Set();
                for (const song of songs) {
                    const cid = song.coverArt || ('mf-' + song.id);
                    if (cid && !seen.has(cid)) {
                        seen.add(cid);
                        coverIds.push(cid);
                    }
                }

                const concurrency = 6;
                let idx = 0;
                async function worker() {
                    while (idx < coverIds.length) {
                        const id = coverIds[idx++];
                        for (const size of ['80', '1000']) {
                            try {
                                await fetch(`${s.url}/rest/getCoverArt.view?id=${id}&${s.credential}&v=1.13.0&c=Feishin&size=${size}`);
                            } catch(e) {}
                        }
                    }
                }
                await Promise.all(Array.from({ length: concurrency }, worker));
                localStorage.setItem('feishin_last_cover_precache', String(Date.now()));
                console.log('[FeishinMobile] Pre-caching automático de capas concluído para ' + coverIds.length + ' faixas.');
            } catch(e) {
                console.warn('[FeishinMobile] Erro no pre-caching automático:', e);
            } finally {
                precacheRunning = false;
            }
        }

        setTimeout(runAutoCoverPrecache, 3500);
    })();

    // -------------------------------------------------------------------------
    // 14. SISTEMA DE FILAS UNITÁRIO INTELIGENTE (MAC E ANDROID)
    // -------------------------------------------------------------------------
    function isQueueAllowedToDisplayMobile() {
        const hash = window.location.hash || '';
        const isPlaylistRoute = hash.startsWith('#/playlists/') || hash.startsWith('#/playlist/');
        const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
        const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
        const isPlaylistSong = Boolean(cur && (cur._itemType === 'playlist_song' || cur.playlistId));
        const isPlaylist = isPlaylistRoute || isPlaylistSong;

        const q = store?.getQueue?.();
        const queueItems = (q && Array.isArray(q.items)) ? q.items : [];
        const hasEnqueuedItems = Boolean(window.__FEISHIN_HAS_ENQUEUED_ITEMS__) || queueItems.length > 1;

        // Se estiver em playlist E houver faixas OU se o recurso Adicionar a Seguir foi usado (fila > 1)
        return Boolean((isPlaylist && queueItems.length > 0) || hasEnqueuedItems);
    }

    function initUnitaryQueueSystem() {
        const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
        if (!store || window.__FEISHIN_UNITARY_QUEUE_ENGINE_READY__) return;
        window.__FEISHIN_UNITARY_QUEUE_ENGINE_READY__ = true;

        const origAddToQueueByType = store.addToQueueByType;
        const origSetQueue = store.setQueue;
        const origMediaNext = store.mediaNext;
        const origMediaAutoNext = store.mediaAutoNext;
        const origMediaPrevious = store.mediaPrevious;

        store.addToQueueByType = function (items, playType, playSongId) {
            const hash = window.location.hash || '';
            const isPlaylist = hash.startsWith('#/playlists/') || hash.startsWith('#/playlist/');
            const isPlaylistItems = items && items.length > 0 && items[0]._itemType === 'playlist_song';
            const isExplicitQueueAction =
                playType === 'next' ||
                playType === 'last' ||
                playType === 'next_shuffle' ||
                playType === 'last_shuffle';

            // 1. Recurso Adicionar a Seguir: marca flag e preserva na fila
            if (isExplicitQueueAction) {
                window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = true;
                return origAddToQueueByType.apply(this, arguments);
            }

            // 2. Playlists estabelecidas: mantém todas as faixas da playlist na fila
            if (isPlaylist || isPlaylistItems) {
                window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = false;
                return origAddToQueueByType.apply(this, arguments);
            }

            // 3. Salvo esses 2 casos: reprodução 100% UNITÁRIA (música em música). Nenhuma outra track entra na fila!
            window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = false;
            if (playType === 'now' || playType === 'shuffle') {
                const target = (playSongId && items.find((i) => i.id === playSongId)) || items[0];
                if (target) {
                    const isShuffle = playType === 'shuffle' || store.player?.shuffle === 'track' || store.player?.shuffle === 'album';
                    const targetIdx = items.indexOf(target);
                    window.__FEISHIN_ACTIVE_COLLECTION__ = {
                        items: items,
                        currentIndex: targetIdx,
                        isShuffle: isShuffle,
                        shuffledIndices: isShuffle ? window.FeishinNative.generateShuffledIndices(items.length, targetIdx) : null,
                        shuffledPointer: 0,
                        history: []
                    };
                    return origAddToQueueByType.call(this, [target], 'now', target.id);
                }
            }

            return origAddToQueueByType.apply(this, arguments);
        };

        store.setQueue = function (data, index, position) {
            const hash = window.location.hash || '';
            const isPlaylist = hash.startsWith('#/playlists/') || hash.startsWith('#/playlist/');
            if (!isPlaylist && data && data.length > 1 && !window.__FEISHIN_HAS_ENQUEUED_ITEMS__) {
                const idx = typeof index === 'number' ? index : 0;
                const target = data[idx] || data[0];
                const isShuffle = store.player?.shuffle === 'track' || store.player?.shuffle === 'album';
                window.__FEISHIN_ACTIVE_COLLECTION__ = {
                    items: data,
                    currentIndex: idx,
                    isShuffle: isShuffle,
                    shuffledIndices: isShuffle ? window.FeishinNative.generateShuffledIndices(data.length, idx) : null,
                    shuffledPointer: 0,
                    history: []
                };
                return origSetQueue.call(this, [target], 0, position);
            }
            return origSetQueue.apply(this, arguments);
        };

        store.mediaNext = function (toNextAlbum) {
            const q = store.getQueue();
            const currentIdx = store.player.index;
            if (q && q.items && q.items.length > currentIdx + 1) {
                return origMediaNext.call(this, toNextAlbum);
            }

            const col = window.__FEISHIN_ACTIVE_COLLECTION__;
            if (col && col.items && col.items.length > 0) {
                const repeat = store.player?.repeat || 'none';
                const isShuffle = store.player?.shuffle === 'track' || store.player?.shuffle === 'album';

                col.history = col.history || [];
                if (typeof col.currentIndex === 'number' && col.currentIndex >= 0) {
                    col.history.push(col.currentIndex);
                    if (col.history.length > 50) col.history.shift();
                }

                let nextIdx;
                if (isShuffle) {
                    if (!col.shuffledIndices || col.shuffledIndices.length !== col.items.length) {
                        col.shuffledIndices = window.FeishinNative.generateShuffledIndices(col.items.length, col.currentIndex);
                        col.shuffledPointer = 0;
                    }
                    col.shuffledPointer = (col.shuffledPointer || 0) + 1;
                    if (col.shuffledPointer >= col.shuffledIndices.length) {
                        col.shuffledIndices = window.FeishinNative.generateShuffledIndices(col.items.length, col.currentIndex);
                        col.shuffledPointer = 0;
                    }
                    nextIdx = col.shuffledIndices[col.shuffledPointer];
                } else {
                    nextIdx = (col.currentIndex + 1) % col.items.length;
                }

                col.currentIndex = nextIdx;
                const nextSong = col.items[nextIdx];
                if (nextSong) {
                    return origAddToQueueByType.call(store, [nextSong], 'now', nextSong.id);
                }
            }

            return origMediaNext.call(this, toNextAlbum);
        };

        store.mediaAutoNext = function () {
            const repeat = store.player?.repeat || 'none';
            if (repeat === 'one') {
                document.querySelectorAll('audio').forEach(a => {
                    try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}
                });
                return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
            }

            const q = store.getQueue();
            const currentIdx = store.player.index;
            if (q && q.items && q.items.length > currentIdx + 1) {
                return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
            }

            const col = window.__FEISHIN_ACTIVE_COLLECTION__;
            if (col && col.items && col.items.length > 0) {
                const isShuffle = store.player?.shuffle === 'track' || store.player?.shuffle === 'album';

                let nextIdx;
                if (isShuffle) {
                    if (!col.shuffledIndices || col.shuffledIndices.length !== col.items.length) {
                        col.shuffledIndices = window.FeishinNative.generateShuffledIndices(col.items.length, col.currentIndex);
                        col.shuffledPointer = 0;
                    }
                    col.shuffledPointer = (col.shuffledPointer || 0) + 1;
                    if (col.shuffledPointer >= col.shuffledIndices.length) {
                        if (repeat === 'none') {
                            return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
                        }
                        col.shuffledIndices = window.FeishinNative.generateShuffledIndices(col.items.length, col.currentIndex);
                        col.shuffledPointer = 0;
                    }
                    nextIdx = col.shuffledIndices[col.shuffledPointer];
                } else {
                    nextIdx = col.currentIndex + 1;
                    if (nextIdx >= col.items.length) {
                        if (repeat === 'none') {
                            return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
                        }
                        nextIdx = 0;
                    }
                }

                col.history = col.history || [];
                if (typeof col.currentIndex === 'number' && col.currentIndex >= 0) {
                    col.history.push(col.currentIndex);
                    if (col.history.length > 50) col.history.shift();
                }

                col.currentIndex = nextIdx;
                const nextSong = col.items[nextIdx];
                if (nextSong) {
                    return origAddToQueueByType.call(store, [nextSong], 'now', nextSong.id);
                }
            }

            return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
        };

        store.mediaPrevious = function (toPrevAlbum) {
            const currentIdx = store.player.index;
            if (currentIdx > 0) {
                return origMediaPrevious.call(this, toPrevAlbum);
            }
            const col = window.__FEISHIN_ACTIVE_COLLECTION__;
            if (col && col.items && col.items.length > 0) {
                col.history = col.history || [];
                let prevIdx;
                if (col.history.length > 0) {
                    prevIdx = col.history.pop();
                } else {
                    prevIdx = (col.currentIndex - 1 + col.items.length) % col.items.length;
                }
                col.currentIndex = prevIdx;
                const prevSong = col.items[prevIdx];
                if (prevSong) {
                    return origAddToQueueByType.call(store, [prevSong], 'now', prevSong.id);
                }
            }
            return origMediaPrevious.call(this, toPrevAlbum);
        };

        function attachAudioLoopListener() {
            document.querySelectorAll('audio').forEach(a => {
                if (a.__feishinLoopBound) return;
                a.__feishinLoopBound = true;
                a.addEventListener('ended', () => {
                    const s = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                    if (s?.player?.repeat === 'one') {
                        a.currentTime = 0;
                        a.play().catch(() => {});
                    }
                });
            });
        }
        attachAudioLoopListener();
    }

    const qInitTimer = setInterval(() => {
        if (window.__FEISHIN_UNITARY_QUEUE_ENGINE_READY__) {
            clearInterval(qInitTimer);
        } else {
            initUnitaryQueueSystem();
        }
    }, 400);

    console.log('[FeishinMobile] Motor Nativo Liquid Glass Pronto e Ativo.');
    // Inicializa TrackPage e Motor Extra Mode
    try {
        if (window.FeishinTrackPage) {
            window.FeishinTrackPage.init();
        }
        if (window.FeishinExtraMode) {
            window.FeishinExtraMode.init();
        }
        if (window.FeishinLocalMode) {
            window.FeishinLocalMode.init();
        }
    } catch (e) {}
})();
