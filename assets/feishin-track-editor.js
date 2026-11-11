/**
 * ==========================================================================
 * FEISHIN PERSONAL OS — ULTRA-CLEAR LIQUID GLASS TRACK EDITOR
 * ==========================================================================
 * - Painel de Vidro Ultra Claro com Background 100% Visível
 * - Upload & Troca de Cover Art em tempo real com preview instantâneo
 * - Edição Completa de Tags, Título, Artista, Álbum, Gênero, Ano, Faixa e Comentário
 * - Persistência direta no Filesystem da VPS (mutagen) + Navidrome SQLite DB + SSE
 * - Injeção Unificada: macOS Desktop e Android Mobile (Portrait & Landscape)
 */

(function () {
    console.log('[FeishinTrackEditor] Inicializando Track Editor Liquid Glass...');

    class FeishinTrackEditor {
        constructor() {
            this.currentSong = null;
            this.newCoverBase64 = null;
            this.activeTags = new Set();
            this.backdrop = null;
            this.panel = null;
            this.isSaving = false;
            this.lastTargetRow = null;

            this.initDOM();
            this.bindGlobalEvents();
        }

        getServerUrl() {
            const auth = window.__FEISHIN_AUTH_STORE__?.getState?.() || {};
            const srv = auth.currentServer || Object.values(auth.serverList || {})[0];
            return srv?.url ? srv.url.replace(/\/$/, '') : window.location.origin;
        }

        getAuthParams() {
            const auth = window.__FEISHIN_AUTH_STORE__?.getState?.() || {};
            const srv = auth.currentServer || Object.values(auth.serverList || {})[0];
            const cred = srv?.credential || srv?.ndCredential || '';
            const user = srv?.username || 'PortfolioGuest';
            const salt = '1db6bd';
            const token = 'd8a85b5607aa399b374a131f3b77c1dc';
            return `u=${encodeURIComponent(user)}&s=${salt}&t=${token}&v=1.16.1&c=feishin-engine`;
        }

        initDOM() {
            if (document.getElementById('feishin-track-editor-backdrop')) {
                this.backdrop = document.getElementById('feishin-track-editor-backdrop');
                this.panel = document.getElementById('feishin-track-editor-panel');
                return;
            }

            const backdrop = document.createElement('div');
            backdrop.id = 'feishin-track-editor-backdrop';
            backdrop.className = 'feishin-te-backdrop';

            backdrop.innerHTML = `
                <div class="feishin-te-panel" id="feishin-track-editor-panel" role="dialog" aria-modal="true">
                    <!-- Header -->
                    <div class="feishin-te-header">
                        <div class="feishin-te-title-wrap">
                            <div class="feishin-te-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                <span>Editor de Faixa</span>
                                <span class="feishin-te-title-badge">Liquid Glass</span>
                            </div>
                            <div class="feishin-te-subtitle" id="feishin-te-song-subtitle">Carregando dados da música...</div>
                        </div>
                        <button class="feishin-te-close-btn" id="feishin-te-btn-close" aria-label="Fechar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <!-- Body (2 Colunas) -->
                    <div class="feishin-te-body">
                        <!-- Coluna Esquerda: Cover Art & Tags -->
                        <div class="feishin-te-col-left">
                            <div class="feishin-te-cover-container" id="feishin-te-cover-dropzone" title="Clique ou arraste uma nova imagem para a faixa">
                                <img id="feishin-te-cover-img" class="feishin-te-cover-img" src="" alt="Capa da Faixa" />
                                <div class="feishin-te-cover-overlay">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <span>Trocar Capa</span>
                                </div>
                                <span class="feishin-te-cover-badge" id="feishin-te-cover-badge">Original</span>
                            </div>
                            <input type="file" id="feishin-te-file-input" accept="image/jpeg,image/png,image/webp" style="display:none;" />

                            <div class="feishin-te-cover-actions">
                                <button type="button" class="feishin-te-btn-secondary" id="feishin-te-btn-change-cover">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    <span>Upload</span>
                                </button>
                                <button type="button" class="feishin-te-btn-secondary" id="feishin-te-btn-reset-cover" style="display:none;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                    <span>Restaurar</span>
                                </button>
                            </div>

                            <!-- Tags Section -->
                            <div class="feishin-te-tags-section">
                                <div class="feishin-te-tags-label">
                                    <span>Tags da Faixa</span>
                                    <span id="feishin-te-tags-count" style="font-size:10px; color:rgba(255,255,255,0.45);">0 tags</span>
                                </div>
                                <div class="feishin-te-tags-list" id="feishin-te-tags-container"></div>
                                <div class="feishin-te-tag-input-row">
                                    <input type="text" class="feishin-te-tag-input" id="feishin-te-new-tag-input" placeholder="Nova tag..." />
                                    <button type="button" class="feishin-te-tag-add-btn" id="feishin-te-btn-add-tag">+</button>
                                </div>
                            </div>
                        </div>

                        <!-- Coluna Direita: Formulário de Metadados -->
                        <div class="feishin-te-col-right">
                            <div class="feishin-te-field-group">
                                <label class="feishin-te-label" for="feishin-te-input-title">Nome da Música</label>
                                <input type="text" class="feishin-te-input feishin-te-input-highlight" id="feishin-te-input-title" placeholder="Título da faixa..." />
                            </div>

                            <div class="feishin-te-row-2col">
                                <div class="feishin-te-field-group">
                                    <label class="feishin-te-label" for="feishin-te-input-artist">Artista</label>
                                    <input type="text" class="feishin-te-input" id="feishin-te-input-artist" placeholder="Nome do artista..." />
                                </div>
                                <div class="feishin-te-field-group">
                                    <label class="feishin-te-label" for="feishin-te-input-album">Álbum</label>
                                    <input type="text" class="feishin-te-input" id="feishin-te-input-album" placeholder="Nome do álbum..." />
                                </div>
                            </div>

                            <div class="feishin-te-row-2col">
                                <div class="feishin-te-field-group">
                                    <label class="feishin-te-label" for="feishin-te-input-genre">Gênero</label>
                                    <input type="text" class="feishin-te-input" id="feishin-te-input-genre" placeholder="Ex: Rock, Synthwave, Lo-Fi..." />
                                </div>
                                <div class="feishin-te-row-2col">
                                    <div class="feishin-te-field-group">
                                        <label class="feishin-te-label" for="feishin-te-input-year">Ano</label>
                                        <input type="text" class="feishin-te-input" id="feishin-te-input-year" placeholder="YYYY" maxlength="4" />
                                    </div>
                                    <div class="feishin-te-field-group">
                                        <label class="feishin-te-label" for="feishin-te-input-track-num">Nº Faixa</label>
                                        <input type="text" class="feishin-te-input" id="feishin-te-input-track-num" placeholder="#" maxlength="4" />
                                    </div>
                                </div>
                            </div>

                            <div class="feishin-te-field-group">
                                <label class="feishin-te-label" for="feishin-te-input-comment">Comentário / Observações</label>
                                <textarea class="feishin-te-textarea" id="feishin-te-input-comment" rows="2" placeholder="Notas ou metadados adicionais..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="feishin-te-footer">
                        <button type="button" class="feishin-te-btn-cancel" id="feishin-te-btn-cancel">Cancelar</button>
                        <button type="button" class="feishin-te-btn-save" id="feishin-te-btn-save">
                            <span id="feishin-te-save-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                            <span id="feishin-te-save-text">Salvar Alterações</span>
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(backdrop);
            this.backdrop = backdrop;
            this.panel = document.getElementById('feishin-track-editor-panel');

            this.bindDOMEvents();
        }

        bindDOMEvents() {
            // Fechar ao clicar fora ou no botão fechar/cancelar
            document.getElementById('feishin-te-btn-close')?.addEventListener('click', () => this.close());
            document.getElementById('feishin-te-btn-cancel')?.addEventListener('click', () => this.close());
            this.backdrop.addEventListener('click', (e) => {
                if (e.target === this.backdrop) this.close();
            });

            // Tecla Escape fecha
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.backdrop.classList.contains('open')) {
                    this.close();
                }
            });

            // Upload de Capa via clique ou drag & drop
            const dropzone = document.getElementById('feishin-te-cover-dropzone');
            const fileInput = document.getElementById('feishin-te-file-input');
            const changeBtn = document.getElementById('feishin-te-btn-change-cover');
            const resetBtn = document.getElementById('feishin-te-btn-reset-cover');

            dropzone?.addEventListener('click', () => fileInput?.click());
            changeBtn?.addEventListener('click', () => fileInput?.click());

            resetBtn?.addEventListener('click', () => {
                this.newCoverBase64 = null;
                const origUrl = this.getSongCoverUrl(this.currentSong);
                const img = document.getElementById('feishin-te-cover-img');
                if (img) img.src = origUrl;
                document.getElementById('feishin-te-cover-badge').textContent = 'Original';
                resetBtn.style.display = 'none';
            });

            fileInput?.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) this.handleCoverFile(file);
            });

            // Drag and Drop
            dropzone?.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
            dropzone?.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleCoverFile(file);
                }
            });

            // Adicionar Tag
            const newTagInput = document.getElementById('feishin-te-new-tag-input');
            const addTagBtn = document.getElementById('feishin-te-btn-add-tag');

            const addCurrentInputTag = () => {
                const val = (newTagInput?.value || '').trim();
                if (val) {
                    this.addTag(val);
                    if (newTagInput) newTagInput.value = '';
                }
            };

            addTagBtn?.addEventListener('click', addCurrentInputTag);
            newTagInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addCurrentInputTag();
                }
            });

            // Salvar
            document.getElementById('feishin-te-btn-save')?.addEventListener('click', () => this.save());
        }

        handleCoverFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.newCoverBase64 = e.target.result;
                const img = document.getElementById('feishin-te-cover-img');
                if (img) img.src = this.newCoverBase64;
                const badge = document.getElementById('feishin-te-cover-badge');
                if (badge) badge.textContent = 'Nova Capa';
                const resetBtn = document.getElementById('feishin-te-btn-reset-cover');
                if (resetBtn) resetBtn.style.display = 'flex';
                this.showToast('Imagem Carregada', 'Nova arte pronta para ser gravada na faixa.');
            };
            reader.readAsDataURL(file);
        }

        getSongCoverUrl(song) {
            if (this.newCoverBase64) return this.newCoverBase64;
            const srv = this.getServerUrl();
            const authParams = this.getAuthParams();
            if (song?.imageUrl) return song.imageUrl;
            if (song?.imageId) return `${srv}/rest/getCoverArt.view?id=${encodeURIComponent(song.imageId)}&${authParams}`;
            if (song?.id) return `${srv}/rest/getCoverArt.view?id=${encodeURIComponent(song.id)}&${authParams}`;
            return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%23222"><rect width="24" height="24"/><path d="M9 18V5l12-2v13" stroke="%23666" stroke-width="2"/><circle cx="6" cy="18" r="3" fill="%23666"/><circle cx="18" cy="16" r="3" fill="%23666"/></svg>';
        }

        renderTags() {
            const container = document.getElementById('feishin-te-tags-container');
            const countEl = document.getElementById('feishin-te-tags-count');
            if (!container) return;

            container.innerHTML = '';
            if (countEl) countEl.textContent = `${this.activeTags.size} tag${this.activeTags.size === 1 ? '' : 's'}`;

            if (this.activeTags.size === 0) {
                container.innerHTML = '<span style="font-size:11px; color:rgba(255,255,255,0.35); font-style:italic;">Nenhuma tag atribuída</span>';
                return;
            }

            for (const tag of this.activeTags) {
                const chip = document.createElement('div');
                chip.className = 'feishin-te-tag-chip';
                chip.innerHTML = `
                    <span>${tag}</span>
                    <span class="feishin-te-tag-remove" title="Remover tag">×</span>
                `;
                chip.querySelector('.feishin-te-tag-remove').onclick = () => {
                    this.activeTags.delete(tag);
                    this.renderTags();
                };
                container.appendChild(chip);
            }
        }

        addTag(tagName) {
            const clean = tagName.trim();
            if (!clean) return;
            this.activeTags.add(clean);
            this.renderTags();
        }

        async open(song) {
            if (!song) {
                console.warn('[FeishinTrackEditor] open chamado sem objeto de faixa.');
                return;
            }

            this.currentSong = song;
            this.newCoverBase64 = null;
            this.activeTags = new Set();
            this.initDOM();

            // Pré-preenchimento imediato
            const titleInput = document.getElementById('feishin-te-input-title');
            const artistInput = document.getElementById('feishin-te-input-artist');
            const albumInput = document.getElementById('feishin-te-input-album');
            const genreInput = document.getElementById('feishin-te-input-genre');
            const yearInput = document.getElementById('feishin-te-input-year');
            const trackNumInput = document.getElementById('feishin-te-input-track-num');
            const commentInput = document.getElementById('feishin-te-input-comment');
            const subtitleEl = document.getElementById('feishin-te-song-subtitle');
            const img = document.getElementById('feishin-te-cover-img');
            const badge = document.getElementById('feishin-te-cover-badge');
            const resetBtn = document.getElementById('feishin-te-btn-reset-cover');

            const initialTitle = song.title || song.name || 'Faixa';
            const initialArtist = song.artistName || song.artist || '';

            if (titleInput) titleInput.value = initialTitle;
            if (artistInput) artistInput.value = initialArtist;
            if (albumInput) albumInput.value = song.album || '';
            if (genreInput) genreInput.value = song.genre || '';
            if (yearInput) yearInput.value = (song.year && song.year !== 0) ? String(song.year) : '';
            if (trackNumInput) trackNumInput.value = (song.trackNumber && song.trackNumber !== 0) ? String(song.trackNumber) : '';
            if (commentInput) commentInput.value = song.comment || '';
            if (subtitleEl) subtitleEl.textContent = `${initialTitle} — ${initialArtist}`;
            if (badge) badge.textContent = 'Original';
            if (resetBtn) resetBtn.style.display = 'none';

            if (img) {
                img.src = this.getSongCoverUrl(song);
            }

            // Descobrir tags associadas a esta faixa no TagsEngine
            try {
                const tagsEngine = window.__FEISHIN_TAGS_ENGINE__;
                if (tagsEngine && tagsEngine.tags) {
                    const songId = song.id;
                    const songTitle = (song.title || song.name || '').toLowerCase().trim();
                    for (const t of tagsEngine.tags) {
                        const tracks = tagsEngine.taggedTracks[t.id] || [];
                        const hasTrack = tracks.some(tr => tr.id === songId || (tr.title || tr.name || '').toLowerCase().trim() === songTitle);
                        if (hasTrack) {
                            this.activeTags.add(t.name);
                        }
                    }
                }
            } catch (err) {
                console.warn('[FeishinTrackEditor] Erro ao sincronizar tags:', err);
            }

            this.renderTags();

            // Exibir Modal Liquid Glass
            this.backdrop.classList.add('open');

            // Buscar dados mais profundos do servidor VPS em segundo plano
            this.fetchServerTrackDetails(song.id);
        }

        async fetchServerTrackDetails(songId) {
            if (!songId) return;
            try {
                const srv = this.getServerUrl();
                const res = await fetch(`${srv}/api/engine/track-details?songId=${encodeURIComponent(songId)}`, {
                    headers: { 'Accept': 'application/json' }
                });
                if (!res.ok) return;
                const json = await res.json();
                if (json.success && json.track) {
                    const t = json.track;
                    const titleInput = document.getElementById('feishin-te-input-title');
                    const artistInput = document.getElementById('feishin-te-input-artist');
                    const albumInput = document.getElementById('feishin-te-input-album');
                    const genreInput = document.getElementById('feishin-te-input-genre');
                    const yearInput = document.getElementById('feishin-te-input-year');
                    const trackNumInput = document.getElementById('feishin-te-input-track-num');
                    const commentInput = document.getElementById('feishin-te-input-comment');

                    if (t.title && titleInput) titleInput.value = t.title;
                    if (t.artist && artistInput) artistInput.value = t.artist;
                    if (t.album && albumInput) albumInput.value = t.album;
                    if (t.genre && genreInput) genreInput.value = t.genre;
                    if (t.year && yearInput && String(t.year) !== '0') yearInput.value = String(t.year);
                    if (t.trackNumber && trackNumInput && String(t.trackNumber) !== '0') trackNumInput.value = String(t.trackNumber);
                    if (t.comment && commentInput) commentInput.value = t.comment;
                }
            } catch (e) {
                console.warn('[FeishinTrackEditor] Nota ao buscar detalhes remotos:', e);
            }
        }

        close() {
            if (this.backdrop) {
                this.backdrop.classList.remove('open');
            }
            this.currentSong = null;
            this.newCoverBase64 = null;
            this.isSaving = false;
        }

        async save() {
            if (this.isSaving || !this.currentSong) return;
            this.isSaving = true;

            const saveBtn = document.getElementById('feishin-te-btn-save');
            const saveIcon = document.getElementById('feishin-te-save-icon');
            const saveText = document.getElementById('feishin-te-save-text');

            if (saveBtn) saveBtn.disabled = true;
            if (saveIcon) saveIcon.innerHTML = '<div class="feishin-te-spinner"></div>';
            if (saveText) saveText.textContent = 'Salvando no Servidor...';

            const title = (document.getElementById('feishin-te-input-title')?.value || '').trim();
            const artist = (document.getElementById('feishin-te-input-artist')?.value || '').trim();
            const album = (document.getElementById('feishin-te-input-album')?.value || '').trim();
            const genre = (document.getElementById('feishin-te-input-genre')?.value || '').trim();
            const year = (document.getElementById('feishin-te-input-year')?.value || '').trim();
            const trackNumber = (document.getElementById('feishin-te-input-track-num')?.value || '').trim();
            const comment = (document.getElementById('feishin-te-input-comment')?.value || '').trim();

            const payload = {
                songId: this.currentSong.id,
                title: title,
                artist: artist,
                album: album,
                genre: genre,
                year: year,
                trackNumber: trackNumber,
                comment: comment,
                tags: Array.from(this.activeTags),
                coverData: this.newCoverBase64 || null
            };

            try {
                const srv = this.getServerUrl();
                const endpoint = `${srv}/api/engine/update-track`;

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    throw new Error(errJson.error || `HTTP ${res.status}: Erro ao atualizar faixa`);
                }

                const result = await res.json();

                // 1. Atualizar Tags no Feishin TagsEngine
                this.syncTagsEngine(this.currentSong, Array.from(this.activeTags));

                // 2. Atualizar UI local e Stores
                this.updateLocalSongState(this.currentSong.id, {
                    title,
                    artist,
                    album,
                    genre,
                    year,
                    trackNumber,
                    newCover: this.newCoverBase64
                });

                this.showToast('Faixa Atualizada!', `"${title || 'Música'}" gravada no disco da VPS e Navidrome.`);
                this.close();

            } catch (err) {
                console.error('[FeishinTrackEditor] Falha ao salvar faixa:', err);
                this.showToast('Erro ao Salvar', err.message || 'Não foi possível gravar as alterações.', true);
            } finally {
                this.isSaving = false;
                if (saveBtn) saveBtn.disabled = false;
                if (saveIcon) {
                    saveIcon.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                }
                if (saveText) saveText.textContent = 'Salvar Alterações';
            }
        }

        syncTagsEngine(song, newTagsList) {
            try {
                const tagsEngine = window.__FEISHIN_TAGS_ENGINE__;
                if (!tagsEngine) return;

                const songId = song.id;
                const songTitle = (song.title || song.name || '').toLowerCase().trim();

                // Para cada tag do sistema:
                for (const t of tagsEngine.tags) {
                    const shouldHave = newTagsList.includes(t.name);
                    let tracks = tagsEngine.taggedTracks[t.id] || [];
                    const hasTrack = tracks.some(tr => tr.id === songId || (tr.title || tr.name || '').toLowerCase().trim() === songTitle);

                    if (shouldHave && !hasTrack) {
                        tracks.push(song);
                        tagsEngine.taggedTracks[t.id] = tracks;
                    } else if (!shouldHave && hasTrack) {
                        tagsEngine.taggedTracks[t.id] = tracks.filter(tr => tr.id !== songId && (tr.title || tr.name || '').toLowerCase().trim() !== songTitle);
                    }
                }

                // Se alguma tag digitada for nova no sistema, cria ela
                for (const tagName of newTagsList) {
                    const exists = tagsEngine.tags.some(t => t.name.toLowerCase() === tagName.toLowerCase());
                    if (!exists) {
                        const newTag = {
                            id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                            name: tagName,
                            heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'
                        };
                        tagsEngine.tags.push(newTag);
                        tagsEngine.taggedTracks[newTag.id] = [song];
                    }
                }

                tagsEngine.save();
                tagsEngine.notifyListeners();
            } catch (e) {
                console.warn('[FeishinTrackEditor] Erro ao sincronizar TagsEngine:', e);
            }
        }

        updateLocalSongState(songId, data) {
            // Atualizar DOM: Linhas da tabela de faixas
            document.querySelectorAll('[data-row-index], .ra-item-row, .fs-item-table-list-column-module-data-row, [role="row"]').forEach(row => {
                const titleEl = row.querySelector('.fs-title-column-module-title, .ra-row-title, [class*="title"], a');
                const artistEl = row.querySelector('.fs-artist-column-module-artist, .ra-row-artist, [class*="artist"]');
                const albumEl = row.querySelector('.fs-album-column-module-album, [class*="album"]');
                const imgEl = row.querySelector('img');

                if (titleEl && (row.getAttribute('data-song-id') === songId || titleEl.innerText.trim() === this.currentSong?.title)) {
                    if (data.title && titleEl) titleEl.innerText = data.title;
                    if (data.artist && artistEl) artistEl.innerText = data.artist;
                    if (data.album && albumEl) albumEl.innerText = data.album;
                    if (data.newCover && imgEl) imgEl.src = data.newCover;
                }
            });

            // Atualizar Player Bar e Fullscreen Player se for a faixa em reprodução
            const playerStore = window.__FEISHIN_PLAYER_STORE__?.getState?.();
            const cur = playerStore?.getCurrentSong?.() || playerStore?.player?.currentSong;
            if (cur && (cur.id === songId || (cur.title || cur.name) === this.currentSong?.title)) {
                if (data.title) cur.title = data.title;
                if (data.artist) cur.artistName = data.artist;
                if (data.album) cur.album = data.album;

                // Elementos da barra inferior
                const barTitle = document.querySelector('.fs-bottom-player-module-track-title, [class*="track-title"]');
                const barArtist = document.querySelector('.fs-bottom-player-module-track-artist, [class*="track-artist"]');
                const barImg = document.querySelector('.fs-left-controls-module-image img, #player-bar img');

                if (barTitle && data.title) barTitle.innerText = data.title;
                if (barArtist && data.artist) barArtist.innerText = data.artist;
                if (barImg && data.newCover) barImg.src = data.newCover;

                // Elementos da Tela da Música (FeishinTrackPage)
                const tpTitle = document.getElementById('feishin-tp-title');
                const tpArtist = document.getElementById('feishin-tp-artist');
                const tpAlbum = document.getElementById('feishin-tp-album');
                const tpImg = document.getElementById('feishin-tp-cover-img');

                if (tpTitle && data.title) tpTitle.innerText = data.title;
                if (tpArtist && data.artist) tpArtist.innerText = data.artist;
                if (tpAlbum && data.album) tpAlbum.innerText = data.album;
                if (tpImg && data.newCover) tpImg.src = data.newCover;
            }
        }

        showToast(title, message, isError = false) {
            const existing = document.getElementById('feishin-te-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = 'feishin-te-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(18, 18, 28, 0.90);
                backdrop-filter: blur(28px) saturate(200%);
                -webkit-backdrop-filter: blur(28px) saturate(200%);
                border: 1px solid ${isError ? 'rgba(255, 77, 79, 0.4)' : 'rgba(167, 139, 250, 0.4)'};
                border-radius: 16px;
                padding: 12px 20px;
                color: #ffffff;
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px ${isError ? 'rgba(255, 77, 79, 0.2)' : 'rgba(167, 139, 250, 0.25)'};
                z-index: 100060;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: none;
                max-width: 90vw;
            `;

            const iconSvg = isError
                ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff4d4f" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
                : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#A78BFA" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

            toast.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg}</div>
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <div style="font-weight:700;font-size:13.5px;letter-spacing:-0.2px;">${title}</div>
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
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => toast.remove(), 350);
            }, 3600);
        }

        bindGlobalEvents() {
            // Rastrear última linha clicada no contexto
            document.addEventListener('contextmenu', (e) => {
                const row = e.target.closest('[data-row-index], .ra-item-row, .fs-item-table-list-column-module-data-row, [role="row"]');
                if (row) this.lastTargetRow = row;
            }, true);

            // Observador para interceptar o menu de contexto Radix
            const observer = new MutationObserver(() => {
                const activeMenus = document.querySelectorAll('[role="menu"], [data-radix-menu-content], .fs-context-menu-module-content');
                if (activeMenus.length === 0) return;

                for (const menu of activeMenus) {
                    if (menu.dataset.trackEditorInjected === 'true') continue;

                    const menuText = menu.innerText.toLowerCase();
                    const isSongMenu = menuText.includes('tocar') || menuText.includes('play') ||
                                       menuText.includes('playlist') || menuText.includes('informações') ||
                                       menuText.includes('editar metadados') || menuText.includes('edit metadata');

                    if (!isSongMenu) continue;
                    menu.dataset.trackEditorInjected = 'true';

                    // 1. Interceptar botão nativo quebrado "Editar metadados" se existir
                    menu.querySelectorAll('[role="menuitem"], .fs-context-menu-module-item').forEach(item => {
                        const txt = item.innerText.toLowerCase();
                        if (txt.includes('editar metadados') || txt.includes('edit metadata')) {
                            item.style.color = '#C4B5FD';
                            item.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                menu.remove();
                                const b = document.getElementById('feishin-context-backdrop');
                                if (b) b.remove();
                                this.resolveAndOpenTrack();
                            }, true);
                        }
                    });

                    // 2. Se não houver botão de editar ou no Android, injetar item "Editar Faixa"
                    if (!menu.querySelector('.feishin-track-editor-menu-item')) {
                        const editItem = document.createElement('div');
                        editItem.className = 'fs-context-menu-module-item fs-context-menu-module-has-left-icon feishin-track-editor-menu-item';
                        editItem.setAttribute('role', 'menuitem');
                        editItem.setAttribute('tabindex', '-1');
                        editItem.setAttribute('data-orientation', 'vertical');
                        editItem.setAttribute('data-radix-collection-item', '');

                        editItem.innerHTML = `
                            <svg stroke="#A78BFA" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="fs-context-menu-module-left-icon fs-icon-module-fill fs-icon-module-size-md" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span>Editar Faixa</span>
                        `;

                        editItem.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            menu.remove();
                            const b = document.getElementById('feishin-context-backdrop');
                            if (b) b.remove();
                            this.resolveAndOpenTrack();
                        };

                        // Inserir antes de "Deletar Música" ou no topo das ações de detalhe
                        const deleteItem = menu.querySelector('.feishin-delete-menu-item, [data-action="delete-song"]');
                        if (deleteItem && deleteItem.parentElement) {
                            deleteItem.parentElement.insertBefore(editItem, deleteItem);
                        } else {
                            const scrollArea = menu.querySelector('.fs-scroll-area-module-scroll-area');
                            if (scrollArea) scrollArea.appendChild(editItem);
                            else menu.appendChild(editItem);
                        }
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Hook no FeishinTrackPage (Mais opções da tela da música)
            this.hookTrackPageOptions();
        }

        resolveAndOpenTrack() {
            let songToTarget = null;

            if (this.lastTargetRow) {
                const titleEl = this.lastTargetRow.querySelector('.fs-title-column-module-title, .ra-row-title, [class*="title"], a');
                const artistEl = this.lastTargetRow.querySelector('.fs-artist-column-module-artist, .ra-row-artist, [class*="artist"]');
                const albumEl = this.lastTargetRow.querySelector('.fs-album-column-module-album, [class*="album"]');
                const rowText = this.lastTargetRow.innerText.split('\n').filter(Boolean);

                const title = titleEl ? titleEl.innerText.trim() : (rowText[1] || rowText[0] || 'Faixa Selecionada');
                const artist = artistEl ? artistEl.innerText.trim() : (rowText[2] || '');
                const album = albumEl ? albumEl.innerText.trim() : '';

                const playerStore = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                const queue = playerStore?.queue?.items || [];
                const foundInQueue = queue.find(q => (q.title || q.name || '').toLowerCase().trim() === title.toLowerCase().trim());

                songToTarget = {
                    id: foundInQueue ? foundInQueue.id : (this.lastTargetRow.getAttribute('data-song-id') || this.lastTargetRow.getAttribute('data-id') || ''),
                    title: title,
                    artist: artist,
                    album: album
                };
            }

            // Fallback para faixa atual em reprodução
            if (!songToTarget || !songToTarget.title) {
                const cur = window.__FEISHIN_PLAYER_STORE__?.getState?.()?.getCurrentSong?.();
                if (cur) {
                    songToTarget = {
                        id: cur.id,
                        title: cur.title || cur.name || 'Faixa Atual',
                        artist: cur.artistName || cur.artist || '',
                        album: cur.album || '',
                        path: cur.path
                    };
                }
            }

            if (songToTarget) {
                this.open(songToTarget);
            }
        }

        hookTrackPageOptions() {
            const check = () => {
                const moreList = document.querySelector('.feishin-tp-more-list');
                if (moreList && !document.getElementById('feishin-tp-opt-track-editor')) {
                    const editItem = document.createElement('div');
                    editItem.className = 'feishin-tp-more-item';
                    editItem.id = 'feishin-tp-opt-track-editor';
                    editItem.style.cssText = `
                        border: 1px solid rgba(167, 139, 250, 0.35);
                        background: rgba(167, 139, 250, 0.08);
                        border-radius: 12px;
                        margin-bottom: 6px;
                    `;

                    editItem.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span style="font-weight: 600; color: #FFFFFF;">Editar Faixa (Track Editor)</span>
                    `;

                    editItem.onclick = () => {
                        document.getElementById('feishin-tp-more-sheet')?.classList.remove('open');
                        const store = window.__FEISHIN_PLAYER_STORE__?.getState?.();
                        const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
                        if (cur) {
                            this.open(cur);
                        }
                    };

                    // Inserir antes de detalhes técnicos
                    const detailsOpt = document.getElementById('feishin-tp-opt-details');
                    if (detailsOpt) {
                        moreList.insertBefore(editItem, detailsOpt);
                    } else {
                        moreList.appendChild(editItem);
                    }
                }
            };

            setInterval(check, 1000);
        }
    }

    // Instanciação e Exposição Global
    window.FeishinTrackEditor = FeishinTrackEditor;
    window.__FEISHIN_TRACK_EDITOR__ = new FeishinTrackEditor();
    window.openTrackEditor = function (song) {
        window.__FEISHIN_TRACK_EDITOR__.open(song);
    };
})();
