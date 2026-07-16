const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const r = '\\uFFFD';

const replacements = [
    [`Usu${r}rios`, 'Usuários'],
    [`usu${r}rio`, 'usuário'],
    [`Usu${r}rio`, 'Usuário'],
    [`Vis${r}o`, 'Visão'],
    [`Gera${r}${r}o`, 'Geração'],
    [`Gera${r}o`, 'Geração'],
    [`A${r}${r}es`, 'Ações'],
    [`A${r}es`, 'Ações'],
    [`A${r}o`, 'Ação'],
    [`R${r}pidas`, 'Rápidas'],
    [`Informa${r}${r}es`, 'Informações'],
    [`Informa${r}es`, 'Informações'],
    [`Aten${r}${r}o`, 'Atenção'],
    [`Aten${r}o`, 'Atenção'],
    [`Hist${r}rico`, 'Histórico'],
    [`P${r}gina`, 'Página'],
    [`Configura${r}${r}es`, 'Configurações'],
    [`Configura${r}es`, 'Configurações'],
    [`Exclu${r}dos`, 'Excluídos'],
    [`Exclu${r}do`, 'Excluído'],
    [`C${r}digo`, 'Código'],
    [`Pr${r}ximo`, 'Próximo'],
    [`Administra${r}${r}o`, 'Administração'],
    [`Administra${r}o`, 'Administração'],
    [`padr${r}o`, 'padrão'],
    [`Padr${r}o`, 'Padrão'],
    [`N${r}o`, 'Não'],
    [`n${r}o`, 'não'],
    [`Op${r}${r}es`, 'Opções'],
    [`Op${r}es`, 'Opções'],
    [`M${r}s`, 'Mês'],
    [`m${r}s`, 'mês'],
    [`Voc${r}`, 'Você'],
    [`voc${r}`, 'você'],
    [`J${r}`, 'Já'],
    [`j${r}`, 'já'],
    [`At${r}`, 'Até'],
    [`at${r}`, 'até'],
    [`S${r}`, 'Só'],
    [`s${r}`, 'só'],
    [`tamb${r}m`, 'também'],
    [`Tamb${r}m`, 'Também'],
    [`al${r}m`, 'além'],
    [`Al${r}m`, 'Além'],
    [`dispon${r}veis`, 'disponíveis'],
    [`selecion${r}veis`, 'selecionáveis'],
    [`pr${r}ticos`, 'práticos'],
    [`ltimos`, 'Últimos'],
    [`Governan${r}a`, 'Governança'],
    [`<span class="emoji">${r}${r}${r}${r}${r}</span><span>Usuários</span>`, '<span class="emoji">👨‍💼</span><span>Usuários</span>'],
    [`<span class="emoji">${r}${r}</span><span>Dashboard</span>`, '<span class="emoji">📊</span><span>Dashboard</span>'],
    [`<span class="emoji">${r}${r}</span><span>Clientes</span>`, '<span class="emoji">👥</span><span>Clientes</span>'],
    [`<span class="emoji">${r}${r}</span><span>Documentos</span>`, '<span class="emoji">📝</span><span>Documentos</span>'],
    [`<span class="emoji">${r}${r}</span><span>Templates</span>`, '<span class="emoji">📑</span><span>Templates</span>'],
    [`<span class="emoji">${r}${r}</span><span>Empresas</span>`, '<span class="emoji">🏢</span><span>Empresas</span>'],
    [`<span class="emoji">${r}${r}</span>Sair do Sistema`, '<span class="emoji">🚪</span>Sair do Sistema'],
    [`<span class="emoji">${r}${r}</span>\r\n                    <h2>DocSystem</h2>`, '<span class="emoji">📄</span>\r\n                    <h2>DocSystem</h2>'],
    [`<span class="emoji">${r}${r}</span>\n                    <h2>DocSystem</h2>`, '<span class="emoji">📄</span>\n                    <h2>DocSystem</h2>'],
    [`<div class="user-avatar"><span class="emoji">${r}${r}</span></div>`, '<div class="user-avatar"><span class="emoji">👤</span></div>'],
    [`class="sidebar-toggle">${r}`, 'class="sidebar-toggle">☰'],
    [`class="mobile-sidebar-toggle">${r}`, 'class="mobile-sidebar-toggle">☰'],
    // specific multi character fixes
    [``, ''] // fallback remove loose replacement chars if we missed some that break layout, though risky. Better just replace known ones.
];

for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    for (const [bad, good] of replacements) {
        if(bad !== '') {
            content = content.split(bad).join(good);
        }
    }
    
    fs.writeFileSync(p, content, 'utf8');
}
console.log('HTML encoding fixed (FFFD replaced)');
