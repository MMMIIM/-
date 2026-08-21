export async function executeAuditedExternalWriter({task,provider,service,repository,auditInput,validationOptions={}}){
  const audit=await repository.createExternalWriterCallAudit(auditInput);
  provider.lifecycleObserver=async(state,details)=>repository.transitionExternalWriterCallAudit(audit.id,state,details);
  try{
    const result=await service.runExternal(task,provider,validationOptions);
    await repository.finishExternalWriterCallAudit(audit.id,{...result.provider_audit,status:'completed'});
    return{result,audit_id:audit.id};
  }catch(error){
    try{await repository.finishExternalWriterCallAudit(audit.id,{...(error.audit||{}),status:'failed',error_code:error.code||'EXTERNAL_WRITER_FAILED',error_message:'External Writer E2E failed safely.'});}
    catch(auditError){error.audit_persistence_error={code:auditError.code||'AUDIT_PERSISTENCE_FAILED'};}
    error.audit_id=audit.id;
    throw error;
  }
}
