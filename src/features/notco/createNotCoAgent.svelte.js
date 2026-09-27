import { untrack } from 'svelte';
import { requestReply } from './chat.js';
import { initialPrompt } from './data/prompt.js';
import { testCases } from './data/testCases.js';
import { download } from '../../shared/utils/download.js';

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
    try {
      for (const test of testCases) {
        try {
          const response = await requestReply(testPrompt, [
            { role: 'user', content: test.message },
          ]);
          testResults = [
            ...testResults,
            { message: test.message, response, verdict: 'review' },
          ];
        } catch (error) {
          testResults = [
            ...testResults,
            {
              message: test.message,
              response: null,
              verdict: 'error',
              error: error.message,
            },
          ];
        }
      }
    } finally {
      testing = false;
    }
  }
  try {
    const stored = localStorage.getItem('versu-prompt');
    if (stored) prompt = stored;
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
      prompt = value;
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
