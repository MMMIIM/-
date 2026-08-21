import { createWriterSafeContext, WRITER_INPUT_AUTHORIZATION_VERSION } from './pipeline/writer-input-authorization-v1.js';

export class WriterInputAuthorizationService{
  constructor({repository=null}={}){this.repository=repository;}
  build(input){return createWriterSafeContext(input);}
  async persist(context){if(!this.repository)return context;return this.repository.saveWriterSafeContext(context);}
  async persistMentions(context){if(!this.repository)return context.future_mentions;return this.repository.upsertFactMentionLedger(context.future_mentions);}
  async invalidateStale(projectId,versions){if(!this.repository)return 0;return this.repository.invalidateWriterAuthorization(projectId,{...versions,authorizationContractVersion:WRITER_INPUT_AUTHORIZATION_VERSION});}
}
