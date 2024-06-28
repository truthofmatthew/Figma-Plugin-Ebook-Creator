import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createSimple_Title_Desc_Image_ColumnStyle(texts, frame, textDirection) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers

    let xPos = 55; // Starting X position
    let layerWidth = 486; // Fixed width for each layer
    let layerHeight = 699; // Fixed height for the image placeholder
    const marginBetweenLayers = 40; // Margin between layers

    let textLayerResult; // To capture the result from createTextLayer

    // Assuming you want to adjust the yPos for text layers for aesthetic reasons
    let yPos = 65; // You can adjust this based on your layout needs

    // Iterate through texts and create text layers at specified positions
    for (let i = 0; i < texts.length; i++) {
        textLayerResult = await textGeneration.createTextLayer({
            text: texts[i],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        } );
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
