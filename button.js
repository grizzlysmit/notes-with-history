// SPDX-FileCopyrightText: 2025 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */


// A Button class //
"use strict";

import St from 'gi://St';
import GObject from 'gi://GObject';
//import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import * as LogMessage from './log_message.js';


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
            LogMessage.log_message(LogMessage.get_prog_id(), `Button::Button::button-press-event:  event == ${event}`, new Error());
            this.add_style_pseudo_class('hover');
            return Clutter.EVENT_PROPAGATE;
        });

        this.connect('leave-event', (_actor, event) => {
            LogMessage.log_message(LogMessage.get_prog_id(), `Button::Button::button-press-event:  event == ${event}`, new Error());
            this.remove_style_pseudo_class('hover');
            return Clutter.EVENT_PROPAGATE;
        });

        this.connect('button-press-event', (_actor, event) => {
            LogMessage.log_message(LogMessage.get_prog_id(), `Button::Button::button-press-event:  event == ${event}`, new Error());
            LogMessage.log_message(LogMessage.get_prog_id(), `Button::Button::button-press-event:  this.#_toggle_mode == ${this.#_toggle_mode}`, new Error());
            if(!this.#_toggle_mode){
                this.add_style_pseudo_class('active');
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this.connect('button-release-event', (_actor, event) => {
            LogMessage.log_message(LogMessage.get_prog_id(), `Button::Button::button-release-event:  event == ${event}`, new Error());
            LogMessage.log_message(
                LogMessage.get_prog_id(),
                `Button::Button::button-release-event:  this.#_toggle_mode == ${this.#_toggle_mode}`, new Error()
            );
            LogMessage.log_message(
                LogMessage.get_prog_id(), `Button::Button::button-release-event:  this.#_checked == ${this.#_checked}`, new Error()
            );
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
