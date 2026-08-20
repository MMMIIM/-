import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { AppError, ERROR_MESSAGES } from './errors.js';
import { normalizeUtf8FileName } from './file-name.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 1 } });

function requireText(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new AppError('VALIDATION_ERROR', `${fieldName}不能为空。`, 400);
  return normalized;
}

function sendData(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function createApp({ repository, storage, generationService, requirementParseService, requirementSourceService, productionBetaService, companyMaterialService, evidenceService, enterpriseRetrievalService, documentGenerationService, corsOrigin }) {
  const app = express();
  app.use(cors({ origin: corsOrigin || 'http://localhost:5173' }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', async (_req, res, next) => {
    try {
      await repository.pool.query('SELECT 1');
      res.json({ ok: true, database: 'connected' });
    } catch (error) {
      next(new AppError('DATABASE_UNAVAILABLE', '数据库连接不可用。', 503, error));
    }
  });

  app.post('/api/projects', upload.single('tender_file'), async (req, res, next) => {
    try {
      const project = await repository.createProject({
        name: requireText(req.body?.name, '项目名称'), deadline: req.body?.deadline || null
      });
      let tenderFile = null;
      if (req.file) {
        const originalName = normalizeUtf8FileName(req.file.originalname);
        const storageKey = await storage.save({ projectId: project.id, originalName, buffer: req.file.buffer });
        tenderFile = await repository.addTenderFile({
          projectId: project.id, originalName, storageKey,
          mimeType: req.file.mimetype || 'application/octet-stream', sizeBytes: req.file.size
        });
      }
      res.status(201).json({ project, tenderFile });
    } catch (error) { next(error); }
  });

  app.get('/api/projects', async (_req, res, next) => {
    try { res.json({ projects: await repository.listProjects() }); } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId', async (req, res, next) => {
    try {
      const project = await repository.getProject(req.params.projectId);
      if (!project) throw new AppError('PROJECT_NOT_FOUND', ERROR_MESSAGES.PROJECT_NOT_FOUND, 404);
      const [tenderFiles, jobs, generations, versions, parseJobs, requirementBaseline] = await Promise.all([
        repository.listTenderFiles(project.id), repository.listJobs(project.id),
        repository.listGenerations(project.id), repository.listVersions(project.id),
        repository.listParseJobs(project.id), repository.getRequirementBaseline(project.id)
      ]);
      res.json({ project, tenderFiles, jobs, generations, versions, parseJobs, requirementBaseline });
    } catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/tender-files', upload.single('file'), async (req, res, next) => {
    try {
      const project = await repository.getProject(req.params.projectId);
      if (!project) throw new AppError('PROJECT_NOT_FOUND', ERROR_MESSAGES.PROJECT_NOT_FOUND, 404);
      if (!req.file) throw new AppError('VALIDATION_ERROR', '请选择要上传的招标文件。', 400);
      const originalName = normalizeUtf8FileName(req.file.originalname);
      const storageKey = await storage.save({ projectId: project.id, originalName, buffer: req.file.buffer });
      const file = await repository.addTenderFile({
        projectId: project.id, originalName, storageKey,
        mimeType: req.file.mimetype || 'application/octet-stream', sizeBytes: req.file.size
      });
      res.status(201).json({ file });
    } catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/generation-jobs', async (req, res, next) => {
    try {
      const result = await generationService.generate({ projectId: req.params.projectId, inputs: req.body, user: req.body?.user });
      res.status(201).json({
        job: result.job,
        generation: {
          id: result.generation.id,
          status: result.generation.status,
          workflow_version: result.generation.workflow_version,
          runtime_ms: result.generation.runtime_ms,
          created_at: result.generation.created_at
        },
        documentVersion: result.version
      });
    } catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/tender-parse-jobs', async (req, res, next) => {
    try {
      const tenderFileId = requireText(req.body?.tender_file_id, '招标文件');
      const job = await requirementParseService.start({
        projectId: req.params.projectId,
        tenderFileId
      });
      res.status(201).json({ ok: true, job });
    } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/tender-parse-jobs', async (req, res, next) => {
    try {
      const project = await repository.getProject(req.params.projectId);
      if (!project) throw new AppError('PROJECT_NOT_FOUND', ERROR_MESSAGES.PROJECT_NOT_FOUND, 404);
      res.json({ ok: true, jobs: await repository.listParseJobs(project.id) });
    } catch (error) { next(error); }
  });

  app.get('/api/tender-parse-jobs/:jobId', async (req, res, next) => {
    try { sendData(res, { job: await requirementParseService.get(req.params.jobId) }); }
    catch (error) { next(error); }
  });

  app.get('/api/tender-parse-jobs/:jobId/requirement-candidates', async (req, res, next) => {
    try { sendData(res, await requirementSourceService.listCandidates(req.params.jobId, req.query)); }
    catch (error) { next(error); }
  });

  app.get('/api/tender-parse-jobs/:jobId/confirmation-risk', async (req, res, next) => {
    try { sendData(res, await requirementSourceService.getConfirmationRisk(req.params.jobId)); }
    catch (error) { next(error); }
  });

  app.post('/api/tender-parse-jobs/:jobId/confirm', async (req, res, next) => {
    try { sendData(res, await requirementParseService.confirm(req.params.jobId, req.body || {}), 201); }
    catch (error) { next(error); }
  });

  app.post('/api/tender-parse-jobs/:jobId/provisional-decisions', async (req, res, next) => {
    try { sendData(res, await requirementSourceService.includeProvisionalBatch(req.params.jobId, req.body || {})); }
    catch (error) { next(error); }
  });

  app.post('/api/tender-parse-jobs/:jobId/confirm-provisional', async (req, res, next) => {
    try { sendData(res, await requirementSourceService.includeProvisionalBatch(req.params.jobId, req.body || {})); }
    catch (error) { next(error); }
  });

  app.get('/api/requirement-candidates/:candidateId/source-review', async (req, res, next) => {
    try { res.json({ ok: true, ...(await requirementSourceService.getCandidateReview(req.params.candidateId)) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/source-decision', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.decideCandidateSource(req.params.candidateId, req.body || {}) }); }
    catch (error) { next(error); }
  });

  app.patch('/api/requirement-candidates/:candidateId/source-status', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.setCandidateStatus(req.params.candidateId, req.body || {}) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/confirm-provisional', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.confirmProvisional(req.params.candidateId, req.body || {}) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/exclude', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.excludeCandidate(req.params.candidateId, req.body || {}) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/restore', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.restoreCandidate(req.params.candidateId) }); }
    catch (error) { next(error); }
  });

  app.patch('/api/requirement-candidates/:candidateId/classification', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.updateClassification(req.params.candidateId, req.body || {}) }); }
    catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/company-materials', async (req, res, next) => {
    try { sendData(res, await companyMaterialService.list(req.params.projectId)); }
    catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/company-materials', upload.single('file'), async (req, res, next) => {
    try { sendData(res, { material: await companyMaterialService.upload({ projectId:req.params.projectId, file:req.file, materialType:String(req.body?.material_type || '') }) }, 201); }
    catch (error) { next(error); }
  });

  app.get('/api/company-materials/:materialId/chunks', async (req,res,next)=>{
    try{sendData(res,await companyMaterialService.listChunks(req.params.materialId));}catch(error){next(error);}
  });

  app.get('/api/projects/:projectId/evidences', async (req, res, next) => {
    try { sendData(res, await evidenceService.list(req.params.projectId)); }
    catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/evidences', async (req, res, next) => {
    try { sendData(res, { evidence: await evidenceService.create(req.params.projectId, req.body || {}) }, 201); }
    catch (error) { next(error); }
  });

  app.post('/api/evidences/:evidenceId/approve', async (req, res, next) => {
    try { sendData(res, { evidence: await evidenceService.decide(req.params.evidenceId, 'approved', req.body || {}) }); }
    catch (error) { next(error); }
  });

  app.post('/api/evidences/:evidenceId/reject', async (req, res, next) => {
    try { sendData(res, { evidence: await evidenceService.decide(req.params.evidenceId, 'rejected', req.body || {}) }); }
    catch (error) { next(error); }
  });
  app.patch('/api/evidences/:evidenceId/validity',async(req,res,next)=>{
    try{sendData(res,{evidence:await evidenceService.setValidity(req.params.evidenceId,req.body||{})});}catch(error){next(error);}
  });

  app.post('/api/projects/:projectId/evidence-mappings',async(req,res,next)=>{
    try{sendData(res,{mapping:await evidenceService.proposeMapping(req.params.projectId,req.body||{})},201);}catch(error){next(error);}
  });
  app.post('/api/evidence-mappings/:mappingId/approve',async(req,res,next)=>{
    try{sendData(res,{mapping:await evidenceService.decideMapping(req.params.mappingId,'approved',req.body||{})});}catch(error){next(error);}
  });
  app.post('/api/evidence-mappings/:mappingId/reject',async(req,res,next)=>{
    try{sendData(res,{mapping:await evidenceService.decideMapping(req.params.mappingId,'rejected',req.body||{})});}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/requirements/:requirementId/evidence-mappings',async(req,res,next)=>{
    try{sendData(res,await evidenceService.listMappings(req.params.projectId,req.params.requirementId));}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/requirements/:requirementId/enterprise-evidence',async(req,res,next)=>{
    try{sendData(res,await evidenceService.listApprovedForRequirement(req.params.projectId,req.params.requirementId));}catch(error){next(error);}
  });
  app.post('/api/requirements/:requirementId/enterprise-retrieval',async(req,res,next)=>{
    try{sendData(res,await enterpriseRetrievalService.retrieve(req.params.requirementId,req.body||{}),201);}catch(error){next(error);}
  });
  app.get('/api/enterprise-retrieval-runs/:runId',async(req,res,next)=>{
    try{sendData(res,await enterpriseRetrievalService.get(req.params.runId));}catch(error){next(error);}
  });

  app.get('/api/projects/:projectId/production-beta', async (req, res, next) => {
    try { sendData(res, await productionBetaService.get(req.params.projectId)); }
    catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/production-beta', async (req, res, next) => {
    try { sendData(res, await productionBetaService.process(req.params.projectId, req.body), 201); }
    catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/response-plans/generate', async (req,res,next)=>{
    try{sendData(res,await productionBetaService.generatePlans(req.params.projectId),201);}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/response-plans',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.getPlans(req.params.projectId));}catch(error){next(error);}
  });
  app.patch('/api/projects/:projectId/response-plans/:requirementId',async(req,res,next)=>{try{sendData(res,await productionBetaService.editPlan(req.params.projectId,req.params.requirementId,req.body||{}));}catch(error){next(error);}});
  app.post('/api/projects/:projectId/claims/generate',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.generateClaims(req.params.projectId),201);}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/claims',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.getClaims(req.params.projectId));}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/coverage',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.coverage(req.params.projectId));}catch(error){next(error);}
  });
  app.post('/api/claims/:claimId/approve',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.decideClaim(req.params.claimId,'approved',req.body||{}));}catch(error){next(error);}
  });
  app.post('/api/claims/:claimId/reject',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.decideClaim(req.params.claimId,'rejected',req.body||{}));}catch(error){next(error);}
  });
  app.post('/api/projects/:projectId/document-generations',async(req,res,next)=>{try{sendData(res,await documentGenerationService.generate(req.params.projectId),201);}catch(error){next(error);}});
  app.get('/api/document-generations/:generationId',async(req,res,next)=>{try{const value=await repository.getDocumentGeneration(req.params.generationId);if(!value)throw new AppError('DOCUMENT_GENERATION_NOT_FOUND','正文生成任务不存在。',404);sendData(res,value);}catch(error){next(error);}});
  app.post('/api/document-generations/:generationId/retry-batches',async(req,res,next)=>{try{sendData(res,await documentGenerationService.retry(req.params.generationId));}catch(error){next(error);}});
  app.get('/api/projects/:projectId/document-versions',async(req,res,next)=>{try{sendData(res,{versions:await repository.listVersions(req.params.projectId),generations:await repository.listDocumentGenerations(req.params.projectId)});}catch(error){next(error);}});
  app.get('/api/document-versions/:versionId',async(req,res,next)=>{try{const value=await repository.getPipelineDocumentVersion(req.params.versionId);if(!value)throw new AppError('VERSION_NOT_FOUND','文档版本不存在。',404);sendData(res,{version:value});}catch(error){next(error);}});
  app.post('/api/document-versions/:versionId/confirm',async(req,res,next)=>{try{const version=await repository.getVersion(req.params.versionId);if(!version)throw new AppError('VERSION_NOT_FOUND','文档版本不存在。',404);if(version.risk_status==='critical')throw new AppError('CRITICAL_RISK','严重风险版本禁止确认。',409);sendData(res,await repository.confirmVersion(version,req.body?.confirmation_text));}catch(error){next(error);}});
  app.post('/api/document-versions/:versionId/chapters/:chapterId/regenerate',async(req,res,next)=>{try{sendData(res,{version:await documentGenerationService.regenerate(req.params.versionId,req.params.chapterId)},201);}catch(error){next(error);}});

  app.get('/api/projects/:projectId/generation-jobs', async (req, res, next) => {
    try { res.json({ jobs: await repository.listJobs(req.params.projectId) }); } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/document-versions', async (req, res, next) => {
    try { res.json({ versions: await repository.listVersions(req.params.projectId) }); } catch (error) { next(error); }
  });

  app.post('/api/document-versions/:versionId/review-decisions', async (req, res, next) => {
    try {
      if (req.body?.decision !== 'confirmed') throw new AppError('VALIDATION_ERROR', '当前阶段仅支持 confirmed 复核结论。', 400);
      const result = await generationService.confirmVersion(req.params.versionId, req.body?.confirmation_text);
      res.status(201).json(result);
    } catch (error) { next(error); }
  });

  app.post('/api/generate-bid', async (req, res, next) => {
    try {
      const result = await generationService.generate({ projectId: null, inputs: req.body, user: req.body?.user });
      res.json({ markdown: result.parsed.markdown, response_mode: 'streaming', job_id: result.job.id });
    } catch (error) { next(error); }
  });

  app.use('/api', (_req, res) => {
    const notFound = { code: 'API_NOT_FOUND', message: '请求的 API 不存在，请确认前后端版本一致。' };
    res.status(404).json({ ok: false, error: notFound });
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      const uploadError = { code: 'UPLOAD_INVALID', message: '文件上传失败，请确认文件不超过 50 MB。' };
      return res.status(400).json({ ok: false, error: uploadError });
    }
    const appError = error instanceof AppError ? error : error?.code && Number.isInteger(error?.status)
      ? new AppError(error.code, error.message, error.status)
      : new AppError('INTERNAL_ERROR', '服务暂时不可用，请稍后重试。', 500);
    const safeError = { code: appError.code, message: appError.message };
    return res.status(appError.status).json({ ok: false, error: safeError });
  });

  return app;
}
