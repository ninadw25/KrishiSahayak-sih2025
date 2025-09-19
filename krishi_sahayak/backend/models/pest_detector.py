import pandas as pd
from ultralytics import YOLO

def load_pesticide_recommendations(csv_path):
    """
    Loads pesticide recommendations from a CSV file (without an ID column)
    into a dictionary.
    """
    try:
        df = pd.read_csv(csv_path)
        
        # THE CRITICAL FIX: Use the correct column name 'Pest_Name' to match the CSV header.
        df.set_index('Pest_Name', inplace=True)

        # Now that the ID column is gone, this simple conversion works perfectly.
        recommendations = {index: row.tolist() for index, row in df.iterrows()}
        return recommendations
        
    except FileNotFoundError:
        print(f"Error: The file at {csv_path} was not found.")
        return {}
    except KeyError:
        print(f"Error: Could not find the 'Pest_Name' column in {csv_path}. Please check the CSV header.")
        return {}
    except Exception as e:
        print(f"An error occurred while reading the CSV: {e}")
        return {}

def detect_pest(model_path, image_path, pesticide_db):
    # This function is correct and does not need changes.
    try:
        model = YOLO(model_path)
        results = model(image_path, verbose=False)
        result = results[0]
        
        detection_results = {}
        if len(result.boxes) == 0:
            return detection_results 

        for cls_index in result.boxes.cls:
            pest_name = result.names[int(cls_index)]
            if pest_name not in detection_results:
                recommendations = pesticide_db.get(pest_name, ["No specific recommendation found in CSV."])
                detection_results[pest_name] = recommendations
        
        return detection_results

    except Exception as e:
        return {"error": f"An error occurred during detection: {e}"}

def format_chat_response(detection_results):
    # This function is correct and does not need changes.
    if not detection_results:
        return "No pests were detected in the image."

    if "error" in detection_results:
        return detection_results["error"]

    response_parts = []
    for pest, recommendations in detection_results.items():
        recs_str = "\n".join([f"{i+1}. {rec}" for i, rec in enumerate(recommendations)])
        
        pest_info = (
            f"Pest Detected: *{pest}*\n\n"
            f"Recommended Pesticides:\n{recs_str}"
        )
        response_parts.append(pest_info)
    
    return "\n\n---\n\n".join(response_parts)


if __name__ == '__main__':
    # --- Configuration ---
    YOUR_MODEL_PATH = 'krishi_sahayak/backend/assets/pest_detector.pt' 
    PESTICIDE_CSV_PATH = 'D:/Work/Coding/KrishiSahayak-backend/krishi_sahayak/backend/assets/pesticides.csv'
    IMAGE_FROM_MOBILE_APP = 'krishi_sahayak/backend/assets/img/test_detector.jpeg' # Modify image path for adding images through APP
    
    pesticide_database = load_pesticide_recommendations(PESTICIDE_CSV_PATH)

    if pesticide_database: 
        pest_results = detect_pest(YOUR_MODEL_PATH, IMAGE_FROM_MOBILE_APP, pesticide_database)
        response_text = format_chat_response(pest_results)
        print(response_text)