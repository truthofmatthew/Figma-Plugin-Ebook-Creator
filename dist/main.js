/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./constants.js
// constants.js
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

;// CONCATENATED MODULE: ./utilities.js
// utilities.js
function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
;// CONCATENATED MODULE: ./textGeneration.js
// textGeneration.js



async function loadFonts() {
    await Promise.all([
        figma.loadFontAsync(fontStyles.roxboroughBold),
        figma.loadFontAsync(fontStyles.dmSansBold),
        figma.loadFontAsync(fontStyles.dmSansRegular),
    ]);
}
let textNodeCounter = 0;


// function startsAndEndsWithBoldMarkers(text) {
//     const trimmedText = text.trim();
//     // Regex to match text that starts with optional leading characters followed by '**', and optionally ends with '**'
//     const boldRegex = /^[-\s]*\*\*(.+?)\*\*$/;
//     return boldRegex.test(trimmedText);
// } o##$#$$#$#$$#$#$#$# >>>> old but important

function startsAndEndsWithBoldMarkers(text) {
    const boldRegex = /^\*\*(.*?)\*\*$/;
    return boldRegex.test(text);
}

function identifyTextType(text) {
    const trimmedText = text.trim();

    // Main Titles: Text strictly within ** at the start and end
    // if (trimmedText.startsWith('**') && trimmedText.endsWith('**')) {
    // if (trimmedText.startsWith('**') && trimmedText.endsWith('**') && !trimmedText.includes(':')) {

    //     return 'mainTitle';
    // }
    if (startsAndEndsWithBoldMarkers(trimmedText)) {
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
    // const bulletHeaderRegex3 = /\*\*(.*?)\*\*:/;
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

    // // Bullet Headers: Numbered or bulleted items followed by bold text
    // const bulletHeaderRegex = /^(\d+\.|-)\s*\*\*.*?\*\*:/;
    // if (bulletHeaderRegex.test(trimmedText)) {
    //     return 'bulletHeader';
    // }

    // Text under bullets or inside text that might need bold processing
    // This includes text starting with "-", "*", or text that includes "**" anywhere
    // const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    // if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
    //     return 'insideText';
    // }
    const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
        return 'insideText';
    }
    // Default to 'unknown' if none of the above categories match
    return 'unknown';
}

