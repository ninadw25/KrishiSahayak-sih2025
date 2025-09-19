crop_to_category = {
    'wheat': 'cereal',
    'rice': 'cereal',
    'maize': 'cereal',
    'mustard': 'oilseed',
    'groundnut': 'oilseed',
    'chickpeas': 'legume', # Also called Pulses
    'guar': 'legume',
    'potato': 'tuber',
    'cotton': 'fiber'
}

# (Previous_Category, Next_Category) -> Score
synergy_matrix = {
    # Good Rotations
    ('cereal', 'legume'): 1.0,   # Legumes fix nitrogen, helping soil after cereals
    ('legume', 'cereal'): 1.0,   # Cereals benefit from the fixed nitrogen
    ('cereal', 'tuber'): 0.7,    # Good, diversifies root depth
    ('fiber', 'legume'): 1.0,    # Cotton is heavy on nutrients, legumes replenish
    
    # Neutral Rotations
    ('cereal', 'oilseed'): 0.5,
    ('legume', 'oilseed'): 0.5,
    
    # Bad Rotations
    ('cereal', 'cereal'): -1.0,  # Depletes same nutrients, encourages same pests
    ('legume', 'legume'): -0.7,  # Encourages soil-borne diseases for pulses
    ('tuber', 'tuber'): -1.0
}

# The Real-Time Calculation
# Now, when a farmer whose previous crop was Wheat asks for a recommendation, the calculation in the "what if" loop is simple and instant:

# Get Previous Category: previous_crop is 'wheat'. Look up in crop_to_category -> previous_category is 'cereal'.

# Loop through Candidates:

# Candidate is 'Rice': next_category is 'cereal'. Look up ('cereal', 'cereal') in synergy_matrix -> rotation_score = -1.0.

# Candidate is 'Mustard': next_category is 'oilseed'. Look up ('cereal', 'oilseed') -> rotation_score = 0.5.

# Candidate is 'Chickpeas': next_category is 'legume'. Look up ('cereal', 'legume') -> rotation_score = 1.0.