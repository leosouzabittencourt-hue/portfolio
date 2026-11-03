/** Financial domain: integer cents, local calendar dates, due-date cohorts. */
export const CATEGORIES = ['Locação', 'Serviços', 'Mídia', 'Outros'];
export const METHODS = ['Pix', 'Boleto', 'Transferência', 'Cartão', 'Outro'];
export const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const shortMoney = cents => cents >= 100000 ? `R$ ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(cents / 100000)} mil` : money(cents);
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export const dateLabel = value => validDate(value) ? value.split('-').reverse().join('/') : '—';
export function parseMoney(value) {
  if (typeof value !== 'string') throw new Error('Informe um valor válido.');
  const clean = value.trim().replace(/^R\$\s*/, '');
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(clean)) throw new Error('Use o formato 1.250,00 para o valor.');
  const [whole, fraction = ''] = clean.replaceAll('.', '').split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100000000000) throw new Error('O valor deve estar entre R$ 0,01 e R$ 1 bilhão.');
  return cents;
}
export const inputMoney = cents => (cents / 100).toFixed(2).replace('.', ',');
export const daysBetween = (from, to) => Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);
export function statusOf(record, asOf) {
  if (record.paidAt && record.paidAt <= asOf) return 'received';
  return record.dueDate < asOf ? 'overdue' : 'pending';
}
export const statusLabel = status => ({ received: 'Recebido', overdue: 'Em atraso', pending: 'A vencer' }[status] || '');
export const cohort = (records, month) => records.filter(r => r.dueDate.slice(0, 7) === month);
export function summarize(records, asOf) {
  const result = { expected: 0, received: 0, open: 0, overdue: 0, count: records.length, receivedCount: 0, openCount: 0, overdueCount: 0 };
  for (const record of records) {
    result.expected += record.amount;
    const status = statusOf(record, asOf);
    if (status === 'received') { result.received += record.amount; result.receivedCount++; }
    else {
      result.open += record.amount; result.openCount++;
      if (status === 'overdue') { result.overdue += record.amount; result.overdueCount++; }
    }
  }
  return result;
}
export function filterRecords(records, { month, query = '', status = 'all', category = 'all', asOf }) {
  const normal = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  return records.filter(r => (!month || r.dueDate.startsWith(month)) && (category === 'all' || r.category === category) && (status === 'all' || statusOf(r, asOf) === status) && normal(`${r.client} ${r.invoice} ${r.notes}`).includes(normal(query.trim())));
}
export function validateRecord(record, asOf, existing = []) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Título inválido.');
  for (const [field, label, max] of [['id', 'Identificador', 100], ['invoice', 'Documento', 40], ['client', 'Cliente', 100]]) {
    if (typeof record[field] !== 'string' || !record[field].trim() || record[field].length > max) throw new Error(`${label}: preencha até ${max} caracteres.`);
  }
  if (existing.some(r => r.id !== record.id && r.invoice.toLocaleLowerCase('pt-BR') === record.invoice.toLocaleLowerCase('pt-BR'))) throw new Error('Já existe um título com este documento.');
  if (!CATEGORIES.includes(record.category)) throw new Error('Categoria inválida.');
  if (!Number.isSafeInteger(record.amount) || record.amount < 1 || record.amount > 100000000000) throw new Error('Valor inválido.');
  if (!validDate(record.dueDate)) throw new Error('Vencimento inválido. Use uma data de 2000 a 2100.');
  if (record.paidAt !== null && (!validDate(record.paidAt) || record.paidAt > asOf)) throw new Error('O recebimento deve ocorrer até a data de referência.');
  if (typeof record.notes !== 'string' || record.notes.length > 500) throw new Error('A observação pode ter até 500 caracteres.');
  if (typeof record.method !== 'string' || (record.paidAt ? !METHODS.includes(record.method) : record.method !== '')) throw new Error('Forma de recebimento inválida.');
  return { id: record.id.trim(), invoice: record.invoice.trim(), client: record.client.trim(), category: record.category, dueDate: record.dueDate, amount: record.amount, paidAt: record.paidAt, method: record.method, notes: record.notes.trim() };
}
export function validateState(value) {
  if (!value || value.version !== 1 || !validDate(value.asOf) || !Array.isArray(value.records) || value.records.length > 10000) throw new Error('Backup inválido ou incompatível.');
  const records = [], ids = new Set(), invoices = new Set();
  for (const raw of value.records) {
    const record = validateRecord(raw, value.asOf);
    if (ids.has(record.id) || invoices.has(record.invoice.toLocaleLowerCase('pt-BR'))) throw new Error('O backup contém documentos ou identificadores repetidos.');
    records.push(record); ids.add(record.id); invoices.add(record.invoice.toLocaleLowerCase('pt-BR'));
  }
  if (!value.goals || typeof value.goals !== 'object' || Array.isArray(value.goals)) throw new Error('Metas inválidas.');
  const goals = {};
  for (const [month, categories] of Object.entries(value.goals)) {
    if (!/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month) || !categories || typeof categories !== 'object') throw new Error('Mês de meta inválido.');
    goals[month] = {};
    for (const category of CATEGORIES) {
      const amount = categories[category];
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100000000000) throw new Error('Valor de meta inválido.');
      goals[month][category] = amount;
    }
  }
  return { version: 1, asOf: value.asOf, records, goals };
}
const csvCell = value => {
  let clean = String(value ?? '');
  // Text cells must not be evaluated as spreadsheet formulas on export.
  if (/^[\s\uFEFF]*[=+\-@]/u.test(clean)) clean = "'" + clean;
  return /[;"\r\n]/.test(clean) ? `"${clean.replaceAll('"', '""')}"` : clean;
};
export const CSV_HEADERS = ['Documento', 'Cliente', 'Categoria', 'Vencimento', 'Valor', 'Recebimento', 'Forma', 'Observação'];
export function exportCSV(records) {
  return '\uFEFF' + [CSV_HEADERS, ...records.map(r => [r.invoice, r.client, r.category, r.dueDate, inputMoney(r.amount), r.paidAt || '', r.method, r.notes])].map(row => row.map(csvCell).join(';')).join('\r\n');
}
export function parseCSV(source) {
  if (typeof source !== 'string' || source.length > 2000000) throw new Error('O CSV deve ter até 2 MB.');
  source = source.replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === '"') {
      if (cell || closed) throw new Error('Aspas em posição inválida no CSV.');
      quoted = true;
    } else if (ch === ';') { row.push(cell); cell = ''; closed = false; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(cell); if (row.some(v => v.trim())) rows.push(row);
      row = []; cell = ''; closed = false;
    } else {
      if (closed) throw new Error('Conteúdo após fechamento de aspas no CSV.');
      cell += ch;
    }
  }
  if (quoted) throw new Error('O CSV contém aspas sem fechamento.');
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  return rows;
}
export function importCSV(source, asOf, existing, createId) {
  const rows = parseCSV(source);
  const headers = rows.shift();
  if (!headers || CSV_HEADERS.some((h, i) => h !== headers[i]?.trim()) || headers.length !== CSV_HEADERS.length) throw new Error('Cabeçalho inválido. Baixe o modelo CSV para conferir as colunas.');
  if (!rows.length || rows.length > 1000 || rows.length + existing.length > 10000) throw new Error('Importe de 1 a 1.000 títulos, respeitando o limite de 10.000 títulos.');
  const imported = [];
  const dateFromCell = value => /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value.split('/').reverse().join('-') : value;
  rows.forEach((row, index) => {
    try {
      if (row.length !== 8) throw new Error('A linha deve ter 8 colunas.');
      const [invoice, client, category, dueDate, amount, paidAt, method, notes] = row.map(v => v.trim());
      const record = validateRecord({ id: createId(), invoice, client, category, dueDate: dateFromCell(dueDate), amount: parseMoney(amount), paidAt: paidAt ? dateFromCell(paidAt) : null, method, notes }, asOf, [...existing, ...imported]);
      imported.push(record);
    } catch (error) { throw new Error(`Linha ${index + 2}: ${error.message}`); }
  });
  return imported;
}
export function monthsBefore(month, count = 6) {
  const [year, number] = month.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(year, number - count + i, 1)).toISOString().slice(0, 7));
}
export const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
