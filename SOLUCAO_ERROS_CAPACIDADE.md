# Solução de Problemas - Capacidade de Vagas

## Erro: "Validation error" na Sincronização

### Problema
```
Erro na sincronização com alterações: Validation error
Tentando sincronização sem alterações...
```

### Causa
O Sequelize está tentando validar novos campos com dados existentes que não atendem às validações.

### Solução

#### 1. Executar Migração de Capacidade
```bash
cd backend
npm run migrate-capacidade
```

#### 2. Verificar e Corrigir Dados
```bash
npm run check-capacidade
```

#### 3. Se ainda houver problemas, executar em sequência:
```bash
# 1. Parar o servidor (Ctrl+C)

# 2. Executar migração
npm run migrate-capacidade

# 3. Verificar dados
npm run check-capacidade

# 4. Reiniciar servidor
npm start
```

## Estrutura dos Novos Campos

### Campos Adicionados
- `capacidadeVagas`: INTEGER (1-100, padrão: 1)
- `statusCapacidade`: STRING ('aberta', 'fechada', 'parcial', padrão: 'aberta')

### Validações
- `capacidadeVagas`: mínimo 1, máximo 100
- `statusCapacidade`: deve ser 'aberta', 'fechada' ou 'parcial'

## Scripts Disponíveis

### `npm run migrate-capacidade`
- Adiciona as novas colunas ao banco
- Atualiza vagas existentes com valores padrão
- Seguro para executar múltiplas vezes

### `npm run check-capacidade`
- Verifica se todas as vagas têm dados válidos
- Corrige automaticamente dados inconsistentes
- Mostra relatório detalhado

## Verificação Manual

### 1. Verificar Estrutura da Tabela
```sql
PRAGMA table_info(vagas);
```

### 2. Verificar Dados
```sql
SELECT id, titulo, capacidadeVagas, statusCapacidade 
FROM vagas 
WHERE capacidadeVagas IS NULL 
   OR statusCapacidade IS NULL
   OR capacidadeVagas < 1 
   OR capacidadeVagas > 100;
```

### 3. Corrigir Dados Manualmente (se necessário)
```sql
UPDATE vagas 
SET capacidadeVagas = 1, statusCapacidade = 'aberta' 
WHERE capacidadeVagas IS NULL OR statusCapacidade IS NULL;

UPDATE vagas 
SET capacidadeVagas = 1 
WHERE capacidadeVagas < 1 OR capacidadeVagas > 100;

UPDATE vagas 
SET statusCapacidade = 'aberta' 
WHERE statusCapacidade NOT IN ('aberta', 'fechada', 'parcial');
```

## Logs de Debug

### Logs Esperados
```
🔄 Iniciando migração de capacidade de vagas...
📝 Adicionando coluna capacidadeVagas...
✅ Coluna capacidadeVagas adicionada!
📝 Adicionando coluna statusCapacidade...
✅ Coluna statusCapacidade adicionada!
🔄 Atualizando vagas existentes...
✅ Vagas existentes atualizadas!
✅ Migração de capacidade concluída com sucesso!
```

### Logs de Verificação
```
🔍 Verificando dados de capacidade...
📊 Vagas sem capacidade definida: 0
✅ Todas as vagas têm capacidade definida corretamente
📊 Vagas com valores inválidos: 0
✅ Todas as vagas têm valores válidos
📈 Resumo:
- Total de vagas: X
- Vagas corrigidas: 0
- Status: ✅ Sistema pronto para uso
```

## Problemas Comuns

### 1. "Column already exists"
- **Solução**: O campo já foi adicionado, pode ignorar este erro
- **Ação**: Continuar com a verificação

### 2. "Cannot read property of null"
- **Causa**: Dados inconsistentes no banco
- **Solução**: Executar `npm run check-capacidade`

### 3. "Validation error"
- **Causa**: Valores fora do range permitido
- **Solução**: Executar verificação e correção automática

## Teste da Funcionalidade

### 1. Criar Vaga com Capacidade
```javascript
// POST /api/vagas
{
  "titulo": "Desenvolvedor Frontend",
  "descricao": "Vaga para desenvolvedor...",
  "capacidadeVagas": 2,
  // ... outros campos
}
```

### 2. Verificar Status
```javascript
// GET /api/vagas/:id
// Deve retornar:
{
  "capacidadeVagas": 2,
  "statusCapacidade": "aberta"
}
```

### 3. Testar Aprovação
```javascript
// PUT /api/candidaturas/:id/fase
{
  "fase": "aprovada"
}
// Deve atualizar statusCapacidade automaticamente
```

## Contato para Suporte

Se os problemas persistirem:
1. Verificar logs completos do servidor
2. Executar scripts de verificação
3. Verificar estrutura do banco de dados
4. Consultar documentação técnica 