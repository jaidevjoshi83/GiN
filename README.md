############################## Installation ########################



# GiN


## Installation nbtools

Conda env:

```
conda create -n GiN JupyterLab=3.0.7 ipywidgets=7.5.1 nodejs=14.15.1 yarn -y

```

## Installation of nbtools

-- Download the Brancch

    ```
    git clone -b lab https://github.com/g2nb/nbtools.git
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
      

GiN installation
===============================

A Custom Jupyter Widget Library

Installation
------------

Install bioblend API,

    $ git clone -b  build_function https://github.com/jaidevjoshi83/bioblend.git
    $ cd bioblend
    $ pip instal .

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)),

    $ git clone https://github.com/jaidevjoshi83/GiN.git 
    $ cd GiN/js
    $ yalc add @g2nb/nbtools
    $ cd ..
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix GiN
    $ jupyter nbextension enable --py --sys-prefix GiN
    
When actively developing your extension for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite GiN
    
Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.


Docker
===============================

A Docker image with GiN and the full JupyterLab stack is available through DockerHub.

```
docker pull jayadevjoshi12/gin:latest
docker run --rm -p 8888:8888 jayadevjoshi12/gin:latest
```

## Screenshots..

# Login

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/login.png)

# Galaxy tool form

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/tool_form1.png)

# Job status 

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/Job_Status.png)

# Data sharing widget

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/data_sharing_widget.png)
