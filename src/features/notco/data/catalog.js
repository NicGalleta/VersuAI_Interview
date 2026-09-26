import catalog from '../../../../datos/catalogo_notco.csv?raw';
import Papa from 'papaparse';
export { catalog };
export const products = Papa.parse(catalog, {
  header: true,
  skipEmptyLines: true,
}).data;
