
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
    git clone -b working_3Xlab_with_client_build  https://github.com/jaidevjoshi83/galaxylab.git

    cd galaxylab/
   
    yalc add @genepattern/nbtools
   
    pip install -e . (Work smoothly most of the time rarely throws an error, if dint work and throws package related errors, run "npm install" first and then "pip install -e .") 

    jupyter labextension develop . --overwrite
    
    jupyter nbextension install --py galaxylab --symlink
    
    jupyter nbextension enable galaxylab --py
    
    ```
    
    Note: If galaxy login dint appear in the side panel manually "import galaxylab" and refresh/reload the page.
    
    
  
  
  
