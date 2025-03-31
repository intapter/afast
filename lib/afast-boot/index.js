const createContextProxy = require("./src/createContextProxy");
const emitHook = require("./src/emitHook");

module.exports = {
    ___AFAST_CONTROLLER_PROXY: createContextProxy,
    __AFAST_CONTROLLER_HOOKS: emitHook
}