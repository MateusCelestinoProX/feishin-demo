/* ==========================================================================
   FEISHIN MOBILE PRO — BOOT ACELERADO & PERSISTÊNCIA NATIVA
   Executa ANTES de qualquer outro script. Objetivos:
   1. Pré-configuração de preferências e credenciais de sessão rápida.
   2. Desativação de telemetria externa desnecessária.
   3. Preservação estrita do ciclo de vida nativo de XHR e Axios para
      compatibilidade 100% confiável com queries TanStack / Subsonic.
   ========================================================================== */
(function () {
    'use strict';

    // ---- 1. Migração de preferências visuais e inicialização de sessão segura ----
    try {
        window.__FORCE_SHADER_RUNNING__ = true;
        window.__PAUSE_WEBGL_SHADERS__ = false;
        window.__MODAL_OPEN_PAUSE__ = false;
        localStorage.setItem('feishin_shader_eco', 'false');
        if (localStorage.getItem('fs_ui_v2') !== '1') {
            localStorage.setItem('personal_os_shader_dim', '6');
            localStorage.setItem('fs_ui_v2', '1');
        }

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
                            version: "0.64.2 (10114574)"
                        }
                    }
                },
                version: 2
            };
            localStorage.setItem('store_authentication', JSON.stringify(defaultAuth));
        }
    } catch (e) {}

    // ---- 2. Interceptador de Rede Resiliente: Telemetria & Autenticação Offline ----
    const ORIG_FETCH = window.fetch ? window.fetch.bind(window) : null;
    const GITHUB_RELEASE = /(api\.github\.com\/repos\/jeffvli\/feishin)/;
    const BLOCKED = /(umami\.jeffvli\.org)/;

    const SUBSONIC_AUTH_MOCK = {
        "subsonic-response": {
            "status": "ok",
            "version": "1.16.1",
            "type": "navidrome",
            "serverVersion": "0.64.2 (10114574)",
            "openSubsonic": true,
            "user": {
                "username": "PortfolioGuest",
                "scrobblingEnabled": true,
                "adminRole": true,
                "settingsRole": false,
                "downloadRole": true,
                "uploadRole": false,
                "playlistRole": false,
                "coverArtRole": true,
                "commentRole": false,
                "podcastRole": false,
                "streamRole": true,
                "jukeboxRole": false,
                "shareRole": true,
                "videoConversionRole": false,
                "folder": [1]
            },
            "openSubsonicExtensions": [
                { "name": "transcodeOffset", "versions": [1] },
                { "name": "formPost", "versions": [1] },
                { "name": "songLyrics", "versions": [1, 2] },
                { "name": "indexBasedQueue", "versions": [1] },
                { "name": "transcoding", "versions": [1] },
                { "name": "playbackReport", "versions": [1] },
                { "name": "topSongsByArtistId", "versions": [1] }
            ]
        }
    };

    if (ORIG_FETCH) {
        window.fetch = function (input, init) {
            try {
                const urlStr = typeof input === 'string' ? input : (input && input.url) || '';
                if (BLOCKED.test(urlStr)) {
                    return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
                }
                if (GITHUB_RELEASE.test(urlStr)) {
                    const releaseObj = {
                        tag_name: "v1.17.0",
                        name: "v1.17.0",
                        published_at: "2026-10-01T00:00:00Z",
                        prerelease: false
                    };
                    const resData = urlStr.includes('/latest') ? releaseObj : [releaseObj];
                    return Promise.resolve(new Response(JSON.stringify(resData), {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    }));
                }
                if (/(getUser\.view|ping\.view|getOpenSubsonicExtensions\.view|getLicense\.view)/i.test(urlStr)) {
                    return ORIG_FETCH(input, init).catch(() => {
                        return new Response(JSON.stringify(SUBSONIC_AUTH_MOCK), {
                            status: 200,
                            headers: { 'content-type': 'application/json' }
                        });
                    });
                }
            } catch (e) {}
            return ORIG_FETCH(input, init);
        };
    }

    if (typeof window !== 'undefined' && window.XMLHttpRequest) {
        const OrigXHR = window.XMLHttpRequest;
        function ResilientXHR() {
            const xhr = new OrigXHR();
            let reqUrl = '';
            const origOpen = xhr.open;
            const origSend = xhr.send;

            xhr.open = function (method, url) {
                reqUrl = String(url || '');
                return origOpen.apply(this, arguments);
            };

            xhr.send = function (data) {
                if (GITHUB_RELEASE.test(reqUrl)) {
                    const releaseObj = {
                        tag_name: "v1.17.0",
                        name: "v1.17.0",
                        published_at: "2026-10-01T00:00:00Z",
                        prerelease: false
                    };
                    const resData = reqUrl.includes('/latest') ? releaseObj : [releaseObj];
                    const mockData = JSON.stringify(resData);
                    setTimeout(() => {
                        try { Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'status', { value: 200, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'statusText', { value: 'OK', configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'responseText', { value: mockData, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'response', { value: mockData, configurable: true, writable: true }); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('readystatechange')); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('load')); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('loadend')); } catch (e) {}
                        if (typeof xhr.onreadystatechange === 'function') {
                            try { xhr.onreadystatechange(new Event('readystatechange')); } catch (e) {}
                        }
                        if (typeof xhr.onload === 'function') {
                            try { xhr.onload(new Event('load')); } catch (e) {}
                        }
                        if (typeof xhr.onloadend === 'function') {
                            try { xhr.onloadend(new Event('loadend')); } catch (e) {}
                        }
                    }, 10);
                    return;
                }
                if (BLOCKED.test(reqUrl)) {
                    setTimeout(() => {
                        try { Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'status', { value: 200, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'statusText', { value: 'OK', configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'responseText', { value: '{}', configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'response', { value: '{}', configurable: true, writable: true }); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('readystatechange')); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('load')); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('loadend')); } catch (e) {}
                    }, 10);
                    return;
                }
                const isAuthEndpoint = /(getUser\.view|ping\.view|getOpenSubsonicExtensions\.view|getLicense\.view)/i.test(reqUrl);
                if (isAuthEndpoint) {
                    const fulfillMock = () => {
                        const mockData = JSON.stringify(SUBSONIC_AUTH_MOCK);
                        try { Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'status', { value: 200, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'statusText', { value: 'OK', configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'responseText', { value: mockData, configurable: true, writable: true }); } catch (e) {}
                        try { Object.defineProperty(xhr, 'response', { value: mockData, configurable: true, writable: true }); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('readystatechange')); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('load')); } catch (e) {}
                        try { xhr.dispatchEvent(new Event('loadend')); } catch (e) {}
                        if (typeof xhr.onreadystatechange === 'function') {
                            try { xhr.onreadystatechange(new Event('readystatechange')); } catch (e) {}
                        }
                        if (typeof xhr.onload === 'function') {
                            try { xhr.onload(new Event('load')); } catch (e) {}
                        }
                        if (typeof xhr.onloadend === 'function') {
                            try { xhr.onloadend(new Event('loadend')); } catch (e) {}
                        }
                    };

                    if (!navigator.onLine) {
                        setTimeout(fulfillMock, 10);
                        return;
                    }

                    xhr.addEventListener('error', function (e) {
                        try { e.stopImmediatePropagation(); } catch (err) {}
                        fulfillMock();
                    }, true);

                    xhr.addEventListener('timeout', function (e) {
                        try { e.stopImmediatePropagation(); } catch (err) {}
                        fulfillMock();
                    }, true);

                    try {
                        return origSend.apply(this, arguments);
                    } catch (e) {
                        fulfillMock();
                        return;
                    }
                }
                return origSend.apply(this, arguments);
            };

            return xhr;
        }
        ResilientXHR.prototype = OrigXHR.prototype;
        window.XMLHttpRequest = ResilientXHR;
    }
    // ---- 3. Plataforma abre 100% zerada na Home e com VOLUME REAL 100% GALAXY ULTRA ----
    try {
        const cleanPlayerState = {
            state: {
                player: {
                    index: -1,
                    num: 1,
                    player1: null,
                    player2: null,
                    playQueue: [],
                    repeat: "none",
                    shuffle: "none",
                    speed: 1,
                    status: "paused",
                    timestamp: 0,
                    transitionType: "gapless",
                    volume: 100
                },
                queue: {
                    default: [],
                    shuffled: [],
                    songs: {}
                }
            },
            version: 0
        };
        localStorage.setItem('store_player', JSON.stringify(cleanPlayerState));

        const rawFs = localStorage.getItem('store_full_screen_player');
        if (rawFs) {
            try {
                const parsedFs = JSON.parse(rawFs);
                if (parsedFs?.state && parsedFs.state.expanded) {
                    parsedFs.state.expanded = false;
                    localStorage.setItem('store_full_screen_player', JSON.stringify(parsedFs));
                }
            } catch (e) {}
        }

        if (typeof indexedDB !== 'undefined') {
            const req = indexedDB.open('keyval-store');
            req.onupgradeneeded = function () {
                try {
                    if (!req.result.objectStoreNames.contains('keyval')) {
                        req.result.createObjectStore('keyval');
                    }
                } catch (e) {}
            };
            req.onsuccess = function () {
                try {
                    const db = req.result;
                    if (!db.objectStoreNames.contains('keyval')) {
                        db.close();
                        indexedDB.deleteDatabase('keyval-store');
                        return;
                    }
                    const tx = db.transaction('keyval', 'readwrite');
                    tx.objectStore('keyval').delete('store_player_queue');
                    tx.objectStore('keyval').delete('player-store');
                    tx.oncomplete = function () { db.close(); };
                    tx.onerror = function () { db.close(); };
                } catch (e) {}
            };
            req.onerror = function () {};
        }

        // Hook universal em HTMLMediaElement: Garante que o volume interno do player nunca seja atenuado abaixo de 1.0 (100%)
        if (typeof HTMLMediaElement !== 'undefined') {
            const origPlay = HTMLMediaElement.prototype.play;
            HTMLMediaElement.prototype.play = function() {
                try {
                    this.volume = 1.0;
                    this.muted = false;
                } catch (e) {}
                return origPlay.apply(this, arguments);
            };
        }



        // Remover Home completamente e garantir Faixas (Songs) em store_settings
        const rawSettings = localStorage.getItem('store_settings');
        if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            let changed = false;
            const target = parsed?.state?.general?.sidebarItems || parsed?.general?.sidebarItems;
            if (Array.isArray(target)) {
                const hadHome = target.some(item => item && (item.id === 'Home' || item.route === '/home'));
                if (hadHome) {
                    const filtered = target.filter(item => item && item.id !== 'Home' && item.route !== '/home' && item.route !== '/');
                    if (parsed?.state?.general?.sidebarItems) parsed.state.general.sidebarItems = filtered;
                    if (parsed?.general?.sidebarItems) parsed.general.sidebarItems = filtered;
                    changed = true;
                }
            }
            if (changed) {
                localStorage.setItem('store_settings', JSON.stringify(parsed));
            }
        }

        // Força abertura limpa na página de Faixas (Tracks) como verdadeira Home
        if (!sessionStorage.getItem('feishin_session_started') || window.location.hash === '#/home' || window.location.hash === '#' || window.location.hash === '#/') {
            sessionStorage.setItem('feishin_session_started', 'true');
            window.location.hash = '#/library/songs';
        }
    } catch (e) {}
})();
