import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanyMaterialService } from '../src/company-material-service.js';
import { EvidenceService } from '../src/evidence-service.js';
import { EvidenceCatalogService } from '../src/pipeline/evidence-catalog-service.js';
import { AppError } from '../src/errors.js';

const PROJECT_ID='00000000-0000-4000-8000-000000000001';
const MATERIAL_ID='00000000-0000-4000-8000-000000000002';

function materialRepository(overrides={}) {
  return {
    getProject: async () => ({id:PROJECT_ID}), findCompanyMaterialByHash:async()=>null,
    createCompanyMaterial:async(value)=>({id:MATERIAL_ID,...value}),
    completeCompanyMaterialExtraction:async(id,text)=>({id,extraction_status:'succeeded',extracted_text:text}),
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
