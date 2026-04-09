import pandas as pd

# Must match the constant used in train.py
TOOL_WEAR_MAX = 250


def engineer_features(data: dict) -> pd.DataFrame:
    """
    Apply same feature engineering used during training.
    Column names must exactly match what StandardScaler was fitted on.
    """

    temp_diff      = data["process_temperature"] - data["air_temperature"]
    torque_per_rpm = data["torque"] / (data["rotational_speed"] + 1)
    wear_ratio     = data["tool_wear"] / TOOL_WEAR_MAX   # same constant as training

    return pd.DataFrame([{
        "Type":                data["Type"],
        "air_temperature":     data["air_temperature"],
        "process_temperature": data["process_temperature"],
        "rotational_speed":    data["rotational_speed"],
        "torque":              data["torque"],
        "tool_wear":           data["tool_wear"],
        "temp_diff":           temp_diff,
        "torque_per_rpm":      torque_per_rpm,
        "wear_ratio":          wear_ratio,
    }])
