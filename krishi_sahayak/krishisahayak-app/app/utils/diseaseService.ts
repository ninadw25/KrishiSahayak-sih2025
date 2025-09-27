import { llmService } from './llmService';

export interface DiseaseData {
  id: string;
  name: string;
  image: any; // React Native ImageSourcePropType
  description: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
  crop: string;
  localImagePath: string;
}

export interface Crop {
  name: string;
  diseases: DiseaseData[];
}

export interface DiseaseInsights {
  description: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
}

class DiseaseService {
  private static instance: DiseaseService;
  private diseaseData: DiseaseData[] = [];
  private isLoaded = false;

  static getInstance(): DiseaseService {
    if (!DiseaseService.instance) {
      DiseaseService.instance = new DiseaseService();
    }
    return DiseaseService.instance;
  }

  async loadDiseaseData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('Loading disease data from CSV...');
      
      // In a real app, you would load this from a file or API
      // For now, we'll use the data from the CSV structure
      const csvData = [
        {
          crop: 'Rice',
          diseaseName: 'Bacterial Leaf Blight',
          localImagePath: './disease_images/rice/bacterial_leaf_blight.jpg',
          solution1: 'Copper oxychloride spray',
          solution2: 'Optimize field drainage',
          solution3: 'Apply Streptocycline'
        },
        {
          crop: 'Rice',
          diseaseName: 'Blast Disease',
          localImagePath: './disease_images/rice/blast_disease.jpg',
          solution1: 'Tricyclazole foliar spray',
          solution2: 'Maintain proper irrigation',
          solution3: 'Remove diseased leaves'
        },
        {
          crop: 'Rice',
          diseaseName: 'Brown Spot',
          localImagePath: './disease_images/rice/brown_spot.jpg',
          solution1: 'Mancozeb spray',
          solution2: 'Balanced potassium fertilization',
          solution3: 'Rotate crop'
        },
        {
          crop: 'Rice',
          diseaseName: 'Sheath Blight',
          localImagePath: './disease_images/rice/sheath_blight.jpg',
          solution1: 'Validamycin spray',
          solution2: 'Improve drainage',
          solution3: 'Use healthy seedlings'
        },
        {
          crop: 'Rice',
          diseaseName: 'False Smut',
          localImagePath: './disease_images/rice/false_smut.jpg',
          solution1: 'Propiconazole spray',
          solution2: 'Reduce nitrogen use',
          solution3: 'Remove smut balls'
        },
        {
          crop: 'Wheat',
          diseaseName: 'Leaf Rust (Brown Rust)',
          localImagePath: './disease_images/wheat/leaf_rust.jpg',
          solution1: 'Hexaconazole foliar spray',
          solution2: 'Remove infected leaves',
          solution3: 'Increase plant spacing'
        },
        {
          crop: 'Wheat',
          diseaseName: 'Yellow Rust (Stripe Rust)',
          localImagePath: './disease_images/wheat/yellow_rust.jpg',
          solution1: 'Triadimefon spray',
          solution2: 'Avoid sowing under cool wet',
          solution3: 'Remove lower leaves'
        },
        {
          crop: 'Wheat',
          diseaseName: 'Karnal Bunt',
          localImagePath: './disease_images/wheat/karnal_bunt.jpg',
          solution1: 'Tebuconazole spray',
          solution2: 'Sanitize equipment',
          solution3: 'Deep plough post-harvest'
        },
        {
          crop: 'Wheat',
          diseaseName: 'Loose Smut',
          localImagePath: './disease_images/wheat/loose_smut.jpg',
          solution1: 'Hot water seed treatment',
          solution2: 'Seed dressing fungicide',
          solution3: 'Burn infected seedheads'
        },
        {
          crop: 'Wheat',
          diseaseName: 'Powdery Mildew',
          localImagePath: './disease_images/wheat/powdery_mildew.jpg',
          solution1: 'Sulfur spray',
          solution2: 'Improve air flow',
          solution3: 'Avoid overhead irrigation'
        },
        {
          crop: 'Sugarcane',
          diseaseName: 'Red Rot',
          localImagePath: './disease_images/sugarcane/red_rot.jpg',
          solution1: 'Carbendazim drench',
          solution2: 'Harvest residue burning',
          solution3: 'Field sanitation'
        },
        {
          crop: 'Sugarcane',
          diseaseName: 'Wilt',
          localImagePath: './disease_images/sugarcane/wilt.jpg',
          solution1: 'Fentin hydroxide soil drench',
          solution2: 'Field leveling for drainage',
          solution3: 'Remove wilted stalks'
        },
        {
          crop: 'Sugarcane',
          diseaseName: 'Smut',
          localImagePath: './disease_images/sugarcane/smut.jpg',
          solution1: 'Systemic fungicide at planting',
          solution2: 'Destroy smut whips',
          solution3: 'Sterilize planting tools'
        },
        {
          crop: 'Sugarcane',
          diseaseName: 'Pokkah Boeng',
          localImagePath: './disease_images/sugarcane/pokkah_boeng.jpg',
          solution1: 'Carbendazim application',
          solution2: 'Use clean setts',
          solution3: 'Balanced NPK fertilizer'
        },
        {
          crop: 'Sugarcane',
          diseaseName: 'Yellow Leaf Disease',
          localImagePath: './disease_images/sugarcane/yellow_leaf_disease.jpg',
          solution1: 'Imidacloprid for aphids',
          solution2: 'Remove infected leaves',
          solution3: 'Use clean setts'
        },
        {
          crop: 'Corn',
          diseaseName: 'Banded Leaf and Sheath Blight',
          localImagePath: './disease_images/maize/banded_leaf_blight.jpg',
          solution1: 'Metalaxyl-mancozeb spray',
          solution2: 'Proper plant spacing',
          solution3: 'Sanitize seeds'
        },
        {
          crop: 'Corn',
          diseaseName: 'Turcicum Leaf Blight',
          localImagePath: './disease_images/maize/turcicum_leaf_blight.jpg',
          solution1: 'Azoxystrobin spray',
          solution2: 'Remove volunteer plants',
          solution3: 'Rotate maize'
        },
        {
          crop: 'Corn',
          diseaseName: 'Fusarium Stalk Rot',
          localImagePath: './disease_images/maize/fusarium_stalk_rot.jpg',
          solution1: 'Carbendazim drench',
          solution2: 'Crop rotation',
          solution3: 'Soil solarization'
        },
        {
          crop: 'Corn',
          diseaseName: 'Charcoal Rot',
          localImagePath: './disease_images/maize/charcoal_rot.jpg',
          solution1: 'Thiophanate-methyl spray',
          solution2: 'Maintain soil moisture',
          solution3: 'Avoid drought stress'
        },
        {
          crop: 'Corn',
          diseaseName: 'Pythium Stalk Rot',
          localImagePath: './disease_images/maize/pythium_stalk_rot.jpg',
          solution1: 'Metalaxyl seed treatment',
          solution2: 'Avoid waterlogging',
          solution3: 'Use healthy seed'
        }
      ];

