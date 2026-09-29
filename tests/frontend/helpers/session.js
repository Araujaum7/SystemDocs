const DEFAULT_COMPANY = {
  id: 1,
  nome: 'Amethyst Legal',
  temaCor: '#7C3AED',
  temaCorSecundaria: '#2563EB',
};

const DEFAULT_RESPONSES = {
  '/api/health': { ok: true, service: 'DocumentosPro' },
  '/api/clientes': [],
  '/api/templates': [],
  '/api/usuarios': [],
  '/api/empresas': [],
  '/api/auditoria': [],
  '/api/dashboard/stats': {},
};

export async function installSession(
  page,
  { role = 'master', company = DEFAULT_COMPANY, darkTheme, sidebarCollapsed = false, omitContextConfig = false } = {}
) {
  const companyConfig = company
    ? {
        temaCor: company.temaCor,
        temaCorSecundaria: company.temaCorSecundaria,
      }
    : null;

  const usuario = {
    id: role === 'master' ? 1 : 2,
    nome: 'Marina Costa',
    email: 'marina@documentospro.test',
    role,
    empresa_id: role === 'master' ? null : (company?.id ?? null),
    empresa_nome: role === 'master' ? null : (company?.nome ?? null),
    empresa_config: role === 'master' ? null : companyConfig,
  };

  const empresas = company ? [{ id: company.id, nome: company.nome, config: companyConfig }] : [];

  await page.addInitScript(
    ({ storedUser, storedCompanies, activeCompany, isDark, isCollapsed, activeConfig, omitConfig }) => {
      localStorage.setItem('token', 'ui-test-token');
      localStorage.setItem('usuario', JSON.stringify(storedUser));
      localStorage.setItem('empresas', JSON.stringify(storedCompanies));
      if (isDark !== undefined) {
        localStorage.setItem('darkTheme', String(isDark));
      }
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));

      if (activeCompany) {
        localStorage.setItem('empresaContextoId', String(activeCompany.id));
        localStorage.setItem('empresaContextoNome', activeCompany.nome);
        if (!omitConfig && activeConfig) {
          localStorage.setItem('empresaContextoConfig', JSON.stringify(activeConfig));
        }
      }
    },
    {
      storedUser: usuario,
      storedCompanies: empresas,
      activeCompany: company,
      isDark: darkTheme,
      isCollapsed: sidebarCollapsed,
      activeConfig: companyConfig,
      omitConfig: omitContextConfig,
    }
  );
}

export async function mockApi(page, overrides = {}) {
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const override = overrides[pathname];

    if (typeof override === 'function') {
      await override(route);
      return;
    }

    const response = override ?? {
      status: 200,
      body: DEFAULT_RESPONSES[pathname] ?? {},
    };

    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body ?? {}),
    });
  });
}

export { DEFAULT_COMPANY };
