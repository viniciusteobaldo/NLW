const apiKeyInput = document.getElementById('apiKey');
const gameSelect = document.getElementById('gameSelect');
const questionInput = document.getElementById('question');
const askButton = document.getElementById('askButton');
const aiResponseDiv = document.getElementById('aiResponse');
const form = document.getElementById('form');

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

const gerarPromptPorJogo = (game, question) => {
  const dataAtual = new Date().toLocaleDateString();

  const basePrompt = `
## Especialidade
Você é um especialista assistente de meta para o jogo ${game.toUpperCase()}.

## Tarefa
Responda às perguntas com base no seu conhecimento atualizado, considerando estratégias, builds, dicas e metas atuais.

## Regras
- Se você não souber a resposta, diga "Não sei" e não invente.
- Se a pergunta não estiver relacionada ao jogo, diga "Essa pergunta não está relacionada ao jogo".
- Considere a data atual: ${dataAtual}.
- Suponha que você tem acesso à versão mais atualizada do patch.
- Nunca responda com informações desatualizadas ou inventadas.
- Máximo de 500 caracteres. Responda em Markdown.
- Não cumprimente nem se despeça.

`;

  const exemplos = {
    csgo: `## Contexto Adicional
Foque em estratégias por mapa (ex: Mirage, Dust2), economia de rounds, uso de granadas e táticas de CT/TR.

## Exemplo
Pergunta: Melhor estratégia para forçar round TR em Mirage
Resposta: Use smokes para jungle e CT, rush A com split palace + rampa. Priorize MAC-10 e Tec-9.`,

    mobilelegends: `## Contexto Adicional
Considere funções como tank, support, ADC, e builds específicas por herói e função.

## Exemplo
Pergunta: Melhor build para Layla ADC
Resposta: **Itens:** Berserker's Fury, Scarlet Phantom... **Emblemas:** Marksman personalizado.`,

    valorant: `## Contexto Adicional
Foque em táticas por mapa (ex: Ascent, Haven), funções de agentes (Duelist, Sentinel) e composições ideais.

## Exemplo
Pergunta: Melhor agente para defesa em Haven
Resposta: **Sage** é ótima para travar push em C. Use slow + parede para atrasar entrada. Combine com Killjoy.`
  };

  return `${basePrompt}${exemplos[game] || ''}

## Pergunta do usuário
${question}`;
};

const perguntarAI = async (question, game, apiKey) => {
  const modelo = "gemini-2.0-flash";
  const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
  const prompt = gerarPromptPorJogo(game, question);

  const contents = [{
    role: "user",
    parts: [{ text: prompt }]
  }];

  const tools = [{ google_search: {} }];

  const response = await fetch(geminiURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, tools })
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
};

const enviarFormulario = async (event) => {
  event.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  const game = gameSelect.value;
  const question = questionInput.value.trim();

  if (!apiKey || !game || !question) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  askButton.disabled = true;
  askButton.textContent = 'Perguntando...';
  askButton.classList.add('loading');

  try {
    const text = await perguntarAI(question, game, apiKey);
    aiResponseDiv.querySelector('.response-content').innerHTML = markdownToHTML(text);
    aiResponseDiv.classList.remove('hidden');
  } catch (error) {
    console.error('Erro ao enviar a pergunta:', error);
    aiResponseDiv.querySelector('.response-content').textContent = 'Erro ao obter resposta.';
    aiResponseDiv.classList.remove('hidden');
  } finally {
    askButton.disabled = false;
    askButton.textContent = 'Perguntar...';
    askButton.classList.remove('loading');
  }
};

form.addEventListener('submit', enviarFormulario);