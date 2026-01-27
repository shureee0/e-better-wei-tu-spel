import json

# Read the dictionary.json file (using utf-8-sig to handle BOM)
with open('dictionary.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# Sort the dictionary by keys alphabetically
sorted_data = dict(sorted(data.items()))

# Write back to the file with proper formatting
with open('dictionary.json', 'w', encoding='utf-8') as f:
    json.dump(sorted_data, f, indent=2, ensure_ascii=False)

print("Dictionary sorted alphabetically!")
