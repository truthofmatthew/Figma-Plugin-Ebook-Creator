// textGeneration.js
import { colors, fontStyles } from './constants.js';
import { hexToRgb } from './utilities.js';

export async function loadFonts() {
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
export async function createTextLayer(text, yPos, frame, isDirectlyAfterBullet = false, width = 486, style = "", customXOffset = null) {
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



 

export async function applyMixedStyles(textNode, text) {
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


export async function createColumnTextLayers(texts, initialYPos, frame, columnWidths, columnXOffsets, styles) {
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

 