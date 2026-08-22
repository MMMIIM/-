const TWIPS_PER_POINT = 20;
const TWIPS_PER_CM = 567;

export const DOCUMENT_FORMAT_POLICY_VERSION = 'word-default-v1-r1.1';
export const SYSTEM_DEFAULT_TECHNICAL_BID_V1 = 'SYSTEM_DEFAULT_TECHNICAL_BID_V1';

function cmToTwips(value) {
  return Math.round(Number(value || 0) * TWIPS_PER_CM);
}

function ptToTwips(value) {
  return Math.round(Number(value || 0) * TWIPS_PER_POINT);
}

const pageMarginsCm = Object.freeze({ top: 2.5, right: 2.5, bottom: 2.5, left: 3 });
const pageMarginsDxa = Object.freeze(Object.fromEntries(
  Object.entries(pageMarginsCm).map(([side, value]) => [side, cmToTwips(value)])
));

/**
 * Product-facing bid format semantics. Renderer-only OOXML units are derived
 * through the helpers below so future profiles can express the same rules in
 * points, characters and centimeters rather than hard-coded twips.
 */
export const PROFESSIONAL_WORD_POLICY = Object.freeze({
  version: DOCUMENT_FORMAT_POLICY_VERSION,
  profile_id: SYSTEM_DEFAULT_TECHNICAL_BID_V1,
  profile_type: 'SYSTEM_DEFAULT',
  template: 'narrative_proposal',
  page: {
    size: 'A4',
    orientation: 'portrait',
    width_dxa: 11906,
    height_dxa: 16838,
    margins_cm: pageMarginsCm,
    margin_dxa: pageMarginsDxa,
    section_behavior: 'cover_toc_body'
  },
  body: {
    font: 'SimSun',
    eastAsiaFont: 'SimSun',
    hAnsi: 'SimSun',
    size_pt: 12,
    size_half_points: 24,
    color: '000000',
    alignment: 'both',
    firstLineIndentChars: 2,
    line_spacing: { mode: 'multiple', value: 1.5 },
    paragraph_before_pt: 0,
    paragraph_after_pt: 0
  },
  headings: {
    1: { font: 'SimHei', eastAsiaFont: 'SimHei', hAnsi: 'SimHei', size_pt: 16, size_half_points: 32, bold: true, color: '000000', before_pt: 18, after_pt: 9, numbering_level: 0, page_break_before: false },
    2: { font: 'SimHei', eastAsiaFont: 'SimHei', hAnsi: 'SimHei', size_pt: 14, size_half_points: 28, bold: true, color: '000000', before_pt: 12, after_pt: 6, numbering_level: 1, page_break_before: false },
    3: { font: 'SimHei', eastAsiaFont: 'SimHei', hAnsi: 'SimHei', size_pt: 12, size_half_points: 24, bold: true, color: '000000', before_pt: 8, after_pt: 4, numbering_level: 2, page_break_before: false }
  },
  heading_numbering: { left_dxa_per_level: 720, hanging_dxa: 360 },
  table: {
    font: 'SimSun', eastAsiaFont: 'SimSun', hAnsi: 'SimSun', size_pt: 10.5, size_half_points: 21,
    width_policy: 'usable_body_width', alignment: 'left', indent_dxa: 0,
    paragraph_before_pt: 0, paragraph_after_pt: 0,
    cell_padding_dxa: { top: 80, bottom: 80, left: 180, right: 180 },
    border: { style: 'single', outer_size: 4, outer_color: 'B7C4D6', inner_size: 2, inner_color: 'D9E2F3' },
    header_fill: 'F4F6F9'
  },
  cover: {
    title_size_half_points: 36, document_title_size_half_points: 40, subtitle_size_half_points: 28, label_size_half_points: 24,
    title_color: '000000', hide_page_number: true,
    spacing_pt: { top: 75, title_after: 45, document_title_after: 24, subtitle_after: 90, detail_after: 9 }
  },
  toc: {
    enabled: true, title: '目 录', title_size_half_points: 32,
    note: '目录页码将在 Word/WPS 中更新目录后显示。', note_size_half_points: 20,
    title_after_pt: 12, note_after_pt: 18, heading_depth: 3, heading_style_range: '1-3', updateable: true
  },
  sections: {
    cover: { type: 'first_page', title_page: true, header: false, footer: false, page_number: false },
    toc: { type: 'next_page', title_page: true, header: false, footer: false, page_number: false },
    body: { type: 'next_page', title_page: false, header: true, footer: true, page_number: true, page_number_start: 1 }
  },
  header_footer: {
    enabled: true, show_project_name: true, header_size_half_points: 20, header_after_pt: 0,
    show_page_number: true, page_number_format: '第 {PAGE} 页', page_number_start: 1
  }
});

export function getPageMarginsDxa(policy = PROFESSIONAL_WORD_POLICY) {
  if (policy.page?.margin_dxa) return { ...policy.page.margin_dxa };
  const margins = policy.page?.margins_cm || {};
  return {
    top: cmToTwips(margins.top), right: cmToTwips(margins.right),
    bottom: cmToTwips(margins.bottom), left: cmToTwips(margins.left)
  };
}

export function getUsableBodyWidth(policy = PROFESSIONAL_WORD_POLICY) {
  const margins = getPageMarginsDxa(policy);
  return Math.max(0, Number(policy.page.width_dxa) - Number(margins.left || 0) - Number(margins.right || 0));
}

export function getFirstLineIndentTwips(policy = PROFESSIONAL_WORD_POLICY) {
  const body = policy.body || {};
  const chars = Math.max(0, Number(body.firstLineIndentChars || 0));
  const halfPoints = Number(body.size_half_points || Math.round(Number(body.size_pt || 0) * 2));
  return Math.round(chars * halfPoints * (TWIPS_PER_POINT / 2));
}

export function getBodyLineSpacingTwips(policy = PROFESSIONAL_WORD_POLICY) {
  const body = policy.body || {};
  const lineSpacing = body.line_spacing || {};
  const value = Number(lineSpacing.value || 1);
  const halfPoints = Number(body.size_half_points || Math.round(Number(body.size_pt || 0) * 2));
  return Math.round(value * halfPoints * (TWIPS_PER_POINT / 2));
}

export function getParagraphSpacingTwips(policy = PROFESSIONAL_WORD_POLICY, role = 'body') {
  const source = role === 'body' ? policy.body : policy.headings?.[Number(role)] || policy.body;
  return {
    before: ptToTwips(source.before_pt ?? source.paragraph_before_pt ?? 0),
    after: ptToTwips(source.after_pt ?? source.paragraph_after_pt ?? 0)
  };
}

export function getDocumentFormatPolicy() {
  return PROFESSIONAL_WORD_POLICY;
}

export { cmToTwips, ptToTwips };
