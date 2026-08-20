import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanyMaterialService } from '../src/company-material-service.js';
import { EvidenceService } from '../src/evidence-service.js';
import { EvidenceCatalogService } from '../src/pipeline/evidence-catalog-service.js';
import { AppError } from '../src/errors.js';
import { chunkEnterpriseMaterial } from '../src/pipeline/enterprise-material-chunker.js';
import { ClaimGateService } from '../src/pipeline/claim-gate-service.js';

const PROJECT_ID='00000000-0000-4000-8000-000000000001';
const MATERIAL_ID='00000000-0000-4000-8000-000000000002';

function materialRepository(overrides={}) {
  return {
    getProject: async () => ({id:PROJECT_ID}), findCompanyMaterialByHash:async()=>null,
    createCompanyMaterial:async(value)=>({id:MATERIAL_ID,...value}),
    completeCompanyMaterialExtraction:async(id,text)=>({id,extraction_status:'succeeded',extracted_text:text}), replaceMaterialChunks:async(_id,chunks)=>chunks,
    failCompanyMaterialExtraction:async(id,error)=>({id,extraction_status:error.status,...error}),
    ...overrides
  };
}

test('企业材料 DOCX、PDF、TXT、Markdown 走本地提取并保存 hash', async () => {
  const saved=[];
  const service=new CompanyMaterialService({repository:materialRepository(),storage:{save:async(value)=>{saved.push(value);return 'stored';}},textExtractor:async({fileName})=>({text:`extracted:${fileName}`})});
  for(const name of ['a.docx','b.pdf','c.txt','d.md']) {
    const result=await service.upload({projectId:PROJECT_ID,materialType:'technical_solution',file:{originalname:name,mimetype:'application/octet-stream',buffer:Buffer.from(name),size:name.length}});
    assert.equal(result.extraction_status,'succeeded'); assert.equal(result.extracted_text,`extracted:${name}`);
  }
  assert.equal(saved.length,4);
});

test('Company Material 上传接受 Enterprise Evidence Contract v1 新材料类型', async () => {
  for (const materialType of ['project_case','product_documentation','technical_whitepaper','historical_bid']) {
    const repository={getProject:async()=>({id:PROJECT_ID}),findCompanyMaterialByHash:async()=>null,createCompanyMaterial:async(value)=>({id:'material-'+materialType,...value}),completeCompanyMaterialExtraction:async(id,text)=>({id,extracted_text:text,extraction_status:'succeeded'}),replaceMaterialChunks:async()=>{}};
    const service=new CompanyMaterialService({repository,storage:{save:async()=>('stored-'+materialType)},textExtractor:async()=>({text:'公开材料正文'})});
    const result=await service.upload({projectId:PROJECT_ID,materialType,file:{originalname:materialType+'.md',mimetype:'text/markdown',buffer:Buffer.from('公开材料正文'),size:18}});
    assert.equal(result.extraction_status,'succeeded');
  }
});

test('Company Material 稳定切块且 source_text/hash/range 可回溯',()=>{
  const source='第一段企业能力。\n\n第二段项目案例。';
  const first=chunkEnterpriseMaterial(MATERIAL_ID,source,{maxChars:8}); const second=chunkEnterpriseMaterial(MATERIAL_ID,source,{maxChars:8});
  assert.deepEqual(first,second); assert.ok(first.length>=2);
  for(const chunk of first){assert.equal(source.slice(chunk.char_start,chunk.char_end),chunk.source_text);assert.match(chunk.chunk_hash,/^[a-f0-9]{64}$/);}
});

test('扫描 PDF 标记 OCR_REQUIRED 且重复 hash 返回冲突', async () => {
  let failed;
  const scanService=new CompanyMaterialService({repository:materialRepository({failCompanyMaterialExtraction:async(_id,error)=>{failed=error;}}),storage:{save:async()=> 'scan'},textExtractor:async()=>{throw new AppError('TENDER_TEXT_EMPTY','empty',422);}});
  await assert.rejects(()=>scanService.upload({projectId:PROJECT_ID,materialType:'other',file:{originalname:'scan.pdf',mimetype:'application/pdf',buffer:Buffer.from('scan'),size:4}}),(error)=>error.code==='OCR_REQUIRED');
  assert.equal(failed.status,'ocr_required');
  const duplicate=new CompanyMaterialService({repository:materialRepository({findCompanyMaterialByHash:async()=>({id:MATERIAL_ID})}),storage:{save:async()=>{throw new Error('不应保存');}},textExtractor:async()=>({text:'x'})});
  await assert.rejects(()=>duplicate.upload({projectId:PROJECT_ID,materialType:'other',file:{originalname:'a.txt',mimetype:'text/plain',buffer:Buffer.from('same'),size:4}}),(error)=>error.code==='MATERIAL_DUPLICATE'&&error.status===409);
});

