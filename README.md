############################## Full installation method ########################

# galaxylab


## Installation nbtools

Conda env:

```
conda create -n galaxy-lab JupyterLab=3.0.7 ipywidgets=7.5.1 nodejs=14.15.1 yarn -y

```

## Installation of nbtools

-- Download the Brancch

    ```
    git clone -b lab https://github.com/genepattern/nbtools.git
    ```

-- Installation of nbtools for build 

     ```
     npm install -g yalc 
     
     cd nbtools/
     
     yalc publish
     
     ```
     
-- Installation of nbtools 
    
    ```
    cd nbtools/
    
    pip install . 
    
    jupyter nbextension enable --py widgetsnbextension
    
    jupyter labextension install @jupyter-widgets/jupyterlab-manager
    
    jupyter labextension develop . --overwrite
    
    jupyter nbextension install --py nbtools --symlink --user
    
    jupyter nbextension enable nbtools --py
    
    ```
      

galaxylab installation
===============================

A Custom Jupyter Widget Library

Installation
------------

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)),

    $ git clone https://github.com/jaidevjoshi83/galaxylab.git -b galaxylab-js
    $ cd galaxylab/js
    $ yalc add @genepattern/nbtools
    $ cd ..
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix galaxylab
    $ jupyter nbextension enable --py --sys-prefix galaxylab
    
Install bioblend API,

    $ git clone -b build_tool_api https://github.com/jaidevjoshi83/bioblend.git
    $ cd bioblend
    $ pip instal .

When actively developing your extension for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite galaxylab
    
Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.
