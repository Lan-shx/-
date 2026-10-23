(function(){
'use strict';
const md=window.markdownit({html:false,breaks:true,linkify:false,typographer:false});
md.renderer.rules.image=(tokens,idx)=>md.utils.escapeHtml(tokens[idx].content||'图片');
const tags=['p','br','strong','em','s','del','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','pre','code','hr','table','thead','tbody','tr','th','td','a'];
function render(text,results=[]){
 const template=document.createElement('template');template.innerHTML=DOMPurify.sanitize(md.render(String(text||'')),{ALLOWED_TAGS:tags,ALLOWED_ATTR:['href','title','start'],ALLOW_DATA_ATTR:false});
 template.content.querySelectorAll('a').forEach(a=>{if(!a.getAttribute('href')||!/^https?:\/\//i.test(a.getAttribute('href'))){a.replaceWith(document.createTextNode(a.textContent));return;}a.target='_blank';a.rel='noopener noreferrer';});
 template.content.querySelectorAll('table').forEach(table=>{table.querySelectorAll('thead th').forEach(th=>th.scope='col');const wrap=document.createElement('div');wrap.className='ra-markdown-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','研究数据表，可横向滚动');table.before(wrap);wrap.append(table);});
 const known=new Set(results.map(r=>r.ref));const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){if(node.parentElement?.closest('code,pre,a,button')||!(/\[R\d+\]/.test(node.textContent)))continue;const fragment=document.createDocumentFragment();let cursor=0;for(const match of node.textContent.matchAll(/\[(R\d+)\]/g)){if(!known.has(match[1]))continue;fragment.append(document.createTextNode(node.textContent.slice(cursor,match.index)));const b=document.createElement('button');b.type='button';b.className='ra-ref';b.dataset.raRef=match[1];b.textContent='['+match[1]+'] 查看依据';fragment.append(b);cursor=match.index+match[0].length;}if(cursor){fragment.append(document.createTextNode(node.textContent.slice(cursor)));node.replaceWith(fragment);}}
 return template.innerHTML;
}
function avatar(role){const assistant='<rect x="5" y="7" width="14" height="12" rx="4"/><path d="M12 3v4m-4 8h8M3 11v4m18-4v4"/><circle cx="9" cy="11" r=".8" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r=".8" fill="currentColor" stroke="none"/>';const user='<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>';return '<span class="ra-avatar '+(role==='user'?'ra-avatar-user':'ra-avatar-assistant')+'" role="img" aria-label="'+(role==='user'?'你的头像':'研究助手头像')+'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(role==='user'?user:assistant)+'</svg></span>';}
window.ResearchMarkdown={render,avatar};
})();