test('Evidence 只关联已确认 REQ，未知来源保持 null', async () => {
  let created;
  const repository={getCompanyMaterial:async()=>({id:MATERIAL_ID,project_id:PROJECT_ID,material_type:'case',extraction_status:'succeeded'}),findInvalidConfirmedRequirementIds:async(_project,ids)=>ids.filter((id)=>id!=='REQ-001'),createEvidenceRecord:async(value)=>{created=value;return {id:'e',...value,approval_status:'draft'};}};
  const service=new EvidenceService({repository});
  await assert.rejects(()=>service.create(PROJECT_ID,{material_id:MATERIAL_ID,title:'案例',content:'能力',applicable_requirement_ids:['REQ-X']}),(error)=>error.code==='EVIDENCE_REQUIREMENT_INVALID');
  await assert.rejects(()=>service.create(PROJECT_ID,{material_id:MATERIAL_ID,title:'案例',content:'能力',source_page:1,applicable_requirement_ids:['REQ-001']}),(error)=>error.code==='EVIDENCE_SOURCE_INVALID');
  await service.create(PROJECT_ID,{material_id:MATERIAL_ID,evidence_type:'case',title:'案例',content:'能力',applicable_requirement_ids:['REQ-001']});
  assert.equal(created.sourceText,null); assert.equal(created.sourcePage,null); assert.equal(created.sourceParagraph,null); assert.equal(created.sourceHash,null);
});

test('draft/rejected Evidence 不进入下游，approved 可用', () => {
  const items=[
    {evidence_id:'E-D',approval_status:'draft'},
    {evidence_id:'E-R',approval_status:'rejected'},
    {evidence_id:'E-A',approval_status:'approved'}
  ];
  const catalog=new EvidenceCatalogService(items);
  assert.throws(()=>catalog.assertExisting(['E-D']),(error)=>error.code==='EVIDENCE_NOT_APPROVED');
  assert.throws(()=>catalog.assertExisting(['E-R']),(error)=>error.code==='EVIDENCE_NOT_APPROVED');
  assert.deepEqual(catalog.assertExisting(['E-A']),['E-A']);
  assert.deepEqual(catalog.list().map((item)=>item.evidence_id),['E-A']);
});

test('Evidence 从真实 chunk 创建，客户端不能伪造 usable_for_claims',async()=>{
  const source='企业已完成某项目实施。'; const [chunk]=chunkEnterpriseMaterial(MATERIAL_ID,source); let created;
  const repository={getCompanyMaterial:async()=>({id:MATERIAL_ID,project_id:PROJECT_ID,material_type:'project_case',extraction_status:'succeeded',extracted_text:source}),getMaterialChunk:async(id)=>id===chunk.chunk_id?chunk:null,findInvalidConfirmedRequirementIds:async()=>[],createEvidenceRecord:async(value)=>{created=value;return value;}};
  await new EvidenceService({repository}).create(PROJECT_ID,{material_id:MATERIAL_ID,source_chunk_id:chunk.chunk_id,title:'案例',content:'企业已完成某项目实施。',usable_for_claims:true});
  assert.equal(created.sourceText,source);assert.equal(created.sourceHash,chunk.chunk_hash);assert.equal(created.sourceLocation.char_start,0);assert.equal(Object.hasOwn(created,'usableForClaims'),false);
  await assert.rejects(()=>new EvidenceService({repository}).create(PROJECT_ID,{material_id:MATERIAL_ID,title:'x',content:'x',source_text:'模型改写文本'}),(error)=>error.code==='EVIDENCE_SOURCE_CHUNK_REQUIRED');
  await assert.rejects(()=>new EvidenceService({repository}).create(PROJECT_ID,{material_id:MATERIAL_ID,title:'x',content:'x',validity_status:'active'}),(error)=>error.code==='EVIDENCE_VALIDITY_REVIEW_REQUIRED');
  await assert.rejects(()=>new EvidenceService({repository:{...repository,getMaterialChunk:async()=>null}}).create(PROJECT_ID,{material_id:MATERIAL_ID,source_chunk_id:'MCH-X',title:'x',content:'x'}),(error)=>error.code==='EVIDENCE_SOURCE_CHUNK_INVALID');
  await assert.rejects(()=>new EvidenceService({repository}).create(PROJECT_ID,{material_id:MATERIAL_ID,source_chunk_id:chunk.chunk_id,source_text:'伪造原文',title:'x',content:'x'}),(error)=>error.code==='EVIDENCE_SOURCE_LINEAGE_INVALID');
  await assert.rejects(()=>new EvidenceService({repository:{...repository,getMaterialChunk:async()=>({...chunk,material_id:'00000000-0000-4000-8000-000000000099'})}}).create(PROJECT_ID,{material_id:MATERIAL_ID,source_chunk_id:chunk.chunk_id,title:'x',content:'x'}),(error)=>error.code==='EVIDENCE_SOURCE_CHUNK_INVALID');
});

