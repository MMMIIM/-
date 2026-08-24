# GPT REVIEW PACKET — LIVE RETRIEVAL 7

- This packet contains all seven Gold-backed cases and their raw Top5 text.
- Formal Gold Hit@K is based only on expected Chunk identity; heuristic Evidence-Bearing classification is diagnostic.
- No LLM, Dify, Mapping, Evidence Fact, Claim Gate or Writer path was executed.

## Execution

- Cases：7
- Embedding calls：7
- Retrieval success：7
- Technical failures：0
- GPT_REVIEW_STATUS：PENDING_REVIEW
- EVAL_COMPLETE：NO

## Formal Gold Metrics

```json
{
  "executed_cases": 7,
  "retrieval_success_count": 7,
  "technical_failure_count": 0,
  "embedding_calls": 7,
  "expected_chunk_hit_at_1": 0.42857142857142855,
  "expected_chunk_hit_at_3": 0.7142857142857143,
  "expected_chunk_hit_at_5": 0.8571428571428571,
  "expected_material_hit_at_5": 0.8571428571428571,
  "expected_document_hit_at_5": 0.8571428571428571,
  "expected_rank_mrr": 0.5833333333333334,
  "unique_materials_at_5": 3,
  "unique_documents_at_5": 3,
  "near_duplicate_chunks_at_5": 0,
  "metadata_returned_count": 14,
  "metadata_false_evidence_classifications": 0,
  "topic_only_returned_count": 4,
  "topic_only_false_evidence_classifications": 0,
  "miss_count": 1,
  "miss_forensics": {
    "RANKING_MISS": 0,
    "QUERY_SEMANTIC_MISS": 0,
    "METADATA_POLLUTION": 1,
    "DUPLICATE_CHUNK_CROWDING": 0,
    "SCOPE_FILTER_ERROR": 0,
    "INDEX_ERROR": 0,
    "TECHNICAL_FAILURE": 0
  }
}
```

## Case-level results

## V2R-001-PERF-DIRECT / EVAL-RET-001

- Requirement：企业应提供可核验的数据交换平台性能测试记录。
- Expected Material：3c81671f-376e-401b-8525-be26929d5b92
- Expected Document：3c81671f-376e-401b-8525-be26929d5b92
- Expected Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Expected verified source text：

```text
# 数据交换平台性能测试记录

产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

- Retrieval Run ID：729df2b5-ab63-43d4-8ef6-af292ffeaeb6
- Status：SUCCEEDED
- Latency：300 ms
- Expected Chunk Rank：4
- Gold-backed Hit@1：FAIL
- Gold-backed Hit@3：FAIL
- Gold-backed Hit@5：PASS
- Material Hit@5：PASS
- Document Hit@5：PASS
- MRR：0.25

### Actual Top5

#### Rank 1
- Material：3c81671f-376e-401b-8525-be26929d5b92
- Document：3c81671f-376e-401b-8525-be26929d5b92
- Chunk：MCH-B4FF02295DBB6DCDF6E2763F057076F6
- Score：0.820653070250338
- Raw original text：
```text
# 数据交换平台性能测试记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 2
- Material：8821b9fa-2bde-4329-9cbf-908395c1270d
- Document：8821b9fa-2bde-4329-9cbf-908395c1270d
- Chunk：MCH-770B6FE8E57173DCC72914CFFB7376F8
- Score：0.6545740365982056
- Raw original text：
```text
产品：澄明数据交换平台 V3.2
能力：REST API 接入、数据目录、交换任务调度、运行日志。
未声明未列出的协议、吞吐量或 SLA。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 3
- Material：8821b9fa-2bde-4329-9cbf-908395c1270d
- Document：8821b9fa-2bde-4329-9cbf-908395c1270d
- Chunk：MCH-C9F466EAC2C29977E40F4A3BFE38A6E4
- Score：0.6524852514266968
- Raw original text：
```text
# 数据交换平台产品说明
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 4
- Material：3c81671f-376e-401b-8525-be26929d5b92
- Document：3c81671f-376e-401b-8525-be26929d5b92
- Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Score：0.5710718291359059
- Raw original text：
```text
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 5
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-5B3A5D4F1299B7E362FE0D195F33C161
- Score：0.5241128489903907
- Raw original text：
```text
记录已经验证的核心原则：
```
- Runtime heuristic classification：TOPIC_RELEVANT_ONLY

### Duplicate / heuristic audit

- Unique Materials@5：3
- Unique Documents@5：3
- Near-Duplicate Chunks@5：0
- Metadata candidates：2
- Metadata false Evidence-Bearing：0
- Topic-only candidates：1
- Topic-only false Evidence-Bearing：0

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## V2R-002-PERF-PARTIAL / EVAL-RET-002

- Requirement：企业应证明接口 P95 响应时间不超过 1 秒。
- Expected Material：3c81671f-376e-401b-8525-be26929d5b92
- Expected Document：3c81671f-376e-401b-8525-be26929d5b92
- Expected Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Expected verified source text：

```text
# 数据交换平台性能测试记录

