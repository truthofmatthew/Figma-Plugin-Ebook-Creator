 
import { colors } from './constants.js';
import { hexToRgb } from './utilities.js';
import { createTextLayer } from './textGeneration.js';
import { loadFonts } from './textGeneration.js';

export async function createFramesAndAddText(texts) {
  
    await loadFonts();
    let xOffset = 0;
  
    const textGroups = [
      texts.slice(0, 2),
      texts.slice(2, 13),
      texts.slice(13, 24),
      texts.slice(24)
    ];
  
    for (let i = 0; i < textGroups.length; i++) {
      const group = textGroups[i];
      const frame = figma.createFrame();
      frame.resize(595, 842);
      frame.x = xOffset;
      frame.y = 0;
      frame.fills = [{ type: 'SOLID', color: hexToRgb(colors.backgroundAndNumber) }];
      let yPos = 65;
      let isDirectlyAfterBullet = false;
  
      // Variable to track yPos for placing the image placeholder
      let placeholderStartYPos = 0;
  
      for (const text of group) {
        const isBulletText = text.match(/^\d+\.\s+/);
        yPos = await createTextLayer(text, yPos, frame, isDirectlyAfterBullet);
  
        // Update placeholder position logic for both first and last frames
        if ((i === 0 && group.indexOf(text) === 1) || (i === textGroups.length - 1 && group.indexOf(text) === 0)) {
          // After the relevant text layer in the first or last frame
          placeholderStartYPos = yPos;
        }
  
        isDirectlyAfterBullet = !!isBulletText;
      }
  
      // Adjusted logic for placing placeholders in the first and last frames
      if (i === 0 || i === textGroups.length - 1) {
        let heightAdjustment = frame.height - placeholderStartYPos - 45 - 88;
        createImagePlaceholder(frame, placeholderStartYPos + 45, 486, heightAdjustment);
      }
  
      frame.resize(595, Math.max(yPos + 88, 842)); // Ensure the frame is at least the minimum height and accommodate the placeholder
      xOffset += 595 + 50;
    }
}

export function createImagePlaceholder(frame, startY, width, height) {
    const placeholder = figma.createRectangle();
    placeholder.resize(width, height);
    placeholder.y = startY;
    placeholder.x = 55; // Ensure alignment with the text layers
    placeholder.fills = [{ type: 'SOLID', color: hexToRgb("#CCCCCC") }];
    placeholder.cornerRadius = 25;
    frame.appendChild(placeholder);
}
