const parseLanguage = (value, imports) => {
    return `useLanguage(${value.split("+").map(a => `'${a}'`).join()})`;
}
module.exports = parseLanguage