let isDirectlyAfterBullet;
async function createTextLayer(text, yPos, frame, isDirectlyAfterBullet = false, width = 486, style = "", customXOffset = null) {
    let xOffset = customXOffset !== null ? customXOffset : 55; // Use customXOffset if provided, else default to 55
    let margin = 10; // Default margin for text
    let bulletNodeY = yPos; // Initialize with yPos, will update if bullet is created
    let bulletNodeHeight = 39; // Initialize with the bullet node's height
    let textNodeProperties = []; // Array to store properties of each text node created
    let uniqueName;
    let textType = identifyTextType(text);
    const textNode = figma.createText();
    textNode.x = xOffset;
    // Initially set yPos for textNode; it will be conditionally adjusted below
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
            //  numberedTextMatch = text.match(/^(\d+)\.\s*(.*)/);

            // const number = numberedTextMatch[1];
            // const restOfText = numberedTextMatch[2];
             const trimmedText = text.trim();
            // const bulletHeaderRegex1 = /^\d+\.\s*\*\*(.*?)\*\*:/;
            // // Adjusted to match "**-Example-1:-**" and "**Example 1:**" formats
            // const bulletHeaderRegex2 = /\*\*-?.*?\d+:-?\*\*$/;

            const bulletHeaderRegex1 = /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/;
            const bulletHeaderRegex2 = /\*\*(.*?)(?<!\*\*):\*\*$/;
            const bulletHeaderRegex3 = /^\d+\.\s*\*\*(.*?):\*\*/;
            const bulletHeaderRegex4 = /^\d+\.\s*\*\*(.*?)\*\*/;

            if (bulletHeaderRegex1.test(trimmedText)) {

                number = trimmedText.match(/^\d+/)[0];
             } else if (bulletHeaderRegex2.test(trimmedText)) {

                number = trimmedText.match(/(\d+):-?\*\*$/)[1];
             }else if (bulletHeaderRegex3.test(trimmedText)) {  
                number = trimmedText.match(/(\d+)\./)[1];
     }else if (bulletHeaderRegex4.test(trimmedText)) {  
        number = trimmedText.match(/(\d+)\./)[1];
 }



            // Create bullet (rounded rectangle) for the number
            const bulletNode = figma.createRectangle();
            bulletNode.resize(39, bulletNodeHeight); // Bullet size
            bulletNode.cornerRadius = 10; // Rounded corners
            bulletNode.x = xOffset;
            bulletNode.y = yPos;
            bulletNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.bulletPointAndText) }];
            uniqueName = `TextNode-${textNodeCounter++}-${Date.now()}`;
            bulletNode.name = uniqueName;
            frame.appendChild(bulletNode);

            // Create text node for the number
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
            frame.appendChild(numberNode);

            bulletNodeY = bulletNode.y;
            bulletNodeHeight = bulletNode.height;

            // Adjust the X position for the rest of the text
            xOffset += bulletNode.width + 15; // Space between bullet and text
            isDirectlyAfterBullet = true;
            numberedTextMatch = true;
            break;
        case 'insideText':
            await applyMixedStyles(textNode, text);
            textNode.resize(width, textNode.height); // Adjust width

            // Apply the 10-unit margin from bullet point only if directly after a bullet
            if (isDirectlyAfterBullet) {
                margin = 5;
                textNode.y = bulletNodeY + 20; // Adjust yPos for this specific case
                // isDirectlyAfterBullet = false; // Reset the flag after use
                frame.appendChild(textNode);
                // Adjust yPos for next text layer, including margin from the adjusted position of mixed style text
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
            frame.appendChild(textNode);
            // Adjust yPos for next text layer, including margin from the adjusted position of mixed style text
            yPos = textNode.y + textNode.height + margin;
            return { yPos: yPos };


        // case 'unknown':
        //     // Process text that might need bold processing but is not a main title
        //     await figma.loadFontAsync(fontStyles.dmSansRegular);
        //     textNode.fontName = fontStyles.dmSansRegular;
        //     textNode.fontSize = 14;
        //     textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.regularText) }];
        //     break;
        default:

            await figma.loadFontAsync(fontStyles.dmSansRegular);
            if (isDirectlyAfterBullet) {
                margin = 20;
                textNode.y = bulletNodeY + 20; // Adjust yPos for this specific case
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


        // Calculate vertical centering relative to bulletNode's position and height
        await figma.loadFontAsync(textNode.fontName); // Ensure font is loaded to calculate height
        textNode.characters = text;
        const textNodeHeightEstimate = textNode.height; // Use an estimate or calculate based on font metrics
        textNode.y = bulletNodeY + (bulletNodeHeight / 2) - (textNodeHeightEstimate / 2);

        margin = 10;
    }
    textNode.x = xOffset;

    textNode.characters = text;
    // textNode.resize(486 - (xOffset - 55), textNode.height); // Adjust the width based on the xOffset
    textNode.resize(width, textNode.height); // Use the provided width

    if (isTitle) {
        await figma.loadFontAsync(textNode.fontName); // Ensure the font is loaded

        let textHeight = textNode.height; // Measure the initial height
        while (textHeight > 76 && textNode.fontSize > 8) { // Continue until height is <= 76 or fontSize is at a minimum
            textNode.fontSize -= 1; // Decrease font size
            await figma.loadFontAsync({ family: textNode.fontName.family, style: textNode.fontName.style }); // Ensure font is loaded after size change
            textNode.resize(width, textNode.height); // Adjust the width to recalculate the height
            textHeight = textNode.height; // Update the height for the loop condition
        }
    }


    uniqueName = `TextNode-${textNodeCounter++}-${Date.now()}`;
    textNode.name = uniqueName;
    frame.appendChild(textNode);

    // Capture properties of the created text node
    textNodeProperties.push({
        name: textNode.name,
        x: textNode.x,
        y: textNode.y,
        width: textNode.width,
        height: textNode.height
    });

    // Calculate and return the new Y position for the next text node
    return { yPos: yPos + textNode.height + margin, textNodeProperties };

}



 

