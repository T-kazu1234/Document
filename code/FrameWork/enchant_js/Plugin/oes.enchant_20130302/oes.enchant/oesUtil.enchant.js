/**
 * oesUtil.enchant.js
 * @version 0.2.5 (2012/5/6)
 * @requires enchant.js v0.4.3 or later
 * @requires oes.enchant.js v0.4.2 or later
 * @author <a href="http://www20.atpages.jp/katwat/wp/">katwat</a>
 */
/*
 * The MIT license
 * http://www.opensource.org/licenses/mit-license.php
 */

enchant.oesUtil = {};

(function() {

enchant.oes.OesScenario.prototype.saveRecord = function() {
	var form = new enchant.oesUtil.OesRecordForm();
	form.open(this,0);
};

enchant.oes.OesScenario.prototype.loadRecord = function(reload) {
	var that = this,
		form = new enchant.oesUtil.OesRecordForm();
	form.onclose = function(slot) {
		if (slot !== -1) {
			// 「戻る」以外なら開始。
			that.start();
		}
	};
	form.open(this,reload ? 2 : 1);
};

enchant.oesUtil.OesDialog = enchant.Class.create(enchant.Scene, {
	initialize: function() {
		enchant.Scene.call(this);
		this.onclose = null;
		this.frameClass = 'dialogFrame';
		this.titleClass = 'dialogTitle';
		this.textClass = 'dialogText';
		this.buttonClass = 'dialogButton';
	},
	open: function(title,text,buttons) {
		var that = this,
			l_title, l_text,
			w = 0, h = 0,
			wb = 0, hb = 0,
			i,l,m,			
			frame = new enchant.Entity(),
			g = new enchant.Group(),
			gb = new enchant.Group(),
			onclick = function() {
				that.close();
				if (that.onclose) {
					that.onclose(this._value);
				}
			};
		if (!buttons) {
			buttons = enchant.oesUtil.OesDialog.BUTTONS_CONFIRM;
		}
		frame.className = this.frameClass;
		if (title) {
			l_title = new enchant.oes.OesLabel(title);
			l_title.className = this.titleClass;
			l_title.x = 0;
			l_title.y = h;
			w = Math.max(w,l_title.boxWidth);
			h += l_title.boxHeight;
			g.addChild(l_title);
		}
		if (text) {
			l_text = new enchant.oes.OesLabel(text);
			l_text.className = this.textClass;
			l_text.x = 0;
			l_text.y = h;
			w = Math.max(w,l_text.boxWidth);
			h += l_text.boxHeight;
			g.addChild(l_text);
		}
		for (i=0;i<buttons.length;i++) {
			l = new enchant.oes.OesLabel(buttons[i].label);
			l._value = buttons[i].value;
			l.className = this.buttonClass;
			l.x = wb;
			l.y = h;
			wb += l.boxWidth;
			hb = l.boxHeight;
			l.addEventListener('touchend',onclick);
			gb.addChild(l);
		}
		w = Math.max(w,wb);
		h += hb;
		gb.x = (w - wb) / 2;
		g.addChild(gb);
		l_title.boxWidth = w;
		l_text.x = (w - l_text.boxWidth)/ 2;
		frame.width = w;
		frame.height = h;
		m = frame.getBoxDimensions();
		g.x = m.marginLeft + m.borderLeftWidth + m.paddingLeft;
		g.y = m.marginTop + m.borderTopWidth + m.paddingTop;
		this.x = (this.width - frame.boxWidth) / 2;
		this.y = (this.height - frame.boxHeight) / 2;
		this.addChild(frame);
		this.addChild(g);
		frame.render();
		enchant.Game.instance.pushScene(this);
	},
	close: function() {
		this.removeAllChildren();
		enchant.Game.instance.popScene();
	}
});
enchant.oesUtil.OesDialog.BUTTONS_CONFIRM = [{label:'了解',value:'confirm'}];
enchant.oesUtil.OesDialog.BUTTONS_YESNO = [{label:'は　い',value:'yes'},{label:'いいえ',value:'no'}];

enchant.oesUtil.OesRecordForm = enchant.Class.create(enchant.Scene, {
	initialize: function() {
		enchant.Scene.call(this);
		this.onclose = null;
		this.frameClass = 'recordFrame';
		this.titleClass = 'recordTitle';
		this.textClass = 'recordText';
		this.captionClass = 'recordCaption';
		this.dateClass = 'recordDate';
		this.buttonClass = 'recordButton';
	},
	open: function(scenario,mode) {
		// mode: 0=セーブ,1=ロード(起動時用、全削除可),2=ロード(プレイ途中用、キャンセル可)
		var that = this,
			records = enchant.oes.OesRecord.readRecords(scenario.title),
			date2str = function(d) {
				var zp = function(v) {
						v = String(v);
						while (v.length < 2) {
							v = '0' + v;
						}
						return v;
					};
				if (typeof(d) === 'string') {
					d = new Date(d);
				}
				return d.getFullYear() + '/' + zp(d.getMonth()+1) + '/' + zp(d.getDate()) + ' ' + zp(d.getHours()) + ':' + zp(d.getMinutes()) + ':' + zp(d.getSeconds());
			},
			capstr = function(slot,record) {
				var str = String(slot+1) + '.';
				if (record.date) {
					if (record.caption) {
						str += record.caption;
					} else {
						str += '（見出しがありません）';
					}
				} else {
					str += '（データがありません）';
				}
				return str;
			},
			exit = function(slot) {
				that.close();
				if (that.onclose) {
					that.onclose(slot);
				}
			},
			onclick = function() {
				var label = this,
					slot = this._slot,
					record = records[slot],
					savedata,
					dlg;
				if (mode) {
					// load
					if (record.date) {
						scenario.record = record;
						exit(slot);
					}
				} else {
					// save
					savedata = function(slot) {
						var dlg2;
						scenario.record.date = new Date(); // セーブ日時。
						records[slot] = scenario.record;
						enchant.oes.OesRecord.writeRecords(scenario.title,records);
	
						// 見出しを更新。
						label.text = capstr(slot,scenario.record);
	
						// 日時を更新
						that.childNodes[that.childNodes.indexOf(label)+1].text = date2str(scenario.record.date);
	
						// セーブ完了確認。
						dlg2 = new enchant.oesUtil.OesDialog();
						//dlg2.onclose = function(value) {
						//	exit(slot);
						//};
						dlg2.open('セーブ完了','セーブしました',enchant.oesUtil.OesDialog.BUTTONS_CONFIRM);
					};
					if (record.date) {
						// 上書き確認。
						dlg = new enchant.oesUtil.OesDialog();
						dlg.onclose = function(value) {
							if (value === 'yes') {
								savedata(slot);
							}
						};
						dlg.open('上書き確認','上書きしてよろしいですか？',enchant.oesUtil.OesDialog.BUTTONS_YESNO);
					} else {
						savedata(slot);
					}
				}
			},
			h=0,
			l,i,
			items = [];
		this._element.className = this.frameClass;
		l = new enchant.oes.OesLabel(mode ? 'ロード' : 'セーブ');
		l.className = this.titleClass;
		l.boxWidth = this.width;
		l.x = 0;
		l.y = h;
		h += l.boxHeight;
		this.addChild(l);
		l = new enchant.oes.OesLabel(mode ? 'ロードするデータを選んでください' : 'セーブする場所を選んでください');
		l.className = this.textClass;
		l.x = 0;
		l.y = h;
		h += l.boxHeight;
		this.addChild(l);
		for (i=0;i<records.length;i++) {
			if (records[i].date) {
				l = new enchant.oes.OesLabel(capstr(i,records[i]));
				l.className = this.captionClass;
				l.x = 0;
				l.y = h;
				h += l.boxHeight;
				l._slot = i;
				l.addEventListener('touchend',onclick);
				this.addChild(l);
				items.push(l);
				l = new enchant.oes.OesLabel(date2str(records[i].date));
				l.className = this.dateClass;
				l.x = 0;
				l.y = h;
				h += l.boxHeight;
				this.addChild(l);
				items.push(l);
			} else {
				l = new enchant.oes.OesLabel(capstr(i,records[i]));
				l.className = this.captionClass;
				l.x = 0;
				l.y = h;
				h += l.boxHeight;
				if (mode === 0) {
					// セーブ時のみ。
					l._slot = i;
					l.addEventListener('touchend',onclick);
				}
				this.addChild(l);
				items.push(l);
				l = new enchant.oes.OesLabel('&nbsp;');
				l.className = this.dateClass;
				l.x = 0;
				l.y = h;
				h += l.boxHeight;
				this.addChild(l);
				items.push(l);
			}
		}
		if (mode === 1) {
			l = new enchant.oes.OesLabel('全削除');
			l.className = this.buttonClass;
			l.x = 0;
			l.y = this.height - l.boxHeight;
			l.addEventListener('touchend',function() {
				var dlg = new enchant.oesUtil.OesDialog();
				dlg.onclose = function(value) {
					var i;
					if (value === 'yes') {
						enchant.oes.OesRecord.deleteRecords(scenario.title);
						records = enchant.oes.OesRecord.readRecords(scenario.title);
						// 表示を更新。
						for (i=0;i<records.length;i++) {
							items[i*2].text = capstr(i,records[i]);
							items[i*2+1].text = '&nbsp;';
						}
					}
				};
				dlg.open('全削除','本当によろしいですか？',enchant.oesUtil.OesDialog.BUTTONS_YESNO);
			});
			this.addChild(l);
		} else {
			l = new enchant.oes.OesLabel('戻る');
			l.className = this.buttonClass;
			l.x = 0;
			l.y = this.height - l.boxHeight;
			l.addEventListener('touchend',function() {
				exit(-1);
			});
			this.addChild(l);
		}
		if (mode) {
			l = new enchant.oes.OesLabel('はじめから');
			l.className = this.buttonClass;
			l.x = this.width - l.boxWidth;
			l.y = this.height - l.boxHeight;
			l.addEventListener('touchend',function() {
				scenario.record = new enchant.oes.OesRecord();
				exit(-2);
			});
			this.addChild(l);
		}
		enchant.Game.instance.pushScene(this);
	},
	close: function() {
		this.removeAllChildren();
		enchant.Game.instance.popScene();
	}
});

enchant.oesUtil.OesLogForm = enchant.Class.create(enchant.Scene, {
	initialize: function() {
		enchant.Scene.call(this);
		this.onclose = null;
		this.frameClass = 'logFrame';
		this.titleClass = 'logTitle';
		this.textClass = 'logText';
		this.buttonClass = 'logButton';
	},
	open: function(title) {
		var that = this,
			l,
			y = 0,
			h = this.height;
		this._element.className = this.frameClass;
		if (title) {
			l = new enchant.oes.OesLabel(title);
			l.className = this.titleClass;
			l.boxWidth = this.width;
			y = l.boxHeight;
			h -= y;
			this.addChild(l);
		}
		l = new enchant.oes.OesLabel('戻る');
		l.className = this.buttonClass;
		l.y = this.height - l.boxHeight;
		h -= l.boxHeight;
		l.addEventListener('touchend',function() {
			that.close();
			if (that.onclose) {
				that.onclose();
			}
		});
		this.addChild(l);
		l = new enchant.oes.OesLabel(enchant.oes.OesControl.instance.logText);
		l.className = this.textClass;
		l.boxWidth = this.width;
		l.boxHeight = h;
		l.y = y;
		this.addChild(l);
		enchant.Game.instance.pushScene(this);
		l._element.scrollTop = l._element.scrollHeight - l._element.clientHeight;
	},
	close: function() {
		this.removeAllChildren();
		enchant.Game.instance.popScene();
	}
});

}());
