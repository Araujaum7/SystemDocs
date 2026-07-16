# AI Coding Instructions for DocumentosPro

## Architecture Overview

**DocumentosPro** is a multi-tenant document generation system:
- **Backend**: Express.js (Node.js) + SQLite with JWT authentication
- **Frontend**: Vanilla JavaScript with class-based module pattern
- **Core Feature**: Generate bulk DOCX documents from templates with client data substitution

### Data Flow
Client Data (JSON) → Template (DOCX with {{fields}}) → Document Processor → Output (DOCX/PDF)

### Multi-Tenancy Model
- Master users (role='master') manage everywhere; regular users (role='user') scoped to empresa_id
- Each client data is company-scoped via `empresa_id`
- Templates marked with `empresa_id`; only master or owner company can use them

## Critical Subsystems

### 1. DOCX Template Processing (`backend/docx-preprocessor.js`)
**Why it exists**: MS Word breaks handlebars across multiple XML tags (runs). Example: `{{NAME` in one run, `}}` in another.

**Key behavior**:
- `fixDocxTemplate(filePath)` reads DOCX, extracts word/document.xml and headers/footers
- Regex removes internal XML tags between `{{` and `}}`  
- Must be called BEFORE PizZip/Docxtemplater to avoid "multiple runs" errors

**Usage** (line 571 in server.js):
```javascript
const fixedBuffer = await fixDocxTemplate(templatePath);
const zip = new PizZip(fixedBuffer);
const doc = new Docxtemplater(zip);
```

**When modifying**: Test with real Word-edited templates; handlebars entered via Word's template feature break differently than plain text.

### 2. Document Generation Route (`/api/gerar-documentos`)
Generates all client-template combinations with parallel Promise execution.

**Key patterns**:
- Normalizes client field keys: `lowercase + no-spaces` to handle variation (e.g., "Nome" vs "NOME")
- Falls back to raw file if preprocessor fails (line 647: `catch (preErr)`)
- Filename format: `{templateName} - {clientName} - {cpf}.docx`
- Handles missing fields gracefully: `[FIELDNAME NÃO INFORMADO]` placeholder

**Critical detail**: Field matching is case-insensitive because client data varies (API responses, manual entry, imports).

### 3. Frontend Module Pattern
Each feature (auth, clients, templates, documents) is a class instantiated globally:
```javascript
// In auth.js
class Auth { init() {...} }
window.auth = new Auth();

// In documentos.js  
class DocumentosManager { 
    init() { Promise.all([this.loadClientes(), this.loadTemplates()]) }
}
```

**Token flow**: `localStorage.getItem('token')` → `Authorization: Bearer {token}` header → `authenticateToken` middleware extracts to `req.user`

## Developer Workflows

### Development Server
```powershell
# Terminal 1: Backend with hot-reload
npm run dev
# Uses nodemon to restart on file changes (see package.json)

# Terminal 2: Static frontend (served by Express)
# No build step needed; HTML/CSS/JS served directly from /frontend
```

### Database Reset
Delete `database.db` to trigger table creation + master user insertion on next startup.
- Default master credentials: `admin@admin.com` / `admin123`

### Template Testing
1. Create DOCX with `{{FIELDNAME}}` using MS Word Find & Replace (not manual typing)
2. Upload via `/api/templates` (multipart)
3. Test generation with single client via `/api/gerar-documentos`

## Key Files & Patterns

| File | Purpose | Key Pattern |
|------|---------|------------|
| `backend/server.js` | Routes, middleware, DB init | JWT auth + company isolation |
| `backend/docx-preprocessor.js` | Handlebars repair | XML run collapsing regex |
| `backend/lib/convert-wrapper.js` | DOCX→PDF | Promisified libreoffice-convert |
| `frontend/js/auth.js` | Auth UI & token mgmt | localStorage + redirect guards |
| `frontend/js/documentos.js` | Bulk document generation UI | Client/Template multi-select |
| `frontend/css/style.css` | Responsive layout | Sidebar toggle state in localStorage |

## Integration Points

### Authentication
- All API routes except `POST /api/login` require `Authorization: Bearer {token}`
- Token created in `/api/login`, verified via `authenticateToken` middleware
- `req.user` contains: `{id, empresa_id, role, nome, email}`

### File uploads
- Multer config (line 35): uploads to `uploads/templates`, generated docs to `uploads/gerados`
- Templates store filename (`arquivo`) + field list (`campos` as JSON string)

### PDF Conversion
- `convertToPDF()` in `lib/convert-wrapper.js` uses libreoffice-convert
- Called post-generation (not in current code, prepared for extension)

## Common Pitfalls

1. **Field name mismatch**: Always normalize when comparing template fields to client data
2. **Preprocessor failures**: Catch and fallback; don't abort entire batch
3. **Missing DOCX files**: Check filesystem path before rendering (line 635)
4. **JWT expiration**: Frontend should handle 403 and redirect to login (not yet implemented)
5. **Multi-company isolation**: Verify `empresa_id` in queries; don't trust client-side only

## Extending the System

**New template field type** (e.g., booleans, dates):
- Modify normalization in `documentos.js` GenerateRoute (line ~650)
- Update field matching logic to handle type coercion

**New entity** (e.g., addresses linked to clients):
- Add table in `server.js` db.serialize() block
- Create CRUD endpoints with `authenticateToken` + company scoping
- Add frontend class module following DocumentosManager pattern

**PDF generation for all documents**:
- After `fs.writeFileSync(outputPath, buf)` (line 680), call `convertToPDF(buf)` 
- Save both DOCX and PDF; update response to include both URLs
