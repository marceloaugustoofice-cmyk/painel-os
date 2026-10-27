document.getElementById('cards').innerHTML =
 card('OS em aberto', total, 'backlog atual', 'c-navy') +
 card('Prioridade ALTA', porPrior.ALTA||0, '≥ '+C.lim_alta+' dias', porPrior.ALTA?'c-vermelho':'c-verde') +
 card('Execução >48h', execAtrasadas.length, 'prazo execução 48h', execAtrasadas.length?'c-vermelho':'c-verde') +
 card('Atrasadas ≥'+C.lim_atraso+'d', atrasadas.length, atrasadas.length?'COBRAR AGORA':'em dia', atrasadas.length?'c-vermelho':'c-verde') +
 card('Vistorias de vazamento', vistorias.length + vistConvertidas.length, vistorias.length + ' aguardando fiscal + ' + vistConvertidas.length + ' já vistoriadas', 'c-ciano') +
 card('Mais antiga', maisAntiga+'d', 'da divisão', maisAntiga>=C.lim_atraso?'c-vermelho':(maisAntiga>=C.lim_atraso-2?'c-dourado':'c-verde')) +
 card('Idade média', idadeMedia.toFixed(1)+'d', 'do backlog', 'c-branco') +
 card('Novas 7 dias', R.novas7d, 'entradas recentes', 'c-roxo') +
 card('Gatilho '+C.gatilho+' OS', total>=C.gatilho?'DISPARADO':'OK', 'limite operacional', total>=C.gatilho?'c-vermelho':'c-verde') +
 card('Vistorias fora do prazo', vistAtrasadas.length, 'prazo '+C.prazo_vistoria+' dias', vistAtrasadas.length?'c-vermelho':'c-verde') +
 card('Vaz. produto de pesquisa', pesq.length, 'da equipe de pesquisa', 'c-roxo') +
 card('Base total', R.total, R.concluidas+' concluídas · '+R.canceladas+' cancel.', 'c-branco');

/* ===== KPIs ===== */
function kpiBox(t,v,m,cls,barra){return `<div class="kpi-box ${cls}"><div class="t">${t}</div><div class="v">${v}</div><div class="m">${m}</div>${barra||''}</div>`}
const b3 = Math.min(I.ate3*100,100), bd = I.digital*100, br = Math.min(I.reab*100/C.meta_reab*100,100);
document.getElementById('kpis').innerHTML =
 kpiBox('% concluídas ≤ 3 dias', pct(I.ate3)+'%', I.ate3>=C.ref_mercado?'✅ dentro da faixa de mercado (54–70%)':'⚠️ abaixo da referência', I.ate3>=C.ref_mercado?'ok':'ruim',
  `<div class="barra-ext"><div style="width:${b3}%;background:${I.ate3>=C.ref_mercado?'#10B981':'#EF4444'}"></div></div>`) +
 kpiBox('MTTR — tempo médio de reparo', I.mttr.toFixed(1).replace('.',',')+' dias', 'menor é melhor', 'aten') +
 kpiBox('% retrabalho (reabertas)', pct(I.reab)+'%', I.reab<=C.meta_reab?'✅ dentro da meta (<5%)':'🔴 FORA DA META (<5%)', I.reab<=C.meta_reab?'ok':'ruim',
  `<div class="barra-ext"><div style="width:${br}%;background:#EF4444"></div></div>`) +
 kpiBox('% encaminhadas digitalmente', pct(I.digital)+'%', I.digital>=1?'✅ meta atingida':'🔴 meta 100% — campo vazio', I.digital>=1?'ok':'ruim',
  `<div class="barra-ext"><div style="width:${bd}%;background:#EF4444"></div></div>`) +
 kpiBox('Backlog própria × terceirizada', Math.round(I.propria*100)+'% × '+Math.round(I.terc*100)+'%', 'Redes Água × Norte Sul', 'aten') +
 kpiBox('Projeção p/ zerar backlog', D.produt.proj_dias.toFixed(1).replace('.',',')+' dias', 'média '+D.produt.concl_dia.toFixed(1).replace('.',',')+' conclusões/dia (30d)', 'ok');

/* ===== GRÁFICOS ===== */
const CORES=['#8B5CF6','#22D3EE','#EC4899','#10B981','#F59E0B','#FBBF24','#F97316','#6366F1'];
function prepCanvas(id){const c=document.getElementById(id); if(!c) return null;
 const dpr=window.devicePixelRatio||1; const w=Math.max(c.parentElement.clientWidth-36, 420), h=300;
 c.width=w*dpr; c.height=h*dpr; c.style.width=w+'px'; c.style.height=h+'px';
 const x=c.getContext('2d'); x.scale(dpr,dpr); x.clearRect(0,0,w,h); return {x,w,h};}
