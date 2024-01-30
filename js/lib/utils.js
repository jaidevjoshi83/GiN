import { ContextManager } from '@g2nb/nbtools/lib/context';

/**
 * Send a browser notification
 *
 * @param message
 * @param sender
 * @param icon
 */
export function send_notification(message, sender = 'nbtools', icon = '') {
    // Internal function to display the notification
    function notification() {
        new Notification(sender, {
            body: message,
            badge: icon,
            icon: icon,
            silent: true
        });
    }
    // Browser supports notifications and permission is granted
    if ("Notification" in window && Notification.permission === "granted") {
        notification();
    }
    // Otherwise, we need to ask the user for permission
    else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                notification();
            }
        });
    }
}
/**
 * Determines ia a given string is an absolute file path
 *
 * @param path_or_url
 * @returns {boolean}
 */
export function is_absolute_path(path_or_url) {
    let path_exp = new RegExp('^/');
    return path_exp.test(path_or_url);
}
/**
 * Decides if a string represents a valid URL or not
 *
 * @param path_or_url
 * @returns {boolean}
 */
export function is_url(path_or_url) {
    const url_exp = new RegExp('^(?:http|ftp)s?://');
    return url_exp.test(path_or_url);
}
/**
 * Extracts a file name from a URL
 *
 * @param path
 * @returns {*}
 */
export function extract_file_name(path) {
    if (is_url(path))
        return path.split('/').pop();
    else
        return path;
}
/**
 * Extracts a file type from a path or URL
 *
 * @param {string} path
 * @returns {any}
 */
export function extract_file_type(path) {
    return path.split('.').pop();
}
/**
 * Wait until the specified element is found in the DOM and then execute a promise
 *
 * @param {HTMLElement} el
 */
export function element_rendered(el) {
    return new Promise((resolve, reject) => {
        (function element_in_dom() {
            if (document.body.contains(el))
                return resolve(el);
            else
                setTimeout(element_in_dom, 200);
        })();
    });
}
/**
 * Show an element
 *
 * @param {HTMLElement} elem
 */
export function show(elem) {
    // Get the natural height of the element
    const getHeight = function () {
        elem.style.display = 'block'; // Make it visible
        const height = elem.scrollHeight + 'px'; // Get it's height
        elem.style.display = ''; //  Hide it again
        return height;
    };
    const height = getHeight(); // Get the natural height
    elem.classList.remove('nbtools-hidden'); // Make the element visible
    elem.style.height = height; // Update the height
    // Once the transition is complete, remove the inline height so the content can scale responsively
    setTimeout(function () {
        elem.style.height = '';
        elem.classList.remove('nbtools-toggle');
    }, 350);
}
/**
 * Hide an element
 *
 * @param {HTMLElement} elem
 */
// export function hide(elem) {

//     if (elem)  {
//         elem.classList.add('nbtools-toggle');
//         // Give the element a height to change from
//         elem.style.height = elem.scrollHeight + 'px';
//         // Set the height back to 0
//         setTimeout(function () {
//             elem.style.height = '0';
//         }, 10);
//         // When the transition is complete, hide it
//         setTimeout(function () {
//             elem.classList.add('nbtools-hidden');
//         }, 350);
// }

//     }
/**
 * Toggle element visibility
 *
 * @param {HTMLElement} elem
 */
export function toggle(elem) {
    // If the element is visible, hide it
    if (!elem.classList.contains('nbtools-hidden')) {
        hide(elem);
        return;
    }
    // Otherwise, show it
    show(elem);
}
export function process_template(template, template_vars) {
    Object.keys(template_vars).forEach((key_var) => {
        template = template.replace(new RegExp(`{{${key_var}}}`, 'g'), template_vars[key_var]);
    });
    return template;
}

export function pulse_red(element, count = 0, count_up = true) {
    setTimeout(() => {
        element.style.border = `rgba(255, 0, 0, ${count / 10}) solid ${Math.ceil(count / 2)}px`;
        if (count_up && count < 10)
            pulse_red(element, count + 1, count_up);
        else if (count_up)
            pulse_red(element, count, false);
        else if (count > 0)
            pulse_red(element, count - 1, count_up);
        else
            element.style.border = `none`;
    }, 25);
}

export async function executePython(pythonCode, isExpectingOutput){

    const notebook = ContextManager.tool_registry.current

    return await new Promise(async (resolve, reject) => {
        
        if (notebook.context.sessionContext.session) {

            var feature = notebook.context.sessionContext.session.kernel.requestExecute({ 'code': pythonCode, 'stop_on_error' : true});
            feature.onIOPub = (msg) =>{
                var msgType = msg.header.msg_type;

                switch (msgType) {
                    case 'error':    	    
                        var message = msg.content.ename + '\n' + msg.content.evalue;		   	    		   				    
                        reject(message);
                        break;						
                    case 'execute_result':
                        feature.onIOPub  = msg.content;	
                        resolve(feature.onIOPub.data['application/json']);						
                        break;
                    case 'display_data':
                        feature.onIOPub  = msg.content;	
                        resolve(feature.onIOPub.data['application/json']);											
                        break;
                    case 'update_display_data':
                        feature.onIOPub  = msg.content;	
                        resolve(feature.onIOPub.data['application/json']);											
                        break;
                };
            }; 		
       }
    });	
}


// export async function  KernelSideDataObjects(code) {
//     var system = await executePython(code);
//     return system;
// }


export async function KernelSideDataObjects(code) {
    try {
      var system = await executePython(code);
      return system;
    } catch (error) {
      // Handle the error
      console.error("An error occurred:", error);
      // Return an appropriate value or rethrow the error if needed
      return {'value': 'error'};
    }
  }



export function removeAllChildNodes(parent){
    while (parent.firstChild) {
        console.log(parent.firstChild)
        parent.removeChild(parent.firstChild);
    }
}


export function UUID() {
    var u='',i=0;
    while(i++<36) {
        var c='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'[i-1],r=Math.random()*16|0,v=c=='x'?r:(r&0x3|0x8);
        u+=(c=='-'||c=='4')?c:v.toString(16)
    }
    return u;
}


export class FileStreamer {
    constructor(file, encoding = "utf-8") {
      this.file = file
      this.offset = 0
      this.defaultChunkSize = 64 * 1024 // bytes
      this.textDecoder = new TextDecoder(encoding)
      this.rewind()
    }
    rewind() {
      this.offset = 0
    }
    isEndOfFile() {
      return this.offset >= this.getFileSize()
    }
    async eventPromise(target, eventName) {
      return new Promise(resolve => {
        const handleEvent = event => {
          resolve(event)
        }
        target.addEventListener(eventName, handleEvent)
      })
    }
    async readFile(blob) {
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(blob)
      const event = await this.eventPromise(fileReader, "loadend")
      const target = event.target
      if (target.error) {
        throw target.error
      }
      return target.result
    }
    async readBlockAsText(length = this.defaultChunkSize) {
      const blob = this.file.slice(this.offset, this.offset + length)
      const buffer = await this.readFile(blob)
      const decodedText = this.textDecoder.decode(buffer, { stream: true })
      this.offset += blob.size
  
      if (this.isEndOfFile()) {
        const finalText = this.textDecoder.decode()
        if (finalText) {
          return decodedText + finalText
        }
      }
      return decodedText
    }
    getFileSize() {
      return this.file.size
    }
  }
  
