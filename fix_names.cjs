const fs = require('fs');
const path = require('path');
const dir = 'frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (let f of files) {
    const p = path.join(dir, f);
    let txt = fs.readFileSync(p, 'utf8');
    
    // Replace all occurrences of n\uFFFDome, n?ome, etc. We can just use a regex for n.ome where . is not o, but it's easier to just match exactly the weird characters.
    // Or just manually fix the exact strings. 
    // nome = n\ufffdome
    
    txt = txt.replace(/n\uFFFDome/g, 'nome');
    txt = txt.replace(/n\uFFFDova/g, 'nova');
    txt = txt.replace(/nome/g, 'nome');
    txt = txt.replace(/nova/g, 'nova');

    // Also, if any of them are still broken in some visual way, let's just find `name="n*ome"`
    txt = txt.replace(/name="n[^o]ome"/g, 'name="nome"');
    txt = txt.replace(/id="n[^o]ome"/g, 'id="nome"');
    
    txt = txt.replace(/name="n[^o]ovaSenha"/g, 'name="novaSenha"');
    txt = txt.replace(/id="n[^o]ovaSenha"/g, 'id="novaSenha"');
    txt = txt.replace(/for="n[^o]ovaSenha"/g, 'for="novaSenha"');
    
    fs.writeFileSync(p, txt, 'utf8');
}
console.log('Fixed names');
