#!/usr/bin/env python3
"""
Script to create fertilizer_crop.csv from master_df.csv
Converts categorical nutrient levels to numeric values for ML training
"""

import pandas as pd
import numpy as np
from pathlib import Path

def convert_nutrient_level(level):
    """Convert categorical nutrient levels to numeric values"""
    if pd.isna(level):
        return 50  # Default medium value
    
    level = str(level).lower().strip()
    
    mapping = {
        'low': 25,
        'medium': 50, 
        'high': 75,
        'very_low': 15,
        'very_high': 90
    }
    
    return mapping.get(level, 50)  # Default to medium if unknown

def process_master_data():
    """Process master dataset to create fertilizer training data"""
    
    # Read master dataset
    master_path = Path(__file__).parent / "master_df.csv"
    print(f"Reading master dataset from: {master_path}")
    
    df = pd.read_csv(master_path)
    print(f"Loaded {len(df)} records from master dataset")
    
    # Filter out rows with missing critical data
    df_clean = df.dropna(subset=['Crop', 'ph_level', 'nitrogen_level', 'phosphorus_level', 'potassium_level'])
    print(f"After cleaning: {len(df_clean)} records")
    
    # Convert nutrient levels to numeric
    df_clean['N'] = df_clean['nitrogen_level'].apply(convert_nutrient_level)
    df_clean['P'] = df_clean['phosphorus_level'].apply(convert_nutrient_level) 
    df_clean['K'] = df_clean['potassium_level'].apply(convert_nutrient_level)
    df_clean['ph'] = df_clean['ph_level']
    
    # Standardize crop names (lowercase, replace spaces with underscores)
    df_clean['label'] = df_clean['Crop'].str.lower().str.replace(' ', '_')
    
    # Select only needed columns
    fertilizer_data = df_clean[['N', 'P', 'K', 'ph', 'label']].copy()
    
    # Remove duplicates and get unique crop-soil combinations
    fertilizer_data = fertilizer_data.drop_duplicates()
    
    # Add some variation to make the dataset more realistic
    # Create slight variations in nutrient levels for better training
    variations = []
    
    for _, row in fertilizer_data.iterrows():
        # Original row
        variations.append(row.to_dict())
        
        # Add small variations (±5-10 points)
        for i in range(2):  # Add 2 variations per original row
            var_row = row.copy()
            var_row['N'] = max(10, min(100, row['N'] + np.random.randint(-10, 11)))
            var_row['P'] = max(10, min(100, row['P'] + np.random.randint(-10, 11)))
            var_row['K'] = max(10, min(100, row['K'] + np.random.randint(-10, 11)))
            var_row['ph'] = max(4.0, min(9.0, row['ph'] + np.random.uniform(-0.5, 0.5)))
            variations.append(var_row.to_dict())
    
    # Create final dataset
    final_df = pd.DataFrame(variations)
    
    # Remove duplicates again
    final_df = final_df.drop_duplicates()
    
    print(f"Created fertilizer dataset with {len(final_df)} records")
    print(f"Unique crops: {sorted(final_df['label'].unique())}")
    
    # Save to ML directory
    output_path = Path(__file__).parent / "ML" / "fertilizer_crop.csv"
    output_path.parent.mkdir(exist_ok=True)
    
    final_df.to_csv(output_path, index=False)
    print(f"Saved fertilizer dataset to: {output_path}")
    
    # Display sample statistics
    print("\nDataset Statistics:")
    print(final_df.describe())
    
    print(f"\nCrop distribution:")
    print(final_df['label'].value_counts().head(10))
    
    return final_df

if __name__ == "__main__":
    df = process_master_data()
    print("\nFertilizer dataset creation completed!")