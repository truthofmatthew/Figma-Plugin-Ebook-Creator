// frameGeneration.js

import { colors } from './constants.js';
import { hexToRgb } from './utilities.js';
import { loadFonts } from './textGeneration.js';
import {
    createPagePlaceholder,
    createTableOfContents,
    createSimple_Title_Desc_Image,
    createBulletPointPage_One,
    createSimple_Image_Title_Desc,
    createTwoColumn_One,
    createTwoColumn_Two,
    createTwoColumn_Three,
    createTwoColumn_Four,
    createTwoColumn_Five,
    createSimple_Desc_Image,
    createSimple_Image_Desc,
    createSimple_Title_Desc_Image_ColumnStyle,
    createSimple_Title_Desc
} from './templates';

export async function createFramesAndAddText(texts, textDirection) {
    await figma.loadAllPagesAsync();
    await loadFonts();
    let xOffset = 0, pageNumber = 1, maxRight = 0;

    figma.currentPage.children.forEach(node => {
        if (node.type === "FRAME") {
            maxRight = Math.max(maxRight, node.x + node.width);
            const match = node.name.match(/^Page (\d+)$/);
            if (match) pageNumber = Math.max(pageNumber, parseInt(match[1], 10) + 1);
        }
    });

    xOffset = maxRight + 50;
    let { textGroups, templatesToUse } = processTextsForPagesAndTemplates(texts);

    for (let i = 0; i < textGroups.length; i++) {
        const frame = figma.createFrame();
        frame.resize(595, 842);
        frame.x = xOffset;
        frame.y = 0;
        frame.fills = [{ type: 'SOLID', color: hexToRgb(colors.backgroundAndNumber) }];
        frame.name = `Page ${pageNumber}`;
        const group = textGroups[i];
        if (group !== null) await templatesToUse[i](group, frame, textDirection);
        xOffset += 595 + 50;
        pageNumber++;
    }
    if (templatesToUse.length > 0) figma.notify("Text layers and frames created successfully.");
}

function processTextsForPagesAndTemplates(texts) {
    const allTemplates = [
        { template: createTableOfContents, use: 'toc' },
        { template: createSimple_Title_Desc_Image_ColumnStyle, use: 'intro' },
        { template: createSimple_Title_Desc, use: 'simpletext' },
        { template: createSimple_Image_Desc, use: 'image-desc' },
        { template: createBulletPointPage_One, use: 'bullet' },
        { template: createTwoColumn_One, use: 'two-column-1' },
        { template: createTwoColumn_Two, use: 'two-column-2' },
        { template: createTwoColumn_Three, use: 'two-column-3' },
        { template: createTwoColumn_Four, use: 'two-column-4' },
        { template: createTwoColumn_Five, use: 'two-column-5' },
        { template: createSimple_Desc_Image, use: 'image' },
        { template: createSimple_Title_Desc_Image, use: 'overview' },
        { template: createSimple_Image_Title_Desc, use: 'highlight' },
        { template: createPagePlaceholder, use: 'placeholder' },
    ];

    let templatesToUse = [], cleanedTexts = [], sliceSizes = [], currentPageLines = 0, markerFound = false;

    texts.forEach(text => {
        const markerMatch = text.match(/^#>page-(.*?)<#$/);
        if (markerMatch) {
            if (markerFound) sliceSizes.push(currentPageLines);
            else markerFound = true;
            currentPageLines = 0;
            const pageType = markerMatch[1].trim().toLowerCase();
            const templateMatch = allTemplates.find(t => t.use === pageType);
            if (templateMatch) templatesToUse.push(templateMatch.template);
        } else if (markerFound) {
            cleanedTexts.push(text);
            currentPageLines++;
        }
    });

    if (currentPageLines > 0) sliceSizes.push(currentPageLines);
    let textGroups = generateTextGroups(cleanedTexts, sliceSizes);
    return { textGroups, templatesToUse };
}

function generateTextGroups(cleanedTexts, sliceSizes) {
    let groups = [], startIndex = 0;
    sliceSizes.forEach(size => {
        groups.push(cleanedTexts.slice(startIndex, startIndex + size));
        startIndex += size;
    });
    return groups;
}

export function createImagePlaceholder(frame, startY, width, height, xPos = 55) {
    const placeholder = figma.createRectangle();
    placeholder.resize(width, height);
    placeholder.y = startY;
    placeholder.x = xPos;
    placeholder.fills = [{ type: 'SOLID', color: hexToRgb(colors.greyPlaceHolder) }];
    placeholder.cornerRadius = 25;
    frame.appendChild(placeholder);
}
