import React from 'react';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-8 flex flex-col items-center pb-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">Perguntas Frequentes (FAQ)</h1>
        <div className="prose prose-blue max-w-none text-gray-800">
          <p className="text-sm text-gray-500 mb-4">A plataforma <span className="font-bold text-blue-700">Nevú</span> é desenvolvida e mantida pela Neotrix.</p>
          <h2>1. O que é a Nevú?</h2>
          <p>A Nevú é uma plataforma digital que conecta candidatos a vagas de emprego e empresas em Moçambique, facilitando o recrutamento e a busca por oportunidades profissionais.</p>
          <h2>2. Como faço para criar uma conta?</h2>
          <p>Basta clicar em "Cadastrar" no menu, escolher o tipo de conta (Candidato ou Empresa) e preencher os dados solicitados.</p>
          <h2>3. Preciso pagar para usar a plataforma?</h2>
          <p>O uso básico da Nevú é gratuito para candidatos e empresas. Existem planos pagos com benefícios adicionais para empresas.</p>
          <h2>4. Como me candidato a uma vaga?</h2>
          <p>Após criar seu perfil de candidato, acesse a página de vagas, escolha a vaga desejada e clique em "Candidatar-se".</p>
          <h2>5. Como as empresas visualizam meus dados?</h2>
          <p>Seus dados completos só ficam visíveis para empresas nas vagas em que você se candidatou. Dados sensíveis são protegidos conforme nossa Política de Privacidade.</p>
          <h2>6. Como publicar uma vaga?</h2>
          <p>Empresas cadastradas podem acessar o painel, clicar em "Publicar Vaga" e preencher as informações da oportunidade.</p>
          <h2>7. Esqueci minha senha. O que faço?</h2>
          <p>Clique em "Entrar", depois em "Esqueci minha senha" e siga as instruções para redefinir.</p>
          <h2>8. Como entro em contato com o suporte?</h2>
          <p>Você pode acessar a página de Apoio ao Cliente ou enviar um e-mail para <a href="mailto:neotrixtecnologias37@gmail.com" className="text-blue-600 underline">neotrixtecnologias37@gmail.com</a>.</p>
          <h2>9. Meus dados estão seguros?</h2>
          <p>Sim. Adotamos medidas de segurança e seguimos a legislação moçambicana para proteger suas informações. Veja mais na nossa Política de Privacidade.</p>
          <h2>10. Como excluo minha conta?</h2>
          <p>Entre em contato pelo e-mail de suporte solicitando a exclusão. Sua solicitação será atendida conforme a legislação vigente.</p>
          <hr className="my-6" />
          <p className="text-xs text-gray-400">A plataforma Nevú é desenvolvida e mantida pela Neotrix.</p>
        </div>
      </div>
    </div>
  );
} 