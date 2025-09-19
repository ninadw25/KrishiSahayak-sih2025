import pandas as pd
import numpy as np
import re
from pathlib import Path

def clean_crop_production_perfect(input_file, output_file):
    """
    Perfect version that handles the CSV correctly with proper crop names
    """
    print("🌾 PERFECT Crop Production Data Cleaner")
    print("=" * 60)
    
    try:
        # Read the CSV
        print("📖 Reading CSV file...")
        df = pd.read_csv(input_file, low_memory=False)
        print(f"📊 Original shape: {df.shape}")
        
        # Step 1: Extract crop names from the ORIGINAL column headers
        print("🏷️ Extracting crop names from original headers...")
        
        # The original column headers contain the crop names
        original_headers = df.columns.tolist()
        crop_info = []
        
        # Extract crop names - they start from index 3 and each crop has 3 columns
        i = 3
        while i < len(original_headers):
            crop_header = original_headers[i]
            if pd.notna(crop_header) and str(crop_header).strip():
                crop_name = str(crop_header).strip()
                # Clean the crop name
                clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', crop_name)  # Remove special chars
                clean_name = re.sub(r'\s+', '_', clean_name)  # Replace spaces with underscore
                clean_name = clean_name.strip('_')  # Remove leading/trailing underscores
                
                if clean_name and clean_name not in [h[0] for h in crop_info]:
                    crop_info.append((clean_name, i, i+1, i+2))  # (name, area_col, prod_col, yield_col)
                    i += 3  # Skip to next crop (each crop has 3 columns)
                else:
                    i += 1
            else:
                i += 1
        
        print(f"🌱 Found {len(crop_info)} crops")
        if crop_info:
            print(f"First 10 crops: {[c[0] for c in crop_info[:10]]}")
        
        # Step 2: Create proper column mapping
        print("🏗️ Creating column mapping...")
        new_columns = ['State', 'District', 'Year']
        column_mapping = {}
        
        for crop_name, area_idx, prod_idx, yield_idx in crop_info:
            if area_idx < len(df.columns):
                area_col = f"{crop_name}_Area"
                prod_col = f"{crop_name}_Production" 
                yield_col = f"{crop_name}_Yield"
                
                column_mapping[area_idx] = area_col
                column_mapping[prod_idx] = prod_col
                column_mapping[yield_idx] = yield_col
                
                new_columns.extend([area_col, prod_col, yield_col])
        
        # Fill remaining columns
        while len(new_columns) < len(df.columns):
            new_columns.append(f'Unknown_Col_{len(new_columns)}')
        
        # Rename columns
        df.columns = new_columns[:len(df.columns)]
        
        # Step 3: Find actual data start
        print("📍 Finding data start...")
        data_start_idx = None
        
        for i in range(len(df)):
            state_val = str(df.iloc[i, 0]).strip() if pd.notna(df.iloc[i, 0]) else ""
            if state_val and state_val != 'nan':
                # Look for state names
                if any(keyword in state_val.lower() for keyword in 
                      ['andaman', 'andhra', 'arunachal', 'assam', 'bihar', 'chandigarh']):
                    data_start_idx = i
                    print(f"Found data start at row {i}: {state_val}")
                    break
        
        if data_start_idx is None:
            # Fallback - look for numbered states
            for i in range(len(df)):
                state_val = str(df.iloc[i, 0]).strip() if pd.notna(df.iloc[i, 0]) else ""
                if re.match(r'^\d+\.\s*[A-Za-z]', state_val):
                    data_start_idx = i
                    print(f"Found data start at row {i}: {state_val}")
                    break
        
        if data_start_idx is None:
            data_start_idx = 2  # Default fallback
            print(f"Using default data start at row {data_start_idx}")
        
        # Step 4: Extract and clean data
        print("🧹 Extracting and cleaning data...")
        data_df = df.iloc[data_start_idx:].copy().reset_index(drop=True)
        
        # Clean State column
        data_df['State'] = data_df['State'].astype(str)
        data_df['State'] = data_df['State'].str.replace(r'^\d+\.\s*', '', regex=True)
        data_df['State'] = data_df['State'].replace('nan', pd.NA)
        data_df['State'] = data_df['State'].ffill()
        
        # Clean District column
        data_df['District'] = data_df['District'].astype(str)
        data_df['District'] = data_df['District'].str.replace(r'^\d+\.\s*', '', regex=True)
        data_df['District'] = data_df['District'].replace('nan', pd.NA)
        data_df['District'] = data_df['District'].ffill()
        
        # Clean Year column
        def extract_year(year_str):
            if pd.isna(year_str):
                return None
            year_str = str(year_str).strip()
            match = re.search(r'(\d{4})', year_str)
            return int(match.group(1)) if match else None
        
        data_df['Year'] = data_df['Year'].apply(extract_year)
        
        # Remove invalid rows
        initial_size = len(data_df)
        data_df = data_df.dropna(subset=['State', 'Year'])
        data_df = data_df[data_df['State'].str.len() > 2]
        data_df = data_df[(data_df['Year'] >= 1990) & (data_df['Year'] <= 2030)]  # Reasonable year range
        print(f"✂️ Removed {initial_size - len(data_df)} invalid rows")
        
        # Step 5: Convert to long format with proper crop names
        print("🔄 Converting to ML-ready format...")
        melted_records = []
        
        for crop_name, _, _, _ in crop_info:
            area_col = f"{crop_name}_Area"
            prod_col = f"{crop_name}_Production"
            yield_col = f"{crop_name}_Yield"
            
            if all(col in data_df.columns for col in [area_col, prod_col, yield_col]):
                # Get data for this crop
                crop_data = data_df[['State', 'District', 'Year', area_col, prod_col, yield_col]].copy()
                
                # Convert to numeric
                for col in [area_col, prod_col, yield_col]:
                    crop_data[col] = pd.to_numeric(crop_data[col], errors='coerce')
                
                # Remove completely empty rows
                crop_data = crop_data.dropna(subset=[area_col, prod_col, yield_col], how='all')
                
                if not crop_data.empty:
                    # Rename to standard format
                    crop_data = crop_data.rename(columns={
                        area_col: 'Area_Hectare',
                        prod_col: 'Production_Tonnes',
                        yield_col: 'Yield_Tonnes_per_Hectare'
                    })
                    
                    crop_data['Crop'] = crop_name
                    
                    # Reorder columns
                    crop_data = crop_data[['State', 'District', 'Year', 'Crop', 
                                         'Area_Hectare', 'Production_Tonnes', 'Yield_Tonnes_per_Hectare']]
                    
                    melted_records.append(crop_data)
        
        # Step 6: Combine and final processing
        print("🎯 Combining all crop data...")
        
        if not melted_records:
            print("❌ No valid crop data found!")
            return None
        
        final_df = pd.concat(melted_records, ignore_index=True)
        print(f"Combined shape: {final_df.shape}")
        
        # Final data quality improvements
        initial_size = len(final_df)
        
        # Remove rows with all missing production data
        final_df = final_df.dropna(subset=['Area_Hectare', 'Production_Tonnes', 'Yield_Tonnes_per_Hectare'], how='all')
        
        # Calculate missing yields
        mask = (final_df['Yield_Tonnes_per_Hectare'].isna() & 
               final_df['Area_Hectare'].notna() & 
               final_df['Production_Tonnes'].notna() & 
               final_df['Area_Hectare'] > 0)
        
        if mask.any():
            final_df.loc[mask, 'Yield_Tonnes_per_Hectare'] = (
                final_df.loc[mask, 'Production_Tonnes'] / final_df.loc[mask, 'Area_Hectare']
            )
            print(f"📊 Calculated {mask.sum()} missing yields")
        
        # Remove invalid values and outliers
        final_df = final_df[
            (final_df['Area_Hectare'].isna()) | (final_df['Area_Hectare'] >= 0)
        ]
        final_df = final_df[
            (final_df['Production_Tonnes'].isna()) | (final_df['Production_Tonnes'] >= 0)
        ]
        final_df = final_df[
            (final_df['Yield_Tonnes_per_Hectare'].isna()) | 
            ((final_df['Yield_Tonnes_per_Hectare'] >= 0) & (final_df['Yield_Tonnes_per_Hectare'] <= 500))
        ]
        
        print(f"🚫 Removed {initial_size - len(final_df)} outlier/invalid records")
        
        # Sort and reset index
        final_df = final_df.sort_values(['State', 'District', 'Year', 'Crop']).reset_index(drop=True)
        
        # Step 7: Save results
        print("💾 Saving cleaned data...")
        
        # Handle file conflicts
        output_path = Path(output_file)
        if output_path.exists():
            try:
                with open(output_path, 'a'):
                    pass
            except PermissionError:
                counter = 1
                while output_path.exists():
                    output_path = output_path.parent / f"{output_path.stem}_perfect_v{counter}{output_path.suffix}"
                    counter += 1
                output_file = str(output_path)
                print(f"📝 Using filename: {output_path.name}")
        
        final_df.to_csv(output_file, index=False)
        
        # Step 8: Generate comprehensive report
        print("\n" + "=" * 80)
        print("✅ PERFECT CROP PRODUCTION DATA CLEANING COMPLETED!")
        print("=" * 80)
        print(f"📁 Output file: {output_file}")
        print(f"📊 Final dataset shape: {final_df.shape}")
        print(f"🗺️ Unique states: {final_df['State'].nunique()}")
        print(f"🏘️ Unique districts: {final_df['District'].nunique()}")
        print(f"🌾 Unique crops: {final_df['Crop'].nunique()}")
        print(f"📅 Year range: {final_df['Year'].min():.0f} - {final_df['Year'].max():.0f}")
        
        print(f"\n📋 Sample of cleaned data:")
        print(final_df.head(10))
        
        print(f"\n🏆 Top 10 crops by data availability:")
        crop_counts = final_df['Crop'].value_counts().head(10)
        for crop, count in crop_counts.items():
            print(f"   {crop}: {count} records")
        
        print(f"\n🏆 Top 5 states by total production:")
        state_production = final_df.groupby('State')['Production_Tonnes'].sum().sort_values(ascending=False).head(5)
        for state, production in state_production.items():
            if pd.notna(production):
                print(f"   {state}: {production:,.0f} tonnes")
        
        print(f"\n🔍 Data quality assessment:")
        for col in ['Area_Hectare', 'Production_Tonnes', 'Yield_Tonnes_per_Hectare']:
            missing_pct = (final_df[col].isna().sum() / len(final_df)) * 100
            print(f"   {col}: {missing_pct:.1f}% missing")
        
        print(f"\n📈 Summary statistics:")
        numeric_cols = ['Area_Hectare', 'Production_Tonnes', 'Yield_Tonnes_per_Hectare']
        print(final_df[numeric_cols].describe())
        
        print(f"\n🎉 SUCCESS! Your crop production data is now perfectly cleaned and ready for:")
        print(f"   • Machine Learning models")
        print(f"   • Statistical analysis")
        print(f"   • Data visualization")
        print(f"   • Agricultural insights")
        
        return final_df
        
    except Exception as e:
        print(f"❌ Error during cleaning: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    input_file = "d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/crop_production_final.csv"
    output_file = "d:/Work/Coding/SIH 2025/agricultural-ai-platform/data/crop_production_cleaned_PERFECT.csv"
    
    # Ensure output directory exists
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    
    result = clean_crop_production_perfect(input_file, output_file)
    
    if result is not None:
        print(f"\n🌟 PERFECT! Your agricultural data is now ML-ready!")
        print(f"🔗 File location: {output_file}")
    else:
        print(f"\n💥 Cleaning failed - please check the error messages above")

if __name__ == "__main__":
    main()