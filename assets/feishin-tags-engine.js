// ==========================================================================
// FEISHIN TAGS SYSTEM & ENGINE
// Substitui completamente o sistema de gêneros por um sistema completo de Tags
// 1. Tag Editor (Criar, Editar, Remover, Definir Hero Image livremente)
// 2. Hero Boxes (Visualização 1 - Cards com Hero Image, nome e playlist ao clicar)
// 3. Abas com Botões no Topo (Visualização 2 - Switcher dinâmico de tags e faixas)
// 4. Menu de Contexto (Clique direito na faixa para atribuir/desatribuir tags)
// ==========================================================================

(function() {
  console.log('[Tags Engine] Inicializando Sistema de Tags no Feishin...');

  // 1. PRESET HERO IMAGES (Alta Resolução & Temas Visuais)
  const PRESET_HEROES = [
    { name: 'Aurora Cósmica', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop', icon: '🌌' },
    { name: 'Rock Arena', url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1200&auto=format&fit=crop', icon: '🎸' },
    { name: 'Neon Cyberpunk', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop', icon: '🌆' },
    { name: 'Cozy Lo-Fi', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop', icon: '☕' },
    { name: 'Plasma Energy', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop', icon: '⚡' },
    { name: 'Jazz & Soul', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1200&auto=format&fit=crop', icon: '🎷' },
    { name: 'Deep Ocean', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop', icon: '🌊' },
    { name: 'Retro Arcade', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop', icon: '🪩' }
  ];

  // 2. TAGS ENGINE STATE & LOCAL STORAGE
  const STORAGE_TAGS_KEY = 'feishin_tags_db_v2';
  const STORAGE_TRACKS_KEY = 'feishin_tag_tracks_v2';
  const STORAGE_VIEW_KEY = 'feishin_tags_view_mode';

  class TagsEngine {
    constructor() {
      this.tags = [];
      this.taggedTracks = {}; // tagId -> Array<SongObject>
      this.selectedSongs = new Map(); // key -> SongObject
      this.isMultiSelectActive = false;
      this.viewMode = localStorage.getItem(STORAGE_VIEW_KEY) || 'boxes'; // 'boxes' | 'tabs'
      this.activeTabId = null;
      this.openedBoxTagId = null;
      this.searchQuery = '';
      this.listeners = new Set();

      this.load();
      if (this.tags.length === 0) {
        this.seedDefaultTags();
      }
    }

    load() {
      try {
        const rawTags = localStorage.getItem(STORAGE_TAGS_KEY);
        if (rawTags) this.tags = JSON.parse(rawTags);
      } catch (e) {
        console.error('[Tags Engine] Erro ao carregar tags:', e);
        this.tags = [];
      }

      try {
        const rawTracks = localStorage.getItem(STORAGE_TRACKS_KEY);
        if (rawTracks) this.taggedTracks = JSON.parse(rawTracks);
      } catch (e) {
        console.error('[Tags Engine] Erro ao carregar faixas marcadas:', e);
        this.taggedTracks = {};
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_TAGS_KEY, JSON.stringify(this.tags));
        localStorage.setItem(STORAGE_TRACKS_KEY, JSON.stringify(this.taggedTracks));
      } catch (e) {
        console.error('[Tags Engine] Erro ao salvar tags:', e);
      }
      this.notify();
      this.updateAllVisibleTrackBadges();
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    notify() {
      for (const fn of this.listeners) {
        try { fn(); } catch (err) { console.error(err); }
      }
    }

    seedDefaultTags() {
      this.tags = [
        {
          id: 'tag_rock',
          name: 'Rock & Guitarras',
          heroImage: PRESET_HEROES[1].url,
          createdAt: Date.now() - 50000
        },
        {
          id: 'tag_lofi',
          name: 'Lo-Fi & Relax',
          heroImage: PRESET_HEROES[3].url,
          createdAt: Date.now() - 40000
        },
        {
          id: 'tag_synthwave',
          name: 'Synthwave & Cyber',
          heroImage: PRESET_HEROES[2].url,
          createdAt: Date.now() - 30000
        },
        {
          id: 'tag_vibes',
          name: 'Madrugada / Vibes',
          heroImage: PRESET_HEROES[0].url,
          createdAt: Date.now() - 20000
        },
        {
          id: 'tag_jazz',
          name: 'Jazz & Instrumental',
          heroImage: PRESET_HEROES[5].url,
          createdAt: Date.now() - 10000
        }
      ];
      this.save();
    }

    getTags() {
      return [...this.tags];
    }

    getTag(id) {
      return this.tags.find(t => t.id === id);
    }

    createTag(name, heroImage) {
      const cleanName = (name || '').trim();
      if (!cleanName) return null;
      const id = 'tag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const tag = {
        id,
        name: cleanName,
        heroImage: heroImage || PRESET_HEROES[Math.floor(Math.random() * PRESET_HEROES.length)].url,
        createdAt: Date.now()
      };
      this.tags.push(tag);
      this.taggedTracks[id] = [];
      this.save();
      this.showToast(`Tag "${cleanName}" criada com sucesso!`);
      return tag;
    }

    updateTag(id, updates) {
      const tag = this.getTag(id);
      if (!tag) return false;
      if (updates.name && updates.name.trim()) tag.name = updates.name.trim();
      if (updates.heroImage) tag.heroImage = updates.heroImage.trim();
      this.save();
      this.showToast(`Tag "${tag.name}" atualizada!`);
      return true;
    }

    deleteTag(id) {
      const tag = this.getTag(id);
      const tagName = tag ? tag.name : 'Tag';
      this.tags = this.tags.filter(t => t.id !== id);
      delete this.taggedTracks[id];
      if (this.activeTabId === id) this.activeTabId = this.tags[0]?.id || null;
      if (this.openedBoxTagId === id) {
        this.openedBoxTagId = null;
        if (window.location.hash.includes('tag=')) {
          window.location.hash = '#/library/genres';
        }
      }
      this.save();
      this.showToast(`Tag "${tagName}" removida.`);
      return true;
    }

    getSongsForTag(tagId) {
      if (!tagId) return [];
      return this.taggedTracks[tagId] || [];
    }

    isSongInTag(songOrId, tagId) {
      if (!songOrId || !tagId || !this.taggedTracks[tagId]) return false;
      const list = this.taggedTracks[tagId];
      if (typeof songOrId === 'string') {
        const q = songOrId.trim().toLowerCase();
        return list.some(s => (s.id && String(s.id).toLowerCase() === q) || ((s.name || s.title) && (s.name || s.title).toLowerCase() === q));
      }
      const targetId = songOrId.id ? String(songOrId.id).trim() : null;
      const targetName = (songOrId.name || songOrId.title || '').trim().toLowerCase();
      const targetArtist = (songOrId.artistName || songOrId.artist || (songOrId.artists?.[0]?.name) || '').trim().toLowerCase();

      return list.some(s => {
        if (targetId && s.id && String(s.id).trim() === targetId) return true;
        if (targetName) {
          const sName = (s.name || s.title || '').trim().toLowerCase();
          const sArtist = (s.artistName || s.artist || (s.artists?.[0]?.name) || '').trim().toLowerCase();
          if (sName === targetName) {
            if (!targetArtist || !sArtist || sArtist === targetArtist) {
              return true;
            }
          }
        }
        return false;
      });
    }

    getTagsForSong(songOrId) {
      if (!songOrId) return [];
      const matched = [];
      for (const tag of this.tags) {
        if (this.isSongInTag(songOrId, tag.id)) {
          matched.push(tag);
        }
      }
      return matched;
    }

    assignTrack(song, tagId, silent = false) {
      if (!song || !tagId) return false;
      const tag = this.getTag(tagId);
      if (!tag) return false;
      if (!this.taggedTracks[tagId]) this.taggedTracks[tagId] = [];
      const list = this.taggedTracks[tagId];

      if (!this.isSongInTag(song, tagId)) {
        const cleanSong = typeof normalizeSongObject === 'function' ? normalizeSongObject(song) : {
          id: song.id ? String(song.id) : ('trk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
          name: song.name || song.title || 'Faixa sem título',
          title: song.name || song.title || 'Faixa sem título',
          artistName: song.artistName || song.artist || (song.artists?.[0]?.name) || 'Artista Desconhecido',
          album: song.album || song.albumName || 'Álbum',
          albumId: song.albumId || song.id,
          duration: song.duration || 0,
          imageId: song.imageId || song.id,
          imageUrl: song.imageUrl || null,
          thumbHash: song.thumbHash || null,
          _itemType: song._itemType || 'song',
          _serverId: song._serverId || (window.__FEISHIN_SERVER_STORE__?.getState()?.currentServer?.id) || ''
        };
        list.push(cleanSong);
        this.save();
        if (!silent) {
          this.showToast(`Faixa "${cleanSong.name}" atribuída à tag "${tag.name}"!`);
        }
        return true;
      }
      return false;
    }

    removeTrack(songOrId, tagId, silent = false) {
      if (!songOrId || !tagId || !this.taggedTracks[tagId]) return false;
      const tag = this.getTag(tagId);
      const targetId = typeof songOrId === 'string' ? songOrId : (songOrId.id ? String(songOrId.id) : null);
      const targetName = typeof songOrId === 'object' ? (songOrId.name || songOrId.title || '').trim().toLowerCase() : '';

      this.taggedTracks[tagId] = this.taggedTracks[tagId].filter(s => {
        if (targetId && s.id && String(s.id) === targetId) return false;
        if (targetName && (s.name || s.title)) {
          const sName = (s.name || s.title || '').trim().toLowerCase();
          if (sName === targetName) return false;
        }
        return true;
      });
      this.save();
      if (!silent) {
        this.showToast(`Faixa removida da tag "${tag?.name || 'Tag'}".`);
      }
      return true;
    }

    renderTagBadgesHtml(song) {
      if (!song) return '';
      const tags = this.getTagsForSong(song);
      if (!tags || !tags.length) return '';
      return `<span class="fs-track-tag-badges">${tags.map(t => `
        <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
          🏷️ ${escapeHtml(t.name)}
        </span>
      `).join('')}</span>`;
    }

    assignTagToSongs(songs, tagId) {
      if (!songs || !songs.length || !tagId) return;
      const tag = this.getTag(tagId);
      if (!tag) return;
      let count = 0;
      songs.forEach(s => {
        if (this.assignTrack(s, tagId, true)) count++;
      });
      this.save();
      this.showToast(`Tag "${tag.name}" atribuída a ${songs.length} faixa(s)!`);
      this.updateAllVisibleTrackBadges();
    }

    removeTagFromSongs(songs, tagId) {
      if (!songs || !songs.length || !tagId) return;
      const tag = this.getTag(tagId);
      if (!tag) return;
      songs.forEach(s => {
        this.removeTrack(s, tagId, true);
      });
      this.save();
      this.showToast(`Tag "${tag.name}" removida de ${songs.length} faixa(s).`);
      this.updateAllVisibleTrackBadges();
    }

    toggleTracksTag(songs, tagId) {
      if (!songs || !songs.length || !tagId) return;
      const tag = this.getTag(tagId);
      if (!tag) return;
      const allIn = songs.every(s => this.isSongInTag(s, tagId));
      if (allIn) {
        this.removeTagFromSongs(songs, tagId);
      } else {
        this.assignTagToSongs(songs, tagId);
      }
    }

    setMultiSelectActive(active, initialSongs = null) {
      this.isMultiSelectActive = active;
      if (active) {
        document.body.classList.add('fs-multiselect-active');
        if (initialSongs && initialSongs.length) {
          initialSongs.forEach(s => {
            const key = s.id || `${s.name}:::${s.artistName}`;
            this.selectedSongs.set(key, s);
          });
        }
        this.ensureRowClickInterceptor();
        renderMultiSelectFloatingBar();
        this.updateSelectionRowDecorations();
        this.showToast(`Modo de Seleção Ativado (${this.selectedSongs.size} selecionadas)`);
        const headerBtn = document.querySelector('#fs-toolbar-select-btn span');
        if (headerBtn) headerBtn.innerText = 'Cancelar';
      } else {
        document.body.classList.remove('fs-multiselect-active');
        this.selectedSongs.clear();
        removeMultiSelectFloatingBar();
        this.updateSelectionRowDecorations();
        const headerBtn = document.querySelector('#fs-toolbar-select-btn span');
        if (headerBtn) headerBtn.innerText = 'Selecionar';
      }
    }

    ensureRowClickInterceptor() {
      if (this._rowClickInterceptorAttached) return;
      this._rowClickInterceptorAttached = true;
      document.addEventListener('click', (e) => {
        if (!this.isMultiSelectActive) return;

        // Se o clique foi na barra flutuante, modais, menu dropdown ou no botão de alternar seleção, não intercepta
        if (e.target.closest('#fs-multiselect-floating-bar, .fs-tag-modal-container, .fs-tag-modal-backdrop, #fs-toolbar-select-btn, .mantine-Menu-dropdown')) {
          return;
        }

        const row = e.target.closest('[data-row-index], .ra-tracklist-row, [class*="track-row"]');
        if (row) {
          e.stopPropagation();
          e.preventDefault();

          let song = extractSongFromElement(row);
          if (!song && row.getAttribute('data-row-index') && row.parentElement) {
            const rowIndex = row.getAttribute('data-row-index');
            const titleCell = row.parentElement.querySelector(`[data-row-index="${rowIndex}"].fs-title-combined-column-module-title-combined, [data-row-index="${rowIndex}"] [class*="title-combined"]`);
            if (titleCell) {
              song = extractSongFromElement(titleCell);
            }
          }

          if (song) {
            this.toggleSongSelection(song);
          }
        }
      }, true);
    }

    toggleSongSelection(song) {
      if (!song) return;
      const key = song.id || `${song.name}:::${song.artistName}`;
      if (this.selectedSongs.has(key)) {
        this.selectedSongs.delete(key);
      } else {
        this.selectedSongs.set(key, song);
      }
      if (window.AndroidBridge?.vibrate) {
        window.AndroidBridge.vibrate(15);
      }
      renderMultiSelectFloatingBar();
      this.updateSelectionRowDecorations();
    }

    selectAllVisible() {
      const cells = document.querySelectorAll(
        '.fs-title-combined-column-module-title-combined, .fs-title-artist-column-module-title-artist, .fs-song-title-column-module-song-title, .ra-tracklist-row, [class*="item-detail-list-module-track-row"]'
      );
      cells.forEach(c => {
        const s = extractSongFromElement(c);
        if (s && s.id) {
          const key = s.id;
          this.selectedSongs.set(key, s);
        }
      });
      renderMultiSelectFloatingBar();
      this.updateSelectionRowDecorations();
      this.showToast(`${this.selectedSongs.size} faixa(s) selecionada(s)!`);
    }

    clearSelection() {
      this.selectedSongs.clear();
      renderMultiSelectFloatingBar();
      this.updateSelectionRowDecorations();
    }

    updateSelectionRowDecorations() {
      const cells = document.querySelectorAll(
        '.fs-title-combined-column-module-title-combined, .fs-title-artist-column-module-title-artist, .fs-song-title-column-module-song-title, .ra-tracklist-row, [class*="item-detail-list-module-track-row"]'
      );
      cells.forEach(c => {
        const song = extractSongFromElement(c);
        if (!song) return;
        const key = song.id;
        const isSelected = this.selectedSongs.has(key);
        const row = c.closest('[data-row-index], .ra-tracklist-row, [class*="track-row"]') || c;

        if (this.isMultiSelectActive) {
          row.classList.add('fs-multiselect-row');
          if (isSelected) {
            row.classList.add('fs-row-is-selected');
          } else {
            row.classList.remove('fs-row-is-selected');
          }

          let indicator = c.querySelector('.fs-multiselect-indicator');
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'fs-multiselect-indicator';
            indicator.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              this.toggleSongSelection(song);
            };
            c.insertBefore(indicator, c.firstChild);
          }
          indicator.innerHTML = isSelected ? '✓' : '';
          indicator.className = 'fs-multiselect-indicator ' + (isSelected ? 'checked' : '');
        } else {
          row.classList.remove('fs-multiselect-row', 'fs-row-is-selected');
          const indicator = c.querySelector('.fs-multiselect-indicator');
          if (indicator) indicator.remove();
        }
      });
    }

    updateAllVisibleTrackBadges() {
      // 0. Safety cleanup: remove any stray badges injected inside image containers or root playerbar
      document.querySelectorAll(
        '.fs-title-combined-column-module-image-container > .fs-track-tag-badges, ' +
        '.fs-playerbar-module-container > .fs-track-tag-badges, ' +
        '.fs-title-combined-column-module-title > .fs-track-tag-badges'
      ).forEach(el => el.remove());

      // 1. Virtualized Tracks Table (Faixas page / Playlists / Queue)
      // Only target the root table column cells, NEVER the inner image or text containers
      const titleCells = document.querySelectorAll(
        '.fs-item-table-list-column-module-container.fs-title-combined-column-module-title-combined, ' +
        '.fs-item-table-list-column-module-container.fs-title-artist-column-module-title-artist, ' +
        '.fs-item-table-list-column-module-container.fs-song-title-column-module-song-title'
      );

      titleCells.forEach(cell => {
        const song = extractSongFromElement(cell);
        if (!song) return;

        const tags = this.getTagsForSong(song);
        const artistsContainer = cell.querySelector(
          '.fs-title-combined-column-module-artists, .fs-title-artist-column-module-artists'
        );
        if (!artistsContainer) return;

        let badgeWrap = artistsContainer.querySelector(':scope > .fs-track-tag-badges');

        if (tags && tags.length > 0) {
          if (!badgeWrap) {
            badgeWrap = document.createElement('span');
            badgeWrap.className = 'fs-track-tag-badges';
            artistsContainer.appendChild(badgeWrap);
          }
          const badgesHtml = tags.map(t => `
            <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
              🏷️ ${escapeHtml(t.name)}
            </span>
          `).join('');
          if (badgeWrap.innerHTML !== badgesHtml) {
            badgeWrap.innerHTML = badgesHtml;
            badgeWrap.querySelectorAll('.fs-track-tag-badge').forEach(b => {
              b.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = `#/library/genres?tag=${encodeURIComponent(b.getAttribute('data-tag-id'))}`;
              };
            });
          }
        } else if (badgeWrap) {
          badgeWrap.remove();
        }

        // Also populate the Genre Column if enabled in this row
        const rowIndex = cell.getAttribute('data-row-index');
        if (rowIndex && cell.parentElement) {
          const genreCell = cell.parentElement.querySelector(`[data-row-index="${rowIndex}"] > .fs-genre-column-module-genres-container`);
          if (genreCell) {
            let gBadgeWrap = genreCell.querySelector(':scope > .fs-track-tag-badges');
            if (tags && tags.length > 0) {
              if (!gBadgeWrap) {
                gBadgeWrap = document.createElement('span');
                gBadgeWrap.className = 'fs-track-tag-badges';
                genreCell.appendChild(gBadgeWrap);
              }
              const gHtml = tags.map(t => `
                <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
                  🏷️ ${escapeHtml(t.name)}
                </span>
              `).join('');
              if (gBadgeWrap.innerHTML !== gHtml) {
                gBadgeWrap.innerHTML = gHtml;
                gBadgeWrap.querySelectorAll('.fs-track-tag-badge').forEach(b => {
                  b.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.hash = `#/library/genres?tag=${encodeURIComponent(b.getAttribute('data-tag-id'))}`;
                  };
                });
              }
            } else if (gBadgeWrap) {
              gBadgeWrap.remove();
            }
          }
        }
      });

      // 2. ItemDetailList Track Rows (Album Detail / Artist Detail)
      const detailRows = document.querySelectorAll('[class*="item-detail-list-module-track-row"]');
      detailRows.forEach(row => {
        const song = extractSongFromElement(row);
        if (!song) return;

        const tags = this.getTagsForSong(song);
        const titleEl = row.querySelector('[class*="title-column"] span, [class*="title-artist-column"] span');
        if (!titleEl) return;

        let badgeWrap = titleEl.querySelector(':scope > .fs-track-tag-badges');
        if (tags && tags.length > 0) {
          if (!badgeWrap) {
            badgeWrap = document.createElement('span');
            badgeWrap.className = 'fs-track-tag-badges';
            titleEl.appendChild(badgeWrap);
          }
          const badgesHtml = tags.map(t => `
            <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
              🏷️ ${escapeHtml(t.name)}
            </span>
          `).join('');
          if (badgeWrap.innerHTML !== badgesHtml) {
            badgeWrap.innerHTML = badgesHtml;
            badgeWrap.querySelectorAll('.fs-track-tag-badge').forEach(b => {
              b.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = `#/library/genres?tag=${encodeURIComponent(b.getAttribute('data-tag-id'))}`;
              };
            });
          }
        } else if (badgeWrap) {
          badgeWrap.remove();
        }
      });

      // 3. Recently Added Tracks (.ra-tracklist-row)
      document.querySelectorAll('.ra-tracklist-row').forEach(row => {
        const id = row.getAttribute('data-id');
        let song = null;
        if (window.FeishinRecentlyAdded?.getCachedSongs) {
          song = window.FeishinRecentlyAdded.getCachedSongs().find(s => s.id === id);
        }
        if (!song) song = extractSongFromElement(row);
        if (!song) return;

        const tags = this.getTagsForSong(song);
        const titleEl = row.querySelector('.ra-track-title') || row.querySelector('.ra-mobile-track-info');
        if (!titleEl) return;

        let badgeWrap = titleEl.querySelector(':scope > .fs-track-tag-badges');
        if (tags && tags.length > 0) {
          if (!badgeWrap) {
            badgeWrap = document.createElement('span');
            badgeWrap.className = 'fs-track-tag-badges';
            titleEl.appendChild(badgeWrap);
          }
          const badgesHtml = tags.map(t => `
            <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
              🏷️ ${escapeHtml(t.name)}
            </span>
          `).join('');
          if (badgeWrap.innerHTML !== badgesHtml) {
            badgeWrap.innerHTML = badgesHtml;
            badgeWrap.querySelectorAll('.fs-track-tag-badge').forEach(b => {
              b.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = `#/library/genres?tag=${encodeURIComponent(b.getAttribute('data-tag-id'))}`;
              };
            });
          }
        } else if (badgeWrap) {
          badgeWrap.remove();
        }
      });

      // 4. Player Bar ("Tocando Agora") - Inside left-controls artist line
      const playerSong = window.__FEISHIN_PLAYER_STORE__?.getState()?.getCurrentSong?.();
      if (playerSong) {
        const pbArtist = document.querySelector('.fs-left-controls-module-metadata-stack .song-artist');
        if (pbArtist) {
          const tags = this.getTagsForSong(playerSong);
          let pbBadgeWrap = pbArtist.querySelector(':scope > .fs-track-tag-badges');
          if (tags && tags.length > 0) {
            if (!pbBadgeWrap) {
              pbBadgeWrap = document.createElement('span');
              pbBadgeWrap.className = 'fs-track-tag-badges';
              pbArtist.appendChild(pbBadgeWrap);
            }
            const badgesHtml = tags.map(t => `
              <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
                🏷️ ${escapeHtml(t.name)}
              </span>
            `).join('');
            if (pbBadgeWrap.innerHTML !== badgesHtml) {
              pbBadgeWrap.innerHTML = badgesHtml;
              pbBadgeWrap.querySelectorAll('.fs-track-tag-badge').forEach(b => {
                b.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.hash = `#/library/genres?tag=${encodeURIComponent(b.getAttribute('data-tag-id'))}`;
                };
              });
            }
          } else if (pbBadgeWrap) {
            pbBadgeWrap.remove();
          }
        }
      }

      // 5. Fullscreen Player / Track Page
      const tpTitle = document.getElementById('feishin-tp-title') || document.querySelector('.fs-fullscreen-title');
      if (tpTitle && playerSong) {
        const tags = this.getTagsForSong(playerSong);
        let tpBadgeWrap = tpTitle.querySelector(':scope > .fs-track-tag-badges');
        if (tags && tags.length > 0) {
          if (!tpBadgeWrap) {
            tpBadgeWrap = document.createElement('span');
            tpBadgeWrap.className = 'fs-track-tag-badges';
            tpTitle.appendChild(tpBadgeWrap);
          }
          const badgesHtml = tags.map(t => `
            <span class="fs-track-tag-badge" data-tag-id="${t.id}" title="Tag: ${escapeHtml(t.name)}">
              🏷️ ${escapeHtml(t.name)}
            </span>
          `).join('');
          if (tpBadgeWrap.innerHTML !== badgesHtml) {
            tpBadgeWrap.innerHTML = badgesHtml;
            tpBadgeWrap.querySelectorAll('.fs-track-tag-badge').forEach(b => {
              b.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = `#/library/genres?tag=${encodeURIComponent(b.getAttribute('data-tag-id'))}`;
              };
            });
          }
        } else if (tpBadgeWrap) {
          tpBadgeWrap.remove();
        }
      }
    }

    promptCreateTagAndAssign(songs) {
      openTagAssignmentModal(songs);
    }

    playTag(tagId, shuffle = false) {
      const songs = this.getSongsForTag(tagId);
      if (!songs || songs.length === 0) {
        this.showToast('Nenhuma música cadastrada nesta tag para tocar.', 'warning');
        return;
      }
      const playerStore = window.__FEISHIN_PLAYER_STORE__?.getState();
      if (!playerStore) {
        this.showToast('Reprodutor Feishin não disponível.', 'error');
        return;
      }
      try {
        const mode = shuffle ? 'shuffle' : 'now';
        playerStore.addToQueueByType(songs, mode);
        this.showToast(`Reproduzindo tag: ${this.getTag(tagId)?.name} (${songs.length} faixas)`);
      } catch (err) {
        console.error('[Tags Engine] Erro ao reproduzir tag:', err);
        this.showToast('Erro ao iniciar reprodução.', 'error');
      }
    }

    playSong(song) {
      const playerStore = window.__FEISHIN_PLAYER_STORE__?.getState();
      if (!playerStore) return;
      try {
        playerStore.addToQueueByType([song], 'now');
      } catch (err) {
        console.error('[Tags Engine] Erro ao tocar música:', err);
      }
    }

    showToast(message, type = 'success') {
      console.log(`[Tags Toast] [${type.toUpperCase()}] ${message}`);
      if (window.__FEISHIN_NOTIFY__) {
        if (type === 'error') window.__FEISHIN_NOTIFY__.error({ message });
        else if (type === 'warning') window.__FEISHIN_NOTIFY__.info({ message });
        else window.__FEISHIN_NOTIFY__.success({ message });
        return;
      }
      let toastEl = document.getElementById('fs-tags-floating-toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'fs-tags-floating-toast';
        document.body.appendChild(toastEl);
      }
      toastEl.innerText = message;
      toastEl.className = 'fs-tags-toast-active ' + (type === 'error' ? 'toast-error' : '');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toastEl.className = '';
      }, 2600);
    }
  }

  const engine = new TagsEngine();
  window.__FEISHIN_TAGS_ENGINE__ = engine;
  window.TagsEngine = engine;

  // ==========================================================================
  // HELPERS: SONG RESOLVER & RADIX CONTEXT MENU OBSERVER
  // ==========================================================================

  let lastRightClickedElement = null;
  let lastTargetRow = null;

  document.addEventListener('contextmenu', (e) => {
    lastRightClickedElement = e.target;
    lastTargetRow = e.target.closest('[data-row-index], .ra-tracklist-row, .fs-item-table-list-column-module-data-row, [class*="track-row"], [role="row"], tr');
  }, true);

  // Android long-press touch capture
  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      if (el) {
        lastRightClickedElement = el;
        lastTargetRow = el.closest('[data-row-index], .ra-tracklist-row, .fs-item-table-list-column-module-data-row, [class*="track-row"], [role="row"], tr');
      }
    }
  }, { passive: true, capture: true });

  function normalizeSongObject(song) {
    if (!song) return null;
    return {
      id: String(song.id || song.songId || ('trk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7))),
      name: song.name || song.title || 'Faixa sem título',
      title: song.name || song.title || 'Faixa sem título',
      artistName: song.artistName || song.artist || (song.artists?.[0]?.name) || 'Artista Desconhecido',
      album: song.album || song.albumName || 'Álbum',
      albumId: song.albumId || song.id,
      duration: song.duration || 0,
      imageId: song.imageId || song.id,
      imageUrl: song.imageUrl || null,
      thumbHash: song.thumbHash || null,
      _itemType: song._itemType || 'song',
      _serverId: song._serverId || (window.__FEISHIN_SERVER_STORE__?.getState()?.currentServer?.id) || ''
    };
  }

  function findSongFromReactFiber(el) {
    if (!el) return null;
    let curr = el;
    let depth = 0;
    while (curr && depth < 12) {
      const fiberKey = Object.keys(curr).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (fiberKey) {
        let fiber = curr[fiberKey];
        let fDepth = 0;
        while (fiber && fDepth < 20) {
          const props = fiber.memoizedProps || fiber.pendingProps;
          if (props) {
            // Feishin ItemTableListColumn (virtualized table)
            if (typeof props.getRowItem === 'function' && typeof props.rowIndex === 'number') {
              try {
                const item = props.getRowItem(props.rowIndex);
                if (item && (item.id || item.name || item.title)) return item;
              } catch (e) {}
            }
            if (Array.isArray(props.data) && typeof props.rowIndex === 'number' && props.data[props.rowIndex]) {
              const item = props.data[props.rowIndex];
              if (item && (item.id || item.name || item.title)) return item;
            }
            if (props.song && (props.song.id || props.song.name || props.song.title)) return props.song;
            if (props.item && (props.item.id || props.item.name || props.item.title)) return props.item;
            if (props.row?.original && (props.row.original.id || props.row.original.name || props.row.original.title)) return props.row.original;
            if (props.data?.items && typeof props.index === 'number') {
              const item = props.data.items[props.index];
              if (item && (item.id || item.name || item.title)) return item;
            }
            if (Array.isArray(props.items) && props.items.length === 1 && (props.items[0].id || props.items[0].name)) {
              return props.items[0];
            }
          }
          fiber = fiber.return;
          fDepth++;
        }
      }
      curr = curr.parentElement;
      depth++;
    }
    return null;
  }

  function extractSongFromElement(el) {
    if (!el) return null;
    const row = el.closest('[data-row-index], .ra-tracklist-row, .fs-item-table-list-column-module-data-row, [class*="track-row"], [role="row"], tr') || el;

    // 1. Recently Added cached songs
    const dataId = row.getAttribute('data-id') || row.getAttribute('data-song-id');
    if (dataId && window.FeishinRecentlyAdded?.getCachedSongs) {
      const found = window.FeishinRecentlyAdded.getCachedSongs().find(s => s.id === dataId);
      if (found) return normalizeSongObject(found);
    }

    // 2. React fiber
    const fiberSong = findSongFromReactFiber(el) || findSongFromReactFiber(row);
    if (fiberSong) {
      return normalizeSongObject(fiberSong);
    }

    // 3. Image tag with Subsonic ID (e.g. id="mf-5US6IrXl7jzBo7fR5lELGg_...")
    const img = row.querySelector('img');
    const m = img?.id?.match(/mf-([^_]+)/);
    const subsonicSongId = m ? m[1] : null;

    // 4. DOM text - ONLY if title element exists!
    const titleEl = row.querySelector(
      '.fs-title-combined-column-module-title, .fs-song-title-column-module-song-title, .fs-title-artist-column-module-title, .fs-title-column-module-title, .ra-track-title, [class*="title"]'
    ) || (row.classList.contains('fs-title-combined-column-module-title-combined') ? row.querySelector('a, span') : null);

    if (!titleEl && !subsonicSongId && !dataId) {
      return null;
    }

    const artistEl = row.querySelector(
      '.fs-title-combined-column-module-artists, .fs-song-artist-column-module-artist, .fs-artist-column-module-artist, .ra-track-artist, [class*="artist"]'
    );

    const title = titleEl ? titleEl.innerText.trim() : '';
    const artist = artistEl ? artistEl.innerText.trim() : '';

    if (title || subsonicSongId) {
      return normalizeSongObject({
        id: subsonicSongId || dataId || ('track_' + encodeURIComponent(title + '_' + artist).replace(/%/g, '')),
        name: title || 'Música',
        title: title || 'Música',
        artistName: artist || 'Artista',
        album: 'Álbum',
        duration: 0
      });
    }

    return null;
  }

  function extractSongsFromContextMenu(menu) {
    if (!menu) return null;
    const all = [menu, ...menu.querySelectorAll('*')];
    for (const el of all) {
      const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (!fiberKey) continue;
      let f = el[fiberKey];
      let depth = 0;
      while (f && depth < 25) {
        const p = f.memoizedProps;
        if (p) {
          if (Array.isArray(p.items) && p.items.length > 0 && (p.items[0].id || p.items[0].name || p.items[0].title)) {
            return p.items;
          }
          if (Array.isArray(p.songs) && p.songs.length > 0 && (p.songs[0].id || p.songs[0].name || p.songs[0].title)) {
            return p.songs;
          }
          if (Array.isArray(p.cmd?.items) && p.cmd.items.length > 0 && (p.cmd.items[0].id || p.cmd.items[0].name || p.cmd.items[0].title)) {
            return p.cmd.items;
          }
          if (p.song && (p.song.id || p.song.name || p.song.title)) {
            return [p.song];
          }
          if (p.item && (p.item.id || p.item.name || p.item.title)) {
            return [p.item];
          }
        }
        f = f.return;
        depth++;
      }
    }
    return null;
  }

  function getActiveTargetSong() {
    if (lastTargetRow) {
      const song = extractSongFromElement(lastTargetRow);
      if (song) return song;
    }
    if (lastRightClickedElement) {
      const song = extractSongFromElement(lastRightClickedElement);
      if (song) return song;
    }
    const cur = window.__FEISHIN_PLAYER_STORE__?.getState()?.getCurrentSong?.();
    if (cur) return normalizeSongObject(cur);
    return null;
  }

  function getActiveTargetSongs(menu = null) {
    // 1. If context menu is open and contains target songs in its React tree
    if (menu) {
      const contextSongs = extractSongsFromContextMenu(menu);
      if (contextSongs && contextSongs.length > 0) {
        return contextSongs.map(normalizeSongObject);
      }
    } else {
      const activeMenu = document.querySelector('[role="menu"], [data-radix-menu-content]');
      if (activeMenu) {
        const contextSongs = extractSongsFromContextMenu(activeMenu);
        if (contextSongs && contextSongs.length > 0) {
          return contextSongs.map(normalizeSongObject);
        }
      }
    }

    // 2. Custom Multi-Select mode active
    if (engine.isMultiSelectActive && engine.selectedSongs && engine.selectedSongs.size > 0) {
      return Array.from(engine.selectedSongs.values()).map(normalizeSongObject);
    }

    // 3. Native Feishin table selection via internalState
    const targetEl = lastTargetRow || lastRightClickedElement;
    if (targetEl) {
      const fiberKey = Object.keys(targetEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (fiberKey) {
        let f = targetEl[fiberKey];
        while (f) {
          if (f.memoizedProps?.internalState) {
            const state = f.memoizedProps.internalState;
            const selected = state.getSelected ? state.getSelected() : [];
            const rowItem = f.memoizedProps.getRowItem && typeof f.memoizedProps.rowIndex === 'number'
              ? f.memoizedProps.getRowItem(f.memoizedProps.rowIndex)
              : null;
            const rowId = rowItem ? state.extractRowId(rowItem) : null;

            if (selected && selected.length > 1 && rowId && state.isSelected(rowId)) {
              return selected.map(normalizeSongObject);
            }
            if (rowItem) {
              return [normalizeSongObject(rowItem)];
            }
            if (selected && selected.length > 0) {
              return selected.map(normalizeSongObject);
            }
            break;
          }
          f = f.return;
        }
      }
    }

    // 4. Targeted single song fallback
    const single = getActiveTargetSong();
    return single ? [normalizeSongObject(single)] : [];
  }

  engine.extractSongFromElement = extractSongFromElement;
  engine.findSongFromReactFiber = findSongFromReactFiber;
  engine.getActiveTargetSongs = getActiveTargetSongs;
  engine.normalizeSongObject = normalizeSongObject;

  function initContextMenuObserver() {
    if (window.__feishinContextMenuObserver) {
      try { window.__feishinContextMenuObserver.disconnect(); } catch (e) {}
    }
    const observer = new MutationObserver(() => {
      const activeMenus = document.querySelectorAll('[role="menu"], [data-radix-menu-content], .fs-context-menu-module-content, .mantine-Menu-dropdown');
      if (activeMenus.length === 0) return;

      for (const menu of activeMenus) {
        checkAndInjectTagsMenuItem(menu);
      }
    });
    window.__feishinContextMenuObserver = observer;

    const start = () => {
      const target = document.body || document.documentElement;
      if (target) {
        observer.observe(target, { childList: true, subtree: true });
      }
    };

    if (document.body) {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start);
    }
  }

  function checkAndInjectTagsMenuItem(menu) {
    if (!menu || menu.dataset.tagsInjected === 'true') return;
    if (menu.querySelector('.fs-tags-menu-item')) {
      menu.dataset.tagsInjected = 'true';
      return;
    }

    const menuText = (menu.innerText || '').toLowerCase();
    const isSongMenu = menuText.includes('tocar') || menuText.includes('play') ||
                       menuText.includes('playlist') || menuText.includes('informações') ||
                       menuText.includes('baixar') || menuText.includes('deletar');

    if (!isSongMenu) return;
    menu.dataset.tagsInjected = 'true';

    const targetSongs = getActiveTargetSongs(menu);
    if (!targetSongs || targetSongs.length === 0) return;

    // 1. Tag Assignment Item
    const tagItem = document.createElement('div');
    tagItem.className = 'fs-context-menu-module-item fs-context-menu-module-has-left-icon fs-tags-menu-item';
    tagItem.setAttribute('role', 'menuitem');
    tagItem.setAttribute('tabindex', '-1');
    tagItem.setAttribute('data-orientation', 'vertical');
    tagItem.setAttribute('data-radix-collection-item', '');
    tagItem.style.cssText = `
      color: #c4b5fd !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: background 0.15s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    `;

    const label = targetSongs.length > 1
      ? `🏷️ Atribuir Tag (${targetSongs.length} faixas)`
      : `🏷️ Atribuir Tag`;

    tagItem.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fs-context-menu-module-left-icon" style="flex-shrink:0;">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
      <span style="flex: 1;">${label}</span>
      <span style="font-size: 11px; opacity: 0.55; font-weight: 400;">Tag</span>
    `;

    tagItem.onmouseenter = () => {
      tagItem.style.background = 'rgba(167, 139, 250, 0.18)';
    };
    tagItem.onmouseleave = () => {
      tagItem.style.background = 'transparent';
    };

    tagItem.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const backdrop = document.getElementById('feishin-context-backdrop');
      if (backdrop) backdrop.remove();

      setTimeout(() => {
        openTagAssignmentModal(targetSongs);
      }, 50);
    };

    // 2. Multi-Select Toggle Item
    const multiSelectItem = document.createElement('div');
    multiSelectItem.className = 'fs-context-menu-module-item fs-context-menu-module-has-left-icon fs-selection-menu-item';
    multiSelectItem.setAttribute('role', 'menuitem');
    multiSelectItem.setAttribute('tabindex', '-1');
    multiSelectItem.setAttribute('data-orientation', 'vertical');
    multiSelectItem.setAttribute('data-radix-collection-item', '');
    multiSelectItem.style.cssText = `
      color: rgba(255, 255, 255, 0.85) !important;
      font-size: 13px !important;
      cursor: pointer !important;
      transition: background 0.15s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    `;

    multiSelectItem.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fs-context-menu-module-left-icon" style="flex-shrink:0;">
        <polyline points="9 11 12 14 22 4"></polyline>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
      <span>${engine.isMultiSelectActive ? 'Desativar Seleção' : 'Selecionar Múltiplas Faixas'}</span>
    `;

    multiSelectItem.onmouseenter = () => {
      multiSelectItem.style.background = 'rgba(255, 255, 255, 0.08)';
    };
    multiSelectItem.onmouseleave = () => {
      multiSelectItem.style.background = 'transparent';
    };

    multiSelectItem.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const backdrop = document.getElementById('feishin-context-backdrop');
      if (backdrop) backdrop.remove();

      engine.setMultiSelectActive(!engine.isMultiSelectActive, targetSongs);
    };

    const deleteBtn = menu.querySelector('.feishin-delete-menu-item');
    const divider = document.createElement('div');
    divider.className = 'fs-context-menu-module-divider';
    divider.setAttribute('role', 'separator');

    if (deleteBtn && deleteBtn.parentNode) {
      deleteBtn.parentNode.insertBefore(divider, deleteBtn);
      deleteBtn.parentNode.insertBefore(tagItem, divider);
      deleteBtn.parentNode.insertBefore(multiSelectItem, divider);
    } else {
      menu.appendChild(divider);
      menu.appendChild(tagItem);
      menu.appendChild(multiSelectItem);
    }
  }

  // ==========================================================================
  // MODAL ELEGANTE DE ATRIBUIÇÃO DE TAGS (MAC & ANDROID)
  // ==========================================================================

  function openTagAssignmentModal(targetSongs) {
    if (!targetSongs || targetSongs.length === 0) return;
    closeTagModals();

    const isMultiple = targetSongs.length > 1;
    let filterQuery = '';

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'fs-tag-modal-container';
    modalBackdrop.className = 'fs-tag-modal-backdrop fs-tag-assign-backdrop';

    const subtitleText = isMultiple
      ? `${targetSongs.length} faixas selecionadas para atribuição simultânea`
      : `${escapeHtml(targetSongs[0].name || targetSongs[0].title || 'Faixa')} • ${escapeHtml(targetSongs[0].artistName || targetSongs[0].artist || '')}`;

    modalBackdrop.innerHTML = `
      <div class="fs-tag-modal-dialog fs-tag-assign-dialog" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="fs-tag-modal-header">
          <div class="fs-tag-modal-title-group">
            <div class="fs-tag-modal-icon-badge" style="background: rgba(167, 139, 250, 0.2); border-color: rgba(167, 139, 250, 0.4);">
              <span style="font-size: 18px;">🏷️</span>
            </div>
            <div>
              <h2 class="fs-tag-modal-title">Atribuir Tags</h2>
              <span class="fs-tag-assign-subtitle" title="${subtitleText}">${subtitleText}</span>
            </div>
          </div>
          <button type="button" class="fs-tag-modal-close-btn" id="fs-modal-close" title="Fechar (Esc)">✕</button>
        </div>

        <!-- Filter Input -->
        <div class="fs-tag-assign-search-wrap">
          <input type="text" id="fs-tag-assign-filter" placeholder="🔍 Filtrar tags existentes..." class="fs-tag-modal-input" />
        </div>

        <!-- Tags List -->
        <div class="fs-tag-assign-list" id="fs-tag-assign-list"></div>

        <!-- Quick Create Tag -->
        <div class="fs-tag-assign-quick-create">
          <input type="text" id="fs-tag-quick-name" placeholder="+ Criar nova tag e atribuir..." class="fs-tag-modal-input" />
          <button type="button" id="fs-tag-quick-btn" class="fs-modal-btn-save" style="padding: 8px 16px; font-size: 12px; white-space: nowrap;">
            Criar &amp; Atribuir
          </button>
        </div>

        <!-- Footer -->
        <div class="fs-tag-modal-footer">
          <span style="font-size: 11px; color: rgba(255,255,255,0.45);">
            ${isMultiple ? 'Toque nas tags para marcar ou desmarcar nas ' + targetSongs.length + ' faixas.' : 'Toque em uma tag para marcar ou desmarcar.'}
          </span>
          <div class="fs-modal-footer-right">
            <button type="button" id="fs-tag-assign-done" class="fs-modal-btn-save">Concluir</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    function renderTagRows() {
      const listEl = modalBackdrop.querySelector('#fs-tag-assign-list');
      if (!listEl) return;

      let tags = engine.getTags();
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase().trim();
        tags = tags.filter(t => t.name.toLowerCase().includes(q));
      }

      if (tags.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 24px; color: rgba(255,255,255,0.45); font-size: 13px;">
            ${filterQuery ? 'Nenhuma tag encontrada com esse filtro.' : 'Nenhuma tag criada ainda. Digite o nome acima para criar!'}
          </div>
        `;
        return;
      }

      listEl.innerHTML = tags.map(tag => {
        const totalInTag = targetSongs.filter(s => engine.isSongInTag(s, tag.id)).length;
        const allChecked = totalInTag === targetSongs.length;
        const someChecked = totalInTag > 0 && !allChecked;

        return `
          <div class="fs-tag-assign-row ${allChecked ? 'is-checked' : ''} ${someChecked ? 'is-partial' : ''}" data-tag-id="${tag.id}">
            <div class="fs-tag-assign-row-left">
              <div class="fs-tag-assign-thumb" style="background-image: ${safeCssUrl(tag.heroImage)};"></div>
              <div class="fs-tag-assign-name-wrap">
                <span class="fs-tag-assign-name">${escapeHtml(tag.name)}</span>
                <span class="fs-tag-assign-count">${engine.getSongsForTag(tag.id).length} faixas cadastradas</span>
              </div>
            </div>
            <div class="fs-tag-assign-checkbox ${allChecked ? 'checked' : ''} ${someChecked ? 'partial' : ''}">
              ${allChecked ? '✓' : (someChecked ? '–' : '')}
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.fs-tag-assign-row').forEach(row => {
        row.addEventListener('click', () => {
          const tId = row.getAttribute('data-tag-id');
          if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(15);
          engine.toggleTracksTag(targetSongs, tId);
          renderTagRows();
        });
      });
    }

    renderTagRows();

    // Event handlers
    const filterInput = modalBackdrop.querySelector('#fs-tag-assign-filter');
    filterInput?.addEventListener('input', (e) => {
      filterQuery = e.target.value;
      renderTagRows();
    });

    const quickInput = modalBackdrop.querySelector('#fs-tag-quick-name');
    const quickBtn = modalBackdrop.querySelector('#fs-tag-quick-btn');

    const handleCreateQuick = () => {
      const name = (quickInput?.value || '').trim();
      if (!name) return;
      const newTag = engine.createTag(name);
      if (newTag) {
        engine.assignTagToSongs(targetSongs, newTag.id);
        if (quickInput) quickInput.value = '';
        renderTagRows();
      }
    };

    quickBtn?.addEventListener('click', handleCreateQuick);
    quickInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateQuick();
      }
    });

    modalBackdrop.querySelector('#fs-modal-close')?.addEventListener('click', () => {
      closeTagModals();
      engine.updateAllVisibleTrackBadges();
    });
    modalBackdrop.querySelector('#fs-tag-assign-done')?.addEventListener('click', () => {
      closeTagModals();
      engine.updateAllVisibleTrackBadges();
      engine.showToast(`Tags atualizadas com sucesso para ${targetSongs.length} faixa(s)!`);
      if (engine.isMultiSelectActive) {
        engine.setMultiSelectActive(false);
      }
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeTagModals();
    });
  }

  engine.openTagAssignmentModal = openTagAssignmentModal;

  // ==========================================================================
  // BARRA FLUTUANTE DE SELEÇÃO MÚLTIPLA
  // ==========================================================================

  function renderMultiSelectFloatingBar() {
    let bar = document.getElementById('fs-multiselect-floating-bar');
    if (!engine.isMultiSelectActive) {
      if (bar) bar.remove();
      return;
    }
    const count = engine.selectedSongs.size;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'fs-multiselect-floating-bar';
      bar.className = 'fs-multiselect-bar-container';
      document.body.appendChild(bar);
    }

    const playerBar = document.getElementById('player-bar');
    const isPlayerVisible = Boolean(playerBar && !playerBar.classList.contains('feishin-player-hidden') && (playerBar.offsetHeight > 0 || (window.__FEISHIN_PLAYER_STORE__ && window.__FEISHIN_PLAYER_STORE__.getState()?.status !== 'stopped')));
    if (isPlayerVisible) {
      bar.classList.add('has-player');
    } else {
      bar.classList.remove('has-player');
    }

    bar.innerHTML = `
      <div class="fs-multiselect-bar-glass">
        <div class="fs-multiselect-bar-header">
          <div class="fs-multiselect-bar-info">
            <div class="fs-multiselect-bar-count-badge">${count}</div>
            <span class="fs-multiselect-bar-label">${count === 1 ? '1 faixa selecionada' : `${count} faixas selecionadas`}</span>
          </div>
          <button type="button" id="fs-ms-close" class="fs-ms-btn-close" aria-label="Sair da Seleção" title="Sair da Seleção">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="fs-multiselect-bar-actions">
          <button type="button" id="fs-ms-select-all" class="fs-ms-btn fs-ms-btn-secondary">Selecionar tudo</button>
          <button type="button" id="fs-ms-clear" class="fs-ms-btn fs-ms-btn-secondary">Limpar</button>
          <button type="button" id="fs-ms-assign-tag" class="fs-ms-btn fs-ms-btn-primary" ${count === 0 ? 'disabled' : ''}>
            🏷️ Atribuir Tag
          </button>
        </div>
      </div>
    `;

    bar.querySelector('#fs-ms-select-all')?.addEventListener('click', () => {
      engine.selectAllVisible();
    });
    bar.querySelector('#fs-ms-clear')?.addEventListener('click', () => {
      engine.clearSelection();
    });
    bar.querySelector('#fs-ms-assign-tag')?.addEventListener('click', () => {
      if (engine.selectedSongs.size > 0) {
        openTagAssignmentModal(Array.from(engine.selectedSongs.values()));
      }
    });
    bar.querySelector('#fs-ms-close')?.addEventListener('click', () => {
      engine.setMultiSelectActive(false);
    });
  }

  function removeMultiSelectFloatingBar() {
    const bar = document.getElementById('fs-multiselect-floating-bar');
    if (bar) bar.remove();
  }

  function initHeaderSelectButtonObserver() {
    const checkHeader = () => {
      const hash = window.location.hash || '';
      const isTracksPage = hash.includes('songs') || hash.includes('recently-added') || hash.includes('playlist');
      if (!isTracksPage) return;

      const toolbar = document.querySelector('.fs-song-list-header-module-actions, .ra-action-buttons-row, .fs-item-list-header-actions, .fs-header-actions');
      if (toolbar && !toolbar.querySelector('#fs-toolbar-select-btn')) {
        const btn = document.createElement('button');
        btn.id = 'fs-toolbar-select-btn';
        btn.type = 'button';
        btn.className = 'ra-glass-btn fs-toolbar-select-btn';
        btn.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        `;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>${engine.isMultiSelectActive ? 'Cancelar' : 'Selecionar'}</span>
        `;
        btn.onclick = () => {
          engine.setMultiSelectActive(!engine.isMultiSelectActive);
          btn.querySelector('span').innerText = engine.isMultiSelectActive ? 'Cancelar' : 'Selecionar';
        };
        toolbar.appendChild(btn);
      }
    };

    window.addEventListener('hashchange', checkHeader);
    checkHeader();
  }

  function initReactiveBadgesObserver() {
    if (window.__feishinReactiveBadgesObserver) {
      try { window.__feishinReactiveBadgesObserver.disconnect(); } catch (e) {}
    }
    let timer = null;
    const debouncedUpdate = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        engine.updateAllVisibleTrackBadges();
        if (engine.isMultiSelectActive) {
          engine.updateSelectionRowDecorations();
          renderMultiSelectFloatingBar();
        }
      }, 120);
    };

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          for (let i = 0; i < m.addedNodes.length; i++) {
            const node = m.addedNodes[i];
            if (node.nodeType === 1) {
              if (node.classList?.contains('fs-track-tag-badges') || node.classList?.contains('fs-track-tag-badge')) {
                continue;
              }
              if (
                node.getAttribute?.('data-row-index') !== null ||
                node.className?.includes?.('item-table') ||
                node.className?.includes?.('track-row') ||
                node.className?.includes?.('main-content') ||
                node.querySelector?.('[data-row-index]')
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        if (shouldUpdate) break;
      }
      if (shouldUpdate) debouncedUpdate();
    });
    window.__feishinReactiveBadgesObserver = observer;

    const start = () => {
      const target = document.body || document.documentElement;
      if (target) {
        observer.observe(target, { childList: true, subtree: true, attributes: false });
        window.addEventListener('scroll', debouncedUpdate, { passive: true });
        window.addEventListener('resize', debouncedUpdate, { passive: true });
        window.addEventListener('hashchange', () => setTimeout(debouncedUpdate, 300));
      }
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
  }

  function injectTagCustomStyles() {
    if (document.getElementById('fs-tag-custom-injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'fs-tag-custom-injected-styles';
    style.textContent = `
      /* Artist line flex container: keeps artist and tags on one neat 18px line */
      .fs-title-combined-column-module-artists,
      .fs-title-artist-column-module-artists {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        white-space: nowrap !important;
      }
      .fs-title-combined-column-module-artists > span:first-child,
      .fs-title-artist-column-module-artists > span:first-child {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        flex-shrink: 1 !important;
      }
      .fs-left-controls-module-metadata-stack .song-artist {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }

      /* Badge Container */
      .fs-track-tag-badges {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        vertical-align: middle !important;
        margin-left: 4px !important;
        flex-shrink: 0 !important;
        pointer-events: auto !important;
      }

      /* Tag Badge Pill */
      .fs-track-tag-badge, .ra-track-tag-pill {
        display: inline-flex !important;
        align-items: center !important;
        gap: 3px !important;
        height: 15px !important;
        padding: 0 6px !important;
        border-radius: 999px !important;
        font-size: 9.5px !important;
        font-weight: 600 !important;
        line-height: 15px !important;
        letter-spacing: -0.1px !important;
        background: rgba(168, 85, 247, 0.22) !important;
        color: #e9d5ff !important;
        border: 1px solid rgba(168, 85, 247, 0.45) !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
        white-space: nowrap !important;
      }
      .fs-track-tag-badge:hover, .ra-track-tag-pill:hover {
        background: rgba(168, 85, 247, 0.45) !important;
        border-color: rgba(192, 132, 252, 0.75) !important;
        color: #ffffff !important;
        transform: translateY(-1px) scale(1.02) !important;
      }
      .fs-tag-assign-backdrop {
        background: rgba(8, 6, 18, 0.22) !important;
        backdrop-filter: blur(8px) saturate(190%) contrast(105%) !important;
        -webkit-backdrop-filter: blur(8px) saturate(190%) contrast(105%) !important;
      }
      .fs-tag-assign-dialog {
        max-width: min(440px, 92vw) !important;
        width: 100% !important;
        background: rgba(20, 16, 38, 0.48) !important;
        backdrop-filter: blur(32px) saturate(210%) contrast(110%) !important;
        -webkit-backdrop-filter: blur(32px) saturate(210%) contrast(110%) !important;
        border: 1px solid rgba(255, 255, 255, 0.22) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.45) !important;
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 0 35px rgba(139, 92, 246, 0.22) !important;
      }
      .fs-tag-assign-subtitle {
        font-size: 11.5px !important;
        color: rgba(255, 255, 255, 0.7) !important;
        display: block !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        max-width: 320px !important;
      }
      .fs-tag-assign-search-wrap {
        padding: 12px 24px 6px !important;
      }
      .fs-tag-modal-input {
        width: 100% !important;
        padding: 9px 14px !important;
        border-radius: 12px !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.16) !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
        color: #ffffff !important;
        font-size: 13px !important;
        outline: none !important;
        box-sizing: border-box !important;
        transition: all 0.2s ease !important;
      }
      .fs-tag-modal-input:focus {
        border-color: rgba(167, 139, 250, 0.6) !important;
        background: rgba(167, 139, 250, 0.14) !important;
        box-shadow: 0 0 16px rgba(167, 139, 250, 0.3) !important;
      }
      .fs-tag-assign-list {
        max-height: 40vh !important;
        overflow-y: auto !important;
        padding: 6px 24px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      .fs-tag-assign-row {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 9px 14px !important;
        border-radius: 14px !important;
        background: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
        cursor: pointer !important;
        transition: all 0.18s ease !important;
      }
      .fs-tag-assign-row:hover {
        background: rgba(255, 255, 255, 0.12) !important;
        border-color: rgba(255, 255, 255, 0.24) !important;
      }
      .fs-tag-assign-row.is-checked {
        background: rgba(139, 92, 246, 0.26) !important;
        border-color: rgba(167, 139, 250, 0.5) !important;
        box-shadow: 0 4px 18px rgba(139, 92, 246, 0.28) !important;
      }
      .fs-tag-assign-row.is-partial {
        background: rgba(245, 158, 11, 0.14) !important;
        border-color: rgba(245, 158, 11, 0.35) !important;
      }
      .fs-tag-assign-row-left {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
      }
      .fs-tag-assign-thumb {
        width: 36px !important;
        height: 36px !important;
        border-radius: 9px !important;
        background-size: cover !important;
        background-position: center !important;
        flex-shrink: 0 !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
      }
      .fs-tag-assign-name-wrap {
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
      }
      .fs-tag-assign-name {
        font-size: 13.5px !important;
        font-weight: 600 !important;
        color: #ffffff !important;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5) !important;
      }
      .fs-tag-assign-count {
        font-size: 11px !important;
        color: rgba(255, 255, 255, 0.65) !important;
      }
      .fs-tag-assign-checkbox {
        width: 22px !important;
        height: 22px !important;
        border-radius: 7px !important;
        border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 13px !important;
        font-weight: bold !important;
        color: #ffffff !important;
        transition: all 0.18s ease !important;
      }
      .fs-tag-assign-checkbox.checked {
        background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
        border-color: #a78bfa !important;
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.4) !important;
      }
      .fs-tag-assign-checkbox.partial {
        background: rgba(245, 158, 11, 0.8) !important;
        border-color: #fbbf24 !important;
      }
      .fs-tag-assign-quick-create {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 10px 24px !important;
        background: rgba(255, 255, 255, 0.03) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      .fs-tag-modal-footer {
        background: rgba(0, 0, 0, 0.18) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
      }
      /* Multi-select: ocultar numeração de faixa e play/pause nativo para layout limpo sem duplicidade */
      body.fs-multiselect-active .fs-row-index-column-module-content,
      body.fs-multiselect-active [data-column-id="rowIndex"] .fs-item-table-list-column-module-content,
      body.fs-multiselect-active .fs-row-play-control-popover-module-target,
      body.fs-multiselect-active .fs-row-index-column-module-index-content {
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }

      /* Multi-select: ocultar alphabet scrubber para evitar sobreposição na margem direita */
      body.fs-multiselect-active #fs-alphabet-scrubber-container,
      body.fs-multiselect-active .fs-alphabet-scrubber-container,
      body.fs-multiselect-active [class*="alphabet-scrubber"] {
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }

      /* Multi-select: rolagem inferior ampla para não cobrir últimas faixas */
      body.fs-multiselect-active .fs-item-table-list-module-scroll-container,
      body.fs-multiselect-active [class*="scroll-container"],
      body.fs-multiselect-active .fs-main-content-module-main-content-body {
        padding-bottom: 230px !important;
      }

      .fs-multiselect-bar-container {
        position: fixed !important;
        bottom: calc(56px + var(--sab, env(safe-area-inset-bottom, 0px)) + 12px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 99990 !important;
        width: calc(100vw - 24px) !important;
        max-width: 440px !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        animation: feishinMenuCenterPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        transition: bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease !important;
      }
      .fs-multiselect-bar-container.has-player,
      body:has(#player-bar:not(.feishin-player-hidden):not([style*="display: none"])) .fs-multiselect-bar-container {
        bottom: calc(56px + var(--sab, env(safe-area-inset-bottom, 0px)) + 64px + 16px) !important;
      }
      .fs-multiselect-bar-glass {
        pointer-events: auto !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        background: rgba(18, 18, 28, 0.94) !important;
        border: 1px solid rgba(167, 139, 250, 0.35) !important;
        border-radius: 20px !important;
        padding: 12px 14px !important;
        backdrop-filter: blur(28px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(139, 92, 246, 0.25) !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }
      .fs-multiselect-bar-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
      }
      .fs-multiselect-bar-info {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .fs-multiselect-bar-count-badge {
        min-width: 22px !important;
        height: 22px !important;
        padding: 0 6px !important;
        border-radius: 99px !important;
        background: #8b5cf6 !important;
        color: #ffffff !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .fs-multiselect-bar-label {
        font-size: 13.5px !important;
        font-weight: 600 !important;
        color: #ffffff !important;
        white-space: nowrap !important;
      }
      .fs-ms-btn-close {
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        border-radius: 50% !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: rgba(255, 255, 255, 0.7) !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        padding: 0 !important;
      }
      .fs-ms-btn-close:hover, .fs-ms-btn-close:active {
        background: rgba(239, 68, 68, 0.25) !important;
        border-color: rgba(239, 68, 68, 0.5) !important;
        color: #ffffff !important;
      }
      .fs-multiselect-bar-actions {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        width: 100% !important;
      }
      .fs-ms-btn {
        flex: 1 1 0 !important;
        min-width: 0 !important;
        height: 38px !important;
        padding: 0 8px !important;
        border-radius: 12px !important;
        font-size: 12.5px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        border: 1px solid transparent !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
      }
      .fs-ms-btn-secondary {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.12) !important;
        color: rgba(255, 255, 255, 0.9) !important;
      }
      .fs-ms-btn-secondary:hover, .fs-ms-btn-secondary:active {
        background: rgba(255, 255, 255, 0.16) !important;
        color: #ffffff !important;
      }
      .fs-ms-btn-primary {
        flex: 1.3 1 0 !important;
        background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
        border-color: rgba(255, 255, 255, 0.25) !important;
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(109, 40, 217, 0.4) !important;
      }
      .fs-ms-btn-primary:hover, .fs-ms-btn-primary:active {
        filter: brightness(1.15) !important;
        transform: translateY(-1px) !important;
      }
      .fs-ms-btn-primary[disabled] {
        opacity: 0.4 !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
        transform: none !important;
      }
      .fs-multiselect-indicator {
        width: 22px !important;
        height: 22px !important;
        border-radius: 50% !important;
        border: 2px solid rgba(255, 255, 255, 0.35) !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 11px !important;
        font-weight: bold !important;
        color: #ffffff !important;
        margin-right: 8px !important;
        flex-shrink: 0 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
      }
      .fs-multiselect-indicator.checked {
        background: #8b5cf6 !important;
        border-color: #a78bfa !important;
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.5) !important;
      }
      .fs-row-is-selected {
        background: rgba(139, 92, 246, 0.16) !important;
        border-left: 3px solid #8b5cf6 !important;
      }

      @media (min-width: 640px) {
        .fs-multiselect-bar-container {
          width: auto !important;
          max-width: 90vw !important;
        }
        .fs-multiselect-bar-glass {
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 8px 16px !important;
          gap: 16px !important;
        }
        .fs-multiselect-bar-header {
          width: auto !important;
          gap: 12px !important;
        }
        .fs-multiselect-bar-actions {
          width: auto !important;
          gap: 8px !important;
        }
        .fs-ms-btn {
          flex: none !important;
          padding: 7px 14px !important;
          height: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getTagParamFromHash() {
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return null;
    try {
      const searchParams = new URLSearchParams(hash.slice(qIndex));
      return searchParams.get('tag') || null;
    } catch (e) {
      const match = hash.match(/[?&]tag=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }
  // 5. TAGS PAGE VIEW RENDERER (Hero Boxes & Tag Editor + Tabs View)
  function initTagsPageRouter() {
    function checkRoute() {
      const hash = window.location.hash || '';
      const isTagsRoute = hash.startsWith('#/library/genres') || hash.startsWith('#/library/tags');
      const mainBody = document.querySelector('.fs-main-content-module-main-content-body') || document.querySelector('main');

      if (isTagsRoute) {
        const tagParam = getTagParamFromHash();
        const tagChanged = engine.openedBoxTagId !== tagParam;
        if (tagChanged) {
          engine.openedBoxTagId = tagParam;
        }
        ensureTagsPageMounted(mainBody, tagChanged);
      } else {
        engine.openedBoxTagId = null;
        const mountedEl = document.getElementById('fs-tags-page-mount');
        if (mountedEl) mountedEl.style.display = 'none';
        if (mainBody) {
          const isOtherCustom = hash.includes('recently-added') || hash.includes('analytics');
          if (!isOtherCustom) {
            Array.from(mainBody.children).forEach(ch => {
              if (ch.id !== 'fs-tags-page-mount' && ch.id !== 'feishin-recently-added-view' && ch.id !== 'feishin-analytics-dashboard' && ch.style.display === 'none') {
                ch.style.display = '';
              }
            });
          }
        }
      }
    }

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    checkRoute();
  }

  function ensureTagsPageMounted(mainBody, shouldReRender = false) {
    if (!mainBody) {
      mainBody = document.querySelector('.fs-main-content-module-main-content-body') || document.querySelector('main');
      if (!mainBody) return;
    }

    let mountEl = document.getElementById('fs-tags-page-mount');
    if (!mountEl || !mainBody.contains(mountEl)) {
      // Oculta corpo nativo de gêneros
      Array.from(mainBody.children).forEach(ch => {
        if (ch.id !== 'fs-tags-page-mount') ch.style.display = 'none';
      });

      if (!mountEl) {
        mountEl = document.createElement('div');
        mountEl.id = 'fs-tags-page-mount';
        mountEl.className = 'fs-tags-page-root';
      }
      mainBody.appendChild(mountEl);

      engine.subscribe(() => {
        const curMount = document.getElementById('fs-tags-page-mount');
        if (curMount) renderTagsPage(curMount);
      });
      renderTagsPage(mountEl);
    } else {
      mountEl.style.display = 'flex';
      Array.from(mainBody.children).forEach(ch => {
        if (ch.id !== 'fs-tags-page-mount' && ch.style.display !== 'none') {
          ch.style.display = 'none';
        }
      });
      if (shouldReRender || !mountEl.hasChildNodes() || mountEl.innerHTML.trim() === '') {
        renderTagsPage(mountEl);
      }
    }
  }

  // ==========================================================================
  // HELPERS: ESCAPE, IMAGE PROCESSOR & MODAL ENGINE
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isDataUrl(url) {
    return typeof url === 'string' && url.startsWith('data:');
  }

  function safeCssUrl(url) {
    if (!url) return '';
    const clean = String(url).replace(/'/g, "\\'");
    return `url('${clean}')`;
  }

  function closeTagModals() {
    const existing = document.getElementById('fs-tag-modal-container');
    if (existing) existing.remove();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTagModals();
    }
  });

  // UPLOAD UNIVERSAL DE IMAGEM (QUALQUER FORMATO)
  // Suporta PNG, JPG, WEBP, GIF, SVG, AVIF, BMP, ICO.
  // Preserva SVGs vetoriais e GIFs animados. Redimensiona imagens raster grandes via Canvas.
  function processImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Nenhum arquivo fornecido'));

      const isSvg = file.type === 'image/svg+xml' || (file.name && file.name.toLowerCase().endsWith('.svg'));
      const isGif = file.type === 'image/gif' || (file.name && file.name.toLowerCase().endsWith('.gif'));

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem'));
      reader.onload = (e) => {
        const dataUrl = e.target.result;

        // Manter integridade pura de SVG vetorial e GIF animado
        // Arquivos leves (< 250KB) também não necessitam de recompressão
        if (isSvg || isGif || file.size < 250 * 1024) {
          return resolve(dataUrl);
        }

        // Para fotos e imagens de alta resolução (PNG/JPG/WEBP/AVIF/BMP):
        // Redimensionar para no máximo 1280px para garantir nitidez retina sem estourar localStorage
        const img = new Image();
        img.onerror = () => resolve(dataUrl);
        img.onload = () => {
          try {
            const maxDim = 1280;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let optimizedUrl = canvas.toDataURL('image/webp', 0.88);
            if (!optimizedUrl || optimizedUrl.length < 50) {
              optimizedUrl = canvas.toDataURL('image/jpeg', 0.88);
            }
            resolve(optimizedUrl || dataUrl);
          } catch (err) {
            resolve(dataUrl);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // MODAL CONFIRMAÇÃO DE EXCLUSÃO (MINIMALISTA)
  function openDeleteConfirmModal(tagId) {
    closeTagModals();
    const tag = engine.getTag(tagId);
    if (!tag) return;

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'fs-tag-modal-container';
    modalBackdrop.className = 'fs-tag-modal-backdrop';

    modalBackdrop.innerHTML = `
      <div class="fs-tag-modal-dialog fs-delete-dialog" role="dialog" aria-modal="true">
        <div class="fs-delete-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </div>
        <h3 class="fs-delete-title">Excluir Tag</h3>
        <p class="fs-delete-msg">
          Deseja realmente apagar a tag <strong>"${escapeHtml(tag.name)}"</strong>?<br>
          As músicas permanecerão intactas na sua biblioteca.
        </p>
        <div class="fs-delete-actions">
          <button type="button" class="fs-modal-btn-cancel" id="fs-delete-cancel">Cancelar</button>
          <button type="button" class="fs-btn-confirm-delete" id="fs-delete-confirm">Sim, Excluir</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    modalBackdrop.querySelector('#fs-delete-cancel')?.addEventListener('click', closeTagModals);
    modalBackdrop.querySelector('#fs-delete-confirm')?.addEventListener('click', () => {
      engine.deleteTag(tagId);
      closeTagModals();
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeTagModals();
    });
  }

  // MODAL ELEGANTE DO TAG EDITOR (CRIAR / EDITAR)
  function openTagEditorModal(tagId = null, initialSongs = null) {
    closeTagModals();

    const isEdit = Boolean(tagId);
    const tag = isEdit ? engine.getTag(tagId) : null;
    if (isEdit && !tag) return;

    let currentName = tag ? tag.name : '';
    let currentImage = tag ? tag.heroImage : PRESET_HEROES[Math.floor(Math.random() * PRESET_HEROES.length)].url;

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'fs-tag-modal-container';
    modalBackdrop.className = 'fs-tag-modal-backdrop';

    modalBackdrop.innerHTML = `
      <div class="fs-tag-modal-dialog" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="fs-tag-modal-header">
          <div class="fs-tag-modal-title-group">
            <div class="fs-tag-modal-icon-badge">
              <span>${isEdit ? '✏️' : '✨'}</span>
            </div>
            <div>
              <h2 class="fs-tag-modal-title">${isEdit ? 'Editar Tag' : 'Criar Nova Tag'}</h2>
              <span style="font-size: 11.5px; color: rgba(255,255,255,0.45);">Personalize o nome e a Hero Image da sua tag</span>
            </div>
          </div>
          <button type="button" class="fs-tag-modal-close-btn" id="fs-modal-close" title="Fechar (Esc)">✕</button>
        </div>

        <!-- Body -->
        <div class="fs-tag-modal-body">
          <!-- Left: Real-time Live Preview -->
          <div class="fs-tag-modal-preview-col">
            <span class="fs-tag-modal-label">PRÉVIA EM TEMPO REAL</span>
            <div class="fs-hero-box fs-modal-preview-card" id="fs-modal-preview-box" style="background-image: ${safeCssUrl(currentImage)};">
              <div class="fs-hero-box-overlay"></div>
              <div class="fs-hero-box-top">
                <span class="fs-hero-box-tag-pill">🏷️ Tag</span>
                <span class="fs-hero-box-count-pill">${isEdit ? engine.getSongsForTag(tag.id).length : (initialSongs ? initialSongs.length : 0)} faixas</span>
              </div>
              <div class="fs-hero-box-bottom">
                <h3 class="fs-hero-box-title" id="fs-modal-preview-title">${escapeHtml(currentName) || 'Nome da Tag'}</h3>
                <div class="fs-hero-box-actions" style="opacity: 0.85; pointer-events: none;">
                  <div class="fs-hero-btn-play"><span>▶ Tocar Tag</span></div>
                </div>
              </div>
            </div>
            <span class="fs-tag-preview-hint">Esta imagem é exibida no card da biblioteca e no banner superior da playlist.</span>
          </div>

          <!-- Right: Controls -->
          <div class="fs-tag-modal-form-col">
            <!-- Tag Name Input -->
            <div class="fs-modal-field-group">
              <label class="fs-tag-modal-label" for="fs-modal-input-name">NOME DA TAG *</label>
              <input type="text" id="fs-modal-input-name" class="fs-modal-text-input" placeholder="Ex: Synthwave, Madrugada, Jazz & Soul..." value="${escapeHtml(currentName)}" autocomplete="off" />
            </div>

            <!-- Image Upload Dropzone -->
            <div class="fs-modal-field-group">
              <label class="fs-tag-modal-label">HERO IMAGE (UPLOAD DE QUALQUER FORMATO)</label>
              
              <div class="fs-tag-upload-dropzone" id="fs-tag-dropzone">
                <input type="file" id="fs-tag-file-input" accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.avif,.bmp,.ico" style="display: none;" />
                <div class="fs-dropzone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div class="fs-dropzone-text" id="fs-dropzone-label">
                  <strong>Clique para selecionar</strong> ou arraste qualquer imagem aqui
                </div>
                <div class="fs-dropzone-subtext" id="fs-dropzone-sublabel">
                  Suporta PNG, JPG, WEBP, GIF, SVG, AVIF (otimização e retina sharp)
                </div>
              </div>

              <!-- Secondary Option: URL / Presets -->
              <div class="fs-modal-secondary-options">
                <details class="fs-modal-details" id="fs-modal-details-presets">
                  <summary class="fs-modal-details-summary">Ou use uma URL de imagem / Presets rápidos</summary>
                  <div class="fs-modal-details-content">
                    <input type="text" id="fs-modal-input-url" class="fs-modal-text-input" placeholder="Cole uma URL (https://...)" value="${isDataUrl(currentImage) ? '' : escapeHtml(currentImage)}" />
                    <div class="fs-presets-chips-compact">
                      ${PRESET_HEROES.map(p => `
                        <button type="button" class="fs-preset-chip-compact" data-url="${p.url}">
                          <span>${p.icon}</span> <span>${p.name}</span>
                        </button>
                      `).join('')}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="fs-tag-modal-footer">
          <div>
            ${isEdit ? `
              <button type="button" class="fs-modal-btn-delete" id="fs-modal-delete-btn" title="Excluir esta tag permanentemente">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Excluir Tag</span>
              </button>
            ` : ''}
          </div>
          <div class="fs-modal-footer-right">
            <button type="button" class="fs-modal-btn-cancel" id="fs-modal-cancel-btn">Cancelar</button>
            <button type="button" class="fs-modal-btn-save" id="fs-modal-save-btn">
              <span>${isEdit ? 'Salvar Alterações' : 'Criar Tag'}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    // Elements
    const nameInput = modalBackdrop.querySelector('#fs-modal-input-name');
    const urlInput = modalBackdrop.querySelector('#fs-modal-input-url');
    const previewBox = modalBackdrop.querySelector('#fs-modal-preview-box');
    const previewTitle = modalBackdrop.querySelector('#fs-modal-preview-title');
    const dropzone = modalBackdrop.querySelector('#fs-tag-dropzone');
    const fileInput = modalBackdrop.querySelector('#fs-tag-file-input');
    const dropzoneLabel = modalBackdrop.querySelector('#fs-dropzone-label');
    const dropzoneSublabel = modalBackdrop.querySelector('#fs-dropzone-sublabel');
    const closeBtn = modalBackdrop.querySelector('#fs-modal-close');
    const cancelBtn = modalBackdrop.querySelector('#fs-modal-cancel-btn');
    const saveBtn = modalBackdrop.querySelector('#fs-modal-save-btn');
    const deleteBtn = modalBackdrop.querySelector('#fs-modal-delete-btn');

    // Autofocus name input
    setTimeout(() => nameInput?.focus(), 60);

    // Live update title
    nameInput?.addEventListener('input', () => {
      currentName = nameInput.value;
      previewTitle.textContent = currentName.trim() || 'Nome da Tag';
    });

    // Helper to update active image
    function updateActiveImage(imgSrc, sourceLabel = null) {
      currentImage = imgSrc;
      previewBox.style.backgroundImage = `url('${imgSrc}')`;
      if (sourceLabel) {
        dropzoneLabel.innerHTML = `<strong>${escapeHtml(sourceLabel)}</strong> pronta!`;
        dropzoneSublabel.innerHTML = `<span class="fs-dropzone-loaded-badge">✓ Imagem carregada</span> Clique para trocar`;
      }
    }

    // Dropzone Click
    dropzone?.addEventListener('click', (e) => {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });

    // Handle File
    async function handleFile(file) {
      if (!file) return;
      try {
        dropzoneLabel.innerHTML = '<strong>Carregando imagem...</strong>';
        dropzoneSublabel.textContent = 'Processando e otimizando formato...';
        const dataUrl = await processImageFile(file);
        updateActiveImage(dataUrl, file.name);
      } catch (err) {
        console.error('[Tags Engine] Erro no upload da imagem:', err);
        engine.showToast('Erro ao processar imagem selecionada.', 'error');
        dropzoneLabel.innerHTML = '<strong>Clique para selecionar</strong> ou arraste qualquer imagem';
        dropzoneSublabel.textContent = 'Suporta PNG, JPG, WEBP, GIF, SVG, AVIF';
      }
    }

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });

    // Drag and Drop
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });

    dropzone?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // URL input
    urlInput?.addEventListener('input', () => {
      const val = urlInput.value.trim();
      if (val) {
        updateActiveImage(val);
      }
    });

    // Preset Chips
    modalBackdrop.querySelectorAll('.fs-preset-chip-compact').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-url');
        if (url) {
          if (urlInput) urlInput.value = url;
          updateActiveImage(url, btn.textContent.trim());
        }
      });
    });

    // Save Action
    function submitModal() {
      const finalName = (nameInput?.value || '').trim();
      if (!finalName) {
        engine.showToast('Por favor, informe o nome da tag.', 'warning');
        nameInput?.focus();
        return;
      }

      if (isEdit) {
        engine.updateTag(tag.id, {
          name: finalName,
          heroImage: currentImage
        });
      } else {
        const newTag = engine.createTag(finalName, currentImage);
        if (newTag && initialSongs && initialSongs.length) {
          initialSongs.forEach(s => engine.assignTrack(s, newTag.id));
        }
      }

      closeTagModals();
    }

    saveBtn?.addEventListener('click', submitModal);

    nameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitModal();
      }
    });

    // Delete Action
    deleteBtn?.addEventListener('click', () => {
      closeTagModals();
      openDeleteConfirmModal(tag.id);
    });

    // Close actions
    closeBtn?.addEventListener('click', closeTagModals);
    cancelBtn?.addEventListener('click', closeTagModals);

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeTagModals();
      }
    });
  }

  // ==========================================================================
  // RENDER MAIN TAGS PAGE
  // ==========================================================================
  function renderTagsPage(container) {
    const allTags = engine.getTags();
    const viewMode = engine.viewMode; // 'boxes' | 'tabs'

    container.innerHTML = `
      <div class="fs-tags-container">
        <!-- TOP CONTROL BAR WITH VIEW TOGGLE & ACTIONS -->
        <div class="fs-tags-top-bar">
          <div class="fs-tags-title-block">
            <h1 class="fs-tags-title">🏷️ Tags</h1>
            <span class="fs-tags-count-badge">${allTags.length} tags</span>
          </div>

          <div class="fs-tags-top-bar-actions">
            <button type="button" class="fs-btn-new-tag-primary" id="fs-btn-top-new-tag" title="Criar Nova Tag com Hero Image">
              <span style="font-size: 15px; font-weight: 800;">+</span>
              <span>Nova Tag</span>
            </button>

            <!-- THE TOGGLE SWITCH -->
            <div class="fs-tags-toggle-switch">
              <button type="button" class="fs-tags-toggle-btn ${viewMode === 'boxes' ? 'active' : ''}" id="fs-toggle-boxes">
                <span>📦</span>
                <span>Box</span>
              </button>
              <button type="button" class="fs-tags-toggle-btn ${viewMode === 'tabs' ? 'active' : ''}" id="fs-toggle-tabs">
                <span>📑</span>
                <span>Abas</span>
              </button>
            </div>
          </div>
        </div>

        <!-- MAIN VIEW CONTAINER -->
        <div id="fs-tags-view-content" class="fs-tags-view-content"></div>
      </div>
    `;

    // Bind Top New Tag Button
    container.querySelector('#fs-btn-top-new-tag')?.addEventListener('click', () => {
      openTagEditorModal();
    });

    // Bind Toggle Buttons
    const toggleBoxes = container.querySelector('#fs-toggle-boxes');
    const toggleTabs = container.querySelector('#fs-toggle-tabs');

    toggleBoxes.addEventListener('click', () => {
      engine.viewMode = 'boxes';
      localStorage.setItem(STORAGE_VIEW_KEY, 'boxes');
      renderTagsPage(container);
    });

    toggleTabs.addEventListener('click', () => {
      engine.viewMode = 'tabs';
      localStorage.setItem(STORAGE_VIEW_KEY, 'tabs');
      if (!engine.activeTabId && allTags.length > 0) {
        engine.activeTabId = allTags[0].id;
      }
      renderTagsPage(container);
    });

    const contentContainer = container.querySelector('#fs-tags-view-content');
    if (viewMode === 'boxes') {
      renderView1_Boxes(contentContainer, allTags);
    } else {
      renderView2_Tabs(contentContainer, allTags);
    }
  }

  // ==========================================================================
  // VIEW 1: HERO BOXES (MINIMALISTA COM AÇÕES DIRETAS)
  // ==========================================================================
  function renderView1_Boxes(container, allTags) {
    // If a box is currently opened/clicked, render its playlist!
    if (engine.openedBoxTagId) {
      renderTagPlaylistView(container, engine.openedBoxTagId);
      return;
    }

    if (allTags.length === 0) {
      container.innerHTML = `
        <div class="fs-tag-empty-state" style="padding: 70px 20px; text-align: center;">
          <div style="font-size: 44px; margin-bottom: 14px;">🏷️</div>
          <h2 style="color: #fff; font-size: 19px; font-weight: 700; margin-bottom: 8px;">Nenhuma tag criada ainda</h2>
          <p style="color: rgba(255,255,255,0.5); font-size: 13.5px; max-width: 440px; margin: 0 auto 22px;">
            Crie tags com upload de imagens personalizadas para organizar sua biblioteca de forma elegante e inteligente.
          </p>
          <button type="button" id="fs-empty-btn-create" class="fs-btn-new-tag-primary" style="padding: 10px 20px; font-size: 13px;">
            <span>+</span> <span>Criar Primeira Tag</span>
          </button>
        </div>
      `;
      container.querySelector('#fs-empty-btn-create')?.addEventListener('click', () => {
        openTagEditorModal();
      });
      return;
    }

    container.innerHTML = `
      <!-- MINIMALIST SUBHEADER BAR -->
      <div class="fs-tags-minimal-bar">
        <div class="fs-tags-minimal-chips">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.45); margin-right: 4px;">Gerenciar:</span>
          ${allTags.map(tag => {
            const count = engine.getSongsForTag(tag.id).length;
            return `
              <div class="fs-tag-manager-pill" data-pill-id="${tag.id}" title="Clique para abrir playlist ou editar">
                <img src="${escapeHtml(tag.heroImage)}" class="fs-tag-mini-thumb" alt="" />
                <span class="fs-tag-manager-name">${escapeHtml(tag.name)}</span>
                <span class="fs-tag-manager-count">${count}</span>
                <button type="button" class="fs-tag-mini-btn fs-tag-btn-edit" data-id="${tag.id}" title="Editar Tag">✏️</button>
              </div>
            `;
          }).join('')}
        </div>
        <span style="font-size: 11.5px; color: rgba(255,255,255,0.45); white-space: nowrap;">Passe o mouse no card para editar ou excluir</span>
      </div>

      <!-- HERO BOXES GRID -->
      <div class="fs-hero-boxes-grid">
        ${allTags.map(tag => {
          const songs = engine.getSongsForTag(tag.id);
          return `
            <div class="fs-hero-box" data-id="${tag.id}" style="background-image: ${safeCssUrl(tag.heroImage)};">
              <div class="fs-hero-box-overlay"></div>
              
              <div class="fs-hero-box-top">
                <span class="fs-hero-box-tag-pill">🏷️ Tag</span>
                <div class="fs-hero-box-top-actions">
                  <span class="fs-hero-box-count-pill">${songs.length} faixas</span>
                  <button type="button" class="fs-hero-card-action-btn fs-card-edit-btn" data-edit-id="${tag.id}" title="Editar Nome / Capa da Tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button type="button" class="fs-hero-card-action-btn fs-card-delete-btn" data-delete-id="${tag.id}" title="Excluir Tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <div class="fs-hero-box-bottom">
                <h3 class="fs-hero-box-title">${escapeHtml(tag.name)}</h3>
                
                <div class="fs-hero-box-actions">
                  <button type="button" class="fs-hero-btn-play" data-play-id="${tag.id}" title="Tocar Todas as Faixas">
                    <span>▶ Tocar Tag</span>
                  </button>
                  <button type="button" class="fs-hero-btn-shuffle" data-shuffle-id="${tag.id}" title="Tocar em Modo Aleatório">
                    <span>🔀</span>
                  </button>
                </div>

                <div class="fs-hero-box-footer-hint">Clique para abrir a playlist →</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind Edit Buttons
    container.querySelectorAll('.fs-card-edit-btn, .fs-tag-btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-edit-id') || btn.getAttribute('data-id');
        if (id) openTagEditorModal(id);
      });
    });

    // Bind Delete Buttons
    container.querySelectorAll('.fs-card-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (id) openDeleteConfirmModal(id);
      });
    });

    // Bind Pill clicks
    container.querySelectorAll('.fs-tag-manager-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        if (e.target.closest('.fs-tag-btn-edit')) return;
        const id = pill.getAttribute('data-pill-id');
        if (id) window.location.hash = '#/library/genres?tag=' + encodeURIComponent(id);
      });
    });

    // Bind Hero Boxes Click & Play Actions
    container.querySelectorAll('.fs-hero-box').forEach(box => {
      const tagId = box.getAttribute('data-id');

      box.querySelector('.fs-hero-btn-play')?.addEventListener('click', (e) => {
        e.stopPropagation();
        engine.playTag(tagId, false);
      });

      box.querySelector('.fs-hero-btn-shuffle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        engine.playTag(tagId, true);
      });

      box.addEventListener('click', (e) => {
        if (e.target.closest('.fs-hero-card-action-btn') || e.target.closest('.fs-hero-box-actions')) {
          return;
        }
        window.location.hash = '#/library/genres?tag=' + encodeURIComponent(tagId);
      });
    });
  }

  // ==========================================================================
  // PLAYLIST VIEW (Inside a clicked Box)
  // ==========================================================================
  function renderTagPlaylistView(container, tagId) {
    const tag = engine.getTag(tagId);
    if (!tag) {
      engine.openedBoxTagId = null;
      renderView1_Boxes(container, engine.getTags());
      return;
    }

    const songs = engine.getSongsForTag(tagId);

    container.innerHTML = `
      <div class="fs-tag-playlist-view">
        <!-- HERO BANNER -->
        <div class="fs-tag-hero-banner" style="background-image: ${safeCssUrl(tag.heroImage)};">
          <div class="fs-tag-hero-banner-overlay"></div>
          
          <button type="button" id="fs-btn-back-to-boxes" class="fs-tag-btn-back">
            <span>← Voltar para Todas as Tags</span>
          </button>

          <div class="fs-tag-hero-banner-content">
            <span class="fs-tag-badge-pill">PLAYLIST DA TAG</span>
            <h1 class="fs-tag-banner-title">${tag.name}</h1>
            <div class="fs-tag-banner-meta">
              <span>✨ ${songs.length} músicas atribuídas</span>
              <span>•</span>
              <span>Hero Box Personalizada</span>
            </div>

            <div class="fs-tag-banner-actions">
              <button type="button" id="fs-banner-btn-play" class="fs-tag-btn-primary" ${songs.length === 0 ? 'disabled' : ''}>
                <span>▶ Tocar Tudo</span>
              </button>
              <button type="button" id="fs-banner-btn-shuffle" class="fs-tag-btn-secondary" ${songs.length === 0 ? 'disabled' : ''}>
                <span>🔀 Aleatório</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TRACKLIST TABLE -->
        <div class="fs-tag-playlist-body">
          ${renderTracklistHtml(songs, tagId)}
        </div>
      </div>
    `;

    // Bind Back Button
    container.querySelector('#fs-btn-back-to-boxes')?.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/library/genres';
      }
    });

    // Bind Banner Play
    container.querySelector('#fs-banner-btn-play')?.addEventListener('click', () => {
      engine.playTag(tagId, false);
    });

    container.querySelector('#fs-banner-btn-shuffle')?.addEventListener('click', () => {
      engine.playTag(tagId, true);
    });

    bindTracklistEvents(container, tagId);
  }

  // ==========================================================================
  // VIEW 2: ABAS COM BOTÕES NO TOPO + LISTA DE MÚSICAS
  // ==========================================================================
  function renderView2_Tabs(container, allTags) {
    if (allTags.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 70px 20px; color: rgba(255,255,255,0.5);">
          <div style="font-size: 40px; margin-bottom: 12px;">📑</div>
          <h3 style="color: #fff; font-size: 18px; font-weight: 700; margin-bottom: 8px;">Nenhuma tag criada ainda</h3>
          <p style="font-size: 13.5px; margin-bottom: 20px;">Crie sua primeira tag com capa e nome personalizados para visualizar por abas.</p>
          <button type="button" id="fs-tabs-empty-create" class="fs-btn-new-tag-primary">
            <span>+</span> <span>Criar Primeira Tag</span>
          </button>
        </div>
      `;
      container.querySelector('#fs-tabs-empty-create')?.addEventListener('click', () => {
        openTagEditorModal();
      });
      return;
    }

    if (!engine.activeTabId || !allTags.some(t => t.id === engine.activeTabId)) {
      engine.activeTabId = allTags[0].id;
    }

    const activeTag = engine.getTag(engine.activeTabId) || allTags[0];
    const songs = engine.getSongsForTag(activeTag.id);

    container.innerHTML = `
      <div class="fs-tabs-view-container">
        <!-- HORIZONTAL SCROLLING TAG PILLS -->
        <div class="fs-tabs-buttons-bar">
          ${allTags.map(t => {
            const isActive = t.id === activeTag.id;
            const count = engine.getSongsForTag(t.id).length;
            return `
              <button type="button" class="fs-tag-pill-btn ${isActive ? 'active' : ''}" data-tag-id="${t.id}">
                <img src="${escapeHtml(t.heroImage)}" class="fs-tag-pill-thumb" alt="" />
                <span class="fs-tag-pill-name">${escapeHtml(t.name)}</span>
                <span class="fs-tag-pill-count">${count}</span>
              </button>
            `;
          }).join('')}
          <button type="button" class="fs-tag-pill-btn fs-tag-pill-add-btn" id="fs-tabs-add-tag-btn" title="Criar Nova Tag">
            <span style="font-size: 13px; font-weight: bold;">+</span>
            <span>Nova Tag</span>
          </button>
        </div>

        <!-- ACTIVE TAG ACTION BAR -->
        <div class="fs-active-tag-action-bar">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="${escapeHtml(activeTag.heroImage)}" class="fs-active-tag-large-thumb" alt="" />
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0;">${escapeHtml(activeTag.name)}</h2>
                <span style="font-size: 11px; padding: 2px 8px; border-radius: 99px; background: rgba(167, 139, 250, 0.2); color: #c4b5fd; font-weight: 600;">${songs.length} faixas</span>
                <button type="button" class="fs-tag-mini-btn" id="fs-tabs-edit-active-tag" title="Editar Tag" style="margin-left: 4px; font-size: 13px;">✏️</button>
                <button type="button" class="fs-tag-mini-btn" id="fs-tabs-del-active-tag" title="Excluir Tag" style="font-size: 13px; color: #f87171;">✕</button>
              </div>
              <span style="font-size: 12px; color: rgba(255,255,255,0.5);">Lista dinâmica atribuída a esta tag</span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="text" id="fs-tabs-search-input" class="fs-tag-search-input" placeholder="Filtrar músicas nesta tag..." value="${engine.searchQuery || ''}" />
            
            <button type="button" id="fs-tabs-btn-play" class="fs-tag-btn-primary" ${songs.length === 0 ? 'disabled' : ''}>
              <span>▶ Tocar</span>
            </button>
            <button type="button" id="fs-tabs-btn-shuffle" class="fs-tag-btn-secondary" ${songs.length === 0 ? 'disabled' : ''}>
              <span>🔀</span>
            </button>
          </div>
        </div>

        <!-- TRACKLIST TABLE FOR ACTIVE TAB -->
        <div class="fs-tabs-tracklist-wrapper">
          ${renderTracklistHtml(filterSongs(songs, engine.searchQuery), activeTag.id)}
        </div>
      </div>
    `;

    // Bind Tag Pill Switches
    container.querySelectorAll('.fs-tag-pill-btn:not(#fs-tabs-add-tag-btn)').forEach(btn => {
      btn.addEventListener('click', () => {
        engine.activeTabId = btn.getAttribute('data-tag-id');
        engine.searchQuery = '';
        renderView2_Tabs(container, allTags);
      });
    });

    // Bind Add Tag Button
    container.querySelector('#fs-tabs-add-tag-btn')?.addEventListener('click', () => {
      openTagEditorModal();
    });

    // Bind Edit and Delete for Active Tag
    container.querySelector('#fs-tabs-edit-active-tag')?.addEventListener('click', () => {
      openTagEditorModal(activeTag.id);
    });

    container.querySelector('#fs-tabs-del-active-tag')?.addEventListener('click', () => {
      openDeleteConfirmModal(activeTag.id);
    });

    // Bind Search Input
    const searchInput = container.querySelector('#fs-tabs-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        engine.searchQuery = e.target.value;
        const filtered = filterSongs(songs, engine.searchQuery);
        const wrapper = container.querySelector('.fs-tabs-tracklist-wrapper');
        if (wrapper) {
          wrapper.innerHTML = renderTracklistHtml(filtered, activeTag.id);
          bindTracklistEvents(container, activeTag.id);
        }
      });
    }

    // Bind Play & Shuffle
    container.querySelector('#fs-tabs-btn-play')?.addEventListener('click', () => {
      engine.playTag(activeTag.id, false);
    });

    container.querySelector('#fs-tabs-btn-shuffle')?.addEventListener('click', () => {
      engine.playTag(activeTag.id, true);
    });

    bindTracklistEvents(container, activeTag.id);
  }

  // ==========================================================================
  // SHARED TRACKLIST TABLE RENDERER & EVENT BINDER
  // ==========================================================================
  function filterSongs(songs, query) {
    if (!query || !query.trim()) return songs;
    const q = query.toLowerCase();
    return songs.filter(s => (s.name || '').toLowerCase().includes(q) || (s.artistName || '').toLowerCase().includes(q) || (s.album || '').toLowerCase().includes(q));
  }

  function renderTracklistHtml(songs, tagId) {
    if (!songs || songs.length === 0) {
      return `
        <div class="fs-tag-empty-state">
          <div style="font-size: 36px; margin-bottom: 10px;">🎵</div>
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 6px;">Nenhuma música atribuída a esta tag</h3>
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; max-width: 420px; margin: 0 auto 16px;">
            Clique com o <strong>botão direito</strong> em qualquer faixa na sua biblioteca e escolha 
            <span style="color: #c4b5fd; font-weight: 600;">"🏷️ Atribuir a Tag"</span> para organizá-la aqui!
          </p>
        </div>
      `;
    }

    return `
      <table class="fs-tag-track-table">
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">#</th>
            <th style="width: 48px;"></th>
            <th>TÍTULO</th>
            <th>ARTISTA</th>
            <th>ÁLBUM</th>
            <th style="width: 80px; text-align: right;">DURAÇÃO</th>
            <th style="width: 70px; text-align: center;">AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          ${songs.map((song, idx) => {
            const dur = formatDuration(song.duration);
            return `
              <tr class="fs-tag-track-row" data-song-id="${song.id}">
                <td style="text-align: center; color: rgba(255,255,255,0.4);" class="fs-col-idx">
                  <span class="fs-idx-num">${idx + 1}</span>
                  <button type="button" class="fs-row-play-btn" data-play-song="${song.id}" title="Tocar">▶</button>
                </td>
                <td>
                  <div class="fs-track-thumb-container">
                    <span>🎵</span>
                  </div>
                </td>
                <td class="fs-track-col-title">
                  <div style="font-weight: 600; color: #fff;">${song.name || 'Faixa sem título'}</div>
                </td>
                <td style="color: rgba(255,255,255,0.7);">${song.artistName || '—'}</td>
                <td style="color: rgba(255,255,255,0.5);">${song.album || '—'}</td>
                <td style="text-align: right; color: rgba(255,255,255,0.4); font-variant-numeric: tabular-nums;">${dur}</td>
                <td style="text-align: center;">
                  <button type="button" class="fs-btn-remove-from-tag" data-untag="${song.id}" data-tag="${tagId}" title="Remover desta tag">✕</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  function bindTracklistEvents(container, tagId) {
    const songs = engine.getSongsForTag(tagId);

    // Double-click row to play
    container.querySelectorAll('.fs-tag-track-row').forEach(row => {
      const sId = row.getAttribute('data-song-id');
      const song = songs.find(s => s.id === sId);
      if (!song) return;

      row.addEventListener('dblclick', () => {
        engine.playSong(song);
      });

      row.querySelector('.fs-row-play-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        engine.playSong(song);
      });

      row.querySelector('.fs-btn-remove-from-tag')?.addEventListener('click', (e) => {
        e.stopPropagation();
        engine.removeTrack(sId, tagId);
      });
    });
  }

  function formatDuration(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    if (sec > 10000) sec = Math.round(sec / 1000); // ms to sec
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 6. INITIALIZATION
  function startTagsEngine() {
    try {
      injectTagCustomStyles();
    } catch (e) {
      console.error('[Tags Engine] Erro ao injetar estilos de tags:', e);
    }
    try {
      initContextMenuObserver();
    } catch (e) {
      console.error('[Tags Engine] Erro ao iniciar context menu observer:', e);
    }
    try {
      initTagsPageRouter();
    } catch (e) {
      console.error('[Tags Engine] Erro ao iniciar router de tags:', e);
    }
    try {
      initReactiveBadgesObserver();
    } catch (e) {
      console.error('[Tags Engine] Erro ao iniciar reactive badges observer:', e);
    }
    try {
      initHeaderSelectButtonObserver();
    } catch (e) {
      console.error('[Tags Engine] Erro ao iniciar header select observer:', e);
    }
    try {
      engine.updateAllVisibleTrackBadges();
    } catch (e) {
      console.error('[Tags Engine] Erro ao atualizar badges iniciais:', e);
    }
    console.log('[Tags Engine] Sistema de Tags & Multi-Select carregado e ativo.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTagsEngine);
  } else {
    startTagsEngine();
  }
})();
