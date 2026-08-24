export class AppError extends Error {
  constructor(code, message, status = 500, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const ERROR_MESSAGES = {
  CONTRACT_INVALID: '生成结果格式校验失败，请联系管理员检查 Dify Workflow 输出契约。',
  DIFY_CALL_FAILED: 'Dify Workflow 调用失败，请稍后重试。',
  DIFY_NOT_CONFIGURED: '生成服务尚未完成配置，请联系管理员。',
  PROJECT_NOT_FOUND: '项目不存在或已被移除。',
  VERSION_NOT_FOUND: '文档版本不存在。',
  CRITICAL_RISK: '当前版本存在严重风险，禁止确认。',
  WARNING_CONFIRMATION_REQUIRED: '该版本包含警告风险，请填写风险确认说明后再确认。',
  AUTHENTICATED_ACTOR_REQUIRED: '当前操作需要已配置的审核人身份。'
};
