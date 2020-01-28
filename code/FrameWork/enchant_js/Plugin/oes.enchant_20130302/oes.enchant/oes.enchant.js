/**
 * oes.enchant.js
 * @version 0.4.9 (2013/3/2)
 * @requires enchant.js v0.4.3 or later
 * @requires tl.enchant.js v0.3.1 or later
 * @requires ex.enchant.js v0.1 or later
 * @author <a href="http://www20.atpages.jp/katwat/wp/">katwat</a>
 * @description
 * enchant.js extension for visual novel.
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

enchant.oes = {};

(function() {

var TOUCH_ENABLED = (function() {
		var div = document.createElement('div');
		div.setAttribute('ontouchstart', 'return');
		return typeof div.ontouchstart === 'function';
	}()),
	AUDIO_TYPES = (function() { // プレイ可能なaudioタイプ。
		var types,audio;
		try {
			audio = new Audio();
			// wav,ogg,mp3,aac
			types = ['audio/wav','audio/ogg','audio/mpeg','audio/mp4'].filter(function(v) {
				return audio.canPlayType(v);
			});
		}
		catch(e) {
			types = [ ];
		}
		return types;
	}()),
	_parseFloat = function(v) {
		return parseFloat(v) || 0;
	},
	getExt = function(src) {
		var a = src.match(/\.\w+$/);
		if (a) {
			return a[0].slice(1).toLowerCase();
		}
		a = src.match(/^data:\w+\/(\w+)/); // data URI
		if (a) {
			return a[1].toLowerCase();
		}
		return null;
	},
	control = null;

/**
 * @scope enchant.oes.OesControl.prototype
 */
enchant.oes.OesControl = enchant.Class.create({
	/**
	 * oesシステム制御のクラス。
	 * このクラスのインスタンスは生成してはいけない。
	 * 唯一の生成済みインスタンスが enchant.oes.OesControl.instance でアクセスできる。
	 * @constructs
	 */
	initialize: function() {
		if (arguments[0] !== Object.getOwnPropertyDescriptor(enchant.oes.OesControl, 'instance').get) {
			throw new Error();
		}
		/**
		 * ログを採るかどうか。
		 * @type Boolean
		 * @default false
		 */
		this.log = false;
		/**
		 * ログ最大ページ数。ゼロなら無制限。
		 * @type Number
		 * @default 100
		 */
		this.logPageMax = 100;
		/**
		 * ログにはHTMLタグも含むかどうか。
		 * @type Boolean
		 * @default false
		 */
		this.logHtmltag = false;
		/**
		 * オートプレイするかどうか。
		 * @type Boolean
		 * @default false
		 */
		this.autoplay = false;
		/**
		 * オートプレイ速度（自動入力するまでの待ち時間（秒））
		 * @type Number
		 * @default 0
		 */
		this.autoplayWait = 0;
		/**
		 * 既読スキップするかどうか。
		 * @type Boolean
		 * @default false
		 */
		this.skipread = false; 
		/**
		 * 既読スキップ速度（自動入力するまでの待ち時間（秒））
		 * @type Number
		 * @default 0
		 */
		this.skipreadWait = 0;
		this.clearLog();
	},
	/**
	 * ログをクリアする。
	 */
	clearLog: function() {
		this._logPages = [ ];
		this._logPage = '';
	},
	/**
	 * ログのテキストを取得。※このプロパティは読み取りのみ。
	 * @type String
	 */
	logText: {
		get: function() {
			return this._logPages.join('<br>') + (this._logPages.length > 0 ? '<br>' : '') + this._logPage;
		}
	},
	_logAdd: function(text) {
		if (this.log) {
			this._logPage += text;
		}
	},
	_logNewpage: function() {
		if (this.log) {
			this._logPages.push(this._logPage);
			if (this.logPageMax > 0 && this._logPages.length > this.logPageMax) {
				this._logPages.shift();
			}
			this._logPage = '';
		}
	},
	_logChosen: function(text) {
		if (this.log) {
			this._logAdd('◆' + text);
			this._logNewpage();
		}
	}
});
/**
 * oesシステム制御クラスの唯一のインスタンス。
 * @name enchant.oes.OesControl.instance
 * @type enchant.oes.OesControl
 */
Object.defineProperty(enchant.oes.OesControl,'instance',{
	get: function() {
		if (!control) {
			control = new enchant.oes.OesControl(arguments.callee);
		}
		return control;
	}
});
control = enchant.oes.OesControl.instance;
 
/**
 * @scope enchant.oes.OesScenario.prototype
 */
