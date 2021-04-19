
# galaxylab


## Installation nbtools

Conda env:

```
conda create -n galaxy-lab JupyterLab=2.2.9 ipywidgets=7.5.1 nodejs=14.15.1 -y

########################################################################
## Note optional step, if in case it dint work this step can be followed. 
# bleep, bloop
# npm i backbone@1.2.3
# npm i @types/backbone@1.4.4
########################################################################

pip install . && jupyter labextension install .

```

## Installation of galaxylab

-- Download the Brancch

    ```
    git clone -b co_working https://github.com/jaidevjoshi83/galaxylab.git
    ```

-- Installation of nbtools for build 

    cd galaxylab

    npm install @genepattern/nbtools@20.10.0-alpha.0 --registry http://0.0.0.0:4873

-- galaxylab installatoin

    cd galaxylab/

    pip install -e .

    jupyter labextension install .

    jupyter nbextension enable --py widgetsnbextension

    jupyter labextension install @jupyter-widgets/jupyterlab-manager
    
    jupyter-lab --no-browser
    
    Note: If galaxy login dint appear in the side panel just wait for a minute and refresh the page.
    
    
  
  
  
