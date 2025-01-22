// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */


// a useful Dialog box for showing a modal Dialog //

import St from 'gi://St';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


function _setLabel(label, value) {
    label.set({
        text: value || '',
        visible: value !== null,
    });
}

export function glob2RegExp(glob_pattern){
    let regex = glob_pattern.replace(/,\s*/g, '|').replace(/\./g, "\\.").replace(/\*/g, '.*');
    return new RegExp(`^(?:${regex})$`);
} // export glob2regex(glob_pattern) //

function cannotconvert2glob(regex){
    const pattern = RegExp(/\[|\]|[(){}]|\\[|]|\\d|\\s|\\b|\\w|\\t|\\D|\\W|\\S|\\B|\\u[0-9A-Fa-f]{1,4}|\\\d+|\(\?|\\k<|\\n/);
    const match = regex.match(pattern);
    return !!match;
}

export function RegExp2glob(regex){
    if(regex instanceof RegExp) regex = regex.toString();
    const pattern0 = new RegExp('^[/](.*)[/][dgimsuvy]*$');
    const pattern1 = new RegExp('^[(][?]:(.*)[)]$');
    const match0 = regex.match(pattern0);
    let glob_pattern;
    if(match0){
        glob_pattern = match0[1];
    }else{
        glob_pattern = regex;
    }

    const pat2 = new RegExp(/^[\^]/);
    const pat3 = new RegExp(/[$]$/);
    glob_pattern = regex.replace(pat2, '').replace(pat3, '');

    const match1 = glob_pattern.match(pattern1);

    if(match1){
        glob_pattern = match1[1];
    }

    if(cannotconvert2glob(glob_pattern)){
        return null;
    }

    return glob_pattern.replace(/\|/g, ', ').replace(/.\*/g, '*').replace(/.\?/g, '*').replace(/(?<!\\)\./g, '?').replace(/\\\./g, '.');
} // export RegExp2glob(regex) //

export function splitFile(file){
    let result = [];
    try {
        let e = new Error();
        console.log(`notes: file: ‷${file}‴ ${e.fileName}:${e.lineNumber + 1}.`);
        if(file instanceof String || typeof file === 'string') file = Gio.File.new_for_path(GLib.build_filenamev([file]));
        console.log(`notes: file: ‷${file.get_path()}‴ ${e.fileName}:${e.lineNumber + 3}.`);
        let filename = file.get_basename();
        e = new Error();
        console.log(`notes: filename: ‷${filename}‴ ${e.fileName}:${e.lineNumber + 1}.`);
        result.unshift(filename);
        console.log(`notes: result: ‷${JSON.stringify(result)}‴ ${e.fileName}:${e.lineNumber + 3}.`);
        while((file = file.get_parent())){
            filename = file.get_basename();
            e = new Error();
            console.log(`notes: filename: ‷${filename}‴ ${e.fileName}:${e.lineNumber + 1}.`);
            result.unshift(filename);
            console.log(`notes: result: ‷${JSON.stringify(result)}‴ ${e.fileName}:${e.lineNumber + 3}.`);
        }
        e = new Error();
        console.log(`notes: result: ‷${JSON.stringify(result)}‴ ${e.fileName}:${e.lineNumber}.`);
    }catch(e){
        console.log(`notes: splitFile: ${e}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
        return [null, e];
    }
    return [true, result];
} // export function splitFile(file) //

export function log_message(id, text, e = new Error()){
    console.log(`${id}:${text}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
} // export function log_message(text, e = new Error()) //

export class GzzMessageDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(_title, _text, icon_name = null, buttons = null) {
        super({ styleClass: 'extension-dialog' });

        let _icon_name = icon_name;
        const e = new Error();
        if(!_icon_name){
            _icon_name = 'dialog-information';
            console.log(`notes: _icon_name: ‷${_icon_name}‴ ${e.fileName}:${e.lineNumber + 3}.`);
        }
        console.log(`notes: _icon_name: ‷${_icon_name}‴ ${e.fileName}:${e.lineNumber + 5}.`);
        const icon = new St.Icon({icon_name: _icon_name });
        this.contentLayout.add_child(icon);

        const messageLayout = new Dialog.MessageDialogContent({
            title: _title,
            description: _text,
        });
        this.contentLayout.add_child(messageLayout);

        this._result = false;
                
        if(buttons){
            if(Array.isArray(buttons)){
                this.setButtons(buttons);
            }else if(buttons instanceof Object){
                this.addButton(buttons);
            }else{
                this.addButton({
                    label: 'OK',
                    icon_name: 'dialog-ok', 
                    isDefault: true,
                    action: () => {
                        this.destroy();
                    },
                });
            }
        }else{
            this.addButton({
                label: 'OK',
                icon_name: 'dialog-ok', 
                isDefault: true,
                action: () => {
                    this.destroy();
                },
            });
        }
        console.log(`notes: end constructor(_title, _text, _icon_name = null, buttons = null): ‷${_icon_name}‴.`);
    } // constructor(_title, _text, _icon_name = null, buttons = null) //

    get_result(){
        return this._result;
    }

    set_result(res){
        this._result = !!res;
    }

    get result(){
        return this.get_result();
    }

    set result(res){
        this.set_result(res);
    }

} // export class GzzMessageDialog extends ModalDialog.ModalDialog //

export class GzzPromptDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({ styleClass: 'gzzextension-dialog' });

        let _icon_name = null;

        if('icon_name' in params){
            _icon_name = params.icon_name;
        }

        let icon = new St.Icon({icon_name: (_icon_name ? _icon_name : 'notes-app')});
        this.contentLayout.add_child(icon);

        let messageLayout = new Dialog.MessageDialogContent({
            title: params.title,
            description: params.description,
        });

        let hint_text_ = _('start typing text here.');

        if('hint_text' in params && (params.hint_text instanceof String || typeof params.hint_text === 'string')){
            hint_text_ = params.hint_text;
        }

        this._edit = new St.Entry({
            style_class: 'gzzpromptdialog-edit', 
            x_expand:    true, 
            y_expand:    true, 
            hint_text:   hint_text_, 
        });

        let max_length = 100;

        if('max_length' in params && params.max_length instanceof Number){
            max_length = params.max_length.toFixed(0);
        }

        this._edit.clutter_text.set_max_length(max_length);
        /*
        this._edit.clutter_text.set_line_wrap(true);
        this._edit.clutter_text.set_single_line_mode(true);
        this._edit.clutter_text.set_use_markup(true);
        this._edit.clutter_text.set_editable(true);
        // */
        /*
        this._edit.clutter_text.connect('key-press-event', (_actor, event) => {
        });
        // */
        this.connect('key-release-event', (_actor, event) => {
            const symbol = event.get_key_symbol();
            let state  = event.get_state();
            //*
            state     &= ~Clutter.ModifierType.LOCK_MASK;
            state     &= ~Clutter.ModifierType.MOD2_MASK;
            state     &= Clutter.ModifierType.MODIFIER_MASK;
            // */
            if(symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter || symbol === Clutter.KEY_ISO_Enter){
                if(state &  Clutter.ModifierType.SHIFT_MASK){
                    const pos = this._edit.clutter_text.get_cursor_position();
                    this._edit.clutter_text.insert_text("\n", pos);
                    return Clutter.EVENT_STOP;
                }else{
                    this.triggerDefaultButton();
                    return Clutter.EVENT_STOP;
                }
            }else if(symbol === Clutter.KEY_Escape){
                this._result = false;
                this.destroy();
            }else{
                return Clutter.EVENT_PROPAGATE;
            }
        });

        this.contentLayout.add_child(messageLayout);

        if('text' in params){
            const _text = params.text;
            if(_text instanceof String || typeof _text === 'string'){
                this._edit.set_text(_text);
            }
        }

        this.contentLayout.add_child(this._edit);

        this._result = false;

        let ok_button = _('OK');

        if('ok_button' in params){
            ok_button = params.ok_button;
        }

        let ok_icon_name ='dialog-ok';

        if('ok_icon_name' in params){
            ok_icon_name = params.ok_icon_name;
        }

        this._ok_call_back = () => { this.distroy(); };

        if('ok_call_back' in params && params.ok_call_back instanceof Function){
            this._ok_call_back = params.ok_call_back;
        }
                
        if('buttons' in params && Array.isArray(params.buttons)){
            this.setButtons(params.buttons);
        }else{
            this.setButtons([{
                    label: _('Cancel'),
                    icon_name: 'stock_calc-cancel', 
                    action: () => {
                        this._result = false;
                        this.destroy();
                    },
                },
                {
                    label: ok_button,
                    icon_name: ok_icon_name, 
                    isDefault: true,
                    action: () => {
                        this._result = true;
                        this._ok_call_back();
                        this.destroy();
                    },
                }
            ]);
        }

        this._default_action = null;

    } // constructor(params) //

    triggerDefaultButton(){
        if(this._default_action){
            this._default_action();
        }
    }

    addButton(buttonInfo){
        super.addButton(buttonInfo);
        if('isDefault' in buttonInfo && buttonInfo.isDefault){
            if('action' in buttonInfo && buttonInfo.action instanceof Function){
                this._default_action = buttonInfo.action;
            }
        }
    }

    get_result(){
        return this._result;
    }

    set_result(res){
        this._result = !!res;
    }

    get result(){
        return this.get_result();
    }

    set result(res){
        this.set_result(res);
    }

    get_text(){
        return this._edit.get_text();
    }

    set_text(_text){
        if(_text instanceof String || typeof _text === 'string'){
            this._edit.set_text(_text);
        }
    }

    get text(){
        return this.get_text();
    }

    set text(_text){
        this.set_text(_text);
    }

    get_ok_call_back(){
        return this._ok_call_back;
    }
    set_ok_call_back(cb){
        if(cb instanceof Function){
            this._ok_call_back = cb;
        }
    }

    get ok_call_back(){
        return this.get_ok_call_back();
    }

    set ok_call_back(cb){
        this.set_ok_call_back(cb);
    }

    get_hint_text(){
        return this._edit.get_hint_text();
    }

    set_hint_text(txt){
        this._edit.set_hint_text(txt);
    }

    get hint_text(){
        return this.get_hint_text();
    }

    set hint_text(txt){
        this.set_hint_text(txt);
    }

} // export class GzzPromptDialog extends ModalDialog.ModalDialog //

