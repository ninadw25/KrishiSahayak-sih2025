export interface LanguageTexts {
  // Header
  title: string;
  subtitle: string;
  
  // Season Selection
  growingSeason: string;
  kharif: string;
  rabi: string;
  zaid: string;
  kharifMonths: string;
  rabiMonths: string;
  zaidMonths: string;
  
  // Soil Type Selection
  soilType: string;
  loamy: string;
  clay: string;
  sandy: string;
  silt: string;
  blackSoil: string;
  redSoil: string;
  alluvial: string;
  loamyDesc: string;
  clayDesc: string;
  sandyDesc: string;
  siltDesc: string;
  blackSoilDesc: string;
  redSoilDesc: string;
  alluvialDesc: string;
  
  // Location Selection
  location: string;
  currentLocation: string;
  enterLocation: string;
  gettingLocation: string;
  locationPermissionRequired: string;
  grantPermission: string;
  locationNotAvailable: string;
  retry: string;
  enterLocationPlaceholder: string;
  enterLocationHint: string;
  
  // Farmer Preferences
  farmingProfile: string;
  waterAvailability: string;
  budgetLevel: string;
  experienceLevel: string;
  farmSize: string;
  high: string;
  medium: string;
  low: string;
  beginner: string;
  intermediate: string;
  expert: string;
  small: string;
  large: string;
  
  // Buttons
  recommend: string;
  analyzing: string;
  refresh: string;
  updating: string;
  getRecommendations: string;
  
  // Recommendations
  recommendedCrops: string;
  getYourCropRecommendations: string;
  noRecommendationsYet: string;
  noRecommendationsDesc: string;
  
  // Crop Details
  expectedYield: string;
  profitRange: string;
  duration: string;
  water: string;
  sustainability: string;
  roi: string;
  plant: string;
  demand: string;
  risk: string;
  keyBenefits: string;
  requirements: string;
  viewDetails: string;
  match: string;
  
  // Alerts
  missingInformation: string;
  pleaseSelectBoth: string;
  locationRequired: string;
  pleaseSelectLocation: string;
  locationNotFound: string;
  couldNotFindLocation: string;
  error: string;
  failedToGetLocation: string;
  failedToGenerateRecommendations: string;
}

