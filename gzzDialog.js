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
        if(file instanceof String || typeof file === 'string') file = Gio.File.new_for_path(GLib.build_filenamev([file]));
        const attributes = 'standard::name,standard::type,standard::display_name,standard::icon';
        let info     = file.query_info(attributes, Gio.FileQueryInfoFlags.NONE, null);
        let filename = info.get_display_name();
        result.unshift(filename);
        while((file = file.get_parent())){
            info     = file.query_info(attributes, Gio.FileQueryInfoFlags.NONE, null);
            filename = info.get_display_name();
            result.unshift(filename);
        }
    }catch(e){
        return [null, e];
    }
    return [true, result];
} // export function splitFile(file) //

export class GzzMessageDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(_title, _text, _icon_name = null, buttons = null) {
        super({ styleClass: 'extension-dialog' });

        let icon = new St.Icon({icon_name: (_icon_name ? _icon_name : 'dialog-information')});
        this.contentLayout.add(icon);

        let messageLayout = new Dialog.MessageDialogContent({
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
    } // constructor(_title, _text) //

    get result(){
        return this._result;
    }

    set result(res){
        this._result = !!res;
    }

} // export class GzzMessageDialog extends ModalDialog.ModalDialog //

export class GzzHeader extends St.BoxLayout {
      static {
            GObject.registerClass(this);
        }

    constructor(params) {
        super({
            style_class: 'gzzdialog-list',
            x_expand: true,
            vertical: false,
            ...params,
        });

        if('owner' in params){
            this.set_owner(params.owner);
        }else{
            throw "owner must be supplied";
        }

        let ok = null;
        let result = null;
        if('filename' in params){
            [ok, result] = splitFile(params.filename);
            if(!ok){
                this._error_handler(this, 'GzzHeader::constructor_error', `splitFile error: ${result}`);
            }else{
                this._array = this._current_array = result;
            }
        }else{
            this._owner._error_handler(this, 'GzzHeader::constructor_error', "filename must be supplied");
        }

        this._show_root = false;

        this.add_buttons();

    } // constructor(params) //

    get owner() {
        return this._owner;
    }

