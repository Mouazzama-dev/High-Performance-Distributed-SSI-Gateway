from mpi4py import MPI
import subprocess
import math
import time

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

# 🔴 IMPORTANT: apna sequential time yahan daalo
SEQUENTIAL_TIME = 244.861   # tumhara measured value

TOTAL = 500
chunk = math.ceil(TOTAL / size)

start_idx = rank * chunk
end_idx = min(start_idx + chunk, TOTAL)

# 🔥 START TIMER (only rank 0)
if rank == 0:
    start_time = time.time()

# Run worker
subprocess.run([
    "node",
    "worker.js",
    str(start_idx),
    str(end_idx),
    str(rank)
])

# Wait for all processes
comm.Barrier()

# 🔥 END TIMER + ANALYSIS
if rank == 0:
    end_time = time.time()
    parallel_time = end_time - start_time

    # 🔥 Calculations
    speedup = SEQUENTIAL_TIME / parallel_time
    efficiency = speedup / size

    print("\n========================================")
    print(f"MPI PARALLEL REPORT ({size} Cores)")
    print(f"Sequential Time : {round(SEQUENTIAL_TIME, 3)} sec")
    print(f"Parallel Time   : {round(parallel_time, 3)} sec")
    print(f"Speedup         : {round(speedup, 3)}x")
    print(f"Efficiency      : {round(efficiency * 100, 2)}%")
    print("========================================\n")