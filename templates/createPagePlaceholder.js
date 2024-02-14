import { createImagePlaceholder } from '../frameGeneration.js';

export async function createPagePlaceholder(texts, frame) {
   
    // Assuming you don't need to create text layers before the placeholder in this scenario,
    // and you want the placeholder to respect the 55px margin from each side.

    let margin = 55; // Margin from each side
    // let placeholderXPos = margin; // X position starts at the left margin
    let placeholderWidth = frame.width - (margin * 2); // Width is frame width minus margins on both sides
    let placeholderYPos = margin; // Start Y position at the top margin
    let placeholderHeight = frame.height - (margin * 2); // Height is frame height minus top and bottom margins

    // Log the calculated values to debug
console.log(`Width: ${frame.width}, Placeholder Width: ${placeholderWidth}`);
console.log(`Height: ${frame.height}, Placeholder Height: ${placeholderHeight}`);


    // Create a placeholder within the frame with specified margins
    createImagePlaceholder(frame, placeholderYPos, placeholderWidth, placeholderHeight);
}
