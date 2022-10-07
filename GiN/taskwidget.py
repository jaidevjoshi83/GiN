import os
import IPython
from nbtools import NBTool
from .Galaxyuibuilder import GalaxyUIBuilder
from .util import DEFAULT_COLOR, DEFAULT_LOGO
import bioblend.galaxy.objects as hi
import json5
import logging
import IPython.display
import glob
from nbtools import UIBuilder

log = logging.getLogger(__name__)

try:
    from genepattern import authwidget
except:
    print("need to be fixed...!")
    pass

try:
    from gp import GPTask
except ModuleNotFoundError:
    log.warning(
        "gp module is not available, will not be able to mix GiN with GenePattern"
    )
    GPTask = None
import GiN


class GalaxyTaskWidget(GalaxyUIBuilder):
    """A widget for representing the status of a Galaxy job"""

    # default_color = 'rgba(10, 45, 105, 0.80)'
    default_color = DEFAULT_COLOR
    default_logo = DEFAULT_LOGO
    tool = None

    def __init__(self, tool=None, **kwargs):
        self.tool = tool

    def RetrivParm(inputs, prefix=""):

        OutDict = {}

        for i in inputs:

            full_name = prefix + i["name"]

            OutDict[full_name] = i
            if i["model_class"] == "Conditional":
                for j in i["cases"]:
                    Dict1 = GalaxyTaskWidget.RetrivParm(j["inputs"], full_name + "|")
                    OutDict = dict(list(OutDict.items()) + list(Dict1.items()))
            elif i["model_class"] == "Repeat":
                Dict2 = GalaxyTaskWidget.RetrivParm(i["inputs"], full_name + "|")
                OutDict = dict(list(OutDict.items()) + list(Dict2.items()))
            elif i["model_class"] == "Section":
                Dict3 = GalaxyTaskWidget.RetrivParm(i["inputs"], full_name + "|")
                OutDict = dict(list(OutDict.items()) + list(Dict3.items()))

        return OutDict

    def submit_job(gal_instance=None, tool_inputs=None, history_id=None):

        a = GiN.sessions.SessionList()
        gi1 = a.get(server=gal_instance["url"])
        tool_inputs = json5.loads(tool_inputs)

        new_inputs = GalaxyTaskWidget.RefinedInputs(tool_inputs, gi1)

        job = gi1.tools.gi.tools.run_tool(
            history_id=history_id, tool_id=gal_instance["tool_id"], tool_inputs=new_inputs
        )

        return IPython.display.JSON(job)

    
    def show_job(gal_instance=None, job_id=None):

        a = GiN.sessions.SessionList()
        gi1 = a.get(server=gal_instance["url"])
        
        job = gi1.jobs.gi.jobs.show_job(job_id=job_id)

        return IPython.display.JSON(job)

    def get_data_type_and_genomes(server=None):

        a = GiN.sessions.SessionList()
        gi2 = a.get(server=server)

        data_types = gi2.gi.datatypes.get_datatypes()
        genomes = gi2.gi.genomes.get_genomes()
        datatypes_genomes = {
            "datatypes": data_types,
            "genomes": genomes,
        }

        return IPython.display.JSON(datatypes_genomes)

    def upload_dataset(
        file_path, upload_method, datatype, genome, server=None, HistoryID=None
    ):

        a = GiN.sessions.SessionList()
        gi3 = a.get(server=server)

        history = gi3.gi.histories.show_history(history_id=HistoryID)
        # a = hi.History(history, gi=gi3.gi)

        if upload_method == "text":
            job = gi3.gi.tools.put_url(content=file_path, history_id=HistoryID)
            return IPython.display.JSON(job)

        elif upload_method == "textarea":
            job = gi3.gi.tools.put_url(content=file_path, history_id=HistoryID)
            return IPython.display.JSON(job)

        # return IPython.display.JSON(job)

    def TestOut(server=None, JobID=None):

        a = GiN.sessions.SessionList()
        gi4 = a.get(server=server)

        status = gi4.jobs.gi.jobs.show_job(JobID, full_details=True)
        return IPython.display.JSON(status)

    def OutPutData(server=None, JobID=None):

        a = GiN.sessions.SessionList()
        gi5 = a.get(server=server)

        showJob = gi5.jobs.gi.jobs.show_job(JobID, full_details=True)

        DataList = []

        for i in showJob["outputs"].keys():
            DataList.append(
                gi5.gi.datasets.gi.datasets.show_dataset(
                    dataset_id=showJob["outputs"][i]["id"],
                    hda_ldda=showJob["outputs"][i]["src"],
                )
            )

        return IPython.display.JSON(DataList)

    def RefinedInputs(inputs, gi):

        for i in inputs.keys():
            if type(inputs[i]) == dict:
                if list(inputs[i].keys())[0] == "values":
                    new_values = []
                    for j in inputs[i]["values"]:
                        # print(j)
                        # Dataset = gi.gi.datasets.gi.datasets.show_dataset(dataset_id=j)
                        # new_values.append({'src':Dataset['hda_ldda'],'id':Dataset['id']})
                        new_values.append(j)
                    inputs[i]["values"] = new_values
        return inputs

    def updated_form(
        server=None,
        tool_inputs=None,
        tool_id=None,
        history_id=None,
        python_side=False,
        input_data_param=False,
    ):
        a = GiN.sessions.SessionList()
        gi6 = a.get(server=server)

        if (tool_inputs) and (tool_id):
            # Tool_inputs = {
            #             "input1": [
            #                 {
            #                 "id": "f9cad7b01a4721354c1067e5bc96aecd",
            #                 "hid": 1,
            #                 "name": "UCSC Main on Human: knownGene (chr21:1-48,129,895)",
            #                 "tags": [],
            #                 "src": "hda"
            #                 }
            #             ],
            #             "maf_source_type|maf_source": "cached",
            #             "maf_source_type|mafFile": [],
            #             "maf_source_type|mafType": "100_WAY_MULTIZ_v2_hg19",
            #             "split_blocks_by_species_selector|split_blocks_by_species": "dont_split_blocks_by_species",
            #             "split_blocks_by_species_selector|remove_all_gap_columns": "remove_all_gap_columns"
            #     }

            print(tool_inputs)

            inputs = gi6.tools.gi.tools.build(
                tool_id=tool_id, inputs=tool_inputs, history_id=history_id
            )

            if input_data_param is False:
                return IPython.display.JSON(data=inputs)
            else:
                return IPython.display.JSON(
                    GalaxyTaskWidget.RetrivParm(inputs["inputs"])
                )

        elif (tool_inputs is None) and (tool_id is not None):

            inputs = gi6.tools.gi.tools.build(tool_id=tool_id, history_id=history_id)
            return IPython.display.JSON(data=inputs)

        else:
            history_data = gi6.gi.datasets.gi.datasets.get_datasets(
                history_id=history_id,
                state="ok",
                deleted=False,
                purged=False,
                visible=True,
            )

            if python_side is True:
                return history_data
            else:
                return IPython.display.JSON(data=history_data)

    def history_data_list(server=None, history_id=None):

        a = GiN.sessions.SessionList()
        gi7 = a.get(server=server)


        history_data = gi7.gi.datasets.gi.datasets.get_datasets(
            history_id=history_id, deleted=False, purged=False, visible=True
        )
        # for i in HistoryData:
        #     datasets.append(gi.gi.datasets.gi.datasets.show_dataset(dataset_id=i['id']))

        return IPython.display.JSON(history_data)

    def show_data_set(server=None, dataset_id=None):

        a = GiN.sessions.SessionList()
        gi8 = a.get(server=server)

        show_dataset = gi8.gi.datasets.gi.datasets.show_dataset(dataset_id=dataset_id)
        return IPython.display.JSON(show_dataset)

    def delete_dataset(server=None, history_id=None, dataset_id=None):

        a = GiN.sessions.SessionList()
        gi9 = a.get(server=server)

        gi9.gi.histories.gi.histories.delete_dataset(
            history_id=history_id, dataset_id=dataset_id, purge=True
        )

    def delete_dataset_collection(
        server=None, history_id=None, dataset_collection_id=None
    ):

        a = GiN.sessions.SessionList()
        gi10 = a.get(server=server)

        gi10.gi.histories.gi.histories.delete_dataset_collection(
            history_id=history_id,
            dataset_collection_id=dataset_collection_id,
            # purge=True,
        )

    def show_dataset_collection(server=None, dataset_id=None):

        a = GiN.sessions.SessionList()
        gi11 = a.get(server=server)

        show_dataset = gi11.gi.dataset_collections.show_dataset_collection(
            dataset_collection_id=dataset_id
        )
        return IPython.display.JSON(show_dataset)

    # def read_datafiles_files(data_url, ext):

    #     if ext == 'csv' or ext == 'tabular' or  ext == 'txt' :
    #         s=requests.get(data_url).content
    #         dataframe = pd.read_csv(io.StringIO(s.decode('utf-8')))
    #         return dataframe

    #     elif ext == 'png':
    #         im = Image.open(requests.get(data_url, stream=True).raw)
    #         return im

    #     elif ext == 'fasta' or ext == 'bed':
    #         response = urlopen(data_url)
    #         fasta = response.read().decode("utf-8", "ignore")
    #         return fasta

    def download_file_to_jupyter_server(
        server=None,
        data_type="dataset",
        collection_id=None,
        ext="zip",
        file_name=None,
        dir="galaxy_data",
    ):

        a = GiN.sessions.SessionList()
        gi12 = a.get(server=server)

        galaxy_data = os.path.join(os.getcwd(), dir)

        if not os.path.exists(galaxy_data):
            os.mkdir(galaxy_data)

        if data_type == "collection":
            file_path = os.path.join(galaxy_data, file_name) + "." + ext
            gi12.gi.dataset_collections.download_dataset_collection(
                dataset_collection_id=collection_id, file_path=file_path
            )
        else:
            gi12.gi.datasets.download_dataset(
                dataset_id=collection_id, file_path=galaxy_data
            )

    def CORS_fallback_upload(
        file_name,
        data, 
        server,
        history_id,
    ):

        temp_dir = os.path.join(os.getcwd(), "temp")

        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)

        f = open(os.path.join(temp_dir, file_name), 'w')
        f.write(data)
  
        a = GiN.sessions.SessionList()
        gi = a.get(server=server)

        path = os.path.join(temp_dir, file_name)
        out = gi.tools.gi.tools.upload_file(path=path, history_id=history_id)
       
        return IPython.display.JSON(out)

    def send_data_to_galaxy_tool(
        server_d=None,
        server_u=None,
        file_name=None,
        dataset_id=None,
        ext="zip",
        history_id=None,
    ):

        a = GiN.sessions.SessionList()
        gi13 = a.get(server=server_d)
        gi14 = a.get(server=server_u)

        temp_dir = os.path.join(os.getcwd(), "temp")

        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)

        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))

        gi13.gi.datasets.download_dataset(
            dataset_id=dataset_id, file_path=temp_dir, require_ok_state=False
        )

        file_name = glob.glob(temp_dir + "/*.*")

        out = gi14.tools.gi.tools.upload_file(path=file_name[0], history_id=history_id)

        return IPython.display.JSON(out)

        # if not os.path.exists(galaxy_data):
        #     os.mkdir(galaxy_data)
        #     gi.gi.datasets.download_dataset(dataset_id=collection_id, file_path=galaxy_data)


    def upload_fallback(
        server_u=None,
        file_name=None,
    ):

        gi14 = a.get(server=server_u)
        file_name = glob.glob(temp_dir + "/*.*")

        out = gi14.tools.gi.tools.upload_file(path=file_name[0], history_id=history_id)

        return IPython.display.JSON(out)


    def send_data_to_gp_server(file_name, tool_id, dataset_id, server, ext):

        temp_dir = os.path.join(os.getcwd(), "temp")

        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)

        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))

        GalaxyTaskWidget.download_file_to_jupyter_server(
            server=server, collection_id=dataset_id, dir="temp"
        )

        file_name = glob.glob(os.path.join(temp_dir, "*.*"))
        new_file = os.path.join(
            "/".join(file_name[0].split("/")[: len(file_name[0].split("/")) - 1]),
            "data." + ext,
        )
        os.rename(file_name[0], new_file)
        ####################
        task = GPTask(authwidget.session.sessions[0], tool_id)
        uri = task.server_data.upload_file(
            new_file.split("/")[len(new_file.split("/")) - 1], new_file
        )
        #####################
        return IPython.display.JSON({"uri": uri.uri})

    def return_job_status(server=None, job_id=None):

        a = GiN.sessions.SessionList()
        gi15 = a.get(server=server)

        job_state = gi15.gi.jobs.show_job(job_id=job_id, full_details=True)

        return IPython.display.JSON(job_state)

    def return_job_state(server=None, job_id=None):

        a = GiN.sessions.SessionList()
        gi16 = a.get(server=server)

        job_state = gi16.gi.jobs.get_state(job_id=job_id)

        return IPython.display.JSON({"job_state": job_state})

    def handle_error_task(self, error_message, name="Galaxy Module", **kwargs):
        """Display an error message if the task is None"""
        UIBuilder.__init__(self, lambda: None, color=self.default_color, **kwargs)

        self.name = name
        self.display_header = False
        self.display_footer = False
        self.error = error_message

    def __init__(self, tool=None, **kwargs):

        """Initialize the task widget"""

        if tool is None:
            pass
        else:

            self.tool = tool

            self.gal_instance = {
                "api_key": self.tool["gi"]._key,
                "email_ID": self.tool['gi'].users.get_current_user()['email'],
                "url": self.tool["gi"].base_url,
                "tool_id": self.tool["id"],
                "tool_name": self.tool["name"],
                "tool_description": self.tool["description"],
            }

            history_ids = self.tool["gi"].histories.gi.histories.get_histories()

            if self.tool["id"] == "GiN_data_upload_tool":
                inputs = {
                    "id": "GiN_data_upload_tool",
                    "inputs": [
                        {
                            "model_class": "DataToolParameter",
                            "name": "input1",
                            "type": "data_upload",
                        }
                    ],
                    "help": "<p>Upload data tool</p>\n<p>This tool uploads data to the selected history of the Galaxy server. User can select file from the local machine, data can be fetch directly from the URL or can be generated by available UI and uploaded to the server.</p>\n",
                }

            else:
                inputs = self.tool["gi"].tools.gi.tools.build(
                    tool_id=tool["id"], history_id=history_ids[0]["id"]
                )

            history_data = GalaxyTaskWidget.updated_form(
                server=self.gal_instance["url"],
                history_id=history_ids[0]["id"],
                python_side=True,
            )

            GalaxyUIBuilder.__init__(
                self,
                inputs=inputs,
                galaxy_tool_id=self.tool["id"],
                history_ids=history_ids,
                history_data=history_data,
                gal_instance=self.gal_instance,
                color=self.default_color,
                logo=self.default_logo,
                **kwargs
            )

    @staticmethod
    def form_value(raw_value):

        """Give the default parameter value in format the UI Builder expects"""
        if raw_value is not None:
            return raw_value
        else:
            return ""


class TaskTool(NBTool):

    """Tool wrapper for the authentication widget"""

    def __init__(self, server_name, tool):
        NBTool.__init__(self)
        self.origin = server_name
        self.id = tool["id"]
        self.name = tool["name"]
        self.description = tool["description"]
        self.load = lambda: GalaxyTaskWidget(tool)
