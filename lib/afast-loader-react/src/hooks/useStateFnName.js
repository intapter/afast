const { createHash } = require("crypto");
module.exports = (stateName) => {
    return `set_${createHash('md5').update(stateName).digest('hex')}`
}