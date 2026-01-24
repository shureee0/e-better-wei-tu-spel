from pynput import keyboard
import pyperclip
import time
import re

buffer = ""

def generate(a, b):
    output = f"  \"{a}\": [\n    {{\n      \"spelling\": \"{b}\"\n    }}\n  ],\n"
    return output

def on_press(key):
    global buffer

    try:
        buffer += key.char
    except AttributeError:
        return

    match = re.search(r"(\w+)\/(\w+)\/$", buffer)
    if match:
        a, b = match.groups()

        # remove typed trigger
        for _ in range(len(match.group(0))):
            keyboard.Controller().press(keyboard.Key.backspace)
            keyboard.Controller().release(keyboard.Key.backspace)

        # generate text
        result = generate(a, b)

        pyperclip.copy(result)
        time.sleep(0.05)

        # paste
        ctrl = keyboard.Key.ctrl
        keyboard.Controller().press(ctrl)
        keyboard.Controller().press('v')
        keyboard.Controller().release('v')
        keyboard.Controller().release(ctrl)

        buffer = ""

listener = keyboard.Listener(on_press=on_press)
listener.start()
listener.join()