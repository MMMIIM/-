export const DOCUMENT_FORMAT_POLICY_VERSION = 'word-default-v1-r1';

export const PROFESSIONAL_WORD_POLICY = Object.freeze({
  version: DOCUMENT_FORMAT_POLICY_VERSION,
  template: 'narrative_proposal',
  page: { size: 'A4', width_dxa: 11906, height_dxa: 16838, margin_dxa: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
  body: { font: 'SimSun', eastAsiaFont: 'SimSun', hAnsi: 'SimSun', size_half_points: 24, alignment: 'both', first_line_indent: 480, spacing_after: 120, line_twips: 360 },
  headings: {
    1: { font: 'SimHei', eastAsiaFont: 'SimHei', hAnsi: 'SimHei', size_half_points: 32, color: '000000', before: 360, after: 180 },
    2: { font: 'SimHei', eastAsiaFont: 'SimHei', hAnsi: 'SimHei', size_half_points: 28, color: '000000', before: 240, after: 120 },
    3: { font: 'SimHei', eastAsiaFont: 'SimHei', hAnsi: 'SimHei', size_half_points: 24, color: '000000', before: 160, after: 80 }
  },
  table: { width_mode: 'body', cell_margin: { top: 80, bottom: 80, left: 180, right: 180 }, header_fill: 'F4F6F9', font: 'SimSun', eastAsiaFont: 'SimSun', hAnsi: 'SimSun', size_half_points: 21, indent_dxa: 0 },
  cover: { title_size_half_points: 36, subtitle_size_half_points: 28, label_size_half_points: 24, title_color: '000000', hide_page_number: true },
  toc: { title: '目 录', note: '目录页码将在 Word/WPS 中更新目录后显示。', heading_style_range: '1-3' },
  header_footer: { enabled: true, show_project_name: true, show_page_number: true, page_number_start: 1 }
});

export function getUsableBodyWidth(policy = PROFESSIONAL_WORD_POLICY) {
  const margins = policy.page.margin_dxa || {};
  return Math.max(0, Number(policy.page.width_dxa) - Number(margins.left || 0) - Number(margins.right || 0));
}

export function getDocumentFormatPolicy() {
  return PROFESSIONAL_WORD_POLICY;
}
