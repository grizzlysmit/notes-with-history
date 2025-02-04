/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
"use strict";

import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
// import Gda from 'gi://Gda';
// import * as Gda from 'gi://Gda';
import * as Gzz from './gzzDialog.js';


import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const APPLICATION_ICON_SIZE = 16;

class ApplicationMenuItem extends PopupMenu.PopupBaseMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(button, item) {
        super();
        this._menuitem = this;
        this._item = item;
        this._button = button;

        this.icon = this.getIcon();

        this._iconBin = new St.Bin();
        this.add_child(this._iconBin);

        let menuitemLabel = new St.Label({
            text: this._item?.text ?? '<Error bad value for this_item.text>',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(menuitemLabel);
        this.label_actor = menuitemLabel;

        let textureCache = St.TextureCache.get_default();
        textureCache.connectObject('icon-theme-changed',
                                        () => this._updateIcon(), this);
        this._updateIcon();

        this.connectObject('activate', (event) => this.activate(event), this);

    } // constructor(button, item) //

    getIcon() {
        let icon         = null;
        let app          = null;
        let gicon        = null;
        let _icon_name    = null;
        switch (this._item.type) {
            case "note":

                icon = new St.Icon({
                    icon_name: 'notes-app',
                    style_class: 'system-status-icon',
                });
                icon.icon_size = APPLICATION_ICON_SIZE;
                break;
            case "settings":
                app  = this._button._caller.appSys.lookup_app('org.gnome.settings');
                if(!app){
                    icon = new St.Icon({
                        style_class: 'icon-dropshadow',
                    });
                    _icon_name = "notes-app";
                    gicon = Gio.icon_new_for_string(_icon_name);
                    icon.gicon = gicon;
                    icon.icon_size = APPLICATION_ICON_SIZE;
                    return icon;
                }
                icon = app.create_icon_texture(APPLICATION_ICON_SIZE);
                break;
            default:
                icon = new St.Icon({
                    style_class: 'icon-dropshadow',
                });
                _icon_name = "notes-app";
                gicon = Gio.icon_new_for_string(_icon_name);
                icon.gicon = gicon;
                icon.icon_size = APPLICATION_ICON_SIZE; 
        } // switch (this.item.type) //
        if(!icon){
            icon = new St.Icon({
                style_class: 'icon-dropshadow',
            });
            let gicon;
            _icon_name = "notes-app";
            gicon = Gio.icon_new_for_string(_icon_name);
            icon.gicon = gicon;
            icon.icon_size = APPLICATION_ICON_SIZE;
       }
        return icon;
    }

    _updateIcon() {
        let icon = this.getIcon();
        if(icon){
            icon.style_class = 'icon-dropshadow';
            this._iconBin.set_child(icon);
        }
    }

    activate(event) {
        let t        = typeof event;
        Gzz.log_message('notes', `ApplicationMenuItem::activate: event == ‷${event}‴ of type ‷${t}‴.`, new Error());
        super.activate(event);
        let dlg      = null;
        let new_note = null;
        let index    = null;
        let txt      = null;
        /*
        dlg          = new Gzz.GzzMessageDialog('ApplicationMenuItem::activate(event)', `Proccessing event: ‷${event}‴.`);
        Gzz.log_message('notes', `ApplicationMenuItem::activate: dlg == ‷${dlg}‴`, new Error());
        dlg.open();
        dlg          = null;
        // */
        try {
            t       = typeof this._item;
            Gzz.log_message('notes', `ApplicationMenuItem::activate: this._item == ‷${JSON.stringify(this._item)}‴ of type ‷${t}‴.`, new Error());
            const string2enum = { settings: 0, fileDisplay: 1, notesScroller: 2, editNote: 3, aboutPage: 4, credits: 5, };
            switch (this._item.type) {
                case "note":
                    switch(this._item.subtype){
                        case 'edit':
                            index    = this._item.index;
                            txt = this._button._caller.notes[index];
                            Gzz.log_message('notes', `ApplicationMenuItem::activate: edit: index == ‷${index}‴, txt: ‷${txt}‴.`, new Error());
                            dlg = new Gzz.GzzPromptDialog({
                                            title:       _('Edit Note'), 
                                            description: _('Edit or view Note.'), 
                                            icon_name:   'notes-app', 
                                            text:        txt,
                                            max_length:    this._button._caller.settings.get_int('max-note-length'), 
                                            buttons:     [
                                                {
                                                    label:   _('Cancel'),
                                                    icon_name: 'stock_calc-cancel', 
                                                    action: () => {
                                                        dlg.set_result(false);
                                                        Gzz.log_message('notes', `Callback Cancel: dlg.result: ‷${dlg.result}‴`, new Error());
                                                        Gzz.log_message('notes', `Callback Cancel: dlg.text: ‷${dlg.text}‴`, new Error());
                                                        dlg.destroy();
                                                    },
                                                },
                                                {
                                                    label:   _('Delete'),
                                                    icon_name: 'stock_delete', 
                                                    isDefault: true,
                                                    action: () => {
                                                        dlg.set_text('');
                                                        dlg.set_result(true);
                                                        Gzz.log_message('notes', `Callback Delete: dlg.result: ‷${dlg.result}‴`, new Error());
                                                        Gzz.log_message('notes', `Callback Delete: dlg.text: ‷${dlg.text}‴`, new Error());
                                                        this._button._caller.notes.splice(index, 1);
                                                        Gzz.log_message(
                                                            'notes',
                                                            'Callback Delete: case note sub case edit: notes:'
                                                            + ` ‷${JSON.stringify(this._button._caller.notes)}‴.`,
                                                            new Error()
                                                        );
                                                        this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                                                        dlg.destroy();
                                                    },
                                                }, 
                                                {
                                                    label:   _('Save'),
                                                    icon_name: 'stock_save', 
                                                    isDefault: true,
                                                    action: () => {
                                                        dlg.set_result(true);
                                                        Gzz.log_message('notes', `Callback Save: dlg.result: ‷${dlg.result}‴`, new Error());
                                                        Gzz.log_message('notes', `Callback Save: dlg.text: ‷${dlg.text}‴`, new Error());
                                                        new_note = dlg.text;
                                                        if(new_note.trim() != ''){
                                                            this._button._caller.notes[index] = new_note;
                                                            Gzz.log_message(
                                                                'notes',
                                                                'Callback action: case note sub case edit: notes == '
                                                                + `‷${JSON.stringify(this._button._caller.notes)}‴.`,
                                                                new Error()
                                                            );
                                                            this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                                                        }
                                                        dlg.destroy();
                                                    },
                                                }
                                            ], 
                            });
                            dlg.open();
                            break;
                        case 'delete':
                            index    = this._item.index;
                            Gzz.log_message('notes', `ApplicationMenuItem::activate: delete: index: ‷${index}‴.`, new Error());
                            dlg = new Gzz.GzzMessageDialog(
                                _('Are you sure'),
                                _(`Are you sure you want to delete note: ‷${this._button._caller.notes[index]}⁗.`),
                                'emblem-dialog-question', 
                                [
                                    {
                                        label:   _('Yes'), 
                                        icon_name: 'stock_yes', 
                                        action: () => {
                                            dlg.set_result(true);
                                            this._button._caller.notes.splice(index, 1);
                                            this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                                            dlg.destroy();
                                        }, 
                                    }, 
                                    {
                                        label:   _('No'), 
                                        icon_name: 'stock_no', 
                                        action: () => {
                                            dlg.set_result(false);
                                            dlg.destroy();
                                        }, 
                                    }, 
                                ]
                            );
                            dlg.open();
                            break;
                        case "edit-delete-in-prefs":
                            index    = this._item.index;
                            Gzz.log_message('notes', `ApplicationMenuItem::activate: edit-delete-in-prefs: index: ‷${index}‴.`, new Error());
                            this._button._caller.settings.set_int('index', index);
                            this._button._caller.settings.set_boolean("edit-note", true);
                            this._button._caller.settings.set_enum('page', string2enum['editNote']);
                            this._button._caller.openPreferences();
                            break;
                    } // switch(this._item.subtype) //
                    break;
                case "addnote":
                    index    = this._item.index;
                    Gzz.log_message('notes', `ApplicationMenuItem::activate: case addnote: index: ‷${index}‴.`, new Error());
                    dlg = new Gzz.GzzPromptDialog({
                        title:       _('Edit Note'), 
                        description: _('Edit or view Note.'), 
                        ok_button:   _('Add Note'), 
                        ok_icon_name:  'list-add', 
                        max_length:    this._button._caller.settings.get_int('max-note-length'), 
                        ok_call_back: () => {
                            const result   = dlg.get_result();
                            const new_note = dlg.get_text();
                            Gzz.log_message('notes', `Callback ok_call_back: new_note == ‷${new_note}‴`, new Error());
                            Gzz.log_message('notes', `Callback ok_call_back: result == ‷${result}‴`, new Error());
                            if(result){
                                if(new_note.trim() !== ''){
                                    this._button._caller.notes.unshift(new_note);
                                    const thisline = new Error().lineNumber;
                                    Gzz.log_message(
                                        'notes', 
                                        `ApplicationMenuItem::addnote:${thisline + 1}:`
                                                    + ' this._button._caller.notes: '
                                                    + `‷${JSON.stringify(this._button._caller.notes)}‴.`,
                                        new Error()
                                    );
                                    this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                                } // if(new_note.trim() !== '') //
                            } // if(result) //
                        },
                        icon_name:   'notes-app', 
                        text:        '',
                    });
                    dlg.open();
                    break;
                case  "savefile":
                    Gzz.log_message('notes', `savefile: index: ‷${index}‴.`, new Error());
                    this._button.save_to_file();
                    break;
                case "loadfile":
                    Gzz.log_message('notes', `loadfile: index: ‷${index}‴.`, new Error());
                    this._button.get_file_contents();
                    break;
                case "settings":
                case "fileDisplay":
                case "notesScroller":
                case "aboutPage":
                case "credits":
                    Gzz.log_message('notes', `notes: settings, etc: this._item.type: ‷${this._item.type}‴.`, new Error());
                    this._button._caller.settings.set_boolean("edit-note", true);
                    this._button._caller.settings.set_enum("page", string2enum[this._item.type]);
                    this._button._caller.openPreferences();
                    break;
            } // switch (this._item.type) //
        }
        catch(e){
            Gzz.log_message('notes', `${e.stack}`, e);
            Gzz.log_message('notes', `Exception ‷${e}‴`, e);
            this._button._caller.display_error_msg('ApplicationMenuItem::activate', `Exception ‷${e}‴`, e);
        }
    } // activate(event) //

} // class ApplicationMenuItem extends PopupMenu.PopupBaseMenuItem //

class Indicator extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(caller) {
        super(0.0, _('Notes with history'));
        this._caller = caller;
        this.appSys = this._caller.appSys;