enchant.oes.OesScenario = enchant.Class.create(enchant.Scene, {
	/**
	 * oesシナリオのクラス。enchant.Scene を継承。
	 * title はセーブデータの識別キーとして使われるのでユニークな名前にする。
	 * @param {String} title
	 * @constructs
	 * @extends enchant.Scene
	 */
	initialize: function(title) {
		// enchant.Game.instance._element.id = title;
		enchant.Scene.call(this);
		/**
		 * タイトル名。
		 * @type String
		 */
		this.title = title;
		/**
		 * セーブデータ。
		 * @type enchant.oes.OesRecord
		 */
		this.record = new enchant.oes.OesRecord();
		/**
		 * シナリオ開始時に呼ばれる関数。
		 * @type Function
		 * @default null
		 */
		this.onenterscenario = null;
		/**
		 * シナリオ終了時に呼ばれる関数。
		 * @type Function
		 * @default null
		 */
		this.onexitscenario = null;
		this._chapters = [ ]; // OesChapter
		this._chapterIdx = -1;
	},
	/**
	 * シナリオに章を追加して子ノードとする。
	 * @param {String} label 章を識別するためのラベル名。
	 * @param {Function(enchant.oes.OesChapter)} builder 章を構築する関数
	 */
	addChapter: function(label,builder) {
		var c = new enchant.oes.OesChapter(this,builder);
		c.label = label;
		this._chapters.push(c);
		this.addChild(c);
		return c;
	},
	/**
	 * 指定した章へ進む。
	 * @param {Number | String} to 章のインデクス値またはラベル名。
	 */
	gotoChapter: function(to) {
		var i;
		if (typeof(to) === 'number') {
			if (to >= 0 && to < this._chapters.length) {
				this._chapterIdx = to;
				this._run();
				return;
			}
		} else
		if (typeof(to) === 'string') {
			for (i=0;i<this._chapters.length;i++) {
				if (this._chapters[i].label === to) {
					this._chapterIdx = i;
					this._run();
					return;
				}
			}
		}
		throw new Error('not found destination : ' + to);
	},
	/**
	 * 次の章へ進む。次の章が無ければシナリオを終了する。
	 */
	nextChapter: function() {
		this._chapterIdx++;
		if (this._chapterIdx < this._chapters.length) {
			this._run();
		} else {
			this.stop();
		}
	},
	/**
	 * シナリオを開始する。
	 */
	start: function() {
		var to = 0;
		if (this._chapterIdx >= 0) {
			// warm start
			// プレイ途中でのロードからの開始。
			this._chapters[this._chapterIdx].clearLines();
		} else {
			// cold start
			enchant.Game.instance.pushScene(this);
		}
		if (this.record.chapter) {
			to = this.record.chapter;
		}
		if (this.onenterscenario) {
			this.onenterscenario();
		}
		this.gotoChapter(to);
	},
	/**
	 * シナリオを終了する。
	 */
	stop: function() {
		this.removeAllChildren();
		enchant.Game.instance.popScene();
		if (this.onexitscenario) {
			this.onexitscenario();
		}
	},
	_run: function() {
		this._chapters[this._chapterIdx].start();
	}
});

/**
 * @scope enchant.oes.OesChapter.prototype
 */
