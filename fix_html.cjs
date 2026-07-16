const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacements = {
    'Viso': 'Visão',
    'usurio': 'usuário',
    'Usurios': 'Usuários',
    'Usurio': 'Usuário',
    'Administrao': 'Administração',
    'Aes': 'Ações',
    'Rpidas': 'Rápidas',
    'Gerao': 'Geração',
    'Informaes': 'Informações',
    'Ateno': 'Atenção',
    'Histrico': 'Histórico',
    'Pgina': 'Página',
    'Configuraes': 'Configurações',
    'Excludos': 'Excluídos',
    'Cdigo': 'Código',
    'Prximo': 'Próximo',
    '<span class="emoji">??</span><span>Dashboard</span>': '<span class="emoji">📊</span><span>Dashboard</span>',
    '<span class="emoji">??</span><span>Clientes</span>': '<span class="emoji">👥</span><span>Clientes</span>',
    '<span class="emoji">??</span><span>Documentos</span>': '<span class="emoji">📝</span><span>Documentos</span>',
    '<span class="emoji">??</span><span>Templates</span>': '<span class="emoji">📑</span><span>Templates</span>',
    '<span class="emoji">??</span><span>Empresas</span>': '<span class=\"emoji\">🏢</span><span>Empresas</span>',
    '<span class="emoji">?????</span><span>Usuários</span>': '<span class="emoji">👨‍💼</span><span>Usuários</span>',
    '<span class="emoji">??</span>Sair do Sistema': '<span class="emoji">🚪</span>Sair do Sistema',
    '<span class="emoji">??</span>\r\n                    <h2>DocSystem</h2>': '<span class="emoji">📄</span>\r\n                    <h2>DocSystem</h2>',
    '<span class="emoji">??</span>\n                    <h2>DocSystem</h2>': '<span class="emoji">📄</span>\n                    <h2>DocSystem</h2>',
    '<div class="user-avatar"><span class="emoji">??</span></div>': '<div class="user-avatar"><span class="emoji">👤</span></div>',
    'class="sidebar-toggle">?': 'class="sidebar-toggle">☰',
    'class="mobile-sidebar-toggle">?': 'class="mobile-sidebar-toggle">☰',
    'Voc ': 'Você ',
    'voc ': 'você '
};

for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    for (const [bad, good] of Object.entries(replacements)) {
        content = content.split(bad).join(good);
    }
    
    // specific fixes that might be broken by regex
    content = content.replace(/Usurios/g, 'Usuários');
    content = content.replace(/Administrao/g, 'Administração');
    
    fs.writeFileSync(p, content, 'utf8');
}
console.log('HTML encoding fixed');
