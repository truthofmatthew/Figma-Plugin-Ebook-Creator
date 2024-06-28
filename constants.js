// constants.js




export const regexPatterns = {
  bulletHeaderNumber: [
      { pattern: /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/ },
      { pattern: /\*\*(.*?)(?<!\*\*):\*\*$/ },
      { pattern: /^\d+\.\s*\*\*(.*?):\*\*/ },
      { pattern: /^\d+\.\s*\*\*(.*?)\*\*$/ }
  ],
  identifyTextType: [
      { pattern: /^\*\*(.*?)\*\*$/, type: 'mainTitle' },
      { pattern: /^\d+\.\s*\*\*(.*?)(?<!\*\*):\*\*$/, type: 'bulletHeader' },
      { pattern: /\*\*(.*?)(?<!\*\*):\*\*$/, type: 'bulletHeader' },
      { pattern: /^\d+\.\s*\*\*(.*?):\*\*/, type: 'bulletHeader' },
      { pattern: /^\d+\.\s*\*\*(.*?)\*\*$/, type: 'bulletHeader' },
      { pattern: /^(-|\*)\s*\*\*|\*\*/, type: 'insideText' },
      { pattern: /\*/, type: 'insideText' }
  ]
};


export const colors = {
    regularText: "#0B5465", // For regular text without any styles
    highlightedText: "#027998", // For text between ** **
    bulletPointAndText: "#B30109", // For the bullet point and the text in front of it
    mixedStylesText: "#CE5057", // For texts that have mixed styles
    backgroundAndNumber: "#FFFBEF", // For the background of the frames and the text number inside of the bullet point
    greyPlaceHolder: "#CCCCCC",
  };

export const fontStyles = {
    roxboroughBold: { family: 'Roxborough CF', style: 'Bold' },
    dmSansBold: { family: 'DM Sans', style: 'Bold' },
    dmSansRegular: { family: 'DM Sans', style: 'Regular' },
  };

  export default {
    uiWidth: 400,
    minFrameSize: [400, 300], 
 
  };