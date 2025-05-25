import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';
import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Constants from '../constants.js';

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

export class LogoMenuIconsWidget extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(settings) {
        super._init();
        this._settings = settings;
        this.set_title('Icon');
        this.set_name('Icon');
        this.set_icon_name('emblem-photos-symbolic');

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

        const customIconRow = new Adw.ExpanderRow({
            title: _('Use Custom Icon'),
            show_enable_switch: true,
            enable_expansion: this._settings.get_boolean('use-custom-icon'),
        });

        customIconRow.connect('notify::enable-expansion', () => {
            this._settings.set_boolean('use-custom-icon', customIconRow.enable_expansion);
        });

        this._settings.connect('changed::use-custom-icon', () => {
            customIconRow.set_enable_expansion(this._settings.get_boolean('use-custom-icon'))
        });

        const customIconSelectionRow = new Adw.ActionRow({
            title: _('Selected Icon'),
        });

        const customIconButton = new Gtk.Button({
            icon_name: 'document-open-monochrome',
            valign: Gtk.Align.CENTER,
        })

        const customIconPreview = new Gtk.Image({
            icon_name: "start-here-monochrome",
            icon_size: 2
        });

        if(this._settings.get_string('custom-icon-path'))
            customIconPreview.set_from_file(this._settings.get_string('custom-icon-path'));

        customIconButton.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "Images",
                });

                filter.add_pixbuf_formats();

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a Custom Icon'),
                    modal: true,
                    default_filter: filter
                });

                const file = await fileDialog.open(customIconButton.get_root(), null);
                if (file) {
                    const filename = file.get_path();
                    this._settings.set_string("custom-icon-path", filename);
                    customIconPreview.set_from_file(filename);
                    console.log(`Selected custom icon: ${filename}`);
                }
            } catch (error) {
                console.error('Error selecting custom icon:', error.message);
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

        this.add(monochromeIconGroup);
        this.add(colouredIconGroup);
        this.add(iconSettingsGroup);
    }
}
