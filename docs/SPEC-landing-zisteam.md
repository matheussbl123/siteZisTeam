# Spec — Landing page ZisTeam (v1)

**Fonte de verdade visual:** `Site ZisTeam v1.pdf` (7 telas 1920×1080)
**Status:** Rascunho para aprovação · **Data:** 12/11/2026
**Repositório de implementação:** `ZisBetter Team/ClaudeCode`

---

## 1. Problema

A ZisTeam (equipe multiesportiva criada em nov/2025 em MG) não tem presença web própria: patrocinadores, pilotos e atletas interessados não têm onde conhecer as divisões (Racing, Sports, Gaming) nem um canal formal de contato. Hoje existe apenas uma tentativa anterior (pasta pai) que **cola as 7 telas do PDF como imagens** com áreas clicáveis por cima — o texto não é selecionável nem indexável, não funciona em celular e o formulário nunca foi ativado (faltam credenciais).

Sem o site, contatos de parceria se perdem em DMs e a equipe não tem um registro centralizado dos pedidos.

## 2. Objetivos

1. **Fidelidade visual:** em desktop 1920×1080, cada seção é visualmente equivalente à tela correspondente do PDF (layout, cores, tipografia, espaçamentos), construída em HTML/CSS real — não em imagens das telas.
2. **Captura confiável:** 100% dos envios válidos do formulário geram **(a)** uma linha na planilha do Google Drive e **(b)** um e-mail de notificação.
3. **Funciona em qualquer tela:** layout utilizável de 360 px a 2560 px, sem rolagem horizontal.
4. **Rápido e encontrável:** Lighthouse mobile ≥ 85 em Performance e ≥ 90 em Acessibilidade e SEO.

## 3. Fora de escopo (v1)

| Item | Por quê |
|---|---|
| CMS / painel para editar textos | Conteúdo muda pouco; editar no código é suficiente agora. |
| Páginas próprias por divisão (Racing/Sports/Gaming) | O PDF define uma página única; subpáginas viram v2 se houver conteúdo. |
| Versão em inglês | Público inicial é brasileiro. |
| Feed automático de resultados/calendário de corridas | Exige fonte de dados que ainda não existe. |
| Dashboard de leads | A planilha já serve como visualização. |

## 4. Histórias de usuário

**Visitante / potencial parceiro**
- Como potencial patrocinador, quero entender em segundos o que é a ZisTeam e quais divisões ela tem, para decidir se vale a pena conversar.
- Como potencial parceiro, quero enviar uma mensagem pelo site sem sair da página, para iniciar uma conversa sem procurar contatos em redes sociais.
- Como visitante no celular, quero navegar entre as seções pelo menu, para chegar direto ao que me interessa.
- Como visitante, quero ver o último post do Instagram e um vídeo do YouTube, para conhecer o dia a dia da equipe.
- Como visitante, quero receber uma confirmação clara (ou um erro explicativo) ao enviar o formulário, para saber se minha mensagem chegou.

**Equipe ZisTeam**
- Como gestor da equipe, quero receber um e-mail a cada novo contato, para responder rápido.
- Como gestor, quero que todos os contatos fiquem registrados numa planilha, para ter histórico mesmo que um e-mail se perca.
- Como gestor, quero que envios automáticos (spam/bots) não poluam a planilha.

## 5. Estrutura da página (mapeamento do PDF)

Página única com rolagem; o menu leva a âncoras. O item ativo do menu fica **amarelo com prefixo `//`** (scrollspy).

**Cabeçalho (todas as telas):** logo ZisTeam à esquerda; menu à direita dentro de uma barra com borda amarela 2 px e fundo em gradiente escuro → transparente. Itens: INÍCIO · SOBRE A ZIS · RACING · SPORTS · GAMING · CONTATO. Fica fixo no topo ao rolar.