async function applyMixedStyles(textNode, text) {
    // Load the regular font first
    await figma.loadFontAsync(fontStyles.dmSansRegular);
    textNode.fontName = fontStyles.dmSansRegular;
    textNode.fontSize = 14;
    textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.mixedStylesText) }]; // Assuming you want the regular text color

    // Calculate the number of characters to be removed
    const removedCharsMatch = text.match(/^\s*[-]\s?/);
    const removedCharsCount = removedCharsMatch ? removedCharsMatch[0].length : 0;

    // Remove " - " at the start and "*" throughout the text for initial clean text
    let cleanText = text.replace(/^\s*-\s?|\*{1,2}/g, '');

    
    textNode.characters = cleanText;

    
    let matchDouble;
    const boldDoubleRegex = /\*\*(.+?)\*\*/g;
    let adjustmentIndexDouble = 0; 
    while ((matchDouble = boldDoubleRegex.exec(text)) !== null) {
        let boldTextStart = matchDouble.index - adjustmentIndexDouble - removedCharsCount; // Adjust based on removed characters and previous adjustments
        let boldTextEnd = boldTextStart + matchDouble[1].length;
        await figma.loadFontAsync(fontStyles.dmSansBold);
        textNode.setRangeFontName(boldTextStart, boldTextEnd, fontStyles.dmSansBold);
        textNode.setRangeFontSize(boldTextStart, boldTextEnd, 14);
        textNode.setRangeFills(boldTextStart, boldTextEnd, [{ type: 'SOLID', color: hexToRgb(colors.mixedStylesText) }]);
        adjustmentIndexDouble += matchDouble[0].length - matchDouble[1].length; // Correctly adjust for the length of the bold markers
    }
    
    let match;
    const boldRegex = /\*([^\*]+)\*/g;
    let adjustmentIndex = 0; 
    while ((match = boldRegex.exec(text)) !== null) {
        let boldTextStart = match.index - adjustmentIndex - removedCharsCount; // Adjust based on removed characters and previous adjustments
        let boldTextEnd = boldTextStart + match[1].length;
        await figma.loadFontAsync(fontStyles.dmSansBold);
        textNode.setRangeFontName(boldTextStart, boldTextEnd, fontStyles.dmSansBold);
        textNode.setRangeFontSize(boldTextStart, boldTextEnd, 14);
        textNode.setRangeFills(boldTextStart, boldTextEnd, [{ type: 'SOLID', color: hexToRgb(colors.mixedStylesText) }]);
        adjustmentIndex += match[0].length - match[1].length; // Correctly adjust for the length of the bold markers
    }
}


async function createColumnTextLayers(texts, initialYPos, frame, columnWidths, columnXOffsets, styles) {
    let yPos = initialYPos;
    let maxTextHeight = 0; // Track the maximum height of text nodes
    let textNodeProperties = []; // Array to store properties of each text node


    for (let index = 0; index < texts.length; index++) {
        const text = texts[index];
        const style = styles[index] || "";
        const width = columnWidths[index];
        const xOffset = columnXOffsets[index];

        let fontToUse = (style === '**') ? fontStyles.roxboroughBold : fontStyles.dmSansRegular;
        let cleanText = (style === '**') ? text.replace(/\*\*/g, '') : text;

        // Ensure the font is loaded for the text node you are about to create
        await figma.loadFontAsync(fontToUse);

        const textNode = figma.createText();
        textNode.x = xOffset;
        textNode.y = yPos;
        textNode.resize(width, textNode.height); // Use specified width for the column
        textNode.fontName = fontToUse;
        textNode.characters = cleanText;
        textNode.fills = [{ type: 'SOLID', color: hexToRgb(style === '**' ? colors.highlightedText : colors.regularText) }];

        frame.appendChild(textNode);

        // Wait for Figma to render the text node to calculate its height accurately
        await figma.loadFontAsync(textNode.fontName);
        if (textNode.height + 10 > maxTextHeight) {
            maxTextHeight = textNode.height + 10; // Update if this text node is taller
        }
        // Save each text node's properties
        textNodeProperties.push({
            x: textNode.x,
            y: textNode.y,
            width: textNode.width,
            height: textNode.height
        });
    }

    // After both columns are created, update yPos using the maximum text height
    yPos += maxTextHeight;

    return { yPos, textNodeProperties }; // Return the updated yPos for further use
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



async function createBulletPointPage_One(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position
    let isDirectlyAfterBullet = false;
    let textLayerResult; // To capture the result from createTextLayer
    let isBulletText;
    // Create text layers, assuming bullet point logic is incorporated in createTextLayer
    for (const text of texts) {
        textLayerResult = await createTextLayer(text, yPos, frame, isDirectlyAfterBullet);

        if (createBulletPointPage_One_identifyTextType(text) === 'bulletHeader') {
            isDirectlyAfterBullet = true;
        } else {
            // If not a bullet header, ensure isDirectlyAfterBullet is false for the next iteration
            isDirectlyAfterBullet = false;
        }
 
        yPos = textLayerResult.yPos;

    }

}


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
    // // Bullet Headers: Numbered or bulleted items followed by bold text
    // const bulletHeaderRegex = /^(\d+\.|-)\s*\*\*.*?\*\*:/;
    // if (bulletHeaderRegex.test(trimmedText)) {
    //     return 'bulletHeader';
    // }

    // Text under bullets or inside text that might need bold processing
    // This includes text starting with "-", "*", or text that includes "**" anywhere
    // const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    // if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
    //     return 'insideText';
    // }
    const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
        return 'insideText';
    }
    // Default to 'unknown' if none of the above categories match
    return 'unknown';
}
// export async function BulletPointPage_One(texts, frame) {
//     await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
//     let yPos = 65; // Starting Y position
//     let isDirectlyAfterBullet = false;

