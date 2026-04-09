# Predictive Maintenance Model - Working Documentation

## Overview

This project implements a machine learning system to predict machine failures using sensor data. The model is trained on the AI4I Predictive Maintenance dataset and is designed to detect potential failures in advance, enabling proactive maintenance.

---

## Problem Definition

Industrial machines generate continuous sensor data such as temperature, rotational speed, torque, and tool wear. The objective is to predict whether a machine is likely to fail based on these inputs.

This is formulated as a **binary classification problem**:
- `0` → Normal operation
- `1` → Machine failure

---

## Dataset Description

The dataset includes the following key features:

- Air temperature (K)
- Process temperature (K)
- Rotational speed (RPM)
- Torque (Nm)
- Tool wear (minutes)
- Product type (categorical: L, M, H)

Target variable:
- `Machine failure` (binary)

Additional failure type columns (TWF, HDF, PWF, OSF, RNF) are excluded during training to prevent data leakage.

---

## Data Preprocessing

The preprocessing pipeline includes:

1. Removal of identifier columns:
   - `UDI`
   - `Product ID`

2. Encoding categorical variables:
   - `Type` is encoded using label encoding

3. Separation of features and target variable

4. Removal of leakage-prone columns:
   - Failure type indicators are dropped as they directly reveal the target

---

## Feature Engineering

To improve model performance, additional features are derived:

- **Temperature Difference**
  - `Process temperature - Air temperature`

- **Torque per RPM**
  - Ratio representing operational efficiency

- **Wear Ratio**
  - Normalized tool wear value

These features help capture relationships not directly present in the raw data.

---

## Model Selection

The final model used is **XGBoost Classifier** due to:

- Strong performance on tabular data
- Ability to handle non-linear relationships
- Built-in handling of class imbalance

---

## Handling Class Imbalance

The dataset is highly imbalanced, with significantly fewer failure cases.

To address this:
- `scale_pos_weight` is computed as: scale_pos_weight = number_of_negative_samples / number_of_positive_samples


- This ensures the model gives higher importance to failure cases during training.

---

## Training Process

1. Dataset is split into training and testing sets using stratified sampling
2. Features are standardized using `StandardScaler`
3. Model is trained using XGBoost with tuned hyperparameters
4. Predictions are generated as probabilities

---

## Threshold Optimization

Instead of using the default classification threshold (0.5), a custom threshold is selected to maximize recall for failure detection.

- Threshold values are evaluated in the range `[0.1, 0.9]`
- The threshold that yields the highest recall is selected

This approach prioritizes detecting failures over minimizing false positives.

---

## Evaluation Metrics

The model is evaluated using:

- Confusion Matrix
- Precision
- Recall
- F1-score
- ROC-AUC Score

### Key Focus:
- **Recall (Failure Class)** is prioritized to minimize missed failures

---

## Model Performance

- Recall (Failure Class): ~0.82
- Precision (Failure Class): ~0.60
- ROC-AUC Score: ~0.97

The model demonstrates strong capability in detecting failures while maintaining acceptable false positive rates.

---

## Trade-offs

- Increasing recall leads to more false positives
- This is acceptable in predictive maintenance systems where missing a failure is more costly than triggering unnecessary inspections

---

## Model Artifacts

The following artifacts are generated after training:

- `model.pkl` → Trained XGBoost model
- `scaler.pkl` → Feature scaler
- `threshold.pkl` → Optimized decision threshold

These artifacts are used during inference in the backend system.

---

## Inference Workflow

1. Input sensor data is received
2. Same preprocessing and feature engineering steps are applied
3. Data is scaled using the saved scaler
4. Model predicts failure probability
5. Probability is compared with saved threshold
6. Final prediction is returned

---

## Conclusion

This model provides a practical solution for predictive maintenance by leveraging machine learning to detect potential failures. It emphasizes recall to ensure reliability in real-world industrial scenarios.