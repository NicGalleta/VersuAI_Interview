export const normalize = (s) =>
  String(s ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const idOf = (s) =>
  String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s/g, '');
