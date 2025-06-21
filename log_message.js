// SPDX-FileCopyrightText: 2025 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */


// A logging function that can be turned off //
"use strict";

let show_logs = false;

let progID = 'unknown-prog';

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

export function get_prog_id(){
    return progID;
}

export function set_prog_id(value){
    if(value instanceof String || typeof value === 'string'){
        progID = value;
    }
}
