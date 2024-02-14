 
import { colors } from './constants.js';
import { hexToRgb } from './utilities.js';
import { loadFonts } from './textGeneration.js';

import { createPagePlaceholder, 
    createTableOfContents,
    createSimple_Title_Desc_Image, 
    createBulletPointPage_One, 
    createSimple_Image_Title_Desc, 
    createTwoColumn_One,
    createTwoColumn_Two,
    createTwoColumn_Three,
    createTwoColumn_Four,
    createTwoColumn_Five ,
    createSimple_Desc_Image,
    createSimple_Image_Desc,
    createSimple_Title_Desc_Image_ColumnStyle,
    createSimple_Title_Desc


} from './templates';

export async function createFramesAndAddText(texts, selectedType) {
    await loadFonts(); // Ensure all necessary fonts are loaded
    let xOffset = 0;
    let pageNumber = 1;
    let maxRight = 0;

    
     // Find the most rightward frame and the highest page number among existing frames
     figma.currentPage.children.forEach(node => {
        if (node.type === "FRAME") {
            const nodeRightEdge = node.x + node.width;
            if (nodeRightEdge > maxRight) {
                maxRight = nodeRightEdge; // Update the most rightward position
            }
            // Check if the frame name matches "Page X" format and update pageNumber accordingly
            const match = node.name.match(/^Page (\d+)$/);
            if (match) {
                const currentPageNumber = parseInt(match[1], 10);
                if (currentPageNumber >= pageNumber) {
                    pageNumber = currentPageNumber + 1; // Continue numbering from the last found page number
                }
            }
        }
    });

    let textGroups = [];
    let sliceSizes = [];
    xOffset = maxRight + 50; // Add some space between the existing frames and new ones

    let templatesToUse;
    

    switch (selectedType) {
        case 'bulletPoint2':
            // Define specific slices and templates for option 1
            textGroups = [texts
            ]; 
            templatesToUse = [createTableOfContents ];
            break;
        
        case 'introduction':
            // Define specific slices and templates for option 2
            textGroups = [null, 
                texts.slice(0, 2),
                texts.slice(2, 5),
                texts.slice(0, 5),
                texts.slice(0, 3),
                texts.slice(0, 3),
            ];
            // templatesToUse = [PagePlaceholder, createTwoColumn_One, createTwoColumn_Two,createTwoColumn_Three];
            templatesToUse = [createPagePlaceholder, createSimple_Title_Desc_Image_ColumnStyle,
                createSimple_Image_Desc, createTwoColumn_Four,createTwoColumn_Five];

            break;

        case 'ai_automation':
            ({ textGroups, templatesToUse  } = processTextsForPagesAndTemplates(texts));
            
            // return;
         

            break;
        // Add more cases here for other template choices
    
        default:
            // Handle an unexpected or default case if necessary
            console.log("No valid template choice selected.");
            // Optionally set default textGroups and framesFunctions
            break;
    }
     
    // Create frames based on the dynamically generated text groups
for (let i = 0; i < textGroups.length; i++) { // Iterate based on textGroups length
    
    const frame = figma.createFrame();
    frame.resize(595, 842);
    frame.x = xOffset;
    frame.y = 0; // Adjust this as needed to align with your design requirements
    frame.fills = [{ type: 'SOLID', color: hexToRgb(colors.backgroundAndNumber) }];

    // Set the frame name to "Page X" where X is the current page number
    frame.name = `Page ${pageNumber}`;

    const group = textGroups[i]; // Get the current group from textGroups
    if (group === null) {
        // If the current group is null, create a PagePlaceholder
        createImagePlaceholder(frame, 55, frame.width - 110, frame.height - 110);
    } else {
        // Otherwise, use the corresponding template for non-null groups
        // Ensure [i] can handle the group, assuming templatesToUse aligns with non-null textGroups
        await templatesToUse[i](group, frame);
    }

    xOffset += frame.width + 50; // Move xOffset to the right for the next frame
    pageNumber++; // Increment the page number for the next frame
}

    if (templatesToUse.length > 0){
    figma.notify("Text layers and frames created successfully.");
}

}

 