        this.add_child(new St.Icon({
            icon_name: 'notes-app',
            style_class: 'system-status-icon',
        }));

        const tmp = this._caller.settings.get_string("notespath").trim();

        const notespath = ((tmp == '') ?
            GLib.build_filenamev([GLib.get_home_dir()]) :
                                    GLib.build_filenamev([tmp]));

        this.dir_path = Gio.File.new_for_path(notespath);
        this._caller.settings.set_boolean('edit-note', this._caller.edit_note);

        const file_name = this._caller.notesname.trim();
        
        this._caller.notesname     = ((file_name == '') ? 'notes.txt' : file_name);

        this.loadMesessages();

    } // constructor(caller) //

    save_to_file(){
        const file_name = this._caller.notesname.trim();
        const path      = this._caller.notespath.get_path();
        const cont      = this._caller.notes.join("\r\n");
        const _dialogtype = Gzz.GzzDialogType.Save;
        Gzz.log_message('notes', `file_name: ‷${file_name}‴.`, new Error());
        Gzz.log_message('notes', `path: ‷${path}‴.`, new Error());
        Gzz.log_message('notes', `cont: ‷${cont}‴.`, new Error());
        Gzz.log_message('notes', `_dialogtype: ‷${JSON.stringify(_dialogtype)}‴.`, new Error());
        const dlg       = new Gzz.GzzFileDialog({
            title:                _("Save messages as file"),
            dialogtype:           _dialogtype,
            dir:                  path, 
            file_name:            ((file_name == '') ? 'notes.txt' : file_name), 
            contents:             cont, 
            filter:               new RegExp('^.*\\.txt$', 'i'), 
            icon_size:            this._caller.settings.get_int('icon-size'), 
            display_times:        this._caller.settings.get_enum('time-type'), 
            display_inode:        this._caller.settings.get_boolean('display-inode'), 
            display_user_group:   this._caller.settings.get_enum('user-group'), 
            display_mode:         this._caller.settings.get_boolean('display-mode'),
            display_number_links: this._caller.settings.get_boolean('display-number-links'),
            display_size:         this._caller.settings.get_boolean('display-size'),
            base2_file_sizes:     this._caller.settings.get_boolean('base2-file-sizes'),
            show_icon:            this._caller.settings.get_boolean('display-icon'),
            double_click_time:    this._caller.settings.get_int('double-click-time'), 
            save_done:            (_dlg, result, dir_, file_name_) => {
                if(result){
                    if(dir_){
                        this._caller.settings.set_string("notespath", dir_.get_path());
                    }
                    if(file_name_ && (file_name_ instanceof String || typeof file_name_ === 'string')){
                        this._caller.settings.set_string("notesname", file_name_);
                    }
                } // if(result) //
            }, 
        });
        dlg.open();
    } // save_to_file() //

