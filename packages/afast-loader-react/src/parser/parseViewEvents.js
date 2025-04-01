const useEventName = require("../hooks/useEventName.js");
const parseValue = require("./parseValue.js");
const useStateFnName = require("../hooks/useStateFnName.js");

const parseViewEvents = (afastObject, view, noParseKeys, imports, innerCode) => {
    if (!view.props) view.props = {};
    Object.keys(view.events).forEach((key) => {
        noParseKeys.push(key);
        const action = view.events[key];
        const receives = action.receives ? action.receives.join() : ""
        const valuesStr = action.values
            ? action.values
                .map((value) => {
                    if (value === "$e") return value;
                    return parseValue(value, imports);
                })
                .join()
            : "";
        switch (action.type) {
            case "dispatch": {
                if (!afastObject.events)
                    throw new Error(`View \`${afastObject.name}\` hasn't any actions`);
                if (!afastObject.events[action.name])
                    throw new Error(
                        `View \`${afastObject.name}\` doesn't have a action named \`${action.name}\`, did you forget to register it?`
                    );
                view.props[key] = `(${action.values && action.values.includes("$e") ? "$e" : ""
                    }) => {${useEventName(action.name)}(${valuesStr})}`;
                break;
            }
            case "setField": {
                const field = afastObject.fields[action.name];
                if (!field)
                    throw new Error(
                        `View \`${afastObject.name}\` doesn't have an field named \`${action.name}\``
                    );
                // TODO check weather the type of value is correct
                if (field.reactive) {
                    view.props[key] = `(${receives}) => ${useStateFnName(action.name)}(${valuesStr})`;
                } else {
                    view.props[key] = `(${receives}) => {${action.name} = ${parseValue(
                        action.value,
                        imports
                    )}}`;
                }
                break;
            }
            case "hook": {
                if (!action.name) {
                    throw new Error(
                        `Event with hook need a name, check view \`${afastObject.name}\``
                    );
                }
                view.props[key] = `(${receives}) => __AFAST_HOOKS_EMIT('${action.name}', ${valuesStr})`
                break;
            }
            case "nav": {
                if (!afastObject.useNavigate) {
                    afastObject.useNavigate = true
                    innerCode.push(`const navigate = useNavigate()`)
                    imports.add(`import {useNavigate} from 'react-router-dom'`)
                }
                view.props[key] = `(${receives}) => {navigate(${parseValue(action.value, imports)})}`
                break;
            }
        }
    });
}
module.exports = parseViewEvents