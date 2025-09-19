import os
import pandas as pd
import json
from pathlib import Path
from io import StringIO

def df_info_to_str(df):
    buf = StringIO()
    df.info(buf)
    return buf.getvalue()

def analyze_csvs_in_folder(folder_path, output_json_path):
    results = {}
    folder = Path(folder_path)
    for file in folder.glob('*.csv'):
        try:
            df = pd.read_csv(file)
            analysis = {}
            analysis['filename'] = file.name
            analysis['shape'] = list(df.shape)
            analysis['columns'] = list(df.columns)
            analysis['dtypes'] = {col: str(dtype) for col, dtype in df.dtypes.items()}
            analysis['head'] = df.head().to_dict(orient='records')
            analysis['null_counts'] = df.isnull().sum().to_dict()
            analysis['info'] = df_info_to_str(df)
            analysis['describe'] = json.loads(df.describe(include='all').to_json())
            analysis['nunique'] = df.nunique().to_dict()
            results[file.name] = analysis
        except Exception as e:
            results[file.name] = {'error': str(e)}
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Analysis saved to {output_json_path}")

if __name__ == "__main__":
    # Updated folder paths relative to the current working directory (data_processing)
    folder = r'../data/fertilizer_model'
    output_json = r'../data/fertilizer_model/model_csv_analysis.json'
    analyze_csvs_in_folder(folder, output_json)
