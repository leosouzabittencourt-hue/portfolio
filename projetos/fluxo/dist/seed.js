import { CATEGORIES } from './core.js';
export function createDemo() {
  const clients = ['Aurora Design', 'Verde & Grão', 'Studio Norte', 'Atlas Tecnologia', 'Café Origem', 'Ótica Horizonte', 'Casa Elemento', 'Vértice Digital', 'Flora Natural', 'Livraria Capítulo', 'Ponto Criativo', 'Nuvem Serviços'];
  const base = [1480000, 1120000, 840000, 1760000, 625000, 970000, 1350000, 780000, 540000, 890000, 1250000, 1530000];
  const dueDays = [3, 5, 7, 10, 12, 14, 17, 20, 22, 26, 29, 30];
  const records = [], goals = {};
  for (let month = 3; month <= 10; month++) {
    const prefix = `2026-${String(month).padStart(2, '0')}`;
    goals[prefix] = { 'Locação': 6000000 + month * 90000, 'Serviços': 2300000, 'Mídia': 2500000, 'Outros': 1300000 };
    clients.forEach((client, i) => {
      const dueDate = `${prefix}-${String(dueDays[i]).padStart(2, '0')}`;
      const category = CATEGORIES[[0, 0, 1, 0, 3, 0, 0, 2, 3, 1, 2, 0][i]];
      const received = month < 10 ? !(month === 9 && i === 7) : [0, 1, 2, 3, 4, 5, 6, 9].includes(i);
      records.push({ id: `demo-${month}-${i}`, invoice: `NF-${260000 + month * 100 + i + 1}`, client, category, dueDate, amount: base[i] + (month - 3) * (i % 3 + 1) * 13500, paidAt: received ? `${prefix}-${String(Math.max(1, dueDays[i] - (i % 3))).padStart(2, '0')}` : null, method: received ? ['Pix', 'Boleto', 'Transferência'][i % 3] : '', notes: i === 7 && month === 10 ? 'Aguardando retorno sobre previsão de pagamento.' : '' });
    });
  }
  return { version: 1, asOf: '2026-10-26', records, goals };
}
