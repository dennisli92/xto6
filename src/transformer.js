import fs from 'fs';
import merge from 'lodash/object/merge.js';
import codeGenerator from 'escodegen';
import formatter from 'esformatter';
import astGenerator from './utils/ast-generator.js';

// Transformers
import classTransformation from './transformation/classes.js';
import templateStringTransformation from './transformation/template-string.js';
import arrowFunctionTransformation from './transformation/arrow-functions.js';
import letTransformation from './transformation/let.js';
import defaultArgsTransformation from './transformation/default-arguments.js';
import objectMethodsTransformation from './transformation/object-methods.js';

export default
class Transformer {

  /**
   * @constructor
   */
  constructor(options = {}) {

    this.sourceCode = '';

    this.ast = {};
    this.options = merge(this.constructor.defaultOptions, options);
    this.transformations = [];

    this.prepareTransformations();

  }

  /**
   * Prepare transformations array by give options
   */
  prepareTransformations() {

    let shouldTransform = (key) => {
      return typeof this.options.transformers[key] !== 'undefined' && this.options.transformers[key];
    };

    let doTransform = (key, transformation) => {
      if(shouldTransform(key)) {
        this.transformations.push(transformation);
      }
    };

    doTransform('classes', classTransformation);
    doTransform('stringTemplates', templateStringTransformation);
    doTransform('arrowFunctions', arrowFunctionTransformation);
    doTransform('let', letTransformation);
    doTransform('defaultArguments', defaultArgsTransformation);
    doTransform('objectMethods', objectMethodsTransformation);
  }

  /**
   * Prepare the abstract syntax tree for given file
   *
   * @param filename
   */
  readFile(filename) {

    const {ast, js} = astGenerator.readFile(filename, {
      sync: true,
      ecmaVersion: 6
    });

    this.ast = ast;
    this.sourceCode = js;

  }

  /**
   * Prepare an abstract syntax tree for given code in string
   *
   * @param string
   */
  read(string) {

    const {ast, js} = astGenerator.read(string, this.options);

    this.ast = ast;
    this.sourceCode = js;

  }

  /**
   * Apply a transformation on the AST
   *
   * @param transformation
   */
  applyTransformation(transformation) {

    transformation(this.ast);

  }

  /**
   * Apply All transformations
   */
  applyTransformations() {

    for (let i = 0; i < this.transformations.length; i++) {
      let transformation = this.transformations[i];
      this.applyTransformation(transformation);

    }

  }

  /**
   * Returns the code string
   *
   * @returns {Object}
   */
  out() {
    let result;
    result = codeGenerator.generate(this.ast, {
      comment: true, 
      format: {
        indent: {
          style: '  ',
        },
        preserveBlankLines: true
      },
      sourceCode: this.sourceCode
    });

    if(this.options.formatter !== false) {
      result = formatter.format(result, this.options.formatter);
    }

    return result;
  }

  /**
   * Writes the code on file
   *
   * @param filename
   * @param callback
   */
  writeFile(filename, callback) {

    const code = this.out();

    if(typeof callback === 'function') {
      fs.writeFile(filename, code, callback);
    } else {
      fs.writeFileSync(filename, code);
    }

  }

}

Transformer.defaultOptions = {
  transformers: {
    classes: true,
    stringTemplates: true,
    arrowFunctions: true,
    let: true,
    defaultArguments: true,
    objectMethods: true
  },
  formatter: false
};
