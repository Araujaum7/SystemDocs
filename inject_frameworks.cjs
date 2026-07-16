const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const headInjection = `
    <!-- Frameworks (Phosphor Icons & Tailwind) -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        corePlugins: { preflight: false }
      }
    </script>
</head>`;

const iconMap = {
    '📄': '<i class="ph ph-files" style="font-size: 1.8rem; color: var(--primary-500)"></i>',
    '👤': '<i class="ph ph-user"></i>',
    '📊': '<i class="ph-fill ph-squares-four"></i>',
    '👥': '<i class="ph-fill ph-users"></i>',
    '📝': '<i class="ph-fill ph-file-text"></i>',
    '📑': '<i class="ph-fill ph-copy"></i>',
    '🏢': '<i class="ph-fill ph-buildings"></i>',
    '👨‍💼': '<i class="ph-fill ph-user-gear"></i>',
    '🚪': '<i class="ph ph-sign-out"></i>',
    '🔍': '<i class="ph ph-magnifying-glass"></i>',
    '➕': '<i class="ph ph-plus"></i>',
    '✏️': '<i class="ph ph-pencil-simple"></i>',
    '⚡': '<i class="ph-fill ph-lightning"></i>'
};

for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Inject CDNs
    if (!content.includes('unpkg.com/@phosphor-icons')) {
        content = content.replace('</head>', headInjection);
    }

    // Replace <span class="emoji">X</span> with Icons
    for (const [emoji, iconHtml] of Object.entries(iconMap)) {
        // Also catch without span if any
        const spanRegex = new RegExp(`<span class="emoji">${emoji}</span>`, 'g');
        content = content.replace(spanRegex, `<span class="icon">${iconHtml}</span>`);
    }

    fs.writeFileSync(p, content, 'utf8');
}
console.log('Frameworks and Icons injected successfully!');
