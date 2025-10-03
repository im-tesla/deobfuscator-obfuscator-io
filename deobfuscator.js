const fs = require('fs');
const vm = require('vm');

class Deobfuscator {
    constructor() {
        this.stringArray = [];
        this.decodedStrings = new Map();
    }

    // Decode hex-encoded strings like '\x61\x62\x63' to 'abc'
    decodeHexStrings(code) {
        return code.replace(/(['"])(?:\\x[0-9a-fA-F]{2})+\1/g, (match) => {
            const quote = match[0];
            const cleaned = match.slice(1, -1); // Remove quotes
            let result = '';
            for (let i = 0; i < cleaned.length; i += 4) {
                if (cleaned.substr(i, 2) === '\\x') {
                    result += String.fromCharCode(parseInt(cleaned.substr(i + 2, 2), 16));
                }
            }
            // Escape special characters in the result
            result = result
                .replace(/\\/g, '\\\\')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/'/g, "\\'")
                .replace(/"/g, '\\"');
            return `${quote}${result}${quote}`;
        });
    }

    // Decode concatenated hex strings like '\x61'+'\x62'+'\x63'
    decodeConcatenatedHexStrings(code) {
        let changed;
        do {
            changed = false;
            const newCode = code.replace(/(?:'(?:\\x[0-9a-fA-F]{2})+'\s*\+\s*)+(?:'(?:\\x[0-9a-fA-F]{2})+')/g, (match) => {
                changed = true;
                const parts = match.split(/\s*\+\s*/);
                let result = '';
                for (const part of parts) {
                    const cleaned = part.slice(1, -1); // Remove quotes
                    for (let i = 0; i < cleaned.length; i += 4) {
                        if (cleaned.substr(i, 2) === '\\x') {
                            result += String.fromCharCode(parseInt(cleaned.substr(i + 2, 2), 16));
                        }
                    }
                }
                // Escape special characters in the result
                result = result
                    .replace(/\\/g, '\\\\')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t')
                    .replace(/'/g, "\\'")
                    .replace(/"/g, '\\"');
                return `'${result}'`;
            });
            code = newCode;
        } while (changed);
        return code;
    }

    // Extract string array from function g()
    extractStringArray(code) {
        const arrayMatch = code.match(/function\s+g\s*\(\s*\)\s*{[^}]*const\s+\w+\s*=\s*\[([\s\S]*?)\];/);
        if (arrayMatch) {
            try {
                const arrayContent = arrayMatch[1];
                const sandbox = { result: null };
                const script = new vm.Script(`result = [${arrayContent}]`);
                const context = vm.createContext(sandbox);
                script.runInContext(context);
                this.stringArray = sandbox.result || [];
            } catch (e) {
                console.error('Error extracting string array:', e.message);
            }
        }
    }

    // Simplify function wrappers (proxy functions)
    simplifyFunctionWrappers(code) {
        // Remove function wrappers like: function bd(a,b,c,d,f,j,k,l,m,n){return i(m-0x31d,l);}
        let changed;
        do {
            changed = false;
            const newCode = code.replace(/function\s+\w+\s*\([^)]*\)\s*{\s*return\s+[hi]\s*\([^)]*\);\s*}/g, () => {
                changed = true;
                return '';
            });
            code = newCode;
        } while (changed);
        return code;
    }

    // Remove dead code and anti-debugging
    removeDeadCode(code) {
        // Remove common anti-debugging patterns
        code = code.replace(/if\s*\([^)]*\['test'\]\([^)]*\['toString'\]\(\)\)[^}]*\{[^}]*\}/g, '');
        code = code.replace(/new\s+RegExp\([^)]*\)/g, '/./');
        return code;
    }

    // Decode Base64 and RC4 encrypted strings (h and i functions)
    decodeEncodedStrings(code) {
        // Try to extract and evaluate the h and i functions
        const hFuncMatch = code.match(/function\s+h\s*\([^{]*\{[\s\S]*?return\s+h;\s*\}/);
        const iFuncMatch = code.match(/function\s+i\s*\([^{]*\{[\s\S]*?return\s+i;\s*\}/);
        
        if (hFuncMatch && iFuncMatch) {
            try {
                const sandbox = { 
                    g: () => this.stringArray,
                    h: null,
                    i: null,
                    String: String,
                    Math: Math,
                    Boolean: Boolean,
                    RegExp: RegExp,
                    decodeURIComponent: decodeURIComponent
                };
                
                // Execute the functions in a sandbox
                const script = new vm.Script(`
                    ${hFuncMatch[0]}
                    ${iFuncMatch[0]}
                `);
                const context = vm.createContext(sandbox);
                script.runInContext(context);

                // Store the functions for potential use
                this.hFunc = context.h;
                this.iFunc = context.i;
            } catch (e) {
                console.error('Error decoding encoded strings:', e.message);
            }
        }
        
        return code;
    }

    // Remove array rotation code
    removeArrayRotation(code) {
        // Remove the IIFE that rotates the string array
        code = code.replace(/\(function\s*\([^)]*\)\s*{[^}]*while\s*\([^)]*\)\s*{[^}]*try\s*{[\s\S]*?}[\s\S]*?catch[\s\S]*?}[\s\S]*?}[\s\S]*?}\s*\([^)]*\)\s*;?/g, '');
        return code;
    }

    // Clean up control flow obfuscation
    cleanControlFlow(code) {
        // Simplify hex number arithmetic
        let changed;
        do {
            changed = false;
            const newCode = code.replace(/\(0x[0-9a-fA-F]+(?:\s*[\+\-\*\/]\s*0x[0-9a-fA-F]+)+\)/g, (match) => {
                try {
                    const result = eval(match);
                    changed = true;
                    return result.toString();
                } catch {
                    return match;
                }
            });
            code = newCode;
        } while (changed);
        
        // Simplify simple hex numbers
        code = code.replace(/0x[0-9a-fA-F]+/g, (match) => {
            try {
                return parseInt(match, 16).toString();
            } catch {
                return match;
            }
        });
        
        return code;
    }

    // Format code for better readability
    formatCode(code) {
        // Simplify simple string concatenations like 'a'+'b'+'c'
        let changed;
        do {
            changed = false;
            const newCode = code.replace(/'([^']*)'\s*\+\s*'([^']*)'/g, (match, str1, str2) => {
                changed = true;
                return `'${str1}${str2}'`;
            });
            code = newCode;
        } while (changed);
        
        // Add line breaks after semicolons for readability
        code = code.replace(/;(?=[a-zA-Z_$\[])/g, ';\n');
        
        // Remove excessive whitespace
        code = code.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return code;
    }

    // Main deobfuscation method
    deobfuscate(inputFile, outputFile) {
        console.log('🔧 Starting deobfuscation...');
        
        // Read input file
        let code = fs.readFileSync(inputFile, 'utf8');
        console.log(`📥 Read ${code.length} characters from ${inputFile}`);

        // Step 1: Decode concatenated hex strings (multiple passes)
        console.log('📝 Step 1: Decoding concatenated hex strings...');
        code = this.decodeConcatenatedHexStrings(code);
        
        // Step 2: Decode remaining hex strings
        console.log('📝 Step 2: Decoding hex strings...');
        code = this.decodeHexStrings(code);

        // Step 3: Extract string array
        console.log('📝 Step 3: Extracting string array...');
        this.extractStringArray(code);
        console.log(`   Found ${this.stringArray.length} strings in array`);

        // Step 4: Remove array rotation code
        console.log('📝 Step 4: Removing array rotation code...');
        code = this.removeArrayRotation(code);

        // Step 5: Simplify function wrappers
        console.log('📝 Step 5: Simplifying function wrappers...');
        code = this.simplifyFunctionWrappers(code);

        // Step 6: Decode encoded strings
        console.log('📝 Step 6: Decoding encoded strings...');
        code = this.decodeEncodedStrings(code);

        // Step 7: Remove dead code
        console.log('📝 Step 7: Removing dead code...');
        code = this.removeDeadCode(code);

        // Step 8: Clean up control flow
        console.log('📝 Step 8: Cleaning up control flow...');
        code = this.cleanControlFlow(code);

        // Step 9: Format code
        console.log('📝 Step 9: Formatting code...');
        code = this.formatCode(code);

        // Write output file
        fs.writeFileSync(outputFile, code, 'utf8');
        console.log(`✅ Wrote ${code.length} characters to ${outputFile}`);
        console.log(`📊 Reduction: ${((1 - code.length / fs.statSync(inputFile).size) * 100).toFixed(2)}%`);
        console.log('🎉 Deobfuscation complete!');
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node deobfuscator.js <input_file> <output_file>');
        console.log('Example: node deobfuscator.js obfuscated_script.js deobfuscated_script.js');
        process.exit(1);
    }

    const [inputFile, outputFile] = args;
    
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file '${inputFile}' not found`);
        process.exit(1);
    }

    const deobfuscator = new Deobfuscator();
    deobfuscator.deobfuscate(inputFile, outputFile);
}

module.exports = Deobfuscator;