产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

- Retrieval Run ID：5f1e6623-efda-4702-9754-3a9d9ac44d4e
- Status：SUCCEEDED
- Latency：101 ms
- Expected Chunk Rank：1
- Gold-backed Hit@1：PASS
- Gold-backed Hit@3：PASS
- Gold-backed Hit@5：PASS
- Material Hit@5：PASS
- Document Hit@5：PASS
- MRR：1

### Actual Top5

#### Rank 1
- Material：3c81671f-376e-401b-8525-be26929d5b92
- Document：3c81671f-376e-401b-8525-be26929d5b92
- Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Score：0.5493428052255147
- Raw original text：
```text
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 2
- Material：3c81671f-376e-401b-8525-be26929d5b92
- Document：3c81671f-376e-401b-8525-be26929d5b92
- Chunk：MCH-B4FF02295DBB6DCDF6E2763F057076F6
- Score：0.5284328460693397
- Raw original text：
```text
# 数据交换平台性能测试记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 3
- Material：7b29cc2e-458c-4ed9-ab5a-81f99a3ddace
- Document：7b29cc2e-458c-4ed9-ab5a-81f99a3ddace
- Chunk：MCH-08A2CF3D5D2423E41CECF8BB230F574A
- Score：0.5160041451454199
- Raw original text：
```text
企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。
无经审核的 7×24、5 分钟响应或 99.99% SLA。
```
- Runtime heuristic classification：TOPIC_RELEVANT_ONLY

#### Rank 4
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-A9CA772011E7045D8F035A43E6681BE8
- Score：0.473630936525409
- Raw original text：
```text
Prompt =
backend-owned business instruction,
versioned independently of model.
```
- Runtime heuristic classification：IRRELEVANT

#### Rank 5
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-F6FE125F46AD101C81DA541D50D7AE47
- Score：0.45196414280151553
- Raw original text：
```text
可控
可追溯
可审核
可修改
可交付
```
- Runtime heuristic classification：IRRELEVANT

### Duplicate / heuristic audit

- Unique Materials@5：3
- Unique Documents@5：3
- Near-Duplicate Chunks@5：0
- Metadata candidates：1
- Metadata false Evidence-Bearing：0
- Topic-only candidates：1
- Topic-only false Evidence-Bearing：0

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## V2R-003-COMP-DIRECT / EVAL-RET-003

- Requirement：企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- Expected Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Chunk：MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Expected verified source text：

