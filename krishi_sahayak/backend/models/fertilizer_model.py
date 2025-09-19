import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

class FertilizerRecommendationSystem:
    def __init__(self, csv_path=None):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.label_encoder = LabelEncoder()
        self.fertilizer_effects = self.load_fertilizer_effects()
        self.crop_encoder = LabelEncoder()
        
        # Load crop requirements from CSV if provided
        if csv_path:
            self.crop_stats = self.load_crop_requirements_from_csv(csv_path)
        else:
            self.crop_stats = {}
        
    def load_fertilizer_effects(self):
        """Load fertilizer effects lookup table"""
        effects = {
            'Urea (46-0-0)': {'ph_change': -0.3, 'N_change': 46, 'P_change': 0, 'K_change': 0},
            'Ammonium Nitrate (34-0-0)': {'ph_change': -0.2, 'N_change': 34, 'P_change': 0, 'K_change': 0},
            'Ammonium Sulfate (21-0-0)': {'ph_change': -0.4, 'N_change': 21, 'P_change': 0, 'K_change': 0},
            'DAP (18-46-0)': {'ph_change': -0.3, 'N_change': 18, 'P_change': 46, 'K_change': 0},
            'MAP (11-52-0)': {'ph_change': -0.3, 'N_change': 11, 'P_change': 52, 'K_change': 0},
            'NPK 10-26-26': {'ph_change': -0.2, 'N_change': 10, 'P_change': 26, 'K_change': 26},
            'NPK 20-20-20': {'ph_change': -0.2, 'N_change': 20, 'P_change': 20, 'K_change': 20},
            'Potassium Chloride (0-0-60)': {'ph_change': 0, 'N_change': 0, 'P_change': 0, 'K_change': 60},
            'Potassium Sulfate (0-0-50)': {'ph_change': 0, 'N_change': 0, 'P_change': 0, 'K_change': 50},
            'Calcium Nitrate (15.5-0-0)': {'ph_change': 0.2, 'N_change': 15.5, 'P_change': 0, 'K_change': 0},
            'Elemental Sulfur': {'ph_change': -0.5, 'N_change': 0, 'P_change': 0, 'K_change': 0},
            'Compost (organic)': {'ph_change': 0.1, 'N_change': 5, 'P_change': 3, 'K_change': 8},
            'Farmyard Manure (organic)': {'ph_change': 0.1, 'N_change': 3, 'P_change': 2, 'K_change': 5},
            'Limestone (CaCO3)': {'ph_change': 0.8, 'N_change': 0, 'P_change': 0, 'K_change': 0},
            'Dolomitic Lime': {'ph_change': 1.0, 'N_change': 0, 'P_change': 0, 'K_change': 0}
        }
        return effects
    
    def create_training_data(self, crop_data):
        """
        Create training data using each row as a training sample
        Each row represents a successful soil-crop combination
        """
        training_data = []
        
        for idx, row in crop_data.iterrows():
            # Current successful soil state
            current_N = row['N']
            current_P = row['P'] 
            current_K = row['K']
            current_ph = row['ph']
            crop = row['label']
            
            # This is a SUCCESSFUL combination, so we need to determine
            # what fertilizer would be recommended for suboptimal conditions
            
            # Create variations of this successful state by reducing nutrients
            # to simulate different soil conditions that need fertilization
            variations = self.create_soil_variations(current_N, current_P, current_K, current_ph, crop)
            
            for variation in variations:
                training_data.append(variation)
        
        return pd.DataFrame(training_data)
    
    def create_soil_variations(self, success_N, success_P, success_K, success_ph, crop):
        """
        Create training variations based on a successful soil-crop combination
        """
        variations = []
        
        # Create scenarios where soil needs improvement to reach successful levels
        scenarios = [
            # Low N scenario
            {'N': success_N - 20, 'P': success_P, 'K': success_K, 'ph': success_ph},
            # Low P scenario  
            {'N': success_N, 'P': success_P - 15, 'K': success_K, 'ph': success_ph},
            # Low K scenario
            {'N': success_N, 'P': success_P, 'K': success_K - 15, 'ph': success_ph},
            # Low pH scenario
            {'N': success_N, 'P': success_P, 'K': success_K, 'ph': success_ph - 0.5},
            # High pH scenario
            {'N': success_N, 'P': success_P, 'K': success_K, 'ph': success_ph + 0.5},
            # Multiple deficiencies
            {'N': success_N - 15, 'P': success_P - 10, 'K': success_K - 10, 'ph': success_ph},
            # Balanced scenario (close to successful)
            {'N': success_N - 5, 'P': success_P - 5, 'K': success_K - 5, 'ph': success_ph}
        ]
        
        for scenario in scenarios:
            # Ensure values stay within reasonable bounds
            scenario['N'] = max(10, min(100, scenario['N']))
            scenario['P'] = max(5, min(80, scenario['P']))
            scenario['K'] = max(10, min(80, scenario['K']))
            scenario['ph'] = max(4.0, min(9.0, scenario['ph']))
            
            # Calculate what fertilizer is needed to reach successful levels
            N_deficit = max(0, success_N - scenario['N'])
            P_deficit = max(0, success_P - scenario['P'])
            K_deficit = max(0, success_K - scenario['K'])
            ph_adjustment = success_ph - scenario['ph']
            
            best_fertilizer = self.select_optimal_fertilizer(
                N_deficit, P_deficit, K_deficit, ph_adjustment
            )
            
            variations.append({
                'N': scenario['N'],
                'P': scenario['P'],
                'K': scenario['K'],
                'ph': scenario['ph'],
                'crop': crop,
                'fertilizer': best_fertilizer,
                'target_N': success_N,
                'target_P': success_P,
                'target_K': success_K,
                'target_ph': success_ph
            })
        
        return variations
    
    def load_crop_requirements_from_csv(self, csv_path):
        """Load actual crop requirements from your fertilizer_crop.csv"""
        crop_data = pd.read_csv(csv_path)
        
        # Calculate statistical ranges for each crop
        crop_stats = {}
        for crop in crop_data['label'].unique():
            crop_rows = crop_data[crop_data['label'] == crop]
            
            crop_stats[crop] = {
                'N_min': crop_rows['N'].quantile(0.25),  # 25th percentile as minimum
                'N_max': crop_rows['N'].quantile(0.75),  # 75th percentile as maximum
                'P_min': crop_rows['P'].quantile(0.25),
                'P_max': crop_rows['P'].quantile(0.75),
                'K_min': crop_rows['K'].quantile(0.25),
                'K_max': crop_rows['K'].quantile(0.75),
                'ph_min': crop_rows['ph'].quantile(0.25),
                'ph_max': crop_rows['ph'].quantile(0.75),
                'ph_optimal': crop_rows['ph'].median(),
                # Also store the actual successful combinations
                'successful_combinations': crop_rows[['N', 'P', 'K', 'ph']].values.tolist()
            }
        
        return crop_stats
    
    def get_crop_requirements(self, crop):
        """Get requirements for a specific crop"""
        return self.crop_stats.get(crop, {
            'N_min': 75, 'N_max': 95, 'P_min': 40, 'P_max': 60, 
            'K_min': 40, 'K_max': 60, 'ph_optimal': 6.5
        })
    
    def select_optimal_fertilizer(self, N_deficit, P_deficit, K_deficit, ph_adjustment):
        """Logic to select best fertilizer based on deficiencies"""
        
        # High N deficit
        if N_deficit > 20:
            if P_deficit > 15:
                return 'DAP (18-46-0)'  # High N + P
            elif ph_adjustment > 0.5:
                return 'Calcium Nitrate (15.5-0-0)'  # N + pH increase
            else:
                return 'Urea (46-0-0)'  # High N
        
        # High P deficit
        elif P_deficit > 20:
            return 'MAP (11-52-0)'  # Very high P
        
        # High K deficit
        elif K_deficit > 25:
            return 'Potassium Sulfate (0-0-50)'  # High K
        
        # Balanced NPK deficit
        elif N_deficit > 10 and P_deficit > 10 and K_deficit > 10:
            return 'NPK 20-20-20'  # Balanced
        
        # pH adjustment needed
        elif abs(ph_adjustment) > 0.5:
            if ph_adjustment > 0:
                return 'Limestone (CaCO3)'  # Increase pH
            else:
                return 'Elemental Sulfur'  # Decrease pH
        
        # Default balanced fertilizer
        else:
            return 'NPK 10-26-26'
    
    def train_model(self, crop_data):
        """Train the fertilizer recommendation model"""
        # Create training data
        training_data = self.create_training_data(crop_data)
        
        # Prepare features
        X = training_data[['N', 'P', 'K', 'ph', 'crop']]
        y = training_data['fertilizer']
        
        # Encode categorical variables
        X_encoded = X.copy()
        X_encoded['crop'] = self.crop_encoder.fit_transform(X['crop'])
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y_encoded, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model Accuracy: {accuracy:.2f}")
        
        return self.model
    
    def recommend_fertilizer(self, N, P, K, ph, crop):      # Main callabale function
        """Recommend fertilizer for given soil and crop"""
        # Prepare input
        input_data = np.array([[N, P, K, ph, self.crop_encoder.transform([crop])[0]]])
        
        # Predict
        prediction = self.model.predict(input_data)[0]
        fertilizer = self.label_encoder.inverse_transform([prediction])[0]
        
        # Calculate dosage (simple logic, can be improved)
        dosage = self.calculate_dosage(N, P, K, ph, crop, fertilizer)
        
        return fertilizer, dosage
    
    def calculate_dosage(self, N, P, K, ph, crop, fertilizer):
        """Calculate fertilizer dosage based on deficiency"""
        optimal = self.get_crop_requirements(crop)
        
        # Calculate total deficit
        N_deficit = max(0, optimal['N_min'] - N)
        P_deficit = max(0, optimal['P_min'] - P)
        K_deficit = max(0, optimal['K_min'] - K)
        
        # Get fertilizer nutrient content
        effects = self.fertilizer_effects[fertilizer]
        
        # Calculate required dosage (kg/hectare)
        if effects['N_change'] > 0:
            dosage = (N_deficit / effects['N_change']) * 100
        elif effects['P_change'] > 0:
            dosage = (P_deficit / effects['P_change']) * 100
        elif effects['K_change'] > 0:
            dosage = (K_deficit / effects['K_change']) * 100
        else:
            dosage = 50  # Default for pH adjusters
        
        # Cap dosage between reasonable limits
        return max(10, min(200, dosage))
    
    def update_soil_parameters(self, current_soil, fertilizer, dosage):
        """Update soil parameters after fertilizer application"""
        updated_soil = current_soil.copy()
        effects = self.fertilizer_effects[fertilizer]
        
        # Apply percentage-based changes
        dosage_factor = dosage / 100  # Normalize dosage
        
        updated_soil['N'] = min(100, current_soil['N'] + (effects['N_change'] * dosage_factor * 0.1))
        updated_soil['P'] = min(100, current_soil['P'] + (effects['P_change'] * dosage_factor * 0.1))
        updated_soil['K'] = min(100, current_soil['K'] + (effects['K_change'] * dosage_factor * 0.1))
        updated_soil['ph'] = max(4.0, min(9.0, current_soil['ph'] + effects['ph_change'] * dosage_factor * 0.3))
        
        return updated_soil
    
    def save_model(self, filepath):
        """Save the trained model"""
        joblib.dump({
            'model': self.model,
            'crop_encoder': self.crop_encoder,
            'label_encoder': self.label_encoder
        }, filepath)
    
    def load_model(self, filepath):
        """Load a trained model"""
        loaded = joblib.load(filepath)
        self.model = loaded['model']
        self.crop_encoder = loaded['crop_encoder'] 
        self.label_encoder = loaded['label_encoder']

# Usage example
if __name__ == "__main__":
    # Initialize system with your CSV data
    fertilizer_system = FertilizerRecommendationSystem('D:/Work/Coding/SIH 2025/agricultural-ai-platform/data/ML/fertilizer_crop.csv')
    
    # Load your crop data  
    crop_data = pd.read_csv('D:/Work/Coding/SIH 2025/agricultural-ai-platform/data/ML/fertilizer_crop.csv')
    
    # Train model
    fertilizer_system.train_model(crop_data)
    
    # Make recommendation for suboptimal soil
    fertilizer, dosage = fertilizer_system.recommend_fertilizer(
        N=65, P=30, K=35, ph=5.8, crop='rice'  # Suboptimal conditions
    )
    print(f"Recommended: {fertilizer}, Dosage: {dosage:.1f} kg/hectare")
    
    # Update soil parameters
    current_soil = {'N': 65, 'P': 30, 'K': 35, 'ph': 5.8}
    updated_soil = fertilizer_system.update_soil_parameters(
        current_soil, fertilizer, dosage
    )
    print(f"Updated soil: {updated_soil}")
    
    # Show crop requirements learned from data
    rice_stats = fertilizer_system.crop_stats.get('rice', {})
    print(f"Rice requirements from data: {rice_stats}")