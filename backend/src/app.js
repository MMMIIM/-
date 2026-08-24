import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { AppError, ERROR_MESSAGES } from './errors.js';
import { normalizeUtf8FileName } from './file-name.js';
import { createServerActorResolver, requireTrustedActor, withTrustedActor } from './request-actor.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 1 } });

function requireText(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new AppError('VALIDATION_ERROR', `${fieldName}不能为空。`, 400);
  return normalized;
}

function sendData(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function createApp({ repository, storage, generationService, requirementParseService, requirementSourceService, productionBetaService, companyMaterialService, evidenceService, evidenceFactService, enterpriseRetrievalService, documentGenerationService, reviewCenterService, evidenceReadinessService, materialProcessingCenterService, evidenceReviewService, evidenceSourceFactService, requirementEvidenceFactMappingService, projectFactControlService, documentDeliveryService, agentContextResolver, agentOrchestrator, agentActionExecutor, connectivityPreflight, actorResolver = createServerActorResolver({ actorId: process.env.BACKEND_DEV_ACTOR_ID, actorType: 'development' }), legacyGenerationCompat = false, corsOrigin }) {
  const app = express();
  app.use(cors({ origin: corsOrigin || 'http://localhost:5173' }));
  app.use(express.json({ limit: '2mb' }));
  const trustedActor = (req) => requireTrustedActor(actorResolver, req);

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
      const [tenderFiles, jobs, generations, documentGenerations, versions, parseJobs, requirementBaseline, documentExports] = await Promise.all([
        repository.listTenderFiles(project.id), repository.listJobs(project.id),
        repository.listGenerations(project.id), repository.listDocumentGenerations ? repository.listDocumentGenerations(project.id) : Promise.resolve([]), repository.listVersions(project.id),
        repository.listParseJobs(project.id), repository.getRequirementBaseline(project.id), repository.listDocumentExports ? repository.listDocumentExports(project.id) : Promise.resolve([])
      ]);
      res.json({ project, tenderFiles, jobs, generations, documentGenerations, versions, parseJobs, requirementBaseline, documentExports });
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

  if (legacyGenerationCompat) app.post('/api/projects/:projectId/generation-jobs', async (req, res, next) => {
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
    try { sendData(res, await requirementParseService.confirm(req.params.jobId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by')), 201); }
    catch (error) { next(error); }
  });

  app.post('/api/tender-parse-jobs/:jobId/provisional-decisions', async (req, res, next) => {
    try { sendData(res, await requirementSourceService.includeProvisionalBatch(req.params.jobId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by'))); }
    catch (error) { next(error); }
  });

  app.post('/api/tender-parse-jobs/:jobId/confirm-provisional', async (req, res, next) => {
    try { sendData(res, await requirementSourceService.includeProvisionalBatch(req.params.jobId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by'))); }
    catch (error) { next(error); }
  });

  app.get('/api/requirement-candidates/:candidateId/source-review', async (req, res, next) => {
    try { res.json({ ok: true, ...(await requirementSourceService.getCandidateReview(req.params.candidateId)) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/source-decision', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.decideCandidateSource(req.params.candidateId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by')) }); }
    catch (error) { next(error); }
  });

  app.patch('/api/requirement-candidates/:candidateId/source-status', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.setCandidateStatus(req.params.candidateId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by')) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/confirm-provisional', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.confirmProvisional(req.params.candidateId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by')) }); }
    catch (error) { next(error); }
  });

  app.post('/api/requirement-candidates/:candidateId/exclude', async (req, res, next) => {
    try { sendData(res, { candidate: await requirementSourceService.excludeCandidate(req.params.candidateId, withTrustedActor(req.body, trustedActor(req), 'confirmed_by')) }); }
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

  app.get('/api/runtime/readiness', (_req, res) => {
    res.json(connectivityPreflight?.getSnapshot?.() || {
      status: 'degraded',
      services: {},
      checked_at: null,
      error_class: 'NOT_CONFIGURED'
    });
  });

  app.get('/api/material-library/public', async (req, res, next) => {
    try {
      const scope = req.query.scope ? String(req.query.scope) : null;
      const industry = req.query.industry ? String(req.query.industry) : null;
      sendData(res, { materials: await repository.listPublicCorpusMaterials({ scope, industry }) });
    } catch (error) { next(error); }
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
    try { sendData(res, { evidence: await evidenceService.decide(req.params.evidenceId, 'approved', withTrustedActor(req.body, trustedActor(req), 'decided_by')) }); }
    catch (error) { next(error); }
  });

  app.post('/api/evidences/:evidenceId/reject', async (req, res, next) => {
    try { sendData(res, { evidence: await evidenceService.decide(req.params.evidenceId, 'rejected', withTrustedActor(req.body, trustedActor(req), 'decided_by')) }); }
    catch (error) { next(error); }
  });
  app.patch('/api/evidences/:evidenceId/validity',async(req,res,next)=>{
    try{sendData(res,{evidence:await evidenceService.setValidity(req.params.evidenceId,withTrustedActor(req.body,trustedActor(req),'reviewed_by'))});}catch(error){next(error);}
  });

  app.post('/api/projects/:projectId/evidence-mappings',async(req,res,next)=>{
    try{sendData(res,{mapping:await evidenceService.proposeMapping(req.params.projectId,req.body||{})},201);}catch(error){next(error);}
  });
  app.post('/api/evidence-mappings/:mappingId/approve',async(req,res,next)=>{
    try{sendData(res,{mapping:await evidenceService.decideMapping(req.params.mappingId,'approved',withTrustedActor(req.body,trustedActor(req),'reviewed_by'))});}catch(error){next(error);}
  });
  app.post('/api/evidence-mappings/:mappingId/reject',async(req,res,next)=>{
    try{sendData(res,{mapping:await evidenceService.decideMapping(req.params.mappingId,'rejected',withTrustedActor(req.body,trustedActor(req),'reviewed_by'))});}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/requirements/:requirementId/evidence-mappings',async(req,res,next)=>{
    try{sendData(res,await evidenceService.listMappings(req.params.projectId,req.params.requirementId));}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/requirements/:requirementId/evidence-review',async(req,res,next)=>{
    try{sendData(res,await evidenceService.getRequirementReview(req.params.projectId,req.params.requirementId,req.query||{}));}catch(error){next(error);}
  });
  app.post('/api/projects/:projectId/requirements/:requirementId/evidence-candidates/from-retrieval',async(req,res,next)=>{
    try{const result=await evidenceService.createFromRetrieval(req.params.projectId,req.params.requirementId,req.body||{});sendData(res,result,result.created?201:200);}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/requirements/:requirementId/enterprise-evidence',async(req,res,next)=>{
    try{sendData(res,await evidenceService.listApprovedForRequirement(req.params.projectId,req.params.requirementId));}catch(error){next(error);}
  });
  app.post('/api/projects/:projectId/evidences/:evidenceId/facts',async(req,res,next)=>{
    try{sendData(res,{fact:await evidenceFactService.create(req.params.projectId,req.params.evidenceId,req.body||{})},201);}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/evidences/:evidenceId/facts',async(req,res,next)=>{
    try{sendData(res,await evidenceFactService.list(req.params.projectId,req.params.evidenceId));}catch(error){next(error);}
  });
  app.get('/api/projects/:projectId/evidences/:evidenceId/facts/approved',async(req,res,next)=>{
    try{sendData(res,await evidenceFactService.listApproved(req.params.projectId,req.params.evidenceId));}catch(error){next(error);}
  });
  app.get('/api/evidence-facts/:factId',async(req,res,next)=>{
    try{sendData(res,{fact:await evidenceFactService.get(req.params.factId)});}catch(error){next(error);}
  });
  app.post('/api/evidence-facts/:factId/approve',async(req,res,next)=>{
    try{sendData(res,{fact:await evidenceFactService.decide(req.params.factId,'approved',withTrustedActor(req.body,trustedActor(req),'reviewed_by'))});}catch(error){next(error);}
  });
  app.post('/api/evidence-facts/:factId/reject',async(req,res,next)=>{
    try{sendData(res,{fact:await evidenceFactService.decide(req.params.factId,'rejected',withTrustedActor(req.body,trustedActor(req),'reviewed_by'))});}catch(error){next(error);}
  });
  app.post('/api/evidence-facts/:factId/supersede',async(req,res,next)=>{
    try{sendData(res,{fact:await evidenceFactService.supersede(req.params.factId,req.body||{})},201);}catch(error){next(error);}
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
  app.get('/api/projects/:projectId/review-center',async(req,res,next)=>{try{sendData(res,await reviewCenterService.get(req.params.projectId));}catch(error){next(error);}});
  app.get('/api/projects/:projectId/evidence-readiness',async(req,res,next)=>{try{sendData(res,await evidenceReadinessService.get(req.params.projectId));}catch(error){next(error);}});
  app.get('/api/projects/:projectId/material-processing',async(req,res,next)=>{try{sendData(res,await materialProcessingCenterService.get(req.params.projectId));}catch(error){next(error);}});
  app.post('/api/evidence-reviews/:reviewId/:decision(approve|reject)',async(req,res,next)=>{try{const actor=trustedActor(req);sendData(res,{review:await evidenceReviewService.decide(req.params.reviewId,req.params.decision,{reviewer:actor.actor_id,note:req.body?.note})});}catch(error){next(error);}});
  app.post('/api/evidence-reviews/:reviewId/facts',async(req,res,next)=>{try{sendData(res,await evidenceSourceFactService.extract(req.params.reviewId),201);}catch(error){next(error);}});
  app.post('/api/evidence-source-facts/:factId/:decision(approve|reject)',async(req,res,next)=>{try{const actor=trustedActor(req);sendData(res,{fact:await evidenceSourceFactService.decide(req.params.factId,req.params.decision,{reviewer:actor.actor_id,note:req.body?.note})});}catch(error){next(error);}});
  app.post('/api/projects/:projectId/requirement-evidence-fact-mappings',async(req,res,next)=>{try{sendData(res,{mapping:await requirementEvidenceFactMappingService.propose({projectId:req.params.projectId,requirementId:req.body?.requirement_id,factId:req.body?.fact_id,sourceType:req.body?.source_type||'manual'})},201);}catch(error){next(error);}});
  app.post('/api/requirement-evidence-fact-mappings/:mappingId/:decision(approve|reject)',async(req,res,next)=>{try{const actor=trustedActor(req);sendData(res,{mapping:await requirementEvidenceFactMappingService.decide(req.params.mappingId,req.params.decision,{reviewer:actor.actor_id,note:req.body?.note})});}catch(error){next(error);}});
  app.get('/api/projects/:projectId/project-facts/:factId/impact',async(req,res,next)=>{try{const impact=await reviewCenterService.factImpact(req.params.projectId,req.params.factId);if(!impact)throw new AppError('PROJECT_FACT_NOT_FOUND','Project Fact 不存在。',404);sendData(res,impact);}catch(error){next(error);}});
  app.post('/api/project-facts/:factId/:decision(approve|reject)',async(req,res,next)=>{try{const actor=trustedActor(req);sendData(res,{fact:await projectFactControlService.decide(req.params.factId,req.params.decision,{reviewer:actor.actor_id,note:req.body?.note})});}catch(error){next(error);}});
  app.post('/api/project-facts/:factId/edit',async(req,res,next)=>{try{const actor=trustedActor(req);const current=await repository.getProjectFactCurrent(req.params.factId);if(!current)throw new AppError('PROJECT_FACT_NOT_FOUND','Project Fact 不存在。',404);const impact=await reviewCenterService.factImpact(current.project_id,current.project_fact_id);const fact=await projectFactControlService.edit(req.params.factId,req.body?.fact||{}, {editor:actor.actor_id,note:req.body?.note});sendData(res,{fact,propagation:{...impact,status:'invalidation_completed'}});}catch(error){next(error);}});

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
    try{sendData(res,await productionBetaService.decideClaim(req.params.claimId,'approved',withTrustedActor(req.body,trustedActor(req),'decided_by')));}catch(error){next(error);}
  });
  app.post('/api/claims/:claimId/reject',async(req,res,next)=>{
    try{sendData(res,await productionBetaService.decideClaim(req.params.claimId,'rejected',withTrustedActor(req.body,trustedActor(req),'decided_by')));}catch(error){next(error);}
  });
  app.post('/api/projects/:projectId/document-generations',async(req,res,next)=>{try{sendData(res,await documentGenerationService.generate(req.params.projectId),201);}catch(error){next(error);}});
  app.get('/api/document-generations/:generationId',async(req,res,next)=>{try{const value=await repository.getDocumentGeneration(req.params.generationId);if(!value)throw new AppError('DOCUMENT_GENERATION_NOT_FOUND','正文生成任务不存在。',404);sendData(res,value);}catch(error){next(error);}});
  app.post('/api/document-generations/:generationId/retry-batches',async(req,res,next)=>{try{sendData(res,await documentGenerationService.retry(req.params.generationId));}catch(error){next(error);}});
  app.get('/api/projects/:projectId/document-versions',async(req,res,next)=>{try{sendData(res,{versions:await repository.listVersions(req.params.projectId),generations:await repository.listDocumentGenerations(req.params.projectId)});}catch(error){next(error);}});
  app.get('/api/document-versions/:versionId',async(req,res,next)=>{try{const value=await repository.getPipelineDocumentVersion(req.params.versionId);if(!value)throw new AppError('VERSION_NOT_FOUND','文档版本不存在。',404);sendData(res,{version:value});}catch(error){next(error);}});
  app.post('/api/document-versions/:versionId/confirm',async(req,res,next)=>{try{sendData(res,await generationService.confirmVersion(req.params.versionId,req.body?.confirmation_text,trustedActor(req)));}catch(error){next(error);}});
  app.post('/api/document-versions/:versionId/chapters/:chapterId/regenerate',async(req,res,next)=>{try{sendData(res,{version:await documentGenerationService.regenerate(req.params.versionId,req.params.chapterId)},201);}catch(error){next(error);}});
  app.get('/api/projects/:projectId/document-exports', async (req, res, next) => {
    try { sendData(res, { exports: await repository.listDocumentExports(req.params.projectId) }); } catch (error) { next(error); }
  });
  app.get('/api/projects/:projectId/document-versions/:versionId/export-word', async (req, res, next) => {
    try {
      if (!documentDeliveryService) throw new AppError('DOCUMENT_DELIVERY_UNAVAILABLE', 'Word 交付服务尚未配置。', 503);
      const result = await documentDeliveryService.exportWord({ projectId: req.params.projectId, versionId: req.params.versionId });
      const encodedName = encodeURIComponent(result.fileName).replace(/['()]/g, escape);
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Length', String(result.buffer.length));
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
      res.setHeader('X-Document-Export-Id', result.audit.id);
      res.status(200).send(result.buffer);
    } catch (error) { next(error); }
  });

  if (legacyGenerationCompat) app.get('/api/projects/:projectId/generation-jobs', async (req, res, next) => {
    try { res.json({ jobs: await repository.listJobs(req.params.projectId) }); } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/copilot/context', async (req, res, next) => {
    try {
      if (!agentContextResolver) throw new AppError('AGENT_UNAVAILABLE', '项目助手尚未配置。', 503);
      const context = await agentContextResolver.resolve({ project_id: req.params.projectId, user_id: req.query.user_id, current_route: req.query.current_route, material_id: req.query.material_id, requirement_id: req.query.requirement_id, chapter_id: req.query.chapter_id, document_version_id: req.query.document_version_id });
      sendData(res, { context });
    } catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/copilot', async (req, res, next) => {
    try {
      if (!agentOrchestrator) throw new AppError('AGENT_UNAVAILABLE', '项目助手尚未配置。', 503);
      const message = requireText(req.body?.message, '问题');
      const suppliedContext = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
      if (suppliedContext.project_id && suppliedContext.project_id !== req.params.projectId) throw new AppError('AGENT_CONTEXT_MISMATCH', '当前请求的项目上下文不一致，请从项目工作区重新发起。', 400);
      const result = await agentOrchestrator.run({ message, project_id: req.params.projectId, user_id: req.body?.user_id, context: { ...suppliedContext, project_id: req.params.projectId } });
      sendData(res, result);
    } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/copilot/audits', async (req, res, next) => {
    try {
      if (!repository.listAgentExecutionAudits) throw new AppError('AGENT_AUDIT_UNAVAILABLE', '当前暂时无法读取助手记录。', 503);
      sendData(res, { audits: await repository.listAgentExecutionAudits(req.params.projectId, req.query.limit) });
    } catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/copilot/actions/execute', async (req, res, next) => {
    try {
      if (!agentActionExecutor || !agentContextResolver) throw new AppError('AGENT_ACTION_UNAVAILABLE', '项目助手操作能力尚未配置。', 503);
      const action = requireText(req.body?.tool || req.body?.action, '操作');
      const suppliedContext = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
      if (suppliedContext.project_id && suppliedContext.project_id !== req.params.projectId) throw new AppError('AGENT_CONTEXT_MISMATCH', '当前请求的项目上下文不一致，请从项目工作区重新发起。', 400);
      const context = await agentContextResolver.resolve({ ...suppliedContext, project_id: req.params.projectId, user_id: req.body?.user_id });
      const result = await agentActionExecutor.execute({ context, tool: action, args: req.body?.args || {}, agent_run_id: req.body?.agent_run_id || null, idempotency_key: req.body?.idempotency_key || null, human_approved: req.body?.human_approved === true });
      sendData(res, result);
    } catch (error) { next(error); }
  });

  app.post('/api/projects/:projectId/copilot/actions/execute-plan', async (req, res, next) => {
    try {
      if (!agentActionExecutor || !agentContextResolver) throw new AppError('AGENT_ACTION_UNAVAILABLE', '项目助手操作能力尚未配置。', 503);
      const suppliedContext = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
      if (suppliedContext.project_id && suppliedContext.project_id !== req.params.projectId) throw new AppError('AGENT_CONTEXT_MISMATCH', '当前请求的项目上下文不一致，请从项目工作区重新发起。', 400);
      const context = await agentContextResolver.resolve({ ...suppliedContext, project_id: req.params.projectId, user_id: req.body?.user_id });
      const result = await agentActionExecutor.executePlan({ context, actions: Array.isArray(req.body?.actions) ? req.body.actions : [], agent_run_id: req.body?.agent_run_id || null });
      sendData(res, result);
    } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/copilot/action-audits', async (req, res, next) => {
    try {
      if (!repository.listAgentActionAudits) throw new AppError('AGENT_AUDIT_UNAVAILABLE', '当前暂时无法读取操作记录。', 503);
      sendData(res, { audits: await repository.listAgentActionAudits(req.params.projectId, req.query.limit) });
    } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/copilot/action-previews/:previewId', async (req, res, next) => {
    try {
      if (!repository.getAgentActionPreview) throw new AppError('AGENT_ACTION_UNAVAILABLE', '当前暂时无法读取操作预览。', 503);
      const row = await repository.getAgentActionPreview(req.params.previewId);
      if (!row || row.project_id !== req.params.projectId) throw new AppError('AGENT_PREVIEW_NOT_FOUND', '操作预览不存在或不属于当前项目。', 404);
      const raw = row.preview_json || {};
      sendData(res, { preview: { preview_id: row.preview_id, action_type: row.action_type, target: row.target_json || {}, original_text: raw.original_text || raw.diff?.original || '', proposed_text: raw.proposed_text || raw.diff?.proposed || '', diff: raw.diff || null, validation_result: row.validation_json || {} } });
    } catch (error) { next(error); }
  });

  app.get('/api/projects/:projectId/document-versions', async (req, res, next) => {
    try { res.json({ versions: await repository.listVersions(req.params.projectId) }); } catch (error) { next(error); }
  });

  app.post('/api/document-versions/:versionId/review-decisions', async (req, res, next) => {
    try {
      if (req.body?.decision !== 'confirmed') throw new AppError('VALIDATION_ERROR', '当前阶段仅支持 confirmed 复核结论。', 400);
      const result = await generationService.confirmVersion(req.params.versionId, req.body?.confirmation_text, trustedActor(req));
      res.status(201).json(result);
    } catch (error) { next(error); }
  });

  if (legacyGenerationCompat) app.post('/api/generate-bid', async (req, res, next) => {
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
