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

export function createApp({ repository, storage, generationService, requirementParseService, corsOrigin }) {
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
    try { res.json({ ok: true, job: await requirementParseService.get(req.params.jobId) }); }
    catch (error) { next(error); }
  });

  app.post('/api/tender-parse-jobs/:jobId/confirm', async (req, res, next) => {
    try { res.status(201).json({ ok: true, ...(await requirementParseService.confirm(req.params.jobId)) }); }
    catch (error) { next(error); }
  });

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
    res.status(404).json({ ok: false, error: notFound, ...notFound });
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      const uploadError = { code: 'UPLOAD_INVALID', message: '文件上传失败，请确认文件不超过 50 MB。' };
      return res.status(400).json({ ok: false, error: uploadError, ...uploadError });
    }
    const appError = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', '服务暂时不可用，请稍后重试。', 500);
    const safeError = { code: appError.code, message: appError.message };
    return res.status(appError.status).json({ ok: false, error: safeError, ...safeError });
  });

  return app;
}
