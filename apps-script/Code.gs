/**
 * ZisTeam — backend do site na planilha (Google Apps Script).
 *
 * Roda na SUA conta Google (sem conta de serviço):
 *  - grava cada contato do formulário na planilha e envia o aviso pelo seu Gmail;
 *  - guarda as configurações do site (aba "Site") e o acesso do admin (aba "Admin", senha só em hash);
 *  - envia os e-mails do admin (senha temporária) SEMPRE para AVISAR_PARA.
 * O site (servidor da Vercel) chama este script com o segredo; o navegador nunca fala com ele.
 *
 * Instalação (uma vez):
 *  1. Em script.google.com (logado na conta dona da planilha) → Novo projeto. Apague o conteúdo,
 *     cole este arquivo e confira PLANILHA_ID. Salve. (Também funciona pela planilha → Extensões → Apps Script.)
 *  2. Escolha a função "configurar" no topo e clique em Executar. Autorize o acesso
 *     (como o script é seu, o Google mostra "app não verificado": Avançado → Acessar).
 *     O registro de execução mostra a linha APPS_SCRIPT_SECRET=... → copie para o .env.
 *  3. Implantar → Nova implantação → tipo "App da Web" →
 *     Executar como: "Eu"; Quem pode acessar: "Qualquer pessoa" → Implantar.
 *  4. Copie a URL que termina em /exec para APPS_SCRIPT_URL no .env (e na Vercel).
 *
 * Ao alterar este código depois: Implantar → Gerenciar implantações → editar → Nova versão
 * (assim a URL continua a mesma).
 */

// ---- Ambiente -----------------------------------------------------------------------------
// Produção:     PLANILHA_ID da "Cadastros ZisTeam" e AVISAR_PARA = zisteambr@gmail.com.
// Homologação:  projeto de script SEPARADO, com PLANILHA_ID = '' (a função "configurar" cria a planilha
//               "Cadastros ZisTeam (homologação)") e AVISAR_PARA = e-mail de quem testa.
const PLANILHA_ID = '1aJ55F0I0E22gCITfngjH4_pp9SICkTM1v5-MRB7_A6A'; // "Cadastros ZisTeam" (trecho da URL entre /d/ e /edit)
const AVISAR_PARA = 'zisteambr@gmail.com'; // recebe os contatos e é o e-mail da conta de admin
const NOME_PLANILHA_NOVA = 'Cadastros ZisTeam (homologação)';
const NOME_DA_ABA = 'Página1';                 // aba onde os contatos são gravados
const CABECALHO = ['Data/Hora', 'Nome', 'Contato', 'Assunto', 'Mensagem'];

const ABA_SITE = 'Site';
const ABA_ADMIN = 'Admin';
const CAMPOS_SITE = ['youtube_modo', 'youtube_canal', 'youtube_video', 'instagram_modo', 'instagram_behold', 'instagram_post'];
const CAMPOS_ADMIN = ['usuario', 'hash', 'temp_hash', 'temp_expira', 'temp_criada', 'precisa_trocar', 'versao', 'falhas', 'bloqueado_ate', 'atualizado_em'];

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return responder({ ok: false, error: 'json_invalido' });
  }
  const segredo = PropertiesService.getScriptProperties().getProperty('SEGREDO');
  if (!segredo || !body || body.secret !== segredo) return responder({ ok: false, error: 'nao_autorizado' });

  try {
    switch (body.action || 'contato') {
      case 'contato': return responder(receberContato(body));
      case 'lerConfig': return responder({ ok: true, config: lerChaveValor(ABA_SITE, CAMPOS_SITE) });
      case 'salvarConfig': return responder(comTrava(() => { salvarChaveValor(ABA_SITE, CAMPOS_SITE, body.config || {}); return { ok: true }; }));
      case 'lerAdmin': return responder({ ok: true, admin: lerChaveValor(ABA_ADMIN, CAMPOS_ADMIN), email: emailDoAdmin() });
      case 'salvarAdmin': return responder(comTrava(() => { salvarChaveValor(ABA_ADMIN, CAMPOS_ADMIN, body.admin || {}); return { ok: true }; }));
      case 'emailAdmin': return responder(enviarEmailAdmin(body.email || {}));
      default: return responder({ ok: false, error: 'acao_invalida' });
    }
  } catch (err) {
    console.error('Falha na ação ' + body.action, err);
    return responder({ ok: false, error: 'erro_interno' });
  }
}

function receberContato(body) {
  if (!Array.isArray(body.row) || body.row.length !== CABECALHO.length) return { ok: false, error: 'linha_invalida' };

  // 1) Planilha — se falhar, o site mostra erro e o visitante pode tentar de novo.
  const gravado = comTrava(() => {
    const aba = obterAba();
    if (aba.getLastRow() === 0) aba.appendRow(CABECALHO);
    aba.appendRow(body.row.map(comoTexto));
    return { ok: true };
  });
  if (!gravado.ok) return { ok: false, error: 'planilha' };

  // 2) E-mail — se falhar, o contato já está salvo.
  try {
    const email = body.email || {};
    const opcoes = { name: 'Site ZisTeam', htmlBody: String(email.html || '') };
    if (email.replyTo) opcoes.replyTo = String(email.replyTo);
    MailApp.sendEmail(AVISAR_PARA, String(email.subject || 'Novo contato ZisTeam'), String(email.text || ''), opcoes);
    return { ok: true, notification: true };
  } catch (err) {
    console.error('Falha ao enviar e-mail', err);
    return { ok: true, notification: false };
  }
}

