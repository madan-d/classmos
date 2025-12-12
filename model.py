import os
import random
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from sklearn.cluster import KMeans
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import uvicorn

# Initialize FastAPI
app = FastAPI()

# CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Firebase Setup ---
# Check for service account key
SERVICE_ACCOUNT_KEY = os.path.join(os.getcwd(), "serviceAccountKey.json")
db = None

try:
    if os.path.exists(SERVICE_ACCOUNT_KEY):
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print(f"Connected to Firebase using {SERVICE_ACCOUNT_KEY}")
    else:
        print(f"Warning: {SERVICE_ACCOUNT_KEY} not found. Using SYNTHETIC DATA mode (logic from test.py).")
except Exception as e:
    print(f"Error initializing Firebase: {e}. Using SYNTHETIC DATA mode.")

# --- Data Models ---
class StudentMetrics(BaseModel):
    id: str
    name: str
    totalAccuracy: float
    streak: int
    xp: int
    elo: int
    retention_rate: float
    category: str
    is_at_risk: bool

class AnalyticsResponse(BaseModel):
    students: List[StudentMetrics]
    status: str # 'success' or 'insufficient_data'

# --- Logic ---

def generate_synthetic_data(n=500):
    """Generates synthetic data for testing/demo purposes (Logic from test.py)."""
    students = []
    # Vectorized generation (like test.py) would be faster, but this list dict is fine for 500
    # Matching test.py distributions
    accuracies = np.clip(np.random.normal(75, 15, n), 30, 100)
    streaks = np.random.geometric(p=0.1, size=n)
    
    for i in range(n):
        accuracy = accuracies[i]
        streak = int(streaks[i])
        # XP logic from test.py: abs(normal) + streak*50
        xp = int(abs(np.random.normal(1000, 500)) + (streak * 50))
        
        students.append({
            "id": f"student_{i+1}",
            "name": f"Student {i+1}",
            "total_accuracy": accuracy,
            "streak": streak,
            "xp": xp
        })
    return pd.DataFrame(students)

def calculate_metrics(df):
    """
    Calculates Retention Rate and Elo based on user requirements.
    Retention Rate = (Accuracy * 0.7) + (Normalized Streak * 0.3)
    Elo = 800 + (Accuracy - 50) * 10 + (XP / 100)
    """
    # Retention
    # Normalize streak approx to 0-1 (assuming 30 is a high streak)
    streak_norm = np.clip(df['streak'] / 30, 0, 1) * 100
    df['retention_rate'] = (df['total_accuracy'] * 0.7) + (streak_norm * 0.3)
    
    # Elo
    df['elo'] = 800 + (df['total_accuracy'] - 50) * 10 + (df['xp'] / 100)
    df['elo'] = df['elo'].astype(int)
    
    return df

def classify_students(df):
    """
    K-Means clustering: Top Performer, Consistent Learner, Needs Support
    Random Forest: Predict At Risk (Retention < 60%)
    """
    if len(df) < 5:
        return df, "insufficient_data"

    # --- Clustering ---
    features = ['total_accuracy', 'retention_rate', 'elo']
    X = df[features]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(X_scaled)
    
    # Map clusters
    cluster_summary = df.groupby('cluster')['elo'].mean()
    sorted_clusters = cluster_summary.sort_values(ascending=False).index
    label_map = {
        sorted_clusters[0]: 'Top Performer',
        sorted_clusters[1]: 'Consistent Learner',
        sorted_clusters[2]: 'Needs Support'
    }
    df['category'] = df['cluster'].map(label_map)
    
    # --- Risk Prediction (Random Forest) ---
    # Target: Retention < 60%
    df['target_risk'] = df['retention_rate'] < 60
    
    # Features for specific prediction (Accuracy, Streak, XP)
    X_ml = df[['total_accuracy', 'streak', 'xp']]
    y_ml = df['target_risk']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X_ml, y_ml, test_size=0.3, random_state=42)
    
    # --- Random Forest ---
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    
    print("\n--- Random Forest Report ---")
    print(classification_report(y_test, y_pred_rf))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred_rf))
    
    # Feature Importance
    importances = pd.DataFrame({
        'feature': X_ml.columns,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance (What drives Risk?):")
    print(importances)

    # --- Decision Tree ---
    dt = DecisionTreeClassifier(random_state=42)
    dt.fit(X_train, y_train)
    y_pred_dt = dt.predict(X_test)

    print("\n--- Decision Tree Report ---")
    print(classification_report(y_test, y_pred_dt))
    
    # Prediction for the application (predict on full dataset) - Using Random Forest as primary
    df['is_at_risk'] = rf.predict(X_ml)
    
    return df, "success"

@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    df_students = pd.DataFrame()
    
    # 1. Fetch Data
    connection_failed = False
    if db:
        try:
            users_ref = db.collection('users')
            query = users_ref.where('role', '==', 'student').stream()
            
            data_list = []
            for doc in query:
                d = doc.to_dict()
                data_list.append({
                    "id": doc.id,
                    "name": d.get('name', 'Unknown'),
                    "total_accuracy": d.get('totalAccuracy', 0) or 0,
                    "streak": d.get('streak', 0) or 0,
                    "xp": d.get('xp', 0) or 0
                })
            
            if data_list:
                df_students = pd.DataFrame(data_list)
        except Exception as e:
            print(f"Error fetching from Firebase: {e}")
            connection_failed = True
    else:
        connection_failed = True
    
    # 2. Logic Branching
    if connection_failed:
        print("Connection to Firebase failed or DB not initialized. Using SYNTHETIC DATA.")
        df_students = generate_synthetic_data()
    elif df_students.empty or len(df_students) < 5:
        return {"students": [], "status": "insufficient_data"}

    # 4. Process Logic
    df_students = calculate_metrics(df_students)
    df_students, status = classify_students(df_students)
    
    if status == "insufficient_data":
         return {"students": [], "status": "insufficient_data"}

    # 5. Format Response
    result = []
    for _, row in df_students.iterrows():
        result.append({
            "id": row['id'],
            "name": row['name'],
            "totalAccuracy": float(row['total_accuracy']),
            "streak": int(row['streak']),
            "xp": int(row['xp']),
            "elo": int(row['elo']),
            "retention_rate": float(row['retention_rate']),
            "category": row['category'],
            "is_at_risk": bool(row['is_at_risk'])
        })
        
    return {"students": result, "status": "success"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