| # | Seção (âncora) | Conteúdo |
|---|---|---|
| 1 | **Início** `#inicio` | Hero em tela cheia (100vh) com imagem do carro na pista; setas ‹ › nas laterais → **carrossel** de imagens. |
| 2 | **Sobre a Zis** `#sobre` | Título gigante "UMA EQUIPE PRA **TODO MUNDO.**" (últimas palavras em amarelo). Subtítulo "// ZISTEAM, MAS PODE CHAMAR DE ZIS." + parágrafo. Faixa **APOIO**: Orion, Gráfica Líder, Vader, Zoctech. Rodapé da seção: **MARCAS OFICIAIS** (4 logos) e **ZANGAS, O MASCOTE** (3 versões). |
| 3 | **Mídia** (continua "Sobre" no menu) | Coluna esquerda "// ACOMPANHE!" com embed do último post do Instagram. Coluna direita "// ASSISTA!" com embed de vídeo do YouTube. Linha "SIGA **@ZISTEAMBR** NAS REDES SOCIAIS." + ícones Instagram, YouTube, TikTok, Threads. |
| 4 | **Racing** `#racing` | Título "// RACING.", parágrafo, render do carro #215 à direita. 3 colunas: selos ZISTEAM/RACING (preto), /CLUB (branco), /NEXT (amarelo), cada um com seu texto. |
| 5 | **Sports** `#sports` | Título "// SPORTS.", parágrafo, 4 ícones de modalidade (musculação, futebol, boxe, padel/beach tennis), foto do atleta com raquete à direita, fundida no preto. |
| 6 | **Gaming** `#gaming` | Título "// GAMING.", parágrafo, logos Valorant, Counter-Strike 2, Overwatch (cinza), arte de personagens à direita. |
| 7 | **Contato** `#contato` | Título "// CONTATO.", parágrafo, **formulário** (Nome, **Contato** — e-mail ou WhatsApp; campo adicionado, não está no PDF —, Assunto, Mensagem, botão ENVIAR; o novo campo segue o mesmo estilo de rótulo e caixa dos demais, entre Nome e Assunto). À direita: mascote Zangas sobre texto vazado amarelo, "Contatos:" +55 32 9 8474-1460 / contato@zisteam.com, selo #VAMOZIS, créditos "Desenvolvimento: Zoctech" e "Identidade visual: Orion Criativa". |

Os textos devem ser copiados **literalmente** do PDF.

### Sistema visual (extraído das telas)

- **Cores:** fundo `#000000`; amarelo destaque ≈ `#FFC20E` (confirmar hex no arquivo-fonte); branco `#FFFFFF` para títulos; cinza ≈ `#A6A6A6` para corpo; cinza escuro `#3A3A3A` para ícones/logos esmaecidos e botão ENVIAR.
- **Tipografia:** títulos e menu em sans **condensada pesada, caixa alta** (aparência de Bebas Neue/Anton — confirmar fonte original); corpo em **Montserrat Light**, ~28 px em 1920 px de largura, entrelinha ~1,75.
- **Assinatura gráfica:** barras duplas inclinadas `//` em amarelo antes de títulos e do item ativo do menu.
- **Grade:** margem lateral ~155 px em 1920 px (≈8%); conteúdo em 2 colunas (texto à esquerda, imagem à direita) nas seções 4–7.

## 6. Requisitos

### P0 — sem isso não lança

**R1. Reprodução fiel das 7 telas em HTML/CSS**
- [ ] Em viewport 1920×1080, sobrepor o print da seção à tela do PDF mostra desvio ≤ ~10 px em posição dos blocos principais (logo, menu, título, texto, imagem).
- [ ] Todo texto é texto real (selecionável), não imagem.
- [ ] Imagens recortadas (carro, atleta, personagens, mascote) com fundo transparente/fundido ao preto, como no PDF.
- [ ] Fontes carregadas localmente (self-hosted, `font-display: swap`).

**R2. Navegação**
- [ ] Clicar num item do menu rola suavemente até a seção.
- [ ] O item da seção visível fica amarelo com `//` (Mídia mantém "Sobre a Zis" ativo, como no PDF).
- [ ] Abaixo de 1024 px o menu vira botão hambúrguer com painel em tela cheia; fecha ao escolher um item ou com Esc.

**R3. Responsividade**
- [ ] Sem rolagem horizontal de 360 px a 2560 px.
- [ ] Abaixo de 1024 px, as colunas empilham (texto → imagem); os 3 cards de Racing viram 1 coluna.
- [ ] Títulos escalam com `clamp()`; corpo nunca abaixo de 16 px.

**R4. Formulário de contato — front-end**
- [ ] Campos Nome (máx. 120), **E-mail ou WhatsApp** (máx. 160), Assunto (máx. 160), Mensagem (máx. 3000), todos obrigatórios, com `<label>` associado.
- [ ] "E-mail ou WhatsApp" aceita **um e-mail válido** ou **um telefone brasileiro** (10–11 dígitos após remover espaços, parênteses e traços; `+55` opcional). Fora disso: "Informe um e-mail ou WhatsApp válido para podermos responder". A mesma validação roda no servidor.
- [ ] Validação no cliente antes do envio, com mensagem por campo.
- [ ] Botão ENVIAR desabilitado e com indicação de "Enviando…" durante o envio; impede envio duplo.
- [ ] Sucesso: mensagem de confirmação e campos limpos. Erro: mensagem clara, campos preservados para nova tentativa.
- [ ] Campo honeypot invisível; envio com ele preenchido é descartado silenciosamente (responde sucesso, não grava).

