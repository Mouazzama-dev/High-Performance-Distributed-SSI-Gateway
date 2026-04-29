# Graph Report - /home/user/Documents/Masters/HPC Project/veramo-poc/src  (2026-04-29)

## Corpus Check
- 10 files · ~1,257 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 24 nodes · 25 edges · 10 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `runSequentialFull()` - 5 edges
2. `addToBatch()` - 4 edges
3. `runOperation()` - 4 edges
4. `run()` - 3 edges
5. `sendBatchToBlockchain()` - 3 edges
6. `waitForAllTx()` - 3 edges
7. `executeSequential()` - 2 edges
8. `randomItem()` - 2 edges
9. `generateWorkload()` - 2 edges
10. `getOrCreateAlias()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `executeSequential()` --calls--> `runSequentialFull()`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential_time.js → /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential.js
- `run()` --calls--> `runOperation()`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/worker.js → /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential.js
- `run()` --calls--> `waitForAllTx()`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/worker.js → /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.67
Nodes (5): addToBatch(), getKey(), runOperation(), runSequentialFull(), sendBatchToBlockchain()

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (2): generateWorkload(), randomItem()

### Community 2 - "Community 2"
Cohesion: 1.0
Nodes (2): getOrCreateAlias(), setupFactory()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (2): waitForAllTx(), run()

### Community 4 - "Community 4"
Cohesion: 1.0
Nodes (1): executeSequential()

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 4`** (2 nodes): `run_sequential_time.js`, `executeSequential()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (2 nodes): `generateWorkload()`, `generate-bulk-data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `runSequential()`, `benchmark_sequential.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (1 nodes): `sequential_main.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (1 nodes): `hpc_master.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `run_data_parallel.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `runSequentialFull()` connect `Community 0` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `runOperation()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `run()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `run()` (e.g. with `runOperation()` and `waitForAllTx()`) actually correct?**
  _`run()` has 2 INFERRED edges - model-reasoned connections that need verification._