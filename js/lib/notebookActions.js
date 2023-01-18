

const getRanNotebookIds = () => {
    return Private.ranNotebookIds;
};

const getOrigins = () => {
    return Private.origins;
};

var Private;
(function (Private) {
    Private.ranNotebookIds = [];
    Private.origins = []
})(Private || (Private = {}));




export { Private ,  getRanNotebookIds, getOrigins };