export const languageTexts: Record<string, LanguageTexts> = {
  en: {
    // Header
    title: "Crop Recommendations",
    subtitle: "Get personalized crop recommendations based on your location and preferences",
    
    // Season Selection
    growingSeason: "Growing Season",
    kharif: "Kharif",
    rabi: "Rabi",
    zaid: "Zaid",
    kharifMonths: "Jun-Oct",
    rabiMonths: "Nov-Mar",
    zaidMonths: "Mar-Jun",
    
    // Soil Type Selection
    soilType: "Soil Type",
    loamy: "Loamy",
    clay: "Clay",
    sandy: "Sandy",
    silt: "Silt",
    blackSoil: "Black Soil",
    redSoil: "Red Soil",
    alluvial: "Alluvial",
    loamyDesc: "Best for most crops",
    clayDesc: "Good water retention",
    sandyDesc: "Good drainage",
    siltDesc: "Fertile soil",
    blackSoilDesc: "Rich in nutrients",
    redSoilDesc: "Iron-rich soil",
    alluvialDesc: "River-deposited soil",
    
    // Location Selection
    location: "Location",
    currentLocation: "Current Location",
    enterLocation: "Enter Location",
    gettingLocation: "Getting your location...",
    locationPermissionRequired: "Location permission required",
    grantPermission: "Grant Permission",
    locationNotAvailable: "Location not available",
    retry: "Retry",
    enterLocationPlaceholder: "Enter city, state, or district (e.g., Pune, Maharashtra)",
    enterLocationHint: "Enter a location name to get location-specific recommendations",
    
    // Farmer Preferences
    farmingProfile: "Your Farming Profile",
    waterAvailability: "Water Availability",
    budgetLevel: "Budget Level",
    experienceLevel: "Experience Level",
    farmSize: "Farm Size",
    high: "High",
    medium: "Medium",
    low: "Low",
    beginner: "Beginner",
    intermediate: "Intermediate",
    expert: "Expert",
    small: "Small",
    large: "Large",
    
    // Buttons
    recommend: "Recommend",
    analyzing: "Analyzing...",
    refresh: "Refresh",
    updating: "Updating...",
    getRecommendations: "Get Recommendations",
    
    // Recommendations
    recommendedCrops: "Recommended Crops",
    getYourCropRecommendations: "Get Your Crop Recommendations",
    noRecommendationsYet: "No recommendations yet",
    noRecommendationsDesc: "Select your preferences and click \"Recommend\" to get personalized crop recommendations",
    
    // Crop Details
    expectedYield: "Expected Yield",
    profitRange: "Profit Range",
    duration: "Duration",
    water: "Water",
    sustainability: "Sustainability",
    roi: "ROI",
    plant: "Plant",
    demand: "Demand",
    risk: "Risk",
    keyBenefits: "Key Benefits",
    requirements: "Requirements",
    viewDetails: "View Details",
    match: "Match",
    
    // Alerts
    missingInformation: "Missing Information",
    pleaseSelectBoth: "Please select both season and soil type.",
    locationRequired: "Location Required",
    pleaseSelectLocation: "Please select current location or enter a manual location to get crop recommendations.",
    locationNotFound: "Location Not Found",
    couldNotFindLocation: "Could not find the specified location. Please try a different location name.",
    error: "Error",
    failedToGetLocation: "Failed to get location information. Please try again.",
    failedToGenerateRecommendations: "Failed to generate crop recommendations. Please try again."
  },
  
  hi: {
    // Header
    title: "फसल सुझाव",
    subtitle: "अपने स्थान और प्राथमिकताओं के आधार पर व्यक्तिगत फसल सुझाव प्राप्त करें",
    
    // Season Selection
    growingSeason: "बुवाई का मौसम",
    kharif: "खरीफ",
    rabi: "रबी",
    zaid: "जायद",
    kharifMonths: "जून-अक्टूबर",
    rabiMonths: "नवंबर-मार्च",
    zaidMonths: "मार्च-जून",
    
    // Soil Type Selection
    soilType: "मिट्टी का प्रकार",
    loamy: "दोमट",
    clay: "चिकनी मिट्टी",
    sandy: "बलुई मिट्टी",
    silt: "गाद",
    blackSoil: "काली मिट्टी",
    redSoil: "लाल मिट्टी",
    alluvial: "जलोढ़ मिट्टी",
    loamyDesc: "अधिकांश फसलों के लिए सबसे अच्छी",
    clayDesc: "अच्छा जल धारण",
    sandyDesc: "अच्छा जल निकासी",
    siltDesc: "उपजाऊ मिट्टी",
    blackSoilDesc: "पोषक तत्वों से भरपूर",
    redSoilDesc: "लौह युक्त मिट्टी",
    alluvialDesc: "नदी द्वारा जमा मिट्टी",
    
    // Location Selection
    location: "स्थान",
    currentLocation: "वर्तमान स्थान",
    enterLocation: "स्थान दर्ज करें",
    gettingLocation: "आपका स्थान प्राप्त कर रहे हैं...",
    locationPermissionRequired: "स्थान की अनुमति आवश्यक",
    grantPermission: "अनुमति दें",
    locationNotAvailable: "स्थान उपलब्ध नहीं",
    retry: "पुनः प्रयास",
    enterLocationPlaceholder: "शहर, राज्य या जिला दर्ज करें (जैसे, पुणे, महाराष्ट्र)",
    enterLocationHint: "स्थान-विशिष्ट सुझाव प्राप्त करने के लिए स्थान का नाम दर्ज करें",
    
    // Farmer Preferences
    farmingProfile: "आपकी कृषि प्रोफ़ाइल",
    waterAvailability: "पानी की उपलब्धता",
    budgetLevel: "बजट स्तर",
    experienceLevel: "अनुभव स्तर",
    farmSize: "खेत का आकार",
    high: "उच्च",
    medium: "मध्यम",
    low: "कम",
    beginner: "शुरुआती",
    intermediate: "मध्यम",
    expert: "विशेषज्ञ",
    small: "छोटा",
    large: "बड़ा",
    
    // Buttons
    recommend: "सुझाव दें",
    analyzing: "विश्लेषण कर रहे हैं...",
    refresh: "ताज़ा करें",
    updating: "अपडेट कर रहे हैं...",
    getRecommendations: "सुझाव प्राप्त करें",
    
    // Recommendations
    recommendedCrops: "सुझाई गई फसलें",
    getYourCropRecommendations: "अपने फसल सुझाव प्राप्त करें",
    noRecommendationsYet: "अभी तक कोई सुझाव नहीं",
    noRecommendationsDesc: "अपनी प्राथमिकताएं चुनें और व्यक्तिगत फसल सुझाव प्राप्त करने के लिए \"सुझाव दें\" पर क्लिक करें",
    
    // Crop Details
    expectedYield: "अपेक्षित उपज",
    profitRange: "लाभ सीमा",
    duration: "अवधि",
    water: "पानी",
    sustainability: "टिकाऊपन",
    roi: "निवेश पर प्रतिफल",
    plant: "बुवाई",
    demand: "मांग",
    risk: "जोखिम",
    keyBenefits: "मुख्य लाभ",
    requirements: "आवश्यकताएं",
    viewDetails: "विवरण देखें",
    match: "मैच",
    
    // Alerts
    missingInformation: "जानकारी गुम",
    pleaseSelectBoth: "कृपया मौसम और मिट्टी का प्रकार दोनों चुनें।",
    locationRequired: "स्थान आवश्यक",
    pleaseSelectLocation: "फसल सुझाव प्राप्त करने के लिए कृपया वर्तमान स्थान चुनें या मैन्युअल स्थान दर्ज करें।",
    locationNotFound: "स्थान नहीं मिला",
    couldNotFindLocation: "निर्दिष्ट स्थान नहीं मिल सका। कृपया एक अलग स्थान का नाम आज़माएं।",
    error: "त्रुटि",
    failedToGetLocation: "स्थान की जानकारी प्राप्त करने में विफल। कृपया पुनः प्रयास करें।",
    failedToGenerateRecommendations: "फसल सुझाव उत्पन्न करने में विफल। कृपया पुनः प्रयास करें।"
  },
  
  pa: {
    // Header
    title: "ਫਸਲ ਸੁਝਾਅ",
    subtitle: "ਆਪਣੇ ਸਥਾਨ ਅਤੇ ਤਰਜੀਹਾਂ ਦੇ ਆਧਾਰ 'ਤੇ ਨਿੱਜੀ ਫਸਲ ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰੋ",
    
    // Season Selection
    growingSeason: "ਬੀਜਾਈ ਦਾ ਮੌਸਮ",
    kharif: "ਖਰੀਫ",
    rabi: "ਰਬੀ",
    zaid: "ਜ਼ਾਇਦ",
    kharifMonths: "ਜੂਨ-ਅਕਤੂਬਰ",
    rabiMonths: "ਨਵੰਬਰ-ਮਾਰਚ",
    zaidMonths: "ਮਾਰਚ-ਜੂਨ",
    
    // Soil Type Selection
    soilType: "ਮਿੱਟੀ ਦਾ ਪ੍ਰਕਾਰ",
    loamy: "ਦੋਮਟ",
    clay: "ਚਿਕਨੀ ਮਿੱਟੀ",
    sandy: "ਰੇਤਲੀ ਮਿੱਟੀ",
    silt: "ਗਾਦ",
    blackSoil: "ਕਾਲੀ ਮਿੱਟੀ",
    redSoil: "ਲਾਲ ਮਿੱਟੀ",
    alluvial: "ਜਲੋੜ ਮਿੱਟੀ",
    loamyDesc: "ਜ਼ਿਆਦਾਤਰ ਫਸਲਾਂ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ",
    clayDesc: "ਚੰਗਾ ਪਾਣੀ ਰੱਖਣਾ",
    sandyDesc: "ਚੰਗਾ ਪਾਣੀ ਨਿਕਾਸ",
    siltDesc: "ਉਪਜਾਊ ਮਿੱਟੀ",
    blackSoilDesc: "ਪੋਸ਼ਕ ਤੱਤਾਂ ਨਾਲ ਭਰਪੂਰ",
    redSoilDesc: "ਲੋਹੇ ਵਾਲੀ ਮਿੱਟੀ",
    alluvialDesc: "ਨਦੀ ਦੁਆਰਾ ਜਮ੍ਹਾ ਮਿੱਟੀ",
    
    // Location Selection
    location: "ਸਥਾਨ",
    currentLocation: "ਮੌਜੂਦਾ ਸਥਾਨ",
    enterLocation: "ਸਥਾਨ ਦਰਜ ਕਰੋ",
    gettingLocation: "ਆਪਡਾ ਸਥਾਨ ਪ੍ਰਾਪਤ ਕਰ ਰਹੇ ਹਾਂ...",
    locationPermissionRequired: "ਸਥਾਨ ਦੀ ਇਜਾਜ਼ਤ ਲੋੜੀਂਦੀ",
    grantPermission: "ਇਜਾਜ਼ਤ ਦਿਓ",
    locationNotAvailable: "ਸਥਾਨ ਉਪਲਬਧ ਨਹੀਂ",
    retry: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼",
    enterLocationPlaceholder: "ਸ਼ਹਿਰ, ਰਾਜ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ (ਜਿਵੇਂ, ਪੁਣੇ, ਮਹਾਰਾਸ਼ਟਰ)",
    enterLocationHint: "ਸਥਾਨ-ਵਿਸ਼ੇਸ਼ ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਸਥਾਨ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    
    // Farmer Preferences
    farmingProfile: "ਤੁਹਾਡੀ ਖੇਤੀ ਪ੍ਰੋਫਾਈਲ",
    waterAvailability: "ਪਾਣੀ ਦੀ ਉਪਲਬਧਤਾ",
    budgetLevel: "ਬਜਟ ਪੱਧਰ",
    experienceLevel: "ਅਨੁਭਵ ਪੱਧਰ",
    farmSize: "ਖੇਤ ਦਾ ਆਕਾਰ",
    high: "ਉੱਚ",
    medium: "ਦਰਮਿਆਨਾ",
    low: "ਘੱਟ",
    beginner: "ਸ਼ੁਰੂਆਤੀ",
    intermediate: "ਦਰਮਿਆਨਾ",
    expert: "ਮਾਹਿਰ",
    small: "ਛੋਟਾ",
    large: "ਵੱਡਾ",
    
    // Buttons
    recommend: "ਸੁਝਾਅ ਦਿਓ",
    analyzing: "ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਹੇ ਹਾਂ...",
    refresh: "ਤਾਜ਼ਾ ਕਰੋ",
    updating: "ਅਪਡੇਟ ਕਰ ਰਹੇ ਹਾਂ...",
    getRecommendations: "ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰੋ",
    
    // Recommendations
    recommendedCrops: "ਸੁਝਾਈਆਂ ਗਈਆਂ ਫਸਲਾਂ",
    getYourCropRecommendations: "ਆਪਡੇ ਫਸਲ ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰੋ",
    noRecommendationsYet: "ਅਜੇ ਤੱਕ ਕੋਈ ਸੁਝਾਅ ਨਹੀਂ",
    noRecommendationsDesc: "ਆਪਡੀਆਂ ਤਰਜੀਹਾਂ ਚੁਣੋ ਅਤੇ ਨਿੱਜੀ ਫਸਲ ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ \"ਸੁਝਾਅ ਦਿਓ\" 'ਤੇ ਕਲਿੱਕ ਕਰੋ",
    
    // Crop Details
    expectedYield: "ਅਪੇਖਿਤ ਪੈਦਾਵਾਰ",
    profitRange: "ਲਾਭ ਸੀਮਾ",
    duration: "ਅਵਧੀ",
    water: "ਪਾਣੀ",
    sustainability: "ਟਿਕਾਊਪਨ",
    roi: "ਨਿਵੇਸ਼ 'ਤੇ ਵਾਪਸੀ",
    plant: "ਬੀਜਾਈ",
    demand: "ਮੰਗ",
    risk: "ਖ਼ਤਰਾ",
    keyBenefits: "ਮੁੱਖ ਲਾਭ",
    requirements: "ਲੋੜਾਂ",
    viewDetails: "ਵੇਰਵੇ ਦੇਖੋ",
    match: "ਮੈਚ",
    
    // Alerts
    missingInformation: "ਜਾਣਕਾਰੀ ਗੁੰਮ",
    pleaseSelectBoth: "ਕਿਰਪਾ ਕਰਕੇ ਮੌਸਮ ਅਤੇ ਮਿੱਟੀ ਦਾ ਪ੍ਰਕਾਰ ਦੋਵੇਂ ਚੁਣੋ।",
    locationRequired: "ਸਥਾਨ ਲੋੜੀਂਦਾ",
    pleaseSelectLocation: "ਫਸਲ ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਮੌਜੂਦਾ ਸਥਾਨ ਚੁਣੋ ਜਾਂ ਹੱਥੀਂ ਸਥਾਨ ਦਰਜ ਕਰੋ।",
    locationNotFound: "ਸਥਾਨ ਨਹੀਂ ਮਿਲਿਆ",
    couldNotFindLocation: "ਨਿਰਦਿਸ਼ਤ ਸਥਾਨ ਨਹੀਂ ਮਿਲ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵੱਖਰਾ ਸਥਾਨ ਦਾ ਨਾਮ ਅਜ਼ਮਾਓ।",
    error: "ਗਲਤੀ",
    failedToGetLocation: "ਸਥਾਨ ਦੀ ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    failedToGenerateRecommendations: "ਫਸਲ ਸੁਝਾਅ ਉਤਪੰਨ ਕਰਨ ਵਿੱਚ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।"
  }
};

export const getLanguageTexts = (language: string): LanguageTexts => {
  return languageTexts[language] || languageTexts.en;
};