    set owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner._error_handler(this, 'GzzHeader::set_owner_error', "owner cannot be null");
            }else{
                throw { name: 'GzzHeader::set_owner_error', message: 'owner cannot be null' };
            }
        }else if(_owner instanceof GzzFileDialog){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner._error_handler(this, 'GzzHeader::set_owner_error', "owner must be a GzzFileDialog");
            }else{
                throw { name: 'GzzHeader::set_owner_error', message: 'owner must be a GzzFileDialog' };
            }
        }
    } // set owner(_owner) //

    get show_root(){
        return this._show_root;
    }

    set show_root(showroot){
        if(this._show_root != !!showroot){
            this._show_root = !!showroot;
            this.destroy_all_children();
            this.add_buttons();
        }
    }

    display_dir(dirname){
        const [ok, array] = splitFile(dirname);
        if(!ok){
            this._owner._error_handler(this, 'GzzHeader::display_dir_error', `splitFile Error: ${array}`);
            return null;
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
    } // display_dir(dirname) //

    add_buttons(){
        for(let i = 1; i <= this._array.length; i++){
            this.add_button(this._array.slice(0, i));
        }
    }

    add_button(array){
        const [ok, home]   = splitFile(Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()])));
        if(!ok){
            this._owner._error_handler(this, 'GzzHeader::add_button_error', `splitFile Error: ${home}`);
            return;
        }
        if(!this._show_root && this.part_of_path(array, home)){
            const button_path  = Gio.File.new_for_path(GLib.build_filenamev(array));
            const current_path = Gio.File.new_for_path(GLib.build_filenamev(this._array));
            const current_button = current_path.equal(button_path);
            this.add_child(new GzzHeaderItem({
                owner: this._owner, 
                array, 
                checked: current_button, 
                action: () => { this.set_path(button_path); }, 

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
        if(array.length <= home.get_parent().length){
            const length = Math.min(this._array.length, home.length - 1);
            if(array === home.slice(0, length)){
                return true;
            }
        }
        return false;
    }

    get path(){
        return Gio.File.new_for_path(GLib.build_filenamev(this._array));
    }

    set path(file){
        const [ok, array] = splitFile(file);
        if(!ok){
            this._owner._error_handler(this, 'GzzHeader::add_button_error', `splitFile Error: ${array}`);
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
    }

} // export class GzzHeader extends St.BoxLayout //

export  class GzzListFileSection extends St.BoxLayout {
      static {
            GObject.registerClass(this);
        }

    constructor(params) {
        super({
            style_class: 'gzzdialog-header-box',
            x_expand: true,
            vertical: false,
            ...params,
        });

        if('owner' in params){
            this.set_owner(params.owner);
        }else{
            throw "owner must be supplied";
        }

        this.file_name_box = new St.BoxLayout({
            style_class: 'gzzdialog-header-box',
            vertical: false,
        });

        if('dialog_type' in params){
            this.set_dialog_type(params.dialog_type);
        }else{
            this._dialog_type = GzzDialogType.Save;
        }

        if(this.dialogtype === GzzDialogType.Open){
            this._edit = new St.Label({style_class: 'gzzdialog-list-item-edit'});
        }else if(this.dialogtype === GzzDialogType.Save){
            this._edit = new St.Entry({style_class: 'gzzdialog-list-item-edit'});
        }else if(this.dialogtype === GzzDialogType.SelectDir){
            this._edit = new St.Label({style_class: 'gzzdialog-list-item-edit'});
        }

        this.show_root_button  = new St.Button({
            style_class: 'gzzdialog-list-item-button', 
            label:       "<", 
            checked:     true, 
            action:      () => this.header.set_show_root(), 
        });

        this.new_dir_button  = new St.Button({
            style_class: 'gzzdialog-list-item-button',
            icon_name:   'stock_new-dir', 
            action:      () => this._owner.create_new_dir(), 
        });

        this.file_name_box.add_child(this._edit);

        this._header_box = new St.BoxLayout({
            style_class: 'gzzdialog-header-box',
            vertical: false,
        });

        this.header = new GzzHeader({
            style_class: 'gzzdialog-header-box',
            owner:       this._owner, 
        });

        this._header_box.add_child(this.show_root_button);
        this._header_box.add_child(this.header);
        this._header_box.add_child(this.new_dir_button);

        this.list = new St.BoxLayout({
            style_class: 'gzzdialog-list-box',
            y_expand: true,
            vertical: true,
        });

        this._listScrollView = new St.ScrollView({
            style_class: 'gzzdialog-list-scrollview',
            child: this.list,
        });

        this.label_actor = this.list;
        if(this._dialog_type !== GzzDialogType.SelectDir){
            this.add_child(this.file_name_box);
        }
        this.add_child(this._header_box);
        this.add_child(this._listScrollView);
    } // constructor(params) //

    get owner() {
        return this._owner;
    }

    set owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner._error_handler(this, 'GzzListFileSection::set_owner_error', "owner cannot be null");
            }else{
                throw { name: 'GzzListFileSection::set_owner_error', message: 'owner cannot be null' };
            }
        }else if(_owner instanceof GzzFileDialog){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner._error_handler(this, 'GzzListFileSection::set_owner_error', "owner must be a GzzFileDialog");
            }else{
                throw { name: 'GzzListFileSection::set_owner_error', message: 'owner must be a GzzFileDialog' };
            }
        }
    } // set owner(_owner) //

    get file_name(){
        return this._edit.get_text();
    }

    set file_name(filename){
        if(filename && (filename instanceof String || typeof filename == 'string')){
            this._edit.set_text(filename.trim());
        }
    }

} // export  class GzzListFileSection extends St.BoxLayout //

export class GzzHeaderItem extends St.Button {
    static {
        GObject.registerClass({
                            Properties: {
                                'title': GObject.ParamSpec.string(
                                    'title', null, null,
                                    GObject.ParamFlags.READWRITE |
                                    GObject.ParamFlags.CONSTRUCT,
                                    null),
                            },
                        }, this);
    }

    constructor(params) {
        super({
            style_class: 'gzzdialog-header-item',
            x_expand:    true, 
            toggle_mode: true, 
            ...params,
        });

        if('owner' in params){
            this.set_owner(params.owner);
        }else{
            throw "owner must be supplied";
        }

        if('array' in params){
            this.set_array(params.array);
        }else{
            this._owner._error_handler(this, 'GzzHeaderItem::constructor_error', 'Error: Property array is required.');
        }

    } // constructor(params) //

    get title() {
        return this.label.text;
    }

