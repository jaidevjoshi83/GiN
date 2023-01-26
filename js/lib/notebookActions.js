

const getRanNotebookIds = () => {
    return Private.ranNotebookIds;
};

const getOrigins = () => {
    return Private.origins;
};

const getIndex = () => {
    return Private.Index;
};
var Private;
(function (Private) {
    Private.ranNotebookIds = [];
    Private.origins = []
    Private.Index = null
})(Private || (Private = {}));


export { Private ,  getRanNotebookIds, getOrigins, getIndex };
