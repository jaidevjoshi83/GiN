#!/bin/sh

conda create -n galaxy-lab -c conda-forge JupyterLab=3.1 ipywidgets nodejs yarn -y
source ~/anaconda3/etc/profile.d/conda.sh
conda activate galaxy-lab

echo 'downloading requirments'
#Download the Brancch

git clone -b lab https://github.com/genepattern/nbtools.git
git clone -b  build_function https://github.com/jaidevjoshi83/bioblend.git
git clone https://github.com/jaidevjoshi83/galaxylab.git 

#Installation of nbtools for build
echo 'essential node packages'

npm install -g yalc 
npm install rimraf


echo 'Publish nbtools using yalc'

cd nbtools/

npm install 

yalc publish
 
echo 'Installation of nbtools'

pip install . 

jupyter nbextension enable --py widgetsnbextension

jupyter labextension install @jupyter-widgets/jupyterlab-manager

jupyter labextension develop . --overwrite

jupyter nbextension install --py nbtools --symlink --user

jupyter nbextension enable nbtools --py

echo "Exit nbtools directory..."

cd ..

# galaxylab installation
# A Custom Jupyter Widget Library

# Installation
# Install bioblend API,


echo "Install bioblend..."

cd bioblend/
pip install .

echo "Exiting bioblen directory..."

cd ..

echo "Installing galaxylab ..."

cd galaxylab/js
yalc add @genepattern/nbtools

cd ..

pip install -e .

jupyter nbextension install --py --symlink --overwrite --sys-prefix galaxylab
jupyter nbextension enable --py --sys-prefix galaxylab
jupyter labextension develop --overwrite galaxylab


echo "Install successfully"

#jupyter lab 
# Then you need to rebuild the JS when you make a code change:

# $ cd js
# $ yarn run build
# You then need to refresh the JupyterLab page when your javascript changes.