enchant.oes.OesChapter = enchant.Class.create(enchant.Group, {
	/**
	 * oes章のクラス。enchant.Group を継承。
	 * 直接このクラスのインスタンスを生成する必要はない。
	 * 章を生成してシナリオに追加するには enchant.oes.OesScenario.addChapter() を使う。
	 * addLine() やそれを内包したメソッドを使用して章を構築する。
	 * @param {enchant.oes.oesScenario} scenario この章が属するシナリオ。
	 * @param {Function(enchant.oes.OesChapter)} builder 章を構築する関数。
	 * @constructs
	 * @extends enchant.Group
	 */
	initialize: function(scenario,builder) {
		enchant.Group.call(this);
		/**
		 * この章が属するシナリオ。
		 * @type enchant.oes.OesScenario
		 */
		this.scenario = scenario;
		/**
		 * 章を構築する関数。
		 * @private
		 * @type Function(enchant.oes.OesChapter)
		 */
		this.builder = builder;
		/**
		 * 章を識別するためのラベル名。
		 * @type String
		 */
		this.label = null;
		/**
		 * 章を開始する時に呼ばれる関数。
		 * @type Function
		 * @default null
		 */
		this.onenterchapter = null;
		/**
		 * 章を終了する時に呼ばれる関数。
		 * @type Function
		 * @default null
		 */
		this.onexitchapter = null;
		this._read = null; // 既読情報。
		this.clearLines();
	},
	clearLines: function() {
		this._lines = [ ]; // function array
		this._lineIdx = -1;
		this.removeAllChildren();
	},
	/**
	 * 行を追加して関数を登録する。次にどの行へ進むかを関数内で設定しなければならない。
	 * @param {Function} func 実行する関数。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 */
	addLine: function(func) {
		this._lines.push(func);
		return func;
	},
	/**
	 * 指定した行へ進む。
	 * @param {Number | String} to 行のインデクス値またはラベル名。
	 */
	gotoLine: function(to) {
		var i;
		if (typeof(to) === 'number') {
			if (to >= 0 && to < this._lines.length) {
				this._lineIdx = to;
				this._run();
				return;
			}
		} else 
		if (typeof(to) === 'string') {
			for (i=0;i<this._lines.length;i++) {
				if (this._lines[i].label === to) {
					this._lineIdx = i;
					this._run();
					return;
				}
			}
		}
		throw new Error('not found destination : ' + to);
	},
	/**
	 * 次の行へ進む。次の行が無ければ現在の章を終了する。さらに次の章があればそちらへ進む。
	 */
	nextLine: function() {
		this._lineIdx++;
		if (this._lineIdx < this._lines.length) {
			this._run();
		} else {
			this.stop();
		}
	},
	/**
	 * 構築関数を実行して、章を開始する。
	 * 通常は、この関数を単独で実行する必要はない。
	 * @private
	 */
	start: function() {
		var i;
		this.builder(this);
		if (!this._read) {
			this._read = [ ];
			i = this._lines.length;
			while(i--) {
				this._read.push({});
			}
		}
		if (this.onenterchapter) {
			this.onenterchapter();
		}
		this.gotoLine(0);
	},
	/**
	 * 全ての行をクリアして、現在の章を終了する。次の章があればそちらへ進む。
	 * 通常は、この関数を単独で実行する必要はない。
	 * @private
	 * @param {String} [chapter] 次章のラベル名。
	 */
	stop: function(chapter) {
		var scenario;
		this.clearLines();
		if (this.onexitchapter) {
			this.onexitchapter();
		}
		scenario = this.scenario;
		scenario.record.chapter = null;
		scenario.record.caption = null;
		scenario.record.resume = null;
		scenario.record.children = null;
		if (chapter) {
			scenario.gotoChapter(chapter);
		} else {
			scenario.nextChapter();
		}
	},
	_run: function() {
		this._lines[this._lineIdx]();
	},
	_record: function(caption,resume) {
		var record = this.scenario.record;
		record.chapter = this.label;
		record.caption = caption;
		record.resume = resume;
		if (this.childNodes.length > 0) {
			// 子ノードのプロパティを保存。
			record.children = [];
			this.childNodes.forEach(function(node) {
				var p,v,
					r = {};
				for (p in node) {
					if (p[0] !== '_') { // 隠しプロパティは対象外。
						v = node[p];
						if ((typeof v === 'number' && !isNaN(v)) || (typeof v === 'string' && v.length > 0) || typeof v === 'boolean') {
							r[p] = v;
						}
					}
				}
				record.children.push(r);
			});
		} else {
			record.children = null;
		}
	},
	_resume: function() {
		var resume = null,
			record = this.scenario.record;
		if (record.chapter === this.label && record.resume) {
			resume = record.resume;
			if (record.children && record.children.length === this.childNodes.length) {
				// 子ノードのプロパティを再現。
				this.childNodes.forEach(function(node,idx) {
					var p,
						o = record.children[idx];
					for (p in o) {
						node[p] = o[p];
					}
				});
			}
			// この段階ではまだクリアしちゃだめ。stop()でやる。
			// record.chapter = null;
			// record.caption = null;
			// record.resume = null;
			// record.children = null;
		}
		return resume;
	},

	// 以降は、addLine()をwrapして使いやすいようにしてみた関数たち。
	// 非同期を意識しなくても良いように考慮したつもり。

	/**
	 * 行にラベルを設定する。（これは addLine() 内包メソッド）。
	 * <br>※完了後は次の行へ進む。
	 * @param {String} label ラベル名。
	 * @example
	 * chapter.setLabel('hello');
	 * chapter.print('Hello world !');
	 *	.
	 *	.
	 * chapter.jump('hello');
	 * @example
	 * // このようにラベルを設定することもできる。ただし addLine() 内包メソッドに限る。
	 * chapter.print('Hello world !').label = 'hello';
	 *	.
	 *	.
	 * chapter.jump('hello');
	 */
	setLabel: function(label) {
		var that = this;
		this.addLine(function() {
			that.nextLine();
		}).label = label;
	},
	/**
	 * 行に関数を設定する。（これは addLine() 内包メソッド）。
	 * その関数の戻り値によって飛び先の指定ができる。
	 * 戻り値が無い場合は次の行へ進む。
	 * @param {Function} func 設定する関数。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.act(function() {
	 *	img.x = 20;
	 *	img.y = 10;
	 *	img.opacity = 0.5;
	 * });
	 * @example
	 * chapter.act(function() {
	 *	if (scenario.record.flags[1]) {
	 *	 return 'goahead';
	 *	}
	 * });
	 * chapter.print(text,'落とし穴！');
	 * chapter.jump('end');
	 * chapter.print(text,'先へ進んだ。').label = 'goahead';	 
	 */
	act: function(func) {
		var that = this;
		return this.addLine(function() {
			var label = func();
			if (label) {
				that.gotoLine(label);
			} else {
				that.nextLine();
			}
		});
	},
	/**
	 * 指定ラベルの行へ飛ぶ。（これは addLine() 内包メソッド）。
	 * @param {String} label 宛先ラベル名。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.print('Hello world !').label = 'hello';
	 *	.
	 *	.
	 * chapter.jump('hello');
	 */
	jump: function(label) {
		var that = this;
		return this.addLine(function() {
			that.gotoLine(label);
		});
	},
	/**
	 * 指定時間待つ。（これは addLine() 内包メソッド）。
	 * <br>※完了後は次の行へ進む。
	 * @param {Number} sec 秒。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.wait(1.5);
	 */
	wait: function(sec) {
		var that = this;
		return this.addLine(function() {
			setTimeout(function() {
				that.nextLine();
			},sec*1000);
		});
	},
	/**
	 * 画像をロードする。（これは addLine() 内包メソッド）。
	 * <br>※完了後は次の行へ進む。
	 * @param {enchant.oes.OesImage} oesImage 画像のオブジェクト。
	 * @param {String | String[ ]} srcs ソースURL。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.loadImage(img,'picture.png');
	 * @example
	 * chapter.loadImage(bg,['bg1.jpg','bg2.jpg','bg3.jpg']); // 画像切り替えで便利。
	 */
	loadImage: function(oesImage,srcs) {
		var that = this;
		return this.addLine(function() {
			oesImage.load(srcs,function() {
				that.nextLine();
			});
		});
	},
	/**
	 * サウンドをロードする。（これは addLine() 内包メソッド）。
	 * サウンドタイプは、'audio/wav','audio/ogg','audio/mpeg','audio/mp4'　などが指定できるが、
	 * ブラウザごとに対応が異なるので注意。
	 * <br>※完了後は次の行へ進む。
	 * @param {enchant.oes.OesSound} oesSound サウンドのオブジェクト。
	 * @param {String | String[ ]} srcs ソースURL。
	 * @param {String} [type] サウンドのタイプ。省略時は自動判定。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.loadSound(bgm,'theme.ogg'); // タイプ省略時は自動判定される。
	 * @example
	 * chapter.loadSound(se,['dong.ogg','gong.ogg','ping.ogg'],'audio/ogg'); // サウンド切り替えで便利。
	 */
	loadSound: function(oesSound,srcs,type) {
		var that = this;
		return this.addLine(function() {
			oesSound.load(srcs,type,function() {
				that.nextLine();
			});
		});
	},
	/**
	 * 逐次文字出力。（これは addLine() 内包メソッド）。
	 * テキストにhtmlタグや独自タグを埋め込める。
	 * ただし、htmlタグは　a,br,span　など一部のタグの動作しか確認していないので注意。<br>
	 * 独自タグは以下のものが使用できる。<br>
	 * <div style="margin-left:1em">
	 * <b>{kw}</b> 入力待ち。<br>
	 * <b>{kl}</b> 入力待ち後改行。<br>
	 * <b>{kp}</b> 入力待ち後改ページ。<br>
	 * <b>{np}</b> 改ページ。<br>
	 * <b>{wt=nnn}</b> 逐次出力の待ち時間変更。nnn=秒。<br>
	 * <b>{wt}</b> 逐次出力の待ち時間をデフォルトに戻す。<br>
	 * <b>{wd=nnn}</b> 逐次出力の待ち時間変更。nnn=デフォルト待ち時間に対する倍率。<br>
	 * <b>{wd}</b> 逐次出力の待ち時間をデフォルトに戻す。<br>
	 * </div>
	 * ※完了後は次の行へ進む。
	 * @param {enchant.oes.oesText} oesText OesTextオブジェクト。
	 * @param {String} text テキスト。
	 * @example
	 * chapter.print(txt,'入力待ち{kw}入力待ち後改行{kl}入力待ち後改ページ{kp}');
	 * @example
	 * chapter.print(txt,'{wd=3}ゆっくり表示{wd=0.5}はやい表示{wd=0}瞬間表示{wd}デフォルト速度表示{kp}');
	 * @returns {Function} 行に登録された関数オブジェクト。
	 */
	print: function(oesText,text) {
		var that = this;
		return this.addLine(function() {
			oesText._read = that._read[that._lineIdx];
			oesText.print(text,function() {
				that.nextLine();
			});
		});
	},
	/**
	 * 選択肢を登録して選択を実行。（これは addLine() 内包メソッド）。
	 * 選択完了後はテキストはクリアされる。
	 * <br>※完了後は次の行へ進む。
	 * @param {enchant.oes.oesText} oesText OesTextオブジェクト。
	 * @param {Object[ ]} choices 選択肢のプロパティ。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.choose(text,[
	 *	{text:'これがよさげ。', to:'miss'},
	 *	{text:'これですよね？', to:'miss'},
	 *	{text:'これにすべき！', to:'hit'},
	 * ]).label = 'which';
	 * chapter.print(text,'はずれ。再度。').label = 'miss';
	 * chapter.jump('which');
	 * chapter.print(text,'あたり。次へ。').label = 'hit';
	 */
	choose: function(oesText,choices) {
		var that = this;
		return this.addLine(function() {
			var callback = function(chosen) {
				that.gotoLine(chosen.to);
			};
			oesText.choose(choices,callback);
		});
	},
	/**
	 * 対象画像を登録して選択を実行する。（これは addLine() 内包メソッド）。
	 * <br>※完了後は次の行へ進む。
	 * @param {enchant.oes.oesPicker} oesPicker OesPickerオブジェクト。
	 * @param {Object[ ]} targets 対象画像のプロパティ。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.pick(picker,[
	 *	{image:imgs[0], to:'left'},
	 *	{image:imgs[1], to:'right'},
	 * ]);
	 * chapter.print(text,'左を選んだ').label = 'left';
	 * chapter.jump('next');
	 * chapter.print(text,'右を選んだ').label = 'right';
	 */
	pick: function(oesPicker,targets) {
		var that = this;
		return this.addLine(function() {
			var callback = function(picked) {
				that.gotoLine(picked.to);
			};
			oesPicker.pick(targets,callback);
		});
	},
	/**
	 * 対象を指定してtweenを実行する。（これは addLine() 内包メソッド）。
	 * 複数対象の場合はその中の最大所要時間がこのtweenの所要時間となる。
	 * waitobj を指定した場合は非同期tweenとなる。
	 * <br>※完了後は次の行へ進む。
	 * @param {Object | Object[ ]} targets 対象のプロパティ。
	 * @param {Object} [waitobj] 非同期tween時の待ち合わせ用オブジェクト。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * // fade in
	 * chapter.act(function() {
	 *	text.opacity = 0;
	 * )};
	 * chapter.tween(
	 *	{node:text, time:game.fps, opacity:1, easing:enchant.Easing.QUAD_EASEIN}
	 * );
	 * @example
	 * chapter.act(function() {
	 *	img.x = 100;
	 *	img.y = 200;
	 * )};
	 * chapter.tween([
	 *	{node:img, time:game.fps*3, x:0, easing:enchant.Easing.LINEAR},
	 *	{node:img, time:game.fps*3, y:400, easing:enchant.Easing.LINEAR},
	 * ]);
	 */
	tween: function(params,waitobj) {
		// params = [{node:target, xxx:value, ..}, ..]
		var that = this;
		return this.addLine(function() {
			var t,i,last,
				callback = function(){
					var f;
					if (waitobj) {
						f = waitobj._callback;
						delete waitobj._callback; // tween完了。
						f();
					} else {
						that.nextLine();
					}
				};
			if (!(params instanceof Array)) {
				params = [ params ];
			}
			t = 0;
			for (i=0;i<params.length;i++) {
				if (t < params[i].time) {
					t = params[i].time;
					last = i; // 一番時間を要するやつにcallbackを適用する。
				}
			}
			for (i=0;i<params.length;i++) {
				t = new enchant.oes.OesTween(params[i].node, i === last ? callback : null);
				t.tween(params[i]);
			}
			if (waitobj) {
				// tween開始を示すためにダミー関数を登録。
				waitobj._callback = function() {}; 
				that.nextLine();
			}
		});
	},
	/**
	 * 非同期tweenが完了するまで待つ。（これは addLine() 内包メソッド）。
	 * <br>※完了後は次の行へ進む。
	 * @param {Object} waitobj 非同期tween時の待ち合わせ用オブジェクト。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * var waitobj = {};
	 * chapter.act(function() {
	 *	img.scaleX = 4;
	 *	img.scaleY = 4;
	 * )};
	 * chapter.tween([
	 *	{node:img, time:game.fps, scaleX:1, easing:enchant.Easing.LINEAR},
	 *	{node:img, time:game.fps, scaleY:1, easing:enchant.Easing.LINEAR},
	 * ],waitobj);
	 * chapter.print(text,'tweenの完了を待つ。');
	 * chapter.waitTween(waitobj);
	 */
	waitTween: function(waitobj) {
		var that = this;
		return this.addLine(function() {
			if (waitobj && waitobj._callback) {
				// tweenが完了してなければ書き換える。
				waitobj._callback = function() {
					that.nextLine();
				};
			} else {
				that.nextLine();
			}
		});
	},
	/**
	 * ロード後の再開をチェックする。（これは addLine() 内包メソッド）。
	 * 再開情報があればそれに従った行へ進む。そうでなければ次の行へ進む。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 */
	resume: function() {
		var that = this;
		return this.addLine(function() {
			var resume = that._resume();
			if (resume) {
				that.gotoLine(resume);
			} else {
				that.nextLine();
			}
		});
	},
	/**
	 * 現在の章を終了して、（もしあれば）次の章へ進む。（これは addLine() 内包メソッド）。
	 * @param {String} [chapter] 章のラベル名。
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.exit('nextChapter');
	 */
	exit: function(chapter) {
		var that = this;
		return this.addLine(function() {
			that.stop(chapter);
		});
	},
	/**
	 * ロード後の再開のための目印を設定する。（これは addLine() 内包メソッド）。
	 * デフォルトでは bookmark() した行そのものに目印が設定されるが、
	 * resume によって目印を設定する場所を変更できる。
	 * ただし、ロード後の再開はその目印が起点となることに十分注意すること。
	 * <br>※完了後は次の行へ進む。
	 * @param {String} caption セーブデータの見出し。
	 * @param {String} [resume] 再開時の飛び先ラベル名。 
	 * @returns {Function} 行に登録された関数オブジェクト。
	 * @example
	 * chapter.bookmark('そして、それは始まった。');
	 */
	bookmark: function(caption,resume) {
		var that = this;
		return this.addLine(function() {
			if (!resume) {
				resume = that._lineIdx;
			}
			that._record(caption,resume);
			that.nextLine();
		});
	}
});