export class GzzDialogType {

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `GzzDialogType.${this.name}`;
  }

  static Open = new GzzDialogType('Open');
  static Save = new GzzDialogType('Save');
  static SelectDir = new GzzDialogType('SelectDir');

}

export class GzzFileDialogBase extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({ styleClass: 'gzzextension-dialog' });

        if('dialogtype' in params){
            const dialogtype = params.dialogtype;
            if(dialogtype instanceof GzzDialogType){
                if(dialogtype.toString() === GzzDialogType.Open.toString()
                                    || dialogtype.toString() === GzzDialogType.Save.toString()
                                                                || dialogtype.toString() === GzzDialogType.SelectDir.toString()){
                    this._dialog_type = dialogtype;
                }else{
                    const dlg = new GzzMessageDialog(
                        'GzzFileDialogBase::dialog_type_error',
                        "Unkown GzzDialogType instance in GzzFileDialogBase(dialogtype).",
                        'dialog-error'
                    );
                    dlg.open();
                }
            }else{
                const dlg = new GzzMessageDialog(
                    'GzzFileDialogBase::dialog_type_error',
                    "dialog_type must be an instance of GzzDialogType.",
                    'dialog-error'
                );
                dlg.open();
            }
        }else{
            this._dialog_type = GzzDialogType.Save;
        }

        if('errorhandler' in params){
            this._error_handler = params.errorhandler;
        }else{
            this._error_handler = this.default_error_handler;
        }

        this._double_click_time = 400;

        if(this.constructor === GzzFileDialogBase){
            throw new Error('error GzzFileDialogBase is an abstract class create a derived class to use.');
        }

    } // constructor(params) //

    get_className(){
        return 'GzzFileDialogBase';
    }

    get className(){
        return this.get_className();
    }

    get_dialog_type(){
        return this._dialog_type;
    }

    set_dialog_type(dialogtype){
        if(dialogtype instanceof GzzDialogType){
            if(dialogtype.toString() === GzzDialogType.Open.toString()
                || dialogtype.toString() === GzzDialogType.Save.toString()
                    || dialogtype.toString() === GzzDialogType.SelectDir.toString()){
                this._dialog_type = dialogtype;
            }else{
                this._error_handler(this, "dialog_type_error", "Unkown GzzDialogType instance in set_dialog_type(dialogtype).");
            }
        }else{
            this._error_handler(this, "dialog_type_error", "dialog_type must be an instance of GzzDialogType.");
        }
    } // set dialog_type(dialogtype) //
    
    get dialog_type(){
        return this.get_dialog_type();
    }

    set dialog_type(dialogtype){
        this.set_dialog_type(dialogtype);
    }

    get_double_click_time(){
        return this._double_click_time;
    }

    set_double_click_time(dbl_click_time){
        if(Number.isNaN(dbl_click_time)){
            this._owner.apply_error_handler(this, 'GzzFileDialogBase::set_double_click_time_error', `bad value expected integer or date got ${dbl_click_time}`);
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)){
            this._double_click_time = Number(dbl_click_time);
        }else{
            this._owner.apply_error_handler(this, 'GzzFileDialogBase::set_double_click_time_error', `bad number type expected integer or Date ${dbl_click_time}`);
        }
    } // set double_click_time(dbl_click_time) //
    
    get double_click_time(){
        return this.get_double_click_time();
    }

    set double_click_time(dbl_click_time){
        this.set_double_click_time(dbl_click_time);
    }

    create_new_dir(){
        throw new Error('GzzFileDialogBase::create_new_dir_error: Cannot create an instace of a virtual class.');
    }

    default_error_handler(_error_owner, _name, msg){
        const dlg = new GzzMessageDialog(_name, msg, 'dialog-error');
        dlg.open();
    }

    get_error_handler(){
        return this._error_handler;
    }

    set_error_handler(handler){
        if(handler == null || typeof handler !== 'function'){
            this._error_handler = this.default_error_handler;
        }else{
            this._error_handler = handler;
        }
    }

    get error_handler(){
        return this.get_error_handler();
    }

    set error_handler(handler){
        this.set_error_handler(handler);
    }

    apply_error_handler(_error_owner, _name, msg){
        if(this._error_handler)
            this._error_handler(_error_owner, _name, msg);
    }

    display_dir(_dirname){
        throw new Error('GzzFileDialogBase::display_dir_error: Cannot create an instace of a virtual class.');
    }

    double_clicked(_error_owner, _title){
        throw new Error('GzzFileDialogBase::double_clicked_error: Cannot create an instace of a virtual class.');
    }

    clicked(_error_owner, _title){
        throw new Error('GzzFileDialogBase::clicked_error: Cannot create an instace of a virtual class.');
    }

} // export class GzzFileDialogBase extends ModalDialog.ModalDialog  //

