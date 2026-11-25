import pandas as pd
import numpy as np
from model import generate_synthetic_data, calculate_metrics, classify_students

# Set random seed for reproducibility
np.random.seed(42)

print("Starting verification of model.py significance testing...")

# 1. Generate Data
print("Generating synthetic data...")
df = generate_synthetic_data(n=1000)

# 2. Process Data
print("Calculating metrics...")
df = calculate_metrics(df)

# 3. Classify and Test
print("Running classification and significance testing...")
# classify_students currently prints to stdout
df, status = classify_students(df)

print(f"\nStatus: {status}")
print("Verification Complete.")
