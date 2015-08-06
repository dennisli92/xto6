import * as acorn from 'acorn-jsx';
import escodegen from 'escodegen-jsx';
import fs from 'fs';
import coffee from 'coffee-script';

/**
 * This function reads a js file and transforms it into AST
 *
 * @author Mohamad Mohebifar
 * @param file
 * @param options
 * @returns {Object}
 */
export function readFile(file, options) {

  if (typeof options.coffee === 'undefined') {
    options.coffee = /\.coffee$/.test(file);
  }

  if (options.sync) {
    let js = fs.readFileSync(file, 'utf8');
    return this.read(js, options);
  } else {
    fs.readFile(file, (js) => {
      if (options.callback) {
        options.callback(this.read(js, options));
      }
    });
  }

}

/**
 * This function reads a js string and transforms it into AST
 *
 * @author Mohamad Mohebifar
 * @param js
 * @param options
 * @returns {Object}
 */
export function read(js, options) {
  let comments = [];
  let tokens = [];

  options.ranges = true;
  options.onComment = comments;
  options.onToken = tokens;
  options.plugins = {
    jsx: true
  };

  if (options.coffee) {
    js = coffee.compile(js);
  }
  
  let ast = acorn.parse(js, options);

  escodegen.attachComments(ast, comments, tokens);

  return {ast, js};
}

export default {
  read: read,
  readFile: readFile
};
