import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createTwoColumn_Five(texts, frame, textDirection) {
    await textGeneration.loadFonts(); // Ensure all necessary fonts are loaded

    // Initial setup for title and columns
    let yPos = 65; // Starting Y position for the title
    let titleWidth = frame.width - 110; // Adjust title width
    let textLayerResult;
    // Create the title with bold style
    if (texts.length > 0) {
        // Title
        textLayerResult = await textGeneration.createTextLayer({
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
        textLayerResult = await textGeneration.createTextLayer({
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
        await textGeneration.createTextLayer({
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
