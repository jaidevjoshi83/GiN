import os
import IPython
from nbtools import NBTool
from .Galaxyuibuilder import GalaxyUIBuilder
from .util import DEFAULT_COLOR, DEFAULT_LOGO, GALAXY_SERVER_NAME_BY_URL
import json5
import logging
import IPython.display
import glob
from nbtools import UIBuilder
# from  .GalaxyUpload import GalaxyUpload
import os
import re
import json

from ipyuploads import Upload
import uuid
import threading

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

        a = GiN.sessions.SessionList()
        gi = a.get(server=self.tool['origin'])

        history_ids = gi.gi.histories.get_histories()

        if self.tool['name'] == 'workflow_explorer' or self.tool['name'] == 'Upload Data' :
            inputs = {'inpus':[]}
            history_data=[]
        else:
            inputs = gi.gi.tools.build(tool_id=self.tool["id"], history_id=history_ids[0]["id"])
            history_data = GalaxyTaskWidget.updated_form(
                server=self.tool['origin'],
                history_id=history_ids[0]["id"],
                python_side=True,
            )

        if GALAXY_SERVER_NAME_BY_URL.get(self.tool['origin']):
            server_name = GALAXY_SERVER_NAME_BY_URL.get(self.tool['origin'])
        else:
            server_name = self.tool['origin']

        GalaxyUIBuilder.__init__(
            self,
            inputs=inputs,
            id = self.tool['id'],
            name = self.tool['name']+' ('+server_name+')',
            galaxy_tool_id=self.tool['id'],
            description=self.tool['description'],
            subtitle=self.tool['origin'],
            history_ids=history_ids,
            # history_data=history_data,
            color = self.default_color,
            logo=self.default_logo,
            origin=self.tool['origin'],
            # UU_ID=str(uuid.uuid4()),
            **kwargs
        )

    def handle_error_task(self, error_message, name="Galaxy Module", **kwargs):
        """Display an error message if the task is None"""
        UIBuilder.__init__(self, lambda: None, color=self.default_color, **kwargs)

        self.name = name
        self.display_header = False
        self.display_footer = False
        self.error = error_message

    @staticmethod
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


    @staticmethod
    def submit_job( server, tool_id, tool_inputs=None, history_id=None):

        a = GiN.sessions.SessionList()
        gi1 = a.get(server=server)
        # tool_inputs = json5.loads(tool_inputs)
        new_inputs = GalaxyTaskWidget.RefinedInputs(tool_inputs, gi1)

        try:
            job = gi1.tools.gi.tools.run_tool(
                history_id=history_id, tool_id=tool_id, tool_inputs=new_inputs
            )
        except BaseException as e:
            job = {"state": "job failed", 'error': str(e)}

        #return IPython.display.JSON(job)
        return job

    @staticmethod
    def form_value( raw_value):

        """Give the default parameter value in format the UI Builder expects"""
        if raw_value is not None:
            return raw_value
        else:
            return ""

    @staticmethod
    def show_job( server, job_id):

        a = GiN.sessions.SessionList()
        gi1 = a.get(server=server)
        job = gi1.jobs.gi.jobs.show_job(job_id=job_id)

        # return IPython.display.JSON(job)
        return job

    @staticmethod
    def get_data_type_and_genomes( server=None):

        a = GiN.sessions.SessionList()
        gi2 = a.get(server=server)

        data_types = gi2.gi.datatypes.get_datatypes()
        genomes = gi2.gi.genomes.get_genomes()
        datatypes_genomes = {
            "datatypes": data_types,
            "genomes": genomes,

        }

        return IPython.display.JSON(datatypes_genomes)

    @staticmethod
    def Return_api_key( server):
        a = GiN.sessions.SessionList()
        gi = a.get(server=server)

        key = gi.gi.key
        email = gi.gi.users.get_current_user()['email']
        
        #return IPython.display.JSON({'api_key': key, 'email': email})
        return {'api_key': key, 'email': email}
    

    @staticmethod
    def Create_new_history( server, name):
        a = GiN.sessions.SessionList()
        gi = a.get(server=server)

        new_history = gi.histories.create(name=name)        
        return new_history.wrapped
     
    
    @staticmethod
    def upload_dataset(
         file_path, upload_method, datatype, genome, server=None, HistoryID=None
          
    ):  

        a = GiN.sessions.SessionList()
        gi3 = a.get(server=server)

        history = gi3.gi.histories.show_history(history_id=HistoryID)
        # a = hi.History(history, gi=gi3.gi)

        if upload_method == "text":
            job = gi3.gi.tools.put_url(content=file_path, history_id=HistoryID)
            del gi3
            return IPython.display.JSON(job)

        elif upload_method == "textarea":
            job = gi3.gi.tools.put_url(content=file_path, history_id=HistoryID)
            del gi3
            return IPython.display.JSON(job)

        # return IPython.display.JSON(job)
    @staticmethod
    def TestOut( server=None, JobID=None):

        a = GiN.sessions.SessionList()
        gi4 = a.get(server=server)

        status = gi4.jobs.gi.jobs.show_job(JobID, full_details=True)
       
        return IPython.display.JSON(status)

    @staticmethod
    def ReturnSessions( server=None):

        a = GiN.sessions.SessionList()
        gi4 = a.get(server=server)


    @staticmethod
    def OutPutData( server=None, JobID=None):

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

    @staticmethod
    def RefinedInputs( inputs, gi):

        for i in inputs.keys():
            if type(inputs[i]) == dict:
                if list(inputs[i].keys())[0] == "values":
                    new_values = []
                    for j in inputs[i]["values"]:
                        new_values.append(j)
                    inputs[i]["values"] = new_values
        return inputs


    @staticmethod
    def return_session_list():
        try:
            a = GiN.sessions.SessionList()
            return a.get_servers()
        except:
             Python.display.JSON([])


    @staticmethod
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

            inputs = gi6.tools.gi.tools.build(
                tool_id=tool_id, inputs=tool_inputs, history_id=history_id
            )

            if input_data_param is False:
                # return IPython.display.JSON(data=inputs)
                data=inputs
                return data
            else:
                return GalaxyTaskWidget.RetrivParm(inputs["inputs"])
                    
        elif (tool_inputs is None) and (tool_id is not None):

            inputs = gi6.tools.gi.tools.build(tool_id=tool_id, history_id=history_id)
            data=inputs
            return data

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
                # IPython.display.JSON(data=history_data)
                data=history_data
                return data


    @staticmethod
    def history_data_list( server=None, history_id=None):

        try:
            a = GiN.sessions.SessionList()
            gi7 = a.get(server=server)

            history_data = gi7.gi.datasets.gi.datasets.get_datasets(
                history_id=history_id, deleted=False, purged=False, visible=True
            )

            # # for i in HistoryData:
            # #  
            # #    datasets.append(gi.gi.datasets.gi.datasets.show_dataset(dataset_id=i['id']))
            #return IPython.display.JSON(history_data)
            return history_data

        except:

            #return IPython.display.JSON([])
            return []

    @staticmethod
    def show_data_set(server=None, dataset_id=None):

        a = GiN.sessions.SessionList()
        gi8 = a.get(server=server)
        show_dataset = gi8.gi.datasets.gi.datasets.show_dataset(dataset_id=dataset_id)
        
        #return IPython.display.JSON(show_dataset) #keeps kernel busy 
        return show_dataset

    @staticmethod
    def delete_dataset(server=None, history_id=None, dataset_id=None):

        a = GiN.sessions.SessionList()
        gi9 = a.get(server=server)

        gi9.gi.histories.gi.histories.delete_dataset(
            history_id=history_id, dataset_id=dataset_id, purge=True
        )

    @staticmethod
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


    @staticmethod
    def show_dataset_collection( server=None, dataset_id=None):

        a = GiN.sessions.SessionList()
        gi11 = a.get(server=server)

        show_dataset = gi11.gi.dataset_collections.show_dataset_collection(
            dataset_collection_id=dataset_id
        )

        # return IPython.display.JSON(show_dataset)
        return show_dataset


    @staticmethod
    def get_histories( server):

        a = GiN.sessions.SessionList()
        gi12 = a.get(server=server)
        histories = gi12.gi.histories.gi.histories.get_histories()

        return IPython.display.JSON(histories)

    @staticmethod
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

    @staticmethod
    def CORS_fallback_upload_old(
        server,
        history_id,
    ):

        a = GiN.sessions.SessionList()
        gi = a.get(server=server)

        temp_dir = os.path.join(os.getcwd(), "temp")
        file_path = glob.glob(os.path.join(temp_dir, '*'))[0]
        
        out = gi.tools.gi.tools.upload_file(path=file_path, history_id=history_id)

        return IPython.display.JSON(out)
    

    def start_upload(server, history_id):

        upload_id = str(uuid.uuid4())
        a = GiN.sessions.SessionList()
        gi = a.get(server=server)

        temp_dir = os.path.join(os.getcwd(), "temp")
        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)
        file_path = glob.glob(os.path.join(temp_dir, '*'))[0]

        t = threading.Thread(target=gi.tools.gi.tools.upload_file, kwargs={'path':file_path, 'history_id':history_id})
    
        t.start()
        a.galaxy_upload[upload_id] = t
    
        return IPython.display.JSON({'id':upload_id, 'status':'start'})

    def check_upload(upload_id):
        a = GiN.sessions.SessionList()
        # gi = a.get(server=server)
        t = a.galaxy_upload.get(upload_id)

        status = {'id': upload_id, 'status':'running'}
        if not t.is_alive():
            out = t.join()
            status['status'] = 'finish'
            del a.galaxy_upload[upload_id]

        return IPython.display.JSON(status)
    

    @staticmethod
    def CORS_fallback_upload(
        server,
        history_id,
    ):

        a = GiN.sessions.SessionList()
        gi = a.get(server=server)

        temp_dir = os.path.join(os.getcwd(), "temp")
        file_path = glob.glob(os.path.join(temp_dir, '*'))[0]
        out = gi.tools.gi.tools.upload_file(path=file_path, history_id=history_id)

        # print(out)
        # [os.remove(file) for file in glob.glob(os.path.join(temp_dir, '*')) if os.path.isfile(file_path)]

        return IPython.display.JSON(out)

    @staticmethod
    def send_data_to_galaxy_tool(
        server_d=None,
        server_u=None,
        file_name=None,
        dataset_id=None,
        ext="zip",
        dataset_name=None,
        history_id=None,
    ):

        a = GiN.sessions.SessionList()
        gi13 = a.get(server=server_d)
        gi14 = a.get(server=server_u)

        temp_dir = os.path.join(os.getcwd(), "gtemp")

        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)

        fs = glob.glob(os.path.join(temp_dir, '*.*'))

        for f  in  fs:
            os.remove(f)

        gi13.gi.datasets.download_dataset(
            dataset_id=dataset_id, file_path=temp_dir, require_ok_state=False
        )

        file_name = glob.glob(temp_dir + "/*.*") 
        out = gi14.tools.gi.tools.upload_file(path=file_name[0], history_id=history_id)

        return IPython.display.JSON(out)

        # if not os.path.exists(galaxy_data):
        #     os.mkdir(galaxy_data)
        #     gi.gi.datasets.download_dataset(dataset_id=collection_id, file_path=galaxy_data)
    @staticmethod
    def upload_fallback(
        server_u=None,
        file_name=None,
    ):

        gi14 = a.get(server=server_u)
        file_name = glob.glob(temp_dir + "/*.*")
        out = gi14.tools.gi.tools.upload_file(path=file_name[0], history_id=history_id)


        return IPython.display.JSON(out)

    @staticmethod
    def send_data_to_gp_server(file_name, tool_id, dataset_id, server, ext):

        temp_dir = os.path.join(os.getcwd(), "temp1")

        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)

        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))

        GalaxyTaskWidget.download_file_to_jupyter_server(
            server=server, collection_id=dataset_id, dir="temp1"
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

    @staticmethod
    def return_job_status(server=None, job_id=None):

        a = GiN.sessions.SessionList()
        gi15 = a.get(server=server)
        job_state = gi15.gi.jobs.show_job(job_id=job_id, full_details=True)

        return IPython.display.JSON(job_state)

    @staticmethod
    def return_job_state( server=None, job_id=None):

        a = GiN.sessions.SessionList()
        gi16 = a.get(server=server)
        job_state = gi16.gi.jobs.get_state(job_id=job_id)

        return IPython.display.JSON({"job_state": job_state})
    
    @staticmethod
    def check_login(login_id, server):
        a = GiN.sessions.SessionList()
        gi = a.get(server=server)
        t = gi.galaxy_login.get(login_id)

        status = {'id': login_id, 'status':'running'}

        if not t.is_alive():
            out = t.join()
            status['status'] = 'finish'
            del gi.galaxy_login[login_id]

        return IPython.display.JSON(status)
    

class TaskTool(NBTool):

    """Tool wrapper for the authentication widget"""

    def __init__(self, server_name, tool):
        
        NBTool.__init__(self)
        self.origin = server_name
        self.id = tool["id"]
        self.name = tool["name"]
        self.description = tool["description"]
        self.load = lambda: GalaxyTaskWidget(tool)
        
