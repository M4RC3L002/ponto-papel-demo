// Browser and Node share this renderer, so pagination can be verified without store writes.
export function createReport(jsPDF, data, logo, now = new Date()) {
  const doc = new jsPDF({unit:'mm',format:'a4',compress:true});
  const cash = v => (Number(v || 0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' ');
  const clean = value => String(value ?? '').replace(/[\u0000-\u001f]/g,' ').replace(/[^\u0020-\u00ff]/g,'?');
  let y = 20;
  function page(){const font=doc.getFont(),size=doc.getFontSize(),color=doc.getTextColor();doc.addPage();y=20;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(110);doc.text('Ponto & Papel | Relatório da loja',16,12);doc.setFont(font.fontName,font.fontStyle);doc.setFontSize(size);doc.setTextColor(color);}
  function space(h){if(y+h>278)page();}
  function text(value, size=10, bold=false, color=65){
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);
    const lines=doc.splitTextToSize(clean(value),178);
    for(const line of lines){space(size*.45+2);doc.text(line,16,y);y+=size*.45+1;}
  }
  function section(title){space(18);y+=5;doc.setFillColor(251,232,217);doc.roundedRect(16,y-4,178,10,2,2,'F');text(title,12,true);y+=6;}
  function row(values,widths,header=false){
    doc.setFont('helvetica',header?'bold':'normal');doc.setFontSize(9);doc.setTextColor(65);
    const cells=values.map((v,i)=>doc.splitTextToSize(clean(v),widths[i]-5));
    const count=Math.max(...cells.map(c=>c.length));
    // Split unusually long cells across pages rather than clipping them.
    for(let line=0;line<count;line++){
      space(5);let x=16;
      if(header){doc.setFillColor(244,244,244);doc.rect(16,y-3.6,178,5,'F');}
      cells.forEach((c,i)=>{doc.text(c[line]||'',x+2,y);x+=widths[i]});y+=4.5;
    }
    doc.setDrawColor(230);doc.line(16,y,194,y);y+=3;
  }
  doc.setProperties({title:'Ponto & Papel - Relatório da loja',author:'Ponto & Papel'});
  if(logo){doc.addImage(logo,'JPEG',16,12,36,27.44);y=47;}
  text('Relatório da loja',22,true);text('Emitido em '+now.toLocaleString('pt-BR'),9,false,110);
  text('Todos os produtos e vendas disponíveis na data da exportação.',9,false,110);
  const valid=data.sales.filter(s=>!s.cancelled),cancelled=data.sales.length-valid.length;
  section('Resumo');
  row(['Vendas concluídas',String(valid.length),'Total vendido',cash(valid.reduce((n,s)=>n+s.total,0))],[52,26,50,50]);
  row(['Vendas canceladas',String(cancelled),'Itens no catálogo',String(data.products.length)],[52,26,50,50]);
  text('Vendas canceladas não compõem o total vendido. DEMONSTRACAO - SEM VALIDADE FISCAL.',9,false,110);
  section('Produtos e serviços');
  if(!data.products.length)text('Nenhum produto ou serviço cadastrado.');
  else{
    row(['Item / categoria','Tipo','Preço','Custo','Estoque'],[70,25,28,28,27],true);
    for(const p of data.products)row([p.name+' / '+p.category,p.type==='service'?'Serviço':'Produto',cash(p.price),cash(p.cost),p.type==='service'?'-':String(p.stock)],[70,25,28,28,27]);
  }
  section('Vendas detalhadas');
  if(!data.sales.length)text('Nenhuma venda registrada.');
  for(const s of data.sales){
    space(35);text('Venda #'+String(s.number).padStart(4,'0')+' | '+(s.cancelled?'CANCELADA':'Concluída'),12,true);
    text(new Date(s.date).toLocaleString('pt-BR')+' | '+(s.client||'Consumidor'),9);
    text('Pagamento: '+s.payment,9);
    row(['Descrição','Quantidade','Unitário','Subtotal'],[91,27,30,30],true);
    for(const i of s.items)row([i.name,String(i.qty),cash(i.price),cash(i.price*i.qty)],[91,27,30,30]);
    text('Desconto: '+cash(s.discount)+' | Total: '+cash(s.total),10,true);
    if(s.payment==='Dinheiro')text('Recebido: '+cash(s.received)+' | Troco: '+cash(s.received-s.total),9);
    y+=5;
  }
  const pages=doc.getNumberOfPages();
  for(let n=1;n<=pages;n++){doc.setPage(n);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(125);doc.text('Ponto & Papel - DEMONSTRACAO - SEM VALIDADE FISCAL',16,289);doc.text(n+' / '+pages,194,289,{align:'right'});}
  return doc;
}



export function createReceipt(jsPDF, sale) {
  const width=320,margin=22,content=width-margin*2;
  const measure=new jsPDF({unit:'pt',format:[width,500]});
  const clean=v=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/[^\u0020-\u00ff]/g,'?');
  const cash=v=>(Number(v||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' ');
  const commands=[];let y=26;
  function text(value,size=11,bold=false,align='left'){
    measure.setFont('helvetica',bold?'bold':'normal');measure.setFontSize(size);
    for(const line of measure.splitTextToSize(clean(value),content)){
      commands.push({kind:'text',line,size,bold,align,y});y+=size*1.4;
    }
  }
  function rule(){y+=8;commands.push({kind:'line',y});y+=16;}
  text('Ponto & Papel',21,true,'center');text('DEMONSTRACAO - DADOS FICTICIOS',9,true,'center');text('SEM VALIDADE FISCAL',9,false,'center');y+=14;
  if(sale.cancelled){text('VENDA CANCELADA',12,true,'center');y+=8;}
  text('Venda #'+String(sale.number).padStart(4,'0'),11,true);
  text(new Date(sale.date).toLocaleString('pt-BR'),10);
  text('Cliente: '+(sale.client||'Consumidor'));rule();
  for(const item of sale.items){text(item.name,11,true);text(item.qty+' x '+cash(item.price)+' = '+cash(item.qty*item.price),10);rule();}
  text('Desconto: '+cash(sale.discount));y+=5;text('Total: '+cash(sale.total),18,true);rule();
  text('Pagamento: '+sale.payment);
  if(sale.payment==='Dinheiro'){text('Recebido: '+cash(sale.received));text('Troco: '+cash(sale.received-sale.total));}
  y+=20;text('Obrigada pela preferência!',11,true,'center');text('Pequenos detalhes, grandes ideias.',9,false,'center');
  // Custom paper follows the content; unusually long receipts continue on compact pages.
  const height=Math.max(360,Math.min(y+20,2000)),usable=height-48;
  const doc=new jsPDF({unit:'pt',format:[width,height],orientation:'portrait',compress:true});
  doc.setProperties({title:'Comprovante Ponto & Papel #'+sale.number,author:'Ponto & Papel'});
  let currentPage=0;
  for(const c of commands){const page=Math.floor((c.y-26)/usable);while(currentPage<page){doc.addPage([width,height]);currentPage++;}const cy=c.y-page*usable;
    if(c.kind==='line'){doc.setDrawColor(220);doc.line(margin,cy,width-margin,cy);}
    else{doc.setTextColor(65);doc.setFont('helvetica',c.bold?'bold':'normal');doc.setFontSize(c.size);doc.text(c.line,c.align==='center'?width/2:margin,cy,{align:c.align});}
  }
  return doc;
}

