
// code.js 

import { createFramesAndAddText } from './frameGeneration.js';

// Adjust the size when showing the UI
figma.showUI(__html__ );


figma.ui.onmessage = async (msg) => {
  
  if (msg.type === 'resize-ui') {
    const newHeight = msg.height;
        figma.ui.resize(600, newHeight);
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

