for i in range(256):
    binary_str = format(i, '08b')  # binary, zero-padded to 8 digits
    formatted = f"{binary_str[:4]}-{binary_str[4:]}"
    print(formatted)