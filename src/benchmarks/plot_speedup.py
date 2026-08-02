#!/usr/bin/env python3
"""
Reads results.csv (produced by run_benchmarks.py) and plots Speedup vs.
number of processing elements for pure MPI, pure multithreading, and hybrid
configurations, alongside the ideal linear speedup line. Saves speedup.png.
"""
import csv
from pathlib import Path

import matplotlib.pyplot as plt

RESULTS_CSV = Path(__file__).resolve().parent / "results.csv"
OUTPUT_PNG = Path(__file__).resolve().parent / "speedup.png"

MODE_STYLE = {
    "pure_mpi": {"label": "Pure MPI (inter-process)", "marker": "o", "color": "#1f77b4"},
    "pure_threads": {"label": "Pure multithreading (intra-process)", "marker": "s", "color": "#ff7f0e"},
    "hybrid": {"label": "Hybrid (MPI x threads)", "marker": "^", "color": "#2ca02c"},
}


def load_results():
    rows = []
    with open(RESULTS_CSV, newline="") as f:
        for row in csv.DictReader(f):
            row["ranks"] = int(row["ranks"])
            row["threads"] = int(row["threads"])
            row["total_pe"] = int(row["total_pe"])
            row["time_sec"] = float(row["time_sec"])
            rows.append(row)
    return rows


def main():
    rows = load_results()
    seq_row = next(r for r in rows if r["mode"] == "sequential")
    t_seq = seq_row["time_sec"]

    fig, ax = plt.subplots(figsize=(7, 5))

    max_pe = max(r["total_pe"] for r in rows)
    ax.plot([1, max_pe], [1, max_pe], linestyle="--", color="gray", label="Ideal linear speedup")

    for mode, style in MODE_STYLE.items():
        mode_rows = sorted((r for r in rows if r["mode"] == mode), key=lambda r: r["total_pe"])
        if not mode_rows:
            continue
        xs = [r["total_pe"] for r in mode_rows]
        ys = [t_seq / r["time_sec"] for r in mode_rows]
        ax.plot(xs, ys, marker=style["marker"], color=style["color"], label=style["label"])

    ax.set_xlabel("Processing elements (p)")
    ax.set_ylabel("Speedup (T_sequential / T_parallel)")
    ax.set_title("Speedup vs. Processing Elements")
    ax.legend()
    ax.grid(True, alpha=0.3)

    fig.tight_layout()
    fig.savefig(OUTPUT_PNG, dpi=150)
    print(f"Saved plot to {OUTPUT_PNG}")


if __name__ == "__main__":
    main()
