############################## Installation ########################

# GiN

### Create conda env

```
conda create -n GiN python=3.9 jupyterlab=3.4 ipywidgets=7.5.1 nodejs=14.15.1  -y

```

### Installing dependencies

-- [yarn](https://www.npmjs.com/package/yarn)

```
npm install -g yarn
```

-- [ipyuploads](https://github.com/g2nb/ipyuploads.git) 

```
git clone https://github.com/g2nb/ipyuploads.git && \
    cd ipyuploads && pip install .
```

-- [nbtools](https://github.com/g2nb/nbtools.git)

```
git clone -b lab https://github.com/g2nb/nbtools.git

cd nbtools/

pip install .

jupyter labextension install . 
jupyter nbextension install --py nbtools --sys-prefix 
jupyter nbextension enable --py nbtools --sys-prefix
```

-- [bioblend](https://github.com/galaxyproject/bioblend.git)

```
pip install bioblend
```

GiN installation
===============================

A Custom Jupyter Widget Library

Installation
------------

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)),

    $ git clone https://github.com/jaidevjoshi83/GiN.git 
    $ cd GiN
    $ npm install @g2nb/nbtools
    $ pip install .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix GiN
    $ jupyter nbextension enable --py --sys-prefix GiN
    
When actively developing your extension for JupyterLab, run the command:

    $ cd GiN
    $ npm install @g2nb/nbtools
    $ pip install .
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
---

# Screenshots..

## Login

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/login.png)

## Galaxy tool form

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/tool_form1.png)

## Job status 

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/Job_Status.png)

## History Data

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/History_Data.png)

## Data sharing widget

![alt text](https://github.com/jaidevjoshi83/GiN/blob/repeat/GiN_Screenshot/data_sharing_widget.png)
