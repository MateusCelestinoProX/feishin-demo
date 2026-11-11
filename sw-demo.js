/* Feishin Demo Service Worker: Network-Level Subsonic Virtual Proxy */
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

const SONG_FILES = [
    "01_14_Bis_Planeta_Sonho.mp3",
    "02_J__Cole_03__Adolescence.mp3",
    "03_Beach_House_Somewhere_Tonight.mp3",
    "04_Bonnie_Tyler_Total_Eclipse_of_the_Heart__Single_.mp3",
    "05_Slowdive_Altogether.mp3",
    "06_Activa_Daydreaming.mp3",
    "07_parbrigd_pg_mine_C_LICE_Chico_Buarque_y_Milton_Nasci.mp3",
    "08___uicideboy__That_Just_Isn_t_Empirically_Possibl.mp3",
    "09_Gregorian__Moment_of_Peace.mp3",
    "10_Slo__Twilight___Tazzy_After_Dark_x_Sweater_Weather_-_Slow.mp3",
    "11_Elza_Soares___Pitty_Na_Pele.mp3",
    "12_Caetano_Veloso_L_ngua.mp3",
    "13_Kanye_West_Flashing_Lights.mp3",
    "14_Charlie_Brown_Jr__Dias_de_Luta__Dias_de_Gloria.mp3",
    "15_Lana_Del_Rey_Born_to_Die.mp3"
];

const EXACT_ID_TO_INDEX = {
    "demo_song_1": 1, "demo_cover_1": 1, "alb_planeta_sonho": 1, "art_14_bis": 1, "1": 1,
    "demo_song_2": 2, "demo_cover_2": 2, "alb_03__adolescence": 2, "art_j__cole": 2, "2": 2,
    "demo_song_3": 3, "demo_cover_3": 3, "alb_somewhere_tonight": 3, "art_beach_house": 3, "3": 3,
    "demo_song_4": 4, "demo_cover_4": 4, "alb_total_eclipse_of_the": 4, "art_bonnie_tyler": 4, "4": 4,
    "demo_song_5": 5, "demo_cover_5": 5, "alb_altogether": 5, "art_slowdive": 5, "5": 5,
    "demo_song_6": 6, "demo_cover_6": 6, "alb_activa___daydreaming": 6, "art_activa": 6, "6": 6,
    "demo_song_7": 7, "demo_cover_7": 7, "alb_c_lice_chico_buarque": 7, "art_parbrigd_pg_mine": 7, "7": 7,
    "demo_song_8": 8, "demo_cover_8": 8, "alb_that_just_isn_t_empi": 8, "art__uicideboy_": 8, "8": 8,
    "demo_song_9": 9, "demo_cover_9": 9, "alb_gregorian": 9, "art_gregorian": 9, "9": 9,
    "demo_song_10": 10, "demo_cover_10": 10, "alb_after_dark_x_sweater": 10, "art_slo__twilight___tazz": 10, "10": 10,
    "demo_song_11": 11, "demo_cover_11": 11, "alb_na_pele": 11, "art_elza_soares___pitty": 11, "11": 11,
    "demo_song_12": 12, "demo_cover_12": 12, "alb_l_ngua": 12, "art_caetano_veloso": 12, "12": 12,
    "demo_song_13": 13, "demo_cover_13": 13, "alb_graduation_exclusive": 13, "art_kanye_west": 13, "13": 13,
    "demo_song_14": 14, "demo_cover_14": 14, "alb_charlie_brown_jr____": 14, "art_charlie_brown_jr_": 14, "14": 14,
    "demo_song_15": 15, "demo_cover_15": 15, "alb_born_to_die": 15, "art_lana_del_rey": 15, "15": 15
};

function resolveTrackIndex(rawId) {
    const id = decodeURIComponent(rawId || '');
    if (EXACT_ID_TO_INDEX[id]) return EXACT_ID_TO_INDEX[id];
    const m = id.match(/(?:demo_song_|demo_cover_)(\d+)/);
    const num = m ? parseInt(m[1], 10) : 1;
    return (num >= 1 && num <= 15) ? num : 1;
}

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. Intercept stream.view -> serve local MP3 (preserving headers such as Range)
    if (url.includes('/rest/stream.view')) {
        const m = url.match(/id=([^&]+)/);
        const trackNum = resolveTrackIndex(m ? m[1] : '');
        const targetFile = './media/songs/' + SONG_FILES[trackNum - 1];
        const rangeHeader = event.request.headers.get('Range');
        const reqInit = rangeHeader ? { headers: { Range: rangeHeader } } : undefined;
        event.respondWith(fetch(targetFile, reqInit));
        return;
    }

    // 2. Intercept getCoverArt.view -> serve local JPG
    if (url.includes('/rest/getCoverArt.view')) {
        const m = url.match(/id=([^&]+)/);
        const coverNum = resolveTrackIndex(m ? m[1] : '');
        const targetCover = `./media/covers/cover_${coverNum < 10 ? '0' + coverNum : coverNum}.jpg`;
        event.respondWith(fetch(targetCover));
        return;
    }

    // 3. Fallback mock for any unhooked /api/engine/ request (non-SSE)
    if (url.includes('/api/engine/') && !url.includes('/api/engine/events')) {
        event.respondWith(new Response(JSON.stringify({ success: true, ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
});
