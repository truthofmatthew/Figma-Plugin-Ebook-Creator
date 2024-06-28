/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./constants.js
// constants.js




const regexPatterns = {
  bulletHeaderNumber: [
      { pattern: /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/ },
      { pattern: /\*\*(.*?)(?<!\*\*):\*\*$/ },
      { pattern: /^\d+\.\s*\*\*(.*?):\*\*/ },
      { pattern: /^\d+\.\s*\*\*(.*?)\*\*$/ }
  ],
  identifyTextType: [
      { pattern: /^\*\*(.*?)\*\*$/, type: 'mainTitle' },
      { pattern: /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/, type: 'bulletHeader' },
      { pattern: /\*\*(.*?)(?<!\*\*):\*\*$/, type: 'bulletHeader' },
      { pattern: /^\d+\.\s*\*\*(.*?):\*\*/, type: 'bulletHeader' },
      { pattern: /^\d+\.\s*\*\*(.*?)\*\*$/, type: 'bulletHeader' },
      { pattern: /^(-|\*)\s*\*\*|\*\*/, type: 'insideText' },
      { pattern: /\*/, type: 'insideText' }
  ]
};


const colors = {
    regularText: "#0B5465", // For regular text without any styles
    highlightedText: "#027998", // For text between ** **
    bulletPointAndText: "#B30109", // For the bullet point and the text in front of it
    mixedStylesText: "#CE5057", // For texts that have mixed styles
    backgroundAndNumber: "#FFFBEF", // For the background of the frames and the text number inside of the bullet point
    greyPlaceHolder: "#CCCCCC",
  };

const fontStyles = {
    roxboroughBold: { family: 'Roxborough CF', style: 'Bold' },
    dmSansBold: { family: 'DM Sans', style: 'Bold' },
    dmSansRegular: { family: 'DM Sans', style: 'Regular' },
  };

  /* harmony default export */ const constants = ({
    uiWidth: 400,
    minFrameSize: [400, 300], 
 
  });
;// CONCATENATED MODULE: ./utilities.js
// utilities.js
function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
;// CONCATENATED MODULE: ./textGeneration.js

// textgeneration.js





