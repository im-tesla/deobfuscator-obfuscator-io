#!/usr/bin/env node
/**
 * Example usage of the deobfuscator
 */

const Deobfuscator = require('./deobfuscator');
const fs = require('fs');

// Example 1: Basic usage
console.log('Example 1: Basic deobfuscation');
console.log('================================\n');

const deobfuscator = new Deobfuscator();
deobfuscator.deobfuscate('obfuscated_script.js', 'example_output.js');

console.log('\n\nExample 2: Programmatic usage');
console.log('================================\n');

// Example 2: Using the deobfuscator programmatically
const obfuscatedCode = `
(function(){
    const a = '\x68'+'\x65'+'\x6c'+'\x6c'+'\x6f';
    const b = '\x77'+'\x6f'+'\x72'+'\x6c'+'\x64';
    console.log(a, b);
})();
`;

// Write test file
fs.writeFileSync('/tmp/example_obfuscated.js', obfuscatedCode);

// Deobfuscate it
const deobfuscator2 = new Deobfuscator();
deobfuscator2.deobfuscate('/tmp/example_obfuscated.js', '/tmp/example_deobfuscated.js');

// Show result
console.log('\nInput:');
console.log(obfuscatedCode);
console.log('\nOutput:');
console.log(fs.readFileSync('/tmp/example_deobfuscated.js', 'utf8'));

// Cleanup
fs.unlinkSync('/tmp/example_obfuscated.js');
fs.unlinkSync('/tmp/example_deobfuscated.js');
fs.unlinkSync('example_output.js');
