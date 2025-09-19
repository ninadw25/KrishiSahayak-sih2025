# run_tts.py
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf
import time
import numpy as np

# --- Define local paths for the pre-downloaded models ---
LOCAL_MODEL_PATH = "./local_models/indic-parler-tts"
# This path is based on the downloader script. You might need to check the exact folder name created.
LOCAL_DESCRIPTION_TOKENIZER_PATH = "./local_models/facebook_encodec_24khz"


# --- Step 1: Load Models and Tokenizers from LOCAL files ---
print("Loading TTS models from local files...")
device = "cuda:0" if torch.cuda.is_available() else "cpu"

if torch.cuda.is_available():
    print("NVIDIA GPU detected. Using half-precision (float16) for faster inference.")
    model = ParlerTTSForConditionalGeneration.from_pretrained(
        LOCAL_MODEL_PATH,
        torch_dtype=torch.float16
    ).to(device)
else:
    print("No NVIDIA GPU detected. Running on CPU, which will be very slow.")
    model = ParlerTTSForConditionalGeneration.from_pretrained(LOCAL_MODEL_PATH).to(device)

tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_PATH)
description_tokenizer = AutoTokenizer.from_pretrained(LOCAL_DESCRIPTION_TOKENIZER_PATH)
print("TTS Models loaded successfully.")

# --- Step 2: Define the Text-to-Speech Function (no changes needed here) ---
def generate_audio_from_text(text_from_chatbot: str, output_filename: str = None):
    if not text_from_chatbot:
        print("Error: Input text cannot be empty.")
        return

    start_time = time.time()
    print(f"Generating audio for: '{text_from_chatbot}'")

    description = "A female speaker delivers a clear and steady speech at a slightly slow pace. Her voice is calm and has a moderate pitch. The recording is of high quality with no background noise."

    prompt_input_ids = tokenizer(text_from_chatbot, return_tensors="pt").to(device)
    description_input_ids = description_tokenizer(description, return_tensors="pt").to(device)

    generation = model.generate(
        input_ids=description_input_ids.input_ids,
        attention_mask=description_input_ids.attention_mask,
        prompt_input_ids=prompt_input_ids.input_ids,
        prompt_attention_mask=prompt_input_ids.attention_mask
    )
    audio_arr = generation.cpu().numpy().squeeze()

    if output_filename is None:
        timestamp = int(time.time())
        output_filename = f"chatbot_response_{timestamp}.wav"

    audio_arr_float32 = audio_arr.astype(np.float32)
    sf.write(output_filename, audio_arr_float32, model.config.sampling_rate)

    end_time = time.time()
    print(f"Audio saved as {output_filename}. Generation took {end_time - start_time:.2f} seconds.")
    return output_filename

# --- Step 3: Run the main logic ---
if __name__ == "__main__":
    chatbot_response_1 = "आज मौसम साफ़ रहेगा और तापमान 32 डिग्री सेल्सियस के आसपास रहेगा।" # Hindi
    chatbot_response_2 = "The market price for wheat is currently 2,100 rupees per quintal." # English
    chatbot_response_3 = "మీరు రేపు మీ పంటలకు నీరు పెట్టాలి." # Telugu

    generate_audio_from_text(chatbot_response_1)
    generate_audio_from_text(chatbot_response_2)
    generate_audio_from_text(chatbot_response_3)