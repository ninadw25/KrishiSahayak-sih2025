import requests
import csv
import os
from datetime import datetime
import time
import json

API_KEY = "579b464db66ec23bdd0000015e1688471c84495a58a557976cd94c20"
API_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"

def save_progress(filepath, records, offset):
    """Save progress to a temporary file"""
    progress_file = filepath.replace('.csv', '_progress.json')
    progress_data = {
        'offset': offset,
        'total_records': len(records),
        'timestamp': datetime.now().isoformat()
    }
    with open(progress_file, 'w') as f:
        json.dump(progress_data, f)
    
    # Save records to CSV incrementally
    file_exists = os.path.exists(filepath)
    with open(filepath, 'a', newline='', encoding='utf-8') as csvfile:
        if records:
            fieldnames = records[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerows(records)

def load_progress(filepath):
    """Load progress from a temporary file"""
    progress_file = filepath.replace('.csv', '_progress.json')
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            return json.load(f)
    return None

def fetch_all_price_data(state=None, district=None, commodity=None, arrival_date=None, resume=True):
    """
    Fetch ALL agricultural price data from the API using pagination and save to CSV
    
    Args:
        state (str): Filter by state (optional)
        district (str): Filter by district (optional)
        commodity (str): Filter by commodity (optional)
        arrival_date (str): Filter by arrival date (optional)
        resume (bool): Whether to resume from previous progress
    
    Returns:
        bool: True if successful, False otherwise
    """
    
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'price_data')
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename with timestamp (or use existing if resuming)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"all_price_data_{timestamp}.csv"
    filepath = os.path.join(output_dir, filename)
    
    # Check for existing progress if resuming
    offset = 0
    total_fetched = 0
    
    if resume:
        # Look for the most recent file to resume from
        existing_files = [f for f in os.listdir(output_dir) if f.startswith('all_price_data_') and f.endswith('.csv')]
        if existing_files:
            latest_file = max(existing_files)
            latest_filepath = os.path.join(output_dir, latest_file)
            progress = load_progress(latest_filepath)
            if progress:
                offset = progress['offset']
                total_fetched = progress['total_records']
                filepath = latest_filepath
                print(f"Resuming from offset {offset} with {total_fetched} records already fetched")
                print(f"Using existing file: {filepath}")
    
    limit = 1000  # Fetch 1000 records per request
    max_retries = 3
    retry_delay = 5  # seconds
    
    print("Starting to fetch ALL price data from API...")
    print("This may take several minutes depending on the amount of data...")
    
    while True:
        params = {
            "api-key": API_KEY,
            "format": "json",
            "limit": limit,
            "offset": offset
        }
        
        # Add filters if provided
        if state:
            params["filters[State]"] = state
        if district:
            params["filters[District]"] = district
        if commodity:
            params["filters[Commodity]"] = commodity
        if arrival_date:
            params["filters[Arrival_Date]"] = arrival_date
        
        # Retry mechanism
        for attempt in range(max_retries):
            try:
                print(f"Fetching records {offset} to {offset + limit}... (attempt {attempt + 1})")
                resp = requests.get(API_URL, params=params, timeout=60)
                resp.raise_for_status()
                
                data = resp.json()
                
                if not data or 'records' not in data:
                    print("No more data found in API response")
                    return total_fetched > 0
                
                records = data['records']
                if not records or len(records) == 0:
                    print("No more records found - reached end of data")
                    return total_fetched > 0
                
                # Save records incrementally
                save_progress(filepath, records, offset + len(records))
                total_fetched += len(records)
                print(f"Fetched {len(records)} records. Total so far: {total_fetched}")
                
                # If we got fewer records than requested, we've reached the end
                if len(records) < limit:
                    print("Reached end of available data")
                    return True
                
                # Update offset for next batch
                offset += limit
                
                # Add a delay to be respectful to the API
                time.sleep(1)  # Increased delay
                break  # Success, break out of retry loop
                
            except requests.exceptions.Timeout:
                print(f"Timeout error (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"Max retries exceeded. Successfully fetched {total_fetched} records before timeout")
                    return total_fetched > 0
                    
            except requests.exceptions.ConnectionError:
                print(f"Connection error (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"Max retries exceeded. Successfully fetched {total_fetched} records before connection error")
                    return total_fetched > 0
                    
            except requests.exceptions.RequestException as e:
                print(f"Request error: {e} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"Max retries exceeded. Successfully fetched {total_fetched} records before error")
                    return total_fetched > 0
                    
            except Exception as e:
                print(f"Unexpected error processing data: {e}")
                return total_fetched > 0
    
    if total_fetched == 0:
        print("No records were fetched!")
        return False
    
    print(f"\nTotal records fetched: {total_fetched}")
    print(f"All data successfully exported to: {filepath}")
    
    if os.path.exists(filepath):
        print(f"File size: {os.path.getsize(filepath) / (1024*1024):.2f} MB")
    
    # Clean up progress file
    progress_file = filepath.replace('.csv', '_progress.json')
    if os.path.exists(progress_file):
        os.remove(progress_file)
        
    return True

def main():
    """Main function to run the price scraper"""
    print("Agricultural Price Data Scraper")
    print("=" * 40)
    
    # Ask user if they want to resume or start fresh
    print("\nOptions:")
    print("1. Resume from last progress (if available)")
    print("2. Start fresh")
    print("3. Manual resume from specific offset")
    
    try:
        choice = input("\nEnter your choice (1-3) [default: 1]: ").strip()
        if not choice:
            choice = "1"
    except KeyboardInterrupt:
        print("\nExiting...")
        return
    
    if choice == "1":
        # Resume automatically
        success = fetch_all_price_data(resume=True)
    elif choice == "2":
        # Start fresh
        success = fetch_all_price_data(resume=False)
    elif choice == "3":
        # Manual resume
        try:
            offset = int(input("Enter offset to resume from: "))
            success = fetch_all_price_data_from_offset(offset)
        except (ValueError, KeyboardInterrupt):
            print("Invalid offset or cancelled. Exiting...")
            return
    else:
        print("Invalid choice. Using default (resume)...")
        success = fetch_all_price_data(resume=True)
    
    if success:
        print("Data scraping completed successfully!")
    else:
        print("Data scraping failed!")

def fetch_all_price_data_from_offset(start_offset):
    """Fetch data starting from a specific offset"""
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'price_data')
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"all_price_data_resume_{start_offset}_{timestamp}.csv"
    filepath = os.path.join(output_dir, filename)
    
    offset = start_offset
    limit = 1000
    max_retries = 3
    retry_delay = 5
    total_fetched = 0
    
    print(f"Starting to fetch data from offset {start_offset}...")
    
    while True:
        params = {
            "api-key": API_KEY,
            "format": "json",
            "limit": limit,
            "offset": offset
        }
        
        for attempt in range(max_retries):
            try:
                print(f"Fetching records {offset} to {offset + limit}... (attempt {attempt + 1})")
                resp = requests.get(API_URL, params=params, timeout=60)
                resp.raise_for_status()
                
                data = resp.json()
                
                if not data or 'records' not in data:
                    print("No more data found in API response")
                    return total_fetched > 0
                
                records = data['records']
                if not records or len(records) == 0:
                    print("No more records found - reached end of data")
                    return total_fetched > 0
                
                # Save records incrementally
                save_progress(filepath, records, offset + len(records))
                total_fetched += len(records)
                print(f"Fetched {len(records)} records. Total so far: {total_fetched}")
                
                if len(records) < limit:
                    print("Reached end of available data")
                    return True
                
                offset += limit
                time.sleep(1)
                break
                
            except requests.exceptions.Timeout:
                print(f"Timeout error (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    print(f"Max retries exceeded. Successfully fetched {total_fetched} records")
                    return total_fetched > 0
                    
            except Exception as e:
                print(f"Error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    return total_fetched > 0
    
    return True

if __name__ == "__main__":
    main()