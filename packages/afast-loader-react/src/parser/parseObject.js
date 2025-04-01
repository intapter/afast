const parseValue = require("./parseValue");

const parseObject = (props, noParseKeys) => {
    if (!props) return undefined;
    return (
        "{" +
        Object.keys(props)
            .map((key) => {
                const value =
                    typeof props[key] === "object"
                        ? parseObject(props[key])
                        : noParseKeys && noParseKeys.includes(key)
                            ? props[key] // Do not parse this field with function parseValue
                            : parseValue(props[key]);
                return `${key}: ${value}`;
            })
            .join(",") +
        "}"
    );
};

module.exports = parseObject;