    get_file_contents(){
        let notesfile = null;
        let ok        = null;
        let contents  = null;
        let _etag      = null;
        let dlg       = null;
        try {
            const _dir        = this._caller.notespath;
            const _file_name  = this._caller.notesname;
            const _dialogtype = Gzz.GzzDialogType.Open;
            dlg = new Gzz.GzzFileDialog({
                title:                'Load File', 
                dir:                  _dir, 
                file_name:            _file_name, 
                dialogtype:           _dialogtype, 
                display_times:        this._caller.settings.get_enum('time-type'), 
                display_inode:        this._caller.settings.get_boolean('display-inode'), 
                display_user_group:   this._caller.settings.get_enum('user-group'), 
                display_mode:         this._caller.settings.get_boolean('display-mode'),
                display_number_links: this._caller.settings.get_boolean('display-number-links'),
                display_size:         this._caller.settings.get_boolean('display-size'),
                show_icon:            this._caller.settings.get_boolean('display-icon'),
                base2_file_sizes:     this._caller.settings.get_boolean('base2-file-sizes'),
                filter:               new RegExp('^(?:.*\\.txt)$', 'i'), 
                double_click_time:    this._caller.settings.get_int('double-click-time'), 
                save_done:            (dlg_, result, _dir, _file_name) => {
                    if(result){
                        notesfile = dlg_.get_full_path();
                        if(notesfile){
                            [ok, contents, _etag]  = notesfile.load_contents(null);            
                            if(ok){
                                const contents_ = new TextDecoder().decode(contents);
                                let max_length = -1;
                                let min_length = this._caller.max_note_length + 1;
                                let notes      = []
                                let cnt        = 0;
                                Gzz.log_message( 'notes', `Indicator::callback: contents_ == ${contents_}`, new Error());
                                Gzz.log_message( 'notes', `Indicator::callback: typeof contents_ == ${typeof contents_}`, new Error());
                                Gzz.log_message( 'notes', `Indicator::callback: contents_ == ${JSON.stringify(contents_)}`, new Error());
                                const array_of_notes = contents_.split("\r\n");
                                for(const note of array_of_notes){
                                    max_length = Math.max(max_length, note.length);
                                    min_length = Math.min(min_length, note.length);
                                    if(0 < note.length && note.length <= this._caller.max_note_length){
                                        cnt++;
                                        if(cnt > this._caller.show_messages){
                                            continue;
                                        }
                                        notes.push(note);
                                    }
                                } // for(const note of array_of_notes) //
                                this._caller.notesname = dlg.get_file_name();
                                this._caller.notespath = dlg.get_dir();
                                this._caller.settings.set_string("notesname", this._caller.notesname);
                                this._caller.settings.set_string("notespath", this._caller.notespath.get_path());
                                if(notes.length > 0){
                                    this._caller.notes = notes;
                                    this._caller.settings.set_strv('notes', this._caller.notes);
                                }else{
                                    this._caller.display_error_msg(
                                        'Indicator::get_file_contents',
                                        'Error: bad file none of the notes where of a suitable size.', 
                                        new Error()
                                    );
                                }
                                if(min_length == 0){
                                    this._caller.display_error_msg(
                                        'Indicator::get_file_contents',
                                        'Error: some of the notes where empty they were skipped.', 
                                        new Error()
                                    );
                                }
                                if(max_length > this._caller.max_note_length){
                                    this._caller.display_error_msg('Indicator::get_file_contents',
                                        "Error: some of the notes where too big they were skipped.\n"
                                         + " THis can be caused by a change in the max_note_length property. "
                                         + `currently set at ${this._caller.max_note_length}`, 
                                        new Error()
                                    );
                                }
                            } // if(ok) //
                        } // if(notesfile) //
                    } // if(result) //
                }, 
            });
            dlg.open();
        }catch(e){
            Gzz.log_message('notes', `${e.stack}`, e);
            Gzz.log_message('notes', `Error: in Indicator::get_file_contents() ‷${e}‴:`, e);
            this._caller.display_error_msg('Indicator::get_file_contents_error', `Error: in Indicator::get_file_contents() ${e}`, e);
        }
    }  // get_file_contents() //
    