//     // Create text layers, assuming bullet point logic is incorporated in createTextLayer
//     for (const text of texts) {
//         yPos = await textGeneration.createTextLayer(text, yPos, frame, isDirectlyAfterBullet); // true indicates bullet style
//         const isBulletText = text.match(/^\d+\.\s+/);
//         isDirectlyAfterBullet = !!isBulletText;
//     }
// }
;// CONCATENATED MODULE: ./templates/createSimple_Title_Desc_Image.js



async function createSimple_Title_Desc_Image(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer

    // Create the first text layer and update yPos based on its actual height
    if (texts.length > 0) {
        textLayerResult = await createTextLayer(texts[0], yPos, frame);
        yPos = textLayerResult.yPos; // Update yPos with the returned value
    }

    // Create the second text layer and update yPos similarly
    if (texts.length > 1) {
        textLayerResult = await createTextLayer(texts[1], yPos, frame);
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


async function createSimple_Title_Desc(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer
    
    // Create the first text layer and update yPos based on its actual height
    for (let i = 0; i < texts.length; i++) {
        
        textLayerResult = await createTextLayer(texts[i], yPos, frame);
        yPos = textLayerResult.yPos; 
    }

    // // Create the second text layer and update yPos similarly
    // if (texts.length > 1) {
    //     textLayerResult = await textGeneration.createTextLayer(texts[1], yPos, frame);
    //     yPos = textLayerResult.yPos; // Update yPos with the returned value
    // }


}

;// CONCATENATED MODULE: ./templates/createSimple_Image_Title_Desc.js



async function createSimple_Image_Title_Desc(texts, frame) {
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
    
        textLayerResult = await createTextLayer(texts[i], yPos, frame);
    
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



async function createSimple_Desc_Image(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer

    // Create the first text layer and update yPos based on its actual height
    if (texts.length > 0) {
        textLayerResult = await createTextLayer(texts[0], yPos, frame);
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



async function createSimple_Image_Desc(texts, frame) {
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
    
        textLayerResult = await createTextLayer(texts[0], yPos, frame);
    
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



async function createSimple_Title_Desc_Image_ColumnStyle(texts, frame) {
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
        textLayerResult = await createTextLayer(texts[i], yPos, frame, false, layerWidth);
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

    // Log the calculated values to debug
console.log(`Width: ${frame.width}, Placeholder Width: ${placeholderWidth}`);
console.log(`Height: ${frame.height}, Placeholder Height: ${placeholderHeight}`);


    // Create a placeholder within the frame with specified margins
    createImagePlaceholder(frame, placeholderYPos, placeholderWidth, placeholderHeight);
}

;// CONCATENATED MODULE: ./templates/createTwoColumn_One.js



async function createTwoColumn_One(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        textLayerResult = await createTextLayer(`**${texts[0]}**`, yPos, frame, false, frame.width - 110, "**");
        yPos = textLayerResult.yPos ; // Adjust space after the title
    }
    let columnCreationResult;
    // Create two columns for the next two lines of text
    if (texts.length > 2) {
        const columnWidths = [230, 230]; // Width for both columns
        const columnXOffsets = [55, 340]; // X offset for the second column assumes a 55 margin and a 45 margin between columns
        const styles = ["", ""]; // No specific styles for these texts
        
        // Call createColumnTextLayers for the second and third lines
        columnCreationResult = await createColumnTextLayers([texts[1], texts[2]], yPos, frame, columnWidths, columnXOffsets, styles);
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



async function createTwoColumn_Two(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        textLayerResult = await createTextLayer(`**${texts[0]}**`, yPos, frame, false, frame.width - 110, "**");
        yPos = textLayerResult.yPos ; // Adjust space after the title
    }
    let columnCreationResult;
    // Create two columns for the next two lines of text
    if (texts.length > 2) {
        const columnWidths = [230, 230]; // Width for both columns
        const columnXOffsets = [55, 340]; // X offset for the second column assumes a 55 margin and a 45 margin between columns
        const styles = ["", ""]; // No specific styles for these texts
        
        // Call createColumnTextLayers for the second and third lines
        columnCreationResult = await createColumnTextLayers([texts[1], texts[2]], yPos, frame, columnWidths, columnXOffsets, styles);
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



async function createTwoColumn_Three(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Text Layer 1 with ** style
    if (texts.length > 0) {
        textLayerResult = await createTextLayer(`**${texts[0]}**`, yPos, frame, true, frame.width - 110, "**");
        yPos = textLayerResult.yPos; // Adjust space after the title
    }

    // Text Layer 2 (regular text)
    if (texts.length > 1) {
        textLayerResult = await createTextLayer(texts[1], yPos, frame, false, frame.width - 110);
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
        textLayerResult = await createTextLayer(`**${texts[2]}**`, yPos, frame, true, frame.width - 110, "**");
        yPos = textLayerResult.yPos; // Adjust space after the text
    }

    // Two columns of text (Text Layer 4 and 5)
    if (texts.length > 4) {
        const columnWidths = [230, 230];
        const columnXOffsets = [55, 340];
        const styles = ["", ""]; // Assuming these texts don't have special styles

        // Call createColumnTextLayers for the two column texts
        let columnCreationResult = await createColumnTextLayers([texts[3], texts[4]], yPos, frame, columnWidths, columnXOffsets, styles);
        yPos = columnCreationResult.yPos; // Update yPos with the returned value
    }

    let placeholderHeight = frame.height - yPos - 55; // Adjust based on yPos and bottom margin

    
    // if (placeholderHeight >= 150) {
    //     // If the height is 150px or more, create the placeholder
    //     placeholder = createImagePlaceholder(frame, yPos + 20, frame.width - 110, Math.max(150, placeholderHeight)); // Ensure a minimum height
    //     yPos += placeholder.height + 20; // Adjust yPos for the placeholder with a 20px margin
    // }

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





async function createTwoColumn_Four(texts, frame) {
    await loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title text
    let textLayerResult;
    // ** Style Text Layer (Title)
    if (texts.length > 0) {
        textLayerResult = await createTextLayer(`**${texts[0]}**`, yPos, frame, true, frame.width - 110, "**");
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
        await createColumnTextLayers([texts[1], texts[2]], yPos, frame, columnWidths, columnXOffsets, styles);
    }

    // Further adjustments or text layers can be added here...
}
;// CONCATENATED MODULE: ./templates/createTwoColumn_Five.js



async function createTwoColumn_Five(texts, frame) {
    await loadFonts(); // Ensure all necessary fonts are loaded

    // Initial setup for title and columns
    let yPos = 65; // Starting Y position for the title
    let titleWidth = frame.width - 110; // Adjust title width
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        // Title
        textLayerResult = await createTextLayer(`**${texts[0]}**`, yPos, frame, false, titleWidth, "**");
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
        textLayerResult = await createTextLayer(texts[1], yPos, frame, false, columnWidth, "", column1XOffset);
        yPos = textLayerResult.yPos; 
        // Column 2, yPos not updated because it should start at the same Y as column 1
        await createTextLayer(texts[2], yPos, frame, false, columnWidth, "", column2XOffset);

        // After columns, adjust yPos for the placeholder. Assuming a fixed height for text layers, adjust if necessary
       // Assuming 251px is the height of columns + 20px space after columns
    }

    // Placeholder below the columns
    // createImagePlaceholder(frame, yPos, frame.width - 110, frame.height - yPos - 55); // Adjust placeholder height dynamically based on yPos
}

;// CONCATENATED MODULE: ./templates/index.js
// templates/index.js

























;// CONCATENATED MODULE: ./frameGeneration.js
 






async function createFramesAndAddText(texts, selectedType) {
    await loadFonts(); // Ensure all necessary fonts are loaded
    let xOffset = 0;
    let pageNumber = 1;
    let maxRight = 0;

    
     // Find the most rightward frame and the highest page number among existing frames
     figma.currentPage.children.forEach(node => {
        if (node.type === "FRAME") {
            const nodeRightEdge = node.x + node.width;
            if (nodeRightEdge > maxRight) {
                maxRight = nodeRightEdge; // Update the most rightward position
            }
            // Check if the frame name matches "Page X" format and update pageNumber accordingly
            const match = node.name.match(/^Page (\d+)$/);
            if (match) {
                const currentPageNumber = parseInt(match[1], 10);
                if (currentPageNumber >= pageNumber) {
                    pageNumber = currentPageNumber + 1; // Continue numbering from the last found page number
                }
            }
        }
    });

    let textGroups = [];
    let sliceSizes = [];
    xOffset = maxRight + 50; // Add some space between the existing frames and new ones

    let templatesToUse;
    

    switch (selectedType) {
        case 'bulletPoint2':
            // Define specific slices and templates for option 1
            textGroups = [texts
            ]; 
            templatesToUse = [createTableOfContents ];
            break;
        
        case 'introduction':
            // Define specific slices and templates for option 2
            textGroups = [null, 
                texts.slice(0, 2),
                texts.slice(2, 5),
                texts.slice(0, 5),
                texts.slice(0, 3),
                texts.slice(0, 3),
            ];
            // templatesToUse = [PagePlaceholder, createTwoColumn_One, createTwoColumn_Two,createTwoColumn_Three];
            templatesToUse = [createPagePlaceholder, createSimple_Title_Desc_Image_ColumnStyle,
                createSimple_Image_Desc, createTwoColumn_Four,createTwoColumn_Five];

            break;

        case 'ai_automation':
            ({ textGroups, templatesToUse  } = processTextsForPagesAndTemplates(texts));
            
            // return;
         

            break;
        // Add more cases here for other template choices
    
        default:
            // Handle an unexpected or default case if necessary
            console.log("No valid template choice selected.");
            // Optionally set default textGroups and framesFunctions
            break;
    }
     
    // Create frames based on the dynamically generated text groups
for (let i = 0; i < textGroups.length; i++) { // Iterate based on textGroups length
    
    const frame = figma.createFrame();
    frame.resize(595, 842);
    frame.x = xOffset;
    frame.y = 0; // Adjust this as needed to align with your design requirements
    frame.fills = [{ type: 'SOLID', color: hexToRgb(colors.backgroundAndNumber) }];

    // Set the frame name to "Page X" where X is the current page number
    frame.name = `Page ${pageNumber}`;

    const group = textGroups[i]; // Get the current group from textGroups
    if (group === null) {
        // If the current group is null, create a PagePlaceholder
        createImagePlaceholder(frame, 55, frame.width - 110, frame.height - 110);
    } else {
        // Otherwise, use the corresponding template for non-null groups
        // Ensure [i] can handle the group, assuming templatesToUse aligns with non-null textGroups
        await templatesToUse[i](group, frame);
    }

    xOffset += frame.width + 50; // Move xOffset to the right for the next frame
    pageNumber++; // Increment the page number for the next frame
}

    if (templatesToUse.length > 0){
    figma.notify("Text layers and frames created successfully.");
}

}

 

function processTextsForPagesAndTemplates(texts) {
 
    const allTemplates = [
        { templateName: createTableOfContents, line: 12, use: 'toc' },
        { templateName: createSimple_Title_Desc_Image_ColumnStyle, line: 2, use: 'intro' },
        { templateName: createSimple_Title_Desc, line: 6, use: 'simpletext' },
        { templateName: createSimple_Image_Desc, line: 1, use: 'image-desc' },
        { templateName: createBulletPointPage_One, line: 11, use: 'bullet' },
        { templateName: createTwoColumn_One, line: 3, use: 'two-column-1' },
        { templateName: createTwoColumn_Two, line: 3, use: 'two-column-2' },
        { templateName: createTwoColumn_Three, line: 5, use: 'two-column-3' },
        { templateName: createTwoColumn_Four, line: 3, use: 'two-column-4' },
        { templateName: createTwoColumn_Five, line: 3, use: 'two-column-5' },
        { templateName: createSimple_Desc_Image, line: 1, use: 'image' },
        { templateName: createSimple_Title_Desc_Image, line: 2, use: 'overview' },
        { templateName: createSimple_Image_Title_Desc, line: 2, use: 'highlight' },
        { templateName: createPagePlaceholder, line: 0, use: 'placeholder' },
      ];
    
      let templatesToUse = [];
      let cleanedTexts = [];
      let sliceSizes = [];
      let currentPageLines = 0;
      let markerFound = false;
  
      texts.forEach((text, index) => {
        const markerMatch = text.match(/^#>page-(.*?)<#$/);
        if (markerMatch) {
            const pageType = markerMatch[1].trim(); // Trim any whitespace
    
            if (markerFound) {
                sliceSizes.push(currentPageLines);
                currentPageLines = 0;
            } else {
                markerFound = true;
            }
    
            // Adjust comparison for case sensitivity and whitespace
            const templateMatch = allTemplates.find(template => template.use.trim().toLowerCase() === pageType.toLowerCase());
             
            if (templateMatch) {
                templatesToUse.push(templateMatch.templateName);
            } else {
                console.error("No matching template found for page type:", pageType);
            }
        } else if (markerFound) {
            cleanedTexts.push(text);
            currentPageLines++;
        }
    });
    
      // Finalize the last page if any texts were found after the last marker
      if (currentPageLines > 0) {
          sliceSizes.push(currentPageLines);
      }
  
      // Generate text groups based on sliceSizes
      const textGroups = generateTextGroups(cleanedTexts, sliceSizes);
  
      return { textGroups, templatesToUse };
  }

function generateTextGroups(cleanedTexts, sliceSizes) {
    let groups = [];
    let startIndex = 0;

    sliceSizes.forEach(size => {
        const group = cleanedTexts.slice(startIndex, startIndex + size);
        groups.push(group);
        startIndex += size;
    });

    return groups;
}


function validateTextInputs(texts) {
    // Check if texts is not empty and is a string
    if (typeof texts !== 'string' || texts.trim().length === 0) {
        throw new Error('Text input must be a non-empty string.');
    }

    // Check for the presence of at least one page marker
    const hasPageMarker = /#>page-(.*?)<#/.test(texts);
    if (!hasPageMarker) {
        throw new Error('No page markers found in text input.');
    }

    // Optionally, validate that each marker corresponds to a known template
    const markers = texts.match(/#>page-(.*?)<#/g) || [];
    markers.forEach(marker => {
        const type = marker.match(/#>page-(.*?)<#/)[1];
        if (!allTemplates.some(t => t.use === type)) {
            throw new Error(`Unknown page type "${type}" found in text input.`);
        }
    });

    // If all checks pass, input is considered valid
    return true;
}


function createImagePlaceholder(frame, startY ,width, height, xPos=55) {
    const placeholder = figma.createRectangle();
    placeholder.resize(width, height);
    placeholder.y = startY;
    placeholder.x = xPos; // Set x position based on the current xPos value
    placeholder.fills = [{ type: 'SOLID', color: hexToRgb(colors.greyPlaceHolder) }];
    placeholder.cornerRadius = 25;
    frame.appendChild(placeholder);
    return placeholder; 
}

















// title: Pages that prominently feature a title, possibly with accompanying text or image.
// bullet: Pages designed for bullet points or lists.
// image: Pages with a focus on imagery, possibly with a small amount of text.
// text: Pages that are text-heavy, such as full paragraphs or sections of text.
// intro: Templates designed for introductions or opening pages.
// overview: Pages that provide an overview or summary of a topic.
// conclusion: Templates used for concluding remarks or summaries.
// two-column: Pages that use a two-column layout for text, images, or a combination of both.
// highlight: Templates that are used to highlight certain information, such as key points or quotes.
;// CONCATENATED MODULE: ./code.js

// code.js 



// Adjust the size when showing the UI
figma.showUI(__html__ );


figma.ui.onmessage = async (msg) => {
  
  if (msg.type === 'resize-ui') {
    const newHeight = msg.height;
        figma.ui.resize(600, newHeight);
  }
  if (msg.type === 'create-text-layers') {
   
      const texts = msg.text.split('\n').filter(line => line.trim() !== '');
      // const texts = msg.text.split('\n');
      // Use msg.templateChoice to match the updated UI logic
      await createFramesAndAddText(texts, msg.selectedType);
  }
  if (msg.type === 'notify') {
    figma.notify(msg.message);}
};


/******/ })()
;