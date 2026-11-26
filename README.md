# ZisTeam — landing page

Página única construída a partir do layout `Site ZisTeam v1.pdf` (spec em [docs/SPEC-landing-zisteam.md](docs/SPEC-landing-zisteam.md)).
React + Vite, CSS próprio e uma função serverless (`/api/contact`) que, a cada envio do formulário,
repassa o contato a um **Google Apps Script publicado na sua conta Google pessoal**. O script
**grava uma linha na planilha** e **envia o e-mail de aviso pelo seu Gmail** — sem conta de serviço e sem serviço de e-mail externo.

## Rodar localmente

Requer [Bun](https://bun.sh) (ou Node 20 + npm).

```bash
bun install
bun --bun vite            # http://127.0.0.1:5173
bun test server           # testes do backend do formulário
bun --bun tsc -b && bun --bun vite build
```

Em desenvolvimento, o próprio Vite atende `POST /api/contact` com o mesmo código da Vercel.
As variáveis são lidas de `../.env` (pasta "ZisBetter Team") e, se existir, de `./.env` (que sobrescreve).

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `APPS_SCRIPT_URL` | URL da implantação "App da Web" do script (termina em `/exec`) |
| `APPS_SCRIPT_SECRET` | Segredo compartilhado; o mesmo valor da constante `SEGREDO` no script |

Sem elas, o formulário responde "ainda não está configurado" (HTTP 503) e o log do servidor diz qual falta.

### Configuração única (na sua conta Google, ~5 minutos)

**Já feito em 25/11/2026** na conta zoctechsolution@gmail.com: projeto "ZisTeam - Formulário de contato" em
[script.google.com](https://script.google.com), implantado como App da Web (versão 1), com `APPS_SCRIPT_URL` e
`APPS_SCRIPT_SECRET` gravados no `../.env`. Para refazer do zero:

1. Em script.google.com (logado na conta dona da planilha) → **Novo projeto** → cole `apps-script/Code.gs` (confira `PLANILHA_ID`) → salve.
2. Escolha a função **`configurar`** e clique em **Executar**. Autorize o acesso à planilha e ao envio de e-mail
   (o Google avisa "app não verificado" porque o script é seu: **Avançado → Acessar**). Ela cria/ajusta o cabeçalho
   `Data/Hora | Nome | Contato | Assunto | Mensagem` e mostra no registro `APPS_SCRIPT_SECRET=…` → copie para o `.env`.
3. **Implantar → Nova implantação →** tipo **App da Web**; *Executar como:* **Eu**; *Quem pode acessar:* **Qualquer pessoa** → Implantar.
4. Copie a URL `https://script.google.com/macros/s/…/exec` para `APPS_SCRIPT_URL` no `.env` (e depois na Vercel).

Com várias contas Google no mesmo Chrome, o atalho "Extensões → Apps Script" da planilha pode dar "Não foi possível abrir o arquivo";
por isso o projeto é criado direto em script.google.com.

"Qualquer pessoa" só significa que o endereço aceita chamadas; o script recusa tudo que não traz o `APPS_SCRIPT_SECRET`,
que fica apenas no servidor (nunca vai para o navegador).
Ao mudar o código do script depois: **Implantar → Gerenciar implantações → editar → Nova versão** (a URL não muda).

## Como o envio funciona

1. Valida os campos (servidor e navegador). Campo "Contato" aceita e-mail ou telefone brasileiro.
2. O servidor manda ao script a linha (horário de Brasília) e o e-mail já montado, junto com o segredo.
3. O script grava a linha (valores começando com `=`, `+`, `-` ou `@` entram como texto, nunca como fórmula). Se falhar → erro 502 e o visitante pode tentar de novo.
4. O script envia o aviso pelo seu Gmail (cota de 100 e-mails/dia em conta pessoal). Se o contato informou e-mail, "Responder" vai direto a ele; se informou telefone, vem um link do WhatsApp. Se só o e-mail falhar, o contato já está salvo e o visitante vê sucesso (202).
5. Um campo invisível (honeypot) descarta envios de robôs.

## Admin (/admin)

`https://zisteambr.vercel.app/admin` — usuário **zisteam_admin**.

- **Primeiro acesso / esqueci a senha:** gera uma senha temporária (vale 60 min) e envia para o e-mail que recebe os
  contatos (`AVISAR_PARA` no script, hoje zisteambr@gmail.com). Ao entrar com ela, o admin exige criar uma senha nova
  (mín. 10 caracteres, letras e números). Pedir uma temporária não derruba a senha atual; reenvio só após 5 min.
- **Trocar senha:** dentro do admin; encerra as outras sessões e avisa por e-mail.
- **Segurança:** a senha fica só em hash (scrypt) na aba "Admin" da planilha; sessão em cookie assinado (8 h);
  5 senhas erradas bloqueiam o login por 15 min. Não edite a aba "Admin" à mão.
- **Configurações** (gravadas na aba "Site"): vídeo do YouTube (último do canal pelo RSS, fixo ou nenhum) e post do
  Instagram (automático pelo feed JSON do Behold, post fixo ou a imagem padrão). O site lê em `/api/site-config`,
  com cache de 5 minutos.

## Editar conteúdo

Textos, links das redes, ID do vídeo do YouTube e imagens ficam em [`src/content.ts`](src/content.ts).
Para ativar as setas do carrossel do topo, adicione mais imagens em `heroSlides`.

## Deploy (Vercel)

Publicado em **https://zisteambr.vercel.app** (projeto `site-zisteam`, time ZisTeam na Vercel, ligado a este
repositório: cada push na `main` publica sozinho). As variáveis `APPS_SCRIPT_URL` e `APPS_SCRIPT_SECRET`
estão cadastradas no projeto. Os avisos do formulário vão para `zisteambr@gmail.com` (constante `AVISAR_PARA` no script).
`vercel.json` já define a saída `dist`; a função fica em `api/contact.ts`.

### Homologação (testes sem afetar o site oficial)

- Branch **`homolog`**: cada push gera um deploy de *Preview* na Vercel (URL `site-zisteam-git-homolog-…vercel.app`,
  protegida pelo login da Vercel). Nada disso muda `zisteambr.vercel.app` / `zisteam.com`.
- Na Vercel, `APPS_SCRIPT_URL` e `APPS_SCRIPT_SECRET` existem em duas versões: **Production** (script/planilha oficiais)
  e **Preview** (script de homologação, planilha "Cadastros ZisTeam (homologação)", e-mails para quem testa).
- O site de homologação mostra uma faixa amarela "HOMOLOGAÇÃO" no rodapé; em `bun run dev` aparece "DESENVOLVIMENTO"
  (o `.env` local aponta para o script de homologação).
- O admin de homologação é independente: usuário `zisteam_admin`, senha própria, enviada ao e-mail de teste.
- Para levar uma mudança testada ao ar: merge de `homolog` na `main`.

## Fidelidade ao PDF

As imagens foram extraídas do próprio PDF (`docs/referencia/` tem as telas originais renderizadas).
A fonte do layout (Thunder) não tem licença web conhecida; usamos **Anton** (títulos) e **League Gothic** (menu),
que reproduzem as proporções. Para usar a Thunder, troque as variáveis `--font-display` e `--font-nav` em `src/styles.css`.
Em desenvolvimento, `/?only=racing` (ou outra seção) mostra uma seção isolada para comparar com o PDF.
