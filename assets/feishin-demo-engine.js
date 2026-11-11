/* ==========================================================================
   FEISHIN STANDALONE DEMO ENGINE (SUBSONIC IN-MEMORY INTERCEPTOR)
   100% Client-Side / Zero-Backend / High-Fidelity Audio Architecture
   ========================================================================== */
(function() {
    'use strict';

    console.info('[Feishin Demo Engine] Initializing standalone Subsonic mock engine...');

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

    // Fast lookup maps
    const songIdMap = {};
    const coverIdMap = {};
    const audioUrlMap = {};

    db.songs.forEach((song, idx) => {
        songIdMap[song.id] = song;
        // Also map legacy or numerical IDs if requested
        songIdMap[String(idx + 1)] = song;
        coverIdMap[song.coverArt] = song.localCoverUrl;
        coverIdMap[song.id] = song.localCoverUrl;
        coverIdMap[song.albumId] = song.localCoverUrl;
        audioUrlMap[song.id] = song.localAudioUrl;
        audioUrlMap[String(idx + 1)] = song.localAudioUrl;
    });

    window.__DEMO_SONGS_MAP__ = songIdMap;
    window.__DEMO_COVERS_MAP__ = coverIdMap;
    window.__DEMO_AUDIO_MAP__ = audioUrlMap;

    // 1. Seed LocalStorage with clean Demo Guest Server credentials
    try {
        const demoServerId = "feishin_demo_cloud_v1";
        const demoAuth = {
            state: {
                actions: {},
                currentServer: {
                    id: demoServerId,
                    name: "Feishin Cloud Demo (In-Memory)",
                    type: "subsonic",
                    url: window.location.origin + window.location.pathname.replace(/\/index\.html$/, ''),
                    credential: "u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json",
                    userId: "demo_user_001",
                    username: "PortfolioGuest",
                    isAdmin: true,
                    preferRemoteUrl: false,
                    version: "1.16.1 (Demo Engine)"
                },
                deviceId: "demo_web_device_777",
                serverList: {
                    [demoServerId]: {
                        id: demoServerId,
                        name: "Feishin Cloud Demo (In-Memory)",
                        type: "subsonic",
                        url: window.location.origin + window.location.pathname.replace(/\/index\.html$/, ''),
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

        // Disable remote telemetries
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

    // 2. Subsonic Response Formatter
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
                openSubsonicExtensions: [
                    { name: "transcodeOffset", versions: [1] },
                    { name: "formPost", versions: [1] },
                    { name: "songLyrics", versions: [1, 2] },
                    { name: "indexBasedQueue", versions: [1] },
                    { name: "transcoding", versions: [1] },
                    { name: "playbackReport", versions: [1] },
                    { name: "topSongsByArtistId", versions: [1] }
                ]
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

        if (endpoint.includes('getArtists.view') || endpoint.includes('getArtists')) {
            return subsonicWrap({
                artists: {
                    ignoredArticles: "The El La Los Las Le Les",
                    index: db.artistsIndex
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

        if (endpoint.includes('getAlbum.view')) {
            const albumId = p.id;
            const albumObj = db.albums[albumId] || Object.values(db.albums)[0];
            return subsonicWrap({
                album: albumObj
            });
        }

        if (endpoint.includes('getAlbumList2.view') || endpoint.includes('getAlbumList.view')) {
            return subsonicWrap({
                albumList2: {
                    album: db.albumList
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
                    s.title.toLowerCase().includes(query) || 
                    s.artist.toLowerCase().includes(query) || 
                    s.album.toLowerCase().includes(query)
                );
                matchedAlbums = db.albumList.filter(a => 
                    a.name.toLowerCase().includes(query) || 
                    a.artist.toLowerCase().includes(query)
                );
                matchedArtists = Object.values(db.artists).filter(a => 
                    a.name.toLowerCase().includes(query)
                );
            }

            return subsonicWrap({
                searchResult3: {
                    song: matchedSongs,
                    album: matchedAlbums,
                    artist: matchedArtists
                }
            });
        }

        if (endpoint.includes('getRandomSongs.view')) {
            return subsonicWrap({
                randomSongs: {
                    song: [...db.songs].sort(() => 0.5 - Math.random())
                }
            });
        }

        if (endpoint.includes('getSong.view')) {
            const song = songIdMap[p.id] || db.songs[0];
            return subsonicWrap({
                song: song
            });
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

        if (endpoint.includes('getStarred2.view') || endpoint.includes('getStarred.view')) {
            return subsonicWrap({
                starred2: {
                    song: db.songs.filter(s => s.starred)
                }
            });
        }

        if (endpoint.includes('scrobble.view') || endpoint.includes('star.view') || endpoint.includes('unstar.view')) {
            return subsonicWrap({});
        }

        // Generic fallback for any other subsonic endpoint
        return subsonicWrap({});
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
                    queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                }
            }
        }
        return queryParams;
    }

    // 4. Intercept fetch API
    const _origFetch = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = function(resource, init) {
        const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');

        // Intercept Subsonic API queries
        if (url.includes('/rest/')) {
            const urlPath = url.split('?')[0];
            const endpoint = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            const params = parseQuery(url);

            // Handle cover art request via fetch if needed
            if (endpoint.includes('getCoverArt.view')) {
                const coverId = params.id;
                const localCover = coverIdMap[coverId] || db.songs[0]?.localCoverUrl;
                if (localCover && _origFetch) {
                    return _origFetch(localCover, init);
                }
            }

            // Handle stream request via fetch if needed
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

        // Block external telemetries
        if (/umami\.jeffvli\.org|api\.github\.com\/repos\/jeffvli\/feishin/.test(url)) {
            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        return _origFetch ? _origFetch.apply(window, arguments) : Promise.reject(new Error('No fetch'));
    };

    // 5. Intercept XMLHttpRequest (Axios uses XHR in standard browser builds)
    const _OrigXHR = window.XMLHttpRequest;
    function MockSubsonicXHR() {
        const xhr = new _OrigXHR();
        let requestUrl = '';

        const _origOpen = xhr.open;
        xhr.open = function(method, url) {
            requestUrl = url || '';
            return _origOpen.apply(this, arguments);
        };

        const _origSend = xhr.send;
        xhr.send = function(body) {
            if (requestUrl.includes('/rest/')) {
                const urlPath = requestUrl.split('?')[0];
                const endpoint = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                const params = parseQuery(requestUrl);
                const mockData = handleSubsonicEndpoint(endpoint, params);
                const jsonStr = JSON.stringify(mockData);

                setTimeout(() => {
                    Object.defineProperty(xhr, 'status', { value: 200, writable: false });
                    Object.defineProperty(xhr, 'statusText', { value: 'OK', writable: false });
                    Object.defineProperty(xhr, 'readyState', { value: 4, writable: false });
                    Object.defineProperty(xhr, 'responseText', { value: jsonStr, writable: false });
                    Object.defineProperty(xhr, 'response', { value: jsonStr, writable: false });

                    xhr.dispatchEvent(new Event('readystatechange'));
                    xhr.dispatchEvent(new Event('load'));
                    xhr.dispatchEvent(new Event('loadend'));
                }, 10);
                return;
            }

            if (/umami\.jeffvli\.org|api\.github\.com\/repos\/jeffvli\/feishin/.test(requestUrl)) {
                setTimeout(() => {
                    Object.defineProperty(xhr, 'status', { value: 200, writable: false });
                    Object.defineProperty(xhr, 'readyState', { value: 4, writable: false });
                    Object.defineProperty(xhr, 'responseText', { value: '{}', writable: false });
                    xhr.dispatchEvent(new Event('load'));
                }, 10);
                return;
            }

            return _origSend.apply(this, arguments);
        };

        return xhr;
    }
    MockSubsonicXHR.prototype = _OrigXHR.prototype;
    window.XMLHttpRequest = MockSubsonicXHR;

    // 6. Direct DOM Element Interceptors for Audio Streaming & Artwork
    try {
        // Intercept HTMLMediaElement (audio/video src)
        const origMediaSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
        if (origMediaSrc && origMediaSrc.set) {
            Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                set: function(val) {
                    if (typeof val === 'string' && val.includes('stream.view')) {
                        const m = val.match(/id=([^&]+)/);
                        const id = m ? m[1] : '';
                        const localPath = audioUrlMap[id] || db.songs[0]?.localAudioUrl;
                        if (localPath) {
                            console.log(`[Audio Hook] Mapping stream.view (id: ${id}) -> ${localPath}`);
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

        // Intercept HTMLImageElement (cover art src)
        const origImgSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
        if (origImgSrc && origImgSrc.set) {
            Object.defineProperty(HTMLImageElement.prototype, 'src', {
                set: function(val) {
                    if (typeof val === 'string' && val.includes('getCoverArt.view')) {
                        const m = val.match(/id=([^&]+)/);
                        const id = m ? m[1] : '';
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

    console.info('[Feishin Demo Engine] Subsonic interceptor loaded successfully with', db.songs.length, 'tracks.');
})();

// 7. Store Hook for Uninterrupted Playback Engine
(function initStoreHook() {
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

        const origAddToQueueByType = state.addToQueueByType;
        if (origAddToQueueByType && !store.__demo_hooked__) {
            store.__demo_hooked__ = true;
            state.addToQueueByType = function(items, playType, playSongId) {
                if (Array.isArray(items)) {
                    items.forEach((item, idx) => {
                        if (item) {
                            item._serverId = item._serverId || 'feishin_demo_cloud_v1';
                            item._serverType = item._serverType || 'subsonic';
                            item._itemType = item._itemType || 'song';
                            item._uniqueId = item._uniqueId || ('feishin_demo_cloud_v1-' + (item.id || idx));
                        }
                    });
                }
                return origAddToQueueByType.apply(this, arguments);
            };
            console.info('[Feishin Demo Engine] Player store successfully hooked for instant audio playback!');
        }
    }
    hookPlayerStore();
})();
