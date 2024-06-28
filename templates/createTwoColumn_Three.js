import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createTwoColumn_Three(texts, frame, textDirection) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Text Layer 1 with ** style
    if (texts.length > 0) {
        textLayerResult = await textGeneration.createTextLayer({
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
        textLayerResult = await textGeneration.createTextLayer({
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
        textLayerResult = await textGeneration.createTextLayer({
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
        let columnCreationResult = await textGeneration.createColumnTextLayers({
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