**R5. Envio por e-mail a cada envio**
- Given um envio válido, When o servidor processa, Then um e-mail chega a `CONTACT_NOTIFICATION_EMAIL` com assunto `Novo contato ZisTeam: <assunto>` e corpo com Nome, Contato, Assunto, Mensagem, data/hora (horário de Brasília).
- [ ] Se o contato for e-mail, ele vai no `reply_to` — "Responder" no Gmail responde direto ao visitante.
- [ ] Se for telefone, o e-mail traz um link `https://wa.me/55<número>` para abrir a conversa no WhatsApp.
- [ ] Conteúdo do usuário escapado (sem injeção de HTML no e-mail).
- [ ] Envio pelo **Gmail da conta pessoal** dona da planilha, via Apps Script (`MailApp`, até 100/dia). Destinatário definido no script (`AVISAR_PARA`).

**R6. Registro na planilha a cada envio**
- Given um envio válido, When o servidor processa, Then uma nova linha é anexada à aba configurada no script (`NOME_DA_ABA`, hoje `Página1`) com: `Data/Hora` (America/Sao_Paulo, `dd/mm/aaaa hh:mm:ss`) · `Nome` · `Contato` · `Assunto` · `Mensagem` (colunas A–E).
- [ ] Gravação feita pelo Apps Script ligado à planilha, rodando como a conta pessoal dona dela; só aceita chamadas com `APPS_SCRIPT_SECRET`.
- [ ] Valores começando com `=`, `+`, `-` ou `@` entram como texto (fórmulas nunca são executadas na planilha).

**R7. Ordem e falhas do processamento (`POST /api/contact`)**
1. Valida payload → 400 se inválido.
2. Grava na planilha → se falhar, **502** e o usuário vê "tente novamente" (nada foi perdido do lado dele, campos preservados).
3. Envia e-mail → se falhar após gravar, responde **202** "Mensagem registrada" e loga o erro (o contato está seguro na planilha).
- [ ] Variáveis ausentes → 503 "formulário ainda não configurado", nunca erro 500 genérico.
- [ ] Segredos só no servidor; nenhum aparece no bundle do front-end.

**R8. Hospedagem**
- [ ] Deploy na **Vercel** (front estático Vite + função serverless `/api/contact`), variáveis cadastradas no projeto Vercel (Production e Preview).
- [ ] HTTPS, meta tags (title, description, Open Graph com imagem), favicon com o símbolo Z.

### P1 — logo após o lançamento

- **Embeds reais:** último post do Instagram (via widget/embed oficial) e vídeo do YouTube (`youtube-nocookie.com`, carregado só ao clicar — facade — para não pesar o carregamento).
- **Proteção anti-spam forte:** Cloudflare Turnstile no formulário + limite de 5 envios/IP/hora.
- **Carrossel do hero com mais imagens** (autoplay 6 s, pausa no hover, swipe no celular, respeita `prefers-reduced-motion`).
- **Animações de entrada** sutis nas seções (fade/slide), desligadas com `prefers-reduced-motion`.
- **Analytics** (Vercel Web Analytics) com evento `form_submit_success`.

### P2 — considerar no design, não construir agora

- Conteúdo (textos, links, logos de apoio) centralizado num único arquivo `content.ts`, para trocar por CMS no futuro.
- Domínio próprio `zisteam.com`; se o volume passar de 100 avisos/dia, migrar o envio para Google Workspace ou um serviço de e-mail.
- Subpáginas por divisão (links "saiba mais" nos cards de Racing/Sports/Gaming).
- Versão em inglês (estrutura de textos já separada facilita i18n).

## 7. Métricas de sucesso

| Tipo | Métrica | Meta | Como medir | Quando |
|---|---|---|---|---|
| Leading | Envios válidos que geram linha **e** e-mail | ≥ 99% | Linhas da planilha × e-mails recebidos × logs da função | 1ª semana |
| Leading | Erros 5xx em `/api/contact` | < 1% | Logs Vercel | 1ª semana |
| Leading | Lighthouse mobile Performance / A11y / SEO | ≥ 85 / ≥ 90 / ≥ 90 | Lighthouse na URL de produção | No lançamento |
| Leading | Aprovação visual da Orion (identidade) | Aprovado sem ajustes P0 | Revisão lado a lado com o PDF | Antes do lançamento |
| Lagging | Contatos qualificados via site | Meta a definir com a equipe | Planilha | 30 e 90 dias |

