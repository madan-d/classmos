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

# Summary of Engineered Features
print("\nSummary Statistics of Engineered Features:")
print(df_students[['total_accuracy', 'retention_rate', 'elo', 'streak']].describe().round(2))

# --- PLOT 2: Feature Correlation Heatmap ---
plt.figure(figsize=(8, 6))
corr = df_students[['total_accuracy', 'retention_rate', 'elo', 'streak', 'xp']].corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f")
plt.title('Correlation Matrix of Student Metrics')
plt.show()

# ==========================================
# PART 3: STUDENT CLASSIFICATION (K-MEANS)
# ==========================================

print("\n--- Classifying Students using K-Means ---")

# We want to group students into categories (e.g., Struggling, Average, High Performer)
# using Unsupervised Learning.

# Select features for clustering
features = ['total_accuracy', 'retention_rate', 'elo']
X = df_students[features]

# Standardize the features (Important for K-Means)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Apply K-Means with 3 clusters
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df_students['cluster'] = kmeans.fit_predict(X_scaled)

# Analyze the clusters to name them
cluster_summary = df_students.groupby('cluster')[features].mean()
print("\nCluster Centroids (Average values per group):")
print(cluster_summary)

# Assign meaningful labels based on Elo/Accuracy logic
# We sort clusters by Elo to determine which ID corresponds to "Top", "Avg", "Struggling"
sorted_clusters = cluster_summary.sort_values('elo', ascending=False).index
label_map = {
    sorted_clusters[0]: 'Top Performer',
    sorted_clusters[1]: 'Consistent Learner',
    sorted_clusters[2]: 'Needs Support'
}
df_students['category'] = df_students['cluster'].map(label_map)

print("\nSample Classified Data:")
print(df_students[['student_id', 'total_accuracy', 'elo', 'category']].head(10))

# --- PLOT 3: Cluster Visualization ---
plt.figure(figsize=(10, 6))
sns.scatterplot(
    data=df_students, 
    x='total_accuracy', 
    y='elo', 
    hue='category', 
    palette={'Top Performer': 'green', 'Consistent Learner': 'blue', 'Needs Support': 'red'},
    s=60, alpha=0.7
)
plt.title('Student Classification: Accuracy vs Elo Rating')
plt.xlabel('Total Accuracy (%)')
plt.ylabel('Elo Rating')
plt.legend(title='Student Category')
plt.grid(True, alpha=0.3)
plt.show()

# ==========================================
# PART 4: SUPERVISED LEARNING (PREDICTION)
# (Predicting 'At Risk' status)
# ==========================================

print("\n--- Predicting At-Risk Students (Random Forest) ---")

# Define "At Risk" as Retention Rate < 60%
df_students['is_at_risk'] = df_students['retention_rate'] < 60

# Prepare Data
X_ml = df_students[['total_accuracy', 'streak', 'xp']] # Features
y_ml = df_students['is_at_risk'] # Target

# Split
X_train, X_test, y_train, y_test = train_test_split(X_ml, y_ml, test_size=0.3, random_state=42)

# Train Random Forest
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# Predict
y_pred = rf.predict(X_test)

# Evaluate
print("\nClassification Report for Identifying At-Risk Students:")
print(classification_report(y_test, y_pred))

# Feature Importance
importances = pd.DataFrame({
    'feature': X_ml.columns,
    'importance': rf.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance (What drives Risk?):")
print(importances)