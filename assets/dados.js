/* =====================================================================
   Winner Tennis — banco da DEMONSTRAÇÃO + motor de chaves.
   Modo demo: tudo fica no navegador (localStorage, chave wt_db).
   Pessoas, placares, frequência e reservas são FICTÍCIOS (exemplo).
   Carrega depois de config.js e antes de site.js / torneios.js /
   aluno.js / admin.js.
   Expõe:  window.WTDB  (le, grava, reset, uid, hoje...)
           window.WTChave (gerar, definir, fase, pontos, desenha)
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.WT;
  var K = (CFG.prefixo || 'wt_') + 'db', VERSAO = 4;

  /* ---------------- utilidades ---------------- */
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function hoje() { return iso(new Date()); }
  function soma(s, n) { var d = deIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  var semente = 20261030;
  function rnd() { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; }

  /* ---------------- motor de chaves ----------------
     chave = { torneio, etapa, categoria, gerada, rodadas: [[{a,b,v,placar}]] }
     a/b: nome (string) · '' = bye · null = a definir.  v: 'a' | 'b' | null
  -------------------------------------------------- */
  function ordemSementes(n) {
    var o = [1, 2];
    while (o.length < n) {
      var m = o.length * 2 + 1, nova = [];
      o.forEach(function (x) { nova.push(x, m - x); });
      o = nova;
    }
    return o;
  }
  function gerar(nomes, info) {
    var n = 2; while (n < nomes.length) n *= 2;
    var ordem = ordemSementes(n), r0 = [];
    for (var i = 0; i < n; i += 2) {
      r0.push({ a: nomes[ordem[i] - 1] || '', b: nomes[ordem[i + 1] - 1] || '', v: null, placar: '' });
    }
    var rodadas = [r0], tam = n / 2;
    while (tam > 1) { tam /= 2; var r = []; for (var k = 0; k < tam; k++) r.push({ a: null, b: null, v: null, placar: '' }); rodadas.push(r); }
    var ch = Object.assign({ gerada: new Date().toISOString(), rodadas: rodadas }, info || {});
    // bye avança sozinho
    r0.forEach(function (j, m) {
      if (j.a && !j.b) definir(ch, 0, m, 'a', 'W.O. (bye)');
      else if (j.b && !j.a) definir(ch, 0, m, 'b', 'W.O. (bye)');
    });
    return ch;
  }
  function limpa(ch, r, m) {
    if (r >= ch.rodadas.length) return;
    var j = ch.rodadas[r][m];
    if (j.v) { j.v = null; j.placar = ''; limpaSlot(ch, r, m); }
  }
  function limpaSlot(ch, r, m) {
    var prox = ch.rodadas[r + 1]; if (!prox) return;
    var pm = Math.floor(m / 2), lado = m % 2 === 0 ? 'a' : 'b';
    prox[pm][lado] = null;
    limpa(ch, r + 1, pm);
  }
  function definir(ch, r, m, v, placar) {
    var j = ch.rodadas[r][m];
    if (!j || (v && !j[v])) return;
    var antes = j.v ? j[j.v] : null;
    j.v = v || null; j.placar = v ? (placar || '') : '';
    var prox = ch.rodadas[r + 1];
    if (!prox) return;
    var pm = Math.floor(m / 2), lado = m % 2 === 0 ? 'a' : 'b';
    var novo = v ? j[v] : null;
    if (antes !== novo) { prox[pm][lado] = novo; limpa(ch, r + 1, pm); }
  }
  function fase(ch, r) {
    var falta = ch.rodadas.length - 1 - r;
    return ['Final', 'Semifinal', 'Quartas', 'Oitavas'][falta] || (r + 1) + 'ª rodada';
  }
  function campeao(ch) { var f = ch.rodadas[ch.rodadas.length - 1][0]; return f && f.v ? f[f.v] : null; }
  function completa(ch) { return !!campeao(ch); }
  // pontos de cada atleta pela fase em que parou (tabela em config.js)
  function pontos(ch) {
    var P = CFG.pontos, out = {}, R = ch.rodadas.length;
    ch.rodadas.forEach(function (rod, r) {
      rod.forEach(function (j) {
        if (!j.v) return;
        var perd = j.v === 'a' ? j.b : j.a;
        if (!perd) return;
        var falta = R - 1 - r;
        out[perd] = falta === 0 ? P.vice : falta === 1 ? P.semi : falta === 2 ? P.quartas : falta === 3 ? P.oitavas : P.participacao;
      });
    });
    var c = campeao(ch); if (c) out[c] = P.campeao;
    return out;
  }
  // desenha a chave; opt.aoClicar(r, m) torna os jogos clicáveis (painel)
  function desenha(ch, opt) {
    opt = opt || {};
    var wrap = document.createElement('div'); wrap.className = 'chave';
    ch.rodadas.forEach(function (rod, r) {
      var col = document.createElement('div'); col.className = 'chave-col';
      var h = document.createElement('div'); h.className = 'chave-fase'; h.textContent = fase(ch, r);
      col.appendChild(h);
      var lista = document.createElement('div'); lista.className = 'chave-jogos';
      rod.forEach(function (j, m) {
        var b = document.createElement(opt.aoClicar ? 'button' : 'div');
        b.className = 'jogo' + (j.v ? ' jogo-feito' : '');
        if (opt.aoClicar) { b.type = 'button'; b.addEventListener('click', function () { opt.aoClicar(r, m); }); }
        ['a', 'b'].forEach(function (l) {
          var linha = document.createElement('div');
          var nome = j[l];
          linha.className = 'jogo-lado' + (j.v === l ? ' venceu' : '') + (j.v && j.v !== l ? ' perdeu' : '') + (opt.destaque && nome === opt.destaque ? ' eu' : '');
          var s = document.createElement('span'); s.textContent = nome === '' ? 'bye' : (nome || 'a definir');
          if (!nome) s.className = 'vazio';
          linha.appendChild(s);
          b.appendChild(linha);
        });
        if (j.placar) { var p = document.createElement('div'); p.className = 'jogo-placar'; p.textContent = j.placar; b.appendChild(p); }
        lista.appendChild(b);
      });
      col.appendChild(lista);
      wrap.appendChild(col);
    });
    return wrap;
  }
  window.WTChave = { gerar: gerar, definir: definir, fase: fase, campeao: campeao, completa: completa, pontos: pontos, desenha: desenha };

  /* ---------------- dados de exemplo ---------------- */
  var KIDS = ['Helena Duarte', 'Miguel Sampaio', 'Alice Barreto', 'Theo Carneiro', 'Laura Pimentel', 'Davi Moura', 'Cecília Rocha',
    'Gael Fontes', 'Maria Clara Leal', 'Bento Queiroz', 'Lis Andrade', 'Arthur Brandão', 'Sofia Tavares', 'Heitor Galvão',
    'Manuela Prado', 'Benício Lago', 'Isis Matos', 'Joaquim Seixas', 'Antonella Dias', 'Pedro Lucca Viana', 'Valentina Sá',
    'Lorenzo Paim', 'Clara Magalhães', 'Samuel Bastos', 'Luísa Coutinho', 'Noah Pinheiro', 'Beatriz Mota', 'Enzo Gabriel Reis',
    'Lara Cerqueira', 'Ravi Santana', 'Marina Lopes', 'Caio Azevedo'];
  var ADULTOS = ['Rafael Nogueira', 'André Calmon', 'Bruno Requião', 'Carlos Eduardo Pita', 'Diego Simões', 'Eduardo Ramos',
    'Fábio Sodré', 'Gustavo Lessa', 'Henrique Pessoa', 'Igor Bahia', 'João Victor Souto', 'Leandro Moniz', 'Marcelo Aragão',
    'Nelson Dourado', 'Otávio Rebouças', 'Paulo Sérgio Leite', 'Renato Falcão', 'Sérgio Amado', 'Tiago Medrado', 'Vitor Guimarães',
    'Daniela Mascarenhas', 'Fernanda Góes', 'Juliana Spínola', 'Patrícia Vilas Boas', 'Renata Cardoso', 'Tatiana Brito',
    'Camila Teixeira', 'Luciana Pires'];

  function placarKids() { var a = [[4, 1], [4, 2], [4, 0], [5, 3], [4, 2]]; var x = a[Math.floor(rnd() * a.length)], y = a[Math.floor(rnd() * a.length)]; return x[0] + '/' + x[1] + ' ' + y[0] + '/' + y[1]; }
  function placarAdulto() {
    var s = [[6, 3], [6, 4], [6, 2], [7, 5], [6, 1], [7, 6]];
    if (rnd() < 0.25) return '6/4 4/6 10/7';
    var x = s[Math.floor(rnd() * s.length)], y = s[Math.floor(rnd() * s.length)];
    return x[0] + '/' + x[1] + ' ' + y[0] + '/' + y[1];
  }
  // joga a chave até a rodada "ate" (inclusive); o melhor cabeça vence ~70%
  function joga(ch, ate, placar, ordem) {
    for (var r = 0; r <= Math.min(ate, ch.rodadas.length - 1); r++) {
      ch.rodadas[r].forEach(function (j, m) {
        if (j.v || !j.a || !j.b) return;
        var fa = ordem.indexOf(j.a), fb = ordem.indexOf(j.b);
        var fav = fa < fb ? 'a' : 'b', zebra = rnd() < 0.3;
        definir(ch, r, m, zebra ? (fav === 'a' ? 'b' : 'a') : fav, placar());
      });
    }
  }
  function pega(lista, ini, n) { var out = []; for (var i = 0; i < n; i++) out.push(lista[(ini + i) % lista.length]); return out; }

  function semear() {
    semente = 20261030;
    var H = hoje();
    var db = { versao: VERSAO, experimentais: [], turmas: [], alunos: [], inscricoes: [], chaves: {}, ranking: {}, avisos: [], reservas: [] };

    /* turmas (horários de EXEMPLO) */
    db.turmas = [
      { id: 't1', programa: 'kids', nome: 'Winner Kids 4–6 anos', dias: [2, 4], hora: '15:00', unidade: 'pituacu', vagas: 10 },
      { id: 't2', programa: 'kids', nome: 'Winner Kids 7–10 anos', dias: [2, 4], hora: '16:00', unidade: 'pituacu', vagas: 12 },
      { id: 't3', programa: 'kids', nome: 'Winner Kids sábado', dias: [6], hora: '09:00', unidade: 'villas', vagas: 10 },
      { id: 't4', programa: 'xpress', nome: 'Winner Xpress · turma de novembro', dias: [1, 3], hora: '19:00', unidade: 'pituacu', vagas: 8 },
      { id: 't5', programa: 'adulto', nome: 'Adulto intermediário', dias: [1, 3], hora: '07:00', unidade: 'pituacu', vagas: 8 },
      { id: 't6', programa: 'adulto', nome: 'Adulto avançado', dias: [2, 4], hora: '20:00', unidade: 'pituacu', vagas: 8 },
      { id: 't7', programa: 'pretemporada', nome: 'Competição juvenil', dias: [1, 3, 5], hora: '16:00', unidade: 'pituacu', vagas: 10 }
    ];
    var HAB = ['Forehand', 'Backhand', 'Saque', 'Voleio', 'Jogo de pés', 'Tática'];
    var NIVEIS = ['Iniciação', 'Básico', 'Intermediário', 'Avançado', 'Competição'];

    function frequencia(dias, semanas, taxa) {
      var out = [], d = deIso(H);
      for (var i = 1; i <= semanas * 7; i++) {
        var x = new Date(d); x.setDate(d.getDate() - i);
        if (dias.indexOf(x.getDay()) >= 0) out.push({ dia: iso(x), presente: rnd() < taxa });
      }
      return out.reverse();
    }
    function aluno(nome, idade, turma, nivel, extra) {
      var t = db.turmas.filter(function (x) { return x.id === turma; })[0];
      var base = Math.max(1, Math.min(4, nivel));
      var hab = {}; HAB.forEach(function (h) {
        var atual = Math.max(1, Math.min(5, base + (rnd() < 0.35 ? 1 : 0) - (rnd() < 0.2 ? 1 : 0)));
        hab[h] = { antes: Math.max(1, atual - (rnd() < 0.6 ? 1 : 0)), atual: atual };
      });
      var a = Object.assign({
        id: uid('a'), nome: nome, idade: idade, responsavel: idade < 18 ? 'Responsável (exemplo)' : '',
        telefone: '7199000' + String(1000 + db.alunos.length), turma: turma, nivel: NIVEIS[Math.min(4, nivel)],
        habilidades: hab, freq: frequencia(t.dias, 8, 0.72 + rnd() * 0.25),
        avaliacao: '', desde: soma(H, -Math.floor(60 + rnd() * 900)), ativo: true, exemplo: true
      }, extra || {});
      db.alunos.push(a); return a;
    }
    // os dois logins da demo
    aluno('Helena Duarte', 9, 't2', 1, { usuario: 'helena', responsavel: 'Carla Duarte (exemplo)',
      avaliacao: 'Evoluiu muito no forehand cruzado. Próximo passo: saque por cima e sair da linha de base para a rede.' });
    aluno('Rafael Nogueira', 34, 't5', 2, { usuario: 'rafael',
      avaliacao: 'Backhand mais firme desde a última avaliação. Trabalhar devolução de saque e jogo de dupla.' });
    KIDS.slice(1, 9).forEach(function (n, i) { aluno(n, 7 + (i % 4), 't2', i % 3 === 0 ? 2 : 1); });
    KIDS.slice(9, 15).forEach(function (n, i) { aluno(n, 4 + (i % 3), 't1', 0); });
    KIDS.slice(15, 21).forEach(function (n, i) { aluno(n, 6 + (i % 5), 't3', 1); });
    KIDS.slice(21, 29).forEach(function (n, i) { aluno(n, 11 + (i % 4), 't7', 3); });
    ADULTOS.slice(1, 7).forEach(function (n, i) { aluno(n, 28 + i * 3, 't5', 2); });
    ADULTOS.slice(7, 13).forEach(function (n, i) { aluno(n, 31 + i * 2, 't6', 3); });
    ADULTOS.slice(20, 26).forEach(function (n, i) { aluno(n, 25 + i * 4, 't4', 0); });

    /* ranking + chaves: Copa Futuro */
    var copa = CFG.torneioPor('copa'), P = CFG.pontos;
    var valoresVelhos = [P.campeao, P.vice, P.semi, P.semi, P.quartas, P.quartas, P.quartas, P.quartas, P.participacao, P.participacao];
    function rankingDe(tid, cat, nomes, etapasVelhas) {
      var lista = nomes.map(function (n) { return { nome: n, etapas: {} }; });
      etapasVelhas.forEach(function (e) {
        var embaralhado = lista.slice().sort(function () { return rnd() - 0.5; });
        embaralhado.forEach(function (x, i) { x.etapas[e] = valoresVelhos[i] || P.participacao; });
      });
      (db.ranking[tid] = db.ranking[tid] || {})[cat] = lista;
      return lista;
    }
    function porPontos(lista) {
      return lista.slice().sort(function (a, b) { return total(b) - total(a); }).map(function (x) { return x.nome; });
    }
    function somaEtapa(lista, etapa, pts) {
      Object.keys(pts).forEach(function (nome) {
        var x = lista.filter(function (l) { return l.nome === nome; })[0];
        if (!x) { x = { nome: nome, etapas: {} }; lista.push(x); }
        x.etapas[etapa] = pts[nome];
      });
    }
    copa.categorias.forEach(function (cat, ci) {
      var nomes = ci === 1 ? ['Helena Duarte'].concat(pega(KIDS, 1, 9)) : pega(KIDS, 8 + ci * 6, 10);
      var lista = rankingDe('copa', cat, nomes, [1, 2, 3]);
      var ordem = porPontos(lista);
      // 4ª etapa: chave completa
      var ch4 = gerar(ordem.slice(0, 8), { torneio: 'copa', etapa: 4, categoria: cat });
      joga(ch4, 9, placarKids, ordem);
      db.chaves['copa|4|' + cat] = ch4;
      somaEtapa(lista, 4, pontos(ch4));
      // 5ª etapa: inscrições
      var inscritos = porPontos(lista).slice(0, ci === 3 ? 5 : 7);
      if (ci === 1 && inscritos.indexOf('Helena Duarte') < 0) inscritos[0] = 'Helena Duarte';
      inscritos.forEach(function (n, k) {
        db.inscricoes.push({ id: uid('i'), torneio: 'copa', etapa: 5, categoria: cat, nome: n,
          nascimento: '', telefone: '7199000' + (2000 + ci * 10 + k), responsavel: 'Responsável (exemplo)',
          status: k === inscritos.length - 1 ? 'pendente' : 'confirmada', origem: 'site', criado: soma(H, -(k + 2)), exemplo: true });
      });
      // chaves da 5ª já geradas em duas categorias (as outras o painel gera)
      if (ci === 1 || ci === 2) {
        db.chaves['copa|5|' + cat] = gerar(inscritos.filter(function (n, k) { return k < inscritos.length - 1; }), { torneio: 'copa', etapa: 5, categoria: cat });
      }
    });

    /* Winner Open / Circuito Amizade */
    var open = CFG.torneioPor('open');
    open.categorias.forEach(function (cat, ci) {
      var fonte = cat === 'Feminina' ? ADULTOS.slice(20) : ADULTOS.slice(0, 20);
      var nomes = cat === '4ª classe' ? ['Rafael Nogueira'].concat(pega(fonte, 1 + ci * 2, 8)) : pega(fonte, ci * 3, 9);
      var lista = rankingDe('open', cat, nomes, [1]);
      var ordem = porPontos(lista);
      var ch2 = gerar(ordem.slice(0, 8), { torneio: 'open', etapa: 2, categoria: cat });
      joga(ch2, 9, placarAdulto, ordem);
      db.chaves['open|2|' + cat] = ch2;
      somaEtapa(lista, 2, pontos(ch2));
      // 3ª etapa em andamento: 4ª e 6ª classes com chave na rua (como no site atual)
      if (cat === '4ª classe' || cat === '6ª classe') {
        var ord3 = porPontos(lista);
        if (cat === '4ª classe' && ord3.indexOf('Rafael Nogueira') > 7) { ord3.splice(ord3.indexOf('Rafael Nogueira'), 1); ord3.splice(5, 0, 'Rafael Nogueira'); }
        var ch3 = gerar(ord3.slice(0, 8), { torneio: 'open', etapa: 3, categoria: cat });
        if (cat === '4ª classe') ch3.rodadas[0].forEach(function (j, m) {
          if (j.a === 'Rafael Nogueira') definir(ch3, 0, m, 'a', '6/4 3/6 10/8');
          if (j.b === 'Rafael Nogueira') definir(ch3, 0, m, 'b', '6/4 3/6 10/8');
        });
        joga(ch3, 0, placarAdulto, ord3);
        db.chaves['open|3|' + cat] = ch3;
        ord3.slice(0, 8).forEach(function (n, k) {
          db.inscricoes.push({ id: uid('i'), torneio: 'open', etapa: 3, categoria: cat, nome: n, telefone: '7199000' + (3000 + ci * 10 + k),
            status: 'confirmada', origem: 'site', criado: soma(H, -30), exemplo: true });
        });
      }
    });

    /* Circuito Litoral Norte: inscrições abertas */
    ['A', 'B', 'C', 'Iniciantes', 'Feminina'].forEach(function (cat, ci) {
      var fonte = cat === 'Feminina' ? ADULTOS.slice(20) : ADULTOS.slice(5, 20);
      pega(fonte, ci * 2, ci === 3 ? 3 : 4).forEach(function (n, k) {
        db.inscricoes.push({ id: uid('i'), torneio: 'litoral', etapa: 3, categoria: cat, nome: n, telefone: '7199000' + (4000 + ci * 10 + k),
          status: k === 0 ? 'pendente' : 'confirmada', origem: k % 2 ? 'whatsapp' : 'site', criado: soma(H, -(k + 1)), exemplo: true });
      });
    });

    db.inscricoes.push({ id: uid('i'), torneio: 'litoral', etapa: 3, categoria: 'B', nome: 'Rafael Nogueira', telefone: '71990001001',
      status: 'confirmada', origem: 'site', criado: soma(H, -1), exemplo: true });
    db.experimentais = [
      { id: uid('e'), nome: 'Mãe da Júlia, 6 anos (exemplo)', telefone: '71990006001', programa: 'kids', unidade: 'pituacu', periodo: 'Tarde', status: 'nova', criado: H },
      { id: uid('e'), nome: 'Roberto Lins (exemplo)', telefone: '71990006002', programa: 'xpress', unidade: 'pituacu', periodo: 'Noite', status: 'agendada', criado: soma(H, -1) },
      { id: uid('e'), nome: 'Ana Paula Souza (exemplo)', telefone: '71990006003', programa: 'adulto', unidade: 'villas', periodo: 'Manhã', status: 'nova', criado: soma(H, -2) }
    ];

    /* avisos */
    db.avisos = [
      { id: uid('v'), titulo: 'Copa Futuro · 5ª etapa', texto: 'Inscrições até 30/10. Jogos de 6 a 8 de novembro. As chaves saem aqui e na área do aluno.', para: 'todos', data: soma(H, -3), fixo: true },
      { id: uid('v'), titulo: 'Circuito Litoral Norte', texto: 'Abertura em 28/11 com mini torneio de duplas, churrasco e chopp. Inscrições até 20/11 na unidade Winner Villas.', para: 'todos', data: soma(H, -2) },
      { id: uid('v'), titulo: 'Kids 7–10: tragam garrafinha', texto: 'Aviso de exemplo para uma turma: com o calor, cada criança traz a sua garrafinha de água identificada.', para: 't2', data: soma(H, -1) },
      { id: uid('v'), titulo: 'Intermediário: aula de dupla', texto: 'Aviso de exemplo: na próxima segunda a aula é só de jogo de dupla.', para: 't5', data: H }
    ];

    /* reservas de quadra (exemplo) */
    var R = [[0, '18:00', 'pituacu', 'confirmada', 'André Calmon'], [0, '20:00', 'pituacu', 'pendente', 'Igor Bahia'],
      [1, '07:00', 'pituacu', 'confirmada', 'Marcelo Aragão'], [1, '19:00', 'villas', 'pendente', 'Juliana Spínola'],
      [2, '06:00', 'pituacu', 'confirmada', 'Fábio Sodré'], [2, '21:00', 'pituacu', 'confirmada', 'Tiago Medrado'],
      [3, '17:00', 'villas', 'pendente', 'Renata Cardoso'], [-1, '19:00', 'pituacu', 'confirmada', 'Sérgio Amado']];
    db.reservas = R.map(function (x, k) {
      return { id: uid('r'), unidade: x[2], dia: soma(H, x[0]), hora: x[1], duracao: 60, nome: x[4] + ' (exemplo)',
        telefone: '7199000' + (5000 + k), status: x[3], origem: k % 2 ? 'whatsapp' : 'site', criado: soma(H, x[0] - 2) };
    });
    return db;
  }

  function total(x) { return Object.keys(x.etapas || {}).reduce(function (s, k) { return s + (+x.etapas[k] || 0); }, 0); }

  function le() {
    var db = null;
    try { db = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { db = null; }
    if (!db || db.versao !== VERSAO) { db = semear(); grava(db); }
    return db;
  }
  function grava(db) { try { localStorage.setItem(K, JSON.stringify(db)); return true; } catch (e) { return false; } }
  function reset() { try { localStorage.removeItem(K); } catch (e) {} return le(); }
  function rankingOrdenado(db, tid, cat) {
    return ((db.ranking[tid] || {})[cat] || []).slice().sort(function (a, b) { return total(b) - total(a) || a.nome.localeCompare(b.nome); });
  }

  window.WTDB = {
    le: le, grava: grava, reset: reset, uid: uid, hoje: hoje, soma: soma, iso: iso, deIso: deIso,
    total: total, rankingOrdenado: rankingOrdenado,
    chaveId: function (t, e, c) { return t + '|' + e + '|' + c; }
  };
})();