export class GzzHeaderItem extends St.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({
            style_class: 'gzzdialog-header-item',
            x_expand:    true, 
            toggle_mode: true, 
        });

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(_owner === null){
                if(this._owner){
                    this._owner.apply_error_handler(this, 'GzzHeaderItem::owner_error', "owner cannot be null");
                }else{
                    throw new Error('GzzHeaderItem::owner_error: owner cannot be null');
                }
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
                this.notify('owner');
            }else{
                throw new Error('GzzHeaderItem::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzHeaderItem::owner_error: owner must be supplied');
        }

        if('array' in params){
            this.set_array(params.array);
        }else{
            const e = new Error();
            console.log('notes: GzzHeaderItem::constructor_error: Property array is required:' 
                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
            this._owner.apply_error_handler(this, 'GzzHeaderItem::constructor_error', 'Error: Property array is required.');
        }

    } // constructor(params) //

    get_title() {
        return this.label.text;
    }

    set_title(ttl) {
        _setLabel(this.label, ttl);
        this.notify('title');
    }

    get title(){
        return this.get_title();
    }

    set title(ttl){
        this.set_title(ttl);
    }

    get_owner() {
        return this._owner;
    }

    set_owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeaderItem::set_owner_error', "owner cannot be null");
            }else{
                throw new Error('GzzHeaderItem::set_owner_error: owner cannot be null');
            }
        }else if(_owner instanceof GzzFileDialogBase){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeaderItem::set_owner_error', "owner must be a GzzFileDialogBase");
            }else{
                throw new Error('GzzHeaderItem::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(_owner) //

    get owner(){
        return this.get_owner();
    }

    set owner(_owner){
        this.set_owner(_owner);
    }

    get_array(){
        return this._array;
    }

    set_array(arr){
        if(!arr){
            const e = new Error();
            console.log('notes: GzzHeaderItem::set_array_error: array cannot be empty or null:' 
                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
            this._owner.apply_error_handler(this, 'GzzHeaderItem::set_array_error', 'array cannot be empty or null');
        }else if(Array.isArray(arr)){
            this._array = arr;
            const title = this.array.at(-1);
            this.set_title(title);
            const file = Gio.File.new_for_path(GLib.build_filenamev(this._array));
            const home = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            if(file.equal(home)){
                this.set_icon_name('user-home');
            }
        }else{
            const e = new Error();
            console.log(`notes: GzzHeaderItem::set_array_error: array must be an array: you gave me ${JSON.stringify(this._array)}:` 
                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
            this._owner.apply_error_handler(
                this,
                'GzzHeaderItem::set_array_error',
                `notes: GzzHeaderItem::set_array_error: array must be an array: you gave me ${JSON.stringify(this._array)}:` 
                + ` ${e.fileName}:${e.lineNumber + 2}:${e.columnNumber}`
            );
        }
    } // set_array(arr) //

    get array(){
        return this.get_array();
    }

    set array(arr){
        this.set_array(arr);
    }

} // export class GzzHeaderItem extends St.Button //

export class GzzHeader extends St.BoxLayout {
    static {
        GObject.regiterClass(this);
    }

    constructor(params) {
        super({
            style_class: 'gzzdialog-list',
            vertical: false,
            x_expand: true,
            y_expand: false,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.START,
        });

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(!_owner){
                throw new Error('GzzHeader::owner_error: owner cannot be null' );
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
                this.notify('owner');
            }else{
                throw new Error('GzzHeader::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzHeader::owner_error: owner must be supplied');
        }

        let ok = null;
        let result = null;
        if('dir' in params){
            let dir_   = params.dir;
            if(!dir_){
                const path = GLib.build_filenamev([GLib.get_home_dir()]);
                if(path){
                    dir_= Gio.File.new_for_path(path);
                    if(dir_){
                        [ok, result] = splitFile(dir_);
                        if(ok){
                            this._array = this._current_array = result;
                        }else{
                            const e = new Error();
                            console.log(`notes: GzzHeader::constructor_error: splitFile error: ${result}:` 
                                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                            this._array = this._current_array = [];
                            //throw new Error(`GzzHeader::constructor_error: splitFile error: ${result}`);
                        }
                    }else{
                        const e = new Error();
                        console.log('notes: GzzHeader::constructor_error: could not get home dir:' 
                            + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                        this._array = this._current_array = [];
                        //throw new Error('GzzHeader::constructor_error: could not get home dir');
                    }
                }else{
                    const e = new Error();
                    console.log('notes: GzzHeader::constructor_error: could not get home dir:' 
                        + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                    this._array = this._current_array = [];
                    //throw new Error('GzzHeader::constructor_error: could not get home dir');
                }
            }else if(dir_ instanceof String || typeof dir_ === 'string' || dir_ instanceof Gio.File){
                [ok, result] = splitFile(dir_);
                if(!ok){
                    const e = new Error();
                    console.log(`notes: GzzHeader::constructor_error: splitFile error: ${result}:` 
                        + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                    this._array = this._current_array = [];
                    //throw new Error(`GzzHeader::constructor_error: splitFile error: ${result}`);
                }else{
                    this._array = this._current_array = result;
                }
            }else{
                const path = GLib.build_filenamev([GLib.get_home_dir()]);
                if(path){
                    dir_= Gio.File.new_for_path(path);
                    if(dir_){
                        [ok, result] = splitFile(dir_);
                        if(ok){
                            this._array = this._current_array = result;
                        }else{
                            const e = new Error();
                            console.log(`notes: GzzHeader::constructor_error: splitFile error: ${result}:` 
                                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                            this._array = this._current_array = [];
                            //throw new Error(`GzzHeader::constructor_error: splitFile error: ${result}`);
                        }
                    }else{
                        const e = new Error();
                        console.log('notes: GzzHeader::constructor_error: could not get home dir:' 
                            + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                        this._array = this._current_array = [];
                        //throw new Error('GzzHeader::constructor_error: could not get home dir');
                    }
                }else{
                    const e = new Error();
                    console.log('notes: GzzHeader::constructor_error: could not get home dir:' 
                        + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                    this._array = this._current_array = [];
                    //throw new Error('notes: GzzHeader::constructor_error: could not get home dir:' 
                    //    + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                }
            }
        }else{
            const path = GLib.build_filenamev([GLib.get_home_dir()]);
            if(path){
                let dir_= Gio.File.new_for_path(path);
                if(dir_){
                    [ok, result] = splitFile(dir_);
                    if(ok){
                        this._array = this._current_array = result;
                    }else{
                        const e = new Error();
                        console.log(`notes: GzzHeader::constructor_error: splitFile error: ${result}:` 
                            + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                        this._array = this._current_array = [];
                        //throw new Error(`GzzHeader::constructor_error: splitFile error: ${result}`);
                    }
                }else{
                    const e = new Error();
                    console.log('GzzHeader::constructor_error: could not get home dir:' 
                        + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                    this._array = this._current_array = [];
                    //throw new Error('GzzHeader::constructor_error: could not get home dir');
                }
            }else{
                const e = new Error();
                console.log('notes: GzzHeader::constructor_error: dir must be supplied:' 
                    + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                this._array = this._current_array = [];
                //throw new Error('GzzHeader::constructor_error: dir must be supplied');
            }
        }

        this._show_root = false;

    } // constructor(params) //

    get_owner() {
        return this._owner;
    }

    set_owner(_owner) {
        if(!_owner){
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeader::set_owner_error', "owner cannot be null");
            }else{
                const dlg = new GzzMessageDialog('GzzHeader::set_owner_error', "owner cannot be null", 'dialog-error');
                dlg.open();
            }
        }else if(_owner instanceof GzzFileDialogBase){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeader::set_owner_error', "owner must be a GzzFileDialogBase");
            }else{
                throw new Error('GzzHeader::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(_owner) //

    get owner(){
        return this.get_owner();
    }

    set owner(_owner){
        this.set_owner(_owner);
    }

    get_show_root(){
        return this._show_root;
    }

    set_show_root(showroot){
        if(this._show_root != !!showroot){
            this._show_root = !!showroot;
            if(this._array && this._array.length > 0){
                this.destroy_all_children();
                this.add_buttons();
            }
        }
    }

    get show_root(){
        return this.get_show_root();
    }

    set show_root(showroot){
        this.set_show_root(showroot);
    }

    display_dir(_dirname){
        const [ok, array] = splitFile(_dirname);
        if(!ok){
            this._owner.apply_error_handler(this, 'GzzHeader::display_dir_error', `splitFile Error: ${array}`);
            return null;
        }
        if(!this._array || this._array.length == 0){
            this._array = array;
        }
        const length = Math.min(array.length, this._array.length);
        this._current_array = array;
        if(length < this._array.length && array === this._array.slice(0, length)){
            this.refresh_button_states();
            return true;
        }
        this._array = array;
        this.destroy_all_children();
        this.add_buttons()
        return true;
    } // display_dir(_dirname) //

    add_buttons(){
        for(let i = 0; i <= this._array.length; i++){
            this.add_button(this._array.slice(0, i));
        }
    }

    add_button(array){
        const [ok, home]   = splitFile(Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()])));
        let e    = new Error();
        console.log(`notes: GzzHeader::add_button ok === ${ok}: ${e.fileName}:${e.lineNumber + 1}`);
        console.log(`notes: GzzHeader::add_button home === ${home}: ${e.fileName}:${e.lineNumber + 2}`);
        console.log(`notes: GzzHeader::add_button array === ${JSON.stringify(array)}: ${e.fileName}:${e.lineNumber + 3}`);
        console.log(`notes: GzzHeader::add_button home === ${JSON.stringify(home)}: ${e.fileName}:${e.lineNumber + 4}`);
        if(!ok){
            this._owner.apply_error_handler(this, 'GzzHeader::add_button_error', `splitFile Error: ${home}`);
            return;
        }
        console.log(`notes: GzzHeader::add_button this._show_root === ${this._show_root}: ${e.fileName}:${e.lineNumber + 9}`);
        if(this._show_root){
            const button_path  = Gio.File.new_for_path(GLib.build_filenamev(array));
            const current_path = Gio.File.new_for_path(GLib.build_filenamev(this._array));
            const current_button = current_path.equal(button_path);
            this.add_child(new GzzHeaderItem({
                owner: this._owner, 
                array, 
                checked: current_button, 
                action: () => { this.set_dir_path(button_path); }, 

            }));
        }else if(this.part_of_path(array, home)){
            const button_path  = Gio.File.new_for_path(GLib.build_filenamev(array));
            const current_path = Gio.File.new_for_path(GLib.build_filenamev(this._array));
            const current_button = current_path.equal(button_path);
            this.add_child(new GzzHeaderItem({
                owner: this._owner, 
                array, 
                checked: current_button, 
                action: () => { this.set_dir_path(button_path); }, 

            }));
        }
    } // add_button(array) //

    refresh_button_states(){
        const children = this.get_children();
        for(const child of children){
            if(child instanceof GzzHeaderItem){
                child.checked = (child.get_array() === this._current_array);
            }
        }
    }

    part_of_path(array, home){
        let e    = new Error();
        console.log(`notes: GzzHeader::part_of_path array === ${JSON.stringify(array)}: ${e.fileName}:${e.lineNumber + 1}`);
        console.log(`notes: GzzHeader::part_of_path home === ${JSON.stringify(home)}: ${e.fileName}:${e.lineNumber + 2}`);
        if(array.length <= home.length - 1){
            const length = Math.min(array.length, home.length - 1);
            e    = new Error();
            console.log(`notes: GzzHeader::part_of_path array === ${JSON.stringify(array)}: ${e.fileName}:${e.lineNumber + 1}`);
            console.log(`notes: GzzHeader::part_of_path length === ${length}: ${e.fileName}:${e.lineNumber + 2}`);
            console.log(
                `notes: GzzHeader::part_of_path home.slice(0, length) === ${JSON.stringify(home.slice(0, length))}:` 
                + ` ${e.fileName}:${e.lineNumber + 5}`
            );
            if(array === home.slice(0, length)){
                console.log(`notes: GzzHeader::part_of_path return === ${true}: ${e.fileName}:${e.lineNumber + 8}`);
                return true;
            }
        }
        return false;
    }

    get_dir_path(){
        return Gio.File.new_for_path(GLib.build_filenamev(this._array));
    }

    set_dir_path(file){
        const e = new Error();
        console.log(`notes: GzzHeader::set_dir_path file error: ${file}:` 
            + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
        if(file){
            const [ok, array] = splitFile(file);
            if(!ok){
                const e = new Error();
                console.log(`notes: GzzHeader::set_dir_path file error: ${array}:` 
                    + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
                this._owner.apply_error_handler(this, 'GzzHeader::add_button_error', `splitFile Error: ${array}`);
                return;
            }
            this._current_array = array;
            if(array.length <= this._array.length){
                if(array === this._array.slice(0, array.length)){
                    this.refresh_button_states();
                    this._owner._list_section.list.destroy_all_children();
                    this._owner.display_dir(file);
                }else{
                    this.destroy_all_children();
                    this._array = array;
                    this.add_buttons();
                    this._owner._list_section.list.destroy_all_children();
                    this._owner.display_dir(file);
                }
            }else{
                this.destroy_all_children();
                this._array = array;
                this.add_buttons();
                this._owner._list_section.list.destroy_all_children();
                this._owner.display_dir(file);
            }
        }else{
            const e = new Error();
            console.log('notes: GzzHeader::set_dir_path file error: file must have a value:' 
                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);
            this._owner.apply_error_handler(
                this,
                'GzzHeader::add_button_error',
                'notes: GzzHeader::set_dir_path file error: file must have a value:' 
                + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`
            );
        }
    } // set_dir_path(file) //

    get dir_path(){
        return this.get_dir_path();
    }

    set dir_path(file){
        this.set_dir_path(file);
    }

} // export class GzzHeader extends St.BoxLayout //

export  class GzzListFileSection extends St.BoxLayout {
      static {
            GObject.registerClass(this);
        }

    constructor(params) {
        super({
            style_class: 'gzzdialog-header-box',
            vertical: true,
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
        });

        this.list = new St.BoxLayout({
            style_class: 'gzzdialog-list-box',
            y_expand: true,
            vertical: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
        });

        this._listScrollView = new St.ScrollView({
            style_class: 'gzzdialog-list-scrollview',
            vertical: true,
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
            child: this.list,
        });

        this.label_actor = this.list;

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(!_owner){
                throw new Error('GzzListFileSection::owner_error: owner cannot be null');
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
                this.notify('owner');
            }else{
                throw new Error('GzzListFileSection::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzListFileSection::owner_error: owner must be supplied');
        }

        this.file_name_box = new St.BoxLayout({
            style_class: 'gzzdialog-header-box',
            vertical: false,
        });

        if('dialog_type' in params && params.dialog_type instanceof GzzDialogType 
                    && (params.dialog_type.toString() === GzzDialogType.Open.toString()
                                    || params.dialog_type.toString() === GzzDialogType.Save.toString()
                                                                || params.dialog_type.toString() === GzzDialogType.SelectDir.toString())){
            this._dialog_type = params.dialog_type;
        }else{
            this._dialog_type = GzzDialogType.Save;
        }

        if(this._dialog_type.toString() === GzzDialogType.Open.toString()){
            this._edit = new St.Label({style_class: 'gzzdialog-list-item-edit'});
        }else if(this._dialog_type.toString() === GzzDialogType.Save.toString()){
            this._edit = new St.Entry({style_class: 'gzzdialog-list-item-edit'});
        }else if(this._dialog_type.toString() === GzzDialogType.SelectDir.toString()){
            this._edit = new St.Label({style_class: 'gzzdialog-list-item-edit'});
        }

        this.show_root_button  = new St.Button({
            style_class: 'gzzdialog-list-item-button', 
            label:       "<", 
            checked:     true, 
        });
        this.show_root_button.connectObject('clicked', () => this.header.set_show_root(), this.header)

        this.new_dir_button  = new St.Button({
            style_class: 'gzzdialog-list-item-button',
            icon_name:   'stock_new-dir', 
        });
        this.new_dir_button.connectObject('clicked', () => this._owner.create_new_dir(), this._owner)

        this.file_name_box.add_child(this._edit);

        this._header_box = new St.BoxLayout({
            style_class: 'gzzdialog-header-box',
            vertical: false,
            x_expand: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
        });

        this.header = new GzzHeader({
            owner:      this._owner, 
            style_class: 'gzzdialog-header-box',
            dir:    this._owner.get_dir(),
        });

        this._header_box.add_child(this.show_root_button);
        this._header_box.add_child(this.header);
        this._header_box.add_child(this.new_dir_button);

        if(this._dialog_type.toString() !== GzzDialogType.SelectDir.toString()){
            this.add_child(this.file_name_box);
        }
        this.add_child(this._header_box);
        this.add_child(this._listScrollView);
    } // constructor(params) //

    get_owner() {
        return this._owner;
    }

    set_owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzListFileSection::set_owner_error', "owner cannot be null");
            }else{
                const dlg = new GzzMessageDialog('GzzListFileSection::set_owner_error', "owner cannot be null", 'dialog-error');
                dlg.open();
            }
        }else if(_owner instanceof GzzFileDialogBase){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzListFileSection::set_owner_error', "owner must be a GzzFileDialogBase");
            }else{
                throw new Error('GzzListFileSection::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(_owner) //

    get owner(){
        return this.get_owner();
    }
    
    set owner(_owner){
        this.set_owner(_owner);
    }

    get_file_name(){
        return this._edit.get_text();
    }

    set_file_name(filename){
        log_message('notes', `GzzFileDialog::set_file_name: filename == ${filename}`);
        if(filename && (filename instanceof String || typeof filename == 'string')){
            this._edit.set_text(filename.trim());
        }
    }

    get file_name(){
        return this.get_file_name();
    }

    set file_name(filename){
        this.set_file_name(filename);
    }

} // export  class GzzListFileSection extends St.BoxLayout //

export class GzzListFileRow extends St.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({
            style_class: 'gzzdialog-label-item',
            vertical: false,
            x_expand: true,
            y_align: Clutter.ActorAlign.FILL,
        });

        textLayout.add_child(icon);
        textLayout.add_child(this._title);

        this.label_actor = this._title;
        this.add_child(textLayout);

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(!_owner){
                throw new Error('GzzListFileRow::owner_error: owner cannot be null');
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
                this.notify('owner');
            }else{
                throw new Error('GzzListFileRow::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzListFileRow::owner_error: owner must be supplied and must be a GzzFileDialogBase');
        }

        let icon_size_ = 16;
        if('icon_size' in params && Number.isInteger(params.icon_size)){
            icon_size_ = Number(params.icon_size);
        }

        let icon = new St.Icon({
            icon_name: (this._is_dir ? 'inode-directory' : 'notes-app'), 
            icon_size:  icon_size_, 
        });

        this._title = new St.Label({
            text:       params.title, 
            style_class: 'dialog-list-item-title',
            reactive:    true, 
        });

        let textLayout = new St.BoxLayout({
            vertical: false,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        textLayout.add_child(icon);
        textLayout.add_child(this._title);

        this.label_actor = this._title;
        this.add_child(textLayout);

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(!_owner){
                throw new Error('GzzListFileRow::owner_error: owner cannot be null');
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
                this.notify('owner');
            }else{
                throw new Error('GzzListFileRow::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzListFileRow::owner_error: owner must be supplied');
        }

        if('is_dir' in params){
            this._is_dir = !!params.is_dir;
        }else{
            this._is_dir = false;
        }

        if('icon' in params){
            icon.set_gicon(params.icon);
        }

        this.click_event_start  = null;
        this.double_click_start = null;
        if('double_click_time' in params){
            this.set_double_click_time(params.double_click_time);
        }else{
            this._double_click_time = 400;
        }
        this.click_count = 0;
        this._title.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
        this._title.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
    } // constructor(params) //

    handle_button_press_event(actor, event){
        switch(event.get_button()){
            case(1):
                log_message('notes', `GzzListFileRow::handle_button_press_event: button == ${event.get_button()}`);
                this.click_event_start = new Date().valueOf();
                log_message('notes', `GzzListFileRow::handle_button_press_event: this.click_event_start == ${this.click_event_start}`);
                if(this.double_click_start == null){
                    this.double_click_start = this.click_event_start;
                    log_message('notes', `GzzListFileRow::handle_button_press_event: this.double_click_start == ${this.double_click_start}`);
                    this.click_count = 0;
                    log_message('notes', `GzzListFileRow::handle_button_press_event: this.click_count == ${this.click_count}`);
                }
                return Clutter.EVENT_STOP;
            default:
                return Clutter.EVENT_PROPAGATE;
        } //switch(event.get_button()) //
    } // handle_button_press_event(actor, event) //

    handle_button_release_event(actor, event){
        let button_time = null;
        let button_double_time = null;
        let now = 0
        switch(event.get_button()){
            case(1):
                log_message('notes', `GzzListFileRow::handle_button_release_event: button == ${event.get_button()}`);
                now = new Date().valueOf();
                button_time = now - this.click_event_start;
                button_double_time = now - this.double_click_start;
                log_message('notes', `GzzListFileRow::handle_button_release_event: now == ${now}`);
                log_message('notes', `GzzListFileRow::handle_button_release_event: button_time == ${button_time}`);
                log_message('notes', `GzzListFileRow::handle_button_release_event: button_double_time == ${button_double_time}`);
                log_message('notes', `GzzListFileRow::handle_button_release_event: this._double_click_time == ${this._double_click_time}`);
                log_message(
                    'notes',
                    'GzzListFileRow::handle_button_release_event:' 
                    + ' button_time > 0 && button_double_time < this._double_click_time == ' 
                    + `${button_time > 0 && button_double_time < this._double_click_time}`
                );
                if(button_time > 0 && button_double_time < this._double_click_time){
                    this.click_event_start = null;
                    this.click_count++;
                    log_message('notes', `GzzListFileRow::handle_button_release_event: this.click_count == ${this.click_count}`);
                    log_message('notes', `GzzListFileRow::handle_button_release_event: this._is_dir == ${this._is_dir}`);
                    log_message('notes', `GzzListFileRow::handle_button_release_event: now == ${now}`);
                    if(this._is_dir){
                        if(this.click_count >= 2){
                            this.double_click_start = null;
                            this.click_count = 0;
                            this._owner.double_clicked(this, this._title.text);
                            return Clutter.EVENT_STOP;
                        }else{
                            // dir doesn't do single click //
                            return Clutter.EVENT_STOP;
                        }
                    }else{ // if(this._is_dir) //
                        this.click_count = 0;
                        this.double_click_start = null;
                        this._owner.clicked(this, this._title.text);
                        return Clutter.EVENT_STOP;
                    }
                }else{ // if(button_time > 0 && button_double_time < this._double_click_time) //
                    // click time out //
                    this.click_event_start = this.double_click_start = null;
                    this.click_count = 0;
                    return Clutter.EVENT_PROPAGATE;
                }
            default:
                return Clutter.EVENT_PROPAGATE;
        } //switch(event.get_button()) //
    } // handle_button_release_event(actor, event) //

    get_title() {
        return this._title.text;
    }

    set_title(title_) {
        _setLabel(this._title, title_);
        this.notify('title');
    }

    get title(){
        return this.get_title();
    }

    set title(title_){
        this.set_title(title_);
    }

    get_owner() {
        return this._owner;
    }

    set_owner(owner_) {
        if(owner_ === null){
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzListFileRow::set_owner_error', "owner cannot be null");
            }else{
                throw new Error('GzzListFileRow::set_owner_error: owner cannot be null');
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this._owner = owner_;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzListFileRow::set_owner_error', "owner must be a GzzFileDialogBase");
            }else{
                throw new Error('GzzListFileRow::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(_owner) //

    get owner(){
        return this.get_owner();
    }

    set owner(owner_){
        this.set_owner(owner_);
    }

    get_double_click_time(){
        return this._double_click_time;
    }

    set_double_click_time(dbl_click_time){
        if(Number.isNaN(dbl_click_time)){
            this._owner.apply_error_handler(this, 'GzzListFileRow::set_double_click_time_error', `bad value expected integer or date got ${dbl_click_time}`);
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)){
            this._double_click_time = Number(dbl_click_time);
        }else{
            this._owner.apply_error_handler(this, 'GzzListFileRow::set_double_click_time_error', `bad number type expected integer or Date ${dbl_click_time}`);
        }
    } // set double_click_time(dbl_click_time) //

    get double_click_time(){
        return this.get_double_click_time();
    }
    
    set double_click_time(dbl_click_time){
        this.set_double_click_time(dbl_click_time);
    }

    get_is_dir(){
        return this._is_dir;
    }

    set_is_dir(isdir){
        this._is_dir = !!isdir;
    }

    get is_dir(){
        return this.get_is_dir();
    }

    set is_dir(isdir){
        this.set_is_dir(isdir);
    }

} // export class GzzListFileRow extends St.BoxLayout //

export class GzzFileDialog extends GzzFileDialogBase {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super(params);

        this._list_section = new GzzListFileSection({
            owner:      this, 
            title:      params.title,
            dialogtype: this._dialog_type, 
        });

        let icon = new St.Icon({icon_name: 'inode-directory'});

        this.contentLayout.add_child(icon);

        this.contentLayout.add_child(this._list_section);

        if('dir' in params){
            const _dir = params.dir;
            const e    = new Error();
            console.log(`notes: GzzFileDialog::constructor _dir === ${_dir}: ${e.fileName}:${e.lineNumber + 1}`);
            if(!_dir){
                this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            }else if(_dir instanceof Gio.File){
                this._dir = _dir;
            }else if((_dir instanceof String || typeof _dir == 'string') && _dir.trim() != ''){
                this._dir = Gio.File.new_for_path(GLib.build_filenamev([_dir.trim()]));
            }else{
                this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            }
        }else{
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }

        const e = new Error();
        console.log(`notes: GzzFileDialog::constructor: this._dir === ${this._dir.get_path()}:` 
            + ` ${e.fileName}:${e.lineNumber + 1}:${e.columnNumber}`);

        if('file_name' in params){
            const _file_name = params.file_name;
            if(_file_name instanceof String || typeof _file_name == 'string'){
                this._file_name = _file_name.trim();
                this._list_section.set_file_name(this._file_name);
            }else{
                this._file_name = 'notes.txt';
                this._list_section.set_file_name(this._file_name);
            }
        }else{
            this._file_name = 'notes.txt';
        }
         
        if('contents' in params){
            const _contents = params.contents;
            if(_contents instanceof GLib.Bytes){
                this._contents = _contents;
            }else if(_contents instanceof String || typeof _contents == 'string'){
                this._contents = new GLib.Bytes(_contents);
            }else if(_contents == null){
                this._contents = _contents;
            }else{
                this._contents = null;
            }
        }else{
            this._contents = null;
        }

        if('filter' in params){
            const _filter = params.filter;
            if(!_filter){
                this._filter = new RegExp('^.*$');
            }else if(_filter instanceof RegExp){
                this._filter = _filter;
            }else if(_filter instanceof String || typeof _filter === 'string'){
                this._filter = new RegExp(_filter, "i");
            }else{
                const t = typeof _filter;
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::set_filter_error', 
                    `regex must be of type RegExp or /.../ or String you supplied ${_filter} of type ${t}`
                );
            }
        }else{
            this._filter = new RegExp('^.*$');
        }

        if('double_click_time' in params){
            const dbl_click_time = params.double_click_time;
            if(Number.isNaN(dbl_click_time)){
                this.apply_error_handler(
                    this, 
                    'GzzFileDialog::set_double_click_time_error',
                    `bad value expected integer or date got ${dbl_click_time}`
                );
            }else if(dbl_click_time instanceof Date){
                this._double_click_time = dbl_click_time.getTime();
            }else if(Number.isInteger(dbl_click_time)){
                this._double_click_time = Number(dbl_click_time);
            }else{
                this.apply_error_handler(
                    this, 
                    'GzzFileDialog::set_double_click_time_error',
                    `bad number type expected integer or Date ${dbl_click_time}`
                );
            }
        }else{
            this._double_click_time = 400;
        }

        let _label = _('Save');
        let _icon_name = 'stock_save';
        if(this._dialog_type.toString() !== GzzDialogType.Save.toString()){
            _label     = _('Open');
            _icon_name = _('folder-open');
        }

        this._result = false;

        this._save_done = null;

        if('save_done' in params && params.save_done instanceof Function){
            this._save_done = params.save_done;
        }
                
        this.setButtons([{
                label: _('Cancel'),
                icon_name: 'stock_calc-cancel', 
                action: () => {
                    this._result = false;
                    this.destroy();
                },
            },
            {
                label: _label,
                icon_name: _icon_name, 
                isDefault: true,
                action: () => {
                    this.do_open_save();
                    this.destroy();
                },
            }
        ]);

        this.display_dir(this._dir);
        this.fixup_header(this._dir);

        this._list_section._edit.connect('key-release-event', (_actor, _event) => {
            this._file_name = this._list_section._edit.get_text();
        });

    } // constructor(_title, _text) //

    get_className(){
        return 'GzzFileDialog';
    }

    get className(){
        return this.get_className();
    }

    get_result(){
        return this._result;
    }

    set_result(res){
        this._result  = !!res;
    }

    get result(){
        return this.get_result();
    }

    set result(res){
        this.set_result(res);
    }

    get_dir(){
        return this._dir;
    }

    set_dir(dir_){
        log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_}`);
        if(!dir_){
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }else if(dir_ instanceof Gio.File){
            log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_.get_path()}`);
            this._dir = dir_;
        }else if((dir_ instanceof String || typeof dir_ == 'string') && dir_.trim() != ''){
            log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_}`);
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([dir_.trim()]));
        }else{
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }
        log_message('notes', `GzzFileDialog::set_dir: this._dir.get_path() == ${this._dir.get_path()}`);
    } // set_dir(dir_) //

    get dir(){
        return this.get_dir();
    }

    set dir(dir_){
        this.set_dir(dir_);
    }

    get_file_name(){
        return this._file_name;
    }

    set_file_name(file_name_){
        if(file_name_ instanceof String || typeof file_name_ == 'string'){
            this._file_name = file_name_.trim();
            this._list_section.set_file_name(this._file_name);
        }else{
            this._file_name = 'notes.txt';
            this._list_section.set_file_name(this._file_name);
        }
    } // set file_name(_file_name) //

    get file_name(){
        return this.get_file_name();
    }

    set file_name(file_name_){
        this.set_file_name(file_name_);
    }

    get_full_path(){
        if(this._file_name.trim() === ''){
            return this._dir;
        }else{
            return Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
        }
    }

    get full_path(){
        return this.get_full_path();
    }

    get_contents(){
        return this._contents;
    }

    set_contents(_contents){
        if(_contents instanceof GLib.Bytes){
            this._contents = _contents;
        }else if(_contents instanceof String || typeof _contents == 'string'){
            this._contents = new GLib.Bytes(_contents);
        }else if(_contents == null){
            this._contents = _contents;
        }else{
            this._contents = null;
        }
    } // set contents(_contents) //

    get_filter(){
        return this._filter.toString;
    }

    set_filter(regex){
        if(!regex){
            this._filter = new RegExp('^.*$');
        }else if(regex instanceof RegExp){
            this._filter = regex;
        }else if(regex instanceof String || typeof regex === 'string'){
            this._filter = new RegExp(regex);
        }else{
            const t = typeof regex;
            this._owner.apply_error_handler(this,
                'GzzFileDialog::set_filter_error',
                `regex must be of type RegExp or /.../ or String you supplied ${regex} of type ${t}`);
        }
    } // set filter(regex) //

    get filter(){
        return this.get_filter();
    }

    set filter(regex){
        this.set_filter(regex);
    }

    get_glob(){
        return RegExp2glob(this._filter);
    }

    set_glob(glob_){
        const regex = glob2RegExp(glob_);
        if(regex) this._filter = regex;
    }

    get glob(){
        return this.get_glob();
    }

    set glob(glob_){
        this.set_glob(glob_);
    }

    add_row(row){
        this._list_section.list.add_child(row);
    }

    get_double_click_time(){
        return this._double_click_time;
    }

    set_double_click_time(dbl_click_time){
        if(Number.isNaN(dbl_click_time)){
            this._owner.apply_error_handler(this,
                'GzzFileDialog::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`);
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)){
            this._double_click_time = Number(dbl_click_time);
        }else{
            this._owner.apply_error_handler(this,
                'GzzFileDialog::set_double_click_time_error',
                `bad number type expected integer or Date ${dbl_click_time}`);
        }
    } // set double_click_time(dbl_click_time) //

    get double_click_time(){
        return this.set_double_click_time();
    }

    set double_click_time(dbl_click_time){
        this.set_double_click_time(dbl_click_time);
    }

    get_save_done(){
        return this._save_done;
    }

    set_save_done(sd){
        if(sd instanceof Function){
            this._save_done = sd;
        }else{
            this.apply_error_handler(
                this,
                'GzzFileDialog::set_save_done',
                'Error: GzzFileDialog::set_save_done: can oly be set to a function!'
            );
        }
    } // set_save_done(sd) //

    get save_done(){
        return this.get_save_done();
    }

    set save_done(sb){
        this.set_save_done(sb);
    }

    clicked(_row, filename){
        log_message('notes', `GzzFileDialog::clicked: filename == ${filename}`);
        this.set_file_name(filename);
    }

    double_clicked(_row, directory){
        log_message('notes', `GzzFileDialog::double_clicked: directory == ${directory}`);
        if(directory){
            this._list_section.list.destroy_all_children();
            const current_dir = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), directory]));
            log_message('notes', `GzzFileDialog::double_clicked: current_dir == ${current_dir.get_path()}`);
            this.set_dir(current_dir);
            this.display_dir(current_dir);
            this.fixup_header(current_dir);
        }
    }
    
    fixup_header(dirname){
        this._list_section.header.display_dir(dirname);
    }
    
    file_is_dir(file){
        // is it a directory or a symlink to a directory  //
        // will identify symlink directories as directory //
        /* keep here for now incase the bellow code does not work //
        [ok, linkpathbytearray, etag_out] = file.load_contents(null);
        if(ok){
            const decoder = new TextDecoder();
            linkpath = decoder.decode(linkpathbytearray);
            const linkfile = Gio.File.new_for_path(GLib.build_filenamev([linkpath]));
        }else{
        }
        // */
        let enumerator = null;
        const attributes = "standard::name,standard::type,standard::display_name,standard::icon";
        try {
            enumerator = file.enumerate_children(attributes, Gio.FileQueryInfoFlags.NONE, null);
            return enumerator !== null;
        } catch(_e){
            return null;
        }
    } // file_is_dir(file) //

    display_dir(filename){
        let enumerator = null;
        let is_dir_    = null;
        let title_     = null;
        let e    = new Error();
        console.log(`notes: GzzFileDialog::display_dir filename === ${filename}: ${e.fileName}:${e.lineNumber + 1}`);
        const attributes = "standard::name,standard::type,standard::display_name,standard::icon";
        try {
            enumerator = filename.enumerate_children(attributes, Gio.FileQueryInfoFlags.NONE, null);
            e    = new Error();
            console.log(`notes: GzzFileDialog::display_dir enumerator === ${enumerator}: ${e.fileName}:${e.lineNumber + 1}`);
            let info;
            while ((info = enumerator.next_file(null))) {
                e    = new Error();
                console.log(`notes: GzzFileDialog::display_dir info === ${info}: ${e.fileName}:${e.lineNumber + 1}`);
                if (this._dialog_type.toString() === GzzDialogType.SelectDir.toString() && info.get_file_type() !== Gio.FileType.DIRETORY) {
                    console.log(`notes: GzzFileDialog::display_dir info === ${info}: ${e.fileName}:${e.lineNumber + 3}`);
                    continue;
                }

                const file_type = info.get_file_type();

                is_dir_ = (file_type === Gio.FileType.DIRECTORY);
                e    = new Error();
                console.log(`notes: GzzFileDialog::display_dir file_type === ${file_type}: ${e.fileName}:${e.lineNumber + 1}`);
                console.log(`notes: GzzFileDialog::display_dir is_dir_ === ${is_dir_}: ${e.fileName}:${e.lineNumber + 2}`);

                const file     = enumerator.get_child(info);
                console.log(`notes: GzzFileDialog::display_dir file === ${file}: ${e.fileName}:${e.lineNumber + 5}`);

                if(file_type === Gio.FileType.SYMBOLIC_LINK){
                    is_dir_ = this.file_is_dir(file); // will identify symlink directories as directory //
                    console.log(`notes: GzzFileDialog::display_dir is_dir_ === ${is_dir_}: ${e.fileName}:${e.lineNumber + 9}`);
                }
                console.log(`notes: GzzFileDialog::display_dir this._filter === ${this._filter}: ${e.fileName}:${e.lineNumber + 11}`);
                const matches = info.get_name().match(this._filter);
                if (!matches && !is_dir_) {
                    e    = new Error();
                    console.log(`notes: GzzFileDialog::display_dir matches === ${matches}: ${e.fileName}:${e.lineNumber + 1}`);
                    continue;
                }

                const query_info = file.query_info('standard::display_name', Gio.FileQueryInfoFlags.NONE, null)
                e    = new Error();
                console.log(`notes: GzzFileDialog::display_dir query_info === ${query_info}: ${e.fileName}:${e.lineNumber + 1}`);
                title_ = query_info.get_display_name();
                console.log(`notes: GzzFileDialog::display_dir title_ === ${title_}: ${e.fileName}:${e.lineNumber + 3}`);
                if(!title_) title_ = info.get_name();
                console.log(`notes: GzzFileDialog::display_dir title_ === ${title_}: ${e.fileName}:${e.lineNumber + 5}`);

                const row = new GzzListFileRow({
                    owner:             this, 
                    title:             title_,
                    is_dir:            is_dir_, 
                    icon:              info.get_icon(), 
                    double_click_time: this._double_click_time, 
                });

                this.add_row(row);
            }
        } catch(e){
            console.log(`notes: ${e.stack}`);
            console.log(`notes: GzzFileDialog::display_dir_error: Exception caught: ${e}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
            this.apply_error_handler(
                this,
                'GzzFileDialog::display_dir_error',
                `Exception caught: ${e}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
            );
        }
    } // display_dir(filename) //

    do_open_save(){
        if(this._dialog_type.toString() === GzzDialogType.Open.toString()){
            const filename = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
            this._result = !!filename;
            if(this._save_done){
                this._save_done(this, this._result, this._dir, this._file_name);
            }
        }else if(this._dialog_type.toString() === GzzDialogType.Save.toString()){
            if(this.save_file()){
                if(this._save_done){
                    this._save_done(this, this._result, this._dir, this._file_name);
                }
            }
        }else if(this._dialog_type.toString() === GzzDialogType.SelectDir.toString()){
            const filename = this._dir.get_path().trim();
            this._result = !!filename;
            if(this._save_done){
                this._save_done(this, this._result, this._dir, '');
            }
        }
    } // do_open_save() //

    async save_file(){
        this._result = false;
        if(!this._dir){
            return this._result;
        }
        if(!this._contents){
            return this._result;
        }
        let ret = null;
        try {
            ret = GLib.mkdir_with_parents(this._dir.get_path(), 0o755);
            if(ret == -1){
                const e = new Error();
                console.log(
                    `notes: Error Glib.mkdir_with_parents('${this._dir.get_path()}', 0o755) failed`
                         + `: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
                );
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::save_file',
                    `Error: GzzFileDialog::save_file: ‷${e}‴: could not makedir for ` 
                         + `‷${this._dir.get_path()}‴: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
                );
            }
        }catch(e){
            console.log(`notes: ${e.stack}`);
            console.log(`notes: Error Exception: ${e}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`)
            this.apply_error_handler(
                this,
                'GzzFileDialog::save_file',
                `Error: GzzFileDialog::save_file: ‷${e}‴: could not makedir for ` 
                     + `‷${this._dir.get_path()}‴: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
            );
            return this._result;
        }
        try {
            const file_path = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
            if(file_path){
                const outputStream = await file_path.create_async(Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null);
                const bytesWritten = await outputStream.write_bytes_async(this._contents, GLib.PRIORITY_DEFAULT, null);
                this._result = (bytesWritten == this._contents.get_size());
            }else{
                const e = new Error();
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::save_file',
                    `Error: GzzFileDialog::save_file: Bad file name: ‷${file_path}‴: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
                );
            }
        }catch(e){
            console.log(`notes: ${e.stack}`);
            console.log(`notes: Error: ‷${e}‴: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
            this.apply_error_handler(
                this,
                'GzzFileDialog::save_file',
                `Error: GzzFileDialog::save_file: ‷${e}‴: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
            );
            return this._result;
        }
        return this._result;
    } // async save_file() //

    save_to_file(_dir = null, name = null, _contents = null){
        if(_dir instanceof Gio.File || _dir instanceof String || typeof _dir == 'string'){
            this.set_dir(_dir);
        }
        if(name instanceof Gio.File || name instanceof String || typeof name == 'string'){
            this.set_name(name);
        }
        if(_contents instanceof GLib.Bytes || _contents instanceof String || typeof _contents == 'string'){
            this.set_contents(_contents);
        }
        this.open();
    } // async save_to_file() //

    create_new_dir(){
        const dlg = new GzzPromptDialog({
            title:       _('Make Directory'), 
            description: _('Type a new name for the new directory.'), 
            ok_button:   _('Make Directory'), 
            icon_name:   'folder-new', 
            ok_call_back: () => {
                const new_dir = dlg.get_text().trim();
                if(new_dir !== ''){
                    const dir = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), new_dir]));
                    try {
                        if(dir.make_directory(null)){
                            this.set_dir(dir);
                            this._list_section.list.destroy_all_children();
                            this.display_dir(dir);
                            this.fixup_header(dir);
                        }else{
                            this.apply_error_handler(this, 'GzzFileDialog::create_new_dir_error', `make_directory Error: ${new_dir}`);
                        }
                    }catch(e){
                        console.log(`notes: ${e.stack}`);
                        console.log(
                            'notes: GzzFileDialog::create_new_dir_error: '
                            + `make_directory Exception: ${e}: ${new_dir}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
                        );
                        this.apply_error_handler(
                            this,
                            'GzzFileDialog::create_new_dir_error',
                            `make_directory Exception: ${e}: ${new_dir}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`
                        );
                    }
                } // if(dlg.result && new_dir.trim() !== '') //
            }, 
        });
        dlg.open();
    } // create_new_dir() //

} // export class GzzFileDialog extends GzzFileDialogBase //
