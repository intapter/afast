const parseObject = require("./parseObject.js");
const { HTML_ELE_TAGS } = require("../constant/html.js");
const { getViews } = require("../hooks/views.js");
const {
  DEFAULT_FOR_KEY_NAME,
  DEFAULT_FOR_ITEM_NAME,
} = require("../constant/command-for.js");
const parseViewImport = require("./parseViewImport.js");
const parseViewEvents = require("./parseViewEvents.js");
const parseValue = require("./parseValue.js");
const parseViewClass = require("./parseViewClass.js");
const parseViewStyle = require("./parseViewStyle.js");
const parseViewKey = require("./parseViewKey.js");

const parseView = (
  imports,
  view,
  afastObject,
  innerCode,
  slots,
  nodes,
  depth = 0
) => {
  if (!view.props) view.props = {};

  // Parse events of view
  const noParseKeys = ["ref"];

  const viewsImportMemo = new Map();

  let tag;
  // Parse name of view
  if (nodes.includes(view.name)) {
    // This view is a node
    return view.name
  } else if (slots.includes(view.name)) {
    // This view is a slot
    tag = view.name;
  } else if (HTML_ELE_TAGS.has(view.name)) {
    // This view is a normal HTML element
    tag = `'${view.name}'`;
  } else {
    // This view is a custom component
    const views = getViews();
    if (!views)
      throw new Error(
        "Not allowed to use a component because you did not set the `views` property in the index file"
      );
    tag = parseViewImport(views, imports, view.name, viewsImportMemo);
  }

  // Parse class of view
  parseViewClass(view);
  // Parse style of view
  parseViewStyle(view);
  // Parse key of view
  parseViewKey(view);

  // Parse children of view
  const children = [];
  if (view.children) {
    view.children.forEach((child) => {
      children.push(
        parseView(
          imports,
          child,
          afastObject,
          innerCode,
          slots,
          nodes,
          depth + 1
        )
      );
    });
  }

  // Parse nodes of view
  if (view.nodes) {
    Object.keys(view.nodes).forEach((name) => {
      const node = view.nodes[name];
      if (Array.isArray(node)) {
        const list = [];
        node.forEach((n) => {
          list.push(
            parseView(
              imports,
              n,
              afastObject,
              innerCode,
              slots,
              nodes,
              depth + 1
            )
          );
        });
        view.props[name] = `React.createElement(React.Fragment,{},${list.join()})`;
      } else if (typeof node === "object") {
        view.props[name] = parseView(
          imports,
          node,
          afastObject,
          innerCode,
          slots,
          nodes,
          depth + 1
        );
      }
      noParseKeys.push(name);
    });
  }

  // Parse slots of view
  if (view.slots) {
    Object.keys(view.slots).forEach((name) => {
      const slot = view.slots[name];
      const receives = slot.receives ? slot.receives.join() : "";
      if (slot.children && Array.isArray(slot.children)) {
        const list = [];
        slot.children.forEach((child) => {
          list.push(
            parseView(
              imports,
              child,
              afastObject,
              innerCode,
              slots,
              nodes,
              depth + 1
            )
          );
        });
        view.props[name] = `({${receives}}) => ([${list.join()}])`;
      } else if (typeof slot === "object") {
        view.props[name] = `({${receives}}) => ${parseView(
          imports,
          slot,
          afastObject,
          innerCode,
          slots,
          nodes,
          depth + 1
        )}`;
      }
      noParseKeys.push(name);
    });
  }

  if (view.events) {
    parseViewEvents(afastObject, view, noParseKeys, imports, innerCode);
  }

  // Parse ref of view
  if (view.props.ref) delete view.props.ref;
  if (view.ref) {
    view.props.ref = view.ref;
  }

  // Auto add className and style
  if (depth === 0) {
    imports.add(`import classNames from 'classnames'`);
    if (!view.props.className) {
      view.props.className = "{{className}}";
    } else {
      view.props.className = `{{classNames(${parseValue(
        view.props.className,
        imports
      )}, className)}}`;
    }
    if (!view.props.style) view.props.style = "{{style}}";
  }

  const generateElementCode = () => {
    return `React.createElement(${tag}, ${parseObject(
      view.props,
      noParseKeys,
      imports
    )}, ${
      children && children.length > 0
        ? children.join()
        : view.text
        ? `${parseValue(view.text, imports)}`
        : null
    })`;
  };

  // Parse `for` of view
  const generateForNormal = () => {
    if (view.for && typeof view === "object") {
      if (!view.for.array)
        throw new Error(
          "Field `array` is required when you set a for-command for this view"
        );
      // TODO check weather the field is exist
      if (Array.isArray(view.for.array)) {
        // Receive an array config
        view.for.array = parseValue(view.for.array, imports);
      }
      return `${view.for.array}.map((${
        view.for.item || DEFAULT_FOR_ITEM_NAME
      },${view.for.key || DEFAULT_FOR_KEY_NAME}) => ${generateElementCode()})`;
    }
    // Or return a normal view
    else {
      return generateElementCode();
    }
  };

  // Parse `if` of view
  if (view.if) {
    return `${view.if} ? ${generateForNormal()} : null`;
  } else {
    return generateForNormal();
  }
};

module.exports = parseView;
