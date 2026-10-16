import http from 'node:http';import {readFile} from 'node:fs/promises';import path from 'node:path';
const port=Number(process.env.PORT||3020),root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Não encontrado');}}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));

