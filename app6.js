
/* ===== COBRANÇA WHATSAPP POR SETOR ===== */
(function(){
  const nomeSetor = {1:'SETOR 1 (Hugo)',2:'SETOR 2 (Massaroto)',3:'SETOR 3 (Pedro Frois)',4:'SETOR 4 (Moisés)',0:'SEM SETOR'};
  const fora = vistorias.filter(o=>o.dias>=C.prazo_vistoria);
  const prox = vistorias.filter(o=>o.dias>=C.prazo_vistoria-1 && o.dias<C.prazo_vistoria);
  const porSetorCob = {};
  fora.forEach(o=>{ const s=o.setor||0; (porSetorCob[s]=porSetorCob[s]||[]).push(o); });
  let wh = '<h3 style="font-size:12px;color:#E2E8F0;text-transform:uppercase;letter-spacing:.7px;margin:18px 0 8px">📲 Cobrança pronta para WhatsApp — por setor</h3>';
  let msgGeral = `*COBRANÇA — VISTORIAS PENDENTES (prazo: 24h)*\nEquipes, há *${fora.length} vistoria(s) fora do prazo* de 24 horas.\nFavor vistoriar hoje e destinar no CEBI: confirmado → Vazamento de Água · outro setor → encaminha · não confirmado → baixa c/ justificativa.\n\n⚠️ Após a vistoria, a NS tem *48h contratuais* (Edital 001/2024, TR seção 5) para executar a partir do acatamento — a vistoria em 24h garante o atendimento ao munícipe em até 72h.`;
  wh += `<div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.35);border-radius:8px;padding:12px;margin-bottom:10px">`;
  wh += `<div style="font-size:11px;color:#6EE7B7;font-weight:700;margin-bottom:6px">MENSAGEM GERAL (todos os setores)</div>`;
  wh += `<div style="font-size:12px;white-space:pre-wrap;color:#E8EDF4;background:#0D1424;padding:10px;border-radius:6px">${msgGeral}</div>`;
  wh += `<button class="btn" style="margin-top:8px;padding:6px 14px;font-size:11px" onclick="copiar(this, ${JSON.stringify(JSON.stringify(msgGeral))})">📋 Copiar</button></div>`;
  Object.keys(porSetorCob).sort().forEach(s=>{
    const os_ = porSetorCob[s].sort((a,b)=>b.dias-a.dias);
    let msg = `*${nomeSetor[s]||('SETOR '+s)}* — vistorias fora do prazo de 24h:\n`;
    os_.forEach(o=>{ msg += `• OS ${o.os} — ${o.dias.toFixed(0)} dias — ${o.endereco.slice(0,40)}, ${o.bairro.slice(0,22)}\n`; });
    wh += `<div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.35);border-radius:8px;padding:12px;margin-bottom:10px">`;
    wh += `<div style="font-size:11px;color:#FCA5A5;font-weight:700;margin-bottom:6px">${nomeSetor[s]||('SETOR '+s)} — ${os_.length} vistoria(s)</div>`;
    wh += `<div style="font-size:12px;white-space:pre-wrap;color:#E8EDF4;background:#0D1424;padding:10px;border-radius:6px">${msg}</div>`;
    wh += `<button class="btn" style="margin-top:8px;padding:6px 14px;font-size:11px" onclick="copiar(this, ${JSON.stringify(JSON.stringify(msg))})">📋 Copiar</button></div>`;
  });
  if(prox.length){
    let msg2 = '*VENCE AMANHÃ — ATENÇÃO:*\n';
    prox.sort((a,b)=>b.dias-a.dias).forEach(o=>{ msg2 += `• OS ${o.os} — ${nomeSetor[o.setor||0]||'S'+(o.setor||0)} — ${o.dias.toFixed(1)}d — ${o.endereco.slice(0,38)}, ${o.bairro.slice(0,20)}\n`; });
    wh += `<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.35);border-radius:8px;padding:12px;margin-bottom:10px">`;
    wh += `<div style="font-size:11px;color:#FCD34D;font-weight:700;margin-bottom:6px">VENCE AMANHÃ (${prox.length})</div>`;
    wh += `<div style="font-size:12px;white-space:pre-wrap;color:#E8EDF4;background:#0D1424;padding:10px;border-radius:6px">${msg2}</div>`;
    wh += `<button class="btn" style="margin-top:8px;padding:6px 14px;font-size:11px" onclick="copiar(this, ${JSON.stringify(JSON.stringify(msg2))})">📋 Copiar</button></div>`;
  }
  document.getElementById('cobrancaVist').innerHTML = wh;
})();
function copiar(btn, texto){
  const t = JSON.parse(texto);
  if(navigator.clipboard){ navigator.clipboard.writeText(t).then(()=>{ btn.textContent='✅ Copiado!'; setTimeout(()=>btn.textContent='📋 Copiar', 2000); }); }
  else { const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); btn.textContent='✅ Copiado!'; setTimeout(()=>btn.textContent='📋 Copiar', 2000); }
}
