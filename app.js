'use strict';
const content = window.PORTFOLIO;
const $ = (selector, scope=document) => scope.querySelector(selector);
const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];
function node(tag, className, text) { const item=document.createElement(tag); if(className)item.className=className; if(text!==undefined)item.textContent=text; return item; }
function icon(name) { const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-'+name);svg.append(use);return svg; }
function tags(items) { const wrap=node('div','tags');items.forEach(text=>wrap.append(node('span','tag',text)));return wrap; }
function safeWebUrl(value) { try {const url=new URL(value);return url.protocol==='https:'||url.protocol==='http:' ? url.href : null;}catch{return null;} }
const whatsapp='https://wa.me/'+content.profile.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Olá, Leonardo! Conheci seu portfólio e gostaria de conversar.');
$$('[data-profile]').forEach(item=>{const value=content.profile[item.dataset.profile];if(value)item.textContent=value;});
const nameParts=content.profile.name.split(' '),h1=$('h1');h1.replaceChildren(document.createTextNode(nameParts.slice(0,-1).join(' ')),document.createElement('br'),node('span','',nameParts.at(-1)+'.'));
$('#profile-photo').src=content.profile.photo;$('#profile-photo').alt='Retrato de '+content.profile.name;
$('#resume-link').href=content.profile.resume;$('#whatsapp-cta').href=whatsapp;
$('#about-content').append(node('p','',content.about.join(' ')));
content.skills.forEach(group=>{const card=node('article','skill-card'),header=node('div','skill-heading');header.append(node('h3','',group.category),node('span','',group.number));card.append(header,tags(group.items));$('#skills-grid').append(card);});
let lastOpener=null, demoState=null;
function renderProject(project) {
 const card=node('article','project-card'+(project.id==='caixinha'?' featured':''));card.dataset.category=project.category;card.dataset.id=project.id;
 const visual=node('div','project-image'),img=node('img');img.src=project.image;img.alt=project.imageAlt;img.loading='lazy';img.width=800;img.height=500;
 visual.append(img,node('span','demo-badge','DEMONSTRAÇÃO · DADOS FICTÍCIOS'));
 const body=node('div','project-body');body.append(node('p','project-label',project.number+' / '+project.label),node('h3','',project.title),node('p','project-summary',project.summary),tags(project.tools),node('p','project-status',project.status));
 const more=node('button','project-more','Ver projeto');more.type='button';more.setAttribute('aria-label','Ver detalhes: '+project.title);more.append(icon('diagonal'));more.addEventListener('click',()=>openProject(project,more));body.append(more);card.append(visual,body);$('#projects-grid').append(card);
}
content.projects.forEach(renderProject);
$('[data-filter="all"] span').textContent=String(content.projects.length).padStart(2,'0');
$('#project-count').textContent=content.projects.length+' projetos';
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{let count=0;$$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$$('.project-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++;});$('#project-count').textContent=count+' projeto'+(count!==1?'s':'');}));
content.experience.forEach(item=>{const article=node('article','timeline-item');article.append(node('p','timeline-period',item.period),node('h3','',item.title),node('p','timeline-subtitle',item.subtitle),node('p','timeline-text',item.text),node('p','timeline-achievement',item.achievement));$('#experience-list').append(article);});
const degree=content.education.degree,course=content.education.course;
const degreeCard=node('article','education-card');degreeCard.append(node('p','edu-label','FORMAÇÃO ACADÊMICA'),node('h3','',degree.title),node('p','',degree.institution),node('p','',degree.period));
const courseCard=node('article','education-card featured-course');courseCard.append(node('p','edu-label','CURSO CONCLUÍDO'),node('h3','',course.title),node('p','',course.institution+' · '+course.hours+' · '+course.date),node('p','',course.detail));
const cert=node('a','certificate-link','Ver certificado');cert.href=course.certificate;cert.target='_blank';cert.rel='noopener noreferrer';cert.append(icon('diagonal'));courseCard.append(cert);
const languages=node('article','education-card');languages.append(node('p','edu-label','IDIOMAS'),node('h3','','Comunicação'));content.education.languages.forEach(text=>languages.append(node('p','',text)));$('#education-grid').append(degreeCard,courseCard,languages);
function contactRow(label,value,href,iconName) {const row=node(href?'a':'div','contact-row'+(!href?' placeholder':''));if(href){row.href=href;if(!href.startsWith('mailto:')){row.target='_blank';row.rel='noopener noreferrer';}}const mark=node('span','contact-icon');mark.append(icon(iconName));const copy=node('div');copy.append(node('small','',label),node('strong','',value));if(!href)copy.append(node('span','awaiting','Perfil a informar'));row.append(mark,copy);if(href)row.append(icon('diagonal'));return row;}
$('#contact-list').append(contactRow('E-mail',content.profile.email,'mailto:'+content.profile.email,'mail'),contactRow('WhatsApp',content.profile.phoneLabel,whatsapp,'phone'),contactRow('LinkedIn',safeWebUrl(content.profile.linkedin)?'Acessar meu perfil':content.profile.linkedin,safeWebUrl(content.profile.linkedin),'linkedin'));
$('#year').textContent=new Date().getFullYear();
const dialog=$('#project-dialog');
function caseBlock(title,text,klass='case-block') {const block=node('section',klass);block.append(node('h3','',title),node('p','',text));return block;}
function openProject(project,opener) {
 lastOpener=opener;$('#dialog-label').textContent=project.label;const body=$('#dialog-content');body.replaceChildren();
 const title=node('h2','',project.title);title.id='dialog-title';const image=node('img','case-image');image.src=project.image;image.alt=project.imageAlt;image.width=800;image.height=500;
 const columns=node('div','case-columns');columns.append(caseBlock('O problema',project.problem),caseBlock('A solução que desenvolvi',project.solution));
 const capabilities=node('ul','case-capabilities');project.capabilities.forEach(text=>{const li=node('li');li.append(icon('check'),document.createTextNode(text));capabilities.append(li);});
 body.append(title,image,tags(project.tools),columns,caseBlock('Resultado e funcionamento',project.result,'case-block case-result'),capabilities);
 if(project.id==='caixinha')body.append(renderDemo());
 body.append(node('p','case-note',project.note));
 document.body.classList.add('modal-open');if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');dialog.style.position='fixed';dialog.style.top='5vh';dialog.style.zIndex='50';}dialog.scrollTop=0;$('#close-dialog').focus();
}
function closeProject(){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');document.body.classList.remove('modal-open');demoState=null;lastOpener?.focus();}
$('#close-dialog').addEventListener('click',closeProject);dialog.addEventListener('cancel',event=>{event.preventDefault();closeProject();});dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeProject();});
function renderDemo(){
 demoState={company:50000,pending:0};const panel=node('section','demo-panel');panel.append(node('h3','','Experimente a lógica dos dois fundos'),node('p','demo-disclaimer','Simulação com saldo inicial fictício de R$ 500,00. Nenhuma compra ou pagamento real é enviado ou armazenado.'));
 const balances=node('div','demo-balances');balances.setAttribute('aria-live','polite');const company=node('div'),pending=node('div');const companyValue=node('strong'),pendingValue=node('strong');companyValue.id='demo-company';pendingValue.id='demo-pending';company.append(node('span','','Empresa · dinheiro disponível'),companyValue);pending.append(node('span','','Funcionário · a reembolsar'),pendingValue);balances.append(company,pending);panel.append(balances);
 const actions=node('div','demo-actions'),buyCompany=node('button','','Compra da empresa · R$ 45,50'),buyEmployee=node('button','','Compra pessoal · R$ 32,00'),repay=node('button','','Reembolsar R$ 20,00'),reset=node('button','','Recomeçar');repay.id='demo-repay';buyCompany.dataset.action='company';buyEmployee.dataset.action='employee';reset.dataset.action='reset';
 const status=node('p','demo-status','Escolha uma ação para observar os saldos.');status.setAttribute('role','status');
 const format=amount=>(amount/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const update=message=>{companyValue.textContent=format(demoState.company);pendingValue.textContent=format(demoState.pending);repay.disabled=demoState.pending<2000;if(message)status.textContent=message;};
 buyCompany.addEventListener('click',()=>{demoState.company-=4550;update('Compra da empresa: reduz o dinheiro disponível e não gera reembolso.');});
 buyEmployee.addEventListener('click',()=>{demoState.pending+=3200;update('Compra pessoal: aumenta o valor a devolver e mantém o dinheiro da empresa.');});
 repay.addEventListener('click',()=>{if(demoState.pending<2000)return;demoState.pending-=2000;update('Reembolso pela conta bancária: reduz a dívida; o caixinha físico permanece igual.');});
 reset.addEventListener('click',()=>{demoState={company:50000,pending:0};update('Simulação reiniciada. Todos os valores são fictícios.');});actions.append(buyCompany,buyEmployee,repay,reset);panel.append(actions,status);update();return panel;
}
const themeButton=$('#theme-toggle'),systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;
function setTheme(theme){document.documentElement.dataset.theme=theme;themeButton.replaceChildren(icon(theme==='dark'?'sun':'moon'));themeButton.setAttribute('aria-label',theme==='dark'?'Ativar modo claro':'Ativar modo escuro');$('meta[name="theme-color"]').content=theme==='dark'?'#101827':'#f7f8fa';try{localStorage.setItem('portfolio-theme',theme);}catch{}}
let savedTheme=null;try{savedTheme=localStorage.getItem('portfolio-theme');}catch{}setTheme(savedTheme==='dark'||savedTheme==='light'?savedTheme:(systemDark?'dark':'light'));themeButton.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
const menuButton=$('#menu-toggle'),nav=$('#navigation');function closeMenu(){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menu');}
menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});$$('a[href^="#"]').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();menuButton.focus();}});document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
if('IntersectionObserver' in window){
 const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}}),{threshold:.08});$$('.reveal').forEach(section=>{section.classList.add('js-reveal');revealObserver.observe(section);});
 const activeObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)$$('#navigation a').forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id));}),{rootMargin:'-12% 0px -58% 0px'});$$('main section[id]').forEach(section=>activeObserver.observe(section));
}
