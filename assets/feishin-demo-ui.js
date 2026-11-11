/* ==========================================================================
   FEISHIN DEMO UI ORCHESTRATOR
   Splash Screen Reveal + Glassmorphism APK Modal + Dual Instance Switcher
   ========================================================================== */
(function() {
    'use strict';

    // 1. Register Service Worker for seamless range-streaming & artwork cache
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw-demo.js', { scope: './' })
            .then(reg => console.info('[Demo SW] Registered with scope:', reg.scope))
            .catch(err => console.debug('[Demo SW] Notice:', err.message));
    }

    // 2. Build Splash Screen DOM
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
                <div class="splash-subtitle">Portfolio Demo • Audiophile Suite</div>
                <div class="splash-progress-track">
                    <div class="splash-progress-bar" id="splash-bar"></div>
                </div>
                <div class="splash-status-text" id="splash-status">Sintetizando motor Subsonic...</div>
            </div>
        `;
        document.body.appendChild(splash);

        // Progress milestones
        const bar = document.getElementById('splash-bar');
        const status = document.getElementById('splash-status');

        const steps = [
            { p: 25, msg: "Injetando catálogo de 15 faixas masterizadas..." },
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
                setTimeout(revealApp, 400);
            }
        }, 320);

        function revealApp() {
            splash.classList.add('splash-exit');
            const root = document.getElementById('root');
            if (root) root.classList.add('app-revealed');
            setTimeout(() => {
                splash.remove();
                checkApkPromptAuto();
            }, 800);
        }
    }

    // 3. Build Top Bar & Controls
    function createTopBar() {
        const bar = document.createElement('div');
        bar.id = 'feishin-demo-top-bar';
        bar.innerHTML = `
            <div class="demo-glass-badge" id="btn-open-apk-modal" title="Baixar APK Mobile Nativo">
                <span class="demo-badge-dot"></span>
                <span>📱 Baixar APK Android</span>
            </div>
            <div class="demo-mode-toggle">
                <button class="demo-mode-btn active" data-mode="auto" id="btn-mode-auto">Auto</button>
                <button class="demo-mode-btn" data-mode="desktop" id="btn-mode-desktop">Desktop</button>
                <button class="demo-mode-btn" data-mode="mobile" id="btn-mode-mobile">Mobile</button>
            </div>
        `;
        document.body.appendChild(bar);

        // Mode Switching
        const btnAuto = document.getElementById('btn-mode-auto');
        const btnDesk = document.getElementById('btn-mode-desktop');
        const btnMob = document.getElementById('btn-mode-mobile');
        const allBtns = [btnAuto, btnDesk, btnMob];

        function setMode(mode) {
            allBtns.forEach(b => b.classList.remove('active'));
            document.body.classList.remove('demo-mode-desktop', 'demo-mode-mobile');

            if (mode === 'desktop') {
                btnDesk.classList.add('active');
                document.body.classList.add('demo-mode-desktop');
                localStorage.setItem('feishin_demo_view_mode', 'desktop');
            } else if (mode === 'mobile') {
                btnMob.classList.add('active');
                document.body.classList.add('demo-mode-mobile');
                localStorage.setItem('feishin_demo_view_mode', 'mobile');
            } else {
                btnAuto.classList.add('active');
                localStorage.removeItem('feishin_demo_view_mode');
                applyAutoMode();
            }
        }

        btnAuto.onclick = () => setMode('auto');
        btnDesk.onclick = () => setMode('desktop');
        btnMob.onclick = () => setMode('mobile');

        // Restore saved mode or auto
        const savedMode = localStorage.getItem('feishin_demo_view_mode');
        if (savedMode) setMode(savedMode);
        else applyAutoMode();

        window.addEventListener('resize', () => {
            if (!localStorage.getItem('feishin_demo_view_mode')) {
                applyAutoMode();
            }
        });

        document.getElementById('btn-open-apk-modal').onclick = () => openApkModal();
    }

    function applyAutoMode() {
        const isMobileDevice = window.innerWidth <= 768 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
        if (isMobileDevice) {
            document.body.classList.remove('demo-mode-desktop');
            document.body.classList.add('demo-mode-mobile');
        } else {
            document.body.classList.remove('demo-mode-mobile');
            document.body.classList.add('demo-mode-desktop');
        }
    }

    // 4. Build Glassmorphism Modal ("Popup de Vidro")
    function createApkModal() {
        const modal = document.createElement('div');
        modal.id = 'feishin-demo-apk-modal';
        modal.innerHTML = `
            <div class="apk-glass-card">
                <div class="apk-card-glow"></div>
                <div class="apk-icon-box">
                    <svg viewBox="0 0 24 24">
                        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.89 3.27C15.01 8.35 13.56 8 12 8s-3.01.35-4.46.94L5.65 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C3.76 11.08 2 13.82 2 17h20c0-3.18-1.76-5.92-4.4-7.52zM7 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm10 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                </div>
                <h2 class="apk-title">Testar App Nativo Android?</h2>
                <p class="apk-desc">
                    Este software possui uma versão mobile nativa compilada em APK com reprodução de áudio em background, suporte a atalhos na central de notificações e shaders acelerados por hardware.
                </p>
                <div class="apk-chips-row">
                    <span class="apk-chip">🚀 APK Nativo (13 MB)</span>
                    <span class="apk-chip">✨ Shaders WebGL 60FPS</span>
                    <span class="apk-chip">🎧 Sem Internet / Offline</span>
                </div>
                <div class="apk-actions-col">
                    <a href="./apk/feishin-mobile-pro.apk" download="feishin-mobile-pro.apk" class="btn-apk-download" id="btn-download-action">
                        <span>📲 Baixar Feishin Mobile Pro APK (13 MB)</span>
                    </a>
                    <a href="./apk/feishin-media-sync-pro-release.apk" download="feishin-media-sync-pro-release.apk" class="btn-apk-download" style="background: linear-gradient(135deg, #2563eb, #7c3aed);" id="btn-download-sync-action">
                        <span>⚡ Baixar Feishin Media Sync Pro APK (5.4 MB)</span>
                    </a>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.65); padding: 4px 6px; line-height: 1.4;">
                        ℹ️ <strong>Feishin Media Sync Pro</strong> é concebido exclusivamente como aplicativo nativo Android (APK), gerenciando sincronização tri-direcional e 1 GB de RAM física travada.
                    </div>
                    <button class="btn-modal-dismiss" id="btn-dismiss-modal">
                        Continuar na Versão Web
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-dismiss-modal').onclick = closeApkModal;
        document.getElementById('btn-download-action').onclick = () => {
            setTimeout(closeApkModal, 800);
        };
        const syncActionBtn = document.getElementById('btn-download-sync-action');
        if (syncActionBtn) {
            syncActionBtn.onclick = () => {
                setTimeout(closeApkModal, 800);
            };
        }
        modal.onclick = (e) => {
            if (e.target === modal) closeApkModal();
        };
    }

    function openApkModal() {
        const modal = document.getElementById('feishin-demo-apk-modal');
        if (modal) modal.classList.add('modal-open');
    }

    function closeApkModal() {
        const modal = document.getElementById('feishin-demo-apk-modal');
        if (modal) modal.classList.remove('modal-open');
        sessionStorage.setItem('feishin_apk_prompt_shown', 'true');
    }

    function checkApkPromptAuto() {
        // Automatically show glass modal on first visit after 2 seconds
        if (!sessionStorage.getItem('feishin_apk_prompt_shown')) {
            setTimeout(() => {
                openApkModal();
            }, 1800);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createSplashScreen();
            createTopBar();
            createApkModal();
        });
    } else {
        createSplashScreen();
        createTopBar();
        createApkModal();
    }
})();
