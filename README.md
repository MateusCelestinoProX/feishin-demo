# 🎵 Feishin — Audiophile Music Suite (Portfolio Demo)

> **Demonstração Interativa & Profissional** de Engenharia de Software Frontend/Mobile desenvolvida e adaptada por **Mateus Celestino Pro**.

---

## ⚡ Visão Geral do Projeto

Esta demonstração apresenta a suíte audiófila **Feishin** em uma arquitetura **100% Client-Side (Zero-Backend)**, permitindo que recrutadores, clientes e líderes técnicos experimentem todas as capacidades do software diretamente no navegador ou em dispositivos móveis, sem necessidade de servidores Navidrome/Subsonic externos.

### 🌟 Destaques da Demo:
1. **Engine Subsonic In-Memory**: Interceptação em camada de rede (`Fetch`, `XMLHttpRequest` e `Service Worker`) simulando a API Subsonic REST com resposta instantânea e latência zero.
2. **Catálogo Integrado de 15 Músicas**: Faixas de alta fidelidade com metadados completos (título, artista, álbum, ano, gênero, duração, capas em alta resolução).
3. **Instância Dupla Responsiva**:
   - 💻 **Modo Desktop Cloud**: Interface completa com barra lateral de navegação, tabela de faixas com ordenação avançada, visualizador de áudio e dock de controle.
   - 📱 **Modo Mobile Nativo**: Interface otimizada para smartphones com barra inferior, mini-player expansível e suporte a gestos de toque.
   - ⚙️ **Seletor Rápido**: Alternância fluida entre modos via barra flutuante de vidro.
4. **Animação Cinematográfica de Abertura (Splash Reveal)**: Tela de abertura minimalista com anel de pulso, status em tempo real e transição com blur e escala.
5. **Popup de Vidro (Glassmorphism Modal)**: Diálogo translúcido com `backdrop-filter: blur(28px)` convidando o visitante a baixar o APK nativo compilado para Android (`feishin-mobile-pro.apk`, 13 MB).
6. **Privacidade e Proteção de Dados**: Sanitização completa de tokens, credenciais e endereços de servidores privados.

---

## 🎧 Faixas em Destaque no Catálogo

1. **Planeta Sonho** — *14 Bis*
2. **03' Adolescence** — *J. Cole*
3. **Somewhere Tonight** — *Beach House*
4. **Total Eclipse of the Heart** — *Bonnie Tyler*
5. **Altogether** — *Slowdive*
6. **Daydreaming** — *Activa*
7. **CÁLICE** — *Chico Buarque & Milton Nascimento*
8. **That Just Isn't Empirically Possible** — *$uicideboy$*
9. **Moment of Peace** — *Gregorian*
10. **After Dark x Sweater Weather (Slowed + Reverb)** — *Slo, Twilight & Tazzy*
11. **Na Pele** — *Elza Soares & Pitty*
12. **Língua** — *Caetano Veloso*
13. **Flashing Lights** — *Kanye West*
14. **Dias de Luta, Dias de Gloria** — *Charlie Brown Jr.*
15. **Born to Die** — *Lana Del Rey*

---

## 📱 Versão Nativa Android (APK)

O repositório inclui a versão mobile nativa já compilada:
- **Caminho**: `./apk/feishin-mobile-pro.apk`
- **Tamanho**: ~13 MB
- **Recursos**: Áudio em segundo plano com integração `MediaSessionCompat`, notificações nativas com controles de reprodução e shaders WebGL a 60FPS.

---

## 🚀 Execução Local

Para visualizar localmente com qualquer servidor HTTP estático:

```bash
# Com Python 3:
python3 -m http.server 3000

# Ou com Node (npx serve):
npx serve -l 3000
```

Abra no navegador em `http://localhost:3000`.

---

**Autor & Engenharia:** Mateus Celestino Pro  
**Identidade Oficial:** `Mateus Celestino <202405039459@alunos.estacio.br>`
