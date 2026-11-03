import { CATEGORIES, METHODS, money, shortMoney, inputMoney, validDate, dateLabel, parseMoney, daysBetween, statusOf, statusLabel, cohort, summarize, filterRecords, validateRecord, validateState, exportCSV, importCSV, monthsBefore, escapeHTML as esc } from './core.js';
import { createDemo } from './seed.js';
import { icon } from './icons.js';

const STORAGE_KEY = 'fluxo-financeiro:v1';
const tabs = { dashboard: ['Visão geral', 'dashboard'], receivables: ['Recebíveis', 'wallet'], goals: ['Metas', 'target'], reports: ['Relatórios', 'report'] };
let loadWarning = '';
let state;
try { const stored = localStorage.getItem(STORAGE_KEY); state = stored ? validateState(JSON.parse(stored)) : createDemo(); }
catch { state = createDemo(); loadWarning = 'Não foi possível ler os dados salvos. A demonstração foi carregada. Você pode restaurar um backup nas configurações.'; }
const view = { tab: tabs[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard', month: state.asOf.slice(0, 7), query: '', status: 'all', category: 'all', page: 1, sort: 'asc', menu: false };
const mobileLayout = matchMedia('(max-width: 850px)');
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
let toastTimer, activeRecord = null, modalOpener = null;
const uid = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(36)).join('-')}`;
const monthName = month => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T12:00:00Z'));
const monthShort = month => new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(new Date(month + '-01T12:00:00Z')).replace('.', '');
const briefDate = value => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')).replaceAll('.', '');
const percentage = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
const currentRecords = () => cohort(state.records, view.month);
const categoryGoals = () => state.goals[view.month] || Object.fromEntries(CATEGORIES.map(c => [c, 0]));
const totalGoal = () => Object.values(categoryGoals()).reduce((sum, value) => sum + value, 0);
const ratio = (amount, goal) => goal > 0 ? amount / goal * 100 : 0;
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
const badge = record => { const status = statusOf(record, state.asOf); return `<span class="tag ${status}"><span class="dot"></span>${statusLabel(status)}</span>`; };
const button = (action, label, glyph, classes = '') => `<button class="btn ${classes}" data-action="${action}">${glyph ? icon(glyph, 15) : ''}${label}</button>`;
function toast(message, error = false) {
  const node = document.querySelector('#toast');
  clearTimeout(toastTimer); node.textContent = message; node.className = `toast show${error ? ' error' : ''}`;
  toastTimer = setTimeout(() => node.classList.remove('show'), 5000);
}
function commit(next) {
  const clean = validateState(next);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); }
  catch { throw new Error('Não foi possível salvar neste navegador. Libere espaço ou habilite o armazenamento local antes de continuar.'); }
  state = clean; loadWarning = ''; render();
}
function navigate(tab) {
  view.tab = tab; view.menu = false; view.page = 1; view.query = ''; view.category = 'all'; view.status = 'all';
  if (location.hash !== '#' + tab) history.pushState(null, '', '#' + tab);
  render(); document.querySelector('#main').focus({ preventScroll: true });
}
function render() {
  const active = document.activeElement, focusId = active?.id, start = active?.selectionStart, end = active?.selectionEnd;
  const overdueCount = summarize(currentRecords(), state.asOf).overdueCount;
  document.title = `${tabs[view.tab][0]} · Fluxo`;
  app.innerHTML = `<div class="app-shell${view.menu ? ' menu-open' : ''}">
    <button class="backdrop" data-action="close-menu" aria-label="Fechar menu"></button>
    <aside class="sidebar" aria-label="Menu principal" ${mobileLayout.matches && !view.menu ? 'inert aria-hidden="true"' : ''} ${mobileLayout.matches && view.menu ? 'role="dialog" aria-modal="true"' : ''}>
      <a class="brand" href="#dashboard" data-tab="dashboard" aria-label="Fluxo, início"><span class="logo-mark">f</span><span class="logo-name">fluxo</span><span class="brand-dot">.</span></a>
      <div class="workspace"><span class="workspace-icon">${icon('building', 18)}</span><div><small>Empresa demonstrativa</small><strong>Nexo Comercial</strong></div></div>
      <p class="sidebar-label">PRINCIPAL</p>
      <nav class="nav">${Object.entries(tabs).map(([key, [label, glyph]]) => `<button data-tab="${key}" class="${view.tab === key ? 'active' : ''}" ${view.tab === key ? 'aria-current="page"' : ''}>${icon(glyph, 17)}${label}${key === 'receivables' && overdueCount ? `<span class="nav-count">${overdueCount}</span>` : ''}</button>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="demo-card"><div class="eyebrow"><span class="status-dot"></span>Seu próximo passo, mais claro.</div><p>Acompanhe cada recebimento. Transforme números em decisões.</p><button data-tab="reports">Explorar relatórios ${icon('arrow', 13)}</button></div>
      <nav class="nav" aria-label="Suporte"><button data-action="settings">${icon('settings', 17)}Configurações</button><button data-action="about">${icon('code', 17)}Sobre o projeto</button></nav>
      <div class="sidebar-footer">PROJETO DE PORTFÓLIO<span>Leonardo Souza Bittencourt</span></div></div>
    </aside>
    <div class="main-shell" ${mobileLayout.matches && view.menu ? 'inert' : ''}><header class="topbar"><div class="topbar-left"><button class="icon-btn mobile-toggle" data-action="toggle-menu" aria-expanded="${view.menu}" aria-label="Abrir menu">${icon('menu')}</button><div class="breadcrumb">Workspace ${icon('chevron', 11)}<strong>Financeiro</strong>${icon('chevron', 11)}<strong>${tabs[view.tab][0]}</strong></div></div><div class="topbar-right"><span class="local-status"><span class="status-dot"></span>Salvo neste navegador</span><div class="avatar"><span class="avatar-circle">LS</span><div><strong>Leonardo Souza</strong><small>Portfólio profissional</small></div></div></div></header>
    <main class="main" id="main" tabindex="-1">${loadWarning ? `<div class="callout">${esc(loadWarning)}</div>` : ''}${pageHeading()}${view.tab === 'dashboard' ? dashboard() : view.tab === 'receivables' ? receivables() : view.tab === 'goals' ? goalsPage() : reports()}<footer class="foot"><span><span class="foot-brand">FLUXO / </span>Gestão financeira com clareza.</span><span>Dados fictícios · Posição em ${dateLabel(state.asOf)} · <a href="https://github.com/leosouzabittencourt-hue" target="_blank" rel="noopener noreferrer">Leonardo Souza Bittencourt ↗</a></span></footer></main></div></div>`;
  if (focusId) { const node = document.getElementById(focusId); if (node) { node.focus({ preventScroll: true }); if (typeof start === 'number' && node.type === 'search') node.setSelectionRange(start, end); } }
}
function pageHeading() {
  const titles = { dashboard: 'Seu financeiro, <span>sob controle.</span>', receivables: 'Cada recebimento <span>em dia.</span>', goals: 'Uma meta. <span>Um caminho claro.</span>', reports: 'Números que <span>orientam decisões.</span>' };
  const subtitles = { dashboard: 'Uma visão clara de onde você está e para onde quer ir.', receivables: 'Cadastre títulos, acompanhe vencimentos e registre recebimentos.', goals: 'Defina os objetivos do mês e acompanhe cada categoria.', reports: 'Compare os resultados, exporte sua base e compartilhe os avanços.' };
  return `<div class="page-heading"><div><p class="overline">${tabs[view.tab][0]} / ${esc(monthName(view.month))}</p><h1>${titles[view.tab]}</h1><p>${subtitles[view.tab]}</p></div><div class="heading-actions"><label class="period-input" for="month-filter">${icon('calendar', 15)}<input id="month-filter" type="month" min="2000-01" max="2100-12" value="${view.month}" aria-label="Mês de vencimento"></label>${view.tab === 'goals' ? button('edit-all-goals', 'Editar metas', 'edit', 'primary') : view.tab === 'reports' ? button('export', 'Exportar CSV', 'download', 'primary') : button('new', 'Novo título', 'plus', 'primary')}</div></div>
  <div class="report-title">Fluxo · Nexo Comercial · Dados fictícios · Referência ${dateLabel(state.asOf)} · Competência por vencimento</div>`;
}
function metrics() {
  const s = summarize(currentRecords(), state.asOf);
  const items = [
    ['Recebido no mês', s.received, 'wallet', `${s.receivedCount} títulos recebidos`, `${percentage(ratio(s.received, s.expected))}% da carteira`, 'featured', 'green'],
    ['A receber', s.open, 'clock', `${s.openCount} títulos em aberto`, 'Inclui os atrasados', '', 'amber'],
    ['Em atraso', s.overdue, 'alert', `${s.overdueCount} títulos para acompanhar`, 'Prioridade', '', 'red'],
    ['Carteira do mês', s.expected, 'report', `${s.count} títulos previstos`, 'Por vencimento', '', '']
  ];
  return `<div class="summary-note"><span>Competência por vencimento · Posição em ${briefDate(state.asOf)}</span><span class="demo-badge"><span class="status-dot"></span>DEMONSTRAÇÃO <b>· dados fictícios</b></span></div><div class="metrics">${items.map(([label, value, glyph, note, pill, cls, color]) => `<article class="metric ${cls}"><div class="metric-top">${label}<span class="metric-icon">${icon(glyph, 15)}</span></div><div class="value ${cls ? 'green' : ''}">${money(value)}</div><div class="metric-bottom">${color ? `<span class="mini-pill ${color}">${color === 'green' ? icon('check', 10) : ''}${pill}</span>` : ''}<span>${color ? note : pill + ' · ' + note}</span></div></article>`).join('')}</div>`;
}
function trendChart() {
  const months = monthsBefore(view.month, 6);
  const values = months.map(month => summarize(cohort(state.records, month), state.asOf));
  const maximum = Math.max(...values.map(s => s.expected), 1000000);
  const scale = Math.ceil(maximum / 5000000) * 5000000;
  const left = 57, right = 607, top = 15, bottom = 181, width = (right - left) / 6;
  let chart = Array.from({ length: 4 }, (_, i) => { const y = top + (bottom - top) / 3 * i; const value = scale * (3 - i) / 3; return `<line class="chart-grid" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text x="${left - 12}" y="${y + 3}" text-anchor="end" class="chart-label">${value ? Math.round(value / 100000) + ' mil' : '0'}</text>`; }).join('');
  chart += values.map((s, i) => {
    const x = left + i * width + width / 2;
    const expectedHeight = s.expected / scale * (bottom - top), receivedHeight = s.received / scale * (bottom - top);
    return `<g><title>${esc(monthName(months[i]))}: carteira ${money(s.expected)}; recebido ${money(s.received)}</title><rect x="${x - 21}" y="${bottom - expectedHeight}" width="17" height="${expectedHeight}" rx="3" class="chart-bar-bg"/><rect x="${x + 3}" y="${bottom - receivedHeight}" width="17" height="${receivedHeight}" rx="3" class="chart-bar${i === 5 ? ' active' : ''}"/>${i === 5 && s.received ? `<text class="chart-value" x="${x + 11}" y="${bottom - receivedHeight - 8}" text-anchor="middle">${shortMoney(s.received).replace('R$ ', '')}</text>` : ''}<text class="chart-label${i === 5 ? ' active' : ''}" text-anchor="middle" x="${x}" y="207">${monthShort(months[i])}${months[i].slice(0, 4) !== view.month.slice(0, 4) ? '/' + months[i].slice(2, 4) : ''}</text></g>`;
  }).join('');
  return `<section class="panel"><div class="panel-head"><div><h2>Evolução dos recebimentos</h2><p>O previsto e o realizado, mês a mês.</p></div><div class="chart-legend"><span class="legend-item"><span class="legend-dot"></span>Carteira</span><span class="legend-item"><span class="legend-dot green"></span>Recebido</span></div></div><div class="chart-wrap"><svg class="trend-chart" viewBox="0 0 630 220" role="img" aria-label="Comparativo de carteira e recebido nos seis meses até ${esc(monthName(view.month))}">${chart}</svg></div><div class="chart-footnote"><span>Valores em reais · mês de vencimento</span><span>${monthShort(months[0])} — ${monthShort(view.month)} ${view.month.slice(0, 4)}</span></div></section>`;
}
function goalWidget() {
  const received = summarize(currentRecords(), state.asOf).received, goal = totalGoal(), progress = ratio(received, goal), capped = Math.min(progress, 100);
  const path = 'M 25 112 A 65 65 0 1 1 145 112';
  return `<section class="panel goal-panel"><div class="goal-head"><h2>Meta do mês</h2><button class="icon-btn" data-tab="goals" aria-label="Ver metas do mês">${icon('external', 12)}</button></div><div class="goal-ring"><svg viewBox="0 0 170 135" role="img" aria-label="${goal ? percentage(progress) + '% da meta atingida' : 'Meta ainda não definida'}"><path class="ring-track" d="${path}" fill="none" stroke="#334030" stroke-width="12" stroke-linecap="round" pathLength="100"/><path d="${path}" fill="none" stroke="#b9ef80" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="${capped} 100" ${capped === 0 ? 'opacity="0"' : ''}/></svg><div class="ring-text"><strong>${goal ? percentage(progress) + '<span class="small">%</span>' : '—'}</strong><small>${goal ? 'da meta atingida' : 'defina sua meta'}</small></div></div><div class="goal-detail"><span>Recebido</span><strong>${money(received)}</strong></div><div class="goal-detail"><span>Meta mensal</span><strong>${goal ? money(goal) : 'Não definida'}</strong></div><div class="goal-gap"><span>${goal && received >= goal ? 'Acima da meta' : 'Falta para a meta'}</span><strong>${goal ? money(Math.abs(goal - received)) : '—'}</strong></div></section>`;
}
function dashboard() {
  const pending = currentRecords().filter(r => statusOf(r, state.asOf) !== 'received').sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.amount - a.amount);
  return `${metrics()}<div class="dashboard-middle">${trendChart()}${goalWidget()}</div><div class="dashboard-bottom"><section class="panel receivables-panel"><div class="panel-head"><div><h2>Recebíveis em aberto</h2><p>Os próximos títulos que precisam de atenção.</p></div><button class="btn text" data-tab="receivables">Ver todos ${icon('arrow', 13)}</button></div>${pending.length ? renderTable(pending.slice(0, 5), true) : empty('Nenhum título em aberto', 'Sua carteira deste mês está em dia.', 'check')}</section>${priorities(pending)}</div>`;
}
function priorities(pending) {
  const overdue = pending.filter(r => statusOf(r, state.asOf) === 'overdue');
  const dueSoon = pending.filter(r => statusOf(r, state.asOf) === 'pending' && daysBetween(state.asOf, r.dueDate) <= 7);
  const items = [...overdue, ...dueSoon].slice(0, 2);
  return `<section class="panel priorities"><div class="priority-head"><h2>No radar</h2><span class="count">${overdue.length} em atraso</span></div><p class="priority-subtitle">O que acompanhar primeiro neste mês.</p>${items.length ? items.map(r => `<button class="priority-item" data-action="detail" data-id="${esc(r.id)}"><span class="priority-icon">${icon(statusOf(r, state.asOf) === 'overdue' ? 'alert' : 'calendar', 13)}</span><span><strong>${esc(r.client)}</strong><small>${statusOf(r, state.asOf) === 'overdue' ? `${daysBetween(r.dueDate, state.asOf)} dias em atraso` : `Vence ${r.dueDate === state.asOf ? 'hoje' : 'em ' + daysBetween(state.asOf, r.dueDate) + ' dias'}`} · ${esc(r.invoice)}</small><span class="priority-value">${money(r.amount)}</span></span></button>`).join('') : `<div class="empty">${icon('check', 25)}<h3>Tudo em ordem</h3><p>Sem vencimentos próximos ou atrasados.</p></div>`}<button class="btn text" data-action="show-overdue">Acompanhar pendências ${icon('arrow', 13)}</button></section>`;
}
function renderTable(records, compact = false) {
  return `<div class="table-scroll"><table><thead><tr><th>Cliente / documento</th>${compact ? '' : '<th>Categoria</th>'}<th>${compact ? 'Vencimento' : '<button class="sort-btn" data-action="sort">Vencimento ' + icon('down', 11) + '</button>'}</th><th class="right">Valor</th><th>Status</th><th><span class="muted">Ações</span></th></tr></thead><tbody>${records.map((r, index) => `<tr><td><div class="client-cell"><span class="client-avatar v${index % 3}">${esc(initials(r.client))}</span><div><strong>${esc(r.client)}</strong><small>${esc(r.invoice)}</small></div></div></td>${compact ? '' : `<td>${esc(r.category)}</td>`}<td>${dateLabel(r.dueDate)}${!compact && r.paidAt ? `<small>Recebido ${dateLabel(r.paidAt)}</small>` : ''}</td><td class="right strong">${money(r.amount)}</td><td>${badge(r)}</td><td><button class="table-action" data-action="detail" data-id="${esc(r.id)}" aria-label="Abrir ${esc(r.invoice)} de ${esc(r.client)}">${icon('more', 17)}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function empty(title, description, glyph = 'search', action = '') {
  return `<div class="empty">${icon(glyph, 30)}<h3>${title}</h3><p>${description}</p>${action}</div>`;
}
function filteredRecords() {
  return filterRecords(state.records, { month: view.month, query: view.query, status: view.status, category: view.category, asOf: state.asOf }).sort((a, b) => (view.sort === 'asc' ? 1 : -1) * a.dueDate.localeCompare(b.dueDate) || a.client.localeCompare(b.client, 'pt-BR'));
}
function receivables() {
  const records = filteredRecords(), pages = Math.max(1, Math.ceil(records.length / 8));
  view.page = Math.max(1, Math.min(view.page, pages));
  const shown = records.slice((view.page - 1) * 8, view.page * 8);
  return `${metrics()}<section class="panel"><div class="filters"><label class="search-field" for="search-input">${icon('search', 16)}<input id="search-input" type="search" placeholder="Buscar cliente, documento ou observação" value="${esc(view.query)}" aria-label="Buscar título"></label><select id="status-filter" aria-label="Filtrar status">${[['all', 'Todos os status'], ['received', 'Recebidos'], ['pending', 'A vencer'], ['overdue', 'Em atraso']].map(([value, label]) => `<option value="${value}" ${view.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select><select id="category-filter" aria-label="Filtrar categoria"><option value="all">Todas as categorias</option>${CATEGORIES.map(c => `<option ${view.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>${button('import', 'Importar', 'upload', 'small outline')}</div><div class="list-summary"><span>${records.length} ${records.length === 1 ? 'título encontrado' : 'títulos encontrados'}</span><span>Total filtrado: <strong>${money(summarize(records, state.asOf).expected)}</strong></span></div>${records.length ? renderTable(shown) : empty('Nenhum título encontrado', 'Ajuste os filtros ou cadastre um novo recebível.', 'search', button('clear-filters', 'Limpar filtros', 'restore', 'outline small'))}<div class="pagination"><span>${records.length ? (view.page - 1) * 8 + 1 : 0}–${Math.min(view.page * 8, records.length)} de ${records.length} títulos</span><div class="pagination-controls"><button class="icon-btn" data-action="prev" aria-label="Página anterior" ${view.page === 1 ? 'disabled' : ''}>${icon('chevron', 12).replace('<svg ', '<svg style="transform:rotate(180deg)" ')}</button><span>${view.page} / ${pages}</span><button class="icon-btn" data-action="next" aria-label="Próxima página" ${view.page === pages ? 'disabled' : ''}>${icon('chevron', 12)}</button></div></div></section><div class="report-actions">${button('export', 'Exportar títulos filtrados', 'download', 'outline')}${button('template', 'Baixar modelo CSV', 'report', 'outline')}</div>`;
}
function goalsPage() {
  const records = currentRecords(), goals = categoryGoals();
  return `<p class="section-intro">A meta total é a soma das quatro categorias. O realizado considera os títulos com vencimento no mês selecionado e recebimento confirmado até ${dateLabel(state.asOf)}.</p><div class="goal-cards">${CATEGORIES.map((category, index) => {
    const summary = summarize(records.filter(r => r.category === category), state.asOf), goal = goals[category], progress = ratio(summary.received, goal);
    return `<article class="panel category-card"><div class="category-head"><h2>${category}</h2><span class="category-dot c${index}"></span></div><small class="muted">Recebido</small><div class="amount">${money(summary.received)}</div><small class="muted">de ${goal ? money(goal) : 'meta não definida'}</small><div class="progress c${index}" role="progressbar" aria-label="Meta de ${category}" aria-valuenow="${Math.min(Math.round(progress), 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(progress, 100)}%"></span></div><div class="progress-label"><span>${goal ? percentage(progress) + '% atingido' : 'Defina uma meta'}</span><span>${summary.receivedCount} recebidos</span></div><button class="btn outline small" data-action="edit-goal" data-category="${category}">${icon('edit', 13)}Editar meta</button></article>`;
  }).join('')}</div><div class="dashboard-middle">${trendChart()}${goalWidget()}</div><div class="info-strip">${icon('info', 17)}<div><strong>Uma base consistente para comparar.</strong><br>Os valores são agrupados pelo mês de vencimento, inclusive quando o recebimento ocorre antes ou depois do vencimento. Para acompanhar recebimentos por data de caixa, exporte a base com a coluna “Recebimento”.</div></div>`;
}
function reports() {
  const records = currentRecords(), s = summarize(records, state.asOf), goal = totalGoal();
  return `${metrics()}<div class="report-grid"><section class="panel"><div class="panel-head"><div><h2>Resultado por categoria</h2><p>${esc(monthName(view.month))} · competência por vencimento</p></div>${icon('target', 17)}</div><div class="table-scroll"><table><thead><tr><th>Categoria</th><th class="right">Recebido</th><th class="right">Meta</th><th class="right">Atingimento</th></tr></thead><tbody>${CATEGORIES.map(category => { const received = summarize(records.filter(r => r.category === category), state.asOf).received, target = categoryGoals()[category]; return `<tr><td>${category}</td><td class="right">${money(received)}</td><td class="right">${target ? money(target) : '—'}</td><td class="right green">${target ? percentage(ratio(received, target)) + '%' : '—'}</td></tr>`; }).join('')}<tr><td class="strong">Total</td><td class="right strong">${money(s.received)}</td><td class="right strong">${goal ? money(goal) : '—'}</td><td class="right strong green">${goal ? percentage(ratio(s.received, goal)) + '%' : '—'}</td></tr></tbody></table></div></section><section class="panel"><div class="panel-head"><div><h2>Histórico mensal</h2><p>Últimos seis meses até a competência selecionada</p></div>${icon('calendar', 17)}</div><div class="table-scroll"><table><thead><tr><th>Mês</th><th class="right">Carteira</th><th class="right">Recebido</th><th class="right">Em aberto</th></tr></thead><tbody>${monthsBefore(view.month, 6).map(month => { const summary = summarize(cohort(state.records, month), state.asOf); return `<tr><td>${monthShort(month)} / ${month.slice(2, 4)}</td><td class="right">${money(summary.expected)}</td><td class="right green">${money(summary.received)}</td><td class="right">${money(summary.open)}</td></tr>`; }).join('')}</tbody></table></div></section></div><div class="report-actions">${button('print', 'Imprimir / salvar PDF', 'print', 'primary')}${button('export', 'Exportar base do mês', 'download', 'outline')}${button('backup', 'Backup completo', 'download', 'outline')}</div><div class="info-strip">${icon('info', 17)}<div><strong>Critério do relatório:</strong> carteira = títulos com vencimento no mês; recebido = títulos dessa carteira baixados até ${dateLabel(state.asOf)}; a receber = carteira menos recebido; atraso = títulos abertos com vencimento anterior à referência. Valores em centavos inteiros. Dados fictícios para demonstração.</div></div>`;
}
function openModal(title, content) {
  if (!modal.open) modalOpener = document.activeElement;
  modal.innerHTML = `<div class="modal-head"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Fechar janela">${icon('close', 17)}</button></div><div class="modal-body">${content}</div>`;
  if (!modal.open) modal.showModal();
  const input = modal.querySelector('input:not([type="hidden"]),select,textarea');
  if (input) input.focus({ preventScroll: true });
}
function closeModal() { modal.close(); activeRecord = null; if (modalOpener?.isConnected) modalOpener.focus({ preventScroll: true }); }
function formError(error) { const node = modal.querySelector('.form-error'); if (node) { node.textContent = error.message; node.setAttribute('tabindex', '-1'); node.focus(); } else toast(error.message, true); }
function recordForm(id = null) {
  activeRecord = id;
  const record = state.records.find(r => r.id === id), r = record || { invoice: '', client: '', category: CATEGORIES[0], dueDate: `${view.month}-${view.month === state.asOf.slice(0, 7) ? state.asOf.slice(8) : '01'}`, amount: 0, notes: '' };
  openModal(record ? 'Editar título' : 'Novo recebível', `<p class="modal-description">Preencha os dados do título. O status é calculado a partir do vencimento e da data de referência.</p><form id="record-form"><div class="form-error" role="alert"></div><div class="form-grid"><div class="field full"><label for="r-client">Cliente *</label><input id="r-client" name="client" required maxlength="100" value="${esc(r.client)}" placeholder="Ex.: Aurora Design" autocomplete="off"></div><div class="field"><label for="r-invoice">Documento *</label><input id="r-invoice" name="invoice" required maxlength="40" value="${esc(r.invoice)}" placeholder="NF-001" autocomplete="off"></div><div class="field"><label for="r-category">Categoria *</label><select id="r-category" name="category">${CATEGORIES.map(c => `<option ${r.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="field"><label for="r-due">Vencimento *</label><input id="r-due" name="dueDate" type="date" min="2000-01-01" max="2100-12-31" required value="${r.dueDate}"></div><div class="field"><label for="r-amount">Valor (R$) *</label><input id="r-amount" name="amount" inputmode="decimal" required placeholder="1.250,00" value="${r.amount ? inputMoney(r.amount) : ''}"></div><div class="field full"><label for="r-notes">Observação</label><textarea id="r-notes" name="notes" maxlength="500" placeholder="Informações para acompanhamento">${esc(r.notes)}</textarea><small>Até 500 caracteres. Campos com * são obrigatórios.</small></div></div><div class="form-actions">${button('close-modal', 'Cancelar', '', 'outline')}<button class="btn primary" type="submit">${icon('check', 15)}Salvar título</button></div></form>`);
}
function detail(id) {
  const record = state.records.find(r => r.id === id);
  if (!record) return;
  activeRecord = id;
  openModal('Detalhes do recebível', `${badge(record)}<div class="detail-amount">${money(record.amount)}</div><dl class="detail-grid"><div><dt>CLIENTE</dt><dd>${esc(record.client)}</dd></div><div><dt>DOCUMENTO</dt><dd>${esc(record.invoice)}</dd></div><div><dt>CATEGORIA</dt><dd>${record.category}</dd></div><div><dt>VENCIMENTO</dt><dd>${dateLabel(record.dueDate)}</dd></div><div><dt>RECEBIMENTO</dt><dd>${record.paidAt ? dateLabel(record.paidAt) : 'Em aberto'}</dd></div><div><dt>FORMA</dt><dd>${record.method || '—'}</dd></div>${record.notes ? `<div class="full"><dt>OBSERVAÇÃO</dt><dd>${esc(record.notes)}</dd></div>` : ''}</dl><div class="divider"></div><div class="form-actions"><button class="btn outline small" data-action="delete" data-id="${esc(id)}">${icon('trash', 14)}Excluir</button><button class="btn outline small" data-action="edit" data-id="${esc(id)}">${icon('edit', 14)}Editar</button><button class="btn ${record.paidAt ? 'outline' : 'primary'} small" data-action="${record.paidAt ? 'undo-payment' : 'receive'}" data-id="${esc(id)}">${icon(record.paidAt ? 'restore' : 'check', 14)}${record.paidAt ? 'Estornar baixa' : 'Registrar recebimento'}</button></div>`);
}
function receiveForm(id) {
  const r = state.records.find(r => r.id === id); if (!r) return;
  activeRecord = id;
  openModal('Registrar recebimento', `<p class="modal-description"><strong>${esc(r.client)}</strong> · ${esc(r.invoice)}<br>Valor total: <strong class="green">${money(r.amount)}</strong></p><form id="receive-form"><div class="form-error" role="alert"></div><div class="form-grid"><div class="field"><label for="p-date">Data do recebimento *</label><input id="p-date" name="paidAt" type="date" min="2000-01-01" max="${state.asOf}" value="${state.asOf}" required></div><div class="field"><label for="p-method">Forma de recebimento *</label><select id="p-method" name="method">${METHODS.map(m => `<option>${m}</option>`).join('')}</select></div></div><p class="notice">Esta baixa confirma o recebimento integral. O projeto não processa pagamentos nem consulta bancos.</p><div class="form-actions">${button('close-modal', 'Cancelar', '', 'outline')}<button type="submit" class="btn primary">${icon('check', 15)}Confirmar recebimento</button></div></form>`);
}
function confirmation(title, message, action, id = '', label = 'Confirmar') {
  openModal(title, `<p class="modal-description">${message}</p><div class="form-error" role="alert"></div><div class="form-actions">${button('close-modal', 'Cancelar', '', 'outline')}<button class="btn danger" data-action="${action}" data-id="${esc(id)}">${label}</button></div>`);
}
function goalForm(category = null) {
  activeRecord = category;
  const categories = category ? [category] : CATEGORIES;
  openModal(category ? `Meta de ${category}` : 'Metas do mês', `<p class="modal-description">${esc(monthName(view.month))}. A meta total é calculada pela soma das categorias. Use zero para deixar uma categoria sem meta.</p><form id="goal-form"><div class="form-error" role="alert"></div><div class="form-grid">${categories.map((c, i) => `<div class="field ${categories.length === 1 ? 'full' : ''}"><label for="goal-${i}">${c} (R$)</label><input id="goal-${i}" name="${c}" required inputmode="decimal" value="${inputMoney(categoryGoals()[c])}"></div>`).join('')}</div><div class="form-actions">${button('close-modal', 'Cancelar', '', 'outline')}<button type="submit" class="btn primary">${icon('check', 15)}Salvar metas</button></div></form>`);
}
function settings() {
  openModal('Configurações', `<p class="modal-description">Os dados ficam apenas neste navegador. Exporte um backup para transferi-los ou recuperá-los depois. A demonstração inicia com referência em 26/10/2026.</p><form id="reference-form"><div class="form-error" role="alert"></div><div class="field"><label for="reference-date">Data de referência dos indicadores</label><input id="reference-date" name="asOf" type="date" min="2000-01-01" max="2100-12-31" value="${state.asOf}" required><small>Uma referência anterior a um recebimento já registrado não pode ser aplicada.</small></div><div class="form-actions"><button type="submit" class="btn primary small">Aplicar referência</button></div></form><div class="divider"></div><div class="setting-actions">${button('backup', 'Exportar backup completo (.json)', 'download', 'outline')}${button('restore-backup', 'Restaurar backup', 'upload', 'outline')}${button('reset', 'Restaurar dados demonstrativos', 'restore', 'outline')}</div><p class="notice">${state.records.length} títulos cadastrados · Versão 1.0<br>Sem login, sincronização entre dispositivos ou integração com SAP.</p>`);
}
function about() {
  openModal('Fluxo — sobre o projeto', `<div class="text-content"><p><strong>Uma rotina financeira mais clara.</strong> O Fluxo reúne recebíveis, vencimentos, metas e relatórios em uma interface voltada ao acompanhamento administrativo e financeiro.</p><p>Projeto de portfólio de <strong>Leonardo Souza Bittencourt</strong>, inspirado em rotinas de controle financeiro. Todos os clientes, documentos e valores da demonstração são fictícios.</p><div class="about-stack"><span>JavaScript ES Modules</span><span>HTML semântico</span><span>CSS responsivo</span><span>LocalStorage</span><span>Testes com Node.js</span></div><p><strong>Como os indicadores funcionam</strong><br>Carteira: títulos que vencem no mês. Recebido: títulos dessa carteira com baixa até a referência. A receber: títulos sem baixa. Em atraso: títulos abertos com vencimento anterior à referência. Metas: comparação com o recebido dessa mesma carteira.</p><p><strong>Escopo desta versão</strong><br>Protótipo funcional para uso individual no navegador. Não substitui um sistema contábil, não autentica usuários e não processa pagamentos. Importação aceita o modelo CSV do próprio projeto.</p><div class="report-actions"><a class="btn outline" href="https://github.com/leosouzabittencourt-hue" target="_blank" rel="noopener noreferrer">${icon('code', 15)}GitHub</a><a class="btn outline" href="https://www.linkedin.com/in/leonardo-souza-bittencourt/" target="_blank" rel="noopener noreferrer">${icon('external', 15)}LinkedIn</a></div></div>`);
}
function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function exportRecords() {
  const records = view.tab === 'receivables' ? filteredRecords() : currentRecords();
  if (!records.length) return toast('Nenhum título para exportar neste filtro.', true);
  download(`Fluxo_Recebiveis_${view.month}.csv`, exportCSV(records), 'text/csv;charset=utf-8');
  toast(`${records.length} títulos exportados. CSV separado por ponto e vírgula.`);
}
function backup() { download(`Fluxo_Backup_${state.asOf}.json`, JSON.stringify(state, null, 2), 'application/json'); toast('Backup completo exportado. Guarde o arquivo para restaurar os dados.'); }

document.addEventListener('click', event => {
  const node = event.target.closest('[data-action],[data-tab]');
  if (!node || node.disabled) return;
  if (node.dataset.tab) { event.preventDefault(); navigate(node.dataset.tab); return; }
  const action = node.dataset.action, id = node.dataset.id;
  if (node.tagName === 'BUTTON' && node.type === 'submit') event.preventDefault();
  try {
    switch (action) {
      case 'toggle-menu': view.menu = !view.menu; render(); document.querySelector(view.menu ? '.sidebar .nav .active' : '.mobile-toggle')?.focus(); break;
      case 'close-menu': view.menu = false; render(); document.querySelector('.mobile-toggle')?.focus(); break;
      case 'close-modal': closeModal(); break;
      case 'new': if (state.records.length >= 10000) throw new Error('O limite de 10.000 títulos foi atingido.'); recordForm(); break;
      case 'edit': recordForm(id); break;
      case 'detail': detail(id); break;
      case 'receive': receiveForm(id); break;
      case 'delete': { const r = state.records.find(r => r.id === id); confirmation('Excluir título?', `O documento <strong>${esc(r.invoice)}</strong> de ${esc(r.client)}, no valor de ${money(r.amount)}, será removido. Exporte um backup se precisar recuperá-lo depois.`, 'confirm-delete', id, 'Excluir título'); break; }
      case 'confirm-delete': commit({ ...state, records: state.records.filter(r => r.id !== id) }); closeModal(); toast('Título excluído.'); break;
      case 'undo-payment': confirmation('Estornar recebimento?', 'O título voltará a ficar em aberto, preservando o valor e os demais dados.', 'confirm-undo', id, 'Estornar baixa'); break;
      case 'confirm-undo': commit({ ...state, records: state.records.map(r => r.id === id ? { ...r, paidAt: null, method: '' } : r) }); closeModal(); toast('Baixa estornada.'); break;
      case 'edit-all-goals': goalForm(); break;
      case 'edit-goal': goalForm(node.dataset.category); break;
      case 'settings': settings(); break;
      case 'about': about(); break;
      case 'export': exportRecords(); break;
      case 'backup': backup(); break;
      case 'print': window.print(); break;
      case 'import': document.querySelector('#import-file').click(); break;
      case 'restore-backup': document.querySelector('#backup-file').click(); break;
      case 'template': download('Fluxo_Modelo_Importacao.csv', exportCSV([{ invoice: 'NF-EXEMPLO-001', client: 'Cliente Exemplo', category: 'Serviços', dueDate: state.asOf, amount: 125000, paidAt: null, method: '', notes: 'Substitua este exemplo pelos seus dados fictícios.' }]), 'text/csv;charset=utf-8'); break;
      case 'show-overdue': navigate('receivables'); view.status = 'overdue'; render(); break;
      case 'clear-filters': view.query = ''; view.status = 'all'; view.category = 'all'; view.page = 1; render(); break;
      case 'prev': view.page--; render(); break;
      case 'next': view.page++; render(); break;
      case 'sort': view.sort = view.sort === 'asc' ? 'desc' : 'asc'; view.page = 1; render(); break;
      case 'reset': confirmation('Restaurar demonstração?', 'Os títulos e metas deste navegador serão substituídos pelos dados fictícios iniciais. Exporte um backup antes, caso queira manter suas alterações.', 'confirm-reset', '', 'Restaurar demonstração'); break;
      case 'confirm-reset': commit(createDemo()); view.month = state.asOf.slice(0, 7); view.query = ''; view.status = 'all'; view.category = 'all'; view.page = 1; render(); closeModal(); toast('Demonstração restaurada.'); break;
      case 'confirm-restore': if (pendingBackup) { commit(pendingBackup); pendingBackup = null; view.month = state.asOf.slice(0, 7); view.page = 1; render(); closeModal(); toast('Backup restaurado com sucesso.'); } break;
    }
  } catch (error) { if (modal.open) formError(error); else toast(error.message, true); }
});
document.addEventListener('input', event => {
  if (event.target.id === 'search-input') { view.query = event.target.value; view.page = 1; render(); }
});
document.addEventListener('change', event => {
  const node = event.target;
  if (node.id === 'month-filter') {
    if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(node.value)) { view.month = node.value; view.page = 1; render(); }
    else { node.value = view.month; toast('Selecione um mês de 2000 a 2100.', true); }
  }
  if (node.id === 'status-filter') { view.status = node.value; view.page = 1; render(); }
  if (node.id === 'category-filter') { view.category = node.value; view.page = 1; render(); }
});
document.addEventListener('submit', event => {
  if (!modal.contains(event.target)) return;
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  try {
    if (event.target.id === 'record-form') {
      const previous = state.records.find(r => r.id === activeRecord);
      const record = validateRecord({ id: previous?.id || uid(), invoice: data.invoice.trim(), client: data.client.trim(), category: data.category, dueDate: data.dueDate, amount: parseMoney(data.amount), paidAt: previous?.paidAt || null, method: previous?.method || '', notes: data.notes }, state.asOf, state.records);
      view.month = record.dueDate.slice(0, 7); view.page = 1;
      commit({ ...state, records: previous ? state.records.map(r => r.id === record.id ? record : r) : [...state.records, record] }); closeModal(); toast(previous ? 'Título atualizado.' : 'Recebível cadastrado.');
    }
    if (event.target.id === 'receive-form') {
      const previous = state.records.find(r => r.id === activeRecord);
      const record = validateRecord({ ...previous, paidAt: data.paidAt, method: data.method }, state.asOf, state.records);
      commit({ ...state, records: state.records.map(r => r.id === record.id ? record : r) }); closeModal(); toast('Recebimento registrado. Os indicadores foram atualizados.');
    }
    if (event.target.id === 'goal-form') {
      const updated = { ...categoryGoals() };
      for (const [category, amount] of Object.entries(data)) updated[category] = /^(?:0|0,0{1,2})$/.test(amount.trim()) ? 0 : parseMoney(amount);
      commit({ ...state, goals: { ...state.goals, [view.month]: updated } }); closeModal(); toast('Metas atualizadas.');
    }
    if (event.target.id === 'reference-form') {
      if (!validDate(data.asOf)) throw new Error('Data de referência inválida.');
      if (state.records.some(r => r.paidAt && r.paidAt > data.asOf)) throw new Error('Há recebimentos posteriores a essa data. Escolha uma referência igual ou posterior ao último recebimento.');
      commit({ ...state, asOf: data.asOf }); closeModal(); toast('Referência atualizada. Os status foram recalculados.');
    }
  } catch (error) { formError(error); }
});
document.querySelector('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('O CSV deve ter até 2 MB.');
    const records = importCSV(await file.text(), state.asOf, state.records, uid);
    commit({ ...state, records: [...state.records, ...records] }); toast(`${records.length} ${records.length === 1 ? 'título importado' : 'títulos importados'} com sucesso.`);
  } catch (error) { toast(error.message, true); }
});
let pendingBackup = null;
document.querySelector('#backup-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > 10000000) throw new Error('O backup deve ter até 10 MB.');
    pendingBackup = validateState(JSON.parse(await file.text()));
    confirmation('Restaurar este backup?', `O arquivo contém <strong>${pendingBackup.records.length} títulos</strong>, com referência em ${dateLabel(pendingBackup.asOf)}. Os dados atuais deste navegador serão substituídos.`, 'confirm-restore', '', 'Restaurar backup');
  } catch (error) { pendingBackup = null; formError(new Error(error instanceof SyntaxError ? 'O arquivo JSON não é um backup válido.' : error.message)); }
});
modal.addEventListener('click', event => { if (event.target === modal) { const bounds = modal.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeModal(); } });
modal.addEventListener('cancel', () => { activeRecord = null; });
window.addEventListener('popstate', () => { view.tab = tabs[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard'; view.page = 1; render(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && view.menu) { view.menu = false; render(); } });
mobileLayout.addEventListener('change', () => { view.menu = false; render(); });
render();