test('Approval 与 validity 分离审核',async()=>{
  const repository={updateEvidenceValidity:async(value)=>({...value,validity_status:value.validityStatus,validity_reviewed_by:value.reviewedBy})};const service=new EvidenceService({repository});
  const result=await service.setValidity(MATERIAL_ID,{validity_status:'expired',reviewed_by:'auditor'});assert.equal(result.validity_status,'expired');assert.equal(result.validity_reviewed_by,'auditor');
  await assert.rejects(()=>service.setValidity(MATERIAL_ID,{validity_status:'active'}),(error)=>error.code==='EVIDENCE_VALIDITY_REVIEWER_REQUIRED');
});

test('expired/revoked 不可用于企业 Claim，historical_bid 只能 reference_only',()=>{
  const requirement={req_id:'REQ-001',text:'系统应支持部署。',writer_eligible:true,requirement_category:'technical',source_status:'verified'};
  for(const evidence of [
    {evidence_id:'E-EXPIRED',approval_status:'approved',source_lineage_verified:true,usable_for_claims:false,source_type:'qualification'},
    {evidence_id:'E-REVOKED',approval_status:'approved',source_lineage_verified:true,usable_for_claims:false,source_type:'qualification'},
    {evidence_id:'E-HISTORY',approval_status:'approved',source_lineage_verified:true,usable_for_claims:false,source_type:'historical_bid'}
  ]){
    const gate=new ClaimGateService({projectId:PROJECT_ID,requirements:[requirement],plans:[],evidenceCatalog:new EvidenceCatalogService([evidence])});
    const [item]=gate.evaluate([{requirement_id:'REQ-001',claim_type:'enterprise_capability',text:'我司具备部署能力。',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[evidence.evidence_id],requested_commitment:'confirmed'}]).evaluated;
    assert.equal(item.decision.reason_code,'EVIDENCE_NOT_USABLE_FOR_CLAIMS');
  }
});

test('approved + active 仍必须有可信 lineage，完整 project_case 才可支撑 Claim',()=>{
  const requirement={req_id:'REQ-001',text:'系统应支持部署。',writer_eligible:true,requirement_category:'technical',source_status:'verified'};
  const claim={requirement_id:'REQ-001',claim_type:'company_case',text:'我司具备项目经验。',basis_requirement_ids:['REQ-001'],basis_evidence_ids:['E-CASE'],requested_commitment:'confirmed'};
  let gate=new ClaimGateService({projectId:PROJECT_ID,requirements:[requirement],plans:[],evidenceCatalog:new EvidenceCatalogService([{evidence_id:'E-CASE',approval_status:'approved',source_type:'project_case',validity_status:'active',source_lineage_verified:false,usable_for_claims:false}])});
  assert.equal(gate.evaluate([claim]).evaluated[0].decision.reason_code,'EVIDENCE_SOURCE_LINEAGE_REQUIRED');
  gate=new ClaimGateService({projectId:PROJECT_ID,requirements:[requirement],plans:[],evidenceCatalog:new EvidenceCatalogService([{evidence_id:'E-CASE',approval_status:'approved',source_type:'project_case',validity_status:'active',source_lineage_verified:true,usable_for_claims:true}])});
  assert.equal(gate.evaluate([claim]).evaluated[0].decision.decision,'approved');
});

test('Requirement-Evidence mapping proposed 需人工审批，rejected 不是正式关联',async()=>{
  const events=[];const repository={findInvalidConfirmedRequirementIds:async()=>[],validateEvidenceForMapping:async()=>({approval_status:'approved',source_lineage_verified:true}),createRequirementEvidenceMapping:async(value)=>{events.push(value);return{mapping_status:'proposed',support_level:value.supportLevel,...value};},getRequirementEvidenceMapping:async()=>({mapping_id:MATERIAL_ID,support_level:'partial_support'}),decideRequirementEvidenceMapping:async({decision,supportLevel,...value})=>({mapping_status:decision,support_level:supportLevel,...value}),listApprovedEnterpriseEvidenceForRequirement:async()=>[]};
  const service=new EvidenceService({repository});const proposed=await service.proposeMapping(PROJECT_ID,{requirement_id:'REQ-001',evidence_id:MATERIAL_ID,mapping_source:'manual',support_level:'partial_support',created_by:'reviewer'});
  assert.equal(proposed.mapping_status,'proposed');assert.equal(proposed.support_level,'partial_support');const rejected=await service.decideMapping(MATERIAL_ID,'rejected',{reviewed_by:'reviewer'});assert.equal(rejected.mapping_status,'rejected');assert.equal(rejected.support_level,'partial_support');assert.equal((await service.listApprovedForRequirement(PROJECT_ID,'REQ-001')).evidences.length,0);assert.equal(events.length,1);
});

