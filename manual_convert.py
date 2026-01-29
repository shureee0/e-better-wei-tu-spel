import pronouncing
import json

def get_stressed_syllables(word):
    """
    Gets stressed syllable positions for a word using CMU Pronouncing Dictionary.
    Returns a list of syllable indices (1-based) that are stressed.
    """
    phones = pronouncing.phones_for_word(word.lower())
    
    if not phones:
        return []
    
    phone = phones[0]
    stresses = pronouncing.stresses(phone)
    stressed_syllables = [i + 1 for i, stress in enumerate(stresses) if stress in ['1', '2']]
    
    return stressed_syllables

multigraphs = [
    # trigraphs
    "arr", "err", "irr", "orr", "urr",
    "eur", "ier", "our",
    
    # digraphs
    "ar", "ai", "ay", "ao", "au",
    "bb",
    "cc", "ch",
    "dd",
    "er", "êr", "ei", "ey", "eu",
    "ff",
    "gg",
    "ir", "îr", "ie",
    "kk",
    "ll",
    "mm",
    "nn", "ng",
    "or", "oi", "oy", "ou",
    "pp",
    "ss", "sc", "sh",
    "tt", "th",
    "ur", "ûr", "ue",
    "vv",
    "wh",
    "zz", "zh",

    # single
    "j", "x"
]

