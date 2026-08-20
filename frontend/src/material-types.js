export const MATERIAL_TYPES = [
  'company_profile','qualification','case','project_case','product','product_documentation',
  'personnel','technical_solution','technical_whitepaper','delivery_capability','historical_bid','other'
];

export const MATERIAL_TYPE_LABELS = {
  company_profile:'企业介绍',qualification:'资质材料',case:'案例材料',project_case:'项目案例',
  product:'产品材料',product_documentation:'产品文档',personnel:'人员材料',technical_solution:'技术方案',
  technical_whitepaper:'技术白皮书',delivery_capability:'交付能力',historical_bid:'历史标书',other:'其他材料'
};

export function formatMaterialType(type) {
  return MATERIAL_TYPE_LABELS[type] || String(type || '未知类型');
}
