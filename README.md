# 🎵 Feishin — macOS Native Client (Web Edition)

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://feishin-demo.vercel.app)

> **Live Web Application**: https://feishin-demo.vercel.app  
> **Conversão de Alta Precisão**: Cliente Desktop Nativo Feishin para macOS (Electron) convertido para Aplicação Web Standalone de Alta Fidelidade por **Mateus Celestino**.

---

## ⚡ Visão Geral da Arquitetura

Esta aplicação é a transposição integral e fiel do **Feishin for macOS** — o reprodutor e gerenciador musical audiófilo baseado em Electron — diretamente para a Web moderna, mantendo **100% da identidade visual, layout desktop, paleta de cores, tipografia, shaders WebGL acelerados e ergonomia do aplicativo nativo de computador**.

### 🌟 Destaques da Engenharia Desktop macOS:
1. **Emulação do Runtime Desktop Electron (Darwin/macOS)**:
   - Polifill completo do barramento IPC (`window.api`), listeners de ciclo de vida e controle de janelas.
   - Detecção de ambiente macOS (`platform: 'darwin'`), garantindo a renderização do layout autêntico de desktop com barra lateral expansível, atalhos de teclado e dock de controle.
2. **Motor Subsonic In-Memory & Zero-Backend**:
   - Camada virtual de rede (`Fetch`, `XMLHttpRequest` e `Service Worker`) interceptando chamadas Subsonic REST (`/rest/*`) e endpoints de catálogo (`/api/song`), entregando respostas com latência zero e suporte a streaming com `Range` headers.
3. **Catálogo Masterizado em Alta Fidelidade (15 Faixas)**:
   - Áudios originais com metadados integrados (capas HD, artistas, álbuns, anos, gêneros, durações e scrobbling in-memory).
4. **Shaders WebGL & Sistema de Design Personal OS**:
   - Shaders dinâmicos acelerados por GPU (`plasmawave`, `quantumwaves`, etc.) com ambient glow e blur glassmorphism idênticos ao macOS.
   - Scrubber de navegação rápida A-Z, modal de editor de tags e motor de cronologia de adições recentes.
5. **Autonomia e Segurança Total**:
   - Zero dependência de servidores externos ou credenciais privadas; totalmente isolado e autônomo para entrega estática global em CDNs (Vercel, Cloudflare, Netlify).

---

## 🎧 Faixas no Catálogo Masterizado

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

## 🚀 Execução Local

Para executar e testar localmente em qualquer porta HTTP:

```bash
# Com Python 3:
python3 -m http.server 3000

# Ou com Node (npx serve):
npx serve -l 3000
```

Acesse no navegador: `http://localhost:3000`

---

**Autor & Engenharia:** Mateus Celestino  
**Identidade Oficial:** `Mateus Celestino <202405039459@alunos.estacio.br>`