/** E-mails do admin vão sempre para o endereço que recebe os contatos (o site não escolhe o destino). */
function enviarEmailAdmin(email) {
  try {
    MailApp.sendEmail(emailDoAdmin(), String(email.subject || 'Site ZisTeam'), String(email.text || ''), { name: 'Site ZisTeam', htmlBody: String(email.html || '') });
    return { ok: true };
  } catch (err) {
    console.error('Falha ao enviar e-mail do admin', err);
    return { ok: false, error: 'email' };
  }
}

function emailDoAdmin() {
  return AVISAR_PARA.split(',')[0].trim();
}

/**
 * Execute uma vez pelo editor: autoriza planilha + e-mail, cria o cabeçalho
 * e gera o segredo compartilhado com o site (mostrado no registro de execução).
 */
function configurar() {
  const props = PropertiesService.getScriptProperties();
  let segredo = props.getProperty('SEGREDO');
  if (!segredo) {
    segredo = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('SEGREDO', segredo);
  }
  if (!PLANILHA_ID && !props.getProperty('PLANILHA_ID')) {
    const nova = SpreadsheetApp.create(NOME_PLANILHA_NOVA);
    props.setProperty('PLANILHA_ID', nova.getId());
    console.log('Planilha criada: ' + nova.getUrl());
  }
  const aba = obterAba();
  if (aba.getLastRow() === 0) aba.appendRow(CABECALHO);
  // Só o cabeçalho (sem contatos ainda)? Garante as 5 colunas atuais, incluindo "Contato".
  else if (aba.getLastRow() === 1) aba.getRange(1, 1, 1, aba.getLastColumn()).clearContent().offset(0, 0, 1, CABECALHO.length).setValues([CABECALHO]);
  abaChaveValor(ABA_SITE);
  abaChaveValor(ABA_ADMIN);
  console.log('Planilha OK: ' + planilha().getName() + ' / aba ' + aba.getName() + ' / ' + planilha().getUrl());
  console.log('E-mails do site vão para: ' + AVISAR_PARA);
  console.log('E-mails restantes hoje: ' + MailApp.getRemainingDailyQuota());
  console.log('APPS_SCRIPT_SECRET=' + segredo);
}

function planilha() {
  const id = PLANILHA_ID || PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  if (!id) throw new Error('Planilha não definida: execute a função "configurar".');
  return SpreadsheetApp.openById(id);
}

function obterAba() {
  const p = planilha();
  return p.getSheetByName(NOME_DA_ABA) || p.getSheets()[0];
}

/** Abas "Site" e "Admin": duas colunas (campo | valor), tudo como texto puro. */
function abaChaveValor(nome) {
  const p = planilha();
  let aba = p.getSheetByName(nome);
  if (!aba) {
    aba = p.insertSheet(nome);
    aba.getRange('A:C').setNumberFormat('@');
    aba.getRange(1, 1, 1, 3).setValues([['Campo', 'Valor', 'Atualizado em']]).setFontWeight('bold');
    aba.setFrozenRows(1);
    if (nome === ABA_ADMIN) aba.getRange('E1').setValue('Não edite esta aba: a senha fica só em hash e é trocada pela página /admin do site.');
  }
  return aba;
}

function lerChaveValor(nome, campos) {
  const aba = abaChaveValor(nome);
  const ultima = aba.getLastRow();
  const dados = {};
  if (ultima >= 2) {
    aba.getRange(2, 1, ultima - 1, 2).getValues().forEach(([campo, valor]) => {
      if (campos.indexOf(String(campo)) >= 0) dados[String(campo)] = String(valor);
    });
  }
  return dados;
}

function salvarChaveValor(nome, campos, novos) {
  const aba = abaChaveValor(nome);
  const ultima = aba.getLastRow();
  const linhas = ultima >= 2 ? aba.getRange(2, 1, ultima - 1, 1).getValues().map((r) => String(r[0])) : [];
  const agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
  Object.keys(novos).forEach((campo) => {
    if (campos.indexOf(campo) < 0) return;
    const valor = String(novos[campo] == null ? '' : novos[campo]).slice(0, 2000);
    const i = linhas.indexOf(campo);
    if (i >= 0) aba.getRange(i + 2, 2, 1, 2).setValues([[valor, agora]]);
    else { aba.appendRow([campo, valor, agora]); linhas.push(campo); }
  });
}

function comTrava(fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    return fn();
  } catch (err) {
    console.error('Falha ao gravar na planilha', err);
    return { ok: false, error: 'planilha' };
  } finally {
    lock.releaseLock();
  }
}

/** Grava sempre como texto: um valor como "=IMPORTXML(...)" nunca vira fórmula. */
function comoTexto(valor) {
  const s = String(valor == null ? '' : valor);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
