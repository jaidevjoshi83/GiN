from bioblend import galaxy


def Job():

    gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key="b6b0868d4c27b745be2bd68d04c1c213")

    job = gi.tools.run_tool(history_id='f597429621d6eb2b', tool_id='toolshed.g2.bx.psu.edu/repos/jay/pdaug_peptide_data_access/pdaug_peptide_data_access/0.1.0', tool_inputs={'SelPlotting':'HeatMap'})