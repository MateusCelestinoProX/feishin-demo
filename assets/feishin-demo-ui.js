/* ==========================================================================
   FEISHIN WEB DEMO — DESKTOP MACOS EXPERIENCE ORCHESTRATOR
   Splash Screen Reveal + Web Service Worker Pipeline
   ========================================================================== */
(function() {
    'use strict';

    // 1. Register Service Worker for seamless range-streaming & artwork cache
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw-demo.js', { scope: './' })
            .then(reg => console.info('[Demo SW] Registered with scope:', reg.scope))
            .catch(err => console.debug('[Demo SW] Notice:', err.message));
    }

    // 2. Build Authentic Desktop macOS Splash Screen
    function createSplashScreen() {
        const splash = document.createElement('div');
        splash.id = 'feishin-demo-splash';
        splash.innerHTML = `
            <div class="splash-ambient-glow"></div>
            <div class="splash-content">
                <div class="splash-logo-wrap">
                    <div class="splash-logo-ring"></div>
                    <div class="splash-logo-box">
                        <svg viewBox="0 0 1024 1024">
                            <path d="M 512 290.8 C 497.8 290.8 484.9 296.6 475.5 305.9 L 133.9 646.9 C 124.7 656.2 119 668.9 119 683 C 119 711.2 141.8 734 170 734 C 184.1 734 196.8 728.3 206.1 719 L 413.9 511.9 A 103 103 0 0 1 409 480.6 A 103 103 0 0 1 512 377.6 A 103 103 0 0 1 615 480.6 A 103 103 0 0 1 610.1 511.9 L 817.9 719.1 C 827.2 728.3 839.9 734 854 734 C 882.2 734 905 711.2 905 683 C 905 668.9 899.3 656.2 890.1 646.9 L 548.5 305.9 C 539.1 296.6 526.2 290.8 512 290.8 Z"/>
                            <circle cx="512" cy="480.62" r="43"/>
                        </svg>
                    </div>
                </div>
                <h1 class="splash-title">Feishin</h1>
                <div class="splash-subtitle">macOS Native Client • Web Edition</div>
                <div class="splash-progress-track">
                    <div class="splash-progress-bar" id="splash-bar"></div>
                </div>
                <div class="splash-status-text" id="splash-status">Inicializando subsistema de áudio...</div>
            </div>
        `;
        document.body.appendChild(splash);

        const bar = document.getElementById('splash-bar');
        const status = document.getElementById('splash-status');

        const steps = [
            { p: 25, msg: "Carregando catálogo de faixas masterizadas..." },
            { p: 55, msg: "Inicializando decodificadores de áudio..." },
            { p: 80, msg: "Configurando pipeline de shaders WebGL..." },
            { p: 100, msg: "Interface pronta. Carregando..." }
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < steps.length) {
                if (bar) bar.style.width = steps[i].p + '%';
                if (status) status.textContent = steps[i].msg;
                i++;
            } else {
                clearInterval(interval);
                setTimeout(revealApp, 350);
            }
        }, 250);

        function revealApp() {
            splash.classList.add('splash-exit');
            const root = document.getElementById('root');
            if (root) root.classList.add('app-revealed');
            setTimeout(() => {
                splash.remove();
            }, 750);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSplashScreen);
    } else {
        createSplashScreen();
    }
})();
