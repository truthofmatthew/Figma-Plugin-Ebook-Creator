import * as textGeneration from '../textGeneration.js';
import { createImagePlaceholder } from '../frameGeneration.js';

export async function createBulletPointPage_One(texts, frame) {
    await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
    let yPos = 65; // Starting Y position
    let isDirectlyAfterBullet = false;
    let textLayerResult; // To capture the result from createTextLayer
    let isBulletText;
    // Create text layers, assuming bullet point logic is incorporated in createTextLayer
    for (const text of texts) {
        textLayerResult = await textGeneration.createTextLayer(text, yPos, frame, isDirectlyAfterBullet);

        if (identifyTextType(text) === 'bulletHeader') {
            isDirectlyAfterBullet = true;
        } else {
            // If not a bullet header, ensure isDirectlyAfterBullet is false for the next iteration
            isDirectlyAfterBullet = false;
        }
 
        yPos = textLayerResult.yPos;

    }

}


function identifyTextType(text) {
    const trimmedText = text.trim();

    // Main Titles: Text strictly within ** at the start and end
    // if (trimmedText.startsWith('**') && trimmedText.endsWith('**')) {
    if (trimmedText.startsWith('**') && trimmedText.endsWith('**') && !trimmedText.includes(':')) {

        return 'mainTitle';
    }

    // Identify bullet headers, both "1. **text**:" and "**text 1:**" formats
    // Adjusting Bullet Headers regex to be more inclusive
    // Matches "1. **text**:" format
    // const bulletHeaderRegex1 = /^\d+\.\s*\*\*(.*?)\*\*:/;
    // // Matches "**text 1:**" format more reliably
    // // const bulletHeaderRegex2 = /\*\*(.*?)\*\*\s\d+:$/;

    // const bulletHeaderRegex2 = /\*\*-?.*?\d+:-?\*\*$/;
    const bulletHeaderRegex1 = /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/;
    const bulletHeaderRegex2 = /\*\*(.*?)(?<!\*\*):\*\*$/;
    const bulletHeaderRegex3 = /^\d+\.\s*\*\*(.*?):\*\*/;
    const bulletHeaderRegex4 = /^\d+\.\s*\*\*(.*?)\*\*/;
    if (bulletHeaderRegex1.test(trimmedText)) {
        return 'bulletHeader';
    } else if (bulletHeaderRegex2.test(trimmedText)) {
        return 'bulletHeader';
    }else if (bulletHeaderRegex3.test(trimmedText)) { // Check for "**Example:**" format
        return 'bulletHeader';
    }else if (bulletHeaderRegex4.test(trimmedText)) { // Check for "**Example:**" format
        return 'bulletHeader';
    }
    // // Bullet Headers: Numbered or bulleted items followed by bold text
    // const bulletHeaderRegex = /^(\d+\.|-)\s*\*\*.*?\*\*:/;
    // if (bulletHeaderRegex.test(trimmedText)) {
    //     return 'bulletHeader';
    // }

    // Text under bullets or inside text that might need bold processing
    // This includes text starting with "-", "*", or text that includes "**" anywhere
    // const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    // if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
    //     return 'insideText';
    // }
    const insideTextRegex = /^(-|\*)\s*\*\*|\*\*/;
    if (insideTextRegex.test(trimmedText) || trimmedText.includes('*')) {
        return 'insideText';
    }
    // Default to 'unknown' if none of the above categories match
    return 'unknown';
}
// export async function BulletPointPage_One(texts, frame) {
//     await textGeneration.loadFonts(); // Ensure fonts are loaded before creating text layers
//     let yPos = 65; // Starting Y position
//     let isDirectlyAfterBullet = false;

//     // Create text layers, assuming bullet point logic is incorporated in createTextLayer
//     for (const text of texts) {
//         yPos = await textGeneration.createTextLayer(text, yPos, frame, isDirectlyAfterBullet); // true indicates bullet style
//         const isBulletText = text.match(/^\d+\.\s+/);
//         isDirectlyAfterBullet = !!isBulletText;
//     }
// }