/**
 * @scope enchant.oes.OesLabel.prototype
 */
enchant.oes.OesLabel = enchant.Class.create(enchant.Entity, {
	/**
	 * oesラベルのクラス。
	 * @param {String} [text] テキスト。
	 * @constructs
	 * @extends enchant.Entity
	 */
	initialize: function(text) {
		enchant.Entity.call(this);
		if (text) {
			this.text = text;
		}
	},
	/**
	 * テキスト。
	 * @type String
	 */
	text: {
		get: function() {
			return this._element.innerHTML;
		},
		set: function(text) {
			this._element.innerHTML = text;
		}
	},
	/**
	 * テキストの色。
	 * @type String
	 */
	color: {
		get: function() {
			return this._style.color;
		},
		set: function(color) {
			this._style.color = color;
		}
	}
});

/**
 * @scope enchant.oes.OesText.prototype
 */
enchant.oes.OesText = enchant.Class.create(enchant.oes.OesLabel, {
	/**
	 * テキストのクラス。
	 * 逐次文字出力および選択肢の制御。
	 * @constructs
	 * @extends enchant.oes.OesLabel
	 */
	initialize: function() {
		enchant.oes.OesLabel.call(this,'');
		/**
		 * 逐次文字出力の速度（待ち時間（秒））。
		 * @type Number
		 * @default 1/enchant.Game.instance.fps
		 */
		this.printWait = 1/enchant.Game.instance.fps;
		/**
		 * 出力速度を調整する文字。
		 * @type Object[ ]
		 * @default [{match:/[、。！？・]/, delay:5}]
		 */
		this.printSpecials = [{match:/[、。！？・]/, delay:5}]; // 特定文字は遅延させる。
		/**
		 * 入力待ちアイコン。
		 * @type Object
		 * @default &#123;kw: '&lt;img src="kw.gif"&gt;', kl: '&lt;img src="kl.gif"&gt;', kp: '&lt;img src="kp.gif"&gt;'&#125;
		 */
		this.printIcon = {kw: '<img src="kw.gif">', kl: '<img src="kl.gif">', kp: '<img src="kp.gif">'};
		/**
		 * ユーザー定義タグのハンドラ。
		 * @type Object
		 */
		this.printTags = {};
		/**
		 * 入力待ちクリック時に呼ばれる関数。
		 * @type Function(mode:String)
		 * @default null
		 */
		this.onprintclick = null;
		/**
		 * 選択肢をシャッフルするか。
		 * @type Boolean
		 * @default false
		 */
		this.chooseShuffle = false;
		/**
		 * 選択肢の表示はインラインか。
		 * @type Boolean
		 * @default false
		 */
		this.chooseInline = false;
		/**
		 * 選択肢がインライン時の区切り。
		 * @type String
		 * @default ', '
		 */
		this.chooseInlineSeparator = ', ';
		/**
		 * 選択肢に適用するcssクラス名。
		 * @type String
		 * @default 'choose'
		 */
		this.chooseClass = 'choose';
		/**
		 * 選択肢の順番の添え字を生成する関数。
		 * @field
		 * @type Function(n:Number)
		 * @default function(n) {return String(n+1) + '.';}
		 */
		this.choosePrefix = function(n) {
			return String(n+1) + '.';
		};
		/**
		 * 選択肢を選択後の余韻（秒）
		 * @type Number
		 * @default 0
		 */
		this.chooseLingering = 0;
		/**
		 * 既読スキップ可能状態かどうか。
		 * @type Boolean
		 */
		this.skipable = false;
		/**
		 * 既読スキップ可能状態に変化があった時に呼ばれる関数。
		 * @type Function(skipable:Boolean)
		 * @default null
		 */
		this.onchangeskipable = null;
		this._read = {}; // 既読情報。外部から設定される。初期化時はダミー。
	},
	/**
	 * テキストをクリアする。
	 */
	clear: function() {
		this.text = '';
	},
	/**
	 * 逐次的文字出力。
	 * @param {String} text テキスト。
	 * @param {Function} [callback] 完了時に呼ばれる関数。
	 */
	print: function(text,callback) {
		var that = this,
			curtext = this.text,
			basewait = this.printWait,
			pos = 0,
			curwait = 0,
			cancelwait = false,
			keywait = false,
			autowait = 0,
			skipwait = 0,
			dt = 1/enchant.Game.instance.fps,
			canskip = function() {
				// 既読スキップするかどうか。
				var b = that._read.pos && that._read.pos > pos;
				if (b !== that.skipable) {
					if (that.skipable) {
						// スキップ可能から不可になったらウエイトをリセットする。
						curwait = 0;
					}
					that.skipable = b;
					if (that.onchangeskipable) {
						that.onchangeskipable(b);
					}
				}
				return control.skipread && b;
			},
			updatePos = function(len) {
				pos += len;
				if (!that._read.pos || that._read.pos < pos) {
					// 既読位置を更新。
					that._read.pos = pos;
				}
			},
			updateText = function(str,skiplog) {
				// 逐次出力テキストを更新。
				if (!skiplog) {
					control._logAdd(str);
				}
				curtext += str;
				that.text = curtext;
				updatePos(str.length);
			},
			click = function() {
				switch (keywait) {
				case 'kw':
					that.text = curtext;
					curwait = 0;
					break;
				case 'kl':
					control._logAdd('<br>');
					curtext += '<br>';
					that.text = curtext;
					curwait = 0;
					break;
				case 'kp':
					control._logNewpage();
					curtext = '';
					that.text = curtext;
					cancelwait = false;
					basewait = that.printWait;
					curwait = 0;
					break;
				default: // 逐次出力をキャンセルして待ち無しにする。
					if (pos > 0) {
						basewait = 0;
						curwait = 0;
						cancelwait = true;
					}
					return;
				}
				if (that.onprintclick) {
					that.onprintclick(keywait);
				}
				keywait = false;
			},
			onclick = function(e) {
				var nodes = e.target._element.childNodes,
					i,n;
				for (i=0;i<nodes.length;i++) {
					n = nodes[i];
					if (n.tagName === 'A' && n.offsetLeft <= e.localX && n.offsetLeft + n.offsetWidth > e.localX && n.offsetTop <= e.localY && n.offsetTop + n.offsetHeight > e.localY) {
						// <a>タグは自前で対処する。
						return;
					}
				}
				click();
			},
			tick = function() {
				var ary,tag,i,c;
				if (keywait) {
					if (canskip()) {
						if (skipwait >= control.skipreadWait) {
							skipwait = 0;
							click();
						} else {
							skipwait += dt;
							return;
						}
					} else
					if (control.autoplay) {
						if (autowait >= control.autoplayWait) {
							autowait = 0;
							click();
						} else {
							autowait += dt;
							return;
						}
					} else {
						return;
					}
				}
				while (basewait === 0 || curwait < dt || canskip()) {
					while(true) {
						if (pos >= text.length) {
							that._read.pos = pos + 1; // 終端での既読スキップ判定のための調整。
							that.removeEventListener('enterframe',tick);
							that.removeEventListener('touchend',onclick);
							if (callback) {
								callback();
							}
							return;
						}
						c = text[pos];
						if (c === '<') {
							// html tag
							ary = text.substr(pos).match(/<\/?([^>]*)\/?>/);
							if (ary) {
								updateText(ary[0],!control.logHtmltag);
							}
						} else 
						if (c === '&') {
							// special chars
							ary = text.substr(pos).match(/&([^;]+);/);
							if (ary) {
								updateText(ary[0]);
							}
						} else 
						if (c === '{') {
							// print tag
							ary = text.substr(pos).match(/\{([^}]*)\}/);
							if (ary) {
								updatePos(ary[0].length);
								ary = ary[0].replace(/[{}]/g,'').split(/[=,]/);
								tag = ary[0];
								ary.shift(); // parameters
								switch (tag) {
								case 'kw':
								case 'kl':
								case 'kp':
									that.text = curtext + that.printIcon[tag];
									keywait = tag;
									return;
								case 'np':
									control._logNewpage();
									curtext = '';
									that.text = curtext;
									cancelwait = false;
									break;
								case 'wt':
									if (!cancelwait) {
										if (ary.length > 0) {
											basewait = _parseFloat(ary[0]);
										} else {
											basewait = that.printWait; // デフォルトに戻す。
										}
									}
									break;
								case 'wd':
									if (!cancelwait) {
										if (ary.length > 0) {
											basewait = that.printWait * _parseFloat(ary[0]);
										} else {
											basewait = that.printWait; // デフォルトに戻す。
										}
									}
									break;
								default:
									if (that.printTags[tag] && typeof(that.printTags[tag]) === 'function') {
										// ユーザー定義タグの処理。
										if (that.printTags[tag](ary)) {
											return;
										}
									}
									break;
								}
							}
						} else {
							// 特定文字の遅延を調整。
							for (i=0;i<that.printSpecials.length;i++) {
								if (c.match(that.printSpecials[i].match)) {
									curwait += basewait * that.printSpecials[i].delay;
									break;
								}
							}
							break;
						}
					}
					updateText(text[pos]);
					curwait += basewait;
				}
				curwait -= dt;
			};
		this.addEventListener('touchend',onclick);
		this.addEventListener('enterframe',tick);
	},
	/**
	 * 選択肢を登録して選択を実行。選択完了後はテキストはクリアされる。
	 * @param {Object[ ]} choices 選択肢テキストおよび飛び先のラベル名。
	 * @param {Function(chosen:Object)} [calback] 完了時に呼ばれる関数。
	 */
	choose: function(choices,callback) { 
		// choices = [ {text:string, to:label}, .. ];
		var that = this,
			i,j,k,el,
			//et = TOUCH_ENABLED ? 'touchend' : 'mouseup',
			tag = this.chooseInline ? 'span' : 'div',
			frag = document.createDocumentFragment(),
			nodes = [],
			clicked = function(node) {
				control._logChosen(node._choice.text);
				that.text = ''; // 選択完了後はテキストをクリアする。
				if (callback) {
					callback(node._choice);
				}
			},
			onclick = function() {
				var node = this;
				if (that.chooseLingering > 0) {
					if (TOUCH_ENABLED) {
						node.removeEventListener('touchend',onclick,false);
					}
					node.removeEventListener('mouseup',onclick,false);
					nodes.forEach(function(n) {
						if (n !== node) {
							n.style.visibility = 'hidden';
						}
					});
					setTimeout(function() {
						clicked(node);
					},that.chooseLingering*1000);
				} else {
					clicked(node);
				}
			};
		if (this.chooseShuffle) {
			i = choices.length;
			while(i) {
				j = Math.floor(Math.random()*i);
				k = choices[--i];
				choices[i] = choices[j];
				choices[j] = k;
			}
		}
		for (i=0;i<choices.length;i++) {
			if (this.chooseInline && i>0) {
				el = document.createElement(tag);
				el.innerHTML = this.chooseInlineSeparator;
				frag.appendChild(el);
				nodes.push(el);
			}
			el = document.createElement(tag);
			el.innerHTML = this.choosePrefix(i) + choices[i].text;
			el._choice = choices[i];
			el.className = this.chooseClass;
			if (TOUCH_ENABLED) {
				el.style.pointerEvents = 'all'; // touchEnabled
				el.addEventListener('touchend',onclick,false);
			}
			el.addEventListener('mouseup',onclick,false);
			frag.appendChild(el);
			nodes.push(el);
		}
		this._element.appendChild(frag);
	}
});

