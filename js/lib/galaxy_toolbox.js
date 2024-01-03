import {ToolBrowser, Toolbox, SearchBox} from '@g2nb/nbtools';
import { ContextManager } from '@g2nb/nbtools';
import { ToolRegistry } from '@g2nb/nbtools';
import { GalaxyToolRegistry } from './galaxy_registry';
import {   KernelSideDataObjects,  return_kernel_id } from './utils';



export class GalaxyToolBrowser extends ToolBrowser {
    constructor(){
        super(...arguments)
        this.addClass('galaxy-browser');
        this.search = new GalaxySearchBox();
        this.toolbox = new GalaxyToolbox(this.search);
        this.layout.addWidget(this.search)
        this.layout.addWidget(this.toolbox)
        this.test()
    }

    test() {
        const tools = ContextManager.tool_registry.list();
        console.log(ContextManager.galaxy_tool_registry.kernel_tool_cache)
    }
}


export class GalaxyToolbox extends Toolbox {

    constructor() {
        
        super(...arguments)
        this.fill_toolbox = () =>{}
        this.addClass('galaxy-toolbox');
        this.addClass('galaxy-wrapper');
        // this.overwrite_tool_registry_update_property();
        // this.add_origin('+');

 
        this.galaxy_fill_toolbox()

        // ContextManager.galaxy_tool_registry.on_update(() => {
        //     // If the last update was more than 10 seconds ago, update the toolbox
        //     // if (this.update_stale())

        //     console.log("On update")
        //         this.fill_toolbox_1();
        //     // else
        //     //     this.queue_update(); // Otherwise, queue an update if not already waiting for one
        // });
    }


    overwrite_tool_registry_update_property(){

        ContextManager.tool_registry.on_update = () => {
            // Your custom implementation here
            console.log("Overridden on_update property in GalaxyToolBrowser");
        };
    }
    // add_origin(name) {
    //     // Create the HTML DOM element
    //     const origin_wrapper = document.createElement('div');
    //     origin_wrapper.innerHTML = `
    //         <header class="nbtools-origin" title="${name}">
    //             <span class="nbtools-expanded nbtools-collapse jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
    //             ${name}
    //         </header>
    //         <ul class="nbtools-origin" title="${name}"></ul>`;
    //     // Attach the expand / collapse functionality
    //     const collapse = origin_wrapper.querySelector('span.nbtools-collapse');
    //     collapse.addEventListener("click", () => this.toggle_collapse(origin_wrapper));
    //     // Add to the toolbox
    //     this.node.append(origin_wrapper);
    //     return origin_wrapper;
    // }

    galaxy_fill_toolbox(tools) {

        if (tools == undefined){
            tools = [
                    {
                        "origin": "+",
                        "id": "galaxy_authentication",
                        "name": "Galaxy Login",
                        "description": "Log into a Galaxy server",
                        "tags": null,
                        "version": null
                    },
                ]
        }

   

        // if (return_kernel_id() != undefined){
        //     console.log(return_kernel_id())
        //     console.log( ContextManager.galaxy_tool_registry.kernel_tool_cache[return_kernel_id()])
    
        //     const tools = ContextManager.galaxy_tool_registry.kernel_tool_cache[return_kernel_id()]

        //     console.log(tools)
        // } else{
        //     return 
        // }



        const organized_tools = this.organize_tools(tools)
        const origins = Object.keys(organized_tools);
        origins.sort((a, b) => {
            const a_name = a.toLowerCase();
            const b_name = b.toLowerCase();
            return (a_name < b_name) ? -1 : (a_name > b_name) ? 1 : 0;
        });
        // Add each origin
        origins.forEach((origin) => {
            const origin_box = this.add_origin(origin);
            organized_tools[origin].forEach((tool) => {
                this.add_tool(origin_box, tool);
            });
        });
        // // Apply search filter after refresh

        // console.log(this.search)
        // this.search.filter(this.search.node.querySelector('input.galaxy-search'));

    }

    add_tool(origin, tool) {
        const list = origin.querySelector('ul');
        const tool_wrapper = document.createElement('li');
        tool_wrapper.classList.add('nbtools-tool');
        tool_wrapper.setAttribute('title', 'Click to add to notebook');
        tool_wrapper.innerHTML = `
            <div class="nbtools-add">+</div>
            <div class="nbtools-header">${tool.name}</div>
            <div class="nbtools-description">${tool.description}</div>`;
        if (list)
            list.append(tool_wrapper);
        // Add the click event
        tool_wrapper.addEventListener("click", () => {
            GalaxyToolbox.add_tool_cell(tool);
        });
    }

    static add_tool_cell(tool) {
        // Check to see if nbtools needs to be imported
        const import_line = ContextManager.tool_registry.needs_import() ? 'import GiN\n\n' : '';
        // Add and run a code cell with the generated tool code

        KernelSideDataObjects(`print('*********')\nfrom GiN import GalaxyToolManager\nGalaxyToolManager.instance().tools['4'] = 'tool-5'`)
        
        GalaxyToolbox.add_code_cell(`import GiN\nGiN.tool(id='${tool.id}', origin='${tool.origin}')`);
    }
}

export class GalaxySearchBox extends SearchBox {

    constructor() {
        super(...arguments);
        this.node.innerHTML =  `
        <div class="galaxy-wrapper">
            <div class="galaxy-outline">
                <input type="search" class="galaxy-search" spellcheck="false" placeholder="SEARCH" />
            </div>
        </div>
    `;
    }

    attach_events() {
        // Attach the change event to the search box
        const search_box = this.node.querySelector('input.nbtools-search') ;
        search_box.addEventListener("keyup", () => this.filter(search_box));
    }

    filter(search_box) {
        // Update the value state
        // this.value = search_box.value.toLowerCase().replace(/[^a-z0-9]/g, '');

        // // Get the toolbox
        // const toolbox = document.querySelector('#nbtools-browser > .nbtools-toolbox');
        // if (!toolbox) return; // Do nothing if the toolbox is null

        // // Show any tool that matches and hide anything else
        // toolbox.querySelectorAll('li.nbtools-tool').forEach((tool) => {
        //     if (tool.textContent.toLowerCase().replace(/[^a-z0-9]/g, '').includes(this.value)) tool.style.display = 'block';
        //     else tool.style.display = 'none';
        // });
    }
}


