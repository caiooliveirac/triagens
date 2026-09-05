# Plano do MVP — Triagens com IA de verdade

**Objetivo:** substituir a "IA fingida" do site estático (`js/data.js` renderizando listas fixas) por um agente real que lê as **nuances do caso** digitadas pelo regulador e devolve, em segundos, as perguntas mais pertinentes e uma tendência de classificação (USA / USB / meios próprios), dentro do protocolo da queixa selecionada.

**Prazo alvo:** MVP usável em 5 dias de trabalho, com avaliação clínica na segunda semana.

---

## 1. O que existe hoje

| Componente | Estado atual |
|---|---|
| `index.html` | Página única, Tailwind via CDN, ícones Lucide. Fluxo: categoria → queixa → cartões Vermelho/Amarelo/Verde + "Orientações do Agente IA". |
| `js/data.js` | 5 categorias, 46 queixas, ~40 protocolos com `vermelha / amarela / verde / orientacoes`. Queixas sem protocolo caem num placeholder genérico ("Critério de gravidade 1"). |
| `js/app.js` | Renderização e busca. Sem chamada de rede. O bloco "Orientações do Agente IA" só imprime `protocol.orientacoes`. |
| Deploy | GitHub Pages via `.github/workflows/static.yml` (branch `main`). |
| Peso morto | `bootstrap-5.3.2-dist/` (não é referenciado por nada), `.DS_Store`. |

O conteúdo clínico já estruturado é o maior ativo. Ele vira a **base de conhecimento** que o agente recebe a cada chamada.

---

## 2. Decisões de arquitetura (já tomadas)

### 2.1 Forma geral

```
┌──────────────────────┐        HTTPS (SSE)        ┌──────────────────────────┐        ┌──────────────┐
│  web/  (GitHub Pages)│ ────────────────────────► │  api/  (Node 22 + Hono)  │ ─────► │  Claude API  │
│  HTML + Tailwind + JS│ ◄──────────────────────── │  /api/triagem  (stream)  │ ◄───── │ fable-5-1    │
│  caixa de nuances    │   perguntas + tendência   │  prompt + protocolo      │        │ effort medium│
└──────────────────────┘                           └──────────────────────────┘        └──────────────┘
                                                              │
                                                              ▼
                                                   SQLite (casos anonimizados,
                                                   feedback 👍/👎, custo/latência)
```

