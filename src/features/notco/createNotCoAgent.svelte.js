import { untrack } from 'svelte';
import { requestReply } from './chat.js';
import { initialPrompt } from './data/prompt.js';
import { testCases } from './data/testCases.js';
import { catalog } from './data/catalog.js';
import { evaluationPrompt, parseEvaluation } from './evaluate.js';
import { download } from '../../shared/utils/download.js';

function withoutEmbeddedCatalog(prompt) {
  return prompt.split(/\nCATÁLOGO · ARCHIVO DEL CASO\r?\n/)[0].trimEnd();
}

export function createNotCoAgent(feedback) {
  let prompt = $state(initialPrompt);
  let agentTab = $state('editor');
  let saved = $state(false);
  let query = $state('');
  let revisions = $state([]);
  let messages = $state([]);
  let sending = $state(false);
  let chatError = $state('');
  let testResults = $state([]);
  let testing = $state(false);
  let evaluating = $state(false);
  let evaluationProgress = $state('');
  let evaluationError = $state('');
  let testPrompt = $state('');

  async function sendMessage() {
    const content = query.trim();
    if (!content || sending) return;
    const previous = messages;
    const next = [...messages, { role: 'user', content }];
    messages = next;
    query = '';
    sending = true;
    chatError = '';
    try {
      const response = await requestReply(prompt, next);
      messages = [...next, { role: 'assistant', content: response }];
    } catch (error) {
      messages = previous;
      query = content;
      chatError = error.message;
    } finally {
      sending = false;
    }
  }
  function resetChat() {
    if (sending) return;
    messages = [];
    query = '';
    chatError = '';
  }
  async function runTests() {
    if (testing) return;
    testing = true;
    testPrompt = prompt;
    testResults = [];
    evaluationError = '';
    try {
      for (const test of testCases) {
        try {
          const response = await requestReply(testPrompt, [
            { role: 'user', content: test.message },
          ]);
          testResults = [
            ...testResults,
            { ...test, response, verdict: 'pending_evaluation' },
          ];
        } catch (error) {
          testResults = [
            ...testResults,
            {
              ...test,
              response: null,
              verdict: 'error',
              error: error.message,
            },
          ];
        }
      }
      const completed = testResults.filter(
        (result) => result.verdict !== 'error',
      );
      for (const [index, result] of completed.entries()) {
        evaluating = true;
        evaluationProgress = `${index + 1}/${completed.length}`;
        try {
          const response = await requestReply(
            evaluationPrompt,
            [
              {
                role: 'user',
                content: JSON.stringify({
                  referenceCatalog: catalog,
                  cases: [result].map(
                    ({ id, message, should, shouldNot, response }) => ({
                      id,
                      message,
                      should,
                      shouldNot,
                      response,
                    }),
                  ),
                }),
              },
            ],
            { mode: 'evaluation' },
          );
          const evaluations = parseEvaluation(response, [result.id]);
          const byId = new Map(
            evaluations.map((result) => [result.id, result]),
          );
          testResults = testResults.map((result) => ({
            ...result,
            ...byId.get(result.id),
          }));
        } catch (error) {
          evaluationError = [
            evaluationError,
            `Prueba ${result.id}: ${error.message}`,
          ]
            .filter(Boolean)
            .join(' ');
          testResults = testResults.map((item) =>
            item.id === result.id
              ? {
                  ...item,
                  verdict: 'inconclusive',
                  reason: `No se pudo evaluar: ${error.message}`,
                  evaluationError: error.message,
                }
              : item,
          );
        }
      }
    } finally {
      evaluating = false;
      testing = false;
    }
  }
  try {
    const stored = localStorage.getItem('versu-prompt');
    if (stored) prompt = withoutEmbeddedCatalog(stored);
    const history = JSON.parse(localStorage.getItem('versu-revisions') || '[]');
    if (Array.isArray(history)) revisions = history;
  } catch {
    /* Storage may be unavailable. */
  }
  let savedPrompt = $state(untrack(() => prompt));
  function savePrompt() {
    try {
      const next = [
        { date: new Date().toLocaleString('es-CL'), text: prompt },
        ...revisions,
      ].slice(0, 10);
      localStorage.setItem('versu-prompt', prompt);
      localStorage.setItem('versu-revisions', JSON.stringify(next));
      revisions = next;
      savedPrompt = prompt;
      saved = true;
    } catch {
      feedback.notice =
        'No se pudo guardar en este navegador. Usa Descargar prompt.';
    }
  }
  function testPayload(messages = testCases.map((t) => t.message)) {
    download(
      'notco-pruebas.json',
      JSON.stringify(
        {
          mode: 'cloudflare-workers-ai',
          evaluation: {
            method: 'sequential-per-case-llm',
            system: evaluationPrompt,
            referenceCatalog: catalog,
            error: evaluationError || null,
          },
          system: testResults.length ? testPrompt : prompt,
          cases: testResults.length
            ? testResults
            : messages.map((message) => ({
                message,
                response: null,
                verdict: 'pending',
              })),
        },
        null,
        2,
      ),
      'application/json',
    );
  }
  return {
    get prompt() {
      return prompt;
    },
    set prompt(value) {
      prompt = withoutEmbeddedCatalog(value);
    },
    get agentTab() {
      return agentTab;
    },
    set agentTab(value) {
      agentTab = value;
    },
    get saved() {
      return saved;
    },
    get hasPromptChanges() {
      return prompt !== savedPrompt;
    },
    get savedPrompt() {
      return savedPrompt;
    },
    set saved(value) {
      saved = value;
    },
    get query() {
      return query;
    },
    set query(value) {
      query = value;
    },
    get revisions() {
      return revisions;
    },
    get messages() {
      return messages;
    },
    get sending() {
      return sending;
    },
    get chatError() {
      return chatError;
    },
    get testResults() {
      return testResults;
    },
    get evaluationProgress() {
      return evaluationProgress;
    },
    get evaluating() {
      return evaluating;
    },
    get evaluationError() {
      return evaluationError;
    },
    get testing() {
      return testing;
    },
    get testsStale() {
      return testResults.length > 0 && testPrompt !== prompt;
    },
    sendMessage,
    resetChat,
    runTests,
    savePrompt,
    testPayload,
  };
}
