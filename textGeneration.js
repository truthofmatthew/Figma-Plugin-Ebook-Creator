
// textgeneration.js
import { colors, fontStyles } from './constants.js';
import { hexToRgb } from './utilities.js';
import { regexPatterns } from './constants.js';


export async function loadFonts() {
    const fontsToLoad = [fontStyles.roxboroughBold, fontStyles.dmSansBold, fontStyles.dmSansRegular];
    await Promise.all(fontsToLoad.map(font => figma.loadFontAsync(font)));
}

let textNodeCounter = 0;

function regexTest(text, patterns) {
    return patterns.some(pattern => pattern.test(text));
}

// function identifyTextType(text) {
//     let type = null;
//     regexPatterns.identifyTextType.forEach(({ pattern, type: patternType }) => {
//         if (pattern.test(text)) {
//             type = patternType;
//         }
//     });
//     return type;
// }

function identifyTextType(text) {
    const trimmedText = text.trim();
    if (regexTest(trimmedText, [/^\*\*(.*?)\*\*$/])) {
        return 'mainTitle';
    }
    if (regexTest(trimmedText, [
        /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/,
        /\*\*(.*?)(?<!\*\*):\*\*$/,
        /^\d+\.\s*\*\*(.*?):\*\*/,
        /^\d+\.\s*\*\*(.*?)\*\*$/
    ])) {
        return 'bulletHeader';
    }
    if (regexTest(trimmedText, [/^(-|\*)\s*\*\*|\*\*/]) || trimmedText.includes('*')) {
        return 'insideText';
    }
    return 'unknown';
}


function extractBulletHeaderNumber(text) {
    const regexPatterns = [
        { pattern: /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/, extract: /^\d+/ },
        { pattern: /\*\*(.*?)(?<!\*\*):\*\*$/, extract: /(\d+):-?\*\*$/ },
        { pattern: /^\d+\.\s*\*\*(.*?):\*\*/, extract: /(\d+)\./ },
        { pattern: /^\d+\.\s*\*\*(.*?)\*\*$/, extract: /(\d+)\./ }
    ];

    let number = null;
    regexPatterns.forEach(({ pattern, extract }) => {
        if (pattern.test(text)) {
            const match = text.match(extract);
            if (match && match[0]) {
                number = match[0].match(/\d+/)[0]; // Ensure we are extracting only the number part
            }
        }
    });

    return number;

}
 
// function extractBulletHeaderNumber(text) {
//     let number = null;
//     regexPatterns.bulletHeaderNumber.forEach(({ pattern, extract }) => {
//         if (pattern.test(text)) {
//             const match = text.match(extract);
//             if (match && match[0]) {
//                 number = match[0].match(/\d+/)[0]; // Ensure we are extracting only the number part
//             }
//         }
//     });

//     return number;
// }

