const parseViewKey = (view) => {
  // Not allowed use key in props
  if (view.props && (view.props.key))
    throw new Error("`key` is not allowed to defined in `props`")
  if (view.key) {
    if (!view.props) view.props = {}
    view.props.key = view.key
  }
}

module.exports = parseViewKey