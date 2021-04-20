const path = require('path');
const version = require('./package.json').version;

// Galaxy Client start
const webpack = require("webpack");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");

const scriptsBase = path.join(__dirname, "src/client/src"); //mod
const testsBase = path.join(__dirname, "src/client/tests");
const libsBase = path.join(scriptsBase, "libs");
const styleBase = path.join(scriptsBase, "style");


//const targetEnv = "development"; //mod
const targetEnv = "production"; //mod

    const buildconfig = {
        entry: {
            login: ["polyfills", "bundleEntries", "entry/login"],
            analysis: ["polyfills", "bundleEntries", "entry/analysis"],
            admin: ["polyfills", "bundleEntries", "entry/admin"],
            generic: ["polyfills", "bundleEntries", "entry/generic"],
        },
        output: {
            //path: path.join(__dirname, "../", "/static/dist"),
            //filename: 'index.js',
            //path: path.join(__dirname, "lib", "/static/dist"),
            path: path.resolve(__dirname, 'dist/galaxyclient'),
            //library: "@galaxy/galaxylab",
            library: 'galaxyclient',
            //publicPath: 'https://unpkg.com/@galaxy/galaxyclient@' + version + '/dist/'
            //publicPath: "/static/dist/galaxyclient",
            filename: "[name].bundled.js",
            chunkFilename: "[name].chunk.js",
        },
        resolve: {
            extensions: ["*", ".js", ".json", ".vue", ".scss"],
            modules: [scriptsBase, "node_modules", styleBase, testsBase],
            alias: {
                jquery$: `${libsBase}/jquery.custom.js`,
                jqueryVendor$: `${libsBase}/jquery/jquery.js`,
                storemodern$: "store/dist/store.modern.js",
                "popper.js": path.resolve(__dirname, "node_modules/popper.js/"),
                moment: path.resolve(__dirname, "node_modules/moment"),
                underscore: path.resolve(__dirname, "node_modules/underscore"),
                // client-side application config
                config$: path.join(scriptsBase, "config", targetEnv) + ".js",
                // New aliases to enable build
                app$: path.join(scriptsBase, "app"),
                //config$: path.join(scriptsBase, "config"),
                legacy$: path.join(scriptsBase, "legacy"),
                mvc$: path.join(scriptsBase, "mvc"),
                onload$: path.join(scriptsBase, "onload"),
                reports$: path.join(scriptsBase, "reports"),
                style$: path.join(scriptsBase, "style"),
                toolshed$: path.join(scriptsBase, "toolshed"),
                utils$: path.join(scriptsBase, "utils"),
                assets$: path.join(scriptsBase, "assets"),
                components$: path.join(scriptsBase, "components"),
                entry$: path.join(scriptsBase, "entry"),
                layout$: path.join(scriptsBase, "layout"),
                libs$: path.join(scriptsBase, "libs"),
                nls$: path.join(scriptsBase, "nls"),
                store$: path.join(scriptsBase, "store"),
                ui$: path.join(scriptsBase, "ui"),
                viz$: path.join(scriptsBase, "viz"),
            },
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    styles: {
                        name: "base",
                        chunks: "all",
                        test: (m) => m.constructor.name == "CssModule",
                        priority: -5,
                    },
                    libs: {
                        name: "libs",
                        test: /node_modules[\\/](?!(handsontable|pikaday|moment|elkjs)[\\/])|galaxy\/scripts\/libs/,
                        chunks: "all",
                        priority: -10,
                    },
                },
            },
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: "vue-loader",
                },
                {
                         test: /\.mjs$/,
                         include: /node_modules/,
                         type: 'javascript/auto'
                },
                {
                    test: /\.js$/,
                    /*
                     * Babel transpile excludes for:
                     * - all node_modules except for handsontable, bootstrap-vue
                     * - statically included libs (like old jquery plugins, etc.)
                     */
                    exclude: [/(node_modules\/(?!(handsontable|bootstrap-vue)\/))/, libsBase],
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        presets: [["@babel/preset-env", { modules: false }]],
                        plugins: ["transform-vue-template", "@babel/plugin-syntax-dynamic-import"],
                        ignore: ["i18n.js", "utils/localization.js", "nls/*"],
                    },
                },
                {
                    test: `${libsBase}/jquery.custom.js`,
                    use: [
                        {
                            loader: "expose-loader",
                            options: {
                                exposes: ["jQuery", "$"],
                            },
                        },
                    ],
                },
                {
                    test: require.resolve("underscore"),
                    use: [
                        {
                            loader: "expose-loader",
                            options: {
                                exposes: ["underscore", "_"],
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?.*$|$)/,
                    use: {
                        loader: "file-loader",
                        options: {
                            outputPath: "assets",
                            publicPath: "../dist/assets/",
                        },
                    },
                },
                // Alternative to setting window.bundleEntries
                // Just import "bundleEntries" in any endpoint that needs
                // access to these globals, or even-better, make
                // more endpoints and skip the global altogether
                {
                    test: `${scriptsBase}/bundleEntries`,
                    use: [
                        {
                            loader: "expose-loader",
                            options: {
                                exposes: "bundleEntries",
                            },
                        },
                    ],
                },
                {
                    test: `${scriptsBase}/onload/loadConfig.js`,
                    use: [
                        {
                            loader: "expose-loader",
                            options: { exposes: "config" },
                        },
                    ],
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                hmr: process.env.NODE_ENV === "development",
                            },
                        },
                        {
                            loader: "css-loader",
                            options: { sourceMap: true },
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                plugins: function () {
                                    return [require("autoprefixer")];
                                },
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: true,
                                sassOptions: {
                                    includePaths: [
                                        path.join(styleBase, "scss"),
                                        path.resolve(__dirname, "./node_modules"),
                                    ],
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(txt|tmpl)$/,
                    loader: "raw-loader",
                },
                {
                    test: /\.worker\.js$/,
                    use: { loader: 'worker-loader' },
                },
            ],
        },
        node: {
            setImmediate: false,
        },
        resolveLoader: {
            alias: {
                // since we support both requirejs i18n and non-requirejs and both use a similar syntax,
                // use an alias so we can just use one file
                i18n: "amdi18n-loader",
            },
        },
        plugins: [
            // this plugin allows using the following keys/globals in scripts (w/o req'ing them first)
            // and webpack will automagically require them in the bundle for you
            new webpack.ProvidePlugin({
                $: `${libsBase}/jquery.custom.js`,
                jQuery: `${libsBase}/jquery.custom.js`,
                _: "underscore",
                Backbone: "backbone",
                Galaxy: ["app", "monitor"],
            }),
            new VueLoaderPlugin(),
            new MiniCssExtractPlugin({
                filename: "[name].css",
                sourceMap: true,
            }),
            // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/141
            new OptimizeCssAssetsPlugin({
                cssProcessorOptions: {
                    map: {
                        inline: false,
                        annotation: true,
                    },
                },
            }),
            new DuplicatePackageCheckerPlugin(),
        ],
        devServer: {
            hot: true,
        },
    };

    if (process.env.GXY_BUILD_SOURCEMAPS || process.env.NODE_ENV == "development") {
        buildconfig.devtool = "source-map";
    }



