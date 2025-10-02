import pandas as pd
import os
from pathlib import Path

def combine_soil_moisture_data():
    """
    Combine all soil moisture CSV files from the soil_moisture folder into one master CSV file
    """
    print("🌱 SOIL MOISTURE DATA COMBINER")
    print("=" * 60)
    
    # Define paths
    soil_moisture_folder = Path("d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/soil_moisture")
    output_file = soil_moisture_folder / "soil_moisture_combined_all_years.csv"
    
    # Get all soil moisture CSV files
    soil_moisture_files = sorted([f for f in soil_moisture_folder.glob("soil_moisture*.csv")])
    
    print(f"📁 Found {len(soil_moisture_files)} soil moisture files:")
    for file in soil_moisture_files:
        print(f"   📄 {file.name}")
    
    if not soil_moisture_files:
        print("❌ No soil moisture files found!")
        return
    
    # Combine all files
    print(f"\n🔄 Combining soil moisture data...")
    all_dataframes = []
    total_records = 0
    
    for i, file_path in enumerate(soil_moisture_files, 1):
        print(f"📖 Processing {file_path.name}...")
        
        try:
            # Read the CSV file
            df = pd.read_csv(file_path)
            
            print(f"   📊 Shape: {df.shape}")
            print(f"   📅 Year range: {df['Year'].min()} - {df['Year'].max()}")
            print(f"   🗺️ States: {df['State'].nunique()}")
            print(f"   🏘️ Districts: {df['District'].nunique()}")
            
            # Check soil moisture range
            print(f"   🌱 Soil moisture range: {df['Avg_smlvl_at15cm'].min():.2f} - {df['Avg_smlvl_at15cm'].max():.2f}")
            
            # Add to list
            all_dataframes.append(df)
            total_records += len(df)
            
        except Exception as e:
            print(f"   ❌ Error reading {file_path.name}: {e}")
            continue
    
    if not all_dataframes:
        print("❌ No valid data found!")
        return
    
    # Combine all dataframes
    print(f"\n🎯 Combining {len(all_dataframes)} dataframes...")
    combined_df = pd.concat(all_dataframes, ignore_index=True)
    
    print(f"📊 Combined dataset shape: {combined_df.shape}")
    print(f"📈 Total records: {len(combined_df):,}")
    
    # Data quality checks
    print(f"\n🔍 Data quality analysis:")
    print(f"   📅 Year range: {combined_df['Year'].min()} - {combined_df['Year'].max()}")
    print(f"   🗺️ Unique states: {combined_df['State'].nunique()}")
    print(f"   🏘️ Unique districts: {combined_df['District'].nunique()}")
    print(f"   🏢 Agencies: {combined_df['Agency_name'].nunique()}")
    
    # Check for missing values
    print(f"\n📋 Missing values check:")
    for col in combined_df.columns:
        missing_count = combined_df[col].isnull().sum()
        missing_pct = (missing_count / len(combined_df)) * 100
        print(f"   {col}: {missing_count:,} ({missing_pct:.2f}%)")
    
    # Soil moisture statistics
    print(f"\n🌱 Soil moisture statistics:")
    soil_stats = combined_df['Avg_smlvl_at15cm'].describe()
    print(f"   Mean soil moisture: {soil_stats['mean']:.2f} %")
    print(f"   Median soil moisture: {soil_stats['50%']:.2f} %")
    print(f"   Min soil moisture: {soil_stats['min']:.2f} %")
    print(f"   Max soil moisture: {soil_stats['max']:.2f} %")
    print(f"   Std deviation: {soil_stats['std']:.2f} %")
    
    # Check for unusual values
    zero_moisture = (combined_df['Avg_smlvl_at15cm'] == 0).sum()
    negative_moisture = (combined_df['Avg_smlvl_at15cm'] < 0).sum()
    extreme_moisture = (combined_df['Avg_smlvl_at15cm'] > 100).sum()
    
    print(f"   Zero moisture readings: {zero_moisture:,}")
    print(f"   Negative moisture readings: {negative_moisture:,}")
    print(f"   Extreme moisture readings (>100%): {extreme_moisture:,}")
    
    # Top states by data points
    print(f"\n🏆 Top 10 states by data points:")
    state_counts = combined_df['State'].value_counts().head(10)
    for state, count in state_counts.items():
        print(f"   {state}: {count:,} records")
    
    # Agency distribution
    print(f"\n🏢 Data by agency:")
    agency_counts = combined_df['Agency_name'].value_counts()
    for agency, count in agency_counts.items():
        print(f"   {agency}: {count:,} records")
    
    # Monthly distribution
    print(f"\n📅 Monthly distribution:")
    monthly_counts = combined_df['Month'].value_counts().sort_index()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for month, count in monthly_counts.items():
        month_name = month_names[int(month) - 1] if 1 <= int(month) <= 12 else f"Month {month}"
        print(f"   {month_name}: {count:,} records")
    
    # Sort the data for better organization
    print(f"\n🗂️ Sorting data by State, District, Date...")
    combined_df = combined_df.sort_values(['State', 'District', 'Date']).reset_index(drop=True)
    
    # Save the combined data
    print(f"\n💾 Saving combined soil moisture data...")
    try:
        combined_df.to_csv(output_file, index=False)
        print(f"✅ Successfully saved to: {output_file}")
        
        # File size info
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        print(f"📦 File size: {file_size_mb:.2f} MB")
        
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return
    
    # Sample of combined data
    print(f"\n📋 Sample of combined data:")
    print(combined_df.head(10))
    
    # Summary by year
    print(f"\n📊 Summary by year:")
    yearly_summary = combined_df.groupby('Year').agg({
        'Avg_smlvl_at15cm': ['count', 'mean', 'std'],
        'State': 'nunique',
        'District': 'nunique'
    }).round(2)
    
    yearly_summary.columns = ['Records', 'Mean_Moisture', 'Std_Moisture', 'States', 'Districts']
    print(yearly_summary)
    
    print(f"\n🎉 SUCCESS! All soil moisture data combined successfully!")
    print(f"🔗 Combined file: {output_file}")
    print(f"📊 Total records: {len(combined_df):,}")
    print(f"📅 Date range: {combined_df['Date'].min()} to {combined_df['Date'].max()}")
    
    return combined_df

