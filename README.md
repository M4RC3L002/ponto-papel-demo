# Ponto & Papel — demonstração pública

Papelaria fictícia para testar um sistema de vendas e estoque do portfólio de Marcelo Andrade. Esta versão é independente: não se conecta a banco de produção, não utiliza credenciais reais e não contém histórico Git do sistema original.

## Como testar

Entre sem cadastro. Os exemplos incluem produtos, serviços de impressão, vendas e estoque baixo. Use apenas dados fictícios. As alterações ficam no navegador; Restaurar exemplos repõe os dados iniciais. Os códigos DEMO001 a DEMO007 permitem testar o campo de leitura por teclado/Enter. Leitor físico depende do aparelho.

Teste vendas com Pix, dinheiro e cartão como simulações, desconto, troco, cancelamento com reposição de estoque, exclusão de vendas canceladas, cadastro/edição e exportação de comprovante/relatório em PDF. Não há cobrança, comunicação com banco, emissão fiscal ou envio automático de mensagens.

## Desenvolvimento

Node 22+, `npm ci`, `npm test`, `npm run build`, `npm start` (porta 3020). A Vercel serve dist. Nenhuma variável de ambiente necessária.

## Isolamento

Persistência local em `ponto-papel-demo-v1`, perfil demo@example.invalid, produtos e clientes inventados. Nenhum SDK Supabase, endereço de produção ou chave é incluído. CSP bloqueia conexões externas. A marca e os ativos visuais foram substituídos por vetores próprios. Os PDFs são identificados como demonstração sem validade fiscal.

Valores armazenados em centavos. Validações de estoque, preço, desconto e versão; venda idempotente e cancelamento idempotente; limite de 500 itens/vendas de teste. Web Locks serializa alterações entre abas compatíveis; sem suporte a essa API, evite edições simultâneas em abas distintas. Demonstração local, sem garantia de operação comercial.

