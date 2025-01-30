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

let show_logs = true;

export function log_message(id, text, e){
    if(show_logs){
        console.log(`${id}:${text}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
    }
} // export function log_message(id, text, e) //

export function get_show_logs(){
    return show_logs;
}

export function set_show_logs(value){
    show_logs = !!value;
}

export function splitFile(file){
    let result = [];
    try {
        log_message('notes', `function splitFile: file == ${file}`, new Error());
        if(file instanceof String || typeof file === 'string') file = Gio.File.new_for_path(GLib.build_filenamev([file]));
        log_message('notes', `function splitFile: file: ‷${file.get_path()}‴`, new Error());
        let filename = file.get_basename();
        log_message('notes', `function splitFile: filename == ‷${filename}‴`, new Error());
        result.unshift(filename);
        log_message('notes', `function splitFile: result: ‷${JSON.stringify(result)}‴`, new Error());
        while((file = file.get_parent())){
            filename = file.get_basename();
            log_message('notes', `function splitFile: filename == ‷${JSON.stringify(result)}‴`, new Error());
            result.unshift(filename);
            log_message('notes', `function splitFile: result == ‷${JSON.stringify(result)}‴`, new Error());
        }
        log_message('notes', `function splitFile: result == ‷${result}‴`, new Error());
    }catch(e){
        log_message('notes', `function splitFile: filename == ‷${e}‴`, new Error());
        return [null, e];
    }
    return [true, result];
} // export function splitFile(file) //

export function array2file(array){
    return Gio.File.new_for_path(GLib.build_filenamev(array));
} // export function array2file(array) //

export function unixPermsToStr(file_type, perms, path){
    log_message('notes', `function  unixPermsToStr: file_type == ${file_type}`, new Error());
    log_message('notes', `function  unixPermsToStr: perms == ${perms}`, new Error());
    log_message('notes', `function  unixPermsToStr: path == ${path}`, new Error());
    let result = '';
    if(file_type == Gio.FileType.SYMBOLIC_LINK){
        result += 'l';
    }else if(file_type == Gio.FileType.DIRECTORY){
        result += 'd';
    }else if(file_type == Gio.FileType.SPECIAL){
        result += '|';
        /* cannot use GLib.lstat just now    //
        // no way to allocate a GLib.StatBuf //
        //let buf = new GLib.StatBuf();
        let buf = {};
        if(GLib.lstat(path, buf) === 0){
            const filetype = buf['st_mode'] & 0o0170000;
            switch(filetype){
                case 0o0140000:  // Socket //
                    result += 'S';
                    break;
                case 0o0060000: // Block Special //
                    result += 'b';
                    break;
                case 0o0020000: // Character Special //
                    result += 'c';
                    break;
                case 0o0010000: // FIFO //
                    result += '|';
                    break;
                case 0o0120000: // Symbolic Link //
                    result += 'l';
                    break;
                case 0o0100000: // Regular File //
                    result += '.';
                    break;
            } // switch(filetype) //
        } // if(GLib.lstat(path, buf) === 0) //
        // */
    }else if(file_type == Gio.FileType.REGULAR){
        result += '.';
    }else{ // WHAT ??? //
        result += '?';
    }
    if(!perms){
        result += '---------';
        return result;
    }
    if(perms & 0b100_000_000){
        result += 'r';
    }else{
        result += '-';
    }
    if(perms & 0b010_000_000){
        result += 'w';
    }else{
        result += '-';
    }
    if(perms & 0b001_000_000){
        if(perms & 0b100_000_000_00){
            result += 's';
        }else{
            result += 'x';
        }
    }else{
        result += '-';
    }
    if(perms & 0b000_100_000){
        result += 'r';
    }else{
        result += '-';
    }
    if(perms & 0b000_010_000){
        result += 'w';
    }else{
        result += '-';
    }
    if(perms & 0b000_001_000){
        if(perms & 0b010_000_000_00){
            result += 's';
        }else{
            result += 'x';
        }
    }else{
        result += '-';
    }
    if(perms & 0b000_000_100){
        result += 'r';
    }else{
        result += '-';
    }
    if(perms & 0b000_000_010){
        result += 'w';
    }else{
        result += '-';
    }
    if(perms & 0b000_000_001){
        if(perms & 0b001_000_000_00){
            result += 'T';
        }else{
            result += 'x';
        }
    }else{
        result += '-';
    }
    return result;
} // export function unixPermsToStr(perms) //

export function format_file_size(file_size, base2 = false){
    log_message('notes', `function  format_file_size: file_size == ${file_size}`, new Error());
    log_message('notes', `function  format_file_size: base2 == ${base2}`, new Error());
    let result = '';
    if(base2){
        const n = Math.floor(Math.floor(Math.log10(file_size))/3) * 3;
        switch(n){
            case 24:
                result = `${Math.round(file_size/1e24, 2)}YB`;
                break;
            case 21:
                result = `${Math.round(file_size/1e21, 2)}ZB`;
                break;
            case 18:
                result = `${Math.round(file_size/1e18, 2)}EB`;
                break;
            case 15:
                result = `${Math.round(file_size/1e15, 2)}PB`;
                break;
            case 12:
                result = `${Math.round(file_size/1e12, 2)}TB`;
                break;
            case 9:
                result = `${Math.round(file_size/1e9, 2)}GB`;
                break;
            case 6:
                result = `${Math.round(file_size/1e6, 2)}MB`;
                break;
            case 3:
                result = `${Math.round(file_size/1e9, 2)}kB`;
                break;
            case 0:
                result = `${Math.round(file_size, 2)}B`;
                break;
            default:
                result = `${file_size}B`;
        } // switch(n) //
    }else{
        const m = Math.floor(Math.floor(Math.log2(file_size))/10) * 10;
        switch(m){
            case 24:
                result = `${Math.round(file_size/(2 ** 24), 2)}YiB`;
                break;
            case 21:
                result = `${Math.round(file_size/(2 ** 21), 2)}ZiB`;
                break;
            case 18:
                result = `${Math.round(file_size/(2 ** 18), 2)}EiB`;
                break;
            case 15:
                result = `${Math.round(file_size/(2 ** 15), 2)}PiB`;
                break;
            case 12:
                result = `${Math.round(file_size/(2 ** 12), 2)}TiB`;
                break;
            case 9:
                result = `${Math.round(file_size/(2 ** 9), 2)}GiB`;
                break;
            case 6:
                result = `${Math.round(file_size/(2 ** 6), 2)}MiB`;
                break;
            case 3:
                result = `${Math.round(file_size/(2 ** 9), 2)}kiB`;
                break;
            case 0:
                result = `${Math.round(file_size, 2)}B`;
                break;
            default:
                result = `${file_size}B`;
        } // switch(n) //
    }
    return result;
} // export function format_file_size(file_size, base2 = false) //

export function subpathof(lhs, rhs){
    if(Array.isArray(lhs) && Array.isArray(rhs) && lhs.length <= rhs.length){
        const length = lhs.length;
        for(let i = 0; i < length; i++){
            if(lhs[i] != rhs[i]){
                return false;
            }
        }
        return true;
    } // if(lhs.length <= rhs.length) //
    return false;
} // export function subpathof(lhs, rhs) //

export function array_equal(lhs, rhs){
    if(Array.isArray(lhs) && Array.isArray(rhs) && lhs.length == rhs.length){
        const length = lhs.length;
        for(let i = 0; i < length; i++){
            if(lhs[i] != rhs[i]){
                return false;
            }
        }
        return true;
    } // if(lhs.length <= rhs.length) //
    return false;
} // export function array_equal(lhs, rhs) //

export class Button extends St.BoxLayout {
    static {
        GObject.registerClass({
            GTypeName: 'GzzButton',
            Signals: {
                'clicked': {
                    flags: GObject.SignalFlags.RUN_LAST,
                    param_types: [
                        GObject.TYPE_UINT,
                        Clutter.ModifierType.$gtype,
                    ],
                },
            },
        }, this);
    }

    constructor(params) {
        //log_message('notes', `Gzz::Button::constructor: params == ${JSON.stringify(params)}`, new Error());
        super({
            styleClass: 'gzz-button button',  
            reactive:    true, 
            name:        'gzzbutton', 
            vertical:    false,
            x_expand:    false,
            y_expand:    false,
            x_align:     Clutter.ActorAlign.START,
            y_align:     Clutter.ActorAlign.START,
        });

        /*
        this.set_margin_left(20);
        this.set_margin_right(20);
        this.set_margin_top(20);
        this.set_margin_bottom(20);
        // */

        if('styleClass' in params && (params.styleClass instanceof String || typeof params.styleClass === 'string')){
            this.set_style_class_name(params.styleClass.toString());
            this.set_style_class_name('button');
        }
        this.ensure_style();

        /* TODO: more params  //
            vertical:    false,
            x_expand:    true,
            y_expand:    false,
            x_align:     Clutter.ActorAlign.FILL,
            y_align:     Clutter.ActorAlign.START,
            toggle_mode: true, 
        // */

        this._icon = null;

        this._icon_name = null;

        if('icon_name' in params && (params.icon_name instanceof String || typeof params.icon_name === 'string')){
            this._icon_name = params.icon_name.trim();
        }

        this._icon_size = 32;

        if('icon_size' in params && Number.isInteger(params.icon_size) && params.icon_size > 0){
            this._icon_size = params.icon_size;
        }

        if(this._icon_name){
            this._icon = new St.Icon({
                icon_name:   this._icon_name, 
                icon_size:   this._icon_size, 
            });
        }

        let title_ = '';

        if('label' in params && (params.label instanceof String || typeof params.label === 'string')){
            title_ = params.label;
        }

        this._label = new St.Label({
            text:        title_, 
        });

        if(this._icon) this.add_child(this._icon);
        this.add_child(this._label);

        if(this._icon) this.set_child_at_index(this._icon, 0);
        this._label.set_margin_left(20);
        this._label.set_margin_right(20);
        this._label.set_margin_top(20);
        this._label.set_margin_bottom(20);

        this.connect('button-release-event', (_actor, event) => {
            log_message('notes', `Gzz::Button::button-release-event:  event == ${event}`, new Error());
            this.emit('clicked', event.get_button(), event.get_state());
            return Clutter.EVENT_PROPAGATE;
        });

    } // Button::constructor(params) //

    get_icon_name(){
        return this._icon_name;
    }

    set_icon_name(iconname){
        if(!iconname){
            if(this._icon){
                this.remove_child(this._icon);
                this._icon.destroy();
            }
            this._icon = this._icon_name = null;
        }else if(iconname instanceof String || typeof iconname === 'string'){
            this._icon_name = iconname;
            if(this._icon){
                this._icon.set_icon_name(this._icon_name);
            }else{
                this._icon = new St.Icon({
                    icon_name:   this._icon_name, 
                    icon_size:   this._icon_size, 
                });
                this.insert_child_at_index(this._icon, 0);
            }
        } // if(!iconname) ... else if(iconname instanceof String || typeof iconname === 'string') ... //
    } // set_icon_name(name_) //

    get icon_name(){
        return this.get_icon_name();
    }

    set icon_name(name_){
        this.set_icon_name(name_);
    }

    get_icon_size(){
        return this._icon_size;
    }

    set_icon_size(size){
        if(Number.isInteger(size) && size > 0){
            this._icon_size = size;
            if(this._icon){
                this._icon.set_icon_size(this._icon_size);
            }
        }
    } // set_icon_size(icon_size) //

    get icon_size(){
        return this.get_icon_size();
    }

    set icon_size(size){
        this.set_icon_size(size);
    }

    get_gicon(){
        if(this._icon){
            return this._icon.get_gicon();
        }
        return null;
    } // get_gicon() //

    set_gicon(icon){
        if(icon instanceof Gio.Icon){
            if(!this._icon){
                this._icon = new St.Icon({
                    icon_name:   this._icon_name, 
                    icon_size:   this._icon_size, 
                });
                this.add_child(this._icon);
            }
            this._icon.set_gicon(icon);
        } // if(icon instanceof Gio.Icon) //
    } // set_gicon(icon) //

    get gicon(){
        return this.get_gicon();
    }

    set gicon(icon){
        this.set_gicon(icon);
    }

    get_label(){
        return this._label.get_text();
    }

    set_label(title_){
        if(title_ instanceof String || typeof title_ === 'string'){
            this._label.set_text(title_);
        }
    }

    get label(){
        return this.get_label();
    }

    set label(ttl){
        this.set_label(ttl);
    }
    
} // export class Button extends St.BoxLayout //

export class GzzMessageDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(_title, _text, icon_name = null, buttons = null) {
        log_message('notes', `GzzMessageDialog::constructor: _title == ${_title}`, new Error());
        log_message('notes', `GzzMessageDialog::constructor: _text == ${_text}`, new Error());
        log_message('notes', `GzzMessageDialog::constructor: icon_name == ${icon_name}`, new Error());
        log_message('notes', `GzzMessageDialog::constructor: buttons == ${JSON.stringify(buttons)}`, new Error());
        super({ styleClass: 'extension-dialog' });

        let _icon_name = icon_name;
        if(!_icon_name){
            _icon_name = 'dialog-information';
            log_message('notes', `GzzMessageDialog::constructor: _icon_name == ‷${_icon_name}‴`, new Error());
        }
        log_message('notes', `GzzMessageDialog::constructor: _icon_name == ‷${_icon_name}‴`, new Error());
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
        log_message(
            'notes',
            `GzzMessageDialog::constructor: end constructor(_title, _text, _icon_name = null, buttons = null): ‷${_icon_name}‴`,
            new Error()
        );
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
        super({ styleClass: 'gzzextension-dialog', 
        });
        
        this.set_x_expand(true);
        this.set_y_expand(true);
        this.set_x_align(Clutter.ActorAlign.FILL);
        this.set_y_align(Clutter.ActorAlign.FILL);
        this.set_size(2560, 1080);

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

        this._icon_size = 16;

        if('icon_size' in params && Number.isInteger(params.icon_size)){
            this._icon_size = Number(params.icon_size);
        }

        if('errorhandler' in params){
            this._error_handler = params.errorhandler;
        }else{
            this._error_handler = this.default_error_handler;
        }

        this._double_click_time = 800;

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
        log_message('notes', `GzzFileDialogBase::set_double_click_time: dbl_click_time == ${dbl_click_time}`, new Error());
        if(Number.isNaN(dbl_click_time)){
            log_message(
                'notes',
                `GzzFileDialogBase::set_double_click_time: dbl_click_time == ${dbl_click_time}`
                + `bad value expected integer or date got ${dbl_click_time}`,
                new Error()
            );
            this._owner.apply_error_handler(
                this,
                'GzzFileDialogBase::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`, 
                new Error()
            );
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)){
            this._double_click_time = Number(dbl_click_time);
        }else{
            log_message(
                'notes',
                `GzzFileDialogBase::set_double_click_time: dbl_click_time == ${dbl_click_time}`
                + `bad value expected integer or Date ${dbl_click_time}`,
                new Error()
            );
            this._owner.apply_error_handler(
                this,
                'GzzFileDialogBase::set_double_click_time_error',
                `bad number type expected integer or Date ${dbl_click_time}`, 
                new Error()
            );
        }
    } // set_double_click_time(dbl_click_time) //
    
    get double_click_time(){
        return this.get_double_click_time();
    }

    set double_click_time(dbl_click_time){
        this.set_double_click_time(dbl_click_time);
    }

    create_new_dir(){
        throw new Error('GzzFileDialogBase::create_new_dir_error: Cannot create an instace of a virtual class.');
    }

    default_error_handler(_error_owner, _name, msg, e = null){
        log_message('notes', `GzzFileDialogBase::default_error_handler: _error_owner == ${_error_owner}`, new Error());
        log_message('notes', `GzzFileDialogBase::default_error_handler: _name == ${_name}`, new Error());
        log_message('notes', `GzzFileDialogBase::default_error_handler: msg == ${msg}`, new Error());
        if(e && e instanceof Error){
            msg += `: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`;
        }
        const dlg = new GzzMessageDialog(_name, msg, 'dialog-error');
        dlg.open();
        log_message('notes', `GzzFileDialogBase::default_error_handler: _error_owner == ${_error_owner}`, new Error());
        log_message('notes', `GzzFileDialogBase::default_error_handler: _name == ${_name}`, new Error());
        log_message('notes', `GzzFileDialogBase::default_error_handler: msg == ${msg}`, new Error());
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

    get_icon_size(){
        return this._icon_size;
    }

    set_icon_size(sz){
        if(Number.isInteger(sz)){
            this._icon_size = Number(sz);
        }
    } // set_icon_size(sz) //

    get icon_size(){
        return this.get_icon_size();
    }

    set icon_size(sz){
        this.set_icon_size(sz);
    }

    apply_error_handler(error_owner_, _name, msg, e = null){
        if(this._error_handler)
            this._error_handler(error_owner_, _name, msg, e);
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

export class GzzHeaderItem extends Button {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({
            name:        'gzzheaderitem', 
            ...params, 
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
            }else{
                throw new Error('GzzHeaderItem::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzHeaderItem::owner_error: owner must be supplied');
        }

        if('icon_size' in params && Number.isInteger(params.icon_size)){
            this.set_icon_size(Number(params.icon_size));
        }


        if('array' in params){
            this.set_array(params.array);
        }else{
            log_message('notes', 'GzzHeaderItem::constructor_error: Property array is required: ', new Error());
            this._owner.apply_error_handler( this, 'GzzHeaderItem::constructor_error', 'Error: Property array is required', new Error());
        }

        if('action' in params){
            const action_ = params.action;
            this.connect('clicked', () => { action_(); });
        }

    } // constructor(params) //

    /*
    get_title() {
        return this.label;
    }

    set_title(ttl) {
        if(!ttl){
            log_message('notes', `GzzHeaderItem::set_title: cannot set title to falsey value ttl == ${ttl}`, new Error());
            this._owner.apply_error_handler(this, 'GzzHeaderItem::set_title', 'cannot set title to falsey value', new Error());
        }else if(ttl instanceof String || typeof ttl === 'string'){
            this.label = `${ttl.toString()}`;
        }else{
            log_message('notes', `GzzHeaderItem::set_title: title set to weird value ttl == ${ttl}`, new Error());
            this.label = `${ttl}`;
        }
    }

    get title(){
        return this.get_title();
    }

    set title(ttl){
        this.set_title(ttl);
    }
    // */

    get_owner() {
        return this._owner;
    }

    set_owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeaderItem::set_owner_error', "owner cannot be null", new Error());
            }else{
                throw new Error('GzzHeaderItem::set_owner_error: owner cannot be null');
            }
        }else if(_owner instanceof GzzFileDialogBase){
            this._owner = _owner;
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeaderItem::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
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

    /*
    get_icon_size(){
        return this._icon_size;
    }

    set_icon_size(sz){
        if(Number.isInteger(sz)){
            this._icon_size = Number(sz);
        }
    } // set_icon_size(sz) //

    get icon_size(){
        return this.get_icon_size();
    }

    set icon_size(sz){
        this.set_icon_size(sz);
    }
    // */

    get_array(){
        return this._array;
    }

    set_array(arr){
        if(!arr || (Array.isArray(arr) && arr.length === 0)){
            log_message('notes', 'GzzHeaderItem::set_array: array cannot be empty or null:', new Error());
            this._owner.apply_error_handler(this, 'GzzHeaderItem::set_array_error', 'array cannot be empty or null', new Error());
        }else if(Array.isArray(arr)){
            this._array = arr;
            const title = this.array.at(-1);
            this.set_label(title);
            const file = Gio.File.new_for_path(GLib.build_filenamev(this._array));
            const home = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            if(file.equal(home)){
                this.set_icon_name('user-home');
                this.set_icon_size(this._icon_size);
            }
        }else{
            log_message('notes', `GzzHeaderItem::set_array: array must be an array: you gave me ${JSON.stringify(this._array)}:`, new Error());
            this._owner.apply_error_handler(
                this,
                'GzzHeaderItem::set_array_error',
                `notes: GzzHeaderItem::set_array_error: array must be an array: you gave me ${JSON.stringify(this._array)}:`,  
                new Error()
            );
        }
    } // set_array(arr) //

    get array(){
        return this.get_array();
    }

    set array(arr){
        this.set_array(arr);
    }

} // export class GzzHeaderItem extends Button //

export class GzzHeader extends St.BoxLayout {
    static {
        GObject.registerClass(this);
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
            }else{
                throw new Error('GzzHeader::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzHeader::constructor_error: owner must be supplied');
        }

        const [ok_, home]   = splitFile(Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()])));
        if(!ok_){
            log_message('notes', `GzzHeader::constructor: splitFile error could not get value of home ${home}`, new Error());
            this._owner.apply_error_handler(
                this,
                'GzzHeader::constructor',
                `GzzHeader::constructor: splitFile error could not get value of home ${home}`
            );
            throw new Error(`GzzHeader::constructor: splitFile error could not get value of home ${home}`);
        }

        this._home = home;

        let ok = null;
        let result = null;
        if('dir' in params){
            const dir_   = params.dir;
            if(!dir_){
                this._array = this._current_array = this._home;
                log_message('notes', `GzzHeader::constructor: dir must be defined dir == ${dir_} home assumed: `, new Error());
            }else if(dir_ instanceof String || typeof dir_ === 'string' || dir_ instanceof Gio.File){
                [ok, result] = splitFile(dir_);
                if(!ok){
                    log_message('notes', `GzzHeader::constructor: splitFile error: ${result}: `, new Error());
                    this._array = this._current_array = this._home;
                }else{
                    this._array = this._current_array = result;
                }
            }else{
                this._array = this._current_array = this._home;
                log_message('notes', `GzzHeader::constructor: error passed none path value as dir == ${dir_}: `, new Error());
            }
        }else{
            this._array = this._current_array = this._home;
            log_message('notes', 'GzzHeader::constructor_error: dir must be supplied home assumed: ', new Error());
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
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzHeader::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
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
        log_message('notes', `GzzHeader::set_show_root: showroot == ${showroot}`, new Error());
        if(this._show_root != !!showroot){
            this._show_root = !!showroot;
            if(this._array && this._array.length > 0){
                log_message('notes', `GzzHeader::set_show_root: this._array == ${JSON.stringify(this._array)}`, new Error());
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
            log_message('notes', `GzzHeader::display_dir: ok == ${ok}`, new Error());
            log_message('notes', `GzzHeader::display_dir: array == ${array}`, new Error());
            this._owner.apply_error_handler(this, 'GzzHeader::display_dir_error', `splitFile Error: ${array}`, new Error());
            return null;
        }
        log_message('notes', `GzzHeader::display_dir: array == ${JSON.stringify(array)}`, new Error());
        if(!this._array || this._array.length == 0){
            log_message('notes', `GzzHeader::display_dir: replacing value of this._array == ${JSON.stringify(this._array)}`, new Error());
            this._array = array;
            log_message('notes', `GzzHeader::display_dir: replacing value of this._array == ${JSON.stringify(this._array)}`, new Error());
        }
        const length = Math.min(array.length, this._array.length);
        log_message('notes', `GzzHeader::display_dir: array.length == ${array.length}`, new Error());
        log_message('notes', `GzzHeader::display_dir: this._array.length == ${this._array.length}`, new Error());
        log_message('notes', `GzzHeader::display_dir: length == ${length}`, new Error());
        this._current_array = array;
        if(subpathof(array, this._array)){
            log_message('notes', `GzzHeader::display_dir: refreshing button states length == ${length}`, new Error());
            this.refresh_button_states();
            return true;
        }
        this._array = array;
        log_message('notes', `GzzHeader::display_dir: rebuilding all buutons this._array == ${JSON.stringify(this._array)}`, new Error());
        this.destroy_all_children();
        this.add_buttons()
        return true;
    } // display_dir(_dirname) //

    add_buttons(){
        log_message('notes', `GzzHeader::add_buttons: this._array.length == ${this._array.length}`, new Error());
        let start = 1;
        if(this._show_root){
            start = 1;
        }else if(subpathof(this._home, this._array)){
            start = this._home.length;
        }
        this._current_array = this._array;
        for(let i = start; i <= this._array.length; i++){
            this.add_button(this._array.slice(0, i));
        }
    }

    add_button(array){
        log_message('notes', `GzzHeader::add_button: array == ${JSON.stringify(array)}`, new Error());
        log_message('notes', `GzzHeader::add_button: this._show_root == ${this._show_root}`, new Error());
        const button_path = Gio.File.new_for_path(GLib.build_filenamev(array));
        this.add_child(new GzzHeaderItem({
            owner:      this._owner, 
            styleClass: 'gzzdialog-header-item', 
            toggle_mode: true, 
            array, 
            checked:    array_equal(array, this._current_array), 
            icon_size:  this._owner.get_icon_size(), 
            action:     () => {
                if(!array_equal(array, this._current_array)){
                    this._current_array = array;
                    this._owner.set_dir(array2file(this._current_array));
                    this._owner._list_section.list.destroy_all_children();
                    this._owner.display_dir(button_path);
                }
                this.refresh_button_states(); 
            }, 

        }));
    } // add_button(array) //

    refresh_button_states(){
        const children = this.get_children();
        for(const child of children){
            if(child instanceof GzzHeaderItem){
                if(array_equal(child.get_array(), this._current_array)){
                    child.checked = true;
                    child.remove_style_class_name('gzzdialog-header-item');
                    child.add_style_class_name('gzzdialog-header-item-selected');
                    child.add_style_class_name('button');
                }else{
                    child.checked = false;
                    child.remove_style_class_name('gzzdialog-header-item-selected');
                    child.add_style_class_name('gzzdialog-header-item');
                    child.set_style_class_name('button');
                }
            }
        }
    }

    get_dir_path(){
        return Gio.File.new_for_path(GLib.build_filenamev(this._array));
    }

    set_dir_path(file){
        log_message('notes', `GzzHeader::set_dir_path: file == ${file}`, new Error());
        if(file){
            const [ok, array] = splitFile(file);
            if(!ok){
                log_message('notes', `GzzHeader::set_dir_path: array == ${array}`, new Error());
                this._owner.apply_error_handler(this, 'GzzHeader::add_button_error', `splitFile Error: ${array}`, new Error());
                return;
            }
            this._current_array = array;
            log_message('notes', `GzzHeader::set_show_root: this._current_array == ${JSON.stringify(this._current_array)}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: array == ${JSON.stringify(array)}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: this._array == ${JSON.stringify(this._array)}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: array.length == ${array.length}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: this._array.length == ${this._array.length}`, new Error());
            if(subpathof(array, this._array)){
                this.refresh_button_states();
                this._owner._list_section.list.destroy_all_children();
                this._owner.display_dir(file);
            }else{
                this.destroy_all_children();
                this._array = this._current_array = array;
                this.add_buttons();
                this._owner._list_section.list.destroy_all_children();
                this._owner.display_dir(file);
            }
        }else{
            log_message('notes', 'GzzHeader::set_dir_path file error: file must have a value:', new Error());
            this._owner.apply_error_handler(
                this,
                'GzzHeader::add_button',
                'notes: GzzHeader::set_dir_path file error: file must have a value:' 
                , new Error()
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
            x_align:  Clutter.ActorAlign.FILL,
            y_align:  Clutter.ActorAlign.FILL,
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
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
            child: this.list,
        });

        this._icon_size = 16;

        if('icon_size' in params && Number.isInteger(params.icon_size)){
            this._icon_size = Number(params.icon_size);
        }

        this.label_actor = this.list;

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(!_owner){
                throw new Error('GzzListFileSection::owner_error: owner cannot be null');
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
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

        this.show_root_button  = new Button({
            style_class: 'gzzdialog-list-item-button', 
            label:       "<", 
            checked:     false, 
        });
        this.show_root_button.connect('clicked', () => {
            const showroot = !this.header.get_show_root();
            log_message('notes', `GzzListFileSection::constructor: this.show_root_button.connect showroot == ${showroot}`, new Error());
            this.header.set_show_root(showroot) 
            this.show_root_button.checked = !showroot;
        })

        this.new_dir_button  = new Button({
            style_class: 'gzzdialog-list-item-button',
            icon_name:   'stock_new-dir', 
            icon_size:   this._owner.get_icon_size(), 
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
                this._owner.apply_error_handler(this, 'GzzListFileSection::set_owner_error', "owner cannot be null", new Error());
            }else{
                const dlg = new GzzMessageDialog('GzzListFileSection::set_owner_error', "owner cannot be null", 'dialog-error');
                dlg.open();
            }
        }else if(_owner instanceof GzzFileDialogBase){
            this._owner = _owner;
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzListFileSection::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
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

    get_icon_size(){
        return this._icon_size;
    }

    set_icon_size(sz){
        if(Number.isInteger(sz)){
            this._icon_size = Number(sz);
        }
    } // set_icon_size(sz) //

    get icon_size(){
        return this.get_icon_size();
    }

    set icon_size(sz){
        this.set_icon_size(sz);
    }

    get_file_name(){
        return this._edit.get_text();
    }

    set_file_name(filename){
        log_message('notes', `GzzListFileSection::set_file_name: filename == ${filename}`,  new Error());
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

        this._owner = null;

        if('owner' in params){
            const _owner = params.owner;
            if(!_owner){
                throw new Error('GzzListFileRow::owner_error: owner cannot be null');
            }else if(_owner instanceof GzzFileDialogBase){
                this._owner = _owner;
            }else{
                throw new Error('GzzListFileRow::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzListFileRow::owner_error: owner must be supplied and must be a GzzFileDialogBase');
        }

        if('is_dir' in params){
            this._is_dir = !!params.is_dir;
        }else{
            this._is_dir = false;
        }

        let icon_size_ = 16;
        if('icon_size' in params && Number.isInteger(params.icon_size) && 16 <= Number(params.icon_size) && Number(params.icon_size) <= 256){
            icon_size_ = Number(params.icon_size);
        }
        
        this._icon = new St.Icon({
            icon_name: (this._is_dir ? 'inode-directory' : 'notes-app'), 
            icon_size:  icon_size_, 
            x_align:    Clutter.ActorAlign.CENTER, 
            width:      icon_size_ + 10, 
            reactive:   true, 
        });

        if('icon' in params){
            this._icon.set_gicon(params.icon);
            this._icon.icon_size = icon_size_;
        }

        this._inode_number = 0;

        this._display_inode = null;

        if("display_inode" in params){
            this._display_inode = !!params.display_inode;
        }

        if('inode_number' in params && Number.isInteger(params.inode_number)){
            this._inode_number = Number(params.inode_number);
        }

        if(this._display_inode){
            this._inode = new St.Label({
                text:        `${this._inode_number}`, 
                style_class: 'dialog-list-item-inode',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       200, 
                reactive:    true, 
            });
        }

        this._file_type = Gio.FileType.UNKNOWN;

        if('file_type' in params && Number.isInteger(params.file_type)){
            this._file_type = params.file_type;
        }
        
        this._file = GLib.get_home_dir();

        if('file' in params){
            if(params.file instanceof String || typeof params.file === 'string'){
                this._file = params.file.toString();
            }else if(params.file instanceof Gio.File){
                this._file = params.file.get_path();
            }
        }
        log_message('notes', `GzzListFileRow::constructor: this._file == ${this._file}`, new Error());

        this._mode = '.---------';

        if('mode' in params && Number.isInteger(params.mode)){
            this._mode = unixPermsToStr(this._file_type, params.mode, this._file);
        }

        this._mode_box = null;

        this._display_mode = false;

        if('display_mode' in params){
            this._display_mode = !! params.display_mode;
        }

        if(this._display_mode){
            this._mode_box = new St.Label({
                text:        this._mode, 
                style_class: 'dialog-list-item-mode',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       160, 
                reactive:    true, 
            });
        }

        this._nlink = 0;

        if('nlink' in params && Number.isInteger(params.nlink)){
            this._nlink = Number(params.nlink);
        }

        this._display_number_links = false;

        if('display_number_links' in params){
            this._display_number_links = !!params.display_number_links;
        }

        this._nlink_box = null;

        if(this._display_number_links){
            this._nlink_box = new St.Label({
                text:        `${this._nlink}`, 
                style_class: 'dialog-list-item-title',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       40, 
                reactive:    true, 
            });
        }

        this._title = new St.Label({
            text:        params.title, 
            style_class: 'dialog-list-item-title',
            x_expand:    true,
            x_align:     Clutter.ActorAlign.FILL, 
            width:       300, 
            reactive:    true, 
        });

        this._create_time = GLib.DateTime.new_from_unix_local(0);

        if('create_time' in params && params.create_time instanceof GLib.DateTime){
            this._create_time = params.create_time;
        }

        this._display_times = GzzListFileRow.None;

        if('display_times' in params && Number.isInteger(params.display_times)
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 7){
            this._display_times = Number(params.display_times);
        }

        this._create = null;

        if(this._display_times & GzzListFileRow.Create){
            this._create = new St.Label({
                text:        this._create_time.format_iso8601(), 
                style_class: 'dialog-list-item-create',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
                reactive:    true, 
            });
        }

        this._modification_time = GLib.DateTime.new_from_unix_local(0);

        if('modification_time' in params && params.modification_time instanceof GLib.DateTime){
            this._modification_time = params.modification_time;
        }
        
        this._modification = null;

        if(this._display_times & GzzListFileRow.Modify){
            this._modification = new St.Label({
                text:        this._modification_time.format_iso8601(), 
                style_class: 'dialog-list-item-title',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
                reactive:    true, 
            });
        }

        this._access_time = GLib.DateTime.new_from_unix_local(0);

        if('access_time' in params && params.access_time instanceof GLib.DateTime){
            this._access_time = params.access_time;
        }
        
        this._access = null;

        if(this._display_times & GzzListFileRow.Access){
            this._access = new St.Label({
                text:        this._access_time.format_iso8601(), 
                style_class: 'dialog-list-item-title',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
                reactive:    true, 
            });
        }

        this._display_user_group = GzzListFileRow.No_User_Group;

        if('display_user_group' in params && Number.isInteger(params.display_user_group)
            && 0 <= Number(params.display_user_group) && Number(params.display_user_group) <= 3){
            this._display_user_group = Number(params.display_user_group);
        }
        
        log_message('notes', `GzzFileDialog::constructor: this._display_user_group == ${this._display_user_group}`, new Error());

        this._user_name = '';

        if('user_name' in params){
            if(params.user_name instanceof String || typeof params.user_name === 'string'){
                this._user_name = params.user_name.toString();
            }else{
                this._user_name = `${params.user_name}`;
            }
        }

        this._user = null;

        if(this._display_user_group & GzzListFileRow.User){
            this._user = new St.Label({
                text:        this._user_name, 
                style_class: 'dialog-list-item-user',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       250, 
                reactive:    true, 
            });
        }

        this._group_name = '';

        if('group_name' in params){
            if(params.group_name instanceof String || typeof params.group_name === 'string'){
                this._group_name = params.group_name.toString();
            }else{
                this._group_name = `${params.group_name}`;
            }
        }

        this._base2_file_sizes = false;

        if('base2_file_sizes' in params){
            this._base2_file_sizes = !!params.base2_file_sizes;
        }

        this._file_size  = '';

        if('file_size' in params && Number.isInteger(params.file_size)){
            this._file_size = format_file_size(params.file_size, this._base2_file_sizes);
        }

        this._group = null;

        if(this._display_user_group & GzzListFileRow.Group){
            this._group = new St.Label({
                text:        this._group_name, 
                style_class: 'dialog-list-item-group',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       250, 
                reactive:    true, 
            });
        }

        this._display_size = false;

        if('display_size' in params){
            this._display_size = !!params.display_size;
        }
        log_message('notes', `GzzListFileRow::constructor: this._display_size == ${this._display_size}`, new Error());
        log_message('notes', `GzzListFileRow::constructor: this._file_size == ${this._file_size}`, new Error());

        this._file_size_box = null;

        if(this._display_size){
            this._file_size_box = new St.Label({
                text:        this._file_size, 
                style_class: 'dialog-list-item-file-size',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       160, 
                reactive:    true, 
            });
        }
        log_message('notes', `GzzListFileRow::constructor: this._file_size_box == ${this._file_size_box}`, new Error());

        let textLayout = new St.BoxLayout({
            vertical: false,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        textLayout.add_child(this._icon);
        if(this._inode)         textLayout.add_child(this._inode);
        if(this._mode_box)      textLayout.add_child(this._mode_box);
        if(this._nlink_box)     textLayout.add_child(this._nlink_box);
        if(this._create)        textLayout.add_child(this._create);
        if(this._modification)  textLayout.add_child(this._modification);
        if(this._access)        textLayout.add_child(this._access);
        if(this._user)          textLayout.add_child(this._user);
        if(this._group)         textLayout.add_child(this._group);
        if(this._file_size_box) textLayout.add_child(this._file_size_box);
        textLayout.add_child(this._title);

        this.label_actor = this._title;
        this.add_child(textLayout);

        this.click_event_start  = null;
        this.double_click_start = null;
        if('double_click_time' in params){
            log_message(
                'notes',
                `GzzListFileRow::handle_button_press_event: params.double_click_time == ${params.double_click_time}`,
                new Error()
            );
            this.set_double_click_time(params.double_click_time);
        }else{
            this._double_click_time = 800;
        }
        this.click_count = 0;
        this._icon.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
        this._icon.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        if(this._inode){
            this._inode.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._inode.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._mode_box){
            this._nlink_box.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._nlink_box.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._create){
            this._create.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._create.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._modification){
            this._modification.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._modification.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._access){
            this._access.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._access.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._user){
            this._user.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._user.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._group){
            this._group.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._group.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        if(this._file_size_box){
            this._file_size_box.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
            this._file_size_box.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        }
        this._title.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
        this._title.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
    } // constructor(params) //

    static None          = 0b00000;
    static Create        = 0b00001;
    static Modify        = 0b00010;
    static Access        = 0b00100;
    static No_User_Group = 0b00000;
    static User          = 0b00001;
    static Group         = 0b00010;

    handle_button_press_event(actor, event){
        switch(event.get_button()){
            case(1):
                log_message('notes', `GzzListFileRow::handle_button_press_event: button == ${event.get_button()}`, new Error());
                if(!this.click_event_start){
                    this.click_event_start = new Date().valueOf();
                    if(!this.time_out_id){
                        this.time_out_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._double_click_time, () => {
                            this.click_event_start = this.double_click_start = null;
                            this.click_count = 0;
                            this.time_out_id = 0;
                            return GLib.SOURCE_REMOVE;
                        });
                    }
                }
                log_message(
                    'notes',
                    `GzzListFileRow::handle_button_press_event: this.click_event_start == ${this.click_event_start}`,
                    new Error()
                );
                if(this.double_click_start == null){
                    this.double_click_start = this.click_event_start;
                    log_message(
                        'notes',
                        `GzzListFileRow::handle_button_press_event: this.double_click_start == ${this.double_click_start}`,
                        new Error()
                    );
                    this.click_count = 0;
                    log_message(
                        'notes',
                        `GzzListFileRow::handle_button_press_event: this.click_count == ${this.click_count}`,
                        new Error()
                    );
                }
                return Clutter.EVENT_STOP;
            default:
                return Clutter.EVENT_PROPAGATE;
        } //switch(event.get_button()) //
    } // handle_button_press_event(actor, event) //

    handle_button_release_event(actor, event){
        let button_time_ = null;
        let button_double_time_ = null;
        let now = 0
        switch(event.get_button()){
            case(1):
                log_message(
                    'notes',
                    `GzzListFileRow::handle_button_release_event: button == ${event.get_button()}`,
                    new Error()
                );
                now = new Date().valueOf();
                log_message('notes', `GzzListFileRow::handle_button_press_event: this.click_event_start == ${this.click_event_start}`, new Error());
                button_time_ = now - this.click_event_start;
                log_message(
                    'notes',
                    `GzzListFileRow::handle_button_release_event: this.double_click_start == ${this.double_click_start}`,
                    new Error()
                );
                button_double_time_ = now - this.double_click_start;
                log_message('notes', `GzzListFileRow::handle_button_release_event: now == ${now}`, new Error());
                log_message(
                    'notes', `GzzListFileRow::handle_button_release_event: button_time_ == ${button_time_}`, new Error()
                );
                log_message(
                    'notes',
                    `GzzListFileRow::handle_button_release_event: button_double_time_ == ${button_double_time_}`,
                    new Error()
                );
                log_message(
                    'notes',
                    `GzzListFileRow::handle_button_release_event: this._double_click_time == ${this._double_click_time}`,
                    new Error()
                );
                log_message(
                    'notes',
                    'GzzListFileRow::handle_button_release_event:' 
                        + ' button_time_ > 0 && button_double_time_ < this._double_click_time == ' 
                            + `${button_time_ > 0 && button_double_time_ < this._double_click_time}`, 
                    new Error()
                );
                if(button_time_ > 0 && button_double_time_ < this._double_click_time){
                    this.click_count++;
                    if(this.click_count >= 2){
                        this.click_event_start = null;
                    }
                    log_message(
                        'notes',
                        `GzzListFileRow::handle_button_release_event: this.click_count == ${this.click_count}`,
                        new Error()
                    );
                    log_message('notes', `GzzListFileRow::handle_button_release_event: this._is_dir == ${this._is_dir}`, new Error());
                    log_message('notes', `GzzListFileRow::handle_button_release_event: now == ${now}`, new Error());
                    if(this._is_dir){
                        if(this.click_count >= 2){
                            this.click_event_start = this.double_click_start = null;
                            this.click_count = 0;
                            this._owner.double_clicked(this, this._title.text);
                            return Clutter.EVENT_STOP;
                        }else{
                            // dir doesn't do single click //
                            return Clutter.EVENT_STOP;
                        }
                    }else{ // if(this._is_dir) //
                        this.click_count = 0;
                        this.click_event_start = this.double_click_start = null;
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
        this._title.text = title_;
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
                this._owner.apply_error_handler(this, 'GzzListFileRow::set_owner_error', "owner cannot be null", new Error());
            }else{
                throw new Error('GzzListFileRow::set_owner_error: owner cannot be null');
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this._owner = owner_;
        }else{
            if(this._owner){
                this._owner.apply_error_handler(this, 'GzzListFileRow::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
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
        log_message('notes', `GzzListFileRow::set_double_click_time: dbl_click_time == ${dbl_click_time}`, new Error());
        if(Number.isNaN(dbl_click_time)){
            this._owner.apply_error_handler(
                this,
                'GzzListFileRow::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`,
                new Error()
            );
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)){
            this._double_click_time = Number(dbl_click_time);
        }else{
            log_message('notes', `GzzListFileRow::set_double_click_time: dbl_click_time == ${dbl_click_time}`
                + `bad number type expected integer or Date ${dbl_click_time}`, new Error());
            this._owner.apply_error_handler(
                this,
                'GzzListFileRow::set_double_click_time_error',
                `bad number type expected integer or Date ${dbl_click_time}`, 
                new Error()
            );
        }
    } // set_double_click_time(dbl_click_time) //

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

} // export class GzzLstFileRow extends St.BoxLayout //

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
            icon_size:  this._icon_size, 
        });

        let show_icon = true;

        if('show_icon' in params){
            show_icon = !!params.show_icons;
        }

        if(show_icon){
            let icon = new St.Icon({
                icon_name: 'inode-directory', 
                icon_size:  this._icon_size, 
            });

            this.contentLayout.add_child(icon);
        } // if(show_icon) //

        this.contentLayout.add_child(this._list_section);

        if('dir' in params){
            const _dir = params.dir;
            log_message('notes', `GzzFileDialog::constructor: _dir == ${_dir}`, new Error());
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

        log_message('notes', `GzzFileDialog::constructor: this._dir == ‷${this._dir}‴`, new Error());

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
                    `regex must be of type RegExp or /.../ or String you supplied ${_filter} of type ${t}`, 
                    new Error()
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
                    `bad value expected integer or date got ${dbl_click_time}`, 
                    new Error()
                );
            }else if(dbl_click_time instanceof Date){
                this._double_click_time = dbl_click_time.getTime();
            }else if(Number.isInteger(dbl_click_time)){
                this._double_click_time = Number(dbl_click_time);
            }else{
                this.apply_error_handler(
                    this, 
                    'GzzFileDialog::set_double_click_time_error',
                    `bad number type expected integer or Date ${dbl_click_time}`, 
                    new Error()
                );
            }
        }else{
            this._double_click_time = 800;
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

        this._base2_file_sizes = false;

        if('base2_file_sizes' in params){
            this._base2_file_sizes = !!params.base2_file_sizes;
        }

        this._display_times = 2; // Modify //

        if('display_times' in params && Number.isInteger(params.display_times) 
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 7){
            this._display_times = Number(params.display_times);
        }

        this._display_inode = false;

        if('display_inode' in params){
            this._display_inode = !!params.display_inode;
        }

        this._display_user_group = GzzListFileRow.User|GzzListFileRow.Group; // user-group //

        if('display_user_group' in params && Number.isInteger(params.display_user_group) 
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 3){
            this._display_user_group = Number(params.display_user_group);
        }
        log_message('notes', `GzzFileDialog::constructor: this._display_user_group == ${this._display_user_group}`, new Error());

        this._display_mode = false;

        if('display_mode' in params){
            this._display_mode = !!params.display_mode;
        }

        this._display_number_links = false;

        if('display_number_links' in params){
            this._display_number_links = !!params.display_number_links;
        }

        this._display_size = false;

        if('display_size' in params){
            this._display_size = !!params.display_size;
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
            log_message('notes', `GzzFileDialog::constructor: this._file_name == ${this._file_name}`, new Error());
            this._file_name = this._list_section._edit.get_text();
            log_message('notes', `GzzFileDialog::constructor: this._file_name == ${this._file_name}`, new Error());
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
        log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_}`, new Error());
        if(!dir_){
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }else if(dir_ instanceof Gio.File){
            log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_.get_path()}`, new Error());
            this._dir = dir_;
        }else if((dir_ instanceof String || typeof dir_ == 'string') && dir_.trim() != ''){
            log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_}`, new Error());
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([dir_.trim()]));
        }else{
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }
        log_message('notes', `GzzFileDialog::set_dir: this._dir.get_path() == ${this._dir.get_path()}`, new Error());
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
                `regex must be of type RegExp or /.../ or String you supplied ${regex} of type ${t}`, 
                 new Error()
            );
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
                `bad number type expected integer or Date ${dbl_click_time}`, 
                    new Error()
            );
        }
    } // set_double_click_time(dbl_click_time) //

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
                'Error: GzzFileDialog::set_save_done: can oly be set to a function!', 
                 new Error()
            );
        }
    } // set_save_done(sd) //

    get save_done(){
        return this.get_save_done();
    }

    set save_done(sb){
        this.set_save_done(sb);
    }

    get_base2_file_sizes(){
        return this._base2_file_sizes;
    }

    set_base2_file_sizes(base2){
        this._base2_file_sizes = !!base2;
    }

    get base2_file_sizes(){
        return this.get_base2_file_sizes();
    }

    set base2_file_sizes(base2){
        this.set_base2_file_sizes(base2);
    }

    get_display_times(){
        return this._display_times;
    }

    set_display_times(times){
        if(Number.isInteger(times) && 0 <= Number(times) && Number(times) <= 7){
            this._display_times = Number(times);
        }
    } // set_display_times(times) //

    get display_times(){
        return this.get_display_times();
    }

    set display_times(times){
        this.set_display_times(times);
    }

    get_display_inode(){
        return this._display_inode;
    }

    set_display_inode(di){
        this._display_inode = !!di;
    } // set_display_inode(sz) //

    get display_inode(){
        return this.get_display_inode();
    }

    set display_inode(di){
        this.set_display_inode(di);
    }

    get_display_user_group(){
        return this._display_user_group;
    }

    set_display_user_group(ug){
        if(Number.isInteger(ug) && 0 <= Number(ug) && Number(ug) <= 3){
            this._display_user_group = Number(ug);
        }
    } // set_display_user_group(ug) //

    get display_user_group(){
        return this.get_display_user_group();
    }

    set display_user_group(ug){
        this.set_display_user_group(ug);
    }

    get_display_mode(){
        return this._display_mode;
    }

    set_display_mode(dm){
        this._display_mode = !!dm;
    } // set_display_mode(dm) //

    get display_mode(){
        return this.get_display_mode();
    }

    set display_mode(dm){
        this.set_display_mode(dm);
    }

    get_display_number_links(){
        return this._display_number_links;
    }

    set_display_number_links(dnumber){
        this._display_number_links = !!dnumber;
    } // set_display_number_links(dnumber) //

    get display_number_links(){
        return this.get_display_number_links();
    }

    set display_number_links(dnumber){
        this.set_display_number_links(dnumber);
    }

    get_display_size(){
        return this._display_size;
    }

    set_display_size(dsz){
        this._display_size = !!dsz;
    } // set_display_size(dsz) //

    get display_size(){
        return this.get_display_size();
    }

    set display_size(dsz){
        this.set_display_size(dsz);
    }

    clicked(_row, filename){
        log_message('notes', `GzzFileDialog::clicked: filename == ${filename}`, new Error());
        this.set_file_name(filename);
    }

    double_clicked(_row, directory){
        log_message('notes', `GzzFileDialog::double_clicked: directory == ${directory}`, new Error());
        if(directory){
            this._list_section.list.destroy_all_children();
            const current_dir = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), directory]));
            log_message('notes', `GzzFileDialog::double_clicked: current_dir == ${current_dir.get_path()}`, new Error());
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
        log_message('notes', `GzzFileDialog::display_dir: start: filename == ‷${filename.get_path()}‴`, new Error());
        const attributes = "standard::name,standard::type,standard::display_name,standard::icon" 
                               + ",standard::*,unix::mode,icon,unix::uid,unix::gid,unix::inode"
                                    + ",unix::nlink,unix::is-mountpoint,trash::item-count"
                                        + ",trash::deletion-date,time::modified,time::created"
                                            + ",filesystem::readonly,owner::group,owner::user"
                                                + ",owner::user-real,recent::modified,id::file"
                                                    + ",standard::is-hidden"
                                                        + ",unix::blocks,mountable::unix-device-file"
                                                            + ",standard::content-type,standard::type";
        try {
            enumerator = filename.enumerate_children(attributes, Gio.FileQueryInfoFlags.NONE, null);
            log_message('notes', `GzzFileDialog::display_dir: enumerator == ‷${enumerator}‴`, new Error());
            let info;
            while ((info = enumerator.next_file(null))) {
                log_message('notes', `GzzFileDialog::display_dir: info == ‷${info}‴`, new Error());
                if (this._dialog_type.toString() === GzzDialogType.SelectDir.toString() && info.get_file_type() !== Gio.FileType.DIRETORY) {
                    log_message('notes', `GzzFileDialog::display_dir: info == ‷${info}‴`, new Error());
                    continue;
                }

                const file_type = info.get_file_type();

                is_dir_ = (file_type === Gio.FileType.DIRECTORY);
                log_message('notes', `GzzFileDialog::display_dir: file_type == ‷${file_type}‴`, new Error());
                log_message('notes', `GzzFileDialog::display_dir: is_dir_ == ‷${is_dir_}‴`, new Error());

                const file     = enumerator.get_child(info);
                log_message('notes', `GzzFileDialog::display_dir: file == ‷${file}‴`, new Error());

                if(file_type === Gio.FileType.SYMBOLIC_LINK){
                    is_dir_ = this.file_is_dir(file); // will identify symlink directories as directory //
                    log_message('notes', `GzzFileDialog::display_dir: is_dir_ == ‷${is_dir_}‴`, new Error());
                }
                log_message('notes', `GzzFileDialog::display_dir: this._filter == ‷${this._filter}‴`, new Error());
                log_message('notes', `GzzFileDialog::display_dir: is_dir_ == ‷${is_dir_}‴`, new Error());
                const matches = info.get_name().match(this._filter);
                if (!matches && !is_dir_) {
                    log_message('notes', `GzzFileDialog::display_dir: matches == ‷${matches}‴`, new Error());
                    continue;
                }

                const query_info = file.query_info(attributes, Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null)
                log_message('notes', `GzzFileDialog::display_dir: query_info == ‷${query_info}‴`, new Error());
                title_ = query_info.get_display_name();
                log_message('notes', `GzzFileDialog::display_dir: title_ == ‷${title_}‴`, new Error());
                if(!title_) title_ = info.get_name();
                log_message('notes', `GzzFileDialog::display_dir: title_ == ‷${title_}‴`, new Error());
                const filetype = query_info.get_file_type();
                log_message('notes', `GzzFileDialog::display_dir: filetype == ‷${filetype}‴`, new Error());

                log_message('notes', `GzzFileDialog::display_dir: this._double_click_time == ${this._double_click_time}`, new Error());
                const row = new GzzListFileRow({
                    owner:                this, 
                    title:                title_,
                    is_dir:               is_dir_, 
                    inode_number:         info.get_attribute_uint64('unix::inode'), 
                    mode:                 info.get_attribute_uint32('unix::mode'), 
                    file_type:            (filetype ? filetype : file_type), 
                    file:                 Gio.File.new_for_path(GLib.build_filenamev([filename.get_path(), info.get_name()])), 
                    icon:                 info.get_icon(), 
                    icon_size:            this._icon_size, 
                    create_time:          info.get_creation_date_time(),
                    modification_time:    info.get_modification_date_time(),
                    access_time:          info.get_access_date_time(),
                    user_name:            info.get_attribute_string('owner::user'),
                    group_name:           info.get_attribute_string('owner::group'),
                    file_size:            info.get_size(), 
                    nlink:                info.get_attribute_uint64('unix::nlink'), 
                    double_click_time:    this._double_click_time, 
                    display_times:        this._display_times, 
                    display_inode:        this._display_inode, 
                    display_user_group:   this._display_user_group, 
                    display_mode:         this._display_mode,
                    display_number_links: this._display_number_links,
                    display_size:         this._display_size,
                    base2_file_sizes:     this._base2_file_sizes, 
                });

                this.add_row(row);
            }
        } catch(e){
            log_message('notes', `GzzFileDialog::display_dir: ‷${e.stack}‴`, e);
            log_message('notes', `GzzFileDialog::display_dir: Exception caught == ‷${e}‴`, e);
            this.apply_error_handler( this, 'GzzFileDialog::display_dir', `Exception caught: ${e}:`, e);
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

    save_file(){
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
                log_message(
                    'notes',
                    `GzzFileDialog::save_file: this._dir.get_path() == ‷Error Glib.mkdir_with_parents(${this._dir.get_path()}, 0o755) failed‴`,
                    new Error()
                );
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::save_file',
                    `Error: GzzFileDialog::save_file: ‷${this._dir.get_path()}‴: could not makedir for ` 
                         + `‷${this._dir.get_path()}‴`, 
                    new Error()
                );
            }
        }catch(e){
            log_message('notes', `GzzFileDialog::save_file: Exception caught: ‷${e.stack}‴`, e);
            log_message('notes', `GzzFileDialog::save_file: Exception caught: ‷${e}‴`, e);
            this.apply_error_handler(
                this,
                'GzzFileDialog::save_file',
                `Error: GzzFileDialog::save_file: ‷${e}‴: could not makedir for `,
                e 
            );
            return this._result;
        }
        try {
            const file_path = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
            if(file_path){
                const outputStream = file_path.create(Gio.FileCreateFlags.NONE, null);
                const bytesWritten = outputStream.write_bytes(this._contents, null);
                this._result = (bytesWritten == this._contents.get_size());
            }else{
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::save_file',
                    `Error: GzzFileDialog::save_file: Bad file name: ‷${file_path}‴`,
                    new Error()
                );
            }
        }catch(e){
            log_message('notes', `GzzFileDialog::save_file: Error: ‷${e.stack}‴`, e);
            log_message('notes', `GzzFileDialog::save_file: Error: ‷${e}‴`, e);
            this.apply_error_handler(this, 'GzzFileDialog::save_file', `Error: GzzFileDialog::save_file: ‷${e}‴`, e);
            return this._result;
        }
        return this._result;
    } // save_file() //

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
                            this.apply_error_handler(
                                this, 'GzzFileDialog::create_new_dir_error', `make_directory Error: ${new_dir}`, new Error());
                        }
                    }catch(e){
                        log_message('notes', `GzzFileDialog::create_new_dir: make_directory Exception: ${e}`, e);
                        log_message('notes', `${e.stack}`, e);
                        this.apply_error_handler(this, 'GzzFileDialog::create_new_dir_error', `make_directory Exception: ${e}:`, e);
                    }
                } // if(dlg.result && new_dir.trim() !== '') //
            }, 
        });
        dlg.open();
    } // create_new_dir() //

} // export class GzzFileDialog extends GzzFileDialogBase //
