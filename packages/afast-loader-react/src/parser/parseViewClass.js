const parseViewClass = (view) => {
  // Not allowed use className in props
  if (view.props && (view.props.class || view.props.className))
    throw new Error("`class` or `className` is not allowed to defined in `props`")
  if(view.class){
    if(!view.props) view.props = {}
    view.props.className = view.class
  }
}
module.exports = parseViewClass