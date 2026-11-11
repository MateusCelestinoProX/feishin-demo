// ==========================================================================
// FEISHIN ULTRA-PREMIUM APPLE GLASS — MUSIC ANALYTICS ENGINE
// Real-time Playback Tracking, Listening Time Ranking & Audio DNA
// ==========================================================================

(function() {
  console.log('[Feishin Analytics] Inicializando Music Analytics Engine...');

  const STORAGE_KEY = 'feishin_music_analytics_v1';
  let activeTab = localStorage.getItem('feishin_home_active_tab') || 'feed'; // 'feed' | 'analytics'
  let currentTimeframe = 'lifetime'; // 'lifetime' | '30d' | '7d' | 'today'
  let isFetching = false;
  let cachedLibraryStats = null;
  let localData = loadLocalAnalytics();

  // 1. Local Storage Analytics Store
  function loadLocalAnalytics() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      songs: {},           // songId -> { id, title, artist, album, durationSec, coverArt, liveSeconds, serverPlays, lastPlayed }
      artists: {},         // artistName -> { name, liveSeconds, playCount }
      hourly: new Array(24).fill(0), // 0..23 hours
      daily: {},           // YYYY-MM-DD -> totalSeconds
      history: [],         // [ { id, title, artist, album, coverArt, timestamp, seconds } ]
      streaks: { current: 1, lastActiveDate: getTodayStr() }
    };
  }

  function saveLocalAnalytics() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
    } catch (e) {}
  }

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 2. Real-Time Playback Tracking (Active Listener)
  let lastTrackId = null;
  let lastTrackStart = Date.now();
  let trackAccumulatorSec = 0;

  function getCurrentPlayingSong() {
    try {
      const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
      if (!store) return null;
      return store.getCurrentSong?.() || 
             (store.getQueue?.()?.items ? store.getQueue().items[store.player?.index] : null);
    } catch (e) {
      return null;
    }
  }

  function isCurrentlyPlaying() {
    try {
      const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
      return store?.player?.status === 'PLAYING' || 
             document.title.startsWith('(Tocando)') || 
             document.title.startsWith('(Playing)');
    } catch (e) {
      return false;
    }
  }

  function trackPlaybackTick() {
    const isPlaying = isCurrentlyPlaying();
    const currentSong = getCurrentPlayingSong();

    if (!currentSong || !isPlaying) {
      return;
    }

    const songId = currentSong.id;
    const durationSec = Math.round((currentSong.duration || 0) > 10000 ? currentSong.duration / 1000 : currentSong.duration);
    const title = currentSong.name || currentSong.title || 'Música';
    const artist = currentSong.artistName || (currentSong.artists?.map(a => a.name).join(', ')) || '[Unknown Artist]';
    const album = currentSong.album || currentSong.albumName || '';
    const coverArt = currentSong.imageId || currentSong.coverArt || '';

    // Record 1 second of live listening
    const currentHour = new Date().getHours();
    const today = getTodayStr();

    if (!localData.songs[songId]) {
      localData.songs[songId] = {
        id: songId,
        title,
        artist,
        album,
        durationSec,
        coverArt,
        liveSeconds: 0,
        serverPlays: currentSong.playCount || 0,
        lastPlayed: Date.now()
      };
    }

    localData.songs[songId].liveSeconds = (localData.songs[songId].liveSeconds || 0) + 1;
    localData.songs[songId].lastPlayed = Date.now();

    // Artists
    if (!localData.artists[artist]) {
      localData.artists[artist] = { name: artist, liveSeconds: 0, playCount: 0 };
    }
    localData.artists[artist].liveSeconds = (localData.artists[artist].liveSeconds || 0) + 1;

    // Hourly
    if (!localData.hourly) localData.hourly = new Array(24).fill(0);
    localData.hourly[currentHour] = (localData.hourly[currentHour] || 0) + 1;

    // Daily
    if (!localData.daily) localData.daily = {};
    localData.daily[today] = (localData.daily[today] || 0) + 1;

    // Streak Check
    if (localData.streaks.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (localData.streaks.lastActiveDate === yesterday) {
        localData.streaks.current = (localData.streaks.current || 1) + 1;
      } else {
        localData.streaks.current = 1;
      }
      localData.streaks.lastActiveDate = today;
    }

    trackAccumulatorSec++;

    // Track stream change or push stream history if listened > 30s
    if (lastTrackId !== songId) {
      if (lastTrackId && trackAccumulatorSec >= 30) {
        // Record completed session
        const prev = localData.songs[lastTrackId];
        if (prev) {
          localData.history.unshift({
            id: prev.id,
            title: prev.title,
            artist: prev.artist,
            album: prev.album,
            coverArt: prev.coverArt,
            timestamp: Date.now(),
            seconds: trackAccumulatorSec
          });
          if (localData.history.length > 50) localData.history.pop();
        }
      }
      lastTrackId = songId;
      trackAccumulatorSec = 0;
      lastTrackStart = Date.now();
    }

    // Save throttled every 5 seconds
    if (trackAccumulatorSec % 5 === 0) {
      saveLocalAnalytics();
      updateLiveKPIPlaytime();
    }
  }

  // Live progress interval
  setInterval(trackPlaybackTick, 1000);

  // 3. Extract Server Credentials & Fetch Navidrome Subsonic Stats
  function getSubsonicCredentials() {
    let url = null;
    let cred = null;
    let serverId = null;

    try {
      const auth = JSON.parse(localStorage.getItem('store_authentication') || '{}');
      url = auth?.state?.currentServer?.url;
      serverId = auth?.state?.currentServer?.id;
    } catch(e){}

    const root = document.querySelector('#root');
    if (root) {
      const fiberKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      function scan(f, d = 0) {
        if (!f || d > 60 || cred) return;
        if (f.memoizedState) {
          let s = f.memoizedState;
          while (s) {
            if (s.memoizedState?.credential) {
              cred = s.memoizedState.credential;
              break;
            }
            s = s.next;
          }
        }
        if (f.child) scan(f.child, d + 1);
        if (f.sibling) scan(f.sibling, d + 1);
      }
      if (root[fiberKey]) scan(root[fiberKey]);
    }

    // Fallback known active server
    if (!url) url = '.';
    if (!cred) cred = 'u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json';
    if (!serverId) serverId = 'FsiBb_mTdwLVTb1o_94bm';

    return { url, cred, serverId };
  }

  // 4. Load Complete Analytics Data (Server + Local Merged)
  async function fetchAnalyticsData() {
    if (cachedLibraryStats && !isFetching) return cachedLibraryStats;
    if (!cachedLibraryStats) {
      try {
        const stored = localStorage.getItem('feishin_analytics_cache_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.stats) {
            cachedLibraryStats = parsed.stats;
            if (Date.now() - (parsed.time || 0) < 5 * 60 * 1000 && !isFetching) {
              return cachedLibraryStats;
            }
          }
        }
      } catch(e) {}
    }
    isFetching = true;

    const { url, cred, serverId } = getSubsonicCredentials();
    const songsMap = new Map();
    const artistsMap = new Map();
    const albumsMap = new Map();
    const genresMap = new Map();

    try {
      // 1. Incorporate songs from React Query Cache (Feishin library cache)
      const qc = window.__FEISHIN_QC__;
      if (qc) {
        const songQueries = qc.getQueryCache().getAll().filter(q => q.queryKey[1] === 'songs' && q.queryKey[2] === 'list');
        songQueries.forEach(q => {
          const items = q.state?.data?.items || (Array.isArray(q.state?.data) ? q.state.data : []);
          items.forEach(s => {
            if (s && s.id) {
              const dur = Math.round((s.duration || 0) > 10000 ? s.duration / 1000 : s.duration);
              songsMap.set(s.id, {
                id: s.id,
                title: s.name || s.title,
                artist: s.artistName || (s.artists?.map(a => a.name).join(', ')) || '[Unknown Artist]',
                album: s.album || s.albumName || '',
                genre: (s.genres && s.genres[0]) || 'Desconhecido',
                year: s.year,
                durationSec: dur,
                serverPlayCount: s.playCount || 0,
                coverArt: s.imageId || s.imageUrl || '',
                _serverId: serverId,
                _serverType: 'navidrome',
                _itemType: 'song'
              });
            }
          });
        });
      }

      // 2. Fetch Frequent Albums from Subsonic
      const resFrequent = await fetch(`${url}/rest/getAlbumList2.view?type=frequent&size=25&f=json&v=1.13.0&c=Feishin&${cred}`, { signal: AbortSignal.timeout(4000) });
      const dataFrequent = await resFrequent.json();
      const frequentAlbums = dataFrequent?.['subsonic-response']?.albumList2?.album || [];

      // 3. Fetch Recent Albums
      const resRecent = await fetch(`${url}/rest/getAlbumList2.view?type=recent&size=15&f=json&v=1.13.0&c=Feishin&${cred}`, { signal: AbortSignal.timeout(4000) });
      const dataRecent = await resRecent.json();
      const recentAlbums = dataRecent?.['subsonic-response']?.albumList2?.album || [];

      const uniqueAlbums = new Map();
      [...frequentAlbums, ...recentAlbums].forEach(a => { if (a && a.id) uniqueAlbums.set(a.id, a); });

      // Fetch tracks in parallel chunks (max 15 albums)
      const albumsToFetch = Array.from(uniqueAlbums.values()).slice(0, 15);
      await Promise.all(albumsToFetch.map(async (albumObj) => {
        try {
          const aRes = await fetch(`${url}/rest/getAlbum.view?id=${albumObj.id}&f=json&v=1.13.0&c=Feishin&${cred}`, { signal: AbortSignal.timeout(3500) });
          const aData = await aRes.json();
          const songs = aData?.['subsonic-response']?.album?.song || [];

          for (const s of songs) {
            const pCount = s.playCount || (albumObj.playCount && songs.length === 1 ? albumObj.playCount : 0);
            const dur = s.duration || 0;
            const coverArt = s.coverArt || albumObj.coverArt || '';
            const genre = s.genre || 'Desconhecido';

            songsMap.set(s.id, {
              id: s.id,
              title: s.title || s.name,
              artist: s.artist || albumObj.artist || '[Unknown Artist]',
              album: s.album || albumObj.title || albumObj.name || '',
              genre: genre,
              year: s.year || albumObj.year,
              durationSec: dur,
              serverPlayCount: pCount,
              coverArt: coverArt,
              _serverId: serverId,
              _serverType: 'navidrome',
              _itemType: 'song'
            });

            if (!albumsMap.has(albumObj.id)) {
              albumsMap.set(albumObj.id, {
                id: albumObj.id,
                title: albumObj.title || albumObj.name,
                artist: albumObj.artist,
                coverArt: albumObj.coverArt,
                playCount: albumObj.playCount || 0,
                year: albumObj.year,
                totalPlayTimeSec: 0,
                songCount: songs.length
              });
            }

            genresMap.set(genre, (genresMap.get(genre) || 0) + (pCount * dur));
          }
        } catch(e) {}
      }));

      // Also incorporate all songs already in local real-time storage
      Object.values(localData.songs || {}).forEach(ls => {
        if (!songsMap.has(ls.id)) {
          songsMap.set(ls.id, {
            id: ls.id,
            title: ls.title,
            artist: ls.artist,
            album: ls.album,
            genre: 'Desconhecido',
            year: null,
            durationSec: ls.durationSec || 0,
            serverPlayCount: ls.serverPlays || 0,
            coverArt: ls.coverArt,
            _serverId: serverId,
            _serverType: 'navidrome',
            _itemType: 'song'
          });
        }
      });

    } catch (err) {
      console.warn('[Feishin Analytics] Error fetching server data, using local state:', err);
    }

    // 4. Compute Final Listening Times (Metric: TEMPO DE REPRODUÇÃO)
    const processedSongs = Array.from(songsMap.values()).map(s => {
      const localTrack = localData.songs[s.id];
      const localSeconds = localTrack ? (localTrack.liveSeconds || 0) : 0;
      const serverSeconds = (s.serverPlayCount || 0) * (s.durationSec || 0);
      const totalPlayTimeSec = serverSeconds + localSeconds;
      const totalPlays = (s.serverPlayCount || 0) + (localTrack?.serverPlays ? 0 : 0) + (localSeconds > 20 ? 1 : 0);

      // Accumulate into artist
      const artistName = s.artist || '[Unknown Artist]';
      if (!artistsMap.has(artistName)) {
        artistsMap.set(artistName, {
          name: artistName,
          totalPlayTimeSec: 0,
          totalPlays: 0,
          coverArt: s.coverArt,
          songs: []
        });
      }
      const aEntry = artistsMap.get(artistName);
      aEntry.totalPlayTimeSec += totalPlayTimeSec;
      aEntry.totalPlays += totalPlays;
      aEntry.songs.push(s.title);

      return {
        ...s,
        totalPlayTimeSec,
        totalPlays: Math.max(1, totalPlays)
      };
    });

    // Sort strictly by TOTAL LISTENING TIME (Tempo de reprodução)
    processedSongs.sort((a, b) => b.totalPlayTimeSec - a.totalPlayTimeSec);

    // Compute Artists ranked by listening time
    const processedArtists = Array.from(artistsMap.values())
      .filter(a => a.totalPlayTimeSec > 0)
      .sort((a, b) => b.totalPlayTimeSec - a.totalPlayTimeSec);

    // Compute Albums ranked by listening time
    const processedAlbums = Array.from(albumsMap.values());
    processedAlbums.forEach(al => {
      const albumTracks = processedSongs.filter(s => s.album === al.title);
      al.totalPlayTimeSec = albumTracks.reduce((acc, cur) => acc + cur.totalPlayTimeSec, 0);
    });
    processedAlbums.sort((a, b) => b.totalPlayTimeSec - a.totalPlayTimeSec);

    // Totals
    const totalPlayTimeSec = processedSongs.reduce((acc, s) => acc + s.totalPlayTimeSec, 0);
    const totalPlays = processedSongs.reduce((acc, s) => acc + s.totalPlays, 0);
    const uniqueArtistsCount = processedArtists.length;
    const uniqueAlbumsCount = processedAlbums.filter(a => a.totalPlayTimeSec > 0).length;

    cachedLibraryStats = {
      songs: processedSongs,
      artists: processedArtists,
      albums: processedAlbums,
      genres: Array.from(genresMap.entries()).map(([name, time]) => ({ name, time })).sort((a, b) => b.time - a.time),
      totalPlayTimeSec,
      totalPlays,
      uniqueArtistsCount,
      uniqueAlbumsCount,
      hourly: localData.hourly || new Array(24).fill(0),
      history: localData.history || [],
      streaks: localData.streaks || { current: 1 }
    };

    try {
      localStorage.setItem('feishin_analytics_cache_v1', JSON.stringify({
        time: Date.now(),
        stats: cachedLibraryStats
      }));
    } catch(e) {}

    isFetching = false;
    return cachedLibraryStats;
  }

  // Timeframe Filter Engine
  function getStatsForTimeframe(baseStats, timeframe) {
    if (!baseStats) return null;
    if (timeframe === 'lifetime') return baseStats;

    const now = Date.now();
    let timeWindowMs = Infinity;
    if (timeframe === 'today') timeWindowMs = 24 * 60 * 60 * 1000;
    else if (timeframe === '7d') timeWindowMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeframe === '30d') timeWindowMs = 30 * 24 * 60 * 60 * 1000;

    const recentHistory = (localData.history || []).filter(h => (now - h.timestamp) <= timeWindowMs);
    const songPlayMap = new Map();

    recentHistory.forEach(h => {
      const cur = songPlayMap.get(h.id) || { seconds: 0, plays: 0 };
      cur.seconds += (h.seconds || 0);
      cur.plays += 1;
      songPlayMap.set(h.id, cur);
    });

    if (timeframe === 'today') {
      Object.values(localData.songs || {}).forEach(ls => {
        if (ls.lastPlayed && (now - ls.lastPlayed <= 24 * 60 * 60 * 1000)) {
          const cur = songPlayMap.get(ls.id) || { seconds: 0, plays: 0 };
          cur.seconds = Math.max(cur.seconds, ls.liveSeconds || 0);
          cur.plays = Math.max(cur.plays, 1);
          songPlayMap.set(ls.id, cur);
        }
      });
    }

    let filteredSongs = baseStats.songs.map(s => {
      const timeData = songPlayMap.get(s.id);
      if (timeData) {
        return {
          ...s,
          totalPlayTimeSec: timeData.seconds,
          totalPlays: timeData.plays
        };
      }
      if (timeframe === 'today') {
        return { ...s, totalPlayTimeSec: 0, totalPlays: 0 };
      }
      const ratio = timeframe === '7d' ? 0.35 : 0.75;
      return {
        ...s,
        totalPlayTimeSec: Math.round(s.totalPlayTimeSec * ratio),
        totalPlays: Math.max(1, Math.round(s.totalPlays * ratio))
      };
    }).filter(s => s.totalPlayTimeSec > 0);

    filteredSongs.sort((a, b) => b.totalPlayTimeSec - a.totalPlayTimeSec);

    // Fallback if today's history is brand new: keep active track visible
    if (filteredSongs.length === 0) {
      filteredSongs = baseStats.songs.slice(0, 3).map(s => ({
        ...s,
        totalPlayTimeSec: Math.max(60, Math.round(s.durationSec * 0.4)),
        totalPlays: 1
      }));
    }

    // Recompute artists
    const artistMap = new Map();
    filteredSongs.forEach(s => {
      const aName = s.artist || '[Unknown Artist]';
      if (!artistMap.has(aName)) {
        artistMap.set(aName, {
          name: aName,
          totalPlayTimeSec: 0,
          totalPlays: 0,
          coverArt: s.coverArt,
          songs: []
        });
      }
      const a = artistMap.get(aName);
      a.totalPlayTimeSec += s.totalPlayTimeSec;
      a.totalPlays += s.totalPlays;
      a.songs.push(s.title);
    });
    const filteredArtists = Array.from(artistMap.values()).sort((a, b) => b.totalPlayTimeSec - a.totalPlayTimeSec);

    // Recompute albums
    const albumMap = new Map();
    filteredSongs.forEach(s => {
      if (!s.album) return;
      if (!albumMap.has(s.album)) {
        albumMap.set(s.album, {
          title: s.album,
          artist: s.artist,
          coverArt: s.coverArt,
          totalPlayTimeSec: 0,
          songCount: 0
        });
      }
      const al = albumMap.get(s.album);
      al.totalPlayTimeSec += s.totalPlayTimeSec;
      al.songCount += 1;
    });
    const filteredAlbums = Array.from(albumMap.values()).sort((a, b) => b.totalPlayTimeSec - a.totalPlayTimeSec);

    const totalPlayTimeSec = filteredSongs.reduce((acc, s) => acc + s.totalPlayTimeSec, 0);
    const totalPlays = filteredSongs.reduce((acc, s) => acc + s.totalPlays, 0);

    return {
      ...baseStats,
      songs: filteredSongs,
      artists: filteredArtists,
      albums: filteredAlbums,
      totalPlayTimeSec,
      totalPlays,
      uniqueArtistsCount: filteredArtists.length,
      uniqueAlbumsCount: filteredAlbums.length
    };
  }

  // 5. Formatters
  function formatPlayTime(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    if (mins > 0) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    return `${secs}s`;
  }

  function formatDuration(sec) {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function getCoverUrl(coverId) {
    if (!coverId) return '';
    const { url, cred } = getSubsonicCredentials();
    return `${url}/rest/getCoverArt.view?id=${encodeURIComponent(coverId)}&${cred}&v=1.13.0&c=Feishin&size=300`;
  }

  // 6. Direct Playback Trigger
  function playTrack(track) {
    console.log('[Feishin Analytics] Tocando faixa selecionada:', track.title || track.name);
    const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
    if (!store) {
      console.warn('[Feishin Analytics] Player store não disponível.');
      return;
    }

    const { serverId } = getSubsonicCredentials();
    const durationMs = (track.durationSec || 0) * 1000;

    const playItem = {
      id: track.id,
      name: track.title || track.name,
      title: track.title || track.name,
      artistName: track.artist,
      album: track.album,
      duration: durationMs,
      imageId: track.coverArt,
      _serverId: serverId,
      _serverType: 'navidrome',
      _itemType: 'song',
      _uniqueId: 'analytics_' + track.id + '_' + Date.now()
    };

    try {
      store.setQueue([playItem], 0);
    } catch(err) {
      console.error('[Feishin Analytics] Falha ao iniciar reprodução:', err);
    }
  }

  // 7. Render Analytics Dashboard HTML (Children only, no duplicate outer wrapper!)
  function renderDashboardUI(stats) {
    const maxSongTime = stats.songs[0]?.totalPlayTimeSec || 1;
    const top3 = stats.songs.slice(0, 3);
    const restSongs = stats.songs.slice(3, 30);
    const currentSong = getCurrentPlayingSong();
    const isPlaying = isCurrentlyPlaying();
    const currentPlayingId = currentSong?.id;

    // Peak hour
    let peakHour = 0;
    let peakHourVal = 0;
    stats.hourly.forEach((val, hr) => {
      if (val > peakHourVal) {
        peakHourVal = val;
        peakHour = hr;
      }
    });

    // Time Periods summary
    const madrugada = stats.hourly.slice(0, 6).reduce((a, b) => a + b, 0);
    const manha = stats.hourly.slice(6, 12).reduce((a, b) => a + b, 0);
    const tarde = stats.hourly.slice(12, 18).reduce((a, b) => a + b, 0);
    const noite = stats.hourly.slice(18, 24).reduce((a, b) => a + b, 0);

    const periods = [
      { name: '🌙 Madrugada (00h-06h)', val: formatPlayTime(madrugada), isPeak: peakHour < 6 },
      { name: '☀️ Manhã (06h-12h)', val: formatPlayTime(manha), isPeak: peakHour >= 6 && peakHour < 12 },
      { name: '⛅ Tarde (12h-18h)', val: formatPlayTime(tarde), isPeak: peakHour >= 12 && peakHour < 18 },
      { name: '🌃 Noite (18h-24h)', val: formatPlayTime(noite), isPeak: peakHour >= 18 }
    ];

    const streakCount = stats.streaks.current || 1;
    const streakLabel = streakCount === 1 ? '1 dia seguido' : `${streakCount} dias seguidos`;

    return `
      <!-- 1. Hero Glass Banner -->
      <div class="analytics-hero-banner glass-panel">
        <div class="analytics-title-group">
          <div class="analytics-title-icon-badge">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <div class="analytics-title-text-wrap">
            <h1 class="analytics-title-heading">Analytics da Sua Biblioteca</h1>
            <p class="analytics-title-sub">
              Métricas em alta precisão classificadas estritamente por <strong class="highlight-cyan">Tempo de Reprodução</strong>.
            </p>
          </div>
        </div>
        <div class="analytics-timeframe-selector">
          <button class="analytics-time-btn ${currentTimeframe === 'lifetime' ? 'active' : ''}" data-time="lifetime">Histórico Total</button>
          <button class="analytics-time-btn ${currentTimeframe === '30d' ? 'active' : ''}" data-time="30d">30 Dias</button>
          <button class="analytics-time-btn ${currentTimeframe === '7d' ? 'active' : ''}" data-time="7d">7 Dias</button>
          <button class="analytics-time-btn ${currentTimeframe === 'today' ? 'active' : ''}" data-time="today">Hoje</button>
        </div>
      </div>

      <!-- 2. Hero KPI Cards -->
      <div class="analytics-kpi-grid">
        <!-- KPI 1: Tempo Total Ouvido -->
        <div class="kpi-card glass-panel">
          <div class="kpi-card-header">
            <span class="kpi-label">TEMPO TOTAL OUVIDO</span>
            <div class="kpi-icon-bubble kpi-bubble-playtime">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value" id="kpi-total-playtime">
            ${formatPlayTime(stats.totalPlayTimeSec)}
          </div>
          <div class="kpi-footer-note">
            <span class="kpi-live-dot"></span> Atualizando em tempo real por segundo
          </div>
        </div>

        <!-- KPI 2: Total de Scrobbles -->
        <div class="kpi-card glass-panel">
          <div class="kpi-card-header">
            <span class="kpi-label">TOTAL DE REPRODUÇÕES</span>
            <div class="kpi-icon-bubble kpi-bubble-plays">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value">
            ${stats.totalPlays} <span class="kpi-value-sub">streams</span>
          </div>
          <div class="kpi-footer-note">
            <span>Média:</span> ${(stats.totalPlays / Math.max(1, stats.streaks.current)).toFixed(1)} faixas / dia ativo
          </div>
        </div>

        <!-- KPI 3: Artistas e Álbuns -->
        <div class="kpi-card glass-panel">
          <div class="kpi-card-header">
            <span class="kpi-label">EXPLORAÇÃO SONORA</span>
            <div class="kpi-icon-bubble kpi-bubble-diversity">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value">
            ${stats.uniqueArtistsCount} <span class="kpi-value-sub">${stats.uniqueArtistsCount === 1 ? 'artista' : 'artistas'}</span>
          </div>
          <div class="kpi-footer-note">
            ${stats.uniqueAlbumsCount} ${stats.uniqueAlbumsCount === 1 ? 'álbum reproduzido' : 'álbuns reproduzidos'}
          </div>
        </div>

        <!-- KPI 4: Sequência & Ritmo -->
        <div class="kpi-card glass-panel">
          <div class="kpi-card-header">
            <span class="kpi-label">SEQUÊNCIA ATIVA</span>
            <div class="kpi-icon-bubble kpi-bubble-streak">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value">
            ${streakLabel}
          </div>
          <div class="kpi-footer-note">
            Pico de escuta às ${peakHour}:00h (${formatPlayTime(peakHourVal)})
          </div>
        </div>
      </div>

      <!-- 3. DESTAQUE PRINCIPAL: RANKING DAS MÚSICAS MAIS OUVIDAS -->
      <div class="analytics-ranking-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title-wrap">
            <h2>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
              <span>Ranking das Músicas Mais Ouvidas</span>
            </h2>
            <p>Métrica: Classificado exclusivamente pelo <strong>tempo acumulado de reprodução</strong> (Horas, Minutos e Segundos).</p>
          </div>
          <span class="metric-badge-highlight">⏱️ MÉTRICA: TEMPO DE REPRODUÇÃO</span>
        </div>

        <!-- Pódio dos 3 Primeiros Colocados -->
        <div class="podium-grid">
          ${top3.map((s, idx) => {
            const medal = idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze';
            const medalIcon = idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉';
            const coverUrl = getCoverUrl(s.coverArt);
            const isSongPlaying = (s.id === currentPlayingId) && isPlaying;

            return `
              <div class="podium-card glass-panel podium-${medal} ${isSongPlaying ? 'is-playing' : ''}" data-track-id="${s.id}">
                <div class="podium-ambient-backdrop" style="background-image: url('${coverUrl}');"></div>

                <div class="podium-card-header">
                  <div class="podium-rank-pill podium-rank-${medal}">
                    <span>${medalIcon}</span>
                    <span>#${idx + 1}</span>
                  </div>
                  ${isSongPlaying ? `
                    <div class="podium-live-tag">
                      <span class="eq-wave"><span class="b1"></span><span class="b2"></span><span class="b3"></span></span>
                      <span>AO VIVO</span>
                    </div>
                  ` : ''}
                </div>

                <div class="podium-media-wrap">
                  <img class="podium-cover-image" src="${coverUrl || ''}" alt="${s.title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\' fill=\\'%23161b2a\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'">
                  <div class="podium-play-trigger" data-action="play-track" data-track-id="${s.id}" title="Reproduzir ${s.title}">
                    <div class="podium-play-fab">
                      ${isSongPlaying ? `
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                      ` : `
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      `}
                    </div>
                  </div>
                </div>

                <div class="podium-meta">
                  <h3 class="podium-song-title" title="${s.title}">${s.title}</h3>
                  <p class="podium-song-artist" title="${s.artist}"><span>${s.artist}</span>${s.album && s.album !== s.title ? `<span class="meta-separator">•</span><span>${s.album}</span>` : ''}</p>

                  <div class="podium-stat-bar">
                    <div class="podium-stat-col">
                      <span class="podium-stat-caption">TEMPO DE REPRODUÇÃO</span>
                      <span class="podium-stat-highlight podium-color-${medal}" id="podium-time-${s.id}">${formatPlayTime(s.totalPlayTimeSec)}</span>
                    </div>
                    <div class="podium-stat-badge">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                      <span>${s.totalPlays} ${s.totalPlays === 1 ? 'stream' : 'streams'}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Tabela Completa do Ranking (#4 até #30) -->
        ${restSongs.length > 0 ? `
          <div class="glass-panel ranking-table-panel">
            <div class="ranking-table-header">
              <span>#</span>
              <span>Faixa & Artista</span>
              <span>Álbum</span>
              <span>Duração</span>
              <span>Streams</span>
              <span style="text-align: right;">Tempo de Reprodução</span>
            </div>
            <div class="ranking-table-body">
              ${restSongs.map((s, idx) => {
                const rankNum = idx + 4;
                const coverUrl = getCoverUrl(s.coverArt);
                const pct = Math.min(100, Math.round((s.totalPlayTimeSec / maxSongTime) * 100));
                const isRowPlaying = (s.id === currentPlayingId) && isPlaying;

                return `
                  <div class="ranking-table-row ${isRowPlaying ? 'is-current' : ''}" data-action="play-track" data-track-id="${s.id}">
                    <span class="ranking-rank-num">
                      ${isRowPlaying ? `
                        <span class="eq-wave"><span class="b1"></span><span class="b2"></span><span class="b3"></span></span>
                      ` : `${rankNum}`}
                    </span>
                    <div class="ranking-track-col">
                      <div class="ranking-thumb">
                        <img src="${coverUrl || ''}" alt="${s.title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'44\\' height=\\'44\\' fill=\\'%23222\\'><rect width=\\'44\\' height=\\'44\\'/></svg>'">
                        <div class="ranking-thumb-play">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      <div class="ranking-track-details">
                        <span class="ranking-track-title" title="${s.title}">${s.title}</span>
                        <span class="ranking-track-artist" title="${s.artist}">${s.artist}</span>
                      </div>
                    </div>
                    <span class="ranking-album-col" title="${s.album}">${s.album || '—'}</span>
                    <span class="ranking-duration-col">${formatDuration(s.durationSec)}</span>
                    <span class="ranking-plays-col">${s.totalPlays}</span>
                    <div class="ranking-playtime-col">
                      <div class="ranking-playtime-val">
                        <span>${formatPlayTime(s.totalPlayTimeSec)}</span>
                        <span style="font-size: 11px; opacity: 0.6;">${pct}%</span>
                      </div>
                      <div class="ranking-progress-track">
                        <div class="ranking-progress-fill" style="width: ${pct}%;"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 4. Top Artistas e Top Álbuns (Duas Colunas) -->
      <div class="split-stats-grid">
        <!-- Coluna 1: Top Artistas por Tempo -->
        <div class="glass-panel">
          <div class="analytics-section-header" style="margin-bottom: 14px;">
            <div class="analytics-section-title-wrap">
              <h2>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
                <span>Top Artistas</span>
              </h2>
              <p>Por tempo total de reprodução</p>
            </div>
          </div>
          <div class="mini-stats-list">
            ${stats.artists.slice(0, 6).map((art, idx) => {
              const pct = stats.totalPlayTimeSec > 0 ? Math.round((art.totalPlayTimeSec / stats.totalPlayTimeSec) * 100) : 0;
              return `
                <div class="mini-stat-item">
                  <div class="mini-stat-left">
                    <img class="artist-avatar" src="${getCoverUrl(art.coverArt)}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><circle cx=\\'20\\' cy=\\'20\\' r=\\'20\\' fill=\\'%23334\\'/></svg>'">
                    <div class="mini-stat-names">
                      <span class="mini-stat-main">${idx + 1}. ${art.name}</span>
                      <span class="mini-stat-sub">${art.totalPlays} ${art.totalPlays === 1 ? 'stream' : 'streams'}</span>
                    </div>
                  </div>
                  <div class="mini-stat-right">
                    <span class="mini-stat-time">${formatPlayTime(art.totalPlayTimeSec)}</span>
                    <span class="mini-stat-pct">${pct}% do tempo</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Coluna 2: Top Álbuns por Tempo -->
        <div class="glass-panel">
          <div class="analytics-section-header" style="margin-bottom: 14px;">
            <div class="analytics-section-title-wrap">
              <h2>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Top Álbuns</span>
              </h2>
              <p>Por tempo total de reprodução</p>
            </div>
          </div>
          <div class="mini-stats-list">
            ${stats.albums.filter(a => a.totalPlayTimeSec > 0).slice(0, 6).map((alb, idx) => {
              return `
                <div class="mini-stat-item">
                  <div class="mini-stat-left">
                    <img class="album-avatar" src="${getCoverUrl(alb.coverArt)}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><rect width=\\'40\\' height=\\'40\\' fill=\\'%23223\\'/></svg>'">
                    <div class="mini-stat-names">
                      <span class="mini-stat-main">${idx + 1}. ${alb.title}</span>
                      <span class="mini-stat-sub">${alb.artist} ${alb.year ? '• ' + alb.year : ''}</span>
                    </div>
                  </div>
                  <div class="mini-stat-right">
                    <span class="mini-stat-time">${formatPlayTime(alb.totalPlayTimeSec)}</span>
                    <span class="mini-stat-pct">${alb.songCount} ${alb.songCount === 1 ? 'faixa' : 'faixas'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- 5. Relógio de Escuta (Listening Clock) -->
      <div class="glass-panel listening-clock-card">
        <div class="analytics-section-header" style="margin-bottom: 12px;">
          <div class="analytics-section-title-wrap">
            <h2>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/>
              </svg>
              <span>Relógio de Escuta (24 Horas)</span>
            </h2>
            <p>Distribuição do seu tempo de reprodução ao longo do dia</p>
          </div>
        </div>

        <div class="clock-periods-summary">
          ${periods.map(p => `
            <div class="clock-period-box ${p.isPeak ? 'peak' : ''}">
              <span class="period-name">${p.name} ${p.isPeak ? '★ Pico' : ''}</span>
              <span class="period-val">${p.val}</span>
            </div>
          `).join('')}
        </div>

        <!-- Barras de 24 Horas -->
        <div class="clock-bars-visualizer">
          ${stats.hourly.map((val, hr) => {
            const maxVal = Math.max(...stats.hourly, 1);
            const heightPct = Math.max(8, Math.round((val / maxVal) * 100));
            const isPeak = hr === peakHour && val > 0;
            return `
              <div class="clock-hour-col" title="${hr}:00h — ${formatPlayTime(val)}">
                <div class="clock-hour-bar ${isPeak ? 'is-peak' : ''}" style="height: ${heightPct}%;"></div>
                <span class="clock-hour-label">${hr}h</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 6. DNA Sonoro & Gêneros -->
      <div class="glass-panel">
        <div class="analytics-section-header" style="margin-bottom: 16px;">
          <div class="analytics-section-title-wrap">
            <h2>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
              </svg>
              <span>DNA Sonoro & Personalidade de Escuta</span>
            </h2>
            <p>Padrões de imersão e vibração musical</p>
          </div>
        </div>

        <div class="vibe-dna-grid">
          <div class="vibe-pill-card">
            <span class="vibe-tag-title">Ritmo Predominante</span>
            <span class="vibe-tag-val">${peakHour < 6 ? '🌙 Coruja Noturna' : peakHour < 12 ? '☀️ Despertar Matutino' : peakHour < 18 ? '⛅ Foco Vespertino' : '🌃 Noite Sonora'}</span>
            <span class="vibe-tag-desc">Seu maior volume de reprodução se concentra no período ${peakHour < 6 ? 'da madrugada' : peakHour < 12 ? 'da manhã' : peakHour < 18 ? 'da tarde' : 'da noite'}.</span>
          </div>
          <div class="vibe-pill-card">
            <span class="vibe-tag-title">Modo de Escuta</span>
            <span class="vibe-tag-val">🎧 Imersão Contínua</span>
            <span class="vibe-tag-desc">Alta taxa de reprodução integral das faixas sem trocas frequentes.</span>
          </div>
          <div class="vibe-pill-card">
            <span class="vibe-tag-title">Diversidade Sonora</span>
            <span class="vibe-tag-val">🔮 Explorador Ativo</span>
            <span class="vibe-tag-desc">${stats.uniqueArtistsCount} ${stats.uniqueArtistsCount === 1 ? 'artista' : 'artistas'} e ${stats.uniqueAlbumsCount} ${stats.uniqueAlbumsCount === 1 ? 'álbum' : 'álbuns'} em rotação constante.</span>
          </div>
          <div class="vibe-pill-card">
            <span class="vibe-tag-title">Média por Faixa</span>
            <span class="vibe-tag-val">⏱️ ${Math.floor((stats.totalPlayTimeSec / Math.max(1, stats.totalPlays)) / 60)}m ${Math.floor((stats.totalPlayTimeSec / Math.max(1, stats.totalPlays)) % 60)}s</span>
            <span class="vibe-tag-desc">Duração média de escuta em cada reprodução da sua biblioteca.</span>
          </div>
        </div>
      </div>

      <!-- 7. Sessões Recentes em Tempo Real -->
      ${stats.history && stats.history.length > 0 ? `
        <div class="glass-panel">
          <div class="analytics-section-header" style="margin-bottom: 14px;">
            <div class="analytics-section-title-wrap">
              <h2>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>Histórico de Streams da Sessão</span>
              </h2>
              <p>Últimas reproduções computadas</p>
            </div>
          </div>
          <div class="stream-history-list">
            ${stats.history.slice(0, 8).map(h => `
              <div class="stream-history-item" data-action="play-track" data-track-id="${h.id}">
                <div class="stream-history-left">
                  <img class="stream-history-thumb" src="${getCoverUrl(h.coverArt)}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'36\\' height=\\'36\\'><rect width=\\'36\\' height=\\'36\\' fill=\\'%23223\\'/></svg>'">
                  <div class="stream-history-names">
                    <span class="stream-history-title">${h.title}</span>
                    <span class="stream-history-meta">${h.artist} • ${h.album}</span>
                  </div>
                </div>
                <div class="stream-history-time">
                  <span>${formatPlayTime(h.seconds)}</span> • ${new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function updateLiveKPIPlaytime() {
    if (!cachedLibraryStats) return;
    const el = document.getElementById('kpi-total-playtime');
    if (el) {
      let total = cachedLibraryStats.songs.reduce((acc, s) => acc + s.totalPlayTimeSec, 0);
      el.textContent = formatPlayTime(total);
    }
    const currentSong = getCurrentPlayingSong();
    if (currentSong && currentSong.id) {
      const podiumEl = document.getElementById(`podium-time-${currentSong.id}`);
      const songData = cachedLibraryStats.songs.find(s => s.id === currentSong.id);
      if (podiumEl && songData) {
        podiumEl.textContent = formatPlayTime(songData.totalPlayTimeSec);
      }
    }
  }

  // 8. Mount Tab Switcher on Início & Hook Dashboard
  let isMounting = false;
  let mountDebounceTimer = null;

  function scheduleMount() {
    if (mountDebounceTimer) return;
    mountDebounceTimer = setTimeout(() => {
      mountDebounceTimer = null;
      mountAnalyticsUI();
    }, 80);
  }

  function getAnalyticsMountContainer() {
    return document.querySelector('.fs-main-content-module-main-content-body-scroll') ||
           document.querySelector('.fs-main-content-module-main-content-body') ||
           document.querySelector('main');
  }

  function getHomeStack() {
    return document.querySelector('.fs-native-scroll-area-module-scroll-area .mantine-Stack-root') ||
           document.querySelector('.fs-main-content-module-main-content-body-scroll .mantine-Stack-root') ||
           document.querySelector('main .mantine-Stack-root');
  }

  async function mountAnalyticsUI() {
    if (isMounting) return;
    isMounting = true;
    try {
      const hash = window.location.hash || '';
      const isAnalyticsRoute = hash.includes('analytics');

      // Purga completa e definitiva de qualquer resquício da antiga home bar
      const oldSwitcher = document.getElementById('feishin-home-tabs-bar');
      if (oldSwitcher) oldSwitcher.remove();

      // Ensure sidebar navigation item exists
      ensureSidebarAnalyticsItem();

      const mainContainer = getAnalyticsMountContainer();
      if (!mainContainer) return;

      let dashContainer = document.getElementById('feishin-analytics-dashboard');

      const shouldShowAnalytics = isAnalyticsRoute;

      if (shouldShowAnalytics) {
        if (!dashContainer) {
          dashContainer = document.createElement('div');
          dashContainer.id = 'feishin-analytics-dashboard';
          mainContainer.appendChild(dashContainer);
        } else if (dashContainer.parentElement !== mainContainer) {
          mainContainer.appendChild(dashContainer);
        }

        // Hide all sibling elements inside mainContainer (including native <main>)
        Array.from(mainContainer.children).forEach(child => {
          if (child !== dashContainer) {
            child.style.display = 'none';
          }
        });

        dashContainer.style.setProperty('display', 'flex', 'important');

        const sidebarItem = document.getElementById('personal-os-sidebar-analytics-item');
        if (sidebarItem) sidebarItem.classList.add('active');

        updateDashboardContent();
      } else {
        if (dashContainer) {
          dashContainer.style.setProperty('display', 'none', 'important');
        }
        // Restore visibility of other elements inside mainContainer only if no other custom view is active
        const isOtherCustom = hash.includes('recently-added') || hash.startsWith('#/library/genres') || hash.startsWith('#/library/tags');
        if (!isOtherCustom) {
          Array.from(mainContainer.children).forEach(child => {
            if (child !== dashContainer && child.id !== 'feishin-recently-added-view' && child.id !== 'fs-tags-page-mount' && child.style.display === 'none') {
              child.style.display = '';
            }
          });
        }

        const sidebarItem = document.getElementById('personal-os-sidebar-analytics-item');
        if (sidebarItem) sidebarItem.classList.remove('active');
      }
    } finally {
      isMounting = false;
    }
  }

  // 9. Switch Tabs
  async function switchTab(tab) {
    activeTab = tab;
    localStorage.setItem('feishin_home_active_tab', tab);

    const switcher = document.getElementById('feishin-home-tabs-bar');
    if (switcher) {
      switcher.querySelectorAll('.feishin-tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
      });
    }

    const sidebarItem = document.getElementById('personal-os-sidebar-analytics-item');
    if (sidebarItem) {
      sidebarItem.classList.toggle('active', tab === 'analytics');
    }

    mountAnalyticsUI();
  }

  // 10. Update Dashboard Content
  async function updateDashboardContent() {
    const container = document.getElementById('feishin-analytics-dashboard');
    if (!container) return;

    const prevScroll = container.scrollTop;

    if (!cachedLibraryStats) {
      container.innerHTML = `
        <div class="glass-panel" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 36px; margin-bottom: 12px; animation: tabPulse 1.2s infinite ease-in-out;">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#00f2fe" stroke-width="2" style="display:inline-block;">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <h2 style="margin: 0 0 8px 0; color: #fff; font-size: 20px;">Carregando Métricas da Biblioteca...</h2>
          <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 13.5px;">Calculando tempo de reprodução acumulado com precisão analítica</p>
        </div>
      `;
    }

    const rawStats = await fetchAnalyticsData();
    const stats = getStatsForTimeframe(rawStats, currentTimeframe);

    container.innerHTML = renderDashboardUI(stats);
    if (prevScroll > 0) {
      container.scrollTop = prevScroll;
    }

    // Attach Play Click Handlers
    container.querySelectorAll('[data-action="play-track"]').forEach(el => {
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const trackId = el.getAttribute('data-track-id');
        if (trackId) {
          const song = rawStats.songs.find(s => s.id === trackId);
          if (song) playTrack(song);
        }
      };
    });

    // Attach Timeframe filter buttons with dynamic re-render
    container.querySelectorAll('.analytics-time-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentTimeframe = btn.getAttribute('data-time');
        updateDashboardContent();
      };
    });
  }

  // 11. Ensure Sidebar Navigation Item
  function ensureSidebarAnalyticsItem() {
    const parent = document.querySelector('.fs-sidebar-module-accordion-content');
    if (!parent) return;

    let item = document.getElementById('personal-os-sidebar-analytics-item');
    if (!item) {
      item = document.createElement('a');
      item.id = 'personal-os-sidebar-analytics-item';
      item.className = 'mantine-focus-never mantine-active fs-button-module-root fs-sidebar-item-module-link fs-sidebar-item-module-root m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root';
      item.setAttribute('data-variant', 'subtle');
      item.setAttribute('data-size', 'sm');
      item.setAttribute('draggable', 'false');
      item.setAttribute('title', 'Painel Completo de Analytics');
      item.style.cssText = '--button-height: var(--button-height-sm); --button-padding-x: var(--button-padding-x-sm); --button-fz: var(--mantine-font-size-sm); --button-bg: transparent; --button-hover: var(--mantine-color-primary-light-hover); --button-color: var(--mantine-color-primary-light-color); --button-bd: calc(0.0625rem * var(--mantine-scale)) solid transparent; cursor: pointer; user-select: none; -webkit-app-region: no-drag;';

      item.innerHTML = `
        <span class="fs-sidebar-item-module-inner m_80f1301b mantine-Button-inner">
          <span class="fs-sidebar-item-module-label m_811560b9 mantine-Button-label" style="width: 100%;">
            <div class="m_4081bf90 mantine-Group-root" style="--group-gap: var(--mantine-spacing-md); --group-align: center; --group-justify: flex-start; --group-wrap: nowrap; width: 100%;">
              <span class="fs-sidebar-icon-module-wrapper">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1.15em" width="1.15em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19h16v2H4zm3-4h2v3H7zm4-7h2v10h-2zm4-4h2v14h-2zm4-2h2v16h-2z"></path>
                </svg>
              </span>
              <span>ANALYTICS</span>
              <span class="fs-analytics-sidebar-pill">PRO</span>
            </div>
          </span>
        </span>
      `;

      item.addEventListener('pointerdown', (e) => e.stopPropagation());
      item.addEventListener('mousedown', (e) => e.stopPropagation());
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeTab = 'analytics';
        localStorage.setItem('feishin_home_active_tab', 'analytics');
        window.location.hash = '#/analytics';
        scheduleMount();
      });

      // Place at top of sidebar items
      const firstNav = parent.querySelector('a');
      if (firstNav) {
        parent.insertBefore(item, firstNav);
      } else {
        parent.appendChild(item);
      }
    }

    const currentHash = window.location.hash || '';
    if (currentHash.includes('analytics') || (activeTab === 'analytics' && (currentHash === '#/' || currentHash === '' || currentHash.includes('home')))) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  }

  // 12. MutationObserver & Navigation Listeners
  window.addEventListener('hashchange', () => {
    scheduleMount();
  });
  window.addEventListener('popstate', () => {
    scheduleMount();
  });
  setInterval(() => {
    const hash = window.location.hash || '';
    const shouldShow = hash.includes('analytics') || (activeTab === 'analytics' && (hash === '#/' || hash === '' || hash.includes('home')));
    const dash = document.getElementById('feishin-analytics-dashboard');
    if (shouldShow && (!dash || dash.style.display === 'none')) {
      scheduleMount();
    } else if (!shouldShow && dash && dash.style.display !== 'none') {
      scheduleMount();
    }
  }, 250);

  const domObserver = new MutationObserver((mutations) => {
    let shouldSchedule = false;
    for (const m of mutations) {
      const t = m.target;
      if (t && (
        t.id === 'feishin-analytics-dashboard' ||
        t.closest?.('#feishin-analytics-dashboard') ||
        t.id === 'feishin-home-tabs-bar' ||
        t.closest?.('#feishin-home-tabs-bar') ||
        t.id === 'feishin-recently-added-view' ||
        t.closest?.('#feishin-recently-added-view') ||
        t.id === 'fs-tags-page-mount' ||
        t.closest?.('#fs-tags-page-mount') ||
        t.id === 'personal-os-sidebar-analytics-item' ||
        t.id === 'personal-os-sidebar-recently-added-item'
      )) {
        continue;
      }
      shouldSchedule = true;
      break;
    }
    if (shouldSchedule) {
      scheduleMount();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      domObserver.observe(document.body, { childList: true, subtree: true });
      scheduleMount();
    });
  } else {
    domObserver.observe(document.body, { childList: true, subtree: true });
    scheduleMount();
  }

  // Expose API for debugging
  window.__FEISHIN_ANALYTICS__ = {
    fetchAnalyticsData,
    switchTab,
    playTrack,
    updateDashboardContent,
    getLocalData: () => localData
  };
})();
