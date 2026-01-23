import json

# Read the original dictionary with UTF-8 encoding (handle BOM)
with open('dictionary.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# Convert each entry
for word, entries in data.items():
    for entry in entries:
        for explanation in entry['explanation']:
            # Check if letters is a dict (old format)
            if isinstance(explanation.get('letters'), dict):
                # Convert object to array
                letters_array = []
                for letter, class_name in explanation['letters'].items():
                    letters_array.append({
                        'letter': letter,
                        'class': class_name
                    })
                explanation['letters'] = letters_array

# Write the converted dictionary to a new file
with open('dictionary_converted.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Conversion complete! Check dictionary_converted.json')
