from mpi4py import MPI
import subprocess
import math
import time
import os

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

# Inter-process level: MPI ranks (this file / mpiexec -n <ranks>)
# Intra-process level: worker_threads per rank (worker.js / thread_worker.js)
THREADS_PER_RANK = int(os.environ.get("THREADS_PER_RANK", 1))
TOTAL = int(os.environ.get("TOTAL_WORKLOAD", 500))
SEQUENTIAL_TIME = float(os.environ.get("SEQUENTIAL_TIME", 112))

chunk = math.ceil(TOTAL / size)

start_idx = rank * chunk
end_idx = min(start_idx + chunk, TOTAL)

if rank == 0:
    start_time = time.time()

subprocess.run([
    "node",
    "worker.js",
    str(start_idx),
    str(end_idx),
    str(rank),
    str(THREADS_PER_RANK),
])

comm.Barrier()

if rank == 0:
    end_time = time.time()
    parallel_time = end_time - start_time
    total_pe = size * THREADS_PER_RANK

    speedup = SEQUENTIAL_TIME / parallel_time
    efficiency = speedup / total_pe

    print("\n========================================")
    print(f"HYBRID REPORT: {size} MPI rank(s) x {THREADS_PER_RANK} thread(s)/rank = {total_pe} PE")
    print(f"Sequential Time : {round(SEQUENTIAL_TIME, 3)} sec")
    print(f"Parallel Time   : {round(parallel_time, 3)} sec")
    print(f"Speedup         : {round(speedup, 3)}x")
    print(f"Efficiency      : {round(efficiency * 100, 2)}%")
    print("========================================\n")
