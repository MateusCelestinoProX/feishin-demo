/* Feishin Demo Service Worker: Network-Level Subsonic Virtual Proxy */
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. Intercept stream.view -> serve local MP3
    if (url.includes('/rest/stream.view')) {
        const m = url.match(/id=([^&]+)/);
        const songId = m ? m[1] : '';
        const numMatch = songId.match(/\d+/);
        let trackNum = numMatch ? parseInt(numMatch[0], 10) : 1;
        if (trackNum < 1 || trackNum > 15) trackNum = 1;

        // Map to exact song files
        const songFiles = [
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
        const targetFile = './media/songs/' + songFiles[trackNum - 1];
        event.respondWith(fetch(targetFile));
        return;
    }

    // 2. Intercept getCoverArt.view -> serve local JPG
    if (url.includes('/rest/getCoverArt.view')) {
        const m = url.match(/id=([^&]+)/);
        const coverId = m ? m[1] : '';
        const numMatch = coverId.match(/\d+/);
        let coverNum = numMatch ? parseInt(numMatch[0], 10) : 1;
        if (coverNum < 1 || coverNum > 15) coverNum = 1;

        const targetCover = `./media/covers/cover_${coverNum < 10 ? '0' + coverNum : coverNum}.jpg`;
        event.respondWith(fetch(targetCover));
        return;
    }
});
