import webpack from 'webpack'

import Extract from 'extract-text-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'

const assets = './src/public/assets'

const styles = `${ assets }/styles`
const js = `${ assets }/js`
const components = './src/components'

const extractSass = new Extract({ filename : '[name].css'/*, allChunks : true */ })
const htmlExtract = new HtmlWebpackPlugin({ hash : true, })
const uglify = new webpack.optimize.UglifyJsPlugin({ compress : { warnings : false }})
const HMR = new webpack.HotModuleReplacementPlugin()
const namedModules = new webpack.NamedModulesPlugin()
// const occurenceOrder = new webpack.optimize.OccurrenceOrderPlugin()
const noErrors = new webpack.NoEmitOnErrorsPlugin()
// const chunking = new webpack.optimize.CommonsChunkPlugin({ minChunks : Infinity, name : 'vendor', filename : 'vendor.js' })

export const cssConfig = {
  watch : true,
  entry : { 
    login : `${ styles }/scss/login.scss`,
    dashboard : `${ styles }/scss/dashboard.scss`,

    // // Testing
    // style : `${ styles }/scss/style.dev.scss`
  }, 
  output : { 
    path : path.resolve(__dirname, styles, 'css' ),
    filename : '[name].css'
  },
  module : {
    loaders : [
      // {
      //   test : /\.css$/,
      //   // use : [ 'style-loader', 'css-loader', 'sass-loader' ],
      //   // include : [ path.resolve(__dirname, styles, 'css') ],
      //   loader : Extract.extract(
      //     { 
      //       use : ['css-loader?importLoaders=1'],
      //       fallback : 'style-loader'
      //     }
      //   ),
      // },
      {
        test : /\.s(css|ass)$/,
        // include : [ path.resolve(__dirname, styles, 'scss') ],
        loader : Extract.extract(
          {
            use : ['css-loader', 'sass-loader'],
            fallback : 'style-loader'
          }
        )
      }
    ]
  },
  plugins : [ /*uglify, */extractSass /*, HMR, namedModules */],
  resolve : { extensions : ['.js', '.css', '.scss'] },
  devServer : { hot : true, compress : true, },
  devtool : 'inline-source-map',
}

export const bundleConfig = {
  watch : true,
  entry : {
    // login : ['webpack-hot-middleware/client', 'babel-polyfill', `${ components }/login/index.jsx`],
    login : [ 'babel-polyfill', `${ components }/login/index.jsx`],
    dashboard : [ 'babel-polyfill', `${ components }/dashboard/index.jsx`],
    // 'script.dev' : [ 'babel-polyfill', `${ components }/index.jsx`],
  }, 
  output : {
    path : path.resolve(__dirname, js),
    filename : '[name].js',
    publicPath : './src/public',
  },
  module : {
    loaders : [
      {
        test : /\.jsx?$/,
        loader : 'babel-loader',
        exclude : /(nodule_modules|\.git)/,
        // options : {
        //   babelrc : true,
        //   cacheDirectory : true,
        //   presets : ['es2015', 'react'],
        // },
        query : {
          compact : false,
          // cacheDirectory: true,
          presets : ['es2015', 'react', 'stage-2'/*, 'react-hmre' */],
          // plugins : [ 'syntax-async-functions', 'transform-regenerator' ]
        },
      }
    ],
  },
  // plugins : [ uglify, /*, HMR,*/ namedModules, noErrors ],
  resolve: { extensions: ['.js', '.jsx'] },
  // devServer : { hot : true, compress : true, },
  // devtool : 'inline-source-map',
}

export default [ cssConfig, bundleConfig ]