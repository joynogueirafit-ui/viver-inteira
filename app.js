(function(){
  var C = window.VI;
  var WD = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var WD1 = ['D','S','T','Q','Q','S','S'];
  var MES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var CATS = ['Mercado','Casa e contas','Filhos','Saúde','Lazer','Outros'];
  var MOODS = ['😔','😐','🙂','😊','🥰'];
  var LIT_URL = 'https://liturgia.cancaonova.com/pb/';

  // ---------- utilidades ----------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function pad(n){ return (n<10?'0':'')+n; }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parse(s){ var p = s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function today(){ var t = new Date(); t.setHours(0,0,0,0); return t; }
  function diffDays(a, b){ return Math.round((b - a) / 864e5); }
  function brl(v){ return 'R$ ' + (Math.round((+v||0)*100)/100).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}); }
  function num(v){ v = String(v||'').replace(/[^\d,.-]/g,''); if (v.indexOf(',') >= 0) v = v.replace(/\./g,'').replace(',', '.'); return parseFloat(v) || 0; }
  function uid(){ return Math.random().toString(36).slice(2, 9); }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }

  // ---------- tempo litúrgico ----------
  function pascoa(y){
    var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
      h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
      mo=Math.floor((h+l-7*m+114)/31), da=((h+l-7*m+114)%31)+1;
    return new Date(y, mo-1, da);
  }
  function advento(y){ var n = new Date(y, 11, 25); var dow = n.getDay() || 7; return addDays(n, -dow - 21); }
  function batismo(y){ var e = new Date(y, 0, 6); return addDays(e, 7 - e.getDay()); }
  function tempoLiturgico(d){
    var y = d.getFullYear(), p = pascoa(y), cinzas = addDays(p, -46), pent = addDays(p, 49);
    if (d >= advento(y) && d < new Date(y, 11, 25)) return 'Advento';
    if (d >= new Date(y, 11, 25) || d <= batismo(y)) return 'Tempo do Natal';
    if (d >= cinzas && d < addDays(p, -3)) return 'Quaresma';
    if (d >= addDays(p, -3) && d < p) return 'Tríduo Pascal';
    if (d >= p && d <= pent) return 'Tempo Pascal';
    return 'Tempo Comum';
  }

  // ---------- estado ----------
  function blank(){
    return {v:1, nome:'', tom:'', onboard:false, itens:[], semDeus:clone(C.semanaDeus), aguaMeta:8,
      dias:{}, semanas:{}, intencoes:[], treinos:clone(C.treinos), pesos:[],
      casa:{limpeza:clone(C.limpeza), familia:[], cardapio:{}, compras:[], datas:[]},
      fin:{meses:{}, orc:{'Mercado':1400,'Casa e contas':2200,'Lazer':400}, metas:[]},
      desafios:{}, metas:{}};
  }
  var st = blank(), user = null, timer = null;
  var T = today(), TK = iso(T);
  var view = {tela:'hoje', casaTab:'casa', ob:1, desafio:null};

  function dia(k){ k = k || TK; return st.dias[k] = st.dias[k] || {f:{}}; }
  function semKey(d){ return iso(addDays(d || T, -(d || T).getDay())); }
  function sem(){ var k = semKey(); return st.semanas[k] = st.semanas[k] || {f:{}}; }
  function mesKey(){ return T.getFullYear() + '-' + pad(T.getMonth()+1); }
  function mes(){ var k = mesKey(); return st.fin.meses[k] = st.fin.meses[k] || {entradas:[], gastos:[], contas:[]}; }
  function itensDoDia(d){ var w = (d || T).getDay(); return st.itens.filter(function(i){ return i.dias.indexOf(w) >= 0; }); }

  // ---------- salvar ----------
  var cfg = window.VI_CONFIG || {};
  var demo = /[?&]demo\b/.test(location.search) || !cfg.url || cfg.url.indexOf('COLE_AQUI') >= 0 || !window.supabase;
  var sb = demo ? null : window.supabase.createClient(cfg.url, cfg.anonKey);
  function key(){ return 'vi:' + (user ? user.id : 'demo'); }
  function cache(){ try { localStorage.setItem(key(), JSON.stringify(st)); } catch(e){} }
  function save(){
    cache();
    if (!sb || !user) return;
    clearTimeout(timer);
    timer = setTimeout(function(){
      sb.from('viver').upsert({user_id:user.id, dados:st, updated_at:new Date().toISOString()}).then(function(r){
        if (r.error) { clearTimeout(timer); timer = setTimeout(save, 15000); }
      });
    }, 700);
  }
  function load(){
    try { var c = localStorage.getItem(key()); if (c) st = Object.assign(blank(), JSON.parse(c)); } catch(e){}
    if (!sb) return Promise.resolve();
    return sb.from('viver').select('dados').eq('user_id', user.id).maybeSingle().then(function(r){
      if (!r.error && r.data && r.data.dados) st = Object.assign(blank(), r.data.dados);
    });
  }
  function toast(t){ var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function(){ el.hidden = true; }, 2200); }

  // ---------- pedaços de tela ----------
  function head(small, title, av){ return '<div class="hd"><div><small>'+small+'</small><h1>'+title+'</h1></div>'+(av?'<button class="av" data-a="go" data-v="ajustes" aria-label="Ajustes">'+av+'</button>':'')+'</div>'; }
  function chk(on, act, id, text, extra){
    return '<button class="chk" type="button" aria-pressed="'+(!!on)+'" data-a="'+act+'" data-id="'+esc(id)+'"><span class="bx">'+(on?'✓':'')+'</span>'+(extra&&extra.em?'<span class="em">'+extra.em+'</span>':'')+'<span class="tx">'+esc(text)+'</span>'+(extra&&extra.who?'<span class="who">'+esc(extra.who)+'</span>':'')+'</button>';
  }
  function bar(v, max){ var p = max ? Math.min(100, Math.round(v/max*100)) : 0; return '<div class="prog'+(max && v>max?' over':'')+'"><i style="width:'+p+'%"></i></div>'; }
  function streakFe(){
    var n = 0, d = T;
    var feito = function(k){ var x = st.dias[k]; if (!x) return false; if (x.terco) return true;
      return st.itens.some(function(i){ return i.area === 'Com Deus' && x.f[i.id]; }) || !!x.f.evangLido; };
    if (!feito(TK)) d = addDays(T, -1);
    while (feito(iso(d))) { n++; d = addDays(d, -1); }
    return n;
  }

  // ---------- telas ----------
  var R = {};

  R.hoje = function(){
    var d = dia(), lit = tempoLiturgico(T), fr = C.frases[(diffDays(new Date(2026,0,1), T) % C.frases.length + C.frases.length) % C.frases.length];
    var its = itensDoDia(), feitos = its.filter(function(i){ return d.f[i.id]; }).length;
    var msgs = ['Um passinho de cada vez 🤍','Que lindo! Deus vê cada esforço.','Está indo muito bem!','Dia completo! Glória a Deus 🤍'];
    var m = !feitos ? '' : feitos === its.length ? msgs[3] : msgs[Math.min(2, Math.floor(feitos/its.length*3))];
    var h = new Date().getHours(), oi = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    var drops = ''; for (var i=0;i<st.aguaMeta;i++) drops += '<button class="drop'+(i<(d.agua||0)?' on':'')+'" data-a="agua" data-v="'+(i+1)+'" aria-label="'+(i+1)+' copos"></button>';
    return head(WD[T.getDay()]+', '+T.getDate()+' de '+MES[T.getMonth()], oi+(st.nome?', <span class="cur">'+esc(st.nome)+'</span>':''), esc((st.nome||'V')[0].toUpperCase()))
      + '<div class="verse"><span class="pill">'+lit+'</span><i>“'+fr[0]+'”</i><small>'+fr[1]+'</small></div>'
      + '<section class="card"><h2>Meu dia <em>'+feitos+' de '+its.length+'</em></h2>'
      + (its.length ? its.map(function(i){ return chk(d.f[i.id], 'item', i.id, i.nome, {em:i.em}); }).join('') : '<p class="hint">Nada marcado para hoje.</p>')
      + '<p class="msg" aria-live="polite">'+m+'</p><button class="link" data-a="go" data-v="meudia">✏️ Editar meu dia</button></section>'
      + '<section class="card"><h2>Água <em>'+(d.agua||0)+' de '+st.aguaMeta+' copos</em></h2><div class="drops">'+drops+'</div></section>'
      + '<section class="card"><h2>Como estou hoje?</h2><div class="mood">'+MOODS.map(function(e,i){ return '<button data-a="humor" data-v="'+i+'" aria-pressed="'+(d.humor===i)+'" aria-label="Humor '+(i+1)+'">'+e+'</button>'; }).join('')+'</div></section>'
      + '<section class="card"><h2>Uma frase do meu dia</h2><textarea id="notaDia" data-f="nota" placeholder="Uma graça, algo que aprendi, um agradecimento…">'+esc(d.nota)+'</textarea></section>';
  };

  R.fe = function(){
    var d = dia(), s = sem(), n = streakFe(), c = d.terco || 0, mi = Math.min(4, Math.floor(c/11)), pos = c >= 55 ? 11 : c % 11;
    var beads = ''; for (var i=0;i<11;i++) beads += '<button class="bead'+(i===0?' pn':'')+(i<pos?' on':'')+'" data-a="terco" aria-label="Rezar a próxima conta"></button>';
    var mist = C.misterios[T.getDay()];
    var datas = st.intencoes.map(function(t,i){ return '<span class="tag">'+esc(t)+' <button class="x" data-a="delInt" data-v="'+i+'" aria-label="Remover">×</button></span>'; }).join('');
    return head('Minha vida com Deus', 'Vida de fé', '🙏')
      + '<section class="card"><div class="streak"><b>🔥 '+n+'</b><div><b style="font-size:14px;color:var(--fg)">'+(n===1?'dia':'dias')+' seguidos com Deus</b><p class="hint">'+(n?'Continue, você está indo bem!':'Hoje é um ótimo dia para começar.')+'</p></div></div></section>'
      + (function(){
          var ev = (window.EVANGELHOS || {})[TK], h = '<section class="card gosp"><h2>📖 Evangelho do dia <em>'+(ev ? ev.ref : pad(T.getDate())+'/'+pad(T.getMonth()+1))+'</em></h2>';
          if (ev) {
            var longo = ev.txt.length > 320, aberto = view.evAberto || !longo;
            h += '<p class="hint" style="margin:0"><b>Evangelho de Jesus Cristo segundo '+ev.livro+'</b></p>'
              + '<p class="evtxt">'+esc(aberto ? ev.txt : ev.txt.slice(0, ev.txt.lastIndexOf(' ', 300)) + '…')+'</p>'
              + (longo ? '<button class="link" data-a="evAbrir">'+(aberto ? 'Mostrar menos' : 'Ler completo')+'</button>' : '')
              + '<p class="hint" style="font-size:11px">Palavra da Salvação. · Tradução Bíblia Livre (BLIVRE)</p>';
          } else h += '<div class="tags"><a class="tag" href="'+LIT_URL+'" target="_blank" rel="noopener">Ler o Evangelho de hoje ↗</a></div>';
          return h + chk(d.f.evangLido, 'evang', 'evangLido', 'Li o Evangelho de hoje')
            + '<label class="hint" for="evRefl">✍️ O que Deus me falou hoje</label><textarea id="evRefl" data-f="evRefl" placeholder="Uma palavra, um versículo, um propósito…">'+esc(d.evRefl)+'</textarea></section>';
        })()
      + novenaCard()
      + '<section class="card"><h2>Terço de hoje <em>Mistérios '+mist+'</em></h2><div class="terco">'+beads+'</div>'
      + '<p class="hint">'+(c>=55?'Terço completo! 🌹':(mi+1)+'º mistério · '+Math.max(0,pos-1)+' de 10 Ave-Marias')+(c?' · <button class="link" data-a="tercoZero">recomeçar</button>':'')+'</p></section>'
      + '<section class="card"><h2>Minha semana com Deus <em>'+st.semDeus.filter(function(x){return s.f[x.id];}).length+' de '+st.semDeus.length+'</em></h2>'
      + st.semDeus.map(function(x){ return chk(s.f[x.id], 'semDeus', x.id, x.nome); }).join('')
      + '<button class="link" data-a="editSemDeus">✏️ Editar metas da semana</button></section>'
      + '<section class="card"><h2>Intenções de oração</h2><div class="tags">'+datas+'</div>'
      + '<form class="row" data-form="int"><input type="text" id="novaInt" placeholder="Nova intenção" aria-label="Nova intenção"><button class="btn sm">Adicionar</button></form></section>';
  };

  R.corpo = function(){
    var d = dia(), w = T.getDay(), tr = st.treinos[w], ini = addDays(T, -w);
    var tem = function(k){ var x = st.dias[k]; return x && (x.f.treino || x.f.caminhada || x.treinoFeito); };
    var week = ''; for (var i=0;i<7;i++){ var k = iso(addDays(ini,i)); week += '<div class="day'+(tem(k)?' ok':'')+(k===TK?' td':'')+'">'+WD1[i]+'<b>'+(tem(k)?'✓':addDays(ini,i).getDate())+'</b></div>'; }
    var feitosSem = 0; for (var j=0;j<7;j++) if (tem(iso(addDays(ini,j)))) feitosSem++;
    var meta = st.itens.filter(function(i){ return i.id === 'treino'; }).map(function(i){ return i.dias.length; })[0] || 3;
    var bars = '', max = 1, vals = [];
    for (var s=4;s>=0;s--){ var a = addDays(ini, -7*s), c = 0; for (var q=0;q<7;q++) if (tem(iso(addDays(a,q)))) c++; vals.push([a,c]); max = Math.max(max,c); }
    bars = vals.map(function(v){ return '<div class="bar'+(v[1]?'':' zero')+'"><span>'+v[1]+'</span><i style="height:'+Math.round(v[1]/max*70)+'%"></i><span>'+pad(v[0].getDate())+'/'+pad(v[0].getMonth()+1)+'</span></div>'; }).join('');
    var pesos = st.pesos.slice(-4).reverse().map(function(p){ return '<div class="li"><span>'+p.d.split('-').reverse().slice(0,2).join('/')+'</span><b>'+String(p.kg).replace('.',',')+' kg</b></div>'; }).join('');
    return head('Corpo e treino', 'Cuidar do templo', '💪')
      + '<section class="card"><h2>Treinos da semana <em>'+feitosSem+' de '+meta+'</em></h2><div class="week">'+week+'</div></section>'
      + '<section class="card"><h2>'+(tr?'Treino de hoje · '+esc(tr.nome):'Hoje é dia de descanso')+'</h2>'
      + (tr ? tr.ex.map(function(e){ return '<div class="ex"><span>'+esc(e[0])+'</span><small>'+esc(e[1])+'</small></div>'; }).join('')
            + (d.treinoFeito ? '<p class="msg">Treino feito! Deus abençoe esse corpo 💪</p><button class="link" data-a="treinoFeito">desmarcar</button>' : '<button class="btn" data-a="treinoFeito">Terminei o treino</button>')
          : '<p class="hint">Descansar também é cuidar. Que tal uma caminhada leve?</p>')
      + '<button class="link" data-a="editTreino">✏️ Editar treino de '+WD[w].toLowerCase()+'</button></section>'
      + '<section class="card"><h2>Minha evolução <em>treinos por semana</em></h2><div class="bars">'+bars+'</div></section>'
      + '<section class="card"><h2>Meu peso</h2>'+(pesos||'<p class="hint">Registre uma vez por semana, sem neura.</p>')
      + '<form class="row" data-form="peso"><input type="text" inputmode="decimal" id="novoPeso" placeholder="Ex.: 64,5" aria-label="Peso em kg"><button class="btn sm">Registrar</button></form></section>';
  };

  R.casa = function(){
    var d = dia(), w = T.getDay(), tab = view.casaTab;
    var tabs = '<div class="subtabs">'+[['casa','Casa'],['cardapio','Cardápio'],['compras','Compras'],['datas','Datas']].map(function(t){ return '<button data-a="casaTab" data-v="'+t[0]+'" aria-pressed="'+(tab===t[0])+'">'+t[1]+'</button>'; }).join('')+'</div>';
    var h = head('Casa e família', 'Meu lar', '🏡') + tabs;
    if (tab === 'casa'){
      var lim = st.casa.limpeza[w] || [];
      h += '<section class="card"><h2>Limpeza de hoje · '+WD[w].toLowerCase()+' <em>'+lim.filter(function(t,i){return d.f['lim'+i];}).length+' de '+lim.length+'</em></h2>'
        + lim.map(function(t,i){ return chk(d.f['lim'+i], 'casaItem', 'lim'+i, t); }).join('')
        + '<button class="link" data-a="editLimpeza">✏️ Editar limpeza de '+WD[w].toLowerCase()+'</button></section>'
        + '<section class="card"><h2>Tarefas da família</h2>'
        + (st.casa.familia.length ? st.casa.familia.map(function(t){ return chk(d.f['fam'+t.id], 'casaItem', 'fam'+t.id, t.t, {who:t.quem}); }).join('') : '<p class="hint">Divida as tarefas: cada um faz a sua parte.</p>')
        + '<form class="row" data-form="fam"><input type="text" id="famT" placeholder="Tarefa" aria-label="Tarefa"><input type="text" id="famQ" placeholder="Quem" aria-label="Quem" style="max-width:96px"><button class="btn sm">+</button></form>'
        + (st.casa.familia.length ? '<button class="link" data-a="limparFam">Remover todas as tarefas</button>' : '') + '</section>';
    } else if (tab === 'cardapio'){
      h += '<section class="card"><h2>Cardápio da semana</h2><p class="hint">O que vai ter de almoço e jantar.</p>';
      for (var i=1;i<=7;i++){ var dd = i % 7; h += '<label class="hint" for="car'+dd+'"><b>'+WD[dd]+'</b></label><input type="text" id="car'+dd+'" data-f="cardapio" data-v="'+dd+'" value="'+esc(st.casa.cardapio[dd])+'" placeholder="Ex.: frango grelhado e salada">'; }
      h += '</section>';
    } else if (tab === 'compras'){
      var cs = st.casa.compras;
      h += '<section class="card"><h2>Lista de compras <em>'+cs.filter(function(c){return !c.ok;}).length+' faltando</em></h2>'
        + cs.map(function(c){ return '<div class="row">'+chk(c.ok, 'compra', c.id, c.t)+'<button class="x" data-a="delCompra" data-id="'+c.id+'" aria-label="Remover">×</button></div>'; }).join('')
        + '<form class="row" data-form="compra"><input type="text" id="novaCompra" placeholder="Ex.: ovos, banana, arroz" aria-label="Item"><button class="btn sm">Adicionar</button></form>'
        + (cs.some(function(c){return c.ok;}) ? '<button class="link" data-a="limparCompras">Tirar os itens marcados</button>' : '') + '</section>';
    } else {
      var prox = st.casa.datas.map(function(x){ var p = parse(x.d), n = new Date(T.getFullYear(), p.getMonth(), p.getDate()); if (n < T) n.setFullYear(n.getFullYear()+1); return {x:x, n:n}; })
        .sort(function(a,b){ return a.n - b.n; });
      h += '<section class="card"><h2>Datas importantes 🎉</h2>'
        + (prox.length ? prox.map(function(p){ var f = diffDays(T, p.n); return '<div class="li"><span>'+esc(p.x.nome)+'<br><small class="hint">'+(f===0?'É hoje!':f===1?'amanhã':'em '+f+' dias')+'</small></span><b>'+pad(p.n.getDate())+'/'+pad(p.n.getMonth()+1)+'</b><button class="x" data-a="delData" data-id="'+p.x.id+'" aria-label="Remover">×</button></div>'; }).join('') : '<p class="hint">Aniversários, bodas, batizados, dia dos santos de devoção…</p>')
        + '<form class="col" data-form="data" style="display:flex;flex-direction:column;gap:8px"><input type="text" id="dataNome" placeholder="Ex.: Aniversário da mamãe" aria-label="Nome da data"><div class="row"><input type="date" id="dataD" aria-label="Data"><button class="btn sm">Salvar</button></div></form></section>';
    }
    return h;
  };

  R.mais = function(){
    var b = function(v, em, t, s){ return '<button data-a="go" data-v="'+v+'"><span class="em">'+em+'</span><b>'+t+'</b><span>'+s+'</span></button>'; };
    return head('Configurações', 'Mais', '☰')
      + '<div class="menu">'+b('ajustes','⚙️','Ajustes','Nome, água, conta')+b('meudia','✏️','Meu dia','O que acompanhar')
      + b('instalar','📲','Instalar','Na tela de início')+'</div>';
  };

  R.financas = function(){
    var m = mes(), ent = m.entradas.reduce(function(a,x){return a+x.v;},0), gas = m.gastos.reduce(function(a,x){return a+x.v;},0);
    var contasPagas = m.contas.filter(function(c){return c.pago;}).reduce(function(a,c){return a+c.v;},0);
    var saiu = gas + contasPagas, por = {};
    m.gastos.forEach(function(g){ por[g.c] = (por[g.c]||0) + g.v; });
    var cats = CATS.filter(function(c){ return por[c] || st.fin.orc[c]; });
    return head('Finanças · '+MES[T.getMonth()], 'Meu dinheiro', '💰')
      + '<section class="card money"><span style="font-size:12px;font-weight:700;opacity:.85">Sobra do mês</span><div class="big">'+brl(ent - saiu)+'</div><div class="row"><span>Entrou '+brl(ent)+'</span><span>Saiu '+brl(saiu)+'</span></div></section>'
      + '<div class="row"><button class="btn ghost" data-a="addMov" data-v="entradas">+ Entrada</button><button class="btn ghost" data-a="addMov" data-v="gastos">+ Gasto</button></div>'
      + '<section class="card"><h2>Gastos por área</h2>'
      + (cats.length ? cats.map(function(c){ var v = por[c]||0, o = st.fin.orc[c]||0; return '<div class="row" style="justify-content:space-between;font-size:13px;font-weight:700"><span>'+c+'</span><span class="hint">'+brl(v)+(o?' / '+brl(o):'')+'</span></div>'+(o?bar(v,o):''); }).join('') : '<p class="hint">Registre os gastos e veja para onde vai o dinheiro.</p>')
      + '<button class="link" data-a="editOrc">✏️ Definir limites por área</button></section>'
      + '<section class="card"><h2>Contas a pagar</h2>'
      + (m.contas.length ? m.contas.map(function(c){ return '<div class="li"><span>'+esc(c.n)+(c.venc?'<br><small class="hint">vence dia '+c.venc+'</small>':'')+'</span><span class="row"><b>'+brl(c.v)+'</b>'+(c.pago?'<button class="paid link" data-a="pagar" data-id="'+c.id+'">PAGO ✓</button>':'<button class="btn sm" data-a="pagar" data-id="'+c.id+'">Paguei</button>')+'<button class="x" data-a="delConta" data-id="'+c.id+'" aria-label="Remover">×</button></span></div>'; }).join('') : '<p class="hint">Luz, água, escola, dízimo… nada esquecido.</p>')
      + '<button class="link" data-a="addConta">+ Adicionar conta</button></section>'
      + '<section class="card"><h2>Últimos lançamentos</h2>'
      + (m.entradas.length + m.gastos.length ? m.entradas.map(function(x){return [x,'+'];}).concat(m.gastos.map(function(x){return [x,'-'];})).slice(-8).reverse().map(function(p){ return '<div class="li"><span>'+esc(p[0].n)+(p[0].c?' <small class="hint">· '+p[0].c+'</small>':'')+'</span><b>'+p[1]+' '+brl(p[0].v)+'</b></div>'; }).join('') : '<p class="hint">Nenhum lançamento este mês.</p>')
      + '</section>'
      + '<section class="card"><h2>Metas de economia</h2>'
      + st.fin.metas.map(function(g){ return '<div class="row" style="justify-content:space-between;font-size:13.5px;font-weight:700"><span>'+esc(g.n)+'</span><span class="hint">'+Math.round(g.a/g.alvo*100)+'%</span></div>'+bar(g.a,g.alvo)+'<div class="row" style="justify-content:space-between"><span class="hint">'+brl(g.a)+' de '+brl(g.alvo)+'</span><button class="link" data-a="guardar" data-id="'+g.id+'">+ guardar</button></div>'; }).join('')
      + '<button class="link" data-a="addMeta">+ Nova meta</button></section>';
  };

  function desafioInfo(x){
    var s = st.desafios[x.id] || {}, ini = x.tipo === 'data' ? parse(x.inicio) : (s.inicio ? parse(s.inicio) : null);
    var idx = ini ? diffDays(ini, T) : -1;
    return {s:s, ini:ini, idx:idx, ativo: ini && idx >= 0 && idx < x.dias, feitos: Object.keys(s.f||{}).length};
  }
  // ---------- novenas ----------
  function novenaInfo(n){
    var y = T.getFullYear(), ini = parse(y+'-'+n.inicio);
    if (diffDays(ini, T) > 8) ini = parse((y+1)+'-'+n.inicio);
    var idx = diffDays(ini, T);
    var k = n.id + ini.getFullYear(), s = (st.novenas || {})[k] || {};
    return {ini:ini, idx:idx, ativa: idx >= 0 && idx <= 8, key:k, f: s.f || {}, festa: parse(ini.getFullYear()+'-'+n.festa)};
  }
  function ddmm(d){ return pad(d.getDate())+'/'+pad(d.getMonth()+1); }
  function novenaCard(){
    var ns = (window.NOVENAS || []).map(function(n){ return {n:n, i:novenaInfo(n)}; }).sort(function(a,b){ return a.i.ini - b.i.ini; });
    if (!ns.length) return '';
    var at = ns.filter(function(x){ return x.i.ativa; })[0], h = '<section class="card"><h2>🌹 Novena <em>'+(at ? 'dia '+(at.i.idx+1)+' de 9' : 'próxima')+'</em></h2>';
    if (at) h += '<p style="margin:0;font-weight:700;color:var(--azul)">'+esc(at.n.nome)+'</p><p class="hint">'+esc(at.n.dias[at.i.idx])+'</p>'
      + chk(at.i.f[at.i.idx], 'novenaDia', at.n.id+'|'+at.i.idx, 'Rezei a novena hoje') + '<button class="link" data-a="abrirNovena" data-id="'+at.n.id+'">Rezar agora ›</button>';
    else { var nx = ns.filter(function(x){ return x.i.idx < 0; })[0]; h += '<p style="margin:0;font-weight:700;color:var(--azul)">'+esc(nx.n.nome)+'</p><p class="hint">Começa em '+ddmm(nx.i.ini)+'. No dia, ela aparece aqui.</p>'; }
    return h + '<button class="link" data-a="go" data-v="novenas">Ver todas as novenas</button></section>';
  }
  R.novenas = function(){
    if (view.novena) return R.novena();
    var ns = (window.NOVENAS || []).map(function(n){ return {n:n, i:novenaInfo(n)}; }).sort(function(a,b){ return a.i.ini - b.i.ini; });
    return '<button class="link" data-a="go" data-v="fe">‹ Vida de fé</button>' + head('Rezando com a Igreja', 'Novenas', '🌹')
      + ns.map(function(x){
        var pl = x.i.ativa ? 'Hoje · dia '+(x.i.idx+1)+' de 9' : ddmm(x.i.ini)+' a '+ddmm(addDays(x.i.ini, 8));
        var feitos = Object.keys(x.i.f).length;
        return '<button class="ch '+(x.n.cor||'c-natal')+'" data-a="abrirNovena" data-id="'+x.n.id+'"><span class="pl">'+pl+'</span><h3>'+esc(x.n.nome)+'</h3><p>Festa em '+ddmm(x.i.festa)+(feitos ? ' · '+feitos+' de 9 dias rezados' : '')+'</p></button>';
      }).join('');
  };
  R.novena = function(){
    var n = (window.NOVENAS || []).filter(function(x){ return x.id === view.novena; })[0], i = novenaInfo(n);
    var dia = i.ativa ? i.idx : (view.novenaDia || 0);
    var h = '<button class="link" data-a="fecharNovena">‹ Novenas</button><div class="ch '+(n.cor||'c-natal')+'"><span class="pl">'+ddmm(i.ini)+' a '+ddmm(addDays(i.ini,8))+'</span><h3>'+esc(n.nome)+'</h3><p>Festa em '+ddmm(i.festa)+'</p></div>';
    var mapa = ''; for (var k=0;k<9;k++) mapa += '<button class="tag'+(i.f[k]?'':' soft')+'" data-a="novenaVer" data-v="'+k+'" style="min-width:40px'+(k===dia?';outline:2px solid var(--azul2)':'')+'">'+(i.f[k]?'✓':k+1)+'</button>';
    h += '<section class="card"><h2>Dia '+(dia+1)+' de 9'+(i.ativa && dia === i.idx ? ' <em>hoje</em>' : '')+'</h2>'
      + '<p style="margin:0;font-family:var(--read);font-size:18px;color:var(--azul)">'+esc(n.dias[dia])+'</p>'
      + '<p class="lbl">1. Sinal da cruz e intenção</p><p class="hint">Em nome do Pai, do Filho e do Espírito Santo. Coloque diante de Deus o seu pedido.</p>'
      + '<p class="lbl">2. Oração da novena</p><p class="evtxt">'+esc(n.oracao)+'</p>'
      + '<p class="lbl">3. Orações finais</p><p class="hint">Reze 1 Pai-Nosso, 1 Ave-Maria e 1 Glória ao Pai.</p>'
      + chk(i.f[dia], 'novenaDia', n.id+'|'+dia, 'Rezei o dia '+(dia+1)) + '</section>'
      + '<section class="card"><h2>Os 9 dias</h2><div class="tags">'+mapa+'</div></section>';
    return h;
  };

  R.desafios = function(){
    if (view.desafio) return R.desafio();
    return head('Jornadas guiadas', 'Desafios', '✨')
      + C.desafios.map(function(x){
        var i = desafioInfo(x), pl;
        if (i.ativo) pl = 'Em andamento · dia '+(i.idx+1)+' de '+x.dias;
        else if (i.ini && i.idx < 0) pl = 'Começa em '+pad(i.ini.getDate())+'/'+pad(i.ini.getMonth()+1);
        else if (i.ini && i.idx >= x.dias) pl = 'Concluído · '+i.feitos+' dias feitos';
        else pl = 'Comece quando quiser';
        var dots = ''; if (i.ativo){ var n = Math.min(x.dias, 50); for (var k=0;k<n;k++) dots += '<i class="'+(k<=i.idx*n/x.dias && (i.s.f||{})[Math.floor(k*x.dias/n)]?'on':'')+'"></i>'; }
        return '<button class="ch '+x.cls+'" data-a="abrirDesafio" data-id="'+x.id+'"><span class="pl">'+pl+'</span><h3>'+x.nome+'</h3><p>'+x.sub+'</p>'+(dots?'<div class="dots">'+dots+'</div>':'')+'</button>';
      }).join('');
  };
  R.desafio = function(){
    var x = C.desafios.filter(function(d){ return d.id === view.desafio; })[0], i = desafioInfo(x), f = (i.s.f||{});
    var h = '<button class="link" data-a="voltarDesafios">‹ Desafios</button><div class="ch '+x.cls+'"><h3>'+x.nome+'</h3><p>'+x.sub+'</p></div>';
    if (!i.ini) return h + '<section class="card"><h2>'+x.dias+' dias</h2><p class="hint">Um passo pequeno por dia. Você começa hoje e o app guia o resto.</p><button class="btn" data-a="comecar" data-id="'+x.id+'">Começar hoje</button></section>';
    if (i.idx < 0) return h + '<section class="card"><h2>Começa em '+pad(i.ini.getDate())+'/'+pad(i.ini.getMonth()+1)+'</h2><p class="hint">Faltam '+(-i.idx)+' dias. No dia, ele aparece aqui sozinho.</p></section>';
    var dIdx = Math.min(i.idx, x.dias-1), passo;
    if (x.passos) passo = x.passos[dIdx];
    else { var sw = Math.min(x.temas.length-1, Math.floor(dIdx / Math.ceil(x.dias / x.temas.length))); passo = 'Tema da semana: ' + x.temas[sw]; }
    h += '<section class="card"><h2>Dia '+(dIdx+1)+' de '+x.dias+' <em>'+i.feitos+' feitos</em></h2><p style="margin:0;font-family:var(--read);font-size:18px;color:var(--azul)">'+esc(passo)+'</p>'
      + (i.ativo ? chk(f[dIdx], 'desafioDia', dIdx, 'Fiz o desafio de hoje') : '<p class="msg">Desafio concluído! 🤍</p>') + '</section>';
    var mapa = ''; for (var k=0;k<x.dias;k++) mapa += '<span class="tag'+(f[k]?'':' soft')+'" style="min-width:34px;text-align:center'+(k===dIdx?';outline:2px solid var(--azul2)':'')+'">'+(k+1)+'</span>';
    return h + '<section class="card"><h2>Meu caminho</h2><div class="tags">'+mapa+'</div></section>';
  };

  R.metas = function(){
    var mk = 'rev' + mesKey(), t = function(id, lb, ph){ return '<label class="hint" for="'+id+'"><b>'+lb+'</b></label><textarea id="'+id+'" data-f="meta" data-v="'+id+'" placeholder="'+ph+'">'+esc(st.metas[id])+'</textarea>'; };
    return head('Direção da minha vida', 'Metas do ano', '🎯')
      + '<section class="card"><h2>'+T.getFullYear()+'</h2>'+t('deus','Com Deus','Ex.: rezar o terço 3x por semana')+t('comigo','Comigo','Ex.: treinar 3x por semana, ler 12 livros')+t('amo','Com quem eu amo','Ex.: um encontro a dois por mês')+'</section>'
      + '<section class="card"><h2>Revisão de '+MES[T.getMonth()]+'</h2>'+t(mk,'O que deu certo e o que quero ajustar','Escreva no fim do mês')+'</section>';
  };

  R.meudia = function(){
    var areas = ['Com Deus','Corpo','Comigo'], sel = {}; st.itens.forEach(function(i){ sel[i.id] = i; });
    var todos = C.sugestoes.map(function(s){ return sel[s.id] || s; }).concat(st.itens.filter(function(i){ return !C.sugestoes.some(function(s){ return s.id === i.id; }); }));
    var dd = function(i){ return i.dias.length === 7 ? 'todo dia' : i.dias.map(function(x){ return WD[x].slice(0,3).toLowerCase(); }).join(' · '); };
    var ob = !st.onboard;
    var h = head(ob ? 'Passo 2 de 3' : 'Meu dia', 'Monte o seu dia', '✏️')
      + '<p class="hint">Toque para escolher o que acompanhar. Toque em “dias” para escolher quando aparece. Dá para mudar quando quiser.</p>';
    areas.forEach(function(a){
      h += '<p class="lbl">'+a+'</p>' + todos.filter(function(i){ return i.area === a; }).map(function(i){
        return '<div class="row"><button class="opt" aria-pressed="'+(!!sel[i.id])+'" data-a="pick" data-id="'+i.id+'"><span class="em">'+i.em+'</span>'+esc(i.nome)+'</button><button class="tag soft" data-a="editItem" data-id="'+i.id+'" aria-label="Escolher dias de '+esc(i.nome)+'">'+dd(i)+'</button></div>';
      }).join('');
    });
    h += '<button class="opt add" data-a="editItem" data-id="">+ Criar um item meu</button>';
    if (ob) h += '<button class="btn" data-a="obNext">Continuar</button>';
    else h += '<button class="btn" data-a="go" data-v="hoje">Pronto</button>';
    return h;
  };

  R.ajustes = function(){
    return head('Ajustes', 'Meu planner', '⚙️')
      + '<section class="card"><label class="hint" for="aNome"><b>Como posso te chamar?</b></label><input type="text" id="aNome" data-f="nome" value="'+esc(st.nome)+'">'
      + '<p class="hint"><b>Cor das mãos nos ícones</b></p>' + tonsPicker()
      + '<label class="hint" for="aAgua"><b>Meta de água (copos por dia)</b></label><input type="number" id="aAgua" min="1" max="16" data-f="aguaMeta" value="'+st.aguaMeta+'"></section>'
      + '<section class="card"><h2>Minha conta</h2><p class="hint">'+(user ? esc(user.email) : 'Modo de teste: as marcações ficam só neste aparelho.')+'</p>'
      + (user ? '<button class="btn ghost" data-a="sair">Sair da conta</button>' : '')
      + '<button class="link" data-a="apagar" style="color:var(--danger)">Apagar todos os meus dados</button></section>';
  };

  R.instalar = function(){
    return head(st.onboard ? 'Na tela de início' : 'Passo 3 de 3', 'Instale o app', '📲')
      + '<section class="card"><h2>iPhone</h2><p class="hint">Abra no Safari, toque em Compartilhar (o quadrado com a seta) e depois em “Adicionar à Tela de Início”. Só assim chegam as notificações.</p></section>'
      + '<section class="card"><h2>Android</h2><p class="hint">No Chrome, toque nos três pontinhos e em “Instalar app” ou “Adicionar à tela inicial”.</p></section>'
      + (st.onboard ? '' : '<button class="btn" data-a="obFim">Começar a viver inteira 🤍</button>');
  };

  R.boasvindas = function(){
    return '<div class="hd"><div><small>Passo 1 de 3</small><h1>Bem-vinda ao <span class="cur">Viver Inteira</span></h1></div></div>'
      + '<div class="verse"><i>“Não sabeis que o vosso corpo é templo do Espírito Santo?”</i><small>1 Coríntios 6,19</small></div>'
      + '<section class="card"><p style="margin:0">Aqui você cuida da alma, do corpo e da sua rotina, um dia de cada vez. Vamos montar o seu planner em 1 minuto.</p>'
      + '<label class="hint" for="obNome"><b>Como posso te chamar?</b></label><input type="text" id="obNome" data-f="nome" value="'+esc(st.nome)+'" placeholder="Seu nome">'
      + '<p class="hint"><b>Escolha a cor das mãos nos ícones</b></p>' + tonsPicker() + '</section>'
      + '<button class="btn" data-a="obNext">Continuar</button>';
  };

  // ---------- cor das mãos (tom de pele dos emojis) ----------
  var TONS = ['', '\uD83C\uDFFB', '\uD83C\uDFFC', '\uD83C\uDFFD', '\uD83C\uDFFE', '\uD83C\uDFFF'];
  function pele(h){
    var t = st.tom || ''; if (!t) return h;
    return h.replace(/🙏/g, '🙏'+t).replace(/💪/g, '💪'+t).replace(/🚶\u200D♀️/g, '🚶'+t+'\u200D♀️').replace(/🛁/g, '🛀'+t);
  }
  function tonsPicker(){ return '<div class="tons" role="group" aria-label="Cor das mãos">'+TONS.map(function(t,i){ return '<button type="button" data-a="tom" data-v="'+i+'" aria-pressed="'+((st.tom||'')===t)+'" aria-label="Tom '+(i+1)+'">&#x1F64F;'+t+'</button>'; }).join('')+'</div>'; }

  // ---------- desenhar ----------
  var TABS = [['hoje','☀️','Hoje'],['fe','🙏','Fé'],['corpo','💪','Corpo'],['casa','🏡','Casa'],['mais','☰','Mais']];
  var MAIS = ['mais','meudia','ajustes','instalar'];
  function render(){
    var t = view.tela, html;
    if (!st.onboard) html = view.ob === 1 ? R.boasvindas() : view.ob === 2 ? R.meudia() : R.instalar();
    else html = (R[t] || R.hoje)();
    if (demo) html = '<div class="demo">Versão de teste · as marcações ficam só neste aparelho</div>' + html;
    var sy = window.scrollY, same = render.last === t + view.ob + view.casaTab + view.desafio + view.novena + view.novenaDia;
    $('main').innerHTML = pele(html);
    $('main').classList.toggle('grade', st.onboard && ['hoje','fe','corpo','casa','financas'].indexOf(t) >= 0);
    if (!render.tab) render.tab = $('tabbar').innerHTML; $('tabbar').innerHTML = pele(render.tab);
    $('tabbar').hidden = !st.onboard;
    document.querySelectorAll('#tabbar a').forEach(function(a){
      var v = a.getAttribute('href').slice(1);
      if (v === t || (v === 'mais' && MAIS.indexOf(t) >= 0) || (v === 'fe' && t === 'novenas')) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, same ? sy : 0);
    var cur = document.querySelector('#tabbar a[aria-current]'), nav = document.querySelector('#tabbar nav');
    if (cur && !same) { var l = cur.offsetLeft, w = cur.offsetWidth; if (l < nav.scrollLeft || l + w > nav.scrollLeft + nav.clientWidth) nav.scrollTo({left: l - nav.clientWidth + w*2, behavior:'smooth'}); }
    render.last = t + view.ob + view.casaTab + view.desafio + view.novena + view.novenaDia;
  }
  function go(v){ if (location.hash !== '#'+v) location.hash = v; else { view.tela = v; render(); } }
  document.querySelector('#tabbar nav').addEventListener('scroll', function(){ this.classList.toggle('fim', this.scrollLeft + this.clientWidth >= this.scrollWidth - 4); });
  window.addEventListener('hashchange', function(){ view.tela = location.hash.slice(1) || 'hoje'; if (view.tela !== 'desafios') view.desafio = null; if (view.tela !== 'novenas') view.novena = null; render(); });

  // ---------- folha (modal) ----------
  function sheet(html, onSave){
    var s = $('sheet'); s.innerHTML = '<div role="dialog" aria-modal="true">'+html+'<div class="row"><button class="btn ghost" data-s="cancel">Cancelar</button><button class="btn" data-s="ok">Salvar</button></div></div>';
    s.hidden = false; sheet.ok = onSave;
    var f = s.querySelector('input,textarea'); if (f) f.focus();
  }
  $('sheet').addEventListener('click', function(e){
    var b = e.target.closest('[data-s]');
    if (e.target === this || (b && b.dataset.s === 'cancel')) { this.hidden = true; return; }
    if (b && b.dataset.s === 'ok') { if (sheet.ok(this) !== false) { this.hidden = true; save(); render(); } return; }
    var w = e.target.closest('[data-wd]'); if (w) w.setAttribute('aria-pressed', w.getAttribute('aria-pressed') !== 'true');
    var del = e.target.closest('[data-s-del]'); if (del) { sheet.del(); this.hidden = true; save(); render(); }
  });
  function wdPicker(dias){ return '<div class="wd">'+WD.map(function(n,i){ return '<button type="button" data-wd="'+i+'" aria-pressed="'+(dias.indexOf(i)>=0)+'" aria-label="'+n+'">'+WD1[i]+'</button>'; }).join('')+'</div>'; }
  function wdRead(s){ return [].slice.call(s.querySelectorAll('[data-wd][aria-pressed="true"]')).map(function(b){ return +b.dataset.wd; }); }

  // ---------- ações ----------
  var A = {
    go: function(el){ go(el.dataset.v); },
    tom: function(el){ st.tom = TONS[+el.dataset.v]; },
    item: function(el){ var d = dia(); d.f[el.dataset.id] = !d.f[el.dataset.id]; },
    evang: function(){ var d = dia(); d.f.evangLido = !d.f.evangLido; if (st.itens.some(function(i){return i.id==='evang';})) d.f.evang = d.f.evangLido; },
    agua: function(el){ var d = dia(), v = +el.dataset.v; d.agua = d.agua === v ? v-1 : v; },
    humor: function(el){ var d = dia(), v = +el.dataset.v; d.humor = d.humor === v ? null : v; },
    terco: function(){ var d = dia(); d.terco = Math.min(55, (d.terco||0)+1); if (d.terco === 55) toast('Terço completo! 🌹'); },
    tercoZero: function(){ dia().terco = 0; },
    semDeus: function(el){ var s = sem(); s.f[el.dataset.id] = !s.f[el.dataset.id]; },
    delInt: function(el){ st.intencoes.splice(+el.dataset.v, 1); },
    treinoFeito: function(){ var d = dia(); d.treinoFeito = !d.treinoFeito; if (st.itens.some(function(i){return i.id==='treino';})) d.f.treino = d.treinoFeito; },
    casaTab: function(el){ view.casaTab = el.dataset.v; },
    casaItem: function(el){ var d = dia(); d.f[el.dataset.id] = !d.f[el.dataset.id]; },
    limparFam: function(){ st.casa.familia = []; },
    compra: function(el){ st.casa.compras.forEach(function(c){ if (c.id === el.dataset.id) c.ok = !c.ok; }); },
    delCompra: function(el){ st.casa.compras = st.casa.compras.filter(function(c){ return c.id !== el.dataset.id; }); },
    limparCompras: function(){ st.casa.compras = st.casa.compras.filter(function(c){ return !c.ok; }); },
    delData: function(el){ st.casa.datas = st.casa.datas.filter(function(c){ return c.id !== el.dataset.id; }); },
    pagar: function(el){ mes().contas.forEach(function(c){ if (c.id === el.dataset.id) c.pago = !c.pago; }); },
    delConta: function(el){ var m = mes(); m.contas = m.contas.filter(function(c){ return c.id !== el.dataset.id; }); },
    evAbrir: function(){ view.evAberto = !view.evAberto; },
    abrirNovena: function(el){ view.novena = el.dataset.id; view.novenaDia = 0; if (location.hash !== '#novenas') { location.hash = 'novenas'; } },
    fecharNovena: function(){ view.novena = null; },
    novenaVer: function(el){ view.novenaDia = +el.dataset.v; var n = (window.NOVENAS||[]).filter(function(x){ return x.id === view.novena; })[0]; if (novenaInfo(n).ativa) toast('Na novena de agora, siga o dia de hoje 🤍'); },
    novenaDia: function(el){
      var p = el.dataset.id.split('|'), n = (window.NOVENAS||[]).filter(function(x){ return x.id === p[0]; })[0], i = novenaInfo(n);
      st.novenas = st.novenas || {}; var s = st.novenas[i.key] = st.novenas[i.key] || {f:{}};
      if (s.f[p[1]]) delete s.f[p[1]]; else { s.f[p[1]] = true; toast(Object.keys(s.f).length === 9 ? 'Novena completa! 🌹' : 'Amém 🙏'); }
    },
    abrirDesafio: function(el){ view.desafio = el.dataset.id; },
    voltarDesafios: function(){ view.desafio = null; },
    comecar: function(el){ st.desafios[el.dataset.id] = {inicio:TK, f:{}}; toast('Desafio começado! 🤍'); },
    desafioDia: function(el){ var s = st.desafios[view.desafio] = st.desafios[view.desafio] || {f:{}}; s.f = s.f || {}; var k = el.dataset.id; if (s.f[k]) delete s.f[k]; else { s.f[k] = true; toast('Mais um passo! 🤍'); } },
    pick: function(el){
      var id = el.dataset.id, i = st.itens.findIndex(function(x){ return x.id === id; });
      if (i >= 0) st.itens.splice(i, 1);
      else { var s = C.sugestoes.filter(function(x){ return x.id === id; })[0]; if (s) st.itens.push({id:s.id, em:s.em, nome:s.nome, area:s.area, dias:s.dias.slice()}); }
    },
    obNext: function(){
      if (view.ob === 1 && !st.itens.length) C.sugestoes.forEach(function(s){ if (s.on) st.itens.push({id:s.id, em:s.em, nome:s.nome, area:s.area, dias:s.dias.slice()}); });
      view.ob++; window.scrollTo(0,0);
    },
    obFim: function(){ st.onboard = true; go('hoje'); },
    sair: function(){ if (sb) sb.auth.signOut().then(function(){ location.reload(); }); },
    apagar: function(){
      sheet('<h2>Apagar tudo?</h2><p class="hint">Isso apaga todas as suas marcações, anotações e finanças. Não dá para desfazer.</p>', function(){
        var k = key(); st = blank(); try { localStorage.removeItem(k); } catch(e){} view.ob = 1; toast('Dados apagados');
      });
      $('sheet').querySelector('[data-s="ok"]').textContent = 'Apagar';
    },
    editItem: function(el){
      var id = el.dataset.id, cur = st.itens.filter(function(x){ return x.id === id; })[0] || C.sugestoes.filter(function(x){ return x.id === id; })[0] || {em:'⭐', nome:'', area:'Comigo', dias:[0,1,2,3,4,5,6]};
      sheet('<h2>'+(id?'Editar item':'Criar item meu')+'</h2>'
        + '<div class="row"><input type="text" id="iEm" value="'+esc(cur.em)+'" aria-label="Emoji" style="max-width:60px;text-align:center"><input type="text" id="iNome" value="'+esc(cur.nome)+'" placeholder="Ex.: Tomar vitamina" aria-label="Nome"></div>'
        + '<label class="hint" for="iArea"><b>Área</b></label><select id="iArea">'+['Com Deus','Corpo','Comigo'].map(function(a){ return '<option'+(a===cur.area?' selected':'')+'>'+a+'</option>'; }).join('')+'</select>'
        + '<p class="hint"><b>Em quais dias aparece?</b></p>'+wdPicker(cur.dias)
        + (st.itens.some(function(x){return x.id===id;}) ? '<button class="link" data-s-del style="color:var(--danger)">Tirar do meu dia</button>' : ''),
      function(s){
        var nome = s.querySelector('#iNome').value.trim(), dias = wdRead(s);
        if (!nome || !dias.length) { toast(!nome ? 'Escreva o nome do item' : 'Escolha pelo menos um dia'); return false; }
        var it = {id: id || 'm'+uid(), em: s.querySelector('#iEm').value.trim() || '⭐', nome:nome, area:s.querySelector('#iArea').value, dias:dias};
        var i = st.itens.findIndex(function(x){ return x.id === it.id; }); if (i >= 0) st.itens[i] = it; else st.itens.push(it);
      });
      sheet.del = function(){ st.itens = st.itens.filter(function(x){ return x.id !== id; }); };
    },
    editSemDeus: function(){
      sheet('<h2>Metas da semana com Deus</h2><p class="hint">Uma por linha.</p><textarea id="sd" style="min-height:160px">'+esc(st.semDeus.map(function(x){return x.nome;}).join('\n'))+'</textarea>', function(s){
        var old = {}; st.semDeus.forEach(function(x){ old[x.nome] = x.id; });
        st.semDeus = s.querySelector('#sd').value.split('\n').map(function(l){ return l.trim(); }).filter(Boolean).map(function(n){ return {id: old[n] || 's'+uid(), nome:n}; });
      });
    },
    editTreino: function(){
      var w = T.getDay(), tr = st.treinos[w] || {nome:'', ex:[]};
      sheet('<h2>Treino de '+WD[w].toLowerCase()+'</h2><input type="text" id="tNome" value="'+esc(tr.nome)+'" placeholder="Ex.: Inferiores" aria-label="Nome do treino">'
        + '<p class="hint">Um exercício por linha, no formato: exercício - séries. Deixe vazio para dia de descanso.</p><textarea id="tEx" style="min-height:150px" aria-label="Exercícios">'+esc(tr.ex.map(function(e){ return e[0]+' - '+e[1]; }).join('\n'))+'</textarea>', function(s){
        var ex = s.querySelector('#tEx').value.split('\n').map(function(l){ l = l.trim(); if (!l) return null; var p = l.split(' - '); return [p[0].trim(), (p[1]||'').trim()]; }).filter(Boolean);
        if (!ex.length) delete st.treinos[w]; else st.treinos[w] = {nome: s.querySelector('#tNome').value.trim() || 'Treino', ex:ex};
      });
    },
    editLimpeza: function(){
      var w = T.getDay();
      sheet('<h2>Limpeza de '+WD[w].toLowerCase()+'</h2><p class="hint">Uma tarefa por linha.</p><textarea id="lim" style="min-height:140px" aria-label="Tarefas">'+esc((st.casa.limpeza[w]||[]).join('\n'))+'</textarea>', function(s){
        st.casa.limpeza[w] = s.querySelector('#lim').value.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
      });
    },
    addMov: function(el){
      var tipo = el.dataset.v, g = tipo === 'gastos';
      sheet('<h2>'+(g?'Novo gasto':'Nova entrada')+'</h2><input type="text" id="mN" placeholder="'+(g?'Ex.: Mercado da semana':'Ex.: Salário')+'" aria-label="Descrição"><input type="text" inputmode="decimal" id="mV" placeholder="Valor em R$" aria-label="Valor">'
        + (g ? '<select id="mC" aria-label="Área">'+CATS.map(function(c){ return '<option>'+c+'</option>'; }).join('')+'</select>' : ''), function(s){
        var v = num(s.querySelector('#mV').value); if (!v) { toast('Coloque o valor'); return false; }
        var x = {id:uid(), n: s.querySelector('#mN').value.trim() || (g?'Gasto':'Entrada'), v:v}; if (g) x.c = s.querySelector('#mC').value;
        mes()[tipo].push(x);
      });
    },
    addConta: function(){
      sheet('<h2>Nova conta</h2><input type="text" id="cN" placeholder="Ex.: Luz, Escola, Dízimo" aria-label="Conta"><div class="row"><input type="text" inputmode="decimal" id="cV" placeholder="Valor em R$" aria-label="Valor"><input type="number" id="cD" min="1" max="31" placeholder="Dia" aria-label="Dia do vencimento" style="max-width:90px"></div>', function(s){
        var v = num(s.querySelector('#cV').value), n = s.querySelector('#cN').value.trim(); if (!n || !v) { toast('Coloque o nome e o valor'); return false; }
        mes().contas.push({id:uid(), n:n, v:v, venc: s.querySelector('#cD').value, pago:false});
      });
    },
    editOrc: function(){
      sheet('<h2>Limite por área</h2><p class="hint">Quanto você quer gastar no mês em cada área.</p>' + CATS.map(function(c,i){ return '<label class="hint" for="o'+i+'"><b>'+c+'</b></label><input type="text" inputmode="decimal" id="o'+i+'" value="'+(st.fin.orc[c]||'')+'">'; }).join(''), function(s){
        CATS.forEach(function(c,i){ var v = num(s.querySelector('#o'+i).value); if (v) st.fin.orc[c] = v; else delete st.fin.orc[c]; });
      });
    },
    addMeta: function(){
      sheet('<h2>Nova meta</h2><input type="text" id="gN" placeholder="Ex.: Viagem em família" aria-label="Meta"><input type="text" inputmode="decimal" id="gV" placeholder="Quanto quer juntar (R$)" aria-label="Valor da meta">', function(s){
        var v = num(s.querySelector('#gV').value), n = s.querySelector('#gN').value.trim(); if (!n || !v) { toast('Coloque o nome e o valor'); return false; }
        st.fin.metas.push({id:uid(), n:n, alvo:v, a:0});
      });
    },
    guardar: function(el){
      var g = st.fin.metas.filter(function(x){ return x.id === el.dataset.id; })[0];
      sheet('<h2>Guardar para '+esc(g.n)+'</h2><input type="text" inputmode="decimal" id="gA" placeholder="Valor em R$" aria-label="Valor">', function(s){ var v = num(s.querySelector('#gA').value); if (!v) return false; g.a += v; toast('Guardado! 🙌'); });
    },
  };
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-a]'); if (!el || !A[el.dataset.a]) return;
    e.preventDefault(); A[el.dataset.a](el); save(); render();
  });

  // campos de texto: salvam sem redesenhar
  var F = {
    nota: function(v){ dia().nota = v; }, evRefl: function(v){ dia().evRefl = v; },
    nome: function(v){ st.nome = v.trim(); }, aguaMeta: function(v){ v = parseInt(v,10); if (v>0 && v<=16) st.aguaMeta = v; },
    cardapio: function(v, el){ st.casa.cardapio[el.dataset.v] = v; }, meta: function(v, el){ st.metas[el.dataset.v] = v; },
  };
  document.addEventListener('input', function(e){ var el = e.target; if (el.dataset && F[el.dataset.f]) { F[el.dataset.f](el.value, el); save(); } });

  // formulários curtos
  var FORMS = {
    int: function(f){ var v = f.querySelector('#novaInt').value.trim(); if (v) st.intencoes.push(v); },
    peso: function(f){ var v = num(f.querySelector('#novoPeso').value); if (v) { st.pesos.push({d:TK, kg:v}); toast('Registrado'); } },
    fam: function(f){ var t = f.querySelector('#famT').value.trim(); if (t) st.casa.familia.push({id:uid(), t:t, quem:f.querySelector('#famQ').value.trim()}); },
    compra: function(f){ f.querySelector('#novaCompra').value.split(',').map(function(x){ return x.trim(); }).filter(Boolean).forEach(function(t){ st.casa.compras.push({id:uid(), t:t, ok:false}); }); },
    data: function(f){ var n = f.querySelector('#dataNome').value.trim(), d = f.querySelector('#dataD').value; if (!n || !d) { toast('Coloque o nome e a data'); return; } st.casa.datas.push({id:uid(), nome:n, d:d}); },
  };
  document.addEventListener('submit', function(e){
    var f = e.target; if (!f.dataset || !FORMS[f.dataset.form]) return;
    e.preventDefault(); FORMS[f.dataset.form](f); save(); render();
    var first = document.querySelector('[data-form="'+f.dataset.form+'"] input'); if (first) first.focus();
  });

  // ---------- login ----------
  function iniciar(){ view.tela = location.hash.slice(1) || 'hoje'; $('login').hidden = true; $('wrap').hidden = false; render(); }
  function entrou(u){ user = u; load().then(iniciar); }
  function traduz(e){
    var m = (e && e.message || '').toLowerCase();
    if (m.indexOf('invalid login') >= 0) return 'E-mail ou senha não conferem. Primeira vez? Toque em “Primeira vez”.';
    if (m.indexOf('already registered') >= 0) return 'Esse e-mail já tem conta. Toque em “Já tenho conta”.';
    if (m.indexOf('password') >= 0) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (m.indexOf('compradora') >= 0 || m.indexOf('database error') >= 0) return 'Não encontrei uma compra com esse e-mail. Use o mesmo e-mail da compra na Hotmart.';
    return 'Não deu certo agora. Confira a internet e tente de novo.';
  }
  if (demo) { load().then(iniciar); }
  else {
    var modo = 'criar';
    var setModo = function(m){ modo = m; $('loginMsg').textContent = '';
      $('tCriar').setAttribute('aria-pressed', m==='criar'); $('tEntrar').setAttribute('aria-pressed', m==='entrar');
      $('bEntrar').textContent = m==='criar' ? 'Criar a minha conta' : 'Entrar'; $('bEsqueci').hidden = m==='criar'; };
    $('tCriar').addEventListener('click', function(){ setModo('criar'); });
    $('tEntrar').addEventListener('click', function(){ setModo('entrar'); });
    $('bEsqueci').addEventListener('click', function(){
      var email = $('email').value.trim(); if (!email) { $('loginMsg').textContent = 'Escreva o seu e-mail primeiro.'; return; }
      sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname.replace(/[^/]*$/, '') + 'nova-senha.html'}).then(function(){ $('loginMsg').textContent = 'Enviei um link para o seu e-mail.'; });
    });
    $('fLogin').addEventListener('submit', function(ev){
      ev.preventDefault(); var email = $('email').value.trim(), senha = $('senha').value;
      $('loginMsg').textContent = modo === 'criar' ? 'Criando a sua conta…' : 'Entrando…';
      var p = modo === 'criar' ? sb.auth.signUp({email:email, password:senha}) : sb.auth.signInWithPassword({email:email, password:senha});
      p.then(function(r){ if (r.error) $('loginMsg').textContent = traduz(r.error); else if (r.data.session) entrou(r.data.user); else $('loginMsg').textContent = 'Conta criada! Confirme pelo seu e-mail e depois entre.'; });
    });
    sb.auth.getSession().then(function(r){ if (r.data && r.data.session) entrou(r.data.session.user); else { $('login').hidden = false; } });
  }
  if ('serviceWorker' in navigator && !demo) { try { navigator.serviceWorker.register('sw.js'); } catch(e){} }
})();
