import { assertVersionCanBeConfirmed } from './contract.js';
import { AppError, ERROR_MESSAGES } from './errors.js';
import { sanitizeAuditJson, sanitizeAuditText } from './audit.js';

export const REQUIRED_INPUTS = ['project_name', 'project_type', 'bid_need', 'focus_points', 'output_mode'];

export class GenerationService {
  constructor({ repository, difyClient, workflowVersion, logger = console }) {
    this.repository = repository;
    this.difyClient = difyClient;
    this.workflowVersion = workflowVersion;
    this.logger = logger;
  }

  async generate({ projectId, inputs, user }) {
    const missing = REQUIRED_INPUTS.filter((key) => !String(inputs?.[key] || '').trim());
    if (missing.length) throw new AppError('VALIDATION_ERROR', `缺少必要字段：${missing.join('、')}`, 400);
    if (projectId && !(await this.repository.getProject(projectId))) {
      throw new AppError('PROJECT_NOT_FOUND', ERROR_MESSAGES.PROJECT_NOT_FOUND, 404);
    }
    const job = await this.repository.createJob({ projectId, inputs });
    await this.repository.updateJob(job.id, 'running');
    const startedAt = Date.now();
    try {
      const parsed = await this.difyClient.run(inputs, user);
      const result = await this.repository.completeGeneration({
        job, parsed, workflowVersion: this.workflowVersion, runtimeMs: Date.now() - startedAt
      });
      return { job: { ...job, status: 'succeeded' }, ...result, parsed };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('GENERATION_FAILED', '生成任务失败，请稍后重试。', 500);
      try {
        await this.repository.recordFailedGeneration({
          job,
          responsePayloadJson: sanitizeAuditJson(appError.audit?.responsePayloadJson),
          rawDifyResponseJson: sanitizeAuditJson(appError.audit?.rawDifyResponseJson),
          rawResponseText: sanitizeAuditText(appError.audit?.rawResponseText),
          errorCode: appError.code,
          errorMessage: appError.message,
          workflowVersion: this.workflowVersion,
          runtimeMs: Date.now() - startedAt
        });
      } catch (auditError) {
        this.logger.error('Failed to persist generation audit', {
          jobId: job.id,
          error: auditError instanceof Error ? auditError.message : String(auditError)
        });
      }
      try {
        await this.repository.updateJob(job.id, 'failed', { code: appError.code, message: appError.message });
      } catch (jobUpdateError) {
        this.logger.error('Failed to persist generation job failure', {
          jobId: job.id,
          error: jobUpdateError instanceof Error ? jobUpdateError.message : String(jobUpdateError)
        });
      }
      throw appError;
    }
  }

  async confirmVersion(versionId, confirmationText) {
    const version = await this.repository.getVersion(versionId);
    if (!version) throw new AppError('VERSION_NOT_FOUND', ERROR_MESSAGES.VERSION_NOT_FOUND, 404);
    assertVersionCanBeConfirmed(version, confirmationText);
    return this.repository.confirmVersion(version, String(confirmationText || '').trim());
  }
}