      // Convert CSV data to DiseaseData format
      this.diseaseData = csvData.map((item, index) => ({
        id: `disease_${index + 1}`,
        name: item.diseaseName,
        image: this.getImagePath(item.localImagePath),
        description: '', // Will be filled by LLM
        symptoms: [], // Will be filled by LLM
        causes: [], // Will be filled by LLM
        solutions: [item.solution1, item.solution2, item.solution3].filter(Boolean),
        prevention: [], // Will be filled by LLM
        severity: 'medium' as const, // Will be determined by LLM
        crop: item.crop,
        localImagePath: item.localImagePath
      }));

      this.isLoaded = true;
      console.log(`Loaded ${this.diseaseData.length} diseases from CSV data`);
    } catch (error) {
      console.error('Error loading disease data:', error);
      throw error;
    }
  }

  private getImagePath(localPath: string): string {
    // Convert local path to require() format for React Native
    const imageName = localPath.split('/').pop()?.split('.')[0];
    if (!imageName) return '';

    // Map to actual image files
    const imageMap: { [key: string]: any } = {
      'bacterial_leaf_blight': require('../desease_detection/disease_images/Rice_Bacterial_blight.png'),
      'blast_disease': require('../desease_detection/disease_images/rice_blast.jpeg'),
      'brown_spot': require('../desease_detection/disease_images/rice_brown_spot.png'),
      'sheath_blight': require('../desease_detection/disease_images/rice_sheath_blight.jpeg'),
      'false_smut': require('../desease_detection/disease_images/rice_false_smut.jpg'),
      'leaf_rust': require('../desease_detection/disease_images/wheat_brown_rust.jpeg'),
      'yellow_rust': require('../desease_detection/disease_images/wheat_yellow_rust.jpg'),
      'karnal_bunt': require('../desease_detection/disease_images/wheat_karnal_bunt.jpg'),
      'loose_smut': require('../desease_detection/disease_images/wheat_loose_smut.jpeg'),
      'powdery_mildew': require('../desease_detection/disease_images/wheat_powdery_mildew.jpg'),
      'red_rot': require('../desease_detection/disease_images/sugarcane_red_rot.jpeg'),
      'wilt': require('../desease_detection/disease_images/sugarcane_wilt.png'),
      'smut': require('../desease_detection/disease_images/sugarcane_smut.jpeg'),
      'pokkah_boeng': require('../desease_detection/disease_images/sugarcane_pokkah_boeng.jpeg'),
      'yellow_leaf_disease': require('../desease_detection/disease_images/sugarcane_yellow_leaf.jpeg'),
      'banded_leaf_blight': require('../desease_detection/disease_images/maize_Banded_Leaf_and_Sheath_Blight.jpeg'),
      'turcicum_leaf_blight': require('../desease_detection/disease_images/maize_Turcicum_Leaf_Blight.jpeg'),
      'fusarium_stalk_rot': require('../desease_detection/disease_images/maize_Fusarium_Stalk_Rot.png'),
      'charcoal_rot': require('../desease_detection/disease_images/maize_Charcoal_Rot.png'),
      'pythium_stalk_rot': require('../desease_detection/disease_images/maize_Pythium_Stalk_Rot.jpeg')
    };

    return imageMap[imageName] || '';
  }

  async getDiseasesByCrop(cropName: string): Promise<DiseaseData[]> {
    await this.loadDiseaseData();
    
    const cropDiseases = this.diseaseData.filter(disease => 
      disease.crop.toLowerCase() === cropName.toLowerCase()
    );

    // Enhance each disease with LLM-generated insights
    const enhancedDiseases = await Promise.all(
      cropDiseases.map(async (disease) => {
        try {
          const insights = await this.generateDiseaseInsights(disease);
          return {
            ...disease,
            ...insights
          };
        } catch (error) {
          console.error(`Error enhancing disease ${disease.name}:`, error);
          return disease;
        }
      })
    );

    return enhancedDiseases;
  }

  async getAvailableCrops(): Promise<string[]> {
    await this.loadDiseaseData();
    
    const crops = [...new Set(this.diseaseData.map(disease => disease.crop))];
    return crops.sort();
  }

  private async generateDiseaseInsights(disease: DiseaseData): Promise<DiseaseInsights> {
    try {
      const prompt = `You are an expert agricultural plant pathologist. Provide detailed information about the plant disease "${disease.name}" affecting ${disease.crop}.

Please provide comprehensive information including:

1. DESCRIPTION: A detailed description of the disease, its characteristics, and how it affects the plant
2. SYMPTOMS: 4-6 specific symptoms that farmers can observe on their crops
3. CAUSES: 4-6 main causes and contributing factors for this disease
4. SOLUTIONS: 4-6 practical treatment solutions (include the existing solutions: ${disease.solutions.join(', ')})
5. PREVENTION: 4-6 preventive measures farmers can take
6. SEVERITY: Rate the severity as "low", "medium", or "high" based on potential crop damage

Format your response as JSON:
{
  "description": "Detailed description of the disease",
  "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3", "Symptom 4", "Symptom 5", "Symptom 6"],
  "causes": ["Cause 1", "Cause 2", "Cause 3", "Cause 4", "Cause 5", "Cause 6"],
  "solutions": ["Solution 1", "Solution 2", "Solution 3", "Solution 4", "Solution 5", "Solution 6"],
  "prevention": ["Prevention 1", "Prevention 2", "Prevention 3", "Prevention 4", "Prevention 5", "Prevention 6"],
  "severity": "low|medium|high"
}

IMPORTANT GUIDELINES:
- Make descriptions practical and farmer-friendly
- Focus on symptoms that are easily observable
- Provide actionable solutions and prevention measures
- Consider Indian farming conditions and practices
- Ensure all information is scientifically accurate
- Include the existing solutions in your recommendations
- Make severity assessment based on potential yield loss and treatment difficulty`;

      const response = await llmService.callGeminiAPI(prompt);
      const insights = this.parseDiseaseInsights(response);
      
      return insights;
    } catch (error) {
      console.error('Error generating disease insights:', error);
      // Return fallback data
      return this.getFallbackDiseaseInsights(disease);
    }
  }

  private parseDiseaseInsights(response: string): DiseaseInsights {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in disease insights response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        description: parsed.description || 'Disease information not available',
        symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : ['Symptoms not available'],
        causes: Array.isArray(parsed.causes) ? parsed.causes : ['Causes not available'],
        solutions: Array.isArray(parsed.solutions) ? parsed.solutions : ['Solutions not available'],
        prevention: Array.isArray(parsed.prevention) ? parsed.prevention : ['Prevention not available'],
        severity: ['low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'medium'
      };
    } catch (error) {
      console.error('Error parsing disease insights response:', error);
      throw error;
    }
  }

  private getFallbackDiseaseInsights(disease: DiseaseData): DiseaseInsights {
    // Generate fallback data based on disease name and crop
    const fallbackData: { [key: string]: Partial<DiseaseInsights> } = {
      'Bacterial Leaf Blight': {
        description: 'A bacterial disease that causes water-soaked lesions on leaves, leading to reduced photosynthesis and yield loss.',
        symptoms: ['Water-soaked lesions on leaves', 'Yellowing around lesions', 'Leaf wilting', 'Reduced plant vigor'],
        causes: ['Bacterial infection', 'High humidity', 'Warm temperatures', 'Poor air circulation'],
        prevention: ['Use disease-free seed', 'Improve field drainage', 'Crop rotation', 'Avoid overhead irrigation']
      },
      'Blast Disease': {
        description: 'A fungal disease that causes diamond-shaped lesions on leaves and can lead to complete crop failure.',
        symptoms: ['Diamond-shaped lesions', 'Gray centers with yellow halos', 'Spikelet sterility', 'Plant death'],
        causes: ['Fungal spores', 'High humidity', 'Cool temperatures', 'Excessive nitrogen'],
        prevention: ['Use resistant varieties', 'Balanced fertilization', 'Proper water management', 'Field sanitation']
      },
      'Brown Spot': {
        description: 'A common fungal disease affecting rice leaves and grains, causing brown circular spots.',
        symptoms: ['Brown circular spots', 'Yellow halos around spots', 'Grain discoloration', 'Reduced yield'],
        causes: ['Fungal infection', 'High humidity', 'Poor soil fertility', 'Infected seed'],
        prevention: ['Seed treatment', 'Balanced fertilization', 'Good drainage', 'Crop rotation']
      }
    };

    const baseData = fallbackData[disease.name] || {
      description: `${disease.name} is a plant disease affecting ${disease.crop} that can cause significant yield loss if not properly managed.`,
      symptoms: ['Leaf discoloration', 'Stunted growth', 'Reduced yield', 'Plant stress'],
      causes: ['Pathogen infection', 'Environmental stress', 'Poor management practices', 'Infected material'],
      prevention: ['Use healthy seed', 'Proper field management', 'Crop rotation', 'Regular monitoring']
    };

    return {
      description: baseData.description || 'Disease information not available',
      symptoms: baseData.symptoms || ['Symptoms not available'],
      causes: baseData.causes || ['Causes not available'],
      solutions: disease.solutions.length > 0 ? disease.solutions : ['Solutions not available'],
      prevention: baseData.prevention || ['Prevention not available'],
      severity: 'medium'
    };
  }

  async searchDiseases(query: string): Promise<DiseaseData[]> {
    await this.loadDiseaseData();
    
    const searchQuery = query.toLowerCase();
    const matchingDiseases = this.diseaseData.filter(disease =>
      disease.name.toLowerCase().includes(searchQuery) ||
      disease.crop.toLowerCase().includes(searchQuery)
    );

    // Enhance matching diseases with LLM insights
    const enhancedDiseases = await Promise.all(
      matchingDiseases.map(async (disease) => {
        try {
          const insights = await this.generateDiseaseInsights(disease);
          return {
            ...disease,
            ...insights
          };
        } catch (error) {
          console.error(`Error enhancing disease ${disease.name}:`, error);
          return disease;
        }
      })
    );

    return enhancedDiseases;
  }
}

export const diseaseService = DiseaseService.getInstance();