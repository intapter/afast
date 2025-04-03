const parseViewStyle = (view) => {
  // Not allowed use style in props
  if (view.props && (view.props.style))
    throw new Error("`style` is not allowed to defined in `props`")
  if(view.style){
    if(!view.props) view.props = {}
    view.props.style = view.style
  }
}

module.exports = parseViewStyle