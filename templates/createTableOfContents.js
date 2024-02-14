 
 
import { colors, fontStyles } from '../constants.js';
import { hexToRgb } from '../utilities.js';

export async function loadFonts() {
    await Promise.all([
        figma.loadFontAsync(fontStyles.roxboroughBold),
        figma.loadFontAsync(fontStyles.dmSansBold),
        figma.loadFontAsync(fontStyles.dmSansRegular),
    ]);
}

// New function to generate a table of contents
export async function createTableOfContents(rawEntries, frame) {
    await loadFonts(); // Ensure all necessary fonts are loaded

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
