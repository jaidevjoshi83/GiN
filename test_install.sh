 git clone -b lab https://github.com/g2nb/nbtools.git 
 git clone -b  build_function https://github.com/jaidevjoshi83/bioblend.git 
 git clone https://github.com/jaidevjoshi83/GiN.git

 git clone -b lab https://github.com/genepattern/genepattern-notebook.git && \
	cd genepattern-notebook && \
	pip install .
cd ..


npm install -g yalc

cd nbtools &&  \
    git checkout b6e90bd00accd43e0091aafdb0fe13e1d4d702fa && \
    npm install rimraf && \
    pip install . && \
	jupyter nbextension enable --py widgetsnbextension && \
	jupyter labextension install @jupyter-widgets/jupyterlab-manager && \
	jupyter labextension develop . --overwrite && \
	jupyter nbextension install --py nbtools --symlink --user &&\
	jupyter nbextension enable nbtools --py && \
	yalc publish

cd ..

cd bioblend/ && \
	pip install .

cd ..

cd GiN/js && yalc add @g2nb/nbtools && npm install 

cd ..

 pip install . && \
    jupyter nbextension install --py --symlink --overwrite --sys-prefix GiN && \
    jupyter nbextension enable --py --sys-prefix GiN  --user && cd .. && \
    jupyter labextension develop --overwrite GiN --user 
   
