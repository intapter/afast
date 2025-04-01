const parseLanguage = (value, imports) => {
    imports.add(`import {useLanguage} from 'afast-boot'`)
    return `useLanguage(${value.split("+").map(a => `'${a}'`).join()})`;
}
module.exports = parseLanguage