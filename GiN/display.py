import IPython

# from .jobwidget import GalaxyJobWidget
# from .authwidget import GalaxyAuthWidget
# from .taskwidget import GalaxyTaskWidget


def display(content):
    """
    Display a widget, text or other media in a notebook without the need to import IPython at the top level.
    Also handles wrapping Galaxy Python Library content in widgets.
    :param content:
    :return:
    """
    # if isinstance(content, ToDo):
    #    IPython.display.display(GalaxyAuthWidget(content))
    # elif isinstance(content, ToDo):
    #    IPython.display.display(GalaxyTaskWidget(content))
    # elif isinstance(content, ToDo):
    #    IPython.display.display(GalaxywJobWidget(content))
    # else:
    IPython.display.display(content)
