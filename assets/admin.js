/* =====================================================================
   Winner Tennis — painel (admin.html)
   Visão geral · Alunos e turmas (ficha + chamada) · Inscrições e chaves
   (gerar chave pelo ranking, lançar placar, somar ao ranking) · Ranking
   · Avisos · Reservas de quadra · Ajustes.
   Demo: login admin/winner (config.js), dados no navegador (wt_db), o
   mesmo banco que o site e a área do aluno leem: o que muda aqui aparece
   lá na hora.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.WT, DB = window.WTDB, CH = window.WTChave;
  var K_SESSAO = (CFG.prefixo || 'wt_') + 'sessao_admin';
  var SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var NIVEIS = ['Iniciação', 'Básico', 'Intermediário', 'Avançado', 'Competição'];
  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function dm(s) { var p = String(s).split('-'); return p[2] + '/' + p[1]; }
  function curto(s) { var d = DB.deIso(s); return SEM[d.getDay()] + ' ' + dm(s); }
  function telFmt(t) { var d = String(t || '').replace(/\D/g, ''); return d.length === 11 ? '(' + d.slice(0, 2) + ') ' + d[2] + ' ' + d.slice(3, 7) + '-' + d.slice(7) : t; }
  function zap(tel, txt) { var d = String(tel).replace(/\D/g, ''); return 'https://wa.me/' + (d.length <= 11 ? '55' + d : d) + '?text=' + encodeURIComponent(txt); }
  function btn(txt, cls, fn) { var b = el('button', 'btn btn-pq ' + (cls || ''), txt); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  function link(txt, href, cls) { var a = el('a', 'btn btn-pq ' + (cls || 'btn-vazado'), txt); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }
  function tag(txt, cls) { return el('span', 'tag ' + cls, txt); }
  function opcoes(sel, itens, val) {
    sel.innerHTML = '';
    itens.forEach(function (i) { var o = el('option', null, i.nome); o.value = i.id; sel.appendChild(o); });
    if (val != null) sel.value = val;
    return sel;
  }
  function filtro(rot, sel) { var l = el('label', null, rot); l.appendChild(sel); return l; }
  function tabela(cab, linhas) {
    var t = el('table', 'tab'), tr = el('tr');
    cab.forEach(function (c) { tr.appendChild(el('th', null, c)); });
    var th = el('thead'); th.appendChild(tr); t.appendChild(th);
    var tb = el('tbody'); linhas.forEach(function (l) { tb.appendChild(l); }); t.appendChild(tb);
    var r = el('div', 'tabela-rolar'); r.appendChild(t); return r;
  }
  function td(conteudo, cls) { var c = el('td', cls); if (conteudo instanceof Node) c.appendChild(conteudo); else c.textContent = conteudo == null ? '' : conteudo; return c; }
  function sessao(v) { try { if (v === undefined) return sessionStorage.getItem(K_SESSAO); if (v === null) sessionStorage.removeItem(K_SESSAO); else sessionStorage.setItem(K_SESSAO, v); } catch (e) { return null; } }

  var db = DB.le();
  function salva() { DB.grava(db); contadores(); }
  function turmaPor(id) { return db.turmas.filter(function (t) { return t.id === id; })[0]; }
  function freqPct(a) { var t = a.freq.length; return t ? Math.round(a.freq.filter(function (f) { return f.presente; }).length / t * 100) : null; }

  /* ---------------- login ---------------- */
  var L = CFG.loginsDemo.admin;
  $('#cred-admin').textContent = 'Usuário: ' + L.usuario + ' · Senha: ' + L.senha;
  $('#preencher-admin').addEventListener('click', function () { $('#adm-u').value = L.usuario; $('#adm-s').value = L.senha; });
  $('#form-adm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if ($('#adm-u').value.trim().toLowerCase() === L.usuario && $('#adm-s').value === L.senha) { sessao('1'); entra(); }
    else { $('#adm-msg').className = 'erro-msg'; $('#adm-msg').textContent = 'Usuário ou senha não conferem.'; }
  });
  $('#adm-sair').addEventListener('click', function () { sessao(null); location.reload(); });
  function entra() {
    $('#v-login').hidden = true; $('#v-painel').hidden = false; $('#adm-sair').hidden = false;
    var q = new URLSearchParams(location.search).get('aba');
    abre(ABAS[q] ? q : 'geral');
  }

  /* ---------------- navegação ---------------- */
  var ABAS = { geral: geral, alunos: alunos, inscricoes: inscricoes, ranking: ranking, avisos: avisos, reservas: reservas, ajustes: ajustes };
  var atual = 'geral';
  Array.prototype.forEach.call(document.querySelectorAll('.adm-nav button'), function (b) {
    b.addEventListener('click', function () { abre(b.dataset.aba); history.replaceState(null, '', '?aba=' + b.dataset.aba); });
  });
  function abre(id) {
    atual = id; db = DB.le();
    Array.prototype.forEach.call(document.querySelectorAll('.adm-nav button'), function (b) { b.setAttribute('aria-current', b.dataset.aba === id ? 'true' : 'false'); });
    var m = $('#adm-main'); m.innerHTML = ''; ABAS[id](m); contadores();
    m.focus({ preventScroll: true });
  }
  function contadores() {
    var pend = db.inscricoes.filter(function (i) { return i.status === 'pendente'; }).length;
    var res = db.reservas.filter(function (r) { return r.status === 'pendente'; }).length;
    var exp = (db.experimentais || []).filter(function (e) { return e.status === 'nova'; }).length;
    [['inscricoes', pend], ['reservas', res], ['geral', exp]].forEach(function (x) {
      var b = document.querySelector('.adm-nav [data-aba="' + x[0] + '"] .cont'); if (b) { b.textContent = x[1]; b.hidden = !x[1]; }
    });
  }
  function titulo(m, t, nota) { m.appendChild(el('h2', null, t)); if (nota) m.appendChild(el('p', 'nota', nota)); }

  /* ================= VISÃO GERAL ================= */
  function geral(m) {
    var H = DB.hoje();
    titulo(m, 'Visão geral', 'Hoje, ' + curto(H) + '. Tudo o que chegou pelo site aparece aqui.');
    var ativos = db.alunos.filter(function (a) { return a.ativo; });
    var media = Math.round(ativos.reduce(function (s, a) { return s + (freqPct(a) || 0); }, 0) / (ativos.length || 1));
    var pend = db.inscricoes.filter(function (i) { return i.status === 'pendente'; });
    var resHoje = db.reservas.filter(function (r) { return r.dia === H && r.status !== 'cancelada'; });
    var exps = (db.experimentais || []).filter(function (e) { return e.status === 'nova'; });
    var k = el('div', 'kpis');
    [[ativos.length, 'alunos na demo (a Winner tem 600+)'], [media + '%', 'frequência média, 8 semanas'], [exps.length, 'aulas experimentais novas', exps.length],
      [pend.length, 'inscrições aguardando pagamento', pend.length], [resHoje.length, 'reservas de quadra hoje']].forEach(function (x) {
      var d = el('div', 'kpi' + (x[2] ? ' alerta' : '')); d.appendChild(el('b', null, String(x[0]))); d.appendChild(el('span', null, x[1])); k.appendChild(d);
    });
    m.appendChild(k);
    var cs = el('div', 'cartoes');

    var c1 = el('div', 'cartao'); c1.appendChild(el('h3', null, 'Aulas experimentais'));
    var u1 = el('ul', 'lista-simples');
    (db.experimentais || []).slice(0, 6).forEach(function (e) {
      var li = el('li'), p = CFG.programaPor(e.programa);
      li.appendChild(el('b', null, e.nome)); li.appendChild(document.createTextNode(' '));
      li.appendChild(tag(e.status === 'nova' ? 'nova' : 'agendada', e.status === 'nova' ? 'tag-nova' : 'tag-ok'));
      li.appendChild(el('small', null, p.nome + ' · ' + CFG.unidadePor(e.unidade).nome + ' · ' + e.periodo + ' · ' + telFmt(e.telefone)));
      var ac = el('div', 'linha-acoes'); ac.style.marginTop = '8px';
      ac.appendChild(link('WhatsApp', zap(e.telefone, 'Olá! Aqui é da Winner Tennis. Recebemos seu pedido de aula experimental do ' + p.nome + '. Temos horário ' + e.periodo.toLowerCase() + ' nesta semana, posso reservar?')));
      if (e.status === 'nova') ac.appendChild(btn('Marcar como agendada', '', function () { e.status = 'agendada'; salva(); abre('geral'); }));
      li.appendChild(ac); u1.appendChild(li);
    });
    if (!(db.experimentais || []).length) u1.appendChild(el('li', null, 'Nenhum pedido ainda.'));
    c1.appendChild(u1); cs.appendChild(c1);

    var c2 = el('div', 'cartao'); c2.appendChild(el('h3', null, 'Inscrições a confirmar'));
    var u2 = el('ul', 'lista-simples');
    pend.slice(0, 6).forEach(function (i) {
      var t = CFG.torneioPor(i.torneio), li = el('li');
      li.appendChild(el('b', null, i.nome)); li.appendChild(el('small', null, t.nome + ' · ' + i.etapa + 'ª etapa · ' + i.categoria));
      var ac = el('div', 'linha-acoes'); ac.style.marginTop = '8px';
      ac.appendChild(btn('Pagamento ok', '', function () { i.status = 'confirmada'; salva(); abre('geral'); }));
      ac.appendChild(link('Cobrar no WhatsApp', zap(i.telefone, 'Olá! Aqui é da Winner Tennis. Recebemos a inscrição de ' + i.nome + ' no ' + t.nome + ' (' + i.categoria + '). Falta só o pagamento para confirmar a vaga.')));
      li.appendChild(ac); u2.appendChild(li);
    });
    if (!pend.length) u2.appendChild(el('li', null, 'Nada pendente.'));
    c2.appendChild(u2); cs.appendChild(c2);

    var c3 = el('div', 'cartao'); c3.appendChild(el('h3', null, 'Quadras hoje'));
    var u3 = el('ul', 'lista-simples');
    resHoje.sort(function (a, b) { return a.hora < b.hora ? -1 : 1; }).forEach(function (r) {
      var li = el('li'); li.appendChild(el('b', null, r.hora + ' · ' + r.nome)); li.appendChild(document.createTextNode(' '));
      li.appendChild(tag(r.status === 'confirmada' ? 'confirmada' : 'pendente', r.status === 'confirmada' ? 'tag-ok' : 'tag-pend'));
      li.appendChild(el('small', null, CFG.unidadePor(r.unidade).nome)); u3.appendChild(li);
    });
    if (!resHoje.length) u3.appendChild(el('li', null, 'Nenhuma reserva hoje.'));
    c3.appendChild(u3); c3.appendChild(btn('Abrir reservas', 'btn-vazado', function () { abre('reservas'); }));
    cs.appendChild(c3);

    var c4 = el('div', 'cartao'); c4.appendChild(el('h3', null, 'Frequência baixa'));
    c4.appendChild(el('p', 'nota', 'Alunos abaixo de 70% nas últimas 8 semanas: vale uma mensagem antes que cancelem.'));
    var u4 = el('ul', 'lista-simples');
    var baixos = ativos.filter(function (a) { return freqPct(a) < 70; }).sort(function (a, b) { return freqPct(a) - freqPct(b); }).slice(0, 6);
    baixos.forEach(function (a) {
      var li = el('li'); li.appendChild(el('b', null, a.nome + ' · ' + freqPct(a) + '%')); li.appendChild(el('small', null, turmaPor(a.turma).nome));
      li.appendChild(link('Mensagem', zap(a.telefone, 'Olá! Aqui é da Winner Tennis. Sentimos falta de ' + a.nome.split(' ')[0] + ' nas últimas aulas. Está tudo bem? Se precisar, a gente ajusta o horário.')));
      u4.appendChild(li);
    });
    if (!baixos.length) u4.appendChild(el('li', null, 'Ninguém abaixo de 70%.'));
    c4.appendChild(u4); cs.appendChild(c4);
    m.appendChild(cs);
  }

  /* ================= ALUNOS E TURMAS ================= */
  var filtroTurma = '';
  function alunos(m) {
    titulo(m, 'Alunos e turmas', 'Clique no aluno para editar nível, notas por fundamento e a avaliação que ele vê na área do aluno.');
    var f = el('div', 'filtros');
    var sel = opcoes(el('select'), [{ id: '', nome: 'Todas as turmas' }].concat(db.turmas.map(function (t) { return { id: t.id, nome: t.nome }; })), filtroTurma);
    sel.addEventListener('change', function () { filtroTurma = sel.value; abre('alunos'); });
    f.appendChild(filtro('Turma', sel));
    f.appendChild(btn('+ Aluno', '', function () { ficha(null); }));
    m.appendChild(f);

    // turmas
    var cs = el('div', 'cartoes'); cs.style.marginBottom = '28px';
    db.turmas.filter(function (t) { return !filtroTurma || t.id === filtroTurma; }).forEach(function (t) {
      var n = db.alunos.filter(function (a) { return a.turma === t.id && a.ativo; }).length;
      var c = el('div', 'cartao'); c.appendChild(el('h3', null, t.nome));
      c.appendChild(el('p', null, t.dias.map(function (d) { return SEM[d]; }).join(' e ') + ' · ' + t.hora + ' · ' + CFG.unidadePor(t.unidade).nome));
      c.appendChild(el('p', 'nota', n + ' de ' + t.vagas + ' vagas · professor(a) a confirmar · horário de exemplo'));
      c.appendChild(btn('Fazer chamada', 'btn-saibro', function () { chamada(t); }));
      cs.appendChild(c);
    });
    m.appendChild(cs);

    var lista = db.alunos.filter(function (a) { return !filtroTurma || a.turma === filtroTurma; });
    m.appendChild(tabela(['Aluno', 'Idade', 'Turma', 'Nível', 'Freq.', 'WhatsApp', ''], lista.map(function (a) {
      var tr = el('tr'); tr.appendChild(td(a.nome + (a.usuario ? ' · login demo' : ''))); tr.appendChild(td(a.idade, 'n'));
      tr.appendChild(td(turmaPor(a.turma).nome)); tr.appendChild(td(a.nivel));
      var p = freqPct(a); tr.appendChild(td(p == null ? '—' : p + '%', 'n'));
      tr.appendChild(td(telFmt(a.telefone)));
      tr.appendChild(td(btn('Ficha', 'btn-vazado', function () { ficha(a); })));
      return tr;
    })));
  }

  var dlg = $('#dlg'), dlgCorpo = $('#dlg-corpo');
  function dialogo(montar) { dlgCorpo.innerHTML = ''; montar(dlgCorpo); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  function fecha() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }

  function ficha(a) {
    var novo = !a;
    if (novo) a = { id: DB.uid('a'), nome: '', idade: '', responsavel: '', telefone: '', turma: filtroTurma || db.turmas[0].id, nivel: NIVEIS[0],
      habilidades: {}, freq: [], avaliacao: '', desde: DB.hoje(), ativo: true };
    ['Forehand', 'Backhand', 'Saque', 'Voleio', 'Jogo de pés', 'Tática'].forEach(function (h) { if (!a.habilidades[h]) a.habilidades[h] = { antes: 1, atual: 1 }; });
    dialogo(function (c) {
      var f = el('form'); f.noValidate = true;
      f.appendChild(el('h3', null, novo ? 'Novo aluno' : a.nome));
      var cps = el('div', 'campos');
      function inp(rot, val, tipo, cheio) { var l = el('label', cheio ? 'cheio' : null, rot), i = el('input'); i.type = tipo || 'text'; i.value = val == null ? '' : val; l.appendChild(i); cps.appendChild(l); return i; }
      var iNome = inp('Nome', a.nome, 'text', true), iIdade = inp('Idade', a.idade, 'number'), iTel = inp('WhatsApp', a.telefone, 'tel');
      var iResp = inp('Responsável (menores)', a.responsavel, 'text', true);
      var sT = opcoes(el('select'), db.turmas.map(function (t) { return { id: t.id, nome: t.nome }; }), a.turma); cps.appendChild(filtro('Turma', sT));
      var sN = opcoes(el('select'), NIVEIS.map(function (n) { return { id: n, nome: n }; }), a.nivel); cps.appendChild(filtro('Nível', sN));
      f.appendChild(cps);
      f.appendChild(el('p', null, 'Nota por fundamento (1 a 5)')).style.cssText = 'font-weight:700;margin:20px 0 8px';
      var he = el('div', 'hab-edit'), ins = {};
      Object.keys(a.habilidades).forEach(function (h) {
        he.appendChild(el('span', null, h + ' (antes: ' + a.habilidades[h].atual + ')'));
        var i = el('input'); i.type = 'number'; i.min = 1; i.max = 5; i.value = a.habilidades[h].atual; ins[h] = i; he.appendChild(i);
      });
      f.appendChild(he);
      var la = el('label', null, 'Avaliação do professor (o aluno vê)'); la.style.marginTop = '16px';
      var ta = el('textarea'); ta.value = a.avaliacao || ''; la.appendChild(ta); f.appendChild(la);
      var ac = el('div', 'linha-acoes');
      var ok = el('button', 'btn btn-pq', 'Salvar'); ok.type = 'submit'; ac.appendChild(ok);
      ac.appendChild(btn('Cancelar', 'btn-vazado', fecha));
      if (!novo) ac.appendChild(btn(a.ativo ? 'Marcar como inativo' : 'Reativar', 'btn-vazado', function () { a.ativo = !a.ativo; salva(); fecha(); abre('alunos'); }));
      f.appendChild(ac);
      var msg = el('div'); f.appendChild(msg);
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!iNome.value.trim()) { msg.className = 'erro-msg'; msg.textContent = 'Informe o nome.'; return; }
        a.nome = iNome.value.trim(); a.idade = +iIdade.value || ''; a.telefone = iTel.value.replace(/\D/g, ''); a.responsavel = iResp.value.trim();
        a.turma = sT.value; a.nivel = sN.value; a.avaliacao = ta.value.trim();
        Object.keys(ins).forEach(function (h) {
          var v = Math.max(1, Math.min(5, +ins[h].value || 1));
          if (v !== a.habilidades[h].atual) a.habilidades[h] = { antes: a.habilidades[h].atual, atual: v };
        });
        if (novo) db.alunos.push(a);
        salva(); fecha(); abre('alunos');
      });
      c.appendChild(f);
    });
  }

  function chamada(t) {
    dialogo(function (c) {
      var box = el('div', 'dlg');
      box.appendChild(el('h3', null, 'Chamada · ' + t.nome));
      var di = el('input'); di.type = 'date'; di.value = DB.hoje(); di.max = DB.hoje();
      box.appendChild(filtro('Dia da aula', di));
      var ul = el('ul', 'lista-simples chamada'); ul.style.marginTop = '16px'; box.appendChild(ul);
      function monta() {
        ul.innerHTML = '';
        db.alunos.filter(function (a) { return a.turma === t.id && a.ativo; }).forEach(function (a) {
          var reg = a.freq.filter(function (x) { return x.dia === di.value; })[0];
          var li = el('li'); li.appendChild(el('span', null, a.nome));
          var seg = el('div', 'seg');
          [['p', 'Presente', true], ['f', 'Falta', false]].forEach(function (o) {
            var b = el('button', o[0], o[1]); b.type = 'button';
            b.setAttribute('aria-pressed', reg && reg.presente === o[2] ? 'true' : 'false');
            b.addEventListener('click', function () {
              a.freq = a.freq.filter(function (x) { return x.dia !== di.value; });
              a.freq.push({ dia: di.value, presente: o[2] });
              a.freq.sort(function (x, y) { return x.dia < y.dia ? -1 : 1; });
              salva(); monta();
            });
            seg.appendChild(b);
          });
          li.appendChild(seg); ul.appendChild(li);
        });
      }
      di.addEventListener('change', monta); monta();
      var ac = el('div', 'linha-acoes'); ac.appendChild(btn('Concluir', '', function () { fecha(); abre('alunos'); })); box.appendChild(ac);
      box.appendChild(el('p', 'nota', 'Cada clique já grava. A frequência aparece na área do aluno.'));
      c.appendChild(box);
    });
  }

  /* ================= INSCRIÇÕES E CHAVES ================= */
  var selI = { t: 'copa', e: 5, c: 'Sub-8' };
  function inscricoes(m) {
    titulo(m, 'Inscrições e chaves', 'Confirme pagamentos, gere a chave pelo ranking (cabeças de chave) e lance os placares: o site e a área do aluno atualizam na hora.');
    var t = CFG.torneioPor(selI.t);
    if (!t.etapas.some(function (e) { return e.n === selI.e; })) selI.e = t.etapaAtual;
    if (t.categorias.indexOf(selI.c) < 0) selI.c = t.categorias[0];
    var f = el('div', 'filtros');
    var sT = opcoes(el('select'), CFG.torneios.map(function (x) { return { id: x.id, nome: x.nome }; }), selI.t);
    var sE = opcoes(el('select'), t.etapas.map(function (e) { return { id: e.n, nome: e.n + 'ª etapa' }; }), selI.e);
    var sC = opcoes(el('select'), t.categorias.map(function (c) { return { id: c, nome: c }; }), selI.c);
    sT.addEventListener('change', function () { selI.t = sT.value; selI.e = CFG.torneioPor(sT.value).etapaAtual; selI.c = CFG.torneioPor(sT.value).categorias[0]; abre('inscricoes'); });
    sE.addEventListener('change', function () { selI.e = +sE.value; abre('inscricoes'); });
    sC.addEventListener('change', function () { selI.c = sC.value; abre('inscricoes'); });
    f.appendChild(filtro('Torneio', sT)); f.appendChild(filtro('Etapa', sE)); f.appendChild(filtro('Categoria', sC));
    m.appendChild(f);

    var lista = db.inscricoes.filter(function (i) { return i.torneio === selI.t && i.etapa === selI.e && i.categoria === selI.c; });
    var conf = lista.filter(function (i) { return i.status === 'confirmada'; });
    var cab = el('h3', null, 'Inscritos · ' + conf.length + ' confirmados de ' + lista.filter(function (i) { return i.status !== 'cancelada'; }).length); cab.style.margin = '8px 0 12px';
    m.appendChild(cab);
    if (!lista.length) m.appendChild(el('p', null, 'Nenhuma inscrição nesta categoria e etapa.'));
    else m.appendChild(tabela(['Atleta', 'Responsável', 'WhatsApp', 'Origem', 'Status', ''], lista.map(function (i) {
      var tr = el('tr'); tr.appendChild(td(i.nome)); tr.appendChild(td(i.responsavel || '—')); tr.appendChild(td(telFmt(i.telefone)));
      tr.appendChild(td(i.origem === 'site' ? 'Site' : 'WhatsApp'));
      tr.appendChild(td(tag(i.status === 'confirmada' ? 'confirmada' : i.status === 'cancelada' ? 'cancelada' : 'aguardando pagamento', i.status === 'confirmada' ? 'tag-ok' : i.status === 'cancelada' ? 'tag-canc' : 'tag-pend')));
      var ac = el('div', 'linha-acoes');
      if (i.status === 'pendente') ac.appendChild(btn('Pagamento ok', '', function () { i.status = 'confirmada'; salva(); abre('inscricoes'); }));
      if (i.status !== 'cancelada') ac.appendChild(btn('Cancelar', 'btn-vazado', function () { i.status = 'cancelada'; salva(); abre('inscricoes'); }));
      else ac.appendChild(btn('Reativar', 'btn-vazado', function () { i.status = 'pendente'; salva(); abre('inscricoes'); }));
      tr.appendChild(td(ac)); return tr;
    })));

    var id = DB.chaveId(selI.t, selI.e, selI.c), ch = db.chaves[id];
    var h = el('h3', null, 'Chave'); h.style.margin = '36px 0 12px'; m.appendChild(h);
    var ac = el('div', 'linha-acoes'); ac.style.marginBottom = '16px';
    ac.appendChild(btn(ch ? 'Gerar de novo' : 'Gerar chave', 'btn-saibro', function () {
      if (conf.length < 2) { alert('São precisos pelo menos 2 inscritos confirmados.'); return; }
      if (ch && !confirm('Gerar de novo apaga os placares já lançados nesta chave. Continuar?')) return;
      var rk = DB.rankingOrdenado(db, selI.t, selI.c).map(function (x) { return x.nome; });
      var nomes = conf.map(function (i) { return i.nome; }).sort(function (a, b) {
        var pa = rk.indexOf(a), pb = rk.indexOf(b); return (pa < 0 ? 999 : pa) - (pb < 0 ? 999 : pb) || a.localeCompare(b);
      });
      db.chaves[id] = CH.gerar(nomes, { torneio: selI.t, etapa: selI.e, categoria: selI.c });
      salva(); abre('inscricoes');
    }));
    if (ch) {
      var verLink = el('a', 'btn btn-pq btn-vazado', 'Ver no site'); verLink.href = 'torneios.html?t=' + selI.t + '#chaves'; verLink.target = '_blank'; ac.appendChild(verLink);
      if (CH.completa(ch)) ac.appendChild(btn('Somar ao ranking', '', function () {
        var pts = CH.pontos(ch), rk = ((db.ranking[selI.t] = db.ranking[selI.t] || {})[selI.c] = db.ranking[selI.t][selI.c] || []);
        Object.keys(pts).forEach(function (n) {
          var x = rk.filter(function (r) { return r.nome === n; })[0]; if (!x) { x = { nome: n, etapas: {} }; rk.push(x); }
          x.etapas[selI.e] = pts[n];
        });
        salva(); alert('Pontos da ' + selI.e + 'ª etapa somados ao ranking de ' + selI.c + '.'); abre('ranking');
      }));
    }
    m.appendChild(ac);
    if (!ch) { m.appendChild(el('p', 'nota', 'Os cabeças de chave saem do ranking da categoria; quem não tem pontos entra depois, em ordem alfabética. Byes avançam sozinhos.')); return; }
    m.appendChild(el('p', 'nota', 'Clique num jogo para lançar o placar. O vencedor avança sozinho.'));
    var rol = el('div', 'chave-rolar'); rol.appendChild(CH.desenha(ch, { aoClicar: function (r, mm) { placar(ch, r, mm); } })); m.appendChild(rol);
  }

  function placar(ch, r, m) {
    var j = ch.rodadas[r][m];
    if (!j.a || !j.b) { alert('Este jogo ainda não tem os dois atletas definidos.'); return; }
    dialogo(function (c) {
      var f = el('form'); f.noValidate = true;
      f.appendChild(el('h3', null, CH.fase(ch, r)));
      var es = el('div', 'escolhas');
      ['a', 'b'].forEach(function (l) {
        var lb = el('label'), i = el('input'); i.type = 'radio'; i.name = 'v'; i.value = l; i.checked = j.v === l;
        lb.appendChild(i); lb.appendChild(el('span', null, j[l] + ' venceu')); es.appendChild(lb);
      });
      f.appendChild(es);
      var lp = el('label', null, 'Placar (do vencedor)'); lp.style.marginTop = '16px';
      var ip = el('input'); ip.value = j.placar || ''; ip.placeholder = 'ex.: 6/4 6/3'; lp.appendChild(ip); f.appendChild(lp);
      var ac = el('div', 'linha-acoes');
      var ok = el('button', 'btn btn-pq', 'Salvar placar'); ok.type = 'submit'; ac.appendChild(ok);
      if (j.v) ac.appendChild(btn('Apagar resultado', 'btn-vazado', function () { CH.definir(ch, r, m, null); salva(); fecha(); abre('inscricoes'); }));
      ac.appendChild(btn('Cancelar', 'btn-vazado', fecha));
      f.appendChild(ac);
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var v = (f.querySelector('input[name="v"]:checked') || {}).value;
        if (!v) { alert('Escolha o vencedor.'); return; }
        CH.definir(ch, r, m, v, ip.value.trim()); salva(); fecha(); abre('inscricoes');
      });
      c.appendChild(f);
    });
  }

  /* ================= RANKING ================= */
  var selR = { t: 'copa', c: 'Sub-10' };
  function ranking(m) {
    titulo(m, 'Ranking', 'Pontos por etapa. "Somar ao ranking" (em Inscrições e chaves) preenche a etapa sozinho; aqui dá para corrigir à mão.');
    var t = CFG.torneioPor(selR.t);
    if (t.categorias.indexOf(selR.c) < 0) selR.c = t.categorias[0];
    var f = el('div', 'filtros');
    var sT = opcoes(el('select'), CFG.torneios.map(function (x) { return { id: x.id, nome: x.nome }; }), selR.t);
    var sC = opcoes(el('select'), t.categorias.map(function (c) { return { id: c, nome: c }; }), selR.c);
    sT.addEventListener('change', function () { selR.t = sT.value; abre('ranking'); });
    sC.addEventListener('change', function () { selR.c = sC.value; abre('ranking'); });
    f.appendChild(filtro('Torneio', sT)); f.appendChild(filtro('Categoria', sC));
    m.appendChild(f);
    var lista = DB.rankingOrdenado(db, selR.t, selR.c);
    if (!lista.length) { m.appendChild(el('p', null, 'Sem pontos nesta categoria ainda.')); }
    else {
      var etapas = t.etapas.map(function (e) { return e.n; });
      m.appendChild(tabela(['#', 'Atleta'].concat(etapas.map(function (n) { return n + 'ª etapa'; })).concat(['Total']), lista.map(function (x, i) {
        var tr = el('tr'); tr.appendChild(td(i + 1 + 'º', 'pos')); tr.appendChild(td(x.nome));
        etapas.forEach(function (n) {
          var inp = el('input'); inp.type = 'number'; inp.min = 0; inp.value = x.etapas[n] != null ? x.etapas[n] : ''; inp.style.cssText = 'width:84px;min-height:40px;margin:0';
          inp.setAttribute('aria-label', x.nome + ', ' + n + 'ª etapa');
          inp.addEventListener('change', function () { if (inp.value === '') delete x.etapas[n]; else x.etapas[n] = +inp.value; salva(); abre('ranking'); });
          tr.appendChild(td(inp));
        });
        tr.appendChild(td(el('b', null, String(DB.total(x))), 'n'));
        return tr;
      })));
    }
    m.appendChild(el('p', 'nota', 'Tabela de pontos (exemplo, trocar pela do regulamento): campeão ' + CFG.pontos.campeao + ', vice ' + CFG.pontos.vice + ', semi ' + CFG.pontos.semi + ', quartas ' + CFG.pontos.quartas + ', oitavas ' + CFG.pontos.oitavas + ', participação ' + CFG.pontos.participacao + '.'));
  }

  /* ================= AVISOS ================= */
  function avisos(m) {
    titulo(m, 'Avisos', 'O aviso aparece na área do aluno: para todos ou só para uma turma. Fixado fica no topo.');
    var f = el('form', 'form'); f.noValidate = true; f.style.maxWidth = '720px'; f.style.marginBottom = '32px';
    f.appendChild(el('h3', null, 'Novo aviso'));
    var cps = el('div', 'campos');
    var lt = el('label', 'cheio', 'Título'), it = el('input'); lt.appendChild(it); cps.appendChild(lt);
    var lx = el('label', 'cheio', 'Texto'), tx = el('textarea'); lx.appendChild(tx); cps.appendChild(lx);
    var sP = opcoes(el('select'), [{ id: 'todos', nome: 'Todos os alunos' }].concat(db.turmas.map(function (t) { return { id: t.id, nome: 'Turma: ' + t.nome }; })), 'todos');
    cps.appendChild(filtro('Para', sP));
    var lf = el('label', null), cf = el('input'); cf.type = 'checkbox'; cf.style.cssText = 'width:auto;min-height:0;margin-right:8px';
    lf.appendChild(cf); lf.appendChild(document.createTextNode('Fixar no topo')); lf.style.alignSelf = 'center'; cps.appendChild(lf);
    f.appendChild(cps);
    var ok = el('button', 'btn', 'Publicar aviso'); ok.type = 'submit'; f.appendChild(ok);
    var msg = el('div'); f.appendChild(msg);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!it.value.trim() || !tx.value.trim()) { msg.className = 'erro-msg'; msg.textContent = 'Preencha título e texto.'; return; }
      db.avisos.unshift({ id: DB.uid('v'), titulo: it.value.trim(), texto: tx.value.trim(), para: sP.value, data: DB.hoje(), fixo: cf.checked });
      salva(); abre('avisos');
    });
    m.appendChild(f);
    var ul = el('ul', 'lista-simples'); ul.style.maxWidth = '720px';
    db.avisos.slice().sort(function (a, b) { return (b.fixo ? 1 : 0) - (a.fixo ? 1 : 0) || (a.data < b.data ? 1 : -1); }).forEach(function (v) {
      var li = el('li'); li.appendChild(el('b', null, (v.fixo ? 'Fixado · ' : '') + v.titulo));
      li.appendChild(el('small', null, dm(v.data) + ' · ' + (v.para === 'todos' ? 'todos os alunos' : turmaPor(v.para) ? turmaPor(v.para).nome : v.para)));
      var p = el('p', null, v.texto); p.style.margin = '6px 0 8px'; li.appendChild(p);
      var ac = el('div', 'linha-acoes');
      ac.appendChild(btn(v.fixo ? 'Desafixar' : 'Fixar', 'btn-vazado', function () { v.fixo = !v.fixo; salva(); abre('avisos'); }));
      ac.appendChild(btn('Excluir', 'btn-vazado', function () { if (confirm('Excluir este aviso?')) { db.avisos = db.avisos.filter(function (x) { return x !== v; }); salva(); abre('avisos'); } }));
      li.appendChild(ac); ul.appendChild(li);
    });
    m.appendChild(ul);
  }

  /* ================= RESERVAS ================= */
  var diaR = null;
  function reservas(m) {
    diaR = diaR || DB.hoje();
    titulo(m, 'Reservas de quadra', 'Pedidos do site entram como pendentes. Clique numa reserva para confirmar ou cancelar; num horário vazio para lançar uma reserva feita por telefone.');
    var f = el('div', 'filtros');
    f.appendChild(btn('← Dia anterior', 'btn-vazado', function () { diaR = DB.soma(diaR, -1); abre('reservas'); }));
    var di = el('input'); di.type = 'date'; di.value = diaR; di.addEventListener('change', function () { if (di.value) { diaR = di.value; abre('reservas'); } });
    f.appendChild(filtro(curto(diaR), di));
    f.appendChild(btn('Próximo dia →', 'btn-vazado', function () { diaR = DB.soma(diaR, 1); abre('reservas'); }));
    f.appendChild(btn('Hoje', '', function () { diaR = DB.hoje(); abre('reservas'); }));
    m.appendChild(f);
    var g = el('div', 'grade-q'); g.style.gridTemplateColumns = '70px repeat(' + CFG.unidades.length + ', 1fr)';
    g.appendChild(el('div', 'h', 'Hora'));
    CFG.unidades.forEach(function (u) { g.appendChild(el('div', 'h', u.nome)); });
    CFG.quadra.horarios.forEach(function (h) {
      g.appendChild(el('div', 'hora', h));
      CFG.unidades.forEach(function (u) {
        var r = db.reservas.filter(function (x) { return x.dia === diaR && x.hora === h && x.unidade === u.id && x.status !== 'cancelada'; })[0];
        var b = el('button', 'celula' + (r ? (r.status === 'confirmada' ? ' ocupada' : ' pendente') : ''), r ? r.nome + (r.status === 'pendente' ? ' · pendente' : '') : 'livre');
        b.type = 'button';
        b.addEventListener('click', function () { r ? reserva(r) : novaReserva(u, h); });
        g.appendChild(b);
      });
    });
    var rol = el('div', 'tabela-rolar'); rol.appendChild(g); m.appendChild(rol);
    m.appendChild(el('p', 'nota', 'Uma quadra por unidade nesta demonstração; número de quadras, horários e valor da hora: a confirmar.'));
    var pend = db.reservas.filter(function (r) { return r.status === 'pendente' && r.dia >= DB.hoje(); });
    var h3 = el('h3', null, 'Pendentes (' + pend.length + ')'); h3.style.margin = '32px 0 12px'; m.appendChild(h3);
    m.appendChild(tabela(['Dia', 'Hora', 'Unidade', 'Nome', 'WhatsApp', ''], pend.map(function (r) {
      var tr = el('tr'); tr.appendChild(td(curto(r.dia))); tr.appendChild(td(r.hora)); tr.appendChild(td(CFG.unidadePor(r.unidade).nome));
      tr.appendChild(td(r.nome)); tr.appendChild(td(telFmt(r.telefone)));
      tr.appendChild(td(btn('Abrir', 'btn-vazado', function () { reserva(r); }))); return tr;
    })));
  }
  function reserva(r) {
    dialogo(function (c) {
      var box = el('div', 'dlg');
      box.appendChild(el('h3', null, r.hora + ' · ' + curto(r.dia)));
      box.appendChild(el('p', null, r.nome + ' · ' + telFmt(r.telefone)));
      box.appendChild(el('p', 'nota', CFG.unidadePor(r.unidade).nome + ' · ' + (r.origem === 'site' ? 'pedido pelo site' : 'lançada no painel') + ' · ' + (r.status === 'confirmada' ? 'confirmada' : 'pendente')));
      var ac = el('div', 'linha-acoes');
      if (r.status !== 'confirmada') ac.appendChild(btn('Confirmar', '', function () { r.status = 'confirmada'; salva(); fecha(); abre('reservas'); }));
      ac.appendChild(link('WhatsApp', zap(r.telefone, 'Olá! Aqui é da Winner Tennis. Sua quadra de ' + curto(r.dia) + ' às ' + r.hora + ' (' + CFG.unidadePor(r.unidade).nome + ') está confirmada. Bom jogo!')));
      ac.appendChild(btn('Cancelar reserva', 'btn-vazado', function () { if (confirm('Cancelar esta reserva?')) { r.status = 'cancelada'; salva(); fecha(); abre('reservas'); } }));
      ac.appendChild(btn('Fechar', 'btn-vazado', fecha));
      box.appendChild(ac); c.appendChild(box);
    });
  }
  function novaReserva(u, h) {
    dialogo(function (c) {
      var f = el('form'); f.noValidate = true;
      f.appendChild(el('h3', null, 'Reservar ' + h + ' · ' + curto(diaR)));
      f.appendChild(el('p', 'nota', u.nome));
      var cps = el('div', 'campos');
      var ln = el('label', 'cheio', 'Nome'), n = el('input'); ln.appendChild(n); cps.appendChild(ln);
      var lt = el('label', 'cheio', 'WhatsApp'), t = el('input'); t.type = 'tel'; lt.appendChild(t); cps.appendChild(lt);
      f.appendChild(cps);
      var ac = el('div', 'linha-acoes'); var ok = el('button', 'btn btn-pq', 'Salvar confirmada'); ok.type = 'submit'; ac.appendChild(ok);
      ac.appendChild(btn('Cancelar', 'btn-vazado', fecha)); f.appendChild(ac);
      f.addEventListener('submit', function (ev) {
        ev.preventDefault(); if (!n.value.trim()) { n.focus(); return; }
        db.reservas.push({ id: DB.uid('r'), unidade: u.id, dia: diaR, hora: h, duracao: 60, nome: n.value.trim(), telefone: t.value.replace(/\D/g, ''), status: 'confirmada', origem: 'painel', criado: DB.hoje() });
        salva(); fecha(); abre('reservas');
      });
      c.appendChild(f);
    });
  }

  /* ================= AJUSTES ================= */
  function ajustes(m) {
    titulo(m, 'Ajustes', 'Modo demonstração: tudo fica neste navegador.');
    var c = el('div', 'cartao'); c.style.maxWidth = '640px';
    c.appendChild(el('h3', null, 'Recomeçar a demonstração'));
    c.appendChild(el('p', null, 'Apaga o que foi feito aqui e no site (inscrições, chaves, reservas, avisos) e volta aos dados de exemplo.'));
    c.appendChild(btn('Recomeçar', 'btn-saibro', function () { if (confirm('Voltar aos dados de exemplo?')) { db = DB.reset(); abre('geral'); } }));
    m.appendChild(c);
    var c2 = el('div', 'cartao'); c2.style.cssText = 'max-width:640px;margin-top:20px';
    c2.appendChild(el('h3', null, 'No site real'));
    c2.appendChild(el('p', null, 'Login de cada pessoa da equipe (Supabase Auth), alunos importados do sistema atual da área do atleta, e cada aluno vendo só os próprios dados.'));
    m.appendChild(c2);
  }

  if (sessao()) entra();
})();