export async function createTextLayer({text, yPos, frame, isDirectlyAfterBullet = false, width = 486, style = "", customXOffset = null, textDirection = 'LTR'}) {
    let xOffset = customXOffset !== null ? customXOffset : 55;
    let margin = 10;
    let bulletNodeY = yPos;
    let bulletNodeHeight = 39;
    let textNodeProperties = [];
    let uniqueName;
    let textType = identifyTextType(text);
    const textNode = figma.createText();
    textNode.x = xOffset;
    textNode.y = yPos;
    let isTitle = false;
    let numberedTextMatch;
    let number, restOfText;
    switch (textType) {
        case 'mainTitle':
            await figma.loadFontAsync(fontStyles.roxboroughBold);
            textNode.fontName = fontStyles.roxboroughBold;
            textNode.fontSize = 32;
            text = text.trim().replace(/^[-\s]*/, '').replace(/^\*\*|\*\*$/g, '');
            textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.highlightedText) }];
            isTitle = true;
            margin = 20;
            break;
        case 'bulletHeader':
            const trimmedText = text.trim();
            let number = extractBulletHeaderNumber(trimmedText);

            const bulletNode = figma.createRectangle();
            bulletNode.resize(39, bulletNodeHeight);
            bulletNode.cornerRadius = 10;
            if (textDirection === 'RTL') {
                bulletNode.x = frame.width - 54 - bulletNode.width - (customXOffset || 0);
            } else {
                bulletNode.x = xOffset;
            }
            bulletNode.y = yPos;
            bulletNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.bulletPointAndText) }];
            uniqueName = `TextNode-${textNodeCounter++}-${Date.now()}`;
            bulletNode.name = uniqueName;
            frame.appendChild(bulletNode);
            const numberNode = figma.createText();
            await figma.loadFontAsync({ family: "Roxborough CF", style: "Bold" });
            numberNode.fontName = { family: "Roxborough CF", style: "Bold" };
            numberNode.fontSize = 32;
            numberNode.characters = number;
            numberNode.x = bulletNode.x + (bulletNode.width / 2) - (numberNode.width / 2);
            numberNode.y = bulletNode.y + (bulletNode.height / 2) - (numberNode.height / 2);
            numberNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.backgroundAndNumber) }];
            uniqueName = `TextNode-${textNodeCounter++}-${Date.now()}`;
            numberNode.name = uniqueName;
            numberNode.textAlignHorizontal = textDirection === 'RTL' ? 'RIGHT' : 'LEFT';
            frame.appendChild(numberNode);
            numberNode.textDirection
            bulletNodeY = bulletNode.y;
            bulletNodeHeight = bulletNode.height;
            xOffset += bulletNode.width + 15;
            isDirectlyAfterBullet = true;
            numberedTextMatch = true;
           
            break;
        case 'insideText':
            await applyMixedStyles(textNode, text);
            textNode.resize(width, textNode.height);
            if (isDirectlyAfterBullet) {
                margin = 5;
                textNode.y = bulletNodeY + 20;
                textNode.textAlignHorizontal = textDirection === 'RTL' ? 'RIGHT' : 'LEFT';
                frame.appendChild(textNode);
                yPos = textNode.y + textNode.height + margin;
                textNodeProperties.push({
                    name: textNode.name,
                    x: textNode.x,
                    y: textNode.y,
                    width: textNode.width,
                    height: textNode.height
                });
                return { yPos: yPos, textNodeProperties };
            }
            uniqueName = `TextNode-${textNodeCounter++}-${Date.now()}`;
            textNode.name = uniqueName;
            textNode.textAlignHorizontal = textDirection === 'RTL' ? 'RIGHT' : 'LEFT';
            frame.appendChild(textNode);
            yPos = textNode.y + textNode.height + margin;
            return { yPos: yPos };
        default:
            await figma.loadFontAsync(fontStyles.dmSansRegular);
            if (isDirectlyAfterBullet) {
                margin = 20;
                textNode.y = bulletNodeY + 20;
                isDirectlyAfterBullet = false;
            }
            textNode.fontName = fontStyles.dmSansRegular;
            textNode.fontSize = 14;
            textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.regularText) }];
            break;
    }
    if (numberedTextMatch) {
        await figma.loadFontAsync(fontStyles.roxboroughBold);
        textNode.fontName = fontStyles.roxboroughBold;
        textNode.fontSize = 16;
        textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.bulletPointAndText) }];
        text = text.replace(/^\d+\.\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1');
        await figma.loadFontAsync(textNode.fontName);
        textNode.characters = text;
        const textNodeHeightEstimate = textNode.height;
        textNode.y = bulletNodeY + (bulletNodeHeight / 2) - (textNodeHeightEstimate / 2);
        margin = 10;
    }
    textNode.x = xOffset;
    if (textDirection === 'RTL' && numberedTextMatch) {
        textNode.x = 0;
    }
    textNode.characters = text;
    textNode.resize(width, textNode.height);
    if (isTitle) {
        await figma.loadFontAsync(textNode.fontName);
        let textHeight = textNode.height;
        while (textHeight > 76 && textNode.fontSize > 8) {
            textNode.fontSize -= 1;
            await figma.loadFontAsync({ family: textNode.fontName.family, style: textNode.fontName.style });
            textNode.resize(width, textNode.height);
            textHeight = textNode.height;
        }
    }
    uniqueName = `TextNode-${textNodeCounter++}-${Date.now()}`;
    textNode.name = uniqueName;
    textNode.textAlignHorizontal = textDirection === 'RTL' ? 'RIGHT' : 'LEFT';
    frame.appendChild(textNode);
    textNodeProperties.push({
        name: textNode.name,
        x: textNode.x,
        y: textNode.y,
        width: textNode.width,
        height: textNode.height
    });
    return { yPos: yPos + textNode.height + margin, textNodeProperties };
}

