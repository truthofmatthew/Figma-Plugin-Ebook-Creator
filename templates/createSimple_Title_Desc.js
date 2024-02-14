import * as textGeneration from '../textGeneration.js';

export async function createSimple_Title_Desc(texts, frame) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position

    let textLayerResult; // To capture the result from createTextLayer
    
    // Create the first text layer and update yPos based on its actual height
    for (let i = 0; i < texts.length; i++) {
        
        textLayerResult = await textGeneration.createTextLayer(texts[i], yPos, frame);
        yPos = textLayerResult.yPos; 
    }

    // // Create the second text layer and update yPos similarly
    // if (texts.length > 1) {
    //     textLayerResult = await textGeneration.createTextLayer(texts[1], yPos, frame);
    //     yPos = textLayerResult.yPos; // Update yPos with the returned value
    // }


}