function eixos(x,w,h,padL,padB,padT,max,fmt){ x.strokeStyle='#2E2E33'; x.fillStyle='#9BA0A8'; x.font='10px Segoe UI';
 const steps=5, areaH=h-padT-padB;
 for(let i=0;i<=steps;i++){const v=max*i/steps, yy=padT+areaH-(areaH*i/steps);
  x.fillText(fmt?fmt(v):Math.round(v),4,yy+3);
  x.beginPath();x.moveTo(padL,yy);x.lineTo(w-14,yy);x.stroke();} return areaH;}
function barras(id, labels, valores, cores, opts){ const p=prepCanvas(id); if(!p) return; const {x,w,h}=p;
 const horizontal=opts&&opts.horizontal, fmt=opts&&opts.fmt;
 const temNeg = valores.some(v=>v<0);
 const max=(temNeg? Math.max(...valores.map(v=>Math.abs(v)),1) : Math.max(...valores,1))*1.12;
 const padL=horizontal?Math.min(210,w*0.48):46, padB=horizontal?20:44, padT=16;
 const areaW=w-padL-16, areaH=h-padT-padB;
 if(!horizontal){x.strokeStyle='#2E2E33';x.fillStyle='#9BA0A8';x.font='10px Segoe UI';
  if(temNeg){
   for(let i=-5;i<=5;i++){const v=max*i/5; if(i!==0&&Math.abs(v)<0.001)continue;
    const yy=padT+areaH/2-(areaH/2)*(v/max);
    x.fillText((v>0?'+':'')+Math.round(v),4,yy+3);
    x.beginPath();x.moveTo(padL,yy);x.lineTo(w-16,yy);x.stroke();}
  } else {
   for(let i=0;i<=5;i++){const v=max*i/5,yy=padT+areaH-(areaH*i/5);x.fillText(fmt?fmt(Math.round(v)):Math.round(v),4,yy+3);
    x.beginPath();x.moveTo(padL,yy);x.lineTo(w-16,yy);x.stroke();}}}
 const n=labels.length, slot=horizontal?areaH/n:areaW/n, barSize=(horizontal?slot*0.62:slot*0.55);
 labels.forEach((lb,i)=>{const v=valores[i],cor=cores[i%cores.length];
  if(horizontal){const y=padT+slot*i+(slot-barSize)/2, len=areaW*v/max;
   x.fillStyle=cor; x.fillRect(padL,y,len,barSize);
   x.fillStyle='#E8EDF4'; x.font='bold 12px Segoe UI'; x.fillText(fmt?fmt(v):v,padL+len+5,y+barSize/2+4);
   x.fillStyle='#C9CDD3'; x.font='bold 10px Segoe UI'; x.textAlign='right'; x.fillText(String(lb).slice(0,Math.floor(padL/5.6)),padL-8,y+barSize/2+4); x.textAlign='left';}
  else{const xx=padL+slot*i+(slot-barSize)/2;
   const zeroY = temNeg? padT+areaH/2 : padT+areaH;
   const hh=areaH/2*(Math.abs(v)/max);
   const yTop = v>=0? zeroY-hh : zeroY;
   const g=x.createLinearGradient(0,yTop,0,yTop+hh); g.addColorStop(0,cor); g.addColorStop(1,cor+'99');
   x.fillStyle=g; x.fillRect(xx,yTop,barSize,hh);
   if(opts&&opts.semLabels){} else {x.fillStyle='#E8EDF4'; x.font='bold 11px Segoe UI'; x.textAlign='center';
   x.fillText((fmt?fmt(v):((v>0?'+':'')+v)),xx+barSize/2, v>=0? yTop-5 : yTop+hh+12); x.textAlign='left';}
   x.fillStyle='#9BA0A8'; x.font='bold 9px Segoe UI'; x.fillStyle='#CBD5E1';
   if(n>=12&&i%3){} else {
   const maxChars=Math.max(6,Math.floor(slot/5.2));
   const parts=String(lb).slice(0,maxChars).split(' '); let line=lb.slice(0,maxChars); if(parts.length>2){line=parts.slice(0,2).join(' ')+'\n'+parts.slice(2).join(' ');}
   String(line).split('\n').forEach((L,li)=>x.fillText(L,xx+barSize/2,h-30+li*11));}
   x.textAlign='left';}});}
function pizza(id, labels, valores){ const p=prepCanvas(id); if(!p) return; const {x,w,h}=p;
 const tot=valores.reduce((a,b)=>a+b,0)||1, cx=w*0.28, cy=h/2, r=Math.min(w*0.24,h*0.38);
 let ang=-Math.PI/2;
 labels.forEach((lb,i)=>{const frac=valores[i]/tot; if(frac<=0)return;
  x.beginPath(); x.moveTo(cx,cy); x.arc(cx,cy,r,ang,ang+frac*2*Math.PI); x.closePath();
  x.fillStyle=CORES[i%CORES.length]; x.fill(); x.strokeStyle='#131C2E'; x.lineWidth=2; x.stroke();
  const ly=cy-r+ i*((2*r)/labels.length)+10;
  x.fillStyle=CORES[i%CORES.length]; x.fillRect(w*0.58,ly-10,14,14);
  x.fillStyle='#E8EDF4'; x.font='bold 11px Segoe UI';
  x.fillText(`${lb}: ${valores[i]} (${Math.round(frac*100)}%)`,w*0.58+20,ly+2); ang+=frac*2*Math.PI;});}
