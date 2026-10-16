export const STORAGE_KEY='ponto-papel-demo-v1';
const copy=value=>JSON.parse(JSON.stringify(value));
const fail=(message,code='P0001')=>{throw Object.assign(new Error(message),{code});};
const integer=(n,min=0,max=100000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function createSeed(now=new Date()){
 const date=(days,hours)=>{const d=new Date(now);d.setDate(d.getDate()-days);d.setHours(hours,20,0,0);return d.toISOString();};
 const product=(id,name,category,price,cost,stock,barcode='',type='product')=>({id,name,category,price,cost,stock,barcode,type,version:1});
 const products=[product('p-caderno','Caderno espiral 96 folhas','Papelaria',1890,980,22,'DEMO001'),product('p-caneta','Caneta azul','Papelaria',250,90,48,'DEMO002'),product('p-lapis','Lápis grafite HB','Papelaria',180,60,35,'DEMO003'),product('p-marca','Marca-texto pastel','Papelaria',690,280,4,'DEMO004'),product('p-papel','Resma A4 500 folhas','Escritório',2890,1750,12,'DEMO005'),product('p-pasta','Pasta organizadora','Escritório',1290,620,8,'DEMO006'),product('p-chaveiro','Chaveiro criativo','Acessórios',990,380,3,'DEMO007'),product('s-pb','Impressão preto e branco','Impressões',100,25,0,'','service'),product('s-cor','Impressão colorida','Impressões',300,80,0,'','service'),product('s-enc','Encadernação simples','Impressões',1200,450,0,'','service')];
 const item=(id,qty)=>{const p=products.find(p=>p.id===id);return {id:p.id,name:p.name,type:p.type,category:p.category,price:p.price,cost:p.cost,qty};};
 const sale=(number,days,hours,client,payment,items,discount=0)=>{const subtotal=items.reduce((n,i)=>n+i.price*i.qty,0);return {id:'demo-sale-'+number,request:'demo-request-'+number,number,date:date(days,hours),client,payment,items,discount,total:subtotal-discount,received:subtotal-discount,cancelled:false};};
 return {version:1,nextNumber:1004,products,sales:[sale(1003,0,10,'Cliente Exemplo A','Pix',[item('p-caderno',1),item('p-caneta',2)]),sale(1002,1,15,'Cliente Exemplo B','Dinheiro',[item('s-pb',12),item('s-enc',1)]),sale(1001,3,11,'Consumidor fictício','Cartão de débito',[item('p-pasta',2)],100)]};
}
function validState(s){
 return s&&s.version===1&&integer(s.nextNumber,1)&&Array.isArray(s.products)&&s.products.length<=500&&Array.isArray(s.sales)&&s.sales.length<=500&&s.products.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=100&&typeof p.category==='string'&&integer(p.stock)&&integer(p.price,1)&&integer(p.cost)&&integer(p.version,1)&&['product','service'].includes(p.type))&&s.sales.every(s=>typeof s.id==='string'&&Array.isArray(s.items)&&integer(s.total)&&integer(s.number,1)&&!Number.isNaN(Date.parse(s.date)));
}
export function createDemoStore(storage=globalThis.localStorage,now=()=>new Date()){
 let memory;
 function write(state){
  if(!validState(state))fail('Os dados de teste excedem os limites da demonstração.');
  try{storage?.setItem(STORAGE_KEY,JSON.stringify(state));}catch{fail('O navegador não conseguiu salvar. Libere espaço ou habilite o armazenamento local.');}
  memory=copy(state);
 }
 function read(){
  let raw;try{raw=storage?.getItem(STORAGE_KEY);}catch{fail('Habilite o armazenamento local para testar a loja.');}
  if(raw){try{const state=JSON.parse(raw);if(validState(state))return state;}catch{}}
  const seed=memory||createSeed(now());write(seed);return copy(seed);
 }
 function reset(){const seed=createSeed(now());write(seed);return copy(seed);}
 function snapshot(){const {products,sales}=read();return copy({products,sales});}
 function call(name,args={}){
  const state=read();
  if(name==='lp_snapshot')return snapshot();
  if(name==='lp_save_product'){
   const p=args.p_item||{},old=state.products.find(x=>x.id===p.id);
   if(typeof p.id!=='string'||p.id.length>100||!['product','service'].includes(p.type)||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||typeof p.category!=='string'||!p.category.trim()||p.category.length>50||!integer(p.price,1)||!integer(p.cost)||!integer(p.stock))fail('Confira os dados do item.');
   const barcode=String(p.barcode||'').trim();if(barcode.length>80)fail('Código de barras muito longo.');
   if(barcode&&state.products.some(x=>x.id!==p.id&&x.barcode===barcode))fail('Este código de barras já existe.','23505');
   if(old&&old.version!==args.p_version)fail('O item foi alterado em outra aba. Atualize o catálogo.');
   if(old&&old.type!==p.type)fail('O tipo de um item existente não pode ser alterado.');
   if(!old&&state.products.length>=500)fail('Limite de 500 itens de teste. Restaure os exemplos.');
   const saved={id:p.id,name:p.name.trim(),category:p.category.trim(),type:p.type,price:p.price,cost:p.cost,stock:p.type==='service'?0:p.stock,barcode,version:(old?.version||0)+1};
   state.products=old?state.products.map(p=>p.id===saved.id?saved:p):[...state.products,saved];write(state);return copy(saved);
  }
  if(name==='lp_checkout'){
   if(typeof args.p_request!=='string'||args.p_request.length>100)fail('Requisição inválida.');
   const previous=state.sales.find(s=>s.request===args.p_request);if(previous)return copy(previous);
   if(!Array.isArray(args.p_items)||!args.p_items.length||args.p_items.length>100)fail('Confira os itens da sacola.');
   if(state.sales.length>=500)fail('Limite de 500 vendas de teste. Restaure os exemplos.');
   if(!['Pix','Dinheiro','Cartão de débito','Cartão de crédito'].includes(args.p_payment))fail('Forma de pagamento inválida.');
   const seen=new Set();const items=args.p_items.map(i=>{
    const p=state.products.find(p=>p.id===i.id);if(!p||seen.has(i.id)||!integer(i.qty,1,100000)||p.price!==i.price)fail('O catálogo mudou. Revise a sacola.');seen.add(i.id);
    if(p.type==='product'&&i.qty>p.stock)fail('Estoque insuficiente para '+p.name+'.');
    return {id:p.id,name:p.name,type:p.type,category:p.category,price:p.price,cost:p.cost,qty:i.qty};
   });
   const subtotal=items.reduce((n,i)=>n+i.price*i.qty,0);
   if(!integer(subtotal)||!integer(args.p_discount)||args.p_discount>subtotal)fail('Desconto inválido.');
   const total=subtotal-args.p_discount;
   if(!integer(args.p_received)||args.p_received<total)fail('Valor recebido insuficiente.');
   const sale={id:'demo-'+crypto.randomUUID(),request:args.p_request,number:state.nextNumber++,date:now().toISOString(),client:String(args.p_client||'').slice(0,100),payment:args.p_payment,items,discount:args.p_discount,total,received:args.p_received,cancelled:false};
   items.forEach(i=>{const p=state.products.find(p=>p.id===i.id);if(p.type==='product'){p.stock-=i.qty;p.version++;}});
   state.sales.unshift(sale);write(state);return copy(sale);
  }
  if(name==='lp_cancel_sale'){
   const sale=state.sales.find(s=>s.id===args.p_id);if(!sale)fail('Venda não encontrada.');if(sale.cancelled)return copy(sale);
   sale.items.forEach(i=>{const p=state.products.find(p=>p.id===i.id);if(p?.type==='product'){p.stock+=i.qty;p.version++;}});sale.cancelled=true;write(state);return copy(sale);
  }
  if(name==='lp_delete_cancelled_sale'){
   const sale=state.sales.find(s=>s.id===args.p_id);if(!sale?.cancelled)fail('Somente vendas canceladas podem ser apagadas.');
   state.sales=state.sales.filter(s=>s.id!==sale.id);write(state);return true;
  }
  fail('Operação indisponível nesta demonstração.');
 }
 return {call,snapshot,reset};
}
