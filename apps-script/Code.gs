/**
 * ZisTeam — recebedor do formulário de contato (Google Apps Script).
 *
 * Roda na SUA conta Google (sem conta de serviço): grava cada contato na planilha
 * e envia o aviso por e-mail a partir do seu Gmail.
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

const PLANILHA_ID = '1aJ55F0I0E22gCITfngjH4_pp9SICkTM1v5-MRB7_A6A'; // "Cadastros ZisTeam" (trecho da URL entre /d/ e /edit)
const AVISAR_PARA = 'matheussbl123@gmail.com'; // separe vários por vírgula
const NOME_DA_ABA = 'Página1';                 // aba onde os contatos são gravados
const CABECALHO = ['Data/Hora', 'Nome', 'Contato', 'Assunto', 'Mensagem'];

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return responder({ ok: false, error: 'json_invalido' });
  }
  const segredo = PropertiesService.getScriptProperties().getProperty('SEGREDO');
  if (!segredo || !body || body.secret !== segredo) return responder({ ok: false, error: 'nao_autorizado' });
  if (!Array.isArray(body.row) || body.row.length !== CABECALHO.length) return responder({ ok: false, error: 'linha_invalida' });

  // 1) Planilha — se falhar, o site mostra erro e o visitante pode tentar de novo.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const aba = obterAba();
    if (aba.getLastRow() === 0) aba.appendRow(CABECALHO);
    aba.appendRow(body.row.map(comoTexto));
  } catch (err) {
    console.error('Falha ao gravar na planilha', err);
    return responder({ ok: false, error: 'planilha' });
  } finally {
    lock.releaseLock();
  }

  // 2) E-mail — se falhar, o contato já está salvo.
  try {
    const email = body.email || {};
    const opcoes = { name: 'Site ZisTeam', htmlBody: String(email.html || '') };
    if (email.replyTo) opcoes.replyTo = String(email.replyTo);
    MailApp.sendEmail(AVISAR_PARA, String(email.subject || 'Novo contato ZisTeam'), String(email.text || ''), opcoes);
    return responder({ ok: true, notification: true });
  } catch (err) {
    console.error('Falha ao enviar e-mail', err);
    return responder({ ok: true, notification: false });
  }
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
  const aba = obterAba();
  if (aba.getLastRow() === 0) aba.appendRow(CABECALHO);
  // Só o cabeçalho (sem contatos ainda)? Garante as 5 colunas atuais, incluindo "Contato".
  else if (aba.getLastRow() === 1) aba.getRange(1, 1, 1, aba.getLastColumn()).clearContent().offset(0, 0, 1, CABECALHO.length).setValues([CABECALHO]);
  console.log('Planilha OK: ' + SpreadsheetApp.openById(PLANILHA_ID).getName() + ' / aba ' + aba.getName());
  console.log('E-mails restantes hoje: ' + MailApp.getRemainingDailyQuota());
  console.log('APPS_SCRIPT_SECRET=' + segredo);
}

function obterAba() {
  const planilha = SpreadsheetApp.openById(PLANILHA_ID);
  return planilha.getSheetByName(NOME_DA_ABA) || planilha.getSheets()[0];
}

/** Grava sempre como texto: um valor como "=IMPORTXML(...)" nunca vira fórmula. */
function comoTexto(valor) {
  const s = String(valor == null ? '' : valor);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
