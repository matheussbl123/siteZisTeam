# Passo a passo: último post do Instagram automático (Behold)

O site não consegue ler o Instagram direto. Quem faz essa ponte é o **Behold** (behold.so): ele lê o perfil
da ZisTeam e devolve um endereço (o "feed JSON") com os últimos posts. Esse endereço é colado no /admin do site,
e a seção de mídia passa a mostrar sozinha o post mais recente.

Tempo: ~10 minutos. Custo: grátis (plano Free).

---

## Antes de começar

- Precisa ser o **Instagram da ZisTeam** (o perfil cujo post deve aparecer no site).
- O perfil precisa ser **conta profissional** (Empresa ou Criador de conteúdo). Conta pessoal não funciona.
  - Para conferir/mudar, no app do Instagram: **Perfil → ☰ → Tipo de conta e ferramentas → Mudar para conta profissional**.
    É grátis e pode ser desfeito.
- Não precisa de página do Facebook.
- Quem tiver a senha do Instagram faz o passo 2. Se for outra pessoa, veja a dica no passo 2.

---

## 1. Criar a conta no Behold

1. Acesse **https://behold.so** e clique em **Sign up free**.
2. Crie a conta com o e-mail da equipe (sugestão: `zisteambr@gmail.com`, para não depender de uma pessoa só).
3. Confirme o e-mail, se ele pedir.

## 2. Conectar o Instagram (no Behold isso se chama "source")

1. No painel do Behold, abra **Sources** e clique em **+ Add source**.
2. Escolha **Basic source** e clique em **Connect**.
3. Vai abrir o login do Instagram: entre no **perfil da ZisTeam**, clique em **Permitir / Allow** e aceite todas as permissões.
4. Pronto: o perfil aparece na lista de sources.

> **Quem tem a senha do Instagram não é quem está no computador?** Ao lado de **Open link** o Behold mostra um link
> de autorização. Copie e mande para o dono do perfil; ele abre no celular/computador dele, faz login e permite.

## 3. Criar o feed

1. Abra **Feeds** e clique em **+ Add feed**.
2. Tipo: **User feed** (posts do perfil, não hashtag).
3. Source: escolha o perfil da ZisTeam conectado no passo 2.
4. Formato: **JSON** (não escolha "Widget").
5. Dê um nome (ex.: `Site ZisTeam`) e clique em **Create feed**.

## 4. Copiar o endereço do feed

1. Clique no feed que acabou de criar.
2. Na página dele aparece o **endereço do feed**, no formato:
   `https://feeds.behold.so/AbCdEf123456`
3. Copie esse endereço inteiro.

> Dica: abra o endereço numa aba do navegador. Se aparecer um texto com `permalink`, `mediaUrl` etc., está funcionando.

## 5. Colar no /admin do site

1. Entre em **https://zisteambr.vercel.app/admin** (ou `zisteam.com/admin` quando o domínio estiver ativo) com o usuário `zisteam_admin`.
   - Para testar antes sem mexer no site oficial, use a homologação: `https://site-zisteam-git-homolog-zis-team.vercel.app/admin`.
2. Em **Instagram**, marque **Último post automático (feed do Behold)**.
3. Cole o endereço no campo **Endereço do feed do Behold** e clique em **Salvar configurações**.
4. Abra o site e role até a seção de mídia: em até ~5 minutos aparece o post mais recente.

---

## Bom saber

| Assunto | Como funciona no plano grátis |
|---|---|
| Atualização | O Behold atualiza os posts **1 vez por dia**. Um post novo pode levar até 24 h para aparecer no site. |
| Limite de acessos | **1.200 leituras do feed por mês**. Se passar, o feed fica pausado até o mês seguinte (o site mostra a imagem padrão nesse período). |
| Quantidade | 1 perfil, 1 feed, até 6 posts (o site só usa o mais recente). |
| Planos pagos | Starter, US$ 10/mês: atualiza a cada hora. Só vale se o post precisar aparecer mais rápido. |

**Se trocar a senha do Instagram** (ou o perfil virar privado), o Behold perde o acesso: entre em **Sources**,
abra o perfil e refaça a autorização pelo mesmo link. Enquanto isso o site mostra a imagem padrão.

**Quer voltar para um post escolhido a dedo?** No /admin, marque **Post fixo** e cole o link do post do Instagram.
O feed do Behold continua guardado para quando quiser voltar ao automático.
