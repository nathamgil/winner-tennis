/* =====================================================================
   Winner Tennis — hub de torneios (torneios.html)
   Abas por torneio (?t=copa|open|litoral) · ficha · inscrição (grava no
   banco da demo e abre o WhatsApp) · chaves por etapa e categoria ·
   ranking · resultados por etapa. Chaves e ranking vêm do painel.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.WT, DB = window.WTDB, CH = window.WTChave;
  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function soDig(t) { return String(t || '').replace(/\D/g, ''); }

  var qs = new URLSearchParams(location.search);
  var estado = { t: CFG.torneioPor(qs.get('t')) ? qs.get('t') : 'copa', etapa: null, cat: null };
  var db = DB.le();

  function torneio() { return CFG.torneioPor(estado.t); }
  function etapasComChave(t) {
    return t.etapas.filter(function (e) { return t.categorias.some(function (c) { return db.chaves[DB.chaveId(t.id, e.n, c)]; }); }).map(function (e) { return e.n; });
  }
  function nomeStatus(e) { return e.status === 'inscricoes' ? 'Inscrições abertas' : e.status === 'andamento' ? 'Em andamento' : 'Encerrada'; }
  function botoes(cx, itens, atual, aoEscolher, rotulo) {
    cx.innerHTML = '';
    cx.setAttribute('role', 'group'); cx.setAttribute('aria-label', rotulo);
    itens.forEach(function (it) {
      var b = el('button', null, it.nome); b.type = 'button';
      b.setAttribute('aria-pressed', String(it.id) === String(atual) ? 'true' : 'false');
      b.addEventListener('click', function () { aoEscolher(it.id); });
      cx.appendChild(b);
    });
  }

  /* ---------------- abas ---------------- */
  var abas = $('#abas');
  CFG.torneios.forEach(function (t) {
    var b = el('button', null, t.nome); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.t = t.id;
    b.addEventListener('click', function () { escolhe(t.id); history.replaceState(null, '', '?t=' + t.id + location.hash); });
    abas.appendChild(b);
  });

  function escolhe(id) {
    estado.t = id; estado.cat = torneio().categorias[0];
    var com = etapasComChave(torneio());
    var andamento = torneio().etapas.filter(function (e) { return e.status !== 'encerrada' && com.indexOf(e.n) >= 0; })[0];
    estado.etapa = andamento ? andamento.n : (com.length ? com[com.length - 1] : torneio().etapaAtual);
    var comChave = torneio().categorias.filter(function (c) { return db.chaves[DB.chaveId(id, estado.etapa, c)]; })[0];
    if (comChave) estado.cat = comChave;
    Array.prototype.forEach.call(abas.children, function (b) { b.setAttribute('aria-selected', b.dataset.t === id ? 'true' : 'false'); });
    ficha(); inscricao(); chaves(); ranking(); resultados();
  }

  /* ---------------- ficha ---------------- */
  function ficha() {
    var t = torneio(), cx = $('#ficha'), uni = CFG.unidadePor(t.local);
    var atual = t.etapas.filter(function (e) { return e.n === t.etapaAtual; })[0];
    cx.innerHTML = '';
    var a = el('div');
    a.appendChild(el('span', 'rotulo', t.sub + ' · ' + t.publico));
    var h = el('h2', null, t.nome); h.style.margin = '10px 0 16px'; a.appendChild(h);
    a.appendChild(el('p', 'lead', t.texto));
    var selos = el('div', 'selos');
    t.etapas.forEach(function (e) {
      selos.appendChild(el('span', 'selo' + (e.status === 'inscricoes' ? ' selo-aberto' : e.status === 'andamento' ? ' selo-andamento' : ''), e.n + 'ª etapa · ' + nomeStatus(e)));
    });
    a.appendChild(selos);
    var dl = el('dl');
    [['Etapa atual', atual.n + 'ª etapa · ' + nomeStatus(atual)], ['Datas', atual.datas], ['Prazo', atual.prazo || '—'],
      ['Local', uni.nome], ['Categorias', t.categorias.join(', ')], ['Inscrição', t.valor]].forEach(function (x) {
      dl.appendChild(el('dt', null, x[0])); dl.appendChild(el('dd', null, x[1]));
    });
    var dir = el('div'); dir.appendChild(dl);
    if (t.foto) {
      var im = el('img'); im.src = t.foto; im.alt = t.fotoAlt || ''; im.loading = 'lazy';
      im.style.cssText = 'margin-top:24px;max-height:420px;width:auto;max-width:100%;border-radius:4px';
      dir.appendChild(im);
    }
    cx.appendChild(a); cx.appendChild(dir);
  }

  /* ---------------- inscrição ---------------- */
  function inscricao() {
    var t = torneio(), cx = $('#inscricao-corpo');
    var aberta = t.etapas.filter(function (e) { return e.status === 'inscricoes'; })[0];
    cx.innerHTML = '';
    if (!aberta) {
      var p = el('p', 'lead', 'A ' + t.etapaAtual + 'ª etapa já está em andamento e as inscrições estão encerradas. Quer ser avisado quando abrir a próxima?');
      var b = el('a', 'btn btn-saibro', 'Me avise da próxima etapa'); b.href = CFG.zap('Olá, Winner! Quero ser avisado da próxima etapa do ' + t.nome + '.'); b.target = '_blank'; b.rel = 'noopener';
      cx.appendChild(p); cx.appendChild(b); return;
    }
    var f = el('form', 'form'); f.noValidate = true;
    f.appendChild(el('h3', null, 'Inscrição · ' + aberta.n + 'ª etapa'));
    var campos = el('div', 'campos');
    function campo(rot, nome, tipo, cheio, extra) {
      var l = el('label', cheio ? 'cheio' : null, rot), i = el('input'); i.name = nome; i.type = tipo || 'text';
      Object.assign(i, extra || {}); l.appendChild(i); campos.appendChild(l); return i;
    }
    var lc = el('label', 'cheio', 'Categoria'), sel = el('select'); sel.name = 'categoria';
    t.categorias.forEach(function (c) { var o = el('option', null, c); o.value = c; sel.appendChild(o); });
    lc.appendChild(sel); campos.appendChild(lc);
    if (t.id === 'litoral') {
      var l2 = el('label', 'cheio', 'Segunda categoria (opcional)'), s2 = el('select'); s2.name = 'categoria2';
      s2.appendChild(el('option', null, 'Não, só uma')); s2.firstChild.value = '';
      t.categorias.forEach(function (c) { var o = el('option', null, c); o.value = c; s2.appendChild(o); });
      l2.appendChild(s2); campos.appendChild(l2);
    }
    campo('Nome do atleta', 'nome', 'text', true, { autocomplete: 'off' });
    if (t.id === 'copa') {
      campo('Data de nascimento', 'nascimento', 'date');
      campo('Nome do responsável', 'responsavel', 'text');
    }
    campo('WhatsApp com DDD', 'telefone', 'tel', t.id !== 'copa', { inputMode: 'tel', placeholder: '(71) 9 0000-0000' });
    f.appendChild(campos);
    var valor = el('p', 'nota', t.valor); f.appendChild(valor);
    var bt = el('button', 'btn btn-saibro', 'Confirmar inscrição'); bt.type = 'submit'; f.appendChild(bt);
    var out = el('div'); out.setAttribute('role', 'status'); out.setAttribute('aria-live', 'polite'); f.appendChild(out);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(f), nome = String(d.get('nome') || '').trim(), tel = soDig(d.get('telefone'));
      if (!nome || tel.length < 10) { out.className = 'erro-msg'; out.textContent = 'Preencha o nome do atleta e um WhatsApp com DDD.'; return; }
      if (t.id === 'copa' && !String(d.get('responsavel') || '').trim()) { out.className = 'erro-msg'; out.textContent = 'Na Copa Futuro o responsável precisa estar na inscrição.'; return; }
      var cats = [d.get('categoria')]; if (d.get('categoria2') && d.get('categoria2') !== d.get('categoria')) cats.push(d.get('categoria2'));
      db = DB.le();
      var codigos = cats.map(function (c) {
        var cod = 'W' + Math.random().toString(36).slice(2, 7).toUpperCase();
        db.inscricoes.push({ id: DB.uid('i'), codigo: cod, torneio: t.id, etapa: aberta.n, categoria: c, nome: nome, nascimento: d.get('nascimento') || '',
          responsavel: d.get('responsavel') || '', telefone: tel, status: 'pendente', origem: 'site', criado: DB.hoje() });
        return cod;
      });
      DB.grava(db);
      var msg = 'Olá, Winner! Fiz a inscrição no ' + t.nome + ' (' + aberta.n + 'ª etapa) pelo site.\nAtleta: ' + nome +
        '\nCategoria: ' + cats.join(' e ') + (d.get('responsavel') ? '\nResponsável: ' + d.get('responsavel') : '') + '\nCódigo: ' + codigos.join(', ');
      out.className = 'ok-msg';
      out.textContent = 'Inscrição recebida (código ' + codigos.join(', ') + '). Status: aguardando pagamento. Abrimos o WhatsApp para você enviar o comprovante.';
      window.open(CFG.zap(msg), '_blank', 'noopener');
      f.reset(); chaves();
    });
    cx.appendChild(f);
  }

  /* ---------------- chaves ---------------- */
  function chaves() {
    var t = torneio(), cx = $('#chaves-corpo');
    var etapas = t.etapas.filter(function (e) { return e.status !== 'encerrada' || etapasComChave(t).indexOf(e.n) >= 0; });
    botoes($('#chaves-etapas'), etapas.map(function (e) { return { id: e.n, nome: e.n + 'ª etapa' }; }), estado.etapa, function (n) { estado.etapa = n; chaves(); }, 'Etapa');
    botoes($('#chaves-cats'), t.categorias.map(function (c) { return { id: c, nome: c }; }), estado.cat, function (c) { estado.cat = c; chaves(); ranking(); }, 'Categoria');
    cx.innerHTML = '';
    var ch = db.chaves[DB.chaveId(t.id, estado.etapa, estado.cat)];
    if (ch) {
      var rol = el('div', 'chave-rolar'); rol.appendChild(CH.desenha(ch)); cx.appendChild(rol);
      var c = CH.campeao(ch);
      cx.appendChild(el('p', 'nota', c ? 'Campeão(ã): ' + c + '.' : 'Chave em andamento: os placares entram pelo painel da Winner e aparecem aqui na hora.'));
      return;
    }
    var insc = db.inscricoes.filter(function (i) { return i.torneio === t.id && i.etapa === estado.etapa && i.categoria === estado.cat && i.status !== 'cancelada'; });
    cx.appendChild(el('p', 'lead', 'Chave ainda não sorteada para ' + estado.cat + ' na ' + estado.etapa + 'ª etapa.'));
    if (insc.length) {
      var ul = el('ul', 'lista-simples');
      insc.forEach(function (i) { var li = el('li', null, i.nome); li.appendChild(el('small', null, i.status === 'confirmada' ? 'Inscrição confirmada' : 'Aguardando pagamento')); ul.appendChild(li); });
      cx.appendChild(el('p', null, insc.length + ' inscrito(s) até agora:')); cx.appendChild(ul);
    }
  }

  /* ---------------- ranking ---------------- */
  function ranking() {
    var t = torneio(), cx = $('#ranking-corpo');
    $('#ranking-cat').textContent = estado.cat;
    cx.innerHTML = '';
    var lista = DB.rankingOrdenado(db, t.id, estado.cat);
    if (!lista.length) { cx.appendChild(el('p', 'lead', 'O ranking começa a contar a partir da primeira chave fechada desta categoria.')); return; }
    var etapas = t.etapas.map(function (e) { return e.n; });
    var tab = el('table', 'tab'), th = el('tr');
    ['#', 'Atleta'].concat(etapas.map(function (n) { return n + 'ª'; })).concat(['Total']).forEach(function (x, i) { var c = el('th', i > 1 ? 'n' : null, x); th.appendChild(c); });
    var thead = el('thead'); thead.appendChild(th); tab.appendChild(thead);
    var tb = el('tbody'), pos = 0, ult = null;
    lista.forEach(function (x, i) {
      var tot = DB.total(x); if (tot !== ult) pos = i + 1; ult = tot;
      var tr = el('tr');
      tr.appendChild(el('td', 'pos', pos + 'º')); tr.appendChild(el('td', null, x.nome));
      etapas.forEach(function (n) { tr.appendChild(el('td', 'n', x.etapas[n] != null ? String(x.etapas[n]) : '—')); });
      var td = el('td', 'n'); td.appendChild(el('b', null, String(tot))); tr.appendChild(td);
      tb.appendChild(tr);
    });
    tab.appendChild(tb);
    var rol = el('div', 'tabela-rolar'); rol.appendChild(tab); cx.appendChild(rol);
  }

  /* ---------------- resultados por etapa ---------------- */
  function resultados() {
    var t = torneio(), cx = $('#resultados-corpo');
    cx.innerHTML = '';
    var encerradas = t.etapas.filter(function (e) { return e.status === 'encerrada'; }).slice().reverse();
    if (!encerradas.length) { cx.appendChild(el('p', 'lead', 'Primeira etapa deste circuito no site: os resultados aparecem aqui quando as chaves fecharem.')); return; }
    encerradas.forEach(function (e) {
      var bl = el('div'); bl.style.marginBottom = '32px';
      var h = el('h3', null, e.n + 'ª etapa'); h.style.fontSize = '26px'; bl.appendChild(h);
      bl.appendChild(el('p', 'nota', 'Datas: ' + e.datas));
      var linhas = t.categorias.map(function (c) { return [c, db.chaves[DB.chaveId(t.id, e.n, c)]]; }).filter(function (x) { return x[1]; });
      if (!linhas.length) { bl.appendChild(el('p', null, 'Resultados desta etapa: importar do sistema atual (a confirmar).')); cx.appendChild(bl); return; }
      var tab = el('table', 'tab'), tr = el('tr');
      ['Categoria', 'Campeão(ã)', 'Vice', 'Final'].forEach(function (x) { tr.appendChild(el('th', null, x)); });
      var thead = el('thead'); thead.appendChild(tr); tab.appendChild(thead);
      var tb = el('tbody');
      linhas.forEach(function (x) {
        var f = x[1].rodadas[x[1].rodadas.length - 1][0], r = el('tr');
        r.appendChild(el('td', null, x[0]));
        var c1 = el('td'); c1.appendChild(el('b', null, f.v ? f[f.v] : '—')); r.appendChild(c1);
        r.appendChild(el('td', null, f.v ? f[f.v === 'a' ? 'b' : 'a'] : '—'));
        r.appendChild(el('td', null, f.placar || '—'));
        tb.appendChild(r);
      });
      tab.appendChild(tb);
      var rol = el('div', 'tabela-rolar'); rol.appendChild(tab); bl.appendChild(rol);
      cx.appendChild(bl);
    });
  }

  escolhe(estado.t);
  // volta para a âncora depois de montar (o conteúdo muda a altura da página)
  if (location.hash) { var alvo = document.getElementById(location.hash.slice(1)); if (alvo) setTimeout(function () { alvo.scrollIntoView(); }, 50); }
})();