def clean_soil_moisture_data():
    """
    Clean the combined soil moisture data by removing duplicates and fixing issues
    """
    print(f"\n🧹 SOIL MOISTURE DATA CLEANER")
    print("=" * 50)
    
    # Define paths
    soil_moisture_folder = Path("d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/soil_moisture")
    input_file = soil_moisture_folder / "soil_moisture_combined_all_years.csv"
    output_file = soil_moisture_folder / "soil_moisture_combined_cleaned.csv"
    
    if not input_file.exists():
        print("❌ Combined soil moisture file not found! Please run combine function first.")
        return
    
    print(f"📖 Reading combined soil moisture data...")
    df = pd.read_csv(input_file)
    
    print(f"📊 Original shape: {df.shape}")
    print(f"📈 Total records: {len(df):,}")
    
    # Check for duplicates
    print(f"\n🔍 Checking for duplicates...")
    duplicates = df.duplicated()
    duplicate_count = duplicates.sum()
    
    print(f"   🔄 Exact duplicate records found: {duplicate_count:,}")
    
    if duplicate_count > 0:
        # Remove duplicates
        df_cleaned = df.drop_duplicates()
        print(f"   ✂️ Removed {duplicate_count:,} duplicate records")
    else:
        df_cleaned = df.copy()
        print(f"   ✅ No exact duplicates found")
    
    # Check for duplicates based on key columns
    print(f"\n🔍 Checking for duplicates by State, District, Date...")
    key_duplicates = df_cleaned.duplicated(subset=['State', 'District', 'Date'])
    key_duplicate_count = key_duplicates.sum()
    
    print(f"   🔄 Key duplicates found: {key_duplicate_count:,}")
    
    if key_duplicate_count > 0:
        # Keep first occurrence of each State-District-Date combination
        df_cleaned = df_cleaned.drop_duplicates(subset=['State', 'District', 'Date'], keep='first')
        print(f"   ✂️ Removed {key_duplicate_count:,} key duplicate records")
    
    # Data validation
    print(f"\n✅ Data validation...")
    
    # Check date format
    df_cleaned['Date'] = pd.to_datetime(df_cleaned['Date'])
    print(f"   📅 Date range: {df_cleaned['Date'].min()} to {df_cleaned['Date'].max()}")
    
    # Check for negative soil moisture values
    negative_moisture = (df_cleaned['Avg_smlvl_at15cm'] < 0).sum()
    if negative_moisture > 0:
        print(f"   ⚠️ Found {negative_moisture} negative soil moisture values")
        df_cleaned = df_cleaned[df_cleaned['Avg_smlvl_at15cm'] >= 0]
        print(f"   ✂️ Removed negative soil moisture values")
    else:
        print(f"   ✅ No negative soil moisture values")
    
    # Check for extremely high soil moisture values (>200%)
    extreme_moisture = (df_cleaned['Avg_smlvl_at15cm'] > 200).sum()
    if extreme_moisture > 0:
        print(f"   ⚠️ Found {extreme_moisture} extreme soil moisture values (>200%)")
        print(f"   📊 Max soil moisture: {df_cleaned['Avg_smlvl_at15cm'].max():.2f}%")
        # Keep these as they might be valid in certain soil types
    
    # Sort data properly
    print(f"\n🗂️ Sorting data...")
    df_cleaned = df_cleaned.sort_values(['State', 'District', 'Date']).reset_index(drop=True)
    
    # Final statistics
    print(f"\n📊 Cleaned dataset statistics:")
    print(f"   📈 Final records: {len(df_cleaned):,}")
    print(f"   📅 Date range: {df_cleaned['Date'].min().date()} to {df_cleaned['Date'].max().date()}")
    print(f"   🗺️ States: {df_cleaned['State'].nunique()}")
    print(f"   🏘️ Districts: {df_cleaned['District'].nunique()}")
    print(f"   🏢 Agencies: {df_cleaned['Agency_name'].nunique()}")
    
    # Soil moisture statistics
    print(f"\n🌱 Soil moisture statistics:")
    print(f"   Mean: {df_cleaned['Avg_smlvl_at15cm'].mean():.2f} %")
    print(f"   Median: {df_cleaned['Avg_smlvl_at15cm'].median():.2f} %")
    print(f"   Min: {df_cleaned['Avg_smlvl_at15cm'].min():.2f} %")
    print(f"   Max: {df_cleaned['Avg_smlvl_at15cm'].max():.2f} %")
    print(f"   Zero moisture readings: {(df_cleaned['Avg_smlvl_at15cm'] == 0).sum():,}")
    print(f"   Valid moisture readings: {(df_cleaned['Avg_smlvl_at15cm'] > 0).sum():,}")
    
    # Save cleaned data
    print(f"\n💾 Saving cleaned data...")
    df_cleaned.to_csv(output_file, index=False)
    
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"✅ Successfully saved to: {output_file}")
    print(f"📦 File size: {file_size_mb:.2f} MB")
    
    # Sample of cleaned data
    print(f"\n📋 Sample of cleaned data:")
    print(df_cleaned.head(10))
    
    print(f"\n🎉 SUCCESS! Soil moisture data cleaned and ready for use!")
    print(f"🔗 Cleaned file: {output_file}")
    
    return df_cleaned

def main():
    """Main function"""
    try:
        # Combine the data
        print("🚀 Starting soil moisture data combination...")
        combined_result = combine_soil_moisture_data()
        
        if combined_result is not None:
            print(f"\n✨ Soil moisture data combination completed successfully!")
            
            # Ask if user wants to clean the data
            print(f"\n" + "="*50)
            clean_choice = input("Do you want to clean the combined data for duplicates? (y/n): ").lower().strip()
            
            if clean_choice == 'y':
                cleaned_result = clean_soil_moisture_data()
                if cleaned_result is not None:
                    print(f"\n🎯 Data cleaning also completed successfully!")
                else:
                    print(f"\n⚠️ Data cleaning failed, but combination was successful.")
            else:
                print(f"\n📋 Data combination completed. Cleaning skipped.")
        else:
            print(f"\n💥 Failed to combine soil moisture data!")
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()