// PARSER PDF CEBI v5 — agrupa linhas por tolerância de Y (como pdfplumber)
const TIPOS_CEBI = [
  'Vazamento de Água','Vistoria de Vazamento de Água','Vazamento de Esgoto',
  'Fiscalização de Irregularidade/Fraude','Comunicação de vazamento no cavalete/UMA',
  'Regularização de Ligação - Fiscalização','Pressão Baixa','Reclamação de falta de água',
  'Verificação de Serviços Pendentes - Manut. Água'
];
const RUÍDO = /(Página\s*\d|Total de|Setor da|SEMAE|CNPJ|Rua Otto|Ordens de|Periodo|gerenciamento|^Endereço$|^Serviço$|^Bairro$|^Nro$|^CDC$|^Tipo Chamado$|^Solicitante$|^O\.S\.$|^Data$|52\.561\.214)/;

function coluna(x){
  if(x<60) return 'os';
  if(x<130) return 'cdc';
  if(x<250) return 'sol';
  if(x<378) return 'tipo';
  if(x<528) return 'end';
  if(x<625) return 'bairro';
  if(x<705) return 'data';
  return 'serv';
}
const quitar = s => s.replace(RUÍDO,' ').replace(/\s+/g,' ').trim();

// Agrupar itens em linhas visuais por proximidade de Y (tolerância ~6px)
function agruparLinhas(items){
  // Agrupa por NÚMERO DE OS: cada número de 10 dígitos (x<60) inicia um registro.
  // A linha da OS + continuações ficam numa janela de y: [y_os - 7, y_os + 1] (pdf.js).
  const ordenados = items.slice().sort((a,b)=> (b.y-a.y) || (a.x-b.x));
  const registros=[];
  let atual=null;
  for(const it of ordenados){
    if(/^\d{10}$/.test(it.s) && it.x<60){
      if(atual) registros.push(atual);
      atual={y:it.y, itens:[{x:it.x,s:it.s}]};
    } else if(atual && it.y <= atual.y+1 && it.y >= atual.y-7){
      atual.itens.push({x:it.x,s:it.s});
    }
  }
  if(atual) registros.push(atual);
  return registros;
}
async function lerPdfCebi(file){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: buf}).promise;
  let linhas = [];
  for(let i=1;i<=pdf.numPages;i++){
    const pg = await pdf.getPage(i);
    const tc = await pg.getTextContent();
    const items = [];
    for(const it of tc.items){
      const s = (it.str||'').trim();
      if(!s) continue;
      items.push({y: it.transform[5], x: it.transform[4], s});
    }
    linhas = linhas.concat(agruparLinhas(items));
  }
  linhas.sort((a,b)=>b.y-a.y);
  return linhas;
}

function parsePdfCebi(linhas){
  const os = [];
  let atual = null;
  for(const linha of linhas){
    const itens = linha.itens;
    const idx = itens.findIndex(i=>/^\d{10}$/.test(i.s) && i.x<60);
    if(idx>=0){
      if(atual && atual.tipo) os.push(atual);
      atual = {os: itens[idx].s, cdc:'', sol:'', tipo:'', end:'', bairro:'', data:'', serv:''};
      for(const it of itens){
        if(it===itens[idx]) continue;
        const c = coluna(it.x);
        if(c==='os') continue;
        if(atual[c]!==undefined) atual[c] += (atual[c]?' ':'')+it.s;
      }
    } else if(atual){
      for(const it of itens){
        const c = coluna(it.x);
        if(c==='os'||c==='cdc') continue;
        if(atual[c]!==undefined) atual[c] += (atual[c]?' ':'')+it.s;
      }
    }
  }
  if(atual && atual.tipo) os.push(atual);

  return os.map(o=>{
    for(const k of ['cdc','sol','tipo','end','bairro','data','serv']) o[k]=quitar(o[k]);
    const md = o.data.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    o.abertura = md? (md[1]+' '+md[2]) : (o.data||'');
    // CLASSIFICAÇÃO POR CÓDIGO CEBI (à prova de texto embaralhado do PDF):
    // tipo chamado 1033 = Vistoria de Vazamento · 1077 = produto de pesquisa · 1 = Vazamento de Água
    let tipoReal;
    if(/\b1033\b/.test(o.tipo)) tipoReal = 'Vistoria de Vazamento de Água';
    else if(/\b1077\b/.test(o.tipo)) tipoReal = 'Vazamento de água produto de pesquisa';
    else {
      tipoReal = o.tipo.replace(/^\d+\s*[-–]\s*/,'').trim();
      let ok=false;
      for(const t of TIPOS_CEBI){ if(tipoReal.includes(t)){ ok=true; break; } }
      if(!ok){ for(const t of TIPOS_CEBI){ if(t.startsWith(tipoReal) || (tipoReal+' '+o.serv).includes(t)){ tipoReal=t; break; } } }
    }
    o.tipo = tipoReal;
    // Vistoria convertida: serviço virou "Vazamento de Água" (fiscal JÁ vistoriou)
    if(/vistoria/i.test(o.tipo) && o.serv && /vazamento/i.test(o.serv) && !/vistoria/i.test(o.serv)) o.sit='Convertida';
    else if(/vistoria/i.test(o.tipo)) o.sit='Nova';
    o.cdc = o.cdc.replace(/\D/g,'');
    return o;
  }).filter(o=>o.tipo && /^(Vazamento|Vistoria|Fiscalização|Comunicação|Regularização|Pressão|Reclamação|Verificação)/.test(o.tipo));
}