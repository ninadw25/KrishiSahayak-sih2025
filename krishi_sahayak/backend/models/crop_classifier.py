from ultralytics import YOLO

def classify_pest(model_path, image_path):

    try:
        model = YOLO(model_path)

        # 2. Run classification on the image
        results = model(image_path, verbose=False)

        # 3. Process the results
        result = results[0]
        
        top_class_index = result.probs.top1
        
        # Get the confidence score of that top prediction
        top_confidence = result.probs.top1conf

        pest_name = result.names[top_class_index]

        # 4. Format the text response
        response = f"Pest identified as: {pest_name} (Confidence: {top_confidence:.2%})"
        
        return response

    except Exception as e:
        return f"An error occurred: {e}"

if __name__ == '__main__':
    YOUR_CLASSIFICATION_MODEL_PATH = 'krishi_sahayak/backend/assets/crop_classifier.pt' 

    IMAGE_FROM_MOBILE_APP = 'krishi_sahayak/backend/assets/img/wheat.jpeg' # Modify image path for adding images through APP

    # Call the function and get the text response
    response_text = classify_pest(YOUR_CLASSIFICATION_MODEL_PATH, IMAGE_FROM_MOBILE_APP)

    # Print the result
    print(response_text)