# Pull the latest known good scipy notebook image from the official Jupyter stacks
FROM jupyter/scipy-notebook:2022-02-17

MAINTAINER Jayadev Joshi <jayadev.joshi12@gmail.com>
EXPOSE 8888

USER root

RUN apt-get update && apt-get install -y npm

USER $NB_USER

RUN conda install -c conda-forge JupyterLab=3.1 ipywidgets nodejs yarn -y 

RUN git clone -b lab https://github.com/g2nb/nbtools.git 
RUN git clone -b  build_function https://github.com/jaidevjoshi83/bioblend.git 
RUN git clone https://github.com/jaidevjoshi83/GiN.git
RUN git clone -b lab https://github.com/genepattern/genepattern-notebook.git && \
	cd genepattern-notebook && \
	pip install .

RUN npm install -g yalc
 
RUN cd nbtools &&  \
    npm install rimraf && \
    git checkout b6e90bd00accd43e0091aafdb0fe13e1d4d702fa && \
    pip install . && \
	jupyter nbextension enable --py widgetsnbextension && \
	jupyter labextension install @jupyter-widgets/jupyterlab-manager && \
	jupyter labextension develop . --overwrite && \
	jupyter nbextension install --py nbtools --symlink --user &&\
	jupyter nbextension enable nbtools --py && \
	yalc publish

RUN cd bioblend/ && \
	pip install .

RUN cd GiN/js && yalc add @g2nb/nbtools && npm install 

RUN cd GiN && \
    pip install . && \
    jupyter nbextension install --py --symlink --overwrite --sys-prefix GiN && \
    jupyter nbextension enable --py --sys-prefix GiN && cd .. 
   
ENV JUPYTER_ENABLE_LAB="true"
ENV TERM xterm
