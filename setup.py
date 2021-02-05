import os
from setuptools import setup


__version__ = '0.1.0'


with open('README.md') as f:
    long_description = f.read()


setup(name='galaxy',
      packages=['galaxy'],
      version=__version__,
      description='Galaxy extension for JupyterLab',
      long_description=long_description,
      long_description_content_type="text/markdown",
      license='BSD',
      author='Jayadev Joshi',
      author_email='jayadev.joshi12@gmail.com',
      url='https://github.com/jaidevjoshi83/galaxy-jupyterlab.git',
      download_url='https://github.com/jaidevjoshi83/galaxy-jupyterlab.git/archive/' + __version__ + '.tar.gz',
      keywords=['galaxy','genepattern', 'genomics', 'bioinformatics', 'ipython', 'jupyter'],
      classifiers=[
          'Development Status :: 5 - Production/Stable',
          'Intended Audience :: Science/Research',
          'Intended Audience :: Developers',
          'Topic :: Scientific/Engineering :: Bio-Informatics',
          'License :: OSI Approved :: BSD License',
          'Programming Language :: Python :: 3.6',
          'Programming Language :: Python :: 3.7',
          'Framework :: Jupyter',
      ],
      install_requires=[
          'bioblend==0.14.0',
          'nbtools>=20',
          'notebook>=5.0.0',
          'ipywidgets>=7.0.0',
      ],
      normalize_version=False,
      )