async function loadFonts() {
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

async function createTextLayer({text, yPos, frame, isDirectlyAfterBullet = false, width = 486, style = "", customXOffset = null, textDirection = 'LTR'}) {
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

async function applyMixedStyles(textNode, text) {
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



async function createColumnTextLayers({texts, initialYPos, frame, columnWidths, columnXOffsets, styles}) {
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
;// CONCATENATED MODULE: ./templates/createTableOfContents.js
 
 



async function createTableOfContents_loadFonts() {
    await Promise.all([
        figma.loadFontAsync(fontStyles.roxboroughBold),
        figma.loadFontAsync(fontStyles.dmSansBold),
        figma.loadFontAsync(fontStyles.dmSansRegular),
    ]);
}

// New function to generate a table of contents
async function createTableOfContents(rawEntries, frame) {
    await createTableOfContents_loadFonts(); // Ensure all necessary fonts are loaded

    let yPos = 160; // Initial Y position for the ToC title
    const numberXOffset = 85; // X offset for numbers, to align them to the left
    const textXOffset = 128; // X offset for ToC text entries, to align them next to the numbers

    // Filter and process entries to match the pattern "number. **Header**"
    const tocEntries = rawEntries.filter(entry => entry.match(/^\d+\.\s+\*\*(.*?)\*\*/)).map(entry => {
        const [_, number, header] = entry.match(/^(\d+)\.\s+\*\*(.*?)\*\*/);
        return { number, header };
    });

    // Iterate through processed ToC entries and create corresponding text layers
    for (let entry of tocEntries) {
        // Create number layer
        await createTextLayerForTOC(entry.number, yPos, frame, "number", numberXOffset);
        // Create text layer for the ToC entry
        await createTextLayerForTOC(entry.header, yPos, frame, "text", textXOffset);
        yPos += 30; // Increment Y position for the next entry
    }

    // Draw a line after the last ToC entry
    // Adjust the line drawing logic as per your needs; example provided below
    
    drawVerticalLine(160, yPos, frame);
}

async function createTextLayerForTOC(text, yPos, frame, type, xOffset) {
    const textNode = figma.createText();
    await figma.loadFontAsync(type === "number" ? fontStyles.dmSansBold : fontStyles.dmSansRegular);
    textNode.x = xOffset;
    textNode.y = yPos;
    textNode.fontName = type === "number" ? fontStyles.dmSansBold : fontStyles.dmSansRegular;
    textNode.fontSize = 14;
    textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.regularText) }];
    textNode.characters = text;
    frame.appendChild(textNode);
}

function drawVerticalLine(yStart, yEnd, frame) {
    const xPosition = 112; // Midpoint between numbers and headers
    const lineHeight = Math.abs(yEnd - yStart); // Ensure a positive, non-zero length

    // Figma's createLine() method actually creates a horizontal line by default.
    // To create a vertical line, we'll adjust the line by setting its height directly
    // and use a rectangle instead to simulate a line, as Figma lines don't have a 'height'.
    const line = figma.createRectangle();
    line.resize(2, lineHeight); // Use a minimal width (1) to simulate a line's appearance
    line.x = xPosition;
    line.y = yStart;
    line.fills = [{ type: 'SOLID', color: hexToRgb(colors.mixedStylesText) }];
    // line.strokeWeight = 2; // This will not affect rectangles, used if opting for actual lines

    frame.appendChild(line);
}


// // Utility function to draw a line
// function drawVerticalLine(yStart, yEnd, frame) {
//     // Calculate the vertical line's position and height based on ToC entries
//     const xPosition = 112; // Midpoint between numbers and headers for the vertical line
//     const lineHeight = Math.abs(yEnd - yStart); // Total height spanned by the ToC entries

//     const line = figma.createLine();
//     line.resize(2, lineHeight);
//     line.x = xPosition;
//     line.y = yStart;
//     line.strokes = [{ type: 'SOLID', color: hexToRgb(colors.mixedStylesText) }];
//     line.strokeWeight = 2; // Adjust the stroke weight as needed

//     frame.appendChild(line);
// }



// Assuming createTextLayer function exists and is modified to handle "number" and "header" types

;// CONCATENATED MODULE: ./templates/createBulletPointPage_One.js




async function createBulletPointPage_One(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position
    let isDirectlyAfterBullet = false;
    let textLayerResult; // To capture the result from createTextLayer
    let isBulletText;
    // Create text layers, assuming bullet point logic is incorporated in createTextLayer
    for (const text of texts) {
        textLayerResult = await createTextLayer({
            text: text,
            yPos: yPos,
            frame: frame,
            textDirection: textDirection,
            isDirectlyAfterBullet: isDirectlyAfterBullet
        } );

        if (createBulletPointPage_One_identifyTextType(text) === 'bulletHeader') {
            isDirectlyAfterBullet = true;
        } else {
            // If not a bullet header, ensure isDirectlyAfterBullet is false for the next iteration
            isDirectlyAfterBullet = false;
        }
 
        yPos = textLayerResult.yPos;

    }

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
function createBulletPointPage_One_identifyTextType(text) {
    const trimmedText = text.trim();

    // Main Titles: Text strictly within ** at the start and end
    // if (trimmedText.startsWith('**') && trimmedText.endsWith('**')) {
    if (trimmedText.startsWith('**') && trimmedText.endsWith('**') && !trimmedText.includes(':')) {

        return 'mainTitle';
    }

    // Identify bullet headers, both "1. **text**:" and "**text 1:**" formats
    // Adjusting Bullet Headers regex to be more inclusive
    // Matches "1. **text**:" format
    // const bulletHeaderRegex1 = /^\d+\.\s*\*\*(.*?)\*\*:/;
    // // Matches "**text 1:**" format more reliably
    // // const bulletHeaderRegex2 = /\*\*(.*?)\*\*\s\d+:$/;

    // const bulletHeaderRegex2 = /\*\*-?.*?\d+:-?\*\*$/;
    const bulletHeaderRegex1 = /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/;
    const bulletHeaderRegex2 = /\*\*(.*?)(?<!\*\*):\*\*$/;
    const bulletHeaderRegex3 = /^\d+\.\s*\*\*(.*?):\*\*/;
    const bulletHeaderRegex4 = /^\d+\.\s*\*\*(.*?)\*\*/;
    if (bulletHeaderRegex1.test(trimmedText)) {
        return 'bulletHeader';
    } else if (bulletHeaderRegex2.test(trimmedText)) {
        return 'bulletHeader';
    }else if (bulletHeaderRegex3.test(trimmedText)) { // Check for "**Example:**" format
        return 'bulletHeader';
    }else if (bulletHeaderRegex4.test(trimmedText)) { // Check for "**Example:**" format
        return 'bulletHeader';
    }
 
    // regexPatterns.bulletHeader.forEach(({ pattern }) => {
    //     if (pattern.test(trimmedText)) {
    //         return 'bulletHeader';
    //     }
    // });

    const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
        return 'insideText';
    }
    // Default to 'unknown' if none of the above categories match
    return 'unknown';
}
 
;// CONCATENATED MODULE: ./templates/createSimple_Title_Desc_Image.js



async function createSimple_Title_Desc_Image(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer

    // Create the first text layer and update yPos based on its actual height
    if (texts.length > 0) {
        textLayerResult = await createTextLayer({
            text: texts[0],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
        yPos = textLayerResult.yPos; // Update yPos with the returned value
    }

    // Create the second text layer and update yPos similarly
    if (texts.length > 1) {
        textLayerResult = await createTextLayer({
            text: texts[1],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
        yPos = textLayerResult.yPos; // Update yPos with the returned value
    }

    // Now, yPos points to the position just below the second text layer
    let placeholderStartYPos = yPos + 20; // Adjust yPos for the start of the placeholder
    let heightAdjustment = frame.height - placeholderStartYPos - 88; // Calculate adjusted height for the placeholder

    // Check if the adjusted height is sufficient for the placeholder
    if (heightAdjustment >= 150) {
        // If the height is 150px or more, create the placeholder with the adjusted height
        createImagePlaceholder(frame, placeholderStartYPos, 486, heightAdjustment);
    }
    // If the adjusted height is less than 150px, you might decide not to create the placeholder or handle it differently
}

;// CONCATENATED MODULE: ./templates/createSimple_Title_Desc.js


async function createSimple_Title_Desc(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer
    
    // Create the first text layer and update yPos based on its actual height
    for (let i = 0; i < texts.length; i++) {
        
        textLayerResult = await createTextLayer({
            text: texts[i],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
        yPos = textLayerResult.yPos; 
    }

    // // Create the second text layer and update yPos similarly
    // if (texts.length > 1) {
    //     textLayerResult = await textGeneration.createTextLayer(texts[1], yPos, frame);
    //     yPos = textLayerResult.yPos; // Update yPos with the returned value
    // }


}

;// CONCATENATED MODULE: ./templates/createSimple_Image_Title_Desc.js



async function createSimple_Image_Title_Desc(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    // Initially, calculate the space needed for the text layers from the bottom up
    const bottomMargin = 88; // Margin from the bottom of the frame to the start of the text
    let textLayerHeightTotal = 0; // To accumulate the total height of the text layers
    
    // Placeholder for storing text node properties for later adjustment if needed
    let textNodeProperties = [];
    let textLayerResult;
    let placeholderLayerResult;
    
    for (let i = 0; i < texts.length; i++) {
        let yPos = frame.height - bottomMargin - textLayerHeightTotal;
    
        textLayerResult = await createTextLayer({
            text: texts[i],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
    
        textLayerHeightTotal += textLayerResult.textNodeProperties[0].height + (i < texts.length - 1 ? 20 : 0);
    
        textNodeProperties.push(textLayerResult.textNodeProperties[0]); // Use unshift to add at the beginning
    }
    

    // Calculate the starting Y position for the placeholder based on the remaining space
    let spaceAboveTextLayers = frame.height - bottomMargin - textLayerHeightTotal - 65; // 65 is the starting Y position

    // Create the placeholder if there's enough space
    if (spaceAboveTextLayers > 0) {
        placeholderLayerResult = createImagePlaceholder(frame, 65, 486, spaceAboveTextLayers - 20); // Subtract 20px margin above the placeholder
        textNodeProperties.push({name: placeholderLayerResult.name, y: placeholderLayerResult.y});
         

    }

     
    textNodeProperties.forEach(prop => {

        console.log(`Name: ${prop.name}, Y Position: ${prop.y}`);
    });
    
    let newYPosition = placeholderLayerResult.y + placeholderLayerResult.height + 20;
    textNodeProperties.forEach(prop => {
        if (prop.name !== placeholderLayerResult.name) {
            moveTextNodeByName([frame], prop.name, newYPosition); // Assuming frame is the root node you're modifying
            newYPosition += prop.height + 20;
        }
    });
 
    
}

function moveTextNodeByName(nodes, name, newYPosition) {
    nodes.forEach(node => {
        if (node.type === 'TEXT' && node.name === name) {
            node.y = newYPosition;
        }
        if (node.children && node.children.length > 0) {
            moveTextNodeByName(node.children, name, newYPosition);
        }
    });
}
;// CONCATENATED MODULE: ./templates/createSimple_Desc_Image.js



async function createSimple_Desc_Image(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer

    // Create the first text layer and update yPos based on its actual height
    if (texts.length > 0) {
        textLayerResult = await createTextLayer({
            text: texts[0],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
        yPos = textLayerResult.yPos; // Update yPos with the returned value
    }

    // Now, yPos points to the position just below the second text layer
    let placeholderStartYPos = yPos + 20; // Adjust yPos for the start of the placeholder
    let heightAdjustment = frame.height - placeholderStartYPos - 88; // Calculate adjusted height for the placeholder

    // Check if the adjusted height is sufficient for the placeholder
    if (heightAdjustment <= 150) {
        heightAdjustment = 150;
    }
    createImagePlaceholder(frame, placeholderStartYPos, 486, heightAdjustment);

    // If the adjusted height is less than 150px, you might decide not to create the placeholder or handle it differently
}

;// CONCATENATED MODULE: ./templates/createSimple_Image_Desc.js



async function createSimple_Image_Desc(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    // Initially, calculate the space needed for the text layers from the bottom up
    const bottomMargin = 88; // Margin from the bottom of the frame to the start of the text
    let textLayerHeightTotal = 0; // To accumulate the total height of the text layers
    
    // Placeholder for storing text node properties for later adjustment if needed
    let textNodeProperties = [];
    let textLayerResult;
    let placeholderLayerResult;
    
    // for (let i = 0; i < texts.length; i++) {
    //     let yPos = frame.height - bottomMargin - textLayerHeightTotal;
    
    //     textLayerResult = await textGeneration.createTextLayer(texts[i], yPos, frame);
    
    //     textLayerHeightTotal += textLayerResult.textNodeProperties[0].height + (i < texts.length - 1 ? 20 : 0);
    
    //     textNodeProperties.push(textLayerResult.textNodeProperties[0]); // Use unshift to add at the beginning
    // }

    if (texts.length > 0) {
        let yPos = frame.height - bottomMargin - textLayerHeightTotal;
    
        textLayerResult = await createTextLayer({
            text: texts[0],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
    
        textLayerHeightTotal += textLayerResult.textNodeProperties[0].height;
    
        textNodeProperties.push(textLayerResult.textNodeProperties[0]); // Update yPos with the returned value
    }
    

    // Calculate the starting Y position for the placeholder based on the remaining space
    let spaceAboveTextLayers = frame.height - bottomMargin - textLayerHeightTotal - 65; // 65 is the starting Y position

   

    if (spaceAboveTextLayers <= 150) {
        spaceAboveTextLayers = 150;
    }
    placeholderLayerResult = createImagePlaceholder(frame, 65, 486, spaceAboveTextLayers - 20); // Subtract 20px margin above the placeholder
    textNodeProperties.push({name: placeholderLayerResult.name, y: placeholderLayerResult.y});
     
     
    textNodeProperties.forEach(prop => {

        console.log(`Name: ${prop.name}, Y Position: ${prop.y}`);
    });
    
    let newYPosition = placeholderLayerResult.y + placeholderLayerResult.height + 20;
    textNodeProperties.forEach(prop => {
        if (prop.name !== placeholderLayerResult.name) {
            createSimple_Image_Desc_moveTextNodeByName([frame], prop.name, newYPosition); // Assuming frame is the root node you're modifying
            newYPosition += prop.height + 20;
        }
    });
 
    
}

function createSimple_Image_Desc_moveTextNodeByName(nodes, name, newYPosition) {
    nodes.forEach(node => {
        if (node.type === 'TEXT' && node.name === name) {
            node.y = newYPosition;
        }
        if (node.children && node.children.length > 0) {
            createSimple_Image_Desc_moveTextNodeByName(node.children, name, newYPosition);
        }
    });
}
;// CONCATENATED MODULE: ./templates/createSimple_Title_Desc_Image_ColumnStyle.js



async function createSimple_Title_Desc_Image_ColumnStyle(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers

    let xPos = 55; // Starting X position
    let layerWidth = 486; // Fixed width for each layer
    let layerHeight = 699; // Fixed height for the image placeholder
    const marginBetweenLayers = 40; // Margin between layers

    let textLayerResult; // To capture the result from createTextLayer

    // Assuming you want to adjust the yPos for text layers for aesthetic reasons
    let yPos = 65; // You can adjust this based on your layout needs

    // Iterate through texts and create text layers at specified positions
    for (let i = 0; i < texts.length; i++) {
        textLayerResult = await createTextLayer({
            text: texts[i],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        } );
        // No need to update yPos here since we're stacking horizontally
        // Update xPos for the next layer, including the margin
        xPos += layerWidth + marginBetweenLayers;
        if (i === 0) {
            yPos = textLayerResult.yPos;
            layerWidth = 230;
            layerHeight = layerHeight - textLayerResult.textNodeProperties[0].height;
        }
    }

    // Assuming you want only one image placeholder after the text layers
    // if (xPos + layerWidth <= frame.width) { // Check if there's enough space for the placeholder
        createImagePlaceholder(frame, yPos, layerWidth, layerHeight, 305);
    // } else {
    //     // Handle case where there isn't enough space for another layer
    //     console.log("Not enough space for another layer");
    // }

    // If you have more elements to add, continue adjusting xPos as above
}

;// CONCATENATED MODULE: ./templates/createPagePlaceholder.js


async function createPagePlaceholder(texts, frame) {
   
    // Assuming you don't need to create text layers before the placeholder in this scenario,
    // and you want the placeholder to respect the 55px margin from each side.

    let margin = 55; // Margin from each side
    // let placeholderXPos = margin; // X position starts at the left margin
    let placeholderWidth = frame.width - (margin * 2); // Width is frame width minus margins on both sides
    let placeholderYPos = margin; // Start Y position at the top margin
    let placeholderHeight = frame.height - (margin * 2); // Height is frame height minus top and bottom margins
 
    // Create a placeholder within the frame with specified margins
    createImagePlaceholder(frame, placeholderYPos, placeholderWidth, placeholderHeight);
}

;// CONCATENATED MODULE: ./templates/createTwoColumn_One.js



async function createTwoColumn_One(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        textLayerResult = await createTextLayer({
            text: `**${texts[0]}**`,
            yPos: yPos,
            frame: frame,
            width: frame.width - 110,
            textDirection: textDirection,
            style:  "**"
        });
        
        yPos = textLayerResult.yPos ; // Adjust space after the title
    }
    let columnCreationResult;
    // Create two columns for the next two lines of text
    if (texts.length > 2) {
        const columnWidths = [230, 230]; // Width for both columns
        const columnXOffsets = [55, 340]; // X offset for the second column assumes a 55 margin and a 45 margin between columns
        const styles = ["", ""]; // No specific styles for these texts
        
        
 
        columnCreationResult = await createColumnTextLayers({
            texts: [texts[1], texts[2]],
            initialYPos: yPos,
            frame: frame,
            columnWidths: columnWidths,
            columnXOffsets: columnXOffsets,
            styles: styles
        });
        yPos = columnCreationResult.yPos; // Update yPos with the returned value

    }
    let placeholderHeight = frame.height - yPos - 55; // Adjust based on yPos and bottom margin

    if (placeholderHeight >= 150) {
        // If the height is 150px or more, create the placeholder with the adjusted height
    createImagePlaceholder(frame, yPos, frame.width - 110, Math.max(150, placeholderHeight)); // Ensure a minimum height
    }
    
    // After the text layers, calculate the dynamic height for the placeholder
}

;// CONCATENATED MODULE: ./templates/createTwoColumn_Two.js



async function createTwoColumn_Two(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        textLayerResult = await createTextLayer({
            text: `**${texts[0]}**`,
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: false,
            width: frame.width - 110,
            textDirection: textDirection,
            style:  "**"
        });
        yPos = textLayerResult.yPos ; // Adjust space after the title
    }
    let columnCreationResult;
    // Create two columns for the next two lines of text
    if (texts.length > 2) {
        const columnWidths = [230, 230]; // Width for both columns
        const columnXOffsets = [55, 340]; // X offset for the second column assumes a 55 margin and a 45 margin between columns
        const styles = ["", ""]; // No specific styles for these texts
        
        // Call createColumnTextLayers for the second and third lines
        columnCreationResult = await createColumnTextLayers({
            texts: [texts[1], texts[2]],
            initialYPos: yPos,
            frame: frame,
            columnWidths: columnWidths,
            columnXOffsets: columnXOffsets,
            styles: styles
        });
        yPos = columnCreationResult.yPos; // Update yPos with the returned value
    }

    let placeholderHeight = frame.height - yPos - 55; // Adjust based on yPos and bottom margin

    // Placeholder adjustment
    let placeholder;
    if (placeholderHeight >= 150) {
        // If the height is 150px or more, create the placeholder
        placeholder = createImagePlaceholder(frame, yPos + 20, frame.width - 110, Math.max(150, placeholderHeight)); // Ensure a minimum height
        yPos += placeholder.height + 20; // Adjust yPos for the placeholder with a 20px margin
    }

    // Adjusting text layers positions after placeholder
    if (columnCreationResult) {
        for (const textProperty of columnCreationResult.textNodeProperties) {
            const foundNodes = frame.findAll(node => node.type === "TEXT" && node.x === textProperty.x && node.y === textProperty.y);
            foundNodes.forEach(node => {
               
                node.y += placeholder ? placeholder.height + 20 : 0; // Adjust each text node position
            });
        }
    }


    // Ensure the placeholder is positioned correctly
    if (placeholder) {
        placeholder.y = columnCreationResult.textNodeProperties[0].y ; // Position placeholder below the first layer with a 20 margin
    }
}
;// CONCATENATED MODULE: ./templates/createTwoColumn_Three.js



async function createTwoColumn_Three(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Text Layer 1 with ** style
    if (texts.length > 0) {
        textLayerResult = await createTextLayer({
            text: `**${texts[0]}**`,
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: true,
            width: frame.width - 110,
            textDirection: textDirection,
            style:  "**"
        });
        yPos = textLayerResult.yPos; // Adjust space after the title
    }

    // Text Layer 2 (regular text)
    if (texts.length > 1) {
        textLayerResult = await createTextLayer({
            text: texts[1],
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: false,
            width: frame.width - 110,
            textDirection: textDirection,
            style:  "**"
        });
        yPos = textLayerResult.yPos + 10; // Space before potentially adding a placeholder
    }

    // Check for space for the placeholder
    let spaceForPlaceholder = true; // A condition to check if there's enough space (you might need a calculation here)
    let columnCreationResult;
    let placeholder;
    if (spaceForPlaceholder) {
        // Create a placeholder if there's enough space
        placeholder = createImagePlaceholder(frame, yPos, frame.width - 110, 110); // Assuming 110px is the height for the placeholder
        yPos += 110 +20 ; // Adjust yPos after the placeholder, with a 20px margin
    }

    // Text Layer 3 with ** style
    if (texts.length > 3) {
        textLayerResult = await createTextLayer({
            text: `**${texts[2]}**`,
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: true,
            width: frame.width - 110,
            textDirection: textDirection,
            style:  "**"
        });
        yPos = textLayerResult.yPos; // Adjust space after the text
    }

    // Two columns of text (Text Layer 4 and 5)
    if (texts.length > 4) {
        const columnWidths = [230, 230];
        const columnXOffsets = [55, 340];
        const styles = ["", ""]; // Assuming these texts don't have special styles

        // Call createColumnTextLayers for the two column texts
        let columnCreationResult = await createColumnTextLayers({
            texts: [texts[3], texts[4]],
            initialYPos: yPos,
            frame: frame,
            columnWidths: columnWidths,
            columnXOffsets: columnXOffsets,
            styles: styles
        });
        yPos = columnCreationResult.yPos; // Update yPos with the returned value
    }

    let placeholderHeight = frame.height - yPos - 55; // Adjust based on yPos and bottom margin
 

    // Adjusting text layers positions after placeholder
    if (columnCreationResult) {
        for (const textProperty of columnCreationResult.textNodeProperties) {
            const foundNodes = frame.findAll(node => node.type === "TEXT" && node.x === textProperty.x && node.y === textProperty.y);
            foundNodes.forEach(node => {
               
                node.y += placeholder ? placeholder.height + 20 : 0; // Adjust each text node position
            });
        }
    }

}

;// CONCATENATED MODULE: ./templates/createTwoColumn_Four.js





async function createTwoColumn_Four(texts, frame, textDirection) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title text
    let textLayerResult;
    // ** Style Text Layer (Title)
    if (texts.length > 0) {
        textLayerResult = await createTextLayer({
            text: `**${texts[0]}**`,
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: true,
            width: frame.width - 110,
            textDirection: textDirection,
            style:  "**"
        });
        yPos = textLayerResult.yPos ; // Adjust space after the title for the divider or next content
    }

    // Divider (Thin rectangle to simulate the divider line)
    const divider = figma.createRectangle();
    divider.resize(frame.width - 110, 3); // Width of the frame minus margins, height is 3px for the line
    divider.x = 46; // Align with the left column text
    divider.y = yPos;
    divider.fills = [{ type: 'SOLID', color: hexToRgb("#0B5465") }]; // Match the color in your HTML/CSS
    frame.appendChild(divider);
    yPos += 24; // Adjust space after the divider

    // Two Columns of Text
    if (texts.length > 1) {
        const columnWidths = [230, 230]; // Width for both columns
        const columnXOffsets = [46, 305]; // X offset for both columns
        const styles = ["", ""]; // Assuming regular text style for both columns
        
        // Assuming texts[1] and texts[2] contain the content for the two columns
        // This call might need adjustment based on how your text generation functions are set up
        await createColumnTextLayers({
            texts: [texts[1], texts[2]],
            initialYPos: yPos,
            frame: frame,
            columnWidths: columnWidths,
            columnXOffsets: columnXOffsets,
            styles: styles
        });
    }

    // Further adjustments or text layers can be added here...
}
;// CONCATENATED MODULE: ./templates/createTwoColumn_Five.js



async function createTwoColumn_Five(texts, frame, textDirection) {
    await loadFonts(); // Ensure all necessary fonts are loaded

    // Initial setup for title and columns
    let yPos = 65; // Starting Y position for the title
    let titleWidth = frame.width - 110; // Adjust title width
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        // Title
        textLayerResult = await createTextLayer({
            text: `**${texts[0]}**`,
            yPos: yPos,
            frame: frame,
            width: titleWidth,
            textDirection: textDirection,
            style:  "**"
        });
        yPos = textLayerResult.yPos; // Space after the title before columns start
    }

    // Column setup
    const columnWidth = 230;
    const gapBetweenColumns = 45;
    const column1XOffset = 55;
    const column2XOffset = column1XOffset + columnWidth + gapBetweenColumns;

    // Ensure there are at least 3 texts provided for title and two columns
    if (texts.length >= 3) {
        // Create columns for the second and third lines of text
        // Column 1
        textLayerResult = await createTextLayer({
            text: texts[1],
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: false,
            width: columnWidth,
            textDirection: textDirection,
            style:  "",
            customXOffset: column1XOffset
        });
        
        yPos = textLayerResult.yPos; 
        // Column 2, yPos not updated because it should start at the same Y as column 1
        await createTextLayer({
            text: texts[2],
            yPos: yPos,
            frame: frame,
            isDirectlyAfterBullet: false,
            width: columnWidth,
            textDirection: textDirection,
            style:  "",
            customXOffset: column2XOffset
        });

        // After columns, adjust yPos for the placeholder. Assuming a fixed height for text layers, adjust if necessary
       // Assuming 251px is the height of columns + 20px space after columns
    }

    // Placeholder below the columns
    // createImagePlaceholder(frame, yPos, frame.width - 110, frame.height - yPos - 55); // Adjust placeholder height dynamically based on yPos
}

;// CONCATENATED MODULE: ./templates/index.js
// templates/index.js

























;// CONCATENATED MODULE: ./frameGeneration.js





async function createFramesAndAddText(texts, textDirection) {
    await figma.loadAllPagesAsync();
    await loadFonts();
    let xOffset = 0, pageNumber = 1, maxRight = 0;

    figma.currentPage.children.forEach(node => {
        if (node.type === "FRAME") {
            maxRight = Math.max(maxRight, node.x + node.width);
            const match = node.name.match(/^Page (\d+)$/);
            if (match) pageNumber = Math.max(pageNumber, parseInt(match[1], 10) + 1);
        }
    });

    xOffset = maxRight + 50;
    let { textGroups, templatesToUse } = processTextsForPagesAndTemplates(texts);

    for (let i = 0; i < textGroups.length; i++) {
        const frame = figma.createFrame();
        frame.resize(595, 842);
        frame.x = xOffset;
        frame.y = 0;
        frame.fills = [{ type: 'SOLID', color: hexToRgb(colors.backgroundAndNumber) }];
        frame.name = `Page ${pageNumber}`;
        const group = textGroups[i];
        if (group !== null) await templatesToUse[i](group, frame, textDirection);
        xOffset += 595 + 50;
        pageNumber++;
    }
    if (templatesToUse.length > 0) figma.notify("Text layers and frames created successfully.");
}

function processTextsForPagesAndTemplates(texts) {
    const allTemplates = [
        { template: createTableOfContents, use: 'toc' },
        { template: createSimple_Title_Desc_Image_ColumnStyle, use: 'intro' },
        { template: createSimple_Title_Desc, use: 'simpletext' },
        { template: createSimple_Image_Desc, use: 'image-desc' },
        { template: createBulletPointPage_One, use: 'bullet' },
        { template: createTwoColumn_One, use: 'two-column-1' },
        { template: createTwoColumn_Two, use: 'two-column-2' },
        { template: createTwoColumn_Three, use: 'two-column-3' },
        { template: createTwoColumn_Four, use: 'two-column-4' },
        { template: createTwoColumn_Five, use: 'two-column-5' },
        { template: createSimple_Desc_Image, use: 'image' },
        { template: createSimple_Title_Desc_Image, use: 'overview' },
        { template: createSimple_Image_Title_Desc, use: 'highlight' },
        { template: createPagePlaceholder, use: 'placeholder' },
    ];

    let templatesToUse = [], cleanedTexts = [], sliceSizes = [], currentPageLines = 0, markerFound = false;

    texts.forEach(text => {
        const markerMatch = text.match(/^#>page-(.*?)<#$/);
        if (markerMatch) {
            if (markerFound) sliceSizes.push(currentPageLines);
            else markerFound = true;
            currentPageLines = 0;
            const pageType = markerMatch[1].trim().toLowerCase();
            const templateMatch = allTemplates.find(t => t.use === pageType);
            if (templateMatch) templatesToUse.push(templateMatch.template);
        } else if (markerFound) {
            cleanedTexts.push(text);
            currentPageLines++;
        }
    });

    if (currentPageLines > 0) sliceSizes.push(currentPageLines);
    let textGroups = generateTextGroups(cleanedTexts, sliceSizes);
    return { textGroups, templatesToUse };
}

function generateTextGroups(cleanedTexts, sliceSizes) {
    let groups = [], startIndex = 0;
    sliceSizes.forEach(size => {
        groups.push(cleanedTexts.slice(startIndex, startIndex + size));
        startIndex += size;
    });
    return groups;
}

function createImagePlaceholder(frame, startY, width, height, xPos = 55) {
    const placeholder = figma.createRectangle();
    placeholder.resize(width, height);
    placeholder.y = startY;
    placeholder.x = xPos;
    placeholder.fills = [{ type: 'SOLID', color: hexToRgb(colors.greyPlaceHolder) }];
    placeholder.cornerRadius = 25;
    frame.appendChild(placeholder);
}

;// CONCATENATED MODULE: ./code.js
// code.js 




figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
        case 'resize-ui':
            figma.ui.resize(constants.uiWidth, msg.height);
            break;
        case 'create-text-layers':
            const texts = msg.text.split('\n').filter(line => line.trim() !== '');
            await createFramesAndAddText(texts, msg.textDirection);
            break;
        case 'notify':
            figma.notify(msg.message);
            break;
    }
};

/******/ })()
;