// Galaxy Client end



// Custom webpack rules
const rules = [
  { test: /\.ts$/, loader: 'ts-loader' },
  { test: /\.js$/, loader: 'source-map-loader' },
  { test: /\.css$/, use: ['style-loader', 'css-loader']},
  { test: /\.(png|svg|jpg)$/i, use: ['file-loader'] }
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = ['@jupyter-widgets/base'];

const resolve = {
  // Add '.ts' and '.tsx' as resolvable extensions.
  extensions: [".webpack.js", ".web.js", ".ts", ".js", ".css"],
  alias: {
    //galaxyclient$: path.resolve(__dirname, 'dist/galaxyclient'),
    galaxyclienta: path.resolve(__dirname, 'dist/galaxyclient'),
    galaxyclient: path.resolve(__dirname, 'src/client/src'),
    //path.join(scriptsBase, "galaxyclient"),
  }
};

        const nb_resolve = {
            extensions: ["*", ".js", ".json", ".vue", ".scss"],
            modules: [scriptsBase, "node_modules", styleBase, testsBase],
            alias: {
                jquery$: `${libsBase}/jquery.custom.js`,
                jqueryVendor$: `${libsBase}/jquery/jquery.js`,
                storemodern$: "store/dist/store.modern.js",
                "popper.js": path.resolve(__dirname, "node_modules/popper.js/"),
                moment: path.resolve(__dirname, "node_modules/moment"),
                underscore: path.resolve(__dirname, "node_modules/underscore"),
                // client-side application config
                config$: path.join(scriptsBase, "config", targetEnv) + ".js",
                // New aliases to enable build
                app$: path.join(scriptsBase, "app"),
                //config$: path.join(scriptsBase, "config"),
                legacy$: path.join(scriptsBase, "legacy"),
                mvc$: path.join(scriptsBase, "mvc"),
                onload$: path.join(scriptsBase, "onload"),
                reports$: path.join(scriptsBase, "reports"),
                style$: path.join(scriptsBase, "style"),
                toolshed$: path.join(scriptsBase, "toolshed"),
                utils$: path.join(scriptsBase, "utils"),
                assets$: path.join(scriptsBase, "assets"),
                components$: path.join(scriptsBase, "components"),
                entry$: path.join(scriptsBase, "entry"),
                layout$: path.join(scriptsBase, "layout"),
                libs$: path.join(scriptsBase, "libs"),
                nls$: path.join(scriptsBase, "nls"),
                store$: path.join(scriptsBase, "store"),
                ui$: path.join(scriptsBase, "ui"),
                viz$: path.join(scriptsBase, "viz"),
            }
        };



module.exports = [
  /**
   * Notebook extension
   *
   * This bundle only contains the part of the JavaScript that is run on load of
   * the notebook.
   */
  {
    entry: './src/extension.ts',
    target: 'web',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'nbtools', 'nbextension', 'static'),
      libraryTarget: 'amd',
      // TODO: Replace after release to unpkg.org
      publicPath: '' // 'https://unpkg.com/@genepattern/nbtools@' + version + '/dist/'
    },
    module: {
      rules: rules
    },
    devtool: 'source-map',
    externals,
    resolve,
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
  },

  /**
   * Embeddable nbtools bundle
   *
   * This bundle is almost identical to the notebook extension bundle. The only
   * difference is in the configuration of the webpack public path for the
   * static assets.
   *
   * The target bundle is always `dist/index.js`, which is the path required by
   * the custom widget embedder.
   */
  {
    entry: './src/index.ts',
    target: 'web',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'amd',
        library: "@genepattern/nbtools",
        // TODO: Replace after release to unpkg.org
        publicPath: '' // 'https://unpkg.com/@genepattern/nbtools@' + version + '/dist/'
    },
    devtool: 'source-map',
    module: {
        rules: rules
    },
    externals,
    resolve,
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
  },


  /**
   * Documentation widget bundle
   *
   * This bundle is used to embed widgets in the package documentation.
   */
  {
    entry: './src/index.ts',
    target: 'web',
    output: {
      filename: 'embed-bundle.js',
      path: path.resolve(__dirname, 'docs', 'source', '_static'),
      library: "@genepattern/nbtools",
      libraryTarget: 'amd',
      // TODO: Replace after release to unpkg.org
      publicPath: '' // 'https://unpkg.com/@genepattern/nbtools@' + version + '/dist/'
    },
    module: {
      rules: rules
    },
    devtool: 'source-map',
    externals,
    resolve,
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
  }

];
