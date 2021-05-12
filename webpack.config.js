//module.exports = {
//    resolve: {
//        fallback: {  
//            fs: false,
//            child_process: false,
//            worker_threads: false,
//            https: false,
//            crypto: false,
//            http: false,
//    
//      }
//    }
//  };
var path = require('path');


// Custom webpack rules are generally the same for all webpack bundles, hence
// stored in a separate local variable.
var rules = [
    { test: /\.css$/, use: ['style-loader', 'css-loader']},
    { test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i, use: ['file-loader', 'svg-url-loader','url-loader'] }
    
]

const resolve = {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".webpack.js", ".web.js",  ".js", ".css"],
    fallback: { 

        https: false,
        http: false,
        vm: false ,
        fs: false,
        child_process: false,
        worker_threads: false,
        crypto: false

  }
  }; 

module.exports =  {
  resolve
   
}


