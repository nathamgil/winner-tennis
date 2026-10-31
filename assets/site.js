/* =====================================================================
   Winner Tennis — site público: menu, aula experimental, aluguel de
   quadra, equipe, contato. Formulários gravam no banco da demo
   (dados.js) e abrem o WhatsApp da Winner com a mensagem pronta.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.WT, DB = window.WTDB;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function soDig(t) { return String(t || '').replace(/\D/g, ''); }
  function dataBr(s) { var p = s.split('-'); return p[2] + '/' + p[1]; }
  var SEM = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  document.documentElement.classList.add('js');

  /* menu do celular */
  var mb = $('.menu-btn'), menu = $('.menu');
  if (mb && menu) mb.addEventListener('click', function () {
    var ab = menu.classList.toggle('aberto'); mb.setAttribute('aria-expanded', ab ? 'true' : 'false');
  });
  $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('aberto'); }); });

  /* entrada suave das seções */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { threshold: .12 });
    $$('.surge').forEach(function (s) { io.observe(s); });
  } else $$('.surge').forEach(function (s) { s.classList.add('visto'); });

  /* listas que vêm do config */
  $$('[data-programas-opcoes]').forEach(function (sel) {
    CFG.programas.forEach(function (p) { var o = el('option', null, p.nome + ' · ' + p.faixa); o.value = p.id; sel.appendChild(o); });
    var q = new URLSearchParams(location.search).get('programa'); if (q) sel.value = q;
  });
  $$('[data-unidades-opcoes]').forEach(function (sel) {
    CFG.unidades.forEach(function (u) { var o = el('option', null, u.nome); o.value = u.id; sel.appendChild(o); });
  });
  var eq = $('#equipe-lista');
  if (eq) CFG.equipe.forEach(function (p) {
    var d = el('div'); d.appendChild(el('span', 'rotulo', p.papel));
    var b = el('b', /a confirmar/.test(p.nome) ? 'pend' : '', p.nome); d.appendChild(b); eq.appendChild(d);
  });
  var pl = $('#programas-lista');
  if (pl) CFG.programas.forEach(function (p) {
    var a = el('article', 'programa'); a.id = p.id;
    var im = el('img'); im.src = p.foto; im.alt = p.nome + ' na Winner Tennis'; im.loading = 'lazy'; a.appendChild(im);
    var d = el('div');
    d.appendChild(el('span', 'rotulo', p.publico));
    var h = el('h2', null, p.nome); h.style.marginTop = '10px'; d.appendChild(h);
    d.appendChild(el('span', 'faixa', p.faixa));
    d.appendChild(el('p', 'lead', p.texto));
    var ul = el('ul'); p.pontos.forEach(function (x) { ul.appendChild(el('li', null, x)); }); d.appendChild(ul);
    if (p.frase) d.appendChild(el('blockquote', null, '“' + p.frase + '”'));
    var ac = el('div'); ac.style.display = 'flex'; ac.style.flexWrap = 'wrap'; ac.style.gap = '12px';
    var b1 = el('a', 'btn btn-saibro', 'Aula experimental de ' + p.nome); b1.href = 'index.html?programa=' + p.id + '#experimental';
    var b2 = el('a', 'btn btn-vazado', 'Perguntar valores'); b2.href = CFG.zap('Olá, Winner! Quero saber valores e horários do ' + p.nome + '.'); b2.target = '_blank'; b2.rel = 'noopener';
    ac.appendChild(b1); ac.appendChild(b2); d.appendChild(ac);
    d.appendChild(el('p', 'nota', 'Valores e horários: a confirmar com a Winner.'));
    a.appendChild(d); pl.appendChild(a);
  });
  var un = $('#unidades');
  if (un) CFG.unidades.forEach(function (u) {
    var d = el('div', 'unid'); d.appendChild(el('h3', null, u.nome)); d.appendChild(el('p', null, u.detalhe));
    d.appendChild(el('p', null, u.endereco));
    var a = el('a', null, 'Abrir no mapa'); a.href = u.mapa; a.target = '_blank'; a.rel = 'noopener'; d.appendChild(a);
    un.appendChild(d);
  });
  var st = $('#setores');
  if (st) CFG.setores.forEach(function (s) {
    var li = el('li'); li.appendChild(el('span', null, s.nome));
    var a = el('a', null, 'WhatsApp ' + CFG.telefone); a.href = CFG.zap('Olá, Winner! Falo sobre: ' + s.nome + '.', s.tel); a.target = '_blank'; a.rel = 'noopener';
    li.appendChild(a); st.appendChild(li);
  });

  /* aula experimental */
  var fe = $('#form-experimental');
  if (fe) fe.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = new FormData(fe), out = $('#exp-msg');
    var nome = String(f.get('nome') || '').trim(), tel = soDig(f.get('telefone'));
    if (!nome || tel.length < 10) { out.className = 'erro-msg'; out.textContent = 'Preencha o nome e um WhatsApp com DDD.'; return; }
    var prog = CFG.programaPor(f.get('programa')), uni = CFG.unidadePor(f.get('unidade'));
    var quem = f.get('quem') === 'filho' ? 'meu filho(a)' + (f.get('idade') ? ', ' + f.get('idade') + ' anos' : '') : 'mim';
    var db = DB.le();
    db.experimentais = db.experimentais || [];
    db.experimentais.unshift({ id: DB.uid('e'), nome: nome, telefone: tel, programa: prog.id, unidade: uni.id, periodo: f.get('periodo'),
      para: quem, status: 'nova', criado: DB.hoje(), origem: 'site' });
    DB.grava(db);
    var msg = 'Olá, Winner! Quero agendar uma aula experimental.\n' +
      'Nome: ' + nome + '\nPara: ' + quem + '\nPrograma: ' + prog.nome + ' (' + prog.faixa + ')\n' +
      'Unidade: ' + uni.nome + '\nMelhor período: ' + f.get('periodo');
    out.className = 'ok-msg';
    out.textContent = 'Pedido registrado. Abrimos o WhatsApp da Winner com a mensagem pronta: é só enviar.';
    window.open(CFG.zap(msg), '_blank', 'noopener');
    fe.reset();
  });
  var quemR = $$('input[name="quem"]'), idade = $('#exp-idade-campo');
  function trocaQuem() { var f = quemR.filter(function (r) { return r.checked; })[0]; if (idade) idade.hidden = !f || f.value !== 'filho'; }
  quemR.forEach(function (r) { r.addEventListener('change', trocaQuem); }); trocaQuem();

  /* aluguel de quadra */
  var fq = $('#form-quadra');
  if (fq) {
    var dia = $('#q-dia'), hs = $('#q-horarios'), uniSel = $('#q-unidade');
    dia.min = DB.hoje(); dia.value = DB.hoje();
    function desenhaHorarios() {
      var db = DB.le(), d = dia.value, u = uniSel.value;
      var ocupados = db.reservas.filter(function (r) { return r.dia === d && r.unidade === u && r.status !== 'cancelada'; }).map(function (r) { return r.hora; });
      var agora = new Date(), hojeIso = DB.hoje();
      hs.innerHTML = '';
      CFG.quadra.horarios.forEach(function (h) {
        var lb = el('label'), inp = el('input'); inp.type = 'radio'; inp.name = 'hora'; inp.value = h;
        var passou = d === hojeIso && +h.slice(0, 2) <= agora.getHours();
        if (ocupados.indexOf(h) >= 0 || passou) inp.disabled = true;
        lb.appendChild(inp); lb.appendChild(el('span', null, h));
        lb.title = inp.disabled ? (passou ? 'Horário já passou' : 'Ocupado') : 'Livre';
        hs.appendChild(lb);
      });
    }
    dia.addEventListener('change', desenhaHorarios); uniSel.addEventListener('change', desenhaHorarios);
    desenhaHorarios();
    fq.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(fq), out = $('#q-msg');
      var nome = String(f.get('nome') || '').trim(), tel = soDig(f.get('telefone')), h = f.get('hora');
      if (!h) { out.className = 'erro-msg'; out.textContent = 'Escolha um horário livre.'; return; }
      if (!nome || tel.length < 10) { out.className = 'erro-msg'; out.textContent = 'Preencha o nome e um WhatsApp com DDD.'; return; }
      var db = DB.le(), uni = CFG.unidadePor(uniSel.value);
      db.reservas.push({ id: DB.uid('r'), unidade: uni.id, dia: dia.value, hora: h, duracao: 60, nome: nome, telefone: tel,
        status: 'pendente', origem: 'site', criado: DB.hoje() });
      DB.grava(db);
      var dd = DB.deIso(dia.value);
      var msg = 'Olá, Winner! Quero reservar uma quadra.\nUnidade: ' + uni.nome + '\nDia: ' + SEM[dd.getDay()] + ', ' + dataBr(dia.value) +
        '\nHorário: ' + h + ' (1 hora)\nNome: ' + nome;
      out.className = 'ok-msg';
      out.textContent = 'Horário segurado como "aguardando confirmação". A recepção confirma pelo WhatsApp.';
      window.open(CFG.zap(msg), '_blank', 'noopener');
      desenhaHorarios();
    });
  }
})();
