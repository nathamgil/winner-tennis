/* =====================================================================
   Winner Tennis — ÚNICO arquivo de dados fixos do site.
   Tudo que diz "a confirmar" ainda não foi validado com a Winner
   (ver README > "A confirmar"). Nada de preço, ano ou nome inventado.
   ===================================================================== */
window.WT = {
  modoDemo: true,               // true = dados no navegador (localStorage, prefixo wt_)
  prefixo: 'wt_',
  whatsapp: '5571991298828',    // (71) 9 9129-8828, das artes do Instagram
  telefone: '(71) 9 9129-8828',
  instagram: 'winnertennisacademia',

  unidades: [
    { id: 'pituacu', nome: 'Unidade Pituaçu', detalhe: 'Quadras cobertas · sede da Copa Futuro',
      endereco: 'Endereço a confirmar', mapa: 'https://www.google.com/maps/search/Winner+Tennis+Pitua%C3%A7u+Salvador' },
    { id: 'villas', nome: 'Unidade Winner Villas', detalhe: 'Litoral Norte · sede do Circuito Litoral Norte',
      endereco: 'Endereço a confirmar', mapa: 'https://www.google.com/maps/search/Winner+Villas+t%C3%AAnis' }
  ],

  // setores do contato (o site atual lista os setores, mas sem número)
  setores: [
    { nome: 'Matrículas e aula experimental', tel: '5571991298828' },
    { nome: 'Torneios e inscrições', tel: '5571991298828' },
    { nome: 'Aluguel de quadra', tel: '5571991298828' },
    { nome: 'Financeiro', tel: '5571991298828' }
  ],

  programas: [
    { id: 'kids', nome: 'Winner Kids', faixa: '4 a 10 anos', publico: 'Crianças',
      resumo: 'A primeira raquete com bola, quadra e turma do tamanho da criança.',
      texto: 'Aula em grupo pensada para criança: coordenação, jogo de pés e as primeiras trocas de bola, sempre jogando. É daqui que sai a turma que estreia na Copa Futuro.',
      pontos: ['Turmas por idade', 'Material adaptado ao tamanho da criança', 'Porta de entrada para a Copa Futuro'],
      frase: 'É por momentos assim! O sorriso das crianças.', foto: 'fotos/kids-sorriso.jpg' },
    { id: 'xpress', nome: 'Winner Xpress', faixa: 'Adultos iniciantes · 8 aulas', publico: 'Quem nunca jogou',
      resumo: 'Curso fechado de 8 aulas para quem sempre quis aprender a jogar tênis.',
      texto: 'Um curso com começo, meio e fim: em 8 aulas você sai do zero para a quadra, com os golpes básicos e a regra do jogo. Depois, segue numa turma regular.',
      pontos: ['8 aulas com data de início', 'Turma só de iniciantes', 'Raquete para usar nas aulas: a confirmar'],
      frase: 'Aprendizado e desafio.', foto: 'fotos/quadra-villas.jpg' },
    { id: 'adulto', nome: 'Turmas adultas', faixa: 'Todos os níveis', publico: 'Adultos',
      resumo: 'Turmas regulares por nível, do iniciante a quem já joga torneio.',
      texto: 'Aulas em grupo por nível, com horários de manhã e à noite. Quem quiser jogar torneio tem o Winner Open / Circuito Amizade dentro de casa.',
      pontos: ['Separação por nível', 'Horários manhã e noite (a confirmar)', 'Caminho natural para o Winner Open'],
      frase: 'Referência no tênis baiano, para todos os níveis e idades.', foto: 'fotos/aluna-quadra-coberta.jpg' },
    { id: 'coach', nome: 'Coach individual', faixa: 'Aula particular', publico: 'Todas as idades',
      resumo: 'Aula só sua, com plano de treino e horário combinado.',
      texto: 'Para corrigir um golpe, preparar um torneio ou acelerar a evolução. O professor monta o plano a partir do seu jogo.',
      pontos: ['Horário combinado', 'Plano por objetivo', 'Pacotes: a confirmar'],
      frase: 'Seu foco muda o jogo.', foto: 'fotos/seu-foco-muda-o-jogo.jpg' },
    { id: 'clinica', nome: 'Clínicas', faixa: 'Encontros temáticos', publico: 'Alunos e não alunos',
      resumo: 'Encontros curtos sobre um tema: saque, dupla, tática.',
      texto: 'Clínicas com tema e data marcada, abertas a quem quer melhorar uma parte específica do jogo.',
      pontos: ['Tema por encontro', 'Vagas limitadas', 'Agenda no Instagram e aqui'],
      frase: '', foto: 'fotos/sede-vista-aerea.jpg' },
    { id: 'pretemporada', nome: 'Pré-temporada', faixa: 'Atletas de torneio', publico: 'Competição',
      resumo: 'Técnica, tática, físico e mental antes do calendário de torneios.',
      texto: 'Bloco de preparação para quem vai disputar o calendário: técnica, tática, físico e mental, como diz a própria Winner.',
      pontos: ['Técnica', 'Tática', 'Físico', 'Mental'],
      frase: 'Pré-temporada: técnica, tática, físico e mental.', foto: 'fotos/atleta-pre-temporada.jpg' }
  ],

  // Equipe: a página "Professores" do site atual está vazia. Sem nomes até a Winner mandar.
  equipe: [
    { papel: 'Coordenação técnica', nome: 'Professor(a) — a confirmar' },
    { papel: 'Winner Kids', nome: 'Professor(a) — a confirmar' },
    { papel: 'Winner Xpress e adultos', nome: 'Professor(a) — a confirmar' },
    { papel: 'Competição e Copa Futuro', nome: 'Professor(a) — a confirmar' },
    { papel: 'Preparação física', nome: 'Profissional — a confirmar' },
    { papel: 'Winner Golf Studio', nome: 'Profissional — a confirmar' }
  ],

  torneios: [
    { id: 'copa', nome: 'Copa Futuro', sub: 'de Tênis', publico: '5 a 14 anos',
      etapaAtual: 5, local: 'pituacu', foto: 'fotos/copa-futuro-saibro.jpg', fotoAlt: 'Atleta mirim de costas na quadra de saibro coberta, camisa da Winner',
      etapas: [
        { n: 1, datas: 'a confirmar', status: 'encerrada' },
        { n: 2, datas: 'a confirmar', status: 'encerrada' },
        { n: 3, datas: 'a confirmar', status: 'encerrada' },
        { n: 4, datas: '11 a 13 de setembro', status: 'encerrada' },
        { n: 5, datas: '6 a 8 de novembro', status: 'inscricoes', prazo: 'Inscrições até 30/10' }
      ],
      // categorias de EXEMPLO: o regulamento real não foi lido
      categorias: ['Sub-8', 'Sub-10', 'Sub-12', 'Sub-14'],
      valor: 'Valor da inscrição: a confirmar',
      texto: 'O circuito infantojuvenil da Winner: criança de 5 a 14 anos jogando torneio de verdade, com chave, ranking e etapa ao longo do ano.' },
    { id: 'open', nome: 'Winner Open', sub: 'Circuito Amizade', publico: 'Adultos por classe',
      etapaAtual: 3, local: 'pituacu',
      etapas: [
        { n: 1, datas: 'a confirmar', status: 'encerrada' },
        { n: 2, datas: '7/8 a 2/9', status: 'encerrada' },
        { n: 3, datas: 'desde 2 de outubro', status: 'andamento' }
      ],
      categorias: ['1ª classe', '2ª classe', '3ª classe', '4ª classe', '5ª classe', '6ª classe', 'Feminina'],
      valor: 'Valor da inscrição: a confirmar',
      texto: 'O circuito adulto da casa, por classe, masculino e feminino. Jogo marcado entre os atletas dentro do prazo de cada rodada.' },
    { id: 'litoral', nome: 'Circuito Litoral Norte', sub: '3ª etapa', publico: 'Adultos',
      etapaAtual: 3, local: 'villas', foto: 'fotos/circuito-litoral-norte-cartaz.jpg', fotoAlt: 'Cartaz do Circuito Litoral Norte, 3ª etapa 2026',
      etapas: [
        { n: 3, datas: '28/11 abertura · 04/12 chaves simples', status: 'inscricoes', prazo: 'Inscrições até 20/11' }
      ],
      categorias: ['A', 'B', 'C', 'Iniciantes', 'Feminina'],
      valor: 'R$ 130 (1 categoria) · R$ 190 (2 categorias)',
      texto: 'Na unidade Winner Villas. Abre em 28/11 com mini torneio de duplas com churrasco e chopp; as chaves simples começam em 04/12.' }
  ],

  // pontos por fase: TABELA DE EXEMPLO, trocar pela do regulamento
  pontos: { campeao: 100, vice: 70, semi: 45, quartas: 25, oitavas: 10, participacao: 5 },

  quadra: {
    horarios: ['06:00', '07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'], // a confirmar
    valor: 'Valor da hora: a confirmar'
  },

  // logins da demonstração (aparecem na tela de propósito)
  loginsDemo: {
    alunos: [
      { usuario: 'helena', senha: 'winner', quem: 'Responsável pela Helena, 9 anos · Winner Kids' },
      { usuario: 'rafael', senha: 'winner', quem: 'Rafael, adulto · turma intermediária' }
    ],
    admin: { usuario: 'admin', senha: 'winner' }
  }
};

window.WT.programaPor = function (id) { return this.programas.filter(function (p) { return p.id === id; })[0]; };
window.WT.torneioPor = function (id) { return this.torneios.filter(function (t) { return t.id === id; })[0]; };
window.WT.unidadePor = function (id) { return this.unidades.filter(function (u) { return u.id === id; })[0]; };
window.WT.zap = function (texto, tel) {
  return 'https://wa.me/' + (tel || this.whatsapp) + '?text=' + encodeURIComponent(texto);
};