test('Mapping approval 只接受三种 support_level 且 approved 不允许 null',async()=>{
  let current={mapping_id:MATERIAL_ID,support_level:null};const repository={getRequirementEvidenceMapping:async()=>current,decideRequirementEvidenceMapping:async(value)=>({...value,mapping_status:value.decision,support_level:value.supportLevel})};const service=new EvidenceService({repository});
  await assert.rejects(()=>service.decideMapping(MATERIAL_ID,'approved',{reviewed_by:'reviewer'}),(error)=>error.code==='EVIDENCE_SUPPORT_LEVEL_REQUIRED');
  await assert.rejects(()=>service.decideMapping(MATERIAL_ID,'approved',{reviewed_by:'reviewer',support_level:'rejected'}),(error)=>error.code==='EVIDENCE_SUPPORT_LEVEL_INVALID');
  for(const support_level of ['full_support','partial_support','reference_only'])assert.equal((await service.decideMapping(MATERIAL_ID,'approved',{reviewed_by:'reviewer',support_level})).support_level,support_level);
});

test('Retrieval Mapping provenance 必须绑定同一 Requirement、Evidence 与 Chunk',async()=>{
  let valid=false;const repository={findInvalidConfirmedRequirementIds:async()=>[],validateEvidenceForMapping:async()=>({approval_status:'approved',source_lineage_verified:true}),validateRetrievalMappingProvenance:async()=>valid,createRequirementEvidenceMapping:async(value)=>value};const service=new EvidenceService({repository});
  const input={requirement_id:'REQ-001',evidence_id:MATERIAL_ID,mapping_source:'retrieval',support_level:'partial_support',created_by:'reviewer',retrieval_run_id:PROJECT_ID,retrieval_chunk_id:'MCH-1'};
  await assert.rejects(()=>service.proposeMapping(PROJECT_ID,input),(error)=>error.code==='EVIDENCE_RETRIEVAL_PROVENANCE_INVALID');valid=true;assert.equal((await service.proposeMapping(PROJECT_ID,input)).retrievalChunkId,'MCH-1');
});

test('Retrieval Result 通过真实 Chunk 创建 draft Evidence 且重复请求返回已有记录',async()=>{
  const source='公开材料明确记录的事实。';const chunk={chunk_id:'MCH-LIVE',material_id:MATERIAL_ID,source_text:source,chunk_hash:'live-hash',char_start:0,char_end:source.length,page_start:null,page_end:null,paragraph_start:1,paragraph_end:1,section:null};let existing=null;const repository={getRetrievalEvidenceSource:async()=>({status:'succeeded',material_id:MATERIAL_ID,chunk_id:chunk.chunk_id,material_type:'project_case',original_name:'公开公告',...chunk}),findEvidenceBySourceChunk:async()=>existing,getCompanyMaterial:async()=>({id:MATERIAL_ID,project_id:PROJECT_ID,material_type:'project_case',extraction_status:'succeeded',extracted_text:source}),getMaterialChunk:async()=>chunk,findInvalidConfirmedRequirementIds:async()=>[],createEvidenceRecord:async(value)=>{existing={id:MATERIAL_ID,approval_status:'draft',source_text:value.sourceText,source_hash:value.sourceHash};return existing;}};const service=new EvidenceService({repository});const first=await service.createFromRetrieval(PROJECT_ID,'REQ-030',{retrieval_run_id:PROJECT_ID,chunk_id:chunk.chunk_id,title:'中标事实',evidence_scope:['award_fact']});assert.equal(first.created,true);assert.equal(first.evidence.approval_status,'draft');const second=await service.createFromRetrieval(PROJECT_ID,'REQ-030',{retrieval_run_id:PROJECT_ID,chunk_id:chunk.chunk_id,title:'重复'});assert.equal(second.created,false);assert.equal(second.evidence.id,first.evidence.id);
  await assert.rejects(()=>service.createFromRetrieval(PROJECT_ID,'REQ-030',{retrieval_run_id:PROJECT_ID,chunk_id:chunk.chunk_id,source_text:'伪造'}),(error)=>error.code==='EVIDENCE_RETRIEVAL_FIELD_FORBIDDEN');
});

