import { initialPrompt } from './data/prompt.js';
import { testCases } from './data/testCases.js';
import { download } from '../../shared/utils/download.js';

export function createNotCoAgent(feedback) {
  let prompt = $state(initialPrompt);
  let agentTab = $state('editor');
  let saved = $state(false);
  let query = $state('');
  let revisions = $state([]);
  try {
    const stored = localStorage.getItem('versu-prompt');
    if (stored) prompt = stored;
    const history = JSON.parse(localStorage.getItem('versu-revisions') || '[]');
    if (Array.isArray(history)) revisions = history;
  } catch {
    /* Storage may be unavailable. */
  }
  function savePrompt() {
    try {
      const next = [
        { date: new Date().toLocaleString('es-CL'), text: prompt },
        ...revisions,
      ].slice(0, 10);
      localStorage.setItem('versu-prompt', prompt);
      localStorage.setItem('versu-revisions', JSON.stringify(next));
      revisions = next;
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
          mode: 'pending-backend',
          system: prompt,
          cases: messages.map((message) => ({
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
    savePrompt,
    testPayload,
  };
}
