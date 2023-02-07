FROM jupyter/scipy-notebook:2022-02-17

EXPOSE 8888

#############################################
##  ROOT                                   ##
##      Install npm                        ##
#############################################

USER root

RUN apt-get update && apt-get install -y npm

#############################################
##  $NB_USER                               ##
##      Install python libraries           ##
#############################################

USER $NB_USER

#RUN conda create -n GINT python=3.9 install -c conda-forge jupyterlab=3.4 nodejs  npm install -g yarn

RUN conda install -c conda-forge jupyterlab=3.4 nodejs=14.15.1 && \
    npm install -g yarn

#############################################
##  $NB_USER                               ##
##      Clone & install ipyuploads repo    ##
#############################################

RUN git clone https://github.com/g2nb/ipyuploads.git && \
    cd ipyuploads && pip install .

#############################################
##  $NB_USER                               ##
##      Clone the nbtools repo             ##
#############################################

RUN git clone https://github.com/g2nb/nbtools.git

#############################################
##  $NB_USER                               ##
##      Build and install nbtools          ##
#############################################

RUN cd nbtools && pip install . && \
    jupyter labextension install . && \
    jupyter nbextension install --py nbtools --sys-prefix && \
    jupyter nbextension enable --py nbtools --sys-prefix

#############################################
##  $NB_USER                               ##
##      Install GalaxyLab                  ##
#############################################

RUN pip install bioblend && \
    git clone https://github.com/jaidevjoshi83/GiN.git && \
    cd GiN && npm install @g2nb/nbtools && pip install . && \
    jupyter nbextension install --py --symlink --overwrite --sys-prefix GiN && \
    jupyter nbextension enable --py --sys-prefix GiN


#############################################
##  $NB_USER                               ##
##      Launch lab by default              ##
#############################################

ENV JUPYTER_ENABLE_LAB="true"
ENV TERM xterm