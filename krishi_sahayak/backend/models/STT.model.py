import torch
import torchaudio
from transformers import AutoModel, AutoFeatureExtractor, AutoModelForAudioClassification
import os
from dotenv import load_dotenv

# --- Step 1: Load Environment Variables and Models ---

# Load variables from the .env file into the environment
load_dotenv()

# Access the token from the environment variable
hf_token = os.getenv("HUGGING_FACE_TOKEN")

# Add a check to ensure the token was loaded
if not hf_token:
    raise ValueError("Hugging Face token not found. Please create a .env file with HUGGING_FACE_TOKEN='your_token'")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# --- Load the STT (Transcription) Model ---
print("Loading STT model, this might take a moment...")
stt_model = AutoModel.from_pretrained(
    "ai4bharat/indic-conformer-600m-multilingual",
    trust_remote_code=True,
    token=hf_token  # Use the token loaded from the environment
).to(device)
print("STT Model loaded successfully.")

# --- Load the LID (Language Detection) Model ---
print("Loading Language Identification model...")
lid_feature_extractor = AutoFeatureExtractor.from_pretrained("facebook/mms-lid-126")
lid_model = AutoModelForAudioClassification.from_pretrained("facebook/mms-lid-126").to(device)
print("LID Model loaded successfully.")

# --- Language Code Mapping Dictionary ---
LID_TO_STT_LANG_CODE_MAP = {
    "asm": "as", "ben": "bn", "guj": "gu", "hin": "hi", "kan": "kn",
    "kas": "ks", "gom": "kok", "mai": "mai", "mal": "ml", "mar": "mr",
    "nep": "ne", "ory": "or", "pan": "pa", "san": "sa", "snd": "sd",
    "tam": "ta", "tel": "te", "urd": "ur",
}

SUPPORTED_STT_LANGUAGES = {
    "as","bn","brx","doi","gu","hi","kn","ks","kok","mai","ml",
    "mni","mr","ne","or","pa","sa","sat","sd","ta","te","ur"
}

# --- Step 2: Define Helper Functions ---

def detect_language(wav, sr):
    """Detects the language spoken in an audio waveform."""
    print("Detecting language...")
    if sr != 16000:
        resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000).to(device)
        wav = resampler(wav)
        
    inputs = lid_feature_extractor(wav.squeeze(0), sampling_rate=16000, return_tensors="pt")
    inputs = {key: val.to(device) for key, val in inputs.items()}

    with torch.no_grad():
        logits = lid_model(**inputs).logits

    predicted_id = torch.argmax(logits, dim=-1).item()
    detected_lang_code = lid_model.config.id2label[predicted_id]
    
    print(f"Detected language code (from LID model): {detected_lang_code}")
    return detected_lang_code


def transcribe_audio(wav, sr, language_code: str, decoding_method: str = "rnnt"):
    """Transcribes an audio waveform given a language code."""
    print(f"Transcribing audio for language: {language_code}")
    
    target_sample_rate = 16000
    if sr != target_sample_rate:
        resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=target_sample_rate).to(device)
        wav = resampler(wav)
    
    transcription = stt_model(wav, language_code, decoding_method)
    print(f"Transcription result: {transcription}")
    
    return transcription


def process_audio_file(audio_file_path: str):
    """Orchestrates the full process: load audio, detect, map, and transcribe."""
    print("-" * 50)
    print(f"Processing file: {audio_file_path}")
    
    if not os.path.exists(audio_file_path):
        print(f"Error: Audio file not found at '{audio_file_path}'")
        return None, None

    try:
        wav, sr = torchaudio.load(audio_file_path)
        wav = wav.to(device)
    except Exception as e:
        print(f"Error loading audio file: {e}")
        return None, None

    if wav.shape[0] > 1:
        wav = torch.mean(wav, dim=0, keepdim=True)
        
    detected_lang = detect_language(wav, sr)
    
    stt_lang_code = LID_TO_STT_LANG_CODE_MAP.get(detected_lang, detected_lang)
    if stt_lang_code != detected_lang:
        print(f"Mapped language code from '{detected_lang}' to '{stt_lang_code}' for STT model.")
    
    if stt_lang_code not in SUPPORTED_STT_LANGUAGES:
        print(f"Warning: Mapped language '{stt_lang_code}' is not supported by the STT model.")
        print(f"Supported languages are: {', '.join(sorted(SUPPORTED_STT_LANGUAGES))}")
        return None, None
        
    transcribed_text = transcribe_audio(wav, sr, stt_lang_code)
    
    return transcribed_text, stt_lang_code


# --- Step 3: Main execution block ---
if __name__ == "__main__":
    # --- IMPORTANT: CHANGE THIS PATH TO YOUR AUDIO FILE ---
    input_audio_file = "path/to/your/audio.mp3" 

    final_text, language = process_audio_file(input_audio_file)

    if final_text:
        print("\n--- Final Result ---")
        print(f"Final Language Code: {language}")
        print(f"Transcribed Text: {final_text}")
        print("--------------------")