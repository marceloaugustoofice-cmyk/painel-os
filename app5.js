
/* ===== UPLOAD + BANNER ===== */
(function(){
  const info = window.__PDF_INFO__;
  if(info && window.__PDF_OS__){
    const box = document.querySelector('.upload-box');
    box.dataset.original = box.innerHTML;
    box.style.borderColor = '#10B981';
    box.style.background = 'rgba(16,185,129,.12)';
    box.innerHTML = '<strong style="color:#34D399">✅ PDF carregado: '+info.nome+' — '+window.__PDF_OS__.length+' OS em aberto</strong><br><small>Indicadores de backlog recalculados com o setor da base · KPIs históricos (MTTR, %≤3d, retrabalho) mantidos · <a href="#" id="limparPdf" style="color:#F5A623;font-weight:800">↩️ voltar aos dados da base</a></small>';
    document.getElementById('limparPdf').onclick = function(ev){ ev.preventDefault(); try{localStorage.removeItem('painel_os_pdf_v2');}catch(e){} try{sessionStorage.removeItem('painel_os_pdf_v2');}catch(e){} location.hash=''; location.reload(); };
  }
})();
document.getElementById('filePdf').addEventListener('change', async function(e){
  const file = e.target.files[0]; if(!file) return;
  const box = document.querySelector('.upload-box');
  if(!box.dataset.original) box.dataset.original = box.innerHTML;
  box.innerHTML = '<strong>⏳ Lendo o PDF no navegador...</strong><br><small>'+file.name+'</small>';
  try{
    const linhas = await lerPdfCebi(file);
    const novas = parsePdfCebi(linhas);
    if(!novas.length) throw new Error('Nenhuma OS encontrada — confira se é o relatório de Eventos Pendentes do CEBI.');
    const conv = novas.map(o=>{
      const m = (o.abertura||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);
      let dias = 0;
      if(m){ const dt = new Date(+m[3], +m[2]-1, +m[1]); dias = Math.max(0, Math.round(((Date.now()-dt.getTime())/86400000)*10)/10); }
      return {os:o.os, abertura:o.abertura, tipo:o.tipo, depto:'', cdc:o.cdc||'', bairro:o.bairro||'', endereco:o.end||'', sit:o.sit||'Nova', dias, setor:null, sol:o.sol||''};
    });
    let salvo=false;
    try{ localStorage.setItem('painel_os_pdf_v2', JSON.stringify({quando: Date.now(), nome: file.name, os: conv})); salvo=true; }catch(le){}
    if(!salvo){ try{ sessionStorage.setItem('painel_os_pdf_v2', JSON.stringify({quando: Date.now(), nome: file.name, os: conv})); salvo=true; }catch(le2){} }
    if(!salvo){ location.hash = '#pdfdata='+encodeURIComponent(JSON.stringify({quando: Date.now(), nome: file.name, os: conv})); }
    location.reload();
  }catch(err){
    box.innerHTML = '<strong style="color:#F87171">❌ '+err.message+'</strong>';
    setTimeout(()=>{ box.innerHTML = box.dataset.original; }, 6000);
  }
})();
/* ===== ANÁLISE DE PROGRAMAÇÃO MANUAL ===== */
function equipeDe(depto){
  const d = (depto||'').toUpperCase();
  if(d.indexOf('NORTE SUL')>=0 || d.indexOf('DOSA')>=0) return '🔧 Norte Sul (terceirizada)';
  if(d.indexOf('RECOMPOSIÇÃO')>=0 || d.indexOf('PAVIMENT')>=0) return '🛣️ Potenza (recapeamento)';
  if(d.indexOf('CIVIL')>=0) return '🧱 Manutenção Civil';
  if(d.indexOf('REDES')>=0 && d.indexOf('ÁGUA')>=0) return '🚰 Equipe própria (Redes Água)';
  if(d.indexOf('VISTORIA')>=0) return '🔍 Fiscal (vistoria pendente)';
  return depto;
}
function analisarProg(){
  const txt = document.getElementById('progInput').value.trim();
  const out = document.getElementById('progResult');
  if(!txt){ out.innerHTML = '<div class="alerta amarelo">⚠️ Cole a programação do dia primeiro.</div>'; return; }
  // parse: equipe + nº OS (livre)
  const prog = []; // {eq, os}
  txt.split(/\n+/).forEach(l=>{
    l = l.trim(); if(!l) return;
    const eqM = l.match(/AG-?\s*(\d)/i);
    const oss = (l.match(/\b2026\d{6}\b/g)||[]);
    if(eqM && oss.length){ oss.forEach(o=>prog.push({eq:'AG-'+eqM[1], os:o})); }
    else if(oss.length){ oss.forEach(o=>prog.push({eq:'—', os:o})); }
  });
  if(!prog.length){ out.innerHTML = '<div class="alerta vermelho">❌ Nenhuma OS (número de 10 dígitos) encontrada na lista. Formato: "AG-1 2026140383" por linha.</div>'; return; }
  const idxOS = {}; OS.forEach(o=>idxOS[o.os]=o);
  const progOS = new Set(prog.map(p=>p.os));
  // 1) programadas
  let t1 = '<h3 style="font-size:12px;color:#E2E8F0;text-transform:uppercase;letter-spacing:.7px;margin:14px 0 8px">✅ Programadas ('+prog.length+')</h3><table><tr><th>Equipe</th><th>OS</th><th>Setor</th><th>Onde está o serviço</th><th>Bairro</th><th>Endereço</th><th>Dias</th><th>Situação</th></tr>';
  let semBase = 0;
  prog.forEach(p=>{
    const o = idxOS[p.os];
    if(o){ const onde = o.depto ? equipeDe(o.depto) : '—'; t1 += '<tr><td><b>'+p.eq+'</b></td><td><b>'+p.os+'</b></td><td>'+(o.setor?'S'+o.setor:'—')+'</td><td>'+onde+'</td><td>'+o.bairro+'</td><td>'+o.endereco+'</td><td>'+o.dias+'</td><td>'+(o.dias>=C.prazo_execucao?'<span class="tag sim">FORA 48H</span>':'<span class="tag baixa">OK</span>')+'</td></tr>'; }
    else { semBase++; t1 += '<tr><td><b>'+p.eq+'</b></td><td><b>'+p.os+'</b></td><td colspan="6"><span class="tag sim">NÃO ESTÁ NA BASE EM ABERTO</span> (concluída/cancelada ou não existe)</td></tr>'; }
  });
  t1 += '</table>';
  // 2) em aberto sem programação (exclui pesquisa e vistoria convertida)
  const semLista = OS.filter(o=>!progOS.has(o.os) && !/pesquisa/i.test(o.tipo) && !( /vistoria/i.test(o.tipo) && o.sit==='Convertida'));
  let t2 = '<h3 style="font-size:12px;color:#FCA5A5;text-transform:uppercase;letter-spacing:.7px;margin:18px 0 8px">⚠️ Em aberto SEM programação ('+semLista.length+')</h3><table><tr><th>OS</th><th>Setor</th><th>Onde está o serviço</th><th>Equipe sugerida</th><th>Bairro</th><th>Endereço</th><th>Dias</th><th>Tipo</th></tr>';
  const nomeSetor = {1:'AG-1',2:'AG-2',3:'AG-3',4:'AG-4'};
  semLista.sort((a,b)=>b.dias-a.dias).slice(0,40).forEach(o=>{
    const onde = o.depto ? equipeDe(o.depto) : '—';
    t2 += '<tr><td><b>'+o.os+'</b></td><td>'+(o.setor?'S'+o.setor:'—')+'</td><td>'+onde+'</td><td>'+(o.setor?(nomeSetor[o.setor]||'—'):'—')+'</td><td>'+o.bairro+'</td><td>'+o.endereco+'</td><td><b>'+o.dias+'</b></td><td>'+o.tipo.slice(0,28)+'</td></tr>';
  });
  t2 += '</table>' + (semLista.length>40?'<div class="nota">Mostrando as 40 mais antigas de '+semLista.length+'.</div>':'');
  // 3) resumo por equipe
  const porEq = {};
  prog.forEach(p=>{ porEq[p.eq]=(porEq[p.eq]||0)+1; });
  let t3 = '<h3 style="font-size:12px;color:#E2E8F0;text-transform:uppercase;letter-spacing:.7px;margin:18px 0 8px">👥 Carga por equipe</h3><table><tr><th>Equipe</th><th>OS programadas</th></tr>';
  Object.keys(porEq).sort().forEach(e=>{ t3 += '<tr><td><b>'+e+'</b></td><td><b>'+porEq[e]+'</b></td></tr>'; });
  t3 += '</table>';
  // 4) cobrança por setor (em aberto sem programação)
  const porSetorC = {};
  semLista.forEach(o=>{ const s=o.setor||0; (porSetorC[s]=porSetorC[s]||[]).push(o); });
  let t4 = '<h3 style="font-size:12px;color:#FCD34D;text-transform:uppercase;letter-spacing:.7px;margin:18px 0 8px">📲 Cobrança pronta — OS em aberto fora da programação</h3>';
  const nomeFiscal = {1:'SETOR 1 (Hugo)',2:'SETOR 2 (Massaroto)',3:'SETOR 3 (Pedro Frois)',4:'SETOR 4 (Moisés)',0:'SEM SETOR'};
  Object.keys(porSetorC).sort().forEach(s=>{
    const lista = porSetorC[s].sort((a,b)=>b.dias-a.dias);
    let msg = '*'+(nomeFiscal[s]||('SETOR '+s))+'* — OS em aberto fora da programação de hoje:\n';
    lista.slice(0,15).forEach(o=>{ msg += '• OS '+o.os+' — '+o.dias+'d — '+o.endereco.slice(0,38)+', '+o.bairro.slice(0,20)+'\n'; });
    if(lista.length>15) msg += '… e mais '+(lista.length-15)+' OS\n';
    t4 += '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.35);border-radius:8px;padding:12px;margin-bottom:10px">';
    t4 += '<div style="font-size:11px;color:#FCD34D;font-weight:700;margin-bottom:6px">'+(nomeFiscal[s]||('SETOR '+s))+' — '+lista.length+' OS</div>';
    t4 += '<div style="font-size:12px;white-space:pre-wrap;color:#E8EDF4;background:#0D1424;padding:10px;border-radius:6px">'+msg+'</div>';
    t4 += '<button class="btn" style="margin-top:8px;padding:6px 14px;font-size:11px" onclick="copiar(this, '+JSON.stringify(JSON.stringify(msg))+')">📋 Copiar</button></div>';
  });
  out.innerHTML = t1 + t2 + t3 + t4;
}
