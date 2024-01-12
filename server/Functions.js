const Config = require("./Config.js");

module.exports = {
    FindGrid(x, y) {
        return { row: (y/Config.gridWidth) >> 0, col: (x/Config.gridWidth)>>0}
    },
    GetGridCoords(row, col){
        return {x: col*Config.gridWidth, y:row*Config.gridWidth};
    }
}