- **Frontend continua estático** e no GitHub Pages. Não migrar para React agora: o ganho é zero para o MVP e custa 1–2 dias. Só entra uma caixa de texto, um painel de resposta e um `fetch` com streaming.
- **Backend separado, minúsculo:** um serviço Node/TypeScript com [Hono](https://hono.dev). Uma rota de negócio (`POST /api/triagem`), uma de feedback, uma de saúde. Deploy em **Railway** ou **Fly.io** (Dockerfile de 15 linhas; ambos têm plano grátis/barato e HTTPS pronto).
- **Chave da Anthropic nunca vai ao navegador.** Fica em variável de ambiente do backend. O frontend fala só com o backend.
- **Monorepo:** `web/` (o site atual movido), `api/` (novo), `shared/protocolos.json` (os dados de `data.js` extraídos, lidos pelos dois lados).

### 2.2 Modelo e parâmetros

| Parâmetro | Escolha | Por quê |
|---|---|---|
| Modelo | `claude-fable-5-1` | Pedido explícito. É o modelo com melhor leitura de nuance clínica e de instruções longas. Troca por `claude-opus-5` via env var (`TRIAGE_MODEL`) se o custo pesar; mesmo código. |
| Esforço | `output_config.effort: "medium"` | Triagem é raciocínio curto sobre poucos dados; `medium` no Fable já supera `xhigh` de gerações anteriores e responde em segundos. `low` fica como opção para uma "resposta rápida". |
| Thinking | Omitido (sempre ligado no Fable) com `display: "summarized"` | O resumo do raciocínio vira o indicador de progresso na tela ("Avaliando tempo de crise…"). |
| Saída | **Structured output** (schema Zod → `output_config.format`) | Garante JSON válido para renderizar cartões e gravar métricas (tendência, recurso sugerido) sem regex. |
| Streaming | Sim (`client.beta.messages.stream`) | Time-to-first-signal baixo; a UI mostra o raciocínio resumido enquanto o JSON final é montado. |
| Cache de prompt | `cache_control: {type:"ephemeral", ttl:"1h"}` no system prompt | O system prompt + protocolo são idênticos entre chamadas da mesma queixa; cache reduz o custo de entrada a ~2,5 %. |
| Fallback de recusa | `fallbacks: "default"` + beta `server-side-fallback-2026-07-01` | Se o classificador de segurança do Fable recusar um caso (ex.: intoxicação intencional), a API re-executa em outro modelo na mesma chamada. Sempre checar `stop_reason === "refusal"` antes de ler o conteúdo. |
| Tool choice | Não usar forçado (`any`/`tool`) | Retorna 400 no Fable 5.1. Structured output resolve o que tool forçado resolveria. |
| Retenção de dados | Org precisa de retenção de 30 dias (padrão) | Fable 5.1 não roda em org com zero data retention. |

### 2.3 Contrato da API

`POST /api/triagem` — corpo:

```json
{
  "categoria": "clinicos",
  "queixa": "Crise convulsiva",
  "nuances": "Homem 34a, epiléptico conhecido, parou de tomar carbamazepina há 3 dias. Crise há ~10 min, esposa diz que 'ainda treme'. Não bateu a cabeça.",
  "historico": [],
  "codigo_acesso": "…"
}
```

Resposta: SSE com três tipos de evento — `progresso` (linhas do thinking resumido), `resultado` (o JSON abaixo, uma vez) e `erro`.

```json
{
  "leitura_do_caso": "Crise possivelmente ativa há ≥10 min em epiléptico com suspensão abrupta de anticonvulsivante — status epilepticus é a hipótese a excluir primeiro.",
  "tendencia": "vermelho",
  "recurso_sugerido": "USA",
  "confianca": "alta",
  "perguntas_prioritarias": [
    {
      "pergunta": "Neste exato momento ele ainda está com abalos ou já parou e está 'mole'/sonolento?",
      "por_que": "Define crise ativa >5 min (status) vs. pós-ictal.",
      "se_sim": "vermelho — USA imediata",
      "se_nao": "reavaliar consciência e recorrência"
    },
    {
      "pergunta": "Desde que começou, ele chegou a acordar/responder entre um episódio e outro?",
      "por_que": "Crises recorrentes sem recuperação = status epilepticus.",
      "se_sim": "amarelo/vermelho conforme duração",
      "se_nao": "vermelho"
    },
    { "pergunta": "Lábios ou face roxos? Respiração ruidosa?", "por_que": "Hipóxia / obstrução de via aérea.", "se_sim": "vermelho", "se_nao": "mantém avaliação" }
  ],
  "sinais_de_alarme_a_confirmar": ["Duração real > 5 min", "Cianose", "Trauma craniano na queda", "Febre associada"],
  "orientacoes_ao_solicitante": [
    "Não segure os braços e pernas; afaste objetos ao redor.",
    "Não coloque nada na boca.",
    "Quando parar, vire-o de lado."
  ],
  "criterios_do_protocolo_atendidos": {
    "vermelha": ["Crise ativa no momento", "Status epilepticus (> 5 min)"],
    "amarela": [],
    "verde": ["Paciente epiléptico diagnosticado", "Uso irregular da medicação habitual"]
  },
  "aviso": "Sugestão de apoio à regulação. A decisão é do médico regulador."
}
```

`historico` permite seguimento no mesmo caso ("ele parou de tremer agora e está falando") — o frontend guarda a conversa e envia tudo; o backend é stateless. Regra do Fable 5.1: histórico **só cresce** (nunca editar turnos anteriores) e os blocos de `thinking` voltam intactos.

`POST /api/feedback` — `{ caso_id, util: true|false, comentario? }`.

### 2.4 Segurança, custo e LGPD no MVP

- **Código de acesso** compartilhado (env `ACCESS_CODE`) enviado em header. Suficiente para piloto fechado; login real fica para depois.
- **Rate limit** por IP (ex.: 20 chamadas/min) e `max_tokens` 4 000 na resposta. Sem isso, a chave fica exposta a abuso de custo.
- **CORS** restrito a `https://caiooliveirac.github.io`.
- **Dados do paciente:** a UI instrui "não digite nome, CPF, endereço ou telefone". O backend grava o caso com um `caso_id` aleatório, sem IP, para avaliação clínica e melhoria do prompt. Aviso de LGPD/uso profissional no rodapé.
- **Custo estimado por triagem** (Fable, effort medium, prompt em cache): ~500 tokens de entrada novos + ~2 500 em cache + ~1 500 de saída (thinking + JSON).

| Modelo | Custo aproximado / triagem | 1 000 triagens/mês |
|---|---|---|
| `claude-fable-5-1` | US$ 0,08 | ~US$ 80 |
| `claude-opus-5` | US$ 0,04 | ~US$ 40 |

Números para dimensionar, não para faturar; medir com `usage` real nas primeiras 100 chamadas.

---

## 3. O cérebro: system prompt do agente

> **Versão vigente: v2, em [`docs/PROMPT_AGENTE.md`](PROMPT_AGENTE.md)** — resposta compacta, campo "descartar", limites impostos pelo schema e cinco casos de provocação com gabarito. O texto abaixo é a v1, mantido só como histórico.

O prompt é o produto. Versão inicial (pt-BR, guardada em `api/src/prompt.ts` e versionada):

```
Você é um médico regulador experiente do SAMU 192 apoiando outro regulador em tempo real.

CONTEXTO FIXO DESTA CHAMADA
- Categoria: {categoria}
- Queixa principal selecionada: {queixa}
- Protocolo local da queixa (critérios que a central já adota):
  Vermelho (USA / emergência): {vermelha}
  Amarelo (USB / urgência): {amarela}
  Verde (orientação ou meios próprios): {verde}
  Orientações padrão ao solicitante: {orientacoes}

SUA TAREFA
O regulador digitou apenas as nuances do caso — o que foge do óbvio do protocolo. Leia com atenção clínica:
1. Identifique o que já está definido pelas nuances e o que ainda está em aberto para decidir entre
   USA (suporte avançado), USB (suporte básico) ou orientar a ir por meios próprios à unidade de
   emergência mais próxima.
2. Proponha de 2 a 5 perguntas, em ordem de prioridade, que o regulador deve fazer AGORA ao
   solicitante. Cada pergunta deve ser curta, falável ao telefone, em linguagem leiga, e deve
   discriminar entre níveis. Não pergunte o que as nuances já responderam.
3. Dê a tendência de classificação com os dados atuais e o grau de confiança. Se faltar dado
   decisivo, diga "indefinido" e aponte qual pergunta resolve.
4. Liste orientações imediatas ao solicitante, adaptadas ao caso (não repita as padrão se não se aplicam).

REGRAS
- Fundamente-se no protocolo acima; quando as nuances indicarem gravidade que o protocolo não cobre,
  diga isso explicitamente e classifique pela gravidade.
- Na dúvida entre dois níveis, tenda ao mais grave e explique em uma frase.
- Considere idade, gestação, comorbidades, tempo de evolução, medicações e o que o solicitante
  consegue observar por telefone.
- Não invente dados. Não faça diagnóstico definitivo. Não prescreva medicação.
- Você apoia; quem decide é o médico regulador humano.
- Responda apenas no formato estruturado solicitado, em português do Brasil, sem preâmbulos.
```

Princípios para iterar o prompt no Fable 5.1: declarar objetivo e restrições, não passo-a-passo rígido; usar o campo `historico` para seguimento; testar `effort` `low` vs `medium` no conjunto de avaliação antes de decidir.

---

## 4. Esqueleto do backend (`api/`)

```
api/
├── Dockerfile
├── package.json          # hono, @hono/node-server, @anthropic-ai/sdk, zod, better-sqlite3
├── tsconfig.json
└── src/
    ├── index.ts          # servidor Hono, CORS, rate limit, rotas
    ├── prompt.ts         # buildSystemPrompt(protocolo) — texto acima
    ├── schema.ts         # Zod: TriagemInput, TriagemOutput
    ├── triagem.ts        # chamada ao Claude (stream + structured output + fallbacks)
    ├── protocolos.ts     # carrega ../shared/protocolos.json
    └── db.ts             # SQLite: casos, feedback
```

Núcleo da chamada (`triagem.ts`), com os nomes exatos do SDK atual:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TriagemOutput } from "./schema";