function linhas(id, labels, s1, s2, nome1, nome2){ const p=prepCanvas(id); if(!p) return; const {x,w,h}=p;
 const max=Math.max(...s1,...(s2||[0]),1)*1.15, padL=46, padB=52, padT=16;
 const areaW=w-padL-16, areaH=h-padT-padB;
 x.strokeStyle='#2E2E33'; x.fillStyle='#9BA0A8'; x.font='10px Segoe UI';
 for(let i=0;i<=5;i++){const v=max*i/5,yy=padT+areaH-(areaH*i/5);x.fillText(Math.round(v),4,yy+3);
  x.beginPath();x.moveTo(padL,yy);x.lineTo(w-16,yy);x.stroke();}
 const n=labels.length, px=i=>padL+(areaW*i/(n-1||1));
 // área s1
 x.beginPath(); x.moveTo(px(0),padT+areaH);
 s1.forEach((v,i)=>x.lineTo(px(i),padT+areaH-(areaH*v/max))); x.lineTo(px(n-1),padT+areaH); x.closePath();
 const g1=x.createLinearGradient(0,padT,0,padT+areaH); g1.addColorStop(0,'rgba(139,92,246,.25)'); g1.addColorStop(1,'rgba(139,92,246,.02)');
 x.fillStyle=g1; x.fill();
 function serie(vals,cor,nome){ x.beginPath(); vals.forEach((v,i)=>i?x.lineTo(px(i),padT+areaH-(areaH*v/max)):x.moveTo(px(i),padT+areaH-(areaH*v/max)));
  x.strokeStyle=cor; x.lineWidth=3; x.stroke();
  vals.forEach((v,i)=>{x.beginPath();x.arc(px(i),padT+areaH-(areaH*v/max),4,0,7);x.fillStyle=cor;x.fill();x.strokeStyle='#fff';x.lineWidth=1.5;x.stroke();});}
 serie(s1,'#8B5CF6',nome1); if(s2) serie(s2,'#22D3EE',nome2);
 x.fillStyle='#9BA0A8'; x.font='bold 9px Segoe UI'; x.fillStyle='#CBD5E1'; x.textAlign='center';
 x.font='bold 9px Segoe UI'; x.fillStyle='#CBD5E1';
 labels.forEach((lb,i)=>{if(i%2)return; x.textAlign='center'; x.fillText(String(lb),px(i),h-16);}); x.textAlign='left';
 // legenda
 x.font='bold 11px Segoe UI'; x.fillStyle='#8B5CF6'; x.fillRect(w-190,6,12,12); x.fillStyle='#C9CDD3'; x.fillText(nome1,w-174,16);
 if(s2){x.fillStyle='#22D3EE'; x.fillRect(w-70,6,12,12); x.fillStyle='#C9CDD3'; x.fillText(nome2,w-54,16);}}
function barrasDuplas(id, labels, v1, v2, n1, n2){ const p=prepCanvas(id); if(!p) return; const {x,w,h}=p;
 const max=Math.max(...v1,...v2,1)*1.15, padL=46, padB=44, padT=16;
 const areaW=w-padL-16, areaH=h-padT-padB;
 x.strokeStyle='#2E2E33'; x.fillStyle='#9BA0A8'; x.font='10px Segoe UI';
 for(let i=0;i<=5;i++){const v=max*i/5,yy=padT+areaH-(areaH*i/5);x.fillText(Math.round(v),4,yy+3);
  x.beginPath();x.moveTo(padL,yy);x.lineTo(w-16,yy);x.stroke();}
 const n=labels.length, slot=areaW/n, bw=slot*0.32;
 labels.forEach((lb,i)=>{const cx=padL+slot*i+slot/2;
  const h1=areaH*v1[i]/max, h2=areaH*v2[i]/max;
  const g1=x.createLinearGradient(0,padT+areaH-h1,0,padT+areaH); g1.addColorStop(0,'#8B5CF6'); g1.addColorStop(1,'#8B5CF699');
  x.fillStyle=g1; x.fillRect(cx-bw-2,padT+areaH-h1,bw,h1);
  const g2=x.createLinearGradient(0,padT+areaH-h2,0,padT+areaH); g2.addColorStop(0,'#22D3EE'); g2.addColorStop(1,'#22D3EE99');
  x.fillStyle=g2; x.fillRect(cx+2,padT+areaH-h2,bw,h2);
  if(v1[i]>0){x.fillStyle='#8B5CF6';x.font='bold 10px Segoe UI';x.textAlign='center';x.fillText(v1[i],cx-bw/2-2,padT+areaH-h1-4);}
  if(v2[i]>0){x.fillStyle='#22D3EE';x.font='bold 10px Segoe UI';x.fillText(v2[i],cx+bw/2+2,padT+areaH-h2-4);}
  x.fillStyle='#9BA0A8'; x.font='bold 9px Segoe UI'; x.fillStyle='#CBD5E1';
  if(n<=10||i%2===0) x.fillText(lb,cx,h-16); x.textAlign='left';});
 x.font='bold 11px Segoe UI'; x.fillStyle='#8B5CF6'; x.fillRect(w-200,6,12,12); x.fillStyle='#C9CDD3'; x.fillText(n1,w-184,16);
 x.fillStyle='#22D3EE'; x.fillRect(w-80,6,12,12); x.fillStyle='#C9CDD3'; x.fillText(n2,w-64,16);}

