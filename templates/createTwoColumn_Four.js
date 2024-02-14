import * as textGeneration from '../textGeneration.js';
import { hexToRgb } from '../utilities.js';

import { createImagePlaceholder } from '../frameGeneration.js';

export async function createTwoColumn_Four(texts, frame) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title text
    let textLayerResult;
    // ** Style Text Layer (Title)
    if (texts.length > 0) {
        textLayerResult = await textGeneration.createTextLayer(`**${texts[0]}**`, yPos, frame, true, frame.width - 110, "**");
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
        await textGeneration.createColumnTextLayers([texts[1], texts[2]], yPos, frame, columnWidths, columnXOffsets, styles);
    }

    // Further adjustments or text layers can be added here...
}