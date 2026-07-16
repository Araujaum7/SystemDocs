const fs = require('fs');
const files = fs.readdirSync('frontend').filter(f => f.endsWith('.html'));
for(let f of files) { 
  let txt = fs.readFileSync('frontend/' + f, 'utf8'); 
  txt = txt.replace(/\uFFFD/g, ''); 
  fs.writeFileSync('frontend/' + f, txt, 'utf8'); 
}
console.log('Cleaned');
