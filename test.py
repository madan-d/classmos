import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# Set style for plots
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("deep")

# ==========================================
# PART 2: STUDENT METRICS & CLASSIFICATION
# (Engineered features: Accuracy, Retention, Elo)
# ==========================================

print("\n--- Generating Student Learning Metrics ---")

# Number of students
N_STUDENTS = 500

# Generate synthetic student data based on `types.ts`
# Features: Accuracy, Retention, XP, Streak, Elo
data = {
    'student_id': range(1, N_STUDENTS + 1),
    # Accuracy: Most students fall between 60% and 95%
    'total_accuracy': np.clip(np.random.normal(75, 15, N_STUDENTS), 30, 100),
    # Streak: Geometric distribution, harder to keep long streaks
    'streak': np.random.geometric(p=0.1, size=N_STUDENTS),
    # XP: Correlated with streak
    'xp': np.abs(np.random.normal(1000, 500, N_STUDENTS)),
}

# Add correlation to XP based on Streak
data['xp'] = data['xp'] + (data['streak'] * 50)

df_students = pd.DataFrame(data)

# --- Feature Engineering ---

# 1. Retention Rate Calculation
# Logic: Retention is derived from Accuracy and Consistency (Streak).
# Formula: (Accuracy * 0.7) + (Normalized Streak * 0.3)
df_students['retention_rate'] = (
    (df_students['total_accuracy'] * 0.7) + 
    (np.clip(df_students['streak'] / 30, 0, 1) * 100 * 0.3)
)

# 2. Elo Rating Calculation (Synthetic)
# Logic: Elo starts at 800. Increases with Accuracy and Experience (XP).
df_students['elo'] = 800 + (df_students['total_accuracy'] - 50) * 10 + (df_students['xp'] / 100)
df_students['elo'] = df_students['elo'].astype(int)

print(df_students.head())