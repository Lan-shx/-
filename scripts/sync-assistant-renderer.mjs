import {copyFile,readFile,writeFile} from 'node:fs/promises';
const entries=[['markdown-it','dist/browser/markdown-it.umd.min.js','vendor-markdown-it.js'],['dompurify','dist/purify.min.js','vendor-dompurify.js']];
const licenses=[];
for(const [pkg,src,dest]of entries){const info=JSON.parse(await readFile('node_modules/'+pkg+'/package.json','utf8'));await copyFile('node_modules/'+pkg+'/'+src,'public/'+dest);licenses.push(pkg+' '+info.version+'\n'+await readFile('node_modules/'+pkg+'/LICENSE','utf8'));}
await writeFile('public/assistant-rendering-LICENSE.txt',licenses.join('\n\n--------------------\n\n'));
console.log('Assistant rendering assets synchronized');
