// Top, a data structure for efficient adding, querying, and removing
// nodes with keys in descending order.
// with some additional modifications to check key ranges.

var assert = require('assert');
var Util = require('./util');
const Logger = require('./logger')
const logger = new Logger('Top', ['info'])

Top = function(type, minDist) {

  this.minDist = minDist;

  var descendCompare = (node1, node2) => {
    assert(typeof(node1.key) === 'number');
    assert(typeof(node2.key) === 'number');
    return node1.key > node2.key;
  };

  var ascendCompare = (node1, node2) => {
    assert(typeof(node1.key) === 'number');
    assert(typeof(node2.key) === 'number');
    return node1.key < node2.key;
  };

  // By default, Tops are max Tops
  if (type === "min") {
    this.compare = ascendCompare;
  } else {
    this.compare = descendCompare;
  }

  // A list of nodes descending order of keys
  this.nodes = [];

  // Inserts a new node only if its key is not too close to the current
  // keyspace. Used to control price congestion in setting bets.
  //
  // Return whether we inserted the new node or not.
  this.checkAndSplice = function(index, node) {
    var beforeNode = this.nodes[index-1];
    var afterNode = this.nodes[index];
    if (this.minDist) {
      if (beforeNode && Util.approxEquals(beforeNode.key, node.key, this.minDist)) {
        logger.info(node.key + " too close to " + beforeNode.key)
        return false;
      }
      if (afterNode && Util.approxEquals(afterNode.key, node.key, this.minDist)) {
        logger.info(node.key + " too close to " + afterNode.key);
        return false;
      }
    }
    this.nodes.splice(index, 0, node);
    return true;
  };

  // Add the given node into descending sorted order into top
  // use the merge_func, if defined, to merge with existing
  // nodes with the same key
  // if distance given, only inserts the key if it is
  // at least distance away from any nearest key.
  // if an insertion is successful, return true.
  // otherwise, return false.
  this.add = (newNode, merge_func) => {
    assert(!(merge_func && this.minDist)); // merge_func and minDist should not
    // be non-null at the same time.
    var found = false; // whether we found a place to insert
    var merge = false; // whether we merge or not
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.compare(newNode, this.nodes[i])) {
        found = true;
        break;
      } else if (newNode.key === this.nodes[i].key) {
        found = true;
        merge = true;
        break;
      }
    }

    if (found) {
      if (merge && merge_func !== undefined) {
        assert(this.nodes[i].key === newNode.key);
        merge_func(this.nodes[i], newNode);
        return true;
      } else {
        return this.checkAndSplice(i, newNode);
      }
    } else {
      return this.checkAndSplice(this.nodes.length, newNode);
    }
  };

  // Return the furthest key that is at least this.minDist away from the nearest
  // key, starting from node[0].key and moving on down.
  // If it's a min-top, this will be the biggest such key.
  // If it's a max-top, it will be the smallest such key.
  // Otherwise, if no such gap is found in keys,
  // or this.minDist is not defined, return undefined.
  this.search = () => {
    if (!this.minDist || this.isEmpty()) { return undefined; }
    // Empty tops don't impose any restrictions on the limit
    for (var i = 0; i < this.nodes.length-1; i++) {
      if (type === 'min') {
        if (this.nodes[i].key + this.minDist <= this.nodes[i+1].key - this.minDist) {
          return this.nodes[i].key + this.minDist;
        }
      } else {
        if (this.nodes[i].key - this.minDist >= this.nodes[i+1].key + this.minDist) {
          return this.nodes[i].key - this.minDist;
        }
      }
    }
    // We went through the whole list, return the bottom of the range
    var lastNode = this.nodes[this.nodes.length-1];
    return lastNode.key + this.minDist * ((type === 'min') ? +1 : -1);
  };

  // Removes the first node with the given key from this top
  this.remove = (key) => {
    var found = []; // indices found
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].key === key) {
        found = true;
        break;
      }
    }
    if (found) {
      return this.nodes.splice(i, 1);
    } else {
      return undefined;
    }
  };

  this.getSize = () => { return this.nodes.length }

  this.getSortedNodes = () => { return this.nodes }

  this.isEmpty = () => {
    return this.nodes.length === 0;
  };

  this.toString = () => {
    firstNode = JSON.stringify(this.nodes[0])
    lastNode = JSON.stringify(this.nodes[this.nodes.length-1])
    return `Top [${firstNode}] [${lastNode}]`
  };

  // Long string representation showing every key
  this.toLongString = () => {
    var result = "";
    this.nodes.forEach(function(node) {
      result += JSON.stringify(node) + "\n";
    });
    return result;
  };

  return this;
};

module.exports = Top;
