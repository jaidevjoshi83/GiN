
# galaxylab


## Installation nbtools

Conda env:

```
create -n galaxy-lab JupyterLab=2.2.9 ipywidgets=7.5.1 nodejs -y

########################################################################
## Note optional step, if in case it dint work this step can be followed. 
# bleep, bloop
# npm i backbone@1.2.3
# npm i @types/backbone@1.4.4
########################################################################

pip install . && jupyter labextension install .

```

## Installation of galaxylab

git clone -b co_working https://github.com/jaidevjoshi83/galaxylab.git

-- Installation of nbtools for build 

    cd galaxylab

    npm install @genepattern/nbtools@20.10.0-alpha.0 --registry http://0.0.0.0:4873

-- galaxylab installatoin

    cd galaxylab/

    pip install -e .

    jupyter labextension install .

    jupyter nbextension enable --py widgetsnbextension

    jupyter labextension install @jupyter-widgets/jupyterlab-manager
  
  
