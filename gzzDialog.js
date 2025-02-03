// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */


// a useful Dialog box for showing a modal Dialog //
"use strict";

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
                        GObject.TYPE_OBJECT,
                        GObject.TYPE_UINT,
                        Clutter.ModifierType.$gtype,
                    ],
                },
            },
        }, this);
    }

    #_icon                  = null;
    #_label_orientation     = Button.Label_orientation.RIGHT;
    #_toggle_mode           = false;
    #_checked               = false;
    #_icon_size             = 32;
    #_icon_name             = null;
    #_label                 = null;

    constructor(params) {
        super({
            style_class: 'gzz-button button',  
            reactive:    true, 
            name:        'gzzbutton', 
            vertical:    false,
            x_expand:    false,
            y_expand:    false,
            x_align:     Clutter.ActorAlign.START,
            y_align:     Clutter.ActorAlign.START,
        });

        if('style_class' in params && (params.style_class instanceof String || typeof params.style_class === 'string')){
            this.set_style_class_name(params.style_class.toString());
        }

        if('width' in params && Number.isInteger(params.width)){
            this.set_width(Number(params.width));
        }

        if('label_orientation' in params && Number.isInteger(params.label_orientation)
            && 0 <= Number(params.label_orientation) && Number(params.label_orientation) <= 3){
            this.#_label_orientation = params.label_orientation;
        }

        if('x_expand' in params){
            this.set_x_expand(!!params.x_expand);
        }

        if('y_expand' in params){
            this.set_y_expand(!!params.y_expand);
        }

        if('x_align' in params && Number.isInteger(params.x_align) && 0 <= Number(params.x_align) && Number(params.x_align) <= 3){
            this.set_x_align(params.x_align);
        }

        if('y_align' in params && Number.isInteger(params.x_align) && 0 <= Number(params.x_align) && Number(params.x_align) <= 3){
            this.set_y_align(params.y_align);
        }

        if('toggle_mode' in params){
            this.#_toggle_mode = !!params.toggle_mode;
        }

        if('checked' in params){
            this.set_checked(params.checked);
        }

        if('icon_name' in params && (params.icon_name instanceof String || typeof params.icon_name === 'string')){
            this.#_icon_name = params.icon_name.trim();
        }

        if('icon_size' in params && Number.isInteger(params.icon_size) && params.icon_size > 0){
            this.#_icon_size = params.icon_size;
        }

        if(this.#_icon_name){
            this.#_icon = new St.Icon({
                icon_name:   this.#_icon_name, 
                icon_size:   this.#_icon_size, 
            });
        }

        let title_ = '';

        if('label' in params && (params.label instanceof String || typeof params.label === 'string')){
            title_ = params.label;
        }

        this.#_label = new St.Label({
            text:        title_, 
        });

        if(this.#_icon) this.add_child(this.#_icon);
        this.add_child(this.#_label);

        if(this.#_icon){
            switch(this.#_label_orientation){
                case Button.Label_orientation.LEFT:
                    this.set_vertical(false);
                    this.set_child_at_index(this.#_label, 0);
                    break;
                case Button.Label_orientation.RIGHT:
                    this.set_vertical(false);
                    this.set_child_at_index(this.#_icon, 0);
                    break;
                case Button.Label_orientation.ABOVE:
                    this.set_vertical(true);
                    this.set_child_at_index(this.#_label, 0);
                    break;
                case Button.Label_orientation.BELLOW:
                    this.set_vertical(true);
                    this.set_child_at_index(this.#_icon, 0);
                    break;
            } // switch(this.#_label_orientation) //
        } // if(this.#_icon) //

        this.connect('enter-event', (_actor, event) => {
            log_message('notes', `Gzz::Button::button-press-event:  event == ${event}`, new Error());
            this.add_style_pseudo_class('hover');
            return Clutter.EVENT_PROPAGATE;
        });

        this.connect('leave-event', (_actor, event) => {
            log_message('notes', `Gzz::Button::button-press-event:  event == ${event}`, new Error());
            this.remove_style_pseudo_class('hover');
            return Clutter.EVENT_PROPAGATE;
        });

        this.connect('button-press-event', (_actor, event) => {
            log_message('notes', `Gzz::Button::button-press-event:  event == ${event}`, new Error());
            log_message('notes', `Gzz::Button::button-press-event:  this.#_toggle_mode == ${this.#_toggle_mode}`, new Error());
            if(!this.#_toggle_mode){
                this.add_style_pseudo_class('active');
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this.connect('button-release-event', (_actor, event) => {
            log_message('notes', `Gzz::Button::button-release-event:  event == ${event}`, new Error());
            log_message('notes', `Gzz::Button::button-release-event:  this.#_toggle_mode == ${this.#_toggle_mode}`, new Error());
            log_message('notes', `Gzz::Button::button-release-event:  this.#_checked == ${this.#_checked}`, new Error());
            if(this.#_toggle_mode){
                if(this.#_checked){
                    this.add_style_pseudo_class('checked');
                }else{
                    this.remove_style_pseudo_class('checked');
                }
            }else{
                this.remove_style_pseudo_class('active');
            }
            this.emit('clicked', this, event.get_button(), event.get_state());
            return Clutter.EVENT_PROPAGATE;
        });

    } // Button::constructor(params) //
    
    static Label_orientation = {
        LEFT:   0, 
        RIGHT:  1, 
        ABOVE:  2, 
        BELLOW: 3, 
    };

    get_icon_name(){
        return this.#_icon_name;
    }

    set_icon_name(iconname){
        if(!iconname){
            if(this.#_icon){
                this.remove_child(this.#_icon);
                this.#_icon.destroy();
            }
            this.#_icon = this.#_icon_name = null;
        }else if(iconname instanceof String || typeof iconname === 'string'){
            this.#_icon_name = iconname.toString();
            if(this.#_icon){
                this.#_icon.set_icon_name(this.#_icon_name);
            }else{
                this.#_icon = new St.Icon({
                    icon_name:   this.#_icon_name, 
                    icon_size:   this.#_icon_size, 
                });
                switch(this.#_label_orientation){
                    case Button.Label_orientation.LEFT:
                        this.set_vertical(false);
                        this.insert_child_at_index(this.#_icon, 1);
                        break;
                    case Button.Label_orientation.RIGHT:
                        this.set_vertical(false);
                        this.insert_child_at_index(this.#_icon, 0);
                        break;
                    case Button.Label_orientation.ABOVE:
                        this.set_vertical(true);
                        this.insert_child_at_index(this.#_icon, 1);
                        break;
                    case Button.Label_orientation.BELLOW:
                        this.set_vertical(true);
                        this.insert_child_at_index(this.#_icon, 0);
                        break;
                } // switch(this.#_label_orientation) //
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
        return this.#_icon_size;
    }

    set_icon_size(size){
        if(Number.isInteger(size) && size > 0){
            this.#_icon_size = size;
            if(this.#_icon){
                this.#_icon.set_icon_size(this.#_icon_size);
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
        if(this.#_icon){
            return this.#_icon.get_gicon();
        }
        return null;
    } // get_gicon() //

    set_gicon(icon){
        if(icon instanceof Gio.Icon){
            if(!this.#_icon){
                this.#_icon = new St.Icon({
                    icon_name:   this.#_icon_name, 
                    icon_size:   this.#_icon_size, 
                });
                this.add_child(this.#_icon);
            }
            this.#_icon.set_gicon(icon);
        } // if(icon instanceof Gio.Icon) //
    } // set_gicon(icon) //

    get gicon(){
        return this.get_gicon();
    }

    set gicon(icon){
        this.set_gicon(icon);
    }

    get_label(){
        return this.#_label.get_text();
    }

    set_label(title_){
        if(title_ instanceof String || typeof title_ === 'string'){
            this.#_label.set_text(title_);
        }
    }

    get label(){
        return this.get_label();
    }

    set label(ttl){
        this.set_label(ttl);
    }

    get_toggle_mode(){
        return this.#_toggle_mode;
    }

    set_toggle_mode(toggle){
        this.#_toggle_mode = !!toggle;
        if(this.#_toggle_mode){
            if(this.#_checked){
                this.add_style_pseudo_class('checked');
            }else{
                this.remove_style_pseudo_class('checked');
            }
        } // if(this.#_toggle_mode) //
    } // set_toggle_mode(toggle) //

    get toggle_mode(){
        return this.get_toggle_mode();
    }

    set toggle_mode(toggle){
        this.set_toggle_mode(toggle);
    }

    get_checked(){
        return this.#_checked;
    }

    set_checked(check){
        this.#_checked = !!check;
        if(this.#_toggle_mode){
            if(this.#_checked){
                this.add_style_pseudo_class('checked');
            }else{
                this.remove_style_pseudo_class('checked');
            }
        } // if(this.#_toggle_mode) //
    } // set_checked(check) //

    get checked(){
        return this.get_checked();
    }

    set checked(check){
        this.set_checked(check);
    }

    get_label_orientation(){
        return this.#_label_orientation;
    }

    set_label_orientation(orientation){
        if(Number.isInteger(orientation) && 0 <= Number(orientation) && Number(orientation) <= 3){
            this.#_label_orientation = orientation;
        } // if(Number.isInteger(orientation) && 0 <= Number(orientation) && Number(orientation) <= 3) //
        if(this.#_icon){
            switch(this.#_label_orientation){
                case Button.Label_orientation.LEFT:
                    this.set_vertical(false);
                    this.set_child_at_index(this.#_label, 0);
                    break;
                case Button.Label_orientation.RIGHT:
                    this.set_vertical(false);
                    this.set_child_at_index(this.#_icon, 0);
                    break;
                case Button.Label_orientation.ABOVE:
                    this.set_vertical(true);
                    this.set_child_at_index(this.#_label, 0);
                    break;
                case Button.Label_orientation.BELLOW:
                    this.set_vertical(true);
                    this.set_child_at_index(this.#_icon, 0);
                    break;
            } // switch(this.#_label_orientation) //
        } // if(this.#_icon) //
    } // set_label_orientation(orientation) //

    get label_orientation(){
        return this.get_label_orientation();
    }

    set label_orientation(orientation){
        this.set_label_orientation(orientation);
    }

    
} // export class Button extends St.BoxLayout //

export class GzzMessageDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    #_result = false;

    constructor(title_, text_, icon_name = null, buttons = null) {
        log_message('notes', `GzzMessageDialog::constructor: title_ == ${title_}`, new Error());
        log_message('notes', `GzzMessageDialog::constructor: text_ == ${text_}`, new Error());
        log_message('notes', `GzzMessageDialog::constructor: icon_name == ${icon_name}`, new Error());
        log_message('notes', `GzzMessageDialog::constructor: buttons == ${JSON.stringify(buttons)}`, new Error());
        super({ styleClass: 'extension-dialog' });

        let icon_name_ = icon_name;
        if(!icon_name_){
            icon_name_ = 'dialog-information';
            log_message('notes', `GzzMessageDialog::constructor: #icon_name_ == ‷${icon_name_}‴`, new Error());
        }
        log_message('notes', `GzzMessageDialog::constructor: #icon_name_ == ‷${icon_name_}‴`, new Error());
        const icon = new St.Icon({icon_name: icon_name_ });
        this.contentLayout.add_child(icon);

        const messageLayout = new Dialog.MessageDialogContent({
            title: title_,
            description: text_,
        });
        this.contentLayout.add_child(messageLayout);

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
            `GzzMessageDialog::constructor: end constructor(title_, text_, icon_name_ = null, buttons = null): ‷${icon_name_}‴`,
            new Error()
        );
    } // constructor(title_, text_, icon_name = null, buttons = null) //

    get_result(){
        return this.#_result;
    }

    set_result(res){
        this.#_result = !!res;
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

    #_edit         = null;
    #_result       = false;
    #_ok_call_back = () => { this.distroy(); };
    #_default_action = null;

    constructor(params) {
        super({ styleClass: 'gzzextension-dialog' });

        let icon_name_ = null;

        if('icon_name' in params){
            icon_name_ = params.icon_name;
        }

        let icon = new St.Icon({icon_name: (icon_name_ ? icon_name_ : 'notes-app')});
        this.contentLayout.add_child(icon);

        let messageLayout = new Dialog.MessageDialogContent({
            title: params.title,
            description: params.description,
        });

        let hint_text_ = _('start typing text here.');

        if('hint_text' in params && (params.hint_text instanceof String || typeof params.hint_text === 'string')){
            hint_text_ = params.hint_text;
        }

        this.#_edit = new St.Entry({
            style_class: 'gzzpromptdialog-edit', 
            x_expand:    true, 
            y_expand:    true, 
            hint_text:   hint_text_, 
        });

        let max_length = 100;

        if('max_length' in params && params.max_length instanceof Number){
            max_length = params.max_length.toFixed(0);
        }

        this.#_edit.clutter_text.set_max_length(max_length);

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
                    const pos = this.#_edit.clutter_text.get_cursor_position();
                    this.#_edit.clutter_text.insert_text("\n", pos);
                    return Clutter.EVENT_STOP;
                }else{
                    this.triggerDefaultButton();
                    return Clutter.EVENT_STOP;
                }
            }else if(symbol === Clutter.KEY_Escape){
                this.#_result = false;
                this.destroy();
            }else{
                return Clutter.EVENT_PROPAGATE;
            }
        });

        this.contentLayout.add_child(messageLayout);

        if('text' in params){
            const text_ = params.text;
            if(text_ instanceof String || typeof text_ === 'string'){
                this.#_edit.set_text(text_);
            }
        }

        this.contentLayout.add_child(this.#_edit);

        let ok_button = _('OK');

        if('ok_button' in params){
            ok_button = params.ok_button;
        }

        let ok_icon_name ='dialog-ok';

        if('ok_icon_name' in params){
            ok_icon_name = params.ok_icon_name;
        }

        if('ok_call_back' in params && params.ok_call_back instanceof Function){
            this.#_ok_call_back = params.ok_call_back;
        }
                
        if('buttons' in params && Array.isArray(params.buttons)){
            this.setButtons(params.buttons);
        }else{
            this.setButtons([{
                    label: _('Cancel'),
                    icon_name: 'stock_calc-cancel', 
                    action: () => {
                        this.#_result = false;
                        this.destroy();
                    },
                },
                {
                    label: ok_button,
                    icon_name: ok_icon_name, 
                    isDefault: true,
                    action: () => {
                        this.#_result = true;
                        this.#_ok_call_back();
                        this.destroy();
                    },
                }
            ]);
        }

    } // constructor(params) //

    triggerDefaultButton(){
        if(this.#_default_action){
            this.#_default_action();
        }
    }

    addButton(buttonInfo){
        super.addButton(buttonInfo);
        if('isDefault' in buttonInfo && buttonInfo.isDefault){
            if('action' in buttonInfo && buttonInfo.action instanceof Function){
                this.#_default_action = buttonInfo.action;
            }
        }
    }

    get_result(){
        return this.#_result;
    }

    set_result(res){
        this.#_result = !!res;
    }

    get result(){
        return this.get_result();
    }

    set result(res){
        this.set_result(res);
    }

    get_text(){
        return this.#_edit.get_text();
    }

    set_text(_text){
        if(_text instanceof String || typeof _text === 'string'){
            this.#_edit.set_text(_text);
        }
    }

    get text(){
        return this.get_text();
    }

    set text(_text){
        this.set_text(_text);
    }

    get_ok_call_back(){
        return this.#_ok_call_back;
    }
    set_ok_call_back(cb){
        if(cb instanceof Function){
            this.#_ok_call_back = cb;
        }
    }

    get ok_call_back(){
        return this.get_ok_call_back();
    }

    set ok_call_back(cb){
        this.set_ok_call_back(cb);
    }

    get_hint_text(){
        return this.#_edit.get_hint_text();
    }

    set_hint_text(txt){
        this.#_edit.set_hint_text(txt);
    }

    get hint_text(){
        return this.get_hint_text();
    }

    set hint_text(txt){
        this.set_hint_text(txt);
    }

} // export class GzzPromptDialog extends ModalDialog.ModalDialog //

export class GzzDialogType {

    #name = '';

    constructor(name) {
    this.#name = name;
    }

    toString() {
    return `GzzDialogType.${this.#name}`;
    }

    static Open = new GzzDialogType('Open');
    static Save = new GzzDialogType('Save');
    static SelectDir = new GzzDialogType('SelectDir');

}

export class GzzFileDialogBase extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    #_icon_size = 16;
    #_dialog_type = GzzDialogType.Save;
    #_error_handler = this.default_error_handler;
    #_double_click_time = 800;

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
                    this.#_dialog_type = dialogtype;
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
        }

        if('icon_size' in params && Number.isInteger(params.icon_size)){
            this.#_icon_size = Number(params.icon_size);
        }

        if('errorhandler' in params){
            this.#_error_handler = params.errorhandler;
        }

        if(this.constructor === GzzFileDialogBase){
            throw new Error('error GzzFileDialogBase is an abstract class create a derived class to use.');
        }

    } // constructor(params) //

    static Double_click_time = {
        MIN: 400, 
        MAX: 2000, 
    };

    get_className(){
        return 'GzzFileDialogBase';
    }

    get className(){
        return this.get_className();
    }

    get_dialog_type(){
        return this.#_dialog_type;
    }

    set_dialog_type(dialogtype){
        if(dialogtype instanceof GzzDialogType){
            if(dialogtype.toString() === GzzDialogType.Open.toString()
                || dialogtype.toString() === GzzDialogType.Save.toString()
                    || dialogtype.toString() === GzzDialogType.SelectDir.toString()){
                this.#_dialog_type = dialogtype;
            }else{
                this.#_error_handler(this, "dialog_type_error", "Unkown GzzDialogType instance in set_dialog_type(dialogtype).");
            }
        }else{
            this.#_error_handler(this, "dialog_type_error", "dialog_type must be an instance of GzzDialogType.");
        }
    } // set dialog_type(dialogtype) //
    
    get dialog_type(){
        return this.get_dialog_type();
    }

    set dialog_type(dialogtype){
        this.set_dialog_type(dialogtype);
    }

    get_double_click_time(){
        return this.#_double_click_time;
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
            this.apply_error_handler(
                this,
                'GzzFileDialogBase::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`, 
                new Error()
            );
        }else if(dbl_click_time instanceof Date){
            this.#_double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)
            && GzzFileDialogBase.Double_click_time.MIN <= Number(dbl_click_time)
            && Number(dbl_click_time) <= GzzFileDialogBase.Double_click_time.MAX){
            this.#_double_click_time = Number(dbl_click_time);
        }else{
            log_message(
                'notes',
                `GzzFileDialogBase::set_double_click_time: dbl_click_time == ${dbl_click_time}`
                + `bad value expected integer or Date ${dbl_click_time}`,
                new Error()
            );
            this.apply_error_handler(
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

    create_new_dir(_caller){
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
        return this.#_error_handler;
    }

    set_error_handler(handler){
        if(handler == null || typeof handler !== 'function'){
            this.#_error_handler = this.default_error_handler;
        }else{
            this.#_error_handler = handler;
        }
    }

    get error_handler(){
        return this.get_error_handler();
    }

    set error_handler(handler){
        this.set_error_handler(handler);
    }

    get_icon_size(){
        return this.#_icon_size;
    }

    set_icon_size(sz){
        if(Number.isInteger(sz)){
            this.#_icon_size = Number(sz);
        }
    } // set_icon_size(sz) //

    get icon_size(){
        return this.get_icon_size();
    }

    set icon_size(sz){
        this.set_icon_size(sz);
    }

    apply_error_handler(error_owner_, _name, msg, e = null){
        if(this.#_error_handler)
            this.#_error_handler(error_owner_, _name, msg, e);
    }

    display_dir(_caller, _dirname){
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

    #_icon_size = 16;
    #_owner     = null;
    #_array     = [];

    constructor(params) {
        super({
            name:        'gzzheaderitem', 
            ...params, 
        });

        if('owner' in params){
            const owner_ = params.owner;
            if(!owner_){
                if(this.#_owner){
                    this.#_owner.apply_error_handler(this, 'GzzHeaderItem::owner_error', "owner cannot be null");
                }else{
                    throw new Error('GzzHeaderItem::owner_error: owner cannot be null');
                }
            }else if(owner_ instanceof GzzFileDialogBase){
                this.#_owner = owner_;
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
            this.#_owner.apply_error_handler( this, 'GzzHeaderItem::constructor_error', 'Error: Property array is required', new Error());
        }

        if('action' in params){
            const action_ = params.action;
            this.connect('clicked', (button, clicked_button, state) => { action_(button, clicked_button, state); });
        }

    } // constructor(params) //

    get_owner() {
        return this.#_owner;
    }

    set_owner(owner_) {
        if(!owner_){
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzHeaderItem::set_owner_error', "owner cannot be null", new Error());
            }else{
                throw new Error('GzzHeaderItem::set_owner_error: owner cannot be null');
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this.#_owner = owner_;
        }else{
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzHeaderItem::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
            }else{
                throw new Error('GzzHeaderItem::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(owner_) //

    get owner(){
        return this.get_owner();
    }

    set owner(owner_){
        this.set_owner(owner_);
    }

    get_array(){
        return this.#_array;
    }

    set_array(arr){
        if(!arr || (Array.isArray(arr) && arr.length === 0)){
            log_message('notes', 'GzzHeaderItem::set_array: array cannot be empty or null:', new Error());
            this.#_owner.apply_error_handler(this, 'GzzHeaderItem::set_array_error', 'array cannot be empty or null', new Error());
        }else if(Array.isArray(arr)){
            this.#_array = arr;
            const title = this.array.at(-1);
            this.set_label(title);
            const file = Gio.File.new_for_path(GLib.build_filenamev(this.#_array));
            const home = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            if(file.equal(home)){
                this.set_icon_name('user-home');
                this.set_icon_size(this.#_icon_size);
            }
        }else{
            log_message('notes', `GzzHeaderItem::set_array: array must be an array: you gave me ${JSON.stringify(this.#_array)}:`, new Error());
            this.#_owner.apply_error_handler(
                this,
                'GzzHeaderItem::set_array_error',
                `notes: GzzHeaderItem::set_array_error: array must be an array: you gave me ${JSON.stringify(this.#_array)}:`,  
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

export class AbstractHeader extends St.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    constructor(params){
        super({
            vertical: false,
            x_expand: true,
            y_expand: false,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.START,
            ...params, 
        });

        if(this.constructor === AbstractHeader){
            throw new Error('error AbstractHeader is an abstract class create a derived class to use.');
        }

    } // constructor(params) //

} // export class AbstractHeader extends St.BoxLayout //

export class AbstractListFileSection extends St.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    constructor(params){
        super({
            vertical: true,
            x_expand: true,
            y_expand: true,
            x_align:  Clutter.ActorAlign.FILL,
            y_align:  Clutter.ActorAlign.FILL,
            ...params, 
        });

        if(this.constructor === AbstractListFileSection){
            throw new Error('error AbstractListFileSection is an abstract class create a derived class to use.');
        }

    } // constructor(params) //

} // export class AbstractListFileSection extends St.BoxLayout //

export class GzzHeader extends AbstractHeader {
    static {
        GObject.registerClass(this);
    }

    #_owner             = null;
    #_list_file_section = null;
    #_array             = [];
    #_current_array     = [];
    #_home              = [];
    #_show_root         = false;

    constructor(params) {
        super({
            style_class: 'gzzdialog-list',
        });

        if('owner' in params){
            const owner_ = params.owner;
            if(!owner_){
                throw new Error('GzzHeader::owner_error: owner cannot be null' );
            }else if(owner_ instanceof GzzFileDialogBase){
                this.#_owner = owner_;
            }else{
                throw new Error('GzzHeader::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzHeader::constructor_error: owner must be supplied');
        }

        if('list_file_section' in params){
            const list_file_section_ = params.list_file_section;
            if(!list_file_section_){
                throw new Error('GzzHeader::list_file_section_error: list_file_section cannot be null');
           }else if(list_file_section_ instanceof AbstractListFileSection){
                this.#_list_file_section = list_file_section_;
            }else{
                throw new Error('GzzHeader::list_file_section_error: list_file_section must be an AbstractListFileSection');
            }
        }else{
            throw new Error('GzzHeader::constructor_error: list_file_section must be supplied');
        }

        const [ok_, home]   = splitFile(Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()])));
        if(!ok_){
            log_message('notes', `GzzHeader::constructor: splitFile error could not get value of home ${home}`, new Error());
            this.#_owner.apply_error_handler(
                this,
                'GzzHeader::constructor',
                `GzzHeader::constructor: splitFile error could not get value of home ${home}`
            );
            throw new Error(`GzzHeader::constructor: splitFile error could not get value of home ${home}`);
        }

        this.#_home = home;

        let ok = null;
        let result = null;
        if('dir' in params){
            const dir_   = params.dir;
            if(!dir_){
                this.#_array = this.#_current_array = this.#_home;
                log_message('notes', `GzzHeader::constructor: dir must be defined dir == ${dir_} home assumed: `, new Error());
            }else if(dir_ instanceof String || typeof dir_ === 'string' || dir_ instanceof Gio.File){
                [ok, result] = splitFile(dir_);
                if(!ok){
                    log_message('notes', `GzzHeader::constructor: splitFile error: ${result}: `, new Error());
                    this.#_array = this.#_current_array = this.#_home;
                }else{
                    this.#_array = this.#_current_array = result;
                }
            }else{
                this.#_array = this.#_current_array = this.#_home;
                log_message('notes', `GzzHeader::constructor: error passed none path value as dir == ${dir_}: `, new Error());
            }
        }else{
            this.#_array = this.#_current_array = this.#_home;
            log_message('notes', 'GzzHeader::constructor_error: dir must be supplied home assumed: ', new Error());
        }

    } // constructor(params) //

    get_owner() {
        return this.#_owner;
    }

    set_owner(owner_) {
        if(!owner_){
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzHeader::set_owner_error', "owner cannot be null");
            }else{
                const dlg = new GzzMessageDialog('GzzHeader::set_owner_error', "owner cannot be null", 'dialog-error');
                dlg.open();
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this.#_owner = owner_;
        }else{
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzHeader::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
            }else{
                throw new Error('GzzHeader::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(owner_) //

    get owner(){
        return this.get_owner();
    }

    set owner(owner_){
        this.set_owner(owner_);
    }

    get_list_file_section() {
        return this.#_list_file_section;
    }

    set_list_file_section(list_file_section_) {
        if(!list_file_section_){
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzHeader::set_list_file_section_error', "list_file_section cannot be null");
            }else{
                const dlg = new GzzMessageDialog('GzzHeader::set_list_file_section_error', "list_file_section cannot be null", 'dialog-error');
                dlg.open();
            }
        }else if(list_file_section_ instanceof AbstractListFileSection){
            this.#_list_file_section = list_file_section_;
        }else{
            if(this.#_owner){
                this.#_owner.apply_error_handler(
                    this, 'GzzHeader::set_list_file_section_error', "list_file_section must be a AbstractListFileSection", new Error()
                );
            }else{
                throw new Error('GzzHeader::set_list_file_section_error: list_file_section must be a AbstractListFileSection');
            }
        }
    } // set list_file_section(list_file_section_) //

    get list_file_section(){
        return this.get_list_file_section();
    }

    set list_file_section(list_file_section_){
        this.set_list_file_section(list_file_section_);
    }

    get_show_root(){
        return this.#_show_root;
    }

    set_show_root(showroot){
        log_message('notes', `GzzHeader::set_show_root: showroot == ${showroot}`, new Error());
        if(this.#_show_root != !!showroot){
            this.#_show_root = !!showroot;
            if(this.#_array && this.#_array.length > 0){
                log_message('notes', `GzzHeader::set_show_root: this.#_array == ${JSON.stringify(this.#_array)}`, new Error());
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

    display_dir(caller, dirname_){
        if(!(caller instanceof AbstractListFileSection) && !(caller instanceof GzzListFileSection)){
            this.#_owner.apply_error_handler(
                this, 
                'GzzHeader::display_dir', 
                `can only be called by an instance of AbstractListFileSection or GzzListFileSection but you called from ${caller}`, 
                new Error()
            );
            return false;
        }
        const [ok, array] = splitFile(dirname_);
        if(!ok){
            log_message('notes', `GzzHeader::display_dir: ok == ${ok}`, new Error());
            log_message('notes', `GzzHeader::display_dir: array == ${array}`, new Error());
            this.#_owner.apply_error_handler(this, 'GzzHeader::display_dir_error', `splitFile Error: ${array}`, new Error());
            return null;
        }
        log_message('notes', `GzzHeader::display_dir: array == ${JSON.stringify(array)}`, new Error());
        if(!this.#_array || this.#_array.length == 0){
            log_message('notes', `GzzHeader::display_dir: replacing value of this.#_array == ${JSON.stringify(this.#_array)}`, new Error());
            this.#_array = array;
            log_message('notes', `GzzHeader::display_dir: replacing value of this.#_array == ${JSON.stringify(this.#_array)}`, new Error());
        }
        const length = Math.min(array.length, this.#_array.length);
        log_message('notes', `GzzHeader::display_dir: array.length == ${array.length}`, new Error());
        log_message('notes', `GzzHeader::display_dir: this.#_array.length == ${this.#_array.length}`, new Error());
        log_message('notes', `GzzHeader::display_dir: length == ${length}`, new Error());
        this.#_current_array = array;
        if(subpathof(array, this.#_array)){
            log_message('notes', `GzzHeader::display_dir: refreshing button states length == ${length}`, new Error());
            this.refresh_button_states();
            return true;
        }
        this.#_array = array;
        log_message('notes', `GzzHeader::display_dir: rebuilding all buutons this.#_array == ${JSON.stringify(this.#_array)}`, new Error());
        this.destroy_all_children();
        this.add_buttons()
        return true;
    } // display_dir(caller, dirname_) //

    add_buttons(){
        log_message('notes', `GzzHeader::add_buttons: this.#_array.length == ${this.#_array.length}`, new Error());
        let start = 1;
        if(this.#_show_root){
            start = 1;
        }else if(subpathof(this.#_home, this.#_array)){
            start = this.#_home.length;
        }
        this.#_current_array = this.#_array;
        for(let i = start; i <= this.#_array.length; i++){
            this.add_button(this.#_array.slice(0, i));
        }
    }

    add_button(array){
        log_message('notes', `GzzHeader::add_button: array == ${JSON.stringify(array)}`, new Error());
        log_message('notes', `GzzHeader::add_button: this.#_show_root == ${this.#_show_root}`, new Error());
        const button_path = Gio.File.new_for_path(GLib.build_filenamev(array));
        const current = array_equal(array, this.#_current_array);
        this.add_child(new GzzHeaderItem({
            owner:               this.#_owner, 
            label_orientation:   Button.Label_orientation.RIGHT, 
            style_class:         'gzzdialog-header-item', 
            array, 
            x_align:             Clutter.ActorAlign.FILL,
            toggle_mode:         true, 
            checked:             current, 
            icon_size:           this.#_owner.get_icon_size(), 
            action:              () => {
                if(!array_equal(array, this.#_current_array)){
                    this.#_current_array = array;
                    this.#_owner.set_dir(array2file(this.#_current_array));
                    this.#_list_file_section.list_destroy_all_children(this);
                    this.#_owner.display_dir(this, button_path);
                }
                this.refresh_button_states(); 
            }, 

        }));
    } // add_button(array) //

    refresh_button_states(){
        const children = this.get_children();
        for(const child of children){
            if(child instanceof GzzHeaderItem){
                if(array_equal(child.get_array(), this.#_current_array)){
                    child.checked = true;
                }else{
                    child.checked = false;
                }
            }
        }
    }

    get_dir_path(){
        return Gio.File.new_for_path(GLib.build_filenamev(this.#_array));
    }

    set_dir_path(file){
        log_message('notes', `GzzHeader::set_dir_path: file == ${file}`, new Error());
        if(file){
            const [ok, array] = splitFile(file);
            if(!ok){
                log_message('notes', `GzzHeader::set_dir_path: array == ${array}`, new Error());
                this.#_owner.apply_error_handler(this, 'GzzHeader::add_button_error', `splitFile Error: ${array}`, new Error());
                return;
            }
            this.#_current_array = array;
            log_message('notes', `GzzHeader::set_show_root: this.#_current_array == ${JSON.stringify(this.#_current_array)}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: array == ${JSON.stringify(array)}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: this.#_array == ${JSON.stringify(this.#_array)}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: array.length == ${array.length}`, new Error());
            log_message('notes', `GzzHeader::set_dir_path: this.#_array.length == ${this.#_array.length}`, new Error());
            if(subpathof(array, this.#_array)){
                this.refresh_button_states();
                this.#_list_file_section.list_destroy_all_children(this);
                this.#_owner.display_dir(this, file);
            }else{
                this.destroy_all_children();
                this.#_array = this.#_current_array = array;
                this.add_buttons();
                this.#_list_file_section.list_destroy_all_children(this);
                this.#_owner.display_dir(this, file);
            }
        }else{
            log_message('notes', 'GzzHeader::set_dir_path file error: file must have a value:', new Error());
            this.#_owner.apply_error_handler(
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

} // export class GzzHeader extends AbstractHeader //

export class GzzColumnNames extends St.BoxLayout {
    static {
        GObject.registerClass({
            GTypeName: 'GzzColumnNames',
        }, this);
    }
    
    #_owner                  = null;
    #_list_file_section      = null;
    #_icon                   = null;
    #_display_inode          = null;
    #_inode                  = null;
    #_mode_box               = null;
    #_display_mode           = false;
    #_nlink_box              = null;
    #_display_number_links   = false;
    #_file_name              = null;
    #_display_times          = GzzColumnNames.None;
    #_create                 = null;
    #_modification           = null;
    #_access                 = null;
    #_display_user_group     = GzzColumnNames.No_User_Group;
    #_user                   = null;
    #_group                  = null;
    #_display_size           = false;
    #_file_size_box          = null;
    #connectID_file_name     = null;
    #connectID_inode         = null;
    #connectID_mode          = null;
    #connectID_nlink         = null;
    #connectID_create        = null;
    #connectID__modification = null;
    #connectID_access        = null;
    #connectID_user          = null;
    #connectID_group         = null;
    #connectID_file_size     = null;

    constructor(params) {
        super({
            style_class: 'gzzdialog-column-names',
            vertical: false,
            x_expand: true,
            y_expand: false,
            x_align:  Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.START,
        });

        if('owner' in params){
            const owner_ = params.owner;
            if(!owner_){
                throw new Error('GzzColumnNames::owner_error: owner cannot be null');
            }else if(owner_ instanceof GzzFileDialogBase){
                this.#_owner = owner_;
            }else{
                throw new Error('GzzColumnNames::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzColumnNames::owner_error: owner must be supplied and must be a GzzFileDialogBase');
        }

        if('list_file_section' in params){
            const list_file_section_ = params.list_file_section;
            if(!list_file_section_){
                throw new Error('GzzColumnNames::constructor list_file_section error: list_file_section cannot be null');
           }else if(list_file_section_ instanceof AbstractListFileSection){
                this.#_list_file_section = list_file_section_;
            }else{
                throw new Error('GzzColumnNames::constructor list_file_section error: list_file_section must be an AbstractListFileSection');
            }
        }else{
            throw new Error('GzzColumnNames::constructor constructor error: list_file_section must be supplied');
        }

        let icon_size_ = 16;
        if('icon_size' in params && Number.isInteger(params.icon_size) && 16 <= Number(params.icon_size) && Number(params.icon_size) <= 256){
            icon_size_ = Number(params.icon_size);
        }
        
        this.#_icon = new Button({
            style_class: 'dialog-item-column-name',
            icon_name:   'notes-app', 
            icon_size:   icon_size_, 
            x_align:     Clutter.ActorAlign.CENTER, 
            width:       icon_size_ + 10, 
        });

        if("display_inode" in params){
            this.#_display_inode = !!params.display_inode;
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_display_inode == ${this.#_display_inode}`, new Error());

        if(this.#_display_inode){
            this.#_inode = new Button({
                text:        _('Inode Number'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       200, 
            });
        }

        if('display_mode' in params){
            this.#_display_mode = !!params.display_mode;
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_display_mode == ${this.#_display_mode}`, new Error());

        if(this.#_display_mode){
            this.#_mode_box = new Button({
                text:        _('Permisions'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       176, 
            });
        }

        if('display_number_links' in params){
            this.#_display_number_links = !!params.display_number_links;
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_display_number_links == ${this.#_display_number_links}`, new Error());

        if(this.#_display_number_links){
            this.#_nlink_box = new Button({
                text:        _('#Link'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       40, 
            });
        }

        this.#_file_name = new Button({
            text:        _('File Name'), 
            style_class: 'dialog-item-column-name',
            x_align:     Clutter.ActorAlign.FILL, 
            width:       300, 
        });

        if('display_times' in params && Number.isInteger(params.display_times)
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 7){
            this.#_display_times = Number(params.display_times);
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_display_times == ${this.#_display_times}`, new Error());

        if(this.#_display_times & GzzColumnNames.Create){
            log_message('notes', `GzzColumnNames::constructor: this.#_display_times == ${this.#_display_times}`, new Error());
            this.#_create = new Button({
                text:        _('Create'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
            });
        }
        
        if(this.#_display_times & GzzColumnNames.Modify){
            log_message('notes', `GzzColumnNames::constructor: this.#_display_times == ${this.#_display_times}`, new Error());
            this.#_modification = new Button({
                text:        _('Modification Time'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
            });
        }
        
        if(this.#_display_times & GzzColumnNames.Access){
            log_message('notes', `GzzColumnNames::constructor: this.#_display_times == ${this.#_display_times}`, new Error());
            this.#_access = new Button({
                text:        _('Access Time'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
            });
        }

        if('display_user_group' in params && Number.isInteger(params.display_user_group)
            && 0 <= Number(params.display_user_group) && Number(params.display_user_group) <= 3){
            this.#_display_user_group = Number(params.display_user_group);
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_display_user_group == ${this.#_display_user_group}`, new Error());
        
        if(this.#_display_user_group & GzzColumnNames.User){
            log_message('notes', `GzzColumnNames::constructor: this.#_display_user_group == ${this.#_display_user_group}`, new Error());
            this.#_user = new Button({
                text:        _('User'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       250, 
            });
        }

        if(this.#_display_user_group & GzzColumnNames.Group){
            log_message('notes', `GzzColumnNames::constructor: this.#_display_user_group == ${this.#_display_user_group}`, new Error());
            this.#_group = new Button({
                text:        _('Group'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       250, 
            });
        }

        if('display_size' in params){
            this.#_display_size = !!params.display_size;
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_display_size == ${this.#_display_size}`, new Error());

        if(this.#_display_size){
            this.#_file_size_box = new Button({
                text:        _('File Size'), 
                style_class: 'dialog-item-column-name',
                x_align:     Clutter.ActorAlign.FILL, 
                width:       160, 
            });
        }
        log_message('notes', `GzzColumnNames::constructor: this.#_file_size_box == ${this.#_file_size_box}`, new Error());

        this.add_child(this.#_icon);
        if(this.#_inode)         this.add_child(this.#_inode);
        if(this.#_mode_box)      this.add_child(this.#_mode_box);
        if(this.#_nlink_box)     this.add_child(this.#_nlink_box);
        if(this.#_create)        this.add_child(this.#_create);
        if(this.#_modification)  this.add_child(this.#_modification);
        if(this.#_access)        this.add_child(this.#_access);
        if(this.#_user)          this.add_child(this.#_user);
        if(this.#_group)         this.add_child(this.#_group);
        if(this.#_file_size_box) this.add_child(this.#_file_size_box);
        this.add_child(this.#_file_name);

        //this.label_actor = this.#_file_name;

        this.#connectID_file_name                             = this.#_file_name.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'file_name');
        });
        if(this.#_inode) this.#connectID_inode                = this.#_inode.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'inode');
        });
        if(this.#_mode_box) this.#connectID_mode              = this.#_mode_box.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'mode');
        });
        if(this.#_nlink_box) this.#connectID_nlink            = this.#_nlink_box.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'nlink');
        });
        if(this.#_create) this.#connectID_create              = this.#_create.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'create');
        });
        if(this.#_modification) this.#connectID__modification = this.#_modification.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'modification');
        });
        if(this.#_access) this.#connectID_access              = this.#_access.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'access');
        });
        if(this.#_user) this.#connectID_user                  = this.#_user.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'user');
        });
        if(this.#_group) this.#connectID_group                = this.#_group.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'group');
        });
        if(this.#_file_size_box) this.#connectID_file_size    = this.#_file_size_box.connect("clicked", (colName, mousebtn, btnstate) => {
            this.#handle_clicked(colName, mousebtn, btnstate, 'file_size');
        });
    } // constructor(params) //

    static None          = 0b00000;
    static Create        = 0b00001;
    static Modify        = 0b00010;
    static Access        = 0b00100;
    static No_User_Group = 0b00000;
    static User          = 0b00001;
    static Group         = 0b00010;

    destroy(){
        this.#_file_name.disconnect(this.#connectID_file_name);
        if(this.#_inode)         this.#_inode.disconnect(this.#connectID_inode);
        if(this.#_mode_box)      this.#_mode_box.disconnect(this.#connectID_mode);
        if(this.#_nlink_box)     this.#_nlink_box.disconnect(this.#connectID_nlink);
        if(this.#_create)        this.#_create.disconnect(this.#connectID_create);
        if(this.#_modification)  this.#_modification.disconnect(this.#connectID__modification);
        if(this.#_access)        this.#_access.disconnect(this.#connectID_access);
        if(this.#_user)          this.#_user.disconnect(this.#connectID_user);
        if(this.#_group)         this.#_group.disconnect(this.#connectID_group);
        if(this.#_file_size_box) this.#_file_size_box.disconnect(this.#connectID_file_size);
        super.destroy();
    } // destroy() //

    #handle_clicked(colName, mousebtn, btnstate, field_name){
        switch(event.get_button()){
            case(mousebtn):
                switch(btnstate){
                    case 0:
                        this.#_list_file_section.sort_by_col(this, field_name);
                        break;
                    default:
                        return Clutter.EVENT_PROPAGATE;
                } // switch(btnstate) //
                return Clutter.EVENT_STOP;
            default:
                return Clutter.EVENT_PROPAGATE;
        } //switch(event.get_button()) //
    } // handle_button_press_event(actor, event) //

    get_owner() {
        return this.#_owner;
    }

    set_owner(owner_) {
        if(owner_ === null){
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzColumnNames::set_owner_error', "owner cannot be null", new Error());
            }else{
                throw new Error('GzzColumnNames::set_owner_error: owner cannot be null');
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this.#_owner = owner_;
        }else{
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzColumnNames::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
            }else{
                throw new Error('GzzColumnNames::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(#_owner) //

    get owner(){
        return this.get_owner();
    }

    set owner(owner_){
        this.set_owner(owner_);
    }

} // export class GzzColumnNames extends St.BoxLayout //

export  class GzzListFileSection extends AbstractListFileSection {
    static {
        GObject.registerClass(this);
    }

    #_icon_size       = 16;
    #_dialog_type     = GzzDialogType.Save;
    #_owner           = null;
    #_listScrollView  = null;
    #list             = null;
    #_edit            = null;
    #file_name_box    = null;
    #_name_label      = null;
    #_header_box      = null;
    #header           = null;
    #show_root_button = null;
    #new_dir_button   = null;
    #_cmp             = this.#file_name_cmp;
    #colNames         = null;

    constructor(params) {
        super({
            style_class: 'gzzdialog-header-box',
        });

        this.#list = new St.BoxLayout({
            style_class: 'gzzdialog-list-box',
            y_expand: true,
            vertical: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
        });

        this.#_listScrollView = new St.ScrollView({
            style_class: 'gzzdialog-list-scrollview',
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
            child: this.#list,
        });

        if('icon_size' in params && Number.isInteger(params.icon_size)){
            this.#_icon_size = Number(params.icon_size);
        }

        this.label_actor = this.#list;

        if('owner' in params){
            const owner_ = params.owner;
            if(!owner_){
                throw new Error('GzzListFileSection::owner_error: owner cannot be null');
            }else if(owner_ instanceof GzzFileDialogBase){
                this.#_owner = owner_;
            }else{
                throw new Error('GzzListFileSection::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzListFileSection::owner_error: owner must be supplied');
        }
        
        if('field_name' in params && params.field_name in GzzListFileSection.KnownFields){
            switch(params.field_name){
                case 'file_name':
                    this.#_cmp = this.#file_name_cmp;
                    break;
                case 'inode':
                    this.#_cmp = this.#inode_cmp;
                    break;
                case 'mode':
                    this.#_cmp = this.#mode_cmp;
                    break;
                case 'nlink':
                    this.#_cmp = this.#nlink_cmp;
                    break;
                case 'create':
                    this.#_cmp = this.#create_cmp;
                    break;
                case 'modification':
                    this.#_cmp = this.#modification_cmp;
                    break;
                case 'access':
                    this.#_cmp = this.#access_cmp;
                    break;
                case 'user':
                    this.#_cmp = this.#user_cmp;
                    break;
                case 'group':
                    this.#_cmp = this.#group_cmp;
                    break;
                case 'file_size':
                    this.#_cmp = this.#file_size_cmp;
                    break;
                default:
                    this.#_cmp = this.#file_name_cmp;
            } // switch(params.field_name) //
        }

        this.#file_name_box = new St.BoxLayout({
            style_class: 'gzzdialog-header-box',
            vertical: false,
        });

        if('dialog_type' in params && params.dialog_type instanceof GzzDialogType 
                    && (params.dialog_type.toString() === GzzDialogType.Open.toString()
                                    || params.dialog_type.toString() === GzzDialogType.Save.toString()
                                                                || params.dialog_type.toString() === GzzDialogType.SelectDir.toString())){
            this.#_dialog_type = params.dialog_type;
        }

        if(this.#_dialog_type.toString() === GzzDialogType.Open.toString()){
            this.#_edit = new St.Label({style_class: 'gzzdialog-list-item-edit'});
        }else if(this.#_dialog_type.toString() === GzzDialogType.Save.toString()){
            this.#_edit = new St.Entry({style_class: 'gzzdialog-list-item-edit'});
        }else if(this.#_dialog_type.toString() === GzzDialogType.SelectDir.toString()){
            this.#_edit = new St.Label({style_class: 'gzzdialog-list-item-edit'});
        }

        this.#_name_label = new St.Label({
            text:     _('Name: '), 
            x_expand: true, 
            x_align:  Clutter.ActorAlign.END, 
            y_align:  Clutter.ActorAlign.CENTER, 
        });

        this.#show_root_button  = new Button({
            style_class:         'gzzdialog-list-item-button', 
            label:               "<", 
            checked:             false, 
            toggle_mode:         true, 
        });

        this.#header = new GzzHeader({
            list_file_section: this, 
            owner:             this.#_owner, 
            style_class:       'gzzdialog-header-box',
            dir:               this.#_owner.get_dir(),
        });

        this.#colNames = new GzzColumnNames({
            list_file_section:    this, 
            owner:                this.#_owner, 
            style_class:          'gzzdialog-column-names',
            icon_size:            this.#_owner.get_icon_size(), 
            display_inode:        this.#_owner.get_display_inode(), 
            display_times:        this.#_owner.get_display_times(), 
            display_user_group:   this.#_owner.get_display_user_group(), 
            display_mode:         this.#_owner.get_display_mode(),
            display_number_links: this.#_owner.get_display_number_links(),
            display_size:         this.#_owner.get_display_size(),
        });

        this.#show_root_button.connect('clicked', () => {
            const showroot = !this.#header.get_show_root();
            log_message('notes', `GzzListFileSection::constructor: this.#show_root_button.connect showroot == ${showroot}`, new Error());
            this.#header.set_show_root(showroot) 
            this.#show_root_button.checked = showroot;
        })

        this.#new_dir_button  = new Button({
            style_class:         'gzzdialog-list-create-dir-button',
            icon_name:           'stock_new-dir', 
            icon_size:           this.#_owner.get_icon_size(), 
        });
        this.#new_dir_button.connectObject('clicked', () => this.#_owner.create_new_dir(this), this.#_owner)

        this.#file_name_box.add_child(this.#_name_label);
        this.#file_name_box.add_child(this.#_edit);

        this.#_header_box = new St.BoxLayout({
            style_class: 'gzzdialog-header-box',
            vertical: false,
            x_expand: true,
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.FILL,
        });

        this.#_header_box.add_child(this.#show_root_button);
        this.#_header_box.add_child(this.#header);
        this.#_header_box.add_child(this.#new_dir_button);

        if(this.#_dialog_type.toString() !== GzzDialogType.SelectDir.toString()){
            this.add_child(this.#file_name_box);
        }
        this.add_child(this.#_header_box);
        this.add_child(this.#colNames);
        this.add_child(this.#_listScrollView);
    } // constructor(params) //
    
    static KnownFields = [
        'file_name', 
        'inode_number', 
        'mode', 
        'nlink', 
        'user_name', 
        'group_name', 
        'create_time', 
        'modification_time', 
        'access_time', 
        'file_size', 
    ];

    sort_by_col(caller, field_name){
        if(!(caller instanceof GzzFileDialogBase) && !(caller instanceof GzzColumnNames)){
            this.#_owner.apply_error_handler(
                this,
                'GzzListFileSection::list_add_child',
                `only an instance of GzzFileDialogBase can call this function you supplied ${caller}`,
                new Error()
            );
            return;
        }
        if(field_name in GzzListFileSection.KnownFields){
            switch(field_name){
                case 'file_name':
                    this.#_cmp = this.#file_name_cmp;
                    break;
                case 'inode':
                    this.#_cmp = this.#inode_cmp;
                    break;
                case 'mode':
                    this.#_cmp = this.#mode_cmp;
                    break;
                case 'nlink':
                    this.#_cmp = this.#nlink_cmp;
                    break;
                case 'create':
                    this.#_cmp = this.#create_cmp;
                    break;
                case 'modification':
                    this.#_cmp = this.#modification_cmp;
                    break;
                case 'access':
                    this.#_cmp = this.#access_cmp;
                    break;
                case 'user':
                    this.#_cmp = this.#user_cmp;
                    break;
                case 'group':
                    this.#_cmp = this.#group_cmp;
                    break;
                case 'file_size':
                    this.#_cmp = this.#file_size_cmp;
                    break;
                default:
                    this.#_cmp = this.#file_name_cmp;
            } // switch(field_name) //
        } // if(field_name in GzzListFileSection.KnownFields) //
        const children = this.#list.get_children();
        this.#list.remove_all_children();
        for(const child of children){
            this.list_add_child(this, child);
        }
    } // sort_by_col(field_name) //
    
    #file_name_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            return row_a.get_title().localeCompare(row_b.get_title());
        }
    } // #file_name_cmp //
    
    #inode_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const inode_a = row_a.get_inode_number();
            const inode_b = row_b.get_inode_number();
            if(inode_a < inode_b){
                return -1;
            }else if(inode_a > inode_b){
                return 1;
            }else if(inode_a === inode_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #inode_cmp //
    
    #mode_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const mode_a = row_a.get_mode();
            const mode_b = row_b.get_mode();
            if(mode_a < mode_b){
                return -1;
            }else if(mode_a > mode_b){
                return 1;
            }else if(mode_a === mode_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #mode_cmp //
    
    #nlink_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const nlink_a = row_a.get_nlink();
            const nlink_b = row_b.get_nlink();
            if(nlink_a < nlink_b){
                return -1;
            }else if(nlink_a > nlink_b){
                return 1;
            }else if(nlink_a === nlink_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #nlink_cmp //
    
    #create_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const create_a = row_a.get_create();
            const create_b = row_b.get_create();
            if(create_a < create_b){
                return -1;
            }else if(create_a > create_b){
                return 1;
            }else if(create_a === create_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #create_cmp //
    
    #modification_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const modification_a = row_a.get_modification();
            const modification_b = row_b.get_modification();
            if(modification_a < modification_b){
                return -1;
            }else if(modification_a > modification_b){
                return 1;
            }else if(modification_a === modification_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #modification_cmp //
    
    #access_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const access_a = row_a.get_access();
            const access_b = row_b.get_access();
            if(access_a < access_b){
                return -1;
            }else if(access_a > access_b){
                return 1;
            }else if(access_a === access_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #access_cmp //
    
    #user_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const user_a = row_a.get_user_name();
            const user_b = row_b.get_user_name();
            const cmp = user_a.localeCompare(user_b);
            if(cmp === 0){
                return row_a.get_title().localeCompare(row_b.get_title());
            }else{
                return cmp;
            }
        }
    } // #user_cmp //
    
    #group_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const group_a = row_a.get_group_name();
            const group_b = row_b.get_group_name();
            const cmp = group_a.localeCompare(group_b);
            if(cmp === 0){
                return row_a.get_title().localeCompare(row_b.get_title());
            }else{
                return cmp;
            }
        }
    } // #group_cmp //
    
    #file_size_cmp(row_a, row_b){
        if(row_a.get_is_dir() && !row_b.get_is_dir()){
            return -1;
        }else if(!row_a.get_is_dir() && row_b.get_is_dir()){
            return 1;
        }else if(row_a.get_is_dir() === row_b.get_is_dir()){
            const file_size_a = row_a.get_file_size();
            const file_size_b = row_b.get_file_size();
            if(file_size_a < file_size_b){
                return -1;
            }else if(file_size_a > file_size_b){
                return 1;
            }else if(file_size_a === file_size_b){
                return row_a.get_title().localeCompare(row_b.get_title());
            }
        }
    } // #file_size_cmp //
    
    list_destroy_all_children(caller){
        if(!(caller instanceof GzzFileDialogBase) && !(caller instanceof AbstractHeader)){
            this.#_owner.apply_error_handler(
                this,
                'GzzListFileSection::list_destroy_all_children',
                `only an instances of GzzFileDialogBase or AbstractHeader can call this function you supplied ${caller}`,
                new Error()
            );
            return;
        }

        this.#list.destroy_all_children();
    } // list_destroy_all_children(caller) //

    list_add_child(caller, row){
        if(!(caller instanceof GzzFileDialogBase) && !(caller instanceof AbstractListFileSection)){
            this.#_owner.apply_error_handler(
                this,
                'GzzListFileSection::list_add_child',
                `only an instance of GzzFileDialogBase can call this function you supplied ${caller}`,
                new Error()
            );
            return;
        }
        const n  = this.#list.get_n_children();
        let i    =  0;
        while(i < n){
            const sibling = this.#list.get_child_at_index(i);
            const cmp = this.#_cmp(row, sibling);
            if(cmp < 0){ // 
                this.#list.insert_child_below(row, sibling);
                return;
            }else if(cmp === 0){
                this.#list.insert_child_below(row, sibling);
                return;
            }/*else if(cmp > 0){
            }*/
            i++;
        }
        this.#list.insert_child_at_index(row, i);
    } // list_add_child(caller, row) //

    header_display_dir(caller, dirname){
        if(!(caller instanceof GzzFileDialogBase)){
            this.#_owner.apply_error_handler(
                this,
                'GzzListFileSection::list_add_child',
                `only an instance of GzzFileDialogBase can call this function you supplied ${caller}`,
                new Error()
            );
            return;
        }
        this.#header.display_dir(this, dirname);
    }

    get_owner() {
        return this.#_owner;
    }

    set_owner(owner_) {
        if(!owner_){
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzListFileSection::set_owner_error', "owner cannot be null", new Error());
            }else{
                const dlg = new GzzMessageDialog('GzzListFileSection::set_owner_error', "owner cannot be null", 'dialog-error');
                dlg.open();
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this.#_owner = owner_;
        }else{
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzListFileSection::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
            }else{
                throw new Error('GzzListFileSection::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(owner_) //

    get owner(){
        return this.get_owner();
    }
    
    set owner(owner_){
        this.set_owner(owner_);
    }

    get_icon_size(){
        return this.#_icon_size;
    }

    set_icon_size(sz){
        if(Number.isInteger(sz)){
            this.#_icon_size = Number(sz);
        }
    } // set_icon_size(sz) //

    get icon_size(){
        return this.get_icon_size();
    }

    set icon_size(sz){
        this.set_icon_size(sz);
    }

    get_file_name(){
        return this.#_edit.get_text();
    }

    set_file_name(filename){
        log_message('notes', `GzzListFileSection::set_file_name: filename == ${filename}`,  new Error());
        if(filename && (filename instanceof String || typeof filename == 'string')){
            this.#_edit.set_text(filename.trim());
        }
    }

    get file_name(){
        return this.get_file_name();
    }

    set file_name(filename){
        this.set_file_name(filename);
    }

    connect2edit(caller, signal_, function_){
        if(caller instanceof GzzFileDialogBase){
            this.#_edit.connect(signal_, function_);
        }
    }

} // export  class GzzListFileSection extends AbstractListFileSection //

export class GzzListFileRow extends St.BoxLayout {
    static {
        GObject.registerClass({
            GTypeName: 'GzzListFileRow',
            Signals: {
                'clicked': {
                    flags: GObject.SignalFlags.RUN_LAST,
                    param_types: [
                        GObject.TYPE_OBJECT,
                        GObject.TYPE_UINT,
                        Clutter.ModifierType.$gtype,
                    ],
                },
                'dblclick': {
                    flags: GObject.SignalFlags.RUN_LAST,
                    param_types: [
                        GObject.TYPE_OBJECT,
                        GObject.TYPE_UINT,
                        Clutter.ModifierType.$gtype,
                    ],
                },
            },
        }, this);
    }
    
    #_double_click_time    = 800;
    #_owner                = null;
    #_is_dir               = false;
    #_is_sym               = false;
    #_icon                 = null;
    #_inode_number         = 0;
    #_display_inode        = null;
    #_inode                = null;
    #_file_type            = Gio.FileType.UNKNOWN;
    #_file                 = GLib.get_home_dir();
    #_mode                 = '.---------';
    #_mode_box             = null;
    #_display_mode         = false;
    #_nlink                = 0;
    #_nlink_box            = null;
    #_display_number_links = false;
    #_title                = null;
    #_create_time          = GLib.DateTime.new_from_unix_local(0);
    #_display_times        = GzzListFileRow.None;
    #_create               = null;
    #_modification_time    = GLib.DateTime.new_from_unix_local(0);
    #_modification         = null;
    #_access_time          = GLib.DateTime.new_from_unix_local(0);
    #_access               = null;
    #_display_user_group   = GzzListFileRow.No_User_Group;
    #_user_name            = '';
    #_user                 = null;
    #_group_name           = '';
    #_base2_file_sizes     = false;
    #_file_size            = 0;
    #_group                = null;
    #_display_size         = false;
    #_file_size_box        = null;
    #connectID_press       = null;
    #connectID_release     = null;
    #connectID_enter       = null;
    #connectID_leave       = null;

    constructor(params) {
        super({
            style_class: 'gzzdialog-file-row',
            vertical: false,
            x_expand: true,
            y_align: Clutter.ActorAlign.FILL,
            reactive:    true, 
        });

        if('owner' in params){
            const owner_ = params.owner;
            if(!owner_){
                throw new Error('GzzListFileRow::owner_error: owner cannot be null');
            }else if(owner_ instanceof GzzFileDialogBase){
                this.#_owner = owner_;
            }else{
                throw new Error('GzzListFileRow::owner_error: owner must be a GzzFileDialogBase');
            }
        }else{
            throw new Error('GzzListFileRow::owner_error: owner must be supplied and must be a GzzFileDialogBase');
        }

        if('is_dir' in params){
            this.#_is_dir = !!params.is_dir;
        }

        if('is_sym' in params){
            this.#_is_sym = !!params.is_sym;
        }

        let icon_size_ = 16;
        if('icon_size' in params && Number.isInteger(params.icon_size) && 16 <= Number(params.icon_size) && Number(params.icon_size) <= 256){
            icon_size_ = Number(params.icon_size);
        }
        
        this.#_icon = new St.Icon({
            style_class: 'dialog-list-item-elt',
            icon_name:   (this.#_is_dir ? 'inode-directory' : 'notes-app'), 
            icon_size:   icon_size_, 
            x_align:     Clutter.ActorAlign.CENTER, 
            width:       icon_size_ + 10, 
        });

        if(!this.#_is_sym){
            if('icon' in params && params.icon){
                this.#_icon.set_gicon(params.icon);
                this.#_icon.icon_size = icon_size_;
            }
        }

        if("display_inode" in params){
            this.#_display_inode = !!params.display_inode;
        }

        if('inode_number' in params && Number.isInteger(params.inode_number)){
            this.#_inode_number = Number(params.inode_number);
        }

        if(this.#_display_inode){
            this.#_inode = new St.Label({
                text:        `${this.#_inode_number}`, 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       200, 
            });
        }

        if('file_type' in params && Number.isInteger(params.file_type)){
            this.#_file_type = params.file_type;
        }
        
        if('file' in params){
            if(params.file instanceof String || typeof params.file === 'string'){
                this.#_file = params.file.toString();
            }else if(params.file instanceof Gio.File){
                this.#_file = params.file.get_path();
            }
        }
        log_message('notes', `GzzListFileRow::constructor: this.#_file == ${this.#_file}`, new Error());

        if('mode' in params && Number.isInteger(params.mode)){
            this.#_mode = unixPermsToStr(this.#_file_type, params.mode, this.#_file);
        }

        if('display_mode' in params){
            this.#_display_mode = !! params.display_mode;
        }

        if(this.#_display_mode){
            this.#_mode_box = new St.Label({
                text:        this.#_mode, 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       176, 
            });
        }

        if('nlink' in params && Number.isInteger(params.nlink)){
            this.#_nlink = Number(params.nlink);
        }

        if('display_number_links' in params){
            this.#_display_number_links = !!params.display_number_links;
        }

        if(this.#_display_number_links){
            this.#_nlink_box = new St.Label({
                text:        `${this.#_nlink}`, 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       40, 
            });
        }

        this.#_title = new St.Label({
            text:        params.title, 
            style_class: 'dialog-list-item-elt',
            x_expand:    true,
            x_align:     Clutter.ActorAlign.FILL, 
            width:       300, 
        });

        if('create_time' in params && params.create_time instanceof GLib.DateTime){
            this.#_create_time = params.create_time;
        }

        if('display_times' in params && Number.isInteger(params.display_times)
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 7){
            this.#_display_times = Number(params.display_times);
        }

        if(this.#_display_times & GzzListFileRow.Create){
            this.#_create = new St.Label({
                text:        this.#_create_time.format_iso8601(), 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
            });
        }

        if('modification_time' in params && params.modification_time instanceof GLib.DateTime){
            this.#_modification_time = params.modification_time;
        }
        
        if(this.#_display_times & GzzListFileRow.Modify){
            this.#_modification = new St.Label({
                text:        this.#_modification_time.format_iso8601(), 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
            });
        }

        if('access_time' in params && params.access_time instanceof GLib.DateTime){
            this.#_access_time = params.access_time;
        }
        
        if(this.#_display_times & GzzListFileRow.Access){
            this.#_access = new St.Label({
                text:        this.#_access_time.format_iso8601(), 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       315, 
            });
        }

        if('display_user_group' in params && Number.isInteger(params.display_user_group)
            && 0 <= Number(params.display_user_group) && Number(params.display_user_group) <= 3){
            this.#_display_user_group = Number(params.display_user_group);
        }
        
        log_message('notes', `GzzFileDialog::constructor: this.#_display_user_group == ${this.#_display_user_group}`, new Error());

        if('user_name' in params){
            if(params.user_name instanceof String || typeof params.user_name === 'string'){
                this.#_user_name = params.user_name.toString();
            }else{
                this.#_user_name = `${params.user_name}`;
            }
        }

        if(this.#_display_user_group & GzzListFileRow.User){
            this.#_user = new St.Label({
                text:        this.#_user_name, 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       250, 
            });
        }

        if('group_name' in params){
            if(params.group_name instanceof String || typeof params.group_name === 'string'){
                this.#_group_name = params.group_name.toString();
            }else{
                this.#_group_name = `${params.group_name}`;
            }
        }

        if('base2_file_sizes' in params){
            this.#_base2_file_sizes = !!params.base2_file_sizes;
        }

        if('file_size' in params && Number.isInteger(params.file_size)){
            this.#_file_size = Number(params.file_size);
        }

        if(this.#_display_user_group & GzzListFileRow.Group){
            this.#_group = new St.Label({
                text:        this.#_group_name, 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       250, 
            });
        }

        if('display_size' in params){
            this.#_display_size = !!params.display_size;
        }
        log_message('notes', `GzzListFileRow::constructor: this.#_display_size == ${this.#_display_size}`, new Error());
        log_message('notes', `GzzListFileRow::constructor: this.#_file_size == ${this.#_file_size}`, new Error());

        if(this.#_display_size){
            this.#_file_size_box = new St.Label({
                text:        format_file_size(this.#_file_size, this.#_base2_file_sizes), 
                style_class: 'dialog-list-item-elt',
                x_expand:    true,
                x_align:     Clutter.ActorAlign.FILL, 
                width:       160, 
            });
        }
        log_message('notes', `GzzListFileRow::constructor: this.#_file_size_box == ${this.#_file_size_box}`, new Error());

        let textLayout = new St.BoxLayout({
            vertical: false,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        textLayout.add_child(this.#_icon);
        if(this.#_inode)         textLayout.add_child(this.#_inode);
        if(this.#_mode_box)      textLayout.add_child(this.#_mode_box);
        if(this.#_nlink_box)     textLayout.add_child(this.#_nlink_box);
        if(this.#_create)        textLayout.add_child(this.#_create);
        if(this.#_modification)  textLayout.add_child(this.#_modification);
        if(this.#_access)        textLayout.add_child(this.#_access);
        if(this.#_user)          textLayout.add_child(this.#_user);
        if(this.#_group)         textLayout.add_child(this.#_group);
        if(this.#_file_size_box) textLayout.add_child(this.#_file_size_box);
        textLayout.add_child(this.#_title);

        this.label_actor = this.#_title;
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
        }
        this.click_count = 0;
        this.#connectID_press   = this.connect("button-press-event", (actor, event) => { this.handle_button_press_event(actor, event); });
        this.#connectID_release = this.connect("button-release-event", (actor, event) => { this.handle_button_release_event(actor, event); });
        this.#connectID_enter   = this.connect('enter-event', () => {
            log_message('notes', 'GzzListFileRow::enter-event:  hovering', new Error());
            this.add_style_pseudo_class('hover');
            return Clutter.EVENT_PROPAGATE;
        });
        this.#connectID_leave   = this.connect('leave-event', () => {
            log_message('notes', 'GzzListFileRow::leave-event:  no longer hovering', new Error());
            this.remove_style_pseudo_class('hover');
            return Clutter.EVENT_PROPAGATE;
        });
    } // constructor(params) //

    static None          = 0b00000;
    static Create        = 0b00001;
    static Modify        = 0b00010;
    static Access        = 0b00100;
    static No_User_Group = 0b00000;
    static User          = 0b00001;
    static Group         = 0b00010;

    destroy(){
        this.disconnect(this.#connectID_press);
        this.disconnect(this.#connectID_release);
        this.disconnect(this.#connectID_enter);
        this.disconnect(this.#connectID_leave);
        super.destroy();
    } // destroy() //

    handle_button_press_event(actor, event){
        switch(event.get_button()){
            case(1):
                this.add_style_pseudo_class('active');
                log_message('notes', `GzzListFileRow::handle_button_press_event: button == ${event.get_button()}`, new Error());
                if(!this.click_event_start){
                    this.click_event_start = new Date().valueOf();
                    if(!this.time_out_id){
                        this.time_out_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.#_double_click_time, () => {
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
                    `GzzListFileRow::handle_button_release_event: this.#_double_click_time == ${this.#_double_click_time}`,
                    new Error()
                );
                log_message(
                    'notes',
                    'GzzListFileRow::handle_button_release_event:' 
                        + ' button_time_ > 0 && button_double_time_ < this.#_double_click_time == ' 
                            + `${button_time_ > 0 && button_double_time_ < this.#_double_click_time}`, 
                    new Error()
                );
                if(button_time_ > 0 && button_double_time_ < this.#_double_click_time){
                    this.click_count++;
                    if(this.click_count >= 2){
                        this.click_event_start = null;
                    }
                    log_message(
                        'notes',
                        `GzzListFileRow::handle_button_release_event: this.click_count == ${this.click_count}`,
                        new Error()
                    );
                    log_message('notes', `GzzListFileRow::handle_button_release_event: this.#_is_dir == ${this.#_is_dir}`, new Error());
                    log_message('notes', `GzzListFileRow::handle_button_release_event: now == ${now}`, new Error());
                    if(this.#_is_dir){
                        if(this.click_count >= 2){
                            this.click_event_start = this.double_click_start = null;
                            this.click_count = 0;
                            //this.#_owner.double_clicked(this, this.#_title.text);
                            this.emit('dblclick', this, event.get_button(), event.get_state());
                            this.remove_style_pseudo_class('active');
                            return Clutter.EVENT_STOP;
                        }else{
                            // dir doesn't do single click //
                            this.remove_style_pseudo_class('active');
                            return Clutter.EVENT_STOP;
                        }
                    }else{ // if(this.#_is_dir) //
                        this.click_count = 0;
                        this.click_event_start = this.double_click_start = null;
                        //this.#_owner.clicked(this, this.#_title.text);
                        this.emit('clicked', this, event.get_button(), event.get_state());
                        this.remove_style_pseudo_class('active');
                        return Clutter.EVENT_STOP;
                    }
                }else{ // if(button_time > 0 && button_double_time < this.#_double_click_time) //
                    // click time out //
                    this.click_event_start = this.double_click_start = null;
                    this.click_count = 0;
                    this.remove_style_pseudo_class('active');
                    return Clutter.EVENT_PROPAGATE;
                }
            default:
                return Clutter.EVENT_PROPAGATE;
        } //switch(event.get_button()) //
    } // handle_button_release_event(actor, event) //

    get_title() {
        return this.#_title.text;
    }

    set_title(title_) {
        this.#_title.text = title_;
    }

    get title(){
        return this.get_title();
    }

    set title(title_){
        this.set_title(title_);
    }

    get_owner() {
        return this.#_owner;
    }

    set_owner(owner_) {
        if(owner_ === null){
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzListFileRow::set_owner_error', "owner cannot be null", new Error());
            }else{
                throw new Error('GzzListFileRow::set_owner_error: owner cannot be null');
            }
        }else if(owner_ instanceof GzzFileDialogBase){
            this.#_owner = owner_;
        }else{
            if(this.#_owner){
                this.#_owner.apply_error_handler(this, 'GzzListFileRow::set_owner_error', "owner must be a GzzFileDialogBase", new Error());
            }else{
                throw new Error('GzzListFileRow::set_owner_error: owner must be a GzzFileDialogBase');
            }
        }
    } // set owner(#_owner) //

    get owner(){
        return this.get_owner();
    }

    set owner(owner_){
        this.set_owner(owner_);
    }

    get_double_click_time(){
        return this.#_double_click_time;
    }

    set_double_click_time(dbl_click_time){
        log_message('notes', `GzzListFileRow::set_double_click_time: dbl_click_time == ${dbl_click_time}`, new Error());
        if(Number.isNaN(dbl_click_time)){
            this.#_owner.apply_error_handler(
                this,
                'GzzListFileRow::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`,
                new Error()
            );
        }else if(dbl_click_time instanceof Date){
            this.#_double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)
            && GzzFileDialogBase.Double_click_time.MIN <= Number(dbl_click_time)
            && Number(dbl_click_time) <= GzzFileDialogBase.Double_click_time.MAX){
            this.#_double_click_time = Number(dbl_click_time);
        }else{
            log_message('notes', `GzzListFileRow::set_double_click_time: dbl_click_time == ${dbl_click_time}`
                + `bad number type expected integer or Date ${dbl_click_time}`, new Error());
            this.#_owner.apply_error_handler(
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
        return this.#_is_dir;
    }

    set_is_dir(isdir){
        this.#_is_dir = !!isdir;
    }

    get is_dir(){
        return this.get_is_dir();
    }

    set is_dir(isdir){
        this.set_is_dir(isdir);
    }

    get_inode_number(){
        return this.#_inode_number;
    }

    get_mode(){
        return this.#_mode;
    }

    get_nlink(){
        return this.#_nlink;
    }

    get_create_time(){
        return this.#_create_time;
    }

    get_create(){
        return this.#_create_time.to_unix_usec();
    }

    get_modification_time(){
        return this.#_modification_time;
    }

    get_modification(){
        return this.#_modification_time.to_unix_usec();
    }

    get_access_time(){
        return this.#_access_time;
    }

    get_access(){
        return this.#_access_time.to_unix_usec();
    }

    get_user_name(){
        return this.#_user_name;
    }

    get_group_name(){
        return this.#_group_name;
    }

    get_file_size(){
        return this.#_file_size;
    }

} // export class GzzListFileRow extends St.BoxLayout //

export class GzzFileDialog extends GzzFileDialogBase {
    static {
        GObject.registerClass(this);
    }

    #_double_click_time    = 800;
    #_list_section         = null;
    #_dir                  = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
    #_file_name            = 'notes.txt';
    #_contents             = null;
    #_filter               = new RegExp('^.*$');
    #_result               = false;
    #_save_done            = null;
    #_base2_file_sizes     = false;
    #_display_times        = 2; // Modify //
    #_display_inode        = false;
    #_display_user_group   = GzzListFileRow.User|GzzListFileRow.Group; // user-group //
    #_display_mode         = false;
    #_display_number_links = false;
    #_display_size         = false;

    constructor(params) {
        super(params);

        this.#_list_section = new GzzListFileSection({
            owner:      this, 
            title:      params.title,
            dialogtype: this.get_dialog_type(), 
            icon_size:  this.get_icon_size(), 
        });

        let show_icon = true;

        if('show_icon' in params){
            show_icon = !!params.show_icons;
        }

        if(show_icon){
            let icon = new St.Icon({
                icon_name: 'inode-directory', 
                icon_size:  this.get_icon_size(), 
            });

            this.contentLayout.add_child(icon);
        } // if(show_icon) //

        this.contentLayout.add_child(this.#_list_section);

        if('dir' in params){
            const dir_ = params.dir;
            log_message('notes', `GzzFileDialog::constructor: dir_ == ${dir_}`, new Error());
            if(!dir_){
                this.#_dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            }else if(dir_ instanceof Gio.File){
                this.#_dir = dir_;
            }else if((dir_ instanceof String || typeof dir_ == 'string') && dir_.trim() != ''){
                this.#_dir = Gio.File.new_for_path(GLib.build_filenamev([dir_.trim()]));
            }else{
                this.#_dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            }
        }

        log_message('notes', `GzzFileDialog::constructor: this.#_dir == ‷${this.#_dir}‴`, new Error());

        if('file_name' in params){
            const file_name_ = params.file_name;
            if(file_name_ instanceof String || typeof file_name_ == 'string'){
                this.#_file_name = file_name_.trim();
                this.#_list_section.set_file_name(this.#_file_name);
            }
        }
         
        if('contents' in params){
            const contents_ = params.contents;
            if(contents_ instanceof GLib.Bytes){
                this.#_contents = contents_;
            }else if(contents_ instanceof String || typeof contents_ == 'string'){
                this.#_contents = new GLib.Bytes(contents_);
            }else if(!contents_){
                this.#_contents = contents_;
            }else{
                this.#_contents = null;
            }
        }

        if('filter' in params){
            const filter_ = params.filter;
            if(!filter_){
                this.#_filter = new RegExp('^.*$');
            }else if(filter_ instanceof RegExp){
                this.#_filter = filter_;
            }else if(filter_ instanceof String || typeof filter_ === 'string'){
                this.#_filter = new RegExp(filter_, "i");
            }else{
                const t = typeof filter_;
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::set_filter_error', 
                    `regex must be of type RegExp or /.../ or String you supplied ${filter_} of type ${t}`, 
                    new Error()
                );
            }
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
                this.#_double_click_time = dbl_click_time.getTime();
            }else if(Number.isInteger(dbl_click_time)){
                this.#_double_click_time = Number(dbl_click_time);
            }else{
                this.apply_error_handler(
                    this, 
                    'GzzFileDialog::set_double_click_time_error',
                    `bad number type expected integer or Date ${dbl_click_time}`, 
                    new Error()
                );
            }
        }

        let label_ = _('Save');
        let icon_name_ = 'stock_save';
        if(this.get_dialog_type().toString() !== GzzDialogType.Save.toString()){
            label_     = _('Open');
            icon_name_ = _('folder-open');
        }

        if('save_done' in params && params.save_done instanceof Function){
            this.#_save_done = params.save_done;
        }

        if('base2_file_sizes' in params){
            this.#_base2_file_sizes = !!params.base2_file_sizes;
        }

        if('display_times' in params && Number.isInteger(params.display_times) 
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 7){
            this.#_display_times = Number(params.display_times);
        }

        if('display_inode' in params){
            this.#_display_inode = !!params.display_inode;
        }

        if('display_user_group' in params && Number.isInteger(params.display_user_group) 
            && 0 <= Number(params.display_times) && Number(params.display_times) <= 3){
            this.#_display_user_group = Number(params.display_user_group);
        }
        log_message('notes', `GzzFileDialog::constructor: this.#_display_user_group == ${this.#_display_user_group}`, new Error());

        if('display_mode' in params){
            this.#_display_mode = !!params.display_mode;
        }

        if('display_number_links' in params){
            this.#_display_number_links = !!params.display_number_links;
        }

        if('display_size' in params){
            this.#_display_size = !!params.display_size;
        }
                
        this.setButtons([{
                label: _('Cancel'),
                icon_name: 'stock_calc-cancel', 
                action: () => {
                    this.#_result = false;
                    this.destroy();
                },
            },
            {
                label: label_,
                icon_name: icon_name_, 
                isDefault: true,
                action: () => {
                    this.do_open_save();
                    this.destroy();
                },
            }
        ]);

        this.display_dir(this, this.#_dir);
        this.#fixup_header(this.#_dir);

        this.#_list_section.connect2edit(this, 'key-release-event', (_actor, _event) => {
            log_message('notes', `GzzFileDialog::constructor: this.#_file_name == ${this.#_file_name}`, new Error());
            this.#_file_name = this.#_list_section.get_file_name();
            log_message('notes', `GzzFileDialog::constructor: this.#_file_name == ${this.#_file_name}`, new Error());
        });

    } // constructor(_title, _text) //

    list_destroy_all_children(caller){
        if(!(caller instanceof AbstractHeader)){
            this.apply_error_handler(
                this, 
                'GzzFileDialog::list_destroy_all_children', 
                `Only an instance of AbstractHeader can call this you are a ${caller}`, 
                new Error()
            );
            return;
        }
        this.#_list_section.list_destroy_all_children(this);
    } // list_destroy_all_children(caller) //

    get_className(){
        return 'GzzFileDialog';
    }

    get className(){
        return this.get_className();
    }

    get_result(){
        return this.#_result;
    }

    set_result(res){
        this.#_result  = !!res;
    }

    get result(){
        return this.get_result();
    }

    set result(res){
        this.set_result(res);
    }

    get_dir(){
        return this.#_dir;
    }

    set_dir(dir_){
        log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_}`, new Error());
        if(!dir_){
            this.#_dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }else if(dir_ instanceof Gio.File){
            log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_.get_path()}`, new Error());
            this.#_dir = dir_;
        }else if((dir_ instanceof String || typeof dir_ == 'string') && dir_.trim() != ''){
            log_message('notes', `GzzFileDialog::set_dir: dir_ == ${dir_}`, new Error());
            this.#_dir = Gio.File.new_for_path(GLib.build_filenamev([dir_.trim()]));
        }else{
            this.#_dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }
        log_message('notes', `GzzFileDialog::set_dir: this.#_dir.get_path() == ${this.#_dir.get_path()}`, new Error());
    } // set_dir(dir_) //

    get dir(){
        return this.get_dir();
    }

    set dir(dir_){
        this.set_dir(dir_);
    }

    get_file_name(){
        return this.#_file_name;
    }

    set_file_name(file_name_){
        if(file_name_ instanceof String || typeof file_name_ == 'string'){
            this.#_file_name = file_name_.trim();
            this.#_list_section.set_file_name(this.#_file_name);
        }else{
            this.#_file_name = 'notes.txt';
            this.#_list_section.set_file_name(this.#_file_name);
        }
    } // set file_name(#_file_name) //

    get file_name(){
        return this.get_file_name();
    }

    set file_name(file_name_){
        this.set_file_name(file_name_);
    }

    get_full_path(){
        if(this.#_file_name.trim() === ''){
            return this.#_dir;
        }else{
            return Gio.File.new_for_path(GLib.build_filenamev([this.#_dir.get_path(), this.#_file_name]));
        }
    }

    get full_path(){
        return this.get_full_path();
    }

    get_contents(){
        return this.#_contents;
    }

    set_contents(contents_){
        if(contents_ instanceof GLib.Bytes){
            this.#_contents = contents_;
        }else if(contents_ instanceof String || typeof contents_ == 'string'){
            this.#_contents = new GLib.Bytes(contents_);
        }else{
            this.#_contents = null;
        }
    } // set contents(#_contents) //

    get_filter(){
        return this.#_filter.toString;
    }

    set_filter(regex){
        if(!regex){
            this.#_filter = new RegExp('^.*$');
        }else if(regex instanceof RegExp){
            this.#_filter = regex;
        }else if(regex instanceof String || typeof regex === 'string'){
            this.#_filter = new RegExp(regex);
        }else{
            const t = typeof regex;
            this.apply_error_handler(this,
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
        return RegExp2glob(this.#_filter);
    }

    set_glob(glob_){
        const regex = glob2RegExp(glob_);
        if(regex) this.#_filter = regex;
    }

    get glob(){
        return this.get_glob();
    }

    set glob(glob_){
        this.set_glob(glob_);
    }

    add_row(row){
        this.#_list_section.list_add_child(this, row);
    }

    get_double_click_time(){
        return this.#_double_click_time;
    }

    set_double_click_time(dbl_click_time){
        if(Number.isNaN(dbl_click_time)){
            this.apply_error_handler(this,
                'GzzFileDialog::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`);
        }else if(dbl_click_time instanceof Date){
            this.#_double_click_time = dbl_click_time.getTime();
        }else if(Number.isInteger(dbl_click_time)){
            this.#_double_click_time = Number(dbl_click_time);
        }else{
            this.apply_error_handler(this,
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
        return this.#_save_done;
    }

    set_save_done(sd){
        if(sd instanceof Function){
            this.#_save_done = sd;
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
        return this.#_base2_file_sizes;
    }

    set_base2_file_sizes(base2){
        this.#_base2_file_sizes = !!base2;
    }

    get base2_file_sizes(){
        return this.get_base2_file_sizes();
    }

    set base2_file_sizes(base2){
        this.set_base2_file_sizes(base2);
    }

    get_display_times(){
        return this.#_display_times;
    }

    set_display_times(times){
        if(Number.isInteger(times) && 0 <= Number(times) && Number(times) <= 7){
            this.#_display_times = Number(times);
        }
    } // set_display_times(times) //

    get display_times(){
        return this.get_display_times();
    }

    set display_times(times){
        this.set_display_times(times);
    }

    get_display_inode(){
        return this.#_display_inode;
    }

    set_display_inode(di){
        this.#_display_inode = !!di;
    } // set_display_inode(sz) //

    get display_inode(){
        return this.get_display_inode();
    }

    set display_inode(di){
        this.set_display_inode(di);
    }

    get_display_user_group(){
        return this.#_display_user_group;
    }

    set_display_user_group(ug){
        if(Number.isInteger(ug) && 0 <= Number(ug) && Number(ug) <= 3){
            this.#_display_user_group = Number(ug);
        }
    } // set_display_user_group(ug) //

    get display_user_group(){
        return this.get_display_user_group();
    }

    set display_user_group(ug){
        this.set_display_user_group(ug);
    }

    get_display_mode(){
        return this.#_display_mode;
    }

    set_display_mode(dm){
        this.#_display_mode = !!dm;
    } // set_display_mode(dm) //

    get display_mode(){
        return this.get_display_mode();
    }

    set display_mode(dm){
        this.set_display_mode(dm);
    }

    get_display_number_links(){
        return this.#_display_number_links;
    }

    set_display_number_links(dnumber){
        this.#_display_number_links = !!dnumber;
    } // set_display_number_links(dnumber) //

    get display_number_links(){
        return this.get_display_number_links();
    }

    set display_number_links(dnumber){
        this.set_display_number_links(dnumber);
    }

    get_display_size(){
        return this.#_display_size;
    }

    set_display_size(dsz){
        this.#_display_size = !!dsz;
    } // set_display_size(dsz) //

    get display_size(){
        return this.get_display_size();
    }

    set display_size(dsz){
        this.set_display_size(dsz);
    }

    #clicked(row, _mousebtn, _state){
        if(!(row instanceof GzzListFileRow)){
            log_message(
                'notes',
                `GzzFileDialog::clicked: this should only be called by GzzListFileRow, but you called it by ${row}`,
                new Error()
            );
            return;
        } // if(!(row instanceof GzzListFileRow)) //
        const filename = row.get_title();
        log_message('notes', `GzzFileDialog::clicked: filename == ${filename}`, new Error());
        this.set_file_name(filename);
    }

    #double_clicked(row, _mousebtn, _state){
        if(!(row instanceof GzzListFileRow)){
            log_message(
                'notes',
                `GzzFileDialog::double_clicked: this should only be called by GzzListFileRow, but you called it by ${row}`,
                new Error()
            );
            return;
        } // if(!(row instanceof GzzListFileRow)) //
        const directory = row.get_title();
        log_message('notes', `GzzFileDialog::double_clicked: directory == ${directory}`, new Error());
        if(directory === '.'){
            return; // nothing to do //
        }else if(directory === '..'){ // go up one dir //
            const current_dir = this.#_dir.get_parent();
            log_message('notes', `GzzFileDialog::double_clicked: current_dir == ${current_dir.get_path()}`, new Error());
            if(current_dir){
                this.#_list_section.list_destroy_all_children(this);
                this.set_dir(current_dir);
                this.display_dir(this, current_dir);
                this.#fixup_header(current_dir);
            }
        }else if(directory){
            this.#_list_section.list_destroy_all_children(this);
            const current_dir = Gio.File.new_for_path(GLib.build_filenamev([this.#_dir.get_path(), directory]));
            log_message('notes', `GzzFileDialog::double_clicked: current_dir == ${current_dir.get_path()}`, new Error());
            this.set_dir(current_dir);
            this.display_dir(this, current_dir);
            this.#fixup_header(current_dir);
        }
    }
    
    #fixup_header(dirname){
        this.#_list_section.header_display_dir(this, dirname);
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

    display_dir(caller, filename){
        if(!(caller instanceof GzzFileDialogBase)
            && !(caller instanceof AbstractListFileSection)
            && !(caller instanceof AbstractHeader)
            && !(caller instanceof GzzListFileSection)){
            this.apply_error_handler(
                this, 
                'GzzFileDialog::display_dir', 
                'can only be called by instance of GzzFileDialogBase, AbstractListFileSection,'
                + ` AbstractHeader or GzzListFileSection but you called from ${caller}`, 
                new Error()
            );
            return;
        }
        let enumerator = null;
        let is_dir_    = null;
        let is_sym_    = null;
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
            enumerator = filename.enumerate_children(attributes, Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            log_message('notes', `GzzFileDialog::display_dir: enumerator == ‷${enumerator}‴`, new Error());
            let info;
            {
                info          = filename.query_info(attributes, Gio.FileQueryInfoFlags.NONE, null);
                let filetype  = filename.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
                let file_type = info.get_file_type();
                const self_ = new GzzListFileRow({
                    owner:                this, 
                    title:                '.',
                    is_dir:               true, 
                    inode_number:         info.get_attribute_uint64('unix::inode'), 
                    mode:                 info.get_attribute_uint32('unix::mode'), 
                    file_type:            (filetype ? filetype : file_type), 
                    file:                 filename, 
                    icon:                 info.get_icon(), 
                    icon_size:            this.get_icon_size(), 
                    create_time:          info.get_creation_date_time(),
                    modification_time:    info.get_modification_date_time(),
                    access_time:          info.get_access_date_time(),
                    user_name:            info.get_attribute_string('owner::user'),
                    group_name:           info.get_attribute_string('owner::group'),
                    file_size:            info.get_size(), 
                    nlink:                info.get_attribute_uint32('unix::nlink'), 
                    double_click_time:    this.#_double_click_time, 
                    display_times:        this.#_display_times, 
                    display_inode:        this.#_display_inode, 
                    display_user_group:   this.#_display_user_group, 
                    display_mode:         this.#_display_mode,
                    display_number_links: this.#_display_number_links,
                    display_size:         this.#_display_size,
                    base2_file_sizes:     this.#_base2_file_sizes, 
                });
                self_.connect('clicked', (thisrow, mousebtn, state) => {
                    this.#clicked(thisrow, mousebtn, state);
                });
                self_.connect('dblclick', (thisrow, mousebtn, state) => {
                    this.#double_clicked(thisrow, mousebtn, state);
                });
                this.add_row(self_);
                const parent_dir = filename.get_parent();
                if(parent_dir){
                    info      = parent_dir.query_info(attributes, Gio.FileQueryInfoFlags.NONE, null);
                    filetype  = parent_dir.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
                    file_type = info.get_file_type();
                }
                const parent_ = new GzzListFileRow({
                    owner:                this, 
                    title:                '..',
                    is_dir:               true, 
                    inode_number:         info.get_attribute_uint64('unix::inode'), 
                    mode:                 info.get_attribute_uint32('unix::mode'), 
                    file_type:            (filetype ? filetype : file_type), 
                    file:                 (parent_dir ? parent_dir : filename), 
                    icon:                 info.get_icon(), 
                    icon_size:            this.get_icon_size(), 
                    create_time:          info.get_creation_date_time(),
                    modification_time:    info.get_modification_date_time(),
                    access_time:          info.get_access_date_time(),
                    user_name:            info.get_attribute_string('owner::user'),
                    group_name:           info.get_attribute_string('owner::group'),
                    file_size:            info.get_size(), 
                    nlink:                info.get_attribute_uint32('unix::nlink'), 
                    double_click_time:    this.#_double_click_time, 
                    display_times:        this.#_display_times, 
                    display_inode:        this.#_display_inode, 
                    display_user_group:   this.#_display_user_group, 
                    display_mode:         this.#_display_mode,
                    display_number_links: this.#_display_number_links,
                    display_size:         this.#_display_size,
                    base2_file_sizes:     this.#_base2_file_sizes, 
                });
                parent_.connect('clicked', (thisrow, mousebtn, state) => {
                    this.#clicked(thisrow, mousebtn, state);
                });
                parent_.connect('dblclick', (thisrow, mousebtn, state) => {
                    this.#double_clicked(thisrow, mousebtn, state);
                });
                this.add_row(parent_);
            }
            while ((info = enumerator.next_file(null))) {
                log_message('notes', `GzzFileDialog::display_dir: info == ‷${info}‴`, new Error());
                if (this.get_dialog_type().toString() === GzzDialogType.SelectDir.toString() && info.get_file_type() !== Gio.FileType.DIRETORY) {
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
                    is_sym_ = true;
                    is_dir_ = this.file_is_dir(file); // will identify symlink directories as directory //
                    log_message('notes', `GzzFileDialog::display_dir: is_dir_ == ‷${is_dir_}‴`, new Error());
                }else{
                    is_sym_ = false;
                }
                log_message('notes', `GzzFileDialog::display_dir: this.#_filter == ‷${this.#_filter}‴`, new Error());
                log_message('notes', `GzzFileDialog::display_dir: is_dir_ == ‷${is_dir_}‴`, new Error());
                const matches = info.get_name().match(this.#_filter);
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

                log_message('notes', `GzzFileDialog::display_dir: this.#_double_click_time == ${this.#_double_click_time}`, new Error());
                const row = new GzzListFileRow({
                    owner:                this, 
                    title:                title_,
                    is_dir:               is_dir_, 
                    is_sym:               is_sym_, 
                    inode_number:         info.get_attribute_uint64('unix::inode'), 
                    mode:                 info.get_attribute_uint32('unix::mode'), 
                    file_type:            (filetype ? filetype : file_type), 
                    file:                 Gio.File.new_for_path(GLib.build_filenamev([filename.get_path(), info.get_name()])), 
                    icon:                 info.get_icon(), 
                    icon_size:            this.get_icon_size(), 
                    create_time:          info.get_creation_date_time(),
                    modification_time:    info.get_modification_date_time(),
                    access_time:          info.get_access_date_time(),
                    user_name:            info.get_attribute_string('owner::user'),
                    group_name:           info.get_attribute_string('owner::group'),
                    file_size:            info.get_size(), 
                    nlink:                info.get_attribute_uint32('unix::nlink'), 
                    double_click_time:    this.#_double_click_time, 
                    display_times:        this.#_display_times, 
                    display_inode:        this.#_display_inode, 
                    display_user_group:   this.#_display_user_group, 
                    display_mode:         this.#_display_mode,
                    display_number_links: this.#_display_number_links,
                    display_size:         this.#_display_size,
                    base2_file_sizes:     this.#_base2_file_sizes, 
                });
                row.connect('clicked', (thisrow, mousebtn, state) => {
                    this.#clicked(thisrow, mousebtn, state);
                });
                row.connect('dblclick', (thisrow, mousebtn, state) => {
                    this.#double_clicked(thisrow, mousebtn, state);
                });

                this.add_row(row);
            }
        } catch(e){
            log_message('notes', `GzzFileDialog::display_dir: ‷${e.stack}‴`, e);
            log_message('notes', `GzzFileDialog::display_dir: Exception caught == ‷${e}‴`, e);
            this.apply_error_handler( this, 'GzzFileDialog::display_dir', `Exception caught: ${e}:`, e);
        }
    } // display_dir(caller, filename) //

    do_open_save(){
        if(this.get_dialog_type().toString() === GzzDialogType.Open.toString()){
            const filename = Gio.File.new_for_path(GLib.build_filenamev([this.#_dir.get_path(), this.#_file_name]));
            this.#_result = !!filename;
            if(this.#_save_done){
                this.#_save_done(this, this.#_result, this.#_dir, this.#_file_name);
            }
        }else if(this.get_dialog_type().toString() === GzzDialogType.Save.toString()){
            if(this.save_file()){
                if(this.#_save_done){
                    this.#_save_done(this, this.#_result, this.#_dir, this.#_file_name);
                }
            }
        }else if(this.get_dialog_type().toString() === GzzDialogType.SelectDir.toString()){
            const filename = this.#_dir.get_path().trim();
            this.#_result = !!filename;
            if(this.#_save_done){
                this.#_save_done(this, this.#_result, this.#_dir, '');
            }
        }
    } // do_open_save() //

    save_file(){
        this.#_result = false;
        if(!this.#_dir){
            return this.#_result;
        }
        if(!this.#_contents){
            return this.#_result;
        }
        let ret = null;
        try {
            ret = GLib.mkdir_with_parents(this.#_dir.get_path(), 0o755);
            if(ret == -1){
                log_message(
                    'notes',
                    `GzzFileDialog::save_file: this.#_dir.get_path() == ‷Error Glib.mkdir_with_parents(${this.#_dir.get_path()}, 0o755) failed‴`,
                    new Error()
                );
                this.apply_error_handler(
                    this,
                    'GzzFileDialog::save_file',
                    `Error: GzzFileDialog::save_file: ‷${this.#_dir.get_path()}‴: could not makedir for ` 
                         + `‷${this.#_dir.get_path()}‴`, 
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
            return this.#_result;
        }
        try {
            const file_path = Gio.File.new_for_path(GLib.build_filenamev([this.#_dir.get_path(), this.#_file_name]));
            if(file_path){
                const outputStream = file_path.create(Gio.FileCreateFlags.NONE, null);
                const bytesWritten = outputStream.write_bytes(this.#_contents, null);
                this.#_result = (bytesWritten == this.#_contents.get_size());
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
            return this.#_result;
        }
        return this.#_result;
    } // save_file() //

    save_to_file(dir_ = null, name = null, contents_ = null){
        if(dir_ instanceof Gio.File || dir_ instanceof String || typeof dir_ == 'string'){
            this.set_dir(dir_);
        }
        if(name instanceof Gio.File || name instanceof String || typeof name == 'string'){
            this.set_name(name);
        }
        if(contents_ instanceof GLib.Bytes || contents_ instanceof String || typeof contents_ == 'string'){
            this.set_contents(contents_);
        }
        this.open();
    } // async save_to_file() //

    create_new_dir(caller){
        if(!(caller instanceof AbstractListFileSection)){
            log_message(
                'notes',
                `GzzFileDialog::create_new_dir: caller should be AbstractListFileSection but you have ${caller}`,
                new Error()
            );
            return;
        }
        const dlg = new GzzPromptDialog({
            title:       _('Make Directory'), 
            description: _('Type a new name for the new directory.'), 
            ok_button:   _('Make Directory'), 
            icon_name:   'folder-new', 
            ok_call_back: () => {
                const new_dir = dlg.get_text().trim();
                if(new_dir !== ''){
                    const dir = Gio.File.new_for_path(GLib.build_filenamev([this.#_dir.get_path(), new_dir]));
                    try {
                        if(dir.make_directory(null)){
                            this.set_dir(dir);
                            this.#_list_section.list_destroy_all_children(this);
                            this.display_dir(this, dir);
                            this.#fixup_header(dir);
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
