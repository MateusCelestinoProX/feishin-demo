/* ==========================================================================
   FEISHIN STANDALONE DEMO ENGINE (SUBSONIC + /API/ENGINE IN-MEMORY INTERCEPTOR)
   100% Client-Side / Zero-Backend / High-Fidelity Audio Architecture
   ========================================================================== */
(function() {
    'use strict';

    console.info('[Feishin Demo Engine] Initializing standalone Subsonic mock engine...');

    const DEMO_SERVER_ID = 'feishin_demo_cloud_v1';
    const db = window.__FEISHIN_DEMO_DB__ || {
        songs: [],
        artists: {},
        artistsIndex: [],
        albums: {},
        albumList: [],
        genres: [],
        playlists: [],
        musicFolders: [{ id: 1, name: "Portfolio High-Res Collection" }]
    };

    function ensureSongMetadata(song) {
        if (!song || typeof song !== 'object') return song;
        song._itemType = song._itemType || 'song';
        song._serverId = song._serverId || DEMO_SERVER_ID;
        song._serverType = song._serverType || 'subsonic';
        song._uniqueId = song._uniqueId || (DEMO_SERVER_ID + '-' + song.id);
        return song;
    }

    // Fast lookup maps
    const songIdMap = {};
    const coverIdMap = {};
    const audioUrlMap = {};

    db.songs.forEach((song, idx) => {
        ensureSongMetadata(song);
        songIdMap[song.id] = song;
        songIdMap[String(idx + 1)] = song;
        if (song.coverArt) coverIdMap[song.coverArt] = song.localCoverUrl;
        coverIdMap[song.id] = song.localCoverUrl;
        if (song.albumId) coverIdMap[song.albumId] = song.localCoverUrl;
        if (song.artistId) coverIdMap[song.artistId] = song.localCoverUrl;
        audioUrlMap[song.id] = song.localAudioUrl;
        audioUrlMap[String(idx + 1)] = song.localAudioUrl;
    });

    Object.values(db.albums || {}).forEach(album => {
        if (album && album.coverArt && album.song && album.song[0]) {
            coverIdMap[album.id] = album.song[0].localCoverUrl;
        }
        (album?.song || []).forEach(ensureSongMetadata);
    });
    (db.albumList || []).forEach(album => {
        if (album && album.coverArt && album.song && album.song[0]) {
            coverIdMap[album.id] = album.song[0].localCoverUrl;
        }
        (album?.song || []).forEach(ensureSongMetadata);
    });
    Object.values(db.artists || {}).forEach(artist => {
        (artist?.songs || []).forEach(ensureSongMetadata);
        Object.values(artist?.albums || {}).forEach(alb => {
            (alb?.song || []).forEach(ensureSongMetadata);
        });
    });
    (db.playlists || []).forEach(pl => {
        (pl?.song || []).forEach(ensureSongMetadata);
    });

    window.__DEMO_SONGS_MAP__ = songIdMap;
    window.__DEMO_COVERS_MAP__ = coverIdMap;
    window.__DEMO_AUDIO_MAP__ = audioUrlMap;

    // 1. Seed LocalStorage with clean Demo Guest Server credentials & suppress changelog modal
    try {
        const baseServerUrl = window.location.origin + window.location.pathname.replace(/\/(index\.html)?$/, '');
        const demoAuth = {
            state: {
                actions: {},
                currentServer: {
                    id: DEMO_SERVER_ID,
                    name: "Feishin Cloud Demo (In-Memory)",
                    type: "subsonic",
                    url: baseServerUrl,
                    credential: "u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json",
                    userId: "demo_user_001",
                    username: "PortfolioGuest",
                    isAdmin: true,
                    preferRemoteUrl: false,
                    version: "1.16.1 (Demo Engine)"
                },
                deviceId: "demo_web_device_777",
                serverList: {
                    [DEMO_SERVER_ID]: {
                        id: DEMO_SERVER_ID,
                        name: "Feishin Cloud Demo (In-Memory)",
                        type: "subsonic",
                        url: baseServerUrl,
                        credential: "u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json",
                        userId: "demo_user_001",
                        username: "PortfolioGuest",
                        isAdmin: true,
                        preferRemoteUrl: false,
                        version: "1.16.1 (Demo Engine)"
                    }
                }
            },
            version: 2
        };
        localStorage.setItem('store_authentication', JSON.stringify(demoAuth));

        // Suppress Feishin's "new version installed (1.17.0)" modal & remote telemetries
        localStorage.setItem('version', '"1.17.0"');
        localStorage.setItem('umami.disabled', '1');
        localStorage.setItem('feishin_telemetry_disabled', '1');

        // Settings optimizations
        const rawSettings = localStorage.getItem('store_settings');
        let settings = rawSettings ? JSON.parse(rawSettings) : { state: {} };
        if (!settings.state) settings.state = {};
        if (!settings.state.playback) settings.state.playback = {};
        settings.state.playback.volume = 100;
        settings.state.playback.transcode = 'none';
        settings.state.playback.replayGainType = 'none';
        localStorage.setItem('store_settings', JSON.stringify(settings));
    } catch(err) {
        console.warn('[Feishin Demo Engine] LocalStorage init warn:', err);
    }

    // 2. Subsonic Response Formatter & Extensions
    const OPEN_SUBSONIC_EXTENSIONS = [
        { name: "transcodeOffset", versions: [1] },
        { name: "formPost", versions: [1] },
        { name: "songLyrics", versions: [1, 2] },
        { name: "indexBasedQueue", versions: [1] },
        { name: "transcoding", versions: [1] },
        { name: "playbackReport", versions: [1] },
        { name: "topSongsByArtistId", versions: [1] }
    ];

    function subsonicWrap(data) {
        return {
            "subsonic-response": Object.assign({
                "status": "ok",
                "version": "1.16.1",
                "type": "feishin-demo",
                "serverVersion": "1.16.1-standalone",
                "openSubsonic": true
            }, data)
        };
    }

    // 3. Router for Subsonic REST endpoints
    function handleSubsonicEndpoint(endpoint, params) {
        const p = params || {};
        console.debug('[Subsonic Mock] Calling endpoint:', endpoint, p);

        if (endpoint.includes('ping.view')) {
            return subsonicWrap({});
        }

        if (endpoint.includes('getOpenSubsonicExtensions.view')) {
            return subsonicWrap({ openSubsonicExtensions: OPEN_SUBSONIC_EXTENSIONS });
        }

        if (endpoint.includes('getLicense.view')) {
            return subsonicWrap({ license: { valid: true, email: "guest@feishin-demo.pro" } });
        }

        if (endpoint.includes('getUser.view')) {
            return subsonicWrap({
                user: {
                    username: "PortfolioGuest",
                    email: "guest@feishin-demo.pro",
                    scrobblingEnabled: true,
                    adminRole: true,
                    settingsRole: true,
                    downloadRole: true,
                    uploadRole: false,
                    playlistRole: true,
                    coverArtRole: true,
                    commentRole: true,
                    podcastRole: true,
                    streamRole: true,
                    jukeboxRole: true,
                    shareRole: true,
                    videoConversionRole: false,
                    folder: [1]
                },
                openSubsonicExtensions: OPEN_SUBSONIC_EXTENSIONS
            });
        }

        if (endpoint.includes('getScanStatus.view') || endpoint.includes('startScan.view')) {
            return subsonicWrap({
                scanStatus: {
                    scanning: false,
                    count: db.songs.length,
                    folderCount: (db.musicFolders || []).length || 1
                }
            });
        }

        if (endpoint.includes('getMusicFolders.view')) {
            return subsonicWrap({
                musicFolders: {
                    musicFolder: db.musicFolders
                }
            });
        }

        if (endpoint.includes('getGenres.view')) {
            return subsonicWrap({
                genres: {
                    genre: db.genres
                }
            });
        }

        if (endpoint.includes('getSongsByGenre.view')) {
            const genre = (p.genre || '').toLowerCase();
            let list = db.songs.filter(s => !genre || (s.genre || '').toLowerCase() === genre);
            const offset = Number(p.offset) || 0;
            const count = Number(p.count) || list.length;
            return subsonicWrap({
                songsByGenre: {
                    song: list.slice(offset, offset + count)
                }
            });
        }

        if (endpoint.includes('getIndexes.view')) {
            return subsonicWrap({
                indexes: {
                    ignoredArticles: "The El La Los Las Le Les",
                    index: db.artistsIndex
                }
            });
        }

        if (endpoint.includes('getArtists.view') || endpoint === 'getArtists') {
            return subsonicWrap({
                artists: {
                    ignoredArticles: "The El La Los Las Le Les",
                    index: db.artistsIndex
                }
            });
        }

        if (endpoint.includes('getArtistInfo2.view')) {
            return subsonicWrap({
                artistInfo2: {
                    biography: "Artista em catálogo demonstrativo de portfólio Feishin Audiophile Suite.",
                    similarArtist: []
                }
            });
        }

        if (endpoint.includes('getArtist.view')) {
            const artistId = p.id;
            const artistObj = db.artists[artistId] || Object.values(db.artists)[0];
            const artistAlbums = artistObj ? Object.values(artistObj.albums || {}) : [];
            return subsonicWrap({
                artist: {
                    id: artistObj?.id || artistId,
                    name: artistObj?.name || "Demo Artist",
                    albumCount: artistAlbums.length,
                    coverArt: artistObj?.coverArt || db.songs[0]?.coverArt,
                    album: artistAlbums
                }
            });
        }

        if (endpoint.includes('getTopSongs.view')) {
            const artistName = (p.artist || '').toLowerCase();
            const count = Number(p.count) || 50;
            const list = artistName
                ? db.songs.filter(s => (s.artist || '').toLowerCase().includes(artistName))
                : db.songs;
            return subsonicWrap({
                topSongs: {
                    song: list.slice(0, count)
                }
            });
        }

        if (endpoint.includes('getSimilarSongs2')) {
            const list = db.songs.filter(s => s.id !== p.id).slice(0, Number(p.count) || 10);
            return subsonicWrap({ similarSongs2: { song: list } });
        }

        if (endpoint.includes('getSimilarSongs')) {
            const list = db.songs.filter(s => s.id !== p.id).slice(0, Number(p.count) || 10);
            return subsonicWrap({ similarSongs: { song: list } });
        }

        if (endpoint.includes('getAlbum.view')) {
            const albumId = p.id;
            const albumObj = db.albums[albumId] || Object.values(db.albums)[0];
            return subsonicWrap({
                album: albumObj
            });
        }

        if (endpoint.includes('getAlbumList2.view') || endpoint.includes('getAlbumList.view')) {
            const list = db.albumList || [];
            const offset = Number(p.offset) || 0;
            const size = Number(p.size) || list.length;
            return subsonicWrap({
                albumList2: {
                    album: list.slice(offset, offset + size)
                }
            });
        }

        if (endpoint.includes('search3.view')) {
            const query = (p.query || '').toLowerCase().trim();
            let matchedSongs = db.songs;
            let matchedAlbums = db.albumList;
            let matchedArtists = Object.values(db.artists);

            if (query.length > 0) {
                matchedSongs = db.songs.filter(s =>
                    (s.title || '').toLowerCase().includes(query) ||
                    (s.artist || '').toLowerCase().includes(query) ||
                    (s.album || '').toLowerCase().includes(query)
                );
                matchedAlbums = db.albumList.filter(a =>
                    (a.name || '').toLowerCase().includes(query) ||
                    (a.artist || '').toLowerCase().includes(query)
                );
                matchedArtists = Object.values(db.artists).filter(a =>
                    (a.name || '').toLowerCase().includes(query)
                );
            }

            const songOffset = Number(p.songOffset) || 0;
            const songCount = p.songCount !== undefined ? Number(p.songCount) : matchedSongs.length;
            const albumOffset = Number(p.albumOffset) || 0;
            const albumCount = p.albumCount !== undefined ? Number(p.albumCount) : matchedAlbums.length;
            const artistOffset = Number(p.artistOffset) || 0;
            const artistCount = p.artistCount !== undefined ? Number(p.artistCount) : matchedArtists.length;

            return subsonicWrap({
                searchResult3: {
                    song: matchedSongs.slice(songOffset, songOffset + songCount),
                    album: matchedAlbums.slice(albumOffset, albumOffset + albumCount),
                    artist: matchedArtists.slice(artistOffset, artistOffset + artistCount)
                }
            });
        }

        if (endpoint.includes('getRandomSongs.view')) {
            const size = Number(p.size) || db.songs.length;
            return subsonicWrap({
                randomSongs: {
                    song: [...db.songs].sort(() => 0.5 - Math.random()).slice(0, size)
                }
            });
        }

        if (endpoint.includes('getSong.view')) {
            const song = songIdMap[p.id] || db.songs[0];
            return subsonicWrap({ song: song });
        }

        if (endpoint.includes('getPlaylists.view')) {
            return subsonicWrap({
                playlists: {
                    playlist: db.playlists
                }
            });
        }

        if (endpoint.includes('getPlaylist.view')) {
            const pl = db.playlists.find(x => x.id === p.id) || db.playlists[0];
            return subsonicWrap({
                playlist: {
                    id: pl.id,
                    name: pl.name,
                    comment: pl.comment,
                    owner: pl.owner,
                    public: pl.public,
                    songCount: pl.songCount,
                    duration: pl.duration,
                    created: pl.created,
                    changed: pl.changed,
                    coverArt: pl.coverArt,
                    entry: pl.song
                }
            });
        }

        if (endpoint.includes('getStarred2.view')) {
            return subsonicWrap({
                starred2: {
                    song: db.songs.filter(s => s.starred),
                    album: [],
                    artist: []
                }
            });
        }

        if (endpoint.includes('getStarred.view')) {
            return subsonicWrap({
                starred: {
                    song: db.songs.filter(s => s.starred),
                    album: [],
                    artist: []
                }
            });
        }

        if (endpoint.includes('getMusicDirectory.view')) {
            return subsonicWrap({
                directory: {
                    id: p.id || "1",
                    name: "Portfolio High-Res Collection",
                    child: db.songs
                }
            });
        }

        if (endpoint.includes('getInternetRadioStations.view')) {
            return subsonicWrap({
                internetRadioStations: {
                    internetRadioStation: []
                }
            });
        }

        if (endpoint.includes('getLyricsBySongId.view')) {
            return subsonicWrap({
                lyricsList: {
                    structuredLyrics: []
                }
            });
        }

        if (endpoint.includes('jukeboxControl.view')) {
            return subsonicWrap({
                jukeboxStatus: {
                    currentIndex: -1,
                    playing: false,
                    gain: 1.0,
                    position: 0
                }
            });
        }

        if (endpoint.includes('star.view') && p.id && songIdMap[p.id]) {
            songIdMap[p.id].starred = new Date().toISOString();
            return subsonicWrap({});
        }

        if (endpoint.includes('unstar.view') && p.id && songIdMap[p.id]) {
            songIdMap[p.id].starred = null;
            return subsonicWrap({});
        }

        if (
            endpoint.includes('scrobble.view') ||
            endpoint.includes('setRating.view') ||
            endpoint.includes('savePlayQueue') ||
            endpoint.includes('reportPlayback.view')
        ) {
            return subsonicWrap({});
        }

        return subsonicWrap({});
    }

    // 4. In-Memory /api/engine/* Mock (Track Editor, Delete Engine, Realtime SSE)
    const activeEventSources = new Set();

    function emitEngineEvent(eventType, payload) {
        const dataStr = JSON.stringify(payload || {});
        activeEventSources.forEach(es => {
            if (!es || es.readyState === 2) return;
            try {
                const ev = new MessageEvent(eventType, { data: dataStr });
                es.dispatchEvent(ev);
                if (typeof es.onmessage === 'function' && eventType === 'message') {
                    es.onmessage(ev);
                }
            } catch (e) {}
        });
    }
    window.__DEMO_EMIT_SSE__ = emitEngineEvent;

    class MockEngineEventSource extends EventTarget {
        constructor(url, config) {
            super();
            this.url = String(url || '');
            this.withCredentials = !!(config && config.withCredentials);
            this.readyState = 0; // CONNECTING
            this.CONNECTING = 0;
            this.OPEN = 1;
            this.CLOSED = 2;
            this.onopen = null;
            this.onmessage = null;
            this.onerror = null;
            activeEventSources.add(this);

            setTimeout(() => {
                if (this.readyState === 2) return;
                this.readyState = 1; // OPEN
                const openEv = new Event('open');
                this.dispatchEvent(openEv);
                if (typeof this.onopen === 'function') {
                    try { this.onopen(openEv); } catch (e) {}
                }
            }, 25);
        }
        close() {
            this.readyState = 2;
            activeEventSources.delete(this);
        }
    }

    if (typeof window.EventSource !== 'undefined') {
        const NativeEventSource = window.EventSource;
        const WrappedEventSource = function(url, config) {
            const urlStr = String(url || '');
            if (urlStr.includes('/api/engine/')) {
                return new MockEngineEventSource(urlStr, config);
            }
            return new NativeEventSource(url, config);
        };
        WrappedEventSource.CONNECTING = 0;
        WrappedEventSource.OPEN = 1;
        WrappedEventSource.CLOSED = 2;
        WrappedEventSource.prototype = NativeEventSource.prototype;
        window.EventSource = WrappedEventSource;
    }

    function handleEngineApi(url, method, bodyText) {
        const params = parseQuery(url);

        if (url.includes('/api/engine/track-details')) {
            const song = songIdMap[params.songId] || db.songs[0];
            if (!song) return { success: false, error: 'Track not found' };
            return {
                success: true,
                track: {
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    album: song.album,
                    genre: song.genre || '',
                    year: song.year || 2024,
                    trackNumber: song.track || 1,
                    comment: song.comment || ''
                }
            };
        }

        if (url.includes('/api/engine/update-track')) {
            let payload = {};
            try { payload = bodyText ? JSON.parse(bodyText) : {}; } catch (e) {}
            const song = songIdMap[payload.songId];
            if (song) {
                if (payload.title) song.title = payload.title;
                if (payload.artist) song.artist = payload.artist;
                if (payload.album) song.album = payload.album;
                if (payload.genre !== undefined) song.genre = payload.genre;
                if (payload.year) song.year = Number(payload.year) || song.year;
                if (payload.trackNumber) song.track = Number(payload.trackNumber) || song.track;
                if (payload.comment !== undefined) song.comment = payload.comment;
                emitEngineEvent('track_updated', { id: song.id, title: song.title });
            }
            return { success: true, track: song || payload };
        }

        if (url.includes('/api/engine/delete-track')) {
            let payload = {};
            try { payload = bodyText ? JSON.parse(bodyText) : {}; } catch (e) {}
            const songId = payload.songId || params.songId;
            const song = songIdMap[songId];
            if (song) {
                const idx = db.songs.findIndex(s => s.id === songId);
                if (idx !== -1) db.songs.splice(idx, 1);
                emitEngineEvent('track_deleted', { id: songId, title: song.title });
            }
            return { success: true, deletedId: songId };
        }

        return { success: true, ok: true };
    }

    // Helper: Parse URL query string
    function parseQuery(url) {
        const queryParams = {};
        const qIndex = url.indexOf('?');
        if (qIndex !== -1) {
            const qStr = url.substring(qIndex + 1);
            const pairs = qStr.split('&');
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split('=');
                if (pair[0]) {
                    try {
                        queryParams[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
                    } catch (e) {
                        queryParams[pair[0]] = pair[1] || '';
                    }
                }
            }
        }
        return queryParams;
    }

    // 5. Intercept fetch API
    const _origFetch = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = function(resource, init) {
        const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');

        // Intercept /api/engine/* calls cleanly
        if (url.includes('/api/engine/')) {
            const method = (init && init.method) || 'GET';
            const bodyText = (init && typeof init.body === 'string') ? init.body : '';
            const payload = handleEngineApi(url, method, bodyText);
            return Promise.resolve(new Response(JSON.stringify(payload), {
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            }));
        }

        // Intercept Subsonic API queries
        if (url.includes('/rest/')) {
            const urlPath = url.split('?')[0];
            const endpoint = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            const params = parseQuery(url);

            if (endpoint.includes('getCoverArt.view')) {
                const coverId = params.id;
                const localCover = coverIdMap[coverId] || db.songs[0]?.localCoverUrl;
                if (localCover && _origFetch) {
                    return _origFetch(localCover, init);
                }
            }

            if (endpoint.includes('stream.view')) {
                const songId = params.id;
                const localAudio = audioUrlMap[songId] || db.songs[0]?.localAudioUrl;
                if (localAudio && _origFetch) {
                    return _origFetch(localAudio, init);
                }
            }

            const mockData = handleSubsonicEndpoint(endpoint, params);
            return Promise.resolve(new Response(JSON.stringify(mockData), {
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            }));
        }

        // Block external telemetries & GitHub version checks
        if (/umami\.jeffvli\.org|api\.github\.com\/repos\/jeffvli\/feishin/.test(url)) {
            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        return _origFetch ? _origFetch.apply(window, arguments) : Promise.reject(new Error('No fetch'));
    };

    // 6. Intercept XMLHttpRequest (Axios uses XHR in standard browser builds)
    const _OrigXHR = window.XMLHttpRequest;
    function MockSubsonicXHR() {
        const xhr = new _OrigXHR();
        let requestUrl = '';
        let requestMethod = 'GET';

        const _origOpen = xhr.open;
        xhr.open = function(method, url) {
            requestMethod = method || 'GET';
            requestUrl = url || '';
            return _origOpen.apply(this, arguments);
        };

        const _origSend = xhr.send;
        xhr.send = function(body) {
            const respondJson = (obj) => {
                const jsonStr = JSON.stringify(obj);
                setTimeout(() => {
                    try { Object.defineProperty(xhr, 'status', { value: 200, writable: false, configurable: true }); } catch (e) {}
                    try { Object.defineProperty(xhr, 'statusText', { value: 'OK', writable: false, configurable: true }); } catch (e) {}
                    try { Object.defineProperty(xhr, 'readyState', { value: 4, writable: false, configurable: true }); } catch (e) {}
                    try { Object.defineProperty(xhr, 'responseText', { value: jsonStr, writable: false, configurable: true }); } catch (e) {}
                    try { Object.defineProperty(xhr, 'response', { value: jsonStr, writable: false, configurable: true }); } catch (e) {}

                    xhr.dispatchEvent(new Event('readystatechange'));
                    xhr.dispatchEvent(new Event('load'));
                    xhr.dispatchEvent(new Event('loadend'));
                }, 10);
            };

            if (requestUrl.includes('/api/engine/')) {
                const bodyText = typeof body === 'string' ? body : '';
                respondJson(handleEngineApi(requestUrl, requestMethod, bodyText));
                return;
            }

            if (requestUrl.includes('/rest/')) {
                const urlPath = requestUrl.split('?')[0];
                const endpoint = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                const params = parseQuery(requestUrl);
                respondJson(handleSubsonicEndpoint(endpoint, params));
                return;
            }

            if (/umami\.jeffvli\.org|api\.github\.com\/repos\/jeffvli\/feishin/.test(requestUrl)) {
                respondJson({});
                return;
            }

            return _origSend.apply(this, arguments);
        };

        return xhr;
    }
    MockSubsonicXHR.prototype = _OrigXHR.prototype;
    window.XMLHttpRequest = MockSubsonicXHR;

    // 7. Direct DOM Element Interceptors for Audio Streaming & Artwork
    try {
        const origMediaSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
        if (origMediaSrc && origMediaSrc.set) {
            Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                set: function(val) {
                    if (typeof val === 'string' && val.includes('stream.view')) {
                        const m = val.match(/id=([^&]+)/);
                        const id = m ? decodeURIComponent(m[1]) : '';
                        const localPath = audioUrlMap[id] || db.songs[0]?.localAudioUrl;
                        if (localPath) {
                            console.debug(`[Audio Hook] Mapping stream.view (id: ${id}) -> ${localPath}`);
                            val = localPath;
                        }
                    }
                    return origMediaSrc.set.call(this, val);
                },
                get: function() {
                    return origMediaSrc.get.call(this);
                }
            });
        }

        const origImgSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
        if (origImgSrc && origImgSrc.set) {
            Object.defineProperty(HTMLImageElement.prototype, 'src', {
                set: function(val) {
                    if (typeof val === 'string' && val.includes('getCoverArt.view')) {
                        const m = val.match(/id=([^&]+)/);
                        const id = m ? decodeURIComponent(m[1]) : '';
                        const localCover = coverIdMap[id] || db.songs[0]?.localCoverUrl;
                        if (localCover) {
                            val = localCover;
                        }
                    }
                    return origImgSrc.set.call(this, val);
                },
                get: function() {
                    return origImgSrc.get.call(this);
                }
            });
        }
    } catch(hookErr) {
        console.warn('[Feishin Demo Engine] DOM hooks error:', hookErr);
    }

    console.info('[Feishin Demo Engine] Subsonic + Engine API interceptor loaded with', db.songs.length, 'tracks.');
})();

