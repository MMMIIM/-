export const DOCUMENT_FORMAT_POLICY_VERSION = 'word-default-v1';

export const PROFESSIONAL_WORD_POLICY = Object.freeze({
  version: DOCUMENT_FORMAT_POLICY_VERSION,
  template: 'narrative_proposal',
  page: { size: 'A4', width_dxa: 11906, height_dxa: 16838, margin_dxa: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
  body: { font: 'Calibri', eastAsiaFont: 'Microsoft YaHei', size_half_points: 22, alignment: 'both', first_line_indent: 480, spacing_after: 160, line_twips: 320 },
  headings: {
    1: { font: 'Calibri', eastAsiaFont: 'Microsoft YaHei', size_half_points: 32, color: '2E74B5', before: 360, after: 200 },
    2: { font: 'Calibri', eastAsiaFont: 'Microsoft YaHei', size_half_points: 26, color: '2E74B5', before: 240, after: 120 },
    3: { font: 'Calibri', eastAsiaFont: 'Microsoft YaHei', size_half_points: 24, color: '1F4D78', before: 160, after: 80 }
  },
  table: { width_dxa: 9360, cell_margin: { top: 80, bottom: 80, start: 120, end: 120 }, header_fill: 'F4F6F9' },
  header_footer: { enabled: true, show_project_name: true, show_page_number: true }
});

export function getDocumentFormatPolicy() {
  return PROFESSIONAL_WORD_POLICY;
}
