

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


const New_tool_list  = {}

export { Private ,  getRanNotebookIds, getOrigins, getIndex, New_tool_list };
