import React from 'react';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-8 flex flex-col items-center pb-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">Política de Privacidade</h1>
        <div className="prose prose-blue max-w-none text-gray-800">
          <p className="text-sm text-gray-500 mb-4">A plataforma <span className="font-bold text-blue-700">Nevú</span> é desenvolvida e mantida pela Neotrix.</p>
          <h2>1. Introdução</h2>
          <p>Esta Política de Privacidade descreve como a plataforma Nevú, desenvolvida pela Neotrix, coleta, utiliza, armazena e protege as informações pessoais dos usuários, em conformidade com as leis de Moçambique.</p>
          <h2>2. Coleta de Informações</h2>
          <ul>
            <li>Coletamos informações fornecidas pelo usuário no cadastro, como nome, e-mail, telefone, NUIT, localização e dados profissionais.</li>
            <li>Podemos coletar dados de navegação, cookies e informações técnicas para melhorar a experiência na plataforma.</li>
          </ul>
          <h2>3. Uso das Informações</h2>
          <ul>
            <li>As informações são utilizadas para criar e gerenciar contas, conectar candidatos e empresas, personalizar a experiência e enviar comunicações relevantes.</li>
            <li>Podemos usar dados para fins estatísticos e de segurança, sempre de forma anonimizada quando possível.</li>
          </ul>
          <h2>4. Compartilhamento de Dados</h2>
          <ul>
            <li>Não vendemos ou compartilhamos dados pessoais com terceiros, exceto quando necessário para funcionamento da plataforma, cumprimento legal ou solicitação do usuário.</li>
            <li>Empresas visualizam apenas dados relevantes de candidatos que se candidataram às suas vagas.</li>
          </ul>
          <h2>5. Cookies e Tecnologias Semelhantes</h2>
          <ul>
            <li>Utilizamos cookies para autenticação, preferências e análise de uso. O usuário pode gerenciar cookies nas configurações do navegador.</li>
          </ul>
          <h2>6. Segurança</h2>
          <ul>
            <li>Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, perda ou uso indevido.</li>
            <li>O usuário também é responsável por manter sua senha segura.</li>
          </ul>
          <h2>7. Direitos do Usuário</h2>
          <ul>
            <li>O usuário pode acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento.</li>
            <li>Solicitações podem ser feitas pelo e-mail de contato abaixo.</li>
          </ul>
          <h2>8. Alterações nesta Política</h2>
          <p>Podemos atualizar esta Política de Privacidade periodicamente. O uso continuado da plataforma implica concordância com as alterações.</p>
          <h2>9. Contato</h2>
          <p>Dúvidas ou solicitações sobre o uso da plataforma podem ser enviadas para:<br/>
            <span className="font-medium">E-mail:</span> <a href="mailto:neotrixtecnologias37@gmail.com" className="text-blue-600 underline">neotrixtecnologias37@gmail.com</a><br/>
            <span className="font-medium">Telefone/WhatsApp:</span> <a href="tel:+258872664074" className="text-blue-600 underline">872664074</a>
          </p>
          <h2>10. Legislação Aplicável</h2>
          <p>Esta Política é regida pelas leis da República de Moçambique.</p>
          <hr className="my-6" />
          <p className="text-xs text-gray-400">A plataforma Nevú é desenvolvida e mantida pela Neotrix.</p>
        </div>
      </div>
    </div>
  );
} 