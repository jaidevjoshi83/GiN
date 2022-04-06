############################## Installation ########################

####### Easy installation (Mac/Linux) #######
-- create an easy_installation directory 
-- copy `Easy_install.sh` to the easy_installation dir
-- run `sh Easy_install.sh`

**NOTE:** Change this line according to your conda type (anaconda or miniconda),  `source ~/anaconda3/etc/profile.d/conda.sh` in the `Easy_install.sh` file.
#################################


####### Manual Installation (Mac/Linux) #######


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

     npm install 
     
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

Install bioblend API,

    $ git clone -b  build_function https://github.com/jaidevjoshi83/bioblend.git
    $ cd bioblend
    $ pip instal .

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)),

    $ git clone https://github.com/jaidevjoshi83/galaxylab.git 
    $ cd galaxylab/js
    $ yalc add @genepattern/nbtools
    $ cd ..
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix galaxylab
    $ jupyter nbextension enable --py --sys-prefix galaxylab
    
When actively developing your extension for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite galaxylab
    
Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.