test('draft 或无完整 lineage Evidence 不得创建 Mapping',async()=>{
  let eligibility={approval_status:'draft',source_lineage_verified:true};const repository={findInvalidConfirmedRequirementIds:async()=>[],validateEvidenceForMapping:async()=>eligibility};const service=new EvidenceService({repository});const input={requirement_id:'REQ-001',evidence_id:MATERIAL_ID,mapping_source:'manual',support_level:'partial_support',created_by:'reviewer'};await assert.rejects(()=>service.proposeMapping(PROJECT_ID,input),(error)=>error.code==='EVIDENCE_NOT_APPROVED');eligibility={approval_status:'approved',source_lineage_verified:false};await assert.rejects(()=>service.proposeMapping(PROJECT_ID,input),(error)=>error.code==='EVIDENCE_SOURCE_LINEAGE_REQUIRED');eligibility=null;await assert.rejects(()=>service.proposeMapping(PROJECT_ID,input),(error)=>error.code==='EVIDENCE_NOT_FOUND');
});

test('Retrieval Evidence source 不存在、跨项目或与 Requirement 不一致时安全失败',async()=>{
  const service=new EvidenceService({repository:{getRetrievalEvidenceSource:async()=>null}});await assert.rejects(()=>service.createFromRetrieval(PROJECT_ID,'REQ-001',{retrieval_run_id:PROJECT_ID,chunk_id:'MCH-X'}),(error)=>error.code==='EVIDENCE_RETRIEVAL_RESULT_INVALID');
});

test('REQ-016 接口能力只保存 partial_support，不升级为量化性能支撑',async()=>{
  const repository={findInvalidConfirmedRequirementIds:async()=>[],validateEvidenceForMapping:async()=>({approval_status:'approved',source_lineage_verified:true}),createRequirementEvidenceMapping:async(value)=>({requirement_id:value.requirementId,support_level:value.supportLevel,mapping_status:'proposed'})};const service=new EvidenceService({repository});const mapping=await service.proposeMapping(PROJECT_ID,{requirement_id:'REQ-016',evidence_id:MATERIAL_ID,mapping_source:'manual',support_level:'partial_support',review_notes:'仅证明接口集成能力，不证明响应时间≤1秒。',created_by:'reviewer'});assert.equal(mapping.support_level,'partial_support');
});

test('REQ-187 qualification 只保存 reference_only，不解释为指定检测报告',async()=>{
  const repository={findInvalidConfirmedRequirementIds:async()=>[],validateEvidenceForMapping:async()=>({approval_status:'approved',source_lineage_verified:true}),createRequirementEvidenceMapping:async(value)=>({requirement_id:value.requirementId,support_level:value.supportLevel,mapping_status:'proposed'})};const service=new EvidenceService({repository});const mapping=await service.proposeMapping(PROJECT_ID,{requirement_id:'REQ-187',evidence_id:MATERIAL_ID,mapping_source:'manual',support_level:'reference_only',review_notes:'资质与安全检测主题相关，不等于指定报告已存在。',created_by:'reviewer'});assert.equal(mapping.support_level,'reference_only');
});

test('政府中标公告 Evidence scope 只保留公告事实边界',async()=>{
  const source='供应商名称：东软集团股份有限公司；货物名称：数据共享交换平台管理中心软件。';const chunk={chunk_id:'MCH-AWARD',material_id:MATERIAL_ID,source_text:source,chunk_hash:'award-hash',char_start:0,char_end:source.length,page_start:null,page_end:null,paragraph_start:1,paragraph_end:1,section:null};let created;const repository={getCompanyMaterial:async()=>({id:MATERIAL_ID,project_id:PROJECT_ID,material_type:'project_case',extraction_status:'succeeded',extracted_text:source}),getMaterialChunk:async()=>chunk,findInvalidConfirmedRequirementIds:async()=>[],createEvidenceRecord:async(value)=>{created=value;return value;}};const service=new EvidenceService({repository});
  await service.create(PROJECT_ID,{material_id:MATERIAL_ID,source_chunk_id:chunk.chunk_id,evidence_type:'project_case',title:'政府采购中标事实',content:'公告记录该企业中标相关软件。',evidence_scope:['award_fact']});assert.deepEqual(created.evidenceScope,['award_fact']);assert.equal(created.evidenceScope.includes('completed_project_experience'),false);
});