export async function applyMixedStyles(textNode, text) {
    const regularStyle = { font: fontStyles.dmSansRegular, size: 14, color: hexToRgb(colors.mixedStylesText) };
    const boldStyle = { font: fontStyles.dmSansBold, size: 14, color: hexToRgb(colors.mixedStylesText) };
    await figma.loadFontAsync(regularStyle.font);
    textNode.fontName = regularStyle.font;
    textNode.fontSize = regularStyle.size;
    textNode.fills = [{ type: 'SOLID', color: regularStyle.color }];

    let cleanText = text.replace(/^\s*-\s?|\*{1,2}/g, '');
    textNode.characters = cleanText;

    const applyStyle = async (regex, style) => {
        let match;
        let adjustmentIndex = 0;
        const removedCharsMatch = text.match(/^\s*[-]\s?/);
        const removedCharsCount = removedCharsMatch ? removedCharsMatch[0].length : 0;
        while ((match = regex.exec(text)) !== null) {
            let start = match.index - adjustmentIndex - removedCharsCount;
            let end = start + match[1].length;
            await figma.loadFontAsync(style.font);
            textNode.setRangeFontName(start, end, style.font);
            textNode.setRangeFontSize(start, end, style.size);
            textNode.setRangeFills(start, end, [{ type: 'SOLID', color: style.color }]);
            adjustmentIndex += match[0].length - match[1].length;
        }
    };

    await applyStyle(/\*\*(.+?)\*\*/g, boldStyle);
    await applyStyle(/\*([^\*]+)\*/g, boldStyle);
}



export async function createColumnTextLayers({texts, initialYPos, frame, columnWidths, columnXOffsets, styles}) {
    let yPos = initialYPos;
    let maxTextHeight = 0;
    let textNodeProperties = [];
    for (let index = 0; index < texts.length; index++) {
        const text = texts[index];
        const style = styles[index] || "";
        const width = columnWidths[index];
        const xOffset = columnXOffsets[index];
        let fontToUse = (style === '**') ? fontStyles.roxboroughBold : fontStyles.dmSansRegular;
        let cleanText = (style === '**') ? text.replace(/\*\*/g, '') : text;
        await figma.loadFontAsync(fontToUse);
        const textNode = figma.createText();
        textNode.x = xOffset;
        textNode.y = yPos;
        textNode.resize(width, textNode.height);
        textNode.fontName = fontToUse;
        textNode.characters = cleanText;
        textNode.fills = [{ type: 'SOLID', color: hexToRgb(style === '**' ? colors.highlightedText : colors.regularText) }];
        textNode.textAlignHorizontal = textDirection === 'RTL' ? 'RIGHT' : 'LEFT';
        frame.appendChild(textNode);
        await figma.loadFontAsync(textNode.fontName);
        if (textNode.height + 10 > maxTextHeight) {
            maxTextHeight = textNode.height + 10;
        }
        textNodeProperties.push({
            x: textNode.x,
            y: textNode.y,
            width: textNode.width,
            height: textNode.height
        });
    }
    yPos += maxTextHeight;
    return { yPos, textNodeProperties };
}