def generate(a, b) -> str:
    stressed_syllables = get_stressed_syllables(a)
    all_letters = []
    
    vowels = set('aeiouâêîôû')
    
    # separate groups by "-" (optional)
    dash_groups = b.split('-')
    
    syllable = 1
    
    for group in dash_groups:
        letters = []  # Process each group independently
        
        # splitting digraphs by "."
        dot_segments = group.split('.')
        
        for segment in dot_segments:
            i = 0
            while i < len(segment):
                found_multigraph = False
                
                # check for multigraphs
                for multigraph in multigraphs:
                    if segment[i:i+len(multigraph)].lower() == multigraph:
                        letter_text = segment[i:i+len(multigraph)]
                        
                        # letter object
                        letter_obj = {"letter": letter_text}
                        
                        # check if it's a vowel or consonant digraph (based off of the first character)
                        first_char = letter_text[0].lower()
                        if first_char in vowels:
                            # vowel (check if stressed)
                            letter_obj["type"] = "vowel"
                            if syllable in stressed_syllables:
                                letter_obj["stressed"] = True
                            else:
                                letter_obj["stressed"] = False
                            syllable += 1
                        else:
                            # consonant
                            letter_obj["type"] = "consonant"
                            letter_obj["double"] = True
                        
                        letters.append(letter_obj)
                        i += len(multigraph)
                        found_multigraph = True
                        break
                
                # single character
                if not found_multigraph:
                    letter_text = segment[i]
                    letter_obj = {"letter": letter_text}
                    
                    # check if vowel or consonant
                    if letter_text.lower() in vowels:
                        # vowel (check if stressed)
                        if syllable in stressed_syllables:
                            letter_obj["type"] = "stressed"
                        else:
                            letter_obj["type"] = "unstressed"
                        syllable += 1  # for the next vowel
                    else:
                        letter_obj["type"] = "consonant"
                    
                    letters.append(letter_obj)
                    i += 1

        # rules
        # apply the rules from algorithm.txt here
        
        def count_future_vowels(index):
            """Count how many vowels appear after the given index"""
            count = 0
            for j in range(index + 1, len(letters)):
                if letters[j].get("type") in ["stressed", "unstressed", "vowel"]:
                    count += 1
            return count
        
        def is_last_vowel(index):
            """Check if this is the last vowel in the word"""
            for j in range(index + 1, len(letters)):
                if letters[j].get("type") in ["stressed", "unstressed", "vowel"]:
                    return False
            return True
        
        def is_last_letter(index):
            """Check if this is the last letter in the word"""
            return index == len(letters) - 1
        
        def get_next_letter(index):
            """Get the next letter object, or None"""
            if index + 1 < len(letters):
                return letters[index + 1]
            return None
        
        def get_prev_letter(index):
            """Get the previous letter object, or None"""
            if index - 1 >= 0:
                return letters[index - 1]
            return None
        
        # Apply algorithm rules to each letter
        for i, letter_obj in enumerate(letters):
            letter_text = letter_obj["letter"].lower()
            is_vowel = letter_obj.get("type") in ["stressed", "unstressed", "vowel"]
            is_stressed = letter_obj.get("stressed", False) or letter_obj.get("type") == "stressed"
            
            # Check if vowel with circumflex
            if is_vowel and ('â' in letter_text or 'ê' in letter_text or 'î' in letter_text or 'ô' in letter_text or 'û' in letter_text):
                base_letter = letter_text.replace('â', 'a').replace('ê', 'e').replace('î', 'i').replace('ô', 'o').replace('û', 'u')
                letter_obj["class"] = f"{base_letter}-long"
                continue
            
            # Check if U following Q or G
            if letter_text == 'u':
                prev = get_prev_letter(i)
                next_letter = get_next_letter(i)
                if prev and next_letter and prev["letter"].lower() in ['q', 'g'] and next_letter.get("type") in ["stressed", "unstressed", "vowel"]:
                    letter_obj["class"] = "u-semivowel"
                    continue
            
            # Plain vowel rules
            if is_vowel and letter_text in 'iuaeo':
                next_letter = get_next_letter(i)
                
                # Is it followed by a vowel?
                if next_letter and next_letter.get("type") in ["stressed", "unstressed", "vowel"]:
                    if letter_text == 'i' and not is_stressed:
                        letter_obj["class"] = "i-long-prevocalic-unstressed"
                    else:
                        letter_obj["class"] = f"{letter_text}-long-prevocalic"
                    continue
                
                # Is it the last letter?
                if letter_text != "a" and is_last_letter(i):
                    if letter_text == 'i' and not is_stressed:
                        letter_obj["class"] = "i-long-final-unstressed"
                    else:
                        letter_obj["class"] = f"{letter_text}-long-final"
                    continue
                
                # Is it stressed?
                if is_stressed:
                    future_vowels = count_future_vowels(i)
                    if future_vowels > 1:
                        letter_obj["class"] = f"{letter_text}-short"
                    else:
                        # Is it the last vowel?
                        if is_last_vowel(i):
                            letter_obj["class"] = f"{letter_text}-short-final"
                        else:
                            # Is it followed by a double consonant?
                            if next_letter and next_letter.get("double", False):
                                letter_obj["class"] = f"{letter_text}-short-medial"
                            else:
                                # Following the following character, is it a vowel?
                                if next_letter and next_letter.get("type") == "consonant":
                                    next_next = get_next_letter(i + 1)
                                    if next_next and next_next.get("type") in ["stressed", "unstressed", "vowel"]:
                                        letter_obj["class"] = f"{letter_text}-long-medial"
                                    else:
                                        letter_obj["class"] = f"{letter_text}-short-medial"
                                else:
                                    letter_obj["class"] = f"{letter_text}-short-medial"
                else:
                    # Unstressed
                    if letter_text not in ['e', 'i']:
                        letter_obj["class"] = f"{letter_text}-weak"
                    else:
                        # E or I unstressed
                        if i == 0:
                            letter_obj["class"] = f"{letter_text}-weak-initial"
                        elif letter_text == 'e' and next_letter and next_letter["letter"].lower() in ['l', 'm', 'n']:
                            letter_obj["class"] = "e-weak-presonorant"
                        else:
                            letter_obj["class"] = f"{letter_text}-weak"
                continue
            
            # Vowel with double RR
            if is_vowel and 'rr' in letter_text:
                if is_stressed:
                    letter_obj["class"] = letter_text
                else:
                    letter_obj["class"] = f"{letter_text}-weak"
                continue
            
            # IE digraph
            if letter_text == 'ie':
                if is_stressed:
                    letter_obj["class"] = "ie"
                else:
                    letter_obj["class"] = "ie-unstressed"
                continue
            
            # EU or EUR
            if letter_text in ['eu', 'eur']:
                prev = get_prev_letter(i)
                if prev and prev["letter"].lower() in ['t', 'd', 's', 'c', 'z', 'l', 'n']:
                    letter_obj["class"] = f"{letter_text}-softening"
                else:
                    letter_obj["class"] = letter_text
                continue

            # Vowel with R (but not RR)
            if is_vowel and 'r' in letter_text and not any(x in letter_text for x in ['rr', 'ei', 'ie', 'ou', 'ue']):
                next_letter = get_next_letter(i)
                
                if is_stressed:
                    # Is it followed by a vowel?
                    if next_letter and next_letter.get("type") in ["stressed", "unstressed", "vowel"]:
                        future_vowels = count_future_vowels(i)
                        if future_vowels > 1:
                            letter_obj["class"] = f"{letter_text}-derhoticized"
                        else:
                            if letter_text not in ['ar', 'or']:
                                letter_obj["class"] = f"{letter_text}-long"
                            else:
                                letter_obj["class"] = letter_text
                    else:
                        if letter_text not in ['ar', 'or']:
                            letter_obj["class"] = f"{letter_text}-short"
                        else:
                            letter_obj["class"] = letter_text
                else:
                    # Unstressed with R
                    if i == 0 and letter_text in ['ar', 'or'] and next_letter and next_letter.get("type") == "consonant":
                        letter_obj["class"] = f"{letter_text}-initial"
                    else:
                        letter_obj["class"] = f"{letter_text}-weak"
                continue
            
            # Consonant rules
            if letter_obj.get("type") == "consonant":
                next_letter = get_next_letter(i)
                prev_letter = get_prev_letter(i)
                
                # H after a vowel and not before a vowel
                if letter_text == 'h':
                    prev_is_vowel = prev_letter and prev_letter.get("type") in ["stressed", "unstressed", "vowel"]
                    next_is_vowel = next_letter and next_letter.get("type") in ["stressed", "unstressed", "vowel"]
                    if prev_is_vowel and not next_is_vowel:
                        letter_obj["class"] = "h-silent"
                        continue

                # T, D, S, C, Z, L, or N followed by EU
                if letter_text in ['t', 'd', 's', 'c', 'z', 'l', 'n']:
                    if next_letter and next_letter["letter"].lower() in ['eu', 'eur']:
                        letter_obj["class"] = f"{letter_text}-eu"
                        continue
                
                # T, TT, D, or DD followed by R
                if letter_text in ['t', 'tt', 'd', 'dd']:
                    if next_letter and next_letter["letter"].lower() == 'r':
                        letter_obj["class"] = f"{letter_text.replace('tt', 't').replace('dd', 'd')}-r"
                        continue
                    
                    # Between stressed and unstressed vowel
                    if prev_letter and prev_letter.get("stressed", False):
                        if next_letter and next_letter.get("type") in ["unstressed", "vowel"] and not next_letter.get("stressed", False):
                            letter_obj["class"] = f"{letter_text.replace('tt', 't').replace('dd', 'd')}-intervocalic"
                            continue
                
                # N before K or G
                if letter_text == 'n':
                    if next_letter and next_letter["letter"].lower() in ['k', 'g']:
                        letter_obj["class"] = "n-velar"
                        continue
                
                # S after B, D, G, or V
                if letter_text == 's':
                    if prev_letter and prev_letter["letter"].lower() in ['b', 'd', 'g', 'ng', 'v']:
                        letter_obj["class"] = "s-voiced"
                        continue
                
                # F followed by Z
                if letter_text == 'f':
                    if next_letter and next_letter["letter"].lower() == 'z':
                        letter_obj["class"] = "f-z"
                        continue
                
                # X followed by C or Z
                if letter_text == 'x':
                    if next_letter and next_letter["letter"].lower() in ['c', 'z']:
                        if next_letter["letter"].lower() == 'c':
                            letter_obj["class"] = "x-c"
                        else:
                            letter_obj["class"] = "x-z"
                        continue

                # TH (assuming it's always voiceless)
                if letter_text == 'th':
                    letter_obj["class"] = "th-voiceless"
                    continue
            
            # Default: class = letter itself
            if "class" not in letter_obj:
                letter_obj["class"] = letter_text
        
        # Apply vowel-consonant combining rules
        i = 0
        while i < len(letters):
            current = letters[i]
            letter_text = current.get("letter", "").lower()
            current_class = current.get("class", "")
            
            # Rule 1: S, C, T, Z, D, G, L followed by i-long-prevocalic-unstressed, then unstressed vowel
            if letter_text in ['s', 'c', 't', 'z', 'd', 'g', 'l'] and current.get("type") == "consonant":
                if i + 2 < len(letters):
                    next_letter = letters[i + 1]
                    next_next_letter = letters[i + 2]
                    
                    if (next_letter.get("class") == "i-long-prevocalic-unstressed" and 
                        next_next_letter.get("type") == "unstressed"):
                        # Merge: change current letter to <letter>i
                        letters[i]["letter"] = letter_text + "i"
                        letters[i]["class"] = letter_text + "i"
                        # Remove the i-long-prevocalic-unstressed letter
                        letters.pop(i + 1)
                        i += 1
                        continue
            
            # Rule 2: C followed by e-long-final OR (e-weak then T)
            if letter_text == 'c' and current.get("type") == "consonant":
                if i + 1 < len(letters):
                    next_letter = letters[i + 1]
                    
                    # Case 1: followed by e-long-final AND it's the end
                    if next_letter.get("class") == "e-long-final" and i + 1 == len(letters) - 1:
                        letters[i]["letter"] = "ce"
                        letters[i]["class"] = "ce"
                        letters.pop(i + 1)
                        i += 1
                        continue
                    
                    # Case 2: followed by e-weak then T AND it's the end
                    if i + 2 < len(letters):
                        next_next_letter = letters[i + 2]
                        if (next_letter.get("class") == "e-weak" and 
                            next_next_letter.get("letter", "").lower() == 't' and
                            i + 2 == len(letters) - 1):
                            letters[i]["letter"] = "ce"
                            letters[i]["class"] = "ce"
                            letters.pop(i + 1)
                            i += 1
                            continue
            
            # Rule 3: J followed by e-long-final OR (e-weak then D)
            if letter_text == 'j' and current.get("type") == "consonant":
                if i + 1 < len(letters):
                    next_letter = letters[i + 1]
                    
                    # Case 1: followed by e-long-final AND it's the end
                    if next_letter.get("class") == "e-long-final" and i + 1 == len(letters) - 1:
                        letters[i]["letter"] = "je"
                        letters[i]["class"] = "je"
                        letters.pop(i + 1)
                        i += 1
                        continue
                    
                    # Case 2: followed by e-weak then D AND it's the end
                    if i + 2 < len(letters):
                        next_next_letter = letters[i + 2]
                        if (next_letter.get("class") == "e-weak" and 
                            next_next_letter.get("letter", "").lower() == 'd' and
                            i + 2 == len(letters) - 1):
                            letters[i]["letter"] = "je"
                            letters[i]["class"] = "je"
                            letters.pop(i + 1)
                            i += 1
                            continue
            
            i += 1

        # Add this group's letters to the complete list
        all_letters.extend(letters)

    # Read from the letters.json (<letter> / pronunciation / diaphoneme) to get accurate IPA transcription. Then add "reading" tag (just as in the dictionary.json)
    with open('letters.json', 'r', encoding='utf-8') as f:
        letters_data = json.load(f)
    
    # Build the reading string by concatenating all diaphonemes
    reading_parts = []
    for letter_obj in all_letters:
        letter_class = letter_obj.get("class", "")
        
        # Look up the class in letters.json
        if letter_class in letters_data:
            pronunciation = letters_data[letter_class].get("pronunciation", {})
            diaphoneme = pronunciation.get("diaphoneme", "")
            
            if diaphoneme:
                # Add stress mark if the vowel is stressed
                is_stressed = letter_obj.get("stressed") == True or letter_obj.get("type") == "stressed"
                if is_stressed:
                    # Add combining acute accent to the first character
                    diaphoneme = diaphoneme[0] + '\u0301' + diaphoneme[1:]
                reading_parts.append(diaphoneme)
    
    combined_reading = "".join(reading_parts)

    # dot and dash extermination!!
    b = b.replace('.', '').replace('-', '')
    
    # remove all the extra info
    for letter_obj in all_letters:
        letter_obj.pop("type", None)
        letter_obj.pop("stressed", None)
        letter_obj.pop("double", None)
    
    # Format letters for JSON output
    letters_json = ",\n            ".join([str(letter).replace("'", '"') for letter in all_letters])
    
    output = f'''\"{a}\": [
    {{
      \"spelling\": \"{b}\",
      \"explanation\": [
        {{
          \"letters\": [
            {letters_json}
          ],
          \"reading\": \"{combined_reading}\"
        }}
      ]
    }}
  ],'''
    return output