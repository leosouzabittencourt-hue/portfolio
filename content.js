/* Edite os textos e listas aqui. Preserve as aspas, vírgulas e colchetes do código. */
window.PORTFOLIO = {
  "profile": {
    "name": "Leonardo Souza Bittencourt",
    "shortName": "Leonardo Bittencourt",
    "headline": "Aprendiz Administrativo-Financeiro",
    "tagline": "Transformo rotinas em soluções digitais que fazem o trabalho fluir.",
    "intro": "Excel, VBA e aplicações web para organizar informações, automatizar processos e tornar os dados mais úteis no dia a dia.",
    "city": "Cachoeirinha, Rio Grande do Sul",
    "email": "leosouzabittencourt@gmail.com",
    "whatsapp": "5551991726157",
    "phoneLabel": "+55 (51) 99172-6157",
    "linkedin": "https://www.linkedin.com/in/leonardo-souza-bittencourt",
    "photo": "assets/leonardo.webp",
    "resume": "assets/curriculo-leonardo-souza-bittencourt.pdf"
  },
  "about": [
    "Sou Leonardo, de Cachoeirinha/RS, e atuo como Aprendiz Administrativo-Financeiro no Shopping do Vale desde agosto de 2025.",
    "Tenho proficiência em tecnologia aplicada à organização de dados e crio projetos com Excel, VBA e aplicações web para automatizar rotinas.",
    "Meu diferencial é conectar lógica, organização e uma experiência simples para quem usa.",
    "Aprender, testar e melhorar me motiva a evoluir e construir soluções úteis."
  ],
  "skills": [
    {
      "category": "Competências técnicas",
      "number": "01",
      "items": [
        "Excel avançado",
        "Automação com VBA",
        "Dashboards",
        "Tratamento de dados",
        "Power Query",
        "Aplicações web",
        "Integração de sistemas"
      ]
    },
    {
      "category": "Ferramentas e tecnologias",
      "number": "02",
      "items": [
        "Excel 2019",
        "VBA",
        "HTML · CSS · JavaScript",
        "Python · Flask",
        "SQLite",
        "PWA",
        "Power BI e Tableau · formação"
      ]
    },
    {
      "category": "Forma de trabalhar",
      "number": "03",
      "items": [
        "Resolução de problemas",
        "Organização",
        "Aprendizado contínuo",
        "Atenção aos detalhes",
        "Comunicação clara",
        "Visão de processos"
      ]
    }
  ],
  "projects": [
    {
      "id": "caixinha",
      "number": "01",
      "category": "web",
      "label": "APLICAÇÃO WEB + EXCEL",
      "title": "Um caixinha organizado. Do celular ao Excel.",
      "summary": "Aplicativo para registrar despesas com foto da nota e sincronizar informações com uma planilha de controle. Dois fundos separados, sem confundir dinheiro da empresa com reembolsos.",
      "image": "assets/projeto-caixinha.svg",
      "imageAlt": "Demonstração fictícia de um aplicativo de despesas e sua conexão com Excel",
      "tools": [
        "PWA",
        "Python / Flask",
        "SQLite",
        "Power Query",
        "Excel 2019",
        "VBA"
      ],
      "status": "Protótipo funcional · integração testada",
      "problem": "Compras pequenas precisam de comprovantes, rastreabilidade e separação entre o dinheiro disponível em caixa e o que deve ser devolvido a quem pagou com recursos próprios.",
      "solution": "Estruturei um fluxo com registro pelo celular, foto obrigatória, fila offline e IDs únicos. Um servidor local recebe os dados; o Excel consulta a exportação com Power Query e registra entradas e pagamentos em áreas separadas.",
      "result": "No ambiente de testes, conferi o envio pelo iPhone, a chegada dos lançamentos ao Excel, a abertura dos comprovantes, a separação dos fundos e a redução do saldo a reembolsar após um pagamento.",
      "note": "A instalação na rede de trabalho ainda precisa ser validada. Os valores desta apresentação são fictícios e não representam a situação financeira de qualquer organização.",
      "capabilities": [
        "Foto e dados no mesmo lançamento",
        "Fila offline com reenvio ao abrir o app conectado",
        "Login e controle de duplicidade",
        "Saldos separados e reembolsos por pessoa",
        "Backup do banco, fotos e planilha"
      ],
      "cvDescription": "Registro de despesas pelo celular com foto, fila offline e servidor local. Integração com Excel 2019 por Power Query/VBA, separação de fundos e controle de reembolsos.",
      "cvResult": "Envio pelo iPhone, consulta no Excel e pagamentos conferidos em ambiente de testes."
    },
    {
      "id": "vendas",
      "number": "02",
      "category": "excel",
      "label": "ANÁLISE DE DADOS + AUTOMAÇÃO",
      "title": "Controle gerencial de vendas",
      "summary": "Uma ferramenta em Excel e VBA para reunir lançamentos, histórico, cadastros e comparativos de vendas em uma navegação organizada.",
      "image": "assets/projeto-vendas.svg",
      "imageAlt": "Dashboard de vendas reconstruído com números inteiramente fictícios",
      "tools": [
        "Excel",
        "VBA",
        "Tabelas estruturadas",
        "Gráficos",
        "Indicadores"
      ],
      "status": "Projeto em Excel · apresentação anonimizada",
      "problem": "Informações espalhadas dificultam a consulta do histórico, o acompanhamento dos períodos e a comparação entre valores realizados e planejados.",
      "solution": "Organizei cadastros e lançamentos em uma base estruturada, com painéis, seleção de períodos e consultas por unidade. Usei VBA para facilitar a navegação e automatizar rotinas da planilha.",
      "result": "O projeto reúne entrada de dados, histórico, comparativos e consulta em um único fluxo. O foco é facilitar a leitura das informações e manter a organização dos registros.",
      "note": "A tela foi reconstruída para o portfólio. Todos os números e unidades são fictícios; não há divulgação de dados, identidade visual ou arquivos internos de empresas.",
      "capabilities": [
        "Histórico organizado por período",
        "Consulta por unidade",
        "Comparativo realizado × planejado",
        "Painéis com gráficos",
        "Rotinas de cadastro e atualização em VBA"
      ],
      "cvDescription": "Ferramenta em Excel e VBA com cadastros, lançamentos, histórico, painéis e comparativos por período.",
      "cvResult": "Organização de entrada, consulta e análise em um fluxo integrado."
    },
    {
      "id": "encomendas",
      "number": "03",
      "category": "excel",
      "label": "GESTÃO DE PROCESSOS + VBA",
      "title": "Gestão de encomendas",
      "summary": "Sistema em Excel com cadastro, protocolo, consulta e acompanhamento de status, desenvolvido para tornar o fluxo de recebimento e retirada mais organizado.",
      "image": "assets/projeto-encomendas.svg",
      "imageAlt": "Painel de encomendas com protocolos e quantidades fictícias, sem destinatários reais",
      "tools": [
        "Excel",
        "VBA",
        "Formulários",
        "Relatórios",
        "Tabelas estruturadas"
      ],
      "status": "Projeto em Excel · apresentação anonimizada",
      "problem": "O recebimento e a retirada de encomendas exigem registros claros para encontrar um volume, acompanhar seu status e consultar o histórico.",
      "solution": "Desenvolvi um fluxo de cadastro e consulta com protocolo, identificação do destinatário, transportadora e atualização de status. Relatórios apresentam a situação dos registros de forma visual.",
      "result": "Cadastro, consulta e acompanhamento ficam integrados na mesma ferramenta, com protocolos e histórico para apoiar a rastreabilidade da operação.",
      "note": "Protocolos, quantidades e destinatários apresentados são fictícios. A demonstração não publica informações reais nem identifica a organização onde o projeto foi aplicado.",
      "capabilities": [
        "Protocolo para cada registro",
        "Formulários de cadastro e consulta",
        "Status de recebimento e retirada",
        "Histórico de movimentação",
        "Relatórios visuais"
      ],
      "cvDescription": "Sistema em Excel e VBA com cadastro, protocolo, consulta, atualização de status e relatórios.",
      "cvResult": "Fluxo integrado de registro e acompanhamento para apoiar a rastreabilidade."
    }
  ],
  "experience": [
    {
      "period": "08/2025 — Atual",
      "title": "Aprendiz Administrativo-Financeiro",
      "subtitle": "Shopping do Vale",
      "text": "Faço contato com lojistas, auxilio nas rotinas de contas a receber e no controle de encomendas, além de executar outras tarefas administrativas e financeiras solicitadas.",
      "achievement": "Apoio a organização de informações e o acompanhamento das demandas do dia a dia."
    },
    {
      "period": "[PERÍODO DOS PROJETOS]",
      "title": "Desenvolvimento de projetos próprios",
      "subtitle": "Excel, VBA e aplicações web",
      "text": "Criação de ferramentas para controle gerencial, gestão de encomendas e registro de despesas, com atenção à organização dos dados e à experiência de uso.",
      "achievement": "Integração do aplicativo de despesas com Excel conferida em ambiente de testes."
    }
  ],
  "education": {
    "degree": {
      "title": "Ensino Médio completo",
      "institution": "Escola Osvaldo Camargo",
      "period": "Conclusão em 2025"
    },
    "course": {
      "title": "Pacote Office do básico ao ESPECIALISTA & Power BI & Tableau",
      "institution": "Udemy",
      "date": "11/01/2026",
      "hours": "48 horas",
      "certificate": "assets/certificado-office.pdf",
      "detail": "Formação concluída, conforme certificado apresentado."
    },
    "languages": [
      "Português · comunicação em português do Brasil",
      "Inglês · intermediário"
    ]
  }
};
