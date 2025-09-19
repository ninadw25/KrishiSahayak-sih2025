import os
from pathlib import Path
from dotenv import load_dotenv
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

env_path = Path('krishi_sahayak/backend/.env')
load_dotenv(env_path)
print('GOOGLE_API_KEY:', os.getenv('GOOGLE_API_KEY'))