## 8. Integração com Google (decidido em 18/11/2026: conta pessoal, sem conta de serviço)

A planilha e o e-mail usam a **conta Google pessoal** do responsável, via **Google Apps Script** (`apps-script/Code.gs`)
publicado como "App da Web" (executa como o dono, acesso "Qualquer pessoa", protegido por segredo).
O site chama o script pelo servidor; o script grava a linha e envia o aviso pelo Gmail (`MailApp`).
Isso dispensa conta de serviço, chave privada e o Resend.

| Variável (`ZisBetter Team/.env`) | Situação |
|---|---|
| `APPS_SCRIPT_SECRET` | ✅ gerado (64 caracteres) e já inserido no `apps-script/Code.local.gs` |
| `APPS_SCRIPT_URL` | ❌ **vazio** — preencher após implantar o script |
| `GOOGLE_*`, `RESEND_*`, `CONTACT_*` | Não usadas pelo site novo (destinatário e aba agora ficam no script) |

**Passos manuais** (na conta Google do responsável — a IA não faz login em contas):
1. Planilha → *Extensões → Apps Script* → colar `apps-script/Code.local.gs` → salvar.
2. Executar a função `autorizar` e aceitar as permissões (planilha + envio de e-mail).
3. *Implantar → Nova implantação → App da Web* (executar como: Eu; acesso: Qualquer pessoa) → copiar a URL `/exec` para `APPS_SCRIPT_URL`.

Depois disso, a IA testa um envio real ponta a ponta, cadastra as variáveis na Vercel e faz o deploy.

Limites: Gmail pessoal envia até 100 e-mails/dia por `MailApp`; Apps Script responde em ~1–3 s.

## 9. Perguntas em aberto

| # | Pergunta | Quem responde | Bloqueia? |
|---|---|---|---|
| 1 | ~~O formulário do PDF não pede e-mail nem telefone — como responder?~~ **Decidido (12/11/2026):** adicionar campo obrigatório "E-mail ou WhatsApp". | Stakeholder | Resolvida |
| 2 | Arquivos-fonte em alta: logos (SVG), renders do carro, foto do atleta, arte do mascote, fontes originais. O PDF tem 84 MB — dá para extrair, mas o ideal são os originais da Orion. | Design (Orion) | **Sim** para fidelidade final |
| 3 | Uso de arte e logos de Valorant/CS2/Overwatch: a equipe tem autorização? Personagens da Riot em site comercial podem gerar notificação de direitos. | Jurídico / Stakeholder | Não (pode lançar com logos, trocar arte por foto própria) |
| 4 | URLs oficiais: Instagram, YouTube, TikTok, Threads (@zisteambr?) e qual vídeo do YouTube embedar. | Stakeholder | Não (ícones ficam ocultos até haver URL) |
| 5 | O domínio `zisteam.com` já está registrado? Onde fica o DNS? | Stakeholder | Não (lança em `*.vercel.app`) |
| 6 | Quais imagens extras entram no carrossel do hero? (PDF mostra só uma) | Design | Não |
| 7 | ~~Texto vazado atrás do mascote~~ **Resolvida:** o PDF traz "TROPA DO ZANGAS!". | Design | Resolvida |
| 9 | A fonte do layout é a **Thunder**. Há licença para uso web? Sem ela, o site usa Anton (títulos) e League Gothic (menu), que reproduzem as proporções. | Design (Orion) | Não |
| 10 | Foto do topo sem o logo aplicado: a imagem do PDF veio com o logo "colado"; foi retocada, mas o ideal é o arquivo limpo. | Design (Orion) | Não |
| 8 | Aviso de privacidade (LGPD) no formulário: basta uma linha "Usaremos seus dados apenas para responder ao contato"? | Jurídico | Não |

## 10. Cronograma e fases

Sem prazo rígido informado (confirmar se há evento/temporada de lançamento).

| Fase | Entrega | Depende de |
|---|---|---|
| **1. Estrutura** | Projeto Vite+React+TS+Tailwind em `ClaudeCode`, cabeçalho, navegação, 7 seções com layout fiel usando assets extraídos do PDF | — |
| **2. Formulário** | Front-end do formulário + `/api/contact` com planilha e e-mail; testado localmente | Credenciais (seção 8) |
| **3. Deploy** | Projeto Vercel, variáveis, teste ponta a ponta em produção (envio real → linha + e-mail) | Fase 2 |
| **4. Polimento (P1)** | Embeds, Turnstile, carrossel, animações, analytics | URLs (pergunta 4) |
| **5. Revisão** | Comparação lado a lado com o PDF pela Orion; ajustes finos com assets originais | Pergunta 2 |