/**
 * @scope enchant.oes.OesImage.prototype
 */
enchant.oes.OesImage = enchant.Class.create(enchant.Sprite, {
	/**
	 * 画像のクラス。
	 * @constructs
	 * @extends enchant.Sprite
	 */
	initialize: function() {
		enchant.Sprite.call(this);
		/**
		 * ロードした画像ソース。
		 * @type enchant.Surface[ ]
		 */
		this.sources = [ ];
	},
	/**
	 * 画像をセットする。
	 * @param {enchant.Surface} surface ソースとなるサーフェース。
	 */
	set: function(surface) {
		if (surface && surface !== this.image) {
			this.image = surface;
			this.width = surface.width;
			this.height = surface.height;
		}
	},
	/**
	 * 使用ソースのインデクス値。
	 * @type Number
	 */
	source: {
		get: function() {
			return this.sources.indexOf(this.image);
		},
		set: function(index) {
			if (index >= 0 && index < this.sources.length) {
				this.set(this.sources[index]);
			}
		}
	},
	/**
	 * 画像をロード。
	 * @param {String | String[ ]} srcs ソースのURL。
	 * @param {Function} [callback] 完了時に呼ばれる関数。
	 */
	load: function(srcs,callback) {
		var that = this,
			i,
			onload = function() {
				this.removeEventListener('load',onload);
				if (that.sources.indexOf(this) + 1 === srcs.length) {
					that.source = 0;
					if (callback) {
						callback();
					}
				}
			};
		if (!(srcs instanceof Array)) {
			srcs = [ srcs ];
		}
		this.sources = [ ];
		for (i=0;i<srcs.length;i++) {
			this.sources[i] = enchant.Surface.load(srcs[i]);
			this.sources[i].addEventListener('load',onload);
		}
	}
});

