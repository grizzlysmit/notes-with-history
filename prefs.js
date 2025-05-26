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
"use strict";

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';
import * as Constants from './icon_constants.js';

import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';

class PageBase extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, title_, name_, icon_name_) {
        super({
            title: title_,
        });
        this._caller = caller;
        this.set_name(name_);
        if(icon_name_){
            this.set_icon_name(icon_name_);
        }
        this._title = title_;
        this._name  = name_;
        this._icon_name = icon_name_;
    } // constructor(caller, _title, _name, _icon_name) //

    _close_button(){
        const close_button = new Gtk.Button({
            label: _("Exit Settings"),
             css_classes: ["suggested-action"],
             valign: Gtk.Align.CENTER,
        });
        close_button.connect("clicked", () => { this._caller._close_request(this._caller._window); });
        return close_button;
    } // _close_button() //

    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        const close_button = this._close_button();
        row.add_suffix(close_button);
        row.activatable_widget = close_button;

        return row;
    } // _close_row() //

} // class PageBase extends Adw.PreferencesPage //

// Icon Stuff //

Gio._promisify(Gtk.FileDialog.prototype, "open", "open_finish");
const IconGrid = GObject.registerClass(class LogoMenuIconGrid extends Gtk.FlowBox {
    _init() {
        super._init({
            row_spacing: 10,
            column_spacing: 10,
            vexpand: false,
            hexpand: true,
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
            homogeneous: true,
            selection_mode: Gtk.SelectionMode.SINGLE,
            margin_top: 5,
        });
        this.childrenCount = 0;
    }

    add(widget) {
        this.insert(widget, -1);
        this.childrenCount++;
    }
});

class NotesIconsPage extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, title_, name_, icon_name_) {
        super(caller, title_, name_, icon_name_);
        this._settings = this._caller._window._settings;
        this.set_title(this._title);
        this.set_name(this._name);
        this.set_icon_name(this._icon_name);

        const monochromeIconGroup = new Adw.PreferencesGroup({
            title: _('Monochrome Icons'),
        });

        const colouredIconGroup = new Adw.PreferencesGroup({
            title: _('Coloured Icons'),
        });

        const iconSettingsGroup = new Adw.PreferencesGroup({
            title: _('Icon Settings'),
        });

        // Monochrome Icons

        const monochromeIconsRow = new Adw.ActionRow();

