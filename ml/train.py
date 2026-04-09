"""
Predictive Maintenance - Training Script (Fixed)
"""

import os
import pandas as pd
import numpy as np
import joblib

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve
)

from xgboost import XGBClassifier

# Configuration
DATA_PATH      = "dataset.csv"
MODEL_PATH     = "model.pkl"
SCALER_PATH    = "scaler.pkl"
THRESHOLD_PATH = "threshold.pkl"

PLOTS_DIR = "plots"
os.makedirs(PLOTS_DIR, exist_ok=True)

# Fixed constant — same value used in features.py at inference time
TOOL_WEAR_MAX = 250


# ── Data Loading ──────────────────────────────────────────────
def load_data(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


# ── Preprocessing ─────────────────────────────────────────────
def preprocess(df: pd.DataFrame):
    df = df.drop(columns=["UDI", "Product ID"])

    encoder = LabelEncoder()
    df["Type"] = encoder.fit_transform(df["Type"])

    y = df["Machine failure"]
    df = df.drop(columns=["Machine failure", "TWF", "HDF", "PWF", "OSF", "RNF"])

    return df, y


# ── Feature Engineering ───────────────────────────────────────
def engineer_features(X: pd.DataFrame) -> pd.DataFrame:
    """
    Must exactly match app/features.py used at inference time.

    FIX: wear_ratio previously used X["Tool wear [min]"].max() which
    leaks information from the full dataset into each split.
    Now uses a fixed constant (TOOL_WEAR_MAX = 250) so train/val/test
    and inference all use the same normalization.
    """
    X = X.copy()

    X["temp_diff"]      = X["Process temperature [K]"] - X["Air temperature [K]"]
    X["torque_per_rpm"] = X["Torque [Nm]"] / (X["Rotational speed [rpm]"] + 1)
    X["wear_ratio"]     = X["Tool wear [min]"] / TOOL_WEAR_MAX   # ← FIXED (was .max())

    return X


def rename_columns(X: pd.DataFrame) -> pd.DataFrame:
    """
    Rename training dataset columns to match the API field names
    so StandardScaler feature_names_in_ matches inference time.
    """
    return X.rename(columns={
        "Air temperature [K]":       "air_temperature",
        "Process temperature [K]":   "process_temperature",
        "Rotational speed [rpm]":    "rotational_speed",
        "Torque [Nm]":               "torque",
        "Tool wear [min]":           "tool_wear",
    })


# ── Model Training ────────────────────────────────────────────
def train_model(X_train, y_train):
    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    scale_pos_weight = neg / pos

    print(f"\nClass balance — Negative: {neg}, Positive: {pos}")
    print(f"scale_pos_weight: {scale_pos_weight:.1f}")

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss"
    )

    model.fit(X_train, y_train)
    return model


# ── Threshold Tuning (on validation set only) ─────────────────
def find_best_threshold(y_true, y_proba):
    """
    FIX: Previously called on y_test — that's data leakage.
    Now called on a separate validation split so the test set
    stays completely unseen until final evaluation.
    Optimizes for recall (catching failures) with a minimum
    precision floor to avoid flagging everything as failure.
    """
    best_threshold = 0.5
    best_f2 = 0.0  # F2 weights recall 2x over precision

    for t in np.arange(0.05, 0.60, 0.01):
        y_pred = (y_proba > t).astype(int)

        tp = ((y_true == 1) & (y_pred == 1)).sum()
        fp = ((y_true == 0) & (y_pred == 1)).sum()
        fn = ((y_true == 1) & (y_pred == 0)).sum()

        precision = tp / (tp + fp + 1e-6)
        recall    = tp / (tp + fn + 1e-6)

        # Skip thresholds with very low precision (model flagging everything)
        if precision < 0.10:
            continue

        # F2 score: weights recall twice as much as precision
        f2 = (5 * precision * recall) / (4 * precision + recall + 1e-6)

        if f2 > best_f2:
            best_f2 = f2
            best_threshold = t

    return round(best_threshold, 2), best_f2


# ── Visualizations ────────────────────────────────────────────
def plot_confusion_matrix(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["No Failure", "Failure"],
                yticklabels=["No Failure", "Failure"])
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix (Test Set)")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "confusion_matrix.png"))
    plt.close()


def plot_roc_curve(y_true, y_proba):
    fpr, tpr, _ = roc_curve(y_true, y_proba)
    auc = roc_auc_score(y_true, y_proba)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, label=f"AUC = {auc:.4f}")
    plt.plot([0, 1], [0, 1], "k--", alpha=0.4)
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve (Test Set)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "roc_curve.png"))
    plt.close()


def plot_feature_importance(model, feature_names):
    importances = model.feature_importances_
    indices = np.argsort(importances)
    plt.figure(figsize=(10, 6))
    plt.barh(range(len(indices)), importances[indices], color="steelblue")
    plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
    plt.title("Feature Importance")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, "feature_importance.png"))
    plt.close()


# ── Evaluation ────────────────────────────────────────────────
def evaluate(model, X_test, y_test, threshold, feature_names):
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred  = (y_proba > threshold).astype(int)

    print("\nFinal Evaluation on Held-Out Test Set")
    print("=" * 45)
    print(f"Threshold (tuned on val set): {threshold:.2f}")
    print(f"\nROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Failure", "Failure"]))

    plot_confusion_matrix(y_test, y_pred)
    plot_roc_curve(y_test, y_proba)
    plot_feature_importance(model, feature_names)


# ── Main Pipeline ─────────────────────────────────────────────
def main():
    df = load_data(DATA_PATH)
    X, y = preprocess(df)
    X = engineer_features(X)
    X = rename_columns(X)          # ← align column names with inference schema

    feature_names = list(X.columns)
    print(f"Features ({len(feature_names)}): {feature_names}")

    # ── Split: 70% train | 10% val (threshold tuning) | 20% test ──
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.125, stratify=y_train, random_state=42
        # 0.125 of 80% = 10% of total
    )

    print(f"\nSplit sizes — Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

    # ── Scale (fit ONLY on train) ──
    scaler = StandardScaler()
    X_train_sc = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_names)
    X_val_sc   = pd.DataFrame(scaler.transform(X_val),       columns=feature_names)
    X_test_sc  = pd.DataFrame(scaler.transform(X_test),      columns=feature_names)

    # ── Cross-validation on training fold (honest estimate) ──
    cv_model = XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.1,
                              subsample=0.8, colsample_bytree=0.8, random_state=42,
                              eval_metric="logloss")
    cv_scores = cross_val_score(cv_model, X_train_sc, y_train,
                                cv=StratifiedKFold(5), scoring="roc_auc")
    print(f"\nCV ROC-AUC (5-fold, train only): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Train final model ──
    model = train_model(X_train_sc, y_train)

    # ── Tune threshold on VALIDATION set (not test!) ──
    val_proba = model.predict_proba(X_val_sc)[:, 1]
    best_threshold, best_f2 = find_best_threshold(y_val.values, val_proba)
    print(f"\nBest Threshold (from val set): {best_threshold:.2f}")
    print(f"Best F2 Score  (from val set): {best_f2:.4f}")

    # ── Final evaluation on untouched test set ──
    evaluate(model, X_test_sc, y_test, best_threshold, feature_names)

    # ── Save artifacts ──
    joblib.dump(model,          MODEL_PATH)
    joblib.dump(scaler,         SCALER_PATH)
    joblib.dump(best_threshold, THRESHOLD_PATH)

    print(f"\nSaved: {MODEL_PATH}, {SCALER_PATH}, {THRESHOLD_PATH}")


if __name__ == "__main__":
    main()