const fmtData = s => { const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/); return m? m[3]+'/'+m[2] : String(s).slice(0,5); };
const fmtDia = s => { const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/); return m? m[3] : '' };
function renderGraficos(){
 const pk=Object.keys(porPrior);
 barras('gPrior',pk,pk.map(k=>porPrior[k]),['#EF4444','#8B5CF6','#22D3EE']);
 const sk=Object.keys(porSetor);
 barras('gSetor',sk,sk.map(k=>porSetor[k]),CORES);
 pizza('gAging',Object.keys(porAging),Object.values(porAging));
 const tipos=Object.entries(porTipo).sort((a,b)=>b[1]-a[1]);
 const coresTipo = tipos.map(t=>/pesquisa/i.test(t[0])?'#A855F7':/vistoria/i.test(t[0])?'#FBBF24':/esgoto/i.test(t[0])?'#EC4899':'#F59E0B');
 barras('gTipo',tipos.map(t=>t[0].length>34?t[0].slice(0,33)+'…':t[0]),tipos.map(t=>t[1]),coresTipo,true);
 // fluxo: barras duplas lado a lado (mais claro que linhas sobrepostas)
 const ent=D.entradas.slice(1), con=D.conclusoes.slice(1);
 const diasF=ent.map(e=>fmtData(e[0]));
 barrasDuplas('gFluxo',diasF,ent.map(e=>e[1]),con.map(c=>c[1]),'Entradas','Conclusões');
 const saldos=ent.map((e,i)=>con[i][1]-e[1]);
 barras('gSaldo',diasF,saldos,saldos.map(s=>s>=0?'#10B981':'#EF4444'),{fmt:v=>(v>0?'+':'')+v,semLabels:true});
 // produtividade
 document.getElementById('prodBox').innerHTML=`
  <table>
   <tr><th>Indicador</th><th>Valor</th></tr>
   <tr><td>Média de conclusões/dia (30d)</td><td><b>${D.produt.concl_dia.toFixed(1).replace('.',',')}</b></td></tr>
   <tr><td>Backlog atual</td><td><b>${total} OS</b></td></tr>
   <tr><td>Projeção p/ zerar backlog</td><td><b>${D.produt.proj_dias.toFixed(1).replace('.',',')} dias</b></td></tr>
   <tr><td>MTTR</td><td><b>${I.mttr.toFixed(1).replace('.',',')} dias</b></td></tr>
   <tr><td>Novas nos últimos 7 dias</td><td><b>${R.novas7d}</b></td></tr>
   <tr><td>Vistorias pendentes do fiscal</td><td><b>${vistorias.length}</b></td></tr>
  </table>`;
 const bk=Object.keys(D.backlog_sem).slice(1);
 barras('gBackSem',bk,bk.map(k=>D.backlog_sem[k]),['#FDE68A','#FCD34D','#F59E0B','#F97316','#A855F7','#7C3AED']);
 barras('gSetores2',sk,sk.map(k=>porSetor[k]),CORES);
 const dk=Object.keys(porDepto);
 barras('gDepto',dk.map(d=>d.length>30?d.slice(0,29)+'…':d),dk.map(k=>porDepto[k]),CORES,true);
 // território
 const bk2=Object.keys(D.bairros_hist).slice(1);
 barras('gBairros',bk2.map(b=>b.length>22?b.slice(0,21)+'…':b),bk2.map(k=>D.bairros_hist[k]),CORES,true);
 const abc=D.abc.slice(1);
 barras('gABC',abc.map(a=>a[0].length>20?a[0].slice(0,19)+'…':a[0]),abc.map(a=>Math.round(a[2]*100)),['#7C3AED','#8B5CF6','#A855F7','#C084FC','#D8B4FE','#E9D5FF','#F0ABFC','#F5D0FE'],{fmt:v=>v+'%'});
 pizza('gGeofone',Object.keys(D.geofone).slice(1),Object.values(D.geofone).slice(1));
 const ck=Object.keys(D.top_cdc).slice(1);
 barras('gCdc',ck,ck.map(k=>D.top_cdc[k]),['#F59E0B','#F97316','#A855F7','#EC4899','#3B82F6','#06B6D4','#10B981','#8B5CF6']);
 // mapa de calor geral (entradas por bairro × semana)
 let cal='<table class="calor"><tr><th>Bairro</th>'+D.calor[0].slice(1).map(h2=>'<th>'+h2+'</th>').join('')+'</tr>';
 const mx=Math.max(...D.calor.slice(1).flatMap(r=>r.slice(1).map(Number)),1);
 D.calor.slice(1).forEach(r=>{
  cal+='<tr><td>'+r[0]+'</td>'+r.slice(1).map(v=>{const f=Number(v)/mx;
   const cor=f>0.75?'#7C3AED':f>0.5?'#8B5CF6':f>0.25?'#A855F7':f>0?'#C084FC':'#1E293B';
   const txt=f>0?'#fff':'#64748B';
   return `<td style="background:${cor};color:${txt};font-weight:800">${v}</td>`;}).join('')+'</tr>';});
 document.getElementById('tabCalor').innerHTML=cal+'</table>';
 // MAPA DE SETORES: bairros agrupados por setor (1-4) com nº de OS em aberto
 const nomeFiscal={1:'Hugo',2:'Massaroto',3:'Pedro Frois',4:'Moisés'};
 const corSetor={1:'#3B82F6',2:'#F59E0B',3:'#10B981',4:'#EC4899'};
 let sm='';
 [1,2,3,4].forEach(s=>{
  const bairros=D.setor_bairros[String(s)]||{};
  const lista=Object.keys(bairros).sort((a,b)=>bairros[b]-bairros[a]);
  const totB=lista.reduce((t,b)=>t+bairros[b],0);
  const vp=(D.vist_pend_setor||{})[String(s)]||0;
  sm+=`<div class="painel" style="border-top:3px solid ${corSetor[s]};margin-bottom:16px">`;
  sm+=`<h3 style="color:${corSetor[s]}">SETOR ${s} — fiscal ${nomeFiscal[s]} · ${lista.length} bairros · ${totB} OS em aberto · ${vp} vistoria(s) pendente(s)</h3>`;
  sm+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">';
  lista.forEach(b=>{
   const n=bairros[b];
   const bg=n>0?'rgba(239,68,68,.18)':'rgba(148,163,184,.10)';
   const bd=n>0?'rgba(239,68,68,.45)':'rgba(148,163,184,.25)';
   sm+=`<span style="display:inline-block;padding:5px 10px;border-radius:6px;font-size:11px;background:${bg};border:1px solid ${bd};color:#E8EDF4">${b}${n>0?' <b style="color:#F87171">'+n+'</b>':''}</span>`;
  });
  sm+='</div></div>';
 });
 document.getElementById('mapaSetores').innerHTML=sm;
 // CALOR DE VISTORIAS: bairro × dia
 const cv=D.calor_vist||{dias:[],rows:[]};
 let cvh='<table class="calor"><tr><th>Bairro</th>'+cv.dias.map(d2=>'<th>'+d2+'</th>').join('')+'<th>Setor</th><th>Pendentes</th></tr>';
 const mxv=Math.max(...cv.rows.flatMap(r=>r.slice(1,cv.dias.length+1).map(Number)),1);
 cv.rows.forEach(r=>{
  cvh+='<tr><td>'+r[0]+'</td>';
  r.slice(1,cv.dias.length+1).forEach(v=>{const f=Number(v)/mxv;
   const cor=f>0.66?'#F59E0B':f>0.33?'#FBBF24':f>0?'#FDE68A':'#1E293B';
   const txt=f>0.5?'#0D1424':'#E8EDF4';
   cvh+=`<td style="background:${cor};color:${txt};font-weight:800">${v}</td>`;});
  cvh+=`<td style="background:#1E293B;color:#93C5FD;font-weight:700">${r[cv.dias.length+1]?'SETOR '+r[cv.dias.length+1]:'—'}</td>`;
  cvh+=`<td style="background:#1E293B;color:${r[cv.dias.length+2]>0?'#F87171':'#64748B'};font-weight:800">${r[cv.dias.length+2]}</td></tr>`;
 });
 cvh+='</table>';
 document.getElementById('calorVist').innerHTML=cvh;
}
try{ renderGraficos(); }catch(e){ console.warn('erro grafico:', e.message); }
window.addEventListener('resize', function(){ try{ renderGraficos(); }catch(e){} });


