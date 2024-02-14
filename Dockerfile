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

RUN conda install -c conda-forge jupyterlab=3.4 nodejs=16 && \
    npm install -g yarn

#############################################
##  $NB_USER                               ##
##      install ipyuploads repo            ##
#############################################

RUN pip install ipyuploads 

#############################################
##  $NB_USER                               ##
##      install nbtools                    ##
#############################################

RUN pip install nbtools && \
    jupyter nbextension install --py nbtools --sys-prefix && \
    jupyter nbextension enable --py nbtools --sys-prefix

#############################################
##  $NB_USER                               ##
##      Install  GiN                       ##
#############################################

RUN pip install bioblend && \
    pip install galaxy-gin==0.1.0a8 && \
    jupyter nbextension install --py --symlink --overwrite --sys-prefix GiN && \
    jupyter nbextension enable --py --sys-prefix GiN

#############################################
##  $NB_USER                               ##
##      Install  genepattern-notebook      ##
#############################################

RUN pip install genepattern-notebook


#############################################
##  $NB_USER                               ##
##      Launch lab by default              ##
#############################################

ENV JUPYTER_ENABLE_LAB="true"
ENV TERM xterm
