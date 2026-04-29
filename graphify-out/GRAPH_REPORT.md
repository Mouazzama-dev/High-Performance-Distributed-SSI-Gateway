# Graph Report - /home/user/Documents/Masters/HPC Project/veramo-poc  (2026-04-29)

## Corpus Check
- 12 files · ~9,646 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 96 nodes · 187 edges · 20 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `CheatcodesPrinter` - 29 edges
2. `from_dict()` - 14 edges
3. `main()` - 9 edges
4. `Error` - 6 edges
5. `CmpCheatcode` - 5 edges
6. `runSequentialFull()` - 5 edges
7. `cmp_cheatcode()` - 4 edges
8. `Visibility` - 4 edges
9. `Mutability` - 4 edges
10. `Cheatcodes` - 4 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `run()`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/access-log/lib/forge-std/scripts/vm.py → /home/user/Documents/Masters/HPC Project/veramo-poc/src/worker.js
- `runSequential()` --calls--> `Error`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/benchmark_sequential.js → /home/user/Documents/Masters/HPC Project/veramo-poc/access-log/lib/forge-std/scripts/vm.py
- `executeSequential()` --calls--> `Error`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential_time.js → /home/user/Documents/Masters/HPC Project/veramo-poc/access-log/lib/forge-std/scripts/vm.py
- `sendBatchToBlockchain()` --calls--> `Error`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential.js → /home/user/Documents/Masters/HPC Project/veramo-poc/access-log/lib/forge-std/scripts/vm.py
- `executeSequential()` --calls--> `runSequentialFull()`  [INFERRED]
  /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential_time.js → /home/user/Documents/Masters/HPC Project/veramo-poc/src/run_sequential.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (10): runSequential(), addToBatch(), getKey(), runOperation(), runSequentialFull(), sendBatchToBlockchain(), executeSequential(), waitForAllTx() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.29
Nodes (7): Cheatcodes, from_json(), group(), main(), prefix_with_group_headers(), # HACK: A way to add group header comments without having to modify printer code, # TODO: Custom errors were introduced in 0.8.4

### Community 2 - "Community 2"
Cohesion: 0.36
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.39
Nodes (1): CheatcodesPrinter

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (5): Cheatcode, Enum, EnumVariant, from_dict(), from_json_file()

### Community 5 - "Community 5"
Cohesion: 0.61
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (2): cmp_cheatcode(), CmpCheatcode

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (4): PyEnum, Item, Mutability, Visibility

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (2): default(), ItemOrder

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): generateWorkload(), randomItem()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): getOrCreateAlias(), setupFactory()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): StructField

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (1): Struct

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (1): Event

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): Function

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **2 isolated node(s):** `# TODO: Custom errors were introduced in 0.8.4`, `# HACK: A way to add group header comments without having to modify printer code`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `StructField`, `.__init__()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `Struct`, `.__init__()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `Event`, `.__init__()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `Function`, `.__init__()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `generateWorkload()`, `generate-bulk-data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `agent.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `sequential_main.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `hpc_master.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `run_data_parallel.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CheatcodesPrinter` connect `Community 3` to `Community 1`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Why does `Error` connect `Community 0` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 1` to `Community 0`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Error` (e.g. with `executeSequential()` and `sendBatchToBlockchain()`) actually correct?**
  _`Error` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `# TODO: Custom errors were introduced in 0.8.4`, `# HACK: A way to add group header comments without having to modify printer code` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._