/**
 * @scope enchant.oes.OesSound.prototype
 */
enchant.oes.OesSound = enchant.Class.create(enchant.Node, {
	/**
	 * サウンドのクラス。
	 * シーンから外されると自動的に再生を停止する。
	 * @constructs
	 * @extends enchant.Node
	 */
	initialize: function() {
		enchant.EventTarget.call(this);
		/**
		 * 再生中かどうか。
		 * @type Boolean
		 */
		this.playing = false;
		/**
		 * ロードしたサウンドのソース。
		 * @type enchant.Sound[ ]
		 */
		this.sources = [ ];
		/**
		 * 再生完了時に呼ばれる関数。ただしループ再生中は除く。
		 * @type Function
		 * @default null
		 */
		this.onended = null;
		this._sound = null;
		this.addEventListener('removedfromscene',function() {
			this.stop();
		});
	},
	/**
	 * ループ再生するかどうか。
	 * @type Boolean
	 * @default false
	 */
	loop: {
		get: function() {
			if (this._sound && this._sound._element) {
				return this._sound._element.loop;
			}
			return false;
		},
		set: function(loop) {
			if (this._sound && this._sound._element) {
				this._sound._element.loop = loop;
			}
		}
	},
	/**
	 * ボリューム値（０～１）。
	 * @type Number
	 * @default 1
	 */
	volume: {
		get: function() {
			if (this._sound) {
				return this._sound.volume;
			}
			return 0;
		},
		set: function(volume) {
			if (this._sound) {
				if (volume < 0) {
					volume = 0;
				} else
				if (volume > 1) {
					volume = 1;
				}
				this._sound.volume = volume;
			}
		}
	},
	/**
	 * サウンドをセットする。
	 * @param {enchant.Sound} sound ソースとなるサウンド。
	 */
	set: function(sound) {
		if (sound && sound !== this._sound) {
			this.stop();
			this._sound = sound;
		}
	},
	/**
	 * 使用ソースのインデクス値。
	 * @type Number
	 */
	source: {
		get: function() {
			return this.sources.indexOf(this._sound);
		},
		set: function(index) {
			if (index >= 0 && index < this.sources.length) {
				this.set(this.sources[index]);
			}
		}
	},
	/**
	 * サウンドをロード。
	 * @param {String | String[ ]} srcs ソースのURL。
	 * @param {String} type audioタイプ。undefined または null 時は自動判定。
	 * @param {Function} [callback] 完了時に呼ばれる関数。
	 */
	load: function(srcs,type,callback) {
		var that = this;
		if (!(srcs instanceof Array)) {
			srcs = [ srcs ];
		}
		this.sources = [ ];
		srcs.forEach(function(src,idx) {
			var sound,t,audio,
				loaded = function() {
					if (idx + 1 === srcs.length) {
						that.source = 0;
						if (callback) {
							callback();
						}
					}
				};
			sound = Object.create(enchant.Sound.prototype);
			enchant.EventTarget.call(sound);
			that.sources[idx] = sound;
			t = type || getExt(src);
			if (t && enchant.oes.OesSound.canPlayType(t)) {
				audio = new Audio();
				audio.onerror = function() {
					throw new Error('load failed: ' + this.src);
				};
				audio.addEventListener('canplaythrough', function() {
					this.removeEventListener('canplaythrough', arguments.callee, false);
					sound.duration = this.duration;
					loaded();
				}, false);
				audio.addEventListener('playing',function() {
					that.playing = true;
				},false);
				audio.addEventListener('pause',function() {
					that.playing = false;
				},false);
				audio.addEventListener('ended',function() {
					that.playing = false;
					if (that.onended) {
						that.onended();
					}
				},false);
				audio.autoplay = false;
				audio.src = src;
				audio.load();
				sound._element = audio;
			} else {
				loaded();
			}
		});
	},
	/**
	 * サウンドを再生。
	 */
	play: function() {
		if (this._sound) {
			if (this.playing) {
				if (this.loop) {
					return;
				}
				this.stop();
			}
			this._sound.play();
		}
	},
	/**
	 * サウンド再生を一時停止。
	 */
	pause: function() {
		if (this._sound && this.playing) {
			this._sound.pause();
		}
	},
	/**
	 * サウンド再生を停止。
	 */
	stop: function() {
		if (this._sound && this.playing) {
			this._sound.stop();
		}
	}
});

