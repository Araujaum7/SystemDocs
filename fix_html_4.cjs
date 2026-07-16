const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacements = [
    [/Usu\uFFFDrios/g, 'Usuários'],
    [/usu\uFFFDrio/g, 'usuário'],
    [/Usu\uFFFDrio/g, 'Usuário'],
    [/Vis\uFFFDo/g, 'Visão'],
    [/Gera\uFFFD\uFFFDo/g, 'Geração'],
    [/Gera\uFFFDo/g, 'Geração'],
    [/A\uFFFD\uFFFDes/g, 'Ações'],
    [/A\uFFFDes/g, 'Ações'],
    [/A\uFFFDo/g, 'Ação'],
    [/R\uFFFDpidas/g, 'Rápidas'],
    [/Informa\uFFFD\uFFFDes/g, 'Informações'],
    [/Informa\uFFFDes/g, 'Informações'],
    [/Aten\uFFFD\uFFFDo/g, 'Atenção'],
    [/Aten\uFFFDo/g, 'Atenção'],
    [/Hist\uFFFDrico/g, 'Histórico'],
    [/P\uFFFDgina/g, 'Página'],
    [/Configura\uFFFD\uFFFDes/g, 'Configurações'],
    [/Configura\uFFFDes/g, 'Configurações'],
    [/Exclu\uFFFDdos/g, 'Excluídos'],
    [/Exclu\uFFFDdo/g, 'Excluído'],
    [/C\uFFFDdigo/g, 'Código'],
    [/Pr\uFFFDximo/g, 'Próximo'],
    [/Administra\uFFFD\uFFFDo/g, 'Administração'],
    [/Administra\uFFFDo/g, 'Administração'],
    [/padr\uFFFDo/g, 'padrão'],
    [/Padr\uFFFDo/g, 'Padrão'],
    [/N\uFFFDo/g, 'Não'],
    [/n\uFFFDo/g, 'não'],
    [/Op\uFFFD\uFFFDes/g, 'Opções'],
    [/Op\uFFFDes/g, 'Opções'],
    [/M\uFFFDs/g, 'Mês'],
    [/m\uFFFDs/g, 'mês'],
    [/Voc\uFFFD/g, 'Você'],
    [/voc\uFFFD/g, 'você'],
    [/J\uFFFD/g, 'Já'],
    [/j\uFFFD/g, 'já'],
    [/At\uFFFD/g, 'Até'],
    [/at\uFFFD/g, 'até'],
    [/S\uFFFD/g, 'Só'],
    [/s\uFFFD/g, 'só'],
    [/tamb\uFFFDm/g, 'também'],
    [/Tamb\uFFFDm/g, 'Também'],
    [/al\uFFFDm/g, 'além'],
    [/Al\uFFFDm/g, 'Além'],
    [/dispon\uFFFDveis/g, 'disponíveis'],
    [/selecion\uFFFDveis/g, 'selecionáveis'],
    [/pr\uFFFDticos/g, 'práticos'],
    [/\uFFFDltimos/g, 'Últimos'],
    [/Governan\uFFFDa/g, 'Governança'],
    [/<span class="emoji">\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD<\/span><span>Usu\uFFFDrios<\/span>/g, '<span class="emoji">👨‍💼</span><span>Usuários</span>'],
    [/<span class="emoji">\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD<\/span><span>Usuários<\/span>/g, '<span class="emoji">👨‍💼</span><span>Usuários</span>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span><span>Dashboard<\/span>/g, '<span class="emoji">📊</span><span>Dashboard</span>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span><span>Clientes<\/span>/g, '<span class="emoji">👥</span><span>Clientes</span>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span><span>Documentos<\/span>/g, '<span class="emoji">📝</span><span>Documentos</span>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span><span>Templates<\/span>/g, '<span class="emoji">📑</span><span>Templates</span>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span><span>Empresas<\/span>/g, '<span class="emoji">🏢</span><span>Empresas</span>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span>Sair do Sistema/g, '<span class="emoji">🚪</span>Sair do Sistema'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span>\r\n\s*<h2>DocSystem<\/h2>/g, '<span class="emoji">📄</span>\r\n                    <h2>DocSystem</h2>'],
    [/<span class="emoji">\uFFFD\uFFFD<\/span>\n\s*<h2>DocSystem<\/h2>/g, '<span class="emoji">📄</span>\n                    <h2>DocSystem</h2>'],
    [/<div class="user-avatar"><span class="emoji">\uFFFD\uFFFD<\/span><\/div>/g, '<div class="user-avatar"><span class="emoji">👤</span></div>'],
    [/class="sidebar-toggle">\uFFFD/g, 'class="sidebar-toggle">☰'],
    [/class="mobile-sidebar-toggle">\uFFFD/g, 'class="mobile-sidebar-toggle">☰'],
];

for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    for (const [badRegex, good] of replacements) {
        content = content.replace(badRegex, good);
    }
    
    fs.writeFileSync(p, content, 'utf8');
}
console.log('HTML encoding fixed (FFFD replaced with literal regex)');
