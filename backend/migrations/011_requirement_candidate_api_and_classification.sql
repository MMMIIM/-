ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS requirement_category text,
  ADD COLUMN IF NOT EXISTS writer_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS classification_review_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS atomicity_review_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS classification_method text,
  ADD COLUMN IF NOT EXISTS exclusion_previous_state_json jsonb;

ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS requirement_category text,
  ADD COLUMN IF NOT EXISTS writer_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS classification_review_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS atomicity_review_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS classification_method text;

ALTER TABLE requirement_candidates DROP CONSTRAINT IF EXISTS requirement_candidates_requirement_category_check;
ALTER TABLE requirement_candidates ADD CONSTRAINT requirement_candidates_requirement_category_check
  CHECK (requirement_category IS NULL OR requirement_category IN ('technical','performance','implementation','delivery','service','contractual','commercial','qualification','context'));
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_requirement_category_check;
ALTER TABLE requirements ADD CONSTRAINT requirements_requirement_category_check
  CHECK (requirement_category IS NULL OR requirement_category IN ('technical','performance','implementation','delivery','service','contractual','commercial','qualification','context'));
ALTER TABLE requirement_candidates DROP CONSTRAINT IF EXISTS requirement_candidates_classification_method_check;
ALTER TABLE requirement_candidates ADD CONSTRAINT requirement_candidates_classification_method_check
  CHECK (classification_method IS NULL OR classification_method IN ('automatic','manual'));
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_classification_method_check;
ALTER TABLE requirements ADD CONSTRAINT requirements_classification_method_check
  CHECK (classification_method IS NULL OR classification_method IN ('automatic','manual'));

WITH classified AS (
  SELECT id, array_remove(ARRAY[
    CASE WHEN content ~ '(报价|价格|价款|付款|费用|发票|税率)' THEN 'commercial' END,
    CASE WHEN content ~ '(资质|资格|证书|认证|业绩|投标人)' THEN 'qualification' END,
    CASE WHEN content ~ '(合同|违约|赔偿|责任承担|保密义务|知识产权)' THEN 'contractual' END,
    CASE WHEN content ~ '(性能|并发|响应时间|吞吐|可用性|时延)' THEN 'performance' END,
    CASE WHEN content ~ '(实施|部署|上线|迁移|培训)' THEN 'implementation' END,
    CASE WHEN content ~ '(交付|验收|成果物|技术文档)' THEN 'delivery' END,
    CASE WHEN content ~ '(运维|维护|质保|售后|服务保障)' THEN 'service' END,
    CASE WHEN content ~ '(功能|接口|系统|平台|数据|安全|技术)' THEN 'technical' END,
    CASE WHEN content ~ '(背景|现状|概况|建设目标)' THEN 'context' END
  ], NULL) AS matches FROM requirement_candidates WHERE classification_method IS NULL
)
UPDATE requirement_candidates c SET
  requirement_category=CASE WHEN cardinality(x.matches)=1 THEN x.matches[1] ELSE NULL END,
  writer_eligible=cardinality(x.matches)=1 AND x.matches[1] IN ('technical','performance','implementation','delivery','service'),
  classification_review_required=cardinality(x.matches) <> 1,
  classification_method='automatic'
FROM classified x WHERE c.id=x.id;

CREATE INDEX IF NOT EXISTS candidates_job_category_idx
  ON requirement_candidates(parse_job_id, requirement_category, ordinal);
CREATE INDEX IF NOT EXISTS requirements_project_category_idx
  ON requirements(project_id, requirement_category, ordinal);
