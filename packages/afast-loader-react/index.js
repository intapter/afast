const parseIndex = require("./src/parser/parseIndex.js");
const parseModule = require("./src/parser/parseModule.js");


module.exports = function (source) {
    const imports = new Set();
    const code = [];
    let afastObject;
    try {
        afastObject = JSON.parse(source);
    } catch (err) {
        throw new Error("The file is not a valid afast file");
    }
    switch (afastObject.type) {
        case "index":
            const innerCode = []
            parseIndex(afastObject, imports, innerCode);
            code.push(`(async ()=>{${innerCode.join(';')}})()`)
            break;
        case "module":
            parseModule(afastObject, imports, code);
            break;
        default:
            throw new Error("The file is not a valid afast file");
    }
    return [...imports, ...code].join(";");
};
