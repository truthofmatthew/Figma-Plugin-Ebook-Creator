import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createTwoColumn_Two(texts, frame, textDirection) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    
    let yPos = 65; // Starting Y position for the title
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        textLayerResult = await textGeneration.createTextLayer({
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
        columnCreationResult = await textGeneration.createColumnTextLayers({
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