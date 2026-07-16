const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacements = [
    [/usu\uFFFDrios/gi, 'usuários'],
    [/usu\uFFFDrio/gi, 'usuário'],
    [/vis\uFFFDo/gi, 'visão'],
    [/gera\uFFFD\uFFFDo/gi, 'geração'],
    [/gera\uFFFDo/gi, 'geração'],
    [/a\uFFFD\uFFFDes/gi, 'ações'],
    [/a\uFFFDes/gi, 'ações'],
    [/a\uFFFDo/gi, 'ação'],
    [/r\uFFFDpidas/gi, 'rápidas'],
    [/informa\uFFFD\uFFFDes/gi, 'informações'],
    [/informa\uFFFDes/gi, 'informações'],
    [/aten\uFFFD\uFFFDo/gi, 'atenção'],
    [/aten\uFFFDo/gi, 'atenção'],
    [/hist\uFFFDrico/gi, 'histórico'],
    [/p\uFFFDgina/gi, 'página'],
    [/configura\uFFFD\uFFFDes/gi, 'configurações'],
    [/configura\uFFFDes/gi, 'configurações'],
    [/exclu\uFFFDdos/gi, 'excluídos'],
    [/exclu\uFFFDdo/gi, 'excluído'],
    [/c\uFFFDdigo/gi, 'código'],
    [/pr\uFFFDximo/gi, 'próximo'],
    [/administra\uFFFD\uFFFDo/gi, 'administração'],
    [/administra\uFFFDo/gi, 'administração'],
    [/padr\uFFFDo/gi, 'padrão'],
    [/n\uFFFDo/gi, 'não'],
    [/op\uFFFD\uFFFDes/gi, 'opções'],
    [/op\uFFFDes/gi, 'opções'],
    [/m\uFFFDs/gi, 'mês'],
    [/voc\uFFFD/gi, 'você'],
    [/j\uFFFD/gi, 'já'],
    [/at\uFFFD/gi, 'até'],
    [/s\uFFFD\s/gi, 'só '],
    [/tamb\uFFFDm/gi, 'também'],
    [/al\uFFFDm/gi, 'além'],
    [/dispon\uFFFDveis/gi, 'disponíveis'],
    [/selecion\uFFFDveis/gi, 'selecionáveis'],
    [/pr\uFFFDticos/gi, 'práticos'],
    [/\uFFFDltimos/gi, 'Últimos'],
    [/governan\uFFFDa/gi, 'governança'],
    [/clientes \uFFFD templates/g, 'Clientes x templates'],
    [/\uFFFDÚltimos/gi, 'Últimos'], // For the double error `Últimos`
];

for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Some case preservation logic
    for (const [badRegex, good] of replacements) {
        content = content.replace(badRegex, (match) => {
            // Very simple case preservation: if match starts with upper, return capitalized good
            if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase() && match[0] !== '\uFFFD') {
                return good.charAt(0).toUpperCase() + good.slice(1);
            }
            if (match.includes('Ú') || match.includes('U')) {
                return 'Últimos';
            }
            return good;
        });
    }
    
    fs.writeFileSync(p, content, 'utf8');
}
console.log('HTML encoding fixed case-insensitive');
