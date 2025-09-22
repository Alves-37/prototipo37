const axios = require('axios');

// Configuração da API
const API_BASE = 'http://localhost:3001/api';

// Função para fazer login e obter token
async function login(email, senha) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      senha
    });
    return response.data.token;
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar listar conversas
async function testarListarConversas(token) {
  try {
    console.log('🔍 Testando: Listar conversas');
    const response = await axios.get(`${API_BASE}/mensagens/conversas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Conversas encontradas:', response.data.length);
    console.log('📋 Dados:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao listar conversas:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar buscar usuários
async function testarBuscarUsuarios(token, busca = '') {
  try {
    console.log('🔍 Testando: Buscar usuários');
    const response = await axios.get(`${API_BASE}/mensagens/usuarios?busca=${busca}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Usuários encontrados:', response.data.length);
    console.log('👥 Dados:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar iniciar conversa
async function testarIniciarConversa(token, destinatarioId) {
  try {
    console.log('🔍 Testando: Iniciar conversa');
    const response = await axios.post(`${API_BASE}/mensagens/conversa`, {
      destinatarioId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Conversa iniciada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao iniciar conversa:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar enviar mensagem
async function testarEnviarMensagem(token, destinatarioId, texto) {
  try {
    console.log('🔍 Testando: Enviar mensagem');
    const response = await axios.post(`${API_BASE}/mensagens/enviar`, {
      destinatarioId,
      texto
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Mensagem enviada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar obter mensagens de uma conversa
async function testarObterMensagens(token, conversaId) {
  try {
    console.log('🔍 Testando: Obter mensagens da conversa', conversaId);
    const response = await axios.get(`${API_BASE}/mensagens/conversa/${conversaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Mensagens encontradas:', response.data.length);
    console.log('💬 Dados:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter mensagens:', error.response?.data || error.message);
    return null;
  }
}

// Função principal para executar todos os testes
async function executarTestes() {
  console.log('🚀 Iniciando testes da API de mensagens...\n');

  // Dados de teste (ajuste conforme necessário)
  const email = 'teste@empresa.com';
  const senha = '123456';

  // 1. Fazer login
  console.log('1️⃣ Fazendo login...');
  const token = await login(email, senha);
  if (!token) {
    console.error('❌ Falha no login. Abortando testes.');
    return;
  }
  console.log('✅ Login realizado com sucesso\n');

  // 2. Listar conversas existentes
  console.log('2️⃣ Testando listagem de conversas...');
  const conversas = await testarListarConversas(token);
  console.log('');

  // 3. Buscar usuários
  console.log('3️⃣ Testando busca de usuários...');
  const usuarios = await testarBuscarUsuarios(token, 'teste');
  console.log('');

  if (usuarios && usuarios.length > 0) {
    const primeiroUsuario = usuarios[0];

    // 4. Iniciar conversa
    console.log('4️⃣ Testando início de conversa...');
    const conversa = await testarIniciarConversa(token, primeiroUsuario.id);
    console.log('');

    if (conversa) {
      // 5. Enviar mensagem
      console.log('5️⃣ Testando envio de mensagem...');
      const mensagem = await testarEnviarMensagem(token, primeiroUsuario.id, 'Olá! Esta é uma mensagem de teste.');
      console.log('');

      // 6. Obter mensagens da conversa
      console.log('6️⃣ Testando obtenção de mensagens...');
      await testarObterMensagens(token, conversa.conversaId);
      console.log('');
    }
  }

  // 7. Listar conversas novamente para ver se a nova conversa aparece
  console.log('7️⃣ Verificando conversas após criação...');
  await testarListarConversas(token);
  console.log('');

  console.log('🎉 Testes concluídos!');
}

// Executar os testes
executarTestes().catch(console.error); 