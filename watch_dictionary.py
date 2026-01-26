import time
import os
from process_dictionary import process_dictionary

def watch_file():
    file_path = 'dictionary.json'
    last_modified = os.path.getmtime(file_path)
    
    print(f"Watching {file_path} for changes...")
    print("Press Ctrl+C to stop.")
    
    while True:
        try:
            current_modified = os.path.getmtime(file_path)
            
            if current_modified != last_modified:
                print(f"\n{file_path} changed! Processing...")
                time.sleep(0.1)  # Small delay to ensure file is fully written
                try:
                    process_dictionary()
                    print("Ready for next change...")
                except Exception as e:
                    print(f"Error processing: {e}")
                
                last_modified = os.path.getmtime(file_path)
            
            time.sleep(0.5)  # Check every 0.5 seconds
            
        except KeyboardInterrupt:
            print("\nStopped watching.")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    watch_file()