```text
# 产品兼容性矩阵

x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

- Retrieval Run ID：c2723dc3-4946-46d4-9d88-8665ce060026
- Status：SUCCEEDED
- Latency：94 ms
- Expected Chunk Rank：1
- Gold-backed Hit@1：PASS
- Gold-backed Hit@3：PASS
- Gold-backed Hit@5：PASS
- Material Hit@5：PASS
- Document Hit@5：PASS
- MRR：1

### Actual Top5

#### Rank 1
- Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Chunk：MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Score：0.7036605234550806
- Raw original text：
```text
x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 2
- Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Chunk：MCH-57FE3B83C106C09B70C731182F48FFA4
- Score：0.6561677651455405
- Raw original text：
```text
# 产品兼容性矩阵
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 3
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-238ABC8850F42BCC571A0913A7E2AF08
- Score：0.5235348315793477
- Raw original text：
```text
优先成熟 MIT / Apache-2.0 等兼容开源组件。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 4
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-7251629B4230317EE57F8F2659926A1F
- Score：0.5070773354676562
- Raw original text：
```text
企业软件基础能力，
安全、够用。
```
- Runtime heuristic classification：TOPIC_RELEVANT_ONLY

#### Rank 5
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-889DDF9919EF0E6485406DAB6A159A11
- Score：0.5034373698569921
- Raw original text：
```text
SUPPORTED
→ 材料已满足
```
- Runtime heuristic classification：IRRELEVANT

### Duplicate / heuristic audit

- Unique Materials@5：2
- Unique Documents@5：2
- Near-Duplicate Chunks@5：0
- Metadata candidates：1
- Metadata false Evidence-Bearing：0
- Topic-only candidates：1
- Topic-only false Evidence-Bearing：0

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## V2R-004-COMP-PARTIAL / EVAL-RET-004

- Requirement：企业应证明所有国产数据库组合均已完成压力测试。
- Expected Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Chunk：MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Expected verified source text：

```text
# 产品兼容性矩阵

x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

- Retrieval Run ID：17b7141a-6642-4057-994c-4da63352008a
- Status：SUCCEEDED
- Latency：89 ms
- Expected Chunk Rank：1
- Gold-backed Hit@1：PASS
- Gold-backed Hit@3：PASS
- Gold-backed Hit@5：PASS
- Material Hit@5：PASS
- Document Hit@5：PASS
- MRR：1

### Actual Top5

#### Rank 1
- Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Chunk：MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Score：0.7040744600251652
- Raw original text：
```text
x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 2
- Material：3c81671f-376e-401b-8525-be26929d5b92
- Document：3c81671f-376e-401b-8525-be26929d5b92
- Chunk：MCH-B4FF02295DBB6DCDF6E2763F057076F6
- Score：0.5661619047023011
- Raw original text：
```text
# 数据交换平台性能测试记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 3
- Material：9905462c-a58b-4168-a721-b5c156c74b0d
- Document：9905462c-a58b-4168-a721-b5c156c74b0d
- Chunk：MCH-6BA94F47BCD831E596F751A2BEA49AB8
- Score：0.49553072452545166
- Raw original text：
```text
commit 前：
相关 tests PASS。
```
- Runtime heuristic classification：IRRELEVANT

#### Rank 4
- Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Chunk：MCH-57FE3B83C106C09B70C731182F48FFA4
- Score：0.49169252738588
- Raw original text：
```text
# 产品兼容性矩阵
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 5
- Material：3c81671f-376e-401b-8525-be26929d5b92
- Document：3c81671f-376e-401b-8525-be26929d5b92
- Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Score：0.4748999789416811
- Raw original text：
```text
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```
- Runtime heuristic classification：TOPIC_RELEVANT_ONLY

### Duplicate / heuristic audit

- Unique Materials@5：3
- Unique Documents@5：3
- Near-Duplicate Chunks@5：0
- Metadata candidates：2
- Metadata false Evidence-Bearing：0
- Topic-only candidates：1
- Topic-only false Evidence-Bearing：0

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## V2R-005-ISO-DIRECT / EVAL-RET-005

- Requirement：企业应提供当前有效的 ISO/IEC 27001 认证信息。
- Expected Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Chunk：MCH-0820CC5A439CB986C62E46213029CC71
- Expected verified source text：

