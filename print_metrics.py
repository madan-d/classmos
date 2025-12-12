
import pandas as pd
# Import functions from model.py
# This assumes model.py is in the same directory or python path
try:
    from model import generate_synthetic_data, calculate_metrics, classify_students
except ImportError:
    # If specific imports fail (e.g. if model.py structure changes), we might need to adjust
    print("Error: Could not import functions from model.py. Make sure you are in the correct directory.")
    exit(1)

def main():
    print("--- Starting Metrics Extraction from model.py ---")
    
    # 1. Generate Data (Using synthetic data as per model.py logic)
    print("Generating synthetic data (n=500)...")
    df = generate_synthetic_data(n=500)
    
    if df.empty:
        print("Error: Generated dataframe is empty.")
        return

    # 2. Calculate Intermediate Metrics (Retention, Elo)
    # These are needed before classification
    print("Calculating derived metrics (Retention Rate, Elo)...")
    df = calculate_metrics(df)

    # 3. Run Classification and Print Metrics
    # The classify_students function in model.py contains the print statements 
    # for Classification Report, Confusion Matrix, and Feature Importance.
    print("Running classification models...")
    df, status = classify_students(df)

    if status == "success":
        print("\n--- End of Metrics ---")
    else:
        print(f"\nProcess completed with status: {status}")

if __name__ == "__main__":
    main()