    set title(title) {
        _setLabel(this.label, title);
        this.notify('title');
    }

    get owner() {
        return this._owner;
    }

    set owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner._error_handler(this, 'GzzHeader::set_owner_error', "owner cannot be null");
            }else{
                throw { name: 'GzzHeader::set_owner_error', message: 'owner cannot be null' };
            }
        }else if(_owner instanceof GzzFileDialog){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner._error_handler(this, 'GzzHeader::set_owner_error', "owner must be a GzzFileDialog");
            }else{
                throw { name: 'GzzHeader::set_owner_error', message: 'owner must be a GzzFileDialog' };
            }
        }
    } // set owner(_owner) //

    get array(){
        return this._array;
    }

    set array(arr){
        if(!arr){
            this._owner._error_handler(this, 'GzzHeaderItem::set_array_error', 'array cannot be empty or null');
        }else{
            this._array = arr;
            const title = this.array.at(-1);
            this.set_title(title);
            const file = Gio.File.new_for_path(GLib.build_filenamev(this._array));
            const home = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            if(file.equal(home)){
                this.set_icon_name('user-home');
            }
        }
    }

} // export class GzzHeaderItem extends St.Button //

export class GzzListFileRow extends St.BoxLayout {
    static {
        GObject.registerClass({
                            Properties: {
                                'title': GObject.ParamSpec.string(
                                    'title', null, null,
                                    GObject.ParamFlags.READWRITE |
                                    GObject.ParamFlags.CONSTRUCT,
                                    null),
                                'owner': GObject.ParamSpec.object(
                                    'owner', 'Owner',
                                    'The GzzFileDialog that owns this',
                                    GObject.ParamFlags.READWRITE |
                                    GObject.ParamFlags.CONSTRUCT,
                                    GzzFileDialog),
                                'is_dir': GObject.ParamSpec.boolean(
                                    'is_dir', 'Is_Dir',
                                    'this represents a directory',
                                    GObject.ParamFlags.READWRITE |
                                    GObject.ParamFlags.CONSTRUCT,
                                    null),
                            },
                        }, this);
    }

    constructor(params) {
        super({
            style_class: 'gzzdialog-label-item',
            ...params,
        });

        let textLayout = new St.BoxLayout({
            vertical: false,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._title = new St.Label({style_class: 'dialog-list-item-title', reactive: true});

        if('owner' in params){
            this.set_owner(params.owner);
        }else{
            throw "owner must be supplied";
        }

        if('is_dir' in params){
            this._is_dir = !!params.is_dir;
        }else{
            this._is_dir = false;
        }

        let icon = new St.Icon({icon_name: (this._is_dir ? 'inode-directory' : 'emblem-dialog-question')});

        if('icon' in params){
            icon.set_gicon(params.icon);
        }

        textLayout.add_child(icon);
        textLayout.add_child(this._title);

        this.label_actor = this._title;
        this.add_child(textLayout);
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
                this.press_event_start = Date().getTime();
                if(this.double_click_start === null){
                    this.double_click_start = this.click_event_start;
                    this.click_count = 0;
                }
                return true;
            default:
                return false;
        } //switch(event.get_button()) //
    } // handle_button_press_event(actor, event) //

    handle_button_release_event(actor, event){
        let button_time = null;
        let button_double_time = null;
        let now = 0
        switch(event.get_button()){
            case(1):
                if(!this.click_event_start)  this._owner(this, 'GzzListFileRow::handle_button_release_event_error', "lost button press event");
                now = Date().getTime();
                button_time = now - this.click_event_start;
                button_double_time = now - this.double_click_start;
                if(button_time > 0 && button_double_time < this._double_click_time){
                    this.click_event_start = null;
                    this.click++;
                    if(this._is_dir){
                        if(this.click_count >= 2){
                            this.double_click_start = null;
                            this.click_count = 0;
                            this._owner.double_clicked(this, this._title.text);
                            return true;
                        }else{
                            // dir doesn't do single click //
                            return true;
                        }
                    }else{ // if(this._is_dir) //
                        this.click_count = 0;
                        this.double_click_start = null;
                        this._owner.clicked(this, this._title.text);
                        return true;
                    }
                }else{ // if(button_time > 0 && button_double_time < this._double_click_time) //
                    // click time out //
                    this.click_event_start = this.double_click_start = null;
                    this.click_count = 0;
                    return false;
                }
            default:
                return false;
        } //switch(event.get_button()) //
    } // handle_button_release_event(actor, event) //

    get title() {
        return this._title.text;
    }

    set title(title) {
        _setLabel(this._title, title);
        this.notify('title');
    }

    get owner() {
        return this._owner;
    }

    set owner(_owner) {
        if(_owner === null){
            if(this._owner){
                this._owner._error_handler(this, 'GzzListFileRow::set_owner_error', "owner cannot be null");
            }else{
                throw { name: 'GzzListFileRow::set_owner_error', message: 'owner cannot be null' };
            }
        }else if(_owner instanceof GzzFileDialog){
            this._owner = _owner;
            this.notify('owner');
        }else{
            if(this._owner){
                this._owner._error_handler(this, 'GzzListFileRow::set_owner_error', "owner must be a GzzFileDialog");
            }else{
                throw { name: 'GzzListFileRow::set_owner_error', message: 'owner must be a GzzFileDialog' };
            }
        }
    } // set owner(_owner) //

    get double_click_time(){
        return this._double_click_time;
    }

    set double_click_time(dbl_click_time){
        if(isNaN(Number(dbl_click_time))){
            this._owner._error_handler(this, 'GzzListFileRow::set_double_click_time_error', `bad value expected integer or date got ${dbl_click_time}`);
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number(dbl_click_time).isInteger){
            this._double_click_time = Number(dbl_click_time);
        }else{
            this._owner._error_handler(this, 'GzzListFileRow::set_double_click_time_error', `bad number type expected integer or Date ${dbl_click_time}`);
        }
    } // set double_click_time(dbl_click_time) //

    get is_dir(){
        return this._is_dir;
    }

    set is_dir(isdir){
        this._is_dir = !!isdir;
    }

} // export class GzzListFileRow extends St.BoxLayout //

export class GzzPromptDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({ styleClass: 'gzzextension-dialog' }, 
            ...params, 
        );

