// code.js 

import { createFramesAndAddText } from './frameGeneration.js';
import constants from './constants.js';

figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
        case 'resize-ui':
            figma.ui.resize(constants.uiWidth, msg.height);
            break;
        case 'create-text-layers':
            const texts = msg.text.split('\n').filter(line => line.trim() !== '');
            await createFramesAndAddText(texts, msg.textDirection);
            break;
        case 'notify':
            figma.notify(msg.message);
            break;
    }
};
