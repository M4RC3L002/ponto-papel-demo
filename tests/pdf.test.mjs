import test from 'node:test';import assert from 'node:assert/strict';
import {jsPDF} from 'jspdf';import {createReport,createReceipt} from '../src/report.js';import {createSeed} from '../src/demo-store.js';
test('relatório e comprovante PDF são gerados e identificados como demonstração',()=>{
 const data=createSeed(),report=createReport(jsPDF,data,null),receipt=createReceipt(jsPDF,data.sales[0]);
 assert.match(report.output(),/^%PDF/);assert.match(receipt.output(),/^%PDF/);
 assert.match(report.internal.pages.flat().join('\n'),/DEMONSTRACAO/);assert.match(receipt.internal.pages.flat().join('\n'),/DEMONSTRACAO/);
 assert.doesNotMatch(report.output(),/Local Papelaria/);
});
test('relatório extenso pagina sem perder a identificação de demonstração',()=>{
 const data=createSeed();data.products=Array.from({length:180},(_,i)=>({...data.products[i%10],name:'Produto fictício '+i+' com descrição longa para testar a paginação'}));
 const doc=createReport(jsPDF,data,null);assert.ok(doc.getNumberOfPages()>1);
 for(const page of doc.internal.pages.slice(1))assert.match(page.join('\n'),/DEMONSTRACAO/);
});

