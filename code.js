
// code.js 

import { createFramesAndAddText } from './frameGeneration.js';

figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  
  if (msg.type === 'resize-ui') {
    const newHeight = msg.height;
    // Resize the UI with the new height, ensuring it does not exceed 600px
    figma.ui.resize(400, newHeight);
  }
  if (msg.type === 'create-text-layers') {
   
      const texts = msg.text.split('\n').filter(line => line.trim() !== '');
      // const texts = msg.text.split('\n');
      // Use msg.templateChoice to match the updated UI logic
      await createFramesAndAddText(texts, msg.selectedType);
  }
  if (msg.type === 'notify') {
    figma.notify(msg.message);}
};

  