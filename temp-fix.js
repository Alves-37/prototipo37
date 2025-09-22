// Correção para a função alterarStatus
// Substituir a linha:
// await buscarCandidaturas()
// Por:
// setTimeout(() => { window.location.reload() }, 1000)

// E adicionar 'contratada' ao statusLabels:
const statusLabels = {
  'em_analise': 'Em Análise',
  'entrevista_agendada': 'Entrevista Agendada',
  'entrevista_realizada': isEmpresa ? 'Entrevista Realizada' : 'Aguardando Resposta',
  'aprovada': 'Aprovada',
  'reprovada': 'Reprovada',
  'contratada': 'Contratada'
} 