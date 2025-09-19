import pandas as pd
import numpy as np
from pathlib import Path

def check_rainfall_data_quality():
    """
    Check the quality of the combined rainfall data and identify any issues
    """
    print("🔍 RAINFALL DATA QUALITY CHECKER")
    print("=" * 50)
    
    # Load the combined data
    file_path = Path("d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/weather/rainfall_combined_all_years.csv")
    
    if not file_path.exists():
        print("❌ Combined rainfall file not found!")
        return
    
    print(f"📂 Loading data from: {file_path}")
    df = pd.read_csv(file_path)
    
    print(f"📊 Initial data shape: {df.shape}")
    print(f"📅 Date range: {df['Date'].min()} to {df['Date'].max()}")
    
    # Check for duplicates
    print(f"\n🔍 DUPLICATE ANALYSIS:")
    print("-" * 30)
    
    # Check for exact duplicates (all columns identical)
    exact_duplicates = df.duplicated().sum()
    print(f"📋 Exact duplicates (all columns): {exact_duplicates:,}")
    
    # Check for logical duplicates (same State, District, Date, Agency)
    logical_duplicates = df.duplicated(subset=['State', 'District', 'Date', 'Agency_name']).sum()
    print(f"🎯 Logical duplicates (State+District+Date+Agency): {logical_duplicates:,}")
    
    # Check for date duplicates per location (regardless of agency)
    date_location_duplicates = df.duplicated(subset=['State', 'District', 'Date']).sum()
    print(f"📍 Date+Location duplicates (different agencies): {date_location_duplicates:,}")
    
    # Show some duplicate examples if they exist
    if logical_duplicates > 0:
        print(f"\n📝 Sample of logical duplicates:")
        duplicate_examples = df[df.duplicated(subset=['State', 'District', 'Date', 'Agency_name'], keep=False)]
        print(duplicate_examples.head(10)[['State', 'District', 'Date', 'Agency_name', 'Avg_rainfall']])
    
    # Check data quality issues
    print(f"\n🔍 DATA QUALITY ANALYSIS:")
    print("-" * 30)
    
    # Missing values
    missing_values = df.isnull().sum()
    print(f"📊 Missing values per column:")
    for col, missing in missing_values.items():
        if missing > 0:
            pct = (missing / len(df)) * 100
            print(f"   {col}: {missing:,} ({pct:.2f}%)")
    
    # Negative rainfall values
    negative_rainfall = (df['Avg_rainfall'] < 0).sum()
    print(f"❌ Negative rainfall values: {negative_rainfall:,}")
    
    # Extremely high rainfall values (>500mm in a day)
    extreme_rainfall = (df['Avg_rainfall'] > 500).sum()
    print(f"⚠️  Extreme rainfall values (>500mm): {extreme_rainfall:,}")
    if extreme_rainfall > 0:
        extreme_examples = df[df['Avg_rainfall'] > 500].nlargest(5, 'Avg_rainfall')
        print(f"   Top 5 extreme values:")
        for _, row in extreme_examples.iterrows():
            print(f"   {row['State']}, {row['District']}, {row['Date']}: {row['Avg_rainfall']:.2f}mm")
    
    # Date format issues
    try:
        df['Date'] = pd.to_datetime(df['Date'])
        date_errors = 0
    except:
        date_errors = "Could not parse dates"
    print(f"📅 Date parsing errors: {date_errors}")
    
    # Check agency distribution
    print(f"\n🏢 AGENCY DISTRIBUTION:")
    print("-" * 30)
    agency_counts = df['Agency_name'].value_counts()
    for agency, count in agency_counts.items():
        pct = (count / len(df)) * 100
        print(f"   {agency}: {count:,} records ({pct:.1f}%)")
    
    # Check temporal distribution
    print(f"\n📅 TEMPORAL DISTRIBUTION:")
    print("-" * 30)
    df['Date'] = pd.to_datetime(df['Date'])
    df['Year'] = df['Date'].dt.year
    year_counts = df['Year'].value_counts().sort_index()
    print(f"Records per year:")
    for year, count in year_counts.items():
        print(f"   {year}: {count:,} records")
    
    # Check geographic distribution
    print(f"\n🗺️  GEOGRAPHIC DISTRIBUTION:")
    print("-" * 30)
    print(f"📍 Unique states: {df['State'].nunique()}")
    print(f"🏘️  Unique districts: {df['District'].nunique()}")
    
    state_counts = df['State'].value_counts().head(10)
    print(f"\nTop 10 states by record count:")
    for state, count in state_counts.items():
        print(f"   {state}: {count:,} records")
    
    # Summary statistics
    print(f"\n📈 RAINFALL STATISTICS:")
    print("-" * 30)
    rainfall_stats = df['Avg_rainfall'].describe()
    print(f"Mean: {rainfall_stats['mean']:.2f} mm")
    print(f"Median: {rainfall_stats['50%']:.2f} mm")
    print(f"Std Dev: {rainfall_stats['std']:.2f} mm")
    print(f"Min: {rainfall_stats['min']:.2f} mm")
    print(f"Max: {rainfall_stats['max']:.2f} mm")
    print(f"Zero rainfall days: {(df['Avg_rainfall'] == 0).sum():,} ({((df['Avg_rainfall'] == 0).sum() / len(df) * 100):.1f}%)")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    print("-" * 30)
    
    recommendations = []
    
    if exact_duplicates > 0:
        recommendations.append(f"❗ Remove {exact_duplicates:,} exact duplicate records")
    
    if logical_duplicates > 0:
        recommendations.append(f"❗ Investigate {logical_duplicates:,} logical duplicates (same location+date+agency)")
    
    if date_location_duplicates > 0:
        recommendations.append(f"ℹ️  Note: {date_location_duplicates:,} records have multiple agencies for same location+date")
    
    if negative_rainfall > 0:
        recommendations.append(f"❗ Fix {negative_rainfall:,} negative rainfall values")
    
    if extreme_rainfall > 0:
        recommendations.append(f"⚠️  Review {extreme_rainfall:,} extreme rainfall values (>500mm)")
    
    if len(recommendations) == 0:
        recommendations.append("✅ Data quality looks good!")
    
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec}")
    
    return df

