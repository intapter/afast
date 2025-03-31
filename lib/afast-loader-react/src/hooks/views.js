let views = null;
module.exports = {
    registerViews(vs){
        views = vs;
    },
    getViews(){
        return views;
    }
}