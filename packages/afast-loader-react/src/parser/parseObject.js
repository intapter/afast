const parseValue = require("./parseValue");

const parseObject = (props, noParseKeys, imports) => {
  if (!props) return undefined;
  return (
    "{" +
    Object.keys(props)
      .map((key) => {
        const value =
          noParseKeys && noParseKeys.includes(key)
            ? props[key] // Do not parse this field with function parseValue
            : parseValue(props[key], imports);
        return `${key}: ${value}`;
      })
      .join(",") +
    "}"
  );
};

module.exports = parseObject;
