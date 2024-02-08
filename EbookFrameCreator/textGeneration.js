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

export async function createTextLayer(text, yPos, frame, isDirectlyAfterBullet = false) {
    let xOffset = 55; // Default X position for text
    let margin = 10; // Default margin for text
    let bulletNodeY = yPos; // Initialize with yPos, will update if bullet is created
    let bulletNodeHeight = 39; // Initialize with the bullet node's height

    const numberedTextMatch = text.match(/^(\d+)\.\s*(.*)/);
    if (numberedTextMatch) {
        const number = numberedTextMatch[1];
        const restOfText = numberedTextMatch[2];

        // Create bullet (rounded rectangle) for the number
        const bulletNode = figma.createRectangle();
        bulletNode.resize(39, bulletNodeHeight); // Bullet size
        bulletNode.cornerRadius = 10; // Rounded corners
        bulletNode.x = xOffset;
        bulletNode.y = yPos;
        bulletNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.bulletPointAndText) }];
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

        frame.appendChild(numberNode);

        bulletNodeY = bulletNode.y;
        bulletNodeHeight = bulletNode.height;

        // Adjust the X position for the rest of the text
        xOffset += bulletNode.width + 15; // Space between bullet and text
        isDirectlyAfterBullet = true;
    }

    const textNode = figma.createText();
    textNode.x = xOffset;
    // Initially set yPos for textNode; it will be conditionally adjusted below
    textNode.y = yPos;

    // Apply styles based on text content
    if (text.startsWith('**')) {
        await figma.loadFontAsync(fontStyles.roxboroughBold);
        textNode.fontName = fontStyles.roxboroughBold;
        textNode.fontSize = 32;
        text = text.replace(/\*\*/g, '');
        textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.highlightedText) }];

        margin = 20;
    } else if (numberedTextMatch) {
        
        await figma.loadFontAsync(fontStyles.roxboroughBold);
        textNode.fontName = fontStyles.roxboroughBold;
        textNode.fontSize = 16;
        textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.bulletPointAndText) }];

        text = text.replace(/^\d+\.\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1');

        // Calculate vertical centering relative to bulletNode's position and height
        await figma.loadFontAsync(textNode.fontName); // Ensure font is loaded to calculate height
        const textNodeHeightEstimate = 16; // Use an estimate or calculate based on font metrics
        textNode.y = bulletNodeY + (bulletNodeHeight / 2) - (textNodeHeightEstimate / 2);

        margin = 10; 
    } else if (text.includes('*')) {
        
        await applyMixedStyles(textNode, text);
        textNode.resize(486, textNode.height); // Adjust width

        // Apply the 10-unit margin from bullet point only if directly after a bullet
        if (isDirectlyAfterBullet) {
            margin = 5
            textNode.y = bulletNodeY + 20; // Adjust yPos for this specific case
            isDirectlyAfterBullet = false; // Reset the flag after use
            frame.appendChild(textNode);
            // Adjust yPos for next text layer, including margin from the adjusted position of mixed style text
            yPos = textNode.y + textNode.height +margin; 

            return yPos;
        }

        frame.appendChild(textNode);
        // Adjust yPos for next text layer, including margin from the adjusted position of mixed style text
        yPos = textNode.y + textNode.height + margin;
        return yPos;
    } else {
        await figma.loadFontAsync(fontStyles.dmSansRegular);
        textNode.fontName = fontStyles.dmSansRegular;
        textNode.fontSize = 14;
        textNode.fills = [{ type: 'SOLID', color: hexToRgb(colors.regularText) }];

    }

    textNode.characters = text;
    textNode.resize(486 - (xOffset - 55), textNode.height); // Adjust the width based on the xOffset
    frame.appendChild(textNode);

    // Calculate and return the new Y position for the next text node
    return yPos + textNode.height + margin;
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
    let cleanText = text.replace(/^\s*[-]\s?|\*/g, '');
    textNode.characters = cleanText;

    // Find and apply bold style within cleaned text
    let match;
    const boldRegex = /\*([^\*]+)\*/g;
    let adjustmentIndex = 0; // Keep track of adjustments made due to character removal

    while ((match = boldRegex.exec(text)) !== null) {
        let boldTextStart = match.index - adjustmentIndex - removedCharsCount; // Adjust based on removed characters and previous adjustments
        let boldTextEnd = boldTextStart + match[1].length;

        // Load and apply the bold font to the range
        await figma.loadFontAsync(fontStyles.dmSansBold);
        textNode.setRangeFontName(boldTextStart, boldTextEnd, fontStyles.dmSansBold);
        textNode.setRangeFontSize(boldTextStart, boldTextEnd, 14);
        textNode.setRangeFills(boldTextStart, boldTextEnd, [{ type: 'SOLID', color: hexToRgb(colors.mixedStylesText) }]);

        // Adjust indices for subsequent matches due to character removal
        // adjustmentIndex += 0; // Assuming each "*" pair removed reduces length by 2
        adjustmentIndex += match[0].length - match[1].length; // Correctly adjust for the length of the bold markers

    }
}

