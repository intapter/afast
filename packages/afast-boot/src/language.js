let src = null
const useLanguage = (...keys) => {    
    return keys.map((key) => {
        if (key === "plus") return "+"
        if (src && src[key]) {
            return src[key]
        }
        return key
    }).join("")
}

const registerLanguage = (_src) => {
    src = _src
}
export {
    registerLanguage,
    useLanguage
}