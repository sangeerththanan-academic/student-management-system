const fs=require('fs'), zlib=require('zlib');
const f='docs/08_change_management/CR-019/CR-020_Implementation_Report_JFICT24_19.pdf'; const b=fs.readFileSync(f), s=b.toString('latin1'); const obj=new Map();
for(const m of s.matchAll(/(\d+)\s+(\d+)\s+obj\b([\s\S]*?)endobj/g)) obj.set(+m[1],m[3]);
console.log('objects',obj.size,'pdf pages',([...obj.values()].filter(x=>/\/Type\s*\/Page\b/.test(x)).length));
for(const [n,o] of obj){ if(/\/Type\s*\/Page\b/.test(o)) console.log('PAGE',n, o.replace(/\s+/g,' ').slice(0,800)); }
for(const [n,o] of obj){ if(/\/Type\s*\/Font\b/.test(o)){const u=o.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/); console.log('FONT',n,o.replace(/\s+/g,' ').slice(0,240),'toUnicode',u&&u[1]);}}
