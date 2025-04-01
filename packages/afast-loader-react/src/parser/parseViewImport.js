const parseViewImport = (views, imports, name, viewsImportMemo) => {
    if (viewsImportMemo.has(name)) {
        return viewsImportMemo.get(name)
    }
    const tag = `_afast_import_view_${name}`
    const viewConfig = views[name];
    if (typeof viewConfig === 'string') {
        // Import from src
        imports.add(`import ${tag} from '${viewConfig}'`);
    } else if (typeof viewConfig === 'object' && viewConfig.name) {
        if (viewConfig.src) {
            // Import module from src
            if (viewConfig.name === 'default' || viewConfig.name === undefined) {
                imports.add(`import ${tag} from '${viewConfig.src}'`);
            }else{
                imports.add(`import {${viewConfig.name} as ${tag}} from '${viewConfig.src}'`);
            }
        } else if (viewConfig.parent) {
            // Unpack module from view
            const viewTag = parseViewImport(views, imports, viewConfig.parent, viewsImportMemo)
            imports.add(`const ${tag} = ${viewTag}.${viewConfig.name}`)
        }
    } else {
        throw new Error(
            "Cannot find a component named `" +
            name +
            "`, did you forget to add it to the `views` property in the index file?"
        );
    }
    viewsImportMemo.set(name, tag)
    return tag
}

module.exports = parseViewImport