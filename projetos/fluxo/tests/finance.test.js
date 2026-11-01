import test from 'node:test';
import assert from 'node:assert/strict';
import { validDate, parseMoney, inputMoney, daysBetween, statusOf, cohort, summarize, filterRecords, validateRecord, validateState, exportCSV, parseCSV, importCSV, monthsBefore, escapeHTML } from '../dist/core.js';
import { createDemo } from '../dist/seed.js';

const ref = '2026-10-26';
const base = { id: 'a', invoice: 'NF-001', client: 'Café & Cia', category: 'Serviços', dueDate: '2026-10-25', amount: 125001, paidAt: null, method: '', notes: '' };
const nextId = () => { let i = 0; return () => `csv-${++i}`; };

test('valores brasileiros são convertidos em centavos sem arredondamento binário', () => {
  for (const [source, expected] of [['1.250,01',125001],['0,01',1],['R$ 10,9',1090],['1234',123400],['1.000.000.000,00',100000000000]]) assert.equal(parseMoney(source), expected);
  assert.equal(inputMoney(125001), '1250,01');
  assert.equal(summarize([{ ...base, amount: 10 },{ ...base, amount: 20 }], ref).expected, 30);
});
test('valores inválidos, negativos e ambíguos são rejeitados', () => {
  for (const value of ['0','-1','1,234','1.25','10.5','Infinity','1e5','1,000.00','1.000.000.000,01','', '1 200']) assert.throws(() => parseMoney(value));
});
test('datas reais, ano bissexto e limites de calendário', () => {
  assert.equal(validDate('2028-02-29'), true); assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-04-31'), false); assert.equal(validDate('2100-12-31'), true);
  assert.equal(validDate('2026-00-01'), false); assert.equal(validDate('1999-12-31'), false);
  assert.equal(daysBetween('2026-10-25', ref), 1); assert.equal(daysBetween('2026-12-31','2027-01-01'), 1);
});
test('vencimento hoje fica a vencer; ontem fica em atraso; baixa até referência prevalece', () => {
  assert.equal(statusOf(base, ref), 'overdue'); assert.equal(statusOf({ ...base, dueDate: ref }, ref), 'pending');
  assert.equal(statusOf({ ...base, dueDate: '2026-10-27' }, ref), 'pending');
  assert.equal(statusOf({ ...base, paidAt: ref }, ref), 'received');
});
test('a carteira é agrupada por vencimento mesmo quando o recebimento ocorre em outro mês', () => {
  const records = [{ ...base, paidAt: '2026-09-30' },{ ...base, id: 'b', dueDate:'2026-09-30', paidAt: ref, amount: 888 }];
  const october = cohort(records, '2026-10'); assert.equal(october.length, 1);
  assert.equal(summarize(october, ref).received, base.amount);
});
test('recebido + em aberto = carteira; atrasado é subconjunto do aberto', () => {
  const records = [base,{ ...base, id:'b', amount:10000, paidAt:ref },{ ...base,id:'c',amount:30000,dueDate:'2026-10-31' }];
  const s = summarize(records, ref);
  assert.equal(s.received + s.open, s.expected); assert.equal(s.overdue, base.amount);
  assert.equal(s.openCount, 2); assert.equal(s.overdueCount, 1); assert.equal(s.receivedCount, 1);
  assert.deepEqual(summarize([],ref), { expected:0,received:0,open:0,overdue:0,count:0,receivedCount:0,openCount:0,overdueCount:0 });
});
test('busca ignora acentos e combina categoria, mês e status', () => {
  assert.equal(filterRecords([base], { month:'2026-10',query:'cafe',category:'Serviços',status:'overdue',asOf:ref }).length,1);
  assert.equal(filterRecords([base], { month:'2026-09',asOf:ref }).length,0);
  assert.equal(filterRecords([base], { query:'NF-001',status:'received',asOf:ref }).length,0);
});
test('cadastro rejeita documento duplicado, mas permite edição do mesmo título', () => {
  assert.throws(() => validateRecord({ ...base, id:'other', invoice:'nf-001' },ref,[base]),/Já existe/);
  assert.doesNotThrow(() => validateRecord({ ...base, client:'Novo nome' },ref,[base]));
});
test('baixa exige data até referência, forma válida e valor inteiro positivo', () => {
  for (const changed of [{paidAt:'2026-10-27',method:'Pix'},{paidAt:ref,method:''},{paidAt:null,method:'Pix'},{amount:1.2},{amount:0},{category:'Inexistente'},{dueDate:'2026-02-30'}]) assert.throws(() => validateRecord({ ...base,...changed },ref));
  assert.doesNotThrow(() => validateRecord({ ...base,paidAt:ref,method:'Pix' },ref));
});
test('CSV trata ponto e vírgula, aspas, acentos, BOM e observações multilinha', () => {
  const record = { ...base, client:'Café; "Origem"', notes:'Primeira linha\nSegunda linha' };
  const csv = exportCSV([record]); const parsed = parseCSV(csv);
  assert.equal(parsed.length,2); assert.equal(parsed[1][1],record.client); assert.equal(parsed[1][7],record.notes);
  const imported = importCSV(csv,ref,[],nextId()); assert.equal(imported[0].amount,125001); assert.equal(imported[0].client,record.client);
});
test('CSV exportado neutraliza fórmulas de planilha nos campos de texto', () => {
  const csv = parseCSV(exportCSV([{ ...base,invoice:'=HYPERLINK("https://example.com")',client:'+SUM(1)',notes:'  @cmd' }]));
  assert.equal(csv[1][0][0],"'"); assert.equal(csv[1][1][0],"'"); assert.equal(csv[1][7][0],"'");
});
test('importação CSV rejeita duplicidade existente e interna antes de retornar qualquer registro', () => {
  assert.throws(() => importCSV(exportCSV([base]),ref,[base],nextId()),/Linha 2.*Já existe/);
  assert.throws(() => importCSV(exportCSV([base,base]),ref,[],nextId()),/Linha 3.*Já existe/);
});
test('CSV aceita datas brasileiras e rejeita coluna ausente, aspas inválidas e linhas excessivas', () => {
  const csv = exportCSV([base]).replace('2026-10-25','25/10/2026');
  assert.equal(importCSV(csv,ref,[],nextId())[0].dueDate,base.dueDate);
  assert.throws(() => importCSV('Cliente;Valor\nA;10,00',ref,[],nextId()),/Cabeçalho/);
  assert.throws(() => parseCSV('"a'),/sem fechamento/);
  assert.throws(() => parseCSV('a"b'),/posição inválida/);
  assert.throws(() => parseCSV('"a"x'),/fechamento/);
  assert.throws(() => importCSV(exportCSV(Array.from({length:1001},(_,i)=>({...base,invoice:'NF-'+i}))),ref,[],nextId()),/1.000/);
});
test('backup restaura o estado completo e rejeita valores inválidos, ids e documentos repetidos', () => {
  const demo = createDemo(); assert.deepEqual(validateState(JSON.parse(JSON.stringify(demo))),demo);
  assert.throws(() => validateState({...demo,records:[base,base]}),/repetidos/);
  assert.throws(() => validateState({...demo,records:[base,{...base,id:'b'}]}),/repetidos/);
  assert.throws(() => validateState({...demo,records:[{...base,paidAt:'2026-10-27',method:'Pix'}]}));
  assert.throws(() => validateState({...demo,goals:{'2026-10':{'Locação':-1}}}));
  assert.throws(() => validateState({...demo,version:2}));
  assert.throws(() => validateState({...demo,asOf:'2026-02-30'}));
});
test('a demonstração tem 96 títulos válidos, valores reconciliados e três status no mês', () => {
  const state=validateState(createDemo()); assert.equal(state.records.length,96);
  const records=cohort(state.records,'2026-10'), s=summarize(records,ref);
  assert.ok(s.receivedCount>0); assert.ok(s.overdueCount>0); assert.ok(s.openCount>s.overdueCount);
  assert.equal(s.received+s.open,s.expected);
});
test('histórico atravessa virada do ano e escapa HTML antes da renderização', () => {
  assert.deepEqual(monthsBefore('2026-02',3),['2025-12','2026-01','2026-02']);
  assert.equal(escapeHTML('<img src="x" onerror="alert(1)">&\''),'&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
});
