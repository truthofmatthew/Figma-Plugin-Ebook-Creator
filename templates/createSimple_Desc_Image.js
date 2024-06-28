import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createSimple_Desc_Image(texts, frame, textDirection) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer

    // Create the first text layer and update yPos based on its actual height
    if (texts.length > 0) {
        textLayerResult = await textGeneration.createTextLayer({
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
