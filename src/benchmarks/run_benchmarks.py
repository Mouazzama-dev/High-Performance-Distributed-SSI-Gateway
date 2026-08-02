#!/usr/bin/env python3
"""
Benchmark driver comparing three parallelization strategies built on top of
src/hybrid:

  pure_mpi     - multiple MPI ranks, 1 thread each   (inter-process only)
  pure_threads - 1 MPI rank, multiple worker_threads (intra-process only)
  hybrid       - multiple MPI ranks x multiple threads each

For each configuration it shells out to `mpiexec -n <ranks> <python> hpc_master.py`
with THREADS_PER_RANK set via env var, and parses the "Parallel Time" that
rank 0 prints. Results (mode, ranks, threads, total_pe, time_sec) are written
to results.csv for plot_speedup.py to consume.

By default SKIP_CHAIN=1, so batches that hit BATCH_SIZE resolve immediately
instead of sending real Sepolia transactions. This isolates the part of the
pipeline that your parallelization strategy actually affects (DID/VC lookups
and validation) from blockchain confirmation latency, which is an external,
largely serialized bottleneck (single nonce per wallet) that no amount of
local parallelism can speed up, and would otherwise dominate and mask the
speedup trend you're trying to measure. Pass --with-chain for one real
end-to-end confirmation run.
"""
import argparse
import csv
import os
import re
import subprocess
import sys
from pathlib import Path

HYBRID_DIR = Path(__file__).resolve().parent.parent / "hybrid"
RESULTS_CSV = Path(__file__).resolve().parent / "results.csv"

PARALLEL_TIME_RE = re.compile(r"Parallel Time\s*:\s*([\d.]+)\s*sec")
SEQ_TIME_RE = re.compile(r"Total Time:\s*([\d.]+)s")


def run_sequential(total_workload, skip_chain):
    env = os.environ.copy()
    env["TOTAL_WORKLOAD"] = str(total_workload)
    if skip_chain:
        env["SKIP_CHAIN"] = "1"
    out = subprocess.run(
        ["node", "sequential_main.js"],
        cwd=HYBRID_DIR, env=env, capture_output=True, text=True,
    )
    match = SEQ_TIME_RE.search(out.stdout)
    if not match:
        print(out.stdout, file=sys.stderr)
        print(out.stderr, file=sys.stderr)
        raise RuntimeError("Could not parse sequential run time")
    return float(match.group(1))


def run_hpc_master(ranks, threads_per_rank, total_workload, sequential_time, skip_chain):
    env = os.environ.copy()
    env["THREADS_PER_RANK"] = str(threads_per_rank)
    env["TOTAL_WORKLOAD"] = str(total_workload)
    env["SEQUENTIAL_TIME"] = str(sequential_time)
    if skip_chain:
        env["SKIP_CHAIN"] = "1"

    out = subprocess.run(
        ["mpiexec", "-n", str(ranks), sys.executable, "hpc_master.py"],
        cwd=HYBRID_DIR, env=env, capture_output=True, text=True,
    )
    match = PARALLEL_TIME_RE.search(out.stdout)
    if not match:
        print(out.stdout, file=sys.stderr)
        print(out.stderr, file=sys.stderr)
        raise RuntimeError(f"Could not parse parallel time for ranks={ranks} threads={threads_per_rank}")
    return float(match.group(1))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--total-workload", type=int, default=200,
                         help="Number of workload items processed per configuration (default: 200)")
    parser.add_argument("--max-pe", type=int, default=8,
                         help="Max processing elements to sweep up to (default: 8, matches a 4-core / 2-way SMT box)")
    parser.add_argument("--with-chain", action="store_true",
                         help="Send real Sepolia transactions instead of skipping them (slow, costs testnet gas)")
    args = parser.parse_args()

    skip_chain = not args.with_chain
    pe_values = [p for p in (1, 2, 4, 8, 16) if p <= args.max_pe]

    print(f"== Sequential baseline (workload={args.total_workload}, skip_chain={skip_chain}) ==")
    t_seq = run_sequential(args.total_workload, skip_chain)
    print(f"Sequential time: {t_seq:.3f}s")

    rows = [{"mode": "sequential", "ranks": 1, "threads": 1, "total_pe": 1, "time_sec": t_seq}]

    print("\n== Pure MPI sweep (threads_per_rank=1) ==")
    for p in pe_values:
        t = run_hpc_master(ranks=p, threads_per_rank=1, total_workload=args.total_workload,
                            sequential_time=t_seq, skip_chain=skip_chain)
        print(f"ranks={p:<3} time={t:.3f}s speedup={t_seq / t:.2f}x")
        rows.append({"mode": "pure_mpi", "ranks": p, "threads": 1, "total_pe": p, "time_sec": t})

    print("\n== Pure multithreading sweep (ranks=1) ==")
    for t_count in pe_values:
        t = run_hpc_master(ranks=1, threads_per_rank=t_count, total_workload=args.total_workload,
                            sequential_time=t_seq, skip_chain=skip_chain)
        print(f"threads={t_count:<3} time={t:.3f}s speedup={t_seq / t:.2f}x")
        rows.append({"mode": "pure_threads", "ranks": 1, "threads": t_count, "total_pe": t_count, "time_sec": t})

    print("\n== Hybrid sweep (ranks x threads) ==")
    hybrid_combos = [(r, th) for r, th in [(2, 2), (2, 4), (4, 2), (4, 4)] if r * th <= args.max_pe]
    for ranks, threads in hybrid_combos:
        t = run_hpc_master(ranks=ranks, threads_per_rank=threads, total_workload=args.total_workload,
                            sequential_time=t_seq, skip_chain=skip_chain)
        pe = ranks * threads
        print(f"ranks={ranks} threads={threads} (PE={pe}) time={t:.3f}s speedup={t_seq / t:.2f}x")
        rows.append({"mode": "hybrid", "ranks": ranks, "threads": threads, "total_pe": pe, "time_sec": t})

    with open(RESULTS_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["mode", "ranks", "threads", "total_pe", "time_sec"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nResults written to {RESULTS_CSV}")


if __name__ == "__main__":
    main()
