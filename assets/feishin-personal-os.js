// ==========================================================================
// FEISHIN x PERSONAL OS — SHADER ENGINE & LIQUID GLASS CONTROLLER
// Seamlessly merges Personal OS WebGL Shaders with Feishin's Music Interface
// ==========================================================================

import './webgl-backgrounds.js';
import './music-analytics.js';
import './feishin-recently-added.js';
import './feishin-alphabet-scrubber.js';
import './feishin-delete-engine.js';
import './feishin-track-editor.js';
import { a7 as feishinContextMenuModal } from './index-C3w9ueFE.js';

if (typeof window !== 'undefined') {
  if (feishinContextMenuModal) {
    window.__FEISHIN_CONTEXT_MODAL__ = feishinContextMenuModal;
  }
}

// ==========================================================================
// RESILIENCE & CRASH IMMUNITY SAFEGUARDS
// ==========================================================================
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('[Personal OS SafeGuard] Error interceptado:', event.error || event.message);
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Personal OS SafeGuard] Rejection interceptada:', event.reason);
  }, true);

  if (typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype.getContext) {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const ctx = origGetContext.call(this, type, ...args);
      if (ctx && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl')) {
        this.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          console.warn('[Personal OS SafeGuard] WebGL context lost interceptado preventivamente.');
        }, false);
      }
      return ctx;
    };
  }
}

