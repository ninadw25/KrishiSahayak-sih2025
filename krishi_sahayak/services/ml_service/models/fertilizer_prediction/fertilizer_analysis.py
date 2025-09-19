import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
from fertilizer_model import FertilizerRecommendationSystem

class FertilizerModelAnalyzer:
    def __init__(self, fertilizer_system, crop_data):
        self.fertilizer_system = fertilizer_system
        self.crop_data = crop_data
        self.training_data = None
        
    def comprehensive_analysis(self):
        """Run complete model analysis"""
        print("=== COMPREHENSIVE FERTILIZER MODEL ANALYSIS ===\n")
        
        # 1. Training Data Analysis
        self.analyze_training_data()
        
        # 2. Model Performance Analysis
        self.analyze_model_performance()
        
        # 3. Crop Requirements Analysis
        self.analyze_crop_requirements()
        
        # 4. Fertilizer Recommendation Patterns
        self.analyze_recommendation_patterns()
        
        # 5. Soil Update Validation
        self.analyze_soil_updates()
        
        # 6. Edge Case Testing
        self.test_edge_cases()
        
    def analyze_training_data(self):
        """Analyze the generated training data"""
        print("1. TRAINING DATA ANALYSIS")
        print("-" * 40)
        
        # Generate training data to analyze
        self.training_data = self.fertilizer_system.create_training_data(self.crop_data)
        
        print(f"Total training samples: {len(self.training_data)}")
        print(f"Number of crops: {self.training_data['crop'].nunique()}")
        print(f"Number of fertilizers: {self.training_data['fertilizer'].nunique()}")
        
        # Class distribution
        fertilizer_dist = self.training_data['fertilizer'].value_counts()
        print(f"\nFertilizer distribution:")
        for fertilizer, count in fertilizer_dist.head(10).items():
            print(f"  {fertilizer}: {count} samples ({count/len(self.training_data)*100:.1f}%)")
        
        # Crop distribution
        crop_dist = self.training_data['crop'].value_counts()
        print(f"\nTop 10 crops by training samples:")
        for crop, count in crop_dist.head(10).items():
            print(f"  {crop}: {count} samples")
        
        print()
        
    def analyze_model_performance(self):
        """Detailed model performance analysis"""
        print("2. MODEL PERFORMANCE ANALYSIS")
        print("-" * 40)
        
        if self.training_data is None:
            self.training_data = self.fertilizer_system.create_training_data(self.crop_data)
        
        # Prepare data
        X = self.training_data[['N', 'P', 'K', 'ph', 'crop']].copy()
        X['crop'] = self.fertilizer_system.crop_encoder.transform(X['crop'])
        y = self.fertilizer_system.label_encoder.transform(self.training_data['fertilizer'])
        
        # Cross-validation scores
        cv_scores = cross_val_score(
            self.fertilizer_system.model, X, y, 
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
            scoring='accuracy'
        )
        
        print(f"Cross-validation scores: {cv_scores}")
        print(f"Mean CV accuracy: {cv_scores.mean():.3f} ± {cv_scores.std()*2:.3f}")
        print(f"Training accuracy: 0.98 (from your output)")
        
        # Check for overfitting
        if cv_scores.mean() < 0.95:
            print("⚠️  Potential overfitting detected (CV < training accuracy)")
        else:
            print("✅ Good generalization (CV ≈ training accuracy)")
        
        # Feature importance
        feature_names = ['N', 'P', 'K', 'pH', 'Crop']
        importances = self.fertilizer_system.model.feature_importances_
        
        print(f"\nFeature Importance:")
        for name, importance in zip(feature_names, importances):
            print(f"  {name}: {importance:.3f}")
        
        print()
        
    def analyze_crop_requirements(self):
        """Analyze learned crop requirements"""
        print("3. CROP REQUIREMENTS ANALYSIS")
        print("-" * 40)
        
        # Sample key crops
        key_crops = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane']
        
        for crop in key_crops:
            if crop in self.fertilizer_system.crop_stats:
                stats = self.fertilizer_system.crop_stats[crop]
                print(f"{crop.upper()}:")
                print(f"  N range: {stats['N_min']:.1f} - {stats['N_max']:.1f}")
                print(f"  P range: {stats['P_min']:.1f} - {stats['P_max']:.1f}")
                print(f"  K range: {stats['K_min']:.1f} - {stats['K_max']:.1f}")
                print(f"  pH range: {stats['ph_min']:.2f} - {stats['ph_max']:.2f} (optimal: {stats['ph_optimal']:.2f})")
                print(f"  Successful samples: {len(stats['successful_combinations'])}")
                print()
        
    def analyze_recommendation_patterns(self):
        """Analyze fertilizer recommendation patterns"""
        print("4. FERTILIZER RECOMMENDATION PATTERNS")
        print("-" * 40)
        
        # Test various soil conditions
        test_scenarios = [
            {'name': 'Low N', 'N': 40, 'P': 50, 'K': 45, 'ph': 6.5},
            {'name': 'Low P', 'N': 80, 'P': 20, 'K': 45, 'ph': 6.5},
            {'name': 'Low K', 'N': 80, 'P': 50, 'K': 20, 'ph': 6.5},
            {'name': 'Acidic soil', 'N': 70, 'P': 40, 'K': 40, 'ph': 4.5},
            {'name': 'Alkaline soil', 'N': 70, 'P': 40, 'K': 40, 'ph': 8.5},
            {'name': 'Balanced good', 'N': 85, 'P': 50, 'K': 45, 'ph': 6.5},
            {'name': 'All deficient', 'N': 30, 'P': 15, 'K': 20, 'ph': 5.0}
        ]
        
        test_crops = ['rice', 'wheat', 'maize']
        
        recommendations = {}
        for scenario in test_scenarios:
            recommendations[scenario['name']] = {}
            for crop in test_crops:
                try:
                    fertilizer, dosage = self.fertilizer_system.recommend_fertilizer(
                        scenario['N'], scenario['P'], scenario['K'], scenario['ph'], crop
                    )
                    recommendations[scenario['name']][crop] = {'fertilizer': fertilizer, 'dosage': dosage}
                except Exception as e:
                    recommendations[scenario['name']][crop] = {'error': str(e)}
        
        # Display patterns
        for scenario_name, crops in recommendations.items():
            print(f"{scenario_name}:")
            for crop, rec in crops.items():
                if 'error' in rec:
                    print(f"  {crop}: ERROR - {rec['error']}")
                else:
                    print(f"  {crop}: {rec['fertilizer']} ({rec['dosage']:.1f} kg/ha)")
            print()
    
    def analyze_soil_updates(self):
        """Analyze soil parameter updates"""
        print("5. SOIL UPDATE ANALYSIS")
        print("-" * 40)
        
        test_soil = {'N': 60, 'P': 30, 'K': 35, 'ph': 5.8}
        
        # Test different fertilizers
        fertilizers_to_test = [
            ('Urea (46-0-0)', 50),
            ('DAP (18-46-0)', 60),
            ('NPK 20-20-20', 40),
            ('Limestone (CaCO3)', 100)
        ]
        
        print("Soil update effects (starting: N=60, P=30, K=35, pH=5.8):")
        for fertilizer, dosage in fertilizers_to_test:
            updated = self.fertilizer_system.update_soil_parameters(
                test_soil, fertilizer, dosage
            )
            changes = {
                'N': updated['N'] - test_soil['N'],
                'P': updated['P'] - test_soil['P'],
                'K': updated['K'] - test_soil['K'],
                'ph': updated['ph'] - test_soil['ph']
            }
            print(f"  {fertilizer} ({dosage} kg/ha):")
            print(f"    Changes: N{changes['N']:+.1f}, P{changes['P']:+.1f}, K{changes['K']:+.1f}, pH{changes['ph']:+.2f}")
            print(f"    Result: N={updated['N']:.1f}, P={updated['P']:.1f}, K={updated['K']:.1f}, pH={updated['ph']:.2f}")
            print()
    
    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        print("6. EDGE CASE TESTING")
        print("-" * 40)
        
        edge_cases = [
            {'name': 'Extremely low nutrients', 'N': 5, 'P': 3, 'K': 2, 'ph': 4.0},
            {'name': 'Extremely high nutrients', 'N': 95, 'P': 80, 'K': 75, 'ph': 8.0},
            {'name': 'Very acidic', 'N': 70, 'P': 40, 'K': 40, 'ph': 3.5},
            {'name': 'Very alkaline', 'N': 70, 'P': 40, 'K': 40, 'ph': 9.5}
        ]
        
        for case in edge_cases:
            print(f"{case['name']}:")
            try:
                fertilizer, dosage = self.fertilizer_system.recommend_fertilizer(
                    case['N'], case['P'], case['K'], case['ph'], 'rice'
                )
                updated = self.fertilizer_system.update_soil_parameters(
                    case, fertilizer, dosage
                )
                print(f"  Recommendation: {fertilizer} ({dosage:.1f} kg/ha)")
                print(f"  Updated pH: {case['ph']:.2f} → {updated['ph']:.2f}")
                
                # Check if updated values are within reasonable bounds
                issues = []
                if updated['N'] > 100: issues.append("N > 100")
                if updated['P'] > 100: issues.append("P > 100") 
                if updated['K'] > 100: issues.append("K > 100")
                if updated['ph'] < 3.0 or updated['ph'] > 10.0: issues.append("pH out of range")
                
                if issues:
                    print(f"  ⚠️  Issues: {', '.join(issues)}")
                else:
                    print(f"  ✅ Values within reasonable bounds")
                    
            except Exception as e:
                print(f"  ❌ Error: {e}")
            print()
    
    def suggest_improvements(self):
        """Suggest model improvements"""
        print("7. SUGGESTED IMPROVEMENTS")
        print("-" * 40)
        
        improvements = [
            "1. Fix feature name warning by using DataFrame input",
            "2. Increase soil update magnitude (current changes too small)",
            "3. Add seasonal/temporal effects to soil degradation",
            "4. Include soil texture in fertilizer efficiency calculations", 
            "5. Add cost optimization to fertilizer selection",
            "6. Implement dosage optimization based on crop yield targets",
            "7. Add validation with real field trial data",
            "8. Include micronutrient recommendations",
            "9. Add fertilizer timing recommendations (when to apply)",
            "10. Implement crop rotation effects on soil health"
        ]
        
        for improvement in improvements:
            print(f"  {improvement}")
        
        print("\nPriority improvements:")
        print("  • Fix DataFrame input format (immediate)")
        print("  • Calibrate soil update magnitudes (high)")
        print("  • Add cost consideration (medium)")

# Usage
def run_comprehensive_analysis(fertilizer_system, crop_data):
    analyzer = FertilizerModelAnalyzer(fertilizer_system, crop_data)
    analyzer.comprehensive_analysis()
    analyzer.suggest_improvements()
    return analyzer

# Example usage:
crop_data = pd.read_csv('D:/Work/Coding/SIH 2025/agricultural-ai-platform/data/ML/fertilizer_crop.csv')
fertilizer_system = FertilizerRecommendationSystem('D:/Work/Coding/SIH 2025/agricultural-ai-platform/data/ML/fertilizer_crop.csv')
fertilizer_system.train_model(crop_data)
analyzer = run_comprehensive_analysis(fertilizer_system, crop_data)
print (analyzer)