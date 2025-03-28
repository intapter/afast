let views = null
const DEFAULT_ROOT_ID = 'root'


const parseValue = (value) => {
    if (typeof value === 'string')
        return '`' + value.replace(/`/g, '\\\`') + '`'
    return value
}

const parseObject = (props) => {
    if (!props) return undefined
    return '{' + Object.keys(props).map((key) => {
        const value = typeof props[key] === 'object' ? parseObject(props[key]) : parseValue(props[key])
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

const parseView = (imports, view) => {
    let tag
    // Parse the first param of React.createElement
    if (['div', 'h1'].includes(view.name)) {
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
    // Parse the children
    const children = []
    if (view.children) {
        view.children.forEach((child) => {
            children.push(parseView(imports, child))
        })
    }
    return `React.createElement(${tag}, ${parseObject(view.props)}, ${children && children.length > 0 ? children.join() : view.text ? `\`${view.text}\`` : null})`
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
    parseVariables(afastObject.variables, variables)
    if (afastObject.script) code.push(`import '${afastObject.script}'`)
    if (afastObject.view) {
        imports.add(`import React from 'react'`)
        code.push(`export default function(){ ${[
            ...variables,
            `return ${parseView(imports, afastObject.view)}`
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