```text
# ISO 27001 受控记录

名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

- Retrieval Run ID：5760a2bc-f5e7-4b9c-b4ba-83d500f5beef
- Status：SUCCEEDED
- Latency：100 ms
- Expected Chunk Rank：3
- Gold-backed Hit@1：FAIL
- Gold-backed Hit@3：PASS
- Gold-backed Hit@5：PASS
- Material Hit@5：PASS
- Document Hit@5：PASS
- MRR：0.3333333333333333

### Actual Top5

#### Rank 1
- Material：74ed566b-18c0-41a1-ba55-59cbe182251c
- Document：74ed566b-18c0-41a1-ba55-59cbe182251c
- Chunk：MCH-70376020855F97D43106A81E5F040C7F
- Score：0.7175531387329153
- Raw original text：
```text
企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 2
- Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk：MCH-A4C2632EF9126FADD349C3004E1C2D84
- Score：0.6661979755045202
- Raw original text：
```text
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 3
- Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk：MCH-0820CC5A439CB986C62E46213029CC71
- Score：0.6532460061761148
- Raw original text：
```text
# ISO 27001 受控记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 4
- Material：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Document：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Chunk：MCH-D37B061257382C31A3C757430BDD2CA6
- Score：0.6045245763942863
- Raw original text：
```text
# ISO 9001 受控记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 5
- Material：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Document：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Chunk：MCH-A160D3E488BD50C27E5F6267363E57B1
- Score：0.5497893363362956
- Raw original text：
```text
名称：ISO 9001
编号：CM-Q-9001-2025
状态：active
有效至：2028-03-31
```
- Runtime heuristic classification：EVIDENCE_BEARING

### Duplicate / heuristic audit

- Unique Materials@5：3
- Unique Documents@5：3
- Near-Duplicate Chunks@5：0
- Metadata candidates：2
- Metadata false Evidence-Bearing：0
- Topic-only candidates：0
- Topic-only false Evidence-Bearing：0

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## V2R-006-ISO-SCOPE / EVAL-RET-006

- Requirement：企业应提供指定项目主体的 ISO/IEC 27001 证书。
- Expected Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Chunk：MCH-0820CC5A439CB986C62E46213029CC71
- Expected verified source text：

```text
# ISO 27001 受控记录

名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

- Retrieval Run ID：7a29d830-f0e5-4284-84d7-c9e6fa84cf76
- Status：SUCCEEDED
- Latency：91 ms
- Expected Chunk Rank：2
- Gold-backed Hit@1：FAIL
- Gold-backed Hit@3：PASS
- Gold-backed Hit@5：PASS
- Material Hit@5：PASS
- Document Hit@5：PASS
- MRR：0.5

### Actual Top5

#### Rank 1
- Material：74ed566b-18c0-41a1-ba55-59cbe182251c
- Document：74ed566b-18c0-41a1-ba55-59cbe182251c
- Chunk：MCH-70376020855F97D43106A81E5F040C7F
- Score：0.7064820528030445
- Raw original text：
```text
企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 2
- Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk：MCH-0820CC5A439CB986C62E46213029CC71
- Score：0.6684556801047528
- Raw original text：
```text
# ISO 27001 受控记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 3
- Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk：MCH-A4C2632EF9126FADD349C3004E1C2D84
- Score：0.6393421507273834
- Raw original text：
```text
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 4
- Material：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Document：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Chunk：MCH-D37B061257382C31A3C757430BDD2CA6
- Score：0.6162579884375352
- Raw original text：
```text
# ISO 9001 受控记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 5
- Material：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Document：c5395bc4-0531-4e6f-9f0c-3562cee0a2f1
- Chunk：MCH-A160D3E488BD50C27E5F6267363E57B1
- Score：0.5089393550789749
- Raw original text：
```text
名称：ISO 9001
编号：CM-Q-9001-2025
状态：active
有效至：2028-03-31
```
- Runtime heuristic classification：EVIDENCE_BEARING

### Duplicate / heuristic audit

