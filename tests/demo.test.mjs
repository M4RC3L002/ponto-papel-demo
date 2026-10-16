import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDemoStore,STORAGE_KEY} from '../src/demo-store.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const make=()=>createDemoStore(storage(),()=>new Date('2026-10-16T15:00:00Z'));
const request=(id='request-1')=>({p_request:id,p_items:[{id:'p-caderno',qty:2,price:1890},{id:'s-pb',qty:3,price:100}],p_discount:100,p_payment:'Dinheiro',p_received:5000,p_client:'Cliente de teste'});
test('venda idempotente, cálculo em centavos e baixa apenas de produtos',()=>{
 const store=make(),before=store.snapshot(),sale=store.call('lp_checkout',request());
 assert.equal(sale.total,3980);assert.equal(sale.received-sale.total,1020);
 assert.equal(store.snapshot().products.find(p=>p.id==='p-caderno').stock,before.products.find(p=>p.id==='p-caderno').stock-2);
 assert.equal(store.snapshot().products.find(p=>p.id==='s-pb').stock,0);
 assert.equal(store.call('lp_checkout',request()).id,sale.id);assert.equal(store.snapshot().sales.length,4);
});
test('estoque, preço alterado, descontos e dinheiro insuficiente não gravam parcialmente',()=>{
 const store=make(),before=store.snapshot();
 for(const bad of [{...request(),p_items:[{id:'p-caderno',qty:1000,price:1890}]},{...request(),p_items:[{id:'p-caderno',qty:1,price:1}]},{...request(),p_discount:99999},{...request(),p_received:1}])assert.throws(()=>store.call('lp_checkout',bad));
 assert.deepEqual(store.snapshot(),before);
});
test('cancelamento repõe estoque uma vez e exclusão exige cancelamento',()=>{
 const store=make(),before=store.snapshot(),sale=store.call('lp_checkout',request());
 assert.throws(()=>store.call('lp_delete_cancelled_sale',{p_id:sale.id}));
 store.call('lp_cancel_sale',{p_id:sale.id});store.call('lp_cancel_sale',{p_id:sale.id});
 assert.equal(store.snapshot().products.find(p=>p.id==='p-caderno').stock,before.products.find(p=>p.id==='p-caderno').stock);
 store.call('lp_delete_cancelled_sale',{p_id:sale.id});assert.equal(store.snapshot().sales.length,3);
});
test('edição usa versão, códigos únicos e valores válidos',()=>{
 const store=make(),p=store.snapshot().products[0];
 const saved=store.call('lp_save_product',{p_item:{...p,stock:30},p_version:p.version});assert.equal(saved.version,p.version+1);
 assert.throws(()=>store.call('lp_save_product',{p_item:{...p,stock:31},p_version:p.version}));
 assert.throws(()=>store.call('lp_save_product',{p_item:{...p,id:'new',barcode:'DEMO002'}}));
 assert.throws(()=>store.call('lp_save_product',{p_item:{...p,id:'new',price:-1}}));
});
test('dados persistem no mesmo navegador, isolam outro armazenamento e podem ser restaurados',()=>{
 const shared=storage(),a=createDemoStore(shared),b=createDemoStore(shared),other=make();
 a.call('lp_checkout',request());assert.equal(b.snapshot().sales.length,4);assert.equal(other.snapshot().sales.length,3);
 b.reset();assert.equal(a.snapshot().sales.length,3);shared.setItem(STORAGE_KEY,'corrompido');assert.equal(a.snapshot().products.length,10);
});
test('falha de armazenamento não confirma venda nem altera o estado',()=>{
 const s=storage(),store=createDemoStore(s);store.snapshot();const before=store.snapshot();s.setItem=()=>{throw new Error('quota');};
 assert.throws(()=>store.call('lp_checkout',request()),/salvar/);assert.deepEqual(store.snapshot(),before);
});
test('artefato público não carrega backend, marca original ou credenciais',async()=>{
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(app,/supabase|createClient|sb_secret_|__SUPABASE_|logo-local|Local Papelaria|fetch\(/i);
 assert.doesNotMatch(app,/type="password"|signInWithPassword/);
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.match(config.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value,/connect-src 'none'/);
});
