#!/usr/bin/env python3
"""
ARIMA Model Trainer for Crop Yield Prediction
Trains individual ARIMA models for each crop using historical yield data
(Updated to use ARIMA instead of SARIMA for annual data)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller, acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
import warnings
import pickle
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import itertools
from sklearn.metrics import mean_absolute_error, mean_squared_error
import os

# Suppress warnings
warnings.filterwarnings('ignore')

class SARIMAYieldTrainer:
    def __init__(self, data_file: str = None):
        """
        Initialize ARIMA trainer for crop yield prediction
        
        Args:
            data_file: Path to Excel file with crop yield data
        """
        # Get the project root directory (3 levels up from current file)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        
        # Set default data file path if not provided
        if data_file is None:
            self.data_file = os.path.join(project_root, "data", "crop_production1999-2023.xlsx")
        else:
            self.data_file = data_file
            
        self.raw_data = None
        self.processed_data = {}
        self.trained_models = {}
        self.model_performance = {}
        self.best_parameters = {}
        
        # Create directories for saving models and results (relative to current script location)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.models_dir = os.path.join(base_dir, 'models', 'sarima_yield')
        self.results_dir = os.path.join(base_dir, 'results', 'sarima_yield')
        self.plots_dir = os.path.join(base_dir, 'plots', 'sarima_yield')
        
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(self.plots_dir, exist_ok=True)
        
    def load_and_process_data(self):
        """
        Load the Excel data and process it for time series analysis
        Expected format: Multi-level structure with Area, Production, Yield columns per year
        """
        print("📊 Loading and processing crop yield data...")
        print(f"📁 Data file path: {self.data_file}")
        
        try:
            # Check if file exists
            if not os.path.exists(self.data_file):
                print(f"❌ File not found: {self.data_file}")
                return False
                
            # Load the Excel file
            self.raw_data = pd.read_excel(self.data_file)
            print(f"✅ Loaded data: {self.raw_data.shape[0]} rows, {self.raw_data.shape[1]} columns")
            
            # Skip header rows and get to actual data
            # Look for rows that contain actual crop data (not headers or state names)
            data_start_row = 2  # Skip the first two header rows
            
            # Extract year information from column headers
            year_columns = []
            for i, col in enumerate(self.raw_data.columns):
                if isinstance(col, str) and '-' in col and any(year in col for year in ['1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']):
                    # This is a year column, the next two columns should be Production and Yield
                    year = col.split(' - ')[0]  # Extract start year
                    year_columns.append((year, i, i+1, i+2))  # year, area_idx, production_idx, yield_idx
            
            print(f"📊 Found {len(year_columns)} year periods")
            
            # Process data starting from row 2 (skip headers)
            for idx in range(data_start_row, len(self.raw_data)):
                row = self.raw_data.iloc[idx]
                crop_district = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                
                # Skip empty rows, state headers, and total rows
                if not crop_district or crop_district.lower() in ['nan', 'total', 'all'] or 'Total' in crop_district:
                    continue
                
                # Skip state/region headers (they usually don't have numeric data)
                if any(state in crop_district for state in ['Andaman', 'Andhra', 'Arunachal', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil', 'Telangana', 'Tripura', 'Uttar', 'Uttarakhand', 'West Bengal', 'Jammu']):
                    continue
                
                # Extract yield data across years
                yield_data = []
                years = []
                
                for year, area_idx, prod_idx, yield_idx in year_columns:
                    try:
                        if yield_idx < len(row):
                            yield_value = row.iloc[yield_idx]
                            
                            # Clean and convert yield value
                            if pd.notna(yield_value) and str(yield_value).strip() not in ['', 'NaN', '0', '0.0']:
                                try:
                                    yield_float = float(yield_value)
                                    if yield_float > 0 and yield_float < 1000:  # Reasonable yield range
                                        years.append(int(year))
                                        yield_data.append(yield_float)
                                except (ValueError, TypeError):
                                    continue
                    except IndexError:
                        continue
                
                # Only process crops with sufficient data points
                if len(yield_data) >= 10:  # Need at least 10 data points for SARIMA
                    # Create time series
                    ts_data = pd.Series(
                        yield_data, 
                        index=pd.to_datetime(years, format='%Y'),
                        name=f"{crop_district}_yield"
                    ).sort_index()
                    
                    # Clean crop name for storage
                    clean_crop_name = crop_district.replace('/', '_').replace(' ', '_')
                    self.processed_data[clean_crop_name] = ts_data
                    print(f"✅ Processed {clean_crop_name}: {len(ts_data)} data points from {min(years)} to {max(years)}")
            
            print(f"🎯 Successfully processed {len(self.processed_data)} crops for SARIMA training")
            
            # Show sample of processed data
            if len(self.processed_data) > 0:
                print("\n📊 Sample processed data:")
                for i, (crop_name, data) in enumerate(list(self.processed_data.items())[:3]):
                    print(f"   {crop_name}: {len(data)} points, range: {data.min():.2f} - {data.max():.2f}")
            
            return len(self.processed_data) > 0
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def check_stationarity(self, ts_data: pd.Series, crop_name: str) -> Dict:
        """
        Check if time series is stationary using Augmented Dickey-Fuller test
        """
        result = adfuller(ts_data.dropna())
        
        stationarity_info = {
            'adf_statistic': result[0],
            'p_value': result[1],
            'critical_values': result[4],
            'is_stationary': result[1] <= 0.05
        }
        
        print(f"📊 {crop_name} - ADF Statistic: {result[0]:.4f}, p-value: {result[1]:.4f}")
        if result[1] <= 0.05:
            print(f"✅ {crop_name} is stationary")
        else:
            print(f"⚠️ {crop_name} is not stationary - will apply differencing")
            
        return stationarity_info
    
    def make_stationary(self, ts_data: pd.Series) -> Tuple[pd.Series, int]:
        """
        Make time series stationary by differencing
        """
        original_data = ts_data.copy()
        differencing_order = 0
        
        # Apply differencing until stationary (max 2 differences)
        while differencing_order < 2:
            result = adfuller(ts_data.dropna())
            if result[1] <= 0.05:
                break
            ts_data = ts_data.diff().dropna()
            differencing_order += 1
            
        return ts_data, differencing_order
    
    def find_best_parameters(self, ts_data: pd.Series, crop_name: str) -> Dict:
        """
        Find optimal ARIMA parameters using grid search with AIC
        Since we have annual data, we'll use ARIMA instead of SARIMA
        """
        print(f"🔍 Finding optimal ARIMA parameters for {crop_name}...")
        
        # Parameter ranges for grid search (simple ARIMA)
        p_values = range(0, 4)  # AR order
        d_values = range(0, 2)  # Differencing order
        q_values = range(0, 4)  # MA order
        
        best_aic = np.inf
        best_params = None
        results = []
        
        total_combinations = len(p_values) * len(d_values) * len(q_values)
        print(f"📊 Testing {total_combinations} parameter combinations...")
        
        for p, d, q in itertools.product(p_values, d_values, q_values):
            try:
                # Fit ARIMA model (no seasonal component)
                model = ARIMA(
                    ts_data.dropna(),
                    order=(p, d, q),
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                
                fitted_model = model.fit(method_kwargs={"warn_convergence": False})
                aic = fitted_model.aic
                
                results.append({
                    'params': (p, d, q),
                    'aic': aic,
                    'bic': fitted_model.bic
                })
                
                if aic < best_aic:
                    best_aic = aic
                    best_params = {
                        'order': (p, d, q),
                        'aic': aic,
                        'bic': fitted_model.bic
                    }
                    
            except Exception as e:
                continue
        
        if best_params:
            print(f"✅ Best parameters for {crop_name}:")
            print(f"   Order: {best_params['order']}")
            print(f"   AIC: {best_params['aic']:.2f}")
        else:
            print(f"❌ Could not find optimal parameters for {crop_name}")
            # Use default parameters
            best_params = {
                'order': (1, 1, 1),
                'aic': np.inf,
                'bic': np.inf
            }
            
        return best_params
    
    def train_arima_model(self, crop_name: str) -> bool:
        """
        Train ARIMA model for a specific crop
        """
        print(f"\n🌾 Training ARIMA model for {crop_name}...")
        
        try:
            ts_data = self.processed_data[crop_name]
            
            # Check stationarity
            stationarity_info = self.check_stationarity(ts_data, crop_name)
            
            # Find optimal parameters
            best_params = self.find_best_parameters(ts_data, crop_name)
            self.best_parameters[crop_name] = best_params
            
            # Train final model with best parameters
            model = ARIMA(
                ts_data.dropna(),
                order=best_params['order'],
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            
            fitted_model = model.fit(method_kwargs={"warn_convergence": False})
            self.trained_models[crop_name] = fitted_model
            
            # Model diagnostics
            residuals = fitted_model.resid
            
            # Calculate performance metrics (in-sample)
            predictions = fitted_model.fittedvalues
            actual = ts_data.dropna()
            
            # Align predictions with actual values
            aligned_actual = actual[predictions.index]
            
            mae = mean_absolute_error(aligned_actual, predictions)
            rmse = np.sqrt(mean_squared_error(aligned_actual, predictions))
            mape = np.mean(np.abs((aligned_actual - predictions) / aligned_actual)) * 100
            
            self.model_performance[crop_name] = {
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'aic': fitted_model.aic,
                'bic': fitted_model.bic,
                'residual_std': np.std(residuals)
            }
            
            print(f"✅ Model trained successfully!")
            print(f"   MAE: {mae:.2f}")
            print(f"   RMSE: {rmse:.2f}")
            print(f"   MAPE: {mape:.2f}%")
            
            # Save model
            model_path = os.path.join(self.models_dir, f'{crop_name}_arima_model.pkl')
            with open(model_path, 'wb') as f:
                pickle.dump(fitted_model, f)
            
            # Generate plots
            self.create_diagnostic_plots(crop_name, ts_data, fitted_model)
            
            return True
            
        except Exception as e:
            print(f"❌ Error training model for {crop_name}: {e}")
            return False
    
    def create_diagnostic_plots(self, crop_name: str, ts_data: pd.Series, fitted_model):
        """
        Create diagnostic plots for model evaluation
        """
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle(f'SARIMA Model Diagnostics - {crop_name}', fontsize=16)
        
        # 1. Actual vs Fitted
        axes[0, 0].plot(ts_data.index, ts_data.values, label='Actual', marker='o')
        axes[0, 0].plot(ts_data.index, fitted_model.fittedvalues, label='Fitted', marker='s')
        axes[0, 0].set_title('Actual vs Fitted Values')
        axes[0, 0].set_xlabel('Year')
        axes[0, 0].set_ylabel('Yield (Tons/Ha)')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Residuals
        residuals = fitted_model.resid
        axes[0, 1].plot(residuals.index, residuals.values, marker='o')
        axes[0, 1].axhline(y=0, color='r', linestyle='--')
        axes[0, 1].set_title('Residuals')
        axes[0, 1].set_xlabel('Year')
        axes[0, 1].set_ylabel('Residual')
        axes[0, 1].grid(True, alpha=0.3)
        
        # 3. ACF of residuals
        plot_acf(residuals.dropna(), ax=axes[1, 0], lags=10)
        axes[1, 0].set_title('ACF of Residuals')
        
        # 4. QQ plot of residuals
        from scipy import stats
        stats.probplot(residuals.dropna(), dist="norm", plot=axes[1, 1])
        axes[1, 1].set_title('Q-Q Plot of Residuals')
        
        plt.tight_layout()
        plot_path = os.path.join(self.plots_dir, f'{crop_name}_diagnostics.png')
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
    
    def predict_future_yield(self, crop_name: str, years_ahead: int = 3) -> Dict:
        """
        Predict future yield for a specific crop
        """
        if crop_name not in self.trained_models:
            print(f"❌ No trained model found for {crop_name}")
            return {}
        
        try:
            model = self.trained_models[crop_name]
            
            # Generate forecast
            forecast = model.forecast(steps=years_ahead)
            conf_int = model.get_forecast(steps=years_ahead).conf_int()
            
            # Get the last date from training data
            last_date = self.processed_data[crop_name].index[-1]
            future_dates = pd.date_range(
                start=last_date + pd.DateOffset(years=1),
                periods=years_ahead,
                freq='YS'
            )
            
            predictions = {
                'crop_name': crop_name,
                'forecast_values': forecast.tolist(),
                'confidence_intervals': {
                    'lower': conf_int.iloc[:, 0].tolist(),
                    'upper': conf_int.iloc[:, 1].tolist()
                },
                'forecast_dates': [str(date.year) for date in future_dates],
                'model_performance': self.model_performance.get(crop_name, {})
            }
            
            print(f"🔮 Future yield predictions for {crop_name}:")
            for i, (date, value, lower, upper) in enumerate(zip(
                predictions['forecast_dates'],
                predictions['forecast_values'],
                predictions['confidence_intervals']['lower'],
                predictions['confidence_intervals']['upper']
            )):
                print(f"   {date}: {value:.2f} tons/ha (CI: {lower:.2f} - {upper:.2f})")
            
            return predictions
            
        except Exception as e:
            print(f"❌ Error predicting future yield for {crop_name}: {e}")
            return {}
    
    def train_all_models(self):
        """
        Train ARIMA models for all processed crops
        """
        print(f"\n🚀 Starting ARIMA training for {len(self.processed_data)} crops...")
        
        successful_trainings = 0
        failed_trainings = 0
        
        for crop_name in self.processed_data.keys():
            print(f"\n{'='*50}")
            success = self.train_arima_model(crop_name)
            
            if success:
                successful_trainings += 1
            else:
                failed_trainings += 1
        
        print(f"\n🎯 Training Summary:")
        print(f"   ✅ Successful: {successful_trainings}")
        print(f"   ❌ Failed: {failed_trainings}")
        
        total_trainings = successful_trainings + failed_trainings
        if total_trainings > 0:
            print(f"   📊 Success Rate: {(successful_trainings/total_trainings*100):.1f}%")
        else:
            print(f"   📊 No models were trained")
        
        # Save summary results
        summary = {
            'training_date': datetime.now().isoformat(),
            'total_crops': len(self.processed_data),
            'successful_trainings': successful_trainings,
            'failed_trainings': failed_trainings,
            'trained_models': list(self.trained_models.keys()),
            'model_performance': self.model_performance,
            'best_parameters': self.best_parameters
        }
        
        summary_path = os.path.join(self.results_dir, 'training_summary.json')
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"📁 Results saved to: {summary_path}")
    
    def generate_all_predictions(self, years_ahead: int = 3):
        """
        Generate predictions for all trained models
        """
        print(f"\n🔮 Generating {years_ahead}-year predictions for all models...")
        
        all_predictions = {}
        for crop_name in self.trained_models.keys():
            predictions = self.predict_future_yield(crop_name, years_ahead)
            if predictions:
                all_predictions[crop_name] = predictions
        
        # Save all predictions
        predictions_path = os.path.join(self.results_dir, f'all_predictions_{years_ahead}years.json')
        with open(predictions_path, 'w') as f:
            json.dump(all_predictions, f, indent=2)
        
        print(f"📁 All predictions saved to: {predictions_path}")
        return all_predictions
    
    def create_summary_report(self):
        """
        Create a comprehensive summary report
        """
        print("\n📋 Creating summary report...")
        
        report = []
        report.append("# SARIMA Yield Prediction Models - Training Report")
        report.append(f"\nGenerated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"\nTotal crops processed: {len(self.processed_data)}")
        report.append(f"Successfully trained models: {len(self.trained_models)}")
        
        report.append("\n## Model Performance Summary")
        report.append("| Crop Name | MAE | RMSE | MAPE (%) | AIC |")
        report.append("|-----------|-----|------|----------|-----|")
        
        for crop_name, performance in self.model_performance.items():
            report.append(f"| {crop_name} | {performance['mae']:.2f} | {performance['rmse']:.2f} | {performance['mape']:.2f} | {performance['aic']:.2f} |")
        
        report.append("\n## Best Parameters")
        for crop_name, params in self.best_parameters.items():
            report.append(f"\n### {crop_name}")
            report.append(f"- Order: {params['order']}")
            report.append(f"- AIC: {params['aic']:.2f}")
        
        # Save report
        report_path = os.path.join(self.results_dir, 'training_report.md')
        with open(report_path, 'w') as f:
            f.write('\n'.join(report))
        
        print(f"📁 Report saved to: {report_path}")


def main():
    """
    Main function to run ARIMA training pipeline
    """
    print("🌾 ARIMA Yield Prediction Model Trainer")
    print("=" * 50)
    
    # Initialize trainer (will use default data file path)
    trainer = SARIMAYieldTrainer()
    
    # Load and process data
    if not trainer.load_and_process_data():
        print("❌ Failed to load data. Please check your Excel file.")
        return
    
    # Train all models
    trainer.train_all_models()
    
    # Generate predictions for different time horizons
    trainer.generate_all_predictions(years_ahead=3)   # Short-term
    trainer.generate_all_predictions(years_ahead=5)   # Medium-term  
    trainer.generate_all_predictions(years_ahead=10)  # Long-term strategic planning
    
    # Create summary report
    trainer.create_summary_report()
    
    print("\n🎉 ARIMA training pipeline completed successfully!")
    print("\nGenerated files:")
    print(f"📁 {trainer.models_dir} - Trained model files")
    print(f"📁 {trainer.results_dir} - Training results and predictions")
    print(f"📁 {trainer.plots_dir} - Diagnostic plots")


if __name__ == "__main__":
    main()