        let _icon_name = null;

        if('icon_name' in params){
            _icon_name = params.icon_name;
        }

        let icon = new St.Icon({icon_name: (_icon_name ? _icon_name : 'notes-app')});
        this.contentLayout.add(icon);

        let messageLayout = new Dialog.MessageDialogContent({
            title: params.title,
            description: params.description,
        });
        this._edit = new St.Entry({style_class: 'gzzpromptdialog-edit'});

        if('text' in params){
            this.set_text(params.text);
        }

        this.contentLayout.add_child(messageLayout);

        this._result = false;

        let ok_button = _('OK');

        if('ok_button' in params){
            ok_button = params.ok_button;
        }

        let ok_icon_name ='dialog-ok';

        if('ok_icon_name' in params){
            ok_icon_name = params.ok_icon_name;
        }

        if('text' in params){
            this.set_text(params.text);
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
                        this.destroy();
                    },
                }
            ]);
        }

    } // constructor(params) //

    get result(){
        return this._result;
    }

    set result(res){
        this._result = res;
    }

    get text(){
        return this._edit.get_text();
    }

    set text(_text){
        if(_text instanceof String || typeof _text === 'string'){
            this._edit.set_text(_text);
        }
    }

} // export class GzzPromptDialog extends ModalDialog.ModalDialog //

export class GzzDialogType {
  static Open = new GzzDialogType('Open');
  static Save = new GzzDialogType('Save');
  static SelectDir = new GzzDialogType('SelectDir');

  constructor(name) {
    this.name = name;
  }
  toString() {
    return `GzzDialogType.${this.name}`;
  }
}

export class GzzFileDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(params) {
        super({ styleClass: 'gzzextension-dialog' }, 
        ...params,
        );

        if('errorhandler' in params){
            this.set_error_handler(params.errorhandler);
        }else{
            this.set_error_handler(null);
        }

