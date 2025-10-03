# JavaScript Deobfuscator for obfuscator.io

A powerful JavaScript deobfuscator designed to handle scripts obfuscated with obfuscator.io, including large files up to 11MB+.

## Features

- ✅ Decodes hex-encoded strings (`\x61\x62\x63`)
- ✅ Decodes concatenated hex strings (`'\x61'+'\x62'+'\x63'`)
- ✅ Extracts and processes string arrays
- ✅ Removes array rotation code
- ✅ Simplifies function wrappers and proxy functions
- ✅ Cleans up control flow obfuscation
- ✅ Removes dead code and anti-debugging tricks
- ✅ Handles large files efficiently (tested with 11MB+ files)
- ✅ Achieves 60-70% file size reduction

## Installation

No installation required! This tool uses only Node.js built-in modules.

## Usage

```bash
node deobfuscator.js <input_file> <output_file>
```

### Example

```bash
node deobfuscator.js obfuscated_script.js deobfuscated_script.js
```

## How It Works

The deobfuscator performs the following steps:

1. **Decode Concatenated Hex Strings** - Combines and decodes strings like `'\x61'+'\x62'+'\x63'` into `'abc'`
2. **Decode Hex Strings** - Converts hex-encoded strings to readable text
3. **Extract String Array** - Identifies and extracts the obfuscated string array
4. **Remove Array Rotation** - Removes the IIFE that shuffles the string array
5. **Simplify Function Wrappers** - Removes proxy functions that wrap the string decoder
6. **Decode Encoded Strings** - Processes Base64 and RC4 encrypted strings
7. **Remove Dead Code** - Eliminates anti-debugging code and unused functions
8. **Clean Control Flow** - Simplifies hex arithmetic and complex expressions
9. **Format Code** - Improves readability with proper formatting

## Performance

- **Small files** (< 1MB): ~1-2 seconds
- **Medium files** (1-5MB): ~3-10 seconds
- **Large files** (5-15MB): ~15-60 seconds

Typical reduction: 60-70% of original file size

## Supported Obfuscation Techniques

- Hex string encoding
- String array obfuscation with rotation
- Function name mangling
- Control flow flattening
- Dead code injection
- Anti-debugging tricks
- RC4/Base64 string encryption

## Limitations

- Some deeply nested obfuscation patterns may not be fully resolved
- Runtime string decryption may require manual analysis
- Self-defending code may need multiple passes

## Example Output

**Before (obfuscated):**
```javascript
'\x68'+'\x65'+'\x6c'+'\x6c'+'\x6f'
```

**After (deobfuscated):**
```javascript
'hello'
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
