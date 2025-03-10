export interface NetlifyPluginConstants {
  /**
   * path to the Netlify configuration file.
   * `undefined` if none was used.
   */
  CONFIG_PATH?: string
  /**
   * directory that contains the deploy-ready HTML files and assets generated by the build. Its value is always defined, but the target might not have been created yet.
   */
  PUBLISH_DIR: string
  /**
   * the directory where function source code lives.
   * `undefined` if no `netlify/functions` directory exists in the base directory and if not specified by the user.
   */
  FUNCTIONS_SRC?: string
  /**
   * the directory where internal Edge Handlers source code lives. This is where build plugins should place auto-generated handlers.
   * `undefined` if the version of @netlify/build does not support internal Edge Handlers
   */
  INTERNAL_EDGE_HANDLERS_SRC?: string
  /**
   * the directory where internal function source code lives. This is where build plugins should place auto-generated functions.
   * `undefined` if the version of @netlify/build does not support internal functions
   */
  INTERNAL_FUNCTIONS_SRC?: string
  /**
   * the directory where built serverless functions are placed before deployment. Its value is always defined, but the target might not have been created yet.
   */
  FUNCTIONS_DIST: string
  /**
   * the directory where built Edge Handlers are placed before deployment. Its value is always defined, but the target might not have been created yet.
   */
  EDGE_HANDLERS_DIST: string
  /**
   * the directory where Edge Handlers source code lives.
   * `undefined` if no `netlify/edge-handlers` directory exists in the base directory and if not specified in `netlify.toml`.
   */
  EDGE_HANDLERS_SRC?: string
  /**
   * boolean indicating whether the build was [run locally](https://docs.netlify.com/cli/get-started/#run-builds-locally) or on Netlify
   */
  IS_LOCAL: boolean
  /**
   * version of Netlify Build as a `major.minor.patch` string
   */
  NETLIFY_BUILD_VERSION: string
  /**
   * the Netlify site ID
   */
  SITE_ID: string
}
