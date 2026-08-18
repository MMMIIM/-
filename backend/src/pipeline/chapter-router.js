const CHAPTERS = [
  { id: 'project-understanding', title: '项目理解', keywords: ['背景', '目标', '范围', '现状'] },
  { id: 'data-integration', title: '数据接入与集成', keywords: ['数据', '接口', '接入', '对接', '第三方'] },
  { id: 'solution-design', title: '技术方案', keywords: ['功能', '架构', '平台', '系统', '技术'] },
  { id: 'implementation-plan', title: '实施计划', keywords: ['实施', '交付', '工期', '进度', '上线'] },
  { id: 'security-compliance', title: '安全与合规', keywords: ['安全', '合规', '保密', '等保', '权限'] },
  { id: 'service-commitment', title: '服务与运维', keywords: ['服务', '运维', '响应', 'SLA', '保障'] }
];

const DEFAULT_CHAPTER = { id: 'solution-design', title: '技术方案' };

export function routeRequirement(requirement) {
  const text = String(requirement?.text || '');
  const matched = CHAPTERS
    .filter((chapter) => chapter.keywords.some((keyword) => text.includes(keyword)))
    .map((chapter) => chapter.id);
  return matched.length ? matched : [DEFAULT_CHAPTER.id];
}

export function planChapters(requirements) {
  const selected = new Set(requirements.flatMap((requirement) => requirement.target_sections));
  return CHAPTERS
    .filter((chapter) => selected.has(chapter.id))
    .map(({ id, title }) => ({
      id,
      title,
      requirement_ids: requirements
        .filter((requirement) => requirement.target_sections.includes(id))
        .map((requirement) => requirement.req_id)
    }));
}

export const chapterCatalog = CHAPTERS.map(({ id, title }) => ({ id, title }));
