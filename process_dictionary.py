from manual_convert import generate
import re

def process_dictionary():
    # Read the dictionary file
    with open('dictionary.json', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match: string1,string2, with surrounding whitespace preserved
    # Captures: leading whitespace, string1, string2, trailing whitespace
    pattern = r'(\s*)([a-zA-Z-.]+)\,([a-zA-Z-.]+)\,(\s*)'
    
    def replacer(match):
        leading_ws = match.group(1)
        string1 = match.group(2)
        string2 = match.group(3)
        trailing_ws = match.group(4)
        
        # Generate the replacement using your converter
        generated = generate(string1, string2).rstrip('\n')
        
        # Preserve the surrounding whitespace
        return leading_ws + generated + trailing_ws
    
    # Replace all matches
    new_content = re.sub(pattern, replacer, content, flags=re.MULTILINE)
    
    # Write back to file
    with open('dictionary.json', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Dictionary processed successfully!")

if __name__ == "__main__":
    process_dictionary()