/* ===== VAZAMENTOS EXECUTADOS (aba p12) ===== */
(function(){
  const EV = D.execvaz || {meses:[],atrasadas:[],meta:8};
  const meta = EV.meta || 8;
  // cards
  const ultimo = EV.meses[EV.meses.length-1] || {taxa:0,tm_atr:0,tot:0,atr:0};
  const dentro = ultimo.taxa <= meta;
  document.getElementById('execCards').innerHTML =
   '<div class="q4">'+
   '<div class="card '+(dentro?'c-verde':'c-vermelho')+'"><div class="lbl">Taxa de atraso (mês atual)</div><div class="val">'+ultimo.taxa.toFixed(1).replace('.',',')+'%</div><div class="det">'+(dentro?'✅ dentro da meta ≤ '+meta+'%':'🔴 acima da meta ≤ '+meta+'%')+'</div></div>'+
   '<div class="card c-navy"><div class="lbl">Executadas no mês</div><div class="val">'+ultimo.tot+'</div><div class="det">'+ultimo.atr+' em atraso</div></div>'+
   '<div class="card c-dourado"><div class="lbl">Tempo médio do atraso</div><div class="val">'+ultimo.tm_atr.toFixed(1).replace('.',',')+'d</div><div class="det">média das OS em atraso</div></div>'+
   '<div class="card c-branco"><div class="lbl">Total executado (base)</div><div class="val">'+EV.total_exec+'</div><div class="det">vazamentos de água concluídos</div></div>'+
   '</div>';
  // gráfico taxa por mês
  const lb = EV.meses.map(m=>m.mes), tx = EV.meses.map(m=>m.taxa);
  const p = prepCanvas('gExecTaxa'); if(p){ const {x,w,h}=p;
   const max = Math.max(...tx, meta+2)*1.15, padL=46, padB=44, padT=16;
   const areaW=w-padL-16, areaH=h-padT-padB;
   x.strokeStyle='#2E2E33'; x.fillStyle='#9BA0A8'; x.font='10px Segoe UI';
   for(let i2=0;i2<=5;i2++){const v=max*i2/5,yy=padT+areaH-(areaH*i2/5);x.fillText(Math.round(v)+'%',4,yy+3);
    x.beginPath();x.moveTo(padL,yy);x.lineTo(w-16,yy);x.stroke();}
   const n=lb.length, slot=areaW/n, bw=slot*0.5;
   // linha da meta
   const yMeta = padT+areaH-(areaH*meta/max);
   x.strokeStyle='#EF4444'; x.setLineDash([6,4]); x.beginPath(); x.moveTo(padL,yMeta); x.lineTo(w-16,yMeta); x.stroke(); x.setLineDash([]);
   x.fillStyle='#F87171'; x.font='bold 10px Segoe UI'; x.fillText('META '+meta+'%',w-90,yMeta-5);
   lb.forEach((lb2,i2)=>{const v=tx[i2], cx=padL+slot*i2+slot/2;
    const hh=areaH*v/max, yTop=padT+areaH-hh;
    const cor = v<=meta ? '#10B981' : '#EF4444';
    const g=x.createLinearGradient(0,yTop,0,yTop+hh); g.addColorStop(0,cor); g.addColorStop(1,cor+'99');
    x.fillStyle=g; x.fillRect(cx-bw/2,yTop,bw,hh);
    x.fillStyle='#fff'; x.font='bold 11px Segoe UI'; x.textAlign='center';
    x.fillText(v.toFixed(1).replace('.',',')+'%',cx,yTop-5);
    x.fillStyle='#CBD5E1'; x.font='bold 9px Segoe UI'; x.fillText(lb2,cx,h-16); x.textAlign='left';});
  }
  // gráfico volume
  const p2 = prepCanvas('gExecVol'); if(p2){ const {x,w,h}=p2;
   const tot=EV.meses.map(m=>m.tot), atr=EV.meses.map(m=>m.atr);
   const max = Math.max(...tot,1)*1.15, padL=46, padB=44, padT=16;
   const areaW=w-padL-16, areaH=h-padT-padB;
   x.strokeStyle='#2E2E33'; x.fillStyle='#9BA0A8'; x.font='10px Segoe UI';
   for(let i2=0;i2<=5;i2++){const v=max*i2/5,yy=padT+areaH-(areaH*i2/5);x.fillText(Math.round(v),4,yy+3);
    x.beginPath();x.moveTo(padL,yy);x.lineTo(w-16,yy);x.stroke();}
   const n=lb.length, slot=areaW/n, bw=slot*0.32;
   lb.forEach((lb2,i2)=>{const cx=padL+slot*i2+slot/2;
    const h1=areaH*tot[i2]/max, h2=areaH*atr[i2]/max;
    const g1=x.createLinearGradient(0,padT+areaH-h1,0,padT+areaH); g1.addColorStop(0,'#8B5CF6'); g1.addColorStop(1,'#8B5CF699');
    x.fillStyle=g1; x.fillRect(cx-bw-2,padT+areaH-h1,bw,h1);
    const g2=x.createLinearGradient(0,padT+areaH-h2,0,padT+areaH); g2.addColorStop(0,'#EF4444'); g2.addColorStop(1,'#EF444499');
    x.fillStyle=g2; x.fillRect(cx+2,padT+areaH-h2,bw,h2);
    if(tot[i2]>0){x.fillStyle='#C9CDD3';x.font='bold 10px Segoe UI';x.textAlign='center';x.fillText(tot[i2],cx-bw/2-2,padT+areaH-h1-4);}
    if(atr[i2]>0){x.fillStyle='#F87171';x.font='bold 10px Segoe UI';x.fillText(atr[i2],cx+bw/2+2,padT+areaH-h2-4);}
    x.fillStyle='#CBD5E1'; x.font='bold 9px Segoe UI'; x.fillStyle='#CBD5E1';
    if(n<=10||i2%2===0) x.fillText(lb2,cx,h-16); x.textAlign='left';});
   x.font='bold 11px Segoe UI'; x.fillStyle='#8B5CF6'; x.fillRect(w-200,6,12,12); x.fillStyle='#C9CDD3'; x.fillText('Executadas',w-184,16);
   x.fillStyle='#EF4444'; x.fillRect(w-80,6,12,12); x.fillStyle='#C9CDD3'; x.fillText('Em atraso',w-64,16);
  }
  // comparativo mesma data de corte
  const CMP = EV.comparativo || [];
  let t = '<table><tr><th>Período</th><th>Executadas</th><th>Em atraso</th><th>Taxa de atraso</th><th>Tempo médio do atraso</th><th>vs meta ≤8%</th></tr>';
  CMP.forEach((c,i)=>{
   const dentro = c.taxa <= meta;
   const anterior = i>0 ? CMP[i-1].taxa : null;
   const delta = (anterior!==null && anterior>0) ? Math.round(100*(c.taxa-anterior)/anterior) : null;
   let vs = dentro ? '<span class="tag baixa">✅ DENTRO</span>' : '<span class="tag sim">🔴 FORA</span>';
   if(delta!==null) vs += ' <small style="color:#9BA0A8">('+(delta<=0?'':'+')+delta+'% vs período anterior)</small>';
   t += '<tr><td><b>'+c.periodo+'</b></td><td>'+c.tot+'</td><td>'+c.atr+'</td>'+
        '<td><b style="color:'+(dentro?'#34D399':'#F87171')+'">'+c.taxa.toFixed(1).replace('.',',')+'%</b></td>'+
        '<td>'+c.tm.toFixed(1).replace('.',',')+'d</td><td>'+vs+'</td></tr>';
  });
  t += '</table>';
  document.getElementById('tabComparativo').innerHTML = t;
})();
/* ===== TABELAS ===== */
try{ renderGraficos(); }catch(e){ console.warn('erro grafico:', e.message); }
window.addEventListener('resize', function(){ try{ renderGraficos(); }catch(e){} });

