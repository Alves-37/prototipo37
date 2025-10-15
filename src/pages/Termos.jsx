import React from 'react';

export default function Termos() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-8 flex flex-col items-center pb-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">Termos e Condições de Uso</h1>
        <div className="prose prose-blue max-w-none text-gray-800">
          <p className="text-sm text-gray-500 mb-4">A plataforma <span className="font-bold text-blue-700">Nevú</span> é desenvolvida e mantida pela Neotrix.</p>
          <h2>1. Aceitação dos Termos</h2>
          <p>Ao acessar ou usar a plataforma Nevú ("Plataforma"), desenvolvida pela Neotrix, você concorda com estes Termos e Condições de Uso ("Termos"). Caso não concorde, não utilize a Plataforma.</p>
          <h2>2. Objetivo da Plataforma</h2>
          <p>A Nevú conecta candidatos a vagas de emprego e empresas que buscam talentos, promovendo oportunidades profissionais em Moçambique.</p>
          <h2>3. Cadastro e Conta</h2>
          <ul>
            <li>Para utilizar certas funcionalidades, é necessário criar uma conta, fornecendo informações verdadeiras, completas e atualizadas.</li>
            <li>Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
          </ul>
          <h2>4. Privacidade</h2>
          <ul>
            <li>Suas informações pessoais serão tratadas conforme nossa Política de Privacidade.</li>
            <li>Não compartilhe dados sensíveis nos campos públicos da plataforma.</li>
          </ul>
          <h2>5. Responsabilidades do Usuário</h2>
          <ul>
            <li>Não publique informações falsas, ofensivas, discriminatórias ou ilegais.</li>
            <li>Não utilize a plataforma para fins ilícitos, fraudes ou para prejudicar terceiros.</li>
            <li>Empresas devem publicar apenas vagas reais e condizentes com a legislação moçambicana.</li>
          </ul>
          <h2>6. Propriedade Intelectual</h2>
          <p>Todo o conteúdo da plataforma (textos, imagens, marcas, software) pertence à Neotrix ou a seus licenciadores. É proibida a reprodução, distribuição ou uso comercial sem autorização.</p>
          <h2>7. Limitação de Responsabilidade</h2>
          <p>A Nevú não garante a contratação, a veracidade de todas as informações de usuários ou o funcionamento ininterrupto da plataforma. Não nos responsabilizamos por danos decorrentes de uso indevido, indisponibilidade ou falhas de terceiros.</p>
          <h2>8. Encerramento de Conta</h2>
          <ul>
            <li>A Nevú pode suspender ou encerrar contas que violem estes Termos, sem aviso prévio.</li>
            <li>O usuário pode solicitar a exclusão de sua conta a qualquer momento.</li>
          </ul>
          <h2>9. Alterações nos Termos</h2>
          <p>A Nevú pode alterar estes Termos a qualquer momento. O uso continuado da plataforma após alterações implica concordância.</p>
          <h2>10. Contato</h2>
          <p>Dúvidas ou solicitações sobre o uso da plataforma podem ser enviadas para:<br/>
            <span className="font-medium">E-mail:</span> <a href="mailto:neotrixtecnologias37@gmail.com" className="text-blue-600 underline">neotrixtecnologias37@gmail.com</a><br/>
            <span className="font-medium">Telefone/WhatsApp:</span> <a href="tel:+258872664074" className="text-blue-600 underline">872664074</a>
          </p>
          <h2>11. Legislação Aplicável</h2>
          <p>Estes Termos são regidos pelas leis da República de Moçambique.</p>
          <hr className="my-6" />
          <p className="text-xs text-gray-400">A plataforma Nevú é desenvolvida e mantida pela Neotrix.</p>
        </div>
      </div>
    </div>
  );
} 