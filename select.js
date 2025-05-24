// SPDX-FileCopyrightText: 2025 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */


// A Select component for Dialogs in plugins //
"use strict";

//import Atk from 'gi://Atk';
import St from 'gi://St';
//import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import GObject from 'gi://GObject';
//import GLib from 'gi://GLib';
//import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as LogMessage from './log_message.js';
import * as Button from './button.js';


export class Dropdown extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass({
            GTypeName: 'GzzDropdown',
        }, this);
    }

    //#_rows   = null;
    #_owner  = null;

    constructor(owner_, params, _ancestor) {
        super({ styleClass: 'dropdown-dialog', });
        //super(_ancestor, 'dropdown-dialog');
        LogMessage.log_message('notes', `Dropdown::constructor: params == ${JSON.stringify(params)}`, new Error());
        this.#_owner  = owner_;
        this.set_x_expand(true);
        this.set_y_expand(true);
        this.set_x_align(Clutter.ActorAlign.FILL);
        this.set_y_align(Clutter.ActorAlign.FILL);

        if('x' in params && Number.isInteger(params.x)){
            this.set_x(params.x);
            this.backgroundStack.get_layout_manager().child_set_property(this, this._backgroundBin, 'x', params.x);
            LogMessage.log_message('notes', `Dropdown::constructor: params.x == ${params.x}`, new Error());
            LogMessage.log_message('notes', `Dropdown::constructor: this.get_x() == ${this.get_x()}`, new Error());
        }

        if('y' in params && Number.isInteger(params.y)){
            this.set_y(params.y);
            this.backgroundStack.get_layout_manager().child_set_property(this, this._backgroundBin, 'y', params.y);
            LogMessage.log_message('notes', `Dropdown::constructor: params.y == ${params.y}`, new Error());
            LogMessage.log_message('notes', `Dropdown::constructor: this.get_y() == ${this.get_y()}`, new Error());
        }

        if('rows' in params && Array.isArray(params.rows)){
            this.addRows(params.rows);
        }

        this.buttonLayout.get_layout_manager().set_orientation(Clutter.Orientation.VERTICAL);

    } // constructor(params) //

    addRow(row){
        if(typeof row == 'object' && row !== null
            && 'text' in row && (row.text instanceof String || typeof row.text === 'string')){
            const icon_name = (('icon_name' in row) ? row.icon_name : null);
            const default_ = (('isDefault' in row) ? !!row.isDefault : false);
            this.addButton({
                label: row.text,
                icon_name: (icon_name ? icon_name : 'dialog-ok'), 
                isDefault: default_,
                action: () => {
                    this.#_owner.close(row.text);
                }
            });
        }else if(typeof row == 'object' && row !== null
            && 'label' in row && (row.label instanceof String || typeof row.label === 'string')){
            this.addButton(row);
        }
    }

    addRows(rows){
        //this.#_rows.addRows(rows);
        LogMessage.log_message('notes', `Dropdown::constructor: rows == ${JSON.stringify(rows)}`, new Error());
        if(Array.isArray(rows)){
            let rows_ = [];
            for(const row of rows){
                if(typeof row == 'object' && row !== null
                    && 'text' in row && (row.text instanceof String || typeof row.text === 'string')){
                    const icon_name = (('icon_name' in row) ? row.icon_name : null);
                    rows_.push({
                        label: row.text,
                        icon_name: (icon_name ? icon_name : 'dialog-ok'), 
                        action: () => {
                            this.#_owner.close(row.text);
                        }
                    });
                }
            }
            rows_.push({
                label: 'empty select',
                icon_name: 'dialog-ok', 
                isDefault: true,
                action: () => {
                    this.#_owner.close(null);
                }
            });
            LogMessage.log_message('notes', `Dropdown::constructor: rows_ == ${JSON.stringify(rows_)}`, new Error());
            this.setButtons(rows_);
        }else{ // if(Array.isArray(rows)) ... //
            this.addRow(rows);
        }
    }
    
    rows(){
        return this.buttonLayout.get_children().map(elt => elt.get_label() );
    }
    
} // export class Dropdown extends ModalDialog.ModalDialog //

