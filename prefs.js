/* prefs.js
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

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk';
//import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';

import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';

class PageBase extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super({
            title: _title,
        });
        this._caller = caller;
        this.set_name(_name);
        this.set_icon_name(_icon_name);
    } // constructor(caller, _title, _name, _icon_name) //

    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        const close_button = new Gtk.Button({
                                                        label: _("Exit Settings"),
                                                         css_classes: ["suggested-action"],
                                                         valign: Gtk.Align.CENTER,
                                                    });
        row.add_suffix(close_button);
        row.activatable_widget = close_button;
        close_button.connect("clicked", () => { this._caller._close_request(this._caller._window); });

        return row;
    } // _close_row() //

} // class PageBase extends Adw.PreferencesPage //

class AboutPage extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, metadata){
        super({
            title: _('About'),
            icon_name: 'help-about-symbolic',
            name: 'AboutPage',
        });
        this._caller = caller;
        
        const PROJECT_TITLE = _('Alternate Menu for Hplip2');
        const PROJECT_DESCRIPTION = _('Some usefule menus, plus the original printer stuff, espcially the hp-toolbox entrypoint to hplip');

        // Project Logo, title, description-------------------------------------
        const projectHeaderGroup = new Adw.PreferencesGroup();
        const projectHeaderBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: false,
            vexpand: false,
        });

        const projectTitleLabel = new Gtk.Label({
            label: _(PROJECT_TITLE),
            css_classes: ['title-1'],
            vexpand: true,
            valign: Gtk.Align.FILL,
        });

        const projectDescriptionLabel = new Gtk.Label({
            label: _(PROJECT_DESCRIPTION),
            hexpand: false,
            vexpand: false,
        });
        projectHeaderBox.append(projectTitleLabel);
        projectHeaderBox.append(projectDescriptionLabel);
        projectHeaderGroup.add(projectHeaderBox);

        this.add(projectHeaderGroup);
        // -----------------------------------------------------------------------

        // Extension/OS Info and Links Group------------------------------------------------
        const infoGroup = new Adw.PreferencesGroup();

        const projectVersionRow = new Adw.ActionRow({
            title: _('Hplip-menu2 Version'),
        });
        projectVersionRow.add_suffix(new Gtk.Label({
            label: metadata.version.toString(),
            css_classes: ['dim-label'],
        }));
        infoGroup.add(projectVersionRow);

        if (metadata.commit) {
            const commitRow = new Adw.ActionRow({
                title: _('Git Commit'),
            });
            commitRow.add_suffix(new Gtk.Label({
                label: metadata.commit.toString(),
                css_classes: ['dim-label'],
            }));
            infoGroup.add(commitRow);
        }

        const gnomeVersionRow = new Adw.ActionRow({
            title: _('GNOME Version'),
        });
        gnomeVersionRow.add_suffix(new Gtk.Label({
            label: Config.PACKAGE_VERSION.toString(),
            css_classes: ['dim-label'],
        }));
        infoGroup.add(gnomeVersionRow);

        const osRow = new Adw.ActionRow({
            title: _('OS Name'),
        });

        const name = GLib.get_os_info('NAME');
        const prettyName = GLib.get_os_info('PRETTY_NAME');

        osRow.add_suffix(new Gtk.Label({
            label: prettyName ? prettyName : name,
            css_classes: ['dim-label'],
        }));
        infoGroup.add(osRow);

        const sessionTypeRow = new Adw.ActionRow({
            title: _('Windowing System'),
        });
        sessionTypeRow.add_suffix(new Gtk.Label({
            label: GLib.getenv('XDG_SESSION_TYPE') === 'wayland' ? 'Wayland' : 'X11',
            css_classes: ['dim-label'],
        }));
        infoGroup.add(sessionTypeRow);

        const githubRow = this._createLinkRow(_('Hplip-menu2 Github'), metadata.url);
        infoGroup.add(githubRow);

        const closeRow = this._close_row();
        infoGroup.add(closeRow);

        this.add(infoGroup);
    }

    _createLinkRow(title, uri) {
        const image = new Gtk.Image({
            icon_name: 'adw-external-link-symbolic',
            valign: Gtk.Align.CENTER,
        });
        const linkRow = new Adw.ActionRow({
            title: _(title),
            activatable: true,
        });
        linkRow.connect('activated', () => {
            Gtk.show_uri(this.get_root(), uri, Gdk.CURRENT_TIME);
        });
        linkRow.add_suffix(image);

        return linkRow;
    }
    
    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        const close_button = new Gtk.Button({
                                                label: _("Exit Settings"),
                                                 css_classes: ["suggested-action"],
                                                 valign: Gtk.Align.CENTER,
                                            });
        row.add_suffix(close_button);
        row.activatable_widget = close_button;
        close_button.connect("clicked", () => { this._caller._close_request(this._caller._window); });

        return row;
    } // _close_row() //

} // class AboutPage extends Adw.PreferencesPage //


class NotesPreferencesSettings extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.area_token_box = null;
        this.position_input = null;
        this.show_messages  = null;

        this.group = Adw.PreferencesGroup.new();
        this.group.set_title(_title);
        this.group.set_name(_name);
        this.add(this.group);
        this.group.add(this._area_token_box());
        this.group.add(this._position_box());
        this.group.add(this._show_messages());
        this.group.add(this._max_note_length());
        this.group.add(this._close_row());
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        this.group.add(hbox);
    } // constructor(caller, _title, _name, _icon_name) //

    _area_token_box(){
        const title = _("Area in the panel");
        const panelAreas = new Gtk.StringList();
        let _areas = ["left", "center", "right"];
        let areas = [_("Left"), _("Center"), _("Right")];
        for (let i = 0; i < areas.length; i++){
            panelAreas.append(areas[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("area"),
            use_subtitle: true, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_enum("area", widget.selected);
        });
        this.area_token_box = row;
        return row;
    } // _area_token_box() //

    _position_box(){
        const title = _("Position");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Position in the area of the panel."));
        const slider = new Gtk.Scale({
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 25, stepIncrement: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            hexpand: true,
            halign: Gtk.Align.END
        });
        slider.set_draw_value(true);
        slider.set_value(this._window._settings.get_int("position"));
        slider.connect('value-changed', (_sw) => { this._window._settings.set_int("position", slider.get_value()); });
        slider.set_size_request(400, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.position_input = slider;
        this.position_input = row;
        return row;
    } // _position_box() //

    _show_messages() {
        // Show Messages
        let showMessagesSpinButton = new Gtk.SpinButton({
          adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 150,
            step_increment: 1,
            page_increment: 1,
            page_size: 0,
            value: this._caller._window._settings.get_int("show-messages"),
          }),
          climb_rate: 1,
          digits: 0,
          numeric: true,
          valign: Gtk.Align.CENTER,
        });
        let showMessagesRow = new Adw.ActionRow({
          title: _("Show Notes"),
          subtitle: _("The number of notes to show in the menu."),
          activatable_widget: showMessagesSpinButton,
        });
        showMessagesRow.add_suffix(showMessagesSpinButton);
        this.show_messages  = showMessagesRow;
        return showMessagesRow;
    } // _show_messages() //

    _max_note_length(){
        // Max length of a note in chars //
        const maxNoteLengthSpinButton = new Gtk.SpinButton({
          adjustment: new Gtk.Adjustment({
            lower: 100,
            upper: 255,
            step_increment: 1,
            page_increment: 1,
            page_size: 0,
            value: this._caller._window._settings.get_int("max-note-length"),
          }),
          climb_rate: 1,
          digits: 0,
          numeric: true,
          valign: Gtk.Align.CENTER,
        });
        const maxNoteLengthRow = new Adw.ActionRow({
          title: _("Maximum length of a Note."),
          subtitle: _("The maximum length allowed for a note"),
          activatable_widget: maxNoteLengthSpinButton,
        });
        maxNoteLengthRow.add_suffix(maxNoteLengthSpinButton);
        this.max_note_length  = maxNoteLengthRow;
        return maxNoteLengthRow;
    }

    destroy(){
        this.area_token_box  = null;
        this.position_input  = null;
        this.show_messages   = null;
        this.max_note_length = null;
    } // destroy() //
    
} // class NotesPreferencesSettings extends Adw.PreferencesPage //

class NotesScroller extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.controlsGroup = Adw.PreferencesGroup.new();
        this._addButton = new Adw.ButtonRow({
            title: _("Insert Note..."), 
        });
        this._addButton.connect('activated', () => { this._caller.editNote(-1); });
        this.controlsGroup.add(this._addButton);
        this.notesGroup    = Adw.PreferencesGroup.new();
        this.notesGroup.set_title(_title);
        this.notesGroup.set_name(_name);
        this.add(this.notesGroup);
        let _index = -1;
        for(const note of this._caller.notes){
            _index++;
            const button = new Gtk.Button({
                                label: ">...",
                                css_classes: ['note_label'],
                                hexpand: false,
                                vexpand: false,
                                valign: Gtk.Align.END,
            });
            button.connect("clicked", () => { this._caller.editNote(_index); });
            const row = new Adw.ActionRow({
                                title: note, 
                                activatable_widget: button, 
                                title_lines: this._caller.max_note_length, 
            });
            this.notesGroup.add(row);
        } // for(const note of this._caller.notes) //
        this.add(this.notesGroup);
    } // constructor(caller, _title, _name, _icon_name) //
    
    refresh(){
        let child = this.notesGroup.get_first_child();
        while(child){
            this.notesGroup.remove(child);
            child = this.notesGroup.get_first_child();
        }
        let _index = -1;
        for(const note of this._caller.notes){
            _index++;
            const button = new Gtk.Button({
                                label: ">...",
                                css_classes: ['note_label'],
                                hexpand: false,
                                vexpand: false,
                                valign: Gtk.Align.END,
            });
            button.connect("clicked", () => { this._caller.editNote(_index); });
            const row = new Adw.ActionRow({
                                title: note, 
                                activatable_widget: button, 
                                title_lines: this._caller.max_note_length, 
            });
            this.notesGroup.add(row);
        } // for(const note of this._caller.notes) //
    } // refresh() //

} // class NotesScroller extends PageBase //

class EditNote extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.index = this._caller._window._settings.get_int("index");
        this.note         = null;
        this.calling_page = null;
        if(0 <= this.index && this.index < this._caller.notes.length){
            this.note = this._caller.notes[this.index];
        }
        this.group          = Adw.PreferencesGroup.new();
        this.edit           = Adw.EntryRow.new({ 
                                title:      _("Add text"), 
                                max_length: this._caller.max_note_length, 
                                text:       (this.note ? this.note : ''), 
        });
        this.button_box     = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: false, hexpand: true, });
        this.cancel_button  = new Gtk.Button({
                                                label:        _("Cancel"),
                                                 css_classes: ["cancel-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.cancel_button.connect("clicked", () => { this.cancel_edit(); });
        this.restart_button = new Gtk.Button({
                                                label:        _("Restart"),
                                                 css_classes: ["restart-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.restart_button.connect("clicked", () => { this.restart(); });
        this.delete_button = new Gtk.Button({
                                                label:        _("delete"),
                                                 css_classes: ["delete-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.delete_button.connect("clicked", () => { this.delete_note(); });
        let save_lable = _("Save");
        let save_exit_lable = _("Save & Exit");
        if(this.index < 0 || this._caller.notes.length <= this.index){
            save_lable = _("Insert");
            save_exit_lable = _("Insert & Exit");
        }
        this.save_button    = new Gtk.Button({
                                                label:        save_lable,
                                                 css_classes: ["save-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.save_button.connect("clicked", () => { this.save(false); });
        this.save_exit     = new Gtk.Button({
                                                label:        save_exit_lable,
                                                 css_classes: ["save-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.save_exit.connect("clicked", () => { this.save_exit(); });
        this.button_box.prepend(this.cancel_button);
        this.button_box.append(this.restart_button);
        this.button_box.append(this.delete_button);
        this.button_box.append(this.save_button);
        this.group.add(this.button_box);
    } // constructor(caller, _title, _name, _icon_name) //

    get_text(){
        return this.edit.get_text();
    }

    set_text(_text){
        this.edit.set_text(_text);
    }

    get_index(){
        return this.index;
    }

    set_index(_index){
        this.index = _index;
    }

    get_calling_page(){
        return this.calling_page;
    }

    set_calling_page(page){
        if(page instanceof Adw.PreferencesPage){
            this.calling_page = page;
        }
    }

    cancel_edit(){
        this.note = null;
        this.edit.set_text('');
        if(0 <= this.index && this.index < this._caller.notes.length){
            this.index = -1;
        }
        if(this._caller.edit_note){
            this._caller.edit_note = false;
            this._caller._window._settings.set_boolean(false);
            this._caller._close_request(this._caller._window);
        }else if(this.calling_page){ // if(this._caller.edit_note) //
            this._caller._window.set_visible_page(this.calling_page);
        }
    } // cancel_edit() //

    restart(){
        this.index = this._caller._window._settings.get_int("index");
        this.note         = null;
        if(0 <= this.index && this.index < this._caller.notes.length){
            this.note = this._caller.notes[this.index];
            this.set_text(this.note);
        }
    } // restart() //

    delete_note(){
        if(0 <= this.index && this.index < this._caller.notes.length){
            this._caller.notes.splice(this.index, 1);
            this._caller._settings.set_strv("notes", this._caller.notes);
            this.note = null;
            this.edit.set_text('');
            this.index = -1;
        }
        if(this._caller.edit_note){
            this._caller.edit_note = false;
            this._caller._window._settings.set_boolean(false);
            if(this.calling_page){
                this._caller._NotesScroller.refresh();
                this._caller._window.set_visible_page(this.calling_page);
            }else{
                this._caller._close_request(this._caller._window);
            }
        }else if(this.calling_page){ // if(this._caller.edit_note) //
            this._caller._NotesScroller.refresh();
            this._caller._window.set_visible_page(this.calling_page);
        }
    } // delete_note() //

    save(_exit){
        this.note = this.get_text();
        if(0 <= this.index && this.index < this._caller.notes.length){
            if(this.note && this.note.trim() != ''){
                this._caller.notes[this.index] = this.note;
                this._caller._settings.set_strv("notes", this._caller.notes);
            }
            if(this._caller.edit_note){
                this._caller.edit_note = false;
                this._caller._window._settings.set_boolean(false);
                if(_exit){
                    this._caller._close_request(this._caller._window);
                }else if(this.calling_page){
                    this._caller._NotesScroller.refresh();
                    this._caller._window.set_visible_page(this.calling_page);
                }else{
                    this._caller._NotesScroller.refresh();
                }
            }else if(this.calling_page){ // if(this._caller.edit_note) //
                if(_exit){
                    this._caller._close_request(this._caller._window);
                }else{
                    this._caller._NotesScroller.refresh();
                    this._caller._window.set_visible_page(this.calling_page);
                }
            }else if(_exit){
                this._caller._close_request(this._caller._window);
            }
        }else{ //if(0 <= this.index && this.index < this._caller.notes.length) //
            if(this.note && this.note.trim() != ''){
                this._caller.notes.unshift(this.note);
                this.index = 0;
                this._caller._settings.set_strv("notes", this._caller.notes);
                this._caller._settings.set_int("index", this.index);
            }
            if(this._caller.edit_note){
                this._caller.edit_note = false;
                this._caller._window._settings.set_boolean(false);
                if(_exit) this._caller._close_request(this._caller._window);
            }else if(this.calling_page){ // if(this._caller.edit_note) //
                this._caller._NotesScroller.refresh();
                this._caller._window.set_visible_page(this.calling_page);
            }else if(_exit){
                this._caller._close_request(this._caller._window);
            }else{
                this._caller._NotesScroller.refresh();
            }
        } // if(0 <= this.index && this.index < this._caller.notes.length) ... else ... //
    } // save(_exit) //

    save_exit(){
        this.save(true);
    } // save_exit() //

} // class EditNote extends PageBase //

class CreditsPage extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
    } // constructor(caller, _title, _name, _icon_name) //

} // class CreditsPage extends PageBase //

export default class MyPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        this._pageNotesPreferencesSettings = null;
        this._NotesScroller                = null;
        this._EditNote                     = null;
        this.aboutPage                     = null;
        this.creditsPage                   = null;
        this.page                          = this._pageNotesPreferencesSettings;
    } //  constructor(metadata) //

    fillPreferencesWindow(window) {
        this._window = window;

        window._settings       = this.getSettings();
        if(this._window._settings.get_int("position") < 0 || this._window._settings.get_int("position") > 25){ 
            this._window._settings.set_int("position", 0);
        }
        this.show_messages     = this._window._settings.get_int("show-messages");
        this.window_width      = this._window._settings.get_int("window-width");
        this.window_height     = this._window._settings.get_int("window-height");
        this.page_name         = this._window._settings.get_enum("page");
        this.index             = this._window._settings.get_int("index");
        this.notes             = this._window._settings.get_strv("notes");
        this.max_note_length   = this._window._settings.get_int("max-note-length");
        this.edit_note         = this._window._settings.get_boolean("edit-note");

        this._pageNotesPreferencesSettings = NotesPreferencesSettings.new(this, _('Settings'), _("settings"), 'preferences-system-symbolic');
        this._NotesScroller                = NotesScroller.new(this, _("Notes"), _("notes"), 'notes-app');
        this._EditNote                     = EditNote.new(this, _("Edit note"), _("editNotes"), 'notes-app');
        this.aboutPage                     = AboutPage.new(this, this.metadata);
        this.creditsPage                   = CreditsPage.new(this, _("Edit note"), _("editNotes"), 'notes-app');
        window.connect("close-request", (_win) => {
            const width  = window.default_width;
            const height = window.default_height;
            if(width !== this.window_width && height !== this.window_height){
                this._window._settings.set_int("window-width",  width);
                this._window._settings.set_int("window-height", height);
            } // if(width !== this.properties_width && height !== this.properties_height) //
            this._pageNotesPreferencesSettings = null;
            this._NotesScroller                = null;
            this._EditNote                     = null;
            this.aboutPage                     = null;
            this.creditsPage                   = null;
            window.destroy();
        });
        window.add(this._pageNotesPreferencesSettings);
        window.add(this._NotesScroller);
        window.add(this._EditNote);
        window.add(this.aboutPage);
        window.add(this.creditsPage);
        window.set_default_size(this.window_width, this.window_height);
        switch(this.page_name){
            case("settings"):
                this.page = this._pageNotesPreferencesSettings;
                window.set_visible_page(this.page);
                break;
            case("notesScroller"):
                this.page = this._NotesScroller;
                window.set_visible_page(this.page);
                break;
            case("editNote"):
                this.page = this._EditNote;
                this.editNote(this.index);
                break;
            case("aboutPage"):
                this.page = this.aboutPage;
                window.set_visible_page(this.page);
                break;
            case("credits"):
                this.page = this.creditsPage;
                window.set_visible_page(this.page);
                break;
            default:
                this.page = this._pageNotesPreferencesSettings;
                window.set_visible_page(this.page);
        }  // switch(this.page_name) //
        this.settingsID_area  = this._window._settings.connect("changed::page", this.onPageChanged.bind(this));

    } // fillPreferencesWindow(window) //

    editNote(_index){
        this.page = this._EditNote;
        this._EditNote.set_index(_index);
        window.set_visible_page(this.page);
    } // editNote(_index) //

    _close_request(_win){
        this._window.close();
        return false;
    } // _close_request(_win) //

    onPageChanged(){
        this.page_name         = this._window._settings.get_enum("page");
        switch(this.page_name){
            case("settings"):
                this.page = this._pageNotesPreferencesSettings;
                window.set_visible_page(this.page);
                break;
            case("notesScroller"):
                this.page = this._NotesScroller;
                window.set_visible_page(this.page);
                break;
            case("editNote"):
                this.page = this._EditNote;
                this.editNote(this.index);
                break;
            case("aboutPage"):
                this.page = this.aboutPage;
                window.set_visible_page(this.page);
                break;
            case("credits"):
                this.page = this.creditsPage;
                window.set_visible_page(this.page);
                break;
            default:
                this.page = this._pageNotesPreferencesSettings;
                window.set_visible_page(this.page);
        }  // switch(this.page_name) //
    }

}

