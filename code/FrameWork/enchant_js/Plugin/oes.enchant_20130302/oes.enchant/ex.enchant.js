/**
 * ex.enchant.js
 * @version 0.1 (2012/6/7)
 * @requires enchant.js v0.4.3 or later
 * @author <a href="http://www20.atpages.jp/katwat/wp/">katwat</a>
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. 
 */
(function() {

var _parseFloat = function(v) {
		return parseFloat(v) || 0;
	};
	
/**
 * enchant.js を prototype 拡張したプロパティやメソッド。
 * @name enchant.Group
 * @constructor
 */

/**
 * 子ノードを全て削除する。
 */
enchant.Group.prototype.removeAllChildren = function() {
	while (this.childNodes.length > 0) {
		this.removeChild(this.childNodes[0]);
	}
};

/**
 * enchant.js を prototype 拡張したプロパティやメソッド。
 * @name enchant.Entity
 * @constructor
 */

/**
 * className に指定クラスを追加する。
 * @param {string} name 追加するクラス名。
 * @example
 * this.className = 'class1';
 * this.addClass('class2'); // -> this.className = 'class1 class2'
 */
enchant.Entity.prototype.addClass = function(name) {
	var names = this.className.split(/\s+/);
	if (names.some(function(v) {return v === name;})) {
		return;
	}
	names.push(name);
	this.className = names.join(' ');
};
/**
 * className から指定クラスを削除する。
 * @param {string} name 削除するクラス名。
 * @example
 * this.className = 'class1 class2 class3';
 * this.removeClass('class2'); // -> this.className = 'class1 class3';
 */
enchant.Entity.prototype.removeClass = function(name) {
	var names = this.className.split(/\s+/);
	names = names.filter(function(v) {return v !== name;});
	this.className = names.join(' ');
};
/**
 * 即時に描画を更新する。
 * 位置などの変更の更新は次のtickで行われるので、即時更新したい場合に使う。
 */
enchant.Entity.prototype.render = function() {
	this.dispatchEvent(new enchant.Event('render'));
};
/**
 * CSSボックスモデルにおける寸法を取得する。
 * <br>※ document に一時的なノードを追加して処理するので注意。
 * @param {Node | enchant.Entity} [parent] 一時的な親ノード。省略時は document.body 。
 * @returns {Object} 寸法をプロパティに持つオブジェクト。
 * プロパティの一覧。
 * <p>
 * .marginTop<br>
 * .marginLeft<br>
 * .marginBottom<br>
 * .marginRight<br>
 * .borderTopWidth<br>
 * .borderLeftWidth<br>
 * .borderBottomWidth<br>
 * .borderRightWidth<br>
 * .paddingTop<br>
 * .paddingLeft<br>
 * .paddingBottom<br>
 * .paddingRight<br>
 * .contentWidth<br>
 * .contentHeight<br>
 * </p>
 */
enchant.Entity.prototype.getBoxDimensions = function(parent) {
	var e = this._element.cloneNode(true),
		s,m;
	if (!parent) {
		parent = document.body;
	} else
	if (parent instanceof enchant.Entity) {
		parent = parent._element;
	}
	parent.appendChild(e);
	s = getComputedStyle(e,'');
	m = {};
	m.marginTop = _parseFloat(s.marginTop);
	m.marginLeft = _parseFloat(s.marginLeft);
	m.marginBottom = _parseFloat(s.marginBottom);
	m.marginRight = _parseFloat(s.marginRight);
	m.borderTopWidth = _parseFloat(s.borderTopWidth);
	m.borderLeftWidth = _parseFloat(s.borderLeftWidth);
	m.borderBottomWidth = _parseFloat(s.borderBottomWidth);
	m.borderRightWidth = _parseFloat(s.borderRightWidth);
	m.paddingTop = _parseFloat(s.paddingTop);
	m.paddingLeft = _parseFloat(s.paddingLeft);
	m.paddingBottom = _parseFloat(s.paddingBottom);
	m.paddingRight = _parseFloat(s.paddingRight);
	m.contentWidth = e.offsetWidth - m.borderLeftWidth - m.paddingLeft - m.paddingRight - m.borderRightWidth;
	m.contentHeight = e.offsetHeight - m.borderTopWidth - m.paddingTop - m.paddingBottom - m.borderBottomWidth;
	parent.removeChild(e);
	return m;
};
/**
 * CSSボックスモデルにおけるボックス幅を取得する。
 * <br>※ document に一時的なノードを追加して処理するので注意。
 * @param {Node | enchant.Entity} [parent] 一時的な親ノード。省略時は document.body 。
 * @returns {Number}
 */
enchant.Entity.prototype.getBoxWidth = function(parent) {
	var e = this._element.cloneNode(true),
		s,w;
	if (!parent) {
		parent = document.body;
	} else
	if (parent instanceof enchant.Entity) {
		parent = parent._element;
	}
	parent.appendChild(e);
	s = getComputedStyle(e,'');
	w = e.offsetWidth + _parseFloat(s.marginLeft) + _parseFloat(s.marginRight);
	parent.removeChild(e);
	return w;
};
/**
 * CSSボックスモデルにおけるボックス幅を設定する。
 * 実際にはボックス幅に応じて計算された値が this.width に設定される。
 * <br>※ document に一時的なノードを追加して処理するので注意。
 * @param {Number} w ボックス幅。
 * @param {Node | enchant.Entity} [parent] 一時的な親ノード。省略時は document.body 。
 */
enchant.Entity.prototype.setBoxWidth = function(w,parent) {
	var e = this._element.cloneNode(true),
		s;
	if (!parent) {
		parent = document.body;
	} else
	if (parent instanceof enchant.Entity) {
		parent = parent._element;
	}
	parent.appendChild(e);
	s = getComputedStyle(e,'');
	this.width = w - _parseFloat(s.marginLeft) - _parseFloat(s.borderLeftWidth) - _parseFloat(s.paddingLeft) - _parseFloat(s.paddingRight) - _parseFloat(s.borderRightWidth) - _parseFloat(s.marginRight);
	parent.removeChild(e);
};
/**
 * CSSボックスモデルにおけるボックス高さを取得する。
 * <br>※ document に一時的なノードを追加して処理するので注意。
 * @param {Node | enchant.Entity} [parent] 一時的な親ノード。省略時は document.body 。
 * @returns {Number}
 */
enchant.Entity.prototype.getBoxHeight = function(parent) {
	var e = this._element.cloneNode(true),
		s,h;
	if (!parent) {
		parent = document.body;
	} else
	if (parent instanceof enchant.Entity) {
		parent = parent._element;
	}
	parent.appendChild(e);
	s = getComputedStyle(e,'');
	h = e.offsetHeight + _parseFloat(s.marginTop) + _parseFloat(s.marginBottom);
	parent.removeChild(e);
	return h;
};
/**
 * CSSボックスモデルにおけるボックス高さを設定する。
 * 実際にはボックス高さに応じて計算された値が this.height に設定される。
 * <br>※ document に一時的なノードを追加して処理するので注意。
 * @param {Number} h ボックス高さ。
 * @param {Node | enchant.Entity} [parent] 一時的な親ノード。省略時は document.body 。
 */
enchant.Entity.prototype.setBoxHeight = function(h,parent) {
	var e = this._element.cloneNode(true),
		s;
	if (!parent) {
		parent = document.body;
	} else
	if (parent instanceof enchant.Entity) {
		parent = parent._element;
	}
	parent.appendChild(e);
	s = getComputedStyle(e,'');
	this.height = h - _parseFloat(s.marginTop) - _parseFloat(s.borderTopWidth) - _parseFloat(s.paddingTop) - _parseFloat(s.paddingBottom) - _parseFloat(s.borderBottomWidth) - _parseFloat(s.marginBottom);
	parent.removeChild(e);
};
/**
 * 内容や適用されているCSSに応じて、大きさ(width,height)を自動設定する。
 * <br>※ document に一時的なノードを追加して処理するので注意。
 * @param {Node | enchant.Entity} [parent] 一時的な親ノード。省略時は document.body 。
 * @example
 * var label = new Label('Hellow world !'); 
 * label.className = 'large';
 * label.autoSize();
 */
enchant.Entity.prototype.autoSize = function(parent) {
	var e,s;
	this._style.width = 'auto';
	this._style.height = 'auto';
	e = this._element.cloneNode(true);
	if (!parent) {
		parent = document.body;
	} else
	if (parent instanceof enchant.Entity) {
		parent = parent._element;
	}
	parent.appendChild(e);
	s = getComputedStyle(e,'');
	this.width = e.offsetWidth - _parseFloat(s.borderLeftWidth) - _parseFloat(s.paddingLeft) - _parseFloat(s.paddingRight) - _parseFloat(s.borderRightWidth);
	this.height = e.offsetHeight - _parseFloat(s.borderTopWidth) - _parseFloat(s.paddingTop) - _parseFloat(s.paddingBottom) - _parseFloat(s.borderBottomWidth);
	parent.removeChild(e);
};
/**
 * @scope enchant.Entity.prototype
 */
Object.defineProperties(enchant.Entity.prototype,{
	/**
	 * CSSのz-index値。
	 * @type Number
	 */
	z: {
		get: function() {return parseFloat(this._style.zIndex) || this._style.zIndex;},
		set: function(z) {this._style.zIndex = z;},
		enumerable: true
	},
	/**
	 * CSSボックスモデルにおけるボックス幅。
	 * 取得はgetBoxWidth()、設定はsetBoxWidth()で行われる。
	 * @type Number
	 */
	boxWidth: {
		get: function() {return this.getBoxWidth();},
		set: function(w) {this.setBoxWidth(w);}
	},
	/**
	 * CSSボックスモデルにおけるボックス高さ。
	 * 取得はgetBoxHeight()、設定はsetBoxHeight()で行われる。
	 * @type Number
	 */
	boxHeight: {
		get: function() {return this.getBoxHeight();},
		set: function(h) {this.setBoxHeight(h);}
	}
});

/**
 * enchant.js を prototype 拡張したプロパティやメソッド。
 * @name enchant.Surface
 * @constructor
 */

/**
 * CSSの background-image に設定できる形式に変換する。
 * @returns {String}
 */
enchant.Surface.prototype.toBackgroundImage = function() {
	return this._css || ( 'url(' + this.toDataURL() + ')' );
};

}());