(function() {
  console.log('[Personal OS Engine] Inicializando Shaders & Liquid Glass no Feishin...');

  // 0. Sincronizar sidebarItems e assegurar Início (/home)
  try {
    const rawSettings = localStorage.getItem('store_settings');
    if (rawSettings) {
      const s = JSON.parse(rawSettings);
      let changed = false;
      const cleanItems = (items) => {
        const seen = new Set();
        const filtered = items.filter(item => {
          if (!item) return false;
          if (item.id === 'Albums') return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        if (!filtered.some(item => item && item.id === 'Home')) {
          filtered.unshift({ disabled: false, id: 'Home', label: 'Início', route: '/home' });
        }
        return filtered;
      };
      if (s?.state?.general?.sidebarItems) {
        s.state.general.sidebarItems = cleanItems(s.state.general.sidebarItems);
        changed = true;
      }
      if (s?.general?.sidebarItems) {
        s.general.sidebarItems = cleanItems(s.general.sidebarItems);
        changed = true;
      }
      if (changed) {
        localStorage.setItem('store_settings', JSON.stringify(s));
      }
    }
  } catch (e) {
    console.error('[Personal OS] Erro ao sincronizar sidebarItems:', e);
  }

  const enforceDefaultHomeRoute = () => {
    const hash = window.location.hash || '';
    if (!hash || hash === '#' || hash === '#/') {
      window.location.hash = '#/home';
    }
  };
  enforceDefaultHomeRoute();

  // Auto-reconexão resiliente ao servidor Navidrome caso caia na tela action-required
  setInterval(() => {
    if (window.location.hash && window.location.hash.includes('action-required')) {
      const candidates = Array.from(document.querySelectorAll('button, div, [role="button"]'));
      const srvBtn = candidates.find(el => {
        const t = (el.textContent || '').trim();
        return (t.includes('Feishin Cloud Demo') || t === 'Navidrome') && (el.tagName === 'BUTTON' || el.classList.contains('mantine-UnstyledButton-root') || el.getAttribute('role') === 'button');
      });
      if (srvBtn) {
        console.log('[Personal OS Auto-Connect] Reconectando automaticamente ao Feishin Cloud Demo...');
        srvBtn.click();
      }
    }
  }, 1200);

  // 1. Shaders & Background Galleries Catalog (Binaural Pro Engine)
  const GALLERIES = {
    gym: [
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/012f4996731b766a5f6fce9ae5fa16a0.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/04747ba8c86d370f14b19aff88c73f77.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/1-20260505_170907.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/2-20260327_135337.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/3-20260313_123924.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/416bb19b1eefa7c850b4db3cb09bac12_-_co_pia.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/4567a6460e49dca509404aa4031c11d2.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/9811449c83f06fc824d7a95f235d376e_-_co_pia.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/b3668afb13ab00288ff06c9d72453d19.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/c6081876648f7ce1a6e4734daa79e7d4.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/e5ef0ddde9b00540cdf18e4b226e0bee.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/eca2c6f16007ec99ca3c5058876b2af6.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/f4fcf6bb7808351828fbd6ed76cba496.jpg"
    ],
    flowers: [
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/59da96db902a205e9f90e651a4bcaa72.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/797d233401eae1b36818abc988af10d4.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/7f15501be01e3225966e2ab7fe1b735a.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/8e7943acb3073ec2e112542af9fcc2c6.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/a7a3a081d906882bcf9068afc3894eee.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/b268e4783280047be44e09f1fca7dec6.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/beb4c6ac11f067d61799142fe1a6e27d.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/e55174e6ec437489913f134318952c1e.jpg"
    ],
    red: [
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/08c3aa3a5c3631b23cec57233f5c365c.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/465148a473500d0bf6c3b9c83b98ec92.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/6c5d14bcb2f0390ee694119aa6704655.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/7361af8ac2d01d02c9752f89b3365d47.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/963a4bd9af77842586e2b4cdd53eb931.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/f8247f7bffb7269d9e3b2310844b330d.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/fb71f9cd02c7e3f7e41589d90f6fdaa8.jpg"
    ],
    soft: [
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/05f22143098023a6978520a73a77637e.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/142622f0d35efbffebc9b8a7995168dd.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/37c572ab0404204cb6f367c2a9f78a54.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/3e3b1728d96b733b8f3bbf418021dd42.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/69b55c9be40f117fd5f076d27334d2cf.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/6e86f5937cb8ef54593b94952a59d5a1.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/71acf6cb2cad2c986df87d817a06c33b.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/72859fb9ef398cd2a69777dc26d7d1d2.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/73ba35d0e4557dacaeb9ffaab42cd635.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/747c0ca848cc44632e4c94436348fe07.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/7b78f45b8a8f62b1cb9c7477d0b83f63.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/800c456fafbe63fae067663194fe47e9.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/8f432d4e77f909f3abccb186f47ffff3.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/b1cd9d06a79b40e08ff9b945cd051aab.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/b26f28a14964906204ec288ddf524432.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/bbf00645951aa952366c3a446a07c990.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/c4058aae27b4310eb2c979cf9f6a817d.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/e82d7e3487abb787a3398210d02801c8.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/f24ac251210bc82b90f9c33ce2438194.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/f9f930471adfb299ae9ad2f9b319421b.jpg"
    ],
    motivation: [
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/1000427297.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/1000427303.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/1000427312.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/img_8287.jpeg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/img_9915.jpeg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/projetounohome_20260613_155750_319.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/projetounohome_20260613_155802_757.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/projetounohome_20260613_155833_559.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/projetounohome_20260613_155903_814.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/projetounohome_20260613_171838_541.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/vaideuno_20260613_155457_985.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/vaideuno_20260613_155513_639.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/vaideuno_20260613_170029_918.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/vaideuno_20260613_171916_766.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/welitonofc001-20260222-0004.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/welitonofc001-20260222-0049.jpg",
      "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/welitonofc001-20260222-0097.jpg"
    ]
  };

  const CINEMATIC_VIDEOS = [
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_031045_0e1165dd-ab48-46e3-ad3d-5fe77f217647.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260411_104032_69319010-2458-492b-b04d-b40a5dfa4482.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4"
  ];

  const SHADER_TYPES = [
    "softaurora", "particles", "ghostfibers", "plasmawave", "strands", "siderays", "beams", "floatinglines", "silk", "radar", "ripplegrid", "pixelblast", "magicrings", "gridscan", "liquidchrome", "linewaves", "ferrofluid", "dither", "darkveil", "webthreads", "topography", "balatro", "faultyterminal", "morphslider", "antigravity", "aurora", "letterglitch", "plasma", "liquidether", "orb", "prism", "prismaticburst", "lightning", "evileye", "lighttunnel", "acidsquares", "moltenmetal"
  ];

  const RANDOM_POOL = [
    "gym", "flowers", "red", "soft", "motivation", "api", "video", ...SHADER_TYPES
  ];

  const BACKGROUND_CATALOG = [
    {
      category: '🖼️ Fotos',
      key: 'galerias',
      type: 'image',
      items: [
        { id: 'gym', mode: 'gallery', name: 'GYM', icon: '🏋️', badge: '13', type: 'image' },
        { id: 'flowers', mode: 'gallery', name: 'Flowers', icon: '🌸', badge: '8', type: 'image' },
        { id: 'red', mode: 'gallery', name: 'Red', icon: '🔴', badge: '7', type: 'image' },
        { id: 'soft', mode: 'gallery', name: 'Soft Club', icon: '💿', badge: '20', type: 'image' },
        { id: 'motivation', mode: 'gallery', name: 'Motivação', icon: '💪', badge: '17', type: 'image' },
        { id: 'api', mode: 'gallery', name: 'Unsplash', icon: '🌐', badge: '∞', type: 'image' },
        { id: 'video', mode: 'video', name: 'Vídeos', icon: '🎬', badge: '7', type: 'image' },
        { id: 'random', mode: 'random', name: 'Mix', icon: '🎲', badge: 'Fotos+GL', type: 'image' },
        { id: 'galaxybits', mode: 'galaxybits', name: 'Auto GL', icon: '✨', badge: '37 GL', type: 'image' }
      ]
    },
    {
      category: '🌌 Cosmo',
      key: 'cosmico',
      type: 'shader',
      items: [
        { id: 'softaurora', mode: 'shader', name: 'Aurora', icon: '✨', badge: 'GL', type: 'shader' },
        { id: 'aurora', mode: 'shader', name: 'Borealis', icon: '🌌', badge: 'GL', type: 'shader' },
        { id: 'antigravity', mode: 'shader', name: 'Antigravity', icon: '🔮', badge: 'GL', type: 'shader' },
        { id: 'prism', mode: 'shader', name: 'Prism', icon: '💎', badge: 'GL', type: 'shader' },
        { id: 'prismaticburst', mode: 'shader', name: 'Burst', icon: '🎆', badge: 'GL', type: 'shader' },
        { id: 'liquidether', mode: 'shader', name: 'Ether', icon: '🌀', badge: 'GL', type: 'shader' },
        { id: 'orb', mode: 'shader', name: 'Orb', icon: '🪐', badge: 'GL', type: 'shader' }
      ]
    },
    {
      category: '⚡ Energia',
      key: 'energia',
      type: 'shader',
      items: [
        { id: 'plasmawave', mode: 'shader', name: 'Plasma Wave', icon: '🌊', badge: 'GL', type: 'shader' },
        { id: 'plasma', mode: 'shader', name: 'Core Plasma', icon: '⚡', badge: 'GL', type: 'shader' },
        { id: 'strands', mode: 'shader', name: 'Strands', icon: '🧵', badge: 'GL', type: 'shader' },
        { id: 'siderays', mode: 'shader', name: 'Side Rays', icon: '🔆', badge: 'GL', type: 'shader' },
        { id: 'beams', mode: 'shader', name: 'Beams', icon: '🌠', badge: 'GL', type: 'shader' },
        { id: 'lightning', mode: 'shader', name: 'Lightning', icon: '🌩️', badge: 'GL', type: 'shader' },
        { id: 'linewaves', mode: 'shader', name: 'Line Waves', icon: '〰️', badge: 'GL', type: 'shader' },
        { id: 'lighttunnel', mode: 'shader', name: 'Tunnel', icon: '🚇', badge: 'GL', type: 'shader' }
      ]
    },
    {
      category: '🧪 Fluidos',
      key: 'fluidos',
      type: 'shader',
      items: [
        { id: 'ferrofluid', mode: 'shader', name: 'Ferrofluid', icon: '⚫', badge: 'GL', type: 'shader' },
        { id: 'liquidchrome', mode: 'shader', name: 'Chrome', icon: '🪞', badge: 'GL', type: 'shader' },
        { id: 'silk', mode: 'shader', name: 'Silk', icon: '🪡', badge: 'GL', type: 'shader' },
        { id: 'floatinglines', mode: 'shader', name: 'Floating', icon: '🪄', badge: 'GL', type: 'shader' },
        { id: 'ghostfibers', mode: 'shader', name: 'Ghost', icon: '🕸️', badge: 'GL', type: 'shader' },
        { id: 'webthreads', mode: 'shader', name: 'Threads', icon: '🕷️', badge: 'GL', type: 'shader' },
        { id: 'acidsquares', mode: 'shader', name: 'Acid', icon: '🟩', badge: 'GL', type: 'shader' },
        { id: 'moltenmetal', mode: 'shader', name: 'Metal', icon: '🪨', badge: 'GL', type: 'shader' }
      ]
    },
    {
      category: '🎮 Cyber',
      key: 'cyber',
      type: 'shader',
      items: [
        { id: 'balatro', mode: 'shader', name: 'Balatro', icon: '🃏', badge: 'GL', type: 'shader' },
        { id: 'dither', mode: 'shader', name: 'Dither', icon: '📺', badge: 'GL', type: 'shader' },
        { id: 'darkveil', mode: 'shader', name: 'Dark Veil', icon: '🕶️', badge: 'GL', type: 'shader' },
        { id: 'topography', mode: 'shader', name: 'Topo Map', icon: '🗺️', badge: 'GL', type: 'shader' },
        { id: 'faultyterminal', mode: 'shader', name: 'Terminal', icon: '📟', badge: 'GL', type: 'shader' },
        { id: 'gridscan', mode: 'shader', name: 'Grid Scan', icon: '📡', badge: 'GL', type: 'shader' },
        { id: 'pixelblast', mode: 'shader', name: 'Pixel Blast', icon: '👾', badge: 'GL', type: 'shader' },
        { id: 'radar', mode: 'shader', name: 'Radar', icon: '🎯', badge: 'GL', type: 'shader' },
        { id: 'ripplegrid', mode: 'shader', name: 'Ripple', icon: '🌐', badge: 'GL', type: 'shader' },
        { id: 'magicrings', mode: 'shader', name: 'Rings', icon: '💫', badge: 'GL', type: 'shader' },
        { id: 'letterglitch', mode: 'shader', name: 'Glitch', icon: '🔡', badge: 'GL', type: 'shader' },
        { id: 'evileye', mode: 'shader', name: 'Evil Eye', icon: '👁️', badge: 'GL', type: 'shader' },
        { id: 'particles', mode: 'shader', name: 'Particles', icon: '⭐', badge: 'GL', type: 'shader' },
        { id: 'morphslider', mode: 'shader', name: 'Morph', icon: '🖼️', badge: 'GL', type: 'shader' }
      ]
    }
  ];

  const FLAT_BACKGROUNDS = BACKGROUND_CATALOG.flatMap(c => c.items);
  const SHADER_CATALOG = BACKGROUND_CATALOG.filter(c => c.key !== 'galerias');
  const FLAT_SHADERS = SHADER_CATALOG.flatMap(c => c.items);

  // 2. State & Preferences
  let activeBackground = localStorage.getItem('feishin_active_shader') || 'plasmawave';
  let activeShader = activeBackground;
  let isRotative = localStorage.getItem('feishin_shader_rotative') === 'true';
  let rotativeSeconds = parseInt(localStorage.getItem('feishin_shader_rotative_sec') || '25', 10);
  let isEcoMode = localStorage.getItem('feishin_shader_eco') === 'true';
  let glassBlur = parseInt(localStorage.getItem('personal_os_glass_blur') || '28', 10);
  let shaderDim = parseInt(localStorage.getItem('personal_os_shader_dim') || '25', 10);
  let rotativeTimer = null;
  let currentBgIndex = 0;
  let currentVideoIdx = 0;
  let isVideoLoopRunning = false;
  let galaxyBitsIndex = 0;
  let currentEffectiveTarget = activeBackground;
  let currentRotativeIdx = 0;

  // Apply initial glass blur and shader darkening immediately to document
  document.documentElement.style.setProperty('--personal-os-glass-blur', glassBlur + 'px');
  document.documentElement.style.setProperty('--personal-os-shader-dim', (shaderDim / 100).toFixed(2));

  // 3. Ensure DOM Canvas & Slideshow Container
  function ensureBackgroundContainer() {
    let slideshow = document.getElementById('bg-slideshow');
    if (!slideshow) {
      slideshow = document.createElement('div');
      slideshow.id = 'bg-slideshow';
      slideshow.className = 'bg-slideshow';
      slideshow.innerHTML = `
        <div id="bg-layer-active" class="bg-layer active"></div>
        <div id="bg-layer-next" class="bg-layer"></div>
        <video id="bg-video-1" class="bg-video-layer" muted playsinline webkit-playsinline disablePictureInPicture disableremoteplayback x5-playsinline controlslist="nodownload noplaybackrate nofullscreen" style="pointer-events: none !important;"></video>
        <video id="bg-video-2" class="bg-video-layer" muted playsinline webkit-playsinline disablePictureInPicture disableremoteplayback x5-playsinline controlslist="nodownload noplaybackrate nofullscreen" style="pointer-events: none !important;"></video>
        <div id="bg-webgl-container"></div>
        <div class="bg-overlay"></div>
      `;
      document.body.prepend(slideshow);
    } else {
      if (!document.getElementById('bg-layer-active')) {
        const l1 = document.createElement('div');
        l1.id = 'bg-layer-active';
        l1.className = 'bg-layer active';
        slideshow.prepend(l1);
      }
      if (!document.getElementById('bg-layer-next')) {
        const l2 = document.createElement('div');
        l2.id = 'bg-layer-next';
        l2.className = 'bg-layer';
        slideshow.prepend(l2);
      }
      if (!document.getElementById('bg-video-1')) {
        const v1 = document.createElement('video');
        v1.id = 'bg-video-1';
        v1.className = 'bg-video-layer';
        v1.muted = true; v1.playsInline = true;
        slideshow.appendChild(v1);
      }
      if (!document.getElementById('bg-video-2')) {
        const v2 = document.createElement('video');
        v2.id = 'bg-video-2';
        v2.className = 'bg-video-layer';
        v2.muted = true; v2.playsInline = true;
        slideshow.appendChild(v2);
      }
      if (!document.getElementById('bg-webgl-container')) {
        const wc = document.createElement('div');
        wc.id = 'bg-webgl-container';
        slideshow.appendChild(wc);
      }
    }

    let dimEl = document.getElementById('bg-webgl-dim');
    if (!dimEl) {
      dimEl = document.createElement('div');
      dimEl.id = 'bg-webgl-dim';
      document.body.insertBefore(dimEl, slideshow.nextSibling);
    }
    let vignette = document.getElementById('bg-webgl-vignette');
    if (!vignette) {
      vignette = document.createElement('div');
      vignette.id = 'bg-webgl-vignette';
      document.body.insertBefore(vignette, dimEl.nextSibling);
    }
    return document.getElementById('bg-webgl-container');
  }

  function ensureShaderContainer() {
    return ensureBackgroundContainer();
  }

  function getNextBgUrl(category) {
    if (category === 'api') {
      const randomId = Math.floor(Math.random() * 1000);
      return `https://picsum.photos/1920/1080?random=${randomId}`;
    }
    const list = GALLERIES[category] || GALLERIES.gym;
    const img = list[currentBgIndex % list.length];
    currentBgIndex = (currentBgIndex + 1) % list.length;
    return img;
  }

  function playNextVideoTrack() {
    const video1 = document.getElementById('bg-video-1');
    const video2 = document.getElementById('bg-video-2');
    if (!video1 || !video2) return;

    video1.style.display = 'block';
    video2.style.display = 'block';

    let activeVid = (currentVideoIdx % 2 === 0) ? video1 : video2;
    let nextVid = (currentVideoIdx % 2 === 0) ? video2 : video1;

    const currentUrl = CINEMATIC_VIDEOS[currentVideoIdx % CINEMATIC_VIDEOS.length];
    const nextIdx = (currentVideoIdx + 1) % CINEMATIC_VIDEOS.length;
    const nextUrl = CINEMATIC_VIDEOS[nextIdx];

    if (activeVid.src !== currentUrl) {
      activeVid.src = currentUrl;
      activeVid.load();
    }
    activeVid.classList.add('active');
    nextVid.classList.remove('active');
    activeVid.play().catch(() => {});

    if (nextVid.src !== nextUrl) {
      nextVid.src = nextUrl;
      nextVid.load();
    }

    activeVid.onended = () => {
      activeVid.onended = null;
      currentVideoIdx = nextIdx;
      playNextVideoTrack();
    };
  }

  // 4. Activate Background (Shaders, Galerias de Imagens ou Vídeos)
  function applyBackground(targetId, isCycle = false) {
    ensureBackgroundContainer();

    if (!isCycle) {
      activeBackground = targetId;
      activeShader = targetId;
      localStorage.setItem('feishin_active_shader', targetId);
    }

    let effective = targetId;
    if (targetId === 'random') {
      effective = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
    }
    currentEffectiveTarget = effective;

    const found = FLAT_BACKGROUNDS.find(b => b.id === targetId || b.id === effective) || FLAT_BACKGROUNDS[0];

    const webglContainer = document.getElementById('bg-webgl-container');
    const layer1 = document.getElementById('bg-layer-active');
    const layer2 = document.getElementById('bg-layer-next');
    const video1 = document.getElementById('bg-video-1');
    const video2 = document.getElementById('bg-video-2');

    if (isEcoMode) {
      if (typeof window.stopWebGLBackground === 'function') window.stopWebGLBackground();
      if (video1) { try { video1.pause(); } catch(e){} video1.style.display = 'none'; }
      if (video2) { try { video2.pause(); } catch(e){} video2.style.display = 'none'; }
      updatePillLabel('🍃 Eco Mode (Pausado)');
      updateModalUI();
      return;
    }

    // 1. Shaders Rotativo (GalaxyBits)
    if (effective === 'galaxybits') {
      isVideoLoopRunning = false;
      if (video1) { try { video1.pause(); } catch(e){} video1.style.display = 'none'; }
      if (video2) { try { video2.pause(); } catch(e){} video2.style.display = 'none'; }
      if (layer1) layer1.style.display = 'none';
      if (layer2) layer2.style.display = 'none';
      if (webglContainer) webglContainer.style.display = 'block';

      const sh = SHADER_TYPES[galaxyBitsIndex % SHADER_TYPES.length];
      galaxyBitsIndex = (galaxyBitsIndex + 1) % SHADER_TYPES.length;
      if (typeof window.setWebGLBackground === 'function') {
        window.setWebGLBackground(sh);
      } else if (typeof window.renderWebGLBackground === 'function') {
        window.renderWebGLBackground(sh);
      }
      updatePillLabel(`✨ Shaders Rotativo (${sh})`);
      updateModalUI();
      return;
    }

    // 2. Individual WebGL Shader
    if (SHADER_TYPES.includes(effective)) {
      isVideoLoopRunning = false;
      if (video1) { try { video1.pause(); } catch(e){} video1.style.display = 'none'; }
      if (video2) { try { video2.pause(); } catch(e){} video2.style.display = 'none'; }
      if (layer1) layer1.style.display = 'none';
      if (layer2) layer2.style.display = 'none';
      if (webglContainer) webglContainer.style.display = 'block';

      if (typeof window.setWebGLBackground === 'function') {
        window.setWebGLBackground(effective);
      } else if (typeof window.renderWebGLBackground === 'function') {
        window.renderWebGLBackground(effective);
      }
      const labelText = targetId === 'random' ? `🎲 ${found.icon} ${found.name}` : `${found.icon} ${found.name}`;
      updatePillLabel(labelText);
      updateModalUI();
      return;
    }

    // Parar WebGL se não for shader
    if (typeof window.stopWebGLBackground === 'function') {
      window.stopWebGLBackground();
    }
    if (webglContainer) webglContainer.style.display = 'none';

    // 3. Cinematic Video
    if (effective === 'video') {
      if (layer1) layer1.style.display = 'none';
      if (layer2) layer2.style.display = 'none';
      if (!isVideoLoopRunning) {
        isVideoLoopRunning = true;
        playNextVideoTrack();
      }
      const labelText = targetId === 'random' ? '🎲 🎬 Cinematic Video' : '🎬 Cinematic Video';
      updatePillLabel(labelText);
      updateModalUI();
      return;
    }

    // 4. Image Galleries (gym, flowers, red, soft, motivation, api)
    isVideoLoopRunning = false;
    if (video1) { try { video1.pause(); } catch(e){} video1.style.display = 'none'; }
    if (video2) { try { video2.pause(); } catch(e){} video2.style.display = 'none'; }
    if (layer1) layer1.style.display = 'block';
    if (layer2) layer2.style.display = 'block';

    const nextUrl = getNextBgUrl(effective);
    const activeSlide = (layer1 && layer1.classList.contains('active')) ? layer1 : layer2;
    const nextSlide = (activeSlide === layer1) ? layer2 : layer1;

    if (nextSlide) {
      const img = new Image();
      img.src = nextUrl;
      img.onload = () => {
        nextSlide.style.backgroundImage = `url("${nextUrl}")`;
        nextSlide.classList.add('active');
        if (activeSlide) activeSlide.classList.remove('active');
      };
    }

    const galleryNames = {
      gym: '🏋️ GYM',
      flowers: '🌸 Flowers',
      red: '🔴 Red',
      soft: '💿 Soft Club',
      motivation: '💪 Motivação',
      api: '🌐 Unsplash'
    };
    const baseName = galleryNames[effective] || `${found.icon} ${found.name}`;
    const labelText = targetId === 'random' ? `🎲 ${baseName}` : baseName;
    updatePillLabel(labelText);
    updateModalUI();
  }

  function applyShader(shaderId) {
    applyBackground(shaderId);
  }

  // 5. Rotative Mode Engine
  function startRotative() {
    stopRotative();
    rotativeTimer = setInterval(() => {
      if (isEcoMode) return;
      cycleBgNow();
    }, rotativeSeconds * 1000);
  }

  function stopRotative() {
    if (rotativeTimer) {
      clearInterval(rotativeTimer);
      rotativeTimer = null;
    }
  }

  function cycleBgNow() {
    if (activeBackground === 'random' || activeBackground === 'galaxybits' || GALLERIES[activeBackground] || activeBackground === 'api') {
      applyBackground(activeBackground, true);
    } else if (isRotative) {
      currentRotativeIdx = (currentRotativeIdx + 1) % FLAT_BACKGROUNDS.length;
      applyBackground(FLAT_BACKGROUNDS[currentRotativeIdx].id);
    } else {
      applyBackground(activeBackground, true);
    }
  }

  window.cycleBgNow = cycleBgNow;
  window.applyBackground = applyBackground;
  window.applyShader = applyShader;

  function updatePillLabel(text) {
    const lbl = document.getElementById('personal-os-pill-label');
    if (lbl) lbl.textContent = text;
    const item = document.getElementById('personal-os-sidebar-backgrounds-item');
    if (item) item.title = `Personal OS — Planos de Fundo (${text})`;
  }

  // 5.9. Visual Previews & Art Map for Background Cards
  const BACKGROUND_PREVIEWS = {
    gym: {
      thumb: "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/gym/012f4996731b766a5f6fce9ae5fa16a0.jpg",
      gradient: "linear-gradient(135deg, #18181b, #27272a)"
    },
    flowers: {
      thumb: "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/flowers/59da96db902a205e9f90e651a4bcaa72.jpg",
      gradient: "linear-gradient(135deg, #500724, #831843)"
    },
    red: {
      thumb: "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/red/08c3aa3a5c3631b23cec57233f5c365c.jpg",
      gradient: "linear-gradient(135deg, #450a0a, #7f1d1d)"
    },
    soft: {
      thumb: "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/soft/05f22143098023a6978520a73a77637e.jpg",
      gradient: "linear-gradient(135deg, #1e1b4b, #3730a3)"
    },
    motivation: {
      thumb: "https://kbqxzmyasstdvvbfymft.supabase.co/storage/v1/object/public/binaural-backgrounds/motivation/1000427297.jpg",
      gradient: "linear-gradient(135deg, #1c1917, #44403c)"
    },
    api: {
      gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #075985 100%)"
    },
    video: {
      gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1e1b4b 100%)"
    },
    random: {
      gradient: "linear-gradient(135deg, #f43f5e 0%, #a855f7 50%, #06b6d4 100%)"
    },
    galaxybits: {
      gradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)"
    },
    // Cosmico
    softaurora: { gradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)" },
    aurora: { gradient: "linear-gradient(135deg, #0f766e 0%, #0284c7 50%, #3b82f6 100%)" },
    antigravity: { gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)" },
    prism: { gradient: "linear-gradient(135deg, #9d174d 0%, #db2777 50%, #f472b6 100%)" },
    prismaticburst: { gradient: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #fb923c 100%)" },
    liquidether: { gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)" },
    orb: { gradient: "radial-gradient(circle at center, #fb7185 0%, #9f1239 50%, #0f172a 100%)" },
    // Energia
    plasmawave: { gradient: "linear-gradient(135deg, #831843 0%, #be185d 50%, #06b6d4 100%)" },
    plasma: { gradient: "linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #f87171 100%)" },
    strands: { gradient: "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)" },
    siderays: { gradient: "linear-gradient(135deg, #86198f 0%, #c026d3 50%, #e879f9 100%)" },
    beams: { gradient: "linear-gradient(135deg, #3730a3 0%, #6366f1 50%, #818cf8 100%)" },
    lightning: { gradient: "radial-gradient(circle at center, #67e8f9 0%, #0891b2 40%, #082f49 100%)" },
    linewaves: { gradient: "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)" },
    lighttunnel: { gradient: "radial-gradient(circle at center, #ffffff 0%, #e11d48 40%, #1e1b4b 100%)" },
    // Fluidos
    ferrofluid: { gradient: "radial-gradient(circle at 35% 35%, #52525b 0%, #18181b 60%, #09090b 100%)" },
    liquidchrome: { gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 50%, #1e293b 100%)" },
    silk: { gradient: "linear-gradient(135deg, #581c87 0%, #9333ea 50%, #c084fc 100%)" },
    floatinglines: { gradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)" },
    ghostfibers: { gradient: "linear-gradient(135deg, #0f172a 0%, #334155 50%, #64748b 100%)" },
    webthreads: { gradient: "linear-gradient(135deg, #1e293b 0%, #475569 50%, #0f172a 100%)" },
    acidsquares: { gradient: "linear-gradient(135deg, #064e3b 0%, #10b981 50%, #6ee7b7 100%)" },
    moltenmetal: { gradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #facc15 100%)" },
    // Cyber
    balatro: { gradient: "linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #1e1b4b 100%)" },
    dither: { gradient: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)" },
    darkveil: { gradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)" },
    topography: { gradient: "linear-gradient(135deg, #3730a3 0%, #6366f1 50%, #f472b6 100%)" },
    faultyterminal: { gradient: "linear-gradient(135deg, #052e16 0%, #15803d 50%, #4ade80 100%)" },
    gridscan: { gradient: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)" },
    pixelblast: { gradient: "linear-gradient(135deg, #be123c 0%, #7e22ce 50%, #06b6d4 100%)" },
    radar: { gradient: "radial-gradient(circle at center, #10b981 0%, #047857 40%, #022c22 100%)" },
    ripplegrid: { gradient: "linear-gradient(135deg, #0284c7 0%, #6366f1 50%, #e11d48 100%)" },
    magicrings: { gradient: "radial-gradient(circle at center, #e879f9 0%, #7e22ce 50%, #1e1b4b 100%)" },
    letterglitch: { gradient: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #2dd4bf 100%)" },
    evileye: { gradient: "radial-gradient(circle at center, #ef4444 0%, #7f1d1d 50%, #050505 100%)" },
    particles: { gradient: "radial-gradient(circle at center, #e0e7ff 0%, #6366f1 40%, #0f172a 100%)" },
    morphslider: { gradient: "linear-gradient(135deg, #b91c1c 0%, #4338ca 100%)" }
  };

  // 6. Mount Sidebar Backgrounds Navigation Item & Modal UI
  function mountShaderSwitcherUI() {
    // If top bar exists, ensure it is completely hidden
    const topBar = document.querySelector('.fs-window-bar-module-window-bar');
    if (topBar) {
      topBar.style.setProperty('display', 'none', 'important');
    }

    // Invisible Drag handle for moving frameless window on macOS (apenas fora do Android)
    if (!document.getElementById('personal-os-drag-handle') && !window.AndroidBridge && !('ontouchstart' in window)) {
      const dragHandle = document.createElement('div');
      dragHandle.id = 'personal-os-drag-handle';
      document.body.appendChild(dragHandle);
    }

    // Remove legacy top pill if any exists
    const oldPill = document.getElementById('personal-os-shader-pill');
    if (oldPill) oldPill.remove();

    // Backdrop
    let backdrop = document.getElementById('personal-os-shader-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'personal-os-shader-backdrop';
      backdrop.style.display = 'none';
      backdrop.style.webkitAppRegion = 'no-drag';
      document.body.appendChild(backdrop);
    }

    // Modal / Popover (Box Quadrado Personal OS)
    let modal = document.getElementById('personal-os-shader-modal');
    let setGlassBlur = null;
    let setShaderDim = null;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'personal-os-shader-modal';
      modal.style.display = 'none';
      modal.style.webkitAppRegion = 'no-drag';

      modal.innerHTML = `
        <!-- Puxador de Arraste Mobile (Sheet Handle) -->
        <div class="shader-modal-sheet-handle" id="shader-modal-sheet-handle"></div>

        <!-- Top Bar: Título Compacto + Contador + Botão Fechar -->
        <div class="shader-modal-header">
          <div class="shader-modal-title-group">
            <div class="shader-modal-icon-badge">✨</div>
            <div class="shader-modal-title-col">
              <div class="shader-modal-title-row">
                <h3 class="shader-modal-title">Backgrounds</h3>
                <span class="shader-modal-count-tag">46</span>
              </div>
            </div>
          </div>
          <button class="shader-modal-close" id="shader-modal-close-btn" type="button" title="Fechar (ESC)">✕</button>
        </div>

        <!-- Linha Superior Mobile / Landscape: Ações Rápidas + Sliders -->
        <div class="shader-top-controls-row">
          <!-- Barra de Ações Rápidas (3 botões com nomes curtos) -->
          <div class="shader-header-actions">
            <button class="shader-ctrl-btn" id="shader-cycle-now-btn" type="button" title="Sortear">
              <span class="ctrl-icon">🎲</span>
              <span class="ctrl-label">Sortear</span>
            </button>
            <button class="shader-ctrl-btn ${isRotative ? 'active' : ''}" id="shader-rotative-toggle" type="button" title="Alternar modo rotativo">
              <span class="ctrl-icon">🔄</span>
              <span class="ctrl-label">${isRotative ? 'Auto' : 'Fixo'}</span>
            </button>
            <button class="shader-ctrl-btn ${isEcoMode ? 'active' : ''}" id="shader-eco-toggle" type="button" title="Economia de energia">
              <span class="ctrl-icon">${isEcoMode ? '▶️' : '🍃'}</span>
              <span class="ctrl-label">${isEcoMode ? 'Ativo' : 'Eco'}</span>
            </button>
          </div>

          <!-- Sliders Compactos: Blur + Escurecimento em 2 Colunas -->
          <div class="shader-controls-panel">
            <div class="shader-slider-box">
              <div class="shader-slider-header">
                <span class="slider-name">🪟 Blur</span>
                <span class="shader-slider-badge" id="val-glass-blur">${glassBlur}px</span>
              </div>
              <div class="shader-slider-wrapper">
                <input type="range" class="shader-range-slider" id="slider-glass-blur" min="0" max="60" value="${glassBlur}" step="1" title="Ajuste o blur do vidro">
              </div>
            </div>

            <div class="shader-slider-box">
              <div class="shader-slider-header">
                <span class="slider-name">🌘 Dim</span>
                <span class="shader-slider-badge" id="val-shader-dim">${shaderDim}%</span>
              </div>
              <div class="shader-slider-wrapper">
                <input type="range" class="shader-range-slider" id="slider-shader-dim" min="0" max="90" value="${shaderDim}" step="1" title="Ajuste o escurecimento do fundo">
              </div>
            </div>
          </div>
        </div>

        <!-- Navegação Mestra: 2 Tipos Fundamentais + Todos -->
        <div class="shader-type-nav" id="shader-type-nav">
          <button type="button" class="shader-type-btn" data-type="images">
            <span class="type-icon">🖼️</span> Fotos <span class="type-count">9</span>
          </button>
          <button type="button" class="shader-type-btn" data-type="shaders">
            <span class="type-icon">✨</span> Shaders <span class="type-count">37</span>
          </button>
          <button type="button" class="shader-type-btn" data-type="all">
            <span class="type-icon">⚡</span> Todos <span class="type-count">46</span>
          </button>
        </div>

        <!-- Sub-filtros Contextuais (Sub-chips rolagem suave) -->
        <div class="shader-category-pills" id="shader-category-pills"></div>

        <div class="shader-grid-wrapper">
          <div class="shader-grid-4col" id="shader-grid-list-container">
            <!-- populated dynamically with 2 columns mobile / 4 columns landscape -->
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Populate Backgrounds & Shaders into Cards
      const listContainer = modal.querySelector('#shader-grid-list-container');
      BACKGROUND_CATALOG.forEach(cat => {
        cat.items.forEach(item => {
          const isCurrent = (item.id === activeBackground || item.id === currentEffectiveTarget) && !isEcoMode;
          const preview = BACKGROUND_PREVIEWS[item.id] || { gradient: 'linear-gradient(135deg, #1e1b4b, #3b82f6)' };
          const card = document.createElement('div');
          card.className = `shader-item-card ${isCurrent ? 'active' : ''}`;
          card.setAttribute('data-shader-id', item.id);
          card.setAttribute('data-type', item.type || (cat.key === 'galerias' ? 'image' : 'shader'));
          card.setAttribute('data-cat', cat.key || 'galerias');

          const bgStyle = preview.thumb
            ? `background-image: url('${preview.thumb}'); background-size: cover; background-position: center;`
            : `background: ${preview.gradient};`;

          card.innerHTML = `
            <div class="shader-card-art" style="${bgStyle}"></div>
            <div class="shader-card-art-overlay"></div>
            <div class="shader-card-top-row">
              <div class="shader-card-icon-pill">${item.icon}</div>
              <div class="shader-card-active-indicator" style="display: ${isCurrent ? 'block' : 'none'};">✓ ATIVO</div>
            </div>
            <div class="shader-card-info">
              <div class="shader-card-title">${item.name}</div>
              <div class="shader-card-badge">${item.badge || item.id}</div>
            </div>
          `;
          card.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isEcoMode = false;
            localStorage.setItem('feishin_shader_eco', 'false');
            const ecoBtn = modal.querySelector('#shader-eco-toggle');
            if (ecoBtn) {
              ecoBtn.classList.remove('active');
              ecoBtn.innerHTML = '<span class="ctrl-icon">🍃</span> <span class="ctrl-label">Eco</span>';
            }
            applyBackground(item.id);
            updateModalUI();
          };
          listContainer.appendChild(card);
        });
      });

      // Navegação por Tipo (Fotos, Shaders, Todos) e Sub-chips
      let currentNavType = 'images';
      function selectNavType(type) {
        currentNavType = type;
        modal.querySelectorAll('.shader-type-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-type') === type);
        });
        renderCategoryPills(type);
        filterCards(type, 'all');
      }

      function renderCategoryPills(type) {
        const pillsContainer = modal.querySelector('#shader-category-pills');
        if (!pillsContainer) return;
        pillsContainer.innerHTML = '';

        let pills = [];
        if (type === 'images') {
          pills = [
            { id: 'all', label: 'Todas' },
            { id: 'gym', label: '🏋️ GYM' },
            { id: 'flowers', label: '🌸 Flowers' },
            { id: 'red', label: '🔴 Red' },
            { id: 'soft', label: '💿 Soft' },
            { id: 'motivation', label: '💪 Motivação' },
            { id: 'api', label: '🌐 Unsplash' },
            { id: 'video', label: '🎬 Vídeos' },
            { id: 'random', label: '🎲 Mix' },
            { id: 'galaxybits', label: '✨ Auto GL' }
          ];
        } else if (type === 'shaders') {
          pills = [
            { id: 'all', label: 'Todos' },
            { id: 'cosmico', label: '🌌 Cosmo' },
            { id: 'energia', label: '⚡ Energia' },
            { id: 'fluidos', label: '🧪 Fluidos' },
            { id: 'cyber', label: '🎮 Cyber' }
          ];
        } else {
          pills = [
            { id: 'all', label: 'Todos' },
            { id: 'galerias', label: '🖼️ Fotos' },
            { id: 'cosmico', label: '🌌 Cosmo' },
            { id: 'energia', label: '⚡ Energia' },
            { id: 'fluidos', label: '🧪 Fluidos' },
            { id: 'cyber', label: '🎮 Cyber' }
          ];
        }

        pills.forEach((p, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `shader-pill-btn ${idx === 0 ? 'active' : ''}`;
          btn.setAttribute('data-filter', p.id);
          btn.textContent = p.label;
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            pillsContainer.querySelectorAll('.shader-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCards(currentNavType, p.id);
          };
          pillsContainer.appendChild(btn);
        });
      }

      function filterCards(type, subFilter) {
        const cards = modal.querySelectorAll('.shader-item-card');
        cards.forEach(card => {
          const cardType = card.getAttribute('data-type');
          const cardCat = card.getAttribute('data-cat');
          const cardId = card.getAttribute('data-shader-id');

          const isImg = (type === 'images' || type === 'image') && (cardType === 'images' || cardType === 'image');
          const isShader = (type === 'shaders' || type === 'shader') && (cardType === 'shaders' || cardType === 'shader');
          const matchType = (type === 'all') || isImg || isShader || (cardType === type);
          if (!matchType) {
            card.style.display = 'none';
            return;
          }

          if (!subFilter || subFilter === 'all') {
            card.style.display = 'flex';
          } else if (subFilter === cardCat || subFilter === cardId) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      }

      modal.querySelectorAll('.shader-type-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectNavType(btn.getAttribute('data-type'));
        };
      });

      const cycleBtn = modal.querySelector('#shader-cycle-now-btn');
      if (cycleBtn) {
        cycleBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          cycleBgNow();
        };
      }

      // Sliders compactos em 2 colunas
      setGlassBlur = function(val) {
        glassBlur = Math.max(0, Math.min(60, parseInt(val, 10) || 0));
        document.documentElement.style.setProperty('--personal-os-glass-blur', glassBlur + 'px');
        localStorage.setItem('personal_os_glass_blur', glassBlur.toString());
        const slider = modal.querySelector('#slider-glass-blur');
        const badge = modal.querySelector('#val-glass-blur');
        if (slider && parseInt(slider.value, 10) !== glassBlur) slider.value = glassBlur;
        if (badge) badge.textContent = `${glassBlur}px`;
      };

      setShaderDim = function(val) {
        shaderDim = Math.max(0, Math.min(90, parseInt(val, 10) || 0));
        const alpha = (shaderDim / 100).toFixed(2);
        document.documentElement.style.setProperty('--personal-os-shader-dim', alpha);
        localStorage.setItem('personal_os_shader_dim', shaderDim.toString());
        const slider = modal.querySelector('#slider-shader-dim');
        const badge = modal.querySelector('#val-shader-dim');
        if (slider && parseInt(slider.value, 10) !== shaderDim) slider.value = shaderDim;
        if (badge) badge.textContent = `${shaderDim}%`;
        const dimEl = document.getElementById('bg-webgl-dim');
        if (dimEl) dimEl.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;
      };

      const sliderBlur = modal.querySelector('#slider-glass-blur');
      if (sliderBlur) {
        sliderBlur.addEventListener('input', (e) => setGlassBlur(e.target.value));
      }

      const sliderDim = modal.querySelector('#slider-shader-dim');
      if (sliderDim) {
        sliderDim.addEventListener('input', (e) => setShaderDim(e.target.value));
      }

      // Gesto Touch de arrastar para baixo para fechar (Mobile Bottom Sheet)
      let startY = 0;
      let currentY = 0;
      let isDragging = false;
      const handle = modal.querySelector('#shader-modal-sheet-handle');
      const header = modal.querySelector('.shader-modal-header');
      [handle, header].forEach(el => {
        if (!el) return;
        el.addEventListener('touchstart', (e) => {
          startY = e.touches[0].clientY;
          currentY = startY;
          isDragging = true;
          modal.style.transition = 'none';
        }, { passive: true });
        el.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          currentY = e.touches[0].clientY;
          const diff = currentY - startY;
          if (diff > 0) {
            modal.style.transform = `translateY(${diff}px)`;
          }
        }, { passive: true });
        el.addEventListener('touchend', () => {
          if (!isDragging) return;
          isDragging = false;
          modal.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
          const diff = currentY - startY;
          if (diff > 80) {
            closeModal();
          } else {
            modal.style.transform = 'translateY(0)';
          }
        }, { passive: true });
      });

      // Fechar ao clicar no backdrop escuro
      backdrop.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      };

      // Close Modal Button
      modal.querySelector('#shader-modal-close-btn').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      };

      // Rotative Mode Toggle
      modal.querySelector('#shader-rotative-toggle').onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        isRotative = !isRotative;
        localStorage.setItem('feishin_shader_rotative', isRotative);
        this.classList.toggle('active', isRotative);
        this.innerHTML = `<span class="ctrl-icon">🔄</span> <span class="ctrl-label">${isRotative ? 'Auto' : 'Fixo'}</span>`;
        if (isRotative) {
          startRotative();
        } else {
          stopRotative();
        }
      };

      // Eco Mode Toggle
      modal.querySelector('#shader-eco-toggle').onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        isEcoMode = !isEcoMode;
        localStorage.setItem('feishin_shader_eco', isEcoMode);
        this.classList.toggle('active', isEcoMode);
        this.innerHTML = `<span class="ctrl-icon">${isEcoMode ? '▶️' : '🍃'}</span> <span class="ctrl-label">${isEcoMode ? 'Ativo' : 'Eco'}</span>`;
        if (isEcoMode) {
          if (window.stopWebGLBackground) window.stopWebGLBackground();
          const v1 = document.getElementById('bg-video-1');
          const v2 = document.getElementById('bg-video-2');
          if (v1) { try { v1.pause(); } catch(e){} v1.style.display = 'none'; }
          if (v2) { try { v2.pause(); } catch(e){} v2.style.display = 'none'; }
          updatePillLabel('🍃 Eco');
        } else {
          applyBackground(activeBackground);
        }
        updateModalUI();
      };
    }

    function openModal() {
      backdrop.style.setProperty('display', 'block', 'important');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.removeProperty('transform');
      const item = document.getElementById('personal-os-sidebar-backgrounds-item');
      if (item) item.classList.add('active');

      // Selecionar aba certa baseada no background ativo
      const isCurrentShader = SHADER_TYPES.includes(activeBackground);
      const targetType = isCurrentShader ? 'shaders' : 'images';
      const typeNavBtn = modal.querySelector(`.shader-type-btn[data-type="${targetType}"]`);
      if (typeNavBtn) {
        typeNavBtn.click();
      }

      // Sync sliders e badges
      if (typeof setGlassBlur === 'function') setGlassBlur(glassBlur);
      if (typeof setShaderDim === 'function') setShaderDim(shaderDim);

      updateModalUI();
    }

    function closeModal() {
      backdrop.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('display', 'none', 'important');
      const item = document.getElementById('personal-os-sidebar-backgrounds-item');
      if (item) item.classList.remove('active');
      if (typeof window.__feishinSyncActiveTabs === 'function') {
        window.__feishinSyncActiveTabs();
      }
    }

    function toggleModal() {
      if (modal.style.display === 'flex') {
        closeModal();
      } else {
        openModal();
      }
    }

    // Expor globalmente para a Dock Android e componentes nativos
    window.openPersonalOSBackgrounds = openModal;
    window.closePersonalOSBackgrounds = closeModal;
    window.togglePersonalOSBackgrounds = toggleModal;
    window.openFeishinSettings = openFeishinSettings;

    function findMantineModalsContext() {
      if (window.__MANTINE_MODALS__) return window.__MANTINE_MODALS__;
      try {
        const rootEl = document.querySelector("#root");
        if (!rootEl) return null;
        const key = Object.keys(rootEl).find(k => k.startsWith("__reactContainer"));
        if (!key) return null;
        let fiber = rootEl[key];
        let queue = [fiber];
        let count = 0;
        while (queue.length > 0 && count < 1000) {
          count++;
          const f = queue.shift();
          if (!f) continue;
          if (f.memoizedProps?.value?.openContextModal) {
            window.__MANTINE_MODALS__ = f.memoizedProps.value;
            return window.__MANTINE_MODALS__;
          }
          if (f.child) queue.push(f.child);
          if (f.sibling) queue.push(f.sibling);
        }
      } catch (e) {}
      return null;
    }

    function openFeishinSettings() {
      if (typeof window.__FEISHIN_OPEN_SETTINGS__ === 'function') {
        window.__FEISHIN_OPEN_SETTINGS__();
        return;
      }
      if (window.api?.ipc?.send) {
        window.api.ipc.send('request-open-settings');
      }
      const modals = findMantineModalsContext();
      if (modals?.openContextModal) {
        // Garantir que nenhum modal anterior permaneça duplicado
        try {
          if (typeof modals.closeAll === 'function') {
            modals.closeAll();
          }
        } catch (e) {}
        modals.openContextModal('settings', {
          innerProps: {},
          size: '60rem',
          styles: { content: { height: '100%', maxWidth: '90%', width: '100%' } }
        });
      }
    }

    // Ensure item in Left Sidebar as a native-feeling nav item
    function ensureSidebarItem() {
      // Purge any Albums and Home nav buttons from DOM immediately
      document.querySelectorAll('a[href*="/library/albums"], a[href="#/home"], a[href="/home"], a[href="#/"]').forEach(el => {
        const href = el.getAttribute('href') || '';
        const txt = (el.textContent || '').trim();
        if (
          href === '/library/albums' || href === '#/library/albums' || href.startsWith('/library/albums?') || href.startsWith('#/library/albums?') ||
          href === '/home' || href === '#/home' || href === '#/' ||
          txt === 'INÍCIO' || txt === 'Início' || txt === 'ÁLBUNS' || txt === 'Álbuns'
        ) {
          el.remove();
        }
      });

      // Deduplicate Radio Stations if rendered multiple times
      const radios = document.querySelectorAll('.fs-sidebar-module-accordion-content a[href="#/radio"]');
      if (radios.length > 1) {
        for (let i = 1; i < radios.length; i++) {
          radios[i].remove();
        }
      }

      const parent = document.querySelector('.fs-sidebar-module-accordion-content');
      if (!parent) return;

      let item = document.getElementById('personal-os-sidebar-backgrounds-item');
      if (!item) {
        item = document.createElement('a');
        item.id = 'personal-os-sidebar-backgrounds-item';
        item.className = 'mantine-focus-never mantine-active fs-button-module-root fs-sidebar-item-module-link fs-sidebar-item-module-root m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root';
        item.setAttribute('data-variant', 'subtle');
        item.setAttribute('data-size', 'sm');
        item.setAttribute('draggable', 'false');
        item.setAttribute('title', 'Personal OS — Temas & Shaders');
        item.style.cssText = '--button-height: var(--button-height-sm); --button-padding-x: var(--button-padding-x-sm); --button-fz: var(--mantine-font-size-sm); --button-bg: transparent; --button-hover: var(--mantine-color-primary-light-hover); --button-color: var(--mantine-color-primary-light-color); --button-bd: calc(0.0625rem * var(--mantine-scale)) solid transparent; cursor: pointer; user-select: none; -webkit-app-region: no-drag;';

        item.innerHTML = `
          <span class="fs-sidebar-item-module-inner m_80f1301b mantine-Button-inner">
            <span class="fs-sidebar-item-module-label m_811560b9 mantine-Button-label">
              <div class="m_4081bf90 mantine-Group-root" style="--group-gap: var(--mantine-spacing-md); --group-align: center; --group-justify: flex-start; --group-wrap: wrap;">
                <span class="fs-sidebar-icon-module-wrapper">
                  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C12.55 22 13 21.55 13 21C13 20.75 12.9 20.53 12.75 20.36C12.6 20.19 12.5 19.97 12.5 19.72C12.5 19.17 12.95 18.72 13.5 18.72H15C18.86 18.72 22 15.58 22 11.72C22 6.36 17.52 2 12 2ZM12 4C16.41 4 20 7.46 20 11.72C20 14.48 17.76 16.72 15 16.72H13.5C11.85 16.72 10.5 18.07 10.5 19.72C10.5 20.24 10.7 20.71 11.02 21.07C11.13 21.19 11.2 21.34 11.2 21.5C11.2 21.78 10.98 22 10.7 22H12C6.49 22 2 17.51 2 12C2 6.49 6.49 4 12 4ZM6.5 10C5.67 10 5 10.67 5 11.5C5 12.33 5.67 13 6.5 13C7.33 13 8 12.33 8 11.5C8 10.67 7.33 10 6.5 10ZM9.5 7C8.67 7 8 7.67 8 8.5C8 9.33 8.67 10 9.5 10C10.33 10 11 9.33 11 8.5C11 7.67 10.33 7 9.5 7ZM14.5 7C13.67 7 13 7.67 13 8.5C13 9.33 13.67 10 14.5 10C15.33 10 16 9.33 16 8.5C16 7.67 15.33 7 14.5 7ZM17.5 10C16.67 10 16 10.67 16 11.5C16 12.33 16.67 13 17.5 13C18.33 13 19 12.33 19 11.5C19 10.67 18.33 10 17.5 10Z"></path>
                  </svg>
                </span>
                <span>BACKGROUNDS</span>
              </div>
            </span>
          </span>
        `;

        item.addEventListener('pointerdown', (e) => e.stopPropagation());
        item.addEventListener('mousedown', (e) => e.stopPropagation());
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleModal();
        });

        parent.appendChild(item);
      } else if (item.parentElement !== parent) {
        parent.appendChild(item);
      }

      // Ensure Settings Item right below Backgrounds Item
      let settingsItem = document.getElementById('personal-os-sidebar-settings-item');
      if (!settingsItem) {
        settingsItem = document.createElement('a');
        settingsItem.id = 'personal-os-sidebar-settings-item';
        settingsItem.className = 'mantine-focus-never mantine-active fs-button-module-root fs-sidebar-item-module-link fs-sidebar-item-module-root m_77c9d27d mantine-Button-root m_87cf2631 mantine-UnstyledButton-root';
        settingsItem.setAttribute('data-variant', 'subtle');
        settingsItem.setAttribute('data-size', 'sm');
        settingsItem.setAttribute('draggable', 'false');
        settingsItem.setAttribute('title', 'Configurações (⌘,)');
        settingsItem.style.cssText = '--button-height: var(--button-height-sm); --button-padding-x: var(--button-padding-x-sm); --button-fz: var(--mantine-font-size-sm); --button-bg: transparent; --button-hover: var(--mantine-color-primary-light-hover); --button-color: var(--mantine-color-primary-light-color); --button-bd: calc(0.0625rem * var(--mantine-scale)) solid transparent; cursor: pointer; user-select: none; -webkit-app-region: no-drag;';

        settingsItem.innerHTML = `
          <span class="fs-sidebar-item-module-inner m_80f1301b mantine-Button-inner">
            <span class="fs-sidebar-item-module-label m_811560b9 mantine-Button-label">
              <div class="m_4081bf90 mantine-Group-root" style="--group-gap: var(--mantine-spacing-md); --group-align: center; --group-justify: flex-start; --group-wrap: wrap;">
                <span class="fs-sidebar-icon-module-wrapper">
                  <svg stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </span>
                <span>CONFIGURAÇÕES</span>
              </div>
            </span>
          </span>
        `;

        settingsItem.addEventListener('pointerdown', (e) => e.stopPropagation());
        settingsItem.addEventListener('mousedown', (e) => e.stopPropagation());
        settingsItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openFeishinSettings();
        });

        item.insertAdjacentElement('afterend', settingsItem);
      } else if (settingsItem.previousElementSibling !== item) {
        item.insertAdjacentElement('afterend', settingsItem);
      }

      const isSettingsOpen = !!document.querySelector('.mantine-Modal-content');
      if (settingsItem) {
        settingsItem.classList.toggle('active', isSettingsOpen);
      }
    }

    ensureSidebarItem();

    // Reconnect whenever React reconciles/updates DOM
    if (!window.__PERSONAL_OS_SIDEBAR_OBSERVER__) {
      window.__PERSONAL_OS_SIDEBAR_OBSERVER__ = new MutationObserver(() => {
        ensureSidebarItem();
      });
      window.__PERSONAL_OS_SIDEBAR_OBSERVER__.observe(document.body, { childList: true, subtree: true });
    }

    backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });

    // Initial label update
    const cur = FLAT_BACKGROUNDS.find(s => s.id === activeBackground || s.id === currentEffectiveTarget) || FLAT_BACKGROUNDS[0];
    updatePillLabel(`${cur.icon} ${cur.name}`);
  }

  function updateModalUI() {
    const modal = document.getElementById('personal-os-shader-modal');
    if (!modal) return;
    modal.querySelectorAll('.shader-item-card').forEach(card => {
      const id = card.getAttribute('data-shader-id');
      const isCurrent = (id === activeBackground || id === currentEffectiveTarget) && !isEcoMode;
      card.classList.toggle('active', isCurrent);
      const ind = card.querySelector('.shader-card-active-indicator');
      if (ind) {
        ind.style.display = isCurrent ? 'block' : 'none';
        ind.textContent = '✓ ATIVO';
      }
    });
  }

  // 7. Auto Lifecycle & Pause Handling
  let idleGcTimer = null;
  const handleLifecycle = () => {
    if (document.hidden) {
      window.__PAUSE_WEBGL_SHADERS__ = true;
      if (!idleGcTimer) {
        idleGcTimer = setTimeout(() => {
          if (document.hidden && typeof window !== 'undefined' && window.gc) {
            try { window.gc(); } catch (e) {}
          }
          idleGcTimer = null;
        }, 30000);
      }
    } else {
      window.__PAUSE_WEBGL_SHADERS__ = false;
      if (idleGcTimer) {
        clearTimeout(idleGcTimer);
        idleGcTimer = null;
      }
    }
  };

  document.addEventListener('visibilitychange', handleLifecycle, { passive: true });

  // 7.4. Engine de navegação por etapas (Command+[ e Command+])
  // Protegida contra conflitos no Tag Editor, campos de texto e modais
  function initNavigationShortcuts() {
    if (window.__feishinNavShortcutsInitialized) return;
    window.__feishinNavShortcutsInitialized = true;

    let isNavigating = false;

    window.addEventListener(
      'keydown',
      (e) => {
        // Apenas Cmd+[ e Cmd+] (macOS) ou Ctrl+[ e Ctrl+] (outros SOs) sem Shift nem Alt
        const isCmd = e.metaKey || (e.ctrlKey && !navigator.userAgent.includes('Mac'));
        if (!isCmd || e.altKey || e.shiftKey) return;

        const isBack = e.key === '[' || e.code === 'BracketLeft';
        const isForward = e.key === ']' || e.code === 'BracketRight';
        if (!isBack && !isForward) return;

        // REGRA DE PROTEÇÃO 1 (Tag Editor & Inputs):
        // Se o usuário estiver focado em qualquer campo de texto (ex: nome da tag, URL, metadados),
        // NUNCA dispara a navegação para não perder alterações nem interromper digitação.
        const target = e.target || document.activeElement;
        if (target) {
          const tag = (target.tagName || '').toUpperCase();
          const isEditable = target.isContentEditable;
          const isInputText =
            tag === 'INPUT' &&
            !['button', 'submit', 'checkbox', 'radio', 'range'].includes(
              (target.type || '').toLowerCase(),
            );
          const isTextArea = tag === 'TEXTAREA';
          if (isInputText || isTextArea || isEditable) {
            return;
          }
        }

        // REGRA DE PROTEÇÃO 2 (Navegação Estrita por Etapas):
        // Bloqueia múltiplos disparos sucessivos ou repetição rápida de tecla.
        if (isNavigating) {
          e.preventDefault();
          return;
        }

        // REGRA DE PROTEÇÃO 3 (Modais e Painéis de Edição):
        // Se houver modal aberto (como Tag Editor de metadados da música), voltar fecha o modal.
        const activeModal = document.querySelector('.mantine-Modal-content, [role="dialog"]');
        if (activeModal && activeModal.offsetParent !== null) {
          if (isBack) {
            e.preventDefault();
            isNavigating = true;
            const closeBtn = activeModal.querySelector(
              '.mantine-Modal-close, [aria-label="Close modal"], button.mantine-CloseButton-root',
            );
            if (closeBtn) {
              closeBtn.click();
            } else {
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  bubbles: true,
                  code: 'Escape',
                  key: 'Escape',
                  keyCode: 27,
                }),
              );
            }
            setTimeout(() => {
              isNavigating = false;
            }, 300);
          }
          return;
        }

        // REGRA DE PROTEÇÃO 4 (Navegação em Etapas):
        // Volta ou avança exatamente uma tela no histórico
        e.preventDefault();
        isNavigating = true;
        if (isBack) {
          window.history.back();
        } else {
          window.history.forward();
        }
        setTimeout(() => {
          isNavigating = false;
        }, 300);
      },
      true,
    );
  }

  // 8. Bootstrap Engine
  function initEngine() {
    const isMobile = Boolean(
      (typeof window !== 'undefined' && window.api?.utils?.getPlatform?.() === 'android') ||
      (typeof navigator !== 'undefined' && navigator.userAgent.includes('FeishinMobile')) ||
      (typeof window !== 'undefined' && !window.api?.browser && !window.api?.mpvPlayer)
    );

    initNavigationShortcuts();
    ensureShaderContainer();
    mountShaderSwitcherUI();
    if (!isMobile) {
      initTrayBridge();
      initNativeFullScreenSync();
      initFullScreenFreeSpaceDismiss();
    }

    // Enforce album art staying in playerbar dock corner and queue inside full-screen player
    try {
      const rawApp = localStorage.getItem('store_app');
      if (rawApp) {
        const parsed = JSON.parse(rawApp);
        let changed = false;
        if (parsed?.state?.sidebar?.image) {
          parsed.state.sidebar.image = false;
          changed = true;
        }
        if (parsed?.state?.sidebar?.rightExpanded) {
          parsed.state.sidebar.rightExpanded = false;
          changed = true;
        }
        if (changed) localStorage.setItem('store_app', JSON.stringify(parsed));
      }

      // Enforce activeTab: "queue" in full-screen player
      if (!isMobile) {
        const rawFs = localStorage.getItem('store_full_screen_player');
        if (rawFs) {
          const parsedFs = JSON.parse(rawFs);
          if (parsedFs?.state && parsedFs.state.activeTab !== 'queue') {
            parsedFs.state.activeTab = 'queue';
            localStorage.setItem('store_full_screen_player', JSON.stringify(parsedFs));
          }
        }
      }

      if (!isMobile) {
        // Garantir Início (Home) em store_settings sidebarItems no localStorage (apenas desktop)
        const rawSettings = localStorage.getItem('store_settings');
        if (rawSettings) {
          const parsedSettings = JSON.parse(rawSettings);
          const target = parsedSettings?.state?.general?.sidebarItems || parsedSettings?.general?.sidebarItems;
          if (Array.isArray(target)) {
            const filtered = target.filter(item => item && item.id !== 'Albums');
            if (!filtered.some(item => item && item.id === 'Home')) {
              filtered.unshift({ disabled: false, id: 'Home', label: 'Início', route: '/home' });
            }
            if (parsedSettings?.state?.general?.sidebarItems) {
              parsedSettings.state.general.sidebarItems = filtered;
            }
            if (parsedSettings?.general?.sidebarItems) {
              parsedSettings.general.sidebarItems = filtered;
            }
            localStorage.setItem('store_settings', JSON.stringify(parsedSettings));
          }
        }

        if (
          window.location.hash === '' ||
          window.location.hash === '#' ||
          window.location.hash === '#/'
        ) {
          window.location.replace('#/home');
        }
      } else {
        if (
          window.location.hash === '' ||
          window.location.hash === '#' ||
          window.location.hash === '#/' ||
          window.location.hash === '#/home'
        ) {
          window.location.replace('#/library/songs');
        }
      }
    } catch (e) {}

    if (!isMobile) {
      initPlayerSplitQueue();
      initPlayerKillSwitch();
    }
    initSingleClickTrackPlayback();
    initUnitaryQueueSystem();
    const qInitTimerOs = setInterval(() => {
      if (window.__FEISHIN_UNITARY_QUEUE_ENGINE_READY__) {
        clearInterval(qInitTimerOs);
      } else {
        initUnitaryQueueSystem();
      }
    }, 500);

    if (!isMobile) {
      const enforcePlayerCoverArt = () => {
        const sidebarImg = document.querySelector('.fs-sidebar-module-image-container');
        if (sidebarImg) {
          const btn = sidebarImg.querySelector('button');
          if (btn) btn.click();
        }
      };
      const coverObserver = new MutationObserver(enforcePlayerCoverArt);
      coverObserver.observe(document.body, { childList: true, subtree: true });
      enforcePlayerCoverArt();
    }

    // Loop checking until setWebGLBackground is available
    const checkInit = () => {
      if (typeof window.setWebGLBackground === 'function' || typeof window.renderWebGLBackground === 'function') {
        if (!isEcoMode) applyBackground(activeBackground);
        if (isRotative) startRotative();
      } else {
        setTimeout(checkInit, 100);
      }
    };
    checkInit();
  }

  // ==========================================================================
  // 9. TRAY MINI-PANEL & PERSONAL OS BRIDGE
  // ==========================================================================
  function initTrayBridge() {
    console.log('[Personal OS] Conectando Tray Mini-Panel Bridge...');

    function getPlayerStore() {
      if (window.__FEISHIN_PLAYER_STORE__) return window.__FEISHIN_PLAYER_STORE__.getState();
      if (window.__FEISHIN_STORE__) return window.__FEISHIN_STORE__;
      const root = document.querySelector("#root");
      if (!root) return null;
      const fiberKey = Object.keys(root).find(k => k.startsWith("__reactContainer"));
      if (!fiberKey) return null;
      let store = null;
      function search(f, depth) {
        if (!f || depth > 30 || store) return;
        if (f.memoizedProps && f.memoizedProps.value && typeof f.memoizedProps.value.getQueue === "function") {
          store = f.memoizedProps.value;
          return;
        }
        if (f.child) search(f.child, depth + 1);
        if (f.sibling) search(f.sibling, depth + 1);
      }
      search(root[fiberKey], 0);
      if (store) window.__FEISHIN_STORE__ = store;
      return store;
    }

    function getCoverUrl() {
      const img = document.querySelector("footer img") || 
                  document.querySelector(".fs-player-bar-module-cover-art img") || 
                  document.querySelector("img[alt]");
      return img ? img.src : null;
    }

    let isTrayPanelVisible = false;

    function broadcastState(force = false) {
      if (!isTrayPanelVisible && !force) return;
      const store = getPlayerStore();
      if (!store) return;
      try {
        const q = store.getQueue();
        const items = Array.isArray(q) ? q : (q && q.items ? q.items : []);
        
        // Find current song by index or method
        const currentIndex = (store.player && typeof store.player.index === "number") ? store.player.index : -1;
        const current = (currentIndex >= 0 && currentIndex < items.length) ? items[currentIndex] : (store.getCurrentSong?.() || (items.length > 0 ? items[0] : null));
        
        // Elapsed & Duration
        const timeStore = window.__FEISHIN_TIME_STORE__;
        const timestamp = timeStore?.getState?.()?.timestamp || 0;
        const duration = current?.duration ? (current.duration > 10000 ? Math.round(current.duration / 1000) : current.duration) : 0;
        
        // Status
        let isPlaying = false;
        const docTitle = document.title || "";
        if (docTitle.startsWith("(Tocando)") || docTitle.startsWith("(Playing)")) {
          isPlaying = true;
        } else if (store.player?.status) {
          isPlaying = store.player.status === "PLAYING";
        }

        const coverUrl = getCoverUrl();

        const payload = {
          title: current?.name || current?.title || "Nenhuma faixa selecionada",
          artist: current?.artistName || (current?.artists?.map(a => a.name).join(", ")) || "Artista Desconhecido",
          album: current?.album || current?.albumName || "",
          coverUrl: coverUrl,
          isPlaying: isPlaying,
          timestamp: timestamp,
          duration: duration,
          queue: items.map((t, idx) => ({
            index: idx,
            id: t._uniqueId || t.id,
            name: t.name || t.title || `Faixa ${idx + 1}`,
            artist: t.artistName || (t.artists?.map(a => a.name).join(", ")) || "",
            album: t.album || t.albumName || "",
            duration: t.duration ? (t.duration > 10000 ? Math.round(t.duration / 1000) : t.duration) : 0,
            isCurrent: current ? ((t._uniqueId && t._uniqueId === current._uniqueId) || (t.id && t.id === current.id) || idx === currentIndex) : false
          }))
        };

        if (window.api && window.api.ipc && typeof window.api.ipc.send === "function") {
          window.api.ipc.send("tray-panel-send-state", payload);
        }
      } catch (e) {
        console.warn("[TrayBridge Broadcast Error]", e);
      }
    }

    function handleAction(action, payload) {
      const store = getPlayerStore();
      if (!store) return;
      switch (action) {
        case "previous":
          store.mediaPrevious?.();
          break;
        case "skip-backward":
          store.mediaSkipBackward?.(3);
          break;
        case "play-pause":
          store.mediaTogglePlayPause?.();
          break;
        case "skip-forward":
          store.mediaSkipForward?.(3);
          break;
        case "next":
          store.mediaNext?.();
          break;
        case "play-index":
          if (payload && typeof payload.index === "number") {
            store.mediaPlayByIndex?.(payload.index);
          }
          break;
      }
      setTimeout(() => broadcastState(true), 150);
    }

    // Interval to keep mini panel state sync in real time (apenas quando o mini painel estiver aberto)
    setInterval(() => {
      if (isTrayPanelVisible) broadcastState();
    }, 1000);

    // Subscribe to IPC events if available
    if (window.api && window.api.ipc && typeof window.api.ipc.on === "function") {
      window.api.ipc.on("tray-panel-visibility", (_e, visible) => {
        isTrayPanelVisible = !!visible;
        if (isTrayPanelVisible) broadcastState(true);
      });
      window.api.ipc.on("tray-panel-request-state", () => broadcastState(true));
      window.api.ipc.on("tray-panel-execute-action", (_e, data) => {
        if (data && data.action) handleAction(data.action, data.payload);
      });
    }
  }

  // ==========================================================================
  // 9b. NATIVE macOS REAL FULL SCREEN SYNC
  // Transforma o Feishin no macOS em um aplicativo de natureza Real Full Screen
  // ocupando a tela/janela de forma nativa e completa (macOS Spaces).
  // ==========================================================================
  function initNativeFullScreenSync() {
    console.log('[Personal OS] Inicializando Real Full Screen nativo macOS...');

    const triggerFullScreen = (flag) => {
      try {
        if (window.api?.browser?.setFullScreen) {
          window.api.browser.setFullScreen(flag);
        } else if (window.api?.ipc?.send) {
          window.api.ipc.send('window-set-fullscreen', flag);
        }
      } catch (err) {
        console.warn('[Personal OS] Erro ao sincronizar fullscreen nativo:', err);
      }
    };

    const toggleFullScreen = () => {
      try {
        if (window.api?.browser?.toggleFullScreen) {
          window.api.browser.toggleFullScreen();
        } else if (window.api?.ipc?.send) {
          window.api.ipc.send('window-toggle-fullscreen');
        }
      } catch (err) {
        console.warn('[Personal OS] Erro ao alternar fullscreen nativo:', err);
      }
    };

    // 1. Mapeamento de atalhos globais do macOS (Cmd+Ctrl+F) e F11
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey && e.ctrlKey && (e.key === 'f' || e.key === 'F' || e.code === 'KeyF')) || e.key === 'F11') {
        e.preventDefault();
        e.stopPropagation();
        toggleFullScreen();
      }
    }, true);

    // 2. Observer para garantir tela cheia real nativa quando o player expandir
    let lastFsOpen = false;
    const checkFullScreenPlayer = () => {
      const fsContainer = document.querySelector('.fs-full-screen-player-module-container');
      const isFsOpen = Boolean(fsContainer && fsContainer.offsetParent !== null);
      if (isFsOpen !== lastFsOpen) {
        lastFsOpen = isFsOpen;
        if (isFsOpen) {
          console.log('[Personal OS] Player expandido -> Ativando Real Full Screen nativo no macOS...');
          triggerFullScreen(true);
        }
      }
    };

    const fsObserver = new MutationObserver(() => {
      checkFullScreenPlayer();
    });
    fsObserver.observe(document.body, { childList: true, subtree: true });

    // 3. Garantir natureza Real Full Screen nativa ao carregar no macOS
    setTimeout(() => {
      triggerFullScreen(true);
    }, 600);
  }

  // ==========================================================================
  // 10. FULLSCREEN FREE-SPACE CLICK-TO-DISMISS (ESC ACTION)
  // Clicar em qualquer espaço livre da interface retrai imediatamente e
  // rapidamente o painel da música (music page) de volta para a barra.
  // ==========================================================================
  function initFullScreenFreeSpaceDismiss() {
    let pointerDownPos = null;

    const isElementVisible = (el) => {
      if (!el || el.hidden) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    };

    window.addEventListener('pointerdown', (e) => {
      if (e.button === 0) {
        pointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
      }
    }, true);

    window.addEventListener('click', (e) => {
      // 1. Apenas botão principal (esquerdo)
      if (e.button !== 0) return;

      // 2. Ignora arrastos e seleções (> 8px)
      if (pointerDownPos) {
        const dx = Math.abs(e.clientX - pointerDownPos.x);
        const dy = Math.abs(e.clientY - pointerDownPos.y);
        pointerDownPos = null;
        if (dx > 8 || dy > 8) return;
      }

      // 3. Verifica se a tela cheia / expandida está ativa e visível
      const fsContainer = document.querySelector('.fs-full-screen-player-module-container');
      if (!fsContainer || !isElementVisible(fsContainer)) return;

      // 4. Ignora se houver texto selecionado
      if (window.getSelection && window.getSelection().toString().trim().length > 0) return;

      // 5. Ignora se algum modal, popover ou menu suspenso estiver REALMENTE aberto e visível
      const openModals = Array.from(document.querySelectorAll(
        '.mantine-Modal-content, .mantine-Popover-dropdown, .mantine-Menu-dropdown, .mantine-Select-dropdown'
      )).filter(isElementVisible);
      if (openModals.length > 0) return;

      const themeModal = document.getElementById('personal-os-shader-modal');
      if (themeModal && isElementVisible(themeModal)) return;

      // 6. Lista de controles interativos que devem preservar sua ação própria
      const interactive = e.target.closest(
        'button, [role="button"], a, input, select, textarea, [role="slider"], ' +
        '.mantine-Slider-root, .mantine-Menu-dropdown, .mantine-Modal-content, ' +
        '.mantine-Popover-dropdown, #personal-os-shader-pill, #personal-os-shader-modal, ' +
        '#personal-os-shader-backdrop, .fs-full-screen-player-queue-module-grid-container, ' +
        '.fs-lyrics-module-container, #player-bar, footer, .full-screen-player-controls-container, ' +
        '.fs-full-screen-player-queue-module-controls-container, .fs-window-bar-module-window-bar, ' +
        '.fs-window-bar-module-macos-container'
      );
      if (interactive) return;

      // 7. Confirma que o clique ocorreu dentro da área de tela cheia ou fundo
      const isWithinFS = e.target.closest(
        '.fs-full-screen-player-module-container, #main-content, #bg-webgl-container, #bg-webgl-vignette, #root'
      );
      if (!isWithinFS) return;

      // 8. Contração imediata e ultrarrápida (hardware accelerated) do painel
      console.log('[Personal OS] Espaço livre clicado — contraindo painel imediatamente...');
      fsContainer.classList.add('fs-fast-dismiss');
      fsContainer.style.setProperty('transition', 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.12s ease-out', 'important');
      fsContainer.style.setProperty('transform', 'translateY(100%)', 'important');
      fsContainer.style.setProperty('opacity', '0', 'important');
      fsContainer.style.setProperty('pointer-events', 'none', 'important');

      const minBtn = document.querySelector('.fs-full-screen-player-module-container .full-screen-player-controls-container:not(.fs-full-screen-player-queue-module-controls-container) button');
      if (minBtn) {
        minBtn.click();
      } else {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true
        }));
      }
    }, true);
  }

  // ==========================================================================
  // CONTROLE GLOBAL DE PERMISSÃO DA FILA DE REPRODUÇÃO
  // Regra Estrita:
  // Se não tiver nada na fila -> fica só a hero da imagem da track no centro.
  // Se tiver em fila (playlist ou adicionar a seguir) -> a fila deve aparecer (split 50/50).
  // ==========================================================================
  function isQueueAllowedToDisplay() {
    const hash = window.location.hash || '';
    const isPlaylistRoute = hash.startsWith('#/playlists/') || hash.startsWith('#/playlist/');
    const store = (window.__FEISHIN_PLAYER_STORE__ && window.__FEISHIN_PLAYER_STORE__.getState)
      ? window.__FEISHIN_PLAYER_STORE__.getState()
      : null;
    const cur = (typeof store?.getCurrentSong === 'function' ? store.getCurrentSong() : null) || store?.player?.currentSong;
    const isPlaylistSong = Boolean(cur && (cur._itemType === 'playlist_song' || cur.playlistId));
    const isPlaylist = isPlaylistRoute || isPlaylistSong;

    const q = store?.getQueue?.();
    const queueItems = (q && Array.isArray(q.items)) ? q.items : [];
    const hasEnqueuedItems = Boolean(window.__FEISHIN_HAS_ENQUEUED_ITEMS__) || queueItems.length > 1;

    // Se estiver em playlist E houver faixas OU se o recurso Adicionar a Seguir foi usado (fila > 1)
    return Boolean((isPlaylist && queueItems.length > 0) || hasEnqueuedItems);
  }

  // ==========================================================================
  // 11. CONTROLE INTELIGENTE DE EXIBIÇÃO DA FILA NO REPRODUTOR FULLSCREEN
  // Se não tiver nada -> fica só a hero image centralizada.
  // Se tiver em fila -> obviamente a fila aparece dividindo a tela.
  // ==========================================================================
  function initPlayerSplitQueue() {
    console.log('[Personal OS] Ativando Controlador Inteligente de Visibilidade da Fila...');

    const syncVisibility = () => {
      const allowed = isQueueAllowedToDisplay();
      const fsContainer = document.querySelector('.fs-full-screen-player-module-container');
      const respContainer = document.querySelector('.fs-full-screen-player-module-responsive-container');
      const qg = document.querySelector('.fs-full-screen-player-queue-module-grid-container');

      // Ocultar estritamente o Scrubber A-Z e o HUD quando o Reprodutor Fullscreen estiver aberto
      const scrubber = document.getElementById('feishin-alphabet-scrubber');
      const hud = document.getElementById('feishin-alphabet-hud');
      if (fsContainer) {
        if (scrubber) scrubber.style.setProperty('display', 'none', 'important');
        if (hud) hud.style.setProperty('display', 'none', 'important');
      } else {
        const hash = window.location.hash || '';
        if (hash.includes('/library/songs') && scrubber && scrubber.style.display === 'none') {
          scrubber.style.removeProperty('display');
        }
      }

      if (!allowed) {
        // Nada na fila: fica só a hero image da track no centro
        if (respContainer) {
          respContainer.classList.remove('personal-os-queue-visible');
        }
        if (qg) {
          qg.classList.remove('fs-queue-allowed');
          qg.classList.add('fs-full-screen-player-queue-module-grid-container-collapsed');
        }
        if (window.__FEISHIN_FS_STORE__?.getState) {
          try {
            const fsState = window.__FEISHIN_FS_STORE__.getState();
            if (fsState?.activeTab === 'queue') {
              fsState.actions?.setStore({ activeTab: '' });
            }
          } catch (e) {}
        }
        try {
          const rawFs = localStorage.getItem('store_full_screen_player');
          if (rawFs) {
            const parsedFs = JSON.parse(rawFs);
            if (parsedFs?.state && parsedFs.state.activeTab === 'queue') {
              parsedFs.state.activeTab = '';
              localStorage.setItem('store_full_screen_player', JSON.stringify(parsedFs));
            }
          }
        } catch (e) {}
      } else {
        // Tiver em fila: obviamente a fila aparece!
        if (respContainer) {
          respContainer.classList.add('personal-os-queue-visible');
        }
        if (qg) {
          qg.classList.add('fs-queue-allowed');
          qg.classList.remove('fs-full-screen-player-queue-module-grid-container-collapsed');
        }
        if (window.__FEISHIN_FS_STORE__?.getState) {
          try {
            const fsState = window.__FEISHIN_FS_STORE__.getState();
            if (fsState?.activeTab !== 'queue') {
              fsState.actions?.setStore({ activeTab: 'queue' });
            }
          } catch (e) {}
        }
        try {
          const rawFs = localStorage.getItem('store_full_screen_player');
          const parsedFs = rawFs ? JSON.parse(rawFs) : null;
          if (parsedFs?.state && parsedFs.state.activeTab !== 'queue') {
            parsedFs.state.activeTab = 'queue';
            localStorage.setItem('store_full_screen_player', JSON.stringify(parsedFs));
          }
        } catch (e) {}
        if (qg && (qg.classList.contains('fs-full-screen-player-queue-module-grid-container-collapsed') || qg.children.length === 0)) {
          const queueControls = document.querySelector('.fs-full-screen-player-queue-module-controls-container');
          const btns = queueControls ? queueControls.querySelectorAll('button') : [];
          if (btns[0]) btns[0].click();
        }
      }
    };

    let syncVisRaf = null;
    function debouncedSyncVisibility() {
      if (syncVisRaf) cancelAnimationFrame(syncVisRaf);
      syncVisRaf = requestAnimationFrame(() => {
        syncVisRaf = null;
        syncVisibility();
      });
    }

    const fsContainer = document.querySelector('.fs-full-screen-player-module-container') || document.getElementById('feishin-track-page');
    if (fsContainer) {
      const playerObserver = new MutationObserver(debouncedSyncVisibility);
      playerObserver.observe(fsContainer, { childList: true });
    }
    window.addEventListener('hashchange', debouncedSyncVisibility);

    // Redireciona clique no botão de fila da dock inferior
    window.addEventListener('click', (e) => {
      const queueToggle = e.target.closest('.fs-playerbar-module-right-grid-item button');
      if (queueToggle && queueToggle.querySelector('rect[width="18"]')) {
        const allowed = isQueueAllowedToDisplay();
        if (!allowed) {
          e.preventDefault();
          e.stopPropagation();
          const cover = document.querySelector('.fs-left-controls-module-image') || document.querySelector('#player-bar img');
          cover?.click();
          syncVisibility();
        }
      }
    }, true);
  }

  // ==========================================================================
  // 12. PLAYER KILL SWITCH & GLASS CONFIRMATION DIALOG (BOTÃO X NO EXTREMO CANTO DIREITO)
  // Adiciona botão "X" no extremo canto direito da barra do player que fecha a música atual,
  // interrompe a reprodução e limpa a playlist/fila de reprodução, com diálogo glass.
  // Suporta atalho: pressionar Esc 2 vezes quando algo estiver tocando abre o modal.
  // No modal: Esc fecha (cancela) e Enter é sim (confirma encerramento).
  // ==========================================================================
  function initPlayerKillSwitch() {
    console.log('[Personal OS] Ativando Kill Switch do Player (Botão X Canto Direito + Esc 2x + Glass Dialog)...');

    let lastEscTime = 0;
    let activeCloseDialog = null;

    function executeKillSwitch() {
      console.log('[Personal OS] Executando Kill Switch: Encerrando música e limpando fila...');
      window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = false;
      window.__FEISHIN_ACTIVE_COLLECTION__ = null;
      const store = (window.__FEISHIN_PLAYER_STORE__ && window.__FEISHIN_PLAYER_STORE__.getState)
        ? window.__FEISHIN_PLAYER_STORE__.getState()
        : null;

      // 1. Stop native playback via stop button if present in DOM
      const stopBtn = document.querySelectorAll('.fs-playerbar-module-center-grid-item button')[0];
      if (stopBtn) {
        try { stopBtn.click(); } catch(e) {}
      }

      // 2. Stop in store
      try {
        store?.mediaStop?.({ reset: true });
      } catch(e) {}

      // 3. Clear queue & selected in store
      try {
        store?.clearQueue?.();
        store?.clearSelected?.();
      } catch(e) {}

      // 4. Pause any HTML audio elements
      document.querySelectorAll('audio').forEach(a => {
        try { a.pause(); a.currentTime = 0; } catch(e) {}
      });

      // 5. Retract FullScreenPlayer if open
      const fsContainer = document.querySelector('.fs-full-screen-player-module-container');
      if (fsContainer) {
        const minBtn = fsContainer.querySelector('.full-screen-player-controls-container:not(.fs-full-screen-player-queue-module-controls-container) button');
        if (minBtn) {
          minBtn.click();
        } else {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
        }
      }

      // 6. Broadcast empty state to Tray
      try {
        if (window.api && window.api.ipc && typeof window.api.ipc.send === 'function') {
          window.api.ipc.send('tray-panel-send-state', {
            title: 'Nenhuma faixa selecionada',
            artist: '',
            album: '',
            coverUrl: null,
            isPlaying: false,
            timestamp: 0,
            duration: 0,
            queue: []
          });
        }
      } catch(e) {}

      // 7. Update button state immediately
      updateKillButtonState();
    }

    function openKillSwitchGlassDialog() {
      if (document.getElementById('feishin-kill-switch-dialog-backdrop')) return;

      const store = (window.__FEISHIN_PLAYER_STORE__ && window.__FEISHIN_PLAYER_STORE__.getState)
        ? window.__FEISHIN_PLAYER_STORE__.getState()
        : null;
      const currentSong = store?.getCurrentSong?.();
      const songTitle = currentSong?.name || currentSong?.title || 'Música atual';
      const artistName = currentSong?.artistName || (currentSong?.artists?.map(a => a.name).join(', ')) || '';

      const imgEl = document.querySelector('footer img, .fs-player-bar-module-cover-art img, .player-cover-art img, img[alt]');
      const coverSrc = imgEl ? imgEl.src : null;

      const backdrop = document.createElement('div');
      backdrop.id = 'feishin-kill-switch-dialog-backdrop';
      backdrop.className = 'feishin-glass-modal-backdrop';
      backdrop.innerHTML = `
        <div class="feishin-glass-dialog-box" role="dialog" aria-modal="true" tabindex="-1">
          <div class="feishin-glass-dialog-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h3 class="feishin-glass-dialog-title">Encerrar Reprodução?</h3>
          <p class="feishin-glass-dialog-desc">
            Deseja fechar a música atual e matar toda a fila de reprodução ativa?
          </p>
          <div class="feishin-glass-dialog-song-card">
            ${coverSrc ? `<img src="${coverSrc}" class="feishin-glass-song-cover" alt="Capa" />` : `<div class="song-icon">🎵</div>`}
            <div class="song-details">
              <span class="song-name">${songTitle}</span>
              ${artistName ? `<span class="song-sub">${artistName}</span>` : ''}
            </div>
          </div>
          <div class="feishin-glass-dialog-actions">
            <button type="button" class="feishin-glass-btn feishin-glass-btn-cancel" id="feishin-kill-cancel-btn">
              Cancelar <span style="opacity: 0.6; font-size: 11px; margin-left: 4px;">(Esc)</span>
            </button>
            <button type="button" class="feishin-glass-btn feishin-glass-btn-danger" id="feishin-kill-confirm-btn">
              Encerrar e Limpar <span style="opacity: 0.8; font-size: 11px; margin-left: 4px;">(Enter)</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const closeDialog = () => {
        activeCloseDialog = null;
        backdrop.style.opacity = '0';
        const box = backdrop.querySelector('.feishin-glass-dialog-box');
        if (box) box.style.transform = 'scale(0.92)';
        setTimeout(() => backdrop.remove(), 160);
      };

      activeCloseDialog = closeDialog;

      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeDialog();
      };

      const cancelBtn = backdrop.querySelector('#feishin-kill-cancel-btn');
      if (cancelBtn) cancelBtn.onclick = closeDialog;

      const confirmBtn = backdrop.querySelector('#feishin-kill-confirm-btn');
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          executeKillSwitch();
          closeDialog();
        };
      }
    }

    // Atalhos Globais: Esc 2x abre modal; No modal, Esc fecha e Enter confirma
    window.addEventListener('keydown', (e) => {
      const dialog = document.getElementById('feishin-kill-switch-dialog-backdrop');

      // Se o modal estiver aberto:
      if (dialog) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          if (typeof activeCloseDialog === 'function') activeCloseDialog();
          else dialog.remove();
          lastEscTime = 0;
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          executeKillSwitch();
          if (typeof activeCloseDialog === 'function') activeCloseDialog();
          else dialog.remove();
          lastEscTime = 0;
          return;
        }
        return;
      }

      // Se o modal NÃO estiver aberto: escuta Esc duplo (Esc 2 vezes) quando houver áudio/fila
      if (e.key === 'Escape') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

        const store = (window.__FEISHIN_PLAYER_STORE__ && window.__FEISHIN_PLAYER_STORE__.getState)
          ? window.__FEISHIN_PLAYER_STORE__.getState()
          : null;
        const q = store?.getQueue?.();
        const hasQueue = q && ((q.items && q.items.length > 0) || (Array.isArray(q) && q.length > 0));
        const current = store?.getCurrentSong?.();
        const isPlaying = store?.player?.status === 'playing' || store?.player?.status === 'paused';
        const hasActiveAudio = !!(hasQueue || current || isPlaying);

        if (!hasActiveAudio) return;

        const now = Date.now();
        if (now - lastEscTime < 500) {
          // Esc pressionado 2 vezes consecutivas em menos de 500ms
          lastEscTime = 0;
          e.preventDefault();
          e.stopPropagation();
          openKillSwitchGlassDialog();
        } else {
          lastEscTime = now;
        }
      }
    }, true);

    function updateKillButtonState() {
      const btn = document.getElementById('feishin-kill-switch-btn');
      if (!btn) return;
      const store = (window.__FEISHIN_PLAYER_STORE__ && window.__FEISHIN_PLAYER_STORE__.getState)
        ? window.__FEISHIN_PLAYER_STORE__.getState()
        : null;
      const q = store?.getQueue?.();
      const hasQueue = q && ((q.items && q.items.length > 0) || (Array.isArray(q) && q.length > 0));
      const current = store?.getCurrentSong?.();
      const isPlaying = store?.player?.status === 'playing' || store?.player?.status === 'paused';
      const active = !!(hasQueue || current || isPlaying);

      if (active) {
        btn.removeAttribute('data-disabled');
        btn.style.setProperty('opacity', '0.85', 'important');
        btn.style.setProperty('cursor', 'pointer', 'important');
        btn.style.setProperty('pointer-events', 'auto', 'important');
      } else {
        btn.setAttribute('data-disabled', 'true');
        btn.style.setProperty('opacity', '0.35', 'important');
        btn.style.setProperty('cursor', 'not-allowed', 'important');
        btn.style.setProperty('pointer-events', 'none', 'important');
      }
    }

    function mountKillButton() {
      // Alvo: extremo canto direito da barra do player (.fs-playerbar-module-right-grid-item)
      const rightGrid = document.querySelector('.fs-playerbar-module-right-grid-item');
      if (!rightGrid) return;

      const flex = rightGrid.querySelector('[class*="mantine-Flex-root"], div');
      if (!flex) return;

      const row1 = flex.children[1] || flex;

      let btn = document.getElementById('feishin-kill-switch-btn');
      if (!btn || btn.parentElement !== row1) {
        if (btn) btn.remove();

        btn = document.createElement('button');
        btn.id = 'feishin-kill-switch-btn';
        btn.className = 'mantine-focus-never mantine-active fs-action-icon-module-root m_8d3f4000 mantine-ActionIcon-root m_87cf2631 mantine-UnstyledButton-root feishin-kill-btn feishin-kill-btn-right';
        btn.setAttribute('type', 'button');
        btn.setAttribute('title', 'Fechar música e matar fila (X) — ou pressione Esc 2x');
        btn.innerHTML = `
          <span class="m_8d3afb97 mantine-ActionIcon-icon">
            <svg stroke="currentColor" fill="none" stroke-width="2.3" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="15" width="15" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        `;

        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openKillSwitchGlassDialog();
        };

        row1.appendChild(btn);
      }
      updateKillButtonState();
    }

    mountKillButton();
    const playerBar = document.querySelector('#player-bar, footer');
    if (playerBar && !document.getElementById('personal-os-player-kill-btn')) {
      const observer = new MutationObserver(() => {
        mountKillButton();
        if (document.getElementById('personal-os-player-kill-btn')) {
          observer.disconnect();
        }
      });
      observer.observe(playerBar, { childList: true });
    }
  }

  // ==========================================================================
  // 13. REPRODUÇÃO INSTANTÂNEA DE FAIXA COM UM CLIQUE (SINGLE-CLICK PLAY)
  // Clicar em qualquer espaço livre da faixa (título, número, duração, data,
  // ou fundo) inicia a reprodução imediatamente, tornando o Feishin muito mais
  // rápido, intuitivo e agradável.
  // Preserva elementos interativos: links de artista/álbum, botão de mais (3 pontos),
  // botão de favoritos e atalhos de seleção múltipla (Cmd/Ctrl/Shift).
  // ==========================================================================
  function initSingleClickTrackPlayback() {
    window.addEventListener(
      'click',
      (e) => {
        if (e.__isSyntheticSingleClickPlay) return;
        if (e.button !== 0) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

        const interactive = e.target.closest(
          'button, a, input, select, textarea, [role="button"], [role="menuitem"], .fs-action-icon-module-root, [data-prevent-play]'
        );
        if (interactive) return;

        const cell = e.target.closest('[data-row-index]');
        const row = e.target.closest(
          '[role="row"], .fs-track-row, [class*="trackRow"], [class*="track-row"]'
        );
        if (!cell && !row) return;

        if (
          row &&
          (row.getAttribute('aria-rowindex') === '1' ||
            row.closest('[class*="header"]') ||
            row.querySelector('th'))
        ) {
          return;
        }

        const isTrackRow =
          !!cell ||
          (row &&
            (row.classList.contains('fs-track-row') ||
              row.className.includes('trackRow') ||
              row.className.includes('track-row') ||
              !!row.querySelector('[itemtype="song"], [class*="title-combined"], [class*="titleCombined"]') ||
              !!row.innerText.match(/\d+:\d{2}/) ||
              window.location.hash.includes('/library/songs') ||
              window.location.hash.includes('/library/playlists/') ||
              window.location.hash.includes('/queue') ||
              (window.location.hash.includes('/library/albums/') &&
                !!row.closest(
                  '.fs-item-detail-list-module-container, .fs-item-table-list-module-item-table-list-container'
                ))));

        if (!isTrackRow) return;

        // Dispara o segundo click para satisfazer o hook useDoubleClick interno do Feishin
        const clickTarget = cell || e.target;
        const secondClick = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        secondClick.__isSyntheticSingleClickPlay = true;
        clickTarget.dispatchEvent(secondClick);

        // Dispara dblclick para componentes que escutam nativamente onDoubleClick
        const dblEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        dblEvent.__isSyntheticSingleClickPlay = true;
        clickTarget.dispatchEvent(dblEvent);

        if (row) {
          const playBtn = row.querySelector('.fs-play-button-module-root, [class*="playButton"], button[aria-label*="Play"]');
          if (playBtn && !playBtn.contains(e.target)) {
            playBtn.click();
          }
        }
      },
      false
    );
  }

  // ==========================================================================
  // 14. SISTEMA DE FILAS UNITÁRIO INTELIGENTE (MAC E ANDROID)
  // A plataforma abre zerada na home. O slot da fila só conterá músicas
  // caso o usuário esteja em uma playlist estabelecida ou tenha usado
  // "Adicionar a seguir" (Play.NEXT) / "Adicionar à fila" (Play.LAST).
  // Ao tocar na página de faixas, a reprodução é 100% unitária.
  // ==========================================================================
  function initUnitaryQueueSystem() {
    const storeObj = window.__FEISHIN_PLAYER_STORE__;
    if (!storeObj || window.__FEISHIN_UNITARY_QUEUE_ENGINE_READY__) return;
    const store = storeObj.getState?.();
    if (!store || !store.addToQueueByType) return;
    window.__FEISHIN_UNITARY_QUEUE_ENGINE_READY__ = true;

    const origAddToQueueByType = store.addToQueueByType;
    const origSetQueue = store.setQueue;
    const origMediaNext = store.mediaNext;
    const origMediaAutoNext = store.mediaAutoNext;
    const origMediaPrevious = store.mediaPrevious;

    function generateShuffledIndices(length, currentIndex) {
      const pool = [];
      for (let i = 0; i < length; i++) {
        if (i !== currentIndex) pool.push(i);
      }
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      if (currentIndex >= 0 && currentIndex < length) {
        pool.unshift(currentIndex);
      }
      return pool;
    }

    const customAddToQueueByType = function (items, playType, playSongId) {
      const hash = window.location.hash || '';
      const isPlaylist = hash.startsWith('#/playlists/') || hash.startsWith('#/playlist/');
      const isPlaylistItems = items && items.length > 0 && items[0]._itemType === 'playlist_song';
      const isExplicitQueueAction =
        playType === 'next' ||
        playType === 'last' ||
        playType === 'next_shuffle' ||
        playType === 'last_shuffle';

      // 1. Recurso Adicionar a Seguir: marca flag e preserva inserção na fila
      if (isExplicitQueueAction) {
        window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = true;
        return origAddToQueueByType.apply(this, arguments);
      }

      // 2. Playlists estabelecidas: mantém todas as faixas da playlist na fila
      if (isPlaylist || isPlaylistItems) {
        window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = false;
        return origAddToQueueByType.apply(this, arguments);
      }

      // 3. Salvo esses 2 casos: modo simples unitário (música em música). Nenhuma outra track entra na fila!
      window.__FEISHIN_HAS_ENQUEUED_ITEMS__ = false;
      if (playType === 'now' || playType === 'shuffle') {
        const target = (playSongId && items.find((i) => i.id === playSongId)) || items[0];
        if (target) {
          const curStore = storeObj.getState();
          const isShuffle = playType === 'shuffle' || curStore?.player?.shuffle === 'track' || curStore?.player?.shuffle === 'album';
          const targetIdx = items.indexOf(target);
          window.__FEISHIN_ACTIVE_COLLECTION__ = {
            items: items,
            currentIndex: targetIdx,
            isShuffle: isShuffle,
            shuffledIndices: isShuffle ? generateShuffledIndices(items.length, targetIdx) : null,
            shuffledPointer: 0,
            history: []
          };
          return origAddToQueueByType.call(this, [target], 'now', target.id);
        }
      }

      return origAddToQueueByType.apply(this, arguments);
    };

    const customSetQueue = function (data, index, position) {
      const hash = window.location.hash || '';
      const isPlaylist = hash.startsWith('#/playlists/') || hash.startsWith('#/playlist/');
      if (!isPlaylist && data && data.length > 1 && !window.__FEISHIN_HAS_ENQUEUED_ITEMS__) {
        const idx = typeof index === 'number' ? index : 0;
        const target = data[idx] || data[0];
        const curStore = storeObj.getState();
        const isShuffle = curStore?.player?.shuffle === 'track' || curStore?.player?.shuffle === 'album';
        window.__FEISHIN_ACTIVE_COLLECTION__ = {
          items: data,
          currentIndex: idx,
          isShuffle: isShuffle,
          shuffledIndices: isShuffle ? generateShuffledIndices(data.length, idx) : null,
          shuffledPointer: 0,
          history: []
        };
        return origSetQueue.call(this, [target], 0, position);
      }
      return origSetQueue.apply(this, arguments);
    };

    const customMediaNext = function (toNextAlbum) {
      const curStore = storeObj.getState();
      const q = curStore.getQueue?.();
      const currentIdx = curStore.player?.index ?? -1;
      if (q && q.items && q.items.length > currentIdx + 1) {
        return origMediaNext.call(this, toNextAlbum);
      }

      const col = window.__FEISHIN_ACTIVE_COLLECTION__;
      if (col && col.items && col.items.length > 0) {
        const repeat = curStore.player?.repeat || 'none';
        const isShuffle = curStore.player?.shuffle === 'track' || curStore.player?.shuffle === 'album';

        col.history = col.history || [];
        if (typeof col.currentIndex === 'number' && col.currentIndex >= 0) {
          col.history.push(col.currentIndex);
          if (col.history.length > 50) col.history.shift();
        }

        let nextIdx;
        if (isShuffle) {
          if (!col.shuffledIndices || col.shuffledIndices.length !== col.items.length) {
            col.shuffledIndices = generateShuffledIndices(col.items.length, col.currentIndex);
            col.shuffledPointer = 0;
          }
          col.shuffledPointer = (col.shuffledPointer || 0) + 1;
          if (col.shuffledPointer >= col.shuffledIndices.length) {
            col.shuffledIndices = generateShuffledIndices(col.items.length, col.currentIndex);
            col.shuffledPointer = 0;
          }
          nextIdx = col.shuffledIndices[col.shuffledPointer];
        } else {
          nextIdx = (col.currentIndex + 1) % col.items.length;
        }

        col.currentIndex = nextIdx;
        const nextSong = col.items[nextIdx];
        if (nextSong) {
          return origAddToQueueByType.call(curStore, [nextSong], 'now', nextSong.id);
        }
      }

      return origMediaNext.call(this, toNextAlbum);
    };

    const customMediaAutoNext = function () {
      const curStore = storeObj.getState();
      const repeat = curStore.player?.repeat || 'none';
      if (repeat === 'one') {
        document.querySelectorAll('audio').forEach(a => {
          try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}
        });
        return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
      }

      const q = curStore.getQueue?.();
      const currentIdx = curStore.player?.index ?? -1;
      if (q && q.items && q.items.length > currentIdx + 1) {
        return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
      }

      const col = window.__FEISHIN_ACTIVE_COLLECTION__;
      if (col && col.items && col.items.length > 0) {
        const isShuffle = curStore.player?.shuffle === 'track' || curStore.player?.shuffle === 'album';

        let nextIdx;
        if (isShuffle) {
          if (!col.shuffledIndices || col.shuffledIndices.length !== col.items.length) {
            col.shuffledIndices = generateShuffledIndices(col.items.length, col.currentIndex);
            col.shuffledPointer = 0;
          }
          col.shuffledPointer = (col.shuffledPointer || 0) + 1;
          if (col.shuffledPointer >= col.shuffledIndices.length) {
            if (repeat === 'none') {
              return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
            }
            col.shuffledIndices = generateShuffledIndices(col.items.length, col.currentIndex);
            col.shuffledPointer = 0;
          }
          nextIdx = col.shuffledIndices[col.shuffledPointer];
        } else {
          nextIdx = col.currentIndex + 1;
          if (nextIdx >= col.items.length) {
            if (repeat === 'none') {
              return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
            }
            nextIdx = 0;
          }
        }

        col.history = col.history || [];
        if (typeof col.currentIndex === 'number' && col.currentIndex >= 0) {
          col.history.push(col.currentIndex);
          if (col.history.length > 50) col.history.shift();
        }

        col.currentIndex = nextIdx;
        const nextSong = col.items[nextIdx];
        if (nextSong) {
          return origAddToQueueByType.call(curStore, [nextSong], 'now', nextSong.id);
        }
      }

      return typeof origMediaAutoNext === 'function' ? origMediaAutoNext.call(this) : null;
    };

    const customMediaPrevious = function (toPrevAlbum) {
      const curStore = storeObj.getState();
      const currentIdx = curStore.player?.index ?? -1;
      if (currentIdx > 0) {
        return origMediaPrevious.call(this, toPrevAlbum);
      }
      const col = window.__FEISHIN_ACTIVE_COLLECTION__;
      if (col && col.items && col.items.length > 0) {
        col.history = col.history || [];
        let prevIdx;
        if (col.history.length > 0) {
          prevIdx = col.history.pop();
        } else {
          prevIdx = (col.currentIndex - 1 + col.items.length) % col.items.length;
        }
        col.currentIndex = prevIdx;
        const prevSong = col.items[prevIdx];
        if (prevSong) {
          return origAddToQueueByType.call(curStore, [prevSong], 'now', prevSong.id);
        }
      }
      return origMediaPrevious.call(this, toPrevAlbum);
    };

    store.addToQueueByType = customAddToQueueByType;
    store.setQueue = customSetQueue;
    store.mediaNext = customMediaNext;
    store.mediaAutoNext = customMediaAutoNext;
    store.mediaPrevious = customMediaPrevious;

    if (typeof storeObj.setState === 'function') {
      storeObj.setState({
        addToQueueByType: customAddToQueueByType,
        setQueue: customSetQueue,
        mediaNext: customMediaNext,
        mediaAutoNext: customMediaAutoNext,
        mediaPrevious: customMediaPrevious,
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
})();

// ==========================================================================
// UNIFIED REALTIME LIBRARY REFRESH & QUERY INVALIDATION ENGINE
// ==========================================================================
function getReactQueryClient() {
  if (window.__FEISHIN_QUERY_CLIENT__) return window.__FEISHIN_QUERY_CLIENT__;
  const root = document.querySelector('#root');
  if (!root) return null;
  const key = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
  let fiber = root[key];
  for (let i = 0; i < 30 && fiber; i++) {
    if (fiber.memoizedProps?.client?.invalidateQueries) {
      window.__FEISHIN_QUERY_CLIENT__ = fiber.memoizedProps.client;
      return window.__FEISHIN_QUERY_CLIENT__;
    }
    fiber = fiber.child;
  }
  return null;
}

function getEventEmitter() {
  if (window.__FEISHIN_EVENT_EMITTER__) return window.__FEISHIN_EVENT_EMITTER__;
  return null;
}

window.feishinRefreshLibrary = function(reason = 'sync') {
  console.log(`[PersonalOS Engine] feishinRefreshLibrary acionado (motivo: ${reason})`);
  
  // 1. Invalida todas as queries no TanStack React Query
  const qc = getReactQueryClient();
  if (qc && typeof qc.invalidateQueries === 'function') {
    try {
      qc.invalidateQueries();
    } catch (e) {
      console.warn('[PersonalOS Engine] Falha ao invalidar queries:', e);
    }
  }

  // 2. Dispara refresh nas tabelas infinitas Feishin
  const ee = getEventEmitter();
  if (ee && typeof ee.emit === 'function') {
    try {
      ee.emit('ITEM_LIST_REFRESH', { key: 'song' });
      ee.emit('ITEM_LIST_REFRESH', { key: 'songs' });
      ee.emit('ITEM_LIST_REFRESH', { key: 'album' });
      ee.emit('ITEM_LIST_REFRESH', { key: 'albums' });
      ee.emit('ITEM_LIST_REFRESH', { key: 'artist' });
      ee.emit('ITEM_LIST_REFRESH', { key: 'artists' });
    } catch (e) {}
  }

  // 3. Recarrega a aba Recentes
  if (window.__FEISHIN_RECENTLY_ADDED__?.reload) {
    try {
      window.__FEISHIN_RECENTLY_ADDED__.reload(true);
    } catch (e) {}
  }

  // 4. Dispara evento no DOM
  window.dispatchEvent(new CustomEvent('feishin:refresh-library', { detail: { reason } }));
};

// SSE Listener em background no Personal OS
(function initGlobalSSE() {
  let sse = null;
  let timer = null;

  function connect() {
    if (sse) {
      try { sse.close(); } catch (e) {}
      sse = null;
    }

    let serverUrl = '';
    try {
      const auth = JSON.parse(localStorage.getItem('store_authentication') || '{}');
      serverUrl = auth?.state?.currentServer?.url || '';
    } catch (e) {}

    if (!serverUrl) {
      timer = setTimeout(connect, 3000);
      return;
    }

    const cleanUrl = serverUrl.replace(/\/$/, '');
    const eventsUrl = `${cleanUrl}/api/engine/events`;

    try {
      sse = new EventSource(eventsUrl);

      const onSyncEvent = (e) => {
        console.log(`[PersonalOS SSE] Evento ${e.type} recebido:`, e.data);
        window.feishinRefreshLibrary(e.type);
        setTimeout(() => window.feishinRefreshLibrary(e.type), 1500);
        setTimeout(() => window.feishinRefreshLibrary(e.type), 3500);
      };

      sse.addEventListener('track_uploaded', onSyncEvent);
      sse.addEventListener('scan_finished', onSyncEvent);
      sse.addEventListener('library_updated', onSyncEvent);
      sse.addEventListener('track_updated', onSyncEvent);
      sse.addEventListener('track_deleted', onSyncEvent);

      sse.onerror = () => {
        if (sse) {
          try { sse.close(); } catch (e) {}
          sse = null;
        }
        clearTimeout(timer);
        timer = setTimeout(connect, 6000);
      };
    } catch (err) {
      clearTimeout(timer);
      timer = setTimeout(connect, 10000);
    }
  }

  if (typeof window !== 'undefined') {
    connect();

    // Auto-revalidação ao voltar para a janela após 30 segundos
    let lastActive = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastActive > 30000) {
          window.feishinRefreshLibrary('visibility-focus');
        }
        lastActive = now;
      }
    });
  }
})();

