import constants from './constants.js';


class UiManager {
    constructor(figmaUi) {
        this.figmaUi = figmaUi;
    }

    resizeUI(newHeight) {
        this.figmaUi.resize(constants.uiWidth, newHeight);
    }

    notifyUser(message) {
        this.figmaUi.notify(message);
    }
}


export default new UiManager();