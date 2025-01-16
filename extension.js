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

const APPLICATION_ICON_SIZE = 32;

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

    } // constructor(button, item) //

    getIcon() {
        let icon         = null;
        let app          = null;
        switch (this._item.type) {
            case "note":

                icon = new St.Icon({
                    icon_name: 'notes-app',
                    style_class: 'system-status-icon',
                });
                break;
            case "settings":
                app  = this._button.appSys.lookup_app('org.gnome.Settings');
                icon = app.create_icon_texture(APPLICATION_ICON_SIZE);
                break;
        } // switch (this.item.type) //
        if(!icon){
            icon = new St.Icon({
                style_class: 'icon-dropshadow',
            });
            let gicon;
            let icon_name = "question-symbolic";
            gicon = Gio.icon_new_for_string(icon_name);
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
        let dlg      = null;
        let new_note = null;
        let index    = null;
        switch (this._item.type) {
            case "note":
                switch(this._item.subtype){
                    case 'edit':
                        index    = this._item.index;
                        dlg = new Gzz.GzzPromptDialog({
                                        title:       _('Edit Note'), 
                                        description: _('Edit or view Note.'), 
                                        ok_button:   _('Save'), 
                                        ok_icon_name:  'stock_save', 
                                        buttons:     [{
                                                label:   _('Cancel'),
                                                icon_name: 'stock_calc-cancel', 
                                                action: () => {
                                                    dlg.set_result(false);
                                                    dlg.destroy();
                                                },
                                            },
                                            {
                                                label:   _('Delete'),
                                                icon_name: 'stock_delete', 
                                                isDefault: true,
                                                action: () => {
                                                    dlg.set_edit.text('');
                                                    dlg.set_result(true);
                                                    dlg.destroy();
                                                },
                                            }, 
                                            {
                                                label:   _('Save'),
                                                icon_name: 'stock_save', 
                                                isDefault: true,
                                                action: () => {
                                                    dlg.set_result(true);
                                                    dlg.destroy();
                                                },
                                        }], 
                                        icon_name:   'notes-app', 
                                        text:        this._button._caller.notes[index],
                        });
                        dlg.open();
                        new_note = dlg.get_text();
                        if(dlg.result){
                            if(new_note.trim() !== ''){
                                this._button._caller.notes[index] = new_note;
                            }else{
                                this._button._caller.notes.splice(index, 1);
                            }
                            this._button._caller.settings_change_self = true;
                            this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                        }
                        break;
                    case 'delete':
                        index    = this._item.index;
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
                        if(dlg.result){
                            this._button._caller.notes.splice(index, 1);
                            this._button._caller.settings_change_self = true;
                            this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                        }
                        break;
                } // switch(this._item.subtype) //
                break;
            case "addnote":
                dlg = new Gzz.GzzPromptDialog({
                                title:       _('Edit Note'), 
                                description: _('Edit or view Note.'), 
                                ok_button:   _('Add Note'), 
                                ok_icon_name:  'list-add', 
                                icon_name:   'notes-app', 
                                text:        this._item.text,
                });
                dlg.open();
                new_note = dlg.get_text();
                if(dlg.result){
                    if(new_note.trim() !== ''){
                        this._button._caller.notes.unshift(new_note);
                    }
                    this._button._caller.settings_change_self = true;
                    this._button._caller.settings.set_strv('notes', this._button._caller.notes);
                }
                break;
            case  "savefile":
                this._button.save_to_file();
                break;
            case "loadfile":
                this._button.get_file_contents();
                break;
            case "settings":
            case "notesScroller":
            case "aboutPage":
            case "credits":
                this._button.settings.set_enum("page", this._item.type);
                this._button._caller.openPreferences();
                break;
        } // switch (this._item.type) //
        super.activate(event);
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

        const notespath = ((tmp == '') ? GLib.build_filenamev([GLib.get_home_dir()]) : GLib.build_filenamev([tmp]));

        this.dir_path = Gio.File.new_for_path(notespath);

        const file_name = this._caller.notesname.trim();
        
        this._caller.notesname     = ((file_name == '') ? 'notes.txt' : file_name);

        this.loadMesessages();

    } // constructor(caller) //

    save_to_file(){
        const title   = _("Save messages as file");
        const file_name = this._caller.notesname.trim();
        const dlg  = new Gzz.GzzFileSaveDialog({
            title,
            dialogtype:        Gzz.GzzDialogType.Save,
            dir:               this._caller.notespath, 
            file_name:         ((file_name == '') ? 'notes.txt' : file_name), 
            contents:          this._caller.notes.join("\r\n"), 
            filter:            new RegExp('^.*\\.txt$', 'i'), 
            double_click_time: 400, 
        });
        let _dir  = null;
        let _name = null;
        [dir, name] = dlg.save_to_file();
        if(dlg.result){
            if(dir){
                this.notespath = GLib.build_filenamev([dir]);
                this._caller.settings.set_string("notespath", this.notespath.get_path());
            }
            if(name){
                this._caller.notesname = name;
                this._caller.settings.set_string("notesname", this._caller.notesname);
            }
        } // if(dlg.result) //
    } // save_to_file() //

    get_file_contents(){
        let notesfile = null;
        let ok        = null;
        let contents  = null;
        let _etag      = null;
        let dlg       = null;
        try {
            dlg = new Gzz.GzzFileDialog({
                title:             'Load File', 
                dir:               this._caller.notespath, 
                file_name:         this._caller.notesname, 
                dialogtype:        Gzz.GzzDialogType.Open, 
                filter:            new RegExp('^(?:.*\\.txt)$', 'i'), 
                double_click_time: 400, 
            });
            dlg.open();
            if(!dlg.result){
                return null;
            }
            notesfile = dlg.get_path();
            if(notesfile){
                [ok, contents, _etag]  = this.notesfile.load_contents(null);            
                if(ok){
                    let max_length = -1;
                    let min_length = this._caller.max_note_length + 1;
                    let notes      = []
                    let cnt        = 0;
                    const array_of_notes = contents.split("\r\n");
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
                    this._caller.notesname = dlg.get_name();
                    this._caller.notespath = dlg.get_dir();
                    this._caller.settings.set_string("notesname", this._caller.notesname);
                    this._caller.settings.set_string("notespath", this._caller.notespath.get_path());
                    if(notes.length > 0){
                        this._caller.notes = notes;
                        this._caller.settings.set_strv(this._caller.notes);
                    }else{
                        this._caller.display_error_msg('Indicator::get_file_contents',
                            'Error: bad file none of the notes where of a suitable size.');
                    }
                    if(min_length == 0){
                        this._caller.display_error_msg('Indicator::get_file_contents',
                            'Error: some of the notes where empty they were skipped.');
                    }
                    if(max_length > this._caller.max_note_length){
                        this._caller.display_error_msg('Indicator::get_file_contents',
                            "Error: some of the notes where too big they were skipped.\n"
                             + " THis can be caused by a change in the max_note_length property. "
                             + `currently set at ${this, _caller.max_note_length}`);
                    }
                }
            }
        }catch(_e){
            console.log(`Error: in get_file_contents() ${_e}`);
        }
    }  // get_file_contents() //
    
    loadMesessages(){
        let item = null;
        let submenu = null;
        submenu = new PopupMenu.PopupSubMenuMenuItem('Actions & About', true, this, 0);
        this.build_menu(submenu, this.cmds[x].actions);

        item = new ApplicationMenuItem(this, { text: _('Save to file...'), type: 'savefile', action: [], alt: [], });
        submenu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Load from file...'), type: 'loadfile', action: [], alt: [], });
        submenu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Add Note...'), type: 'addnote', action: [], alt: [], });
        submenu.addMenuItem(item);

        submenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        item = new ApplicationMenuItem(this, { text: _('Settings...'), type: 'settings', action: [], alt: [], });
        //item.connect('activate', () => { this._caller.openPreferences(); });
        submenu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Notes Scroller...'), type: 'notesScroller', action: [], alt: [], });
        item = new ApplicationMenuItem(this, { text: _('About...'), type: 'aboutPage', action: [], alt: [], });
        item = new ApplicationMenuItem(this, { text: _('Credits...'), type: 'credits', action: [], alt: [], });
        submenu.addMenuItem(item);

        this.menu.addMenuItem(submenu);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        for(let i = 0; i < this._caller.notes.length; i++){
            submenu = new PopupMenu.PopupSubMenuMenuItem(this._caller.notes[i], true, this, 0);
            item         = new ApplicationMenuItem(this, { text: 'Edit...', index: i, type: 'note', subtype: 'edit', });
            submenu.addMenuItem(item);
            item         = new ApplicationMenuItem(this, { text: 'Delete...', index: i, type: 'note', subtype: 'delete', });
            submenu.addMenuItem(item);
            this.menu.addMenuItem(submenu);
        } // for(let i = 0; i < this._caller.notes.length; i++) //
    } // loadMesessages() //

    refesh_menu(){
        this.menu.destroy_all_children();
        this.loadMesessages();
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
        if(tmp_path == ''){
            this.notespath = GLib.build_filenamev([GLib.get_home_dir()]);
            this.settings.set_string("notespath", this.notespath.get_path());
        }else{
            this.notespath = GLib.build_filenamev([tmp]);
        }
        
        if(this.settings.get_int("position") < 0 || this.settings.get_int("position") > 25) this.settings.set_int("position", 0);
        this._indicator    = new Indicator(this);
        Main.panel.addToStatusArea(this._name, this._indicator, this.settings.get_int("position"), this.settings.get_enum("area"));

        this.settingsID_show = this.settings.connect("changed::show-messages", () => {
            this.show_messages     = this.settings.get_int("show-messages");
        }); 
        this.settingsID_area  = this.settings.connect("changed::area", this.onPositionChanged.bind(this)); 
        this.settingsID_pos   = this.settings.connect("changed::position", this.onPositionChanged.bind(this)); 
        this.settingsID_notes = this.settings.connect("changed::notes", this.onNotesChanged.bind(this)); 
        this.settingsID_max  = this.settings.connect("changed::max-note-length", () => {
            this.max_note_length   = this.settings.get_int("max-note-length");
        }); 
    }

    disable() {
        this._indicator.destroy();
        this.settings.disconnect(this.settingsID_show);
        this.settings.disconnect(this.settingsID_area);
        this.settings.disconnect(this.settingsID_pos);
        this.settings.disconnect(this.settingsID_notes);
        this.settings.disconnect(this.settingsID_max);
        delete this.appSys;
        delete this.settings;
        this._indicator = null;
    }

    display_error_msg(title, description){
        const dlg = new Gzz.GzzMessageDialog(title, description, 'dialog-error');
        dlg.open();
    }

    onPositionChanged(){
        Main.panel.menuManager.removeMenu(this._ext.menu);
        Main.panel.statusArea[this._name] = null;
        const area      = this.settings.get_enum("area");
        const position  = this.settings.get_int("position");
        Main.panel.addToStatusArea(this._name, this._indicator, position, area);
    }

    onNotesChanged(){
        if(this.settings_change_self){
            this._caller.settings_change_self = false;
        }else{
            this.notes                        = this.settings.get_strv("notes");
            this._indicator.refesh_menu();
        }
    }

} // export default class IndicatorExampleExtension extends Extension //