        if('dir' in params){
            this.set_dir(params.dir);
        }else{
            this.set_dir(Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()])));
        }

        if('file_name' in params){
            this.set_file_name(params.file_name);
        }else{
            this.set_file_name('notes.txt');
        }

        if('dialogtype' in params){
            this.set_dialog_type(params.dialogtype);
        }else{
            this.set_dialog_type(GzzDialogType.Save);
        }
         
        if('contents' in params){
            this.set_contents(params.contents);
        }else{
            this.set_contents(null);
        }

        if('filter' in params){
            this.set_filter(params.filter);
        }else{
            this.set_filter(new RegExp('^.*$'));
        }

        if('double_click_time' in params){
            this.set_double_click_time(params.double_click_time);
        }else{
            this._double_click_time = 400;
        }

        let icon = new St.Icon({icon_name: 'dialog-information'});

        this.contentLayout.add(icon);

        this._list_section = new GzzListFileSection({
            owner:      this, 
            title:      params.title,
            dialogtype: this._dialogtype, 
        });
        this.contentLayout.add_child(this._list_section);

        let _label = _('Save');
        let _icon_name = 'stock_save';
        if(this._dialog_type !== GzzDialogType.Save){
            _label     = _('Open');
            _icon_name = _('folder-open');
        }

        this._result = false;
                
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
                },
            }
        ]);

        this._list_section._edit.connect('key-release-event', (_actor, _event) => {
            this._file_name = this._list_section._edit.get_text();
        });
    } // constructor(_title, _text) //

    get result(){
        return this._result;
    }

    get error_handler(){
        return this._error_handler;
    }

    set error_handler(handler){
        if(handler == null || typeof handler !== 'function'){
            this._error_handler = this.default_error_handler;
        }else{
            this._error_handler = handler;
        }
    }

    apply_error_handler(_error_owner, _name, msg){
        if(this._error_handler)
            this._error_handler(_error_owner, _name, msg);
    }

    get dir(){
        return this._dir;
    }

    set dir(_dir){
        if(_dir instanceof Gio.File){
            this.path = _dir;
        }else if((_dir instanceof String || typeof _dir == 'string') && _dir.trim() != ''){
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([_dir.trim()]));
        }else{
            this._dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
        }
    }

    get file_name(){
        return this._file_name;
    }

    set file_name(_file_name){
        if(_file_name instanceof String || typeof _file_name == 'string'){
            this._file_name = _file_name.trim();
            this._list_section.set_file_name(this._file_name);
        }else{
            this._file_name = 'notes.txt';
            this._list_section.set_file_name(this._file_name);
        }
    } // set file_name(_file_name) //

    get path(){
        if(this._file_name.trim() === ''){
            return this._dir;
        }else{
            return Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
        }
    }

    get contents(){
        return this._contents;
    }

    default_error_handler(_error_owner, _name, msg){
        //throw { name: _name, message: msg };
        const dlg = new GzzMessageDialog(_name, msg, 'dialog-error');
        dlg.open();
    }

    get dialog_type(){
        return this._dialog_type;
    }

    set dialog_type(dialogtype){
        if(dialogtype instanceof GzzDialogType){
            if(dialogtype === GzzDialogType.Open || dialogtype === GzzDialogType.Save || dialogtype === GzzDialogType.SelectDir){
                this._dialog_type = dialogtype;
            }else{
                this._error_handler(this, "dialog_type_error", "Unkown GzzDialogType instance in set_dialog_type(dialogtype).");
            }
        }else{
            this._error_handler(this, "dialog_type_error", "dialog_type must be an instance of GzzDialogType.");
        }
    } // set dialog_type(dialogtype) //

    set contents(_contents){
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

    get filter(){
        return this._filter.toString;
    }

    set filter(regex){
        if(!regex){
            this._filter = new RegExp('^.*$');
        }else if(regex instanceof RegExp){
            this._filter = regex;
        }else if(regex instanceof String || typeof regex === 'string'){
            this._filter = new RegExp(regex);
        }else{
            const t = typeof regex;
            this._owner._error_handler(this,
                'GzzListFileRow::set_filter_error',
                `regex must be of type RegExp or /.../ or String you supplied ${regex} of type ${t}`);
        }
    } // set filter(regex) //

    get glob(){
        return RegExp2glob(this._filter);
    }

    set glob(_glob){
        const regex = glob2RegExp(_glob);
        if(regex) this._filter = regex;
    }

    add_row(row){
        this._list_section.list.add_child(row);
    }

    get double_click_time(){
        return this._double_click_time;
    }

    set double_click_time(dbl_click_time){
        if(isNaN(Number(dbl_click_time))){
            this._owner._error_handler(this,
                'GzzFileDialog::set_double_click_time_error',
                `bad value expected integer or date got ${dbl_click_time}`);
        }else if(dbl_click_time instanceof Date){
            this._double_click_time = dbl_click_time.getTime();
        }else if(Number(dbl_click_time).isInteger){
            this._double_click_time = Number(dbl_click_time);
        }else{
            this._owner._error_handler(this,
                'GzzFileDialog::set_double_click_time_error',
                `bad number type expected integer or Date ${dbl_click_time}`);
        }
    } // set double_click_time(dbl_click_time) //

    clicked(_row, filename){
        this.set_file_name(filename);
    }

    double_clicked(_row, directory){
        if(directory){
            this._list_section.list.destroy_all_children();
            const current_dir = Gio.File.new_for_path(GLib.build_filenamev([this._file_name.get_path(), directory]));
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
        let _is_dir    = null;
        const attributes = "standard::name,standard::type,standard::display_name,standard::icon";
        try {
            enumerator = filename.enumerate_children(attributes, Gio.FileQueryInfoFlags.NONE, null);
            let info;
            while ((info = enumerator.next_file(null))) {
                if (this._dialog_type === GzzDialogType.SelectDir && info.get_file_type() !== Gio.FileType.DIRETORY) {
                    continue;
                }
                const matches = info.get_name().match(this._filter);
                if (!matches) {
                    continue;
                }

                const file_type = info.get_file_type();

                _is_dir = (file_type === Gio.FileType.DIRECTORY);

                const file     = enumerator.get_child(info);

                if(file_type === Gio.FileType. SYMBOLIC_LINK){
                    _is_dir = this.file_is_dir(file); // will identify symlink directories as directory //
                }

                const query_info = file.query_info('standard::display_name', Gio.FileQueryInfoFlags.NONE, null)

                const row = new GzzListFileRow({
                    owner:             this, 
                    title:             query_info.get_display_name(),
                    is_dir:            _is_dir, 
                    icon:              info.get_icon(), 
                    double_click_time: this._double_click_time, 
                });

                this.add_row(row);
            }
        } catch(e){
            this.apply_error_handler(this, 'GzzFileDialog::display_dir_error', `Exception caught: ${e}`);
        }
    } // display_dir(filename) //

    do_open_save(){
        if(this._dialog_type === GzzDialogType.Open){
            const filename = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
            this._result = !!filename;
            return filename.get_path();
        }else if(this._dialog_type === GzzDialogType.Save){
            return this.save_file();
        }else if(this._dialog_type === GzzDialogType.SelectDir){
            const filename = this._dir.get_path().trim();
            this._result = !!filename;
            return filename;
        }
    } // do_open_save() //

    async save_file(){
        this._result = false;
        if(!this._dir){
            this.destroy();
            return this._result;
        }
        if(!this._contents){
            this.destroy();
            return this._result;
        }
        let ret = null;
        try {
            ret = GLib.mkdir_with_parents(this._dir.get_path(), 0o755);
            if(ret == -1){
                console.log(`Error Glib.mkdir_with_parents('${this._dir.get_path()}', 0o755) failed`);
            }
        }catch(_e){
            console.log(`Error Exception: ${_e}`)
            return this._result;
        }
        try {
            const file_path = Gio.File.new_for_path(GLib.build_filenamev([this._dir.get_path(), this._file_name]));
            if(file_path){
                const outputStream = await file_path.create_async(Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null);
                const bytesWritten = await outputStream.write_bytes_async(this._contents, GLib.PRIORITY_DEFAULT, null);
                this._result = (bytesWritten == this._contents.get_size());
                return this._result;
            }
        }catch(_e){
            console.log(`Error: ${_e}`);
            this.destroy();
            return this._result;
        }
        this.destroy();
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
        if(this._result){
            return [this._dir.get_path(), this._file_name];
        }else{
            return [null, null];
        }
        
    } // async save_to_file() //

    create_new_dir(){
        const dlg = new GzzPromptDialog({
            title:       _('Make Directory'), 
            description: _('Type a new name for the new directory.'), 
            ok_button:   _('Make Directory'), 
            icon_name:   'folder-new', 
        });
        dlg.open();
        const new_dir = dlg.get_text();
        if(dlg.result && new_dir.trim() !== ''){
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
                this.apply_error_handler(this, 'GzzFileDialog::create_new_dir_error', `make_directory Exception: ${e}: ${new_dir}`);
            }
        } // if(dlg.result && new_dir.trim() !== '') //
    } // create_new_dir() //

} // export class GzzFileDialog extends ModalDialog.ModalDialog //