// 8. Store Hook for Uninterrupted Playback Engine
(function initStoreHook() {
    function normalizeItems(items) {
        if (!Array.isArray(items)) return items;
        return items.map((item, idx) => {
            if (!item || typeof item !== 'object') return item;
            item._serverId = item._serverId || 'feishin_demo_cloud_v1';
            item._serverType = item._serverType || 'subsonic';
            item._itemType = item._itemType || 'song';
            item._uniqueId = item._uniqueId || ('feishin_demo_cloud_v1-' + (item.id || idx));
            return item;
        });
    }

    function hookPlayerStore() {
        const store = window.__FEISHIN_PLAYER_STORE__;
        if (!store) {
            setTimeout(hookPlayerStore, 100);
            return;
        }

        const state = store.getState();
        if (!state) {
            setTimeout(hookPlayerStore, 100);
            return;
        }

        if (!store.__demo_hooked__) {
            store.__demo_hooked__ = true;

            ['addToQueueByType', 'addToQueueByUniqueId', 'setQueue'].forEach((fnName) => {
                const origFn = state[fnName];
                if (typeof origFn === 'function') {
                    state[fnName] = function(items) {
                        normalizeItems(items);
                        return origFn.apply(this, arguments);
                    };
                }
            });

            console.info('[Feishin Demo Engine] Player store hooked for guaranteed _itemType & instant playback.');
        }
    }
    hookPlayerStore();
})();
