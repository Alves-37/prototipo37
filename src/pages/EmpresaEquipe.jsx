import { useState } from 'react'

export default function EmpresaEquipe() {
  const [membros, setMembros] = useState([
    { id: 'u1', nome: 'Carla Mendes', email: 'carla@empresa.co.mz', role: 'CEO' },
    { id: 'u2', nome: 'Ana Ribeiro', email: 'ana@empresa.co.mz', role: 'Admin' },
    { id: 'u3', nome: 'Carlos Jorge', email: 'carlos@empresa.co.mz', role: 'Funcionario' },
  ])

  const [novo, setNovo] = useState({ nome: '', email: '', role: 'Funcionario' })

  const adicionar = () => {
    if (!novo.nome || !novo.email) return
    setMembros(prev => [...prev, { id: String(Date.now()), ...novo }])
    setNovo({ nome: '', email: '', role: 'Funcionario' })
  }

  const remover = (id) => setMembros(prev => prev.filter(m => m.id !== id))

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Equipe da Empresa</h1>

      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Convidar membro</h2>
        <div className="grid sm:grid-cols-4 gap-2">
          <input value={novo.nome} onChange={e => setNovo(v => ({ ...v, nome: e.target.value }))} className="p-2 border rounded sm:col-span-1" placeholder="Nome" />
          <input value={novo.email} onChange={e => setNovo(v => ({ ...v, email: e.target.value }))} className="p-2 border rounded sm:col-span-2" placeholder="Email" />
          <select value={novo.role} onChange={e => setNovo(v => ({ ...v, role: e.target.value }))} className="p-2 border rounded">
            <option value="CEO">CEO</option>
            <option value="Admin">Admin</option>
            <option value="Funcionario">Funcionário</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={adicionar} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Convidar</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Função</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {membros.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium text-gray-800">{m.nome}</td>
                <td className="p-3 text-gray-700">{m.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${m.role === 'CEO' ? 'bg-purple-100 text-purple-700' : m.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{m.role}</span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => remover(m.id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