function processTextsForPagesAndTemplates(texts) {
 
    const allTemplates = [
        { templateName: createTableOfContents, line: 12, use: 'toc' },
        { templateName: createSimple_Title_Desc_Image_ColumnStyle, line: 2, use: 'intro' },
        { templateName: createSimple_Title_Desc, line: 6, use: 'simpletext' },
        { templateName: createSimple_Image_Desc, line: 1, use: 'image-desc' },
        { templateName: createBulletPointPage_One, line: 11, use: 'bullet' },
        { templateName: createTwoColumn_One, line: 3, use: 'two-column-1' },
        { templateName: createTwoColumn_Two, line: 3, use: 'two-column-2' },
        { templateName: createTwoColumn_Three, line: 5, use: 'two-column-3' },
        { templateName: createTwoColumn_Four, line: 3, use: 'two-column-4' },
        { templateName: createTwoColumn_Five, line: 3, use: 'two-column-5' },
        { templateName: createSimple_Desc_Image, line: 1, use: 'image' },
        { templateName: createSimple_Title_Desc_Image, line: 2, use: 'overview' },
        { templateName: createSimple_Image_Title_Desc, line: 2, use: 'highlight' },
        { templateName: createPagePlaceholder, line: 0, use: 'placeholder' },
      ];
    
      let templatesToUse = [];
      let cleanedTexts = [];
      let sliceSizes = [];
      let currentPageLines = 0;
      let markerFound = false;
  
      texts.forEach((text, index) => {
        const markerMatch = text.match(/^#>page-(.*?)<#$/);
        if (markerMatch) {
            const pageType = markerMatch[1].trim(); // Trim any whitespace
    
            if (markerFound) {
                sliceSizes.push(currentPageLines);
                currentPageLines = 0;
            } else {
                markerFound = true;
            }
    
            // Adjust comparison for case sensitivity and whitespace
            const templateMatch = allTemplates.find(template => template.use.trim().toLowerCase() === pageType.toLowerCase());
             
            if (templateMatch) {
                templatesToUse.push(templateMatch.templateName);
            } else {
                console.error("No matching template found for page type:", pageType);
            }
        } else if (markerFound) {
            cleanedTexts.push(text);
            currentPageLines++;
        }
    });
    
      // Finalize the last page if any texts were found after the last marker
      if (currentPageLines > 0) {
          sliceSizes.push(currentPageLines);
      }
  
      // Generate text groups based on sliceSizes
      const textGroups = generateTextGroups(cleanedTexts, sliceSizes);
  
      return { textGroups, templatesToUse };
  }

function generateTextGroups(cleanedTexts, sliceSizes) {
    let groups = [];
    let startIndex = 0;

    sliceSizes.forEach(size => {
        const group = cleanedTexts.slice(startIndex, startIndex + size);
        groups.push(group);
        startIndex += size;
    });

    return groups;
}


function validateTextInputs(texts) {
    // Check if texts is not empty and is a string
    if (typeof texts !== 'string' || texts.trim().length === 0) {
        throw new Error('Text input must be a non-empty string.');
    }

    // Check for the presence of at least one page marker
    const hasPageMarker = /#>page-(.*?)<#/.test(texts);
    if (!hasPageMarker) {
        throw new Error('No page markers found in text input.');
    }

    // Optionally, validate that each marker corresponds to a known template
    const markers = texts.match(/#>page-(.*?)<#/g) || [];
    markers.forEach(marker => {
        const type = marker.match(/#>page-(.*?)<#/)[1];
        if (!allTemplates.some(t => t.use === type)) {
            throw new Error(`Unknown page type "${type}" found in text input.`);
        }
    });

    // If all checks pass, input is considered valid
    return true;
}


export function createImagePlaceholder(frame, startY ,width, height, xPos=55) {
    const placeholder = figma.createRectangle();
    placeholder.resize(width, height);
    placeholder.y = startY;
    placeholder.x = xPos; // Set x position based on the current xPos value
    placeholder.fills = [{ type: 'SOLID', color: hexToRgb(colors.greyPlaceHolder) }];
    placeholder.cornerRadius = 25;
    frame.appendChild(placeholder);
    return placeholder; 
}

















// title: Pages that prominently feature a title, possibly with accompanying text or image.
// bullet: Pages designed for bullet points or lists.
// image: Pages with a focus on imagery, possibly with a small amount of text.
// text: Pages that are text-heavy, such as full paragraphs or sections of text.
// intro: Templates designed for introductions or opening pages.
// overview: Pages that provide an overview or summary of a topic.
// conclusion: Templates used for concluding remarks or summaries.
// two-column: Pages that use a two-column layout for text, images, or a combination of both.
// highlight: Templates that are used to highlight certain information, such as key points or quotes.