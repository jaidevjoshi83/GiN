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
    
    jupyter nbextension install --py nbtools --symlink
    
    jupyter nbextension enable nbtools --py
    
    ```
     

-- galaxylab installatoin


    ```
    git clone -b galaxylab-js  https://github.com/jaidevjoshi83/galaxylab.git

    cd galaxylab/
   
    yalc add @genepattern/nbtools
   
    pip install -e . (Work smoothly most of the time rarely throws an error, if dint work and throws package related errors, run "npm install" first and then "pip install -e .") 

    jupyter labextension develop . --overwrite
    
    jupyter nbextension install --py galaxylab --symlink
    
    jupyter nbextension enable galaxylab --py
    
    ```
    
    
  
  
 

############################## Ignore this  ########################
galaxylab
===============================

A Custom Jupyter Widget Library

Installation
------------

To install use pip:

    $ pip install galaxylab

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)),

    $ git clone https://github.com/galaxy/galaxylab.git
    $ cd galaxylab
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix galaxylab
    $ jupyter nbextension enable --py --sys-prefix galaxylab

When actively developing your extension for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite galaxylab

Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.

