(function() {
	gmath = {expressions: {}};
gmath.version = '0.0.3';
/// 2012, Erik Weitnauer.

/// Creates a top-level function uid() that returns a random hex number with 16 digets as string.
(function() {
  var b32 = 0x100000000, f = 0xf, b = []
      str = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  function uid() {
    var i = 0;
    var r = Math.random()*b32;
    b[i++] = str[r & f];
    b[i++] = str[r>>>4 & f];
    b[i++] = str[r>>>8 & f];
    b[i++] = str[r>>>12 & f];
    b[i++] = str[r>>>16 & f];
    b[i++] = str[r>>>20 & f];
    b[i++] = str[r>>>24 & f];
    b[i++] = str[r>>>28 & f];
    r = Math.random()*b32;
    b[i++] = str[r & f];
    b[i++] = str[r>>>4 & f];
    b[i++] = str[r>>>8 & f];
    b[i++] = str[r>>>12 & f];
    b[i++] = str[r>>>16 & f];
    b[i++] = str[r>>>20 & f];
    b[i++] = str[r>>>24 & f];
    b[i++] = str[r>>>28 & f];
    return "_" + b.join("");
  };
  gmath.uid = uid;
})();

/** Set up the inheritance chain correctly between base and sub.
 * This correctly separates the initialization from the prototype chain.
 * In the constructor of the sub class you need to call the constructor
 * of the base class like, e.g., `Base.call(this, args)`.
 * Taken from http://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain */
gmath.inherit = function(base, sub) {
  // Avoid instantiating the base class just to setup inheritance
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
  // for a polyfill
  // Also, do a recursive merge of two prototypes, so we don't overwrite
  // the existing prototype, but still maintain the inheritance chain
  // Thanks to @ccnokes
  var origProto = sub.prototype;
  sub.prototype = Object.create(base.prototype);
  for (var key in origProto)  {
     sub.prototype[key] = origProto[key];
  }
  // Remember the constructor property was set wrong, let's fix it
  sub.prototype.constructor = sub;
  // In ECMAScript5+ (all modern browsers), you can make the constructor property
  // non-enumerable if you define it like this instead
  Object.defineProperty(sub.prototype, 'constructor', {
    enumerable: false,
    value: sub
  });
}


gmath.object = {};
gmath.object.extend = function(a, b) {
  if (typeof(b) === 'object') for (var key in b) a[key] = b[key];
  return a;
}
gmath.object.merged = function(a, b) {
  return gmath.object.extend(gmath.object.extend({}, a), b);
}
gmath.extend = gmath.object.extend;
// will hang up if there are cyclic references
gmath.deepCopy = function(a) {
  var b = a;
  if (Array.isArray(a)) {
    b = [];
    for (var i=0; i<a.length; i++) b[i] = gmath.deepCopy(a[i]);
  }
  else if (typeof(a) === 'object') {
    b = {};
    for (var key in a) if (a.hasOwnProperty(key)) b[key] = gmath.deepCopy(a[key]);
  }
  return b;
}

gmath.array = {};
gmath.array.containsAll = function(a, b) {
  if (b.length > a.length) return false;
  for (var i=0; i<b.length; i++) if (a.indexOf(b[i]) === -1) return false;
  return true;
}
gmath.array.equals = function(a, b) {
  if (a.length !== b.length) return false;
  for (var i=0; i<a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
gmath.array.isPermutation = function(a, b) {
  if (b.length !== a.length) return false;
  for (var i=0; i<b.length; i++) if (a.indexOf(b[i]) === -1) return false;
  return true;
}
gmath.array.mergedNew = function(a, b) {
  var c = a.slice();
  for (var i=0; i<b.length; i++) if (a.indexOf(b[i]) === -1) c.push(b[i]);
  return c;
}
/// Return an array that has all elements that are only in a or only in b.
gmath.array.xor = function(a, b) {
  var c = [];
  for (var i=0; i<a.length; i++) if (b.indexOf(a[i]) === -1) c.push(a[i]);
  for (var i=0; i<b.length; i++) if (a.indexOf(b[i]) === -1) c.push(b[i]);
  return c;
}
gmath.array.flatten = function(arr) {
  var res = [];
  for (var i=0; i<arr.length; i++) res = res.concat(arr[i]);
  return res;
}



gmath.getURLParameter = function(name) {
  var val = RegExp(name + '=' + '(.+?)(&|$)').exec(location.search);
  return val ? decodeURIComponent(val[1]) : null;
}

/// Creates the Object.create method if it is not supported natively.
if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
  };
}

/// Adds Array.isArray function is it is not supported natively.
if(!Array.isArray) {
  Array.isArray = function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
  };
}
// Copyright Erik Weitnauer 2012, 2013.

/** This is an implementation of fully linked nary-trees. Each non-leaf node has an array
of its children `children`, a reference to its left sibling `ls`, a reference to its right
sibling `rs` and a reference to its parent `parent`.
The Tree object is a collection of methods to handle tree structures, its not instanciated
itself. Instead, each object can be a tree node.

Most of the methods can accept both a single node or an array of nodes to work on.
*/

var Tree = { version: '1.2.5'};


/// This line is for the automated tests with node.js
if (typeof(exports) != 'undefined') {
  exports.Tree = Tree;
}

/// Will parse a sting like '[A,B[b1,b2,b3],C]' and return the top-level node of a
/// tree structure. If there are more than a single top-level node, an array of them
/// is returned (e.g. 'A,B'). Use square brackets to denote children of a node and commas
/// to separate nodes from each other. You can use any names for the nodes except ones
/// containing ',', '[' or ']'. The names will be saved in each node's `value` field.
/// Nodes will also be created in absense of values, e.g. '[,]' will return an object
/// with empty value that has an array `children` with two nodes with empty values.
Tree.parse = function(str) {
  var top = new Tree.Node();
  var curr = top.append(new Tree.Node());
  var i;
  curr.value = '';
  for (i=0; i<str.length; i++) {
    var c = str[i];
    if (c == '[') {
      curr = curr.append(new Tree.Node());
      curr.value = '';
    } else if (c == ']') {
      curr = curr.parent;
      if (curr === top) throw 'parse error';
    } else if (c == ',') {
      curr = curr.parent.append(new Tree.Node());
      curr.value = '';
    } else {
      curr.value += c;
    }
  }
  for (i=0; i<top.children.length; i++) top.children[i].parent = null;
  if (top.children.length === 1) return top.children[0];
  return top.children;
}

/// Inverse of Tree.parse, returns a string representation of the nodes, using their
/// `value` fields. This is just for debugging and allows you to look at the structure
/// of a tree and the `value` fields of its nodes. `nodes` can be a single node or an
/// array of nodes.
Tree.stringify = function(nodes) {
  var f = function(node) {
    var str = '';
    if ('value' in node) str += node.value;
    if (node.children && node.children[0]) {
      str += '[' + node.children.map(f).join(',') + ']';
    }
    return str;
  }
  if (!Array.isArray(nodes)) nodes = [nodes];
  return nodes.map(f).join(',');
};

/// Adds a uid() function to Tree, that returns a random hex number with 16 digets as string.
(function() {
  var b32 = 0x100000000, f = 0xf, b = []
     ,str = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  function uid() {
    var i = 0;
    var r = Math.random()*b32;
    b[i++] = str[r & f];
    b[i++] = str[r>>>4 & f];
    b[i++] = str[r>>>8 & f];
    b[i++] = str[r>>>12 & f];
    b[i++] = str[r>>>16 & f];
    b[i++] = str[r>>>20 & f];
    b[i++] = str[r>>>24 & f];
    b[i++] = str[r>>>28 & f];
    r = Math.random()*b32;
    b[i++] = str[r & f];
    b[i++] = str[r>>>4 & f];
    b[i++] = str[r>>>8 & f];
    b[i++] = str[r>>>12 & f];
    b[i++] = str[r>>>16 & f];
    b[i++] = str[r>>>20 & f];
    b[i++] = str[r>>>24 & f];
    b[i++] = str[r>>>28 & f];
    return b.join("");
  }
  Tree.uid = uid;
})();

/// Will clone a node and its children. Attributes beside 'children', 'ls', 'rs' and 'parent' will
/// just be a shallow copy of the original nodes. Attributes starting with '_' will not be copied at
/// all. 'ls', 'rs' and 'parent' will be set to the correct values for all children and will be set to
/// undefined for the passed node. A new random id is assigned to the cloned node if the original had
/// an id, unless the optional keep_ids parameter is passed as true.
/// `nodes` can either be a single node or an array of nodes. The cloned node or nodes are returned.
Tree.clone = function(nodes, keep_ids) {
  var f = function(node) {
    var i;
    var cloned = new node.constructor();
    for (var key in node) { if (key[0] !== '_') cloned[key] = node[key] }
    delete cloned.ls; delete cloned.rs; delete cloned.parent;
    if (node.id && !keep_ids) cloned.id = Tree.uid();
    if (node.children) {
      cloned.children = [];
      for (i=0; i<node.children.length; i++) {
        cloned.children.push(f(node.children[i]));
        cloned.children[i].parent = cloned;
      }
      for (i=0; i<node.children.length; i++) {
        cloned.children[i].ls = cloned.children[i-1];
        cloned.children[i].rs = cloned.children[i+1];
      }
    }
    return cloned;
  }
  if (!Array.isArray(nodes)) return f(nodes);
  var cloned = nodes.map(f);
  // make sure that the cloned nodes are siblings to each other, if the
  // original nodes were siblings, too
  if (nodes.length > 1) for (var i=0; i<nodes.length; i++) {
    if (i>0 && nodes[i].ls === nodes[i-1]) cloned[i].ls = cloned[i-1];
    if (i<nodes.length-1 && nodes[i].rs === nodes[i+1]) cloned[i].rs = cloned[i+1];
  }

  return cloned;
}

/**
 * Pass two identically structured trees or arrays of trees and the method
 * will return an object that maps the ids of all source tree nodes to arrays
 * of the respective target tree nodes.
 *
 * If a source node is a leaf node while its corresponding target node has
 * children, the source node will be mapped to an array containing the target
 * node and all its descendents.
 *
 * If a source node has children while its corresponding target node is a
 * leaf node, the source node's children all get mapped to arrays containing
 * the same target leaf node as only element.
 *
 * If the only1to1 parameter is passed as true, the function will not allow
 * to two cases above and raise an exception should the structure of source
 * and target tree differ. In cases where the two cases above do not apply
 * and a source node has more or less children than its corresponding target
 * node, the method throws an exception. It also throws an exception if there
 * are duplicate ids in the source tree.
 */
Tree.get_mapping_between = function(source_tree, target_tree) {
  var map = {};

  function mapfn(source, target) {
    if (source.id in map) throw "duplicate id in source tree";
    map[source.id] = [target];
    if (source.children.length !== target.children.length) {
      if (!source.has_children()) map[source.id] = target.select_all();
      else if (!target.has_children()) source.for_each(function(s) { map[s.id] = [target]});
      else throw "tree structures don't match";
    } else {
      for (var i=0; i<source.children.length; i++) mapfn(source.children[i], target.children[i]);
    }
  }

  if (Array.isArray(source_tree)) {
    if (source_tree.length !== target_tree.length) throw "tree structures don't match";
    for (var i=0; i<source_tree.length; i++) mapfn(source_tree[i], target_tree[i]);
  } else mapfn(source_tree, target_tree);

  return map;
}

/**
 * Pass two identically structured trees or arrays of trees and the method
 * will return an object that maps the ids of all source tree nodes to the
 * respective target tree nodes. If the trees / arrays are structured
 * differently, or if there is a duplicate id in the source nodes, the
 * methods throws an exception.
 */
Tree.get_1to1_mapping_between = function(source_tree, target_tree) {
  var map = {};

  function mapfn(source, target) {
    if (source.id in map) throw "duplicate id in source tree";
    map[source.id] = target;
    if (source.children.length !== target.children.length) throw "tree structures don't match";
    for (var i=0; i<source.children.length; i++) mapfn(source.children[i], target.children[i]);
  }

  if (Array.isArray(source_tree)) {
    if (source_tree.length !== target_tree.length) throw "tree structures don't match";
    for (var i=0; i<source_tree.length; i++) mapfn(source_tree[i], target_tree[i]);
  } else mapfn(source_tree, target_tree);

  return map;
}

/// Returns the smallest range of nodes (continuous, ordered neighbors) covering the passed
/// nodes. The method first gets the closest common ancestor and then selects a range of its
/// children that contains all the passed nodes.
Tree.nodes_to_range = function(nodes) {
  var N = nodes.length;
  if (N === 0) return [];
  if (N === 1) return [nodes[0]];
  var tree = nodes[0];
  while (tree.parent) tree = tree.parent;

  // get the closest common anchestor (cca)
  var paths = nodes.map(function(node) {
    return Tree.get_path(node);
  });
  var same = function(len) {
    var val = paths[0][len];
    for (var i=0; i<paths.length; i++) {
      if (paths[i].length <= len+1) return false; // we want an ancestor, so if already at leaf, return
      if (paths[i][len] !== val) return false;
    }
    return true;
  }
  var cpl = 0; // common path length
  while (same(cpl)) cpl++;
  var cca = Tree.get_child(paths[0].slice(0, cpl), tree);

  // get the cca's left-most and right-most child that contains one of the nodes
  var rm=-1, lm=cca.children.length, i;
  for (i=0; i<N; i++) {
    var n = Tree.get_child(paths[i].slice(0, cpl+1), tree);
    var idx = cca.children.indexOf(n);
    if (idx > rm) rm = idx;
    if (idx < lm) lm = idx;
  }

  // now select the whole range of nodes from left to right
  var range = [];
  for (i=lm; i<=rm; i++) range.push(cca.children[i]);
  return range;
}

/// Inserts a node into the tree as the child at position 'idx' of 'parent'. Returns the inserted
/// node.
Tree.insert = function(parent, idx, node) {
  node.ls = parent.children[idx-1];
  if (parent.children[idx-1]) parent.children[idx-1].rs = node;
  node.rs = parent.children[idx];
  if (parent.children[idx]) parent.children[idx].ls = node;
  node.parent = parent;
  parent.children.splice(idx, 0, node);
  return node;
}

/// Inserts a range of nodes at the position `idx` into the children array
/// of the node `parent`. The `nodes` array must contain a list of direct
/// siblings ordered from left to right.
Tree.insert_range = function(parent, idx, nodes) {
  var N=nodes.length;
  if (N===0) return;
  nodes[0].ls = parent.children[idx-1];
  if (parent.children[idx-1]) parent.children[idx-1].rs = nodes[0];
  nodes[N-1].rs = parent.children[idx];
  if (parent.children[idx]) parent.children[idx].ls = nodes[N-1];
  for (var i=0; i<N; i++) nodes[i].parent = parent;
  parent.children = parent.children.slice(0,idx).concat(nodes, parent.children.slice(idx));
  return nodes;
}

/// Appends a range of nodes to the end of the children array of the node `parent`.
/// The `nodes` array must contain a list of direct siblings ordered from left to right.
/// Returns the inserted node range.
Tree.append_range = function(parent, nodes) {
  var N=nodes.length;
  if (N===0) return;
  var last = parent.children[parent.children.length-1];
  if (last) last.rs = nodes[0];
  nodes[0].ls = last;
  nodes[N-1].rs = null;
  for (var i=0; i<N; i++) nodes[i].parent = parent;
  parent.children = parent.children.concat(nodes);
  return nodes;
}

/// Returns an array of all node ranges for which the passed selector function
/// returned true. The passed node can either be a single node or an array of nodes.
Tree.filterRange = function(selector, node) {
  var result = [];
  var nodes = Array.isArray(node) ? node : [node];
  var f = function(nodes, idx) {
    var range = [];
    for (var i=idx; i<nodes.length; i++) {
      range.push(nodes[i]);
      if (selector(range)) result.push(range.slice());
    }
    if (nodes[idx].children)
      for (var i=0; i<nodes[idx].children.length; i++) f(nodes[idx].children, i);
  }
  for (var i=0; i<nodes.length; i++) f(nodes, i);
  return result;
}

/// Inserts a node into the tree as the last child of 'parent'. Returns the inserted node.
Tree.append = function(parent, node) {
  var last = parent.children[parent.children.length-1];
  if (last) last.rs = node;
  node.ls = last;
  node.rs = null;
  node.parent = parent;
  parent.children.push(node);
  return node;
}

/// Removes the passed node from the tree and returns its previous index.
Tree.remove = function(node) {
  var idx;
  var siblings = node.parent.children;
  idx = siblings.indexOf(node);
  if (siblings[idx-1]) siblings[idx-1].rs = node.rs;
  if (siblings[idx+1]) siblings[idx+1].ls = node.ls;
  siblings.splice(idx,1);
  return idx;
}

/// Removes a range of nodes from the tree and returns the index of the first node if
/// nodes contained more than zero nodes. The `nodes` array must contain a list of direct
/// siblings ordered from left to right.
Tree.remove_range = function(nodes) {
  var N = nodes.length;
  if (N === 0) return;
  var siblings = nodes[0].parent.children;
  var idx = siblings.indexOf(nodes[0]);
  if (siblings[idx-1]) siblings[idx-1].rs = nodes[N-1].rs;
  if (siblings[idx+N]) siblings[idx+N].ls = nodes[0].ls;
  siblings.splice(idx,N);
  return idx;
}

/// Replaces n1 with n2 by removing n1 and inserting n2 at n1's old position. If n2 was part of a
/// tree (had a parent), it will be removed before being inserted at the new position. It is safe
/// to replace a node with its child.
/// Returns the inserted node.
Tree.replace = function(n1, n2) {
  if (n2.parent) Tree.remove(n2);
  var idx = Tree.remove(n1);
  return Tree.insert(n1.parent, idx, n2);
}

/// Will switch n1 with n2 if they have the same parent. Otherwise throws an exception.
Tree.switch_siblings = function(n1, n2) {
  if (n1.parent != n2.parent) throw "Called switch_siblings on nodes that are no siblings!";
  var p = n1.parent;
  var idx1 = p.children.indexOf(n1);
  var idx2 = p.children.indexOf(n2);
  p.children[idx1] = n2;
  p.children[idx2] = n1;
  var h;
  if (n1.rs == n2) {
    if (n1.ls) n1.ls.rs = n2;
    if (n2.rs) n2.rs.ls = n1;
    n1.rs = n2.rs;
    n2.ls = n1.ls;
    n1.ls = n2;
    n2.rs = n1;
  } else if (n1.ls == n2) {
    if (n1.rs) n1.rs.ls = n2;
    if (n2.ls) n2.ls.rs = n1;
    n1.ls = n2.ls;
    n2.rs = n1.rs;
    n1.rs = n2;
    n2.ls = n1;
  } else {
    if (n1.ls) n1.ls.rs = n2;
    if (n1.rs) n1.rs.ls = n2;
    if (n2.ls) n2.ls.rs = n1;
    if (n2.rs) n2.rs.ls = n1;
    h = n1.ls; n1.ls = n2.ls; n2.ls = h;
    h = n1.rs; n1.rs = n2.rs; n2.rs = h;
  }
}

/// Will throw an expecption if any node in the tree has invalid value for parent, ls or rs.
/// `nodes` can either be a single node or an array of nodes. Accordingly, a single node or an array
/// of nodes is returned.
Tree.validate = function(nodes) {
  var check = function(node, parent) {
    if (node.parent != parent) throw "wrong parent information";
    if (node.children) {
      for (var i=0; i<node.children.length; i++) {
        var child = node.children[i];
        if (child.ls != node.children[i-1]) throw "wrong ls information";
        if (child.rs != node.children[i+1]) throw "wrong rs information";
        check(child, node);
      }
    }
  }
  if (!Array.isArray(nodes)) nodes = [nodes];
  for (var i=0; i<nodes.length; i++) check(nodes[i], null);
}

/// Pass the parent node and then a sequence of children indices to get a specific
/// child. E.g. for `[A[B,C[D]]]`, Tree.get(t, [0, 1, 0]) will return node `D`.
/// If the path does not exist, the method throws an 'invalid path' exception.
Tree.get_child = function(path, node) {
  for (var i=0; i<path.length; i++) {
    if (!node.children || node.children.length <= path[i]) throw 'invalid path';
    node = node.children[path[i]];
  }
  return node;
}

/// Safe way to get to a nodes anchestors. If a parent does not exist, throws
/// an invalid path exception.
Tree.get_parent = function(level, node) {
  for (var i=0; i<level; i++) {
    if (node.parent) node = node.parent;
    else throw 'invalid path';
  }
  return node;
}

/// Pass a node to get an array of children-indices from the root to the
/// passed node. This is the inverse function to Tree.get_child.
Tree.get_path = function(node) {
  var path = [];
  while (node.parent) {
    path.unshift(node.parent.children.indexOf(node));
    node = node.parent;
  }
  return path;
}

/// Calls the passed function for the passed node and all its descandents in depth-first order.
/// Node can either be a single node or an array of nodes.
Tree.for_each = function(f, node) {
  var nodes = Array.isArray(node) ? node : [node];
  var traverse = function(node) {
    f(node);
    if (node.children) for (var i=0; i<node.children.length; i++) traverse(node.children[i]);
  }
  for (var i=0; i<nodes.length; i++) traverse(nodes[i]);
}

/// Calls the passed function for each of the passed nodes and their anchestors, depth-first.
/// The results are stored in an array that is returned. Node can either be a single node or
/// an array of nodes.
Tree.map = function(f, node) {
  var nodes = Array.isArray(node) ? node : [node];
  var res = [];
  var traverse = function(node) {
    res.push(f(node));
    if (node.children) for (var i=0; i<node.children.length; i++) traverse(node.children[i]);
  }
  for (var i=0; i<nodes.length; i++) traverse(nodes[i]);
  return res;
}

/// Returns an array of all nodes for which the passed selector function returned true. Traverses
/// the nodes depth-first. The passed node can either be a single node or an array of nodes.
Tree.filter = function(selector, node) {
  var result = [];
  var nodes = Array.isArray(node) ? node : [node];
  var f = function(node) {
    if (selector(node)) result.push(node);
    if (node.children) for (var i=0; i<node.children.length; i++) f(node.children[i]);
  }
  for (var i=0; i<nodes.length; i++) f(nodes[i]);
  return result;
}

/// Returns an array of all nodes in the tree of the passed root node. The root node is included.
/// Traverses the nodes depth-first. The passed node can either be a single node or an array of
/// nodes.
Tree.select_all = function(node) {
  return Tree.filter(function() { return true }, node);
}

/// Returns the first node in the passed node or its decandents for that the selector function
/// returns true. Traverses depth-first. Node can either be a single node or an array of nodes.
/// If no nodes matches, returns null.
Tree.select_first = function(selector, node) {
  var f = function(node) {
    var curr = node;
    for (;;) {
      if (selector(curr)) return curr;
      if (curr.children && curr.children[0]) {
        curr = curr.children[0];
        continue;
      }
      if (curr === node) return null;
      while (!curr.rs) {
        curr = curr.parent;
        if (curr === node) return null;
      }
      curr = curr.rs;
    }
  }
  var nodes = Array.isArray(node) ? node : [node];
  for (var i=0; i<nodes.length; i++) {
    var n = f(nodes[i]);
    if (n) return n;
  }
  return null;
}

/// Returns the closest common anchestor of the passed nodes.
Tree.get_cca = function(nodes) {
  var paths = nodes.map(function(node) { return Tree.get_path(node) });
  var same = function(len) {
    var val = paths[0][len];
    for (var i=0; i<paths.length; i++) {
      if (paths[i].length <= len+1) return false; // no need to look further if we are at a leaf already
      if (paths[i][len] !== val) return false;
    }
    return true;
  }
  var cpl = 0; // common path length
  while (same(cpl)) cpl++;
  var d = paths[0].length-cpl, n = nodes[0];
  for (var i=0; i<d; i++) n = n.parent;
  return n;
}

/// Returns an array of all leaf nodes of the node array or single node passed.
Tree.get_leaf_nodes = function(node) {
  return Tree.filter(function(n) { return !(n.children && n.children.length) }, node);
}

/// Retruns true if the node is top-level in the tree (its parent is the Tree object).
Tree.is_root = function(node) {
  return !node.parent;
}

/// Retruns true if the passed node array is a proper node range, which is the
/// case only if they are all siblings and ordered from left to right.
Tree.is_range = function(nodes) {
  for (var i = 1; i < nodes.length; i++) {
    if (nodes[i-1].rs !== nodes[i]) return false;
  }
  return true;
}

/// Returns the tree that a node belongs to by following the .parent references. Returns
/// null if the top-most parent is not a Tree.
Tree.get_root = function(node) {
  while (node.parent) node = node.parent;
  return node;
}

/// Returns an array of all nodes that have the passed value in their .value field. Seaches on
/// the passed array of nodes or single node depth-first.
Tree.get_by_value = function(value, node) {
  return Tree.filter(function(n) { return n.value === value}, node);
}

/// Returns the first node with the passed id or null if no node has the id. Seaches on
/// the passed array of nodes or single node depth-first.
Tree.get_by_id = function(id, node) {
  return Tree.select_first(function (n) { return n.id === id }, node);
}


/// To get all static methods of the Tree object as instance methods on your
/// object, you can make it inherit from the "Tree.Node" class (use
/// `new Tree.Node()` as the prototype).
Tree.Node = function() {
  this.children = [];
  this.parent = null;
  this.ls = null;
  this.rs = null;
  this.id = Tree.uid();
}
Tree.Node.prototype.stringify = function() { return Tree.stringify(this) }
Tree.Node.prototype.clone = function(keep_ids) { return Tree.clone(this, keep_ids) }
Tree.Node.prototype.get_mapping_to = function(target) { return Tree.get_mapping_between(this, target) }
Tree.Node.prototype.get_1to1_mapping_to = function(target) { return Tree.get_1to1_mapping_between(this, target) }
Tree.Node.prototype.insert = function(idx, node) { return Tree.insert(this, idx, node) }
Tree.Node.prototype.insert_range = function(idx, nodes) { return Tree.insert_range(this, idx, nodes) }
Tree.Node.prototype.append_range = function(nodes) { return Tree.append_range(this, nodes) }
Tree.Node.prototype.append = function(node) { return Tree.append(this, node) }
Tree.Node.prototype.remove = function() { return Tree.remove(this) }
Tree.Node.prototype.remove_range = function(nodes) { return Tree.remove_range(nodes) }
Tree.Node.prototype.replace_with = function(other) { return Tree.replace(this, other) }
Tree.Node.prototype.switch_with_sibling = function(other) { return Tree.switch_siblings(this, other) }
Tree.Node.prototype.validate = function() { return Tree.validate(this) }
Tree.Node.prototype.get_child = function(path) { return Tree.get_child(path, this) }
Tree.Node.prototype.get_parent = function(level) { return Tree.get_parent(level, this) }
Tree.Node.prototype.get_path = function() { return Tree.get_path(this) }
Tree.Node.prototype.for_each = function(f) { return Tree.for_each(f, this) }
Tree.Node.prototype.map = function(f) { return Tree.map(f, this) }
Tree.Node.prototype.filter = function(f) { return Tree.filter(f, this) }
Tree.Node.prototype.filterRange = function(f) { return Tree.filterRange(f, this) }
Tree.Node.prototype.select_all = function() { return Tree.select_all(this) }
Tree.Node.prototype.select_first = function(f) { return Tree.select_first(f, this) }
Tree.Node.prototype.get_leaf_nodes = function() { return Tree.get_leaf_nodes(this) }
Tree.Node.prototype.is_root = function() { return Tree.is_root(this) }
Tree.Node.prototype.get_root = function() { return Tree.get_root(this) }
Tree.Node.prototype.get_by_value = function(value) { return Tree.get_by_value(value, this) }
Tree.Node.prototype.get_by_id = function(id) { return Tree.get_by_id(id, this) }
Tree.Node.prototype.has_children = function() { return this.children && this.children.length > 0 }
// tokenizer.js
// July 2012
// Copyright Erik Weitnauer 2012

/// Analyses the passed string and returns an array of tokens:
/// { type: 'name', 'number' or 'operator'
///   value: string or number
///   from: index of first character
///   to: index of last character+1

/// a latex command is either a backslash plus a single non-alpha-numeric character
/// like \, or is a backslash plus a string of alphabetic characters
var tokenize = function(str) {
  var r_number = new RegExp('^\\s*([0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?)');
  // var r_name = new RegExp('^\\s*([a-zA-Z]+[a-zA-Z0-9]*)'); // multi-character names
  var r_name = new RegExp('^\\s*([a-zA-Z])'); // single-character names
  var r_long_name = new RegExp('^\\s*"([^"]+)"'); // multi-character strings "..."
  var r_operator = new RegExp('^\\s*(\\*\\*|[-+*/=();,^{}_])');
  var r_latex_command = new RegExp('^\\s*(\\\\[^A-Za-z0-9\\s]|\\\\[A-Za-z]+)');
  var r_whitespace = new RegExp('^(\\s+)');
  var tokens = [];
  var l = 0;
  if(str) { l = str.length;}

  for (var i=0; i<l; ) {
    var s = str.substr(i);     // this is NOT PERFOMANT, but using lastIndex to make the regexp start
                               // searching at a certain point does not work in combination with
                               // aligning the regexp to the start of the string using ^...
    var m;
    if (m = r_number.exec(s)) { // test for number
      tokens.push({type: 'number', value: parseFloat(m[1])
                  ,from: i+(m[0].length-m[1].length), to: i+m[0].length});
      i += m[0].length;
    } else if (m = r_name.exec(s)) { // test for name
      tokens.push({type: 'name', value: m[1]
                  ,from: i+(m[0].length-m[1].length), to: i+m[0].length});
      i += m[0].length;
    } else if (m = r_long_name.exec(s)) { // test for long name
      tokens.push({type: 'name', value: m[1]
                  ,from: i+(m[0].length-m[1].length), to: i+m[0].length});
      i += m[0].length;
    } else if (m = r_operator.exec(s)) { // test for operator
      tokens.push({type: 'operator', value: m[1]
                  ,from: i+(m[0].length-m[1].length), to: i+m[0].length});
      i += m[0].length;
    } else if (m = r_latex_command.exec(s)) { // test for operator
      tokens.push({type: 'latex', value: m[1]
                  ,from: i+(m[0].length-m[1].length), to: i+m[0].length});
      i += m[0].length;
    } else if (m = r_whitespace.exec(s)) {
      i += m[0].length;
    } else {
      throw "can't tokenize '" + s + "'";
    }
  }
  return tokens;
}
/// Copyright Erik Weitnauer 2015.

var AlgebraModel = function(eq, options) {
  Tree.Node.call(this); // call super class constructor
  this.id = gmath.uid();
  this.events = d3.dispatch('create', 'change', 'mistake', 'end-of-interaction'
    , 'node-changed');
  this.options = gmath.extend({ hide_mult_op: true
                              , hide_leading_op: true
                              , capabilities: [ 'num', 'var', 'sym', 'brackets', 'sign'
                                              , 'add-sub', 'mul-div', 'exponent', 'equals']
                              , no_history: true // by default, perform actions in place
                              }
                            , options);
  this.hide_rules = [];
  this.init_hide_rules();
  this.watchedAspects = [];

  // in case the user didn't pass a custom parser, use one with
  // numbers, variables, brackets, sign, sum, product and fraction
  this.parser = (options && options.parser) || AlgebraParser.apply(this, this.options.capabilities);
  this.parseAndSet(eq);
};
gmath.inherit(Tree.Node, AlgebraModel); // set Tree.Node as our super class
gmath.AlgebraModel = AlgebraModel;

/// Does only clone the actual tree and the options, but not, e.g., the event
/// listeners or the watchedAspects.
AlgebraModel.prototype.clone = function(keep_ids) {
  var eq = new AlgebraModel(null, this.options);
  eq.options.capabilities = eq.options.capabilities.slice(); // deep copy
  eq.hide_rules = this.hide_rules.slice();
  Tree.append(eq, Tree.clone(this.children[0], keep_ids));
  return eq;
}

AlgebraModel.prototype.move_actions = []; // list of all available move actions

if (typeof(exports) !== 'undefined') exports.AlgebraModel = AlgebraModel;

AlgebraModel.is_top_most = function(node) {
  return !node.parent || (node.parent instanceof AlgebraModel);
}

AlgebraModel.prototype.init_hide_rules = function() {
  for (var i=0; i<this.options.capabilities.length; i++) {
    var e = gmath.expressions[this.options.capabilities[i]];
    if (e.hide_rule) this.hide_rules.push(e.hide_rule);
  }
}

/** Parses the passed ascii or latex string `eq`. If this succeeds, it
 * sets the alm to the parsing result, triggers a change event and returns
 * true. If the parsing fails, it sets the tree to an empty tree and returns false.
 */
AlgebraModel.prototype.parseAndSet = function(eq, keep_brackets) {
  this.children = [];
  var expr = this.parser.parse(eq);
  if (!expr) return false;
  Tree.append(this, expr);
  if (!keep_brackets) this.remove_brackets();
  this.hide_nodes();
  this.changed({oldTree: this, newTree: this});
  return true;
}

/** Parses the passed ascii or latex string `eq` using this eqtrees parser.
 * Returns the root node of the result or null if an error occured. */
AlgebraModel.prototype.parse = function(eq, keep_brackets) {
  var expr = this.parser.parse(eq);
  if (!expr) return null;
  if (!keep_brackets) this.remove_brackets([expr]);
  return expr;
}

/** Optionally pass an array of nodes or a single node. */
AlgebraModel.prototype.to_ascii = function(nodes) {
  nodes = nodes || this.children;
  if (!Array.isArray(nodes)) nodes = [nodes];
  return nodes.map(function(n) { return n.to_ascii() }).join("");
}

/** Optionally pass an array of nodes or a single node. */
AlgebraModel.prototype.to_latex = function(nodes) {
  nodes = nodes || this.children;
  if (!Array.isArray(nodes)) nodes = [nodes];
  return nodes.map(function(n) { return n.to_latex() }).join("");
}

AlgebraModel.select_range_by_value = function(value, strip_single) {
  return function(ns) {
    if (!ns[0].parent) return false;
    if (ns[0].parent.parent && AlgebraModel.range_contains_all_siblings(ns)) return false;
    return (AlgebraModel.rangeToAscii(ns) === value
         || AlgebraModel.rangeToAsciiNoLeadingOp(ns, strip_single) === value
         || (ns.length === 1 && AlgebraModel.fractionToAscii(ns[0]) === value));
  }
}

AlgebraModel.rangeToAscii = function(ns) {
  if (ns.length === 1 && ns[0].hidden) return '';
  return ns.map(function(n) { return n.to_ascii() }).join('');
}

AlgebraModel.isLeadingCommutativeOp = function(node) {
  return (node.is_group() && node.commutative && node.associative);
}

AlgebraModel.rangeToAsciiNoLeadingOp = function(ns, strip_single) {
  if (ns.length === 0) return '';
  if (ns.length === 1 && ns[0].hidden) return '';
  var str = ns.map(function(n) { return n.to_ascii() }).join('');
  if (ns.length === 1 && !strip_single) return str;
  if (AlgebraModel.isLeadingCommutativeOp(ns[0])) return str.substring(ns[0].children[0].to_ascii().length);
  return str;
}

AlgebraModel.fractionToAscii = function(frac) {
  if (!frac.is_group('fraction')) return '';
  var str = frac.to_ascii();
  if (str.slice(0, 1) === '(' && str.slice(str.length-1, str.length) === ')')
    str = str.substr(1, str.length-2);
  return str;
}

AlgebraModel.range_contains_all_siblings = function(ns) {
  return (ns[0]
       && ns[0].parent
       && !ns[0].parent.is_group('exponent')
       && ns.length === ns[0].parent.children.length);
}

AlgebraModel.select_node_by_value = function(val) {
  return function(n) {
    return !n.is_root() && !n.hidden && n.to_ascii() === val;
  }
}

/** Returns the nth node range in the tree that matches the passed value string.
 * If no `n` is passed, it will return an array of all matching node ranges.
 * Optionally pass an array of nodes that is used instead of this.children. */
AlgebraModel.getRanges = function(value, n, nodes) {
  var res = Tree.filterRange(AlgebraModel.select_range_by_value(value), nodes);
  return (typeof(n) === 'number') ? res[n] : res;
}


AlgebraModel.prototype.getRanges = function(value, n, nodes) {
  return AlgebraModel.getRanges(value, n, nodes || this.children);
}

/** Returns the nth node in the tree that matches the passed value string.
 * If no `n` is passed, it will return an array of all matching nodes.
 * Optionally pass an array of nodes that is used instead of this.children. */
AlgebraModel.getNodes = function(value, n, nodes) {
  var res = Tree.filter(AlgebraModel.select_node_by_value(value, true), nodes);
  return (typeof(n) === 'number') ? res[n] : res;
}

AlgebraModel.prototype.getNodes = function(value, n, nodes) {
  return AlgebraModel.getNodes(value, n, nodes || this.children);
}

/// Dispatch a change event.
AlgebraModel.prototype.changed = function(action, sender_id) {
  this.events.change(
    { type: 'change'
    , term: action && action.newTree && action.newTree.to_ascii()
    , action: action
    , sender_id: sender_id || this.id }
  );
}

/// Dispatch a create event.
AlgebraModel.prototype.created = function(action, sender_id) {
  this.events.create(
    { type: 'create'
    , term: action && action.newTree && action.newTree.to_ascii()
    , action: action
    , sender_id: sender_id || this.id }
  );
}

/// Should be called each time a gesture ends.
AlgebraModel.prototype.finishInteraction = function() {
  var toBeSimplified = this.children[0].filter(function(n){return n.simplify})
     ,action = gmath.actions.PostInteractionSimplificationAction
                            .createAndDoInPlace(this, {nodes:toBeSimplified});
  toBeSimplified.forEach(function(n) { n.simplify = false; });
  if (action.changed) {
    this.hide_nodes();
    this.changed(action);
  }
  this.events['end-of-interaction']({type: 'end-of-interaction', mathObject: this});
}

AlgebraModel.prototype.root = function() {
  return this.children[0];
}

/// Pretend I am a math node to avoid extra checks.
AlgebraModel.prototype.is_group = function() {
  return false;
}

/// Pretend I am a math node to avoid extra checks.
AlgebraModel.prototype.clean_up = function() { }

/// If val is passed, sets the numeric value for the passed node to it. The
/// passed node might be a Num node or a Sign, Add or Sub group with a Num
/// child. Might change the structure of the tree to reflect changes from
/// positive to negative values or vice versa.
/// If no val is passed, just returns the current value of the node. The
/// passed node may be a Num node, or a Sign, Add or Sub node with a Num
/// child. If the node is of any other type, NaN is returned.
AlgebraModel.prototype.numeric_value = function(n, val, sender_id) {
  var old_n = n;
  var p = n.parent, v;
  if ((n instanceof Num) && p && (p.is_group('sign') ||
      p.is_group('add') || p.is_group('sub'))) n = p;
  var v = Num.get_value(n);
  if (isNaN(v)) return NaN;
  if (arguments.length < 2) return v;
  var was_positive = v>0 || (v==0 && (n instanceof Num || n.is_group('add')));
  var becomes_positive = val>0 || (val==0 && (n instanceof Num || n.is_group('add')));
  // setter
  if (was_positive && !becomes_positive) { // sign switch to -
    if (n.is_group('add')) { // switch add to sub...
      n.invert();
      this.hide_nodes();
    } else { // or create a sign group
      var idx = Tree.remove(n);
      var sign = new Sign(n);
      sign.children[0].no_anim = true;
      Tree.insert(p, idx, sign);
      sign.selected = n.selected;
      n = sign;
    }
  } else if (!was_positive && becomes_positive) { // sign switch to +
    if (n.is_group('sign')) { // either remove a sign group
      var num = n.children[1];
      Tree.replace(n, num);
      n.children[0].no_anim = true;
      num.selected = n.selected;
      n = num;
    } else if (n.is_group('sub')) { // or change sub to add
      n.invert();
      this.hide_nodes();
    }
  } else if (n.value === Math.abs(val)) return n; // no change
  if (n.is_group()) n.children[1].value = Math.abs(val);
  else n.value = Math.abs(val);
  this.changed(null, sender_id);
  this.events['node-changed']({ node: old_n, value: val, new_node: n });
  return n;
}

/// Removes one level of brackets around fractions, so '(1/2)+(1/2)' gets parsed as '1/2 + 1/2'.
/// Call after parsing an equation string.
/// Optionally pass an array of nodes to work on that instead of this.children.
AlgebraModel.prototype.remove_brackets = function(nodes) {
  Tree.for_each(function (n) {
    if (n.is_group('fraction') && n.parent.is_group('brackets'))
      Brackets.handle(n.parent, true);
  }, nodes || this.children);
}

AlgebraModel.prototype.process_operator = function(op, callback) {
  if (op.fixed) { if (callback) callback(false); return false; }
  if (!op.getBestMatchingAction && op.parent) op = op.parent;
  if (!op.getBestMatchingAction) {
    if (callback) callback(false);
    return false;
  }

  var actionClass = op.getBestMatchingAction();
  var action = actionClass ? actionClass.createBoundAction(this, {actor: op}) : null;
  this.performAction(action, callback);
  return action;
}

/// The AlgebraModel that resulted from the action is returned. If `null` is
/// passed as an action, a mistake event is triggered.
AlgebraModel.prototype.performAction = function(action, callback, do_in_place) {
  if (action && action.makes_no_changes) { // e.g. picking up elements
    action.doInPlace();
    return this;
  }
  if (typeof(do_in_place) === 'undefined') do_in_place = this.options.no_history;

  var self = this;
  var fn = function(action) {
    if (!action) {
      self.events.mistake(self);
      if (callback) callback(false);
      return;
    }

    if (do_in_place) {
      self.hide_nodes();
      self.changed(action);
    } else {
      action.newTree.hide_nodes();
      self.created(action);
    }
    if (callback) callback(true);
  }

  if (!action) { fn(); return null }
  if (do_in_place) action.doInPlace(fn);
  else action.run(fn);
  return action.newTree;
}

/** Performs the hideNodesAction. Will return true if something changed but
 * will not trigger a change event. */
AlgebraModel.prototype.hide_nodes = function() {
  return this.hideNodesAction.doInPlace(this);
}

/** Uses SplitHandler to split the whole alm by one step. Optional nodes parameter */
AlgebraModel.prototype.performSplitAction = function(nodes) {
  var splitter = new SplitHandler();
  splitter.split(this, nodes || this.children);
}

/** Returns an array of actions that represent where and how the passed range of nodes can be moved.
 * (A range of nodes must be nodes that are all directly connected siblings ordered
 * from left to right (which is also true for an array containing a single node)) */
AlgebraModel.prototype.getMoveActions = function(ns) {
  if (ns.length === 0) return [];
  if (ns.some(function(node) { return node.fixed })) return [];
  var actions = [];
  for (var i=0; i<this.move_actions.length; i++) {
    actions = actions.concat(this.move_actions[i].getAllAvailableActions(ns));
  }
  return actions;
}

/**
 * This function takes a flat list of nodes. It will group the consecutive siblings into lists.
 * Ex: [x1, y1, x2, y2] => [[x1, y1], [x2, y2]]
 */
AlgebraModel.groupNodeRanges = function(nodes) {
  var groupedNodes = [];
  var group = [nodes[0]];
  groupedNodes.push(group);
  for (var i = 1; i < nodes.length; i++) {
    if (nodes[i-1].rs === nodes[i]) {
      group.push(nodes[i]);
    } else {
      group = [nodes[i]];
      groupedNodes.push(group);
    }
  }
  return groupedNodes;
}

AlgebraModel.prototype.make_flat = function() {
  // This allows the free interchanging of any entities
  var ns = Tree.get_leaf_nodes(this);
  var g = new Group('flat', 0);
  g.commutative = true;
  ns.forEach(function(n) {
    if (n.hidden) return;
    n.commutative = true;
    n.associative = true;
    Tree.append(g, n);
  });
  this.children = [];
  Tree.append(this, g);
  this.changed();
}
// Copyright Erik Weitnauer 2012.
// Adapted from:
//   From Top Down Operator Precedence
//   http://javascript.crockford.com/tdop/index.html
//   Douglas Crockford
//   2010-06-26

// // Binding Powers
// var BP_EQLS    = 10;  // =
// var BP_SUM     = 20;  // +, -
// var BP_PRODUCT = 30;  // *, /
// var BP_UNARY   = 40;  // unary +, -
// var BP_POWER   = 50;  // ^

/// Returns a new AlgebraParser. Will call the `registerAtParser` method
/// of each passed argument.
var AlgebraParser = function(/*known_symbols*/) {
  var symbol_table = {};
  var token;
  var tokens;
  var token_nr;
  var scope;

  var itself = function () { return this; };

  var error = function(message, obj) {
    obj = obj || this;
    obj.name = "SyntaxError";
    obj.message = message;
    throw obj;
  }

  var Scope = function() {
    this.def = {};
  }

  Scope.prototype.find_or_define = function(tok) {
    var o = this.def[tok.value];
    if (!o || typeof o == 'function') o = symbol_table[tok.value];
    if (o && typeof o !== 'function') return o; // check !== function, because {} has e.g. 'toString'
    o = Object.create(symbol_table['(name)']);
    o.lpb = 0;
    this.def[tok.value] = o;
    return o;
  }

  /// Read and return the next token.
  /// If `id` is passed, the method will throw an error if the current token
  /// has not the same (expected) id. If `optional` is passed, the method will
  /// only advance to the next token if the current token has the same id as
  /// the passed one. In case the id differs, the method just returns without
  /// doing anything.
  var advance = function (id, optional) {
    var a, o, t, v;
    if (id && token.id !== id) {
      if (optional) return;
      else error("Expected '" + id + "'.", token);
    }
    if (token_nr >= tokens.length) {
        token = symbol_table["(end)"];
        return;
    }
    t = tokens[token_nr];
    token_nr += 1;
    v = t.value;
    a = t.type;
    if (a === "name") {
        o = scope.find_or_define(t);
    } else if (a === "operator") {
        o = symbol_table[v];
        if (!o) {
            error("Unknown operator.", t);
        }
    } else if (a === "latex") {
        o = symbol_table[v];
        if (!o) {
            error("Unknown latex command.", t);
        }
    } else if (a === "string" || a ===  "number") {
        o = symbol_table["(number)"];
        a = "number";
    } else {
        error("Unexpected token.", t);
    }
    token = Object.create(o);
    token.from  = t.from;
    token.to    = t.to;
    token.value = v;
    token.type = a;
    return token;
  };

  var regress = function(t) {
    token_nr--;
    token = t;
  }

  /// If a token is passed as second parameter, no initial advance() is called.
  var expression = function (rbp, _token) {
      var left;
      var t = _token || token;
      if (!_token) advance();
      left = t.nud();
      while (rbp < token.lbp) {
          t = token;
          advance();
          left = t.led(left);
      }
      return left;
  };

  var original_symbol = {
      nud: function () {
          error("Undefined.", this);
      },
      led: function (left) {
          error("Missing operator.", this);
      }
  };

  // it seems this function is only called to setup the symbol table, before the actual parsing!
  var symbol = function (id, bp) {
      var s = symbol_table[id];
      bp = bp || 0;
      if (s) {
          if (bp > s.lbp) {
              s.lbp = bp;
          }
      } else {
          s = Object.create(original_symbol);
          s.id = s.value = id;
          s.lbp = bp;
          symbol_table[id] = s;
      }
      return s;
  };

  symbol("(end)");

  var parse = function(source) {
    tokens = tokenize(source);
    if (tokens.length == 0) return null;
    scope = new Scope();
    token_nr = 0;
    advance();
    var e = expression(0);
    advance("(end)");
    return e;
  }

  // make the following methods public
  var core = {}
  core.parse = parse;
  core.parseExpression = expression;
  core.advance = advance;
  core.regress = regress;
  core.registerSymbol = symbol;

  // call the `registerAtParser` method of all passed arguments
  for (var i=0; i<arguments.length; i++) {
    var e = gmath.expressions[arguments[i]];
    if (e && e.registerAtParser) e.registerAtParser(core);
  }

  return core;
};

gmath.AlgebraParser = AlgebraParser;
// Copyright Erik Weitnauer 2014.

/// A natural number including 0. Negative numbers are represented by sign expressions. If passed a
/// negative number, it will return a sign expression instead.
var Num = function(value) {
  Tree.Node.call(this); // call super class constructor
  if (typeof value !== 'number') value = 0;
  if (value >= 0) this.value = value;
  else return new Sign(new Num(-value));
}

gmath.inherit(Tree.Node, Num); // set Tree.Node as our super class

Num.prototype.nodeFromPast = function(event) { return this }

/** By default, I should get my data from the entity I turned into in the next time state.
 * If I am the present, return this. If I am not, find my state's equivalent child
 * (using the action mapping), and use its value. */
Num.prototype.nodeFromFuture = function(intervention) {
  var currTimeState = Tree.get_root(this).timeState;
  if(currTimeState.children.length == 0){
    return this;
  } else {
    if(currTimeState.children[0].generatingAction.length) { //should be simplified by composition
      console.log("Because action composition is not working, previewed actions that compose naturally cannot be tracked through interventions.")
    } else {
      var futureNodes = currTimeState.children[0].generatingAction.mapNodes([this]);

      if(futureNodes.length==1) {
       this.matchFutureNode(futureNodes[0]);
       return this;
      } else { //Not fully implemented
        console.warn("not implemented yet");
        return this;
      }
    }
  }
}

Num.prototype.matchFutureNode = function(futureNode){
  var tree = Tree.get_root(this);
  var futureTree = Tree.get_root(futureNode);
  tree.numeric_value(this, futureTree.numeric_value(futureNode));
}

Num.is_num = function(term) {
  return (term instanceof Num) || (term.is_group('sign') && (term.children[1] instanceof Num));
}

Num.get_value = function(term) {
  if (!term) return NaN;
  if (term instanceof Num) return term.value;
  if (term.is_group('sign') && (term.children[1] instanceof Num)) return -term.children[1].value;
  if (term.is_group('add') && (term.children[1] instanceof Num)) return term.children[1].value;
  if (term.is_group('sub') && (term.children[1] instanceof Num)) return -term.children[1].value;
  return NaN;
}

Num.prototype.to_string = function() {
  var s = this.value.toFixed(2);
  var zeros = 0;
  for (var i=s.length-1; i>0; i--) {
    if (s[i] == '0') zeros++;
    else if (s[i] == '.') { zeros++; break }
    else break;
  }
  return s.substring(0, s.length-zeros);
}

Num.prototype.to_ascii = Num.prototype.to_string;
Num.prototype.to_latex = Num.prototype.to_string;
Num.prototype.is_group = function() {
  for (var i=0; i<arguments.length; i++) {
    if (arguments[i] === 'num') return true;
  }
  return false;
}


/// Tell the parser how to parse numbers.
Num.registerAtParser = function(parser) {
  var num = parser.registerSymbol("(number)");
  num.nud = function() {
    return new Num(this.value);
  }
}

gmath.expressions = gmath.expressions || {};
gmath.expressions.num = Num;
// Copyright Erik Weitnauer 2014.

/// A math symbol like '+', '-' or '('.
var Sym = function(value) {
	Tree.Node.call(this); // call super class constructor
  this.value = value;
}

gmath.inherit(Tree.Node, Sym); // set Tree.Node as our super class

Sym.mappings = {'-': '−', '*': '·', '/': '·', '//': ''};//∗·•×−

Sym.prototype.to_string = function() {
  if (this.parent && this.parent.is_group('sign')) return '-';
  if (this.value in Sym.mappings) return Sym.mappings[this.value];
  return this.value;
}

Sym.prototype.to_ascii = function() { return this.value }

Sym.prototype.to_latex = function() {
  if (this.value === '/') return "\\cdot "; // because *1*2/3/4 turns into \frac{1*2}{3*4}
  if (this.value === '*') return "\\cdot ";
  if (this.value === '(') return "\\left(";
  if (this.value === ')') return "\\right)";
  return this.value;
}

Sym.prototype.is_group = function() {
  for (var i=0; i<arguments.length; i++) {
    if (arguments[i] === 'sym') return true;
  }
  return false;
}

gmath.expressions = gmath.expressions || {};
gmath.expressions.sym = Sym;
// Copyright Erik Weitnauer 2014.

/// A variable like 'x' or 'y_1'.
/// If a variable has no subscript, it has no children. If a variable has a
/// subscribt, it has two children. The first is a variable without a subscript
/// and the second is any node.
var Var = function(value, subscript_node) {
  Tree.Node.call(this); // call super class constructor
  this.bp = 100;
  if (arguments.length < 2) {
    this.value = value;
    return this;
  } else if (arguments.length === 2) {
    if (value instanceof Var) this.append(value);
    else this.append(new Var(value));
    this.append(subscript_node);
    subscript_node.for_each(function(node) { node.fixed = true });
    this.children[0].fixed = true;
    this.value = this.to_ascii();
  }
  else throw "wrong number of arguments";
}

gmath.inherit(Tree.Node, Var); // set Tree.Node as our super class

Var.prototype.to_string = function() { return this.value; }
Var.prototype.to_ascii = function() {
  if (!this.has_children()) return this.value;
  var name = this.children[0].value;
  var sub = this.children[1].to_ascii();
  if (sub.length > 1) return name + '_{' + sub + '}';
  else return name + '_' + sub;
}
Var.prototype.to_latex = function() {
  if (!this.has_children()) return this.value;
  var name = this.children[0].value;
  var sub = this.children[1].to_latex();
  if (sub.length > 1) return name + '_{' + sub + '}';
  else return name + '_' + sub;
}
Var.prototype.is_group = function() {
  for (var i=0; i<arguments.length; i++) {
    if (arguments[i] === 'var') return true;
  }
  return false;
}

Var.is_var = function(term) {
    return (term instanceof Var) || (term.is_group('power') && term.children[0] instanceof Var);
}

/// Tell the parser how to parse variables.
Var.registerAtParser = function(parser) {
  var subs = parser.registerSymbol('_', 100);
  subs.led = function(left) {
    var right = parser.parseExpression(99);
    return new Var(left, right);
  }

  var symbols = { '(name)': ''
                , '\\alpha': 'α'
                , '\\Alpha': 'Α'
                , '\\beta' : 'β'
                , '\\Beta' : 'Β'
                , '\\gamma': 'γ'
                , '\\Gamma': 'Γ'
                , '\\delta' : 'δ'
                , '\\Delta': 'Δ'
                , '\\epsilon' : 'ε'
                , '\\Epsilon' : 'Ε'
                , '\\zeta': 'ζ'
                , '\\Zeta' : 'Ζ'
                , '\\eta' : 'η'
                , '\\Eta': 'Η'
                , '\\theta' : 'θ'
                , '\\Theta': 'Θ'
                , '\\iota' : 'ι'
                , '\\Iota' : 'Ι'
                , '\\kappa': 'κ'
                , '\\Kappa' : 'Κ'
                , '\\lambda': 'λ'
                , '\\Lambda' : 'Λ'
                , '\\mu' : 'μ'
                , '\\Mu' : 'Μ'
                , '\\nu': 'ν'
                , '\\Nu' : 'Ν'
                , '\\xi' : 'ξ'
                , '\\Xi': 'Ξ'
                , '\\omicron' : 'ο'
                , '\\Omicron': 'Ο'
                , '\\pi' : 'π'
                , '\\Pi' : 'Π'
                , '\\rho': 'ρ'
                , '\\Rho' : 'Ρ'
                , '\\sigma': 'σ'
                , '\\Sigma' : 'Σ'
                , '\\tau': 'τ'
                , '\\Tau' : 'Τ'
                , '\\upsilon' : 'υ'
                , '\\Upsilon': 'Υ'
                , '\\phi' : 'φ'
                , '\\Phi' : 'Φ'
                , '\\chi': 'χ'
                , '\\Chi' : 'Χ'
                , '\\psi': 'ψ'
                , '\\Psi' : 'Ψ'
                , '\\omega': 'ω'
                , '\\Omega' : 'Ω'
              };

  var nud = function() {
    if (this.type === 'name') return new Var(this.value);
    else return new Var(symbols[this.value]);
  }
  var led = function(left) {
    var right = parser.parseExpression(MulDiv.prototype.bp, this);
    return MulDiv.createProduct(left, right);
  }
  for (var str in symbols) {
    var variable = parser.registerSymbol(str, 30);
    variable.nud = nud;
    variable.led = led;
  }
}

gmath.expressions = gmath.expressions || {};
gmath.expressions.var = Var;
// Copyright Erik Weitnauer 2012.
/// In this file Num, Var and Sym types are defined.

/// Protoype for all group expressions (like sum, production, disjunction).
var Group = function(name, bp) {
  Tree.Node.call(this); // call super class constructor
  if (arguments.length > 1) this.bp = bp;
  if (arguments.length > 0) this.value = name;
}

gmath.inherit(Tree.Node, Group); // set Tree.Node as our super class

Group.prototype.to_ascii = function() {
  return this.children.map(function(c) {
    if (c.is_group() && c.commutative && !c.ls && c.associative) return c.children[1].to_ascii();
    return c.to_ascii();
  }).join("");
}
Group.prototype.to_latex = function() {
  return this.children.map(function(c) {
    if (c.is_group() && c.commutative && !c.ls && c.associative) return c.children[1].to_latex();
    return c.to_latex();
  }).join("");
}
/// Pass any number of string arguments. If passed 0 arguments, the function
/// returns always true. If passed 1 or more arguments, returns true when any
/// of the arguments is the same as the value of the node.
Group.prototype.is_group = function(name) {
  if (arguments.length === 0) return true;
  for (var i=0; i<arguments.length; i++) {
    if (this.value === arguments[i]) return true;
  }
  return false;
};

/// Will do the following things:
/// 1. Remove itself if empty.
/// 2. Call clean_up for all children, if they provide this method.
/// Returns true if any changes were made.
Group.prototype.clean_up = function() {
  if (this.children.length == 0) {
    Tree.remove(this);
    return true;
  } else {
    var changed = false;
    Tree.for_each(function (c) { if (c.clean_up) changed = c.clean_up() || changed },this.children);
    return changed;
  }
}

// var asRelation = function(name, options) {
//   this.prototype = new Group();
//   this.prototype.constructor = this;
//   this.prototype.bp = options.bp || 0;
//   this.prototype.commutative = options.commutative || false;
//   this.prototype.value = name;

//   gmath.expressions[name] = this;
// }
// Copyright Erik Weitnauer 2014.

/** Instead of this being a class to inherit from, it uses a mixin design pattern
 * to add functionality to whatever is passed as `this` to it.
 * This allows us to add 'class' methods and field to `this`, to allow accessing
 * them later without the need for instanciating the class.
 * See, e.g. sign.js, for an example how to use asOperator. */
var asOperator = function(name, options) {
  gmath.inherit(Group, this);

  // the following fields and methods are shared among all instances
  // and can be accessed as class methods / fields via this.prototype.

  this.prototype.bp = options.bp || 0;
  this.prototype.associative = options.associative || false;
  this.prototype.commutative = options.commutative || false;
  this.prototype.has_inverse = options.has_inverse || false;
  this.prototype.inverse_group_name = options.inverse_group_name;
  this.prototype.group_name = options.group_name;
  this.prototype.group_class = options.group_class || null;
  this.prototype.value = name;
  this.prototype.action_handlers = [];
  this.prototype.vertical_notation = options.vertical_notation || false;
  this.prototype.group_cleanup_name = options.group_cleanup_name;

  this.prototype.add_action_handler = function(handler) {  //David Landy: Marked for Change
    if (this.action_handlers.indexOf(handler) == -1) this.action_handlers.push(handler);
  }

  /** Returns the action among all actions that matches and has
   * the highest priority. */
  this.prototype.getBestMatchingAction = function() {
    var best_action = null;
    for (var i=0; i<this.action_handlers.length; i++) {
      var action = this.action_handlers[i];
      if (action instanceof Action) {
        if (action.match(this) && (best_action==null || action.priority > best_action.priority)) {
          best_action = action;
        }
      } else {
        console.warn("old action style not supported anymore", action);
      }
    }
    return best_action;
  }

  this.prototype.getGroupCleanupAction = function() {
    if (!this.group_cleanup_action) {
      if (!this.group_cleanup_name) return null;
      this.group_cleanup_action = new gmath.actions[this.group_cleanup_name];
    }
    return this.group_cleanup_action;
  }

  this.prototype.createGroup = function() {
    if (this.group_class) return new this.group_class();
    var group = new Group(this.group_name, this.bp);
    group.cleanupAction = this.getGroupCleanupAction();
    return group;
  }
  this.createGroup = this.prototype.createGroup;

  this.prototype.getInverse = function() {
    return this.inverse && gmath.expressions[this.inverse];
  }

  /// Utility function for commutative groups that can't be nested (like sum, product).
  /// Will replace the group with the inside of its last block.
  this.prototype.clean_up_commutative = function() {
    if (!this.ls && !this.rs) {
      var val = this.children[1];
      Tree.replace(this.parent, val);
      Brackets.handle(val);
      return true;
    }
    if (this.merge_nested_group()) return true;
  }

  /// Will join nested groups of the same type. E.g., turns add[sum[add[+,1],sub[-,2]],add[+,3]]
  /// into [add[+,1],sub[-,2],add[+,3]].
  this.prototype.merge_nested_group = function() {
    if (this.associative && this.children[1].is_group(this.group_name)) {
      // nested commutative group, remove
      var top_g = this.parent;
      var bot_g = this.children[1];
      if (Tree.get_child([1, 0, 0], this).value === Tree.get_child([0], this).value) {
        Tree.replace(Tree.get_child([1, 0, 0], this), Tree.get_child([0], this)); // reuse the operator
      }
      var idx = Tree.remove(this);
      for (var i=0; i<bot_g.children.length; i++) {
       Tree.insert(top_g, idx+i, bot_g.children[i]);
      }
      return true;
    }
  }

  gmath.expressions[name] = this;
}
// Copyright Erik Weitnauer 2012-2013.

/// Inside a brackets expression are always three children: An "(" symbol, the term, and a ")"
/// symbol.
/// Use Brackets.is_optional(term) to test whether brackets are, or would be, optional.
/// Use Brackets.handle(term) to add brackets around a term if they are needed.

var Brackets = function(term) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (term) {
    Tree.append(this, new Sym("("));
    Tree.append(this, term);
    Tree.append(this, new Sym(")"));
  }
}

asOperator.call(Brackets, 'brackets', { bp: 0 });

/// Tell the parser how to parse "(" and ")" into bracket expressions.
Brackets.registerAtParser = function (parser) {
  var lb = parser.registerSymbol("(", 30);
  lb.nud = function () {
    var e = parser.parseExpression(0);
    parser.advance('\\right', true); // optional advance
    parser.advance(')');
    return new Brackets(e);
  };
  parser.registerSymbol("\\left").nud = function() {
    parser.advance('(');
    return lb.nud();
  }
  parser.registerSymbol("\\right");
  parser.registerSymbol(")");

  parser.registerSymbol("{").nud = function() {
    var e = parser.parseExpression(0);
    parser.advance('}');
    return e;
  };

  lb.led = function(left) {
    var right = parser.parseExpression(MulDiv.prototype.bp, this);
    return MulDiv.createProduct(left, right);
  }
  parser.registerSymbol("\\left", 30).led = function(left) {
    parser.advance('(');
    return lb.led(left);
  }
  parser.registerSymbol("{");
  parser.registerSymbol("}");
}

/// Will surround the passed term with brackets if brackets are needed to ensure the correct order
/// of precedence. Vertical expressions and their children never need brackets around them. If a
/// bracket node is passed and allow_remove is passed as true, the brackets will be removed in case
/// they are optional.
Brackets.handle = function(term, allow_remove) {
  if (term.is_group('brackets')) {
    if (allow_remove && Brackets.is_optional(term)) {
      Tree.replace(term, term.children[1]);
      return true;
    }
    return false;
  }
  // if brackets are needed
  if (!Brackets.is_optional(term)) {
    // add them!
    var idx = Tree.remove(term);
    Tree.insert(term.parent, idx, new Brackets(term));
    return true;
  }
  return false;
}

/// Expects either a bracket expression or a node of any other type. In the first case it returns
/// true if the brackets may be removed without changing the meaning of the whole expression. In the
/// second case it returns true if adding brackets to the expression would not change the meaning.
/// In the special case where a sign expression contains the brackets which contains another sign
/// expression, the brackets are optional.
/// You can optionally pass an custom outer term which is then used instead of term.parent.
Brackets.is_optional = function(term, outer) {
  // special case: brackets around brackets:
  if (term.is_group('brackets') && term.children[1].is_group('brackets')) return true;

  var inner = (term instanceof Brackets) ? term.children[1] : term;
  var outer = outer || term.parent;

  // brackets around a number or literal
  if (!inner.has_children()) return true;
  // brackets are toplevel term
  if (outer instanceof AlgebraModel) return true;
  if (outer.is_group('sign') && inner.is_group('fraction')) return true;
  // the brackets contain a expression and are inside an expression
  // special case: we don't need a bracket here: -(2*3)
  //if (outer instanceof Sign && inner instanceof Product) return true;
  if (outer.bp > inner.bp) return false;
  if (outer.bp < inner.bp) return true;
  // special case: inner is sign expression and outer is sign expression, too
  if (outer instanceof Sign && inner instanceof Sign) return true;
  // we have same binding power as parent, so the brackets are only not needed if the
  // outer operation is associative and the inner group has the same type
  if (outer.associative && inner.is_group(outer.group_name)) return true;
  if (inner.commutative && outer.is_group(inner.group_name)) return true;
  // special case of a product inside a div block, allow removing of the brackets if inside a fraction
  if (inner.is_group('product') && outer.is_group('div') && outer.parent && outer.parent.is_group('fraction')) return true;
  if (inner.is_group('fraction') && outer.is_group('mul', 'div')) return true;
  return false;
}
// Copyright Erik Weitnauer 2012-2013.

/// Used to represent a single "-" infront of a term. These can be nested.
var Sign = function(term) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (term) {
    Tree.append(this, new Sym("-"));
    Tree.append(this, term);
    Brackets.handle(term);
  }
}

asOperator.call(Sign, 'sign', {
  bp: 40              // this will be the binding power of Sign.prototype.bp
 ,associative: true   // -(-a)) = --a
 ,commutative: false  // its unary
 ,inverse: 'sign'
});

/// Tell the parser how to parse "+" and "-" into sign expressions.
Sign.registerAtParser = function (parser) {
  parser.registerSymbol("+").nud = function() {
    return parser.parseExpression(Sign.prototype.bp);
  };

  parser.registerSymbol("-").nud = function() {
    var e = parser.parseExpression(Sign.prototype.bp);
    return new Sign(e);
  }
}

Sign.prototype.deconstruct = function() {
  var factors = [];
  factors.push(this);
  return factors;
}
// Copyright Erik Weitnauer 2013.

/// Mode can be 'auto', 'add' or 'sub' and determines in which mode the
/// AddSub block starts. Default value is 'auto'.
var AddSub = function(term, mode) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (term) {
    if (mode == 'add') this.value = 'add'
    else if (mode == 'sub') this.value = 'sub'
    else {
      // use a sub for a sign block and an add otherwise
      if (term.is_group('sign')) {
        this.value = 'sub';
        term = term.children[1];
      } else this.value = 'add';
    }
    this.value = this.value;
    Tree.append(this, new Sym(this.value == 'add' ? "+" : '-'));
    Tree.append(this, term);
    Brackets.handle(term);
  } else {
    this.value = (mode == 'sub') ? 'sub' : 'add';
  }
  this.associative = (this.value == 'add');

  this.nodeFromPast = function(event){ return this}
  this.nodeFromFuture = function(intervention){ return this}
}



asOperator.call(AddSub, 'add-sub', {
  group_name: 'sum'
 ,group_cleanup_name: 'SumCleanupAction'
 ,bp: 20
 ,associative: true
 ,commutative: true
 ,has_inverse: true
});

/// Changes the block from add to sub or from sub to add. This affects
/// it value and the symbol of its first child. It also affects its associative
/// property.
AddSub.prototype.invert = function() {
  if (this.value == 'add') {
    this.value = 'sub';
    if (this.children[0]) this.children[0].value = '-';
    this.associative = false;
  } else {
    this.value = 'add';
    if (this.children[0]) this.children[0].value = '+';
    this.associative = true;
  }
}

AddSub.registerAtParser = function (parser) {
  var plus = parser.registerSymbol("+", AddSub.prototype.bp);
  plus.led = function(left) {
    var right = parser.parseExpression(AddSub.prototype.bp);
    if (left.is_group('sum')) { // extend sum
      left.append(new AddSub(right, 'add'));
      return left;
    } else { // start a sum
      var sum = AddSub.prototype.createGroup();
      sum.append(new AddSub(left));
      sum.append(new AddSub(right, 'add'));
      return sum;
    }
  }

  var minus = parser.registerSymbol("-", AddSub.prototype.bp);
  minus.led = function(left) {
    var right = parser.parseExpression(AddSub.prototype.bp);
    if (left.is_group('sum')) { // extend sum
      left.append(new AddSub(right, 'sub'));
      return left;
    } else { // start a sum
      var sum = AddSub.prototype.createGroup();
      sum.append(new AddSub(left));
      sum.append(new AddSub(right, 'sub'));
      return sum;
    }
  }
}

AddSub.split = function(n, noMultiplier) {
  var num = 1, variables;
  if (n.is_group('product') && n.children.length > 1) {
    if ((n.children[0].children[1] instanceof Num ||
        n.children[0].children[1] instanceof Sign) &&
        !noMultiplier) {
      num = Num.get_value(n.children[0].children[1]);
      variables = n.children.slice(1);
    } else {
      variables = n.children.slice();
    }
  } else variables = [new MulDiv(Tree.clone(n))];
  return {num: num, variables: variables}
}

// If the second child of this AddSub is a sign group, the sign group will be removed and replaced
// with its second child; this AddSub will be inverted.
AddSub.prototype.absorbNegative = function() {
  var is_sub = this.is_group('sub');
  var sign = this.children[1];
  if (sign.is_group('sign')) {
    var contents = sign.children[1];
    sign.remove();
    contents.remove();
    this.append(contents);
    this.invert();
  }
}
var ProductFraction = function() {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
}

asOperator.call(ProductFraction, 'product', {
  bp: 30
 ,vertical_notation: false
});

/// Switches between product and fraction. Updates the value, vertical_notation
/// and removes or adds the '//' Sym node.
ProductFraction.prototype.invert = function() {
  var N = this.children.length;
  if (this.value == 'product') {
    this.value = 'fraction'
    this.vertical_notation = true;
    // add '//' block left of first div block. if there is no div block,
    // append the '//' block at the very right
    var node = this.children[N-1], i = N-1;
    while (node && node.value == 'div') { node = node.ls; i-- }
    if (!node || node.value !== '//') Tree.insert(this, i+1, new Sym('//'));
  } else {
    this.value = 'product';
    this.vertical_notation = false;
    // remove the '//' block
    if (N>0) {
      var n = this.children[0];
      while (n) {
        if (n.value == '//') Tree.remove(n);
        n = n.rs;
      }
    }
  }
}

ProductFraction.prototype.append = function(term) {
  if (this.value == 'product' && term.value == 'div') {
    this.invert();
    Tree.append(this, term);
  } else if (this.value == 'fraction' && term.value == 'mul') {
    // insert at the right place
    var pos = 0;
    while (pos < this.children.length && this.children[pos].value !== '//') pos++;
    Tree.insert(this, pos, term);
  }
  else {
    Tree.append(this, term);
  }
  return this;
}

/// Will replace a fraction or product without any blocks with 1.
/// Will turn a single mul block into the mul-blocks child.
/// Will turn a product with a div block into a fraction.
/// Will turn a fraction without a div block into a product.
/// Will add a *1 to a fraction without a mul block.
/// Returns true if anything was changed.
ProductFraction.prototype.clean_up = function() {
  var N1 = this.get_top().length, N2 = this.get_bottom().length;
  var changed = false;
  // replace a fraction or product without any blocks with 1
  if (N1 == 0 && N2 == 0) {
    Tree.replace(this, new Num(1));
    return true;
  }
  // turn a product with a div block into a fraction
  if (this.value == 'product' && N2 > 0) {
    this.invert();
    changed = true;
  }
  // turn a fraction without a div block into a product
  if (this.value == 'fraction' && N2 == 0) {
    this.invert();
    changed = true;
  }
  // add a *1 to a fraction without a mul block.
  if (this.value == 'fraction' && N1 == 0) {
    Tree.insert(this, 0, new MulDiv(new Num(1)));
    changed = true;
  }
  // turn a single mul block into the mul-blocks child
  if (N1 == 1 && N2 == 0) {
    var val = this.get_top()[0].children[1];
    Tree.replace(this, val);
    Brackets.handle(val, true);
    changed = true;
  }
  return changed;
}

ProductFraction.prototype.get_top = function() {
  var n = this.children[0], ns = [];
  while (n) { if (n.value == 'mul') ns.push(n); n = n.rs}
  return ns;
}
ProductFraction.prototype.get_bottom = function() {
  var n = this.children[0], ns = [];
  while (n) { if (n.value == 'div') ns.push(n); n = n.rs}
  return ns;
}
/** Returns the '//' node of the fraction. If there is none
 * (e.g. in a product), returns null. */
ProductFraction.prototype.get_fraction_bar = function() {
  var n = this.children[0];
  while (n) { if (n.value == '//') return n; n = n.rs}
  return null;
}

/// Returns true if n is a muldiv block in a fraction that is the only numerator
/// or denominator term in that fraction.
ProductFraction.is_lone_fraction_part = function(n) {
  if (!n.parent) return false;
  return (n.parent.is_group('fraction')
        && ((n.is_group('mul') && !n.ls && n.rs.value === '//')
          ||(n.is_group('div') && !n.rs && n.ls.value === '//')));
}

ProductFraction.prototype.group_nodes = function() {
  var n = this.children[0], top = [], bottom = [], bar;
  while (n) {
    if (n.value == 'div') bottom.push(n);
    else if (n.value == 'mul') top.push(n);
    else bar = n;
    n = n.rs
  }
  return {top: top, bottom: bottom, bar: bar};
}
ProductFraction.prototype.to_latex = function() {
  var top = this.get_top(), bottom = this.get_bottom();
  var res = (bottom.length > 0) ? "\\frac{" : "";
  for (var i=0; i<top.length; i++) {
    res += (i==0) ? top[i].children[1].to_latex() : top[i].to_latex();
  }
  if (bottom.length > 0) {
    res += "}{";
    for (var i=0; i<bottom.length; i++) {
      res += (i==0) ? bottom[i].children[1].to_latex() : bottom[i].to_latex();
    }
    res += "}";
  }
  return res;
}
ProductFraction.prototype.to_ascii = function() {
  var top = this.get_top(), bottom = this.get_bottom();
  var top_str = "", bottom_str = "";
  for (var i=0; i<top.length; i++) {
    top_str += (i==0) ? top[i].children[1].to_ascii() : top[i].to_ascii();
  }
  if (bottom.length == 0) return top_str;
  // we have a fraction
  for (var i=0; i<bottom.length; i++) {
    bottom_str += (i==0 ? "" : "*") + bottom[i].children[1].to_ascii();
  }
  if (top.length > 1) top_str = "("+top_str+")";
  if (bottom.length > 1) bottom_str = "("+bottom_str+")";
  var str = top_str + "/" + bottom_str;

  // always add brackets around a fraction in horizontal notation when its
  // inside a group of commutative operations (e.g., in a sum). There is an aesthetic
  // and a functional reason. First "(1/2)-(1/2)" looks much clearer than "1/2-1/2".
  // Second, since "-" can be parsed as negation or as subtraction, a "-1/2+1" would
  // be parsed as add(sign(1)/2),add(1) although it might have been an sub(1/2),add(1).
  // Also, put brackets around a signed fraction like -1/2 so it is -(1/2).
  if (!Brackets.is_optional(this) || this.parent.is_group('sign') || this.parent.commutative) return "(" + str + ")";
  else return str;
}
// Copyright Erik Weitnauer 2013.

/**
A product is a list of mul-blocks.
A fraction is a list of a number of mul blocks, then a '//' Sym and then a number of div blocks.
*/

/// Mode can be 'mul' or 'div' and determines in which mode the
/// MulDivDiv block starts. Default value is 'mul'.
var MulDiv = function(term, mode) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  this.value = mode == 'div' ? 'div' : 'mul';
  if (term) {
    Tree.append(this, new Sym(this.value == 'mul' ? "*" : "/"));
    Tree.append(this, term);
    Brackets.handle(term);
  }
  this.associative = (this.value == 'mul');
  this.bp = (this.value == 'mul' ? 30 : 30);
}

asOperator.call(MulDiv, 'mul-div', {
  group_class: ProductFraction
 ,group_name: 'product'
 ,inverse_group_name: 'fraction'
 ,bp: 30
 ,associative: true
 ,commutative: true
 ,has_inverse: true
});

MulDiv.createProduct = function(left, right) {
  if (left.is_group('product')) { // extend product
    left.append(new MulDiv(right));
    return left;
  } else { // start a product
    var prod = MulDiv.prototype.createGroup();
    prod.append(new MulDiv(left));
    prod.append(new MulDiv(right));
    return prod;
  }
}

/// Tell the parser how to parse "*" and "/" into products.
MulDiv.registerAtParser = function (parser) {
  // mul, ascii
  var times = parser.registerSymbol("*", MulDiv.prototype.bp);
  times.led = function(left) {
    var right = parser.parseExpression(MulDiv.prototype.bp);
    return MulDiv.createProduct(left, right);
  }
  // mul, latex
  var cdot = parser.registerSymbol('\\cdot', MulDiv.prototype.bp);
  cdot.led = times.led;
  var ltimes = parser.registerSymbol('\\times', MulDiv.prototype.bp);
  ltimes.led = times.led;

  // div, ascii
  // use bp+1 so 2*3/4 get parsed as 2*(3/4)
  var div = parser.registerSymbol("/", MulDiv.prototype.bp+1);
  div.led = function(left) {
    var right = parser.parseExpression(MulDiv.prototype.bp+1);
    if (left.is_group('fraction')) { // append new devisor
      left.append(new MulDiv(right, 'div'));
      return left;
    } else { // we need a fraction group
      var frac;
      if (left.is_group('brackets') && left.children[1].is_group('product')) {
        left = left.children[1];
      }
      if (left.is_group('product')) {
        // turn product into fraction and get rid of the brackets
        frac = left;
      } else {
        frac = MulDiv.prototype.createGroup();
        frac.append(new MulDiv(left));
      }
      if (right.is_group('brackets') && right.children[1].is_group('product')) {
        right = right.children[1];
      }
      if (right.is_group('product')) {
        var divs = right.children;
        for (var i=0; i<divs.length; i++) {
          divs[i].invert();
          frac.append(divs[i]);
        }
      } else {
        frac.append(new MulDiv(right, 'div'));
      }
      return frac;
    }
  }
  // div, latex
  var frac_nud = function() {
    var left = parser.parseExpression(MulDiv.prototype.bp+1);
    var right = parser.parseExpression(MulDiv.prototype.bp+1);
    var frac;
    if (left.is_group('product')) frac = left;
    else {
      frac = MulDiv.prototype.createGroup();
      frac.append(new MulDiv(left));
    }
    if (right.is_group('product')) {
      right.children.forEach(function(child) {
        child.invert();
        frac.append(child);
      });
    } else frac.append(new MulDiv(right, 'div'));
    return frac;
  }
  parser.registerSymbol('\\frac').nud = frac_nud;
  parser.registerSymbol('\\dfrac').nud = frac_nud;
  parser.registerSymbol('\\tfrac').nud = frac_nud;
}

MulDiv.hide_rule = {name: "hide multiplication sign between variables", disabled: false, apply: function(n) {
  if (!(n instanceof Sym) || (n.value !== "*" && n.value !== '/')) return false;
  var p = n.parent;
  if (!p || !(p.is_group('mul') || p.is_group('div'))) return false;
  if (!p.ls || p.ls.value !== p.value || !n.rs) return false;
  var ls = p.ls.children[1];
  if ((n.rs instanceof Var) || (n.rs.is_group('power') && (n.rs.children[0] instanceof Var))) {
    if (Num.is_num(ls) || (ls instanceof Var) ||
        ((ls.is_group('sign') && ls.children[1] instanceof Var))) {
      if (p.dragging) n.hide_after_drop = true;
      else n.hidden = true;
    }
  }
}};

/// Changes the block from mul to div or from div to mul. This affects
/// its value and the symbol of its first child. It also affects its associative
/// property.
MulDiv.prototype.invert = function() {
  if (this.value == 'mul') {
    this.value = 'div';
    if (this.children[0]) this.children[0].value = '/';
    this.associative = false;
    this.bp = 30;
  } else {
    this.value = 'mul';
    if (this.children[0]) this.children[0].value = '*';
    this.associative = true;
    this.bp = 30;
  }
}

/// Will replace the product with the inside of this mul block, if this is the last child left not
/// counting Sym('//') children.
/// Will get rid of a product as child (no nested products without brackets).
MulDiv.prototype.clean_up = function() {
  // if (!this.ls && !this.rs) {
  //   if (this.value == 'mul') {
  //     var val = this.children[1];
  //     Tree.replace(this.parent, val);
  //     Brackets.handle(val);
  //     return true;
  //   } else {
  //     throw "single div is not allowed!";
  //   }
  // }

  // nested product without brackets ==> merge
  if (this.children[1].is_group('product')) {
    var parent = this.parent;
    var nested = this.children[1];
    var n0 = nested.children[0];
    // for nicer animation, keep our '+' instead of the '+' of the first nested add if it was hidden
    if (n0.value == 'mul' && n0.children[0].hidden) Tree.replace(n0.children[0], this.children[0]);
    var idx = Tree.remove(this);
    for (var i=0; i<nested.children.length; i++) {
      if (this.value == 'div') nested.children[i].invert();
      Tree.insert(parent, idx+i, nested.children[i]);
    }
    return true;
  }

  this.parent.clean_up();
}
// Copyright Erik Weitnauer 2014

/** We just need this class so we can register action handlers to it. */
var Power = function(base, exponent) {
	Group.call(this); // super constructor: opt. pass name & bp just for this instance
	if (base && exponent) {
		this.append(base);
		if (exponent.is_group('exponent')) this.append(exponent);
		else this.append(new Exponent(exponent));
    Brackets.handle(base);
  }
}

asOperator.call(Power, 'power', {
  bp: 50
 ,vertical_notation: false
});
// Copyright Erik Weitnauer 2012-2014.

/// Each power expression has exactly two children, the base and the exponent.
var Exponent = function(term) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (term) {
    Tree.append(this, term);
    Brackets.handle(term);
  }
}

asOperator.call(Exponent, 'exponent', {
  group_class: Power
 ,group_name: 'power'
 ,bp: 50
 ,vertical_notation: true
});

Exponent.prototype.to_ascii = function() {
  if (this.children.length === 0) return '';
  return "^" + this.children[0].to_ascii();
}

/// Tell the parser how to parse "^ as power expressions.
Exponent.registerAtParser = function (parser) {
  parser.registerSymbol("^", Exponent.prototype.bp).led = function(left) {
    // use `bp-1` so 2^2^2 gets parsed as 2^(2^2), not (2^2)^2
    var right = parser.parseExpression(Exponent.prototype.bp-1);
    return new Power(left, right);
  }

  parser.registerSymbol("\\sqrt").nud = function() {
    var right = parser.parseExpression(Infinity); // whatever is next to us belongs to us
    var oneHalf = MulDiv.prototype.createGroup();
    oneHalf.append(new MulDiv(new Num(1)));
    oneHalf.append(new MulDiv(new Num(2), 'div'));
    var power = new Power(right, oneHalf);
    return power;
  }

  // this is so we can parse the square roots
  parser.registerSymbol("\\scriptscriptstyle").nud = function() {
    var right = parser.parseExpression(Exponent.prototype.bp);
    return right;
  }
}
// Copyright Erik Weitnauer 2013.

/// A boolean value, true or false.
var Bool = function(value) {
	Tree.Node.call(this); // super constructor
  if (value === 1 || value === "T" || value === "t" || value === true) this.value = 'T';
  else this.value = 'F';
  this.id = gmath.uid();
}

gmath.inherit(Tree.Node, Bool); // set Tree.Node as our super class

Bool.prototype.to_string = function() { return this.value; }

Bool.prototype.to_ascii = Bool.prototype.to_string;

Bool.prototype.is_group = function() { return false; }

/// Tell the parser how to parse numbers.
Bool.registerAtParser = function(parser) {
  var num = parser.registerSymbol("(number)");
  num.nud = function() {
    return new Bool(this.value);
  }
}

gmath.expressions = gmath.expressions || {};

gmath.expressions.bool = Bool;// Copyright Erik Weitnauer 2013.

var And = function(term) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (term) {
    Tree.append(this, new Sym("∧"));
    Tree.append(this, term);
    Brackets.handle(term);
  }
}

asOperator.call(And, 'and', {
  group_name: 'disjunction'
 ,group_cleanup_name: 'CommutativeGroupCleanup'
 ,bp: 30
 ,associative: true
 ,commutative: true
});

/// Tell the parser how to parse "+" into disjunctions.
And.registerAtParser = function (parser) {
  var disj = parser.registerSymbol("*", And.prototype.bp);
  disj.led = function(left) {
    var right = parser.parseExpression(And.prototype.bp);
    if (left.is_group('disjunction')) { // extend disjunction
      left.append(new And(right));
      return left;
    } else { // start a disjunction
      var c = And.prototype.createGroup();
      c.append(new And(left));
      c.append(new And(right));
      return c;
    }
  }
}
// Copyright Erik Weitnauer 2013.

var Or = function(term) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (term) {
    Tree.append(this, new Sym("∨"));
    Tree.append(this, term);
    Brackets.handle(term);
  }
}

asOperator.call(Or, 'or', {
  group_name: 'conjunction'
 ,group_cleanup_name: 'CommutativeGroupCleanup'
 ,bp: 20
 ,associative: true
 ,commutative: true
});

/// Tell the parser how to parse "+" into Conjunctions.
Or.registerAtParser = function (parser) {
  var disj = parser.registerSymbol("+", Or.prototype.bp);
  disj.led = function(left) {
    var right = parser.parseExpression(Or.prototype.bp);
    if (left.is_group('conjunction')) { // extend Conjunction
      left.append(new Or(right));
      return left;
    } else { // start a Conjunction
      var c = Or.prototype.createGroup();
      c.append(new Or(left));
      c.append(new Or(right));
      return c;
    }
  }
}
// Copyright Erik Weitnauer 2013.

var Equals = function(left, right) {
  Group.call(this); // super constructor: opt. pass name & bp just for this instance
  if (left && right) {
    Tree.append(this, left);
    Tree.append(this, new Sym("="));
    Tree.append(this, right);
  }
}

asOperator.call(Equals, 'equals', {
  bp: 10
});

Equals.registerAtParser = function (parser) {
  var eqls = parser.registerSymbol("=", Equals.prototype.bp);
  eqls.led = function(left) {
    var right = parser.parseExpression(Equals.prototype.bp);
    if (left.is_group('equals') || right.is_group('equals')) {
      throw 'Parser will not allow multiple equals in an equation.'
    }
    return new Equals(left, right);
  }
}

// Equals.prototype.getSideOfNode = function(node) {
//   return this.isOnLeftSide(node) ? this.getLeftSide() : this.getRightSide();
// }

Equals.prototype.getSideOfNode = function(node) {
  while (!(node.parent instanceof Equals))
    node = node.parent;
  return node;
}

Equals.prototype.getOppositeSideOfNode = function(node) {
  return this.isOnLeftSide(node) ? this.getRightSide() : this.getLeftSide();
}

Equals.prototype.getLeftSide = function() {
  return this.children[0];
}

Equals.prototype.getRightSide = function() {
  return this.children[2];
}

Equals.prototype.isOnLeftSide = function(node) {
  return this.getSideOfNode(node) == this.getLeftSide();
}

Equals.prototype.isOnRightSide = function(node) {
  return this.getSideOfNode(node) == this.getRightSide();
}

Equals.prototype.areOnSameSide = function(n, n2) {
  var nOnLeft = this.isOnLeftSide(n)
     ,n2OnLeft = this.isOnLeftSide(n2);
  return (nOnLeft && n2OnLeft) || (!nOnLeft && !n2OnLeft);
}
// Copyright Erik Weitnauer 2014.

/** The abstract base class for all actions.

To build an actual action based on this, follow this example:

```
/// Settings is an object that contains all the information
/// the action needs for being applied. They have to be provided
/// at construction time. Many actions just need to know the node
/// they will be applied to, their `actor`. In this case the
/// settings will look like this: {actor: node}. The example below
/// show such a case. You are also responsible for saving the
/// settings.priority inside this.priority if it is given. The priorities
/// will be used to figure out which action should be applied in a
/// situation where several actions match.
var ExampleAction = function(settings) {
	Action.call(this, "example-action-name");
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};
gmath.inherit(Action, ExampleAction);
```

You will also need to implement the methods match(), mapIndex(),
doInPlace() and updateNodesFromFutureAndPast(). For more information
about these methods, see the comments below.

To get an unbound instance of your action (which means it is not yet bound
to any settings and can be used as factory for bound actions), do

```var action = new ExampleAction();```

Whenever an action is applied, first a new action instance has to be created
with the information about where and how to apply the action. Then the `run`
or `doInPlace` method is called on that instance. The usual way to do this is
calling

```var appliedAction = action.createAndRun({actor: node}, callback);```

To avoid cloning the AlgebraModel in case you don't want to keep the history, run

```var appliedAction = action.createAndDoInPlace({actor: node}, tree, callback);```

where tree is the tree that you want to modify (in this case its usually the
same node that node is in.)
*/

gmath.actions = {};

/** Pass the name of the action (any string). */
Action = function (name) {
	this.name = name;
	this.priority = 0;
	this.node_map = {};      // maps ids of source nodes to target nodes
	this.initial_node_map = {}; // node map from previous tree to its clone before running the action
	this.touched_nodes = {}; // maps the ids of all touches source node to true
	this.new_selection = null; // array of nodes that should be reselected after the action is completed
	this.timeoutID = null;
}

/** Creates a new action instance bound to the passed tree and settings. If
 * you want to apply the action directly, use createAndRun() or
 * createAndDoInPlace() instead.
 */
Action.prototype.createBoundAction = function(tree, settings) {
	var a = new this.constructor(settings);
	a.oldTree = tree;
	a.newTree = tree;
 	return a;
}

/** This method will create a new action using the passed tree and settings
 * object. It will then call the asynchronous run method with the provided
 * callback. It returns a reference to the created action. When the callback
 * is called, the action is also passed as the first and only argument if the
 * action was successful. Otherwise false is passed to the callback.
 */
Action.prototype.createAndRun = function(tree, settings, callback) {
	var a = new this.constructor(settings);
	a.oldTree = tree;
	a.run(callback);
 	return a;
}

/** This method works like the createAndRun method, except that it will call
 * doInPlace() instead of run(). Use this method in case you don't want to
 * keep track of history and therefore don't want the tree to be cloned.
 */
Action.prototype.createAndDoInPlace = function(tree, settings, callback) {
	var a = new this.constructor(settings);
	a.oldTree = tree;
	a.newTree = tree;
	a.doInPlace(callback);
 	return a;
}

/** Helper method that allows you to skip specifying which node turned into
 * which for nodes that were not merged or copied. */
Action.prototype.initNodeMap = function() {
	this.initial_node_map = this.oldTree.children[0].get_mapping_to(this.newTree.children[0]);
	this.node_map = this.oldTree.children[0].get_mapping_to(this.newTree.children[0]);
}

/** Removes all target nodes from the node_map that were removed from the tree.
 * This is a helper method that allows you to skip specifying which nodes were
 * removed. Call after making all the changes to this.newTree.*/
Action.prototype.removeDeletedNodesFromNodeMap = function() {
	var target_nodes = this.newTree.select_all();
	var in_target_nodes = function(node) { return target_nodes.indexOf(node) !== -1 };
	for (var id in this.node_map) {
		this.node_map[id] = this.node_map[id].filter(in_target_nodes);
	}
}

/** Pass a node map object or a source node or an array of source nodes and a
 * target node / node array. */
Action.prototype.updateNodeMap = function(map_or_n1, n2) {
	if (arguments.length === 1) gmath.extend(this.node_map, map_or_n1);
	else {
		var n1 = map_or_n1;
		if (Array.isArray(n1)) {
			for (var i=0; i<n1.length; i++) {
		  	this.node_map[n1[i].id] = (Array.isArray(n2) ? n2 : [n2])
			}
		} else this.node_map[n1.id] = (Array.isArray(n2) ? n2 : [n2]);
	}
}

/**
 * Helper method that pushes each element in arr2 on arr1
 * If the element is already in arr1, the entry will be removed and re-pushed.
 */
Action.pushNew = function(arr1, arr2) {
	for (var i=0; i<arr2.length; i++) {
	  if (arr1.indexOf(arr2[i]) === -1) arr1.push(arr2[i]);
	  else {
	  	arr1.splice(arr1.indexOf(arr2[i]), 1);
	  	arr1.push(arr2[i]);
	  }
	}
}

/** Pass a node map object or a source node and a target node / node array. */
Action.prototype.extendNodeMap = function(map_or_n1, n2) {
	if (arguments.length === 2) {
		var n1 = map_or_n1;
		var n2s = (Array.isArray(n2) ? n2 : [n2]);
		if (n1.id in this.node_map) Action.pushNew(this.node_map[n1.id], n2s);
		else this.node_map[n1.id] = n2s;
		return;
	} else {
		var map = map_or_n1;
		for (var key in map) {
			if (!map.hasOwnProperty(key)) continue;
			if (key in this.node_map) Action.pushNew(this.node_map[key], map[key])
			else this.node_map[key] = map[key];
		}
	}
}

/** Pass a node or node array to get the nodes at the same path in this.newTree. */
Action.prototype.getNewTreeNode = function(node) {
	return this.getCorrespondingNodeFromTree(node, this.newTree);
}

/** Pass a node or node array to get the nodes at the same path in this.oldTree. */
Action.prototype.getOldTreeNode = function(node) {
	return this.getCorrespondingNodeFromTree(node, this.oldTree);
}

/** Returns the node or node array in tree that is or are at the same path as
 * the passed node or node array. */
Action.prototype.getCorrespondingNodeFromTree = function(node, tree) {
	var fn = function(node) { return tree.get_child(node.get_path()) }
	if (Array.isArray(node)) return node.map(fn);
	else return fn(node);
}


/** Adds node and all its descendents to this.touched_nodes */
Action.prototype.addTouchedNodes = function(node) {
	var self = this;
	node.for_each(function(n) { self.touched_nodes[n.id] = true });
}

/** Pass either a single node or an array of nodes.
 * These nodes will be selected after the current action has been completed.
 */
Action.prototype.reselectNodeAfterAction = function(nodes) {
	if (!this.new_selection) this.new_selection = [];
	if (Array.isArray(nodes)) this.new_selection = this.new_selection.concat(nodes);
	else this.new_selection.push(nodes);
}

/** Performs node.cleanupAction and updates this action accordingly. If the passed node
 * does not have a cleanupAction or the cleanup action does not match the
 * passed node, the method returns false without doing anything.
 */
Action.prototype.cleanup = function(node) {
	if (!node.cleanupAction) return false;
	if (!node.cleanupAction.match(node)) return false;
	var action = node.cleanupAction.createAndDoInPlace(this.newTree, {actor: node});
	this.compose(action);
	return action;
}

/** Calls this.cleanup for the passed node and its anchestors as long as some-
 * thing changed.
 * For this to work, each cleanup method needs to map the node that is removed
 * to what takes its place. This method will than be called on that nodes parent.
 * This is neccessary since, e.g., in prod[mul[*,brackets[sum[add[+,1]]]], mul[*,2]],
 * calling cleanup on the add block will remove the parent sum and grandparent
 * brackets, so the add block needs to be mapped to the `1` in the action.
 */
Action.prototype.cleanup_cascade = function(node) {
	var changed = false;
	for (;;) {
		var action = this.cleanup(node);
		if (!action) return changed;
		changed = true;
		var new_nodes = action.mapNodes(node);
	 	if (new_nodes.length === 0) return changed;
	  node = new_nodes[0].parent;
	}
}

/** Takes an already performed action and composes the node_map and touched_node
 * map with the current action in place. Also sets the newTree. */
Action.prototype.compose = function(action) {
	for (var id in this.node_map) {
		this.node_map[id] = action.mapNodes(this.node_map[id]);
		if (action.touched_nodes[id]) this.touched_nodes[id] = true;
	}
	this.newTree = action.newTree;
}

/** Clones the old tree before it runs doInPlace */
Action.prototype.run = function(callback) {
	this.newTree = this.oldTree.clone();
	return this.doInPlace(callback);
}

/** This method tells whether the action can be applied or not in a particular
 * situation. Usually the match function will take similar arguments as will
 * be passed in the settings object for binding the action laster.
 * This method is abstract and has to be implemented in action subclasses.
 */
Action.prototype.match = function() {
	throw "called abstract method Action.match()";
}

/** This method performs the action. It has to call the passed
 * callback function with `this` (a reference to the action) after the action
 * was successfully completed, or with `false` when it was aborted. In both
 * cases changes might have been made to the AlgebraModel.
 *
 * In case the underlying action supports synchronous calling, it may allow
 * the caller to omit the callback argument and should then return `this` or
 * `false`, depending on the success of the action.
 *
 * The method has to take care to make its changes to this.newTree. Any
 * nodes that were set in the settings before might be part of a different
 * (old) tree, so the method has to look up the corresponding nodes in the
 * new tree. Example: `var node = this.getNewTreeNode(this.actor)`
 *
 * This method is abstract and has to be implemented in action subclasses.
 */
Action.prototype.transform = function(callback) {
	throw "called abstract method Action.transform()";
}

Action.prototype.doInPlace = function(callback) {
	this.initNodeMap();
	this.transform(callback);
	this.removeDeletedNodesFromNodeMap();
}

/** Returns true for any node that has been directly influenced when
 * this action was performed. Uses the cached this.touch_nodes map that
 * is build when calling the run() method. This means only use this *after*
 * the run method was called. */
Action.prototype.wasNodeTouched = function(node) {
	return this.touched_nodes[node.id];
}

/** Pass a single node or an array of nodes from the pre-action tree and get an
 * array of nodes from the post-action tree back. These are the nodes that
 * the source nodes turned into. Uses the cached mapping in this.node_map and
 * is therefore very performant.
 */
Action.prototype.mapNodes = function(source_nodes) {
	var all_target_nodes = []
	   ,self = this;
	if (!Array.isArray(source_nodes)) source_nodes = [source_nodes];
	source_nodes.forEach(function (source_node) {
		var target_nodes = self.node_map[source_node.id] || [];
		target_nodes.forEach(function (target_node) {
		  if (all_target_nodes.indexOf(target_node) === -1) all_target_nodes.push(target_node);
		});
	});
	return all_target_nodes;
}

/** Allows to combine an array of actions into a composed action. It will keep the settings
 * of the passed actions and it will allow you to use the mapNodes() and wasNodeTouched()
 * methods. The match(), mapping(), doInPlace() and run() methods will not work so far, but
 * might get implemented later. */
Action.createComposedAction = function(actions, name) {
	var res = new Action(name);

	// builds res.node_map and res.touched_nodes based on the passed actions
	function buildNodeMap() {
		function rec_mapping(nodes, id, idx) {
			if (idx >= actions.length) return nodes;
			if (!res.touched_nodes[id]) {
				res.touched_nodes[id] = nodes.some(actions[idx].wasNodeTouched.bind(actions[idx]));
			}
			return rec_mapping(actions[idx].mapNodes(nodes), id, idx+1);
		}

		res.node_map = {};
		res.touched_nodes = {};
		for (var id in actions[0].node_map) {
			res.touched_nodes[id] = actions[0].touched_nodes[id];
			res.node_map[id] = rec_mapping(actions[0].node_map[id], id, 1);
		}
	}
	buildNodeMap();

	res.updateNodesFromFutureAndPast = function() {
		actions.forEach(function (action) { action.updateNodesFromFutureAndPast() });
	}

	return res;
};
gmath.actions.CloneAction =
(function() {

var CloneAction = function() {
  Action.call(this, "clone");
};

gmath.inherit(Action, CloneAction);

CloneAction.prototype.transform = function(callback) {
	if (typeof(callback) === 'function') callback(this);
  else return true;
}

return new CloneAction();
})();
// This action is used to perform simplifications after the user has stopped interacting with the GM expression.
// There are some actions that have an inverse.  For example, for an action that moves something 'outside' of a set of
// brackets, there is probably an action that puts something into brackets.  We want the user to be able to perform the
// inverse operation fluidly if they want.  But, if they choose to not perform the inverse, we would like those brackets
// to be removed if they are optional.
//
// Consider this case: x*(y+z) ==> drag x in ==> (x*y+x*z) ==> release mouse ==> x*y+x*z.
// This action is what removes the brackets once the mouse button is released (the end of the interaction).
// Notice that if the user had not released the mouse button, they would have been able to factor the x's out fluidly.
//
// This action is called by the finishInteraction function in the AlgebraModel class.
// There is currently no other reason to call this action.
// It is not a move action and it is not bound as an action handler to any expression types.

gmath.actions.PostInteractionSimplificationAction =
(function() {

var PostInteractionSimplificationAction = function(settings) {
	Action.call(this, 'simplify terms after interaction');
	this.priority = 0;
	if (settings) this.nodes = settings.nodes;
};

gmath.inherit(Action, PostInteractionSimplificationAction);

PostInteractionSimplificationAction.prototype.match = function(node) {
	return true;
}

PostInteractionSimplificationAction.prototype.transform = function(callback) {

	this.changed = false;
	var nodes = this.getNewTreeNode(this.nodes);

	for (var i=0; i<nodes.length; i++) {
		var n = nodes[i]
		  , p = n.parent;
		if (n.is_group('brackets')) {
			// remove unnecessary brackets
			if (Brackets.handle(n, true)) this.changed = true;
			if (this.cleanup_cascade(p)) this.changed = true;
		} else if (this.muldiv1(n) || this.addsub0(n)) {
			// remove 1's from products and 0's from sums
			var pp = p.parent;
			//this.updateNodeMap(this.nodes[i].select_all(), n.ls || n.rs); // like in id-element rule
			n.remove();
			this.cleanup(p);
			if (!AlgebraModel.is_top_most(pp)) Brackets.handle(pp, true);
			this.changed = true;
		} else if (this.exp1(n)) {
			var power = n.parent
			   ,base = power.children[0]
			   ,p = power.parent
			   ,idxForBase = power.remove();
			base.remove();
			p.insert(idxForBase, base);
			this.changed = true;
		}
	}

	if (typeof(callback) === 'function') callback(this);
	else return this.changed;
}

PostInteractionSimplificationAction.prototype.muldiv1 = function(n) {
	return n.is_group('mul', 'div')
	    && Num.is_num(n.children[1])
	    && Num.get_value(n.children[1])===1;
}

PostInteractionSimplificationAction.prototype.addsub0 = function(n) {
	return n.is_group('add', 'sub')
	    && Num.is_num(n.children[1])
	    && Num.get_value(n.children[1])===0;
}

PostInteractionSimplificationAction.prototype.exp1 = function(n) {
	return n.is_group('exponent')
			&& Num.is_num(n.children[0])
			&& Num.get_value(n.children[0])===1;
}

return new PostInteractionSimplificationAction();

})();
gmath.actions.AddSubNumbersAction =
(function() {

var AddSubNumbersAction = function(settings) {
	Action.call(this, 'add or subtract numbers');
	this.priority = 1;
  this.is_join_action = true;
	if (settings) {
		if (settings.interactionType==='drag') {
			this.interactionType = settings.interactionType;
			this.delay = 300;
      this.scaleTargetBoxX = 0.5; // TODO: use margin x instead
			this.side = 'inside';
			this.nodes = settings.nodes;
			this.target = settings.target;
		} else {
			this.interactionType = 'tap';
			this.actor = settings.actor;
		}
	}
}

gmath.inherit(Action, AddSubNumbersAction);

AddSubNumbersAction.prototype.getAllAvailableActions = function(nodes) {
	if (nodes.length > 1) return [];
	if (!nodes[0].is_group('add', 'sub')) return [];
	if (!Num.is_num(nodes[0].children[1])) return [];
	var targets = this.getOtherNumberAddendsInSum(nodes[0]);
	return this.bindActionForEachTarget(nodes, targets);
}

AddSubNumbersAction.prototype.getOtherNumberAddendsInSum = function(draggedAddend) {
	var sum = draggedAddend.parent;
	var numberAddends = sum.filter(function(addend) {
		return addend!==draggedAddend
					 && addend.is_group('add', 'sub')
					 && Num.is_num(addend.children[1]);
	});
	return numberAddends;
}

AddSubNumbersAction.prototype.bindActionForEachTarget = function(nodes, targets) {
	var actions = [];
	var root = nodes[0].get_root();
	for (var i=0; i<targets.length; i++) {
		actions.push(this.createBoundAction(root, {nodes:nodes
			                                        ,target:targets[i]
			                                        ,interactionType:'drag'}));
	}
	return actions;
}

AddSubNumbersAction.prototype.match = function(node) {
  if (!node.parent.is_group('sum')) return false;
  if (!node.ls) return false;
  var t1 = node.ls.children[1], t2 = node.children[1];
  return (Num.is_num(t1) && !(t1.is_group('sign') && t1.parent.is_group('sub'))
       && Num.is_num(t2) && !(t2.is_group('sign') && t2.parent.is_group('sub')));
}

AddSubNumbersAction.prototype.transform = function(callback) {
	if (this.interactionType==='drag') {
		this.sourceAddend = this.nodes[0];
		this.targetAddend = this.target;
	} else {
		this.sourceAddend = this.actor;
		this.targetAddend = this.actor.ls;
	}

	this.addTouchedNodes(this.sourceAddend);
	this.addTouchedNodes(this.targetAddend);

	var addend1 = this.getNewTreeNode(this.sourceAddend)
	   ,addend2 = this.getNewTreeNode(this.targetAddend)
	   ,sum = addend1.parent;

	var number1 = addend1.children[1]
	   ,number2 = addend2.children[1];

	var resultOfAddition = (addend1.is_group('sub') ? -1 : 1) * Num.get_value(number1)
											 + (addend2.is_group('sub') ? -1 : 1) * Num.get_value(number2);

	var targetIsSignGroupInAdd = (addend2.is_group('add') && addend2.children[1].is_group('sign'));

	var resultingAddend = new AddSub(new Num(resultOfAddition), (targetIsSignGroupInAdd ? 'add' : 'auto'));

	this.updateNodeMap(this.sourceAddend, resultingAddend);
	this.updateNodeMap(this.sourceAddend.children[0], resultingAddend.children[0]);
	this.updateNodeMap(this.sourceAddend.children[1].get_mapping_to(resultingAddend.children[1]));
	this.updateNodeMap(this.targetAddend, resultingAddend);
	this.updateNodeMap(this.targetAddend.children[0], resultingAddend.children[0]);
	this.updateNodeMap(this.targetAddend.children[1].get_mapping_to(resultingAddend.children[1]));

	var idxForResultingAddend = addend2.remove();
	sum.insert(idxForResultingAddend, resultingAddend);
	addend1.remove();

  this.cleanup(sum);

	if (typeof(callback) === 'function') callback(this);
  return this;
}

/** The actorlist is guaranteed to reference the old tree, at this point.
 * So t1 and t2 can come from there */
AddSubNumbersAction.prototype.updateNodesFromFutureAndPast = function() {
  // var t1 = this.actor.ls; // left addend (addsub block)
  // var t2 = this.actor;    // right addend (addsub block)
  var t1, t2;
  if (this.interactionType==='drag') {
	 	t1 = this.target
	 ,t2 = this.nodes[0];
  } else {
  	t1 = this.actor.ls
   ,t2 = this.actor;
  }
  var tree = Tree.get_root(t1);
  var t1Val = tree.numeric_value(t1);
  var t2Val = tree.numeric_value(t2);
  var action = this;
  //console.log("What? Really?)")
  /// Returns the node that is the result of adding t1 and t2. This
  /// is either an AddSub, a Sign or a Num.
  function get_sum_node(addend) {
    return action.mapNodes([addend])[0];
    // var sum_path = action.mapping([Tree.get_path(addend)])[0];
    // var future_tree = tree.timeState.children[0].mathObject;
    // return Tree.get_child(sum_path, future_tree);
  }

  /// Pass the old left value and right value and the new sum value
  /// to get the new updated values [lval, rval] back.
  /// Values are all floats.
  function attribute_changes(l, r, sum) {
    return [sum-r, r]; // A: only modify left node
    //return [l+(sum-r-l)/2, r+(sum-r-l)/2]; // B: modify by half of change
    //return [sum*l/(l+r), sum*r/(l+r)]; // broken C: modify proportionally
  }

  // intervention: {type: string, ...}
  t1.nodeFromFuture = function(intervention) {
    var sum_node = get_sum_node(this);
    var sum_val = tree.numeric_value(sum_node);
    if (intervention.type == "changeNumber") {
      tree.numeric_value(this, attribute_changes(t1Val, t2Val, sum_val)[0]);
    }
    return this;
  }

  // override the default behavior of the children of the addsub block
  // since we are already taking care of them
  t1.children[0].nodeFromFuture = function() { return this };
  t1.children[1].nodeFromFuture = function() { return this };

  // intervention: {type: string, ...}
  t2.nodeFromFuture = function(intervention) {
    var sum_node = get_sum_node(this);
    var sum_val = tree.numeric_value(sum_node);
    if (intervention.type == "changeNumber") {
      tree.numeric_value(this, attribute_changes(t1Val, t2Val, sum_val)[1]);
    }
    return this;
  }
  //console.log("No, Really?)")

  // override the default behavior of the children of the addsub block
  // since we are already taking care of them
  t2.children[0].nodeFromFuture = function() { return this };
  t2.children[1].nodeFromFuture = function() { return this };
//console.log("No, Really!")
  if(Tree.get_root(t1).timeState.children[0]){
    var node = action.mapNodes(t1)[0];
    var future_tree = tree.timeState.children[0].mathObject;

    //console.log("Are you sure?", node, future_tree)

    node.nodeFromPast = function(event){
      console.log("Tell me what you want")

      future_tree.numeric_value(this, tree.numeric_value(t1)+tree.numeric_value(t2));
      // this.value = t1.value+t2.value
    }
    if (node.children && node.children.length == 2) { // could be just a number
      node.children[0].nodeFromPast = function(event){return this}
      node.children[1].nodeFromPast = function(event){return this}
    }
  }

  return true
}

AddSub.prototype.add_action_handler(new AddSubNumbersAction());

return new AddSubNumbersAction();

})();

AlgebraModel.prototype.move_actions.push(gmath.actions.AddSubNumbersAction);
;(function() {

var SumCleanupAction = function(settings) {
  Action.call(this, 'sum cleanup action');
  if (settings) this.sum = settings.actor;
};

gmath.inherit(Action, SumCleanupAction);

gmath.actions.SumCleanupAction = SumCleanupAction;

SumCleanupAction.prototype.match = function(node) {
  return node.is_group('sum') && (node.children.length <= 1);
}

/// All cleanup actions need to be asynchronous, so the callback is optional.
SumCleanupAction.prototype.doInPlace = function(callback) {
  this.initNodeMap();
  var sum = this.getNewTreeNode(this.sum);

  if (sum.children.length === 0) {
    Tree.remove(sum);
  } else if (sum.children.length === 1) {
    var add = sum.children[0]
      , old_add = this.sum.children[0]
      , val;
    if (add.is_group('add')) {
      val = add.children[1];
      this.updateNodeMap(old_add.children[0], val);
    } else if (add.is_group('sub')) {
      if (add.children[1].is_group('product')) {
        var first_mul_arg = add.children[1].children[0].children[1] // prod, mul, arg
           ,first_mul = first_mul_arg.parent;
        first_mul_arg.remove();
        var sign = new Sign(first_mul_arg);
        first_mul.append(sign);
        val = add.children[1];
      } else {
        val = new Sign(add.children[1]);
      }
      this.updateNodeMap(old_add.children[0], val.children[0]);
    }
    // sum, add or sub, and sym turn into val node
    this.updateNodeMap(old_add, val);
    this.updateNodeMap(old_add.parent, val);
    Tree.replace(add.parent, val);

    if (val.parent && val.parent.is_group('brackets')) Brackets.handle(val.parent, true);
    else Brackets.handle(val);
  }

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

})();
// Copyright Erik Weitnauer 2014

/** This action moves terms into fractions.  It *should* handle cases like this:
3*4*((5+2)/(4+3)) -> (3*4*(5+2))/(4*3)
(1/2) * (1/2) -> 1/(2*2) or 1*(1/(2*2)), but it currently doesn't.

 */
gmath.actions.AssociateIntoFractionAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * target: a node relative to which the nodes will be moved
 * side: either 'left-of' or 'right-of', the side of the target to move the nodes to.
 */


var AssociateIntoFractionAction = function(settings) {
  Action.call(this, "associative property of multiplication--move into fraction");
  this.priority = 0;
  if (settings) {
    if (settings.actor) settings = this.getSettingsFromActor(settings.actor);
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
    if (settings.margin) this.margin = settings.margin;
  }
};

gmath.inherit(Action, AssociateIntoFractionAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
AssociateIntoFractionAction.prototype.getAllAvailableActions = function(nodes) {
  if (nodes.length === 0) return [];
  var res = []
    , n0 = nodes[0]
    , n1 = nodes[nodes.length-1]
    , parent = nodes[0].parent
    , self = this
    , root = n0.get_root()
    , self = this;
  function check(frac) {
    if (frac.is_group('mul')) frac = frac.children[1];
    if (!frac.is_group('fraction')) return;
    for (var i=0; i<frac.children.length; i++) {
      var n = frac.children[i];
      if (!n.is_group('mul')) return;
      if (self.match(nodes, n, 'left'))
        res.push(self.createBoundAction(root, {nodes: nodes, target: n, side: 'left-of'}));
      if (self.match(nodes, n, 'right'))
        res.push(self.createBoundAction(root, {nodes: nodes, target: n, side: 'right-of'}));
    }
  }
  if (n0.parent !== n1.parent) return [];
  var n = parent.children[0];
  while (n !== n0) { check(n); n = n.rs; }
  n = parent.children[parent.children.length-1];
  while (n !== n1 && n) { check(n); n = n.ls; }
  return res;
}

AssociateIntoFractionAction.prototype.getSettingsFromActor = function(actor) {
  var target, nodes, side;
  if (actor && actor.children[1] && actor.children[1].is_group('fraction')) {
    target = actor.children[1].children[0];
    nodes = [actor.ls];
    side = "left-of";
  }
  else if (actor && actor.ls && actor.ls.children[1] &&
           actor.ls.children[1].is_group("fraction")) {
    var frac = actor.ls.children[1];
    var numerator = frac.get_top();
    target = numerator[numerator.length-1];
    nodes = [actor];
    side = "right-of";
  }
  return {target: target, nodes: nodes, side: side};
}

/** Must pass the nodes to move, the target node and the side of the target
 * node to move the nodes to, unless it just passed an actor.
  See the description of the constructor for details. */
AssociateIntoFractionAction.prototype.match = function(nodes, target, side) {
  if (arguments.length == 1) { // we only got passed a single actor
    var settings = this.getSettingsFromActor(nodes);
    nodes = settings.nodes;
    target = settings.target;
    side = settings.side;
  }

  if (!nodes || nodes.length == 0) return false;
  if (!side) return false;
  if (!target || !target.is_group('mul') || !target.parent.is_group('fraction')) return false; // target must be in a mul group (numerator)
  // nodes need to have the same parent as the fraction
  if (!target.parent.parent || target.parent.parent.parent !== nodes[0].parent) return false;
  // nodes need to be mul blocks & can't contain a fraction for now
  // also the target node cannot be within one of the nodes
  if (!nodes.every(function(n) { return n.is_group('mul') && n.children[1] !== target.parent })) return false;
  if (!Tree.is_range(nodes)) return false;
  return true;
}

/** This function is synchronous, so you can also call it without providing a callback. */
AssociateIntoFractionAction.prototype.transform = function(callback) {

  // make sure we get nodes and target in the correct tree
  var is_same_tree = this.oldTree === this.newTree;
  var nodes = is_same_tree ? this.nodes : this.getNewTreeNode(this.nodes);
  var target = is_same_tree ? this.target : this.getNewTreeNode(this.target);
  var fraction = target.parent;

  var idx = fraction.children.indexOf(target);
  if (this.side === 'right-of') idx++;

  var numerator = fraction.get_top();
  if (numerator.length===1 && Num.get_value(numerator[0].children[1])===1) {
    numerator[0].remove();
    if (this.side === 'right-of') idx--;
  }

  Tree.remove_range(nodes);
  fraction.insert_range(idx, nodes);

  for (var i=0; i<nodes.length; i++) {
    nodes[i].update_x_during_dragging = true;
  }

  this.cleanup(fraction);
  this.cleanup(fraction.parent);

  if (typeof(callback) === 'function') callback(this);
  else return true;
};

MulDiv.prototype.add_action_handler(new AssociateIntoFractionAction());

return new AssociateIntoFractionAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.AssociateIntoFractionAction);
// Copyright Erik Weitnauer 2014

/** This action moves terms out of fractions.

 */
gmath.actions.AssociateOutOfFractionAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * target: a node relative to which the nodes will be moved
 * side: either 'left-of' or 'right-of', the side of the target to move the nodes to.
 */
var AssociateOutOfFractionAction = function(settings) {
  Action.call(this, "associative property of multiplication--move out of fraction");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = (Array.isArray(this.target) ? 'around' : settings.side);
    this.target_is_left = (settings.side === 'left-of');
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, AssociateOutOfFractionAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
AssociateOutOfFractionAction.prototype.getAllAvailableActions = function(nodes) {
  if (nodes.length === 0) return [];
  var n0 = nodes[0];
  if (!n0.is_group('mul') || !n0.parent.is_group('fraction')) return [];
  if (this.match(nodes, n0.parent)) {
    return [this.bindAction(nodes, 'left-of')
           ,this.bindAction(nodes, 'right-of')];
  }
  return [];
}

/// Side must be 'left-of' or 'right-of'.
AssociateOutOfFractionAction.prototype.bindAction = function(nodes, side) {
  var root = nodes[0].get_root();
  var siblings = [];
  if (this.fractionIsPartOfProduct(nodes)) {
    siblings = this.getSiblingsOfFraction(nodes, side);
  }
  return this.createBoundAction(root, {
    nodes: nodes
  , target: siblings.length>0 ? siblings : nodes[0].parent
  , side: side });
}

AssociateOutOfFractionAction.prototype.fractionIsPartOfProduct = function(nodes) {
  var fraction = nodes[0].parent;
  return fraction.parent && fraction.parent.is_group('mul');
}

/// Side must be 'left-of' or 'right-of'
AssociateOutOfFractionAction.prototype.getSiblingsOfFraction = function(nodes, side) {
  var fraction = nodes[0].parent, mul = fraction.parent, product = mul.parent;
  if (side === 'left-of')
    return product.children.slice(0, product.children.indexOf(mul));
  else
    return product.children.slice(product.children.indexOf(mul)+1);
}

/** Must pass the nodes to move, the target node and the side of the target
 * node to move the nodes to, unless it just passed an actor.
  See the description of the constructor for details. */
AssociateOutOfFractionAction.prototype.match = function(nodes, target) {
  if (nodes.length === 0) return false;
  if (!this.allNodesAreMuls(nodes) || !Tree.is_range(nodes)) return false;
  return (nodes[0] && nodes[0].parent === target && target.is_group('fraction'));
}

AssociateOutOfFractionAction.prototype.allNodesAreMuls = function(nodes) {
  for (var i=0; i<nodes.length; i++) {
    if (!nodes[i].is_group('mul')) return false;
  }
  return true;
}

/** This function is synchronous, so you can also call it without providing a callback. */
AssociateOutOfFractionAction.prototype.transform = function(callback) {

  var nodes = this.getNewTreeNode(this.nodes);

  Tree.remove_range(nodes);
  var fraction = nodes[0].parent;
  var product = new ProductFraction();
  fraction.replace_with(product);
  product.append(new MulDiv(fraction));
  product.insert_range(this.target_is_left ? 0 : 1, nodes);
  this.cleanup(fraction);
  this.cleanup(product.parent);

  for (var i=0; i<nodes.length; i++) {
    nodes[i].update_x_during_dragging = true;
  }

  if (typeof(callback) === 'function') callback(this);
  else return true;
};

return new AssociateOutOfFractionAction();
})();

AlgebraModel.prototype.move_actions.push(gmath.actions.AssociateOutOfFractionAction);
gmath.actions.AssociateOutOfDenominatorAction =
(function() {

var AssociateOutOfDenominatorAction = function(settings) {
	Action.call(this, 'associative property of division--move out of fraction denominator');
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.side = settings.side;
		if (settings.margin) this.margin = settings.margin;
	}
}

gmath.inherit(Action, AssociateOutOfDenominatorAction);

AssociateOutOfDenominatorAction.prototype.getAllAvailableActions = function(nodes) {
	var self = this;
	if (nodes.length===0) return [];
	if (!Tree.is_range(nodes)) return [];
	var fraction = nodes[0].parent
	if (!fraction.is_group('fraction')) return [];
	var numerator = fraction.get_top();
	var denominator = fraction.get_bottom();
	if ( numerator.length === 1
	  && Num.get_value(numerator[0].children[1]) === 1
	  && nodes.length===denominator.length) return [];
	if (!nodes.every(function(n) {
		return self.match(n, fraction);
	})) return [];
	return this.bindActions(nodes);
}

AssociateOutOfDenominatorAction.prototype.match = function(node, fraction) {
	if (!node.is_group('div')) return false;
	if (fraction && node.parent!==fraction) return false;
	return true;
}

AssociateOutOfDenominatorAction.prototype.bindActions = function(nodes) {
	var self = this;
	var root = nodes[0].get_root()
	   ,fraction = nodes[0].parent;

	return [this.createBoundAction(root, {nodes: nodes, side: 'left-of', target: fraction})
	       ,this.createBoundAction(root, {nodes: nodes, side: 'right-of', target: fraction})];
}

AssociateOutOfDenominatorAction.prototype.transform = function(callback) {
	this.addTouchedNodes(this.nodes[0].parent);

	if (this.side==='outside') this.target = this.nodes[0].parent;

	var divs = this.getNewTreeNode(this.nodes)
	   ,fraction = divs[0].parent
	   ,target = this.getNewTreeNode(this.target);

	Tree.remove_range(divs);

	var fractionWithDivs = this.putDivsInNewFraction(divs);

	var resultingProduct = this.replaceTargetWithProductContainingTargetAndFraction(target, fractionWithDivs);

	this.cleanupSourceFraction(fraction);
	this.cleanup(resultingProduct.parent);

	if (typeof(callback) === 'function') callback(this);
	else return this;
}

AssociateOutOfDenominatorAction.prototype.putDivsInNewFraction = function(divs) {
	var fraction = new ProductFraction();
	fraction.append(new MulDiv(new Num(1)));
	divs.forEach(function(div) {
		fraction.append(div);
	})
	return fraction;
}

AssociateOutOfDenominatorAction.prototype.replaceTargetWithProductContainingTargetAndFraction = function(target, fraction) {
	var product = new ProductFraction();
	var term = target.is_group('mul') ? target.children[1] : target;
	term.replace_with(product);
	product.append(new MulDiv(term));
	product.insert((this.side==='left-of' || this.side==='outside') ? 0 : 1, new MulDiv(fraction));
	return product;
}

AssociateOutOfDenominatorAction.prototype.cleanupSourceFraction = function(fraction) {
	var p = fraction.parent;
	this.cleanup(fraction);
	// if the fraction is replaced with a product of its numerator terms, we must cleanup the parent
	// mul to merge this product with the ancestor
	this.cleanup(p);
}

return new AssociateOutOfDenominatorAction();
})();

AlgebraModel.prototype.move_actions.push(gmath.actions.AssociateOutOfDenominatorAction);
gmath.actions.AssociateIntoDenominatorAction =
(function() {

var AssociateIntoDenominatorAction = function(settings) {
	Action.call(this, 'associative property of denominator--move into denominator');
	this.priority = 0;
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.side = settings.side;
	}
}

gmath.inherit(Action, AssociateIntoDenominatorAction);

AssociateIntoDenominatorAction.prototype.getAllAvailableActions = function(nodes) {
	var self = this;
	if (nodes.length===0) return [];
	if (!Tree.is_range(nodes)) return [];
	var fraction = nodes[0].parent;
	if (!fraction.is_group('fraction')) return [];
	if (!fraction.parent.is_group('mul')) return [];
	if (!nodes.every(function(n) {
		return self.match(n, fraction);
	})) return [];
	return this.bindActionsForAssociateIntoDenominatorAction(nodes)
}

AssociateIntoDenominatorAction.prototype.match = function(node, fraction) {
	if (!node.is_group('div')) return false;
	if (node.parent!==fraction) return false;
	return true;
}

AssociateIntoDenominatorAction.prototype.bindActionsForAssociateIntoDenominatorAction = function(nodes) {
	var actions = [];
	var root = nodes[0].get_root()
	   ,fraction = nodes[0].parent
	   ,mul = fraction.parent
	   ,prod = mul.parent;
	var siblings = prod.children.slice().filter(function(n) {return n!==mul});
	for (var i=0; i<siblings.length; i++) {
		var n = siblings[i];
		if (n.children[1].is_group('fraction')) {
			var targetDenominator = n.children[1].get_bottom();
			for (var j=0; j<targetDenominator.length; j++) {
				actions.push(this.createBoundAction(root, {nodes: nodes, target: targetDenominator[j], side: 'left-of'}));
			}
			actions.push(this.createBoundAction(root, {nodes: nodes, target: targetDenominator[targetDenominator.length-1], side: 'right-of'}));
		} else {
			actions.push(this.createBoundAction(root, {nodes: nodes, target: n.children[1], side: 'inside'}));
		}
	}
	return actions;
}

AssociateIntoDenominatorAction.prototype.transform = function(callback) {
	var self = this;
	this.nodes.map(this.addTouchedNodes.bind(self));
	this.addTouchedNodes(this.target);

	var divs = this.getNewTreeNode(this.nodes)
	   ,fraction = divs[0].parent
	   ,target = this.getNewTreeNode(this.target);

	Tree.remove_range(divs);

	this.insertDivsInNewLocation(divs, target);

	this.cleanupSourceFraction(fraction);

	if (typeof(callback) === 'function') callback(this);
	else return this;
}

AssociateIntoDenominatorAction.prototype.insertDivsInNewLocation = function(divs, target) {
	if (target.is_group('div')) {
		this.insertDivRangeIntoDenominator(divs, target);
	} else {
		this.replaceTargetWithFractionContainingTargetAndDivs(divs, target);
	}
}

AssociateIntoDenominatorAction.prototype.insertDivRangeIntoDenominator = function(divs, target) {
	var fraction = target.parent;
	fraction.insert_range(fraction.children.indexOf(target)+(this.side==='left-of' ? 0 : 1), divs);
}

AssociateIntoDenominatorAction.prototype.replaceTargetWithFractionContainingTargetAndDivs = function(divs, target) {
	var p = target.parent
	   ,newFraction = new ProductFraction();
	target.replace_with(newFraction);
	newFraction.append(new MulDiv(target));
	divs.forEach(function(n) {newFraction.append(n)});
}

AssociateIntoDenominatorAction.prototype.cleanupSourceFraction = function(fraction) {
	var mul = fraction.parent
	   ,product = mul.parent;
	this.cleanup(fraction);
	var mul_changed = this.cleanup(mul);
	if (!mul_changed && Num.is_num(mul.children[1]) && Num.get_value(mul.children[1])===1) {
		mul.remove();
		this.cleanup(product);
	}
}

return new AssociateIntoDenominatorAction();

})();

AlgebraModel.prototype.move_actions.push(gmath.actions.AssociateIntoDenominatorAction);
// Copyright Erik Weitnauer 2013.

/** Allow the following things:
		1+(2-3) ==> 1+2-3
		1-(2-3) ==> 1-2+3
*/

(function() {

var AddSubBracketsAction = function(settings) {
	Action.call(this, 'add or subtract a bracketed sum');
	if (settings) this.actor = settings.actor;
};

gmath.inherit(Action, AddSubBracketsAction);

AddSubBracketsAction.prototype.match = function(node){
	if (!node.is_group('add') && !node.is_group('sub')) return false;
	if (!node.children[1].is_group('brackets')
     || !node.children[1].children[1].is_group(node.group_name)) return false;
	return true;
}

/// This is an synchronous action and may be called without a callback.
AddSubBracketsAction.prototype.transform = function(callback){

	var node = this.getNewTreeNode(this.actor);
	var old_sign = this.actor.children[0];

  this.addTouchedNodes(this.actor);

  var br = node.children[1];
  var sum = node.children[1].children[1];
  Tree.replace(br, sum);
  if (node.is_group('sub')) {
    node.invert();
    var signs = [];
    for (var i=0; i<sum.children.length; i++) {
    	sum.children[i].invert();
    	signs.push(sum.children[i].children[0]);
    }
    this.updateNodeMap(old_sign, signs);
  }

  this.cleanup(node);

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

AddSub.prototype.add_action_handler(new AddSubBracketsAction());

})();// Copyright Erik Weitnauer 2014.

/**
 * This is a helper action that can be appended to other actions. It is
 * synchoronous. It will replace the sum with the inside of the add block, if
 * this is the last child left. It will get rid of a sum as child (no nested
 * sums without brackets).
 */

;(function() {

var AddSubCleanUp = function(settings) {
  Action.call(this, 'addsub cleanup action');
  if (settings) this.addsub = settings.actor;
};

gmath.inherit(Action, AddSubCleanUp);

AddSubCleanUp.prototype.match = function(node) {
  return (node.is_group('add', 'sub') && node.children[1].is_group('sum'));
}


AddSubCleanUp.prototype.doInPlace = function(callback) {
  this.initNodeMap();
  var node = this.getNewTreeNode(this.addsub);

  // sum in addsub without brackets?
  if (node.is_group('add', 'sub') && node.children[1].is_group('sum')) {
    var is_sub = node.is_group('sub');
    var parent = node.parent;
    var nested = node.children[1];
    var idx = Tree.remove(node);
    if (is_sub) for (var i=0; i<nested.children.length; i++) nested.children[i].invert();
    parent.insert_range(idx, nested.children);
  }

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

AddSub.prototype.cleanupAction = new AddSubCleanUp();

})();
gmath.actions.AddVariablesAction =
(function () {

var AddVariablesAction = function(settings) {
	Action.call(this, 'add variables');
	this.priority = 0;
  this.is_join_action = true;
	if (settings) {
    if (settings.interactionType==='drag') {
      this.interactionType = settings.interactionType;
      this.delay = 250;
      this.scaleTargetBoxX = 0.5;
      this.side = 'inside';
      this.nodes = settings.nodes;
      this.target = settings.target;
    } else {
      this.actor = settings.actor;
    }
  }
};

gmath.inherit(Action, AddVariablesAction);

AddVariablesAction.prototype.getAllAvailableActions = function(nodes) {
  if (nodes.length > 1) return [];

  var addend = nodes[0];
  if (!addend.is_group('add', 'sub')) return [];

  var sum = addend.parent;
  var addendStructure = this.analyzeAddendStructure(addend);
  if (addendStructure.range.length < 1) return [];
  var searchRange = this.prepareRangeForSearch(addendStructure.range)
     ,targetRanges;

  if (searchRange.length < 1) return [];

  targetRanges = Tree.filterRange(has_same_val_fn(toAscii(searchRange)), sum);
  targetRanges = targetRanges.concat(Tree.filter(addend_with_same_val(toAsciiNoLeadingOpSpecial(searchRange)), sum));

  targetRanges = targetRanges.filter(target_range_is_in_dragged_range_sum_and_is_not_dragged_range(addend));
  targetRanges = targetRanges.filter(target_range_contains_only_search_range_and_one_coefficient(searchRange));

  return this.bindActionForEachTarget(nodes, targetRanges);
}

AddVariablesAction.prototype.match = function(node) {
  if (!node.ls) return false;

  var addend = node;
  if (!addend.is_group('add', 'sub')) return false;

  var addendStructure = this.analyzeAddendStructure(addend);
  if (addendStructure.range.length < 1) return false;
  var searchRange = this.prepareRangeForSearch(addendStructure.range)
     ,targetRange;

  if (searchRange.length < 1) return false;

  targetRange = Tree.filterRange(has_same_val_fn(toAscii(searchRange)), addend.ls);
  targetRange = targetRange.concat(Tree.filter(addend_with_same_val(toAsciiNoLeadingOpSpecial(searchRange)), addend.ls));

  if (targetRange.length !== 1) return false;

  targetRange = targetRange.filter(target_range_is_in_dragged_range_sum_and_is_not_dragged_range(addend));
  targetRange = targetRange.filter(target_range_contains_only_search_range_and_one_coefficient(searchRange));

  if (targetRange.length !== 1) return false;
  return true;
}

AddVariablesAction.prototype.prepareRangeForSearch = function(variableRange) {
  if (!Array.isArray(variableRange)) return [new MulDiv(Tree.clone(variableRange))];
  else return variableRange;
}

AddVariablesAction.prototype.analyzeAddendStructure = function(node) {
	var term = node.children[1]; // add[n]
	if (Var.is_var(term) || term.is_group('brackets')) return {range: term, coefficientLocation: 'none'};
	else if (term.is_group('product')) return this.analyzeProductStructure(term);
	else return {range: []};
}

AddVariablesAction.prototype.analyzeProductStructure = function(node) {
	var coefficients = [node.children[0].children[1], node.children[node.children.length-1].children[1]];
	var coefficient;
	if (Num.is_num(coefficients[0]) && Num.is_num(coefficients[1])) return {range: []};
	else if ((!Num.is_num(coefficients[0]) && !Num.is_num(coefficients[1]))) {
		coefficient = 'none';
	} else {
		coefficient = Num.is_num(coefficients[0]) ? 'front' : 'back';
	}
	var startIDX, endIDX;
	if (coefficient==='none') {
		startIDX = 0; endIDX = node.children.length;
	} else if (coefficient==='front') {
		startIDX = 1; endIDX = node.children.length;
	} else {
		startIDX = 0; endIDX = node.children.length-1;
	}
	var range = [];
	for (var i=startIDX; i<endIDX; i++) {
		var n = node.children[i].children[1]; // product[mul[n]]
		if (Var.is_var(n) || n.is_group('brackets')) range.push(n.parent);
		else return {range: []};
	}
	return {range: range, coefficientLocation: coefficient};
}

AddVariablesAction.prototype.bindActionForEachTarget = function(nodes, targetRanges) {
  var actions = [];
  var root = nodes[0].get_root();
  for (var i=0; i<targetRanges.length; i++) {
    var settings = {};
    settings.interactionType = 'drag';
    settings.nodes = nodes;
    var range = targetRanges[i];
    if (!Array.isArray(range)) {
      settings.target = range.parent; // expr -> add
    } else {
      settings.target = range[0].parent.parent; // mul -> prod -> add
      settings.range = range;
    }
    actions.push(this.createBoundAction(root, settings));
  }
  return actions;
}

AddVariablesAction.prototype.transform = function(callback) {
	var self = this;

  if (this.interactionType==='drag') {
    this.sourceAddend = this.nodes[0];
    this.targetAddend = this.target;
  } else {
    this.sourceAddend = this.actor;
    this.targetAddend = this.actor.ls;
  }

	this.addTouchedNodes(this.sourceAddend);
  this.addTouchedNodes(this.targetAddend);

  var structure1 = this.analyzeAddendStructure(this.sourceAddend)
     ,structure2 = this.analyzeAddendStructure(this.targetAddend);

  structure1.addend = this.sourceAddend;
  structure2.addend = this.targetAddend;

  var addend1 = this.getNewTreeNode(this.sourceAddend)
     ,addend2 = this.getNewTreeNode(this.targetAddend)
     ,sum = addend1.parent;

  var product1 = addend1.children[1]
     ,product2 = addend2.children[1];

  if (structure1.coefficientLocation === 'none') {
    product1 = this.reinterpretTermAsProductWithCoefficientOfOne(product1);
  }
  if (structure2.coefficientLocation === 'none') {
    product2 = this.reinterpretTermAsProductWithCoefficientOfOne(product2);
  }

  var s1 = this.splitProduct(product1)
     ,s2 = this.splitProduct(product2);

  var sumOfCoefficients = s1.coefficient * (addend1.is_group('sub') ? -1 : 1) +
                          s2.coefficient * (addend2.is_group('sub') ? -1 : 1);

  var resultingProduct = MulDiv.prototype.createGroup();
  resultingProduct.append(new MulDiv(new Num(Math.abs(sumOfCoefficients))));
  resultingProduct.append_range(s1.variables);
  var resultingAddend = (sumOfCoefficients < 0) ? new AddSub(resultingProduct, 'sub') : new AddSub(resultingProduct, 'add');

  this.mapAddendStructureToResultingAddend(structure1, resultingAddend);
  this.mapAddendStructureToResultingAddend(structure2, resultingAddend);

  var idxForResultingAddend = addend2.remove();
  sum.insert(idxForResultingAddend, resultingAddend);
  addend1.remove();

  if (!this.interactionType) {
    if (Math.abs(sumOfCoefficients) === 1) {
      resultingProduct.children[0].remove();
      this.cleanup(resultingProduct);
    } else if (Math.abs(sumOfCoefficients) === 0) {
      Tree.replace(resultingProduct, resultingProduct.children[0].children[1]);
    }
  }
  this.cleanup(resultingAddend.parent);

  if (typeof(callback) === 'function') callback(this);
  return true;
}

AddVariablesAction.prototype.reinterpretTermAsProductWithCoefficientOfOne = function(term) {
  if (!term.is_group('product')) {
    var parent = term.parent;
    term.remove();
    var product = MulDiv.prototype.createGroup();
    product.append(new MulDiv(new Num(1)));
    product.append(new MulDiv(term));
    parent.append(product);
    return product;
  } else {
    term.insert(0, new MulDiv(new Num(1)));
    return term;
  }
}

AddVariablesAction.prototype.splitProduct = function(product) {
  var coefficientIDX = this.findIndexOfCoefficient(product);
  var coefficient, variables;
  if (coefficientIDX===0) {
    coefficient = Num.get_value(product.children[coefficientIDX].children[1]);
    variables = product.children.slice(1);
  } else {
    coefficient = Num.get_value(product.children[coefficientIDX].children[1]);
    variables = product.children.slice(0, coefficientIDX);
  }
  return {coefficient: coefficient, variables: variables};
}

AddVariablesAction.prototype.findIndexOfCoefficient = function(product) {
  var factors = product.children;
  for (var i=0; i<factors.length; i++) {
    if (Num.is_num(factors[i].children[1])) return i;
  }
}

AddVariablesAction.prototype.mapAddendStructureToResultingAddend = function(structure, addend) {
  var resultingCoefficient = addend.children[1].children[0] // add -> prod -> mul
     ,resultingVariablesRange = addend.children[1].children.slice(1);

  this.updateNodeMap(structure.addend, addend);
  this.updateNodeMap(structure.addend.children[0], addend.children[0]);

  if (structure.coefficientLocation==='front') {
    var prod = structure.addend.children[1];
    this.updateNodeMap(prod.children[0].get_mapping_to(resultingCoefficient));
  } else if (structure.coefficientLocation==='back') {
    var prod = structure.addend.children[1];
    this.updateNodeMap(prod.children[prod.children.length-1].get_mapping_to(resultingCoefficient));
  }

  if (Array.isArray(structure.range)) {
    for (var i=0; i<structure.range.length; i++) {
      this.updateNodeMap(structure.range[i].get_mapping_to(resultingVariablesRange[i]));
    }
  } else {
    this.updateNodeMap(structure.range.get_mapping_to(resultingVariablesRange[0].children[1]));
  }
}

function toAscii(ns) {
	if (ns.length === 1 && ns[0].hidden) return '';
	return ns.map(function(n) { return n.to_ascii() }).join('');
}

function isLeadingCommutativeOp(node) {
	return (node.is_group() && node.commutative && node.associative);
}

function toAsciiNoLeadingOp(ns) {
	if (ns.length === 0) return '';
	if (ns.length === 1 && ns[0].hidden) return '';
	var str = ns.map(function(n) { return n.to_ascii() }).join('');
	if (ns.length === 1) return str;
	if (isLeadingCommutativeOp(ns[0])) return str.substring(ns[0].children[0].to_ascii().length);
	return str;
}

function toAsciiNoLeadingOpSpecial(ns) {
	if (ns.length === 0) return '';
	if (ns.length === 1 && ns[0].hidden) return '';
	var str = ns.map(function(n) { return n.to_ascii() }).join('');
	if (isLeadingCommutativeOp(ns[0])) return str.substring(ns[0].children[0].to_ascii().length);
	return str;
}

function range_contains_all_siblings(ns) {
	return ns.length === ns[0].parent.children.length;
}

function is_not_root(n) {
	return n.parent;
}

function has_same_val_fn(val) {
  return function(ns) {
  	if (ns.length === 0) return false;
  	if (!ns[0].parent) return false;
  	if (is_not_root(ns[0].parent) && range_contains_all_siblings(ns)) return false;
  	return (toAscii(ns) === val || toAsciiNoLeadingOp(ns) === val);
  }
}

function addend_with_same_val(val) {
	return function(n) {
		if (!n.parent) return false;
		if (!n.parent.is_group('add') && !n.parent.is_group('sub')) return false;
		return n.to_ascii()===val;
	}
}

function target_range_is_in_dragged_range_sum_and_is_not_dragged_range(draggedAddend) {
  var sum = draggedAddend.parent;
  return function(targetRange) {
    var targetSum
       ,targetAddend;
    try {
      if (Array.isArray(targetRange)) {
        targetSum = Tree.get_parent(3, targetRange[0]);
        targetAddend = Tree.get_parent(2, targetRange[0]);
      } else {
        targetSum = Tree.get_parent(2, targetRange);
        targetAddend = Tree.get_parent(1, targetRange);
      }
      if (!sum.is_group('sum') || !targetSum.is_group('sum') || sum!==targetSum || targetAddend===draggedAddend) return false;
    } catch (err) {
      if (err==='invalid path') return false;
      throw err;
    }
    return true;
  }
}

function target_range_contains_only_search_range_and_one_coefficient(searchRange) {
  return function(targetRange) {
    if (!Array.isArray(targetRange)) return true;
    var targetRangeProduct = targetRange[0].parent;
    if (targetRangeProduct.children.length!==targetRange.length+1) return false;
    for (var i=0; i<targetRangeProduct.children.length; i++) {
      var n = targetRangeProduct.children[i];
      if (targetRange.indexOf(n)===-1 && !Num.is_num(n.children[1])) return false;
    }
    return true;
  }
}

AddSub.prototype.add_action_handler(new AddVariablesAction());

return new AddVariablesAction();

})();

AlgebraModel.prototype.move_actions.push(gmath.actions.AddVariablesAction);
// Copyright Erik Weitnauer 2013.

(function () {

var AddNegativeAction = function(settings) {
	Action.call(this, 'rearrange signs');
	if (settings) this.actor = settings.actor;
};

gmath.inherit(Action, AddNegativeAction);

AddNegativeAction.prototype.match = function(node) {
	var c = node.children[1];
  if (c.is_group('sign')) return true;
  // if (c.is_group('brackets') && c.children[1].is_group('sign')) return true;
  // if (c.is_group('brackets') && !c.children[1].is_group()) return true;
  return false;
}

AddNegativeAction.prototype.transform = function(callback) {

	// we might not work on the same tree this.actor is in
	var node = this.getNewTreeNode(this.actor);
	var old_sign = this.actor.children[1].children[0];

	this.addTouchedNodes(this.actor.children[0]);
	this.addTouchedNodes(old_sign);

	var sign_group = node.children[1];
  node.invert();
  this.updateNodeMap(old_sign, node.children[0]);
  Tree.replace(sign_group, sign_group.children[1]);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

AddSub.prototype.add_action_handler(new AddNegativeAction());

})();// Copyright Erik Weitnauer 2013.

(function () {

var PlusMinusProductToMinusProductAction = function(settings) {
  Action.call(this, 'x+-y*z=x-y*z');
  if (settings) {
    this.actor = settings.actor;
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, PlusMinusProductToMinusProductAction);

PlusMinusProductToMinusProductAction.prototype.match = function(node){
  if (!node.children[1].is_group('product')) return false;
  var first_factor = node.children[1].children[0].children[1];
  if (!first_factor.is_group('sign')) return false;
  return true
}

PlusMinusProductToMinusProductAction.prototype.transform = function(callback) {

  // we might not work on the same tree this.actor is in
  var node = this.getNewTreeNode(this.actor);
  var first_factor = node.children[1].children[0].children[1];
  var old_sign = this.getOldTreeNode(first_factor.children[0]);

  this.addTouchedNodes(this.actor.children[0]);
  this.addTouchedNodes(old_sign);

  this.updateNodeMap(old_sign, node.children[0]); // map sign on plus
  Tree.replace(first_factor, first_factor.children[1]);
  node.invert();

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

AddSub.prototype.add_action_handler(new PlusMinusProductToMinusProductAction());

})();
// Copyright Erik Weitnauer 2014.

RemoveBracketsAction =
(function() {

var RemoveBracketsAction = function(settings) {
	Action.call(this, 'remove optional brackets');
  this.priority = 4;
	if (settings) {
		this.actor = settings.actor;
	}
};

gmath.inherit(Action, RemoveBracketsAction);

RemoveBracketsAction.prototype.match = function(node){
  return (node.is_group('brackets') && Brackets.is_optional(node));
}

RemoveBracketsAction.prototype.transform = function(callback){

  // we might not work on the same tree this.actor is in
  var node = this.getNewTreeNode(this.actor);

  this.addTouchedNodes(this.actor.children[0]);
  this.addTouchedNodes(this.actor.children[2]);

  var n = Tree.replace(node, node.children[1]);

  this.cleanup(n.parent);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

var rba = new RemoveBracketsAction();
Brackets.prototype.add_action_handler(rba);

return rba;
})();
gmath.actions.editLineAction =
(function() {

var editLineAction = function(settings) {
  Action.call(this, 'rewrite dl line');
  if (settings) {
    this.actor = settings.actor;
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, editLineAction);

editLineAction.prototype.match = function() {
  return (typeof(Keyboard) !== 'undefined' && Keyboard !== null);
}

editLineAction.prototype.removeAllNodesFromNodeMap = function() {
  var target_nodes = this.newTree.select_all();
  for (var id in this.node_map) {
    this.node_map[id] = [];
  }
}

editLineAction.prototype.transform = function(callback) {

  var op_str;
  var keyboard = Keyboard();
  keyboard
    .caption('What do you want to change in this line?')
    .on('done', enteredExpression)
    .on('cancel', kbCancelled)
    ();

  var self = this;

  function enteredExpression(latex) {
    var model = self.newTree;
    var expression = model.parse(latex, true);
    if (!expression) return;
    model.children[0].remove();
    model.append(expression);
    keyboard.visible(false);
    keyboard.on('done', null).on('cancel', null);
    self.removeAllNodesFromNodeMap();
    callback(self);
  }

  function kbCancelled() {
    console.log('cancelled');
    keyboard.visible(false);
    keyboard.on('done', null).on('cancel', null);
    callback(false);
  }

  // show the keyboard so the user can choose what to add
  keyboard.latex(self.newTree.to_latex()).visible(true);
}

return new editLineAction();
})();gmath.actions.DirectFactoringAction =

(function() {

var DirectFactoringAction = function(settings) {
	Action.call(this, "direct factor");
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.side = 'inside';
		this.placement = settings.placement; // not sure if needed yet
		this.priority = settings.priority || 0;
		this.delay = 300;
    this.scaleTargetBoxX = 0.5; // TODO: use margin x instead
	}
};

gmath.inherit(Action, DirectFactoringAction);

DirectFactoringAction.prototype.getAllAvailableActions = function(nodes) {
	var res = [];
	var filtered = nodes.filter(function(n) {return n.is_group()});
	if (nodes.length===0 || filtered.length===0) return res;
	var tree = nodes[0].get_root();
	var nodesRange
	   ,ranges;
	var prevFracState;
	if (this.nodesAreAFractionResultingFromAPreviousFactoringAction(nodes)) {
		nodesRange = nodes[0].children[1].get_bottom();
		prevFracState = true;
	} else if (this.nodesArePartOfAProductWithinASum(nodes)) {
		if (!Tree.is_range(nodes)) return res;
		nodesRange = nodes;
	} else if (this.nodesAreASingleAddend(nodes)) {
		nodesRange = this.getEntireRangeFromAddend(nodes);
		if (nodesRange.length===1) nodesRange = this.temporarilyReinterpretRangeAsMulDiv(nodesRange);
	} else {
		return res;
	}
	ranges = tree.filterRange(has_same_val_fn(toAscii(nodesRange)));
	ranges = ranges.concat(tree.filter(addend_with_same_val(toAsciiNoLeadingOpSpecial(nodesRange))));
	ranges = ranges.filter(range_is_not_dragged_nodes(nodes));
	ranges = ranges.filter(range_is_not_in_same_product_as_dragged_nodes(nodes));

	res = res.concat(this.bindActionsFromRanges(nodes, ranges));

	if (prevFracState) {
		this.useFractionsInsteadOfDenominatorsAsTargets(res);
	}

	return res;
}

/**
 * This check is a result of wanting to be able to continue factoring in cases with multiple fractions.
 * For example, 2/x+3/x+4/x.  If we factor the first x with the second x, we get this: (2+3)*(1/x)+4/x.
 * Well, now we are dragging a fraction in a mul, *(1/x), and we want it to match the /x in 4/x.  This check
 * allows that to happen.
 * Because the retained nodes in the transformation are the dragged ones, this just works without needing to
 * introduce more cases in the transformation.
 */
DirectFactoringAction.prototype.nodesAreAFractionResultingFromAPreviousFactoringAction = function(nodes) {
	if (!nodes[0].is_group('mul')) return false;

	var frac = nodes[0].children[1];
	if (!frac.is_group('fraction')) return false;
	var top = frac.get_top();
	if (top.length!==1 || !Num.get_value(top[0].children[1])===1) return false;

	var prod = nodes[0].parent;
	if (prod.children.length!==2) return false;
	var brackets = prod.children[prod.children.indexOf(nodes[0])===0 ? 1 : 0].children[1];
	if (!brackets.children[1] || !brackets.children[1].is_group('sum')) return false;

	return true;
}

/**
 * The structure can be either mul/div->prod/frac->add->sum or mul/div->frac->mul->prod->add->sum.
 */
DirectFactoringAction.prototype.nodesArePartOfAProductWithinASum = function(nodes) {
	var n = nodes[0];
	if (n.parent && n.parent.is_group('fraction') && n.parent.parent.is_group('mul')) n = n.parent.parent;
	var mul = n;
	if (!mul.parent) return false;
	var product = mul.parent;
	if (!product.parent) return false;
	var add = product.parent;
	if (!add.parent) return false;
	var sum = add.parent;

	return (mul.is_group('mul', 'div')
		      && product.is_group('product', 'fraction')
		      && (add.is_group('add') || add.is_group('sub'))
		      && sum.is_group('sum'));
}

DirectFactoringAction.prototype.bindActionsFromRanges = function(nodes, ranges) {
	var tree = nodes[0].get_root();
	var res = [];
	for (var i=0; i<ranges.length; i++) {
		res.push(this.createBoundAction(tree, {nodes: nodes, target: ranges[i]}));
	}
	return res;
}

/**
 * If we have an expression like x+x, we want to be able to factor the x's.
 */
DirectFactoringAction.prototype.nodesAreASingleAddend = function(nodes) {
	if (nodes.length!==1) return false;
	return nodes[0].is_group('add') || nodes[0].is_group('sub');
}

DirectFactoringAction.prototype.getEntireRangeFromAddend = function(nodes) {
	var addend = nodes[0]
	   ,contents = addend.children[1];
	var range;
	if (contents.is_group('product')) {
		range = contents.children;
	} else {
		range = [contents];
	}
	return range;
}

// If we are doing this interaction:
// 2/x+3/x+4/x,
// and we factor the first group to make this:
// (2+3)*(1/x)+4/x.
// We are dragging the *(1/x), and want this to match the /x in 4/x.
// We want the target to be the whole fraction, for user convenience.
// But, I don't want to complicate the transform function.
// So, if the target is the entire denominator, and we are in this special
// state as previously determined when finding targets, we change the target
// to be the whole fraction, including any parent group of that fraction.
// In the transform function we detect this change and revert the target back to
// being the denominator.
DirectFactoringAction.prototype.useFractionsInsteadOfDenominatorsAsTargets = function(actions) {
	for (var i=0; i<actions.length; i++) {
	  var a = actions[i];
	  if (a.target.length===a.target[0].parent.get_bottom().length) {
	  	a.target = a.target[0].parent.parent; // div->frac->mul/add
	  	a.prevFracState = true
	  }
	}
}

/**
 * We do this to match addends with other terms that may be in a product, for example x+x*y.
 */
DirectFactoringAction.prototype.temporarilyReinterpretRangeAsMulDiv = function(range) {
	return [new MulDiv(Tree.clone(range[0]))];
}

DirectFactoringAction.prototype.transform = function(callback) {
	var self = this;

	if (this.prevFracState) {
		this.target = this.target.children[1].get_bottom().slice();
	}

	var old_target_range = Array.isArray(this.target) ? this.target : [this.target]
	   ,old_nodes_range = this.nodes;

	var new_target_range = this.getNewTreeNode(old_target_range)
	   ,new_nodes_range = this.getNewTreeNode(old_nodes_range);

	if (this.prevFracState) {
		for (var i=0; i<new_target_range; i++) {

		}
	}

	if (nodesHaveNoCoefficient(new_nodes_range)) {
		new_nodes_range = reinterpretNodesToHaveCoefficientOfOne(new_nodes_range);
	}
	if (nodesHaveNoCoefficient(new_target_range)) {
		new_target_range = reinterpretNodesToHaveCoefficientOfOne(new_target_range);
	}

	var nodesStructure = analyzeStructure(new_nodes_range)
	   ,targetStructure = analyzeStructure(new_target_range);
	nodesStructure.left_of_target = nodesStructure.idxOfAddendInSum < targetStructure.idxOfAddendInSum;

	if (!nodesProductIsInMidFactoring(nodesStructure)) {
		nodesStructure = reinterpretNodesStructureForFactoring(nodesStructure);
	} else {
		nodesStructure.addend.remove();
		nodesStructure.sumOfCoefficients = nodesStructure.left_of_target ? // prod->mul->br->sum
			nodesStructure.product.children[0].children[1].children[1] : nodesStructure.product.children[nodesStructure.product.children.length-1].children[1].children[1];
	}

	reinterpretTargetStructureForMergingWithNodes(targetStructure);
	insertTargetCoefficientsIntoCoefficientsSum(targetStructure, nodesStructure);

	targetStructure.sum
		.insert(nodesStructure.left_of_target ? targetStructure.idxOfAddendInSum-1 : targetStructure.idxOfAddendInSum, nodesStructure.addend);

	mapTargetRangeToNodesRange(old_target_range, new_nodes_range);

	cleanupTermsInCoefficientsSum(nodesStructure);
	cleanupTermsInProductOfCoefficentsSumAndVariables(nodesStructure);

	this.cleanup_cascade(targetStructure.sum);

	var variables = reselectVariables(nodesStructure);
	setXPositionOfNodesToBeAbsolute(variables);

	if (typeof(callback) === 'function') callback(this);
  else return true;


	function nodesHaveNoCoefficient(nodes) {
  	var node = nodes[0];
  	return node.is_group('add') || node.is_group('sub') || node.parent.is_group('add') || node.parent.is_group('sub');
  }

  /**
   * To help prevent complexity later in the transformation, we exclude cases where we are dragging a single
   * addend (no coefficients).  Everything that didn't have a coefficient now is in a product with a coefficient
   * of one, so that one can be used later in the sum of coefficients.
   */
  function reinterpretNodesToHaveCoefficientOfOne(nodes) {
  	var nodes_are_target = nodes[0].parent.is_group('add') || nodes[0].parent.is_group('sub');
  	var addend = nodes_are_target ? nodes[0].parent : nodes[0]
  	   ,contents = addend.children[1];
  	contents.remove();
  	var product = MulDiv.prototype.createGroup();
  	product.append(new MulDiv(new Num(1)));
  	product.append(new MulDiv(contents));
  	addend.append(product);
  	self.cleanup(product);
  	self.cleanup(product.children[1]);
  	self.updateNodeMap(self.getOldTreeNode(addend), product.children.slice(1))
  	return product.children.slice(1);
  }

  /**
   * Collect references to all the relevent nodes needed in the transformation.
   */
  function analyzeStructure(nodes) {
  	var structure = {};
  	structure.range = nodes;

  	var n = nodes[0];
  	if (n.parent.is_group('product')) {
  		structure.product = n.parent;
  		structure.addend = structure.product.parent;
  	} else if (n.parent.is_group('fraction')) {
  		structure.fraction = n.parent;
  		if (structure.fraction.parent.is_group('mul')) {
  			structure.product = structure.fraction.parent.parent;
  			structure.addend = structure.product.parent;
  		} else {
  			structure.addend = structure.fraction.parent;
  		}
  	} else {
  		throw "Can't identify structure for direct factoring.";
  	}

  	structure.sum = structure.addend.parent;
  	structure.idxOfAddendInSum = structure.sum.children.indexOf(structure.addend);

  	return structure;
  }

  /**
   * If something is in a 'mid-factoring' state, it is almost guaranteed that we have multiple terms that can
   * be factored, and at this point we have already factored one thing and intend to factor the next.
   * For example, 2*x+3*x+4*x.  If we factor the x from the first two terms we have (2+3)*x+4*x.  So, if we
   * have already performed one factoring action, the product our dragged nodes belong to consists of only the
   * dragged nodes and a bracket group with a sum in it.
   */
	function nodesProductIsInMidFactoring(structure) {
		if (structure.fraction) return false;
		if (!structure.product.children[0].children[1].is_group('brackets') && !structure.product.children[structure.product.children.length-1].children[1].is_group('brackets')) return false;
		if (structure.product.children.length-1!==structure.range.length) return false;
		return true;
	}

	/**
	 * If something is not in that mid-factoring, we convert it to that state.
	 * So, we separate the coefficients from the dragged variables, put the coefficients into a brackets->sum
	 * structure, and put that in a product with all the dragged nodes.  The sum will have one child, but that's
	 * ok because we'll put the target's coefficients in there later.
	 */
	function reinterpretNodesStructureForFactoring(structure) {
		extractRangeFromStructure(structure);
		var newStructure = rearrangeStructure(structure);
		return newStructure;
	}

	function extractRangeFromStructure(structure) {
		var range = structure.range;
		for (var i=0; i<range.length; i++) {
			range[i].remove();
		}
	}

	function rearrangeStructure(structure) {
		var productForRange = MulDiv.prototype.createGroup();
		appendRangeToNode(productForRange, structure.range);

		cleanupProductOfCoefficients(structure);
		var sumOfCoefficients = AddSub.prototype.createGroup();
		structure.addend.remove();
		sumOfCoefficients.append(structure.addend);
		var bracketsForSumOfCoefficients = new Brackets(sumOfCoefficients);

		var productForCoefficentsSumAndVariables = MulDiv.prototype.createGroup();
		if (structure.left_of_target) {
			productForCoefficentsSumAndVariables.append(new MulDiv(bracketsForSumOfCoefficients));
			productForCoefficentsSumAndVariables.append(new MulDiv(productForRange));
		} else {
			productForCoefficentsSumAndVariables.append(new MulDiv(productForRange));
			productForCoefficentsSumAndVariables.append(new MulDiv(bracketsForSumOfCoefficients));
		}

		var addendForCompletedProduct = new AddSub(productForCoefficentsSumAndVariables);

		var rearrangedStructure = {};
		rearrangedStructure.addend = addendForCompletedProduct;
		rearrangedStructure.product = productForCoefficentsSumAndVariables;
		rearrangedStructure.sumOfCoefficients = sumOfCoefficients;
		rearrangedStructure.left_of_target = structure.left_of_target;
		return rearrangedStructure;
	}

	// This is made with the intention that the node is a product, and the range is a list of muldivs.
	// We append each separately to use the productFraction class's append function (if the muldiv is a div, the product will be converted into a fraction).
	function appendRangeToNode(node, range) {
		for (var i=0; i<range.length; i++) {
			node.append(range[i]);
			range[i].update_x_during_dragging = true;
			range[i].update_y_during_dragging = true;
		}
		return node;
	}

	// If the structure contains a fraction, the range was extracted from there, and it must be cleaned up.
	// There may or may not a product, as well.  The product may have only one child, and so we should clean that up to.
	// Because these nodes are still descendents of the stored addend, it doesn't matter what happens to them.
	// We'll be using that addend in the sum of coefficients, and we have our range stored independently.
	function cleanupProductOfCoefficients(structure) {
		var n
		   ,n_changed;
		if (structure.fraction) {
			n = structure.fraction.parent;
			self.cleanup(structure.fraction);
			if (n.is_group('mul') && Num.get_value(n.children[1])===1) {
				n.remove();
				n_changed = true;
			}
		}
		if (structure.product) {
			if (n && !n_changed) self.cleanup(n);
			self.cleanup(structure.product);
		}
	}

	/**
	 * We discard the target's variables, because we only want the coefficients.
	 */
	function reinterpretTargetStructureForMergingWithNodes(structure) {
		structure.addend.remove();
		extractRangeFromStructure(structure);
	}

	function insertTargetCoefficientsIntoCoefficientsSum(targetStructure, nodesStructure) {
		if (nodesStructure.left_of_target)
			nodesStructure.sumOfCoefficients.append(targetStructure.addend);
		else
			nodesStructure.sumOfCoefficients.insert(0, targetStructure.addend);
	}

	function mapTargetRangeToNodesRange(old_target_range, new_nodes_range) {
		if (old_target_range.length>1 && new_nodes_range.length===1 || old_target_range[0].is_group('div')) {
			for (var i=0; i<old_target_range.length; i++) {
				self.updateNodeMap(old_target_range[i], new_nodes_range[0]);
				self.updateNodeMap(old_target_range[i].children[0], new_nodes_range[0].children[0]);
			}
		} else {
			for (var i=0; i<old_target_range.length; i++) {
				if (!old_target_range[i].is_group('mul') && new_nodes_range[i].is_group('mul'))
					self.updateNodeMap(old_target_range[i].get_mapping_to(new_nodes_range[i].children[1]));
				else
					self.updateNodeMap(old_target_range[i].get_mapping_to(new_nodes_range[i]));
			}
		}
	}

	function cleanupTermsInCoefficientsSum(structure) {
		var sum = structure.sumOfCoefficients;
		for (var i=0; i<sum.children.length; i++) {  // cleanup any single-child products
			var term = sum.children[i].children[1];
			self.cleanup(term);
		}
		for (var i=0; i<sum.children.length; i++) {
			var term = sum.children[i]; // cleanup any nested sums
			Brackets.handle(term);
			self.cleanup(term);
		}
	}

	function cleanupTermsInProductOfCoefficentsSumAndVariables(structure) {
		var prod = structure.product;
		for (var i=0; i<prod.children.length; i++) {
			self.cleanup(prod.children[i].children[1]);  // cleanup any single term products, etc.
		}
		for (var i=0; i<prod.children.length; i++) {
			self.cleanup(prod.children[i]);  // cleanup nested products
		}
	}

	/**
	 * The reselection just got trickier because we have things like denominators turning into muls containing
	 * fractions, etc.
	 */
	function reselectVariables(structure) {
		var variables;
		var idxOfCoefficientsSum = structure.product.children.indexOf(structure.sumOfCoefficients.parent.parent); // sum->br->mul
		if (idxOfCoefficientsSum===0) {
			variables = structure.product.children.slice(1);
		} else {
			variables = structure.product.children.slice(0, structure.product.children.length-1);
		}

		self.reselectNodeAfterAction(variables);
		return variables;
	}

	function setXPositionOfNodesToBeAbsolute(new_nodes_range) {
		for (var i=0; i<new_nodes_range.length; i++) {
		 	new_nodes_range[i].update_x_during_dragging = true;
		}
	}
}

function toAscii(ns) {
	if (ns.length === 1 && ns[0].hidden) return '';
	return ns.map(function(n) { return n.to_ascii() }).join('');
}

function isLeadingCommutativeOp(node) {
	return (node.is_group() && node.commutative && node.associative);
}

function toAsciiNoLeadingOp(ns) {
	if (ns.length === 0) return '';
	if (ns.length === 1 && ns[0].hidden) return '';
	var str = ns.map(function(n) { return n.to_ascii() }).join('');
	if (ns.length === 1) return str;
	if (isLeadingCommutativeOp(ns[0])) return str.substring(ns[0].children[0].to_ascii().length);
	return str;
}

function toAsciiNoLeadingOpSpecial(ns) {
	if (ns.length === 0) return '';
	if (ns.length === 1 && ns[0].hidden) return '';
	var str = ns.map(function(n) { return n.to_ascii() }).join('');
	if (isLeadingCommutativeOp(ns[0])) return str.substring(ns[0].children[0].to_ascii().length);
	return str;
}

function range_contains_all_siblings(ns) {
	return ns.length === ns[0].parent.children.length;
}

function is_not_root(n) {
	return n.parent;
}

function has_same_val_fn(val) {
  return function(ns) {
  	if (ns.length === 0) return false;
  	if (!ns[0].parent) return false;
  	if (is_not_root(ns[0].parent) && range_contains_all_siblings(ns)) return false;
  	return (toAscii(ns) === val || toAsciiNoLeadingOp(ns) === val);
  }
}

function addend_with_same_val(val) {
	return function(n) {
		if (!n.parent) return false;
		if (!n.parent.is_group('add') && !n.parent.is_group('sub')) return false;
		return n.to_ascii()===val;
	}
}

// function perform_range_checks(nodes) {
// 	return function(range) {
// 		if (nodes[0].is_group('add') || nodes[0].is_group('sub'))
// 			return nodes[0].children[1]!==range;
// 		return nodes[0]!==range[0];
// 	}
// }

function range_is_not_dragged_nodes(nodes) {
	return function(range) {
		if (nodes[0].is_group('add') || nodes[0].is_group('sub'))
			return nodes[0].children[1]!==range;
		for (var i=0; i<range.length; i++) {
			for (var j=0; j<nodes.length; j++) {
				if (range[i]===nodes[j]) return false;
			}
		}
		return true;
	}
}

function range_is_not_in_same_product_as_dragged_nodes(nodes) {
	return function(range) {

		try {
			var nodesProd
			   ,nodesSum;
			if (nodes[0].is_group('mul') || nodes[0].is_group('div')) {
				var n = nodes[0];
				if (n.parent.is_group('fraction') && n.parent.parent.is_group('mul')) n = n.parent.parent;
				nodesProd = Tree.get_parent(1, n);
				nodesSum = Tree.get_parent(2, nodesProd);
			} else if (nodes[0].is_group('add') || nodes[0].is_group('sub')) {
				nodesProd = null;
				nodesSum = Tree.get_parent(1, nodes[0]);
			} else {
				return false;
			}

			var rangeProd
			   ,rangeSum;
			var r = Array.isArray(range) ? range[0] : range;
			if (r.is_group('mul') || r.is_group('div')) {
				if (r.parent.is_group('fraction') && r.parent.parent.is_group('mul')) r = r.parent.parent;
				rangeProd = Tree.get_parent(1, r);
				rangeSum = Tree.get_parent(2, rangeProd);
			} else {
				rangeProd = null;
				rangeSum = Tree.get_parent(2, r);
			}

			if (nodesProd && rangeProd && nodesProd===rangeProd) {
				return false;
			}

			if (nodesSum!==rangeSum) {
				return false;
			}

		} catch (err) {
			if (err === 'invalid path') return false;
			throw err;
		}

		return true;
	}
}

return new DirectFactoringAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.DirectFactoringAction);
// Copyright Erik Weitnauer 2014

/** This action commutes terms in a commutative and associative operator
 * 'group' like `sum`. */

gmath.actions.CommuteAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * target: a node relative to which the nodes will be moved
 * side: either 'left-of' or 'right-of', the side of the target to move the nodes to.
 */
var CommuteAction = function(settings) {
  Action.call(this, "commute terms");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
  }
};

gmath.inherit(Action, CommuteAction);

CommuteAction.prototype.getAllAvailableActions = function(ns) {
  if (ns.length === 0) return [];
  var root = ns[0].get_root();
  var actions = [];
  // switch and commute actions for commutative operations
  var is_flat = ns[0].parent.is_group('flat'), n;
  if (is_flat) return [];
  if (!ns[0].commutative || !Tree.is_range(ns)) return [];
  for (n = ns[0].ls; n && n.value !== '//'; n = n.ls) {
    if (this.match(ns, n, 'left-of')) actions.push(
      this.createBoundAction(root, {nodes: ns, target: n, side: 'left-of'}));
  }
  for (n = ns[ns.length-1].rs; n && n.value !== '//'; n = n.rs) {
    if (this.match(ns, n, 'right-of')) actions.push(
      this.createBoundAction(root, {nodes: ns, target: n, side: 'right-of'}));
  }
  return actions;
}

/** Must pass the nodes to move, the target node and the side of the target
 * node to move the nodes to. See the description of the constructor for details. */
CommuteAction.prototype.match = function(nodes, target, side) {
  if (target.parent !== nodes[0].parent) return false;
  // all nodes must be commutative (if one is, all will be!)
  if (!nodes[0].commutative) return false;
  // new position must be different from current position
  if (side === 'left-of' && target.ls === nodes[nodes.length-1]) return false;
  if (side === 'right-of' && target.rs === nodes[0]) return false;
  return true
}

/** This function is synchronous, so you can also call it without providing a callback. */
CommuteAction.prototype.transform = function(callback) {

  var nodes = this.getNewTreeNode(this.nodes);
  var target = this.getNewTreeNode(this.target);

  var parent = target.parent
     ,idx = parent.children.indexOf(target);
  if (nodes.length === 1) {
    nodes[0].remove();
    parent.insert(idx, nodes[0]);
  } else {
    if (this.side === 'right-of') idx++;
    var idx0 = Tree.remove_range(nodes);
    parent.insert_range(idx0<idx ? idx-nodes.length : idx, nodes);
  }

  if (typeof(callback) === 'function') callback(this);
  else return true;
};

return new CommuteAction();

})();
AlgebraModel.prototype.move_actions.push(gmath.actions.CommuteAction);
// Copyright Erik Weitnauer 2014

// notes: when moving a single NUM from one side to the other, the minus sign will not be put in the right spot.


/** This action allows to move a term from one side of an equation to its other side. */
gmath.actions.EqInvertAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * side: right-of, left-of, or around (for inverting muls).
 * target: the node next to which you want to place nodes
 */
var EqInvertAction = function(settings) {
  Action.call(this, "invert terms across equation");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, EqInvertAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
EqInvertAction.prototype.getAllAvailableActions = function(nodes) {
  var self = this;

  var actions = [];
  if (nodesAreDisqualified()) return actions;

  var selections = {};
  selectTreeAndTargetSide();

  bindInversionsAroundTargetSide();

  return actions;

  function nodesAreDisqualified() {
    return nodes.length===0 || !matchNodes() || !Tree.is_range(nodes);
  }

  function matchNodes() {
    var n0 = nodes[0];
    var tree = n0.get_root();
    var path_n0 = n0.get_path();
    if (path_n0[1] !== 0 && path_n0[1] !== 2) return false;
    return (tree.children[0].is_group('equals') && correctLevel());

    function correctLevel() {
      if (n0.is_group('add', 'sub')) {
        return n0.parent.parent && n0.parent.parent.is_group('equals');
      } else if (n0.is_group('mul', 'div')) {
        var p_group = n0.parent;
        if (p_group.is_group('product')) {
          return p_group.parent && p_group.parent.is_group('equals')
              || p_group.parent && p_group.parent.is_group('add', 'sub') && p_group.parent.parent.parent.is_group('equals');
        } else if (p_group.is_group('fraction')) {
          return p_group.parent.is_group('equals')
              || p_group.parent && p_group.parent.is_group('add', 'sub')
              || p_group.parent && p_group.parent.is_group('mul') && p_group.parent.parent.is_group('product') && p_group.parent.parent.parent.is_group('equals')
              || p_group.parent && p_group.parent.is_group('mul') && p_group.parent.parent.parent && p_group.parent.parent.parent.is_group('add', 'sub');
        }
      } else {
        return n0.parent.is_group('equals');
      }
    }
  }

  function selectTreeAndTargetSide() {
    selections.tree = nodes[0].get_root();
    selections.targetSide = selections.tree.children[0].getOppositeSideOfNode(nodes[0]);
  }

  function bindInversionsAroundTargetSide() {
    actions.push(self.createBoundAction(
      selections.tree, {nodes: nodes, target: selections.targetSide, side: 'around'}));
  }
}

EqInvertAction.prototype.transform = function(callback) {
  var self = this;

  var modifiers = this.getNewTreeNode(this.nodes);

  var structure = this.analyzeStructureOfEquation(modifiers);

  this.invertModifiers(structure.modifiers);

  this.modifyAnyOtherTermsOnOriginSide(structure.modifiers, structure.originChanges);

  this.removeModifiersFromOriginSide(structure.modifiers);

  this.modifyTargetSide(structure.modifiers, structure.otherSideOfEquation);

  if (typeof(callback) === 'function') callback(this);
  return this;
}

EqInvertAction.prototype.analyzeStructureOfEquation = function(modifiers) {
  var structure = {};

  var equals = modifiers[0].get_root().children[0];
  var pathOfModifiers = modifiers[0].get_path()
     ,idxOfTargetSide = pathOfModifiers[1] ? 0 : 2;

  structure.modifiers = modifiers;

  structure.originChanges = this.getOtherTermsFromSide(equals.children[pathOfModifiers[1]], modifiers, pathOfModifiers);

  structure.otherSideOfEquation = equals.children[idxOfTargetSide];

  return structure;
}

// If the modifiers list contains one thing, and it is the top-level term on that side of the equation, no other modification
// needs to take place on the originating side of the equation.
// If the modifiers list does not contain everything on that side of the equation, then we want to get the terms from that top-level group
// that will need to be modified.
EqInvertAction.prototype.getOtherTermsFromSide = function(equationSide, modifiers, pathOfModifiers) {
  if (equationSide===modifiers[0] || modifiers[0].is_group('div') && modifiers[0].parent===equationSide) {
    return [];
  } else {
    return equationSide.children.slice().filter(function(n) {
      var pathOfN = n.get_path();
      return pathOfN[2]!==pathOfModifiers[2];
    })
  }
}

// Notice that sometimes we do not invert anything.
// This happens if we drag the entirety of one side to another (entire product, sum, number, etc.).
// In these cases the entire side will be replaced with a zero and there will be no modifications of that side.
// We'll invert these terms later when modifying the target side.
EqInvertAction.prototype.invertModifiers = function(modifiers) {
  var reciprocals = [];
  for (var i=0; i<modifiers.length; i++) {
    var m = modifiers[i];
    if (m.is_group('mul') && m.children[1].is_group('fraction')) {
      this.convertToReciprocal(m.children[1]);
    } else {
      if (m.invert && !m.is_group('fraction')) m.invert();
    }
    reciprocals.push(m);
  }
  return reciprocals;
}

EqInvertAction.prototype.convertToReciprocal = function(productFraction) {
  var p = productFraction.parent
     ,idxForReciprocal = productFraction.remove();
  var reciprocal;
  if (productFraction.is_group('product')) {
    var muls = productFraction.children.slice();
    Tree.remove_range(productFraction.children);
    muls.forEach(function(mul){mul.invert()});
    var fraction = MulDiv.prototype.createGroup();
    muls.forEach(function(div){fraction.append(div)});
    reciprocal = fraction;
  } else {
    var top = productFraction.get_top()
       ,bottom = productFraction.get_bottom();
    if (top.length===1 && Num.get_value(top[0].children[1])===1) {
      var product = MulDiv.prototype.createGroup();
      Tree.remove_range(bottom);
      bottom.forEach(function(div){div.invert()});
      product.append_range(bottom);
      reciprocal = product;
    } else {
      Tree.remove_range(top);
      Tree.remove_range(bottom);
      top.forEach(function(mul){mul.invert()});
      bottom.forEach(function(div){div.invert()});
      bottom.forEach(function(mul){productFraction.append(mul)});
      top.forEach(function(div){productFraction.append(div)});
      reciprocal = productFraction;
    }
  }

  p.insert(idxForReciprocal, reciprocal);
}

EqInvertAction.prototype.modifyAnyOtherTermsOnOriginSide = function(modifiers, otherTerms) {
  if (otherTerms.length===0) return;

  var topLevelGroup = otherTerms[0].parent;
  if (modifiers[0].is_group('mul', 'div') && topLevelGroup.is_group('sum')) {
    for (var i=0; i<otherTerms.length; i++) {
      var otherTerm = otherTerms[i].children[1];

      var remainingModifiers = this.removeRedundantTerms(otherTerm, modifiers);

      otherTerm = otherTerms[i].children[1]; // the original "other term" may have been cleaned up when the redundant terms were removed

      this.insertModifiersIntoTerm(otherTerm, remainingModifiers);
    }
  }
}

EqInvertAction.prototype.removeRedundantTerms = function(term, modifiers) {
  var remainingModifiers = modifiers.slice();

  if (term.is_group('product', 'fraction')) {
    for (var i=0; i<term.children.length; ) {
      var factor = term.children[i];
      for (var j=0; j<remainingModifiers.length; ) {
        if (this.invertModifiers([Tree.clone(remainingModifiers[j])])[0].to_ascii()===factor.to_ascii()) {
          this.updateNodeMap(factor.get_mapping_to(remainingModifiers[j]));
          factor.remove();
          remainingModifiers.splice(j, 1);
          break;
        } else {
          i++; j++;
        }
      }
      if (remainingModifiers.length===0) break;
    }
    this.cleanup(term);
  }

  return remainingModifiers;
}

EqInvertAction.prototype.insertModifiersIntoTerm = function(term, modifiers) {
  if (this.termIsAProductContainingAFraction(term) && modifiers[0].is_group('div')) {
    this.insertModifierDivsAsNewFractionIntoProduct(term, modifiers);
  } else if (term.is_group('product', 'fraction')) {
    this.insertModifiersIntoProductFraction(term, modifiers);
  } else {
    this.replaceTermWithProductContainingModifiedTerm(term, modifiers);
  }
}

EqInvertAction.prototype.termIsAProductContainingAFraction = function(term) {
  if (!term.is_group('product')) return false;
  return term.children.some(function(mul){return mul.children[1].is_group('fraction')});
}

EqInvertAction.prototype.insertModifierDivsAsNewFractionIntoProduct = function(term, modifiers) {
  var self = this;
  var modifyingFraction = MulDiv.prototype.createGroup();
  modifyingFraction.append(new MulDiv(new Num(1)));
  modifiers.forEach(function(m) {
    var clone = Tree.clone(m);
    clone.dragging = false; clone.selected = false;
    self.extendNodeMap(m.get_mapping_to(clone));
    modifyingFraction.append(clone);
  });

  term.append(new MulDiv(modifyingFraction));
}

EqInvertAction.prototype.insertModifiersIntoProductFraction = function(term, modifiers) {
  var self = this;
  modifiers.forEach(function(m) {
    var clone = Tree.clone(m);
    clone.dragging = false; clone.selected = false;
    self.extendNodeMap(m.get_mapping_to(clone));
    term.append(clone);
  });
}

EqInvertAction.prototype.replaceTermWithProductContainingModifiedTerm = function(term, modifiers) {
  var self = this;
  var product = MulDiv.prototype.createGroup()
     ,p = term.parent
     ,idxForProduct = term.remove();
  product.append(new MulDiv(term));

  modifiers.forEach(function(m) {
    var clone = Tree.clone(m);
    clone.dragging = false; clone.selected = false;
    self.extendNodeMap(m.get_mapping_to(clone));
    product.append(clone);
  })

  p.insert(idxForProduct, product);
}

EqInvertAction.prototype.removeModifiersFromOriginSide = function(modifiers) {
  var originSide = modifiers[0].get_root().get_child(modifiers[0].get_path().slice(0, 2));

  if (this.modifierIsTheOnlyTermOnOriginSide(modifiers, originSide)) {
    this.removeModifierAndReplaceWithZero(modifiers);
  } else if (modifiers[0].is_group('div') || modifiers[0].is_group('mul') && modifiers[0].parent.is_group('fraction')) {
    // the only case with a double cleanup? fraction in a product
    var fraction = modifiers[0].parent
       ,p = fraction.parent;
    Tree.remove_range(modifiers);
    var top = fraction.get_top()
       ,fraction_cleaned = this.cleanup(fraction);
    if (fraction_cleaned && top.length===1) p.simplify = true;
    this.cleanup(p);
  } else {
    var p = modifiers[0].parent;
    Tree.remove_range(modifiers);
    this.cleanup(p);
  }
}

EqInvertAction.prototype.modifierIsTheOnlyTermOnOriginSide = function(modifiers, originSide) {
  return modifiers[0]===originSide;
}

EqInvertAction.prototype.removeModifierAndReplaceWithZero = function(modifiers) {
  var p = modifiers[0].parent
     ,idxForZero = modifiers[0].remove();

  p.insert(idxForZero, new Num(0));
}

EqInvertAction.prototype.modifyTargetSide = function(modifiers, targetSide) {
  // The process taken is to invert the dragged nodes in place, and then move them.
  // This chunk takes care of the cases that we can't modify earlier.
  // Here are the cases, they occur when we're dragging the entirety of one side to the other:
  // dragging a sum/product/fraction.
  // dragging a sign group.
  if (modifiers.length===1 && !modifiers[0].is_group('mul', 'div') && !modifiers[0].is_group('add', 'sub')) {
    if (modifiers[0].is_group('sign')) {
      var m = modifiers[0].children[1];
      m.remove();
      modifiers[0] = new AddSub(m);
    } else if (modifiers[0].is_group('sum')) {
      modifiers[0].children.forEach(function(addend){addend.invert()});
      modifiers[0] = new AddSub(modifiers[0]);
    } else {
      modifiers[0] = new AddSub(modifiers[0], 'sub');
    }
  }

  var p = targetSide.parent
     ,idxForNewGroup = targetSide.remove();

  var newGroup;

  if (!targetSide.is_group('product', 'fraction') && modifiers[0].is_group('mul', 'div')) {
    var product = MulDiv.prototype.createGroup();
    product.append(new MulDiv(targetSide));
    for (var i=0; i<modifiers.length; i++) {
      product.append(modifiers[i]);
    }
    p.insert(idxForNewGroup, product);
    this.cleanup(product.children[0]);
    product.children[0].simplify = true;
  } else if (!targetSide.is_group('sum') && modifiers[0].is_group('add', 'sub', 'sum')) {
    var sum = AddSub.prototype.createGroup();
    sum.append(new AddSub(targetSide));
    for (var i=0; i<modifiers.length; i++) {
      sum.append(modifiers[i]);
    }
    p.insert(idxForNewGroup, sum);
    this.cleanup(sum.children[0]);
    if (modifiers[0].children[1].is_group('sum')) {
      var _modifiers = modifiers[0].children[1].children.slice();
      this.cleanup(modifiers[0]);
      modifiers = _modifiers;
    }
    sum.children[0].simplify = true;
  } else {
    var group = targetSide;
    for (var i=0; i<modifiers.length; i++) {
      group.append(modifiers[i]);
    }
    p.insert(idxForNewGroup, group);
  }

  this.reselectNodeAfterAction(modifiers);
}

return new EqInvertAction();

})();

AlgebraModel.prototype.move_actions.push(gmath.actions.EqInvertAction);
gmath.actions.EqInvertPowerAction =
(function () {

var EqInvertPowerAction = function(settings) {
	Action.call(this, 'invert power across equation');
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.side = settings.side;
		this.priority = settings.priority;
	}
};

gmath.inherit(Action, EqInvertPowerAction);

EqInvertPowerAction.prototype.getAllAvailableActions = function(nodes) {
	if (!this.nodesAreASingleExponent(nodes) && !this.nodesAreARangeOfMulsInAnExponent(nodes)) return [];
	if (!this.expressionIsAnEquation(nodes)) return [];
	if (!this.powerIsTheTopLevelGroupOnThisSideOfTheEquation(nodes)) return [];
	return [this.createBoundAction(nodes[0].get_root(), {
		nodes: nodes
	 ,target: this.getOtherSideOfEquation(nodes)
	 ,side: 'around'
	})];
}

EqInvertPowerAction.prototype.nodesAreASingleExponent = function(nodes) {
	return nodes.length===1 && nodes[0].is_group('exponent');
}

EqInvertPowerAction.prototype.nodesAreARangeOfMulsInAnExponent = function(nodes) {
	try {
		return Tree.is_range(nodes) && nodes.every(function(n){return n.is_group('mul') && Tree.get_parent(2, n).is_group('exponent')})
	} catch (err) {
		if (err!=='invalid path') throw err;
		return false;
	}
}

EqInvertPowerAction.prototype.expressionIsAnEquation = function(nodes) {
	var tree = nodes[0].get_root();
	return tree.children[0].is_group('equals');
}

EqInvertPowerAction.prototype.powerIsTheTopLevelGroupOnThisSideOfTheEquation = function(nodes) {
	var equation = nodes[0].get_root().children[0]
	   ,power = nodes[0];

	while (!power.is_group('power')) power = power.parent;

	return equation.children[0]===power || equation.children[2]===power;
}

EqInvertPowerAction.prototype.getOtherSideOfEquation = function(nodes) {
	var equation = nodes[0].get_root().children[0];
	var pathToNodes = nodes[0].get_path();
	return pathToNodes[1]===0 ? equation.children[2] : equation.children[0];
}

EqInvertPowerAction.prototype.transform = function(callback) {
	this.addTouchedNodes(this.nodes[0].get_root());

	var nodes = this.getNewTreeNode(this.nodes)
	   ,otherSide = this.getOtherSideOfEquation(nodes);

	this.extractRangeFromExponent(nodes);

	var exponent = this.convertNodesToReciprocalAndPrepareExponent(nodes);

	this.wrapTermInPower(otherSide, exponent);

	exponent.update_x_during_dragging = true;
	exponent.update_y_during_dragging = true;
	this.reselectNodeAfterAction(exponent);

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

// the range is either the entire exponent or a range of muldivs in a product in the exponent.
// this function takes out that range from the power and simplifies the power if necessary.
// returns what was left over from the power
EqInvertPowerAction.prototype.extractRangeFromExponent = function(range) {
  if (range[0].is_group('exponent')) {
    var p = range[0].parent.parent
       ,pow = range[0].parent
       ,base = pow.children[0]
       ,exp = range[0];
    var idx_for_base = pow.remove();
    base.remove();
    exp.remove();
    p.insert(idx_for_base, base);
    return base;
  } else {
    var pow = range[0].get_parent(4)
       ,exp = pow.children[1]
       ,br = exp.children[0]
       ,prod = br.children[1];
    Tree.remove_range(range);
    this.cleanup(prod);
    Brackets.handle(br, true);
    return pow;
  }
}

EqInvertPowerAction.prototype.convertNodesToReciprocalAndPrepareExponent = function(nodes) {
	var exponent;

	if (nodes[0].is_group('exponent')) {
		this.invertContentsOfExponent(nodes[0]);
		exponent = nodes[0];
	} else {
		exponent = this.invertMulsAndPutInProductFractionExponentStructure(nodes);
	}

	return exponent;
}

EqInvertPowerAction.prototype.invertContentsOfExponent = function(exponent) {
	var contents = exponent.children[0];
	if (contents.is_group('brackets') && contents.children[1].is_group('product', 'fraction')) {
		this.convertToReciprocal(contents.children[1]);
		Brackets.handle(contents, true);
	} else {
		var fraction = MulDiv.prototype.createGroup();
		contents.remove();
		fraction.append(new MulDiv(new Num(1)));
		fraction.append(new MulDiv(contents, 'div'));
		exponent.append(fraction);
		Brackets.handle(fraction);
	}
}

EqInvertPowerAction.prototype.convertToReciprocal = function(productFraction) {
	var p = productFraction.parent
	   ,idxForReciprocal = productFraction.remove();
	var reciprocal;
	if (productFraction.is_group('product')) {
		var muls = productFraction.children.slice();
		Tree.remove_range(productFraction.children);
		muls.forEach(function(mul){mul.invert()});
		var fraction = MulDiv.prototype.createGroup();
		muls.forEach(function(div){fraction.append(div)});
		reciprocal = fraction;
	} else {
		var top = productFraction.get_top()
		   ,bottom = productFraction.get_bottom();
		if (top.length===1 && Num.get_value(top[0].children[1])===1) {
			var product = MulDiv.prototype.createGroup();
			Tree.remove_range(bottom);
			bottom.forEach(function(div){div.invert()});
			product.append_range(bottom);
			reciprocal = product;
		} else {
			Tree.remove_range(top);
			Tree.remove_range(bottom);
			top.forEach(function(mul){mul.invert()});
			bottom.forEach(function(div){div.invert()});
			bottom.forEach(function(mul){productFraction.append(mul)});
			top.forEach(function(div){productFraction.append(div)});
			reciprocal = productFraction;
		}
	}

	p.insert(idxForReciprocal, reciprocal);
}

EqInvertPowerAction.prototype.invertMulsAndPutInProductFractionExponentStructure = function(muls) {
	var fraction = MulDiv.prototype.createGroup();
	muls.forEach(function(mul){mul.invert()});
	muls.forEach(function(div){fraction.append(div)});
	return new Exponent(fraction);
}

EqInvertPowerAction.prototype.wrapTermInPower = function(term, exponent) {
  var p = term.parent
     ,idx_for_pow = term.remove()
     ,base = term;

  var pow = new Power(base, exponent);
  p.insert(idx_for_pow, pow);
  Brackets.handle(pow);

  if (exponent.children[0].is_group('brackets')) {
  	this.cleanup(exponent.children[0].children[1]);
  	Brackets.handle(exponent.children[0], true);
  }

  return exponent;
}

return new EqInvertPowerAction();
})();

AlgebraModel.prototype.move_actions.push(gmath.actions.EqInvertPowerAction);// Copyright Erik Weitnauer 2014.

/** This action will set or unset the hidden or hide_after_drop field for
 * nodes using any hide rules that were registered with the tree. For
 * examples, in an expression like "*2*x", both "*" might be hidden so we
 * get "2x". */
AlgebraModel.prototype.hideNodesAction =
(function() {
var HideNodesAction = function(settings) {
  Action.call(this, "apply hide rules");
};

gmath.inherit(Action, HideNodesAction);

/** This method can be called without providing a callback and it will
 * return immediately. The return value in this case will be true if
 * any changes were done and false if everything stayed the same.
 *
 * We don't unhide leading operators during dragging for now,
 * because otherwise the sel-box around the
 * dragged term is at the wrong position (does not take hidden nodes
 * into account). E.g., moving `b` to the left in `x=b+a` requires to
 * drag the `+b` much further than you would expect. */
HideNodesAction.prototype.doInPlace = function(tree, callback) {
  var changed = false;
  if (tree.children.length > 0) {
    tree.children[0].for_each(function (n) {
    var old1 = n.hidden, old2 = n.hide_afer_drop;
      n.hidden = false;
      n.hide_after_drop = false;
      // hide leading ops and turn /x into *x.
      if (tree.options.hide_leading_op && (n instanceof Sym) && n.parent && n.parent.commutative) {
        if ((n.parent.associative && !n.parent.ls) ||
            (n.parent.value == 'div' && n.parent.ls && n.parent.ls.value == '//')) {
          if (n.parent.dragging) n.hide_after_drop = true;
          else n.hidden = true;
        }
      }

      // hide multiplication signs of single mul or div in fraction
      if (n instanceof Sym && ProductFraction.is_lone_fraction_part(n.parent)) {
        n.hidden = true;
      }

      // hide outer-most brackets on fractions, power expressions and other vertically notated expressions
      // e.g., cases like (1+2)/3 or ((1+2))/3 or 2^(1+2), but not cases like (1)/(2) or the inner brackets
      // in ((1+2)*3)/4 or x^(1).
      if ((n.value === '(' || n.value === ')')) {
        var br = n.parent;
        if (br.parent.vertical_notation || (br.parent.parent && br.parent.parent.vertical_notation)) {
          var child = br;
          while (child.is_group('brackets')) child = child.children[1];
          if (!Brackets.is_optional(child, br.parent)
              && HideNodesAction.isLoneMulDivInNumeratorOrDenominator(br.parent)) {
            if (n.parent.dragging) n.hide_after_drop = true;
            else n.hidden = true;
          }
        }
      }

      for (var i=0; i<tree.hide_rules.length && !n.hidden; i++) {
        var hr = tree.hide_rules[i];
        if (!hr.disabled) hr.apply(n);
      }

      changed = changed || (n.hidden != old1) || (n.hide_after_drop != old2);
    });
  }

  if (typeof(callback) === 'function') callback(this);
  else return changed;
};

HideNodesAction.isLoneMulDivInNumeratorOrDenominator = function(muldiv) {
  return !((muldiv.ls && muldiv.ls.is_group(muldiv.value)) ||
           (muldiv.rs && muldiv.rs.is_group(muldiv.value)));
}

return new HideNodesAction();
})();
// Copyright Erik Weitnauer 2014

/** This action allows to switch terms around in a flat group. Used to simulate
 * binary-style commutation. E.g. when changing `2+3` into `3+2`, the `+` stays in place. */

gmath.actions.SwitchAction =
(function() {

/** In the settings object, you must pass the following keys:
 * node: the node to move
 * target: the node with which node will switch places
 * side: any string, will not be used internally, but is saved in this.side
 */
var SwitchAction = function(settings) {
  Action.call(this, "switch terms in a flat representation");
  if (settings) {
    this.node = settings.node;
    this.target = settings.target;
    this.side = settings.side;
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, SwitchAction);

SwitchAction.prototype.getAllAvailableActions = function(ns) {
  if (ns.length === 0) return [];
  var root = ns[0].get_root();
  var actions = [];
  // switch and commute actions for commutative operations
  var is_flat = ns[0].parent.is_group('flat'), n;
  if (!is_flat) return [];
  if (!ns[0].commutative || !Tree.is_range(ns)) return [];
  for (n = ns[0].ls; n && n.value !== '//'; n = n.ls) {
    if (this.match(ns[0], n)) actions.push(
      this.createBoundAction(root, {node: ns[0], side: 'around', target: n}));
  }
  for (n = ns[ns.length-1].rs; n && n.value !== '//'; n = n.rs) {
    if (this.match(ns[0], n)) actions.push(
      this.createBoundAction(root, {node: ns[0], side: 'around', target: n}));
  }
}

/** Node and target must not be the same node, and must have the same parent. */
SwitchAction.prototype.match = function(node, target) {
  return (node.parent === target.parent && node !== target &&
          !(target instanceof Sym) && !(node instanceof Sym));
}

/** This method is synchronous, so you can also call it without providing a callback. */
SwitchAction.prototype.transform = function(callback) {

  // make sure we get nodes and target in the correct tree
  var is_same_tree = tree === this.target.get_root();
  var node = is_same_tree ? this.node : tree.get_child(this.node.get_path());
  var target = is_same_tree ? this.target : tree.get_child(this.target.get_path());

  Tree.switch_siblings(node, target);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

return new SwitchAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.SwitchAction);

// Copyright Erik Weitnauer 2014.

(function() {

var flipEquationAction = function(settings) {
	Action.call(this, 'flip equation');
	if (settings) this.actor = settings.actor;
	this.priority = 1;
}

gmath.inherit(Action, flipEquationAction);

flipEquationAction.prototype.match = function(node) {
	return node.is_group('equals');
}

flipEquationAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);

	this.addTouchedNodes(getLeftSideOfEquation(this.actor));
	this.addTouchedNodes(getRightSideOfEquation(this.actor));

	var leftSideOfEquation = getLeftSideOfEquation(node)
	   ,rightSideOfEquation = getRightSideOfEquation(node);

	leftSideOfEquation.remove();
	rightSideOfEquation.remove();

  var leftSideLocation = 0
     ,rightSideLocation = 2;

  node.insert(leftSideLocation, rightSideOfEquation);
  node.insert(rightSideLocation, leftSideOfEquation);

  if (typeof(callback) === 'function') callback(this);
  return this;
}

Equals.prototype.add_action_handler(new flipEquationAction());

var getLeftSideOfEquation = function(equalsGroup) {
	return equalsGroup.children[0];
}

var getRightSideOfEquation = function(equalsGroup) {
	return equalsGroup.children[2];
}

})();// Copyright Erik Weitnauer 2014.

gmath.actions.EquationFountain =
(function() {

var EquationFountain = function(settings) {
  Action.call(this, 'rewrite equation');
  if (settings) this.target = settings.target;
  this.priority = 0;
  this.asynchronous = true;
};

gmath.inherit(Action, EquationFountain);

EquationFountain.prototype.match = function(node) {
  return node.is_group('equals');
}

/// Returns all fraction nodes.
EquationFountain.prototype.getAllAvailableActions = function(ns) {
  if (ns.length === 0) return [];
  var amodel = ns[0].get_root(), self = this;
  return Tree.filter(this.match, ns)
    .map(function(target) { return self.createBoundAction(amodel, {target: target}) });
}

EquationFountain.prototype.transform = function(callback) {

  var target = this.getNewTreeNode(this.target);
  var self = this;

  var keyboard = Keyboard();
  keyboard
    .on('done', enteredOpAndTerm)
    .on('cancel', kbCancelled)
    ();

  function enteredOpAndTerm(latex) {
    var inputLeft = (new AlgebraModel(latex)).children[0];
    var leftSide = target.children[0]
       ,rightSide = target.children[2];
    var eLeft = AlgebraModel.getNodes('E', 0, inputLeft);
    if (!eLeft) return;
    var inputRight = inputLeft.clone();
    var eRight = AlgebraModel.getNodes('E', 0, inputRight);
    if (!eRight) return;

    Tree.replace(leftSide, inputLeft);
    leftSide.parent = null;
    Tree.replace(eLeft, leftSide);
    Brackets.handle(leftSide);

    Tree.replace(rightSide, inputRight);
    rightSide.parent = null;
    Tree.replace(eRight, rightSide);
    Brackets.handle(rightSide);

    keyboard.visible(false);
    keyboard.on('done', null).on('cancel', null);
    callback(self);
  }

  function kbCancelled() {
    console.log('cancelled');
    keyboard.visible(false);
    keyboard.on('done', null).on('cancel', null);
    callback(false);
  }

  // show the keyboard so the user can choose what to add
  keyboard.caption('Enter an operation to apply to both sides of the equation.');
  keyboard.latex('E').visible(true);
}

return new EquationFountain();

})();
// Copyright Erik Weitnauer 2014.

/** This is an asynchronous action that can be triggered on any fraction.
 * It will bring up the keyboard and multiply numerator and denominator with
 * the term the user types in. */

gmath.actions.FractionExtendAction =
(function() {

var FractionExtendAction = function(settings) {
  Action.call(this, 'extend fraction');
  if (settings) this.target = settings.target;
  this.priority = 0;
  this.asynchronous = true;
};

gmath.inherit(Action, FractionExtendAction);

FractionExtendAction.prototype.match = function(node) {
  return node.is_group('fraction');
}

/// Returns all fraction nodes.
FractionExtendAction.prototype.getAllAvailableActions = function(ns) {
  if (ns.length === 0) return [];
  var amodel = ns[0].get_root(), self = this;
  return Tree.filter(this.match, ns)
    .map(function(target) { return self.createBoundAction(amodel, {target: target}) });
}

FractionExtendAction.prototype.transform = function(callback) {

  var fraction = this.getNewTreeNode(this.target)
    , model = fraction.get_root()
    , self = this;

  var keyboard = Keyboard();
  keyboard
    .on('done', kbEntered)
    .on('cancel', kbCancelled)
    ();

  function kbEntered(latex) {
    var term = model.parse(latex, true);
    if (!term) return;
    self.extend_fraction(fraction, term);
    keyboard.visible(false);
    keyboard.on('done', null).on('cancel', null);
    callback(self);
  }

  function kbCancelled() {
    console.log('cancelled');
    keyboard.visible(false);
    keyboard.on('done', null).on('cancel', null);
    callback(false);
  }

  // show the keyboard so the user can choose what to add
  keyboard.latex('').visible(true);
}

FractionExtendAction.prototype.extend_fraction = function(fraction, term) {
  fraction.append(new MulDiv(term, 'mul'));
  fraction.append(new MulDiv(term.clone(), 'div'));
  this.cleanup(fraction);
}

return new FractionExtendAction();
})();
// Copyright Erik Weitnauer 2014

/** This action moves an added numerator to a new fraction with the same denominator.
 */
gmath.actions.SplitNumeratorAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * target: a node relative to which the nodes will be moved
 * side: either 'left-of' or 'right-of', the side of the target to move the nodes to.
 */
var SplitNumeratorAction = function(settings) {
  Action.call(this, "split numerator into new fractions with same denominators");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = (Array.isArray(this.target) ? 'around' : settings.side);
    this.target_is_left = (settings.side === 'left-of');
    this.offset = {x: (this.target_is_left ? -10 : 10), y: 0};
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, SplitNumeratorAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
SplitNumeratorAction.prototype.getAllAvailableActions = function(nodes) {
  if (nodes.length === 0) return [];
  var n0 = nodes[0];
  // Check for existence of parent.parent.parent.parent.
  // AddSub(s) -> sum -> brackets -> MulDiv -> fraction
  if (!n0.parent || !n0.parent.parent || !n0.parent.parent.parent || !n0.parent.parent.parent.parent) return [];
  if (!(n0.is_group('add') || n0.is_group('sub')) || !n0.parent.parent.parent.is_group('mul') || !n0.parent.parent.parent.parent.is_group('fraction')) return [];
  if (this.match(nodes, n0.parent.parent.parent.parent)) {
    return [this.bindAction(nodes, 'left-of')
           ,this.bindAction(nodes, 'right-of')];
  }
  return [];
}

/// Side must be 'left-of' or 'right-of'.
SplitNumeratorAction.prototype.bindAction = function(nodes, side) {
  var root = nodes[0].get_root();
  var siblings = [];
  if (this.fractionIsPartOfProduct(nodes)) {
    siblings = this.getSiblingsOfFraction(nodes, side);
  }
  return this.createBoundAction(root, {
    nodes: nodes
  , target: siblings.length>0 ? siblings : nodes[0].parent.parent.parent.parent
  , side: side });
}

SplitNumeratorAction.prototype.fractionIsPartOfProduct = function(nodes) {
  var fraction = nodes[0].parent;
  return fraction.parent && fraction.parent.is_group('sum');
}

/// Side must be 'left-of' or 'right-of'
SplitNumeratorAction.prototype.getSiblingsOfFraction = function(nodes, side) {
  var fraction = nodes[0].parent, addSub = fraction.parent, sum = addSub.parent;
  if (side === 'left-of')
    return sum.children.slice(0, sum.children.indexOf(addSub));
  else
    return sum.children.slice(sum.children.indexOf(addSub)+1);
}

/** Must pass the nodes to move, the target node and the side of the target
 * node to move the nodes to, unless it just passed an actor.
  See the description of the constructor for details. */
SplitNumeratorAction.prototype.match = function(nodes, target) {
  if (nodes.length === 0) return false;
  return (nodes[0] && (nodes[0].is_group('add') || nodes[0].is_group('sub')) && nodes[0].parent.parent.parent.parent === target
    && target.is_group('fraction'));
}

/** This function is synchronous, so you can also call it without providing a callback. */
SplitNumeratorAction.prototype.transform = function(callback) {

  var nodes = this.getNewTreeNode(this.nodes);
  this.addTouchedNodes(this.nodes[0].parent.parent.parent.parent);
  var oldDenominator = this.nodes[0].parent.parent.parent.parent.get_bottom();

  // AddSub(s) -> sum -> brackets -> MulDiv -> fraction
  var fraction = nodes[0].parent.parent.parent.parent;
  Tree.remove_range(nodes);

  // Instead of a single fraction node in tree is now a sum.
  var sum = AddSub.prototype.createGroup();
  fraction.replace_with(sum);
  // Insert the existing fraction (minus the dragged nodes).
  sum.append(new AddSub(fraction));
  var denominator = fraction.get_bottom();
  var _fraction = new ProductFraction()
  _fraction.invert();
  var numerator = AddSub.prototype.createGroup();
  numerator.append_range(nodes);
  _fraction.insert(0, new MulDiv(numerator));
  // Duplicate nodes in denominator, extend node mappings.
  for (var i=0; i<denominator.length; i++) {
    var clone = Tree.clone(denominator[i]);
    _fraction.append(clone);
    this.extendNodeMap(oldDenominator[i].get_mapping_to(clone));
  }
  this.extendNodeMap(fraction.children[1], _fraction.children[1]); // Maps old fraction bar to new fraction bar.
  var _addFrac = new AddSub(_fraction);
  // Add the new fraction to the sum group.
  sum.insert(this.target_is_left ? 0 : 1, _addFrac);

  // Fractions that have single terms in the numerator can be simplified.
  // If more than one node was dragged, no simplification, just update node maps.
  var rearranged0 = this.rearrangeSumIfNumeratorIsASingleTerm(sum, 0)
     ,rearranged1 = this.rearrangeSumIfNumeratorIsASingleTerm(sum, 1);
  if (this.target_is_left && !rearranged0 || !this.target_is_left && !rearranged1) {
    for (var i=0; i<nodes.length; i++) {
      this.updateNodeMap(nodes[i], _addFrac);
    }
  }

  var fracTop = fraction.get_top()
     ,_fracTop = _fraction.get_top();
  if (fracTop.length===1) this.cleanup(fracTop[0]);
  if (_fracTop.length===1) this.cleanup(_fracTop[0]);
  this.cleanup(sum.parent);

  if (typeof(callback) === 'function') callback(this);
  else return true;
};

SplitNumeratorAction.prototype.rearrangeSumIfNumeratorIsASingleTerm = function(sum, idx) {
  var add = sum.children[idx]
     ,frac = add.children[1];
  if (frac.children[0].children[1].children[1].children.length===1) {
    var numsum = frac.children[0].children[1].children[1]
       ,_add = numsum.children[0]
       ,value = _add.children[1]
       ,sumParent = numsum.parent.parent;
    numsum.parent.remove();
    _add.remove();
    value.remove();
    numsum.remove();
    frac.remove();
    add.remove();
    sum.insert(idx, _add);
    _add.append(frac);
    sumParent.append(value);
    return true;
  }
  return false;
};

return new SplitNumeratorAction();
})();

AlgebraModel.prototype.move_actions.push(gmath.actions.SplitNumeratorAction);
;(function() {

/// Gets rid of a group without children and replaces a group with a single
/// child with the first child of that child.
/// Useful for simple commutative groups like "conjunction" and "disjunction".

var CommutativeGroupCleanup = function(settings) {
  Action.call(this, 'group cleanup action');
  if (settings) this.group = settings.actor;
};

gmath.inherit(Action, CommutativeGroupCleanup);

gmath.actions.CommutativeGroupCleanup = CommutativeGroupCleanup;

CommutativeGroupCleanup.prototype.match = function(node) {
  return node.is_group() && (!node.has_children() || node.children.length === 1);
}

/// All cleanup actions need to be asynchronous, so the callback is optional.
CommutativeGroupCleanup.prototype.doInPlace = function(callback) {
  this.initNodeMap();
  var group = this.getNewTreeNode(this.group);

  if (group.children.length === 0) {
    Tree.remove(group);
  } else if (group.children.length === 1) {
    var node = group.children[0]
      , old_node = this.group.children[0]
      , val = node.children[1];
    this.updateNodeMap(old_node.children[0], val);
    this.updateNodeMap(old_node, val);
    this.updateNodeMap(old_node.parent, val);
    Tree.replace(node.parent, val);

    if (val.parent.parent) Brackets.handle(val.parent, true);
    Brackets.handle(val, true);
  }

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

})();
// Copyright Erik Weitnauer 2013.

(function() {

var SignDoubleNegAction = function(settings) {
	Action.call(this, "--x=x");
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, SignDoubleNegAction);

SignDoubleNegAction.prototype.match = function(node) {
	return node.children.length == 2 &&
	  (node.children[1].is_group('sign') || node.parent.is_group('sign'));
}

SignDoubleNegAction.prototype.transform = function(callback) {
	// we might not work on the same tree this.actor is in
  var node = this.getNewTreeNode(this.actor);

  // no mapping because the negative signs drop (?)
  // but then again, in `x^1`, we map the `1`
	if (node.children[1].is_group('sign')) {
  	this.addTouchedNodes(this.actor.children[0]); // outer -
  	this.addTouchedNodes(this.actor.children[1].children[0]); // inner -
		Tree.replace(node, node.children[1].children[1]);
  } else if (node.parent.is_group('sign')) {
  	this.addTouchedNodes(this.actor.parent.children[0]); // outer -
  	this.addTouchedNodes(this.actor.children[0]); // inner -
  	Tree.replace(node.parent, node.children[1]);
  }

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

SignDoubleNegAction.prototype.updateNodesFromFutureAndPast = function() {
}

Sign.prototype.add_action_handler(new SignDoubleNegAction());

})();
// Copyright Erik Weitnauer 2013.

(function () {

var SignZeroAction = function(settings) {
	Action.call(this, "-0=0");
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, SignZeroAction);

SignZeroAction.prototype.match = function(node) {
  return (node.children[1] instanceof Num && node.children[1].value === 0);
}

SignZeroAction.prototype.transform = function(callback) {

  var sign = this.getNewTreeNode(this.actor)
     ,zero = sign.children[1];

  this.addTouchedNodes(this.actor);

  this.updateNodeMap(this.actor.get_mapping_to(zero));
  Tree.replace(sign, zero);

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

Sign.prototype.add_action_handler(new SignZeroAction());

})();
// Copyright Erik Weitnauer 2013.

(function () {

var IntegerExponentsAction = function(settings) {
	Action.call(this, 'integer exponents');
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, IntegerExponentsAction);

IntegerExponentsAction.prototype.match = function(node) {
	var pow = node.parent;
	if (!pow.is_group('power')) return false;
	var base = pow.children[0]
     ,exp = node.children[0];
	if (base.is_group('brackets')) base = base.children[1];
	if (!Num.is_num(base)) return false;
	return (Num.is_num(base) && exp instanceof Num && Math.round(exp.value) == exp.value && exp.value !== 0);
}

IntegerExponentsAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);

	this.addTouchedNodes(this.actor.parent);

	var pow = node.parent
	   ,base = pow.children[0]
     ,exp = node.children[0];

	if (base.is_group('brackets')) base = base.children[1];
	var res_term = new Num(Math.pow(Num.get_value(base), exp.value));
	this.updateNodeMap(this.actor.parent.get_mapping_to(res_term));
	Tree.replace(pow, res_term);

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

Exponent.prototype.add_action_handler(new IntegerExponentsAction());

})();
// Copyright Erik Weitnauer 2013.

(function () {

/** maps the paths of a tree of paths that are all children to one root node. */
function mapRelativePaths (oldPath, relPath, root, map) {
	var curr = root;
	map[oldPath] = [relPath];
	if (curr.has_children()) {
		for (var i=0; i<curr.children.length; i++) {
			mapRelativePaths(oldPath.concat(i), relPath.concat(i), root.children[i], map)
		}
	}
}


var xToOneAction = function(settings) {
	Action.call(this, "x^1=x");
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, xToOneAction);

xToOneAction.prototype.match = function(node) {
	return (node.children[0] instanceof Num) && node.children[0].value === 1;
}

xToOneAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);

	this.addTouchedNodes(this.actor);

	var base = node.ls;
	Tree.remove(base);

	node.parent.replace_with(base);
	Brackets.handle(base);
	this.updateNodeMap(this.actor.parent, base); // map pow group
	this.updateNodeMap(this.actor, base); // map exp group
	this.updateNodeMap(this.actor.children[0], base); // map exp value

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

Exponent.prototype.add_action_handler(new xToOneAction());

})();
// Copyright Erik Weitnauer 2013.

(function () {

var xToZeroAction = function(settings) {
	Action.call(this, 'x^0=1');
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, xToZeroAction);

xToZeroAction.prototype.match = function(node) {
	return (node.children[0] instanceof Num) && node.children[0].value === 0 && node.ls.to_ascii() !== '0';
}

xToZeroAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);

	this.addTouchedNodes(this.actor.parent);

	var one = new Num(1);
	this.updateNodeMap(this.actor.parent.get_mapping_to(one)); // map everything to one
	Tree.replace(node.parent, one);

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

Exponent.prototype.add_action_handler(new xToZeroAction());

})();
gmath.actions.CollectExponentsForFactoring =
(function() {

	var CollectExponentsForFactoring = function(settings) {
		Action.call(this, "collect exponents");
		if (settings) {
			this.nodes = settings.nodes;
			this.target = settings.target;
			this.side = 'inside';
		}
		this.makes_no_changes = true; // the AlgebraModel will apply this action without
		                              // creating a clone or triggering a change event
	};

	gmath.inherit(Action, CollectExponentsForFactoring);

	/// Returns an array of bound actions, one for each possible target of
	/// 'nodes' in the tree they are in.
	CollectExponentsForFactoring.prototype.getAllAvailableActions = function(nodes) {
		var root = nodes[0].get_root()
		  , self = this;

		try {
			var structure = this.analyzeNodeStructure(nodes);
			if (structure.length === 0) return [];
			var prod = structure[0].prod
		    , actions = [];
			for (var i=0; i<prod.children.length; i++) {
				try {
		  		var exp = prod.get_child([i, 1, 1]); // prod->muldiv->power->exp
		  		var ts = this.getTargetRangesInExponent(exp, structure);
		  		ts.forEach(function(t) {
						actions.push(self.createBoundAction(root, { nodes: nodes, target: t[0].is_group('product') ? [t[0].parent.parent] : t }));
					});
				} catch(err) {
					if (err !== 'invalid path') throw err;
				}
			}

			return actions;
		} catch (err) {
			if (err !== 'invalid path' && err !== "wrong structure") throw err;
		}
		return [];
	}

	CollectExponentsForFactoring.prototype.transform = function(callback) {

		var n0 = this.getNewTreeNode(this.nodes[0])
		  , target = this.getNewTreeNode(this.target);

		this.updateNodeMap(this.nodes[0], [n0].concat(target));

		if (typeof(callback) === 'function') callback(this);
		else return true;
	}

	// Each node range must be:
	// 1) a single exponent, or a single or range of mul-blocks inside an exponent
	// 2) all those exponents must be different
	// 3) all power groups must be inside the same product or fraction
	// 4) all ranges must have the same ascii representation
	CollectExponentsForFactoring.prototype.analyzeNodeStructure = function(nodes) {
		var ranges = AlgebraModel.groupNodeRanges(nodes);
		if (ranges.length === 0) return [];
		var data = ranges.map(function(range) {
			if (range.length === 1 && range[0].is_group('exponent')) {
				var exp0 = range[0].children[0];
				// if we have hidden brackets in there, ignore them
				if (exp0.is_group('brackets') && exp0.children[0].hidden) {
					exp0 = exp0.children[1];
				}
				return { range: range, exp: range[0]
					     , prod: range[0].get_parent(3) // exp->power->mul/div->prod/frac
					     , ascii: exp0.to_ascii() }
			} else {
				if (!range.every(function(node) { return node.is_group('mul','div') })) throw "wrong structure";
				return { range: range, exp: range[0].get_parent(3) // mul->prod->brackets->exp
				       , prod: range[0].get_parent(6) // mul->prod->brackets->exp->power->mul/div->prod/frac
				       , ascii: AlgebraModel.rangeToAsciiNoLeadingOp(range, true) }
			}
		});
		for (var i=0; i<data.length; i++) {
		  var d = data[i];
		  if (d.ascii !== data[0].ascii) return [];
		  if (!d.exp.is_group('exponent')) return [];
		  if ( !d.prod.is_group('fraction', 'product')
		  	|| d.prod !== data[0].prod) return [];
		  for (var j=i+1; j<data.length; j++) {
		    if (d.exp === data[j].exp) return [];
		  }
		}
		return data;
	}

	// Target ranges need to
	// 1) be in the same product
	// 2) be different from the already selected
	// 3) contain the same nodes
	CollectExponentsForFactoring.prototype
	.getTargetRangesInExponent = function(exp, structure) {
		var root = exp.get_root();
		if (!exp.is_group('exponent')) return [];
		var ascii = structure[0].ascii;
		for (var i=0; i<structure.length; i++) if (structure[i].exp === exp) return [];
		var matches = root.getRanges(ascii, null, exp.children);
		if (matches.length === 0) return [];
		// the ranges must be directly inside the exponent or a mul-block in a product
		// that is directly in the exponent to qualify
		matches = matches.filter(function(match) {
			var m0 = match[0];
			return (m0.parent === exp
				   || (m0.parent.is_group('brackets') && m0.ls.hidden && m0.get_parent(2) === exp)
				   || (m0.is_group('mul','div') && m0.get_parent(3) === exp)
				   || (m0.parent.is_group('mul') && m0.get_parent(4) === exp));
		});
		return matches.map(function(match) {
			if (match.length === 1) {
				if (match[0].parent.is_group('exponent', 'mul')) return [match[0].parent];
			}
			return match;
		});
	}

	return new CollectExponentsForFactoring();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.CollectExponentsForFactoring);
// This action is to remove terms from the exponent from a single power or range of powers in
// a product.
//
// Should do these things:
// (x^2) ==> (x)^2 (does not handle `x^2` without brackets)
// x^((2*3)/4) ==> (x^(2/4))^3
// (x^((2*3)/4)) ==> (x^(2/4))^3
// (x^2*y^2)/z^2 ==> ((x*y)/z)^2
// See the 'Moving exponents' section in test/math-engine/expressions/rewrite-test.js
// for more detailed cases and other related cases.
//
// The target box for triggering these actions is an outside box around the smallest range
// that includes the relevent terms.
// So in the case x^2*y*z^2 (two `^2` selected) the box will be around the whole product.
// In the case x^2*y^2*z (two `^2` selected) the box will be around
//   the two muls for the x and y powers.
//
// This action works in tandem with the CollectExponentsForFactoring action to have a good
// interaction.  This allows us to start by dragging one exponent and then end up with multiple
// ones in order to factor them all at once.  We also have to consider the case that the user
// wants to factor a power from a single term (if valid) even if multiple candidates are present.
// Because of this we have to make some choices about where to place the target boxes for each
// action.  Consider the following expression:
//
// x^2*y^(2*3)*z.
//
// Say we want to factor a power from the y^(2*3) term.
// If we want to factor out the `*3`, there are no additional candidates, so the target box is
// placed around this power only.
// If we want to factor out the `*2` from this and the `x^2` power, we must drag the `*2` onto
// the other exponent, which will make a target box around the range `x^2*y^(2*3)`.
// But, say we want to factor out the `*2` only from the y-power.  We want to allow for easy
// access to the other candidate 2.  Since we assume it's more likely the user wants to collect
// the other `^2`, we make the target box for factoring this single 2 larger, so the user has to
// more plainly signal intent of action.  We make the larger target box around the whole product,
// and use an additional margin to make it larger.


gmath.actions.FactorPowerAction =
(function() {

var FactorPowerAction = function(settings) {
  Action.call(this, "factor power");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = 'outside';
    this.scaleTargetBox = ('scaleTargetBox' in settings) ? settings.scaleTargetBox : 1.25;
  }
};

gmath.inherit(Action, FactorPowerAction);

FactorPowerAction.prototype.getAllAvailableActions = function(nodes) {
  var boundAction
     ,encompassingRange = this.getEncompassingRange(nodes);
  if (this.thereIsALonePower(nodes)) {
    boundAction = this.bindActionForLonePowerCases(nodes, encompassingRange.length-1);
  }
  else if (encompassingRange.length>0) {
    boundAction = this.bindActionForMultiplePowerCases(nodes, encompassingRange);
  }
  else {
    return [];
  }
  return boundAction;
}

FactorPowerAction.prototype.transform = function(callback) {

  if (Array.isArray(this.target)) {
    for (var i=0; i<this.target.length; i++) {
      this.addTouchedNodes(this.target[i]);
    }
  } else {
    this.addTouchedNodes(this.target); // this probably doesn't make sense but we'll go with it for now
  }

  var oldRanges = AlgebraModel.groupNodeRanges(this.nodes);
  var nodes = this.getNewTreeNode(this.nodes)
     ,ranges = AlgebraModel.groupNodeRanges(nodes);

  var mapTo;
  if (this.thereIsOneRange(ranges)) {
    mapTo = this.factorFromALonePower(nodes);
  } else {
    mapTo = this.factorFromMultiplePowers(ranges);
  }

  this.mapOldRangesToNewRange(oldRanges, mapTo);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

// for cases:
//   (x^y)
//   x^(2*3*...)
//   (x^(2*3*...))
// returns an array containing the exponent to which we will map the old range
FactorPowerAction.prototype.factorFromALonePower = function(nodes) {
  var term = this.extractRangeFromExponent(nodes);
  return this.wrapTermInPower(term, nodes);
}

FactorPowerAction.prototype.factorFromMultiplePowers = function(ranges) {
  var productFraction = this.getParentGroupOfPowers(ranges[0][0]);
  var mapTo;

  if (!this.productFractionHasUnaffectedTerms(productFraction, ranges)) {
    mapTo = this.performTransformationWithoutUnaffectedTerms(ranges, productFraction);
  } else {
    mapTo = this.performTransformationWithUnaffectedTerms(ranges, productFraction);    //, unaffectedTerms);
  }

  return mapTo;
}

FactorPowerAction.prototype.productFractionHasUnaffectedTerms = function(productFraction, ranges) {
  if (productFraction.is_group('product')) {
    return productFraction.children.length>ranges.length;
  } else {
    return productFraction.children.length-1>ranges.length;
  }
}

FactorPowerAction.prototype.performTransformationWithoutUnaffectedTerms = function(ranges, productFraction) {
  for (var i=0; i<ranges.length; i++) {
    this.extractRangeFromExponent(ranges[i]);
  }
  return this.wrapTermInPower(productFraction, ranges[0]);
}

FactorPowerAction.prototype.performTransformationWithUnaffectedTerms = function(ranges, productFraction) {
  var affectedTerms = this.getAffectedTerms(ranges);

  var idxForFactoredStructure = this.getIDXForFactoredStructure(affectedTerms);

  var affectedProd = this.putAffectedTermsIntoASeparateProduct(affectedTerms);

  var exp;
  if (affectedProd.is_group('product')) {
    productFraction.insert(idxForFactoredStructure, new MulDiv(affectedProd,
      (productFraction.is_group('fraction') && idxForFactoredStructure>productFraction.get_top().length) ?
      'div' : 'mul'));
    // We do this check because if the affected terms are all divs, we invert them when putting them into their
    // own product.  Although, we still want that "affected product" to be placed back into the denominator of
    // the original fraction.
  } else {
    // here since the affected product is actually a fraction, we have to completely split it away from the
    // original structure.
    var p = productFraction.parent
       ,idxForNewProduct = productFraction.remove();
    var newProduct = MulDiv.prototype.createGroup();
    newProduct.append(new MulDiv(productFraction));
    newProduct.append(new MulDiv(affectedProd));
    p.insert(idxForNewProduct, newProduct);
    this.cleanup(productFraction);
    this.cleanup(newProduct.children[0]);
  }

  for (var i=0; i<ranges.length; i++) {
    this.extractRangeFromExponent(ranges[i]);
  }
  exp = this.wrapTermInPower(affectedProd, ranges[0]);

  return exp;
}

/**
 * We want to put the factored structure in the first possible position, i.e. the index of the first
 * factored term.
 */
FactorPowerAction.prototype.getIDXForFactoredStructure = function(muldivs) {
  var firstMulDivIDX;
  for (var i=0; i<muldivs.length; i++) {
    var muldiv = muldivs[i]
       ,muldivIDX = muldiv.parent.children.indexOf(muldiv);
    if (!firstMulDivIDX && firstMulDivIDX!==0) firstMulDivIDX = muldivIDX;
    else if (muldivIDX < firstMulDivIDX) firstMulDivIDX = muldivIDX
  }
  return firstMulDivIDX;
}

FactorPowerAction.prototype.putAffectedTermsIntoASeparateProduct = function(affectedTerms) {
  var affectedProduct = MulDiv.prototype.createGroup();

  affectedTerms.forEach(function(term){term.remove()});


  if (affectedTerms.every(function(term){return term.is_group('div')})) {
    affectedTerms.forEach(function(term){term.invert()})
  }

  for (var i=0; i<affectedTerms.length; i++) {
    affectedProduct.append(affectedTerms[i]);
  }

  return affectedProduct;
}

FactorPowerAction.prototype.mapOldRangesToNewRange = function(oldRanges, newExponent) {
  for (var i=0; i<oldRanges.length; i++) {
    var oldRange = oldRanges[i];
    for (var j=0; j<oldRange.length; j++) {
      this.updateNodeMap(oldRange[j], newExponent);
    }
  }
}

// the range is either the entire exponent or a range of muldivs in a product in the exponent.
// this function takes out that range from the power and simplifies the power if necessary.
// returns what was left over from the power
FactorPowerAction.prototype.extractRangeFromExponent = function(range) {
  if (range[0].is_group('exponent')) {
    var p = range[0].parent.parent
       ,pow = range[0].parent
       ,base = pow.children[0]
       ,exp = range[0];
    var idx_for_base = pow.remove();
    base.remove();
    exp.remove();
    p.insert(idx_for_base, base);
    return base;
  } else {
    var pow = range[0].get_parent(4)
       ,exp = pow.children[1]
       ,br = exp.children[0]
       ,prod = br.children[1];
    Tree.remove_range(range);
    this.cleanup(prod);
    return pow;
  }
}

/**
 * This function takes a term (in a tree) and replaces it with a power.  The term is the base and the passed
 * range is the value of the exponent.  The passed range can be a single exponent group or 1 or more muldivs.
 * If the term was originally surrounded by a brackets group, we use that to surround the base, instead of
 * creating a new set of brackets.
 */
FactorPowerAction.prototype.wrapTermInPower = function(term, exponentTermsRange) {
  var base
     ,p
     ,idx_for_pow;
  if (term.parent.is_group('brackets')) {
    base = term.parent;
    p = base.parent;
    idx_for_pow = base.remove();
  } else {
    p = term.parent;
    idx_for_pow = term.remove();
    base = new Brackets(term);
  }

  var exp;
  var prod;
  if (exponentTermsRange[0].is_group('exponent')) {
    exp = exponentTermsRange[0];
  } else if (exponentTermsRange[0].is_group('mul') && exponentTermsRange.length===1) {
    exp = exponentTermsRange[0].children[1];
    exp.remove();
    exp = new Exponent(exp);
  } else {
    prod = MulDiv.prototype.createGroup();
    for (var i=0; i<exponentTermsRange.length; i++) {
      prod.append(exponentTermsRange[i]);
      exponentTermsRange[i].update_x_during_dragging = true;
      exponentTermsRange[i].update_y_during_dragging = true;
    }
    exp = new Exponent(prod);
  }

  var pow = new Power(base, exp);
  if (base.is_group('brackets')) base.simplify = true;
  p.insert(idx_for_pow, pow);
  Brackets.handle(pow);
  if (prod) this.cleanup(prod)

  return exp;
}

FactorPowerAction.prototype.getParentGroupOfPowers = function(expOrMul) {
  if (expOrMul.is_group('exponent')) return expOrMul.parent.parent.parent; // exp->pow->mul->prod
  else return expOrMul.parent.parent.parent.parent.parent.parent; // mul->prod->br->exp->pow->mul->prod
}

FactorPowerAction.prototype.getAffectedTerms = function(affectedExponentTermRanges) {
  var affectedTerms = [];
  for (var i=0; i<affectedExponentTermRanges.length; i++) {
    affectedTerms.push(this.getParentMulFromExponentTerm(affectedExponentTermRanges[i][0]));
  }
  return affectedTerms;
}

FactorPowerAction.prototype.getParentMulFromExponentTerm = function(affectedExponentTerm) {
  if (affectedExponentTerm.is_group('exponent')) return affectedExponentTerm.parent.parent; // exp->pow->mul
  else return affectedExponentTerm.parent.parent.parent.parent.parent; // mul->prod->br->exp->pow->mul
}

FactorPowerAction.prototype.thereIsOneRange = function(ranges) {
  return ranges.length===1;
}

FactorPowerAction.prototype.thereIsALonePower = function(nodes) {
  return (nodes.length===1 && nodes[0].is_group('exponent')) || this.allNodesAreMulsWithinSameProduct(nodes);
}

FactorPowerAction.prototype.allNodesAreMulsWithinSameProduct = function(nodes) {
  var prod;
  for (var i=0; i<nodes.length; i++) {
    var n = nodes[i];
    if (!n.is_group('mul','div')) return false;
    if (!prod) prod = n.parent;
    else if (n.parent!==prod) return false;
  }
  return true;
}

FactorPowerAction.prototype.bindActionForLonePowerCases = function(nodes, numberOfMatchingExponents) {
  var boundAction;
  var scaleTargetBox = 1.5;
  try {
    var n = nodes[0];
    if (n.is_group('exponent')) {
      var br = n.get_parent(2); // exp->pow->br
      if (br.is_group('brackets') && !br.parent.is_group('power')) {
        boundAction = this.createBoundAction(n.get_root()
                                            ,{nodes: nodes
                                             ,target: br});
      } else return [];
    } else if (n.is_group('mul','div')) {
      // test for: mul->prod->br->exp->pow->br/mul/div
      var exp_br = n.get_parent(2)
         ,exp = exp_br.get_parent(1)
         ,pow = exp.get_parent(1)
         ,p = pow.get_parent(1);
      if (!exp_br.is_group('brackets') || !exp.is_group('exponent') || !pow.is_group('power')) return [];
      var target;
      if (!p.is_group('brackets', 'mul', 'div')) target = pow;
      else if (p.is_group('brackets') && !p.parent.is_group('power')) target = p;
      else if (p.is_group('mul', 'div') && numberOfMatchingExponents>0) {
        scaleTargetBox = 2; // here we really need the margin
        target = p.parent;
      }
      else if (p.is_group('mul', 'div') && numberOfMatchingExponents<=0) target = pow;
      else return [];
      boundAction = this.createBoundAction(n.get_root()
                                          ,{nodes: nodes
                                           ,target: target
                                           ,scaleTargetBox: scaleTargetBox ? scaleTargetBox : 0});
    } else return [];
  } catch (err) {
    if (err === 'invalid path') return [];
    else throw err;
  }
  return [boundAction];
}

FactorPowerAction.prototype.bindActionForMultiplePowerCases = function(nodes, encompassingRange) {
  var boundAction;
  if (encompassingRange.length===0) return [];
  var target = this.getBestTarget(encompassingRange);
  boundAction = [this.createBoundAction(nodes[0].get_root()
                                      ,{nodes: nodes
                                       ,target: target})];
  return boundAction;
}

// The encompassing range is the smallest range (of muldivs) in the overall product that contains all dragged nodes.
// Or, it is the range of dragged terms in the exponent in the case that there is only one power.
// If this function returns the empty list, the tree has an invalid structure for this action
FactorPowerAction.prototype.getEncompassingRange = function(nodes) {
  var root = nodes[0].get_root()
    , self = this;

  try {
    var structure = this.analyzeNodeStructure(nodes);
    if (structure.length === 0) return [];
    var prod = structure[0].prod
       ,releventNodes = [];
    for (var i=0; i<prod.children.length; i++) {
      try {
        var exp = prod.get_child([i, 1, 1]); // prod->muldiv->power->exp
        var ts = this.getTargetRangesInExponent(exp, structure);
        ts.forEach(function(x) {releventNodes = releventNodes.concat(x)});
      } catch(err) {
        if (err !== 'invalid path') throw err;
      }
    }
    return Tree.nodes_to_range(releventNodes);
  } catch (err) {
    if (err !== 'invalid path' && err !== "wrong structure") throw err;
  }
  return [];
}

// Each node range must be:
// 1) a single exponent, or a single or range of mul-blocks inside an exponent
// 2) all those exponents must be different
// 3) all power groups must be inside the same product or fraction
// 4) all ranges must have the same ascii representation
FactorPowerAction.prototype.analyzeNodeStructure = function(nodes) {
  var ranges = AlgebraModel.groupNodeRanges(nodes);
  if (ranges.length === 0) return [];
  var data = ranges.map(function(range) {
    if (range.length === 1 && range[0].is_group('exponent')) {
      var exp0 = range[0].children[0];
      // if we have hidden brackets in there, ignore them
      if (exp0.is_group('brackets') && exp0.children[0].hidden) {
        exp0 = exp0.children[1];
      }
      return { range: range, exp: range[0]
             , prod: range[0].get_parent(3) // exp->power->mul/div->prod/frac
             , ascii: exp0.to_ascii() }
    } else {
      if (!range.every(function(node) { return node.is_group('mul','div') })) throw "wrong structure";
      return { range: range, exp: range[0].get_parent(3) // mul/div->prod->brackets->exp
             , prod: range[0].get_parent(6) // mul->prod->brackets->exp->power->mul/div->prod/frac
             , ascii: AlgebraModel.rangeToAsciiNoLeadingOp(range, true) }
    }
  });
  for (var i=0; i<data.length; i++) {
    var d = data[i];
    if (d.ascii !== data[0].ascii) return [];
    if (!d.exp.is_group('exponent')) return [];
    if ( !d.prod.is_group('fraction', 'product')
      || d.prod !== data[0].prod) return [];
    for (var j=i+1; j<data.length; j++) {
      if (d.exp === data[j].exp) return [];
    }
  }
  return data;
}

// Target ranges need to
// 1) be in the same product
// 3) contain the same nodes
FactorPowerAction.prototype.getTargetRangesInExponent = function(exp, structure) {
  var root = exp.get_root();
  if (!exp.is_group('exponent')) return [];
  var ascii = structure[0].ascii;
  // for (var i=0; i<structure.length; i++) if (structure[i].exp === exp) return [];
  var matches = root.getRanges(ascii, null, exp.children);
  if (matches.length === 0) return [];
  // the ranges must be directly inside the exponent or a mul-block in a product
  // that is directly in the exponent to qualify
  matches = matches.filter(function(match) {
    var m0 = match[0];
    return (m0.parent === exp
         || (m0.parent.is_group('brackets') && m0.ls.hidden && m0.get_parent(2) === exp)
         || (m0.is_group('mul','div') && m0.get_parent(3) === exp)
         || (m0.parent.is_group('mul','div') && m0.get_parent(4) === exp));
  });
  return matches.map(function(match) {
    if (match.length === 1) {
      if (match[0].parent.is_group('exponent', 'mul')) return [match[0].parent];
    }
    return match;
  });
}

// If we are in a situation where the dragged terms account for every term in the product, and that product is in brackets:
//   the target should be the brackets so we have to move the dragged terms outside the brackets to trigger the action.
// If we are in a situation where the dragged terms do not account for every term in the product:
//   we want the target to be the "encompassing range."
FactorPowerAction.prototype.getBestTarget = function(encompassingRange) {
  var bestTarget;
  var group = encompassingRange[0].parent;
  if (group.is_group('product') && group.children.length>encompassingRange.length
      || group.is_group('fraction') && group.children.length-1>encompassingRange.length) {
    bestTarget = encompassingRange;
  } else {
    var br = encompassingRange[0].parent.parent;
    if (br.is_group('brackets') && !br.children[0].hidden) bestTarget = br;
    else bestTarget = encompassingRange[0].parent;
  }
  return bestTarget;
}

return new FactorPowerAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.FactorPowerAction);
gmath.actions.DistributePowerAction =
(function() {

	var DistributePowerAction = function(settings) {
		Action.call(this, "distribute power");
		if (settings) {
			this.nodes = settings.nodes;
			this.target = settings.target;
			this.side = settings.side;
		}
	};

	gmath.inherit(Action, DistributePowerAction);

	/// Returns an array of bound actions, one for each possible target of
	/// 'nodes' in the tree they are in.
	DistributePowerAction.prototype.getAllAvailableActions = function(nodes) {
		var root = nodes[0].get_root();
		var base, pow, exp;
		try {
			if (this.nodesAreASingleExponent(nodes)) {
				exp = nodes[0]; pow = exp.parent; base = pow.children[0];
			} else if (this.nodesAreAllMulDivs(nodes) && this.nodesAreAConsecutiveRange(nodes)) {
				exp = nodes[0].get_parent(3); pow = exp.get_parent(1); base = pow.children[0];
			} else {
				return [];
			}
		} catch (err) {
			if (err !== 'invalid path') throw err;
			return [];
		}

		if (!exp.is_group('exponent') || !pow.is_group('power') || !base.is_group('brackets')) {
			return [];
		}

		var base = base.children[1];
		if (base.is_group() && !base.is_group('power') && !base.is_group('brackets') && !base.is_group('product') && !base.is_group('fraction'))
			return [];

		return [this.createBoundAction(root, { nodes: nodes,
			target: base,
			side: 'inside'})];
	}

	DistributePowerAction.prototype.transform = function(callback) {

		var exponent = this.getNewTreeNode(this.nodes[0].is_group('exponent') ? this.nodes[0] : this.nodes[0].parent.parent.parent);
		var range = this.getNewTreeNode(this.nodes);
		var target = this.getNewTreeNode(this.target);
		var power = exponent.parent;
		var powerParent = power.parent;

		this.addTouchedNodes(this.getOldTreeNode(power));

		Tree.remove_range(range);

		var all_nodes;
		// store the relevent nodes to which we map the dragged exponent
		// if the target is a product/fraction
		//   all_nodes will be the muldivs
		//   target will be the product
		// if the target is not a product/fraction
		//   all_nodes will be the power (new or existing)
		//   target will be the power (same as all_nodes)
		if (target.is_group('product') || target.is_group('fraction')) {
			all_nodes = target.get_top().concat(target.get_bottom());
			this.applyPowersToMulDivs(all_nodes, range);
		} else {
			all_nodes = [this.applyPowerToSingleTerm(target, range)];
			target = all_nodes[0];
		}

		if (power.children[1]) {
			this.cleanup(power.children[1].children[0].children[1]); // pow->exp->br->prod
			Brackets.handle(power.children[1].children[0], true);
		} else {
			var idx = power.remove();
			var br = new Brackets(target);
			powerParent.insert(idx, br);
			br.simplify = true;
		}

		if (typeof(callback) === 'function') callback(this);
		else return true;
	}

	DistributePowerAction.prototype.nodesAreASingleExponent = function(nodes) {
	 	return nodes.length===1 && nodes[0].is_group('exponent');
	}

	DistributePowerAction.prototype.nodesAreAllMulDivs = function(nodes) {
		for (var i=0; i<nodes.length; i++) {
			if (!nodes[i].is_group('mul','div')) return false;
		}
		return true;
	}

	DistributePowerAction.prototype.nodesAreAConsecutiveRange = function(nodes) {
		if (nodes.length===1) return true;
		var n = nodes[0];
		for (var i=1; i<nodes.length; i++) {
			if (n.rs!==nodes[i] || n!==nodes[i].ls) return false;
			n = nodes[i];
		}
		return true;
	}

	DistributePowerAction.prototype.applyPowersToMulDivs = function(muldivs, range) {
		for (var i = 0; i < muldivs.length; i++) {
			var value = muldivs[i].children[1];
			var powerGroup = this.applyPowerToSingleTerm(value, range);
		}
	}

	DistributePowerAction.prototype.applyPowerToSingleTerm = function(term, range) {
		var powerGroup;
		if (term.is_group('power')) {
			powerGroup = this.applyPowerToPower(term, range);
		} else {
			powerGroup = this.applyPowerToNonPower(term, range);
		}
		return powerGroup;
	}

	// DistributePowerAction.prototype.applyPowerToPower = function(term, range) {
	// 	var powerGroup = term;
	// 	var expVal = powerGroup.children[1].children[0];
	// 	expVal.remove();
	// 	expVal = this.takeContentsOfBrackets(expVal);
	// 	var clonedExpVal = Tree.clone(exponent.children[0]);
	// 	clonedExpVal = this.takeContentsOfBrackets(clonedExpVal);
	// 	var insertion = new MulDiv(clonedExpVal);
	// 	var map_to = clonedExpVal.is_group('product') ? clonedExpVal.children : insertion;
	// 	var prod = MulDiv.prototype.createGroup();
	// 	prod.append(new MulDiv(expVal));
	// 	prod.append(insertion);
	// 	powerGroup.children[1].append(prod);
	// 	Brackets.handle(prod);
	// 	this.cleanup(prod.children[0]);
	// 	this.cleanup(prod.children[1]);
	// 	this.extendNodeMap(this.nodes[0], map_to);
	// 	return powerGroup;
	// }

	DistributePowerAction.prototype.applyPowerToPower = function(term, range) {
		var powerGroup = term;
		var clonedRange = Tree.clone(range);
		var mapTo = this.extendPowerWithSelectedExponentTerms(powerGroup, clonedRange);
		this.extendNodeMap(this.nodes[0], mapTo);
		this.updateXAndYDuringDragging(mapTo);
		return powerGroup;
	}

	DistributePowerAction.prototype.applyPowerToNonPower = function(term, range) {
		var p
	     ,idx;
	  p = term.parent;
	  idx = term.remove();
	  var exponent;
	  if (range[0].is_group('exponent')) exponent = Tree.clone(range[0]);
	  else {
	  	var prod = MulDiv.prototype.createGroup()
	  	   ,clonedRange = Tree.clone(range);
	  	this.appendAllContentsToProduct(prod, clonedRange);
	  	exponent = new Exponent(prod);
	  }
		var powerGroup = new Power(term, exponent);
		p.insert(idx, powerGroup);
		if (prod) {
			this.cleanup(prod);
			Brackets.handle(exponent.children[0], true);
		}
		this.extendNodeMap(this.nodes[0], powerGroup.children[1]);
		this.updateXAndYDuringDragging(powerGroup);
		return powerGroup;
	}

	DistributePowerAction.prototype.takeContentsOfBrackets = function(brackets) {
		if (brackets.is_group('brackets')) {
			brackets = brackets.children[1];
			brackets.remove();
		}
		return brackets;
	}

	DistributePowerAction.prototype.extendPowerWithSelectedExponentTerms = function(power, nodes) {
		var exp = power.children[1];
		var prod = MulDiv.prototype.createGroup()
		   ,contentMuls = this.getContentMulsFromExponent(exp);

		var nodesContents = nodes[0].is_group('exponent') ? this.getContentMulsFromExponent(nodes[0]) : nodes;

		this.appendAllContentsToProduct(prod, contentMuls);
		this.appendAllContentsToProduct(prod, nodesContents);

		exp.append(prod);
		this.cleanup(prod);
		Brackets.handle(prod, true);

		return nodesContents;
	}

	DistributePowerAction.prototype.appendAllContentsToProduct = function(product, contents) {
		for (var i=0; i<contents.length; i++) {
			product.append(contents[i]);
		}
	}

	// If the exponent contains a product, then  this will return that product's children.
	// If the exponent is anything else, it will return that thing appropriately wrapped in a muldiv.
	// This removes the relevent nodes from the tree.
	DistributePowerAction.prototype.getContentMulsFromExponent = function(exponent) {
		var val = exponent.children[0];
		if (val.is_group('brackets') && val.children[0].hidden && val.children[1].is_group('product')) {
			var range = val.children[1].children.slice();
			Tree.remove_range(val.children[1].children);
			val.remove();
			return range;
		} else if (val.is_group('brackets') && val.children[0].hidden) {
			var expr = val.children[1];
			expr.remove();
			val.remove();
			return [new MulDiv(expr)];
		} else {
			val.remove();
			return [new MulDiv(val)];
		}
	}

	DistributePowerAction.prototype.updateXAndYDuringDragging = function(nodes) {
	  var ls;
	  if (!Array.isArray(nodes)) ls = [nodes];
	  else ls = nodes.slice();
	  for (var i=0; i<ls.length; i++) {
	    ls[i].update_x_during_dragging = true;
	    ls[i].update_y_during_dragging = true;
	  }
	}

	return new DistributePowerAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.DistributePowerAction);gmath.actions.combineStackedExponentsUpAction =
(function() {

var combineStackedExponentsUpAction = function(settings) {
	Action.call(this, 'combine stacked exponents up');
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.side = 'around';
		this.scaleTargetBox = 1.5;
	}
};

gmath.inherit(Action, combineStackedExponentsUpAction);

combineStackedExponentsUpAction.prototype.getAllAvailableActions = function(nodes) {
	if (nodes.length<1) return [];
	if (!this.validStructure(nodes)) return [];
	var baseOfOuterPower = this.getBaseOfOuterPowerFromInnerExponentTerm(nodes);
	var exponent = baseOfOuterPower.parent.children[1];
	var boundAction = [this.createBoundAction(nodes[0].get_root()
		                                       ,{nodes: nodes
		                                        ,target: exponent})];
	return boundAction;
}

combineStackedExponentsUpAction.prototype.transform = function(callback) {

	var nodes = this.getNewTreeNode(this.nodes)
	  , exponentOfOuterPower = this.getNewTreeNode(this.target)
	  , baseOfOuterPower = exponentOfOuterPower.parent.children[0];

	this.addTouchedNodes(this.target.parent);

	this.extractSelectedExponentTermsFromInnerPower(nodes);

	var mapTo = this.extendOuterExponentWithSelectedExponentTerms(baseOfOuterPower, nodes);

	this.mapSelectedExponentsTermsToNewExponentTerms(this.nodes, mapTo);

	baseOfOuterPower.simplify = true;

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

combineStackedExponentsUpAction.prototype.validStructure = function(nodes) {
	if (this.nodesAreASingleExponent(nodes)) {
		return this.termsBelongToAPowerWithinAPower(nodes);
	}	else if (this.nodesAreAllMulDivs(nodes) && this.nodesAreAConsecutiveRange(nodes)) {
		return this.termsBelongToAPowerWithinAPower(nodes);
	}	else return false;
}

combineStackedExponentsUpAction.prototype.nodesAreASingleExponent = function(nodes) {
 	return nodes.length===1 && nodes[0].is_group('exponent');
}

combineStackedExponentsUpAction.prototype.nodesAreAllMulDivs = function(nodes) {
	for (var i=0; i<nodes.length; i++) {
		if (!nodes[i].is_group('mul','div')) return false;
	}
	return true;
}

combineStackedExponentsUpAction.prototype.nodesAreAConsecutiveRange = function(nodes) {
	if (nodes.length===1) return true;
	var n = nodes[0];
	for (var i=1; i<nodes.length; i++) {
		if (n.rs!==nodes[i] || n!==nodes[i].ls) return false;
		n = nodes[i];
	}
	return true;
}

combineStackedExponentsUpAction.prototype.termsBelongToAPowerWithinAPower = function(nodes) {
	try {
		var innerExp, innerPow, br, outerPow;
		if (nodes[0].is_group('exponent')) {
			innerExp = nodes[0];
			innerPow = innerExp.get_parent(1);
			br = innerPow.get_parent(1);
			outerPow = br.get_parent(1);
			if (!innerPow.is_group('power') || !br.is_group('brackets') || !outerPow.is_group('power')) return false;
		} else {
			innerExp = nodes[0].get_parent(3);
			innerPow = innerExp.get_parent(1);
			br = innerPow.get_parent(1);
			outerPow = br.get_parent(1);
			if (!innerExp.is_group('exponent') || !innerPow.is_group('power') || !br.is_group('brackets') || !outerPow.is_group('power')) return false;
		}
	} catch (err) {
		if (err !== 'invalid path') throw err;
		return false;
	}
	return true;
}

combineStackedExponentsUpAction.prototype.getBaseOfOuterPowerFromInnerExponentTerm = function(nodes) {
	if (nodes[0].is_group('exponent')) return nodes[0].get_parent(2); // exp->pow->br(base)
	else return nodes[0].get_parent(5); // mul->prod->br->exp->pow->br(base)
}

// If nodes is an exponent, remove the exponent, convert the power into the base only.
// If nodes is a range of muldivs, remove them from the product (in the exp).
combineStackedExponentsUpAction.prototype.extractSelectedExponentTermsFromInnerPower = function(nodes) {
	if (nodes[0].is_group('exponent')) {
		var pow = nodes[0].parent
		   ,exp = nodes[0]
		   ,base = pow.children[0]
		   ,p = pow.parent;
		var idx_for_base = pow.remove();
		base.remove();
		exp.remove();
		p.insert(idx_for_base, base);
	} else {
		var prod = nodes[0].parent
		   ,br = prod.parent;
		Tree.remove_range(nodes);
		this.cleanup(prod);
	}
}

combineStackedExponentsUpAction.prototype.extendOuterExponentWithSelectedExponentTerms = function(baseOfOuterPower, nodes) {
	var outerPower = baseOfOuterPower.parent
	   ,outerExp = outerPower.children[1];
	var prod = MulDiv.prototype.createGroup()
	   ,contentMuls = this.getContentMulsFromExponent(outerExp);

	var nodesContents = nodes[0].is_group('exponent') ? this.getContentMulsFromExponent(nodes[0]) : nodes;

	this.appendAllContentsToProduct(prod, contentMuls);
	this.appendAllContentsToProduct(prod, nodesContents);

	outerExp.append(prod);
	this.cleanup(prod);
	Brackets.handle(prod);

	return nodesContents;
}

combineStackedExponentsUpAction.prototype.appendAllContentsToProduct = function(product, contents) {
	for (var i=0; i<contents.length; i++) {
		product.append(contents[i]);
		contents[i].update_x_during_dragging = true;
		contents[i].update_y_during_dragging = true;
	}
}

// If the exponent contains a product, then  this will return that product's children.
// If the exponent is anything else, it will return that thing appropriately wrapped in a muldiv.
// This removes the relevent nodes from the tree.
combineStackedExponentsUpAction.prototype.getContentMulsFromExponent = function(exponent) {
	var val = exponent.children[0];
	if (val.is_group('brackets') && val.children[0].hidden && val.children[1].is_group('product','fraction')) {
		var range = val.children[1].children.slice();
		Tree.remove_range(val.children[1].children);
		val.remove();
		return range;
	} else if (val.is_group('brackets') && val.children[0].hidden) {
		var expr = val.children[1];
		expr.remove();
		val.remove();
		return [new MulDiv(expr)];
	} else {
		val.remove();
		return [new MulDiv(val)];
	}
}

combineStackedExponentsUpAction.prototype.mapSelectedExponentsTermsToNewExponentTerms = function(nodes, mapTo) {
	for (var i=0; i<nodes.length; i++) {
		for (var j=0; j<mapTo.length; j++) {
			if (j===0)
				this.updateNodeMap(nodes[i],mapTo[j]);
			else
				this.extendNodeMap(nodes[i],mapTo[j]);
		}
	}
}

return new combineStackedExponentsUpAction();
})();

AlgebraModel.prototype.move_actions.push(gmath.actions.combineStackedExponentsUpAction);
gmath.actions.PowerFactorAndCombineStackedExponentsAction =
(function(){

var PowerFactorAndCombineStackedExponentsAction = function(settings) {
	Action.call(this, 'factor power and combine stacked exponent up');
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.side = settings.side;
	}
}

gmath.inherit(Action, PowerFactorAndCombineStackedExponentsAction);

PowerFactorAndCombineStackedExponentsAction.prototype.getAllAvailableActions = function(nodes) {
	if (nodes.length<2) return [];
	var actions = gmath.actions.FactorPowerAction.getAllAvailableActions(nodes);
	if (actions.length===0) return [];
	var action = actions[0];
	if (Array.isArray(action.target)) return [];
	if (!action.target.is_group('brackets')) return [];
	if (!action.target.parent.is_group('power')) return [];
	var outerExponent = action.target.parent.children[1];
	var boundAction = this.createBoundAction(nodes[0].get_root()
	                                        ,{nodes: nodes
	                                         ,target: outerExponent
	                                         ,side: 'inside'});
	return [boundAction];
}

PowerFactorAndCombineStackedExponentsAction.prototype.doInPlace = function(callback) {
	this.initNodeMap();

	var pow = this.target.parent; // exp->pow
	this.addTouchedNodes(pow);

	var nodes = this.getNewTreeNode(this.nodes);
	var factorPowerAction = gmath.actions.FactorPowerAction.getAllAvailableActions(nodes)[0];
	factorPowerAction.doInPlace();
	this.compose(factorPowerAction);

	var nnodes = factorPowerAction.mapNodes(nodes);

	var combineStackedExponentsUp = gmath.actions.combineStackedExponentsUpAction.getAllAvailableActions(nnodes)[0];
	combineStackedExponentsUp.doInPlace();
	this.compose(combineStackedExponentsUp);

	pow = this.mapNodes(pow)[0];
	Brackets.handle(pow.children[0], true); // remove the double brackets introduced
	                                        // by the factorPowerAction

	this.removeDeletedNodesFromNodeMap();

	if (typeof(callback) === 'function') callback(this);
	else return true;
}

return new PowerFactorAndCombineStackedExponentsAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.PowerFactorAndCombineStackedExponentsAction);
(function () {

var polynomialExpansionAction = function(settings) {
	Action.call(this, 'polynomial expansion');
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
}

gmath.inherit(Action, polynomialExpansionAction);

polynomialExpansionAction.prototype.match = function(node) {
	if (!node.is_group('exponent')) return false;
	if (!node.children[0] || !Num.is_num(node.children[0])) return false;
	if (Num.get_value(node.children[0])!==2 && Num.get_value(node.children[0])!==3) return false;
	var power = node.parent
	   ,base = power.children[0];
	if (!base.is_group('brackets')) return false;
	if (!base.children[1].is_group('sum')) return false;
	return true;
}

polynomialExpansionAction.prototype.transform = function(callback) {
	var node = this.getNewTreeNode(this.actor);

	this.addTouchedNodes(this.actor);

	var power = node.parent;
	var structure = this.analyzeStructure(node);

	var addendsForExpandedPolynomial = this.formAddendsForExpandedPolynomial(structure);

	addendsForExpandedPolynomial.sort(function(a, b) {
		if (a.firstOrder===b.firstOrder && a.degreeOfFirstOrder>=b.degreeOfFirstOrder) return 0;
		if (a.firstOrder===b.firstOrder && a.degreeOfFirstOrder<b.degreeOfFirstOrder) return 1;
		if (a.firstOrder<b.firstOrder) return -1;
		if (a.firstOrder>b.firstOrder) return 1;
	})

	this.replacePowerWithExpandedPolynomialSum(power, addendsForExpandedPolynomial);

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

polynomialExpansionAction.prototype.analyzeStructure = function(exponent) {
	var structure = {};

	var power = exponent.parent
	   ,base = power.children[0]
	   ,sum = base.children[1];

	structure.degree = Num.get_value(exponent.children[0]);
	structure.terms = sum.children.slice();

	return structure;
}

polynomialExpansionAction.prototype.formAddendsForExpandedPolynomial = function(structure) {
	var addends;

	if (structure.degree===2) {
		addends = this.formAddendsForDegreeOfTwo(structure.terms);
	} else if (structure.degree===3) {
		addends = this.formAddendsForDegreeOfThree(structure.terms);
	}

	return addends;
}

polynomialExpansionAction.prototype.formAddendsForDegreeOfTwo = function(terms) {
	var addends = [];

	for (var i=0; i<terms.length; i++) {
		var t = terms[i].children[1]
		   ,clone = Tree.clone(t);
		this.extendNodeMap(this.getOldTreeNode(t).get_mapping_to(clone));

		var term = {};
		term.addend = new AddSub(new Power(clone, new Num(2)));
		term.firstOrder = i;
		term.degreeOfFirstOrder = 2;
		addends.push(term);
	}

	for (var i=0; i<terms.length-1; i++) {
		for (var j=i+1; j<terms.length; j++) {

			var product = MulDiv.prototype.createGroup();
			product.append(new MulDiv(new Num(2)));

			var addend_should_be_sub = 0;

			var t1 = terms[i].children[1]
			   ,clone1 = Tree.clone(t1);
			this.extendNodeMap(this.getOldTreeNode(t1).get_mapping_to(clone1));
			if (terms[i].is_group('sub')) addend_should_be_sub = (addend_should_be_sub+1)%2;

			var t2 = terms[j].children[1]
			   ,clone2 = Tree.clone(t2);
			this.extendNodeMap(this.getOldTreeNode(t2).get_mapping_to(clone2));
			if (terms[j].is_group('sub')) addend_should_be_sub = (addend_should_be_sub+1)%2;

			if (Num.get_value(clone1)!==1) product.append(new MulDiv(clone1));
			if (Num.get_value(clone2)!==1) product.append(new MulDiv(clone2));

			var term = {};
			term.addend = new AddSub(product, addend_should_be_sub ? 'sub' : 'add');
			term.firstOrder = i;
			term.degreeOfFirstOrder = 1;
			addends.push(term);
		}
	}

	return addends;
}

polynomialExpansionAction.prototype.formAddendsForDegreeOfThree = function(terms) {
	var addends = [];

	for (var i=0; i<terms.length; i++) {
		var t = terms[i].children[1]
		   ,clone = Tree.clone(t);
		this.extendNodeMap(this.getOldTreeNode(t).get_mapping_to(clone));

		var term = {};
		term.addend = new AddSub(new Power(clone, new Num(3)), terms[i].value);
		term.firstOrder = i;
		term.degreeOfFirstOrder = 3;
		addends.push(term);
	}

	for (var i=0; i<terms.length-1; i++) {
		for (var j=i+1; j<terms.length; j++) {
			var t1 = terms[i].children[1]
			   ,t2 = terms[j].children[1];

			var clone1_1 = Tree.clone(t1)
			   ,clone2_1 = Tree.clone(t2);
			this.extendNodeMap(this.getOldTreeNode(t1).get_mapping_to(clone1_1));
			this.extendNodeMap(this.getOldTreeNode(t2).get_mapping_to(clone2_1));

			var product1 = MulDiv.prototype.createGroup();
			product1.append(new MulDiv(new Num(3)));
			product1.append(new MulDiv(new Power(clone1_1, new Num(2))));
			if (Num.get_value(clone2_1)!==1) product1.append(new MulDiv(clone2_1));

			var term1 = {};
			term1.addend = new AddSub(product1, t2.parent.value);
			term1.firstOrder = i;
			term1.degreeOfFirstOrder = 2;
			addends.push(term1);

			var clone1_2 = Tree.clone(t1)
			   ,clone2_2 = Tree.clone(t2);
			this.extendNodeMap(this.getOldTreeNode(t1).get_mapping_to(clone1_2));
			this.extendNodeMap(this.getOldTreeNode(t2).get_mapping_to(clone2_2));

			var product2 = MulDiv.prototype.createGroup();
			product2.append(new MulDiv(new Num(3)));
			if (Num.get_value(clone1_2)!==1) product2.append(new MulDiv(clone1_2));
			product2.append(new MulDiv(new Power(clone2_2, new Num(2))));

			var term2 = {};
			term2.addend = new AddSub(product2, t1.parent.value);
			term2.firstOrder = i;
			term2.degreeOfFirstOrder = 1;
			addends.push(term2);
		}
	}

	for (var i=0; i<terms.length-2; i++) {
		for (var j=i+1; j<terms.length-1; j++) {
			for (var k=j+1; k<terms.length; k++) {
				var t1 = terms[i].children[1]
				   ,t2 = terms[j].children[1]
				   ,t3 = terms[k].children[1];

				var clone1 = Tree.clone(t1)
				   ,clone2 = Tree.clone(t2)
				   ,clone3 = Tree.clone(t3);

				this.extendNodeMap(this.getOldTreeNode(t1).get_mapping_to(clone1));
				this.extendNodeMap(this.getOldTreeNode(t2).get_mapping_to(clone2));
				this.extendNodeMap(this.getOldTreeNode(t3).get_mapping_to(clone3));

				var product = MulDiv.prototype.createGroup();
				product.append(new MulDiv(new Num(6)));
				if (Num.get_value(clone1)!==1) product.append(new MulDiv(clone1));
				if (Num.get_value(clone2)!==1) product.append(new MulDiv(clone2));
				if (Num.get_value(clone3)!==1) product.append(new MulDiv(clone3));

				var addend_should_be_sub = 0;
				if (terms[i].is_group('sub')) addend_should_be_sub = (addend_should_be_sub+1)%2;
				if (terms[j].is_group('sub')) addend_should_be_sub = (addend_should_be_sub+1)%2;
				if (terms[k].is_group('sub')) addend_should_be_sub = (addend_should_be_sub+1)%2;

				var term = {};
				term.addend = new AddSub(product, addend_should_be_sub ? 'sub' : 'add');
				term.firstOrder = i;
				term.degreeOfFirstOrder = 1;
				addends.push(term);
			}
		}
	}

	return addends;
}

polynomialExpansionAction.prototype.replacePowerWithExpandedPolynomialSum = function(power, addends) {
	var p = power.parent
	   ,idxForExpandedPolynomial = power.remove();

	var expandedPolynomial = AddSub.prototype.createGroup();

	for (var i=0; i<addends.length; i++) {
		expandedPolynomial.append(addends[i].addend);
	}

	p.insert(idxForExpandedPolynomial, expandedPolynomial);

	this.applyPowers(addends);
	this.cleanupAddends(addends);

	Brackets.handle(expandedPolynomial, true);
	this.cleanup_cascade(expandedPolynomial.parent);
}

polynomialExpansionAction.prototype.applyPowers = function(addends) {
	for (var i=0; i<addends.length; i++) {
		// since we use this function semi-recursively (see the else branch), the list of addends passed in may either be the constructed term objects containing an addend
		// field or the children of a product, which have no 'addend' field.
		var term = addends[i].addend ? addends[i].addend.children[1] : addends[i].children[1];
		if (term.is_group('power')) {
			this.applyPower(addends[i].addend ? addends[i].addend : addends[i]);
		} else if (term.is_group('product')) {
			this.applyPowers(term.children.slice());
		}
	}
}

polynomialExpansionAction.prototype.applyPower = function(addend) {
	var power = addend.children[1]
	   ,base = power.children[0]
	   ,exponent = power.children[1];

	var distributionAction = gmath.actions.DistributePowerAction.getAllAvailableActions([exponent]);
	if (distributionAction.length>0) {
		distributionAction[0].doInPlace();
		this.compose(distributionAction[0]);
		if (addend.children[1].is_group('brackets')) {
			var contents = addend.children[1].children[1];
			contents.remove();
			addend.children[1].remove();
			addend.append(contents);
		}
	}

	var applyMe = distributionAction[0] ? distributionAction[0].mapNodes(exponent) : [exponent];
	for (var i=0; i<applyMe.length; i++) {
		var actionClass = applyMe[i].getBestMatchingAction();
		if (actionClass && actionClass.name!=='polynomial expansion') {
			var action = actionClass.createBoundAction(this.newTree, {actor: applyMe[i]});
			action.doInPlace();
			this.compose(action);
		}
	}
}

polynomialExpansionAction.prototype.cleanupAddends = function(addends) {
	for (var i=0; i<addends.length; i++) {
		if (addends[i].addend.children[1].is_group('product')) {
			var cleanMe = addends[i].addend.children[1].children.slice();
			for (var j=0; j<cleanMe.length; j++) {
				this.cleanup(cleanMe[j]);
			}
		}
	}
}

Exponent.prototype.add_action_handler(new polynomialExpansionAction());

})();
/**
 * This is a helper action that can be appended to other actions. It is
 * synchoronous. It will get rid of a product as a direct child of a mul
 * block.
 */

;(function() {

var MulDivCleanup = function(settings) {
  Action.call(this, 'muldiv cleanup action');
  if (settings) this.muldiv = settings.actor;
}

gmath.inherit(Action, MulDivCleanup);

MulDivCleanup.prototype.match = function(node) {
  if (MulDivCleanup.hasProductChild(node)) return true;
  if (node.parent.cleanupAction && node.parent.cleanupAction.match(node.parent)) return true;
  return false;
}

MulDivCleanup.hasProductChild = function(node) {
  return ((node.is_group('mul') || node.is_group('div')) &&
           node.children[1] &&
           node.children[1].is_group('product'))
}

MulDivCleanup.prototype.doInPlace = function(callback) {
  this.initNodeMap();
  var node = this.getNewTreeNode(this.muldiv);
  var parent = node.parent;

  if (MulDivCleanup.hasProductChild(node)) {
    var nested = node.children[1];
    var idx = Tree.remove(node);
    this.updateNodeMap(this.muldiv, parent);
    if (this.muldiv.is_group('div')) nested.children.forEach(function(n) {n.invert()});
    parent.insert_range(idx, nested.children);
  }

  this.cleanup(parent);

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

MulDiv.prototype.cleanupAction = new MulDivCleanup();

})();
// Copyright Erik Weitnauer 2013.

gmath.actions.MultiplyNumbersAction =
(function () {

var MultiplyNumbersAction = function(settings) {
	Action.call(this, 'Multiply numbers');
  this.is_join_action = true;
	if (settings) {
    if (settings.interactionType==='drag') {
      this.interactionType = settings.interactionType;
      this.delay = 250;
      this.scaleTargetBoxX = 0.5;
      this.side = 'inside';
      this.nodes = settings.nodes;
      this.target = settings.target;
    } else {
      this.actor = settings.actor;
    }
  }
};

gmath.inherit(Action, MultiplyNumbersAction);

MultiplyNumbersAction.prototype.getAllAvailableActions = function(nodes) {
  if (nodes.length > 1) return [];
  if (!nodes[0].is_group('mul')) return [];
  if (!Num.is_num(nodes[0].children[1])) return [];
  var targets = this.getOtherNumberMulsInSum(nodes[0]);
  return this.bindActionForEachTarget(nodes, targets);
}

MultiplyNumbersAction.prototype.getOtherNumberMulsInSum = function(draggedMul) {
  var product = draggedMul.parent;
  var numberMuls = product.filter(function(mul) {
    return mul!==draggedMul
           && mul.is_group('mul')
           && Num.is_num(mul.children[1]);
  });
  return numberMuls;
}

MultiplyNumbersAction.prototype.bindActionForEachTarget = function(nodes, targets) {
  var actions = [];
  var root = nodes[0].get_root();
  for (var i=0; i<targets.length; i++) {
    actions.push(this.createBoundAction(root, {nodes: nodes
                                              ,target: targets[i]
                                              ,interactionType: 'drag'}));
  }
  return actions;
}

MultiplyNumbersAction.prototype.match = function(node) {
 if (!node.ls) return false;
  if (node.ls.value != node.value) return false; // multiply two numbers or two devisors
	var t1 = node.ls.children[1], t2 = node.children[1];
	if (!(Num.is_num(t1) && Num.is_num(t2))) return false;
  return true
}

MultiplyNumbersAction.prototype.transform = function(callback) {
  if (this.interactionType==='drag') {
    this.sourceMul = this.nodes[0];
    this.targetMul = this.target;
  } else {
    this.sourceMul = this.actor;
    this.targetMul = this.actor.ls;
  }

	this.addTouchedNodes(this.sourceMul);
	this.addTouchedNodes(this.targetMul);

  var multiplier = this.getNewTreeNode(this.sourceMul)
     ,multiplicand = this.getNewTreeNode(this.targetMul)
     ,product = multiplier.parent;

	var number1 = multiplicand.children[1]
     ,number2 = multiplier.children[1];

  var resultOfMultiplication = Num.get_value(number1) * Num.get_value(number2);

  var resultingMul = new MulDiv(new Num(resultOfMultiplication), multiplier.value);

  this.updateNodeMap(this.sourceMul, resultingMul);
  this.updateNodeMap(this.sourceMul.children[0], resultingMul.children[0]);
  this.updateNodeMap(this.sourceMul.children[1].get_mapping_to(resultingMul.children[1]));
  this.updateNodeMap(this.targetMul, resultingMul);
  this.updateNodeMap(this.targetMul.children[0], resultingMul.children[0]);
  this.updateNodeMap(this.targetMul.children[1].get_mapping_to(resultingMul.children[1]));

  var idxForResultingMul = multiplicand.remove();
  product.insert(idxForResultingMul, resultingMul);
  multiplier.remove();
  this.cleanup(product);

  if (typeof(callback) === 'function') callback(this);
  return this;
}

MulDiv.prototype.add_action_handler(new MultiplyNumbersAction());

return new MultiplyNumbersAction();

})();

AlgebraModel.prototype.move_actions.push(gmath.actions.MultiplyNumbersAction);
// Copyright Erik Weitnauer 2013.

(function () {

var MultiplyPowersAction = function(settings) {
	Action.call(this, 'Multiply powers');
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, MultiplyPowersAction);

MultiplyPowersAction.prototype.split = function(n) {
  if (n.is_group('power')) return {base: n.children[0], exp: n.children[1]}
  else return {base: n, exp: new Exponent(new Num(1))};
}

MultiplyPowersAction.prototype.match = function(node) {
	if (node.is_group('power')) node = node.parent;
	if (!node.ls || !node.is_group('mul')) return false;
	var s1 = this.split(node.ls.children[1]), s2 = this.split(node.children[1]);
  if (!s1 || !s2) return false;
  if ((s1.base.to_ascii() != s2.base.to_ascii())
      && !(Num.is_num(s1.base) && !s1.exp.parent && (Num.get_value(s1.base)===1 || Num.get_value(s1.base)===-1) && node.children[1].is_group('power')))
    return false;
  return true;
}

MultiplyPowersAction.prototype.transform = function(callback){

  var self = this;
	// we might not work on the same tree this.actor is in
	if (this.actor.is_group('power')) this.actor = this.actor.parent;
	var node = this.getNewTreeNode(this.actor);
  var oldMinusOne = this.actor.ls;

	this.addTouchedNodes(this.actor);
	this.addTouchedNodes(this.actor.ls);

  var ls = node.ls.children[1]
     ,rs = node.children[1];

  if (leftSideIsOne()) {
    removeLeftSide();
  } else if (leftSideIsNegativeOne()) {
    removeLeftSide();
    applyNegativeToRightSide();
  } else {
    performProductOfPowersProperty();
  }

  function leftSideIsOne() {
    return Num.is_num(ls) && Num.get_value(ls)===1;
  }

  function leftSideIsNegativeOne() {
    return Num.is_num(ls) && Num.get_value(ls)===-1;
  }

  function removeLeftSide() {
    node.ls.remove();
  }

  function applyNegativeToRightSide() {
    rs.remove();
    var sign = new Sign(rs);
    node.append(sign);
    self.updateNodeMap(oldMinusOne.children[1].get_mapping_to(sign.children[0]));
  }

  function performProductOfPowersProperty() {
    var old_times_sign = self.actor.children[0];

    self.updateNodeMap(self.actor, ls.parent); // map mul
    self.updateNodeMap(self.actor.children[0], ls.parent.children[0]); // map *

    if (ls.is_group('power') && rs.is_group('power')) {
      self.updateNodeMap(self.actor.children[1].children[0].get_mapping_to(ls.children[0])); // map base
    } else if (ls.is_group('power')) {
      self.updateNodeMap(self.actor.children[1].get_mapping_to(ls.children[0]));
    } else if (rs.is_group('power')) {
      self.updateNodeMap(self.actor.children[1].children[0].get_mapping_to(ls));
    } else {
      self.updateNodeMap(self.actor.children[1].get_mapping_to(ls));
    }

    if (!ls.is_group('power')) {
      var power = Exponent.prototype.createGroup();
      var p = ls.parent;
      var idx = Tree.remove(ls);
      power.append(ls);
      power.append(new Exponent(new Num(1)));
      Tree.insert(p, idx, power);
      ls = power;
    }

    var s1 = self.split(ls)
       ,s2 = self.split(rs);

    Tree.remove(rs.parent);

    // we need to turn our left neighbor into a power expression if it isn't yet
    // var exp_val = s1.exp.children[0], sum;
    // if (!exp_val.is_group('sum')) {
    //   var p = exp_val.parent;
    //   Tree.remove(exp_val);
    //   sum = AddSub.prototype.createGroup();
    //   sum.append(new AddSub(exp_val));
    //   p.append(sum);
    // }
    // else sum = exp;

    var exp_val = s1.exp.children[0], sum;
    if (exp_val.is_group('brackets') && exp_val.children[0].hidden
        && exp_val.children[1].is_group('sum')) {
      sum = exp_val.children[1];
    } else {
      var p = exp_val.parent;
      Tree.remove(exp_val);
      if (exp_val.is_group('brackets') && exp_val.children[0].hidden) {
        exp_val = exp_val.children[1];
        exp_val.remove();
      }
      sum = AddSub.prototype.createGroup();
      sum.append(new AddSub(exp_val));
      p.append(sum);
    }

    var addend_count = 1;
    if (s2.exp.children[0].is_group('brackets') && s2.exp.children[0].children[0].hidden && s2.exp.children[0].children[1].is_group('sum')) {
      sum.append_range(s2.exp.children[0].children[1].children);
      addend_count = s2.exp.children[0].children[1].children.length;
    } else sum.append(new AddSub(s2.exp.children[0]));

    Brackets.handle(sum);

    // turn times sign into plus sign
    self.updateNodeMap(old_times_sign, sum.children[sum.children.length-addend_count].children[0]);
  }

  this.cleanup(node.parent);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

var mpa = new MultiplyPowersAction();

MulDiv.prototype.add_action_handler(mpa);
// also allow tapping on the base of a power to trigger multiplying
Power.prototype.add_action_handler(mpa);

})();
// Copyright Erik Weitnauer 2013.

(function () {

var NegationAction = function(settings) {
	Action.call(this, 'negation');
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, NegationAction);

NegationAction.prototype.match = function(node){
  if((Num.get_value(node.children[1]) === -1 && node.ls)) return true
  if (node.ls && node.ls.children && Num.get_value(node.ls.children[1]) === -1) return true
  return false
}

NegationAction.prototype.transform = function(callback){

	var node = this.getNewTreeNode(this.actor);
	var self = this;

	this.addTouchedNodes(this.actor);
	this.addTouchedNodes(this.actor.ls);

  var neg = function(mul_minus1, other_mul) {
    var child = other_mul.children[1]
       ,old_mul_minus1 = self.getOldTreeNode(mul_minus1)
       ,old_minus1 = old_mul_minus1.children[1]
       ,old_other_mul = self.getOldTreeNode(other_mul);
    Tree.remove(mul_minus1);
    if (child.is_group('sign') && child.children[1] && !child.children[1].is_group('sign')) {
      var x = child.children[1];
      self.updateNodeMap(old_other_mul.children[1].children[0], x); // map other sign group
      self.updateNodeMap(old_minus1, x); // map sign group
      self.updateNodeMap(old_minus1.children[0], x); // map -
      self.updateNodeMap(old_minus1.children[1], x); // map 1
    	child.replace_with(x);
    } else {
      var s = new Sign();
      s.append(new Sym('-'));
      self.updateNodeMap(old_minus1, s); // map sign group
      self.updateNodeMap(old_minus1.children[0], s.children[0]); // map -
      self.updateNodeMap(old_minus1.children[1], child); // map 1
      child.remove();
      s.append(child);
      other_mul.append(s);
    }
    self.updateNodeMap(old_mul_minus1, other_mul); // map mul
    self.updateNodeMap(old_mul_minus1.children[0], other_mul.children[0]); // map *
  }

  if (Num.get_value(node.children[1]) === -1 && node.ls) {
    neg(node, node.ls);
    this.cleanup(node.ls);
  } else {
    neg(node.ls, node);
    this.cleanup(node);
  }

  if (typeof(callback) === 'function') callback(this);
	return this;
}

MulDiv.prototype.add_action_handler(new NegationAction());

})();// Copyright Erik Weitnauer 2013.

(function () {

var MultiplyFractionsAction = function(settings) {
	Action.call(this, 'multiply fractions');
	this.priority = 1; // this line is new
	if (settings) this.actor = settings.actor;
};

gmath.inherit(Action, MultiplyFractionsAction);

MultiplyFractionsAction.prototype.match = function(node){
  if (!node.is_group('mul') || !node.ls) return false;
	var l = node.ls, r = node, p = node.parent;
  var frac1 = l.children[1], frac2 = r.children[1];
  if (!(frac1.is_group('fraction') && frac2.is_group('fraction'))) return false;
  return true;
}

/// This action is synchronous and may be called without providing a callback.
MultiplyFractionsAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);

	this.addTouchedNodes(this.actor);
	this.addTouchedNodes(this.actor.ls);

  var l = node.ls, r = node, p = node.parent;
  var frac1 = l.children[1], frac2 = r.children[1];
  var old_frac2 = this.actor.children[1];
  this.updateNodeMap(old_frac2.get_fraction_bar(), frac1.get_fraction_bar()); // map //
  this.updateNodeMap(this.actor, l); // map mul
  this.updateNodeMap(this.actor.children[0], l.children[0]); // map *
	Tree.remove(r);
	var top = frac2.get_top(), bottom = frac2.get_bottom();
  for (var i=0; i<top.length; i++) frac1.append(top[i]);
  for (var i=0; i<bottom.length; i++) frac1.append(bottom[i]);
  for (var i=0; i<frac1.children.length; i++) { // handle brackets as in (1+2)/3 * 4/5
    var c = frac1.children[i];
    if (c.has_children()) Brackets.handle(c.children[1]);
  }

  this.cleanup(p);

 	if (typeof(callback) === 'function') callback(this);
 	return this;
}

MulDiv.prototype.add_action_handler(new MultiplyFractionsAction());

})();
// Copyright Erik Weitnauer 2013.

(function () {

/** maps the paths of a tree of paths that are all children to one root node. */
function mapRelativePaths (oldPath, relPath, root, map) {
	var curr = root;
	map[oldPath] = [relPath];
	if (curr.has_children()) {
		for (var i=0; i<curr.children.length; i++) {
			mapRelativePaths(oldPath.concat(i), relPath.concat(i), root.children[i], map)
		}
	}
}

var AddFractionsAction = function(settings) {
	Action.call(this, 'add fractions');
	this.priority = 1;
	if (settings) {
		this.actor = settings.actor;
	}
};

gmath.inherit(Action, AddFractionsAction);

AddFractionsAction.prototype.match = function(node) {
	if (!node.ls) return false;
	var l = node.ls, r = node;
	var frac1 = l.children[1], frac2 = r.children[1];
	if (!(frac1.is_group('fraction') && frac2.is_group('fraction'))) return false;
	var to_ascii = function(n) { return n.to_ascii(); }
  var den1 = frac1.get_bottom(), den2 = frac2.get_bottom();
  if (den1.map(to_ascii).join("") !== den2.map(to_ascii).join("")) return false;
	return true;
}

AddFractionsAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);
  var old_frac2 = this.actor.children[1];
  var frac2Bottom = this.actor.children[1].get_bottom();

	this.addTouchedNodes(this.actor);
	this.addTouchedNodes(this.actor.ls);

	var l = node.ls, r = node, p = node.parent;
  var frac1 = l.children[1], frac2 = r.children[1];
	var idx = Tree.remove(l); Tree.remove(r);
  Tree.remove(frac1); Tree.remove(frac2);

  var frac1Bottom = frac1.get_bottom();
  this.updateNodeMap(old_frac2.get_fraction_bar(), frac1.get_fraction_bar()); // map //
  for (var i = 0; i < frac2Bottom.length; i++) {
  	this.updateNodeMap(frac2Bottom[i].get_mapping_to(frac1Bottom[i]));
  }

  var numerator_into_addsub = function(num, addsub) {
		Tree.remove_range(num);
    if (num.length == 1) {
      Tree.append(addsub, num[0].children[1]);
      Brackets.handle(addsub.children[1], true);
    } else {
      var p = new ProductFraction();
      Tree.insert_range(p, 0, num);
      Tree.append(addsub, p);
      Brackets.handle(addsub.children[1], true);
    }
  }
  numerator_into_addsub(frac1.get_top(), l);
  numerator_into_addsub(frac2.get_top(), r);

  // Tree.append(r, num2); Brackets.handle(num2);
  var sum = l.createGroup();
  sum.append(l); sum.append(r);
  var num = new MulDiv(num);
  var newSym = new Sym('*');
  Tree.append(num, newSym); // avoid automatic brackets we would get with `new MulDiv(sum)`
  Tree.append(num, sum);
  frac1.append(num);
	var newAddend = new AddSub(frac1, 'add');

  Tree.insert(p, idx, newAddend);
  Brackets.handle(sum);

  this.cleanup(l);
  this.cleanup(r);
  this.cleanup(p);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

AddSub.prototype.add_action_handler(new AddFractionsAction());

})();
// Copyright Erik Weitnauer 2014

gmath.actions.FractionCancelAction =

(function() {

var FractionCancelAction = function(settings) {
	Action.call(this, 'cancel numerator and denominator');
	this.delay = 400;
	if (settings) {
		this.nodes = settings.nodes;
		this.target = settings.target;
		this.targetType = settings.targetType
		               || (settings.nodes[0].is_group('mul') ? "denominator" : "numerator");
		this.side = settings.side || "around";
	}
}

gmath.inherit(Action, FractionCancelAction);

FractionCancelAction.prototype.getAllAvailableActions = function(nodes) {
	if (nodesAreNotQualifiedForCanceling(nodes)) return [];

	var selections = {};
	selections.tree = getAlgebraModelContainingNodes(nodes);
	selections.fraction = getFraction(nodes);
	selections.targets = this.getCancelableTargetsFromFraction(selections.fraction, nodes);

	return this.collectBoundActions(selections, nodes);
}

function nodesAreNotQualifiedForCanceling(nodes) {
	if (nodes.length!==1) return true;
	var nodeBelongsToAFraction = getFraction;
	return !nodeBelongsToAFraction(nodes) || (nodes[0].value!=='div' && nodes[0].value!=='mul');
}

function getAlgebraModelContainingNodes(nodes) { return Array.isArray(nodes) ? nodes[0].get_root() : nodes.get_root()	}

function getFraction(nodes) {
	var frac = nodes[0];
	while (frac && !frac.is_group('fraction')) frac = frac.parent;
	if (!frac) return false;
	return frac;
}

FractionCancelAction.prototype.getCancelableTargetsFromFraction = function(fraction, nodes) {
	var n = nodes[0];
	var cancelableTargets;
	if (n.value==='div') {
		cancelableTargets = this.getCancelableTargetsFromFractionNumerator(fraction, nodes);
	} else {
		cancelableTargets = this.getCancelableTargetsFromFractionDenominator(fraction, nodes);
	}
	return cancelableTargets;
}

FractionCancelAction.prototype.getCancelableTargetsFromFractionNumerator =
function(fraction, nodes) {
	var n = nodes[0];
	var res = [];
	var numerator = fraction.get_top();
	for (var i=0; i<numerator.length; i++) {
		if (this.match(numerator[i], n))
			res.push({node:numerator[i], type:'numerator'});
	}
	return res;
}

FractionCancelAction.prototype.getCancelableTargetsFromFractionDenominator =
function(fraction, nodes) {
	var n = nodes[0];
	var res = [];
	var denominator = fraction.get_bottom();
	for (var i=0; i<denominator.length; i++) {
		if (this.match(n, denominator[i]))
			res.push({node:denominator[i], type:'denominator'});
	}
	return res;
}

FractionCancelAction.prototype.match = function(term1, term2) {
	var self = this;
	var topTerm = (term1.is_group('mul') ? term1 : term2)
	  , bottomTerm = (term1.is_group('mul') ? term2 : term1);
  if (!sameParent()) return false;
  if (!topTermAndBottomTermAreCorrectTypes()) return false;

  reselectSecondChildOfInputs()

  if (topTermEqualsBottomTerm()) return true;
  if (topTermEqualsNegativeOfBottomTerm()) return true;
  if (negativeOfTopTermEqualsBottomTerm()) return true;
  if (bottomTermEqualsOne()) return true;
  if (bottomTermEqualsNegativeOne()) return true;
  if (topTermAndBottomTermAreMultiples()) return true;
  if (bothTermsAreNegative()) return true;
  return false;

  function sameParent() {
  	var p = topTerm.parent;
  	return (p.is_group('fraction') && bottomTerm.parent === p);
  }

  function topTermAndBottomTermAreCorrectTypes() {
  	return topTerm.is_group('mul') && bottomTerm.is_group('div');
  }

  function reselectSecondChildOfInputs() {
  	topTerm = topTerm.children[1], bottomTerm = bottomTerm.children[1];
  }

  function topTermEqualsBottomTerm() {
  	return topTerm.to_ascii() === bottomTerm.to_ascii();
  }

  function topTermEqualsNegativeOfBottomTerm() {
  	return topTerm.is_group('sign') && topTerm.children[1].to_ascii() === bottomTerm.to_ascii();
  }

  function negativeOfTopTermEqualsBottomTerm() {
  	return bottomTerm.is_group('sign') && bottomTerm.children[1].to_ascii() === topTerm.to_ascii();
  }

  function bottomTermEqualsOne() {
  	return bottomTerm instanceof Num && Num.get_value(bottomTerm)===1;
  }

  function bottomTermEqualsNegativeOne() {
  	return Num.is_num(bottomTerm) && Num.get_value(bottomTerm)===-1;
  }

  function topTermAndBottomTermAreMultiples() {
  	var tree = topTerm.get_root();
	  var val1 = tree.numeric_value(topTerm);
	  var val2 = tree.numeric_value(bottomTerm);
	  if (valuesAreValid()) {
	    var gcd = self.getGCD(val1, val2);
	    if (topTermIsAMultipleOfBottomTerm()) return true;
	    if (bottomTermIsAMultipleOfTopTerm()) return true;
	    if (gcd !== 1) return true;
	  } else if (eitherTermIsAPower()) {
	  	if (sameBase()) return true;
	  }
	  return false;

	  function valuesAreValid() {
	  	return val1 !== null && val2 !== null && !isNaN(val1) && !isNaN(val2);
	  }

	  function topTermIsAMultipleOfBottomTerm() {
	  	return Math.abs(val1) >= Math.abs(val2) && Math.abs(val2) !== 1 && (val1 % val2 === 0);
	  }

	  function bottomTermIsAMultipleOfTopTerm() {
	  	return Math.abs(val2) >= Math.abs(val1) && Math.abs(val1) !== 1 && (val2 % val1 === 0);
	  }

	  function eitherTermIsAPower() {
	  	return topTerm instanceof Power || bottomTerm instanceof Power
	  }

	  function topTermAndBottomTermArePowers() {
	  	return topTerm instanceof Power && bottomTerm instanceof Power;
	  }

	  function sameBase() {
	  	if (topTermAndBottomTermArePowers()) {
	  		return topTerm.children[0].to_ascii() === bottomTerm.children[0].to_ascii();
	  	} else if (topTermIsAPower()) {
	  		return topTerm.children[0].to_ascii() === bottomTerm.to_ascii();
	  	} else {
	  		return topTerm.to_ascii() === bottomTerm.children[0].to_ascii();
	  	}
	  }

	  function topTermIsAPower() {
	  	return topTerm instanceof Power;
	  }
  }

  function bothTermsAreNegative() {
  	return topTerm.is_group('sign') && bottomTerm.is_group('sign');
  }
}

FractionCancelAction.prototype.collectBoundActions = function(selections, nodes) {
	var actions = [];
	for (var i=0; i<selections.targets.length; i++) {
		var t = selections.targets[i].node, tType = selections.targets[i].type;
		actions.push(this.createBoundAction(selections.tree, {nodes: nodes, target: t
			, targetType: tType, side: 'around'}));
	}
	return actions;
}


FractionCancelAction.prototype.getGCD = function(a, b) {
	if (a < 0) a = -a;
  if (b < 0) b = -b;
  if (b > a) {var temp = a; a = b; b = temp;}
  while (true) {
    a %= b;
    if (a == 0) return b;
    b %= a;
    if (b == 0) return a;
  }
}

FractionCancelAction.prototype.transform = function(callback) {
	var self = this;

	addTopActorAndBottomActorToTouchedNodes();

  var selections = {};
  makeSelections();

 	performCancel();

	cleanFraction();

	if (typeof(callback) === 'function') callback(this);
  else return true;

  function addTopActorAndBottomActorToTouchedNodes() {
  	self.addTouchedNodes(self.nodes[0]);
  	self.addTouchedNodes(self.target);
  }

  function makeSelections() {
  	selectFraction();
	  selectTopActorAndBottomActor();
	  selectValuesOfTopActorAndBottomActor();
	  selectTopActorParent();
  }

  function performCancel() {
  	if (topActorEqualsBottomActor()) cancelThemOut();
	 	else if (bottomActorEqualsOne()) removeBottomActor();
	  else if (bottomActorEqualsNegativeOne()) applyNegativeToTopActor();
	  else if (topActorEqualsNegativeOfBottomActor()) cancelAndReplaceTopActorWithNegativeOne();
	  else if (negativeOfTopActorEqualsBottomActor()) {
	  	if (bottomActorIsLastFactorInDenominator()) {
	  		cancelAndReplaceTopActorWithNegativeOne();
	  	} else {
	  		cancelButKeepNegativeOneInDenominator();
	  	}
	  }
	  // the top actor and bottom actor share a common factor or they are powers with the same base
		else factorizeTopActorAndBottomActor();
  }

	function cleanFraction() {
		while (selections.fraction && self.cleanup(selections.fraction)) selections.fraction = selections.fraction.parent;
		if (selections.fraction && selections.fraction.parent) {
			Brackets.handle(selections.fraction, true);
		}
		if (selections.fraction instanceof AlgebraModel) self.reselectNodeAfterAction(selections.fraction.children[0]);
		else if (!selections.fraction.is_group('fraction')) self.reselectNodeAfterAction(selections.fraction);
	}

  function selectFraction() {
  	var node = self.nodes[0];
	  while (!node.is_group("fraction")) node = node.parent;
	  selections.fraction = self.getNewTreeNode(node);
  }

  function selectTopActorAndBottomActor() {
  	selections.numMul = self.targetType==='numerator' ? self.getNewTreeNode(self.target) : self.getNewTreeNode(self.nodes[0]);
  	selections.denDiv = self.targetType==='denominator' ? self.getNewTreeNode(self.target): self.getNewTreeNode(self.nodes[0]);
  }

  function selectValuesOfTopActorAndBottomActor() {
  	selections.numVal = selections.numMul.children[1];
  	selections.denVal = selections.denDiv.children[1];
  }

  function selectTopActorParent() {
  	selections.numeratorParent = selections.numMul.parent;
  }

  function topActorEqualsBottomActor() {
  	return selections.numVal.to_ascii() === selections.denVal.to_ascii();
  }

  function cancelThemOut() {
  	Tree.remove(selections.numMul);
    Tree.remove(selections.denDiv);
  }

  function bottomActorEqualsOne() {
  	return selections.denVal instanceof Num && Num.get_value(selections.denVal)===1;
  }

  function removeBottomActor() {
  	Tree.remove(selections.denDiv);
  }

  function bottomActorEqualsNegativeOne() {
	  	return Num.is_num(selections.denVal) && Num.get_value(selections.denVal)===-1;
	}

	function applyNegativeToTopActor() {
		if (selections.numVal.is_group('sign')) {
  		removeNegativeFromTopActor();
  	} else {
      makeTopActorNegative();
  	}
  	Tree.remove(selections.denDiv);
	}

	function removeNegativeFromTopActor() {
		self.updateNodeMap(self.getOldTreeNode(selections.numVal), selections.numVal.children[1]);
  	selections.numVal.replace_with(selections.numVal.children[1]);
	}

	function makeTopActorNegative() {
		var idx = selections.numVal.remove();
    var s = new Sign(selections.numVal);
    selections.numMul.insert(idx, s);
  	self.updateNodeMap(self.getOldTreeNode(selections.numVal), s);
	}

  function topActorEqualsNegativeOfBottomActor() {
  	return selections.numVal.is_group('sign') && selections.numVal.children[1].to_ascii() === selections.denVal.to_ascii();
  }

  function cancelAndReplaceTopActorWithNegativeOne() {
  	var minus1 = new Num(-1);
    self.updateNodeMap(self.getOldTreeNode(selections.numVal), minus1);
    Tree.replace(selections.numVal, minus1);
    Tree.remove(selections.denDiv);
  }

  function negativeOfTopActorEqualsBottomActor() {
  	return selections.denVal.is_group('sign') && selections.denVal.children[1].to_ascii() === selections.numVal.to_ascii();
  }

  function bottomActorIsLastFactorInDenominator() {
  	return selections.fraction.get_bottom().length === 1;
  }

  function cancelAndReplaceTopActorWithNegativeOne() {
  	var minus1 = new Num(-1);
    self.updateNodeMap(self.getOldTreeNode(selections.numVal), minus1);
    Tree.replace(selections.numVal, new Num(-1));
    Tree.remove(selections.denDiv);
  }

  function cancelButKeepNegativeOneInDenominator() {
  	self.updateNodeMap(self.getOldTreeNode(selections.denVal), minus1);
    Tree.remove(selections.numMul);
    var minus1 = new Num(-1);
    Tree.replace(selections.denVal, minus1);
  }

	function factorizeTopActorAndBottomActor() {
		var tree = selections.fraction.get_root();
	  var val1 = tree.numeric_value(selections.numVal);
	  var val2 = tree.numeric_value(selections.denVal);
	  if (valuesAreValid()) {
	    factorizeNumbers();
	  } else if (eitherTermIsAPower() && sameBase()) {
  		factorizePowers();
  	} else if (bothTermsAreNegative()) {
  		extractSigns();
  	}

	  function valuesAreValid() {
	  	return val1 !== null && val2 !== null && !isNaN(val1) && !isNaN(val2);
	  }

	  function eitherTermIsAPower() {
	  	return selections.numVal instanceof Power || selections.denVal instanceof Power;
	  }

	  function sameBase() {
	  	if (topTermAndBottomTermArePowers()) {
	  		return selections.numVal.children[0].to_ascii() === selections.denVal.children[0].to_ascii();
	  	} else if (topTermIsAPower()) {
	  		return selections.numVal.children[0].to_ascii() === selections.denVal.to_ascii();
	  	} else {
	  		return selections.numVal.to_ascii() === selections.denVal.children[0].to_ascii();
	  	}
	  }

	  function topTermAndBottomTermArePowers() {
	  	return selections.numVal instanceof Power && selections.denVal instanceof Power;
	  }

	  function topTermIsAPower() {
	  	return selections.numVal instanceof Power;
	  }

	  function factorizeNumbers() {
	  	var gcd = self.getGCD(val1, val2);
	    if (topActorIsAMultipleOfBottomActor()) {
	    	selections.numMul = factorize(selections.numMul, val2, Math.floor(val1/val2))[0];
	    	selections.denDiv.update_y_during_dragging = true;
	    	if (self.targetType!=='numerator') self.reselectNodeAfterAction(selections.numMul);
	    }
	    else if (bottomActorIsAMultipleOfTopActor()) {
	    	selections.denDiv = factorize(selections.denDiv, val1, Math.floor(val2/val1))[0];
	    	selections.numMul.update_y_during_dragging = true;
	    	if (self.targetType==='numerator') self.reselectNodeAfterAction(selections.denDiv);
	    }
	    else if (gcd !== 1) {
	    	if (self.targetType==='numerator') {
		    	factorize(selections.numMul, gcd, Math.floor(val1/gcd));
	        selections.denDiv = factorize(selections.denDiv, gcd, Math.floor(val2/gcd))[0];
	    	} else {
	    		selections.numMul = factorize(selections.numMul, gcd, Math.floor(val1/gcd))[0];
	        factorize(selections.denDiv, gcd, Math.floor(val2/gcd));
	    	}
	    	if (self.targetType==='numerator') self.reselectNodeAfterAction(selections.denDiv);
	    	else self.reselectNodeAfterAction(selections.numMul);
	    } else if (bothTermsAreNegative()) {
	    	extractSigns();
	    }
	  }

	  function topActorIsAMultipleOfBottomActor() {
	  	return Math.abs(val1) >= Math.abs(val2) && Math.abs(val2) !== 1 && (val1 % val2 === 0);
	  }

	  function bottomActorIsAMultipleOfTopActor() {
	  	return Math.abs(val2) >= Math.abs(val1) && Math.abs(val1) !== 1 && (val2 % val1 === 0);
	  }

	  function bothTermsAreNegative() {
	  	return selections.numVal.is_group('sign') && selections.denVal.is_group('sign');
	  }

	  function factorize(node, f1, f2) {
		  var t1 = new MulDiv(new Num(f1), node.value), t2 = new MulDiv(new Num(f2), node.value);
		  self.updateNodeMap(self.getOldTreeNode(node).get_mapping_to(t1));
		  self.extendNodeMap(self.getOldTreeNode(node).get_mapping_to(t2));
		  var idx = Tree.remove(node);
		  Tree.insert(node.parent, idx, t1);
		  Tree.insert(node.parent, idx, t2);
		  t1.update_y_during_dragging = true;
		  t2.update_y_during_dragging = true;
		  return [t1, t2];
		}

		function extractSigns() {
			var sign1 = selections.numVal, sign2 = selections.denVal
			   ,contents1 = sign1.children[1], contents2 = sign2.children[1];
			var idx1 = selections.fraction.children.indexOf(selections.numMul)
			   ,idx2 = selections.fraction.children.indexOf(selections.denDiv);
			var oldNegSym1 = self.getOldTreeNode(sign1.children[0])
			   ,oldNegSym2 = self.getOldTreeNode(sign2.children[0]);
			sign1.remove();
			contents1.remove();
			selections.numMul.append(contents1);
			sign2.remove();
			contents2.remove();
			selections.denDiv.append(contents2);
			var negOne1 = new MulDiv(new Num(-1))
			   ,negOne2 = new MulDiv(new Num(-1), 'div');
			Tree.insert(selections.fraction, idx1, negOne1);
			Tree.insert(selections.fraction, idx2+1, negOne2);
			self.updateNodeMap(oldNegSym1.get_mapping_to(negOne1.children[1]));
			self.updateNodeMap(oldNegSym2.get_mapping_to(negOne2.children[1]));
			self.extendNodeMap(selections.numMul, negOne1);
			self.extendNodeMap(selections.denDiv, negOne2);
			if (self.targetType==='numerator') {
				self.reselectNodeAfterAction(negOne2);
			} else {
				self.reselectNodeAfterAction(negOne1);
			}
			// selections.numMul.update_y_during_dragging = true;
			// selections.denDiv.update_y_during_dragging = true;
			// selections.negOne1.update_y_during_dragging = true;
			// selections.negOne2.update_y_during_dragging = true;
		}

		function factorizePowers() {
			makeNewSelections();
			if (!topActorAndBottomActorArePowersThatCanBeCanceled()) {
				return;
				// If interacting with GM expressions, we should not get to this point (not being able to take an action
				// after entering the doInPlace).  But, when testing, we pass in things that shouldn't cancel to the doInPlace.
				// Therefore, this check is so that odd structures are not created in testing, and if something can't be canceled,
				// they won't be.
			}
  		reinterpretNonPowersIntoPowers();
			selectValuesOfExponents();
			modifyTargetPower();
			insertNewPowerNextToTarget();
			removeUnneccesaryExponents();

			function makeNewSelections() {
				identifyAndSelectSourceAndTarget();
			  selectValuesOfSourceAndTarget();
			  deleteRedundantSelections();
			  selections.sourceWasPower = true;
			}

			function topActorAndBottomActorArePowersThatCanBeCanceled() {
				var sourceBase = selections.sourceVal.is_group('power') ? selections.sourceVal.children[0] : selections.sourceVal
				   ,targetBase = selections.targetVal.is_group('power') ? selections.targetVal.children[0] : selections.targetVal;
				return sourceBase.to_ascii() === targetBase.to_ascii();
			}

			function identifyAndSelectSourceAndTarget() {
				selections.source = self.targetType==='numerator' ? selections.denDiv : selections.numMul;
			  selections.target = self.targetType==='numerator' ? selections.numMul : selections.denDiv;
			}

			function deleteRedundantSelections() {
				delete selections.numMul;
			  delete selections.denDiv;
			  delete selections.numVal;
			  delete selections.denVal;
			}

			function selectValuesOfSourceAndTarget() {
				selections.sourceVal = selections.source.children[1];
			  selections.targetVal = selections.target.children[1];
			}

			function reinterpretNonPowersIntoPowers() {
				if (sourceIsNotAPower()) {
	  			reinterpretSourceAsPowerAndReselectAndRememberPreviousForm();
	  		}
	  		if (targetIsNotAPower()) {
	  			reinterpretTargetAsPowerAndReselect();
	  		}
			}

			function sourceIsNotAPower() {
				return !(selections.sourceVal instanceof Power);
			}

			function reinterpretSourceAsPowerAndReselectAndRememberPreviousForm() {
				selections.sourceVal.remove();
  			var power = Exponent.prototype.createGroup();
  			power.append(selections.sourceVal);
  			power.append(new Exponent(new Num(1)));
  			self.updateNodeMap(selections.sourceVal, power);
  			selections.source.append(power);
  			selections.sourceVal = power;
  			selections.sourceWasPower = false;
			}

			function targetIsNotAPower() {
				return !(selections.targetVal instanceof Power);
			}

			function reinterpretTargetAsPowerAndReselect() {
				var idx = selections.targetVal.remove();
  			var power = Exponent.prototype.createGroup();
  			power.append(selections.targetVal);
  			power.append(new Exponent(new Num(1)));
  			self.updateNodeMap(selections.targetVal, power);
  			selections.target.append(power);
  			selections.targetVal = power;
			}

			function selectValuesOfExponents() {
				selections.sourceExpVal = selections.sourceVal.children[1].children[0]
			  selections.targetExpVal = selections.targetVal.children[1].children[0];
				ignoreBracketsOnExponents();
			}

			function ignoreBracketsOnExponents() {
				if (selections.sourceExpVal.is_group('brackets')) selections.sourceExpVal = selections.sourceExpVal.children[1];
				if (selections.targetExpVal.is_group('brackets')) selections.targetExpVal = selections.targetExpVal.children[1];
			}

			function modifyTargetPower() {
				if (anExponentValueIsNotAnInteger()) {
					makeTargetExponentIntoSum();
				} else {
					subtractSourceExponentValueFromTargetExponentValue();
				}
			}

			function anExponentValueIsNotAnInteger() {
				return !Num.is_num(selections.sourceExpVal) || !Num.is_num(selections.targetExpVal);
			}

			function makeTargetExponentIntoSum() {
				var parent = selections.targetExpVal.parent;
				var idx = selections.targetExpVal.remove();
				var sum = AddSub.prototype.createGroup();
  			sum.append(new AddSub(selections.targetExpVal));
  			sum.append(new AddSub(selections.sourceExpVal.clone(), 'sub'));
				selections.targetExpVal = parent.insert(idx, sum);
				self.cleanup(sum.children[1]);
				self.cleanup(sum.children[0]);
				Brackets.handle(sum);
			}

			function subtractSourceExponentValueFromTargetExponentValue() {
				selections.targetExpVal = selections.targetExpVal.replace_with(new Num(Num.get_value(selections.targetExpVal) - Num.get_value(selections.sourceExpVal)));
			}

			function insertNewPowerNextToTarget() {
				var newPow = Exponent.prototype.createGroup();
				newPow.append(Tree.clone(selections.sourceVal.children[0]));
				newPow.append(new Exponent(Tree.clone(selections.sourceExpVal)));
				Brackets.handle(newPow.children[1].children[0]);
				selections.newPow = newPow;
				selections.fraction.insert(selections.fraction.children.indexOf(selections.target)+1, new MulDiv(newPow, selections.target.value));
			}

			function removeUnneccesaryExponents() {
				if (!selections.sourceWasPower) {
					removeExponentOfOneFromSourceAndNewPower();
				}
				if (targetNowHasExponentValueOfOne()) {
					reinterpretTargetPowerAsJustBase();
				}
			}

			function removeExponentOfOneFromSourceAndNewPower() {
				self.updateNodeMap(selections.newPow, selections.newPow.children[0]);
				selections.newPow = selections.newPow.replace_with(selections.newPow.children[0]);
				self.updateNodeMap(selections.sourceVal, selections.sourceVal.children[0]);
				selections.sourceVal.replace_with(selections.sourceVal.children[0]);
			}

			function targetNowHasExponentValueOfOne() {
				return selections.targetExpVal.value===1;
			}

			function reinterpretTargetPowerAsJustBase() {
				self.updateNodeMap(selections.targetVal, selections.targetVal.children[0]);
				selections.targetVal = selections.targetVal.replace_with(selections.targetVal.children[0]);
			}
		}
	}
}

return new FractionCancelAction();

})();

AlgebraModel.prototype.move_actions.push(gmath.actions.FractionCancelAction);
// Copyright Erik Weitnauer 2013.

(function () {

var FractionMagSimplificationAction = function(settings) {
	Action.call(this, 'cancel numerator and denominator');
	if (settings) {
		this.actor = settings.actor;
		this.priority = settings.priority || 0;
	}
};

gmath.inherit(Action, FractionMagSimplificationAction);

FractionMagSimplificationAction.prototype.match = function(node) {
	if (!node.is_group('fraction')) return false;
	var numerator = node.get_top();
	var denominator = node.get_bottom();
	if (numerator.length!==1 || denominator.length!==1) return false;
	numerator = numerator[0], denominator = denominator[0];
	return (Num.is_num(numerator.children[1]) && Num.is_num(denominator.children[1]));
}

FractionMagSimplificationAction.prototype.transform = function(callback) {

	var node = this.getNewTreeNode(this.actor);
	var alm = node.parent;

	this.addTouchedNodes(this.actor);

	var numerator = node.get_top();
	var denominator = node.get_bottom();
	numerator = numerator[0], denominator = denominator[0];

	var resultNum = Num.get_value(numerator.children[1])/Num.get_value(denominator.children[1]);
	resultNum = Math.round(100*resultNum)/100;
	var result = new Num(resultNum);
	if (numerator.children[1] instanceof Sign || denominator.children[1] instanceof Sign) {
		this.updateNodeMap(this.actor.children[0].children[1].get_mapping_to(result));
		this.updateNodeMap(this.actor.children[2].children[1].get_mapping_to(result));
	} else {
		this.updateNodeMap(this.actor.get_mapping_to(result));
	}
	var idx = node.remove();
	alm.insert(idx, result);

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

ProductFraction.prototype.add_action_handler(new FractionMagSimplificationAction());
return new FractionMagSimplificationAction();

})();
;(function() {

var ProductFractionCleanup = function(settings) {
  Action.call(this, 'product-fraction cleanup action');
  if (settings) this.productFraction = settings.actor;
};

gmath.inherit(Action, ProductFractionCleanup);

ProductFractionCleanup.prototype.match = function(node) {
  var numeratorLength = node.get_top().length
     ,denominatorLength = node.get_bottom().length;
  if (numeratorLength === 0 && denominatorLength === 0) return true;
  if (node.value === 'product' && denominatorLength > 0) return true;
  if (node.value === 'fraction' && denominatorLength === 0) return true;
  if (node.value === 'fraction' && numeratorLength === 0) return true;
  if (numeratorLength === 1 && denominatorLength === 0) return true;
  return false;
}


ProductFractionCleanup.prototype.doInPlace = function(callback) {
  this.initNodeMap();
  var node = this.getNewTreeNode(this.productFraction);

  var numeratorLength = node.get_top().length
     ,denominatorLength = node.get_bottom().length
     ,map;

  if (numeratorLength === 0 && denominatorLength === 0) {
    var identity = new Num(1);
    map = Tree.get_mapping_between(this.productFraction, identity);
    this.updateNodeMap(map);
    Tree.replace(node, identity);
  }

  if (this.productFraction.value === 'product' && denominatorLength > 0) {
    node.invert();
  }

  if (this.productFraction.value === 'fraction' && denominatorLength === 0) {
    node.invert();
  }

  if (this.productFraction.value === 'fraction' && numeratorLength === 0) {
    if (!(this.productFraction.children[0] instanceof Sym))
      Tree.insert(node, 0, new Sym('//'));
    Tree.insert(node, 0, new MulDiv(new Num(1)));
  }

  if (numeratorLength === 1 && denominatorLength === 0) {
    var val = node.get_top()[0].children[1];
    this.updateNodeMap(this.productFraction, val);
    this.updateNodeMap(this.productFraction.children[0], val);
    this.updateNodeMap(this.productFraction.children[0].children[0], val);
    Tree.replace(node, val);
    if (val.parent.is_group('brackets')) Brackets.handle(val.parent, true);
    else Brackets.handle(val, true);
  }

  if (typeof(callback) === 'function') callback(this);
  else return this;
}

ProductFraction.prototype.cleanupAction = new ProductFractionCleanup();

})();
gmath.actions.SplitExponentsAction =
(function() {

var SplitExponentsAction = function(settings) {
  Action.call(this, "split exponents");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
  }
};

gmath.inherit(Action, SplitExponentsAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
SplitExponentsAction.prototype.getAllAvailableActions = function(nodes) {
  if (!this.match(nodes[0])) return [];
  if (nodes.length===nodes[0].parent.children.length) return [];

  var root = nodes[0].get_root()
     ,power = nodes[0].parent.parent.parent.parent; // add->sum->brackets->exp->pow

  return [this.createBoundAction(root, {nodes: nodes, target: power, side: "left-of"}),
  	      this.createBoundAction(root, {nodes: nodes, target: power, side: "right-of"})];
}

// requires:
// the passed node to be an addend
// the third parent of that node to be an exponent
SplitExponentsAction.prototype.match = function(node) {
  try {
    var res = (node.is_group('add') || node.is_group('sub'))
           && node.parent.parent.parent.is_group('exponent');
    return res;
  }
  catch(err) { return false; }
}

SplitExponentsAction.prototype.transform = function(callback) {

  this.addTouchedNodes(this.target);

  var nodes = this.getNewTreeNode(this.nodes)
     ,target = this.getNewTreeNode(this.target);

  var oldLeadingPlusSign;
  if (nodes[0].parent.children.indexOf(this.nodes[0])===0) {
    oldLeadingPlusSign = nodes[0].parent.children[nodes.length].children[0];
  } else {
    oldLeadingPlusSign = nodes[0].parent.children[0].children[0];
  }

  var power = target
     ,powerParent = power.parent;

  var insertionIDX = power.remove();

  this.extractNodesFromPowerExponentSum(nodes);
  var splittedPower = this.createSplittedOffPower(nodes);

  var product = this.placePowersIntoProduct(power, splittedPower);

  var oldPlusSign = this.nodes[0].children[0]; //add->plus
  this.extendNodeMap(oldPlusSign, splittedPower.parent.children[0]);
  this.extendNodeMap(oldLeadingPlusSign, power.parent.children[0]);
  for (var i=0; i<this.nodes.length; i++) {
    this.updateNodeMap(this.nodes[i], splittedPower.parent);
  }

  if (powerParent.is_group('mul') || powerParent.is_group('div')) {
    // map mul sym to splitted mul sym
    this.extendNodeMap(this.getOldTreeNode(powerParent.children[0]), splittedPower.parent.children[0]);
  }

  powerParent.insert(insertionIDX, product);

  this.cleanup(product.children[0].children[1].children[1].children[0].children[1]);
    // prod->mul1->pow->exp->br->sum
  this.cleanup(product.children[1].children[1].children[1].children[0].children[1]);
    // prod->mul2->pow->exp->br->sum
  Brackets.handle(product.children[0].children[1].children[1].children[0], true);
  Brackets.handle(product.children[1].children[1].children[1].children[0], true);

  this.cleanup(powerParent);

  splittedPower.children[1].simplify = true;

  if (typeof(callback) === 'function') callback(this);
  else return true;
}

SplitExponentsAction.prototype.extractNodesFromPowerExponentSum = function(nodes) {
  Tree.remove_range(nodes);
}

SplitExponentsAction.prototype.createSplittedOffPower = function(addends) {
  var base = this.target.children[0];
  var power = Exponent.prototype.createGroup()
     ,clonedBase = Tree.clone(base);

  this.extendNodeMap(base, clonedBase);
  power.append(clonedBase);

  var sum = AddSub.prototype.createGroup();
  sum.append_range(addends);

  var exponent = new Exponent(sum);
  power.append(exponent);

  return power;
}

SplitExponentsAction.prototype.placePowersIntoProduct = function(power1, power2) {
  var product = MulDiv.prototype.createGroup();

  product.append(new MulDiv(power1));

  var mul = new MulDiv(power2);
  if (this.side==='left-of')
    product.insert(0, mul);
  else
    product.append(mul);

  return product;
}

return new SplitExponentsAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.SplitExponentsAction);
gmath.actions.UniteExponentsAction =
(function() {

var UniteExponentsAction = function(settings) {
  Action.call(this, "unite exponents");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
  }
};

gmath.inherit(Action, UniteExponentsAction);

UniteExponentsAction.prototype.getAllAvailableActions = function(nodes) {
	var actions = [];
	if (nodes.length!==1) return actions;
	if (!(nodes[0].is_group('mul') || nodes[0].is_group('div'))) return actions;

	var root = nodes[0].get_root()
	   ,siblings = nodes[0].parent.children.slice(); siblings.splice(siblings.indexOf(nodes[0]), 1);
	var base = this.getBaseStringFromNode(nodes[0].children[1]); // mul->expr

	for (var i=0; i<siblings.length; i++) {
		if (nodes[0].value===siblings[i].value && this.match(siblings[i].children[1], base))
			actions.push(this.createBoundAction(
									   root
									  ,{nodes:nodes
			               ,target:siblings[i].children[1].children[1] // mul->pow->exp
			               ,side:'around'}));
	}
	return actions;
}

UniteExponentsAction.prototype.getBaseStringFromNode = function(node) {
	if (node.is_group('power')) return node.children[0].to_ascii(); // pow->expr
	return node.to_ascii(); // expr
}

// takes an expression and a string.
// the expression is the second child of a mul block.
// the string is the base to which we are matching the value of the expression.
// returns true if the expression is a power group and has a base matching the string.
UniteExponentsAction.prototype.match = function(node, base) {
	if (!node.is_group('power')) return false;
	return node.children[0].to_ascii()===base;
}

UniteExponentsAction.prototype.transform = function(callback) {
	var self = this;

	this.addTouchedNodes(this.nodes[0]); // mul block of dragged node
	this.addTouchedNodes(this.target.parent.parent); // mul block containing target exponent

	var node = this.getNewTreeNode(this.nodes)[0]
	   ,target = this.getNewTreeNode(this.target);

	var parentProduct = node.parent
	   ,targetIsRightOfNode = this.getDirectionOfDrag(node, target);

	node.remove();

	var addends = this.extractAddendsFromDraggedNode(node);

	this.updateNodeMap(this.nodes[0], addends); // map mul group to add groups
	this.extendNodeMap(this.nodes[0].children[0], addends[0].children[0]); // map mul sym to first plus sym
	if (this.nodes[0].children[1].is_group('power')) {
		this.updateNodeMap(this.nodes[0].children[1].children[0], this.target.parent.children[0]) // map base to base
	} else {
		this.updateNodeMap(this.nodes[0].children[1], this.target.parent.children[0]);
	}

	this.insertAddendsIntoTargetExponent(addends, target, targetIsRightOfNode);

	this.cleanup(parentProduct);

	if (typeof(callback) === 'function') callback(this);
  else return true;
}

UniteExponentsAction.prototype.getDirectionOfDrag = function(draggedNode, targetExp) {
	var nIDX = draggedNode.parent.children.indexOf(draggedNode)
	   ,tIDX = draggedNode.parent.children.indexOf(targetExp.parent.parent); // exp->pow->mul
	return tIDX > nIDX;
}

UniteExponentsAction.prototype.extractAddendsFromDraggedNode = function(mul) {
	var addends = [];

	var expr = mul.children[1];
	if (!expr.is_group('power')) {
		addends.push(new AddSub(new Num(1)));
	} else {
		var exp = expr.children[1].children[0]; // pow->exp->???
		if (exp.is_group('brackets') && exp.children[1].is_group('sum')) {
			addends = exp.children[1].children.slice();
			Tree.remove_range(addends);
		} else {
			exp.remove();
			addends.push(new AddSub(exp));
		}
	}

	return addends;
}

UniteExponentsAction.prototype.insertAddendsIntoTargetExponent = function(addends, exp, putAddendsInFront) {
	var expr = exp.children[0];

	if (!(expr.is_group('brackets') && expr.children[1].is_group('sum'))) {
		this.reinterpretExponentToBeASum(exp);
		expr = exp.children[0];
	}

	// map mul sym to first plus sym
	this.extendNodeMap(this.getOldTreeNode(exp.parent.parent.children[0]), expr.children[1].children[0].children[0]);

	if (putAddendsInFront) expr.children[1].insert_range(0, addends);
	else expr.children[1].append_range(addends);
}

UniteExponentsAction.prototype.reinterpretExponentToBeASum = function(exponent) {
	var expr = exponent.children[0];
	expr.remove();

	var sum = AddSub.prototype.createGroup();
	sum.append(new AddSub(expr));

	var brackets = new Brackets(sum);
	exponent.append(brackets);
}

return new UniteExponentsAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.UniteExponentsAction);
// Copyright Erik Weitnauer 2013.

SplitNumberAction =
(function() {

var SplitNumberAction = function(settings) {
	Action.call(this, "n => (n-1) + 1");
	this.priority = 0;
	if (settings) this.actor = settings.actor;
};

gmath.inherit(Action, SplitNumberAction);

/**
 * Match any number that is greater than 1.
 */
SplitNumberAction.prototype.match = function(node) {
	return (node instanceof Num && node.value > 1);
}

SplitNumberAction.prototype.transform = function(callback) {

  var num = this.getNewTreeNode(this.actor);

  this.addTouchedNodes(this.actor);

  var parent = num.parent;
  var idx = num.remove();

	num.value--;

	// we create a new sum for the sake of generality.
	var newSum = AddSub.prototype.createGroup();
	newSum.append(new AddSub(num));
	newSum.append(new AddSub(new Num(1))); // here's the 1 we subtracted
	this.resultNodes = newSum.children.slice();

	this.updateNodeMap(this.actor.get_mapping_to(newSum));
	parent.insert(idx, newSum);
	Brackets.handle(newSum);

	this.cleanup(parent);

	if (typeof(callback) === 'function') callback(this);
  return true;
}

return new SplitNumberAction();

})();// Copyright Erik Weitnauer 2013.

SplitProductAction =
(function() {

var SplitProductAction = function(settings) {
	Action.call(this, "n*x => (n-1)*x + x");
	this.priority = 1;
	if (settings) {
		this.actor = settings.actor;
		if ('priority' in settings) this.priority = settings.priority;
	}
};

gmath.inherit(Action, SplitProductAction);

/**
 * Match any number that is greater than 1.
 */
SplitProductAction.prototype.match = function(node) {
	return (node.is_group('mul') && node.children[1] instanceof Num
		     && node.children[1].value > 1 && node.rs);
	// return ((node.is_group('product') && node.children[0].children[1] instanceof Num
	// 				&& Num.get_value(node.children[0].children[1]) > 1));
}

SplitProductAction.prototype.transform = function(callback) {

	// we might not work on the same tree this.actor is in
  var node = this.getNewTreeNode(this.actor)
		 ,parentProd = node.parent
		 ,factor = node.children[1];

	this.addTouchedNodes(this.actor);

	// subtract 1 from the factor
	factor.value--;

	var muls = parentProd.children.slice(parentProd.children.indexOf(node));
	var old_muls = this.getOldTreeNode(muls);
	var idx = Tree.remove_range(muls);
	var newSum = AddSub.prototype.createGroup();

	var prod1 = MulDiv.prototype.createGroup();
	var prod2 = MulDiv.prototype.createGroup();

	var cloned_muls;
	if (factor.value === 1) {
		node.remove();
		muls = muls.slice(1);
		prod1.insert_range(0, muls);
		cloned_muls = Tree.clone(muls);
		prod2.insert_range(0, cloned_muls);
		this.extendNodeMap(Tree.get_mapping_between(old_muls.slice(1), cloned_muls));
	} else {
		prod1.insert_range(0, muls);
		cloned_muls = Tree.clone(muls);
		prod2.insert_range(0, cloned_muls);
		prod2.children[0].remove();
		this.extendNodeMap(Tree.get_mapping_between(old_muls, cloned_muls));
	}

	newSum.append(new AddSub(prod1));
	newSum.append(new AddSub(prod2));

	var newMul = new MulDiv(newSum);
	//this.updateNodeMap(node, newMul);
	parentProd.insert(idx, newMul);

	this.cleanup(prod1);
	this.cleanup(prod2);
	// we need this for the following case `+*2*x +y` ==> `+x +x +y`, because
	// it is first turned into `+*(+x+x) +y` internally with parent being the product
	// after calling parent.clean_up once, we get `++x+x +y` and would need to call
	// clean_up again to get `+x +x +y`
	var parentSum = parentProd.parent;
	if (this.cleanup(parentProd)) this.cleanup(parentSum);

	if (typeof(callback) === 'function') callback(this);
  return true;
}

SplitProductAction.prototype.mapIndex = function() {
	map = {};
	return (function (node) { return map[node] });
}

return new SplitProductAction();

})();// Copyright Erik Weitnauer 2013.

SplitPowerAction =
(function() {

var SplitPowerAction = function(settings) {
	Action.call(this, "x^n => x^(n-1) * x");
	this.priority = 2;
	if (settings) {
		this.actor = settings.actor;
		if ('priority' in settings) this.priority = settings.priority;
	}
};

gmath.inherit(Action, SplitPowerAction);

/** Match any exponent that is a number greater than 1. */
SplitPowerAction.prototype.match = function(node) {
	// is node an 'exponent' and node.children[0] is a number
	return node.is_group('exponent') && node.children[0] instanceof Num &&
         node.children[0].value >= 1;
}

SplitPowerAction.prototype.transform = function(callback) {

  var exp = this.getNewTreeNode(this.actor)
     ,pow = exp.parent
     ,parent = pow.parent;

  this.addTouchedNodes(this.actor);

  var idx = pow.remove();

  var newProd = MulDiv.prototype.createGroup();
  newProd.append(new MulDiv(pow));
  var newItem = Tree.clone(pow.children[0]);
  this.extendNodeMap(this.actor.parent.children[0].get_mapping_to(newItem));
  newProd.append(new MulDiv(newItem));

  var expVal = exp.children[0];
  expVal.value--;
  this.extendNodeMap(this.actor.children[0], newItem.parent);
  if (expVal.value===1) {
    var base = pow.children[0];
    pow.remove();
    newProd.children[0].append(base);
    this.extendNodeMap(this.actor.children[0], base.parent);
  } else if (expVal.value===0) {
    newProd.children[0].remove();
  }

  this.resultNodes = newProd.children.slice();

  parent.insert(idx, newProd);

	this.cleanup(parent);

	if (typeof(callback) === 'function') callback(this);
  return true;
}

return new SplitPowerAction();

})();// Copyright Erik Weitnauer 2013.

SplitPowerSumAction =
(function() {

var SplitPowerSumAction = function(settings) {
	Action.call(this, "x^(n1+n2+...+nm) => x^(n1+n2+...) * x^(nm)");
	this.priority = 3;
	if (settings) this.actor = settings.actor;
};

gmath.inherit(Action, SplitPowerSumAction);

/**
 * Match any number that is greater than 1.
 */
SplitPowerSumAction.prototype.match = function(node) {
	// is node an 'exponent' and node.children[0] is a number
	return node.is_group('exponent') && (node.children[0].is_group('brackets') && node.children[0].children[1].is_group('sum')
																				|| node.children[0].is_group('sum'));
}

SplitPowerSumAction.prototype.transform = function(callback) {

  var exp = this.getNewTreeNode(this.actor)
     ,pow = exp.parent
     ,parent = pow.parent
     ,sum = exp.children[0];
  if (sum.is_group('brackets')) sum = sum.children[1];
  var last_addend = sum.children[sum.children.length-1]
     ,old_plus = this.getOldTreeNode(last_addend.children[0]);

  this.addTouchedNodes(this.actor.parent);

  var idx = pow.remove();
  var newProd = MulDiv.prototype.createGroup();
  newProd.append(new MulDiv(pow));
  var newPow = Tree.clone(pow);
  newProd.append(new MulDiv(newPow));

  newPow.children[1].children[0].remove();
  last_addend.remove();
  var sum2 = last_addend.createGroup();
  sum2.append(last_addend);
  newPow.children[1].append(sum2);
  parent.insert(idx, newProd);

  if (old_plus.parent.is_group('add')) // map '+' to '*'
    this.updateNodeMap(old_plus, newProd.children[1].children[0]);
  else // map '-' to '*' and '-'
    this.extendNodeMap(old_plus, newProd.children[1].children[0]);
  this.cleanup(last_addend.parent);
  this.cleanup(sum);
  this.cleanup(parent);

  if (typeof(callback) === 'function') callback(this);
  return true;
}

return new SplitPowerSumAction();

})();
// Copyright Erik Weitnauer 2014

/**
  This is the first version of distribution.  It is an action that takes a
  range of sibling multiplicands and a sum contained within brackets. The
  brackets group is a multiplier of the range. The multiplicands are
  distributed among the terms of the sum, multiplying each.

  Ex:
    x*(1+2) ==> (x*1+x*2)
    (1+2+3)*x*y ==> (1*x*y+2*x*y+3*x*y)
*/

gmath.actions.DistributeIntoBracketsAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * target: a node relative to which the nodes will be moved
 * side: will be 'around' for this action (moving into something, not to one side or the other)
 */
var DistributeIntoBracketsAction = function(settings) {
  Action.call(this, "distribute");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
  }
};

gmath.inherit(Action, DistributeIntoBracketsAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
DistributeIntoBracketsAction.prototype.getAllAvailableActions = function(nodes) {
  var res = [];
  if (nodes.length === 0) return res;
  var root = nodes[0].get_root();
  if (!nodes[0].is_group('mul') && !nodes[0].is_group('div')) return [];
  var self = this;
  function check(target) {
    if (target.children[1] && target.children[1].is_group('brackets')) {
      n = target.children[1].children[1];
      if (self.match(nodes, n, "around"))
        res.push(self.createBoundAction(root, { nodes:nodes, target: n, side: 'around'}));
    }
  }
  var n = nodes[0];
  while (n = n.ls) check(n);
  n = nodes[nodes.length-1];
  while (n = n.rs) check(n);
  return res;
}

/** Must pass the nodes to move, the target node and the side of the target
 * node to move the nodes to. See the description of the constructor for details. */
DistributeIntoBracketsAction.prototype.match = function(nodes, target, side) {
  if (nodes.length === 0) return false;
  if (target.value === '(' || target.value === ')') return false;
  var brackets = target.parent;
  if (!brackets.parent) return false;
  var val = brackets.parent.value;
  if (val !== 'mul' && val !== 'div') return false;
  for (var i=0; i<nodes.length; i++) if (nodes[i].value !== val) return false;
  if (brackets.parent.parent !== nodes[0].parent) return false;
  if (!brackets.is_group('brackets')) return false;
  if (!brackets.children[1].is_group('sum')) return false;
  if (!nodes[0].commutative) return false;
  if (side === 'left-of' && brackets.ls === nodes[nodes.length-1]) return false;
  if (side === 'right-of' && brackets.rs === nodes[0]) return false;
  return true;
}

/** This function is synchronous, so you can also call it without providing a callback. */
DistributeIntoBracketsAction.prototype.transform = function(callback) {

  var nodes = this.getNewTreeNode(this.nodes);
  var target = this.getNewTreeNode(this.target);
  var old_brackets_l = this.target.parent.children[0]
    , old_brackets_r = this.target.parent.children[2];

  var bracketGroup = target.parent;

  // we have 'around' as the side (triggering the action),
  // so we have this variable to determine which side the
  // distributing variables are coming from.
  // this determines whether result will look like (num*var + ...) vs. (var*num + ...)
  // FIXME: pass 'left' or 'right' as side as part of the settings. 'around'
  // should be a separate setting called bbox.
  var varsOnLeftOrRight;
  if (nodes[nodes.length-1].rs && nodes[nodes.length-1].rs.children[1] &&
      nodes[nodes.length-1].rs.children[1] === bracketGroup) {
    varsOnLeftOrRight = 'left';
  }
  if (nodes[0].ls && nodes[0].ls.children[1] === bracketGroup) {
    varsOnLeftOrRight = 'right';
  }

  var parentProd = bracketGroup.parent.parent
     ,sum = bracketGroup.children[1];

  Tree.remove_range(nodes);

  this.distributeIntoSum(sum, nodes, varsOnLeftOrRight);

  if (parentProd.cleanupAction) this.cleanup(parentProd);

  // force brackets
  var sum_parent = sum.parent;
  if (!sum_parent.is_group('brackets')) {
    var idx = sum.remove();
    var newBrackets = new Brackets(sum);
    Tree.insert(sum_parent, idx, newBrackets);
    this.updateNodeMap(old_brackets_l.parent, newBrackets);
    this.updateNodeMap(old_brackets_l, newBrackets.children[0]);
    this.updateNodeMap(old_brackets_r, newBrackets.children[2]);
    newBrackets.simplify = true;
  }

  if (typeof(callback) === 'function') callback(this);
  else return true;
};

/** Takes a `sum` group and a list of `distributing variables`. The variables
 * will be multiplied with the terms in the sum on the specified `side` ('left'
 * or 'right').
 */
DistributeIntoBracketsAction.prototype.distributeIntoSum = function(sum, nodes, varSide) {
  var N = sum.children.length;
  var turn_into_muls = function(n) { if (n.is_group('div')) n.invert() };
  for (var i = 0; i < N; i++) {
    var target = sum.children[i].children[1]
      , newProd, cloned;
    target.remove();

    if (target.is_group('product')) newProd = target;
    else {
      newProd = new ProductFraction();
      newProd.append(new MulDiv(target));
    }

    if ((varSide === 'left' && i === 0) || (varSide === 'right' && i === N-1)) {
      cloned = nodes;
    } else cloned = Tree.clone(nodes);
    // when distributing inside a denominator, we need convert divs to muls
    cloned.forEach(turn_into_muls);
    this.extendNodeMap(Tree.get_mapping_between(this.nodes, cloned));

    {
      // mark cloned's new neighbor as "simplify" so if its a 1 it will be removed
      var neighbor_idx = (varSide === 'left') ? 1 : newProd.children.length-1;
      if (newProd.children[neighbor_idx]) newProd.children[neighbor_idx].simplify = true;
    }
    var idx = (varSide === 'left') ? 0 : newProd.children.length;
    newProd.insert_range(idx, cloned);
    sum.children[i].append(newProd);

    for (var j=0; j<cloned.length; j++) {
      cloned[j].update_x_during_dragging = true;
    }
  }
}

return new DistributeIntoBracketsAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.DistributeIntoBracketsAction);
// Copyright Erik Weitnauer 2014

/**
 * This is the first version of factoring out of brackets. It is intended for
 * use only when paired with AlgebraModel.DistributeIntoBracketsAction. It will
 * effectively undo the effects of that action. From identically structured
 * products, which are addends in a sum, identical ranges of terms will be
 * removed from those products and replaced as a multiplier to the whole sum.
 * Ex:
 *   (x*1+x*2) ==> (1+2)*x
 *   (1*x*y+2*x*y) ==> x*y*(1+2)
 */
gmath.actions.FactorOutOfBracketsAction =
(function() {

/** In the settings object, you must pass the following keys:
 * nodes: a range of nodes (array of sibling nodes, left to right without gaps)
 * target: a node relative to which the nodes will be moved
 * side: either 'left-of' or 'right-of', the side of the target to move the nodes to.
 */
var FactorOutOfBracketsAction = function(settings) {
  Action.call(this, "factor out");
  if (settings) {
    this.nodes = settings.nodes;
    this.target = settings.target;
    this.side = settings.side;
    this.priority = settings.priority || 0;
  }
};

gmath.inherit(Action, FactorOutOfBracketsAction);

/// Returns an array of bound actions, one for each possible target of `nodes`
/// in the tree they are in.
FactorOutOfBracketsAction.prototype.getAllAvailableActions = function(nodes) {
  if (nodes.length === 0) return [];
  var res = [], brackets = nodes[0];
  while (brackets.parent && !brackets.is_group('brackets')) brackets = brackets.parent;
  if (this.match(nodes)) {
    res.push(this.bindLeftSideAction(brackets, nodes));
    res.push(this.bindRightSideAction(brackets, nodes));
  }
  return res;
}

FactorOutOfBracketsAction.prototype.nodesAreAllAddends = function(sum, ranges) {
  if (!sum.is_group('sum')) return false;
  return sum.children.length === ranges.length;
}

FactorOutOfBracketsAction.prototype.bindLeftSideAction = function(brackets, nodes) {
  var root = nodes[0].get_root();
  return this.createBoundAction(root, {nodes: nodes, target: brackets.children[0], side: 'left-of'});
}

FactorOutOfBracketsAction.prototype.bindRightSideAction = function(brackets, nodes) {
  var root = nodes[0].get_root();
  return this.createBoundAction(root, {nodes: nodes, target: brackets.children[2], side: 'right-of'});
}

/** Returns the bracket group that is around each of the ranges at the right
 * level for factoring and not hidden. Otherwise returns null. */
FactorOutOfBracketsAction.prototype.getContainingBrackets = function(ranges) {
  try {
    var brackets = null;
    for (var i=0; i<ranges.length; i++) {
      var n = ranges[i][0];
      var br = n.is_group('mul') ? n.get_parent(4)  // bracket[sum[add[product[n]]]]
                                 : n.get_parent(3); // bracket[sum[add[n]]]
      if (!br || !br.is_group('brackets') || br.children[0].hidden) return null;
      if (!brackets) brackets = br;
      else if (brackets !== br) return null;
    }
    return brackets;
  } catch(ex) {
    return null;
  }
}

/** Must pass the nodes to move, the target node and the side of the target
 * node to move the nodes to. See the description of the constructor for details.
 * Passing an target node is optional. */
FactorOutOfBracketsAction.prototype.match = function(nodes, target) {
	var nodeRanges = AlgebraModel.groupNodeRanges(nodes);
  var brackets = this.getContainingBrackets(nodeRanges);
  if (!brackets) return false;
  if (target && !(brackets.children[0] === target
               || brackets.children[2] === target)) return false;
  if (!this.nodesAreAllAddends(brackets.children[1], nodeRanges)) return false;


	var rangeSize = nodeRanges[0].length;
	nodeRanges.forEach(function(range){ if (range.length!==rangeSize) return false; });
	for (var i = 0; i < rangeSize; i++) {
		var asciiA;
    if (nodeRanges[0][i].value==='mul') asciiA = nodeRanges[0][i].children[1].to_ascii();
    else asciiA = nodeRanges[0][i].to_ascii();
		for (var j = 0; j < nodeRanges.length; j++) {
      var asciiB;
      if (nodeRanges[j][i].value==='mul') asciiB = nodeRanges[j][i].children[1].to_ascii();
      else asciiB = nodeRanges[j][i].to_ascii();
			if (asciiB !== asciiA) return false;
		}
	}
	var cca = Tree.get_cca(nodes);
	return cca.is_group('sum') && cca.parent === brackets;
}

/** This function is synchronous, so you can also call it without providing a callback. */
FactorOutOfBracketsAction.prototype.transform = function(callback) {

  var nodes = this.getNewTreeNode(this.nodes);
  var bracketGroup = this.findBracketGroup(nodes);

  // the nodeRanges are the consecutive siblings of variables etc. that are to be factored out.
  // the values in the ranges are the same, but they are different nodes and have different IDs.
  var nodeRanges = AlgebraModel.groupNodeRanges(nodes);
  //console.log("", nodeRanges, "factoring out");
  var oldRanges = nodeRanges.map(this.getOldTreeNode.bind(this));

  this.removeRangesFromSum(nodeRanges);
  // var parent = this.replaceBracketGroupWithFactoredProduct(bracketGroup, nodeRanges, oldRanges);
  var parent = this.factor(bracketGroup, nodeRanges, oldRanges);

  if (parent.cleanupAction) this.cleanup(parent);

  if (typeof(callback) === 'function') callback(this);
  else return true;
};

// if we're factoring from a lone term, will we get the term or the addend?  i will assume the term.
FactorOutOfBracketsAction.prototype.findBracketGroup = function(nodes) {
  var node = nodes[0];
  if (node && node.parent && node.parent.parent && node.parent.parent.is_group('sum')
      && node.parent.parent.parent && node.parent.parent.parent.is_group('brackets'))
    return node.parent.parent.parent;
  if (node && node.parent && node.parent.is_group('product')
      && node.parent.parent && node.parent.parent.parent && node.parent.parent.parent.is_group('sum')
      && node.parent.parent.parent.parent && node.parent.parent.parent.parent.is_group('brackets'))
    return node.parent.parent.parent.parent;

  throw "Attempting to factor from invalid structure."
}

FactorOutOfBracketsAction.prototype.removeRangesFromSum = function(nodeRanges) {
  for (var i = 0; i < nodeRanges.length; i++) {
    var range = nodeRanges[i];
    var rangeParent = nodeRanges[i][0].parent;
    if (range.length === rangeParent.children.length) {
      var tree = rangeParent.parent;
      rangeParent.remove();
      Tree.remove_range(range);
      tree.append(new Num(1));
      this.cleanup(tree);
    } else if (rangeParent.value==='add' || rangeParent.value==='sub' && range.length===1) {
      range[0].remove();
      rangeParent.append(new Num(1));
    } else {
      Tree.remove_range(nodeRanges[i]);
      this.cleanup(rangeParent);
    }
  }
}

FactorOutOfBracketsAction.prototype.factor = function(bracketGroup, nodeRanges, oldRanges) {
  return this.replaceBracketGroupWithFactoredProduct(bracketGroup, nodeRanges, oldRanges);
}

FactorOutOfBracketsAction.prototype.replaceBracketGroupWithFactoredProduct = function(bracketGroup, nodeRanges, oldRanges) {
  var factoredProd = MulDiv.prototype.createGroup();
  var parent = bracketGroup.parent;
  var idx = bracketGroup.remove();
  var range;
  // depending on which side of the brackets we're pulling from, arrange the product appropriately
  // also, we set this.nodes (the draggable nodes) differently depending on which side we pull from.
  if (this.side === 'left-of') {
    range = nodeRanges[0];
    if (range.length===1 && range[0].value!=='mul') {
      range = [new MulDiv(range[0])];
    }
    factoredProd.append_range(range);
    factoredProd.append(new MulDiv(bracketGroup));
    // reselect the left-most range
    for (var i=0; i<oldRanges.length; i++) {
      if (oldRanges[i].length === 1 && !oldRanges[i][0].is_group('mul')) {
        this.updateNodeMap(oldRanges[i][0], range[0]);
      } else {
        this.updateNodeMap(Tree.get_mapping_between(oldRanges[i], range));
      }
    }
  } else {
    range = nodeRanges[nodeRanges.length-1];
    if (range.length===1 && range[0].value!=='mul') {
      range = [new MulDiv(range[0])];
    }
    factoredProd.append(new MulDiv(bracketGroup));
    factoredProd.append_range(range);
    // reselect the right-most range
    for (var i=0; i<oldRanges.length; i++) {
      if (oldRanges[i].length === 1 && !oldRanges[i][0].is_group('mul')) {
        this.updateNodeMap(oldRanges[i][0], range[0]);
      } else {
        this.updateNodeMap(Tree.get_mapping_between(oldRanges[i], range));
      }
    }
  }
  for (var j=0; j<range.length; j++) {
    range[j].update_x_during_dragging = true;
  }

  Tree.insert(parent, idx, factoredProd);
  return parent;
}

FactorOutOfBracketsAction.prototype.mapIndex = function() {
  return (function() {});
};

return new FactorOutOfBracketsAction();
})();
AlgebraModel.prototype.move_actions.push(gmath.actions.FactorOutOfBracketsAction);
AlgebraModel.prototype.SubstitutionAction =

(function () {

var SubstitutionAction = function(settings) {
	Action.call(this, 'substitution');
	if (settings) {
		this.sourceEq = settings.source;
		this.target = settings.target; // a node range; must be named target for HitTester
	}
};

gmath.inherit(Action, SubstitutionAction);

SubstitutionAction.prototype.getAllAvailableActions = function(source, target) {
	var results = this.findAllMatches(source, target);
	var actions = [];
	for (var i=0; i<results.length; i++) {
		var action = target.SubstitutionAction.createBoundAction(target, {source:source, target:results[i]});
		actions.push(action);
	}
	return actions;
}

SubstitutionAction.prototype.match = function(source, ns) {
	if (ns.length === 0 || ns[0].fixed) return false;
	if (!source.parent) source = source.children[0];
	if (!source.is_group('equals')) return false;
	var src_str = source.children[0].to_ascii();
	var check_fn = has_same_val_fn(src_str);
	return check_fn(ns);
}

function toAscii(ns) {
	if (ns.length === 1 && ns[0].hidden) return '';
	return ns.map(function(n) { return n.to_ascii() }).join('');
}

function isLeadingCommutativeOp(node) {
	return (node.is_group() && node.commutative && node.associative);
}

function toAsciiNoLeadingOp(ns) {
	if (ns.length === 0) return '';
	if (ns.length === 1 && ns[0].hidden) return '';
	var str = ns.map(function(n) { return n.to_ascii() }).join('');
	if (ns.length === 1) return str;
	if (isLeadingCommutativeOp(ns[0])) return str.substring(ns[0].children[0].to_ascii().length);
	return str;
}

function toAsciiFraction(ns) {
	if (ns.length !== 1) return '';
	var str = ns[0].to_ascii();
	if (str.slice(0, 1) === '(' && str.slice(str.length-1, str.length) === ')')
		str = str.substr(1, str.length-2);
	return str;
}

SubstitutionAction.prototype.findAllMatches = function(source, targetTree) {
	if (!source.parent) source = source.children[0];
	if (!source.is_group('equals')) return [];

	if (!targetTree.parent) targetTree = targetTree.children[0];
	var src_str = source.children[0].to_ascii();
	var res = targetTree.filterRange(has_same_val_fn(src_str));
	res = res.filter(function(range) { return range.length > 0 && !range[0].fixed });
	return res;
}

SubstitutionAction.prototype.transform = function(callback) {

	var old_target_range = this.target
	   ,new_target_range = old_target_range.map(this.getNewTreeNode.bind(this));

	var p = new_target_range[0].parent;
	var idx = Tree.remove_range(new_target_range);
	var substitution = Tree.clone(this.sourceEq.children[0].children[2]);
	// make sure that substitution is of the right type if we replaced a range
	if (new_target_range.length > 1) {
		substitution = new new_target_range[0].constructor(substitution);
	}
	if (this.sourceIsASignGroupOrHasALeadingNegativeCoefficient(this.sourceEq)
		  && new_target_range[0].is_group('sub')) {
		substitution = new AddSub(substitution);
	}

	p.insert(idx, substitution);
	var changed = this.cleanup(substitution);
	if (!changed) Brackets.handle(substitution);
	this.cleanup(p);

	if (typeof(callback) === 'function') callback(this);
	return true;
}

SubstitutionAction.prototype.sourceIsASignGroupOrHasALeadingNegativeCoefficient = function(sourceEq) {
	var leftSide = sourceEq.children[0].children[0];
	if (leftSide.is_group('sign')) return true;
	else if (leftSide.is_group('product') && leftSide.children[0].children[1].is_group('sign')) return true;
	return false;
}

function range_contains_all_siblings(ns) {
	return ns[0] && ns[0].parent && !ns[0].parent.is_group('exponent') && ns.length === ns[0].parent.children.length;
}

function is_not_root(n) {
	return n.parent;
}

function has_same_val_fn(val) {
  return function(ns) {
  	if (ns.length === 0) return false;
  	if (!ns[0].parent) return false;
  	if (is_not_root(ns[0].parent) && range_contains_all_siblings(ns)) return false;
  	return (toAscii(ns) === val || toAsciiNoLeadingOp(ns) === val || toAsciiFraction(ns) === val);
  }
}

return new SubstitutionAction();
})();
/** FactoringAction:
Input: bracketed sum (from target model), factor (from source model), our DList
Match: check whether we can pull out the factor of the bracketed sum
DoInPlace: tell the derivationList that it has been triggerd, so the derivationList
  can stop & cut off the current drag handler and instead start & forward events
  to the new dragHandler of the target expression.
*/

TriggerFactoringAction =

(function() {

var TriggerFactoringAction = function(settings) {
  Action.call(this, "general factoring");
  this.priority = 0;
  this.side = 'around';
  if (settings) {
  	this.DLOfSum = settings.dl;
  	this.viewOfSum = settings.view;
  	this.target = settings.sum;
  	this.callback = settings.callback;
  }
}

gmath.inherit(Action, TriggerFactoringAction);

TriggerFactoringAction.prototype.match = function(sum, factor) {
	// TODO: match on invisible terms, too.
	//return containsFactor(sum, factor);

	return selectFactorsInSum(sum, factor);
}

TriggerFactoringAction.prototype.transform = function() {
	this.callback(this.viewOfSum, this.target, this.DLOfSum);
}

var selectFactorsInSum = function(sum, factors) {
  var matchingNodes;
  matchingNodes = collectMatchingNodesInSum(sum, factors);
  matchingNodes = filterByStructure(matchingNodes, sum);
  var selectedNodes = [];
  for (var i=0; i<matchingNodes.length; i++) {
  	if (matchingNodes[i].length===0) return false;
  }
  for (var i=0; i<matchingNodes.length; i++) {
    if (matchingNodes[i])
      selectedNodes.push(matchingNodes[i][matchingNodes[i].length-1]);
  }
  for (var i=0; i<selectedNodes.length; i++) {
    if (!Array.isArray(selectedNodes[i]) && selectedNodes[i].parent.value !== 'add' && selectedNodes[i].parent.value !== 'sub')
      selectedNodes[i] = selectedNodes[i].parent;
  }
  return selectedNodes.length===sum.children.length ? selectedNodes : false;
}

var selectAllRangesWithMatchingValue = function(term, val) {
  var res = [];
  term.for_each(function(n) {
    var nval = n.to_ascii();
    //if (!n.ls && nval.slice(0,1) === '*') nval = nval.substr(1);
    if (nval.slice(0,1) === '*') nval = nval.substr(1);
    if (!n.hidden && nval === val) res.push(n);
    else {
      var ns = [n];
      while (nval.length < val.length && n.commutative && n.rs) {
        n = n.rs;
        nval += n.to_ascii();
        ns.push(n);
      }
      if (nval === val) res.push(ns);
    }
  });
  return res;
}

var collectMatchingNodesInSum = function(sum, factors) {
  var sumFactors = [];
  for (var i=0; i<sum.children.length; i++) {
    var addend = sum.children[i], term = addend.children[1];
    //sumFactors.push(term.filter(select_by_value(factors.to_ascii())));
    sumFactors.push(selectAllRangesWithMatchingValue(term, factors.to_ascii()));
  }
  return sumFactors;
}

function select_by_value(val) {
  return function(n) { return !n.hidden && n.to_ascii() === val }
}

var filterByStructure = function(factorCollection, sum) {
  var isSingleTermInAddend = function(node) {
    return (node.parent && (node.parent.value==='add' || node.parent.value==='sub')
              && node.parent.parent && node.parent.parent==sum);
  }
  var isSingleTermFromProduct = function(node) {
    return (node.parent && node.parent.value==='mul'
              && node.parent.parent && node.parent.parent.is_group('product')
              && node.parent.parent.parent && node.parent.parent.parent.parent && node.parent.parent.parent.parent==sum);
  }
  var isOneTermOfManyFromProduct = function(node) {
  	return (node.value==='mul'
  						&& node.parent && node.parent.is_group('product')
  						&& node.parent.parent && node.parent.parent.parent && node.parent.parent.parent==sum);
  }
  var isChildOfAddendOrProduct = function(node) {
  	var boolForLs = true;
  	if (Array.isArray(node)) {
  		for (var i=0; i<node.length; i++)
  			if (!isOneTermOfManyFromProduct(node[i]))
  				boolForLs = false;
  	} else {
    	return isSingleTermInAddend(node) || isSingleTermFromProduct(node);
    }
    return boolForLs;
  }

  for (var i=0; i<factorCollection.length; i++) {
    factorCollection[i] = factorCollection[i].filter(isChildOfAddendOrProduct);
  }
  return factorCollection;
}

/*
	selectFactors:
		want to take a sum and a factors (could be a product, var, num, fraction, brackets, power)
		a list is returned containing the nodes in the sum that match the factors
		the factors have to match on every addend to be selected
 */

// for all addends in the sum
//

var containsFactor = function(sum, factor) {
	var deconstructedSum = deconstruct(sum)
	   ,commonFactorsInSum = searchForCommonFactors(deepCopyOfArray(deconstructedSum));
	var deconstructedFactor = factor.deconstruct();
	return sumContainsFactors(commonFactorsInSum, deconstructedFactor);
}

var deepCopyOfArray = function(array) {
	var newArr = [];
	for (var i=0; i<array.length; i++) {
		newArr.push(array[i].slice());
	}
	return newArr;
}

var deconstruct = function(sum) {
	var deconstructedTerms = [];
	for (var i=0; i<sum.children.length; i++) {
		deconstructedTerms.push(deconstructTerm(sum.children[i]));
	}
	return deconstructedTerms;
}

var deconstructTerm = function(addsub) {
	var term = addsub.children[1];
	if (addsub.value==='add') return term.deconstruct();
	else return appendNegativeIdentity(term.deconstruct());
}

var appendIdentity = function(factors) {
	factors.push(new Num(1));
	return factors;
}

var appendNegativeIdentity = function(factors) {
	factors.push(new Num(-1));
	return factors;
}

var searchForCommonFactors = function(elements) {
	var commonFactors = elements[0].slice();
	for (var i=0; i<elements.length; i++) {
		removeUncommonFactors(commonFactors, elements[i]);
	}
	return commonFactors;
}

var removeUncommonFactors = function(commonFactors, someFactors) {
	for (var i=0; i<commonFactors.length; ) {
		if (nodeIsUncommon(commonFactors[i], someFactors))
			commonFactors.splice(i, 1);
		else
			i++;
	}
}

var nodeIsUncommon = function(factor, factors) {
	var ascii = factor.to_ascii();
	var isUncommon = true;
	for (var i=0; i<factors.length; ) {
		if (ascii===factors[i].to_ascii()) {
			isUncommon = false;
			factors.splice(i, 1);
			return isUncommon;
		} else { i++; }
	}
	return isUncommon;
}

var sumContainsFactors = function(commonFactorsInSum, deconstructedFactors) {
	var contains = true;
	for (var i=0; i<deconstructedFactors.length; i++) {
		if (nodeIsUncommon(deconstructedFactors[i], commonFactorsInSum)) {
			contains = false;
		}
	}
	return contains;
}

return new TriggerFactoringAction();
})();// Copyright Erik Weitnauer 2013.

// Direction might be 'left' or 'right' or 'both' (default: 'both').
gmath.rules = gmath.rules || {};

gmath.rules.distributes = function(mul_op, add_op, dir) {
  dir = dir || 'both';
  var name = mul_op.prototype.value + ' ' + (dir == 'both' ? '' : dir+'-')
             + 'distributes over ' + add_op.prototype.value;

  var run = function(dir) {
    var fact2, fact1;
    if (dir == 'both') {
      if (!this.is_group(mul_op.prototype.name)) return false;
      return (run.call(this, 'left') || run.call(this, 'right'));
    }
    else if (dir == 'left') { fact2 = this; fact1 = this.ls; }
    else if (dir == 'right') { fact2 = this.ls; fact1 = this; }
    else throw "direction must be left, right or both, not '" + dir + "'";

    // fact1 must exist and be of type mul_op
    if (!(fact1 instanceof mul_op)) return;
    // sibling must exists, be a group (opt. in single brackets), must have
    // children which are of type add_op
    if (!fact2) return false;
    var sum = fact2.children[1];
    if (sum.is_group('brackets')) sum = sum.children[1];
    if (!sum.is_group(add_op.prototype.group_name)) return false;

    // now perform the rewriting
    Tree.remove(fact1);
    Tree.for_each(function (n) { n.no_anim = true }, fact1);

    for (var i=0; i<sum.children.length; i++) {
      var add_block = sum.children[i];
      var addend = add_block.children[1];
      /// clone the factor that is distributed
      var clone = Tree.clone(fact1);
      if ((addend instanceof Group) && (addend.children[0] instanceof mul_op)) {
        // there is already a product, just add the new factor
        if (dir == 'left') Tree.insert(addend, 0, clone);
        else Tree.append(addend, clone);
      } else {
        // no product, we need to create one with the new factor and the existing addend
        var i_prod = mul_op.prototype.createGroup();
        Tree.remove(addend);
        var m1 = new mul_op(addend);
        Tree.replace(m1.children[0], Tree.clone(this.children[0]));
        Tree.append(i_prod, (dir == 'left' ? clone : m1));
        Tree.append(i_prod, (dir == 'left' ? m1 : clone));
        Tree.append(add_block, i_prod);
        Brackets.handle(i_prod);
      }
    }

    //var child = fact2.children[1];
    fact2.clean_up();
    //if (child.is_group('brackets')) child.perform();
    return true;
  }

  mul_op.prototype.add_action_handler({name: name, run: function() {
   return run.call(this, dir)
  }});
}// Copyright Erik Weitnauer 2013.

// Direction might be 'left' or 'right' or 'both' (default: 'both').
gmath.rules = gmath.rules || {};

gmath.rules.inverse_operation = function(op1, op2) {
  op1.prototype.inverse = op2.prototype.value;
  op2.prototype.inverse = op1.prototype.value;

  var perform = function() {
    if (!this.ls) return false;
    if ((this.ls instanceof this.getInverse()) && this.children[1].to_ascii() == this.ls.children[1].to_ascii()) {
      Tree.remove(this.ls);
      var idx = Tree.remove(this);
      Tree.insert(this.parent, idx, new op1(Tree.clone(this.identity_element)));
      this.parent.clean_up();
      return true;
    }
    return false;
  }

  op1.prototype.add_action_handler({ name: 'inverse elements cancel out each other', run: perform });
  op2.prototype.add_action_handler({ name: 'inverse elements cancel out each other', run: perform });
}// Copyright Erik Weitnauer 2014.

gmath.rules = gmath.rules || {};

gmath.rules.identity_element = function(op, ie) {
  op.prototype.identity_element = ie;
  var name = ie.to_ascii() + ' is the identity element of ' + op.prototype.value;
  var ie_str = ie.to_ascii();

  var IdAction = function(settings) {
    Action.call(this, name);
    if (settings) this.actor = settings.actor;
  };

  gmath.inherit(Action, IdAction);

  function matches(node) {
    return (node && (node instanceof op) && node.children.length == 2 &&
            node.children[1].to_ascii() == ie_str);
  }

  IdAction.prototype.match = function(node) {
    return (matches(node) || matches(node.ls));
  }

  /** This method is synchronous so you don't have to pass a callback. */
  IdAction.prototype.transform = function(callback) {

    var node = this.getNewTreeNode(this.actor);

    if (matches(node)) {
      this.addTouchedNodes(this.actor);
      this.updateNodeMap(this.actor.select_all(), node.ls || node.rs);
      node.remove();
    } else {
      this.addTouchedNodes(this.actor.ls);
      this.updateNodeMap(this.actor.ls.select_all(), node);
      node.ls.remove();
    }

    this.cleanup(node.parent);

    if (typeof(callback) === 'function') callback(this);
    else return true;
  }

  op.prototype.add_action_handler(new IdAction());
}
// Copyright Erik Weitnauer 2014.

gmath.rules = gmath.rules || {};

gmath.rules.zero_element = function(op, zero_element) {
  op.prototype.zero_element = zero_element;
  var ze = zero_element.to_ascii();
  var name = ze + ' is the zero element of ' + op.prototype.value;

  var ZeroAction = function(settings) {
    Action.call(this, name);
    if (settings) this.actor = settings.actor;
  };

  gmath.inherit(Action, ZeroAction);

  function matches(node) {
    return (node && (node instanceof op) && node.children.length == 2 &&
            node.children[1].to_ascii() == ze);
  }

  ZeroAction.prototype.match = function(node) {
    if (!node.ls) return false;
    return (matches(node) || matches(node.ls));
  }

  /** This method is synchronous so you don't have to pass a callback. */
  ZeroAction.prototype.transform = function(callback) {

    var node = this.getNewTreeNode(this.actor);

    if (matches(node)) {
      this.addTouchedNodes(this.actor.ls);
      node.ls.remove();
    } else {
      this.addTouchedNodes(this.actor);
      node.remove();
    }

    this.cleanup(node.parent);

    if (typeof(callback) === 'function') callback(this);
    else return true;
  }

  op.prototype.add_action_handler(new ZeroAction());
}
/// Copyright by Erik Weitnauer 2013.

gmath.rules = gmath.rules || {};

gmath.rules.init_all = function() {
	gmath.rules.identity_element(AddSub, new Num(0));
	gmath.rules.identity_element(MulDiv, new Num(1));
	gmath.rules.zero_element(MulDiv, new Num(0));
	//gmath.rules.identity_element(Sub, new Num(0));
	//gmath.rules.inverse_operation(Add, Sub);
	//gmath.rules.identity_element(Mul, new Num(1));
	//gmath.rules.zero_element(Mul, new Num(0));
	gmath.rules.identity_element(And, new Bool("T"));
	gmath.rules.zero_element(And, new Bool("F"));
	gmath.rules.identity_element(Or, new Bool("F"));
	gmath.rules.zero_element(Or, new Bool("T"));
	// don't do the distribution by default
	//gmath.rules.distributes(Mul, Add);
	// these 2 rules can turn a small term into a very big one quickly
	//gmath.rules.distributes(And, Or);
	//gmath.rules.distributes(Or, And);
}

gmath.rules.init_all();/// Based on the d3.behavior.drag and d3.behavior.zoom.
/// Use .frame(container) to compute the positions relative to the passed container.
/// The default value is the special string 'client', which means the initial position
/// will simply be the clientX, clientY values of the mouse / touch event.
mtouch_events = function() {
  var event = d3_eventDispatch(mtouch, "tap", "dbltap", "hold", "drag", "mdrag", 'touch', 'release')
     ,target_el = null
     ,fingers = [] // array of augmented touches = fingers
     ,id2finger = {} // maps ids to fingers
     ,last_taps = [] // [{timeStamp: xxx, pos: [x,y]}, ...], used to detect dbltaps
     ,mouse_id = 'mouse'
     ,frame = 'client' // compute position relative to this element
     ,origin = null // if set, don't use frame but call this method to set pos0
     ,connected = false // are the listeners registered?
     ,tap_max_time = 250
     ,tap_max_dist2 = 10*10
     ,hold_time = 500
     ,hold_max_dist = 10
     ,hold_max_dist2 = hold_max_dist*hold_max_dist
     ,dbltap_max_delay = 400
     ,dbltap_max_dist = 20
     ,uid = gmath.uid();

  function mtouch() {
    target_el = this;
    mtouch.connected(true);
  }

  /// Connects or disconnects all event listeners according to the passed argument.
  /// If no argument is passed, it returns whether the event listeners are currently
  /// connected.
  mtouch.connected = function(arg) {
    if (arguments.length == 0) return connected;
    target_el.on("touchstart."+uid,  arg ? touchstarted : null)
        .on("mousedown."+uid,   arg ? mousedown    : null)
        .on("touchmove."+uid,   arg ? touchmoved   : null)
        .on("touchend."+uid,    arg ? touchended   : null)
        .on("touchcancel."+uid, arg ? touchended   : null);
    connected = arg;
    return this;
  }

  mtouch.call = function(f) {
    f.apply(mtouch, arguments); return this;
  }

  mtouch.frame = function(arg) {
    if (arguments.length === 0) return frame;
    frame = arg;
    return this;
  }

  mtouch.origin = function(arg) {
    if (arguments.length === 0) return origin;
    origin = arg;
    return this;
  }

  mtouch.hold_time = function(arg) {
    if (arguments.length === 0) return hold_time;
    hold_time = arg;
    return this;
  }

  mtouch.hold_max_dist = function(arg) {
    if (arguments.length === 0) return hold_max_dist;
    hold_max_dist = arg;
    hold_max_dist2 = hold_max_dist*hold_max_dist;
    return this;
  }

  mtouch.dbltap_max_dist = function(arg) {
    if (arguments.length === 0) return dbltap_max_dist;
    dbltap_max_dist = arg;
    return this;
  }

  /// On mousedown, start listening for mousemove and mouseup events on the
  /// whole window. Also call the touchstarted function. If it was not the left
  /// mousebutton that was pressed, do nothing.
  function mousedown() {
    if (!detectLeftButton(d3.event)) return;
    var w = d3.select(window);
    var thiz = this, argumentz = arguments;
    w.on("mousemove.mtouch", function() { touchmoved.apply(thiz, argumentz) });
    w.on("mouseup.mtouch", function() {
      w.on("mousemove.mtouch", null);
      w.on("mouseup.mtouch", null);
      touchended.apply(thiz, argumentz);
    });
    touchstarted.apply(this, arguments);
  }

  function touchstarted() {
    d3.event.preventDefault();
    var target = this
       ,event_ = event.of(target, arguments)
       ,touches = get_changed_touches();

    var pos0 = (origin ? origin.apply(this, arguments) : null);
    for (var i=0,N=touches.length; i<N; i++) {
      var finger = new Finger(touches[i].identifier, event_, target, pos0);
      fingers.push(finger);
      id2finger[touches[i].identifier] = finger;
      event_({type: 'touch', finger: finger, fingers: fingers});
    }
  }

  function touchmoved() {
    d3.event.preventDefault();
    var target = this
       ,event_ = event.of(target, arguments)
       ,touches = get_changed_touches();

    for (var i=0,N=fingers.length; i<N; i++) fingers[i].changed = false;

    var df = [];
    for (var i=0,N=touches.length; i<N; i++) {
      var finger = id2finger[touches[i].identifier];
      if (!finger) continue;
      finger.move(event_);
      df.push(finger);
    }

    event_({type: 'mdrag', dragged_fingers: df, fingers: fingers});
  }

  function touchended() {
    d3.event.preventDefault();
    var target = this
       ,event_ = event.of(target, arguments)
       ,touches = get_changed_touches();

    for (var i=0,N=touches.length; i<N; i++) {
      var finger = id2finger[touches[i].identifier];
      if (!finger) continue;
      finger.end(event_);
      delete id2finger[touches[i].identifier];
      fingers = d3.values(id2finger);
      event_({type: 'release', finger: finger, fingers: fingers});
    }
  }

  function Finger(id, event, target, pos0) {
    this.id = id;
    this.target = target;
    this.event = event;
    this.parent = target.parentNode;
    this.timeStamp0 = d3.event.timeStamp;
    this.timeStamp = this.timeStamp0;
    this.hold_timer = setTimeout(this.held.bind(this), hold_time);
    this.pos = (pos0 ? pos0.slice() : get_position_in_frame(this.id, frame));
    this.pos0 = [this.pos[0], this.pos[1]];
    this.pos_client = get_position_in_frame(this.id, 'client');
    this.dist_x = 0; // dx between current and starting point
    this.dist_y = 0;
    this.dx = 0; // dx in the last dragging step
    this.dy = 0;
    this.dt = 0; // dt in the last dragging step
    this.changed = true; // used by gesture to check whether it needs to update
    this.gesture = null; // is set when finger gets bound to a gesture
  }

  Finger.prototype.cancel_hold = function() {
    if (this.hold_timer) clearTimeout(this.hold_timer);
    this.hold_timer = null;
  }

  Finger.prototype.held = function() {
    this.event({type: 'hold', finger: this, fingers: fingers});
    this.hold_timer = null;
  }

  Finger.prototype.move = function(event) {
    this.changed = true;
    this.event = event;

    var p = get_position_in_frame(this.id, 'client')
       ,t = d3.event.timeStamp;
    this.dx = p[0] - this.pos_client[0];
    this.dy = p[1] - this.pos_client[1];
    this.pos[0] += this.dx;
    this.pos[1] += this.dy;
    this.dist_x = this.pos[0] - this.pos0[0];
    this.dist_y = this.pos[1] - this.pos0[1];
    this.pos_client = p;
    this.dt = t-this.timeStamp;
    this.timeStamp = t;

    if (this.dist_x*this.dist_x+this.dist_y*this.dist_y > hold_max_dist2) {
      this.cancel_hold();
    }

    if (this.gesture) return;

    event({ type: 'drag', finger: this, x: this.pos[0], y: this.pos[1]
          , dx: this.dx, dy: this.dy, fingers: fingers});
  }

  Finger.prototype.end = function(event) {
    var dt = d3.event.timeStamp - this.timeStamp0;
    if (dt <= tap_max_time && (this.dist_x*this.dist_x+this.dist_y*this.dist_y) <= tap_max_dist2) {
      if (match_tap(d3.event.timeStamp, this.pos[0], this.pos[1])) {
        event({type: 'dbltap', finger: this, fingers: fingers});
      } else {
        event({type: 'tap', finger: this, fingers: fingers});
      }
    }
    this.cancel_hold();
  }

  function get_changed_touches() {
    return d3.event.changedTouches || [{identifier: mouse_id}];
  }

  function detectLeftButton(event) {
    if ('buttons' in event) return event.buttons === 1;
    else if ('which' in event) return event.which === 1;
    else return event.button === 1;
  }

  /// Returns true if any tap in the last_taps list is spatially and temporally
  /// close enough to the passed time and postion to count as a dbltap. If not,
  /// the passed data is added as new tap. All taps that are too old are removed.
  function match_tap(timeStamp, x, y) {
    var idx = -1, pos = [x,y];
    last_taps = last_taps.filter(function (tap, i) {
      if (timeStamp - tap.timeStamp <= dbltap_max_delay
         && get_distance(tap.pos, pos) <= dbltap_max_dist) idx = i;
      return tap.timeStamp-timeStamp <= dbltap_max_delay && idx !== i;
    });
    if (idx === -1) last_taps.push({timeStamp: timeStamp, pos: pos});
    return idx !== -1;
  }

  function get_position(id) {
    if (origin) return origin();
    else return get_position_in_frame(id, frame);
  }

  // cheap, but may have an offset that depends on scrolling
  function get_position_in_frame(id, frame) {
    if (frame === 'client') {
      if (id === mouse_id) return [d3.event.clientX, d3.event.clientY];
      for (var i=0; i<d3.event.touches.length; i++) {
        var t = d3.event.touches[i];
        if (t.identifier === id) return [t.clientX, t.clientY];
      }
    } else {
      if (id === mouse_id) return d3_relativePosition(frame, d3.event);
      for (var i=0; i<d3.event.touches.length; i++) {
        var t = d3.event.touches[i];
        if (t.identifier === id) return d3_relativePosition(frame, t);
      }
    }
  }

  function get_distance(p1, p2) {
    return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0]) + (p1[1]-p2[1])*(p1[1]-p2[1]));
  }

  return d3.rebind(mtouch, event, "on");
};

/// Replication of the internal d3_eventDispatch method.
function d3_eventDispatch(target) {
  var dispatch = d3.dispatch.apply(this, Array.apply(null, arguments).slice(1));
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };
  return dispatch;
}
gmath.d3_eventDispatch = d3_eventDispatch;

/// Replication of internal d3_mousePoint method.

// https://bugs.webkit.org/show_bug.cgi?id=44083

//  var d3_mouse_bug44083 = (typeof(window)!=='undefined'? (/WebKit/.test(window.navigator.userAgent) ? -1 : 0) : 0);
var d3_mouse_bug44083 = 0;
if (typeof(window)!=='undefined') d3_mouse_bug44083 = /WebKit/.test(window.navigator.userAgent) ? -1 : 0;

function d3_relativePosition(container, touch) {
  var svg = container.ownerSVGElement || container;
  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    if (d3_mouse_bug44083 < 0 && (window.scrollX || window.scrollY)) {
      svg = d3.select("body").append("svg").style({
        position: "absolute",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        border: "none"
      }, "important");
      var ctm = svg[0][0].getScreenCTM();
      d3_mouse_bug44083 = !(ctm.f || ctm.e);
      svg.remove();
    }
    if (d3_mouse_bug44083) point.x = touch.pageX, point.y = touch.pageY;
    else point.x = touch.clientX, point.y = touch.clientY;
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return [point.x, point.y];
  }
  var rect = container.getBoundingClientRect();
  return [touch.clientX - rect.left - container.clientLeft, touch.clientY - rect.top - container.clientTop];
};
/** Registers 1 or 2 finger drags. Each gesture starts with one finger and its
initial position and a distance of 0. As soon as a second finger touches the screen,
the initial position and distance is updated. When a finger leaves the screen now
so its one finger again, the initial position is updated again, but the initial
distance and current distance stay at the old values.

Emits 'drag-start', 'drag' and 'drag-end' events.

* 'drag-start'
  * released when 1 finger is down and moved at least 'min-1f-dist' pixels and
  (possibly a 2nd time during one gesture) when 2 fingers are down and their
  center moved at least 'min-2f-dist' pixels or their distance changed at least
  'min-2f-dist'
  * parameters:
  	* fingers: array of one or two fingers
  	* pos0, pos: initial and current (center) position of the gesture
  	* dist0, dist: initial and current distance of the gesture

* 'drag'
	* released whenever one of the active fingers in the current gesture moved
	* parameter:
		* fingers, pos0, pos, dist0, dist: like in drag-start
		* dx, dy: change of (center) position of gesture since last event

* 'drag-end'
		* released when all fingers are released in a dragging gesture
*/
drag_behavior = function() {
	var event = d3_eventDispatch(drag, 'drag', 'drag-start', 'drag-end')
	   ,fingers = []     // array of one or two fingers in current dragging gesture
	   ,active = false   // is the gesture ongoing?
	   ,pos0, pos        // initial and current (center) position of gesture
	   ,dist0, dist      // initial and current distance b/w fingers (zero for one finger)
	   ,min_1f_dist = 10 // 1 finger drag starts if center moved at least this many pixels
	   ,min_2f_dist = 5  // 2 finger drag starts if center moved at least this many pixels
	   ,allow_double_drag = true // if false will ignore all fingers but the first

	var drag = function() {
		this.on('touch.drag', touched) // the keyword behind the '.' is a subnamespace
		    .on('mdrag.drag', dragged) // this way we won't override any existing listeners
		    .on('release.drag', released); // to the touch, mdrag and release events
	}

	drag.min_single_dist = function(arg) {
		if (arguments.length === 0) return min_1f_dist;
		min_1f_dist = arg;
		return this;
	}

	drag.min_double_dist = function(arg) {
		if (arguments.length === 0) return min_2f_dist;
		min_2f_dist = arg;
		return this;
	}

	drag.allow_double_drag = function(arg) {
		if (arguments.length === 0) return allow_double_drag;
		allow_double_drag = arg;
		return this;
	}

	var touched = function() {
		if ( fingers.length === 2  // enough fingers already
		  || allow_double_drag && fingers.length === 1) return;
		fingers.push(d3.event.finger);
		if (fingers.length === 2) { // two fingers down!
			pos0 = [ (fingers[0].pos[0]+fingers[1].pos[0])/2
			       , (fingers[0].pos[1]+fingers[1].pos[1])/2];
			pos = [pos0[0], pos0[1]];
			dist = dist0 = get_distance(fingers[0].pos, fingers[1].pos);
		} else { // one finger down!
			pos0 = [fingers[0].pos[0], fingers[0].pos[1]];
			pos = [pos0[0], pos0[1]];
			dist0 = dist = 0;
		}
	}

	var dragged = function() {
		if (fingers.length === 0) return;
		var newpos, evt = event.of(this, arguments);
		// update center pos and start drag gesture
		if (fingers.length === 1) { // 1 finger
			if (!fingers[0].changed) return;
			newpos = [fingers[0].pos[0], fingers[0].pos[1]];
			if (!active && get_distance(pos0, pos) >= min_1f_dist) {
				active = true;
			  evt({ type: 'drag-start', fingers: fingers, pos0: pos0, pos: pos
			  	  , dist0: dist0, dist: dist})
			}
		} else { // 2 fingers
			if (!fingers[0].changed && !fingers[1].changed) return;
			newpos = [ (fingers[0].pos[0]+fingers[1].pos[0])/2
			         , (fingers[0].pos[1]+fingers[1].pos[1])/2];
			dist = get_distance(fingers[0].pos, fingers[1].pos);
			if (!active && get_distance(pos0, pos) >= min_2f_dist) {
				active = true;
			  evt({ type: 'drag-start', fingers: fingers, pos0: pos0, pos: pos
			  	  , dist0: dist0, dist: dist})
			}
		}
		// trigger drag event
		if (active) evt({ type: 'drag', fingers: fingers, pos0: pos0, pos: newpos
			              , dist0: dist0, dist: dist, dx: newpos[0]-pos[0], dy: newpos[1]-pos[1]});
		pos = newpos;
	}

	var released = function() {
		if (fingers.length === 0) return;
		var f = d3.event.finger;
		var idx = fingers.indexOf(f);
    if (idx === -1) return;
    fingers.splice(idx,1);
    if (!active) return;
    if (fingers.length === 1) { // update center position but keep distance
    	pos0 = [fingers[0].pos[0], fingers[0].pos[1]];
			pos = [pos0[0], pos0[1]];
    }
    if (fingers.length === 0) {
    	active = false;
    	event.of(this, arguments)({type: 'drag-end'});
    }
	}

	function get_distance(p1, p2) {
    return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0]) + (p1[1]-p2[1])*(p1[1]-p2[1]));
  }

	return d3.rebind(drag, event, "on");
}
/// Include a css file with @font-face definitions in the main index.html file to let the browser
/// load the fonts. This font loader will check for all the fonts whether they have been loaded or
/// not and call a callback after loading or an optional timeout.
/// The font loader can also gather information about the width and height of symbols and after that
/// will give an estimate of the dimensions of any string in any of the loaded fonts in any font
/// size.
/// Fonts is an array of {id, family, weight, style} objects. Family is the only
/// mandatory field.
var FontLoader = function(fonts, max_wait) {
  if (typeof(max_wait) === 'undefined') max_wait = 1000;
  var core = {}
    , callback_list = [];
  core.fonts = [];
  core.map = {};
  core.finished = false;
  core.success = false;
  core.svg = d3.select('body').append('svg')
    .style({ position: 'absolute'
           , visibility: 'hidden'
           , width: '1px'
           , height: '1px' });

  core.on_fonts_loaded = function(callback) {
    if (this.finished) callback(this.success);
    else {
      callback_list.push(callback);
    }
  }

  var dispatch_fonts_loaded = function() {
    core.loadSizes();
    for (var i=0; i<callback_list.length; i++) {
      callback_list[i](this.success);
    }
    callback_list = [];
  }

  core.add_fonts = function(fonts) {
    var added = false;
    fonts.forEach(function(font) {
      var f = findFont(font);
      if (f) font.id = f.id;
      else {
        font.id = gmath.uid();
        core.fonts.push(font);
        added = true;
      }
    });
    if (!added) return;
    core.wait_for_fonts();
  }

  var findFont = function(font) {
    for (var i=0; i<core.fonts.length; i++) {
      var f = core.fonts[i];
      if ( f.style === font.style
        && f.family === font.family
        && f.weight === font.weight) return f;
    }
    return null;
  }

  core.wait_for_fonts = function() {
    this.finished = false;
    this.success = false;
    // add one serif text field and one for each loading font
    this.fonts.unshift({ family: 'serif' });
    var txt = this.svg.selectAll('text.temp').data(this.fonts).enter()
      .append('text').classed('temp', true)
      .attr('font-size', '100px')
      .attr('font-family', function(font) { return "'"+font.family + "', serif" })
      .attr('font-style', function(font) { return font.style })
      .attr('font-weight', function(font) { return font.weight })
      .text('012abc');
    this.fonts.shift();

    var t0 = Date.now();
    // compare lengths until they all differ (-> loaded)
    var self = this;
    var timer = setInterval(function() {
      var w = [], all_loaded = true;
      txt.each(function(d,i) { w[i] = this.getBBox().width });
      for (var i=1; i<w.length; i++) {
        if (w[i] === w[0]) all_loaded = false;
      }
      var loading_time = Date.now()-t0;
      if (!all_loaded && loading_time <= max_wait) return;
      // all fonts loaded or time is up
      self.success = all_loaded;
      self.finished = true;
      txt.remove();
      clearInterval(timer);
      dispatch_fonts_loaded();
    }, 20);
  }

  core.loadSizes = function(chars, fonts) {
    chars = chars || "xyz0123456789()=+-*^∗·•−,.";
    fonts = fonts || this.fonts;
    var c_arr = [];
    for (var i=0; i<fonts.length; i++) {
      if (!this.map[fonts[i].id]) {
        this.map[fonts[i].id] = {};
      }
      for (var j=0; j<chars.length; j++) {
        var char = {font: fonts[i], char: chars[j], width: 0, height: 0};
        this.map[fonts[i].id][chars[j]] = char;
        c_arr.push(char);
      }
    }

    this.svg.selectAll('.hiddenChars')
      .data(c_arr)
      .enter().append('text')
      .attr('font-size', '100px')
      .attr('font-family', function(d) { return d.font.family })
      .attr('font-style', function(d) { return d.font.style })
      .attr('font-weight', function(d) { return d.font.weight })
      .text(function(d) { return d.char })
      .each(function(d) {
        var bb = this.getBBox();
        d.width = bb.width;
        d.height = bb.height;
      }).remove();
  }

  core.width = function(val, size, font) {
    var w = 0, str = val.toString();
    for (var i=0; i<str.length; i++) {
      if (!this.map[font.id] || !this.map[font.id][str[i]]) this.loadSizes(str[i], [font]);
      w += this.map[font.id][str[i]].width;
    }
    return w*size/100;
  }

  core.height = function(val, size, font) {
    var h = 0, str = val.toString();
    for (var i=0; i<str.length; i++) {
      if (!this.map[font.id] || !this.map[font.id][str[i]]) this.loadSizes(str[i], [font]);
      h = Math.max(this.map[font.id][str[i]].height, h);
    }
    return h*size/100;
  }

  core.add_fonts(fonts);
  return core;
}
/// Will automatically listen to the first two fingers on the screen.
/// Emits 'transformstart', 'transformend' and 'transform' events,
/// passing the current transform in the event as {translate: [0,0],
/// rotate: 0, zoom: 1}. The transformation steps are applied in this order:
/// rotate around (0,0), zoom around (0,0), then translate.
/// In order to use it in svg, you need to pass the steps in the opposite
/// order. The behavior has the following getters & setters:
/// transform, allow_translate, allow_scale, allow_rotate, one_finger_drag.
/// Use one_finger_drag to allow or disallow dragging with one finger. If
/// disallowed, the user needs to use two fingers for dragging.
transform_behavior = function() {
  var event = d3_eventDispatch(tg, 'transform', 'transformend', 'transformstart')
     ,fingers = []
     ,x = 0, y = 0, rotate = 0, scale = 1 // current transform
     ,allow = {scale: true, translate: true, rotate: true}
     ,one_finger_drag = true // allow dragging with one finger
     ,pos, pos0   // current and initial mid-point b/w touches
     ,loc0        // image location of initial mid-point b/w touches
     ,dist, dist0 // current and initial distance b/w touches
     ,angle, angle0 // current and initial angle of line through touches
     ,scale0      // initial scale in transform
     ,rot0;       // initial rotation in transform

  var tg = function() {
    this.on('touch.transform', touched)
        .on('mdrag.transform', dragged)
        .on('release.transform', released);
  }

  tg.transform = function(val) {
    if (!arguments.length) return {scale: scale, rotate: rotate, translate: [x, y]};
    if ('scale' in val) scale = val.scale;
    if ('rotate' in val) rotate = val.rotate;
    if ('translate' in val) { x = val.translate[0]; y = val.translate[1] }
    return tg;
  }

  tg.one_finger_drag = function(val) {
    if (!arguments.length) return one_finger_drag;
    one_finger_drag = val;
    return tg;
  }

  tg.allow_translate = function(val) {
    if (!arguments.length) return allow.translate;
    allow.translate = val;
    return tg;
  }

  tg.allow_scale = function(val) {
    if (!arguments.length) return allow.scale;
    allow.scale = val;
    return tg;
  }

  tg.allow_rotate = function(val) {
    if (!arguments.length) return allow.rotate;
    allow.rotate = val;
    return tg;
  }

  var touched = function() {
    if (fingers.length === 2) return;
    fingers.push(d3.event.finger);
    if (fingers.length === 1 && one_finger_drag) {
      pos = pos0 = [fingers[0].pos[0], fingers[0].pos[1]];
      loc0 = to_location(pos0);
      event.of(this, arguments)({type: 'transformstart'});
    }
    if (fingers.length === 2) {
      pos = pos0 = get_mean(fingers[0].pos, fingers[1].pos);
      dist = dist0 = get_distance(fingers[0].pos, fingers[1].pos);
      angle = angle0 = get_angle(fingers[0].pos, fingers[1].pos);
      loc0 = to_location(pos0);
      scale0 = scale;
      rot0 = rotate;
    }
  }

  var dragged = function() {
    if (fingers.length === 0) return;
    if (!d3.event.dragged_fingers.some(function (f) { return f.changed })) return;

    if (fingers.length === 1) {
      if (!one_finger_drag) return;
      if (allow.translate) pos = [fingers[0].pos[0], fingers[0].pos[1]];
      translateTo(pos, loc0);
    }
    if (fingers.length === 2) {
      if (allow.scale) dist = get_distance(fingers[0].pos, fingers[1].pos);
      if (allow.translate) pos = get_mean(fingers[0].pos, fingers[1].pos);
      if (allow.rotate) angle = get_angle(fingers[0].pos, fingers[1].pos);
      update_transform();
    }
    event.of(this, arguments)({type: 'transform', fingers: fingers, transform:
                               {scale: scale, rotate: rotate, translate: [x, y]}});
  }

  var released = function() {
    if (fingers.length === 0) return;
    var f = d3.event.finger;
    var idx = fingers.indexOf(f);
    if (idx === -1) return;
    fingers.splice(idx,1);
    if (fingers.length === 0) {
      event.of(this, arguments)({type: 'transformend'});
    }
    if (fingers.length === 1) {
      pos = pos0 = [fingers[0].pos[0], fingers[0].pos[1]];
      loc0 = to_location(pos0);
    }
  }

  var update_transform = function() {
     if (allow.rotate) rotate = rot0+(angle-angle0);
     if (allow.scale) scale = scale0*dist/dist0;
     if (allow.translate || allow.rotate || allow.scale) translateTo(pos, loc0);
  }

  /// turn an image position into a screen position
  var to_screen = function(l) {
    // rotate then zoom then translate
    var cos = Math.cos(rotate), sin = Math.sin(rotate);
    var rx = l[0]*cos - l[1]*sin
       ,ry = l[1]*cos + l[0]*sin;
    return [rx * scale + x
           ,ry * scale + y];
  }

  /// turn a screen position into an image position
  var to_location = function(p) {
    // untranslate, then unzoom, then unrotate
    var sx = (p[0] - x) / scale
       ,sy = (p[1] - y) / scale
    var cos = Math.cos(-rotate), sin = Math.sin(-rotate);
    return [sx*cos-sy*sin, sy*cos+sx*sin];
  }

  var translateTo = function(p, l) {
    l = to_screen(l);
    x += p[0] - l[0];
    y += p[1] - l[1];
  }

  function get_distance(p1, p2) {
    return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0]) + (p1[1]-p2[1])*(p1[1]-p2[1]));
  }

  function get_mean(p1, p2) {
    return [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
  }

  function get_angle(p1, p2) {
    return Math.atan2(p1[1]-p2[1], p1[0]-p2[0]);
  }

  return d3.rebind(tg, event, "on");
}

gmath.transform_behavior = transform_behavior;// bbox is the bbox of the node(s) being dragged (or endpoint box of the substitution line)
// environment is the alm from which to bind actions and draw target boxes
var HitTester = {}

HitTester.draw = function(svg, targets, source) {
  var target_areas = svg
    .selectAll('.target_area')
    .data(targets ? targets : []);
  target_areas
    .enter()
    .append('rect')
    .classed('target_area', true)
    .style({fill: 'none', stroke: 'lightpink', 'stroke-width': 2, 'stroke-style': 'dashed'});
  target_areas
    .attr('x', function (d) { return d.x })
    .attr('y', function (d) { return d.y })
    .attr('width', function (d) { return d.width })
    .attr('height', function (d) { return d.height });
  target_areas
    .exit()
    .remove();

  var source_area = svg
    .selectAll('.source_area')
    .data(source ? [source] : []);
  source_area
    .enter()
    .append('rect')
    .classed('source_area', true)
    .style({fill: 'none', stroke: 'steelblue', 'stroke-width': 2});
  source_area
    .attr('x', function (d) { return d.x })
    .attr('y', function (d) { return d.y })
    .attr('width', function (d) { return d.width })
    .attr('height', function (d) { return d.height });
  source_area
    .exit()
    .remove();
}

/* Shrink factor is optional. */
HitTester.getBoundingBox = function(nodes, shrink_factor) {
  if (arguments.length < 2) shrink_factor = 1;
  var x0=Infinity, x1=-Infinity, y0=Infinity, y1=-Infinity;
  for (var i=0; i<nodes.length; i++) {
    var n = nodes[i];
    if (n.hidden) continue;
    x0 = Math.min(x0, n.sel_box.x+n.x);
    x1 = Math.max(x1, n.sel_box.x+n.x+n.sel_box.width);
    y0 = Math.min(y0, n.sel_box.y+n.y);
    y1 = Math.max(y1, n.sel_box.y+n.y+n.sel_box.height);
  }
  var w = x1-x0, h = y1-y0;
  return { x: x0+w*(1-shrink_factor)/2, y: y0+h*(1-shrink_factor)/2
         , width: w*shrink_factor, height: h*shrink_factor };
}

/** Sets the bbox for each action's targets according to the action's side. */
HitTester.setTargetRegions = function(move_actions) {
	move_actions.forEach(function (action) {
    var n = action.target;
    switch (action.side) {
      case 'left-of':
        action.x = n.sel_box.x+n.x-0.5;
        action.width = 1;
        action.y = n.sel_box.y+n.y;
        action.height = n.sel_box.height;
        break;
      case 'right-of':
        action.x = n.sel_box.x+n.x+n.sel_box.width-0.5;
        action.width = 1
        action.y = n.sel_box.y+n.y;
        action.height = n.sel_box.height;
        break;
      case 'below':
        action.x = n.sel_box.x+n.x;
        action.width = n.sel_box.width;
        action.y = n.sel_box.y+n.y+n.sel_box.height-0.5;
        action.height = 1;
        break;
      case 'above':
        action.x = n.sel_box.x+n.x;
        action.width = n.sel_box.width;
        action.y = n.sel_box.y+n.y-0.5;
        action.height = 1;
        break;
      default: // includes 'around', 'inside', 'outside'
        // if (Array.isArray(n)) {
        //   var rangeBox = HitTester.getBoundingBox(action.target);
        //   action.x = rangeBox.x - (action.margin ? action.margin : 0);
        //   action.width = rangeBox.width + (action.margin ? action.margin*2 : 0);
        //   action.y = rangeBox.y - (action.margin ? action.margin : 0);
        //   action.height = rangeBox.height + (action.margin ? action.margin*2 : 0);
        // } else {
        //   action.x = n.sel_box.x+n.x - (action.margin ? action.margin : 0);
        //   action.width = n.sel_box.width + (action.margin ? action.margin*2 : 0);
        //   action.y = n.sel_box.y+n.y - (action.margin ? action.margin : 0);
        //   action.height = n.sel_box.height + (action.margin ? action.margin*2 : 0);
        // }
        if (Array.isArray(n)) {
          var rangeBox = HitTester.getBoundingBox(action.target);
          action.x = rangeBox.x;
          action.width = rangeBox.width;
          action.y = rangeBox.y;
          action.height = rangeBox.height;
        } else {
          action.x = n.sel_box.x+n.x;
          action.width = n.sel_box.width;
          action.y = n.sel_box.y+n.y;
          action.height = n.sel_box.height;
        }
        HitTester.scaleTargetBox(action);
        break;
    }
    if (action.offset) {
      action.x += action.offset.x;
      action.y += action.offset.y;
    }
  });

  HitTester.extendExtremeTargetBoxes(move_actions);
}

HitTester.scaleTargetBox = function(action) {
  if (!action.scaleTargetBox && !action.scaleTargetBoxX && !action.scaleTargetBoxY) return;

  // If we want to use the same scaling factor for both width and height
  if (!action.scaleTargetBoxX && !action.scaleTargetBoxY) {
    action.scaleTargetBoxX = action.scaleTargetBox;
    action.scaleTargetBoxY = action.scaleTargetBox;
  }

  // If we have only specified scaling in one direction, set the other to identity
  if (!action.scaleTargetBoxX) action.scaleTargetBoxX = 1;
  if (!action.scaleTargetBoxY) action.scaleTargetBoxY = 1;

  var oldWidth = action.width
     ,oldHeight = action.height;

  action.width = action.width * action.scaleTargetBoxX;
  var widthDiff = action.width - oldWidth;
  action.x = action.x - widthDiff/2;

  action.height = action.height * action.scaleTargetBoxY;
  var heightDiff = action.height - oldHeight;
  action.y = action.y - heightDiff/2;
}

HitTester.extendExtremeTargetBoxes = function(move_actions) {
  var left_extension
     ,right_extension;
  var dragged_nodes_bounds;
  for (var i=0; i<move_actions.length; i++) {
    var action = move_actions[i];
    if (!action.nodes) continue;
    if (!dragged_nodes_bounds) dragged_nodes_bounds = HitTester.getBoundingBox(action.nodes);
    if ((!left_extension && action.x+action.width<dragged_nodes_bounds.x) || (left_extension && action.x < left_extension.x && action.x+action.width<dragged_nodes_bounds.x))
      left_extension = action;
    if ((!right_extension && dragged_nodes_bounds.x+dragged_nodes_bounds.width<action.x) || (right_extension && right_extension.x < action.x && dragged_nodes_bounds.x+dragged_nodes_bounds.width<action.x))
      right_extension = action;
  }
  if (left_extension && left_extension.side!=='inside') {
    left_extension.x -= 1000;
    left_extension.width += 1000;
    left_extension.y -= 500;
    left_extension.height += 1000;
  }
  if (right_extension && right_extension.side!=='inside') {
    right_extension.width += 1000;
    right_extension.y -= 500;
    right_extension.height += 1000;
  }
}

HitTester.getHits = function(targets, source) {
  return targets.filter(function(target) { return target.side!=='outside' && HitTester.overlaps(target, source) })
    .concat(targets.filter(function(target) { return target.side==='outside' && !HitTester.overlaps(target, source) }));
}

HitTester.getBestHit = function(targets, source) {
  var hits = HitTester.getHits(targets, source);
  return HitTester.getHighestPriorityHit(hits, source);
}

HitTester.getEnclosingRectForSourceLineEndpoint = function(line) {
	return {xmin: line.B.x-2, ymin:line.B.y-2, xmax:line.B.x+2, ymax:line.B.y+2};
}

HitTester.overlaps = function(a, b) {
  return (
           ((a.x >= b.x && a.x <= b.x+b.width)
          ||(a.x+a.width >= b.x && a.x+a.width <= b.x+b.width)
          ||(a.x <= b.x && a.x+a.width >= b.x+b.width))
        &&
           ((a.y >= b.y && a.y <= b.y+b.height)
          ||(a.y+a.height >= b.y && a.y+a.height <= b.y+b.height)
          ||(a.y <= b.y && a.y+a.height >= b.y+b.height))
        );
}

HitTester.getHighestPriorityHit = function(hits, source) {
  var best = null;
  for (var i=0; i<hits.length; i++) {
    var hit = hits[i];
    // if (hit.side==='outside') {
    //   console.log('detected inverse target box');
    //   continue;
    // }
    if (!best) best = hit;
    else if (best.side==='outside') best = hit;
    else if (hit.priority > best.priority) best = hit;
    else if (hit.priority === best.priority) {
      if (HitTester.getCenterDist(hit, source)
         <HitTester.getCenterDist(best, source)) best = hit;
    }
  }
  return best;
}

HitTester.getCenterDist = function(a, b) {
  var dx = a.x+a.width/2-b.x-b.width/2
    , dy = a.y+a.height/2-b.y-b.height/2;
  return Math.sqrt(dx*dx+dy*dy);
}

HitTester.getOverlapArea = function(a, b) {
  var w = Math.max(a.x, b.x) - Math.min(a.x+a.width, b.x+b.width)
    , h = Math.max(a.y, b.y) - Math.min(a.y+a.height, b.y+b.height);
  return Math.max(0, w) * Math.max(0, h);
}

var CancelFractionHandler = function(view, interaction_handler) {
  this.view = view;
  this.alm = view.model;
  this.nodes = [];            // array of nodes the current line crosses
  this.line = {A: {}, B: {}}; // line from initial to current position
  this.line_el = null;        // d3 selection of svg line element
  this.interaction_handler = interaction_handler;
  this.action = gmath.actions.FractionCancelAction;
}

/// Returns true, if the gesture wants to grab the current.
/// This is the case if its one finger and the finger is not on top of any node
/// and there is a fraction in the expression.
CancelFractionHandler.prototype.check = function(evt, nodes) {
  return evt.fingers.length == 1 && nodes.length == 0 //&&
         //Tree.select_first(function (n) { return n.is_group('fraction') }, this.alm);
}

/// Returns the new selection of nodes based on the one passed.
CancelFractionHandler.prototype.start = function(center, nodes) {
  // add line to svg
  this.line_el = this.view.main
    .append('line')
    .classed('cancel-fraction', true)
    .style('stroke', this.view.options.selection_color)
    .style('stroke-width', 6)
    .style('stroke-linecap', 'round');

  this.nodes = [];
  this.line.A.x = this.line.B.x = center[0];
  this.line.A.y = this.line.B.y = center[1];

  return [];
}

/// `evt` must have a `dx` and a `dy` field.
CancelFractionHandler.prototype.update = function(evt) {
  this.line.B.x += evt.dx; this.line.B.y += evt.dy;

  // get nodes based on what was crossed by the line
  var nnodes = this.process_selection(this.get_crossed_nodes());

  // update the seleced attribute if selected nodes changed
  var same = true;
  if (this.nodes.length != nnodes.length) same = false
  else for (var i=0; i<this.nodes.length; i++) same = same && (this.nodes[i] == nnodes[i]);
  if (!same) this.interaction_handler.highlight_nodes(nnodes);
  this.nodes = nnodes;

  // update line
  this.line_el
    .attr('x1', this.line.A.x)
    .attr('y1', this.line.A.y)
    .attr('x2', this.line.B.x)
    .attr('y2', this.line.B.y);
}

CancelFractionHandler.prototype.end = function() {
  this.line_el.remove();
  var n1 = this.nodes[0], n2;
  if (this.nodes.length === 3 && this.nodes[1].value === '//') n2 = this.nodes[2];
  else if (this.nodes.length === 2) n2 = this.nodes[1];

  if (n2 && this.action.match(n1, n2)) {
    var action = this.actions.createBoundAction(this.alm, {nodes: [n2], target: n1});
    this.alm.performAction(action, null, "cancel fraction");
  }

  this.nodes = [];
}

/// Select the nodes that are direct children or grandchilden of the fraction,
/// but no more than one in the numerator and one in the denominator.
CancelFractionHandler.prototype.process_selection = function(nodes) {
  var N = nodes.length;
  if (N === 0) return [];
  if (N === 1) return [nodes[0].parent];

  // get the closest common anchestor of the nodes
  var cca = Tree.get_cca(nodes);
  if (cca.is_group('fraction')) {
    // collect all elements that are direct children of the cca
    var res = [];
    for (var i=0; i<nodes.length; i++) {
      var n = nodes[i];
      while (n.parent != cca) n = n.parent;
      // add the fraction bar to the selection if we cancel the whole denominator
      if (n.value == '//' && cca.get_bottom().length != 1) continue;
      if (res.indexOf(n) == -1) res.push(n);
    }
    return res;
  } else return [cca];
}

/// Returns an array of all 'literal' and 'name' nodes that are crossed by the line.
CancelFractionHandler.prototype.get_crossed_nodes = function() {
  var res = [];
  var nodes = Tree.get_leaf_nodes(this.alm);
  for (var i=0; i<nodes.length; i++) {
    var n = nodes[i];
    if (!n.hidden && this.intersects(n)) res.push(n);
  }
  return res;
}

/// Returns true if this line intersects with the selection rectangle of the passed node.
CancelFractionHandler.prototype.intersects = function(node) {
  var A = this.line.A, B = this.line.B;
  var rx1 = node.sel_box.x+node.x, rx2 = node.sel_box.x+node.sel_box.width+node.x;
  var ry1 = node.sel_box.y+node.y, ry2 = node.sel_box.y+node.sel_box.height+node.y;

  // check if the line is left, right, above or below the rect
  if (A.x < rx1 && B.x < rx1) return false;
  if (A.x > rx2 && B.x > rx2) return false;
  if (A.y < ry1 && B.y < ry1) return false;
  if (A.y > ry2 && B.y > ry2) return false;

  // no, so check whether all points are on the same side of the line
  var left_of = function(x,y) { return ((A.x-B.x)*(A.y-y) - (A.y-B.y)*(A.x-x)) < 0 }
  if (left_of(rx1, ry1) != left_of(rx2, ry1)) return true;
  if (left_of(rx2, ry1) != left_of(rx1, ry2)) return true;
  if (left_of(rx1, ry2) != left_of(rx2, ry2)) return true;

  return false;
}
var ChangeNumberHandler = function(view, interaction_handler) {
	this.default_precision = 1; // default precision, if not set per number
	this.interaction_handler = interaction_handler;
	this.precision = null;
	this.view = view;
	this.model = view.model;
	this.dy = 0;                // vertical drag distance
	this.pixels_per_unit = 50;  // sensitivity
	this.node = null;						// number node to act on, may change (e.g. num->sign)
	this.value = null;					// current value or target node
	this.value0 = null;         // initial value of target node
}

/// Returns true, if the gesture wants to grab the current.
/// `evt` must have a `pos` and a `pos0` field.
ChangeNumberHandler.prototype.check = function(evt) {
  var dy = evt.pos0[1]-evt.pos[1];
  return Math.abs(dy) >= 10;
}

/// Returns the new selection of nodes based on the one passed.
ChangeNumberHandler.prototype.start = function(center, nodes) {
	this.node = this.process_selection(nodes);
	if (!this.node) return [];
	if (this.node && this.node.precision) this.precision = this.node.precision;
	else this.precision = this.default_precision;
	this.dy = 0;
	this.value = this.value0 = this.view.model.numeric_value(this.node);
	return [this.node];
}

/// `evt` must have a `dy` field.
ChangeNumberHandler.prototype.update = function(evt) {
	if (!this.node || !evt.dy) return;
	this.dy += evt.dy;
	var dval = -this.dy / this.pixels_per_unit;
	this.set_value(this.value0 + dval);
}

ChangeNumberHandler.prototype.set_value = function(val) {
	val = +(val.toFixed(this.precision));
	if (val === this.value) return;
	this.value = val;
	var n = this.view.model.numeric_value(this.node, val);

	if (n !== this.node) {
		// need to reset, since a 1--0 could have changed into a 1-1, so we would get an actual
		// value of -1 instead of the expected value of 1 and would have to highlight the first -.
		this.interaction_handler.highlight_nodes(this.start(null, [n]));
	}
}

ChangeNumberHandler.prototype.end = function() {
	this.node = null;
}

/// Checks whether only a number or a sign, add or sub group around a number
/// was selected (or the operator and the number). If yes, it is returned,
/// else null is returned.
ChangeNumberHandler.prototype.process_selection = function(nodes) {
	var is_g = function(node) {
		return node.is_group('sign') || node.is_group('add') || node.is_group('sub');
	}
	if (nodes.length === 0 || nodes.length > 2) return null;
	if (nodes.length === 2) {
		var num=nodes[1];
		if ((num instanceof Num) && is_g(num)) return num.parent;
		return null;
	}
	var n = nodes[0];
	if (n instanceof Num) {
		if (is_g(n.parent)) return n.parent;
		else return n;
	} else if (is_g(n)) return n;
	return null;
}
/// Copyright by Erik Weitnauer, 2013.

/// Handles tapping, dragging, joining and splitting of terms with 1 or 2 fingers.
/// All on_* event handling methods can either be called by d3 and use d3.event in
/// this case, or they can be called manually (e.g. for replaying) and expect the
/// event as a parameter in this case.
/// All event handlers are added to `view.event_receiver`.
/// Pass interactive as true to enable user interaction.
/// The interaction handler will delegate the work to one of a set of specialized
/// Handlers (e.g. the split handler).
var InteractionHandler = function(view, interactive, recorder) {
  this.send_events = true; // switch event sending on or off
  this.events = d3.dispatch( 'tap', 'drag_start', 'drag', 'drag_end'
                           , 'touch', 'release', 'inspect_node');
  this.view = view;
  this.recorder = recorder;
  this.mode = 'transform';   // can be 'transform' or 'change' or 'inspect'
  this.interactive = interactive;
  this.init();
  if (!interactive) this.set_interactive(false);
  this.selected_nodes = [];
  this.handlers = {
    transform: [new SelectionHandler(this.view, this)
               ,new SubstitutionHandler(this.view, this)
               ,new DragHandler(this.view, this)
               ,new JoinHandler(this.view, this)
               ,new SplitHandler(this.view, this)]
               //,new CancelFractionHandler(this.view, this)] // this is the old style,
                                                   // we now use the DragHandler for it
   ,change: [new ChangeNumberHandler(this.view, this)]
  };
  this.active_handler = null;

  this.finger_vis = null;
}

InteractionHandler.prototype.getHandlerByClass = function(klass) {
  var class_filter = function(obj) { return obj instanceof klass };
  for (var type in this.handlers) {
    var matches = this.handlers[type].filter(class_filter);
    if (matches.length > 0) return matches[0];
  }
}

InteractionHandler.prototype.end_of_interaction = function() {
  this.view.model.finishInteraction();
}

InteractionHandler.prototype.init = function () {
  var frame = this.view.main.node();
  this.mtouch = mtouch_events().frame(frame);

  this.view.event_receiver
    .call(this.mtouch);

  this.mtouch.on('touch', this.on_touch.bind(this,null))
             .on('release', this.on_release.bind(this,null))
             .on('tap', this.on_tap.bind(this,null));

  var dragb = drag_behavior()
       .on('drag-start', this.on_drag_start.bind(this,null))
       .on('drag', this.on_drag.bind(this,null))
       .on('drag-end', this.on_drag_end.bind(this,null));
  this.mtouch.call(dragb);
}

InteractionHandler.prototype.set_mode = function(mode) {
  if (mode !== 'transform' && mode !== 'change' && mode !== 'inspect')
    throw "unknown interaction mode!";
  this.mode = mode;
  if (!this.interactive) this.mtouch.connected(this.mode === 'inspect');
}

InteractionHandler.prototype.set_interactive = function(arg) {
  this.interactive = !!arg;
  if (this.mode === 'inspect') this.mtouch.connected(true);
  else this.mtouch.connected(this.interactive);
}

/// Iterates through all handlers in `this.handlers` and chooses the first one
/// that returns true when called .check(). It then sets the this.active_handler
/// field, calls the handler.start() method, saves its return value in
/// this.selected_nodes and highlights the nodes.
/// The `evt` object should contain a `pos` field and all fields needed by any of
/// the handlers `check()` methods (like pos, pos0, dist0, dist).
InteractionHandler.prototype.select_new_handler = function(evt) {
  var handlers = this.handlers[this.mode] || [];
  for (var i=0; i<handlers.length; i++) {
    var h = handlers[i];
    if (h.check(evt, this.selected_nodes)) {
      this.active_handler = h;
      this.selected_nodes = h.start(evt.pos, this.selected_nodes);
      this.highlight_nodes();
      return;
    }
  }
}

InteractionHandler.prototype.on_tap = function(event) {
  var evt = this.selectInputEvent(event, d3.event);
  if (this.send_events) this.events.tap(new TapEvent(evt));
  if (this.active_handler) { // this should never happen...
    console.error("should not happen");
    this.selected_nodes = this.active_handler.end() || [];
    this.highlight_nodes();
    this.active_handler = null;
  }
  if (evt.shiftKey) return;
  var n = this.get_closest_node_at(evt.finger.pos);
  if (n) n = this.getFirstUnfixedParent(n);
  if (!n) return;
  var self = this;
  if (this.mode === 'inspect') this.events.inspect_node({ node: n });
  if (this.mode === 'transform') {
    this.view.model.process_operator(n, function() {
      self.selected_nodes = [];
      self.highlight_nodes();
      self.end_of_interaction();
    });
  }
}

InteractionHandler.prototype.getFirstUnfixedParent = function(n) {
  while (n.fixed && n.parent && !AlgebraModel.is_top_most(n.parent)) n = n.parent;
  return n;
}

/// Returns the arg_evt if passed, else augments the d3_evt and returns it.
InteractionHandler.prototype.selectInputEvent = function(arg_evt, d3_evt) {
  if (arg_evt) return arg_evt;
  var src_evt = d3_evt;
  while (src_evt.sourceEvent) src_evt = src_evt.sourceEvent;
  d3_evt.shiftKey = src_evt.shiftKey;
  d3_evt.altKey = src_evt.altKey;
  return d3_evt;
}

InteractionHandler.prototype.on_drag_start = function(event) {
  if (!this.interactive) return;
  var evt = this.selectInputEvent(event, d3.event);
  if (this.send_events) this.events.drag_start(new DragStartEvent(evt));
  if (this.active_handler) return;
  if (this.selected_nodes.length > 1) {
    this.selected_nodes = Tree.nodes_to_range(this.selected_nodes);
  }
  this.select_new_handler(evt);
}

InteractionHandler.prototype.update_fingers = function(fingers, update_only) {
  if (!this.finger_sel) {
    var n = this.view.svg.node();
    while (n.tagName.toLowerCase() !== 'svg') n = n.parentNode;
    this.finger_sel = d3.select(n).selectAll('.finger');
    var dpos_svg = d3.touches(n, [{pageX: 0, pageY:0, clientX: 0, clientY: 0}])[0];
    var dpos_view = d3.touches(this.view.svg.node(), [{pageX: 0, pageY:0, clientX: 0, clientY: 0}])[0];
    this.dpos_finger_vis = [dpos_view[0] - dpos_svg[0], dpos_view[1] - dpos_svg[1]];
    this.finger_vis_start = Date.now();
  }
  var f = this.finger_sel.data(fingers);
  if (!update_only) {
    f.enter().append('circle').classed('finger', true)
     .attr('r', 25)
     .style({stroke: '#4D4D4D', 'stroke-opacity': 0.5
            ,fill: '#B2CAED', 'fill-opacity': 0.5});
  }
  var dpos = this.dpos_finger_vis;
  f.attr('cx', function (d) { return d.pos[0]-dpos[0] })
   .attr('cy', function (d) { return d.pos[1]-dpos[1] });
  f.transition().ease('bounce').attr('r', 17);
  var t0 = this.finger_vis_start;
  f.exit().transition().delay(Math.max(0,250-(Date.now()-t0))).style('opacity', 0.0001).remove();
  this.finger_sel = (f.size() === 0) ? null : f;
}

InteractionHandler.prototype.on_drag = function(event) {
  if (!this.interactive) return;
  var evt = this.selectInputEvent(event, d3.event);
  if (this.send_events) this.events.drag(new DragEvent(evt));
  if (event) this.update_fingers(event.fingers, true);
  if (!this.active_handler) this.select_new_handler(evt);
  if (this.active_handler) this.active_handler.update(evt);
}

InteractionHandler.prototype.on_drag_end = function(/*event*/) {
  if (!this.interactive) return;
  if (this.send_events) this.events.drag_end(new DragEndEvent());
  if (!this.active_handler) return;
  this.selected_nodes = this.active_handler.end() || [];
  this.highlight_nodes();
  var was_sel_handler = this.active_handler instanceof SelectionHandler;
  this.active_handler = null;
  if (!was_sel_handler) this.end_of_interaction();
}

InteractionHandler.prototype.on_touch = function(event) {
  if (!this.interactive) return;
  var evt = this.selectInputEvent(event, d3.event);
  if (this.send_events) this.events.touch(new TouchEvent(evt));
  if (event) this.update_fingers(event.fingers);
  if (this.active_handler) return;
  if (evt.fingers.length === 1) {
    var new_sel = this.get_user_selection(evt.fingers[0], null, evt);
    if (evt.shiftKey) {
      this.selected_nodes = gmath.array.xor(this.selected_nodes, new_sel);
    } else {
      if (!gmath.array.containsAll(this.selected_nodes, new_sel)) {
        this.selected_nodes = new_sel;
      }
    }
  }
  else if (evt.fingers.length === 2) {
    this.selected_nodes = this.get_user_selection(evt.fingers[0], evt.fingers[1], evt);
  }
  this.highlight_nodes();
}

InteractionHandler.prototype.on_release = function(event) {
  if (!this.interactive) return;
  var evt = this.selectInputEvent(event, d3.event);
  if (this.send_events) this.events.release(new ReleaseEvent(evt));
  if (event) this.update_fingers(event.fingers);
  if (evt.fingers.length === 0 && !evt.shiftKey) {
    this.selected_nodes = [];
    // only deselect nodes if we are still in interactive mode
    // if not, e.g. the historyView might have set a selection that we
    // want to stay
    if (this.interactive) this.highlight_nodes();
  }
}

/// Keys is an {shiftKey, altKey} object.
InteractionHandler.prototype.get_user_selection = function(finger1, finger2, keys) {
  var nodes;
  // uncomment the following line to simulate 2-finger dragging with a mouse
  // finger2 = {pos: [finger1.pos[0]-40, finger1.pos[1]]};
  if (finger2) nodes = this.get_nodes_between(finger1.pos, finger2.pos);
  else {
    var n = this.get_closest_node_at(finger1.pos);
    if (!n) return [];
    n = this.getFirstUnfixedParent(n);
    if (keys.altKey) {
      while ( n.parent.parent && !n.parent.commutative) n = n.parent;
      var pp = n.parent.parent;
      if (pp && pp.is_group('fraction')) {
        nodes = n.parent.is_group('mul') ? pp.get_top() : pp.get_bottom();
      }
      else if (n.parent.commutative) nodes = [n.parent.parent];
      else nodes = AlgebraModel.is_top_most(n.parent) ? [n] : [n.parent];
    }
    else nodes = [n];
  }
  return Tree.nodes_to_range(nodes);
}

InteractionHandler.prototype.highlight_nodes = function(nodes) {
  if (!nodes) nodes = this.selected_nodes;
  var v = this.view;
  Tree.for_each(function (n) { n.selected = false }, v.model.children);
  for (var i=0; i<nodes.length; i++) nodes[i].selected = true;
  v.renderer.set_style(v.model.children, true);
  v.update_style();
}

InteractionHandler.prototype.get_hits = function(pos) {
  var x=pos[0], y=pos[1];
  return Tree.get_leaf_nodes(this.view.model).filter(function (n) {
    return (!n.hidden && n.sel_box &&
            x <= n.x+n.sel_box.x+n.sel_box.width && x >= n.x+n.sel_box.x &&
            y <= n.y+n.sel_box.y+n.sel_box.height && y >= n.y+n.sel_box.y);
  });
}

InteractionHandler.prototype.get_closest_node_at = function(pos) {
  var closest_node=null, closest=Infinity;
  var x = pos[0], y=pos[1];
  var nodes = this.get_hits(pos);
  for (var i=0; i<nodes.length; i++) {
    if (nodes[i].hidden) continue;
    var dx = nodes[i].x-x;
    var dy = nodes[i].y-nodes[i].baseline_shift-y;
    var dist = dx*dx+dy*dy;
    if (dist < closest) {
      closest = dist;
      closest_node = nodes[i];
    }
  }
  return closest_node;
}

InteractionHandler.prototype.get_nodes_between = function(a, b) {
  var margin = 0;
  return Tree.get_leaf_nodes(this.view.model).filter(function (n) {
    if (n.hidden || !n.sel_box || n.value == '//') return false;  //TODO: fix this hack
    var d = [n.x+n.sel_box.x+n.sel_box.width/2, n.y+n.sel_box.y+n.sel_box.height/2];
    var res = segment_to_point_dist(a,b,d);
    var radius = n.sel_box.width/4+n.sel_box.height/4;
    if (res.len == 0) return res.dist <= radius+margin;
    return res.k>=0 && res.k<=1 && res.dist <= (radius+margin);
  });
}

var segment_to_point_dist = function(A, B, P) {
  var dx, dy, k=0.5;
  var AB = [B[0]-A[0], B[1]-A[1]];
  var len = Math.sqrt(AB[0]*AB[0]+AB[1]*AB[1]);
  if (len < 1e-6) { dx = A[0]-P[0]; dy = A[1]-P[1]; len = 0 }
  else {
    var AP = [P[0]-A[0], P[1]-A[1]];
    var k = (AB[0]*AP[0] + AB[1]*AP[1]) / len;
    var dx, dy;
    if (k<0) { dx = A[0]-P[0]; dy = A[1]-P[1] }
    else if (k>len) { dx = B[0]-P[0]; dy = B[1]-P[1] }
    else { dx = A[0]+k*AB[0]/len-P[0]; dy = A[1]+k*AB[1]/len-P[1] }
  }
  return {dist: Math.sqrt(dx*dx+dy*dy), k: k/len, len: len};
}

var DragStartEvent = function(evt) {
  this.type = 'drag_start';
  this.time = Date.now();
  this.pos = [evt.pos[0], evt.pos[1]];
  this.pos0 = [evt.pos0[0], evt.pos0[1]];
  this.dist = evt.dist;
  this.dist0 = evt.dist0;
  this.altKey = evt.altKey;
  this.shiftKey = evt.shiftKey;
  this.fingers = { length: evt.fingers.length };
}

var TapEvent = function(evt) {
  this.type = 'tap';
  this.time = Date.now();
  this.altKey = evt.altKey;
  this.shiftKey = evt.shiftKey;
  this.finger = {pos: [evt.finger.pos[0], evt.finger.pos[1]] };
}

var DragEvent = function(evt) {
  this.type = 'drag';
  this.time = Date.now();
  this.dx = evt.dx;
  this.dy = evt.dy;
  this.dist = evt.dist;
  this.dist0 = evt.dist0;
  this.pos = [evt.pos[0], evt.pos[1]];
  this.pos0 = [evt.pos0[0], evt.pos0[1]];
  this.fingers = evt.fingers.map(function (f) { return {pos: [f.pos[0], f.pos[1]]} });
}

var DragEndEvent = function() {
  this.type = 'drag_end';
  this.time = Date.now();
}

var TouchEvent = function(evt) {
  this.type = 'touch';
  this.time = Date.now();
  this.altKey = evt.altKey;
  this.shiftKey = evt.shiftKey;
  this.fingers = evt.fingers.map(function (f) { return {pos: [f.pos[0], f.pos[1]] }});
}

var ReleaseEvent = function(evt) {
  this.type = 'release';
  this.time = Date.now();
  this.altKey = evt.altKey;
  this.shiftKey = evt.shiftKey;
  this.fingers = evt.fingers.map(function (f) { return {pos: [f.pos[0], f.pos[1]] }});
}
// Copyright Erik Weitnauer 2014.

var JoinHandler = function(view) {
	this.view = view;
	this.alm = this.view.model;
  this.nodes = [];     // array of nodes to act on
  this.node_ids = [];  // used to recover selection after unjoin
	this.joined = false; // did we perform a join?
	this.unjoined_state = null; // keep track of original state for unjoining
}

/// Returns true, if the gesture wants to grab the current.
/// `evt` must have a `dist0` and a `dist` field.
JoinHandler.prototype.check = function(evt) {
	return evt.dist-evt.dist0 < -15;
}

/// Returns the new selection of nodes based on the one passed.
JoinHandler.prototype.start = function(center, nodes) {
	this.nodes = this.proccess_selection(nodes);
	this.node_ids = this.nodes.map(function (node) { return node.id });
	return this.nodes;
}

/// `evt` must have a `dist0` and a `dist` field.
JoinHandler.prototype.update = function(evt) {
	if (this.joined) {
		if (evt.dist > 3*evt.dist0/4+10) this.unjoin();
		return;
	}
	if (this.nodes.length < 1 || evt.dist > 3*evt.dist0/4) return;
	// perform all operators
	var start_idx = this.nodes[0].commutative ? 1 : 0;
	// ^-- this is very ugly, but needed at the moment, since if we join the nodes
	// `+2+3` in `1+2+3`, the first operator should not be processed (otherwise it will
  // add `2` to `1`). However, when having, e.g., an fraction, we will only get the
	// first node in there (for `1/2`, we'll get `1` and need to process it).
	this.unjoined_state = Tree.clone(this.alm.children[0], true);
	this.unjoined_state.parent = this.alm;
	this.joined = true;
	var self = this;
	var process_node = function(idx) {
		self.alm.process_operator(self.nodes[idx], function() {
			if (idx+1<self.nodes.length) process_node(idx+1);
			else self.nodes = [];
		});
	}
	process_node(start_idx);
}

JoinHandler.prototype.unjoin = function() {
	var eq = this.alm;
	this.joined = false;
	eq.children[0] = this.unjoined_state;
	eq.changed();
	this.nodes = this.node_ids.map(function (id) { return Tree.get_by_id(id, eq.children) });
}

JoinHandler.prototype.end = function() {
	this.nodes = [];
	this.node_ids = [];
	this.unjoined_state = null;
	this.joined = false;
}

/// In case we accidentally selected an operator too much in the front of the
/// expression, drop it (e.g. +2*3 instead of 2*3 in 1+2*3).
/// nodes must be a range of nodes (same parent, direct siblings).
JoinHandler.prototype.proccess_selection = function(nodes) {
	if (nodes.length !== 2) return nodes;
	if (!nodes[0].parent.commutative || !nodes[1].is_group()) return nodes;
	// we got and ['operator', 'group'] array
	return nodes[1].children.slice();
}
var SelectionHandler = function(view, interaction_handler) {
	this.view = view;
	this.alm = this.view.model;
  this.interaction_handler = interaction_handler;
  this.initial_nodes = [];
  this.nodes = [];
  this.pos0 = null;
  this.pos = null;
  this.box_el = null;
}

/// Returns true, if the gesture wants to grab the current.
/// `evt` must have a `shiftKey` field.
SelectionHandler.prototype.check = function(evt) {
  return evt.shiftKey;
}

/// Returns the new selection of nodes based on the one passed.
SelectionHandler.prototype.start = function(center, nodes) {
  this.pos0 = center.slice();
  this.pos = center.slice();
  this.initBox();
  this.initial_nodes = nodes;
  return nodes;
}

/// `evt` must have a `dx` and a `dy` field.
SelectionHandler.prototype.update = function(evt) {
  this.pos[0] += evt.dx; this.pos[1] += evt.dy;
  this.updateBox();
  var nnodes = this.getNodesInRect(this.pos0[0], this.pos0[1], this.pos[0], this.pos[1]);
  if (gmath.array.isPermutation(nnodes, this.nodes)) return;
  this.nodes = nnodes;
  this.highlight();
}

SelectionHandler.prototype.initBox = function() {
  this.box_el = this.view.main
    .append('rect')
    .attr('transform', 'translate('+this.pos0+')')
    .style('stroke', this.view.options.selection_color)
    .style('stroke-width', 2)
    .style('fill', this.view.options.selection_color)
    .style('fill-opacity', 0.33);
}

SelectionHandler.prototype.updateBox = function() {
  this.box_el
    .attr('width', Math.abs(this.pos[0]-this.pos0[0]))
    .attr('height', Math.abs(this.pos[1]-this.pos0[1]))
    .attr('transform', 'translate('+Math.min(this.pos0[0], this.pos[0])+','
                                   +Math.min(this.pos0[1], this.pos[1])+')');
}

SelectionHandler.prototype.getNodesInRect = function(l, t, r, b) {
  var x0 = Math.min(l, r), x1 = Math.max(l, r);
  var y0 = Math.min(t, b), y1 = Math.max(t, b);
  var ns = Tree.get_leaf_nodes(this.view.model).filter(function (n) {
    return (!n.hidden && n.sel_box &&
            x0 <= n.x+n.sel_box.x+n.sel_box.width && x1 >= n.x+n.sel_box.x &&
            y0 <= n.y+n.sel_box.y+n.sel_box.height && y1 >= n.y+n.sel_box.y);
  });
  return ns;
}

SelectionHandler.nodeIsNotFractionBar = function(n) {
  return n.value !== '//';
}

SelectionHandler.prototype.highlight = function() {
  this.interaction_handler.highlight_nodes(
    gmath.array.mergedNew(this.initial_nodes, this.nodes));
}

SelectionHandler.prototype.end = function() {
  this.box_el.remove();
  return gmath.array.mergedNew(this.initial_nodes, this.nodes)
              .filter(SelectionHandler.nodeIsNotFractionBar);
}
// Copyright Erik Weitnauer 2014.

/**
 * Allows splitting / expanding of terms like `2*x` into `x+x` by placing two
 * fingers around the terms and spreading them.
 *
 * The handler performs a deep search on the active nodes and performs the
 * matching action with highest priority. Here is a list of actions, what they
 * match and their priority:
 *
 * - SplitNumberAction(`Num`): 0
 * - SplitProductAction(`*Num*EXPR`): 1
 * - SplitPowerAction(`EXPR^Num`): 2
 * - SplitPowerSumAction(`EXPR^Sum`): 3
 * - SplitBrackets(`(EXPR)`): 4
 */
var SplitHandler = function(view, interaction_handler) {
	this.view = view;
  this.nodes = null;       // the node to act on
  this.splitted = false; // did we already split?
  this.new_state = null;
  this.prevDist = null; // for intervals of continuous splitting
  this.interaction_handler = interaction_handler;

  this.actions = [SplitNumberAction, SplitProductAction, SplitPowerAction, SplitPowerSumAction, RemoveBracketsAction];
}

/// Returns true, if the gesture wants to grab the current.
/// `evt` must have a `dist0` and a `dist` field.
SplitHandler.prototype.check = function(evt) {
	return evt.dist-evt.dist0 > 15;
}


/// Returns the new selection of nodes based on the one passed.
SplitHandler.prototype.start = function(center, nodes) {
	this.prevDist = null;
	this.nodes = nodes;
	return this.nodes || [];
}

SplitHandler.prototype.end = function() {
	this.node = null;
	this.splitted = false;
}

/**
 * Check for this node and its children whether one of our splitting actions
 * can be applied. Returns the 'best' appliable action or undefined if none.
 * When a previousBestAction is passed, it will be returned unless some action
 * with higher priority was found.
 * The action that is returned is already bound to the right node.
 */
SplitHandler.prototype.getBestAction = function(tree, node, previousBestAction) {
	var bestAction = previousBestAction;
	// check the node itself
	this.actions.forEach(function (action) {
	  if (bestAction && (action.priority <= bestAction.priority)) return;
	  if (action.match(node)) bestAction = action.createBoundAction(tree, {actor: node});
	});
	// now check for each child of node
	for (var i=node.children.length-1; i>=0; i--) {
		var child = node.children[i];
		var bestChildAction = this.getBestAction(tree, child, bestAction);
	  if (bestChildAction) bestAction = bestChildAction;
	}
	return bestAction;
}

SplitHandler.prototype.split = function(tree, nodes) {
	var best_action;
	for (var i=nodes.length-1; i>=0; i--) {
		best_action = this.getBestAction(tree, nodes[i], best_action);
	}
	if (!best_action) return false;

	tree.performAction(best_action);

	tree.hide_nodes();
	tree.changed();

	var res_nodes = Tree.nodes_to_range(best_action.mapNodes(best_action.actor));
	//var idx = nodes.indexOf(best_action.actor);
	// var res_nodes = nodes.slice(0,idx)
	//              .concat(best_action.resultNodes)
	//              .concat(nodes.slice(idx+1));

	return res_nodes;
}

/**
 * Finds the best action, aplies it, triggers a change event and update
 * this.nodes.
 */
SplitHandler.prototype.update = function(evt) {
	if (!this.nodes) return;
	if (this.prevDist !== null && evt.dist-this.prevDist<=30) return;

	var res_nodes = this.split(this.view.model, this.nodes);
	if (!res_nodes) return;

	this.prevDist = evt.dist;
	this.nodes = res_nodes;
	this.interaction_handler.highlight_nodes(this.nodes);
}
var DragHandler = function(view, interaction_handler) {
	this.view = view;
	this.alm = this.view.model;
  this.interaction_handler = interaction_handler;
  this.dl = view.options.derivation_list;
  this.show_target_areas = false; // set to true to show target areas
  this.dx = 0;          // x movement since start
  this.dy = 0;          // y movement since start
  this.nodes = [];      // array of dragged nodes
  this.smooshedNodes = []; // array of smooshed nodes, all "dragged" nodes are not shown when there are smooshed nodes
  this.smooshing = false; // when in a sequence of chained smoosh actions, we will maintain a list of smooshed nodes to be displayed/dragged instead of the
                          // normal dragged nodes. when the sequence ends, the smooshedNodes list is flushed and the normal dragged nodes are displayed again.
  this.bbox = null;     // the bounding box around all dragged nodes
  this.actions = [];    // valid moves that can be done with the selected nodes
  this.target_areas = null; // d3 selection of target area visualizations
  this.active = false;
}

/// Returns true, if the gesture wants to grab the current.
/// `evt` must have a `pos` and a `pos0` field.
DragHandler.prototype.check = function(evt, nodes) {
  var dx = evt.pos0[0]-evt.pos[0]
     ,dy = evt.pos0[1]-evt.pos[1];
  // don't grab a potential cancelling gesture
  if (evt.fingers.length === 1 && nodes.length === 0) return false;
  return dx*dx+dy*dy >= 8*8;
}

DragHandler.prototype.isActive = function() {
  return this.active;
}

/// Returns the new selection of nodes based on the one passed.
/// If you pass some moveActions as the third parameter, the dragHandler
/// will just use them instead of calling getMoveActions() on the alm.
//DragHandler.prototype.start = function(center, nodes, do_not_process_nodes, moveActions, do_not_move_nodes) {

/// Inside options, pass
///   - actions ([Action])
///   - reselect_nodes (default: true)
///   - move_nodes (default: true)
DragHandler.prototype.start = function(center, nodes, opts) {
  if (this.dl) this.dl.setLastHandleVisibility(false);
  var options = gmath.extend({ reselect_nodes: true, move_nodes: true }, opts);

  this.active = true;
  this.center = center.slice();
  this.nodes = (options.reselect_nodes ? this.process_selection(nodes) : nodes);

  this.do_not_move_nodes = !options.move_nodes;

  // only set the top-level nodes' dragging property to true, so
  // the repositioning of their children will work when calling
  // performAction.
  for (var i=0; i<this.nodes.length; i++) {
    var n = this.nodes[i];
    n.dragging = true;
    n.x0 = n.x;
    n.y0 = n.y;
  }

  // leading op's get unhidden during dragging
  if (this.alm.hide_nodes()) {
    this.view.renderer.set_style(this.nodes);
    this.view.update_style();
  }

  this.view.renderer.set_position(this.nodes);
  this.view.enter_and_exit('shadow');
  this.view.update_existing('shadow');
  this.setupActions(options.actions);
  return this.nodes;
}

/// `evt` must have a `dx` and a `dy` field.
DragHandler.prototype.update = function(evt) {
  var dx = evt.dx, dy = evt.dy;
  if (!this.do_not_move_nodes) {
    Tree.for_each(function (n) {
      if (!n.no_show) { n.x += dx; n.y += dy; }
    }, this.nodes);
    Tree.for_each(function (n) {
      n.x += dx; n.y += dy;
    }, this.smooshedNodes);
  }
  this.bbox.x += dx; this.bbox.y += dy;
  this.center[0] += dx; this.center[1] += dy;
  if (this.show_target_areas) HitTester.draw(this.view.main, this.actions, this.bbox);

  // we move a term if we enter into a target area
  var bestHit = HitTester.getBestHit(this.actions, this.bbox);
  if (bestHit && bestHit.delay && !bestHit.timeoutID) this.applyTimeout(bestHit);
  else if (bestHit && !bestHit.delay && !bestHit.timeoutID) this.performAction(bestHit);
  else if (!bestHit) this.stopAllTimeouts();
  // do nothing if there is a hit with a set timeout, performAction will be triggered by the timeout
  this.view.update_positions();
  this.view.update_shadow_style(); /// Experimental feature.

  if (this.smooshing) {
    this.view.updateSmooshedNodesSelection(this.smooshedNodes);
  }
}

/// In-place operation, will change the passed nodes array.
DragHandler.prototype.reorderInRanges = function(nodes) {
  if (nodes.length < 2) return nodes;
  var tree = nodes[0].get_root();
  var idx = 0;
  tree.for_each(function(n) { n.order_num = idx++; });
  return nodes.sort(function(a, b) { return a.order_num - b.order_num });
}

DragHandler.prototype.performAction = function(action) {
  this.stopAllTimeouts();

  // cache old position of equal sign
  var eql = this.alm.getNodes("=",0), eql_pos_old
  if (eql) eql_pos_old = {x: eql.x, y: eql.y};

  this.alm = this.alm.performAction(action);
  var nnodes = action.new_selection ? action.new_selection : action.mapNodes(this.nodes);
  this.reorderInRanges(nnodes);
  nnodes = this.process_each_selection(nnodes);

  this.collectSmooshedNodes(action);

  // update the seleced and dragging attributes if selected nodes changed
  var same = true, i;
  if (this.nodes.length !== nnodes.length) same = false
  else for (i=0; i<this.nodes.length; i++) same = same && (this.nodes[i] === nnodes[i]);
  if (!same) {

    if (action.is_join_action) {
      this.view.updateSmooshedNodesSelection(this.smooshedNodes);
      for (i=0; i<nnodes.length; i++) Tree.for_each(function(n) {n.no_show = true}, nnodes[i]);
    }

    this.interaction_handler.highlight_nodes(nnodes);

    for (i=0; i<this.nodes.length; i++) this.nodes[i].dragging = false;
    for (i=0; i<nnodes.length; i++) nnodes[i].dragging = true;
    this.correctNodePositions(nnodes, action);

    this.alm.hide_nodes();
  }

  this.nodes = nnodes;
  if (eql) this.updateNodePositionsAroundEquals(eql_pos_old);
  this.view.update_style();
  this.setupActions();
  this.view.enter_and_exit('shadow');
  this.view.update_existing('shadow');
}

/// Problematic case is "x+x", since the action internally modifies this to
/// be "1*x+1*x" and we don't want to show the 1's as smooshed nodes
DragHandler.prototype.collectSmooshedNodes = function(action) {
  var get_mapped_leaf_nodes = function(nodes) {
    var leaves = Tree.get_leaf_nodes(nodes);
    // FIXME: why is return Tree.clone(leaves) not working here?
    return leaves.map(function(node) { return action.initial_node_map[node.id][0] });
  }
  if (action && action.is_join_action) {
    this.smooshing = true;
    if (this.smooshedNodes.length===0) {
      this.smooshedNodes = this.smooshedNodes.concat(get_mapped_leaf_nodes(action.nodes));
    }
    this.smooshedNodes = this.smooshedNodes.concat(get_mapped_leaf_nodes([action.target]));
  } else {
    this.smooshing = false;
    Tree.for_each(function(n) {n.no_show = false}, this.nodes);
    this.smooshedNodes = [];
    this.view.exitSmooshed();
  }
}

DragHandler.prototype.setupActions = function(actions) {
  //console.log(this.nodes, this.nodes.map(function(n) { return n.to_ascii()}).join('; '));
  if (this.smooshing) {
    this.bbox = { x: this.center[0]-1, y: this.center[1]-1
                , width: 2, height: 2}
  } else {
    this.bbox = HitTester.getBoundingBox(this.nodes, 0);
    this.bbox.x -= 5; this.bbox.width = 10;
    this.bbox.y -= 8; this.bbox.height = 16;
  }
  this.actions = actions || this.alm.getMoveActions(this.nodes);
  if (!this.view.options.enable_drag_to_join)
    this.actions = this.actions.filter(function(action) { return !action.is_join_action });
  HitTester.setTargetRegions(this.actions);
  if (this.show_target_areas) HitTester.draw(this.view.main, this.actions, this.bbox);
}

/** Updates node positions such that the "=" stays at the same position. */
DragHandler.prototype.updateNodePositionsAroundEquals = function(old_pos) {
  var eql = this.alm.getNodes("=",0);
  if (eql) {
    var dx = old_pos.x - eql.x, dy = old_pos.y - eql.y;
    var dragged_nodes = Tree.select_all(this.nodes);
    this.alm.children[0].for_each(function(n) {
      if (dragged_nodes.indexOf(n) !== -1) {
        n.x0 += dx; n.y0 += dy
      } else {
        n.x += dx; n.y += dy
      }
    });
  }
  this.view.update_positions();
}

// When moving `3` to the left in `5=3`, the node that is dragged changes from
// `3` to `sub[-,3]`. We want to position the `sub` and the `-` nodes, but want
// to keep the position of the `3`.
DragHandler.prototype.correctNodePositions = function(new_nodes, action) {
  var anchor = null;
  // get an old node that is still in the new nodes
  for (var i=0; i<this.nodes.length; i++) {
    var mnodes = action.mapNodes(this.nodes[i]);
    if (mnodes.length !== 1) continue;
    anchor = Tree.select_first(function (n) { return n === mnodes[0] }, new_nodes);
    if (anchor) break;
  }
  console.log(anchor);
  if (anchor) {
    var offset = {x: anchor.x-anchor.x0, y: anchor.y-anchor.y0};

    Tree.for_each(function(n) {
      if (!n.has_children() && n.x===n.x0 && n.y===n.y0) {
        n.x+=offset.x; n.y+=offset.y;
      }
    }, new_nodes);
  }
}

DragHandler.prototype.end = function() {
  if (this.dl) this.dl.setLastHandleVisibility(true);
  this.stopAllTimeouts();
  Tree.for_each(function(n) { n.selected = false; n.dragging = false; }, this.alm.children);
  this.view.enter_and_exit('shadow');
  this.view.update_existing('shadow');
  this.collectSmooshedNodes();
  this.alm.hide_nodes();
	this.nodes = [];
  this.actions = [];
  this.bbox = null;
	this.view.update_all();
  if (this.show_target_areas) HitTester.draw(this.view.main);
  this.active = false;
}

DragHandler.prototype.applyTimeout = function(action) {
  var self = this;
  action.timeoutID = setTimeout(function() {
    self.performAction(action);
  }, action.delay);
}

DragHandler.prototype.stopAllTimeouts = function() {
  for (var i=0; i<this.actions.length; i++) {
    var action = this.actions[i];
    if (action.timeoutID) {
      clearTimeout(action.timeoutID);
      action.timeoutID = null;
    }
  }
}

// 2015/3 (DB): The function process_selection assumes that everything you have
// selected is to be reduced to the closest common (commutative) anscestor.
// After an action has been taken, and we want to process those selections, we
// want to process each range in that list independently. For example, collecting
// exponents with the intention to factor them in x^2*y^2 breaks on the point of
// selection processing without this modification. And, simplifiying (1+2+3)*4
// by smooshing is possible with this function, as the 6 in 6*4 will now be
// processed to select the *6. We need to watch out for other places selection
// processing breaks the interaction.
DragHandler.prototype.process_each_selection = function(nodes) {
  var ranges = AlgebraModel.groupNodeRanges(nodes);
  var self = this;
  var processedNodes = [];
  ranges.map(function(ns) { return self.process_selection(ns) })
        .forEach(function(ns) { processedNodes = gmath.array.mergedNew(processedNodes, ns) });
  return processedNodes;
}

/// If the passed nodes are not commutative, return their first commutative ancestor (but don't
/// pass through relations in the acestor chain). If they are commutative then in case all
/// children of their parent are selected, select their first commutative ancestor (this allows,
/// e.g., to transform `1+2*3` into `2*3+1` by dragging `2*3` around), otherwise, return the nodes
/// unchanged.
DragHandler.prototype.process_selection = function(orig_nodes) {
  var nodes = orig_nodes.slice();
  if (nodes.length === 0) return [];
  // if the selected nodes are commutative ==> check if all children were selected
  if (nodes[0].commutative) {
    var parent = nodes[0].parent;
    if (nodes.length < parent.children.length) return nodes;
    else nodes = [parent];
  }

  // non commutative ==> select the first commutative ancestor!
  var n = nodes[0];
  while (!AlgebraModel.is_top_most(n) && !n.parent.is_group('equals') && !n.commutative
      && !n.is_group('exponent')) n = n.parent;
  if (n.parent && n.parent.is_group('equals') && n.value == '=') n = n.parent;
  return [n];
};
var SubstitutionHandler = function(view, interaction_handler) {
  this.interaction_handler = interaction_handler;
  this.dl = view.options.derivation_list;
  this.view = view;
  this.alm = view.model;

  this.line = {A: {}, B: {}}; // line from initial to current position
  this.line_el = null;        // d3 selection of svg line element
  this.bbox = null;           // should be a box around the endpoint of the line

  this.otherLines = [];
  this.otherLine_els = [];

  this.targets = [];

  this.processed_color = 'rgb(200,200,200)';
}

SubstitutionHandler.prototype.check = function(evt, nodes) {
  if (!this.view.options.substitution_on) return false;
  if (evt.fingers.length === 1 && nodes.length === 1 && nodes[0].value==='=') {
    return true;
  }
  return false;
}

SubstitutionHandler.prototype.start = function(center) {
  this.collectSurroundingsInfo();
  this.highlightAllPotentialActions();
  this.initializeLine({x: center[0], y: center[1]});
  return [];
}

SubstitutionHandler.prototype.update = function(evt) {
  var actions = [];
  this.targets.forEach(function(target) { actions = actions.concat(target.potentialActions) });
  HitTester.draw(this.view.main, actions, this.bbox);

  this.updateLineObject(evt);
  this.collectPassedOverNodes();
  this.highlightAllPotentialActions();

  this.updateLineElement(this.line_el, this.line);
}

SubstitutionHandler.prototype.end = function() {
  for (var i=0; i<this.targets.length; i++) {
    var target = this.targets[i];
    if (target.results.length > 0) this.performSubstitution(target);
  }
  this.eraseInfoAndCleanBoard();
}

SubstitutionHandler.prototype.collectSurroundingsInfo = function() {
  this.derivationLists = this.dl.getAllDLs().slice();
  this.ignoreSourceDerivationList();
  this.activeRows = this.derivationLists.map(function(dl) {return dl.getLastRow()});
  this.algebraModels = this.derivationLists.map(function(dl) {return dl.getLastModel()});
  this.targets = this.organizeDataIntoTargets();
}

SubstitutionHandler.prototype.ignoreSourceDerivationList = function() {
  this.derivationLists.splice(this.derivationLists.indexOf(this.dl), 1);
}

SubstitutionHandler.prototype.organizeDataIntoTargets = function() {
  var targets = []
  for (var i=0; i<this.derivationLists.length; i++) {
    var actions = this.getAllAvailableActions(this.algebraModels[i], this.derivationLists[i]);
    var target = {dl: this.derivationLists[i]
                 ,row: this.activeRows[i]
                 ,model: this.algebraModels[i]
                 ,potentialActions: actions
                 ,results: []};
    targets.push(target);
  }
  return targets;
}

SubstitutionHandler.prototype.getAllAvailableActions = function(alm, dl) {
  var actions = this.alm.SubstitutionAction.getAllAvailableActions(this.alm, alm);
  var our_row = this.dl.getLastRow()
    , x0 = this.dl.pos[0] + our_row.pos[0]
    , y0 = this.dl.pos[1] + our_row.pos[1];
  for (var i=0; i<actions.length; i++) {
    var row = dl.getLastRow();
    if(this.dl.coordinator && dl.coordinator) {
      var containerOffset = this.dl.coordinator.getOffset(this.dl,dl);
      actions[i].offset = { x: dl.pos[0] + row.pos[0] - x0 + containerOffset[0]
                        , y: dl.pos[1] + row.pos[1] - y0 + containerOffset[1]};
    }else{
      actions[i].offset = { x: dl.pos[0] + row.pos[0] - x0
                        , y: dl.pos[1] + row.pos[1] - y0 };
  }
  }
  HitTester.setTargetRegions(actions);
  return actions;
}

SubstitutionHandler.prototype.highlightAllPotentialActions = function() {
  for (var i=0; i<this.targets.length; i++) {
    var ranges = this.targets[i].potentialActions;
    var all_nodes = [];
    for (var j=0; j<ranges.length; j++) all_nodes = all_nodes.concat(ranges[j].target);
    this.targets[i].row.view.interaction_handler.highlight_nodes(all_nodes);
  }
}

SubstitutionHandler.prototype.initializeLine = function(to) {
  this.line_el = this.makeLineElement();
  var from = this.calculateCenterOfEqualsSymbol();
  this.line.A.x = from.x; this.line.A.y = from.y;
  this.line.B.x = to.x; this.line.B.y = to.y;
  this.bbox = { x: this.line.B.x-2, y: this.line.B.y-2, width: 4, height: 4 };
}

SubstitutionHandler.prototype.makeLineElement = function(target) {
  var line = this.view.main
    .append('line')
    .classed('substitution', true)
    .style('stroke', target  ? this.processed_color : this.view.options.selection_color)
    .style('stroke-width', 6)
    .style('stroke-linecap', 'round');
  return line;
}

SubstitutionHandler.prototype.calculateCenterOfEqualsSymbol = function() {
  var dl = this.dl
     ,model = dl.getLastModel()
     ,equalsSymNode = model.get_child([0,1]);
  var x = equalsSymNode.x + equalsSymNode.sel_box.x + equalsSymNode.sel_box.width/2
     ,y = equalsSymNode.y + equalsSymNode.sel_box.y + equalsSymNode.sel_box.height/2;
  return {x: x, y: y};
}

SubstitutionHandler.prototype.updateLineObject = function(evt) {
  this.line.B.x += evt.dx; this.line.B.y += evt.dy;
  this.bbox = { x: this.line.B.x-2, y: this.line.B.y-2, width: 4, height: 4 };
}

SubstitutionHandler.prototype.updateLineElement = function(el, line) {
  el.attr('x1', line.A.x)
    .attr('y1', line.A.y)
    .attr('x2', line.B.x)
    .attr('y2', line.B.y);
}

SubstitutionHandler.prototype.collectPassedOverNodes = function() {
  for (var i=0; i<this.targets.length; i++) {
    this.findMatchingEndpointNodes(this.targets[i]);
  }
}

SubstitutionHandler.prototype.findMatchingEndpointNodes = function(target) {
  var hit = HitTester.getBestHit(target.potentialActions, this.bbox);
  if (!hit) return;
  this.removeNodesFromPotentialActionsList(hit, target);
  target.results.push(hit);
  this.drawLine(hit, target);
}

SubstitutionHandler.prototype.removeNodesFromPotentialActionsList = function(action, target) {
  target.potentialActions.splice(target.potentialActions.indexOf(action), 1);
}

/// Creates a line from the equal sign to the target nodes
SubstitutionHandler.prototype.drawLine = function(action, target) {
  var target_pos = {x: action.x + action.width/2, y: action.y + action.height/2};
  var line = {A: {x: this.line.A.x, y: this.line.A.y}
             ,B: target_pos};
  var line_el = this.makeLineElement(target);
  this.updateLineElement(line_el, line);
  this.otherLines.push(line);
  this.otherLine_els.push(line_el);
}

/// First substitution creates a new model, all following substitutions are
/// done in place.
SubstitutionHandler.prototype.performSubstitution = function(target) {
  var actions = target.results;
  if (actions.length === 0) return;
  var new_model = target.model.performAction(actions[0], null, false);
  for (var i=1; i<actions.length; i++) {
    var act = actions[i];
    act.oldTree = new_model;
    act.newTree = new_model;
    act.target = actions[0].mapNodes(act.target);
    new_model.performAction(act, null, true); // in place
  }
  new_model.finishInteraction();
  target.model = new_model;
}

SubstitutionHandler.prototype.eraseInfoAndCleanBoard = function() {
  this.removeAllLineElements();
  this.unhighlightAllNodes();
  this.otherLines = [];
  this.otherLine_els = [];
  this.targets = [];
}

SubstitutionHandler.prototype.removeAllLineElements = function() {
  this.line_el.remove();
  for (var i=0; i<this.otherLine_els.length; i++) {
    this.otherLine_els[i].remove();
  }
  HitTester.draw(this.view.main);
}

SubstitutionHandler.prototype.unhighlightAllNodes = function() {
  for (var i=0; i<this.targets.length; i++) {
    this.targets[i].row.view.interaction_handler.highlight_nodes([]);
  }
};
/** This class keeps track of all DL's (standalone and in CanvasModels)
 * to allow interactions between them. */

/* TODOs:

* check whether a .coordinator is set for a DL before using it
* if its not set, fall back to the old page_model logic from before
  in the factoring and substitution actions
  (but rename page_model to canvas_model, also have a new method in DLs
   "getAllDLs()" that returns an array of all DLs based on the coordinator
    or page_model)
* implement the getPositionOnPage() method and use it :)
* how to utilize all this when (un)hovering DLs?

*/
DLCoordinator = function() {
	this.dls = [];
}

DLCoordinator.prototype.addDL = function(dl) {
	//console.log("added"+dl.options.eq);
	this.dls.push(dl);
	if (dl.coordinator) coordinator.removeDL(dl);
	dl.coordinator = this;
}

DLCoordinator.prototype.removeDL = function(dl) {
	var idx = this.dls.indexOf(dl);
	if (idx === -1) throw "I don't know about this DL, so I can't remove it.";
	this.dls.splice(idx, 1);
}

DLCoordinator.prototype.subscribeToCanvasModel = function(model) {
	var self = this;
	var modelDls = model.dls();
	var thisDl = null;
	for (var i = 0; i < modelDls.length; i++) {
		self.addDL(modelDls[i]);
	}
	model.on('create', function(event) {
		if (event.target_type === 'dl') self.addDL(event.target);
	});
	model.on('remove', function(event) {
		if (event.target_type === 'dl') self.removeDL(event.target);
	});
	// TODO?: 'reset' event
}


DLCoordinator.prototype.getPositionOnPage = function(dl) {
	var dlX,dlY;
	if(dl.options.standalone == true){
		dlX = dl.container().getBoundingClientRect().left;
		dlY = dl.container().getBoundingClientRect().top;
	}else{
		dlX = dl.svg.node().viewportElement.getBoundingClientRect().left;
		dlY = dl.svg.node().viewportElement.getBoundingClientRect().top;
	}
	return([dlX,dlY]);
}

DLCoordinator.prototype.getOffset = function(dl1, dl2) {
	var self = this;
	var posDl1 = self.getPositionOnPage(dl1);
	var posDl2 = self.getPositionOnPage(dl2);
	return([posDl2[0]-posDl1[0],posDl2[1]-posDl1[1]]);
}
// Copyright by Erik Weitnauer, 2014.

/**
 * Available options and their defaults:
 *
 * - font_size: in px [80]
 * - color: css string ['#333']
 * - selection_color: css string ['lightblue']
 * - inactive_color: css string ['gray']
 * - fraction_size_factor: how much smaller are den. & num. rendered? [0.7]
 * - subscript_size_factor: [0.5]
 * - exp_size_factor: how much smaller are powers rendered? [0.7]
 * - debug_lines: show debug lines? [false]
 * - dur: duration of animations in ms [250]
 * - easing_fn: easing function for animations ['circle-out']
 * - pos: position of view in container [[0,0]]
 * - size: pass { width, height } to set view to a fixed size
 *         [{width: 'auto', height: 'auto'}]
 * - interaction_mode: intial mode of interaction, either 'transform' or 'change' ['transform']
 * - h_align: horizontal alignment of expression 'left', 'center' or 'right' ['center']
 * - v_align: vertical alignment of expression 'top', 'bottom', 'center' or
 *            'alphabetic' ['alphabetic']
 * - background_color: css string ['none']
 * - border_color: css string ['none']
 * - border_radius: border radius of the border rect [0]
 * - padding: padding around expression (this area allows for user interaction,
 *            too) [{ left: 0, right: 0, top: 0, bottom: 0}]
 * - shadow_color: fill color for shadow rect ['none']
 * - shadow_filter: reference to an svg filter for blurring the shadow rect [null]
 * - interactive: [true]
 * - event_receiver: the view will take events from this DOM element. By default
 *                   the passed container will be used [null]
 */
var AlgebraView = function(model, svg, options) {
  this.id = gmath.uid();
  this.model = model;
  this.events = d3.dispatch('updated');
  this.model.events.on('change.'+this.id, this.update_all.bind(this));
  this.svg = svg;
  this.main = null;
  this.initializeOptions(options);
  this.is_animating = 0;
  this.afterAnimationCallbacks = [];
}
gmath.AlgebraView = AlgebraView;

/// Binds this view to a new model. If a 1:1 node_map is passed, all current
/// visual elements are updated to link to the new nodes.
AlgebraView.prototype.bindToModel = function(model, node_map) {
  // unregister old change event listener and register new one
  if (this.model) this.model.events.on('change.'+this.id, null);
  this.model = model;
  this.model.events.on('change.'+this.id, this.update_all.bind(this));
  // bind graphical elements to new data
  if (node_map && this.main) {
    this.main.selectAll('g.math').each(function(d) {
      if (!d.deleted) d3.select(this).datum(node_map[d.id][0]);
    });
    this.main.selectAll('g.math_shadow').each(function(d) {
      if (!d.deleted) d3.select(this).datum(node_map[d.id][0]);
    });
  }
}

AlgebraView.defaultOptions = {
  font_size: 80
, color: '#333'
, selection_color: '#ff8c00' //'lightblue'
, inactive_color: 'gray'
, fraction_size_factor: 0.7
, exp_size_factor: 0.7
, subscript_size_factor: 0.5
, debug_lines: false
, debug_draw: false
, dur: 250
, easing_fn: "circle-out" //"cubic-in-out"
, pos: [0,0]
, interaction_mode: 'transform'
, v_align: 'alphabetic'
, h_align: 'center'
, background_color: 'none'
, shadow_filter: null
, border_color: 'none'
, shadow_color: 'none'
, border_radius: 0
, padding: { left: 0, right: 0, top: 0, bottom: 0}
, interactive: true
, event_receiver: null
, normal_font: { family: 'Crimson Text' }
, italic_font: { family: 'Crimson Text Italics'}
, font_baseline_shift: 0.24
, font_ascent: 0.73
, font_descent: 0.18
, slanted_div_bar: false
, div_bar_height: 0.056 // in em
, wiggle_dur: 300 // ms per half cycle
, wiggle_deg: 12  // in degree
, wiggle_random_delay: 100 // in ms
, show_node_targets: true // show shadows where a dragged node will move when dropped
, enable_drag_to_join: true // allow smooshing?
}

AlgebraView.prototype.callAfterAnimation = function(callback) {
  if (!this.is_animating) callback();
  else this.afterAnimationCallbacks.push(callback);
}

AlgebraView.prototype.animationFinished = function() {
  this.is_animating = Math.max(0, this.is_animating-1);
  if (this.is_animating > 0) return;
  this.afterAnimationCallbacks.forEach(function(cb) { cb() });
  this.afterAnimationCallbacks = [];
}

AlgebraView.prototype.initializeOptions = function(options) {
  options = options || {};

  var default_opts = gmath.extend({}, AlgebraView.defaultOptions); // shallow copy
  default_opts.pos = default_opts.pos.slice();
  default_opts.padding = gmath.extend({}, default_opts.padding);
  default_opts.normal_font = gmath.extend({}, default_opts.normal_font);
  default_opts.italic_font = gmath.extend({}, default_opts.italic_font);

  this.options = gmath.extend(default_opts, options);

  if (options.padding) {
    var op = options.padding;
    if (typeof(op) === 'number') {
      this.options.padding = { left: op, right: op, top: op, bottom: op};
    }
    else gmath.extend(this.options.padding, op);
  }
}

AlgebraView.prototype.init = function(on_load) {
  this.main = this.svg.append('g')
    .attr('id', this.options.id)
    .attr('class', 'main')
    .attr('transform', 'translate('+this.options.pos+')');

  this.shadow_rect = this.main.append('rect')
      .attr({rx : this.options.border_radius, ry: this.options.border_radius})
      .style('fill', 'none')
      .attr('filter', this.options.shadow_filter)
      .style('stroke', this.options.shadow_color)
      .style('visibility', this.options.shadow_filter ? 'visible' : 'hidden');

  this.border_rect = this.main.append('rect')
      .attr({rx : this.options.border_radius, ry: this.options.border_radius})
      .style('fill', this.options.background_color)
      .style('stroke', this.options.border_color);

  if (this.options.event_receiver) {
    this.event_receiver = d3.select(this.options.event_receiver);
  } else {
    this.event_receiver = this.main;
  }
  this.event_receiver.style('pointer-events', 'visible');

  if (this.options.debug_lines) {
    this.main
      .append('line')
      .attr('x1', -1000)//-this.width/2)
      .attr('x2', 1000)//this.width/2)
      .attr('stroke-width', '0.5')
      .attr('stroke', 'lightblue');
    this.main
      .append('line')
      .attr('y1', -1000)//-this.height/2)
      .attr('y2', 1000)//this.height/2)
      .attr('stroke-width', '0.5')
      .attr('stroke', 'lightblue');
  }

  this.renderer = new NodeRenderer(this, this.options.h_align, this.options.v_align);
  this.interaction_handler = new InteractionHandler(this, this.options.interactive);
  this.main.classed('interactive', this.options.interactive);
  this.interaction_handler.set_mode(this.options.interaction_mode);
  var fonts = [this.options.normal_font, this.options.italic_font];
  if (!AlgebraView.fontloader) {
    AlgebraView.fontloader = FontLoader(fonts, 2000);
    this.fontloader = AlgebraView.fontloader;
  } else {
    this.fontloader = AlgebraView.fontloader;
    this.fontloader.add_fonts(fonts);
  }
  var self = this;
  this.fontloader.on_fonts_loaded(function() {
    self.update_all();
    if (on_load) on_load();
  });
}

/// Getter: If called without an argument, the method returns true if the
///         view can currently be interacted with and false if not.
/// Setter: If called with true or false as argument, enables or disables
///         interactivity for the view.
AlgebraView.prototype.interactive = function(arg) {
  if (arguments.length === 0) return this.options.interactive;
  this.options.interactive = arg;
  this.interaction_handler.set_interactive(arg);
  this.main.classed('interactive', this.options.interactive);
  return this;
}

// Takes a single or an array of selector strings like "x+y".
// For example, to wiggle the 1, +2, and +4 parts of 1+2+3+4,
// pass ['1+2', '+4'].
AlgebraView.prototype.wiggle = function(sels, enable) {
  if (!Array.isArray(sels)) sels = [sels];
  var ranges = [];
  for (var i=0; i<sels.length; i++) {
    var parts = sels[i].split(':');
    var range = (parts.length === 1) ? this.model.getRanges(parts[0])
                                     : this.model.getRanges(parts[0], Number(parts[1])-1);
    if (range) ranges = ranges.concat(range);
  }
  var nodes = gmath.array.flatten(ranges);
  if (nodes.length === 0) return;
  this.wiggleNodes(nodes, enable);
  this.interaction_handler.events
    .on( 'touch.'+this.id, this.wiggleNodes.bind(this, null, false));
}

// Takes a single node or an array of nodes and a bool enable (defaut: true).
// Begins or ends wiggling animation for all nodes in array. If no nodes are
// passed, it selects all nodes.
AlgebraView.prototype.wiggleNodes = function (nodes, enable) {
  if (arguments.length < 2) enable = true;
  if (!nodes) nodes = this.model.children;
  if (!Array.isArray(nodes)) nodes = [nodes];
  var leafs = [];
  nodes.forEach(function(n) { if (n.has_children()) leafs = leafs.concat(n.get_leaf_nodes()); else leafs.push(n); });
  var gs = this.node_sel.filter(function(d) { return leafs.indexOf(d) !== -1 })
               .select('g.offset');
  var opts = this.options;
  var rot_tween = function(from, to, pos) {
    var i = d3.interpolate(from, to);
    return function(d) {
      var pos = AlgebraView.getCenter(d);
      return function(t) { return 'rotate(' + i(t) + ' ' + pos + ')'; }
    }
  }
  function repeat(d) {
    d3.select(this)
     .transition()
     .duration(opts.wiggle_dur)
     .attrTween("transform", rot_tween(opts.wiggle_deg, -opts.wiggle_deg))
     .transition()
     .duration(opts.wiggle_dur)
     .attrTween("transform", rot_tween(-opts.wiggle_deg, opts.wiggle_deg))
     .each('end', repeat);
  }
  if (enable) {
    gs.transition()
      .delay(function () { return Math.random() * opts.wiggle_random_delay }) // random time offset per element
      .duration(opts.wiggle_dur/2)
      .attrTween("transform", rot_tween(0, opts.wiggle_deg))
      .each('end', repeat);
  } else {
    gs.interrupt().transition().attr('transform', null);
  }
}

AlgebraView.getCenter = function(node) {
  var bbox = node.sel_box;
  return [(bbox.x + bbox.width / 2), (-node.size*0.24)];
}

AlgebraView.prototype.reposition = function(event) {
  var thiz = this;
  //d3.timer(function() {
    thiz.renderer.set_position(thiz.model.children, true);
    thiz.update_existing();
  //  return true;
  //});
}

AlgebraView.prototype.updateSmooshedNodesSelection = function(nodes) {
  var selection = this.main.selectAll('g.math_smooshed')
        .data(nodes, function(d) { return d.id });
        // .data(Tree.get_leaf_nodes(nodes), function(d) { return d.id });

  this.enterSmooshed(nodes, selection);
  this.updateSmooshed(nodes, selection);
}

AlgebraView.prototype.enterSmooshed = function(nodes, selection) {
  var self = this;

  var entering = selection.enter()
    .insert('g', 'g')
    .classed('math_smooshed', true)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" });

  entering.append('g').classed('offset', true);

  // the rectangle for selecting elements and for correct drawing (no smearing during dragging)
  entering.select('g.offset').append('rect')
    .attr('visibility', this.options.debug_draw ? 'visible' : 'hidden')
    .style('stroke', 'black')
    .style('fill', 'none')
    .classed("selector", true);

  // symbols
  entering.select('g.offset').append("text")
    .attr("font-family", function(d) { return self.get_font(d).family })
    .attr("font-weight", function(d) { return self.get_font(d).weight })
    .attr("font-style", function(d) { return self.get_font(d).style })
    .attr("font-size", function(d) { return d.size+"px" })
    .attr("fill", function(d) { return self.options.selection_color })
    .attr("opacity", function(d) { return 1 })
    .attr("pointer-events", "none")
    .text(function(d) { return d.to_string() });
}

AlgebraView.prototype.updateSmooshed = function(nodes, selection) {
  selection
    .transition()
    .duration(this.options.dur)
    .ease(this.options.easing_fn)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" });
}

AlgebraView.prototype.exitSmooshed = function() {
  this.main.selectAll('g.math_smooshed').data([]).exit().remove();
}

AlgebraView.prototype.update_all = function(event) {
  // challenge: for x*(1+2) the new x's should appear at the position of the old x ==> call enter_no_anim first
  // instead of using a property enter_as_is on the nodes, we'll use the node mappings later
  // TODO: we need two independent factors
  //   1. show/hide immediately VS animate opacity
  //   2. create/remove at current position VS computed position
  this.renderer.set_style(this.model.children);
  this.renderer.set_position(this.model.children, true);
  this.enter_and_exit('normal');
  this.update_existing('normal');

  this.events.updated({ type: 'updated', source: this, sender_id: this.id });
  this.is_animating++;
  setTimeout(this.animationFinished.bind(this), this.options.dur);
}

AlgebraView.prototype.enter_and_exit = function(nodeType) {
  var selection;

  if (nodeType==='normal') {
    selection = this.getNormalNodesSelection();
  } else if (nodeType==='shadow') {
    selection = this.getShadowNodesSelection();
  } else {
    throw "No node type specified for node visualization -- AlgebraView.js/enter_and_exit";
  }

  if (selection.length>0) {
    this._enter(selection, nodeType);
    this._exit(selection, nodeType);
  }
}

AlgebraView.prototype.getNormalNodesSelection = function() {
  var selection = this.main.selectAll('g.math')
    .data(Tree.get_leaf_nodes(this.model.children), function(d) { return d.id });

  return selection;
}

AlgebraView.prototype.getShadowNodesSelection = function() {
  if (!this.options.show_node_targets) {
    return [];
  }

  var dragged_nodes = this.model.filter(function(n) { return n.dragging; });
  var dragged_leaves = Tree.filter(function(n) {
    return !n.has_children();
  }, dragged_nodes);

  var selection = this.main.selectAll('g.math_shadow')
    .data(dragged_leaves, function(d) { return d.id; });

  return selection;
}

AlgebraView.prototype._enter = function(selection, nodeType) {
  var self = this;

  var te;
  if (nodeType === 'normal') {
    te = selection.enter()
      .append('g')
      .classed('math', true)
      .attr('transform', function(d) { return "translate("+ d.x + "," + d.y + ")" });
  } else {
    te = selection.enter()
      .insert('g', 'g')
      .classed('math_shadow', true)
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")" })
      .each(function(d) {d.shadow_deleted = false});
  }

  te.append('g').classed('offset', true); // used for wiggling

  // the rectangle for selecting elements and for correct drawing (no smearing during dragging)
  te.select('g.offset').append('rect')
    .attr('visibility', this.options.debug_draw ? 'visible' : 'hidden')
    .style('stroke', 'black')
    .style('fill', 'none')
    .classed("selector", true);

  var divisionBar = te.filter(function(d) {
    return d.value==='//';
  }).select('g.offset');

  var dbline = divisionBar.append('line')
      .style('stroke-linecap', 'round')
      .call(style_division_bar, this.options.slanted_div_bar, nodeType)
      .attr("opacity", function(d) {
        return (nodeType==='normal') ? (d.no_anim && !d.hidden ? 1 : 1e-5)
                                     : (d.hidden || d.hide_after_drop ? 0 : 1) });

  // symbols
  var textSelection = te.select('g.offset').append("text")
    .attr("font-family", function(d) { return self.get_font(d).family })
    .attr("font-weight", function(d) { return self.get_font(d).weight })
    .attr("font-style", function(d) { return self.get_font(d).style })
    .attr("font-size", function(d) { return d.size+"px" })
  if (nodeType==='normal') {
    textSelection.attr("stroke", "none")
      .attr("fill", function(d) { return d.color })
      .attr("opacity", function(d) { return d.no_anim && !d.hidden ? 1 : 1e-5 })
      .attr("pointer-events", "none")
      .text(function(d) { return d.to_string() });

    if (this.options.debug_draw) this.debugDraw(te);

    selection.each(function (d) { return d.no_anim = false });
  } else {
    textSelection.style("stroke", "#bbb")
      .style("stroke-width", 0.5)
      .attr("pointer-events", "none")
      .style("fill", 'none')
      .attr("opacity", function(d) { return d.hidden || d.hide_after_drop ? 0 : 1 });
  }

  return te;
}

AlgebraView.prototype._exit = function(selection, nodeType) {
  var self = this;
  var ex = selection.exit()
    .each(function(d) { if (nodeType==='normal') {d.deleted = true} else {d.shadow_deleted = true} })
    .transition()
    .ease("linear")
    .duration(function(d) { return d.no_anim ? 0 : self.options.dur })
    .attr("transform", function(d) { return "translate("+ (d.x||0) + "," + (d.y||0) + ")"})
    .remove();
  ex.select("*")
    .attr("opacity", 1e-5);

  if (nodeType==='normal') {
    this.node_sel = selection;
  }
}

AlgebraView.prototype.update_existing = function(nodeType) {
  var self = this;

  var selection = this.svg.selectAll(nodeType==='normal' ? 'g.math' : 'g.math_shadow')
        .filter(function(d) { if (nodeType==='normal') return !d.deleted; else return !d.shadow_deleted; });

  var locationTransformation = selection.transition()
        .duration(this.options.dur)
        .ease(this.options.easing_fn);
  if (nodeType==='normal') {
    locationTransformation.attr("transform", function(d) { return "translate("+ (d.x||0) + "," + (d.y||0) + ")"});
  } else {
    locationTransformation.attr("transform", function(d) { return "translate("+ (d.x0||0) + "," + (d.y0||0) + ")"});
  }

  var trans = selection.select("text")
        .transition()
        .duration(0)
        .text(function(d) { return d.to_string() })
        .transition()
        .duration(this.options.dur)
        .ease("linear")
        .attr("font-size", function(d) { return d.size + "px"});
  if (nodeType==='normal') {
    trans.attr("fill", function(d) { return d.color })
      .attr("opacity", function(d) { return d.no_show || d.hidden ? 1e-5 : 1 });
  } else {
    trans.attr('opacity', function(d) { return d.hidden || d.hide_after_drop ? 0 : 1 })
  }

  var divisionLineSelection = nodeType==='normal' ? selection.select('line') : selection.filter(function(d) {return d.value==='//'}).select('line');
  divisionLineSelection
    .transition()
    .duration(this.options.dur)
    .ease("linear")
    .call(style_division_bar, this.options.slanted_div_bar, nodeType)
    .attr("opacity", function(d) {
      if (nodeType==='normal') return (d.hidden ? 1e-5 : 1);
      else return (d.hidden || d.hide_after_drop ? 0 : 1);
    });

  if (nodeType==='normal') {
    selection.select("rect")
    // .transition()
    // .duration(this.options.dur)
    // .ease(this.options.easing_fn)
      .attr('x', function(d) { return d.sel_box ? d.sel_box.x : 0})
      .attr('y', function(d) { return d.sel_box ? d.sel_box.y : 0})
      .attr('width', function(d) { return (d.hidden || !d.sel_box) ? 0 : d.sel_box.width }) // don't allow grabbing of
      .attr('height', function(d) { return (d.hidden || !d.sel_box) ? 0 : d.sel_box.height });  // hidden elements

    this.update_background();
  }
  return true;
}

AlgebraView.prototype.update_background = function() {
  var main_node = this.model.children[0];
  var bbox = this.getBBox();
  if (main_node && !main_node.dragging) {
    this.border_rect
      .attr({rx : this.options.border_radius, ry: this.options.border_radius})
      .style('fill', this.options.background_color)
      .style('stroke', this.options.border_color)
      .attr(bbox);
    this.shadow_rect.transition()
      .attr(bbox);
  }
}

/// Returns the current bounding box of the view including the padding set
/// in the options.
/// You can pass { no_padding: true } to get the bounding box without padding.
AlgebraView.prototype.getBBox = function(opts) {
  opts = opts || {};
  var n = this.model.children[0];
  if (!n || !n.sel_box) return {x:0, y:0, width: 0, height: 0};
  var bbox = {};
  var padding = this.options.padding;
  bbox.x = n.sel_box.x + (n.dragging ? n.x0 : n.x)
         - (opts.no_padding ? 0 : padding.left);
  bbox.y = n.sel_box.y + (n.dragging ? n.y0 : n.y)
         - (opts.no_padding ? 0 : padding.top);
  bbox.width = n.sel_box.width
             + (opts.no_padding ? 0 : padding.left + padding.right);
  bbox.height = n.sel_box.height
              + (opts.no_padding ? 0 : padding.top + padding.bottom);
  return bbox;
}

AlgebraView.prototype.update_positions = function() {
  this.node_sel
    .transition()
    .duration(this.options.dur)
    .ease(this.options.easing_fn)
    .attr("transform", function(d) { return "translate("+ (d.x||0) + "," + (d.y||0) + ")"});
}

AlgebraView.prototype.update_style = function() {
  this.node_sel.select("text")
     .transition()
     .duration(this.options.dur)
     .ease("linear")
     .attr("font-size", function(d) { return d.size + "px"})
     .attr("fill", function(d) { return d.color })
     .attr("opacity", function(d) {
        if (d.no_show) return 1e-5;
        if (d.hidden) return 1e-5;
        if (d.hide_after_drop) return 0.4;
        return 1;
      });

  this.node_sel.select("line")
    .transition()
    .duration(this.options.dur)
    .ease("linear")
    .call(style_division_bar, this.options.slanted_div_bar)
    .attr("opacity", function(d) {
      if (d.hidden) return 1e-5;
      if (d.hide_after_drop) return 0.4;
      return 1;
    });
}

function style_division_bar(selection, slanted, nodeType) {
  selection
    .attr('x1', 0)
    .attr('x2', function(d) { return d.width })
    .style('stroke-width', function(d) { return (nodeType === 'normal' || !nodeType) ? d.height : d.height/2 })
    .style('stroke', function(d) { return (nodeType === 'normal' || !nodeType) ? d.color : '#ddd' });
  if (slanted) {
    selection.attr('y1', function(d) { return 0.2*d.height })
      .attr('y2', function(d) { return -0.2*d.height })
  }
}

AlgebraView.prototype.force_refresh = function() {
  var n = this.svg.node();
  n.style.display='none';
  n.style.display='block';
}

AlgebraView.prototype.get_utf8 = function(d) {
  var mappings = {'-': '−', '*': '·', '/': ''};//∗·•×−
  if (d.value in mappings) return mappings[d.value];
  if (typeof(d.value) == 'number' && d.value < 0) return mappings['-'] + Math.abs(d.value);
  return d.value;
}

AlgebraView.prototype.get_font = function(d) {
  return (d instanceof Var) ? this.options.italic_font : this.options.normal_font;
}

AlgebraView.prototype.get_width = function(d) {
  return this.fontloader.width(d.to_string(), d.size, get_font(d));
}

// For debugging font metrics
AlgebraView.prototype.debugDraw = function(node_els) {
  var self = this;
  node_els.select('g.offset').append('rect')
    .style('stroke', 'orange')
    .style('fill', 'none')
    .attr({ x:0
          , width: function(d) { return d.sel_box.width }
          , y: function(d) { return d.size * self.options.font_descent - 0.5}
          , height: 1})

  // For debugging font metrics
  node_els.select('g.offset').append('rect')
    .style('stroke', 'green')
    .style('fill', 'none')
    .attr({ x:0
          , width: function(d) { return d.sel_box.width }
          , y: function(d) { return -d.size * self.options.font_ascent - 0.5}
          , height: 1})

  // For debugging font metrics
  node_els.select('g.offset').append('rect')
    .style('stroke', 'blue')
    .style('fill', 'none')
    .attr({ x:0
          , width: function(d) { return d.sel_box.width }
          , y: function(d) { return -d.size * self.options.font_baseline_shift - 0.5}
          , height: 1})

}

/// Experimental feature.
AlgebraView.prototype.update_shadow_style = function() {
  // move shadow a little towards the dragged noded
  // this.main.selectAll("g.math_shadow")
  //   .attr('transform', function(d) {
  //     return "translate(" + [d.x0+1/100*(d.x-d.x0), d.y0+1/100*(d.y-d.y0)] + ")";
  //   });

  // make shadow less opaque when the dragged node comes close
  // function len(dx, dy) {
  //    return Math.sqrt(dx*dx+dy*dy);
  // }var fontsize = this.options.font_size;
  // this.main.selectAll("g.math_shadow")
  //   .style('opacity', function(d) {
  //     return Math.min(1, 0.4+len(d.x-d.x0, d.y-d.y0)/(4*fontsize)).toFixed(5);
  //   })

  // make non-dragged nodes less salient
  // var dragged_nodes = this.model.filter(function(n) { return n.dragging; });
  // var dragged_leaves = Tree.filter(function(n)
  //   { return !n.has_children() }, dragged_nodes);
  // this.main.selectAll('g.math')
  //  .attr('opacity', function(d) { return dragged_leaves.indexOf(d) !== -1 ? 1 : 0.6; })
}

///**
//Things that get updated:
//- font-size and color of nodes (a)  ==> set_styl(nodes)
//- dimensions of nodes & positioning (p)  ==> set_position(nodes, update_dims)

//- size, color, position of svg elements (A)  ==> update_existing()
//- existence of svg-g (E)  ==> enter_and_exit()

//Occasions to update them:
//- initially (a p E A)
//- after simplifying (a p E A)
//- start touch (a A)
//- start dragging (a p A)
//- during dragging (A)
//- moving terms (p(false) E A)
//- end touch (a A)
//*/
// Copyright Erik Weitnauer 2015.

/** A DerivationList holds a list of rows, each containing an AlgebraView and
 * the respective AlgebraModel. Each row has a handle that can be used to drag the
 * row up or down to hide or reveal the rows above.
 **/

/**
 * Creates a new derivation list in the passed svg element (or css selector
 * string) using the passed options. See DerivationList.defaultOptions for
 * available options. Additionally, all options are passed on to any
 * AlgebraView and AlgebraModel that is created, so any options supported by
 * these classes will work, too.
 *
 * Use dl.events.on('added_line', fn) to listen to added line events.
 */
DerivationList = function(container, options, callback) {
  this.id = gmath.uid();
  this.events = d3.dispatch('added_line', 'change', 'end-of-interaction', 'inspect_node');
  this.dims = {}; // max dims among all lines
  this.initializeOptions(options);
  this.canvas_model = options.canvas_model;

  this.container(container); // sets this.svg and this.svgg
  this.adjustPosition(options.pos);
  this.pos = this.options.pos.slice();
  this.svgg.attr('transform', 'translate('+this.pos+')');
  this.rows = [];
  this.handle_stroke_color = '#eee';
  this.curr_drag_handler = null;
  this.curr_target_model = null;
  this.hovering = false;

  var self = this;
  this.addLineFromExpressions(this.options.eq.split('\\\\'), function () {
    self.startWiggle(self.options.wiggle);
    if (callback) callback(self);
  });
  dl = this;
}

gmath.DerivationList = DerivationList;

DerivationList.defaultOptions = {
  eq: ''
, pos: [300,200]
, debug_lines: false
, visualize_derivations: "none"
, visualize_derivations_method: "all"
, embedded: true
, border_radius: 4
, v_align: 'center'
, h_align: 'equals'
, padding: {left: 40, right: 5, top: 5, bottom: 5}
, font_size: 50
, collapsed_mode: false // new lines are automatically created on top of previous ones
, draggable: true
, no_history: false
, hide_handles: false
, break_off_dist: 50
, wiggle: [] // pass something like "1+2" or ["1", "2", "3"]
, auto_resize_container: false
, substitution_on: true
, hoverable: false
, auto_collapse_repeated_actions: true
, interaction_mode: 'transform' // transform, change or inspect
, mappings_color: '#E6F3DE' // lightgreen: '#E6F3DE'; lightred: '#F3DEDE'; lightblue: '#DEE5F3'
, mappings_active_node_color: 'rgb(194, 219, 179)'
, mappings_rect_radius: 6
, mappings_joint_width: 16
, mappings_joint_length: 8
, mappings_line_thickness: 6
}

DerivationList.prototype.initializeOptions = function(options) {
  options = options || {};

  var default_opts = gmath.extend({}, DerivationList.defaultOptions); // shallow copy
  default_opts.pos = default_opts.pos.slice();
  default_opts.padding = gmath.extend({}, default_opts.padding);

  this.options = gmath.extend(default_opts, options);

  if (!('hide_handles' in options) && options.no_history) {
    this.options.hide_handles = !this.options.draggable;
  }
}

/// Getter and setter. Pass a html element or a css-selector string.
DerivationList.prototype.container = function(arg) {
  if (arguments.length === 0) return this.svg.node();
  this.svg = d3.select(arg);  // might be an svg or g element
  this.svgDims = this.getContainerDimensions();
  if (this.svgg) this.svg.node().appendChild(this.svgg.node());
  else {
    this.svgg = this.svg.append('g')
                  .classed('derivation-list', true)
                  .attr('id', this.id);
  }
  return this;
}

/** Alternative constructor that inserts an svg element into the container and
 * has the default options set to standalone, no_history and no_handles as well
 * as a position at the center of the svg. */
DerivationList.createStandalone = function(container, options, callback) {
  if (container instanceof String)
    container = d3.select(container).node();
  var selection = d3.select(container);
  if (selection.empty()) return;

  var text = selection.text();
  if (selection.selectAll('*').empty()) selection.text("");
  var svg = selection.append('svg')
              .style('width', "100%")
              .style('height', "100%")
              .style('overflow','visible');

  var opts = gmath.extend({
    pos: ['auto', 'auto']
  , v_align: 'center'
  , h_align: 'center'
  , no_history: true
  , no_handles: true
  , standalone: true
  , draggable: false
  }, options);
  opts.eq = opts.eq || text;

  return new DerivationList(svg.node(), opts, callback);
}

DerivationList.prototype.adjustPosition = function(pos) {
  if (this.options.pos[0] === 'auto') {
    if (this.options.h_align === 'center' || this.options.h_align === 'equals')
      this.options.pos[0] = this.svg.node().clientWidth/2;
    else if (this.options.v_align === 'left')
      this.options.pos[0] = this.options.padding.left
    else if (this.options.v_align === 'right')
      this.options.pos[0] = this.svg.node().clientWidth-this.options.padding.right;
  }
  if (this.options.pos[1] === 'auto') {
    if (this.options.v_align === 'center')
      this.options.pos[1] = this.svg.node().clientHeight/2;
    else if (this.options.v_align === 'top')
      this.options.pos[1] = this.options.padding.top;
    else if (this.options.v_align === 'bottom')
      this.options.pos[1] = this.options.padding.bottom;
    else if (this.options.v_align === 'alphabetic')
      this.options.pos[1] = 0;
  }
}

DerivationList.prototype.remove = function() {
  this.svgg.remove();
}

DerivationList.prototype.addLineFromExpressions = function(eqs, callback) {
  for (var i=0; i<eqs.length; i++)
    this.addLineFromExpression(eqs[i], i===eqs.length-1 ? callback : null);
}

DerivationList.prototype.addLineFromExpression = function(eq, callback) {
  //var model = new AlgebraModel(eq, this.options);
  if (this.rows.length > 0) this.deactivateRow(this.rows[this.rows.length-1]);
  this.addRowFromAscii(eq, callback);
  //this.rows.push(this.createRow(model, null, this.options, callback));
  //this.events.added_line();
}

// Wiggle any number of node ranges.
DerivationList.prototype.startWiggle = function(sels) {
  var alv = this.getLastView();
  alv.wiggle(sels, true);
}

DerivationList.prototype.setExpression = function(expr_string, keep_brackets) {
  this.getLastModel().parseAndSet(expr_string, keep_brackets);
}

DerivationList.prototype.setInteractionMode = function(mode) {
  this.rows.forEach(function(row) {
    row.view.interaction_handler.set_mode(mode);
  });
}

DerivationList.prototype.singleLineMode = function(val) {
  if (arguments.length === 0) return this.options.collapsed_mode;
  if (val && !this.options.collapsed_mode) {
    var hid_sth = false;
    for (var i=0; i<this.rows.length-1; i++) {
      if (!this.rows[i].hidden) { hid_sth = true; this.hideRow(this.rows[i]) }
    }
    if (hid_sth) this.layoutRows();
  }
  this.options.collapsed_mode = val;
  return this;
}

DerivationList.prototype.getLastRow = function() {
  return this.rows[this.rows.length-1];
}

DerivationList.prototype.getRowByModel = function(model) {
  for (var i=0; i<this.rows.length; i++) {
    if (this.rows[i].model === model) return this.rows[i];
  }
  return null;
}

DerivationList.prototype.getLastModel = function() {
  return this.getLastRow().model;
}

DerivationList.prototype.getLastView = function() {
  return this.getLastRow().view;
}

DerivationList.prototype.onCreate = function(event) {
  var view = this.getLastView();
  var p_row = this.getLastRow();
  var el = p_row.el, handle = p_row.handle;
  var old_model = event.action.oldTree;
  old_model.for_each(function (node) { node.dragging = false; node.selected = false });
  old_model.hide_nodes();

  var row = this.addRowFromAction(event.action);

  this.createViewForRow(p_row, gmath.object.merged(view.options,
    { interactive: false, pos: p_row.pos.slice() }));

  this.events.added_line();
  this.hideRow(p_row);
  //this.layoutRows();
}

/// Reuses the view and g-element of the last row.
DerivationList.prototype.addRowFromAction = function(action) {
  var view = this.getLastView();
  var model = action.newTree;
  view.bindToModel(model, action.initial_node_map);
  view.update_all();

  var p_row = this.getLastRow();
  var row = this.createRow(model, action, p_row.el);
  row.view = p_row.view;
  row.handle = p_row.handle;
  if (!this.rowBeforeCurrActionSeq) this.rowBeforeCurrActionSeq = p_row;
  // this.removeRowHandle(row); // do we need this line?
  this.createRowHandle(row);
  return row;
}

DerivationList.prototype.createRow = function(model, action, el) {
  var prev_row = this.getLastRow();
  var row = { model: model, action: action
            , view: null
            , el: el
            , handle: null
            , dims: (prev_row ? gmath.extend({}, prev_row.dims) : null)
            , idx: this.rows.length
            , pos: (prev_row ? prev_row.pos.slice() : [0,0])
            };
  if (el) {
    el.datum(row);
    el.attr('id', model.id);
  }
  var self = this;
  model.events.on('end-of-interaction.' + this.id, this.afterEndOfInteraction.bind(this));
  model.events.on('change.'+this.id, this.events.change);
  model.events.on('create.'+this.id, this.onCreate.bind(this));
  this.rows.push(row);
  return row;
}

DerivationList.prototype.afterEndOfInteraction = function(event) {
  var model = event.mathObject;
  if (model !== this.getLastModel()) return;
  this.events['end-of-interaction'](arguments);
  this.updateRowDimensionAfterInteraction(this.getLastRow());

  if (this.rowBeforeCurrActionSeq) {
    var row = this.rowBeforeCurrActionSeq;
    this.joinRows(this.rows[row.idx+1], this.getLastRow());
    var self = this;
    this.getLastView().callAfterAnimation(function() {
      self.unhideRow(row);
      self.layoutRows();
    });
  }

  this.rowBeforeCurrActionSeq = null;
}

/// Will join all rows from start_row to end_row into a single row, composing their actions.
DerivationList.prototype.joinRows = function(start_row, end_row) {
  var action_queue = [];
  for (var i=start_row.idx; i<=end_row.idx; i++) action_queue.push(this.rows[i].action);
  if (action_queue.length < 2) return;

  var action = Action.createComposedAction(action_queue, 'move action');
  action.oldTree = start_row.oldTree;
  action.newTree = end_row.newTree;
  var del_idx = start_row.idx, del_count = end_row.idx-start_row.idx
  for (var i=0; i<del_count; i++) this.removeRow(this.rows[del_idx]);
  end_row.action = action;
}

DerivationList.prototype.addRowFromModel = function(model, action, callback) {
  var p_row = this.getLastRow();
  if (p_row) this.deactivateRow(p_row);
  var row = this.createRow(model, action);
  var last_pos = p_row ? p_row.pos.slice() : [0,0];
  var self = this;
  this.createViewForRow(row, gmath.object.merged(this.options, {pos: last_pos}), function() {
    self.events.added_line();
    self.layoutRows();
    if (callback) callback();
  });
  return row;
}

DerivationList.prototype.addRowFromAscii = function(eq, callback) {
  return this.addRowFromModel(new AlgebraModel(eq, this.options), null, callback);
}

DerivationList.prototype.createViewForRow = function(row, options, callback) {
  var next_row = row;//this.rows[row.idx+1];
  var g = next_row ? this.svgg.insert('g', 'g.dl-line#'+next_row.model.id)
                   : this.svgg.append('g');
  g.classed('dl-line', true)
   .attr('id', row.model.id)
   .attr('transform', 'translate('+(options.pos || [0,0])+')')
   .datum(row);

  row.el = g;

  options.pos = [0,0];
  if (this.options.standalone) options.event_receiver = this.svg.node();
  options.derivation_list = this;
  row.view = new AlgebraView(row.model, g, options);

  var self = this;
  row.view.init(function() { // add row handle after view was initialized
    row.view.interaction_handler.events.on('inspect_node.'+self.id, function(event) {
      self.events.inspect_node({ node: event.node, dl: self });
    });
    self.createRowHandle(row);
    self.updateRowDimensionAfterInteraction(row);
    if (callback) callback(self);
  });
}

DerivationList.prototype.updateHandlePos = function(row) {
  if (this.options.no_handles) return;
  var circle_pos = this.getHandlePos(row.view);
  if (row.handle) row.handle.transition()
    .ease(row.view.options.easing_fn)
    .duration(row.view.options.dur)
    .attr('transform', 'translate('+circle_pos+')');
}

DerivationList.prototype.getRowByView = function(view) {
  return this.rows.filter(function(row) { return row.view === view })[0];
}

DerivationList.prototype.updateRowDimensionAfterInteraction = function(row) {
  //if (!row) return; // happens when row was just created
  var changed = this.updateRowDimensions();
  if (changed) {
    for (var i=0; i<this.rows.length; i++) {
      this.updateRowBackground(this.rows[i]);
      this.updateHandlePos(this.rows[i]);
    }
    this.moveIntoContainer();
  } else {
    this.updateRowBackground(row);
    this.updateHandlePos(row);
  }
}

DerivationList.prototype.collapsePreviousRow = function(prev_row, new_row) {
  if (this.options.collapsed_mode
     || (this.options.auto_collapse_repeated_actions
        && prev_row.action && new_row.action && prev_row.action.name===new_row.action.name))
    this.hideRow(prev_row);
}

DerivationList.prototype.moveIntoContainer = function() {
  if (this.hovering) return;
  var self = this;
  setTimeout(function() {
    var pos = self.keepInContainer([self.pos[0], self.pos[1]], self.rows[0].view.getBBox());
    if (pos[0] === self.pos[0] && pos[1] === self.pos[1]) return;
    self.pos = pos;
    self.svgg.transition()
      .attr('transform', 'translate('+pos+')');
  }, 1);
}

/// If all lines are visible, what is the y-position of the passed row.
DerivationList.prototype.getFinalVerticalPos = function(row, include_hidden, start_idx) {
  start_idx=start_idx || 0;
  var y = this.rows[start_idx].pos[1];
  for (var i=start_idx+1; i<=row.idx; i++) {
    if (this.rows[i-1].hidden && !include_hidden) continue;
    y += this.getVerticalAdvance(this.rows[i]);
  }
  return y;
}

DerivationList.prototype.isAboveFinalVerticalPos = function(row) {
  return row.pos[1] < this.getFinalVerticalPos(row);
}

/// Returns the first line above the passed line that is not fully expanded.
/// Null if none.
DerivationList.prototype.getUpmostPullableRow = function(row) {
  var idx;
  // TODO: cache the lowest positions in the layoutRows method.
  for (idx=row.idx; idx>=0; idx--) {
    if (this.rows[idx].hidden) break;
    if (!this.isAboveFinalVerticalPos(this.rows[idx])) break;
  }
  if (idx === row.idx) return null;
  return this.rows[idx+1];
}

DerivationList.prototype.getHiddenAbove = function(row) {
  var idx = row.idx-1;
  while (idx >= 0 && !this.rows[idx].hidden) idx--;
  return (idx === -1 ? null : this.rows[idx]);
}

DerivationList.prototype.getVisibleAbove = function(row) {
  var idx = row.idx-1;
  while (idx >= 0 && this.rows[idx].hidden) idx--;
  return (idx === -1 ? null : this.rows[idx]);
}

DerivationList.prototype.getDistanceFromHome = function(row) {
  var dx = row.pos[0]-row.drag_pos[0]
    , dy = row.pos[1]-row.drag_pos[1];
  return Math.sqrt(dx*dx+dy*dy);
}

DerivationList.prototype.dragRow = function(row) {
  var dx = d3.event.dx
    , dy = d3.event.dy;

  if (this.rows.length === 1 && row.idx === this.rows.length-1 && this.canvas_model) {
    this.handleFactoringGesture(row, dx, dy);
    return;
  }

  if (row.idx === 0) {
    if (this.options.draggable) {
      this.pos[0] += dx; this.pos[1] += dy;
      if (!this.hovering) this.pos = this.keepInContainer(this.pos, this.rows[0].view.getBBox());
      this.resizeContainer();
      this.svgg.attr('transform', 'translate('+this.pos+')');
    }
    return;
  }

  if (dy === 0) return;
  var bottom_row = this.rows[this.rows.length-1];
  var top_row;
  if (dy > 0) { // pull
    if (!this.isAboveFinalVerticalPos(row)) {
      top_row = this.getHiddenAbove(row);
      if (!top_row) return;
      this.unhideRow(top_row);
      top_row = this.rows[top_row.idx+1];
    } else {
      top_row = this.getUpmostPullableRow(row);
    }
  } else { // push
    top_row = this.getVisibleAbove(row);
    if (!top_row) return;
    if (row.pos[1] <= top_row.pos[1]) {
      this.hideRow(top_row);
    } else top_row = this.rows[top_row.idx+1];
  }
  for (var idx=top_row.idx; idx <= bottom_row.idx; idx++) {
    var rrow = this.rows[idx];
    rrow.pos[1] = Math.min(this.getFinalVerticalPos(rrow), rrow.pos[1]+dy);
    rrow.pos[1] = Math.max(idx > row.idx ? this.getFinalVerticalPos(rrow, false, row.idx) : 0
                          , rrow.pos[1]);
    rrow.el.attr('transform', 'translate('+rrow.pos+')');
  }
  this.resizeContainer();
}

DerivationList.prototype.releaseRow = function(row) {
  if (this.curr_drag_handler) {
    this.curr_drag_handler.end();
    this.curr_drag_handler = null;
  }
  if (this.curr_target_model) {
    this.curr_target_model.finishInteraction();
    this.current_target_model = null;
    this.canvas_model.removeDL(this);
  } else {
    for (var i=0; i<this.rows.length; i++)
      this.hideBackground(this.rows[i]);
    if (!this.options.no_handles) row.handle.selectAll('circle').attr({ fill: 'white' })
    this.draginfo = null;
    if (row.idx > 0) {
      var overlap = this.getFinalVerticalPos(row) - row.pos[1];
      var row2 = this.getVisibleAbove(row);
      if (row2 && overlap > 0 && overlap > 0.5*row2.dims.height) this.hideRow(row2);
      this.layoutRows();
    }
  }
}

DerivationList.prototype.removeRowHandle = function(row) {
  if (row.mtouch) {
    row.mtouch.connected(false);
    delete row.mtouch;
  }
  if (row.handle) {
    row.handle.remove();
    delete row.handle;
  }
}

DerivationList.prototype.createRowHandle = function(row) {
  if (this.options.no_handles) return;
  row.mtouch = row.mtouch || mtouch_events().frame(row.view.main.node());
  var self = this;
  row.mtouch.on('drag', this.dragRow.bind(this));

  row.mtouch.on('touch', function(row) {
    self.svgDims = self.getContainerDimensions();
    for (var i=0; i<self.rows.length; i++)
      self.showBackground(self.rows[i], i===row.idx);
    row.handle.selectAll('circle').attr({ fill: 'whitesmoke' });
  });

  row.mtouch.on('hold', this.toggleHover.bind(this));

  row.mtouch.on('tap', function(row) {
    if (!gmath.actions.editLineAction.match(row.model)) return;
    var action = gmath.actions.editLineAction.createBoundAction(row.model, {actor: row.model});
    row.model.performAction(action, function() {
      self.updateRowDimensionAfterInteraction(row);
    }, true);
  });

  row.mtouch.on('release', this.releaseRow.bind(this));

  var circle_pos = this.getHandlePos(row.view);

  circles = row.el.selectAll('g.handle')
    .data([row]);
  circles.enter()
    .append('g').classed('handle', true)
    .style({cursor: "pointer"})
    .call(row.mtouch)
    .attr('transform', 'translate('+circle_pos+')');
  //circles.transition().duration(0).ease('linear').attr('transform', 'translate('+circle_pos+')');
  circles.selectAll('circle')
    .data([row, row])
    .enter()
    .append('circle')
    .attr({ fill: 'white', stroke: this.handle_stroke_color, 'stroke-width': 2, r: 10})
    .attr({ 'pointer-events': 'all' })
    .attr('cx', function(d, i) { return 4*i });

  if (row===this.rows[0] && this.options.draggable) {
    circles.append('path')
     .attr("stroke", this.handle_stroke_color)
     .attr("stroke-width", 1)
     .attr("fill", "none")
     .attr("transform", "scale(2),translate(-4, -4)")
     .attr("d", "M 3 2 L 4 1 L 5 2 M 2 3 L 1 4 L 2 5 M 6 3 L 7 4 L 6 5 M 5 6 L 4 7 L 3 6 M 4 7 L 4 1 M 1 4 L 7 4");

    if (this.rows.length > 1) {
      if (this.rows[1].handle) this.rows[1].handle.select('path').remove();
    }
  }

  row.handle = circles;

  this.updateHandleType(row);
}

DerivationList.prototype.toggleHover = function(row) {
  if (this.hovering) {
    this.hovering = false;
    this.remove();
    var dlToMove = this.svgg.node();
    var backInto = this.original_container;
    delete this.original_container;
    var movedDl = backInto.node().appendChild(dlToMove);
    this.moveIntoContainer();
    this.unhoverRemove.remove();
    this.svg = backInto;

    //Position on screen should be the same, hovering or in sidebar.
    var moveDown = -1*d3.select('#wikiMainSvg').node().getBoundingClientRect().top;
    var moveOver = -1*d3.select('#wikiMainSvg').node().getBoundingClientRect().left;
    this.pos[1] += moveDown;
    this.pos[0] += moveOver;
    var moveTo = [this.pos[0],this.pos[1]];
    this.svgg.attr('transform', 'translate('+moveTo+')');
  } else {
    if(this.options.hoverable == false) return;
    this.hovering = true;
    this.remove();
    var dlToMove = this.svgg.node();
    var svg2 = d3.select('#hovering');
    var firstG = svg2.select('g');  // There should only be 1 'g' in the top level hovering svg.
    var secondG = firstG.append('g');
    this.unhoverRemove = secondG;  // The element that gets removed when it is unhovered.
    this.original_container = this.svg;
    this.svg = firstG;
    var movedDl = secondG.node()
      .appendChild(dlToMove);

    var moveDown = d3.select('#wikiMainSvg').node().getBoundingClientRect().top;
    var moveOver = d3.select('#wikiMainSvg').node().getBoundingClientRect().left;
    this.pos[1] += moveDown;
    this.pos[0] += moveOver;
    var moveTo = [this.pos[0],this.pos[1]];
    this.svgg.attr('transform', 'translate('+moveTo+')');
  }
  this.layoutRows();
}

DerivationList.prototype.updateRowBackground = function(row) {
  var l = 40 + row.dims.x - this.dims.x
    , r = 5  + this.dims.x+this.dims.width -row.dims.x-row.dims.width;
  row.view.options.padding = { left: l, right: r, top: 5, bottom: 5 };
}


DerivationList.prototype.showBackground = function(row, show_border) {
  this.updateRowBackground(row);
  row.view.options.border_color = show_border ? 'silver' : 'none';
  row.view.options.background_color = 'white';
  row.view.update_background();
}

DerivationList.prototype.hideBackground = function(row) {
  row.view.options.border_color = 'none';
  row.view.options.background_color = this.hovering ? '#eee' : 'none';
  row.view.update_background();
}

DerivationList.prototype.getHandlePos = function(view) {
  var bbox = view.getBBox({ no_padding: true });
  return [bbox.x - 20, bbox.y + bbox.height/2];
}

DerivationList.prototype.setLastHandleVisibility = function(visible) {
  this.updateHandleType(this.getLastRow(), visible);
}

/// Updates the type of handle (one or two circles). If a second parameter is
/// passed, it sets the visiblity accordingly.
DerivationList.prototype.updateHandleType = function(row, visible) {
  if (this.options.no_handles) return;
  if (!row.handle) return;
  if (arguments.length > 1 && !visible) {
    row.handle.selectAll('*').attr('visibility', 'hidden');
    return;
  }
  var hide_handles = this.options.hide_handles
  if (row.idx > 0 && this.rows[row.idx-1].hidden) {
    row.handle.selectAll('*').attr('visibility', hide_handles ? 'hidden' : 'visible');
  } else {
    row.handle.selectAll('*').attr('visibility', function(d, i) {
      return (i===1 || hide_handles) ? 'hidden' : 'visible'
    });
  }
}

DerivationList.prototype.hideRow = function(row) {
  row.hidden = true;
  row.el.attr('display', 'none');
  if (this.rows.filter(function(row) { return !row.hidden }).length === 1)
    this.singleLineMode(true);
  this.updateHandleType(this.rows[row.idx+1]);
}

DerivationList.prototype.unhideRow = function(row) {
  if (row.hidden) this.singleLineMode(false);
  row.hidden = false;
  row.el.attr('display', null);
  if (row.idx+1 < this.rows.length) this.updateHandleType(this.rows[row.idx+1]);
}

DerivationList.prototype.deactivateRow = function(row) {
  row.view.interactive(false);
  row.model.for_each(function (node) { node.dragging = false; node.selected = false; });
  row.view.update_all();
}

/// Returns true if the DL's dimensions changed.
DerivationList.prototype.updateRowDimensions = function() {
  var x1=Infinity, y1=Infinity, x2=-Infinity, y2=-Infinity;
	this.rows.forEach(function(row) {
		row.dims = row.view.getBBox({ no_padding: true });
    row.dims.y -= row.view.options.padding.top;
    row.dims.height += row.view.options.padding.top + row.view.options.padding.bottom;
    x1 = Math.min(x1, row.dims.x + row.pos[0]);
    y1 = Math.min(y1, row.dims.y + row.pos[1]);
    x2 = Math.max(x2, row.dims.x+row.dims.width + row.pos[0]);
    y2 = Math.max(y2, row.dims.y+row.dims.height + row.pos[1]);
	})
  var changed = (this.dims.x !== x1 || this.dims.y !== y1
              || this.dims.width !== x2-x1 || this.dims.height !== y2-y1);
  this.dims = {x: x1, y: y1, width: x2-x1, height: y2-y1};
  return changed;
}

DerivationList.prototype.getVerticalAdvance = function(row) {
  if (row.idx === 0) return 0;
  var v_align = this.options.v_align;
  if (v_align === 'center') {
    return this.rows[row.idx-1].dims.height/2 + row.dims.height/2;
  } else if (v_align === 'top') {
    return this.rows[row.idx-1].dims.height;
  } else if (v_align === 'bottom' || v_align === 'alphabetic') {
    return row.dims.height;
  }
}

DerivationList.prototype.resizeContainer = function() {
  if (!this.options.auto_resize_container) return;
  this.updateRowDimensions();
  this.svg.style('height', this.dims.height+this.dims.y+this.pos[1]+'px');
}

DerivationList.prototype.layoutRows = function() {
	this.updateRowDimensions();
  var pos0 = this.rows[0].pos
	  , x = pos0[0], y = pos0[1]
    , self = this;
  this.rows[0].idx = 0;
  for (var i=1; i<this.rows.length; i++) {
    var row = this.rows[i];
    row.idx = i;
    this.updateHandleType(row);
    if (!this.rows[i-1].hidden) y += this.getVerticalAdvance(row);
    if (row.dragging) continue;
    var pos = row.pos;
    if (pos[0] !== x || pos[1] !== y) {
      pos[0] = x; pos[1] = y;
      pos = pos;
      this.showBackground(row);
      row.el.transition().attr('transform', 'translate('+pos+')')
        .each('end', function(d) { self.hideBackground(d) });
    }
	}
  this.svgg.selectAll('.dl-line').sort(function(a,b) { return a.idx-b.idx });
  this.resizeContainer();
}

// Returns the dimensions of the first SVG parent.
DerivationList.prototype.getContainerDimensions = function () {
  var n = this.svg.node();
  while (n.tagName.toLowerCase() !== 'svg' && n.parentNode) n = n.parentNode;
  return n.getBoundingClientRect();
}

// Restricts a given pos to be within the bounds of bbox.
DerivationList.prototype.keepInContainer = function (pos, bbox) {
  var lims = function (min, max, n) {
    if (min > max) return min;
    return n < min ? min : n > max ? max : n
  }
  var posX = lims(-bbox.x, this.svgDims.width - (bbox.width + bbox.x), pos[0])
    , posY = lims(-bbox.y, this.svgDims.height - (bbox.height + bbox.y), pos[1]);
  return [posX, posY];
}

/// Removes the row, its graphical elements and the listeners on that row.
DerivationList.prototype.removeRow = function(row) {
  for (var i=row.idx+1; i<this.rows.length; i++) this.rows[i].idx--;
  this.rows.splice(row.idx, 1);
  this.removeRowHandle(row);
  row.el.remove();
  row.model.events.on('end-of-interaction.' + this.id, null);
  row.model.events.on('change.'+this.id, null);
  row.model.events.on('create.'+this.id, null);
}

/// Removes the last row and makes the previous row visible.
DerivationList.prototype.undo = function () {
  if (this.rows.length < 1) return;
  var last_row = this.getLastRow();
  this.removeRow(last_row);
  var row = this.getLastRow();
  if (row) {
    this.unhideRow(row);
    row.view.interactive(true);
    row.view.update_all();
  }
  return last_row; // for redo function
}

/// Adds the passed row back to the DL as new last row.
DerivationList.prototype.redo = function (row) {
  this.addRowFromModel(row.model, row.action);
}

DerivationList.prototype.getAllDLs = function () {
  if (this.coordinator) return this.coordinator.dls;
  if (this.canvas_model) return this.canvas_model.dls();
  return [this];
}

/// Draws the node mappings of the selected nodes to all previous and following
/// rows. If rows are hidden, the mappings between the visible rows are re-
/// computed. The nodes must be from a visible row.
DerivationList.prototype.draw_mappings_for_nodes = function(nodes) {
  this.hideAllNodeMappings();
  if (nodes.length === 0) return;
  var no_syms = !nodes.some(function(n) { return n.is_group('sym') });
  this.draw_forward_mappings(nodes, no_syms);
  this.draw_backward_mappings(nodes, no_syms);
  var row = this.getRowByModel(nodes[0].get_root())
  this.draw_node_backgrounds(nodes, row, true);
}


DerivationList.prototype.get_combined_action = function(row_a, row_b) {
  if (row_a.idx+1 === row_b.idx) return row_b.action;
  var actions = [];
  for (var i=row_a.idx+1; i<=row_b.idx; i++) actions.push(this.rows[i].action);
  return Action.createComposedAction(actions);
}

DerivationList.prototype.get_next_visible_row = function(row) {
  for (var i=row.idx+1; i<this.rows.length; i++) {
    if (this.rows[i].hidden) continue;
    return this.rows[i];
  }
  return null;
}

DerivationList.prototype.get_prev_visible_row = function(row) {
  for (var i=row.idx-1; i>=0; i--) {
    if (this.rows[i].hidden) continue;
    return this.rows[i];
  }
  return null;
}

DerivationList.prototype.draw_forward_mappings = function(nodes, no_syms) {
  if (nodes.length === 0) return;
  var row = this.getRowByModel(nodes[0].get_root())
    , row_n = this.get_next_visible_row(row);
  if (!row_n) return;
  var action = this.get_combined_action(row, row_n);

  var lines = [];
  nodes.forEach(function(source_node) {
    var target_nodes = action.mapNodes([source_node]);
    if (target_nodes.length === 0) lines.push({source_node: source_node});
    else target_nodes.forEach(function (target_node) {
      if (no_syms && target_node.is_group('sym')) return;
      if (target_node.has_children()) return;
      lines.push({ source_node: source_node, target_node: target_node });
    });
    source_node.was_removed = (target_nodes.length === 0);
  });

  this.draw_mapping_lines(lines, row, row_n);

  // visualize for all descendents
  var target_nodes = action.mapNodes(nodes);
  if (no_syms) target_nodes = target_nodes.filter(
    function(n) { return !n.is_group('sym') }
  );
  this.draw_forward_mappings(target_nodes, no_syms);
  this.draw_node_backgrounds(target_nodes, row_n);
}

DerivationList.prototype.draw_backward_mappings = function(nodes, no_syms) {
  if (nodes.length === 0) return;
  var row = this.getRowByModel(nodes[0].get_root())
    , row_p = this.get_prev_visible_row(row);
  if (!row_p) return;
  var action = this.get_combined_action(row_p, row);

  nodes.forEach(function(n) { n.was_created = true });

  var lines = [];
  var source_nodes = [];
  row_p.model.children[0].for_each(function(source_node) {
    if (source_node.has_children()) return;
    if (no_syms && source_node.is_group('sym')) return;
    var target_nodes = action.mapNodes([source_node]);
    var mapped = false;
    target_nodes.forEach(function(target_node) {
      if (nodes.indexOf(target_node) !== -1) {
        lines.push({ source_node: source_node, target_node: target_node });
        mapped = true;
        target_node.was_created = false;
      }
    });
    if (mapped) source_nodes.push(source_node);
  });

  this.draw_mapping_lines(lines, row_p, row);

  // visualize for all anchestors
  this.draw_backward_mappings(source_nodes, no_syms);
  this.draw_node_backgrounds(source_nodes, row_p);
}

DerivationList.prototype.draw_node_backgrounds = function(nodes, row, selected) {
  var col = selected ? this.options.mappings_active_node_color
                     : this.options.mappings_color;
  var boxColor = function() {
    //if (node.was_removed) return lightred;
    //if (node.was_created) return lightblue;
    return col;
  }
  row.view.main.selectAll('.selector')
    .attr({rx: this.options.mappings_rect_radius, ry: this.options.mappings_rect_radius})
    .style('fill', boxColor)
    .style('stroke', 'none')
    .attr('visibility', function(d) {
      return nodes.indexOf(d) === -1 ? 'hidden' : null
    });
}

DerivationList.prototype.hideAllNodeMappings = function() {
  this.rows.forEach(function(row) {
    row.view.main.selectAll('.selector').attr('visibility', 'hidden');
    row.view.main.selectAll(".mapping_line").attr('visibility', 'hidden');
  });
}

DerivationList.prototype.draw_mapping_lines = function(lines, row, row_n) {
  var dx = row_n.pos[0] - row.pos[0];
  var dy = row_n.pos[1] - row.pos[1];

  row.view.main.selectAll(".mapping_line");

  var col = this.options.mappings_color;

  var bars = row.view.main.selectAll(".mapping_line")
    .data(lines);
  bars
    .enter()
    .insert("path", ".math");
  bars
    .attr("class", "mapping_line")
    .call(this.update_organic_path.bind(this), dx, dy)
    .style('fill', col)
    .style('stroke', col)
    .attr('visibility', function(line) {
      if (!line.source_node || !line.target_node) return 'hidden';
      return (line.source_node.hidden || line.target_node.hidden) ? 'hidden' : null;
    });
  bars.exit().remove();
}

DerivationList.prototype.update_organic_path = function(sel, dx, dy) {
  function str(point) {
    return point.x.toFixed(4) + ' ' + point.y.toFixed(4) + ' ';
  }

  var rect_radius = this.options.mappings_rect_radius;
  var self = this;
  sel.attr('d', function(line) {
    if (!line.target_node || !line.source_node) return 'M 0,0';
    var sb = line.source_node.sel_box, sn = line.source_node
      , tb = line.target_node.sel_box, tn = line.target_node;
    var source_rect = { x: sb.x + sn.x, y: sb.y + sn.y
                      , width: sb.width, height: sb.height, r: rect_radius };
    var target_rect = { x: tb.x + tn.x + dx, y: tb.y + tn.y + dy
                      , width: tb.width, height: tb.height, r: rect_radius };
    var cpath1 = self.createConnectorPath(source_rect, target_rect);
    var cpath2 = self.createConnectorPath(target_rect, source_rect);

    if (!cpath1 || !cpath2) return 'M 0 0';

    //return 'M ' + str(source_rect) + ' L ' + str(target_rect);
    return 'M ' + str(cpath1.base1) +
    'C ' + str(cpath1.base1_control) + str(cpath1.joint1_control1) + str(cpath1.joint1) +
    'L' + str(cpath2.joint2) +
    'C ' + str(cpath2.joint2_control1) + str(cpath2.base2_control) + str(cpath2.base2) +
    'L ' + str(cpath2.base1) +
    'C ' + str(cpath2.base1_control) + str(cpath2.joint1_control1) + str(cpath2.joint1) +
    'L ' + str(cpath1.joint2) +
    'C ' + str(cpath1.joint2_control1) + str(cpath1.base2_control) + str(cpath1.base2) +
    'Z';
  });
}

/// Returns null if the rects are too close to each other.
DerivationList.prototype.createConnectorPath = function(rect1, rect2) {
  var adj_joint_width = Math.min(this.options.mappings_joint_width
    , rect1.width*0.9, rect2.width*0.9, rect1.height*0.9, rect2.height*0.9);
  var adj_line_thickness = Math.min(adj_joint_width/2, this.options.mappings_line_thickness);
  var joint_length = this.options.mappings_joint_length;

  var p0 = new Point(rect1.x+rect1.width/2, rect1.y+rect1.height/2)
    , p1 = new Point(rect2.x+rect2.width/2, rect2.y+rect2.height/2)
    , p0_p1 = p1.Sub(p0)
    , pts = []
    , lines = [];

  if (p0_p1.len() < Math.max(rect1.width/2+rect2.width/2, rect1.height/2+rect2.height/2) + joint_length)
    return null;

  var vp = p0_p1.get_perpendicular();
  vp.Normalize().Scale(adj_joint_width/2);
  var base1 = Point.intersect_inner_ray_with_rect(p0.add(vp), p0_p1, rect1);
  if (!base1) return null;
  pts.push(base1.point);
  var base1_control = base1.point.add(base1.tangent.scale(adj_joint_width/3));
  lines.push({from: base1.point, to: base1_control});

  var base2 = Point.intersect_inner_ray_with_rect(p0.sub(vp), p0_p1, rect1);
  if (!base2) return null;
  pts.push(base2.point);
  var base2_control = base2.point.add(base2.tangent.scale(-adj_joint_width/3));
  lines.push({from: base2.point, to: base2_control});

  vp.Normalize().Scale(adj_line_thickness/2);
  var inner_base1 = Point.intersect_inner_ray_with_rect(p0.add(vp), p0_p1, rect1);
  if (!inner_base1) return null;
  var joint1 = inner_base1.point.add(p0_p1.normalize().Scale(joint_length));
  var inner_base2 = Point.intersect_inner_ray_with_rect(p0.sub(vp), p0_p1, rect1);
  if (!inner_base2) return null;
  var joint2 = inner_base2.point.add(p0_p1.normalize().Scale(joint_length));
  pts.push(joint1, joint2);

  var joint1_control1 = joint1.sub(p0_p1.normalize().Scale(joint_length/2));
  var joint1_control2 = joint1.sub(p0_p1.normalize().Scale(-joint_length/2));
  var joint2_control1 = joint2.sub(p0_p1.normalize().Scale(joint_length/2));
  var joint2_control2 = joint2.sub(p0_p1.normalize().Scale(-joint_length/2));
  lines.push({from: joint1, to: joint1_control1}
            ,{from: joint1, to: joint1_control2}
            ,{from: joint2, to: joint2_control1}
            ,{from: joint2, to: joint2_control2});

  return { pts: pts, lines: lines, base1: base1.point, base2: base2.point
         , joint1: joint1, joint2: joint2, joint1_control1: joint1_control1
         , joint1_control2: joint1_control2, joint2_control1: joint2_control1
         , joint2_control2: joint2_control2, base1_control: base1_control
         , base2_control: base2_control };
}
DerivationList.prototype.getDragHandler = function(view) {
  return view.interaction_handler.getHandlerByClass(DragHandler);
}

/// This is called by the dragging handler.
DerivationList.prototype.handleFactoringGesture = function(row, dx, dy) {
  if (row.idx !== this.rows.length-1) return;
  if (!this.curr_drag_handler) this.curr_drag_handler = this.getDragHandler(row.view);
  var drag_handler = this.curr_drag_handler;
  if (!row.abs_pos) {
    row.abs_pos = { x: row.pos[0] + this.pos[0]
                  , y: row.pos[1] + this.pos[1]};
    var factoringActions = this.getFactoringActions(row.model.children[0]);
    if (factoringActions.length > 0) {
      drag_handler.start(row.abs_pos, row.model.children,
                         { reselect_nodes: false
                         , actions: factoringActions
                         , move_nodes: false });
    }
  }
  row.abs_pos.x += dx;
  row.abs_pos.y += dy;
  if (drag_handler.isActive()) drag_handler.update({dx: dx, dy: dy});
  this.pos[0] += dx; this.pos[1] += dy;
  if (!this.hovering) this.pos = this.keepInContainer(this.pos, row.view.getBBox());
  this.svgg.attr('transform', 'translate('+this.pos+')');
}

DerivationList.prototype.getFactoringActions = function(factor) {
  var filterBracketedSum = function(node) {
    return node.is_group('sum') && node.parent.is_group('brackets') && !node.fixed;
  };
  var target_infos = [], self = this;
  //This seems to be broken before I modified it, so modifications are untested.  -Thad
  this.getAllDLs().forEach(function(dl) {
    if (dl === self) return;
    var row = dl.getLastRow();
    target_infos.push({sums: row.model.filter(filterBracketedSum)
             ,row: row
             ,dl: dl});
  });
  // TODO: create a FactoringAction for each sum that is appropriate
  var actions = [];
  for (var i=0; i<target_infos.length; i++) {
    var tinfo = target_infos[i];
    for (var j=0; j<tinfo.sums.length; j++) {
      var sum = tinfo.sums[j];
      if (TriggerFactoringAction.match(sum, factor)) {
        var action = TriggerFactoringAction.createBoundAction(
          tinfo.row.model, { dl: tinfo.dl
                           , view: tinfo.row.view
                           , sum: sum
                           , callback: this.factoringWasTriggered.bind(this)
                           });
        var containerOffset;
        if(tinfo.dl.coordinator && this.coordinator) {
          containerOffset = this.coordinator.getOffset(this,tinfo.dl);
        }else{
          containerOffset = [0,0];
        }
        action.offset = { x: tinfo.dl.pos[0] + tinfo.row.pos[0] - this.pos[0] - this.getLastRow().pos[0] + containerOffset[0]
                        , y: tinfo.dl.pos[1] + tinfo.row.pos[1] - this.pos[1] - this.getLastRow().pos[1] + containerOffset[1]};
        actions.push(action);
      }
    }
  }
  return actions;
}

DerivationList.prototype.factoringWasTriggered = function(viewOfSum, sum, dl) {
  var drag_handler = this.getDragHandler(viewOfSum);
  var nodes = selectFactorsInSum(sum, this.getLastModel().children[0]);
  drag_handler.start(calcAbsoluteBBoxLocation(dl), nodes
                    , { reselect_nodes: false });
  this.curr_drag_handler = drag_handler;
  this.curr_target_model = dl.getLastModel();
  this.svgg.attr('display', 'none');
}

var selectFactorsInSum = function(sum, factors) {
  var matchingNodes;
  matchingNodes = collectMatchingNodesInSum(sum, factors);
  matchingNodes = filterByStructure(matchingNodes, sum);
  var selectedNodes = [];
  for (var i=0; i<matchingNodes.length; i++) {
    if (matchingNodes[i].length===0) return false;
  }
  for (var i=0; i<matchingNodes.length; i++) {
    if (matchingNodes[i])
      selectedNodes.push(matchingNodes[i][matchingNodes[i].length-1]);
  }
  for (var i=0; i<selectedNodes.length; i++) {
    if (!Array.isArray(selectedNodes[i]) && selectedNodes[i].parent.value !== 'add' && selectedNodes[i].parent.value !== 'sub')
      selectedNodes[i] = selectedNodes[i].parent;
  }
  if (selectedNodes.length!==sum.children.length) return false;
  var flattenedSelectedNodes = [];
  for (var i=0; i<selectedNodes.length; i++) {
    if (Array.isArray(selectedNodes[i])) {
      for (var j=0; j<selectedNodes[i].length; j++) {
        flattenedSelectedNodes.push(selectedNodes[i][j]);
      }
    } else {
      flattenedSelectedNodes.push(selectedNodes[i]);
    }
  }

  return flattenedSelectedNodes;
}

var selectAllRangesWithMatchingValue = function(term, val) {
  var res = [];
  term.for_each(function(n) {
    var nval = n.to_ascii();
    if (nval.slice(0,1) === '*') nval = nval.substr(1);
    if (!n.hidden && nval === val) res.push(n);
    else {
      var ns = [n];
      while (nval.length < val.length && n.commutative && n.rs) {
        n = n.rs;
        nval += n.to_ascii();
        ns.push(n);
      }
      if (nval === val) res.push(ns);
    }
  });
  return res;
}

var collectMatchingNodesInSum = function(sum, factors) {
  var sumFactors = [];
  for (var i=0; i<sum.children.length; i++) {
    var addend = sum.children[i], term = addend.children[1];
    //sumFactors.push(term.filter(select_by_value(factors.to_ascii())));
    sumFactors.push(selectAllRangesWithMatchingValue(term, factors.to_ascii()));
  }
  return sumFactors;
}

function select_by_value(val) {
  return function(n) { return !n.hidden && n.to_ascii() === val }
}

var filterByStructure = function(factorCollection, sum) {
  var isSingleTermInAddend = function(node) {
    return (node.parent && (node.parent.value==='add' || node.parent.value==='sub')
              && node.parent.parent && node.parent.parent==sum);
  }
  var isSingleTermFromProduct = function(node) {
    return (node.parent && node.parent.value==='mul'
              && node.parent.parent && node.parent.parent.is_group('product')
              && node.parent.parent.parent && node.parent.parent.parent.parent && node.parent.parent.parent.parent==sum);
  }
  var isOneTermOfManyFromProduct = function(node) {
    return (node.value==='mul'
              && node.parent && node.parent.is_group('product')
              && node.parent.parent && node.parent.parent.parent && node.parent.parent.parent==sum);
  }
  var isChildOfAddendOrProduct = function(node) {
    var boolForLs = true;
    if (Array.isArray(node)) {
      for (var i=0; i<node.length; i++)
        if (!isOneTermOfManyFromProduct(node[i]))
          boolForLs = false;
    } else {
      return isSingleTermInAddend(node) || isSingleTermFromProduct(node);
    }
    return boolForLs;
  }

  for (var i=0; i<factorCollection.length; i++) {
    factorCollection[i] = factorCollection[i].filter(isChildOfAddendOrProduct);
  }
  return factorCollection;
}

var calcAbsoluteBBoxLocation = function(dl) {
  var activeRow = dl.getLastRow()
     ,activeView = dl.getLastView()
     ,activeBBox = activeView.getBBox();
  var dlPos = dl.pos
     ,activeRowRelPos = activeRow.pos
     ,activeBBoxRelPos = [activeBBox.x, activeBBox.y];

  var activeBBoxPos = [dlPos[0]+activeRowRelPos[0]+activeBBoxRelPos[0]
                      ,dlPos[1]+activeRowRelPos[1]+activeBBoxRelPos[1]];
  return activeBBoxPos;
}
/// Copyright by Erik Weitnauer, 2012.
/// Code for setting style and position of nodes. Used when displaying later.

/// h_align can take one of the values 'left', 'center', 'right'.
/// v_align can take one of the values 'top', 'center', 'alphabetic', 'bottom'
var NodeRenderer = function(view, h_align, v_align) {
  this.view	 = view;
  this.h_align = h_align || 'center';
  this.v_align = v_align || 'alphabetic';
}

/** Sets size and color attribute of the passed nodes and their children.
 - color: as parent but selection-color if n.selected
 - size: as parent but 85% of parent if in division */
NodeRenderer.prototype.set_style = function(nodes) {
  var set = function(n, size, color) {
    n.size = size;
    if (n.bigger) n.size *= 1.5;
    if (n.smaller) n.size *= 0.67;
    n.color = n.selected ? this.view.options.selection_color : color;
    if (n.has_children()) for (var i=0; i<n.children.length; i++) {
      if (n.is_group("fraction")) set.call(this, n.children[i], n.size*this.view.options.fraction_size_factor, n.color);
      else if (n.is_group("power") && i===1) set.call(this, n.children[i], n.size*this.view.options.exp_size_factor, n.color);
      else if ((n instanceof Var) && n.has_children() && i===1) set.call(this, n.children[i], n.size*this.view.options.subscript_size_factor, n.color);
      else set.call(this, n.children[i], n.size, n.color);
    }
  }
  for (var i=0; i<nodes.length; i++) {
    var n = nodes[i];
    var size = (AlgebraModel.is_top_most(n) || !n.size) ? this.view.options.font_size : n.size;
    var color = n.parent.color || (this.view.interactive()
                                  ? this.view.options.color
                                  : this.view.options.inactive_color);
    set.call(this, n, size, color);
  }
}


/** Steps to set the target positions of the passed nodes and their children:
  1. Optional: Calculate width of leaf-elements based on their size attribute, their value and
     their 'hidden' property (use if either may have changed)
  2. Optional: Calculate height of leaf-elements based on their size attribute and 'hidden' property
     (use if either may have changed)
  3. Set positions relative to parent (buttom-up).
  4. Set absolute positions (top-down).

It will use the h_align and v_align properties of the NodeRenderer to determine
how to align nodes relative to their parent node.
*/
NodeRenderer.prototype.set_position = function(nodes, update_dims) {
  var baseline_shift = this.view.options.font_baseline_shift
     ,ascent = this.view.options.font_ascent
     ,descent = this.view.options.font_descent

  var position_horizontally = function(ns) {
    var width = 0, ascent = 0, descent = 0, sel_width = 0, height = 0;
    for (var i=0; i<ns.length; i++) {
      var child = ns[i];
      width += (child.hidden || child.hide_after_drop) ? 0 : child.width;
      sel_width += (child.hidden) ? 0 : child.width;
      ascent = Math.max(ascent, child.hidden ? 0 : child.ascent-child.rel_y);
      descent = Math.max(descent, child.hidden ? 0 : child.descent+child.rel_y);
    }
    height = ascent + descent;

    // align children
    var x = -width;
    for (var i=0; i<ns.length; i++) {
      var child = ns[i];
      child.rel_x += x + child.width;
      // place the hidden node at the same place it would be was it not hidden
      // some hidden nodes should be shown during dragging, but hidden after it's
      // finished. These still have a width of 0, so the positioning of the
      // expression during dragging is as it will be after the drop, but the
      // visualization and the selection box around the nodes is as if the node
      // was not hidden and had it's normal width
      if (child.hidden || child.hide_after_drop) child.rel_x -= child.width;
      x += (child.hidden || child.hide_after_drop) ? 0 : child.width;
    }

    return {width: width, height: height, ascent: ascent, descent: descent
           // ,sel_box: {x: -sel_width, width: sel_width, y: -ascent, height: height}};
           ,sel_box: {x: -width, width: width, y: -ascent, height: height}};
  }

  // Relative positioning of children. We base the positioning on horizontal right-to-left alignment,
  // because this handles hiding and showing of leading operators during dragging nicely out of the
  // box.
  var rel_pos = function(n) {
    if (!n.has_children()) {
      // this node is a leaf
      n.baseline_shift = baseline_shift*n.size;
      if (update_dims) {
        n.width = this.view.fontloader.width(n.to_string(), n.size, this.view.get_font(n));
        n.ascent = ascent*n.size; // height above y=0
        n.descent = descent*n.size; // height below y=0
        n.height = n.ascent+n.descent; // total height
        n.sel_box = {x: 0, width: n.width
                    ,y: -n.ascent, height: n.height}
      }
      n.rel_x = -n.width;
      n.rel_y = 0;
      return;
    }
    // this node is a parent group
    // reset rel_x and rel_y only if it is not one of the passed (top-most) nodes
    if (nodes.indexOf(n) != -1 && !AlgebraModel.is_top_most(n)) { n.rel_x = n.rel_x || 0; n.rel_y = n.rel_y || 0; }
    else { n.rel_x = 0; n.rel_y = 0; }
    // first process its children
    for (var i=0; i<n.children.length; i++) rel_pos.call(this, n.children[i]);
    // now process node itself
    if (n.is_group('fraction')) {
      // we will horizontally align all mul elements and then
      // put all div elements below them

      // sort mul and div blocks
      var up = [], down = [], bar = null;
      var c = n.children[0];
      while (c) {
        if (c.value == 'mul') up.push(c);
        else if (c.value == 'div') down.push(c);
        else bar = c;
        c = c.rs
      }
      var up_dims = position_horizontally(up);
      var down_dims = position_horizontally(down);

      var dy = -baseline_shift*n.size;

      bar.height = n.size * this.view.options.div_bar_height;
      bar.width = Math.max(up_dims.width, down_dims.width);
      bar.ascent = bar.height/2;
      bar.descent = bar.height/2;
      bar.rel_y = dy//0;
      bar.rel_x =  0.1*n.size;
      bar.sel_box = {x: -0.1*n.size, width: bar.width+0.2*n.size
                    ,y: -(ascent+descent)*n.size/4, height: (ascent+descent)*n.size/2};

      n.width = bar.width + 0.2*n.size;
      n.ascent = up_dims.height + bar.height/2 - dy;
      n.descent = down_dims.height + bar.height/2 + dy;
      n.height = n.ascent + n.descent;
      n.rel_y = 0;
      n.rel_x = -n.width;
      n.sel_box = {x: 0, width: n.width, y: -n.ascent, height: n.height};

      for (var i=0; i<up.length; i++) {
        up[i].rel_y += -up_dims.descent - bar.height/2 + dy;
        up[i].rel_x += 0.5*(n.width+up_dims.width);
      }

      for (var i=0; i<down.length; i++) {
        down[i].rel_y += down_dims.ascent + bar.height/2 + dy;
        down[i].rel_x += 0.5*(n.width+down_dims.width);
      }
    }
    else { // horizontal alignment
      if (n.is_group('power')) {
        var base = n.children[0], exp = n.children[1];
        exp.rel_y -= base.ascent*0.7;
      }
      if ((n instanceof Var) && n.has_children()) {
        var base = n.children[0], sub = n.children[1];
        sub.rel_y += base.descent*0.7;
      }
      gmath.extend(n, position_horizontally(n.children));
    }
  }

  for (var i=0; i<nodes.length; i++) rel_pos.call(this, nodes[i]);

  // Absolute positioning
  var abs_pos = function(n, x, y, x0, y0) {
    if (n.dragging) {
      n.x0 = n.rel_x+x;
      n.y0 = n.rel_y+y;
      if (n.update_x_during_dragging) {
        n.x = n.x0;
        n.update_x_during_dragging = false;
      }
      if (n.update_y_during_dragging) {
        n.y = n.y0;
        n.update_y_during_dragging = false;
      }
    } else {
      n.x = n.rel_x+x;
      n.y = n.rel_y+y;
      n.x0 = n.rel_x+x0;
      n.y0 = n.rel_y+y0;
    }
    if (n.has_children()) for (var i=0; i<n.children.length; i++) {
      abs_pos.call(this, n.children[i], n.x, n.y, n.x0, n.y0);
    }
  }
  for (var i=0; i<nodes.length; i++) {
    var n = nodes[i];
    if (AlgebraModel.is_top_most(n)) {
      var x, y;
      switch(this.v_align) {
        case 'alphabetic': y = 0; break
        case 'top': y = n.ascent - n.rel_y; break
        case 'center': y = -n.descent + n.height/2; break
        case 'bottom': y = -n.descent - n.rel_y; break
      }
      switch(this.h_align) {
        case 'left': x = n.width; break
        case 'center': x = n.width/2; break
        case 'equals':
          x = n.width/2;
          if (n.is_group('equals')) {
            var eql = n.children[1];
            var pos = eql.rel_x + eql.sel_box.x + eql.sel_box.width;
            x = -pos;
          }
          break;
        case 'right': x = 0; break
      }
      abs_pos.call(this, n, x, y, x, y);
    } else {
      abs_pos.call(this, n, n.parent.x || 0, n.parent.y || 0
                          , n.parent.x0 || 0, n.parent.y0 || 0);
    }
  }
}
CreationBox = function(container, pos, canvas_controller) {
	this.container = d3.select(container);
  this.pos0 = pos.slice();
  this.bbox = {x: pos[0], y: pos[1], width: 20, height: 30};
	this.main_el = this.createVisualElement();
	this.setupListeners(this.main_el);
	this.shadow_el = this.createVisualElement().style('visibility', 'hidden');
	this.canvas_controller = canvas_controller;
  this.canvas_model = canvas_controller.model();

  this.actions = [];
}

CreateDLAction = function(pos_fn, canvas_controller) {
	this.cc = canvas_controller;
  this.size = this.cc.model().size();
  this.pos_fn = pos_fn;
  this.priority = -1;
  this.target = { x: 0, y: 0
                , sel_box: { x: 20, y: 30
                           , width: this.size.width-40, height: this.size.height-60 }
                };
};

CreateDLAction.prototype.match = function() {
  return (typeof(Keyboard) !== 'undefined' && Keyboard !== null);
}

CreateDLAction.prototype.doInPlace = function(callback) {
  this.cc.inputDL(this.pos_fn());
  if (typeof(callback) === 'function') callback(this);
  else return true;
}

CreationBox.prototype.getTargetPos = function() {
  return [this.bbox.x + this.bbox.width/2, this.bbox.y + this.bbox.height/2];
}

CreationBox.prototype.getAvailableActions = function() {
  var actions = [];
  actions.push(new CreateDLAction(this.getTargetPos.bind(this), this.canvas_controller));

  var dls = this.canvas_model.dls();
  for (var i=0; i<dls.length; i++) {
    var dl = dls[i], row = dl.getLastRow();
    var nodes = row.model.children;
    var as = gmath.actions.FractionExtendAction.getAllAvailableActions(nodes)
      .concat(gmath.actions.EquationFountain.getAllAvailableActions(nodes));
    for (var j=0; j<as.length; j++) as[j].offset = { x: dl.pos[0]+row.pos[0]
                                                   , y: dl.pos[1]+row.pos[1]};
    actions = actions.concat(as);

  }
  HitTester.setTargetRegions(actions);
  return actions;
}

CreationBox.prototype.onDragStart = function() {
	this.actions = this.getAvailableActions();
  HitTester.draw(this.container, this.actions, this.bbox);
	this.shadow_el.style('visibility', null);
}

CreationBox.prototype.onDrag = function() {
  this.shadow_el.attr({x: d3.event.pos[0], y: d3.event.pos[1]});
  this.bbox.x = d3.event.pos[0]; this.bbox.y = d3.event.pos[1];
  HitTester.draw(this.container, this.actions, this.bbox);
  this.current_hit = HitTester.getBestHit(this.actions, this.bbox);
}

CreationBox.prototype.onDragEnd = function() {
  this.shadow_el.attr({x: this.pos0[0], y: this.pos0[1]});
  this.shadow_el.style('visibility', 'hidden');
  HitTester.draw(this.container);
  if (this.current_hit) {
    if (this.current_hit instanceof CreateDLAction) this.current_hit.doInPlace();
    else {
      var amodel = this.current_hit.target.get_root();
      amodel.performAction(this.current_hit);
    }
  }
  this.bbox.x = this.pos0[0]; this.bbox.y = this.pos0[1];
}

CreationBox.prototype.createVisualElement = function() {
	var box = this.container.append('rect')
	  .datum(this)
	  .attr(this.bbox)
	  .style({ fill: 'white'
	  	     , 'fill-opacity': 0.67
	  	     , stroke: 'green'
	  	     , 'stroke-dasharray': '4,2'
	  	     , cursor: 'pointer'});
	return box;
}

CreationBox.prototype.setupListeners = function(box) {
  var dragb = drag_behavior()
       .on('drag-start', this.onDragStart.bind(this))
       .on('drag', this.onDrag.bind(this))
       .on('drag-end', this.onDragEnd.bind(this));
	var mtouch = mtouch_events()
	  .origin(function(d) { return [d.bbox.x, d.bbox.y] })
    .on('tap', log)
	  .call(dragb);

  box.call(mtouch);
}

function log() { console.log(d3.event) }
gmath.ui = gmath.ui || {};
gmath.ui.Graph = (function() {
Graph = function() {
	var container = null
	  , g = null
	  , inner_g = null
	  , pos = { x: 0, y:0 }
	  , size = { width: 200, height: 200 }
	  , x = d3.scale.linear().domain([-5, 5])
	  , y = d3.scale.linear().domain([-5, 5])
	  , xAxis, xAxisEl
	  , yAxis, yAxisEl
	  , lines = [] // array of Line elements
	  , colors = d3.scale.category10()
	  , show_border = false
	  , border_el = null
	  , max_drag_dist = 20
	  , drag_info = null; // { control: 'intercept', line: line }

	var graph = function (_container) {
    container = d3.select(_container);
    init();
    return graph;
	};

	graph.pos = function(arg) {
		if (arguments.length === 0) return pos;
		pos.x = arg[0]; pos.y = arg[1];
		if (g) g.attr('transform', 'translate(' + pos.x + ',' + pos.y + ')');
		return this;
	}

	graph.size = function(arg) {
		if (arguments.length === 0) return size;
		size.width = arg[0]; size.height = arg[1];
		x.range([-size.width/2, size.width/2]);
		y.range([size.height/2, -size.height/2]);
		this.updateAxes();
	  this.updateLines();
		return this;
	}

	graph.show_border = function(arg) {
		if (arguments.length === 0) return show_border;
		show_border = arg;
		if (g) border_el.style('visibility', show_border ? 'visible' : 'hidden');
		return this;
	}

	graph.xscale = function() {
    return x;
	}

	graph.yscale = function() {
    return y;
	}

	var init = function() {
		g = container.append('g')
		  .classed('graph', true)
		  .attr('transform', 'translate(' + pos.x + ',' + pos.y + ')');
		inner_g = g.append('g');

		border_el = g.append('rect')
			.classed('border', true)
		  .style('visibility', show_border ? 'visible' : 'hidden')
		  .style('pointer-events', 'all');
		var mtouch = mtouch_events()
      .frame(g.node())
      .on('touch', touch)
      .on('drag', drag)
      .on('release', release);
    border_el.call(mtouch);

    y.range([size.height/2, -size.height/2]);
    x.range([-size.width/2, size.width/2]);
    xAxis = d3.svg.axis()
      .scale(x)
      .tickValues([-4, -3, -2, -1, 1, 2, 3, 4])
      .tickSize(0, 0);

    xAxisEl = inner_g.append("g").attr("class", "x axis").call(xAxis)

    yAxis = d3.svg.axis()
      .scale(y)
      .tickValues([-4, -3, -2, -1, 1, 2, 3, 4])
      .tickSize(0, 0)
      .orient("left");

    yAxisEl = inner_g.append("g").attr("class", "y axis").call(yAxis);

		graph.updateAxes();
		graph.updateLines();
	}

	graph.createLine = function(options) {
		options.graph = graph;
		options.color = colors(lines.length);
		var line = new gmath.ui.Line(inner_g.node(), options);
		lines.push(line);
		return line;
	}

	var touch = function () {
    var fx = d3.event.finger.pos[0]
      , fy = d3.event.finger.pos[1]
      , closest = max_drag_dist

    lines.forEach(function (line) {
      var dist = line.dist_to_point(fx, fy, x, y); // WRONG
      if (dist < closest) {
        closest = dist;
        if (len(fx-x(0), fy-y(line.intercept)) < max_drag_dist)
          drag_info = { line: line, control: 'intercept' }
        else drag_info = { line: line, control: 'slope' }
      }
    });
  };

  var drag = function () {
    if (!drag_info) return;
    var fx = x.invert(d3.event.finger.pos[0])
      , fy = y.invert(d3.event.finger.pos[1])
    if (drag_info.control === 'intercept') drag_info.line.setIntercept(fy);
    if (drag_info.control === 'slope' && fx !== 0) {
    	drag_info.line.setSlope((fy-drag_info.line.intercept)/fx);
    }
  };

  var release = function () {
    drag_info = null;
  };

  var len = function(x, y) {
  	return Math.sqrt(x*x + y*y);
  }

	graph.updateAxes = function() {
		if (!g) return;
		var xrange = x.range(), yrange = y.range();
		border_el.attr({x: xrange[0], y: Math.min(yrange[0], yrange[1])})
		  .attr('width', xrange[1]-xrange[0])
		  .attr('height', Math.abs(yrange[1]-yrange[0]));
		return this;
	}

	graph.updateLines = function() {
		lines.forEach(function(line) { line.update() });
	}

	return graph;
}
return Graph;
})();
// Copyright Erik Weitnauer, 2015.

gmath.ui = gmath.ui || {};
gmath.ui.Line = (function() {
var Line = function(container, options) {
  this.events = d3.dispatch('slope', 'intercept');
  this.container = d3.select(container);
  this.graph = options.graph;
  this.element = null;
  options = options || {};
  this.id = gmath.uid();
  this.slope = options.slope || 0;
  this.intercept = options.intercept || 0;
  this.slope0 = this.slope; // for animation
  this.intercept0 = this.intercept; // for animation
  this.color = options.color || 'steelblue';
  this.width = options.width || 1;

  this.init();
}

Line.prototype.init = function() {
  this.element = this.container.append('line')
    .attr('id', this.id)
    .style('fill', 'none')
    .style('stroke-linecap', 'round')
    .classed('line', true)
    .style('stroke', this.color);
  return this.update();
}

Line.prototype.setSlope = function(slope, anim) {
  if (this.slope === slope) return;
  this.slope = slope;
  this.update(anim);
  this.events.slope(slope);
  return this;
}

Line.prototype.setIntercept = function(intercept, anim) {
  if (this.intercept === intercept) return;
  this.intercept = intercept;
  this.update(anim);
  this.events.intercept(intercept);
  return this;
}

Line.prototype.dist_to_point = function(x, y, xscale, yscale) {
  if (xscale) {
    return line_point_dist(xscale(0), yscale(this.intercept)
      , xscale(1), yscale(this.slope), x, y);
  }
  else return line_point_dist(0, this.intercept, 1, this.slope, x, y);
}

Line.prototype.update = function(animate) {
  if (animate) this.element.transition().tween("line", this.tween.bind(this));
  else this.element.transition().duration(0).tween("line", this.tween.bind(this));
  return this;
}

Line.prototype.tween = function() {
  var line_el = this.element,
    m0 = this.slope0
  , b0 = this.intercept0
  , m1 = this.slope
  , b1 = this.intercept
  , x = this.graph.xscale()
  , y = this.graph.yscale()
  , x0 = x.domain()[0]
  , x1 = x.domain()[1]
  , y0 = y.domain()[0]
  , y1 = y.domain()[1]
  , line = this;

  return function(t) {
    var m = m0+t*(m1-m0)
      , b = b0+t*(b1-b0);
    var pts = intersect_line_with_rect(0, b, 1, m, x0, x1, y0, y1);
    if (pts.length < 2) line_el.attr({ x1: 0, x2: 0, y1: 0, y2: 0 });
    else line_el.attr({ x1: x(pts[0].x), y1: y(pts[0].y)
                      , x2: x(pts[1].x), y2: y(pts[1].y)});
    line.slope0 = m;
    line.intercept0 = b;
  };
}

return Line;
})();

function intersect_line_with_rect(x, y, vx, vy, left, right, top, bottom) {
  var p = [-vx, vx, -vy, vy];
  var q = [x - left, right - x, y - top, bottom - y];
  var u1 = -Infinity;
  var u2 = Infinity;

  for (var i=0; i<4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return [];
    }
    else {
      var t = q[i] / p[i];
      if (p[i] < 0 && u1 < t) u1 = t;
      else if (p[i] > 0 && u2 > t) u2 = t;
    }
  }

  if (u1 > u2) return [];

  var res = [];
  res.push({x: x + u1*vx, y: y + u1*vy});
  res.push({x: x + u2*vx, y: y + u2*vy});

  return res;
}

function line_point_dist(lx, ly, vx, vy, px, py) {
  return Math.abs(vy * (px-lx) - vx * (py-ly)) / Math.sqrt(vy * vy + vx * vx);
}
// Copyright Erik Weitnauer, 2014.

gmath.ui = gmath.ui || {};
gmath.ui.Path = (function() {
var Path = function(container, options) {
	this.container = d3.select(container);
	this.element = null;
	options = options || {};
	this.id = gmath.uid();
	this.points = options.points || [];
	this.color = options.color || 'black';
	this.width = options.width || 1;
	this.type = options.type;

	this.init();
}

Path.line = typeof(d3) === 'undefined' ? null : d3.svg.line();

Path.prototype.init = function() {
	this.element = this.container.append('path')
 		.attr('id', this.id)
 		.style('fill', 'none')
	  .style('stroke-linecap', 'round')
 		.style('stroke-linejoin', 'round');
  return this.update();
}

Path.prototype.update = function() {
 	this.element
 	  .attr('d', Path.line(this.points) + (this.points.length === 1 ? 'Z' : ''))
 		.style('stroke', this.color)
    .style('stroke-width', this.width);
  return this;
}

Path.prototype.remove = function() {
	this.element.remove();
	return this;
}

Path.prototype.setContainer = function(new_container) {
	if (arguments.length === 0) return this.container;
	this.container = new_container;
	return this;
}

Path.prototype.renderOnto = function(container) {
	var old_el = this.element
	  , old_container = this.container;
	this.container = container;
	this.element = container.select('#'+this.id);
	if (this.element.empty()) this.init();
	else this.update();
	this.container = old_container;
	this.element = old_el;
}

return Path;
})();/*
*  Filename: erase.js
*  An eraser function designed for use with Standard Vector Graphics.
*  Author: David Brokaw, with Erik Weitnauer and David Landy
*  Created: Spring 2014
*  Last Modified On: 2014/05/19
*  Last Modified By: David Brokaw
*/

/**
  The function gets an array of paths and an erasePath. It returns a new
  array of paths that are the result of removing everything in the eraser path
  from the paths.

  Each individual path is represented as an array of points, with each point being
  an [x, y] array. `[[0,0], [100,100]]` is an example of a path consisting of a single
  line segment from the origin to (100,100). `[20,10]` would also be a valid path,
  consisting of a single point at the position (20,10).

  The eraseRadius is the radius of the imagined circular eraser moved over the canvas.
  It's the same as half of the stroke width. We will assume for now that the stroke width
  / radius of the actual paths that are to be erased is zero.
*/

gm_erase_paths = (function () {

function erase(paths, erasePath, eraseRadius) {

  //var date = new Date();
  //var time1 = date.getMilliseconds();
  eraseRadius = eraseRadius || 20;

  /*
  * To get test case: uncomment this block and the block immediately before the return statement.
  *
  console.log( "erase radius: " + eraseRadius );
  console.log( "erase path:" );
  logPath( erasePath, 1 );
  console.log( "paths:" );
  logPaths( paths );
  */

  var newPaths = [];

  // pointErase is for use when erasePath is of length 1.  In this case the erasing element is a circle, not a capsule.
  var pointErase = function(path) {
    var eX = erasePath[0][0];
    var eY = erasePath[0][1];

    var i = 0;
    var last = 0;

    // handle point path
    if (path.length===1) {
      if (!withinCircle(path[0][0], path[0][1], eX, eY, eraseRadius)) {
        newPaths.push(path);
        return;
      }
    }

    var newPath;
    while (i < (path.length - 1)) {
      var p0 = path[i];
      var p1 = path[i+1];
      var p0_withinCircle = withinCircle(p0[0], p0[1], eX, eY, eraseRadius);
      var p1_withinCircle = withinCircle(p1[0], p1[1], eX, eY, eraseRadius);

      // if both points are in the erase area, the first point does not contribute to a new path and can be ignored
      if (p0_withinCircle && p1_withinCircle) {
        i++;
        last = i;
      }

      // If p0 is in the erase area and p1 is not, the first point can be replaced by the point of intersection
      //   between the segment p0->p1 and the border of the erase area. Erasing can continue from there as if the intersection
      //   was the first point in the path.
      else if (p0_withinCircle && !p1_withinCircle) {
        var x = getCircleIntersection(p0[0], p0[1], p1[0], p1[1], eX, eY, eraseRadius);
        if (x) {
          path[i] = x;
          last = i;
        }
        else {
          i++;
        }
      }

      // If p0 is outside the erase area, and p1 is inside, then all points before and including p0 and the point of intersection
      //   contribute to a new path.  Processing then continues at p1.
      else if (!p0_withinCircle && p1_withinCircle) {
        var x = getCircleIntersection(p1[0], p1[1], p0[0], p0[1], eX, eY, eraseRadius);
        if (x) {
          newPath = path.slice(last, i+1);
          newPath.push(x);
          newPaths.push(newPath);
        }
        i++;
        last = i;
      }
      else {
        // Neither p0 or p1 is in the erase area, so there may or may not be a pair of intersections.
        var possIntersects = getCircleIntersections(p0[0], p0[1], p1[0], p1[1], eX, eY, eraseRadius);
        if (possIntersects) {
          // create a new path that goes from the beginning of our current path
          // to the intersection point
          newPath = path.slice(last, i+1);

          // only add the intersection point if it is not identical to the last
          // point in the path
          if (newPath[newPath.length-1][0] !== possIntersects[0][0] ||
              newPath[newPath.length-1][1] !== possIntersects[0][1]) {
            newPath.push(possIntersects[0]);
          }

          // we only want paths with length > 1
          if (newPath.length > 1) newPaths.push(newPath);

          // we will put the second intersection point into the current position
          // of our path, but only if it is not identical to the next point in
          // the path (we don't need duplicate points)
          path[i] = possIntersects[1];
          if (path[i+1] && path[i+1][0] == possIntersects[1][0]
                        && path[i+1][1] == possIntersects[1][1]) i++;
          last = i;
        }
        else {
          i++;
        }
      }
    }
    // the remaining points are assembled into a new path
    if (last !== i) {
      newPath = path.slice(last, path.length);
      if (newPath) {
        newPaths.push(newPath);
      }
    }
  } // end pointErase

  // If the erasePath has a length greater than one, then each successive pair of coordinate pairs can be used to form a capsule-
  //   shape along with the eraseRadius.  Each capsule in the erasePath can act independently of each other.
  var capsuleErase = function(path, i) {

		// Add or remove this code to take the width of a path into account.
		if (path.path) {
			eraseRadius = eraseRadius + (path.width / 2);
			var path = path.path;
		}

		var e0 = erasePath[i];
    var e1 = erasePath[i+1];

    var i = 0;
    var last = 0;

    // handle point path
    if (path.length === 1) {
      var p0_locationIndex = withinCapsule(path[0][0], path[0][1], e0[0], e0[1], e1[0], e1[1], eraseRadius);
      if (p0_locationIndex.indexOf(1) === -1) {
        newPaths.push(path);
        return;
      }
    }
    var newPath;
    while (i < (path.length - 1)) {
      var p0 = path[i];
      var p1 = path[i+1];
      var p0_locationIndex = withinCapsule(p0[0], p0[1], e0[0], e0[1], e1[0], e1[1], eraseRadius);
      var p1_locationIndex = withinCapsule(p1[0], p1[1], e0[0], e0[1], e1[0], e1[1], eraseRadius);

      // if both points are in the erase area, the first point does not contribute to a new path and can be ignored
      if (p0_locationIndex.indexOf(1) !== -1 && p1_locationIndex.indexOf(1) !== -1) {
        i++;
        last = i;
      }

      // If p0 is in the erase area and p1 is not, the first point can be replaced by the point of intersection
      //   between the segment p0->p1 and the border of the erase area. Erasing can continue from there as if the intersection
      //   was the first point in the path.
      else if (p0_locationIndex.indexOf(1) !== -1 && p1_locationIndex.indexOf(1) === -1) {
        var x = getCapsuleIntersection(p0[0], p0[1], p0_locationIndex, p1[0], p1[1], e0[0], e0[1], e1[0], e1[1], eraseRadius);
        if (x) {
          path[i] = x;
          last = i;
        }
        else {
          i++;
        }
      }

      // If p0 is outside the erase area, and p1 is inside, then all points before and including p0 and the point of intersection
      //   contribute to a new path.  Processing then continues at p1.
      else if (p0_locationIndex.indexOf(1) === -1 && p1_locationIndex.indexOf(1) !== -1) {
        var x = getCapsuleIntersection(p1[0], p1[1], p1_locationIndex, p0[0], p0[1], e0[0], e0[1], e1[0], e1[1], eraseRadius);
        if (x) {
          newPath = path.slice(last, i+1);
          newPath.push(x);
          newPaths.push(newPath);
          i++;
          last = i;
        }
        else {
          i++;
        }
      }
      else {
        // Neither p0 or p1 is in the erase area, so there may or may not be a pair of intersections.
        var possIntersects = getCapsuleIntersections(p0[0], p0[1], p1[0], p1[1], e0[0], e0[1], e1[0], e1[1], eraseRadius);
        if (possIntersects) {
          // create a new path that goes from the beginning of our current path
          // to the intersection point
          newPath = path.slice(last, i+1);

          // only add the intersection point if it is not identical to the last
          // point in the path
          if (newPath[newPath.length-1][0] !== possIntersects[0][0] ||
            newPath[newPath.length-1][1] !== possIntersects[0][1]) {
            newPath.push(possIntersects[0]);
          }

          // we only want paths with length > 1
          if (newPath.length > 1) newPaths.push(newPath);


          // we will put the second intersection point into the current position
          // of our path, but only if it is not identical to the next point in
          // the path (we don't need duplicate points)
          path[i] = possIntersects[1];
          if (path[i+1] && path[i+1][0] == possIntersects[1][0]
                        && path[i+1][1] == possIntersects[1][1]) i++;

          last = i;
        }
        else {
          i++;
        }
      }
    }
    // assemble the remaining points into a new path
    if (last !== i) {
      newPath = path.slice(last, path.length);
      if (newPath) {
        newPaths.push(newPath);
      }
    }
  } // end capsuleErase

  // main
  /*
  for (var c=0; c<(paths.length); c++) {
    newPaths.push(cleanPath(paths[c]));
  }
  paths = newPaths;
  */
  erasePath = cleanPath({path: erasePath});
  if (erasePath.length === 1) {
    for (var p=0; p<paths.length; p++) {
      pointErase(paths[p]);
    }
    paths = newPaths;
  }
  else {
    for (var e=0; e<(erasePath.length-1); e++) {
      for (var p=0; p<(paths.length); p++) {
        capsuleErase(paths[p], e);
      }
      paths = newPaths;
      newPaths = [];
    }
  } // end main

  // round all coordinates
  for (var r=0; r<(paths.length); r++) {
    for (var rr=0; rr<paths[r].length; rr++) {
      paths[r][rr][0] = Math.round(paths[r][rr][0]);
      paths[r][rr][1] = Math.round(paths[r][rr][1]);
    }
  }

  /*
  * To get test case: uncomment this block and the block at the top of erase().
  *
  console.log( "erase path (cleaned):" );
  logPath( erasePath, 1 );
  console.log( "paths:" );
  logPaths( paths );
  */
  //var time2 = date.getMilliseconds();
  //var deltaT = time2 - time1;
  //console.log(deltaT);

  return paths;
} // end erase

/* Helper functions:
*  displayPath (path)
*  displayPaths (paths)
*  logPath (path, displaySwitch)
*  logPaths (paths)
*  cleanPath (path)
*  getDistance (aX, aY, bX, bY)
*  withinCircle (x, y, cX, cY, r)
*  withinBox (pX, pY, aX, aY, bX, bY, r)
*  withinCapsule (pX, pY, aX, aY, bX, bY, r)
*  getParallelSegments (aX, aY, bX, bY, r)
*  get_cirle_intersection (aX, aY, bX, bY, cX, cY, r)
*  getCircleIntersections (aX, aY, bX, bY, cX, cY, r)
*  getLineIntersection (aX, aY, bX, bY, cX, cY, dX, dY)
*  getCapsuleIntersection (aX, aY, locationIndex, bX, bY, c0_x, c0_y, c1_x, c1_y, r)
*  getCapsuleIntersections (aX, aY, bX, bY, c0_x, c0_y, c1_x, c1_y, r)
*/

// Note: for all intersection calculations, if a point is on the border of an object,
//   for example at the distance from the center of a circle equal to the radius,
//   that point is considered to be outside that shape.

/*
*  Takes a path, and will write it to a document.
*/
function displayPath (path) {
	if (path.path) { var path = path.path; }
  document.write("[");
  for (var i=0; i<(path.length-1); i++) {
    document.write("[" + path[i][0] + "," + path[i][1] + "],");
  }
  document.write("[" + path[i][0] + "," + path[i][1] + "]");
  document.write("]");
}

/*
*  Takes a list of paths, and will write them to a document with newlines between each.
*/
function displayPaths (paths) {
  document.write("[");
  for (var i=0; i<(paths.length-1); i++) {
  displayPath(paths[i]);
  document.write(",<br />");
  }
  displayPath(paths[i]);
  document.write("]");
}

/*
*  Takes a path, and writes it to the console or return it as a string.
*  Takes a "display switch."  If 1, the path will be logged to the console.  If 0, the path will be returned as a string.
*/
function logPath (path, displaySwitch) {
	if (path.path) { var path = path.path; }
  var log = "";
  log += "[";
  for (var i=0; i<(path.length-1); i++) {
    log += "[" + path[i][0] + "," + path[i][1] + "],";
  }
  log += "[" + path[i][0] + "," + path[i][1] + "]";
  log += "]";

  // log path to console
  if (displaySwitch) {
    console.log(log);
  }
  // return string for use elsewhere
  else {
    return log;
  }
}

/*
*  Takes a list of paths, and will write them to the console.
*/
function logPaths (paths) {
  log = "";
  log += "[";
  for (var i=0; i<(paths.length-1); i++) {
    log += logPath(paths[i], 0);
    log += ",";
  }
  log += logPath(paths[i], 0);
  log += "]";

  console.log(log);
}

/*
*  Takes a path.
*  cleanPath will remove all sequential, duplicate coordinate-pairs from the path.
*  Returns a path.
*/
function cleanPath (path) {
	if (path.path) { var path = path.path; }
  var cleaned = [];
  if (path.length===1) {
    cleaned = path;
  }
  else {
    pClean = 0;
    while (pClean<(path.length-1)) {
      if (path[pClean][0] !== path[pClean+1][0] || path[pClean][1] !== path[pClean+1][1]) {
        cleaned.push(path[pClean]);
      }
      pClean++;
    }
    if (path.length!==0 && cleaned.length===0) {
      cleaned.push(path[0]);
    }
    if (path[path.length-1][0] !== path[cleaned.length-1][0] || path[path.length-1][1] !== path[cleaned.length-1][1]) {
      cleaned.push(path[pClean]);
    }
  }
  return cleaned;
}

/*
*  Takes the x and y coordinates of two points.
*  The distance between those two points is calculated.
*  Returns a floating-point number.
*/
function getDistance (aX, aY, bX, bY) {
  return (Math.sqrt(Math.pow((bX - aX), 2) + Math.pow((bY - aY), 2)));
}

/*
* Takes x, y: the coordinates of the point to be tested
* Takes cX, cY: the coordinates of the center of the circle
* Takes r: the radius of the circle located at (cX, cY)
* Returns 0 or 1: 0 if the point is outside the circle, 1 if within
*/
function withinCircle (x, y, cX, cY, r) {
  var dist = getDistance(x, y, cX, cY);
  if (dist<r) return 1;
  else return 0;
}

/*
* Takes pX, pY: the coordinates of the point to be tested
* Takes aX, aY, bX, bY: the components of the points that define the line segment AB
* Takes r: the "eraseRadius." This will be half the width of the box
* Returns 0 or 1: 0 if the point is outside the box, 1 if within
* Example: (1, 1, -5, 0, 5, 0, 5) => 1
*/
function withinBox (pX, pY, aX, aY, bX, bY, r) {
  // vectors
  var vec_ab = [(bX - aX), (bY - aY)];
  var vec_ap = [(pX - aX), (pY - aY)];

  // tools for calculating projections
  var vec_n    = [-vec_ab[1], vec_ab[0]];
  var mag_n    = Math.sqrt(Math.pow(vec_n[0], 2) + Math.pow(vec_n[1], 2));
  var u_vec_n  = [vec_n[0]/mag_n, vec_n[1]/mag_n]
  var mag_ab   = Math.sqrt(Math.pow(vec_ab[0], 2) + Math.pow(vec_ab[1], 2));
  var u_vec_ab = [vec_ab[0]/mag_ab, vec_ab[1]/mag_ab];

  // use projections of AP to determine where P is in relation to the box
  var ap_proj_ab = vec_ap[0]*u_vec_ab[0] + vec_ap[1]*u_vec_ab[1];
  if (ap_proj_ab <= 0 || ap_proj_ab >= mag_ab) return 0;

  var ap_proj_n = vec_ap[0]*u_vec_n[0] + vec_ap[1]*u_vec_n[1];
  if (ap_proj_n >= r || ap_proj_n <= -r) return 0;

  return 1;
}

/*
* Takes pX, pY: the point in question
* Takes aX, aY, bX, bY: the components of the points that define the line segment AB
* Takes r: the "eraseRadius."
* A capsule is a shape that can be described as two line segments that run parallel to the line segment AB at distance eraseRadius,
*   with a circle centered on each point A and B having radius eraseRadius.
*
* Returns an array of length 3.  This array specifies where in the capsule the point may or may not be located.
* 1 if it is within that area, 0 if not.
* arr[0] => within the circle surrounding point a?
* arr[1] => within the circle surrounding point b?
* arr[2] => within the box, defined by the line segments parallel to the line segment AB?
* 0, 1, or 2 of these values can be 1 simultaneously.
* This array is referred to as the location index in other parts of this document.
*/
function withinCapsule (pX, pY, aX, aY, bX, bY, r) {
  var locationIndex = [];
  locationIndex.push(withinCircle(pX, pY, aX, aY, r));
  locationIndex.push(withinCircle(pX, pY, bX, bY, r));
  locationIndex.push(withinBox(pX, pY, aX, aY, bX, bY, r));
  return locationIndex;

}

/*
* Takes aX, aY, bX, bY: the coordinates of points A and B that define a line segment AB
* Takes r: the "eraseRadius"
* Returns an array of arrays: the points that define a box around that line segment.
* Length: the length of line segment AB, width: 2r.
*
* Example box:

  box[0]                  box[3]
  . _____________________ .
  |                       |
  |                       |
  A                       B
  |                       |
  |                       |
  .-----------------------.
  box[1]                  box[2]

   distance from box[0] to box[1] = distance from box[2] to box[3] = 2*r

*/
function getParallelSegments (aX, aY, bX, bY, r) {
  var vec_v = [(bX - aX), (bY - aY)];
  var vec_n = [-vec_v[1], vec_v[0]];
  var mag_n = Math.sqrt(Math.pow(vec_n[0], 2) + Math.pow(vec_n[1], 2));
  var u_vec_n = [vec_n[0]/mag_n, vec_n[1]/mag_n];

  var b0 = [(aX + r*u_vec_n[0]), (aY + r*u_vec_n[1])];
  var b1 = [(aX - r*u_vec_n[0]), (aY - r*u_vec_n[1])];
  var b2 = [(bX - r*u_vec_n[0]), (bY - r*u_vec_n[1])];
  var b3 = [(bX + r*u_vec_n[0]), (bY + r*u_vec_n[1])];

  return [b0, b1, b2, b3];
}

/*
* Use this function when it is known that one point is inside the circle and the other is out.
* Takes aX, aY: the coordinates of the point inside the circle
* Takes bX, bY: the coordinates of the point outside the circle
* Takes cX, cY: the center point coordinates of the circle
* Takes r: the radius of the circle
* Returns an array: the x and y coordinates of the intersection between the line segment AB and the circle.
*/
function getCircleIntersection (aX, aY, bX, bY, cX, cY, r) {
  var vec_ac = [(cX - aX), (cY - aY)];
  var vec_ab = [(bX - aX), (bY - aY)];

  var mag_ab = Math.sqrt(Math.pow(vec_ab[0], 2) + Math.pow(vec_ab[1], 2));
  var u_vec_ab = [(vec_ab[0]/mag_ab), (vec_ab[1]/mag_ab)];
  var ac_proj_ab = vec_ac[0]*u_vec_ab[0] + vec_ac[1]*u_vec_ab[1];

  // rightPoint is the point on the line segment AB closest to C
  var rightPoint = [(aX + ac_proj_ab*u_vec_ab[0]), (aY + ac_proj_ab*u_vec_ab[1])];
  var distCToRightPoint = Math.sqrt(Math.pow((cX - rightPoint[0]), 2) + Math.pow((cY - rightPoint[1]), 2));
  var b;
  if (distCToRightPoint === 0) {
    b = r;
  }
  else {
    var b = Math.sqrt(Math.pow(r, 2) - Math.pow(distCToRightPoint, 2));
  }
  var intersection = [(aX + ac_proj_ab*u_vec_ab[0] + b*u_vec_ab[0]), (aY + ac_proj_ab*u_vec_ab[1] + b*u_vec_ab[1])];
  if ( intersection[0] === aX && intersection[1] === aY ) return null;
  return intersection;
}

/*
* Use this function when it is known that both points A and B are outside the circle.
* Takes aX, aY, bX, bY: the coordinates of the two points outside the circle, defining line segment AB.
* Takes cX, cY: the coordinates of the center of the circle.
* Takes r: the radius of the circle.
* Returns either and array of two arrays or null:
*   An array if the line segment AB does intersect the circle at two points (single intersections are not allowed).
*   Null if there were no intersections.
*/
function getCircleIntersections (aX, aY, bX, bY, cX, cY, r) {
  var vec_ac = [(cX - aX), (cY - aY)];
  var vec_ab = [(bX - aX), (bY - aY)];

  var vec_n = [-vec_ab[1], vec_ab[0]];
  var mag_n = Math.sqrt(Math.pow(vec_n[0], 2) + Math.pow(vec_n[1], 2));
  var u_vec_n = [vec_n[0]/mag_n, vec_n[1]/mag_n];

  // mag_d is the shortest distance from C to the line through AB
  var mag_d = vec_ac[0]*u_vec_n[0] + vec_ac[1]*u_vec_n[1];

  // although mag_d may be less than r, this does not exclusively guarantee that the line segment intersects
  var closest = getClosestPointOnSegment([aX, aY], [bX, bY], [cX, cY]);
  var dist = getLength([closest[0]-cX, closest[1]-cY]);
  if (dist >= r) return null;

  // x is the distance from the circumference of the circle to the point on the line segment AB closest to C
  // d is that closest point
  var x = Math.sqrt(Math.pow(r, 2) - Math.pow(mag_d, 2));
  var vec_cd = [(cX - mag_d*u_vec_n[0]), (cY - mag_d*u_vec_n[1])];

  var mag_ab = Math.sqrt(Math.pow(vec_ab[0], 2) + Math.pow(vec_ab[1], 2));
  var u_vec_ab = [(vec_ab[0]/mag_ab), (vec_ab[1]/mag_ab)];

  var intersections = [[(vec_cd[0] - u_vec_ab[0]*x), (vec_cd[1] - u_vec_ab[1]*x)], [(vec_cd[0] + u_vec_ab[0]*x), (vec_cd[1] + u_vec_ab[1]*x)]];
  if ( intersections[0][0] === aX && intersections[0][1] === aY ) return null;
  return intersections;
}

/*
* Takes the points that represent two line segments:
*   A and B are line segment 1, C and D are line segment 2.
* Returns null if the line segments do not intersect.
* Returns the coordinate-pair of the intersection if it exists.
*/
function getLineIntersection (aX, aY, bX, bY, cX, cY, dX, dY) {
  var s1_x, s1_y, s2_x, s2_y;
  s1_x = bX - aX;
  s1_y = bY - aY;
  s2_x = dX - cX;
  s2_y = dY - cY;

  var s, t;
  if ((-s2_x * s1_y + s1_x * s2_y) === 0) return null;
  s = (-s1_y * (aX - cX) + s1_x * (aY - cY)) / (-s2_x * s1_y + s1_x * s2_y);
  t = ( s2_x * (aY - cY) - s2_y * (aX - cX)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // Collision detected
    var intX = aX + (t * s1_x);
    var intY = aY + (t * s1_y);
    return [intX, intY];
  }
  return null; // No collision
}

/*
* Use this when p0 is in the capsule and p1 isn't.  Pass in p0's location index.
* Takes aX, aY, locationIndex: the coordinates of the point inside the capsule;
*   the location index specifies exactly where it is.
* Takes bX, bY: the coordinates of the point outside the circle.
* Takes c0_x, c0_y, c1_x, c1_y, r: the parameters that define the capsule: the line segment from c0 to c1 and the radius.
* Returns an array containing the coordinates of the point of intersection between the line segment between A and B and the capsule
*/
function getCapsuleIntersection (aX, aY, locationIndex, bX, bY, c0_x, c0_y, c1_x, c1_y, r) {
  var box = getParallelSegments(c0_x, c0_y, c1_x, c1_y, r);
  var intersections = [];

  if (locationIndex[0] && !locationIndex[1]) {
    intersections.push(getCircleIntersection(aX, aY, bX, bY, c0_x, c0_y, r));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[0][0], box[0][1], box[3][0], box[3][1]));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[1][0], box[1][1], box[2][0], box[2][1]));
    var i = getCircleIntersections(aX, aY, bX, bY, c1_x, c1_y, r);
    if (i) intersections.push(i[0], i[1]);
  }
  else if (!locationIndex[0] && locationIndex[1]) {
    intersections.push(getCircleIntersection(aX, aY, bX, bY, c1_x, c1_y, r));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[0][0], box[0][1], box[3][0], box[3][1]));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[1][0], box[1][1], box[2][0], box[2][1]));
    var i = getCircleIntersections(aX, aY, bX, bY, c0_x, c0_y, r);
    if (i) intersections.push(i[0], i[1]);
  }
  else if (locationIndex[0] && locationIndex[1]) {
    intersections.push(getCircleIntersection(aX, aY, bX, bY, c0_x, c0_y, r));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[0][0], box[0][1], box[3][0], box[3][1]));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[1][0], box[1][1], box[2][0], box[2][1]));
    intersections.push(getCircleIntersection(aX, aY, bX, bY, c1_x, c1_y, r));
  }
  else {
    var i = getCircleIntersections(aX, aY, bX, bY, c1_x, c1_y, r);
    var j = getCircleIntersections(aX, aY, bX, bY, c0_x, c0_y, r);
    if (i) intersections.push(i[0], i[1]);
    if (j) intersections.push(j[0], j[1]);
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[0][0], box[0][1], box[3][0], box[3][1]));
    intersections.push(getLineIntersection(aX, aY, bX, bY, box[1][0], box[1][1], box[2][0], box[2][1]));
  }
  var intersection = [aX, aY];
  for (var n=0; n<(intersections.length); n++) {
    if (intersections[n]) {
      if (getDistance(intersections[n][0], intersections[n][1], bX, bY) <
          getDistance(intersection[0], intersection[1], bX, bY)) {
        intersection = intersections[n];
      }
    }
  }
  if (intersection[0] === aX && intersection[1] === aY) return null;
  return intersection;
}

/*
* Use this when neither of the points are in the capsule.
* Takes aX, aY: the coordinates of the point inside the capsule
* Takes bX, bY: the coordinates of the point outside the circle
* Takes c0_x, c0_y, c1_x, c1_y, r: the parameters that define the capsule: the line segment from c0 to c1 and the radius
* Returns an array of two arrays,
*   containing the coordinates of the points of intersection between the line segment between A and B and the capsule
* Returns null if the line segment AB does not intersect with the capsule
*/
function getCapsuleIntersections (aX, aY, bX, bY, c0_x, c0_y, c1_x, c1_y, r) {
  var box = getParallelSegments(c0_x, c0_y, c1_x, c1_y, r);
  var intersections = [];

  var tmp = getCircleIntersections(aX, aY, bX, bY, c0_x, c0_y, r);
  if (tmp) intersections.push(tmp[0], tmp[1]);
  tmp = getCircleIntersections(aX, aY, bX, bY, c1_x, c1_y, r);
  if (tmp) intersections.push(tmp[0], tmp[1]);
  intersections.push(getLineIntersection(aX, aY, bX, bY, box[0][0], box[0][1], box[3][0], box[3][1]));
  intersections.push(getLineIntersection(aX, aY, bX, bY, box[1][0], box[1][1], box[2][0], box[2][1]));

  // the farthest possible intersection to each point A or B would be B and A, respectively
  var intersection0 = [bX, bY];
  var intersection1 = [aX, aY];

  for (var n=0; n<(intersections.length); n++) {
    if (intersections[n]) {
      if (getDistance(intersections[n][0], intersections[n][1], aX, aY) <
          getDistance(intersection0[0], intersection0[1], aX, aY)) {
        intersection0 = intersections[n];
      }
    }
  }
  for (var m=0; m<(intersections.length); m++) {
    if (intersections[m]) {
      if (getDistance(intersections[m][0], intersections[m][1], bX, bY) <
          getDistance(intersection1[0], intersection1[1], bX, bY)) {
        intersection1 = intersections[m];
      }
    }
  }
  if ((intersection0[0] === bX && intersection0[1] === bY) ||
     (intersection1[0] === aX && intersection1[1] === aY)) return null;
  else return [intersection0, intersection1];
}

/*
* Takes an array of coordinates P.
* Returns the length of that vector (distance from the origin to point P).
*/
var getLength = function(P) {
  return Math.sqrt(P[0]*P[0] + P[1]*P[1]);
}

var EPS = 1e-6;

/*
* Takes the points A and B (length 2 arrays): the points that define the line segment.
* Takes P: the point in question.
* Returns the closest point on the line segment AB to point P.
*/
var getClosestPointOnSegment = function(A, B, P) {
  var AB = [B[0]-A[0], B[1]-A[1]]
     ,len = getLength(AB);
  if (len < EPS) return A;
  var PA = [P[0]-A[0], P[1]-A[1]];
  var k = (AB[0]*PA[0]+AB[1]*PA[1])/len;
  if (k<0) return A;
  if (k>len) return B;
  return [A[0]+ AB[0]*k/len, A[1]+ AB[1]*k/len];
}

// This line is for the automated tests with node.js
if (typeof(exports) != 'undefined') { exports.erase = erase }

return erase;
})();

gm_hwr_request = (function() {

var pathToStroke = function(path) {
	var stroke = { 'type': 'stroke'
							 , 'x': []
							 , 'y': []};
	path.points.forEach(function (d) {
		stroke.x.push(d[0]);
		stroke.y.push(d[1]);
	});
	return stroke;
};

var hwr_request = function(paths, callback) {
	// url = "http://localhost:7030/server.js"
	url = "http://dlandy.psych.indiana.edu:7031/server.js";
	var jsonPost =	{
		'components': paths.map(pathToStroke),
		'resultTypes': ["LATEX"]
	};

	var data = {
		'apiKey' : "c26d2755-1fda-4033-b136-4af042f3f9db",
		'equationInput' : JSON.stringify(jsonPost)
	}

	var posting = $.post(url, data.equationInput);
	posting.done(function(data) {
		var results = data.replace(/\\/g, "\\\\");
		results = JSON.parse(results);
		callback(null, results.JSON);
	});
};

return hwr_request;
})();
// Copyright Erik Weitnauer, 2014.

gmath.ui = gmath.ui || {};
gmath.ui.CanvasController = (function() {

CanvasController = function (modelview) {
  var dispatch = d3.dispatch('scroll', 'start_hwr', 'stop_hwr');

  var cc_id = gmath.uid()
    , mv = modelview  // the CanvasModelView this controller is bound to
    , keyboard = null // keyboard component for entering math terms
    , mode = 'draw'   // can be draw, erase, or math
		, hwr = true      // hand writing recognition on/off
		, drawing					// allow drawing on/off
		, hwr_delay = 1500 // delay between mouse release & hwr attempt
    , hwr_timer = null
		, hwr_path_idx = mv.paths().length // use this & all later paths in the hwr
		, marker_radius = 1.5 // radius of the marker
    , eraser_radius = 50 // radius of the eraser
		, eraser_head = null
    , color = 'black'  // current drawing color
    , tx_behavior = null
		, y_pos = 0    // vertical scroll position of the paths and dls g-elements
		, curr_path = null
		, curr_dl = null
		, is_scrolling = false
		, actionList = []    // list of actions taken so we can undo them
		, lastActionIdx = -1 // pointer into the actionList, for undo & redo
		, just_redid_action = false; // don't re-record events during undoing

	function newAction(action) {
		if (just_redid_action) {
		  just_redid_action = false;
		  return;
		}
		lastActionIdx += 1;
		actionList[lastActionIdx] = action;
		actionList.length = lastActionIdx+1;
	}

  var controller = function() {
  	modelview.on('create.'+cc_id, function(event) {
  		if (event.target_type === 'dl') {
  			var dl = event.target;
  			newAction({type: 'create_dl', dl: dl});
  			dl.events.on('added_line.'+cc_id, function() {
  				newAction({type: 'math', dl: dl});
  			});
  		}
  	});
    // transform & touch behavior
    tx_behavior = transform_behavior()
    	.allow_rotate(false)
    	.allow_scale(false)
    	.one_finger_drag(false)
			.on('transform', function() { scroll(d3.event.transform.translate[1]) });
    mtouch = mtouch_events()
      .on('touch', touch)
      .on('drag', drag)
      .on('release', release)
      .on('hold', function() {
      	if (is_scrolling) return;
      	if (mode !== 'draw' && drawing) return;
      	if (curr_path) { controller.undo(); curr_path = null }
      	controller.inputDL(d3.event.finger.pos);
      })
      .hold_max_dist(5)
      .hold_time(750)
			.call(tx_behavior);
    // keyboard
    if (typeof(Keyboard) !== 'undefined') {
    	keyboard = Keyboard();
    	keyboard
    	  .width(800)
	      .position('center')
	      .on('done', enteredTerm)
	      .on('cancel', kbCancelled)
	      ();
	  }
    // create invisible rect to capture drawing interactions,
    // insert before the dls g-element
    var overlay = mv.dls_container().append('rect', '*')
		  .style({fill: 'none', 'pointer-events': 'all'})
      .attr("width", "100%")
      .attr("height", "100%")
      .call(mtouch);
    var g_dls_node = mv.dls_container().node();
    g_dls_node.parentNode.insertBefore(overlay.node(), g_dls_node);
    mtouch.frame(overlay.node());

    d3.select(g_dls_node.parentNode)
      .on('dragover', function() { d3.event.preventDefault() })
      .on('drop', handleDrop);

    return this;
  };

  controller.model = function(arg) {
  	if (arguments.length === 0) return mv;
  	mv = arg;
  	return this;
  }

  /** Get or set controller mode. Possible values are "draw" and "erase". */
  controller.mode = function(arg) {
    if (arguments.length === 0) return mode;
    if (arg === 'draw' && !drawing) return this;
    mode = arg;
    return this;
  };

  /** Get or set current drawing color. Pass any valid css color value. */
  controller.color = function(arg) {
    if (arguments.length === 0) return color;
    color = arg;
    return this;
  };

	/** Get or set the radius of the marker in pixels. */
	controller.markerRadius = function(arg) {
		if (arguments.length === 0) return marker_radius;
		marker_radius = arg;
		return this;
	};

  /** Get or set the radius of the eraser in pixels. */
  controller.eraserRadius = function(arg) {
    if (arguments.length === 0) return eraser_radius;
    eraser_radius = arg;
    return this;
  };

	/** Get or set the hwr_delay in milliseconds. */
	controller.hwr_delay = function(arg) {
		if (arguments.length === 0) return hwr_delay;
		hwr_delay = arg;
		return this;
	};

	controller.tx_behavior = function () {
		return tx_behavior;
	};

	controller.hwr = function (arg) {
		if (!arguments.length) return hwr;
		if (hwr === arg) return;
		hwr = arg;
		hwr_path_idx = mv.paths.length;
		if (!hwr) controller.cancelHWR();
		return controller;
	};

	controller.drawing = function (arg) {
		if (!arguments.length) return drawing;
		drawing = arg;
		return this;
	}

	controller.scheduleHWR = function() {
		if (!hwr_timer) {
			hwr_timer = setTimeout(controller.performHWR, hwr_delay);
			dispatch.start_hwr();
		}
	}

	controller.cancelHWR = function(keep_hwr_index) {
		if (!keep_hwr_index) hwr_path_idx = mv.paths.length;
		if (hwr_timer) {
			clearTimeout(hwr_timer);
			hwr_timer = null;
			dispatch.stop_hwr();
		}
	}

	controller.performHWR = function() {
		hwr_timer = null;
		dispatch.stop_hwr();
		if (hwr_path_idx > mv.paths().length-1) return;
		var paths = mv.paths().slice(hwr_path_idx)
		  , added_dl = false
			, removed_paths = []
		gm_hwr_request(paths, function(err, eq) {
			if (err) console.log(err);
			var pos = paths[0].points[0];
			try {
				added_dl = mv.createDL({pos: pos, eq: eq});
			} catch (error) { return; } // we could not parse it!
			var rmPathHelper = function (path) {
				try {
					mv.removePath(path);
					removed_paths.push(path);
				} catch (error) { return; } // path was removed by someone else already
			};
			for (var i=0; i<paths.length; i++) {
				rmPathHelper(paths[i]);
			}
			hwr_path_idx = mv.paths().length;
			if (added_dl && removed_paths.length > 0) {
				newAction({ type: 'convert'
				          , removed_paths: removed_paths
									, added_dl: added_dl });
			}
		});
		hwr_path_idx = mv.paths().length;
	}

	controller.scroll = function (y) {
  	if (arguments.length === 0) return y_pos;
		y_pos = Math.min(0, y);
		tx_behavior.transform({translate: [0, y_pos]});
		mv.paths_container().attr('transform', 'translate(0,'+y_pos+')');
		mv.dls_container().attr('transform', 'translate(0,'+y_pos+')');
		dispatch.scroll(y_pos);
		return this;
  };

	// Undoes the last recorded action.
	controller.undo = function () {
		if (lastActionIdx === -1) return;
		// Get the last action performed (and remove it from the list of actions).
		var lastAction = actionList[lastActionIdx];
		console.log('undo', lastAction.type);
		lastActionIdx--;
		if (lastAction.type === 'draw') {
			mv.removePath(lastAction.path);
		} else if (lastAction.type === 'erase') {
			// If the last action was an erase action
			// 	, remove the paths drawn
			// 	, revert modified paths
			//  , add back in deleted paths.
			lastAction.removed.forEach(function (d) {
				mv.addPath(d);
			});
			lastAction.added.forEach(function (d) {
				mv.removePath(d);
			});
			lastAction.modified.forEach(function (d) {
				d.path.points = d.points_before;
				mv.updatePath(d.path);
			});
		} else if (lastAction.type === 'convert') { // always before a create_dl action
			lastAction.removed_paths.forEach(function (d) {
				mv.addPath(d);
			});
			this.undo();
		} else if (lastAction.type === 'math') {
			lastAction.undone_row = lastAction.dl.undo();
			var prevAction = actionList[lastActionIdx];
			if (prevAction && prevAction.type === 'create_dl' && prevAction.dl === lastAction.dl)
				this.undo();
		} else if (lastAction.type === 'create_dl') {
			mv.removeDL(lastAction.dl);
		}
	};

	controller.redo = function() {
		if (actionList.length <= lastActionIdx+1) return;
		lastActionIdx += 1;
		var nextAction = actionList[lastActionIdx];
		console.log('redo', nextAction.type);

		if (nextAction.type === 'draw') {
				mv.addPath(nextAction.path);
		} else if (nextAction.type === 'erase') {
			// If the next action is an erase action
			// 	, add the paths drawn
			// 	, revert modified paths
			// 	, remove deleted paths
			nextAction.removed.forEach(function (d) {
				mv.removePath(d);
			});
			nextAction.modified.forEach(function (d) {
				d.path.points = d.points_after;
				mv.updatePath(d.path);
			});
			nextAction.added.forEach(function (d) {
				mv.addPath(d);
			})
		} else if (nextAction.type === 'convert') {
			nextAction.removed_paths.forEach(function (d) {
				mv.removePath(d);
			});
		} else if (nextAction.type == 'math') {
			just_redid_action = true;
			nextAction.dl.redo(nextAction.undone_row);
		} else if (nextAction.type == 'create_dl') {
			just_redid_action = true;
			mv.addDL(nextAction.dl);
			this.redo();
		}
	};

	var createPathAt = function(pos) {
		return mv.createPath({ points: [[pos[0], pos[1]-y_pos]]
					               , color: mode === 'draw' ? color : 'white'
					               , width: mode === 'draw' ? 2*marker_radius
					                                        : 2*eraser_radius});
	}

  /// On touching, start a new draw or erase path on the controller.
  var touch = function() {
  	if (!drawing) return;
		var evt = d3.event
		if (evt.fingers.length > 1) {
			is_scrolling = true;
			if (curr_path) { controller.undo(); curr_path = null; }
			return;
		}
    var pos = evt.finger.pos0.slice();
		pos[1] -= y_pos;
		controller.cancelHWR(true);
		curr_path = createPathAt(evt.finger.pos0);
		if (mode === 'draw') newAction({ type: 'draw', path: curr_path });
		if (mode === 'erase') {
			eraser_head = mv.paths_container().append('circle')
				.attr({cx: pos[0], cy: pos[1], r: eraser_radius})
				.style({stroke: 'silver', fill: 'white'});
		}
  };

  /// On dragging, add points to the relevant path.
  var drag = function() {
  	if (!drawing) return;
  	if (!curr_path || is_scrolling) return;
    var evt = d3.event
		  , pos = evt.finger.pos.slice();
		pos[1] -= y_pos;
		curr_path.points.push(pos);
		mv.updatePath(curr_path);
    if (mode === 'erase') eraser_head.attr({cx: pos[0], cy: pos[1]});
  }

  /// On releasing, finish the path.
  var release = function() {
  	if (is_scrolling) {
  		if (d3.event.fingers.length === 0) is_scrolling = false;
  		return;
  	}
  	if (!curr_path) return;
  	if (mode === 'draw') {
  		if (hwr && (!keyboard || !keyboard.visible())) controller.scheduleHWR();
  	} else if (mode === 'erase') {
			eraser_head.remove();
			erase();
		}
		curr_path = null;
	}

	var erase = function() {
		var paths = mv.paths().slice()
		  , eraser_path = paths[paths.length-1]
			, added = []
			, removed = []
			, modified = []
		paths.forEach(function(path) {
			if (path === eraser_path) return;
			var radius = eraser_radius + path.width/2;
			var results = gm_erase_paths([path.points], eraser_path.points, radius);
			if (results.length === 0) {
				removed.push(path);
				mv.removePath(path);
			} else {
				modified.push({ path: path
				              , points_before: path.points.slice()
				              , points_after: results[0].slice() });
				path.points = results[0];
				mv.updatePath(path);
				for (var i=1; i<results.length; i++) {
				  var np = mv.createPath({points: results[i], color: path.color, width: path.width});
					added.push(np);
				}
			}
		});
		mv.removePath(eraser_path);
		newAction({ type: 'erase'
              , removed: removed
							, modified: modified
							, added: added });
	}

  /// Shows the keyboard and saves the position at which the user clicked.
  controller.inputDL = function(pos) {
  	if (!keyboard) return;
    controller.cancelHWR(true);
		curr_dl = { pos: [pos[0], pos[1]-y_pos] };
    keyboard.caption('Please enter a number, equation, or expression.').latex('').visible(true);
  };

  /// Called by keyboard when the user confirmed the input. Will hide the keyboard and
  /// update the last math term added to the controller.
  var enteredTerm = function(latex) {
    keyboard.visible(false);
  	if (latex === '') return;
		curr_dl.eq = latex;
		var dl;
		try { dl = mv.createDL(curr_dl) }
		catch(error) { console.log(error); }
		finally { curr_dl = null }
  };

  /// Called by keyboard when the user cancelled the input. Will hide the keyboard.
  var kbCancelled = function() {
    keyboard.visible(false);
  };

  function handleDrop() {
		var evt = d3.event;
		evt.preventDefault();
		var pos = d3.mouse(svg.node());

		var math_str = getMathFromImage(evt.dataTransfer) || getMathFromText(evt.dataTransfer);
		if (!math_str) { console.log('could not parse drop data', data); return }
		// Remove the extra LaTeX for formating systems of equations.
		math_str = math_str.replace(/\\end{alignat}/g, '');
		math_str = math_str.replace(/\&\\\,/g, '');
		math_str = math_str.replace(/\\\,/g, '');
		math_str = math_str.replace(/\&/g, '');
		math_str = math_str.replace(/\\begin{alignat}{[0-9]*}/g, '');
		math_str = math_str.replace(/\\\;/g, '');
		// Remove trailing dots, commas and spaces
		math_str = math_str.replace(/[.,\s\\]+$/, '');

		var equations = (math_str.split("\\\\"));
		if (math_str.length === 0) return;

		try {
			wm.createDLs(equations, { pos: pos, collapsed_mode: true });
		} catch(error) {
			console.log('Could not parse equation!', error);
		}
  }

	function getMathFromImage(dataTransfer) {
		var data = dataTransfer.getData("text/html");
		var tmp = document.createElement('div');
		var img = d3.select(tmp).html(data).select('img');
		return img.size() === 1 ? img.attr('alt') : null;
	}

	function getMathFromText(dataTransfer) {
		return dataTransfer.getData('text/plain');
	}

  return d3.rebind(controller, dispatch, "on");
}
return CanvasController;
})();

// Copyright Erik Weitnauer, 2014.

gmath.ui = gmath.ui || {};
gmath.ui.CanvasModelView = (function() {
/**
 * The CanvasModelView keeps track of paths and derivation lists.
 *
 * All events ('create', 'update', 'remove', 'reset') have the following fields:
 * - target_type: 'dl' or 'path'
 * - target: DerivationList or Path or a list of either of the former for 'reset'
 */
CanvasModelView = function () {
	var dispatch = d3.dispatch('create', 'update', 'remove', 'reset')
	  , paths = [] // array of Paths
		, dls = []   // array of DerivationLists
		, container = null
		, g_dls    // default g-element for new derivation lists
		, g_paths; // default g-element for new paths

	var wboard = function (_container) {
		container = _container;
		g_paths = container.append('g');
		g_dls = container.append('g');
		return this;
	}

	/// Adds an existing DL to the canvas model.
	wboard.addDL = function(dl) {
		if (dls.indexOf(dl) !== -1) throw "dl is already in this model";
		dl.options.canvas_model = wboard;
		dl.container(g_dls.node());
		dls.push(dl);
		dispatch.create({target_type: 'dl', target: dl});
		return dl;
	}

	/// Options need to have an 'eq' field and should have a pos: [x,y] field.
	wboard.createDL = function(options, callback) {
		options.canvas_model = wboard;
		var dl = new DerivationList(g_dls.node(), options, callback);
		dls.push(dl);
		dispatch.create({target_type: 'dl', target: dl});
		return dl;
	}

	/// Will create multiple DLs, one for each passed equation, and place then
	/// below each other.
	wboard.createDLs = function(eqs, options, callback) {
		var i = 0;
		next();
		function next(dl) {
			if (i === eqs.length) { if (callback) callback() }
			else {
				if (dl) options.pos[1] += dl.dims.height;
				var opts = gmath.deepCopy(options);
				opts.eq = eqs[i++];
				wboard.createDL(opts, next);
			}
		}
	}

	wboard.removeDL = function(dl) {
		removeElement(dls, dl);
		dl.remove();
		dispatch.remove({target_type: 'dl', target: dl});
	}

	/// Add an existing path to the model.
	wboard.addPath = function(path) {
		if (paths.indexOf(path) !== -1) throw "path is already in this model";
		path.setContainer(g_paths);
		path.init();
		paths.push(path);
		dispatch.create({target_type: 'path', target: path});
		return path;
	}

	/// Options should contain points, color, width and type.
	wboard.createPath = function(options) {
		var path = new gmath.ui.Path(g_paths.node(), options);
		paths.push(path);
		dispatch.create({target_type: 'path', target: path});
		return path;
	}

	wboard.updatePath = function(path) {
		path.update();
		dispatch.update({target_type: 'path', target: path});
	}

	wboard.removePath = function(path) {
		removeElement(paths, path);
		path.remove();
		dispatch.remove({target_type: 'path', target: path});
	}

	var removeElement = function(array, el) {
		var idx = array.indexOf(el);
		if (idx === -1) throw "no element " + el;
		array.splice(idx, 1);
	}

	wboard.dls = function(arg) {
		if (!arguments.length) return dls;
		for (var i=0; i<dls.length; i++) dls[i].remove();
		dls = arg.slice();
		for (var i=0; i<dls.length; i++) {
			dls[i].container(g_dls);
			dls[i].init();
		}
		dispatch.reset({target_type: 'dl', target: dls.slice()});
	}

	/// As setter, removes all current paths from the DOM and displays the new ones.
	wboard.paths = function(arg) {
		if (!arguments.length) return paths;
		for (var i=0; i<paths.length; i++) paths[i].remove();
		paths = arg.slice();
		for (var i=0; i<paths.length; i++) {
			paths[i].setContainer(g_paths);
			paths[i].init();
		}
		dispatch.reset({target_type: 'path', target: paths.slice()});
	}

	wboard.container = function() {
		return container;
	}

	wboard.dls_container = function(arg) {
		if (!arguments.length) return g_dls;
		g_dls = arg; return this;
	}

	wboard.paths_container = function(arg) {
		if (!arguments.length) return g_paths;
		g_paths = arg; return this;
	}

	wboard.size = function() {
		var n = container.node();
		while (n.tagName.toLowerCase() !== 'svg' && n.parentNode) n = n.parentNode;
		var bbox = n.getBoundingClientRect();
		return { width: bbox.width, height: bbox.height };
	}

	return d3.rebind(wboard, dispatch, "on");

}
return CanvasModelView;
})();
// Two ways to call main with options:
// { exclude: ['pages', 'hwr', ... ] } 		-> Only components in list WONT be instantiated.
// { include: ['markers', 'undo', ... ] } -> Only components in list WILL be instantiated.

Main = function (options,element,size) {
//size can be ["100%","100%"] or ["1280px","720px"]
//width  = 1280
//		, height = 720

  var id = gmath.uid()
    , ops = options || { exclude: [] }
		, schemes = [ { p: '#84BF41'
									, s: '#D0E4B9'
									, t: 'silver'
									, q: 'white' }
								, { p: '#84BF41'
									, s: 'gainsboro'
									, t: 'silver'
									, q: 'white' }
								, { p: '#D0E4B9'
									, s: '#84BF41'
									, t: 'silver'
									, q: 'white' } ]
		, scheme = 0
		, xpos = 347
		, ypos = 20
		, pages, markers, markerssidebar, download, upload
		, undo, redo, scroll, hwr, drawerasetoggle
		, cc // canvas controller
		, cmv // canvas model view
		, svg;

	var width, height;
	var appendToElement;

	if (typeof element === "undefined"){
		var body = document.body,
			html = document.documentElement;

		height = Math.max( body.scrollHeight, body.offsetHeight,
			html.clientHeight, html.scrollHeight, html.offsetHeight );
		height += 'px';
		width = document.body.clientWidth + 'px';
		appendToElement = d3.select("body");

	}else{
		appendToElement = d3.select(element);
		if(typeof size === "undefined"){
			width = appendToElement[0][0].clientWidth + 'px';
			height = appendToElement[0][0].clientHeight + 'px';
		}else{
			width = size[0];
			height = size[1];
		}
	}

	// Returns whether or not a component should be instantiated.
	// If component is included in list of exclusions, return false.
	// If component is not included in list of exclusions, return true.
	// Vice versa for list of inclusions.
	var instantiate = function (component) {
		if (ops.exclude) return !(ops.exclude.indexOf(component) > -1);
		if (ops.include) return ops.include.indexOf(component) > -1;
	};

	svg = appendToElement.append('svg')
		.attr("width", width)
		.attr("height", height)
		.style('margin-left', 'auto')
		.style('margin-right', 'auto')
		.style('display', 'block')
		.style('overflow', 'visible');

	var widthInPixels = svg.node().clientWidth;
	var heightInPixels = svg.node().clientHeight;

	appendToElement[0][0].parentNode.onresize = function(){
		// Todo: write this function.
		// Should optional components (pages, markers, markerssidebar, undo, scroll, download, upload, hwr)
		// have selectors so they can be selected and moved?
	}

	// Retuns g element of active tiny.
	var tinyG = function () {
		return pages.selectTiny();
	};

	// Return minimum canvas height to fit model g els.
	var minHeight = function (model) {
		var dbounds = model.dls_container().node().getBBox()
			, pbounds = model.paths_container().node().getBBox()
			, dheight = dbounds.height + dbounds.y
			, pheight = pbounds.height + pbounds.y
			pages.selectPage().height = Math.max(dheight, pheight);
			pages.sizeTinys();
	};

	// Clones a DL's visual els into another container.
	// Updates visual els on change in DL.
	var cloneDL = function (dl, container) {
		var cloneHelper = function () {
			// Get existing visual els in container (outdated).
			var ext = container.selectAll('#' + dl.id);
			// Clone after animations finish.
			setTimeout(function () {
				// Get visual els from dl's container.
				var clones = dl.svgg.selectAll('#' + dl.id);
				// For each el, copy into container.
				clones[0].forEach(function (d) {
					var clone = d.cloneNode(true);
					container.node().appendChild(clone);
				});
				// Remove outdated els.
				ext.remove();
			}, 1000);
		};
		// Call once (on creation).
		cloneHelper();
		// Call again on updates.
		dl.events.on('change.'+this.id, cloneHelper);
		dl.events.on('line_added.'+this.id, cloneHelper);
	};

	// Core components (model, controller)
	cmv = gmath.ui.CanvasModelView()
		.on('create', function (d) {
			if (!pages) return;
			if (d.target_type == 'dl') {
				cloneDL(d.target, tinyG());
			} else if (d.target_type == 'path') {
				d.target.renderOnto(tinyG());
			}
			minHeight(cmv);
		})
		.on('update', function (d) {
			if (!pages) return;
			d.target.renderOnto(tinyG());
			minHeight(cmv);
		})
		.on('remove', function (d) {
			if (!pages) return;
			tinyG().selectAll('#' + d.target.id)
				.remove();
		})
		.on('reset', function (d) {
			if (!pages) return;
			var g = tinyG();
			if (d.target_type == 'dl') {
				g.selectAll('.derivation-list')
					.remove();
				d.target.forEach(function (e) {
					cloneDL(e, g);
				});
			} else if (d.target_type == 'path') {
				g.selectAll('path')
					.remove();
				d.target.forEach(function (e) {
					e.renderOnto(g);
				});
			}
		});

	cc = gmath.ui.CanvasController(cmv)
		.on('scroll', function (d) {
			if (!pages) return;
			pages.selectPage().transform.translate[1] = d;
			pages.sizeTinys();
		})
		.on('start_hwr', function () {
			if (!hwr) return;
			hwr.animating(true);
		})
		.on('stop_hwr', function () {
			if (!hwr) return;
			hwr.animating(false);
		});
	if ('drawing' in options) cc.drawing(options.drawing);

	// Optional components (pages, markers, markerssidebar, undo, scroll, download, upload, hwr)
	if (instantiate('pages')) {
		pages = gmath.ui.Pages(cmv, schemes[scheme])
			.on('transform', function (d) {
				cc.scroll(d.translate[1]);
			})
			.on('focus', function () {
				cc.cancelHWR();
			});
		xpos += 51;
	}

	if (instantiate('markers') && cc.drawing()) {
		markers = gmath.ui.Markers(schemes[scheme]).pos([xpos, heightInPixels - 75])
			.on('eraser', function (r) {
				cc.mode('erase');
				cc.eraserRadius(r);
			})
			.on('marker', function (col, r) {
				cc.mode('draw');
				cc.markerRadius(r);
				cc.color(col);
			})
			.on('focus', function () {
				cc.cancelHWR();
			});
	}

		if (instantiate('markerssidebar') && !markers) {
		markerssidebar = gmath.ui.Markerssidebar(schemes[scheme]).pos([xpos, heightInPixels - 75])
			.on('eraser', function (r) {
				cc.mode('erase');
				cc.eraserRadius(r);
			})
			.on('marker', function (col, r) {
				cc.mode('draw');
				cc.markerRadius(r);
				cc.color(col);
			})
			.on('focus', function () {
				cc.cancelHWR();
			});
	}

	// Dependent on pages
	if (instantiate('download') && pages) {
		download = gmath.ui.Download(schemes[scheme]).pos([(widthInPixels - 75), ypos])
			.on('download', function () {
				cc.cancelHWR();
				pages.download();
			});
		ypos += 55;
	}

	// Dependent on pages
	if (instantiate('upload') && pages) {
		upload = gmath.ui.Upload(schemes[scheme]).pos([(widthInPixels - 75), ypos])
			.on('upload', function (d) {
				pages.upload(d);
			})
			.on('focus', function () {
				cc.cancelHWR();
			});
		ypos += 55;
	}

	if (instantiate('undo')) {
		undo = gmath.ui.Undo(schemes[scheme]).pos([(widthInPixels - 75), ypos])
			.on('undo', function (d) {
				cc.undo();
			});
		ypos += 55;
	}

	if (instantiate('redo')) {
		redo = gmath.ui.Redo(schemes[scheme]).pos([(widthInPixels - 75), ypos])
			.on('redo', function (d) {
				cc.redo();
			});
		ypos += 55;
	}

	if (instantiate('scroll')) {
		scroll = gmath.ui.Scroll(schemes[scheme], cc).pos([(widthInPixels - 75), ypos])
			.on('scroll', function (d) {
				if (pages) {
					pages.selectPage().transform = { translate: [0, d] };
					pages.sizeTinys();
				} else {
					cc.scroll(d);
				}
			})
			.on('focus', function () {
				cc.cancelHWR();
			});
		ypos += 90;
	}

	if (instantiate('hwr')) {
		hwr = gmath.ui.HWRUI(schemes[scheme]).pos([(widthInPixels - 75), heightInPixels - 75])
			.on('hwr', function (d) {
				cc.hwr(d);
			});
	}

  if (instantiate('drawerasetoggle') && !markers) {
		drawerasetoggle = gmath.ui.DrawEraseToggle(schemes[scheme]).pos([xpos, 603])
			.on('mode', function (m) {
				cc.mode(m);
			})
			.on('focus', function () {
				cc.cancelHWR();
			});
	}


	var init = svg.append('g');
	if (cmv) init.call(cmv);
	if (cc) init.call(cc);
	if (pages) init.call(pages);
	if (markers) init.call(markers);
	if (markerssidebar) init.call(markerssidebar);
	if (download) init.call(download);
	if (upload) init.call(upload);
	if (undo) init.call(undo);
	if (redo) init.call(redo);
	if (scroll) init.call(scroll);
	if (hwr) init.call(hwr);
  if (drawerasetoggle) init.call(drawerasetoggle);

	var creationbox = new CreationBox(init.node(), [20, 20], cc);

	return { svg: svg, cmodel: cmv, ccontroller: cc, pages: pages
		     , markers: markers, markerssidebar: markerssidebar, download: download, upload: upload, undo: undo
		     , scroll: scroll, hwr: hwr, drawerasetoggle: drawerasetoggle, creationbox: creationbox};
};

Pages = function (model, scheme) { // Takes a PageModel and a color scheme {p (primary), s (secondary), t (tertiary), q (quaternary)}

	var dispatch = d3.dispatch('transform', 'focus') // events
		, svg = null // the svg in which elements are drawn
		, add = null // the variable which holds the new page elements
		, res = [1280, 720] // the resolution (dimensions) of the user interface
		, pages = [] // the array of stored pages
		, tinys = [] // the array of thumbnails (tinys)
		, t_width = 95 // the width of each tiny (100 - 5)
		, t_scale = function (arg) { // a function for determining the height of each tiny
				var scale = t_width / (res[0] - t_width);
				if (arguments.length === 0) { return scale; }
				return arg * scale;
			}
		, c_page = null // the current page
		, c_tiny = null // the current tiny
		, dragging = false // a dragging mode variable
		, tg = null // global variable for the transform behavior
		, t_gel = null // g element for containing the tinys
		, t_sel = null // the selection of tinys
		, t_progress = null; // the selection of progress bars

	var pi = function (container) {
		init(container);
		return this;
	}

	/* Gets or sets the resolution. */
	pi.res = function (arg) {
		if (arguments.length === 0) return res;
		res[0] = arg[0];
		res[1] = arg[1];
		return this;
	}

	/* Gets or sets the width of the tinys. */
	pi.tWidth = function (arg) {
		if (arguments.length === 0) return t_width;
		t_width = arg;
		return this;
	}

	pi.download = function () {
		//var scrubbed_terms = pages.
		//termModel.expression
		//termMode.position
		// var blob = new Blob([JSON.stringify({pages: pages, tinys: tinys, cid: c_page.id})], { type: "application/json" });
		// saveAs(blob, "gmath-session.json");
		var pages_clone = []
		  , cid = c_page.id;
		pages.forEach(function (d) {
			var d_clone = {};
			d_clone.height = d.height;
			d_clone.id = d.id;
			d_clone.paths = d.paths;
			d_clone.dls = [];
			d.dls.forEach(function (e) {
				d_clone.dls.push(e.options);
			});
			d_clone.transform = d.transform;
			pages_clone.push(d_clone);
		});
		var blob = new Blob( [JSON.stringify({ pages: pages_clone
																				 , tinys: tinys
																				 , cid: c_page.id })]
											 , { type: "application/json" });
		saveAs(blob, "gmath-session.json");
		pages.forEach(function (d) {
			if (d.id === cid) {
				switch_page(d);
			}
		});
	}

	pi.upload = function (upload) {
		pages = upload.pages;
		tinys = upload.tinys;
		t_sel = t_gel.selectAll('.t_el')
			.data(tinys);
		t_sel.exit().remove();
		t_sel.enter()
			.append('svg')
			.classed('t_el', true)
			.call(t_touch());
		t_sel.append('rect')
			.attr('fill', scheme.q);
		t_sel.append('g')
			.attr('transform', ' translate (' + t_scale(-t_width) + ', 0) scale(' + t_scale() + ')');
		t_sel.append('rect')
			.classed('focus', true)
			.attr('x', 1)
			.attr('y', 1)
			.attr('width', t_width - 2)
			.attr('stroke', scheme.p)
			.attr('stroke-width', 2)
			.attr('fill', 'none')
			.attr('display', 'none');
		t_progress = t_gel.selectAll('.t_progress')
			.data(tinys);
		t_progress.enter()
			.append('svg')
			.classed('t_progress', true)
			.attr('x', t_width + 1); // 1
		t_progress.append('rect')
			.classed('bg', true)
			.attr('width', 4)
			// .attr('display', 'none')
			.attr('fill', scheme.t);
		t_progress.append('rect')
			.classed('bar', true)
			.attr('width', 4) // t_width
			.attr('height', t_scale(res[1]) + 4) // + 4 because of + 2 on each sides from the focus color.
			// .attr('opacity', 0.3)
			.attr('fill', scheme.p);
		for (var i = pages.length - 1; i > -1; i--) {
			c_page = pages[i];
			c_tiny = tinys[i];
			model.paths(c_page.paths);
			model.dls(c_page.dls);
			dispatch.transform(c_page.transform);
		}
		pages.forEach(function (d) {
			if (d.id === upload.cid) {
				switch_page(d);
			}
		});
		size_tinys();
	}

	// Temp (returns el):
	pi.selectTiny = function (arg) {
		if (arguments.length === 0) { arg = c_tiny; }
		return t_sel.filter(function (d) { return d.id === arg.id;})
			.select('g');
	}

	// Temp (returns obj):
	pi.selectPage = function (arg) {
		if (arguments.length === 0) { return c_page; }
		pages.forEach(function (p) {
			if (p.id === arg.id) {
				return p;
			}
		});
	}

	// Temp
	pi.sizeTinys = function () {
		size_tinys();
	}

	// Temp
	pi.t_sel = function () {
		return t_sel;
	}

	function init (container) {

		svg = container;

		/* Configure the menu area for the tinys. */
		svg.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', t_width + 7) // + 2 + 5
			.attr('height', res[1])
			.attr('fill', scheme.s);

		/* Draw a divider between the tinys menu and the UI. */
			svg.append('rect')
			.attr('x', t_width + 7) // + 2 + 5
			.attr('y', 0)
			.attr('width', 1)
			.attr('height', res[1])
			.attr('fill', scheme.t);

		t_gel = svg.append('g')
			.attr('transform', 'translate(1, 0)');

		/* Touch events for the new page button. */
		var a_mtouch = mtouch_events()
			.frame(svg.node())
			.on('tap', function () {
        dispatch.focus();
        a_tap();
      });

		/* Render the new page button. */
		add = svg.append('g')
			.attr('transform', 'translate(1, ' + (res[1] - 51) + ')')
			.call(a_mtouch);

		add.append('rect')
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('width', t_width + 5)
			.attr('height', 50)
			.attr('fill', scheme.q);

		var c = (t_width + 5) / 2;
		add.append('path')
			.attr('d', 'M ' + c + ' 13 L '
											+ c + ' 37 M '
											+ (c - 12) + ' 25 L '
											+ (c + 12) + ' 25')
			.style('stroke-width', 6)
			.style('stroke-linecap', 'round')
			.style('stroke', scheme.s);

		new_page();
	}

	/* Returns a page object with the default configuration.
	 * If no id is passed in, a new one is generated,
	 * otherwise a the page is assigned the passed in id. */
	function default_page (id) {
		return { id: id ? id : gmath.uid()
					 , transform: { scale: 1.0
												, rotate: 0
												, translate: [0, 0] }
					 , height: res[1]
					 , paths: []
					 , dls: [] };
	}

	/* Returns a tiny object with the default configuration.
	 * Requires an id corresponding with an existing page. */
	function default_tiny (id, i) {
		return { id: id
					 , index: i
					 , y: 0
					 , height: t_scale(res[1]) };
	}

	/* Returns the touch events for each tiny. */
	function t_touch () {
		return mtouch_events()
			.frame(svg.node())
			.on('tap', function (d) {
        dispatch.focus();
        t_tap(d);
      })
			.on('drag', function (d) {
        dispatch.focus();
        t_drag(d);
      })
			.on('release', function (d) {
        dispatch.focus();
        t_release(d);
      });
	}

	/* Generates a new page and new tiny,
	 * and switches the current page to the new page. */
	function new_page () {
		c_page = default_page();
		c_tiny = default_tiny(c_page.id, pages.length);
		pages.push(c_page);
		tinys.push(c_tiny);
		t_sel = t_gel.selectAll('.t_el')
			.data(tinys);
		t_sel.enter()
			.append('svg')
			.classed('t_el', true)
			.call(t_touch());
		t_sel.append('rect')
			.attr('fill', scheme.q);
		t_sel.append('g')
			.attr('transform', ' translate (' + t_scale(-t_width) + ', 0) scale(' + t_scale() + ')');
		t_sel.append('rect')
			.classed('focus', true)
			.attr('x', 1)
			.attr('y', 1)
			.attr('width', t_width - 2)
			.attr('stroke', scheme.p)
			.attr('stroke-width', 2)
			.attr('fill', 'none')
			.attr('display', 'none');
		t_progress = t_gel.selectAll('.t_progress')
			.data(tinys);
		t_progress.enter()
			.append('svg')
			.classed('t_progress', true)
			.attr('x', t_width + 1); // 1
		t_progress.append('rect')
			.classed('bg', true)
			.attr('width', 4)
			// .attr('display', 'none')
			.attr('fill', scheme.t);
		t_progress.append('rect')
			.classed('bar', true)
			.attr('width', 4) // t_width
			.attr('height', t_scale(res[1]) + 4) // + 4 because of + 2 on each sides from the focus color.
			// .attr('opacity', 0.3)
			.attr('fill', scheme.p);
			// Everything that affects canvas model/controller could come at very end of new page.
		// Could use the switch page function ? Call switch page with default_page(). <-- Must also come after t_sel
		model.paths(c_page.paths);
		model.dls(c_page.dls);
		// Put this here? <--- Must come after instantiation of t_sel
		dispatch.transform(c_page.transform);
		// Probably not necessary, updating model will cause this to be called.
		size_tinys();
	}

	/* Switches the current page and tiny given a page. */
	function switch_page (p) {
		/* Save the current paths in the model. */
		c_page.paths = model.paths();
		/* Save the current terms in the model. */
		c_page.dls = model.dls();
		c_page = p;
		model.paths(c_page.paths);
		model.dls(c_page.dls);
		// Put this here?
		dispatch.transform(c_page.transform);
		tinys.forEach(function (d) {
			if (d.id === p.id) {
					c_tiny = d;
			}
		});
	}

	/* Calls the new page function. */
	function a_tap () {
			new_page();
	}

	/* Switches pages based on a tiny selection. */
	function t_tap (d) {
		var pos = d3.event.finger.pos;
		pages.forEach(function (p) {
			if (p.id === d.id) {
				pos[1] = (pos[1] - d.y) / t_scale() - res[1] / 2;
				var max = p.height - res[1];
				if (pos[1] > max) pos[1] = max;
				if (pos[1] < 0) pos[1] = 0;
				p.transform.translate = [0, pos[1] * -1];
				switch_page(p);
				size_tinys();
			}
		});
	}

	/* Switches to the page whose tiny is being dragged,
	 * and moves the tiny element with the mouse. */
	function t_drag (d) {
		if (!dragging) {
			dragging = true;
			focus_tiny(d);
			t_sel.sort(function (a, b) {
				return a.id === d.id ? 1 : -1;
			});
			t_progress.sort(function (a, b) {
				return a.id === d.id ? 1 : -1;
			});
			pages.forEach(function (p) {
				if (p.id === d.id) {
					switch_page(p);
				}
			});
		}
		d.y += d3.event.finger.dy;
		d.y = d.y < -10 ? -10 : d.y;
		t_sel.filter(function (e) { return e.id === d.id; })
			.attr('y', d.y)
		t_progress.filter(function (e) { return e.id === d.id; })
			.attr('y', d.y);
	}

	/* Reorders the tiny elements according to where the dragged element is released,
	 * also sizes the current tiny to correspond with the size of the page. */
	function t_release (d) {
		if (dragging) {
			var dIn = d.index;
			tinys.forEach(function (e) {
				var eIn = e.index;
				if (d.id !== e.id) {
					var y = e.y + e.height / 2;
					if (eIn > dIn && d.y >= y) {
						e.index = eIn - 1;
						d.index = eIn;
					}
					if (eIn < dIn && d.y <= y) {
						e.index = eIn + 1;
						d.index = d.index === dIn ? eIn : d.index;
					}
				}
			});
			tinys.sort(function (a, b) {
				return a.index - b.index;
			});
			size_tinys();
			dragging = false;
		}
	}

	/* Resizes the current tiny to accommodate a border around it,
	 * indicating its status as the current tiny. */
	function focus_tiny (m) {
		t_sel.selectAll('.focus')
			.attr('display', 'none');
		t_sel.filter(function (d) { return d.id === m.id })
			.select('.focus')
			.attr('height', function (d) { return d.height - 2; })
			.attr('display', 'block');
		t_progress.selectAll('.bar')
			.attr('display', 'none');
		t_progress.filter(function (d) { return d.id === m.id })
			.select('.bar')
			.attr('display', 'block');
	}

	/* Resizes and translates each tiny according to its height and order in the tinys list. */
	function size_tinys () {
		var ante = null
			, h = c_page.height
			, y = res[1] - c_page.transform.translate[1];
		c_tiny.height = t_scale(Math.max(y, h)) + t_scale(50); // Needs to be consistent across all tinys.
		tinys.forEach(function (d) {
			d.y = ante ? ante.y + ante.height + 1 : 1;
			ante = d;
		});
		t_sel.attr('y', function (d) { return d.y; })
			.attr('width', t_width)
			.attr('height', function (d) { return d.height; })
			.select('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', t_width)
			.attr('height', function (d) { return d.height; })
			.attr('stroke', 'none')
			.attr('stroke-width', 0);
		t_progress.attr('y', function (d) { return d.y; })
			.attr('height', function (d) { return d.height; })
			.select('.bg')
			.attr('height', function (d) { return d.height; });
		// Could occur on the focus.
		t_progress.filter(function (d) { return d.id === c_page.id; })
			.select('.bar')
			.attr('y', function (d) { return -1 * t_scale(c_page.transform.translate[1]); })
		focus_tiny(c_tiny);
	}

	return d3.rebind(pi, dispatch, "on");

};

gmath.ui = gmath.ui || {};
gmath.ui.Pages = Pages;
// Copyright Erik Weitnauer, 2014.
// Created by Christian Achgill.

/* To Do:
	- Simplify scaler functions & elements.
	- Set eraser x to a function of the other elements.
	- Marker radius in canvas not scaled at 0.8 like markers interface.
*/

/** The marker interface is used to quickly & efficiently select different colors for drawing.

It is written in the typical d3 component style. `Markers` is a constructor
function. Setting and getting any parameters is done via function calls on the
constructed canvas object. Each function returns the canvas itself, so methods
can be chained.

The object returned by calling Markers is a function that has to be called with
the svg container in which the interface should be drawn.

getter/setters:
  - marker: index of currently selected marker, -1 if none is selected
  - color: color of currently selected marker, getter only
  - scale: the scaling at which to draw the markers (recommended 1.0 at 1280 * 720).
          Note that the markers scale at 0.5 * scale, while the pallete scales at scale.
          This is because the marker paths were designed first, scaled,
          then the pallete was designed to complement the markers at that size.
          has to be called before initialization

events:
  - marker: event triggered with the chosen color as argument when a marker is selected
  - eraser: event triggered when the eraser is selected

usage example:
```
markers = Markers().pos([width / 2 - 45, 490])
   .on('eraser', function() { canvas.mode('erase') })
   .on('marker', function(col) { canvas.mode('draw'); canvas.color(col) });
svg.call(markers);
```

Initially, the first marker is selected.
You have to include the d3 library.
For a full list of HTML named colors, see: http://www.w3schools.com/html/html_colornames.asp
*/
Markers = function (scheme) { // Takes a color scheme {p (primary), s (secondary), t (tertiary), q (quaternary)}

  var dispatch = d3.dispatch("marker", "eraser", "focus"); // events

  var svg = null // container to draw into
    , x = 0      // x position of UI
    , y = 0      // y position of UI
    , scale = 0.75  // the scaling at which to draw the markers
    , fn_marker = null // called when marker is selected
    , fn_eraser = null // called when eraser is selected
    , markers = ['black', 'red', 'green', 'blue', scheme.s, scheme.s, scheme.s] // Preset colors.
    , curr_idx = 0 // currently selected marker index, -1 if none
    , p_colors = ['red', 'chocolate', 'orange', 'gold', 'yellow', 'lime', 'yellowgreen', 'green', 'turquoise', 'blue', 'navy', 'purple', 'fuchsia'] // Selectable colors.
    , pd = 200 * scale // Pallete diameter.
    , ph = pd / 2 // Half pallete diameter, used frequently.
    , pr = 70 * scale // Distance from the center of the pallete to each radius.
    , cr = 15 * scale // Radius of each color on the pallete.
		, mr = 6 // marker radius
    , er = 50 // eraser radius
		, sm = 50 // radius max
    , c_head = 'M 10 30 L 30 30 L 30 10 L 70 10 L 70 30 L 90 30 L 80 90 L 20 90 L 10 30 Z' // Path describing capped marker head.
    , c_body = 'M 30 90 Q 10 90 10 110 L 10 180 L 90 180 L 90 110 Q 90 90 70 90 L 30 90 Z' // Path describing capped marker body.
    , u_head = 'M 35 33 L 35 55 L 65 55 L 65 17 L 35 33 Z' // Path describing uncapped marker head.
    , u_body = 'M 30 90 Q 10 90 10 110 L 10 180 L 90 180 L 90 110 Q 90 90 70 90 L 67 90 L 67 55 L 33 55 L 33 90 L 30 90 Z' // Path describing uncapped marker body.
    , e_paths = [ 'M 16 40 Q 14 42 15 45 L 52 78 Q 54 80 58 78 L 88 65 Q 89 62 86 59 L 86 57 Z' // Paths describing the eraser body.
                , 'M 13 19 L 43 11 L 88 37 L 54 48 L 13 19 Z'
                , 'M 13 19 L 16 41 L 55 74 L 87 61 L 88 37 L 54 48 L 13 19 Z' ]
    , m_held = -1 // index of the selected marker when holding
    , marker_els = null // d3 selection of the marker icons
		, scale_el = null // d3 selection of the scaling interface elements
    , eraser_el = null  // d3 selection of the eraser icon elements
    , pallete_el = null // d3 selection of the palette graphics
		, s_center = null // absolute cx, cy of the scale interface elements
		, abs_sr = null // absolute radius of the scale interface elements
		, m_scale = 1.0 // ratio of marker icon size to size as it's being used.
		, e_scale = 1.0 // ratio of eraser icon size to size as it's being used.

    var markers_instance = function(container) {
      svg = container;
      init();
      return this;
    }

    markers_instance.pos = function(arg) {
      if (arguments.length == 0) return [x,y];
      x = arg[0]; y = arg[1];
      if (svg) position_elements();
      return this;
    }

    markers_instance.marker = function(arg) {
      if (arguments.length == 0) return curr_idx;
      selectMarker(arg);
      return this;
    }

    markers_instance.color = function() {
      return markers[curr_idx];
    }

    markers_instance.scale = function(arg) {
      if (arguments.length == 0) return scale;
      scale = arg;
      return this;
    }

    /** Draws all the markers, the palette and the eraser icon. Selects the first marker. */
    function init() {
      /* Instantiate three separate mtouch variables for the markers, the pallete & the eraser,
       * to produce different actions depending on the element touched. */
      var m_mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function (d,i) {
          dispatch.focus();
          selectMarker(i)
        })
				.on('hold', function (d, i) {
          dispatch.focus();
          m_hold(d, i);
        });

      var p_mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function (d) {
          dispatch.focus();
          p_tap(d);
        });

			var s_mtouch = mtouch_events()
				.frame(svg.node())
				.on('drag', function (d) {
          dispatch.focus();
          s_drag(d);
        });

      var e_mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function (d) {
          dispatch.focus();
          e_tap(d);
        });

      /* Bind the markers list (a list of HTML named colors) to a selection. */
      marker_els = svg.selectAll('.marker_els')
				.data(markers);

      marker_els.enter().append('svg')
				.classed('marker_els', true)
				.call(m_mtouch);

      /* Draw two paths for each marker, which change when marker is capped or uncapped.
       * The first path serves as the marker cap & the marker tip.
       * The second path serves as the body of the marker when the cap is on,
       * & has an alternative appearance when the cap is off.
       * Two paths are used because one is filled & the other is stroked (& filled with the quaternary color). */
      marker_els.append('path')
				.classed('pathhead', true)
				.attr('d', c_head)
				.attr('transform', 'scale(' + (scale * 0.5) + ')')
				.style('fill', function (d) { return d === scheme.s ? scheme.q : d; })
				.style('stroke', function (d) { return d === scheme.s ? d : 'none'; })
				.style('stroke-width', '6')
				.style('stroke-linejoin', 'round');

      marker_els.append('path')
				.classed('pathBody', true)
				.attr('d', c_body)
				.attr('transform', 'scale(' + (scale * 0.5) + ')')
				.style('fill', scheme.q)
				.style('stroke', function (d) { return d; })
				.style('stroke-width', '6')
				.style('stroke-linejoin', 'round');

      /* Append an svg to contain the color pallete.
       * Placed offscreen (x = -width) & kept there when not in use. */
      pallete_el = svg.append('svg')
				.classed('pallete', true)
				.style('display', 'none');

      /* Create a g element to contain the visual elements that make up the pallete background. */
      var pallete_bg = pallete_el.append('g')

      /* Draws a triangle with an angle pointing down centered in the markers_instanceddle of the background,
       * intended to point to the currently selected marker. */
      pallete_bg.append('path')
				.attr('d', 'M 0 ' + ph + ' L ' + pd + ' ' + ph + ' L ' + ph + ' ' + (pd + 10) + ' L 0 ' + ph + ' Z')
				.style('fill', scheme.s);

      /* Draws a circle behind the pallete colors. */
      pallete_bg.append('circle')
				.attr('cx', ph)
				.attr('cy', ph)
				.attr('r', ph)
				.style('fill', scheme.s);

      /* Bind the pallete colors list (a list of HTML named colors) to a selection. */
      var pallete_els = pallete_el.selectAll('.pallete_els')
				.data(p_colors);

      /* Spread the pallete colors evenly along the perimeter of a circle of radius cr */
      pallete_els.enter().append('circle')
				.classed('pallete_els', true)
				.attr('cx', function (d, i) { return ph + Math.cos(2 * (i + 1) * Math.PI / p_colors.length) * pr; })
				.attr('cy', function (d, i) { return ph + Math.sin(2 * (i + 1) * Math.PI / p_colors.length) * pr; })
				.attr('r', cr)
				.style('fill', function (d) { return d; })
				.call(p_mtouch);

			/* Append an svg to contain the scaling interface. */
			scale_el = svg.append('svg')
				.call(s_mtouch);

			scale_bg = scale_el.append('circle')
				.attr('cx', sm + 3.75 + 1.25) // Radius + gap
				.attr('cy', sm + 3.75 + 1.25) // Radius + gap
				.attr('r', sm + 1.875 + 1.25) // Radius + gap (these values match the stroke width of the marker elements).
				.attr('transform', 'scale(' + (scale * 0.8) + ')')
				.attr('stroke', scheme.s)
				.attr('stroke-width', 3.75) // Radius + gap (these values match the stroke width of the marker elemtns).
				.attr('fill', scheme.q);

      /* Draw the scaler. */
      scaler = scale_el.append('circle')
				.attr('cx', sm + 3.75 + 1.25)
				.attr('cy', sm + 3.75 + 1.25)
				.attr('r', mr)
				.attr('transform', 'scale(' + (scale * 0.8) + ')')
				.attr('fill', scheme.s)

      /* Append an svg to contain the eraser. */
      eraser_el = svg.append('svg')
        .call(e_mtouch);

			/* Append the paths that make up the isomorphic appearance of the eraser icon. */
			eraser_el.append('path')
				.attr('transform', 'scale(' + scale + ')')
        .attr('d', e_paths[0])
				.attr('fill', scheme.t);

			eraser_el.append('path')
				.attr('transform', 'scale(' + scale + ')')
        .attr('d', e_paths[1])
				.attr('fill', scheme.s);

			eraser_el.append('path')
				.attr('transform', 'scale(' + scale + ')')
        .attr('d', e_paths[2])
				.attr('fill', scheme.p);

      position_elements();

			/* Calculate the maximum absolute size of the scale, and the coordinates.
			 * Attr * 1 converts the returned string value to an int. */
			abs_sr = sm * scale * 0.8;
			s_center = [ scale_el.attr('x') * 1 + abs_sr + 4
			           , scale_el.attr('y') * 1 + abs_sr + 4 ];

      selectMarker(0);
    }

    /** Sets the position of markers, eraser and pallete relative to x, y */
    function position_elements() {
      marker_els.attr('x', function (d, i) { return x + i * scale * 60; })
				.attr('y', y);
			scale_el.attr('x', x + markers.length * scale * 60)
				.attr('y', y + scale * 8 - 4)
      eraser_el.attr('x', x + markers.length * scale * 60 + 90)
				.attr('y', y + scale * 5)
      pallete_el.attr('y', (y - pd - 15));
    }


    /* Takes the index of the marker to uncap,
     * & caps all other markers.
     * Since this function is only called when the pallete is visible,
     * & by calling this function a marker or color has been selected,
     * this function also hides the pallete off-screen (in its intial position). */
    function uncapMarker (u) {
			marker_els.select('.pathhead')
				.attr('d', function (d, i) { return i === u ? u_head : c_head; })
				.style('fill', function (d) { return d === scheme.s ? scheme.q : d; })
				.style('stroke', function (d) { return d === scheme.s ? d : 'none'; });
			marker_els.select('.pathBody')
				.attr('d', function (d, i) { return i === u ? u_body : c_body; })
				.style('stroke', function (d) { return d; });
			if (u !== -1) eraser_el.select('#eraser').style('fill', markers[curr_idx]);
			pallete_el.style('display', 'none');
			m_held = -1;
    }

    /** Selects the marker with the passed index. */
    var selectMarker = function(i) {
      if (i<-1 || i>=markers.length || markers[i] == scheme.s) return;
      curr_idx = i;
      uncapMarker(i);
      if (i !== -1) {
				scaler.attr('r', mr)
					.attr('fill', scheme.s);
				scale_bg.attr('fill', scheme.q);
				dispatch.marker(markers[i], mr * 0.8 * m_scale);
			}
    }

    /* Positions the color pallete over the marker being held,
     * unless the black marker is being held (unchangeable).
     * dx is the x position of the marker.
     * dw is the x position of the center of the marker.
     * pd is the x position of the center of the color pallete.
     * The final value accounts for the small left offset from using two center values.
     * The function getBBox also under compensates by about 4 pixels per dimension.
     * Offset doesn't need to scale with contributing elements (keep it at 5). */
    function m_hold (d, i) {
			if (i !== 0) {
				var el = marker_els.filter(function (e, j) { return j === i; })
					, dx = el.attr('x') * 1.0
					, dw = el.node().getBBox().width / 2
				pallete_el.attr('x', dx + dw - ph + scale * 5)
					.style('display', 'block');
				m_held = i;
			}
    }

    /* Sets the color of the selected marker to the selected pallete color.
     * Refreshes the marker elements' data set.
     * Simulates tapping the selected marker. */
    function p_tap (d) {
			markers[m_held] = d;
			marker_els = svg.selectAll('.marker_els').data(markers);
			selectMarker(m_held);
    }

		/* Adjusts the scaler depending on the distance of a drag from the center of the scaling interface to the finger position.
		 * Alerts the canvas to the updated radius of the marker or eraser. */
		function s_drag (d) {
			var pos = d3.event.finger.pos
			  , dist = Math.sqrt(Math.pow(s_center[0] - pos[0], 2) + Math.pow(s_center[1] - pos[1], 2))
				, size = dist / abs_sr;
			if (size > 1.0) size = 1.0;
			if (size < 0.12) size = 0.12;
			if (curr_idx > -1) { // Adjust marker settings.
				mr = abs_sr * size / scale / 0.8;
				dispatch.marker(markers[curr_idx], mr * 0.8 * m_scale);
			} else {	// Adjust eraser settings.
				er = abs_sr * size / scale / 0.8;
				dispatch.eraser(er * 0.8 * e_scale);
			}
			scaler.attr('r', sm * size);
		}

		/* Calls the function associated with tapping the eraser. */
    function e_tap (d) {
      selectMarker(-1);
			scaler.attr('r', er)
				.attr('fill', scheme.q);
			scale_bg.attr('fill', scheme.s);
      dispatch.eraser(er * 0.8 * e_scale);
    }

  return d3.rebind(markers_instance, dispatch, "on");
};

gmath.ui = gmath.ui || {};
gmath.ui.Markers = Markers;
// Copyright Erik Weitnauer, 2014.
// Created by Christian Achgill.

/* To Do:
	- Simplify scaler functions & elements.
	- Set eraser x to a function of the other elements.
	- Marker radius in canvas not scaled at 0.8 like markers interface.
*/

/** The marker interface is used to quickly & efficiently select different colors for drawing.

It is written in the typical d3 component style. `Markers` is a constructor
function. Setting and getting any parameters is done via function calls on the
constructed canvas object. Each function returns the canvas itself, so methods
can be chained.

The object returned by calling Markers is a function that has to be called with
the svg container in which the interface should be drawn.

getter/setters:
  - marker: index of currently selected marker, -1 if none is selected
  - color: color of currently selected marker, getter only
  - scale: the scaling at which to draw the markers (recommended 1.0 at 1280 * 720).
          Note that the markers scale at 0.5 * scale, while the pallete scales at scale.
          This is because the marker paths were designed first, scaled,
          then the pallete was designed to complement the markers at that size.
          has to be called before initialization

events:
  - marker: event triggered with the chosen color as argument when a marker is selected
  - eraser: event triggered when the eraser is selected

usage example:
```
markers = Markers().pos([width / 2 - 45, 490])
   .on('eraser', function() { canvas.mode('erase') })
   .on('marker', function(col) { canvas.mode('draw'); canvas.color(col) });
svg.call(markers);
```

Initially, the first marker is selected.
You have to include the d3 library.
For a full list of HTML named colors, see: http://www.w3schools.com/html/html_colornames.asp
*/
Markerssidebar = function (scheme) { // Takes a color scheme {p (primary), s (secondary), t (tertiary), q (quaternary)}
  
  var dispatch = d3.dispatch("marker", "eraser", "focus"); // events

  var svg = null // container to draw into
    , x = 0      // x position of UI
    , y = 0      // y position of UI
    , scale = 1  // the scaling at which to draw the markers
    , fn_marker = null // called when marker is selected
    , fn_eraser = null // called when eraser is selected
    , markers = ['black'] // Preset colors.
    , curr_idx = 0 // currently selected marker index, -1 if none
    , p_colors = ['red', 'chocolate', 'orange', 'gold', 'yellow', 'lime', 'yellowgreen', 'green', 'turquoise', 'blue', 'navy', 'purple', 'fuchsia'] // Selectable colors.
    , pd = 200 * scale // Pallete diameter.
    , ph = pd / 2 // Half pallete diameter, used frequently.
    , pr = 70 * scale // Distance from the center of the pallete to each radius.
    , cr = 15 * scale // Radius of each color on the pallete.
		, mr = 6 // marker radius
    , er = 50 // eraser radius
		, sm = 50 // radius max
    , c_head = 'M 10 30 L 30 30 L 30 10 L 70 10 L 70 30 L 90 30 L 80 90 L 20 90 L 10 30 Z' // Path describing capped marker head.
    , c_body = 'M 30 90 Q 10 90 10 110 L 10 180 L 90 180 L 90 110 Q 90 90 70 90 L 30 90 Z' // Path describing capped marker body.
    , u_head = 'M 35 33 L 35 55 L 65 55 L 65 17 L 35 33 Z' // Path describing uncapped marker head.
    , u_body = 'M 30 90 Q 10 90 10 110 L 10 180 L 90 180 L 90 110 Q 90 90 70 90 L 67 90 L 67 55 L 33 55 L 33 90 L 30 90 Z' // Path describing uncapped marker body.
    , e_paths = [ 'M 16 40 Q 14 42 15 45 L 52 78 Q 54 80 58 78 L 88 65 Q 89 62 86 59 L 86 57 Z' // Paths describing the eraser body.
                , 'M 13 19 L 43 11 L 88 37 L 54 48 L 13 19 Z'
                , 'M 13 19 L 16 41 L 55 74 L 87 61 L 88 37 L 54 48 L 13 19 Z' ]
    , m_held = -1 // index of the selected marker when holding
    , marker_els = null // d3 selection of the marker icons
		, scale_el = null // d3 selection of the scaling interface elements
    , eraser_el = null  // d3 selection of the eraser icon elements
    , pallete_el = null // d3 selection of the palette graphics
		, s_center = null // absolute cx, cy of the scale interface elements
		, abs_sr = null // absolute radius of the scale interface elements
		, m_scale = 1.0 // ratio of marker icon size to size as it's being used.
		, e_scale = 1.0 // ratio of eraser icon size to size as it's being used.

    var markers_instance = function(container) {
      svg = container;
      init();
      return this;
    }

    markers_instance.pos = function(arg) {
      if (arguments.length == 0) return [x,y];
      x = arg[0]; y = arg[1];
      if (svg) position_elements();
      return this;
    }

    markers_instance.marker = function(arg) {
      if (arguments.length == 0) return curr_idx;
      selectMarker(arg);
      return this;
    }

    markers_instance.color = function() {
      return markers[curr_idx];
    }

    markers_instance.scale = function(arg) {
      if (arguments.length == 0) return scale;
      scale = arg;
      return this;
    }
    
    /** Draws all the markers, the palette and the eraser icon. Selects the first marker. */
    function init() {
      /* Instantiate three separate mtouch variables for the markers, the pallete & the eraser,
       * to produce different actions depending on the element touched. */
      var m_mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function (d,i) { 
          dispatch.focus(); 
          selectMarker(i) 
        })
				.on('hold', function (d, i) {
          dispatch.focus(); 
          m_hold(d, i); 
        }); 

      var p_mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function (d) {
          dispatch.focus();
          p_tap(d); 
        }); 

			var s_mtouch = mtouch_events()
				.frame(svg.node())
				.on('drag', function (d) {
          dispatch.focus(); 
          s_drag(d); 
        }); 
				
      var e_mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function (d) {
          dispatch.focus();
          e_tap(d); 
        }); 

      /* Bind the markers list (a list of HTML named colors) to a selection. */
      marker_els = svg.selectAll('.marker_els')
				.data(markers);

      marker_els.enter().append('svg')
				.classed('marker_els', true)
				.call(m_mtouch);

      /* Draw two paths for each marker, which change when marker is capped or uncapped.
       * The first path serves as the marker cap & the marker tip.
       * The second path serves as the body of the marker when the cap is on,
       * & has an alternative appearance when the cap is off.
       * Two paths are used because one is filled & the other is stroked (& filled with the quaternary color). */
      marker_els.append('path')
				.classed('pathhead', true)
				.attr('d', c_head)
				.attr('transform', 'scale(' + (scale * 0.5) + ')')
				.style('fill', function (d) { return d === scheme.s ? scheme.q : d; })
				.style('stroke', function (d) { return d === scheme.s ? d : 'none'; })
				.style('stroke-width', '6')
				.style('stroke-linejoin', 'round');

      marker_els.append('path')
				.classed('pathBody', true)
				.attr('d', c_body)
				.attr('transform', 'scale(' + (scale * 0.5) + ')')
				.style('fill', scheme.q)
				.style('stroke', function (d) { return d; })
				.style('stroke-width', '6')
				.style('stroke-linejoin', 'round');

      /* Append an svg to contain the color pallete.
       * Placed offscreen (x = -width) & kept there when not in use. */
      pallete_el = svg.append('svg')
				.classed('pallete', true)
				.style('display', 'none');

      /* Create a g element to contain the visual elements that make up the pallete background. */
      var pallete_bg = pallete_el.append('g')

      /* Draws a triangle with an angle pointing down centered in the markers_instanceddle of the background,
       * intended to point to the currently selected marker. */
      pallete_bg.append('path')
				.attr('d', 'M 0 ' + ph + ' L ' + pd + ' ' + ph + ' L ' + ph + ' ' + (pd + 10) + ' L 0 ' + ph + ' Z')
				.style('fill', scheme.s);
				
      /* Draws a circle behind the pallete colors. */
      pallete_bg.append('circle')
				.attr('cx', ph)
				.attr('cy', ph)
				.attr('r', ph)
				.style('fill', scheme.s);

      /* Bind the pallete colors list (a list of HTML named colors) to a selection. */
      var pallete_els = pallete_el.selectAll('.pallete_els')
				.data(p_colors);

      /* Spread the pallete colors evenly along the perimeter of a circle of radius cr */
      pallete_els.enter().append('circle')
				.classed('pallete_els', true)
				.attr('cx', function (d, i) { return ph + Math.cos(2 * (i + 1) * Math.PI / p_colors.length) * pr; })
				.attr('cy', function (d, i) { return ph + Math.sin(2 * (i + 1) * Math.PI / p_colors.length) * pr; })
				.attr('r', cr)
				.style('fill', function (d) { return d; })
				.call(p_mtouch);

      /* Append an svg to contain the eraser. */
      eraser_el = svg.append('svg')
				.call(e_mtouch);

			/* Append the paths that make up the isomorphic appearance of the eraser icon. */
			eraser_el.append('path')
				.attr('d', e_paths[0])
				.attr('fill', scheme.t);

			eraser_el.append('path')
				.attr('d', e_paths[1])
				.attr('fill', scheme.s);

			eraser_el.append('path')
				.attr('d', e_paths[2])
				.attr('fill', scheme.p);

      position_elements();

			/* Calculate the maximum absolute size of the scale, and the coordinates.
			 * Attr * 1 converts the returned string value to an int. */
			abs_sr = sm * scale * 0.8;

      selectMarker(0);
    }

    /** Sets the position of markers, eraser and pallete relative to x, y */
    function position_elements() {
      marker_els.attr('x', function (d, i) { return x + i * scale * 60; })
				.attr('y', y);
      eraser_el.attr('x', x + markers.length * scale * 60 )
				.attr('y', y + scale * 5)
      pallete_el.attr('y', (y - pd - 15));
    }


    /* Takes the index of the marker to uncap,
     * & caps all other markers.
     * Since this function is only called when the pallete is visible,
     * & by calling this function a marker or color has been selected,
     * this function also hides the pallete off-screen (in its intial position). */
    function uncapMarker (u) {
			marker_els.select('.pathhead')
				.attr('d', function (d, i) { return i === u ? u_head : c_head; })
				.style('fill', function (d) { return d === scheme.s ? scheme.q : d; })
				.style('stroke', function (d) { return d === scheme.s ? d : 'none'; });
			marker_els.select('.pathBody')
				.attr('d', function (d, i) { return i === u ? u_body : c_body; })
				.style('stroke', function (d) { return d; });
			if (u !== -1) eraser_el.select('#eraser').style('fill', markers[curr_idx]);
			pallete_el.style('display', 'none');
			m_held = -1;
    }

    /** Selects the marker with the passed index. */
    var selectMarker = function(i) {
      if (i<-1 || i>=markers.length || markers[i] == scheme.s) return;
      curr_idx = i;
      uncapMarker(i);
      if (i !== -1) {
				dispatch.marker(markers[i], mr * 0.3 * m_scale);
			}
    }

    /* Positions the color pallete over the marker being held,
     * unless the black marker is being held (unchangeable).
     * dx is the x position of the marker.
     * dw is the x position of the center of the marker.
     * pd is the x position of the center of the color pallete.
     * The final value accounts for the small left offset from using two center values.
     * The function getBBox also under compensates by about 4 pixels per dimension.
     * Offset doesn't need to scale with contributing elements (keep it at 5). */
    function m_hold (d, i) {
			if (i !== 0) {
				var el = marker_els.filter(function (e, j) { return j === i; })
					, dx = el.attr('x') * 1.0
					, dw = el.node().getBBox().width / 2
				pallete_el.attr('x', dx + dw - ph + scale * 5)
					.style('display', 'block');
				m_held = i;
			}
    }

    /* Sets the color of the selected marker to the selected pallete color.
     * Refreshes the marker elements' data set.
     * Simulates tapping the selected marker. */
    function p_tap (d) {
			markers[m_held] = d;
			marker_els = svg.selectAll('.marker_els').data(markers);
			selectMarker(m_held);
    }

		/* Adjusts the scaler depending on the distance of a drag from the center of the scaling interface to the finger position.
		 * Alerts the canvas to the updated radius of the marker or eraser. */
		function s_drag (d) {
			var pos = d3.event.finger.pos
			  , dist = Math.sqrt(Math.pow(s_center[0] - pos[0], 2) + Math.pow(s_center[1] - pos[1], 2))
				, size = dist / abs_sr;
			if (size > 1.0) size = 1.0;
			if (size < 0.12) size = 0.12;
			if (curr_idx > -1) { // Adjust marker settings.
				mr = abs_sr * size / scale / 0.8;
				dispatch.marker(markers[curr_idx], mr * 0.8 * m_scale);
			} else {	// Adjust eraser settings.
				er = abs_sr * size / scale / 0.8;
				dispatch.eraser(er * 0.8 * e_scale);
			}
			scaler.attr('r', sm * size);
		}

		/* Calls the function associated with tapping the eraser. */
    function e_tap (d) {
      selectMarker(-1);
      dispatch.eraser(er * 0.8 * e_scale);
    }

  return d3.rebind(markers_instance, dispatch, "on");
};

gmath.ui = gmath.ui || {};
gmath.ui.Markerssidebar = Markerssidebar;
Undo = function (scheme) {

	var dispatch = d3.dispatch('undo');
	
	var svg = null
	  , button = null
		, pos = [0, 0]; 

	var un = function (container) {
		svg = container;
		init();
		return this;
	}; 
	
	un.pos = function (_pos) {
		pos = _pos; 
		if (button) {
			button.attr('x', pos[0])
				.attr('y', pos[1]); 
		}
		return this; 
	}; 
	
	var init = function () {
		button = svg.append('svg')
			.attr('x', pos[0])
			.attr('y', pos[1]) 
			.on('click', function () {
				dispatch.undo(); 
			});
		button.append('rect')
			.attr('width', 50)
			.attr('height', 50)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('fill', scheme.s);
		button.append('path')
			.attr('d', 'M 15 50 Q 15 85 50 85 Q 85 85 85 50 Q 85 15 50 15')
			.attr('transform', 'scale(0.5)') 
			.style('stroke', scheme.q)
			.style('stroke-width', '6')
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round')
			.style('fill', 'none');
		button.append('path')
			.attr('d', 'M 50 10 L 50 20 L 40 15 L 50 10 Z')
			.attr('transform', 'scale(0.5)') 
			.style('stroke', scheme.q)
			.style('stroke-width', '6')
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round')
			.style('fill', scheme.q);
	}; 
	
	return d3.rebind(un, dispatch, 'on');

}; 

gmath.ui = gmath.ui || {};
gmath.ui.Undo = Undo; 


Redo = function (scheme) {

	var dispatch = d3.dispatch('redo');

	var svg = null
	  , button = null
		, pos = [0, 0];

	var re = function (container) {
		svg = container;
		init();
		return this;
	};

	re.pos = function (_pos) {
		pos = _pos;
		if (button) {
			button.attr('x', pos[0])
				.attr('y', pos[1]);
		}
		return this;
	};

	var init = function () {
		button = svg.append('svg')
			.attr('x', pos[0])
			.attr('y', pos[1])
			.on('click', function () {
				dispatch.redo();
			});
		button.append('rect')
			.attr('width', 50)
			.attr('height', 50)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('fill', scheme.s);
		button.append('path')
			.attr('d', 'M 15 50 Q 15 85 50 85 Q 85 85 85 50 Q 85 15 50 15')
			.attr('transform', 'translate(50,0)scale(-0.5,0.5)')
			.style('stroke', scheme.q)
			.style('stroke-width', '6')
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round')
			.style('fill', 'none');
		button.append('path')
			.attr('d', 'M 50 10 L 50 20 L 40 15 L 50 10 Z')
			.attr('transform', 'translate(50,0)scale(-0.5,0.5)')
			.style('stroke', scheme.q)
			.style('stroke-width', '6')
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round')
			.style('fill', scheme.q);
	};

	return d3.rebind(re, dispatch, 'on');

};

gmath.ui = gmath.ui || {};
gmath.ui.Redo = Redo;


Scroll = function (scheme, canvasController) {

	var dispatch = d3.dispatch('focus', 'scroll');

	var svg = null
	  , track = null
		, bar = null
		, pos = [0, 0]
		, scrolling = false
		, scroll_y = 42
		, scroll_loop = null
		, autorelease = false;

	var sb = function (container) {
		svg = container;
		init();
		return this;
	};

	sb.pos = function (_pos) {
		pos = _pos;
		if (track) {
			track.attr('x', pos[0])
				.attr('y', pos[1]);
		}
		return this;
	};

	var init = function () {
		var mtouch = mtouch_events()
			.frame(svg.node())
			.on('drag', function () {
				dispatch.focus();
				bar_drag();
			})
			.on('release', bar_release)
			.call(canvasController.tx_behavior());
		track = svg.append('svg')
			.attr('x', pos[0])
			.attr('y', pos[1]);
		track.append('rect')
			.attr('width', 50)
			.attr('height', 84)
			.attr('fill', 'none');
		track.append('rect')
			.attr('x', 20)
			.attr('y', 2)
			.attr('width', 10)
			.attr('height', 80)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('fill', scheme.s);
		bar = track.append('circle')
			.attr('cx', 25)
			.attr('cy', 42)
			.attr('r', 15)
			.attr('fill', scheme.q)
			.attr('stroke', scheme.s)
			.attr('stroke-width', 3)
			.call(mtouch);
	};

	var distance = function (a, b) {
		return Math.pow((Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)), 0.5);
	};

	var bar_drag = function () {
		var f_pos = d3.event.finger.pos.slice();
		if (distance(f_pos, pos) > 200 && autorelease) {
			bar_release();
		} else {
			scroll_y = f_pos[1] - pos[1];
			if (scroll_y < 17) scroll_y = 17;
			if (scroll_y > 67) scroll_y = 67;
			bar.attr('cy', scroll_y);
		}
		if (!scrolling) {
			scrolling = true;
			scroll_loop = setInterval(function () {
				var delta = 42 - scroll_y
					, cy = canvasController.scroll() + delta;
				if (cy > 0) cy = 0;
				canvasController.scroll(cy);
				dispatch.scroll(cy);
			}, 20);
		}
	};

	var bar_release = function () {
		bar.attr('cy', 42);
		scrolling = false;
		clearInterval(scroll_loop);
	};

	return d3.rebind(sb, dispatch, 'on');

};

gmath.ui = gmath.ui || {};
gmath.ui.Scroll = Scroll;
Download = function (scheme) {
	
  var dispatch = d3.dispatch('download'); 
  
  var svg = null
	  , button = null
		, pos = [0, 0]; 
  
  var dl = function (container) {
    svg = container;
    init(); 
    return this; 
  };  
	
	dl.pos = function (_pos) {
		pos = _pos;
		if (button) { 
			button.attr('x', pos[0])
				.attr('y', pos[1]); 
		}
		return this;
	}; 
  
  var init = function () {
    button = svg.append('svg')
			.attr('x', pos[0])
			.attr('y', pos[1]) 
      .on('click', function () {
				dispatch.download(); 
			}); 
		button.append('rect')
			.attr('width', 50)
			.attr('height', 50)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('fill', scheme.s); 
		button.append('path')
			.attr('d', 'M 35 10 L 35 50 L 15 50 L 50 90 L 85 50 L 65 50 L 65 10 L 35 10 Z')
			.attr('transform', 'scale(0.5)') 
			.style('stroke', scheme.q)
			.style('stroke-width', '6')
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round')
			.style('fill', 'none');
  }; 
  
  return d3.rebind(dl, dispatch, 'on');
  
};

gmath.ui = gmath.ui || {};
gmath.ui.Download = Download;

Upload = function (scheme) {

	var dispatch = d3.dispatch('upload', 'focus'); 

	var svg = null
	  , button = null
		, pos = [0, 0]; 
	
	var ul = function (container) {
		svg = container;
		init();
		return this; 
	};
	
	ul.pos = function (_pos) {
		pos = _pos; 
		if (button) {
			button.attr('x', pos[0])
				.attr('y', pos[1]); 
		}
		return this;
	};

	var init = function () {
		d3.select('html')
			.append('input')
			.attr('id', 'upload')
			.attr('type', 'file')
			.style('display', 'none');
		d3.select('#upload')
			.node()
			.addEventListener('change', fileSelect); 
		button = svg.append('svg')
			.attr('x', pos[0])
			.attr('y', pos[1])
			.on('click', function () {
				dispatch.focus();
				upload(); 
			});
		button.append('rect')
			.attr('width', 50)
			.attr('height', 50)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('fill', scheme.s); 
		button.append('path')
			.attr('d', 'M 35 10 L 35 50 L 15 50 L 50 90 L 85 50 L 65 50 L 65 10 L 35 10 Z')
			.attr('transform', 'scale(0.5) rotate(180 50 50)') 
			.style('stroke', scheme.q)
			.style('stroke-width', '6')
			.style('stroke-linejoin', 'round')
			.style('stroke-linecap', 'round')
			.style('fill', 'none');
	}; 
	
	var fileSelect = function (evt) {
    var file = evt.target.files[0]; 
    if (!file.name.match(/\.json$/)) {
      console.log('Uploading requires a .JSON file.');  
      return; 
    } else {
      var reader = new FileReader(); 
      reader.onload = (function (f) {
        return function (e) {
          dispatch.upload(JSON.parse(e.target.result));  
        }; 
      })(file); 
      reader.readAsText(file); 
    } 
  }; 

	var upload = function () {
		d3.select('#upload').node().click(); 
	};
	
	return d3.rebind(ul, dispatch, 'on');

}; 

gmath.ui = gmath.ui || {}; 
gmath.ui.Upload = Upload; 

	HWRUI = function (scheme) {

	var dispatch = d3.dispatch('hwr');

	var svg = null
	  , button = null
		, pos = [0, 0]
		, state = true
		, animating = false;

	var hwr = function (container) {
		svg = container;
		init();
		return this;
	};

	hwr.pos = function (arg) {
		if (!arguments.length) return pos;
		pos = arg.slice();
		if (button) button.attr('transform', 'translate('+pos+')');
		return hwr;
	};

	hwr.animating = function(arg) {
		if (!arguments.length) return animating;
		if (animating === arg) return hwr;
		animating = arg;
		if (animating) button.call(wobble);
		else button.interrupt().attr('transform', 'translate('+pos+')').transition();
		return hwr;
	}

	var wobble = function(sel) {
		var bbox = sel.node().getBBox();
		var dpos = ' ' + (bbox.width/2) + ' ' + (bbox.height/2);
		sel.transition()
			 .duration(100)
			 .attr('transform', 'translate('+pos+')rotate(-5'+dpos+')')
			 .each('end', repeat);
		function repeat() {
			sel.transition()
				 .duration(200)
			   .attr('transform', 'translate('+pos+')rotate(5'+dpos+')')
			   .transition()
			   .duration(200)
			   .attr('transform', 'translate('+pos+')rotate(-5'+dpos+')')
			   .each('end', repeat);
		}
	}

	hwr.state = function(arg) {
		if (!arguments.length) return state;
		state = arg;
		if (button) {
			button.select('rect').attr('fill', state ? scheme.s : scheme.t);
		}
		dispatch.hwr(state);
		return hwr;
	}

	hwr.toggle = function() {
		hwr.state(!state);
	}

	var init = function () {
		button = svg.append('g')
			.attr('transform', 'translate('+pos+')')
			.on('click', hwr.toggle)
			.style('cursor', 'pointer');
		button.append('rect')
			.attr('width', 50)
			.attr('height', 50)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('fill', state ? scheme.s : 'silver');
		button.append('text')
			.text('HWR')
			.attr('x', 25)
			.attr('y', 30)
			.attr('font-family', 'arial')
			.attr('text-anchor', 'middle')
			.attr('fill', scheme.q);
	};

	return d3.rebind(hwr, dispatch, 'on');

};

gmath.ui = gmath.ui || {};
gmath.ui.HWRUI = HWRUI;
// Copyright Erik Weitnauer, 2014.
// Created by Christian Achgill.

/** A trimmed down combination of a single marker and an eraser. 
 * Note that marker color cannot be changed. 
 */
DrawEraseToggle = function (scheme) { // Takes a color scheme {p (primary), s (secondary), t (tertiary), q (quaternary)}
  
  var dispatch = d3.dispatch('mode', 'focus'); // events

  var svg = null // container to draw into
    , x = 0      // x position of UI
    , y = 0      // y position of UI
    , c_head = 'M 10 30 L 30 30 L 30 10 L 70 10 L 70 30 L 90 30 L 80 90 L 20 90 L 10 30 Z' // Path describing capped marker head.
    , c_body = 'M 30 90 Q 10 90 10 110 L 10 180 L 90 180 L 90 110 Q 90 90 70 90 L 30 90 Z' // Path describing capped marker body.
    , u_head = 'M 35 33 L 35 55 L 65 55 L 65 17 L 35 33 Z' // Path describing uncapped marker head.
    , u_body = 'M 30 90 Q 10 90 10 110 L 10 180 L 90 180 L 90 110 Q 90 90 70 90 L 67 90 L 67 55 L 33 55 L 33 90 L 30 90 Z' // Path describing uncapped marker body.
    , e_paths = [ 'M 16 40 Q 14 42 15 45 L 52 78 Q 54 80 58 78 L 88 65 Q 89 62 86 59 L 86 57 Z' // Paths describing the eraser body.
                , 'M 13 19 L 43 11 L 88 37 L 54 48 L 13 19 Z'
                , 'M 13 19 L 16 41 L 55 74 L 87 61 L 88 37 L 54 48 L 13 19 Z' ]
    , toggle_el = null // d3 selection of the toggle button 
    , marker_el = null // d3 selection of the marker icons
    , eraser_el = null  // d3 selection of the eraser icon elements
    , draw = true; 

    var markers_instance = function(container) {
      svg = container;
      init();
      return this;
    }

    markers_instance.pos = function(arg) {
      if (arguments.length == 0) return [x,y];
      x = arg[0]; y = arg[1];
      if (svg) position_elements(draw);
      return this;
    }
    
    function init() {

      var mtouch = mtouch_events()
				.frame(svg.node())
				.on('tap', function () { 
          dispatch.focus(); 
          draw = !draw; 
          setMode(draw); 
        }); 
        
      toggle_el = svg.append('svg')
        .call(mtouch);  
        
      toggle_el.append('circle')
        .attr('cx', 50)
        .attr('cy', 50) 
        .attr('r', 48)
        .style('fill', 'whitesmoke')
        .style('stroke', 'silver')
        .style('stroke-width', 1); 
      
      marker_el = toggle_el.append('svg'); 

      marker_el.append('path')
				.classed('pathhead', true)
				.attr('d', c_head)
				.style('fill', 'black')
				.style('stroke', 'black')
				.style('stroke-width', '6')
				.style('stroke-linejoin', 'round');

      marker_el.append('path')
				.classed('pathBody', true)
				.attr('d', c_body)
				.style('fill', scheme.q)
				.style('stroke', 'black')
				.style('stroke-width', '6')
				.style('stroke-linejoin', 'round');
        
      eraser_el = toggle_el.append('svg'); 

			eraser_el.append('path')
				.attr('d', e_paths[0])
				.attr('fill', scheme.t);

			eraser_el.append('path')
				.attr('d', e_paths[1])
				.attr('fill', scheme.s);

			eraser_el.append('path')
				.attr('d', e_paths[2])
				.attr('fill', scheme.p);

      setMode(draw); 
    }

    var position_elements = function (m) {
      toggle_el.attr('x', x) 
        .attr('y', y); 
      marker_el.attr('x', m ? 18 : 22)
				.attr('y', m ? 21 : 30);
      marker_el.selectAll('path')
        .attr('transform', m ? 'scale(0.3)' : 'scale(0.2)');
      eraser_el.attr('x', m ? 47 : 42)
				.attr('y', m ? 33 : 28); 
      eraser_el.selectAll('path')
        .attr('transform', m ? 'scale(0.4)' : 'scale(0.5)'); 
    }

    var uncapMarker = function (m) {
			marker_el.select('.pathhead')
				.attr('d', m ? u_head : c_head);
			marker_el.select('.pathBody')
				.attr('d', m ? u_body : c_body);
    }
    
    var setMode = function (m) {
      uncapMarker(m); 
      position_elements(m); 
      if (m) {
        dispatch.mode('draw'); 
      } else {
        dispatch.mode('erase'); 
      } 
    }

  return d3.rebind(markers_instance, dispatch, "on");
};

gmath.ui = gmath.ui || {};
gmath.ui.DrawEraseToggle = DrawEraseToggle;
/* Local use only:
l=document.createElement("link");l.href="http://localhost:8000/examples/fonts/fonts.css";
l.rel='stylesheet';document.getElementsByTagName("head")[0].appendChild(l);
var dt=document.createElement("script"),gm=document.createElement("script");dt.src="http://localhost:8000/libs/d3/d3.min.js";gm.src="http://localhost:8000/graspablemath.js" ;dt.charset="utf-8";gm.charset="utf-8";document.body.appendChild(dt);document.body.appendChild(gm);scriptCheck=setInterval(function(){if(typeof(d3)!=="undefined"&&typeof(gmath)!=="undefined"){if(GMify(true)){console.log("GMify() ran successfully.");}clearInterval(scriptCheck)}},100)
*/

tryGMCreate = function(location, text, width, height) {
	var has_tfrac = (text.indexOf('tfrac') !== -1);
	var svg = location
	                  .insert('svg', '.mwe-math-fallback-png-inline')
	                  .style('overflow', 'visible')
	                  .style({width: width
	                  		 , height: height})
					, options = { font_size: 20
										, h_align: 'left'
										, v_align: 'top'
										, background_color: 'none'
										, border_color: 'none'
										, history: false
										, padding: {left: 0, right: 0, top: 0, bottom: 0}
	                  , color: 'green'
	        					, pos: [0,0]
	        					, id: gmath.uid()
	        					, eq: text
	        					, standalone: true
	        					, no_handles: true
	        					, no_history: true
	        					, fraction_size_factor: (has_tfrac ? 0.7 : 1) }
	var id = gmath.uid();
	var dl = new DerivationList(svg.node(), options)
	var adapt_size = function(event) {
		var dl = event.target;
		var bbox = dl.getLastView().getBBox();
		dl.svg.style({width: bbox.width+'px', height: bbox.height+'px'});
	}
	dl.events.on('change.'+id, adapt_size);
	adapt_size({ target: dl });
}

GMify = function (addBanner) {
	// If this option is set to true, append a banner to the top of the page showing that the site has been modified by Graspable Math.
	if (addBanner) {
		var bannerDiv = d3.select('html')
			.append('div')
			.attr('id', 'gmbanner')
			.style('width', '100%')
			.style('height', '99px')
			.style('background-color', 'rgba(245, 245, 245, 1.0)')
			.style('border-bottom', '1px green solid')
			.style('position', 'absolute')
			.style('top', -100)
			.style('left', 0)
			.style('z-index', 9999);
		var center = bannerDiv.append('center')
		center.append('img')
			.attr('src', 'http://graspablemath.com/demos/wiki/minilogo.png')
			.style('margin-top', '15px');
		center.append('p')
			.text('Graspable Math')
			.style('color', 'green')
			.style('font-family', 'cambria')
			.style('font-size', '36px')
			.style('vertical-align', '-16px')
			.style('text-shadow', '1px 1px silver')
			.style('display', 'inline')
		// The banner will slide off-screen after 2 seconds.
		var i = 0;
		var slideDownInterval = setInterval(function () {
				i += 2;
				bannerDiv.style('top', (i - 100) + 'px');
				if (i === 100) {
					clearInterval(slideDownInterval);
				}
		}, 1);
		var slideUpTimer = setTimeout(function () {
			i = 0;
			var slideUpInterval = setInterval(function () {
				i += 1;
				bannerDiv.style('top', -i + 'px');
				if (i === 100) {
					clearInterval(slideUpInterval);
				}
			}, 2);
			clearTimeout(slideUpTimer);
		}, 4000);
	}

	// Select the elements on the page which contain code snippets
	var codeSnippets  = d3.selectAll('code');
	codeSnippets.each(function(){
		var snippet=d3.select(this);
		var snippetText = snippet.html();
		console.log(snippetText);

		try {
		 snippet.html("");
		 tryGMCreate(snippet, snippetText, "200px", "100px");
		} catch (err) {
 	    console.log("caught error:", err);
 	    console.log("Could not convert code snippet. Tried:", snippetText);
			console.log(snippet.node());
			console.log("");
		}
	});

	// Select the elements on the page which contain LaTeX expressions in their alt attributes.
	var eq_els = d3.selectAll('img.tex'); // .mwe-math-fallback-png-inline
	// // For each element, parse the LaTeX expression and replace the element with the equivalent GM expression.
	var divNum = 0;
	coordinator = new DLCoordinator();
	eq_els.each(function () {
	 	// Distinguish between DOM elements and their contained LaTeX expressions.
	 	var img = d3.select(this)
	 	  , exp = img.attr('alt');
	 	// These LaTeX expressions have no GM equivalent. If a LaTeX expression
	 	// can't be parsed into a GM expression, leave the element containing the
	 	// LaTeX expression as it is.
	 	var convertible = exp.search(/\\begin|\\det|\\overrightarrow|\\cdots|\\cup|\\mid|\\in|_/);
	 	if (convertible !== -1) {console.log('cant parse', exp); return }
	 	// Regexp searches on strings the index at which the search term is found,
	 	// or -1 if the search finds nothing.
 		// Scrub whitespaces.
 		exp = exp.replace(/\s/g, '');
 		// Scrub extra backslashes and various punctuations.
 		exp = exp.replace(/\\,|\\$|[,.]|/g, '');
 		var has_tfrac = (exp.indexOf('tfrac') !== -1);
    // Convert tfracs to fracs.
 		exp = exp.replace(/\\tfrac/g, '\\frac');
		// Select this DOM element and insert a GM expression at its position.

		if(this.parentNode.childElementCount > 1){
			$(this).wrap( "<div></div>" );
		}
		try {
			var imgContainer = d3.select(this.parentNode)
				.style('display', 'inline-block');
			var options = { font_size: 20
									, h_align: 'left'
									, v_align: 'top'
									, background_color: 'none'
									, border_color: 'none'
									, history: false
									, padding: {left: 0, right: 0, top: 0, bottom: 0}
									, pos: [0,0]
									, color: 'green'
									, id: gmath.uid()
									, eq: exp
									, no_handles: true
									, no_history: true
									, fraction_size_factor: (has_tfrac ? 0.7 : 1) };

			var adapt_size = function(event) {
				var dl = event.callingDl;
				var newWidth = dl.dims.width+'px';
				var newHeight = dl.dims.height+5+'px';
				d3.select(dl.container().parentNode)
					.style('width', newWidth)
					.style('height', newHeight);
			}
			var id = gmath.uid();

			var dl = DerivationList.createStandalone(imgContainer.node(), options, function (dl) {
			 	adapt_size({callingDl: dl})
			 });
			coordinator.addDL(dl);
			dl.getLastModel().events.on('change.'+id, function(event){adapt_size({ callingDl: dl })});
			img.remove();
		} catch (err) {
			console.log("caught error:", err);
			console.log("Could not convert img with alt text:", img.attr('alt'),
				", tried:", exp);
			//remove the svg element added by DerivationList.createStandalone
			//d3.selectAll(this.parentNode.childNodes).select('svg').remove();
			var theseElements = this.parentNode.childNodes;
			for (var i = 0; i < theseElements.length;i++){
				if (theseElements[i].nodeName == 'svg'){
					theseElements[i].remove();
				}
			}
		}
	});
	return true;
};
// This is primarily a plugin for Google Chrome.  It inserts a div into a webpage, 
// and starts Graspable Math, so that text and images with alt text can be dragged from 
// the webpage and dropped into GM.  Currently called with no arguments.


wikiSidebar = function () {

	if(d3.select('#wikiBar').node()==null) {
		// If it is not there, load it.
		DerivationList.defaultOptions.hoverable = true;
		loadFonts();
		var contentHeight;
		var sidebarDiv = createWikiBarDiv();
		addLogo();
		addTextBox();
		addResizeDiv();
		addHoverDiv();

		d3.select('head').append('style')
			.attr('type', 'text/css')
			.html('#wikiBar button:hover { background-color: #bbb; }' +
			'#wikiBar button { background-color: #ddd; }');

		startCanvas();

	}else if (d3.select('#wikiBar').node().clientWidth==0){
		// If hidden, unhide it.
		d3.select('#wikiBar').style('width', '20%');
		resizeContentDiv();
	}else if (d3.select('#wikiBar').node().clientWidth>0){
		// If unhidden, hide it.
		d3.select('#wikiBar').style('width', '0px');
		resizeContentDiv();
	}

	function loadFonts(){
		// preload fonts
		d3.select('body').append('span')
			.style({ postition: 'absolute', visibility: 'hidden'
				, 'font-family': 'Crimson Text' })
			.text('gm');
		d3.select('body').append('span')
			.style({ postition: 'absolute'
				, visibility: 'hidden'
				, 'font-family': 'Crimson Text Italics' })
			.text('gm');
	}

	function createWikiBarDiv(){
		//Put the existing page into a div, and create another div beside it.
		$("body").children().wrapAll("<div id='originalPage'></div>");
		contentHeight = d3.select('#originalPage').node().clientHeight;
		var sidebarDiv = d3.select('body')
			.append('div')
			.attr('id', 'wikiBar')
			.style({'width': '20%'
				,'height': 'contentHeight + "px"'
				,'background': 'white'
				,'position': 'absolute'
				,'top': '0'
				,'right': '0'
				,'z-index': '200'
				,'display': 'block'
		});
		return (sidebarDiv);
	}

	function addLogo(){
			var logo = sidebarDiv.append('div')
			.style({ position:'fixed'
				, top: 0
				, width: 'inherit'
				, background: 'whitesmoke'
				, 'text-align': 'center'
				,'z-index':'201'
			});
		logo.append('img')
			.attr('src', 'http://graspablemath.com/demos/gm-logo@2.png')
			.style({ 'height': '30px'
				, 'padding': '8px 8px 8px 16px'
				, 'vertical-align': 'middle'
			});
		logo.append('span')
		.text('Graspable Math')
		.style({
		'font-family': 'Lato'
				, 'font-size': '20px'
				, 'font-weight': '400'
				, 'color': '#676965'
				, 'margin': '0'
				, 'padding': '0'
				, 'padding-top': '5px'
				, 'vertical-align': 'middle'
			});
	}

	function addTextBox(){
		// Add text input box, and button.
		var textDiv = sidebarDiv.append('div')
		.style({ 'position': 'fixed'
			, 'top': '45px'
			, 'width': 'inherit'
			, 'background': 'whitesmoke'
			, 'padding-bottom': '8px'
			, 'border-bottom': '1px solid #ccc'
			, 'text-align': 'center'
			,'z-index':'201'
		});
		textDiv.append('input')
		.attr('type', 'text')
		.on('keypress', function() {
			var key = d3.event.which || d3.event.keyCode;
			if (key !== 13) return;
			enteredExpr(this.value);
			this.value = '';
		})
		.style({ 'width': 'calc(100% - 100px)'
			, 'font-size': '16px'
			, 'line-height': '1.5em'
			, 'color': 'gray'
			, 'max-width': '300px'
		});
		textDiv.append('button')
			.text('OK')
			.on('click', function() {
				var input = textDiv.select('input').node();
				enteredExpr(input.value);
				input.value = '';
			})
			.style({ 'margin-left': '5px'
				, 'width': '50px'
				, 'display': 'inline-block'
				, 'font-size': '16px'
				, 'line-height': '1.5em'
				, 'border-radius': '3px'
				, 'border': '1px solid silver'
				, 'height': '30px'
				, 'cursor': 'pointer'
			});
	}

	function addResizeDiv(){
		var resizeDiv = sidebarDiv.append('div')
			.attr('id','resizeDiv')
			.style({ 'position': 'absolute'
				, 'left': '0px'
				, 'width': '10px'
				, 'height': contentHeight + 'px'
				, 'background': 'silver'
				, 'cursor' : 'ew-resize'
				,'z-index':'200'
			});

		var dragResize = d3.behavior.drag()
			.on('drag', function() {
				// Determine resizer position relative to resizable (parent)
				var x = d3.mouse(this.parentNode)[0];
				// Avoid negative or too small widths
				var beforeWidth = d3.select('#wikiBar').node().clientWidth
				x = Math.max(250, x*(-1)+beforeWidth);
				resizeContentDiv();
				sidebarDiv.style('width', x + 'px');
			});
		resizeDiv.call(dragResize);
	}

	function resizeContentDiv(){
		var sideBarWidth = document.getElementById("wikiBar").clientWidth;
		var newContentWidth = (document.body.clientWidth - sideBarWidth);
		d3.select("#originalPage").style('width', newContentWidth+'px');

		if (typeof(markers)!="undefined")
			markers.pos([d3.select('#wikiBar').node().clientWidth/2-60,$(window).height()-180+document.body.scrollTop]);
		contentHeight = d3.select('#originalPage').node().clientHeight;
		d3.select('#wikiBar').style('height', contentHeight+'px');
		d3.select('#resizeDiv').style('height', contentHeight+'px');
	}

	function addHoverDiv(){
		var hoverDiv = d3.select('#wikiBar')
			.insert('svg')
			.attr('id','hovering')
			.style({'overflow': 'visible'
				,'width': '100px'
			 	,'height': '100px'
				,'position': 'fixed'
				,'left': '0'
				,'top': '0'
				,'z-index':'200'
			});
		hoverDiv.append('g');
	}

	function startCanvas(){
		components = Main({drawing: false},"#wikiBar",["100%","100%"]);
		components.ccontroller.markerRadius(2);
		markers = components.markerssidebar;
		erase = components.erase;

		svg = components.svg;
		svg.attr('id','wikiMainSvg')
			.style({'position': 'absolute'
				,'margin-top': '85px'
				,'margin-left': '10px'
				,'height': 'calc(100% - 85px)'
				,'width': 'calc(100% - 10px)'
				,'overflow': 'visible'
		});

		wm = components.cmodel;
		coordinator = new DLCoordinator();
		coordinator.subscribeToCanvasModel(wm);

		window.onscroll = function() {
			if (typeof(markers)!="undefined")
				markers.pos([d3.select('#wikiBar').node().clientWidth/2-60,$(window).height()-180+document.body.scrollTop]);
		}
		resizeContentDiv();
	}
}
  gmath.Tree = Tree;

  if (typeof module === "object" && module.exports) {
    module.exports = gmath;
  } else {
    this.gmath = gmath;
  }
})();