/* ===== TABELAS ===== */
function tagPrior(p){return `<span class="tag ${p==='ALTA'?'alta':p==='MÉDIA'?'media':'baixa'}">${p}</span>`}
document.getElementById('tabOS').innerHTML =
 '<tr><th>O.S.</th><th>Abertura</th><th>Setor</th><th>Departamento</th><th>Bairro</th><th>Endereço</th><th>Dias</th><th>Prior.</th><th>Execução 48h</th><th>Atrasada?</th><th>Situação</th></tr>' +
 [...OS].sort((a,b)=>b.dias-a.dias).map(o=>
  `<tr><td><b>${o.os}</b></td><td>${o.abertura}</td><td>${o.setor?'SETOR '+o.setor:'—'}</td><td>${o.depto||'—'}</td><td>${o.bairro}</td><td>${o.endereco}</td><td><b>${o.dias}</b></td><td>${tagPrior(o.prior)}</td><td>${(/vazamento/i.test(o.tipo)&&!/pesquisa|vistoria/i.test(o.tipo)&&o.dias>=C.prazo_execucao)?'<span class="tag sim">FORA 48H</span>':''}</td><td>${o.atr?'<span class="tag sim">SIM</span>':''}</td><td>${o.sit}</td></tr>`).join('');

const vistOrd = [...vistorias].sort((a,b)=>b.dias-a.dias);
document.getElementById('tabVist').innerHTML =
 '<table><tr><th>O.S.</th><th>Abertura</th><th>Bairro</th><th>Endereço</th><th>Dias na fila</th><th>Prazo ('+C.prazo_vistoria+'d)</th><th>Status</th></tr>' +
 vistOrd.map(o=>{
  const restam = C.prazo_vistoria - o.dias;
  const st = o.dias>=C.prazo_vistoria ? '<span class="tag sim">FORA DO PRAZO</span>'
    : restam<=1 ? '<span class="tag media">VENCE AMANHÃ</span>'
    : `<span class="tag baixa">NO PRAZO (${restam.toFixed(1).replace('.',',')}d)</span>`;
  return `<tr><td><b>${o.os}</b></td><td>${o.abertura}</td><td>${o.bairro}</td><td>${o.endereco}</td><td><b>${o.dias}</b></td><td>${st}</td></tr>`;
 }).join('') +
 '</table>' + (vistorias.length? '' : '<p style="color:#34D399;font-weight:700">✅ Nenhuma vistoria pendente.</p>')
 + (vistConvertidas.length? '<h3 style="font-size:12px;color:#E2E8F0;text-transform:uppercase;letter-spacing:.7px;margin:16px 0 8px">✅ Vistorias JÁ REALIZADAS pelo fiscal — convertidas em Vazamento de Água (aguardam execução): '+vistConvertidas.length+'</h3>'
    + '<table><tr><th>O.S.</th><th>Abertura</th><th>Bairro</th><th>Endereço</th><th>Dias desde o evento</th></tr>'
    + [...vistConvertidas].sort((a,b)=>b.dias-a.dias).map(o=>`<tr><td><b>${o.os}</b></td><td>${o.abertura}</td><td>${o.bairro}</td><td>${o.endereco}</td><td>${o.dias}</td></tr>`).join('')+'</table>'
    : '');

