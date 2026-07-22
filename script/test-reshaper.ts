import reshaper from 'arabic-reshaper';

const testWord = 'الصحن';
const shaped = reshaper.convertArabic(testWord);
console.log('Shaped word:', shaped);
console.log('Shaped chars:', shaped.split('').map(c => c.charCodeAt(0).toString(16) + ` (${c})`).join(', '));

const reversed = shaped.split('').reverse().join('');
console.log('Reversed word:', reversed);
console.log('Reversed chars:', reversed.split('').map(c => c.charCodeAt(0).toString(16) + ` (${c})`).join(', '));
