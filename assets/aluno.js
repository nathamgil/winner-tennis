/* =====================================================================
   Winner Tennis — área do aluno (aluno.html)
   Login da DEMONSTRAÇÃO (usuário/senha em config.js, mostrados na tela).
   Mostra turma, frequência, nível e evolução por fundamento, próximas
   competições (com o próximo jogo tirado da chave) e avisos da turma.
   No modo real: Supabase Auth + RLS (o aluno só lê o que é dele).
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.WT, DB = window.WTDB, CH = window.WTChave;
  var K_SESSAO = (CFG.prefixo || 'wt_') + 'sessao_aluno';
  var SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var SEM_L = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function dm(s) { var p = s.split('-'); return p[2] + '/' + p[1]; }
  function sessao(v) {
    try { if (v === undefined) return sessionStorage.getItem(K_SESSAO); if (v === null) sessionStorage.removeItem(K_SESSAO); else sessionStorage.setItem(K_SESSAO, v); } catch (e) { return null; }
  }

  var vLogin = $('#v-login'), vPainel = $('#v-painel');

  /* ---------------- login ---------------- */
  var cred = $('#credenciais');
  CFG.loginsDemo.alunos.forEach(function (l) {
    var d = el('div');
    d.appendChild(el('b', null, l.quem)); d.appendChild(el('br'));
    d.appendChild(document.createTextNode('Usuário: ' + l.usuario + ' · Senha: ' + l.senha));
    d.appendChild(el('br'));
    var b = el('button', 'btn btn-pq btn-vazado', 'Preencher'); b.type = 'button';
    b.addEventListener('click', function () { $('#l-usuario').value = l.usuario; $('#l-senha').value = l.senha; $('#l-usuario').focus(); });
    d.appendChild(b); cred.appendChild(d);
  });
  $('#form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var u = $('#l-usuario').value.trim().toLowerCase(), s = $('#l-senha').value;
    var ok = CFG.loginsDemo.alunos.filter(function (l) { return l.usuario === u && l.senha === s; })[0];
    if (!ok) { $('#l-msg').className = 'erro-msg'; $('#l-msg').textContent = 'Usuário ou senha não conferem. Use um dos logins de demonstração abaixo.'; return; }
    sessao(u); mostra();
  });
  $('#sair').addEventListener('click', function () { sessao(null); mostra(); });

  function mostra() {
    var u = sessao(), db = DB.le();
    var aluno = u ? db.alunos.filter(function (a) { return a.usuario === u; })[0] : null;
    vLogin.hidden = !!aluno; vPainel.hidden = !aluno;
    if (aluno) painel(db, aluno);
    window.scrollTo(0, 0);
  }

  /* ---------------- painel do aluno ---------------- */
  function painel(db, a) {
    var t = db.turmas.filter(function (x) { return x.id === a.turma; })[0];
    var prog = CFG.programaPor(t.programa), uni = CFG.unidadePor(t.unidade);
    $('#a-ola').textContent = a.responsavel && a.idade < 18 ? 'Olá, ' + a.responsavel.replace(/\s*\(exemplo\)/, '').split(' ')[0] : 'Olá, ' + a.nome.split(' ')[0];
    $('#a-quem').textContent = a.nome + ' · ' + a.idade + ' anos · ' + t.nome + ' · aluno(a) desde ' + dm(a.desde) + '/' + a.desde.slice(0, 4);

    // turma
    var cxT = $('#a-turma'); cxT.innerHTML = '';
    cxT.appendChild(el('h3', null, 'Minha turma'));
    cxT.appendChild(el('div', 'rotulo', prog.nome));
    var nome = el('p', null, t.nome); nome.style.fontSize = '22px'; nome.style.fontWeight = '700'; nome.style.margin = '6px 0 12px'; cxT.appendChild(nome);
    var ul = el('ul', 'lista-simples');
    [['Dias', t.dias.map(function (d) { return SEM[d]; }).join(' e ') + ' · ' + t.hora], ['Unidade', uni.nome], ['Professor(a)', 'a confirmar'],
      ['Próxima aula', proximaAula(t)]].forEach(function (x) { var li = el('li'); li.appendChild(el('small', null, x[0])); li.appendChild(document.createTextNode(x[1])); ul.appendChild(li); });
    cxT.appendChild(ul);

    // frequência
    var cxF = $('#a-freq'); cxF.innerHTML = '';
    var pres = a.freq.filter(function (f) { return f.presente; }).length, tot = a.freq.length;
    cxF.appendChild(el('h3', null, 'Frequência'));
    cxF.appendChild(el('div', 'grande', tot ? Math.round(pres / tot * 100) + '%' : '—'));
    cxF.appendChild(el('p', null, pres + ' de ' + tot + ' aulas nas últimas 8 semanas'));
    var bar = el('div', 'barras-freq'); bar.setAttribute('aria-hidden', 'true');
    a.freq.forEach(function (f) { var i = el('i', f.presente ? '' : 'f'); i.style.height = '100%'; i.title = dm(f.dia) + (f.presente ? ' presente' : ' falta'); bar.appendChild(i); });
    cxF.appendChild(bar);
    var faltas = a.freq.filter(function (f) { return !f.presente; }).slice(-3).map(function (f) { return dm(f.dia); });
    cxF.appendChild(el('p', 'nota', faltas.length ? 'Últimas faltas: ' + faltas.join(', ') : 'Nenhuma falta no período.'));

    // nível
    var cxN = $('#a-nivel'); cxN.innerHTML = '';
    cxN.appendChild(el('h3', null, 'Nível'));
    cxN.appendChild(el('div', 'grande', a.nivel));
    var esc = ['Iniciação', 'Básico', 'Intermediário', 'Avançado', 'Competição'], k = esc.indexOf(a.nivel);
    var tr = el('div', 'barras-freq'); tr.style.height = '18px';
    esc.forEach(function (n, i) { var x = el('i', i <= k ? '' : 'f'); x.style.height = '100%'; x.title = n; tr.appendChild(x); });
    cxN.appendChild(tr);
    cxN.appendChild(el('p', 'nota', k < esc.length - 1 ? 'Próximo nível: ' + esc[k + 1] + '. Escala de exemplo: a Winner define a sua.' : 'Nível máximo da escala.'));

    // evolução
    var cxE = $('#a-evolucao'); cxE.innerHTML = '';
    cxE.appendChild(el('h3', null, 'Evolução por fundamento'));
    cxE.appendChild(el('p', 'nota', 'Nota de 1 a 5 dada pelo professor. Em amarelo, o que subiu desde a última avaliação.'));
    Object.keys(a.habilidades).forEach(function (h) {
      var v = a.habilidades[h], li = el('div', 'hab');
      li.appendChild(el('span', null, h));
      var tri = el('div', 'trilho'); tri.setAttribute('aria-hidden', 'true');
      for (var i = 1; i <= 5; i++) tri.appendChild(el('i', i <= v.antes ? 'on' : i <= v.atual ? 'novo' : ''));
      li.appendChild(tri);
      var n = el('b', null, v.atual + '/5'); li.appendChild(n);
      li.setAttribute('aria-label', h + ': ' + v.atual + ' de 5' + (v.atual > v.antes ? ', subiu de ' + v.antes : ''));
      cxE.appendChild(li);
    });
    if (a.avaliacao) { var q = el('blockquote', null, a.avaliacao); q.style.cssText = 'margin:20px 0 0;padding-left:16px;border-left:4px solid var(--saibro);font-weight:600'; cxE.appendChild(q); }

    // competições
    var cxC = $('#a-comp'); cxC.innerHTML = '';
    cxC.appendChild(el('h3', null, 'Próximas competições'));
    var minhas = db.inscricoes.filter(function (i) {
      var tt = CFG.torneioPor(i.torneio), et = tt && tt.etapas.filter(function (e) { return e.n === i.etapa; })[0];
      return i.nome === a.nome && et && et.status !== 'encerrada' && i.status !== 'cancelada';
    });
    if (!minhas.length) cxC.appendChild(el('p', null, 'Nenhuma inscrição em aberto.'));
    var lc = el('ul', 'lista-simples');
    minhas.forEach(function (i) {
      var tt = CFG.torneioPor(i.torneio), et = tt.etapas.filter(function (e) { return e.n === i.etapa; })[0];
      var li = el('li'); li.appendChild(el('b', null, tt.nome + ' · ' + i.etapa + 'ª etapa · ' + i.categoria));
      li.appendChild(el('small', null, et.datas + ' · ' + CFG.unidadePor(tt.local).nome + ' · ' + (i.status === 'confirmada' ? 'inscrição confirmada' : 'aguardando pagamento')));
      var ch = db.chaves[DB.chaveId(i.torneio, i.etapa, i.categoria)];
      var rk = DB.rankingOrdenado(db, i.torneio, i.categoria), pos = rk.map(function (x) { return x.nome; }).indexOf(a.nome);
      var info = [];
      if (pos >= 0) info.push(pos + 1 + 'º no ranking da categoria');
      if (ch) info.push(proximoJogo(ch, a.nome)); else info.push('chave ainda não sorteada');
      li.appendChild(el('p', null, info.join(' · '))).style.margin = '6px 0 0';
      var ver = el('a', null, 'Ver chave'); ver.href = 'torneios.html?t=' + i.torneio + '#chaves'; li.appendChild(ver);
      if (ch) {
        var rol = el('div', 'chave-rolar'); rol.style.marginTop = '12px';
        rol.appendChild(CH.desenha(ch, { destaque: a.nome })); li.appendChild(rol);
      }
      lc.appendChild(li);
    });
    cxC.appendChild(lc);
    var mais = el('a', 'btn btn-pq', 'Inscrever em outro torneio'); mais.href = 'torneios.html'; mais.style.marginTop = '16px'; cxC.appendChild(mais);

    // avisos
    var cxA = $('#a-avisos'); cxA.innerHTML = '';
    cxA.appendChild(el('h3', null, 'Avisos'));
    var av = db.avisos.filter(function (v) { return v.para === 'todos' || v.para === a.turma; })
      .sort(function (x, y) { return (y.fixo ? 1 : 0) - (x.fixo ? 1 : 0) || (x.data < y.data ? 1 : -1); });
    var la = el('ul', 'lista-simples');
    if (!av.length) la.appendChild(el('li', null, 'Nenhum aviso.'));
    av.forEach(function (v) {
      var li = el('li'); li.appendChild(el('b', null, (v.fixo ? 'Fixado · ' : '') + v.titulo));
      li.appendChild(el('small', null, dm(v.data) + ' · ' + (v.para === 'todos' ? 'para todos' : 'para a sua turma')));
      var p = el('p', null, v.texto); p.style.margin = '6px 0 0'; li.appendChild(p);
      la.appendChild(li);
    });
    cxA.appendChild(la);
  }

  function proximaAula(t) {
    var d = new Date(), agora = d.getHours() * 60 + d.getMinutes(), h = t.hora.split(':'), min = +h[0] * 60 + +h[1];
    for (var i = 0; i < 8; i++) {
      var x = new Date(); x.setDate(x.getDate() + i);
      if (t.dias.indexOf(x.getDay()) >= 0 && (i > 0 || min > agora)) return (i === 0 ? 'hoje' : i === 1 ? 'amanhã' : SEM_L[x.getDay()]) + ', ' + t.hora;
    }
    return '—';
  }
  function proximoJogo(ch, nome) {
    for (var r = 0; r < ch.rodadas.length; r++) {
      for (var m = 0; m < ch.rodadas[r].length; m++) {
        var j = ch.rodadas[r][m];
        if (j.a !== nome && j.b !== nome) continue;
        if (!j.v) { var adv = j.a === nome ? j.b : j.a; return CH.fase(ch, r) + ': ' + (adv ? 'contra ' + adv : 'adversário a definir'); }
        if (j[j.v] !== nome) { var f = CH.fase(ch, r).toLowerCase(); return 'eliminado(a) ' + (/s$/.test(f) ? 'nas ' : 'na ') + f + (j.placar ? ' (' + j.placar + ')' : ''); }
      }
    }
    return CH.campeao(ch) === nome ? 'campeão(ã)!' : 'na chave';
  }

  mostra();
})();
