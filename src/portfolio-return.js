export const PORTFOLIO_URLS=Object.freeze({escuro:'https://marcelo-andrade-portfolio-virid.vercel.app/#projetos',slush:'https://marcelo-andrade-portfolio-slush.vercel.app/#sl-projetos'});
export function resolvePortfolioReturn(search,storage){
 const valid=value=>value==='slush'||value==='escuro';
 const requested=new URLSearchParams(search).get('portfolio');
 let saved;try{saved=storage?.getItem('demo-portfolio-origin');}catch{}
 const origin=valid(requested)?requested:valid(saved)?saved:'escuro';
 if(valid(requested))try{storage?.setItem('demo-portfolio-origin',origin);}catch{}
 return PORTFOLIO_URLS[origin];
}
