import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createSimple_Image_Title_Desc(texts, frame, textDirection) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    
    // Initially, calculate the space needed for the text layers from the bottom up
    const bottomMargin = 88; // Margin from the bottom of the frame to the start of the text
    let textLayerHeightTotal = 0; // To accumulate the total height of the text layers
    
    // Placeholder for storing text node properties for later adjustment if needed
    let textNodeProperties = [];
    let textLayerResult;
    let placeholderLayerResult;
    
    for (let i = 0; i < texts.length; i++) {
        let yPos = frame.height - bottomMargin - textLayerHeightTotal;
    
        textLayerResult = await textGeneration.createTextLayer({
            text: texts[i],
            yPos: yPos,
            frame: frame,
            textDirection: textDirection
            // Any other parameters you wish to specify, otherwise defaults will be used
        });
    
        textLayerHeightTotal += textLayerResult.textNodeProperties[0].height + (i < texts.length - 1 ? 20 : 0);
    
        textNodeProperties.push(textLayerResult.textNodeProperties[0]); // Use unshift to add at the beginning
    }
    

    // Calculate the starting Y position for the placeholder based on the remaining space
    let spaceAboveTextLayers = frame.height - bottomMargin - textLayerHeightTotal - 65; // 65 is the starting Y position

    // Create the placeholder if there's enough space
    if (spaceAboveTextLayers > 0) {
        placeholderLayerResult = createImagePlaceholder(frame, 65, 486, spaceAboveTextLayers - 20); // Subtract 20px margin above the placeholder
        textNodeProperties.push({name: placeholderLayerResult.name, y: placeholderLayerResult.y});
         

    }

     
    textNodeProperties.forEach(prop => {

        console.log(`Name: ${prop.name}, Y Position: ${prop.y}`);
    });
    
    let newYPosition = placeholderLayerResult.y + placeholderLayerResult.height + 20;
    textNodeProperties.forEach(prop => {
        if (prop.name !== placeholderLayerResult.name) {
            moveTextNodeByName([frame], prop.name, newYPosition); // Assuming frame is the root node you're modifying
            newYPosition += prop.height + 20;
        }
    });
 
    
}

function moveTextNodeByName(nodes, name, newYPosition) {
    nodes.forEach(node => {
        if (node.type === 'TEXT' && node.name === name) {
            node.y = newYPosition;
        }
        if (node.children && node.children.length > 0) {
            moveTextNodeByName(node.children, name, newYPosition);
        }
    });
}