const pesqOrd = [...pesq].sort((a,b)=>b.dias-a.dias);
document.getElementById('tabPesq').innerHTML =
 '<table><tr><th>O.S.</th><th>Abertura</th><th>Bairro</th><th>Endereço</th><th>Dias</th><th>Solicitante</th></tr>' +
 pesqOrd.map(o=>`<tr><td><b>${o.os}</b></td><td>${o.abertura}</td><td>${o.bairro}</td><td>${o.endereco}</td><td><b>${o.dias}</b></td><td>${o.sol||'—'}</td></tr>`).join('') +
 '</table>' + (pesq.length? '' : '<p style="color:#34D399;font-weight:700">✅ Nenhum vazamento de pesquisa em aberto.</p>');

let hs='<table><tr><th>Setor</th><th>OS em aberto</th><th>Atrasadas</th><th>Pre-alerta (5-9d)</th><th>Mais antiga</th></tr>';
Object.keys(porSetor).forEach(s=>{
 const ds = OS.filter(o=>(o.setor?'SETOR '+o.setor:'Sem setor')===s);
 const atr = ds.filter(o=>o.atr).length, pre = ds.filter(o=>o.dias>=5&&o.dias<10).length;
 const mx = ds.length?Math.max(...ds.map(o=>o.dias)):0;
 hs+=`<tr><td><b>${s}</b></td><td>${ds.length}</td><td>${atr?`<span class="tag sim">${atr}</span>`:'—'}</td><td>${pre||'—'}</td><td>${mx}d</td></tr>`;});
