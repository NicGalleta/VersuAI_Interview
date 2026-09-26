import tests from '../../../../datos/mensajes_prueba.md?raw';
export const testCases = [
  ...tests.matchAll(
    /\*\*(\d+)\.\*\* `([^`]+)`\s+- Debería: ([\s\S]*?)\n- No debería: ([\s\S]*?)(?=\n---|$)/g,
  ),
].map((m) => ({
  id: m[1],
  message: m[2],
  should: m[3].trim(),
  shouldNot: m[4].trim(),
}));
