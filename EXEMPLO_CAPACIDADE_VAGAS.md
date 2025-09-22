# Funcionalidade de Capacidade de Vagas

## Visão Geral

A funcionalidade de **Capacidade de Vagas** permite que as empresas definam quantos candidatos **aprovados** precisam para cada posição, controlando automaticamente quando a vaga deve ser fechada para novas candidaturas.

## Como Funciona

### 1. Publicação de Vaga
Ao publicar uma vaga, a empresa pode definir:
- **Capacidade de Candidatos Aprovados**: Número de candidatos aprovados desejados (1-100)
- **Status Automático**: O sistema controla automaticamente o status da capacidade

### 2. Estados da Capacidade
- **🟢 Aberta**: Ainda aceitando candidaturas
- **🟡 Quase Cheia**: 80% dos candidatos aprovados atingidos
- **🔴 Fechada**: Capacidade máxima de aprovados atingida

### 3. Controle Automático
- Quando um candidato é **aprovado**, o sistema verifica a capacidade
- Se atingir o limite de aprovados, a vaga é automaticamente fechada
- O status é atualizado em tempo real baseado nos aprovados

## Implementação Técnica

### Backend

#### Modelo de Dados (Vaga.js)
```javascript
// Novos campos adicionados
capacidadeVagas: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 1,
  validate: {
    min: 1,
    max: 100
  }
},
statusCapacidade: {
  type: DataTypes.ENUM('aberta', 'fechada', 'parcial'),
  defaultValue: 'aberta',
  allowNull: false
}
```

#### Controller de Candidaturas
```javascript
// Verificação se a vaga ainda aceita candidaturas
if (vaga.statusCapacidade === 'fechada') {
  return res.status(400).json({ 
    error: 'Esta vaga não está mais aceitando candidaturas.' 
  });
}

// Atualização automática do status quando candidato é aprovado
if (fase === 'aprovada' || fase === 'contratada') {
  const candidatosAprovados = await Candidatura.count({ 
    where: { 
      vagaId: candidatura.vagaId,
      fase: { [Op.in]: ['aprovada', 'contratada'] }
    }
  });
  
  let novoStatusCapacidade = 'aberta';
  
  if (candidatosAprovados >= candidatura.vaga.capacidadeVagas) {
    novoStatusCapacidade = 'fechada';
  } else if (candidatosAprovados >= Math.ceil(candidatura.vaga.capacidadeVagas * 0.8)) {
    novoStatusCapacidade = 'parcial';
  }
  
  await candidatura.vaga.update({ statusCapacidade: novoStatusCapacidade });
}
```

### Frontend

#### Formulário de Publicação
```javascript
// Campo de capacidade no formulário
<div>
  <label>Capacidade de Candidatos Aprovados *</label>
  <input
    type="number"
    name="capacidadeVagas"
    value={formData.capacidadeVagas}
    onChange={handleInputChange}
    min="1"
    max="100"
    required
  />
  <span>Quantos candidatos aprovados você precisa para esta vaga?</span>
</div>
```

#### Exibição na Listagem
```javascript
// Indicador visual do status
<span className={`px-3 py-1 rounded-full text-sm font-medium ${
  vaga.statusCapacidade === 'aberta' ? 'bg-green-100 text-green-800' :
  vaga.statusCapacidade === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
  'bg-red-100 text-red-800'
}`}>
  {vaga.statusCapacidade === 'aberta' ? '🟢 Aberta' :
   vaga.statusCapacidade === 'parcial' ? '🟡 Quase Cheia' :
   '🔴 Fechada'}
</span>
```

## Migração do Banco de Dados

Para aplicar as mudanças no banco de dados:

```bash
cd backend
npm run migrate-capacidade
```

## Benefícios

1. **Controle Preciso**: Empresas definem exatamente quantos candidatos precisam
2. **Automação**: Sistema fecha vagas automaticamente quando atinge o limite
3. **Transparência**: Candidatos veem claramente o status da vaga
4. **Eficiência**: Evita receber candidaturas desnecessárias
5. **Flexibilidade**: Permite ajustar a capacidade conforme necessário

## Casos de Uso

### Para Empresas
- **Vaga Individual**: Capacidade = 1 (contratação direta)
- **Processo Seletivo**: Capacidade = 2-3 (para ter opções de backup)
- **Programa de Estágio**: Capacidade = 5-10 (para seleção final)

### Para Candidatos
- **Vagas Abertas**: Podem se candidatar normalmente
- **Vagas Quase Cheias**: Aviso de que está próximo do limite de aprovados
- **Vagas Fechadas**: Não podem mais se candidatar (limite de aprovados atingido)

## Próximas Melhorias

1. **Notificações**: Alertar empresas quando atingir 80% da capacidade
2. **Ajuste Dinâmico**: Permitir aumentar a capacidade durante o processo
3. **Analytics**: Relatórios de performance por capacidade
4. **Templates**: Capacidades padrão por tipo de vaga 