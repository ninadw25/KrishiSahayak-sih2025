import pandas as pd
import os
from pathlib import Path

def combine_rainfall_data():
    """
    Combine all rainfall CSV files from the weather folder into one master CSV file
    """
    print("🌧️ RAINFALL DATA COMBINER")
    print("=" * 50)
    
    # Define paths
    weather_folder = Path("d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/weather")
    output_file = weather_folder / "rainfall_combined_all_years.csv"
    
    # Get all rainfall CSV files
    rainfall_files = sorted([f for f in weather_folder.glob("rainfall*.csv")])
    
    print(f"📁 Found {len(rainfall_files)} rainfall files:")
    for file in rainfall_files:
        print(f"   📄 {file.name}")
    
    if not rainfall_files:
        print("❌ No rainfall files found!")
        return
    
    # Combine all files
    print(f"\n🔄 Combining rainfall data...")
    all_dataframes = []
    total_records = 0
    
    for i, file_path in enumerate(rainfall_files, 1):
        print(f"📖 Processing {file_path.name}...")
        
        try:
            # Read the CSV file
            df = pd.read_csv(file_path)
            
            print(f"   📊 Shape: {df.shape}")
            print(f"   📅 Year range: {df['Year'].min()} - {df['Year'].max()}")
            print(f"   🗺️ States: {df['State'].nunique()}")
            print(f"   🏘️ Districts: {df['District'].nunique()}")
            
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
    
    # Basic statistics
    print(f"\n📈 Rainfall statistics:")
    rainfall_stats = combined_df['Avg_rainfall'].describe()
    print(f"   Mean rainfall: {rainfall_stats['mean']:.2f} mm")
    print(f"   Median rainfall: {rainfall_stats['50%']:.2f} mm")
    print(f"   Max rainfall: {rainfall_stats['max']:.2f} mm")
    print(f"   Zero rainfall days: {(combined_df['Avg_rainfall'] == 0).sum():,}")
    
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
    
    # Sort the data for better organization
    print(f"\n🗂️ Sorting data by State, District, Date...")
    combined_df = combined_df.sort_values(['State', 'District', 'Date']).reset_index(drop=True)
    
    # Save the combined data
    print(f"\n💾 Saving combined rainfall data...")
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
    
    print(f"\n🎉 SUCCESS! All rainfall data combined successfully!")
    print(f"🔗 Combined file: {output_file}")
    print(f"📊 Total records: {len(combined_df):,}")
    print(f"📅 Date range: {combined_df['Date'].min()} to {combined_df['Date'].max()}")
    
    return combined_df

def main():
    """Main function"""
    try:
        result = combine_rainfall_data()
        if result is not None:
            print(f"\n✨ Rainfall data combination completed successfully!")
        else:
            print(f"\n💥 Failed to combine rainfall data!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()