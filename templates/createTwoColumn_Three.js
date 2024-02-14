import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createTwoColumn_Three(texts, frame) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Text Layer 1 with ** style
    if (texts.length > 0) {
        textLayerResult = await textGeneration.createTextLayer(`**${texts[0]}**`, yPos, frame, true, frame.width - 110, "**");
        yPos = textLayerResult.yPos; // Adjust space after the title
    }

    // Text Layer 2 (regular text)
    if (texts.length > 1) {
        textLayerResult = await textGeneration.createTextLayer(texts[1], yPos, frame, false, frame.width - 110);
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
        textLayerResult = await textGeneration.createTextLayer(`**${texts[2]}**`, yPos, frame, true, frame.width - 110, "**");
        yPos = textLayerResult.yPos; // Adjust space after the text
    }

    // Two columns of text (Text Layer 4 and 5)
    if (texts.length > 4) {
        const columnWidths = [230, 230];
        const columnXOffsets = [55, 340];
        const styles = ["", ""]; // Assuming these texts don't have special styles

        // Call createColumnTextLayers for the two column texts
        let columnCreationResult = await textGeneration.createColumnTextLayers([texts[3], texts[4]], yPos, frame, columnWidths, columnXOffsets, styles);
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