const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente
const MODEL = process.env.TRIAGE_MODEL ?? "claude-fable-5-1";

export async function* triar(input: TriagemInput, protocolo: Protocolo) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: "medium", format: zodOutputFormat(TriagemOutput) },
    system: [{ type: "text", text: buildSystemPrompt(input, protocolo),
               cache_control: { type: "ephemeral", ttl: "1h" } }],
    messages: [...input.historico, { role: "user", content: input.nuances }],
  });

  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "thinking_delta")
      yield { tipo: "progresso", texto: ev.delta.thinking };
  }
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") { yield { tipo: "erro", motivo: "recusa", detalhe: msg.stop_details }; return; }
  const texto = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
  yield { tipo: "resultado", dados: TriagemOutput.parse(JSON.parse(texto)), usage: msg.usage,
          conteudo_assistente: msg.content }; // devolvido ao cliente para o próximo turno
}
```

Detalhes a respeitar: `max_tokens` sem streaming cortaria; SDK em TypeScript usa `timeout` em milissegundos; erros tratados por classe (`Anthropic.RateLimitError`, `Anthropic.APIError`), nunca por texto.

---

## 5. Mudanças no frontend (`web/`)

Na aba de cada queixa (ex.: Crise convulsiva), abaixo dos três cartões:

1. **Caixa "Nuances do caso"** (textarea, 3–6 linhas) com placeholder real: *"Ex.: 34a, epiléptico, parou remédio há 3 dias, crise há 10 min, ainda treme, não bateu a cabeça"*. Aviso curto: *"Não digite nome, documento ou telefone."*
2. **Botão "Analisar com o agente"** (Enter+Ctrl também). Enquanto roda: linhas do raciocínio resumido aparecendo em cinza ("Avaliando duração da crise…").
3. **Painel de resultado** substitui o bloco "Orientações do Agente IA" hoje estático:
   - faixa de **tendência** (vermelho/amarelo/verde/indefinido) + **recurso sugerido** (USA / USB / meios próprios) + confiança;
   - **perguntas prioritárias** como lista numerada (aqui a ordem carrega informação), cada uma com "se sim → / se não →";
   - critérios do protocolo já atendidos, marcados nos próprios cartões Vermelho/Amarelo/Verde (checkbox verde);
   - orientações ao solicitante;
   - **campo de seguimento**: "O solicitante respondeu…" reenvia com `historico`.
4. **Feedback** 👍 / 👎 + comentário opcional por resposta (alimenta o conjunto de avaliação).
5. Remover `bootstrap-5.3.2-dist/`, mover `data.js` → `shared/protocolos.json` (frontend carrega via `fetch`), completar os protocolos faltantes (hoje várias queixas caem no placeholder).

---

## 6. Fases e entregáveis

| Fase | Quando | Entregável | Critério de pronto |
|---|---|---|---|
| **0 — Reorganizar** | Dia 1 (manhã) | Monorepo `web/`, `api/`, `shared/protocolos.json`; Pages passa a publicar `web/`. | Site atual continua funcionando idêntico em `caiooliveirac.github.io/triagens/`. |
| **1 — Backend com IA** | Dias 1–2 | `POST /api/triagem` com stream, structured output, cache, fallback, rate limit, código de acesso; deploy em Railway/Fly; `GET /health`. | `curl` com o caso da crise convulsiva devolve JSON válido em < 15 s. |
| **2 — Frontend conectado** | Dias 3–4 | Caixa de nuances, painel de resultado, seguimento, feedback. | Médico consegue triar um caso fim-a-fim no celular e no desktop. |
| **3 — Avaliação clínica** | Dias 5–8 | 40–60 casos escritos por você (nuances + classificação esperada + perguntas que um bom regulador faria), script `api/eval/` que roda todos e mede concordância de tendência; ajuste do prompt e do `effort`. | ≥ 85 % de concordância na tendência; zero casos em que o agente subestima um vermelho. |
| **4 — Operação piloto** | Semana 2–3 | SQLite com casos anonimizados e feedback; página `/admin` simples (lista de casos, taxa de 👍, latência, custo por dia); completar protocolos faltantes. | 1–2 reguladores usando em turno real com código de acesso. |
| **Depois** | — | Login por usuário, multi-central (protocolos por município), entrada por voz (transcrever a ligação), exportar registro da regulação, histórico de versões do prompt com A/B. | Decidir com dados da fase 4. |

A fase 3 é o que separa "demo de IA" de "ferramenta clínica": sem um conjunto de casos com gabarito não dá para saber se uma mudança de prompt melhorou ou piorou.

---

## 7. Riscos e como o plano os trata

| Risco | Mitigação já no plano |
|---|---|
| Agente subestima gravidade | Regra "na dúvida, o mais grave"; métrica de subestimação de vermelho = 0 como critério de pronto; protocolo local sempre injetado. |
| Latência alta afasta o regulador | Streaming com raciocínio visível; `effort: medium`; opção `low`; medir p95. |
| Custo dispara | Cache 1 h no system prompt, `max_tokens` 4 000, rate limit, código de acesso, `TRIAGE_MODEL` para trocar por Opus 5. |
| Recusa do modelo em casos sensíveis (intoxicação, autoagressão) | `fallbacks: "default"`; tratamento explícito de `stop_reason: "refusal"` com mensagem útil ao regulador. |
| Dados de paciente na nuvem | Instrução na UI, sem coleta de identificadores, sem IP no log, aviso legal; termo de uso profissional antes do piloto ampliado. |
| Responsabilidade clínica | Produto posicionado como apoio à decisão; decisão final e registro continuam do regulador humano. |

---

## 8. Próximo passo

Para começar a executar: pedir "**execute a Fase 0 e a Fase 1**". Pré-requisitos do seu lado: uma chave de API da Anthropic (console.anthropic.com) e uma conta no Railway ou Fly.io para receber o backend.