/**
 * 再生可能なaudioタイプかどうか。
 * @param {String} type audioタイプ。
 * @example
 * type = 'ogg'; // 拡張子表記も可能。
 * if (!enchant.oes.OesSound.canPlayType(type)) {
 *	type = 'mp3';
 * }
 * @returns {Boolean}
 */
enchant.oes.OesSound.canPlayType = function(type) {
	type = type.replace('mp3', 'mpeg');
	type = type.replace('aac', 'mp4');
	if (!type.match(/^audio\//)) {
		type = 'audio/' + type;
	}
	return AUDIO_TYPES.indexOf(type) !== -1;
};

/**
 * Image Picker
 * @scope enchant.oes.OesPicker.prototype
 */
enchant.oes.OesPicker = enchant.Class.create({
	/**
	 * 画像選択のクラス。
	 * @constructs
	 */
	initialize: function() {
		/**
		 * 対象画像に適用されるCSSクラス名。
		 * @type String
		 * @default 'pick'
		 */
		this.pickClass = 'pick';
	},
	/**
	 * 対象画像を指定して選択を実行する。
	 * @param {Object[ ]} targets 対象画像のプロパティ。
	 * @param {Function(picked:Object)} [callback] 完了時に呼ばれる関数。
	 */
	pick: function(targets,callback) {
		// targets = [{image:entity, to:label}, ..];
		var that = this,
			onclick = function() {
				var _pick = this._pick;
				targets.forEach(function(target) {
					var image = target.image;
					delete image._pick;
					image.touchEnabled = false;
					image.removeClass(that.pickClass);
					image.removeEventListener('touchend',onclick);
				});
				if (callback) {
					callback(_pick);
				}
			};
		targets.forEach(function(target) {
			var image = target.image;
			image._pick = target;
			image.touchEnabled = true;
			image.addClass(that.pickClass);
			image.addEventListener('touchend',onclick);
		});
	}
});

/**
 * @scope enchant.oes.OesTween.prototype
 * @requires tl.enchant.js 
 */
enchant.oes.OesTween = enchant.Class.create(enchant.tl.Timeline, {
	/**
	 * Tweenのクラス。enchant.tl.Timeline を継承。
	 * @param {enchant.Node} node 対象ノード。
	 * @param {Function} [callback] 完了時に呼ばれる関数。
	 * @constructs
	 * @extends enchant.tl.Timeline
	 */
	initialize: function(node,callback) {
		enchant.tl.Timeline.call(this,node);
		var that = this;
		node.addEventListener('enterframe', function() {
			that.tick();
			if (that.queue.length === 0) {
				this.removeEventListener('enterframe',arguments.callee);
				if (callback) {
					callback();
				}
			}
		});
	}
});
/**
 * @scope enchant.oes.OesRecord.prototype
 */
enchant.oes.OesRecord = enchant.Class.create({
	/**
	 * セーブデータのクラス。
	 * @constructs
	 */
	initialize: function() {
		/**
		 * セーブ日時。これがnullならデータが存在しないことを示す。
		 * @type Date
		 * @default null
		 */
		this.date = null;
		/**
		 * 章のラベル名。
		 * @type String
		 */
		this.chapter = null;
		/**
		 * セーブデータの見出し。
		 * @type String
		 */
		this.caption = null;
		/**
		 * 再開時の行の飛び先。
		 * @type Number | String
		 */
		this.resume = null;
		/**
		 * 子ノードのプロパティ保存用。
		 * @type Object[ ]
		 */
		this.children = null;
		// this.flags = []; // ユーザフラグの一例。
	}
});

/**
 * localStorageから一組のセーブデータを読み出す。存在していなければ新規に生成する。
 * @param {String} key キーとなるユニークな名前。
 * @param {Number} [count] 管理するセーブデータの個数。省略時のデフォルトは３。
 */
enchant.oes.OesRecord.readRecords = function(key,count) {
	if (!count) {
		count = 3; // default
	}
	var records = localStorage[key];
	if (records) {
		records = JSON.parse(records);
	} else {
		records = [ ];
	}
	while (records.length < count) {
		records.push(new enchant.oes.OesRecord());
	}
	return records;
};

/**
 * localStorageに一組のセーブデータを書き出す。
 * @param {String} key キーとなるユニークな名前。
 * @param {enchant.oes.OesRecord[ ]} records 一組のセーブデータ。
 */
enchant.oes.OesRecord.writeRecords = function(key,records) {
	localStorage[key] = JSON.stringify(records);
};

/**
 * localStorageから一組のセーブデータを削除。
 * @param {String} key キーとなるユニークな名前。
 */
enchant.oes.OesRecord.deleteRecords = function(key) {
	delete localStorage[key];
};

/**
 * セーブデータが空でないかどうか調べる。
 * @param {String} key キーとなるユニークな名前。
 * @returns {Boolean}
 */
enchant.oes.OesRecord.hasRecord = function(key) {
	var records = enchant.oes.OesRecord.readRecords(key);
	return records.some(function(record) {
		return record.date !== null;
	});
};

}());