export class Select extends St.BoxLayout {
    static {
        GObject.registerClass({
            GTypeName: 'GzzSelect',
        }, this);
    }

    #_action    = (_row) => {};
    #edit_      = null;
    #button     = null;
    #read_only_ = false;
    #sym_closed = '▼';
    #sym_open   = '▲';
    #dropdown   = null;
    #_open      = false;
    #_rows      = [];
    #ancestor   = null;

    constructor(action_, params, ancestor_) {
        super({ 
            style_class: 'gzzselect select dropdown', 
            reactive:    true, 
            name:        'gzzbutton', 
            vertical:    false,
            x_align:     Clutter.ActorAlign.START,
            y_align:     Clutter.ActorAlign.START,
        });
        this.#ancestor = ancestor_;

        LogMessage.log_message('notes', `Select::Select::constructor: params == ${JSON.stringify(params)}`, new Error());

        this.#_action  = action_;

        if('read_only' in params){
            this.#read_only_ = !!params.read_only;
        }

        let hint_text_ = _('start typing text here.');

        if('hint_text' in params && (params.hint_text instanceof String || typeof params.hint_text === 'string')){
            hint_text_ = params.hint_text;
        }

        this.#edit_ = new St.Entry({
                style_class: 'gzzselect-edit', 
                reactive:    true, 
                x_expand:    true, 
                y_expand:    false, 
                text:        hint_text_, 
        });

        if('sym_closed' in params){
            this.#sym_closed = params.sym_closed;
        }

        if('sym_open' in params){
            this.#sym_open = params.sym_open;
        }

        this.#button = new Button.Button({
            label:        (this.#sym_closed ? this.#sym_closed : '▼'), 
            width:       40, 
        }); 

        if('value' in params){
            this.#edit_.set_text(params.value);
        }

        if('rows' in params && Array.isArray(params.rows)
            && params.rows.every(elt => {
                return typeof elt === 'object' && 'text' in elt && (elt.text instanceof String || typeof elt.text === 'string'); 
            })){
            this.#_rows = params.rows;
        }

        this.add_child(this.#edit_);
        this.add_child(this.#button);
        this.#edit_.connect('button-press-event', (_actor, event) => {
            LogMessage.log_message('notes', `Select::Select::button-press-event:  event == ${event}`, new Error());
            LogMessage.log_message('notes', `Select::Select::button-press-event:  this.#_open == ${this.#_open}`, new Error());
            if(!this.#_open){
                this.add_style_pseudo_class('active');
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this.#edit_.connect('button-release-event', (_actor, event) => {
            LogMessage.log_message('notes', `Select::Select::button-release-event:  event == ${event}`, new Error());
            LogMessage.log_message('notes', `Select::Select::button-release-event:  this.#_open == ${this.#_open}`, new Error());
            if(!this.#_open){
                this.open();
            }else{
                this.close(null);
            }
            return Clutter.EVENT_PROPAGATE;
        });

        this.#button.connect('clicked', (button, clicked_button, state) => {
            LogMessage.log_message('notes', `Select::Select::clicked:  button == ${button}`, new Error());
            LogMessage.log_message('notes', `Select::Select::clicked:  clicked_button == ${clicked_button}`, new Error());
            LogMessage.log_message('notes', `Select::Select::clicked:  state == ${state}`, new Error());
            LogMessage.log_message('notes', `Select::Select::clicked:  this.#_open == ${this.#_open}`, new Error());
            if(!this.#_open){
                this.open();
            }else{
                this.close(null);
            }
            return Clutter.EVENT_STOP;
        });

        this.#edit_.connect('key-release-event', (_actor, event) => {
            const symbol = event.get_key_symbol();
            /*
            let state  = event.get_state();
            state     &= ~Clutter.ModifierType.LOCK_MASK;
            state     &= ~Clutter.ModifierType.MOD2_MASK;
            state     &= Clutter.ModifierType.MODIFIER_MASK;
            // */
            if(symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter || symbol === Clutter.KEY_ISO_Enter){
                if(this.#_open){
                    const cur = this.search(this.#edit_.get_text(), this.#_rows);
                    this.close(cur[0]);
                }else{
                    this.open();
                }
                return Clutter.EVENT_STOP;
            }else if(symbol === Clutter.KEY_Escape){
                if(this.#_open){
                    this.close(null);
                    return Clutter.EVENT_STOP;
                }else{
                    return Clutter.EVENT_PROPAGATE;
                }
            }else{
                return Clutter.EVENT_PROPAGATE;
            }
        });

        this.#button.connect('key-release-event', (_actor, event) => {
            const symbol = event.get_key_symbol();
            /*
            let state  = event.get_state();
            state     &= ~Clutter.ModifierType.LOCK_MASK;
            state     &= ~Clutter.ModifierType.MOD2_MASK;
            state     &= Clutter.ModifierType.MODIFIER_MASK;
            // */
            if(symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter || symbol === Clutter.KEY_ISO_Enter){
                if(!this.#_open){
                    this.open();
                    return Clutter.EVENT_STOP;
                }
                return Clutter.EVENT_PROPAGATE;
            }else if(symbol === Clutter.KEY_Escape){
                if(this.#_open){
                    this.close(null);
                    return Clutter.EVENT_STOP;
                }else{
                    return Clutter.EVENT_PROPAGATE;
                }
            }else{
                return Clutter.EVENT_PROPAGATE;
            }
        });
    } // Select::constructor(params) //
    
    search(txt, rows){
        if(this.#read_only_){
            let array = rows.filter(elt => { return elt.includes(txt); });
            if(array.length == 0){
                return [ null ];
            }else{
                return array;
            }
        }else{
            let array = rows.filter(elt => { return elt === txt; });
            if(array.length == 0){
                return [ txt ];
            }else{
                return array;
            }
        }
    }
    
    open(){
        this.#_open = true;
        const params = {
            rows: this.#_rows,
            x:    this.get_x(), 
            y:    this.get_y() + this.get_height(), 
        };
        this.#dropdown = new Dropdown(
            this, 
            params,
            this.#ancestor);

        this.#button.set_label(this.#sym_open);
        this.#dropdown.open();
    }

    close(val){
        this.#button.set_label(this.#sym_closed);
        if(val){
            this.#edit_.set_text(val);
            this.#_action(val);
        }
        if(this.#dropdown) this.#dropdown.destroy();
        this.#_open = false;
    }

    get_value(){
        return this.#edit_.get_text();
    }

    set_value(val){
        this.#edit_.set_text(val);
    }

    get value(){
        return this.get_value();
    }

    set value(val){
        this.set_value(val);
    }

    get_sym_open(){
        return this.#sym_open;
    }

    set_sym_open(sym){
        this.#sym_open = sym;
    }

    get sym_open(){
        return this.get_sym_open();
    }

    set sym_open(sym){
        this.set_sym_open(sym);
    }

    get_sym_closed(){
        return this.#sym_closed;
    }

    set_sym_closed(sym){
        this.#sym_closed = sym;
    }

    get sym_closed(){
        return this.get_sym_closed();
    }

    set sym_closed(sym){
        this.set_sym_closed(sym);
    }

    addRow(row){
        if(row instanceof String || typeof row === 'string'){
            this.#_rows.push(row);
        }
    }

    addRows(rows){
        if(Array.isArray(rows) && rows.every(elt => { return elt instanceof String || typeof elt === 'string'; })){
            this.#_rows  = [...this.#_rows, ...rows];
        }
    }

} // export class Select extends St.BoxLayout //