document.getElementById('tabSetores').innerHTML=hs+'</table>';

let hd='<table><tr><th>Departamento atual</th><th>OS em aberto</th><th>% do backlog</th></tr>';
Object.entries(porDepto).sort((a,b)=>b[1]-a[1]).forEach(([d,n])=>{
 hd+=`<tr><td>${d}</td><td><b>${n}</b></td><td>${Math.round(n/total*100)}%</td></tr>`;});
document.getElementById('tabDepto').innerHTML=hd+'</table>';

document.getElementById('pauta').innerHTML = `
 <table>
  <tr><th>#</th><th>Ponto da pauta</th><th>Valor</th></tr>
  <tr><td>1</td><td>Situação geral do backlog</td><td><b>${total} OS em aberto</b></td></tr>
  <tr><td>2</td><td>OS atrasadas por setor (cada setor explica e apresenta plano)</td><td><b>${atrasadas.length}</b></td></tr>
  <tr><td>3</td><td>Idade média do backlog</td><td><b>${idadeMedia.toFixed(1)} dias</b></td></tr>
  <tr><td>4</td><td>Vistorias aguardando fiscal</td><td><b>${vistorias.length}</b></td></tr>
  <tr><td>5</td><td>OS mais antiga da divisão</td><td><b>${maisAntiga} dias</b></td></tr>
  <tr><td>6</td><td>Retrabalho (reabertas) — meta &lt; 5%</td><td><b>${pct(I.reab)}%</b></td></tr>
  <tr><td>7</td><td>Entradas × conclusões (14 dias)</td><td><b>${D.entradas.reduce((s,e)=>s+e[1],0)} × ${D.conclusoes.reduce((s,c)=>s+c[1],0)}</b></td></tr>
 </table>
 <div class="alerta ${total<C.regra6?'amarelo':'verde'}" style="margin-top:14px">
  ${total<C.regra6?'⚠️ REGRA ATIVA: backlog abaixo de '+C.regra6+' OS — cada setor deve apresentar PELO MENOS 6 SERVIÇOS DE MANUTENÇÃO do seu setor (concluídos ou em andamento, com local e situação).':'Backlog ≥ '+C.regra6+' OS — regra dos 6 serviços não aplicável nesta semana.'}
 </div>`;