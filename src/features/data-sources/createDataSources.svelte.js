import usageText from '../../../datos/uso_mensual.csv?raw';
import { parseCSV } from './csv/parseCSV.js';

export function createDataSources(feedback, onUploaded) {
  const demo = parseCSV(usageText, 'usage');
  let usage = $state(demo.rows);
  let customers = $state([]);
  let warnings = $state(demo.warnings);
  let usageFile = $state('uso_mensual.csv · ejemplo incluido');
  let customersFile = $state('Sin cargar');
  async function upload(event, type) {
    const file = event.target.files?.[0];
    if (!file) return;
    feedback.error = '';
    feedback.notice = '';
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error('El archivo supera los 10 MB.');
      const parsed = parseCSV(await file.text(), type);
      if (type === 'usage') {
        usage = parsed.rows;
        usageFile = file.name;
        warnings = parsed.warnings;
      } else {
        customers = parsed.rows;
        customersFile = file.name;
      }
      onUploaded();
      feedback.notice = `${file.name}: ${parsed.rows.length} filas cargadas. Cartera actualizada.`;
    } catch (e) {
      feedback.error = e.message;
    }
    event.target.value = '';
  }
  return {
    get usage() {
      return usage;
    },
    get customers() {
      return customers;
    },
    get warnings() {
      return warnings;
    },
    get usageFile() {
      return usageFile;
    },
    get customersFile() {
      return customersFile;
    },
    upload,
  };
}
