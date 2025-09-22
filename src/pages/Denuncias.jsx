import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const tipoOptions = [
  { value: 'empresa', label: 'Empresa', color: 'bg-blue-100 text-blue-700' },
  { value: 'candidato', label: 'Candidato', color: 'bg-green-100 text-green-700' },
  { value: 'vaga', label: 'Vaga', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'mensagem', label: 'Mensagem', color: 'bg-purple-100 text-purple-700' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-100 text-gray-700' },
];

export default function Denuncias() {
  const [tipo, setTipo] = useState('empresa');
  const [descricao, setDescricao] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setSucesso(true);
    setTimeout(() => {
      setSucesso(false);
      navigate(-1);
    }, 2000);
  }

  function renderAnexoPreview() {
    if (!anexo) return null;
    const isImage = anexo.type.startsWith('image/');
    const isPdf = anexo.type === 'application/pdf';
    const isDoc = anexo.type.includes('word') || anexo.type.includes('doc');
    return (
      <div className="mt-2 flex items-center gap-2">
        {isImage && (
          <img src={URL.createObjectURL(anexo)} alt="Preview" className="w-12 h-12 object-cover rounded shadow border" />
        )}
        {isPdf && (
          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold"><svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>PDF</span>
        )}
        {isDoc && (
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold"><svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>DOC</span>
        )}
        <span className="text-xs text-gray-500">{anexo.name}</span>
      </div>
    );
  }

  const tipoBadge = tipoOptions.find(opt => opt.value === tipo);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Topo: ícone e título */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 rounded-full p-3 mb-2 shadow">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 8v-2m0 0a9 9 0 110-18 9 9 0 010 18z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-blue-700 mb-1 text-center">Denunciar</h1>
          <div className="text-xs text-gray-500 text-center mb-2">Sua denúncia é anônima e será tratada com seriedade.</div>
          <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 font-medium mb-2">Ajude a manter a plataforma segura para todos!</div>
        </div>
        {/* Passos visuais */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
            <span className="text-xs mt-1 text-blue-700">Tipo</span>
          </div>
          <div className="w-8 h-0.5 bg-blue-200"></div>
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
            <span className="text-xs mt-1 text-blue-700">Descrição</span>
          </div>
          <div className="w-8 h-0.5 bg-blue-200"></div>
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
            <span className="text-xs mt-1 text-blue-700">Evidência</span>
          </div>
        </div>
        {sucesso ? (
          <div className="flex flex-col items-center justify-center py-8 animate__animated animate__fadeIn">
            <div className="bg-green-100 rounded-full p-4 mb-3">
              <svg className="w-10 h-10 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            </div>
            <div className="text-green-700 bg-green-100 border border-green-300 rounded p-4 text-center font-semibold">Denúncia enviada com sucesso!<br/>Obrigado por ajudar a manter a plataforma segura.</div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de denúncia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de denúncia</label>
            <div className="flex items-center gap-2 mb-2">
              {tipoBadge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${tipoBadge.color} border-blue-200`}>{tipoBadge.label}</span>
              )}
            </div>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full p-3 border rounded-lg">
              {tipoOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} required rows={4} className="w-full p-3 border rounded-lg" placeholder="Descreva o motivo da denúncia..."></textarea>
          </div>
          {/* Anexo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anexar evidência (opcional)</label>
            <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setAnexo(e.target.files[0])} className="w-full" />
            {renderAnexoPreview()}
          </div>
          {/* Privacidade */}
          <div className="text-xs text-gray-400 flex items-center gap-1"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 8v-2m0 0a9 9 0 110-18 9 9 0 010 18z" /></svg> Seus dados não serão compartilhados.</div>
          {/* Botão de envio */}
          <button type="submit" className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Enviar denúncia
          </button>
        </form>
        )}
      </div>
    </div>
  );
} 