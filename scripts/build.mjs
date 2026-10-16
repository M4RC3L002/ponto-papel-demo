import {mkdir,copyFile,readFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const name of ['index.html','styles.css','logo.svg','icon.svg','manifest.webmanifest'])await copyFile('public/'+name,'dist/'+name);
for(const name of ['app.js','demo-store.js','report.js'])await copyFile('src/'+name,'dist/'+name);
await copyFile('node_modules/jspdf/dist/jspdf.umd.min.js','dist/jspdf.js');
const source=await readFile('dist/app.js','utf8');if(/supabase|__SUPABASE_|logo-local|Local Papelaria|fetch\(/i.test(source))throw new Error('Referência indevida encontrada no build.');
console.log('Demonstração estática criada em dist, sem backend ou variáveis de produção.');