    loadMesessages(){
        let item = null;
        let submenu = null;
        submenu = new PopupMenu.PopupSubMenuMenuItem(_('Actions'), true, this, 0);

        item = new ApplicationMenuItem(this, { text: _('Save to file...'), type: 'savefile', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Load from file...'), type: 'loadfile', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Add Note...'), type: 'addnote', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        this.menu.addMenuItem(submenu);

        submenu = new PopupMenu.PopupSubMenuMenuItem(_('Preferences & About'), true, this, 0);

        submenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        item = new ApplicationMenuItem(this, { text: _('Settings...'), type: 'settings', index: 0, subtype: 'None', });

        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('File Display Settings...'), type: 'fileDisplay', index: 0, subtype: 'None', });

        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Notes Scroller...'), type: 'notesScroller', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);
        item = new ApplicationMenuItem(this, { text: _('About...'), type: 'aboutPage', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);
        item = new ApplicationMenuItem(this, { text: _('Credits...'), type: 'credits', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        this.menu.addMenuItem(submenu);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const length = Math.min(this._caller.settings.get_int('show-messages'), this._caller.settings.get_strv('notes').length);
        for(let i = 0; i < length; i++){
            submenu = new PopupMenu.PopupSubMenuMenuItem(this._caller.notes[i], true, this, 0);
            item         = new ApplicationMenuItem(this, { text: 'Edit...', index: i, type: 'note', subtype: 'edit', });
            //item.connect('activate', (event) => { item.activate(event); });
            submenu.menu.addMenuItem(item);
            item         = new ApplicationMenuItem(this, { text: 'Delete...', index: i, type: 'note', subtype: 'delete', });
            //item.connect('activate', (event) => { item.activate(event); });
            submenu.menu.addMenuItem(item);
            item         = new ApplicationMenuItem(this, { text: 'Edit or Delete...', index: i, type: 'note', subtype: 'edit-delete-in-prefs', });
            //item.connect('activate', (event) => { item.activate(event); });
            submenu.menu.addMenuItem(item);
            this.menu.addMenuItem(submenu);
        } // for(let i = 0; i < this._caller.notes.length; i++) //
    } // loadMesessages() //

    refesh_menu(){
        Gzz.log_message('notes', "Indicator::refesh_menu: starting.", new Error());
        this.menu.box.destroy_all_children();
        this.loadMesessages();
        Gzz.log_message('notes', "Indicator: done.", new Error());
    }

} // class Indicator extends PanelMenu.Button //


export default class IndicatorExampleExtension extends Extension {

    constructor(metadata){
        super(metadata);
        this._indicator           = null;
        this.settings             = null;
        const id                  = this.uuid;
        const indx                = id.indexOf('@');
        this._name                = id.substr(0, indx);
        this.settings_change_self = false;
        this.areas                = ["left", "center", "right"];
    }

    enable() {
        this.appSys            = Shell.AppSystem.get_default();
        this.settings          = this.getSettings();
        this.show_messages     = this.settings.get_int("show-messages");
        this.page_name         = this.settings.get_enum("page");
        this.index             = this.settings.get_int("index");
        this.notes             = this.settings.get_strv("notes");
        this.max_note_length   = this.settings.get_int("max-note-length");
        this.edit_note         = this.settings.get_boolean("edit-note");
        this.notesname         = this.settings.get_string("notesname");
        const tmp_path         = this.settings.get_string("notespath").trim();
        this.set_notespath(tmp_path);
        
        Gzz.set_show_logs(this.settings.get_boolean('show-logs'));
        this.settings.set_enum('area', this.settings.get_enum('area'));
        if(this.settings.get_int("position") < 0 || this.settings.get_int("position") > 25) this.settings.set_int("position", 0);
        this.settings.set_int('max-note-length', this.max_note_length);
        this.settings.set_int('show-messages', this.settings.get_int('show-messages'));
        this._indicator       = new Indicator(this);
        const area            = this.areas[this.settings.get_enum("area")];
        Gzz.log_message('notes', `area == ${area}`, new Error());
        Main.panel.addToStatusArea(this._name, this._indicator, this.settings.get_int("position"), area);

        this.settingsID_show     = this.settings.connect("changed::show-messages", () => {
            this.show_messages   = this.settings.get_int("show-messages");
        }); 
        this.settingsID_area     = this.settings.connect("changed::area", this.onPositionChanged.bind(this)); 
        this.settingsID_pos      = this.settings.connect("changed::position", this.onPositionChanged.bind(this)); 
        this.settingsID_notes    = this.settings.connect("changed::notes", this.onNotesChanged.bind(this)); 
        this.settingsID_max      = this.settings.connect("changed::max-note-length", () => {
            this.max_note_length = this.settings.get_int("max-note-length");
            this._indicator.refesh_menu();
        }); 
        this.settingsID_dir      = this.settings.connect('changed::notespath', () => {
            this.set_notespath(this.settings.get_string("notespath").trim());
        });
        this.settingsID_filename = this.settings.connect('changed::notesname', () => {
            this.notesname         = this.settings.get_string("notesname");
        });
        this.settingsID_show_logs = this.settings.connect('changed::show-logs', () => {
            Gzz.set_show_logs(this.settings.get_boolean('show-logs'));
        });
    }

    set_notespath(path_){
        Gzz.log_message('notes', `IndicatorExampleExtension::set_notespath: path_: ${path_}`, new Error());
        if(!path_){
            this.notespath = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            this.settings.set_string("notespath", this.notespath.get_path());
        }else if(path_ instanceof String){
            const path = GLib.build_filenamev([path_.toString()]);
            if(path){
                this.notespath = Gio.File.new_for_path(path);
            }else{
                Gzz.log_message(
                    'notes', 
                    `IndicatorExampleExtension::set_notespath_error: bad value for path: ${path}: `
                    + `genrated from path_: ${path_}:`, 
                    new Error()
                );
                this.display_error_msg(
                    'IndicatorExampleExtension::set_notespath',
                    `IndicatorExampleExtension::set_notespath: bad value for path: ${path} genrated from path_: ${path_}: `, 
                    new Error()
                );
            }
        }else{ // if(!path_) else if(path_ instanceof String) //
            const path = GLib.build_filenamev([path_.toString()]);
            if(path){
                this.notespath = Gio.File.new_for_path(path);
            }else{
                Gzz.log_message(
                    'notes', 
                    `IndicatorExampleExtension::set_notespath_error: bad value for path: ${path}: `
                    + `genrated from path_: ${path_}:`, 
                    new Error()
                );
                this.display_error_msg(
                    'IndicatorExampleExtension::set_notespath',
                    `IndicatorExampleExtension::set_notespath: bad value for path: ${path} genrated from path_: ${path_}: `,
                    new Error()
                );
            } // if(path) ... else ... //
        } // if(!path_) else if(path_ instanceof String) ... else ... //
    } // set_notespath(path_) //

    disable() {
        this._indicator.destroy();
        this.settings.disconnect(this.settingsID_show);
        this.settings.disconnect(this.settingsID_area);
        this.settings.disconnect(this.settingsID_pos);
        this.settings.disconnect(this.settingsID_notes);
        this.settings.disconnect(this.settingsID_max);
        this.settings.disconnect(this.settingsID_dir);
        this.settings.disconnect(this.settingsID_filename);
        delete this.appSys;
        delete this.settings;
        this._indicator = null;
    }

    display_error_msg(title, description, e = null){
        if(e && e instanceof Error){
            description += `${e.fileName}:${e.lineNumber}:${e.columnNumber}`;
        }
        const dlg = new Gzz.GzzMessageDialog(title, description, 'dialog-error');
        dlg.open();
    }

    onPositionChanged(){
        Main.panel.menuManager.removeMenu(this._indicator.menu);
        Main.panel.statusArea[this._name] = null;
        const area      = this.areas[this.settings.get_enum("area")];
        Gzz.log_message('notes', `area == ${area}`, new Error());
        const position  = this.settings.get_int("position");
        Main.panel.addToStatusArea(this._name, this._indicator, position, area);
    }

    onNotesChanged(){
        if(this.settings_change_self){
            this.settings_change_self = false;
        }else{
            this.notes                        = this.settings.get_strv("notes");
            Gzz.log_message('notes', `IndicatorExampleExtension::onNotesChanged: this.notes: ${JSON.stringify(this.notes)}`, new Error());
            this._indicator.refesh_menu();
            Gzz.log_message('notes', `IndicatorExampleExtension::onNotesChanged: this.notes: ${JSON.stringify(this.notes)}`, new Error());
        }
    }

} // export default class IndicatorExampleExtension extends Extension //