- Unique Materials@5：3
- Unique Documents@5：3
- Near-Duplicate Chunks@5：0
- Metadata candidates：2
- Metadata false Evidence-Bearing：0
- Topic-only candidates：0
- Topic-only false Evidence-Bearing：0

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## V2R-007-PROJECT-STATUS / EVAL-RET-007

- Requirement：企业应提供已完成并可验收的同类项目记录。
- Expected Material：75924286-5882-4658-bff9-ed587f70b927
- Expected Document：75924286-5882-4658-bff9-ed587f70b927
- Expected Chunk：MCH-C5D5EB33CB97F715074CC6F4E98EEF17
- Expected verified source text：

```text
# 项目D实施片段

项目：南泽业务协同升级片段（虚构）
客户：南泽公共服务机构（虚构）
实施片段日期：2025-10-09
状态不完整，不得推断完工或验收。
```

- Retrieval Run ID：cd85e333-e43e-4138-9c60-a55084878461
- Status：SUCCEEDED
- Latency：105 ms
- Expected Chunk Rank：NOT_FOUND
- Gold-backed Hit@1：FAIL
- Gold-backed Hit@3：FAIL
- Gold-backed Hit@5：FAIL
- Material Hit@5：FAIL
- Document Hit@5：FAIL
- MRR：0

### Actual Top5

#### Rank 1
- Material：b472e07b-3065-4645-9b0b-a6abadaa70b7
- Document：b472e07b-3065-4645-9b0b-a6abadaa70b7
- Chunk：MCH-DEA320F82E7EEC727D332134D9C2E87A
- Score：0.7400206327438354
- Raw original text：
```text
# 项目A验收记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 2
- Material：39d2e81d-82a2-4fa1-8545-83d6f428f234
- Document：39d2e81d-82a2-4fa1-8545-83d6f428f234
- Chunk：MCH-2053A2763523C2DAF21676650B8D3E7C
- Score：0.6395210457419148
- Raw original text：
```text
# 项目B中选及合同记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 3
- Material：6c7a4ff1-75b8-47ef-aa71-a44d8e0d075c
- Document：6c7a4ff1-75b8-47ef-aa71-a44d8e0d075c
- Chunk：MCH-D688689513881DDE95287CA59DE22C84
- Score：0.6322177429329014
- Raw original text：
```text
# 项目A实施记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

#### Rank 4
- Material：b472e07b-3065-4645-9b0b-a6abadaa70b7
- Document：b472e07b-3065-4645-9b0b-a6abadaa70b7
- Chunk：MCH-268A148B9BD7EA6BF0B470DDE0EA8425
- Score：0.5914573912943974
- Raw original text：
```text
项目：北川新区数据协同平台项目（虚构）
客户：北川新区数字服务中心（虚构）
验收日期：2024-09-20
结论：虚构项目约定范围通过验收；不外推至其他环境。
```
- Runtime heuristic classification：EVIDENCE_BEARING

#### Rank 5
- Material：e0fa38e8-e6b0-4a4a-9f91-d3cd9aa6f95f
- Document：e0fa38e8-e6b0-4a4a-9f91-d3cd9aa6f95f
- Chunk：MCH-72D4582C2995FF3A37A4610333CFB4D4
- Score：0.5870180479894915
- Raw original text：
```text
# 项目A中选记录
```
- Runtime heuristic classification：METADATA_OR_HEADER

### Duplicate / heuristic audit

- Unique Materials@5：4
- Unique Documents@5：4
- Near-Duplicate Chunks@5：0
- Metadata candidates：4
- Metadata false Evidence-Bearing：0
- Topic-only candidates：0
- Topic-only false Evidence-Bearing：0

### Miss forensics

- {"expected_chunk_raw_rank":null,"classification":"METADATA_POLLUTION","expected_chunk_current_index":true}

- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED

---

## Safety

- Formal Requirement creation：NO
- Evidence Fact / Mapping / Claim Gate / Writer：NOT_EXECUTED
- MMR：NOT_EXECUTED
- LLM calls：0
- Dify calls：0