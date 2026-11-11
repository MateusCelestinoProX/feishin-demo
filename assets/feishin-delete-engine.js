/**
 * ==========================================================================
 * FEISHIN VPS MUSIC ENGINE — MOTOR DE EXCLUSÃO DEFINITIVA & SINCRONIZAÇÃO SSE
 * ==========================================================================
 * - Exclui músicas permanentemente do servidor VPS (filesystem + SQLite + Navidrome)
 * - Sincronização em tempo real entre todos os clientes (macOS Desktop e Android Mobile)
 * - Menu de contexto contextual com item "Deletar Música" estilizado em vermelho
 * - Confirmação com modal Liquid Glass e haptic feedback
 */

(function () {
    console.log('[FeishinDeleteEngine] Inicializando motor de exclusão e sincronização...');

    let lastTargetRow = null;

    // 1. Toast Visual Liquid Glass
    function showGlassToast(title, message, isError = false) {
        const existing = document.getElementById('feishin-delete-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'feishin-delete-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(18, 18, 28, 0.88);
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            border: 1px solid ${isError ? 'rgba(255, 77, 79, 0.4)' : 'rgba(255, 255, 255, 0.15)'};
            border-radius: 16px;
            padding: 12px 20px;
            color: #ffffff;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px ${isError ? 'rgba(255, 77, 79, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
            z-index: 100000;
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            max-width: 90vw;
        `;

        const iconSvg = isError
            ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff4d4f" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
            : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#52c41a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

        toast.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg}</div>
            <div style="display:flex;flex-direction:column;gap:2px;">
                <div style="font-weight:600;font-size:13px;letter-spacing:-0.2px;">${title}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.75);">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(15px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // 2. Modal de Confirmação Liquid Glass
    function openConfirmModal(song, onConfirm) {
        if (window.AndroidBridge?.hapticFeedback) {
            window.AndroidBridge.hapticFeedback(0);
        } else if (window.AndroidBridge?.vibrate) {
            window.AndroidBridge.vibrate(30);
        }

        const existing = document.getElementById('feishin-delete-modal-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'feishin-delete-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            transition: opacity 0.25s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: rgba(26, 26, 38, 0.95);
            border: 1px solid rgba(255, 77, 79, 0.35);
            border-radius: 24px;
            padding: 28px 24px 22px 24px;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 77, 79, 0.15);
            transform: scale(0.92);
            transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        `;

        modal.innerHTML = `
            <div style="
                width: 58px;
                height: 58px;
                border-radius: 18px;
                background: linear-gradient(135deg, rgba(255, 77, 79, 0.25), rgba(255, 77, 79, 0.08));
                border: 1px solid rgba(255, 77, 79, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
                box-shadow: 0 8px 20px rgba(255, 77, 79, 0.25);
            ">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ff4d4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.3px; color: #fff;">
                Deletar Música do Sistema?
            </h2>
            <div style="font-size: 14px; font-weight: 600; color: #ff7875; margin-bottom: 6px; word-break: break-word; line-height: 1.4;">
                ${song.title || 'Esta música'}
            </div>
            ${song.artist ? `<div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 16px;">${song.artist}</div>` : '<div style="margin-bottom: 16px;"></div>'}
            <p style="font-size: 12.5px; line-height: 1.5; color: rgba(255, 255, 255, 0.72); margin: 0 0 24px 0;">
                O arquivo de áudio será <strong style="color: #fff;">excluído definitivamente do servidor VPS</strong> (Navidrome).
                A música desaparecerá automaticamente de <strong>todos os seus dispositivos</strong> (macOS Desktop e Android).
            </p>
            <div style="display: flex; gap: 12px; width: 100%;">
                <button id="feishin-modal-cancel" style="
                    flex: 1;
                    padding: 12px 16px;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #fff;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">Cancelar</button>
                <button id="feishin-modal-confirm" style="
                    flex: 1.2;
                    padding: 12px 16px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #ff4d4f 0%, #d9363e 100%);
                    border: 1px solid rgba(255, 77, 79, 0.6);
                    color: #fff;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(255, 77, 79, 0.35);
                    transition: all 0.2s;
                ">Excluir Definitivamente</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        const closeModal = () => {
            backdrop.style.opacity = '0';
            modal.style.transform = 'scale(0.92)';
            setTimeout(() => backdrop.remove(), 260);
        };

        modal.querySelector('#feishin-modal-cancel').onclick = closeModal;
        backdrop.onclick = (e) => {
            if (e.target === backdrop) closeModal();
        };

        const confirmBtn = modal.querySelector('#feishin-modal-confirm');
        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerText = 'Excluindo...';
            confirmBtn.style.opacity = '0.7';
            try {
                await onConfirm();
                closeModal();
            } catch (err) {
                confirmBtn.disabled = false;
                confirmBtn.innerText = 'Tentar Novamente';
                confirmBtn.style.opacity = '1';
            }
        };
    }

    // 3. Execução da Exclusão no VPS Music Engine
    async function executeDelete(song) {
        if (!song || !song.id) {
            throw new Error('Identificador da música inválido');
        }

        const serverUrl = window.__FEISHIN_AUTH_STORE__?.getState?.()?.currentServer?.url || window.location.origin;
        const endpoint = `${serverUrl.replace(/\/$/, '')}/api/engine/delete-track`;

        console.log(`[FeishinDeleteEngine] Solicitando exclusão da faixa ${song.id} (${song.title}) em ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                songId: song.id,
                songTitle: song.title,
                songPath: song.path
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Erro HTTP ${response.status} na exclusão`);
        }

        const result = await response.json();
        console.log('[FeishinDeleteEngine] Resposta do motor VPS:', result);

        // Feedback sonoro/háptico
        if (window.AndroidBridge?.hapticFeedback) {
            window.AndroidBridge.hapticFeedback(0);
        } else if (window.AndroidBridge?.vibrate) {
            window.AndroidBridge.vibrate(50);
        }

        // Animar e remover linhas da tela imediatamente
        purgeSongFromUI(song.id, song.title);

        showGlassToast(
            'Música Excluída',
            `"${song.title || 'Faixa'}" foi apagada do servidor VPS e sairá de todos os clientes.`
        );

        return result;
    }

    // 4. Purgar faixa da UI local (tabelas, fila e player)
    function purgeSongFromUI(songId, songTitle) {
        const titleLower = (songTitle || '').toLowerCase().trim();

        // 1. Remover elementos visíveis da tabela e da aba de recentes
        document.querySelectorAll('[data-row-index], .ra-item-row, .ra-tracklist-row, .fs-item-table-list-column-module-data-row').forEach(row => {
            const text = (row.innerText || '').toLowerCase();
            const rowSongId = row.getAttribute('data-song-id') || row.getAttribute('data-id');
            const isMatch = (songId && rowSongId === songId) ||
                            (titleLower.length > 2 && text.includes(titleLower));
            if (isMatch) {
                row.style.transition = 'all 0.3s ease-out';
                row.style.opacity = '0';
                row.style.transform = 'scaleY(0)';
                row.style.maxHeight = '0px';
                setTimeout(() => row.remove(), 320);
            }
        });

        // 1.1 Notificar motor de Recentemente Adicionadas se ativo
        try {
            window.__FEISHIN_RECENTLY_ADDED__?.removeSong?.(songId, songTitle);
        } catch (e) {}

        // 2. Parar reprodução se for a faixa atual
        try {
            const playerStore = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            if (playerStore) {
                const cur = playerStore.getCurrentSong?.();
                if (cur && (cur.id === songId || (titleLower.length > 2 && (cur.name || cur.title || '').toLowerCase().includes(titleLower)))) {
                    playerStore.mediaNext?.();
                }
                if (cur && cur.id === songId) {
                    playerStore.clearSelected?.([cur]);
                }
            }
        } catch (e) {
            console.warn('[FeishinDeleteEngine] Nota ao atualizar playerStore:', e);
        }

        // 3. Fechar FeishinTrackPage se estiver exibindo a faixa apagada
        if (window.FeishinTrackPage?.isOpen) {
            const currentTitle = document.getElementById('feishin-tp-title')?.innerText || '';
            if (titleLower.length > 2 && currentTitle.toLowerCase().includes(titleLower)) {
                window.FeishinTrackPage.close();
            }
        }
    }

    // 5. Interceptador e Injetor do Menu de Contexto
    // Rastreia a última linha tocada/clicada para saber exatamente qual música foi alvo
    document.addEventListener('contextmenu', (e) => {
        const row = e.target.closest('[data-row-index], .ra-item-row, .fs-item-table-list-column-module-data-row, [role="row"]');
        if (row) {
            lastTargetRow = row;
        }
    }, true);

    // 4.1 Injetar Estilos de Centralização Obrigatória da Caixa de Opções (macOS & Android)
    function injectCenterMenuStyles() {
        if (document.getElementById('feishin-centered-menu-styles')) return;
        const style = document.createElement('style');
        style.id = 'feishin-centered-menu-styles';
        style.textContent = `
            /* Sempre centralizar caixa de opções de contexto em qualquer resolução (macOS & Android) */
            [data-radix-popper-content-wrapper]:has(> [role="menu"]:not([aria-labelledby])),
            [data-radix-popper-content-wrapper]:has(> [data-feishin-context-menu="main"]),
            [data-feishin-menu-wrapper="main"] {
                position: fixed !important;
                left: 50% !important;
                top: 50% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 100000 !important;
                max-height: 90vh !important;
                max-width: 90vw !important;
            }

            [data-radix-popper-content-wrapper]:has(> [role="menu"]:not([aria-labelledby])) > [role="menu"],
            [data-radix-popper-content-wrapper]:has(> [data-feishin-context-menu="main"]) > [role="menu"],
            [data-feishin-menu-wrapper="main"] > [role="menu"] {
                display: flex !important;
                flex-direction: column !important;
                max-height: min(38rem, 84vh) !important;
                width: min(20rem, 86vw) !important;
                min-width: 16rem !important;
                overflow: hidden !important;
                box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
                border-radius: 20px !important;
                backdrop-filter: blur(28px) saturate(190%) !important;
                -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
                animation: feishinMenuCenterPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }

            [data-feishin-menu-wrapper="main"] .fs-scroll-area-module-scroll-area,
            [data-radix-popper-content-wrapper]:has(> [role="menu"]:not([aria-labelledby])) .fs-scroll-area-module-scroll-area {
                flex: 1 1 auto !important;
                min-height: 0 !important;
                overflow-y: auto !important;
            }

            [data-feishin-menu-wrapper="main"] .fs-context-menu-preview-module-container,
            [data-radix-popper-content-wrapper]:has(> [role="menu"]:not([aria-labelledby])) .fs-context-menu-preview-module-container {
                flex-shrink: 0 !important;
                margin-top: auto !important;
                border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
                background: rgba(255, 255, 255, 0.03) !important;
            }

            .feishin-delete-menu-item:hover,
            .feishin-delete-menu-item[data-highlighted] {
                background: rgba(255, 77, 79, 0.16) !important;
            }

            @keyframes feishinMenuCenterPop {
                from { opacity: 0; transform: scale(0.94); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    injectCenterMenuStyles();

    // Observar abertura de menus Radix na página
    const menuObserver = new MutationObserver(() => {
        const activeMenus = document.querySelectorAll('[role="menu"], [data-radix-menu-content], .fs-context-menu-module-content');
        if (activeMenus.length === 0) {
            // Remover backdrop se nenhum menu estiver ativo
            const existingBackdrop = document.getElementById('feishin-context-backdrop');
            if (existingBackdrop) {
                existingBackdrop.style.opacity = '0';
                setTimeout(() => existingBackdrop.remove(), 200);
            }
            return;
        }

        // Centralizar o menu principal e exibir backdrop
        for (const menu of activeMenus) {
            const isSubmenu = menu.hasAttribute('aria-labelledby') || menu.dataset.feishinContextMenu === 'sub';
            if (!isSubmenu) {
                const rawWrapper = menu.closest('[data-radix-popper-content-wrapper]') || menu.parentElement;
                const wrapper = (rawWrapper && rawWrapper !== document.body && rawWrapper !== document.documentElement) ? rawWrapper : null;
                if (wrapper) {
                    wrapper.setAttribute('data-feishin-menu-wrapper', 'main');
                    wrapper.style.setProperty('position', 'fixed', 'important');
                    wrapper.style.setProperty('left', '50%', 'important');
                    wrapper.style.setProperty('top', '50%', 'important');
                    wrapper.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
                    wrapper.style.setProperty('z-index', '100000', 'important');
                }

                menu.style.setProperty('display', 'flex', 'important');
                menu.style.setProperty('flex-direction', 'column', 'important');
                menu.style.setProperty('overflow', 'hidden', 'important');

                let backdrop = document.getElementById('feishin-context-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.id = 'feishin-context-backdrop';
                    backdrop.style.cssText = `
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.52);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        z-index: 99998;
                        opacity: 0;
                        transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                        pointer-events: auto;
                    `;
                    backdrop.onclick = (e) => {
                        e.stopPropagation();
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                        backdrop.style.opacity = '0';
                        setTimeout(() => backdrop.remove(), 200);
                    };
                    document.body.appendChild(backdrop);
                    requestAnimationFrame(() => { backdrop.style.opacity = '1'; });
                }
            }
        }

        activeMenus.forEach(menuContent => {
            if (menuContent.dataset.deleteEngineInjected === 'true') return;
            if (menuContent.querySelector('.feishin-delete-menu-item, [data-action="delete-song"]')) {
                menuContent.dataset.deleteEngineInjected = 'true';
                return;
            }

            // Verificar se é um menu de música (contém itens como "Tocar", "Adicionar à playlist", "Informações")
            const menuText = menuContent.innerText.toLowerCase();
            const isSongMenu = menuText.includes('tocar') || menuText.includes('play') ||
                               menuText.includes('playlist') || menuText.includes('informações') ||
                               menuText.includes('baixar');

            if (!isSongMenu) return;

            menuContent.dataset.deleteEngineInjected = 'true';

            // Criar divisor nativo
            const divider = document.createElement('div');
            divider.className = 'fs-context-menu-module-divider feishin-delete-menu-divider';
            divider.setAttribute('role', 'separator');

            // Criar item nativo "Deletar Música"
            const deleteItem = document.createElement('div');
            deleteItem.className = 'fs-context-menu-module-item fs-context-menu-module-has-left-icon feishin-delete-menu-item';
            deleteItem.setAttribute('role', 'menuitem');
            deleteItem.setAttribute('tabindex', '-1');
            deleteItem.setAttribute('data-orientation', 'vertical');
            deleteItem.setAttribute('data-radix-collection-item', '');
            deleteItem.style.cssText = `
                color: #ff4d4f !important;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s ease;
            `;

            deleteItem.innerHTML = `
                <svg stroke="#ff4d4f" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="fs-context-menu-module-left-icon fs-icon-module-fill fs-icon-module-size-md" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span>Deletar Música</span>
            `;

            deleteItem.onmouseenter = () => {
                deleteItem.style.background = 'rgba(255, 77, 79, 0.16)';
            };
            deleteItem.onmouseleave = () => {
                deleteItem.style.background = 'transparent';
            };

            deleteItem.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Fechar menu de contexto e backdrop
                menuContent.remove();
                const existingBackdrop = document.getElementById('feishin-context-backdrop');
                if (existingBackdrop) existingBackdrop.remove();

                // Descobrir qual música foi selecionada
                let songToTarget = null;

                if (lastTargetRow) {
                    const titleEl = lastTargetRow.querySelector('.fs-title-column-module-title, .ra-row-title, [class*="title"], a');
                    const artistEl = lastTargetRow.querySelector('.fs-artist-column-module-artist, .ra-row-artist, [class*="artist"]');
                    const rowText = lastTargetRow.innerText.split('\n').filter(Boolean);
                    
                    const title = titleEl ? titleEl.innerText.trim() : (rowText[1] || rowText[0] || 'Faixa Selecionada');
                    const artist = artistEl ? artistEl.innerText.trim() : (rowText[2] || '');

                    // Tentar obter ID a partir da fila ou store
                    const playerStore = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                    const queue = playerStore?.queue?.items || [];
                    const foundInQueue = queue.find(q => (q.title || q.name || '').toLowerCase().trim() === title.toLowerCase().trim());

                    songToTarget = {
                        id: foundInQueue ? foundInQueue.id : (lastTargetRow.getAttribute('data-song-id') || lastTargetRow.getAttribute('data-id') || ''),
                        title: title,
                        artist: artist
                    };
                }

                // Fallback para música em reprodução
                if (!songToTarget || !songToTarget.title) {
                    const cur = window.__FEISHIN_PLAYER_STORE__?.getState?.()?.getCurrentSong?.();
                    if (cur) {
                        songToTarget = {
                            id: cur.id,
                            title: cur.title || cur.name || 'Faixa Atual',
                            artist: cur.artistName || cur.artist || '',
                            path: cur.path
                        };
                    }
                }

                if (!songToTarget) {
                    showGlassToast('Erro', 'Não foi possível identificar a música a ser excluída.', true);
                    return;
                }

                // Se ainda não temos o ID exato da música (por exemplo, ao clicar na tabela pura),
                // buscamos no banco local ou Navidrome pelo título
                if (!songToTarget.id) {
                    const cur = window.__FEISHIN_PLAYER_STORE__?.getState?.()?.getCurrentSong?.();
                    if (cur && (cur.title || cur.name || '').toLowerCase().trim() === songToTarget.title.toLowerCase().trim()) {
                        songToTarget.id = cur.id;
                        songToTarget.path = cur.path;
                    }
                }

                // Abrir modal de confirmação
                openConfirmModal(songToTarget, async () => {
                    // Se ainda faltar ID, usar busca no servidor VPS
                    if (!songToTarget.id) {
                        const serverUrl = window.__FEISHIN_AUTH_STORE__?.getState?.()?.currentServer?.url || window.location.origin;
                        const searchRes = await fetch(`${serverUrl.replace(/\/$/, '')}/rest/search3.view?query=${encodeURIComponent(songToTarget.title)}&songCount=5&f=json&u=PortfolioGuest&p=demo123&v=1.16.1&c=feishin-demo&f=json&v=1.16.1&c=feishin-engine`);
                        const searchData = await searchRes.json();
                        const songs = searchData?.['subsonic-response']?.searchResult3?.song || [];
                        const exact = songs.find(s => (s.title || '').toLowerCase().trim() === songToTarget.title.toLowerCase().trim()) || songs[0];
                        if (exact) {
                            songToTarget.id = exact.id;
                            songToTarget.path = exact.path;
                        }
                    }

                    if (!songToTarget.id) {
                        throw new Error('Música não localizada no catálogo do servidor.');
                    }

                    await executeDelete(songToTarget);
                });
            };

            // Inserir de forma nativa e cirúrgica dentro do scrollArea antes dos scrollbars ou antes do preview footer
            const scrollArea = menuContent.querySelector('.fs-scroll-area-module-scroll-area');
            const previewContainer = menuContent.querySelector('.fs-context-menu-preview-module-container');

            if (scrollArea) {
                const scrollbar = scrollArea.querySelector('.os-scrollbar');
                if (scrollbar) {
                    scrollArea.insertBefore(divider, scrollbar);
                    scrollArea.insertBefore(deleteItem, scrollbar);
                } else {
                    scrollArea.appendChild(divider);
                    scrollArea.appendChild(deleteItem);
                }
            } else if (previewContainer) {
                menuContent.insertBefore(divider, previewContainer);
                menuContent.insertBefore(deleteItem, previewContainer);
            } else {
                menuContent.appendChild(divider);
                menuContent.appendChild(deleteItem);
            }
        });
    });

    menuObserver.observe(document.body, { childList: true, subtree: false });

    // 6. Integração com FeishinTrackPage (botão Deletar dentro de Mais Opções)
    function attachTrackPageDeleteOption() {
        if (!window.FeishinTrackPage) return;

        window.FeishinTrackPage.promptDeleteCurrentTrack = function() {
            const cur = window.__FEISHIN_PLAYER_STORE__?.getState?.()?.getCurrentSong?.();
            if (!cur) {
                showGlassToast('Aviso', 'Nenhuma música em reprodução para excluir.', true);
                return;
            }

            openConfirmModal({
                id: cur.id,
                title: cur.title || cur.name || 'Faixa Atual',
                artist: cur.artistName || cur.artist || '',
                path: cur.path
            }, async () => {
                await executeDelete({
                    id: cur.id,
                    title: cur.title || cur.name,
                    path: cur.path
                });
            });
        };
    }

    setTimeout(attachTrackPageDeleteOption, 1200);

    // 7. Sincronização em Tempo Real via Server-Sent Events (SSE)
    function initRealtimeSync() {
        const serverUrl = window.__FEISHIN_AUTH_STORE__?.getState?.()?.currentServer?.url || window.location.origin;
        const eventsUrl = `${serverUrl.replace(/\/$/, '')}/api/engine/events`;
        let es = null;

        function connect() {
            try {
                es = new EventSource(eventsUrl);

                es.addEventListener('track_deleted', (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        console.log('[FeishinDeleteEngine] Evento SSE track_deleted recebido:', data);

                        purgeSongFromUI(data.id, data.title);

                        showGlassToast(
                            'Sincronização VPS',
                            `"${data.title || 'Música'}" foi removida do servidor.`
                        );
                    } catch (err) {
                        console.error('[FeishinDeleteEngine] Erro processando evento SSE:', err);
                    }
                });

                es.onerror = () => {
                    if (es) {
                        es.close();
                        es = null;
                    }
                    setTimeout(connect, 6000);
                };
            } catch (err) {
                setTimeout(connect, 10000);
            }
        }

        setTimeout(connect, 1000);
    }

    initRealtimeSync();

    // Exportar na janela global
    window.FeishinDeleteEngine = {
        promptDelete: openConfirmModal,
        executeDelete: executeDelete,
        showToast: showGlassToast,
        purgeFromUI: purgeSongFromUI
    };

    console.log('[FeishinDeleteEngine] Motor Ativo e Integrado.');
})();
