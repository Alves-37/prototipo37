import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonetizacao } from '../context/MonetizacaoContext';
import Modal from '../components/Modal';

export default function Apoio() {
  const [form, setForm] = useState({ nome: '', email: '', mensagem: '' });
  const [enviado, setEnviado] = useState(false);
  // Remover botão e modal de chamado prioritário

  const { assinatura } = useMonetizacao();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setEnviado(true);
    setTimeout(() => setEnviado(false), 4000);
    setForm({ nome: '', email: '', mensagem: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 px-1 sm:py-8 sm:px-2">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-3 sm:p-6 flex flex-col items-center pb-20">
        {/* Logo e título da plataforma */}
        <img src="/nevu.png" alt="Nevú" className="w-14 h-14 sm:w-16 sm:h-16 mb-2 sm:mb-3 rounded-full shadow" />
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-700 mb-2 flex items-center gap-2">
            Apoio e Suporte
            {(assinatura?.plano === 'premium' || assinatura?.plano === 'basico') && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Suporte Prioritário
              </span>
            )}
          </h1>
        </div>
        {/* Remover todo o código relacionado ao botão e modal de chamado prioritário */}
        {/* Formulário de contato - muda para prioritário se basico ou premium */}
        <div className="w-full bg-gray-50 rounded-lg p-3 sm:p-4 shadow-inner max-w-md mx-auto mb-4 sm:mb-6">
          {['basico', 'premium', 'empresarial'].includes(assinatura?.plano) ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="text-green-700 font-semibold">Seu chamado será enviado como <b>PRIORITÁRIO</b> e receberá resposta mais rápida.</span>
              </div>
              <div className="mb-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                Tempo médio de resposta: <b>até 2h úteis</b>
              </div>
              {enviado ? (
                <div className="flex flex-col items-center py-6 animate__animated animate__fadeIn">
                  <div className="bg-green-100 rounded-full p-4 mb-3">
                    <svg className="w-10 h-10 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                  </div>
                  <div className="text-green-700 bg-green-100 border border-green-300 rounded p-4 text-center font-semibold">Chamado enviado com prioridade!<br/>Nossa equipe responderá em breve.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" /></svg> Assunto</label>
                    <input type="text" name="assunto" required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: Problema de acesso" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" /></svg> Descrição</label>
                    <textarea required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" rows={4} placeholder="Descreva seu problema ou dúvida"></textarea>
                  </div>
                  <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 text-base">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    Enviar Chamado Prioritário
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-gray-800 mb-2 text-base text-center">Fale com o Suporte</h2>
              {enviado && (
                <div className="mb-2 p-2 bg-green-100 text-green-700 rounded text-xs text-center">Mensagem enviada! Em breve entraremos em contato.</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Nome</label>
                  <input type="text" name="nome" value={form.nome} onChange={handleChange} required className="w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">E-mail</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Mensagem</label>
                  <textarea name="mensagem" value={form.mensagem} onChange={handleChange} required rows={3} className="w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-1.5 rounded hover:bg-blue-700 transition text-sm">Enviar</button>
              </form>
            </>
          )}
        </div>
        {/* Links úteis */}
        <div className="w-full flex flex-col sm:flex-row sm:justify-between gap-2 mb-4 sm:mb-6 items-center text-center">
          <Link to="/politica-privacidade" className="text-xs text-gray-500 hover:text-blue-600 underline">Política de Privacidade</Link>
          <Link to="/termos" className="text-xs text-gray-500 hover:text-blue-600 underline">Termos de Uso</Link>
          <Link to="/faq" className="text-xs text-gray-500 hover:text-blue-600 underline">FAQ</Link>
        </div>
        {/* Separador visual */}
        <div className="w-full border-t border-gray-200 my-4 sm:my-6"></div>
        {/* Seção institucional da Neotrix */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2 flex-col sm:flex-row sm:justify-start justify-center text-center sm:text-left">
            <img src="/neotrix-logo.png.jpeg" alt="Logo Neotrix" className="w-8 h-8 rounded-full shadow-sm border border-gray-200" />
            <h2 className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <span className="text-blue-700">Neotrix</span>
              <span className="text-xs text-gray-400 font-normal">(empresa criadora)</span>
            </h2>
          </div>
          <p className="text-gray-700 text-xs mb-3 text-center sm:text-left">
            A Neotrix é uma empresa dedicada a soluções tecnológicas inovadoras para Moçambique. Nosso objetivo é conectar talentos e empresas, facilitando o acesso a oportunidades e promovendo o desenvolvimento digital no país.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 mb-2">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">Localização</h3>
              <ul className="text-gray-600 text-xs space-y-0.5">
                <li><span className="font-medium">Localização:</span> Gurue, Moçambique</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">Contato Institucional</h3>
              <ul className="text-gray-600 text-xs space-y-0.5">
                <li><span className="font-medium">E-mail:</span> <a href="mailto:neotrixtecnologias37@gmail.com" className="text-blue-600 underline">neotrixtecnologias37@gmail.com</a></li>
                <li><span className="font-medium">Telefone/WhatsApp:</span> <a href="tel:+258872664074" className="text-blue-600 underline">872664074</a></li>
                <li><span className="font-medium">Horário de atendimento:</span> 08h às 18h (Seg a Sex)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 