const { HTML_ELE_TAGS } = require('./html.js')
const DEFAULT_ROOT_ID = 'root'
let views = null


const parseValue = (value) => {
    if (typeof value === 'string')
        return '`' + value.replace(/`/g, '\\\`') + '`'
    return value
}

const renameEvent = (name) => {
    return `${name}`
}


const parseObject = (props, noParseKeys) => {
    if (!props) return undefined
    return '{' + Object.keys(props).map((key) => {
        const value = typeof props[key] === 'object'
            ? parseObject(props[key])
            : noParseKeys && noParseKeys.includes(key)
                ? props[key]    // Do not parse this field with function parseValue
                : parseValue(props[key])
        return `${key}: ${value}`
    }).join(',') + "}"
}

const parseVariables = (variables, code) => {
    if (!variables) return
    Object.keys(variables).forEach((key) => {
        const name = `${key}`
        const variable = variables[key]
        let value
        switch (variable.type) {
            case 'string': {
                value = parseValue(variable.value)
                break
            }
            case 'boolean':
            case 'number': {
                value = variable.value
                break
            }
            case 'object': {
                value = parseObject(variable.value)
                break
            }
            case 'array': {
                value = variable.value.map((item) => {
                    return `'${item}'`
                }).join()
                break
            }
            default: ''
        }
        if (variable.reactive) code.push(`const [${name},set_${name}] = React.useState(${value})`)
        else code.push(`let ${name} = ${value}`)
    })
}

const parseView = (imports, view, afastObject) => {
    let tag
    // Parse name of view
    if (HTML_ELE_TAGS.has(view.name)) {
        // This view is a normal HTML element
        tag = `'${view.name}'`
    } else {
        // This view is a custom component
        const moduleSrc = views[view.name]
        if (!views) throw new Error('Not allowed to use a component because you did not set the `views` property in the index file')
        if (!moduleSrc) throw new Error('Cannot find a component named `' + view.name + '`, did you forget to add it to the `views` property in the index file?')
        tag = `_afast_import_view_${view.name}`
        imports.add(`import ${tag} from '${moduleSrc}'`)
    }
    // Parse children of view
    const children = []
    if (view.children) {
        view.children.forEach((child) => {
            children.push(parseView(imports, child, afastObject))
        })
    }
    // Parse events of view
    const noParseKeys = []
    if (view.events) {
        if (!view.props) view.props = {}
        Object.keys(view.events).forEach((key) => {
            noParseKeys.push(key)
            const action = view.events[key]
            const valuesStr = action.values ? action.values.map((value) => {
                if (value === '$e') return value
                return parseValue(value)
            }).join() : ''
            switch (action.type) {
                case "dispatch": {
                    if (!afastObject.events)
                        throw new Error(`View \`${afastObject.name}\` hasn't any actions`)
                    if (!afastObject.events[action.name])
                        throw new Error(`View \`${afastObject.name}\` doesn't have a action named \`${action.name}\`, did you forget to register it?`)
                    view.props[key] = `(${action.values && action.values.includes('$e') ? '$e' : ''
                        }) => {${renameEvent(action.name)}(${valuesStr})}`
                    break
                }
                case "setVariable": {
                    const variable = afastObject.variables[action.name]
                    if (!variable) throw new Error(`View \`${afastObject.name}\` doesn't have an variable named \`${action.name}\``)
                    // TODO check weather the type of value is correct
                    if (variable.reactive) {
                        view.props[key] = `($e) => set_${action.name}(${valuesStr})`
                    } else {
                        view.props[key] = `() => {${action.name} = ${parseValue(action.value)}}`
                    }
                    break
                }
                case "script": {
                    if (!action.src) throw new Error(`Event with script need a src import, check view \`${afastObject.name}\``)
                    const fnName = `__SCRIPT_FUNC_OF_EVENT_${action.name}`
                    imports.add(`import ${fnName} from '${action.src}'`)
                    // TODO write into a lib
                    view.props[key] = `${fnName}.bind({setVariable: (name, v) => {
                        ${afastObject.variables && Object.keys(afastObject.variables).map((key) => {
                        return afastObject.variables[key].reactive
                            ? `if(name === '${key}') set_${key}(v)`
                            : `if(name === '${key}') ${key} = v`
                    }).join(";")}
                    }})`
                }

            }
        })
    }
    return `React.createElement(${tag}, ${parseObject(view.props, noParseKeys)}, ${children && children.length > 0 ? children.join() : view.text ? `\`${view.text}\`` : null})`
}

const parseIndex = (afastObject, imports, code) => {
    let __name
    if (afastObject.title) code.push(`document.title = '${afastObject.title}'`)
    if (afastObject.route) {
        Object.keys(afastObject.route).forEach((routeName, i) => {
            const name = `_afast_import_${i}`
            const routeObject = afastObject.route[routeName]
            imports.add(`import ${name} from '${routeObject.src}'`)
            __name = name
        })
    }
    // Memo the views map, so we can use it in the parseView function
    if (afastObject.views) views = afastObject.views
    // Create a root and render the views to it
    imports.add(`import React from'react'`)
    imports.add(`import ReactDOM from 'react-dom/client'`)
    code.push(`const root = ReactDOM.createRoot(document.getElementById('${afastObject.rootId || DEFAULT_ROOT_ID}'))`)
    code.push(`root.render(React.createElement(${__name}))`)
}

const parseModule = (afastObject, imports, code) => {
    const variables = []
    const props = []
    parseVariables(afastObject.variables, variables)
    if (afastObject.script) code.push(`import '${afastObject.script}'`)
    if (afastObject.props) {
        Object.keys(afastObject.props).forEach((key) => {
            props.push(key)
        })
    }
    if (afastObject.events) {
        Object.keys(afastObject.events).forEach((key) => {
            props.push(renameEvent(key))
        })
    }
    if (afastObject.view) {
        imports.add(`import React from 'react'`)
        code.push(`export default function({${props.join()}}){ ${[
            ...variables,
            `return ${parseView(imports, afastObject.view, afastObject)}`
        ].join('\n')}}`)
    }
}

module.exports = function (source) {
    const imports = new Set()
    const code = []
    let afastObject
    try {
        afastObject = JSON.parse(source)
    } catch (err) {
        throw new Error('The file is not a valid afast file')
    }
    switch (afastObject.type) {
        case "index": parseIndex(afastObject, imports, code); break
        case "module": parseModule(afastObject, imports, code); break
        default: throw new Error('The file is not a valid afast file')
    }
    return [...imports, ...code].join('\n');

}