def clean_rainfall_data():
    """
    Clean the rainfall data by removing duplicates and fixing issues
    """
    print(f"\n🧹 CLEANING RAINFALL DATA:")
    print("-" * 30)
    
    # Load data
    file_path = Path("d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/weather/rainfall_combined_all_years.csv")
    df = pd.read_csv(file_path)
    
    original_count = len(df)
    print(f"📊 Original records: {original_count:,}")
    
    # Remove exact duplicates
    df_cleaned = df.drop_duplicates()
    after_exact_duplicates = len(df_cleaned)
    exact_removed = original_count - after_exact_duplicates
    print(f"📋 Removed exact duplicates: {exact_removed:,}")
    
    # Remove logical duplicates (keep first occurrence)
    df_cleaned = df_cleaned.drop_duplicates(subset=['State', 'District', 'Date', 'Agency_name'])
    after_logical_duplicates = len(df_cleaned)
    logical_removed = after_exact_duplicates - after_logical_duplicates
    print(f"🎯 Removed logical duplicates: {logical_removed:,}")
    
    # Fix negative rainfall values (set to 0)
    negative_count = (df_cleaned['Avg_rainfall'] < 0).sum()
    if negative_count > 0:
        df_cleaned.loc[df_cleaned['Avg_rainfall'] < 0, 'Avg_rainfall'] = 0
        print(f"❌ Fixed negative rainfall values: {negative_count:,}")
    
    # Sort data
    df_cleaned = df_cleaned.sort_values(['State', 'District', 'Date', 'Agency_name']).reset_index(drop=True)
    
    final_count = len(df_cleaned)
    total_removed = original_count - final_count
    
    print(f"📊 Final records: {final_count:,}")
    print(f"🗑️  Total removed: {total_removed:,}")
    print(f"📈 Data reduction: {(total_removed/original_count*100):.1f}%")
    
    # Save cleaned data
    cleaned_file = file_path.parent / "rainfall_combined_cleaned.csv"
    df_cleaned.to_csv(cleaned_file, index=False)
    print(f"💾 Saved cleaned data to: {cleaned_file}")
    
    return df_cleaned

def main():
    """Main function"""
    try:
        # Check data quality
        df = check_rainfall_data_quality()
        
        # Ask user if they want to clean the data
        print(f"\n" + "="*50)
        clean_choice = input("Do you want to clean the data? (y/n): ").lower().strip()
        
        if clean_choice == 'y':
            cleaned_df = clean_rainfall_data()
            print(f"\n✅ Data cleaning completed!")
        else:
            print(f"\n📋 Data quality check completed. No cleaning performed.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()