        const monochromeIconsFlowBox = new IconGrid();
        monochromeIconsFlowBox.connect('child-activated', () => {
            const selectedChild = monochromeIconsFlowBox.get_selected_children();
            const selectedChildIndex = selectedChild[0].get_index();
            this._settings.set_boolean('monochrome-icon', true);
            this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            this._settings.set_boolean('use-custom-icon', false);
        });
        Constants.MonochromeNoteIcons.forEach(icon => {
            let iconName = icon.PATH.replace('/Resources/', '');
            iconName = iconName.replace('.svg', '');
            const iconImage = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 36,
            });
            monochromeIconsFlowBox.add(iconImage);
        });

        monochromeIconsRow.set_child(monochromeIconsFlowBox);

        if (this._settings.get_boolean('monochrome-icon')) {
            const monochromeChildren = monochromeIconsFlowBox.childrenCount;
            for (let i = 0; i < monochromeChildren; i++) {
                if (i === this._settings.get_int('menu-button-icon-image')) {
                    monochromeIconsFlowBox.select_child(monochromeIconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
        }

        // Coloured Icons

        const colouredIconsRow = new Adw.ActionRow();

        const colouredIconsFlowBox = new IconGrid();
        colouredIconsFlowBox.connect('child-activated', () => {
            const selectedChild = colouredIconsFlowBox.get_selected_children();
            const selectedChildIndex = selectedChild[0].get_index();
            this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            this._settings.set_boolean('monochrome-icon', false);
            this._settings.set_boolean('use-custom-icon', false);
        });
        Constants.ColouredNoteIcons.forEach(icon => {
            let iconName = icon.PATH.replace('/Resources/', '');
            iconName = iconName.replace('.svg', '');
            const iconImage = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 36,
            });
            colouredIconsFlowBox.add(iconImage);
        });

        colouredIconsRow.set_child(colouredIconsFlowBox);

        if (!this._settings.get_boolean('monochrome-icon')) {
            const children = colouredIconsFlowBox.childrenCount;
            for (let i = 0; i < children; i++) {
                if (i === this._settings.get_int('menu-button-icon-image')) {
                    colouredIconsFlowBox.select_child(colouredIconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
        }

        // Icon Size Scale

        const menuButtonIconSizeRow = new Adw.ActionRow({
            title: _('Icon Size'),
        });

        const iconSize = this._settings.get_int('menu-button-icon-size');

        const menuButtonIconSizeScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 14,
                upper: 64,
                step_increment: 1,
                page_increment: 1,
                page_size: 0,
            }),
            digits: 0,
            round_digits: 0,
            hexpand: true,
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
        });

        menuButtonIconSizeScale.set_format_value_func((scale, value) => {
            return `\t${value}px`;
        });

        menuButtonIconSizeScale.set_value(iconSize);
        menuButtonIconSizeScale.connect('value-changed', () => {
            this._settings.set_int('menu-button-icon-size', menuButtonIconSizeScale.get_value());
        });

        menuButtonIconSizeRow.add_suffix(menuButtonIconSizeScale);

         // Icon Shadow Visibility //
        const iconShadowVisibilityRow = new Adw.ActionRow({
            title: _('Hide Icon Shadow'),
        });

        const iconShadowRowVisiblitySwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('hide-icon-shadow'),
        });

        iconShadowRowVisiblitySwitch.connect('notify::active', widget => {
            this._settings.set_boolean('hide-icon-shadow', widget.get_active());
        });

        iconShadowVisibilityRow.add_suffix(iconShadowRowVisiblitySwitch);

        // Custom Icon //

        const customIconRow = new Adw.ExpanderRow({
            title: _('Use Custom Icon'),
            show_enable_switch: true,
            enable_expansion: this._settings.get_boolean('use-custom-icon'),
        });

        customIconRow.connect('notify::enable-expansion', () => {
            this._settings.set_boolean('use-custom-icon', customIconRow.enable_expansion);
            this._caller.log_message(
                'notes',
                `NotesIconsPage::notify::enable-expansion: customIconRow.enable_expansion == ${customIconRow.enable_expansion}`,
                new Error()
            );
        });

        this._settings.connect('changed::use-custom-icon', () => {
            const useCustomIcon = this._settings.get_boolean('use-custom-icon');
            customIconRow.set_enable_expansion(useCustomIcon)
            this._caller.log_message(
                'notes', `NotesIconsPage::changed::use-custom-icon: useCustomIcon == ${useCustomIcon}`, new Error()
            );
        });

        const customIconSelectionRow = new Adw.ActionRow({
            title: _('Selected Icon'),
        });

        const customIconButton = new Gtk.Button({
            icon_name: 'document-open-symbolic',
            valign: Gtk.Align.CENTER,
        });

        this._caller.log_message(
            'notes', `NotesIconsPage::constructor: customIconButton == ${customIconButton}`, new Error()
        );

        const customIconPreview = new Gtk.Image({
            icon_name: "start-here-symbolic",
            icon_size: Gtk.IconSize.LARGE,
        });

        this._caller.log_message(
            'notes', `NotesIconsPage::constructor: customIconPreview == ${customIconPreview}`, new Error()
        );

        if(this._settings.get_string('custom-icon-path')){
            const custpath = this._settings.get_string('custom-icon-path');
            customIconPreview.set_from_file(custpath);

            this._caller.log_message('notes', `NotesIconsPage::constructor: custpath == ${custpath}`, new Error());
        }

        customIconButton.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "Images",
                });
                this._caller.log_message(
                    'notes', `NotesIconsPage::clicked: filter == ${filter}`, new Error()
                );

                filter.add_pixbuf_formats();
                this._caller.log_message(
                    'notes', `NotesIconsPage::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a Custom Icon'),
                    modal: true,
                    default_filter: filter
                });
                this._caller.log_message( 'notes', `NotesIconsPage::clicked: fileDialog == ${fileDialog}`, new Error());

                const file = await fileDialog.open(customIconButton.get_root(), null);
                this._caller.log_message( 'notes', `NotesIconsPage::clicked: file == ${file}`, new Error());
                if (file) {
                    const filename = file.get_path();
                    this._settings.set_string("custom-icon-path", filename);
                    customIconPreview.set_from_file(filename);
                    this._caller.log_message( 'notes', `NotesIconsPage::clicked: filename == ${filename}`, new Error());
                }
            } catch (error) {
                this._caller.log_message( 'notes', `NotesIconsPage::clicked: file == ${error}`, error);
                console.error('notes::Error selecting custom icon:', error.message);
            }
        });

        customIconSelectionRow.add_suffix(customIconPreview);
        customIconSelectionRow.add_suffix(customIconButton);
        customIconRow.add_row(customIconSelectionRow);

        // iconGroup
        monochromeIconGroup.add(monochromeIconsRow);
        colouredIconGroup.add(colouredIconsRow);
        iconSettingsGroup.add(customIconRow);
        iconSettingsGroup.add(menuButtonIconSizeRow);
        iconSettingsGroup.add(iconShadowVisibilityRow);
        iconSettingsGroup.add(this._close_row());

        this.add(monochromeIconGroup);
        this.add(colouredIconGroup);
        this.add(iconSettingsGroup);
    }
} // class NotesIconsPage extends PageBase //

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
        
        const PROJECT_TITLE = _('Sticky notes in a menu.');
        const PROJECT_DESCRIPTION = _('A cross between sticky notes and a menu full of notes 🤠.');

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
            title: _('Notes with history Version'),
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

        const githubRow = this._createLinkRow(_('Notes with history Github'), metadata.url);
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
        this.area_token_box         = null;
        this.position_input         = null;
        this.show_messages          = null;
        this._max_note_length       = null;
        this._show_logs_switch_row  = null;
        this._icon_size             = null;

        this.group = new Adw.PreferencesGroup();
        this.group.set_title(_title);
        this.group.set_name(_name);
        this.add(this.group);
        this.group.add(this._area_token_box());
        this.group.add(this._position_box());
        this.group.add(this._show_messages());
        this.group.add(this._max_note_length_box());
        this.group.add(this._double_click_time_box());
        this.group.add(this._show_logs_box());
        this.group.add(this._icon_size_box());
        this.group.add(this._close_row());
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        this.group.add(hbox);
    } // constructor(caller, _title, _name, _icon_name) //

    _area_token_box(){
        const title = _("Area in the panel");
        const panelAreas = new Gtk.StringList();
        let areas = [_("Left"), _("Center"), _("Right")];
        for (let i = 0; i < areas.length; i++){
            panelAreas.append(areas[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("area"),
            use_subtitle: false, 
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
        slider.set_value(this._caller._window._settings.get_int("position"));
        slider.connect('value-changed', (_sw) => { this._caller._window._settings.set_int("position", slider.get_value()); });
        slider.set_size_request(400, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.position_input = row;
        return row;
    } // _position_box() //

    _double_click_time_box(){
        const title = _("Double Click Time");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Double click time for mouse clicks in milli seconds."));
        const slider = new Gtk.Scale({
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 400, upper: 2000, stepIncrement: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            hexpand: true,
            halign: Gtk.Align.END
        });
        slider.set_draw_value(true);
        slider.set_value(this._caller._window._settings.get_int("double-click-time"));
        slider.connect('value-changed', (_sw) => { this._caller._window._settings.set_int("double-click-time", slider.get_value()); });
        slider.set_size_request(320, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.double_click_time_input = row;
        return row;
    } // _double_click_time_box() //

    _show_messages() {
        // Show Messages
        const showMessagesRow = new Adw.SpinRow({
                    title:              _("Show Notes"),
                    adjustment:         new Gtk.Adjustment({
                        value:          this._caller._window._settings.get_int('show-messages'),
                        lower:          10,
                        upper:          150,
                        step_increment: 1,
                        page_increment: 10,
                    }),
        });
        showMessagesRow.set_numeric(true);
        showMessagesRow.set_update_policy(Gtk.UPDATE_IF_VALID);
        this._caller._window._settings.bind('show-messages', showMessagesRow,
            'value', Gio.SettingsBindFlags.DEFAULT
        );
        this.show_messages  = showMessagesRow;
        return showMessagesRow;
    } // _show_messages() //

    _max_note_length_box(){
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
        maxNoteLengthSpinButton.connect('notify::value', widget => {
            this._caller._window._settings.set_int('max-note-length', widget.get_value());
        });
        const maxNoteLengthRow = new Adw.ActionRow({
          title: _("Maximum length of a Note."),
          subtitle: _("The maximum length allowed for a note"),
          activatable_widget: maxNoteLengthSpinButton,
        });
        maxNoteLengthRow.add_suffix(maxNoteLengthSpinButton);
        this._max_note_length  = maxNoteLengthRow;
        return maxNoteLengthRow;
    } // _max_note_length_box() //

    _show_logs_box(){
        // Show logs for debugging //
        const show_logs_switch_row = new Adw.SwitchRow({
            title: _("Show logs for debugging."),
            subtitle: _("Turn on the logging for this plugin if you don't know what this is the leave it off."),
            active: this._caller._window._settings.get_boolean('show-logs'), 
        });
        this.show_logs_switch = show_logs_switch_row.activatable_widget;
        this.show_logs_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("show-logs", state);
        });
        this._show_logs_switch_row  = show_logs_switch_row;
        return show_logs_switch_row;
    } // _show_logs_box() //

    _icon_size_box(){
        // Max length of a note in chars //
        const iconSizeSpinButton = new Gtk.SpinButton({
          adjustment: new Gtk.Adjustment({
            lower: 16,
            upper: 256,
            step_increment: 1,
            page_increment: 1,
            page_size: 0,
            value: this._caller._window._settings.get_int("icon-size"),
          }),
          climb_rate: 1,
          digits: 0,
          numeric: true,
          valign: Gtk.Align.CENTER,
        });
        iconSizeSpinButton.connect('notify::value', widget => {
            this._caller._window._settings.set_int('icon-size', widget.get_value());
        });
        const iconSizeRow = new Adw.ActionRow({
          title: _("Size of Icons."),
          subtitle: _("The Size of the icons in the dialogs"),
          activatable_widget: iconSizeSpinButton,
        });
        iconSizeRow.add_suffix(iconSizeSpinButton);
        this._icon_size  = iconSizeRow;
        return iconSizeRow;
    } // _icon_size_box() //

    destroy(){
        this.area_token_box        = null;
        this.position_input        = null;
        this.show_messages         = null;
        this.max_note_length       = null;
        this._show_logs_switch_row = null;
        this._max_note_length      = null;
        this._icon_size            = null;
        super.destroy();
    } // destroy() //
    
} // class NotesPreferencesSettings extends PageBase //

class FileDisplay extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);

        this.time_type_box                    = null;
        this._display_inode_switch_row        = null;
        this.user_group_box                   = null;
        this._display_mode_switch_row         = null;
        this._display_number_links_switch_row = null;
        this._display_size_switch_row         = null;
        this._base2_file_sizes_switch_row     = null;
        this.filter_box                       = null;

        this.group = new Adw.PreferencesGroup();

        this.group.add(this._time_type_box());
        this.group.add(this._display_inode_box());
        this.group.add(this._user_group_box());
        this.group.add(this._display_mode_box());
        this.group.add(this._display_number_links_box());
        this.group.add(this._display_size_box());
        this.group.add(this._base2_file_sizes_box());
        this.group.add(this._filter());
        this.group.add(this._close_row());
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        this.group.add(hbox);

        this.add(this.group);
    } // constructor(caller, _title, _name, _icon_name) //

    _time_type_box(){
        const title = _("Diplay these time types");
        const panelAreas = new Gtk.StringList();
        const time_type = [
            _("None"), _("Create"), _("Modify"),
            _("Crete+Modify"), _("Access"),
            _("Create+Access"), _("Modify+Access"),
            _("Create+Modify+Access")
        ];
        for (let i = 0; i < time_type.length; i++){
            panelAreas.append(time_type[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("time-type"),
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_enum("time-type", widget.selected);
        });
        this.time_type_box = row;
        return row;
    } // _time_type_box() //

    _display_inode_box(){
        // Display Inode //
        const display_inode_switch_row = new Adw.SwitchRow({
            title: _("Display Inode."),
            subtitle: _("Diplay the Inode number."),
            active: this._caller._window._settings.get_boolean('display-inode'), 
        });
        this.display_inode_switch = display_inode_switch_row.activatable_widget;
        this.display_inode_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-inode", state);
        });
        this._display_inode_switch_row  = display_inode_switch_row;
        return display_inode_switch_row;
    } // _display_inode_box() //

    _user_group_box(){
        const title = _("Diplay User and or Group");
        const panelAreas = new Gtk.StringList();
        const user_group = [ _("No-User-Group"), _("User"), _("Group"), _("User+Group"), ];
        for (let i = 0; i < user_group.length; i++){
            panelAreas.append(user_group[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("user-group"),
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_enum("user-group", widget.selected);
        });
        this.user_group_box = row;
        return row;
    } // _user_group_box() //

    _display_mode_box(){
        // Display mode //
        const display_mode_switch_row = new Adw.SwitchRow({
            title: _("Display Perms."),
            subtitle: _("Diplay the Permissions and File Type."),
            active: this._caller._window._settings.get_boolean('display-mode'), 
        });
        this.display_mode_switch = display_mode_switch_row.activatable_widget;
        this.display_mode_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-mode", state);
        });
        this._display_mode_switch_row  = display_mode_switch_row;
        return display_mode_switch_row;
    } // _display_mode_box() //

    _display_number_links_box(){
        // Display number of links //
        const display_number_links_switch_row = new Adw.SwitchRow({
            title: _("Display number of links."),
            subtitle: _("Diplay the number of hard links."),
            active: this._caller._window._settings.get_boolean('display-number-links'), 
        });
        this.display_number_links_switch = display_number_links_switch_row.activatable_widget;
        this.display_number_links_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-number-links", state);
        });
        this._display_number_links_switch_row  = display_number_links_switch_row;
        return display_number_links_switch_row;
    } // _display_number_links_box() //

    _display_size_box(){
        // Display size //
        const display_size_switch_row = new Adw.SwitchRow({
            title: _("Display File Size."),
            subtitle: _("Diplay the File Size in Terra Bytes, Giga Bytes etc..."),
            active: this._caller._window._settings.get_boolean('display-size'), 
        });
        this.display_size_switch = display_size_switch_row.activatable_widget;
        this.display_size_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-size", state);
        });
        this._display_size_switch_row  = display_size_switch_row;
        return display_size_switch_row;
    } // _display_size_box() //

    _base2_file_sizes_box(){
        // Display file size in base 2 multiples 2¹⁰, 2²⁰, ... //
        const base2_file_sizes_switch_row = new Adw.SwitchRow({
            title: _("Base 2 file sizes."),
            subtitle: _("Show the file sizes in base 2 (i.e. multiples of 2¹⁰, 2²⁰ etc)."),
            active: this._caller._window._settings.get_boolean('base2-file-sizes'), 
        });
        this._base2_file_sizes_switch = base2_file_sizes_switch_row.activatable_widget;
        this._base2_file_sizes_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("base2-file-sizes", state);
        });
        this._base2_file_sizes_switch_row  = base2_file_sizes_switch_row;
        return base2_file_sizes_switch_row;
    } // _base2_file_sizes_box() //

    _filter(){
        const title = _("filter");
        const filters_ = new Gtk.StringList();
        const filters = ["/^.*\\.txt$/i", "/^.*\\.notes$/i", "/^(?:.*\\.txt|.*\\.notes)$/i", "/^.*/i"];
        for (let i = 0; i < filters.length; i++){
            filters_.append(filters[i]);
        }
        const indx = filters.indexOf(this._caller._window._settings.get_string("filter"));
        const row = new Adw.ComboRow({
            title,
            model:        filters_,
            selected:     indx,
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_string("filter", filters[widget.selected]);
        });
        this.filter_box = row;
        return row;
    } // _filter() //

    destroy(){
        this.time_type_box                    = null;
        this._display_inode_switch_row        = null;
        this.user_group_box                   = null;
        this._display_mode_switch_row         = null;
        this._display_number_links_switch_row = null;
        this._display_size_switch_row         = null;
        this._base2_file_sizes_switch_row     = null;
        this.filter_box                       = null;
        super.destroy();
    }

} // class FileDisplay extends PageBase //

class NotesScroller extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.controlsGroup = new Adw.PreferencesGroup();
        /*
        this._addButton = new Adw.ButtonRow({
            title: _("Insert Note..."), 
        });
        // */
        const insbutton = new Gtk.Button({
                                label:      _("Insert Note..."),
                                css_classes: ['add-note-label'],
                                hexpand:     true,
                                vexpand:     false,
                                valign:      Gtk.Align.CENTER,
        });
        insbutton.connect("clicked", () => { this._caller.editNote(this, -1); });
        this.button_box     = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: false, hexpand: true, });
        //this._addButton.connect('activated', () => { this._caller.editNote(-1); });
        this.button_box.prepend(insbutton);
        this.button_box.append(this._close_button());
        this._addButton = new Adw.PreferencesRow({
            title:               _("Insert Note..."), 
        });
        this._addButton.set_child(this.button_box);
        this.controlsGroup.add(this._addButton);
        this.add(this.controlsGroup);

        this.containerGroup    = new Adw.PreferencesGroup();
        this.notesGroup    = new Adw.PreferencesGroup();
        this.notesGroup.set_title(_title);
        this.notesGroup.set_name(_name);
        for(let _index = 0; _index < this._caller.notes.length; _index++){
            const note   = this._caller.notes[_index];
            const button = new Gtk.Button({
                                label: ">...",
                                css_classes: ['note-label'],
                                hexpand: false,
                                vexpand: false,
                                valign: Gtk.Align.END,
            });
            this._caller.log_message('notes', `NotesScroller::constructor: _index == ${_index}`, new Error());
            button.connect("clicked", () => { this._caller.editNote(this, Number(_index)); });
            const row = new Adw.ActionRow({
                                title: note, 
                                activatable_widget: button, 
                                title_lines: this._caller.max_note_length, 
            });
            row.add_suffix(button);
            this.notesGroup.add(row);
        } // for(let _index = 0; _index < this._caller.notes.length; _index++) //
        this.scrolledWindow    = new Gtk.ScrolledWindow({
            name:    'scrolledWindow', 
            hexpand: true, 
            vexpand: true, 
            halign:  Gtk.Align.FILL, 
            valign:  Gtk.Align.FILL, 
        });
        this.scrolledWindow.set_child(this.notesGroup);
        this.containerGroup.add(this.scrolledWindow);
        this.add(this.containerGroup);
        this.size_changed_id = this._caller._window.connect('notify::default-height', () => {
            const height = Math.max(Math.floor((3 * this._caller._window.default_height)/10), this.scrolledWindow.min_content_height);
            this._caller.log_message('notes', `Callback notify::default-height: height == ${height}`, new Error());
            this.scrolledWindow.set_max_content_height(height);
            this.scrolledWindow.height_request = height;
        });
    } // constructor(caller, _title, _name, _icon_name) //
    
    refresh(){
        this.scrolledWindow.set_child(null);
        this.notesGroup    = null;
        this.notesGroup    = new Adw.PreferencesGroup();
        this.notesGroup.set_title(this._title);
        this.notesGroup.set_name(this._name);
        for(let _index = 0; _index < this._caller.notes.length; _index++){
            const note   = this._caller.notes[_index];
            const button = new Gtk.Button({
                                label: ">...",
                                css_classes: ['note_label'],
                                hexpand: false,
                                vexpand: false,
                                valign: Gtk.Align.END,
            });
            button.connect("clicked", () => { this._caller.editNote(this, Number(_index)); });
            const row = new Adw.ActionRow({
                                title: note, 
                                activatable_widget: button, 
                                title_lines: this._caller.max_note_length, 
            });
            row.add_suffix(button);
            this.notesGroup.add(row);
        } // for(let _index = 0; _index < this._caller.notes.length; _index++) //
        this.scrolledWindow.set_child(this.notesGroup);
    } // refresh() //

} // class NotesScroller extends PageBase //

class EditNote extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.index = this._caller._window._settings.get_int("index");
        this.note         = '';
        this.calling_page = null;
        this.group          = new Adw.PreferencesGroup();
        this.insert = false;
        if(this.index < 0){
            this._caller.log_message('notes', `EditNote::constructor: this.index == ${this.index}`, new Error());
            this.note = '';
            this.insert = true;
        }else if(0 <= this.index && this.index < this._caller.notes.length){
            this._caller.log_message('notes', `EditNote::constructor: this.index == ${this.index}`, new Error());
            this._caller.log_message('notes', `EditNote::constructor: this.note == ${this.note}`, new Error());
            this.note = this._caller.notes[this.index];
            this._caller.log_message('notes', `EditNote::constructor: this.note == ${this.note}`, new Error());
            this.insert = false;
        }else{
            this.index = -1;
            this._caller._window._settings.set_int("index", this.index);
            this.insert = true;
            this._caller.log_message('notes', `EditNote::constructor: this.index == ${this.index}`, new Error());
        }
        this.edit           = new Adw.EntryRow({ 
                                title:      _("Add text"), 
                                text:       (this.note ? this.note : ''), 
                                hexpand:     true,
                                hexpand_set: true, 
                                vexpand:     true,
                                vexpand_set: true, 
                                valign:      Gtk.Align.FILL,
                                halign:      Gtk.Align.FILL,
        });
        //this.edit.set_max_length(this._caller._window._settings.get_int('max-note-length'));
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
        this.save_exit_button     = new Gtk.Button({
                                                label:        save_exit_lable,
                                                 css_classes: ["save-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.save_exit_button.connect("clicked", () => { this.save_exit(); });
        this.button_box.prepend(this.cancel_button);
        this.button_box.append(this.restart_button);
        this.button_box.append(this.delete_button);
        this.button_box.append(this.save_button);
        this.button_box.append(this.save_exit_button);
        this.buttonRow = new Adw.PreferencesRow({
                            title: "",
        });
        this.buttonRow.set_child(this.button_box);
        this.group.add(this.buttonRow);
        this.group.add(this.edit);
        this.group.add(this._close_row());
        this.add(this.group);
    } // constructor(caller, _title, _name, _icon_name) //

    refresh_page(calling_page){
        this.index = this._caller._window._settings.get_int("index");
        this.note         = '';
        this.calling_page = calling_page;
        this.insert = false;
        if(this.index < 0){
            this._caller.log_message('notes', `EditNote::constructor: this.index == ${this.index}`, new Error());
            this.note = '';
            this.insert = true;
        }else if(0 <= this.index && this.index < this._caller.notes.length){
            this._caller.log_message('notes', `EditNote::constructor: this.index == ${this.index}`, new Error());
            this._caller.log_message('notes', `EditNote::constructor: this.note == ${this.note}`, new Error());
            this.note = this._caller.notes[this.index];
            this._caller.log_message('notes', `EditNote::constructor: this.note == ${this.note}`, new Error());
            this.insert = false;
        }else{
            this.index = -1;
            this._caller._window._settings.set_int("index", this.index);
            this.insert = true;
            this._caller.log_message('notes', `EditNote::constructor: this.index == ${this.index}`, new Error());
        }
        this.edit.set_text(this.note);
    } // refresh_page(calling_page) //

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
        this._caller._window._settings.set_int("index", _index);
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
        this._caller.log_message('notes', `EditNote::delete_note: this.index: ‷${this.index}‴.`, new Error());
        if(0 <= this.index && this.index < this._caller.notes.length){
            this._caller.log_message('notes', `EditNote::delete_note: this._caller.notes: ‷${this._caller.notes}‴.`, new Error());
            this._caller.notes.splice(this.index, 1);
            this._caller.log_message('notes', `EditNote::delete_note: this._caller.notes: ‷${this._caller.notes}‴.`, new Error());
            this._caller._window._settings.set_strv("notes", this._caller.notes);
            this.note = null;
            this.edit.set_text('');
            this.index = -1;
            this._caller._window._settings.set_int('index', this.index);
        }
        if(this._caller.edit_note){
            this._caller.edit_note = false;
            this._caller._window._settings.set_boolean('edit-note', false);
            if(this.calling_page){
                this._caller._NotesScroller.refresh();
                this._caller._window.set_visible_page(this.calling_page);
            }else{
                this._caller._window._close_request(this._caller._window);
            }
        }else if(this.calling_page){ // if(this._caller.edit_note) //
            this._caller._NotesScroller.refresh();
            this._caller._window.set_visible_page(this.calling_page);
        }
    } // delete_note() //

    save(_exit){
        this.note = this.get_text();
        this._caller.log_message('notes', `EditNote::save: _exit: ‷${_exit}‴.`, new Error());
        this._caller.log_message('notes', `EditNote::save: this.note: ‷${this.note}‴.`, new Error());
        this._caller.log_message('notes', `EditNote::save: this.index: ‷${this.index}‴.`, new Error());
        if(0 <= this.index && this.index < this._caller.notes.length){
            if(this.note && this.note.trim() != ''){
                this._caller.notes[this.index] = this.note;
                this._caller._window._settings.set_strv("notes", this._caller.notes);
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
            this._caller.log_message('notes', `EditNote::save: this.note: ‷${this.note}‴.`, new Error());
            this._caller.log_message('notes', `EditNote::save: this.index: ‷${this.index}‴.`, new Error());
            if(this.note && this.note.trim() != ''){
                this._caller.notes.unshift(this.note);
                this._caller.log_message('notes', `EditNote::save: this._caller.notes: ‷${this._caller.notes}‴.`, new Error());
                this.index = 0;
                this._caller._window._settings.set_strv("notes", this._caller.notes);
                this._caller._window._settings.set_int("index", this.index);
            }
            if(this._caller.edit_note){
                this._caller.edit_note = false;
                this._caller._window._settings.set_boolean('edit-note', false);
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
        const group_credits = new Adw.PreferencesGroup();
        group_credits.set_title('Authors');
        group_credits.set_name('notes_Credits');
        let title    = null;
        title = _("Copyright") + ": ©2022, ©2023 &amp; ©2024 Francis Grizzly Smit:";
        const cr_row = new Adw.ActionRow({ title });
        const licence = new Gtk.LinkButton({uri: "https://www.gnu.org/licenses/gpl-2.0.en.html", label: "Licence GPL v2+" });
        licence.set_use_underline(true);
        licence.set_halign(Gtk.Align.START);
        cr_row.add_suffix(licence);
        cr_row.activatable_widget = licence;
        group_credits.add(cr_row);
        this.add(group_credits);
        title = _("Author") + ": Francis Grizzly Smit©";
        const row_auth = new Adw.ActionRow({ title });
        const link_auth = new Gtk.LinkButton({uri: "https://github.com/grizzlysmit", label: "https://github.com/grizzlysmit" });
        link_auth.set_use_underline(true);
        link_auth.set_halign(Gtk.Align.START);
        row_auth.add_suffix(link_auth);
        row_auth.activatable_widget = link_auth;
        group_credits.add(row_auth);
        group_credits.add(this._close_row());
        this.add(group_credits);
    } // constructor(caller, _title, _name, _icon_name) //

} // class CreditsPage extends PageBase //

export default class NotesPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        this._pageNotesPreferencesSettings = null;
        this._fileDisplay                  = null;
        this._notesIconsPage               = null;
        this._NotesScroller                = null;
        this._EditNote                     = null;
        this.aboutPage                     = null;
        this.creditsPage                   = null;
        this.page                          = this._pageNotesPreferencesSettings;
        this.enum2string = [
            "settings",
            "fileDisplay",
            "notesIconsPage",
            "notesScroller",
            "editNote",
            "aboutPage",
            "credits",
        ];
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
        this.page_name         = this.enum2string[this._window._settings.get_enum("page")];
        this.index             = this._window._settings.get_int("index");
        this.notes             = this._window._settings.get_strv("notes");
        this.max_note_length   = this._window._settings.get_int("max-note-length");
        this.edit_note         = this._window._settings.get_boolean("edit-note");

        this._pageNotesPreferencesSettings = new NotesPreferencesSettings(this, _('Settings'), "settings", 'preferences-system-symbolic');
        this._fileDisplay                  = new FileDisplay(this, _('File Display Settings'), "fileDisplay", 'preferences-system-symbolic');
        this._notesIconsPage               = new NotesIconsPage(this, _('Icon'), 'Icon', 'emblem-photos-symbolic');
        this._NotesScroller                = new NotesScroller(this, _("Notes"), "notes", 'notes-app');
        this._EditNote                     = new EditNote(this, _("Edit note"), "editNotes", 'notes-app');
        this.aboutPage                     = new AboutPage(this, this.metadata);
        this.creditsPage                   = new CreditsPage(this, _("Credits"), "credits", 'copyright-symbolic');
        window.connect("close-request", (_win) => {
            const width  = window.default_width;
            const height = window.default_height;
            if(width !== this.window_width && height !== this.window_height){
                this._window._settings.set_int("window-width",  width);
                this._window._settings.set_int("window-height", height);
            } // if(width !== this.properties_width && height !== this.properties_height) //
            this._pageNotesPreferencesSettings = null;
            this._fileDisplay                  = null;
            this._notesIconsPage               = null;
            this._NotesScroller                = null;
            this._EditNote                     = null;
            this.aboutPage                     = null;
            this.creditsPage                   = null;
            window.destroy();
        });
        window.add(this._pageNotesPreferencesSettings);
        window.add(this._fileDisplay);
        window.add(this._notesIconsPage);
        window.add(this._NotesScroller);
        window.add(this._EditNote);
        window.add(this.aboutPage);
        window.add(this.creditsPage);
        window.set_default_size(this.window_width, this.window_height);
        if(this.edit_note){
            this.edit_note = false;
            this._window._settings.set_boolean('edit-note', false);
            switch(this.page_name){
                case("settings"):
                    this.page = this._pageNotesPreferencesSettings;
                    this._window.set_visible_page(this.page);
                    break;
                case("fileDisplay"):
                    this.page = this._fileDisplay;
                    this._window.set_visible_page(this.page);
                    break;
                case("notesIconsPage"):
                    this.page = this._notesIconsPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("notesScroller"):
                    this.page = this._NotesScroller;
                    this._window.set_visible_page(this.page);
                    break;
                case("editNote"):
                    this.page = this._EditNote;
                    this.editNote(this.index);
                    break;
                case("aboutPage"):
                    this.page = this.aboutPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("credits"):
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    break;
                default:
                    this.page = this._pageNotesPreferencesSettings;
                    this._window.set_visible_page(this.page);
            }  // switch(this.page_name) //
        } // if(this.edit_note) //
        this.settingsID_page       = this._window._settings.connect("changed::page", this.onPageChanged.bind(this));
        this.settingsID_edit_note  = this._window._settings.connect("changed::edit-note", () => {
            this.edit_note         = this._window._settings.get_boolean("edit-note");
        });

    } // fillPreferencesWindow(window) //

    editNote(calling_page, _index){
        this.log_message('notes', `NotesPreferences::editNote: _index == ${_index}`, new Error());
        this.page = this._EditNote;
        this._EditNote.set_index(_index);
        this._EditNote.refresh_page(calling_page);
        this._window.set_visible_page(this.page);
    } // editNote(calling_page, _index) //

    _close_request(_win){
        this._window.close();
        return false;
    } // _close_request(_win) //

    onPageChanged(){
        this.page_name         = this.enum2string[this._window._settings.get_enum("page")];
        this.edit_note         = this._window._settings.get_boolean('edit-note');
        if(this.edit_note){
            this.edit_note = false;
            this._window._settings.set_boolean('edit-note', false);
            switch(this.page_name){
                case("settings"):
                    this.page = this._pageNotesPreferencesSettings;
                    this._window.set_visible_page(this.page);
                    break;
                case("fileDisplay"):
                    this.page = this._fileDisplay;
                    this._window.set_visible_page(this.page);
                    break;
                case("notesIconsPage"):
                    this.page = this._notesIconsPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("notesScroller"):
                    this.page = this._NotesScroller;
                    this._window.set_visible_page(this.page);
                    break;
                case("editNote"):
                    this.page = this._EditNote;
                    this.editNote(null, this.index);
                    break;
                case("aboutPage"):
                    this.page = this.aboutPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("credits"):
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    break;
                default:
                    this.page = this._pageNotesPreferencesSettings;
                    this._window.set_visible_page(this.page);
            }  // switch(this.page_name) //
        } // if(this.edit_note) //
    }

    log_message(id, text, e){
        if(this._window._settings.get_boolean('show-logs')){
            console.log(`${id}:${text}: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
        }

    }

} // export default class NotesPreferences extends ExtensionPreferences //

