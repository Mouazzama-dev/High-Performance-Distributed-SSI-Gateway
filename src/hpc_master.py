# dividing workload and trigger workers in parallel using MPI

from mpi4py import MPI
import subprocess
import time
import json
import os

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

# 1. Rank 0 calculates the split
if rank == 0:
    with open('credentials.json', 'r') as f:
        data = json.load(f)
    total_vcs = len(data)
    print(f" Master: Distributing {total_vcs} VCs across {size} cores...")
else:
    total_vcs = None

# Broadcast total count to all ranks
total_vcs = comm.bcast(total_vcs, root=0)

# 2. Assign Batch
per_rank = total_vcs // size
start_idx = rank * per_rank
end_idx = (rank + 1) * per_rank if rank != size - 1 else total_vcs

# 3. Synchronize start time
comm.Barrier()
start_time = time.time()

# 4. Run Node.js Worker
# We use 'node' to run our worker script with the assigned range
# subprocess.run(['node', 'worker_mpi.js', str(start_idx), str(end_idx), str(rank)])
subprocess.run(['/home/user/.bun/bin/bun', 'run', 'worker_mpi.js', str(start_idx), str(end_idx), str(rank)])

# 5. Synchronize end time
comm.Barrier()
end_time = time.time()

if rank == 0:
    total_duration = end_time - start_time
    print("\n" + "="*40)
    print(f" MPI PARALLEL REPORT ({size} Cores)")
    print(f"Total Time: {total_duration:.3f} seconds")
    print(f"Sequential was: 39.733 seconds")
    print(f"Estimated Speedup: {39.733 / total_duration:.2f}x")
    print("="*40)